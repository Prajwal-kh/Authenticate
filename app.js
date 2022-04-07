//jshint esversion:6
// require('dotnet').config();
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");  //using md5 hashing function
// const bCrypt = require("bcrypt")
// const saltRounds = 10;
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");

// we start implementing passport.js authentication by session package:
app.use(session({
    secret:"This is secret string.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());    //to handle the session using passport

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true})    // & run mongod cmd on new terminal
// mongoose.set("useCreateIndex",true); // No need to write this now deprecated from ES6 version

// Need to create mongoose.Schema to encrypt, instead of just an object:
const userSchema = new mongoose.Schema({
    Username: String,
    Password: String
});

// Encryption method we are using is Env variables:      (Note:- add encryption before creating model)
// userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields:["Password"]});

// To authenticate user on schema, use passport.js for authentication we need to plugin userSchema with passport-local-mongoose:
userSchema.plugin(passportLocalMongoose);   // To hash & salt our password & to save users into database

const User = new mongoose.model("User", userSchema);

// we createStrategy after we require & install passport packages, start & initialize session & plugin (order is imp)
passport.use(User.createStrategy());   //local login strategy using passport-local-mongoose

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get("/", function(req,res){
    res.render("home")
});

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/register",(req,res)=>{
    res.render("register")
})

// we need to create secrets routes as user is able to access them while they are logged in:
app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")  // if user close browser session cookie gets deleted & user go to the login route again
    }
})

app.post("/register", (req,res)=>{
   /* //bCrypt hashing method:   (we need to again delete DB with old username & password to store new Hashing authentication)
    bCrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // hash will contains hash code for user typed password:
        const newUser = new User({
            Username:req.body.username,
            // Password:md5(req.body.password)
            Password:hash
        });
        // Save will encrypt the file & find will decrypt it.
        newUser.save((err)=>{
            if(err){
                console.log(err);
            }else{
                res.render("secrets");
            }
        });
    }); */
    //refer passport.js docs & passport-local-mongoose npm package docs to write regiter method on Database & login code:
    User.register({username:req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            });
        }
    });
});

app.post("/login",(req,res)=>{
    /*const enteredName = req.body.username;
    const enteredPassword =req.body.password;   //earlier we cast it with md5 hashing function
    User.findOne({Username : enteredName},function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){   
                // compare user's entered password with database stored password:
                bCrypt.compare(enteredPassword, foundUser.Password, function(err, result) {
                    if(result===true){
                        res.render("secrets");
                    }
                });
            }
        }
    }) */
    const user = new User({
        Username : req.body.username,
        Password : req.body.password
    });
    // Refer passport.js -> Sessions docs
    req.login(user, function(err) {
        if (err) { 
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets")
        })
      }
    });
});
app.get("/logout", function(req,res){
    req.logout();
    res.redirect('/');
})

app.listen(3000,()=>{
    console.log('connected to 3000');
});
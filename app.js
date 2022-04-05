//jshint esversion:6
// require('dotnet').config();
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
    // To encrept user's password we saved in our database install mongoose-encryption first
// const encrypt = require("mongoose-encryption");
    // To encrypt using environment var, add it on very top of application to make more secure, also create a .env file in root dir of project:
    // create a .env file & .gitignore file with node template

const md5 = require("md5");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true})    // & run mongod cmd on new terminal

// Need to create mongoose.Schema to encrypt, instead of just an object:
const userSchema = new mongoose.Schema({
    Username: String,
    Password: String
});

    // Encryption method we are using is Env variables:      (Note:- add encryption before creating model)
// userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields:["Password"]});
    // Delete old database as we created encryption on it.

    // Encrytion method we are using now is Hashing passwords:  (require & install md5 package cast password in Register route & decrypt it in login route)


const User = new mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home")
});

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/register",(req,res)=>{
    res.render("register")
})

app.post("/register", (req,res)=>{
    const newUser = new User({
        Username:req.body.username,
        Password:md5(req.body.password)
    });
    // Save will encrypt the file & find will decrypt it.
    newUser.save((err)=>{
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
});

app.post("/login",(req,res)=>{
    const enteredName = req.body.username;
    const enteredPassword =md5(req.body.password);
    User.findOne({Username : enteredName},function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){   
                if(foundUser.Password===enteredPassword){
                    res.render("secrets");
                }
                
            }
        }
    })
});

app.listen(3000,()=>{
    console.log('connected to 3000');
})
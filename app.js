//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const md5 = require('md5');

const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/secrets", { useNewUrlParser: true,  useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


const User = mongoose.model("user",userSchema);

app.get("/", (req,res)=>{
    res.render("home");
});

// /login
app.route("/login")
.get((req,res)=>{
    res.render("login");
})
.post((req,res)=>{
User.findOne({email:req.body.username}, (err, data)=>{
    if(err){
        res.send(err);
    }else{
        if(data){
            if(data.password === md5(req.body.password)){
                console.log("login successful");
                res.render("secrets");
            }
        }
    }
})
});


// /register
app.route("/register")
.get( (req,res)=>{
    res.render("register");
})
.post((req,res)=>{
  const user = new User({
      email: req.body.username,
      password:md5(req.body.password)
  });
  user.save((err)=>{ 
      if(err){console.log(err);
    }else{
        console.log("user inserted");
        res.render("secrets");
    }
  });  
});



app.listen(300, ()=>{
    console.log("server has started at 300");
});
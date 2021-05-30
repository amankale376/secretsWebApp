//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const saltRounds = 10;
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
           
               bcrypt.compare(req.body.password, data.password ,(err,result)=>{
                   if(result === true){
                       res.render("secrets");
                   }
               });
                res.render("secrets");
            
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
    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
        const user = new User({
            email: req.body.username,
            password:hash
        });
        user.save((err)=>{ 
            if(err){console.log(err);
          }else{
              console.log("user inserted");
              res.render("secrets");
          }
        }); 
    });
});



app.listen(300, ()=>{
    console.log("server has started at 300");
});
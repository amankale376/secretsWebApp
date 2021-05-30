//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption')

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/secrets", { useNewUrlParser: true,  useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = "thisisoursecret";
userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});

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
            if(data.password === req.body.password){
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
      password:req.body.password
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
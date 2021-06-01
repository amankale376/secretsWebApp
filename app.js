//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// bellow packages are used for authentication and session creation
// Warning!!! use them in same order
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');



const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

// below we are setting session options
app.use(session({
    secret:'this is our secret',
    resave:false,
    saveUninitialized:false,
    cookie:{secure:false}  //turn this to false if not using https
}));

// to start and manage our sessions we use lines bellow
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secrets", { useNewUrlParser: true,  useUnifiedTopology: true });
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
//using passportLocalmongoose plugin to make hash and salting 
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy()); // to create local login stratergy
passport.serializeUser(User.serializeUser());  // creation of cookie than contains user information
passport.deserializeUser(User.deserializeUser());   //breaking cookie to retrieve info for login 

app.get("/", (req,res)=>{
    res.render("home");
});

// /login
app.route("/login")
.get((req,res)=>{
    res.render("login");
})
.post((req,res)=>{
const user = new User({  // we have to make new object for login method below
    username: req.body.username,
    password: req.body.password
});

req.login(user, (err)=>{   // checks the username and password and set authentication true
if(err){
console.log(err);
}else{
res.redirect("/secrets");
}
});
});


// /register
app.route("/register")
.get( (req,res)=>{
    res.render("register");
})
.post((req,res)=>{

    User.register({username:req.body.username}, req.body.password, (err,user)=>{  //save the object info in Db and makes hash and salt for password
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,()=>{ //checks if authentication is granted
                res.redirect("/secrets");
            });
        }
    });
});

//logout
app.get("/logout",(req, res)=>{
    req.logout();
    res.redirect("/");
});

//secrets page
app.route("/secrets")
.get((req,res)=>{

    if(req.isAuthenticated()){
        res.render("secrets");  
    }else{
        res.redirect("/login");
    }
});

app.listen(300, ()=>{
    console.log("server has started at 300");
});
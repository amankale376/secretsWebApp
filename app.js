//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// bellow packages are used for authentication and session creation
// Warning!!! use them in same order
const session = require('express-session');
const passport = require('passport'); //npm passport-local aswell but it doesnt need to require 
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate'); //to make the google find and create a document in monoogse we use this predefined package
const FacebookStrategy = require('passport-facebook').Strategy;


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
    password: String,
    googleId:String
});
//using passportLocalmongoose plugin to make hash and salting 
userSchema.plugin(passportLocalMongoose);

// using findOrCreate plugin
userSchema.plugin(findOrCreate);

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy()); // to create local login stratergy
// passport.serializeUser(User.serializeUser());  // creation of cookie than contains user information
// passport.deserializeUser(User.deserializeUser());   //breaking cookie to retrieve info for login 
 passport.serializeUser(function(user, done) {
     done(null, user.id);
   });
  
   passport.deserializeUser(function(id, done) {
     User.findById(id, function(err, user) {
       done(err, user);
     });
   });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:300/auth/google/secrets",
     userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo" //google+ is deprecated thats why we need this code
  },

  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id}, function (err, user) { 
        // you need to install "npm i mongoose-findorcreate" to make this code work
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:300/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
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

// /auth/google
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    console.log("scuccessfully logged in");
    res.redirect('/secrets');
  
  });

  //auth facebook
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.listen(300, ()=>{
    console.log("server has started at 300");
});
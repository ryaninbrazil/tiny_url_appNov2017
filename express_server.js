const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
//Middleware 

//Body Parse to receive input from forms
const bodyParser = require("body-parser");

//Cookie Sessions secured
var cookieSession = require('cookie-session')
//Encrypted Password 

const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['cookieSessionKey']
}))


//Global User Variable
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//Generate random string for original password, and short string for URL
function generateRandomString() {
  let password = "";
  let randomizer = "abcdefghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split('');
  var passLength = randomizer.length;
  if (!password) {
    password = ~~(Math.random() * passLength);
  }
  for (var i = 0; i < 5; i++) {
    password += randomizer[~~(Math.random() * passLength) ];
  }
  return password;
  };


//Global Variable for URL database
  var urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userId: "userRandomID"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userId: "user2RandomID"
  }
};

//Function to check for email in database for login
function userAlreadyExists(email) {
  for (let user_id in users) {
    if (users[user_id].email === email) {
      return true;
    }
  }
  return false;
};

//Function to find user for registration
function findUser(email) {
  for (let key in users) {
    let user = users[key];
    if (user.email === email) {
      return user;
    }
  }
  return false;
};


//Function to show URL is created by which user
function urlsForUser(id) {
  let userURLs = {};
  for (let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userId === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs
};



//Renders Hello on Homepage of Local Server

app.get ("/error", (req, res) => {
  res.redirect("/urls");
});


app.get("/", (req, res) => {
  res.redirect("/urls");
});

//URLS list page
app.get("/urls", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    return res.redirect("/login");
  }
  let shortURL = req.params.id;;
  let longURL = req.body["longURL"];
  let templateVars = {
    user: user,
    urls: urlsForUser(user.id),
  };  
   res.render("urls_index", templateVars);
});


//New URLS Page
app.get("/urls/new", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    return res.redirect("/login");
  }
  let templateVars = { 
    user: user 
  };
  res.render("urls_new", templateVars);
});


//URLS longURL
app.get("/urls/:id", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    return res.redirect("/login");
  }
  let shortURL = req.params.id;
  let templateVars = { user: user, 
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL].url};
  res.render("urls_show", templateVars);
});


//Short URL page
app.get("/u/:shortURL", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    return res.redirect("/login");
  }
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].url;
  res.redirect(longURL);
});

//Login Page
app.get("/login", (req, res) => { 
  res.render("login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//--------------------POST----------------------------------//

//URLs Page
app.post("/urls", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    return res.redirect("/login");
  }
  let shortURL = generateRandomString();
  let longURL = req.body["longURL"];
  if( longURL.indexOf("http://") < 0){
    longURL = "http://" + longURL;
  } 
  urlDatabase[shortURL] = {
    url: longURL,
    userId: user.id
  };
  if (!user) {
    res.redirect("/register");
  } else  {
    res.redirect("/urls/" + shortURL);  
  }
});


//Delete URL
app.post("/urls/:id/delete", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userId === user.id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else { 
    return res.redirect("/error");   
  }
});
//res.ridirect to error page that says cannot delete cause you're not a user

//Short URL ID page
app.post("/urls/:id", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  let longURL = req.body["longURL"];
  if( longURL.indexOf("http://") < 0){
    longURL = "http://" + longURL;
  } 
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userId === user.id) {
    urlDatabase[shortURL].url = longURL;
    res.redirect("/urls");
  } else {
    return res.status(403, "Not Valid User!");
  }
});


//Login Page to Set Cookies, Check for User in Database, and Matching HashedPassword
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPass = req.body.password;
  let user = findUser(userEmail);
  const hashedPassword = bcrypt.hashSync(userPass, 10);
  if (userEmail === "" || userPass === ""){
    res.statusCode = 400; 
    res.send("400 Please enter a valid email address and password.");
  } else if (!userAlreadyExists(userEmail)) {
      res.redirect("/register");  
  } else if (userAlreadyExists(userEmail)) {
    req.session.user_id = user.id;
  }
  res.redirect("/urls");
});


//Logut of session and delete cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


//Registration Page for Users
app.post("/register", (req, res) => {
  let userEmail = req.body.email;
  let userPass = req.body.password;
  let user_id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(userPass, 10);
  if (userEmail === "" || userPass === ""){
    res.statusCode = 400; 
    res.send("400 Please enter a valid email address and password.");
  } else if (userAlreadyExists(userEmail)) {
    res.statusCode = 400; 
    res.send("400 User already registered. Please create a new and unique user ID.");
  }  else {
    users[user_id] = {
      id: user_id, 
      email: userEmail, 
      password: hashedPassword
    };
    req.session.user_id = user_id;
  }
  res.redirect("/urls");
});


//Register Page 
app.get("/register", (req, res) => {
  res.render("registration");
});


// The listening portal where the server waits for input.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


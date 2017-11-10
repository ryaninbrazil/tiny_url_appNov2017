const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({extended: true}));
// app.use((req, res, next) => {
// res.locals.emails = (req.cookies.user_id) ? users[req.cookies.user_id].email : null;
// });
app.set("view engine", "ejs");
app.use(cookieParser())

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
}



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


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

function userAlreadyExists(email) {
  for (let user_id in users) {
    if (users[user_id].email === email) {
      return true;
    }
  }
  return false;
};

function findUser(email) {
  console.log('email', email);
  for (let key in users) {
    let user = users[key];
    if (user.email === email) {
      return user;
    }
  }

  return false;
};

app.get("/", (req, res) => {
  res.end("Hello!");
});


app.get("/urls", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {
    user: user,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = { 
    user: user 
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let shortURL = req.params.id;
  let templateVars = { user: user, shortURL: shortURL, longURL: urlDatabase[shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => { 
  res.render("login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let shortURL = generateRandomString();
  let longURL = req.body["longURL"];
  urlDatabase[shortURL] = longURL;
  if (!user) {
    res.redirect("/register");
  } else 
  res.redirect("/urls/" + shortURL);  
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;;
  let longURL = req.body["longURL"];
  urlDatabase[shortURL] = longURL; // writing
  res.redirect("/urls");  
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUser(email);
  
  if (!user) {
    res.redirect("/register");  
  } else {
    if (user.password === password)  {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    } else {
      res.sendStatus(403);
    }
  }
});  

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  let userEmail = req.body.email;
  let userPass = req.body.password;
  let user_id = generateRandomString()
  if (userEmail === "" || userPass === ""){
    res.statusCode = 400; 
    res.send("400 Please enter a valid email address and password.");
  } else if (userAlreadyExists(userEmail)) {
    res.statusCode = 400; 
    res.send("400 User already registered. Please create a new and unique user ID.");
  }  else {
    users[user_id] = {
      id: user_id, email: userEmail, password: userPass
    };
    res.cookie("user_id", user_id);
  }
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("registration");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
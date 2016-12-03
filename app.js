// Don't forget to the env variable FORTYTWO_CLIENT_ID and FORTYTWO_CLIENT_SECRET

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var passport = require('passport');
var FortyTwoStrategy = require('passport-42').Strategy;
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

// Configure the 42 strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the 42 API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new FortyTwoStrategy({
  clientID: process.env.FORTYTWO_CLIENT_ID,
  clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  callbackURL: 'http://127.0.0.1:3000/login/42/return'
},
function(accessToken, refreshToken, profile, cb) {
  // In this example, the user's 42 profile is supplied as the user
  // record.  In a production-quality application, the 42 profile should
  // be associated with a user record in the application's database, which
  // allows for account linking and authentication with other identity
  // providers.
  return cb(null, profile);
}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete 42 profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Create a new Express application.
var app = express();

// Configure view engine to render handlebars templates.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ resave: false, saveUninitialized: false, secret: '!terceS' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Routes

// Define routes.
app.get('/',
    function(req, res) {
      res.render('home', { user: req.user });
    });

app.get('/login',
    function(req, res){
      res.render('login');
    });

app.get('/login/42',
    passport.authenticate('42'));

app.get('/login/42/return',
    passport.authenticate('42', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

app.get('/profile',
    ensureLoggedIn(),
    function(req, res){
      res.render('profile', { user: req.user });
    });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

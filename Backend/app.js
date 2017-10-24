var express = require('express'); //Routes package
var mongoose = require('mongoose'); //Database communication
var bodyParser = require('body-parser');
var passport = require('passport'); //authentication
var cors = require('cors');
var config = require('config');
// var ejwt = require('express-jwt');


var app = express();

// Function to initiate the app/server into development- or production mode. (depends on NODE_ENV)
function initApp() {
    var dbConfig = config.get('Mongo.dbConfig'); //Get mongo database config
    console.log("Server running in "+app.get('env')+" mode.");
    mongoose.connect(dbConfig.host+":"+dbConfig.port); // Connect to development- or production database); 
}

initApp();

//mongoose.set('debug', true);
process.title = 'd7017e-backend';

app.use(bodyParser.json());
app.use(passport.initialize());
app.use(cors({origin: '*'}));

//defining routes
var api = express.Router();
require('./routes/API')(api);
require('./routes/test_routes')(api);
app.use('/api', api);

// require JWT validation
// app.use(ejwt({ secret: 'supersecret', credentialsRequired: true}).unless({path: ['/api/login/ltu']}));

//Route not found.
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//Error in server. Basically http error 500, internal server error.
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  //res.locals.message = err.message;
  //res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("HTTP error: " + err.status + ". " + err.message);
});


module.exports = app;

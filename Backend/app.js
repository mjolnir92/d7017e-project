'use strict';

var express = require('express'); //Routes package
var mongoose = require('mongoose'); //Database communication
mongoose.Promise = require('bluebird');
var bodyParser = require('body-parser');
var passport = require('passport'); //authentication
var cors = require('cors');
var config = require('config');
var logger = require('./logger'); //Use Logger

var app = express();

initApp();

//mongoose.set('debug', true);
process.title = 'd7017e-backend';
process.env.JWT_SECRET_KEY = 'supersecret';
process.env.JWT_AUTH_HEADER_PREFIX = 'bearer';


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(passport.initialize());
app.use(cors({origin: '*'}));

//defining routes
var auth = express.Router();
require('./routes/auth')(auth);
app.use('/auth', auth);

var users = express.Router();
require('./routes/api/users')(users);
app.use('/api/users', users);

var courses = express.Router();
require('./routes/api/courses')(courses);
app.use('/api/courses', courses);

var test_routes = express.Router();
require('./routes/test_routes')(test_routes);
app.use('/api/', test_routes);

//Route not found.
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//Error in server. Basically http error 500, internal server error.
app.use(function (err, req, res, next) {
    /*
    Needs fix. Logging of different levels. Make sure to return right HTTP and message to user.
    500 Internal server error should be sent for errors "inside the server". HTTP code + message for user faults?
    */
    logger.error(err);

    if (req.app.get('env') !== 'development') {
        delete err.stack;
    }

    var httpStatusCode = err.statusCode || 500;
    if (!err.errorCode) {
        err.message = "Internal server error.";
    }
    res.status(httpStatusCode).send("HTTP error: " + httpStatusCode + " " + err.message);
});

// Function to initiate the app/server into development- or production mode. (depends on NODE_ENV)
function initApp() {
    var dbConfig = config.get('Mongo.dbConfig'); //Get mongo database config
    console.log("Server running in " + app.get('env') + " mode.");
    mongoose.connect(dbConfig.host + ":" + dbConfig.port); // Connect to development- or production database);
}

module.exports = app;

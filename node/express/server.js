'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var directory = require('serve-index');
var morgan = require('morgan');
var config = require('../config/config');
var path = require('path');
var utilities = require('./utilities');
var fs = require('fs');

path.existsSync = fs.existsSync ? function(uri) {
    return fs.existsSync.call(fs, uri)
} : path.existsSync;

if (!path.existsSync(config.root)) {
    console.error('###########################################################');
    console.error(' >>> Fatal Error: ' + config.root + ' does not exist.\n You must set correct "root" in config/all.js and restart!');
    console.error('###########################################################');
    process.exit(1);
}

module.exports = function(dbconn) {
    // Initialize express app
    var app = express();

    // Get the connections
    app.dbconn = dbconn;

    // Initialize models
    utilities.walk(__dirname + '/../modules', /model\.js$/).forEach(function(modelPath) {
        require(path.resolve(modelPath))(dbconn);
    });

    // Setting the environment locals
    app.locals.title = config.app.title;
    app.locals.description = config.app.description;

    // Should be placed before express.static
    // 0: not compress
    app.use(compression({
        filter: function(req, res) {
            return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 0
    }));

    // Showing stack errors
    app.set('showStackError', true);

    // Set views path and view engine
    app.set('view engine', 'html');
    app.set('views', config.root + '/views');

    // Set listening port
    app.set('port', config.port || 3000);

    // Set listening ip
    app.set('ip', config.ip || '127.0.0.1');

    // Application Configuration for development environment
    var env = process.env.NODE_ENV || 'development';
    if (env == 'development') {
       // Enable logger 
        app.use(morgan('dev'));

        // Disable views cache
        app.set('view cache', false);
    }
    // Application Configuration for production environment
    if (env == 'production') {
        app.locals.cache = 'memory'; // To solve SWIG Cache Issues
    }

    // Request body parsing middleware should be above methodOverride
    app.use(bodyParser.urlencoded({
        extended: true,
        limit: '50mb'
    }));
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(methodOverride());

    // Enable jsonp
    app.enable('jsonp callback');

    // cookieParser should be above session
    app.use(cookieParser());

    // Load Routes
    utilities.walk(__dirname + '/../modules', /route\.js$/).forEach(function(routePath) {
        require(path.resolve(routePath))(app);
    });

    // Setting the app static folder and disable directory
    // app.use(directory(config.root));
    app.use(express.static(config.root));

    return app;
};
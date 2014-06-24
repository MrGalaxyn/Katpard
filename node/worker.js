process.on('uncaughtException', function(err) {
    console.error('Caught exception: ', err);
});

var config = require('./config/config');
var mongoose = require('mongoose');
var mysql = require('mysql');

module.exports = function() {
    /**
     * Main application entry file.
     * Please note that the order of loading is important.
     */
    // Bootstrap db connection
    var dbconn = {};
    for (var dbtype in config.db) {
        if (dbtype === 'mongo') {
            for (var name in config.db[dbtype]) {
                if (config.db[dbtype][name]) {
                    dbconn[name] = mongoose.createConnection(config.db[dbtype][name]);
                }
            }
        }
        if (dbtype === 'mysql') {
            for (var name in config.db[dbtype]) {
                if (config.db[dbtype][name]) {
                    dbconn[name] = mysql.createPool(config.db[dbtype][name]);
                }
            }
        }
    }
    
    // Init the express application
    var app = require('./express/server')(dbconn);

    // Start the app by listening on <port>
    // app.listen(app.get('port'), app.get('ip'));
    app.listen(app.get('port'));

    console.log('katpard worker server ' + process.pid + ' running on ' + app.get('port') + ' port...');
};
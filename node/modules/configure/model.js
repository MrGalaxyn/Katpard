'use strict';

/**
 * Module dependencies, mongoose schema of monitor url
 */
var mongoose = require('mongoose');

module.exports = function (dbconn) {
    var Schema = mongoose.Schema;
    var modelNames = dbconn.pagemonitor.modelNames();
    /**
     * url Schema
     */
    var urlSchema = new Schema({
        name: {type: String, default: '', required: true, trim: true},
        addr: {type: String, unique: true,required: true, trim: true},
        group: {type: String, trim: true},
        user: {type: String, trim: true},
        password: {type: String, trim: true},
        ua: {type: String, trim: true}
    });

    
    if (modelNames.indexOf('monitor_url') === -1) {
        dbconn.pagemonitor.model('monitor_url', urlSchema);
    }
};
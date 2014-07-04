'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');

module.exports = function (dbconn) {
    var Schema = mongoose.Schema;
    /**
     * url Schema
     */
    var urlSchema = new Schema({
        name: {
            type: String,
            default: '',
            required: true,
            trim: true
        },
        addr: {
            type: String,
            unique: true,
            required: true,
            trim: true
        },
        user: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            trim: true
        },
        ua: {
            type: String,
            trim: true
        }
    });

    dbconn.pagemonitor.model('monitor_url', urlSchema);
};
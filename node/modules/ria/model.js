'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');

module.exports = function (dbconn) {
    var Schema = mongoose.Schema;
    var models = dbconn.pagemonitor.modelNames();
    /**
     * monitor timing data
     */
    var data_schema = new Schema({
        timeToFirstCss: {type: Number, required: true},
        timeToFirstJs: {type: Number, required: true},
        timeToFirstResFirstByte: {type: Number,required: true},
        slowestResponse: {type: Number,required: true},
        httpTrafficCompleted: {type: Number,required: true},
        onDOMReadyTime: { type: Number,required: true},
        windowOnLoadTime: {type: Number, required: true},
        timeFrontendRate: {type: Number, required: true},
        timeTofirstScreenFinished: {type: Number, required: true},

        monitor_time: {type: Date, require: true},
        index: {type: String, required: true, trim: true}
    });
    // in case you defined this model somewhere else
    if (models.indexOf('ria_timming') === -1) {
        dbconn.pagemonitor.model('ria_timming', data_schema);
    }
    /**
     * others monitor data, dom, content and request
     */
    var data_schema = new Schema({
        cssCount: {type: Number, required: true},
        jsCount: {type: Number, required: true},
        imageCount: {type: Number, required: true},
        cssSize: {type: Number, required: true},
        jsSize: {type: Number, required: true},
        imageSize: {type: Number, required: true},
        consoleMessages: {type: Number, required: true},

        requests: {type: Number, required: true},
        ajaxRequests: {type: Number, required: true},
        notFound: {type: Number, required: true},
        medianRequestsPerDomain: {type: Number, required: true},
        maxRequestsPerDomain: {type: Number, required: true},

        DOMqueries: {type: Number, required: true},
        DOMqueriesById: {type: Number, required: true},
        DOMqueriesByClassName: {type: Number, required: true},
        DOMqueriesByTagName: {type: Number, required: true},
        DOMqueriesByQuerySelectorAll: {type: Number, required: true},
        DOMinserts: {type: Number, required: true},
        DOMqueriesDuplicated: {type: Number, required: true},
        DOMelementsCount: {type: Number, required: true},
        DOMelementMaxDepth: {type: Number, required: true},
        nodesWithInlineCSS: {type: Number, required: true},

        monitor_time: {type: Date, require: true},
        index: {type: String, required: true, trim: true}
    });
    // in case you defined this model somewhere else
    if (models.indexOf('ria_others') === -1) {
        dbconn.pagemonitor.model('ria_others', data_schema);
    }

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
            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            trim: true
        }
    });
    // in case you defined this model somewhere else
    if (models.indexOf('monitor_url') === -1) {
        dbconn.pagemonitor.model('monitor_url', urlSchema);
    }
};
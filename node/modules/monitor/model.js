'use strict';

/**
 * Module dependencies, for monitor use
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
        timeToFirstScreenFinished: {type: Number, required: true},
        timeToFirstPaintRequested: {type: Number, required: true},

        monitor_time: {type: Date, require: true},
        srcHost: {type: String, trim: true},
        index: {type: String, required: true, trim: true}
    });
    // in case you defined this model somewhere else
    if (models.indexOf('ria_timming') === -1) {
        dbconn.pagemonitor.model('ria_timming', data_schema);
    }
};


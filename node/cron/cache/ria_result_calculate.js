var cp = require('child_process');
var mongoose = require('mongoose');
var config = require(__dirname + '/../../config/config');
var newDate = require(__dirname + '/../../common/dateFormat');
var path = require('path');
var fs = require('fs');

var db = mongoose.createConnection(config.db.mongo.pagemonitor);
var url_schema = new mongoose.Schema({
    name: {type: String, default: '', required: true, trim: true},
    addr: {type: String, unique: true,required: true, trim: true},
    group: {type: String, trim: true},
    user: {type: String, trim: true},
    password: {type: String, trim: true},
    ua: {type: String, trim: true}
});
var URL = db.model('monitor_url', url_schema);
var data_schema = new mongoose.Schema({
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
    index: {type: String, required: true, trim: true}
});
var Timing = db.model('ria_timming', data_schema);

var cnt = process.argv[2] ? process.argv[2] : 7;
var monitor_time = new newDate();
var calcAverage = function(summary_data) {
    var tmp = {};
    var res = {};
    var length = summary_data.length;
    for (var i = 0; i < length; i++) {
        var index = summary_data[i].index
        if (!tmp[index]) {
            tmp[index] = {
                fbCnt: 0,
                timeToFirstResFirstByte: 0,
                fpCnt: 0,
                timeToFirstPaintRequested: 0,
                fsCnt: 0,
                timeToFirstScreenFinished: 0
            };
        }
        if (summary_data[i].timeToFirstResFirstByte && 
            summary_data[i].timeToFirstResFirstByte > 0 && 
            summary_data[i].timeToFirstResFirstByte < 20000) {
            tmp[index].timeToFirstResFirstByte += summary_data[i].timeToFirstResFirstByte;
            tmp[index].fbCnt++;
        }
        if (summary_data[i].timeToFirstPaintRequested && 
            summary_data[i].timeToFirstPaintRequested > 0 && 
            summary_data[i].timeToFirstPaintRequested < 20000) {
            tmp[index].timeToFirstPaintRequested += summary_data[i].timeToFirstPaintRequested;
            tmp[index].fpCnt++;
        }
        if (summary_data[i].timeToFirstScreenFinished && 
            summary_data[i].timeToFirstScreenFinished > 0 && 
            summary_data[i].timeToFirstScreenFinished < 20000) {
            tmp[index].timeToFirstScreenFinished += summary_data[i].timeToFirstScreenFinished;
            tmp[index].fsCnt++;
        }
    }
    for (var idx in tmp) {
        res[idx] = {
            timeToFirstResFirstByte: Number((tmp[idx].timeToFirstResFirstByte / tmp[idx].fbCnt).toFixed(2)),
            timeToFirstPaintRequested: Number((tmp[idx].timeToFirstPaintRequested / tmp[idx].fpCnt).toFixed(2)),
            timeToFirstScreenFinished: Number((tmp[idx].timeToFirstScreenFinished / tmp[idx].fsCnt).toFixed(2))
        }
    }
    return res;
};
// calculate the increasing rate
var compare = function(cur, last) {
    var max = -1;
    var index = '';
    for (var index in cur) {
        for (var type in cur[index]) {
            if (!last || !last[index] || !last[index][type]) {
                cur[index][type + 'r'] = '0';
                continue;
            }
            cur[index][type + 'r'] = ((cur[index][type] - last[index][type]) / last[index][type] * 100).toFixed(2);
        }
    }
    
    return cur;
};
var calcScore = function(data, map) {
    var fb = 0;
    var fs = 0;
    var score = 0;
    for (var index in data) {
        if (!map[index]) {
            continue;
        }
        fb = 300 / data[index].timeToFirstResFirstByte;
        fs = (map[index].ua ? 1500 : 2000) / data[index].timeToFirstScreenFinished;
        score = (fb > 3 ? 0.8 : fb) * 70 * 0.4 + (fs > 3 ? 0.8 : fs) * 70 * 0.6;
        score = score > 100 ? ((fb > 1 && fs > 1) ? 100 : 70) : score;
        data[index].score = parseInt(score);
    }

    return data;
};
var calcSummayResult = function(newData, oldData, map) {
    // if data is not ready;
    if (!newData || !oldData)
        return false;
    compare(newData, oldData);
    var result = [];
    for (var index in newData) {
        if (!map[index]) {
            continue;
        }
        result.push({
            name: map[index].name,
            url: map[index].addr,
            group: map[index].group,
            index: index,
            score: newData[index].score,
            scorer: newData[index].scorer,
            timeToFirstResFirstByte: newData[index].timeToFirstResFirstByte,
            timeToFirstResFirstByter: newData[index].timeToFirstResFirstByter,
            timeToFirstPaintRequested: newData[index].timeToFirstPaintRequested,
            timeToFirstPaintRequestedr: newData[index].timeToFirstPaintRequestedr,
            timeToFirstScreenFinished: newData[index].timeToFirstScreenFinished,
            timeToFirstScreenFinishedr: newData[index].timeToFirstScreenFinishedr
        });
    }
    var data = {
        time: monitor_time.format("yyyyMMdd"),
        result: result
    };

    fs.writeFileSync(path.join(__dirname, '../../../cache', cnt), JSON.stringify(data));
    db.close();
}

URL.find(function(error, uData) {
    if (error) {
        console.log('url');
        db.close();
        process.exit(1);
    }
    var map = {};
    for (var i in uData) {
        if (uData[i] && !uData[i].name && !uData[i].group)
            continue;
        map[uData[i]._id] = {
            addr: uData[i].addr,
            name: uData[i].name,
            group: uData[i].group,
            ua: uData[i].ua
        }
    }

    var time = monitor_time.getTime();
    var searchCur = {
        // srcHost: '115.47.23.111',
        monitor_time: {'$gt': time - 3600000 * 24 * cnt, '$lte': time}
    };
    var searchPast = {
        // srcHost: '115.47.23.111',
        monitor_time: {'$gt': time - 3600000 * 24 * cnt * 2, '$lte': time - 3600000 * 24 * cnt}
    };
    var fields = {
        index: 1,
        monitor_time: 1,
        timeToFirstResFirstByte: 1,
        timeToFirstScreenFinished: 1,
        timeToFirstPaintRequested: 1
    };
    var options = {
        lean: true,
        sort: {monitor_time: -1}
    };
    var bdError = false;
    var cur = false;
    var past = false;
    Timing.find(searchCur, fields, options, function(error, currentData) {
        if (error) {
            console.log('time');
            db.close();
            process.exit(1);
        }
        var tmp = calcAverage(currentData);
        cur = calcScore(tmp, map);
        calcSummayResult(cur, past, map);
    });
    Timing.find(searchPast, fields, options, function(error, pastData) {
        if (error) {
            console.log('time');
            db.close();
            process.exit(1);
        }
        var tmp = calcAverage(pastData);
        past = calcScore(tmp, map);
        calcSummayResult(cur, past, map);
    });
});

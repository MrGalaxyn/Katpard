var fs = require('fs');
var path = require('path');
var newDate = require(__dirname + '/../../common/dateFormat');

module.exports = function (app) {
    var Timing = app.dbconn.pagemonitor.model('ria_timming');
    var Other = app.dbconn.pagemonitor.model('ria_others');
    var URL = app.dbconn.pagemonitor.model('monitor_url');

    // process timing data
    function processTiming(data, type, interval) {
        if (!type) {
            return;
        }
        var tmp = new newDate(data[0].monitor_time.getTime()).format("yyyy-MM-dd hh:00:00");
        var standard = new newDate(tmp).getTime();
        var interval = interval || 3600000;
        tmp = [];
        var result = [];
        var last = 0;
        var delta = 0;

        var i = 0;
        var length = data.length;
        var lstandard = standard + 3600000;
        while (i < length) {
            // get one hour data, and then choose the median, but we have some 
            // fix, in case the data is not a normal data(because of the network),
            // our method is compare the delta value between this hour and last 
            // our, if this hour is less than 3 times of (last hour delta value) * 3,
            // we assume that is a normal data
            if (data[i].monitor_time >= standard && data[i].monitor_time <= lstandard) {
                if (data[i][type] && Number(data[i][type]) > 0) {
                    tmp.push(data[i][type]);
                }
                i++;
            } else if (tmp.length > 0) {
                lstandard = standard;
                standard = standard - 3600000;
                tmp.sort(function(a,b) {return a < b ? 1 : -1});
                var index = parseInt(tmp.length / 2);
                var min = 0;
                for (var j = index; j >= 0 ;j--) {
                    var tmpDelta = Math.abs(tmp[j] - last);
                    if (tmpDelta < (delta + 100) * 3 || delta == 0) {
                        delta = tmpDelta;
                        last = tmp[j];
                        min = last;
                        break;
                    }
                }
                if (min !== 0) {
                    result.push({
                        x: lstandard,
                        y: [min]
                    });
                }
                tmp.length = 0;
                i++
            } else {
                lstandard = standard;
                standard = standard - 3600000;
            }
        }
        if (tmp.length > 0) {
            var timestamp = standard;
            var index = parseInt(tmp.length / 2);
            var min = 0;
            for (var j = index; j >= 0 ;j--) {
                var tmpDelta = Math.abs(tmp[j] - last);
                if (tmpDelta < (delta + 100) * 3 || delta == 0) {
                    delta = tmpDelta;
                    last = tmp[j];
                    min = last;
                    break;
                } 
            }
            if (min !== 0) {
                result.push({
                    x: timestamp,
                    y: [min]
                });
            }
        }
        return result;
    }

    function processOther(data, type) {
        if (!type) {
            return;
        }

        var result = [];
        for (var i = 0; i < data.length; i++) {
            result.push({
                x: data[i].monitor_time.getTime(),
                y: [data[i][type]]
            });
        }

        return result;
    }

    function getMontiorData(req, res, spec) {
        var from = Number(req.query.from);
        var to = Number(req.query.to);
        var index = req.query.index;
        var type = req.query.type;
        if (!from || !to || !index || !type) {
            res.json({
                code : 100001,
                msg : 'arguments error',
                data: ''
            });
            return;
        }
        var search = {
            index: index,
            monitor_time: {
                '$gte': new Date(req.query.with_compare ? to - (to - from) : from),
                '$lte': new Date(to)
            }
        };
        var fields = type + ' monitor_time';
        var options = {
            lean: true,
            sort: {monitor_time: -1}
        };
        var model = spec === 'timing' ? Timing : Other;
        model.find(search, fields, options, function (error, mData) {
            if(error || mData.length <= 0) {
                res.json({
                    code : 100001,
                    msg : error || 'no data',
                    data: ''
                });
                return;
            } else {
                var data = spec === 'timing' ? processTiming(mData, type) : processOther(mData, type);
                if (!data) {
                    res.json({
                        code : 100001,
                        msg : 'no data',
                        data: ''
                    });
                    return;
                }

                var result = {};
                if (req.query.with_compare) {
                    result.data = [];
                    var length = parseInt(data.length / 2);
                    for (var i = 0; i < length; i++) {
                        result.data.push({
                            x: data[i].x,
                            y: [data[i].y, data[i + length].y]
                        });
                    }
                }
                else {
                    result.data = data;
                }

                res.json({
                    code : 100000,
                    msg : 'success',
                    data: result
                });
            }
        });
    };

    this.getTiming = function(req, res) {
        getMontiorData(req, res, 'timing');
    };
    this.getOther = function(req, res) {
        getMontiorData(req, res, 'other');
    };

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
                timeToFirstScreenFinished: newData[index].timeToFirstScreenFinished,
                timeToFirstScreenFinishedr: newData[index].timeToFirstScreenFinishedr,
                timeToFirstPaintRequested: newData[index].timeToFirstPaintRequested,
                timeToFirstPaintRequestedr: newData[index].timeToFirstPaintRequestedr
            });
        }
        return result;
    }
    // you can choose use average or median value
    this.getSummary = function(req, res) {
        var time = parseInt((req.query.time ? req.query.time : new Date().getTime()));
        var cnt = req.query.cnt ? req.query.cnt : 30;
        var group = req.query.group ? req.query.group.split(',') : '';

        URL.find(function(error, uData) {
            if (error) {
                    res.json({
                    code : 100001,
                    msg : error,
                    data: ''
                });
                return;
            }
            var map = {};
            for (var i in uData) {
                if (uData[i] && !uData[i].name)
                    continue;
                if (group && group.indexOf(uData[i].group) == -1) 
                    continue;
                map[uData[i]._id] = {
                    addr: uData[i].addr,
                    name: uData[i].name,
                    group: uData[i].group,
                    ua: uData[i].ua
                }
            }

            var cache = path.join(__dirname, '../../../cache', cnt);
            if (fs.existsSync(cache)) {
                var data = JSON.parse(fs.readFileSync(cache));
                if (data.result && new newDate().format("yyyyMMdd") == data.time) {
                    var length = data.result.length;
                    for (var i = 0; i < length; i++) {
                        if (!data.result[i] || !map[data.result[i].index]) {
                            data.result.splice(i, 1);
                        }
                    }
                    res.json({
                        code : 100000,
                        msg : '成功',
                        data: data.result
                    });
                    return;
                }
            }
            var searchCur = {
                // srcHost: '115.47.23.111',
                monitor_time: {'$gt': time - 3600000 * 24 * cnt, '$lte': time}
            };
            var searchPast = {
                // srcHost: '115.47.23.111',
                monitor_time: {'$gt': time - 3600000 * 24 * cnt * 2, '$lte': time - 3600000 * 24 * cnt}
            };
            if (req.query.host) {
                searchCur.srcHost = req.query.host;
                searchPast.srcHost = req.query.host;
            }
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
                if (bdError)
                    return;
                if(error) {
                    bdError = true;
                    res.json({
                        code : 100001,
                        msg : error,
                        data: ''
                    });
                    return;
                }
                var tmp = calcAverage(currentData);
                cur = calcScore(tmp, map);
                var result = calcSummayResult(cur, past, map);
                if (result) {
                    res.json({
                        code : 100000,
                        msg : '成功',
                        data: result
                    });
                }
            });
            Timing.find(searchPast, fields, options, function(error, pastData) {
                if (bdError)
                    return;
                if(error) {
                    bdError = true;
                    res.json({
                        code : 100001,
                        msg : error,
                        data: ''
                    });
                    return;
                }
                var tmp = calcAverage(pastData);
                past = calcScore(tmp, map);
                var result = calcSummayResult(cur, past, map);
                if (result) {
                    res.json({
                        code : 100000,
                        msg : '成功',
                        data: result
                    });
                }
            });
        });
    };

    // get the har, with jsonp
    // more details on http://www.softwareishard.com/har/viewer/
    this.getHar = function(req, res) {
        if (!req.query.time) {
            res.json({
                code : 100001,
                msg : '参数错误',
                data: ''
            });
            return;
        }
        var time = parseInt(req.query.time);
        var index = req.query.index;
        var filename = path.join(__dirname, '../../../har', new newDate(time).format('yyyy/MM/dd/hh/'), index);
        if (!fs.existsSync(filename)) {
            res.send(('onInputData()'));
            return;
        }
        var har = fs.readFileSync(filename);
        res.send(('onInputData(' + har + ')'));
    };
};



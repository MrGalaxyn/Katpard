var fs = require('fs');
var newDate = require(__dirname + '/../../common/dateFormat');

module.exports = function (app) {
    var Timing = app.dbconn.pagemonitor.model('ria_timming');
    var Other = app.dbconn.pagemonitor.model('ria_others');
    var URL = app.dbconn.pagemonitor.model('monitor_url');

    // process timing data
    function process_timing(data, type, interval) {
        if (!type) {
            return;
        }
        var tmp = new newDate(data[0].monitor_time.getTime()).format("yyyy-MM-dd hh:00:00");
        var standard = new newDate(tmp).getTime();
        var interval = interval || 3600000;
        tmp = [];
        var res = [];
        var last = 0;
        var delta = 0;

        for (var i = 0; i < data.length; i++) {
            // get one hour data, and then choose the median, but we have some 
            // fix, in case the data is not a normal data(because of the network),
            // our method is compare the delta value between this hour and last 
            // our, if this hour is less than 3 times of (last hour delta value) * 3,
            // we assume that is a normal data
            if (data[i].monitor_time >= standard) {
                if (data[i][type] && Number(data[i][type]) > 0) {
                    tmp.push(data[i][type]);
                }
            }
            else {
                if (tmp.length > 0) {
                    var timestamp = standard;
                    standard = timestamp - 3600000;

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
                        res.push({
                            x: timestamp,
                            y: [min]
                        });
                    }
                    tmp.length = 0;
                }
                if (data[i][type] && Number(data[i][type]) > 0) {
                    tmp.push(data[i][type]);
                }
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
                res.push({
                    x: timestamp,
                    y: [min]
                });
            }
        }
        return res;
    }

    function process_other(data, type) {
        if (!type) {
            return;
        }

        var res = [];
        for (var i = 0; i < data.length; i++) {
            res.push({
                x: data[i].monitor_time.getTime(),
                y: [data[i][type]]
            });
        }

        return res;
    }

    function get_montior_data(req, res, spec) {
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
        var options = {
            index: index,
            monitor_time: {
                '$gte': new Date(req.query.with_compare ? to - (to - from) : from),
                '$lte': new Date(to)
            }
        };
        var model = spec === 'timing' ? Timing : Other;
        var query  = model.where(options).select(type + ' monitor_time').sort("-monitor_time");
        query.find(function (error, mData) {
            if(error || mData.length <= 0) {
                res.json({
                    code : 100001,
                    msg : error || 'no data',
                    data: ''
                });
                return;
            } else {
                var data = spec === 'timing' ? process_timing(mData, type) : process_other(mData, type);
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
        get_montior_data(req, res, 'timing');
    };
    this.getOther = function(req, res) {
        get_montior_data(req, res, 'other');
    };

    var calcAverage = function(summary_data) {
        var tmp = {};
        var res = {};

        for (var i in summary_data) {
            if (!tmp[summary_data[i].index]) {
                tmp[summary_data[i].index] = [];
            }
            if ((summary_data[i].timeToFirstResFirstByte && (Number(summary_data[i].timeToFirstResFirstByte) < 0 || Number(summary_data[i].timeToFirstResFirstByte) > 200000)) ||
                (summary_data[i].onDOMReadyTime && (Number(summary_data[i].onDOMReadyTime) < 0 || Number(summary_data[i].onDOMReadyTime) > 200000)) ||
                (summary_data[i].windowOnLoadTime && (Number(summary_data[i].windowOnLoadTime) < 0 || Number(summary_data[i].windowOnLoadTime) > 200000)) ||
                (summary_data[i].timeTofirstScreenFinished && (Number(summary_data[i].timeTofirstScreenFinished) < 0 || Number(summary_data[i].timeTofirstScreenFinished) > 200000)) ||
                (summary_data[i].httpTrafficCompleted && (Number(summary_data[i].httpTrafficCompleted) < 0 || Number(summary_data[i].httpTrafficCompleted) > 200000))) {
                continue;
            }
            tmp[summary_data[i].index].push(summary_data[i]);
        }
        for (var index in tmp) {
            var timeToFirstResFirstByte = 0;
            var onDOMReadyTime = 0;
            var windowOnLoadTime = 0;
            var timeTofirstScreenFinished = 0;
            var httpTrafficCompleted = 0;
            
            var i = 0;
            var fixFs = 0;
            for (; i < tmp[index].length; i++) {
                timeToFirstResFirstByte += Number(tmp[index][i].timeToFirstResFirstByte);
                onDOMReadyTime += Number(tmp[index][i].onDOMReadyTime);
                windowOnLoadTime += Number(tmp[index][i].windowOnLoadTime);
                httpTrafficCompleted += Number(tmp[index][i].httpTrafficCompleted);

                if (tmp[index][i].timeTofirstScreenFinished) {
                    timeTofirstScreenFinished += Number(tmp[index][i].timeTofirstScreenFinished);
                    fixFs++;
                }
            }

            res[index] = {
                timeToFirstResFirstByte: (timeToFirstResFirstByte / i).toFixed(2),
                onDOMReadyTime: (onDOMReadyTime / i).toFixed(2),
                windowOnLoadTime: (windowOnLoadTime / i).toFixed(2),
                timeTofirstScreenFinished: fixFs != 0 ? (timeTofirstScreenFinished / fixFs).toFixed(2) : 0,
                httpTrafficCompleted: (httpTrafficCompleted / i).toFixed(2)
            }
        }
        return res;
    };
    var calcMedian = function(summary_data) {
        var tmp = {};
        var res = {};

        for (var i in summary_data) {
            if (!tmp[summary_data[i].index]) {
                tmp[summary_data[i].index] = [];
            }
            if ((summary_data[i].timeToFirstResFirstByte && (Number(summary_data[i].timeToFirstResFirstByte) < 0 || Number(summary_data[i].timeToFirstResFirstByte) > 200000)) ||
                (summary_data[i].onDOMReadyTime && (Number(summary_data[i].onDOMReadyTime) < 0 || Number(summary_data[i].onDOMReadyTime) > 200000)) ||
                (summary_data[i].windowOnLoadTime && (Number(summary_data[i].windowOnLoadTime) < 0 || Number(summary_data[i].windowOnLoadTime) > 200000)) ||
                (summary_data[i].timeTofirstScreenFinished && (Number(summary_data[i].timeTofirstScreenFinished) < 0 || Number(summary_data[i].timeTofirstScreenFinished) > 200000)) ||
                (summary_data[i].httpTrafficCompleted && (Number(summary_data[i].httpTrafficCompleted) < 0 || Number(summary_data[i].httpTrafficCompleted) > 200000))) {
                continue;
            }
            tmp[summary_data[i].index].push(summary_data[i]);
        }
        for (var index in tmp) {
            var timeToFirstResFirstByte = 0;
            var onDOMReadyTime = 0;
            var windowOnLoadTime = 0;
            var timeTofirstScreenFinished = 0;
            var httpTrafficCompleted = 0;
            
            var cnt = parseInt(tmp[index].length / 2);
            for (i = 0; i <= cnt; i++) {
                var min = 10000000;
                var midx = -1;
                for (var j = 0; j < tmp[index].length; j++) {
                    if (min > Number(tmp[index][j].httpTrafficCompleted)) {
                        min = tmp[index][j].httpTrafficCompleted;
                        midx = j;
                    }
                }
                if (i < cnt) {
                    tmp[index].splice(midx, 1);
                }
            }

            res[index] = {
                timeToFirstResFirstByte: tmp[index][midx].timeToFirstResFirstByte === 10000000 ? 0 : tmp[index][midx].timeToFirstResFirstByte,
                timeTofirstScreenFinished: tmp[index][midx].timeTofirstScreenFinished === 10000000 ? 0 : tmp[index][midx].timeTofirstScreenFinished,
                onDOMReadyTime: tmp[index][midx].onDOMReadyTime === 10000000 ? 0 : tmp[index][midx].onDOMReadyTime,
                windowOnLoadTime: tmp[index][midx].windowOnLoadTime === 10000000 ? 0 : tmp[index][midx].windowOnLoadTime,
                httpTrafficCompleted: tmp[index][midx].httpTrafficCompleted === 10000000 ? 0 : tmp[index][midx].httpTrafficCompleted
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
    // you can choose use average or median value
    this.getSummary = function(req, res) {
        var time = parseInt((req.query.time ? req.query.time : new Date().getTime()));
        var cnt = req.query.cnt ? req.query.cnt : 30;
        var type = req.query.type ? req.query.type : 'average';
        var query = Timing.where({
            monitor_time: {'$gte': time - 3600000 * 24 * cnt * 2, '$lte': time}
        }).sort('-start_time');

        query.find(function(error, eData) {
            if(error) {
                res.json({
                    code : 100001,
                    msg : error,
                    data: ''
                });
                return;
            }
            var current = [];
            var tmp = null;
            while(tmp = eData.shift()) {
                if (tmp.monitor_time.getTime() <= time - 3600000 * 24 * cnt){
                    break;
                }
                current.push(tmp);
            }
            var handler = type === 'median' ? calcMedian : calcAverage;
            var cur = handler(current);
            var last = handler(eData);
            compare(cur, last);

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
                    if (uData[i] && !uData[i].name) {
                        continue;
                    }
                    map[uData[i]._id] = {
                        addr: uData[i].addr,
                        name: uData[i].name
                    }
                }
                var result = [];
                for (var index in cur) {
                    if (!map[index]) {
                        continue;
                    }
                    result.push({
                        name: map[index].name,
                        url: map[index].addr,
                        timeToFirstResFirstByte: cur[index].timeToFirstResFirstByte,
                        timeToFirstResFirstByter: cur[index].timeToFirstResFirstByter,
                        onDOMReadyTime: cur[index].onDOMReadyTime,
                        onDOMReadyTimer: cur[index].onDOMReadyTimer,
                        windowOnLoadTime: cur[index].windowOnLoadTime,
                        windowOnLoadTimer: cur[index].windowOnLoadTimer,
                        timeTofirstScreenFinished: cur[index].timeTofirstScreenFinished,
                        timeTofirstScreenFinishedr: cur[index].timeTofirstScreenFinishedr,
                        httpTrafficCompleted: cur[index].httpTrafficCompleted,
                        httpTrafficCompletedr: cur[index].httpTrafficCompletedr
                    });
                }
                res.json({
                    code : 100000,
                    msg : '成功',
                    data: result
                });
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
        var filename = '/data1/pageMonitor/har/' + new newDate(time).format('yyyy/MM/dd/hh/') + index;
        var har = fs.readFileSync(filename);
        res.send(('onInputData(' + har + ')'));
    };
};
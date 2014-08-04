var config = require(__dirname + '/../../config/config');
var newDate = require(__dirname + '/../../common/dateFormat');
var smtp = require("./smtp");
var fs = require('fs');
var spawn = require('child_process').spawn;

/*********************connect db**********************************/
var mongoose = require('mongoose');
var page_db = mongoose.createConnection(config.db.mongo.pagemonitor);
var Schema = mongoose.Schema;
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
var ria_timing = page_db.model('ria_timming', data_schema);

var url_schema = new Schema({
    name: {type: String, default: '', required: true, trim: true},
    addr: {type: String, unique: true, required: true, trim: true},
    group: {type: String, trim: true},
    user: {type: String, trim: true},
    password: {type: String, trim: true},
    ua: {type: String, trim: true}
});
var Url = page_db.model('monitor_url', url_schema);
/*********************connect db end*******************************/


/*************************global vars******************************/
if (process.argv.length < 5) {
    console.log('usage: node custom_report.js <group> <month> <addrs>')
    process.exit(1);
}
var REPORT_GROUP = JSON.parse(process.argv[2]);
var REPORT_MONTH = Number(process.argv[3]);
var REPORT_EMAIL_ADDRS = JSON.parse(process.argv[4]);

var MAP = {};
var proc_cnt = 0;
var res_data = [{}, {}];
var report_from = 0;
var report_to = 0;
/*********************global vars end******************************/


/************************data service******************************/
function process_monitor_data(from, to, urls, cur_flag) {
    var options = {
        monitor_time: {
            '$gte': from,
            '$lte': to
        },
        index: {
            '$in': urls
        }
    };
    var query  = ria_timing.where(options).select('timeToFirstResFirstByte httpTrafficCompleted timeTofirstScreenFinished index monitor_time').sort("-monitor_time").lean();
    query.find(function (error, mData) {
        if(error) {
            console.log(error);
            return;
        } else {
            if (mData.length == 0) {
                proc_cnt++;
                return;
            }
            var data = cur_flag ? res_data[0] : res_data[1];
            data.timeTofirstScreenFinished = process_timing(mData, 'timeTofirstScreenFinished');
            data.httpTrafficCompleted = process_timing(mData, 'httpTrafficCompleted');
            data.timeToFirstResFirstByte = process_timing(mData, 'timeToFirstResFirstByte');
            proc_cnt++;
            if (proc_cnt == 2) {
                make_html_table(res_data);
                page_db.close();
            }
        }
    });
}

function process_timing(data, type, interval) {
    var tmp = new newDate(data[0].monitor_time.getTime()).format("yyyy-MM-dd 00:00:00");
    var standard = new newDate(tmp).getTime();
    var interval = interval || 3600000 * 24;
    tmp = [];
    var res = {};
    var last = 0;
    var delta = 0;
    var i = 0;
    var length = data.length;
    var lstandard = standard + interval;
    while (i < length) {
        if (data[i].monitor_time >= standard && data[i].monitor_time <= lstandard) {
            if (data[i][type] && Number(data[i][type]) > 0) {
                if (!tmp[data[i].index]) {
                    tmp[data[i].index] = [];
                }
                tmp[data[i].index].push(data[i][type]);
            }
            i++;
        } else {
            for (var index in tmp) {
                if (tmp[index].length > 0) {
                    var median = parseInt(tmp.length / 2);
                    if (!res[index])  {
                        res[index] = {};
                    }
                    res[index][standard] = tmp[index][median];
                    tmp[index].length = 0;
                }
            }
            lstandard = standard;
            standard = standard - interval;
        }
    }
    for (var index in tmp) {
        if (tmp[index].length > 0) {
            var median = parseInt(tmp.length / 2);
            if (!res[index])  {
                res[index] = {};
            }
            res[index][standard] = tmp[index][median];
        }
    }
    return res;
}

function compute_avg(data) {
    var avg = {};
    for (var type in data) {
        for (var index in data[type]) {
            var cnt = 0;
            for (var time in data[type][index]) {
                if (!avg[index]) {
                    avg[index] = {};
                }
                if (!avg[index][type]) {
                    avg[index][type] = 0;
                }
                avg[index][type] += data[type][index][time];
                cnt++;
            }
            avg[index][type] = parseInt(avg[index][type] / cnt);
        }
    }
    return avg;
}

function compare_data(data) {
    var old_avg = compute_avg(data[1]);
    var new_avg = compute_avg(data[0]);
    var rate = {}
    for (var index in new_avg) {
        if (!rate[index]) {
            rate[index] = {};
        }
        if (!old_avg[index]) {
            old_avg[index] = 0;
        }
        for (var type in new_avg[index]) {
            if (!old_avg[index] || !old_avg[index][type]) {
                rate[index][type] = "0%";
                continue;
            }
            rate[index][type] = (((Number(new_avg[index][type]) - Number(old_avg[index][type])) * 100) / old_avg[index][type]).toFixed(2) + '%';
        }
    }

    return [new_avg, rate];
}

function make_html_table(data) {
    var res = compare_data(data);
    var html = create_summary_table(res[0], res[1]);
    send(REPORT_EMAIL_ADDRS, html);
}

function get_url_group() {
    Url.find().exec(function(err, urls) {
        if (err) {
            console.log('find url error');
            db.close();
        } else {
            var report_url = [];
            if (urls.length === 0) {
                console.log('find url error');
                db.close();
            }
            for(var i in urls) {
                if (REPORT_GROUP.indexOf(urls[i].group) === -1) {
                    continue;
                }
                report_url.push(urls[i]._id);
                MAP[urls[i]._id] = {
                    group: urls[i].group,
                    name: urls[i].name
                };
            }
            var d = new Date();
            d.setMonth(REPORT_MONTH - 1, 1);
            d.setHours(0, 0, 0, 0);
            var from = new Date(d.getTime());
            report_from = new newDate(d.getTime());
            var prev_to = new Date(d.getTime() - 1);
            d.setMonth(REPORT_MONTH, 1);
            d.setHours(0, 0, 0, 0);
            var to = new Date(d.getTime() - 1);
            report_to = new newDate(d.getTime() - 1);
            process_monitor_data(from, to, report_url, true);

            d.setMonth(REPORT_MONTH - 2, 1);
            d.setHours(0, 0, 0, 0);
            var prev_from = new Date(d.getTime());
            process_monitor_data(prev_from, prev_to, report_url);
        }
    });
}
/*********************data service end*****************************/

/***************************html pack******************************/
var creat_row = function(index, cur, comp) {
    var body = '<tr><td colspan="2">' + MAP[index].name + '</td>';
    body += '<td>' + cur.timeToFirstResFirstByte + '</td><td';
    body += parseFloat(comp.timeToFirstResFirstByte) > 0 ?  ' style="color:red">' : ' style="color:green">';
    body += comp.timeToFirstResFirstByte + '</td>';
    body += '<td>' + cur.timeTofirstScreenFinished + '</td><td';
    body += parseFloat(comp.timeTofirstScreenFinished) > 0 ?  ' style="color:red">' : ' style="color:green">';
    body += comp.timeTofirstScreenFinished + '</td>';
    body += '<td>' + cur.httpTrafficCompleted + '</td><td';
    body += parseFloat(comp.httpTrafficCompleted) > 0 ?  ' style="color:red">' : ' style="color:green">';
    body += comp.httpTrafficCompleted + '</td></tr>';

    return body;
}

/* @current_res 本月平均数据
 * @compare_res 本月增长率
 */
var create_summary_table = function(current_res, compare_res) {
    var html = '<h1>关键数据<h1>' +
            '<table border="1px" bordercolor="#000000" cellspacing="0px" style="border-collapse:collapse;' +
            'font-family:\"Ubuntu\", Helvetica, Arial, sans-serif"><thead><tr>' + 
            '<th colspan="2" rowspan="2">页面</th>' +
            '<th colspan="2">首包时间</th><th colspan="2">首屏时间</th>' +
            '<th colspan="2">总下载时间</th></tr><tr><th>本期(ms)</th>' +
            '<th>环比(%)</th><th>本期(ms)</th><th>环比(%)</th>' +
            '<th>本期(ms)</th><th>环比(%)</th></tr></thead><tbody>';

    for (var i in REPORT_GROUP) {
        for (var index in current_res) {
            if (MAP[index].group !== REPORT_GROUP[i]) {
                continue;
            }
            html += creat_row(index, current_res[index], compare_res[index]);
        }
    }
    html += '</tbody></table>';

    return html;
}
/***************************html pack******************************/

/***************************send email*****************************/
function send(addrs, html, attachments, cb) {
    var opt = {
        addrs: addrs, // list of receivers
        subject: '[运营数据]页面性能报告(' + report_from.format("yyyy年M月d日") + ' -- ' + report_to.format("yyyy年M月d日") +')', // Subject line
        html: html, // html body
        attachments: attachments,
        succ: cb
    }
    smtp.sendmail(opt);
}
/************************send email end***************************/

/*************************MAIN************************************/

(function main() {
    get_url_group();
})();
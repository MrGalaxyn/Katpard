var cp = require('child_process');
var mongoose = require('mongoose');
var config = require(__dirname + '/../../config/config');
var newDate = require(__dirname + '/../../common/dateFormat');
var path = require('path');
var fs = require('fs');
var db = null;
var Url = null;
var ria_timming = null;
var ria_others = null;
var har_prefix = "";

var connect_database = function() {
    db = mongoose.createConnection(config.db.mongo.pagemonitor);
    var data_schema = new mongoose.Schema({
        name: {type: String, default: '', required: true, trim: true},
        addr: {type: String, unique: true, required: true, trim: true},
        user: {type: String, trim: true},
        password: {type: String, trim: true},
        ua: {type: String, trim: true}
    });
    Url = db.model('monitor_url', data_schema);
    data_schema = new mongoose.Schema({
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
    ria_timming = db.model('ria_timming', data_schema);
    data_schema = new mongoose.Schema({
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
    ria_others = db.model('ria_others', data_schema);
    return true;
}
    
var url_map = [];

var type = process.argv[2];
var monitor_time = new newDate(new Date().setSeconds(0, 0));
/********************** get ria monitor data **********************/
function get_monitor_data(type) {
    var moni_args = [];
    var results = [];
    var timer = false;
    
    var get_data = function(args) {
        // get the monitor data one by one, we have some problems when parallel request
        // my english is not that good, sorry^_^
        var arg = args.shift();
        if (!arg) {
            store_func(results, type);
            return;
        }
        
        var monitor_process = cp.spawn(config.casperjs, arg);

        // in case the process is not exited
        clearTimeout(timer);
        timer = setTimeout(function() {
            monitor_process.kill('SIGINT');
            get_data(args);
        }, 60000);
        
        monitor_process.stdout.on('data', function(data) {
            var output = data.toString();
            if (/error/.test(output)) {
                console.log("error: ", output);
                // if login fail, we assume the account is error,
                // so skip the page of this user accout
                if (/automation_login\.js$/.test(arg[0])) {
                    var length = args.length;
                    for (var i = 0; i < length; i++) {
                        if (!/automation_monitor_with_cookies\.js$/.test(args[i][0])) {
                            break;
                        }
                    }
                    if (i > 0 && i < length) args.splice(0, i);
                }
            }
            if (arg.length == 3) return;
            var tmp = JSON.parse(data);
            tmp = tmp.metrics;
            var file = arg[arg.length - 1];
            if (type === 'time') {
                tmp.timeFrontendRate = tmp.timeFrontend;
                delete tmp.timeFrontend;
                delete tmp.timeBackend;
            }

            var pos = file.lastIndexOf("/") > file.lastIndexOf("\\") ? file.lastIndexOf("/") : file.lastIndexOf("\\");
            tmp.index = file.substring(pos + 1);
            url_map.push(tmp.index);
            tmp.monitor_time = monitor_time;
            results.push(tmp);
        });
            
        monitor_process.on('exit', function() {
            clearTimeout(timer);
            get_data(args);
        });
    };

    // your have to config your monitor address first
    connect_database();
    Url.find().exec(function(err, urls) {
        if (err) {
            console.log('find url error');
            db.close();
        } else {
            var args = {};
            var args_no_login = {};
            if (urls.length === 0) {
                return;
            }
            for(var i in urls) {
                if (urls[i].user) {
                    if (!args[urls[i].user]) {
                        args[urls[i].user] = {
                            pw: urls[i].password,
                            data: []
                        }
                    }
                    args[urls[i].user]['data'].push(urls[i]);
                }
                else {
                    args_no_login[urls[i].addr] = urls[i].ua ? (urls[i]._id + ';;;' + urls[i].ua) : (urls[i]._id + '');
                }
            }
            var prefix = path.join(__dirname, '../../../automation/modules');
            for (var usr in args) {
                moni_args.push([
                    prefix + '/automation_login.js',
                    usr, args[usr].pw
                ]);
                for (var i in args[usr]['data']) {
                    var fileDir = path.join(har_prefix, monitor_time.format("yyyy/MM/dd/hh/mm/"));
                    var arg = [
                        prefix + '/automation_monitor_with_cookies.js',
                        args[usr]['data'][i].addr,
                        type, usr, fileDir + args[usr]['data'][i]._id
                    ];
                    if (args[usr]['data'][i].ua) {
                        arg.push(args[usr]['data'][i].ua);
                    }
                    moni_args.push(arg);
                }
            }
            for (var addr in args_no_login) {
                var tmp = args_no_login[addr].split(';;;');
                var fileDir = path.join(har_prefix, monitor_time.format("yyyy/MM/dd/hh/mm/"));
                var arg = [
                    prefix + '/automation_monitor_without_cookies.js',
                    addr, type, fileDir + tmp[0]
                ];
                if (tmp[1]) {
                    arg.push(tmp[1]);
                }
                moni_args.push(arg);
            }
            
            get_data(moni_args);
        }
    });
}
/******************** get ria monitor data end ********************/

var store_func = function(results, type) {
    var min_cnt = 0;
    var model = type === 'time' ? ria_timming : ria_others;
    for(var i in results) {
        model.create(results[i], function(error) {
            min_cnt++;
            if(error) {
                console.log("store error: ", error);
                db.close();
            }

            if (min_cnt == results.length) {
                check_har();
            }
        });
    }
}

// 处理前一小时的har文件,目前办法是使用中位数那个点的har文件,其他都删除
// use the har file of the node with median value of that hour, delete others
var check_har = function() {
    var cur = new newDate(new Date().setMinutes(0, 0, 0));
    var prev = new newDate(cur.getTime() - 3600000);
    var lastDir = path.join(har_prefix, prev.format("yyyy/MM/dd/hh/"));

    if (!fs.existsSync(lastDir)) {
        db.close();
        return;
    }

    var hars_arr = [];
    for (var i in url_map) {
        if (fs.existsSync(lastDir + url_map[i])) {
            continue;
        }
        hars_arr.push(url_map[i]);
    }
    if (hars_arr.length > 0) {
        process_har(hars_arr, cur, prev);
    }
    else {
        db.close();
    }
    
    return;
};

var calcMedian = function(summary_data, index_map) {
    var tmp = {};
    var res = {};

    for (var i in summary_data) {
        if (index_map.indexOf(summary_data[i].index) === -1) {
            continue;
        }
        if (!tmp[summary_data[i].index]) {
            tmp[summary_data[i].index] = [];
        }
        tmp[summary_data[i].index].push(summary_data[i]);
    }

    for (var index in tmp) {
        var httpTrafficCompleted = 0;
        var median = parseInt(tmp[index].length / 2);
        
        for (var i = 0; i <= median; i++) {
            var min = 1000000;
            var midx = -1;
            var median_time = null;
            for (var j = 0; j < tmp[index].length; j++) {
                if (min > tmp[index][j].httpTrafficCompleted) {
                    min = tmp[index][j].httpTrafficCompleted;
                    midx = j;
                    median_time = tmp[index][j].monitor_time;
                }
            }
            tmp[index].splice(midx, 1);
        }

        res[index] = median_time;
    }
    return res;
};

var process_har = function(hars_arr, cur, prev) {
    var query = ria_timming.where({
        monitor_time: {'$gte': prev, '$lt': cur}
    }).select('httpTrafficCompleted monitor_time index');
    query.find(function(error, sData) {
        var median_map = calcMedian(sData, hars_arr);
        for (var index in median_map) {
            if (!median_map[index]) continue;
            var oldPath = path.join(har_prefix, new newDate(median_map[index].getTime()).format("yyyy/MM/dd/hh/mm/"), index);
            var newPath = path.join(har_prefix, prev.format("yyyy/MM/dd/hh/"));
            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath + index);
            }
            
            files = fs.readdirSync(newPath);
            files.forEach(function(file){
                var curPath = newPath + "/" + file;
                if(fs.statSync(curPath).isDirectory()) { // recurse
                    if (fs.existsSync(curPath + "/" + index)) {
                        fs.unlinkSync(curPath + "/" + index);
                    }
                    if (fs.readdirSync(curPath).length === 0) {
                        fs.rmdirSync(curPath);
                    }
                }
            });
        }
        db.close();
    });
};

// get the machine IP
var get_machine_ip = function() {
    var cmd = "ifconfig | awk '/eth/{print \$0}' | wc -l";
    cp.exec(cmd, function(err, stdout, stderr) {
        if (err || Number(stdout) <= 0) {
            console.log("error: can not get the IP!!");
            process.exit(1);
        }
        cmd = "ifconfig | grep -A1 eth{$cnt} | awk '/.*inet/{print \$2}' | awk -F: '{print \$2}' | head -n 1";
        cp.exec(cmd, function(err, stdout, stderr) {
            if (err) {
                console.log("error: " + stderr);
                process.exit(1);
            }
            if (!stdout.trim()) {
                var cmd = "ifconfig | grep -A1 eth | awk '/.*inet/{print \$2}' | awk -F: '{print \$2}' | head -n 1";
                cp.exec(cmd, function(err, stdout, stderr) {
                    if (err) {
                        console.log("error: " + stderr);
                        process.exit(1);
                    }
                    har_prefix = path.join(__dirname, '../../../har', stdout.trim());
                    get_monitor_data(type);
                });
            } else {
                har_prefix = path.join(__dirname, '../../../har', stdout.trim());
                get_monitor_data(type);
            }
        });
    });
}

/**************************** start *******************************/
// 为了防止脚本多次执行
// in case there is many tasks doing at the same time
var cmd = 'ps -ef | grep ria_monitor.js | grep -v grep | wc -l';
cp.exec(cmd, function(err, stdout, stderr) {
    if (err || Number(stdout) > 2) {
        console.log("error: previous script has not done!!");
        process.exit(1);
    }
    else {
        get_machine_ip();
    }
});
/*************************** start end ****************************/


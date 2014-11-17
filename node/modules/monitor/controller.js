var fs = require('fs');
var newDate = require(__dirname + '/../../common/dateFormat');

function calcMedian(summary_data) {
    var tmp = {};
    var res = {};

    for (var i in summary_data) {
        if (!tmp[summary_data[i].index]) {
            tmp[summary_data[i].index] = [];
        }
        tmp[summary_data[i].index].push(summary_data[i]);
    }

    for (var index in tmp) {
        var timeToFirstScreenFinished = 0;
        var median = parseInt(tmp[index].length / 2);
        
        for (var i = 0; i <= median; i++) {
            var min = 1000000;
            var midx = -1;
            var median_time = null;
            for (var j = 0; j < tmp[index].length; j++) {
                if (min > tmp[index][j].timeToFirstScreenFinished) {
                    min = tmp[index][j].timeToFirstScreenFinished;
                    midx = j;
                    median_time = tmp[index][j].monitor_time;
                }
            }
            tmp[index].splice(midx, 1);
        }

        res[index] = median_time;
    }
    return res;
}

function deleteHarFiles(index, time, prev) {
    var prefixDir = '/data1/pageMonitor/har/';
    var surfixDir = prev.format("/yyyy/MM/dd/hh/");
    var dirs = fs.readdirSync(prefixDir);

    dirs.forEach(function(dirName) {
        var oldPath = prefixDir + dirName + new newDate(time).format("/yyyy/MM/dd/hh/mm/") + index;
        var newPathPrefix = prefixDir + dirName + surfixDir;
        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPathPrefix + index);
        }
        var harDirs = fs.readdirSync(newPathPrefix);
        harDirs.forEach(function(harDir) {
            var curPath = newPathPrefix + harDir;
            if(fs.statSync(curPath).isDirectory()) {
                if (fs.existsSync(curPath + "/" + index)) {
                    fs.unlinkSync(curPath + "/" + index);
                }
                if (fs.readdirSync(curPath).length === 0) {
                    fs.rmdirSync(curPath);
                }
            }
        });
    });
}

function saveHar() {
    var cur = new newDate(new Date().setMinutes(0, 0, 0));
    var prev = new newDate(cur.getTime() - 3600000);
    var query = Timing.where({
        monitor_time: {'$gte': prev, '$lt': cur}
    }).select('timeToFirstScreenFinished monitor_time index');
    query.find(function(error, sData) {
        var median_map = calcMedian(sData);
        for (var index in median_map) {
            deleteHarFiles(index, median_map[index], prev);
        }
        db.disconnect();
    });
}

function harFileSaved() {
    var cur = new newDate(new Date().setMinutes(0, 0, 0));
    var prev = new newDate(cur.getTime() - 3600000);
    var prefixDir = '/data1/pageMonitor/har/';
    var surfixDir = prev.format("/yyyy/MM/dd/hh/");
    if (!fs.existsSync(surfixDir)) {
        return true;
    }
    var dirs = fs.readdirSync(prefixDir);
    var length = dirs.length;
    for (var i = 0; i < length; i++) {
        var checkHarPath = prefixDir + dirs[i] + surfixDir;
        var harDirs = fs.readdirSync(checkHarPath);
        var harLength = harDirs.length;
        for (var j = 0; j < harLength; j++) {
            var curPath = checkHarPath + harDirs[j];
            if(fs.statSync(curPath).isDirectory()) {
                return false;
            }
        };
    }

    return true;
}
/**
 * Saving the data from monitor clients, and saving a har file which
 * has the median timeToFirstScreenFinished value,
 * saving path is project_path/yyyy/MM/dd/hh/url_index_in_mongo
 * meanwhile, deleting other har files of this hour
 */
module.exports = function (app) {
    var Timing = app.dbconn.pagemonitor.model('ria_timming');
    
    this.saveTiming = function(req, res) {
        var results = JSON.parse(req.body.data);
        var length = results.length;
        var processCnt = 0;
        for (var i = 0; i < length; i++) {
            Timing.create(results[i], function(error) {
                processCnt++;
                if(error) {
                    console.log("store error: ", error);
                }

                if (processCnt == length && !harFileSaved()) {
                    saveHar();
                }
            });
        }
        res.json({
            code : 100000,
            msg : 'success',
            data: ''
        });
    };
};
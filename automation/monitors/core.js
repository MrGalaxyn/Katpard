var require = patchRequire(require);
var Queue = require('./lib/simple-queue');
var Results = require('./lib/results');
// emit results in JSON
var stdout = require('system').stdout;
var fs = require('fs');
// exit codes
var EXIT_SUCCESS = 0;
var EXIT_TIMED_OUT = 252;
var EXIT_CONFIG_FAILED = 253;
var EXIT_LOAD_FAILED = 254;
var EXIT_ERROR = 255;

// set up results wrapper
var results = new Results();
    
var tearDown = function(exitCode) {
    exitCode = exitCode || EXIT_SUCCESS;

    if (exitCode > 0) {
        casper.echo('Exiting with code #' + exitCode + '!');
    }

    casper.exit(exitCode);
};

var report = function() {
    casper.emit('report'); // @desc the report is about to be generated
    results.setUrl(casper.getCurrentUrl());
    // plain output for debug
    // var reporter = require('./reporters/reporter')(results, {reporter: 'plain'});
    // var res = reporter.render();

    // json output
    var res = JSON.stringify({
        url: results.getUrl(),
        metrics: results.getMetrics()
    });
    
    stdout.write(res);
    tearDown();
}

var run_monitor = function(opt) {
    // set up max listeners
    casper.setMaxListeners(50);

    // queue of jobs that needs to be done before report can be generated
    var reportQueue = new Queue();
    var timerId = null;
    var eventFlag = 0;
    var finished = 0;
    reportQueue.push(function(done) {
        casper.on('load.finished', function() {
            clearTimeout(timerId);
            if (eventFlag % 10 < 1) {
                eventFlag += 1;
            }
            timerId = setTimeout(function() {
                if (eventFlag !== 11) {
                    casper.capture('/data1/pageMonitor/err/' + Date.now() + '.png');
                }
                done();
            }, eventFlag === 11 ? 3000 : 8000);
        });
        casper.on('firstScreen.finished', function() {
            clearTimeout(timerId);
            if (parseInt(eventFlag / 10) < 1) {
                eventFlag += 10;
            }
            timerId = setTimeout(function() {
                if (eventFlag !== 11) {
                    casper.capture('/data1/pageMonitor/err/' + Date.now() + '.png');
                }
                done();
            }, eventFlag === 11 ? 3000 : 8000);
        });

        timerId = setTimeout(function() {
            casper.capture('/data1/pageMonitor/err/' + Date.now() + '.png');
            done();
        }, 10000);
    });

    // generate a report when all jobs are done
    reportQueue.done(report, casper);

    // returns list of 3rd party modules located in modules directory
    var listModules = function(type) {
        casper.log('Getting the list of all modules...');

        var modulesDir = casper.cli.options['casper-path'] + "/monitors/ria";
        var ls = fs.list(modulesDir) || [];
        var modules = [];

        // if monitor time just return time.js
        if (type === 'time') {
            return [modulesDir + "/time/time"];
        }
        else {
            ls.forEach(function(entry) {
                if (entry === 'time' || entry === 'har') {
                    return;
                }

                var modname = modulesDir + "/" + entry + "/" + entry;
                if (fs.isFile(modname + '.js')) {
                    modules.push(modname);
                }
            });
        }

        return modules;
    };
    // initialize given module
    var addModule = function(name) {
        var pkg;
        try {
            pkg = require(name);
        }
        catch (e) {
            casper.log('Unable to load module "' + name + '"!');
            return false;
        }

        if (pkg.skip) {
            casper.log('Module ' + name + ' skipped!');
            return false;
        }

        // init a module
        pkg.module(results, reportQueue);

        casper.log('Module ' + name + (pkg.version ? ' v' + pkg.version : '') + ' initialized');
        return true;
    };
    // load 3rd party modules
    var modules = listModules(opt && opt.type);
    modules.forEach(function(moduleName) {
        addModule(moduleName);
    });
    // load har path if defined
    var harPath = opt && opt.type && opt.harPath;
    if (harPath) {
        pkg = require(casper.cli.options['casper-path'] + "/monitors/ria/har/har")
        pkg.module(results, harPath);
    }

    var onCallback = function(msg) {
        var type = msg && msg.type || '';
        var data = msg && msg.data || {};

        switch(type) {
            case 'log':
                casper.log(data);
                break;

            case 'setMetric':
                results.setMetric(data.name, data.value, data.isFinal);
                break;

            case 'incrMetric':
                results.incrMetric(data.name, data.incr);
                break;

            default:
                casper.log('Message "' + type + '" from browser\'s scope: ' + JSON.stringify(data));
                casper.emit('message', msg); // @desc the scope script sent a message
        }
    };

    casper.on('remote.callback', function(msg){
        onCallback(JSON.parse(msg));
    });

    // set up the main monitor part
    var pkg = require(casper.cli.options['casper-path'] + '/monitors/monitor');
    pkg.module(results);
}

exports.startMonitor = run_monitor;
exports.report = report;
exports.tearDown = tearDown;
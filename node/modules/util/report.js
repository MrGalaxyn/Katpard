var fs = require('fs');
var config = require('../../config/config');
var spawn = require('child_process').spawn;

module.exports = function (app) {
    this.sendReport = function(req, res) {
        var addrs = req.body.addrs;
        var month = req.body.month;
        var group = req.body.group;

        var args = [__dirname + '/../../cron/email/report.js', group, month, addrs];
        var child = spawn(config.node, args);
        var handleExit = function(spawn) {
            return function (data) {
                spawn.kill();
            }
        }
        child.on('exit', handleExit(child));
        res.json({
            code : 100000,
            msg : 'success',
            data: ''
        });
    };
};


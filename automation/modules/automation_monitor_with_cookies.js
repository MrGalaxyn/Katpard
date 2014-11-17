/*
 * get performance data of the page with weibo.com cookies
 * if a mobile useragent is specified, the change the view port to simulate a mobile screen
 *
 */
var require = patchRequire(require);
var system = require('system');
var login_cookies = require('weibo_cookies');
var casper = require("casper").create({
    viewportSize: {
        width: 1280,
        height: 800
    }
});
if (casper.cli.args.length < 1) {
    casper.echo("usage: casper automation_monitor_with_cookies.js <url> <type> <usr> <harPath> <ua>")
    phantom.exit(0);
}
var url = casper.cli.args[0];
var usr = casper.cli.args[2];
var opt = {
    type: casper.cli.args[1],
    harPath: casper.cli.args[3],
}
var ua = casper.cli.args[4];
if (ua) {
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"); 
    for (var i = 0; i < Agents.length; i++) {  
        if (ua.indexOf(Agents[i]) > 0) {
            casper.options.viewportSize = {width: 640, height: 1136};
            break;
        }
    }
}

casper.start();
var monitor = require(casper.cli.options['casper-path'] + '/monitors/core');
login_cookies.getCookie(usr);
casper.then(function() {
    monitor.startMonitor(opt);
})
casper.then(function() {
    if (ua) {
        this.userAgent(ua);
    }
    this.open(url);
});

casper.run(function() {
    setTimeout(function() {
        monitor.report();
    }, 30000);
});



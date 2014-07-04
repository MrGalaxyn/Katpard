var require = patchRequire(require);
var system = require('system');
var casper = require("casper").create({
    viewportSize: {
        width: 1280,
        height: 1024
    }
});
if (casper.cli.args.length < 1) {
    casper.echo("usage: casper automation_monitor_without_cookies.js <url> <type> <harPath>")
    phantom.exit(0);
}
var url = casper.cli.args[0];
var opt = {
    type: casper.cli.args[1],
    harPath: casper.cli.args[2],
}
var ua = casper.cli.args[3];
casper.start();
var monitor = require(casper.cli.options['casper-path'] + '/monitors/core');
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
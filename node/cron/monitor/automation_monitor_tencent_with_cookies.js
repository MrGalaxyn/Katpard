var require = patchRequire(require);
var system = require('system');

var login_cookies = require('tencent_cookies');

var casper = require("casper").create({
    viewportSize: {
        width: 1280,
        height: 800
    }
});
if (casper.cli.args.length < 1) {
    casper.echo("usage: casper automation_monitor_with_cookies.js <url> <type> <harPath>")
    phantom.exit(0);
}
var url = casper.cli.args[0];
var opt = {
    type: casper.cli.args[1],
    harPath: casper.cli.args[2],
}

casper.start();

login_cookies.setCookie();
casper.then(function() {
    var monitor = require(casper.cli.options['casper-path'] + '/monitors/core');
    monitor(url, opt);
});
casper.then(function() {
    this.open(url);
});

casper.run(function() {
    this.capture('tencent.png');
});
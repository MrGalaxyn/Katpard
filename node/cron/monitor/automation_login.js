var require = patchRequire(require);
var system = require('system');

var login_weibo = require('weibo_login');

var casper = require("casper").create({
    viewportSize: {
        width: 1280,
        height: 1024
    }
});

if (casper.cli.args.length < 2) {
    casper.echo("usage: casper scrap.js <username> <password>")
    phantom.exit(0);
}
var usr = casper.cli.args[0];
var pw = casper.cli.args[1];

casper.start();
login_weibo(usr, pw);
casper.run();
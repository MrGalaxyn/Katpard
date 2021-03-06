/*
 * login weibo.com with user and password
 *
 */

var require = patchRequire(require);
var system = require('system');

var login_weibo = require('weibo_login');

var casper = require("casper").create({
    viewportSize: {
        width: 1280,
        height: 800
    }
});

if (casper.cli.args.length < 2) {
    casper.echo("usage: casper automation_login.js <username> <password>")
    casper.exit(1);
}
var usr = casper.cli.args[0];
var pw = casper.cli.args[1];

casper.start();
login_weibo(usr, pw);
casper.run(function() {
    setTimeout(function() {
        casper.die("error: login fail! " + usr + " " + pw, 1);
    }, 15000);
});
/*
 * login t.qq.com with user and password
 *
 */
var require = patchRequire(require);
var system = require('system');

var login_tencent = require('tencent_login');

var casper = require("casper").create({
    viewportSize: {
        width: 1280,
        height: 800
    }
});

var usr = casper.cli.args[0] || '2040640909';
var pw = casper.cli.args[1] || '1234.qwer';

casper.start();
login_tencent(usr, pw);
casper.run(function() {
    setTimeout(function() {
        casper.echo("error: login fail! " + usr + " " + pw);
        casper.exit(1);
    }, 15000);
});
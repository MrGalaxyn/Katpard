var require = patchRequire(require);
var system = require('system');

var login_tencent = require('tencent_login');

var casper = require("casper").create({
    viewportSize: {
        width: 1280,
        height: 1024
    }
});

var usr = casper.cli.args[0] || '2040640909';
var pw = casper.cli.args[1] || '1234.qwer';

casper.start();
login_tencent(usr, pw);
casper.run();
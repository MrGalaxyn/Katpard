var require = patchRequire(require);
var fs = require('fs');

exports.setCookie = function() {
    var cookie_file = fs.pathJoin((fs.pathJoin(phantom.casperPath, 'data')), 'tencentCookies');
    var cookies = fs.isFile(cookie_file) ? JSON.parse(fs.read(cookie_file)) : [];
    for(var i = 0; i < cookies.length; i++) {
        phantom.addCookie(cookies[i]);
    }
};

exports.writeCookie = function() {
    var cookie_file = fs.pathJoin((fs.pathJoin(phantom.casperPath, 'data')), 'tencentCookies');
    casper.then(function() {
        fs.write(cookie_file, JSON.stringify(phantom.cookies));
    });
};
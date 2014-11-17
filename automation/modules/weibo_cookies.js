var require = patchRequire(require);
var fs = require('fs');

exports.getCookie = function(usr) {
    var cookie_file = fs.pathJoin((fs.pathJoin(phantom.casperPath, 'data')), 'weiboCookies' + usr);
    var cookies = fs.isFile(cookie_file) ? JSON.parse(fs.read(cookie_file)) : [];
    for(var i = 0; i < cookies.length; i++) {
        phantom.addCookie(cookies[i]);
    }
};

exports.writeCookie = function(usr) {
    var cookie_file = fs.pathJoin((fs.pathJoin(phantom.casperPath, 'data')), 'weiboCookies' + usr);
    fs.write(cookie_file, JSON.stringify(phantom.cookies));
};
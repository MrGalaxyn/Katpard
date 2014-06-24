/*
 * GET home page.
 */
var path = require('path');
var config = require('../../config/config');

exports.index = function(req, res){
    var html = path.normalize(config.root + '/views/index.html');
    res.sendfile(html);
};

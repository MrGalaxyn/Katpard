'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
    app: {
        title: 'katpard page monitor',
        description: 'application used to get web page performance data!'
    },
    root: rootPath + '/app',
    port: process.env.PORT || 3000,
    ip: process.env.IP || '127.0.0.1',
    templateEngine: 'html',
    casperjs: '',
    node: ''
};
'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
    app: {
        title: 'katpard page monitor',
        description: 'modified for weibo ria'
    },
    root: rootPath + '/app',
    port: process.env.PORT || 3000,
    ip: process.env.IP || '127.0.0.1',
    templateEngine: 'html',
    casperjs: '',
    node: ''
};
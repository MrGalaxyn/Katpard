'use strict';

var _ = require('lodash');

/**
 * First we set the node enviornment variable if not set before
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
// Load app configuration
module.exports = _.merge(require(__dirname + '/../config/all.js'),
    require(__dirname + '/../config/env/' + process.env.NODE_ENV + '.js') || {});
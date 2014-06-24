/**
 * Analyzes number of requests and sizes of different types and console messages
 *
 * setMetric('htmlCount') @desc number of HTML responses @offenders
 * setMetric('htmlSize')  @desc size of HTML responses @unreliable
 * setMetric('cssCount') @desc number of CSS responses @offenders
 * setMetric('cssSize')  @desc size of CSS responses @unreliable
 * setMetric('jsCount') @desc number of JS responses @offenders
 * setMetric('jsSize')  @desc size of JS responses @unreliable
 * setMetric('consoleMessages') @desc number of calls to console.* functions
 * setMetric('imageCount') @desc number of image responses @offenders
 * setMetric('imageSize')  @desc size of image responses @unreliable
 */
'use strict';

exports.module = function(results) {
    var types = ['css', 'js', 'image'];
    types.forEach(function(key) {
        results.setMetric(key + 'Count');
        results.setMetric(key + 'Size');
    });
    results.setMetric('consoleMessages'); // @desc number of calls to console.* functions

    casper.on('recv', function(entry, res) {
        if (types.indexOf(entry.type) === -1) {
            return;
        }
        
        var size = entry.contentLength;

        results.incrMetric(entry.type + 'Count');
        results.incrMetric(entry.type + 'Size', size);

        results.addOffender(entry.type + 'Count', entry.url + ' (' + (size / 1024).toFixed(2)  + ' kB)');
    });
    
    casper.on('consoleLog', function(msg) {
        results.incrMetric('consoleMessages');
    });
};

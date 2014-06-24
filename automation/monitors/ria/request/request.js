/**
 * Domains monitor
 */
'use strict';

exports.module = function(results) {
    var domains = {};
    // results.setMetric('domains'); // @desc number of domains used to fetch the page @offenders
    results.setMetric('maxRequestsPerDomain'); // @desc maximum number of requests fetched from a single domain
    results.setMetric('medianRequestsPerDomain'); // @desc median of number of requests fetched from each domain
    results.setMetric('requests');              // @desc total number of HTTP requests made
    results.setMetric('notFound');              // @desc number of HTTP 404 responses
    results.setMetric('ajaxRequests'); // @desc number of AJAX requests

    casper.on('send', function(entry, res) {
        if (entry.isAjax) {
            results.incrMetric('ajaxRequests');
            results.addOffender('ajaxRequests', entry.url);
        }
    });

    casper.on('notFound', function(entry, res) {
        results.incrMetric('notFound');
    });

    casper.on('recv', function(entry,res) {
        var domain = entry.domain;

        // base64?
        if (!domain) {
            return;
        }

        if (!entry.isBase64) {
            results.incrMetric('requests');
        }

        // init domain entry
        if (!domains[domain]) {
            domains[domain] = {
                requests: []
            };
        }

        domains[domain].requests.push(res.url);
    });

    // add metrics
    casper.on('report', function() {
        var max = -1;
        var sum = 0;
        var cnt = 0;
        for (var domain in domains) {
            var req = domains[domain].requests.length;
            sum += req;
            cnt++;
            if (max < cnt) {
                max = cnt;
            }
        }
        results.setMetric('maxRequestsPerDomain', max);
        results.setMetric('medianRequestsPerDomain', sum / cnt);
    });
};

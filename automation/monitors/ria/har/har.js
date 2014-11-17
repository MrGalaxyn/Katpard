/**
* Log requests for build HAR output
* 
* @see: https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html
*/
'use strict';

var fs = require('fs');

/**
 * From phantomHAR
 * @author: Christopher Van (@cvan)
 * @homepage: https://github.com/cvan/phantomHAR
 * @original: https://github.com/cvan/phantomHAR/blob/master/phantomhar.js
 */
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function () {
        function pad(n) { return n < 10 ? '0' + n : n; }
        function ms(n) { return n < 10 ? '00'+ n : n < 100 ? '0' + n : n }
        return this.getFullYear() + '-' +
            pad(this.getMonth() + 1) + '-' +
            pad(this.getDate()) + 'T' +
            pad(this.getHours()) + ':' +
            pad(this.getMinutes()) + ':' +
            pad(this.getSeconds()) + '.' +
            ms(this.getMilliseconds()) + 'Z';
    }
}

function getErrorString(error) {
    // According to http://qt-project.org/doc/qt-4.8/qnetworkreply.html
    switch (error.errorCode) {
        case 1:
            return '(refused)';
        case 2:
            return '(closed)';
        case 3:
            return '(host not found)';
        case 4:
            return '(timeout)';
        case 5:
            return '(canceled)';
        case 6:
            return '(ssl failure)';
        case 7:
            return '(net failure)';
        default:
            return '(unknown error)';
    }
}

function createHAR(page, creator) {
    var address = page.address;
    var title = page.title;
    var startTime = page.startTime;
    var resources = page.resources;

    var entries = [];

    resources.forEach(function(resource) {
        var request = resource.request;
        var startReply = resource.startReply;
        var endReply = resource.endReply;
        var error = resource.error;

        if (!request || !startReply || !endReply) {
            return;
        }

        // Exclude data URIs from the HAR because they aren't
        // included in the spec.
        if (request.url.substring(0, 5).toLowerCase() === 'data:') {
            return;
        }

        if (error) {
            startReply.bodySize = 0;
            startReply.time = 0;
            endReply.time = 0;
            endReply.content = {};
            endReply.contentType = null;
            endReply.headers = [];
            endReply.statusText = getErrorString(error);
            endReply.status = null;
        }

        entries.push({
            cache: {},
            pageref: address,
            request: {
                // Accurate bodySize blocked on https://github.com/ariya/phantomjs/pull/11484
                // bodySize: -1,
                bodySize: startReply.contentLength || startReply.bodySize || -1,
                cookies: [],
                headers: request.headers,
                // Accurate headersSize blocked on https://github.com/ariya/phantomjs/pull/11484
                headersSize: -1,
                httpVersion: 'HTTP/1.1',
                method: request.method,
                queryString: [],
                url: request.url,
            },
            response: {
                bodySize: startReply.contentLength || startReply.bodySize || -1,
                cookies: [],
                headers: endReply.headers,
                headersSize: -1,
                httpVersion: 'HTTP/1.1',
                redirectURL: '',
                status: endReply.status,
                statusText: endReply.statusText,
                content: {
                    mimeType: endReply.contentType || '',
                    size: startReply.bodySize, // uncompressed
                    text: startReply.content || ''
                }
            },
            startedDateTime: request.time.toISOString(),
            time: endReply.time - request.time,
            timings: {
                blocked: 0,
                dns: -1,
                connect: -1,
                send: 0,
                wait: startReply.time - request.time,
                receive: endReply.time - startReply.time,
                ssl: -1
            }
        });
    });

    return {
        log: {
            creator: creator,
            entries: entries,
            pages: [
                {
                    startedDateTime: startTime.toISOString(),
                    id: address,
                    title: title,
                    pageTimings: {
                        onLoad: page.windowOnLoadTime || -1,
                        onContentLoad: page.onDOMReadyTime || -1
                    }
                }
            ],
            version: '1.2',
        }
    };
}
/** End **/

exports.module = function(results, file) {

    var path = '';

    var page = {
        origin: casper.page,
        resources: [],
        title: undefined,
        address: undefined,
        startTime: undefined,
        endTime: undefined,
        onDOMReadyTime: undefined,
        windowOnLoadTime: undefined
    };

    var creator = {
        name: "ria casper - (using phantomHAR)",
        version: "1.0"
    };

    var prefix = file.lastIndexOf("/") > file.lastIndexOf("\\") ? file.lastIndexOf("/") : file.lastIndexOf("\\");
    path = file;

    casper.log('HAR path: %s', path);

    casper.on('load.started', function() {
        page.startTime = new Date();
    });

    casper.on('load.finished', function() {
        page.endTime = new Date();
    });

    casper.on('resource.requested', function(res, req) {
        page.resources[res.id] = {
            request: res,
            startReply: null,
            endReply: null
        };
    });

    casper.on('resource.received', function(res) {
        switch (res.stage) {
            case 'start':
                page.resources[res.id].startReply = res;
                break;
            case 'end':
                page.resources[res.id].endReply = res;
                break;
        }
    });

    casper.on('report', function() {
        // Set endTime if page was not finished correctly
        if (! page.endTime)
            page.endTime = new Date();

        page.windowOnLoadTime = results.getMetric('windowOnLoadTime');
        page.onDOMReadyTime = results.getMetric('onDOMReadyTime');
        // If metric 'windowOnLoadTime' hasn't been fired, compute it
        if (! page.windowOnLoadTime)
            page.windowOnLoadTime = page.endTime.getTime() - page.startTime.getTime();

        page.address = page.origin.url;
        page.title = page.origin.title;

        casper.log('Create HAR: %s ("%s")', page.address, page.title);

        var har,
            dump;

        try {
            har = createHAR(page, creator);
        } catch (e) {
            casper.log('Impossible to build HAR: %s', e);
            return;
        }
    
        casper.log('Convert HAR to JSON');
        try {
            dump = JSON.stringify(har);
        } catch (e) {
            casper.log('Impossible stringify HAR on JSON format: %s', e);
            return;
        }

        casper.log("Write HAR in '%s'", path);
        try {
            fs.makeTree(prefix);
            fs.write(path, dump);
        } catch (e) {
            casper.log('Impossible write HAR file: %s', e);
            return;
        }

        casper.log('HAR Done !');
    });
};

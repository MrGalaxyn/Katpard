/**
 * Provides metrics for time
 *
 * setMetric('timeToFirstCss')   @desc time it took to receive the last byte of the first CSS @offenders
 * setMetric('timeToFirstJs')    @desc time it took to receive the last byte of the first JS @offenders
 * setMetric('timeToFirstResFirstByte') @desc time it took to receive the 1st byte of the first response (that was not a redirect)
 * setMetric('slowestResponse') @desc the time to the last byte of the slowest response @offenders
 * setMetric('httpTrafficCompleted') @desc time it took to receive the last byte of the last HTTP response
 * onDOMReadyTime       Navigation Timing - domContentLoadedEventStart and domComplete
 * windowOnLoadTime     Navigation Timing - loadEventStart
 */
'use strict';

exports.module = function(results) {
    function capitalize(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }

    function resetResults() {
        hasReceived = {};
        // used for restore requestsStats
        stack = {};
        // TTFB / TTLB metrics
        ttfbMeasured = false;
    }

    var monitorRes = {
        httpTrafficCompleted: 0,
        timeToFirstResFirstByte: 0,
        onDOMReadyTime: 0,
        windowOnLoadTime: 0,
        timeTofirstScreenFinished: 0,
        timeToFirstJs: 0,
        timeToFirstCss: 0
    };
    var types = ['css', 'js'];
    var loadStartedTime = 0;
    var lastLoadStartedTime = 0;
    var hasReceived = {};
    // used for restore requestsStats
    var stack = {};
    // TTFB / TTLB metrics
    var ttfbMeasured = false;

    // init metrics
    types.forEach(function(key) {
        results.setMetric('timeToFirst' + capitalize(key));  // @desc time it took to receive the last byte of the 1st given type
    });
    results.setMetric('httpTrafficCompleted');  // @desc time it took to receive the last byte of the last HTTP response
    results.setMetric('timeToFirstResFirstByte');       // @desc time it took to receive the 1st byte of the first response (that was not a redirect)
    results.setMetric('slowestResponse');    // @desc the time to the last byte of the slowest response @offenders
    results.setMetric('onDOMReadyTime');       // @desc time it took to fire onDOMready event
    results.setMetric('windowOnLoadTime');     // @desc time it took to fire window.load event
    results.setMetric('timeBackend');  // @desc time to the first byte compared to the total loading time [%]
    results.setMetric('timeFrontend'); // @desc time to window.load compared to the total loading time [%]
    results.setMetric('timeTofirstScreenFinished'); // @desc time it took to finish render first screen

    // register the timestamp when the request for the page was sent
    casper.on('load.started', function() {
        lastLoadStartedTime = Date.now();
    });
    casper.on('url.changed', function(){
        loadStartedTime = lastLoadStartedTime;
        resetResults();
    });

    /****************************** time to first *************************/
    // // measure onDOMReadyTime and windowOnLoadTime from the moment HTML response was fully received
    // var responseEndTime = 0;
    casper.on('recv', function(entry, res) {
        var type = entry.type;
        var time = 0;
        var metricName = '';

        // report only the first asset of supported type
        if ( (types.indexOf(type) !== -1) && (!hasReceived[type]) ) {
            // calculate relative timestamp
            // time = Date.now() - loadStartedTime;
            // time = new Date(entry.sendTime).getTime() + entry.timeToLastByte - loadStartedTime;

            metricName = 'timeToFirst' + capitalize(type);

            // results.setMetric(metricName, time);
            monitorRes[metricName] = new Date(entry.sendTime).getTime() + entry.timeToLastByte;
            // results.addOffender(metricName, entry.url + ' received in ' + time + ' ms');

            // set the flag
            hasReceived[type] = true;
        }
        /**************************** time to first end ***********************/


        /************************** httpTrafficCompleted **********************/
        // results.setMetric('httpTrafficCompleted', entry.recvEndTime - loadStartedTime);
        monitorRes.httpTrafficCompleted = entry.recvEndTime;
        /************************ httpTrafficCompleted end ********************/


        /********************************** TTFB ******************************/
        
        // check the first response which is not a redirect (issue #74)
        if (!ttfbMeasured && !entry.isRedirect) {
            // results.setMetric('timeToFirstResFirstByte', new Date(entry.sendTime).getTime() + entry.timeToFirstByte - loadStartedTime, true);
            monitorRes.timeToFirstResFirstByte = new Date(entry.sendTime).getTime() + entry.timeToFirstByte;
            // results.setMetric('timeToFirstResLastByte', entry.timeToLastByte, true);

            ttfbMeasured = true;

            casper.log('Time to first byte: set to ' + entry.timeToFirstByte + ' ms for <' + entry.url + '> (HTTP ' + entry.status + ')');
            // 不知道原作者为啥使用这个时间
            // // casper.emit('responseEnd', entry, res); // @desc the first response (that was not a redirect) fully received
            // responseEndTime = Date.now();
            // casper.evaluate(function(responseEndTime) {
            //     window.performance = window.performance || {timing: {}};
            //     window.performance.timing.responseEnd = responseEndTime;
            // }, responseEndTime);
        }
        /******************************** TTFB end ****************************/


        /**************************** slowestResponse *************************/
        
        // adds given entry under the "type" if given check function returns true
        function pushToStack(type, entry, check) {
            // no entry of given type
            if (!stack[type]) {
                stack[type] = entry;
            }
            // apply check function
            else if (check(stack[type], entry) === true) {
                stack[type] = entry;
            }
        }

        // ignore anything different than HTTP 200
        if (entry.status !== 200) {
            return;
        }

        pushToStack('slowestResponse', entry, function(stack, entry) {
            return stack.url === entry.url || stack.timeToLastByte < entry.timeToLastByte;
        });
        /************************** slowestResponse end ***********************/
    });

    
    // 原作者使用了responseEndTime,可能理解有误，这个时间肯定不准，改成现在这个模式
    // casper.on('responseEnd', function() {
    //     responseEndTime = Date.now();
    //     casper.log('Performance timing: responseEnd');

    //     casper.evaluate(function(responseEndTime) {
    //         window.performance = window.performance || {timing: {}};
    //         window.performance.timing.responseEnd = responseEndTime;
    //     }, responseEndTime);
    // });

    casper.on('page.initialized', function() {
        casper.evaluate(function() {
            (function() {
                // phantomas.spyEnabled(false, 'installing window.performance metrics');

                // extend window.performance
                // "init" event is sometimes fired twice, pass a value set by "responseEnd" event handler (fixes #192)
                // window.performance = window.performance || {
                //     timing: {
                //         responseEnd: responseEndTime
                //     }
                // };
 
                // emulate Navigation Timing
                document.addEventListener('readystatechange', function() {
                    var readyState = document.readyState;

                    // @see http://www.w3.org/TR/html5/dom.html#documentreadystate
                    switch(readyState) {
                        // DOMContentLoaded
                        case 'interactive':
                            metricName = 'onDOMReadyTime';
                            break;

                        // window.onload
                        case 'complete':
                            metricName = 'windowOnLoadTime';
                            break;

                        default:
                            __utils__.log('Performance timing: unhandled "' + readyState + '" state!');
                            return;
                    }
                    // __utils__.echo("msg: " + metricName);
                    __utils__.callFn('setMetric', {name: metricName, value: Date.now()});
                });
                __utils__.incr('eventsBound', -1); // 在事件绑定时，要去掉这个注入的事件
            })();
        });
    });

    casper.on('firstScreen.finished', function(time) {
        // results.setMetric('timeTofirstScreenFinished', time - loadStartedTime);
        monitorRes.timeTofirstScreenFinished = Date.now() - time;
    });

    casper.on('report', function() {
        /************************** slowestResponse ***************************/
        var entries = Object.keys(stack).length;

        if (entries === 0) {
            casper.log('requestsStats: no requests data gathered!');
            return;
        }

        // set metrics and provide offenders with URLs
        [
            // 'smallestResponse',
            // 'biggestResponse',
            // 'fastestResponse',
            // 'smallestLatency',
            // 'biggestLatency',
            'slowestResponse'
        ].forEach(function(metric) {
            var entry = stack[metric];

            switch (metric) {
                // case 'smallestResponse':
                // case 'biggestResponse':
                //     results.setMetric(metric, entry.contentLength);
                //     details = (entry.contentLength/1024).toFixed(2) + ' kB';
                //     break;

                // case 'fastestResponse':
                case 'slowestResponse':
                    results.setMetric(metric, entry.timeToLastByte);
                    // details = entry.timeToLastByte + ' ms';
                    break;

                // case 'smallestLatency':
                // case 'biggestLatency':
                //     results.setMetric(metric, entry.timeToFirstByte);
                //     details = entry.timeToFirstByte + ' ms';
                //     break;
            }

            // results.addOffender(metric, entry.url + ' (' + details + ')');
        });
        /************************** slowestResponse end ***********************/
        // callback for --disable-js mode
        var time = results.getMetric('windowOnLoadTime');

        if (time === 0) {
            monitorRes.windowOnLoadTime = Date.now();
            monitorRes.httpTrafficCompleted = Date.now();
            casper.log('Performance timing: document reached "complete" state (no JS fallback)');
        }
        else {
            monitorRes.windowOnLoadTime = results.getMetric('windowOnLoadTime');
        }
        
        monitorRes.onDOMReadyTime = results.getMetric('onDOMReadyTime');

        /************************** back/frontend ***************************/
        //  The “backend” time is the time it takes the server to get the first byte back to the client.
        //  The “frontend” time is everything else (measured until window.onload)
        var backendTime = parseInt(monitorRes.timeToFirstResFirstByte, 10) - loadStartedTime,
            totalTime = parseInt(monitorRes.windowOnLoadTime, 10) - loadStartedTime,
            backendTimePercentage;

        if (totalTime === 0) {
            return;
        }

        backendTimePercentage = Math.round(backendTime / totalTime * 100);

        results.setMetric('timeBackend', backendTimePercentage);
        results.setMetric('timeFrontend', 100 - backendTimePercentage);
        /************************** back/frontend end ***********************/
  
        for (var index in monitorRes) {
            results.setMetric(index, monitorRes[index] - loadStartedTime);
        }
    });
};

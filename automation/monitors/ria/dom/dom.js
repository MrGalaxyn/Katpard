/**
 * Analyzes DOM queries done via native DOM methods
 */
/* global Element: true, Document: true, Node: true, window: true */
'use strict';

exports.module = function(results) {
    results.setMetric('DOMqueries'); // @desc number of all DOM queries @offenders
    results.setMetric('DOMqueriesById'); // @desc number of document.getElementById calls
    results.setMetric('DOMqueriesByClassName'); // @desc number of document.getElementsByClassName calls
    results.setMetric('DOMqueriesByTagName'); // @desc number of document.getElementsByTagName calls
    results.setMetric('DOMqueriesByQuerySelectorAll'); // @desc number of document.querySelectorAll calls
    results.setMetric('DOMinserts'); // @desc number of DOM nodes inserts
    results.setMetric('DOMqueriesDuplicated'); // @desc number of duplicated DOM queries
    results.setMetric('DOMelementsCount'); // @desc total number of HTML element nodes
    results.setMetric('DOMelementMaxDepth'); // @desc maximum level on nesting of HTML element node
    results.setMetric('nodesWithInlineCSS'); // @desc number of nodes with inline CSS styling (with style attribute) @offenders

    // fake native DOM functions
    casper.on('page.initialized', function() {
        casper.evaluate(function() {
            (function() {
                // count DOM queries by either ID, tag name, class name and selector query
                // @see https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#dom-document-doctype
                var DOMqueries = {};
                __utils__.set('DOMqueries', DOMqueries);

                function querySpy(type, query) {
                    __utils__.log('DOM query: by ' + type + ' "' + query + '"');
                    __utils__.callFn('incrMetric', {name: 'DOMqueries'});

                    // detect duplicates
                    var key = type + ' "' + query + '"';
                    if (typeof DOMqueries[key] === 'undefined')  {
                        DOMqueries[key] = 0;
                    }

                    DOMqueries[key]++;
                }

                __utils__.spy(Document.prototype, 'getElementById', function(id) {
                    __utils__.callFn('incrMetric', {name: 'DOMqueriesById'});
                    querySpy('id', '#' + id);
                });
                __utils__.spy(Document.prototype, 'getElementsByClassName', function(className) {
                    __utils__.callFn('incrMetric', {name: 'DOMqueriesByClassName'});
                    querySpy('class', '.' + className);
                });

                __utils__.spy(Document.prototype, 'getElementsByTagName', function(tagName) {
                    __utils__.callFn('incrMetric', {name: 'DOMqueriesByTagName'});
                    querySpy('tag name', tagName);
                });

                // selector queries
                function selectorQuerySpy(selector) {
                    __utils__.callFn('incrMetric', {name: 'DOMqueriesByQuerySelectorAll'});
                    querySpy('selector', selector);
                }

                __utils__.spy(Document.prototype, 'querySelectorAll', selectorQuerySpy);
                __utils__.spy(Element.prototype, 'querySelectorAll', selectorQuerySpy);

                // count DOM inserts
                function appendSpy(child) {
                    /* jshint validthis: true */
                    var hasParent = typeof this.parentNode !== 'undefined';

                    // ignore appending to the node that's not yet added to DOM tree
                    if (!hasParent) {
                        return;
                    }

                    __utils__.callFn('incrMetric', {name: 'DOMinserts'});
                    // casper.log('DOM insert: node "' + phantomas.getDOMPath(child) + '" added to "' + phantomas.getDOMPath(this) + '"');
                }

                __utils__.spy(Node.prototype, 'appendChild', appendSpy);
                __utils__.spy(Node.prototype, 'insertBefore', appendSpy);

                function eventSpy(eventType) {
                    /* jshint validthis: true */
                    __utils__.log('DOM event: "' + eventType + '" bound');
                    __utils__.incr('eventsBound');
                }

                __utils__.spy(Document.prototype, 'addEventListener', eventSpy);
                __utils__.spy(window, 'addEventListener', eventSpy);
                __utils__.spy(Element.prototype, 'addEventListener', eventSpy);
                __utils__.spy(Node.prototype, 'addEventListener', eventSpy);
            })();
        });
    });

    casper.on('report', function() {
        var DOMqueries = casper.evaluate(function(key) {
            return __utils__.get(key);
        }, 'DOMqueries') || {};

        var queries = [];

        // TODO: implement phantomas.collection
        Object.keys(DOMqueries).forEach(function(query) {
            var cnt = DOMqueries[query];

            if (cnt > 1) {
                casper.log(query + ': ' + cnt + ' queries');
                results.incrMetric('DOMqueriesDuplicated');
                queries.push({
                    query: query,
                    cnt: cnt
                });
            }
        });

        results.setMetric('eventsBound', casper.evaluate(function(key) {
            return __utils__.get(key) || 0;
        }, 'eventsBound'));

        casper.evaluate(function() {
            (function(results) {
                function walk(node, callback, depth) {
                    var childNode,
                        childNodes = node && node.childNodes || [];

                    depth = (depth || 1);

                    for (var n=0, len = childNodes.length; n < len; n++) {
                        childNode = childNodes[n];

                        // callback can return false to stop recursive
                        if (callback(childNode, depth) !== false) {
                            arguments.callee(childNode, callback, depth + 1);
                        }
                    }
                }

                walk(document.body, function(node, depth) {
                    switch (node.nodeType) {
                        case Node.ELEMENT_NODE:
                            __utils__.incr('DOMelementsCount');
                            __utils__.set('DOMelementMaxDepth', Math.max(__utils__.get('DOMelementMaxDepth') || 0, depth));

                            // ignore inline <script> tags
                            if (node.nodeName === 'SCRIPT') {
                                return false;
                            }

                            // count nodes with inline CSS
                            if (node.hasAttribute('style')) {
                                __utils__.incr('nodesWithInlineCSS');
                            }

                            break;
                    }
                });
            }());
        });

        // @desc total number of HTML element nodes
        results.setMetric('DOMelementsCount', casper.evaluate(function(key) {
            return __utils__.get(key) || 0;
        }, 'DOMelementsCount'));
        // @desc maximum level on nesting of HTML element node
        results.setMetric('DOMelementMaxDepth', casper.evaluate(function(key) {
            return __utils__.get(key) || 0;
        }, 'DOMelementMaxDepth'));
        // @desc number of nodes with inline CSS styling (with style attribute) @offenders
        results.setMetric('nodesWithInlineCSS', casper.evaluate(function(key) {
            return __utils__.get(key) || 0;
        }, 'nodesWithInlineCSS')); 
    });
};

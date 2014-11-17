'use strict';

define([
    'app',
    "common/comp/commonChart",
    "lib/harViewer/harPreview",
    'common/kit/util/loading',
    "common/comp/datatable",
    "lib/canvasjs/canvasjs"
], function (app, CommonChart, HarPreview, Loading) {
    var riaCtrl = function ($scope, $http, $routeParams) {
        $scope.time = new Date().getTime();
        var types = [
            {
                name: '时间', 
                uri: '/ria/getTiming', 
                types: [
                    'timeToFirstResFirstByte',
                    'timeToFirstPaintRequested',
                    'timeToFirstScreenFinished',
                    'onDOMReadyTime',
                    'windowOnLoadTime',
                    'httpTrafficCompleted',
                    'timeFrontendRate',
                    'timeToFirstCss',
                    'timeToFirstJs',
                    'slowestResponse'
                ],
                names: [
                    '首包时间',
                    '白屏时间',
                    '首屏时间',
                    'DOMReady',
                    '加载时间',
                    '总下载时间',
                    '前后端时间比',
                    '首CSS时间',
                    '首JS时间',
                    '最慢响应'
                ]
            },
            {
                name: '文件与内容', 
                uri: '/ria/getOther', 
                types: [
                    'cssSize',
                    'cssCount',
                    'jsSize',
                    'jsCount',
                    'imageSize',
                    'imageCount',
                    'consoleMessages'
                ]
            },
            {
                name: '请求', 
                uri: '/ria/getOther', 
                types: [
                    'requests',
                    'notFound',
                    'ajaxRequests',
                    'maxRequestsPerDomain',
                    'medianRequestsPerDomain'
                ]
            },
            {
                name: 'DOM', 
                uri: '/ria/getOther', 
                types: [
                    'DOMqueries',
                    'DOMqueriesById',
                    'DOMqueriesByClassName',
                    'DOMqueriesByTagName',
                    'DOMqueriesByQuerySelectorAll',
                    'DOMinserts',
                    'DOMqueriesDuplicated',
                    'DOMelementsCount',
                    'DOMelementMaxDepth',
                    'nodesWithInlineCSS'
                ]
            }
        ];

        var stackCharts = ['timeFrontendRate'];
        var stackChartsLabel = [['后端', '前端']];
        var stackChartsDataProcess = [function(data) {
            var result = [];
            for (var i in data) {
                result.push({
                    x: data[i].x,
                    y: [100 - Number(data[i].y[0]), Number(data[i].y[0])]
                })
            }
            return result;
        }];

        $scope.changeMode = function() {
            $scope.pageUrl = null;
            $scope.pageType = null;
            $(".box.span6").css('display','none');
        };

        $scope.changeStat = function() {
            if (!$scope.stat) {
                $(".box-content").css('display','none');
                return;
            }
            $(".box-content").css('display','none');
            Loading.showLoading();
            $http.get('/ria/getSummary?cnt=' + $scope.stat.cnt).
                success(function(json, status, headers, config) {
                    if (json.code != 100000 || json.data.length <= 0) {
                        alert("服务器内部错误!");
                    }
                    $scope.sums = [];
                    var ret = json.data;
                    var length = ret.length;
                    var result = {};
                    for (var i = 0; i < ret.length; i++) {
                        // 计算成绩
                        switch(true) {
                            case ret[i].score >= 90:
                                ret[i].score += ' (A)';
                                break;
                            case ret[i].score >= 80:
                                ret[i].score += ' (B)';
                                break;
                            case ret[i].score >= 70:
                                ret[i].score += ' (C)';
                                break;
                            case ret[i].score >= 60:
                                ret[i].score += ' (D)';
                                break;
                            default:
                                ret[i].score += ' (E)';
                                break;
                        }
                        if (!result[ret[i].group]) {
                            result[ret[i].group] = [];
                        }
                        result[ret[i].group].push(ret[i]);
                    }
                    
                    for (var i in result) {
                        var len = result[i].length;
                        for (var j = 0; j < len; j++) {
                            // 设定group的值, 给anguler模板使用的,详见app/partials/ria.html
                            result[i][j].len = len;
                            $scope.sums.push(result[i][j]);
                        }
                    }
                    
                    $(".box-content").css('display','');
                    Loading.hideLoading();
                });
        };

        $scope.changeUrl = function() {
            if (!$scope.types) {
                $scope.types = types;
            }
            if ($scope.pageUrl) {
                $scope.pageType = types[0];
                $scope.changeType();
            }
            else {
                $scope.pageType = null;
                $(".box.span6").css('display','none');
            }
        };

        $scope.getDetail = function(url) {
            $scope.model = $scope.models[1];
            $scope.changeMode();

            for(var i in $scope.urls) {
                if ($scope.urls[i].addr === url) {
                    $scope.pageUrl = $scope.urls[i];
                    break;
                }
            }
            $scope.changeUrl();
        };

        var harView = null;

        var showWaterFall = function(index, time) {
            if ($scope.harLocker) {
                return;
            }
            $scope.harLocker = true;
            var URL = 'http://localhost/ria/getHar?index=' + index + '&time=' + time;
            $('#waterfall')[0].innerHTML = '';

            var settings = {
                jsonp: true
            }
            if (!harView) {
                var content = document.getElementById("harViewer");
                var harView = content.repObject = new HarPreview();
                var fn = function() {
                    harView.setRenderNode({
                        stats: $("#stats")[0],
                        waterfall: $("#waterfall")[0]
                    })
                }
                harView.initialize(content, fn);

                $("#harViewer").bind("onPreviewHARLoaded", function(event) {
                    $scope.harLocker = false;
                    $("#harViewer").css('display', '');
                    $(".box.span6").css('display','none');
                    $("#stats")[0].style.display = 'none';
                });
            }
            harView.loadHar(URL, settings);
        };

        var render = function (index, stack, flag) {
            return function(json) {
                if (json.code != 100000) {
                    return;
                }
                if (stack !== -1) {
                    CommonChart({
                        click: flag ? function(e) {
                            showWaterFall($scope.pageUrl._id, new Date(e.dataPoint.x).getTime());
                        } : null,
                        type: 'stackedArea100',
                        container: "chart" + index,
                        labels: stackChartsLabel[stack],
                        data: stackChartsDataProcess[stack](json.data.data)
                    }, {
                        // title: {text: ''},
                        toolTip: {
                            content: function(e){
                                var date = new Date(e.entries[0].dataPoint.x);
                                if (flag) {
                                    return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日' + date.getHours() + '时:</i> <strong>' + e.entries[0].dataPoint.y + "%</strong>";
                                }
                                
                                return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日:</i> <strong>' + e.entries[0].dataPoint.y + "</strong>";
                            }
                        },
                        axisX: {  
                                labelAngle: 150,
                                intervalType: "day",
                                valueFormatString: "M.D"
                        },
                        axisY: {
                            suffix: "%",
                            minimum: 0,
                            maximum: 100
                        },
                        data: []
                    });
                    return;
                }
                CommonChart({
                    click: flag ? function(e) {
                        showWaterFall($scope.pageUrl._id, new Date(e.dataPoint.x).getTime());
                    } : null,
                    'type' : 'line',
                    'container' : "chart" + index,
                    'labels' : json.data.label,
                    'data' : json.data.data
                }, {
                    toolTip: {
                        content: function(e){
                            var date = new Date(e.entries[0].dataPoint.x);
                            if (flag) {
                                return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日' + date.getHours() + '时:</i> <strong>' + Number(e.entries[0].dataPoint.y).toFixed(2) + (name==="时间"?"ms":"") + "</strong>";
                            }
                            return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日:</i> <strong>' + e.entries[0].dataPoint.y + "</strong>";
                        }
                    },
                    axisX: {
                        labelAngle: 150, 
                        intervalType: "hour",
                        valueFormatString: "M.D"
                    },
                    axisY: {suffix: flag ? "ms" : "", minimum: 0},
                    data: []
                });
            }
        };
            
        $scope.changeType = function(cnt) {
            if (!$scope.pageType) {
                $(".box.span6").css('display','none');
                return;
            }
            var flag = false;
            if ($scope.pageType.name === "时间") {
                flag = true;
            }
            $("#harViewer").css('display','none');
            $(".box.span6").css('display','');
            var prefix = $scope.pageType.uri + '?index=' + $scope.pageUrl._id + '&to=' + $scope.time +'&from=' + ($scope.time - (cnt?cnt:30) * 24 * 3600000) + '&type=';
            var i = 0;
            for (; i < $scope.pageType.types.length; i++) {
                $('.box.span6 .box-content')[i].style.display = '';
                $(".box h2")[i + 3].innerHTML = '<i class="icon-edit"></i> ' + $scope.pageType.names[i];

                var index = stackCharts.indexOf($scope.pageType.types[i]);
                $http.get(prefix + $scope.pageType.types[i]).success(render(i, index, flag));
            }

            for (; i < $('.box.span6').length; i++) {
                $('.box.span6')[i].style.display = 'none';
            }
        };

        /************************** init**************************/
        $http.get('/configure/getUrl').
            success(function(json, status, headers, config) {
                if (json.code != 100000 || json.data.length <= 0) {
                    alert("服务器内部错误!");
                }
                $scope.urls = json.data;
            });
        $scope.models = [
            {name: '数据概况', type: 1},
            {name: '详细统计', type: 2}
        ];
        $scope.model = $scope.models[0];
        $scope.stats = [
            {name: '每日', cnt: 1},
            {name: '每周', cnt: 7},
            {name: '每月', cnt: 30}
        ];
        $scope.stat = $scope.stats[1];
        $scope.changeStat();
        /************************** init end **********************/
    };
    app.register.controller('riaCtrl', ['$scope', '$http', '$routeParams', riaCtrl]);
});

'use strict';

define([
    'app',
    "lib/canvasjs/canvasjs"
], function (app) {
    var _http;
    var requestURL = ['/chart/getSumData?', '/chart/getISPData?', '/chart/getCityData?', '/chart/getSumData?']; 
    var labels = ['DNS时间', '建立连接时间', '首包时间', '首屏时间', '内容下载时间', '总下载时间'];
    var labelObjStr = ['DNS', 'client', 'fp', 'fs', 'html', 'load']
    var parsedTime = /*new Date().setHours(0, 0, 0, 0) - 24*60*60*1000*/1398787200000/*暂时替换*/;

    var getLabels = function(labelIndex){
        labelIndex = labelIndex.toString();
        if(labelIndex.length>1){
            var tmpLabels = labelIndex.split("");
            for(var i=0; i<labelIndex.length; i++){
                tmpLabels[i] = labels[tmpLabels[i]];
            }
        }else{
            if(labelIndex<6){
                var tmpLabels = [labels[labelIndex]];
            }else{
                var tmpLabels = false;
            }
        }
        return tmpLabels;
    }

    var assembleData = function(originData){
        var tmpChart =  new CanvasJS.Chart(originData.container ,{
            title: {},
            axisX:{},
            axisY:{minimum:0},
            data: []
        });
        if(originData.type == 'column'){
            var stackObj = {
                type: originData.type,
                legendText: "",
                showInLegend: originData.labels[i] ? true : false,
                dataPoints: []
            };
            for (var i = 0; i < originData.labels.length; i++) {
                stackObj.dataPoints.push({x:i, y:0, label:''});
                stackObj.dataPoints[i].label = originData.labels[i];
                if(originData.labels.length == 1){
                    stackObj.dataPoints[i].y = originData.data[0]['y'];
                    if((typeof stackObj.dataPoints[i].y) !== 'number'){
                        stackObj.dataPoints[i].y = originData.data[0]['y'][labelObjStr[i]];
                    }
                }else{
                    stackObj.dataPoints[i].y = originData.data[i][0]['y'];
                }
            }
            tmpChart.options.data.push(stackObj); 
        }else if(originData.type == 'line'){
            for (var i = 0; i < originData.labels.length; i++) {
                var stackObj = {
                    type: originData.type,
                    legendText: "",
                    showInLegend: originData.labels[i] ? true : false,
                    dataPoints: []
                };

                stackObj.legendText = originData.labels[i];
                for(var j=0;j<originData.data.length;j++){
                    stackObj.dataPoints.push({x:0, y:0});
                    stackObj.dataPoints[j].x = new Date(parsedTime - j*60000*60*24);
                    stackObj.dataPoints[j].y = originData.data[j]['y'][labelObjStr[i]];
                }

                tmpChart.options.data.push(stackObj); 
                
            }
        }
        tmpChart.render();
    }

    var requestType = function(index, labels, reqData, container){
        _http.get('http://10.13.49.237:3000' + requestURL[index] + reqData + '&time=' + parsedTime).
            success(function(json, status, headers, config) {
                var _dataModule = {
                    'type' : $(container).data('ctype'),
                    'container' : container.id,
                    'labels' : labels?labels:json.data.label,
                    'data' : json.data.data?json.data.data:json.data
                }                

                assembleData(_dataModule);
            });
    }

    window.initCharts = function(http){
        _http = http;
        setTimeout(function(){
            var chartContainters = $('.chart');
            for(var i=0; i<chartContainters.length; i++){
                var labels = getLabels($(chartContainters[i]).data('label'));
                requestType($(chartContainters[i]).data('type'), labels, $(chartContainters[i]).data('search'), chartContainters[i]);
            }
        },2000);
    }
    

    
});

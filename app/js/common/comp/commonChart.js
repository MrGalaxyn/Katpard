'use strict';

define([
    "lib/canvasjs/canvasjs"
], function () {
    function assembleChart(data, opts) {
        var tmpChart =  new CanvasJS.Chart(data.container, opts);
        var stack = tmpChart.options.data;
        if (!data.labels) {
            stack.push({
                click: data.click,
                type: data.type,
                showInLegend: false,
                dataPoints: []
            });
        }
        else {
            for (var i = 0; i < data.labels.length; i++) {
                if (data.data[0]['x']) {
                    stack.push({
                        click: data.click,
                        type: data.type,
                        legendText: data.labels[i],
                        showInLegend: true,
                        dataPoints: []
                    })
                }
                else {
                    stack.push({
                        click: data.click,
                        type: data.type,
                        showInLegend: false,
                        dataPoints: []
                    })
                }
            }
        }
        var cnt = 0;
        for(var j = 0; j < data.data.length; j++) {
            for (var i = 0; i < data.data[j]['y'].length; i++) {
                stack[i].dataPoints.push({
                    x: data.data[j]['x'] ? new Date(Number(data.data[j]['x'])) : cnt++,
                    y: Number(data.data[j]['y'][i]), 
                    label: data.data[j]['x'] ? (data.labels ? data.labels[i] : '') : data.labels[j]
                });
            }
        }
        stack[0].color = "#B0D0B0";

        return tmpChart;
    }

    return function(chartData, opts) {
        var chart = assembleChart(chartData, opts);
        chart.render();
    }
    // return refreshCharts;
});

jQuery(function($){
    'use strict';



    $.fn.trendPlot = function () {
        var jsonPointData1 = {
            name: 'Plant Effluent Flow',
            data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8],
            pointStart: Date.UTC(2013, 3, 26),
            pointInterval: 2 * 3600 * 1000 //2hrs
        }
        var jsonPointData2 = {
            name: 'Plant Influent Flow',
            data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6],
            pointStart: Date.UTC(2013, 3, 26),
            pointInterval: 2 * 3600 * 1000 //2hrs
        }

        var jsonTrendData = {
            pointData: [jsonPointData1, jsonPointData2]
        }

        $(this).highcharts({
            chart: {
                type: 'line',
            },
            title: {
                text: 'Monthly Average Flows',
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                    hour: '%H:%M'
                }
            },
            yAxis: {
                title: {
                    text: 'Millons of Gallons (MGD)'
                }
            },
            tooltip: {
                valueSuffix: 'MGD'
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                y: 150,
                x: -20
            },
            series: jsonTrendData.pointData
        });
    };

    $.fn.trendPlot2 = function (objOptions) {
        //console.log('Start Plot 2');
        var hcTrendObj = {};
        //var jsonPointObj1 = {
        //    upi: '22528',
        //    name: 'Analog Point 22528',
        //    type: 1,
        //}
        //var jsonPointObj2 = {
        //    upi: '22537',
        //    name: 'Analog Point 22537',
        //    type: 1,
        //}
        var theDiv = this;
        var ptsArray = [];

        if (objOptions.points !== undefined) {
            console.log('defined as ' + JSON.stringify(objOptions.points));
            ptsArray = objOptions.points;
        } else { console.log('Points not defined!'); return; }
        //var arrayPoints = [jsonPointObj1, jsonPointObj2];
        //jsonPointObj.div = $(this).getAttribute('id');

        getAPIData(ptsArray, function (objData) {
            console.log('Start API Function');
            var seriesArray = [];
            ptsArray.push('xl');

            $.each(ptsArray, function() {

                var jsonTrendPoint = {};
                var pointData;
                var seriesData = [];
                var seriesTime = [];
                var seriesInterval;
                var dtNow = new Date();
                var tester1 = 0;

                if (this == 'xl') {
                    console.log('Large Value');
                    jsonTrendPoint.name = 'Very Large Value';
                    pointData = objData[22537];
                    $.each(pointData, function () {
                        this.value = this.value * 10000 + 13496;
                    });
                    jsonTrendPoint.yAxis = 1;
                } else {
                    console.log('normal');
                    jsonTrendPoint.name = this;
                    console.log(jsonTrendPoint.name);
                    pointData = objData[jsonTrendPoint.name];
                    jsonTrendPoint.yAxis = 0;
                }
                //console.log('Data for ' + jsonTrendPoint.name + ' is ' + pointData);


                $.each(pointData, function () {
                    var pointObj = {};
                    //console.log(tester1);
                    pointObj.y = this.value;
                    pointObj.x = this.timestamp * 1000;
                    pointObj.dataLabels = {
                        enabled: false,
                        format: '',
                    }
                    if (this.upi == 22528) {
                        if (tester1 % 5 == 0) {
                            pointObj.color = '#FF0000';
                            pointObj.marker = {
                                fillColor: '#ff0000',
                                lineColor: '#ff0000',
                                states: {
                                    hover: {
                                        enabled: true,
                                        fillColor: '#ff0000',
                                        lineColor: '#ff0000',
                                    }
                                }
                            }
                            pointObj.dataLabels = {
                                enabled: false,
                                format: '(BAD)',
                            }
                            //console.log('red');
                        }
                    }
                    if(this.value > 652500) {
                        pointObj.marker = {
                            fillColor: '#ff0000',
                            lineColor: '#ff0000',
                            symbol: 'url(../img/icons/Alm.png)',
                            states: {
                                hover: {
                                    fillColor: '#ff0000',
                                    lineColor: '#ff0000',
                                }
                            },
                        };
                        //pointObj2.name = '(HIGH)';
                        pointObj.dataLabels = {
                            enabled: false,
                            format: '(HIGH)',
                            borderWidth: 1,
                            borderColor: '#ff0000',
                            backgroundColor: '#ffffff',
                            y: -10,
                        }
                    };
                    seriesData.push(pointObj);
                    seriesTime.push(this.timestamp);
                    tester1++;

                });
                //console.log('Data for ' + jsonTrendPoint.name + JSON.stringify(seriesData));
                var numData = seriesTime.length;

                if (seriesTime[0] > seriesTime[numData]) {
                    seriesData.reverse();
                    seriesTime.reverse();
                }
                //console.log(JSON.stringify(seriesData));

                seriesInterval = seriesTime[1] - seriesTime[0];

                jsonTrendPoint.data = seriesData;
                jsonTrendPoint.pointStart = seriesTime[0] * 1000;
                jsonTrendPoint.pointInterval = seriesInterval * 1000;
                //console.log(JSON.stringify(jsonTrendPoint));

                seriesData = [];
                seriesTime = [];
                seriesArray.push(jsonTrendPoint);

            });

            //console.log(JSON.stringify(seriesArray));

            hcTrendObj = {
                chart: {
                    backgroundColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                        stops: [
                            [0, 'rgb(255, 255, 255)'],
                            [1, '#BFCFDF']
                        ]
                    },
                    type: 'line',
                    credits: {
      enabled: false
  },
                    borderWidth: 2,
                    borderRadius: 20,
                    borderColor: '#5e87b0',
                    //width: 800,

                },
                colors: [
                    '#8E66B8',
                    '#33AD5C',
                    '#FD855a',
                    '#4572A7',
                    '#AA4643',
                    '#89A54E',
                    '#3D96AE',
                    '#DB843D',
                    '#92A8CD',
                    '#A47D7C',
                    '#80699B',
                    '#B5CA92'
                ],
                credits: {
                    href: 'http://dorsett-tech.com/scada-solutions/',
                    text: 'Dorsett Technologies',
                },
                title: {
                    text: 'Historical Data Chart',
                },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                        day: '%e. %b',
                    }
                },
                yAxis: [{
                    title: {
                        text: 'Engineering Units'
                    }
                }, {
                    title: {
                        text: 'Large Engineering Units',
                    },
                    opposite: true,
                }],
                tooltip: {
                    headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
                    valueSuffix: '',
                    valueDecimals: 3,
                    pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y} {point.dataLabels.format}</b><br/>',
                    //xDateFormat: '%e. %b, %Y %H:%M:%S'
                },
                legend: {
                    layout: 'vertical',
                    align: 'center',
                    verticalAlign: 'top',
                    y: 25,
                    //x: 100,
                },
                series: seriesArray,

            };

            if (objOptions.width !== undefined) {
                console.log('width defined as ' + objOptions.width)
                hcTrendObj.chart.width = objOptions.width;
            } else { console.log('width not defined'); }

            $(theDiv).highcharts(hcTrendObj);
            console.log('done api function');

        });



    }
    $.fn.stockPlot2 = function (objOptions) {



        var hsTrendObj = {};
        var seriesArray = [];
        var dtNow = new Date();
        var ptsArray = [];

        var theDiv = this;
        //var jsonPointObj1 = {
        //    upi: '22528',
        //    name: 'Analog Point 22528',
        //    type: 1,
        //}
        //var jsonPointObj2 = {
        //    upi: '22537',
        //    name: 'Analog Point 22537',
        //    type: 1,
        //}

        if (objOptions.points !== undefined) {
            console.log('Stock points defined as ' + JSON.stringify(objOptions.points));
            ptsArray = objOptions.points;
        } else { console.log('Stock points not defined!'); return; }

        getAPIData(ptsArray, function (objData) {
            console.log("Start Stock API Function");

            var objFlagGroup = [];

            // Create the chart
            $.each(ptsArray, function () {
                var jsonTrendPoint = {};
                var pointData;
                var seriesData = [];
                var seriesTime = [];
                var seriesInterval;
                var tester1 = 0;

                jsonTrendPoint.name = this;
                pointData = objData[this];

                $.each(pointData, function () {
                    var pointObj = {};
                    var flagObj = {};
                    //console.log(tester1);
                    pointObj.y = this.value;
                    pointObj.x = this.timestamp * 1000;
                    pointObj.dataLabels = {
                        enabled: false,
                        format: '',
                    }
                    if (tester1 % 5 == 0) {
                        pointObj.color = '#FF0000';
                        pointObj.marker = {
                            enabled: true,
                            fillColor: '#ff0000',
                            lineColor: '#ff0000',
                            states: {
                                hover: {
                                    enabled: true,
                                    fillColor: '#ff0000',
                                    lineColor: '#ff0000',
                                }
                            }
                        }
                        pointObj.dataLabels = {
                            enabled: false,
                            format: '(BAD)',
                        }
                        flagObj = {
                            type: 'flags',
                            data: [{
                                x: pointObj.x,
                                title: ' ',
                                text: 'High Alarm'
                            }],
                            onSeries: 'dataseries',
                            shape: 'url(../img/icons/Alm.png)',
                            width: 16,
                            color: '#ff00ff',
                            lineWidth: 1,
                            lineColor: '#000000',
                        }
                        objFlagGroup.push(flagObj);
                    }
                    seriesData.push(pointObj);
                    seriesTime.push(this.timestamp);
                    tester1++;
                });
                var numData = seriesTime.length;

                if (seriesTime[0] > seriesTime[numData]) {
                    seriesData.reverse();
                    seriesTime.reverse();
                }
                //console.log(JSON.stringify(seriesData));

                seriesInterval = seriesTime[1] - seriesTime[0];

                jsonTrendPoint.type = 'line';
                jsonTrendPoint.animation = false;
                jsonTrendPoint.id = 'dataseries';
                jsonTrendPoint.data = seriesData;
                jsonTrendPoint.tooltip = {
                    valueDecimals: 3
                };

                seriesArray.push(jsonTrendPoint);

                $.each(objFlagGroup, function () {
                    seriesArray.push(this);
                });
            });
            //console.log(JSON.stringify(seriesObjArray));

            $(theDiv).highcharts('StockChart', {

                chart: {
                    width: plotWidth,
                    height: plotHeight,
                    margin: 0,
                    marginTop: 30,
                    marginLeft:30,
                    marginRight:10,
                    marginBottom:10,
                     credits: {
                    href: 'http://dorsett-tech.com/scada-solutions/',
                    text: 'Dorsett Technologies',
                },
                
                
                title: {
                    text: 'Historical Data Chart',
                }
                },
                rangeSelector: {
                    selected: 1,
                    buttons: [{
                        type: 'hour',
                        count: 8,
                        text: '8hrs'
                    }, {
                        type: 'day',
                        count: 1,
                        text: '24hrs'
                    }, {
                        type: 'day',
                        count: 7,
                        text: '1wk'
                    }, {
                        type: 'month',
                        count: 1,
                        text: '1mo'
                    }, {
                        type: 'year',
                        count: 1,
                        text: '1yr'
                    }],


                },
                credits: {
                    enabled: false
                },

                title: {
                    text: plotTitle
                },

                yAxis: {
                    title: {
                        text: yaxis
                    }
                },

                series: seriesArray,

            });
        });
        console.log('End of Stock Trend');
    };

    $.fn.stockPlot1 = function () {
        $.getJSON('http://www.highcharts.com/samples/data/jsonp.php?filename=usdeur.json&callback=?', function (data) {

            // Create the chart
            $('#trendTest3').highcharts('StockChart', {


                rangeSelector: {
                    selected: 1
                },

                title: {
                    text: 'USD to EUR exchange rate'
                },

                yAxis: {
                    title: {
                        text: 'Exchange rate'
                    }
                },

                series: [{
                    name: 'USD to EUR',
                    data: data,
                    id: 'dataseries',
                    tooltip: {
                        valueDecimals: 4
                    }
                }, {
                    type: 'flags',
                    data: [{
                        x: Date.UTC(2011, 1, 14),
                        title: 'A',
                        text: 'Shape: "squarepin"'
                    }, {
                        x: Date.UTC(2011, 3, 28),
                        title: 'A',
                        text: 'Shape: "squarepin"'
                    }],
                    onSeries: 'dataseries',
                    shape: 'squarepin',
                    width: 16
                }, {
                    type: 'flags',
                    data: [{
                        x: Date.UTC(2011, 2, 1),
                        title: 'B',
                        text: 'Shape: "circlepin"'
                    }, {
                        x: Date.UTC(2011, 3, 1),
                        title: 'B',
                        text: 'Shape: "circlepin"'
                    }],
                    shape: 'circlepin',
                    width: 16
                }, {
                    type: 'flags',
                    data: [{
                        x: Date.UTC(2011, 2, 10),
                        title: 'C',
                        text: 'Shape: "flag"'
                    }, {
                        x: Date.UTC(2011, 3, 11),
                        title: 'C',
                        text: 'Shape: "flag"'
                    }],
                    color: '#5F86B3',
                    fillColor: '#5F86B3',
                    onSeries: 'dataseries',
                    width: 16,
                    style: {// text style
                        color: 'white'
                    },
                    states: {
                        hover: {
                            fillColor: '#395C84' // darker
                        }
                    }
                }]
            });
        });

    };

    $.fn.addPoints = function (arrayPoints) {
        var chart = $(this).highcharts();
        var flagExists = false;

        $.each(chart.series, function () {
            if (this.name == arrayPoints[0]) {
                console.log('exists');
                flagExists = true;
            };
        });
        if (flagExists) {
            alert('Tag is already on the chart.');
            return;
        } else { console.log('new'); }

        getAPIData(arrayPoints, function(objData) {
            console.log('Add AJAX complete');
            var objSeries = {};
            var seriesData = [];
            var seriesTime = [];

            if (objData.length < 2) {
                alert('Insufficient data available for ' + arrayPoints[0]);
                return;
            }

            console.log('has data ');
            $.each(objData, function () {
                var pointObj1 = {};
                pointObj1.y = this.value;
                pointObj1.x = this.timestamp * 1000;
                pointObj1.dataLabels = {
                    enabled: false,
                    format: '',
                }

                seriesData.push(pointObj1);
                seriesTime.push(this.timestamp);
            });

            var numData = seriesTime.length;

            if (seriesTime[0] > seriesTime[numData]) {
                console.log('reversed');
                seriesData.reverse();
                seriesTime.reverse();
            }
            console.log(JSON.stringify(seriesData));

            var seriesInterval = seriesTime[1] - seriesTime[0];

            objSeries.name = arrayPoints[0];
            objSeries.data = seriesData;
            objSeries.pointStart = seriesTime[0] * 1000;
            objSeries.pointInterval = seriesInterval * 1000;
            objSeries.yAxis = 0;

            //if (chart.series.length == 1) {
            console.log('Add call ' + JSON.stringify(objSeries));
            chart.addSeries(objSeries);
            //}
        });
    };

    var getAPIData = function (ptArray, callback){ //(criteria, thisDiv, callback) {
        //console.log('Start getAPI');
        var url = '/api/history/search';
        var dataObj = {
            'points': ptArray
        };

        $.ajax({
            url: url,
            type: "POST",
            data: dataObj,
            //dataType: "application/json",
        }).done(function (data) {
                var callbackData = {
                    'message': 'fail'
                }
                if (data == undefined || data == null) {
                    callback(callbackData);
                } else {
                    console.log('Sending data back'); //JSON.stringify(data));
                    callback(data);
                }

            }).fail(function (e) {
                console.log('AJAX Point Data Failed!')
            });
        //console.log('End getAPI');

    };

    $('#btnPointSel').click(function (event) {
        console.log('func call');
        $('#psFrame').show();
        console.log('is it showing?');
    });

    $('.btnAdd').click(function (event) {
        var addUPI;
        addUPI = this.getAttribute('id');
        console.log('Add point ' + addUPI);
        $('#trendTest1').addPoints([addUPI]);
        console.log('Add done');
    });

    $('#btnSize').click(function (event) {
        //var hsChart = $('#trendTest1').highcharts();

        //hsChart.setSize(400, 400);
        getAPIData();
    });

    $('#btnReset').click(function (event) {
        var hsChart = $('#trendTest1').highcharts();
        var container = hsChart.container;
        var chartDiv = $(container).parent();
        var fullHieght = $(chartDiv).height();
        var fullWidth = $(chartDiv).width();

        //console.log('Size: ' + fullHieght + ', ' + fullWidth);
        hsChart.setSize(fullWidth, fullHieght);
    });

}); 

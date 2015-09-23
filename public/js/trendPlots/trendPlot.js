var myChart;
var currIndex = 1;
var numRows = null;
var numDays = 60;
var upis = [643767, 643899, 643901, 729780, 730050, 643769, 643771, 643773, 643775, 643893, 643895, 643897, 2929, 2930, 2932, 2933, 2934, 2935];
var startTimestamp = 1421699334;
var endTimestamp = new Date().getTime()/1000;
//var startTimestamp = 1421699334;
//var endTimestamp = 1421879400;
var colors = Highcharts.theme.colors;
var $container = $('#container');
var $outerContainer = $('#outerContainer');
var $configureChartModal = $('#configureChartModal');
var renderedChart = false;
var minX = 9999999999999;
var maxX = 0;
var openConfigureWindow = function() {
    $configureChartModal.modal('show');
};
var hideChart = function() {
    $outerContainer.css('visibility', 'hidden');
};
var showChart = function() {
    $outerContainer.css('visibility', 'visible');
};
var TrendPoint = function(cfg) {
    var self = this,
        rows = cfg.seriesRows,
        yAxis = cfg.yAxis,
        index = cfg.seriesUPI,
        axisConfig = {
            labels: {
                // enabled: false,
                formatter: function() {
                    return this.value.toFixed(5);
                },
                format: cfg.format,
                style: {
                    color: cfg.labelStyle
                }
            },
            prevTitle: cfg.titleText,
            title: {
                text: cfg.titleText,
                style: {
                    color: cfg.labelStyle
                }
            },
            offset: 0,
            type: 'linear',
            opposite: !!cfg.opposite
        },
        seriesConfig = {
            name: cfg.seriesName,
            type: cfg.seriesType,//'arearange'
            yAxis: yAxis,
            data: [],
            animation: false,
            color: cfg.labelStyle,
            tooltip: {
                valueSuffix: cfg.seriesSuffix
            }
        };

    self.getData = function(cb) {
        $.ajax({
            url: '/api/trendPlots/',
            type: 'POST',
            dataType: 'json',
            data: {
                id: index,
                rows: numRows,
                numDays: window.bindings.numDays(),
                start: startTimestamp,
                end: endTimestamp
            }
        }).done(function(response) {
            var data = response.data || [],
                newData = [],
                c,
                row,
                ts,
                // ts1,
                minY = Number.MAX_VALUE,
                maxY = Number.MIN_VALUE,
                len = data.length;

            console.log('Returned data (' + index + '):', data.length);

            for(c=0; c<len; c++) {
                row = data[c];
                row.timestamp *= 1000;
                // ts = parseFloat(row.Value);
                ts = parseFloat(row.high);
                // ts = parseFloat(row.Value.toFixed(3));

                if(ts > maxY) {
                    maxY = ts;
                }
                if(ts < minY) {
                    minY = ts;
                }

                if(row.timestamp > maxX) {
                    maxX = row.timestamp;
                }
                if(row.timestamp < minX) {
                    minX = row.timestamp;
                }

                newData.push([row.timestamp, ts]);
            }

            if(maxY === Number.MIN_VALUE) {
                maxY = 1;
            }

            newData.sort(function(a, b) {
                return (a[0] > b[0])?1:-1;
            });

            // axisConfig.min = (index === upis[0])?minY:undefined;
            // axisConfig.max = (index === upis[0])?maxY:undefined;
            // axisConfig.min = cfg.seriesMinY;
            // axisConfig.max = cfg.seriesMaxY;

            seriesConfig.data = newData;
            cb();
        });
    };

    return {
        axisConfig: axisConfig,
        seriesConfig: seriesConfig,
        getData: self.getData,
        index: self.index
    };
};

var Chart = function(cfg) {
    var self = this,
        pointCount = 0,
        chartConfig = {
            animation: false,
            exporting: {
                buttons: {
                    contextButton: {
                        enabled: false
                    },
                    customButton: {
                        align: 'left',
                        text: 'Configure',
                        _titleKey: 'configureChart',
                        onclick: function () {
                            openConfigureWindow();
                        }
                    }
                }
            },
            chart: {
                zoomType: 'xy',
                renderTo: 'container',
                type: 'spline',
                // type: 'areaspline',
                events: {
                    selection: function(event) {
                        var currAxis = self.visibleAxis;

                        console.log('selection');

                        hideChart();

                        self.showAxis();

                        setTimeout(function() {
                            self.showAxis(currAxis);
                            showChart();
                        }, 1);
                    }
                //     click: function(event) {
                //         console.log(event);
                //     }
                }
            },
            plotOptions: {
                line: {
                    marker: {
                        enabled: false
                    }
                },
                spline: {
                    marker: {
                        enabled: false
                    }
                },
                series: {
                    events: {
                        legendItemClick: function() {
                            var idx = this._i;
                            self.showAxis(idx);
                            return false;
                        }
                    }
                }
            },
            title: {
                text: cfg.title
            },
            yAxis: [],
            tooltip: {
                crosshairs: [true],
                animation: false,
                hideDelay: 100,
                shared: true,
                valueDecimals: 5,
                positioner: function(labelWidth, labelHeight, point) {
                    var x = point.plotX,
                        y = point.plotY;

                    return {
                        y: 30,
                        x: x
                    };
                }
            },
            legend: {//configurable or no?
                // verticalAlign: 'top',
                // floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
            },
            series: []
        };

    minX = 9999999999999;
    maxX = 0;

    self.getChartCfg = function() {
        return chartConfig;
    };

    self.render = function(cfg) {
        hideChart();

        // if(renderedChart && self.chart) {
        //     self.chart.destroy();
        // }

        renderedChart = true;

        self.chart = new Highcharts.Chart(cfg);//$container.highcharts(cfg);

        self.showAxis(0);

        showChart();
    };

    self.showAxis = function(idx) {
        var c,
            list = self.chart.yAxis,
            len = list.length;

        if(idx !== undefined) {
            self.visibleAxis = idx;
        } else {
            self.visibleAxis = -1;
        }

        // console.time('showaxis' + idx);

        for(c=0; c<len; c++) {
            if(c === idx || idx === undefined) {
                list[c].show();
            } else {
                list[c].hide();
            }
        }

        self.chart.redraw();

        // console.timeEnd('showaxis' + idx);
    };

    self.points = [];

    self.title = cfg.title;

    self.addPoint = function(pCfg, cb) {
        var idx = pointCount++,
            trendPoint;

        pCfg.yAxis = idx;

        trendPoint = new TrendPoint(pCfg);

        self.points.push(trendPoint);

        trendPoint.getData(function() {
            // if(chartConfig.yAxis.length === 0) {
                chartConfig.yAxis.push(trendPoint.axisConfig);
            // }

            chartConfig.series.push(trendPoint.seriesConfig);

            cb();
        });
    };
};
var init = function(config) {
    var tp = new Chart({
            title: config.chartTitle
        }),
        count = 0,
        list = config.chartSeries,
        len = list.length,
        row,
        c = 0,
        getNext = function() {
            row = list[c];
            tp.addPoint({
                seriesUPI: parseInt(row.seriesUPI, 10),
                seriesName: row.seriesName,
                seriesType: row.seriesType,
                seriesMinY: row.seriesMinY,
                seriesMaxY: row.seriesMaxY,
                format: row.format,
                labelStyle: colors[count % colors.length],// row.labelStyle || '#f4f4f4',
                titleText: row.titleText,
                seriesSuffix: row.seriesSuffix,
                seriesRows: row.seriesRows
            }, function() {
                var cfg = tp.getChartCfg();
                count++;
                c++;
                if(c=== len) {
                    cfg.xAxis = [{
                        min: minX,
                        max: maxX,
                        type: 'datetime',
                        reversed: config.chartReversed
                    }];
                    myChart = tp;
                    myChart.cfg = cfg;
                    // console.log('final cfg', cfg);

                    myChart.render(cfg);
                } else {
                    getNext();
                }
            });
        };

    getNext();
};
var firstSeries = {
    seriesUPI: ko.observable(643738),
    seriesName: ko.observable('Point1'),
    seriesType: ko.observable('line'),
    seriesMinY: ko.observable(0),
    seriesMaxY: ko.observable(1),
    format: ko.observable('{value}'),
    labelStyle: ko.observable('#ff4400'),
    titleText: ko.observable('Value1'),
    seriesSuffix: ko.observable(),
    seriesRows: ko.observable(100)
};
var getSeriesTemplate = function(upi) {
    var obj,
        idx = currIndex;

    currIndex++;

    obj = {
        seriesUPI: ko.observable(upi),
        seriesName: ko.observable('Point' + idx),
        seriesType: ko.observable('line'),
        format: ko.observable('{value}'),
        seriesMinY: ko.observable(0),
        seriesMaxY: ko.observable(1),
        labelStyle: ko.observable(),
        titleText: ko.observable('Value' + idx),
        seriesSuffix: ko.observable(),
        seriesRows: ko.observable(100)
    };

    return obj;
};
var bindings = {
    chartTitle: ko.observable('Chart Title'),
    chartReversed: ko.observable(false),
    chartSeries: ko.observableArray([]),
    numDays: ko.observable(numDays),
    buildChart: function() {
        var config = ko.toJS(bindings);
        init(config);
    },
    addSeries: function(upi) {
        bindings.chartSeries.push(getSeriesTemplate(upi));
    }
};

$(function() {
    var c,
        len = upis.length;

    (function (HC) {
        HC.wrap(HC.Axis.prototype, 'render', function (p) {
            if (this.visible === undefined) {
                this.visible = true;
            }
            if(this.visible) {
                this.min = this.prevMin || this.min;
                this.max = this.prevMax || this.max;
                this.title = this.prevtitle || this.title;
            } else {
                this.prevMin = this.min;
                this.prevMax = this.max;
                this.prevtitle = this.title;
                this.min = undefined;
                this.max = undefined;
                this.title = undefined;
            }

            this.hasData = this.visible;

            p.call(this);
        });

        HC.Axis.prototype.hide = function() {
            if(this.visible) {
                //find better way
                this.labelGroup.element.style.display = 'none';
                this.axisGroup.element.style.display = 'none';

                // this.prevTitle = this.options.title.text;

                // this.update({
                //     labels: {
                //         enabled: false
                //     },
                //     title: {
                //         text: null
                //     }
                // });
                this.visible = false;
            // } else {
            //     console.log('already hidden');
            }
            // this.prevTitle = this.options.title;
            // this.prevMin = this.min;
            // this.prevMax = this.max;

            // this.setTitle(null);
            // this.min = null;
            // this.max = null;

            // this.visible = false;

            // this.render();

            // HC.each(this.plotLinesAndBands, function (plotLine) {
            //     plotLine.render();
            // });
        };

        HC.Axis.prototype.show = function() {
            if(this.visible === false) {
                this.labelGroup.element.style.display = 'inline';
                this.axisGroup.element.style.display = 'inline';
                // this.labelGroup.element.style.display = 'none';

                // this.update({
                //     labels: {
                //         enabled: true
                //     },
                //     title: {
                //         text: this.prevTitle || this.options.title.text
                //     }
                // });

                this.visible = true;

            }
            // this.setTitle(this.prevTitle || this.options.title);
            // this.min = this.prevMin || this.min;
            // this.max = this.prevMax || this.max;

            // this.visible = true;

            // this.render();

            // HC.each(this.plotLinesAndBands, function (plotLine) {
            //     plotLine.render();
            // });
        };

    }(Highcharts));

    ko.applyBindings(bindings);

    for(c=0; c<5; c++) {
        bindings.addSeries(upis[c]);
    }

    init(ko.toJS(bindings));
});

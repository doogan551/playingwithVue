var trendPlots = {
        logLinePrefix: true,
        numberWithCommas: function (theNumber) {
            if (theNumber !== null && theNumber !== undefined) {
                if (theNumber.toString().indexOf(".") > 0) {
                    var arr = theNumber.toString().split('.');
                    return arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + arr[1];
                } else {
                    return theNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }
            } else {
                return "";
            }
        },
        emptyFn: function (){ return; },
        onReadyFns: [],
        onReady: function (fn) {
            if(!trendPlots.highchartsLoaded) {
                trendPlots.onReadyFns.push(fn);
            } else {
                fn();
            }
        },
        formatDate: function (date, addSuffix) {
            var functions = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
                lengths = [2,2,2,3],
                separators = [':',':',':',''],
                suffix = ' --',
                fn,
                out = '';

            if(addSuffix) {
                separators.push(suffix);
            }

            if(typeof date === 'number') {
                date = new Date(date);
            }

            for(fn in functions) {
                if(functions.hasOwnProperty(fn)) {
                    out += ('000' + date['get' + functions[fn]]()).slice(-1 * lengths[fn]) + separators[fn];
                }
            }

            return out;
        },
        log: function () {
            var stack,
                steps,
                lineNumber,
                err,
                now = new Date(),
                args = [].splice.call(arguments, 0),
                pad = function (num) {
                    return ('    ' + num).slice(-4);
                },
                formattedTime = trendPlots.formatDate(new Date(), true);

            if(trendPlots.logLinePrefix === true) {
                err = new Error();
                if(Error.captureStackTrace) {
                    Error.captureStackTrace(err);

                    stack = err.stack.split('\n')[2];

                    steps = stack.split(':');

                    lineNumber = steps[2];

                    args.unshift('line:' + pad(lineNumber), formattedTime);
                }
            }
            // args.unshift(formattedTime);
            if(!trendPlots.noLog) {
                console.log.apply(console, args);
            }
        },
        forEach: function (obj, fn) {
            var keys = Object.keys(obj),
                c,
                len = keys.length,
                errorFree = true;

            for(c=0; c<len && errorFree; c++) {
                errorFree = fn(obj[keys[c]], keys[c], c);
                if(errorFree === undefined) {
                    errorFree = true;
                }
            }

            return errorFree;
        },
        forEachArray: function (arr, fn) {
            var c,
                list = arr || [],
                len = list.length,
                errorFree = true;

            for(c=0; c<len && errorFree; c++) {
                errorFree = fn(list[c], c);
                if(errorFree === undefined) {
                    errorFree = true;
                }
            }

            return errorFree;
        },
        createNamespace: function (obj, path, val) {
            var levels = path.split('.'),
                currObj = obj;

            trendPlots.forEachArray(levels, function (level, idx) {
                currObj[level] = currObj[level] || {};

                if(idx === levels.length - 1 && val !== undefined) {
                    if(typeof currObj[level] === 'object' && typeof val === 'object') {
                        $.extend(true, currObj[level], val);
                    } else {
                        currObj[level] = val;
                    }
                } else {
                    currObj = currObj[level];
                }
            });

            return obj;
        },
        complicateObject: function (map, simple, complex) {
            var ns = trendPlots.createNamespace;

            trendPlots.forEach(map, function (dst, prop) {
                var src = simple[prop];

                if(src !== undefined) {
                    complex = ns(complex, dst, src);
                }

            });

            return complex;
        },
        typeConfigs: {//store these in the DB, dynamically add new types?
            "line": {},
            "arearange": {
                requiresMore: true
            },
            "areaspline": {

            },
            "bar": {},
            "column": {
                cfg: function (cfg) {
                    return {
                        plotOptions: {
                            column: {
                                // pointWidth: cfg.width && cfg.data && cfg.data.data && cfg.data.data.length > 0?cfg.width/cfg.data.data[0].data.length * 0.4:15
                            }
                        },
                        series: [{
                            connectNulls: true

                        }],
                        tooltip: {
                            shared: true,
                            useHTML: true
                        }
                    };
                }
            },
            "columnrange": {
                requiresMore: true
            },
            "gauge": {
                requiresMore: true,
                cfg: function (cfg) {
                    var ret,
                        minMeasurement,
                        size = cfg.size || 1,
                        getDefaultPlotBands = function () {
                            return [{
                                from: 0,
                                to: Math.round(cfg.max * 0.6),
                                color: '#55BF3B' // green
                            }, {
                                from: Math.round(cfg.max * 0.6),
                                to: Math.round(cfg.max * 0.8),
                                color: '#DDDF0D' // yellow
                            }, {
                                from: Math.round(cfg.max * 0.8),
                                to: cfg.max,
                                color: '#DF5353' // red
                            }];
                        },
                        plotBands = cfg.colorStops?$.extend(true, [], cfg.colorStops):null,
                        plotBandType = cfg.colorStopsType,
                        convertToStatic = function (band) {
                            var tmpBand = {
                               from: Math.round(band.from/100 * cfg.max),
                               to: Math.round(band.to/100 * cfg.max),
                               color: (band.color.match('#')?'':'#') + band.color
                            };

                            return tmpBand;
                        },
                        validatePlotBands = function () {
                            var valid = true;
                            trendPlots.forEachArray(plotBands, function (band) {
                                if(isNaN(parseFloat(band.from)) || isNaN(parseFloat(band.to))) {
                                    valid = false;
                                } else {
                                    band.from = parseFloat(band.from);
                                    band.to = parseFloat(band.to);
                                    band.color = (band.color.match('#')?'':'#') + band.color;
                                }

                                return valid;
                            });

                            return valid;
                        };

                    cfg.max = Math.round(cfg.max);

                    minMeasurement = Math.min(cfg.width, cfg.height);

                    if(plotBands && validatePlotBands()) {
                        if(plotBandType === 'percent') {
                            trendPlots.forEachArray(plotBands, function (band, idx) {
                                plotBands[idx] = convertToStatic(band);
                            });
                        }
                    } else {
                        plotBands = getDefaultPlotBands();
                    }

                    ret = {
                        chart: {
                            type: 'gauge',
                            plotBackgroundColor: null,
                            plotBackgroundImage: null,
                            plotBorderWidth: 0,
                            plotShadow: false
                        },

                        title: {
                            text: 'Speedometer'
                        },

                        pane: {
                            size: Math.round(size * 100) + '%',
                            startAngle: -150,
                            endAngle: 150,
                            background: []
                        },

                        tooltip: {
                            enabled: false
                        },

                        // the value axis
                        yAxis: {
                            min: 0,
                            max: cfg.max,

                            minorTickInterval: null,
                            // minorTickWidth: 1,
                            // minorTickLength: Math.round(cfg.max / 10),
                            // minorTickPosition: 'inside',
                            // minorTickColor: '#666',

                            tickInterval: cfg.max,
                            // tickWidth: 2,
                            // tickPosition: 'inside',
                            // tickLength: 10,
                            // tickColor: '#666',
                            labels: {
                                step: 1,
                                distance: Math.round(size * 10),
                                rotation: 'none'
                            },
                            title: {
                                text: cfg.units
                            },
                            plotBands: plotBands
                        },

                        series: [{
                            dataLabels: {
                                format: '<div style="text-align:center"><span style="font-size:' + (minMeasurement/120 * (cfg.size || 1)) + 'em;color:' +
                                    'black' + '">{y:,.1f}</span><br/>' +
                                       '<span style="font-size:' + (minMeasurement/120 * (cfg.size || 1)) + 'em;color:silver">' + (cfg.units || '') + '</span></div>'
                            }
                        }],
                        plotOptions: {
                            gauge: {
                                dataLabels: {
                                    borderWidth: 0,
                                    y: 0,
                                    useHTML: true
                                }
                            }
                        }

                    };
                    return ret;
                }
            },
            "heatmap": {},
            "pie": {},
            "solidgauge": {
                cfg: function (cfg) {
                    var minMeasurement,
                        size = (cfg.size || 1) * 1.6,
                        getDefaultStops = function () {
                            return [
                                [0.1, '#55BF3B'], // green
                                [0.5, '#DDDF0D'], // yellow
                                [0.9, '#DF5353'] // red
                            ];
                        },
                        stops = cfg.colorStops?$.extend(true, [], cfg.colorStops):null,
                        plotBandType = cfg.colorStopsType,
                        convertStops = function () {
                            var ret = [];

                            trendPlots.forEachArray(stops, function (stop, idx) {
                                var val = stop.to/100,//(idx === stops.length - 1)?stop.from:stop.to,
                                    tmpBand = [val, (stop.color.match('#')?'':'#') + stop.color];

                                ret.push(tmpBand);
                            });

                            return ret;
                        },
                        validateStops = function () {
                            var valid = true;
                            trendPlots.forEachArray(stops, function (stop) {
                                if(isNaN(parseFloat(stop.from)) || isNaN(parseFloat(stop.to))) {
                                    valid = false;
                                } else {
                                    stop.from = parseFloat(stop.from);
                                    stop.to = parseFloat(stop.to);
                                    stop.color = (stop.color.match('#')?'':'#') + stop.color;
                                }

                                return valid;
                            });

                            return valid;
                        };

                    cfg.max = Math.round(cfg.max);

                    minMeasurement = Math.min(cfg.width, cfg.height);

                    if(stops && validateStops()) {
                        stops = convertStops();
                        // if(plotBandType === 'percent') {
                        //     trendPlots.forEachArray(stops, function (band, idx) {
                        //         stops[idx] = convertToStatic(band);
                        //     });
                        // } else {
                        //     stops[]
                        // }
                    } else {
                        stops = getDefaultStops();
                    }

                    return {
                        pane: {
                            center: ['50%', '85%'],
                            size: Math.round(size * 100) + '%',
                            startAngle: -90,
                            endAngle: 90,
                            background: {
                                backgroundColor: '#EEEEEE',
                                innerRadius: '60%',
                                outerRadius: '100%',
                                shape: 'arc'
                            }
                        },

                        tooltip: {
                            enabled: false
                        },

                        // the value axis
                        yAxis: {
                            min: 0,
                            max: cfg.max,
                            stops: stops,
                            // minColor: '#55BF3B',
                            // maxColor: '#55BF3B',
                            lineWidth: 0,
                            minorTickInterval: null,
                            tickInterval: cfg.max,
                            // tickWidth: 0,
                            title: {
                                y: -70//needs to be calculated
                            },
                            labels: {
                                step: 1,
                                y: 16
                            }
                        },

                        plotOptions: {
                            solidgauge: {
                                dataLabels: {
                                    y: 5,
                                    borderWidth: 0,
                                    useHTML: true
                                }
                            }
                        },

                        series: [{
                            dataLabels: {
                                format: '<div style="text-align:center"><span style="font-size:' + (minMeasurement/120 * (cfg.size || 1)) + 'em;color:' +
                                    'black' + '">{y:,.1f}</span><br/>' +
                                       '<span style="font-size:' + (minMeasurement/120 * (cfg.size || 1)) + 'em;color:silver">' + cfg.units + '</span></div>'
                            }
                        }]
                    };
                },
                requiresMore: true
            },
            "spline": {},
        },
        defaults: {
            highChartDefaults: {
                // chart: {
                //     zoomType: 'x'
                // },
                credits: {
                    enabled: false
                }
            }
        },
        init: function () {
            var scriptList = ['highcharts', 'highcharts-more', '/modules/solid-gauge', '/modules/no-data-to-display'],//should be per type
                ext = '.js',
                base = '/js/lib/',
                completed = 0,
                getScr,
                cb = function () {
                    completed++;
                    if(completed === scriptList.length) {
                        Highcharts.setOptions({
                            global: {
                                useUTC: false
                            },
                            lang: {
                                decimalPoint: '.',
                                thousandsSep: ','
                            }
                        });
                        trendPlots.highchartsLoaded = true;
                        while(trendPlots.onReadyFns.length) {
                            trendPlots.onReadyFns.pop()();
                        }
                    } else {
                        getScr();
                    }
                },
                err = function () {
                    trendPlots.log('error with getscript', arguments);
                };

            getScr = function () {
                var scr = scriptList[completed];

                $.getScript(base + scr + ext).done(cb).fail(err);
            };

            if(Highcharts) {
                scriptList.shift();
            }

            getScr();
        }
    },
    emptyFn = trendPlots.emptyFn,
    TrendPlot = function (config) {
        var trendSelf = this,
            log = trendPlots.log,
            $renderTo = $(config.target),
            instance,
            updateData = function (data) {
                var config = trendSelf.initialConfig,
                    newData;

                config.data = data;

                instance.destroy();
                trendSelf.drawChart(config);
            },
            updateConfig = function (cfg) {
                if(cfg.data) {
                    updateData(cfg.data);
                }
                log(cfg);
            },
            destroy = function () {
                if (instance.container !== undefined) {
                    instance.destroy();
                }
            };

        trendSelf.getParsedData = function (cfg, series) {
            var c,
                x,
                y,
                newData = series.data,
                maxY = -99999999,
                maxIdx = -1,
                rawData = newData || cfg.data || [],
                xProp = cfg.x,
                yProp = cfg.y,
                xValueFormatter = cfg.xValueFormatter,
                len = rawData.length,
                data = [],
                row,
                highlight = function (pt) {
                    var red = '#ff2222',
                        matrix = {
                            column: {
                                color: red
                            },
                            line: {
                                marker: {
                                    fillColor: red
                                }
                            }
                        };

                    pt = $.extend(pt, matrix[series.type || cfg.type]);

                    return pt;
                },
                makePoint = function (xx, yy) {
                    var pt = {};
                    pt.x = xx;
                    pt.y = yy;

                    return pt;
                };

            for(c=0; c<len; c++) {
                row = rawData[c];
                x = row[xProp];
                if(xValueFormatter) {
                    x = xValueFormatter(x);
                }
                y = row[yProp];
                if(y > maxY) {
                    maxY = y;
                    maxIdx = c;
                }
                if(x !== undefined) {
                    // data.push([x, y]);
                    data.push({
                        rawX: row[cfg.rawX],
                        x: x,
                        y: y
                    });
                } else {
                    data.push(y);
                }
            }

            if(cfg.highlightMax) {
                data[maxIdx] = highlight(data[maxIdx]);
            }

            return data;
        };

        trendSelf.parseConfig = function (cfg) {//get type, apply defaults for that type (and morph data?)
            var yTitle = cfg.yAxisTitle || '',
                xAxisReversed = cfg.xAxisReversed || false,
                legend = cfg.legend || false,
                type = cfg.type || 'line',
                width = cfg.width || 600,
                tooltip = cfg.tooltip || null,
                ret = {
                    chart: {
                        renderTo: $renderTo[0],
                        alignTicks: false
                    },
                    xAxis: {
                        type: 'datetime',
                        dateTimeLabelFormats: {
                            hour: '%I:%M %p'
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    series: []
                },
                data = [],
                row,
                x,
                y,
                tmpAxis,
                tmpSeries,
                counter = 0,
                addedAxis = {},
                configMap = {
                    legend: 'legend.enabled',
                    yAxisTitle: 'yAxis.title.text',
                    width: 'chart.width',
                    height: 'chart.height',
                    type: 'chart.type',
                    title: 'title.text',
                    xLabelFormat: 'xAxis.dateTimeLabelFormats',
                    minY: 'yAxis.min',
                    maxY: 'yAxis.max',
                    animation: 'plotOptions.series.animation'
                },
                defaultCfg = ((trendPlots.typeConfigs[type] || {}).cfg || trendPlots.emptyFn)(cfg);

            if(cfg.title === undefined) {
                cfg.title = ' ';//no title, blank
            }

            if(cfg.chart !== undefined) {
                ret.chart = $.extend(true, {}, ret.chart, cfg.chart);
            }

            if (!cfg.units && cfg.yAxisTitle) {
                cfg.units = cfg.yAxisTitle;
            }

            if(cfg.hideLegendXLabel) {
                ret.tooltip = (!!tooltip ? tooltip : {
                    formatter: function () {
                        var ret = '',
                            self = this;

                        $.each(this.points, function (idx) {
                            ret += '<span style="color:' + this.point.color + '">●</span> ' + this.series.name + ': <b>' + trendPlots.numberWithCommas(this.y) + ' ' + (this.series.userOptions.units || '') + '</b>';
                            if (idx < self.points.length - 1) {
                                ret += '<br/>';
                            }
                        });

                        return ret;
                    }
                });
            } else {
                ret.tooltip = (!!tooltip ? tooltip : undefined);
            }

            ret = trendPlots.complicateObject(configMap, cfg, $.extend(true, {}, defaultCfg, ret));

            if(cfg.plotOptions) {
                trendPlots.createNamespace(ret, 'plotOptions.' + type, cfg.plotOptions);
            }

            if(!Array.isArray(cfg.data)) {
                cfg.data = [cfg.data];
            }

            tmpSeries = $.extend(true, {}, ret.series[0]);
            ret.series = [];
            if(!cfg.sameAxis) {
                tmpAxis = $.extend(true, {}, ret.yAxis);
                ret.yAxis = [];
                ret.chart = $.extend(true, ret.chart, {
                    events: {
                        load: function (event) {
                            var me = this;
                            trendPlots.forEachArray(me.series, function (series, idx) {
                                series.yAxis.update({
                                    lineColor: series.color,
                                    labels: {
                                        style: {
                                            color: series.color
                                        }
                                    },
                                    title: {
                                        style: {
                                            color: series.color
                                        }
                                    }
                                });
                            });

                            // trendPlots.forEachArray(me.yAxis, function (axis, idx) {
                            //     axis.update({
                            //         lineColor: me.series[idx].color,
                            //         labels: {
                            //             style: {
                            //                 color: me.series[idx].color
                            //             }
                            //         },
                            //         title: {
                            //             style: {
                            //                 color: me.series[idx].color
                            //             }
                            //         }
                            //     });
                            // });
                        }
                    }
                });
            }

            trendPlots.forEachArray(cfg.data, function (series) {
                var data = trendSelf.getParsedData(cfg, series),
                    type = series.type || cfg.type,
                    newSeries = $.extend(true, {}, {
                        type: type,
                        data: data,
                        name: series.name,
                        color: series.color
                    }, tmpSeries);

                if(series.yAxis !== undefined) {
                    newSeries.yAxis = series.yAxis;
                    if (!addedAxis[series.yAxis]) {
                        tmpAxis.opposite = counter % 2 === 1;
                        ret.yAxis.push($.extend(true, {}, tmpAxis));
                    }
                    addedAxis[series.yAxis] = true;
                } else {
                    newSeries.yAxis = counter;
                    tmpAxis.opposite = counter % 2 === 1;
                    ret.yAxis.push($.extend(true, {}, tmpAxis));
                    counter++;
                }

                if(series.units || cfg.units) {
                    newSeries = $.extend(true, newSeries, {
                        tooltip: (!!tooltip ? tooltip : {
                            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y:,.1f} ' + (series.units || cfg.units) + '</b><br/>'
                            // valueSuffix: ' ' + series.units
                        }),
                        units: series.units
                    });
                }

                ret.series.push(newSeries);
            });

            trendSelf.currParsedConfig = ret;

            return ret;
        };

        trendSelf.drawChart = function (newConfig) {
            var highChartConfig = trendSelf.parseConfig(newConfig || config);

            highChartConfig = $.extend(true, {}, trendPlots.defaults.highChartDefaults, highChartConfig);

            trendSelf.lastConfig = $.extend(true, {}, highChartConfig);

            // if(trendPlots.logconfig) {
                // trendPlots.log('Trendplot Config:', highChartConfig);
            // }

            instance = new Highcharts.Chart(highChartConfig);
        };

        trendPlots.onReady(function () {
            trendSelf.drawChart();
        });

        trendSelf.initialConfig = $.extend(true, {}, config);

        return {
            updateData: updateData,
            updateConfig: updateConfig,
            _getInstance: function () {
                return instance;
            },
            destroy: destroy,
            _trendSelf: trendSelf
        };
    };

trendPlots.init();

// trendPlots.config = {
//     title: 'Test Title',
//     charts: {
//         'Chart1Title': {
//             series: ['Series1Title'],
//             config: {}
//         }
//     },
//     series: {
//         'Series1Title': {
//             type: 'line'//line, arearange, bar, column, columnRange, gauge, heatmap, pie, solidGauge, spline
//         }
//     }
// };



// trendPlots.bindings = {
//     chartTypes: ko.observableArray(['Line', 'Bar', 'Column']),
//     chartType: ko.observable('Line')
// };

// trendPlots.bindings.chartType.subscribe(function (newChartType) {
//     $('.hides:not(.' + newChartType.toLowerCase() + ')').hide();
//     $('.hides.' + newChartType.toLowerCase()).show();
// });

// ko.applyBindings(trendPlots.bindings);

// trendPlots.myChart = new TrendPlot({
//     el: 'tabbody',
//     data: []
// });

/*

Treat trend plots like display screen object with ability to pop out
    win = openWindow;
    win.init(config);//plot config


    Modal configuration window when added to display or when clicking on a gear
    tabbed like point editor
        General
        Display
        Pens?
        X Axis
        Y Axis

    Time 'jump' bar below chart

    Some configuration directly accessible via chart
        Clicking on legend
            Show one point's Y axis
            Hide/Show points

        Right-clicking brings up context menu?
    n series (on chart)
                Hide Series
                Show Scale
                Configure Series(color, etc)
                Scale to this series
    n Chart
                Configure Chart (pulls up configurator on general)
                Add Series
                Load "pens"
    n Legend
                Add Series

    */

// trendPlots.template = {
//     title: 'My Chart',
//     reversed: false,

//     xAxisCfg: {
//         range: '12HR', //if enum

//         unit: 'HR',
//         amount: 12 //if not enum
//     },

//     showGridLines: true,

//     //scaling: individual, singlePen, scaledToPen, percentage
//     yAxisCfg: {
//         precision: 2,//decimal points
//         type: 'pen',//preset/auto
//         penID: 1234,//upi,
//         min: 0,//if preset
//         max: 100
//     },

//     points: [{
//         upi: 1234,
//         color: '#fff',
//         lowY: 0,
//         highY: 10,
//         units: undefined,
//         lineWidth: 1,
//         visible: true
//     }]
// };

// trendPlots.FormGenerator = function (config) {
//     var fgSelf = this;

//     fgSelf.onSave = function () {
//         var obj = {};
//         //return entire object or only changed values?
//         //if only changed, then api is new fm(config), onsave(gimmeconfig)
//     };
// };

// trendPlots.formGenerator = new trendPlots.FormGenerator({
//     el: $('#formDiv'),
//     fields: [[
//             chartType: {
//                 label: 'Chart Type',
//                 type: 'select',
//                 options: [],
//                 visibleIf:
//             },
//             chartTitle: {
//                 label: 'Chart Title',
//                 type: 'text'
//             }
//         ], [{

//         }]
//     ]
// });

/*

DONE
Each plot has its own Y axis

Clicking a plot line changes Y axis to that point

Zoom feature

Vertical cursor(s) show plot value at their current position


REMAINING
Pen lists.  Save groups of points, merge with current list.  If already existing, overwrite existing point with imported one
    Stored on user object?

Multiple Trend plot objects on displays

Trend Plot object is preset for points and time range
    series::point type
        defaultTimeRange?

Y Axis scaled for point’s Min/Max Pres Value
    on data, get min/max, but allow setting

Scale options for Y
    chart::setScale
        all the same
        each plot/series
        scaled to one series

Operator can add / remove plots on the fly w/o saving the setup
    chart::configurator view

Trend objects look like they probably “dock” to an area of a display (e.g., tank level plot to bottom of display and takes up entire width)
    level above chart::panel/grid functionality

Point grouping (Flows, Temps, etc.)
    in point data not chart?

Toggle plot visibility w/o removing it from the setup
    chart::configurator view

*/
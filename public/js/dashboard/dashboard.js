var tou = {
    //utility/general
    itemIdx: 0,
    idxPrefix: 'tou_',
    dateFormat: 'M-D-YYYY',
    backgroundFolder: '/img/dashboard/backgrounds/',
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24,
    WEEK: 1000 * 60 * 60 * 24 * 7,
    makeId: function () {
        tou.itemIdx++;
        return tou.idxPrefix + tou.itemIdx;
    },
    logLinePrefix: true,
    fullDayList: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortDayList: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    fullMonthList: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    saveErrorText: 'We encountered an error and could not save this page. Please try again. If the problem persists please reload the page and try again.',
    criticalErrorText: 'We encountered an error while communicating with the server. Please try again. You may need to reload this page.',
    meterUPIs: {
        Consumption: [],
        Demand: [],
        Reactive: []
    },
    utilityTemplates: {
        Electricity: {
            utilityName: '',
            utilityType: '',
            'Point Type': {
                Value: 'Utility'
            },
            Dashboard: {
                settings: {
                    backgroundImages: [
                        'bluefield.jpg',
                        'flowers.jpg',
                        'forest.jpg',
                        'grass.jpg',
                        'mountains.jpg',
                        'palmtrees.jpg',
                        'raindrops.jpg',
                        'road.jpg',
                        'rockyshore.jpg',
                        'singleleaf.jpg'
                    ],
                    background: 'singleleaf.jpg',
                    bgOpacity: 100,
                    bgBrightness: 100,
                    useColor: false,
                    bgColor: '000000'
                },
                headeritems: [],
                dashboarditems: []
            },
            Meters: [],
            PreviousRateTables: {},
            RateTables: {
                'Fiscal Year': '',
                'Additional Off Peak Days': {
                    order: 0
                }
            },
            Billing: {
                defaultTitle: '',
                committedBills: {}
            },
            Reports: {
                committedReports: {}
            },
            Security: []
        }
    },
    addUtility: function (type, name) {
        tou.getUtilityMarkup(type, function(markup) {
            var template = tou.utilityTemplates[type],
                shortName = name.replace(/ /g, '_'),
                idx = tou.bindings.utilities().length,
                html = '<div><div class="utility ' + shortName + '" data-bind="with: utility_' + shortName + '">' + markup + '</div></div>';

            template.utilityName = name;
            template.utilityType = type;

            tou.rawUtilities.push(template);
            template.path = '';
            tou.saveUtility(template, template, function() {
                var config = tou.getUtilityConfig(template);

                $('.dashboardContent').append(html);

                tou.registerUtility(config, true);
            });
        });
    },
    deleteUtility: function (name) {
        var bindings = tou.bindings['utility_' + name],
            utility = tou.utilities[name],
            numUtilities,
            utilities,
            canRead = tou.bindings.canRead(utility.Security),
            nextBoundUtility,
            $body = $('body'),
            handler = function (response) {
                $body.unblock();

                if (response.err) {
                    tou.alert(tou.criticalErrorText);
                } else {
                    tou.forEachArray(tou.rawUtilities, function (rawUtility, idx) {
                        if (rawUtility.utilityName === name) {
                            tou.rawUtilities.splice(idx, 1);
                            return false;
                        }
                    });

                    delete tou.utilities[name];

                    utilities = tou.bindings.utilities();

                    numUtilities = utilities.length;

                    tou.forEach(utilities, function (boundUtility) {
                        if (boundUtility.name !== name) {
                            nextBoundUtility = boundUtility;
                            return false;
                        }
                    });

                    if (numUtilities > 1) {
                        if (canRead) {
                            tou.bindings.viewableUtilities(tou.bindings.viewableUtilities() - 1);
                        }
                        nextBoundUtility.activate();
                    } else {

                        tou.bindings.viewableUtilities(0);
                    }

                    tou.bindings.utilities.remove(bindings);
                    $('.dashboardContent .' + utility.shortName).parent().remove();
                }
            };

        $body.block({
            message: 'Deleting Utility'
        });

        $.ajax({
            url: '/dashboard/removeUtility',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                utilityName: name
            })
        }).done(handler).fail(function () {
            $body.unblock();
            tou.alert(tou.criticalErrorText);
        });
    },
    getUtilityMarkup: function (type, cb) {
        $.ajax({
            url: '/dashboard/getMarkup?type=' + type
        }).done(function (response) {
            cb(response.markup);
        }).fail(function () {
            tou.alert(tou.criticalErrorText);
        });
    },
    buildMeterList: function (meters) {
        var self = this,
            upis = tou.meterUPIs;

        meters.forEach(function (meter) {
            meter.meterPoints.forEach(function (meterPoint) {
                upis[meterPoint.meterPointDesc].push(meterPoint.upi);
            });
        });
        // Add convienence keys
        upis.consumption = upis.Consumption;
        upis.reactive = upis.Reactive;
        upis.demand = upis.Demand;
    },
    getRawUtility: function (utilityName) {
        var i,
            len;
        // Get a reference to the raw utility data from the server
        for (i = 0, len = tou.rawUtilities.length; i < len; i++) {
            if (tou.rawUtilities[i].utilityName === utilityName) {
                return tou.rawUtilities[i];
            }
        }
        return null;
    },
    print: function($selector) {
        $selector.css('overflow', 'visible');
        $selector.printArea({
            mode: 'iframe'
        });
        $selector.css('overflow', 'auto');
    },
    exportPDF: function($selector) {
        var svgElements = $selector.find('svg');

        var canvasShiftImage = function(_canvas, shiftAmt, realPdfPageHeight) {
            shiftAmt = parseInt(shiftAmt, 10) || 0;
            if (shiftAmt <= 0) {
                return _canvas;
            }

            var newCanvas = document.createElement('canvas');
            newCanvas.height = Math.min(_canvas.height - shiftAmt, realPdfPageHeight);
            newCanvas.width = _canvas.width;
            var ctx = newCanvas.getContext('2d');

            var img = new Image();
            img.src = _canvas.toDataURL();
            ctx.drawImage(img, 0, shiftAmt, img.width, img.height, 0, 0, img.width, img.height);

            return newCanvas;
        };

        var html2canvasSuccess = function(_canvas) {
            var pdf = new jsPDF('p', 'px', 'letter'),
                pdfInternals = pdf.internal,
                pdfPageSize = pdfInternals.pageSize,
                pdfScaleFactor = pdfInternals.scaleFactor,
                pdfPageWidth = pdfPageSize.width,
                pdfPageHeight = pdfPageSize.height,
                totalPdfHeight = 0,
                htmlPageHeight = _canvas.height,
                htmlScaleFactor = _canvas.width / (pdfPageWidth * pdfScaleFactor);

            while (totalPdfHeight < htmlPageHeight) {
                var newCanvas = canvasShiftImage(_canvas, totalPdfHeight, pdfPageHeight * pdfScaleFactor);
                pdf.addImage(newCanvas, 'png', 0, 0, pdfPageWidth, 0, null, 'NONE'); //note the format doesn't seem to do anything... I had it at 'pdf' and it didn't care

                totalPdfHeight += (pdfPageHeight * pdfScaleFactor * htmlScaleFactor);

                if (totalPdfHeight < htmlPageHeight) {
                    pdf.addPage();
                }
            }

            pdf.save('test.pdf');
        };

        //replace all svgs with a temp canvas
        svgElements.each(function() {
            var canvas, xml;

            canvas = document.createElement("canvas");
            canvas.className = "screenShotTempCanvas";
            //convert SVG into a XML string
            xml = (new XMLSerializer()).serializeToString(this);

            // Removing the name space as IE throws an error
            xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

            //draw the SVG onto a canvas
            canvg(canvas, xml);
            $(canvas).insertAfter(this);
            //hide the SVG element
            $(this).attr("class", "tempHide");
            $(this).hide();
        });

        html2canvas($selector, {
            width: $selector.width(),
            height: $selector.height(),
            onrendered: html2canvasSuccess
        });
    },
    numberWithCommas: function (theNumber) {
        if (theNumber !== null && theNumber !== undefined) {
            return theNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            return "";
        }
    },
    utilityPages: {},
    dataRequests: {},
    requestOptions: [],
    utilityList: [],
    dashboardItems: [],
    DashboardItem: function (cfg, idx) { //expose bindings as-is
        var self,
            page = cfg.page,
            utility = page.rawUtility,
            meterUPIs,
            currDate = new Date(),
            types = {
                column: 'Trend',
                solidgauge: 'Gauge',
                gauge: 'Gauge',
                statistic: 'Statistic'
            },
            type = types[cfg.type.toLowerCase()],
            isChart = type !== 'Statistic',
            useFiscalYear = cfg.useFiscalYear === undefined ? true : cfg.useFiscalYear,
            touid = tou.makeId(),
            measurements = page.getLayoutCSS(),
            waitMessage = 'Please Wait',
            verticalOffset = 55,
            horizontalOffset = 0,
            refreshDataProps = {
                peak: true,
                period: true,
                useFiscalYear: true,
                dataSource: true,
                withDataSource: true
            },
            redrawChartProps = {
                width: true,
                height: true,
                style: true,
                colorStops: true,
                colorStopsType: true
            },
            reLayoutProps = {
                width: true,
                height: true
            },
            startOf = {
                calendaryear: function (date) {
                    date.setMonth(0);
                    startOf.month(date);
                },
                year: function (date) {
                    var data = self.getFiscalYearData(self.getFiscalYear());

                    if (self.bindings.useFiscalYear()) {
                        return data && data.start;
                    }

                    startOf.calendaryear(date);
                },
                month: function (date) {
                    date.setDate(1);
                    startOf.day(date);
                },
                week: function (date) {
                    date.setDate(date.getDate() - date.getDay());
                    startOf.day(date);
                },
                day: function (date) {
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                }
            },
            periods = {
                year: {
                    offsetCalendarYear: function (date, forward) {
                        var tmpDate = new Date(date);
                        tmpDate.setYear(tmpDate.getFullYear() + (forward ? 1 : -1));
                        return tmpDate.getTime();
                    },
                    offset: function (date, forward) {
                        var year = self.getFiscalYear(forward ? 0 : -1),
                            data = self.getFiscalYearData(year);

                        return data && data.end;
                    },
                    pretty: function (date) {
                        var today = moment(),
                            momentDate = moment(date);

                        if (!self.bindings.useFiscalYear()) {
                            if (today.isSame(momentDate, 'year')) {
                                return 'This Year';
                            }
                        } else {
                            if (self.getFiscalYear() === page.fiscalYear) {
                                return 'This Year';
                            }
                            return 'FY' + self.fiscalYear;
                        }

                        return 'Year, ', date.getFullYear();
                    },
                    scale: 'month'
                },
                month: {
                    offset: function (date, forward) {
                        var tmpDate = new Date(date);
                        tmpDate.setMonth(tmpDate.getMonth() + (forward ? 1 : -1));
                        return tmpDate.getTime();
                    },
                    pretty: function (date) {
                        var today = moment(),
                            momentDate = moment(date);

                        if(today.isSame(momentDate, 'month')) {
                            return 'This Month';
                        }

                        return 'Month, ' + momentDate.format('MMMM YYYY');
                    },
                    scale: 'day'
                },
                week: {
                    offset: function (date, forward) {
                        var tmpDate = new Date(date).getTime();
                        if (forward) {
                            tmpDate += tou.WEEK;
                        } else {
                            tmpDate -= tou.WEEK;
                        }
                        return tmpDate;
                    },
                    pretty: function (date) {
                        var today = moment(),
                            momentDate = moment(date);

                        if(today.isSame(momentDate, 'day')) {
                            return 'This Week';
                        }

                        return 'Week of ' + momentDate.format(tou.dateFormat);
                    },
                    scale: 'day'
                },
                day: {
                    offset: function (date, forward) {
                        var tmpDate = new Date(date);
                        tmpDate.setDate(tmpDate.getDate() + (forward ? 1 : -1));
                        return tmpDate.getTime();
                    },
                    pretty: function (date) {
                        var today = moment(),
                            momentDate = moment(date);

                        if(today.isSame(momentDate, 'day')) {
                            return 'Today';
                        }

                        return 'Day, ' + momentDate.format('ddd ' + tou.dateFormat);
                    },
                    scale: 'half-hour'
                }
            },
            periodList = Object.keys(periods),
            dataSources = {
                'Consumption': {
                    upis: function () {
                        return meterUPIs.Consumption;
                    },
                    type: 'consumption',
                    fx: 'sum'
                },
                'Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    type: 'demand',
                    fx: 'max'
                },
                'Outside Air Temperature': {
                    upis: function () {
                        return [tou.weatherPoints.OAT];
                    },
                    type: '',
                    fx: 'tempRange',
                    hideMove: true
                },
                'Heating Degree Days': {
                    upis: function () {
                        return [tou.weatherPoints.HDD];
                    },
                    type: '',
                    fx: 'weather',
                    units: 'HDD'
                },
                'Cooling Degree Days': {
                    upis: function () {
                        return [tou.weatherPoints.CDD];
                    },
                    type: '',
                    fx: 'weather',
                    units: 'CDD'
                },
                'Current Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    type: 'demand',
                    scale: 'latest half',
                    hideMove: true
                },
                'Current On Peak Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    type: 'demand',
                    peak: 'on',
                    scale: 'latest half',
                    hideMove: true
                },
                'Current Off Peak Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    type: 'demand',
                    peak: 'off',
                    scale: 'latest half',
                    hideMove: true
                },
                'On Peak Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    type: 'demand',
                    peak: 'on'
                },
                'Off Peak Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    type: 'demand',
                    peak: 'off'
                },
                'Highest Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    type: 'demand',
                    // scale: 'latest half',
                    fx: 'max'
                },
                'Highest On Peak Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    peak: 'on',
                    type: 'demand',
                    // scale: 'latest half',
                    fx: 'max'
                },
                'Highest Off Peak Demand': {
                    upis: function () {
                        return meterUPIs.Demand;
                    },
                    peak: 'off',
                    type: 'demand',
                    // scale: 'latest half',
                    fx: 'max'
                }
            },
            withSources = {
                none: {},
                coolingdegreedays: {},
                heatingdegreedays: {},
                outsideairtemp: {}
            },
            getStartDate = function (date, round) {
                var start = new Date(date.getTime());

                start = startOf[self.bindings.period()](start) || start;

                if (self.bindings.period() === 'year') {
                    return start/1000;
                }

                if (!round) {
                    return start.getTime();
                }

                return Math.round(start.getTime()/1000);
            },
            getEndDate = function (date, round) {
                var end = getStartDate(date);

                end = periods[self.bindings.period()].offset(end, true);

                if (!round) {
                    return end;
                }

                return Math.round(end/1000);
            },
            getPeak = function () {
                var peak = self.bindings.peak(),
                    dataSourcePeak = dataSources[self.bindings.dataSource()].peak;

                if (self.chartType === 'column') {
                    return '';
                }

                return dataSourcePeak || peak;
            },
            getScale = function (skipFX) {
                var ret = periods[self.bindings.period()].scale,
                    dataSource = self.bindings.dataSource(),
                    latestScale = dataSources[dataSource].scale;

                if (self.chartType && self.chartType.match('gauge')) {
                    return 'latest half';
                }

                if (self.type === 'Statistic') {
                    if (dataSource.match('Current')) {
                        return 'latest half';
                    }
                    return self.bindings.period();
                }

                return latestScale || ret;//skipFX ? ret : (fx || ret);
            },
            getType = function (type) {
                var ret = dataSources[type || self.bindings.dataSource()].type;

                return ret;
            },
            getFx = function (type) {
                var ret = 'max',
                    source = self.bindings.dataSource();

                if (self.chartType === 'column') {
                    ret = 'sum';
                }

                if (getType(type) === 'demand') {
                    ret = 'max';
                }

                return (dataSources[type] && dataSources[type].fx) || (dataSources[source] && dataSources[source].fx) || ret;
            },
            getFxProp = function(type) {
                var fx = getFx(type),
                    matrix = {
                        max: 'maxes',
                        sum: 'sums'
                    };

                return matrix[fx];
            },
            getUPIs = function (inSource) {
                var source = inSource || self.bindings.dataSource(),
                    primaryUPIs = dataSources[source].upis();


                return primaryUPIs;
            };

        if (cfg.style === '360' && cfg.type === 'solidgauge') {
            type = 'Gauge';
            cfg.type = 'gauge';
        }

        page.onLayout(function(newMeasurements) {
            self.measurements = newMeasurements;
        });

        cfg.$parent = cfg.$element;
        if (cfg.mainContent) {
            cfg.$container = cfg.$element.find('.portlet');
            cfg.$element = cfg.$container.find('.content');
        } else {
            cfg.$container = cfg.$element;
        }

        self = {
            //vars
            _cfg: cfg,
            touid: touid,
            type: type,
            chartType: cfg.type,
            measurements: measurements,
            resizeTimer: 250,
            $parent: cfg.$parent,
            $container: cfg.$container,
            $element: cfg.$element,
            mainContent: cfg.mainContent,
            utilityName: cfg.utilityName,

            fiscalYear: page.fiscalYear,
            getFiscalYear: function (offset) {
                return (self.fiscalYear || page.fiscalYear) + (offset || 0);
            },

            getFiscalYearData: function (year) {
                return page.fiscalYears[year || self.getFiscalYear()];
            },

            //bindings
            bindings: {
                touid: touid,
                mainContent: cfg.mainContent,
                type: ko.observable(type),
                width: ko.observable(cfg.width),
                height: ko.observable(cfg.height),
                title: ko.observable(cfg.title),
                value: ko.observable('0'),
                when: ko.observable(''),
                currDate: ko.observable(currDate),
                dataSource: ko.observable(cfg.dataSource),
                withDataSource: ko.observable(cfg.withDataSource || 'None'),
                useFiscalYear: ko.observable(useFiscalYear),
                period: ko.observable(cfg.period),
                periodList: ko.observableArray(periodList),
                colorStopsType: ko.observable(cfg.colorStopsType),
                colorStops: ko.observableArray(cfg.colorStops),
                peak: ko.observable(cfg.peak),
                style: ko.observable(cfg.style.toString()),
                loaded: ko.observable(false),
                editDashboardItem: page.bindings.editDashboardItem,
                noData: ko.observable(false),
                changePeriod: function (period) {
                    self.bindings.period(period);
                    self.requestData();
                },
                forward: function () {
                   var myDate,
                        period,
                        newDay,
                        data = self.getFiscalYearData();

                    myDate = self.bindings.currDate();
                    period = periods[self.bindings.period()];

                    if (self.bindings.period() === 'year') {
                        self.fiscalYear = self.getFiscalYear() + 1;
                        newDay = period.offset(myDate, true);
                        myDate.setYear(self.fiscalYear);
                        self.bindings.currDate(myDate);
                    } else {
                        newDay = period.offset(myDate, true);
                        self.bindings.currDate(new Date(newDay));

                        if (!data || data && newDay > data.end) {
                            self.fiscalYear = self.getFiscalYear() + 1;
                        }
                    }

                    tou.log('Fiscal Year:', self.fiscalYear);

                    self.requestData();
                },
                rewind: function () {
                    var myDate,
                        period,
                        newDay,
                        data = self.getFiscalYearData();

                    myDate = self.bindings.currDate();
                    period = periods[self.bindings.period()];

                    if (self.bindings.period() === 'year') {
                        self.fiscalYear = self.getFiscalYear() - 1;
                        newDay = period.offset(myDate);
                        myDate.setYear(self.fiscalYear);
                        self.bindings.currDate(myDate);
                    } else {
                        newDay = period.offset(myDate);
                        self.bindings.currDate(new Date(newDay));

                        if (!data || data && newDay < data.start) {
                            self.fiscalYear = self.getFiscalYear() - 1;
                        }
                    }

                    tou.log('Fiscal Year:', self.fiscalYear);

                    self.requestData();
                },
                getPage: function () {
                    return page;
                },
                getInstance: function () {
                    return self;
                }
            },

            //functions
            getUtility: function () {
                return utility;
            },
            socketReconnect: function () {
                self.doRequest();
            },
            processUpdates: function (changedProps) {
                var self = this,
                    refreshData = false,
                    redrawChart = false,
                    reLayout = false;

                tou.forEach(changedProps, function (newValue, prop) {
                    self.bindings[prop](newValue);
                    if (refreshDataProps[prop]) {
                        refreshData = true;
                    }
                    if (redrawChartProps[prop]) {
                        redrawChart = true;
                    }
                    if (reLayoutProps[prop]) {
                        reLayout = true;
                    }
                });

                if (refreshData) {
                    self.requestData();
                    if (reLayout) {
                        page.updateLayout();
                    }
                } else if (redrawChart) {
                    page.updateLayout(self.$container);
                    self.drawTrendPlot();
                }
            },
            handleSocket: function (data) {
                var touid = data.touid,
                    idx = touid.split('-')[1],
                    ret = [null, null];

                ret[idx] = data;

                if (self.chartType === 'statistic') {
                    ret = data;
                }

                self.handleData(ret);
            },
            handleData: function (response) {
                var results = response.result || response,
                    newData = [],
                    prop = self.lastFx,
                    propMatrix = {
                        max: 'maxes',
                        sum: 'sums',
                        tempRange: 'tempRanges',
                        weather: 'sums'
                    },
                    props = propMatrix[prop],
                    multiply = prop !== 'tempRange' && prop !== 'weather',
                    row,
                    val,
                    when,
                    isEmpty = true,
                    withData = self.bindings.withDataSource(),
                    processData = function (result) {
                        if (!result || result.length === 0) {
                            self.bindings.noData(true);
                            if(!result) {
                                return;
                            }
                        } else {
                            tou.forEachArray(result, function (row) {
                                var newval,
                                    setVal = function (valToSet) {
                                        newval = valToSet;
                                        if (multiply) {
                                            newval *= 1000;
                                        }
                                        newval = Math.round(newval);
                                    };

                                if (isEmpty && row.timestamp !== 0) {
                                    isEmpty = false;
                                }

                                if (row.range) {
                                    setVal(row[prop]);
                                    newData.push({
                                        Value: newval,
                                        timestamp: row.range.start * 1000
                                    });
                                } else {
                                    setVal(row.value);
                                    newData.push({
                                        Value: newval,
                                        timestamp: row.timestamp * 1000
                                    });
                                }
                            });
                        }
                    },
                    processTemps = function (result) {
                        var maxes = [],
                            mins = [];

                        tou.forEachArray(result, function (row) {
                            if (isEmpty && (row.max !== 'string' || typeof row.min !== 'string')) {
                                isEmpty = false;
                            }
                            maxes.push({
                                Value: typeof row.max === 'string' ? null : tou.toFixed(row.max, 1),
                                timestamp: row.range.start * 1000
                            });
                            mins.push({
                                Value: typeof row.min === 'string' ? null : tou.toFixed(row.min, 1),
                                timestamp: row.range.start * 1000
                            });
                            newData = [{
                                data: mins,
                                name: 'Low'
                            }, {
                                data: maxes,
                                name: 'High'
                            }];
                        });
                    },
                    getVal = function() {
                        if (!row || row.timestamp === 0) {
                            self.bindings.noData(true);
                            val = 0;
                            return;
                        }
                        if (isEmpty && row.timestamp !== 0) {
                            isEmpty = false;
                        }
                        if (row.value !== undefined) {
                            val = row.value;
                        } else {
                            val = row[prop];
                            if (val === undefined) {
                                if (prop === 'weather') {
                                    val = row.sum;
                                } else {
                                    val = row.max;
                                }
                            }
                        }
                    };

                self.bindings.noData(false);

                if (!results.error) {
                    if (self.chartType === 'column') {
                        if (withData !== 'None') {
                            if(results[0]) {//socket
                                processData(results[0].results[props]);
                                self.mainData = newData;
                                newData = [];
                            }

                            if(results[1]) {
                                if (withData === 'Outside Air Temperature' || withData.match('Degree Days')) {
                                    if (!results[1].error) {
                                        if (withData === 'Outside Air Temperature') {
                                            processTemps(results[1].results.tempRanges);
                                        } else {
                                            multiply = false;
                                            processData(results[1].results[props]);
                                        }
                                    } else {
                                        newData = null;
                                    }
                                } else {
                                    processData(results[1].results.maxes);
                                }
                                self.withData = newData;
                            }
                        } else {
                            if (Array.isArray(results)) {
                                processData(results[0].results[props]);//.results[props]);
                            } else {
                                processData(results.results[props]);
                            }
                            self.mainData = newData;
                            self.withData = null;
                        }
                    } else if (self.chartType.match('gauge')) {
                        //convert to kw
                        if(results[0] && !results[0].error) {
                            row = results[0].results[props].slice(-1)[0];
                            getVal(row);

                            if (isNaN(val)) {
                                val = 0;
                                multiply = false;
                            }

                            if (multiply) {
                                val *= 1000;
                                val = Math.round(val);
                            }

                            newData = [{
                                Value: val
                            }];

                            self.mainData = newData;
                        }

                        if(results[1] && !results[1].error) {//will always be max
                            row = results[1].results.maxes.slice(-1)[0];
                            getVal(row);
                            self.maxY = val * 1000;
                        }

                        if (self.bindings.noData()) {
                            newData = [];
                            self.mainData = newData;
                        }
                    } else {//statistic
                        row = results.results[props].slice(-1)[0];
                        getVal(row);
                        when = moment.unix(results.results.maxes[0].timestamp);
                        when = when.format('MM/DD/YY HH:MM:SS');

                        if (isNaN(val)) {
                            val = '';
                            multiply = false;
                        }

                        if (multiply) {
                            val *= 1000;
                        }

                        newData = [{
                            Value: tou.numberWithCommas(Math.round(val)),
                            when: when
                        }];

                        self.mainData = newData;
                    }
                } else {
                    isEmpty = true;
                }

                self.bindings.loaded(true);

                self.bindings.noData(isEmpty);

                self.$container.unblock();

                if (isChart) {
                    if (self.trendPlot) {
                        self.trendPlot.destroy();
                        // self.trendPlot.updateData(newData);
                    }

                    self.drawTrendPlot();
                } else {
                    if (!isEmpty) {
                        self.bindings.value(newData[0].Value);
                        self.bindings.when(newData[0].when);
                    } else {
                        self.bindings.value(0);
                        self.bindings.when('');
                    }
                }
            },
            requestData: function () {
                var nonNullProps = ['dataSource', 'period'],
                    valid = true;

                tou.forEachArray(nonNullProps, function (prop) {
                    if (self.bindings[prop]() === '') {
                        valid = false;
                    }
                    return valid;
                });

                if (valid) {
                    self.doRequest();
                }
            },
            doRequest: function () {
                var end = self.bindings.currDate(),
                    withDataSource,
                    buildOption = function (source) {
                        return {
                            range: {
                                start: getStartDate(self.bindings.currDate(), true),
                                end: getEndDate(self.bindings.currDate(), true)
                            },
                            fiscalYear: self.getFiscalYear(),
                            type: getType(source),
                            scale: getScale(source),
                            fx: getFx(source),
                            upis: getUPIs(source),
                            peak: getPeak(source),
                            socketid: tou.socketid,
                            touid: self.touid + '-0',
                            utilityName: self.utilityName
                        };
                    },
                    request = {
                        options: [buildOption()],
                        handler: function (response) {
                            self.handleData(response);
                        }
                    },
                    maxRequest;

                self.lastFx = request.options[0].fx;

                if (self.chartType.match('gauge')) {
                    request.bundleResponses = true;
                    // request.options[0].fx = 'sum';
                    maxRequest = $.extend(true, {}, request.options[0], {
                        fx: 'max',
                        scale: self.bindings.period(),
                        touid: self.touid + '-1',
                        range: {
                            end: getEndDate(self.bindings.currDate(), true),
                            start: getStartDate(self.bindings.currDate(), true)
                        }
                    });
                    request.options.push(maxRequest);
                } else if (self.chartType === 'column') {
                    if (self.bindings.withDataSource() !== 'None') {
                        request.bundleResponses = true;
                        withOption = buildOption(self.bindings.withDataSource());
                        withOption.touid = self.touid + '-1';
                        request.options.push(withOption);
                    }
                }

                self.lastRequest = request;
                self.$container.block({
                    message: waitMessage
                });
                tou.addDataRequest(request, true, '/api/meters/getUsage');
            },
            updateSize: function () {
                var self = this;

                self.measurements = page.getLayoutCSS();

                if (self.bindings.loaded()) {
                    self.drawTrendPlot();
                }
            },
            handleResize: function () {
                if (tou.currPage && tou.currPage.title === 'Dashboard') {
                    self.lastResize = new Date();
                    setTimeout(function () {
                        if (new Date() - self.lastResize >= self.resizeTimer) {
                            self.updateSize();
                        }
                    }, self.resizeTimer);
                }
            },
            drawTrendPlot: function () {
                if (isChart) {
                    var tpCfg = self.getTrendPlotConfig(self.mainData, self.withData);

                    if (tpCfg) {
                        self.trendPlot = new TrendPlot(tpCfg);
                    } else {
                        self.$element.html('No Data To Display');
                    }
                }
            },
            getTrendPlotConfig: function (data, withData) {
                var newData = [],
                    series = {},
                    colors = ['#2b908f', '#f45b5b'],
                    withDataSrc = self.bindings.withDataSource(),
                    ret = {
                        target: self.$element,
                        y: 'Value',
                        height: self.measurements.height[self.bindings.height()] - verticalOffset,
                        width: self.measurements.width[self.bindings.width()] - horizontalOffset,
                        x: 'timestamp',
                        type: cfg.type,
                        animation: false,
                        yAxisTitle: '',
                        data: [],
                        colorStops: self.bindings.colorStops(),
                        colorStopsType: self.bindings.colorStopsType(),
                        style: self.bindings.style(),
                        hideLegendXLabel: true
                    };

                if (data.length === 0) {
                    self.bindings.noData(true);
                }

                if (cfg.type !== 'column') {
                    series.style = ret.style;
                    ret.max = self.maxY;
                    if (ret.style === '180') {
                        ret.type = series.type = 'solidgauge';
                    } else {
                        ret.type = series.type = 'gauge';
                    }
                    ret.units = series.units = self.bindings.units();
                    series.data = data;
                    series.name = self.bindings.dataSource();
                    ret.data.push(series);
                } else {
                    ret.units = series.units = self.bindings.units();
                    ret.data.push({
                        type: 'column',
                        data: data,
                        name: self.bindings.dataSource(),
                        units: self.bindings.units(),
                        color: '#e4d354'
                    });

                    if (withData) {
                        if (!Array.isArray(withData)) {
                            ret.data.push({
                                type: 'line',
                                data: withData,
                                name: withDataSrc
                            });
                        } else {
                            // ret.data[0].color = ;
                            if (withDataSrc === 'Outside Air Temperature') {
                                tou.forEachArray(withData, function (series, idx) {
                                    ret.data.push({
                                        type: 'line',
                                        data: series.data,
                                        name: series.name,
                                        yAxis: 1,
                                        color: colors[idx],
                                        units: '&deg;F'
                                    });
                                });
                            } else {
                                ret.data.push({
                                    type: 'line',
                                    data: withData,
                                    name: withDataSrc,
                                    yAxis: 1,
                                    color: colors[0],
                                    units: dataSources[withDataSrc].units
                                });
                            }
                        }
                    }
                }

                if (self.bindings.noData()) {
                    ret = null;
                }

                return ret;
            },
            destroy: function () {
                var idx,
                    bindingIdx,
                    self = this;

                tou.forEachArray(tou.dashboardItems, function (item, index) {
                    if (item.touid === self.touid) {
                        idx = index;
                    }
                });

                $(window).off('resize', function () {
                    self.handleResize();
                });

                if (idx !== undefined) {
                    tou.dashboardItems.splice(idx, 1);
                    if (self.type === 'Statistic' && !self.mainContent) {
                        tou.forEachArray(page.bindings.headerItems(), function (item, index) {
                            if (item.touid === self.touid) {
                                bindingIdx = index;
                            }
                        });

                        page.bindings.headerItems.splice(bindingIdx, 1);
                    } else {
                        tou.forEachArray(page.bindings.dashboardItems(), function (item, index) {
                            if (item.touid === self.touid) {
                                bindingIdx = index;
                            }
                        });

                        page.bindings.dashboardItems.splice(bindingIdx, 1);
                        self.$container.parent().remove();
                    }
                    page.updateLayout();
                }
            }
        };

        self.bindings.classNames = ko.computed(function () {
            return self.bindings.width() + ' ' + self.bindings.height();
        });

        self.bindings.prettyDate = ko.computed(function () {
            var currDate = self.bindings.currDate(),
                period = self.bindings.period();

            if(periods[period].pretty) {
                return periods[period].pretty(currDate);
            }

            return moment(currDate).format('ddd, ' + tou.dateFormat);
        });

        self.bindings.showForward = ko.computed(function () {
            var period = self.bindings.period(),
                currDate = self.bindings.currDate(),
                today = moment(),
                curr = moment(currDate),
                year = self.fiscalYear || currDate.getFullYear(),
                data = self.getFiscalYearData(year+1),
                dataSource = self.bindings.dataSource(),
                dataSourceCfg = dataSources[dataSource];

            if (self.type === 'Statistic' && dataSourceCfg && dataSourceCfg.hideMove) {
                return false;
            }

            if (period === 'year' && self.bindings.useFiscalYear()) {
                if (data) {
                    return true;
                }
                return false;
            }

            return today.isAfter(curr, period);
        });

        self.bindings.showBackward = ko.computed(function () {
            var dataSource = self.bindings.dataSource(),
                dataSourceCfg = dataSources[dataSource];

            if (self.type === 'Statistic' && dataSourceCfg && dataSourceCfg.hideMove) {
                return false;
            }

            return true;
        });

        self.bindings.units = ko.computed(function () {
            var dataSource = self.bindings.dataSource();

            if (dataSource.match('Temperature')) {
                return '&deg;F';
            }

            if (dataSource.match('Degree Days')) {
                return dataSources[dataSource].units;
            }

            if (dataSource.toLowerCase().match('consumption')) {
                return 'kWh';
            }

            return 'kW';
        });

        tou.onLoad(function () {
            meterUPIs = tou.getActiveMeterList(utility.Meters);
            self.requestData();
        });

        tou.on('meterssaved', function (utilityName) {
            if (utilityName === utility.utilityName) {
                meterUPIs = tou.getActiveMeterList(utility.Meters);
                self.requestData();
            }
        });

        $(window).resize(function () {
            self.handleResize();
        });

        if (page.loaded && cfg.mainContent) {
            setTimeout(function () {
                page.updateLayout();
            }, 100);
        }

        tou.dashboardItems.push(self);

        if (cfg.mainContent) {
            ko.cleanNode(self.$container[0]);
            ko.applyBindings(self.bindings, self.$container[0]);
        }

        return self;
    },
    availablePeriods: {}, // Object containing a list of months available for selection, keyed by utility name
    buildAvailablePeriods: function (forceBuild) {
        var currUtility = tou.currUtility,// getcurrUtility(utilityName),
            utilityName = currUtility.utilityName,
            self = this,
            availablePeriodsObject = self.availablePeriods,
            processedPeriods = {},
            months = self.months,
            now = new Date(),
            thisYear = now.getFullYear(),
            thisMonth = now.getMonth(),
            _forceBuild = forceBuild || false,
            availablePeriods,
            i,
            len,
            yearKey,
            collection,
            previousRateTables,
            rateTables,
            fiscalYearRange,
            fiscalYearRanges = {},
            processPeriod = function (rateTable, period) {
                var start = new Date(period.start.date),
                    date = new Date(period.start.date),
                    end = new Date(period.end.date),
                    fiscalYear = rateTable['Fiscal Year'],
                    rangeType = period.rangeType,
                    periodEnd,
                    month,
                    year,
                    monthIndex,
                    fullDate,
                    prettyDate;

                while (date < end) {
                    year = date.getFullYear();
                    monthIndex = date.getMonth();
                    month = self.fullMonthList[monthIndex];
                    fullDate = [month, ', ', year].join('');
                    // If we haven't already added this billing period
                    if (processedPeriods.hasOwnProperty(fullDate) === false) {
                        periodEnd = new Date(date).setMonth(monthIndex + 1); // Period end timestamp - setMonth returns a timestamp
                        // Only add the month if it's not in the future
                        if (date < now) {
                            processedPeriods[fullDate] = true;
                            if (year === thisYear) {
                                if (monthIndex === thisMonth) {
                                    prettyDate = 'This month';
                                } else {
                                    prettyDate = fullDate.split(', ')[0];
                                }
                            } else {
                                prettyDate = fullDate;
                            }
                            availablePeriods.push({
                                period: 'Month', // This is a month period (as opposed to a 'Fiscal Year')
                                childPeriod: 'Day',
                                childFormatCode: 'D',
                                start: date.getTime(), // Period start timestamp
                                end: periodEnd,
                                fullDate: fullDate, // i.e. "August, 2015"
                                prettyDate: prettyDate, // i.e. "This month", "July", or "July, 2014"
                                searchDate: fullDate.toLowerCase().replace(',', ''),
                                month: month, // i.e. "August"
                                year: year,
                                fiscalYear: fiscalYear,
                                season: [rangeType.charAt(0).toUpperCase(), rangeType.slice(1)].join(''), // i.e. Winter, Summer, or Transition
                                rateTable: $.extend(true, {}, rateTable)
                            });
                        }

                        if (fiscalYearRanges.hasOwnProperty(fiscalYear) === false) {
                            fullDate = ['Fiscal Year', fiscalYear].join(' ');
                            fiscalYearRanges[fiscalYear] = {
                                period: 'Year',
                                childPeriod: 'Month',
                                childFormatCode: 'MM',
                                start: start.getTime(),
                                end: periodEnd,
                                fullDate: fullDate,
                                prettyDate: fullDate,
                                searchDate: fullDate.toLowerCase().replace(',', ''),
                                month: null,
                                year: null,
                                fiscalYear: fiscalYear,
                                season: null,
                                rateTable: $.extend(true, {}, rateTable)
                            };
                        } else {
                            fiscalYearRange = fiscalYearRanges[fiscalYear]; // Shortcut
                            fiscalYearRange.start = Math.min(fiscalYearRange.start, start.getTime());
                            fiscalYearRange.end = Math.max(fiscalYearRange.end, periodEnd);
                        }
                    }
                    date.setMonth(monthIndex + 1);
                }
            },
            getBillingPeriods = function (rateTable) {
                if (typeof rateTable !== 'object')
                    return;

                var periods,
                    collectionKey;

                for (collectionKey in rateTable) {
                    collection = rateTable[collectionKey];
                    // Check for periods ('Additional Off Peak Days', 'Fiscal Year', etc. doesn't have a 'periods' key)
                    if (collection.hasOwnProperty('periods')) {
                        periods = collection.periods;
                        for (i = 0, len = periods.length; i < len; i++) {
                            processPeriod(rateTable, periods[i]);
                        }
                    }
                }
            },
            addFiscalYearPeriods = function () {
                for (var yearKey in fiscalYearRanges) {
                    availablePeriods.push(fiscalYearRanges[yearKey]);
                }
            };

        // If we've already built this utility's periods we need to leave
        if (!_forceBuild && availablePeriodsObject.hasOwnProperty(utilityName)) {
            return;
        }

        // Add this utility to our object
        availablePeriodsObject[utilityName] = [];
        // Create a shortcut to our array
        availablePeriods = availablePeriodsObject[utilityName];

        // Itterate rate tables to get all billing months
        if (currUtility !== null) {
            previousRateTables = currUtility.PreviousRateTables;
            rateTables = currUtility.RateTables;

            if (previousRateTables !== undefined) {
                for (yearKey in previousRateTables) {
                    getBillingPeriods(previousRateTables[yearKey]);
                }
            }
            if (rateTables !== undefined) {
                getBillingPeriods(rateTables);
            }
        }
        addFiscalYearPeriods();

        // Sort our available periods - most recent first
        availablePeriods.sort(function (a, b) {
            var returnValue;
            if (a.period === 'Year' || b.period === 'Year') {
                if (a.end === b.end) {
                    returnValue = (a.period === 'Year') ? -1 : 1;
                } else {
                    returnValue = (a.end < b.end) ? 1 : -1;
                }
            } else {
                returnValue = (a.start < b.start) ? 1 : -1;
            }
            return returnValue;
        });
    },
    toFixed: function (number, precision) {
        // This routine based on http://stackoverflow.com/questions/10015027/javascript-tofixed-not-rounding
        var abs = Math.abs(number),
            str = abs.toString(),
            digits = str.split('.')[1],
            negative = number < 0,
            lastNumber,
            mult;

        // If the requested precision is 0, the native toFixed routine works well
        if (precision === 0) {
            str = abs.toFixed(0);
        }
        // If we have decimal digits and more of them than the requested precision
        else if (digits && (digits.length > precision)) {
            // Chop off all digits right of the desired precision. The precision is increased one beyond the desired
            // precision for rounding, and one more to account for the '.' character which substr includes
            str = str.substr(0, str.indexOf('.') + precision + 2);
            // Get the last digit
            lastNumber = str.charAt(str.length - 1);
            // Remove the last digit
            str = str.substr(0, str.length - 1);
            if (lastNumber >= 5) {
                // Get a multipler for the digit positin we're rounding. i.e. x10 if .1, x100 if 0.01, etc.
                mult = Math.pow(10, str.length - str.indexOf('.') - 1);
                // Add the rounded last digit to our string. FYI +str is a clever way of converting a string to a #
                // Floating point operations have limited precision which can lead to round-off errors. They
                // are really ugly when displayed to the user, i.e. 0.1 + 0.2 = 0.30000000000000004
                // We use the native toFixed to correct this which also generates a string for us
                str = (+str + 1 / mult).toFixed(precision);
            }
        }

        return str * (negative ? -1 : 1);
    },
    toFixedComma: function (number, precision) {
        var fixedNum = tou.toFixed(number, (precision===undefined)?128:precision);

        return tou.numberWithCommas(fixedNum);
    },
    cellWidthHelper: function (e, tr) {
        var $originals = tr.children(),
            $helper = tr.clone();

        $helper.children().each(function (index) {
            $(this).width($originals.eq(index).width());
        });

        return $helper;
    },
    isSystemAdmin: function () {
        var user = tou.workspaceManager.user();
        return user['System Admin'] && user['System Admin'].Value;
    },
    loadJade: function(name, cb) {
        $.ajax({
            url: '/dashboard/getJadeFile?file=' + name + '.jade',
            success: function (markup) {
                cb(markup);
            }
        });
    },
    saveUtility: function (utility, cfg, callback, noMerge) {
        var rawUtility,
            utilityName,
            path,
            remove = false,
            data,
            mergeWithUtility = function () {
                if (noMerge === true) {
                    return;
                }
                var steps = path.split('.'),
                    obj = rawUtility,
                    c;

                for (c=0; c<steps.length; c++) {
                    obj = obj[steps[c]];
                }

                data = $.extend(obj, data);
            };

        if (typeof utility === 'string') {
            utilityName = utility;
            path = Object.keys(cfg)[0];
            data = cfg[path];
        } else {
            utilityName = utility.utilityName;
            path = utility.path;
            data = cfg;
            remove = utility.remove || remove;
        }

        tou.forEachArray(tou.rawUtilities, function(rawUtil) {
            if(rawUtil.utilityName === utilityName) {
                rawUtility = rawUtil;
                return false;
            }
        });

        mergeWithUtility();

        $.ajax({
            url: '/dashboard/saveUtility',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                utility: {
                    path: path,
                    data: data,
                    utilityName: utilityName,
                    remove: remove
                }
            })
        }).done(callback).fail(function () {
            tou.alert(tou.criticalErrorText);
        });
    },
    cancelConfirm: function () {
        if (tou._confirmCb) {
            tou._confirmCb(false);
        }
    },
    submitConfirm: function () {
        if (tou._confirmCb) {
            tou._confirmCb(true);
        }
    },
    confirm: function (config) {
        var cb = config.callback,
            message = config.message,
            showBody = !!message;
        tou._confirmCb = cb;
        tou.showModal('touConfirm', {
            message: message,
            showBody: showBody
        });
    },
    alert: function (message, hideOK) {
        tou.showModal('touAlert', {
            message: message,
            hideOK: hideOK
        });
    },
    addDataRequest: function (cfg, skipWait, url) {
        if (!Array.isArray(cfg.options)) {
            cfg.options = [cfg.options];
        }

        if (cfg.bundleResponses && cfg.touid) {
            tou.dataRequests[cfg.touid] = cfg;
            cfg.options.forEach(function (option) {
                option.touid = cfg.touid;
            });
        } else {
            cfg.options.forEach(function (option) {
                option.touid = cfg.touid || option.touid || tou.makeId();
                tou.dataRequests[option.touid] = cfg;
            });
        }

        tou.requestOptions = tou.requestOptions.concat(cfg.options);

        if (skipWait) {
            tou.makeDataRequest(url);
        }
    },
    handleDataResponse: function (response) {
        var removedIDs = [];
        if (!Array.isArray(response)) {
            tou.alert(tou.criticalErrorText);
            return;
        }
        tou.forEachArray(response, function (result) {
            var touid = result.touid,
                cfg = tou.dataRequests[touid];

            removedIDs.push(touid);

            if (cfg.bundleResponses) {
                cfg.handler(response);
                return false;
            }

            cfg.handler(result);
        });
        tou.forEachArray(removedIDs, function (touid) {
            delete tou.dataRequests[touid];
        });
    },
    makeDataRequest: function (url) {
        if (url === undefined) {
            url = '/api/meters/getUsage';
        }

        if (tou.requestOptions.length > 0) {
            // tou.log('Server request: ', tou.requestOptions);
            $.ajax({
                'content-type': false,
                type: 'POST',
                url: url,
                data: {
                    options: tou.requestOptions
                }
            }).done(function (response) {
                tou.handleDataResponse(response);
            }).fail(function (response) {
                tou.handleDataResponse(false);
            });
        }

        tou.requestOptions = [];
    },
    emptyFn: function () {
        return;
    },
    formatDate: function (date, addSuffix) {
        var functions = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
            lengths = [2, 2, 2, 3],
            separators = [':', ':', ':', ''],
            suffix = ' --',
            fn,
            out = '';

        if (addSuffix) {
            separators.push(suffix);
        }

        if (typeof date === 'number') {
            date = new Date(date);
        }

        for (fn in functions) {
            if (functions.hasOwnProperty(fn)) {
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
            args = [].splice.call(arguments, 0),
            pad = function (num) {
                return ('    ' + num).slice(-4);
            },
            formattedTime = tou.formatDate(new Date(), true);

        if (tou.logLinePrefix === true) {
            err = new Error();
            if (Error.captureStackTrace) {
                Error.captureStackTrace(err);

                stack = err.stack.split('\n')[2];

                steps = stack.split(':');

                lineNumber = steps[2];

                args.unshift('line:' + pad(lineNumber), formattedTime);
            }
        }
        // args.unshift(formattedTime);
        if (!tou.noLog) {
            console.log.apply(console, args);
        }
    },
    preloadedImages: {},
    preloadImage: function (src) {
        if (!tou.preloadedImages[src]) {
            tou.preloadedImages[src] = true;
            $('<img />').attr('src', tou.backgroundFolder + src);
        }
    },
    getMeterList: function (meters, options) {
        var self = this,
            list = {
                Consumption: [],
                Reactive: [],
                Demand: []
            },
            opts = options || {},
            active = opts.active,
            getMeterPoint = opts.getMeterPoint,
            getAllMeters = opts.getAllMeters;
        meters.forEach(function (meter) {
            if (getAllMeters || (meter.isActive === active)) {
                meter.meterPoints.forEach(function (meterPoint) {
                    var data;
                    if (getMeterPoint) {
                        data = meterPoint;
                    } else {
                        data = meterPoint.upi;
                    }
                    list[meterPoint.meterPointDesc].push(data);
                });
            }
        });
        // Add convenience keys
        list.consumption = list.Consumption;
        list.reactive = list.Reactive;
        list.demand = list.Demand;
        return list;
    },
    getInactiveMeterList: function (meters, getMeterPoint) {
        var options = {
            active: false,
            getMeterPoint: getMeterPoint,
            getAllMeters: false
        };
        return tou.getMeterList(meters, options);
    },
    getActiveMeterList: function (meters, getMeterPoint) {
        var options = {
            active: true,
            getMeterPoint: getMeterPoint,
            getAllMeters: false
        };
        return tou.getMeterList(meters, options);
    },
    getMeters: function (activeStatus) {
        var meters = [],
            allMeters,
            i,
            lenMeters;

        if (tou.currUtility) {
            allMeters = tou.currUtility.Meters;
            if (activeStatus !== undefined) {
                lenMeters = allMeters.length;
                for (i = 0; i < lenMeters; i++) {
                    if (allMeters[i].isActive === activeStatus) {
                        meters.push(allMeters[i]);
                    }
                }
            } else {
                meters = allMeters;
            }
        }

        return meters;
    },
    retrieveMeterPoint: function (theMeter, pointDesc) {
        var i,
            len = theMeter.meterPoints.length,
            meterPoint;

        for (i = 0; i < len; i++) {
            if (pointDesc.toLowerCase() === theMeter.meterPoints[i].meterPointDesc.toLowerCase()) {
                meterPoint = theMeter.meterPoints[i];
                break;
            }
        }

        return meterPoint;
    },
    monthsYearsArray: [],
    addYearValuesToList: function () {
        var newList = [],
            currentList = tou.monthYearList(),
            lenOfList = currentList.length,
            i,
            currentYear,
            previousYear = moment().format("YYYY");

        for (i = 0; i < lenOfList; i++) {
            currentYear = moment(currentList[i].theDate).format("YYYY");

            if (currentYear !== previousYear) {
                newList.push({
                    text: previousYear,
                    theDate: moment("01/01/" + previousYear, "MM/DD/YYYY").format(),
                    period: "year"
                });
                previousYear = currentYear;
            }
            newList.push(currentList[i]);
        }
        newList.push({
            text: currentYear,
            theDate: moment("01/01/" + currentYear, "MM/DD/YYYY").format(),
            period: "year"
        });

        return newList;
    },
    monthYearList: function () {
        var count = 1,
            todaysDate = new Date(),
            beginningOfHistoryDate = new Date("03/01/2011"),
            currentMonth = moment().format("MMMM"),
            currentYear = new Date().getFullYear(),
            backInMonths = (moment(todaysDate).diff(moment(beginningOfHistoryDate), 'months', true) + 1), //  (10 * 12), // number of years
            currentRow = {};

        backInMonths = parseInt(backInMonths, 10);
        if (tou.monthsYearsArray.length === 0) {
            while (count < backInMonths) {
                if (currentYear == moment(todaysDate).format("YYYY")) {
                    if (currentMonth === moment(todaysDate).format("MMMM")) {
                        currentRow = {
                            text: "This Month",
                            theDate: moment(todaysDate).format(),
                            period: "month"
                        };
                    } else {
                        currentRow = {
                            text: moment(todaysDate).format("MMMM"),
                            theDate: moment(todaysDate).format(),
                            period: "month"
                        };
                    }
                } else {
                    currentRow = {
                        text: moment(todaysDate).format("MMMM, YYYY"),
                        theDate: moment(todaysDate).format(),
                        period: "month"
                    };
                }
                tou.monthsYearsArray.push(currentRow);
                todaysDate = moment(todaysDate).subtract(1, "month");
                count++;
            }
        }

        return tou.monthsYearsArray;
    },
    objectWithoutProp: function (obj, prop) {
        var ret = {};

        tou.forEach(obj, function (val, key) {
            if (key !== prop) {
                ret[key] = val;
            }
        });

        return ret;
    },
    forEach: function (obj, fn) {
        var keys = Object.keys(obj),
            c,
            len = keys.length,
            errorFree = true;

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(obj[keys[c]], keys[c], c);
            if (errorFree === undefined) {
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

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(list[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    forEachArrayRev: function (arr, fn) {
        var c,
            list = arr || [],
            len = list.length,
            errorFree = true;

        for (c = len - 1; c >= 0 && errorFree; c--) {
            errorFree = fn(list[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },

    eventLog: [],
    eventHandlers: {},
    on: function (event, handler) {
        tou.eventHandlers[event] = tou.eventHandlers[event] || [];
        tou.eventHandlers[event].push(handler);
    },
    fire: function () {
        var args = Array.prototype.slice.call(arguments),
            event = args.shift();

        tou.forEachArray(tou.eventHandlers[event], function (handler) {
            handler.apply(this, args);
        });
    },
    onLoadFns: [],
    onLoad: function (fn) {
        if (!tou.loaded) {
            tou.onLoadFns.push(fn);
        } else {
            fn();
        }
    },
    pages: {},
    utilities: {},
    modals: {},
    globalModals: {
        touConfirm: {
            message: '',
            showBody: true
        },
        touAlert: {
            message: '',
            hideOK: false
        },
        addUtility: {
            utilityType: '',
            utilityName: ''
        },
        editUtility: {
            utilityName: ''
        }
    },
    modalTemplates: {},
    modalDefaults: {},
    processModalTemplate: function (tVal, tKey) {
        var observableTemplate = {},
            noResets = [];

        if (!tou.modalTemplates[tKey]) {
            observableTemplate.errorMessages = ko.observableArray([]);
            tou.modalDefaults[tKey] = tou.modalDefaults[tKey] || {};

            tou.forEach(tVal, function (cfg, key) {
                var val;
                if (key === 'computeds') {
                    tou.forEach(cfg, function (computed, cKey) {
                        observableTemplate[cKey] = ko.computed(computed(observableTemplate));
                    });
                } else if (key === 'noReset') {
                    return;
                } else {
                    if (typeof cfg === 'object' && !Array.isArray(cfg)) {
                        val = cfg.val; //get cfg.toKO and cfg.fromKO here, formatting, lookup, etc
                    } else {
                        val = cfg;
                    }
                    if (Array.isArray(val)) {
                        observableTemplate[key] = ko.observableArray(val);
                    } else if (typeof val === 'function') {
                        observableTemplate[key] = val.bind(observableTemplate);
                    } else {
                        observableTemplate[key] = ko.observable(val);
                    }
                }
            });

            tou.modalTemplates[tKey] = observableTemplate;
            tou.modalDefaults[tKey] = $.extend(true, {}, tVal);
        }
    },
    showModal: function (modalName, bindings, page) {
        var modal = tou.modals[modalName + 'Modal'],
            modalEl = modal.el,
            context = modal.context;

        if (modalEl) {
            if (page) {
                if (context.$page !== page) {
                    tou.resetModal(modal);
                }
                context.$page = page;
            }

            if (bindings) {
                tou.forEach(bindings, function (binding, key) {
                    if (context.$data[key]) {
                        if (Array.isArray(binding) && typeof binding[0] === 'object') {
                            context.$data[key](ko.mapping.fromJS(binding)());
                        } else {
                            context.$data[key](binding);
                        }
                    }
                });
            }
            tou.currModal = modal;
            modalEl.modal('show');
        }
    },

    resetModal: function(modal) {
        var defaults = tou.modalDefaults[modal.name],
            data = modal.context.$data;

        tou.forEach(defaults, function (val, key) {
            if (typeof val !== 'function' && key !== 'computeds' && key !== 'noReset' && !(defaults.noReset && defaults.noReset[key])) {
                data[key](val);
            }
        });

        data.errorMessages([]);
    },

    hideModal: function () {
        var modal = tou.currModal,
            defaults,
            data;
        if (tou.currModal) {
            tou.resetModal(modal);
            modal.el.modal('hide');
            tou.currModal = null;
        }
    },

    $pages: '.page .mainContent',

    getPageHeight: function () {
        var windowHeight = $(window).height(),
            activePage = tou.bindings.activePage(),
            shortTitle = activePage.shortTitle,
            currPage = activePage.title.toLowerCase(),
            currUtility = tou.currUtility.shortName,
            barHeight = $('.' + currUtility + ' .' + (shortTitle || currPage) + ' .topBar').outerHeight();

        // tou.log('WindowHeight:', windowHeight, ' BarHeight:', barHeight, ' Page Height:', windowHeight - barHeight);

        return windowHeight - barHeight;
    },

    doPageResize: function () {
        $(tou.$pages).height(tou.getPageHeight() - 20);//20 for padding/margin
    },

    weatherPoints: {
        OAT: null,
        CDD: null,
        HDD: null
    },
    getWeatherPoints: function () {
        $.ajax({
            url: '/api/system/weather'
        }).done(function (data) {
            tou.processWeatherPoints(data);
        });
    },
    processWeatherPoints: function (data) {
        var key,
            val,
            keyLookup = {
                'Outside Air Temperature Point': 'OAT',
                'Heating Degree Days Point': 'HDD',
                'Cooling Degree Days Point': 'CDD'
            };
        for (key in data) {
            val = data[key];
            tou.weatherPoints[keyLookup[key]] = val && val._id;
        }
    },
    getUtilityConfig: function(utility) {
        var name = utility.utilityName,
            type = utility.utilityType,
            pages = $.extend(true, [], tou.utilityPages[type]());

        return {
            name: name,
            type: type,
            pages: pages,
            rawUtility: utility
        };
    },
    initUtilities: function() {
        tou.forEachArray(tou.rawUtilities, function(utility, idx) {
            var config = tou.getUtilityConfig(utility);

            config.active = idx === 0;

            tou.registerUtility(config);
        });

        tou.fire('utilitiesLoaded');
    },

    initSocket: function(cb) {
        var socket = io.connect(window.location.origin);
        socket.on('connect', function() {
            tou.socket = socket;
            tou.socketid = socket.id;

            cb();
        });

        socket.on('disconnect', function () {
        //     tou.initSocket(function () {
            tou.forEachArray(tou.dashboardItems, function(item) {
                item.socketReconnect();
            });
        //     });
        });

        socket.on('updateDashboard', function (data) {
            var row = data[0],
                touid = row.touid.split('-')[0];

            tou.forEachArray(tou.dashboardItems, function(item) {
                if (item.touid === touid) {
                    item.handleSocket(row);
                }
                // tou.log('socket', touid);
            });
        });

        tou.keepAliveInterval = setInterval(function() {
            $.ajax({
                url: '/home'
            }).done(function (data) {
                return;
            });
        }, 1000 * 60 * 15);
    },

    init: function () {
        var $body = $('body'),
            $leftBar = $('.leftBar'),
            loaded = false,
            socketFinished = function() {
                if (!loaded) {
                    loaded = true;
                    $body.removeClass('loading');
                    $('.pages a').eq(0).addClass('selected');
                    $leftBar.jScrollPane({
                        verticalGutter: 0
                    });
                    tou.fire('loaded');
                }
            };

        $body.mousedown(function (e) {
            if (e.button == 1) {
                return false;
            }
        });

        tou.poppedIn = window.top.location.href !== window.location.href;
        tou.workspaceManager = window.opener && window.opener.workspaceManager;
        tou._openWindow = tou.workspaceManager && tou.workspaceManager.openWindowPositioned;

        tou.processWeatherPoints(tou._weatherPoints);

        tou.currUtility = tou.rawUtilities[0];
        if (tou.currUtility) {
            tou.currUtility.shortName = tou.currUtility.utilityName.replace(/ /g, '_');
            tou.buildMeterList(tou.currUtility.Meters);
            tou.buildAvailablePeriods();
        }

        String.prototype.capFirst = function () {
            return this.charAt(0).toUpperCase() + this.slice(1);
        };

        tou.initUtilities();

        tou.bindings.activeUtility.subscribe(function(utilityName) {
            tou.currUtility = tou.getRawUtility(utilityName);
            tou.buildMeterList(tou.currUtility.Meters);
            tou.buildAvailablePeriods();
            tou.doPageResize();
        });

        tou.initSocket(socketFinished);

        tou.on('loaded', function () {
            tou.loaded = true;
            tou.bindings.loaded(true);
            tou.forEachArray(tou.onLoadFns, function (fn) {
                fn();
            });
            tou.onLoadFns = [];
        });

        if (tou.poppedIn) {
            $body.addClass('poppedIn');
        }

        $body.tooltip({
            selector: '[data-toggle="tooltip"]',
            container: 'body'
        });

        $body.on('hidden.bs.modal', tou.hideModal);

        $(document).on('show.bs.modal', '.modal', function () {
            var zIndex = 1040 + (10 * $('.modal:visible').length);
            $(this).css('z-index', zIndex);
            setTimeout(function() {
                $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
            }, 0);
        });

        tou.forEach(tou.globalModals, tou.processModalTemplate);

        tou.forEachArray(tou.rawUtilities, function (utility) {
            tou.utilities[utility.utilityName] = utility;
        });

        $(window).resize(function () {
            tou.doPageResize();
            $leftBar.data('jsp').reinitialise();
        });

        tou.initKnockout();
    },

    initKnockout: function () {
        //automatically creates a child context, so you can access the page's bindings via $parent in the modal jade
        ko.bindingHandlers.touModal = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var $element = $(element),
                    modalName = valueAccessor(),
                    modalTemplate = tou.modalTemplates[modalName],
                    bindings = allBindings(),
                    touPage = bindings.touPage,
                    page,
                    childContext,
                    currUtility;

                childContext = bindingContext.createChildContext(modalTemplate);

                if (touPage) {
                    utility = touPage.split('-');
                    page = utility[1].replace(/ /g, '_');
                    currUtility = tou.currUtility.utilityName;
                    if (tou.pages[currUtility]) {
                        page = tou.pages[currUtility][page];
                        childContext.$page = page;
                    }
                }

                bindingContext.$root[modalName + 'Context'] = childContext;

                ko.applyBindingsToDescendants(childContext, element);

                tou.modals[modalName + 'Modal'] = {
                    el: $element,
                    context: childContext,
                    name: modalName
                };

                $element.addClass(modalName + 'Modal');
                $element.attr({
                    'data-backdrop': 'static',
                    'data-keyboard': 'false'
                });

                return {
                    controlsDescendantBindings: true
                };
            }
        };

        ko.virtualElements.allowedBindings.trendPlot = true;

        ko.bindingHandlers.trendPlot = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var $parentElement = $(ko.virtualElements.firstChild(element)),//$(ko.virtualElements.firstChild(element).nextSibling),
                    $element = $parentElement.find('.portlet'),
                    observable = valueAccessor(),
                    bindings = allBindings(),
                    trendPlot,
                    utilityName = viewModel.utilityName,
                    config = $.extend({
                        $element: $element,
                        utilityName: utilityName
                    }, observable);

                if ($element.length === 0) {
                    config.$element = $parentElement;
                }

                if (!observable._cfg) {//not a dashboarditem
                    trendPlot = new tou.DashboardItem(config);
                    $.extend(bindingContext.$data, trendPlot);
                    // bindingContext._rawConfig = $.extend(true, {}, config);
                } else {
                    trendPlot = new tou.DashboardItem(config);
                    $.extend(bindingContext.$data, trendPlot);
                }
            }
        };

        ko.virtualElements.allowedBindings.onlyOneCheck = true;

        ko.bindingHandlers.onlyOneCheck = {
            init: function (element, valueAccessor) {
                var $children = $(ko.virtualElements.childNodes(element)),
                    $checks = $children.find('input:checkbox'),
                    active = false;

                $checks.change(function (event) {
                    var $target = $(event.target),
                        $others = $children.find(':checked').not($target);

                    $others.each(function (idx, $element) {
                        $element.click();
                    });

                    // if (!active) {
                    //     active = true;
                    //     $checks.not($target).change();
                    //     active = false;
                    // }
                    return true;
                });
            },
            update: function (element, valueAccessor) {

            }
        };

        ko.bindingHandlers.datepicker = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var options = {
                    autoclose: true,
                    startView: 'year'
                };
                $(element).datepicker(options).on("changeDate", function (ev) {
                    var observable = valueAccessor(),
                        val = observable();

                    if (ev.date) {
                        observable(ev.date);
                    } else {
                        if (val !== '') {
                            $(element).datepicker('setDate', val);
                        }
                    }
                });
            },
            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                $(element).datepicker("setDate", value);
            }
        };

        ko.bindingHandlers.timepicker = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                //initialize timepicker with some optional options
                var observable = valueAccessor(),
                    options = {
                        doneText: 'Done',
                        autoclose: true,
                        afterDone: function () {
                            observable($(element).val());
                        }
                    };

                $(element).clockpicker(options);

                $(element).change(function (event) {
                    $(element).clockpicker('resetclock');
                });
            },

            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    hr,
                    min;

                if (typeof value !== 'string') {
                    hr = ('00' + Math.floor(value / 100)).slice(-2);
                    min = ('00' + value % 100).slice(-2);
                    $(element).val(hr + ':' + min);
                } else {
                    $(element).val(value);
                }
            }
        };

        ko.bindingHandlers.editableText = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var observable = valueAccessor(),
                    currValue = observable && observable(),
                    $element = $(element),
                    index = bindingContext.$index(),
                    rateName = bindingContext.$parent.name(),
                    boundTable = bindingContext.$parentContext.$parentContext.$data;

                if (currValue !== undefined) {
                    $element.val(currValue);
                }

                if (observable === undefined) {
                    tou._invalidRates = tou._invalidRates || [];
                    tou._invalidRates.push({
                        data: bindingContext.$data,
                        parent: bindingContext.$parent
                    });
                }

                $element.on('blur', function () {
                    if (observable) {
                        observable($(this).val());
                    }
                    // boundTable.modifierQueue.push({
                    //     rate: rateName,
                    //     periodIdx: index,
                    //     value: $(this).val()
                    // });
                });

                //tou.on('ratetablesaved', function () {
                //    $element.data('newvalue', null);
                //    $element.val(currValue);
                //});
                tou.on('ratetablecancel', function () {
                    $element.val(currValue);
                });
            },
            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                $(element).val(value);
            }
        };

        ko.bindingHandlers.sortableArray = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var observable = valueAccessor(),
                    $element = $(element),
                    // enabled = false,
                    allBindings = allBindingsAccessor(),
                    offset = allBindings.indexOffset || 0,
                    sortIf = allBindings.sortIf,
                    handle = allBindings.handle,
                    initSortable = function () {
                        $element.sortable({
                            helper: tou.cellWidthHelper,
                            cancel: '.static',
                            handle: handle,
                            stop: function (event, ui) {
                                var item = ko.dataFor(ui.item[0]),
                                    list = observable(),
                                    newIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]) - offset;

                                if (newIndex >= list.length) {
                                    newIndex = list.length - 1;
                                }
                                if (newIndex < 0) {
                                    newIndex = 0;
                                }

                                ui.item.remove();
                                observable.remove(item);
                                observable.splice(newIndex, 0, item);
                            }
                        });
                    };

                if (sortIf) {
                    if (sortIf()) {
                        initSortable();
                    }

                    sortIf.subscribe(function (val) {
                        if (val) {
                            initSortable();
                        } //sortable automatically destroys instances on node removal
                    });
                } else {
                    initSortable();
                }
            }
        };

        ko.bindingHandlers.dragAndDrop = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var observable = valueAccessor(),
                    bindings = allBindingsAccessor(),
                    targetClass = bindings.targetClass,
                    $element = $(element),
                    $targets = $element.find(targetClass),
                    $dropTarget = $element.parent();//$(bindings.dropTarget);

                $targets.draggable({
                    revert: 'invalid',
                    helper: 'clone',
                    cursor: 'move'
                });
                $dropTarget.droppable({
                    accept: targetClass,
                    drop: function (evt, options) {
                        var type = $(options.draggable).data('type');

                        observable(type, true);
                    }
                });
            }
        };

        ko.bindingHandlers.slider = {
            init: function (element, valueAccessor) {
                var observable = valueAccessor(),
                    $element = $(element);

                $element.bootstrapSlider({
                    reversed: true,
                    tooltip: 'hide',
                    value: observable()
                }).on('slide', function (newValue) {
                    observable(newValue.value);
                });
            },
            update: function (element, valueAccessor) {
                var observable = valueAccessor(),
                    value = observable(),
                    $element = $(element);

                $element.bootstrapSlider('setValue', value);
            }
        };

        ko.bindingHandlers.hiddenUpload = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var $element = $(element),
                    bindings = allBindingsAccessor(),
                    backgroundObservable = valueAccessor(),
                    target = $element.data('target'),
                    $fileTarget = $('#' + target),
                    changeHandler = function (e) {
                        var file = $fileTarget[0].files[0];

                        backgroundObservable(file);
                        // reader = new FileReader();

                        // reader.onload = function(ee) {
                        //     backgroundObservable(file);
                        // };

                        // reader.readAsDataURL(file);
                    };

                $element.click(function () {
                    $fileTarget.click();
                });

                $fileTarget.change(changeHandler);
            }
        };

        ko.bindingHandlers.stopBindings = {
            init: function () {
                return {
                    controlsDescendantBindings: true
                };
            }
        };

        ko.applyBindings(tou.bindings);
        tou.knockoutLoaded = true;
    },

    bindings: {
        backgroundImage: ko.observable('/img/dashboard/backgrounds/singleleaf.jpg'),

        showMainBackground: ko.observable(false),

        activePage: ko.observable(),

        activeUtility: ko.observable(),

        loadModals: ko.observable(false),

        loaded: ko.observable(false),

        utilities: ko.observableArray([]),

        utilityTypes: ko.observable(['Electricity']),

        viewableUtilities: ko.observable(0),

        addUtility: function () {
            tou.showModal('addUtility');
        },

        saveUtility: function (kodata) {
            var data = ko.toJS(kodata),
                type = data.utilityType,
                name = data.utilityName,
                valid = true;

            if (name === '' || name.match(/[^a-zA-Z0-9 ]/g)) {
                kodata.errorMessages(['Invalid Utility Name']);
            } else {
                tou.forEachArray(tou.rawUtilities, function (utility) {
                    if (utility.utilityName === name) {
                        valid = false;
                        return false;
                    }
                });

                if (!valid) {
                    kodata.errorMessages(['Duplicate Utility Name']);
                } else {
                    tou.hideModal();
                    tou.addUtility(type, name);
                }
            }
        },

        editUtility: function (utility) {
            tou._editUtility = utility;
            tou.showModal('editUtility', {
                utilityName: utility.name
            });
        },

        updateUtility: function (kodata) {
            var name = tou._editUtility.name,
                data = ko.toJS(kodata),
                newName = data.utilityName,
                duplicateName = false,
                utility;

            tou.forEachArray(tou.rawUtilities, function (utility) {
                if (utility.utilityName === newName) {
                    duplicateName = true;
                    return false;
                }
            });

            if (newName !== name) {
                if (newName === '' || newName.match(/[^a-zA-Z0-9 ]/g)) {
                    kodata.errorMessages(['Invalid Utility Name']);
                } else if (duplicateName) {
                    kodata.errorMessages(['Duplicate Utility Name']);
                } else {
                    // if (newName !== name) {
                    //     tou.utilities[newName] = utility = tou.utilities[name];
                    //     delete tou.utilities[name];

                    //     utility.shortName = newName.replace(/ /g, '_');
                    //     utility.utilityName = newName;

                    //     tou.pages[newName] = tou.pages[name];
                    //     delete tou.pages[name];

                    //     tou.forEachArray(tou.pages[newName], function (page) {
                    //         page.utilityName = newName;
                    //         page.utilityNameShort = utility.shortName;
                    //     });

                    //     tou.forEachArray(tou.bindings.utilities(), function (boundUtility) {
                    //         if (boundUtility.name === name) {
                    //             boundUtility.name = newName;
                    //             boundUtility.obName(newName);
                    //             boundUtility.shortName = utility.shortName;
                    //             tou.forEachArray(boundUtility.pages, function (page) {
                    //                 page.utilityName = name;
                    //                 page.utilityNameShort = utility.shortName;
                    //                 page.rawUtility = utility;
                    //             });
                    //         }
                    //     });

                        tou.saveUtility(name, {
                            'utilityName': newName
                        }, function (response) {
                            // tou.hideModal();
                            tou.alert('Reloading Page, please wait', true);
                            window.location.reload();
                            // tou.log(response);
                        }, true);

                        // tou.hideModal();
                    //}// else, nothing changed
                }
            } else {
                tou.hideModal();
            }
        },

        deleteUtility: function () {
            var name = tou._editUtility.name;

            tou.hideModal();

            setTimeout(function () {
                tou.deleteUtility(name);
            }, 50);
        },

        pageClick: function (page) {
            var pageTitle = (page.shortTitle || page.title.replace(/ /g, '')),
                pageDashTitle = page.shortTitle || page.title.replace(/ /g, '_'),
                shortTitle = pageTitle.toLowerCase(),
                activePage = tou.bindings.activePage(),
                activeTitle = activePage.title.replace(/ /g, ''),
                utilityName = page.utilityName.replace(/ /g, '_');

            // activePage.utility.pages[activePage.utility.pageMatrix[activeTitle]].isActive(false);

            // activePage.isActive(false);

            tou.bindings.activePage(page);
            tou.currPage = page;
            page.isActive(true);

            tou.bindings.backgroundImage(tou.backgroundFolder + page.background);

            tou.bindings.showMainBackground(shortTitle !== 'dashboard');

            if (page.delayLoad && !page.loaded) {
                page.loaded = true;
                page.init();
            }

            $('.' + utilityName + ' > div').css('display', 'none');
            $('.' + utilityName + ' .' + shortTitle).css('display', 'block');

            $('.leftBar .' + utilityName + ' .pages a.selected').removeClass('selected');
            $('.leftBar .' + utilityName + ' .' + pageDashTitle).addClass('selected');

            tou.fire('pageClick', pageTitle);
        },

        popInOut: function () {
            var _target = 'mainWindow';

            if (tou.poppedIn) {
                _target = '';
            }

            tou._openWindow(window.location.href, 'Dashboard', 'Dashboard', _target, 'dashboard');

            tou.poppedIn = !tou.poppedIn;

            return false;
        },
        popInOutText: function () {
            if (tou.poppedIn) {
                return 'Pop Out';
            }
            return 'Pop In';
        },
        popInOutClass: function () {
            if (tou.poppedIn) {
                return 'fa-arrow-circle-up';
            }
            return 'fa-arrow-circle-down';
        },
        canRead: function (security) {
            var user = tou.workspaceManager.user();
            if (!!user["System Admin"].Value) {
                return true;
            }

            for (var i = 0; i < user.groups.length; i++) {
                if (security.indexOf(user.groups[i]._id) > -1) {
                    return true;
                }
            }
            return false;
        },
        canWrite: function (security) {
            var user = tou.workspaceManager.user();
            if (!!user["System Admin"].Value) {
                return true;
            }

            for (var i = 0; i < user.groups.length; i++) {
                if (security.indexOf(user.groups[i]._id) > -1 && (user.groups[i]._pAccess & 8) !== 0) {
                    return true;
                }
            }
            return false;
        }
    },
    Utility: function (cfg) {
        var config = $.extend(true, {}, cfg),
            pageBindings,
            computedBindings,
            page,
            activePage,
            rawUtility = config.rawUtility,
            utilityName = config.name,
            shortName = utilityName.replace(/ /g, '_'),
            createComputed = function (binding, name) {
                pageBindings[name] = ko.computed(binding.bind(pageBindings));
            },
            loadedPages = 0,
            self = {
                initFns: [],
                pages: config.pages,
                loaded: config.active,
                bindings: {
                    obName: ko.observable(config.name),
                    name: config.name,
                    shortName: shortName,
                    pages: config.pages,
                    active: ko.observable(config.active),
                    type: config.type,
                    loaded: ko.observable(config.active),
                    deactivate: function() {
                        self.bindings.active(false);
                    },
                    activate: function() {
                        tou.forEachArray(tou.bindings.utilities(), function(utility){
                            if (utility.name !== self.bindings.name) {
                                utility.deactivate();
                            }
                        });

                        self.bindings.active(true);

                        tou.bindings.pageClick(self.pages[0]);
                    }
                }
            },
            runInits = function() {
                tou.forEachArray(self.initFns, function (cfg) {
                    var fn = cfg.fn,
                        scope = cfg.page;

                    fn.call(scope);
                });
            },
            isAdmin = tou.isSystemAdmin();

        tou.pages[utilityName] = {};

        if (config.active) {
            tou.bindings.activeUtility(utilityName);
        }

        //init
        tou.forEachArray(self.pages, function (page, idx) {
            page.adminOnly = page.adminOnly || false;

            if(!tou.currPage) {
                tou.currPage = page;
            }

            tou.pages[utilityName][page.title.replace(/ /g, '_')] = page;

            page.utilityName = utilityName;
            page.utilityNameShort = shortName;
            page.rawUtility = rawUtility;

            tou.preloadImage(page.background);

            pageBindings = page.bindings || {};
            computedBindings = page.computedBindings || {};

            pageBindings.$page = page;
            page.shouldShow = !page.adminOnly || (page.adminOnly && tou.isSystemAdmin());
            page.utility = self;

            tou.forEach(computedBindings, createComputed);

            self.bindings[(page.shortTitle || page.title.replace(/ /g, '').toLowerCase()) + 'Bindings'] = pageBindings;

            if (page.modalTemplates) {
                tou.forEach(page.modalTemplates, tou.processModalTemplate);
            }

            if (page.isActive()) {
                activePage = page;
                // tou.bindings.activeUtility(utilityName);
                tou.bindings.activePage(page);
            }

            if (!page.delayLoad) {
                self.initFns.push({
                    page: page,
                    fn: page.init || tou.emptyFn
                });
            } else {
                page.loaded = false;
            }
        });

        //if (config.active) {
        //    tou.on('loaded', function () {
        //        tou.bindings.pageClick(activePage);
        //    });
        //}

        tou.bindings.utilities.push(self.bindings);
        tou.bindings['utility_' + shortName] = self.bindings;

        self.$el = $('.utility.' + shortName).parent();

        if (tou.loaded) {
            ko.cleanNode(self.$el[0]);
            ko.applyBindings(tou.bindings, self.$el[0]);
        }

        if (config.active && tou.bindings.canRead(config.rawUtility.Security)) {
            runInits();
        }

        self.bindings.active.subscribe(function(val) {
            var display = val?'block':'none';

            if (val) {
                tou.bindings.activeUtility(config.name);
                if (!self.bindings.loaded()) {
                    self.bindings.loaded(true);
                    runInits();
                }
            }

            $('.utility.' + shortName).css('display', display);
        });

        return self;
    },
    registerUtility: function (config, activate) {
        var utility = new tou.Utility(config),
            canRead = tou.bindings.canRead(config.rawUtility.Security);

        config.rawUtility.shortName = config.name.replace(/ /g, '_');

        tou.utilityList.push(utility);

        if (canRead) {
            tou.bindings.viewableUtilities(tou.bindings.viewableUtilities() + 1);
        }

        if (activate && canRead) {
            utility.bindings.activate();
            tou.bindings.loadModals(true);
        }
    }
};

tou.utilityPages.Electricity = function() {
    return [{
        title: 'Dashboard',
        isActive: ko.observable(true),
        background: 'singleleaf.jpg',
        gutter: 30,
        $portlets: $('.portlet'),
        currItem: null,
        bindings: {
            isEditMode: ko.observable(false),
            toEditMode: function () {
                this.isEditMode(true);
            },
            cancelEditMode: function () {
                this.$page.doCancel();
                this.isEditMode(false);
            },
            save: function () {
                this.$page.doSave();
                this.isEditMode(false);
            },
            uploadBackground: function (file) {
                this.$page.uploadImage(file);
            },
            noMeters: ko.observable(true),
            noPeriods: ko.observable(true),
            loaded: ko.observable(false),
            useColor: ko.observable(false),
            background: ko.observable('singleleaf.jpg'),
            oldBackground: ko.observable(''),
            dashboardItems: ko.observableArray([]),
            backgroundImages: ko.observableArray([]),
            headerItems: ko.observableArray([]),
            bgColor: ko.observable('000000'),
            bgOpacity: ko.observable(100),
            bgBrightness: ko.observable(100),
            newBackground: ko.observable(),
            uploadPreview: ko.observable(),
            showBackgroundModal: function () {
                var data = {
                    bgColor: this.bgColor(),
                    background: this.background(),
                    useColor: this.useColor(),
                    backgroundImages: this.backgroundImages()
                };

                if (data.useColor) {
                    data.background = this.oldBackground();
                }

                data.uploadImageFn = this.$page.uploadImage.bind(this.$page);

                tou.showModal('electricityDashboardSelectBackground', data, this.$page);
            },
            updateDashboardBackground: function (kodata) {
                var data = ko.toJS(kodata),
                    newBackground = data.background;

                this.bindings.useColor(data.useColor);
                this.bindings.bgColor(data.bgColor);

                if (!data.useColor) {
                    this.bindings.background(newBackground);
                } else {
                    this.bindings.oldBackground(this.bindings.background());
                    this.bindings.background('blank.png');
                }
                tou.hideModal();
            },
            selectBackground: function (kodata) {
                tou.log(ko.toJS(kodata));
            },
            editDashboardItem: function (kodata) {
                var data = ko.toJS(kodata),
                    page = data.getPage(),
                    item = data.getInstance();

                if (page.bindings.isEditMode()) {
                    page.currItem = item;
                    page.currBindings = $.extend(true, {}, ko.toJS(item.bindings) || {});

                    page.setWithOptions(data);

                    data.withDataOptions = page.withDataOptions;

                    tou.showModal('electricityEditDashboardItem', data, page);
                }
            },
            updateDashboardItem: function (kodata) {
                var page = this,
                    data = ko.toJS(kodata),
                    currItem = page.currItem,
                    currBindings = page.currBindings,
                    changedProps = {};

                tou.forEach(data, function (val, key) {
                    if (currBindings.hasOwnProperty(key) && currBindings[key] !== val) {
                        changedProps[key] = val;
                        // tou.log(key, 'changed to', val);
                    }
                });

                currItem.processUpdates(changedProps);

                tou.hideModal();
            },
            deleteDashboardItem: function (kodata) {
                this.currItem.destroy();
                tou.hideModal();
            }
        },
        computedBindings: {
            configRequired: function() {
                return this.noMeters() || this.noPeriods();
            }
        },
        modalTemplates: {
            electricityDashboardSelectBackground: {
                bgColor: '',
                background: '',
                backgroundImages: [],
                useColor: false,
                backgroundPreview: '',
                uploadImageFn: '',
                newBackgroundHandler: function (uploadedBackground) {
                    this.uploadImageFn()(uploadedBackground);
                },
                selectBackground: function (background) {
                    this.background(background);
                    this.useColor(false);
                }
            },
            electricityEditDashboardItem: {
                period: 'Week',
                title: '',
                width: 1,
                height: 1,
                dataSource: 'Consumption',
                withDataSource: 'None',
                useFiscalYear: true,
                type: '',
                style: '180',
                colorStopsType: 'percent',
                colorStops: [],
                withDataOptions: [],
                showOAT: false,
                showHDD: false,
                showCDD: false,
                addColorStop: function () {
                    this.colorStops.push({
                        from: ko.observable(''),
                        to: ko.observable(''),
                        color: ko.observable('#000000')
                    });
                },
                computeds: {
                    titleText: function (scope) {
                        return function () {
                            return 'Update ' + scope.type() + ' Widget';
                        };
                    }
                },
                noReset: {
                    'withDataOptions': true,
                    showOAT: true,
                    showCDD: true,
                    showHDD: true
                }
            }
        },
        doCancel: function() {
            var self = this;

            self.$packeryTarget.parent().block({message:''});
            self.initItems();
            self.initPackery();
            self.$packeryTarget.parent().unblock();
        },
        doSave: function () {
            var self = this,
                template = self.getItemTemplate('Trend'),
                properties = Object.keys(template),
                settingsProperties = Object.keys(self.rawUtility.Dashboard.settings),
                bindings = self.bindings,
                utilityName = self.utilityName,
                headeritems = [],
                dashboarditems = {},
                dashboardList = [],
                settings = {},
                types = {
                    Trend: 'column',
                    Gauge: 'solidgauge',
                    Statistic: 'statistic'
                },
                getExportData = function (item) {
                    var data = ko.toJS(item.bindings),
                        ret = {};

                    tou.forEachArray(properties, function (property) {
                        ret[property] = data[property];
                    });

                    return ret;
                },
                packeryElements = self.$packeryTarget.packery('getItemElements');

            tou.forEachArray(tou.dashboardItems, function (item) {
                if (item.getUtility().utilityName === utilityName) {
                    var config = getExportData(item);

                    config.type = types[config.type];

                    if (item.type === 'Statistic' && !item.mainContent) {
                        headeritems.push(config);
                    } else {
                        dashboarditems[item.touid] = config;
                    }
                }
            });

            tou.forEachArray(packeryElements, function(el) {
                var data = ko.dataFor(el);

                dashboardList.push(dashboarditems[data.touid]);
            });

            tou.forEachArray(settingsProperties, function (property) {
                settings[property] = bindings[property]();
            });

            self.rawUtility.Dashboard.headeritems = headeritems;
            self.rawUtility.Dashboard.dashboarditems = dashboardList;
            self.rawUtility.Dashboard.settings = settings;

            tou.saveUtility(self.rawUtility.utilityName, {
                'Dashboard': self.rawUtility.Dashboard
            }, function (response) {
                tou.log(response);
            });
        },
        getItemTemplate: function (type, mainContent) {
            var types = {
                    Trend: 'column',
                    Gauge: 'solidgauge',
                    Statistic: 'statistic'
                },
                ret = {
                    width: 'singleCol',
                    height: 'singleRow',
                    title: 'Title',
                    type: types[type],
                    peak: '',
                    units: 'kW',
                    dataSource: '',
                    withDataSource: '',
                    period: 'day',
                    style: 180,
                    mainContent: mainContent,
                    colorStopsType: 'percent',
                    colorStops: [{
                        from: '',
                        to: '',
                        color: '#000000'
                    }]
                };

            return ret;
        },
        addNewItem: function (type, mainContent, cfg) {
            var self = this,
                newIdx = self.dashboardItems.length,
                config = cfg || self.getItemTemplate(type, mainContent),
                item;

            config.page = self;
            config.utilityName = self.utilityName;

            if (type === 'Statistic' && !mainContent) {
                self.bindings.headerItems.push(config);
            } else {
                config.$element = self.appendTemplate(newIdx);
                item = new tou.DashboardItem(config, newIdx);
                self.dashboardItems.push(item);
                self.updateLayout(config.$element);
            }
        },
        updatePackeryElements: function () {
            var self = this;

            self.portletSelector = '.' + self.utilityNameShort + ' .portlet';
            self.$portlets = $(self.portletSelector);
            self.$packeryTarget = $('.' + self.utilityNameShort + ' .dashboard .mainContent .innerContent');
        },
        initPackery: function (isInit) {
            var self = this,
                measurements = self.getLayoutCSS(),
                hasDraggable = self.$portlets.draggable('instance');

            hasDraggable = hasDraggable && hasDraggable.started !== undefined;

            self.updatePackeryElements();

            self.packeryLoaded = true;

            if (Packery.data(self.$packeryTarget[0])) {
                self.$packeryTarget.packery('destroy');
            }

            self.$packeryTarget.packery({
                columnWidth: measurements.width.singleCol,
                rowHeight: self.rowHeight,
                itemSelector: '.portlet',
                gutter: self.gutter
            });

            self.$packeryTarget.packery('bindResize');

            if (self.bindings.isEditMode()) {
                self.draggies = [];
                $(self.portletSelector).each(function (i, itemElem) {
                    var draggie = new Draggabilly(itemElem, {
                        handle: '.dragHandle'
                    });

                    self.draggies.push(draggie);

                    self.$packeryTarget.packery('bindDraggabillyEvents', draggie);
                });
            }

            tou.doPageResize();
        },
        stopPackery: function () {
            tou.forEachArray(self.draggies, function (draggie) {
                draggie.disable();
            });
        },
        initLayout: function () {
            var self = this,
                measurements = self.getLayoutCSS();

            if (!self.hasLayout) {
                self.initPackery(true);
            }

            self.hasLayout = true;
        },
        updateLayout: function (element) {
            var self = this,
                measurements = self.getLayoutCSS();

            if (!self.loading) {
                if (!element) {
                    tou.forEachArray(self.draggies, function (draggie) {
                        draggie.destroy();
                    });
                    self.initPackery();
                } else {
                    // self.$packeryTarget.packery('reloadItems');
                    // self.$packeryTarget.packery('layout');
                    self.$packeryTarget.packery('fit', element[0]);
                }
            }
        },
        setLayoutCSS: function () {
            var self = this,
                measurements = self.getLayoutCSS(),
                markup = [];

            // tou.log('setLayoutCSS');

            self.rowHeight = measurements.height.singleRow;

            if (!tou.$layoutCSS) {
                tou.$layoutCSS = $('<style/>', {
                    id: 'touLayout',
                    html: ''
                });

                $('head').append(tou.$layoutCSS);
            }

            tou.forEach(measurements, function (entries, attribute) {
                tou.forEach(entries, function (amount, measurement) {
                    markup.push('.' + measurement + ' {' + attribute + ':' + amount + 'px;}');
                });
            });

            tou.$layoutCSS.html(markup.join(' '));

            tou.forEachArray(self.layoutFns, function(fn) {
                fn(measurements);
            });
        },
        layoutFns: [],
        onLayout: function(fn) {
            var self = this;

            self.layoutFns.push(fn);
        },
        getLayoutCSS: function () {
            var self = this,
                width = window.innerWidth - 140,// 100 for left bar, 40 for padding
                height = tou.getPageHeight() - 40, //20 is padding
                gutter = self.gutter,
                single = (height - (2 * gutter)) / 3,
                myDouble = single * 2 + gutter,
                triple = height,
                ret = {
                    width: {
                        singleCol: Math.floor(width / 3) - 28,
                        'doubleCol': Math.floor(width / 3) * 2 - 28,
                        tripleCol: width - 25
                    },
                    height: {
                        singleRow: single,
                        'doubleRow': myDouble,
                        tripleRow: triple
                    }
                };

            return ret;
        },
        uploadImage: function (file) {
            var self = this,
                data = new FormData();

            data.append(file.name, file);

            $.ajax({
                url: '/dashboard/uploadBackground',
                processData: false,
                type: 'POST',
                cache: false,
                contentType: false,
                data: data
            }).done(function (response) {
                if (response.err) {
                    tou.log('Upload error', response.err);
                } else {
                    var filename = file.name;
                    if(!!filename.match(/\s/)){
                        filename = filename.split(' ').join('_');
                    }

                    self.bindings.backgroundImages.push(filename);
                    self.bindings.background(filename);
                    tou.hideModal();
                }
            }).fail(function () {
                tou.alert(tou.criticalErrorText);
            });
        },
        appendTemplate: function(idx) {
            var self = this,
                template = $('#trendPlotTemplate').html();

            self.$packeryTarget.append(template.replace(/__IDX__/g, idx));

            return self.$packeryTarget.find('.dashboardItem' + idx);
        },
        initItems: function () {
            var self = this,
                settings = self.rawUtility.Dashboard.settings,
                utilityName = self.utilityName,
                newItems = [],
                items = [];

            tou.forEachArray(self.rawUtility.Dashboard.dashboarditems, function (item, idx) {
                if (item) {
                    items.push(item);
                } else {
                    tou.log('**Dashboard Error: Dashboard item', idx, 'null');
                }
            });

            self.rawUtility.Dashboard.dashboarditems = items;

            // self.numDashboardItems = self.numDashboardItems || 0;

            self.dashboardItems = [];
            self.bindings.headerItems([]);

            tou.forEachArrayRev(self.dashboardItems, function(item) {
                item.destroy();
            });

            tou.forEachArrayRev(tou.dashboardItems, function (item) {
                if (item.utilityName === utilityName) {
                    item.destroy();
                }
            });

            self.$packeryTarget.html('');

            // self.bindings.dashboardItems([]);

            tou.forEachArray(self.rawUtility.Dashboard.dashboarditems, function (item, idx) {
                var trendPlot;

                // if (idx >= self.numDashboardItems) {

                //     self.numDashboardItems++;
                // }

                item.$element = self.appendTemplate(idx);
                item.page = self;
                item.utilityName = utilityName;

                trendPlot = new tou.DashboardItem(item, idx);

                self.dashboardItems.push(trendPlot);
                newItems.push(trendPlot);
            });

            // self.bindings.dashboardItems(newItems);

            tou.forEachArray(self.rawUtility.Dashboard.headeritems, function(item) {
                self.addNewItem('Statistic', null, item);
            });
            // self.bindings.headerItems(self.rawUtility.Dashboard.headeritems);

            tou.forEach(settings, function (setting, settingName) {
                self.bindings[settingName](setting);
            });
        },
        setFiscalYears: function () {
            var self = this;

            self.fiscalYears = {};
            self.fiscalYear = tou.currUtility.RateTables['Fiscal Year'];

            tou.forEachArray(tou.availablePeriods[self.utilityName], function (period) {
                if (period.fullDate && period.fullDate.match('Fiscal Year')) {
                    self.fiscalYears[period.fiscalYear] = {
                        start: period.start,
                        end: period.end
                    };
                }
            });
        },
        setWithOptions: function (modalData) {
            var self = this,
                data = tou.bindings.electricityEditDashboardItemContext.$data,
                tempPointMatrix = {
                    'CDD': {
                        name: 'Cooling Degree Days',
                        showInList: false
                    },
                    'HDD': {
                        name: 'Heating Degree Days',
                        showInList: false
                    },
                    'OAT': {
                        name: 'Outside Air Temperature',
                        showInList: false
                    }
                },
                withDataOptions = ['None'];

            tou.forEach(tempPointMatrix, function (cfg, entryAbbr) {
                var entryString = cfg.name;
                if (tou.weatherPoints[entryAbbr]) {
                    withDataOptions.push(entryString);
                    cfg.showInList = true;
                }
            });

            if (modalData) {
                tou.forEach(tempPointMatrix, function (cfg, name) {
                    modalData['show' + name] = cfg.showInList;
                });
            }

            self.withDataOptions = withDataOptions;
            data.withDataOptions(withDataOptions);
        },
        init: function () {
            var self = this,
                resizeTimer = 200;

            self.loading = true;

            tou.bindings.loadModals(tou.rawUtilities.length > 0);

            self.$packeryTarget = $('.' + self.utilityName + ' .dashboard .mainContent .innerContent');

            self.setFiscalYears();

            self.initItems();

            if (self.bindings.useColor()) {
                self.bindings.background('blank.png');
            }

            self.loading = false;

            $(window).resize(function () {
                //tou.log('resize');
                if (tou.currPage && tou.currPage.title !== self.title) {
                    self.needsResize = true;
                } else {
                    self.lastResize = new Date();
                    // self.$packeryTarget.one('layoutComplete', function () {
                        setTimeout(function () {
                            //tou.log('resize timer:', new Date() - self.lastResize >= resizeTimer);
                            if (new Date() - self.lastResize >= resizeTimer) {
                                // self.$packeryTarget.packery('destroy');
                                self.setLayoutCSS();
                                self.updateLayout();
                            }
                        }, resizeTimer);
                    // });
                }
            });

            tou.on('pageClick', function (pageTitle) {
                if (pageTitle === self.title && self.needsResize) {
                    self.needsResize = false;
                    self.setLayoutCSS();
                    self.updateLayout();
                    tou.forEachArray(tou.dashboardItems, function (item) {
                        item.handleResize();
                    });
                }
            });

            self.bindings.isEditMode.subscribe(function (isEdit) {
                if (isEdit) {
                    self.initPackery();
                } else {
                    self.stopPackery();
                }
            });

            self.loaded = true;
            self.bindings.loaded(true);
            tou.onLoad(function () {
                setTimeout(function () {
                    self.setWithOptions();
                    self.setLayoutCSS();
                    self.initLayout();
                    tou.makeDataRequest();

                    if (tou.getMeters().length > 0) {
                        self.bindings.noMeters(false);
                    }
                    tou.on('meterssaved', function (utilityName) {
                        if (utilityName === self.utilityName) {
                            self.bindings.noMeters(tou.getMeters().length === 0);
                        }
                    });

                    if (tou.availablePeriods[self.utilityName].length > 0) {
                        self.bindings.noPeriods(false);
                    }
                    tou.on('ratetablesaved', function (utilityName) {
                        if (utilityName === self.utilityName) {
                            self.setFiscalYears();
                            self.bindings.noPeriods(tou.availablePeriods[self.utilityName].length === 0);
                        }
                    });

                    self.initPackery(true);
                }, 1);
            });
        }
    }, {
        title: 'Billing',
        isActive: ko.observable(false),
        background: 'woodbackgroundtile.jpg',
        classPrefix: '', // This is set by init() and used throughout
        delayLoad: true,
        defaultTitle: '',
        tempDefaultTitle: '',
        committedBills: {},
        dataRequests: {},
        billData: {
            loadFactor: {
                displayValue: '0%',
                value: 0,
                contributors: {}
            },
            title: '',
            collections: [],
            commit: {
                done: false,
                timestamp: 0,
                user: ''
            }
        },
        yearBillData: {
            title: '',
            commit: {
                done: false,
                timestamp: 0,
                user: ''
            },
            collections: []
        },
        bills: [],
        rawUtility: null,
        activeMeters: [],
        daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        modalTemplates: {
            billingDefaultTitle: {
                title: ''
            },
            billingUncommitBill: {
                commitInfo: ''
            },
            billingCommitBill: {}
        },
        bindings: {
            configRequired: ko.observable(false),
            billData: ko.observable({
                loadFactor: {
                    displayValue: '0%',
                    value: 0,
                    contributors: {}
                },
                title: '',
                collections: [],
                commit: {
                    done: false,
                    timestamp: 0,
                    user: ''
                }
            }),
            yearBillData: ko.observable({
                title: '',
                commit: {
                    done: false,
                    timestamp: 0,
                    user: ''
                },
                collections: [],
            }),
            billsFilter: ko.observable(""),
            selectedBill: ko.observable({
                period: '',
                prettyDate: ''
            }),
            billsAvailable: ko.observable(false),
            billingCycle: ko.observable({
                completedDays: 'Working...',
                totalDays: 0,
                complete: false,
                percentComplete: '0%'
            }),
            gettingData: ko.observable(false),
            isEditMode: ko.observable(false),
            print: function () {
                tou.print($(this.$page.classPrefix + '.' + this.$page.title.toLowerCase() + ' .mainContent'));
            },
            exportPDF: function () {
                tou.exportPDF($(this.$page.classPrefix + '.' + this.$page.title.toLowerCase() + ' .billingContent'));
            },
            toEditMode: function () {
                // Toggle edit mode
                this.isEditMode(true);
            },
            cancelEditMode: function () {
                var self = this,
                    $page = self.$page,
                    billData = $page.billData,
                    defaultTitle = $page.defaultTitle;

                if ($page.tempDefaultTitle !== defaultTitle) {
                    // Restore our temporary default title
                    $page.tempDefaultTitle = defaultTitle;
                    // Restore the old bill title
                    billData.title = $page.processBillTitle(defaultTitle, self.selectedBill());
                    // Update our observable to restore the default bill title
                    self.billData(billData);
                }
                self.isEditMode(false);
            },
            save: function () {
                var self = this,
                    $page = self.$page,
                    $editControls = $(self.$page.classPrefix + '.billingTopBar button.editControl'),
                    $spinner = $editControls.find('i'),
                    timerid;

                // If default bill title has changed
                if ($page.defaultTitle !== $page.tempDefaultTitle) {
                    // Disable save and edit buttons
                    $editControls.attr('disabled', true);
                    // Show spinner in the save button in 100ms
                    timerid = setTimeout(function () {
                        $spinner.show();
                    }, 100);
                    // Call save routine
                    $page.saveBilling($page, {
                        path: [$page.title, 'defaultTitle'].join('.'),
                        remove: false,
                        data: $page.tempDefaultTitle,
                        callback: function (error) {
                            // Clear timer so our function will not fire
                            clearTimeout(timerid);
                            // Hide the spinner
                            $spinner.hide();
                            // Re-enable edit controls
                            $editControls.attr('disabled', false);
                            // Exit edit mdoe if we didn't have an error
                            if (!error) {
                                // Update our default title
                                $page.defaultTitle = $page.tempDefaultTitle;
                                // Exit edit mode
                                self.isEditMode(false);
                            } else {
                                tou.alert(tou.saveErrorText);
                            }
                        }
                    });
                } else {
                    // Nothing to save. Exit edit mode
                    self.isEditMode(false);
                }
            },
            isSystemAdmin: function () {
                return tou.isSystemAdmin();
            },
            selectBill: function (data) {
                this.selectedBill(data);
            },
            commitBill: function () {
                // This routine called from a modal which has bound $page to "this"
                var self = this,
                    now = parseInt(new Date().getTime() / 1000, 10),
                    bill = self.bindings.selectedBill(),
                    billData = (bill.period === 'Month') ? self.billData : self.yearBillData,
                    _billData = $.extend(true, {}, billData), // Get a copy of billData
                    committedBills = self.committedBills,
                    user = tou.workspaceManager.user(),
                    $modalControls = $('.billingCommitBillModal .commitControls button'),
                    $spinner = $modalControls.find('i'),
                    timerid,
                    updateCommit = function (commit) {
                        commit.done = true;
                        commit.timestamp = now;
                        commit.user = [user.firstName, user.lastName].join(' ');
                    };

                // Update our commit object (in the copy of billData)
                updateCommit(_billData.commit);
                // Disable modal cancel/commit controls
                $modalControls.attr('disabled', true);
                // Show the spinner after 100ms
                timerid = setTimeout(function () {
                    $spinner.show();
                }, 100);
                // Submit the new committed bills object to the server
                self.saveBilling(self, {
                    path: [self.title, 'committedBills', bill.fullDate].join('.'),
                    remove: false,
                    data: _billData,
                    callback: function (error) {
                        // Clear timer so our function will not fire
                        clearTimeout(timerid);
                        // Hide the spinner
                        $spinner.hide();
                        // Re-enable modal controls
                        $modalControls.attr('disabled', false);

                        if (!error) {
                            // Update the commit object in billData source object
                            updateCommit(billData.commit);
                            // Update our isCommitted observable on the bill (this causes a checkmark beside the bill in the dropdown)
                            bill.isCommitted(true);
                            // Save our committed bill data
                            committedBills[bill.fullDate] = _billData;
                            // Rebuild the bill so we show the committed flavor
                            self.buildBill(bill);
                            // Hide the modal
                            tou.hideModal();
                        } else {
                            tou.alert('There was a problem committing this bill. Please try again. If the problem persists please reload the page and try again.');
                        }
                    }
                });
            },
            uncommitBill: function () {
                // This routine called from a modal which has bound $page to "this"
                var self = this,
                    bill = self.bindings.selectedBill(),
                    committedBills = self.committedBills,
                    $modalControls = $('.billingUncommitBillModal .uncommitControls button'),
                    $spinner = $modalControls.find('i'),
                    timerid;

                // Disable modal cancel/commit controls
                $modalControls.attr('disabled', true);
                // Show the spinner after 100ms
                timerid = setTimeout(function () {
                    $spinner.show();
                }, 100);
                // Submit the new committed bills object to the server
                self.saveBilling(self, {
                    path: [self.title, 'committedBills', bill.fullDate].join('.'),
                    remove: true,
                    data: null,
                    callback: function (error) {
                        // Clear timer so our function will not fire
                        clearTimeout(timerid);
                        // Hide the spinner
                        $spinner.hide();
                        // Re-enable modal controls
                        $modalControls.attr('disabled', false);

                        if (!error) {
                            // Remove the bill from our committedBills object
                            delete committedBills[bill.fullDate];
                            // Update our isCommitted observable on the bill (this causes a checkmark beside the bill in the dropdown)
                            bill.isCommitted(false);
                            // Rebuild the bill so we show the committed flavor
                            self.buildBill(bill);
                            // Hide the modal
                            tou.hideModal();
                        } else {
                            tou.alert('There was a problem uncommitting this bill. Please try again. If the problem persists please reload the page and try again.');
                        }
                    }
                });
            },
            showCommitModal: function () {
                tou.showModal('billingCommitBill', null, this.$page);
            },
            showUncommitModal: function () {
                tou.showModal('billingUncommitBill', {
                    commitInfo: this.getCommitInfoString(this.billData().commit)
                }, this.$page);
            },
            showDefaultTitleModal: function () {
                if (!this.isEditMode()) {
                    return;
                }
                tou.showModal('billingDefaultTitle', {
                    title: this.$page.tempDefaultTitle
                }, this.$page);
            },
            updateBillTitle: function (data) {
                // This routine called from a modal which has bound $page to "this"
                var self = this,
                    newTitle = data.title(),
                    oldTitle = self.defaultTitle,
                    billData = self.billData;

                if (newTitle !== oldTitle) {
                    // Save the temporary default title (it isn't permanent until the page is saved)
                    self.tempDefaultTitle = newTitle;
                    // Get our title
                    billData.title = self.processBillTitle(newTitle, self.bindings.selectedBill());
                    // Update our observable so the user can see the new bill title
                    self.bindings.billData(billData);
                }
                tou.hideModal();
            },
            getCommitInfoString: function (data) {
                var date = new Date(data.timestamp * 1000),
                    now = new Date(),
                    day = date.getDate(),
                    month = tou.fullMonthList[date.getMonth()],
                    year = date.getFullYear(),
                    dateString = [month, day].join(' ');

                if (year !== now.getFullYear()) {
                    dateString = [dateString, ', ', year].join('');
                }
                dateString += '.';

                return ['This bill was committed by', data.user, 'on', dateString].join(' ');
            }
        },
        computedBindings: {
            filteredBills: function () {
                var self = this,
                    filter = self.billsFilter().toLowerCase(), // Our only dependency
                    bills = self.$page.bills;

                if (filter === "") {
                    return bills;
                } else {
                    return ko.utils.arrayFilter(bills, function (bill) {
                        return bill.searchDate.indexOf(filter) > -1;
                    });
                }
            }
        },
        clearBillData: function () {
            var billData = this.billData;

            billData.collections.length = 0;
            billData.title = '';
            billData.loadFactor = {
                displayValue: '0%',
                value: 0,
                contributors: {}
            };
            billData.commit = {
                done: false,
                timestamp: 0,
                user: ''
            };
        },
        clearYearBillData: function () {
            var yearBillData = this.yearBillData;
            
            yearBillData.title = '';
            yearBillData.commit = {
                done: false,
                timestamp: 0,
                user: ''
            };
            yearBillData.collections.length = 0;
        },
        saveBilling: function (self, opts) {
            var nonData = {
                utilityName: self.utilityName,
                path: opts.path,
                remove: opts.remove
            };
            tou.saveUtility(nonData, opts.data, function (response) {
                tou.log('saveresponse', response);
                if (opts.callback !== undefined) {
                    if (response.message && response.message === 'success') {
                        opts.callback(false); // Callback with error false
                    } else {
                        opts.callback(true); // Callback with error true
                    }
                }
            }, true);
        },
        newCollection: function (collectionName) {
            return {
                name: collectionName,
                columns: {
                    name: {
                        visible: true,
                        title: 'Name'
                    },
                    usage: {
                        visible: false,
                        title: 'TBD'
                    },
                    rate: {
                        visible: false,
                        title: 'Rate ($)'
                    },
                    rateModifier: {
                        visible: false,
                        title: 'Rate + {ratemodifier}% ($)',
                        value: 0
                    },
                    amount: {
                        visible: true,
                        title: 'Amount ($)'
                    }
                },
                rows: []
            };
        },
        newRow: function (rowName) {
            return {
                name: {
                    displayValue: rowName,
                    visible: true
                },
                usage: {
                    value: 0,
                    displayValue: '0',
                    visible: false,
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    contributors: {}
                },
                rate: {
                    value: 0,
                    displayValue: '0',
                    visible: false
                },
                modifiedRate: {
                    value: 0,
                    displayValue: '0',
                    visible: false
                },
                amount: {
                    value: 0,
                    displayValue: '0',
                    visible: true
                }
            };
        },
        processBillTitle: function (title, bill) {
            var titleVariables = {
                    Month: {
                        '{Season}': bill.season,
                        '{Month}': bill.month,
                        '{Year}': bill.year,
                        '{Fiscal Year}': bill.fiscalYear
                    },
                    Year: {
                        '{Season}': '', // We remove {Season}, {Month}, and {Year} placeholders because they don't apply in a fiscal year bill
                        '{Month}': '',
                        '{Year}': '', // This one is null (which one would you choose if the fiscal year spanned two years?)
                        '{Fiscal Year}': bill.fiscalYear
                    }
                },
                variableLookup = titleVariables[bill.period];

            title = title.replace(/{Month}|{Season}|{Year}|{Fiscal Year}/g, function (variable) {
                return variableLookup[variable];
            });
            // Convert double spaces to single spaces (this could happen if we remove {Season} and/or {Month} placeholders)
            // Tried using a year key of '  ' in our titleVariable but JS converts the object key '  ' to a single space ' '
            return title.replace(/  /g, ' ');
        },
        buildActiveMeters: function () {
            var self = this;
            self.activeMeters = tou.getActiveMeterList(tou.currUtility.Meters);
            return self.activeMeters;
        },
        getNumberOfDecimalDigits: function (value) {
            var decimalDigits = value.toString().split('.')[1];

            if (decimalDigits === undefined) {
                return 0;
            } else {
                return decimalDigits.length;
            }
        },
        buildBill: function (bill) {
            if (bill === undefined) {
                return;
            }
            var self = this;

            if (bill.period === 'Month') {
                self.getMonthData(bill, function callback () {
                    // self.billData holds our processed bill result

                    // Stuff the result in our observable
                    self.bindings.billData(self.billData);
                    // Clear the gettingData flag - this will cause the bill to be displayed
                    self.bindings.gettingData(false);
                });
            } else {
                self.getYearData(bill, function callback () {
                    // self.yearBillData holds our processed bill result

                    // Stuff the result in our observable
                    self.bindings.yearBillData(self.yearBillData);
                    // Clear the gettingData flag - this will cause the bill to be displayed
                    self.bindings.gettingData(false);
                });
            }
        },
        getMonthData: function (bill, callback) {
            var self = this,
                rateTable = bill.rateTable,
                fiscalYear = rateTable['Fiscal Year'],
                billDataCollections = self.billData.collections,
                units = {
                    demand: "kW",
                    consumption: "kWh",
                    reactive: "kVAR",
                    reactivepower: "kVAR" // TODO remove this after we transition to 'reactive'
                },
                touidPrefix = tou.makeId(),
                dataRequest = {
                    options: [],
                    handler: self.receiveDataHandler.bind(self)
                },
                timeRange = {
                    start: parseInt(bill.start / 1000, 10),
                    end: parseInt(bill.end / 1000, 10)
                },
                touidTotalConsumption = [touidPrefix, 'both', 'consumption'].join('_'),
                masterRateType = null,
                activeMeters = self.activeMeters || self.buildActiveMeters(),
                processedTiers,
                touid,
                rateCollection,
                period,
                periodRates,
                row,
                collection,
                unitsUsed,
                columns,
                rateColumn,
                rateModifierColumn,
                uniqueTieredConsumptions,
                tier,
                i,
                len,
                findPeriod = function (periods) {
                    var billingDate = new Date(bill.start).setDate(15);
                    for (var i = 0, len = periods.length; i < len; i++) {
                        var _period = periods[i];
                        if ((billingDate > new Date(_period.start.date)) && (billingDate < new Date(_period.end.date))) {
                            return _period;
                        }
                    }
                    return null;
                },
                getRateName = function (rate) {
                    var seasonName = {
                        // key value format is rangeType: season name
                        transition: "Transition",
                        cooling: "Summer",
                        summer: "Summer",
                        heating: "Winter",
                        winter: "Winter"
                    };
                    return rate.name.replace('{Season}', seasonName[period.rangeType]);
                },
                getConditions = function (_string) {
                    return _string.replace(/ /g, '').split('AND');
                },
                getNumber = function (_string) {
                    return _string.match(/[0-9.]+/)[0];
                },
                getOperator = function (_string) {
                    return _string.match(/[<>=]+/)[0];
                },
                sortTiers = function (a, b) {
                    var aConditions = getConditions(a.qualifier),
                        bConditions = getConditions(b.qualifier),
                        a0Conditions = aConditions[0],
                        b0Conditions = bConditions[0],
                        a0,
                        b0,
                        aOperator;
                    a0 = getNumber(a0Conditions);
                    b0 = getNumber(b0Conditions);
                    if (a0 === b0) { // Ex: a0Conditions = '<= 425' & b0Conditions = '> 425'
                        aOperator = getOperator(a0Conditions);
                        return (aOperator === '<' || aOperator === '<=') ? -1:1;
                    } else {
                        return (a0 < b0) ? -1:1;
                    }
                },
                validateTieredCosnumptions = function () {
                    var tierError,
                        qualifier,
                        conditions,
                        isFirstOpLessThan,
                        firstNumber,
                        lastNumber,
                        prevLastNumber,
                        prevConditions,
                        i,
                        len;
                    // Verify each tier
                    for (i = 0, len = uniqueTieredConsumptions.length; i < len; i++) {
                        tier = uniqueTieredConsumptions[i];
                        tierError = tier.tierError;
                        qualifier = tier.qualifier;
                        conditions = getConditions(qualifier);
                        firstNumber = getNumber(conditions[0]);
                        lastNumber = conditions[1] && getNumber(conditions[1]);
                        isFirstOpLessThan = getOperator(conditions[0]).match(/[<=]/g);
                        // Check for tier errors
                        if (i === 0) {
                            // The first qualifier isn't '<'' or '<='' or if there are multiple conditions
                            if (!isFirstOpLessThan || conditions.length > 1) {
                                tierError = true;
                            }
                        } else if (!tierError) {
                            prevConditions = getConditions(uniqueTieredConsumptions[i-1].qualifier);
                            prevLastNumber = getNumber(prevConditions[prevConditions.length - 1]);
                            // The first number from this qualifer should match the last number from the previous qualifier
                            // If it doesn't, this tier and every tier following cannot be calculated
                            if (firstNumber !== prevLastNumber) {
                                tierError = true;
                            }
                        }

                        if (tierError) {
                            for (i; i < len; i++) {
                                uniqueTieredConsumptions[i].tierError = true;
                            }
                        } else {
                            // Get our tier multiplier
                            if (firstNumber && lastNumber) { // i.e. '> x AND <= y'
                                tier.multiplier = lastNumber - firstNumber;
                            } else { // i.e. '<= x', '< x', '> x', or '>= x'
                                if (isFirstOpLessThan) {
                                    tier.multiplier = +firstNumber;
                                } else {
                                    tier.multiplier = null;
                                }
                            }
                        }
                    }
                },
                createConsumptionAndDemandRequest = function (demandPeak) {
                    // Add off-peak consumption request
                    createDataRequest({
                        touid: touidTotalConsumption,
                        rateType: 'consumption',
                        peak: 'both',
                        rate: {
                            qualifier: ''
                        }
                    });
                    // Add max demand request
                    createDataRequest({
                        touid: [touidPrefix, demandPeak, 'demand'].join('_'),
                        rateType: 'demand',
                        peak: demandPeak
                    });
                },
                createDataRequest = function (data) {
                    var _touid = data.touid,
                        _peak = data.peak,
                        _rateType = data.rateType,
                        requestOptions = { // Get our common request options
                            rateCollectionName: rateCollectionKey,
                            fiscalYear: fiscalYear,
                            touid: _touid,
                            scale: 'month',
                            peak: _peak,
                            range: timeRange
                        },
                        createRequest = true;
                    // The other request options depend on what our rateType is
                    if (_rateType === 'demand') {
                        requestOptions.fx = 'max';
                        requestOptions.upis = activeMeters.demand;
                    } else if (_rateType === 'consumption') {
                        requestOptions.fx = 'sum';
                        requestOptions.upis = activeMeters.consumption;
                        // If a rate qualifier is defined (it's just a string. Examples: "<= 425", "> 425 AND <= 620", "> 620")
                        if (data.rate.qualifier.length) {
                            // This means we have a tiered consumption charge. It's actually a calculation based on the following
                            // data: off-peak consumption, total consumption, and maximum demand (on or off-peak). Add requests
                            // for the total consumption and maximum demand.
                            // Set the masterRateType so we know that the data received actually belongs to this rate element
                            masterRateType = _rateType;
                            createConsumptionAndDemandRequest((data.rate.qualifierDemand === 'Peak Demand') ? 'on' : 'both');
                            // Clear the masterRateType
                            masterRateType = null;
                        }
                    } else if (_rateType === 'reactive') {
                        requestOptions.fx = 'reactiveCharge';
                        requestOptions.upis = activeMeters.demand;
                        requestOptions.secondUpis = activeMeters.reactive;
                    } else if (_rateType === 'loadFactor') {
                        // Load factor is actually a calculation based on the following data: total consumption and maximum demand (on or off-peak)
                        // Set the masterRateType so we know that the data received actually belongs to the load factor element
                        masterRateType = _rateType;
                        createConsumptionAndDemandRequest('both');
                        // Clear the masterRateType
                        masterRateType = null;
                    } else {
                        return;
                    }
                    // Check for a touid before creating a request. Ex: 'loadFactor' doesn't have a request (it generates other requests)
                    if (_touid) {
                        // If we don't already have a request for the data needed by this line item
                        if (self.dataRequests.hasOwnProperty(_touid) === false) {
                            // Create a local data request entry
                            self.dataRequests[_touid] = [];
                            // Add the data request
                            // Add utility name to requestOptions
                            requestOptions.utilityName = self.utilityName;
                            dataRequest.options.push(requestOptions);
                        }
                        // Add the request to our local copy of requests
                        self.dataRequests[_touid].push({
                            masterRateType: masterRateType,
                            rateType: _rateType,
                            billingCollection: collection,
                            billingRow: row,
                            requestOptions: requestOptions
                        });
                    }
                },
                processRate = function (rate) { // This function adds a billing line item for the rate element
                    // Make sure this rate element is applicable to this bill
                    // We do NOT normally show on-peak rate elements in transition periods - this is checked by rangeType and showInTransition
                    // We DO show on-peak rate elements in transition periods if enablePeakSelection is true
                    if ((period.rangeType === 'transition') && !!!rate.showInTransition && !!!period.enablePeakSelection) {
                        return;
                    }

                    var rateValue = periodRates[rate.name],
                        rateType = rate.type,
                        peak = rate.peak,
                        qualifier = rate.qualifier,
                        addRow = true,
                        unit,
                        numberOfDecimalDigits;
                    // Make sure the rate value is a valid number (isNaN returns false for null and empty strings)
                    if (isNaN(rateValue) || (rateValue === null) || (typeof rateValue === 'string')) {
                        rateValue = 0;
                    }

                    // Create a new line item row
                    row = self.newRow(getRateName(rate));
                    // Add a tempData object to our row - this will be removed by applyPostProcessing after we receive data from the server
                    row.tempData = {
                        rate: rate
                    };
                    // Save the original rate element with our row data
                    row.rateElement = $.extend({}, rate);

                    if (rateType === 'ratemodifier') { // This element only affects the columns
                        rateModifierColumn.visible = true;
                        rateModifierColumn.title = rateModifierColumn.title.replace('{ratemodifier}', rateValue);
                        rateModifierColumn.value = rateValue;
                        addRow = false;
                    } else if (rateType === 'flatrate') {
                        row.usage.value = rateValue;
                        row.rate.value = 1;
                    } else { // Must be consumption, demand, or reactive types
                        if (rateType === 'consumption') {
                            // Qualifier is only valid in off-peak periods (user can change peak but qualifier is still present)
                            if (qualifier.length && peak === 'off') {
                                if (processedTiers.hasOwnProperty(qualifier) === false) {
                                    tier = {
                                        rows: [row],
                                        qualifier: qualifier,
                                        tierError: false,
                                        qualifierDemand: rate.qualifierDemand
                                    };
                                    processedTiers[qualifier] = tier;
                                    // Add to our uniqueTieredConsumptions array
                                    uniqueTieredConsumptions.push(tier);
                                } else {
                                    tier = processedTiers[qualifier];
                                    tier.rows.push(row);
                                    if (tier.qualifierDemand !== rate.qualifierDemand) {
                                        tier.tierError = true;
                                    }
                                }
                            }
                            if (peak === 'off') {
                                // Reference to this row needed when we process the bill
                                collection.tempData.offPeakConsumptionRow = row;
                            } else if (peak === 'on') {
                                // Reference to this row needed when we process the bill
                                collection.tempData.onPeakConsumptionRow = row;
                            }
                        } else if (rateType === 'demand') {
                            if (peak === 'on') {
                                // Save reference to the on peak demand row (if this collection also has an off-peak demand,
                                // the off-peak demand is recalculated as the difference between the on and off peak, so when
                                // we're adjusting the off-peak, we need to know where to find the on-peak row - this
                                // is done in applyPostProcessing)
                                collection.tempData.onPeakDemandRow = row;
                            }
                        } else if (rateType === 'reactive') {
                            peak = 'both'; // For reactive rate elements, peak is not selectable and defaults to 'on' which is incorrect
                            // Also update the rate element stored on our row
                            row.rateElement.peak = 'both';
                        }
                        // Get this rate element's units
                        unit = units[rateType];
                        // Units on the row won't be visible unless we have multiple unit types
                        row.usage.units.displayValue = unit;
                        // Note the unit used
                        unitsUsed[unit] = true;

                        // Store our rate value
                        row.rate.visible = true;
                        row.rate.value = rateValue;

                        numberOfDecimalDigits = self.getNumberOfDecimalDigits(rateValue);
                        if (numberOfDecimalDigits > collection.tempData.maxRateDigits) {
                            collection.tempData.maxRateDigits = numberOfDecimalDigits;
                        }
                        rateColumn.visible = true; // This may get set mutliple times but who cares

                        // We'll make a server call to get the usage value
                        row.usage.visible = true;

                        createDataRequest({
                            touid: [touidPrefix, peak, rateType].join('_'),
                            rate: rate,
                            peak: peak,
                            rateType: rateType
                        });
                    }

                    if (addRow === true) {
                        collection.rows.push(row);
                    }
                };

            // Clear all of our server request references
            self.dataRequests = {
                // This callback will be called after all of our data requests have been sent, received, and processed
                callback: callback
            };

            // Clear our current bill data
            self.clearBillData();

            // If this bill has been committed
            if (self.committedBills.hasOwnProperty(bill.fullDate)) {
                //  We don't have to build it, we just need to push the committed data into our billData object
                self.bindings.billData(self.committedBills[bill.fullDate]);
                return;
            }

            // Get bill title
            self.billData.title = self.processBillTitle(self.defaultTitle, bill);

            // Build our bill collections
            for (var rateCollectionKey in rateTable) {
                rateCollection = rateTable[rateCollectionKey];
                if (rateCollection.hasOwnProperty('periods') === false) {
                    continue;
                }
                period = findPeriod(rateCollection.periods);
                if (!period || !Object.keys(period.rates).length) {
                    continue;
                }

                // Init our variables
                periodRates = period.rates;
                collection = self.newCollection(rateCollectionKey);
                columns = collection.columns;
                rateColumn = columns.rate;
                rateModifierColumn = columns.rateModifier;

                // Add a tempData object to our collection - this will be removed by applyPostProcessing after we receive data from the server
                collection.tempData = {
                    unitsUsed: {},
                    uniqueTieredConsumptions: [],
                    maxRateDigits: 0,
                    maxModifiedRateDigits: 0
                };
                unitsUsed = collection.tempData.unitsUsed;
                uniqueTieredConsumptions = collection.tempData.uniqueTieredConsumptions;
                processedTiers = {};
                // Add a billing line item for each rate element in the rate table collection
                rateCollection.rates.forEach(processRate);

                // Sort the uniqueTieredConsumptions
                uniqueTieredConsumptions.sort(sortTiers);
                validateTieredCosnumptions();
                // Add the collection to our billing collections
                if (collection.rows.length > 0) {
                    billDataCollections[rateCollection.order] = (function () { // rateCollection.order is 0-based
                        return collection;
                    })();
                }
            }

            // Remove undefined entries
            for (i = 0, len = billDataCollections.length; i < len; i++) {
                collection = billDataCollections[i];
                if (collection === undefined) {
                    // We could have an undefined entry in our 'collections' array because the rate table's
                    // 'Off Peak Days' collection occupies an order. Remove undefined array entry if present
                    // We cannot use the array's forEach prototype to search for undefined's (it skips over them)
                    billDataCollections.splice(i, 1);
                    len -= 1;
                    i -= 1;
                }
            }

            // Add a request for the load factor data
            createDataRequest({
                touid: null,
                rateType: 'loadFactor'
            });
            // Add the period hours to the load factor contributors - we must calculate and store
            // on the loadFactor contributors instead of pulling from our billingCycle observerable 
            // for yearly billing purposes (billingCycle for yearly bill != month)
            self.billData.loadFactor.contributors.hours = (function () {
                var selectedDate = new Date(bill.start),
                    selectedMonth = selectedDate.getMonth(),
                    selectedYear = selectedDate.getFullYear(),
                    days;
                
                // Get total days in the billing cycle
                days = self.daysInMonth[selectedMonth];
                // Adjust total days if billing cycle is February and it's a leap year
                if ((selectedMonth === 1) && ((selectedYear % 4) === 0)) {
                    days++;
                }
                return (days * 24);
            })();

            if (billDataCollections.length > 0) {
                // Launch the miss-aisles
                self.bindings.gettingData(true);
                tou.addDataRequest(dataRequest);
                tou.makeDataRequest();
            } else {
                // Make sure our observable has the cleared bill data (otherwise the user would still see old bill data on the screen)
                self.bindings.billData(self.billData);
            }
        },
        getYearData: function (bill, callback) {
            var self = this,
                fiscalYear = bill.fiscalYear,
                fiscalYearBills = self.bills.filter(function (_bill) {
                    return (_bill.fiscalYear === fiscalYear) && (_bill.period === 'Month');
                }),
                billsToRequest = [],
                yearBillData = self.yearBillData,
                done = function () { // This function called after all data for the year has been received
                    // Sort our source data from earliest to latest
                    yearBillData.source.sort(function (a, b) {
                        return a.start > b.start ? 1:-1;
                    });
                    self.postProcessYearData();
                    callback();
                },
                addToSource = function (_bill, billData) {
                    yearBillData.source.push({
                        month: _bill.month,
                        start: _bill.start,
                        season: _bill.season,
                        data: billData
                    });
                },
                getMonthlyBill = function (_bill) {
                    self.getMonthData(_bill, getMonthlyBillCallback);
                },
                getMonthlyBillCallback = function () {
                    // self.billData holds our processed bill result
                    addToSource(billsToRequest[0], $.extend(true, {}, self.billData));

                    // Remove the first array element
                    billsToRequest.shift();
                    // If more monthly data to get
                    if (billsToRequest.length) {
                        getMonthlyBill(billsToRequest[0]);
                    } else {
                        done();
                    }
                };

            self.clearYearBillData();

            // If this bill has been committed
            if (self.committedBills.hasOwnProperty(bill.fullDate)) {
                //  We don't have to build it, we just need to push the committed data into our billData object
                self.bindings.yearBillData(self.committedBills[bill.fullDate]);
                return;
            }

            yearBillData.source = []; // Add a source array - this will be deleted after we're done processing

            yearBillData.title = self.processBillTitle(self.defaultTitle, bill);
            
            Array.prototype.push.apply(yearBillData.collections, [{
                name: {
                    displayValue: 'Demand',
                    id: 'demand'
                },
                columns: [{
                    name: {
                        title:'Name',
                        visible: true
                    }
                }],
                rows: [{
                    name: {
                        id: 'onPeak',
                        displayValue: 'On Peak Demand',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: []
                }, {
                    name: {
                        id: 'offPeak',
                        displayValue: 'Off Peak Demand',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: []
                }, {
                    name: {
                        id: 'reactiveAtPeak',
                        displayValue: 'Reactive Power at Peak Demand',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: []
                }]
            }, {
                name: {
                    displayValue: 'Consumption',
                    id: 'consumption'
                },
                columns: [{
                    name: {
                        title:'Name',
                        visible: true
                    }
                }],
                rows: [{
                    name: {
                        id: 'total',
                        displayValue: 'Total Consumption',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: []
                }, {
                    name: {
                        id: 'onPeak',
                        displayValue: 'On Peak Consumption',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: [],
                }, {
                    name: {
                        id: 'offPeak',
                        displayValue: 'Off Peak Consumption',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: []
                }]
            }, {
                name: {
                    displayValue: 'Load Factor',
                    id: 'loadFactor'
                },
                columns: [{
                    name: {
                        title:'Name',
                        visible: true
                    }
                }],
                rows: [{
                    name: {
                        id: 'loadFactor',
                        displayValue: 'Load Factor',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: []
                }]
            }, {
                name: {
                    displayValue: 'Charges',
                    id: 'charges'
                },
                columns: [{
                    name: {
                        title:'Name',
                        visible: true
                    }
                }],
                rows: []
            }, {
                name: {
                    displayValue: 'NET Cost',
                    id: 'netCost'
                },
                columns: [{
                    name: {
                        title:'Name',
                        visible: true
                    }
                }],
                rows: [{
                    name: {
                        id: 'kwh',
                        displayValue: 'NET Cost Per kWh',
                        visible: true
                    },
                    units: {
                        displayValue: '',
                        visible: false
                    },
                    data: []
                }]
            }]);

            fiscalYearBills.forEach(function (_bill) {
                if (_bill.isCommitted()) {
                    addToSource(_bill, self.committedBills[_bill.fullDate]);
                } else {
                    billsToRequest.push(_bill);
                }
            });

            if (billsToRequest.length) {
                getMonthlyBill(billsToRequest[0]);
            } else {
                done();
            }
        },
        postProcessYearData: function () {
            var self = this,
                yearData = self.yearBillData,
                source = yearData.source,
                collections = yearData.collections,
                addedLineItems = {},
                chargesLineItems = [],
                monthShortLookup = {
                    January: 'Jan',
                    February: 'Feb',
                    March: 'Mar',
                    April: 'Apr',
                    May: 'May',
                    June: 'Jun',
                    July: 'Jul',
                    August: 'Aug',
                    September: 'Sep',
                    October: 'Oct',
                    November: 'Nov',
                    December: 'Dec'
                },
                buildChargesCollection = function () {
                    var chargesCollection = getCollection(collections, 'charges'),
                        chargesRows = chargesCollection.rows,
                        chargeTotals = [];

                    yearData.source.forEach(function (source, index) {
                        var sourceCollection = getCollection(source.data.collections, 'Total Charges'),
                            sourceRows = (sourceCollection && sourceCollection.rows) || [],
                            total = 0;

                        chargesLineItems.forEach(function (lineItem) {
                            var sourceRow = getRow(sourceRows, lineItem, 'displayValue'),
                                chargeRow = getRow(chargesRows, lineItem, 'displayValue'),
                                data = {
                                    value: (sourceRow && sourceRow.amount.value) || 0,
                                    displayValue: (sourceRow && sourceRow.amount.displayValue) || '-'
                                },
                                j;

                            if (!chargeRow) {
                                chargesRows.push({
                                    name: {
                                        displayValue: lineItem,
                                        visible: true
                                    },
                                    data: []
                                });
                                
                                chargeRow = chargesRows[chargesRows.length - 1];
                                for (j = 0; j < index; j++) {
                                    chargeRow.data.push({
                                        value: 0,
                                        displayValue: '-',
                                        isTotal: true
                                    });
                                }
                            }
                            chargeRow.data.push(data);
                            total += data.value;
                        });
                        
                        total = tou.toFixed(total, 2);
                        chargeTotals.push({
                            value: total,
                            displayValue: self.prettyValue({
                                value: total,
                                minDigits: 2
                            }),
                            isTotal: true
                        });
                    });
                    
                    chargesRows.push({
                        name: {
                            displayValue: 'Total',
                            visible: true
                        },
                        data: chargeTotals,
                        isTotalRow: true
                    });
                },
                buildNetCosts = function () {
                    var netCostData = getRow(getCollection(collections, 'netCost').rows, 'kwh').data, // empty array
                        chargeTotals = getRow(getCollection(collections, 'charges').rows, 'Total', 'displayValue').data, // array
                        totalKwhData = getRow(getCollection(collections, 'consumption').rows, 'total').data; // array

                    chargeTotals.forEach(function (total, index) {
                        var value = total.value / totalKwhData[index].value,
                            data;
                        if (value === Infinity) {
                            value = 0;
                        }

                        data = {
                            value: value,
                            displayValue: self.prettyValue({
                                value: value,
                                digits: 4,
                                minDigits: 4
                            })
                        };

                        netCostData.push(data);
                    });
                },
                getMaxAvgAndTotals = function () {
                    var lookupTable = {
                            'demand': {
                                calc: 'Average',
                                digits: 0,
                                prepend: '',
                                append: ''
                            },
                            'consumption': {
                                calc: 'Total',
                                digits: 0,
                                prepend: '',
                                append: ''
                            },
                            'loadFactor': {
                                calc: 'Average',
                                digits: 1,
                                prepend: '',
                                append: '%'
                            },
                            'charges': {
                                calc: 'Total',
                                digits: 2,
                                minDigits: 2,
                                prepend: '$',
                                append: ''
                            },
                            'netCost': {
                                calc: 'Average',
                                digits: 4,
                                minDigits: 4,
                                prepend: '$',
                                append: ''
                            }
                        };

                    yearData.collections.forEach(function (collection) {
                        var lookup = lookupTable[collection.name.id];

                        // Add column for calculation output
                        collection.columns.push({
                            name: {
                                title: lookup.calc,
                                visible: true
                            }
                        });

                        collection.rows.forEach(function (row) {
                            var max = {
                                    value: 0,
                                    index: null
                                },
                                sum = 0,
                                cnt = 0,
                                data = {},
                                unitsUsed = {},
                                unitValue;

                            row.data.forEach(function (item, index) {
                                // Get maximum
                                if (item.value > max.value) {
                                    max.value = item.value;
                                    max.index = index;
                                }
                                // Get sum - assuming same units for all data - we'll need to evaluate this when we add support
                                // for meters with different units
                                sum += item.value;
                                cnt++;
                                
                                // Evaluate units
                                unitValue = item.units && item.units.displayValue;
                                if (unitValue && unitValue.length && !unitsUsed[unitValue]) {
                                    unitsUsed[item.units.displayValue] = true;
                                }
                            });
                            // Update the isMax key on the maximum entry
                            if (max.index !== null) {
                                row.data[max.index].isMax = true;
                            }

                            // Add the average/total result to our data set
                            if (lookup.calc === 'Total') {
                                data.value = sum;
                                data.isTotal = true;
                            } else { // Average
                                data.value = sum / cnt;
                            }
                            data.displayValue = self.prettyValue({
                                value: data.value,
                                digits: lookup.digits,
                                minDigits: lookup.minDigits,
                                prepend: lookup.prepend,
                                append: lookup.append
                            });
                            row.data.push(data);

                            // Add units to our demand and consumption rows
                            if (collection.name.id === 'demand' || collection.name.id === 'consumption') {
                                // Convert to array
                                unitsUsed = Object.keys(unitsUsed);
                                // If only one unit type used
                                if (unitsUsed.length === 1) {
                                    // Set the units visible once for the entire row
                                    row.units.displayValue = unitsUsed[0];
                                    row.units.visible = true;
                                } else {
                                    // Set the units visible for each entry
                                    row.data.forEach(function (item) {
                                        if (item.units && item.units.displayValue.length) {
                                            item.units.visible = true;
                                        }
                                    });
                                }
                            }
                        });
                    });
                },
                getRowOrCollection = function (data, name, key) {
                    var _name;

                    for (var i = 0, len = data.length; i < len; i++) {
                        _name = data[i].name;

                        if (typeof _name === 'object') {
                            _name = _name[key || 'id'];
                        }

                        if (_name === name) {
                            return data[i];
                        }
                    }
                },
                getCollection = function (collections, name, key) {
                    return getRowOrCollection(collections, name, key);
                },
                getRow = function (rows, name, key) {
                    return getRowOrCollection(rows, name, key);
                },
                getUsage = function (data, type, peak) {
                    var collections = data.collections,
                        collection,
                        row,
                        usage,
                        returnData;
                    for (var i = 0, len = collections.length; i < len; i++) {
                        collection = collections[i];
                        for (var j = 0, jlen = collection.rows.length; j < jlen; j++) {
                            row = collection.rows[j];
                            if (row.rateElement && (row.rateElement.type === type) && (row.rateElement.peak === peak)) {
                                usage = row.usage;

                                if (type === 'reactive') {
                                    usage = usage.contributors.reactiveMax;
                                } else if (type === 'demand') {
                                    usage = usage.contributors.demand;
                                } else { // consumption
                                    usage = usage.contributors.consumption;
                                }

                                usage = tou.toFixed(usage, 0);
                                returnData = {
                                    value: usage,
                                    displayValue: self.prettyValue({value: usage, digits: 0})
                                };

                                returnData.units = {
                                    displayValue: row.usage.units.displayValue,
                                    visible: false
                                };
                                returnData.rateElement = row.rateElement;

                                return returnData;
                            }
                        }
                    }
                    return {
                        value: 0,
                        displayValue: '0',
                        units: {
                            displayValue: '',
                            visible: false
                        }
                    };
                },
                getLoadFactor = function (data) {
                    var loadFactor = data.loadFactor;
                    return {
                        value: loadFactor.value,
                        displayValue: loadFactor.displayValue
                    };
                },
                process = {
                    'demand': function (collection, sourceData, index) {
                        getRow(collection.rows, 'onPeak').data.push(getUsage(sourceData, 'demand', 'on'));
                        getRow(collection.rows, 'offPeak').data.push(getUsage(sourceData, 'demand', 'off'));
                        getRow(collection.rows, 'reactiveAtPeak').data.push(getUsage(sourceData, 'reactive', 'both'));
                    },
                    'consumption': function (collection, sourceData, index) {
                        var data;
                        
                        // We handle our total consumption a bit differently because we need to add the 'isTotal' key to our data set
                        data = getUsage(sourceData, 'consumption', 'both');
                        data.isTotal = true;
                        getRow(collection.rows, 'total').data.push(data);
                        
                        getRow(collection.rows, 'onPeak').data.push(getUsage(sourceData, 'consumption', 'on'));
                        getRow(collection.rows, 'offPeak').data.push(getUsage(sourceData, 'consumption', 'off'));
                    },
                    'loadFactor': function (collection, sourceData, index) {
                        getRow(collection.rows, 'loadFactor').data.push(getLoadFactor(sourceData));
                    },
                    'charges': function (collection, sourceData, index) {
                        var billTotalChargesCollection = getCollection(sourceData.collections, 'Total Charges'),
                            rows = (billTotalChargesCollection && billTotalChargesCollection.rows) || [];
                        rows.forEach(function (row) {
                            var lineItem = row.name.displayValue;
                            if ((lineItem !== 'Total') && !addedLineItems[lineItem]) {
                                addedLineItems[lineItem] = true;
                                chargesLineItems.push(lineItem);
                            }
                        });
                    },
                    'netCost': function (collection, sourceData, index) {
                        // nothing to do with this collection yet
                    }
                };

            yearData.source.forEach(function (source, index) {
                yearData.collections.forEach(function (collection) {
                    collection.columns.push({
                        name: {
                            title: monthShortLookup[source.month],
                            visible: true,
                        },
                        season: source.season,
                        start: source.start
                    });
                    process[collection.name.id](collection, source.data, index);
                });
            });

            // Build the charges collection
            buildChargesCollection();
            // Build the net cost pwer kwh collection
            buildNetCosts();
            // Identify the maximums in each row & add total/average column
            getMaxAvgAndTotals();
            // 

            delete yearData.source;
        },
        prettyValue: function (data) {
            // data is expected to take the following form
            // {
            //     value: #         (required)
            //     prepend: ''  (optional)
            //     append: ''   (optional)
            //     digits: #        (optional - defualts to 2)
            //     minDigits: #  (optional - 0 fills digits to attain this many digits)
            // }
            var digits = data.hasOwnProperty('digits') ? (data.digits || 0) : 2,
                value = tou.toFixed(data.value, digits).toString().split('.'),
                integerValue = value[0],
                decimalValue = value[1],
                prependChar = data.prepend,
                appendChar = data.append;

            if (data.minDigits) {
                decimalValue = decimalValue || '';
                i = decimalValue.length;
                len = data.minDigits;
                while (i++ < len) {
                    decimalValue += "0";
                }
            }
            if (decimalValue !== undefined) {
                decimalValue = ['.', decimalValue].join('');
            }
            if (prependChar === undefined) {
                prependChar = '';
            }
            if (appendChar === undefined) {
                appendChar = '';
            }
            integerValue = integerValue.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'); // Add commas to our integer string
            return [prependChar, integerValue, decimalValue, appendChar].join('');
        },
        applyPostProcessing: function () {
            var self = this,
                collections = self.billData.collections,
                totalCharges = self.newCollection('Total Charges'),
                allCollectionTotal = 0,
                createTotalChargesCollection = collections.length > 1 ? true : false, // No need for this total of totals collection if we only have one collection
                totalChargesTotalRow,
                getRate = function (row) {
                    if (row.modifiedRate.visible) {
                        return row.modifiedRate.value;
                    } else {
                        return row.rate.value;
                    }
                },
                calculateAndSaveLoadFactor = function () {
                    // var periodDays = self.bindings.billingCycle().totalDays,
                    //     periodHours = periodDays * 24,
                    //     loadFactor = self.billData.loadFactor,
                    var loadFactor = self.billData.loadFactor,
                        contributors = loadFactor.contributors,
                        value;
                    // Standard load factor equation - || 0 is to replace NaN if the denominator resolves to 0
                    value = (contributors.totalConsumption / (contributors.hours * contributors.maxDemand)) || 0;
                    // Convert to %
                    value *= 100;
                    // Store the result in billData
                    loadFactor.value = value;
                    loadFactor.displayValue = self.prettyValue({
                        value: value,
                        digits: 1,
                        append: '%'
                    });
                };

            collections.forEach(function (collection) {
                var collectionTotal = 0,
                    totalRow = self.newRow('Total'),
                    collectionTemp = collection.tempData,
                    usageColumn = collection.columns.usage,
                    unitsUsed = Object.keys(collectionTemp.unitsUsed),
                    numberUnitsUsed = unitsUsed.length,
                    showUnitsOnRow = numberUnitsUsed > 1,
                    onPeakDemandRow = collectionTemp.onPeakDemandRow,
                    tiers = collectionTemp.uniqueTieredConsumptions,
                    onPeakConsumptionRow = collectionTemp.onPeakConsumptionRow,
                    offPeakConsumptionRow = collectionTemp.offPeakConsumptionRow,
                    offPeakLessTiers = offPeakConsumptionRow && offPeakConsumptionRow.usage.value,
                    processedRows = {},
                    totalUsage = 0,
                    tierTotalUsage = 0,
                    demand,
                    diff,
                    value,
                    digits,
                    tier,
                    row,
                    rowid,
                    rows,
                    rate,
                    i,
                    iLen,
                    j,
                    jLen,
                    usage,
                    amount,
                    tempData,
                    totalChargeRow,
                    reactiveMax,
                    lessDemandMax;

                // Set this collection's units column's visibility and title
                if (numberUnitsUsed > 0) {
                    usageColumn.visible = true;
                    if (numberUnitsUsed > 1) {
                        usageColumn.title = "Usage";
                    } else {
                        usageColumn.title = unitsUsed[0];
                    }
                }

                // Calculate tiered consumption charges
                for (i = 0, iLen = tiers.length; i < iLen; i++) {
                    tier = tiers[i];
                    rows = tier.rows;
                    row = rows[0];
                    contributors = row.usage.contributors;
                    if (tier.tierError) {
                        usage = 0;
                        value = 'Error';
                    } else if (tier.multiplier !== null) {
                        // Our formula is: (off-peak consumption / total consumption) * demand * multiplier, where demand is the peak demand (highest
                        // demand during on peak periods) or max demand (highest demand regardless of on peak or off peak)

                        // We use || 0 to recover from undefined; for example, we saw this in testing: if maxDemand was 0 and peakDemand
                        // was undefined, this would resolve to undefined if we didn't include the trailing '|| 0'
                        demand = (contributors.maxDemand || contributors.peakDemand) || 0;

                        // The '|| 0' part here is to recover from divide by 0 which generates NaN
                        usage = tou.toFixed(((row.usage.value / contributors.totalConsumption) || 0) * demand * tier.multiplier, 0);
                        usage = Math.min(usage, offPeakLessTiers);

                        offPeakLessTiers -= usage;
                        tierTotalUsage += usage;

                        // If we decremented more than is available
                        if (offPeakLessTiers < 0) {
                            // We subtracted too much; remove the extra from our tierTotalUsage
                            tierTotalUsage += offPeakLessTiers;
                            // Clamp @ 0 in case we have more tiers to process
                            offPeakLessTiers = 0;
                        }
                    } else { // tier multiplier is null signifying this tier gets all of the remaining off peak usage
                        usage = offPeakLessTiers;
                        tierTotalUsage += usage;
                    }

                    // If this is the last tier in our list
                    if ((i === (iLen - 1)) && !tier.tierError) {
                        // We were seeing the addition of the individual consumption parts sometimes +1 or -1 from the total consumption
                        // received by the server due to rounding error. Here's an example with actual numbers seen:
                        //
                        //              Raw from server | Rounded Calculation
                        //            |=======================================
                        //  Off-peak  |   9414226.524   |   9414227
                        //  On-peak   |   2528626.777   |   2528627
                        //  Total     |   11942853.302  !=  11942854
                        //
                        // So what we're going to do is check and see if our tier total is off by 1 and adjust the last tier accordingly
                        if (onPeakConsumptionRow) {
                            diff = tou.toFixed(contributors.totalConsumption, 0) - onPeakConsumptionRow.usage.value - tierTotalUsage;
                            if (Math.abs(diff) === 1) {
                                usage += diff;
                            }
                        }
                    }

                    // Save the calculated values to all rows associated with this tier
                    for (j = 0, jLen = rows.length; j < jLen; j++) {
                        row = rows[j];
                        // Save the tier multiplier just in case there's ever a question about the calculation
                        row.usage.contributors.tierMultiplier = tier.multiplier;
                        // Save the calculated values
                        row.usage.value = usage;
                        // If there is an error in the tiered setup
                        if (value === 'Error') {
                            // Tell the user there is a problem with this tier
                            row.usage.displayValue = 'Error';
                            // Set the do not get value flag since we've already assigned it
                            row.tempData.doNotGetDisplayValue = true;
                        }
                    }
                }

                // Process each row in the collection
                rows = collection.rows;
                for (i = 0, iLen = rows.length; i < iLen; i++) {
                    row = rows[i];
                    tempData = row.tempData;
                    rate = tempData.rate;
                    rowid = [rate.type, rate.peak, rate.qualifier].join('_');

                    // If this is an off peak demand row and we also have an on peak demand row in this collection
                    if ((rate.type === 'demand') && (rate.peak === 'off') && (onPeakDemandRow !== undefined)) {
                        // The off peak usage is actually just the amount ABOVE the on-peak, i.e. the difference
                        usage = row.usage.value - onPeakDemandRow.usage.value;
                        // Save usage; clamp @ 0 if negative
                        row.usage.value = usage < 0 ? 0 : usage;
                    }

                    // If flat rate charge
                    if (rate.type === 'flatrate') {
                        digits = 14; // Set it out way beyond what we will actually have
                    } else {
                        digits = 0;
                    }

                    if (!row.tempData.doNotGetDisplayValue) {
                        // If usage value is negative
                        if (row.usage.value < 0) {
                            // Negative numbers are displayed as (x), i.e. -513.44 --> (513.44)
                            row.usage.displayValue = self.prettyValue({
                                value: Math.abs(row.usage.value),
                                digits: 0,
                                prepend: '(',
                                append: ')'
                            });
                        } else {
                            row.usage.displayValue = self.prettyValue({
                                value: row.usage.value,
                                digits: digits
                            });
                        }
                    }

                    row.rate.displayValue = self.prettyValue({
                        value: row.rate.value,
                        minDigits: collection.tempData.maxRateDigits,
                        digits: collection.tempData.maxRateDigits
                    });
                    row.modifiedRate.displayValue = self.prettyValue({
                        value: row.modifiedRate.value,
                        minDigits: collection.tempData.maxModifiedRateDigits,
                        digits: collection.tempData.maxModifiedRateDigits
                    });

                    amount = getRate(row) * row.usage.value;
                    amount = tou.toFixed(amount, 2);

                    // If amount is negative
                    if (amount < 0) {
                        // Clamp charge @ 0
                        amount = 0;
                        // Displayed amount is a hyphen for would-be negative charges
                        row.amount.displayValue = '-';
                    } else {
                        // Store the pretty amount for display purposes
                        row.amount.displayValue = self.prettyValue({
                            value: amount,
                            minDigits: 2
                        });
                    }
                    // Store the raw amount
                    row.amount.value = amount;

                    // Add this row's amount to the collection total
                    collectionTotal += amount;
                    // If this row's usage is visible
                    if (row.usage.visible) {
                        // If we need to show the units on this row
                        if (showUnitsOnRow) {
                            // Set the visible flag
                            row.usage.units.visible = true;
                        }
                        // Otherwise all the rows in this collection have the same unit type; if we haven't processed a row with data like this one
                        else if (processedRows.hasOwnProperty(rowid) === false) {
                            // Add to our processed rows collection
                            processedRows[rowid] = true;
                            // Add to our total raw and rounded usages
                            totalUsage += row.usage.value;
                        }
                    }

                    if (rate.type === 'reactive') {
                        // Add the 'reactive @ peak demand' row
                        reactiveMax = self.newRow('Lagging Reactive Power at Peak Demand');
                        reactiveMax.amount.visible = false;
                        value = row.tempData.reactiveMax || 0; // The || 0 is in case there was an error and the reactiveMax key wasn't added
                        reactiveMax.usage.value = value;
                        reactiveMax.usage.displayValue = self.prettyValue({
                            value: value,
                            digits: 0
                        });
                        reactiveMax.usage.visible = true;
                        reactiveMax.usage.units.displayValue = 'kVAR';
                        if (showUnitsOnRow) {
                            reactiveMax.usage.units.visible = true;
                        }
                        // Insert our new row into our collection rows
                        rows.splice(i, 0, reactiveMax);

                        // Add the 'less % of max demand' row
                        lessDemandMax = self.newRow(['Less ', row.tempData.rate.threshold, '% of Maximum Demand'].join(''));
                        lessDemandMax.amount.visible = false;
                        value = row.tempData.lessDemandMax || 0; // The || 0 is in case there was an error and the lessDemandMax key wasn't added
                        lessDemandMax.usage.value = value;
                        lessDemandMax.usage.displayValue = self.prettyValue({
                            value: value,
                            digits: 0
                        });
                        lessDemandMax.usage.visible = true;
                        lessDemandMax.usage.units.displayValue = 'kVAR';
                        if (showUnitsOnRow) {
                            lessDemandMax.usage.units.visible = true;
                        }
                        // Insert our new row into our collection rows
                        rows.splice(i+1, 0, lessDemandMax);

                        // Update our loop variables because we modifed the array we're iterating
                        iLen += 2;
                        i += 2;
                    }

                    // Delete the temporary data object attached to this row
                    delete row.tempData;
                }

                // Save the total amount and pretty amount on the total row we just created
                totalRow.amount.value = collectionTotal;
                totalRow.amount.displayValue = self.prettyValue({
                    value: collectionTotal,
                    minDigits: 2,
                    prepend: '$'
                });

                // Store the total usage (note it's not visible yet)
                totalRow.usage.value = totalUsage;
                totalRow.usage.displayValue = self.prettyValue({
                    value: totalUsage,
                    digits: 0
                });
                // If this collection's usage column is visible and it's 'kWh', and we have multiple consumptions
                if ((usageColumn.visible === true) && (usageColumn.title === 'kWh') && (Object.keys(processedRows).length > 1)) {
                    totalRow.usage.visible = true;
                }

                // Add the total row to our billing collection
                collection.rows.push(totalRow);

                if (createTotalChargesCollection) {
                    // Create a row for our Total Charges collection
                    totalChargeRow = self.newRow(collection.name);
                    totalChargeRow.amount.value = collectionTotal;
                    totalChargeRow.amount.displayValue = self.prettyValue({
                        value: collectionTotal,
                        minDigits: 2
                    });
                    totalCharges.rows.push(totalChargeRow);

                    // Add this collection's total amount to the bill total
                    allCollectionTotal += collectionTotal;
                }

                // Delete temporary data
                delete collection.tempData;
            });

            // If we have multiple collections
            if (createTotalChargesCollection) {
                totalChargesTotalRow = self.newRow('Total');
                totalChargesTotalRow.amount.value = allCollectionTotal;
                totalChargesTotalRow.amount.displayValue = self.prettyValue({
                    value: allCollectionTotal,
                    minDigits: 2,
                    prepend: '$'
                });
                totalCharges.rows.push(totalChargesTotalRow);

                collections.push(totalCharges);
            }
            // Calculate load factor
            calculateAndSaveLoadFactor();

            self.dataRequests.callback();
        },
        receiveDataHandler: function (data) {
            if (this.dataRequests.hasOwnProperty(data.touid) === false)
                return;

            var self = this,
                dataRequests = self.dataRequests[data.touid],
                result = data.results,
                billDataLoadFactor = self.billData.loadFactor,
                arrLookup = {
                    consumption: 'sums',
                    demand: 'maxes'
                },
                keyLookup = {
                    consumption: 'sum',
                    demand: 'max'
                },
                key,
                loadFactor,
                usage,
                dollars;

            dataRequests.forEach(function (dataRequest) {
                var sum,
                    row,
                    tempData,
                    contributors,
                    rateModifierColumn,
                    rateType = dataRequest.rateType,
                    saveModifiedRate = function () {
                        var rateValue = row.rate.value,
                            modifiedRate = row.modifiedRate,
                            numberOfDecimalDigits;

                        // We must make this row's modified rate value visible
                        modifiedRate.visible = true;
                        // The modified rate value hasn't been calculated yet so we need to do that now
                        rateValue = rateValue * (1 + (rateModifierColumn.value / 100));
                        // Floating point operations have limited precision which can lead to round-off errors. They
                        // are really ugly when displayed to the user, i.e. 0.1 + 0.2 = 0.30000000000000004
                        // Let's limit the precision to just under the actual precision.
                        // See 'Round-off errors' here: http://mathjs.org/docs/datatypes/numbers.html
                        rateValue = rateValue.toPrecision(14);
                        // Use parseFloat to convert the string result back to a number and remove trailing zeroes
                        rateValue = parseFloat(rateValue);
                        // Store the modified rate value
                        modifiedRate.value = rateValue;

                        numberOfDecimalDigits = self.getNumberOfDecimalDigits(rateValue);
                        if (numberOfDecimalDigits > tempData.maxModifiedRateDigits) {
                            tempData.maxModifiedRateDigits = numberOfDecimalDigits;
                        }
                    };

                row = dataRequest.billingRow;
                contributors = row.usage.contributors;
                tempData = dataRequest.billingCollection.tempData;
                rateModifierColumn = dataRequest.billingCollection.columns.rateModifier;

                // Check for error first (it's a string); data.result is not present if the 'error' key is present
                // The only time I know this happens is if we have meters defined but all UPI's are unassigned
                if (data.error) {
                    usage = 0;
                }
                // Save the usage value received from the server
                // If our rate element is reactive we have to calculate the usage based on data from the server
                // If it is reactive and result is not an object, it means the server didn't find any on-peak data
                // for the requested time range and so it sent us result = 0
                else if (rateType === 'reactive') {
                    // Save the threshold just in case we ever need it again
                    contributors.threshold = row.tempData.rate.threshold;

                    if (typeof result === 'object') {
                        // The reactiveMax is actually the corresponding reactive value that occurred at the demand max (which really is the period's max)
                        // Get reactive and demand max value pair; the '|| 0' is because the server doesn't always send the the 'max' keys; *1000 converts MVAR to kVAR
                        contributors.reactiveMax = (result[0].reactive.max || 0) * 1000;
                        contributors.demandMax = (result[0].demand.max   || 0) * 1000;

                        row.tempData.reactiveMax   = tou.toFixed(contributors.reactiveMax, 0);
                        row.tempData.lessDemandMax = tou.toFixed(contributors.demandMax * (contributors.threshold / 100), 0);

                        // We have to get a usage based on rounded values because we saw that the usage calculated based on rounded numbers didn't always
                        // equate to the same usage for non-rounded numbers.
                        // Example without rounding:   reactiveMax = 22.5, lessDemandMax = 12.2, usage = 10.3 ==> 10
                        // Same example with rounding: reactiveMax = 23,   lessDemandMax = 12,   usage = 11   ==> 11
                        usage = row.tempData.reactiveMax - row.tempData.lessDemandMax;
                    } else {
                        row.tempData.reactiveMax = 0;
                        contributors.reactiveMax = 0;
                        row.tempData.demandMax = 0;
                        contributors.demandMax = 0;

                        usage = 0;
                    }
                } else {
                    // Must be a consumption or demand charge
                    // The server's response is formated differently depending on the data requested
                    // The '|| 0' is because the server doesn't always send the 'max' or 'sum' key
                    usage = result[arrLookup[rateType]][0][keyLookup[rateType]] || 0;

                    // Convert M to k (i.e. MW to kW, MWh to kWh)
                    usage *= 1000;
                }

                // If masterRateType is not null
                if (!!dataRequest.masterRateType) {
                    if (rateType === 'consumption') {
                        key = 'totalConsumption';
                    } else if (dataRequest.requestOptions.peak === 'both') { // rateType = 'demand'
                        key = 'maxDemand';
                    } else { // dataRequest.requestOptions.peak === 'on'
                        key = 'peakDemand';
                    }

                    if (dataRequest.masterRateType === 'loadFactor') {
                        billDataLoadFactor.contributors[key] = usage;
                    } else { // dataRequest.masterRateType === 'consumption'
                        contributors[key] = usage;
                    }
                } else {
                    // Store raw usage received from the server
                    contributors[rateType] = usage;
                    // Store the rounded result on the row
                    row.usage.value = tou.toFixed(usage, 0);

                    // If the modified rate column is visible we need to calculate and store the modified rate on the row
                    if (rateModifierColumn.visible) {
                        saveModifiedRate();
                    }
                }
            });

            // Clean up our dataRequst object
            delete self.dataRequests[data.touid];

            // If all requests have been received we need to perform some final processing
            // We check against 1 because our callback occupies 1 key
            if (Object.keys(self.dataRequests).length === 1) {
                self.applyPostProcessing();
            }
        },
        initSubscriptions: function () {
            var self = this,
                classPrefix = self.classPrefix,
                bindings = self.bindings,
                now = new Date(),
                thisYear = now.getFullYear(),
                thisMonth = now.getMonth();

            // This subscription is used to update our billingcycle observable whenver the selected
            // billing period is changed. It creates an object like this:
            // {
            //      days: # days elapsed in selected month
            //      total: # days in month
            //      complete: boolean indicates if month is complete
            //      percentComplete: only present if the month isn't complete
            // }
            bindings.selectedBill.subscribe(function (bill) {
                if (!bill)
                    return;

                var billingCycle = {
                        complete: false
                    },
                    selectedDate = new Date(bill.start),
                    selectedMonth = selectedDate.getMonth(),
                    selectedYear = selectedDate.getFullYear(),
                    billingCycleCompleted = false;

                if (bill.period === 'Month') {
                    // Get total days in the billing cycle
                    billingCycle.totalDays = self.daysInMonth[selectedMonth];
                    // Adjust total days if billing cycle is February and it's a leap year
                    if ((selectedMonth === 1) && ((selectedYear % 4) === 0)) {
                        billingCycle.totalDays++;
                    }

                    if ((thisYear === selectedYear) && (thisMonth === selectedMonth)) {
                        billingCycle.completedDays = now.getDate();
                    } else {
                        billingCycle.complete = true;
                    }
                } else { // year bill
                    // Get total days
                    billingCycle.totalDays = (bill.end - bill.start) / 86400000;

                    // If current year
                    if (now >= bill.start && now < bill.end) {
                        billingCycle.completedDays = Math.ceil((now - bill.start) / 86400000);
                    } else { // Old fiscal year (it's complete)
                        billingCycle.complete = true;
                    }
                }

                if (billingCycle.complete) {
                    billingCycle.completedDays = billingCycle.totalDays;
                    billingCycle.percentComplete = '100%';
                } else {
                    billingCycle.percentComplete = [parseInt(billingCycle.completedDays / billingCycle.totalDays * 100, 10), '%'].join('');
                }

                bindings.billingCycle(billingCycle);

                // This actually builds the new bill and requests data from the server
                self.buildBill(bill);
            });

            bindings.isEditMode.subscribe(function (editMode) {
                // We can't cache this because we don't know when all buttons are viewable
                var viewControls = $(classPrefix + '.billingTopBar .viewControls').find('button');
                // Disable/enable all view controls (bill select, print, etc.)
                viewControls.attr('disabled', editMode);
            });

            bindings.gettingData.subscribe(function (gettingData) {
                // We can't cache this because we don't know when all buttons are viewable
                var allControls = $(classPrefix + '.billingTopBar').find('button');
                // Disable/endable all view and edit control buttons
                allControls.attr('disabled', gettingData);
            });
        },
        init: function () { // This function is ran once when the utility is loaded
            var self = this,
                bindings = self.bindings,
                classPrefix = '.' + self.utilityNameShort + ' ',
                $availablePeriods = $(classPrefix + '.billingTopBar .dropdown-menu.availablePeriods'),
                $billSearchInput = $availablePeriods.find('input'),
                noMeters = (tou.getMeters(true).length === 0),
                configRequired,
                findBill = function (selectedBill) {
                    if (selectedBill) {
                        for (var i = 0, len = self.bills.length; i < len; i++) {
                            if (self.bills[i].fullDate === selectedBill.fullDate) {
                                return self.bills[i];
                            }
                        }
                    }
                },
                postInit = function () {
                    var bill;

                    // Get available periods - we get a copy so our changes don't affect the original
                    self.bills = $.extend(true, [], tou.availablePeriods[self.utilityName]);
                    // Add and compute the isCommitted observalbe
                    self.bills.forEach(function (bill) {
                        bill.isCommitted = ko.observable(self.committedBills.hasOwnProperty(bill.fullDate) ? true:false);
                    });

                    // Get configuraiton required flag - if true, billing UI is pretty much disabled
                    configRequired = noMeters || (self.bills.length === 0);

                    bindings.configRequired(configRequired);
                    if (!configRequired) {
                        // Set/clear our billsAvailable flag
                        bindings.billsAvailable(self.bills.length > 0);
                        // Populate our filtered bill list (filteredBills computed)
                        bindings.billsFilter.valueHasMutated();

                        // Find the selected bill again
                        bill = findBill(bindings.selectedBill());
                        // If no bill was selected or we couldn't find the previously selected bill
                        if (!bill) {
                            // Our bills first entry should be the fiscal year, followed by the current month; we default 
                            // select the first month ('|| self.bills[0]' is just CYB)
                            bill = self.bills[1] || self.bills[0];
                        }
                        // Select the bill (also forces bill to render)
                        bindings.selectedBill(bill);
                    }
                };
            // Save the class prefix
            self.classPrefix = classPrefix;

            // Get a reference to the raw utility data from the server
            self.rawUtility = tou.currUtility;
            // Save reference to our committed bills
            self.committedBills = self.rawUtility.Billing.committedBills;
            // Save the default bill title
            self.defaultTitle = self.rawUtility.Billing.defaultTitle;
            self.tempDefaultTitle = self.defaultTitle;
            // Initialize our subscriptions
            self.initSubscriptions();
            // Init our active meter list
            self.buildActiveMeters();
            // Perofrm final inits
            postInit();

            tou.on('ratetablesaved', function (utilityName) {
                if (self.utilityName === utilityName) {
                    postInit();
                }
            });
            tou.on('meterssaved', function (utilityName) {
                if (self.utilityName === utilityName) {
                    noMeters = (tou.getMeters(true).length === 0);
                    self.buildActiveMeters();
                    postInit();
                }
            });

            // Prevent the bill-select drop-down from closing when selecting the search input
            $billSearchInput.click(function (e) {
                e.stopPropagation();
            });
            // Automatically focus the search box when the bill-select drop-down is activated
            $(classPrefix + 'button.billSelect').click(function (e) {
                window.setTimeout(function () { // Delay the focus for drop down transition to finish
                    // If we're scrolled to the top of the list
                    if ($availablePeriods.scrollTop() === 0) {
                        $billSearchInput.focus();
                    }
                }, 50);
            });
        }
    }, {
        title: 'Reports',
        isActive: ko.observable(false),
        delayLoad: true,
        background: 'woodbackgroundtile.jpg',
        listOfMonthYears: ko.observableArray([]),
        modalTemplates: {
            reportingUncommitReport: {
                commitInfo: ''
            },
            reportingCommitReport: {}
        },
        blockUI: function (state) {
            var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
            // If we're blocking the UI (i.e. we're getting data)
            if (state === true) {
                myBindings.$reportsContent.hide();
                myBindings.$reportsGettingData.show();
            } else {
                myBindings.$reportsContent.show();
                myBindings.$reportsGettingData.hide();
            }
            // Disable/enable all top bar controls (month select, print, etc.)
            myBindings.$topBarControls.attr('disabled', state);
        },
        saveReport: function (self, opts) {
            var nonData = {
                utilityName: self.utilityName,
                path: opts.path,
                remove: opts.remove
            };
            tou.saveUtility(nonData, opts.data, function (response) {
                tou.log('saveresponse', response);
                if (opts.callback !== undefined) {
                    if (response.message && response.message === 'success') {
                        opts.callback(false);
                    } else {
                        opts.callback(true);
                    }
                }
            }, true);
        },
        initReportSocket: function(cb) {
            tou.socket.on('returnUsage', function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                if (data.err === null) {
                    myBindings.parseReturnedData(data.results);
                } else {
                    tou.alert("Error while retrieving data");
                }
            });
        },
        refreshMonthYear: function () {
            var self = this,
                copyOfListOfMonthYears = $.extend(true, [], self.listOfMonthYears());
            if (!!self.bindings.$page.committedReports) {
                self.reportPeriods = ko.utils.arrayFilter(copyOfListOfMonthYears, function (period) {
                    period.isReportCommitted = ko.observable(self.bindings.$page.committedReports.hasOwnProperty(period.fullDate) ? true : false);
                    // We only want the month entries
                    return period;
                });
                self.listOfMonthYears(copyOfListOfMonthYears);
            }
        },
        init: function () {
            var self = this,
                filteredReportMonthYear,
                $availablePeriods = $('.' + self.utilityNameShort + ' .reportsTopBar .availablePeriods'),
                $availablePeriodsInput = $availablePeriods.find('input'),
                setDefaultMonthYear = function () {
                    if (self.bindings.selectedMonthYear() === "") {
                        filteredReportMonthYear = self.bindings.filteredReportMonthYear();
                        for (var i = 0, len = filteredReportMonthYear.length, done = false; i < len && !done; i++) {
                            if (filteredReportMonthYear[i].period === 'Month') {
                                self.bindings.monthSelected(filteredReportMonthYear[i]);
                                done = true;
                            }
                        }
                    }
                },
                postInit = function () {
                    var configRequired = (self.bindings.listOfMeters().length === 0) || (self.listOfMonthYears().length === 0);
                    self.bindings.configRequired(configRequired);
                    self.refreshMonthYear();
                    if (!configRequired) {
                        setDefaultMonthYear();
                        self.bindings.getData();
                    }
                };
            self.initReportSocket(self.bindings.getData);

            $.extend(self.bindings, {
                $mainContent: $('.' + self.utilityNameShort + ' .mainContent'),
                $reportsContent: $('.' + self.utilityNameShort + ' .reportsContent'),
                $busySpinner: $('.' + self.utilityNameShort + ' .reportsContent .busySpinner'),
                $thisTopBar: $('.' + self.utilityNameShort + ' .topBar'),
                $highestOnPeakDemand: $('.' + self.utilityNameShort + ' .section.highestOnPeakDemand'),
                $highestDemand: $('.' + self.utilityNameShort + ' .section.highestDemand'),
                $highestConsumption: $('.' + self.utilityNameShort + ' .section.highestConsumption'),
                $highlowTemperatures: $('.' + self.utilityNameShort + ' .section.highlowTemperatures'),
                $missingDataSection: $('.' + self.utilityNameShort + ' .section.missingData'),
                $demandAndUsage: $('.' + self.utilityNameShort + ' .section.demandandusage'),
                $meterstotals: $('.' + self.utilityNameShort + ' .section.meterstotals'),
                $reportsChartsContent: $('.' + self.utilityNameShort + ' .reportsContent .reportsChartsContent'),
                $reportsGridContent: $('.' + self.utilityNameShort + ' .reportsContent .reportsGridContent'),
                $individualMetersData: $('.' + self.utilityNameShort + ' .reportsContent .individualMetersData'),
                $topBarControls: $('.' + self.utilityNameShort + ' .reportsTopBar').find('button'),
                $reportsGettingData: $('.' + self.utilityNameShort + ' .reportsGettingData')
            });

            $(window).resize(function () {
                self.bindings.handleResize();
            });

            // Prevent the drop-down from closing when selecting the search input
            $availablePeriodsInput.click(function (e) {
                e.stopPropagation();
            });
            // Automatically focus the search box when the drop-down is activated
            $('.' + self.utilityNameShort + ' .reportsTopBar .availablePeriodsSelect').click(function (e) {
                window.setTimeout(function () { // Delay the focus for drop down transition to finish
                    // If we're scrolled to the top of the list
                    if ($availablePeriods.scrollTop() === 0) {
                        $availablePeriodsInput.focus();
                    }
                }, 50);
            });

            self.committedReports = (!!self.rawUtility.Reports ? self.rawUtility.Reports.committedReports : tou.utilityTemplates[self.utilityNameShort].Reports.committedReports);
            self.bindings.$busySpinner.hide();
            self.bindings.listOfMeters(tou.getMeters(true));
            self.bindings.inactiveMeters(tou.getMeters(false));
            self.listOfMonthYears(tou.availablePeriods[self.utilityName]);
            self.bindings.numberOfInactiveMeters(self.bindings.inactiveMeters().length);
            self.bindings.meterIndexArray = self.bindings.indexMeters();
            self.bindings.$reportsContent.hide();
            self.bindings.$reportsGridContent.hide();
            self.bindings.decimalPlaces((self.bindings.electricalUnit() === "kW") ? 0 : 3);

            // Set the config required flag - if true, reports is disabled
            self.bindings.configRequired((self.bindings.listOfMeters().length === 0) || (self.listOfMonthYears().length === 0));
            postInit();
            self.bindings.reportDateFilter.valueHasMutated();

            if (!self.bindings.configRequired()) {
                // We don't do the followign if config is requried because it causes us to try and get a report (monthSelected fires it off),
                // which was causing the UI busy spinner to become visible.

                // Default select the most recent month
                setDefaultMonthYear();
            }

            tou.on('meterssaved', function (utilityName) {
                if (utilityName === self.utilityName) {
                    self.bindings.listOfMeters(tou.getMeters(true));
                    self.bindings.inactiveMeters(tou.getMeters(false));
                    self.bindings.numberOfInactiveMeters(self.bindings.inactiveMeters().length);
                    self.bindings.meterIndexArray = self.bindings.indexMeters();

                    postInit();
                }
            });
            tou.on('ratetablesaved', function (utilityName) {
                if (utilityName === self.utilityName) {
                    self.listOfMonthYears(tou.availablePeriods[self.utilityName]);
                    self.bindings.reportDateFilter.valueHasMutated();

                    postInit();
                }
            });
        },
        bindings: {
            activeDataRequests: [],
            configRequired: ko.observable(false),
            activeDataRequest: ko.observable(false),
            committedReports: {},
            dataRequestTimer: null,
            decimalPlaces: ko.observable(0),
            displayPercentageOfValidData: ko.observable(0),
            duOffPeakMW: ko.observable({
                timestamp: null,
                value: null
            }),
            duOnPeakMW: ko.observable({
                timestamp: null,
                value: null
            }),
            duOffPeakMVAR: ko.observable({
                timestamp: null,
                value: null
            }),
            duOnPeakMVAR: ko.observable({
                timestamp: null,
                value: null
            }),
            duOffPeakMWH: ko.observable({
                timestamp: null,
                value: null
            }),
            duOnPeakMWH: ko.observable({
                timestamp: null,
                value: null
            }),
            electricalUnit: ko.observable("kW"),
            endTime: 0,
            errorWithRequest: ko.observable(false),
            gridReportCollection: [],
            highestConsumptionLastYear: ko.observable(''),
            highestConsumptionNow: ko.observable(''),
            highestDemandLastYear: ko.observable(''),
            highestDemandNow: ko.observable(''),
            highestOnPeakDemandLastYear: ko.observable(''),
            highestOnPeakDemandNow: ko.observable(''),
            highestTemperatureNow: ko.observable(""),
            inactiveMeters: ko.observableArray([]),
            koGridReportCollection: ko.observableArray([]),
            lastResize: null,
            listOfMeters: ko.observableArray(),
            lowestTemperatureNow: ko.observable(""),
            maxPeriodUsage: ko.observable(0),
            meterIndexArray: [],
            MeterReportCollection: ko.observableArray([]),
            missingDataCollection: ko.observableArray([]),
            numberOfDaysInCurrentPeriod: 0,
            numberOfInactiveMeters: ko.observable(0),
            numberOfTimeSlotsPerDay: (24 * 2),
            percentageOfMissingData: ko.observable(0),
            reportData: {},
            reportDateFilter: ko.observable(""),
            reportsModes: ko.observableArray(["Chart", "Grid"]),
            resizeTimer: 500,
            selectedMonthYear: ko.observable(""),
            selectedReportsMode: ko.observable("Chart"),
            startTime: 0,
            summedDataCollection: ko.observableArray([]),
            sumOfOffPeakConsumption: ko.observable(0),
            sumOfOnPeakConsumption: ko.observable(0),
            sumOfTotalPeriodUsage: ko.observable(0),
            temperatureCollection: ko.observableArray([]),
            temperatureTitle: ko.observable(""),
            highestTemperatureVerbiage: ko.observable(""),
            lowestTemperatureVerbiage: ko.observable(""),
            temperatureVerbiageHDDCDD: ko.observable(""),
            getUnitsInPeriod: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    answer = 0,
                    monthYear = myBindings.selectedMonthYear();

                if (monthYear.period.toLowerCase() === "month") {
                    answer = myBindings.numberOfDaysInCurrentPeriod;
                } else if (monthYear.period.toLowerCase() === "year") {
                    answer = 12;
                }

                return answer;
            },
            highlightMaxes: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    max,
                    numValue,
                    noCommas,
                    $maxTD,
                    gridColumns = [
                        "gridonpeakdemand",
                        "gridonpeakreactive",
                        "gridoffpeakdemand",
                        "gridoffpeakreactive",
                        "gridonpeakconsumption",
                        "gridoffpeakconsumption",
                        "gridconsumptiontotal"],
                    individualMeterColumns = [
                        "meterOffPeakSum",
                        "meterOnPeakSum",
                        "meterOnAndOffPeakSum"],
                    i;

                for(i = 0; i < gridColumns.length; i++) {
                    $maxTD = null;
                    max = null;
                    $(myBindings.$reportsGridContent).find('.' + gridColumns[i] + " .itemValue").each(function () {
                        noCommas = $(this).html().replace(/,/g, '');
                        numValue = parseFloat(noCommas);
                        if (numValue > max) {
                            max = numValue;
                            $maxTD = $(this).parent();
                        }
                    });
                    if ($maxTD) {
                        $maxTD.addClass("danger");
                    }
                }

                for(i = 0; i < individualMeterColumns.length; i++) {
                    $maxTD = null;
                    max = null;
                    $(myBindings.$individualMetersData).find('.' + individualMeterColumns[i]).each(function () {
                        if ($(this).parent().find(".individualMeterName").html() !== "Totals") {
                            noCommas = $(this).html().replace(/,/g, '');
                            numValue = parseFloat(noCommas);
                            if (numValue > max) {
                                max = numValue;
                                $maxTD = $(this);
                            }
                        }
                    });
                    if ($maxTD) {
                        //$maxTD.addClass("danger");
                    }
                }
            },
            handleResize: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                myBindings.lastResize = new Date();
                setTimeout(function () {
                    if (new Date() - myBindings.lastResize >= myBindings.resizeTimer) {
                        myBindings.drawCharts();
                    }
                }, myBindings.resizeTimer);
            },
            drawCharts: function (printFormat) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;

                if (myBindings.selectedMonthYear() !== "" && myBindings.listOfMeters().length > 0) {
                    setTimeout(function () {
                        myBindings.renderOnPeakDemand(myBindings.reportData["OnPeakDemand"], printFormat);
                    }, 1);
                    setTimeout(function () {
                        myBindings.renderDemand(myBindings.reportData["MaxForOnOffPeakDemandArray"], printFormat);
                    }, 1);
                    setTimeout(function () {
                        myBindings.renderConsumption(myBindings.reportData["TotaledOnOffPeakConsumption"], printFormat);
                    }, 1);
                    setTimeout(function () {
                        myBindings.renderTemperatures(myBindings.reportData["TemperatureData"], printFormat);
                    }, 1);
                }
            },
            print: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                myBindings.drawCharts(true);
                setTimeout(function () {
                    tou.print($('.' + myBindings.$page.utilityNameShort + ' .' + myBindings.$page.title.toLowerCase() + ' .reportsContent'));
                }, 900);
            },
            exportPDF: function () {
                tou.exportPDF($('.' + this.$page.utilityNameShort + ' .' + this.$page.title.toLowerCase() + ' .reportsContent'));
            },
            commitReport: function () {
                var self = this,
                    myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    now = parseInt(new Date().getTime() / 1000, 10),
                    _reportData = $.extend(true, {}, myBindings.reportData),
                    committedReports = self.committedReports,
                    user = tou.workspaceManager.user(),
                    $modalControls = $('.reportingCommitReportModal .commitControls button'),
                    $spinner = $modalControls.find('i'),
                    timerid,
                    updateCommit = function (reportData) {
                        reportData.commit = {
                            done: true,
                            timestamp: now,
                            user: [user.firstName, user.lastName].join(' ')
                        };
                    };

                updateCommit(_reportData);
                $modalControls.attr('disabled', true);
                timerid = setTimeout(function () {
                    $spinner.show();
                }, 100);

                self.saveReport(self, {
                    path: [self.title, 'committedReports', myBindings.selectedMonthYear().fullDate].join('.'),
                    remove: false,
                    data: _reportData,
                    callback: function (error) {
                        clearTimeout(timerid);
                        $spinner.hide();
                        $modalControls.attr('disabled', false);
                        if (!error) {
                            updateCommit(_reportData);
                            myBindings.reportData = _reportData;
                            committedReports[myBindings.selectedMonthYear().fullDate] = _reportData;
                            myBindings.selectedMonthYear().isReportCommitted(true);
                            tou.hideModal();
                            self.refreshMonthYear();
                        } else {
                            tou.alert('There was a problem committing this report. Please try again. If the problem persists please reload the page and try again.');
                        }
                    }
                });
            },
            uncommitReport: function () {
                // This routine called from a modal which has bound $page to "this"
                var self = this,
                    myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    committedReports = self.committedReports,
                    $modalControls = $('.reportingUncommitBillModal .uncommitControls button'),
                    $spinner = $modalControls.find('i'),
                    timerid;

                $modalControls.attr('disabled', true);
                timerid = setTimeout(function () {
                    $spinner.show();
                }, 100);
                self.saveReport(self, {
                    path: [self.title, 'committedReports', myBindings.selectedMonthYear().fullDate].join('.'),
                    remove: true,
                    data: null,
                    callback: function (error) {
                        clearTimeout(timerid);
                        $spinner.hide();
                        $modalControls.attr('disabled', false);

                        if (!error) {
                            delete committedReports[myBindings.selectedMonthYear().fullDate];
                            myBindings.selectedMonthYear().isReportCommitted(false);
                            tou.hideModal();
                            self.refreshMonthYear();
                            myBindings.getData();
                        } else {
                            tou.alert('There was a problem uncommitting this report. Please try again. If the problem persists please reload the page and try again.');
                        }
                    }
                });
            },
            showCommitModal: function () {
                tou.showModal('reportingCommitReport', null, this.$page);
            },
            showUncommitModal: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                tou.showModal('reportingUncommitReport', {
                    commitInfo: 'This report was committed by Nikola Tesla' + 'on' + myBindings.selectedMonthYear().start
                }, this.$page);
            },
            getCommitInfoString: function (data) {
                var self = this,
                    committedReport = self.$page.committedReports[data.fullDate],
                    date = new Date(committedReport.commit.timestamp * 1000),
                    now = new Date(),
                    day = date.getDate(),
                    month = tou.fullMonthList[date.getMonth()],
                    year = date.getFullYear(),
                    dateString = [month, day].join(' ');

                if (year !== now.getFullYear()) {
                    dateString = [dateString, ', ', year].join('');
                }
                dateString += '.';

                return ['This report was committed by', committedReport.commit.user, 'on', dateString].join(' ');
            },
            getChartWidth: function (printFormat) {
                return (printFormat === true) ? 725 : window.innerWidth - 210;
            },
            adjustPrecision: function (value) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                value = isNaN(value) ? 0: value;
                value = (myBindings.electricalUnit() === "kW") ? value * 1000 : value;
                return value;
            },
            findMax: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    answer = {
                        value: null,
                        timeStamp: null
                    },
                    i,
                    lenData;
                if (data) {
                    lenData = data.length;
                    for (i = 0; i < lenData; i++) {
                        //console.log("   data[" + i + "].timeStamp = " + moment(data[i].timeStamp).format("MM/DD/YYYY"));
                        if (data[i].value !== null) {
                            if ((answer.value === null) || (answer.value < data[i].value)) {
                                answer.value = tou.toFixed(data[i].value, myBindings.decimalPlaces());
                                answer.timeStamp = data[i].timeStamp;
                            }
                        }
                    }
                }
                return answer;
            },
            findByTimestamp: function (data, timeStamp) {
                var answer = null,
                    i,
                    lenData = data.length;
                for (i = 0; i < lenData; i++) {
                    if (data[i].timeStamp === timeStamp) {
                        answer = data[i];
                        break;
                    }
                }
                return answer;
            },
            sumCollection: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    answer = 0,
                    i,
                    lenData = data.length;
                for (i = 0; i < lenData; i++) {
                    answer += data[i].value;
                }
                return tou.toFixed(answer, myBindings.decimalPlaces());
            },
            initGridData: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                if (myBindings.koGridReportCollection().length === 0) {
                    var monthYear = this.selectedMonthYear(),
                        monthYearPeriod = monthYear.period.toLowerCase(),
                        indexedDate,
                        startIndex,
                        periodIndex,
                        periodMax,
                        gridData = [];

                    if (monthYearPeriod === "month") {
                        startIndex = 1;
                        periodMax = (myBindings.numberOfDaysInCurrentPeriod + 1);
                    } else if (monthYearPeriod === "year") {
                        startIndex = 0;
                        periodMax = 12;
                    }
                    indexedDate = moment(monthYear.start).startOf("month").endOf("day");
                    for (periodIndex = startIndex; periodIndex < periodMax; periodIndex++) {
                        gridData.push({
                            date: indexedDate.unix(),
                            OnPeakDemand: 0,
                            OnPeakReactive: 0,
                            OffPeakDemand: 0,
                            OffPeakReactive: 0,
                            OnPeakConsumption: 0,
                            OffPeakConsumption: 0,
                            TotaledOnOffPeakConsumption: 0
                        });
                        indexedDate = moment(indexedDate).add(1, monthYear.childPeriod);
                    }
                    myBindings.koGridReportCollection(gridData);
                }
            },
            initPeriodArray: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    a = [],
                    i,
                    unitIndex = 0,
                    ts = moment(monthYear.start).unix(),
                    unitsInTimePeriod = myBindings.getUnitsInPeriod();

                for (i = 0; i < unitsInTimePeriod; i++) {
                    unitIndex = (parseInt(moment.unix(ts).format(monthYear.childFormatCode), 10) - 1);
                    a[unitIndex] = {
                        value: null,
                        timeStamp: (ts * 1000)
                    };
                    ts = (moment.unix(ts).add(1, monthYear.childPeriod)).unix();
                }
                return a;
            },
            formatHighestValueVerbiage: function (value, timeStamp, includeTimeStamp) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    answer,
                    monthYear = myBindings.selectedMonthYear(),
                    displayValue = tou.toFixed(value, myBindings.decimalPlaces()),
                    timeStampFormat = includeTimeStamp ? "dddd, MMMM Do YYYY, HH:00" : "dddd, MMMM Do YYYY";

                if (timeStamp !== null && displayValue > 0) {
                    if (monthYear.period.toLowerCase() === "month") {
                        answer = moment(timeStamp).format(timeStampFormat) + " and was " + tou.numberWithCommas(displayValue) + myBindings.electricalUnit();
                    } else if (monthYear.period.toLowerCase() === "year") {
                        answer = moment(timeStamp).format("MMMM, YYYY") + " and was " + tou.numberWithCommas(displayValue) + myBindings.electricalUnit();
                    }
                } else {
                    answer = "- no data available -";
                }

                return answer;
            },
            totalOnOffPeak: function (onPeak, offPeak) {
                var i,
                    summedValues,
                    lenOffPeak = (offPeak ? offPeak.length : 0),
                    result = [],
                    getSum = function (a, b) {
                        var answer = 0;

                        answer += (a ? a.value : 0);
                        answer += (b ? b.value : 0);

                        return answer;
                    };
                for (i = 0; i < lenOffPeak; i++) { // onPeak and offPeak will need to have same number of timestamp slots
                    summedValues = getSum(onPeak[i], offPeak[i]);
                    result.push({
                        value: summedValues,
                        timeStamp: offPeak[i].timeStamp
                    });
                }
                return result;
            },
            maxForOnOffPeak: function (onPeak, offPeak) {
                var i,
                    lenOffPeak = (offPeak ? offPeak.length : 0),
                    result = [],
                    getMax = function (a, b) {
                        var answer;

                        if (a <= b) {
                            answer = b;
                        } else {
                            answer = a;
                        }

                        return answer;
                    };
                for (i = 0; i < lenOffPeak; i++) { // onPeak and offPeak will need to have same number of timestamp slots
                    result.push({
                        value: getMax(onPeak[i].value, offPeak[i].value),
                        timeStamp: offPeak[i].timeStamp
                    });
                }
                return result;
            },
            setGridData: function (fieldName) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                if (myBindings.reportData[fieldName]) {
                    var gridData = $.extend(true, [], myBindings.koGridReportCollection()),
                        monthYear = myBindings.selectedMonthYear(),
                        i,
                        len = myBindings.reportData[fieldName].length,
                        collectionItem,
                        gridItem,
                        gridItemDate,
                        collectionItemDate;
                    for (i = 0; i < len; i++) {
                        collectionItem = myBindings.reportData[fieldName][i];
                        collectionItemDate = new Date(collectionItem.timeStamp);
                        gridItem = ko.utils.arrayFirst(gridData, function (item) {
                            gridItemDate = new Date(item.date * 1000);
                            if (monthYear.period.toLowerCase() === "month") {
                                return (gridItemDate.getDate() === collectionItemDate.getDate());
                            } else if (monthYear.period.toLowerCase() === "year") {
                                return (gridItemDate.getMonth() === collectionItemDate.getMonth());
                            } else {
                                return null;
                            }
                        });

                        if (gridItem) {
                            gridItem[fieldName] = {
                                value: tou.toFixed(collectionItem.value, 0),
                                timeStamp: collectionItem.timeStamp
                            };
                        } else {
                            //console.log(" --- setGridData() NOT FOUND ---- i = ", i,  "   itemData = ", new Date(collectionData[i].timeStamp));
                        }
                    }
                    myBindings.koGridReportCollection(gridData);
                }
            },
            indexMeters: function () {
                var i,
                    j,
                    meters = this.listOfMeters(),
                    metersIndex = [];
                for (i = 0; i < meters.length; i++) {
                    for (j = 0; j < meters[i].meterPoints.length; j++) {
                        if (metersIndex[meters[i].meterPoints[j].upi] === undefined) {
                            metersIndex[meters[i].meterPoints[j].upi] = {
                                meterIndex: i,
                                meterPointIndex: j
                            };
                        } else {
                            console.log("found duplicate UPIs upi = " + meters[i].meterPoints[j].upi + "  i = " + i + "  j = " + j);
                        }
                    }
                }

                return metersIndex;
            },
            renderCompleteReport: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                if (!!myBindings.reportData) {
                    myBindings.highestOnPeakDemandLastYear(myBindings.reportData["LastYearsOnPeakDemand"]);
                    myBindings.highestDemandLastYear(myBindings.reportData["LastYearsDemand"]);
                    myBindings.duOnPeakMWH(myBindings.findMax(myBindings.reportData["OnPeakConsumption"]));
                    myBindings.duOffPeakMWH(myBindings.findMax(myBindings.reportData["OffPeakConsumption"]));
                    myBindings.maxPeriodUsage(myBindings.findMax(myBindings.reportData["TotaledOnOffPeakConsumption"]));

                    myBindings.sumOfOnPeakConsumption(myBindings.sumCollection(myBindings.reportData["OnPeakConsumption"]));
                    myBindings.sumOfOffPeakConsumption(myBindings.sumCollection(myBindings.reportData["OffPeakConsumption"]));
                    myBindings.sumOfTotalPeriodUsage(myBindings.sumCollection(myBindings.reportData["TotaledOnOffPeakConsumption"]));

                    myBindings.setGridData("OnPeakConsumption");
                    myBindings.setGridData("OffPeakConsumption");
                    myBindings.setGridData("TotaledOnOffPeakConsumption");

                    myBindings.renderConsumption(myBindings.reportData["TotaledOnOffPeakConsumption"]);
                    myBindings.highestConsumptionLastYear(myBindings.reportData["HighestConsumptionLastYear"]);
                    myBindings.renderTemperatures(myBindings.reportData["TemperatureData"]);
                    myBindings.setCddAndHddVerbiage();

                    myBindings.missingDataCollection(myBindings.reportData["MissingMeterData"]);
                    myBindings.percentageOfMissingData(myBindings.reportData["PercentageMissingMeterData"]);
                    myBindings.displayPercentageOfValidData(tou.toFixed(myBindings.percentageOfMissingData(), 2));

                    myBindings.setGridData("OnPeakDemand");
                    myBindings.setGridData("OffPeakDemand");
                    myBindings.setGridData("OnPeakReactive");
                    myBindings.setGridData("OffPeakReactive");
                    myBindings.duOnPeakMW(myBindings.findMax(myBindings.reportData["OnPeakDemand"]));
                    myBindings.duOffPeakMW(myBindings.findMax(myBindings.reportData["OffPeakDemand"]));
                    myBindings.duOnPeakMVAR(myBindings.findMax(myBindings.reportData["OnPeakReactive"]));
                    myBindings.duOffPeakMVAR(myBindings.findMax(myBindings.reportData["OffPeakReactive"]));
                    //myBindings.duOnPeakMVAR(myBindings.findByTimestamp(myBindings.reportData["OnPeakReactive"], myBindings.duOnPeakMW().timeStamp));
                    //myBindings.duOffPeakMVAR(myBindings.findByTimestamp(myBindings.reportData["OffPeakReactive"], myBindings.duOffPeakMW().timeStamp));

                    myBindings.renderOnPeakDemand(myBindings.reportData["OnPeakDemand"]);
                    myBindings.renderDemand(myBindings.reportData["MaxForOnOffPeakDemandArray"]);

                    myBindings.MeterReportCollection(myBindings.reportData["IndividualMeterData"]);
                    myBindings.highlightMaxes();
                }
            },
            renderOnPeakDemand: function (arrayOfData, printFormat) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    trendPlot,
                    maxValueVerbiage,
                    maxValue = myBindings.findMax(arrayOfData),
                    chartWidth = myBindings.getChartWidth(printFormat),
                    $highestOnPeakDemandPeriodChart = $(myBindings.$reportsContent).find(' .highestOnPeakDemandPeriodChart');

                maxValueVerbiage = myBindings.formatHighestValueVerbiage(maxValue.value, maxValue.timeStamp, true);
                myBindings.highestOnPeakDemandNow(maxValueVerbiage);

                if (arrayOfData) {
                    arrayOfData.sort(function (a, b) {
                        return (a.timeStamp > b.timeStamp) ? 1 : -1;
                    });
                }

                if ($highestOnPeakDemandPeriodChart.length > 0) {
                    trendPlot = new TrendPlot({
                        width: chartWidth,
                        height: 300,
                        target: $highestOnPeakDemandPeriodChart,
                        y: 'value',
                        x: 'timeStamp',
                        rawX: 'timeStamp',
                        highlightMax: true,
                        tooltip: {
                            formatter: function () {
                                var ret = '',
                                    self = this;
                                $.each(this.points, function (idx) {
                                    ret += '<span style="font-size: 10px">' + moment(this.point.rawX).format("dddd, MMM DD, YYYY HH:mm") + '</span><br>' + '<span style="color:' + this.point.color + '">●</span> ' + this.series.name + ': <b>' + trendPlots.numberWithCommas(this.y) + ' ' + myBindings.electricalUnit() + '</b>';
                                    if (idx < self.points.length - 1) {
                                        ret += '<br/>';
                                    }
                                });
                                return ret;
                            },
                        },
                        data: {
                            data: arrayOfData,
                            name: 'Demand'
                        },
                        type: 'column',
                        xAxis: {
                            allowDecimals: false
                        },
                        yAxisTitle: myBindings.electricalUnit(),
                        xValueFormatter: function(timestamp) {
                            var date = new Date(timestamp);
                            date.setHours(0);
                            date.setMinutes(0);
                            date.setSeconds(0);
                            date.setMilliseconds(0);
                            if (monthYear.period === "Year") {
                                date.setDate(15);
                            }
                            return date.getTime();
                        }
                    });
                }
            },
            renderDemand: function (arrayOfData, printFormat) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    trendPlot,
                    maxValueVerbiage,
                    maxValue = myBindings.findMax(arrayOfData),
                    chartWidth = myBindings.getChartWidth(printFormat),
                    $highestDemandPeriodChart = $(myBindings.$reportsContent).find(' .highestDemandPeriodChart');

                maxValueVerbiage = myBindings.formatHighestValueVerbiage(maxValue.value, maxValue.timeStamp, true);
                myBindings.highestDemandNow(maxValueVerbiage);

                if (arrayOfData) {
                    arrayOfData.sort(function (a, b) {
                        return (a.timeStamp > b.timeStamp) ? 1 : -1;
                    });
                }

                if ($highestDemandPeriodChart.length > 0) {
                    trendPlot = new TrendPlot({
                        width: chartWidth,
                        height: 300,
                        target: $highestDemandPeriodChart,
                        y: 'value',
                        x: 'timeStamp',
                        rawX: 'timeStamp',
                        highlightMax: true,
                        tooltip: {
                            formatter: function () {
                                var ret = '',
                                    self = this;
                                $.each(this.points, function (idx) {
                                    ret += '<span style="font-size: 10px">' + moment(this.point.rawX).format("dddd, MMM DD, YYYY HH:mm") + '</span><br>' + '<span style="color:' + this.point.color + '">●</span> ' + this.series.name + ': <b>' + trendPlots.numberWithCommas(this.y) + ' ' + myBindings.electricalUnit() + '</b>';
                                    if (idx < self.points.length - 1) {
                                        ret += '<br/>';
                                    }
                                });
                                return ret;
                            },
                        },
                        data: {
                            data: arrayOfData,
                            name: 'Demand'
                        },
                        type: 'column',
                        xAxis: {
                            allowDecimals: false
                        },
                        yAxisTitle: myBindings.electricalUnit(),
                        xValueFormatter: function(timestamp) {
                            var date = new Date(timestamp);
                            date.setHours(0);
                            date.setMinutes(0);
                            date.setSeconds(0);
                            date.setMilliseconds(0);
                            if (monthYear.period === "Year") {
                                date.setDate(15);
                            }
                            return date.getTime();
                        }
                    });
                }
            },
            renderConsumption: function (arrayOfData, printFormat) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    trendPlot,
                    maxValueVerbiage,
                    maxValue = myBindings.findMax(arrayOfData),
                    chartWidth = myBindings.getChartWidth(printFormat),
                    i,
                    $highestConsumptionPeriodChart = $(myBindings.$reportsContent).find(' .highestConsumptionPeriodChart');

                maxValueVerbiage = myBindings.formatHighestValueVerbiage(maxValue.value, maxValue.timeStamp, false);
                myBindings.highestConsumptionNow(maxValueVerbiage);

                if (arrayOfData) {
                    arrayOfData.sort(function (a, b) {
                        return (a.timeStamp > b.timeStamp) ? 1 : -1;
                    });
                }

                // Round it
                for (i = 0; i < arrayOfData; i++) {
                    arrayOfData[i].value = tou.toFixed(arrayOfData[i].value, myBindings.decimalPlaces());
                }

                if ($highestConsumptionPeriodChart.length > 0) {
                    trendPlot = new TrendPlot({
                        width: chartWidth,
                        height: 300,
                        target: $highestConsumptionPeriodChart,
                        y: 'value',
                        x: 'timeStamp',
                        highlightMax: true,
                        data: {
                            data: arrayOfData,
                            name: 'Consumption',
                            units: 'kWh'
                        },
                        type: 'column',
                        xAxis: {
                            allowDecimals: false
                        },
                        yAxisTitle: myBindings.electricalUnit() + "h",
                        xValueFormatter: function(timestamp) {
                            var date = new Date(timestamp);
                            date.setHours(0);
                            date.setMinutes(0);
                            date.setSeconds(0);
                            date.setMilliseconds(0);
                            if (monthYear.period === "Year") {
                                date.setDate(15);
                            }
                            return date.getTime();
                        }
                    });
                }
            },
            renderTemperatures: function (arrayOfData, printFormat) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    trendPlot,
                    titleVerbiage,
                    periodVerbiage = (myBindings.selectedMonthYear().childPeriod.toLowerCase() === "day" ? "Daily" : myBindings.selectedMonthYear().childPeriod + "ly"),
                    highestTempVerbiage,
                    lowestTempVerbiage,
                    chartWidth = myBindings.getChartWidth(printFormat),
                    $highlowTemperaturesPeriodChart = $(myBindings.$reportsContent).find(' .highlowTemperaturesPeriodChart');

                titleVerbiage = "High/Low " + periodVerbiage + " Temperatures - " + myBindings.selectedMonthYear().prettyDate;
                myBindings.temperatureTitle(titleVerbiage);

                if (arrayOfData && arrayOfData.trendPlotData.valid) {
                    if (arrayOfData.highestTemp.timeStamp !== null) {
                        myBindings.highestTemperatureNow({
                            value: (arrayOfData.highestTemp.value) ? tou.toFixed(arrayOfData.highestTemp.value, 1) : null,
                            timeStamp: arrayOfData.highestTemp.timeStamp
                        });
                        myBindings.lowestTemperatureNow({
                            value: (arrayOfData.lowestTemp.value) ? tou.toFixed(arrayOfData.lowestTemp.value, 1) : null,
                            timeStamp: arrayOfData.lowestTemp.timeStamp
                        });

                        highestTempVerbiage = "The high temperature on " + moment.unix(arrayOfData.highestTemp.timeStamp).format("dddd, MMMM Do YYYY") + " was " + (arrayOfData.highestTemp.value).toFixed(1) + " degrees. ";
                        lowestTempVerbiage = "The low temperature on " + moment.unix(arrayOfData.lowestTemp.timeStamp).format("dddd, MMMM Do YYYY") + " was " + (arrayOfData.lowestTemp.value).toFixed(1) + " degrees. ";
                    } else {
                        myBindings.highestTemperatureNow({
                            value: null,
                            timeStamp: null
                        });
                        myBindings.lowestTemperatureNow({
                            value: null,
                            timeStamp: null
                        });

                        highestTempVerbiage = "no data available";
                        lowestTempVerbiage = "no data available";
                    }


                    myBindings.highestTemperatureVerbiage(highestTempVerbiage);
                    myBindings.lowestTemperatureVerbiage(lowestTempVerbiage);

                    if (arrayOfData.trendPlotData.maxes) {
                        arrayOfData.trendPlotData.maxes.sort(function (a, b) {
                            return (a.timeStamp > b.timeStamp) ? 1 : -1;
                        });
                    }
                    if (arrayOfData.trendPlotData.mins) {
                        arrayOfData.trendPlotData.mins.sort(function (a, b) {
                            return (a.timeStamp > b.timeStamp) ? 1 : -1;
                        });
                    }

                    if ($highlowTemperaturesPeriodChart.length > 0) {
                        trendPlot = new TrendPlot({
                            width: chartWidth,
                            height: 300,
                            target: $highlowTemperaturesPeriodChart,
                            y: 'value',
                            x: 'timeStamp',
                            data: [{
                                data: arrayOfData.trendPlotData.maxes,
                                name: 'Max',
                                yAxis: 0
                            }, {
                                data: arrayOfData.trendPlotData.mins,
                                name: 'Min',
                                yAxis: 0
                            }],
                            type: 'line',
                            xAxis: {
                                allowDecimals: false
                            },
                            yAxisTitle: 'F'
                        });
                    }
                } else {
                    myBindings.$highlowTemperatures.hide();
                    myBindings.temperatureTitle("");
                    $highlowTemperaturesPeriodChart.html("");
                    myBindings.highestTemperatureVerbiage("");
                    myBindings.lowestTemperatureVerbiage("");
                    myBindings.temperatureVerbiageHDDCDD("");
                }
            },
            buildConsumptionArray: function (data) {
                if (data) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                        calculatedData = myBindings.buildOnOffSumArray(data, "sums", "sum");

                    myBindings.reportData["OffPeakConsumption"] = calculatedData.offPeakData;
                    myBindings.reportData["OnPeakConsumption"] = calculatedData.onPeakData;
                    myBindings.reportData["TotaledOnOffPeakConsumption"] = myBindings.totalOnOffPeak(myBindings.reportData["OnPeakConsumption"], myBindings.reportData["OffPeakConsumption"]);
                }
            },
            buildDemandAndReactiveArray: function (data) {
                if (data) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;

                    myBindings.parseDemandAndReactiveArrays(data);
                    myBindings.reportData["MaxForOnOffPeakDemandArray"] = myBindings.maxForOnOffPeak(myBindings.reportData["OnPeakDemand"], myBindings.reportData["OffPeakDemand"]);
                }
            },
            buildOnOffSumArray: function (data, arrayName, fieldName) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    onPeakData,
                    offPeakData;

                if (data) {
                    var monthYear = myBindings.selectedMonthYear(),
                        ts,
                        unitIndex,
                        i,
                        lenData = data.length,
                        dataRow,
                        sumData,
                        unitValue;

                    onPeakData = myBindings.initPeriodArray();
                    offPeakData = myBindings.initPeriodArray();
                    for (i = 0; i < lenData; i++) {
                        dataRow = data[i];
                        for (var index in dataRow.results[arrayName]) {
                            sumData = dataRow.results[arrayName][index];
                            if (!!sumData) {
                                unitValue = myBindings.adjustPrecision(sumData[fieldName]);
                                ts = moment(sumData.range.start * 1000);
                                unitIndex = (parseInt(moment(ts).format(monthYear.childFormatCode), 10) - 1);
                                if (dataRow.peak === "on") {
                                    onPeakData[unitIndex].timeStamp = (sumData.range.start * 1000);
                                    onPeakData[unitIndex].value = unitValue;
                                } else {
                                    offPeakData[unitIndex].timeStamp = (sumData.range.start * 1000);
                                    offPeakData[unitIndex].value = unitValue;
                                }
                            }
                        }
                    }
                }
                return {
                    onPeakData: onPeakData,
                    offPeakData: offPeakData
                };
            },
            parseDemandAndReactiveArrays: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    onPeakDemand,
                    offPeakDemand,
                    onPeakReactive,
                    offPeakReactive,
                    getTimeStamp = function (ts, endOfRange) {
                        // if the data exists in the last unit of the Period (back up one second)
                        if (ts === endOfRange) {
                            return (ts - 1) * 1000;
                        } else {
                            return (ts) * 1000;
                        }
                    },
                    validateArray = function (arrayOfData) {
                        var i,
                            len = arrayOfData.length,
                            arrayContainsOnlyNulls = true;
                        for (i = 0; i < len; i++) {
                            if (arrayOfData[i].value !== null) {
                                arrayContainsOnlyNulls = false;
                            }
                            arrayOfData[i].value = (arrayOfData[i].value === null) ? 0 : tou.toFixed(arrayOfData[i].value, myBindings.decimalPlaces());
                        }

                        return arrayOfData;
                    };

                if (data) {
                    var monthYear = myBindings.selectedMonthYear(),
                        i,
                        j,
                        dataRow,
                        itemData,
                        unitIndex,
                        childIndex,
                        demandTS,
                        reactiveTS;

                    onPeakDemand = myBindings.initPeriodArray();
                    offPeakDemand = myBindings.initPeriodArray();
                    onPeakReactive = myBindings.initPeriodArray();
                    offPeakReactive = myBindings.initPeriodArray();
                    for (i = 0; i < data.length; i++) {
                        dataRow = data[i];
                        for (j = 0; j < dataRow.results.length; j++) {
                            itemData = dataRow.results[j];
                            if (!!itemData.demand.max) {
                                demandTS = getTimeStamp(itemData.demand.timestamp, itemData.demand.range.end);
                                childIndex = moment(demandTS).format(monthYear.childFormatCode);
                                unitIndex = (parseInt(childIndex, 10) - 1);
                                if (dataRow.peak === "on") {
                                    onPeakDemand[unitIndex] = {
                                        timeStamp: demandTS,
                                        value: myBindings.adjustPrecision(itemData.demand.max)
                                    };
                                } else {
                                    offPeakDemand[unitIndex] = {
                                        timeStamp: demandTS,
                                        value: myBindings.adjustPrecision(itemData.demand.max)
                                    };
                                }
                            }
                            if (!!itemData.reactive.max) {
                                reactiveTS = getTimeStamp(itemData.reactive.timestamp, itemData.reactive.range.end);
                                childIndex = moment(reactiveTS).format(monthYear.childFormatCode);
                                unitIndex = (parseInt(childIndex, 10) - 1);
                                if (dataRow.peak === "on") {
                                    onPeakReactive[unitIndex] = {
                                        timeStamp: reactiveTS,
                                        value: myBindings.adjustPrecision(itemData.reactive.max)
                                    };
                                } else {
                                    offPeakReactive[unitIndex] = {
                                        timeStamp: reactiveTS,
                                        value: myBindings.adjustPrecision(itemData.reactive.max)
                                    };
                                }
                            }
                        }
                    }
                    onPeakDemand = validateArray(onPeakDemand);
                    offPeakDemand = validateArray(offPeakDemand);
                    onPeakReactive = validateArray(onPeakReactive);
                    offPeakReactive = validateArray(offPeakReactive);
                }
                myBindings.reportData["OnPeakDemand"] = onPeakDemand;
                myBindings.reportData["OffPeakDemand"] = offPeakDemand;
                myBindings.reportData["OnPeakReactive"] = onPeakReactive;
                myBindings.reportData["OffPeakReactive"] = offPeakReactive;
            },
            buildLastYearsConsumptionArray: function (data) {
                if (data) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                        calculatedData = myBindings.buildMetersTrendPlotArray(data);

                    myBindings.reportData["HighestConsumptionLastYear"] = myBindings.formatHighestValueVerbiage(calculatedData.highestValue.value, calculatedData.highestValue.timeStamp, false);
                }
            },
            buildLastYearsOnPeakDemandArray: function (data) {
                if (data && data.results.maxes) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                        maxes = data.results.maxes[0],
                        maxValue = myBindings.adjustPrecision(maxes.max);
                    myBindings.reportData["LastYearsOnPeakDemand"] = myBindings.formatHighestValueVerbiage(maxValue, (maxes.timestamp * 1000), true);
                }
            },
            buildLastYearsDemandArray: function (data) {
                if (data && data.results.maxes) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                        maxes = data.results.maxes[0],
                        maxValue = myBindings.adjustPrecision(maxes.max);
                    myBindings.reportData["LastYearsDemand"] = myBindings.formatHighestValueVerbiage(maxValue, (maxes.timestamp * 1000), true);
                }
            },
            buildTemperatureArray: function (data) {
                if (data) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;

                    myBindings.reportData["TemperatureData"] = myBindings.parseTemperatureArray(data);
                }
            },
            setCddAndHddVerbiage: function (error) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    hddcddVerbiage;
                if (error === undefined) {
                    if (myBindings.reportData["HddValue"] === null || myBindings.reportData["CddValue"] === null) {
                        hddcddVerbiage = "";
                    } else {
                        hddcddVerbiage = "There were " + tou.numberWithCommas(tou.toFixed(myBindings.reportData["CddValue"], 0)) + " CDD and ";
                        hddcddVerbiage += tou.numberWithCommas(tou.toFixed(myBindings.reportData["HddValue"], 0)) + " HDD in this ";
                        hddcddVerbiage += myBindings.selectedMonthYear().period + '.';
                    }
                } else {
                    hddcddVerbiage = "   * " + error.replace(".", "") + " for CDD/HDD *  ";
                }
                myBindings.temperatureVerbiageHDDCDD(hddcddVerbiage);
            },
            setCDDValue: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                if (data && data.error === undefined) {
                    myBindings.reportData["CddValue"] = data.results.sums[0].sum;
                    myBindings.setCddAndHddVerbiage();
                } else if (data.error) {
                    myBindings.reportData["CddValue"] = data.error;
                    myBindings.setCddAndHddVerbiage(data.error);
                }
            },
            setHDDValue: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                if (data && data.error === undefined) {
                    myBindings.reportData["HddValue"] = data.results.sums[0].sum;
                    myBindings.setCddAndHddVerbiage();
                } else if (data.error) {
                    myBindings.reportData["HddValue"] = data.error;
                    myBindings.setCddAndHddVerbiage(data.error);
                }
            },
            buildMetersTrendPlotArray: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = this.selectedMonthYear(),
                    dataRow = data.results,
                    dataItem,
                    unitIndex,
                    arrayName,
                    nodeName,
                    index,
                    trendPlotData = myBindings.initPeriodArray(),
                    highestValue = {
                        value: 0,
                        timeStamp: null
                    },
                    rollUpResult = function (node, resultValue, timeStamp) {
                        if (!!node) {
                            if (!!timeStamp) {
                                node.timeStamp = timeStamp * 1000;
                                node.value += myBindings.adjustPrecision(resultValue);
                            }
                        }
                    };

                if (data.fx === "max") {
                    arrayName = "maxes";
                    nodeName = "max";
                } else if (data.fx === "sum") {
                    arrayName = "sums";
                    nodeName = "sum";
                }

                for (index in dataRow[arrayName]) {
                    dataItem = dataRow[arrayName][index];
                    if (!!dataItem) {
                        if (dataItem[nodeName] !== undefined) {
                            unitIndex = (parseInt(moment.unix(dataItem.range.start).format(monthYear.childFormatCode), 10) - 1);
                            rollUpResult(trendPlotData[unitIndex], dataItem[nodeName], dataItem.range.start);
                        }
                    }
                }

                // tally up results.. and round it
                for (unitIndex = 0; unitIndex < trendPlotData.length; unitIndex++) {
                    if (highestValue.value < trendPlotData[unitIndex].value) {
                        highestValue.value = tou.toFixed(trendPlotData[unitIndex].value, myBindings.decimalPlaces());
                        highestValue.timeStamp = trendPlotData[unitIndex].timeStamp;
                    }
                    trendPlotData[unitIndex].value = tou.toFixed(trendPlotData[unitIndex].value, myBindings.decimalPlaces());
                }

                return {
                    trendPlotData: trendPlotData,
                    highestValue: highestValue
                };
            },
            buildMissingDataArray: function (data) {
                if (data.results) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                        i,
                        summedData = $.extend(true, [], myBindings.listOfMeters()),
                        missingData = [],
                        meter,
                        rowOfMissingData,
                        meterPointUPI,
                        lenResult = data.results.missingPercentage.length,
                        maxPossibleSumOfPercentage = summedData.length * 100,
                        totalMissingPercentage = 0;

                    for (i = 0; i < lenResult; i++) {
                        rowOfMissingData = data.results.missingPercentage[i];
                        meterPointUPI = rowOfMissingData.upis[0]; // snag first UPI to find related meter
                        meter = summedData[myBindings.meterIndexArray[meterPointUPI].meterIndex];
                        meter.missingPercentage = parseFloat(tou.toFixed(rowOfMissingData.missingPercentage, 2)).toFixed(2);
                        totalMissingPercentage += rowOfMissingData.missingPercentage;
                    }

                    for (i = 0; i < summedData.length; i++) {
                        if (summedData[i].missingPercentage !== undefined && summedData[i].missingPercentage > 0) {
                            if (summedData[i].missingPercentage > 0) {
                                delete summedData[i]["meterPoints"]; // not needed for reporting
                                missingData.push(summedData[i]);
                            }
                        }
                    }

                    myBindings.reportData["MissingMeterData"] = missingData;
                    myBindings.reportData["PercentageMissingMeterData"] = ((maxPossibleSumOfPercentage - totalMissingPercentage) / maxPossibleSumOfPercentage) * 100;
                }
            },
            parseTemperatureArray: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    trendPlotData,
                    highestTemp,
                    lowestTemp,
                    results;

                if (data.error === undefined) {
                    var i,
                        maxMinData,
                        childIndex,
                        unitIndex,
                        monthYear = myBindings.selectedMonthYear(),
                        lenResult = data.results.tempRanges.length,
                        maxes = myBindings.initPeriodArray(),
                        mins = myBindings.initPeriodArray();

                    highestTemp = {
                        value: null,
                        timeStamp: null
                    };
                    lowestTemp = {
                        value: null,
                        timeStamp: null
                    };
                    trendPlotData = {
                        valid: false,
                        maxes: maxes,
                        mins: mins
                    };

                    for (i = 0; i < lenResult; i++) {
                        maxMinData = data.results.tempRanges[i];
                        childIndex = moment(maxMinData.range.start * 1000).format(monthYear.childFormatCode);
                        unitIndex = (parseInt(childIndex, 10) - 1);
                        maxes[unitIndex].value = ($.isNumeric(maxMinData.max)) ? tou.toFixed(maxMinData.max, 2) : null;
                        maxes[unitIndex].timeStamp = maxMinData.range.start * 1000;
                        mins[unitIndex].value = ($.isNumeric(maxMinData.min)) ? tou.toFixed(maxMinData.min, 2) : null;
                        mins[unitIndex].timeStamp = maxMinData.range.start * 1000;
                        if (maxes[unitIndex].value !== null || mins[unitIndex].value !== null) {
                            trendPlotData.valid = true;
                        }
                    }

                    $.each(maxes, function (key, temperature) {
                        if (temperature.value > highestTemp.value || highestTemp.value === null) {
                            highestTemp.value = tou.toFixed(temperature.value, 1);
                            highestTemp.timeStamp = temperature.timeStamp / 1000;
                        }
                    });

                    $.each(mins, function (key, temperature) {
                        if (temperature.value < lowestTemp.value || lowestTemp.value === null) {
                            lowestTemp.value = tou.toFixed(temperature.value, 1);
                            lowestTemp.timeStamp = temperature.timeStamp / 1000;
                        }
                    });

                    myBindings.temperatureCollection(trendPlotData);
                    results = {
                        trendPlotData: trendPlotData,
                        highestTemp: highestTemp,
                        lowestTemp: lowestTemp
                    };
                } else {
                    //result = data; // this would house error message from backend
                    myBindings.temperatureCollection(null);
                    results = null;
                }

                return results;
            },
            buildMetersReportArray: function (data) {
                if (data) {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                        i,
                        summedData,
                        meter,
                        lenData = data.length,
                        lenSumData,
                        dataRow,
                        sumData,
                        unitValue;

                    summedData = $.extend(true, [], myBindings.listOfMeters());
                    lenSumData = summedData.length;
                    for (i = 0; i < lenSumData; i++) { // initialize placeholders
                        meter = summedData[i];
                        meter.onPeakSum = 0;
                        meter.offPeakSum = 0;
                    }
                    summedData[lenSumData] = { // create a totals row at the end of the data
                        displayedMeterName: "Totals",
                        offPeakSum: 0,
                        onPeakSum: 0
                    };

                    for (i = 0; i < lenData; i++) {
                        dataRow = data[i];

                        for (var meterPointUPI in dataRow.results.sums) {
                            meterPointUPI = parseInt(meterPointUPI, 10);
                            meter = summedData[myBindings.meterIndexArray[meterPointUPI].meterIndex];
                            sumData = dataRow.results.sums[meterPointUPI];
                            if (!!sumData) {
                                unitValue = ((myBindings.electricalUnit() === "kW") ? sumData.sum * 1000 : sumData.sum);
                                if (dataRow.peak === "on") {
                                    meter.onPeakSum = unitValue;
                                    summedData[lenSumData].onPeakSum += unitValue; // for last row in table  "Totals"
                                } else {
                                    meter.offPeakSum = unitValue;
                                    summedData[lenSumData].offPeakSum += unitValue; // for last row in table  "Totals"
                                }
                            }
                        }
                    }

                    // Round it
                    for (i = 0; i < summedData.length; i++) {
                        delete summedData[i].meterPoints;
                        summedData[i].onPeakSum = tou.toFixed(summedData[i].onPeakSum, (myBindings.electricalUnit() === "kW") ? 1 : 3);
                        summedData[i].offPeakSum = tou.toFixed(summedData[i].offPeakSum, (myBindings.electricalUnit() === "kW") ? 1 : 3);
                    }
                    myBindings.reportData["IndividualMeterData"] = summedData;
                }
            },
            parseReturnedData: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    len = this.activeDataRequests.length,
                    lenData = data.length,
                    i,
                    j,
                    matchingRequestData;

                myBindings.reportData = {};
                if (lenData > 0) {
                    for (j = 0; j < len; j++) {
                        matchingRequestData = [];
                        for (i = 0; i < lenData; i++) {
                            delete data[i].upis; // trimming data
                            if (myBindings.activeDataRequests[j].touid === data[i].touid.split('-')[0]) {
                                matchingRequestData.push(data[i]);
                            }
                        }
                        if (matchingRequestData.length > 0) {
                            this.$page.blockUI(true);
                            //console.log(" - - - myBindings.activeDataRequests[" + j + "] = ", myBindings.activeDataRequests[j].fx.prototype);
                            if (matchingRequestData.length === 1) {
                                myBindings.activeDataRequests[j].fx(matchingRequestData[0]);
                            } else {
                                myBindings.activeDataRequests[j].fx(matchingRequestData);
                            }
                        }
                    }

                    if (!!matchingRequestData &&  matchingRequestData.length > 0) {
                        myBindings.renderCompleteReport();
                        if (myBindings.dataRequestTimer) {
                            clearTimeout(myBindings.dataRequestTimer);
                            myBindings.dataRequestTimer = null;
                        }
                        this.$page.blockUI(false);
                        myBindings.activeDataRequests = [];
                        myBindings.activeDataRequest(false);
                    }
                } else {
                    tou.alert("no data returned from request");
                }
            },
            buildMissingDataRequestObject: function (startDay, endDay, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    listOfUPIs = [],
                    rowOfUPIs,
                    options,
                    meters = myBindings.listOfMeters(),
                    meter,
                    consumptionMeterPoint,
                    demandMeterPoint,
                    reactiveMeterPoint,
                    i,
                    lenMeters = meters.length;

                for (i = 0; i < lenMeters; i++) {
                    meter = meters[i];
                    rowOfUPIs = [];
                    consumptionMeterPoint = tou.retrieveMeterPoint(meter, "Consumption");
                    demandMeterPoint = tou.retrieveMeterPoint(meter, "Demand");
                    reactiveMeterPoint = tou.retrieveMeterPoint(meter, "Reactive");
                    if (consumptionMeterPoint.upi && consumptionMeterPoint.upi > 0) {
                        rowOfUPIs.push(consumptionMeterPoint.upi);
                    }
                    if (demandMeterPoint.upi && demandMeterPoint.upi > 0) {
                        rowOfUPIs.push(demandMeterPoint.upi);
                    }
                    if (reactiveMeterPoint.upi && reactiveMeterPoint.upi > 0) {
                        rowOfUPIs.push(reactiveMeterPoint.upi);
                    }

                    if (rowOfUPIs.length > 0) {
                        listOfUPIs.push(rowOfUPIs);
                    }
                }

                if (listOfUPIs.length > 0) {
                    options = [];
                    options.push({
                        touid: touID,
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: moment(startDay).unix(),
                            end: moment(endDay).unix()
                        },
                        scale: monthYear.period.toLowerCase(),
                        fx: "missingPercentage",
                        upis: listOfUPIs
                    });
                }

                return options;
            },
            buildMeterPointRequestObject: function (startDay, endDay, fiscalYear, meterPointDesc, functionType, peak, scale, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    meters = myBindings.listOfMeters(),
                    meter,
                    meterPoint,
                    i,
                    options,
                    listOfUPIs = [],
                    lenMeters = meters.length;


                for (i = 0; i < lenMeters; i++) {
                    meter = meters[i];
                    meterPoint = tou.retrieveMeterPoint(meter, meterPointDesc);
                    if (meterPoint.upi && meterPoint.upi > 0) {
                        listOfUPIs.push(meterPoint.upi);
                    }
                }

                if (listOfUPIs.length > 0) {
                    options = [];
                    options.push({
                        touid: touID,
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: startDay.unix(),
                            end: endDay.unix()
                        },
                        fiscalYear: fiscalYear,
                        type: meterPointDesc,
                        scale: scale,
                        fx: functionType,
                        upis: listOfUPIs
                    });

                    if (peak === "on" || peak === "off") {
                        options[0].peak = peak;
                    }
                }

                return options;
            },
            buildMeterPointOnOffRequestObject: function (startDay, endDay, meterPointDesc, functionType, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    listOfUPIs = [],
                    options,
                    meters = myBindings.listOfMeters(),
                    meter,
                    meterPoint,
                    i,
                    lenMeters = meters.length;

                for (i = 0; i < lenMeters; i++) {
                    meter = meters[i];
                    meterPoint = tou.retrieveMeterPoint(meter, meterPointDesc);
                    if (meterPoint.upi && meterPoint.upi > 0) {
                        listOfUPIs.push(meterPoint.upi);
                    }
                }

                if (listOfUPIs.length > 0) {
                    options = [];
                    options.push({
                        touid: touID + "-1",
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: startDay.unix(),
                            end: endDay.unix()
                        },
                        fiscalYear: monthYear.fiscalYear,
                        type: meterPointDesc,
                        scale: (monthYear.childPeriod).toLowerCase(),
                        fx: functionType,
                        upis: listOfUPIs,
                        peak: 'on'
                    });
                    options.push({
                        touid: touID + "-2",
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: startDay.unix(),
                            end: endDay.unix()
                        },
                        fiscalYear: monthYear.fiscalYear,
                        type: meterPointDesc,
                        scale: (monthYear.childPeriod).toLowerCase(),
                        fx: functionType,
                        upis: listOfUPIs,
                        peak: 'off'
                    });
                }
                return options;
            },
            buildReactiveRequestObject: function (startDay, endDay, scale, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    listOfReactiveUPIs = [],
                    listOfDemandUPIs = [],
                    options,
                    meters = myBindings.listOfMeters(),
                    meter,
                    demandMeterPoint,
                    reactiveMeterPoint,
                    i,
                    lenMeters = meters.length;

                for (i = 0; i < lenMeters; i++) {
                    meter = meters[i];
                    demandMeterPoint = tou.retrieveMeterPoint(meter, "Demand");
                    reactiveMeterPoint = tou.retrieveMeterPoint(meter, "Reactive");

                    if (demandMeterPoint.upi && demandMeterPoint.upi > 0) {
                        listOfDemandUPIs.push(demandMeterPoint.upi);
                    }
                    if (reactiveMeterPoint.upi && reactiveMeterPoint.upi > 0) {
                        listOfReactiveUPIs.push(reactiveMeterPoint.upi);
                    }
                }
                if (listOfDemandUPIs.length > 0 && listOfReactiveUPIs.length > 0) {
                    options = [];
                    options.push({
                        touid: touID + "-1",
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: startDay.unix(),
                            end: endDay.unix()
                        },
                        upis: listOfDemandUPIs,
                        secondUpis: listOfReactiveUPIs,
                        type: 'demand',
                        fiscalYear: monthYear.fiscalYear,
                        scale: scale,
                        peak: "on",
                        fx: "reactiveCharge"
                    });
                    options.push({
                        touid: touID + "-2",
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: startDay.unix(),
                            end: endDay.unix()
                        },
                        upis: listOfDemandUPIs,
                        secondUpis: listOfReactiveUPIs,
                        type: 'demand',
                        fiscalYear: monthYear.fiscalYear,
                        scale: scale,
                        peak: "off",
                        fx: "reactiveCharge"
                    });
                }

                return options;
            },
            buildMetersTotalsRequestObject: function (startDay, endDay, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    listOfUPIs = [],
                    options,
                    meters = myBindings.listOfMeters(),
                    meter,
                    meterPoint,
                    i,
                    lenMeters = meters.length;

                for (i = 0; i < lenMeters; i++) {
                    meter = meters[i];
                    meterPoint = tou.retrieveMeterPoint(meter, "Consumption");
                    if (meterPoint.upi && meterPoint.upi > 0) {
                        listOfUPIs.push(meterPoint.upi);
                    }
                }

                if (listOfUPIs.length > 0) {
                    options = [];
                    options.push({
                        touid: touID + "-1",
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: startDay.unix(),
                            end: endDay.unix()
                        },
                        fiscalYear: monthYear.fiscalYear,
                        type: "consumption",
                        scale: monthYear.period.toLowerCase(),
                        fx: 'sum',
                        splitUpis: true,
                        upis: listOfUPIs,
                        peak: 'on'
                    });

                    options.push({
                        touid: touID + "-2",
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            start: startDay.unix(),
                            end: endDay.unix()
                        },
                        fiscalYear: monthYear.fiscalYear,
                        type: "consumption",
                        scale: monthYear.period.toLowerCase(),
                        fx: 'sum',
                        splitUpis: true,
                        upis: listOfUPIs,
                        peak: 'off'
                    });
                }

                return options;
            },
            buildTemperaturesRequestObject: function (startDay, endDay, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    options = [];

                options.push({
                    touid: touID,
                    utilityName: tou.currUtility.utilityName,
                    range: {
                        start: startDay.unix(),
                        end: endDay.unix()
                    },
                    scale: (monthYear.childPeriod).toLowerCase(),
                    fx: 'tempRange',
                    upis: [tou.weatherPoints.OAT]
                });

                return options;
            },
            buildCDDRequestObject: function (startDay, endDay, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    options = [];
                options.push({
                    touid: touID,
                    utilityName: tou.currUtility.utilityName,
                    range: {
                        start: startDay.unix(),
                        end: endDay.unix()
                    },
                    scale: (monthYear.period).toLowerCase(),
                    fx: 'weather',
                    upis: [tou.weatherPoints.CDD]
                });
                return options;
            },
            buildHDDRequestObject: function (startDay, endDay, touID) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    monthYear = myBindings.selectedMonthYear(),
                    options = [];
                options.push({
                    touid: touID,
                    utilityName: tou.currUtility.utilityName,
                    range: {
                        start: startDay.unix(),
                        end: endDay.unix()
                    },
                    scale: (monthYear.period).toLowerCase(),
                    fx: 'weather',
                    upis: [tou.weatherPoints.HDD]
                });
                return options;
            },
            getData: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                if (myBindings.selectedMonthYear() !== "" && myBindings.listOfMeters().length > 0) {
                    myBindings.startTime = moment();
                    this.$page.blockUI(true);
                    var monthYear = this.selectedMonthYear(),
                        monthYearPeriod = monthYear.period.toLowerCase(),
                        startDay = moment(monthYear.start).startOf("month").startOf("day"),
                        lastYearStartDay = moment(startDay).subtract(1, "year"),
                        endDay = moment(monthYear.end).startOf("month").startOf("day"),
                        lastYearEndDay = moment(lastYearStartDay).add(1, monthYear.period.toLowerCase()),
                        reqObj,
                        timerDuration = 0,
                        options = [];

                    myBindings.initGridData();
                    if (myBindings.dataRequestTimer) {
                        clearTimeout(myBindings.dataRequestTimer);
                        myBindings.dataRequestTimer = null;
                    }
                    myBindings.activeDataRequests = [];

                    reqObj = myBindings.buildMeterPointRequestObject(lastYearStartDay, lastYearEndDay, (monthYear.fiscalYear - 1), "demand", "max", "on", monthYear.period.toLowerCase(), tou.makeId());
                    if (reqObj) {
                        options.push.apply(options, reqObj);
                        myBindings.activeDataRequests.push({
                            fx: myBindings.buildLastYearsOnPeakDemandArray,
                            touid: reqObj[0].touid
                        });
                    }

                    reqObj = myBindings.buildMeterPointRequestObject(lastYearStartDay, lastYearEndDay, (monthYear.fiscalYear - 1), "demand", "max", "na", monthYear.period.toLowerCase(), tou.makeId());
                    if (reqObj) {
                        options.push.apply(options, reqObj);
                        myBindings.activeDataRequests.push({
                            fx: myBindings.buildLastYearsDemandArray,
                            touid: reqObj[0].touid
                        });
                    }

                    reqObj = myBindings.buildMeterPointOnOffRequestObject(startDay, endDay, "consumption", "sum", tou.makeId());
                    if (reqObj) {
                        options.push.apply(options, reqObj);
                        myBindings.activeDataRequests.push({
                            fx: myBindings.buildConsumptionArray,
                            touid: reqObj[0].touid.split('-')[0]
                        });
                    }

                    reqObj = myBindings.buildMeterPointRequestObject(lastYearStartDay, lastYearEndDay, (monthYear.fiscalYear - 1), "consumption", "sum", "na", monthYear.childPeriod.toLowerCase(), tou.makeId());
                    if (reqObj) {
                        options.push.apply(options, reqObj);
                        myBindings.activeDataRequests.push({
                            fx: myBindings.buildLastYearsConsumptionArray,
                            touid: reqObj[0].touid
                        });
                    }

                    reqObj = myBindings.buildTemperaturesRequestObject(startDay, endDay, tou.makeId());
                    options.push.apply(options, reqObj);
                    myBindings.activeDataRequests.push({
                        fx: myBindings.buildTemperatureArray,
                        touid: reqObj[0].touid
                    });

                    reqObj = myBindings.buildCDDRequestObject(startDay, endDay, tou.makeId());
                    options.push.apply(options, reqObj);
                    myBindings.activeDataRequests.push({
                        fx: myBindings.setCDDValue,
                        touid: reqObj[0].touid
                    });

                    reqObj = myBindings.buildHDDRequestObject(startDay, endDay, tou.makeId());
                    options.push.apply(options, reqObj);
                    myBindings.activeDataRequests.push({
                        fx: myBindings.setHDDValue,
                        touid: reqObj[0].touid
                    });

                    reqObj = myBindings.buildMissingDataRequestObject(startDay, endDay, tou.makeId());
                    if (reqObj) {
                        options.push.apply(options, reqObj);
                        myBindings.activeDataRequests.push({
                            fx: myBindings.buildMissingDataArray,
                            touid: reqObj[0].touid
                        });
                    }

                    reqObj = myBindings.buildReactiveRequestObject(startDay, endDay, monthYear.childPeriod.toLowerCase(), tou.makeId());
                    if (reqObj) {
                        options.push.apply(options, reqObj);
                        myBindings.activeDataRequests.push({
                            fx: myBindings.buildDemandAndReactiveArray,
                            touid: reqObj[0].touid.split('-')[0]
                        });
                    }

                    reqObj = myBindings.buildMetersTotalsRequestObject(startDay, endDay, tou.makeId());
                    if (reqObj) {
                        options.push.apply(options, reqObj);
                        myBindings.activeDataRequests.push({
                            fx: myBindings.buildMetersReportArray,
                            touid: reqObj[0].touid.split('-')[0]
                        });
                    }

                    if (options.length > 0) {
                        if (tou.socket) {
                            myBindings.activeDataRequest(true);
                            tou.socket.emit("getUsage", {options: options});

                            if (monthYearPeriod === 'month') {
                                timerDuration = 10000;  // 10 seconds
                            } else {
                                timerDuration = 200000; // 200 seconds
                            }

                            myBindings.dataRequestTimer = setTimeout(function () {
                                myBindings.$reportsContent.hide();
                                myBindings.$reportsGettingData.hide();
                                myBindings.$topBarControls.attr('disabled', false);
                                tou.alert("Report request timed out");
                            }, (timerDuration));
                        }
                    } else {
                        tou.alert("no options were set for Report request");
                    }
                }
            },
            monthSelected: function (selectedDate) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings,
                    startDay = moment(selectedDate.start),
                    endDay = moment(selectedDate.end);

                myBindings.numberOfDaysInCurrentPeriod = tou.toFixed(moment.duration(endDay.diff(startDay)).asDays(), 0);
                myBindings.selectedMonthYear(selectedDate);
                if (myBindings.selectedReportsMode() !== "") {
                    myBindings.koGridReportCollection([]);
                    if (!!selectedDate.isReportCommitted && selectedDate.isReportCommitted()) {
                        myBindings.reportData = myBindings.$page.committedReports[selectedDate.fullDate];
                        if (!!myBindings.reportData) {
                            myBindings.initGridData();
                            myBindings.renderCompleteReport();
                        } else {
                            myBindings.$reportsContent.html("No data found for committed report '" + selectedDate.fullDate + "'");
                        }
                    } else {
                        myBindings.getData();
                    }
                }
            },
            modeSelected: function (selectedMode) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].reportsBindings;
                myBindings.selectedReportsMode(selectedMode);

                switch (selectedMode) {
                    case "Chart":
                        myBindings.$reportsChartsContent.show();
                        myBindings.$reportsGridContent.hide();
                        break;
                    case "Grid":
                        myBindings.$reportsChartsContent.hide();
                        myBindings.$reportsGridContent.show();
                        break;
                    default:
                        break;
                }
            }
        },
        computedBindings: {
            filteredReportMonthYear: function () {
                var self = this,
                    filter = self.reportDateFilter().toLowerCase(),
                    listOfDates = self.$page.listOfMonthYears();

                if (filter === "") {
                    return listOfDates;
                } else {
                    return ko.utils.arrayFilter(listOfDates, function (dateObj) {
                        return dateObj.searchDate.toLowerCase().indexOf(filter) > -1;
                    });
                }
            }
        }
    }, {
        title: 'Rate Table',
        shortTitle: 'ratetable',
        isActive: ko.observable(false),
        background: 'woodbackgroundtile.jpg',
        rateTables: {},
        titles: {},
        delayLoad: true,
        rateTableTemplate: {
            'Additional Off Peak Days': {
                order: 0
            }
        },
        getRateTableTemplate: function (year) {
            var template = this.rateTableTemplate;

            template['Fiscal Year'] = year;

            return template;
        },
        clearRateTables: function () {
            this.rateTables = {};
            this.bindings.holidays([]);
            this.bindings.rateTables([]);
        },
        getRateTable: function (touid) {
            return this.rateTables[touid];
        },
        getRateTableByTitle: function (title) {
            var self = this,
                ret;

            tou.forEach(self.rateTables, function (table, tableName) {
                if (table.title === title) {
                    ret = table;
                    return false;
                }
            });

            return ret;
        },
        getTitle: function (type) {
            this.titles[type] = this.titles[type] || 0;

            return type.capFirst();
        },
        loadYear: function (year) {
            var self = this,
                tables = self.previousYears[year];

            self.createRateTables(tables);
        },
        deleteHoliday: function (data) {
            var oldName = data.oldName,
                self = this;

            tou.forEachArray(self.bindings.holidays(), function (holiday, idx) {
                if (holiday.name() === oldName) {
                    self.bindings.holidays.splice(idx, 1);
                    return false;
                }
            });
        },
        addNewHoliday: function (data) {
            var self = this;
            data.date = moment(data.date).format(tou.dateFormat);

            if (!data.isUpdate) {
                tou.currUtility.RateTables['Additional Off Peak Days'][data.name] = data.date;
                data.name = ko.observable(data.name);
                data.date = ko.observable(data.date);
                self.bindings.holidays.push(data);
            } else {
                tou.forEach(self.bindings.holidays(), function (holiday, idx) {
                    if (holiday.name() === data.oldName) {
                        holiday.name(data.name);
                        holiday.date(data.date);
                        return false;
                    }
                });
                self.bindings.holidays.valueHasMutated();
                tou.currUtility.RateTables['Additional Off Peak Days'][data.name] = data.date;
                delete tou.currUtility.RateTables['Additional Off Peak Days'][data.oldName];
            }
        },
        addNewRatePeriod: function (data) {
            var currRateTable = this.bindings.currRateTable(),
                rateTable = this.getRateTable(currRateTable.touid),
                rates = currRateTable.rates(),
                ret,
                dateFormat = tou.dateFormat,
                from = moment(data.dateFrom),
                to = moment(data.dateTo);

            ret = {
                start: {
                    date: from.format(dateFormat)
                },
                end: {
                    date: to.format(dateFormat)
                },
                rangeType: data.season,
                title: data.seasonName || this.getTitle(data.season),
                days: [],
                rates: {},
                enablePeakSelection: data.enablePeakSelection || false
            };

            // if (data.season !== 'transition') {
                tou.forEachArray(tou.fullDayList, function (day, idx) {
                    if (data['day' + day]) {
                        ret.days.push(tou.shortDayList[idx]);
                    }
                });
                ret.start.peak = parseInt(data.timeFrom.replace(':', ''), 10);
                ret.end.peak = parseInt(data.timeTo.replace(':', ''), 10);
            // }

            if (!data.isUpdate) {
                if (!ret.touid) {
                    ret.touid = tou.makeId();
                }
                tou.forEachArray(rates, function (rate) {
                    var name = rate.name();
                    ret.rates[name] = ko.observable();
                });
            }

            rateTable.addNewPeriod(ret, data.isUpdate, data.periodIdx);
        },
        deletePeriod: function (data) {
            var idx = data.periodIdx,
                currRateTable = this.bindings.currRateTable(),
                rateTable = this.getRateTable(currRateTable.touid);

            rateTable.deletePeriod(idx);
        },
        deleteRate: function (data) {
            var idx = data.rateIdx,
                currRateTable = this.bindings.currRateTable(),
                rateTable = this.getRateTable(currRateTable.touid);

            rateTable.deleteRate(idx);
        },
        addNewRateElement: function (data) {
            var currRateTable = this.bindings.currRateTable(),
                rateTable = this.getRateTable(currRateTable.touid),
                cfg = rateTable.cfg,
                rates = currRateTable.rates(),
                periods = currRateTable.periods(),
                rate = {
                    name: ko.observable(data.rateName),
                    type: ko.observable(data.type),
                    qualifier: ko.observable(data.rateQualifier),
                    peak: ko.observable(data.peak),
                    threshold: ko.observable(data.threshold),
                    qualifierDemand: ko.observable(data.qualifierDemand)
                };

            rateTable.addRate(rate, data.isUpdate, data.rateIdx);
        },
        addNewFiscalYear: function (data) {
            var self = this,
                currYearData = $.extend(true, {}, tou.currUtility.RateTables),
                currYear = currYearData['Fiscal Year'],
                yearToCopy = parseInt(data.yearToCopy, 10),
                copyData = data.copyData,
                newFiscalYear = parseInt(data.year, 10),
                newYearData,
                yearDiff = newFiscalYear - yearToCopy,
                updateYear = function(date) {
                    var dateSplit = date.split('-'),
                        year = parseInt(dateSplit.pop(), 10);

                    year += yearDiff;

                    dateSplit.push(year);

                    return dateSplit.join('-');
                },
                processYear = function() {
                    tou.forEach(newYearData, function(table, tableName) {
                        if (tableName === 'Additional Off Peak Days') {
                            tou.forEach(table, function(date, holiday) {
                                if (holiday !== 'order') {//skips 'order'
                                    table[holiday] = updateYear(date);
                                }
                            });
                        } else if (tableName === 'Fiscal Year') {
                            newYearData['Fiscal Year'] = table + yearDiff;
                        } else {
                            tou.forEachArray(table.periods, function(period) {
                                period.end.date = updateYear(period.end.date);
                                period.start.date = updateYear(period.start.date);
                            });
                        }
                    });
                };



            self.bindings.latestYear(newFiscalYear);
            self.bindings.currFiscalYear(newFiscalYear);

            self.bindings.previousYears.unshift(newFiscalYear);

            self.createYearDropdown(self.previousYears);

            tou.currUtility.PreviousRateTables[currYear] = currYearData;

            if (copyData) {
                if (yearToCopy !== currYear) {
                    newYearData = $.extend(true, {}, tou.currUtility.PreviousRateTables[yearToCopy]);
                } else {
                    newYearData = $.extend(true, {}, currYearData);
                }
            } else {
                newYearData = $.extend(true, {}, self.getRateTableTemplate(newFiscalYear));
            }

            if (data.copyData) {
                processYear();
            }

            self.previousYears[newFiscalYear] = newYearData;
            tou.currUtility.RateTables = newYearData;
            self.createRateTables(newYearData);
        },
        createAndAddRateTable: function (cfg, haltBinding) {
            var newTable;

            cfg._page = this;

            newTable = new this.RateTable(cfg);

            this.rateTables[newTable.touid] = newTable;

            if (!haltBinding) {
                this.bindings.rateTables.push(newTable.getBindings());
            }

            return newTable;
        },
        RateTable: function (cfg) {
            var self = this,
                touid = tou.makeId(),
                page = cfg._page,
                childTables = [],
                rates = $.extend(true, [], cfg.rates || []),
                periods = $.extend(true, [], cfg.periods || []),
                qualifier = cfg.qualifier || '',
                rawCfg = cfg.cfg || {
                    rates: rates || [],
                    periods: periods || [],
                    parentTable: cfg.parentTable || null
                },
                rawPeriods = rawCfg.periods || [],
                title = cfg.title,
                modifierQueue = [],
                parentTableID,
                observableRates,
                observablePeriods = ko.mapping.fromJS($.extend(true, [], periods)),
                processRate = function(rate) {
                    var showInTransition = true;

                    if (rate.type === 'demand' || rate.type === 'consumption') {
                        if (rate.peak === 'on') {
                            showInTransition = false;
                        }
                    }

                    rate.touid = rate.touid || tou.makeId();

                    rate.showInTransition = showInTransition;
                };

            tou.forEachArray(rates, processRate);

            tou.forEachArray(rawPeriods, function (period) {
                period.touid = period.touid || tou.makeId();
            });

            observableRates = ko.mapping.fromJS($.extend(true, [], rates));

            self = $.extend(self, {
                parentTable: null,
                touid: touid,
                rawPeriods: rawPeriods,
                rawRates: rates,
                title: title,

                observablePeriods: observablePeriods,
                observableRates: observableRates,

                hidePeakInfo: rawCfg.hidePeakInfo || false,

                cfg: rawCfg,

                getBindings: function () {
                    var bindings = {
                        rates: observableRates,
                        periods: observablePeriods,
                        title: ko.observable(title),
                        touid: touid,
                        modifierQueue: modifierQueue,
                        hidePeakInfo: ko.observable(self.hidePeakInfo),
                        isChild: ko.observable(self.parentTable !== null)
                    };

                    self.bindings = bindings;
                    return bindings;
                },

                syncPositionsToKnockout: function () {
                    var ret = [];

                    tou.forEachArray(observableRates(), function(rate) {
                        tou.forEachArray(self.rawRates, function(rawRate) {
                            if (rawRate.name === rate.name()) {
                                ret.push(rawRate);
                                return false;
                            }
                        });
                    });

                    self.rawRates = ret;
                    rawCfg.rates = ret;//should be removed
                    //in case we have to sync other arrays
                    // self.syncJStoKOarray(rawCfg.rates, observableRates);
                },

                getExportConfig: function () {
                    var parentTitle = self.parentTable && self.parentTable.title;

                    tou.forEachArray(observablePeriods(), function (period, idx) {
                        var rates = self.rawPeriods[idx].rates;

                        tou.forEach(period.rates, function (rate, rateName) {
                            rates[rateName] = parseFloat(rate());
                        });
                    });

                    self.syncPositionsToKnockout();
                    title = self.title;
                    rawCfg.title = title;
                    rawCfg.parentTable = parentTitle;
                    rawCfg.rates = self.rawRates;
                    rawCfg.hidePeakInfo = self.hidePeakInfo;

                    return rawCfg;
                },

                destroy: function () {
                    tou.forEachArray(childTables, function (table) {
                        table.parentTable = null;
                    });

                    if (self.parentTable) {
                        self.parentTable.removeChildTable(self);
                    }
                },

                addChildTable: function (table) {
                    childTables.push(table);
                    self.syncTablesToChild(table);
                },

                removeChildTable: function (table) {
                    var tableId = table.touid;

                    tou.forEachArray(childTables, function (table, idx) {
                        if (table.touid === tableId) {
                            childTables.splice(idx, 1);
                            return false;
                        }
                    });
                },

                buildPeriods: function (periods) {
                    var newPeriods = [];

                    tou.forEachArray(periods, function (period) {
                        period.touid = period.touid || tou.makeId();
                        var converted = page.convertPeriod(period);
                        newPeriods.push(converted);
                    });

                    self.rawPeriods = periods;

                    ko.mapping.fromJS(newPeriods, observablePeriods);
                },

                buildRates: function (newRates) {
                    rates = newRates;
                    self.rawRates = rates;

                    tou.forEachArray(rates, processRate);

                    ko.mapping.fromJS(rates, observableRates);
                },

                syncTablesToChild: function (table) {
                    var childPeriods = $.extend(true, {}, rawPeriods);

                    tou.forEach(childPeriods, function (period) {
                        period.rates = {};
                    });

                    table.buildPeriods($.extend(true, [], childPeriods));
                    // table.buildRates($.extend(true, [], rates));
                },

                linkToTable: function (tableID) {
                    var parent = page.getRateTable(tableID);

                    parent.addChildTable(self);

                    self.parentTable = parent;

                    if (self.bindings) {
                        self.bindings.isChild(true);
                    }
                },

                unlinkTable: function () {
                    self.parentTable.removeChildTable(self);
                    self.parentTable = null;
                    self.bindings.isChild(false);
                },

                updateChildPeriods: function (newPeriod, isUpdate, idx) {
                    tou.forEachArray(childTables, function (child) {
                        child.addPeriod(newPeriod, isUpdate, idx);
                    });
                },

                updateChildRates: function (newRate, isUpdate, idx) {
                    // tou.forEachArray(childTables, function (child) {
                    //     child.addRate(newRate, isUpdate, idx);
                    // });
                },

                addPeriod: function (period, isUpdate, idx) {
                    var self = this,
                        rates;

                    period.touid = period.touid || tou.makeId();

                    if (!isUpdate) {
                        rawPeriods.push(period);
                        period = page.convertPeriod(period);
                        observablePeriods.push(ko.mapping.fromJS(period));
                    } else {
                        delete period.rates;
                        $.extend(true, rawPeriods[idx], period);
                        ko.mapping.fromJS(page.convertPeriod(period), observablePeriods()[idx], observablePeriods()[idx]);
                    }

                    self.updateChildPeriods(rawPeriods);
                },

                deletePeriod: function (idx) {
                    rawPeriods.splice(idx, 1);
                    observablePeriods.splice(idx, 1);
                },

                addRate: function (rate, isUpdate, idx) {
                    var data = ko.toJS(rate);

                    processRate(data);

                    if (!isUpdate) {
                        cfg.rates.push(data);
                        self.rawRates.push(data);

                        tou.forEachArray(rawCfg.periods, function (period) {
                            period.rates[rate.name()] = null;
                        });

                        tou.forEachArray(observablePeriods(), function (period) {
                            period.rates[rate.name()] = ko.observable();
                        });

                        rate.showInTransition = ko.observable(data.showInTransition);

                        if (observableRates() === undefined) {
                            observableRates([rate]);
                        } else {
                            observableRates.push(rate);
                        }

                        this.updateChildRates(rate);
                    } else {
                        this.updateRate(rate, data, idx);
                    }
                },

                addNewPeriod: function (period, isUpdate, idx) {
                    var data = ko.toJS(period),
                        converted = page.convertPeriod(data);

                    if (!isUpdate) {
                        this.rawPeriods.push(data);
                        //periods.push(converted);
                        observablePeriods.push(ko.mapping.fromJS(converted));
                        this.updateChildPeriods(period);
                    } else {
                        this.updatePeriod(period, data, idx);
                    }

                    this.rawPeriods.sort(function (a, b) {
                        return (new Date(a.start.date) > new Date(b.start.date)) ? 1 : -1;
                    });
                    observablePeriods.sort(function (a, b) {
                        return (new Date(a._rawStart()) > new Date(b._rawStart())) ? 1 : -1;
                    });
                },

                updatePeriod: function (period, data, idx) {
                    var obPeriod = observablePeriods()[idx],
                        convertedPeriod = page.convertPeriod(data),
                        rates = $.extend(true, {}, convertedPeriod.rates),
                        obrates = obPeriod.rates;

                    delete period.rates;
                    delete data.rates;
                    delete convertedPeriod.rates;

                    this.rawPeriods[idx] = $.extend(this.rawPeriods[idx], data);
                    periods[idx] = $.extend(periods[idx], convertedPeriod);
                    // periods[idx].rates = rates;
                    observablePeriods()[idx] = ko.mapping.fromJS(convertedPeriod);
                    observablePeriods()[idx].rates = obrates;

                    observablePeriods.valueHasMutated();

                    this.updateChildPeriods(period, true, idx);
                },

                updateRate: function (rate, rawRate, idx) {
                    var obRate = observableRates()[idx],
                        newName = rate.name(),
                        rates = self.rawRates,
                        oldName = rates[idx].name;

                    processRate(rawRate);

                    // this.rawRates[idx] = $.extend(this.rawRates[idx], rawRate);
                    rates[idx] = $.extend(rates[idx], rawRate);
                    // this.cfg.rates[idx] = $.extend(this.cfg.rates[idx], rawRate);
                    observableRates()[idx] = ko.mapping.fromJS(rawRate);

                    tou.forEachArray(this.rawPeriods, function (period) {
                        var val = period.rates[oldName];

                        delete period.rates[oldName];
                        period.rates[rawRate.name] = val;
                    });

                    tou.forEachArray(observablePeriods(), function (period) {
                        var val = period.rates[oldName]();

                        delete period.rates[oldName];

                        period.rates[rawRate.name] = ko.observable(val);
                    });

                    observableRates.valueHasMutated();

                    this.updateChildRates(rate, true, idx);
                },

                deleteRate: function (idx) {
                    var rate = self.rawRates[idx],
                        name = rate.name;

                    tou.forEachArray(this.rawPeriods, function (period) {
                        delete period.rates[name];
                    });

                    tou.forEachArray(periods, function (period) {
                        delete period.rates[name];
                    });

                    tou.forEachArray(observablePeriods(), function (period) {
                        delete period.rates[name];
                    });

                    // this.rawRates.splice(idx, 1);
                    rates.splice(idx, 1);
                    observableRates.splice(idx, 1);

                    // tou.forEachArray(childTables, function(child) {
                    //     child.deleteRate(idx);
                    // });
                },

                updateRates: function (updatedRates, fromKO) {
                    var self = this;

                    if (!fromKO) {
                        rates = $.extend(true, [], updatedRates);
                        self.rawRates = rates;
                        observableRates = ko.mapping.fromJS(updatedRates);
                        // tou.forEach(updatedRates, function(rate) {
                        //     self.addNewRate(rate, true);
                        // });
                    }

                    self.ratesUpdated(rates);
                },

                ratesUpdated: function (newRates) {
                    tou.forEachArray(childTables, function (child) {
                        child.updateRates(newRates);
                    });
                },

                getEditProperties: function () {
                    var title = self.parentTable && self.parentTable.title;

                    return {
                        title: self.title,
                        isChild: self.parentTable !== null,
                        parentTableName: title || '',
                        hidePeakInfo: self.hidePeakInfo
                    };
                }
            });

            if (rawCfg.parentTable) {
                if (!rawCfg.parentTable.match(tou.idxPrefix)) {
                    parentTableID = page.getRateTableByTitle(rawCfg.parentTable);
                    if (!parentTableID) {
                        tou.on('newRateTable-' + rawCfg.parentTable, function (tableTitle) {
                            parentTableID = page.getRateTableByTitle(rawCfg.parentTable);
                            self.linkToTable(parentTableID);
                        });
                    } else {
                        self.linkToTable(parentTableID.touid);
                    }
                } else {
                    self.linkToTable(rawCfg.parentTable);
                }
            } else if (rates.length === 0 && periods.length === 0 && rawCfg) {
                self.buildRates(rawCfg.rates);
                self.buildPeriods(rawCfg.periods);
                // rates = rawCfg.rates;
                // tou.forEachArray(rawCfg.periods, function(period) {
                //     periods.push(page.convertPeriod(period));
                // });
            }

            tou.fire('newRateTable-' + title);
        },
        modalTemplates: {
            electricityRateFiscalYear: {
                fiscalYear: ''
            },
            electricityRatePeriod: {
                title: 'Add Rate Period',
                season: 'transition',
                dateFrom: '',
                dateTo: '',
                daySunday: false,
                dayMonday: false,
                dayTuesday: false,
                dayWednesday: false,
                dayThursday: false,
                dayFriday: false,
                daySaturday: false,
                enablePeakSelection: false,
                timeFrom: '',
                timeTo: '',
                seasonName: '',
                isUpdate: false,
                periodIdx: '',
                saveText: 'Add',
                computeds: {
                    atLeastOneDay: function (scope) {
                        return function () {
                            var atLeastOne = false;

                            tou.forEachArray(tou.fullDayList, function (day) {
                                if (scope['day' + day]()) {
                                    atLeastOne = true;
                                }
                            });

                            return atLeastOne;
                        };
                    }
                }
            },
            electricityAddRateElement: {
                title: 'Add Rate Element',
                type: 'demand',
                peak: 'on',
                rateName: '',
                rateQualifier: '',
                threshold: 0,
                isUpdate: false,
                rateIdx: '',
                saveText: 'Add',
                qualifierDemand: 'Peak Demand',
                addQualifier: function (scope, event) {
                    var qualifier = this.rateQualifier();

                    qualifier += ' ' + $(event.target).data('val');

                    this.rateQualifier(qualifier);
                    $('.rateQualifier').focus();
                }
            },
            electricityEditRateTable: {
                title: '',
                isChild: false,
                unlink: false,
                parentTableName: '',
                hidePeakInfo: false
            },
            electricityAddRateTable: {
                tableName: '',
                copyPeriods: false,
                linkPeriods: false,
                linkedTable: '',
                rateTablesUsable: [],
                hidePeakInfo: false
            },
            electricityAddOffPeakDay: {
                date: '',
                name: '',
                isUpdate: false,
                oldName: '',
                saveText: 'Add',
                title: 'Add Off Peak Day'
            },
            electricityAddFiscalYearRateTable: {
                previousYears: [],
                year: '',
                yearToCopy: '',
                copyData: false,
                currFiscalYear: ''
            }
        },
        bindings: {
            isEditMode: ko.observable(false),
            currRateTable: ko.observable(),
            holidays: ko.observableArray([]),
            previousYears: ko.observableArray([]),
            currFiscalYear: ko.observable(),
            initialized: ko.observable(false),
            latestYear: ko.observable(),
            setFiscalYear: function (kodata) {
                var data = ko.toJS(kodata),
                    newYear = parseInt(data.fiscalYear, 10);

                if (isNaN(newYear) || newYear <= 0) {
                    kodata.errorMessages(['Invalid Fiscal Year']);
                } else {
                    this.bindings.initialized(true);

                    this.bindings.latestYear(newYear);
                    this.bindings.currFiscalYear(newYear);

                    this.createYearDropdown(tou.currUtility.PreviousRateTables);

                    tou.currUtility.RateTables['Fiscal Year'] = newYear;
                    tou.currUtility.RateTables['Fiscal Year'] = newYear;

                    this.createRateTables(tou.currUtility.RateTables);

                    tou.hideModal();
                    this.bindings.toEditMode();
                }
            },
            print: function () {
                tou.print($('.' + this.$page.utilityName + ' .' + this.$page.title.toLowerCase().replace(/ /g, '') + ' .mainContent'));
            },
            exportPDF: function () {
                tou.exportPDF($('.' + this.$page.utilityName + ' .' + this.$page.title.toLowerCase().replace(/ /g, '') + ' .rateTableContent'));
            },
            toEditMode: function () {
                this.isEditMode(true);
            },
            cancelEditMode: function () {
                this.$page.doCancel();
                this.isEditMode(false); //will need checks for unsaved changes
            },
            save: function () {
                this.$page.doSave();
            },
            loadYear: function (year) {
                var nYear = parseInt(year, 10);
                if(nYear !== this.currFiscalYear()) {
                    this.cancelEditMode();
                }
                this.currFiscalYear(nYear);
                this.$page.loadYear(year);
            },
            addRateTable: function () {
                tou.showModal('electricityAddRateTable', {
                    rateTablesUsable: this.rateTablesUsable()
                }, this.$page);
            },
            addHoliday: function () {
                if (this.isEditMode()) {
                    tou.showModal('electricityAddOffPeakDay', null, this.$page);
                }
            },
            editHoliday: function (holiday) {
                var newHoliday = ko.toJS(holiday);
                if (this.isEditMode()) {
                    newHoliday.title = 'Edit Off Peak Day';
                    newHoliday.isUpdate = true;
                    newHoliday.oldName = holiday.name();
                    newHoliday.saveText = 'Update';
                    tou.log(newHoliday);
                    tou.showModal('electricityAddOffPeakDay', newHoliday, this.$page);
                }
            },
            deleteHoliday: function (kodata) {
                var data = ko.toJS(kodata);
                this.deleteHoliday(data);
                tou.hideModal();
            },
            addNewHoliday: function (kodata) {
                var data = ko.toJS(kodata),
                    messages = [];

                if (!data.date) {
                    messages.push('Invalid Date');
                }

                if (!data.name) {
                    messages.push('Must enter name');
                }

                if (messages.length > 0) {
                    kodata.errorMessages(messages);
                } else {
                    kodata.errorMessages.removeAll();
                    this.addNewHoliday(data);
                    tou.hideModal();
                }
            },
            addRatePeriod: function (rateTable) {
                this.currRateTable(rateTable);

                tou.showModal('electricityRatePeriod', {
                    dateFrom: '',
                    dateTo: ''
                }, this.$page);
            },
            addNewRatePeriod: function (kodata) {
                var data = ko.toJS(kodata),
                    isUpdate = data.isUpdate,
                    currTable = this.bindings.currRateTable(),
                    table = this.getRateTable(currTable.touid),
                    formattedStart = moment(data.dateFrom).format(tou.dateFormat),
                    formattedEnd = moment(data.dateTo).format(tou.dateFormat),
                    messages = [];

                if (!data.dateFrom || !data.dateTo) {
                    messages.push('Must select valid date range');
                } else {
                    if (data.dateFrom > data.dateTo) {
                        messages.push('Start date must be before end date');
                    }
                }

                if (data.season !== 'transition') {
                    if (!data.timeFrom || !data.timeTo) {
                        messages.push('Must select peak time range');
                    } else {
                        if (parseInt(data.timeFrom.replace(':', ''), 10) > parseInt(data.timeTo.replace(':', ''), 10)) {
                            messages.push('Start time must be before end time');
                        }
                    }

                    if (!data.atLeastOneDay) {
                        messages.push('Must select at least one day');
                    }
                }

                if (this.checkForOverlap(table, formattedStart, formattedEnd, isUpdate, data)) {
                    messages.push('Periods cannot overlap');
                }

                if (messages.length > 0) {
                    kodata.errorMessages(messages);
                } else {
                    kodata.errorMessages.removeAll();
                    this.addNewRatePeriod(data);
                    tou.hideModal();
                }

            },
            deletePeriod: function (kodata) {
                var data = ko.toJS(kodata);

                this.deletePeriod(data);
                tou.hideModal();
            },
            deleteRate: function (kodata) {
                var data = ko.toJS(kodata);

                this.deleteRate(data);
                tou.hideModal();
            },
            addRateElement: function (rateTable) {
                this.currRateTable(rateTable);
                tou.showModal('electricityAddRateElement', null, this.$page);
            },
            addNewRateElement: function (kodata) {
                var data = ko.toJS(kodata),
                    messages = [],
                    type = data.type,
                    qualifierString = data.rateQualifier,
                    qualifiers,
                    valid = true,
                    invalidStructure = false,
                    invalidValues = false,
                    table = this.getRateTable(this.bindings.currRateTable().touid),
                    matrix = {
                        2: function (str) {
                            return str === 'AND';
                        },
                        1: function (str) { //digits only
                            return !str.match('[a-zA-Z]');
                        },
                        0: function (str) { //only logical expressions

                            return ['<', '<=', '>', '>='].indexOf(str) !== -1;
                        }
                    },
                    validateQualifier = function() {
                        var numbers = qualifierString.match(/[\d]+/g) || [],
                            operators = qualifierString.match(/[{<}{>}]+/g) || [];

                        if (numbers.length > 1) {
                            if (operators.length === 2) {
                                if (numbers[0] > numbers[1]) {
                                    if (operators[0] === '<' && operators[1] === '>') {
                                        valid = true;
                                    } else {
                                        valid = false;
                                    }
                                } else {
                                    if (operators[0] === '>' && operators[1] === '<') {
                                        valid = true;
                                    } else {
                                        valid = false;
                                    }
                                }
                            } else {
                                valid = false;
                            }
                        } else {
                            if(operators.length !== numbers.length) {
                                valid = false;
                            }
                        }
                    };

                data.threshold = parseInt(data.threshold, 10);

                if (!data.rateName) {
                    messages.push('Must choose rate name');
                }

                if (type === 'reactive') {
                    if (!data.threshold && data.threshold !== 0) {
                        messages.push('Invalid rate threshold');
                    }
                }

                if (type === 'consumption') {
                    if (data.peak === 'off') {
                        if (data.rateQualifier !== '') {
                            qualifiers = data.rateQualifier.trim().split(/\s+/);
                            if (qualifiers.length > 0) {
                                if (qualifiers.length === 2 || ((qualifiers.length - 2) % 3 === 0)) {
                                    tou.forEachArray(qualifiers, function (qualifier, idx) {
                                        valid = matrix[idx % 3](qualifier);
                                        return valid;
                                    });
                                } else {
                                    valid = false;
                                }
                            }

                            if (!valid) {
                                invalidStructure = true;
                            }

                            if (valid) {
                                validateQualifier();
                                if (!valid) {
                                    invalidValues = true;
                                }
                            }

                            if (!valid) {
                                messages.push('Invalid qualifier.<br/>Qualifier must be space-delimited and a valid mathematical expression.  Examples: <br/>< 425<br/>>= 425 AND < 620');
                            }
                        }
                    } else {
                        data.rateQualifier = '';
                    }
                }

                tou.forEachArray(table.rawRates, function (rate, idx) {
                    if (rate.name === data.rateName && idx !== data.rateIdx) {
                        messages.push('Duplicate rate name');
                        return false;
                    }
                });

                if (messages.length > 0) {
                    kodata.errorMessages(messages);
                } else {
                    kodata.errorMessages.removeAll();
                    this.addNewRateElement(data);
                    tou.hideModal();
                }
            },
            editRatePeriod: function (koTable, koPeriod) {
                var page = this.$page,
                    period = ko.toJS(koPeriod),
                    touid = koTable.$data.touid,
                    table = page.getRateTable(touid),
                    newperiod,
                    periodIdx,
                    newKOPeriod;

                if (this.isEditMode() && table.parentTable === null) {
                    tou.forEachArray(table.rawPeriods, function (rawPeriod, idx) {
                        if (rawPeriod.touid === period.touid) {
                            newperiod = rawPeriod;
                            periodIdx = idx;
                        }
                    });

                    newKOPeriod = page.convertPeriodToKO(newperiod);

                    newKOPeriod.title = 'Update Rate Period';
                    newKOPeriod.saveText = 'Update';
                    newKOPeriod.isUpdate = true;
                    newKOPeriod.periodIdx = periodIdx;

                    this.currRateTable(koTable.$data);
                    tou.showModal('electricityRatePeriod', newKOPeriod, this.$page);
                }
            },
            editRateElement: function (koTable, koRate) {
                var page = this.$page,
                    rate = ko.toJS(koRate),
                    touid = koTable.$data.touid,
                    table = page.getRateTable(touid),
                    newRate,
                    rateIdx,
                    newKORate;

                if (this.isEditMode()) {
                    tou.forEachArray(table.rawRates, function (rawRate, idx) {
                        if (rawRate.name === rate.name) {
                            newRate = rawRate;
                            rateIdx = idx;
                        }
                    });

                    newKORate = page.convertRateToKO(newRate);

                    newKORate.title = 'Update Rate Element';
                    newKORate.saveText = 'Update';
                    newKORate.isUpdate = true;
                    newKORate.rateIdx = rateIdx;

                    this.currRateTable(koTable.$data);
                    tou.showModal('electricityAddRateElement', newKORate, this.$page);
                }
            },
            addNewFiscalYearRateTable: function () {
                tou.showModal('electricityAddFiscalYearRateTable', {
                    previousYears: this.previousYears(),
                    currFiscalYear: this.currFiscalYear()
                }, this.$page);
            },
            addNewFiscalYear: function (kodata) {
                var data = ko.toJS(kodata),
                    years = data.previousYears,
                    year = parseInt(data.year, 10),
                    messages = [];

                if (years.indexOf(year) !== -1 || year === this.bindings.currFiscalYear()) {
                    messages.push('Duplicate year');
                }

                if (isNaN(year) || year <= 0) {
                    messages.push('Invalid year');
                }

                if (messages.length > 0) {
                    kodata.errorMessages(messages);
                } else {
                    kodata.errorMessages.removeAll();
                    this.addNewFiscalYear(data);
                    this.bindings.toEditMode();
                    tou.hideModal();
                }

            },
            addNewRateTable: function (kodata) {
                var data = ko.toJS(kodata),
                    table,
                    cfg = {
                        title: data.tableName,
                        rates: [],
                        periods: []
                    },
                    unique = this.checkForUniqueTitle(data.tableName);

                if (data.tableName === '') {
                    kodata.errorMessages(['Table name cannot be empty']);
                } else if (!unique) {
                    kodata.errorMessages(['Duplicate Table Name']);
                } else {
                    if (data.linkPeriods) {
                        cfg.parentTable = data.linkedTable.touid;//need string, since it's a new table and needs config, not setting property
                    } else if (data.copyPeriods) {
                        table = this.getRateTable(data.linkedTable.touid);
                        cfg.cfg = {
                            periods: $.extend(true, [], Array.prototype.slice.call(table.cfg.periods))
                        };
                    }

                    this.createAndAddRateTable(cfg);

                    tou.hideModal();
                }
            },
            editRateTable: function (table) {
                if (this.isEditMode()) {
                    this.currRateTable(table);
                    tou.showModal('electricityEditRateTable', this.$page.getRateTable(table.touid).getEditProperties(), this.$page);
                }
            },
            deleteRateTable: function () {
                this.deleteRateTable();
                tou.hideModal();
            },
            updateRateTable: function (kodata) {
                var data = ko.toJS(kodata),
                    title = data.title,
                    unique = this.checkForUniqueTitle(title);

                if (!unique) {
                    kodata.errorMessages(['Duplicate Table Name']);
                } else {
                    kodata.errorMessages.removeAll();
                    this.updateRateTable(data);
                    tou.hideModal();
                }
            },
            rateTables: ko.observableArray([])
        },
        computedBindings: {
            rateTablesUsable: function () {
                var tables = this.rateTables(),
                    ret = [];

                tou.forEachArray(tables, function (table) {
                    if (!table.isHoliday) {
                        ret.push(table);
                    }
                });

                return ret;
            },
            shouldShowEdit: function () {
                var currFiscalYear = this.currFiscalYear(),
                    year = this.latestYear();

                return currFiscalYear === year;
            }
        },
        checkForUniqueTitle: function (title) {
            var unique = true,
                currID = this.bindings.currRateTable() && this.bindings.currRateTable().touid;

            tou.forEach(this.rateTables, function (table) {
                if (table.title === title && table.touid !== currID) {
                    unique = false;
                }
            });

            return unique;
        },
        doCancel: function () {
            this.createRateTables(tou.currUtility.RateTables);
            tou.fire('ratetablecancel');
        },
        getSaveData: function () {
            var self = this,
                tables = {},
                saveData = {},
                boundTables = ko.toJS(self.bindings.rateTables());

            tou.forEachArray(boundTables, function (boundTable, idx) {
                var table = self.getRateTable(boundTable.touid),
                    data = table && table.getExportConfig(),
                    ret = {};

                if (data) {
                    tables[data.title] = {
                        order: idx,
                        periods: data.periods,
                        rates: data.rates,
                        parentTable: data.parentTable,
                        hidePeakInfo: data.hidePeakInfo
                    };
                } else { //holiday table
                    tou.forEachArray(boundTable.holidays, function (holiday) {
                        ret[holiday.name] = holiday.date;
                    });

                    ret.order = idx;

                    tables[boundTable.title] = ret;
                }
            });

            return tables;
        },
        doSave: function () {
            var self = this,
                tables = self.getSaveData(),
                previousYears = $.extend(true, {}, self.previousYears),
                yearToDelete = self.bindings.currFiscalYear(),
                count = 0,
                process = function () {
                    count++;
                    if (count === 2) {
                        self.bindings.isEditMode(false);
                        delete previousYears[yearToDelete];

                        // $.extend(tou.currUtility.RateTables, tables);//has to do this before save
                        // $.extend(tou.currUtility.PreviousRateTables, self.previousYears);

                        tou.buildAvailablePeriods(true);

                        tou.fire('ratetablesaved', tou.currUtility.utilityName);
                    }
                };

            delete previousYears[yearToDelete];

            tou.saveUtility(self.utilityName, {
                'RateTables': tables
            }, function (response) {
                process();
                tou.log('saveresponse', response);
            });

            tou.saveUtility(self.utilityName, {
                'PreviousRateTables': previousYears
            }, function (response) {
                process();
                tou.log('saveresponse', response);
            });
        },
        deleteRateTable: function () {
            var currRateTable = this.bindings.currRateTable(),
                touid = currRateTable.touid,
                title = this.rateTables[touid].title,
                idx;

            delete this.rateTables[touid];
            delete tou.currUtility.RateTables[title];
            tou.forEachArray(this.bindings.rateTables(), function (table, index) {
                if (table.touid === touid) {
                    idx = index;
                    return false;
                }
            });

            this.bindings.rateTables.splice(idx, 1);
        },
        updateRateTable: function (data) {
            var currTable = this.bindings.currRateTable(),
                table = this.getRateTable(currTable.touid);

            currTable.title(data.title);
            table.title = data.title;
            if (data.unlink) {
                table.unlinkTable();
            }
            table.bindings.hidePeakInfo(data.hidePeakInfo || false);
            table.hidePeakInfo = data.hidePeakInfo || false;
            tou.hideModal();
        },
        checkForOverlap: function (table, start, end, isUpdate, data) {
            var self = this,
                overlap = false,
                startDate = new Date(start),
                endDate = new Date(end),
                isOverlap = function (period, idx) {
                    var periodStart = new Date(period.start.date),
                        periodEnd = new Date(period.end.date);

                    if (!(startDate > periodEnd || endDate < periodStart)) {
                        if (!isUpdate || (isUpdate && data.periodIdx !== idx)) {
                            overlap = true;
                        }
                    }

                    // if (periodStart < endDate && periodEnd > endDate) {
                    //     overlap = true;
                    // }

                    // if (periodStart < startDate && periodEnd > startDate) {
                    //     overlap = true;
                    // }
                };

            tou.forEachArray(table.rawPeriods, function (period, idx) {
                return isOverlap(period, idx);
            });

            return overlap;
        },
        buildRateTable: function (cfg) {
            var startCfg = cfg.start,
                endCfg = cfg.end,
                days = cfg.days,
                rates = cfg.rates,
                startDate = new Date(startCfg.date),
                endDate = new Date(endCfg.date),
                endDateMidnight = new Date(endDate.getTime()),
                peakStart = startCfg.peak,
                peakEnd = endCfg.peak,
                hourStart = Math.floor(peakStart / 100),
                minuteStart = peakStart % 100,
                hourEnd = Math.floor(peakEnd / 100),
                minuteEnd = peakEnd % 100,
                dayList = tou.shortDayList,
                numDays = [],
                timestamps = this.timestamps || [],
                loopDate = new Date(startDate.getTime()),
                endStamp,
                dayOfWeek,
                peak = 'off',
                flip = function () {
                    var newRate;

                    peak = peak === 'off' ? 'on' : 'off';

                    newRate = rates[peak];

                    timestamps.push({
                        peak: peak,
                        timestamp: loopDate.getTime() / 1000,
                        rate: newRate,
                        friendlyDate: loopDate.toString()
                    });
                },
                start = new Date();

            if (timestamps.length === 0) {
                timestamps.push({
                    timestamp: startDate.getTime() / 1000,
                    rate: rates.off,
                    friendlyDate: startDate.toString()
                });
            }

            tou.forEachArray(days, function (day) {
                numDays.push(dayList.indexOf(day));
            });

            endDateMidnight.setDate(endDateMidnight.getDate() + 1);
            endDateMidnight.setSeconds(-1);
            endStamp = endDateMidnight.getTime();

            while (loopDate.getTime() < endStamp) {
                dayOfWeek = loopDate.getDay();
                if (numDays.indexOf(dayOfWeek) !== -1) { //is valid day
                    loopDate.setHours(hourStart);
                    loopDate.setMinutes(minuteStart);
                    flip();
                    loopDate.setHours(hourEnd);
                    loopDate.setMinutes(minuteEnd);
                    flip();
                }
                loopDate.setDate(loopDate.getDate() + 1);
            }

            timestamps.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });

            this.timestamps = timestamps;

            tou.log('Built rate table in', (new Date() - start) / 1000, 'seconds');
        },
        findDate: function (target) { //takes timestamp
            var prevIdx = 0,
                startTime = new Date();

            while (target / 1000 > this.timestamps[prevIdx].timestamp) {
                prevIdx++;
            }
            tou.log('found date', this.timestamps[prevIdx - 1], 'in', new Date() - startTime, 'milliseconds');
        },
        findAllOnPeriods: function (start, end) { //takes dates
            var startStamp = start.getTime() / 1000,
                endStamp = end.getTime() / 1000,
                prevIdx = 0,
                onPeriods = [],
                prev,
                curr,
                begin = new Date();

            while (startStamp > this.timestamps[prevIdx].timestamp) {
                prevIdx++;
            }

            while (endStamp > this.timestamps[prevIdx].timestamp) {
                if (this.timestamps[prevIdx].peak === 'on') {
                    prev = this.timestamps[prevIdx];
                    curr = this.timestamps[prevIdx + 1];
                    onPeriods.push({
                        start: prev.timestamp,
                        end: curr.timestamp,
                        rate: prev.rate
                    });
                }
                prevIdx++;
            }

            tou.log('found ranges in', new Date() - begin, 'milliseconds');

            return onPeriods;
        },
        convertRateToKO: function (rate) {
            var ret = {
                type: rate.type,
                peak: rate.peak,
                rateName: rate.name,
                rateQualifier: rate.qualifier,
                threshold: rate.threshold,
                qualifierDemand: rate.qualifierDemand
            };

            return ret;
        },
        convertPeriodToKO: function (period) {
            var ret = {
                season: period.rangeType,
                dateFrom: new Date(period.start.date),
                dateTo: new Date(period.end.date),
                enablePeakSelection: period.enablePeakSelection,
                daySunday: false,
                dayMonday: false,
                dayTuesday: false,
                dayWednesday: false,
                dayThursday: false,
                dayFriday: false,
                daySaturday: false,
                seasonName: period.title,
                touid: period.touid
            };

            if(period.start.peak === undefined) {
                period.start.peak = 0;
            }

            if(period.end.peak === undefined) {
                period.end.peak = 0;
            }

            ret.timeFrom = Math.floor(period.start.peak / 100) + ':' + ('0' + period.start.peak % 100).slice(-2);
            ret.timeTo = Math.floor(period.end.peak / 100) + ':' + ('0' + period.end.peak % 100).slice(-2);

            tou.forEachArray(period.days, function (day) {
                var longDay = tou.fullDayList[tou.shortDayList.indexOf(day)];

                ret['day' + longDay] = true;
            });

            return ret;
        },
        convertPeriod: function (period) {
            var out,
                rates = {},
                getShortDate = function (dateStr) {
                    var tempDate = new Date(dateStr),
                        month = tempDate.getMonth() + 1,
                        tmpDate = tempDate.getDate();

                    return [month, tmpDate].join('/');
                },
                getDaysText = function (input) {
                    var ret = '',
                        total = 0,
                        matrix = {
                            "sun": 1,
                            "mon": 3,
                            "tue": 3,
                            "wed": 3,
                            "thu": 3,
                            "fri": 3,
                            "sat": 1
                        };

                    tou.forEachArray(input, function (entry, idx) {
                        total += matrix[entry];
                    });

                    if (total === 15) {
                        ret = 'Weekdays';
                    } else if (total === 2) {
                        ret = 'Weekends';
                    } else {
                        ret = input.map(function (a) {
                            return a.charAt(0).toUpperCase() + a.slice(1);
                        }).join(', ');
                    }

                    return ret;
                },
                getTimeText = function (period) {
                    var getTimeStr = function (stamp) {
                            var adjustedStamp;

                            if (stamp < 100) {
                                adjustedStamp = ("00" + stamp);
                            } else if (stamp >= 100 && stamp < 1000) {
                                adjustedStamp = ("0" + stamp);
                            } else {
                                adjustedStamp = stamp;
                            }
                            return moment(adjustedStamp, ["HH:mm"]).format("h:mm a");
                        },
                        startStr,
                        endStr;

                    startStr = getTimeStr(period.start.peak);
                    endStr = getTimeStr(period.end.peak);

                    return startStr + ' - ' + endStr;
                };

            if (!period.touid) {
                period.touid = tou.makeId();
            }

            if (period.rates) {
                tou.forEach(period.rates, function (val, key) {
                    rates[key] = val;
                });
            } else {
                rates = {};
            }

            out = {
                periodTitle: period.title,
                periodType: period.rangeType,
                rangeText: getShortDate(period.start.date) + ' - ' + getShortDate(period.end.date),
                daysText: getDaysText(period.days),
                timeText: period.rangeType !== 'transition' ? getTimeText(period) : '',
                peakText: period.rangeType === 'transition' ? '' : 'On-Peak',
                _rawStart: period.start.date,
                _rawEnd: period.end.date,
                touid: period.touid,
                enablePeakSelection: period.enablePeakSelection || false
            };

            out.rates = rates;
            return out;
        },
        createRateTables: function (rateTables) {
            var self = this,
                tables = [],
                processRateTable = function (table, tableName) {
                    var convertedPeriods = [],
                        convertedRates = [],
                        newTable;

                    if (typeof table !== 'number') {

                        if (table.periods) {
                            table.periods.sort(function (a, b) {
                                return (new Date(a.start.date) > new Date(b.start.date)) ? 1 : -1;
                            });

                            tou.forEachArray(table.periods, function (period) {
                                convertedPeriods.push(self.convertPeriod(period));
                            });


                            convertedRates = Array.prototype.slice.call(table.rates);

                            newTable = self.createAndAddRateTable({
                                title: tableName,
                                periods: convertedPeriods,
                                rates: convertedRates,
                                cfg: $.extend(true, {}, table)
                            }, true);

                            tables[table.order] = newTable.getBindings();

                            // tables.push(newTable.getBindings());
                        } else { //holiday table
                            tou.forEach(table, function (holiday, holidayName) {
                                if (holidayName !== 'order') {
                                    self.bindings.holidays.push({
                                        name: ko.observable(holidayName),
                                        date: ko.observable(holiday)
                                    });
                                }
                            });

                            self.bindings.holidays.sort(function (a, b) {
                                return (new Date(a.date()) < new Date(b.date())) ? -1 : 1;
                            });

                            tables[table.order] = {
                                isHoliday: true,
                                holidays: self.bindings.holidays,
                                title: tableName
                            };

                            // tables.push({
                            //     isHoliday: true,
                            //     holidays: self.bindings.holidays,
                            //     title: tableName
                            // });

                            // self.bindings.rateTables.push();
                        }
                    }
                };

            self.clearRateTables();

            tou.forEach(rateTables, processRateTable);

            self.bindings.rateTables(tables);

        },
        createYearDropdown: function (tables) {
            var self = this,
                years = [],
                thisYear = self.bindings.currFiscalYear();

            self.previousYears = {};

            years.push(thisYear);
            self.previousYears[thisYear] = tou.currUtility.RateTables;

            tou.forEach(tables, function (table, year) {
                years.push(year);
                self.previousYears[year] = self.previousYears[year] || table;
            });

            years.sort().reverse();

            self.bindings.previousYears(years);
        },
        init: function () {
            var self = this;

            if (tou.currUtility.RateTables['Fiscal Year'] && tou.currUtility.RateTables['Fiscal Year'] !== '') {
                self.bindings.currFiscalYear(tou.currUtility.RateTables['Fiscal Year']);
                self.bindings.latestYear(tou.currUtility.RateTables['Fiscal Year']);
                self.createYearDropdown(tou.currUtility.PreviousRateTables);
                self.bindings.initialized(true);
                self.createRateTables(tou.currUtility.RateTables);
            } else {
                if (tou.bindings.canWrite(tou.currUtility.Security[0])) {
                    tou.showModal('electricityRateFiscalYear', null, self);
                }
            }

            //$(function() {
            //    self.initSortable();
            //});
        }
    }, {
        title: 'Meters',
        isActive: ko.observable(false),
        background: 'woodbackgroundtile.jpg',
        init: function () {
            var self = this;

            $.extend(self.bindings, {
                $metersTbody: $('.' + self.utilityNameShort + ' .meters .sortablemeters')
            });

            $('.' + self.utilityNameShort + ' .mainContent .meters').on('change', 'input:checkbox', function (event) {
                self.bindings.adjustInactiveCount();
            });

            self.bindings.initSortable();

            $('.' + self.utilityNameShort + ' .meters').on('click', '.addNewMeter-button', function (e) {
                var rowTemplate = {
                        isActive: true,
                        displayedMeterName: "",
                        meterPoints: [{
                            meterPointDesc: "Reactive",
                            meterPointName: "- - -",
                            upi: null,
                            pointType: null
                        }, {
                            meterPointDesc: "Demand",
                            meterPointName: "- - -",
                            upi: null,
                            pointType: null
                        }, {
                            meterPointDesc: "Consumption",
                            meterPointName: "- - -",
                            upi: null,
                            pointType: null
                        }]
                    },
                    $meters = $('.' + self.utilityNameShort + ' .meters'),
                    $mainContent = $meters.find('.mainContent'),
                    $newRow;
                e.preventDefault();
                e.stopPropagation();
                if (self.bindings.listOfMeters.indexOf(rowTemplate) === -1) {
                    self.bindings.listOfMeters.push(rowTemplate);
                    $newRow = $meters.find('table tbody tr:last');
                    $newRow.addClass("ui-sortable-handle");
                }
                self.bindings.metersSortOrder("none");
                // Auto scroll to bottom of page
                $mainContent.stop().animate({
                        scrollTop: $mainContent.get(0).scrollHeight
                }, 700);
            });

            $('.' + self.utilityNameShort + ' .meters').on('click', 'th.meterDisplayName > div', function (e) {
                var sortMeters = function () {
                    var i,
                        len,
                        newOrder,
                        currentMeter,
                        foundMeter;
                    switch(self.bindings.metersSortOrder()) {
                        case "none":
                            newOrder = [];
                            len = self.bindings.metersSortOrderNone.length;
                            for (i = 0; i < len; i++) {
                                currentMeter = self.bindings.metersSortOrderNone[i];
                                foundMeter = ko.utils.arrayFilter(self.bindings.listOfMeters(), function (meter) {
                                    return meter.displayedMeterName.toLowerCase() === currentMeter.displayedMeterName.toLowerCase();
                                });
                                newOrder.push(foundMeter[0]);
                            }
                            break;
                        case "asc":
                            newOrder = $.extend(true, [], self.bindings.listOfMeters());
                            newOrder.sort(function(a, b){
                                var result,
                                    aName = a.displayedMeterName.toLowerCase(),
                                    bName = b.displayedMeterName.toLowerCase();

                                if (aName > bName) {
                                    result = -1;
                                } else if (aName < bName) {
                                    result = 1;
                                } else {
                                    result = 0;
                                }
                                return result;
                            });
                            break;
                        case "dsc":
                            newOrder = $.extend(true, [], self.bindings.listOfMeters());
                            newOrder.sort(function(a, b){
                                var result,
                                    aName = a.displayedMeterName.toLowerCase(),
                                    bName = b.displayedMeterName.toLowerCase();

                                if (aName < bName) {
                                    result = -1;
                                } else if (aName > bName) {
                                    result = 1;
                                } else {
                                    result = 0;
                                }
                                return result;
                            });
                            break;
                        default:
                            break;
                    }

                    self.bindings.listOfMeters(newOrder);
                };

                if (self.bindings.isInEditMode() === false) {
                    switch(self.bindings.metersSortOrder()) {
                        case "none":
                            self.bindings.metersSortOrderNone = $.extend(true, [], self.bindings.listOfMeters());
                            self.bindings.metersSortOrder("asc");
                            break;
                        case "asc":
                            self.bindings.metersSortOrder("dsc");
                            break;
                        case "dsc":
                            self.bindings.metersSortOrder("none");
                            break;
                        default:
                            break;
                    }

                    sortMeters();
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            self.bindings.listOfMeters(tou.getMeters());
            self.setInactiveMeterCount();
        },
        setInactiveMeterCount: function () {
            var count = 0;

            this.bindings.listOfMeters().forEach( function (meter) {
                if (meter.isActive === false) {
                    count++;
                }
            });

            this.bindings.inactiveMeterCount(count);
        },
        bindings: {
            backgroundImage: ko.observable('/woodbackground.jpg'),
            activePage: ko.observable(),
            metersTitle: ko.observable(),
            activeUtility: ko.observable(),
            isInEditMode: ko.observable(false),
            preEditListOfMeters: [],
            metersSortOrder: ko.observable("none"),
            metersSortOrderNone: [],
            listOfMeters: ko.observableArray([]),
            inactiveMeterCount: ko.observable(0),
            adjustInactiveCount: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings,
                    inactiveCount = 0;

                ko.utils.arrayForEach(myBindings.listOfMeters(), function(meter) {
                    if (!meter.isActive) {
                        inactiveCount++;
                    }
                });

                myBindings.inactiveMeterCount(inactiveCount);
            },
            initSortable: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings;

                if (myBindings.isInEditMode()) {
                    $('.' + tou.currUtility.shortName + ' .meters .sortablemeters').sortable({
                        appendTo: myBindings.$metersTbody,
                        disabled: !myBindings.isInEditMode(),
                        items: "tr",
                        forceHelperSize: true,
                        helper: 'original',
                        stop: function (event, ui) {
                            var item = ko.dataFor(ui.item[0]),
                                newIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                            if (newIndex >= myBindings.listOfMeters().length) {
                                newIndex = myBindings.listOfMeters().length - 1;
                            }
                            if (newIndex < 0) {
                                newIndex = 0;
                            }

                            ui.item.remove();
                            myBindings.listOfMeters.remove(item);
                            myBindings.listOfMeters.splice(newIndex, 0, item);
                            myBindings.metersSortOrder("none");
                        },
                        scroll: true,
                        handle: '.handle'
                    });
                } else {
                    $('.' + tou.currUtility.shortName + ' .meters .sortablemeters').sortable({
                        appendTo: myBindings.$metersTbody,
                        disabled: !myBindings.isInEditMode(),
                        items: "tr",
                        forceHelperSize: true,
                        helper: 'original',
                        scroll: true
                    });
                }
            },
            delete: function (data) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings;
                myBindings.listOfMeters.remove(data);
                myBindings.adjustInactiveCount();
            },
            clearMeterPoint: function (data, element) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings,
                    updatedList,
                    meterPointIndex = parseInt(element.currentTarget.attributes.meterPointIndex.value, 10),
                    parentIndex = parseInt(element.currentTarget.attributes.parentIndex.value, 10),
                    meterPoint;
                updatedList = myBindings.listOfMeters();
                meterPoint = updatedList[parentIndex].meterPoints[meterPointIndex];
                meterPoint.meterPointName = "- - -";
                meterPoint.upi = null;
                myBindings.listOfMeters([]);
                myBindings.listOfMeters(updatedList);
                myBindings.$page.setInactiveMeterCount();
            },
            toEditMode: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings;
                myBindings.isInEditMode(true);
                myBindings.metersSortOrder("none");
                if (myBindings.metersSortOrderNone.length > 0 ) {  // the list was sorted at least once
                    myBindings.listOfMeters(myBindings.metersSortOrderNone);
                }
                myBindings.preEditListOfMeters = $.extend(true, [], myBindings.listOfMeters());
                myBindings.initSortable();
            },
            cancelEditMode: function () {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings;
                $('.' + this.$page.utilityNameShort + ' .meters .errormessage').html("");
                myBindings.isInEditMode(false);
                myBindings.listOfMeters(this.preEditListOfMeters);
                myBindings.$page.setInactiveMeterCount();
                myBindings.preEditListOfMeters = [];
                myBindings.metersSortOrderNone = [];
                myBindings.initSortable();
            },
            openPointSelector: function (meterObjectIndex, columnsRowIndex, upi, newUrl) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings,
                    url = newUrl || '/pointLookup',
                    windowRef,
                    columnOriginalUpi,
                    meterPointIndex,
                    meterObjIndex,
                    meterObject,
                    updatedList,
                    pointSelectedCallback = function (pid, name, type) {
                        if (!!pid) {
                            meterObject.meterPoints[meterPointIndex].upi = pid;
                            meterObject.meterPoints[meterPointIndex].pointType = type;
                            meterObject.meterPoints[meterPointIndex].meterPointName = name;
                            updatedList[meterObjIndex] = meterObject;
                            myBindings.listOfMeters([]);
                            myBindings.listOfMeters(updatedList);
                            myBindings.$page.setInactiveMeterCount();
                        }
                    },
                    windowOpenedCallback = function () {
                        windowRef.pointLookup.MODE = 'select';
                        windowRef.pointLookup.init(pointSelectedCallback, {
                            name2: meterObject.displayedMeterName,
                            name3: "*SUM*"
                        });
                    };

                meterObjIndex = meterObjectIndex;
                columnOriginalUpi = upi;
                meterPointIndex = columnsRowIndex;
                updatedList = myBindings.listOfMeters();
                meterObject = updatedList[meterObjectIndex];

                windowRef = tou.workspaceManager.openWindowPositioned(url, 'Select Point', '', '', 'Select Dynamic Point', {
                    callback: windowOpenedCallback,
                    width: 1000
                });
            },
            changeMeterPoint: function (data, element) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].metersBindings,
                    upi = parseInt(element.currentTarget.getAttribute("upi"), 10),
                    meterIndex = parseInt(element.currentTarget.getAttribute("parentIndex"), 10),
                    meterPointIndex = parseInt(element.currentTarget.getAttribute("meterPointIndex"), 10);

                myBindings.openPointSelector(meterIndex, meterPointIndex, upi);
            },
            showPointReview: function (data) {
                var openWindow = tou.workspaceManager.openWindowPositioned,
                    pointTypesUtility = tou.workspaceManager.config.Utility.pointTypes,
                    pointType = data.pointType,
                    endPoint,
                    upi = parseInt(data.upi, 10),
                    options = {
                        width: 850,
                        height: 600
                    };
                endPoint = pointTypesUtility.getUIEndpoint(pointType, upi);
                if (endPoint) {
                    openWindow(endPoint.review.url, data.meterPointName, pointType, endPoint.review.target, upi, options);
                } else {
                    //  handle a bad UPI reference
                }
            },
            save: function () {
                var self = this,
                    utilityNameShort = this.$page.utilityNameShort,
                    theMeterObjects = self.listOfMeters(),
                    $errormessage = $('.' + utilityNameShort + ' .meters .errormessage'),
                    validate = function () {
                        var meterNames = [],
                            i;

                        self.$metersTbody.find('tr.meterdata').each(function (index, element) {
                            $(element).addClass("faded");
                        });
                        self.$metersTbody.find('.nameerror').each(function (index, element) {
                            $(element).removeClass("nameerror");
                        });

                        // check for blank names
                        for (i = 0; i < theMeterObjects.length; i++) {
                            if (theMeterObjects[i].displayedMeterName.trim() === "") {
                                return {
                                    blankmetername: true,
                                    locationA: i
                                };
                            }
                        }
                        // check for duplicate names
                        for (i = 0; i < theMeterObjects.length; i++) {
                            if (meterNames[theMeterObjects[i].displayedMeterName] === undefined) {
                                meterNames[theMeterObjects[i].displayedMeterName] = i;
                            } else {
                                return {
                                    duplicateMeterName: true,
                                    locationA: meterNames[theMeterObjects[i].displayedMeterName],
                                    locationB: i
                                };
                            }
                        }

                        // more error check could go here
                        return undefined;
                    },
                    errorFound = validate(),
                    field1,
                    field2;

                $errormessage.html("");

                if (errorFound) {
                    if (errorFound.duplicateMeterName === true) {
                        field1 = "." + utilityNameShort + " .meters tr.meterdata:eq(" + (errorFound.locationA) + ") td:eq(1) input";
                        field2 = "." + utilityNameShort + " .meters tr.meterdata:eq(" + (errorFound.locationB) + ") td:eq(1) input";
                        $(field1).addClass("nameerror");
                        $(field1).parent().parent().removeClass("faded");
                        $(field1).focus();
                        $(field2).addClass("nameerror");
                        $(field2).parent().parent().removeClass("faded");
                        $errormessage.html("Duplicate meter Names for '" + $(field1)[0].value + "'");
                    } else if (errorFound.blankmetername === true) {
                        field1 = "." + utilityNameShort + " .meters tr.meterdata:eq(" + (errorFound.locationA) + ") td:eq(1) input";
                        $(field1).addClass("nameerror");
                        $(field1).parent().parent().removeClass("faded");
                        $(field1).focus();
                        $errormessage.html("Meter Name is BLANK");
                    }
                } else {
                    $('.' + utilityNameShort + ' .meters table tbody .faded').each(function (index, element) {
                        $(element).removeClass("faded");
                    });

                    tou.saveUtility(self.$page.utilityName, {
                        'Meters': theMeterObjects
                    }, function (response) {
                        if (response.message && response.message === 'success') {
                            tou.currUtility.Meters = self.$page.rawUtility.Meters = theMeterObjects;

                            tou.fire('meterssaved', tou.currUtility.utilityName);

                            self.listOfMeters([]);
                            self.listOfMeters(tou.currUtility.Meters);
                            self.metersSortOrderNone = [];
                            self.$page.setInactiveMeterCount();
                            self.isInEditMode(false);
                            self.initSortable();
                        } else {
                            tou.alert(tou.saveErrorText);
                        }
                    });
                }
            }
        }
    }, {
        title: 'Data Store',
        shortTitle: 'datastore',
        isActive: ko.observable(false),
        background: 'woodbackgroundtile.jpg',
        listOfMonthYears: [],
        blockCount: 0,
        topBarDropDownStates: [],
        topBarEditButtonStates: [],
        init: function () {
            var self = this,
                classPrefix = '.' + self.utilityNameShort,
                addDropDownHandlers = function (selector) {
                    var $el = $(selector),
                        $dropdown = $el.find('.dropdown-menu'),
                        $input = $el.find('input');

                    // Automatically focus the search box when the drop-down is activated
                    $el.click(function (e) {
                        // Delay the focus for drop down transition to finish
                        window.setTimeout(function () {
                            // If we're scrolled to the top of the list
                            if ($dropdown.scrollTop() === 0) {
                                $input.focus();
                            }
                        }, 50);
                    });

                    // Prevent the drop-down from closing when selecting the search input
                    $input.click(function (e) {
                        e.stopPropagation();
                    });
                },
                postInit = function (utilityName) {
                    if (utilityName === self.utilityName) {
                        // Init our list of available periods
                        self.listOfMonthYears = ko.utils.arrayFilter(tou.availablePeriods[utilityName], function (availablePeriod) {
                            return availablePeriod.period === 'Month';
                        });
                        // Kick this observable to make our filtered list populate
                        self.bindings.datastoreDateFilter.valueHasMutated();

                        // Update list of meters. Our filtered list is listening to this observable so it should force our list to update
                        self.bindings.listOfMeters([]);
                        self.bindings.listOfMeters(tou.getMeters());

                        // Default select the first month - this must be located after the data store inits or JS thorws an error
                        self.bindings.monthSelected(self.listOfMonthYears[0]);

                        // Update config required (checks for missing periods or meters)
                        self.bindings.configRequired((self.listOfMonthYears.length === 0) || (self.bindings.listOfMeters().length === 0));
                    }
                },
                isFloatRexEx = /^\-?\d+((\.)\d+)?$/,
                numberIsFloat = function (s) {
                    return String(s).search(isFloatRexEx) != -1;
                },
                inputErrors = function () {
                    return (self.bindings.$datastoreContent.find(".error").length > 0);
                };

            $.extend(self.bindings, {
                $mainContent: $('.' + self.utilityNameShort + ' .dataStoreMainContent'),
                $dataStoreTable: $('.' + self.utilityNameShort + ' .datastoreTable'),
                $datastoreContent: $('.' + self.utilityNameShort + ' .dataStoreContent'),
                $topBarControls: $('.' + self.utilityNameShort + ' .dataStoreTopBar').find('button'),
                $datastoreGettingData: $('.' + self.utilityNameShort + ' .dataStoreGettingData'),
                $datastoreSaveButton: $('.' + self.utilityNameShort + ' .dataStoreTopBar .btn-success')
            });

            self.bindings.$dataStoreTable.on('click', 'tbody .inlineedit', function (e) {
                var $parentTD = $(this).parent();

                $(this).keyup(function () {
                    var $pagination = self.bindings.$datastoreContent.find('.dataTables_paginate');

                    if (this.value != "") {
                        if (numberIsFloat(this.value)) {
                            $(this).removeClass("error");
                            if (!inputErrors()) {
                                $pagination.show();
                                self.bindings.$datastoreSaveButton.prop( "disabled", false );
                            }
                            $parentTD.addClass("datachanged");
                            $parentTD.attr("title", "");
                        } else {
                            $pagination.hide();
                            self.bindings.$datastoreSaveButton.prop( "disabled", true );

                            $(this).addClass("error");
                            $(this).focus();
                            $parentTD.attr("title", "'" + this.value + "' is not a valid number");
                        }
                    } else {
                        $(this).removeClass("error");
                        if (!inputErrors()) {
                            $pagination.show();
                            self.bindings.$datastoreSaveButton.prop( "disabled", false );
                        }
                    }
                });
            });

            self.bindings.$dataStoreTable.on('change', 'tbody .inlineedit', function (e) {
                var $parentTD = $(this).parent();
                    $parentTD.addClass("datachanged");
            });

            //self.bindings.$dataStoreTable.on( 'page.dt', function () {
            //    var pageNumber = self.bindings.$dataStoreTable.DataTable().page();
            //});

            $(window).resize(function () {
                self.bindings.handleResize(self);
            });

            self.bindings.initDatastoreDataTable([]);
            self.bindings.$datastoreContent.hide();

            postInit(self.utilityName);

            addDropDownHandlers(classPrefix + ' .dataStoreTopBar .availablePeriodsContainer');
            addDropDownHandlers(classPrefix + ' .dataStoreTopBar .availableMetersContainer');

            tou.on('meterssaved', function (utilityName) {
                postInit(utilityName);
            });
            tou.on('ratetablesaved', function (utilityName) {
                postInit(utilityName);
            });
        },
        bindings: {
            backgroundImage: ko.observable('/woodbackground.jpg'),
            errorWithRequest: ko.observable(false),
            configRequired: ko.observable(false),
            postingToDataStore: ko.observable(false),
            datastoreDateFilter: ko.observable(""),
            datastoreMeterFilter: ko.observable(""),
            activePage: ko.observable(),
            activeUtility: ko.observable(),
            selectedMonthYear: ko.observable(),
            selectedDataType: ko.observable("All Data"),
            selectedMeter: ko.observable(),
            isInEditMode: ko.observable(false),
            listOfAnalogInputs: ko.observableArray(),
            listOfMeters: ko.observableArray(),
            listOfMeterReads: [],
            currentDatatablesPage: 1,
            listOfDataTypes: ["All Data", "Missing Data"],
            resizeTimer: 500,
            lastResize: null,
            handleResize: function (self) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].datastoreBindings;
                myBindings.lastResize = new Date();
                setTimeout(function () {
                    if (new Date() - myBindings.lastResize >= myBindings.resizeTimer) {
                        $('.' + self.utilityNameShort + ' .dataTables_scrollBody').css('height', (window.innerHeight - 210));
                        self.bindings.$dataStoreTable.dataTable().fnAdjustColumnSizing();
                    }
                }, myBindings.resizeTimer);
            },
            setBlockState: function (blockingState) {
                var $page = this.$page,
                    classPrefix = '.' + $page.utilityNameShort,
                    $dataStore = $(classPrefix + ' .dataStoreContent'),
                    $gettingData = $(classPrefix + ' .dataStoreGettingData'),
                    $topBarDropDownButtons = $(classPrefix + ' .dataStoreTopBar .dropdown button'),
                    $topBarEditButtons = $(classPrefix + ' .dataStoreTopBar .buttonBar button').not('.dataStoreEditButton'),
                    topBarDropDownStates = this.$page.topBarDropDownStates,
                    topBarEditButtonStates = this.$page.topBarEditButtonStates,
                    saveButtonStates = function () {
                        var save = function ($buttons, statesArray) {
                            $buttons.each(function (i) {
                                var disabledState = $(this).attr('disabled');
                                if (disabledState === undefined) {
                                    disabledState = false;
                                }
                                statesArray[i] = disabledState;
                            });
                        };
                        save($topBarDropDownButtons, topBarDropDownStates);
                        save($topBarEditButtons, topBarEditButtonStates);
                    },
                    restoreButtonStates = function () {
                        var restore = function ($buttons, statesArray) {
                            $buttons.each(function (i) {
                                var disabledState = statesArray[i];
                                $(this).attr('disabled', disabledState);
                            });
                        };
                        restore($topBarDropDownButtons, topBarDropDownStates);
                        restore($topBarEditButtons, topBarEditButtonStates);
                    },
                    disableButtons = function ($buttons) {
                        $buttons.each(function (i) {
                            $(this).attr('disabled', true);
                        });
                    };

                // This routine was being called with set blocking true multiple times, causing the restore state of the buttons
                // to get screwed up. So we implemented a block counter, and only save the state of the buttons the first time.
                // Unblock always resets the counter and unblocks because it is not called the same numer of times as block.
                if (blockingState === true) {
                    // Don't save button states if block has already been called
                    if (++$page.blockCount === 1) {
                        saveButtonStates();
                    }
                    // We always disable the drop down buttons
                    disableButtons($topBarDropDownButtons);
                    // If we're not in edit mode
                    if (this.isInEditMode() === false) {
                        // Disable save/dit buttons
                        disableButtons($topBarEditButtons);
                        // Hide the data store and show getting data spinner
                        $dataStore.hide();
                        $gettingData.show();
                    }
                } else {
                    // Reset our block counter
                    $page.blockCount = 0;
                    // If the showMeterSelectMessage flag is true, it means the user must select a meter before results can be displayed
                    if (this.showMeterSelectMessage() === false) {
                        $dataStore.show();
                        // JDR - saw problems with the table header cells not rendering proportionally with the table body cells. This corrects that.
                        this.$dataStoreTable.dataTable().fnDraw(false);
                    }
                    $gettingData.hide();
                    restoreButtonStates();
                }
            },
            block: function () {
                this.setBlockState(true);
            },
            unblock: function () {
                this.setBlockState(false);
            },
            initDatastoreDataTable: function (gridData) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].datastoreBindings,
                    insertInputfield = function (tdField) {
                        var html = $(tdField).html(),
                            initialValue = html,
                            myInput;
                        myInput = $('<span class="hideInEdit">' + initialValue + '</span><input class="inlineedit form-control showInEdit" style="width: 150px; color: red" type="text" />');
                        // If the initial value is a number, i.e. it's not Missing'
                        if ($.isNumeric(initialValue) === true) {
                            myInput.val(initialValue);
                        }
                        $(tdField).html(myInput);
                    },
                    setTdClasses = function (tdField, meterPointAttribs) {
                        if (meterPointAttribs.missingData === true) {
                            $(tdField).addClass("missingdata");
                            $(tdField).addClass("editable");
                            insertInputfield(tdField);
                        }
                        if (meterPointAttribs.userEdited === true) {
                            $(tdField).addClass("useredited");
                            $(tdField).addClass("editable");
                            insertInputfield(tdField);
                        }
                    },
                    gridOptions = {
                        showGroupPanel: false,
                        keepLastSelected: false,
                        scrollY: (window.innerHeight - 210) + "px",
                        processing: true,
                        data: ko.observableArray(gridData),
                        "fnCreatedRow": function (nRow, aData, iDataIndex) {
                            $(nRow).attr('timestamp', aData.meterStart);
                        },
                        aoColumns: [{
                            "title": "Date",
                            "mData": "monthDay",
                            "className": "dt-head-center"
                        }, {
                            "title": "Time",
                            "mData": "time",
                            "className": "dt-head-center"
                        }, {
                            "title": "Consumption (MWh)",
                            "mData": "consumption.meterReadValue",
                            "className": "dt-head-right",
                            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                $(nTd).attr('colIndex', iCol);
                                $(nTd).addClass("dt-body-right");
                                setTdClasses(nTd, oData.consumption);
                            },
                            //"mRender": function (data, type, full) {
                            //    console.log(" - - data = ", data);
                            //}
                        }, {
                            "title": "Demand (MW)",
                            "mData": "demand.meterReadValue",
                            "className": "dt-head-right",
                            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                $(nTd).attr('colIndex', iCol);
                                $(nTd).addClass("dt-body-right");
                                setTdClasses(nTd, oData.demand);
                            }
                        }, {
                            "title": "Reactive (MVAR)",
                            "mData": "reactive.meterReadValue",
                            "className": "dt-head-right",
                            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                $(nTd).attr('colIndex', iCol);
                                $(nTd).addClass("dt-body-right");
                                setTdClasses(nTd, oData.reactive);
                            }
                        }],
                        multiSelect: false,
                        pageLength: 48,
                        bLengthChange: false,
                        bSort: false,
                        displaySelectionCheckbox: false,
                        canSelectRows: false,
                        selectedItems: ko.observableArray(),
                        footerVisible: false,
                        rowHeight: 30,
                        bFilter: false,  // search box
                        showColumnMenu: false,
                        showFilter: false
                    };

                this.$dataStoreTable.DataTable(gridOptions);
            },
            displayMissingData: function (data) {
                var theMeter,
                    missingDataRow,
                    missingMeterReads = [];

                if (data[0].results && data[0].results.missingData) {
                    var i,
                        meterStart,
                        lenResult = data[0].results.missingData[0].length,
                        upis = data[0].upis,
                        consumptionIndex,
                        consumptionRead,
                        demandIndex,
                        demandRead,
                        reactiveIndex,
                        reactiveRead,
                        getMeterpointIndex = function (pointUpi) {
                            var index;
                            for (i = 0; i < upis.length; i++) {
                                if (upis[i] === pointUpi) {
                                    index = i;
                                    break;
                                }
                            }
                            return index;
                        };

                    theMeter = this.selectedMeter();
                    consumptionIndex = getMeterpointIndex(tou.retrieveMeterPoint(theMeter, "Consumption").upi);
                    demandIndex = getMeterpointIndex(tou.retrieveMeterPoint(theMeter, "Demand").upi);
                    reactiveIndex = getMeterpointIndex(tou.retrieveMeterPoint(theMeter, "Reactive").upi);

                    for (i = 0; i < lenResult; i++) {
                        missingDataRow = data[0].results.missingData[0][i];
                        meterStart = missingDataRow.timestamp;
                        if (consumptionIndex > -1) {
                            consumptionRead = missingDataRow.columns[consumptionIndex].Value;
                        }
                        if (demandIndex > -1) {
                            demandRead = missingDataRow.columns[demandIndex].Value;
                        }
                        if (reactiveIndex > -1) {
                            reactiveRead = missingDataRow.columns[reactiveIndex].Value;
                        }

                        missingMeterReads.push({
                            meterDate: moment.unix(meterStart, "X").format(),
                            monthDay: moment.unix(meterStart).format('M/DD'),
                            time: moment.unix(meterStart).format('h:mm a'),
                            meterStart: meterStart,
                            consumption: {
                                meterReadValue: (isNaN(consumptionRead) ? "-" : (missingDataRow.columns[consumptionIndex].missingData ? "Missing" : consumptionRead)),
                                missingData: isNaN(consumptionRead) ? false : missingDataRow.columns[consumptionIndex].missingData,
                                userEdited: isNaN(consumptionRead) ? false : missingDataRow.columns[consumptionIndex].userEdited
                            },
                            demand: {
                                meterReadValue: (isNaN(demandRead) ? "-" : (missingDataRow.columns[demandIndex].missingData ? "Missing" : demandRead)),
                                missingData: isNaN(demandRead) ? false : missingDataRow.columns[demandIndex].missingData,
                                userEdited: isNaN(demandRead) ? false : missingDataRow.columns[demandIndex].userEdited
                            },
                            reactive: {
                                meterReadValue: (isNaN(reactiveRead) ? "-" : (missingDataRow.columns[reactiveIndex].missingData ? "Missing" : reactiveRead)),
                                missingData: isNaN(reactiveRead)  ?  false : missingDataRow.columns[reactiveIndex].missingData,
                                userEdited: isNaN(reactiveRead)  ? false : missingDataRow.columns[reactiveIndex].userEdited
                            }
                        });
                    }
                }
                this.listOfMeterReads = missingMeterReads;
                this.$dataStoreTable.DataTable().rows.add(this.listOfMeterReads).draw();
                this.unblock();
            },
            displayAllData: function (data) {
                if (data[0] !== undefined) {
                    var theMeter,
                        pivotedMeterReads = [],
                        i,
                        meterStart,
                        lenResult = data[0].results.datastore.length,
                        consumptionIndex,
                        consumptionRead,
                        demandIndex,
                        demandRead,
                        reactiveIndex,
                        reactiveRead,
                        newRow,
                        getMeterpointIndex = function (pointUpi) {
                            var index;
                            for (i = 0; i < data.length; i++) {
                                if (data[i].upis[0] === pointUpi) {
                                    index = i;
                                    break;
                                }
                            }
                            return index;
                        };

                    theMeter = this.selectedMeter();
                    consumptionIndex = getMeterpointIndex(tou.retrieveMeterPoint(theMeter, "Consumption").upi);
                    demandIndex = getMeterpointIndex(tou.retrieveMeterPoint(theMeter, "Demand").upi);
                    reactiveIndex = getMeterpointIndex(tou.retrieveMeterPoint(theMeter, "Reactive").upi);

                    for (i = 0; i < lenResult; i++) {
                        if (consumptionIndex > -1) {
                            consumptionRead = data[consumptionIndex].results.datastore[i].columns[0];
                            meterStart = data[consumptionIndex].results.datastore[i].timestamp;
                        }
                        if (demandIndex > -1) {
                            demandRead = data[demandIndex].results.datastore[i].columns[0];
                            meterStart = data[demandIndex].results.datastore[i].timestamp;
                        }
                        if (reactiveIndex > -1) {
                            reactiveRead = data[reactiveIndex].results.datastore[i].columns[0];
                            meterStart = data[reactiveIndex].results.datastore[i].timestamp;
                        }

                        newRow = {
                            meterDate: moment.unix(meterStart, "X").format(),
                            monthDay: moment.unix(meterStart).format('M/DD'),
                            time: moment.unix(meterStart).format('h:mm a'),
                            meterStart: meterStart,
                            // Multiply values by a 1000 to convert from Mega to kil
                            consumption: {
                                meterReadValue: (consumptionRead ? (consumptionRead.missingData ? "Missing" : consumptionRead.Value) : "-"),
                                missingData: consumptionRead ? consumptionRead.missingData : false,
                                userEdited: consumptionRead ? consumptionRead.userEdited : false
                            },
                            demand: {
                                meterReadValue: (demandRead ? (demandRead.missingData ? "Missing" : demandRead.Value) : "-"),
                                missingData: demandRead ? demandRead.missingData : false,
                                userEdited: demandRead ? demandRead.userEdited : false,
                            },
                            reactive: {
                                meterReadValue: (reactiveRead ? (reactiveRead.missingData ? "Missing" : reactiveRead.Value) : "-"),
                                missingData: reactiveRead ? reactiveRead.missingData : false,
                                userEdited: reactiveRead ? reactiveRead.userEdited : false
                            }
                        };

                        pivotedMeterReads.push(newRow);
                    }

                    this.listOfMeterReads = pivotedMeterReads;
                    this.$dataStoreTable.DataTable().rows.add(this.listOfMeterReads).draw();
                }
                this.unblock();
            },
            postToDataStore: function (input, url, callback) {
                var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].datastoreBindings,
                    self = this;
                myBindings.postingToDataStore(true);
                $.ajax({
                    url: url,
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify(input)
                })
                .done (function (returnData) {
                    //console.log(url, "returnData = " + JSON.stringify(returnData));
                    if (callback) {
                        callback.call(self, returnData);
                    }
                })
                .fail ( function (jqXHR, textStatus, errorThrown) {
                    tou.alert(tou.criticalErrorText);
                    myBindings.$datastoreGettingData.hide();
                    myBindings.$topBarControls.attr('disabled', false);
                    myBindings.errorWithRequest(true);
                })
                .always(function () {
                    self.postingToDataStore(false);
                });
            },
            setMetersListWithMissingData: function (data) {
                var lenData,
                    rawListOfMeters = this.$page.rawUtility.Meters,
                    lenRawList = rawListOfMeters.length,
                    meterMissingData,
                    rawMeter,
                    i,
                    j,
                    newList = [];

                for (i = 0; i < lenRawList; i++) { // looping on main list to maintain original sort order
                    rawMeter = rawListOfMeters[i];
                    lenData = data.length;
                    for (j = 0; j < lenData; j++) {
                        meterMissingData = data[j];
                        if (meterMissingData.name === rawMeter.displayedMeterName) {
                            newList.push(rawMeter);
                            data.splice(j, 1);
                            break;
                        }
                    }
                }
                this.listOfMeters(newList);
                this.unblock();
            },
            getMetersWithMissingData: function () {
                if (this.selectedMonthYear()) {
                    var listOfUPIs,
                        reqObj = {},
                        meters = this.$page.rawUtility.Meters,
                        meter,
                        consumptionMeterPoint,
                        demandMeterPoint,
                        reactiveMeterPoint,
                        i,
                        lenMeters = meters.length,
                        selectedPeriod = this.selectedMonthYear();

                    this.listOfMeters([]);
                    this.selectedMeter(null);
                    reqObj.options = {
                        start: parseInt(selectedPeriod.start / 1000, 10),
                        end: parseInt(selectedPeriod.end / 1000, 10)
                    };
                    reqObj.options.meters = [];

                    for (i = 0; i < lenMeters; i++) {
                        listOfUPIs = [];
                        meter = meters[i];
                        consumptionMeterPoint = tou.retrieveMeterPoint(meter, "Consumption");
                        demandMeterPoint = tou.retrieveMeterPoint(meter, "Demand");
                        reactiveMeterPoint = tou.retrieveMeterPoint(meter, "Reactive");
                        if (consumptionMeterPoint.upi && consumptionMeterPoint.upi > 0) {
                            listOfUPIs.push(consumptionMeterPoint.upi);
                        }
                        if (demandMeterPoint.upi && demandMeterPoint.upi > 0) {
                            listOfUPIs.push(demandMeterPoint.upi);
                        }
                        if (reactiveMeterPoint.upi && reactiveMeterPoint.upi > 0) {
                            listOfUPIs.push(reactiveMeterPoint.upi);
                        }

                        if (listOfUPIs.length > 0) {
                            reqObj.options.meters.push({
                                name: meter.displayedMeterName,
                                upis: listOfUPIs
                            });
                        }
                    }

                    if (reqObj.options.meters.length > 0) {
                        this.postToDataStore(reqObj, "/api/meters/getMissingMeters", this.setMetersListWithMissingData);
                    } else {
                        this.unblock();
                    }
                }
            },
            buildMissingDataReqObj: function (startDay, endDay, theMeter, functionType) {
                var listOfUPIs = [],
                    consumptionUpi = tou.retrieveMeterPoint(theMeter, "Consumption").upi,
                    demandUpi = tou.retrieveMeterPoint(theMeter, "Demand").upi,
                    reactiveUpi = tou.retrieveMeterPoint(theMeter, "Reactive").upi,
                    reqObj = {};

                reqObj.options = [];

                if (consumptionUpi > 0) {
                    listOfUPIs.push(consumptionUpi);
                }
                if (demandUpi > 0) {
                    listOfUPIs.push(demandUpi);
                }
                if (reactiveUpi > 0) {
                    listOfUPIs.push(reactiveUpi);
                }

                reqObj.options.push({
                    utilityName: tou.currUtility.utilityName,
                    range: {
                        start: startDay,
                        end: endDay
                    },
                    scale: 'half-hour',
                    fx: functionType,
                    upis: listOfUPIs
                });

                return reqObj;
            },
            buildReqObj: function (startDay, endDay, theMeter, functionType) {
                var consumptionUpi = tou.retrieveMeterPoint(theMeter, "Consumption").upi,
                    demandUpi = tou.retrieveMeterPoint(theMeter, "Demand").upi,
                    reactiveUpi = tou.retrieveMeterPoint(theMeter, "Reactive").upi,
                    reqObj = {};

                reqObj.options = [];

                if (consumptionUpi > 0) {
                    reqObj.options.push({
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            "start": startDay,
                            "end": endDay
                        },
                        scale: 'half-hour',
                        fx: functionType,
                        upis: [consumptionUpi]
                    });
                }
                if (demandUpi > 0) {
                    reqObj.options.push({
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            "start": startDay,
                            "end": endDay
                        },
                        scale: 'half-hour',
                        fx: functionType,
                        upis: [demandUpi]
                    });
                }
                if (reactiveUpi > 0) {
                    reqObj.options.push({
                        utilityName: tou.currUtility.utilityName,
                        range: {
                            "start": startDay,
                            "end": endDay
                        },
                        scale: 'half-hour',
                        fx: functionType,
                        upis: [reactiveUpi]
                    });
                }

                return reqObj;
            },
            getDataStore: function () {
                if (this.selectedMonthYear() && this.selectedMeter()) {
                    this.block();
                    var theMeter,
                        functionType,
                        selectedPeriod = this.selectedMonthYear(),
                        reqObj,
                        startDay,
                        endDay;

                    this.errorWithRequest(false);
                    functionType = (this.selectedDataType() === "Missing Data" ? "missingData" : "datastore");
                    theMeter = this.selectedMeter();
                    startDay = parseInt(selectedPeriod.start / 1000, 10);
                    endDay = parseInt(selectedPeriod.end / 1000, 10);

                    this.listOfMeterReads = [];
                    if (functionType === "missingData") {
                        reqObj = this.buildMissingDataReqObj(startDay, endDay, theMeter, functionType);
                        this.postToDataStore(reqObj, "/api/meters/getUsage", this.displayMissingData);
                    } else {
                        reqObj = this.buildReqObj(startDay, endDay, theMeter, functionType);
                        this.postToDataStore(reqObj, "/api/meters/getUsage", this.displayAllData);
                    }
                }
            },
            setDataStore: function (updatedData) {
                var reqObj = {
                    values: updatedData
                };
                this.postToDataStore(reqObj, "/api/meters/editDatastore");
            },
            setListOfMeters: function () {
                if (this.selectedDataType() === "Missing Data") {
                    this.block();
                    this.getMetersWithMissingData();
                } else {
                    this.listOfMeters(tou.getMeters());
                }
            },
            dataTypeSelected: function (dataType) {
                this.$dataStoreTable.DataTable().clear().draw();
                this.selectedDataType(dataType);
                this.setListOfMeters();
                this.getDataStore();
            },
            meterSelected: function (theMeter) {
                this.$dataStoreTable.DataTable().clear().draw();
                this.selectedMeter(theMeter);
                this.getDataStore();
            },
            monthSelected: function (selectedDate) {
                this.$dataStoreTable.DataTable().clear().draw();
                this.selectedMonthYear(selectedDate);
                this.setListOfMeters();
                this.getDataStore();
            },
            toEditMode: function () {
                this.isInEditMode(true);
                this.block(true);
            },
            cancelEditMode: function () {
                $(this.$dataStoreTable.dataTable().fnGetNodes()).find("td.datachanged").each(function () {
                    var $dataChangedTD = $(this),
                        $input = $dataChangedTD.find('input'),
                        $span = $dataChangedTD.find('span'),
                        spanValue = parseFloat($span.html());

                    if ($.isNumeric(spanValue) === false) {
                        $input.val('');
                    } else {
                        $input.val(spanValue);
                    }
                    $dataChangedTD.removeClass("datachanged");
                });

                $(this.$dataStoreTable.dataTable().fnGetNodes()).find(".error").each(function () {
                    $(this).removeClass("error");
                });

                this.$datastoreContent.find('.dataTables_paginate').show();
                this.isInEditMode(false);
                this.unblock();
            },
            save: function () {
                console.log("save called....");
                this.block();

                var updatedData = [],
                    columnLookup,
                    // since the data isn't bound to the table we need to map columns to meterPoint types
                    indexColumnsBasedOnName = function () {
                        var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].datastoreBindings,
                            result = [],
                            i,
                            $datatable = myBindings.$dataStoreTable.DataTable(),
                            columns = $datatable.columns()[0],
                            columnHeader,
                            columnTitle;

                        for (i = 0; i < columns.length; i++) {
                            columnHeader = $datatable.column(i).header();
                            columnTitle = $($datatable.column(i).header()).html();
                            if (columnTitle.indexOf("Consumption") > -1) {
                                result[i] = "Consumption";
                            } else if (columnTitle.indexOf("Demand") > -1) {
                                result[i] = "Demand";
                            } else if (columnTitle.indexOf("Reactive") > -1) {
                                result[i] = "Reactive";
                            }
                        }

                        return result;
                    };

                columnLookup = indexColumnsBasedOnName();

                $(this.$dataStoreTable.dataTable().fnGetNodes()).find("td.datachanged").each(function () {
                    var myBindings = tou.bindings["utility_" + tou.currUtility.shortName].datastoreBindings,
                        $dataChangedTD = $(this),
                        $input = $dataChangedTD.find('input'),
                        $span = $dataChangedTD.find('span'),
                        $dataChangedRow = $dataChangedTD.parent(),
                        timestampStart = parseInt($dataChangedRow.attr('timestamp'), 10),
                        rawInputValue = parseFloat($input.val()),
                        colIndex = parseInt($dataChangedTD.attr('colindex'), 10),
                        meterReadUPI,
                        userEdited = false,
                        valueType;

                    meterReadUPI = tou.retrieveMeterPoint(myBindings.selectedMeter(), columnLookup[colIndex]).upi;

                    // Make sure input value is a valid number - isNumeric auto converts string number to check for a valid number
                    if ($.isNumeric(rawInputValue)) {

                        // If the data was changed
                        if (rawInputValue !== parseFloat($span.html())) {
                            updatedData.push({
                                upi: meterReadUPI,
                                Value: rawInputValue,
                                timestamp: timestampStart,
                                statusflags: 0
                            });
                            $span.html(rawInputValue);
                            $dataChangedTD.addClass("userEdited");
                        }
                    }

                    $dataChangedTD.removeClass("datachanged");
                });

                this.setDataStore(updatedData);
                this.$datastoreContent.find('.dataTables_paginate').show();
                this.isInEditMode(false);
                this.unblock();
            }
        },
        computedBindings: {
            filteredDatastoreMonthYear: function () {
                var self = this,
                    filter = self.datastoreDateFilter().toLowerCase(),
                    listOfDates = self.$page.listOfMonthYears;

                if (filter === "") {
                    return listOfDates;
                } else {
                    return ko.utils.arrayFilter(listOfDates, function (dateObj) {
                        return dateObj.searchDate.indexOf(filter) > -1;
                    });
                }
            },
            filteredMeters: function () {
                var self = this,
                    filter = self.datastoreMeterFilter().toLowerCase(),
                    meters = self.listOfMeters();


                if (filter === "") {
                    return meters;
                } else {
                    return ko.utils.arrayFilter(meters, function (meterObj) {
                        return meterObj.displayedMeterName.toLowerCase().indexOf(filter) > -1;
                    });
                }
            },
            isEditEnabled: function () {
                var selectedMonthYear = this.selectedMonthYear(),
                    selectedMeter = this.selectedMeter(),
                    postingToDataStore = this.postingToDataStore();
                return !!(selectedMonthYear && selectedMeter) && !postingToDataStore;
            },
            showMeterSelectMessage: function () {
                var selectedMonthYear = !!this.selectedMonthYear(),
                    selectedMeter = !!this.selectedMeter(),
                    listOfMeters = this.listOfMeters(),
                    listOfMonthYears = this.$page.listOfMonthYears,
                    configRequired = this.configRequired();

                // If we have periods and meters, and we have a period selected but don't have a meter selected
                return (listOfMonthYears.length && listOfMeters.length >= 0 && selectedMonthYear && !selectedMeter && !configRequired);
            }
        }
    }, {
        title: 'Import/Export',
        shortTitle: 'export',
        isActive: ko.observable(false),
        background: 'woodbackgroundtile.jpg',
        listOfMonthYears: [],
        init: function () {
            var self = this,
                meters,
                classPrefix = '.' + self.utilityNameShort + ' ',
                addDropDownHandlers = function (selector) {
                    var $el = $(selector),
                        $dropdown = $el.find('.dropdown-menu'),
                        $input = $el.find('input');

                    // Automatically focus the search box when the drop-down is activated
                    $el.click(function (e) {
                        // Delay the focus for drop down transition to finish
                        window.setTimeout(function () {
                            // If we're scrolled to the top of the list
                            if ($dropdown.scrollTop() === 0) {
                                $input.focus();
                            }
                        }, 50);
                    });

                    // Prevent the drop-down from closing when selecting the search input
                    $input.click(function (e) {
                        e.stopPropagation();
                    });
                },
                postInit = function (utilityName) {
                    if (utilityName === self.utilityName) {
                        meters = tou.currUtility.Meters;

                        self.bindings.listOfMeters(meters);
                        // Default select the first meter
                        self.bindings.meterSelected(meters[0]);

                        self.listOfMonthYears = ko.utils.arrayFilter(tou.availablePeriods[self.utilityName], function (availablePeriod) {
                            return availablePeriod.period === 'Month';
                        });
                        self.bindings.selectedMonthYear(self.listOfMonthYears[0] || {
                            prettyDate: "Working..."
                        });
                        // Kick the observable to make our filtered list populate
                        self.bindings.importExportDateFilter.valueHasMutated();
                        // Set export available/not available flag
                        self.bindings.exportAvailable(self.listOfMonthYears.length > 0 && meters.length > 0);
                    }
                };

            postInit(self.utilityName);

            tou.on('meterssaved', function (utilityName) {
                postInit(utilityName);
            });
            tou.on('ratetablesaved', function (utilityName) {
                postInit(utilityName);
            });

            addDropDownHandlers('.exportBody .availablePeriodsContainer');
            addDropDownHandlers('.exportBody .availableMetersContainer');
        },
        bindings: {
            dateFormat: 'MMMM YYYY',
            inAjax: ko.observable(false),
            importExportDateFilter: ko.observable(""),
            importExportMeterFilter: ko.observable(""),
            selectedMonthYear: ko.observable(),
            uploadMethods: ko.observableArray(['1']),
            selectedMeter: ko.observable(),
            listOfMeters: ko.observableArray(),
            upiMap: ko.observableArray([]),
            exportAvailable: ko.observable(true),
            changeMonth: function (e) {
                this.selectedMonthYear(e);
            },
            meterSelected: function (theMeter) {
                if (!!theMeter) {
                    this.selectedMeter(theMeter);
                    this.upiMap(theMeter && theMeter.meterPoints);
                }
            },
            downloadCsv: function () {
                var selectedMonthYear = this.selectedMonthYear(),
                    self = this;
                self.inAjax(true);



                $.ajax({
                    url: '/api/meters/exportCSV',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        options: {
                            range: {
                                start: parseInt(selectedMonthYear.start / 1000, 10),
                                end: parseInt(selectedMonthYear.end / 1000, 10)
                            },
                            upiMap: self.upiMap(),
                            meterName: self.selectedMeter().displayedMeterName
                        }
                    }
                }).done(function (response) {
                    if (response.err) {
                        tou.alert('The file could not be downloaded because the server encountered an error. Please try again.');
                    } else {
                        window.open('/api/meters/downloadCsv?path=' + response.path);
                    }
                }).fail(function () {
                    tou.alert(tou.criticalErrorText);
                }).always(function () {
                    self.inAjax(false);
                });

                return false;
            },
            uploadCsv: function (files, e) {
                var self = this,
                    methods = 0,
                    uploadErrorText = 'The file could not be uploaded because the server encountered an error. Please try again.',
                    msg,
                    data,
                    file = files[0],
                    fileExtension,
                    resetForm = function () {
                        // This solution from http://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery/13351234#13351234
                        $fileInput = $('.' + self.$page.utilityNameShort + ' input.uploadBtn');
                        $fileInput.closest('form').get(0).reset();
                    };

                this.uploadMethods().forEach(function (method) {
                    methods += parseInt(method, 10);
                });

                if (!!file) {
                    // Check for a valid file extension before submitting to the server
                    fileExtension = file.name.split('.').pop();
                    if (fileExtension.toLowerCase() !== 'csv') {
                        tou.alert('The selected file is not in the correct format. Only CSV files are supported.');
                        // Don't reset the form so the user can see the bad file selected (probably was an accident)
                        return;
                    }

                    self.inAjax(true);
                    data = new FormData();
                    data.append('csv', file);

                    $.ajax({
                        url: '/api/meters/uploadCSV',
                        processData: false,
                        type: 'POST',
                        cache: false,
                        contentType: false,
                        data: data
                    }).done(function (response) {
                        if (response.path) {
                            data = {
                                options: {
                                    methods: methods,
                                    path: response.path
                                }
                            };

                            $.ajax({
                                url: '/api/meters/importCSV',
                                type: 'POST',
                                dataType: 'json',
                                data: data
                            }).done(function (response) {
                                if (response.message && response.message === 'success') {
                                    msg = 'Import Successful. ' + response.updatedCount + ' records were affected.';
                                } else {
                                    msg = uploadErrorText;
                                }
                                tou.alert(msg);
                            }).fail(function () {
                                tou.alert(tou.criticalErrorText);
                            }).always(function () {
                                self.inAjax(false);
                                resetForm();
                            });
                        } else {
                            // If the server has given us a custom error message (i.e. one NOT from mongo or node), display that
                            if (response.err && response.message) {
                                msg = response.message;
                            } else {
                                msg = uploadErrorText;
                            }
                            tou.alert(msg);
                            self.inAjax(false);
                            resetForm();
                        }
                    }).fail(function () {
                        tou.alert(tou.criticalErrorText);
                        self.inAjax(false);
                        resetForm();
                    });
                }
            }
        },
        computedBindings: {
            filteredImportExportMonthYear: function () {
                var self = this,
                    filter = self.importExportDateFilter().toLowerCase(),
                    listOfDates = self.$page.listOfMonthYears;

                if (filter === "") {
                    return listOfDates;
                } else {
                    return ko.utils.arrayFilter(listOfDates, function (period) {
                        return period.searchDate.indexOf(filter) > -1;
                    });
                }
            },
            filteredImportExportMeters: function () {
                var self = this,
                    filter = self.importExportMeterFilter().toLowerCase(),
                    meters = self.listOfMeters();

                if (filter === "") {
                    return meters;
                } else {
                    return ko.utils.arrayFilter(meters, function (meterObj) {
                        return meterObj.displayedMeterName.toLowerCase().indexOf(filter) > -1;
                    });
                }
            }
        }
    }, {
        title: 'Security',
        isActive: ko.observable(false),
        background: 'woodbackgroundtile.jpg',
        adminOnly: true,
        permissionLevels: {
            READ: 1,
            CONTROL: 2,
            ACKNOWLEDGE: 4,
            WRITE: 8
        },
        hasAccess: function (group, level) {
            return !!(group._pAccess & this.permissionLevels[level]);
        },
        getUsersOnPoint: function (self) {
            var usersOnPoint = [],
                groupsOnPoint = self.bindings.groupsOnPoint(),
                allUsers = self.bindings.allUsers(),
                usersProcessed = {},
                isSystemAdmin,
                isGroupAdmin,
                isAdmin,
                userId,
                i,
                len;
            for (i = 0, len = groupsOnPoint.length; i < len; i++) {
                group = groupsOnPoint[i];
                usersInGroup = group.users;
                for (userId in usersInGroup) {
                    user = allUsers[userId];
                    isSystemAdmin = user ? user['System Admin'].Value : false;
                    isGroupAdmin = usersInGroup[userId]["Group Admin"];
                    isAdmin = isSystemAdmin || isGroupAdmin;
                    if (user) {
                        user.canRead |= (group.canRead || isAdmin);
                        user.canWrite |= (group.canWrite || isAdmin);
                        user.canControl |= (group.canControl || isAdmin);
                        user.canAcknowledge |= (group.canAcknowledge || isAdmin);
                        user.isGroupAdmin |= isGroupAdmin;
                    }
                    if (usersProcessed.hasOwnProperty(userId) === false) { // If we haven't processed this user
                        usersProcessed[userId] = true;
                        if (user) {
                            usersOnPoint.push(user);
                        } else {
                            usersOnPoint.push({
                                "_id": userId,
                                "name": userId,
                                "canRead": false,
                                "canWrite": false,
                                "canControl": false,
                                "canAcknowledge": false,
                                'System Admin': {
                                    'Value': false
                                }
                            });
                        }
                    }
                }
            }
            return usersOnPoint;
        },
        init: function () {
            var self = this;
            var deepClone = function (o) {
                if ((o === null) || (typeof (o) !== 'object'))
                    return o;

                var temp = o.constructor();

                for (var key in o) {
                    temp[key] = deepClone(o[key]);
                }
                return temp;
            };

            self.bindings.security(self.rawUtility.Security);
            self.bindings.originalSecurity = deepClone(self.rawUtility.Security);

            self.bindings.usersOnPoint(self.getUsersOnPoint(self));

            var processUserData = function (data) {
                if (data) {
                    for (var i = 0, len = data.length; i < len; i++) {
                        var user = data[i];
                        user.name = user['First Name'].Value + ' ' + user['Last Name'].Value;
                        self.bindings.allUsers()[user._id] = user;
                    }
                }
            };
            var processGroupData = function (data) {
                for (var i = 0, len = data.length; i < len; i++) {
                    var group = data[i],
                        _id = group._id;
                    self.bindings.allGroups()[_id] = {
                        "_id": _id,
                        "name": group["User Group Name"],
                        "canRead": true, // Groups always have read access to points they're assigned to
                        "canWrite": self.hasAccess(group, 'WRITE'),
                        "canControl": self.hasAccess(group, 'CONTROL'),
                        "canAcknowledge": self.hasAccess(group, 'ACKNOWLEDGE'),
                        "users": group.Users
                    };
                }
            };

            $.ajax({
                url: '/api/security/groups/getallgroups',
                contentType: 'application/json',
                type: 'post'
            }).done(function (response) {
                processGroupData(response);
                $.ajax({
                    url: '/api/security/users/getallusers',
                    contentType: 'application/json',
                    type: 'post'
                }).done(function (data) {
                    processUserData(data.Users);
                    self.bindings.security.valueHasMutated();
                }).fail(function(){
                    tou.alert(tou.criticalErrorText);
                });
            }).fail(function(){
                tou.alert(tou.criticalErrorText);
            });
        },
        bindings: {
            originalSecurity: [],
            isInEditMode: ko.observable(false),
            security: ko.observableArray([]),
            user: ko.observable(tou.workspaceManager.user()),
            groups: ko.observableArray([]),
            groupsOnPoint: ko.observableArray([]),
            allGroups: ko.observable({}),
            allUsers: ko.observable({}),
            groupsNotOnPoint: ko.observableArray([]),
            usersOnPoint: ko.observableArray([]),
            editPage: function () {
                var self = this;
                self.isInEditMode(true);
            },
            cancelEdit: function () {
                var self = this;
                self.security(self.originalSecurity);
                self.isInEditMode(false);
            },
            savePage: function () {
                var self = this;
                tou.saveUtility(self.$page.utilityName, {
                    Security: self.security()
                }, function (response) {
                    if (response.message && response.message === 'success') {
                        self.isInEditMode(false);
                    } else {
                        tou.alert(saveErrorText);
                    }
                });
            },
            toggleUsers: function (data, e, el, shown) {
                var $el = e ? $(e.currentTarget) : $(el),
                    $fa = $el.children('.fa'),
                    $users = $el.children('div'),
                    DURATION = 200;

                shown = (shown === undefined) ? ($users.css('display') === 'block') : shown;
                if (shown) {
                    $users.slideUp(DURATION);
                    $fa.removeClass('fa-folder-open');
                    $fa.addClass('fa-folder');
                } else {
                    $users.slideDown(DURATION);
                    $fa.removeClass('fa-folder');
                    $fa.addClass('fa-folder-open');
                }
            },
            toggleAllUsers: function (data, e) {
                var self = this,
                    classPrefix = '.' + this.$page.utilityNameShort + ' ',
                    $el = $(e.currentTarget),
                    $fa = $el.children('.fa'),
                    $groups = $(classPrefix + 'tbody .group'),
                    shown = $fa.hasClass('fa-folder-open') ? true : false;

                $groups.each(function (index, el) {
                    self.toggleUsers(undefined, undefined, el, shown);
                });
                if ($fa.hasClass('fa-folder')) {
                    $fa.removeClass('fa-folder');
                    $fa.addClass('fa-folder-open');
                } else {
                    $fa.removeClass('fa-folder-open');
                    $fa.addClass('fa-folder');
                }
            },
            getGroupUsers: function (groupId) {
                var rtnArray = [];
                var allGroups = this.allGroups();
                var allUsers = this.allUsers();

                if (allGroups.hasOwnProperty(groupId)) {
                    var users = allGroups[groupId].users;

                    for (var userId in users) {
                        var name = "",
                            user = allUsers[userId];

                        if (!!user) {
                            var isSystemAdmin = user['System Admin'].Value,
                                isGroupAdmin = users[userId]["Group Admin"],
                                isAdmin = isSystemAdmin || isGroupAdmin;
                            name = user.name;
                            if (isSystemAdmin) {
                                name += '<span class="systemAdmin">(System Admin)</span>';
                            }
                        } else {
                            name = userId;
                        }
                        rtnArray.push(name);
                    }
                }
                return rtnArray.sort();
            },
            getUserName: function (user) {
                var name = user.name;
                if (user['System Admin'].Value) {
                    name += '<span class="systemAdmin">(System Admin)</span>';
                }
                return name;
            },
            addGroup: function (data, group) {
                if (!data.userCanEditPermissions()) return;
                data.security.push(group._id);
            },
            removeGroup: function (data, group) {
                if (!data.userCanEditPermissions()) return;
                data.security.remove(group._id);
            }
        },
        computedBindings: {
            showPermissionsTable: function () {
                return !!this.security().length || this.isInEditMode();
            },
            userCanEditPermissions: function () {
                if (this.user()["System Admin"].Value) return true;

                return false;
            },
            showRemoveGroupIcon: function () {
                return this.userCanEditPermissions() && this.isInEditMode();
            },
            showGroupsNotOnPoint: function () {
                return this.isInEditMode() && this.userCanEditPermissions() && this.groupsNotOnPoint().length;
            },
            showUsers: function () {
                return (!this.isInEditMode() || !this.userCanEditPermissions()) && !!this.usersOnPoint().length;
            },
            buildGroup: function () {
                var _id,
                    group,
                    groupId,
                    user,
                    userId,
                    usersInGroup,
                    security = this.security(), // our main dependency
                    allUsers = this.allUsers(),
                    allGroups = this.allGroups(),
                    groupsOnPoint = [],
                    groupsNotOnPoint = [],
                    usersOnPoint = [],
                    usersProcessed = [],
                    sortFn = function (a, b) {
                        return (a.name == b.name ? 0 : (a.name < b.name ? -1 : 1));
                    };

                // Build groups assigned to this point
                for (var i = 0, len = security.length; i < len; i++) {
                    _id = security[i];
                    group = allGroups[_id];

                    if (group) {
                        groupsOnPoint.push(group);
                    } else {
                        groupsOnPoint.push({
                            "_id": _id,
                            "name": _id,
                            "canRead": false,
                            "canWrite": false,
                            "canControl": false,
                            "canAcknowledge": false,
                            "users": [],
                        });
                    }
                }
                // Sort and update our observable
                this.groupsOnPoint(groupsOnPoint.sort(sortFn));

                // Build groups NOT assigned this point
                // TODO Only get the groups for which the acting user is a group administrator
                for (_id in allGroups) {
                    group = allGroups[_id];
                    if (security.indexOf(_id) == -1) {
                        groupsNotOnPoint.push(group);
                    }
                }
                // Sort and update our observable
                this.groupsNotOnPoint(groupsNotOnPoint.sort(sortFn));

                // Clear all calculated user permissions
                for (_id in allUsers) {
                    user = allUsers[_id];
                    user.canRead =
                        user.canWrite =
                            user.canControl =
                                user.canAcknowledge =
                                    user.isGroupAdmin = false;
                    // User's isGroupAdmin flag is calculated because the user's group admin status is
                    // conditioned based on the groups that are assigned to the point
                }

                usersOnPoint = this.$page.getUsersOnPoint(this.$page);



                // Sort the groups and update our observables
                this.usersOnPoint(usersOnPoint.sort(sortFn));
            }
        }
    }];
};

$(function () {
    setTimeout(function() {
        tou.init();
    }, 1);
});

/*
Page example: {
    title: 'Rate Table', //REQUIRED
    isActive: ko.observable(false), //REQUIRED
    background: 'woodbackgroundtile.jpg', //REQUIRED
    rateTables: {}, //variables for the page can be accessed via 'this' in init
    modalTemplates: {//object containing knockout bindings and default values
        electricityRatePeriod: {//key is the touModal property aka toumodal: electricityRatePeriod
            title: 'Test Title',
            season: '',
            dateFrom: '',
            dateTo: '',
            daySunday: false,
            dayMonday: false,
            dayTuesday: false,
            dayWednesday: false,
            dayThursday: false,
            dayFriday: false,
            daySaturday: false,
            timeFrom: '',
            timeTo: '',
            seasonName: '',
            testArray: [1, 2],
            testBlankArray: []
        },
        electricityAddRateElement: {
            type: 'demand',
            peak: 'on'
        }
    },
    bindings: {//bindings for the page (not in the modal, typically functions)
        isEditMode: ko.observable(false),
        toEditMode: function() {
            this.isEditMode(true);
        },
        cancelEditMode: function() {
            this.isEditMode(false);//will need checks for unsaved changes
        },
        save: function() {
            this.isEditMode(false);
        }
    }
}
*/


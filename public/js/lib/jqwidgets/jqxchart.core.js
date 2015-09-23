/*
jQWidgets v3.4.0 (2014-June-23)
Copyright (c) 2011-2014 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.jqx.jqxWidget("jqxChart", "", {});

    $.extend($.jqx._jqxChart.prototype,
    {
        defineInstance: function () {
            var settings = {
                title: 'Title',
                description: 'Description',
                source: [],
                seriesGroups: [],
                categoryAxis: null,
                xAxis: {},
                renderEngine: '',
                enableAnimations: true,
                enableAxisTextAnimation: false,
                backgroundImage: '',
                background: '#FFFFFF',
                padding: { left: 5, top: 5, right: 5, bottom: 5 },
                backgroundColor: '#FFFFFF',
                showBorderLine: true,
                borderLineWidth: 1,
                borderLineColor: null,
                borderColor: null,
                titlePadding: { left: 5, top: 5, right: 5, bottom: 10 },
                showLegend: true,
                legendLayout: null,
                enabled: true,
                colorScheme: 'scheme01',
                animationDuration: 500,
                showToolTips: true,
                toolTipShowDelay: 500,
                toolTipDelay: 500,
                toolTipHideDelay: 4000,
                toolTipFormatFunction: null,
                columnSeriesOverlap: false,
                rtl: false,
                legendPosition: null,
                greyScale: false,
                axisPadding: 5,
                enableCrosshairs: false,
                crosshairsColor: '#888888',
                crosshairsDashStyle: '2,2',
                crosshairsLineWidth: 1.0,
                enableEvents: true,
                _itemsToggleState: [],
                _isToggleRefresh: false,
                drawBefore: null,
                draw: null
            };

            $.extend(true, this, settings);
        },

        _touchEvents: {
            'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
            'click': $.jqx.mobile.getTouchEventName('touchstart'),
            'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
            'mousemove': $.jqx.mobile.getTouchEventName('touchmove'),
            'mouseenter': 'mouseenter',
            'mouseleave': 'mouseleave'
        },

        _getEvent: function (event) {
            if (this._isTouchDevice) {
                return this._touchEvents[event];
            } else {
                return event;
            }
        },

        createInstance: function (args) {
            if (!$.jqx.dataAdapter)
                throw 'jqxdata.js is not loaded';

            var self = this;
            self._refreshOnDownloadComlete();
            self._isTouchDevice = $.jqx.mobile.isTouchDevice();

            self.host.on(self._getEvent('mousemove'), function (event) {
                if (self.enabled == false)
                    return;

                event.preventDefault();
                var x = event.pageX || event.clientX || event.screenX;
                var y = event.pageY || event.clientY || event.screenY;

                if (self._isTouchDevice) {
                    var pos = $.jqx.position(event);
                    x = pos.left;
                    y = pos.top;
                }

                var pos = self.host.offset();
                x -= pos.left;
                y -= pos.top;

                self.onmousemove(x, y);
            });

            self.addHandler(self.host, self._getEvent('mouseleave'), function (event) {
                if (self.enabled == false)
                    return;

                var x = self._mouseX;
                var y = self._mouseY;

                var rect = self._plotRect;

                if (rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height)
                    return;

                self._cancelTooltipTimer();
                self._hideToolTip(0);
                self._unselect();
            });

            self.addHandler(self.host, 'click', function (event) {
                if (self.enabled == false)
                    return;

                if (!isNaN(self._lastClickTs)) {
                    if ((new Date()).valueOf() - self._lastClickTs < 100)
                        return;
                }

                this._hostClickTimer = setTimeout(function () {
                    if (!self._isTouchDevice) {
                        self._cancelTooltipTimer();
                        self._hideToolTip();
                        self._unselect();
                    }

                    if (self._pointMarker && self._pointMarker.element) {
                        var group = self.seriesGroups[self._pointMarker.gidx];
                        var serie = group.series[self._pointMarker.sidx];
                        self._raiseItemEvent('click', group, serie, self._pointMarker.iidx);
                    }
                },
                100);
            });

            var elementStyle = self.element.style;
            if (elementStyle) {
                var sizeInPercentage = false;
                if (elementStyle.width != null)
                    sizeInPercentage |= elementStyle.width.toString().indexOf('%') != -1;

                if (elementStyle.height != null)
                    sizeInPercentage |= elementStyle.height.toString().indexOf('%') != -1;

                if (sizeInPercentage) {
                    $(window).resize(function () {
                        if (self.timer)
                            clearTimeout(self.timer);

                        var delay = $.jqx.browser.msie ? 200 : 1;
                        self.timer = setTimeout(function () {
                            var tmp = self.enableAnimations;
                            self.enableAnimations = false;
                            self.refresh();
                            self.enableAnimations = tmp;
                        }, delay);
                    });
                }
            }
        }, // createInstance

        /** @private */
        _refreshOnDownloadComlete: function () {
            var self = this;
            var source = this.source;
            if (source instanceof $.jqx.dataAdapter) {
                var adapteroptions = source._options;
                if (adapteroptions == undefined || (adapteroptions != undefined && !adapteroptions.autoBind)) {
                    source.autoSync = false;
                    source.dataBind();
                }

                var elementId = this.element.id;
                if (source.records.length == 0) {
                    var updateFunc = function () {
                        // sends a callback function to the user. This allows him to add additional initialization logic before the chart is rendered.
                        if (self.ready)
                            self.ready();

                        self.refresh();
                    }

                    source.unbindDownloadComplete(elementId);
                    source.bindDownloadComplete(elementId, updateFunc);
                }
                else {
                    // sends a callback function to the user. This allows him to add additional initialization logic before the chart is rendered.
                    if (self.ready)
                        self.ready();
                }

                source.unbindBindingUpdate(elementId);
                source.bindBindingUpdate(elementId, function () {
                    self.refresh();
                });
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (this.isInitialized == undefined || this.isInitialized == false)
                return;

            if (key == 'source')
                this._refreshOnDownloadComlete();

            this.refresh();
        },

        /** @private */
        _initRenderer: function (host) {
            if (!$.jqx.createRenderer)
                throw 'Please include a reference to jqxdraw.js';

            return $.jqx.createRenderer(this, host);
        },

        /** @private */
        _internalRefresh: function () {
            var self = this;

            // validate visiblity
            if ($.jqx.isHidden(self.host))
                return;

            self._stopAnimations();

            if (!self.renderer || (!self._isToggleRefresh && !self._isUpdate)) {
                self.host.empty();
                self._ttEl = undefined;

                self._initRenderer(self.host);
            }

            var renderer = self.renderer;
            if (!renderer)
                return;

            var rect = renderer.getRect();

            self._render({ x: 1, y: 1, width: rect.width, height: rect.height });

            if (renderer instanceof $.jqx.HTML5Renderer)
                renderer.refresh();

            self._isUpdate = false;
        },

        saveAsPNG: function (filename, exportServer, isUploadOnly) {
            return this._saveAsImage('png', filename, exportServer, isUploadOnly);
        },

        saveAsJPEG: function (filename, exportServer, isUploadOnly) {
            return this._saveAsImage('jpeg', filename, exportServer, isUploadOnly);
        },

        /** @private */
        _saveAsImage: function (type, fileName, exportServer, isUploadOnly) {
            return $.jqx._widgetToImage(this, type, fileName, exportServer, isUploadOnly);
        },

        refresh: function () {
            this._internalRefresh();
        },

        update: function () {
            this._isUpdate = true;
            this._internalRefresh();
        },

        /** @private */
        _seriesTypes: [
            'line', 'stackedline', 'stackedline100',
            'spline', 'stackedspline', 'stackedspline100',
            'stepline', 'stackedstepline', 'stackedstepline100',
            'area', 'stackedarea', 'stackedarea100',
            'splinearea', 'stackedsplinearea', 'stackedsplinearea100',
            'steparea', 'stackedsteparea', 'stackedsteparea100',
            'rangearea', 'splinerangearea', 'steprangearea',
            'column', 'stackedcolumn', 'stackedcolumn100', 'rangecolumn',
            'scatter', 'stackedscatter', 'stackedscatter100',
            'bubble', 'stackedbubble', 'stackedbubble100',
            'pie',
            'donut'],

        /** @private */
        _render: function (rect) {
            var self = this;
            var renderer = self.renderer;

            self._colorsCache.clear();

            if (!self._isToggleRefresh && self._isUpdate && self._renderData)
                self._renderDataClone();

            self._renderData = [];

            renderer.clear();
            self._unselect();
            self._hideToolTip(0);

            var bckgImg = self.backgroundImage;
            if (bckgImg == undefined || bckgImg == '')
                self.host.css({ 'background-image': '' });
            else
                self.host.css({ 'background-image': (bckgImg.indexOf('(') != -1 ? bckgImg : "url('" + bckgImg + "')") });

            self._rect = rect;

            var padding = self.padding || { left: 5, top: 5, right: 5, bottom: 5 };

            var clipAll = renderer.createClipRect(rect);
            var groupAll = renderer.beginGroup();
            renderer.setClip(groupAll, clipAll);

            var rFill = renderer.rect(rect.x, rect.y, rect.width - 2, rect.height - 2);

            if (bckgImg == undefined || bckgImg == '')
                renderer.attr(rFill, { fill: self.backgroundColor || self.background || 'white' });
            else
                renderer.attr(rFill, { fill: 'transparent' });

            if (self.showBorderLine != false) {
                var borderColor = self.borderLineColor == undefined ? self.borderColor : self.borderLineColor;
                if (borderColor == undefined)
                    borderColor = '#888888';

                var borderLineWidth = this.borderLineWidth;
                if (isNaN(borderLineWidth) || borderLineWidth < 0 || borderLineWidth > 10)
                    borderLineWidth = 1;

                renderer.attr(rFill, { 'stroke-width': borderLineWidth, stroke: borderColor });
            }

            // Invoke user-defined drawing
            if ($.isFunction(self.drawBefore)) {
                self.drawBefore(renderer, rect);
            }

            var paddedRect = { x: padding.left, y: padding.top, width: rect.width - padding.left - padding.right, height: rect.height - padding.top - padding.bottom };
            self._paddedRect = paddedRect;
            var titlePadding = self.titlePadding || { left: 2, top: 2, right: 2, bottom: 2 };
            if (self.title && self.title.length > 0) {
                var cssTitle = self.toThemeProperty('jqx-chart-title-text', null);
                var sz = renderer.measureText(self.title, 0, { 'class': cssTitle });
                renderer.text(self.title, paddedRect.x + titlePadding.left, paddedRect.y + titlePadding.top, paddedRect.width - (titlePadding.left + titlePadding.right), sz.height, 0, { 'class': cssTitle }, true, 'center', 'center');
                paddedRect.y += sz.height;
                paddedRect.height -= sz.height;
            }
            if (self.description && self.description.length > 0) {
                var cssDesc = self.toThemeProperty('jqx-chart-title-description', null);
                var sz = renderer.measureText(self.description, 0, { 'class': cssDesc });
                renderer.text(self.description, paddedRect.x + titlePadding.left, paddedRect.y + titlePadding.top, paddedRect.width - (titlePadding.left + titlePadding.right), sz.height, 0, { 'class': cssDesc }, true, 'center', 'center');

                paddedRect.y += sz.height;
                paddedRect.height -= sz.height;
            }

            if (self.title || self.description) {
                paddedRect.y += (titlePadding.bottom + titlePadding.top);
                paddedRect.height -= (titlePadding.bottom + titlePadding.top);
            }

            var plotRect = { x: paddedRect.x, y: paddedRect.y, width: paddedRect.width, height: paddedRect.height };

            // build stats
            self._buildStats(plotRect);

            var isPieOnly = self._isPieOnlySeries();

            var seriesGroups = self.seriesGroups;

            // axis validation
            var hashCatAxis = {};
            for (var i = 0; i < seriesGroups.length && !isPieOnly; i++) {
                if (seriesGroups[i].type == 'pie' || seriesGroups[i].type == 'donut')
                    continue;

                var swap = seriesGroups[i].orientation == 'horizontal';
                var sgvx = seriesGroups[i].valueAxis;
                if (!sgvx) {
                    // define empty value axis
                    sgvx = seriesGroups[i].valueAxis = {};
                    //throw 'seriesGroup[' + i + '] is missing ' + (swap ? 'xAxis' : 'valueAxis') + ' definition';
                }

                var sghx = self._getCategoryAxis(i);
                if (!sghx)
                    throw 'seriesGroup[' + i + '] is missing ' + (!swap ? 'xAxis' : 'valueAxis') + ' definition';

                var catId = sghx == self._getCategoryAxis() ? -1 : i;
                hashCatAxis[catId] = 0x00;
            }

            var axisPadding = self.axisPadding;
            if (isNaN(axisPadding))
                axisPadding = 5;

            // get vertical axis width
            var wYAxis = { left: 0, right: 0, leftCount: 0, rightCount: 0 };
            var wYAxisArr = [];

            for (var i = 0; i < seriesGroups.length; i++) {
                var g = seriesGroups[i];
                if (g.type == 'pie' || g.type == 'donut' || g.spider == true || g.polar == true) {
                    wYAxisArr.push({ width: 0, position: 0, xRel: 0 });
                    continue;
                }

                var swap = g.orientation == 'horizontal';
                var catId = self._getCategoryAxis(i) == self._getCategoryAxis() ? -1 : i;
                var w = sgvx.axisSize;
                var axisR = { x: 0, y: plotRect.y, width: plotRect.width, height: plotRect.height };
                var position = undefined;

                if (!w || w == 'auto') {
                    if (swap) {
                        w = this._renderCategoryAxis(i, axisR, true, plotRect).width;
                        if ((hashCatAxis[catId] & 0x01) == 0x01)
                            w = 0;
                        else if (w > 0)
                            hashCatAxis[catId] |= 0x01;

                        position = self._getCategoryAxis(i).position;
                    }
                    else {
                        w = self._renderValueAxis(i, axisR, true, plotRect).width;
                        if (g.valueAxis)
                            position = g.valueAxis.position;
                    }
                }

                if (position != 'left' && self.rtl == true)
                    position = 'right';
                if (position != 'right')
                    position = 'left';

                if (wYAxis[position + 'Count'] > 0 && wYAxis[position] > 0 && w > 0)
                    wYAxis[position] += axisPadding;

                wYAxisArr.push({ width: w, position: position, xRel: wYAxis[position] });
                wYAxis[position] += w;
                wYAxis[position + 'Count']++;
            }

            // get horizontal axis height
            var hXAxis = { top: 0, bottom: 0, topCount: 0, bottomCount: 0 };
            var hXAxisArr = [];

            for (var i = 0; i < seriesGroups.length; i++) {
                var g = seriesGroups[i];
                if (g.type == 'pie' || g.type == 'donut' || g.spider == true || g.polar == true) {
                    hXAxisArr.push({ height: 0, position: 0, yRel: 0 });
                    continue;
                }
                var swap = g.orientation == 'horizontal';
                var sghx = self._getCategoryAxis(i);
                var catId = sghx == self._getCategoryAxis() ? -1 : i;
                position = undefined;

                var h = sghx.axisSize;
                if (!h || h == 'auto') {
                    if (swap) {
                        h = self._renderValueAxis(i, { x: 0, y: 0, width: 10000000, height: 0 }, true, plotRect).height;
                        if (self.seriesGroups[i].valueAxis)
                            position = g.valueAxis.position;
                    }
                    else {
                        h = self._renderCategoryAxis(i, { x: 0, y: 0, width: 10000000, height: 0 }, true).height;
                        if ((hashCatAxis[catId] & 0x02) == 0x02)
                            h = 0;
                        else if (h > 0)
                            hashCatAxis[catId] |= 0x02;
                        position = self._getCategoryAxis(i).position;
                    }
                }

                if (position != 'top')
                    position = 'bottom';

                if (hXAxis[position + 'Count'] > 0 && hXAxis[position] > 0 && h > 0)
                    hXAxis[position] += axisPadding;

                hXAxisArr.push({ height: h, position: position, yRel: hXAxis[position] });

                hXAxis[position] += h;
                hXAxis[position + 'Count']++;
            }

            self._createAnimationGroup("series");

            self._plotRect = plotRect;

            var showLegend = (self.showLegend != false);
            var szLegend = !showLegend ? { width: 0, height: 0} : self._renderLegend(self.legendLayout ? self._rect : paddedRect, true);
            if (this.legendLayout && (!isNaN(this.legendLayout.left) || !isNaN(this.legendLayout.top)))
                szLegend = { width: 0, height: 0 };

            if (paddedRect.height < hXAxis.top + hXAxis.bottom + szLegend.height || paddedRect.width < wYAxis.left + wYAxis.right) {
                renderer.endGroup();
                return;
            }

            plotRect.height -= hXAxis.top + hXAxis.bottom + szLegend.height;

            plotRect.x += wYAxis.left;
            plotRect.width -= wYAxis.left + wYAxis.right;
            plotRect.y += hXAxis.top;

            var catAxisRect = [];

            if (!isPieOnly) {
                var lineColor = self._getCategoryAxis().tickMarksColor || '#888888';

                for (var i = 0; i < seriesGroups.length; i++) {
                    var g = seriesGroups[i];
                    if (g.polar == true || g.spider == true)
                        continue;

                    var swap = g.orientation == 'horizontal';
                    var catId = self._getCategoryAxis(i) == self._getCategoryAxis() ? -1 : i;
                    var axisR = { x: plotRect.x, y: 0, width: plotRect.width, height: hXAxisArr[i].height };
                    if (hXAxisArr[i].position != 'top')
                        axisR.y = plotRect.y + plotRect.height + hXAxisArr[i].yRel;
                    else
                        axisR.y = plotRect.y - hXAxisArr[i].yRel - hXAxisArr[i].height;

                    if (swap) {
                        self._renderValueAxis(i, axisR, false, plotRect);
                    }
                    else {
                        if ((hashCatAxis[catId] & 0x04) == 0x04)
                            continue;

                        if (!self._isGroupVisible(i))
                            continue;

                        catAxisRect.push(axisR);
                        self._renderCategoryAxis(i, axisR, false, plotRect);
                        hashCatAxis[catId] |= 0x04;
                    }
                }
            }

            if (showLegend) {
                var containerRect = self.legendLayout ? self._rect : paddedRect;

                var x = paddedRect.x + $.jqx._ptrnd((paddedRect.width - szLegend.width) / 2);
                var y = plotRect.y + plotRect.height + hXAxis.bottom;
                var w = paddedRect.width;
                var h = szLegend.height;
                if (self.legendLayout) {
                    if (!isNaN(self.legendLayout.left))
                        x = self.legendLayout.left;

                    if (!isNaN(self.legendLayout.top))
                        y = self.legendLayout.top;

                    if (!isNaN(self.legendLayout.width))
                        w = self.legendLayout.width;

                    if (!isNaN(self.legendLayout.height))
                        h = self.legendLayout.height;
                }

                if (x + w > containerRect.x + containerRect.width)
                    w = containerRect.x + containerRect.width - x;
                if (y + h > containerRect.y + containerRect.height)
                    h = containerRect.y + containerRect.height - y;

                self._renderLegend({ x: x, y: y, width: w, height: h });
            }

            self._hasHorizontalLines = false;
            if (!isPieOnly) {
                for (var i = 0; i < seriesGroups.length; i++) {
                    var g = seriesGroups[i];

                    if (g.polar == true || g.spider == true)
                        continue;

                    var swap = seriesGroups[i].orientation == 'horizontal';
                    var axisR = { x: plotRect.x - wYAxisArr[i].xRel - wYAxisArr[i].width, y: plotRect.y, width: wYAxisArr[i].width, height: plotRect.height };
                    if (wYAxisArr[i].position != 'left')
                        axisR.x = plotRect.x + plotRect.width + wYAxisArr[i].xRel;

                    if (swap) {
                        if ((hashCatAxis[self._getCategoryAxis(i)] & 0x08) == 0x08)
                            continue;
                        if (!self._isGroupVisible(i))
                            continue;

                        catAxisRect.push(axisR);
                        self._renderCategoryAxis(i, axisR, false, plotRect);
                        hashCatAxis[self._getCategoryAxis(i)] |= 0x08;
                    }
                    else
                        self._renderValueAxis(i, axisR, false, plotRect);
                }
            }

            if (plotRect.width <= 0 || plotRect.height <= 0)
                return;

            self._plotRect = { x: plotRect.x, y: plotRect.y, width: plotRect.width, height: plotRect.height };

            var clip = renderer.createClipRect({ x: plotRect.x, y: plotRect.y, width: plotRect.width, height: plotRect.height });
            var gPlot = renderer.beginGroup();
            renderer.setClip(gPlot, clip);

            for (var i = 0; i < seriesGroups.length; i++) {
                var g = seriesGroups[i];
                var isValid = false;
                for (var validtype in self._seriesTypes) {
                    if (self._seriesTypes[validtype] == g.type) {
                        isValid = true;
                        break;
                    }
                }
                if (!isValid)
                    throw 'jqxChart: invalid series type "' + g.type + '"';

                // custom drawing before the group
                if ($.isFunction(g.drawBefore))
                    g.drawBefore(renderer, rect, i);

                // polar series drawing
                if (g.polar == true || g.spider == true) {
                    if (g.type.indexOf('pie') == -1 && g.type.indexOf('donut') == -1)
                        self._renderSpiderAxis(i, plotRect);
                }

                // color bands
                if (g.bands) {
                    for (var j = 0; j < g.bands.length; j++)
                        self._renderBand(i, j, plotRect);
                }

                // column, pie/donut, line, scatter/bubble series drawing
                if (g.type.indexOf('column') != -1)
                    self._renderColumnSeries(i, plotRect);
                else if (g.type.indexOf('pie') != -1 || g.type.indexOf('donut') != -1)
                    self._renderPieSeries(i, plotRect);
                else if (g.type.indexOf('line') != -1 || g.type.indexOf('area') != -1)
                    self._renderLineSeries(i, plotRect);
                else if (g.type.indexOf('scatter') != -1 || g.type.indexOf('bubble') != -1)
                    self._renderScatterSeries(i, plotRect);

                // custom drawing after the group
                if ($.isFunction(g.draw))
                    self.draw(renderer, rect, i);
            }

            renderer.endGroup();

            if (self.enabled == false) {
                var el = renderer.rect(rect.x, rect.y, rect.width, rect.height);
                renderer.attr(el, { fill: '#777777', opacity: 0.5, stroke: '#00FFFFFF' });
            }

            // Invoke user-defined drawing
            if ($.isFunction(self.draw)) {
                self.draw(renderer, rect);
            }

            renderer.endGroup();

            self._startAnimation("series");

            if (this._renderCategoryAxisRangeSelector) {
                var isRendered = [];
                for (var i = 0; i < self.seriesGroups.length; i++) {
                    var axis = this._getCategoryAxis(i);

                    if (isRendered.indexOf(axis) == -1) {
                        this._renderCategoryAxisRangeSelector(i, catAxisRect[i]);
                        isRendered.push(axis);
                    }
                }
            }
        },

        /** @private */
        _isPieOnlySeries: function () {
            var seriesGroups = this.seriesGroups;
            if (seriesGroups.length == 0)
                return false;

            for (var i = 0; i < seriesGroups.length; i++) {
                if (seriesGroups[i].type != 'pie' && seriesGroups[i].type != 'donut')
                    return false;
            }

            return true;
        },

        /** @private */
        _renderChartLegend: function (data, rect, isMeasure, isVerticalFlow) {
            var self = this;
            var renderer = self.renderer;
            var r = { x: rect.x + 3, y: rect.y + 3, width: rect.width - 6, height: rect.height - 6 };

            var szMeasure = { width: r.width, height: 0 };

            var x = 0, y = 0;
            var rowH = 20;
            var rowW = 0;
            var barSize = 10;
            var space = 10;
            var maxWidth = 0;
            for (var i = 0; i < data.length; i++) {
                var css = data[i].css;
                if (!css)
                    css = self.toThemeProperty('jqx-chart-legend-text', null);

                rowH = 20;
                var text = data[i].text;
                var sz = renderer.measureText(text, 0, { 'class': css });

                if (sz.height > rowH) {
                    rowH = sz.height;
                }

                if (sz.width > maxWidth)
                    maxWidth = sz.width;

                if (isVerticalFlow) {
                    if (i != 0)
                        y += rowH;

                    if (y > r.height) {
                        y = 0;
                        x += maxWidth + space;
                        maxWidth = sz.width;
                        szMeasure.width = x + maxWidth;
                    }
                }
                else {
                    if (x != 0)
                        x += space;

                    if (x + 2 * barSize + sz.width > r.width && sz.width < r.width) {
                        x = 0;
                        y += rowH;
                        rowH = 20;
                        rowW = r.width;
                        szMeasure.height = y + rowH;
                    }
                }

                var wrap = false;
                if (sz.width > rect.width) {
                    wrap = true;
                    var wrapWidth = rect.width;
                    var legendInfo = text;
                    var words = legendInfo.split(/\s+/).reverse();
                    var line = [];
                    var wrapText = "";
                    var textInfo = new Array();
                    while (word = words.pop()) {
                        line.push(word);
                        wrapText = line.join(" ");
                        var textSize = self.renderer.measureText(wrapText, 0, { 'class': css });

                        if (textSize.width > wrapWidth && textInfo.length > 0) {
                            line.pop();
                            line = [word];
                            wrapText = line.join(" ");
                        }
                        textInfo.push({ text: wrapText });
                    }
                    sz.width = 0;
                    var height = 0;
                    for (var t = 0; t < textInfo.length; t++) {
                        var textItem = textInfo[t].text;
                        var textSize = self.renderer.measureText(textItem, 0, { 'class': css });
                        sz.width = Math.max(sz.width, textSize.width);
                        height += sz.height;
                    }
                    sz.height = height;
                }

                var renderInBounds = r.x + x + sz.width < rect.x + rect.width &&
                    r.y + y + sz.height < rect.y + rect.height;
                if (self.legendLayout) {
                    var renderInBounds = r.x + x + sz.width < self._rect.x + self._rect.width &&
                        r.y + y + sz.height < self._rect.y + self._rect.height;
                }
                if (!isMeasure && renderInBounds
                  ) {
                    var sidx = data[i].seriesIndex;
                    var gidx = data[i].groupIndex;
                    var iidx = data[i].itemIndex;
                    var color = data[i].color;
                    var isVisible = self._isSerieVisible(gidx, sidx, iidx);
                    var g = renderer.beginGroup();
                    var opacity = isVisible ? data[i].opacity : 0.1;
                    if (wrap) {
                        var legendInfo = text;
                        var wrapWidth = rect.width;
                        var words = legendInfo.split(/\s+/).reverse();
                        var line = [];
                        var wrapText = "";
                        var dy = 0;
                        var textInfo = new Array();
                        while (word = words.pop()) {
                            line.push(word);
                            wrapText = line.join(" ");
                            var textSize = self.renderer.measureText(wrapText, 0, { 'class': css });
                            if (textSize.width > wrapWidth && textInfo.length > 0) {
                                line.pop();
                                dy += textSize.height;
                                line = [word];
                                wrapText = line.join(" ");
                            }
                            textInfo.push({ text: wrapText, dy: dy });
                        }
                        for (var t = 0; t < textInfo.length; t++) {
                            var textItem = textInfo[t].text;
                            dy = textInfo[t].dy;
                            var textSize = self.renderer.measureText(textItem, 0, { 'class': css });
                            if (isVerticalFlow) {
                                self.renderer.text(textItem, r.x + x + 1.5 * barSize, r.y + y + dy, sz.width, rowH, 0, { 'class': css }, false, 'left', 'center');
                            }
                            else {
                                self.renderer.text(textItem, r.x + x + 1.5 * barSize, r.y + y + dy, sz.width, rowH, 0, { 'class': css }, false, 'center', 'center');
                            }
                        }

                        var elem = renderer.rect(r.x + x, r.y + y + barSize / 2 + dy / 2, barSize, barSize);
                        if (isVerticalFlow)
                            y += dy;

                        self.renderer.attr(elem, { fill: color, 'fill-opacity': opacity, stroke: color, 'stroke-width': 1, 'stroke-opacity': data[i].opacity });
                    }
                    else {
                        var elem = renderer.rect(r.x + x, r.y + y + barSize / 2, barSize, barSize);
                        self.renderer.attr(elem, { fill: color, 'fill-opacity': opacity, stroke: color, 'stroke-width': 1, 'stroke-opacity': data[i].opacity });
                        if (isVerticalFlow) {
                            self.renderer.text(text, r.x + x + 1.5 * barSize, r.y + y, sz.width, sz.height + barSize / 2, 0, { 'class': css }, false, 'left', 'center');
                        }
                        else {
                            self.renderer.text(text, r.x + x + 1.5 * barSize, r.y + y, sz.width, rowH, 0, { 'class': css }, false, 'center', 'center');
                        }
                    }
                    self.renderer.endGroup();

                    self._setLegendToggleHandler(gidx, sidx, iidx, g);
                }

                if (isVerticalFlow) {
                }
                else {
                    x += sz.width + 2 * barSize;
                    if (rowW < x)
                        rowW = x;
                }
            }

            if (isMeasure) {
                szMeasure.height = $.jqx._ptrnd(y + rowH + 5);
                szMeasure.width = $.jqx._ptrnd(rowW);
                return szMeasure;
            }
        },

        /** @private */
        _isSerieVisible: function (groupIndex, serieIndex, itemIndex) {
            while (this._itemsToggleState.length < groupIndex + 1)
                this._itemsToggleState.push([]);

            var g = this._itemsToggleState[groupIndex];
            while (g.length < serieIndex + 1)
                g.push(isNaN(itemIndex) ? true : []);

            var s = g[serieIndex];
            if (isNaN(itemIndex))
                return s;

            if (!$.isArray(s))
                g[serieIndex] = s = [];

            while (s.length < itemIndex + 1)
                s.push(true);

            return s[itemIndex];
        },

        /** @private */
        _isGroupVisible: function (groupIndex) {
            var isGroupVisible = false;
            var series = this.seriesGroups[groupIndex].series;
            if (!series)
                return isGroupVisible;

            for (var i = 0; i < series.length; i++) {
                if (this._isSerieVisible(groupIndex, i)) {
                    isGroupVisible = true;
                    break;
                }
            }

            return isGroupVisible;
        },

        /** @private */
        _toggleSerie: function (groupIndex, serieIndex, itemIndex, enable) {
            var state = !this._isSerieVisible(groupIndex, serieIndex, itemIndex);
            if (enable != undefined)
                state = enable;

            var group = this.seriesGroups[groupIndex];
            var serie = group.series[serieIndex];

            this._raiseEvent('toggle', { state: state, seriesGroup: group, serie: serie, elementIndex: itemIndex });

            if (isNaN(itemIndex))
                this._itemsToggleState[groupIndex][serieIndex] = state;
            else {
                var s = this._itemsToggleState[groupIndex][serieIndex];

                if (!$.isArray(s))
                    s = [];

                while (s.length < itemIndex)
                    s.push(true);

                s[itemIndex] = state;
            }

            this._isToggleRefresh = true;
            this.update();
            this._isToggleRefresh = false;
        },

        showSerie: function (groupIndex, serieIndex, itemIndex) {
            this._toggleSerie(groupIndex, serieIndex, itemIndex, true);
        },

        hideSerie: function (groupIndex, serieIndex, itemIndex) {
            this._toggleSerie(groupIndex, serieIndex, itemIndex, false);
        },

        /** @private */
        _setLegendToggleHandler: function (groupIndex, serieIndex, itemIndex, element) {
            var g = this.seriesGroups[groupIndex];
            var s = g.series[serieIndex];

            var enableSeriesToggle = s.enableSeriesToggle;
            if (enableSeriesToggle == undefined)
                enableSeriesToggle = g.enableSeriesToggle != false;

            if (enableSeriesToggle) {
                var self = this;
                this.renderer.addHandler(element, 'click', function (e) {
                    e.preventDefault();

                    self._toggleSerie(groupIndex, serieIndex, itemIndex);
                });
            }
        },

        /** @private */
        _renderLegend: function (rect, isMeasure) {
            var self = this;
            var legendData = [];

            for (var gidx = 0; gidx < self.seriesGroups.length; gidx++) {
                var g = self.seriesGroups[gidx];
                if (g.showLegend == false)
                    continue;

                for (var sidx = 0; sidx < g.series.length; sidx++) {
                    var s = g.series[sidx];
                    if (s.showLegend == false)
                        continue;

                    var settings = self._getSerieSettings(gidx, sidx);
                    var legendText;

                    if (g.type == 'pie' || g.type == 'donut') {
                        var xAxis = self._getCategoryAxis(gidx);
                        var fs = s.legendFormatSettings || g.legendFormatSettings || xAxis.formatSettings || s.formatSettings || g.formatSettings;
                        var ff = s.legendFormatFunction || g.legendFormatFunction || xAxis.formatFunction || s.formatFunction || g.formatFunction;

                        var dataLength = self._getDataLen(gidx);
                        for (var i = 0; i < dataLength; i++) {
                            legendText = self._getDataValue(i, s.displayText, gidx);
                            legendText = self._formatValue(legendText, fs, ff, gidx, sidx, i);

                            var colors = self._getColors(gidx, sidx, i);

                            legendData.push({ groupIndex: gidx, seriesIndex: sidx, itemIndex: i, text: legendText, css: s.displayTextClass, color: colors.fillColor, opacity: settings.opacity });
                        }

                        continue;
                    }

                    var fs = s.legendFormatSettings || g.legendFormatSettings;
                    var ff = s.legendFormatFunction || g.legendFormatFunction;

                    legendText = self._formatValue(s.displayText || s.dataField || '', fs, ff, gidx, sidx, i);
                    var colors = self._getSeriesColors(gidx, sidx);

                    legendData.push({ groupIndex: gidx, seriesIndex: sidx, text: legendText, css: s.displayTextClass, color: colors.fillColor, opacity: settings.opacity });
                }
            }

            return self._renderChartLegend(legendData, rect, isMeasure, (self.legendLayout && self.legendLayout.flow == 'vertical'));
        },

        /** @private */
        _renderCategoryAxis: function (groupIndex, rect, isMeasure, chartRect) {
            var self = this;
            var axis = self._getCategoryAxis(groupIndex);
            var g = self.seriesGroups[groupIndex];
            var swapXY = g.orientation == 'horizontal';
            var szMeasure = { width: 0, height: 0 };
            if (!axis || axis.visible == false || g.type == 'spider')
                return szMeasure;

            // check if the group has visible series
            if (!self._isGroupVisible(groupIndex))
                return szMeasure;

            var valuesOnTicks = self._alignValuesWithTicks(groupIndex);

            // TODO: Update RTL/FLIP flag
            if (self.rtl)
                axis.flip = true;

            var axisSize = swapXY ? rect.height : rect.width;

            var text = axis.text;


            var offsets = self._calculateXOffsets(groupIndex, axisSize);
            var axisStats = offsets.axisStats;

            var rangeSelector = axis.rangeSelector;
            var selectorSize = 0;
            if (rangeSelector) {
                if (!this._selectorGetSize)
                    throw new Error("jqxChart: Missing reference to jqxchart.rangeselector.js");

                selectorSize = this._selectorGetSize(axis);
            }

            var ui = axisStats.interval;
            if (isNaN(ui))
                return;

            var gridLinesSettings = {
                visible: (axis.showGridLines != false),
                color: (axis.gridLinesColor || '#888888'),
                unitInterval: (axis.gridLinesInterval || ui),
                dashStyle: axis.gridLinesDashStyle,
                offsets: []
            };

            var tickMarksSettings =
            {
                visible: (axis.showTickMarks != false),
                color: (axis.tickMarksColor || '#888888'),
                unitInterval: (axis.tickMarksInterval || ui),
                dashStyle: axis.tickMarksDashStyle,
                offsets: []
            };

            var textRotationAngle = axis.textRotationAngle || 0;

            var labelOffsets;

            var min = axisStats.min;
            var max = axisStats.max;

            var padding = offsets.padding;

            var flip = axis.flip == true || self.rtl;

            if (axis.type == 'date') {
                gridLinesSettings.offsets = this._generateDTOffsets(min, max, axisSize, padding, gridLinesSettings.unitInterval, ui, axisStats.dateTimeUnit, valuesOnTicks, NaN, false, flip);
                tickMarksSettings.offsets = this._generateDTOffsets(min, max, axisSize, padding, tickMarksSettings.unitInterval, ui, axisStats.dateTimeUnit, valuesOnTicks, NaN, false, flip);
                labelOffsets = this._generateDTOffsets(min, max, axisSize, padding, ui, ui, axisStats.dateTimeUnit, valuesOnTicks, NaN, true, flip);
            }
            else {
                gridLinesSettings.offsets = this._generateOffsets(min, max, axisSize, padding, gridLinesSettings.unitInterval, ui, valuesOnTicks, NaN, false, flip);
                tickMarksSettings.offsets = this._generateOffsets(min, max, axisSize, padding, tickMarksSettings.unitInterval, ui, valuesOnTicks, NaN, false, flip);

                labelOffsets = this._generateOffsets(min, max, axisSize, padding, ui, ui, valuesOnTicks, NaN, true, flip);
            }

            if (offsets.length == 0)
                labelOffsets = [];

            var hTextAlign = axis.horizontalTextAlignment;

            var widgetRect = self.renderer.getRect();
            var paddingRight = widgetRect.width - rect.x - rect.width;
            var len = self._getDataLen(groupIndex);

            var oldPositions;
            if (self._elementRenderInfo && self._elementRenderInfo.length > groupIndex)
                oldPositions = self._elementRenderInfo[groupIndex].xAxis;

            var items = [];

            // prepare the axis labels
            var ffn = axis.formatFunction;
            var fs = axis.formatSettings;
            if (axis.type == 'date' && !fs && !ffn)
                ffn = this._getDefaultDTFormatFn(axis.baseUnit || 'day');

            for (var i = 0; i < labelOffsets.length; i++) {
                var value = labelOffsets[i].value;
                var x = labelOffsets[i].offset;

                if (axis.type != 'date' && axisStats.useIndeces && axis.dataField) {
                    var idx = Math.round(value);
                    value = self._getDataValue(idx, axis.dataField);
                    if (value == undefined)
                        value = '';
                }

                var text = self._formatValue(value, fs, ffn, groupIndex, undefined, i);

                if (text == undefined || text == '')
                    text = axisStats.useIndeces ? (axisStats.min + i).toString() : (value == undefined ? '' : value.toString());

                var obj = { key: value, text: text, targetX: x, x: x };
                if (oldPositions && oldPositions.itemOffsets[value]) {
                    obj.x = oldPositions.itemOffsets[value].x;
                    obj.y = oldPositions.itemOffsets[value].y;
                }

                items.push(obj);
            }
            ///

            var cssDesc = axis.descriptionClass;
            if (!cssDesc)
                cssDesc = self.toThemeProperty('jqx-chart-axis-description', null);

            var cssItems = axis['class'];
            if (!cssItems)
                cssItems = self.toThemeProperty('jqx-chart-axis-text', null);

            if (swapXY)
                textRotationAngle -= 90;

            var axisTextSettings = { text: axis.description, style: cssDesc, halign: axis.horizontalDescriptionAlignment || 'center', valign: axis.verticalDescriptionAlignment || 'center', textRotationAngle: swapXY ? -90 : 0 };
            var itemsTextSettings = { textRotationAngle: textRotationAngle, style: cssItems, halign: hTextAlign, valign: axis.verticalTextAlignment || 'center', textRotationPoint: axis.textRotationPoint || 'auto', textOffset: axis.textOffset };

            var isMirror = (swapXY && axis.position == 'right') || (!swapXY && axis.position == 'top');

            var renderData = { rangeLength: offsets.rangeLength, itemWidth: offsets.itemWidth, intervalWidth: offsets.intervalWidth, data: offsets, rect: rect };
            var itemsInfo = { items: items, renderData: renderData };

            while (self._renderData.length < groupIndex + 1)
                self._renderData.push({});

            self._renderData[groupIndex].xAxis = renderData;

            var anim = self._getAnimProps(groupIndex);
            var duration = anim.enabled && items.length < 500 ? anim.duration : 0;
            if (self.enableAxisTextAnimation == false)
                duration = 0;

            if (!isMeasure && rangeSelector) {
                if (swapXY) {
                    rect.width -= selectorSize;
                    if (axis.position != 'right')
                        rect.x += selectorSize;
                }
                else {
                    rect.height -= selectorSize;
                    if (axis.position == 'top')
                        rect.y += selectorSize;
                }
            }

            var sz = self._renderAxis(swapXY, isMirror, axisTextSettings, itemsTextSettings, { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, chartRect, ui, false, true /*valuesOnTicks*/, itemsInfo, gridLinesSettings, tickMarksSettings, isMeasure, duration);

            if (swapXY)
                sz.width += selectorSize;
            else
                sz.height += selectorSize;

            return sz;
        },

        /** @private */
        _animateAxisText: function (context, percent) {
            var items = context.items;
            var textSettings = context.textSettings;

            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (!item.visible)
                    continue;

                var x = item.targetX;
                var y = item.targetY;
                if (!isNaN(item.x) && !isNaN(item.y)) {
                    x = item.x + (x - item.x) * percent;
                    y = item.y + (y - item.y) * percent;
                }

                // TODO: Optimize via text reponsitioning.
                // Requires SVG & VML text rendering changes
                if (item.element) {
                    this.renderer.removeElement(item.element);
                    item.element = undefined;
                }

                item.element = this.renderer.text(
                    item.text,
                    x,
                    y,
                    item.width,
                    item.height,
                    textSettings.textRotationAngle,
                    { 'class': textSettings.style },
                    false,
                    textSettings.halign,
                    textSettings.valign,
                    textSettings.textRotationPoint);
            }
        },

        /** @private */
        _getPolarAxisCoords: function (groupIndex, rect) {
            var group = this.seriesGroups[groupIndex];

            var offsets = this._calcGroupOffsets(groupIndex, rect).xoffsets;
            if (!offsets)
                return;

            var offsetX = rect.x + $.jqx.getNum([group.offsetX, rect.width / 2]);
            var offsetY = rect.y + $.jqx.getNum([group.offsetY, rect.height / 2]);
            var radius = group.radius;
            if (isNaN(radius))
                radius = Math.min(rect.width, rect.height) / 2 * 0.6;

            var valuesOnTicks = this._alignValuesWithTicks(groupIndex);

            var startAngle = group.startAngle;
            if (isNaN(startAngle))
                startAngle = 0;
            else {
                startAngle = (startAngle < 0 ? -1 : 1) * (Math.abs(startAngle) % 360);
                startAngle = 2 * Math.PI * startAngle / 360;
            }

            return { x: offsetX, y: offsetY, r: radius, itemWidth: offsets.itemWidth, rangeLength: offsets.rangeLength, valuesOnTicks: valuesOnTicks, startAngle: startAngle };
        },

        /** @private */
        _toPolarCoord: function (polarAxisCoords, rect, x, y) {
            var angle = ((x - rect.x) * 2 * Math.PI) / Math.max(1, rect.width) + polarAxisCoords.startAngle;
            var radius = ((rect.height + rect.y) - y) * polarAxisCoords.r / Math.max(1, rect.height);

            var px = polarAxisCoords.x + radius * Math.cos(angle);
            var py = polarAxisCoords.y + radius * Math.sin(angle);

            return { x: $.jqx._ptrnd(px), y: $.jqx._ptrnd(py) };
        },

        /** @private */
        _renderSpiderAxis: function (groupIndex, rect) {
            var self = this;
            var axis = self._getCategoryAxis(groupIndex);
            if (!axis || axis.visible == false)
                return;

            var group = self.seriesGroups[groupIndex];

            var polarCoords = self._getPolarAxisCoords(groupIndex, rect);
            if (!polarCoords)
                return;

            var offsetX = $.jqx._ptrnd(polarCoords.x);
            var offsetY = $.jqx._ptrnd(polarCoords.y);
            var radius = polarCoords.r;
            var startAngle = polarCoords.startAngle;

            if (radius < 1)
                return;

            radius = $.jqx._ptrnd(radius);
            var axisSize = Math.PI * 2 * radius;

            var offsets = self._calculateXOffsets(groupIndex, axisSize);
            if (!offsets.rangeLength)
                return;

            var ui = axis.unitInterval;
            if (isNaN(ui) || ui < 1)
                ui = 1;

            var gridLinesSettings = {
                visible: (axis.showGridLines != false),
                color: (axis.gridLinesColor || '#888888'),
                unitInterval: (axis.gridLinesInterval || axis.unitInterval || ui),
                dashStyle: axis.gridLinesDashStyle,
                offsets: []
            };

            var tickMarksSettings =
            {
                visible: (axis.showTickMarks != false),
                color: (axis.tickMarksColor || '#888888'),
                unitInterval: (axis.tickMarksInterval || axis.unitInterval || ui),
                dashStyle: axis.tickMarksDashStyle,
                offsets: []
            };

            var hTextAlign = axis.horizontalTextAlignment;
            var valuesOnTicks = self._alignValuesWithTicks(groupIndex);

            var renderer = self.renderer;

            var labelOffsets;

            var axisStats = offsets.axisStats;

            var min = axisStats.min;
            var max = axisStats.max;

            var padding = this._getPaddingSize(offsets.axisStats, axis, valuesOnTicks, axisSize, true, false);

            var flip = axis.flip == true || self.rtl;

            if (axis.type == 'date') {
                gridLinesSettings.offsets = this._generateDTOffsets(min, max, axisSize, padding, gridLinesSettings.unitInterval, ui, axis.baseUnit, false, 0, false, flip);
                tickMarksSettings.offsets = this._generateDTOffsets(min, max, axisSize, padding, tickMarksSettings.unitInterval, ui, axis.baseUnit, false, 0, false, flip);
                labelOffsets = this._generateDTOffsets(min, max, axisSize, padding, ui, ui, axis.baseUnit, false, 0, true, flip);
            }
            else {
                gridLinesSettings.offsets = this._generateOffsets(min, max, axisSize, padding, gridLinesSettings.unitInterval, ui, true, 0, false, flip);
                tickMarksSettings.offsets = this._generateOffsets(min, max, axisSize, padding, tickMarksSettings.unitInterval, ui, true, 0, false, flip);

                labelOffsets = this._generateOffsets(min, max, axisSize, padding, ui, ui, true, 0, false, flip);
            }

            var hTextAlign = axis.horizontalTextAlignment;

            var widgetRect = self.renderer.getRect();
            var paddingRight = widgetRect.width - rect.x - rect.width;
            var len = self._getDataLen(groupIndex);

            var oldPositions;
            if (self._elementRenderInfo && self._elementRenderInfo.length > groupIndex)
                oldPositions = self._elementRenderInfo[groupIndex].xAxis;

            var items = [];
            for (var i = 0; i < labelOffsets.length; i++) {
                var x = labelOffsets[i].offset;
                var value = labelOffsets[i].value;

                if (axis.type != 'date' && axisStats.useIndeces && axis.dataField) {
                    var idx = Math.round(value);
                    value = self._getDataValue(idx, axis.dataField);
                    if (value == undefined)
                        value = '';
                }
                var text = self._formatValue(value, axis.formatSettings, axis.formatFunction, groupIndex, undefined, i);
                if (text == undefined || text == '')
                    text = axisStats.useIndeces ? (axisStats.min + i).toString() : (value == undefined ? '' : value.toString());

                var obj = { key: value, text: text, targetX: x, x: x };
                if (oldPositions && oldPositions.itemOffsets[value]) {
                    obj.x = oldPositions.itemOffsets[value].x;
                    obj.y = oldPositions.itemOffsets[value].y;
                }

                items.push(obj);
            }

            var cssDesc = axis.descriptionClass;
            if (!cssDesc)
                cssDesc = self.toThemeProperty('jqx-chart-axis-description', null);

            var cssItems = axis['class'];
            if (!cssItems)
                cssItems = self.toThemeProperty('jqx-chart-axis-text', null);

            var text = axis.text;

            var textRotationAngle = axis.textRotationAngle || 0;

            var swapXY = self.seriesGroups[groupIndex].orientation == 'horizontal';
            if (swapXY)
                textRotationAngle -= 90;

            var axisTextSettings = { text: axis.description, style: cssDesc, halign: axis.horizontalDescriptionAlignment || 'center', valign: axis.verticalDescriptionAlignment || 'center', textRotationAngle: swapXY ? -90 : 0 };
            var itemsTextSettings = { textRotationAngle: textRotationAngle, style: cssItems, halign: hTextAlign, valign: axis.verticalTextAlignment || 'center', textRotationPoint: axis.textRotationPoint || 'auto', textOffset: axis.textOffset };

            var isMirror = (swapXY && axis.position == 'right') || (!swapXY && axis.position == 'top');

            var renderData = { rangeLength: offsets.rangeLength, itemWidth: offsets.itemWidth };
            var itemsInfo = { items: items, renderData: renderData };

            while (self._renderData.length < groupIndex + 1)
                self._renderData.push({});

            self._renderData[groupIndex].xAxis = renderData;

            // draw the spider
            var strokeAttributes = { stroke: gridLinesSettings.color, fill: 'none', 'stroke-width': 1, 'stroke-dasharray': gridLinesSettings.dashStyle || '' };
            var elem = renderer.circle(offsetX, offsetY, radius, strokeAttributes);

            var cnt = items.length;
            var aIncrement = 2 * Math.PI / (cnt);
            var aIncrementAdj = startAngle;

            // draw text items
            for (var i = 0; i < items.length; i++) {
                var offset = items[i].x;
                var angle = aIncrementAdj + (offset * 2 * Math.PI) / Math.max(1, axisSize);
                angle = (360 - angle / (2 * Math.PI) * 360) % 360;
                if (angle < 0)
                    angle = 360 + angle;

                var sz = renderer.measureText(items[i].text, 0, { 'class': cssItems });

                var labelOffset = this._adjustTextBoxPosition(
                    offsetX,
                    offsetY,
                    sz,
                    radius + (tickMarksSettings.visible ? 7 : 2),
                    angle,
                    false,
                    false,
                    true
                    );

                renderer.text(items[i].text, labelOffset.x, labelOffset.y, sz.width, sz.height, 0, { 'class': cssItems }, false, 'center', 'center');
            }

            // draw category axis grid lines
            if (gridLinesSettings.visible) {
                for (var i = 0; i < gridLinesSettings.offsets.length; i++) {
                    var offset = gridLinesSettings.offsets[i].offset;
                    if (!valuesOnTicks)
                        offset -= padding.right / 2;

                    var angle = aIncrementAdj + (offset * 2 * Math.PI) / Math.max(1, axisSize);

                    var px = offsetX + radius * Math.cos(angle);
                    var py = offsetY + radius * Math.sin(angle);
                    renderer.line(offsetX, offsetY, $.jqx._ptrnd(px), $.jqx._ptrnd(py), strokeAttributes);
                }
            }

            // draw tick marks
            if (tickMarksSettings.visible) {
                var tickMarkSize = 5;

                var strokeAttributes = { stroke: tickMarksSettings.color, fill: 'none', 'stroke-width': 1, 'stroke-dasharray': tickMarksSettings.dashStyle || '' };

                for (var i = 0; i < tickMarksSettings.offsets.length; i++) {
                    var offset = tickMarksSettings.offsets[i].offset;
                    if (!valuesOnTicks)
                        offset -= padding.right / 2;

                    var angle = aIncrementAdj + (offset * 2 * Math.PI) / Math.max(1, axisSize);

                    var p1 = { x: offsetX + radius * Math.cos(angle), y: offsetY + radius * Math.sin(angle) };
                    var p2 = { x: offsetX + (radius + tickMarkSize) * Math.cos(angle), y: offsetY + (radius + tickMarkSize) * Math.sin(angle) };
                    renderer.line($.jqx._ptrnd(p1.x), $.jqx._ptrnd(p1.y), $.jqx._ptrnd(p2.x), $.jqx._ptrnd(p2.y), strokeAttributes);
                }
            }

            ///// Draw Value Axis
            self._renderSpiderValueAxis(groupIndex, rect);

        },

        /** @private */
        _renderSpiderValueAxis: function (groupIndex, rect) {
            var group = this.seriesGroups[groupIndex];

            var polarCoords = this._getPolarAxisCoords(groupIndex, rect);
            if (!polarCoords)
                return;

            var offsetX = $.jqx._ptrnd(polarCoords.x);
            var offsetY = $.jqx._ptrnd(polarCoords.y);
            var radius = polarCoords.r;
            var startAngle = polarCoords.startAngle;

            if (radius < 1)
                return;

            radius = $.jqx._ptrnd(radius);

            var valueAxis = this.seriesGroups[groupIndex].valueAxis;
            if (!valueAxis || false == valueAxis.displayValueAxis || false == valueAxis.visible)
                return;

            var cssItems = valueAxis['class'];
            if (!cssItems)
                cssItems = this.toThemeProperty('jqx-chart-axis-text', null);

            var valueAxisformatSettings = valueAxis.formatSettings;
            var isStacked100 = group.type.indexOf("stacked") != -1 && group.type.indexOf("100") != -1;
            if (isStacked100 && !valueAxisformatSettings)
                valueAxisformatSettings = { sufix: '%' };

            this._calcValueAxisItems(groupIndex, radius);

            var valueAxisUnitInterval = this._stats.seriesGroups[groupIndex].mu;

            var valueAxisGridLinesSettings = { visible: (valueAxis.showGridLines != false), color: (valueAxis.gridLinesColor || '#888888'), unitInterval: (valueAxis.gridLinesInterval || valueAxisUnitInterval || 1), dashStyle: valueAxis.gridLinesDashStyle };
            var strokeAttributes = { stroke: valueAxisGridLinesSettings.color, fill: 'none', 'stroke-width': 1, 'stroke-dasharray': valueAxisGridLinesSettings.dashStyle || '' };

            // draw value axis text
            var axisRenderData = this._renderData[groupIndex].valueAxis;
            var items = axisRenderData.items;
            if (items.length) {
                this.renderer.line(offsetX, offsetY, offsetX, $.jqx._ptrnd(offsetY - radius), strokeAttributes);
            }

            items = items.reverse();

            var renderer = this.renderer;

            for (var i = 0; i < items.length - 1; i++) {
                var value = items[i];
                var text = (valueAxis.formatFunction) ? valueAxis.formatFunction(value) : this._formatNumber(value, valueAxisformatSettings);

                var sz = renderer.measureText(text, 0, { 'class': cssItems });

                var x = offsetX + (valueAxis.showTickMarks != false ? 3 : 2);
                var y = offsetY - axisRenderData.itemWidth * i - sz.height;

                renderer.text(text, x, y, sz.width, sz.height, 0, { 'class': cssItems }, false, 'center', 'center');
            }

            var isLogAxis = valueAxis.logarithmicScale == true;

            var len = isLogAxis ? items.length : axisRenderData.rangeLength;
            aIncrement = 2 * Math.PI / len;

            // draw value axis grid lines
            if (valueAxisGridLinesSettings.visible) {
                var strokeAttributes = { stroke: valueAxisGridLinesSettings.color, fill: 'none', 'stroke-width': 1, 'stroke-dasharray': valueAxisGridLinesSettings.dashStyle || '' };
                for (var i = 0; i < len; i += valueAxisGridLinesSettings.unitInterval) {
                    var y = $.jqx._ptrnd(radius * i / len);
                    renderer.circle(offsetX, offsetY, y, strokeAttributes);
                }
            }

            // draw value axis tick marks
            var valueAxisTickMarksSettings = { visible: (valueAxis.showTickMarks != false), color: (valueAxis.tickMarksColor || '#888888'), unitInterval: (valueAxis.tickMarksInterval || valueAxisUnitInterval), dashStyle: valueAxis.tickMarksDashStyle };

            if (valueAxisTickMarksSettings.visible) {
                tickMarkSize = 5;
                var strokeAttributes = { stroke: valueAxisTickMarksSettings.color, fill: 'none', 'stroke-width': 1, 'stroke-dasharray': valueAxisTickMarksSettings.dashStyle || '' };

                var x1 = offsetX - Math.round(tickMarkSize / 2);
                var x2 = x1 + tickMarkSize;
                for (var i = 0; i < len; i += valueAxisTickMarksSettings.unitInterval) {
                    if (valueAxisGridLinesSettings.visible && (i % valueAxisGridLinesSettings.unitInterval) == 0)
                        continue;
                    var y = $.jqx._ptrnd(offsetY - radius * i / len);
                    renderer.line($.jqx._ptrnd(x1), y, $.jqx._ptrnd(x2), y, strokeAttributes);
                }
            }
        },

        /** @private */
        _renderAxis: function (isVertical, isMirror, axisTextSettings, textSettings, rect, chartRect, ui, isLogAxis, valuesOnTicks, itemsInfo, gridLinesSettings, tickMarksSettings, isMeasure, animationDuration) {
            var tickMarkSize = tickMarksSettings.visible ? 4 : 0;
            var padding = 2;

            var szMeasure = { width: 0, height: 0 };
            var szMeasureDesc = { width: 0, height: 0 };

            if (isVertical)
                szMeasure.height = szMeasureDesc.height = rect.height;
            else
                szMeasure.width = szMeasureDesc.width = rect.width;

            if (!isMeasure && isMirror) {
                if (isVertical)
                    rect.x -= rect.width;
            }

            var renderData = itemsInfo.renderData;

            var itemWidth = renderData.itemWidth; //renderData.intervalWidth;

            if (axisTextSettings.text != undefined && axisTextSettings != '') {
                var textRotationAngle = axisTextSettings.textRotationAngle;
                var sz = this.renderer.measureText(axisTextSettings.text, textRotationAngle, { 'class': axisTextSettings.style });
                szMeasureDesc.width = sz.width;
                szMeasureDesc.height = sz.height;

                if (!isMeasure) {
                    this.renderer.text(
                        axisTextSettings.text,
                        rect.x + (isVertical ? (!isMirror ? padding : -padding + 2 * rect.width - szMeasureDesc.width) : 0),
                        rect.y + (!isVertical ? (!isMirror ? rect.height - padding - szMeasureDesc.height : padding) : 0),
                        isVertical ? szMeasureDesc.width : rect.width,
                        !isVertical ? szMeasureDesc.height : rect.height,
                        textRotationAngle,
                        { 'class': axisTextSettings.style },
                        true,
                        axisTextSettings.halign,
                        axisTextSettings.valign);
                }
            }

            var offset = 0;
            var textXAdjust = valuesOnTicks ? -itemWidth / 2 : 0;

            if (valuesOnTicks && !isVertical) {
                textSettings.halign = 'center';
            }

            var baseX = rect.x;
            var baseY = rect.y;

            var userOffset = textSettings.textOffset;
            if (userOffset) {
                if (!isNaN(userOffset.x))
                    baseX += userOffset.x;
                if (!isNaN(userOffset.y))
                    baseY += userOffset.y;
            }

            if (!isVertical) {
                baseX += textXAdjust;
                if (isMirror) {
                    baseY += szMeasureDesc.height > 0 ? szMeasureDesc.height + 3 * padding : 2 * padding;
                    baseY += tickMarkSize - (valuesOnTicks ? tickMarkSize : tickMarkSize / 4);
                }
                else {
                    baseY += valuesOnTicks ? tickMarkSize : tickMarkSize / 4;
                }
            }
            else {
                baseX += padding + (szMeasureDesc.width > 0 ? szMeasureDesc.width + padding : 0) + (isMirror ? rect.width - szMeasureDesc.width : 0);
                baseY += textXAdjust;
            }

            var h = 0;
            var w = 0;

            var items = itemsInfo.items;

            renderData.itemOffsets = {};

            if (this._isToggleRefresh || !this._isUpdate)
                animationDuration = 0;

            var canAnimate = false;

            var widthSum = 0;

            for (var i = 0; i < items.length; i++, offset += itemWidth) {
                var text = items[i].text;
                if (!isNaN(items[i].targetX))
                    offset = items[i].targetX;

                var sz = this.renderer.measureText(text, textSettings.textRotationAngle, { 'class': textSettings.style });
                if (sz.width > w)
                    w = sz.width;
                if (sz.height > h)
                    h = sz.height;

                widthSum += isVertical ? h : w;

                if (!isMeasure) {
                    if ((isVertical && offset > rect.height + 2) || (!isVertical && offset > rect.width + 2))
                        break;

                    var x = isVertical ? baseX + (isMirror ? (szMeasureDesc.width == 0 ? tickMarkSize : tickMarkSize - padding) : 0) : baseX + offset;
                    var y = isVertical ? baseY + offset : baseY;

                    renderData.itemOffsets[items[i].key] = { x: x, y: y };

                    if (!canAnimate)
                        if (!isNaN(items[i].x) || !isNaN(items[i].y) && animationDuration)
                            canAnimate = true;

                    items[i].targetX = x;
                    items[i].targetY = y;
                    items[i].width = !isVertical ? itemWidth : rect.width - 2 * padding - tickMarkSize - ((szMeasureDesc.width > 0) ? szMeasureDesc.width + padding : 0);
                    items[i].height = isVertical ? itemWidth : rect.height - 2 * padding - tickMarkSize - ((szMeasureDesc.height > 0) ? szMeasureDesc.height + padding : 0);
                    items[i].visible = !isLogAxis || (isLogAxis && (i % ui) == 0);
                }
            }

            renderData.avgWidth = items.length == 0 ? 0 : widthSum / items.length;

            if (!isMeasure) {
                var ctx = { items: items, textSettings: textSettings };
                if (isNaN(animationDuration) || !canAnimate)
                    animationDuration = 0;

                this._animateAxisText(ctx, animationDuration == 0 ? 1 : 0);

                if (animationDuration != 0) {
                    var self = this;
                    this._enqueueAnimation(
                        "series",
                        undefined,
                        undefined,
                        animationDuration,
                        function (element, ctx, percent) {
                            self._animateAxisText(ctx, percent);
                        },
                        ctx);
                }
            }

            szMeasure.width += 2 * padding + tickMarkSize + szMeasureDesc.width + w + (isVertical && szMeasureDesc.width > 0 ? padding : 0);
            szMeasure.height += 2 * padding + tickMarkSize + szMeasureDesc.height + h + (!isVertical && szMeasureDesc.height > 0 ? padding : 0);

            var gridLinePts = {};
            var strokeAttributes = { stroke: gridLinesSettings.color, 'stroke-width': 1, 'stroke-dasharray': gridLinesSettings.dashStyle || '' };


            if (!isMeasure) {
                var y = $.jqx._ptrnd(rect.y + (isMirror ? rect.height : 0));
                if (isVertical)
                    this.renderer.line($.jqx._ptrnd(rect.x + rect.width), rect.y, $.jqx._ptrnd(rect.x + rect.width), rect.y + rect.height, strokeAttributes);
                else {
                    this.renderer.line($.jqx._ptrnd(rect.x), y, $.jqx._ptrnd(rect.x + rect.width + 1), y, strokeAttributes);
                }
            }

            var rndErr = 0.5;

            // render vertical grid lines
            if (!isMeasure && gridLinesSettings.visible != false) {
                var offsets = gridLinesSettings.offsets;
                for (var i = 0; i < offsets.length; i++) {
                    if (isVertical) {
                        lineOffset = $.jqx._ptrnd(rect.y + offsets[i].offset);
                        if (lineOffset < rect.y - rndErr)
                            break;
                    }
                    else {
                        lineOffset = $.jqx._ptrnd(rect.x + offsets[i].offset);
                        if (lineOffset > rect.x + rect.width + rndErr)
                            break;
                    }

                    if (isVertical)
                        this.renderer.line($.jqx._ptrnd(chartRect.x), lineOffset, $.jqx._ptrnd(chartRect.x + chartRect.width), lineOffset, strokeAttributes);
                    else
                        this.renderer.line(lineOffset, $.jqx._ptrnd(chartRect.y), lineOffset, $.jqx._ptrnd(chartRect.y + chartRect.height), strokeAttributes);

                    gridLinePts[lineOffset] = true;
                }
            }

            // render axis tick marks
            var strokeAttributes = { stroke: tickMarksSettings.color, 'stroke-width': 1, 'stroke-dasharray': tickMarksSettings.dashStyle || '' };

            if (!isMeasure && tickMarksSettings.visible) {
                var offsets = tickMarksSettings.offsets;
                for (var i = 0; i < offsets.length; i++) {
                    var lineOffset = $.jqx._ptrnd((isVertical ? rect.y + /*rect.height -*/offsets[i].offset : rect.x + offsets[i].offset));

                    if (gridLinePts[lineOffset - 1])
                        lineOffset--;
                    else if (gridLinePts[lineOffset + 1])
                        lineOffset++;

                    if (isVertical) {
                        if (lineOffset > rect.y + rect.height + rndErr)
                            break;
                    }
                    else {
                        if (lineOffset > rect.x + rect.width + rndErr)
                            break;
                    }

                    var tickSize = !isMirror ? -tickMarkSize : tickMarkSize;
                    if (isVertical) {
                        this.renderer.line(rect.x + rect.width, lineOffset, rect.x + rect.width + tickSize, lineOffset, strokeAttributes);
                    }
                    else {
                        var y = $.jqx._ptrnd(rect.y + (isMirror ? rect.height : 0));
                        this.renderer.line(lineOffset, y, lineOffset, y - tickSize, strokeAttributes);
                    }
                }
            }

            szMeasure.width = $.jqx._rup(szMeasure.width);
            szMeasure.height = $.jqx._rup(szMeasure.height);

            return szMeasure;
        },

        /** @private */
        _calcValueAxisItems: function (groupIndex, axisLength) {
            var gstat = this._stats.seriesGroups[groupIndex];
            if (!gstat || !gstat.isValid) {
                return false;
            }

            var g = this.seriesGroups[groupIndex];
            var swapXY = g.orientation == 'horizontal';
            var axis = g.valueAxis;

            var valuesOnTicks = axis.valuesOnTicks != false;
            var field = axis.dataField;
            var ints = gstat.intervals;
            var unitH = axisLength / ints;

            var min = gstat.min;
            var mu = gstat.mu;

            var logAxis = axis.logarithmicScale == true;
            var logBase = axis.logarithmicScaleBase || 10;
            var isStacked100 = g.type.indexOf("stacked") != -1 && g.type.indexOf("100") != -1;

            if (logAxis)
                mu = !isNaN(axis.unitInterval) ? axis.unitInterval : 1;

            if (!valuesOnTicks)
                ints = Math.max(ints - 1, 1);

            while (this._renderData.length < groupIndex + 1)
                this._renderData.push({});

            this._renderData[groupIndex].valueAxis = {};
            var renderData = this._renderData[groupIndex].valueAxis;

            renderData.itemWidth = renderData.intervalWidth = unitH;
            renderData.items = [];
            var items = renderData.items;

            for (var i = 0; i <= ints; i++) {
                var value = 0;
                if (logAxis) {
                    if (isStacked100)
                        value = gstat.max / Math.pow(logBase, ints - i);
                    else
                        value = min * Math.pow(logBase, i);
                }
                else {
                    value = valuesOnTicks ? min + i * mu : min + (i + 0.5) * mu;
                }

                items.push(value);
            }

            renderData.rangeLength = logAxis && !isStacked100 ? gstat.intervals : (gstat.intervals) * mu;

            if (g.valueAxis.flip != true)
                items = items.reverse();

            return true;
        },

        /** @private */
        _renderValueAxis: function (groupIndex, rect, isMeasure, chartRect) {
            var g = this.seriesGroups[groupIndex];
            var swapXY = g.orientation == 'horizontal';
            var axis = g.valueAxis;
            if (!axis)
                throw 'SeriesGroup ' + groupIndex + ' is missing valueAxis definition';

            var szMeasure = { width: 0, height: 0 };

            if (!this._isGroupVisible(groupIndex) || this._isPieOnlySeries() || g.type == 'spider')
                return szMeasure;

            if (!this._calcValueAxisItems(groupIndex, (swapXY ? rect.width : rect.height)) || false == axis.displayValueAxis || false == axis.visible)
                return szMeasure;

            var cssDesc = axis.descriptionClass;
            if (!cssDesc)
                cssDesc = this.toThemeProperty('jqx-chart-axis-description', null);

            var axisTextSettings = {
                text: axis.description,
                style: cssDesc,
                halign: axis.horizontalDescriptionAlignment || 'center',
                valign: axis.verticalDescriptionAlignment || 'center',
                textRotationAngle: swapXY ? 0 : (!this.rtl ? -90 : 90)
            };

            var cssItems = axis.itemsClass;
            if (!cssItems)
                cssItems = this.toThemeProperty('jqx-chart-axis-text', null);

            var itemsTextSettings =
            {
                style: cssItems,
                halign: axis.horizontalTextAlignment || 'center',
                valign: axis.verticalTextAlignment || 'center',
                textRotationAngle: axis.textRotationAngle || 0,
                textRotationPoint: axis.textRotationPoint || 'auto',
                textOffset: axis.textOffset
            };

            var valuesOnTicks = axis.valuesOnTicks != false;
            var gstat = this._stats.seriesGroups[groupIndex];
            var mu = gstat.mu;

            var format = axis.formatSettings;
            var isStacked100 = g.type.indexOf("stacked") != -1 && g.type.indexOf("100") != -1;
            if (isStacked100 && !format)
                format = { sufix: '%' };

            var logAxis = axis.logarithmicScale == true;
            var logBase = axis.logarithmicScaleBase || 10;

            if (logAxis)
                mu = !isNaN(axis.unitInterval) ? axis.unitInterval : 1;

            var items = [];

            var renderData = this._renderData[groupIndex].valueAxis;

            var oldPositions;
            if (this._elementRenderInfo && this._elementRenderInfo.length > groupIndex)
                oldPositions = this._elementRenderInfo[groupIndex].valueAxis;

            for (var i = 0; i < renderData.items.length; i++) {
                var value = renderData.items[i];
                var text = (axis.formatFunction) ? axis.formatFunction(value) : this._formatNumber(value, format);

                var obj = { key: value, text: text };
                if (oldPositions && oldPositions.itemOffsets[value]) {
                    obj.x = oldPositions.itemOffsets[value].x;
                    obj.y = oldPositions.itemOffsets[value].y;
                }

                items.push(obj);
            }

            var gridLinesInterval = axis.gridLinesInterval || axis.unitInterval;
            if (isNaN(gridLinesInterval) || (logAxis && gridLinesInterval < mu))
                gridLinesInterval = mu;

            var axisSize = swapXY ? rect.width : rect.height;

            var gridLinesSettings = {
                visible: (axis.showGridLines != false),
                color: (axis.gridLinesColor || '#888888'),
                unitInterval: gridLinesInterval,
                dashStyle: axis.gridLinesDashStyle
            };

            var min = gstat.logarithmic ? gstat.minPow : gstat.min;
            var max = gstat.logarithmic ? gstat.maxPow : gstat.max;

            var flip = false;

            if (gridLinesSettings.visible)
                gridLinesSettings.offsets = this._generateOffsets(min, max, axisSize, { left: 0, right: 0 }, gridLinesSettings.unitInterval, mu, true, 0, false, flip);

            var tickMarksInterval = axis.tickMarksInterval || axis.unitInterval;
            if (isNaN(tickMarksInterval) || (logAxis && tickMarksInterval < mu))
                tickMarksInterval = mu;

            var tickMarksSettings = {
                visible: (axis.showTickMarks != false),
                color: (axis.tickMarksColor || '#888888'),
                unitInterval: tickMarksInterval,
                dashStyle: axis.tickMarksDashStyle
            };

            if (tickMarksSettings.visible)
                tickMarksSettings.offsets = this._generateOffsets(min, max, axisSize, { left: 0, right: 0 }, tickMarksSettings.unitInterval, mu, true, 0, false, flip);

            var isMirror = (swapXY && axis.position == 'top') || (!swapXY && axis.position == 'right') || (!swapXY && this.rtl && axis.position != 'left'); ;

            var itemsInfo = { items: items, renderData: renderData };

            var anim = this._getAnimProps(groupIndex);
            var duration = anim.enabled && items.length < 500 ? anim.duration : 0;
            if (this.enableAxisTextAnimation == false)
                duration = 0;

            return this._renderAxis(!swapXY, isMirror, axisTextSettings, itemsTextSettings, rect, chartRect, mu, logAxis, valuesOnTicks, itemsInfo, gridLinesSettings, tickMarksSettings, isMeasure, duration);
        },

        /** @private */
        _generateOffsets: function (min, max, axisSize, padding, interval, baseInterval, isTicksMode, tickPadding, isValue, flip) {
            var offsets = [];
            var count = max - min;

            var paddedSize = axisSize - padding.left - padding.right;

            if (count == 0) {
                if (isValue || isTicksMode)
                    offsets.push({ offset: padding.left + paddedSize / 2, value: min });
                else
                    offsets.push({ offset: 0, value: min });

                return offsets;
            }

            var wBase = paddedSize / count;
            var wInt = wBase * baseInterval;

            var offset = padding.left;
            if (!isTicksMode) {
                if (!isValue)
                    max += baseInterval;
            }

            for (var i = min; i <= max; i += baseInterval, offset += wInt)
                offsets.push({ offset: offset, value: i });

            if (!isTicksMode && offsets.length > 1) {
                if (isNaN(tickPadding))
                    tickPadding = isValue ? 0 : wInt / 2;

                for (var i = 0; i < offsets.length; i++) {
                    offsets[i].offset -= tickPadding;
                    if (offsets[i].offset <= 2)
                        offsets[i].offset = 0;
                    if (offsets[i].offset >= axisSize - 2)
                        offsets[i].offset = axisSize;
                }
            }

            if (interval > baseInterval) {
                var out = [];
                var ratio = Math.round(interval / baseInterval);
                for (var i = 0; i < offsets.length; i++)
                    if ((i % ratio) == 0)
                        out.push({ offset: offsets[i].offset, value: offsets[i].value });

                offsets = out;
            }

            if (flip) {
                for (var i = 0; i < offsets.length; i++)
                    offsets[i].offset = axisSize - offsets[i].offset;
            }

            return offsets;
        },

        /** @private */
        _generateDTOffsets: function (min, max, axisSize, padding, interval, baseInterval, dateTimeUnit, isTicksMode, tickPadding, isValue, flip) {
            if (!dateTimeUnit)
                dateTimeUnit = 'day';

            var offsets = [];

            if (min > max)
                return offsets;

            if (min == max) {
                if (isValue)
                    offsets.push({ offset: isTicksMode ? axisSize / 2 : padding.left, value: min });
                else if (isTicksMode)
                    offsets.push({ offset: axisSize / 2, value: min });

                return offsets;
            }

            var paddedSize = axisSize - padding.left - padding.right;

            var curr = min;
            var initialOffset = padding.left;
            var offset = initialOffset;

            baseInterval = Math.max(baseInterval, 1);
            var realInterval = baseInterval;
            var frac = Math.min(1, baseInterval);

            if (baseInterval > 1)
                baseInterval = 1;

            while ($.jqx._ptrnd(offset) <= $.jqx._ptrnd(padding.left + paddedSize + (isTicksMode ? 0 : padding.right))) {
                offsets.push({ offset: offset, value: curr });

                var date = new Date(curr.valueOf());

                if (dateTimeUnit == 'millisecond')
                    date.setMilliseconds(curr.getMilliseconds() + baseInterval);
                else if (dateTimeUnit == 'second')
                    date.setSeconds(curr.getSeconds() + baseInterval);
                else if (dateTimeUnit == 'minute')
                    date.setMinutes(curr.getMinutes() + baseInterval);
                else if (dateTimeUnit == 'hour')
                    date.setHours(curr.getHours() + baseInterval);
                else if (dateTimeUnit == 'day')
                    date.setDate(curr.getDate() + baseInterval);
                else if (dateTimeUnit == 'month')
                    date.setMonth(curr.getMonth() + baseInterval);
                else if (dateTimeUnit == 'year')
                    date.setFullYear(curr.getFullYear() + baseInterval);

                curr = date;

                offset = initialOffset + (curr.valueOf() - min.valueOf()) * frac / (max.valueOf() - min.valueOf()) * paddedSize;
            }

            if (flip) {
                for (var i = 0; i < offsets.length; i++)
                    offsets[i].offset = axisSize - offsets[i].offset;
            }

            if (realInterval > 1) {
                var out = [];
                for (var i = 0; i < offsets.length; i += realInterval)
                    out.push({ offset: offsets[i].offset, value: offsets[i].value });

                offsets = out;
            }

            if (!isTicksMode && !isValue && offsets.length > 1) {
                var out = [];
                out.push({ offset: 0, value: undefined });
                for (var i = 1; i < offsets.length; i++) {
                    out.push({ offset: offsets[i - 1].offset + (offsets[i].offset - offsets[i - 1].offset) / 2, value: undefined });
                }

                var len = out.length;
                if (len > 1)
                    out.push({ offset: out[len - 1].offset + (out[len - 1].offset - out[len - 2].offset) });
                else
                    out.push({ offset: axisSize, value: undefined });

                offsets = out;
            }

            if (interval > baseInterval) {
                var out = [];
                var ratio = Math.round(interval / realInterval);
                for (var i = 0; i < offsets.length; i++)
                    if ((i % ratio) == 0)
                        out.push({ offset: offsets[i].offset, value: offsets[i].value });

                offsets = out;
            }

            return offsets;
        },

        /** @private */
        _buildStats: function (rect) {
            var stat = { seriesGroups: new Array() };
            this._stats = stat;

            for (var gidx = 0; gidx < this.seriesGroups.length; gidx++) {
                var group = this.seriesGroups[gidx];
                stat.seriesGroups[gidx] = {};

                var grst = stat.seriesGroups[gidx];
                grst.isValid = true;

                var hasValueAxis = group.valueAxis != undefined;
                var valueAxisSize = (group.orientation == 'horizontal') ? rect.width : rect.height;

                var logAxis = false;
                var logBase = 10;

                if (hasValueAxis) {
                    logAxis = group.valueAxis.logarithmicScale == true;
                    logBase = group.valueAxis.logarithmicScaleBase;
                    if (isNaN(logBase))
                        logBase = 10;
                }

                var isStacked = -1 != group.type.indexOf("stacked");
                var isStacked100 = isStacked && -1 != group.type.indexOf("100");
                var isRange = -1 != group.type.indexOf("range");

                if (isStacked100) {
                    grst.psums = new Array();
                    grst.nsums = new Array();
                }

                var gmin = NaN, gmax = NaN;
                var gsumP = NaN, gsumN = NaN;
                var gbase = group.baselineValue;
                if (isNaN(gbase))
                    gbase = logAxis && !isStacked100 ? 1 : 0;

                var len = this._getDataLen(gidx);
                var gMaxRange = 0;
                var minPercent = NaN;

                for (var i = 0; i < len && grst.isValid; i++) {
                    var min = hasValueAxis ? group.valueAxis.minValue : Infinity;
                    var max = hasValueAxis ? group.valueAxis.maxValue : -Infinity;
                    var sumP = 0, sumN = 0;

                    for (var sidx = 0; sidx < group.series.length; sidx++) {
                        if (!this._isSerieVisible(gidx, sidx))
                            continue;

                        var val = undefined, valMax = undefined, valMin = undefined;
                        if (isRange) {
                            var valFrom = this._getDataValueAsNumber(i, group.series[sidx].dataFieldFrom, gidx);
                            var valTo = this._getDataValueAsNumber(i, group.series[sidx].dataFieldTo, gidx);
                            valMax = Math.max(valFrom, valTo);
                            valMin = Math.min(valFrom, valTo);
                        }
                        else {
                            val = this._getDataValueAsNumber(i, group.series[sidx].dataField, gidx);
                            if (isNaN(val) || (logAxis && val <= 0))
                                continue;

                            valMin = valMax = val;
                        }


                        if ((isNaN(max) || valMax > max) && ((!hasValueAxis || isNaN(group.valueAxis.maxValue)) ? true : valMax <= group.valueAxis.maxValue))
                            max = Math.max(valMax, gbase);
                        if ((isNaN(min) || valMin < min) && ((!hasValueAxis || isNaN(group.valueAxis.minValue)) ? true : valMin >= group.valueAxis.minValue))
                            min = Math.min(valMin, gbase);

                        if (!isNaN(val)) {
                            if (val > gbase)
                                sumP += val;
                            else if (val < gbase)
                                sumN += val;
                        }
                    } // for sidx

                    // stacked series fit within min-max settings
                    if (!isStacked100 && hasValueAxis) {
                        if (!isNaN(group.valueAxis.maxValue))
                            sumP = Math.min(group.valueAxis.maxValue, sumP);
                        if (!isNaN(group.valueAxis.minValue))
                            sumN = Math.max(group.valueAxis.minValue, sumN);
                    }

                    if (logAxis && isStacked100) {
                        for (var sidx = 0; sidx < group.series.length; sidx++) {
                            if (!this._isSerieVisible(gidx, sidx)) {
                                minPercent = 0.01;
                                continue;
                            }

                            var val = this._getDataValueAsNumber(i, group.series[sidx].dataField, gidx);
                            if (isNaN(val) || val <= 0) {
                                minPercent = 0.01;
                                continue;
                            }

                            var p = sumP == 0 ? 0 : val / sumP;
                            if (isNaN(minPercent) || p < minPercent)
                                minPercent = p;
                        }
                    }

                    var range = sumP - sumN;
                    if (gMaxRange < range)
                        gMaxRange = range;

                    if (isStacked100) {
                        grst.psums[i] = sumP;
                        grst.nsums[i] = sumN;
                    }

                    if (max > gmax || isNaN(gmax))
                        gmax = max;
                    if (min < gmin || isNaN(gmin))
                        gmin = min;

                    if (sumP > gsumP || isNaN(gsumP))
                        gsumP = sumP;
                    if (sumN < gsumN || isNaN(gsumN))
                        gsumN = sumN;
                } // for i

                if (isStacked100) {
                    gsumP = gsumP == 0 ? 0 : Math.max(gsumP, -gsumN);
                    gsumN = gsumN == 0 ? 0 : Math.min(gsumN, -gsumP);
                }

                var mu = hasValueAxis ? group.valueAxis.unitInterval : 0;
                if (!mu) {
                    if (hasValueAxis) {
                        mu = this._calcInterval(
                            isStacked ? gsumN : gmin,
                            isStacked ? gsumP : gmax,
                            Math.max(valueAxisSize / 80, 2));
                    }
                    else {
                        mu = isStacked ? (gsumP - gsumN) / 10 : (gmax - gmin) / 10;
                    }
                }

                var intervals = NaN;

                // log axis scale
                var minPow = 0;
                var maxPow = 0;
                if (logAxis) {
                    if (isStacked100) {
                        intervals = 0;
                        var p = 1;
                        minPow = maxPow = $.jqx.log(100, logBase);

                        while (p > minPercent) {
                            p /= logBase;
                            minPow--;
                            intervals++;
                        }
                        gmin = Math.pow(logBase, minPow);

                    }
                    else {
                        if (isStacked)
                            gmax = Math.max(gmax, gsumP);

                        maxPow = $.jqx._rnd($.jqx.log(gmax, logBase), 1, true);
                        gmax = Math.pow(logBase, maxPow);

                        minPow = $.jqx._rnd($.jqx.log(gmin, logBase), 1, false);
                        gmin = Math.pow(logBase, minPow);
                    }

                    mu = logBase;
                } // if logAxis

                if (gmin < gsumN)
                    gsumN = gmin;
                if (gmax > gsumP)
                    gsumP = gmax;

                var mn = logAxis ? gmin : $.jqx._rnd(isStacked ? gsumN : gmin, mu, false);
                var mx = logAxis ? gmax : $.jqx._rnd(isStacked ? gsumP : gmax, mu, true);

                if (isStacked100 && mx > 100)
                    mx = 100;

                if (isStacked100 && !logAxis) {
                    mx = (mx > 0) ? 100 : 0;
                    mn = (mn < 0) ? -100 : 0;
                    mu = hasValueAxis ? group.valueAxis.unitInterval : 10;
                    if (isNaN(mu) || mu <= 0 || mu >= 100)
                        mu = 10;
                }

                if (isNaN(mx) || isNaN(mn) || isNaN(mu))
                    continue;

                if (isNaN(intervals))
                    intervals = parseInt(((mx - mn) / (mu == 0 ? 1 : mu)).toFixed());

                if (logAxis && !isStacked100) {
                    intervals = maxPow - minPow;
                    gMaxRange = Math.pow(logBase, intervals);
                }

                if (intervals < 1)
                    continue;

                grst.min = mn;
                grst.max = mx;
                grst.logarithmic = logAxis;
                grst.logBase = logBase;
                grst.base = gbase;
                grst.minPow = minPow;
                grst.maxPow = maxPow;
                grst.mu = mu;
                grst.maxRange = gMaxRange;
                grst.intervals = intervals;
            } // for gidx
        },

        /** @private */
        _getDataLen: function (groupIndex) {
            var ds = this.source;
            if (groupIndex != undefined && groupIndex != -1 && this.seriesGroups[groupIndex].source)
                ds = this.seriesGroups[groupIndex].source;

            if (ds instanceof $.jqx.dataAdapter)
                ds = ds.records;

            if (ds)
                return ds.length;

            return 0;
        },

        /** @private */
        _getDataValue: function (index, dataField, groupIndex) {
            var ds = this.source;
            if (groupIndex != undefined && groupIndex != -1)
                ds = this.seriesGroups[groupIndex].source || ds;

            if (ds instanceof $.jqx.dataAdapter)
                ds = ds.records;

            if (!ds || index < 0 || index > ds.length - 1)
                return undefined;

            if ($.isFunction(dataField))
                return dataField(index, ds);

            return (dataField && dataField != '') ? ds[index][dataField] : ds[index];
        },

        /** @private */
        _getDataValueAsNumber: function (index, dataField, groupIndex) {
            var val = this._getDataValue(index, dataField, groupIndex);
            if (this._isDate(val))
                return val.valueOf();

            if (typeof (val) != 'number')
                val = parseFloat(val);
            if (typeof (val) != 'number')
                val = undefined;

            return val;
        },

        /** @private */
        _renderPieSeries: function (groupIndex, rect) {
            var dataLength = this._getDataLen(groupIndex);
            var group = this.seriesGroups[groupIndex];

            var renderData = this._calcGroupOffsets(groupIndex, rect).offsets;

            for (var sidx = 0; sidx < group.series.length; sidx++) {
                var s = group.series[sidx]

                var settings = this._getSerieSettings(groupIndex, sidx);

                var colorScheme = s.colorScheme || group.colorScheme || this.colorScheme;

                var anim = this._getAnimProps(groupIndex, sidx);
                var duration = anim.enabled && dataLength < 5000 && !this._isToggleRefresh && this._isVML != true ? anim.duration : 0;
                if ($.jqx.mobile.isMobileBrowser() && (this.renderer instanceof $.jqx.HTML5Renderer))
                    duration = 0;

                var ctx = { rect: rect, groupIndex: groupIndex, serieIndex: sidx, settings: settings, items: [] };

                // render
                for (var i = 0; i < dataLength; i++) {
                    var itemRenderData = renderData[sidx][i];
                    if (!itemRenderData.visible)
                        continue;

                    var from = itemRenderData.fromAngle;
                    var to = itemRenderData.toAngle;

                    var pieSliceElement = this.renderer.pieslice(
                        itemRenderData.x,
                        itemRenderData.y,
                        itemRenderData.innerRadius,
                        itemRenderData.outerRadius,
                        from,
                        duration == 0 ? to : from,
                        itemRenderData.centerOffset);

                    var ctxItem = {
                        element: pieSliceElement,
                        displayValue: itemRenderData.displayValue,
                        itemIndex: i,
                        visible: itemRenderData.visible,
                        x: itemRenderData.x,
                        y: itemRenderData.y,
                        innerRadius: itemRenderData.innerRadius,
                        outerRadius: itemRenderData.outerRadius,
                        fromAngle: from,
                        toAngle: to,
                        centerOffset: itemRenderData.centerOffset
                    };

                    ctx.items.push(ctxItem);
                } // for i

                this._animatePieSlices(ctx, 0);
                var self = this;
                this._enqueueAnimation(
                        "series",
                        pieSliceElement,
                        undefined,
                        duration,
                        function (element, ctx, percent) {
                            self._animatePieSlices(ctx, percent);
                        },
                        ctx);
            }
        },

        /** @private */
        _sliceSortFunction: function (a, b) {
            return a.fromAngle - b.fromAngle;
        },

        /** @private */
        _animatePieSlices: function (ctx, percent) {
            var renderInfo;
            if (this._elementRenderInfo &&
                this._elementRenderInfo.length > ctx.groupIndex &&
                this._elementRenderInfo[ctx.groupIndex].series &&
                this._elementRenderInfo[ctx.groupIndex].series.length > ctx.serieIndex) {
                renderInfo = this._elementRenderInfo[ctx.groupIndex].series[ctx.serieIndex];
            }

            var animMaxAngle = 360 * percent;

            var arr = [];
            for (var i = 0; i < ctx.items.length; i++) {
                var item = ctx.items[i];

                // render the slice
                if (!item.visible)
                    continue;

                var fromAngle = item.fromAngle;
                var toAngle = item.fromAngle + percent * (item.toAngle - item.fromAngle);

                if (renderInfo && renderInfo[item.displayValue]) {
                    var oldFromAngle = renderInfo[item.displayValue].fromAngle;
                    var oldToAngle = renderInfo[item.displayValue].toAngle;

                    fromAngle = oldFromAngle + (fromAngle - oldFromAngle) * percent;
                    toAngle = oldToAngle + (toAngle - oldToAngle) * percent;
                }

                arr.push({ index: i, from: fromAngle, to: toAngle });
            }

            if (renderInfo)
                arr.sort(this._sliceSortFunction);

            var prevToAngle = NaN;
            for (var i = 0; i < arr.length; i++) {
                var item = ctx.items[arr[i].index];

                // remove lablel element if exists
                if (item.labelElement)
                    this.renderer.removeElement(item.labelElement);

                var fromAngle = arr[i].from;
                var toAngle = arr[i].to;

                if (renderInfo) {
                    if (!isNaN(prevToAngle) && fromAngle > prevToAngle)
                        fromAngle = prevToAngle;

                    prevToAngle = toAngle;
                    if (i == arr.length - 1 && toAngle != arr[0].from)
                        toAngle = 360 + arr[0].from;
                }

                var cmd = this.renderer.pieSlicePath(item.x, item.y, item.innerRadius, item.outerRadius, fromAngle, toAngle, item.centerOffset);
                this.renderer.attr(item.element, { 'd': cmd });

                var colors = this._getColors(ctx.groupIndex, ctx.serieIndex, item.itemIndex, 'radialGradient', item.outerRadius);
                var settings = ctx.settings;

                this.renderer.attr(
                    item.element,
                    {
                        fill: colors.fillColor,
                        stroke: colors.lineColor,
                        'stroke-width': settings.stroke,
                        'fill-opacity': settings.opacity,
                        'stroke-opacity': settings.opacity,
                        'stroke-dasharray': 'none' || settings.dashStyle
                    });

                var g = this.seriesGroups[ctx.groupIndex];
                var s = g.series[ctx.serieIndex];

                // Label rendering                
                if (s.showLabels == true || (!s.showLabels && g.showLabels == true)) {
                    var angleFrom = fromAngle, angleTo = toAngle;
                    var diff = Math.abs(angleFrom - angleTo);
                    var lFlag = diff > 180 ? 1 : 0;
                    if (diff > 360) {
                        angleFrom = 0;
                        angleTo = 360;
                    }

                    var radFrom = angleFrom * Math.PI * 2 / 360;
                    var radTo = angleTo * Math.PI * 2 / 360;
                    var midAngle = diff / 2 + angleFrom;

                    midAngle = midAngle % 360;
                    var radMid = midAngle * Math.PI * 2 / 360;

                    var labelAngleOverride;
                    if (s.labelsAutoRotate == true)
                        labelAngleOverride = midAngle < 90 || midAngle > 270 ? 360 - midAngle : 180 - midAngle;

                    // measure
                    var sz = this._showLabel(ctx.groupIndex, ctx.serieIndex, item.itemIndex, { x: 0, y: 0, width: 0, height: 0 }, 'center', 'center', true, false, false, labelAngleOverride);
                    var labelRadius = s.labelRadius || item.outerRadius + Math.max(sz.width, sz.height);
                    labelRadius += item.centerOffset;

                    var offsetX = $.jqx.getNum([s.offsetX, g.offsetX, ctx.rect.width / 2]);
                    var offsetY = $.jqx.getNum([s.offsetY, g.offsetY, ctx.rect.height / 2]);

                    var cx = ctx.rect.x + offsetX;
                    var cy = ctx.rect.y + offsetY;

                    var labelOffset = this._adjustTextBoxPosition(
                        cx,
                        cy,
                        sz,
                        labelRadius,
                        midAngle,
                        item.outerRadius > labelRadius,
                        s.labelLinesAngles != false,
                        s.labelsAutoRotate == true);

                    item.labelElement = this._showLabel(
                        ctx.groupIndex,
                        ctx.serieIndex,
                        item.itemIndex,
                        { x: labelOffset.x, y: labelOffset.y, width: sz.width, height: sz.height },
                        'left',
                        'top',
                        false,
                        false,
                        false,
                        labelAngleOverride);

                    if (labelRadius > item.outerRadius + 5 && s.labelLinesEnabled != false)
                        item.labelArrowPath = this._updateLebelArrowPath(item.labelArrowPath, cx, cy, labelRadius, item.outerRadius, radMid, s.labelLinesAngles != false, colors, settings);
                }

                // Install mouse event handlers
                if (percent == 1.0) {
                    this._installHandlers(item.element, 'pieslice', ctx.groupIndex, ctx.serieIndex, item.itemIndex);
                }
            }
        },

        _updateLebelArrowPath: function (pathElement, cx, cy, labelRadius, outerRadius, angle, useLineAngles, colors, settings) {
            var x1 = $.jqx._ptrnd(cx + (labelRadius - 0) * Math.cos(angle));
            var y1 = $.jqx._ptrnd(cy - (labelRadius - 0) * Math.sin(angle));
            var x2 = $.jqx._ptrnd(cx + (outerRadius + 2) * Math.cos(angle));
            var y2 = $.jqx._ptrnd(cy - (outerRadius + 2) * Math.sin(angle));

            var path = 'M ' + x1 + ',' + y1 + ' L' + x2 + ',' + y2;
            if (useLineAngles) {
                path = 'M ' + x1 + ',' + y1
                        + ' L' + x2 + ',' + y1
                        + ' L' + x2 + ',' + y2;
            }

            if (pathElement)
                this.renderer.attr(pathElement, { 'd': path });
            else
                pathElement = this.renderer.path(path, {});

            this.renderer.attr(
                        pathElement,
                        {
                            fill: 'none',
                            stroke: colors.lineColor,
                            'stroke-width': settings.stroke,
                            'stroke-opacity': settings.opacity,
                            'stroke-dasharray': 'none' || settings.dashStyle
                        });

            return pathElement;
        },

        _adjustTextBoxPosition: function (cx, cy, sz, labelRadius, angle, adjustToCenter, labelLinesAngles, labelsAutoRotate) {
            var angleInRad = angle * Math.PI * 2 / 360;

            var x = $.jqx._ptrnd(cx + labelRadius * Math.cos(angleInRad));
            var y = $.jqx._ptrnd(cy - labelRadius * Math.sin(angleInRad));

            if (labelsAutoRotate) {
                var w = sz.width;
                var h = sz.height;

                var b = Math.atan(h / w) % (Math.PI * 2);
                var a = angleInRad % (Math.PI * 2);

                var cX = 0, cY = 0;

                var radiusCorrection = 0;
                if (a <= b) {
                    radiusCorrection = w / 2 * Math.cos(angleInRad);
                    cY = radiusCorrection * Math.sin(angleInRad);
                    cX = -w / 2;
                }
                else if (a >= b && a < Math.PI - b) {
                    radiusCorrection = (h / 2) * Math.sin(angleInRad);
                    cY = h / 2;
                    cX = -Math.cos(angleInRad) * radiusCorrection;
                }
                else if (a >= Math.PI - b && a < Math.PI + b) {
                    radiusCorrection = w / 2 * Math.cos(angleInRad);
                    cY = -radiusCorrection * Math.sin(angleInRad);
                    cX = w / 2;

                }
                else if (a >= Math.PI + b && a < 2 * Math.PI - b) {
                    radiusCorrection = h / 2 * Math.sin(angleInRad);
                    cY = -h / 2;
                    cX = Math.cos(angleInRad) * radiusCorrection;
                }
                else if (a >= 2 * Math.PI - b && a < 2 * Math.PI) {
                    radiusCorrection = w / 2 * Math.cos(angleInRad);
                    cY = radiusCorrection * Math.sin(angleInRad);
                    cX = -w / 2;
                }

                labelRadius += Math.abs(radiusCorrection) + 3;

                var x = $.jqx._ptrnd(cx + labelRadius * Math.cos(angleInRad));
                var y = $.jqx._ptrnd(cy - labelRadius * Math.sin(angleInRad));

                x -= sz.width / 2;
                y -= sz.height / 2;

                return { x: x, y: y };
            }

            if (!adjustToCenter) {
                if (!labelLinesAngles) {
                    //0 -  45 && 315-360: left, middle
                    //45 - 135: center, bottom
                    //135 - 225: right, middle
                    //225 - 315: center, top
                    if (angle >= 0 && angle < 45 || angle >= 315 && angle < 360)
                        y -= sz.height / 2;
                    else if (angle >= 45 && angle < 135) {
                        y -= sz.height;
                        x -= sz.width / 2;
                    }
                    else if (angle >= 135 && angle < 225) {
                        y -= sz.height / 2;
                        x -= sz.width;
                    }
                    else if (angle >= 225 && angle < 315) {
                        x -= sz.width / 2;
                    }
                }
                else {
                    //90 -  270: right, middle
                    //0 - 90, 270 - 360: left, middle
                    if (angle >= 90 && angle < 270) {
                        y -= sz.height / 2;
                        x -= sz.width;
                    }
                    else {
                        y -= sz.height / 2;
                    }

                }
            }
            else {
                x -= sz.width / 2;
                y -= sz.height / 2;
            }

            return { x: x, y: y };
        },

        /** @private */
        _getColumnGroupsCount: function (orientation) {
            var cnt = 0;
            orientation = orientation || 'vertical';
            var sg = this.seriesGroups;
            for (var i = 0; i < sg.length; i++) {
                var groupOrientation = sg[i].orientation || 'vertical';
                if (sg[i].type.indexOf('column') != -1 && groupOrientation == orientation)
                    cnt++;
            }

            return cnt;
        },

        /** @private */
        _getColumnGroupIndex: function (groupIndex) {
            var idx = 0;
            var orientation = this.seriesGroups[groupIndex].orientation || 'vertical';
            for (var i = 0; i < groupIndex; i++) {
                var sg = this.seriesGroups[i];
                var sgOrientation = sg.orientation || 'vertical';
                if (sg.type.indexOf('column') != -1 && sgOrientation == orientation)
                    idx++;
            }

            return idx;
        },

        /** @private */
        _renderBand: function (groupIndex, bandIndex, rect) {
            var group = this.seriesGroups[groupIndex];
            if (!group.bands || group.bands.length <= bandIndex)
                return;
            var gRect = rect;
            if (group.orientation == 'horizontal')
                gRect = { x: rect.y, y: rect.x, width: rect.height, height: rect.width };

            var renderData = this._calcGroupOffsets(groupIndex, gRect);
            if (!renderData || renderData.length <= groupIndex)
                return;

            var band = group.bands[bandIndex];
            var bandRenderData = renderData.bands[bandIndex];

            var from = bandRenderData.from;
            var to = bandRenderData.to;
            var h = Math.abs(from - to);

            var elRect = { x: gRect.x, y: Math.min(from, to), width: gRect.width, height: h };
            if (group.orientation == 'horizontal') {
                var tmp = elRect.x;
                elRect.x = elRect.y;
                elRect.y = tmp;

                tmp = elRect.width;
                elRect.width = elRect.height;
                elRect.height = tmp;
            }

            var bandElement = this.renderer.rect(elRect.x, elRect.y, elRect.width, elRect.height);
            var fillColor = band.color || '#AAAAAA';
            var opacity = band.opacity;
            if (isNaN(opacity) || opacity < 0 || opacity > 1)
                opacity = 0.5;

            this.renderer.attr(bandElement, { fill: fillColor, 'fill-opacity': opacity, stroke: fillColor, 'stroke-opacity': opacity, 'stroke-width': 0 });

        },

        /** @private */
        _renderColumnSeries: function (groupIndex, rect) {
            var group = this.seriesGroups[groupIndex];
            if (!group.series || group.series.length == 0)
                return;

            var isStacked = group.type.indexOf('stacked') != -1;
            var isStacked100 = isStacked && group.type.indexOf('100') != -1;
            var isRange = group.type.indexOf('range') != -1;

            var dataLength = this._getDataLen(groupIndex);

            var columnGap = group.columnsGapPercent;
            if (isNaN(columnGap) || columnGap < 0 || columnGap > 100)
                columnGap = 25;

            var seriesGap = group.seriesGapPercent;
            if (isNaN(seriesGap) || seriesGap < 0 || seriesGap > 100)
                seriesGap = 10;

            var inverse = group.orientation == 'horizontal';

            var gRect = rect;
            if (inverse)
                gRect = { x: rect.y, y: rect.x, width: rect.height, height: rect.width };

            var renderData = this._calcGroupOffsets(groupIndex, gRect);
            if (!renderData || renderData.xoffsets.length == 0)
                return;

            var columnGroupsCount = this._getColumnGroupsCount(group.orientation);
            var relativeGroupIndex = this._getColumnGroupIndex(groupIndex);
            if (this.columnSeriesOverlap == true) {
                columnGroupsCount = 1;
                relativeGroupIndex = 0;
            }

            var valuesOnTicks = true; // this._alignValuesWithTicks(groupIndex);

            var polarAxisCoords;
            if (group.polar == true || group.spider == true) {
                polarAxisCoords = this._getPolarAxisCoords(groupIndex, gRect);

                // reset the columns gap to 0 in case of a polar axis
                columnGap = 0;
                seriesGap = 0;
                //valuesOnTicks = false;
            }

            var ctx = { groupIndex: groupIndex, rect: rect, vertical: !inverse, seriesCtx: [], renderData: renderData, polarAxisCoords: polarAxisCoords };

            var gradientType = this._getGroupGradientType(groupIndex);

            for (var sidx = 0; sidx < group.series.length; sidx++) {
                var s = group.series[sidx];
                var columnsMaxWidth = s.columnsMaxWidth || group.columnsMaxWidth;

                var dataField = s.dataField;

                var anim = this._getAnimProps(groupIndex, sidx);
                var duration = anim.enabled && !this._isToggleRefresh && renderData.xoffsets.length < 100 ? anim.duration : 0;

                // Calculate horizontal adjustment
                var xAdjust = 0;
                var itemWidth = renderData.xoffsets.itemWidth;
                if (valuesOnTicks)
                    xAdjust -= itemWidth / 2;

                xAdjust += itemWidth * (relativeGroupIndex / columnGroupsCount);
                itemWidth /= columnGroupsCount;

                var x2 = xAdjust + itemWidth;
                var wGroup = (x2 - xAdjust /*+ 1*/);
                var wGroupRender = (x2 - xAdjust /*+ 1*/) / (1 + columnGap / 100);
                var seriesSpace = (!isStacked && group.series.length > 1) ? (wGroupRender * seriesGap / 100) / (group.series.length - 1) : 0;
                var wColumn = (wGroupRender - seriesSpace * (group.series.length - 1));
                if (wGroupRender < 1)
                    wGroupRender = 1;

                var col = 0;
                if (!isStacked && group.series.length > 1) {
                    wColumn /= group.series.length;
                    col = sidx;
                }

                var xAdj = xAdjust + (wGroup - wGroupRender) / 2 + col * (seriesSpace + wColumn);
                if (col == group.series.length)
                    wColumn = wGroup - xAdjust + wGroupRender - x;

                if (!isNaN(columnsMaxWidth)) {
                    var wColumnAdj = Math.min(wColumn, columnsMaxWidth);
                    xAdj = xAdj + (wColumn - wColumnAdj) / 2;
                    wColumn = wColumnAdj;
                }
                ///////////////////////////////////

                var isVisible = this._isSerieVisible(groupIndex, sidx);

                var serieSettings = this._getSerieSettings(groupIndex, sidx);
                var serieColors = this._getColors(groupIndex, sidx, NaN, this._getGroupGradientType(groupIndex), 4);

                var itemsColors = [];
                if ($.isFunction(s.colorFunction) && !polarAxisCoords) {
                    for (var i = renderData.xoffsets.first; i <= renderData.xoffsets.last; i++)
                        itemsColors.push(this._getColors(groupIndex, sidx, i, gradientType, 4));
                }

                var serieCtx = { seriesIndex: sidx, serieColors: serieColors, itemsColors: itemsColors, settings: serieSettings, columnWidth: wColumn, xAdjust: xAdj, isVisible: isVisible };

                ctx.seriesCtx.push(serieCtx);
            }

            this._animateColumns(ctx, duration == 0 ? 1 : 0);

            var self = this;
            this._enqueueAnimation(
                        "series",
                        undefined,
                        undefined,
                        duration,
                        function (element, ctx, percent) {
                            self._animateColumns(ctx, percent);
                        },
                        ctx);
        },

        /** @private */
        _getColumnOffsets: function (renderData, groupIndex, seriesCtx, itemIndex, isStacked, percent) {
            var group = this.seriesGroups[groupIndex];

            var offsets = [];

            for (var iSerie = 0; iSerie < seriesCtx.length; iSerie++) {
                var serieCtx = seriesCtx[iSerie];
                var sidx = serieCtx.seriesIndex;
                var s = group.series[sidx];

                var from = renderData.offsets[sidx][itemIndex].from;
                var to = renderData.offsets[sidx][itemIndex].to;
                var xOffset = renderData.xoffsets.data[itemIndex];

                var itemStartState = undefined;

                var isVisible = serieCtx.isVisible;
                if (!isVisible)
                    to = from;

                if (isVisible && this._elementRenderInfo && this._elementRenderInfo.length > groupIndex) {
                    var xvalue = renderData.xoffsets.xvalues[itemIndex];
                    itemStartState = this._elementRenderInfo[groupIndex].series[sidx][xvalue];
                    if (itemStartState && !isNaN(itemStartState.from) && !isNaN(itemStartState.to)) {
                        from = itemStartState.from + (from - itemStartState.from) * percent;
                        to = itemStartState.to + (to - itemStartState.to) * percent;
                        xOffset = itemStartState.xoffset + (xOffset - itemStartState.xoffset) * percent;
                    }
                }

                if (!itemStartState)
                    to = from + (to - from) * (isStacked ? 1 : percent);

                if (isNaN(from))
                    from = 0;
                if (isNaN(to))
                    to = isNaN(from) ? 0 : from;

                offsets.push({ from: from, to: to, xOffset: xOffset });
            }

            if (isStacked && offsets.length > 1 && !(this._elementRenderInfo && this._elementRenderInfo.length > groupIndex)) {
                var sumP = 0, sumN = 0;
                for (var i = 0; i < offsets.length; i++) {
                    if (offsets[i].to >= offsets[i].from)
                        sumN += offsets[i].to - offsets[i].from;
                    else
                        sumP += offsets[i].from - offsets[i].to;
                }

                sumP *= percent;
                sumN *= percent;

                var curP = 0, curN = 0;
                for (var i = 0; i < offsets.length; i++) {
                    if (offsets[i].to >= offsets[i].from) {
                        var diff = offsets[i].to - offsets[i].from;
                        if (diff + curN > sumN) {
                            diff = Math.max(0, sumN - curN);
                            offsets[i].to = offsets[i].from + diff;
                        }

                        curN += diff;
                    }
                    else {
                        var diff = offsets[i].from - offsets[i].to;
                        if (diff + curP > sumP) {
                            diff = Math.max(0, sumP - curP);
                            offsets[i].to = offsets[i].from - diff;
                        }

                        curP += diff;
                    }
                }
            }

            return offsets;
        },

        /** @private */
        _columnAsPieSlice: function (elements, elementIndex, plotRect, polarAxisCoords, columnRect) {
            var pointOuter = this._toPolarCoord(polarAxisCoords, plotRect, columnRect.x, columnRect.y)
            var pointInner = this._toPolarCoord(polarAxisCoords, plotRect, columnRect.x, columnRect.y + columnRect.height)
            var pointOuter2 = this._toPolarCoord(polarAxisCoords, plotRect, columnRect.x + columnRect.width, columnRect.y)

            var innerRadius = $.jqx._ptdist(polarAxisCoords.x, polarAxisCoords.y, pointInner.x, pointInner.y);
            var outerRadius = $.jqx._ptdist(polarAxisCoords.x, polarAxisCoords.y, pointOuter.x, pointOuter.y);
            var width = plotRect.width;

            var toAngle = -((columnRect.x - plotRect.x) * 360) / width;
            var fromAngle = -((columnRect.x + columnRect.width - plotRect.x) * 360) / width;

            var startAngle = polarAxisCoords.startAngle;
            startAngle = 360 * startAngle / (Math.PI * 2);
            toAngle -= startAngle;
            fromAngle -= startAngle;

            if (elements[elementIndex] != undefined) {
                var cmd = this.renderer.pieSlicePath(polarAxisCoords.x, polarAxisCoords.y, innerRadius, outerRadius, fromAngle, toAngle, 0);
                this.renderer.attr(elements[elementIndex], { 'd': cmd });
            }
            else {
                elements[elementIndex] = this.renderer.pieslice(
                                    polarAxisCoords.x,
                                    polarAxisCoords.y,
                                    innerRadius,
                                    outerRadius,
                                    fromAngle,
                                    toAngle,
                                    0);
            }

            return { fromAngle: fromAngle, toAngle: toAngle, innerRadius: innerRadius, outerRadius: outerRadius };
        },

        /** @private */
        _animateColumns: function (context, percent) {
            var gidx = context.groupIndex;
            var group = this.seriesGroups[gidx];
            var renderData = context.renderData;

            var isStacked = group.type.indexOf('stacked') != -1;

            var polarAxisCoords = context.polarAxisCoords;

            var gradientType = this._getGroupGradientType(gidx);

            for (var i = renderData.xoffsets.first; i <= renderData.xoffsets.last; i++) {

                var offsets = this._getColumnOffsets(renderData, gidx, context.seriesCtx, i, isStacked, percent);

                for (var iSerie = 0; iSerie < context.seriesCtx.length; iSerie++) {
                    var serieCtx = context.seriesCtx[iSerie];
                    var sidx = serieCtx.seriesIndex;
                    var serie = group.series[sidx];

                    var from = offsets[iSerie].from;
                    var to = offsets[iSerie].to;
                    var xOffset = offsets[iSerie].xOffset;

                    if (!serieCtx.elements)
                        serieCtx.elements = {};

                    if (!serieCtx.labelElements)
                        serieCtx.labelElements = {};

                    var elements = serieCtx.elements;
                    var labelElements = serieCtx.labelElements;

                    var startOffset = (context.vertical ? context.rect.x : context.rect.y) + serieCtx.xAdjust;

                    var settings = serieCtx.settings;
                    var colors = serieCtx.itemsColors.length != 0 ? serieCtx.itemsColors[i - renderData.xoffsets.first] : serieCtx.serieColors;

                    var isVisible = this._isSerieVisible(gidx, sidx);

                    if (!isVisible && !isStacked)
                        continue;

                    var x = $.jqx._ptrnd(startOffset + xOffset);

                    var rect = { x: x, width: serieCtx.columnWidth };

                    var isInverseDirection = true;

                    if (context.vertical) {
                        rect.y = from;
                        rect.height = to - from;
                        if (rect.height < 0) {
                            rect.y += rect.height;
                            rect.height = -rect.height;
                            isInverseDirection = false;
                        }
                    }
                    else {
                        rect.x = from < to ? from : to;
                        rect.width = Math.abs(from - to);
                        rect.y = x;
                        rect.height = serieCtx.columnWidth;
                    }

                    var size = from - to;
                    if (isNaN(size))
                        continue;

                    size = Math.abs(size);

                    if (elements[i] == undefined) {
                        if (!polarAxisCoords) {
                            elements[i] = this.renderer.rect(rect.x, rect.y, context.vertical ? rect.width : 0, context.vertical ? 0 : rect.height);
                        }
                        else {
                            this._columnAsPieSlice(elements, i, context.rect, polarAxisCoords, rect);
                        }

                        this.renderer.attr(elements[i], { fill: colors.fillColor, 'fill-opacity': settings.opacity, 'stroke-opacity': settings.opacity, stroke: colors.lineColor, 'stroke-width': settings.stroke, 'stroke-dasharray': settings.dashStyle });
                    }

                    if (size < 1 && percent != 1)
                        this.renderer.attr(elements[i], { display: 'none' });
                    else
                        this.renderer.attr(elements[i], { display: 'block' });

                    if (polarAxisCoords) {
                        var pieSliceInfo = this._columnAsPieSlice(elements, i, context.rect, polarAxisCoords, rect);
                        var colors = this._getColors(gidx, sidx, undefined, 'radialGradient', pieSliceInfo.outerRadius);
                        this.renderer.attr(elements[i], { fill: colors.fillColor, 'fill-opacity': settings.opacity, 'stroke-opacity': settings.opacity, stroke: colors.lineColor, 'stroke-width': settings.stroke, 'stroke-dasharray': settings.dashStyle });
                    }
                    else {
                        if (context.vertical == true)
                            this.renderer.attr(elements[i], { x: rect.x, y: rect.y, height: size });
                        else
                            this.renderer.attr(elements[i], { x: rect.x, y: rect.y, width: size });
                    }

                    this.renderer.removeElement(labelElements[i]);

                    if (!isVisible || (size == 0 && percent < 1))
                        continue;

                    labelElements[i] = this._showLabel(gidx, sidx, i, rect, undefined, undefined, false, false, isInverseDirection);

                    if (percent == 1.0) {
                        this._installHandlers(elements[i], 'column', gidx, sidx, i);
                    }
                }
            }
        },

        /** @private */
        _renderScatterSeries: function (groupIndex, rect) {
            var group = this.seriesGroups[groupIndex];
            if (!group.series || group.series.length == 0)
                return;

            var isBubble = group.type.indexOf('bubble') != -1;

            var inverse = group.orientation == 'horizontal';

            var gRect = rect;
            if (inverse)
                gRect = { x: rect.y, y: rect.x, width: rect.height, height: rect.width };

            var renderData = this._calcGroupOffsets(groupIndex, gRect);

            if (!renderData || renderData.xoffsets.length == 0)
                return;

            var scaleWidth = gRect.width;

            var polarAxisCoords;
            if (group.polar || group.spider) {
                polarAxisCoords = this._getPolarAxisCoords(groupIndex, gRect);
                scaleWidth = 2 * polarAxisCoords.r;
            }

            var valuesOnTicks = this._alignValuesWithTicks(groupIndex);

            var gradientType = this._getGroupGradientType(groupIndex);

            for (var sidx = 0; sidx < group.series.length; sidx++) {
                var settings = this._getSerieSettings(groupIndex, sidx);

                var s = group.series[sidx];
                var dataField = s.dataField;

                var hasColorFunction = $.isFunction(s.colorFunction);

                var colors = this._getColors(groupIndex, sidx, NaN, gradientType);

                var min = NaN, max = NaN;
                if (isBubble) {
                    for (var i = renderData.xoffsets.first; i <= renderData.xoffsets.last; i++) {
                        var val = this._getDataValueAsNumber(i, s.radiusDataField, groupIndex);
                        if (typeof (val) != 'number')
                            throw 'Invalid radiusDataField value at [' + i + ']';

                        if (!isNaN(val)) {
                            if (isNaN(min) || val < min)
                                min = val;
                            if (isNaN(max) || val > max)
                                max = val;
                        }
                    }
                }

                var minRadius = s.minRadius;
                if (isNaN(minRadius))
                    minRadius = scaleWidth / 50;

                var maxRadius = s.maxRadius;
                if (isNaN(maxRadius))
                    maxRadius = scaleWidth / 25;

                if (minRadius > maxRadius)
                    maxRadius = minRadius;

                var radius = s.radius || 5;

                var anim = this._getAnimProps(groupIndex, sidx);
                var duration = anim.enabled && !this._isToggleRefresh && renderData.xoffsets.length < 5000 ? anim.duration : 0;

                var ctx = {
                    groupIndex: groupIndex,
                    seriesIndex: sidx,
                    'fill-opacity': settings.opacity,
                    'stroke-opacity': settings.opacity,
                    'stroke-width': settings.stroke,
                    'stroke-dasharray': settings.dashStyle,
                    items: [],
                    polarAxisCoords: polarAxisCoords
                };

                for (var i = renderData.xoffsets.first; i <= renderData.xoffsets.last; i++) {
                    var val = this._getDataValueAsNumber(i, dataField, groupIndex);
                    if (typeof (val) != 'number')
                        continue;

                    var x = renderData.xoffsets.data[i];
                    var y = renderData.offsets[sidx][i].to;
                    var xvalue = renderData.xoffsets.xvalues[i];

                    if (isNaN(x) || isNaN(y))
                        continue;

                    if (inverse) {
                        var tmp = x;
                        x = y;
                        y = tmp + rect.y;
                    }
                    else {
                        x += rect.x;
                    }

                    var r = radius;
                    if (isBubble) {
                        var rval = this._getDataValueAsNumber(i, s.radiusDataField, groupIndex);
                        if (typeof (rval) != 'number')
                            continue;
                        r = minRadius + (maxRadius - minRadius) * (rval - min) / Math.max(1, max - min);
                        if (isNaN(r))
                            r = minRadius;
                    }

                    var yOld = NaN, xOld = NaN;
                    var rOld = 0;
                    if (xvalue != undefined && this._elementRenderInfo && this._elementRenderInfo.length > groupIndex) {
                        var itemStartState = this._elementRenderInfo[groupIndex].series[sidx][xvalue];
                        if (itemStartState && !isNaN(itemStartState.to)) {
                            yOld = itemStartState.to;
                            xOld = itemStartState.xoffset;
                            rOld = radius;

                            if (inverse) {
                                var tmp = xOld;
                                xOld = yOld;
                                yOld = tmp + rect.y;
                            }
                            else {
                                xOld += rect.x;
                            }

                            if (isBubble) {
                                rOld = minRadius + (maxRadius - minRadius) * (itemStartState.valueRadius - min) / Math.max(1, max - min);
                                if (isNaN(rOld))
                                    rOld = minRadius;
                            }
                        }
                    }


                    if (hasColorFunction)
                        colors = this._getColors(groupIndex, sidx, i, gradientType);

                    ctx.items.push({
                        from: rOld,
                        to: r,
                        itemIndex: i,
                        fill: colors.fillColor,
                        stroke: colors.lineColor,
                        x: x,
                        y: y,
                        xFrom: xOld,
                        yFrom: yOld
                    });
                } // i

                this._animR(ctx, 0);

                var self = this;
                var elem = undefined;
                this._enqueueAnimation("series", undefined, undefined, duration,
                        function (undefined, context, percent) {
                            self._animR(context, percent);
                        }, ctx);
            }
        },

        /** @private */
        _animR: function (ctx, percent) {
            var items = ctx.items;

            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var x = item.x;
                var y = item.y;

                var r = Math.round((item.to - item.from) * percent + item.from);
                if (!isNaN(item.yFrom))
                    y = item.yFrom + (y - item.yFrom) * percent;
                if (!isNaN(item.xFrom))
                    x = item.xFrom + (x - item.xFrom) * percent;

                if (ctx.polarAxisCoords) {
                    var point = this._toPolarCoord(ctx.polarAxisCoords, this._plotRect, x, y)
                    x = point.x;
                    y = point.y;
                }

                x = $.jqx._ptrnd(x);
                y = $.jqx._ptrnd(y);
                r = $.jqx._ptrnd(r);

                var element = item.element;
                if (!element) {
                    element = this.renderer.circle(x, y, r);
                    this.renderer.attr(element, { fill: item.fill, 'fill-opacity': ctx['fill-opacity'], 'stroke-opacity': ctx['fill-opacity'], stroke: item.stroke, 'stroke-width': ctx['stroke-width'], 'stroke-dasharray': ctx['stroke-dasharray'] });
                    item.element = element;
                }

                if (this._isVML) {
                    this.renderer.updateCircle(element, undefined, undefined, r);
                }
                else {
                    this.renderer.attr(element, { r: r, cy: y, cx: x });
                }

                if (item.labelElement)
                    this.renderer.removeElement(item.labelElement);

                item.labelElement = this._showLabel(ctx.groupIndex, ctx.seriesIndex, item.itemIndex, { x: x - r, y: y - r, width: 2 * r, height: 2 * r });

                if (percent >= 1)
                    this._installHandlers(element, 'circle', ctx.groupIndex, ctx.seriesIndex, item.itemIndex);

            }
        },

        /** @private */
        _showToolTip: function (x, y, gidx, sidx, iidx) {
            var self = this;
            var xAxis = self._getCategoryAxis(gidx);

            if (self._ttEl &&
                gidx == self._ttEl.gidx &&
                sidx == self._ttEl.sidx &&
                iidx == self._ttEl.iidx)
                return;

            var group = self.seriesGroups[gidx];
            var series = group.series[sidx];

            var enableCrosshairs = self.enableCrosshairs && !(group.polar || group.spider);

            if (self._pointMarker) {
                // make it relative to the marker instead of cursor
                x = parseInt(self._pointMarker.x + 5);
                y = parseInt(self._pointMarker.y - 5);
            }
            else {
                enableCrosshairs = false;
            }

            var isCrossHairsOnly = enableCrosshairs && self.showToolTips == false;


            x = $.jqx._ptrnd(x);
            y = $.jqx._ptrnd(y);

            var isNew = self._ttEl == undefined;

            if (group.showToolTips == false || series.showToolTips == false)
                return;

            var valfs = series.toolTipFormatSettings || group.toolTipFormatSettings;
            var valff = series.toolTipFormatFunction || group.toolTipFormatFunction || self.toolTipFormatFunction;

            var colors = self._getColors(gidx, sidx, iidx);

            var catvalue = self._getDataValue(iidx, xAxis.dataField, gidx);
            if (xAxis.dataField == undefined || xAxis.dataField == '')
                catvalue = iidx;
            if (xAxis.type == 'date')
                catvalue = self._castAsDate(catvalue);

            var text = '';

            if ($.isFunction(valff)) {
                var value = {};
                if (group.type.indexOf('range') == -1) {
                    value = self._getDataValue(iidx, series.dataField, gidx);
                }
                else {
                    value.from = self._getDataValue(iidx, series.dataFieldFrom, gidx);
                    value.to = self._getDataValue(iidx, series.dataFieldTo, gidx);
                }

                text = valff(value, iidx, series, group, catvalue, xAxis);
            }
            else {
                text = self._getFormattedValue(gidx, sidx, iidx, valfs, valff);

                var catfs = xAxis.toolTipFormatSettings || xAxis.formatSettings;
                var catff = xAxis.toolTipFormatFunction || xAxis.formatFunction;
                if (!catff && !catfs && xAxis.type == 'date')
                    catff = this._getDefaultDTFormatFn(xAxis.baseUnit || 'day');

                var categoryText = self._formatValue(catvalue, catfs, catff);

                if (group.type != 'pie' && group.type != 'donut')
                    text = (series.displayText || series.dataField || '') + ', ' + categoryText + ': ' + text;
                else {
                    catvalue = self._getDataValue(iidx, series.displayText || series.dataField, gidx);
                    categoryText = self._formatValue(catvalue, catfs, catff);
                    text = categoryText + ': ' + text;
                }
            }

            var cssToolTip = series.toolTipClass || group.toolTipClass || this.toThemeProperty('jqx-chart-tooltip-text', null);
            var toolTipFill = series.toolTipBackground || group.toolTipBackground || '#FFFFFF';
            var toolTipStroke = series.toolTipLineColor || group.toolTipLineColor || colors.lineColor;

            if (!self._ttEl) {
                self._ttEl = {};
            }
            self._ttEl.sidx = sidx;
            self._ttEl.gidx = gidx;
            self._ttEl.iidx = iidx;

            rect = self.renderer.getRect();

            if (enableCrosshairs) {
                var _x = $.jqx._ptrnd(self._pointMarker.x);
                var _y = $.jqx._ptrnd(self._pointMarker.y);
                if (self._ttEl.vLine && self._ttEl.hLine) {
                    self.renderer.attr(self._ttEl.vLine, { x1: _x, x2: _x });
                    self.renderer.attr(self._ttEl.hLine, { y1: _y, y2: _y });
                }
                else {
                    var color = self.crosshairsColor || '#888888';
                    self._ttEl.vLine = self.renderer.line(_x, self._plotRect.y, _x, self._plotRect.y + self._plotRect.height, { stroke: color, 'stroke-width': self.crosshairsLineWidth || 1.0, 'stroke-dasharray': self.crosshairsDashStyle || '' });
                    self._ttEl.hLine = self.renderer.line(self._plotRect.x, _y, self._plotRect.x + self._plotRect.width, _y, { stroke: color, 'stroke-width': self.crosshairsLineWidth || 1.0, 'stroke-dasharray': self.crosshairsDashStyle || '' });
                }
            }

            if (!isCrossHairsOnly && self.showToolTips != false) {
                var div = !isNew ? self._ttEl.box : document.createElement("div");
                var offset = { left: 0, top: 0 };
                if (isNew) {
                    div.style.position = 'absolute';
                    div.style.cursor = 'default';
                    div.style.overflow = 'hidden';
                    $(div).addClass('jqx-rc-all jqx-button');
                    $(div).css('z-index', 9999999);
                    $(document.body).append(div);
                }
                div.style.backgroundColor = toolTipFill;
                div.style.borderColor = toolTipStroke;

                self._ttEl.box = div;
                self._ttEl.txt = text;

                var html = "<span class='" + cssToolTip + "'>" + text + "</span>";

                var measureDiv = self._ttEl.tmp;
                if (isNew) {
                    self._ttEl.tmp = measureDiv = document.createElement("div");
                    measureDiv.style.position = 'absolute';
                    measureDiv.style.cursor = 'default';
                    measureDiv.style.overflow = 'hidden';
                    measureDiv.style.display = 'none';
                    measureDiv.style.zIndex = 999999;
                    measureDiv.style.backgroundColor = toolTipFill;
                    measureDiv.style.borderColor = toolTipStroke;
                    $(measureDiv).addClass('jqx-rc-all jqx-button');
                    self.host.append(measureDiv);
                }
                $(measureDiv).html(html);

                if (!text || text.length == 0) {
                    $(div).fadeTo(0, 0);
                    return;
                }


                var sz = { width: $(measureDiv).width(), height: $(measureDiv).height() };
                sz.width = sz.width + 5;
                sz.height = sz.height + 6;

                x = Math.max(x, rect.x);
                y = Math.max(y - sz.height, rect.y);

                if (sz.width > rect.width || sz.height > rect.height)
                    return;

                if (x + offset.left + sz.width > rect.x + rect.width - 5) {
                    x = rect.x + rect.width - sz.width - offset.left - 5;
                }

                if (y + offset.top + sz.height > rect.y + rect.height - 5) {
                    y = rect.y + rect.height - sz.height - 5;
                }

                var hostPosition = self.host.coord();
                if (isNew) {
                    $(div).fadeOut(0, 0);
                    div.style.left = offset.left + x + hostPosition.left + 'px';
                    div.style.top = offset.top + y + hostPosition.top + 'px';
                }

                $(div).html(html);
                $(div).clearQueue();
                $(div).animate({ left: offset.left + x + hostPosition.left, top: offset.top + y + hostPosition.top, opacity: 1 }, 300, 'easeInOutCirc');
                $(div).fadeTo(400, 1);
            }
        },

        /** @private */
        _hideToolTip: function (delay) {
            if (!this._ttEl)
                return;

            if (this._ttEl.box) {
                if (delay == 0)
                    $(this._ttEl.box).hide();
                else
                    $(this._ttEl.box).fadeOut();
            }

            this._hideCrosshairs();

            this._ttEl.gidx = undefined;

        },

        /** @private */
        _hideCrosshairs: function () {
            if (!this._ttEl)
                return;

            if (this._ttEl.vLine) {
                this.renderer.removeElement(this._ttEl.vLine);
                this._ttEl.vLine = undefined;
            }

            if (this._ttEl.hLine) {
                this.renderer.removeElement(this._ttEl.hLine);
                this._ttEl.hLine = undefined;
            }
        },

        /** @private */
        _showLabel: function (gidx, sidx, iidx, rect, halign, valign, isMeasure, inverseHAlign, inverseVAlign, labelAngleOverride) {
            var group = this.seriesGroups[gidx];
            var series = group.series[sidx];
            var sz = { width: 0, height: 0 };
            if (series.showLabels == false || (!series.showLabels && !group.showLabels))
                return isMeasure ? sz : undefined;

            if (rect.width < 0 || rect.height < 0)
                return isMeasure ? sz : undefined;

            var labelCSS = series.labelClass || group.labelClass || this.toThemeProperty('jqx-chart-label-text', null);
            var labelsAngle = series.labelAngle || series.labelsAngle || group.labelAngle || group.labelsAngle || 0;
            if (!isNaN(labelAngleOverride))
                labelsAngle = labelAngleOverride;

            var offset = series.labelOffset || series.labelsOffset || group.labelOffset || group.labelsOffset || {};
            var labelOffset = { x: offset.x, y: offset.y };
            if (isNaN(labelOffset.x))
                labelOffset.x = 0;
            if (isNaN(labelOffset.y))
                labelOffset.y = 0;

            halign = halign || series.labelsHorizontalAlignment || group.labelsHorizontalAlignment || 'center';
            valign = valign || series.labelsVerticalAlignment || group.labelsVerticalAlignment || 'center';
            var text = this._getFormattedValue(gidx, sidx, iidx);
            var w = rect.width;
            var h = rect.height;

            if (inverseHAlign == true && halign != 'center')
                halign = halign == 'right' ? 'left' : 'right';

            if (inverseVAlign == true && valign != 'center' && valign != 'middle') {
                valign = valign == 'top' ? 'bottom' : 'top';
                labelOffset.y *= -1;
            }

            sz = this.renderer.measureText(text, labelsAngle, { 'class': labelCSS });
            if (isMeasure)
                return sz;

            var x = 0;
            if (w > 0) {
                if (halign == '' || halign == 'center')
                    x += (w - sz.width) / 2;
                else if (halign == 'right')
                    x += (w - sz.width);
            }

            var y = 0;
            if (h > 0) {
                if (valign == '' || valign == 'center')
                    y += (h - sz.height) / 2;
                else if (valign == 'bottom')
                    y += (h - sz.height);
            }

            x += rect.x + labelOffset.x;
            y += rect.y + labelOffset.y;

            var plotRect = this._plotRect;

            if (x <= plotRect.x)
                x = plotRect.x + 2;

            if (y <= plotRect.y)
                y = plotRect.y + 2;

            var labelSize = { width: Math.max(sz.width, 1), height: Math.max(sz.height, 1) };

            if (y + labelSize.height >= plotRect.y + plotRect.height)
                y = plotRect.y + plotRect.height - labelSize.height - 2;

            if (x + labelSize.width >= plotRect.x + plotRect.width)
                x = plotRect.x + plotRect.width - labelSize.width - 2;


            var elemLabel = this.renderer.text(text, x, y, sz.width, sz.height, labelsAngle, { 'class': labelCSS }, false, 'center', 'center');
            this.renderer.attr(elemLabel, { 'class': labelCSS });
            if (this._isVML) {
                this.renderer.removeElement(elemLabel);
                this.renderer.getContainer()[0].appendChild(elemLabel);
            }

            return elemLabel;
        },

        /** @private */
        _getAnimProps: function (gidx, sidx) {
            var g = this.seriesGroups[gidx];
            var s = !isNaN(sidx) ? g.series[sidx] : undefined;

            var enabled = this.enableAnimations == true;

            if (g.enableAnimations)
                enabled = g.enableAnimations == true;

            if (s && s.enableAnimations)
                enabled = s.enableAnimations == true;

            var duration = this.animationDuration;
            if (isNaN(duration))
                duration = 1000;

            var gd = g.animationDuration;
            if (!isNaN(gd))
                duration = gd;

            if (s) {
                var sd = s.animationDuration;
                if (!isNaN(sd))
                    duration = sd;
            }

            if (duration > 5000)
                duration = 1000;

            return { enabled: enabled, duration: duration };
        },

        _isColorTransition: function (groupIndex, s, renderData, current) {
            if (current - 1 < renderData.xoffsets.first)
                return false;

            var currentColor = this._getColors(groupIndex, s, current, this._getGroupGradientType(groupIndex));
            var prevColor = this._getColors(groupIndex, s, current - 1, this._getGroupGradientType(groupIndex));

            return (currentColor.fillColor != prevColor.fillColor);
        },

        /** @private */
        _renderLineSeries: function (groupIndex, rect) {
            var group = this.seriesGroups[groupIndex];
            if (!group.series || group.series.length == 0)
                return;

            var isArea = group.type.indexOf('area') != -1;
            var isStacked = group.type.indexOf('stacked') != -1;
            var isStacked100 = isStacked && group.type.indexOf('100') != -1;
            var isSpline = group.type.indexOf('spline') != -1;
            var isStep = group.type.indexOf('step') != -1;
            var isRange = group.type.indexOf('range') != -1;
            var isPolar = group.polar == true || group.spider == true;
            if (isPolar)
                isStep = false;

            if (isStep && isSpline)
                return;

            var dataLength = this._getDataLen(groupIndex);
            var wPerItem = rect.width / dataLength;

            var swapXY = group.orientation == 'horizontal';
            var flipCategory = this._getCategoryAxis(groupIndex).flip == true;

            var gRect = rect;
            if (swapXY)
                gRect = { x: rect.y, y: rect.x, width: rect.height, height: rect.width };

            var renderData = this._calcGroupOffsets(groupIndex, gRect);

            if (!renderData || renderData.xoffsets.length == 0)
                return;

            if (!this._linesRenderInfo)
                this._linesRenderInfo = {};

            this._linesRenderInfo[groupIndex] = {};

            for (var sidx = group.series.length - 1; sidx >= 0; sidx--) {
                var serieSettings = this._getSerieSettings(groupIndex, sidx);

                var serieCtx = {
                    groupIndex: groupIndex,
                    serieIndex: sidx,
                    swapXY: swapXY,
                    isArea: isArea,
                    isSpline: isSpline,
                    isRange: isRange,
                    isPolar: isPolar,
                    settings: serieSettings,
                    segments: [],
                    pointsLength: 0
                };

                var isVisible = this._isSerieVisible(groupIndex, sidx);
                if (!isVisible) {
                    this._linesRenderInfo[groupIndex][sidx] = serieCtx;
                    continue;
                }

                var serie = group.series[sidx];

                var hasColorFunction = $.isFunction(serie.colorFunction);

                var curr = renderData.xoffsets.first;
                var last = curr;

                var color = this._getColors(groupIndex, sidx, NaN, this._getGroupGradientType(groupIndex));

                var colorBreakPoint = false;

                do {
                    var points = [];
                    var rangeBasePoints = [];
                    var pointsStart = [];

                    var prev = -1;
                    var px = 0;
                    var xPrev = NaN;
                    var yPrev = NaN;
                    var pyStart = NaN;

                    if (renderData.xoffsets.length < 1)
                        continue;

                    var anim = this._getAnimProps(groupIndex, sidx);
                    var duration = anim.enabled && !this._isToggleRefresh && renderData.xoffsets.length < 10000 && this._isVML != true ? anim.duration : 0;
                    var first = curr;
                    var continueOnCurr = false;

                    var currentColor = this._getColors(groupIndex, sidx, curr, this._getGroupGradientType(groupIndex));
                    for (var i = curr; i <= renderData.xoffsets.last; i++) {
                        curr = i;

                        var x = renderData.xoffsets.data[i];
                        var xvalue = renderData.xoffsets.xvalues[i];

                        if (isNaN(x))
                            continue;

                        x = Math.max(x, 1);
                        px = x;

                        var py = renderData.offsets[sidx][i].to;
                        var pyFrom = renderData.offsets[sidx][i].from;
                        if (isNaN(py) || isNaN(pyFrom)) {
                            if (serie.emptyPointsDisplay == 'connect') {
                                continue;
                            }
                            else if (serie.emptyPointsDisplay == 'zero') {
                                if (isNaN(py))
                                    py = renderData.baseOffset;
                                if (isNaN(pyFrom))
                                    pyFrom = renderData.baseOffset;
                            }
                            else {
                                //curr++;
                                continueOnCurr = true;
                                break;
                            }
                        }

                        if (hasColorFunction && this._isColorTransition(groupIndex, sidx, renderData, curr)) {
                            if (points.length > 1) {
                                curr--;
                                break;
                            }
                        }

                        if (this._elementRenderInfo &&
                            this._elementRenderInfo.length > groupIndex &&
                            this._elementRenderInfo[groupIndex].series.length > sidx
                            ) {
                            var itemStartState = this._elementRenderInfo[groupIndex].series[sidx][xvalue];
                            var pyStart = $.jqx._ptrnd(itemStartState ? itemStartState.to : undefined);
                            var pxStart = $.jqx._ptrnd(gRect.x + (itemStartState ? itemStartState.xoffset : undefined));

                            pointsStart.push(swapXY ? { y: pxStart, x: pyStart, index: i} : { x: pxStart, y: pyStart, index: i });
                        }

                        last = i;

                        if (serieSettings.stroke < 2) {
                            if (py - gRect.y <= 1)
                                py = gRect.y + 1;
                            if (pyFrom - gRect.y <= 1)
                                pyFrom = gRect.y + 1;
                            if (gRect.y + gRect.height - py <= 1)
                                py = gRect.y + gRect.height - 1;
                            if (gRect.y + gRect.height - py <= 1)
                                pyFrom = gRect.y + gRect.height - 1;
                        }

                        if (!isArea && isStacked100) {
                            if (py <= gRect.y)
                                py = gRect.y + 1;
                            if (py >= gRect.y + gRect.height)
                                py = gRect.y + gRect.height - 1;

                            if (pyFrom <= gRect.y)
                                pyFrom = gRect.y + 1;
                            if (pyFrom >= gRect.y + gRect.height)
                                pyFrom = gRect.y + gRect.height - 1;
                        }

                        // TODO: validate condition
                        x = Math.max(x, 1);
                        px = x + gRect.x;

                        if (isStep && !isNaN(xPrev) && !isNaN(yPrev)) {
                            if (yPrev != py)
                                points.push(swapXY ? { y: px, x: $.jqx._ptrnd(yPrev)} : { x: px, y: $.jqx._ptrnd(yPrev) });
                        }

                        points.push(swapXY ? { y: px, x: $.jqx._ptrnd(py), index: i} : { x: px, y: $.jqx._ptrnd(py), index: i });
                        rangeBasePoints.push(swapXY ? { y: px, x: $.jqx._ptrnd(pyFrom), index: i} : { x: px, y: $.jqx._ptrnd(pyFrom), index: i });

                        xPrev = px;
                        yPrev = py;
                        if (isNaN(pyStart))
                            pyStart = py;
                    }

                    if (points.length == 0) {
                        curr++;
                        continue;
                    }

                    var lastItemIndex = points[points.length - 1].index;
                    if (hasColorFunction)
                        color = this._getColors(groupIndex, sidx, lastItemIndex, this._getGroupGradientType(groupIndex));

                    var left = gRect.x + renderData.xoffsets.data[first];
                    var right = gRect.x + renderData.xoffsets.data[last];

                    if (isArea && group.alignEndPointsWithIntervals == true) {
                        var sign = flipCategory ? -1 : 1;
                        if (left > gRect.x) {
                            left = gRect.x;
                        }
                        if (right < gRect.x + gRect.width)
                            right = gRect.x + gRect.width;

                        if (flipCategory) {
                            var tmp = left;
                            left = right;
                            right = tmp;
                        }
                    }
                    right = $.jqx._ptrnd(right);
                    left = $.jqx._ptrnd(left);

                    var yBase = renderData.baseOffset;
                    pyStart = $.jqx._ptrnd(pyStart);

                    var pyEnd = $.jqx._ptrnd(py) || yBase;

                    if (isRange) {
                        points = points.concat(rangeBasePoints.reverse());
                    }

                    serieCtx.pointsLength += points.length;

                    var segmentCtx = {
                        lastItemIndex: lastItemIndex,
                        colorSettings: color,
                        pointsArray: points,
                        pointsStart: pointsStart,
                        left: left,
                        right: right,
                        pyStart: pyStart,
                        pyEnd: pyEnd,
                        yBase: yBase,
                        labelElements: [],
                        symbolElements: []
                    };

                    serieCtx.segments.push(segmentCtx);
                }
                while (curr < renderData.xoffsets.length - 1 || continueOnCurr);

                this._linesRenderInfo[groupIndex][sidx] = serieCtx;
            } // for s

            var contexts = this._linesRenderInfo[groupIndex];
            var contextsArr = [];
            for (var i in contexts)
                contextsArr.push(contexts[i]);

            contextsArr = contextsArr.sort(function (a, b) { return a.serieIndex - b.serieIndex; });

            if (isArea && isStacked)
                contextsArr.reverse();

            for (var i = 0; i < contextsArr.length; i++) {
                var serieCtx = contextsArr[i];
                this._animateLine(serieCtx, duration == 0 ? 1 : 0);

                var self = this;
                this._enqueueAnimation(
                        "series",
                        undefined,
                        undefined,
                        duration,
                        function (element, context, percent) {
                            self._animateLine(context, percent);
                        },
                        serieCtx);
            }

        },

        /** @private */
        _animateLine: function (serieCtx, percent) {
            var settings = serieCtx.settings;
            var groupIndex = serieCtx.groupIndex;
            var serieIndex = serieCtx.serieIndex;
            var group = this.seriesGroups[groupIndex];
            var serie = group.series[serieIndex];

            var symbol = this._getSymbol(groupIndex, serieIndex);
            var showLabels = serie.showLabels == true || (group.showLabels && serie.showLabels != false);

            var startPoint = 0;
            for (var iSegment = 0; iSegment < serieCtx.segments.length; iSegment++) {
                var ctx = serieCtx.segments[iSegment];
                var cmd = this._calculateLine(groupIndex, serieCtx.pointsLength, startPoint, ctx.pointsArray, ctx.pointsStart, ctx.yBase, percent, serieCtx.isArea, serieCtx.swapXY);
                startPoint += ctx.pointsArray.length;

                if (cmd == '')
                    continue;

                var split = cmd.split(' ');
                var cnt = split.length;

                var lineCmd = cmd;
                if (lineCmd != '')
                    lineCmd = this._buildLineCmd(cmd, serieCtx.isRange, ctx.left, ctx.right, ctx.pyStart, ctx.pyEnd, ctx.yBase, serieCtx.isArea, serieCtx.isPolar, serieCtx.isSpline, serieCtx.swapXY);
                else
                    lineCmd = 'M 0 0';

                var colorSettings = ctx.colorSettings;

                if (!ctx.pathElement) {
                    ctx.pathElement = this.renderer.path(
                                    lineCmd,
                                    {
                                        'stroke-width': settings.stroke,
                                        'stroke': colorSettings.lineColor,
                                        'stroke-opacity': settings.opacity,
                                        'fill-opacity': settings.opacity,
                                        'stroke-dasharray': settings.dashStyle,
                                        fill: serieCtx.isArea ? colorSettings.fillColor : 'none'
                                    });

                    this._installHandlers(ctx.pathElement, 'path', groupIndex, serieIndex, ctx.lastItemIndex);
                }
                else {
                    this.renderer.attr(ctx.pathElement, { 'd': lineCmd });
                }

                if (ctx.labelElements) {
                    for (var i = 0; i < ctx.labelElements.length; i++)
                        this.renderer.removeElement(ctx.labelElements[i]);

                    ctx.labelElements = [];
                }

                if (ctx.symbolElements) {
                    for (var i = 0; i < ctx.symbolElements.length; i++)
                        this.renderer.removeElement(ctx.symbolElements[i]);

                    ctx.symbolElements = [];
                }


                if (ctx.pointsArray.length == split.length) {
                    if (symbol != 'none' || showLabels) {
                        var symbolSize = serie.symbolSize;

                        for (var i = 0; i < split.length; i++) {
                            var point = split[i].split(',');
                            point = { x: parseFloat(point[0]), y: parseFloat(point[1]) };

                            if (symbol != 'none') {
                                var itemColors = this._getColors(groupIndex, serieIndex, ctx.pointsArray[i].index, this._getGroupGradientType(groupIndex));
                                var symbolElement = this._drawSymbol(symbol, point.x, point.y, itemColors.fillColorSymbol, itemColors.lineColorSymbol, 1, settings.opacity, symbolSize);
                                ctx.symbolElements.push(symbolElement);
                            }

                            if (showLabels) {
                                var pointPrev = (i > 0 ? split[i - 1] : split[i]).split(',');
                                pointPrev = { x: parseFloat(pointPrev[0]), y: parseFloat(pointPrev[1]) };

                                var pointNext = (i < split.length - 1 ? split[i + 1] : split[i]).split(',');
                                pointNext = { x: parseFloat(pointNext[0]), y: parseFloat(pointNext[1]) };

                                point = this._adjustLineLabelPosition(groupIndex, serieIndex, ctx.pointsArray[i].index, point, pointPrev, pointNext);

                                var labelElement = this._showLabel(groupIndex, serieIndex, ctx.pointsArray[i].index, { x: point.x, y: point.y, width: 0, height: 0 });
                                ctx.labelElements.push(labelElement);
                            }
                        }
                    }
                }


                if (percent == 1 && symbol != 'none') {
                    for (var i = 0; i < ctx.symbolElements.length; i++) {
                        this._installHandlers(ctx.symbolElements[i], 'symbol', groupIndex, serieIndex, ctx.pointsArray[i].index);
                    }
                }
            } // iSegment
        },

        /** @private */
        _adjustLineLabelPosition: function (gidx, sidx, iidx, pt, ptPrev, ptNext) {
            var labelSize = this._showLabel(gidx, sidx, iidx, { width: 0, height: 0 }, '', '', true);

            var ptAdj = { x: 0, y: 0 };

            if (pt.y == ptPrev.y && pt.x == ptPrev.x) {
                if (ptNext.y < pt.y)
                    ptAdj = { x: pt.x, y: pt.y + labelSize.height };
                else
                    ptAdj = { x: pt.x, y: pt.y - labelSize.height };
            }
            else if (pt.y == ptNext.y && pt.x == ptNext.x) {
                if (ptPrev.y < pt.y)
                    ptAdj = { x: pt.x, y: pt.y + labelSize.height };
                else
                    ptAdj = { x: pt.x, y: pt.y - labelSize.height };
            }


            if (pt.y > ptPrev.y && pt.y > ptNext.y)
                ptAdj = { x: pt.x, y: pt.y + labelSize.height };
            else
                ptAdj = { x: pt.x, y: pt.y - labelSize.height };

            return ptAdj;
        },

        /** @private */
        _calculateLine: function (groupIndex, seriePointsLength, startPoint, pointsArray, pointsStartArray, yBase, percent, isArea, swapXY) {
            var g = this.seriesGroups[groupIndex];

            var polarAxisCoords = undefined;
            if (g.polar == true || g.spider == true)
                polarAxisCoords = this._getPolarAxisCoords(groupIndex, this._plotRect);

            var cmd = '';

            var cnt = pointsArray.length;
            if (!isArea && pointsStartArray.length == 0) {
                var stop = seriePointsLength * percent;
                cnt = stop - startPoint;
            }

            var baseXSave = NaN;
            for (var i = 0; i < cnt + 1 && i < pointsArray.length; i++) {
                if (i > 0)
                    cmd += ' ';
                var y = pointsArray[i].y;
                var x = pointsArray[i].x;
                var baseY = !isArea ? y : yBase;
                var baseX = x;
                if (pointsStartArray && pointsStartArray.length > i) {
                    baseY = pointsStartArray[i].y;
                    baseX = pointsStartArray[i].x;
                    if (isNaN(baseY) || isNaN(baseX)) {
                        baseY = y;
                        baseX = x;
                    }
                }

                baseXSave = baseX;

                if (cnt <= pointsArray.length && i > 0 && i == cnt) {
                    baseX = pointsArray[i - 1].x;
                    baseY = pointsArray[i - 1].y;
                }

                if (swapXY) {
                    x = $.jqx._ptrnd((x - baseY) * (isArea ? percent : 1) + baseY);
                    y = $.jqx._ptrnd(y);
                }
                else {
                    x = $.jqx._ptrnd((x - baseX) * percent + baseX);
                    y = $.jqx._ptrnd((y - baseY) * percent + baseY);
                }

                if (polarAxisCoords) {
                    var point = this._toPolarCoord(polarAxisCoords, this._plotRect, x, y)
                    x = point.x;
                    y = point.y;
                }

                cmd += x + ',' + y;

                if (pointsArray.length == 1 && !isArea)
                    cmd += ' ' + (x + 2) + ',' + (y + 2);
            }

            return cmd;
        },

        /** @private */
        _buildLineCmd: function (pointsArray, isRange, left, right, pyStart, pyEnd, yBase, isArea, isPolar, isSpline, swapXY) {
            var cmd = pointsArray;

            if (isArea && !isPolar && !isRange) {
                var ptBottomLeft = swapXY ? yBase + ',' + left : left + ',' + yBase
                var ptBottomRight = swapXY ? yBase + ',' + right : right + ',' + yBase;

                cmd = ptBottomLeft + ' ' + pointsArray + ' ' + ptBottomRight;
            }

            if (isSpline)
                cmd = this._getBezierPoints(cmd);

            var split = cmd.split(' ');
            var firstPoint = split[0].replace('C', '');

            if (isArea && !isPolar) {
                if (!isRange) {
                    cmd = 'M ' + ptBottomLeft + ' L ' + firstPoint + ' ' + cmd; // +' Z';
                }
                else {
                    cmd = 'M ' + firstPoint + ' L ' + firstPoint
                        + (isSpline ? '' : (' L ' + firstPoint + ' '))
                        + cmd; //+' Z';
                }
            }
            else {
                if (isSpline)
                    cmd = 'M ' + firstPoint + ' ' + cmd;
                else
                    cmd = 'M ' + firstPoint + ' ' + 'L ' + firstPoint + ' ' + cmd;
            }

            if (isPolar /*&& isArea*/)
                cmd += ' Z';

            return cmd;
        },

        /** @private */
        _getSerieSettings: function (groupIndex, seriesIndex) {
            var group = this.seriesGroups[groupIndex];
            var isArea = group.type.indexOf('area') != -1;
            var isLine = group.type.indexOf('line') != -1;

            var serie = group.series[seriesIndex];

            var dashStyle = serie.dashStyle || group.dashStyle || '';

            var opacity = serie.opacity || group.opacity;
            if (isNaN(opacity) || opacity < 0 || opacity > 1)
                opacity = 1;

            var stroke = serie.lineWidth;
            if (isNaN(stroke) && stroke != 'auto')
                stroke = group.lineWidth;

            if (stroke == 'auto' || isNaN(stroke) || stroke < 0 || stroke > 15) {
                if (isArea)
                    stroke = 2;
                else if (isLine)
                    stroke = 3;
                else
                    stroke = 1;
            }

            return { stroke: stroke, opacity: opacity, dashStyle: dashStyle };
        },

        /** @private */
        _getColors: function (gidx, sidx, iidx, gradientType, gradientStops) {
            var group = this.seriesGroups[gidx];

            var serie = group.series[sidx];

            var useGradient = serie.useGradient;
            if (useGradient == undefined)
                useGradient = serie.useGradientColors;
            if (useGradient == undefined)
                useGradient = group.useGradient;
            if (useGradient == undefined)
                useGradient = group.useGradientColors;

            if (useGradient == undefined)
                useGradient = true;

            var colors = this._getSeriesColors(gidx, sidx, iidx);

            if (!colors.fillColor) {
                colors.fillColor = color;
                colors.fillColorSelected = $.jqx.adjustColor(color, 1.1);
                colors.lineColor = colors.symbolColor = $.jqx.adjustColor(color, 0.9);
                colors.lineColorSelected = colors.symbolColorSelected = $.jqx.adjustColor(color, 0.9);
            }

            var stops2 = [[0, 1.4], [100, 1]];
            var stops4 = [[0, 1], [25, 1.1], [50, 1.4], [100, 1]];
            var stopsR = [[0, 1.3], [90, 1.2], [100, 1.0]];

            var stops = NaN;
            if (!isNaN(gradientStops)) {
                stops = gradientStops == 2 ? stops2 : stops4;
            }

            if (useGradient) {
                if (gradientType == 'verticalLinearGradient') {
                    colors.fillColor = this.renderer._toLinearGradient(colors.fillColor, true, stops || stops2);
                    colors.fillColorSelected = this.renderer._toLinearGradient(colors.fillColorSelected, true, stops || stops2);
                }
                else if (gradientType == 'horizontalLinearGradient') {
                    colors.fillColor = this.renderer._toLinearGradient(colors.fillColor, false, stops || stops4);
                    colors.fillColorSelected = this.renderer._toLinearGradient(colors.fillColorSelected, false, stops || stops4);
                }
                else if (gradientType == 'radialGradient') {
                    var params = undefined;
                    var stops = stops2;
                    if ((group.type == 'pie' || group.type == 'donut' || group.polar) && iidx != undefined && this._renderData[gidx] && this._renderData[gidx].offsets[sidx]) {
                        params = this._renderData[gidx].offsets[sidx][iidx];
                        stops = stopsR;
                    }

                    colors.fillColor = this.renderer._toRadialGradient(colors.fillColor, stops, params);
                    colors.fillColorSelected = this.renderer._toRadialGradient(colors.fillColorSelected, stops, params);
                }
            }

            return colors;
        },

        /** @private */
        _installHandlers: function (element, elementType, gidx, sidx, iidx) {
            if (!this.enableEvents)
                return false;

            var self = this;
            var g = this.seriesGroups[gidx];
            var s = this.seriesGroups[gidx].series[sidx];

            var isLineType = g.type.indexOf('line') != -1 || g.type.indexOf('area') != -1;

            if (!isLineType) {
                this.renderer.addHandler(element, 'mousemove', function (e) {
                    e.preventDefault();

                    var x = e.pageX || e.clientX || e.screenX;
                    var y = e.pageY || e.clientY || e.screenY;

                    var pos = self.host.offset();
                    x -= pos.left;
                    y -= pos.top;

                    if (self._mouseX == x && self._mouseY == y)
                        return;

                    if (self._ttEl) {
                        if (self._ttEl.gidx == gidx &&
                        self._ttEl.sidx == sidx &&
                        self._ttEl.iidx == iidx)
                            return;
                    }

                    self._startTooltipTimer(gidx, sidx, iidx);
                });

                this.renderer.addHandler(element, 'mouseout', function (e) {
                    if (!isNaN(self._lastClickTs) && (new Date()).valueOf() - self._lastClickTs < 100)
                        return;

                    e.preventDefault();

                    if (iidx != undefined)
                        self._cancelTooltipTimer();

                    if (isLineType)
                        return;

                    self._unselect();
                });
            }


            this.renderer.addHandler(element, 'mouseover', function (e) {
                e.preventDefault();
                self._select(element, elementType, gidx, sidx, iidx, iidx);
            });


            this.renderer.addHandler(element, 'click', function (e) {
                clearTimeout(self._hostClickTimer);

                self._lastClickTs = (new Date()).valueOf();

                if (isLineType && (elementType != 'symbol' && elementType != 'pointMarker'))
                    return;

                if (g.type.indexOf('column') != -1)
                    self._unselect();

                if (isNaN(iidx))
                    return;

                self._raiseItemEvent('click', g, s, iidx);
            });
        },

        /** @private */
        _getHorizontalOffset: function (gidx, sidx, x, y) {
            var rect = this._plotRect;
            var dataLength = this._getDataLen(gidx);
            if (dataLength == 0)
                return { index: undefined, value: x };

            var renderData = this._calcGroupOffsets(gidx, this._plotRect);
            if (renderData.xoffsets.length == 0)
                return { index: undefined, value: undefined };

            var px = x;
            var py = y;

            var g = this.seriesGroups[gidx];

            var polarAxisCoords;
            if (g.polar || g.spider)
                polarAxisCoords = this._getPolarAxisCoords(gidx, rect);

            if (g.orientation == 'horizontal' && !polarAxisCoords) {
                var tmp = px;
                px = py;
                py = tmp;
            }

            var inverse = this._getCategoryAxis(gidx).flip == true;

            var minDist, idx, x1Selected, y1Selected;

            for (var i = renderData.xoffsets.first; i <= renderData.xoffsets.last; i++) {
                var x1 = renderData.xoffsets.data[i];
                var y1 = renderData.offsets[sidx][i].to;

                var dist = 0;

                if (polarAxisCoords) {
                    var point = this._toPolarCoord(polarAxisCoords, rect, x1 + rect.x, y1)
                    x1 = point.x;
                    y1 = point.y;
                    dist = $.jqx._ptdist(px, py, x1, y1);
                }
                else {
                    x1 += rect.x;
                    y1 += rect.y;
                    dist = Math.abs(px - x1);
                }

                if (isNaN(minDist) || minDist > dist) {
                    minDist = dist;
                    idx = i;
                    x1Selected = x1;
                    y1Selected = y1;

                }
            }

            return { index: idx, value: renderData.xoffsets.data[idx], polarAxisCoords: polarAxisCoords, x: x1Selected, y: y1Selected };
        },

        /** @private */
        onmousemove: function (x, y) {
            if (this._mouseX == x && this._mouseY == y)
                return;

            this._mouseX = x;
            this._mouseY = y;

            if (!this._selected)
                return;

            var gidx = this._selected.group;
            var sidx = this._selected.series;
            var g = this.seriesGroups[gidx];
            var s = g.series[sidx];

            var rect = this._plotRect;
            if (this.renderer) {
                rect = this.renderer.getRect();
                rect.x += 5;
                rect.y += 5;
                rect.width -= 10;
                rect.height -= 10;
            }

            if (x < rect.x || x > rect.x + rect.width ||
                y < rect.y || y > rect.y + rect.height) {
                this._hideToolTip();
                this._unselect();
                return;
            }

            var inverse = g.orientation == 'horizontal';

            var rect = this._plotRect;
            if (g.type.indexOf('line') != -1 || g.type.indexOf('area') != -1) {
                var offset = this._getHorizontalOffset(gidx, this._selected.series, x, y);
                var i = offset.index;
                if (i == undefined)
                    return;

                if (this._selected.item != i) {
                    var segs = this._linesRenderInfo[gidx][sidx].segments;
                    var segId = 0;

                    while (i > segs[segId].lastItemIndex) {
                        segId++;
                        if (segId >= segs.length)
                            return;
                    }


                    var element = segs[segId].pathElement;
                    var iidxBase = segs[segId].lastItemIndex;

                    this._unselect(false);

                    this._select(element, 'path', gidx, sidx, i, iidxBase);
                }
                else
                    return;

                var symbolType = this._getSymbol(this._selected.group, this._selected.series);
                if (symbolType == 'none')
                    symbolType = 'circle';

                var renderData = this._calcGroupOffsets(gidx, rect);
                var to = renderData.offsets[this._selected.series][i].to;

                var from = to;
                if (g.type.indexOf('range') != -1) {
                    from = renderData.offsets[this._selected.series][i].from;
                }

                var cmp = inverse ? x : y;
                if (!isNaN(from) && Math.abs(cmp - from) < Math.abs(cmp - to))
                    y = from;
                else
                    y = to;

                if (isNaN(y))
                    return;

                x = offset.value;

                if (inverse) {
                    var tmp = x;
                    x = y;
                    y = tmp + rect.y;
                }
                else {
                    x += rect.x;
                }

                if (offset.polarAxisCoords) {
                    x = offset.x;
                    y = offset.y;
                }

                y = $.jqx._ptrnd(y);
                x = $.jqx._ptrnd(x);

                if (this._pointMarker && this._pointMarker.element) {
                    this.renderer.removeElement(this._pointMarker.element);
                    this._pointMarker.element = undefined;
                }

                if (isNaN(x) || isNaN(y)) {
                    return;
                }

                var colors = this._getSeriesColors(gidx, sidx, i);

                var opacity = s.opacity;
                if (isNaN(opacity) || opacity < 0 || opacity > 1.0)
                    opacity = g.opacity;
                if (isNaN(opacity) || opacity < 0 || opacity > 1.0)
                    opacity = 1.0;

                var symbolSize = s.symbolSizeSelected;
                if (isNaN(symbolSize))
                    symbolSize = s.symbolSize;
                if (isNaN(symbolSize) || symbolSize > 50 || symbolSize < 0)
                    symbolSize = g.symbolSize;
                if (isNaN(symbolSize) || symbolSize > 50 || symbolSize < 0)
                    symbolSize = 6;

                this._pointMarker = { type: symbolType, x: x, y: y, gidx: gidx, sidx: sidx, iidx: i };
                this._pointMarker.element = this._drawSymbol(symbolType, x, y, colors.fillColorSymbolSelected, colors.lineColorSymbolSelected, 1, opacity, symbolSize);
                this._installHandlers(this._pointMarker.element, 'pointMarker', gidx, sidx, i);

                this._startTooltipTimer(gidx, this._selected.series, i);
            }
        },

        /** @private */
        _drawSymbol: function (type, x, y, fill, stroke, lineWidth, opacity, size) {
            var element;
            var sz = size || 6;
            var sz2 = sz / 2;
            switch (type) {
                case 'none':
                    return undefined;
                case 'circle':
                    element = this.renderer.circle(x, y, sz / 2);
                    break;
                case 'square':
                    sz = sz - 1; sz2 = sz / 2;
                    element = this.renderer.rect(x - sz2, y - sz2, sz, sz);
                    break;
                case 'diamond':
                    {
                        var path = 'M ' + (x - sz2) + ',' + (y)
                            + ' L' + (x) + ',' + (y - sz2)
                            + ' L' + (x + sz2) + ',' + (y)
                            + ' L' + (x) + ',' + (y + sz2)
                            + ' Z';
                        element = this.renderer.path(path);
                    } break;
                case 'triangle_up':
                    {
                        var path = 'M ' + (x - sz2) + ',' + (y + sz2)
                            + ' L ' + (x + sz2) + ',' + (y + sz2)
                            + ' L ' + (x) + ',' + (y - sz2)
                            + ' Z';
                        element = this.renderer.path(path);
                    } break;
                case 'triangle_down':
                    {
                        var path = 'M ' + (x - sz2) + ',' + (y - sz2)
                            + ' L ' + (x) + ',' + (y + sz2)
                            + ' L ' + (x + sz2) + ',' + (y - sz2)
                            + ' Z';
                        element = this.renderer.path(path);
                    } break;
                case 'triangle_left':
                    {
                        var path = 'M ' + (x - sz2) + ',' + (y)
                            + ' L ' + (x + sz2) + ',' + (y + sz2)
                            + ' L ' + (x + sz2) + ',' + (y - sz2)
                            + ' Z';
                        element = this.renderer.path(path);
                    } break;
                case 'triangle_right':
                    {
                        var path = 'M ' + (x - sz2) + ',' + (y - sz2)
                            + ' L ' + (x - sz2) + ',' + (y + sz2)
                            + ' L ' + (x + sz2) + ',' + (y)
                            + ' Z';
                        element = this.renderer.path(path);
                    } break;
                default:
                    element = this.renderer.circle(x, y, sz);
            }

            this.renderer.attr(element, { fill: fill, stroke: stroke, 'stroke-width': lineWidth, 'stroke-opacity': opacity, 'fill-opacity': opacity });
            return element;
        },

        /** @private */
        _getSymbol: function (groupIndex, seriesIndex) {
            var symbols = ['circle', 'square', 'diamond', 'triangle_up', 'triangle_down', 'triangle_left', 'triangle_right'];
            var g = this.seriesGroups[groupIndex];
            var s = g.series[seriesIndex];
            var symbolType = undefined;
            if (s.symbolType != undefined)
                symbolType = s.symbolType;
            if (symbolType == undefined)
                symbolType = g.symbolType;

            if (symbolType == 'default')
                return symbols[seriesIndex % symbols.length];
            else if (symbolType != undefined)
                return symbolType;

            return 'none';
        },

        /** @private */
        _startTooltipTimer: function (gidx, sidx, iidx) {
            this._cancelTooltipTimer();
            var self = this;
            var g = self.seriesGroups[gidx];
            var delay = this.toolTipShowDelay || this.toolTipDelay;
            if (isNaN(delay) || delay > 10000 || delay < 0)
                delay = 500;
            if (this._ttEl || (true == this.enableCrosshairs && false == this.showToolTips))
                delay = 0;

            clearTimeout(this._tttimerHide);

            if (delay == 0)
                self._showToolTip(self._mouseX, self._mouseY - 3, gidx, sidx, iidx);

            this._tttimer = setTimeout(function () {
                if (delay != 0)
                    self._showToolTip(self._mouseX, self._mouseY - 3, gidx, sidx, iidx);

                var toolTipHideDelay = self.toolTipHideDelay;

                if (isNaN(toolTipHideDelay))
                    toolTipHideDelay = 4000;

                self._tttimerHide = setTimeout(function () {
                    self._hideToolTip();
                    self._unselect();
                }, toolTipHideDelay);
            }, delay);
        },

        /** @private */
        _cancelTooltipTimer: function () {
            clearTimeout(this._tttimer);
        },

        /** @private */
        _getGroupGradientType: function (gidx) {
            var g = this.seriesGroups[gidx];

            if (g.type.indexOf('area') != -1)
                return g.orientation == 'horizontal' ? 'horizontalLinearGradient' : 'verticalLinearGradient';
            else if (g.type.indexOf('column') != -1) {
                if (g.polar)
                    return 'radialGradient';
                return g.orientation == 'horizontal' ? 'verticalLinearGradient' : 'horizontalLinearGradient';
            }
            else if (g.type.indexOf('scatter') != -1 || g.type.indexOf('bubble') != -1 || g.type.indexOf('pie') != -1 || g.type.indexOf('donut') != -1)
                return 'radialGradient';

            return undefined;
        },

        /** @private */
        _select: function (element, type, gidx, sidx, iidx, iidxBase) {
            if (this._selected) {
                if ((this._selected.item != iidx ||
                    this._selected.series != sidx ||
                    this._selected.group != gidx)
                    ) {
                    this._unselect();
                }
                else {
                    return;
                }
            }

            this._selected = { element: element, type: type, group: gidx, series: sidx, item: iidx, iidxBase: iidxBase };

            var g = this.seriesGroups[gidx];
            var s = g.series[sidx];

            var isLineSeries = g.type.indexOf('line') != -1 && g.type.indexOf('area') == -1;

            var colors = this._getColors(gidx, sidx, iidxBase || iidx, this._getGroupGradientType(gidx));
            var fillColorSelected = colors.fillColorSelected;
            if (isLineSeries)
                fillColorSelected = 'none';

            var settings = this._getSerieSettings(gidx, sidx);

            var lineColorSelected = type == 'symbol' ? colors.lineColorSymbolSelected : colors.lineColorSelected;
            fillColorSelected = type == 'symbol' ? colors.fillColorSymbolSelected : fillColorSelected;

            var lineWidth = settings.stroke;
            /*     if (type != 'symbol')
            lineWidth += (isLineSeries && settings.stroke <= 2) ? 1 : 0;
            else
            lineWidth = 1;*/

            this.renderer.attr(element, { 'stroke': lineColorSelected, fill: fillColorSelected, 'stroke-width': lineWidth });

            this._raiseItemEvent('mouseover', g, s, iidx);
        },

        /** @private */
        _unselect: function () {
            var self = this;

            if (self._selected) {
                var gidx = self._selected.group;
                var sidx = self._selected.series;
                var iidx = self._selected.item;
                var iidxBase = self._selected.iidxBase;
                var type = self._selected.type;
                var g = self.seriesGroups[gidx];
                var s = g.series[sidx];

                var isLineSeries = g.type.indexOf('line') != -1 && g.type.indexOf('area') == -1;

                var colors = self._getColors(gidx, sidx, iidxBase || iidx, self._getGroupGradientType(gidx));
                var fillColor = colors.fillColor;
                if (isLineSeries)
                    fillColor = 'none';

                var settings = self._getSerieSettings(gidx, sidx);

                var lineColor = type == 'symbol' ? colors.lineColorSymbol : colors.lineColor;
                fillColor = type == 'symbol' ? colors.fillColorSymbol : fillColor;

                var lineWidth = settings.stroke;

                this.renderer.attr(self._selected.element, { 'stroke': lineColor, fill: fillColor, 'stroke-width': lineWidth });

                self._selected = undefined;

                if (!isNaN(iidx))
                    self._raiseItemEvent('mouseout', g, s, iidx);
            }

            if (self._pointMarker) {
                if (self._pointMarker.element) {
                    self.renderer.removeElement(self._pointMarker.element);
                    self._pointMarker.element = undefined;
                }
                self._pointMarker = undefined;
                self._hideCrosshairs();
            }
        },

        /** @private */
        _raiseItemEvent: function (event, group, serie, index) {
            var fn = serie[event] || group[event];
            var gidx = 0;
            for (; gidx < this.seriesGroups.length; gidx++)
                if (this.seriesGroups[gidx] == group)
                    break;
            if (gidx == this.seriesGroups.length)
                return;

            var args = { event: event, seriesGroup: group, serie: serie, elementIndex: index, elementValue: this._getDataValue(index, serie.dataField, gidx) };
            if (fn && $.isFunction(fn))
                fn(args);

            this._raiseEvent(event, args);
        },

        _raiseEvent: function (name, args) {
            var event = new $.Event(name);
            event.owner = this;
            event.args = args;

            var result = this.host.trigger(event);

            return result;
        },


        /** @private */
        _calcInterval: function (min, max, countHint) {
            var diff = Math.abs(max - min);
            var approx = diff / countHint;

            var up = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100];
            var dw = [0.5, 0.25, 0.125, 0.1];

            var scale = 0.1;
            var arr = up;

            if (approx < 1) {
                arr = dw;
                scale = 10;
            }

            var idx = 0;

            do {
                idx = 0;
                if (approx >= 1)
                    scale *= 10;
                else
                    scale /= 10;

                for (var i = 1; i < arr.length; i++) {
                    if (Math.abs(arr[idx] * scale - approx) > Math.abs(arr[i] * scale - approx))
                        idx = i;
                    else
                        break;
                }
            }
            while (idx == arr.length - 1);

            return arr[idx] * scale;
        },

        //** @private */
        _renderDataClone: function () {
            if (!this._renderData || this._isToggleRefresh)
                return;

            var info = this._elementRenderInfo = [];

            for (var groupIndex = 0; groupIndex < this._renderData.length; groupIndex++) {
                var catField = this._getCategoryAxis(groupIndex).dataField;

                while (info.length <= groupIndex)
                    info.push({});

                var groupInfo = info[groupIndex];
                var data = this._renderData[groupIndex];
                if (!data.offsets)
                    continue;

                if (data.valueAxis) {
                    groupInfo.valueAxis = { itemOffsets: {} };
                    for (var key in data.valueAxis.itemOffsets) {
                        groupInfo.valueAxis.itemOffsets[key] = data.valueAxis.itemOffsets[key];
                    }
                }

                if (data.xAxis) {
                    groupInfo.xAxis = { itemOffsets: {} };
                    for (var key in data.xAxis.itemOffsets) {
                        groupInfo.xAxis.itemOffsets[key] = data.xAxis.itemOffsets[key];
                    }
                }

                groupInfo.series = [];
                var series = groupInfo.series;

                var serieType = this.seriesGroups[groupIndex].type;
                var isPieSeries = serieType.indexOf('pie') != -1 || serieType.indexOf('donut') != -1;

                for (var s = 0; s < data.offsets.length; s++) {
                    series.push({});
                    for (var i = 0; i < data.offsets[s].length; i++)
                        if (!isPieSeries) {
                            series[s][data.xoffsets.xvalues[i]] = { value: data.offsets[s][i].value, valueFrom: data.offsets[s][i].valueFrom, valueRadius: data.offsets[s][i].valueRadius, xoffset: data.xoffsets.data[i], from: data.offsets[s][i].from, to: data.offsets[s][i].to };
                        }
                        else {
                            var item = data.offsets[s][i];
                            series[s][item.displayValue] = { value: item.value, x: item.x, y: item.y, fromAngle: item.fromAngle, toAngle: item.toAngle };
                        }
                }
            }
        },

        /** @private */
        _calcGroupOffsets: function (groupIndex, rect) {
            var group = this.seriesGroups[groupIndex];

            while (this._renderData.length < groupIndex + 1)
                this._renderData.push({});

            if (this._renderData[groupIndex] != null && this._renderData[groupIndex].offsets != undefined)
                return this._renderData[groupIndex];

            if (group.type.indexOf('pie') != -1 || group.type.indexOf('donut') != -1) {
                return this._calcPieSeriesGroupOffsets(groupIndex, rect);
            }

            if (!group.valueAxis || !group.series || group.series.length == 0)
                return this._renderData[groupIndex];

            var inverse = group.valueAxis.flip == true;
            var logAxis = group.valueAxis.logarithmicScale == true;
            var logBase = group.valueAxis.logarithmicScaleBase || 10;

            var out = new Array();

            var isStacked = group.type.indexOf("stacked") != -1;
            var isStacked100 = isStacked && group.type.indexOf("100") != -1;
            var isRange = group.type.indexOf("range") != -1;
            var isColumn = group.type.indexOf("column") != -1;

            var dataLength = this._getDataLen(groupIndex);
            var gbase = group.baselineValue || group.valueAxis.baselineValue || 0;
            if (isRange || (isColumn && isStacked) || isStacked100)
                gbase = 0;

            var stat = this._stats.seriesGroups[groupIndex];
            if (!stat || !stat.isValid)
                return;

            if (gbase > stat.max)
                gbase = stat.max;
            if (gbase < stat.min)
                gbase = stat.min;

            var range = (isStacked100 || logAxis) ? stat.maxRange : stat.max - stat.min;

            var min = stat.min;
            var max = stat.max;

            var scale = rect.height / (logAxis ? stat.intervals : range);

            var yzero = 0;
            if (isStacked100) {
                if (min * max < 0) {
                    range /= 2;
                    yzero = -(range + gbase) * scale;
                }
                else {
                    yzero = -gbase * scale;
                }
            }
            else
                yzero = -(gbase - min) * scale;

            if (inverse)
                yzero = rect.y - yzero;
            else
                yzero += rect.y + rect.height;

            var yPOffset = new Array();
            var yNOffset = new Array();
            var yOffsetError = new Array();

            var pIntervals, nIntervals;
            if (logAxis) {
                pIntervals = $.jqx.log(max, logBase) - $.jqx.log(gbase, logBase);
                if (isStacked) // force base value @ min for stacked log series
                {
                    pIntervals = stat.intervals;
                    gbase = isStacked100 ? 0 : min;
                }

                nIntervals = stat.intervals - pIntervals;
                if (!inverse)
                    yzero = rect.y + pIntervals / stat.intervals * rect.height;
            }

            yzero = $.jqx._ptrnd(yzero);

            var th = (min * max < 0) ? rect.height / 2 : rect.height;

            var logSums = [];

            var bands = [];
            if (group.bands) {
                for (var j = 0; j < group.bands.length; j++) {
                    var from = group.bands[j].minValue;
                    var to = group.bands[j].maxValue;

                    if (isNaN(from))
                        from = gbase;

                    if (isNaN(to))
                        to = gbase;

                    var y1 = 0;
                    var y2 = 0;

                    if (logAxis) {
                        y1 = ($.jqx.log(from, logBase) - $.jqx.log(gbase, logBase)) * scale;
                        y2 = ($.jqx.log(to, logBase) - $.jqx.log(gbase, logBase)) * scale;
                    }
                    else {
                        y1 = (from - gbase) * scale;
                        y2 = (to - gbase) * scale;
                    }

                    if (this._isVML) {
                        y1 = Math.round(y1);
                        y2 = Math.round(y2);
                    }

                    if (inverse)
                        bands.push({ from: yzero + y2, to: yzero + y1 });
                    else
                        bands.push({ from: yzero - y2, to: yzero - y1 });
                }
            }

            var stackSums = [];
            var useOffsetBasedStackCalculation = isColumn || (!isColumn && !isStacked) || isStacked100 || logAxis;

            for (var j = 0; j < group.series.length; j++) {
                if (!isStacked && logAxis)
                    logSums = [];

                var dataField = group.series[j].dataField;
                var dataFieldFrom = group.series[j].dataFieldFrom;
                var dataFieldTo = group.series[j].dataFieldTo;
                var dataFieldRadius = group.series[j].radiusDataField;

                out.push(new Array());

                var isVisible = this._isSerieVisible(groupIndex, j);

                for (var i = 0; i < dataLength; i++) {
                    while (stackSums.length <= i)
                        stackSums.push(0);

                    var valFrom = NaN;
                    if (isRange) {
                        valFrom = this._getDataValueAsNumber(i, dataFieldFrom, groupIndex);
                        if (isNaN(valFrom))
                            valFrom = gbase;
                    }

                    var val = NaN;
                    if (isRange)
                        val = this._getDataValueAsNumber(i, dataFieldTo, groupIndex);
                    else
                        val = this._getDataValueAsNumber(i, dataField, groupIndex);

                    var valR = this._getDataValueAsNumber(i, dataFieldRadius, groupIndex);

                    if (!isVisible)
                        val = NaN;

                    if (isNaN(val) || (logAxis && val <= 0)) {
                        out[j].push({ from: undefined, to: undefined });
                        continue;
                    }

                    var yOffset;

                    if (useOffsetBasedStackCalculation)
                        yOffset = (val >= gbase) ? yPOffset : yNOffset;
                    else
                        stackSums[i] = val = stackSums[i] + val;

                    var h = scale * (val - gbase);
                    if (isRange)
                        h = scale * (val - valFrom);

                    if (logAxis) {
                        while (logSums.length <= i)
                            logSums.push({ p: { value: 0, height: 0 }, n: { value: 0, height: 0} });

                        var base = isRange ? valFrom : gbase;
                        var sums = val > base ? logSums[i].p : logSums[i].n;

                        sums.value += val;

                        if (isStacked100) {
                            val = sums.value / (stat.psums[i] + stat.nsums[i]) * 100;
                            h = ($.jqx.log(val, logBase) - stat.minPow) * scale;
                        }
                        else {
                            h = $.jqx.log(sums.value, logBase) - $.jqx.log(base, logBase);

                            h *= scale;
                        }

                        h -= sums.height;
                        sums.height += h;
                    }

                    var y = yzero;
                    if (isRange) {
                        var yDiff = 0;
                        if (logAxis)
                            yDiff = ($.jqx.log(valFrom, logBase) - $.jqx.log(gbase, logBase)) * scale;
                        else
                            yDiff = (valFrom - gbase) * scale;

                        y += inverse ? yDiff : -yDiff;
                    }

                    if (isStacked) {
                        if (isStacked100 && !logAxis) {
                            var irange = (stat.psums[i] - stat.nsums[i]);

                            if (val > gbase) {
                                h = (stat.psums[i] / irange) * th;
                                if (stat.psums[i] != 0)
                                    h *= val / stat.psums[i];
                            }
                            else {
                                h = (stat.nsums[i] / irange) * th;
                                if (stat.nsums[i] != 0)
                                    h *= val / stat.nsums[i];
                            }
                        }

                        if (useOffsetBasedStackCalculation) {
                            if (isNaN(yOffset[i]))
                                yOffset[i] = y;

                            y = yOffset[i];
                        }
                    }

                    if (isNaN(yOffsetError[i]))
                        yOffsetError[i] = 0;

                    var err = yOffsetError[i];

                    h = Math.abs(h);
                    var hSave = h;
                    h_new = this._isVML ? Math.round(h) : $.jqx._ptrnd(h) - 1;
                    if (Math.abs(h - h_new) > 0.5)
                        h = Math.round(h);
                    else
                        h = h_new;

                    err += h - hSave;

                    if (!isStacked)
                        err = 0;

                    if (Math.abs(err) > 0.5) {
                        if (err > 0) {
                            h -= 1;
                            err -= 1;
                        }
                        else {
                            h += 1;
                            err += 1;
                        }
                    }

                    yOffsetError[i] = err;

                    // adjust the height to make sure it span the entire height
                    // otherwise there will be a few pixels inaccuracy
                    if (j == group.series.length - 1 && isStacked100) {
                        var sumH = 0;
                        for (var k = 0; k < j; k++)
                            sumH += Math.abs(out[k][i].to - out[k][i].from);
                        sumH += h;
                        if (sumH < th) {
                            if (h > 0.5)
                                h = $.jqx._ptrnd(h + th - sumH);
                            else {
                                var k = j - 1;
                                while (k >= 0) {
                                    var diff = Math.abs(out[k][i].to - out[k][i].from);
                                    if (diff > 1) {
                                        if (out[k][i].from > out[k][i].to) {
                                            out[k][i].from += th - sumH;
                                        }
                                        break;
                                    }
                                    k--;
                                }
                            }
                        }
                    }

                    if (inverse)
                        h *= -1;

                    var drawOpositeDirection = val < gbase;
                    if (isRange)
                        drawOpositeDirection = valFrom > val;

                    var outVal = isNaN(valFrom) ? val : { from: valFrom, to: val };
                    if (drawOpositeDirection) {
                        if (useOffsetBasedStackCalculation)
                            yOffset[i] += h;
                        out[j].push({ from: y, to: y + h, value: outVal, valueFrom: valFrom, valueRadius: valR });
                    }
                    else {
                        if (useOffsetBasedStackCalculation)
                            yOffset[i] -= h;
                        out[j].push({ from: y, to: y - h, value: outVal, valueFrom: valFrom, valueRadius: valR });
                    }
                }
            }

            var renderData = this._renderData[groupIndex];
            renderData.baseOffset = yzero;
            renderData.offsets = out;
            renderData.bands = bands;

            // calculate horizontal offsets
            renderData.xoffsets = this._calculateXOffsets(groupIndex, rect.width);
            // end calculating horizontal offsets

            return this._renderData[groupIndex];
        },

        /** @private */
        _calcPieSeriesGroupOffsets: function (groupIndex, rect) {
            var dataLength = this._getDataLen(groupIndex);
            var group = this.seriesGroups[groupIndex];

            var renderData = this._renderData[groupIndex] = {};
            var out = renderData.offsets = [];

            for (var sidx = 0; sidx < group.series.length; sidx++) {
                var s = group.series[sidx]
                var minAngle = s.minAngle;
                if (isNaN(minAngle) || minAngle < 0 || minAngle > 360)
                    minAngle = 0;
                var maxAngle = s.maxAngle;
                if (isNaN(maxAngle) || maxAngle < 0 || maxAngle > 360)
                    maxAngle = 360;

                var angleRange = maxAngle - minAngle;

                var initialAngle = s.initialAngle || 0;
                if (initialAngle < minAngle)
                    initialAngle = minAngle;
                if (initialAngle > maxAngle)
                    initialAngle = maxAngle;

                var currentAngle = initialAngle;
                var radius = s.radius || Math.min(rect.width, rect.height) * 0.4;
                if (isNaN(radius))
                    radius = 1;

                var innerRadius = s.innerRadius || 0;
                if (isNaN(innerRadius) || innerRadius >= radius)
                    innerRadius = 0;

                var centerOffset = s.centerOffset || 0;
                var offsetX = $.jqx.getNum([s.offsetX, group.offsetX, rect.width / 2]);
                var offsetY = $.jqx.getNum([s.offsetY, group.offsetY, rect.height / 2]);

                out.push([]);

                // compute the sum
                var sumP = 0;
                var sumN = 0;
                for (var i = 0; i < dataLength; i++) {
                    var val = this._getDataValueAsNumber(i, s.dataField, groupIndex);
                    if (isNaN(val))
                        continue;

                    if (!this._isSerieVisible(groupIndex, sidx, i) && s.hiddenPointsDisplay != true)
                        continue;

                    if (val > 0)
                        sumP += val;
                    else
                        sumN += val;
                }

                var range = sumP - sumN;
                if (range == 0)
                    range = 1;

                // render
                for (var i = 0; i < dataLength; i++) {
                    var val = this._getDataValueAsNumber(i, s.dataField, groupIndex);
                    if (isNaN(val)) {
                        out[sidx].push({});
                        continue;
                    }

                    var displayField = s.displayText || s.displayField;
                    var displayValue = this._getDataValue(i, displayField, groupIndex);
                    if (displayValue == undefined)
                        displayValue = i;

                    var angle = 0;

                    var isVisible = this._isSerieVisible(groupIndex, sidx, i);
                    if (isVisible || s.hiddenPointsDisplay == true) {
                        angle = Math.abs(val) / range * angleRange;
                    }

                    var x = rect.x + offsetX;
                    var y = rect.y + offsetY;

                    var centerOffsetValue = centerOffset;
                    if ($.isFunction(centerOffset)) {
                        centerOffsetValue = centerOffset({ seriesIndex: sidx, seriesGroupIndex: groupIndex, itemIndex: i });
                    }
                    if (isNaN(centerOffsetValue))
                        centerOffsetValue = 0;

                    var sliceRenderData = { key: groupIndex + '_' + sidx + '_' + i, value: val, displayValue: displayValue, x: x, y: y, fromAngle: currentAngle, toAngle: currentAngle + angle, centerOffset: centerOffsetValue, innerRadius: innerRadius, outerRadius: radius, visible: isVisible };
                    out[sidx].push(sliceRenderData);

                    currentAngle += angle;
                }
            }

            return renderData;
        },

        /** @private */
        _isPointSeriesOnly: function () {
            for (var i = 0; i < this.seriesGroups.length; i++) {
                var g = this.seriesGroups[i];
                if (g.type.indexOf('line') == -1 && g.type.indexOf('area') == -1 && g.type.indexOf('scatter') == -1 && g.type.indexOf('bubble') == -1)
                    return false;
            }

            return true;
        },

        /** @private */
        _hasColumnSeries: function () {
            for (var i = 0; i < this.seriesGroups.length; i++) {
                var g = this.seriesGroups[i];
                if (g.type.indexOf('column') != -1)
                    return true;
            }

            return false;
        },

        /** @private */
        _alignValuesWithTicks: function (groupIndex) {
            var psonly = this._isPointSeriesOnly();

            var g = this.seriesGroups[groupIndex];

            // if xAxis
            var xAxis = this._getCategoryAxis(groupIndex);
            var xAxisValuesOnTicks = xAxis.valuesOnTicks == undefined ? psonly : xAxis.valuesOnTicks != false;
            if (groupIndex == undefined)
                return xAxisValuesOnTicks;

            if (g.valuesOnTicks == undefined)
                return xAxisValuesOnTicks;

            return g.valuesOnTicks;
        },

        _getYearsDiff: function (from, to) {
            return to.getFullYear() - from.getFullYear();
        },

        _getMonthsDiff: function (from, to) {
            return 12 * (to.getFullYear() - from.getFullYear()) + to.getMonth() - from.getMonth();
        },

        _getDateDiff: function (from, to, baseUnit, round) {
            var diff = 0;
            if (baseUnit != 'year' && baseUnit != 'month')
                diff = to.valueOf() - from.valueOf();

            switch (baseUnit) {
                case 'year':
                    diff = this._getYearsDiff(from, to);
                    break;
                case 'month':
                    diff = this._getMonthsDiff(from, to);
                    break;
                case 'day':
                    diff /= (24 * 3600 * 1000);
                    break;
                case 'hour':
                    diff /= (3600 * 1000);
                    break;
                case 'minute':
                    diff /= (60 * 1000);
                    break;
                case 'second':
                    diff /= (1000);
                    break;
                case 'millisecond':
                    break;
            }

            if (baseUnit != 'year' && baseUnit != 'month' && round != false)
                diff = $.jqx._rnd(diff, 1, true);

            return diff;
        },


        /** @private */
        _getAsDate: function (value, dateTimeUnit) {
            value = this._castAsDate(value);
            if (dateTimeUnit == 'month')
                return new Date(value.getFullYear(), value.getMonth(), 1);

            if (dateTimeUnit == 'year')
                return new Date(value.getFullYear(), 0, 1);

            if (dateTimeUnit == 'day')
                return new Date(value.getFullYear(), value.getMonth(), value.getDate());

            return value;
        },

        /** @private */
        _getCategoryAxisStats: function (groupIndex, catAxis, axisSize) {
            var dataLength = this._getDataLen(groupIndex);
            var isDateTime = catAxis.type == 'date' || catAxis.type == 'time';
            var axisMin = isDateTime ? this._castAsDate(catAxis.minValue) : this._castAsNumber(catAxis.minValue);
            var axisMax = isDateTime ? this._castAsDate(catAxis.maxValue) : this._castAsNumber(catAxis.maxValue);

            var min = axisMin, max = axisMax;

            var minDS, maxDS;

            var autoDetect = catAxis.type == undefined || catAxis.type == 'auto';

            var useIndeces = (autoDetect || catAxis.type == 'basic')

            var cntDateTime = 0, cntNumber = 0;
            for (var i = 0; i < dataLength && catAxis.dataField; i++) {
                var value = this._getDataValue(i, catAxis.dataField, groupIndex);
                value = isDateTime ? this._castAsDate(value) : this._castAsNumber(value);

                if (isNaN(value))
                    continue;

                if (isDateTime)
                    cntDateTime++;
                else
                    cntNumber++;

                if (isNaN(minDS) || value < minDS)
                    minDS = value;

                if (isNaN(maxDS) || value >= maxDS)
                    maxDS = value;
            }

            if (autoDetect &&
                ((!isDateTime && cntNumber == dataLength) || (isDateTime && cntDateTime == dataLength))
                ) {
                useIndeces = false;
            }

            if (useIndeces) {
                minDS = 0;
                maxDS = dataLength - 1;
            }

            // use the data source min/max if not set
            if (isNaN(min))
                min = minDS;
            if (isNaN(max))
                max = maxDS;

            // convert to date
            if (isDateTime) {
                min = new Date(min);
                max = new Date(max);
                if (!this._isDate(min))
                    min = this._isDate(max) ? max : new Date();

                if (!this._isDate(max))
                    max = this._isDate(min) ? min : new Date();
            }
            else {
                if (isNaN(min))
                    min = 0;

                if (isNaN(max))
                    max = useIndeces ? dataLength - 1 : min;
            }

            if (minDS == undefined)
                minDS = min;

            if (maxDS == undefined)
                maxDS = max;

            var dateTimeUnit, isTimeUnit;

            if (isDateTime) {
                dateTimeUnit = catAxis.baseUnit;
                if (!dateTimeUnit) {
                    dateTimeUnit = 'day';
                    var range = max.valueOf() - min.valueOf();
                    if (range < 1000)
                        dateTimeUnit = 'second';
                    else if (range < 3600000)
                        dateTimeUnit = 'minute';
                    else if (range < 86400000)
                        dateTimeUnit = 'hour';
                    else if (range < 2592000000)
                        dateTimeUnit = 'day';
                    else if (range < 31104000000)
                        dateTimeUnit = 'month';
                    else
                        dateTimeUnit = 'year';
                }

                isTimeUnit = dateTimeUnit == 'hour' || dateTimeUnit == 'minute' || dateTimeUnit == 'second' || dateTimeUnit == 'millisecond';
            }

            var interval = catAxis.unitInterval;
            if (isNaN(interval) || interval <= 0)
                interval = this._estAxisInterval(min, max, groupIndex, axisSize, dateTimeUnit)

            return { min: min, max: max, dsRange: { min: minDS, max: maxDS }, useIndeces: useIndeces, isDateTime: isDateTime, isTimeUnit: isTimeUnit, dateTimeUnit: dateTimeUnit, interval: interval };
        },

        /** @private */
        _getDefaultDTFormatFn: function (dateTimeUnit) {
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var fn;
            if (dateTimeUnit == 'year' || dateTimeUnit == 'month' || dateTimeUnit == 'day') {
                fn = function (value) {
                    return value.getDate() + "-" + months[value.getMonth()] + "-" + value.getFullYear();
                }
            }
            else {
                fn = function (value) {
                    return value.getHours() + ':' + value.getMinutes() + ':' + value.getSeconds();
                }
            }

            return fn;
        },

        /** @private */
        _estimateDTIntCnt: function (min, max, interval, dateTimeUnit) {

            var cnt = 0;
            var curr = new Date(min);
            var maxDate = new Date(max);

            if (interval <= 0)
                return 1;

            while (curr.valueOf() < maxDate.valueOf()) {
                if (dateTimeUnit == 'millisecond')
                    curr.setMilliseconds(curr.getMilliseconds() + interval);
                else if (dateTimeUnit == 'second')
                    curr.setSeconds(curr.getSeconds() + interval);
                else if (dateTimeUnit == 'minute')
                    curr.setMinutes(curr.getMinutes() + interval);
                else if (dateTimeUnit == 'hour')
                    curr.setHours(curr.getHours() + interval);
                else if (dateTimeUnit == 'day')
                    curr.setDate(curr.getDate() + interval);
                else if (dateTimeUnit == 'month')
                    curr.setMonth(curr.getMonth() + interval);
                else if (dateTimeUnit == 'year')
                    curr.setFullYear(curr.getFullYear() + interval);

                cnt++;
            }

            return cnt;
        },

        /** @private */
        _estAxisInterval: function (min, max, groupIndex, axisSize, baseUnit) {
            var scale = [1, 2, 5, 10, 15, 20, 50, 100, 200, 500];

            var i = 0;
            var prefCount = axisSize / 50;

            if (this._renderData &&
                this._renderData.length > groupIndex &&
                this._renderData[groupIndex].xAxis &&
                !isNaN(this._renderData[groupIndex].xAxis.avgWidth)) {
                var avgWidth = Math.max(1, this._renderData[groupIndex].xAxis.avgWidth);
                if (avgWidth != 0) {
                    // use average text size and 90% axis size to account
                    // for padding between text items
                    prefCount = 0.9 * axisSize / avgWidth;
                }
            }

            if (prefCount <= 1)
                return 1;

            var itemsCount = 0;
            while (true) {
                var intSize = i >= scale.length ? Math.pow(10, 3 + i - scale.length) : scale[i];

                if (this._isDate(min) && this._isDate(max))
                    itemsCount = this._estimateDTIntCnt(min, max, intSize, baseUnit);
                else
                    itemsCount = (max - min) / intSize;

                if (itemsCount <= prefCount)
                    return intSize;

                i++;
            }
        },

        /** @private */
        _getPaddingSize: function (axisStats, axis, valuesOnTicks, axisSize, isPolar, hasColumnSeries) {
            var min = axisStats.min;
            var max = axisStats.max;
            var unitInterval = axisStats.interval;
            var dateTimeUnit = axisStats.dateTimeUnit;

            if (isPolar)
                return { left: 0, right: (axisSize / Math.max(1, max - min + 1)) * unitInterval };

            if (valuesOnTicks && !hasColumnSeries)
                return { left: 0, right: 0 };

            if (this._isDate(min) && this._isDate(max)) {
                var itemsCount = this._estimateDTIntCnt(min, max, Math.min(unitInterval, max - min), dateTimeUnit);
                var itemWidth = axisSize / Math.max(2, itemsCount);
                return { left: itemWidth / 2, right: itemWidth / 2 };
            }

            var itemsCount = Math.max(1, max - min);
            if (itemsCount == 1) {
                sz = axisSize / 4;
                return { left: sz, right: sz };
            }

            var itemWidth = axisSize / itemsCount;

            var sz = itemWidth * unitInterval / 2;
            if (hasColumnSeries)
                sz = Math.max(sz, itemWidth / 2);

            var paddedSize = axisSize - 2 * sz;
            var fullIntervals = $.jqx._rnd(paddedSize / Math.max(1, (itemWidth * unitInterval)), 1, false);
            var fullIntervalsSize = fullIntervals * itemWidth * unitInterval;

            itemWidth = paddedSize / itemsCount;
            var adjust = sz - (itemWidth * unitInterval) / 2;
            sz -= adjust;

            return { left: sz, right: sz };
        },

        /** @private */
        _calculateXOffsets: function (groupIndex, axisSize) {
            var g = this.seriesGroups[groupIndex];

            var xAxis = this._getCategoryAxis(groupIndex);
            var xoffsets = new Array();
            var xvalues = new Array();
            var dataLength = this._getDataLen(groupIndex);

            var axisStats = this._getCategoryAxisStats(groupIndex, xAxis, axisSize);
            var min = axisStats.min;
            var max = axisStats.max;

            var isDateTime = axisStats.isDateTime;
            var isTimeUnit = axisStats.isTimeUnit;

            var hasColumnSeries = this._hasColumnSeries();
            var isPolar = g.polar || g.spider;

            var valuesOnTicks = this._alignValuesWithTicks(groupIndex);

            var padding = this._getPaddingSize(axisStats, xAxis, valuesOnTicks, axisSize, isPolar, hasColumnSeries);

            var rangeLength = max - min;

            if (rangeLength == 0)
                rangeLength = 1;

            var plotSize = axisSize - padding.left - padding.right;
            if (isPolar && valuesOnTicks)
                padding.left = padding.right = 0;

            var first = -1, last = -1;
            for (var i = 0; i < dataLength; i++) {
                var value = (xAxis.dataField === undefined) ? i : this._getDataValue(i, xAxis.dataField, groupIndex);

                if (axisStats.useIndeces) {
                    if (i < min || i > max) {
                        xoffsets.push(NaN);
                        xvalues.push(undefined);
                        continue;
                    }

                    xoffsets.push($.jqx._ptrnd(padding.left + (i - min) / rangeLength * plotSize));
                    xvalues.push(value);
                    if (first == -1)
                        first = i;
                    if (last == -1 || last < i)
                        last = i;
                    continue;
                }

                value = isDateTime ? this._castAsDate(value) : this._castAsNumber(value);
                if (isNaN(value) || value < min || value > max) {
                    xoffsets.push(NaN);
                    xvalues.push(undefined);
                    continue;
                }

                var x = 0;
                if (!isDateTime || (isDateTime && isTimeUnit)) {
                    diffFromMin = value - min;
                    x = (value - min) * plotSize / rangeLength;
                }
                else {
                    x = (value.valueOf() - min.valueOf()) / (max.valueOf() - min.valueOf()) * plotSize;
                }

                x = $.jqx._ptrnd(padding.left + x);

                xoffsets.push(x);
                xvalues.push(value);

                if (first == -1)
                    first = i;
                if (last == -1 || last < i)
                    last = i;
            }

            if (xAxis.flip == true) {
                for (var i = 0; i < xoffsets.length; i++)
                    if (!isNaN(xoffsets[i]))
                        xoffsets[i] = axisSize - xoffsets[i];
            }

            if (isTimeUnit) {
                rangeLength = this._getDateDiff(min, max, xAxis.baseUnit);
                rangeLength = $.jqx._rnd(rangeLength, 1, false);
            }

            var itemsCount = Math.max(1, isDateTime ? xoffsets.length : rangeLength);
            var itemWidth = plotSize / itemsCount;
            //itemWidth = plotSize / itemsCount;

            if (first == last)
                xoffsets[first] = padding.left + plotSize / 2;

            return { axisStats: axisStats, data: xoffsets, xvalues: xvalues, first: first, last: last, length: last == -1 ? 0 : last - first + 1, itemWidth: itemWidth, intervalWidth: itemWidth * axisStats.interval, rangeLength: rangeLength, useIndeces: axisStats.useIndeces, padding: padding };
        },


        /** @private */
        _getCategoryAxis: function (gidx) {
            if (gidx == undefined || this.seriesGroups.length <= gidx)
                return this.categoryAxis || this.xAxis;

            return this.seriesGroups[gidx].categoryAxis || this.seriesGroups[gidx].xAxis || this.categoryAxis || this.xAxis;
        },

        /** @private */
        _isGreyScale: function (groupIndex, seriesIndex) {
            var g = this.seriesGroups[groupIndex];
            var s = g.series[seriesIndex];

            if (s.greyScale == true)
                return true;
            else if (s.greyScale == false)
                return false;

            if (g.greyScale == true)
                return true;
            else if (g.greyScale == false)
                return false;

            return this.greyScale == true;
        },

        /** @private */
        _getSeriesColors: function (groupIndex, seriesIndex, itemIndex) {
            var colors = this._getSeriesColorsInternal(groupIndex, seriesIndex, itemIndex);

            if (this._isGreyScale(groupIndex, seriesIndex)) {
                for (var i in colors)
                    colors[i] = $.jqx.toGreyScale(colors[i]);
            }

            return colors;
        },

        _getColorFromScheme: function (groupIndex, serieIndex, itemIndex) {
            var color = '#000000';
            var group = this.seriesGroups[groupIndex];
            var serie = group.series[serieIndex];

            if (group.type == 'pie' || group.type == 'donut') {
                var dataLength = this._getDataLen(groupIndex);
                color = this._getItemColorFromScheme(serie.colorScheme || group.colorScheme || this.colorScheme, serieIndex * dataLength + itemIndex, groupIndex, serieIndex);
            }
            else {
                var sidx = 0;
                for (var i = 0; i <= groupIndex; i++) {
                    for (var j in this.seriesGroups[i].series) {
                        if (i == groupIndex && j == serieIndex)
                            break;
                        else
                            sidx++;
                    }
                }

                var colorScheme = this.colorScheme;
                if (group.colorScheme) {
                    colorScheme = group.colorScheme;
                    sidex = seriesIndex;
                }

                if (colorScheme == undefined || colorScheme == '')
                    colorScheme = this.colorSchemes[0].name;

                if (!colorScheme)
                    return color;

                for (var i = 0; i < this.colorSchemes.length; i++) {
                    var cs = this.colorSchemes[i];
                    if (cs.name == colorScheme) {
                        while (sidx > cs.colors.length) {
                            sidx -= cs.colors.length;
                            if (++i >= this.colorSchemes.length)
                                i = 0;
                            cs = this.colorSchemes[i];
                        }

                        color = cs.colors[sidx % cs.colors.length];
                    }
                }
            } // else

            return color;
        },

        _colorsCache: {
            get: function (cacheKey) {
                if (this._store[cacheKey])
                    return this._store[cacheKey];
            },
            set: function (cacheKey, color) {
                if (this._size < 10000) {
                    this._store[cacheKey];
                    this._size++;
                }
            },

            clear: function () {
                this._store = {};
                this._size = 0;
            },

            _size: 0,
            _store: {}
        },

        /** @private */
        _getSeriesColorsInternal: function (groupIndex, seriesIndex, itemIndex) {
            var cacheKey = groupIndex + "_" + seriesIndex + "_" + (isNaN(itemIndex) ? 'NaN' : itemIndex);

            if (this._colorsCache.get(cacheKey))
                return this._colorsCache.get(cacheKey);

            var g = this.seriesGroups[groupIndex];
            var s = g.series[seriesIndex];

            var colors =
            {
                lineColor: '#222222',
                lineColorSelected: '#151515',
                lineColorSymbol: '#222222',
                lineColorSymbolSelected: '#151515',
                fillColor: '#222222',
                fillColorSelected: '#333333',
                fillColorSymbol: '#222222',
                fillColorSymbolSelected: '#333333'
            }

            var customColors = undefined;
            if ($.isFunction(s.colorFunction)) {
                var value = !isNaN(itemIndex) ? this._getDataValue(itemIndex, s.dataField, groupIndex) : NaN;
                if (g.type.indexOf('range') != -1) {
                    var valueFrom = this._getDataValue(itemIndex, s.dataFieldFrom, groupIndex);
                    var valueTo = this._getDataValue(itemIndex, s.dataFieldTo, groupIndex);
                    value = { from: valueFrom, to: valueTo };
                }

                customColors = s.colorFunction(value, itemIndex, s, g);
                if (typeof (customColors) == 'object') {
                    for (var key in customColors)
                        colors[key] = customColors[key];
                }
                else {
                    colors.fillColor = customColors;
                }
            }
            else {
                for (var key in colors) {
                    if (s.key)
                        colors[key] = s[key];
                }

                if (!s.fillColor && !s.color) {
                    colors.fillColor = this._getColorFromScheme(groupIndex, seriesIndex, itemIndex);
                }
                else {
                    s.fillColor = s.fillColor || s.color;
                }
            }

            var colorDeriveMap =
            {
                fillColor: { baseColor: 'fillColor', adjust: 1.0 },
                fillColorSelected: { baseColor: 'fillColor', adjust: 1.1 },
                fillColorSymbol: { baseColor: 'fillColor', adjust: 1.0 },
                fillColorSymbolSelected: { baseColor: 'fillColorSymbol', adjust: 2.0 },
                lineColor: { baseColor: 'fillColor', adjust: 0.9 },
                lineColorSelected: { baseColor: 'lineColor', adjust: 0.8 },
                lineColorSymbol: { baseColor: 'lineColor', adjust: 1.0 },
                lineColorSymbolSelected: { baseColor: 'lineColorSelected', adjust: 1.0 }
            };

            for (var key in colors) {
                if (typeof (customColors) != 'object' || !customColors[key]) {
                    if (s[key])
                        colors[key] = s[key];
                    else
                        colors[key] = $.jqx.adjustColor(colors[colorDeriveMap[key].baseColor], colorDeriveMap[key].adjust);
                }
            }

            this._colorsCache.set(cacheKey, colors);

            return colors;
        },

        /** @private */
        _getItemColorFromScheme: function (scheme, index, gidx, sidx) {
            if (scheme == undefined || scheme == '')
                scheme = this.colorSchemes[0].name;

            for (var i = 0; i < this.colorSchemes.length; i++)
                if (scheme == this.colorSchemes[i].name)
                    break;

            var j = 0;
            while (j <= index) {
                if (i == this.colorSchemes.length)
                    i = 0;

                var schLen = this.colorSchemes[i].colors.length;
                if (j + schLen <= index) {
                    j += schLen;
                    i++;
                }
                else {
                    var color = this.colorSchemes[i].colors[index - j];

                    if (this._isGreyScale(gidx, sidx) && color.indexOf('#') == 0)
                        color = $.jqx.toGreyScale(color);

                    return color;
                }
            }
        },

        getColorScheme: function (scheme) {
            for (var i in this.colorSchemes) {
                if (this.colorSchemes[i].name == scheme)
                    return this.colorSchemes[i].colors;
            }

            return undefined;
        },

        addColorScheme: function (scheme, colors) {
            for (var i in this.colorSchemes) {
                if (this.colorSchemes[i].name == scheme) {
                    this.colorSchemes[i].colors = colors;
                    return;
                }
            }

            this.colorSchemes.push({ name: scheme, colors: colors });
        },

        removeColorScheme: function (scheme) {
            for (var i in this.colorSchemes) {
                if (this.colorSchemes[i].name == scheme) {
                    this.colorSchemes.splice(i, 1);
                    break;
                }
            }
        },

        /************* COLOR SCHEMES ************/
        colorSchemes: [
            { name: 'scheme01', colors: ['#307DD7', '#AA4643', '#89A54E', '#71588F', '#4198AF'] },
            { name: 'scheme02', colors: ['#7FD13B', '#EA157A', '#FEB80A', '#00ADDC', '#738AC8'] },
            { name: 'scheme03', colors: ['#E8601A', '#FF9639', '#F5BD6A', '#599994', '#115D6E'] },
            { name: 'scheme04', colors: ['#D02841', '#FF7C41', '#FFC051', '#5B5F4D', '#364651'] },
            { name: 'scheme05', colors: ['#25A0DA', '#309B46', '#8EBC00', '#FF7515', '#FFAE00'] },
            { name: 'scheme06', colors: ['#0A3A4A', '#196674', '#33A6B2', '#9AC836', '#D0E64B'] },
            { name: 'scheme07', colors: ['#CC6B32', '#FFAB48', '#FFE7AD', '#A7C9AE', '#888A63'] },
            { name: 'scheme08', colors: ['#3F3943', '#01A2A6', '#29D9C2', '#BDF271', '#FFFFA6'] },
            { name: 'scheme09', colors: ['#1B2B32', '#37646F', '#A3ABAF', '#E1E7E8', '#B22E2F'] },
            { name: 'scheme10', colors: ['#5A4B53', '#9C3C58', '#DE2B5B', '#D86A41', '#D2A825'] },
            { name: 'scheme11', colors: ['#993144', '#FFA257', '#CCA56A', '#ADA072', '#949681'] },
            { name: 'scheme12', colors: ['#105B63', '#EEEAC5', '#FFD34E', '#DB9E36', '#BD4932'] },
            { name: 'scheme13', colors: ['#BBEBBC', '#F0EE94', '#F5C465', '#FA7642', '#FF1E54'] },
            { name: 'scheme14', colors: ['#60573E', '#F2EEAC', '#BFA575', '#A63841', '#BFB8A3'] },
            { name: 'scheme15', colors: ['#444546', '#FFBB6E', '#F28D00', '#D94F00', '#7F203B'] },
            { name: 'scheme16', colors: ['#583C39', '#674E49', '#948658', '#F0E99A', '#564E49'] },
            { name: 'scheme17', colors: ['#142D58', '#447F6E', '#E1B65B', '#C8782A', '#9E3E17'] },
            { name: 'scheme18', colors: ['#4D2B1F', '#635D61', '#7992A2', '#97BFD5', '#BFDCF5'] },
            { name: 'scheme19', colors: ['#844341', '#D5CC92', '#BBA146', '#897B26', '#55591C'] },
            { name: 'scheme20', colors: ['#56626B', '#6C9380', '#C0CA55', '#F07C6C', '#AD5472'] },
            { name: 'scheme21', colors: ['#96003A', '#FF7347', '#FFBC7B', '#FF4154', '#642223'] },
            { name: 'scheme22', colors: ['#5D7359', '#E0D697', '#D6AA5C', '#8C5430', '#661C0E'] },
            { name: 'scheme23', colors: ['#16193B', '#35478C', '#4E7AC7', '#7FB2F0', '#ADD5F7'] },
            { name: 'scheme24', colors: ['#7B1A25', '#BF5322', '#9DA860', '#CEA457', '#B67818'] },
            { name: 'scheme25', colors: ['#0081DA', '#3AAFFF', '#99C900', '#FFEB3D', '#309B46'] },
            { name: 'scheme26', colors: ['#0069A5', '#0098EE', '#7BD2F6', '#FFB800', '#FF6800'] },
            { name: 'scheme27', colors: ['#FF6800', '#A0A700', '#FF8D00', '#678900', '#0069A5'] }
        ],

        /********** END OF COLOR SCHEMES ********/
        /** @private */
        _formatValue: function (value, formatSettings, formatFunction, groupIndex, serieIndex, itemIndex) {
            if (value == undefined)
                return '';

            if (this._isObject(value) && !formatFunction)
                return '';

            if (formatFunction) {
                if (!$.isFunction(formatFunction))
                    return value.toString();

                try {
                    return formatFunction(value, itemIndex, serieIndex, groupIndex);
                }
                catch (e) {
                    return e.message;
                }
            }

            if (this._isNumber(value))
                return this._formatNumber(value, formatSettings);

            if (this._isDate(value))
                return this._formatDate(value, formatSettings);

            if (formatSettings) {
                return (formatSettings.prefix || '') + value.toString() + (formatSettings.sufix || '');
            }

            return value.toString();
        },

        /** @private */
        _getFormattedValue: function (groupIndex, serieIndex, itemIndex, formatSettings, formatFunction) {
            var g = this.seriesGroups[groupIndex];
            var s = g.series[serieIndex];
            var text = '';

            var fs = formatSettings, fn = formatFunction;
            if (!fn)
                fn = s.formatFunction || g.formatFunction;
            if (!fs)
                fs = s.formatSettings || g.formatSettings;

            // series format settings takes priority over group format function;
            if (!s.formatFunction && s.formatSettings)
                fn = undefined;

            if (g.type.indexOf('range') != -1) {
                var valueFrom = this._getDataValue(itemIndex, s.dataFieldFrom, groupIndex);
                var valueTo = this._getDataValue(itemIndex, s.dataFieldTo, groupIndex);

                if (fn && $.isFunction(fn)) {
                    try {
                        return fn({ from: valueFrom, to: valueTo }, itemIndex, s, g);
                    }
                    catch (e) {
                        return e.message;
                    }
                }

                if (undefined != valueFrom)
                    text = this._formatValue(valueFrom, fs, fn, groupIndex, serieIndex, itemIndex);

                if (undefined != valueTo)
                    text += ", " + this._formatValue(valueTo, fs, fn, groupIndex, serieIndex, itemIndex);
            }
            else {
                var value = this._getDataValue(itemIndex, s.dataField, groupIndex);
                if (undefined != value) {
                    // format function is used with priority when available.
                    text = this._formatValue(value, fs, fn, groupIndex, serieIndex, itemIndex);
                }
            }

            return text || '';
        },

        /** @private */
        _isNumberAsString: function (text) {
            if (typeof (text) != 'string')
                return false;

            text = $.trim(text);
            for (var i = 0; i < text.length; i++) {
                var ch = text.charAt(i);
                if ((ch >= '0' && ch <= '9') || ch == ',' || ch == '.')
                    continue;

                if (ch == '-' && i == 0)
                    continue;

                if ((ch == '(' && i == 0) || (ch == ')' && i == text.length - 1))
                    continue;

                return false;
            }

            return true;
        },

        /** @private */
        _castAsDate: function (value) {
            if (value instanceof Date && !isNaN(value))
                return value;

            if (typeof (value) == 'string') {
                var date = new Date(value);

                if (!isNaN(date)) {
                    if (value.indexOf(':') == -1)
                        date.setHours(0, 0, 0, 0);
                }
                else {
                    if ($.jqx.dataFormat) {
                        var tmpDate = $.jqx.dataFormat.tryparsedate(value);
                        if (tmpDate)
                            date = tmpDate;
                        else date = this._parseISO8601Date(value);
                    }
                    else date = this._parseISO8601Date(value);
                }

                if (date != undefined && !isNaN(date))
                    return date;
            }

            return undefined;
        },

        /** @private */
        _parseISO8601Date: function (value) {
            var splitDateTime = value.split(" ");
            if (splitDateTime.length < 0)
                return NaN;
            var splitDate = splitDateTime[0].split("-");
            var splitTime = splitDateTime.length == 2 ? splitDateTime[1].split(":") : "";
            var yy = splitDate[0];
            var MM = splitDate.length > 1 ? splitDate[1] - 1 : 0;
            var dd = splitDate.length > 2 ? splitDate[2] : 1;
            var hh = splitTime[1];
            var mm = splitTime.length > 1 ? splitTime[1] : 0;
            var hh = splitTime.length > 2 ? splitTime[2] : 0;
            var ss = splitTime.length > 3 ? splitTime[3] : 0;
            return new Date(yy, MM, dd, hh, mm, ss);
        },


        /** @private */
        _castAsNumber: function (value) {
            if (value instanceof Date && !isNaN(value))
                return value.valueOf();

            if (typeof (value) == 'string') {
                if (this._isNumber(value)) {
                    value = parseFloat(value);
                }
                else {
                    if (!/[a-zA-Z]/.test(value)) {
                        var date = new Date(value);
                        if (date != undefined)
                            value = date.valueOf();
                    }
                }
            }

            return value;
        },

        /** @private */
        _isNumber: function (value) {
            if (typeof (value) == 'string') {
                if (this._isNumberAsString(value))
                    value = parseFloat(value);
            }
            return typeof value === 'number' && isFinite(value);
        },

        /** @private */
        _isDate: function (value) {
            return value instanceof Date && !isNaN(value.getDate());
        },

        /** @private */
        _isBoolean: function (value) {
            return typeof value === 'boolean';
        },

        /** @private */
        _isObject: function (value) {
            return (value && (typeof value === 'object' || $.isFunction(value))) || false;
        },

        /** @private */
        _formatDate: function (value, settings) {
            return value.toString();
        },

        /** @private */
        _formatNumber: function (value, settings) {
            if (!this._isNumber(value))
                return value;

            settings = settings || {};

            var decimalSeparator = settings.decimalSeparator || '.';
            var thousandsSeparator = settings.thousandsSeparator || '';
            var prefix = settings.prefix || '';
            var sufix = settings.sufix || '';
            var decimalPlaces = settings.decimalPlaces;
            if (isNaN(decimalPlaces))
                decimalPlaces = ((value * 100 != parseInt(value) * 100) ? 2 : 0);
            var negativeWithBrackets = settings.negativeWithBrackets || false;

            var negative = (value < 0);

            if (negative && negativeWithBrackets)
                value *= -1;

            var output = value.toString();
            var decimalindex;

            var decimal = Math.pow(10, decimalPlaces);
            output = (Math.round(value * decimal) / decimal).toString();
            if (isNaN(output)) {
                output = '';
            }

            decimalindex = output.lastIndexOf(".");
            if (decimalPlaces > 0) {
                if (decimalindex < 0) {
                    output += decimalSeparator;
                    decimalindex = output.length - 1;
                }
                else if (decimalSeparator !== ".") {
                    output = output.replace(".", decimalSeparator);
                }
                while ((output.length - 1 - decimalindex) < decimalPlaces) {
                    output += "0";
                }
            }

            decimalindex = output.lastIndexOf(decimalSeparator);
            decimalindex = (decimalindex > -1) ? decimalindex : output.length;
            var newoutput = output.substring(decimalindex);
            var cnt = 0;
            for (var i = decimalindex; i > 0; i--, cnt++) {
                if ((cnt % 3 === 0) && (i !== decimalindex) && (!negative || (i > 1) || (negative && negativeWithBrackets))) {
                    newoutput = thousandsSeparator + newoutput;
                }
                newoutput = output.charAt(i - 1) + newoutput;
            }
            output = newoutput;

            if (negative && negativeWithBrackets)
                output = '(' + output + ')';

            return prefix + output + sufix;
        },

        /** @private */
        _defaultNumberFormat: { prefix: '', sufix: '', decimalSeparator: '.', thousandsSeparator: ',', decimalPlaces: 2, negativeWithBrackets: false },

        /** @private */
        _getBezierPoints: function (arr) {
            var points = [];
            var split = arr.split(' ');
            for (var i = 0; i < split.length; i++) {
                var pt = split[i].split(',');
                points.push({ x: parseFloat(pt[0]), y: parseFloat(pt[1]) });
            }

            var result = '';

            if (points.length < 3) {
                for (var i = 0; i < points.length; i++)
                    result += (i > 0 ? ' ' : '') + points[i].x + ',' + points[i].y;
            }
            else {
                for (var i = 0; i < points.length - 1; i++) {
                    var p = [];
                    if (0 == i) {
                        p.push(points[i]);
                        p.push(points[i]);
                        p.push(points[i + 1]);
                        p.push(points[i + 2]);
                    } else if (points.length - 2 == i) {
                        p.push(points[i - 1]);
                        p.push(points[i]);
                        p.push(points[i + 1]);
                        p.push(points[i + 1]);
                    } else {
                        p.push(points[i - 1]);
                        p.push(points[i]);
                        p.push(points[i + 1]);
                        p.push(points[i + 2]);
                    }

                    var out = [];

                    var b = i > 3 ? 9 : 5;
                    var a = i == 0 ? 81 : b;

                    var c1 = { x: ((-p[0].x + a * p[1].x + p[2].x) / a), y: ((-p[0].y + a * p[1].y + p[2].y) / a) };
                    if (i == 0)
                        a = b;
                    var c2 = { x: ((p[1].x + a * p[2].x - p[3].x) / a), y: ((p[1].y + a * p[2].y - p[3].y) / a) };

                    out.push({ x: p[1].x, y: p[1].y });
                    out.push(c1);
                    out.push(c2);
                    out.push({ x: p[2].x, y: p[2].y });

                    result += "C" + $.jqx._ptrnd(out[1].x) + "," + $.jqx._ptrnd(out[1].y) + " " + $.jqx._ptrnd(out[2].x) + "," + $.jqx._ptrnd(out[2].y) + " " + $.jqx._ptrnd(out[3].x) + "," + $.jqx._ptrnd(out[3].y) + " ";
                }
            }

            return result;
        },

        /** @private */
        _animTickInt: 50,

        /** @private */
        _createAnimationGroup: function (groupId) {
            if (!this._animGroups) {
                this._animGroups = {};
            }

            this._animGroups[groupId] = { animations: [], startTick: NaN };
        },

        /** @private */
        _startAnimation: function (groupId) {
            var d = new Date();
            var currentTick = d.getTime();
            this._animGroups[groupId].startTick = currentTick;
            this._runAnimation();
            this._enableAnimTimer();
        },

        /** @private */
        _enqueueAnimation: function (groupId, element, properties, duration, fn, context, easing) {
            if (duration < 0)
                duration = 0;

            if (easing == undefined)
                easing = 'easeInOutSine';

            this._animGroups[groupId].animations.push({ key: element, properties: properties, duration: duration, fn: fn, context: context, easing: easing });
        },

        /** @private */
        _stopAnimations: function () {
            clearTimeout(this._animtimer);
            this._animtimer = undefined;
            this._animGroups = undefined;
        },

        /** @private */
        _enableAnimTimer: function () {
            if (!this._animtimer) {
                var self = this;
                this._animtimer = setTimeout(function () { self._runAnimation(); }, this._animTickInt);
            }
        },

        /** @private */
        _runAnimation: function (animationCompleteCallback) {

            if (this._animGroups) {
                var d = new Date();
                var currentTick = d.getTime();

                var animGroupsNewList = {};
                for (var j in this._animGroups) {
                    var list = this._animGroups[j].animations;
                    var startTick = this._animGroups[j].startTick;

                    var maxDuration = 0;
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];

                        var tSince = (currentTick - startTick);
                        if (item.duration > maxDuration)
                            maxDuration = item.duration;

                        var percent = item.duration > 0 ? tSince / item.duration : 1;
                        var easePercent = percent;
                        if (item.easing && item.duration != 0)
                            easePercent = $.easing[item.easing](percent, tSince, 0, 1, item.duration);

                        if (percent > 1) {
                            percent = 1;
                            easePercent = 1;
                        }

                        if (item.fn) // custom function
                        {
                            item.fn(item.key, item.context, easePercent);
                            continue;
                        }

                        var params = {};
                        for (var j = 0; j < item.properties.length; j++) {
                            var p = item.properties[j];
                            var val = 0;

                            if (percent == 1) {
                                val = p.to;
                            }
                            else {
                                val = easeParecent * (p.to - p.from) + p.from;
                            }

                            params[p.key] = val;
                        }
                        this.renderer.attr(item.key, params);
                    } // for i

                    if (startTick + maxDuration > currentTick)
                        animGroupsNewList[j] = ({ startTick: startTick, animations: list });
                } // for j

                this._animGroups = animGroupsNewList;

                if (this.renderer instanceof $.jqx.HTML5Renderer)
                    this.renderer.refresh();
            }

            this._animtimer = null;

            for (var j in this._animGroups) {
                this._enableAnimTimer();
                break;
            }

        }
    });

})(jQuery);

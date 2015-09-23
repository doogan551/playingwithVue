/*
jQWidgets v3.4.0 (2014-June-23)
Copyright (c) 2011-2014 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.extend($.jqx._jqxChart.prototype,
    {
        /**
         * Renders the category axis range selector
         * @private 
         * @param {number} group index
         * @param {object} bounding rectangle of the category axis in relative coords
         */
        _renderCategoryAxisRangeSelector: function (groupIndex, rect) {
            var self = this;
            self._isTouchDevice = $.jqx.mobile.isTouchDevice();

            var axis = self._getCategoryAxis(groupIndex);
            var g = self.seriesGroups[groupIndex];

            if (!axis || axis.visible == false || g.type == 'spider')
                return;

            if (!self._isGroupVisible(groupIndex))
                return;

            var rangeSelector = axis.rangeSelector;
            if (!rangeSelector)
                return;

            if (!this._isSelectorRefresh)
                this.host.find(".rangeSelector").remove();

            var swapXY = g.orientation == 'horizontal';
            if (rangeSelector.renderTo)
                swapXY = false;

            if (self.rtl)
                axis.flip = true;

            var axisSize = swapXY ? this.host.height() : this.host.width();                    
            axisSize -= 3;

            var axisStats = this._getCategoryAxisStats(groupIndex, axis, axisSize);

            var axisPosition = axis.position;
            if (rangeSelector.renderTo && rangeSelector.position)
                axisPosition = rangeSelector.position;

            if (!this._isSelectorRefresh) {
                var renderTo = rangeSelector.renderTo;

                var div = "<div class='rangeSelector jqx-disableselect' style='position: absolute; background-color: transparent;' onselectstart='return false;'></div>";
                var element = $(div).appendTo(renderTo ? renderTo : this.host.find('.chartContainer'));

                if (!renderTo)
                {
                    var coord = this.host.coord();
                    selectorSize = this._selectorGetSize(axis);
                    if (!swapXY)
                    {
                        element.css('left', coord.left + 1);
                        element.css('top', coord.top + rect.y + (axisPosition != 'top' ? rect.height : -selectorSize));
                        element.css('height', selectorSize);
                        element.css('width', axisSize);

                        rect.width = selectorSize;
                    }
                    else
                    {
                        element.css('left', coord.left + 1 + rect.x + (axisPosition != 'right' ? -selectorSize : rect.width));
                        element.css('top', coord.top);
                        element.css('height', axisSize);
                        element.css('width', selectorSize);

                        rect.height = selectorSize;
                    }
                }
                else
                {
                    element.css({width: renderTo.width(), height: renderTo.height()});
                    rect.width = renderTo.width();
                    rect.height = renderTo.height();
                }
                
                this._refreshSelector(groupIndex, axis, axisStats, element, rect, swapXY);
            }
        },


        _refreshSelector: function (groupIndex, axis, axisStats, renderTo, rect, swapXY) {
            var catAxisSettings = {};
            var selector = axis.rangeSelector;
            var group = this.seriesGroups[groupIndex];

            for (var i in selector)
                catAxisSettings[i] = selector[i];

            var min = catAxisSettings.minValue;
            var max = catAxisSettings.maxValue;

            if (undefined == min)
                min = Math.min(axisStats.min.valueOf(), axisStats.dsRange.min.valueOf());
            if (undefined == max)
                max = Math.max(axisStats.max.valueOf(), axisStats.dsRange.max.valueOf());

            if (this._isDate(axisStats.min))
                min = new Date(min);
            if (this._isDate(axisStats.max))
                max = new Date(max);

            var axisPosition = axis.position;
            if (selector.renderTo && selector.position)
                axisPosition = selector.position;

            catAxisSettings.dataField = axis.dataField;
            catAxisSettings.rangeSelector = undefined;
            catAxisSettings.type = axis.type;
            catAxisSettings.baseUnit = selector.baseUnit || axis.baseUnit;
            catAxisSettings.minValue = min;
            catAxisSettings.maxValue = max;
            catAxisSettings.flip = axis.flip;
            catAxisSettings.position = axisPosition;

            var defaultPadding = 5;

            var leftPadding = swapXY ? 0 : rect.x;
            var rightPadding = swapXY ? 0 : this.padding.right;
            var topPadding = swapXY ?  rect.y   : defaultPadding;
            var bottomPadding = swapXY ? this._paddedRect.height - this._plotRect.height : defaultPadding;

            var padding = selector.padding;
            if (padding == undefined && !selector.renderTo)
                padding = { left: leftPadding, top: topPadding, right: rightPadding, bottom: bottomPadding };
            else
            {                
                padding = { 
                    left:   ((padding && padding.left) ? padding.left : leftPadding), 
                    top:    ((padding && padding.top) ? padding.top : topPadding),
                    right:  ((padding && padding.right) ? padding.right : rightPadding), 
                    bottom: ((padding && padding.bottom) ? padding.bottom : bottomPadding) 
                    };
            }

            var dataField = axis.rangeSelector.dataField;
            for (var i = 0; undefined == dataField && i < this.seriesGroups.length; i++)
            {
                for (var j = 0; undefined == dataField && j < this.seriesGroups[i].series.length; j++)
                    dataField = this.seriesGroups[i].series[j].dataField;
            }
           
            var rangeSelectorSettings =
            {
                padding: padding,
                title: selector.title || '',
                description: selector.description || '',
                titlePadding: selector.titlePadding,
                colorScheme: selector.colorScheme || this.colorScheme,
                backgroundColor: selector.backgroundColor || this.backgroundColor || 'transparent',
                backgroundImage: selector.backgroundImage || '',
                showBorderLine: selector.showBorderLine || (selector.renderTo ? true : false),
                borderLineWidth: selector.borderLineWidth || this.borderLineWidth,
                borderLineColor: selector.borderLineColor || this.borderLineColor,
                rtl: selector.rtl || this.rtl,
                greyScale: selector.greyScale || this.greyScale,
                showLegend: false,
                enableAnimations: false,
                enableEvents: false,
                showToolTips: false,
                source: this.source,
                xAxis: catAxisSettings,
                seriesGroups:
                [
                    {
                        orientation: swapXY ? 'horizontal' : 'vertical',
                        valueAxis:
                        {
                            visible: false,
                            //unitInterval: 10
                        },
                        type: axis.rangeSelector.serieType || 'area',
                        series:
                            [
                                { dataField: dataField, opacity: 0.8, lineWidth: 1 }
                            ]
                    }
                ]
            }


            renderTo.empty();
            renderTo.jqxChart(rangeSelectorSettings);

            var self = this;
            // disable for main chart when movign over the selector
            renderTo.on(self._getEvent('mousemove'), function() { self._unselect(); self._hideToolTip();});

            var instance = renderTo.jqxChart('getInstance');
            if (!instance._plotRect)
                return;

            var sliderRect = instance._paddedRect;
            sliderRect.height = instance._plotRect.height;
            if (!swapXY && axisPosition == 'top')
                sliderRect.y += instance._renderData[0].xAxis.rect.height;
            else if (swapXY)
            {                
                var sliderCatAxisWidth = instance._renderData[0].xAxis.rect.width;
                sliderRect.width -= sliderCatAxisWidth;
                if (axisPosition != 'right')
                    sliderRect.x += sliderCatAxisWidth;
            }

            self._createSliderElements(groupIndex, renderTo, sliderRect, selector);

            self.addHandler($(document), self._getEvent('mousemove'), self._onSliderMouseMove, { self: this, groupIndex: groupIndex, renderTo: renderTo, swapXY: swapXY });
            self.addHandler($(document), self._getEvent('mousedown'), self._onSliderMouseDown, { self: this, groupIndex: groupIndex, renderTo: renderTo, swapXY: swapXY });
            self.addHandler($(document), self._getEvent('mouseup'), self._onSliderMouseUp, { self: this, groupIndex: groupIndex, renderTo: renderTo, swapXY: swapXY });
        },

        _createSliderElements: function(groupIndex, renderTo, rect, selectorSettings)
        {
            renderTo.find('.slider').remove();

            var colorSelectedRange = selectorSettings.colorSelectedRange || 'blue';
            var colorUnselectedRange = selectorSettings.colorUnselectedRange || 'white';
            
            var div = $("<div class='slider' style='position: absolute;'></div>");
            div.css({background: colorSelectedRange, opacity: 0.1, left: rect.x, top: rect.y, width: rect.width, height: rect.height });
            div.appendTo(renderTo);

            if (!this._sliders)
                this._sliders = [];

            while(this._sliders.length < groupIndex + 1)
                this._sliders.push({});


            var divAreaDef = "<div class='slider' style='position: absolute;  background: " + colorUnselectedRange + "; opacity: 0.5;'></div>";
            var divBorderDef = "<div class='slider' style='position: absolute; background: grey; opacity: 0.5;'></div>";

            this._sliders[groupIndex] = {
                element: div, 
                host: renderTo, 
                fullRect: {x: div.coord().left, y: div.coord().top, width: rect.width, height: rect.height},
                rect: rect,
                left: $(divAreaDef),
                right: $(divAreaDef),
                leftTop: $(divBorderDef),
                rightTop: $(divBorderDef),
                leftBorder: $(divBorderDef),
                rightBorder: $(divBorderDef)
            };

            this._sliders[groupIndex].left.appendTo(renderTo);
            this._sliders[groupIndex].right.appendTo(renderTo);
            this._sliders[groupIndex].leftTop.appendTo(renderTo);
            this._sliders[groupIndex].rightTop.appendTo(renderTo);
            this._sliders[groupIndex].leftBorder.appendTo(renderTo);
            this._sliders[groupIndex].rightBorder.appendTo(renderTo);

            var renderData = this._renderData[groupIndex].xAxis;
            var stats = renderData.data.axisStats;

            var minValue = stats.min.valueOf();
            var maxValue = stats.max.valueOf();

            var startOffset = this._valueToOffset(groupIndex, minValue);
            var endOffset = this._valueToOffset(groupIndex, maxValue);

            if (startOffset > endOffset)
            {
                var tmp = endOffset;
                endOffset = startOffset;
                startOffset = tmp;
            }

            if (this.seriesGroups[groupIndex].orientation != 'horizontal')
                div.css({left: Math.round(rect.x + startOffset), top: rect.y, width: Math.round(endOffset - startOffset), height: rect.height });
            else
                div.css({top: Math.round(rect.y + startOffset), left: rect.x, height: Math.round(endOffset - startOffset), width: rect.width });

            this._setSliderPositions(groupIndex, startOffset, endOffset);
        },

        _setSliderPositions: function(groupIndex, startOffset, endOffset)
        {
            var g = this.seriesGroups[groupIndex];
            var axis = this._getCategoryAxis(groupIndex);
            var selector = axis.rangeSelector;

            var swapXY = g.orientation == 'horizontal';
            if (axis.rangeSelector.renderTo)
                swapXY = false;

            var axisPosition = axis.position;
            if (selector.renderTo && selector.position)
                axisPosition = selector.position;

            var invertedAxisPos = (swapXY && axisPosition == 'right') || (!swapXY && axisPosition == 'top');

            var slider = this._sliders[groupIndex];

            var posProp = swapXY ? 'top' : 'left';
            var oPosProp = swapXY ? 'left' : 'top';
            var sizeProp = swapXY ? 'height' : 'width';
            var oSizeProp = swapXY ? 'width' : 'height';
            var rectPosProp = swapXY ? 'y' : 'x';
            var rectOPosProp = swapXY ? 'x' : 'y';

            var rect = slider.rect;
            
            slider.left.css(posProp, rect[rectPosProp]);
            slider.left.css(oPosProp, rect[rectOPosProp]);
            slider.left.css(sizeProp, startOffset);
            slider.left.css(oSizeProp, rect[oSizeProp]);

            slider.right.css(posProp, rect[rectPosProp] + endOffset);
            slider.right.css(oPosProp, rect[rectOPosProp]);
            slider.right.css(sizeProp, rect[sizeProp] - endOffset + 1);
            slider.right.css(oSizeProp, rect[oSizeProp]);

            slider.leftTop.css(posProp, rect[rectPosProp]);
            slider.leftTop.css(oPosProp, rect[rectOPosProp] + (((swapXY && axisPosition == 'right') || (!swapXY && axisPosition != 'top')) ? 0 : rect[oSizeProp]));
            slider.leftTop.css(sizeProp, startOffset);
            slider.leftTop.css(oSizeProp, 1);

            slider.rightTop.css(posProp, rect[rectPosProp] + endOffset);
            slider.rightTop.css(oPosProp, rect[rectOPosProp] + (((swapXY && axisPosition == 'right') || (!swapXY && axisPosition != 'top')) ? 0 : rect[oSizeProp]));
            slider.rightTop.css(sizeProp, rect[sizeProp] - endOffset + 1);
            slider.rightTop.css(oSizeProp, 1);

            slider.leftBorder.css(posProp, rect[rectPosProp] + startOffset);
            slider.leftBorder.css(oPosProp, rect[rectOPosProp]);
            slider.leftBorder.css(sizeProp, 1);
            slider.leftBorder.css(oSizeProp, rect[oSizeProp]);

            slider.rightBorder.css(posProp, rect[rectPosProp] + endOffset);
            slider.rightBorder.css(oPosProp, rect[rectOPosProp]);
            slider.rightBorder.css(sizeProp, 1);
            slider.rightBorder.css(oSizeProp, rect[oSizeProp]);
        },

        _resizeState: {},

        _onSliderMouseDown: function(event)
        {
            var self = event.data.self;
            var slider = self._sliders[event.data.groupIndex];
            if (!slider)
                return;

            if (self._resizeState.state == undefined)
                self._testAndSetReadyResize(event);

            if (self._resizeState.state != 'ready')
                return;

            self._resizeState.state = 'resizing';
        },

        _valueToOffset: function(groupIndex, value)
        {
            var group = this.seriesGroups[groupIndex];
            var slider = this._sliders[groupIndex];

            var selectorChart = slider.host.jqxChart('getInstance');
            var renderData = selectorChart._renderData[0].xAxis;
            var stats = renderData.data.axisStats;

            var axisMin = Math.min(stats.min.valueOf(), stats.dsRange.min.valueOf());
            var axisMax = Math.max(stats.max.valueOf(), stats.dsRange.max.valueOf());

            var denom = axisMax - axisMin;
            if (denom == 0)
                denom = 1;

            var axis = this._getCategoryAxis(groupIndex);
            var sizeProp = group.orientation == 'horizontal' ? 'height' : 'width';

            var percent = (value.valueOf() - axisMin) / denom;

            return slider.fullRect[sizeProp] * (axis.flip ? (1 - percent) :  percent);
        },

        _offsetToValue: function(groupIndex, offset)
        {
            var slider = this._sliders[groupIndex];

            var group = this.seriesGroups[groupIndex];
            var axis = this._getCategoryAxis(groupIndex);

            var sizeProp = group.orientation == 'horizontal' ? 'height' : 'width';

            var denom = slider.fullRect[sizeProp];
            if (denom == 0)
                denom = 1;
            var percent = offset / denom;

            var selectorChart = slider.host.jqxChart('getInstance');
            var renderData = selectorChart._renderData[0].xAxis;
            var stats = renderData.data.axisStats;

            var axisMin = Math.min(stats.min.valueOf(), stats.dsRange.min.valueOf());
            var axisMax = Math.max(stats.max.valueOf(), stats.dsRange.max.valueOf());

            var value = offset / denom * (axisMax - axisMin) + axisMin;

            if (axis.flip == true)
            {
                value = axisMax - offset / denom * (axisMax - axisMin);
            }

            if (this._isDate(stats.min) || this._isDate(stats.max))
            {
                value = new Date(value);
            }
            else
            {
                if (axis.dataField == undefined)
                    value = Math.round(value);

                if (value < stats.min)
                    value = stats.min;
                if (value > stats.max)
                    value = stats.max;
            }

            return value;
        },

        _onSliderMouseUp: function(event)
        {
            var self = event.data.self;
            var groupIndex = event.data.groupIndex;
            var swapXY = event.data.swapXY;

            var slider = self._sliders[groupIndex];
            if (!slider)
                return;

            if (self._resizeState.state != 'resizing')
                return;

            self._resizeState = {};

            // update
            self.host.css('cursor', 'default');

            var leftProp = !swapXY ? 'left' : 'top';
            var widthProp = !swapXY ? 'width' : 'height';
            var posProp = !swapXY ? 'x' : 'y';

            var from = slider.element.coord()[leftProp];
            var to = from + (!swapXY ? slider.element.width() : slider.element.height());

            var minValue = self._offsetToValue(groupIndex, from - slider.fullRect[posProp]);
            var maxValue = self._offsetToValue(groupIndex, to - slider.fullRect[posProp]);

            var selectorChart = slider.host.jqxChart('getInstance');
            var renderData = selectorChart._renderData[0].xAxis;
            var stats = renderData.data.axisStats;

            if (!stats.isTimeUnit && (maxValue.valueOf() - minValue.valueOf()) > 86400000)
            {
                minValue.setHours(0, 0, 0, 0);
                maxValue.setDate(maxValue.getDate() + 1);
                maxValue.setHours(0, 0, 0, 0);
            }

            var axis = self._getCategoryAxis(groupIndex);
            if (axis.flip)
            {
                var tmp = minValue;
                minValue = maxValue;
                maxValue = tmp;                
            }

            axis.minValue = minValue;
            axis.maxValue = maxValue;

            self._isSelectorRefresh = true;
            var animSave = self.enableAnimations;
            self.enableAnimations = false;
            self.update();
            self.enableAnimations = animSave;
        },

        _onSliderMouseMove: function(event)
        {
            var self = event.data.self;
            var renderTo = event.data.renderTo;
            var groupIndex = event.data.groupIndex;
            var slider = self._sliders[groupIndex];
            var swapXY = event.data.swapXY;

            if (!slider)
                return;

            var rect = slider.fullRect;
            var element = slider.element;

            var position = $.jqx.position(event);
            var coord = element.coord();

            var topProp = swapXY ? 'left' : 'top';
            var leftProp = !swapXY ? 'left' : 'top';
            var heightProp = swapXY ? 'width' : 'height';
            var widthProp = !swapXY ? 'width' : 'height';

            var posProp = !swapXY ? 'x' : 'y';

            if (self._resizeState.state == 'resizing')
            {
                if (self._resizeState.side == 'left')
                {
                    var diff = Math.round(position[leftProp] - coord[leftProp]);
                    var pos = rect[posProp];
                    if (coord[leftProp] + diff >= pos && coord[leftProp] + diff <= pos + rect[widthProp])
                    {
                        var left = parseInt(element.css(leftProp));
                        var newSize = Math.max(2, (swapXY ? element.height() : element.width()) - diff);
                        element.css(widthProp, newSize);
                        element.css(leftProp, left + diff);
                    }
                }
                else if (self._resizeState.side == 'right')
                {
                    var elementSize = swapXY ? element.height() : element.width();
                    var diff = Math.round(position[leftProp] - coord[leftProp] - elementSize);
                    var pos = rect[posProp];
                    if (coord[leftProp] + elementSize + diff >= pos && coord[leftProp] + diff + elementSize <= pos + rect[widthProp])
                    {
                        var newSize = Math.max(2, elementSize + diff);
                        element.css(widthProp, newSize);
                    }
                }

                var startOffset = parseInt(element.css(leftProp)) - slider.rect[posProp];
                var endOffset = startOffset + (swapXY ? element.height() : element.width());
                self._setSliderPositions(groupIndex, startOffset, endOffset);
            }
            else
            {
                self._testAndSetReadyResize(event);
            }
        },

        _testAndSetReadyResize: function(event)
        {
            var self = event.data.self;
            var renderTo = event.data.renderTo;
            var groupIndex = event.data.groupIndex;
            var slider = self._sliders[groupIndex];
            var swapXY = event.data.swapXY;


            var rect = slider.fullRect;
            var element = slider.element;

            var position = $.jqx.position(event);
            var coord = element.coord();

            var topProp = swapXY ? 'left' : 'top';
            var leftProp = !swapXY ? 'left' : 'top';
            var heightProp = swapXY ? 'width' : 'height';
            var widthProp = !swapXY ? 'width' : 'height';

            var posProp = !swapXY ? 'x' : 'y';
			
			var diff = self._isTouchDevice ? 15 : 5;

            if (position[topProp] >= coord[topProp] && position[topProp] <= coord[topProp] + rect[heightProp])
            {
                if (Math.abs(position[leftProp] - coord[leftProp]) <= diff)
                {
                    renderTo.css('cursor', swapXY ? 'row-resize' : 'col-resize');
                    self._resizeState = { state: 'ready', side: 'left' };
                }
                else if (Math.abs(position[leftProp] - coord[leftProp] - (!swapXY ? element.width() : element.height())) <= diff)
                {
                    renderTo.css('cursor', swapXY ? 'row-resize' : 'col-resize');
                    self._resizeState = { state: 'ready', side: 'right' };
                }
                else
                {
                    renderTo.css('cursor', 'default');
                    self._resizeState = {};
                }
            }
            else
            {
                renderTo.css('cursor', 'default');
                self._resizeState = {};                           
            }
        },

        _selectorGetSize: function (axis) {
            if (axis.rangeSelector.renderTo)
                return 0;
            return axis.rangeSelector.size || this._paddedRect.height / 3;
        }
    });

})(jQuery);



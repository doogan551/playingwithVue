/*
jQWidgets v3.4.0 (2014-June-23)
Copyright (c) 2011-2014 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    /*
    *   RadialGauge's functionality
    */
    var radialGauge = {

        defineInstance: function () {
            var settings = {
                width: 350,
                height: 350,
                radius: '50%',
                endAngle: 270,
                startAngle: 30,
                value: 0,
                min: 0,
                max: 220,
                disabled: false,
                ticksDistance: '20%',
                colorScheme: 'scheme01',
                animationDuration: 400,
                showRanges: true,
                easing: 'easeOutCubic',
                labels: null,
                pointer: null,
                cap: null,
                caption: null,
                border: null,
                ticksMinor: null,
                ticksMajor: null,
                style: null,
                ranges: [],
                _radius: 100,
                _border: null,
                _radiusDifference: 2,
                _pointer: null,
                _labels: [],
                _cap: null,
                _ticks: [],
                _ranges: [],
                _gauge: null,
                _caption: null,
                _animationTimeout: 10,
                renderer: null,
                _animations: [],
                aria:
                {
                    "aria-valuenow": { name: "value", type: "number" },
                    "aria-valuemin": { name: "min", type: "number" },
                    "aria-valuemax": { name: "max", type: "number" },
                    "aria-disabled": { name: "disabled", type: "boolean" }
                }
            };

            $.extend(true, this, settings);
        },

        createInstance: function (args) {
            var self = this;
            self.that = this;
            $.jqx.aria(self);
            self._radius = self.radius;
            self.value = new Number(self.value);
            self.endAngle = self.endAngle * Math.PI / 180 + Math.PI / 2;
            self.startAngle = self.startAngle * Math.PI / 180 + Math.PI / 2;
            self._refresh();
            self.setValue(self.value, 0);
            self.renderer.getContainer().css('overflow', 'hidden');
            $.jqx.utilities.resize(self.host, function () {
                self._refresh();
            });

            self.host.addClass(self.toThemeProperty('jqx-widget'));
        },

        _validateEasing: function () {
            return !!$.easing[this.easing];
        },

        _validateProperties: function () {
            if (this.startAngle === this.endAngle) {
                throw new Error('The end angle can not be equal to the start angle!');
            }
            if (!this._validateEasing()) {
                this.easing = 'linear';
            }
            this.ticksDistance = this._validatePercentage(this.ticksDistance, '20%');
            this.border = this._borderConstructor(this.border, this);
            this.style = this.style || { fill: '#ffffff', stroke: '#E0E0E0' };
            this.ticksMinor = new this._tickConstructor(this.ticksMinor, this);
            this.ticksMajor = new this._tickConstructor(this.ticksMajor, this);
            this.cap = new this._capConstructor(this.cap, this);
            this.pointer = new this._pointerConstructor(this.pointer, this);
            this.labels = new this._labelsConstructor(this.labels, this);
            this.caption = new this._captionConstructor(this.caption, this);
            for (var i = 0; i < this.ranges.length; i += 1) {
                this.ranges[i] = new this._rangeConstructor(this.ranges[i], this);
            }
        },

        _hostInit: function () {
            var width = this._getScale(this.width, 'width', this.host.parent()),
                height = this._getScale(this.height, 'height', this.host.parent()),
                border = this._outerBorderOffset(),
                host = this.host,
                childSize;
            host.width(width);
            host.height(height);
            this.radius = childSize = (this._getScale(this._radius, 'width', this.host) || width / 2) - border;
            this._originalRadius = parseInt(this.radius, 10) - this._radiusDifference;
            this._innerRadius = this._originalRadius;
            if (this.border) {
                this._innerRadius -= this._getSize(this.border.size);
            }
            host[0].innerHTML = '<div />';
            this._gaugeParent = host.children();
            this._gaugeParent.width(width);
            this._gaugeParent.height(height);
            this.renderer.init(this._gaugeParent);
        },

        _initRenderer: function (host) {
            if (!$.jqx.createRenderer)
                throw 'Please include a reference to jqxdraw.js';

            return $.jqx.createRenderer(this, host);
        },

        _refresh: function () {
            var self = this;
            self._isVML = false;

            if (!self.renderer) {
                self.host.empty();
                self._initRenderer(self.host);
            }

            var renderer = self.renderer;
            if (!renderer)
                return;

            if (self._ranges)
                $(self._ranges).remove();
            if (self._pointer)
                $(self._pointer).remove();
            if (self._labels)
                $(self._labels).remove();
            if (self._cap)
                $(self._cap).remove();
            if (self._ticks)
                $(self._ticks).remove();
            if (self._border)
                $(self._border).remove();
            if (self._caption)
                $(self._caption).remove();

            self._caption = null;
            self._labels = [];
            self._cap = null;
            self._ticks = [];
            self._ranges = [];
            self._border = null;
            self._pointer = null;
            self._validateProperties();
            self._removeElements();
            self._hostInit();
            self._render();
            self.setValue(this.value, 0);
        },

        val: function (value) {
            if (arguments.length == 0 || typeof (value) == "object") {
                return this.value;
            }
            this.setValue(value, 0);
        },

        refresh: function () {
            this._refresh.apply(this, Array.prototype.slice(arguments));
        },

        _outerBorderOffset: function () {
            var borderStroke = parseInt(this.border.style['stroke-width'], 10) || 1;
            return borderStroke / 2;
        },

        _removeCollection: function (collection) {
            for (var i = 0; i < collection.length; i += 1) {
                $(collection[i]).remove();
            }
            collection = [];
        },

        _render: function () {
            this._addBorder();
            this._addGauge();
            this._addRanges();
            this._addTicks();
            this._addLabels();
            this._addCaption();
            this._addPointer();
            this._addCap();
        },

        _addBorder: function () {
            if (!this.border.visible) {
                return;
            }
            var color = this.border.style.fill,
                borderSize = this._outerBorderOffset();
            if (!color) {
                color = '#BABABA';
            }
            if (this.border.showGradient) {
                if (color.indexOf('url') < 0 && color.indexOf('#grd') < 0) {
                    this._originalColor = color;
                } else {
                    color = this._originalColor;
                }
                color = this.renderer._toLinearGradient(color, true, [[0, 1], [25, 1.1], [50, 1.5], [100, 1]]);
            }
            this._border = this.renderer.circle(this._originalRadius + borderSize, this._originalRadius + borderSize, this._originalRadius);
            this.border.style.fill = color;
            this.renderer.attr(this._border, this.border.style);
        },

        _addGauge: function () {
            var r = this._originalRadius,
                url = this.renderer._toLinearGradient('#ffffff', [[3, 2], [100, 1]]),
                borderSize = this._outerBorderOffset();
            this._gauge = this.renderer.circle(r + borderSize, r + borderSize, this._innerRadius);
            this.renderer.attr(this._gauge, this.style);
        },

        _addCap: function () {
            var visibility = 'visible',
                borderSize = this._outerBorderOffset();
            if (!this.cap.visible) {
                visibility = 'hidden';
            }
            var r = this._originalRadius,
                size = this._getSize(this.cap.size),
                circle;
            circle = this.renderer.circle(r + borderSize, r + borderSize, size);
            this._capCenter = [r, r];
            this.renderer.attr(circle, this.cap.style);
            $(circle).css('visibility', visibility);
            this._cap = circle;
        },

        _addTicks: function () {
            var ticksMinor = this.ticksMinor,
                ticksMajor = this.ticksMajor,
                minorStep = ticksMinor.interval,
                majorStep = ticksMajor.interval,
                oldVals = {};
            for (var i = this.min, j = this.min; i <= this.max || j <= this.max; i += minorStep, j += majorStep) {
                if (j <= this.max && ticksMajor.visible) {
                    this._drawTick({
                        angle: this._getAngleByValue(j),
                        distance: this._getDistance(this.ticksDistance),
                        style: ticksMajor.style,
                        size: this._getSize(ticksMajor.size),
                        type: 'major'
                    });
                    oldVals[j.toFixed(5)] = true;
                }
                if (!oldVals[i.toFixed(5)] && ticksMinor.visible) {
                    if (i <= this.max) {
                        this._drawTick({
                            angle: this._getAngleByValue(i),
                            distance: this._getDistance(this.ticksDistance),
                            style: ticksMinor.style,
                            size: this._getSize(ticksMinor.size),
                            type: 'minor'
                        });
                    }
                }
            }
            this._handleTicksVisibility();
        },

        _handleTicksVisibility: function () {
            if (!this.ticksMinor.visible) {
                this.host.children('.jqx-gauge-tick-minor').css('visibility', 'hidden');
            } else {
                this.host.children('.jqx-gauge-tick-minor').css('visibility', 'visible');
            }
            if (!this.ticksMajor.visible) {
                this.host.children('.jqx-gauge-tick-major').css('visibility', 'hidden');
            } else {
                this.host.children('.jqx-gauge-tick-major').css('visibility', 'visible');
            }
        },

        /*
        *   Calculates the size relatively to the inner gauge.
        *   _innerRadius is equal to the inner part of the gauge (without border).
        *   _originalRadius is the gauge + it's border.
        */
        _getSize: function (size) {
            if (size.toString().indexOf('%') >= 0) {
                size = (parseInt(size, 10) / 100) * this._innerRadius;
            }
            size = parseInt(size, 10);
            return size;
        },

        _getDistance: function (size) {
            return this._getSize(size) + (this._originalRadius - this._innerRadius);
        },

        _drawTick: function (options) {
            var that = this.that;
            var angle = options.angle,
                distance = options.distance,
                size = options.size,
                borderSize = that._outerBorderOffset(),
                r = that._originalRadius,
                width = r - distance,
                innerWidth = width - size,
                x1 = r + borderSize + width * Math.sin(angle),
                y1 = r + borderSize + width * Math.cos(angle),
                x2 = r + borderSize + innerWidth * Math.sin(angle),
                y2 = r + borderSize + innerWidth * Math.cos(angle),
                line;
            options.style['class'] = that.toThemeProperty('jqx-gauge-tick-' + options.type);
            if (that._isVML) {
                x1 = Math.round(x1);
                x2 = Math.round(x2);
                y1 = Math.round(y1);
                y2 = Math.round(y2);
            }
            line = that.renderer.line(x1, y1, x2, y2, options.style);
            that._ticks.push(line);
        },

        _addRanges: function () {
            var visibility = 'visible';
            if (!this.showRanges) {
                visibility = 'hidden';
            } else {
                var ranges = this.ranges;
                for (var i = 0; i < ranges.length; i += 1) {
                    this._addRange(ranges[i], visibility);
                }
            }
        },

        _getMaxRangeSize: function () {
            var range, size = -1, start, end;
            for (var i = 0; i < this.ranges.length; i += 1) {
                start = this.ranges[i].startWidth;
                end = this.ranges[i].endWidth;
                if (start > size) {
                    size = start;
                }
                if (end > size) {
                    size = end;
                }
            }
            return size;
        },

        _getRangeDistance: function (distance, width) {
            var labelsPosition = this._getLabelsDistance(),
                rangeDistance = this._getDistance(distance),
                maxRangeSize = this._getMaxRangeSize();
            if (this.labels.position === 'outside') {
                if (labelsPosition < rangeDistance + this._getMaxTickSize()) {
                    return this._getDistance(this.ticksDistance) + maxRangeSize / 2 + this._getSize(this.ticksMajor.size);
                }
            } else if (this.labels.position === 'inside') {
                if (labelsPosition + this._getMaxTickSize() < rangeDistance) {
                    return this._getSize(this.border.size) + this._originalRadius / 20;
                }
            }
            return rangeDistance;
        },

        _addRange: function (range, visibility) {
            var that = this.that;

            if (range.startValue < that.min || range.endValue > that.max) {
                return;
            }
            var startAngle = that._getAngleByValue(range.startValue),
                endAngle = that._getAngleByValue(range.endValue),
                radius = that._originalRadius,
                startDistance = radius - that._getRangeDistance(range.startDistance, range.startWidth),
                endDistance = radius - that._getRangeDistance(range.endDistance, range.endWidth),
                startWidth = range.startWidth,
                endWidth = range.endWidth,
                borderSize = that._outerBorderOffset(),
                startPoint = {
                    x: radius + borderSize + startDistance * Math.sin(startAngle),
                    y: radius + borderSize + startDistance * Math.cos(startAngle)
                },
                endPoint = {
                    x: radius + borderSize + endDistance * Math.sin(endAngle),
                    y: radius + borderSize + endDistance * Math.cos(endAngle)
                },
                startProjectionPoint = that._getProjectionPoint(startAngle, radius + borderSize, startDistance, startWidth),
                endProjectionPoint = that._getProjectionPoint(endAngle, radius + borderSize, endDistance, endWidth),
                orientation = 'default',
                path, range;
            if (Math.abs(endAngle - startAngle) > Math.PI) {
                orientation = 'opposite';
            }
            if (that._isVML) {
                path = that._rangeVMLRender(startPoint, endPoint, radius, startProjectionPoint, endProjectionPoint, endWidth, startWidth, startDistance, endDistance, orientation);
            } else {
                path = that._rangeSVGRender(startPoint, endPoint, radius, startProjectionPoint, endProjectionPoint, endWidth, startWidth, startDistance, endDistance, orientation);
            }
            range.style.visibility = visibility;
            range.style['class'] = that.toThemeProperty('jqx-gauge-range');
            range = that.renderer.path(path, range.style);
            that._ranges.push(range);
        },

        _rangeSVGRender: function (startPoint, endPoint, radius, startProjectionPoint, endProjectionPoint, endWidth, startWidth, startDistance, endDistance, orientation) {
            var path = '',
                startDistance = radius - startDistance,
                endDistance = radius - endDistance,
                circle = ['0,1', '0,0'];
            if (orientation === 'opposite') {
                circle = ['1,1', '1,0'];
            }
            path = 'M' + startPoint.x + ',' + startPoint.y + ' ';
            path += 'A' + (radius - startDistance) + ',' + (radius - startDistance) + ' 100 ' + circle[0] + ' ' + endPoint.x + ',' + endPoint.y + ' ';
            path += 'L ' + (endProjectionPoint.x) + ',' + (endProjectionPoint.y) + ' ';
            path += 'A' + (radius - endWidth - startDistance) + ',' + (radius - endWidth - startDistance) + ' 100 ' + circle[1] + ' ' + (startProjectionPoint.x) + ',' + (startProjectionPoint.y) + ' ';
            path += 'L ' + (startPoint.x) + ',' + (startPoint.y) + ' ';
            path += 'z';
            return path;
        },

        _rangeVMLRender: function (startPoint, endPoint, radius, startProjectionPoint, endProjectionPoint, endWidth, startWidth, startDistance, endDistance, orientation) {
            radius -= radius - startDistance + 10;
            var path = '',
                outerRadius = Math.floor(radius + (startWidth + endWidth) / 2),
                startDistance = Math.floor(radius - startDistance),
                endDistance = Math.floor(endDistance),
                middleProjection = {
                    x: (startProjectionPoint.x + endProjectionPoint.x) / 2,
                    y: (startProjectionPoint.y + endProjectionPoint.y) / 2
                },
                projDistance = Math.sqrt((endProjectionPoint.x - startProjectionPoint.x) * (endProjectionPoint.x - startProjectionPoint.x) + (endProjectionPoint.y - startProjectionPoint.y) * (endProjectionPoint.y - startProjectionPoint.y)),
                projCenterX = Math.floor(middleProjection.x + Math.sqrt(radius * radius - (projDistance / 2) * (projDistance / 2)) * (startProjectionPoint.y - endProjectionPoint.y) / projDistance),
                projCenterY = Math.floor(middleProjection.y + Math.sqrt(radius * radius - (projDistance / 2) * (projDistance / 2)) * (endProjectionPoint.x - startProjectionPoint.x) / projDistance),
                middle = {
                    x: (startPoint.x + endPoint.x) / 2,
                    y: (startPoint.y + endPoint.y) / 2
                },
                distance = Math.sqrt((endPoint.x - startPoint.x) * (endPoint.x - startPoint.x) + (endPoint.y - startPoint.y) * (endPoint.y - startPoint.y)),
                centerX = Math.floor(middle.x + Math.sqrt(Math.abs(outerRadius * outerRadius - (distance / 2) * (distance / 2))) * (startPoint.y - endPoint.y) / distance),
                centerY = Math.floor(middle.y + Math.sqrt(Math.abs(outerRadius * outerRadius - (distance / 2) * (distance / 2))) * (endPoint.x - startPoint.x) / distance);

            if (orientation === 'opposite') {
                projCenterX = Math.floor(middleProjection.x - Math.sqrt(radius * radius - (projDistance / 2) * (projDistance / 2)) * (startProjectionPoint.y - endProjectionPoint.y) / projDistance);
                projCenterY = Math.floor(middleProjection.y - Math.sqrt(radius * radius - (projDistance / 2) * (projDistance / 2)) * (endProjectionPoint.x - startProjectionPoint.x) / projDistance);

                centerX = Math.floor(middle.x - Math.sqrt(Math.abs(outerRadius * outerRadius - (distance / 2) * (distance / 2))) * (startPoint.y - endPoint.y) / distance);
                centerY = Math.floor(middle.y - Math.sqrt(Math.abs(outerRadius * outerRadius - (distance / 2) * (distance / 2))) * (endPoint.x - startPoint.x) / distance);
            }
            radius = Math.floor(radius);
            endPoint = { x: Math.floor(endPoint.x), y: Math.floor(endPoint.y) };
            startPoint = { x: Math.floor(startPoint.x), y: Math.floor(startPoint.y) };
            startProjectionPoint = { x: Math.floor(startProjectionPoint.x), y: Math.floor(startProjectionPoint.y) };
            endProjectionPoint = { x: Math.floor(endProjectionPoint.x), y: Math.floor(endProjectionPoint.y) };

            path = 'm ' + endPoint.x + ',' + endPoint.y;
            path += 'at ' + (centerX - outerRadius) + ' ' + (centerY - outerRadius) + ' ' + (outerRadius + centerX) + ' ' + (outerRadius + centerY) + ' ' + endPoint.x + ',' + endPoint.y + ' ' + startPoint.x + ',' + startPoint.y;
            path += 'l ' + startProjectionPoint.x + ',' + startProjectionPoint.y;
            path += 'm ' + endPoint.x + ',' + endPoint.y;
            path += 'l ' + endProjectionPoint.x + ',' + endProjectionPoint.y;
            path += 'at ' + (projCenterX - radius) + ' ' + (projCenterY - radius) + ' ' + (radius + projCenterX) + ' ' + (radius + projCenterY) + ' ' + endProjectionPoint.x + ',' + endProjectionPoint.y + ' ' + startProjectionPoint.x + ',' + startProjectionPoint.y;
            path += 'qx ' + startProjectionPoint.x + ' ' + startProjectionPoint.y;
            return path;
        },

        _getProjectionPoint: function (angle, radius, ratio, displacement) {
            var point = { x: radius + (ratio - displacement) * Math.sin(angle), y: radius + (ratio - displacement) * Math.cos(angle) };
            return point;
        },

        _addLabels: function (options) {
            var distance = this._getDistance(this._getLabelsDistance());
            for (var currentLabel = this.min; currentLabel <= this.max; currentLabel += this.labels.interval) {
                if (this.labels.visible) {
                    this._addLabel({
                        angle: this._getAngleByValue(currentLabel),
                        value: this.labels.interval >= 1 ? currentLabel : new Number(currentLabel).toFixed(2),
                        distance: distance,
                        style: this.labels.className
                    });
                }
            }
        },

        _getLabelsDistance: function () {
            var maxSize = this._getMaxLabelSize(),
                labelsDistance = this._getDistance(this.labels.distance),
                ticksDistance = this._getDistance(this.ticksDistance);
            maxSize = maxSize.width;
            if (this.labels.position === 'inside') {
                return ticksDistance + maxSize - 5;
            } else if (this.labels.position === 'outside') {
                if (labelsDistance < (ticksDistance - maxSize * 1.5)) {
                    return labelsDistance;
                }
                return Math.max(ticksDistance - maxSize * 1.5, 0.6 * maxSize);
            }
            return this.labels.distance;
        },

        _addLabel: function (options) {
            var that = this.that;
            var angle = options.angle,
                r = that._originalRadius,
                w = r - options.distance,
                offset = that.labels.offset,
                callback = that.labels.formatValue,
                borderSize = that._outerBorderOffset(),
                x = r + borderSize + w * Math.sin(angle) + offset[0],
                y = r + borderSize + w * Math.cos(angle) + offset[1],
                value = options.value,
                className = options.style || '',
                textSize,
                label;
            if (typeof callback === 'function') {
                value = callback(value);
            }
            textSize = that.renderer.measureText(value, 0, { 'class': className });
            label = that.renderer.text(value, Math.round(x) - textSize.width / 2, Math.round(y), textSize.width, textSize.height, 0, { 'class': this.toThemeProperty('jqx-gauge-label') });
            that._labels.push(label);
        },

        _addCaption: function () {
            var that = this.that;
            var text = that.caption.value,
                className = that.toThemeProperty('jqx-gauge-caption'),
                offset = that.caption.offset,
                size = that.renderer.measureText(text, 0, { 'class': className }),
                position = that._getPosition(this.caption.position, size, offset),
                style = that.caption.style,
                border = that._outerBorderOffset(),
                t = that.renderer.text(text, position.left + border, position.top + border, size.width, size.height, 0, { 'class': className });
            this._caption = t;
        },

        _getPosition: function (position, size, offset) {
            var left = 0,
                top = 0,
                r = this._originalRadius;
            switch (position) {
                case 'left':
                    left = (r - size.width) / 2;
                    top = r - size.height / 2;
                    break;
                case 'right':
                    left = r + (r - size.width) / 2;
                    top = r - size.height / 2;
                    break;
                case 'bottom':
                    left = (2 * r - size.width) / 2;
                    top = (r + 2 * r - size.height) / 2;
                    break;
                default:
                    left = (2 * r - size.width) / 2;
                    top = (r + size.height) / 2;
                    break;
            }
            return { left: left + offset[0], top: top + offset[1] };
        },

        _addPointer: function () {
            var visibility = 'visible';
            if (!this.pointer.visible) {
                visibility = 'hidden';
            }
            var radius = this._originalRadius,
                length = this._getSize(this.pointer.length),
                innerW = length * 0.9,
                angle = this._getAngleByValue(this.value),
                pointerType = this.pointer.pointerType,
                points;
            points = this._computePointerPoints(this._getSize(this.pointer.width), angle, length, pointerType !== 'default');
            this._pointer = this.renderer.path(points, this.pointer.style);
            $(this._pointer).css('visibility', visibility);
        },

        _computePointerPoints: function (pointerWidth, angle, pointerLength, rect) {
            if (!rect) {
                return this._computeArrowPoints(pointerWidth, angle, pointerLength);
            } else {
                return this._computeRectPoints(pointerWidth, angle, pointerLength);
            }
        },

        _computeArrowPoints: function (pointerWidth, angle, pointerLength) {
            var r = this._originalRadius - 0.5,
                sin = Math.sin(angle),
                cos = Math.cos(angle),
                borderSize = this._outerBorderOffset(),
                x = r + borderSize + pointerLength * sin,
                y = r + borderSize + pointerLength * cos,
                startX1 = r + borderSize + pointerWidth * cos,
                startY1 = r + borderSize - pointerWidth * sin,
                startX2 = r + borderSize - pointerWidth * cos,
                startY2 = r + borderSize + pointerWidth * sin,
                points;
            if (this._isVML) {
                startX1 = Math.round(startX1);
                startX2 = Math.round(startX2);
                startY1 = Math.round(startY1);
                startY2 = Math.round(startY2);
                x = Math.round(x);
                y = Math.round(y);
            }
            points = 'M ' + startX1 + ',' + startY1 + ' L ' + startX2 + ',' + startY2 + ' L ' + x + ',' + y + '';
            return points;
        },

        _computeRectPoints: function (pointerWidth, angle, pointerLength) {
            var r = this._originalRadius,
                sin = Math.sin(angle),
                cos = Math.cos(angle),
                arrowDistance = pointerLength,
                borderSize = this._outerBorderOffset(),
                endX1 = r + borderSize - pointerWidth * cos + pointerLength * sin,
                endY1 = r + borderSize + pointerWidth * sin + pointerLength * cos,
                endX2 = r + borderSize + pointerWidth * cos + pointerLength * sin,
                endY2 = r + borderSize - pointerWidth * sin + pointerLength * cos,
                startX1 = r + borderSize + pointerWidth * cos,
                startY1 = r + borderSize - pointerWidth * sin,
                startX2 = r + borderSize - pointerWidth * cos,
                startY2 = r + borderSize + pointerWidth * sin,
                points;
            if (this._isVML) {
                startX1 = Math.round(startX1);
                startX2 = Math.round(startX2);
                startY1 = Math.round(startY1);
                startY2 = Math.round(startY2);
                endX1 = Math.round(endX1);
                endY1 = Math.round(endY1);
                endX2 = Math.round(endX2);
                endY2 = Math.round(endY2);
            }
            points = 'M ' + startX1 + ',' + startY1 + ' L ' + startX2 + ',' + startY2 + ' L ' + endX1 + ',' + endY1 + ' ' + endX2 + ',' + endY2;
            return points;
        },

        _getAngleByValue: function (value) {
            var startAngle = this.startAngle,
                endAngle = this.endAngle,
                start = this.min,
                end = this.max,
                singleValue = (startAngle - endAngle) / (end - start);
            var angle = singleValue * (value - this.min) + startAngle + Math.PI;
            //      var degrees = angle * (180 / Math.PI);
            return angle;
        },

        _setValue: function (value) {
            if (value <= this.max && value >= this.min) {
                var angle = this._getAngleByValue(value),
                    pointerType = this.pointer.pointerType,
                    points = this._computePointerPoints(this._getSize(this.pointer.width), angle, this._getSize(this.pointer.length), pointerType !== 'default');
                if (this._isVML) {
                    if (this._pointer) $(this._pointer).remove();
                    this._pointer = this.renderer.path(points, this.pointer.style);
                } else {
                    this.renderer.attr(this._pointer, { d: points });
                }
                this.value = value;
                $.jqx.aria(this, 'aria-valuenow', value);
            }
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.refresh();
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (value == oldvalue)
                return;

            if (key == 'min') {
                this.min = parseInt(value);
                $.jqx.aria(object, 'aria-valuemin', value);
            }
            if (key == 'max') {
                this.max = parseInt(value);
                $.jqx.aria(object, 'aria-valuemax', value);
            }
            if (key == 'value') {
                this.value = parseInt(value);
            }

            if (key === 'disabled') {
                if (value) {
                    this.disable();
                } else {
                    this.enable();
                }
                $.jqx.aria(this, 'aria-disabled', value);
            } else if (key === 'value') {
                this.value = oldvalue;
                this.setValue(value);
            } else {
                if (key === 'startAngle') {
                    this.startAngle = this.startAngle * Math.PI / 180 + Math.PI / 2;
                } else if (key === 'endAngle') {
                    this.endAngle = this.endAngle * Math.PI / 180 + Math.PI / 2;
                } else if (key === 'colorScheme') {
                    this.pointer.style = null;
                    this.cap.style = null;
                } else if (key === 'radius') {
                    this._radius = value;
                }
                if (key !== 'animationDuration' && key !== 'easing') {
                    this._refresh();
                }
            }
            if (this.renderer instanceof $.jqx.HTML5Renderer)
                this.renderer.refresh();
        },

        _tickConstructor: function (data, jqx) {
            if (this.host) {
                return new this._tickConstructor(data, jqx);
            }
            data = data || {};
            this.size = jqx._validatePercentage(data.size, '10%');
            this.interval = parseFloat(data.interval);
            if (!this.interval) {
                this.interval = 5;
            }
            this.style = data.style || { stroke: '#898989', 'stroke-width': 1 };
            if (typeof data.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = data.visible;
            }
        },

        _capConstructor: function (data, jqx) {
            var color = jqx._getColorScheme(jqx.colorScheme)[0];
            if (this.host) {
                return new this._capConstructor(data, jqx);
            }
            data = data || {};
            if (typeof data.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = data.visible;
            }
            this.size = jqx._validatePercentage(data.size, '4%');
            this.style = data.style || { fill: color, 'stroke-width': '1px', stroke: color, 'z-index': 30 };
        },

        _pointerConstructor: function (data, jqx) {
            var color = jqx._getColorScheme(jqx.colorScheme)[0];
            if (this.host) {
                return new this._pointerConstructor(data, jqx);
            }
            data = data || {};
            if (typeof data.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = data.visible;
            }
            this.pointerType = data.pointerType;
            if (this.pointerType !== 'default' && this.pointerType !== 'rectangle') {
                this.pointerType = 'default';
            }
            this.style = data.style || { 'z-index': 0, stroke: color, fill: color, 'stroke-width': 1 };
            this.length = jqx._validatePercentage(data.length, '70%');
            this.width = jqx._validatePercentage(data.width, '2%');
        },

        _labelsConstructor: function (data, jqx) {
            if (this.host) {
                return new this._labelsConstructor(data, jqx);
            }
            data = data || {};
            if (typeof data.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = data.visible;
            }
            this.offset = data.offset;
            if (!(this.offset instanceof Array)) {
                this.offset = [0, -10];
            }
            this.interval = parseFloat(data.interval);
            if (!this.interval) {
                this.interval = 20;
            }
            this.distance = jqx._validatePercentage(data.distance, '38%');
            this.position = data.position;
            if (this.position !== 'inside' && this.position !== 'outside') {
                this.position = 'none';
            }
            this.formatValue = data.formatValue;
            if (typeof this.formatValue !== 'function') {
                this.formatValue = function (value) {
                    return value;
                }
            }
        },

        _captionConstructor: function (data, jqx) {
            if (this.host) {
                return new this._captionConstructor(data, jqx);
            }
            data = data || {};
            if (typeof data.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = data.visible;
            }
            this.value = data.value || '';
            this.position = data.position;
            if (this.position !== 'bottom' && this.position !== 'top' &&
                this.position !== 'left' && this.position !== 'right') {
                this.position = 'bottom';
            }
            this.offset = data.offset;
            if (!(this.offset instanceof Array)) {
                this.offset = [0, 0];
            }
        },

        _rangeConstructor: function (data, jqx) {
            if (this.host) {
                return new this._rangeConstructor(data, jqx);
            }
            data = data || {};
            this.startDistance = jqx._validatePercentage(data.startDistance, '5%');
            this.endDistance = jqx._validatePercentage(data.endDistance, '5%');
            this.style = data.style || { fill: '#000000', stroke: '#111111' };
            this.startWidth = parseFloat(data.startWidth, 10);
            if (!this.startWidth) {
                this.startWidth = 10;
            }
            this.startWidth = Math.max(this.startWidth, 2);
            this.endWidth = parseFloat(data.endWidth, 10);
            if (!this.endWidth) {
                this.endWidth = 10;
            }
            this.endWidth = Math.max(this.endWidth, 2);
            this.startValue = parseFloat(data.startValue, 10);
            if (!this.startValue) {
                this.startValue = 0;
            }
            this.endValue = parseFloat(data.endValue, 10);
            if (undefined == this.endValue) {
                this.endValue = 100;
            }
        },

        _borderConstructor: function (data, jqx) {
            if (this.host) {
                return new this._borderConstructor(data, jqx);
            }
            data = data || {};
            this.size = jqx._validatePercentage(data.size, '10%');
            this.style = data.style || { stroke: '#cccccc' };
            if (typeof data.showGradient === 'undefined') {
                this.showGradient = true;
            } else {
                this.showGradient = data.showGradient;
            }
            if (typeof data.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = data.visible;
            }
        }
    };

    // Common functions for linear and radial gauge
    var common = {

        _events: ['valueChanging', 'valueChanged'],
        _animationTimeout: 10,
        _schemes: [
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

        _getScale: function (size, dim, parent) {
            if (size && size.toString().indexOf('%') >= 0) {
                size = parseInt(size, 10) / 100;
                return parent[dim]() * size;
            }
            return parseInt(size, 10);
        },

        _removeElements: function () {
            this.host.children('.chartContainer').remove();
            this.host.children('#tblChart').remove();
        },

        _getMaxLabelSize: function () {
            var maxVal = this.max,
                minVal = this.min;
            if (this.labels.interval < 1) {
                minVal = new Number(minVal).toFixed(2);
                maxVal = new Number(maxVal).toFixed(2);
            }
            var maxSize = this.renderer.measureText(maxVal, 0, { 'class': this.toThemeProperty('jqx-gauge-label') }),
                minSize = this.renderer.measureText(minVal, 0, { 'class': this.toThemeProperty('jqx-gauge-label') });
            if (minSize.width > maxSize.width) {
                return minSize;
            }
            return maxSize;
        },

        disable: function () {
            this.disabled = true;
            this.host.addClass(this.toThemeProperty('jqx-fill-state-disabled'));
        },

        enable: function () {
            this.disabled = false;
            this.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
        },

        destroy: function () {
            var self = this;
            if (self._timeout)
                clearTimeout(this._timeout);

            self._timeout = null;
            $.jqx.utilities.resize(self.host, null, true);
            self._removeElements();
            self.renderer.clear();
            self.renderer = null;
            var vars = $.data(self.element, "jqxGauge");
            if (vars)
                delete vars.instance;

            self.host.children().remove();
            self._caption = null;
            self._caption = null;
            self._pointer = null;
            self._labels = [];
            self._cap = null;
            self._ticks = [];
            self._ranges = [];
            self._border = null;
            self._gauge = null;
            self._caption = null;
            self.renderer = null;
            self._animations = [];
            self.host.removeData();
            self.host.removeClass();
            self.host.remove();
            self.that = null;
            self.element = null;
            self._gaugeParent = null;
            delete self._gaugeParent;
            delete self.element;
            delete self.host;
        },

        _validatePercentage: function (data, def) {
            if (parseFloat(data) !== 0 && (!data || !parseInt(data, 10))) {
                data = def;
            }
            return data;
        },

        _getColorScheme: function (name) {
            var scheme;
            for (var i = 0; i < this._schemes.length; i += 1) {
                scheme = this._schemes[i];
                if (scheme.name === name) {
                    return scheme.colors;
                }
            }
            return null;
        },

        setValue: function (value, duration) {
            if (!this.disabled) {
                if (value > this.max) {
                    value = this.max;
                }
                if (value < this.min) {
                    value = this.min;
                }
                duration = duration || this.animationDuration || 0;
                var distance = duration / this._animationTimeout;
                this._animate((value - this.value) / distance, this.value, value, duration);
                $.jqx.aria(this, 'aria-valuenow', value);
            }
        },

        _animate: function (step, start, end, duration) {
            if (this._timeout) {
                this._endAnimation(this.value, false);
            }
            if (!duration) {
                this._endAnimation(end, true);
                return;
            }
            this._animateHandler(step, start, end, 0, duration);
        },

        _animateHandler: function (step, start, end, current, duration) {
            var self = this;
            if (current <= duration) {
                this._timeout = setTimeout(function () {
                    self.value = start + (end - start) * $.easing[self.easing](current / duration, current, 0, 1, duration);
                    self._setValue(self.value);
                    self._raiseEvent(0, {
                        value: self.value
                    });
                    self._animateHandler(step, start, end, current + self._animationTimeout, duration);
                }, this._animationTimeout);
            } else {
                this._endAnimation(end, true);
            }
        },

        _endAnimation: function (end, toRaiseEvent) {
            clearTimeout(this._timeout);
            this._timeout = null;
            this._setValue(end);
            if (toRaiseEvent) {
                this._raiseEvent(1, {
                    value: end
                });
            }
        },

        _getMaxTickSize: function () {
            return Math.max(this._getSize(this.ticksMajor.size), this._getSize(this.ticksMinor.size));
        },

        _raiseEvent: function (eventId, args) {
            var event = $.Event(this._events[eventId]),
                result;
            event.args = args || {};
            result = this.host.trigger(event);
            return result;
        }
    },

    // LinearGauge's functionality
    linearGauge = {
        defineInstance: function () {
            var settings =
            {
                value: -50,
                max: 40,
                min: -60,
                width: 100,
                height: 300,
                pointer: {},
                labels: {},
                animationDuration: 1000,
                showRanges: {},
                ticksMajor: { size: '15%', interval: 5 },
                ticksMinor: { size: '10%', interval: 2.5 },
                ranges: [],
                easing: 'easeOutCubic',
                colorScheme: 'scheme01',
                disabled: false,
                rangesOffset: 0,
                background: {},
                ticksPosition: 'both',
                rangeSize: '5%',
                scaleStyle: null,
                ticksOffset: null,
                scaleLength: '90%',
                orientation: 'vertical',
                aria:
                {
                    "aria-valuenow": { name: "value", type: "number" },
                    "aria-valuemin": { name: "min", type: "number" },
                    "aria-valuemax": { name: "max", type: "number" },
                    "aria-disabled": { name: "disabled", type: "boolean" }
                },

                //Used for saving the solid background color when a gradient is used
                _originalColor: '',
                _width: null,
                _height: null,
                renderer: null
            };

            $.extend(true, this, settings);
        },

        createInstance: function () {
            $.jqx.aria(this);
            this.host.css('overflow', 'hidden');
            this.host.addClass(this.toThemeProperty('jqx-widget'));
            var self = this;
            $.jqx.utilities.resize(this.host, function () {
                self.refresh(false, false);
            });
        },

        val: function (value) {
            if (arguments.length == 0 || typeof (value) == "object") {
                return this.value;
            }
            this.setValue(value, 0);
        },

        _initRenderer: function (host) {
            if (!$.jqx.createRenderer)
                throw 'Please include a reference to jqxdraw.js';

            return $.jqx.createRenderer(this, host);
        },

        refresh: function (init, applyValue) {
            var self = this;
            self._isVML = false;

            if (!self.renderer) {
                self.host.empty();
                self._initRenderer(self.host);
            }

            var renderer = self.renderer;
            if (!renderer)
                return;

            self._validateProperties();
            self._reset();
            self._init();
            self._performLayout();
            self._render();
            if (applyValue !== false) {
                self.setValue(self.value, 1);
            }
        },

        _getBorderSize: function () {
            var def = 1,
                size;
            if (this._isVML) {
                def = 0;
            }
            if (this.background) {
                size = (parseInt(this.background.style['stroke-width'], 10) || def) / 2;
                if (this._isVML) {
                    return Math.round(size);
                }
                return size;
            }
            return def;
        },

        _validateProperties: function () {
            this.background = this._backgroundConstructor(this.background, this);
            this.ticksOffset = this.ticksOffset || this._getDefaultTicksOffset();
            this.rangesOffset = this.rangesOffset || 0;
            this.rangeSize = this._validatePercentage(this.rangeSize, 5);
            this.ticksOffset[0] = this._validatePercentage(this.ticksOffset[0], '5%');
            this.ticksOffset[1] = this._validatePercentage(this.ticksOffset[1], '5%');
            this.ticksMinor = this._tickConstructor(this.ticksMinor, this);
            this.ticksMajor = this._tickConstructor(this.ticksMajor, this);
            this.scaleStyle = this.scaleStyle || this.ticksMajor.style;
            this.labels = this._labelsConstructor(this.labels, this);
            this.pointer = this._pointerConstructor(this.pointer, this);
            for (var i = 0; i < this.ranges.length; i += 1) {
                this.ranges[i] = this._rangeConstructor(this.ranges[i], this);
            }
        },

        _getDefaultTicksOffset: function () {
            if (this.orientation === 'horizontal') {
                return ['5%', '36%'];
            }
            return ['36%', '5%'];
        },

        _handleOrientation: function () {
            if (this.orientation === 'vertical') {
                $.extend(this, linearVerticalGauge);
            } else {
                $.extend(this, linearHorizontalGauge);
            }
        },

        _reset: function () {
            this.host.empty();
        },

        _performLayout: function () {
            var borderStroke = parseInt(this.background.style['stroke-width'], 10) || 1;
            this._width -= borderStroke;
            this._height -= borderStroke;
            this.host.css('padding', borderStroke / 2);
        },

        _init: function () {
            var border = this._getBorderSize(),
                chartContainer;
            this._width = this._getScale(this.width, 'width', this.host.parent()) - 3;
            this._height = this._getScale(this.height, 'height', this.host.parent()) - 3;
            this.element.innerHTML = '<div/>';
            this.host.width(this._width);
            this.host.height(this._height);
            this.host.children().width(this._width);
            this.host.children().height(this._height);
            this.renderer.init(this.host.children());
            chartContainer = this.renderer.getContainer();
            chartContainer.width(this._width);
            chartContainer.height(this._height);
        },

        _render: function () {
            this._renderBackground();
            this._renderTicks();
            this._renderLabels();
            this._renderRanges();
            this._renderPointer();
        },

        _renderBackground: function () {
            if (!this.background.visible) {
                return;
            }
            var options = this.background.style,
                border = $.jqx._rup(this._getBorderSize()),
                shape = 'rect',
                rect;
            options = this._handleShapeOptions(options);
            if (this.background.backgroundType === 'roundedRectangle' && this._isVML) {
                shape = 'roundrect';
            }
            if (!this._Vml) {
                options.x = border;
                options.y = border;
            }
            rect = this.renderer.shape(shape, options);
            if (this._isVML) {
                this._fixVmlRoundrect(rect, options);
            }
        },

        _handleShapeOptions: function (options) {
            var color = this.background.style.fill,
                border = this._getBorderSize();
            if (!color) {
                color = '#cccccc';
            }
            if (this.background.showGradient) {
                if (color.indexOf('url') < 0 && color.indexOf('#grd') < 0) {
                    this._originalColor = color;
                } else {
                    color = this._originalColor;
                }
                color = this.renderer._toLinearGradient(color, this.orientation === 'horizontal', [[1, 1.1], [90, 1.5]]);
            }
            this.background.style.fill = color;
            if (this.background.backgroundType === 'roundedRectangle') {
                if (this._isVML) {
                    options.arcsize = this.background.borderRadius + '%';
                } else {
                    options.rx = this.background.borderRadius;
                    options.ry = this.background.borderRadius;
                }
            }
            options.width = this._width - 1;
            options.height = this._height - 1;
            return options;
        },

        _fixVmlRoundrect: function (rect, options) {
            var border = this._getBorderSize();
            rect.style.position = 'absolute';
            rect.style.left = border;
            rect.style.top = border;
            rect.style.width = this._width - 1;
            rect.style.height = this._height - 1;
            rect.strokeweight = 0;
            delete options.width;
            delete options.height;
            delete options.arcsize;
            this.renderer.attr(rect, options);
        },

        _renderTicks: function () {
            var distance = Math.abs(this.max - this.min),
                minor = this.ticksMinor,
                major = this.ticksMajor,
                majorCount = distance / major.interval,
                minorCount = distance / minor.interval,
                majorOptions, minorOptions;
            majorOptions = { size: this._getSize(major.size), style: major.style, visible: major.visible, interval: major.interval };
            minorOptions = { size: this._getSize(minor.size), style: minor.style, visible: minor.visible, interval: minor.interval, checkOverlap: true };
            if (this.ticksPosition === 'near' || this.ticksPosition === 'both') {
                this._ticksRenderHandler(majorOptions);
                this._ticksRenderHandler(minorOptions);
            }
            if (this.ticksPosition === 'far' || this.ticksPosition === 'both') {
                majorOptions.isFar = true;
                minorOptions.isFar = true;
                this._ticksRenderHandler(majorOptions);
                this._ticksRenderHandler(minorOptions);
            }
            this._renderConnectionLine();
        },

        _ticksRenderHandler: function (options) {
            if (!options.visible) {
                return;
            }
            var offsetLeft = this._getSize(this.ticksOffset[0], 'width'),
                offsetTop = this._getSize(this.ticksOffset[1], 'height'),
                border = this._getBorderSize(),
                inactiveOffset = this._calculateTickOffset() + this._getMaxTickSize();
            if (options.isFar) {
                inactiveOffset += options.size;
            }
            this._drawTicks(options, border, inactiveOffset + border);
        },

        _drawTicks: function (options, border, inactiveOffset) {
            var position;
            for (var i = this.min; i <= this.max; i += options.interval) {
                position = this._valueToCoordinates(i);
                if (!options.checkOverlap || !this._overlapTick(i)) {
                    this._renderTick(options.size, position, options.style, inactiveOffset);
                }
            }
        },

        _calculateTickOffset: function () {
            var offsetLeft = this._getSize(this.ticksOffset[0], 'width'),
                offsetTop = this._getSize(this.ticksOffset[1], 'height'),
                offset = offsetTop;
            if (this.orientation === 'vertical') {
                offset = offsetLeft;
            }
            return offset;
        },

        _overlapTick: function (value) {
            value += this.min;
            if (value % this.ticksMinor.interval === value % this.ticksMajor.interval) {
                return true;
            }
            return false;
        },

        _renderConnectionLine: function () {
            if (!this.ticksMajor.visible && !this.ticksMinor.visible) {
                return;
            }
            var scaleLength = this._getScaleLength(),
                border = this._getBorderSize(),
                maxPosition = this._valueToCoordinates(this.max),
                minPosition = this._valueToCoordinates(this.min),
                maxSize = this._getMaxTickSize(),
                offset = maxSize + border;
            if (this.orientation === 'vertical') {
                offset += this._getSize(this.ticksOffset[0], 'width');
                this.renderer.line(offset, maxPosition, offset, minPosition, this.scaleStyle);
            } else {
                offset += this._getSize(this.ticksOffset[1], 'height');
                this.renderer.line(maxPosition, offset, minPosition, offset, this.scaleStyle);
            }
        },

        _getScaleLength: function () {
            return this._getSize(this.scaleLength, (this.orientation === 'vertical' ? 'height' : 'width'));
        },

        _renderTick: function (size, distance, style, offset) {
            var coordinates = this._handleTickCoordinates(size, distance, offset);
            this.renderer.line(Math.round(coordinates.x1), Math.round(coordinates.y1), Math.round(coordinates.x2), Math.round(coordinates.y2), style);
        },

        _handleTickCoordinates: function (size, distance, offset) {
            if (this.orientation === 'vertical') {
                return {
                    x1: offset - size,
                    x2: offset,
                    y1: distance,
                    y2: distance
                };
            }
            return {
                x1: distance,
                x2: distance,
                y1: offset - size,
                y2: offset
            };
        },

        _getTickCoordinates: function (tickSize, offset) {
            var ticksCoordinates = this._handleTickCoordinates(tickSize, 0, this._calculateTickOffset());
            if (this.orientation === 'vertical') {
                ticksCoordinates = ticksCoordinates.x1;
            } else {
                ticksCoordinates = ticksCoordinates.y1;
            }
            ticksCoordinates += tickSize;
            return ticksCoordinates;

        },

        _renderLabels: function () {
            if (!this.labels.visible) {
                return;
            }
            var startPosition = this._getSize(this.ticksOffset[0], 'width'),
                tickSize = this._getMaxTickSize(),
                labelsPosition = this.labels.position,
                dimension = 'height',
                border = this._getBorderSize(),
                ticksCoordinates = this._calculateTickOffset() + tickSize,
                maxLabelSize;
            if (this.orientation === 'vertical') {
                startPosition = this._getSize(this.ticksOffset[1], 'height');
                dimension = 'width';
            }
            maxLabelSize = this._getMaxLabelSize()[dimension];
            if (labelsPosition === 'near' || labelsPosition === 'both') {
                this._labelListRender(ticksCoordinates - tickSize - maxLabelSize + border, startPosition + border, maxLabelSize, 'near');
            }
            if (labelsPosition === 'far' || labelsPosition === 'both') {
                this._labelListRender(ticksCoordinates + tickSize + maxLabelSize + border, startPosition + border, maxLabelSize, 'far');
            }
        },

        _labelListRender: function (offset, distance, maxLabelSize, position) {
            var interval = this.labels.interval,
                count = Math.abs(this.max - this.min) / interval,
                length = this._getScaleLength(),
                step = length / count,
                currentValue = (this.orientation === 'vertical') ? this.max : this.min;
            offset += this._getSize(this.labels.offset);
            for (var i = 0; i <= count; i += 1) {
                this._renderLabel(distance, position, offset, maxLabelSize, currentValue);
                currentValue += (this.orientation === 'vertical') ? -interval : interval;
                distance += step;
            }
        },

        _renderLabel: function (distance, position, offset, maxLabelSize, currentValue) {
            var param = { 'class': this.toThemeProperty('jqx-gauge-label') },
                interval = this.labels.interval,
                widthDiff, textSize, formatedValue;
            formatedValue = this.labels.formatValue(currentValue, position);
            textSize = this.renderer.measureText(formatedValue, 0, param);
            if (this.orientation === 'vertical') {
                widthDiff = (position === 'near') ? maxLabelSize - textSize.width : 0;
                this.renderer.text(formatedValue, Math.round(offset) + widthDiff - maxLabelSize / 2,
                             Math.round(distance - textSize.height / 2), textSize.width, textSize.height, 0, param);
            } else {
                widthDiff = (position === 'near') ? maxLabelSize - textSize.height : 0;
                this.renderer.text(formatedValue, Math.round(distance - textSize.width / 2),
                             Math.round(offset) + widthDiff - maxLabelSize / 2, textSize.width, textSize.height, 0, param);
            }
        },

        _renderRanges: function () {
            if (!this.showRanges) {
                return;
            }
            var dim = (this.orientation === 'vertical') ? 'width' : 'height',
                offset = this._getSize(this.rangesOffset, dim),
                size = this._getSize(this.rangeSize, dim),
                options;
            for (var i = 0; i < this.ranges.length; i += 1) {
                options = this.ranges[i];
                options.size = size;
                this._renderRange(options, offset);
            }
        },

        _renderRange: function (options, offset) {
            var scaleLength = this._getScaleLength(),
                border = this._getBorderSize(),
                offsetLeft = this._getSize(this.ticksOffset[0], 'width'),
                offsetTop = this._getSize(this.ticksOffset[1], 'height'),
                maxSize = this._getMaxTickSize(),
                size = this._getSize(options.size),
                top = this._valueToCoordinates(options.endValue);
            var startValue = options.startValue;
            if (startValue < this.min) startValue = this.min;
            var height = Math.abs(this._valueToCoordinates(startValue) - top),
                rect, width;
            if (this.orientation === 'vertical') {
                rect = this.renderer.rect(offsetLeft + maxSize + offset - size + border, top, options.size, height, options.style);
            } else {
                width = height;
                rect = this.renderer.rect(this._valueToCoordinates(options.startValue), offsetTop + maxSize + border, width, options.size, options.style);
            }
            this.renderer.attr(rect, options.style);
        },

        _renderPointer: function () {
            if (!this.pointer.visible) {
                return;
            }
            if (this.pointer.pointerType === 'default') {
                this._renderColumnPointer();
            } else {
                this._renderArrowPointer();
            }
        },

        _renderColumnPointer: function () {
            this._pointer = this.renderer.rect(0, 0, 0, 0, this.pointer.style);
            this.renderer.attr(this._pointer, this.pointer.style);
            this._setValue(this.value);
        },

        _renderArrowPointer: function () {
            var path = this._getArrowPathByValue(0);
            this._pointer = this.renderer.path(path, this.pointer.style);
        },

        _renderArrowPointerByValue: function (value) {
            var path = this._getArrowPathByValue(value);
            this._pointer = this.renderer.path(path, this.pointer.style);
        },

        _getArrowPathByValue: function (value) {
            var border = this._getBorderSize(),
                top = Math.ceil(this._valueToCoordinates(value)) + border,
                left = border,
                offsetLeft = Math.ceil(this._getSize(this.ticksOffset[0], 'width')),
                offsetTop = Math.ceil(this._getSize(this.ticksOffset[1], 'height')),
                offset = Math.ceil(this._getSize(this.pointer.offset)),
                maxSize = Math.ceil(this._getMaxTickSize()),
                size = Math.ceil(this._getSize(this.pointer.size)),
                side = Math.ceil(Math.sqrt((size * size) / 3)),
                path, topProjection, temp;
            if (this.orientation === 'vertical') {
                left += offsetLeft + maxSize + offset;
                topProjection = (offset >= 0) ? left + size : left - size;
                path = 'M ' + left + ' ' + top + ' L ' + topProjection + ' ' + (top - side) + ' L ' + topProjection + ' ' + (top + side);
            } else {
                var maxLabelSize = this._getMaxLabelSize()["height"];
                left += offsetLeft + maxSize + offset + maxLabelSize;
                if (this._isVML) {
                    left -= 2;
                }
                temp = top;
                top = left;
                left = temp;
                topProjection = top - size;

                path = 'M ' + left + ' ' + top + ' L ' + (left - side) + ' ' + topProjection + ' L ' + (left + side) + ' ' + topProjection;
            }
            return path;
        },

        _setValue: function (val) {
            if (this.pointer.pointerType === 'default') {
                this._performColumnPointerLayout(val);
            } else {
                this._performArrowPointerLayout(val);
            }
            this.value = val;
        },

        _performColumnPointerLayout: function (val) {
            var bottom = this._valueToCoordinates(this.min),
                top = this._valueToCoordinates(val),
                height = Math.abs(bottom - top),
                border = this._getBorderSize(),
                offsetLeft = this._getSize(this.ticksOffset[0], 'width'),
                offsetTop = this._getSize(this.ticksOffset[1], 'height'),
                maxSize = this._getMaxTickSize(),
                width = this._getSize(this.pointer.size),
                offset = this._getSize(this.pointer.offset),
                attrs = {},
                left;
            if (this.orientation === 'vertical') {
                left = offsetLeft + maxSize;
                attrs = { left: left + offset + 1 + border, top: top, height: height, width: width };
            } else {
                left = offsetTop + maxSize;
                attrs = { left: bottom, top: left + offset - width - 1 + border, height: width, width: height };
            }
            this._setRectAttrs(attrs);
        },

        _performArrowPointerLayout: function (val) {
            var attr = this._getArrowPathByValue(val);
            if (this._isVML) {
                if (this._pointer) {
                    $(this._pointer).remove();
                }
                this._renderArrowPointerByValue(val);
            } else {
                this.renderer.attr(this._pointer, { d: attr });
            }
        },

        _setRectAttrs: function (attrs) {
            if (!this._isVML) {
                this.renderer.attr(this._pointer, { x: attrs.left });
                this.renderer.attr(this._pointer, { y: attrs.top });
                this.renderer.attr(this._pointer, { width: attrs.width });
                this.renderer.attr(this._pointer, { height: attrs.height });
            } else {
                this._pointer.style.top = attrs.top;
                this._pointer.style.left = attrs.left;
                this._pointer.style.width = attrs.width;
                this._pointer.style.height = attrs.height;
            }
        },

        _valueToCoordinates: function (value) {
            var border = this._getBorderSize(),
                scaleLength = this._getScaleLength(),
                offsetLeft = this._getSize(this.ticksOffset[0], 'width'),
                offsetTop = this._getSize(this.ticksOffset[1], 'height'),
                current = Math.abs(this.min - value),
                distance = Math.abs(this.max - this.min);
            if (this.orientation === 'vertical') {
                return this._height - (current / distance) * scaleLength - (this._height - offsetTop - scaleLength) + border;
            }
            return (current / distance) * scaleLength + (this._width - offsetLeft - scaleLength) + border;
        },

        _getSize: function (size, dim) {
            dim = dim || (this.orientation === 'vertical' ? 'width' : 'height');
            if (size.toString().indexOf('%') >= 0) {
                size = (parseInt(size, 10) / 100) * this['_' + dim];
            }
            size = parseInt(size, 10);
            return size;
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (value == oldvalue)
                return;

            if (key == 'min') {
                this.min = parseInt(value);
                $.jqx.aria(this, 'aria-valuemin', value);
            }
            if (key == 'max') {
                this.max = parseInt(value);
                $.jqx.aria(this, 'aria-valuemax', value);
            }
            if (key == 'value') {
                this.value = parseInt(value);
            }

            if (key === 'disabled') {
                if (value) {
                    this.disable();
                } else {
                    this.enable();
                }
                $.jqx.aria(this, 'aria-disabled', value);
            } else if (key === 'value') {
                if (this._timeout != undefined) {
                    clearTimeout(this._timeout);
                    this._timeout = null;
                }
                this.value = oldvalue;
                this.setValue(value);
            } else {
                if (key === 'colorScheme') {
                    this.pointer.style = null;
                } else if (key === 'orientation' && oldvalue !== value) {
                    var temp = this.ticksOffset[0];
                    this.ticksOffset[0] = this.ticksOffset[1];
                    this.ticksOffset[1] = temp;
                }
                if (key !== 'animationDuration' && key !== 'easing') {
                    this.refresh();
                }
            }

            if (this.renderer instanceof $.jqx.HTML5Renderer)
                this.renderer.refresh();
        },

        //Constructor functions for property validation
        _backgroundConstructor: function (background, jqx) {
            if (this.host) {
                return new this._backgroundConstructor(background, jqx);
            }
            var validBackgroundTypes = { rectangle: true, roundedRectangle: true };
            background = background || {};
            this.style = background.style || { stroke: '#cccccc', fill: null };
            if (background.visible || typeof background.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = false;
            }
            if (validBackgroundTypes[background.backgroundType]) {
                this.backgroundType = background.backgroundType;
            } else {
                this.backgroundType = 'roundedRectangle';
            }
            if (this.backgroundType === 'roundedRectangle') {
                if (typeof background.borderRadius === 'number') {
                    this.borderRadius = background.borderRadius;
                } else {
                    this.borderRadius = 15;
                }
            }
            if (typeof background.showGradient === 'undefined') {
                this.showGradient = true;
            } else {
                this.showGradient = background.showGradient;
            }
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.refresh();
        },

        _tickConstructor: function (tick, jqx) {
            if (this.host) {
                return new this._tickConstructor(tick, jqx);
            }
            this.size = jqx._validatePercentage(tick.size, '10%');
            this.interval = parseFloat(tick.interval);
            if (!this.interval) {
                this.interval = 5;
            }
            this.style = tick.style || { stroke: '#A1A1A1', 'stroke-width': '1px' };
            if (typeof tick.visible === 'undefined') {
                this.visible = true;
            } else {
                this.visible = tick.visible;
            }
        },

        _labelsConstructor: function (label, jqx) {
            if (this.host) {
                return new this._labelsConstructor(label, jqx);
            }
            this.position = label.position;
            if (this.position !== 'far' && this.position !== 'near' && this.position !== 'both') {
                this.position = 'both';
            }
            if (typeof label.formatValue === 'function') {
                this.formatValue = label.formatValue;
            } else {
                this.formatValue = function (val) {
                    return val;
                }
            }
            this.visible = label.visible;
            if (this.visible !== false && this.visible !== true) {
                this.visible = true;
            }
            if (typeof label.interval !== 'number') {
                this.interval = 10;
            } else {
                this.interval = label.interval;
            }
            this.offset = jqx._validatePercentage(label.offset, 0);
        },

        _rangeConstructor: function (range, jqx) {
            if (this.host) {
                return new this._rangeConstructor(range, jqx);
            }
            if (typeof range.startValue === 'number') {
                this.startValue = range.startValue;
            } else {
                this.startValue = jqx.min;
            }
            if (typeof range.endValue === 'number' && range.endValue > range.startValue) {
                this.endValue = range.endValue;
            } else {
                this.endValue = this.startValue + 1;
            }
            this.style = range.style || { fill: '#dddddd', stroke: '#dddddd' };
        },

        _pointerConstructor: function (pointer, jqx) {
            if (this.host) {
                return new this._pointerConstructor(pointer, jqx);
            }
            var color = jqx._getColorScheme(jqx.colorScheme)[0];
            this.pointerType = pointer.pointerType;
            if (this.pointerType !== 'default' && this.pointerType !== 'arrow') {
                this.pointerType = 'default';
            }
            this.style = pointer.style || { fill: color, stroke: color, 'stroke-width': 1 };
            this.size = jqx._validatePercentage(pointer.size, '7%');
            this.visible = pointer.visible;
            if (this.visible !== true && this.visible !== false) {
                this.visible = true;
            }
            this.offset = jqx._validatePercentage(pointer.offset, 0);
        }

    };

    //Extending with the common functionality
    $.extend(radialGauge, common);
    $.extend(linearGauge, common);

    //Initializing jqxWidgets
    $.jqx.jqxWidget("jqxLinearGauge", "", {});
    $.jqx.jqxWidget("jqxGauge", "", {});

    //Extending the widgets' prototypes
    $.extend($.jqx._jqxGauge.prototype, radialGauge);
    $.extend($.jqx._jqxLinearGauge.prototype, linearGauge);

})(jQuery);
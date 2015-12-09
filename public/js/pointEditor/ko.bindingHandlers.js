$(function () {
    /***
     * Binding to map correct Enum Value based on eValue
     * @type {{init: Function}}
     */
    ko.bindingHandlers.EnumTextValue = {
        init  : function (element, valueAccessor, allBindingsAccessor) {
            var $app = $('#main'),
                $element = $(element),
                context = ko.contextFor(element),
                allBindings = allBindingsAccessor(),
                id = allBindings.propName.replace(/ /g, ''),
                options = allBindings.options,
                text = valueAccessor();

            allBindings.value.subscribe(function (newValue) {
                var match = ko.utils.arrayFirst(ko.utils.unwrapObservable(options), function (item) {
                    return item.value == newValue;
                });
                !!match && text(match.name);
            });
            $element.attr('id', id);
            $app.on('change', '#' + id, function () {
                pointEditor.changeHandler($element, context, allBindings.propName);
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            // Removed because this binding was causing the eValue to be set to the Value and
            // it isn't always updated from the server

//            var text = valueAccessor(),
//                $element = $(element),
//                allBindings = allBindingsAccessor(),
//                value = allBindings.value,
//                options = ko.utils.unwrapObservable(allBindings.options);//,
//            match = ko.utils.arrayFirst(options, function (item) {
//                return item.name == text();
//            });
//            if (!!match && (match.value != value())) {
//                value(match.value);
//                $element.val(match.value);
//            }
        }
    };

    /***
     * Binding to handle conversion of an integer representing seconds to minutes and seconds
     * @type {{init: Function}}
     */
    ko.bindingHandlers.timeSpan = {
        init  : function (element, valueAccessor, allBindingsAccessor) {
            var $app = $('#main'),
                $element = $(element),
                context = ko.contextFor(element),
                value = valueAccessor(),
                allBindings = allBindingsAccessor(),
                id = allBindings.propName.replace(/ /g, ''),
                noValidate = allBindings.noValidate || false;
            $element.data({'currentRange': 0, 'bindingType': allBindings.type, value: value});
            $element.attr('id', id);
            if (!noValidate) {
                $app.on('focusout', '#' + id, function () {
                    pointEditor.changeHandler($element, context, allBindings.propName);
                });
            }
            $app.on('keydown click mousewheel', '#' + id, pointEditor.timeEventHandler);
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var allBindings = allBindingsAccessor(),
                $element = $(element),
                context = ko.contextFor(element),
                value = ko.utils.unwrapObservable(valueAccessor()),
                hours = ~~(value / 3600),
                minutes = ~~((value % 3600) / 60),
                seconds = value % 60;
            hours = hours > 9 ? hours : "0" + hours;
            minutes = minutes > 9 ? minutes : "0" + minutes;
            seconds = seconds > 9 ? seconds : "0" + seconds;

            $element.is(':input') ? $element.val(hours + ':' + minutes + ':' + seconds) : $element.html(hours + ':' + minutes + ':' + seconds);
        }
    };

    /***
     * Binding to handle conversion of an integer representing UTC seconds to time
     * @type {{init: Function}}
     */
    ko.bindingHandlers.timeT = {
        init  : function (element, valueAccessor, allBindingsAccessor) {
            var $app = $('#main'),
                $element = $(element),
                context = ko.contextFor(element),
                value = valueAccessor(),
                allBindings = allBindingsAccessor(),
                id = allBindings.propName.replace(/ /g, '');
            $element.attr('id', id);
            $app.on('focusout', '#' + id, function () {
                pointEditor.changeHandler($element, context, allBindings.propName);
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var allBindings = allBindingsAccessor(),
                $element = $(element),
                context = ko.contextFor(element),
                value = ko.utils.unwrapObservable(valueAccessor()),
                dateValue = new Date(0),
                formattedDate;

            dateValue.setUTCSeconds(value);
            formattedDate = moment(dateValue).format('MM/DD/YYYY HH:mm:ss');

            $element.is(':input') ? $element.val(formattedDate) : $element.html(formattedDate);
        }
    };

    /***
     * Binding to handle numbers
     * @type {{init: Function}}
     */
    ko.bindingHandlers.number = {
        init  : function (element, valueAccessor, allBindingsAccessor) {
            var $app = $('#main'),
                $element = $(element),
                context = ko.contextFor(element),
                value = valueAccessor(),
                allBindings = allBindingsAccessor(),
                id = allBindings.propName.replace(/ /g, ''),
                validation, mask,
                maskOptions = {showMaskOnHover: false, greedy: false, rightAlignNumerics: false, allowMinus: true};
            switch (allBindings.type()) {
                case 3: //int32Signed
                    mask = 'integer';
                    if (typeof allBindings.min != 'undefined' && typeof allBindings.max != 'undefined') {
                        validation = {min: allBindings.min(), max: allBindings.max()};
                    } else {
                        validation = {number: 'int32Signed'};
                    }
                    break;
                case 4: //int32Unsigned
                    mask = 'integer';
                    maskOptions.allowMinus = false;
                    if (typeof allBindings.min != 'undefined' && typeof allBindings.max != 'undefined') {
                        validation = {min: allBindings.min(), max: allBindings.max()};
                    } else {
                        validation = {number: 'int32Unsigned'};
                    }
                    break;
                case 11://timet
                    mask = 'integer';
                    maskOptions.allowMinus = false;
                    validation = {number: 'int32Unsigned'};
                    break;
                case 18://bitstring
                    mask = 'integer';
                    maskOptions.allowMinus = false;
                    validation = {number: 'int32Unsigned'};
                    break;
                default: // 1 = float
                    mask = 'decimal';
                    maskOptions.skipRadixDance = true;
                    if (typeof allBindings.min != 'undefined' && typeof allBindings.max != 'undefined') {
                        validation = {min: allBindings.min(), max: allBindings.max()};
                    } else {
                        validation = {number: 'float'};
                    }
            }
            //value.extend(validation);
            $element.attr('id', id);
            //value(pointEditor.convertExpo(value()));
            //$element.inputmask(mask, maskOptions);
            $app.on('focusout', '#' + id, function () {
                value(parseFloat($element.val()));
                pointEditor.changeHandler($element, context, allBindings.propName);
            });
            $app.on('click', '#' + id, function () {
                $element.setSelection(0, $element.val().length);
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var allBindings = allBindingsAccessor(),
                $element = $(element),
                value = ko.utils.unwrapObservable(valueAccessor());

            $element.is(':input') ? $element.val(value) : $element.html(value);
        }
    };

    /***
     * Binding to handle ip addresses
     * @type {{init: Function}}
     */
    ko.bindingHandlers.ip = {
        init  : function (element, valueAccessor, allBindingsAccessor) {
            var $app = $('#main'),
                $element = $(element),
                context = ko.contextFor(element),
                value = valueAccessor(),
                allBindings = allBindingsAccessor(),
                id = allBindings.propName.replace(/ /g, '');
            value.extend({ipAddress: true});
            $element.attr('id', id);
            $element.inputmask(allBindings.mask, {
                showMaskOnHover: false,
                greedy         : false
            });
            $app.on('focusout', '#' + id, function () {
                value($element.val());
                pointEditor.changeHandler($element, context, allBindings.propName);
            });
            $app.on('click', '#' + id, function () {
                $element.setSelection(0, $element.val().length);
            });
            //$app.on('keyup click mousewheel', '#' + allBindings.id, ipEventHandler);
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            var allBindings = allBindingsAccessor(),
                $element = $(element),
                context = ko.contextFor(element),
                value = ko.utils.unwrapObservable(valueAccessor());
            $element.is(':input') ? $element.val(value) : $element.html(value);
        }
    };

    /***
     * Binding to mouse and keyboard-enable number fields
     * @type {{init: Function}}
     */
    ko.bindingHandlers.numberKMEnable = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var $app = $('#main'),
                $element = $(element),
                allBindings = allBindingsAccessor(),
                id = allBindings.propName.replace(/ /g, '');
            $element.data({value: allBindings.value});
            $element.attr('id', id);
            $app.on('keydown mousewheel', '#' + id, pointEditor.numberEventHandler);
        }
    };

    /***
     * Binding to handle derived point selection
     * @type {{init: Function}}
     */
    ko.bindingHandlers.point = {
        init  : function (element, valueAccessor, allBindingsAccessor, viewModel/*deprecated 3.0*/, context) {
            var $app = $('#main'),
                $element = $(element),
                value = valueAccessor(),
                propertyName = context.$data.PropertyName(),
                id = 'id_' + pointEditor.utility.createUniqueId(),
                //id = propertyName.replace(/ /g, ''),
                btnSelectSelector = ['#', id, ' .selectPoint'].join(''),
                btnRemoveSelector = ['#', id, ' .removePoint'].join(''),
                _pointSelectorEndPoint = ['/pointlookup/', encodeURI(context.$root.data['Point Type'].Value()), '/', encodeURI(propertyName), '?mode=select'].join('');
            $element.attr('id', id);
            $app.off('click', btnSelectSelector).on('click', btnSelectSelector, function (e) {
                var callback = function (pid, name) {
                        if (!!pid) {
                            pointEditor.getPoint(pid).done(
                                function (data) {
                                    context.refPoint = data;
                                    context.$data.PointName(name);
                                    console.log("CONTEXT3", context.$index());
                                    value(pid);
                                    pointEditor.changeHandler($element, context, context.$index());
                                }
                            );
                        }
                    },
                    workspaceManager = pointEditor.utility.workspace,
                    win = workspaceManager.openWindowPositioned(_pointSelectorEndPoint, 'Point Selector', 'pointSelector', '', 'pointSelector' + context.$root.data._id(),
                        {
                            width: 980,
                            height: 550,
                            callback: function() {
                                win.pointLookup.init(callback);
                            }
                        }
                    );
            });
            $app.off('click', btnRemoveSelector).on('click', btnRemoveSelector, function (e) {
                context.$data.PointName('');
                value(0);
                pointEditor.changeHandler($element, context, context.$index());
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel/*deprecated 3.0*/, context) {
            var allBindings = allBindingsAccessor(),
                $element = $(element),
                $removeButton = $element.find('.removePoint'),
                value = valueAccessor();
            if (!!value()) {
                $removeButton.show();
            } else {
                context.$data.PointName('');
                $removeButton.hide();
            }
        }
    };
//    ko.bindingHandlers.point = {
//        init  : function (element, valueAccessor, allBindingsAccessor) {
//            var $app = $('#main'),
//                $element = $(element),
//                context = ko.contextFor(element),
//                $pointName = $element.find('span'),
//                value = valueAccessor(),
//                allBindings = allBindingsAccessor(),
//                id = allBindings.propName.replace(/ /g, ''),
//                $selectButton = $element.find('.selectPoint'),
//                _pointSelectorEndPoint = '/pointselector/editor/' + encodeURI(context.$root.data['Point Type'].Value()) + '/' + encodeURI(allBindings.propName),
//                openWindow = window.opener && window.opener.workspaceManager && window.opener.workspaceManager.openWindow;
//            $element.attr('id', id);
//            $app.on('click', '#' + id + ' .selectPoint', function (e) {
//                var callback = function (pid, name) {
//                        if (!!pid) {
//                            pointEditor.getPoint(pid).done(
//                                function (data) {
//                                    context.refPoint = data;
//                                    context.$data.prop.PointName(name);
//                                    value(pid);
//                                    pointEditor.changeHandler($element, context, allBindings.propName);
//                                }
//                            );
//                        }
//                    },
//                    win = openWindow(_pointSelectorEndPoint, 'Point Selector', 'pointSelector', '', 'pointSelector' + context.$root.data._id(), 800, 550);
//                    pointEditor.utility.addEvent(win, 'load', function() {
//                        win.dorsett.pointSelector.init(callback);
//                    });
//            });
//            $app.on('click', '#' + id + ' .removePoint', function (e) {
//                context.$data.prop.PointName('');
//                value(0);
//                pointEditor.changeHandler($element, context, allBindings.propName);
//            });
//        },
//        update: function (element, valueAccessor, allBindingsAccessor) {
//            var allBindings = allBindingsAccessor(),
//                $element = $(element),
//                context = ko.contextFor(element),
//                $removeButton = $element.find('.removePoint'),
//                value = valueAccessor();
//            if (!!value()) {
//                $removeButton.show();
//            } else {
//                $removeButton.hide();
//            }
//        }
//    };

    /***
     * For numeric only fields
     * @param isFloat - Boolean, true if is a floating point number,
     * Otherwise is an integer
     * @param isSigned - Boolean, true is a 32 bit signed integer,
     * Otherwise unsigned
     * @returns {*}
     */
    ko.observable.fn.numeric = function (isFloat, isSigned) {
        return ko.computed({
            read : function () {
                return this();
            },
            write: function (value) {
                var observable = this;
                value = value + '';
                // Strip out unwanted characters, parse as float or int
                value = parseFloat(value.replace(/[^\.\d\-]/g, "")).toFixed(2);
                if (!isFloat) {
                    value = Math.round(value);
                    if (isSigned) {
                        value > 2147483647 && (value = 2147483647);
                        value < -2147483648 && (value = -2147483648);
                    } else {
                        value < 0 && (value = 0);
                        value > 4294967295 && (value = 4294967295);
                    }
                }
                observable(isNaN(value) ? 0 : value); // Write to underlying storage
                observable.valueHasMutated();
            }
        }, this);
    };

    pointEditor.changeHandler = function ($element, context, property) {
        if (!($element instanceof jQuery)) $element = $($element);
        var vm = context.$root,
            point = {point: ko.viewmodel.toModel(vm.data), property: property, refPoint: context.refPoint, oldPoint: vm.originalData},
            updatedPoint,
            config = pointEditor.utility.config;
        console.log(point);
        updatedPoint = config.Update.formatPoint(point);
        if (!!updatedPoint.err) {
            //set property back to original value
            $element.effect('highlight', {color: '#ffff99'}, 2500);
            if (typeof property == 'number') {
                vm.data['Point Refs']()[property].Value(vm.originalData['Point Refs'][property].Value);
                vm.data['Point Refs']()[property].PointName(vm.originalData['Point Refs'][property].PointName);
                //display message from config.format call
                bannerJS.showBanner(updatedPoint.err + ' The ' + vm.data['Point Refs']()[property].PropertyName() + ' has been set back to its original value.', 'Dismiss');
            } else {
                vm.data[property].Value(vm.originalData[property].Value);
                //display message from config.format call
                bannerJS.showBanner(updatedPoint.err + ' The ' + property + ' has been set back to its original value.', 'Dismiss');
            }
        } else {
            ko.viewmodel.updateFromModel(pointEditor.point.data, updatedPoint);
        }
    };

    pointEditor.numberEventHandler = function (e, delta) {
        var handled, keyCode,
            $element = $(e.target),
            value = $element.data('value');
        if ($element.is(':focus') && e.type == 'mousewheel') {
            var dir = delta > 0 ? 'Up' : 'Down',
                velocity = Math.abs(delta);
            if (dir == 'Up') {
                value(value() + 1);
            } else {
                value(value() - 1);
            }
            return false;
        }

        keyCode = e.keyCode;
        handled = true;
        switch (keyCode) {
            case 33:
                //page up
                value(value() + 10);
                break;
            case 34:
                //page down
                value(value() - 10);
                break;
            case 37:
                //arrow left
                break;
            case 38:
                //arrow up
                value(value() + 1);
                break;
            case 39:
                //arrow right
                break;
            case 40:
                //arrow down
                value(value() - 1);
                break;
            default:
                handled = false;
        }
        return !handled;
    };

    pointEditor.timeEventHandler = function (e, delta) {
        var handled, keyCode, newDate,
            $element = $(e.target),
            bindingType = $element.data('bindingType'),
            value = $element.data('value'),
            nextHr = function () {
                value(value() + (60 * 60));
            },
            previousHr = function () {
                value(value() - (60 * 60));
            },
            nextMin = function () {
                value(value() + 60);
            },
            previousMin = function () {
                value(value() - 60);
            },
            nextSec = function () {
                value(value() + 1);
            },
            previousSec = function () {
                value(value() - 1);
            },
            range, position, maxValue, minValue,
            hourRange = {start: 0, end: 2, next: nextHr, prev: previousHr},
            minRange = {start: 3, end: 5, next: nextMin, prev: previousMin},
            secRange = {start: 6, end: 8, next: nextSec, prev: previousSec},
            rangeCycle = [],
            currentRange = function (incrementBy) {
                var thisRange = $element.data('currentRange');
                if (typeof incrementBy !== 'number') return thisRange;
                thisRange = thisRange + incrementBy;
                if (thisRange < 0) {
                    thisRange = rangeCycle.length - 1;
                } else if (thisRange > rangeCycle.length - 1) {
                    thisRange = 0;
                }
                $element.data('currentRange', thisRange);
                return thisRange;
            };

        switch (bindingType) {
            case 'minSec':
                minValue = 0;
                maxValue = 3599;
                rangeCycle.push(minRange, secRange);
                break;
            case 'hrMinSec':
                minValue = 0;
                maxValue = 86399;
                rangeCycle.push(hourRange, minRange, secRange);
                break;
            case 'hrMin':
                minValue = 0;
                maxValue = 86340;
                rangeCycle.push(hourRange, minRange);
                break;
        }
        //if we don't have an event, let's highlight the current range
        //and abandon the call
        if (!e) {
            var input = this.input;
            setTimeout(function () {
                range = rangeCycle[currentRange(0)];
                $element.setSelection(range.start, range.end);
            }, 100);
            return true;
        }

        if (e.type == 'click') {
            //get the place where they clicked
            position = $element.getSelection();
            //now find the range we want to highlight
            for (var i = 0; i < rangeCycle.length; i++) {
                if (position.start >= rangeCycle[i].start && position.start <= rangeCycle[i].end) {
                    range = rangeCycle[i];
                    $element.data('currentRange', i);
                    break;
                }
            }
            if (typeof range == 'undefined') {
                range = rangeCycle[currentRange()];
            }
            setTimeout(function () {
                $element.setSelection(range.start, range.end);
            }, 50);
            return true;
        }
        if ($element.is(':focus') && e.type == 'mousewheel') {
            var dir = delta > 0 ? 'Up' : 'Down',
                velocity = Math.abs(delta);
            range = rangeCycle[currentRange()];
            if (dir == 'Up') {
                range.next();
                if (value() > maxValue) value(maxValue);
                $element.setSelection(range.start, range.end);
            } else {
                range.prev();
                if (value() < minValue) value(minValue);
                $element.setSelection(range.start, range.end);
            }
            return false;
        }

        keyCode = e.keyCode;
        handled = true;
        switch (keyCode) {
            case 33:
                //page up
                break;
            case 34:
                //page down
                break;
            case 37:
                //arrow left
                //move to previous range
                range = rangeCycle[currentRange(-1)];
                $element.setSelection(range.start, range.end);
                break;
            case 38:
                //arrow up
                range = rangeCycle[currentRange()];
                range.next();
                if (value() > maxValue) value(maxValue);
                $element.setSelection(range.start, range.end);
                break;
            case 39:
                //arrow right
                //move to next range
                range = rangeCycle[currentRange(1)];
                $element.setSelection(range.start, range.end);
                break;
            case 40:
                //arrow down
                range = rangeCycle[currentRange()];
                range.prev();
                if (value() < minValue) value(minValue);
                $element.setSelection(range.start, range.end);
                break;
            default:
                handled = false;
        }
        return !handled;
    };

    pointEditor.convertExpo = function(number){
        var data= String(number).split(/[eE]/);
        if(data.length== 1) return data[0];

        var  z= '', sign= number<0? '-':'',
            str= data[0].replace('.', ''),
            mag= Number(data[1])+ 1;

        if(mag<0){
            z= sign + '0.';
            while(mag++) z += '0';
            return z + str.replace(/^\-/,'');
        }
        mag -= str.length;
        while(mag--) z += '0';
        return str + z;
    };

    var ipEventHandler = function (e, delta) {
        var keyCode,
            $element = $(e.target),
            bindingType = $element.data('bindingType'),
            observable = $element.data('value'),
            value = $.trim(observable()),
            range, segment, segments, segmentStart, segmentEnd, position, i,
            maxValue = 255,
            minValue = 0,
            rangeCycle = [],
            currentRange = function (incrementBy) {
                var thisRange = $element.data('currentRange');
                if (typeof incrementBy !== 'number') return thisRange;
                thisRange = thisRange + incrementBy;
                if (thisRange < 0) {
                    thisRange = rangeCycle.length - 1;
                } else if (thisRange > rangeCycle.length - 1) {
                    thisRange = 0;
                }
                $element.data('currentRange', thisRange);
                return thisRange;
            },
            toString = function () {
                return function () {
                    return this.value;
                }
            };

        if (value == '') value = '0.0.0.0';

        segments = value.split('.');
        if (segments.length != 4) {
            value = '0.0.0.0';
            segments = value.split('.');
        }
        segmentStart = 0;
        segmentEnd = segments[0].length;
        for (i = 0; i < 4; i++) {
            //ip['octet' + i] = {value: segments[i], start: segmentStart, end: segmentEnd};
            segments[i] = parseInt(segments[i], 10);
            rangeCycle.push({value: segments[i], start: segmentStart, end: segmentEnd, toString: toString()});
            segmentStart = segmentEnd + 1;
            segments[i + 1] && (segmentEnd = segmentStart + segments[i + 1].length);
        }

        //if we don't have an event, let's highlight the current range
        //and abandon the call
        if (!e) {
            var input = this.input;
            setTimeout(function () {
                range = rangeCycle[currentRange(0)];
                $element.setSelection(range.start, range.end);
            }, 100);
            return true;
        }

        if (e.type == 'click') {
            //get the place where they clicked
            position = $element.getSelection();
            //now find the range we want to highlight
            for (var i = 0; i < rangeCycle.length; i++) {
                if (position.start >= rangeCycle[i].start && position.start <= rangeCycle[i].end) {
                    range = rangeCycle[i];
                    $element.data('currentRange', i);
                    break;
                }
            }
            if (typeof range == 'undefined') {
                range = rangeCycle[currentRange()];
            }

            setTimeout(function () {
                $element.setSelection(range.start, range.end);
            }, 50);
            return true;
        }
        if ($element.is(':focus') && e.type == 'mousewheel') {
            var dir = delta > 0 ? 'Up' : 'Down',
                velocity = Math.abs(delta);
            range = rangeCycle[currentRange()];
            if (dir == 'Up') {
                range.value += 1;
                if (range.value > maxValue) range.value = maxValue;
            } else {
                range.value -= 1;
                if (range.value < minValue) range.value = minValue;
            }
            observable(rangeCycle.join('.'));
            $element.setSelection(range.start, range.end);
            return false;
        }

        keyCode = e.keyCode;
        switch (keyCode) {
            case 33:
                //page up
                break;
            case 34:
                //page down
                break;
            case 37:
                //arrow left
                //move to previous range
                range = rangeCycle[currentRange(-1)];
                break;
            case 38:
                //arrow up
                range = rangeCycle[currentRange()];
                range.value += 1;
                if (range.value > maxValue) range.value = maxValue;
                break;
            case 39:
                //arrow right
                //move to next range
                range = rangeCycle[currentRange(1)];
                break;
            case 40:
                //arrow down
                range = rangeCycle[currentRange()];
                range.value -= 1;
                if (range.value < minValue) range.value = minValue;
                break;
            default:
                return true;
        }
        observable(rangeCycle.join('.'));
        $element.setSelection(range.start, range.end);
        return false;
    };

    /***
     * Custom validator for ip addresses
     * @type {{}}
     */
    ko.validation.rules['ipAddress'] = {
        validator: function (val, validate) {
            return val === null || val === "" || (validate && /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test($.trim(val.toString())));
        },
        message  : 'Invalid IP Address'
    };

    /***
     * Custom validator for numbers
     * @type {{}}
     */
    ko.validation.rules['number'] = {
        validator: function (val, type) {
            var number;
            if (val === null || val === "") return true;
            switch (type) {
                case 'int32signed':
                    number = parseInt(val, 10);
                    if (number < -2147483648) {
                        this.message = 'Value too low'
                        return false;
                    }
                    if (number > 2147483647) {
                        this.message = 'Value too high'
                        return false;
                    }
                    return true;
                case 'int32Unsigned':
                    number = parseInt(val, 10);
                    if (number < 0) {
                        this.message = 'Value too low'
                        return false;
                    }
                    if (number > 4294967295) {
                        this.message = 'Value too high'
                        return false;
                    }
                    return true;
                default:
                    return $.isNumeric(val);
            }
        },
        message  : 'Invalid value'
    };
});

define(['knockout', 'text!./view.html'], function(ko, view) {

    ko.bindingHandlers.duration = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            var $element = $(element),
                $hr = $element.find('.hr'),
                $min = $element.find('.min'),
                $sec = $element.find('.sec'),
                context = ko.contextFor(element),
                value = valueAccessor(),
                bindingType = context.$data.data.ValueType(),
                nextHr = function() {
                    value(value() + (60 * 60));
                },
                previousHr = function() {
                    value(value() - (60 * 60));
                },
                nextMin = function() {
                    value(value() + 60);
                },
                previousMin = function() {
                    value(value() - 60);
                },
                nextSec = function() {
                    value(value() + 1);
                },
                previousSec = function() {
                    value(value() - 1);
                },
                maxValue = ko.unwrap(allBindingsAccessor().max),
                minValue = ko.unwrap(allBindingsAccessor().min),
                noConfigValidation = ko.unwrap(allBindingsAccessor().noValidation),
                hourCfg = {
                    $field: $hr,
                    next: nextHr,
                    prev: previousHr
                },
                minCfg = {
                    $field: $min,
                    next: nextMin,
                    prev: previousMin
                },
                secCfg = {
                    $field: $sec,
                    next: nextSec,
                    prev: previousSec
                },
                currentCfg = 0,
                fieldCycle = [],
                _currentCfgIndex = -1,
                currentField = function(fieldIndexOrObj) {
                    var thisCfg = parseInt(_currentCfgIndex, 10);
                    if (typeof fieldIndexOrObj == 'undefined') {
                        return thisCfg;
                    } else if (typeof fieldIndexOrObj != 'number') {
                        for (var cfg in fieldCycle) {
                            if (fieldCycle[cfg].$field.is(fieldIndexOrObj)) {
                                thisCfg = cfg;
                                break;
                            }
                        }
                    } else {
                        thisCfg += fieldIndexOrObj;
                        if (thisCfg < 0) {
                            thisCfg = fieldCycle.length - 1;
                        } else
                        if (thisCfg > fieldCycle.length - 1) {
                            thisCfg = 0;
                        }
                    }
                    _currentCfgIndex = thisCfg;
                    return thisCfg;
                };
            switch (bindingType) {
                case 12: //hrMinSec
                    minValue = minValue || 0;
                    maxValue = maxValue || 86399;
                    fieldCycle.push(hourCfg, minCfg, secCfg);
                    break;
                case 13: //minSec
                    minValue = minValue || 0;
                    maxValue = maxValue || 3599;
                    fieldCycle.push(minCfg, secCfg);
                    $hr.next('.timeSeg').andSelf().hide();
                    break;
                case 17: //hrMin
                    minValue = minValue || 0;
                    maxValue = maxValue || 86340;
                    fieldCycle.push(hourCfg, minCfg);
                    $sec.next('.timeSeg').andSelf().hide();
                    break;
            }

            if (!$element.is('.durationCtrl')) return;
            $element
                .on('keydown', function(e) {
                    var $element,
                        endpoint,
                        selectionStart = 0,
                        selectionEnd;

                    // If currentField is not initialized - this happens when the user tabs or shift-tabs into an input. The result
                    // used to be that if they shift-tabbed into the minute portion of an hr-min input, when they keyed up or down,
                    // the hr portion incremented (because currentField was 0). So now it will operate correctly
                    if (currentField() == -1) {
                        currentField($(e.target)); // Init our current field
                    }

                    if (e.keyCode === 9) { // tab
                        if (e.shiftKey) {
                            e.keyCode = 37; // simulate arrow left
                            endpoint = 0;
                        } else {
                            e.keyCode = 39; // simulate arrow right
                            endpoint = fieldCycle.length - 1;
                        }

                        if (currentField() === endpoint) {
                            return; // Do not process tab key here (use native tab function)
                        } else {
                            e.preventDefault(); // Process tab key here and stop native tab function
                        }
                    }

                    switch (e.keyCode) {
                        case 33:
                            //page up
                            break;
                        case 34:
                            //page down
                            break;
                        case 37:
                            //arrow left
                            //move to previous field
                            currentCfg = fieldCycle[currentField(-1)];
                            $element = currentCfg.$field;
                            selectionEnd = $element.val().length;
                            createSelection($element[0], selectionStart, selectionEnd);
                            break;
                        case 38:
                            //arrow up
                            currentCfg = fieldCycle[currentField()];
                            currentCfg.next();
                            if (value() > maxValue) value(maxValue);
                            $element = currentCfg.$field;
                            selectionEnd = $element.val().length;
                            createSelection($element[0], selectionStart, selectionEnd);
                            break;
                        case 39:
                            //arrow right
                            //move to next field
                            currentCfg = fieldCycle[currentField(1)];
                            $element = currentCfg.$field;
                            selectionEnd = $element.val().length;
                            createSelection($element[0], selectionStart, selectionEnd);
                            break;
                        case 40:
                            //arrow down
                            currentCfg = fieldCycle[currentField()];
                            currentCfg.prev();
                            if (value() < minValue) value(minValue);
                            $element = currentCfg.$field;
                            selectionEnd = $element.val().length;
                            createSelection($element[0], selectionStart, selectionEnd);
                            break;
                        default:
                            currentCfg = fieldCycle[currentField()];
                    }
                })
                .on('mousewheel', function(event, trigger) {
                    var $element,
                        delta,
                        direction,
                        selectionStart = 0,
                        selectionEnd;
                    if (typeof trigger.deltaY == 'number') {
                        event = trigger;
                    }
                    delta = event.deltaY;
                    direction = delta > 0 ? 'Up' : 'Down';
                    currentCfg = fieldCycle[currentField()];
                    $element = currentCfg.$field;
                    selectionEnd = $element.val().length;
                    if (!$element.is(':focus')) {
                        return;
                    } else {
                        event.preventDefault();
                    }
                    if (direction == 'Up') {
                        currentCfg.next();
                        if (value() > maxValue) value(maxValue);
                    } else {
                        currentCfg.prev();
                        if (value() < minValue) value(minValue);
                    }
                    createSelection($element[0], selectionStart, selectionEnd);
                })
                .on('click', function(event) {
                    var $element,
                        selectionStart = 0,
                        selectionEnd,
                        elements = {
                            dom: [],
                            proximities: []
                        },
                        minProximity;

                    for (var i in fieldCycle) {
                        elements.dom.push(fieldCycle[i].$field);
                        elements.proximities.push(calculateDistance(fieldCycle[i].$field, event.pageX, event.pageY));
                    }
                    minProximity = Math.min.apply(Math, elements.proximities);
                    $element = elements.dom[elements.proximities.indexOf(minProximity)];
                    currentField($element);
                    selectionEnd = $element.val().length;
                    $element.focus();
                    createSelection($element[0], selectionStart, selectionEnd);
                })
                .on('focusin', function() {
                    $(this).addClass('focused');
                })
                .on('focusout', function() {
                    var hr = parseInt($hr.val(), 10),
                        min = parseInt($min.val(), 10),
                        sec = parseInt($sec.val(), 10),
                        time = (hr * 3600) + (min * 60) + sec;

                    $(this).removeClass('focused');
                    if (time < minValue) {
                        value(minValue);
                    } else if (time > maxValue) {
                        value(maxValue);
                    } else {
                        value(time);
                    }
                    value.valueHasMutated();
                    if (!!noConfigValidation) return;
                    $(document).triggerHandler({
                        type: 'viewmodelChange',
                        targetElement: $element,
                        property: context.$data.propertyName,
                        refPoint: null
                    });
                });
        },
        update: function(element, valueAccessor) {
            var $element = $(element),
                $hr = $element.find('.hr'),
                $min = $element.find('.min'),
                $sec = $element.find('.sec'),
                value = ko.utils.unwrapObservable(valueAccessor()),
                hours = ~~(value / 3600),
                minutes = ~~((value % 3600) / 60),
                seconds = value % 60;

            hours = hours > 9 ? hours : "0" + hours;
            minutes = minutes > 9 ? minutes : "0" + minutes;
            seconds = seconds > 9 ? seconds : "0" + seconds;

            $hr.is('input') ? $hr.val(hours) : $hr.html(hours + ' <span class="timeSeg">hr</span>');
            $min.is('input') ? $min.val(minutes) : $min.html(minutes + ' <span class="timeSeg">min</span>');
            $sec.is('input') ? $sec.val(seconds) : $sec.html(seconds + ' <span class="timeSeg">sec</span>');
        }
    };

    function calculateDistance(elem, mouseX, mouseY) {
        return Math.floor(Math.sqrt(Math.pow(mouseX - (elem.offset().left + (elem.width() / 2)), 2) + Math.pow(mouseY - (elem.offset().top + (elem.height() / 2)), 2)));
    }

    function createSelection(input, start, end) {
        if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(start, end);
        } else if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    }

    function getSelectionStart(input) {
        if (typeof input.selectionStart == 'number') {
            return input.selectionStart
        } else if (input.createTextRange) {
            var range;
            input.focus();
            range = document.selection.createRange().duplicate();
            range.moveEnd('character', input.value.length);
            if (range.text == '') return input.value.length;
            return input.value.lastIndexOf(range.text);
        } else {
            return 0;
        }
    }

    function getSelectionEnd(input) {
        if (typeof input.selectionEnd == 'number') {
            return input.selectionEnd
        } else if (input.createTextRange) {
            var range;
            input.focus();
            range = document.selection.createRange().duplicate();
            range.moveStart('character', -input.value.length);
            if (range.text == '') return input.value.length;
            return input.value.lastIndexOf(range.text);
        } else {
            return 0;
        }
    }

    function ViewModel(params) {
        var segments = [];
        this.showLabel = (params.hasOwnProperty('showLabel')) ? params.showLabel : true;
        this.naked = params.naked;
        this.columnClasses = params.columnClasses;
        this.readOnlyText = (!!params.readOnlyText) ? params.readOnlyText : "lh30";
        this.propertyName = params.propertyName;
        this.data = params.data[this.propertyName];
        this.min = params.min;
        this.max = params.max;
        this.noValidation = params.noValidation;
        this.isInEditMode = params.rootContext.isInEditMode;
        this.forceEdit = params.forceEdit || false;

        if (typeof this.min != 'undefined') {
            segments = this.min.split(':');
            this.min = (segments[0] * 60 * 60) + (segments[1] * 60) + parseInt(segments[2], 10);
        }
        if (typeof this.max != 'undefined') {
            segments = this.max.split(':');
            this.max = (segments[0] * 60 * 60) + (segments[1] * 60) + parseInt(segments[2], 10);
        }
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.doSomething = function() {

    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {

    };

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
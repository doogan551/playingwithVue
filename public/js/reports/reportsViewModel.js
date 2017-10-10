"use strict";

var dtiReporting = {
    settings: {
        logLinePrefix: true,
        webEndpoint: window.location.origin,
        socketEndPoint: window.location.origin,
        apiEndpoint: window.location.origin + '/api/',
        idxPrefix: 'reports_'
    },
    utility: {
        getTemplate: function (id) {
            var markup = $(id).html();

            return $(markup);
        }
    },
    itemIdx: 0,
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
            formattedtime = dtiReporting.formatDate(new Date(), true);

        if (dtiReporting.settings.logLinePrefix === true) {
            err = new Error();
            if (Error.captureStackTrace) {
                Error.captureStackTrace(err);

                stack = err.stack.split('\n')[2];

                steps = stack.split(':');

                lineNumber = steps[2];

                args.unshift('line:' + pad(lineNumber), formattedtime);
            }
        }
        // args.unshift(formattedtime);
        if (!dtiReporting.noLog) {
            console.log.apply(console, args);
        }
    },
    makeId: function () {
        dtiReporting.itemIdx++;
        return dtiReporting.settings.idxPrefix + dtiReporting.itemIdx;
    },
    getLastId: function () {
        return dtiReporting.settings.idxPrefix + dtiReporting.itemIdx;
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
    pickatime: function ($inputEl, config) {
        var defaults = {
                default: '',           // default time, 'now' or '13:14' e.g.
                fromnow: 0,            // set default time to * milliseconds from now
                donetext: 'Done',      // done button text
                autoclose: true,       // auto close when minute is selected
                ampmclickable: false,  // set am/pm button on itself
                darktheme: false,      // set to dark theme
                twelvehour: false,     // 12 hour AM/PM clock or 24 hour; TODO - this should come from a system setting
                vibrate: true,         // vibrate the device when dragging clock hand
                container: ''          // default will append clock next to input
            },
            options = $.extend(defaults, config);

        $inputEl.pickatime(options);
    },
    autosuggest: {
        init: function () {

        },
        Autosuggest: function (config) {
            // config:
            // {
            //     $inputElement: $element,
            //     $resultsContainer: $element,
            //     $chips: $element, // Materialize chips $ element - ONLY if the autosuggest is on an input with materialize chips installed
            //     sources: [{
            //         data: [array of suggestion strings],
            //         name: 'name of data source',
            //         nameShown: bool (show name header before suggestion results)
            //         * async data sources will require additional info TBD
            //     }, {...}],
            //     see 'defaults' object below for additional options
            // }

            var self = this,
                defaults = {
                    highlight: true, // If true, when suggestions are rendered, pattern matches for the current query in text nodes will be wrapped in a strong element with its class set to {{classNames.highlight}}
                    minLength: 0, // The minimum character length needed before suggestions start getting rendered
                    classNames: {
                        highlight: 'autosuggestHighlight',  // Added to the element that wraps highlighted text
                        match: 'autosuggestMatch',          // Added to suggestion elements in the suggestion container
                        selected: 'autosuggestSelected',    // Added to selected suggestion elements
                        header: 'autosuggestHeader',        // Added to suggestion source header (if shown)
                        container: 'autosuggestContainer'   // Added to suggestion container
                    },
                    autoselect: false, // If nothing selected, autoselect the first suggestion when autosuggest renders or the suggestions change
                    showOnFocus: false, // Show suggestions when input is focused
                    enterOnBlur: false, // Simulate 'Enter' when the the input loses focus (only applicable if $chips is installed)
                    persistAfterSelect: false,
                    chainCharacter: '.' // Delimiter character used to separate links in an object chain
                },
                cfg = $.extend(defaults, config),
                selectors = (function () {
                    var obj = {};

                    dtiReporting.forEach(cfg.classNames, function (cssClass, name) {
                        obj[name] = '.' + cssClass;
                    });

                    return obj;
                })(),
                operatorsRegex = new RegExp('[<>]=|!=|<>|>|<|=|:'),
                $markup,
                $container,
                scrollTo = function ($target) {
                    if (!$target || !$target.length) {
                        return $target;
                    }

                    var topOffset = $target.position().top,
                        doScroll = false;

                    if (topOffset < 0) {
                        doScroll = true;
                    } else {
                        topOffset = (topOffset + $target.height()) - $container.height();

                        if (topOffset > 0) {
                            doScroll = true;
                        }
                    }

                    if (doScroll) {
                        $container.scrollTop($container.scrollTop() + topOffset);
                    }

                    return $target;
                },
                sortArray = function (arr) {
                    arr.sort(function (a, b) {
                        return a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1;
                    });
                },
                getOperator = function (str) {
                    var operator = str.match(operatorsRegex);

                    return operator && operator[0];
                },
                parse = function (str) {
                    var beginningWhitespaceRegex = /^\s*/,
                        parsed = {
                            expression: str,
                            isEquation: false,
                            isInvalid: false,
                            operator: getOperator(str),
                            value: null
                        },
                        equationParts,
                        i;

                    if (parsed.operator) {
                        parsed.isEquation = true;
                        equationParts = str.split(parsed.operator);
                        parsed.expression = equationParts[0].trim();
                        parsed.value = equationParts[1].replace(beginningWhitespaceRegex, '');

                        if (parsed.expression.length === 0) {
                            parsed.isEquation = false;
                            parsed.value = null;
                            parsed.operator = null;
                            parsed.expression = str;
                        } else if (equationParts.length > 2) {
                            parsed.isInvalid = true;
                            // Our 'value' term is incomplete - finish it out
                            i = 2;
                            do {
                                parsed.value += equationParts[i++];
                            } while (i < parsed.expression.length);
                        } else if (parsed.expression.match(operatorsRegex) || parsed.value.match(operatorsRegex)) {
                            parsed.isInvalid = true;
                        }
                    }

                    return parsed;
                },
                getMatches = function (inputValue) {
                    var regex = new RegExp(inputValue, 'ig'),
                        totalMatches = 0,
                        parsed,
                        matches,
                        data,
                        chain,
                        stopIndex;

                    dtiReporting.forEachArray(self.bindings.sources(), function (source) {
                        matches = [];
                        data = source.data;

                        if (Array.isArray(data)) {
                            dtiReporting.forEachArray(data, function (item) {
                                if (regex.test(item.text)) {
                                    if (cfg.highlight) {
                                        item.html(item.text.replace(regex, ['<span class="', cfg.classNames.highlight, '">', '$&', '</span>'].join('')));
                                    }
                                    matches.push(item);
                                }
                            });
                        } else { // Must be an object
                            parsed = parse(inputValue);

                            // If our search includes a chain character
                            if (!!~parsed.expression.indexOf(cfg.chainCharacter)) {
                                chain = parsed.expression.split(cfg.chainCharacter);

                                if (parsed.operator) {
                                    stopIndex = chain.length - 1;
                                } else {
                                    stopIndex = chain.length - 2;
                                    // Ex: Part1.Sub2.stillWorkingOnThisOne
                                    // We want to stop on 'Sub2' so we get all of Sub2's available keys and match against string 'stillWorkingOnThisOne'
                                }

                                dtiReporting.forEachArray(chain, function (link, ndx) {
                                    if (data.hasOwnProperty(link)) {
                                        data = data[link];
                                    } else {
                                        data = null;
                                        return false;
                                    }

                                    if (ndx === stopIndex) {
                                        if (parsed.operator) {
                                            data = data._private.values;
                                        } else {
                                            // Update our regex; continuing the example above, we want to test against 'stillWorkingOnThisOne' instead of 'Part1.Sub2.stillWorkingOnThisOne'
                                            regex = new RegExp(chain[chain.length - 1], 'ig');
                                        }
                                        return false;
                                    }
                                });
                            } else if (parsed.operator) {
                                data = data[parsed.expression] && data[parsed.expression]._private.values;
                            }

                            if (data) {
                                if (parsed.operator) {
                                    regex = new RegExp(parsed.value, 'ig');

                                    dtiReporting.forEachArray(data, function (_private, index) {
                                        if (regex.test(_private.text)) {
                                            if (cfg.highlight) {
                                                _private.html(_private.text.replace(regex, ['<span class="', cfg.classNames.highlight, '">', '$&', '</span>'].join('')));
                                            }
                                            matches.push(_private);
                                        }
                                    });
                                } else {
                                    dtiReporting.forEach(data, function (item, key) {
                                        if (key === '_private') {
                                            return;
                                        }

                                        if (regex.test(item._private.text)) {
                                            if (cfg.highlight) {
                                                item._private.html(item._private.text.replace(regex, ['<span class="', cfg.classNames.highlight, '">', '$&', '</span>'].join('')));
                                            }
                                            matches.push(item._private);
                                        }
                                    });
                                }
                            }
                        }

                        sortArray(matches);
                        source.matches(matches);
                        totalMatches += matches.length;
                    });

                    if (totalMatches === 0) {
                        self.hide();
                    } else if (!self.getSelected().length) {
                        if (cfg.autoselect) {
                            self.selectFirst();
                        }
                    } else {
                        scrollTo(self.getSelected());   // Call scroll in case the selected item is not in view
                    }

                    self.numberOfMatches = totalMatches;
                },
                selectMatch = function (data, e) {
                    var inputValue = cfg.$inputElement.val(),
                        operator = getOperator(inputValue),
                        isEnterKeyPress = (e.which === 10) || (e.which === 13);

                    if (operator) {
                        inputValue = inputValue.replace(new RegExp(operator + '.*'), operator + ' ' + data.text);
                    } else {
                        if (!data.parent) {
                            inputValue = data.text;
                        } else {
                            inputValue = inputValue.slice(0, inputValue.lastIndexOf(cfg.chainCharacter) + 1) + data.text;
                        }
                    }

                    // If materialize chips is installed
                    if (cfg.$chips) {
                        // If the selected item has children or values to choose from
                        if (data.hasChildren || data.hasValues) {
                            if (isEnterKeyPress) { // If we arrived her by way of the enter key
                                e.stopImmediatePropagation(); // Stop propagation so we don't create a chip
                            }
                        } else {
                            if (!isEnterKeyPress) { // If we arrived here by way of mouse click one of our suggestions
                                cfg.$chips.addChip(cfg.$chips.data('index'), {tag: inputValue}, cfg.$chips); // Manually add the chip
                                inputValue = '';
                            }
                        }
                        getMatches(inputValue);
                    }

                    cfg.$inputElement.val(inputValue);
                    cfg.$inputElement.focus();
                },
                handleKeyup = function (e) {
                    var inputValue = cfg.$inputElement.val(),
                        key = e.which,
                        catchKeys = [27, 40, 38, 10, 13]; // escape, down, up, return, return

                    if (!!~catchKeys.indexOf(key)) {
                        if (key === 27) { // escape
                            self.hide();
                        }
                        return;
                    }

                    getMatches(inputValue);

                    if (self.bindings.isShown() === false) {
                        if (inputValue.length > cfg.minLength) {
                            self.show();
                        }
                    }
                },
                handleKeydown = function (e) {
                    var key = e.which,
                        $selected;

                    if (key === 10 || key === 13) { // return
                        $selected = self.getSelected();

                        if (self.bindings.isShown() && $selected.length) {
                            selectMatch(ko.dataFor($selected[0]), e);
                        } else {
                            getMatches('');
                            if (cfg.showOnFocus) {
                                self.show();
                            } else {
                                self.hide();
                            }
                        }
                    } else if (key === 40) { // down
                        if (self.bindings.isShown() === false) {
                            self.show();
                        } else {
                            self.selectNext();
                        }
                    } else if (key === 38) { // up
                        if (self.bindings.isShown()) {
                            self.selectPrevious();
                        }
                    }
                };

            if (!cfg.$inputElement || !cfg.$inputElement.length) {
                return dtiReporting.log('Invalid $inputElement', config.$inputElement);
            }
            if (!cfg.$resultsContainer || !cfg.$resultsContainer.length) {
                return dtiReporting.log('Invalid $resultsContainer', config.$resultsContainer);
            }
            if (cfg.$chips && !cfg.$chips.length) {
                return dtiReporting.log('Invalid $chips', config.$chips);
            }

            self.getSource = function (name) {
                var sources = self.bindings.sources(),
                    source;

                dtiReporting.forEachArray(sources, function (src) {
                    if (src.name() === name) {
                        source = src;
                        return false;
                    }
                });

                return source;
            };

            self.addSource = function (src) {
                var source = {
                    name: ko.observable(src.name || dtiReporting.makeId()),
                    nameShown: ko.observable(src.nameShown),
                    data: Array.isArray(src.data) ? [] : {},
                    matches: ko.observableArray([])
                };

                self.bindings.sources.push(source);

                self.addData(source.name(), src.data);
            };

            self.addData = function (sourceName, data) {
                // data: array of suggestion strings or an object
                var source = self.getSource(sourceName),
                    addValues = function (from, toArray, additionalProperties) {
                        var item,
                            fromArray;

                        if (!from) {
                            return;
                        }

                        if (Array.isArray(from)) {
                            fromArray = from;
                        } else {
                            fromArray = [from];
                        }
                        additionalProperties = additionalProperties || {};

                        dtiReporting.forEachArray(fromArray, function (value) {
                            value = value.toString();
                            item = $.extend({
                                text: value,
                                html: ko.observable(value)
                            }, additionalProperties);

                            toArray.push(item);
                        });
                    },
                    addValuesAndSort = function (fromArray, toArray, additionalProperties) {
                        addValues(fromArray, toArray, additionalProperties);
                        sortArray(toArray);
                    },
                    addObj = function (param) {
                        // param = {
                        //     root: root object
                        //     parent: parent object (null if top level object)
                        //     srcItem: source object or array
                        //     text: object key
                        // }
                        var item = {
                            _private: {
                                parent: param.parent,
                                text: param.text,
                                html: ko.observable(param.text),
                                values: [],
                                hasChildren: false,
                                hasValues: false
                            }
                        };

                        if (!param.parent) { //  If we don't have a parent
                            if (param.root[param.text]) {
                                item = param.root[param.text]; // Point to the existing item
                            } else {
                                param.root[param.text] = item; // Install this item on the root
                            }
                        } else if (param.parent[param.text]) { // Else if this item already exists
                            item = param.parent[param.text]; // Point to the existing item
                        } else {
                            param.parent[param.text] = item; // Install new item on the parent
                        }

                        if (!!param.srcItem) {
                            if (typeof param.srcItem === 'string') {
                                item._private.hasValues = true;
                                addValues(param.srcItem, item._private.values);
                            } else if (Array.isArray(param.srcItem)) {
                                item._private.hasValues = true;
                                addValuesAndSort(param.srcItem, item._private.values);
                            } else {
                                item._private.hasChildren = true;

                                dtiReporting.forEach(param.srcItem, function (subSource, subText) {
                                    // Look for special keys and handle accordingly
                                    if (subText === '_values') {
                                        item._private.hasValues = true;
                                        return addValuesAndSort(subSource, item._private.values);
                                    }
                                    if (subText === '_valuesNoSort') {
                                        item._private.hasValues = true;
                                        return addValues(subSource, item._private.values);
                                    }

                                    addObj({
                                        root: source.data,
                                        parent: item,
                                        srcItem: subSource,
                                        text: subText
                                    });
                                });
                            }
                        }
                    };

                if (!source) {
                    return dtiReporting.log('Source not found');
                }

                // If the new data is not the same type as our source
                if (Array.isArray(data) !== Array.isArray(source.data)) {
                    return dtiReporting.log('Invalid data');
                }

                if (Array.isArray(data)) {
                    addValuesAndSort(data, source.data, {
                        parent: null,
                        hasChildren: false,
                        hasValues: false
                    });
                } else { // data must be an object
                    dtiReporting.forEach(data, function (item, text) {
                        addObj({
                            root: source.data,
                            srcItem: item,
                            text: text
                        });
                    });
                }

                getMatches(cfg.$inputElement.val());
            };

            self.removeAllData = function (sourceName) {
                var source = self.getSource(sourceName);

                if (!source) {
                    return dtiReporting.log('Source not found');
                }

                if (Array.isArray(source.data)) {
                    source.data = [];
                } else {
                    source.data = {};
                }

                getMatches(cfg.$inputElement.val());
            };

            self.removeData = function (sourceName, dataToRemove) {
                // sourceName = string
                var source = self.getSource(sourceName);

                if (!source) {
                    return dtiReporting.log('Source not found');
                }

                if (!Array.isArray(source.data)) {
                    return dtiReporting.log('This source\'s data cannot be removed because it is not an array');
                }

                if (!Array.isArray(dataToRemove)) {
                    dataToRemove = [dataToRemove];
                }

                dtiReporting.forEachArray(dataToRemove, function (text) {
                    dtiReporting.forEachArray(source.data, function (sourceItem, ndx) {
                        // sourceItem = {
                        //     hasChildren : false,
                        //     hasValues : false,
                        //     html : observable,
                        //     parent : null
                        //     text : "Jeff Shore"
                        // }
                        if (sourceItem.text === text) {
                            source.data.splice(ndx, 1);
                            return false; // Stop iterrating the forEach array
                        }
                    });
                });

                getMatches(cfg.$inputElement.val());
            };

            self.show = function () {
                if (!self.bindings.isShown() && (self.numberOfMatches > 0)) {
                    self.selectNone();
                    if (cfg.autoselect) {
                        self.selectFirst();
                    }
                    self.bindings.isShown(true);
                    self.reposition();
                }
            };

            self.hide = function (clearInputValue) {
                self.bindings.isShown(false);
                if (clearInputValue) {
                    cfg.$inputElement.val('');
                }
            };

            self.reposition = function () {
                $markup.position({
                    my: 'left top',
                    at: 'left bottom',
                    of: cfg.$inputElement
                });
            };

            self.selectFirst = function () {
                return $container.find(selectors.match).first().addClass(cfg.classNames.selected);
            };

            self.selectLast = function () {
                return $container.find(selectors.match).last().addClass(cfg.classNames.selected);
            };

            self.selectNext = function () {
                var $selected = self.getSelected(),
                    $next = $selected.next();

                if ($selected.length) {
                    self.selectNone($selected);
                    $next.addClass(cfg.classNames.selected);
                } else {
                    $next = self.selectFirst();
                }
                scrollTo($next);

                return $next;
            };

            self.selectPrevious = function () {
                var $selected = self.getSelected(),
                    $previous = $selected.prev();

                if ($selected.length) {
                    self.selectNone($selected);
                    $previous.addClass(cfg.classNames.selected);
                } else {
                    $previous = self.selectLast();
                }
                scrollTo($previous);

                return $previous;
            };

            self.selectNone = function ($selected) {
                if (!$selected) {
                    $selected = self.getSelected();
                }
                return $selected.removeClass(cfg.classNames.selected);
            };

            self.getSelected = function () {
                return $container.find(selectors.selected);
            };

            self.parse = function (str) {
                return parse(str);
            };

            self.destroy = function () {
                // Remove all event listeners
                if (cfg.$chips) {
                    cfg.$chips.off();
                }
                cfg.$resultsContainer.off();
                cfg.$inputElement.off();

                // Remove all cached DOM elements
                delete cfg.$chips;
                delete cfg.$inputElement;
                delete cfg.$resultsContainer;

                $markup = null;
                $container = null;
            };

            self.numberOfMatches = 0;

            self.bindings = {
                isShown: ko.observable(false),
                sources: ko.observableArray([]),
                selectMatch: function (data, e) {
                    selectMatch(data, e);
                }
            };

            // Get autosuggest DOM template
            $markup = dtiReporting.utility.getTemplate('#autosuggestTemplate');

            // Change default class names if needed
            dtiReporting.forEach(defaults.classNames, function changeDefaultClassName(defaultClassName, key) {
                var defaultSelector = '.' + defaultClassName,
                    requestedClassName = cfg.classNames[key];

                if (requestedClassName !== defaultClassName) {
                    $markup.find(defaultSelector).removeClass(defaultClassName).addClass(requestedClassName);
                }
            });

            // Add autosuggest DOM to the document & apply bindings
            cfg.$resultsContainer.append($markup);
            ko.applyBindings(self.bindings, $markup[0]);

            // Cache the container
            $container = cfg.$resultsContainer.find(selectors.container);

            // Add event handlers
            cfg.$inputElement.keyup(handleKeyup);

            cfg.$inputElement.keydown(handleKeydown);

            if (cfg.showOnFocus) {
                cfg.$inputElement.focus(function () {
                    self.show();
                });
            }

            cfg.$resultsContainer.click(function handleClick(e) {
                var $target = $(e.target),
                    $parents = $target.parents();

                if (($target.is(cfg.$inputElement) === false) && $parents.length && ($parents.filter(selectors.container).length === 0)) {
                    self.hide();
                }
            });

            if (cfg.$chips) {
                cfg.$chips.on('chip.delete', function (e, chip) {
                    self.reposition();
                });

                cfg.$chips.on('chip.add', function (e, chip) {
                    if (cfg.persistAfterSelect) {
                        self.reposition();
                    } else {
                        self.hide();
                    }
                });

                // If our configuration is set to simulate an enter keypress when the input loses focus
                if (cfg.enterOnBlur) {
                    cfg.$inputElement.blur(function (e) {
                        var inputValue = cfg.$inputElement.val();

                        // Make sure our autosuggest isn't shown before we do this because clicking a suggestion triggers a blur
                        // and we don't want to create a chip using a partial match (we want to create a chip using the selected
                        // suggestion)
                        if ((self.bindings.isShown() === false) && inputValue.length) {
                            cfg.$chips.addChip(cfg.$chips.data('index'), {tag: inputValue}, cfg.$chips); // Manually add the chip
                            cfg.$inputElement.val('');
                            getMatches('');
                        }
                    });
                }
            }

            // Add autosuggest sources
            dtiReporting.forEachArray(cfg.sources, self.addSource);
        }
    },
    toast: function () {
        var $closeMarkup = $('<i class="material-icons">close</i>');

        $closeMarkup.click(function (e) {
            var $toast = $(e.target).parent();

            dtiReporting.animations.fadeOut($toast, function () {
                $toast.remove();
            });
        });

        Materialize.toast.apply(window, arguments);

        $('#toast-container').find('.toast').last().append($closeMarkup);
    },
    animations: {
        _fade: function ($el, opacity, cb) {
            $el.velocity('stop');
            $el.velocity({
                opacity: opacity
            }, {
                queue: false,
                duration: 300,
                easing: 'easeOutSine',
                complete: cb
            });
        },
        fadeIn: function ($el, cb) {
            if (!!$el[0]) {
                $el[0].style.willChange = 'opacity, display';
            }
            $el.css('display', 'block');
            dtiReporting.animations._fade($el, 1, cb);
        },
        fadeOut: function ($el, cb) {
            dtiReporting.animations._fade($el, 0, function finishFadeOut() {
                $el.css('display', 'none');
                $el[0].style.willChange = '';
                if (cb) {
                    cb();
                }
            });
        },
        slideUp: function ($el, cb) {
            $el[0].style.willChange = 'height, padding-top, padding-bottom';
            $el.css('overflow', 'hidden');
            $el.velocity('stop');
            $el.velocity({
                height: 0,
                'padding-top': 0,
                'padding-bottom': 0
            }, {
                queue: false,
                duration: 300,
                easing: 'easeOutSine',
                complete: function finishSlideUp() {
                    $el.css('display', 'none');
                    $el[0].style.willChange = '';
                    if (cb) {
                        cb();
                    }
                }
            });
        }
    }
};

let reportsVM,
    reportDateRanges = function (selectedRange) {
        var answer,
            dateRanges = { // shifting everything by one day forward
                "Today": [moment(), moment().add(1, "day")],
                "Yesterday": [moment().subtract(1, "days"), moment()],
                "Last 7 Days": [moment().subtract(6, "days"), moment().add(1, "day")],
                "Last Week": [moment().subtract(1, "weeks").startOf("week"), moment().subtract(1, "weeks").endOf("week").add(1, "day")],
                "Last 4 Weeks": [moment().subtract(4, "weeks"), moment().add(1, "day")],
                "This Month": [moment().startOf("month"), moment().endOf("month").add(1, "day")],
                "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month").add(1, "day")],
                "This Year": [moment().startOf("year"), moment().add(1, "day")],
                "Last Year": [moment().subtract(1, "year").startOf("year"), moment().subtract(1, "year").endOf("year").add(1, "day")]
            };

        if (!!selectedRange && dateRanges.hasOwnProperty(selectedRange)) {
            answer = dateRanges[selectedRange];
        } else {
            answer = dateRanges;
        }

        return answer;
    };

let initKnockout = () => {
    var $startDate,
        initStartDate,
        $endDate,
        initEndDate,
        datePickerDefaultOptions = {
            selectMonths: true,     // Creates a dropdown to control month
            selectYears: 15,        // Creates a dropdown of 15 years to control year,
            today: 'Today',
            clear: 'Clear',
            close: 'Ok',
            closeOnSelect: false    // Close upon selecting a date,
        },
        timePickerDefaultOptions = {
            default: 'now',         // Set default time: 'now', '1:30AM', '16:30'
            fromnow: 0,             // set default time to * milliseconds from now (using with default = 'now')
            twelvehour: false,      // Use AM/PM or 24-hour format
            donetext: 'OK',         // text for done-button
            cleartext: 'Clear',     // text for clear-button
            canceltext: 'Cancel',   // Text for cancel-button
            autoclose: false,       // automatic close timepicker
            ampmclickable: false,   // make AM PM clickable
            aftershow: function () {
            } // Function for after opening timepicker
        },
        characterAllowedInTimeField = function (event, timeValue, selectionLen) {
            var keyCode = event.keyCode,
                shiftKey = event.shiftKey;
            if (keyCode === 16 || keyCode === 17) {
                return false;
            } else {
                return keyCode === 8 ||  // backspace
                    keyCode === 13 ||  // CR
                    keyCode === 35 ||  // end
                    keyCode === 36 ||  // home
                    keyCode === 37 ||  // left
                    keyCode === 38 ||  // up
                    keyCode === 39 ||  // right
                    keyCode === 40 ||  // down
                    keyCode === 46 ||  // del
                    (keyCode === 186 && shiftKey && timeValue.indexOf(":") === -1) ||  // allow only 1 ":"
                    (((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) && !shiftKey) &&  // allow numbers
                    timeValue.length - selectionLen <= 4;
            }
        },
        incrementTime = function (incrementUnit, value) {
            var arr,
                hrs,
                mins,
                timeLen = value.length,
                wrapped = false;

            if (timeLen > 2) {  // don't allow increment til 3 chars in time field
                if (value.indexOf(":") > 0) {
                    arr = value.split(":");
                } else {
                    arr = [];
                    if (timeLen === 5) {  // step on errant text
                        arr[0] = value.substr(0, 2);
                        arr[1] = value.substr(3, 2);
                    } else {
                        arr[0] = value.substr(0, (timeLen === 4 ? 2 : 1));
                        arr[1] = value.substr(timeLen - 2, 2);
                    }
                }
                hrs = isNaN(parseInt(arr[0], 10)) ? 0 : parseInt(arr[0], 10);
                mins = isNaN(parseInt(arr[1], 10)) ? 0 : parseInt(arr[1], 10);

                if (hrs > 23) {
                    hrs = 23;
                }
                if (mins > 59) {
                    mins = 59;
                }

                if ((incrementUnit > 0 && mins < 59) ||
                    (incrementUnit < 0 && mins > 0)) {
                    mins += incrementUnit;
                } else if (incrementUnit < 0 && mins === 0) {
                    if (hrs === 0 || hrs > 24) {
                        hrs = 24;
                    }
                    mins = 59;
                    wrapped = true;
                } else if (incrementUnit > 0 && mins >= 59) {
                    if (hrs >= 23) {
                        hrs = 0;
                    }
                    mins = 0;
                    wrapped = true;
                }

                if (wrapped) { // the increment is wrapping
                    switch (true) {
                        case (incrementUnit > 0 && hrs < 23):
                        case (incrementUnit < 0 && hrs > 0):
                            hrs += incrementUnit;
                            break;
                    }
                }

                return ((hrs < 10 ? "0" : "") + hrs) + ":" + ((mins < 10 ? "0" : "") + mins);
            } else {
                return value;
            }
        };

    ko.bindingHandlers.reportDatePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                options = {
                    autoclose: true,
                    clearBtn: true
                };

            $element.datepicker(options).on("changeDate", function (ev) {
                var $dependantDatePicker,
                    val = $.isFunction(valueAccessor()) ? valueAccessor() : parseInt(valueAccessor(), 10);
                if (ev.date) {
                    viewModel.date = moment(ev.date).unix();
                } else {
                    if (val !== "") {
                        viewModel.date = val;
                    }
                }

                $element.datepicker("setEndDate", moment().format("MM/DD/YYYY"));  // nothing greater than today.

                if ($element.hasClass("startDate")) { // if startdate changed adjust limits on Enddate
                    $dependantDatePicker = $element.closest("tr").next().find(".endDate");
                    $dependantDatePicker.datepicker("setStartDate", moment.unix(viewModel.date).format("MM/DD/YYYY"));
                } else if ($element.hasClass("endDate")) {  // if enddate changed adjust limits on startdate
                    $dependantDatePicker = $element.closest("tr").prev().find(".startDate");
                    $dependantDatePicker.datepicker("setEndDate", moment.unix(viewModel.date).format("MM/DD/YYYY"));
                }
            });

            $element.change(function () {
                if (moment(new Date($(element).val())).isValid()) {
                    $element.parent().removeClass("has-error");
                    $element.parent().attr("title", "");
                } else {
                    $element.parent().addClass("has-error");
                    $element.parent().attr("title", "Error in date format");
                }
            });

            if (viewModel.filterName === "Start_Date") {
                $startDate = $(element);
                initStartDate = moment.unix(valueAccessor()).format("MM/DD/YYYY");
            } else if (viewModel.filterName === "End_Date") {
                $endDate = $(element);
                initEndDate = moment.unix(valueAccessor()).format("MM/DD/YYYY");
            }

            if ($endDate && $startDate) { // only hit during init/pageload
                $endDate.datepicker("setStartDate", initStartDate);
                $startDate.datepicker("setEndDate", initEndDate);
            }
        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).datepicker("setDate", moment.unix(value).format("MM/DD/YYYY"));
        }
    };

    ko.bindingHandlers.reportTimePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                timestamp = valueAccessor(),
                options = {
                    doneText: "Done",
                    autoclose: true
                };

            $element.clockpicker(options);

            $element.change(function () {
                if (ko.isObservable(timestamp)) {
                    timestamp($(element).val());
                } else {
                    viewModel.time = $(element).val();
                }
            });

            $element.keyup(function () {
                if ($element.val().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                    $element.parent().removeClass("has-error");
                    $element.parent().attr("title", "");
                    $element.clockpicker("hide");
                    $element.clockpicker("resetClock");
                    $element.clockpicker("show");
                } else {
                    $element.parent().addClass("has-error");
                    $element.parent().attr("title", "Error in time format");
                }
                if (ko.isObservable(timestamp)) {
                    timestamp($(element).val());
                } else {
                    viewModel.time = $(element).val();
                }
            });

            $element.keydown(function (event) {
                var timeValue = $element.val(),
                    selectionLen = element.selectionEnd - element.selectionStart;
                if (characterAllowedInTimeField(event, timeValue, selectionLen)) {
                    if (event.keyCode === 38) { // up arrow
                        $element.val(incrementTime(1, timeValue));
                    } else if (event.keyCode === 40) { // down arrow
                        $element.val(incrementTime(-1, timeValue));
                    } else if (event.keyCode === 13) { // CR
                        $element.val(incrementTime(0, timeValue));
                    }
                    $element.clockpicker("hide");
                    $element.clockpicker("resetClock");
                    $element.clockpicker("show");
                } else {
                    event.preventDefault();
                }
            });
        },

        update: function (element, valueAccessor) {
            var $element = $(element),
                value = ko.utils.unwrapObservable(valueAccessor()),
                hr,
                min;

            if (typeof value !== "string") {
                hr = ("00" + Math.floor(value / 100)).slice(-2);
                min = ("00" + value % 100).slice(-2);
                $element.val(hr + ":" + min);
            } else {
                $element.val(value);
            }
        }
    };

    ko.bindingHandlers.reportPrecisionInput = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                precisionValue = valueAccessor(),
                maxNumber = ($element.attr("max") === undefined ? 10 : $element.attr("max")),
                minNumber = ($element.attr("min") === undefined ? 0 : $element.attr("min")),
                viewModelField = $element.attr("viewModelField"),
                incrementNumber = function (incrementUnit, value) {
                    var newValue = parseInt(value + incrementUnit, 10);

                    if (newValue <= maxNumber && newValue >= minNumber) {
                        return newValue;
                    } else {
                        return parseInt(value, 10);
                    }
                },
                characterAllowedInPrecisionField = function (event, value) {
                    var keyCode = (!!event.which ? event.which : event.keyCode),
                        shiftKey = event.shiftKey,
                        appendedValue = value.toString();
                    if (keyCode === 16 || keyCode === 17) {
                        return false;
                    } else {
                        if ((((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) && !shiftKey)) {
                            appendedValue = parseInt(appendedValue + String.fromCharCode((keyCode => 96 && keyCode <= 105) ? keyCode - 48 : keyCode), 10);
                            return (appendedValue <= maxNumber && appendedValue >= minNumber);
                        } else {
                            return keyCode === 8 ||  // backspace
                                keyCode === 13 ||  // CR
                                keyCode === 35 ||  // end
                                keyCode === 36 ||  // home
                                keyCode === 37 ||  // left
                                keyCode === 38 ||  // up
                                keyCode === 39 ||  // right
                                keyCode === 40 ||  // down
                                keyCode === 46 ||  // del
                                (((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 150)) && !shiftKey);  // allow numbers
                        }
                    }
                };

            $element.attr("title", "'" + minNumber + "' to '" + maxNumber + "'");

            $element.keyup(function () {
                if (ko.isObservable(precisionValue)) {
                    precisionValue(parseInt($(element).val(), 10));
                    precisionValue(isNaN(precisionValue()) ? 0 : precisionValue());
                    if (!!viewModelField) {
                        viewModel[viewModelField] = precisionValue();
                    }
                } else {
                    precisionValue = parseInt($(element).val(), 10);
                    precisionValue = (isNaN(precisionValue) ? 0 : precisionValue);
                    if (!!viewModelField) {
                        viewModel[viewModelField] = precisionValue;
                    }
                }
            });

            $element.keydown(function (event) {
                var value = parseInt($element.val(), 10),
                    keyCode = (!!event.which ? event.which : event.keyCode);
                if ((isNaN(value) || value === "")) {
                    value = 0;
                }
                if (characterAllowedInPrecisionField(event, value)) {
                    if (keyCode === 38) { // up arrow
                        $element.val(incrementNumber(1, value));
                    } else if (keyCode === 40) { // down arrow
                        $element.val(incrementNumber(-1, value));
                    } else if (keyCode === 13) { // CR
                        $element.val(value);
                    }
                    return true;
                } else {
                    event.preventDefault();
                    return false;
                }
            });
        },

        update: function (element, valueAccessor) {
            var $element = $(element),
                value = ko.utils.unwrapObservable(valueAccessor());

            $element.val(value);
        }

    };

    ko.bindingHandlers.dtiReportsMaterializeDropdown = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                $ul = $(element).siblings(),
                $parentDiv = $element.parent(),
                focusoutEventsSet = false;

            $element.dropdown();

            // if ($parentDiv.hasClass("availableCalculations")) {
            //     $element.on("click", function (clickEvent) {
            //         if (!focusoutEventsSet) {
            //             focusoutEventsSet = true;
            //             $parentDiv.on("focusout", function (outEvent) {
            //                 outEvent.preventDefault();
            //                 outEvent.stopPropagation();
            //                 if ($parentDiv.has($(outEvent.target)).length > 0) {
            //                     console.log("still in focus " + $(outEvent.target).attr("class"));
            //
            //                     $element.dropdown('open');
            //                     // $element.addClass("active");
            //                     // $ul.addClass("active");
            //                     // $ul.css("display", "block");
            //                     // $ul.css("opacity", 1);
            //                 } else {
            //                     console.log("lost focus to " + $(outEvent.target).attr("class"));
            //                     focusoutEventsSet = false;
            //                     $parentDiv.off("focusout");
            //
            //                     $element.dropdown('close');
            //                     // $element.removeClass("active");
            //                     // $ul.removeClass("active");
            //                     // $ul.css("display", "none");
            //                     // $ul.css("opacity", 0);
            //                 }
            //             });
            //         }
            //     });
            // }
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };

    ko.bindingHandlers.dtiReportsMaterializeSelect2 = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $element = $(element),
                $select = $element.children('select'),
                config = valueAccessor(),
                $liList;

            // Initial initialization:
            $element.material_select();

            $select.material_select({
                belowOrigin: true,
                showCount: true,
                countSuffix: 'Types'
            });

            $select.on('change', function handleMaterialSelectChange(event, target) {
                var $target = $(target),
                    index = $target.index(),
                    selected = $target.hasClass('active');

            });

            $element.on('change', function handleMaterialSelectChange(event, target) {
                var $target = $(event.target);

                if ($target[0].value === "Starts") {
                    viewModel.precision = 0;
                    bindingContext.$data.precision = 0;
                    // console.log("bindingContext = " + bindingContext);
                }
            });
        }
    };

    ko.bindingHandlers.dtiReportsMaterializeSelect = {
        suspend: false,
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var
                // boundField = valueAccessor(),
                // viewModelObject = allBindingsAccessor().optionsText,
                $element = $(element),
                $select = $($element.context);

            // $element.material_select('destroy');
            $element.material_select();
            // $select.on('change', function handleMaterialSelectChange(event) {
            //     var $target = $(event.target);
            //
            //     if ($target[0].value === "Starts") {
            //         viewModelObject.precision = 0;
            //     }
            //
            //     console.log("$target = " + $target);
            //     console.log("boundField = " + boundField);
            //     console.log("viewModelObject = " + viewModelObject);
            // });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            // $(element).material_select();
        }
    };

    ko.bindingHandlers.dtiReportsMaterializePickadate = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            let $element = $(element);

            $element.pickadate(datePickerDefaultOptions);

            $element.pickadate('picker').on({
                set: function (datePicker) {
                    if (datePicker.select) {
                        let dateInTextFormat = moment(datePicker.select).format("MM/DD/YYYY");
                        valueAccessor()(dateInTextFormat);
                    }
                }
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).pickadate("destroy");
            });
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };

    ko.bindingHandlers.dtiReportsMaterializePickatime = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            let $element = $(element),
                timePickerCallback = () => {
                    valueAccessor()($element.val());
                    Materialize.updateTextFields();
                };

            timePickerDefaultOptions.afterDone = timePickerCallback;

            $element.pickatime(timePickerDefaultOptions);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $element.pickatime("destroy");
            });
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };
};

let reportsViewModel = function () {
    let self = this,
        $direports,
        $tabConfiguration,
        $configurationButton,
        $saveReportButton,
        $tabViewReport,
        $viewReportButton,
        $dataTablePlaceHolder,
        $rightPanel,
        $editColumnModal,
        $columnCardPanel,
        $viewReportNav,
        $globalEditColumnModal,
        $columnsGrid,
        $gridColumnConfig,
        $gridColumnConfigTable,
        $filtersGrid,
        $columnsTbody,
        $gridColumnsTbody,
        $filtersTbody,
        $reportTitleInput,
        $reportColumns,
        $additionalFilters,
        $globalPrecisionText,
        $globalPrecision,
        $globalIncludeInChartText,
        $globalIncludeInChart,
        $globalCalculateText,
        $globalCalculate,
        $reportChartDiv,
        $queryResultSize,
        longClickStart,
        longClickTimer = 100,
        mouseHoverStart,
        mouseHoverTimer = 800,
        reportData,
        reportChartData,
        activeDataRequests,
        reportSocket,
        exportEventSet,
        totalizerDurationInHours = true,
        reportPoint = point,
        scheduledReport = scheduled,
        includeChart = scheduledIncludeChart,
        afterSaveCallback,
        reportName = "dorsett.reportUI",
        getPointURL = "/api/points/",
        originalPoint = {},
        permissionLevels = {
            READ: 1,
            CONTROL: 2,
            ACKNOWLEDGE: 4,
            WRITE: 8
        },
        initialFilterSettings = {
            name1: "",
            name2: "",
            name3: "",
            name4: "",
            pointTypes: []
        },
        columnsFilter = initialFilterSettings,
        filtersFilter = initialFilterSettings,
        filtersPropertyFields = [],
        columnsPropertyFields = [],
        newlyReferencedPoints = [],
        columnFilterValue = "",
        nonSearchableColumnTypes = ["MinSec", "HourMin", "HourMinSec"],
        currentLineDensity = "",
        resizeTimer = 400,
        lastResize = null,
        decimalPadding = "0000000000000000000000000000000000000000",
        millisecondsInHour = 1000 * 60 * 60,
        timeOfUseDuration,
        currentUser,
        ENUMSTEMPLATESENUMS,
        reportCalc = {
            getVariance: (columnData) => {
                var i,
                    meanCalc = reportCalc.getColumnMean(columnData),
                    squaredTotalResults = [],
                    squaredTotal = 0,
                    sum = 0,
                    variance = 0;

                for (i = 0; i < columnData.length; i++) {
                    squaredTotal = Math.pow((columnData[i] - meanCalc), 2);
                    sum += squaredTotal;
                    squaredTotalResults.push(squaredTotal);
                }

                if (squaredTotalResults.length > 0) {
                    variance = sum / squaredTotalResults.length;
                }

                return variance;
            },
            getColumnStandardDeviation: (columnData) => {
                return Math.sqrt(reportCalc.getVariance(columnData));
            },
            getColumnMean: (columnData) => {
                var i,
                    theMean = 0,
                    sumOfData = 0;

                for (i = 0; i < columnData.length; i++) {
                    sumOfData += columnData[i];
                }
                if (columnData.length > 0) {
                    theMean = sumOfData / columnData.length;
                }
                return theMean;
            },
            getColumnSum: (columnData) => {
                var i,
                    theSum = 0;

                for (i = 0; i < columnData.length; i++) {
                    theSum += columnData[i];
                }
                return theSum;
            },
            columnCalculable: (column) => { // TODO needs investigation
                var result = false;
                if (self.reportType() === "Totalizer" || self.reportType() === "History") {
                    result = true;
                } else {
                    switch (column.valueType) {
                        case "Unsigned":
                        case "Float":
                        case "Integer":
                            result = true;
                            break;
                    }
                }

                return result;
            },
            columnChartable: (column) => {
                var result = false,
                    enumsSet;

                if (column.canCalculate) {
                    result = true;
                } else {
                    enumsSet = (!scheduledReport && ENUMSTEMPLATESENUMS.Properties[column.colName] ? ENUMSTEMPLATESENUMS.Properties[column.colName].enumsSet : undefined);
                    result = (!!enumsSet && enumsSet !== "");
                }

                return result;
            },
            calculateBitStringValue: (filter) => {
                if (filter.valueType === "BitString") {
                    var total = 0,
                        key,
                        bitStringEnums = (!!ENUMSTEMPLATESENUMS ? ENUMSTEMPLATESENUMS[filter.filterName + " Bits"] : {});

                    for (key in bitStringEnums) {
                        if (bitStringEnums.hasOwnProperty(key)) {
                            if (key !== "All") {
                                total += bitStringEnums[key].enum;
                            }
                        }
                    }

                    filter.value = 0;
                    for (var j = 0; j < filter.bitStringEnumsArray.length; j++) { // TODO  waiting for cleanup
                        key = filter.bitStringEnumsArray[j].name;
                        if (bitStringEnums.hasOwnProperty(key)) {
                            if (filter.bitStringEnumsArray[j].checked) {
                                console.log("bitStringEnums[" + key + "].enum  = " + bitStringEnums[key].enum);
                                filter.value += bitStringEnums[key].enum;
                                console.log("filter.value  = " + filter.value);
                            }
                            if (filter.value === total) {
                                filter.value = bitStringEnums.All.enum;
                            }
                        }
                    }
                }
            },
            checkForColumnCalculations: () => {
                var i,
                    column,
                    canCalculate = false;

                for (i = 1; i < self.listOfColumns().length; i++) {
                    column = self.listOfColumns()[i];
                    if (reportCalc.columnCalculable(column)) {
                        canCalculate = true;
                        break;
                    }
                }
                self.calculatable(canCalculate);
            },
            checkForIncludeInChart: () => {
                var displayChartingHeader = false,
                    activateCharting = false,
                    allChecked = true;

                for (var i = 1; i < self.listOfColumns().length; i++) {
                    if (reportCalc.columnChartable(self.listOfColumns()[i])) {
                        displayChartingHeader = true;
                        if (!activateCharting && self.listOfColumns()[i].includeInChart) {
                            activateCharting = true;
                        }
                        if (i > 0 && !self.listOfColumns()[i].includeInChart) {
                            allChecked = false;
                        }
                    }
                }

                if (displayChartingHeader) {
                    $columnsGrid.find("th .yaxisChartGroupColumn").html("Group");
                }

                self.chartable(activateCharting);
                self.allChartCheckboxChecked(allChecked);

                if (!self.chartable()) {
                    self.selectViewReportTabSubTab("gridData");
                }
            }
        },
        reportUtil = {
            generateUUID: () => {
                var d = new Date().getTime(),
                    uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                        var r = (d + Math.random() * 16) % 16 | 0;
                        d = Math.floor(d / 16);
                        return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
                    });
                return uuid;
            },
            noExponents: (theNumber) => {
                var data = String(theNumber).split(/[eE]/);

                if (data.length === 1) {
                    return data[0];
                }

                var z = "", sign = theNumber < 0 ? "-" : "",
                    str = data[0].replace(".", ""),
                    mag = Number(data[1]) + 1;

                if (mag < 0) {
                    z = sign + "0.";
                    while (mag++) {
                        z += "0";
                    }
                    return z + str.replace(/^\-/, "");
                }
                mag -= str.length;
                while (mag--) {
                    z += "0";
                }

                return str + z;
            },
            toFixed: (number, p) => {
                var precision = parseInt(p, 10),
                    abs = Math.abs(parseFloat(number)),
                    str = reportUtil.noExponents(abs),
                    digits = str.split(".")[1],
                    negative = number < 0,
                    lastNumber,
                    mult;

                if (precision === 0) {
                    str = abs.toFixed(0);
                } else if (digits && (digits.length > precision)) {
                    str = str.substr(0, parseInt(str.indexOf("."), 10) + parseInt(precision, 10) + 2);
                    lastNumber = str.charAt(str.length - 1);
                    str = str.substr(0, str.length - 1);
                    if (lastNumber >= 5) {
                        mult = Math.pow(10, str.length - str.indexOf(".") - 1);
                        str = (+str + 1 / mult).toFixed(precision);
                    }
                } else {  // pad decimal places
                    str = str.split(".")[0] + "." + String((!!digits ? digits : "") + decimalPadding).slice(0, precision);
                }

                return (negative ? "-" : "") + str;
            },
            toFixedComma: (number, precision) => {
                var fixedNum = reportUtil.toFixed(number, (precision === undefined) ? 128 : precision);
                return reportUtil.numberWithCommas(fixedNum);
            },
            numberWithCommas: (theNumber) => {
                var result = "";
                if (theNumber !== null && theNumber !== undefined) {
                    if (theNumber.toString().indexOf(".") > 0) {
                        var arr = theNumber.toString().split(".");
                        result = arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + arr[1];
                    } else {
                        result = theNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    }
                }
                return result;
            },
            getPointInspectorParams: (filter) => {
                return {
                    name1: filter.name1,
                    name2: filter.name2,
                    name3: filter.name3,
                    name4: filter.name4,
                    pointTypes: (filter.pointTypes.length === 0 ? self.pointTypes() : filter.pointTypes),
                    disableNewPoint: true
                };
            },
            setPointInspectorParams: (filterObject, filter) => {
                // filterObject.name1 = filter.name1;
                // filterObject.name2 = filter.name2;
                // filterObject.name3 = filter.name3;
                // filterObject.name4 = filter.name4;
                // filterObject.pointTypes = filter.pointTypes;
            },
            collectEnumProperties: () => {
                filterLogic.getProperties();
                columnLogic.getProperties();
            },
            getFilterAdjustedDatetime: (filter) => {
                return reportUtil.getAdjustedDatetimeUnix(moment.unix(filter.date), filter.time.toString());
            },
            getAdjustedDatetimeMoment: (date, time) => {
                var result = date,
                    timestamp,
                    hour,
                    min;

                if (date !== undefined && time !== undefined) {
                    timestamp = parseInt(time.replace(":", ""), 10);
                    hour = ("00" + Math.floor(timestamp / 100)).slice(-2);
                    min = ("00" + timestamp % 100).slice(-2);
                    result = date.startOf("day");
                    result = result.add(hour, "h");
                    result = result.add(min, "m");
                }

                return result;
            },
            getAdjustedDatetimeUnix: (date, time) => {
                var result,
                    validatedDate = (moment.isMoment(date) ? date : moment.unix(date));

                result = reportUtil.getAdjustedDatetimeMoment(validatedDate, time.toString());
                return result.unix();
            },
            getKeyBasedOnEnum: (obj, enumValue) => {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (obj[key].enum === parseInt(enumValue, 10)) {
                            return key;
                        }
                    }
                }
            },
            getKeyBasedOnValue: (obj, value) => {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (obj[key] === parseInt(value, 10)) {
                            return key;
                        }
                    }
                }
            },
            getValueBasedOnText: (array, text) => {
                var answer;
                for (var i = 0; i < array.length; i++) {
                    if (array[i].text === text) {
                        answer = array[i].value;
                        break;
                    }
                }
                return answer;
            },
            configureSelectedDuration: (configObject) => {
                if (!!configObject && !!configObject.duration) {
                    self.selectedDuration({
                        startDate: $.isNumeric(configObject.duration.startDate) ? moment.unix(configObject.duration.startDate) : configObject.duration.startDate,
                        startTimeOffSet: configObject.duration.startTimeOffSet,
                        endDate: $.isNumeric(configObject.duration.endDate) ? moment.unix(configObject.duration.endDate) : configObject.duration.endDate,
                        endTimeOffSet: configObject.duration.endTimeOffSet,
                        selectedRange: (!!configObject.duration.selectedRange ? configObject.duration.selectedRange : "")
                    });

                    self.durationStartTimeOffSet(!!configObject.duration.startTimeOffSet ? configObject.duration.startTimeOffSet : "00:00");
                    self.durationEndTimeOffSet(!!configObject.duration.endTimeOffSet ? configObject.duration.endTimeOffSet : "00:00");
                    if (!!configObject.interval && !!configObject.interval.period) {
                        self.intervalPeriod(configObject.interval.period);
                    }
                    if (!!configObject.interval && !!configObject.interval.value) {
                        self.intervalValue(configObject.interval.value);
                    }
                }

                if (typeof self.selectedDuration() === "object") {
                    let tempDuration = $.extend(true, {}, self.selectedDuration());
                    tempDuration.startTimeOffSet = self.durationStartTimeOffSet();
                    tempDuration.endTimeOffSet = self.durationEndTimeOffSet();

                    if (tempDuration.selectedRange === "Custom Range") {
                        self.startDate(reportUtil.getAdjustedDatetimeUnix(tempDuration.startDate.unix(), self.durationStartTimeOffSet()));
                        self.endDate(reportUtil.getAdjustedDatetimeUnix(tempDuration.endDate.unix(), self.durationEndTimeOffSet()));
                    } else {
                        var dateRange = reportDateRanges(tempDuration.selectedRange);
                        tempDuration.startDate = reportUtil.getAdjustedDatetimeMoment(dateRange[0], self.durationStartTimeOffSet());
                        tempDuration.endDate = reportUtil.getAdjustedDatetimeMoment(dateRange[1], self.durationEndTimeOffSet());
                        self.startDate(tempDuration.startDate.unix());
                        self.endDate(tempDuration.endDate.unix());
                        tempDuration.duration = tempDuration.startDate.diff(tempDuration.endDate);
                    }
                    self.selectedDuration(tempDuration);
                }

                self.selectedDuration.valueHasMutated();
            },
            getValueType: (valuetype) => {
                var answer = "";

                if (!!ENUMSTEMPLATESENUMS) {
                    answer = reportUtil.getKeyBasedOnEnum(ENUMSTEMPLATESENUMS["Value Types"], valuetype);
                }

                return answer;
            },
            formatPoint: (cb, selectedPoint, pRef) => {
                var params = {
                        point: reportPoint,
                        oldPoint: originalPoint,
                        refPoint: selectedPoint,
                        property: pRef
                    },
                    callback = function (formattedPoint) {
                        if (!formattedPoint.err) {
                            reportPoint = formattedPoint;
                        }
                        if (!!cb) {
                            if (typeof cb === "function") {
                                cb(formattedPoint);
                            }
                        }
                    };
                dtiUtility.getConfig("Update.formatPoint", [params], callback);
            },
            setValueList: (property, pointType, index, activeRequest) => {
                var result = [],
                    maxWidth = 0,
                    maxWidthInPixels = 0,
                    i,
                    setOptions = function (options) {
                        if (!!self.listOfFilters()[index]) {
                            if (!!options && Array.isArray(options)) {
                                result.push({
                                    value: "<blank>",
                                    evalue: -1
                                });

                                for (i = 0; i < options.length; i++) {
                                    if (maxWidth < options[i].name.length) {
                                        maxWidth = options[i].name.length;
                                    }
                                    result.push({
                                        value: options[i].name,
                                        evalue: options[i].value
                                    });
                                }
                                maxWidthInPixels = (maxWidth < 14 ? maxWidth * 14 : maxWidth * 9); // TODO needs to check font/size
                                if (self.listOfFilters()[index].evalue === undefined || self.listOfFilters()[index].evalue < 0) {
                                    self.listOfFilters()[index].value = result[0].value;
                                    self.listOfFilters()[index].evalue = result[0].evalue;
                                }
                                self.listOfFilters()[index].valueList = result;
                                self.listOfFilters()[index].valueListMaxWidth = maxWidthInPixels;
                                filterLogic.updateListOfFilters(self.listOfFilters());
                            }
                        }
                        if (!!activeRequest && typeof activeRequest === "function") {
                            activeRequest({index: index, status: false});
                        }
                    };

                dtiUtility.getConfig("Utility.pointTypes.getEnums", [property, pointType], setOptions);
            },
            getTotalizerValueList: (pointType) => {
                var result = [];

                if (pointType) {
                    switch (pointType) {
                        case "Binary Input":
                        case "Binary Output":
                        case "Binary Value":
                            result.push("Starts");
                            result.push("Runtime");
                            break;
                        default:
                            result.push("Total");
                            break;
                    }
                }

                return result;
            },
            getBitStringEnumsArray: (bitString) => {
                var enumsArray = [];
                for (var key in bitString) {
                    if (bitString.hasOwnProperty(key)) {
                        if (key !== "All") {
                            enumsArray.push({
                                name: key,
                                checked: false
                            });
                        }
                    }
                }
                return enumsArray;
            },
            parseNumberValue: (theValue, rawValue, eValue) => {
                var result;
                result = (theValue !== null && theValue !== undefined ? parseFloat(theValue.toString().replace(",", "")) : theValue);
                if (isNaN(result)) {
                    result = (eValue !== undefined ? parseFloat(eValue) : parseFloat(rawValue));
                    if (isNaN(result)) {
                        result = rawValue;
                    }
                }
                return (isNaN(result) || result === "" ? 0 : result);
            },
            initExistingReport: (reportConfig) => {
                self.unpersistedReport(reportPoint._id === 0);
                self.reportDisplayTitle((!!reportConfig.reportTitle ? reportConfig.reportTitle : reportPoint.Name.replace(/_/g, " ")));
                self.listOfColumns(columnLogic.initColumns(reportConfig.columns));
                self.listOfFilters(filterLogic.initFilters(reportConfig.filters));
                if (!!reportConfig.pointFilter) {
                    self.name1Filter(reportConfig.pointFilter.name1);
                    self.name2Filter(reportConfig.pointFilter.name2);
                    self.name3Filter(reportConfig.pointFilter.name3);
                    self.name4Filter(reportConfig.pointFilter.name4);
                    self.selectedPointTypesFilter(!!reportConfig.pointFilter.selectedPointTypes ? reportConfig.pointFilter.selectedPointTypes : []);
                }
                self.selectedPageLength((reportConfig.selectedPageLength ? reportConfig.selectedPageLength : self.selectedPageLength()));
                self.selectedChartType((reportConfig.selectedChartType ? reportConfig.selectedChartType : self.selectedChartType()));
                self.displayGridCalculations((reportConfig.displayGridCalculations !== undefined ? reportConfig.displayGridCalculations : true));
                self.displayGridFilters((reportConfig.displayGridFilters !== undefined ? reportConfig.displayGridFilters : true));
                switch (self.reportType()) {
                    case "History":
                    case "Totalizer":
                        if (!!reportPoint["Report Config"].duration) { // have to set each manually because of computed relationship
                            reportUtil.configureSelectedDuration(reportPoint["Report Config"]);
                        }
                        break;
                    case "Property":
                        reportUtil.collectEnumProperties();
                        break;
                    default:
                        console.log(" - - - DEFAULT  init()");
                        break;
                }
            },
            initNewReport: () => {
                self.unpersistedReport(reportPoint._id === 0);
                self.reportDisplayTitle(dtiCommon.getPointName(reportPoint.path));
                reportPoint["Point Refs"] = [];  // new report, clear out initial Report create data
                reportPoint["Report Config"].columns = [];
                reportPoint["Report Config"].filters = [];
                reportPoint["Report Config"].pointFilter = {
                    "name1": self.name1Filter(),
                    "name2": self.name2Filter(),
                    "name3": self.name3Filter(),
                    "name4": self.name4Filter(),
                    "selectedPointTypes": self.selectedPointTypesFilter()
                };
                reportPoint["Report Config"].displayGridCalculations = self.displayGridCalculations();
                reportPoint["Report Config"].displayGridFilters = self.displayGridFilters();
                self.listOfColumns([]);
                switch (self.reportType()) {
                    case "History":
                    case "Totalizer":
                        // reportPoint["Report Config"].returnLimit = 2000;
                        self.listOfColumns.push(columnLogic.getNewColumnTemplate());
                        self.listOfColumns()[0].colName = "Date";
                        self.listOfColumns()[0].colDisplayName = "Date";
                        self.listOfColumns()[0].dataColumnName = "Date";
                        self.listOfColumns()[0].valueType = "DateTime";
                        self.listOfColumns()[0].AppIndex = -1;
                        reportUtil.configureSelectedDuration();
                        break;
                    case "Property":
                        reportUtil.collectEnumProperties();
                        // reportPoint["Report Config"].returnLimit = 2000;
                        self.listOfColumns.push(columnLogic.getNewColumnTemplate());
                        self.listOfColumns()[0].colName = "Name";
                        self.listOfColumns()[0].colDisplayName = "Name";
                        self.listOfColumns()[0].dataColumnName = "Name";
                        self.listOfColumns()[0].valueType = "String";
                        self.listOfColumns()[0].AppIndex = -1;
                        break;
                    default:
                        console.log(" - - - DEFAULT  init() null columns");
                        break;
                }
            },
            searchFilterActive: () => {
                let resultSet = self.listOfColumns().filter(function (cConfig) {
                    return (cConfig.searchFilter !== undefined && cConfig.searchFilter !== "");
                });
                return (resultSet.length > 0);
            },
            getExportFileName: () => {
                let now = moment().format("YYYY-MM-DD_HHmm");
                return reportName + "_" + now;
            },
            getTimeOfUseDuration: (selectedInterval) => {
                let answer;
                for (let i = 0; i < self.listOfIntervals().length; i++) {
                    if (self.intervalPeriod() === self.listOfIntervals()[i].text) {
                        if (i+1 < self.listOfIntervals().length) {
                            answer = self.listOfIntervals()[i+1];
                        } else {
                            answer = self.listOfIntervals()[i];
                        }
                        break;
                    }
                }
                return answer;
            }
        },
        pointSelector = {
            openForModalColumn: () => {
                var tempObject = columnLogic.getNewColumnTemplate(),
                    setColumnPoint = function (selectedPoint) {
                        newlyReferencedPoints.push(selectedPoint);
                        if (!!tempObject.AppIndex) {
                            delete tempObject.AppIndex;
                        }
                        tempObject.upi = selectedPoint._id;
                        tempObject.dataColumnName = tempObject.upi;
                        tempObject.valueType = reportUtil.getValueType(selectedPoint.Value.ValueType);
                        tempObject.colName = selectedPoint.Name;
                        tempObject.colDisplayName = selectedPoint.Name.replace(/_/g, " ");
                        tempObject.pointType = selectedPoint["Point Type"].Value;
                        tempObject.canCalculate = reportCalc.columnCalculable(tempObject);
                        if (selectedPoint["Engineering Units"]) {
                            tempObject.units = selectedPoint["Engineering Units"].Value;
                        }
                        if (tempObject.canCalculate) {
                            tempObject.precision = 3;
                            tempObject.includeInChart = false;
                        }
                        tempObject.calculation = [];
                        tempObject.multiplier = 1;
                        delete tempObject.valueOptions;
                        if (self.reportType() === "Totalizer") {
                            tempObject.valueList = reportUtil.getTotalizerValueList(tempObject.pointType);
                            tempObject.operator = tempObject.valueList[0];
                            tempObject.dataColumnName = tempObject.upi + " - " + tempObject.operator.toLowerCase();
                        } else {
                            if (self.reportType() === "History") {
                                tempObject.dataColumnName = tempObject.upi;
                            }
                            if (!!selectedPoint.Value && !!selectedPoint.Value.ValueOptions) {
                                tempObject.valueOptions = selectedPoint.Value.ValueOptions;
                            }
                        }
                        tempObject.canBeCharted = reportCalc.columnChartable(tempObject);
                        tempObject.yaxisGroup = "A";
                        columnLogic.updateColumnFromPointRefs(tempObject);  // sets AppIndex;
                        if (tempObject.AppIndex) {
                            reportUtil.formatPoint(selectedPoint, pointRefUtil.getByAppIndex(tempObject.AppIndex));
                        }
                        self.currentColumnEdit(tempObject);
                    },
                    pointSelectedCallback = function (pointInfo) {
                        if (!!pointInfo) {
                            reportUtil.setPointInspectorParams(columnsFilter, pointInfo.filter);
                            ajaxCall("GET", null, getPointURL + pointInfo._id, setColumnPoint);
                        }
                    };

                dtiUtility.showPointSelector(reportUtil.getPointInspectorParams(columnsFilter));
                dtiUtility.onPointSelect(pointSelectedCallback);
            },
            openForColumn: (selectObjectIndex) => {
                var updatedList = $.extend(true, [], self.listOfColumns()),
                    tempObject = updatedList[selectObjectIndex],
                    setColumnPoint = function (selectedPoint) {
                        newlyReferencedPoints.push(selectedPoint);
                        if (!!tempObject.AppIndex) {
                            delete tempObject.AppIndex;
                        }
                        tempObject.upi = selectedPoint._id;
                        tempObject.dataColumnName = tempObject.upi;
                        tempObject.valueType = reportUtil.getValueType(selectedPoint.Value.ValueType);
                        tempObject.colName = dtiCommon.getPointName(selectedPoint.path);
                        tempObject.colDisplayName = dtiCommon.getPointName(selectedPoint.path);
                        tempObject.pointType = selectedPoint["Point Type"].Value;
                        tempObject.canCalculate = reportCalc.columnCalculable(tempObject);
                        if (selectedPoint["Engineering Units"]) {
                            tempObject.units = selectedPoint["Engineering Units"].Value;
                        }
                        if (tempObject.canCalculate) {
                            tempObject.precision = 3;
                            tempObject.includeInChart = false;
                        }
                        tempObject.calculation = [];
                        tempObject.multiplier = 1;
                        delete tempObject.valueOptions;
                        if (self.reportType() === "Totalizer") {
                            tempObject.valueList = reportUtil.getTotalizerValueList(tempObject.pointType);
                            tempObject.operator = tempObject.valueList[0];
                            if (tempObject.operator === "Starts") {
                                tempObject.precision = 0;
                            }
                            tempObject.dataColumnName = tempObject.upi + " - " + tempObject.operator.toLowerCase();
                        } else {
                            if (self.reportType() === "History") {
                                tempObject.dataColumnName = tempObject.upi;
                            }
                            if (!!selectedPoint.Value && !!selectedPoint.Value.ValueOptions) {
                                tempObject.valueOptions = selectedPoint.Value.ValueOptions;
                            }
                        }
                        tempObject.canBeCharted = reportCalc.columnChartable(tempObject);
                        tempObject.yaxisGroup = "A";
                        columnLogic.updateColumnFromPointRefs(tempObject);  // sets AppIndex;
                        if (tempObject.AppIndex) {
                            reportUtil.formatPoint(selectedPoint, pointRefUtil.getByAppIndex(tempObject.AppIndex));
                            columnLogic.updateListOfColumns(updatedList);
                        }
                    },
                    pointSelectedCallback = function (pointInfo) {
                        if (!!pointInfo) {
                            reportUtil.setPointInspectorParams(columnsFilter, pointInfo.filter);
                            ajaxCall("GET", null, getPointURL + pointInfo._id, setColumnPoint);
                        }
                    };

                dtiUtility.showPointSelector(reportUtil.getPointInspectorParams(columnsFilter));
                dtiUtility.onPointSelect(pointSelectedCallback);
            },
            openForFilter: (selectObjectIndex) => {
                var updatedList = $.extend(true, [], self.listOfFilters()),
                    tempObject = updatedList[selectObjectIndex],
                    callShowPointSelector = function (availablePointTypes) {
                        self.pointTypes(availablePointTypes);
                        self.activePointSelectorRequest(false);
                        self.activePointSelectorRow(-1);

                        dtiUtility.showPointSelector(reportUtil.getPointInspectorParams(filtersFilter));
                        dtiUtility.onPointSelect(pointSelectedCallback);
                    },
                    setFilterPoint = function (selectedPoint) {
                        newlyReferencedPoints.push(selectedPoint);
                        if (!!tempObject.AppIndex) {
                            delete tempObject.AppIndex;
                        }
                        tempObject.upi = selectedPoint._id;
                        tempObject.valueType = "UniquePID";
                        tempObject.value = selectedPoint.Name;
                        tempObject.pointType = selectedPoint["Point Type"].Value;
                        filterLogic.updateFilterFromPointRefs(tempObject);  // sets AppIndex;
                        if (tempObject.AppIndex) {
                            reportUtil.formatPoint(selectedPoint, pointRefUtil.getByAppIndex(tempObject.AppIndex));
                            filterLogic.updateListOfFilters(updatedList);
                        }
                    },
                    pointSelectedCallback = function (pointInfo) {
                        if (!!pointInfo) {
                            reportUtil.setPointInspectorParams(filtersFilter, pointInfo.filter);
                            ajaxCall("GET", null, getPointURL + pointInfo._id, setFilterPoint);
                        }
                    };

                if (!!tempObject.filterName) {
                    dtiUtility.getConfig("Utility.pointTypes.getAllowedPointTypes", [tempObject.filterName, "Report"], callShowPointSelector);
                } else {
                    callShowPointSelector([]);
                }
            },
            openForFilterMode: () => {
                if (!scheduledReport) {
                    var pointSelectedCallback = function (pointFilter) {
                        if (!!pointFilter) {
                            self.name1Filter(pointFilter.name1);
                            self.name2Filter(pointFilter.name2);
                            self.name3Filter(pointFilter.name3);
                            self.name4Filter(pointFilter.name4);
                            self.selectedPointTypesFilter(pointFilter.pointTypes);
                        }
                    };

                    dtiUtility.showPointFilter({
                        name1: self.name1Filter(),
                        name2: self.name2Filter(),
                        name3: self.name3Filter(),
                        name4: self.name4Filter(),
                        pointTypes: self.selectedPointTypesFilter(),
                        disableNewPoint: true
                    });
                    dtiUtility.onPointSelect(pointSelectedCallback);
                }
            }
        },
        pointRefUtil = {
            setNewReference: (refPointUPI, property) => {
                // console.log("- - - - pointRefUtil.setNewReference() called....   refPointUPI = " + refPointUPI + " property = " + property);
                var refPoint,
                    appIndex = pointRefUtil.getMaxAppIndexUsed(),
                    tempRef,
                    pushNewReferencedPoint = function (selectedPoint) {
                        newlyReferencedPoints.push(selectedPoint);
                    },
                    getNewPoint = function (upi) {
                        var result;
                        result = newlyReferencedPoints.filter(function (newPoint) {
                            return (newPoint._id === upi);
                        });
                        return result[0];
                    };

                refPoint = getNewPoint(refPointUPI);
                if (!!refPoint) {
                    var pointType = refPoint["Point Type"].Value;
                    tempRef = {};
                    tempRef.PropertyEnum = (!!ENUMSTEMPLATESENUMS.Properties ? ENUMSTEMPLATESENUMS.Properties[property].enum : "");
                    tempRef.PropertyName = property;
                    tempRef.Value = refPoint._id;
                    tempRef.PointInst = refPoint._id;
                    tempRef.AppIndex = ++appIndex;
                    tempRef.isDisplayable = true;
                    tempRef.isReadOnly = false;
                    tempRef.PointName = refPoint.Name;
                    tempRef.PointType = (!!ENUMSTEMPLATESENUMS["Point Types"] ? ENUMSTEMPLATESENUMS["Point Types"][pointType].enum : "");
                    reportPoint["Point Refs"].push(tempRef);
                } else {
                    if (!!refPointUPI) {
                        console.log("..  double check if this was a 'save' ..");
                        ajaxCall("GET", null, getPointURL + refPointUPI, pushNewReferencedPoint);
                    }
                    console.log("pointRefUtil.setNewReference() refPointUPI = " + refPointUPI + " property = " + property + "  refPoint = " + refPoint);
                }
            },
            cleanArray: () => {
                var i,
                    pointRef,
                    pointRefUsed = function (pRef) {
                        var answer = false,
                            columnReference,
                            filterReference;

                        if (pRef.PropertyName === "Column Point") {
                            columnReference = self.listOfColumns().filter(function (column) {
                                return (pRef.AppIndex === column.AppIndex);
                            });
                            answer = (columnReference.length > 0);
                        } else if (pRef.PropertyName === "Qualifier Point") {
                            filterReference = self.listOfFilters().filter(function (filter) {
                                return (pRef.AppIndex === filter.AppIndex);
                            });
                            answer = (filterReference.length > 0);
                        }

                        return answer;
                    };
                for (i = 0; i < reportPoint["Point Refs"].length; i++) {
                    pointRef = reportPoint["Point Refs"][i];
                    if (!!pointRef) {
                        if (pointRef.PropertyName === "Column Point" || pointRef.PropertyName === "Qualifier Point") {
                            if (!pointRefUsed(pointRef)) {
                                // console.log("- - - - pointRefUtil.cleanArray()   removing point ref[" + i + "] = " + pointRef.PointName);
                                reportPoint["Point Refs"].splice(i--, 1);
                            }
                        }
                    }
                }
            },
            getByAppIndex: (appIndex) => {
                var result = -1,
                    i;

                for (i = 0; i < reportPoint["Point Refs"].length; i++) {
                    if (reportPoint["Point Refs"][i].AppIndex === appIndex) {
                        result = i;
                        break;
                    }
                }

                return result;
            },
            getPointRef: (item, referenceType, lastTry) => {
                //console.log("- - - - pointRefUtil.getPointRef() called....   item.upi = " + item.upi + " item.AppIndex = " + item.AppIndex);
                var result,
                    upi = item.upi,
                    appIndex = item.AppIndex;

                if (!!appIndex || !!upi) {
                    result = reportPoint["Point Refs"].filter(function (pointRef) {
                        return (pointRef.AppIndex === appIndex || pointRef.Value === upi) && pointRef.PropertyName === referenceType;
                    });

                    if (result.length === 0) {
                        if (!!lastTry) {
                            return null;
                        } else {
                            if (!!upi) {
                                pointRefUtil.setNewReference(upi, referenceType);
                                return pointRefUtil.getPointRef(item, referenceType, true);
                            } else {
                                return null;
                            }
                        }
                    } else {
                        return result[0];
                    }
                } else {
                    return null;
                }
            },
            isSoftDeleted: (item, referenceType) => {
                var answer = false,
                    pointRef;

                if (item.AppIndex >= 0) {
                    pointRef = pointRefUtil.getPointRef(item, referenceType);
                    if (!!pointRef) {
                        if (pointRef.PointInst === 0) {
                            answer = true;
                        }
                    }
                }

                return answer;
            },
            isHardDeleted: (item, referenceType) => {
                var answer = true,
                    pointRef = pointRefUtil.getPointRef(item, referenceType);

                if (!!pointRef) {
                    answer = (pointRef.PointInst === 0 && pointRef.Value === 0);
                }
                return answer;
            },
            getMaxAppIndexUsed: () => {
                var answer = 0,
                    i;
                for (i = 0; i < reportPoint["Point Refs"].length; i++) {
                    if (answer < reportPoint["Point Refs"][i].AppIndex) {
                        answer = reportPoint["Point Refs"][i].AppIndex;
                    }
                }
                return answer;
            }
        },
        ui = {
            setCustomLineDensityOption: () => {
                let $datatablesLength = $tabViewReport.find(".dataTables_length"),
                    $lineDensityDiv,
                    $increaseDensity = $datatablesLength.find("i.material-icons.increaseDensity"),
                    $decreaseDensity = $datatablesLength.find("i.material-icons.decreaseDensity");

                if ($increaseDensity.length === 0) {
                    $lineDensityDiv = $('<div class= "lineDensity" title="Line density"></div>');
                    $lineDensityDiv.appendTo($datatablesLength);
                    $increaseDensity = $('<i class="material-icons tiny increaseDensity blue-grey-text" title="Increase line density">add</i>');
                    $increaseDensity.appendTo($lineDensityDiv);
                    $decreaseDensity = $('<i class="material-icons tiny decreaseDensity blue-grey-text" title="Decrease line density">remove</i>');
                    $decreaseDensity.appendTo($lineDensityDiv);

                    $increaseDensity.on("click", function (e, settings) {
                        let $dataTablesScrollWrapper = $tabViewReport.find(".DTFC_ScrollWrapper"),
                            $scrollBodyRows = $dataTablesScrollWrapper.find("tbody tr"),
                            $scrollBodyCells = $scrollBodyRows.find("td"),
                            redraw = true;

                        if ($scrollBodyRows.hasClass("small")) {
                            $scrollBodyRows.removeClass("small");
                            $scrollBodyCells.removeClass("small");
                            currentLineDensity = "";
                        } else if ($scrollBodyRows.hasClass("smaller")) {
                            $scrollBodyRows.removeClass("smaller");
                            $scrollBodyCells.removeClass("smaller");
                            $scrollBodyRows.addClass("small");
                            $scrollBodyCells.addClass("small");
                            currentLineDensity = "small";
                        } else if ($scrollBodyRows.hasClass("tiny")) {
                            $scrollBodyRows.removeClass("tiny");
                            $scrollBodyCells.removeClass("tiny");
                            $scrollBodyRows.addClass("smaller");
                            $scrollBodyCells.addClass("smaller");
                            currentLineDensity = "smaller";
                        } else {
                            redraw = false;
                        }
                        if (redraw) {
                            $dataTablePlaceHolder.DataTable().draw("current");
                        }
                    });

                    $decreaseDensity.on("click", function (e, settings) {
                        let $dataTablesScrollWrapper = $tabViewReport.find(".DTFC_ScrollWrapper"),
                            $scrollBodyRows = $dataTablesScrollWrapper.find("tbody tr"),
                            $scrollBodyCells = $scrollBodyRows.find("td"),
                            redraw = true;

                        if ($scrollBodyRows.hasClass("small")) {
                            $scrollBodyRows.removeClass("small");
                            $scrollBodyCells.removeClass("small");
                            $scrollBodyRows.addClass("smaller");
                            $scrollBodyCells.addClass("smaller");
                            currentLineDensity = "smaller";
                        } else if ($scrollBodyRows.hasClass("smaller")) {
                            $scrollBodyRows.removeClass("smaller");
                            $scrollBodyCells.removeClass("smaller");
                            $scrollBodyRows.addClass("tiny");
                            $scrollBodyCells.addClass("tiny");
                            currentLineDensity = "tiny";
                        } else if ($scrollBodyRows.hasClass("tiny")) {
                            redraw = false;
                        } else {
                            $scrollBodyRows.addClass("small");
                            $scrollBodyCells.addClass("small");
                            currentLineDensity = "small";
                        }
                        if (redraw) {
                            $dataTablePlaceHolder.DataTable().draw("current");
                        }
                    });
                } else {
                    let $dataTablesScrollWrapper = $tabViewReport.find(".DTFC_ScrollWrapper"),
                        $scrollBodyRows = $dataTablesScrollWrapper.find("tbody tr"),
                        $scrollBodyCells = $scrollBodyRows.find("td");

                    switch (currentLineDensity) {
                        case "":
                            $scrollBodyRows.removeClass("small smaller tiny");
                            $scrollBodyCells.removeClass("small smaller tiny");
                            break;
                        case "small":
                            $scrollBodyRows.removeClass("smaller tiny");
                            $scrollBodyCells.removeClass("smaller tiny");
                            $scrollBodyRows.addClass("small");
                            $scrollBodyCells.addClass("small");
                            break;
                        case "smaller":
                            $scrollBodyRows.removeClass("small tiny");
                            $scrollBodyCells.removeClass("small tiny");
                            $scrollBodyRows.addClass("smaller");
                            $scrollBodyCells.addClass("smaller");
                            break;
                        case "tiny":
                            $scrollBodyRows.removeClass("small smaller");
                            $scrollBodyCells.removeClass("small smaller");
                            $scrollBodyRows.addClass("tiny");
                            $scrollBodyCells.addClass("tiny");
                            break;
                    }
                }
            },
            setCustomDatatableInfo: () => {
                var numberOfPages = $dataTablePlaceHolder.DataTable().page.info().pages,
                    $tablePagination = $tabViewReport.find(".dataTables_paginate"),
                    $currentDateTimeDiv = $tablePagination.find(".reportDisplayFooter"),
                    $pagination = $tablePagination.find(".pagination"),
                    $paginate_buttons = $pagination.find("button"),
                    numberOfButtons = $paginate_buttons.length,
                    $datatablesLength = $tabViewReport.find(".dataTables_length"),
                    $datatablesLengthSelect = $datatablesLength.find("select");

                $pagination.hide();
                if (numberOfPages <= 1) {
                    $paginate_buttons = $paginate_buttons.not("li.active");
                    $paginate_buttons.hide();
                } else {
                    $paginate_buttons.hide();
                    $paginate_buttons.removeClass("mdl-button");
                    $paginate_buttons.addClass("btn blue-grey");
                    for (let i = 0; i < numberOfButtons; i++) {
                        if ($paginate_buttons[i].classList.contains("mdl-button--raised")) {
                            $paginate_buttons[i].classList.add("lighten-2");
                            $paginate_buttons[i].classList.remove("mdl-button--raised")
                        }
                    }
                    $paginate_buttons.show();
                    $pagination.show();
                }

                if ($currentDateTimeDiv.length > 0) {
                    $currentDateTimeDiv.text(self.currentTimeStamp);
                } else {
                    $currentDateTimeDiv = $("<div class='small reportDisplayFooter'>" + self.currentTimeStamp + "</div>");
                    $currentDateTimeDiv.prependTo($tablePagination);
                }

                if (!$datatablesLengthSelect.hasClass("blue-grey-text")) {
                    $datatablesLengthSelect.addClass("blue-grey-text");
                }

                ui.setCustomLineDensityOption();

                $datatablesLengthSelect.show();
            },
            getScreenFields: () => {
                $direports = $(document).find(".direports");
                $editColumnModal = $direports.find("#editColumnModal");
                $columnCardPanel = $direports.find(".columnCardPanel.card-panel");
                $globalEditColumnModal = $direports.find("#globalEditColumnModal");
                $tabConfiguration = $direports.find(".tabConfiguration");
                $configurationButton = $direports.find(".configurationButton");
                $saveReportButton = $direports.find(".saveReportButton");
                $tabViewReport = $direports.find(".tabViewReport");
                $viewReportButton = $direports.find(".viewReportButton");
                $viewReportNav = $tabViewReport.find(".viewReportNav");
                $dataTablePlaceHolder = $direports.find(".dataTablePlaceHolder");
                $rightPanel = $direports.find(".rightPanel");
                $columnsGrid = $direports.find(".columnsGrid");
                $gridColumnConfig = $direports.find("#gridColumnConfig");
                $gridColumnConfigTable = $direports.find(".gridColumnConfigTable");
                $filtersGrid = $direports.find(".filtersGrid");
                $reportTitleInput = $direports.find(".reportTitleInput");
                $filtersTbody = $direports.find(".filtersGrid .sortableFilters");
                $columnsTbody = $columnsGrid.find(".sortablecolumns");
                $gridColumnsTbody = $gridColumnConfigTable.find(".sortablecolumns");
                $reportColumns = $direports.find("#reportColumns");
                $additionalFilters = $direports.find("#additionalFilters");
                $reportChartDiv = $direports.find(".reportChartDiv");
                $queryResultSize = $additionalFilters.find(".queryResultSize span");
            },
            blockUI: ($control, state) => {
                if (state === true) {
                    $control.hide();
                } else {
                    $control.show();
                }
                $control.attr("disabled", state);
            },
            displayError: (errorMessage) => {
                dtiReporting.toast(errorMessage, 6000);
            },
            registerEvents: () => {
                var intervals,
                    calculations,
                    entriesPerPage,
                    reportTypes,
                    chartTypes,
                    $reportRangeDropdown,
                    $availableIntervalsContainer,
                    $reportStartDate,
                    $reportEndDate,
                    precisionEventsSet = false,
                    includeInChartEventsSet = false,
                    calculateEventsSet = false;

                $(window).resize(function () {
                    ui.handleResize();
                });

                setTimeout(function () {
                    if (!scheduledReport) {
                        $reportRangeDropdown = $additionalFilters.find('.reportRangeDropdown select');
                        $availableIntervalsContainer = $additionalFilters.find('.availableIntervalsContainer .dropdown-button');
                        $reportStartDate = $additionalFilters.find("#reportStartDate");
                        $reportEndDate = $additionalFilters.find("#reportEndDate");

                        $direports.find(".addColumnButton").on("click", function (e) {
                            var rowTemplate = columnLogic.getNewColumnTemplate(),
                                $newRow;
                            e.preventDefault();
                            e.stopPropagation();
                            if (self.listOfColumns.indexOf(rowTemplate) === -1) {
                                self.listOfColumns.push(rowTemplate);
                                columnLogic.updateListOfColumns(self.listOfColumns());
                                $newRow = $columnsTbody.find("tr:last");
                                $newRow.addClass("ui-sortable-handle");
                                $newRow.addClass("red lighten-4");
                                if (self.reportType() !== "Property") {
                                    self.selectPointForColumn(rowTemplate, (self.listOfColumns().length - 1));
                                }
                            }
                            ui.handleResize();
                            $reportColumns.stop().animate({
                                scrollTop: $reportColumns.get(0).scrollHeight
                            }, 700);
                        });

                        $direports.find(".addFilterbutton").on("click", function (e) {
                            var rowTemplate = {
                                filterName: "",
                                condition: "$and",
                                childLogic: false,
                                beginGroup: false,
                                endGroup: false,
                                operator: "EqualTo",
                                valueType: "String",
                                value: "",
                                valueList: "",
                                valueListMaxWidth: 0
                            };
                            e.preventDefault();
                            e.stopPropagation();
                            if (self.listOfFilters.indexOf(rowTemplate) === -1) {
                                self.listOfFilters.push(rowTemplate);
                                filterLogic.updateListOfFilters(self.listOfFilters());
                            }
                            ui.handleResize();
                            $additionalFilters.stop().animate({
                                scrollTop: $additionalFilters.get(0).scrollHeight
                            }, 700);
                        });

                        if (self.reportType() !== "Property") {
                            let tempDuration;
                            $reportRangeDropdown.on('change', function (e) {
                                var selectedRange = self.reportDateRangeCollection()[e.target.selectedIndex],
                                    dateRange,
                                    tempDuration = $.extend(true, {}, self.selectedDuration());

                                tempDuration.selectedRange = selectedRange;
                                if (tempDuration.selectedRange !== "Custom Range") {
                                    dateRange = reportDateRanges(tempDuration.selectedRange);
                                    tempDuration.startDate = reportUtil.getAdjustedDatetimeMoment(dateRange[0], self.durationStartTimeOffSet());
                                    tempDuration.endDate = reportUtil.getAdjustedDatetimeMoment(dateRange[1], self.durationEndTimeOffSet());
                                    $reportStartDate.pickadate('picker').set({select: tempDuration.startDate.unix() * 1000});
                                    $reportEndDate.pickadate('picker').set({select: tempDuration.endDate.unix() * 1000});
                                }

                                $reportStartDate.pickadate('picker').set({max: new Date($reportEndDate.pickadate('picker').get('select').pick)});
                                $reportEndDate.pickadate('picker').set({min: new Date($reportStartDate.pickadate('picker').get('select').pick)});
                                self.selectedDuration(tempDuration);
                            });

                            $reportStartDate.pickadate('picker').on({
                                set: function (thingToSet) {
                                    if (!!thingToSet.select) {
                                        tempDuration = $.extend(true, {}, self.selectedDuration());
                                        if ($reportStartDate.pickadate('picker').get('open') || $reportEndDate.pickadate('picker').get('open')) {
                                            $reportRangeDropdown.val("Custom Range");
                                            tempDuration.selectedRange = $reportRangeDropdown.val();
                                            tempDuration.startDate = reportUtil.getAdjustedDatetimeMoment(moment(this.get('select').pick), self.durationStartTimeOffSet());
                                            $reportRangeDropdown.material_select();
                                        }
                                        $reportEndDate.pickadate('picker').set({min: new Date(this.get('select').pick)});
                                        self.selectedDuration(tempDuration);
                                    }
                                }
                            });

                            $reportEndDate.pickadate('picker').on({
                                set: function (thingToSet) {
                                    if (!!thingToSet.select) {
                                        tempDuration = $.extend(true, {}, self.selectedDuration());
                                        if ($reportStartDate.pickadate('picker').get('open') || $reportEndDate.pickadate('picker').get('open')) {
                                            $reportRangeDropdown.val("Custom Range");
                                            tempDuration.selectedRange = $reportRangeDropdown.val();
                                            tempDuration.endDate = reportUtil.getAdjustedDatetimeMoment(moment(this.get('select').pick), self.durationEndTimeOffSet());
                                            $reportRangeDropdown.material_select();
                                        }
                                        $reportStartDate.pickadate('picker').set({max: new Date(this.get('select').pick)});
                                        self.selectedDuration(tempDuration);
                                    }
                                }
                            });
                        }

                        $saveReportButton.on("click", function () {
                            if (!self.activeSaveRequest()) {
                                saveManager.doSave();
                            }
                        });

                        $dataTablePlaceHolder.on("click", ".pointInstance", function () {
                            var $this = $(this),
                                data = {
                                    upi: $this.attr("upi"),
                                    pointType: $this.attr("pointType"),
                                    pointName: $this.text()
                                };

                            self.showPointReview(data);
                        });

                        $dataTablePlaceHolder.on("click", "td:not(:first-child)", function (e) {
                            let $this = $(this),
                                $target = $(e.target),
                                // clickedValue = $this.html(),
                                clickedValue = $this.text(),
                                clearFilterValue = "",
                                colIndex = e.target.cellIndex || $target.parent()[0].cellIndex,
                                offset = $target.offset(),
                                columnFilter = self.listOfColumns()[colIndex].searchFilter,
                                displayCardPanel = (self.listOfColumns()[colIndex].searchable && clickedValue !== "") || false,
                                columnFilterSet = (columnFilter !== "" && columnFilter !== undefined),
                                $dataTablesScrollBody = $tabViewReport.find(".dataTables_scrollBody"),
                                x = (offset.left - $target.offsetParent().offset().left) + ($target.width() - $columnCardPanel.width()),
                                // x = (colIndex < self.listOfColumns().length-1 ? offset.left : offset.left - 75),
                                y = offset.top + ($target.height() - $columnCardPanel.height());

                            // console.log("e.clientX x e.clientY = (" + e.clientX + "," + e.clientY + ")");
                            // console.log("offset.left x offset.top = (" + offset.left + "," + offset.top + ")");
                            // console.log("$target.width() x $target.height() = (" + $target.width() + "," + $target.height() + ")");
                            // console.log("$columnCardPanel.width() x $columnCardPanel.height() = (" + $columnCardPanel.width() + "," + $columnCardPanel.height() + ")");
                            // console.log("X x Y = (" + x + "," + y + ")");
                            $columnCardPanel.hide();

                            if (displayCardPanel) {
                                $columnCardPanel.css({
                                    position: "absolute",
                                    top: y,
                                    left: x
                                });

                                if (!columnFilterSet) {
                                    $columnCardPanel.find(".verbiage").text("Set Filter");
                                } else {
                                    $columnCardPanel.find(".verbiage").text("Clear Filter");
                                }

                                $dataTablesScrollBody.one("scroll", function (e) {
                                    $columnCardPanel.hide();
                                    return true;
                                });

                                self.currentColumnEditIndex(colIndex);
                                columnFilterValue = (!columnFilterSet ? clickedValue : clearFilterValue);
                                $columnCardPanel.show();
                                $columnCardPanel.focus();

                                $columnCardPanel.one("focusout", function (outEvent) {
                                    $columnCardPanel.hide();
                                });
                            }
                        });

                        $tabConfiguration.find(".toggleTab").on("shown.bs.tab", function () {
                            ui.adjustConfigTabActivePaneHeight();
                        });

                        $dataTablePlaceHolder.on("column-reorder.dt", function (event, settings, details) {
                            var columnsArray = $.extend(true, [], self.listOfColumns()),
                                swapColumnFrom = $.extend(true, {}, columnsArray[details.iFrom]), // clone from field
                                currentPageNumber = $dataTablePlaceHolder.DataTable().page.info().page;
                            columnsArray.splice(details.iFrom, 1);
                            columnsArray.splice(details.iTo, 0, swapColumnFrom);
                            columnLogic.updateListOfColumns(columnsArray);
                            $dataTablePlaceHolder.DataTable().page(currentPageNumber).draw(false);
                            console.log("moved column '" + details.from + "' to column '" + details.to + "'");
                            return true;
                        });

                        $dataTablePlaceHolder.on("order.dt", function (e, diff, edit) {
                            ui.setCustomLineDensityOption();
                            return true;
                        });

                        $dataTablePlaceHolder.on("length.dt", function (e, settings, len) {
                            self.selectedPageLength(len);
                            setTimeout(function () {
                                ui.adjustViewReportTabHeightWidth();
                                ui.setCustomLineDensityOption();
                                return true;
                            }, 10);
                        });

                        $dataTablePlaceHolder.on("page.dt", function (e, settings) {
                            setTimeout(function () {
                                ui.adjustViewReportTabHeightWidth();
                                return true;
                            }, 10);
                        });

                        $dataTablePlaceHolder.on("search.dt", function (e, settings) {
                            setTimeout(function () {
                                ui.adjustViewReportTabHeightWidth();
                                return true;
                            }, 10);
                        });

                        // $dataTablePlaceHolder.on( "buttons-action", function ( e, buttonApi, dataTable, node, config ) {
                        //     console.log( 'Button '+buttonApi.text()+' was activated' );
                        // });

                        $columnsGrid.find("th .calculateColumn").on("mousedown", function (e) {
                            if (self.canEdit()) {
                                longClickStart = moment();
                            }
                        });

                        $columnsGrid.find("th .calculateColumn").on("click", function (parentEvent) {
                            var $calculateColumnDiv = $(this),
                                toggleField = function (displayGlobalButton) {
                                    var forElementId = $globalCalculate.find("a").attr("data-activates"),
                                        $forElement = $globalCalculate.find("#" + forElementId);

                                    if (displayGlobalButton) {
                                        $globalCalculateText.removeClass("displayDiv");
                                        $globalCalculateText.addClass("hideDiv");
                                        $globalCalculate.removeClass("hideDiv");
                                        $globalCalculate.addClass("displayDiv");
                                        $globalCalculate.find("a").addClass("active");
                                        $forElement.addClass("active");
                                        $forElement.css("display", "block");
                                        $forElement.css("opacity", 1);
                                        $calculateColumnDiv.focus();
                                    } else if (!displayGlobalButton) {
                                        $globalCalculateText.addClass("displayDiv");
                                        $globalCalculateText.removeClass("hideDiv");
                                        $globalCalculate.addClass("hideDiv");
                                        $globalCalculate.removeClass("displayDiv");
                                        $globalCalculate.find("a").removeClass("active");
                                        $forElement.removeClass("active");
                                        $forElement.css("display", "none");
                                        $forElement.css("opacity", 0);
                                    }
                                    // $availableCalcs.removeClass("open");
                                    // $availableCalcs.find("a").removeClass("active");
                                    // $availableCalcs.find("a").attr("aria-expanded", false);
                                };

                            if (self.canEdit()) {
                                parentEvent.stopPropagation();
                                if (moment().diff(longClickStart) > longClickTimer) {
                                    $globalCalculateText = $columnsGrid.find("th .calculateColumn .columnText");
                                    $globalCalculate = $columnsGrid.find("th .globalCalculate");

                                    if (calculateEventsSet) {
                                        toggleField($globalCalculate.has($(parentEvent.target)).length > 0);
                                    } else {
                                        calculateEventsSet = true;
                                        toggleField(true);
                                        $calculateColumnDiv.on("focusout", function (outEvent) {
                                            if (!$calculateColumnDiv.is(":focus")) {  // clicked outside of div
                                                toggleField(false);
                                                calculateEventsSet = false;
                                                $(outEvent.target).off("focusout");
                                            }
                                        });
                                    }
                                }
                            }
                            return true;
                        });

                        $columnsGrid.find("th .precisionColumn").on("mousedown", function (e) {
                            if (self.canEdit()) {
                                longClickStart = moment();
                                $(this).off("keyup");
                            }
                        });

                        $columnsGrid.find("th .precisionColumn").on("click", function (e) {
                            var $precisionColumnDiv = $(this),
                                $precisionInputField = $precisionColumnDiv.find("input"),
                                toggleField = function (displayInput) {
                                    if (displayInput) {
                                        $globalPrecisionText.addClass("hideDiv");
                                        $precisionInputField.focus();
                                        $precisionInputField.removeClass("hideDiv");
                                        $globalPrecision.removeClass("hideDiv");
                                    } else {
                                        $globalPrecisionText.removeClass("hideDiv");
                                        $precisionInputField.addClass("hideDiv");
                                        $globalPrecision.addClass("hideDiv");
                                    }
                                };
                            if (self.canEdit()) {
                                if (moment().diff(longClickStart) > longClickTimer) {
                                    $globalPrecisionText = $columnsGrid.find("th .precisionColumn .columnText");
                                    $globalPrecision = $columnsGrid.find("th .precisionColumn .globalPrecision");

                                    toggleField(true);

                                    if (!precisionEventsSet) {
                                        toggleField(true);
                                        precisionEventsSet = true;
                                        $precisionInputField.on("focusout", function (outEvent) {
                                            if (!$precisionInputField.is(":focus")) {  // clicked outside of div
                                                toggleField(false);
                                                precisionEventsSet = false;
                                                $(outEvent.target).off("focusout");
                                            }
                                        });

                                        $(this).keyup(function (event) {
                                            if (event.keyCode === 13) {
                                                var precision;
                                                if (isNaN($(this).find("input").val()) || $(this).find("input").val() === "") {
                                                    $(this).find("input").val(0);
                                                }
                                                precision = $(this).find("input").val();
                                                self.globalPrecisionValue(parseInt(precision, 10));
                                                columnLogic.globalSetAllColumnValues("precision", self.globalPrecisionValue());
                                            }
                                            return true;
                                        });
                                    }
                                }
                            }
                            return true;
                        });

                        $columnsGrid.find("th .includeInChartColumn").on("mousedown", function (e) {
                            if (self.canEdit()) {
                                longClickStart = moment();
                            }
                        });

                        $columnsGrid.find("th .includeInChartColumn").on("click", function (e) {
                            var $includeInChartColumnDiv = $(this),
                                $includeInChartInputField = $includeInChartColumnDiv.find("input"),
                                toggleField = function (displayInput) {
                                    if (displayInput) {
                                        $globalIncludeInChartText.addClass("hideDiv");
                                        $includeInChartColumnDiv.focus();
                                        $includeInChartInputField.removeClass("hideDiv");
                                        $globalIncludeInChart.removeClass("hideDiv");
                                    } else {
                                        $globalIncludeInChartText.removeClass("hideDiv");
                                        $includeInChartInputField.addClass("hideDiv");
                                        $globalIncludeInChart.addClass("hideDiv");
                                    }
                                };
                            if (self.canEdit()) {
                                if (moment().diff(longClickStart) > longClickTimer) {
                                    $globalIncludeInChartText = $columnsGrid.find("th .includeInChartColumn .columnText");
                                    $globalIncludeInChart = $columnsGrid.find("th .includeInChartColumn .globalIncludeInChart");

                                    toggleField(true);

                                    if (!includeInChartEventsSet) {
                                        includeInChartEventsSet = true;
                                        toggleField(true);
                                        $includeInChartColumnDiv.on("focusout", function (outEvent) {
                                            if (!$includeInChartColumnDiv.is(":focus")) {  // clicked outside of div
                                                toggleField(false);
                                                includeInChartEventsSet = false;
                                                $includeInChartColumnDiv.off("focusout");
                                            }
                                        });

                                        $includeInChartInputField.click(function (event) {
                                            if (event.target.checked !== undefined) {
                                                columnLogic.globalSetAllColumnValues("includeInChart", event.target.checked);
                                                setTimeout(function () {
                                                    toggleField(false);
                                                    $includeInChartColumnDiv.blur();
                                                    $includeInChartColumnDiv.off("focusout");
                                                }, 800);
                                                return true;
                                            }
                                        });
                                    }
                                }
                            }
                            return true;
                        });

                        $filtersGrid.sortable({
                            appendTo: $filtersTbody,
                            disabled: false,
                            items: "tr",  // to skip first row  "tr:gt(0)"
                            forceHelperSize: true,
                            helper: "original",
                            change(event, ui) {
                                var item = ko.dataFor(ui.item[0]),
                                    placeholderRowIndex = ui.placeholder[0].rowIndex;

                                if (item.condition === "$or" && placeholderRowIndex === 0) {  // don't allow OR condition in first slot
                                    $(ui.helper[0]).addClass("invalid");
                                } else {
                                    $(ui.helper[0]).removeClass("invalid");
                                }
                            },
                            stop: function (event, ui) {
                                var tempArray,
                                    item = ko.dataFor(ui.item[0]),
                                    newIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                                if (newIndex >= self.listOfFilters().length) {
                                    newIndex = self.listOfFilters().length - 1;
                                }
                                if (newIndex < 0) {
                                    newIndex = 0;
                                }

                                if (item.condition === "$or" && newIndex === 0) {  // don't allow OR condition in first slot
                                    $filtersGrid.sortable('cancel');
                                } else {
                                    ui.item.remove();
                                    self.listOfFilters.remove(item);
                                    self.listOfFilters.splice(newIndex, 0, item);
                                    tempArray = self.listOfFilters();
                                    filterLogic.updateListOfFilters(tempArray);
                                }
                            },
                            scroll: true,
                            handle: ".handle"
                        });

                        $columnsGrid.sortable({
                            appendTo: $columnsTbody,
                            disabled: false,
                            items: "tr:not(.fixed)",
                            forceHelperSize: true,
                            helper: "original",
                            stop: function (event, ui) {
                                var tempArray,
                                    item = ko.dataFor(ui.item[0]),
                                    newIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                                if (newIndex >= self.listOfColumns().length) {
                                    newIndex = self.listOfColumns().length - 1;
                                    if (newIndex < 0) {
                                        newIndex = 0;
                                    }
                                }

                                ui.item.remove();
                                self.listOfColumns.remove(item);
                                self.listOfColumns.splice(newIndex, 0, item);
                                tempArray = self.listOfColumns();
                                columnLogic.updateListOfColumns(tempArray);
                            },
                            scroll: true,
                            handle: ".handle"
                        });

                        $gridColumnConfigTable.sortable({
                            appendTo: $gridColumnsTbody,
                            disabled: false,
                            items: "th:not(.fixed)",
                            forceHelperSize: true,
                            helper: "original",
                            stop: function (event, ui) {
                                var tempArray,
                                    item = ko.dataFor(ui.item[0]),
                                    newIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                                if (newIndex > 0) {
                                    if (newIndex >= self.listOfColumns().length) {
                                        newIndex = self.listOfColumns().length - 1;
                                    }
                                    if (newIndex < 0) {
                                        newIndex = 0;
                                    }

                                    ui.item.remove();
                                    self.listOfColumns.remove(item);
                                    self.listOfColumns.splice(newIndex, 0, item);
                                    tempArray = self.listOfColumns();
                                    columnLogic.updateListOfColumns(tempArray);
                                }
                            },
                            scroll: true,
                            handle: ".handle"
                        });
                    }
                }, 200);

                intervals = [
                    {
                        text: "Minute",
                        subDuration: 1000,
                        labelformat: {second: '%M'}
                    }, {
                        text: "Hour",
                        subDuration: 60 * 1000,
                        labelformat: {minute: '%M'}
                    }, {
                        text: "Day",
                        subDuration: 60 * 60 * 1000,
                        labelformat: {day: '%H:%M'}
                    }, {
                        text: "Week",
                        subDuration: 60 * 60 * 24 * 1000,
                        labelformat: {day: '%A'}
                    }, {
                        text: "Month",
                        subDuration: 60 * 60 * 24 * 7 * 1000,
                        labelformat: {week: '%e. %b'}
                    }, {
                        text: "Year",
                        subDuration: 60 * 60 * 24 * 30 * 1000,
                        labelformat: {month: '%b'}
                    }
                ];

                calculations = ["Mean", "Max", "Min", "Sum", "Std Dev"];

                entriesPerPage = [
                    {
                        value: "10",
                        unit: 10
                    }, {
                        value: "15",
                        unit: 15
                    }, {
                        value: "24",
                        unit: 24
                    }, {
                        value: "48",
                        unit: 48
                    }, {
                        value: "75",
                        unit: 75
                    }, {
                        value: "100",
                        unit: 100
                    }, {
                        value: "All",
                        unit: -1
                    }
                ];

                chartTypes = [
                    {
                        text: "Area",
                        value: "area"
                    }, {
                        text: "Column",
                        value: "column"
                    }, {
                        text: "Line",
                        value: "line"
                    }, {
                        text: "Pie",
                        value: "pie"
                    }, {
                        text: "Spline",
                        value: "spline"
                    }, {
                        text: "Timeslot",
                        value: "timeslot"
                    }, {
                        text: "Sum Timeslot",
                        value: "sum timeslot"
                    }
                ];

                if (!scheduledReport) {
                    reportTypes = Object.keys(ENUMSTEMPLATESENUMS["Report Types"]).map(function (e) {
                        return {
                            text: e,
                            enum: ENUMSTEMPLATESENUMS["Report Types"][e].enum
                        };
                    });
                } else {
                    reportTypes = [];
                }

                self.listOfIntervals(intervals);
                self.listOfCalculations(calculations);
                self.listOfEntriesPerPage(entriesPerPage);
                self.listOfChartTypes(chartTypes);
                self.listOfReportTypes(reportTypes);
            },
            adjustViewReportTabHeightWidth: () => {
                let bottomPadding = 10,
                    adjustHeight,
                    currentWindowHeight = window.innerHeight,
                    $dataTablesScrollBody,
                    $activePane = $tabViewReport.find(".tab-pane:visible");

                if ($activePane.attr("id") === "chartData") {
                    $activePane.css("height", (window.innerHeight - 90));
                    $activePane.css("width", "100%");
                } else if ($activePane.attr("id") === "gridData") {
                    $dataTablePlaceHolder.css("width", "100%");
                    $dataTablesScrollBody = $tabViewReport.find(".dataTables_scrollBody");
                    $dataTablesScrollBody.addClass("thinScroll");

                    ui.setCustomDatatableInfo();
                    adjustHeight = $dataTablesScrollBody.height() - (($tabViewReport.height() + bottomPadding) - currentWindowHeight);
                    $dataTablesScrollBody.css("height", adjustHeight);
                    //   $dataTablePlaceHolder.DataTable().page(currentPageNumber).draw(false);   *****  this call seems to kick off recursive loop ***
                    //   $dataTablePlaceHolder.DataTable().draw("current");  *****  this call seems to kick off recursive loop ***
                    $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;  // original way
                    $dataTablePlaceHolder.DataTable().fixedColumns().update();
                }
            },
            adjustConfigTabActivePaneHeight: () => {
                let $configPanes = $tabConfiguration.find(".configurationContent .tab-content .tab-pane");
                $configPanes.css("height", (window.innerHeight - 100));
            },
            handleResize: () => {
                lastResize = new Date();
                setTimeout(function () {
                    if (new Date() - lastResize >= resizeTimer) {
                        if (self.currentTab() === 2) {
                            if ($tabViewReport.find(".tab-pane:visible").attr("id") === "chartData") {
                                render.baseChart();
                            } else {
                                ui.adjustViewReportTabHeightWidth();
                            }
                        } else {
                            ui.adjustConfigTabActivePaneHeight();
                        }
                    }
                }, resizeTimer);
            },
            tabSwitch: (tabNumber) => {
                if ($.isNumeric(tabNumber)) {
                    self.currentTab(tabNumber);
                    switch (tabNumber) {
                        case 1:
                            $configurationButton.addClass("active");
                            $viewReportButton.removeClass("active");
                            $tabConfiguration.addClass("active");
                            $tabConfiguration.show();
                            $tabViewReport.removeClass("active");
                            $tabViewReport.hide();
                            break;
                        case 2:
                            $configurationButton.removeClass("active");
                            $viewReportButton.addClass("active");
                            $tabViewReport.addClass("active");
                            $tabConfiguration.removeClass("active");
                            $tabConfiguration.hide();
                            break;
                    }
                }
            },
            buildBitStringHtml: (config, rawValue, disabled) => {
                var htmlString = '<div class="bitstringReporting">',
                    enumValue;
                for (var key in config.bitstringEnums) {
                    if (config.bitstringEnums.hasOwnProperty(key)) {
                        if (key !== "All") {
                            enumValue = rawValue & config.bitstringEnums[key].enum;
                            htmlString += '<span' + (scheduledReport ? ' class = "nowrap">' : '>');
                            htmlString += '<input type="checkbox" ' + (enumValue > 0 ? 'checked ' : '') + (disabled ? 'disabled' : '');
                            htmlString += (scheduledReport ? '><span>' + key + '</span><br>' : '><label>' + key + '</label><br>');
                            htmlString += '</span>';
                        }
                    }
                }
                htmlString += '</div>';

                return htmlString;
            }
        },
        filterLogic = {
            updateListOfFilters: (newArray) => {
                self.listOfFilters([]);
                if (self.reportType() === "Property") {
                    self.listOfFilters(filterLogic.setFiltersParentChildLogic(newArray));
                } else {
                    self.listOfFilters(newArray);
                }
                self.designChanged(true);
                self.unSavedDesignChange(true);
                self.refreshData(true);
            },
            setFiltersParentChildLogic: (array) => {
                var filters = array,
                    i,
                    orConditionFound = false,
                    calcEndGroup = function (index) {
                        var answer = false,
                            nextCondition = ((index + 1) < filters.length) ? filters[index + 1] : undefined;
                        if ((!!nextCondition && nextCondition.condition === "$or") || (index === (filters.length - 1))) {
                            answer = true;
                        }
                        return answer;
                    };

                for (i = 0; i < filters.length; i++) {
                    filters[i].beginGroup = (i === 0);
                    filters[i].childLogic = false;

                    if (i === 0) {
                        filters[i].condition = "$and";
                    } else {
                        if (filters[i].condition === "$or") {
                            orConditionFound = true;
                            filters[i].beginGroup = true;
                        } else {
                            if (orConditionFound) {
                                filters[i].childLogic = true;
                            }
                        }
                    }
                    filters[i].endGroup = calcEndGroup(i);
                }

                return filters;
            },
            initializeNewFilter: (selectedItem, indexOfFilter) => {
                var filter = self.listOfFilters()[indexOfFilter],
                    prop = ENUMSTEMPLATESENUMS.Properties[selectedItem.name];

                filter.filterName = selectedItem.name;
                filter.condition = "$and";
                filter.operator = "EqualTo";
                filter.childLogic = false;
                filter.valueType = prop.valueType;
                filter.upi = 0;
                delete filter.AppIndex;
                filter.value = filterLogic.setDefaultFilterValue(filter.valueType);
                filter.valueList = [];
                reportUtil.setValueList(selectedItem.name, selectedItem.name, indexOfFilter, self.activePropertyFilterRequest);
                switch (filter.valueType) {
                    case "Timet":
                    case "DateTime":
                        filter.date = moment().unix();
                        filter.value = filter.date;
                        filter.time = 0;
                        break;
                    case "HourMinSec":
                    case "HourMin":
                    case "MinSec":
                        filter.hours = 0;
                        filter.minutes = 0;
                        filter.seconds = 0;
                        break;
                    case "Enum":
                        filter.evalue = -1;
                        break;
                    case "BitString":
                        filter.bitStringEnumsArray = reportUtil.getBitStringEnumsArray(ENUMSTEMPLATESENUMS[filter.filterName + " Bits"]);
                        break;
                }
                filterLogic.updateListOfFilters(self.listOfFilters());
            },
            setDefaultFilterValue: (valueType) => {
                var result;
                switch (valueType) {
                    case "Bool":
                    case "BitString":
                        result = 0;
                        break;
                    case "UniquePID":
                    case "undecided":
                    case "Float":
                    case "Integer":
                    case "Unsigned":
                    case "null":
                    case "MinSec":
                    case "HourMin":
                    case "HourMinSec":
                        result = 0;
                        break;
                    case "DateTime":
                    case "Timet":
                        result = moment().unix();
                        break;
                    case "Enum":
                    case "String":
                    case "None":
                        result = "";
                        break;
                    default:
                        result = "";
                        break;
                }

                return result;
            },
            initFilters: (theFilters) => {
                var result = [],
                    i,
                    currentFilter,
                    len = theFilters.length,
                    validFilter;

                for (i = 0; i < len; i++) {
                    currentFilter = theFilters[i];
                    validFilter = true;
                    if (!!currentFilter.AppIndex) {
                        filterLogic.updateFilterFromPointRefs(currentFilter);
                        if (!pointRefUtil.isHardDeleted(currentFilter, "Qualifier Point")) {
                            if (pointRefUtil.isSoftDeleted(currentFilter, "Qualifier Point")) {
                                console.log("softdeleted theFilters[" + i + "].upi = " + currentFilter.upi);
                                currentFilter.softDeleted = true;
                            }
                        } else {
                            validFilter = false;
                            console.log("'" + currentFilter.name + "' has been 'Destroyed', filter " + i + " is being removed from the displayed report.");
                        }
                    }

                    if (validFilter) {
                        currentFilter.valueList = [];
                        currentFilter.valueListMaxWidth = 0;
                        reportUtil.setValueList(currentFilter.filterName, currentFilter.filterName, result.length);
                        result.push(currentFilter);
                    }
                }

                return result;
            },
            validateFilters: (cleanup) => {
                var results = {},
                    pointRef,
                    filters,
                    filter,
                    i,
                    index,
                    validEnumEvalue = function (currentFilter) {
                        var answer = false,
                            foundValues;

                        if (currentFilter.evalue !== -1) {
                            foundValues = currentFilter.valueList.filter(function (availableValue) {
                                return availableValue.evalue === currentFilter.evalue;
                            });
                            answer = (foundValues.length > 0);
                        } else {
                            answer = true;  // -1 is blank placeholder.....
                        }

                        return answer;
                    },
                    checkFiltersForPointRefs = () => {
                        for (i = 0; i < self.listOfFilters().length; i++) {
                            filter = self.listOfFilters()[i];
                            if (filter.valueType === "UniquePID" && !!filter.AppIndex) {
                                filterLogic.updateFilterFromPointRefs(filter);
                            }
                        }
                    };

                results.collection = [];
                checkFiltersForPointRefs();
                filters = $.extend(true, [], self.listOfFilters());
                for (i = 0; i < filters.length; i++) {
                    filter = filters[i];
                    delete filter.error;
                    if (filter.filterName === "") {
                        filter.error = "Missing Filter property at index " + i;
                    } else {
                        switch (filter.valueType) {
                            case "Enum":
                                if (!validEnumEvalue(filter)) {
                                    console.log("- - filterLogic.validateFilters() Enum evalue not in ValueList " + filter.evalue);
                                }
                                break;
                            case "Unsigned":
                            case "Float":
                                if (!$.isNumeric(filter.value)) {
                                    filter.error = "Number is Invalid " + filter.value;
                                }
                                break;
                            case "BitString":
                                if (!$.isNumeric(filter.value)) {
                                    filter.error = "BitString is Invalid " + filter.value;
                                }
                                break;
                            case "Bool":
                                filter.value = (filter.value == "True" || filter.value == "true");
                                break;
                            case "Timet":
                            case "DateTime":
                                if (!moment.unix(filter.date).isValid()) {
                                    filter.error = "Invalid Date format in Filters";
                                }
                                if (parseInt(filter.time, 10) === 0) {
                                    filter.time = "00:00";
                                }
                                if (filter.time.toString().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                                    filter.value = reportUtil.getFilterAdjustedDatetime(filter);
                                } else {
                                    filter.error = "Invalid Time format in Filters";
                                }
                                break;
                            case "HourMinSec":
                            case "HourMin":
                            case "MinSec":
                                filter.hours = parseInt(filter.hours, 10);
                                filter.minutes = parseInt(filter.minutes, 10);
                                filter.seconds = parseInt(filter.seconds, 10);
                                filter.value = parseInt(filter.hours * 3600, 10);
                                filter.value += parseInt(filter.minutes * 60, 10);
                                filter.value += parseInt(filter.seconds, 10);
                                break;
                            case "UniquePID":
                                if (filter.upi > 0 && !!filter.AppIndex) {
                                    pointRef = pointRefUtil.getPointRef(filter, "Qualifier Point");
                                    if (!!pointRef) {
                                        filter.value = pointRef.PointName;
                                    } else {
                                        filter.error = "upi (" + filter.upi + ") not in pointref array";
                                    }
                                }
                                break;
                            case "None":
                                break;
                            case "String":
                                break;
                            default:
                                console.log("- - filterLogic.validateFilters() default for switch-n-case  " + filter.valueType);
                                break;
                        }
                    }

                    results.collection.push(filter);

                    if (filter.error) {
                        results.error = true;
                    }

                    if (cleanup && !filter.error && results.collection.length > 0) {  // clean fields only used during UI
                        index = results.collection.length - 1;
                        delete results.collection[index].valueList;
                        delete results.collection[index].valueType;
                        delete results.collection[index].error;
                        delete results.collection[index].softDeleted;
                        delete results.collection[index].upi;
                        delete results.collection[index].valueListMaxWidth;
                    }
                }

                if (cleanup) {
                    pointRefUtil.cleanArray();
                }

                return results;
            },
            getProperties: () => {
                var props,
                    listOfKeysToSkip = [],
                    prop,
                    key;

                props = (!!ENUMSTEMPLATESENUMS ? ENUMSTEMPLATESENUMS.Properties : {});
                for (key in props) {
                    if (props.hasOwnProperty(key)) {
                        if (props[key].reportEnable === true && $.inArray(key, listOfKeysToSkip) === -1) {
                            prop = {};
                            prop.name = key;
                            prop.valueType = props[key].valueType;
                            filtersPropertyFields.push(prop);
                        }
                    }
                }
                self.listOfFilterPropertiesLength = filtersPropertyFields.length;
            },
            updateFilterFromPointRefs: (filter) => {
                var existingPointRef = pointRefUtil.getPointRef(filter, "Qualifier Point");

                if (!!existingPointRef) {
                    filter.AppIndex = existingPointRef.AppIndex;
                    filter.upi = existingPointRef.Value;
                    filter.value = existingPointRef.PointName;
                } else {
                    console.log("ERROR - filterLogic.updateFilterFromPointRefs() could not locate Point Ref for upi = " + filter.value);
                }
            }
        },
        columnLogic = {
            updateListOfColumns: (newArray) => {
                self.listOfColumns([]);
                self.listOfColumns(newArray);
                reportCalc.checkForColumnCalculations();
                reportCalc.checkForIncludeInChart();
                self.designChanged(true);
                self.unSavedDesignChange(true);
                self.refreshData(true);
            },
            validColumn: (column, colIndex) => {
                var answer = {},
                    pointRef;

                if (column.colName === "Choose Point") {
                    answer.error = "Missing Column point at index " + colIndex;
                } else if (column.colName === "Choose Property") {
                    answer.error = "Missing Column property at index " + colIndex;
                } else if ((self.reportType() === "Totalizer") || (self.reportType() === "History")) {
                    if (column.colName !== "Date" && !!column.AppIndex) { //  skip first column  "Date"
                        pointRef = pointRefUtil.getPointRef(column, "Column Point");
                        if (pointRef === undefined) {
                            answer.error = "No corresponding 'Point Ref' for Column point at index " + colIndex;
                        }
                    }
                }
                if (column.operator === "Starts") {
                    column.precision = 0;
                }

                return answer;
            },
            validateColumns: (cleanup) => {
                var results = {},
                    localArray,
                    i,
                    validation,
                    index,
                    checkColumnsForPointRefs = () => {
                        var column;

                        for (i = 0; i < self.listOfColumns().length; i++) {
                            column = self.listOfColumns()[i];
                            if (!!column.AppIndex && i > 0) {
                                columnLogic.updateColumnFromPointRefs(column);
                            }
                        }
                    };

                results.collection = [];
                checkColumnsForPointRefs();
                localArray = $.extend(true, [], self.listOfColumns());
                for (i = 0; i < localArray.length; i++) {
                    validation = columnLogic.validColumn(localArray[i], i);
                    localArray[i].error = validation.error;
                    if (!!validation.error) {
                        results.error = true;
                    }
                    results.collection.push(localArray[i]);
                    index = results.collection.length - 1;

                    if (cleanup && !validation.error && results.collection.length > 0) { // these fields are only used in UI
                        delete results.collection[index].valueList;
                        delete results.collection[index].dataColumnName;
                        delete results.collection[index].rawValue;
                        delete results.collection[index].error;
                        delete results.collection[index].softDeleted;
                        delete results.collection[index].bitstringEnums;
                        delete results.collection[index].upi;
                        delete results.collection[index].searchable;
                        delete results.collection[index].searchFilter;
                        if (index !== 0) {
                            delete results.collection[index].colName;  // the first column is protected  (date || pointName)
                        }
                    }

                    delete self.listOfColumns()[index].searchFilter;  // remove for every request, only used for search filtering the result set in ui
                }

                if (cleanup) {
                    pointRefUtil.cleanArray();
                }

                return results;
            },
            initColumns: (theColumns) => {
                var result = [],
                    i,
                    len = theColumns.length,
                    currentColumn,
                    valid;

                for (i = 0; i < len; i++) {
                    currentColumn = theColumns[i];
                    valid = true;

                    if (!!currentColumn.AppIndex && i > 0) {
                        columnLogic.updateColumnFromPointRefs(currentColumn);
                        if (!pointRefUtil.isHardDeleted(currentColumn, "Column Point")) {
                            if (pointRefUtil.isSoftDeleted(currentColumn, "Column Point")) {
                                console.log("softdeleted theColumns[" + i + "].colName = " + theColumns[i].colName);
                                currentColumn.softDeleted = true;
                            }
                        } else {
                            valid = false;
                            console.log("'" + currentColumn.colName + "' has been 'Destroyed', column " + i + " is being removed from the displayed report.");
                        }
                    }

                    if (valid) {
                        currentColumn.canCalculate = reportCalc.columnCalculable(currentColumn);
                        currentColumn.searchFilter = "";
                        currentColumn.searchable = (nonSearchableColumnTypes.indexOf(currentColumn.valueType) === -1);
                        switch (self.reportType()) {
                            case "Property":
                                currentColumn.canBeCharted = reportCalc.columnChartable(currentColumn);
                                if (currentColumn.valueType === "BitString") {
                                    currentColumn.bitstringEnums = (!!ENUMSTEMPLATESENUMS ? ENUMSTEMPLATESENUMS[currentColumn.colName + " Bits"] : "");
                                }
                                currentColumn.dataColumnName = currentColumn.colName;
                                break;
                            case "History":
                                currentColumn.valueList = "";
                                currentColumn.canBeCharted = reportCalc.columnChartable(currentColumn);
                                currentColumn.dataColumnName = (i === 0 && currentColumn.colName === "Date" ? currentColumn.colName : currentColumn.upi);
                                if (!Array.isArray(currentColumn.calculation)) {
                                    currentColumn.calculation = [];
                                }
                                break;
                            case "Totalizer":
                                currentColumn.valueList = reportUtil.getTotalizerValueList(currentColumn.pointType);
                                currentColumn.canBeCharted = reportCalc.columnChartable(currentColumn);
                                currentColumn.dataColumnName = (i === 0 && currentColumn.colName === "Date" ? currentColumn.colName : currentColumn.upi + " - " + currentColumn.operator.toLowerCase());
                                if (!Array.isArray(currentColumn.calculation)) {
                                    currentColumn.calculation = [];
                                }
                                if (currentColumn.operator === "Starts") {
                                    currentColumn.precision = 0;
                                }
                                break;
                            default:
                                console.log(" - - - DEFAULT  columnLogic.initColumns()");
                                break;
                        }

                        result.push(currentColumn);
                    }
                }
                return result;
            },
            getProperties: () => {
                var listOfKeysToRemove = ["Name"];

                columnsPropertyFields = filtersPropertyFields.filter(function (enumProp) {
                    return ($.inArray(enumProp.name, listOfKeysToRemove) === -1);
                });
                self.listOfColumnPropertiesLength = columnsPropertyFields.length;
            },
            globalSetAllColumnValues: (columnField, newValue) => {
                self.listOfColumns().forEach(function (column) {
                    column[columnField] = newValue;
                });
                columnLogic.updateListOfColumns(self.listOfColumns());
            },
            updateColumnFromPointRefs: (column) => {
                var existingPointRef = pointRefUtil.getPointRef(column, "Column Point");

                if (!!existingPointRef) {
                    column.AppIndex = existingPointRef.AppIndex;
                    column.upi = existingPointRef.Value;
                    // column.colName = existingPointRef.PointName;  // TODO existing reports would use something like this
                } else {
                    console.log("ERROR - columnLogic.updateColumnFromPointRefs() could not locate Point Ref for upi = " + column.colName);
                }
            },
            getColumnConfigByOperatorAndUPI: (op, upi) => {
                var result;
                result = self.listOfColumns().filter(function (col) {
                    return (col.operator.toLowerCase() === op.toLowerCase() && col.upi === upi);
                });
                return result[0];
            },
            getColumnConfigByUPI: (upi) => {
                var result;
                result = self.listOfColumns().filter(function (col) {
                    return (col.upi === upi);
                });
                return result[0];
            },
            getNewColumnTemplate: () => {
                return {
                    calculation: [],
                    canBeCharted: false,
                    canCalculate: false,
                    colDisplayName: "",
                    colName: ((self.reportType() === "Totalizer") || (self.reportType() === "History") ? "Choose Point" : "Choose Property"),
                    dataColumnName: "",
                    filter: "",
                    includeInChart: false,
                    multiplier: 1,
                    operator: "",
                    pointType: "",
                    precision: 3,
                    units: "",
                    upi: 0,
                    valueList: [],
                    valueType: "String",
                    yaxisGroup: ""
                };
            }
        },
        dataParse = {
            formatDataField: (dataField, columnConfig) => {
                var keyBasedValue,
                    htmlString = "",
                    $customField,
                    rawValue,
                    result = {};

                if (typeof dataField !== "object") {
                    rawValue = dataField;
                } else if (typeof dataField === "object") {
                    rawValue = dataField.Value;
                    result = dataField;
                }
                result.rawValue = rawValue;
                if (rawValue !== null && rawValue !== undefined) {
                    if (!!columnConfig) {
                        switch (columnConfig.valueType) {
                            case "MinSec":
                                htmlString = '<div class="durationCtrl durationDisplay"><span class="min"></span><span class="timeSeg">min</span><span class="sec"></span><span class="timeSeg">sec</span></div>';
                                $customField = $(htmlString);
                                $customField.find(".min").html(~~((rawValue % 3600) / 60));
                                $customField.find(".sec").html(rawValue % 60);
                                result.Value = $customField.html();
                                break;
                            case "HourMin":
                                htmlString = '<div class="durationCtrl durationDisplay"><span class="hr"></span><span class="timeSeg">hr</span><span class="min"></span><span class="timeSeg">min</span></div>';
                                $customField = $(htmlString);
                                $customField.find(".hr").html(~~(rawValue / 3600));
                                $customField.find(".min").html(~~((rawValue % 3600) / 60));
                                result.Value = $customField.html();
                                break;
                            case "HourMinSec":
                                htmlString = '<div class="durationCtrl durationDisplay"><span class="hr"></span><span class="timeSeg">hr</span><span class="min"></span><span class="timeSeg">min</span><span class="sec"></span><span class="timeSeg">sec</span></div>';
                                $customField = $(htmlString);
                                $customField.find(".hr").html(~~(rawValue / 3600));
                                $customField.find(".min").html(~~((rawValue % 3600) / 60));
                                $customField.find(".sec").html(rawValue % 60);
                                result.Value = $customField.html();
                                break;
                            case "Float":
                            case "Double":
                            case "Integer":
                                if ($.isNumeric(rawValue)) {
                                    result.Value = reportUtil.toFixedComma(columnConfig.multiplier * rawValue, columnConfig.precision);
                                } else if (rawValue === "") {
                                    result.Value = 0;
                                    result.rawValue = 0;
                                    rawValue = 0;
                                } else {
                                    result.Value = rawValue;
                                }
                                break;
                            case "Unsigned":
                                if (rawValue === "") {
                                    result.Value = 0;
                                    result.rawValue = 0;
                                    rawValue = 0;
                                } else {
                                    result.Value = rawValue;
                                }
                                break;
                            case "String":
                                result.Value = rawValue;
                                break;
                            case "Bool":
                                if (result.Value !== "") {
                                    // var temp = result.Value.toString().toLowerCase();
                                    // result.Value = temp[0].toUpperCase() + temp.substring(1);
                                    if (result.Value == true) {
                                        result.Value = "Yes";
                                    } else {
                                        result.Value = "No";
                                    }
                                }
                                break;
                            case "BitString":
                                htmlString = ui.buildBitStringHtml(columnConfig, rawValue, true);
                                $customField = $(htmlString);
                                result.Value = $customField.html();
                                break;
                            case "Enum":
                            case "undecided":
                            case "null":
                            case "None":
                                if ($.isNumeric(rawValue) && self.reportType() !== 'Property') { // #271 Channel values were getting unwanted precision in property reports
                                    if (!!columnConfig.multiplier) {
                                        result.Value = reportUtil.toFixedComma(columnConfig.multiplier * rawValue, columnConfig.precision);
                                    } else {
                                        result.Value = reportUtil.toFixedComma(rawValue, columnConfig.precision);
                                    }
                                } else {
                                    result.Value = rawValue;
                                }
                                break;
                            case "DateTime":
                            case "Timet":
                                if ($.isNumeric(rawValue) && rawValue > 0) {
                                    result.Value = moment.unix(rawValue).format("MM/DD/YY HH:mm");
                                } else {
                                    result.Value = rawValue;
                                }
                                break;
                            case "UniquePID":
                                if (dataField.PointInst !== undefined) {
                                    if (dataField.PointInst > 0) {
                                        result.Value = dataField.PointName;
                                        result.rawValue = dataField.PointName;
                                    } else {
                                        result.Value = "None";
                                        result.rawValue = "";
                                    }
                                } else {
                                    // console.log("dataField.PointInst is UNDEFINED");
                                }
                                break;
                            default:
                                result.Value = rawValue;
                                break;
                        }
                        if (columnConfig.valueOptions !== undefined) {
                            keyBasedValue = reportUtil.getKeyBasedOnValue(columnConfig.valueOptions, rawValue);
                            if (!!keyBasedValue) {
                                result.Value = keyBasedValue;
                            }
                        }
                    } else {
                        console.log("dataParse.formatDataField()  columnConfig is undefined");
                    }
                }
                return result;
            },
            pivotHistoryData: (historyData) => {
                var columnConfig,
                    columnUPI,
                    columnKey,
                    pivotedData = [],
                    tempPivot,
                    lenHistoryData = historyData.length,
                    i,
                    j,
                    historyResults = [];

                for (i = 0; i < lenHistoryData; i++) {
                    historyResults = historyData[i].HistoryResults;
                    tempPivot = {};
                    tempPivot.Date = {};
                    tempPivot.Date.Value = moment.unix(historyData[i].timestamp).format("MM/DD/YY HH:mm");
                    tempPivot.Date.rawValue = historyData[i].timestamp;
                    for (j = 0; j < historyResults.length; j++) {
                        columnUPI = historyResults[j].upi;
                        columnKey = columnUPI;
                        tempPivot[columnKey] = {};
                        if (historyResults[j].Value === undefined) {
                            tempPivot[columnKey].Value = "";
                            tempPivot[columnKey].rawValue = "";
                        } else {
                            columnConfig = columnLogic.getColumnConfigByUPI(columnUPI);
                            if (columnConfig === undefined) {
                                console.log("ERROR: columnConfig is undefined for columnName = " + columnUPI);
                            }
                            //console.log("[" + i + "] ==>  historyResults[" + j + "].Value = " + historyResults[j].Value);
                            tempPivot[columnKey] = dataParse.formatDataField(historyResults[j], columnConfig);
                        }
                    }
                    pivotedData.push(tempPivot);
                }

                return pivotedData;
            },
            pivotTotalizerData: (totalizerData) => {
                var columnConfig,
                    columnKey,
                    pivotedData = [],
                    tempPivot,
                    rawValue,
                    operator,
                    numberOfColumnsFound = totalizerData.length,
                    i,
                    j;

                if (numberOfColumnsFound > 0 && totalizerData[0].totals) {
                    for (j = 0; j < totalizerData[0].totals.length; j++) {
                        tempPivot = {};
                        tempPivot.Date = {};
                        tempPivot.Date.Value = moment.unix(totalizerData[0].totals[j].range.start).format("MM/DD/YY HH:mm");
                        tempPivot.Date.rawValue = totalizerData[0].totals[j].range.start;
                        for (i = 0; i < numberOfColumnsFound; i++) {
                            operator = totalizerData[i].op.toLowerCase();
                            columnConfig = columnLogic.getColumnConfigByOperatorAndUPI(operator, totalizerData[i].upi);
                            columnKey = columnConfig.upi + " - " + operator;
                            rawValue = totalizerData[i].totals[j].total;
                            tempPivot[columnKey] = {};
                            //console.log("totalizerData[" + i + "].totals[" + j + "].total = " + totalizerData[i].totals[j]);
                            if (totalizerData[i].totals[j].total === undefined) {
                                tempPivot[columnKey].Value = "";
                                tempPivot[columnKey].rawValue = "";
                            } else {
                                if (operator === "runtime") {
                                    tempPivot[columnKey].Value = (rawValue === 0 ? 0 : getDurationText(columnConfig.multiplier * rawValue, columnConfig.precision, totalizerDurationInHours));
                                } else {
                                    tempPivot[columnKey].Value = reportUtil.toFixedComma(columnConfig.multiplier * rawValue, columnConfig.precision);
                                }
                                tempPivot[columnKey].rawValue = parseFloat(rawValue);
                            }
                        }
                        pivotedData.push(tempPivot);
                    }
                }

                return pivotedData;
            },
            cleanResultData: (data) => {
                var columnArray = $.extend(true, [], self.listOfColumns()),
                    columnConfig,
                    i,
                    j,
                    columnName,
                    columnDataFound;

                for (i = 0; i < data.length; i++) {
                    for (j = 0; j < columnArray.length; j++) {
                        columnConfig = columnArray[j];
                        columnName = (columnConfig.dataColumnName !== undefined ? columnConfig.dataColumnName : columnConfig.colName);
                        columnDataFound = (data[i][columnName] !== undefined);

                        if (!columnDataFound) {  // data was NOT found for this column
                            data[i][columnName] = {};
                            data[i][columnName].Value = "";
                            data[i][columnName].rawValue = "";
                        }

                        data[i][columnName] = dataParse.formatDataField(data[i][columnName], columnConfig);
                    }
                }

                return data;
            },
            setYaxisValues: (chartData) => {
                var i,
                    foundValues = [];

                for (i = 0; i < chartData.length; i++) {
                    if (foundValues.indexOf(chartData[i].yAxis, 0) === -1) {
                        foundValues.push(chartData[i].yAxis);
                    }
                }

                foundValues.sort();

                for (i = 0; i < chartData.length; i++) {
                    chartData[i].yAxis = foundValues.indexOf(chartData[i].yAxis);
                }

                return chartData;
            },
            getOnlyChartData: (data) => {
                self.activeRequestForChart(true);
                self.chartSpinnerTitle("Formatting Data for Chart");
                var columnArray = $.extend(true, [], self.listOfColumns()),
                    columnConfig,
                    i,
                    len = data.length,
                    j,
                    columnData = [],
                    columnDrillDownData = [],
                    columnsLength = columnArray.length,
                    columnName,
                    columnDataFound,
                    result = [],
                    fieldValue,
                    timeslotForDuration,
                    columnSum = 0,
                    totalAmount = 0,
                    sumsForProperties = {},
                    sumsForTimeOfUse,
                    drilldown = {},
                    startOfDuration = moment().startOf(timeOfUseDuration.text),
                    parseDuration = (millisecs) => { // in milliseconds
                        let answer = {
                                year: 0,
                                month: 0,
                                week: 0,
                                day: 0,
                                hour: 0,
                                min: 0
                            },
                            duration = moment.duration(millisecs);

                        switch (timeOfUseDuration.text) {
                            case "Minute":
                                answer.hour = duration.asHours();
                                if (parseInt(answer.hour, 10) > 1) {
                                    answer.min = duration.subtract(parseInt(answer.hour, 10) * millisecondsInHour).asMinutes();
                                } else {
                                    answer.hour = 0;
                                    answer.min = duration.asMinutes();
                                }
                                break;
                            case "Hour":
                                answer.day = duration.asDays();
                                if (parseInt(answer.day, 10) > 1) {
                                    answer.hour = duration.subtract(parseInt(answer.day, 10) * 24 * millisecondsInHour).asHours();
                                } else {
                                    answer.day = 0;
                                    answer.hour = duration.asHours();
                                }

                                answer.hour = duration.asHours();
                                if (parseInt(answer.hour, 10) > 1) {
                                    answer.min = duration.subtract(parseInt(answer.hour, 10) * millisecondsInHour).asMinutes();
                                } else {
                                    answer.hour = 0;
                                    answer.min = duration.asMinutes();
                                }

                                break;
                            case "Day":
                                answer.day = duration.asDays();
                                if (parseInt(answer.day, 10) > 1) {
                                    answer.hour = duration.subtract(parseInt(answer.day, 10) * 24 * millisecondsInHour).asHours();
                                } else {
                                    answer.day = 0;
                                    answer.hour = duration.asHours();
                                }

                                answer.hour = duration.asHours();
                                if (parseInt(answer.hour, 10) > 1) {
                                    answer.min = duration.subtract(parseInt(answer.hour, 10) * millisecondsInHour).asMinutes();
                                } else {
                                    answer.hour = 0;
                                    answer.min = duration.asMinutes();
                                }
                                break;
                            case "Week":
                                answer.month = duration.asMonths();
                                if (parseInt(answer.month, 10) > 1) {
                                    answer.week = duration.subtract(parseInt(answer.month, 10) * 24 * 7 * 4 * millisecondsInHour).asWeeks();
                                } else {
                                    answer.month = 0;
                                    answer.week = duration.asWeeks();
                                }
                                break;
                            case "Month":
                                answer.month = duration.asMonths();
                                if (parseInt(answer.month, 10) > 1) {
                                    answer.week = duration.subtract(parseInt(answer.month, 10) * 24 * 7 * 4 * millisecondsInHour).asWeeks();
                                } else {
                                    answer.month = 0;
                                    answer.week = parseInt(duration.asWeeks(), 10);
                                }
                                break;
                            case "Year":
                                answer.year = duration.asYears();
                                if (parseInt(answer.year, 10) > 1) {
                                    answer.month = duration.subtract(parseInt(answer.year, 10) * 24 * 365 * millisecondsInHour).asMonths();
                                } else {
                                    answer.year = 0;
                                    answer.month = duration.asMonths();
                                }
                                break;
                            default:
                                break;
                        }

                        return answer;
                    },
                    getTimeOfUseDateTime = (rawtime) => {
                        let mDateTime = moment.unix(rawtime),
                            startOfThisDateTime = mDateTime.clone().startOf(timeOfUseDuration.text),
                            duration = moment.duration(mDateTime.diff(startOfThisDateTime)),
                            adjustedDateTime = startOfDuration.clone(),
                            parsedDuration = parseDuration(duration.asMilliseconds());

                        adjustedDateTime.add(parsedDuration.month, 'months');
                        adjustedDateTime.add(parsedDuration.week, 'weeks');
                        adjustedDateTime.add(parsedDuration.day, 'days');
                        adjustedDateTime.add(parsedDuration.hour, 'hours');
                        adjustedDateTime.add(parsedDuration.min, 'minutes');

                        return adjustedDateTime.unix();
                    };

                if (self.reportType() === "Property") {
                    self.selectedChartType("Pie");
                }
                for (j = 1; j < columnsLength; j++) {
                    columnSum = 0;
                    columnConfig = {};
                    columnConfig = columnArray[j];
                    columnName = (columnConfig.dataColumnName !== undefined ? columnConfig.dataColumnName : columnConfig.colName);
                    if (columnConfig.includeInChart == true) {
                        if (self.selectedChartType() !== "Pie") {
                            columnData = [];
                        }
                        sumsForProperties[columnName] = {};
                        sumsForTimeOfUse = {};
                        for (i = 0; i < len; i++) { // loop across entire column data set
                            columnDataFound = (data[i][columnName] !== undefined);
                            if (columnDataFound) {
                                fieldValue = reportUtil.parseNumberValue(data[i][columnName].Value, data[i][columnName].rawValue, data[i][columnName].eValue);
                                switch (self.reportType()) {
                                    case "History":
                                    case "Totalizer":
                                        switch (self.selectedChartType()) {
                                            case "Pie":
                                                columnSum += parseFloat(data[i][columnName].rawValue);
                                                break;
                                            case "Timeslot":
                                                timeslotForDuration = getTimeOfUseDateTime(data[i].Date.rawValue);
                                                columnData.push({
                                                    x: moment.unix(timeslotForDuration).toDate(),
                                                    y: fieldValue,
                                                    timeStamp: data[i].Date.rawValue
                                                });
                                                break;
                                            case "Sum Timeslot":
                                                timeslotForDuration = getTimeOfUseDateTime(data[i].Date.rawValue);
                                                if (sumsForTimeOfUse[timeslotForDuration] === undefined) {
                                                    sumsForTimeOfUse[timeslotForDuration] = {};
                                                    sumsForTimeOfUse[timeslotForDuration].sum = 0;
                                                }

                                                sumsForTimeOfUse[timeslotForDuration].sum += fieldValue;
                                                break;
                                            default:
                                                columnData.push({
                                                    timeStamp: moment.unix(data[i].Date.rawValue).toDate(),
                                                    value: fieldValue,
                                                    enumText: (!!columnConfig.valueOptions ? reportUtil.getKeyBasedOnValue(columnConfig.valueOptions, fieldValue) : "")
                                                });
                                                break;
                                        }
                                        break;
                                    case "Property":
                                        if (self.selectedChartType() === "Pie") {
                                            if (sumsForProperties[columnName][data[i][columnName].rawValue] === undefined) {
                                                sumsForProperties[columnName][data[i][columnName].rawValue] = 0;
                                            }
                                            sumsForProperties[columnName][data[i][columnName].rawValue] += 1;
                                        } else {
                                            columnData.push({
                                                value: fieldValue
                                            });
                                        }
                                        break;
                                    default:
                                        console.log(" - - - DEFAULT  dataParse.getOnlyChartData()");
                                        break;
                                }
                            } else {  // data was NOT found for this column
                                console.log("data[" + i + " ][" + columnName + "] not found");
                            }
                        }

                        if (self.reportType() === "Property") {
                            drilldown.series = [];
                            let fieldName = columnName;
                            if (sumsForProperties.hasOwnProperty(fieldName)) {
                                columnData = [];
                                columnDrillDownData = [];
                                for (var enumName in sumsForProperties[fieldName]) {
                                    if (sumsForProperties[fieldName].hasOwnProperty(enumName)) {
                                        columnData.push({
                                            name: enumName,
                                            y: parseFloat(sumsForProperties[fieldName][enumName]),
                                            drilldown: enumName
                                        });

                                        // console.log(fieldName + " has " + enumName + " = " + sumsForProperties[fieldName][enumName]);
                                        columnDrillDownData.push({
                                            enumName: parseFloat(sumsForProperties[fieldName][enumName])
                                        });
                                        totalAmount += parseFloat(sumsForProperties[fieldName][enumName]);
                                    }
                                }
                                // TODO if we want to drill down into layers of data
                                // drilldown.series.push({
                                //     name: fieldName,
                                //     id: fieldName,
                                //     data: columnDrillDownData
                                // });

                                for (i = 0; i < columnData.length; i++) {
                                    columnData[i].y = parseFloat(reportUtil.toFixed((columnData[i].y / totalAmount) * 100, 3));
                                }

                                result.push({
                                    name: fieldName,
                                    colorByPoint: true,
                                    data: columnData,
                                    drilldown: drilldown
                                });
                            }
                        } else {
                            switch (self.selectedChartType()) {
                                case "Pie":
                                    columnData.push({
                                        name: columnConfig.colName,
                                        y: parseFloat(columnSum)
                                    });
                                    totalAmount += parseFloat(columnSum);
                                    break;
                                case "Timeslot":
                                    if (columnData.length > 0) {
                                        result.push({
                                            data: columnData,
                                            name: columnConfig.colName,
                                            // marker: (self.selectedChartType() !== "Timeslot") ? undefined : {
                                            //     // symbol: "circle",
                                            //     fillColor: "rgba(140, 95, 138, 0.35)"
                                            // },
                                            // _colorIndex: (self.selectedChartType() !== "Timeslot") ? undefined : 0,  // TODO  color seems to be broken
                                            color: "rgba(140, 95, 138, 0.35)",
                                            // fillColor: "rgba(140, 95, 138, 0.35)",
                                            pointInterval: (24 * 3600 * 1000) // one day (in milisec.)
                                        });
                                    }
                                    break;
                                case "Sum Timeslot":
                                    for (let key in sumsForTimeOfUse) {
                                        if (sumsForTimeOfUse.hasOwnProperty(key)) {
                                            columnData.push({
                                                x: moment.unix(key).toDate(),
                                                y: sumsForTimeOfUse[key].sum
                                            });
                                        }
                                    }

                                    result.push({
                                        name: columnConfig.colName,
                                        data: columnData,
                                        pointInterval: (24 * 3600 * 1000) // one day (in milisec.)
                                    });

                                    break;
                                default:
                                    if (columnData.length > 0) {
                                        result.push({
                                            data: columnData,
                                            name: columnConfig.colName,
                                            yAxis: self.yaxisGroups.indexOf(columnConfig.yaxisGroup)
                                        });
                                    }
                                    break;
                            }
                        }
                    }
                }
                if (self.selectedChartType() === "Pie" && self.reportType() !== "Property") {
                    for (i = 0; i < columnData.length; i++) {
                        columnData[i].y = parseFloat(reportUtil.toFixed((columnData[i].y / totalAmount) * 100, 3));
                    }
                    result.push({
                        name: "Total",
                        colorByPoint: true,
                        data: columnData,
                        drilldown: drilldown
                    });
                }
                return (self.selectedChartType() !== "Pie" && self.selectedChartType() !== "Timeslot") ? dataParse.setYaxisValues(result) : result;
            }
        },
        formatForPDF = {
            getColumnConfigWidthAndHeight: (dataField, columnConfig) => {
                var result = {
                        width: 0,
                        height: 0
                    },
                    dataFieldWidth = dataField.length;

                if (!!columnConfig) {
                    switch (columnConfig.valueType) {
                        case "MinSec":
                            result.height++;
                            result.width = "##min ##sec".length;
                            break;
                        case "HourMin":
                            result.height++;
                            result.width = "##hr ##min".length;
                            break;
                        case "HourMinSec":
                            result.height++;
                            result.width = "##hr ##min ##sec".length;
                            break;
                        case "BitString":
                            result.width++;  // checkbox
                            for (var key in columnConfig.bitstringEnums) {
                                if (columnConfig.bitstringEnums.hasOwnProperty(key)) {
                                    if (result.width < key.length) {
                                        result.width = key.length;
                                    }
                                    if (key.toLowerCase() !== "all") { // special case for Bitstring  "All" not displayed
                                        result.height++;
                                    }
                                }
                            }
                            break;
                        case "String":
                        case "Enum":
                        case "undecided":
                        case "null":
                        case "None":
                            result.height++;
                            result.width = dataFieldWidth;
                            break;
                        default:
                            result.height++;
                            result.width = dataFieldWidth;
                            break;
                    }
                }

                return result;
            },
            breakReportDataIntoPrintablePages: () => {
                // widthOfA4Portrait300PPI = 2480,
                // heightOfA4Portrait300PPI = 3508,
                // maxNumberOfCharsPerRow = (self.reportType() === "Property" ? 150 : 146),
                var maxNumberOfCharsPerRow = 146,
                    dataIndex = {
                        columnStartIdx: 0,
                        columnStopIdx: 0,
                        rowStartIdx: 0,
                        rowStopIdx: 0,
                        gridRowStartIdx: 0,
                        gridRowStopIdx: 0
                    },
                    columnRange = 1,
                    pagenumber = 1,
                    j,
                    columnRangeNeeded = false,
                    reportDataPages = [],
                    columnsArray = $.extend(true, [], self.listOfColumns()),
                    maxRowsOnPDFPage = () => {
                        var answer;

                        if (self.reportType() === "Property") {
                            answer = 24;
                        } else {  // History & Totalizer
                            answer = 24;
                        }

                        return answer;
                    },
                    sortPropertyReportDataForExport = () => {
                        reportData.sort(function (a, b) {
                            var result,
                                aName = a.Name.Value.toLowerCase(),
                                bName = b.Name.Value.toLowerCase();

                            if (aName < bName) {
                                result = -1;
                            } else if (aName > bName) {
                                result = 1;
                            } else {
                                result = 0;
                            }
                            return result;
                        });

                    },
                    buildPageData = () => {
                        var row,
                            currentPage = [],
                            headerArray = [],
                            rowArray = [],
                            dataRowIndex = dataIndex.rowStartIdx,
                            buildHeaderArray = () => {
                                if (columnsArray[0].colDisplayName !== undefined) {
                                    if (columnRangeNeeded) {
                                        headerArray.push({Value: columnsArray[0].colDisplayName + " Range " + columnRange});
                                    } else {
                                        headerArray.push({Value: columnsArray[0].colDisplayName});
                                    }

                                }
                                if (columnsArray.length > 1) {  // property reports can have a single column
                                    for (j = dataIndex.columnStartIdx; j < dataIndex.columnStopIdx; j++) {  // add column headers
                                        if (!!columnsArray[j] && columnsArray[j].dataColumnName !== undefined) {
                                            headerArray.push({Value: columnsArray[j].colDisplayName});
                                        }
                                    }
                                }
                            };

                        buildHeaderArray();

                        //console.log("  buildPageData()  dataIndex = " + JSON.stringify(dataIndex));
                        while (dataRowIndex <= dataIndex.rowStopIdx && dataRowIndex < reportData.length) {
                            row = reportData[dataRowIndex];
                            rowArray = [];
                            if (columnsArray[0].dataColumnName !== undefined) {
                                rowArray.push(row[columnsArray[0].dataColumnName]);
                            }
                            if (columnsArray.length > 1) {  // property reports can have a single column
                                for (j = dataIndex.columnStartIdx; j < dataIndex.columnStopIdx; j++) {
                                    if (!!columnsArray[j] && columnsArray[j].dataColumnName !== undefined) {
                                        rowArray.push(row[columnsArray[j].dataColumnName]);
                                    }
                                }
                            }
                            currentPage.push({cells: rowArray});
                            dataRowIndex++;
                        }

                        if (headerArray.length > 0 && currentPage.length > 0) {
                            reportDataPages.push({
                                header: headerArray,
                                rows: currentPage
                            });
                        }

                        //console.log("columnsArray.length = " + columnsArray.length + "   reportData.length = " + reportData.length);
                        if (dataIndex.columnStopIdx < (columnsArray.length - 1)) {  // set indexes to next chunk column of data
                            dataIndex.columnStartIdx = dataIndex.columnStopIdx;
                            dataIndex.rowStartIdx = dataIndex.gridRowStartIdx;
                            dataIndex.gridRowStopIdx = dataIndex.rowStopIdx;
                        } else if (dataIndex.rowStopIdx < reportData.length) {
                            dataIndex.rowStartIdx = dataIndex.rowStopIdx + 1;
                            dataIndex.gridRowStartIdx = dataIndex.rowStartIdx;
                            dataIndex.gridRowStopIdx = reportData.length - 1;
                            dataIndex.columnStartIdx = (columnsArray.length === 1 ? 0 : 1); // property reports can have a single column
                            if (columnRangeNeeded) {
                                columnRange++;
                                columnRangeNeeded = false;  // displayed all data for current range
                            }
                        } else {
                            // console.log("------ ALL DONE ------  (I think)  ");
                        }

                        dataIndex.columnStopIdx = (columnsArray.length);
                        dataIndex.rowStopIdx = (reportData.length - 1);
                    },
                    nextPageHasData = () => {
                        var nextPageFound = false,
                            maxRowsFound = false,
                            maxColumnsFound = false,
                            columnIndex,
                            minColumnWidth = {},
                            minRowHeight = {},
                            maxHeaderHeight = 0,
                            maxColumnOneWidth = 0,
                            maxColumnDataWidth = 0,
                            maxColumnDataHeight = 0,
                            headerSize,
                            dataSize,
                            columnOneSize,  // "Date" || "Name" Column
                            currentPageWidth = 0,
                            currentPageHeight = 0,
                            rowIndex = dataIndex.rowStartIdx,
                            getCurrentCellWidthAndHeight = function (cellData, colIndex) {
                                var answer = {
                                        width: 0,
                                        height: 1
                                    },
                                    idx,
                                    wordsInCell,
                                    wordSizes = [];

                                if (typeof cellData !== "string") {
                                    wordsInCell = cellData.toString().split(" ");
                                } else {
                                    wordsInCell = cellData.split(" ");
                                }

                                for (idx = 0; idx < wordsInCell.length; idx++) {
                                    wordSizes.push(wordsInCell[idx].length);
                                }

                                if (colIndex !== undefined) { // specially formatted column
                                    answer = formatForPDF.getColumnConfigWidthAndHeight(cellData.toString(), columnsArray[colIndex]);
                                } else {
                                    answer.height = wordSizes.length;
                                    if (wordSizes.length > 0) {
                                        answer.width = Math.max.apply(null, wordSizes);
                                    }
                                }

                                answer.width++; // one space per cell (min)

                                return answer;
                            },
                            getColumnHeaderWidthAndHeight = function (colIndex) {
                                var fieldDimensions = {
                                    width: 0,
                                    height: 0
                                };

                                if (columnsArray[colIndex].dataColumnName !== undefined) {
                                    fieldDimensions = getCurrentCellWidthAndHeight(columnsArray[colIndex].colDisplayName);
                                }
                                return fieldDimensions;
                            },
                            getColumnDataWidthAndHeight = function (rowIndex, colIndex) {
                                var row = reportData[rowIndex],
                                    dataValue,
                                    fieldDimensions = {
                                        width: 0,
                                        height: 0
                                    };

                                if (columnsArray[colIndex].dataColumnName !== undefined) {
                                    dataValue = row[columnsArray[colIndex].dataColumnName].Value;
                                    fieldDimensions = getCurrentCellWidthAndHeight(dataValue, colIndex);
                                }

                                return fieldDimensions;
                            };

                        if (columnsArray.length > 0) {
                            columnIndex = dataIndex.columnStartIdx;
                            if (columnRangeNeeded === true) {  // table had to be broken up into a grid. don't use more/less data than first grid in table
                                dataIndex.rowStopIdx = dataIndex.gridRowStopIdx;
                            }
                            if (columnIndex < columnsArray.length && rowIndex <= dataIndex.rowStopIdx) {
                                nextPageFound = true;
                            }
                            while (columnIndex < columnsArray.length && !maxColumnsFound) {
                                headerSize = getColumnHeaderWidthAndHeight(columnIndex);

                                if (headerSize.height > maxHeaderHeight) {
                                    maxHeaderHeight = headerSize.height;
                                }

                                rowIndex = dataIndex.rowStartIdx;
                                maxRowsFound = false;
                                currentPageHeight = 0;
                                minColumnWidth[columnIndex] = 0;
                                maxColumnDataWidth = 0;
                                maxColumnDataHeight = 0;
                                while (rowIndex <= dataIndex.rowStopIdx && !maxRowsFound) {
                                    dataSize = getColumnDataWidthAndHeight(rowIndex, columnIndex);
                                    columnOneSize = getColumnDataWidthAndHeight(rowIndex, 0);

                                    if (columnOneSize.width > maxColumnOneWidth) {
                                        maxColumnOneWidth = columnOneSize.width;
                                    }

                                    if (dataSize.width > maxColumnDataWidth) {
                                        maxColumnDataWidth = dataSize.width;
                                    }

                                    if (dataSize.height > maxColumnDataHeight) {
                                        maxColumnDataHeight = dataSize.height;
                                    }

                                    minRowHeight[rowIndex] = (!!minRowHeight[rowIndex] ? Math.max(minRowHeight[rowIndex], dataSize.height) : dataSize.height);
                                    if ((currentPageHeight + minRowHeight[rowIndex]) <= maxRowsOnPDFPage() - maxHeaderHeight) {
                                        currentPageHeight += minRowHeight[rowIndex];
                                        rowIndex++;
                                    } else {
                                        dataIndex.rowStopIdx = (rowIndex < reportData.length ? rowIndex : (reportData.length - 1));
                                        maxRowsFound = true;
                                    }
                                }

                                minColumnWidth[columnIndex] = (!!minColumnWidth[columnIndex] ? Math.max(minColumnWidth[columnIndex], headerSize.width, maxColumnDataWidth) : Math.max(headerSize.width, maxColumnDataWidth));
                                if ((currentPageWidth + minColumnWidth[columnIndex]) <= maxNumberOfCharsPerRow) {
                                    if (currentPageWidth === 0) {
                                        currentPageWidth += (minColumnWidth[columnIndex] + maxColumnOneWidth);
                                    } else {
                                        currentPageWidth += minColumnWidth[columnIndex];
                                    }
                                    columnIndex++;
                                } else {
                                    columnRangeNeeded = (columnIndex < (columnsArray.length - 1));
                                    // console.log("                      columnRangeNeeded = " + columnRangeNeeded + "  columnIndex = " + columnIndex);
                                    dataIndex.columnStopIdx = columnIndex;
                                    maxColumnsFound = true;
                                }
                            }
                        }

                        // console.log("     ------- pagenumber = " + pagenumber++ + "   Page size = " + currentPageWidth + " x " + currentPageHeight);
                        // console.log("  nextPageHasData()  dataIndex = " + JSON.stringify(dataIndex));

                        return nextPageFound;
                    };

                if (reportData !== undefined) {
                    dataIndex.columnStartIdx = (columnsArray.length === 1 ? 0 : 1);  // set indexes to full data set.   property reports can have a single column
                    dataIndex.columnStopIdx = (columnsArray.length);
                    dataIndex.rowStartIdx = 0;
                    dataIndex.rowStopIdx = (reportData.length - 1);

                    if (self.reportType() === "Property") {
                        sortPropertyReportDataForExport();
                    }

                    while (nextPageHasData()) {
                        buildPageData();
                    }
                }

                self.scheduledReportData({tables: reportDataPages});
                self.numberOfScheduledReportTables(reportDataPages.length);
                self.activeRequestDataDrawn(false);
            }
        },
        render = {
            baseReport: () => {
                if (self.currentTab() === 2) {
                    self.reportResultViewed(true);
                    if (reportData !== undefined) {
                        ui.blockUI($tabViewReport, false);
                        if (scheduledReport) {
                            formatForPDF.breakReportDataIntoPrintablePages();
                            if (!self.activeRequestDataDrawn()) {
                                if (scheduledReport && self.chartable() && includeChart) {
                                    self.requestChart();
                                } else {
                                    setTimeout(function () {
                                        self.activeRequestDataDrawn(true);
                                    }, 1000);
                                }
                            }
                            $(document.body).find("script").html(null);
                        } else {
                            $dataTablePlaceHolder.DataTable().clear();
                            $dataTablePlaceHolder.DataTable().rows.add(reportData);
                            $dataTablePlaceHolder.DataTable().draw("current");
                            $dataTablePlaceHolder.DataTable().fixedColumns().update();
                            self.refreshData(false);
                            self.currentTimeStamp = moment().format("dddd MMMM DD, YYYY hh:mm:ss a");

                            if (!exportEventSet) {
                                $tabViewReport.find("a.btn.btn-default.buttons-collection").on("click", function () {
                                    if (!exportEventSet) {
                                        setTimeout(function () {
                                            $direports.find("li.dt-button > a").on("click", function () {  // export buttons clicked
                                                console.log($(this).text() + " button clicked");
                                                $(this).parent().parent().hide();
                                            });
                                        }, 100);
                                    }
                                    exportEventSet = true;
                                });
                            }

                            // ui.adjustViewReportTabHeightWidth();
                            self.selectViewReportTabSubTab("gridData");
                        }
                    }
                    self.activeRequestDataDrawn(true);
                }
            },
            historyReport: (data) => {
                self.activeDataRequest(false);
                if (data.err === undefined) {
                    reportData = dataParse.pivotHistoryData(data.historyData);
                    self.truncatedData(reportData.truncated);
                    // render.baseReport();
                } else {
                    console.log(" - * - * - render.historyReport() ERROR = ", data.err);
                    ui.displayError(data.err);
                }
                render.baseReport();
            },
            totalizerReport: (data) => {
                self.activeDataRequest(false);
                if (data.err === undefined) {
                    reportData = dataParse.pivotTotalizerData(data);
                    self.truncatedData(reportData.truncated);
                    // render.baseReport();
                } else {
                    console.log(" - * - * - render.totalizerReport() ERROR = ", data.err);
                    ui.displayError(data.err);
                }
                render.baseReport();
            },
            propertyReport: (data) => {
                self.activeDataRequest(false);
                if (data.err === undefined) {
                    reportData = dataParse.cleanResultData(data);
                    self.truncatedData(reportData.truncated);
                    // render.baseReport();
                } else {
                    console.log(" - * - * - render.propertyReport() ERROR = ", data.err);
                    ui.displayError(data.err);
                }
                render.baseReport();
            },
            baseChart: (formatForPrint, isScheduled) => {
                let maxDataRowsForChart = 50000,
                    chartType,
                    chartTitle = self.reportDisplayTitle(),
                    trendPlotChart,
                    timeOfUseChart,
                    subTitle = "",
                    toolTip,
                    yAxisTitle,
                    spinnerText,
                    chartConfig = {},
                    chartWidth,
                    chartHeight,
                    plotOptions = {},
                    $tabContent = $tabViewReport.find(".tab-content"),
                    xAxisExtremes = (e) => {
                        if (e.trigger === "zoom") {
                            if (e.min && e.max) {
                                $reportChartDiv.highcharts().showResetZoom();
                            } else {
                                // $reportChartDiv.highcharts().resetZoomButton.destroy();
                            }
                        }
                    },
                    buildSubTitle = (startDate, endDate) => {
                        let datetimeFormat;
                        if (self.selectedChartType() === "Timeslot") {
                            datetimeFormat = "MM/DD/YYYY";
                        } else {
                            datetimeFormat = "MM/DD/YYYY hh:mm a";
                        }

                        return "by " + self.intervalPeriod() + " <br/> " + startDate.format(datetimeFormat) + " - " + endDate.format(datetimeFormat);
                    },
                    getChartWidth = () => {
                        var answer;

                        if (!!formatForPrint) {
                            answer = 950;
                        } else if (!!isScheduled) {
                            answer = 1050;
                        } else {
                            answer = $tabContent.width();
                        }

                        return answer;
                    },
                    getChartHeight = () => {
                        var answer;

                        if (!!formatForPrint) {
                            answer = 650;
                        } else if (!!isScheduled) {
                            answer = 680;
                        } else {
                            answer = $tabContent.height();
                        }

                        return answer;
                    };

                self.activeRequestForChart(true);
                if (!!formatForPrint) {
                    spinnerText = "Configuring " + self.selectedChartType() + " Chart for printing....";
                } else {
                    spinnerText = "Rending " + self.selectedChartType() + " Chart....";
                }
                self.chartSpinnerTitle(spinnerText);
                $reportChartDiv.html("");
                ui.adjustViewReportTabHeightWidth();

                chartType = reportUtil.getValueBasedOnText(self.listOfChartTypes(), self.selectedChartType());
                chartWidth = getChartWidth();
                chartHeight = getChartHeight();
                reportChartData = dataParse.getOnlyChartData(reportData);

                if (!!reportChartData && !!reportChartData[0]) {
                    if (reportChartData[0].data.length < maxDataRowsForChart) {
                        switch (self.reportType()) {
                            case "History":
                            case "Totalizer":
                                subTitle = buildSubTitle(self.selectedDuration().startDate, self.selectedDuration().endDate);
                                yAxisTitle = "Totals";
                                break;
                            case "Property":
                                break;
                            default:
                                console.log(" - - - DEFAULT  render.baseChart()");
                                break;
                        }

                        if (reportChartData && self.selectedChartType() !== "Pie") {
                            reportChartData.sort(function (a, b) {
                                return (a.timeStamp > b.timeStamp) ? 1 : -1;
                            });
                        }

                        setTimeout(function () {
                            if ($reportChartDiv.length > 0) {
                                switch (self.selectedChartType()) {
                                    case "Pie":
                                        if (reportChartData.length > 1) {
                                            $reportChartDiv.css("overflow-y", "auto");
                                            $reportChartDiv.css("height", chartHeight);
                                            $reportChartDiv.addClass("thinScroll");
                                        } else {
                                            $reportChartDiv.css("overflow-y", "hidden");
                                            $reportChartDiv.removeClass("thinScroll");
                                        }
                                        for (let dataIndex = 0; dataIndex < reportChartData.length; dataIndex++) {
                                            let chunkOfChartData = [];
                                            let $chartDiv = $("<div chartIndex='" + dataIndex + "'></div>");
                                            $chartDiv.appendTo($reportChartDiv);
                                            chunkOfChartData.push(reportChartData[dataIndex]);
                                            subTitle = chunkOfChartData[0].name;
                                            // $chartDiv.highcharts({
                                            chartConfig = {
                                                turboThreshold: maxDataRowsForChart,
                                                target: $chartDiv,
                                                chart: {
                                                    width: chartWidth,
                                                    height: chartHeight,
                                                    plotBackgroundColor: null,
                                                    plotBorderWidth: null,
                                                    plotShadow: false,
                                                    type: "pie"
                                                },
                                                title: chartTitle,
                                                subtitle: subTitle,
                                                tooltip: {
                                                    pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
                                                },
                                                credits: {
                                                    enabled: false
                                                },
                                                plotOptions: {
                                                    pie: {
                                                        allowPointSelect: true,
                                                        cursor: "pointer",
                                                        dataLabels: {
                                                            enabled: true,
                                                            format: "<b>{point.name}</b>: {point.percentage:.1f} %",
                                                            style: {
                                                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || "black"
                                                            }
                                                        }
                                                    }
                                                },
                                                data: chunkOfChartData
                                            };

                                            let trendPlotPieChart = new TrendPlot(chartConfig);
                                        }
                                        break;
                                    case "Timeslot":
                                        chartConfig = {
                                            chart: {
                                                type: 'scatter',
                                                renderTo: $reportChartDiv[0],
                                                width: chartWidth,
                                                height: chartHeight,
                                                zoomType: 'xy'
                                            },
                                            credits: {
                                                enabled: false
                                            },
                                            title: {
                                                text: "Timeslot"
                                            },
                                            subtitle: {
                                                text: buildSubTitle(self.selectedDuration().startDate, self.selectedDuration().endDate)
                                            },
                                            xAxis: {
                                                title: {
                                                    enabled: true,
                                                    text: 'Time'
                                                },
                                                type: "datetime",
                                                tickInterval: timeOfUseDuration.subDuration,
                                                dateTimeLabelFormats: timeOfUseDuration.labelformat,
                                                showFirstLabel: true,
                                                showLastLabel: true
                                            },
                                            yAxis: {
                                                title: {
                                                    text: 'Total'
                                                }
                                            },
                                            legend: {
                                                align: 'center',
                                                verticalAlign: 'bottom',
                                                borderWidth: 1
                                            },
                                            plotOptions: {
                                                scatter: {
                                                    tooltip: {
                                                        pointFormatter: function() {
                                                            return '<b>' + moment.unix(this.timeStamp).format("MM/DD/YYYY HH:mm") + ', ' + this.y + '</b><br/>';
                                                        }
                                                    }
                                                },
                                                series: {
                                                    turboThreshold: maxDataRowsForChart
                                                }
                                            },
                                            series: reportChartData
                                        };

                                        timeOfUseChart = Highcharts.chart(chartConfig);
                                        break;
                                    case "Sum Timeslot":
                                        chartConfig = {
                                            chart: {
                                                type: 'column',
                                                renderTo: $reportChartDiv[0],
                                                width: chartWidth,
                                                height: chartHeight,
                                                zoomType: 'x'
                                            },
                                            credits: {
                                                enabled: false
                                            },
                                            title: {
                                                text: "Sum Timeslot"
                                            },
                                            subtitle: {
                                                text: buildSubTitle(self.selectedDuration().startDate, self.selectedDuration().endDate)
                                            },
                                            xAxis: {
                                                title: {
                                                    enabled: true,
                                                    text: 'Time'
                                                },
                                                type: "datetime",
                                                tickInterval: timeOfUseDuration.subDuration,
                                                dateTimeLabelFormats: timeOfUseDuration.labelformat,
                                                showFirstLabel: true,
                                                showLastLabel: true
                                            },
                                            yAxis: {
                                                title: {
                                                    text: 'Total'
                                                }
                                            },
                                            legend: {
                                                align: 'center',
                                                verticalAlign: 'bottom',
                                                borderWidth: 1
                                            },
                                            plotOptions: {
                                                series: {
                                                    turboThreshold: maxDataRowsForChart
                                                }
                                            },
                                            tooltip: {
                                                formatter: function() {
                                                    return this.series.name + ': <b>' + reportUtil.toFixedComma(this.y, 2) + '</b><br/>';
                                                }
                                            },
                                            series: reportChartData
                                        };

                                        timeOfUseChart = Highcharts.chart(chartConfig);
                                        break;
                                    default:
                                        if (self.selectedChartType() !== "Column") {
                                            toolTip = {
                                                formatter: function () {
                                                    return '<span style="font-size: 10px">' + moment(this.x).format("dddd, MMM Do, YYYY HH:mm") + '</span><br>' + '<span style="color:' + this.point.color + '">●</span> ' + this.point.series.name + ': <b>' + reportUtil.numberWithCommas(this.y) + (!!this.point.enumText ? '-' + this.point.enumText : '') + '</b><br/>';
                                                }
                                            };
                                        }

                                        chartConfig = {
                                            turboThreshold: maxDataRowsForChart,
                                            width: chartWidth,
                                            height: chartHeight,
                                            target: $reportChartDiv,
                                            title: chartTitle,
                                            subtitle: subTitle,
                                            y: "value",
                                            x: "timeStamp",
                                            enumText: "enumText",
                                            //highlightMax: true,
                                            data: reportChartData,
                                            type: chartType,
                                            chart: {
                                                zoomType: (self.selectedChartType() === "Timeslot") ? "xy" : "x"
                                            },
                                            tooltip: toolTip,
                                            plotOptions: plotOptions,
                                            //plotOptions: {
                                            //    series: {
                                            //        cursor: "pointer",
                                            //        point: {
                                            //            events: {
                                            //                click: () => {
                                            //                    alert("x: " + this.x + ", y: " + this.y);
                                            //                }
                                            //            }
                                            //        }
                                            //    }
                                            //},
                                            navigator: {
                                                enabled: (!scheduledReport && !formatForPrint)
                                            },
                                            events: {
                                                redraw: function (event) {
                                                    this.setTitle(null, {text: buildSubTitle(moment(event.target.xAxis[0].min), moment(event.target.xAxis[0].max))}); // sets subtitle
                                                }
                                            },
                                            xAxis: {
                                                allowDecimals: false,
                                                events: {
                                                    setExtremes: xAxisExtremes
                                                }
                                            },
                                            legend: {
                                                layout: "vertical",
                                                align: "right",
                                                verticalAlign: "middle",
                                                borderWidth: 0
                                            },
                                            yAxisTitle: yAxisTitle
                                        };

                                        trendPlotChart = new TrendPlot(chartConfig);
                                        break;
                                }
                                self.activeRequestForChart(false);
                                self.activeRequestDataDrawn(true);
                            }
                        }, 110);
                    } else {
                        $reportChartDiv.html("Too many data rows for " + self.selectedChartType() + " Chart. Max = " + maxDataRowsForChart);
                        self.activeRequestForChart(false);
                    }
                } else {
                    $reportChartDiv.html("Chart data not available");
                    self.activeRequestForChart(false);
                }
            }
        },
        initSocket = (cb) => {
            reportSocket = io.connect(window.location.origin);

            reportSocket.on("connect", function () {
                // console.log("SOCKETID:", reportSocket.id);
                if (cb) {
                    cb();
                }
            });

            reportSocket.on("pointUpdated", function (data) {
                if (!!data.err) {
                    console.log("Error: " + data.err);
                } else {
                    reportPoint = data.points[0];
                    let reportConfig = (reportPoint["Report Config"] ? reportPoint["Report Config"] : undefined);
                    reportUtil.initExistingReport(reportConfig);
                    afterSaveCallback(reportPoint);
                    saveManager.saveReportCallback(data);
                    afterSaveCallback = null;  // clear callback once new point added to hierarchy
                }
            });
        },
        userCanEdit = (data, requestedAccessLevel) => {
            return (!!(data._pAccess & requestedAccessLevel) || data._id === 0);
        },
        ajaxCall = (type, input, url, callback) => {
            var errorRaised = false;

            $.ajax({
                url: url,
                type: type,
                contentType: "application/json",
                dataType: "json",
                data: (!!input ? JSON.stringify(input) : null)
            }).done(function (data) {
                if (data.err) {
                    errorRaised = data.err;
                    return dtiReporting.log("Request failed: url = " + url + "  error message " + data.err);
                } else if (callback) {
                    callback.call(self, data);
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                errorRaised = jqXHR.fail().responseText + " - " + jqXHR.status + "  " + errorThrown;
                dtiReporting.log("Request failed: url = " + url, jqXHR, textStatus, errorThrown);
                self.activeRequestDataDrawn(true);
                if (callback) {
                    callback.call(self, {err: errorRaised});
                }
            }).always(function () {
                // console.log( " . .     ajax Request complete..");
            });
        },
        buildReportDataRequest = () => {
            let result,
                i,
                validatedColumns,
                columnConfig,
                validatedFilters,
                filterConfig,
                $reportStartDate = $additionalFilters.find("#reportStartDate"),
                $reportEndDate = $additionalFilters.find("#reportEndDate"),
                activeError = false,
                upis = [],
                uuid,
                cleanUpReportConfig = function (reportConfig) {  // shrinking size of request object
                    var results = $.extend(true, {}, reportConfig),
                        i;

                    for (i = 0; i < results.columns.length; i++) {
                        delete results.columns[i].canBeCharted;
                        delete results.columns[i].canCalculate;
                        delete results.columns[i].colDisplayName;
                        delete results.columns[i].dataColumnName;
                        delete results.columns[i].includeInChart;
                        delete results.columns[i].multiplier;
                        delete results.columns[i].pointType;
                        delete results.columns[i].precision;
                        delete results.columns[i].yaxisGroup;
                    }

                    return results;
                };

            validatedColumns = columnLogic.validateColumns();
            validatedFilters = filterLogic.validateFilters();

            for (i = 0; i < validatedColumns.collection.length; i++) {
                columnConfig = validatedColumns.collection[i];
                if (!!columnConfig.error) {
                    ui.displayError(columnConfig.error);
                    activeError = true;
                    $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                    $gridColumnConfigTable.find("th:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                    $gridColumnConfigTable.find("td:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                    self.selectConfigReportTabSubTab("reportColumns");
                } else {
                    $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                    $gridColumnConfigTable.find("th:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                    $gridColumnConfigTable.find("td:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                    if (columnConfig.upi > 0) {  // collect UPIs from Columns
                        upis.push({
                            upi: parseInt(columnConfig.upi, 10),
                            op: (columnConfig.operator).toLowerCase()
                        });
                    }
                }
            }

            for (i = 0; i < validatedFilters.collection.length; i++) {
                filterConfig = validatedFilters.collection[i];
                if (!!filterConfig.error) {
                    ui.displayError(filterConfig.error);
                    activeError = true;
                    $filtersGrid.find("tr:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                    self.selectConfigReportTabSubTab("additionalFilters");
                } else {
                    $filtersGrid.find("tr:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                }
            }

            if (validatedColumns.collection.length === 1 && self.reportType() !== "Property") {
                activeError = true;
                ui.displayError("Column list is blank. Nothing to report on.");
            }

            if (!activeError) {
                switch (self.reportType()) {
                    case "History":
                    case "Totalizer":
                        if (!scheduledReport) {
                            self.selectedDuration().startDate = moment($reportStartDate.pickadate('picker').get('select').pick);
                            self.selectedDuration().endDate = moment($reportEndDate.pickadate('picker').get('select').pick);
                        }
                        reportUtil.configureSelectedDuration();

                        reportPoint["Report Config"].interval = {
                            period: self.intervalPeriod(),
                            value: self.intervalValue()
                        };

                        reportPoint["Report Config"].duration = {
                            startDate: self.selectedDuration().startDate.unix(),
                            endDate: self.selectedDuration().endDate.unix(),
                            startTimeOffSet: self.durationStartTimeOffSet(),
                            endTimeOffSet: self.durationEndTimeOffSet(),
                            // duration: self.selectedDuration().endDate.diff(self.selectedDuration().startDate),
                            selectedRange: self.selectedDuration().selectedRange
                        };
                        break;
                    case "Property":
                        break;
                    default:
                        console.log(" - - - DEFAULT  buildReportDataRequest()");
                        break;
                }

                reportPoint["Report Config"].pointFilter = {
                    "name1": self.name1Filter(),
                    "name2": self.name2Filter(),
                    "name3": self.name3Filter(),
                    "name4": self.name4Filter(),
                    "selectedPointTypes": self.selectedPointTypesFilter()
                };
                reportPoint["Report Config"].columns = validatedColumns.collection;
                reportPoint["Report Config"].filters = validatedFilters.collection;

                uuid = reportUtil.generateUUID();
                activeDataRequests.push(uuid);

                result = {
                    requestID: uuid,
                    upis: upis,
                    range: {
                        start: self.startDate(),
                        end: self.endDate()
                    },
                    reportConfig: cleanUpReportConfig(reportPoint["Report Config"]),
                    reportType: reportPoint["Report Type"].Value,
                    "Point Refs": reportPoint["Point Refs"],
                    sort: ""
                };
            }

            return result;
        },
        getDurationText = (duration, precision, hoursOnly) => {
            var answer = "",
                hour,
                min,
                sec;

            if ($.isNumeric(duration)) {
                if (hoursOnly) {
                    answer = (duration / 3600).toFixed(precision);
                } else {
                    hour = (duration / 3600).toFixed(0);
                    min = (~~((duration % 3600) / 60));
                    sec = (duration % 60);
                    answer += (hour > 1 ? reportUtil.toFixedComma(hour, precision) + " hours " : "");
                    answer += (min > 0 ? reportUtil.toFixedComma(min, precision) + " mins " : "");
                    answer += (sec > 0 ? reportUtil.toFixedComma(sec, precision) + " secs" : "");
                }
            }

            return (answer !== "" ? answer : 0);
        },
        setReportConfig = (cb) => {
            var formattingPointRequest = 0,
                i,
                errors,
                validatedColumns,
                validatedFilters,
                $reportStartDate = $additionalFilters.find("#reportStartDate"),
                $reportEndDate = $additionalFilters.find("#reportEndDate");

            validatedColumns = columnLogic.validateColumns(true);
            validatedFilters = filterLogic.validateFilters(true);
            if (!!validatedColumns.error || !!validatedFilters.error) {
                if (!!validatedColumns.error) {
                    for (i = 0; i < validatedColumns.collection.length; i++) {
                        if (!!validatedColumns.collection[i].error) {
                            ui.displayError(validatedColumns.collection[i].error);
                            $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                            $gridColumnConfigTable.find("th:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                            $gridColumnConfigTable.find("td:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                        } else {
                            $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                            $gridColumnConfigTable.find("th:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                            $gridColumnConfigTable.find("td:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                        }
                    }
                    self.selectConfigReportTabSubTab("reportColumns");
                }
                if (!!validatedFilters.error) {
                    for (i = 0; i < validatedFilters.collection.length; i++) {
                        if (!!validatedFilters.collection[i].error) {
                            ui.displayError(validatedFilters.collection[i].error);
                            $filtersGrid.find("tr:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                        } else {
                            $filtersGrid.find("tr:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                        }
                    }
                    self.selectConfigReportTabSubTab("additionalFilters");
                }
                ui.tabSwitch(1);
                self.activeSaveRequest(false);
            } else {
                reportPoint["Report Type"].Value = self.reportType();
                reportPoint["Report Type"].eValue = self.reportTypeEnum();

                if (self.reportType() !== "Property") {
                    self.selectedDuration().startDate = moment(self.startDate());
                    self.selectedDuration().endDate = moment(self.endDate());
                    self.startDate(self.selectedDuration().startDate.unix());
                    self.endDate(self.selectedDuration().endDate.unix());
                }

                reportPoint["Report Config"].columns = validatedColumns.collection;
                reportPoint["Report Config"].filters = validatedFilters.collection;
                reportPoint["Report Config"].pointFilter = {
                    "name1": self.name1Filter(),
                    "name2": self.name2Filter(),
                    "name3": self.name3Filter(),
                    "name4": self.name4Filter(),
                    "selectedPointTypes": self.selectedPointTypesFilter()
                };
                reportPoint["Report Config"].selectedPageLength = self.selectedPageLength();
                reportPoint["Report Config"].selectedChartType = self.selectedChartType();
                reportPoint["Report Config"].reportTitle = self.reportDisplayTitle();
                reportPoint["Report Config"].displayGridCalculations = self.displayGridCalculations();
                reportPoint["Report Config"].displayGridFilters = self.displayGridFilters();
                switch (self.reportType()) {
                    case "History":
                    case "Totalizer":
                        reportPoint["Report Config"].interval = {
                            period: self.intervalPeriod(),
                            value: self.intervalValue()
                        };
                        reportPoint["Report Config"].duration = {
                            startDate: self.selectedDuration().startDate.unix(),
                            endDate: self.selectedDuration().endDate.unix(),
                            startTimeOffSet: self.durationStartTimeOffSet(),
                            endTimeOffSet: self.durationEndTimeOffSet(),
                            duration: self.selectedDuration().endDate.diff(self.selectedDuration().startDate),
                            selectedRange: self.selectedDuration().selectedRange
                        };
                        break;
                    case "Property":
                        break;
                    default:
                        console.log(" - - - DEFAULT  init()");
                        break;
                }

                cb();
            }
        },
        configureDataTable = (destroy, clearData) => {
            var aoColumns = [],
                i,
                columnsArray = $.extend(true, [], self.listOfColumns()),
                setTdAttribs = function (tdField, columnConfig, data, columnIndex) {

                    if (data[columnConfig.colName] && data[columnConfig.colName].PointInst) {
                        var pointType = reportUtil.getKeyBasedOnEnum(ENUMSTEMPLATESENUMS["Point Types"], data[columnConfig.colName].PointType);
                        $(tdField).addClass("pointInstance");
                        $(tdField).attr("upi", data[columnConfig.colName].PointInst);
                        $(tdField).attr("pointType", pointType);
                    }

                    switch (self.reportType()) {
                        case "History":
                            if (columnIndex === 0 && columnConfig.dataColumnName === "Date") {
                                $(tdField).attr("title", moment.unix(data[columnConfig.dataColumnName].rawValue).format("dddd"));
                            } else {
                                if (columnConfig.units) {
                                    $(tdField).attr("title", columnConfig.units);
                                }
                            }
                            break;
                        case "Totalizer":
                            if (columnIndex === 0 && columnConfig.dataColumnName === "Date") {
                                $(tdField).attr("title", moment.unix(data[columnConfig.dataColumnName].rawValue).format("dddd"));
                            }
                            break;
                        case "Property":
                            if (columnConfig.colName === "Name") {
                                $(tdField).attr("upi", data._id);
                                $(tdField).attr("columnIndex", columnIndex);
                                if (data["Point Type"] && data["Point Type"].Value) {
                                    $(tdField).attr("title", data["Point Type"].Value);
                                    $(tdField).attr("pointType", data["Point Type"].Value);
                                }
                            } else if (columnConfig.valueType === "Timet" || columnConfig.valueType === "DateTime") {
                                $(tdField).attr("title", moment.unix(data[columnConfig.dataColumnName].rawValue).format("dddd"));
                            }
                            break;
                        default:
                            console.log(" - - - DEFAULT  setTdAttribs()");
                            break;
                    }
                },
                setColumnClasses = function (columnConfig, columnIndex) {
                    var result = "";
                    if (columnConfig.colName === "Name") {
                        switch (self.reportType()) {
                            case "History":
                            case "Totalizer":
                                break;
                            case "Property":
                                result += "pointInstance ";
                                break;
                            default:
                                console.log(" - - - DEFAULT  setColumnClasses()");
                                break;
                        }
                    }
                    switch (columnConfig.valueType) {
                        case "MinSec":
                        case "HourMin":
                        case "HourMinSec":
                            result += "durationCtrl durationDisplay";
                            break;
                    }
                    // if (columnIndex === 0) {
                    //     result += "firstColumn ";
                    // }
                    if (columnConfig.valueType === "DateTime" && columnIndex > 0) {
                        result += "small datetime ";
                    }
                    if (columnConfig.valueType === "BitString") {
                        result += "small ";
                    }
                    if (columnConfig.canCalculate === true && columnIndex > 0) {
                        result += "right-align ";
                    }
                    if (columnConfig.softDeleted !== undefined && columnConfig.softDeleted) {
                        result += "softDeleted";
                    }
                    return result;
                },
                buildColumnObject = function (columnConfig, columnIndex) {
                    let result,
                        columnTitle = columnConfig.colDisplayName,
                        sortAbleColumn = true,
                        columnWidth,
                        resolveDataFormat = () => {
                            let answer;
                            if (!!columnConfig) {
                                switch (columnConfig.valueType) {
                                    case "MinSec":
                                    case "HourMin":
                                    case "HourMinSec":
                                    case "Float":
                                    case "Double":
                                    case "Integer":
                                    case "Unsigned":
                                    case "BitString":
                                        answer = "num-fmt";
                                        break;
                                    case "Enum":
                                    case "undecided":
                                    case "null":
                                    case "None":
                                    case "Bool":
                                    case "String":
                                    case "UniquePID":  // point IDs get translated to pointname
                                        answer = "string";
                                        break;
                                    case "DateTime":
                                    case "Timet":
                                        answer = "num";  // allows for quicker sorting
                                        break;
                                    default:
                                        answer = "string";
                                        break;
                                }
                            } else {
                                console.log("buildColumnObject()  columnConfig is undefined");
                            }
                            return answer;
                        };

                    switch (self.reportType()) {
                        case "History":
                            break;
                        case "Totalizer":
                            columnConfig.dataColumnName = (i === 0 && columnConfig.colName === "Date" ? columnConfig.colName : columnConfig.upi + " - " + columnConfig.operator.toLowerCase());
                            if (columnIndex === 0 && columnConfig.colName === "Date") {
                                columnTitle = "Period Begin";
                            } else if (columnIndex !== 0) {
                                columnTitle += " - " + columnConfig.operator;
                                if (columnConfig.operator.toLowerCase() === "runtime") {
                                    columnTitle += " (Hours)";
                                }
                            }
                            break;
                        case "Property":
                            break;
                        default:
                            columnTitle = "Default";
                            console.log(" - - - DEFAULT  buildColumnObject()");
                            break;
                    }

                    if (columnConfig.softDeleted !== undefined && columnConfig.softDeleted) {
                        columnTitle = "[Deleted] " + columnTitle;
                    }

                    if (!!columnConfig.width) {
                        columnWidth = columnConfig.width;
                    } else {
                        columnWidth = "auto";
                    }

                    result = {
                        title: columnTitle,
                        data: columnConfig.dataColumnName,
                        // data: columnConfig.dataColumnName + ".Value",
                        width: columnWidth,
                        type: resolveDataFormat(),
                        render: {
                            _: "Value",
                            type: "rawValue",
                            sort: "rawValue",
                            filter: "Value",
                            display: "Value"
                        },
                        className: setColumnClasses(columnsArray[columnIndex], columnIndex),
                        fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                            setTdAttribs(nTd, columnsArray[iCol], oData, iCol);
                        },
                        bSortable: sortAbleColumn
                    };

                    return result;
                },
                getCalcForColumn = function (currentPageData, allData, columnDesign) {
                    var i,
                        value,
                        allRawValues,
                        currentPageRawValues = [],
                        collectionOfCalcs = [],
                        typeOfCalc,
                        calc = {
                            totalCalc: 0,
                            pageCalc: 0
                        },
                        sameDataSet = (currentPageData.length === allData.length),
                        getRawData = function (dataSet) {
                            var tempDataSet = [];
                            for (var i = 0; i < dataSet.length; i++) {
                                value = dataSet[i].rawValue;
                                value = (typeof value === "object" ? value.Value : value);
                                if ($.isNumeric(value)) {
                                    tempDataSet.push(parseFloat(value));
                                } else {
                                    tempDataSet.push(0);
                                }
                            }
                            return tempDataSet;
                        };

                    allRawValues = getRawData(allData);

                    if (!sameDataSet) {
                        currentPageRawValues = getRawData(currentPageData);
                    }

                    for (i = 0; i < columnDesign.calculation.length; i++) {
                        typeOfCalc = columnDesign.calculation[i].toLowerCase();

                        if (currentPageData.length > 0) {
                            switch (typeOfCalc) {
                                case "mean":
                                    calc.totalCalc = reportCalc.getColumnMean(allRawValues);
                                    calc.pageCalc = (!sameDataSet ? reportCalc.getColumnMean(currentPageRawValues) : calc.totalCalc);
                                    break;
                                case "max":
                                    calc.totalCalc = Math.max.apply(Math, allRawValues);
                                    calc.pageCalc = (!sameDataSet ? Math.max.apply(Math, currentPageRawValues) : calc.totalCalc);
                                    break;
                                case "min":
                                    calc.totalCalc = Math.min.apply(Math, allRawValues);
                                    calc.pageCalc = (!sameDataSet ? Math.min.apply(Math, currentPageRawValues) : calc.totalCalc);
                                    break;
                                case "sum":
                                    calc.totalCalc = reportCalc.getColumnSum(allRawValues);
                                    calc.pageCalc = (!sameDataSet ? reportCalc.getColumnSum(currentPageRawValues) : calc.totalCalc);
                                    break;
                                case "std dev":
                                    calc.totalCalc = reportCalc.getColumnStandardDeviation(allRawValues);
                                    calc.pageCalc = (!sameDataSet ? reportCalc.getColumnStandardDeviation(currentPageRawValues) : calc.totalCalc);
                                    break;
                                default:
                                    console.log(" - - - DEFAULT  getCalcForColumn()");
                                    break;
                            }
                        }

                        collectionOfCalcs.push($.extend(true, {}, calc));
                    }

                    return collectionOfCalcs;
                };

            // if the design of the data collected has changed then we need to adjust the design of the DataTable.
            if ($.fn.DataTable.isDataTable($dataTablePlaceHolder)) {
                var buttons = [];
                $.each($dataTablePlaceHolder.DataTable().buttons()[0].inst.s.buttons,
                    function () {
                        buttons.push(this);
                    });
                $.each(buttons,
                    function () {
                        $dataTablePlaceHolder.DataTable().buttons()[0].inst.remove(this.node);
                    });
                $dataTablePlaceHolder.DataTable().destroy();
                $dataTablePlaceHolder.find("thead").empty();
                $dataTablePlaceHolder.find("tbody").empty(); // leaving dynamic footer
            }
            if (clearData === true) {
                reportData = {};
            }

            for (i = 0; i < columnsArray.length; i++) {
                aoColumns.push(buildColumnObject(columnsArray[i], i));
            }

            if (aoColumns.length > 0) {
                $dataTablePlaceHolder.removeAttr('width').DataTable({
                    api: true,
                    dom: (!scheduledReport ? "Blfrtip" : "lfrtip"),
                    buttons: (!scheduledReport ? [
                        {
                            extend: "collection",
                            text: "Export",
                            className: "btn blue-grey dropdown-button",
                            buttons: [
                                {
                                    extend: "copyHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>Copy</div>',
                                    footer: false,
                                    filename: function () {
                                        return reportUtil.getExportFileName();
                                    },
                                    key: {
                                        altKey: true,
                                        key: "1"
                                    }
                                },
                                {
                                    extend: "csvHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>CSV</div>',
                                    footer: false,
                                    filename: function () {
                                        return reportUtil.getExportFileName();
                                    },
                                    key: {
                                        altKey: true,
                                        key: "2"
                                    }
                                },
                                {
                                    extend: "excelHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>Excel</div>',
                                    footer: false,
                                    filename: function () {
                                        return reportUtil.getExportFileName();
                                    },
                                    key: {
                                        altKey: true,
                                        key: "3"
                                    }
                                },
                                {
                                    extend: "pdfHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>PDF</div>',
                                    footer: false,
                                    filename: function () {
                                        return reportUtil.getExportFileName();
                                    },
                                    orientation: (aoColumns.length > 4 ? "landscape" : "portrait"),
                                    key: {
                                        altKey: true,
                                        key: "4"
                                    },
                                    customize: function (doc, thisButton) {
                                        // could insert TrendPlots here
                                    }
                                }
                            ],
                            customize: function (doc, thisButton) {
                                $(thisButton).attr("data-activates", "dtButtonActions");
                                // could insert TrendPlots here
                            }
                        },
                        {
                            extend: "print",
                            text: '<i class="fa fa-print"></i> Print',
                            className: "btn blue-grey",
                            key: {
                                altKey: true,
                                key: "5"
                            },
                            customize: function (win) {
                                var $documentBody = $(win.document.body),
                                    $documentHead = $(win.document.head),
                                    $table = $documentBody.find("table"),
                                    classes,
                                    hostAndProtocol = window.location.protocol + "//" + window.location.host;

                                $documentHead.find("link[rel=stylesheet]").remove();
                                $documentHead.append('<link rel="stylesheet" href="' + hostAndProtocol + '/css/reports/reportprinting.css" type="text/css" />');
                                $table.removeClass("table-striped dataTablePlaceHolder dataTable");
                                $table.addClass("table").addClass("table-sm");
                                $table.css("padding", "2px");
                                for (i = 0; i < columnsArray.length; i++) {
                                    classes = setColumnClasses(columnsArray[i], i);
                                    $table.find("td:nth-child(" + (i + 1) + ")").addClass(classes);
                                }
                            }
                        }
                    ] : undefined),
                    drawCallback: function (settings) {
                        ui.setCustomDatatableInfo();
                    },
                    headerCallback: function (thead, data, start, end, display) {
                        var reportColumns = $.extend(true, [], self.listOfColumns()),
                            i,
                            $theads = $(thead).find("th"),
                            $firstThead;


                        for (i = 1; i < reportColumns.length; i++) {
                            if (!!reportColumns[i].calculation && reportColumns[i].calculation.length > 0) {
                                $(thead).find("th").eq(i).addClass("calculate");
                            }
                        }

                        $theads.addClass("text-center");
                        $theads.removeClass("small");

                        switch (self.reportType()) {
                            case "History":
                            case "Totalizer":
                                $theads.each(function (i, el) {
                                    $(el).attr("oncontextmenu", "reportsVM.showPointReviewViaIndex(" + i + "); return false;");
                                    $(el).attr("title", "Right mouse click to run PointInspector");
                                });
                                break;
                            case "Property":
                                $firstThead = $(thead).find("th:first");
                                $firstThead.addClass("pointLookupColumn");
                                $firstThead.removeClass("pointInstance");
                                break;
                            default:
                                break;
                        }
                    },
                    footerCallback: function (tfoot, data, start, end, display) {
                        let startTime = moment();
                        console.log("footerCallback()  started ............................................");
                        let api = this.api(),
                            reportColumns = self.listOfColumns(),
                            $footerFirstCell,
                            columnIndexesToCalc = api.columns(".calculate")[0],
                            i,
                            j,
                            columnIndex,
                            searchFilterData,
                            currentPageData,
                            allData,
                            sameDataSet,
                            numberOfColumnsToCalculate = columnIndexesToCalc.length,
                            columnConfig,
                            calc,
                            calcs,
                            dataExists = false,
                            pageFooterText,
                            totalFooterText,
                            footerCalcText,
                            footerTitle,
                            $clearAllSearchFilters,
                            $trFooter,
                            $tdFooterFilter,
                            $tdFooterCalculations,
                            $footerTableDataCollection,
                            buildFilterSelect = (column, columnIndex, columnData, $element) => {
                                let searchFilterValue = self.listOfColumns()[columnIndex].searchFilter,
                                    getUnique = (theArray) => {
                                        var n = {},
                                            result = [],
                                            value,
                                            v;
                                        for (var i = 0; i < theArray.length; i++) {
                                            value = theArray[i].Value;
                                            // console.log("---- theArray[" + i + "].Value = " + theArray[i].Value);
                                            // console.log("-------- theArray[" + i + "].rawValue = " + theArray[i].rawValue);
                                            if (value !== undefined && value !== null) {
                                                v = value;
                                            } else {
                                                v = "";
                                            }
                                            if (!n[v] && v !== "") {
                                                // console.log("---- theArray[" + i + "].Value = " + theArray[i].Value);
                                                // console.log("-------- theArray[" + i + "].rawValue = " + theArray[i].rawValue);
                                                // console.log("v = (" + v + ")");
                                                n[v] = true;
                                                result.push(v);
                                            }
                                        }
                                        if (self.listOfColumns()[columnIndex].canCalculate === true) {
                                            return result.sort(function(a, b) {
                                                return a - b;
                                            });
                                        } else {
                                            return result.sort();
                                        }
                                    },
                                    uniqueData = getUnique(columnData);

                                if (uniqueData.length === 1 && uniqueData[0] === "") {
                                    // the data is this column is all blanks
                                } else if (uniqueData.length > 0) {
                                    let $selectFilter = $('<select><option value=""></option></select>').appendTo($element);

                                    let startTimeForLoop = moment();
                                    for (let i = 0; i < uniqueData.length; i++) {
                                        // TODO speed this up
                                        // console.log("searchFilterValue = (" + searchFilterValue + ")");
                                        // console.log("uniqueData[" + i + "] = (" + uniqueData[i] + ")");

                                        if (searchFilterValue !== undefined && searchFilterValue == uniqueData[i]) {
                                            $selectFilter.append('<option class="active" value="' + uniqueData[i] + '">' + uniqueData[i] + '</option>');
                                            $selectFilter[0].options.selectedIndex = i + 1;
                                        } else {
                                            $selectFilter.append('<option value="' + uniqueData[i] + '">' + uniqueData[i] + '</option>');
                                        }
                                    }
                                    console.log("buildFilterSelectForLoop()  end - - -   diff = " + moment.duration(moment().diff(startTimeForLoop)).asMilliseconds() + "ms");
                                    $selectFilter.material_select();

                                    $selectFilter.on('change', function (e) {
                                        var val = $.fn.dataTable.util.escapeRegex($(this).val()),
                                            // regExVal = val ? "^" + val + "$" : "",
                                            regExVal = val ? "\\b" + val + "\\b" : "",
                                            plainText = $(this).val();

                                        $(this).addClass("active");
                                        self.listOfColumns()[columnIndex].searchFilter = $(this).val();
                                        column
                                            .search(regExVal, true, false)
                                            .draw();
                                        // console.log("   - - - - -  change      val = (" + val + ")");
                                        // console.log("                   * regExVal = (" + regExVal + ")");
                                        // console.log("                    plainText = (" + plainText + ")");
                                        // column
                                        //     .search(val, true, false)
                                        //     .draw();
                                        return true;
                                    });
                                }
                            };

                        if (!scheduledReport) {
                            $trFooter = $(tfoot);
                            $footerTableDataCollection = $trFooter.find("span.calculations");
                            $footerTableDataCollection.html(""); // clear existing calcs results

                            $trFooter.find("span.searchFilter").html(""); // clear existing searchfilters

                            if (self.displayGridFilters()) {
                                for (i = 1; i < reportColumns.length; i++) {  // skip first column
                                    columnIndex = i;
                                    searchFilterData = api.column(columnIndex, {search: "applied"}).data();
                                    dataExists = (searchFilterData.length > 0);

                                    if (reportColumns[i].searchable && dataExists) {
                                        $tdFooterFilter = $trFooter.find("td[colindex='" + columnIndex + "']").find("span.searchFilter");

                                        if ($tdFooterFilter.length > 0) {
                                            $tdFooterFilter.addClass("columnFilter");
                                            if (reportColumns[i].canCalculate === true) {
                                                $tdFooterFilter.find("input.select-dropdown").addClass("right-align");
                                            }
                                            buildFilterSelect(api.column(columnIndex), columnIndex, searchFilterData, $tdFooterFilter);
                                        }
                                    }
                                }
                            }

                            if (self.displayGridCalculations() && self.reportType() !== "Property") {
                                $footerTableDataCollection.attr("data-content", "&nbsp;"); // clear title data (mouse over)
                                $footerTableDataCollection.removeAttr("data-toggle");
                                $footerTableDataCollection.removeAttr("data-trigger");
                                $footerTableDataCollection.removeAttr("data-html");
                                $footerTableDataCollection.removeAttr("title");
                                $footerTableDataCollection.removeAttr("data-original-title");

                                for (i = 0; i < numberOfColumnsToCalculate; i++) {
                                    footerCalcText = "";
                                    footerTitle = "";
                                    pageFooterText = "";
                                    columnIndex = columnIndexesToCalc[i];
                                    columnConfig = reportColumns[columnIndex];
                                    currentPageData = api.column(columnIndex, {page: "current"}).data();
                                    allData = api.column(columnIndex).data();
                                    dataExists = (allData.length > 0);
                                    sameDataSet = (currentPageData.length === allData.length);
                                    calcs = getCalcForColumn(currentPageData, allData, columnConfig);
                                    $tdFooterCalculations = $trFooter.find("td[colindex='" + columnIndex + "']").find("span.calculations");
                                    if (dataExists && $tdFooterCalculations.length > 0) {

                                        $tdFooterCalculations.addClass("columnCalcs");

                                        for (j = 0; j < columnConfig.calculation.length; j++) {
                                            calc = calcs[j];

                                            switch (self.reportType()) {
                                                case "History":
                                                    if (!sameDataSet) {
                                                        pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + reportUtil.toFixedComma(calc.pageCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                                    }
                                                    totalFooterText = "Total " + columnConfig.calculation[j] + ": " + reportUtil.toFixedComma(calc.totalCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "<br />";
                                                    break;
                                                case "Totalizer":
                                                    if (columnConfig.operator.toLowerCase() === "runtime") {
                                                        if (!sameDataSet) {
                                                            pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + getDurationText(calc.pageCalc, columnConfig.precision, totalizerDurationInHours) + "</span>";
                                                        }
                                                        totalFooterText = "Total " + columnConfig.calculation[j] + ": " + getDurationText(calc.totalCalc, columnConfig.precision, totalizerDurationInHours) + "<br />";
                                                    } else {
                                                        if (!sameDataSet) {
                                                            pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + reportUtil.toFixedComma(calc.pageCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                                        }
                                                        totalFooterText = "Total " + columnConfig.calculation[j] + ": " + reportUtil.toFixedComma(calc.totalCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "<br />";
                                                    }
                                                    break;
                                                case "Property":
                                                    if (!sameDataSet) {
                                                        pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + reportUtil.toFixedComma(calc.pageCalc, columnConfig.precision) + "</span>";
                                                    }
                                                    totalFooterText = "Total " + columnConfig.calculation[j] + ": " + reportUtil.toFixedComma(calc.totalCalc, columnConfig.precision) + "<br />";
                                                    break;
                                                default:
                                                    console.log(" - - - DEFAULT  footerCallback()");
                                                    break;
                                            }

                                            footerCalcText += (!sameDataSet ? pageFooterText + "<br />" : totalFooterText);
                                            footerTitle += (!sameDataSet ? totalFooterText : "");
                                        }

                                        // TODO to Materialize $tdFooter.popover("destroy");

                                        $tdFooterCalculations.html(footerCalcText);
                                        if (!sameDataSet) {
                                            $tdFooterCalculations.attr("data-toggle", "popover");
                                            $tdFooterCalculations.attr("data-trigger", "hover");
                                            $tdFooterCalculations.attr("data-html", "true");
                                            $tdFooterCalculations.attr("title", "Entire column");
                                            $tdFooterCalculations.attr("data-content", footerTitle);
                                            //TODO  $tdFooter.popover({placement: "top"});
                                        }
                                    }
                                }
                            }

                            $footerFirstCell = $trFooter.find("td[colindex='0']");
                            $footerFirstCell.addClass("right-align");
                            $footerFirstCell.removeClass("pointInstance");
                            $clearAllSearchFilters = $footerFirstCell.find("i.material-icons");
                            if (self.displayGridCalculations() || self.displayGridFilters()) {
                                if (self.displayGridCalculations()) {
                                    $footerFirstCell.removeClass("small");
                                    // $(tfoot).parent().removeClass("hide");
                                }
                                if (self.displayGridFilters()) {
                                    $clearAllSearchFilters.removeClass("hide");
                                    $clearAllSearchFilters.attr("onclick", "reportsVM.clearSearchFilters(); return false;");
                                    $clearAllSearchFilters.attr("title", "Clear all search filters");
                                } else {
                                    $clearAllSearchFilters.addClass("hide");
                                }
                            } else {
                                $(tfoot).parent().addClass("hide"); // hide the footer block
                                $clearAllSearchFilters.addClass("hide");
                            }
                        }
                        console.log("footerCallback()  end - - -   diff = " + moment.duration(moment().diff(startTime)).asMilliseconds() + "ms");
                    },
                    data: reportData,
                    columns: aoColumns,
                    fixedColumns: {
                        heightMatch: 'semiauto'
                    },
                    colReorder: {
                        fixedColumnsLeft: 1,
                        realtime: false
                    },
                    order: (!scheduledReport ? [[0, "asc"]] : false), // always default sort by first column
                    scrollY: !scheduledReport,
                    scrollX: !scheduledReport,
                    scrollCollapse: !scheduledReport,
                    lengthChange: !scheduledReport,
                    paging: !scheduledReport,
                    ordering: !scheduledReport,
                    info: !scheduledReport,
                    // autoWidth: (aoColumns.length > 4 && !scheduled),
                    // responsive: true,
                    lengthMenu: [[10, 15, 24, 48, 75, 100, -1], [10, 15, 24, 48, 75, 100, "All"]],
                    searching: !scheduledReport,  // search box
                    pageLength: (!scheduledReport ? parseInt(self.selectedPageLength(), 10) : -1)
                });
            }

            self.designChanged(false);
        },
        saveManager = (function () {
            var remainingResponses = 0,
                errList = [],
                reportpStatusBeforeSave,
                $activeSidePane,
                submitSaveReportRequest = function (errors) {
                    if (!!errors) {
                        itemFinished(errors);
                    } else {
                        dtiUtility.updateWindow('updateTitle', reportPoint.Name);
                        if (reportPoint._pStatus === 1) {
                            // call addPoint here integrate into dtiutil
                            reportSocket.emit("addPoint", [{
                                newPoint: reportPoint,
                                oldPoint: originalPoint
                            }]);
                        } else {
                            ajaxCall("POST", reportPoint, "saveReport", saveManager.saveReportCallback);
                        }
                    }
                },
                doSave = () => {
                    reportpStatusBeforeSave = reportPoint._pStatus;

                    self.activeSaveRequest(true);
                    $activeSidePane = $rightPanel.find(".side-nav-pane.active");
                    ui.blockUI($activeSidePane, true, " Saving Report...");
                    errList = [];
                    remainingResponses = 0;

                    remainingResponses++;
                    setReportConfig(submitSaveReportRequest);

                    if (reportpStatusBeforeSave === 0) { // If report point status is Active
                        remainingResponses++;
                        self.scheduler.saveScheduleEntries(itemFinished); // Save schedule entries
                    }
                },
                saveReportCallback = function (result) { // This routine called after Report Saved
                    var err = result.err;

                    if (reportpStatusBeforeSave === 1 && !err) { // If report point status was previously inactive & it saved without error
                        remainingResponses++;
                        self.scheduler.saveScheduleEntries(itemFinished);
                    }
                    self.unSavedDesignChange(!!err);  // report save returned with ERROR

                    itemFinished(err);
                },
                itemFinished = function (err) {
                    var msg,
                        duration = 3000;

                    if (remainingResponses) {
                        if (err) {
                            if (Array.isArray(err)) {
                                Array.prototype.push.apply(errList, err);
                            } else {
                                errList.push(err);
                            }
                        }

                        remainingResponses--;

                        if (!remainingResponses) {
                            if (errList.length) {
                                msg = 'Error: ' + errList.join('. ');
                                duration = undefined; // Show toast until user manually closes it
                            } else {
                                msg = 'Report Saved';
                            }
                            dtiReporting.toast(msg, duration);
                            self.activeSaveRequest(false);
                            $activeSidePane = $rightPanel.find(".side-nav-pane.active");
                            ui.blockUI($activeSidePane, self.activeDataRequest());  // don't display pane if datarequest is active
                        }
                    }
                };

            return {
                doSave: doSave,
                itemFinished: itemFinished,
                saveReportCallback: saveReportCallback,
                remainingResponses: remainingResponses
            };
        })();

    self.activeUniquenessCheck = ko.observable(false);

    self.pathIsValid = ko.observable(true);

    self.parentID = ko.observable(reportPoint.parentNode);

    self.reportType = ko.observable("");

    self.reportTypeEnum = ko.observable(0);

    self.selectedPageLength = ko.observable("24");

    self.selectedChartType = ko.observable("Line");

    self.currentTimeStamp = "";

    self.startDate = ko.observable("");

    self.endDate = ko.observable("");

    self.yaxisGroups = ["A", "B", "C", "D", "E", "F", "G"];

    self.reportDisplayTitle = ko.observable("");

    self.canEdit = ko.observable(true);

    self.intervalPeriod = ko.observable("Day");

    self.intervalValue = ko.observable(1);

    self.globalPrecisionValue = ko.observable(3);

    self.allChartCheckboxChecked = ko.observable(false);

    self.durationError = ko.observable(false);

    self.activeRequestDataDrawn = ko.observable(true);

    self.pointTypes = ko.observableArray([]);

    self.display = ko.observable("");

    self.unpersistedReport = ko.observable(false);

    self.name1Filter = ko.observable("");

    self.name2Filter = ko.observable("");

    self.name3Filter = ko.observable("");

    self.name4Filter = ko.observable("");

    self.selectedPointTypesFilter = ko.observableArray([]);

    self.reportDateRangeCollection = ko.observableArray([]);

    self.selectedDuration = ko.observable({
        startDate: moment(),
        endDate: moment().add(1, "day"),
        startTimeOffSet: "00:00",
        endTimeOffSet: "00:00",
        duration: moment().add(1, "day").diff(moment()),
        selectedRange: "Today"
    });

    self.durationStartTimeOffSet = ko.observable(self.selectedDuration().startTimeOffSet);

    self.durationEndTimeOffSet = ko.observable(self.selectedDuration().endTimeOffSet);

    self.listOfIntervals = ko.observableArray([]);

    self.listOfCalculations = ko.observableArray([]);

    self.scheduledReportData = ko.observable({});

    self.numberOfScheduledReportTables = ko.observable(0);

    self.listOfEntriesPerPage = ko.observableArray([]);

    self.listOfChartTypes = ko.observableArray([]);

    self.listOfReportTypes = ko.observableArray([]);

    self.listOfFilterPropertiesLength = 0;

    self.listOfColumnPropertiesLength = 0;

    self.filterPropertiesSearchFilter = ko.observable("-blank-");

    self.columnPropertiesSearchFilter = ko.observable("-blank-");

    self.chartSpinnerTitle = ko.observable("");

    self.truncatedData = ko.observable(false);

    self.designChanged = ko.observable(true);

    self.unSavedDesignChange = ko.observable(false);

    self.refreshData = ko.observable(true);

    self.activeSaveRequest = ko.observable(false);

    self.activeDataRequest = ko.observable(false);

    self.activePointSelectorRequest = ko.observable(false);

    self.activePointSelectorRow = ko.observable(-1);

    self.activePropertyFilterRequest = ko.observable({index: 0, status: false});

    self.activeRequestForChart = ko.observable(false);

    self.reportResultViewed = ko.observable(true);

    self.chartable = ko.observable(false);

    self.calculatable = ko.observable(false);

    self.currentTab = ko.observable(1);

    self.displayGridCalculations = ko.observable(true);

    self.displayGridFilters = ko.observable(true);

    self.listOfColumns = ko.observableArray([]);

    self.listOfFilters = ko.observableArray([]);

    self.globalcalculateColumnSelectedvalue = ko.observableArray([]);

    self.globalColumnMultiplier = ko.observable(1);

    self.globalColumnPrecision = ko.observable(3);

    self.globalColumnIncludeInChart = ko.observable(false);

    self.globalColumnYaxisGroup = ko.observable("");

    self.currentColumnEditIndex = ko.observable(1);

    self.globalFieldsColumnEditBefore = ko.observable({
        multiplier: 1,
        precision: 3,
        includeInChart: false,
        yaxisGroup: ""
    });

    self.currentColumnEdit = ko.observable(columnLogic.getNewColumnTemplate());

    self.scheduler = {
        availableReportRanges: (function buildReportDateRanges() {
            var intervals = ['Minute', 'Hour', 'Day', 'Week', 'Month'],
                dayInterval = intervals.slice(0, 2),
                weekInterval = intervals.slice(0, 3),
                monthInterval = intervals.slice(0, 4),
                arr = [{
                    value: 'Today',
                    text: 'Current Day',
                    intervals: dayInterval
                }, {
                    value: 'Yesterday',
                    text: 'Previous Day',
                    intervals: dayInterval
                }, {
                    value: 'Last 7 Days',
                    text: 'Previous 7 Days',
                    intervals: weekInterval
                }, {
                    value: 'Last Week',
                    text: 'Previous Week',
                    intervals: weekInterval
                }, {
                    value: 'Last 4 Weeks',
                    text: 'Previous 4 Weeks',
                    intervals: monthInterval
                }, {
                    value: 'This Month',
                    text: 'Current Month',
                    intervals: monthInterval
                }, {
                    value: 'Last Month',
                    text: 'Previous Month',
                    intervals: monthInterval
                }, {
                    value: 'This Year',
                    text: 'Current Year',
                    intervals: intervals
                }, {
                    value: 'Last Year',
                    text: 'Previous Year',
                    intervals: intervals
                }],
                obj = {};

            dtiReporting.forEachArray(arr, function (durationObj) {
                obj[durationObj.value] = durationObj;
            });

            return {
                asObject: obj,
                asArray: arr
            };
        })(),
        availableIntervals: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Advanced'],
        availableDates: (function buildAvailableDates() {
            var arr = [],
                j = 0,
                suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'],
                suffix;

            while (j++ < 31) {
                suffix = (j > 9 && j < 14) ? 'th' : suffixes[j % 10];
                arr.push({
                    text: j + suffix,
                    value: j
                });
            }
            return arr;
        })(),
        availableMonths: (function buildAvailableMonths() {
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                arr = [];

            dtiReporting.forEachArray(months, function addMonth(month, index) {
                arr.push({
                    text: month,
                    value: index + 1
                });
            });
            return arr;
        })(),
        availableDaysOfWeek: (function buildAvailableDaysOfWeek() {
            var dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                arr = [];

            dtiReporting.forEachArray(dow, function addDay(day, index) {
                arr.push({
                    text: day,
                    value: index
                });
            });
            return arr;
        })(),
        availableUsersObj: {}, // initialized in self.scheduler.init
        availableUsersLookup: {},
        scheduleEntries: ko.observableArray([]),
        cron: {
            parse: function (cron) {
                var name = ['minute', 'hour', 'dates', 'months', 'daysOfWeek'],
                    parsed = {},
                    advanced = false,
                    interval;

                dtiReporting.forEachArray(cron.split(' '), function (val, index) {
                    var _val;

                    if (index < 2) { // If hour or minute
                        if (val.length === 1) {
                            val = '0' + val;
                        }
                        _val = val;

                    } else {
                        _val = ko.observableArray([]);

                        if (!!~val.indexOf(',')) {
                            advanced = true;

                            dtiReporting.forEachArray(val.split(','), function (val, index) {
                                _val.push(val);
                            });
                        } else {
                            _val.push(val);
                        }
                    }
                    parsed[name[index]] = _val;
                });

                if (advanced) {
                    interval = 'Advanced';
                } else if (parsed.daysOfWeek()[0] !== '*') {
                    interval = 'Weekly';
                } else if (parsed.dates()[0] !== '*') {
                    interval = 'Monthly';
                } else if (parsed.months()[0] !== '*') {
                    interval = 'Yearly';
                } else {
                    interval = 'Daily';
                }
                parsed.interval = ko.observable(interval);
                parsed.time = ko.observable(parsed.hour + ':' + parsed.minute);
                parsed.plainEnglish = ko.observable(self.scheduler.cron.explain(parsed));

                delete parsed.minute;
                delete parsed.hour;

                // parsed = { // all keys are ko observable or observableArray
                //     interval: observable(string),
                //     plainEnglish: observable(string),
                //     time: observable(string),
                //     dates: observableArray(array),
                //     months: observableArray(array),
                //     daysOfWeek: observableArray(array)
                // }
                return parsed;
            },
            build: function (parsed) {
                var _parsed = ko.toJS(parsed),
                    interval = _parsed.interval,
                    time = _parsed.time.split(':'),
                    hour = time[0],
                    minute = time[1],
                    dates = _parsed.dates.join(','),
                    months = _parsed.months.join(','),
                    daysOfWeek = _parsed.daysOfWeek.join(',');

                if (interval === 'Daily') {
                    daysOfWeek = '*';
                    dates = '*';
                    months = '*';
                } else if (interval === 'Weekly') {
                    dates = '*';
                    months = '*';
                } else if (interval === 'Monthly') {
                    daysOfWeek = '*';
                    months = '*';
                } else if (interval === 'Yearly') {
                    daysOfWeek = '*';
                }

                if (hour.charAt(0) === '0') {
                    hour = hour[1];
                }
                if (minute.charAt(0) === '0') {
                    minute = minute[1];
                }

                return [minute, hour, dates, months, daysOfWeek].join(' ');
            },
            explain: function (cfg) {
                var str = '',
                    allDaysOfWeek = false,
                    allDates = false,
                    allMonths = false,
                    monthsText = [], // Starts as array, ends as string
                    daysOfWeekText = [], // Starts as array, ends as string
                    datesText = [], // Starts as array, ends as string
                    joinString,
                    months,
                    daysOfWeek,
                    dates,
                    interval,
                    time,
                    len;

                if (typeof cfg === 'object') {
                    interval = ko.unwrap(cfg.interval);
                    time = ko.unwrap(cfg.time);
                    daysOfWeek = ko.unwrap(cfg.daysOfWeek);
                    dates = ko.unwrap(cfg.dates);
                    months = ko.unwrap(cfg.months);

                    if (interval === 'Daily') {
                        str = ['Daily at', time].join(' ');
                    } else if (interval === 'Weekly') {
                        str = ['Weekly on', self.scheduler.availableDaysOfWeek[daysOfWeek[0]].text, 'at', time].join(' ');
                    } else if (interval === 'Monthly') {
                        str = ['Monthly on the', self.scheduler.availableDates[dates[0] - 1].text, 'at', time].join(' ');
                    } else if (interval === 'Yearly') {
                        str = ['Yearly on', self.scheduler.availableMonths[months[0] - 1].text, self.scheduler.availableDates[dates[0] - 1].text, 'at', time].join(' ');
                    } else { // Advanced
                        len = months.length;
                        if (months[0] === '*') {
                            allMonths = true;
                        } else {
                            dtiReporting.forEachArray(months, function (val, index) {
                                monthsText.push(self.scheduler.availableMonths[val - 1].text);
                            });

                            if (len > 1) {
                                monthsText[len - 1] = 'and ' + monthsText[len - 1];
                            }

                            if (len > 2) {
                                joinString = ', ';
                            } else {
                                joinString = ' ';
                            }

                            monthsText = monthsText.join(joinString);
                        }

                        if (daysOfWeek[0] === '*') {
                            allDaysOfWeek = true;
                        } else {
                            dtiReporting.forEachArray(daysOfWeek, function (val) {
                                daysOfWeekText.push(self.scheduler.availableDaysOfWeek[val].text);
                            });

                            len = daysOfWeek.length;
                            if (len > 1) {
                                daysOfWeekText[len - 1] = 'and ' + daysOfWeekText[len - 1];
                            }
                            if (len > 2) {
                                joinString = ', ';
                            } else {
                                joinString = ' ';
                            }

                            daysOfWeekText = daysOfWeekText.join(joinString);
                        }

                        if (dates[0] === '*') {
                            allDates = true;
                        } else {
                            dtiReporting.forEachArray(dates, function (val) {
                                datesText.push(self.scheduler.availableDates[val - 1].text);
                            });

                            len = dates.length;
                            if (len > 1) {
                                datesText[len - 1] = 'and ' + datesText[len - 1];
                            }
                            if (len > 2) {
                                joinString = ', ';
                            } else {
                                joinString = ' ';
                            }

                            datesText = datesText.join(joinString);
                        }

                        if (allDates && allDaysOfWeek) {
                            if (allMonths) {
                                str = 'Everyday at ' + time;
                            } else {
                                str = ['Everyday in', monthsText, 'at', time].join(' ');
                            }
                        } else if (allDaysOfWeek) {
                            if (allMonths) {
                                str = ['Every month on the', datesText, 'at', time].join(' ');
                            } else {
                                str = ['Every', datesText, 'day of', monthsText, 'at', time].join(' ');
                            }
                        } else if (allDates) {
                            if (allMonths) {
                                str = ['Every', daysOfWeekText, 'at', time].join(' ');
                            } else {
                                str = ['Every', daysOfWeekText, 'in', monthsText].join(' ');
                            }
                        } else { // allDates -> false, allDaysOfWeek -> false
                            if (allMonths) {
                                str = ['Every week on', daysOfWeekText + ',', 'and on the', datesText, 'of every month'].join(' ');
                            } else {
                                str = ['In the month(s) of', monthsText + ',', 'every', daysOfWeekText, 'and on the', datesText].join(' ');
                            }
                        }
                    }
                } else { // cfg is cron string
                    // design space
                }
                return str;
            }
        },
        modal: {
            init: () => {

            },
            open: function (data) {
                var _parsed,
                    autosuggest,
                    isValidEmailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,
                    $modal = dtiReporting.utility.getTemplate('#scheduleModalTemplate'),
                    $chips = $modal.find('.chips'),
                    $input = null,
                    $selectInterval = null,
                    timepickerOpts = {
                        container: $('body')
                    },
                    recipientUsers = (function () {
                        var arr = [];

                        if (data !== 'new') {
                            dtiReporting.forEachArray(data.users(), function (userId) {
                                var user = self.scheduler.availableUsersLookup[userId];

                                if (user) {
                                    user = user['First Name'].Value + ' ' + user['Last Name'].Value;
                                }
                                arr.push(user || userId);
                            });
                        }
                        return arr;
                    })(),
                    recipientEmails = (function () {
                        var arr = [];

                        if (data !== 'new') {
                            $.extend(arr, data.emails());
                        }
                        return arr;
                    })(),
                    bindings = {
                        isNew: false,
                        availableReportRanges: self.scheduler.availableReportRanges.asArray,
                        availableIntervals: self.scheduler.availableIntervals,
                        availableDaysOfWeek: self.scheduler.availableDaysOfWeek,
                        availableMonths: self.scheduler.availableMonths,
                        availableDates: self.scheduler.availableDates,
                        selectedInterval: ko.observable(),
                        selectedTime: ko.observable('08:00'),
                        selectedMonth: ko.observable(),
                        selectedMonths: ko.observableArray([]),
                        selectedDate: ko.observable(),
                        selectedDates: ko.observableArray([]),
                        selectedDayOfWeek: ko.observable(),
                        selectedDaysOfWeek: ko.observableArray([]),
                        selectedReportRange: ko.observable(),
                        selectedReportIntervalPeriod: ko.observable(),
                        selectedReportIntervalValue: ko.observable(1),
                        selectedReportStartTimeOffset: ko.observable('00:00'),
                        selectedReportEndTimeOffset: ko.observable('00:00'),
                        displayDuration: ko.observable(self.reportType() !== "Property"),
                        displayInterval: ko.observable(self.reportType() !== "Property"),
                        update: () => {
                            var parsed,
                                len;

                            if (data === 'new') {
                                data = self.scheduler.getNewScheduleObject();
                                self.scheduler.scheduleEntries.push(data);
                            }

                            data.users(recipientUsers.map(function (name) {
                                return self.scheduler.availableUsersObj[name]._id;
                            }));
                            data.emails(recipientEmails);
                            data.isValid = ko.observable(data.users().length > 0 || data.emails().length > 0);

                            data.optionalParameters.duration({
                                selectedRange: bindings.selectedReportRange().value,
                                startTimeOffSet: bindings.selectedReportStartTimeOffset(),
                                endTimeOffset: bindings.selectedReportEndTimeOffset(),
                                startDate: null,
                                endDate: null
                            });
                            data.optionalParameters.interval({
                                period: bindings.selectedReportIntervalPeriod(),
                                value: bindings.selectedReportIntervalValue()
                            });

                            parsed = data.parsed; // Shortcut

                            parsed.interval(bindings.selectedInterval());
                            parsed.time(bindings.selectedTime());

                            if (bindings.selectedInterval() === 'Advanced') {
                                len = bindings.selectedMonths().length;
                                if (len === 0 || len === 12) {
                                    parsed.months(['*']);
                                } else {
                                    parsed.months(bindings.selectedMonths());
                                }

                                len = bindings.selectedDates().length;
                                if (len === 0 || len === 31) {
                                    parsed.dates(['*']);
                                } else {
                                    parsed.dates(bindings.selectedDates());
                                }

                                len = bindings.selectedDaysOfWeek().length;
                                if (len === 0 || len === 7) {
                                    parsed.daysOfWeek(['*']);
                                } else {
                                    parsed.daysOfWeek(bindings.selectedDaysOfWeek());
                                }
                            } else {
                                parsed.months([bindings.selectedMonth()]);
                                parsed.dates([bindings.selectedDate()]);
                                parsed.daysOfWeek([bindings.selectedDayOfWeek()]);
                            }

                            parsed.plainEnglish(self.scheduler.cron.explain(parsed));
                            data.runTime = self.scheduler.cron.build(parsed);

                            self.scheduler.setDirty(data);

                            done();
                        },
                        cancel: () => {
                            done();
                        },
                        deleteScheduleEntry: () => {
                            if (!data._id) { // If this is a new entry that hasn't been saved to the db
                                self.scheduler.scheduleEntries.remove(data);
                            } else {
                                data.deleteMe(true);
                                self.scheduler.setDirty(data);
                            }
                            self.scheduler.modal.close();
                        },
                        handleDurationChange: () => {
                            // Re-run material_select on our interval select element because our options have changed
                            $selectInterval.material_select();
                        }
                    },
                    done = () => {
                        autosuggest.destroy();
                        autosuggest = null;
                        $modal = null;
                        $chips = null;
                        $input = null;
                        $selectInterval = null;

                        self.scheduler.modal.close();
                    };

                if (data === 'new') {
                    bindings.isNew = true;
                    bindings.selectedInterval('Daily');
                } else {
                    _parsed = ko.toJS(data.parsed);

                    // 'Interval' and 'time' are immutable (strings) so we don't have to worry about them changing
                    bindings.selectedInterval(_parsed.interval);
                    bindings.selectedTime(_parsed.time);

                    // bindings.selectedReportStartTime(data.selectedReportStartTime());
                    // bindings.selectedReportEndTime(data.selectedReportEndTime());

                    if (bindings.selectedInterval() === 'Advanced') {
                        // Our view indicates all months/dates/daysOfWeek if the array is empty
                        // Extend the source arrays so we don't manipulate the original in case the user cancels changes
                        if (_parsed.months[0] !== '*') {
                            bindings.selectedMonths($.extend([], _parsed.months));
                        }
                        if (_parsed.dates[0] !== '*') {
                            bindings.selectedDates($.extend([], _parsed.dates));
                        }
                        if (_parsed.daysOfWeek[0] !== '*') {
                            bindings.selectedDaysOfWeek($.extend([], _parsed.daysOfWeek));
                        }
                    } else {
                        bindings.selectedMonth(_parsed.months[0]);
                        bindings.selectedDate(_parsed.dates[0]);
                        bindings.selectedDayOfWeek(_parsed.daysOfWeek[0]);
                    }

                    bindings.selectedReportRange(self.scheduler.availableReportRanges.asObject[data.optionalParameters.duration().selectedRange]);
                    bindings.selectedReportStartTimeOffset(data.optionalParameters.duration().startTimeOffSet);
                    bindings.selectedReportEndTimeOffset(data.optionalParameters.duration().endTimeOffset);
                    bindings.selectedReportIntervalPeriod(data.optionalParameters.interval().period);
                    bindings.selectedReportIntervalValue(data.optionalParameters.interval().value);
                }

                // Apply bindings and add our markup
                ko.applyBindings(bindings, $modal[0]);
                $('body').append($modal);

                // Init our materialize form elements
                $modal.find('.dropdown-button').dropdown();
                $modal.find('select').material_select();

                // Init our timepickers
                timepickerOpts.default = bindings.selectedTime();
                dtiReporting.pickatime($modal.find('#timepicker, #timepicker2'), timepickerOpts);

                timepickerOpts.default = bindings.selectedReportStartTimeOffset();
                dtiReporting.pickatime($modal.find('#reportStartTimeOffset'), timepickerOpts);

                timepickerOpts.default = bindings.selectedReportEndTimeOffset();
                dtiReporting.pickatime($modal.find('#reportEndTimeOffset'), timepickerOpts);

                // Init our chips element
                $chips.material_chip({
                    placeholder: '+Recepient',
                    secondaryPlaceholder: 'Email Recepients',
                    data: recipientUsers.concat(recipientEmails).map(function (text) {
                        return {
                            tag: text
                        };
                    })
                });

                $input = $chips.find('input');
                $selectInterval = $modal.find('#selectInterval');

                $chips.addClass('tooltipped');
                $chips.tooltip({
                    delay: 500,
                    tooltip: 'Select a user and/or enter an email address manually',
                    position: 'top'
                });

                $chips.on('chip.add', function (e, chip) {
                    if (self.scheduler.availableUsersObj[chip.tag]) {
                        recipientUsers.push(chip.tag);

                        // This event is fired before the input element's value is cleared. We need to manually clear the input
                        // value before calling autosuggest.remove because it re-filters the list based on the input value
                        $input.val('');
                        autosuggest.removeData('All users', chip.tag);
                    } else if (isValidEmailRegex.test(chip.tag)) {
                        recipientEmails.push(chip.tag);
                    } else {
                        $chips.find('.chip').last().addClass('err');
                    }
                });

                $chips.on('chip.delete', function (e, chip) {
                    var ndx;

                    if (self.scheduler.availableUsersObj[chip.tag]) {
                        recipientUsers.splice(recipientUsers.indexOf(chip.tag), 1);
                        autosuggest.addData('All users', [chip.tag]);
                    } else {
                        // Search for this in recipientEmails because it may not exist (i.e. if the email was invalid)
                        ndx = recipientEmails.indexOf(chip.tag);
                        if (ndx > -1) {
                            recipientEmails.splice(ndx, 1);
                        }
                    }
                });

                autosuggest = new dtiReporting.autosuggest.Autosuggest({
                    $inputElement: $input,
                    $resultsContainer: $modal,
                    $chips: $chips,
                    sources: [{
                        name: 'All users',
                        nameShown: true,
                        data: Object.keys(self.scheduler.availableUsersObj).filter(function (name) {
                            return recipientUsers.indexOf(name) > -1 ? false : true;
                        })
                    }],
                    autoselect: true,
                    showOnFocus: true,
                    enterOnBlur: true,
                    persistAfterSelect: true
                });

                // Launch the miss-aisles!
                $modal.openModal({
                    dismissible: false
                });
            },
            close: () => {
                var $modal = $('#scheduleModal');

                $modal.closeModal({
                    complete: () => {
                        ko.cleanNode($modal[0]);
                        $modal.find('select').material_select('destroy');
                        $modal.find('.tooltipped').tooltip('remove');
                        $modal.find('.chips').off(); // Detach event listeners
                        $modal.remove();
                    }
                });
            }
        },
        gettingDataSemaphore: {
            value: ko.observable(0),
            increment: () => {
                self.scheduler.gettingDataSemaphore.value(self.scheduler.gettingDataSemaphore.value() + 1);
            },
            decrement: () => {
                self.scheduler.gettingDataSemaphore.value(self.scheduler.gettingDataSemaphore.value() - 1);
            }
        },
        buildRecipients: function (data) {
            var arr = [],
                str,
                i;

            dtiReporting.forEachArray(data.users(), function (userId) {
                var user = self.scheduler.availableUsersLookup[userId];

                if (user) {
                    user = user['First Name'].Value + ' ' + user['Last Name'].Value;
                }
                arr.push(user || userId);
            });
            arr = arr.concat(data.emails());

            if (!arr.length) {
                str = 'no one';
            } else if (arr.length <= 2) {
                str = arr.join(' and ');
            } else {
                str = arr.join(', ');
                i = str.lastIndexOf(',') + 1;
                str = str.substring(0, i) + ' and ' + str.slice(i);
            }
            return str;
        },
        setDirty: function (data) {
            data.isDirty(true);
            return true;
        },
        getNewScheduleObject: function (cfg) {
            var defaults = {
                    runTime: '0 8 * * *',
                    type: 1, // TODO this should come from enumsTemplate - 1 means reports
                    upi: reportPoint._id,
                    optionalParameters: {
                        duration: ko.observable({
                            startDate: null,
                            endDate: null,
                            startTimeOffSet: '',
                            endTimeOffset: '',
                            selectedRange: ''
                        }),
                        interval: ko.observable({
                            period: '',
                            value: 1
                        })
                    },
                    users: ko.observableArray([]),
                    emails: ko.observableArray([]),
                    enabled: ko.observable(true),
                    transport: ko.observable('email'),
                    // Following are keys used by UI but removed before the object is sent to the server
                    isDirty: ko.observable(true),
                    parsed: null,
                    deleteMe: ko.observable(false)
                },
                schedule = $.extend(defaults, cfg);

            schedule.parsed = self.scheduler.cron.parse(schedule.runTime);

            return schedule;
        },
        runNow: function (data, e) {
            var $btn = $(e.target),
                toast = function (err) {
                    var msg;

                    if (err) {
                        msg = 'An unexpected error occurred';
                    } else {
                        msg = 'Success. Your report will be emailed shortly.';
                    }
                    dtiReporting.toast(msg, 4000);
                };

            $btn.attr('disabled', true);
            $btn.removeClass('waves-effect');

            $.ajax({
                type: 'post',
                url: dtiReporting.settings.apiEndpoint + 'schedules/runSchedule',
                data: JSON.stringify({
                    _id: data._id
                }),
                contentType: 'application/json'
            }).done(
                function handleData(data) {
                    if (data.err) {
                        dtiReporting.log('schedules/runSchedule error', data.err);
                    }
                    toast(data.err);
                }
            ).fail(
                function handleFail(jqXHR, textStatus, errorThrown) {
                    dtiReporting.log('schedules/runSchedule fail', jqXHR, textStatus, errorThrown);
                    toast(true);
                }
            ).always(
                function finished() {
                    $btn.attr('disabled', false);
                    $btn.addClass('waves-effect');
                }
            );
        },
        saveScheduleEntries: function (callback) {
            // callback is required
            var schedulesToSave = [],
                haveNewEntries = false,
                err = false;

            dtiReporting.forEachArray(self.scheduler.scheduleEntries(), function addToSaveList(schedule) {
                if (schedule.isDirty()) {
                    // Get a shallow copy of the source so we can remove the UI-only keys
                    schedule = $.extend({}, ko.toJS(schedule));
                    delete schedule.isDirty;
                    delete schedule.parsed;
                    delete schedule.isValue;
                    if (schedule.deleteMe === false) {
                        delete schedule.deletMe;
                    }

                    // If this is a new schedule entry, set a flag
                    if (!schedule._id) {
                        haveNewEntries = true;
                    }

                    schedulesToSave.push(schedule);
                }
            });

            if (schedulesToSave.length) {
                $.ajax({
                    type: 'post',
                    url: dtiReporting.settings.apiEndpoint + 'schedules/saveSchedules',
                    data: JSON.stringify({
                        schedules: schedulesToSave
                    }),
                    contentType: 'application/json'
                }).done(
                    function handleData(data) {
                        if (data.err) {
                            err = data.err;
                            return dtiReporting.log('schedules/saveSchedules error', data.err);
                        }
                    }
                ).fail(
                    function handleFail(jqXHR, textStatus, errorThrown) {
                        err = textStatus + ' ' + errorThrown;
                        dtiReporting.log('schedules/saveSchedules fail', jqXHR, textStatus, errorThrown);
                    }
                ).always(
                    function finished() {
                        if (!err) {
                            if (haveNewEntries) {
                                // Refetch all the entries to get the _id fields on the newly added ones - we use the
                                // absence of the _id field to indicate a new entry
                                return self.scheduler.getScheduleEntries(callback);
                            }
                            // Clear our isDirty flags
                            dtiReporting.forEachArray(self.scheduler.scheduleEntries(), function clearDirtyFlag(schedule) {
                                schedule.isDirty(false);
                            });
                        }
                        callback(err);
                    }
                );
            } else {
                callback(null);
            }
        },
        getScheduleEntries: function (callback) {
            // callback is optional
            var err;

            self.scheduler.gettingDataSemaphore.increment();

            $.ajax({
                type: 'post',
                url: dtiReporting.settings.apiEndpoint + 'schedules/getSchedules',
                data: JSON.stringify({
                    upi: reportPoint._id
                }),
                contentType: 'application/json'
            }).done(
                function handleData(data) {
                    if (data.err) {
                        err = data.err;
                        return dtiReporting.log('schedules/getSchedules error', data.err);
                    }

                    self.scheduler.scheduleEntries.removeAll();

                    dtiReporting.forEachArray(data.schedules, function addSchedule(schedule) {
                        // Add UI-only keys
                        schedule.isDirty = ko.observable(false);
                        schedule.parsed = self.scheduler.cron.parse(schedule.runTime);
                        schedule.deleteMe = ko.observable(false);
                        // Convert some keys to observables
                        schedule.optionalParameters.duration = ko.observable(schedule.optionalParameters.duration);
                        schedule.optionalParameters.interval = ko.observable(schedule.optionalParameters.interval);
                        schedule.isValid = ko.observable(schedule.users.length > 0 || schedule.emails.length > 0);
                        schedule.users = ko.observableArray(schedule.users);
                        schedule.emails = ko.observableArray(schedule.emails);
                        schedule.enabled = ko.observable(schedule.enabled);
                        // Add the schedule to our array
                        self.scheduler.scheduleEntries.push(schedule);
                    });
                }
            ).fail(
                function handleFail(jqXHR, textStatus, errorThrown) {
                    err = textStatus + ' ' + errorThrown;
                    dtiReporting.log('schedules/getSchedules fail', jqXHR, textStatus, errorThrown);
                }
            ).always(
                function finished() {
                    self.scheduler.gettingDataSemaphore.decrement();

                    if (callback) { // Let callback handle/report error
                        callback(err);
                    } else if (err) {
                        dtiReporting.toast('Error: ' + err);
                    }
                }
            );
        },
        getUsers: () => {
            var err;

            self.scheduler.gettingDataSemaphore.increment();

            $.ajax({
                type: 'post',
                url: dtiReporting.settings.apiEndpoint + 'security/users/getallusers',
                contentType: 'application/json'
            }).done(
                function handleData(data) {
                    if (data.err) {
                        err = data.err;
                        return dtiReporting.log('security/users/getallusers error', data.err);
                    }

                    dtiReporting.forEachArray(data.Users, function (user) {
                        self.scheduler.availableUsersObj[user['First Name'].Value + ' ' + user['Last Name'].Value] = user;
                        self.scheduler.availableUsersLookup[user._id] = user;
                    });
                }
            ).fail(
                function handleFail(jqXHR, textStatus, errorThrown) {
                    err = textStatus + ' ' + errorThrown;
                    dtiReporting.log('security/users/getallusers fail', jqXHR, textStatus, errorThrown);
                }
            ).always(
                function finished() {
                    self.scheduler.gettingDataSemaphore.decrement();
                    if (err) {
                        dtiReporting.toast('Error: ' + err);
                    }
                }
            );
        },
        init: () => {
            if (!scheduledReport) {
                self.scheduler.getScheduleEntries();
                self.scheduler.getUsers();
            }
        }
    };

    self.printChartDiv = () => {
        render.baseChart(true);
        setTimeout(function () {
            $reportChartDiv.printArea({
                mode: "iframe"
            });
            $reportChartDiv.parent().css("overflow", "auto");
        }, 1500);
    };

    self.deleteColumnRow = (item) => {
        self.listOfColumns.remove(item);
        columnLogic.updateListOfColumns(self.listOfColumns());
        return true;
    };

    self.deleteFilterRow = (item) => {
        self.listOfFilters.remove(item);
        filterLogic.updateListOfFilters(self.listOfFilters());
    };

    self.init = (externalConfig) => {
        let columns,
            reportConfig,
            initializeForMaterialize = () => {
                columnLogic.updateListOfColumns(self.listOfColumns());
                filterLogic.updateListOfFilters(self.listOfFilters());
                self.startDate.valueHasMutated();
                self.endDate.valueHasMutated();
                if (self.reportType() !== "Property" && !scheduledReport) {
                    let $reportStartDatePicker = $additionalFilters.find("#reportStartDate").pickadate('picker'),
                        $reportEndDatePicker = $additionalFilters.find("#reportEndDate").pickadate('picker');

                    $additionalFilters.find(".reportRangeDropdown select").material_select();
                    $reportStartDatePicker.set('select', self.startDate() * 1000);
                    $reportEndDatePicker.set({min: new Date(self.startDate() * 1000)});
                    $reportEndDatePicker.set('select', self.endDate() * 1000);
                    $reportStartDatePicker.set({max: new Date(self.endDate() * 1000)});
                    // $additionalFilters.find("#startTimepicker").pickatime('picker').set('select', self.durationStartTimeOffSet());
                    // $additionalFilters.find("#endTimepicker").pickatime('picker').set('select', self.durationEndTimeOffSet());
                }
                Materialize.updateTextFields();
                // too late  initKnockout();
            },
            setCurrentUser = function (results) {
                currentUser = results;
            },
            initGlobals = () => {
                if (window.getWindowParameters) {
                    var cfg = window.getWindowParameters();

                    if (cfg.pointData) {
                        reportPoint = $.extend(true, {}, cfg.pointData);
                    }

                    if (cfg.afterSaveCallback) {
                        afterSaveCallback = cfg.afterSaveCallback;
                    }
                }

                var dateRanges = reportDateRanges(),
                    dateRangeCollection = [],
                    key;

                for (key in dateRanges) {
                    if (dateRanges.hasOwnProperty(key)) {
                        dateRangeCollection.push(key);
                    }
                }

                if (dateRangeCollection.length > 0) {
                    dateRangeCollection.push("Custom Range");
                }

                self.reportDateRangeCollection(dateRangeCollection);

                dtiUtility.getConfig("Enums", null, (enums) => {
                    ENUMSTEMPLATESENUMS = enums;
                    postConfigInit();
                });
            },
            postConfigInit = () => {
                if (!!reportPoint) {
                    self.parentID(reportPoint.parentNode);
                    self.canEdit(userCanEdit(reportPoint, permissionLevels.WRITE));
                    originalPoint = JSON.parse(JSON.stringify(reportPoint));
                    if (reportPoint["Report Config"] === undefined) {
                        reportPoint["Report Config"] = {};
                    }
                    self.reportType(reportPoint["Report Type"].Value);
                    reportConfig = (reportPoint["Report Config"] ? reportPoint["Report Config"] : undefined);
                    columns = (reportConfig ? reportConfig.columns : undefined);
                    self.display(reportPoint.display);

                    if (!scheduledReport) {
                        dtiUtility.getConfig("Utility.pointTypes.getAllowedPointTypes", ["Column Point", "Report"], self.pointTypes);
                        initSocket();
                    }

                    if (columns) {
                        reportUtil.initExistingReport(reportConfig);
                    } else { // Initial config
                        reportUtil.initNewReport();
                    }

                    $direports.find("#wrapper").show();
                    ui.tabSwitch(1);

                    filterLogic.updateListOfFilters(self.listOfFilters());
                    setTimeout(function () {
                        $reportTitleInput.focus();
                        reportName = $reportTitleInput.val();
                    }, 1500);
                    ui.registerEvents();
                    reportCalc.checkForColumnCalculations();
                    reportCalc.checkForIncludeInChart();
                    ui.adjustConfigTabActivePaneHeight();
                    if (scheduledReport && !!includeChart) {
                        reportUtil.configureSelectedDuration(scheduledConfig);
                        self.requestReportData();
                    } else if (!!externalConfig) {
                        if (self.reportType() === "History" || self.reportType() === "Totalizer") {
                            reportUtil.configureSelectedDuration(externalConfig);
                        }
                        self.requestReportData();
                    }

                    self.filterPropertiesSearchFilter(""); // computed props jolt
                    self.columnPropertiesSearchFilter(""); // computed props jolt
                    self.filterPropertiesSearchFilter.valueHasMutated();
                    self.columnPropertiesSearchFilter.valueHasMutated();
                    if (self.reportType() === "Property") {
                        // property reports only use Pie charts
                        self.listOfChartTypes([{
                            text: "Pie",
                            value: "pie"
                        }]);
                    }

                    initializeForMaterialize();
                }

                window.setTimeout(function () {
                    $tabConfiguration.find('ul.tabs').tabs();
                    $tabViewReport.find('ul.tabs').tabs();
                }, 200);
            };

        ui.getScreenFields();
        initKnockout();
        dtiUtility.getUser(setCurrentUser);

        exportEventSet = false;
        activeDataRequests = [];
        if (!scheduledReport) {
            initGlobals();
        } else {
            postConfigInit();
        }
    };

    self.operators = (op) => {
        var opArray = [];
        switch (op) {
            case "Bool":
            case "BitString":
            case "UniquePID":
            case "Enum":
            case "undecided":
                opArray.push({text: "=", value: "EqualTo"},
                    {text: "!=", value: "NotEqualTo"});
                break;
            case "String":
                opArray.push(
                    {text: "=", value: "EqualTo"},
                    {text: "!=", value: "NotEqualTo"},
                    {text: "{*}", value: "Containing"},
                    {text: "{!*}", value: "NotContaining"}
                );
                break;
            case "Float":
            case "Integer":
            case "Unsigned":
            case "null":
            case "MinSec":
            case "HourMin":
            case "HourMinSec":
            case "DateTime":
            case "Timet":
                opArray.push({text: "=", value: "EqualTo"},
                    {text: "!=", value: "NotEqualTo"},
                    {text: ">", value: "GreaterThan"},
                    {text: "<", value: "LessThan"},
                    {text: ">=", value: "GreaterThanOrEqualTo"},
                    {text: "<=", value: "LessThanOrEqualTo"});
                break;
            case "None":
                opArray.push(
                    {text: "=", value: "EqualTo"},
                    {text: "!=", value: "NotEqualTo"},
                    {text: "{*}", value: "Containing"},
                    {text: "{!*}", value: "NotContaining"},
                    {text: ">", value: "GreaterThan"},
                    {text: "<", value: "LessThan"},
                    {text: ">=", value: "GreaterThanOrEqualTo"},
                    {text: "<=", value: "LessThanOrEqualTo"});

                break;
            default:
                opArray.push(
                    {text: "=", value: "EqualTo"},
                    {text: "!=", value: "NotEqualTo"}
                );
                break;
        }
        return opArray;
    };

    self.conditions = () => {
        return [
            {text: "AND", value: "$and"},
            {text: "OR", value: "$or"}
        ];
    };

    self.displayCondition = (op) => {
        var answer;
        switch (op) {
            case "$and":
                answer = "AND";
                break;
            case "$or":
                answer = "OR";
                break;
            default:
                answer = op;
                break;
        }
        return answer;
    };

    self.displayOperator = (con) => {
        var answer;
        switch (con) {
            case "EqualTo":
                answer = "=";
                break;
            case "NotEqualTo":
                answer = "!=";
                break;
            case "Containing":
                answer = "{*}";
                break;
            case "NotContaining":
                answer = "{!*}";
                break;
            case "GreaterThan":
                answer = ">";
                break;
            case "GreaterThanOrEqualTo":
                answer = ">=";
                break;
            case "LessThan":
                answer = "<";
                break;
            case "LessThanOrEqualTo":
                answer = "<=";
                break;
            default:
                answer = con;
                break;
        }
        return answer;
    };

    self.displayBool = (val) => {
        var answer;
        switch (val) {
            case true:
            case "True":
            case 1:
                answer = "Yes";
                break;
            case false:
            case "False":
            case 0:
                answer = "No";
                break;
            default:
                answer = val;
                break;
        }
        return answer;
    };

    self.selectPointForColumn = (data, index) => {
        var currentIndex = (typeof index === "function" ? index() : index),
            columnIndex = parseInt(currentIndex, 10);

        pointSelector.openForColumn(columnIndex);
    };

    self.selectPointForModalColumn = () => {
        pointSelector.openForModalColumn();
    };

    self.selectPointForFilter = (data, index) => {
        var currentIndex = (typeof index === "function" ? index() : index),
            columnIndex = parseInt(currentIndex, 10);

        self.activePointSelectorRequest(true);
        self.activePointSelectorRow(columnIndex);
        pointSelector.openForFilter(columnIndex);
    };

    self.pointSelectorFilter = () => {
        pointSelector.openForFilterMode();
    };

    self.showPointReviewViaIndex = (index) => {
        self.showPointReview(self.listOfColumns()[index]);
    };

    self.showPointReview = (data) => {
        var upi = parseInt(data.upi, 10);
        if (upi > 0) {
            dtiUtility.openWindow({
                upi: upi,
                pointType: data.pointType
            });
        }
    };

    self.reportConfiguration = (e) => {
        ui.tabSwitch(1);
        setTimeout(function () {
            $tabConfiguration.find("ul.tabs").find("li a.active").click();
        }, 100);
    };

    self.requestReportData = () => {
        if (!self.unpersistedReport()) {
            if (!self.durationError()) {
                // TODO to Materialize  $(".tableFooter > td").popover("destroy");
                var requestObj = buildReportDataRequest();
                if (!!requestObj) {
                    if (self.currentTab() !== 2) {
                        ui.tabSwitch(2);
                        self.selectViewReportTabSubTab("gridData");
                    }
                    if (self.reportResultViewed()) {
                        self.activeDataRequest(true);
                        self.reportResultViewed(false);
                        $tabViewReport.hide();
                        if (!scheduledReport) {
                            configureDataTable(true, true);
                        }
                        reportData = undefined;
                        switch (self.reportType()) {
                            case "History":
                                ajaxCall("POST", requestObj, dataUrl + "/report/historyDataSearch", render.historyReport);
                                break;
                            case "Totalizer":
                                ajaxCall("POST", requestObj, dataUrl + "/report/totalizerReport", render.totalizerReport);
                                break;
                            case "Property":
                                ajaxCall("POST", requestObj, dataUrl + "/report/reportSearch", render.propertyReport);
                                break;
                            default:
                                console.log(" - - - DEFAULT  requestReportData()");
                                break;
                        }
                    } else {
                        self.activeRequestDataDrawn(false);
                        render.baseReport();
                    }
                }
            } else {
                ui.displayError("Invalid Date Time selection");
            }
            $("html,body").stop().animate({
                scrollTop: 0
            }, 700);
        }
    };

    self.requestChart = (printFormat) => {
        self.selectViewReportTabSubTab("chartData");
        $reportChartDiv.html("");
        render.baseChart(printFormat, scheduledReport);
    };

    self.focusChartView = (element) => {
        $reportChartDiv.html("");
        $reportChartDiv.parent().css("overflow", "");
        render.baseChart(null, scheduledReport);
    };

    self.focusGridView = (element) => {
        // self.selectViewReportTabSubTab("gridData");
        // $viewReportNav.find("gridData a").addClass("active");
        // $viewReportNav.find("chartData a").removeClass("active");
        // ui.adjustViewReportTabHeightWidth();
    };

    self.clearColumnPoint = (indexOfColumn) => {
        var tempArray = self.listOfColumns();
        tempArray[indexOfColumn] = columnLogic.getNewColumnTemplate();
        columnLogic.updateListOfColumns(tempArray);
        return true;
    };

    self.addNewColumn = (element, indexOfColumn) => {
        var newColumn = columnLogic.getNewColumnTemplate(),
            tempArray = self.listOfColumns();

        if (!!indexOfColumn) {
            tempArray.splice(indexOfColumn, 0, newColumn);
        } else {
            tempArray.push(newColumn);
        }

        columnLogic.updateListOfColumns(tempArray);
        if ($(element).hasClass("rightSideAddButton")) {
            $gridColumnConfig.stop().animate({
                scrollLeft: $gridColumnConfigTable.get(0).scrollWidth
            }, 600);
        }
        return true;
    };

    self.deleteReportColumn = (indexOfColumn) => {
        var tempArray = self.listOfColumns();
        tempArray.splice(indexOfColumn, 1);
        columnLogic.updateListOfColumns(tempArray);
        return true;
    };

    self.clearModalColumnPoint = () => {
        self.currentColumnEdit(columnLogic.getNewColumnTemplate());
    };

    self.editColumnSelectYaxisGroup = (selectedGroup) => {
        self.currentColumnEdit().yaxisGroup = selectedGroup;
        self.currentColumnEdit.valueHasMutated();
    };

    self.setCurrentColumnField = (fieldName, newValue) => {
        self.currentColumnEdit()[fieldName] = newValue;
        self.currentColumnEdit().dataColumnName = self.currentColumnEdit().upi + " - " + self.currentColumnEdit().operator.toLowerCase();
        self.currentColumnEdit.valueHasMutated();
    };

    self.setEditedColumnData = () => {
        var tempArray = self.listOfColumns();

        tempArray[self.currentColumnEditIndex()] = self.currentColumnEdit();
        columnLogic.updateListOfColumns(tempArray);
        $editColumnModal.closeModal();
        return true;
    };

    self.closeEditColumnModal = () => {
        $editColumnModal.closeModal();
    };

    self.clearColumnCalculation = (indexOfColumn) => {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.calculation = [];
        columnLogic.updateListOfColumns(tempArray);
        return true;
    };

    self.calculationClick = (element, calc, indexOfColumn) => {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
            // $ul = $(element).parent().parent(),
            // $dropdown = $ul.siblings();

        if (element.checked === true) {
            if (column.calculation.indexOf(calc) === -1) {
                column.calculation.push(calc);
            }
        } else {
            if (column.calculation.indexOf(calc) !== -1) {
                column.calculation.splice(column.calculation.indexOf(calc), 1);
            }
        }

        // updateListOfColumns(tempArray);
        return true;
    };

    self.globalCalculationClick = (element, calc) => {
        var i,
            tempArray = self.listOfColumns(),
            column;

        for (i = 0; i < tempArray.length; i++) {
            column = tempArray[i];

            if (element.checked === true) {
                if (column.calculation.indexOf(calc) === -1) {
                    column.calculation.push(calc);
                }
            } else {
                if (column.calculation.indexOf(calc) !== -1) {
                    column.calculation.splice(column.calculation.indexOf(calc), 1);
                }
            }
        }

        if (element.checked === true) {
            if (self.globalcalculateColumnSelectedvalue().indexOf(calc) === -1) {
                self.globalcalculateColumnSelectedvalue.push(calc);
            }
        } else {
            if (self.globalcalculateColumnSelectedvalue().indexOf(calc) !== -1) {
                self.globalcalculateColumnSelectedvalue.splice(self.globalcalculateColumnSelectedvalue().indexOf(calc), 1);
            }
        }

        columnLogic.updateListOfColumns(tempArray);
        return true;
    };

    self.setGlobalEditedColumnData = () => {
        var i,
            tempArray = self.listOfColumns(),
            column;

        for (i = 0; i < tempArray.length; i++) {
            column = tempArray[i];
            if (self.globalColumnMultiplier() != self.globalFieldsColumnEditBefore().multiplier) {
                if (column.canCalculate) {
                    column.multiplier = self.globalColumnMultiplier();
                }
            }

            if (self.globalColumnPrecision() != self.globalFieldsColumnEditBefore().precision) {
                if (column.canCalculate) {
                    column.precision = self.globalColumnPrecision();
                }
            }

            if (self.globalColumnIncludeInChart() != self.globalFieldsColumnEditBefore().includeInChart) {
                if (column.canBeCharted) {
                    column.includeInChart = self.globalColumnIncludeInChart();
                }
            }

            if (self.globalColumnYaxisGroup() != self.globalFieldsColumnEditBefore().yaxisGroup) {
                if (column.canBeCharted) {
                    column.yaxisGroup = self.globalColumnYaxisGroup();
                }
            }
        }

        if (self.globalColumnMultiplier() != self.globalFieldsColumnEditBefore().multiplier) {
            self.globalFieldsColumnEditBefore().multiplier = self.globalColumnMultiplier();
        }

        if (self.globalColumnPrecision() != self.globalFieldsColumnEditBefore().precision) {
            self.globalFieldsColumnEditBefore().precision = self.globalColumnPrecision();
        }

        if (self.globalColumnIncludeInChart() != self.globalFieldsColumnEditBefore().includeInChart) {
            self.globalFieldsColumnEditBefore().includeInChart = self.globalColumnIncludeInChart();
        }

        if (self.globalColumnYaxisGroup() != self.globalFieldsColumnEditBefore().yaxisGroup) {
            self.globalFieldsColumnEditBefore().yaxisGroup = self.globalColumnYaxisGroup();
        }

        columnLogic.updateListOfColumns(tempArray);
        $globalEditColumnModal.closeModal();
        return true;
    };

    self.clearFilterPoint = (indexOfColumn) => {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfColumn];

        filter.value = filterLogic.setDefaultFilterValue(filter.valueType);
        if (!!filter.AppIndex) {
            delete filter.AppIndex;
        }
        if (!!filter.softDeleted) {
            delete filter.softDeleted;
        }
        filter.upi = 0;
        filterLogic.updateListOfFilters(tempArray);
    };

    self.selectPropertyColumn = (element, indexOfColumn, selectedItem) => {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn],
            prop = ENUMSTEMPLATESENUMS.Properties[selectedItem.name];
        column.colName = selectedItem.name;
        column.colDisplayName = selectedItem.name;
        column.dataColumnName = column.colName;
        column.valueType = prop.valueType;
        if (!!column.AppIndex) {
            delete column.AppIndex;
        }
        column.searchable = (nonSearchableColumnTypes.indexOf(column.valueType) === -1);
        column.calculation = [];
        column.canCalculate = reportCalc.columnCalculable(column);
        column.canBeCharted = reportCalc.columnChartable(column);
        column.yaxisGroup = "A";
        column.includeInChart = false;
        columnLogic.updateListOfColumns(tempArray);
        return true;
    };

    self.selectPropertyFilter = (element, indexOfFilter, selectedItem) => {
        self.activePropertyFilterRequest({index: indexOfFilter, status: true});
        filterLogic.initializeNewFilter(selectedItem, indexOfFilter);
    };

    self.selectTotalizerOperator = (element, indexOfColumn, selectedItem) => {
        // console.log(indexOfColumn + "   element.val = " + $(element).val() + "   operator = " + self.listOfColumns()[indexOfColumn].operator);
        // if (self.listOfColumns()[indexOfColumn].operator === "Starts" && self.listOfColumns()[indexOfColumn].precision !== 0) {
        //     self.listOfColumns()[indexOfColumn].precision = 0;
        //     $(element).closest('tr').find(".precision input").val("0");
        // }
        return true;
    };

    self.selectYaxisGroup = (element, indexOfColumn, selectedItem) => {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.yaxisGroup = selectedItem;
        columnLogic.updateListOfColumns(tempArray);
    };

    self.selectCalculation = (element, indexOfColumn, selectedItem) => {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.calculation = selectedItem;
        columnLogic.updateListOfColumns(tempArray);
        return true;
    };

    self.selectNumberOfEntries = (element, selectedItem) => {
        for (var i = 0; i < self.listOfEntriesPerPage().length; i++) {
            if (self.listOfEntriesPerPage()[i].value === selectedItem) {
                self.selectedPageLength(self.listOfEntriesPerPage()[i].unit);
                self.designChanged(true);
                self.unSavedDesignChange(true);
                break;
            }
        }
    };

    self.selectSelectReportType = (element, selectedItem) => {
        for (var i = 0; i < self.listOfReportTypes().length; i++) {
            if (self.listOfReportTypes()[i].text === selectedItem.text) {
                self.reportType(selectedItem.text);
                self.reportTypeEnum(selectedItem.enum);
                self.designChanged(true);
                self.unSavedDesignChange(true);
                reportUtil.initNewReport();
                break;
            }
        }
    };

    self.selectChartType = (element, selectedItem, drawChart) => {
        for (var i = 0; i < self.listOfChartTypes().length; i++) {
            if (self.listOfChartTypes()[i].value === selectedItem) {
                self.selectedChartType(self.listOfChartTypes()[i].text);
                self.designChanged(true);
                self.unSavedDesignChange(true);
                break;
            }
        }
        if (!!drawChart) {
            render.baseChart();
        }
    };

    self.includeInChartChanged = (element, indexOfColumn) => {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.includeInChart = element.checked;
        columnLogic.updateListOfColumns(tempArray);
        return true;
    };

    self.globalColumnIncludeInChartClick = () => {
        self.globalColumnIncludeInChart(!self.globalColumnIncludeInChart());  // toggle
        return true;
    };

    self.selectInterval = (selectedInterval) => {
        self.intervalPeriod(selectedInterval);
    };

    self.setFilterConfig = (indexOfCondition, selectedItem, field) => {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfCondition];
        if (filter[field] != selectedItem.value) {
            filter[field] = selectedItem.value;
            filterLogic.updateListOfFilters(tempArray);
        }
    };

    self.handleBitStringChange = (element, indexOfFilter, checkboxIndex) => {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfFilter];
        reportCalc.calculateBitStringValue(filter);
        return true;
    };

    self.selectedFilterEValue = (indexOfValue, selectedItem) => {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfValue];
        if (filter.evalue != selectedItem.evalue) {
            filter.value = selectedItem.value;
            filter.evalue = selectedItem.evalue;
            filterLogic.updateListOfFilters(tempArray);
        }
    };

    self.propertySelectClick = (element) => {
        var $searchInputField = $(element).parent().find("input");
        window.setTimeout(function () { // Delay the focus for drop down transition to finish
            $searchInputField.focus();
        }, 50);
    };

    self.selectConfigReportTabSubTab = (subTabName) => {
        $tabConfiguration.find('ul.tabs').tabs('select_tab', subTabName);
    };

    self.selectViewReportTabSubTab = (subTabName) => {
        // $tabViewReport.find('ul.tabs').tabs('select_tab', subTabName);
        setTimeout(function () {
            $tabViewReport.find("ul.tabs").find("." + subTabName + " a").click();
        }, 100);
    };

    self.editColumn = (column, index) => {
        self.currentColumnEdit($.extend(true, {}, column));
        self.currentColumnEditIndex(index);
        $editColumnModal.openModal();
        setTimeout(function () {
            Materialize.updateTextFields();
        }, 200);
        return true;
    };

    self.setColumnFilter = () => {
        let regExVal = columnFilterValue !== "" ? "\\b" + columnFilterValue + "\\b" : "";
        self.listOfColumns()[self.currentColumnEditIndex()].searchFilter = columnFilterValue;
        $dataTablePlaceHolder.DataTable().column(self.currentColumnEditIndex()).search(regExVal, true, false).draw();
        $columnCardPanel.hide();
        return true;
    };

    self.clearSearchFilters = () => {
        for (let i = 0; i < self.listOfColumns().length; i++) {
            self.listOfColumns()[i].searchFilter = "";
        }
        $dataTablePlaceHolder.DataTable().columns()
            .search("")
            .draw();
    };

    self.globalEditColumnFields = () => {
        $globalEditColumnModal.openModal();
        setTimeout(function () {
            Materialize.updateTextFields();
        }, 200);
        return true;
    };

    self.showColumnSettings = (element, column) => {
        var $element = $(element),
            $card = $element.parent(),
            $cardReveal = $card.find(".card-reveal");

        mouseHoverStart = moment();
        setTimeout(function () {
            if (moment().diff(mouseHoverStart) > mouseHoverTimer) {
                self.currentColumnEdit(column);
                $cardReveal
                    .css("display", "block")
                    .css("transform", "translateY(-100%)")
                    .css("top", $card.height() + 280);

                $cardReveal.width(column.colName.length * 8);

                setTimeout(function () {
                    Materialize.updateTextFields();
                }, 200);
            }
        }, mouseHoverTimer + 10);

        return false;
    };

    self.hideColumnSettings = (element) => {
        var $element = $(element),
            $card = $element.parent(),
            $cardReveal = $card.find(".card-reveal");
        $cardReveal.css("display", "none").css("transform", "translateY(0px)");
        mouseHoverStart = moment();
        // self.currentColumnEdit({});
        return true;
    };

    self.okToSave = ko.pureComputed(() => {
        return (!self.activeSaveRequest() &&
            !self.activeUniquenessCheck() &&
            self.pathIsValid() &&
            self.display() !== '');
    });

    self.listOfIntervalsComputed = ko.computed(function () {
        var result = [],
            resetInterval = true,
            intervalDuration,
            sizeOfDataSet = 0,
            tooLargeSize = 100000,
            tempDuration = $.extend(true, {}, self.selectedDuration());

        if (!!tempDuration && tempDuration.endDate) {
            tempDuration.startDate = reportUtil.getAdjustedDatetimeMoment(tempDuration.startDate, self.durationStartTimeOffSet());
            tempDuration.endDate = reportUtil.getAdjustedDatetimeMoment(tempDuration.endDate, self.durationEndTimeOffSet());
            tempDuration.duration = tempDuration.endDate.diff(tempDuration.startDate);
            self.durationError(tempDuration.duration < 0);

            if (!self.durationError()) {
                result = self.listOfIntervals().filter(function (interval) {
                    intervalDuration = moment.duration(1, interval.text).asMilliseconds();
                    // sizeOfDataSet = (tempDuration.duration / intervalDuration) * (self.listOfColumns().length - 1);
                    return (intervalDuration <= tempDuration.duration && sizeOfDataSet < tooLargeSize);
                });

                if (result.length > 0) {
                    result.forEach(function (interval) {
                        if (self.intervalPeriod().toLowerCase() === interval.text.toLowerCase()) {
                            resetInterval = false;
                        }
                    });

                    intervalDuration = moment.duration(1, self.intervalPeriod()).asMilliseconds();
                    if (resetInterval) {
                        self.intervalPeriod(result[result.length - 1].text);
                        self.intervalValue(1);
                    } else {
                        if ((intervalDuration * self.intervalValue()) > tempDuration.duration) {
                            self.intervalValue(1);
                        }
                    }
                    sizeOfDataSet = (tempDuration.duration / intervalDuration) * (self.listOfColumns().length - 1);
                }

            } else {
                ui.displayError("Invalid Date Time selection");
            }
            self.selectedDuration(tempDuration);
        }

        timeOfUseDuration = reportUtil.getTimeOfUseDuration(self.intervalPeriod());
        if (!!$queryResultSize) {
            $queryResultSize.html("Result set size: " + reportUtil.toFixedComma(sizeOfDataSet, 0));
            $queryResultSize.parent().attr("title", reportUtil.toFixedComma(sizeOfDataSet, 0) + " individual points of data in result set.");
            if (sizeOfDataSet > tooLargeSize) { // we're calling a result set > 100000 "too large"
                $queryResultSize.addClass("toolarge");
            } else {
                $queryResultSize.removeClass("toolarge");
            }
        }

        return result;
    }, self);

    self.filterFilteredProps = ko.computed(function () {
        var answer,
            fFilter = self.filterPropertiesSearchFilter().toLowerCase();

        if (fFilter === "") {
            answer = filtersPropertyFields;
        } else {
            answer = filtersPropertyFields.filter(function (prop) {
                return prop.name.toLowerCase().indexOf(fFilter) > -1;
            });
        }
        return answer;
    }, self);

    self.columnFilteredProps = ko.computed(function () {
        var answer,
            cFilter = self.columnPropertiesSearchFilter().toLowerCase();

        if (cFilter === "") {
            answer = columnsPropertyFields;
        } else {
            answer = columnsPropertyFields.filter(function (colProp) {
                return colProp.name.toLowerCase().indexOf(cFilter) > -1;
            });
        }
        return answer;
    }, self);

    self.displayMainSpinner = ko.computed(function () {
        return ((self.activeDataRequest() || !self.activeRequestDataDrawn()) && !self.activeSaveRequest() && self.currentTab() === 2);
    }, self);

    self.displayTabCheckmark = ko.computed(function () {
        return (!self.reportResultViewed() && !self.activeDataRequest());
    }, self);

    self.pendingGlobalColumnChange = ko.computed(function () {
        var answer = false;

        if (self.globalColumnMultiplier() != self.globalFieldsColumnEditBefore().multiplier ||
            self.globalColumnPrecision() != self.globalFieldsColumnEditBefore().precision ||
            self.globalColumnIncludeInChart() != self.globalFieldsColumnEditBefore().includeInChart ||
            self.globalColumnYaxisGroup() != self.globalFieldsColumnEditBefore().yaxisGroup) {
            answer = true;
        }

        return answer;
    }, self);

    self.scheduler.init();

    self.makeId = dtiReporting.makeId;
    self.getLastId = dtiReporting.getLastId;
};

function applyBindings(extConfig) {
    if (window.top === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        window.setTimeout(function () {
            reportsVM = new reportsViewModel();
            reportsVM.init(extConfig);
            dtiCommon.knockout.init();
            ko.applyBindings(reportsVM);
        }, 150);
    }
}

$(function () {
    if (!window.location.href.match("pause")) {
        applyBindings();
    }
});
ko.bindingHandlers.prettyDate = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor(),
            timestamp = ko.unwrap(value),
            el = $(element);

        el.html(new Date(timestamp * 1000).toLocaleString());
    }
};

// ko.bindingHandlers.dragToSelect = {
//     init: function(element, valueAccessor, allBindingsAccessor) {
//         var $el = $(element);

//         $el.dragToSelect({
//             selectables: '.row',
//             percentCovered: 0,
//             onHide: function() {
//                 var $selectedEls = $el.children('.selected'),
//                     c,
//                     len = $selectedEls.length,
//                     data;

//                 for(c=0; c<len; c++) {
//                     data = ko.dataFor($selectedEls[c]);
//                     data.isSelected(true);
//                 }
//             }
//         });
//     }
// };

ko.bindingHandlers.datepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().datepickerOptions || {},
            $el = $(element),
            $clear,
            clearId = $el.data('clear-id');

        $el.datepicker(options);

        $el.on('change', function() {
            var observable = valueAccessor();
            observable($el.datepicker("getDate"));
        });

        if (clearId) {
            $clear = $('#' + clearId);
            $clear.on('click', function(e) {
                var observable = valueAccessor();

                e.preventDefault();
                $el.val('').trigger('change');
                // observable(undefined);
            });
        }

        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function() {
            var observable = valueAccessor();
            observable($el.datepicker("getDate"));
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $el.datepicker("destroy");
        });
    }
};

ko.bindingHandlers.timepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        //initialize timepicker with some optional options
        var handleTimeSelect = function(val, event) {
                var hours = event.hours,
                    minutes = event.minutes,
                    observable = valueAccessor();

                observable(hours * 60 * 60 + minutes * 60);
            },
            options = allBindingsAccessor().timepickerOptions || {
                showNowButton: true,
                showDeselectButton: true,
                showCloseButton: true,
                showPeriod: true,
                showLeadingZero: true,
                onSelect: handleTimeSelect,
                defaultTime: 0
            },
            $el = $(element),
            $clear,
            clearId = $el.data('clear-id');

        $el.timepicker(options);

        if (clearId) {
            $clear = $('#' + clearId);
            $clear.on('click', function(e) {
                var observable = valueAccessor();

                e.preventDefault();
                $el.val('').trigger('change');
                // observable(undefined);
            });
        }

        valueAccessor()(options.defaultTime);

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $el.timepicker("destroy");
        });
    }
};

ko.bindingHandlers.pagedforeach = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var self = {},
            pagerIndex,
            pagerRef,
            prevLength,
            defaults = {
                pageSize: 15
            },
            $el = $(element),
            $parent = $el.parent(),
            options = $.extend({}, defaults, allBindingsAccessor().pagingOptions || {}),
            listObservable = valueAccessor(),
            // list = value(),
            totalCount = ko.computed(function() {
                var currLength = listObservable().length;

                if (prevLength !== currLength && viewModel.resetPager === true) {
                    if (self.pager) {
                        self.pager().CurrentPage(1);
                    }
                }

                prevLength = currLength;
                return prevLength;
            }),
            pagerMarkup = ['<!-- ko ifnot:PAGER().TotalItemCount() > 0 -->',
                '    <p>',
                '        No results found',
                '    </p>',
                '    <!-- /ko -->',
                '    <!-- ko if:PAGER().TotalItemCount() > 0 -->',
                '   <div data-bind="template:{ name: \'tpl-pager\', data: PAGER }"></div>',
                '    <!-- /ko -->'
            ].join('');

        bindingContext._foreachPagers = bindingContext._foreachPagers || [];

        pagerIndex = bindingContext._foreachPagers.length;

        $parent.append(pagerMarkup.replace(/PAGER/g, '_foreachPagers[' + pagerIndex + '].pager'));

        self.currentPage = ko.observable(1);

        self.pager = ko.pager({
            totalItemCount: totalCount,
            pageSize: options.pageSize
        });

        self.pagedList = ko.computed(function() {
            var pager = self.pager(),
                currentPage = pager.CurrentPage(),
                start = pager.FirstItemIndex() - 1,
                end = start + pager.PageSize(),
                pagedList = listObservable().slice(start, end);

            return pagedList;
        });

        self.pager().CurrentPage.subscribe(function(page) {
            self.currentPage(page);
        });

        ko.bindingHandlers.foreach.init(element, self.pagedList, allBindingsAccessor, viewModel, bindingContext);

        ko.computed(function() {
            ko.bindingHandlers.foreach.update(element, self.pagedList, allBindingsAccessor, viewModel, bindingContext);
        }, self);

        bindingContext._foreachPagers.push(self);
    }
};

//add a handler on a parent element that reponds to events from the children
ko.bindingHandlers.delegatedChange = {
    init: function(element, valueAccessor) {
        var handler = ko.utils.unwrapObservable(valueAccessor()),
            events = 'change input';

        $(element).on(events, 'input', function() {
            handler();
        });
    }
};

ko.computed.fn.efficientlySubscribe = function(callback) {
    // NOTE: "this" is the ko.computed

    // make that subscription update a new observable
    var intermediaryObservable = ko.observable(this());

    // make an intermediary subscription to this and use it to set the value of an intermediary observable
    this.subscribe(function(value) {
        intermediaryObservable(value);
    });

    // take the callback the user gives you and call it via a new subscription to your new observable
    intermediaryObservable.subscribe(callback);
};

var AlarmManager = function(conf) {
    var self = this,
        socket = io.connect('http://' + window.location.hostname + ':8085'),

        $alarmModal = $('#alarmDetails'),
        $loadingProgress = $('#alarmsLoading'),

        printFunction,
        DEFAULTFILTER = 'Recent',
        currSort = 'msgTime',
        sortField = 'msgTime',
        cancelSelect = false,
        isReconnecting = false,
        sortDir = 1,
        pageSize = 15,
        serverPage = 1,
        serverPageSize = 10 * pageSize,
        filterChangeDelay = 500,
        doubleClickTimeout = 200,
        acknowledgeIDList = [],
        lastFilterChange = new Date().getTime(),
        lastFilterApply = lastFilterChange,
        userName = window.opener && window.opener.workspaceManager && window.opener.workspaceManager.user().username,
        openWindow = window.opener && window.opener.workspaceManager && window.opener.workspaceManager.openWindow,

        dirs = {
            msgTime: 1
        },
        filterIndices = {},
        alarmRowClasses = {
            0: 'success',
            1: 'danger',
            2: 'warning',
            3: 'info'
        },
        optionClasses = {
            'Emergency': 'danger',
            'Critical': 'warning',
            'Urgent': 'info',
            'Default': 'success'
        },
        configOptions = {
            Emergency: {
                text: 'Emergency',
                shortText: 'Emer',
                almClass: 2,
                test: function(row) {
                    return row.almClass === 2;
                }
            },
            Critical: {
                text: 'Critical',
                shortText: 'Crit',
                almClass: 1,
                test: function(row) {
                    return row.almClass === 1;
                }
            },
            Urgent: {
                text: 'Urgent',
                shortText: 'Urg',
                almClass: 3,
                test: function(row) {
                    return row.almClass === 3;
                }
            },
            Default: {
                text: 'Default',
                shortText: 'Def',
                almClass: 0,
                test: function(row) {
                    return row.almClass === 0;
                }
            },
            Events: {
                text: 'Events',
                shortText: 'Evts',
                msgCat: 0,
                test: function(row) {
                    return row.msgCat === 0;
                },
                type: 'category'
            },
            Alarms: {
                text: 'Alarms',
                shortText: 'Alms',
                msgCat: 1,
                test: function(row) {
                    return row.msgCat === 1;
                },
                type: 'category'
            },
            Return: {
                text: 'Return',
                shortText: 'Ret',
                msgCat: 2,
                test: function(row) {
                    return row.msgCat === 2;
                },
                type: 'category'
            },
            Maintenance: {
                text: 'Maintenance',
                shortText: 'Maint',
                msgCat: 3,
                test: function(row) {
                    return row.msgCat === 3;
                },
                type: 'category'
            },
            Acknowledge: {
                text: 'Requires Acknowledgement',
                shortText: 'Ack',
                test: function(row) {
                    return row.ackStatus !== 1;
                },
                type: 'hidden'
                // },
                // Blah: {
                //     text: 'Include Blah',
                //     shortText: 'Blah',
                //     test: function(row) {
                //         return true;
                //     },
                //     type: 'check'
            }
        },

        _log = function() {
            console.log.apply(console, arguments);
        },
        filterByNames = function(data) {
            var c,
                len = data.length,
                nameFilter = self.nameFilter(),
                item,
                name,
                ret = [],
                makeName = function(item) {
                    return [item.Name1, item.Name2, item.Name3, item.Name4].join('-');
                };

            for (c = 0; c < len; c++) {
                item = data[c];
                name = makeName(item);

                if (nameFilter.exec(name)) {
                    ret.push(item);
                }
            }

            return ret;
        },
        alarmSortFn = function(a, b) {
            var aa = a[sortField],
                bb = b[sortField],
                aaa = a._id,
                bbb = b._id;

            aa = parseInt(aa, 10);
            bb = parseInt(bb, 10);

            if (aa > bb) {
                return sortDir;
            }

            if (aa < bb) {
                return -1 * sortDir;
            }

            if (aaa > bbb) {
                return sortDir;
            }

            if (aaa < bbb) {
                return -1 * sortDir;
            }

            return 0;
        },

        getRecentAlarms = function() {
            console.log('getting recent alarms');
            socket.emit('getRecentAlarms', self.recentAlarmsConfig());
        },
        getActiveAlarms = function() {
            console.log('getting active alarms');
            socket.emit('getActiveAlarms', {
                currentPage: 1,
                itemsPerPage: 9999
            });
            socket.emit('getUnacknowledged', {
                currentPage: 1,
                itemsPerPage: 9999
            });
        },
        sendAcknowledge = function(idlist) {
            socket.emit('sendAcknowledge', {
                ids: idlist,
                username: userName
            });
        },
        registerPrintFunction = function(fn) {
            printFunction = fn;
        },
        processPrintList = function(list) {
            self.isPrinting(false);
            printFunction(list);
        },
        getCurrentList = function(callback, noFetch) {
            var currFilter = self.recentAlarmsConfig();
            if (self.currentFilter() === 'Recent') {
                if (!noFetch) {
                    self.isPrinting(true);
                    registerPrintFunction(callback);
                    currFilter.itemsPerPage = 99999;
                    socket.emit('getRecentAlarms', currFilter);
                } else {
                    callback(self.recentList);
                }
            } else {
                callback(self.currentList());
            }
        },


        Config = function(key, obj) {
            var active,
                testFn = obj.test,
                defaultValue,
                observable;

            if (obj.default === undefined) {
                defaultValue = true;
            } else {
                defaultValue = obj.default;
            }

            active = ko.observable(true);

            return {
                shortText: obj.shortText,
                text: obj.text,
                type: obj.type,
                buildOption: function(almClasses, msgCats) {
                    if (active()) {
                        if (obj.almClass !== undefined) {
                            almClasses.push(obj.almClass);
                        } else if (obj.msgCat !== undefined) {
                            msgCats.push(obj.msgCat);
                        }
                    }
                },
                setToDefault: function(invert) {
                    var nowActive = invert ? !defaultValue : defaultValue;
                    active(nowActive);
                },
                isActive: function() {
                    return active();
                },
                toggle: function() {
                    active(!active());
                },
                test: function(row) {
                    if (active()) {
                        return true;
                    }
                    return !testFn(row);
                }
            };
        },
        buildOptions = function() {
            var opt,
                cats = [],
                classes = [];


            for (opt in self.configOptions) {
                if (self.configOptions.hasOwnProperty(opt)) {
                    self.configOptions[opt].buildOption(classes, cats);
                }
            }

            self.almClasses(classes);
            self.msgCats(cats);
        },
        processAlarms = function(data) {
            var alarms = data.alarms,
                c, len = alarms.length;

            for (c = 0; c < len; c++) {
                alarms[c].isSelected = ko.observable(false);
                alarms[c].idx = c + 1;
            }
        },
        initConfigs = function() {
            var opt,
                key,
                c,
                option;

            self.configOptions = {};

            for (key in configOptions) {
                if (configOptions.hasOwnProperty(key)) {
                    opt = configOptions[key];
                    self.configOptions[opt.text] = option = new Config(key, opt);
                    if (opt.type !== 'hidden') {
                        self[(opt.type || 'class') + 'Options'].push(option);
                    }
                }
            }

            for (c = 0; c < self.defaultFilters.length; c++) {
                filterIndices[self.defaultFilters[c].title] = c;
            }

            buildOptions();
        };

    self.listName = ko.observable('');
    self.unacknowledgedList = ko.observableArray([]);
    self.activeList = ko.observableArray([]);
    self.currentList = ko.observableArray([]);
    self.filteredList = ko.observableArray([]);
    self.recentList = ko.observableArray([]);
    self.selectedRows = ko.observableArray([]);
    self.lastSelected = ko.observable();
    self.msgCats = ko.observableArray([]);
    self.almClasses = ko.observableArray([]);
    self.totalRecentAlarms = ko.observable();
    self.currentPage = ko.observable(1);
    self.currentFilter = ko.observable(DEFAULTFILTER);
    self.gettingData = ko.observable(false);
    self.isPrinting = ko.observable(false);
    self.alarmDetails = ko.observable('');
    self.dateFrom = ko.observable();
    self.dateTo = ko.observable();
    self.timeFrom = ko.observable();
    self.timeTo = ko.observable();
    self.dateRangeError = ko.observable('');
    self.name1 = ko.observable('');
    self.name2 = ko.observable('');
    self.name3 = ko.observable('');
    self.name4 = ko.observable('');

    self.classOptions = [];
    self.categoryOptions = [];
    self.checkOptions = [];

    self.resetPager = true;

    self.defaultFilters = [{
        title: 'Recent',
        activeOptions: [],
        // nameFilter: ['46'],
        reloadFunction: getRecentAlarms
    }, {
        title: 'Active',
        listName: 'activeList',
        activeOptions: []
    }, {
        title: 'Emergency',
        listName: 'activeList',
        subType: true,
        activeOptions: ['Emergency']
    }, {
        title: 'Urgent',
        listName: 'activeList',
        subType: true,
        activeOptions: ['Urgent']
    }, {
        title: 'Critical',
        listName: 'activeList',
        subType: true,
        activeOptions: ['Critical']
    }, {
        title: 'Default',
        listName: 'activeList',
        subType: true,
        activeOptions: ['Default']
    }, {
        title: 'Unacknowledged',
        listName: 'unacknowledgedList',
        activeOptions: ['Requires Acknowledgement']
    }];

    self.customConfigs = [{
        title: 'My Custom View',
        activeOptions: ['Emergency', 'Critical']
    }];

    //websocket handlers----------------------------------
    socket.on('sendAlarms', function(alarm) {
        self.currentList.push(alarm.alarm);
    });

    socket.on('acknowledgeResponse', function(response) {
        var selectedRows = self.selectedRows(),
            fullList,
            len = selectedRows.length,
            setAcknowleged = function(list) {
                var c,
                    cc,
                    row,
                    innerRow,
                    done = false,
                    keepGoing = true;
                // isEquivalent = function(a, b) {
                //     var keepGoing = true,
                //         ccc,
                //         field,
                //         fields = ['msgText', 'msgCat', 'msgTime', 'Name1', 'Name2', 'Name3', 'Name4'];

                //     for(ccc=0; ccc<fields.length && keepGoing; ccc++) {
                //         field = fields[ccc];
                //         if(a[field] !== b[field]) {
                //             keepGoing = false;
                //         }
                //     }

                //     return keepGoing;
                // };

                fullList = list();

                for (c = 0; c < len; c++) {
                    done = false;
                    row = selectedRows[c];
                    for (cc = 0; cc < fullList.length && !done; cc++) {
                        innerRow = fullList[cc];
                        if (fullList[cc]._id === selectedRows[c]._id) {
                            fullList[cc].ackStatus = 2;
                            fullList[cc].isSelected(false);
                            done = true;
                        }
                    }
                    // if(idx >= 0) {
                    //     fullList[idx].ackStatus = 2;
                    //     fullList[idx].isSelected(false);
                    // }
                }
            };

        self.resetPager = false;

        setAcknowleged(self.currentList);
        setAcknowleged(self.recentList);

        self.selectedRows([]);
        // self.filter();
        self.resetPager = true;

        self.applyFilter(self.currentFilter());
    });

    socket.on('unacknowledged', function(data) {
        processAlarms(data);
        self.unacknowledgedList(data.alarms);
    });

    socket.on('activeAlarms', function(data) {
        // console.log('got active alarms', data.alarms.length, new Date());
        processAlarms(data);
        self.activeList(data.alarms);
    });

    socket.on('recentAlarms', function(recent) {
        var currCount = self.totalRecentAlarms();

        console.log('got recent alarms', recent.alarms.length, new Date());

        processAlarms(recent);
        self.gettingData(false);

        if (self.isPrinting()) {
            processPrintList(recent.alarms);
        } else {
            self.recentList(recent.alarms);
            self.totalRecentAlarms(recent.count);

            if (currCount !== self.totalRecentAlarms()) {
                self.Pager().CurrentPage(1);
            }
        }
    });

    socket.on('connect', function() {});

    socket.on('reconnecting', function() {
        var retries = 0,
            reconnect = function() {
                $.ajax({
                    url: '/home'
                }).done(function(data) {
                    isReconnecting = false;
                    _log('reconnected', new Date());
                }).fail(function(data) {
                    retries++;
                    if (retries < 2) {
                        _log('retrying reconnect');
                        reconnect();
                    } else {
                        isReconnecting = false;
                    }
                });
            };
        if (!isReconnecting) {
            isReconnecting = true;
            _log('reconnecting', new Date());
            reconnect();
        }
    });

    //sorting handlers----------------------------------
    self.sortAlarms = function(field, list) {
        var dir = dirs[field] || 1;

        sortField = field;

        sortDir = dir;

        list.sort(alarmSortFn);

        dirs[field] = -dir;

        currSort = field;
    };

    self.sortRecentAlarmsByTime = function() {
        self.sortAlarms('msgTime', self.recentList);
    };

    self.sortAlarmsByTime = function() {
        self.sortAlarms('msgTime', self.currentList);
    };

    //paginator setup---------------------------
    self.Pager = ko.pager({
        totalItemCount: self.totalRecentAlarms,
        pageSize: pageSize
    });

    self.Pager().CurrentPage.subscribe(function(page) {
        self.currentPage(page);
    });

    //computeds-----------------------------------------
    self.currentServerPage = ko.computed(function() {
        var clientPage = self.currentPage(),
            currPage = parseInt(((clientPage * pageSize) - 1) / serverPageSize, 10) + 1;

        return currPage;
    });

    self.currentServerPage.efficientlySubscribe(function(value) {
        self.gettingData(true);
        setTimeout(function() {
            getRecentAlarms();
        }, 1);
    });

    self.recentListPaged = ko.computed(function() {
        var list = self.recentList(),
            currentPage = self.currentPage(),
            pager = self.Pager.peek(),
            start = (pager.FirstItemIndex.peek() % serverPageSize) - 1,
            end = start + pageSize;

        if (self.gettingData.peek() === false) {
            return self.recentList().slice(start, end);
        } else {
            return self.recentListPaged();
        }
    });

    self.dateTimeFrom = ko.computed(function() {
        var fromSeconds = self.timeFrom() || 0,
            fromDays = self.dateFrom() || 0,
            totalSeconds;

        if (fromDays) {
            fromDays = fromDays.getTime();
            totalSeconds = fromSeconds * 1000 + fromDays;
            return Math.round(totalSeconds / 1000);
        }

        return 0;
    });

    self.dateTimeTo = ko.computed(function() {
        var toSeconds = self.timeTo() || false,
            toDays = self.dateTo() || false,
            totalSeconds;

        if (toDays && toSeconds) {
            toDays = toDays.getTime();
            totalSeconds = toSeconds * 1000 + toDays;
            return Math.round(totalSeconds / 1000);
        }

        return 0;
    });

    self.recentAlarmsConfig = ko.computed(function() {
        var name1 = self.name1(),
            name2 = self.name2(),
            name3 = self.name3(),
            name4 = self.name4(),
            startDate = self.dateTimeFrom(),
            endDate = self.dateTimeTo(),
            msgCat = self.msgCats(),
            almClass = self.almClasses(),
            currentPage = self.currentServerPage();

        return {
            name1: name1,
            name2: name2,
            name3: name3,
            name4: name4,
            startDate: startDate,
            endDate: endDate,
            msgCat: msgCat,
            almClass: almClass,
            currentPage: currentPage,
            itemsPerPage: serverPageSize
        };
    });

    self.nameFilter = ko.computed(function() {
        var name1 = self.name1(),
            name2 = self.name2(),
            name3 = self.name3(),
            name4 = self.name4(),
            dash = '[^-]*';

        return new RegExp('\\b' + name1 + dash + '-' + name2 + dash + '-' + name3 + dash + '-' + name4 + dash, 'i');
    });

    self.filter = ko.computed(function() {
        var list = self.currentList(),
            currentFilter = self.currentFilter(),
            key,
            opt,
            c,
            row,
            len,
            filteredList = [],
            ackList = [],
            tests = [],
            valid = false,
            runTests = function(row) {
                var numTests = tests.length,
                    cc,
                    result = true;

                for (cc = 0; cc < numTests && result; cc++) {
                    if (tests[cc](row) === false) {
                        result = false;
                    }
                }

                return result;
            };

        list = filterByNames(list);

        len = list.length;

        for (key in self.configOptions) {
            if (self.configOptions.hasOwnProperty(key)) {
                opt = self.configOptions[key];
                if (!opt.isActive()) {
                    tests.push(opt.test);
                }
            }
        }

        for (c = 0; c < len; c++) {
            row = list[c];
            valid = runTests(row);
            if (valid) {
                // if(row.ackStatus !== 'None Required') {
                //     ackList.push(row);
                // } else{
                filteredList.push(row);
                // }
            }
        }

        self.filteredList(filteredList);
    });

    //filtering functions---------------------------------------------
    self.applyFilter = function(obj, event) {
        var options = self.configOptions,
            key,
            invert = true,
            activeOptions,
            c,
            names,
            reloadFunction,
            isActiveOption,
            defaultInvert,
            newListName = obj.listName,
            currListName = self.listName(),
            selectedRows = self.selectedRows(),
            opt;

        for (c = 0; c < selectedRows.length; c++) {
            selectedRows[c].isSelected(false);
        }
        self.selectedRows([]);

        if (typeof obj === 'string') {
            obj = self.defaultFilters[filterIndices[obj]];
        }

        activeOptions = obj.activeOptions || [];

        for (key in options) {
            if (options.hasOwnProperty(key)) {
                invert = defaultInvert || false;
                invert = (obj.subType && options[key].type === undefined) || invert;

                isActiveOption = activeOptions.indexOf(key) > -1;

                if (options.hasOwnProperty(key)) {
                    if (isActiveOption) {
                        invert = !invert;
                    }
                    options[key].setToDefault(invert);
                }
            }
        }

        if (obj.nameFilter && obj.nameFilter.length > 0) {
            names = obj.nameFilter;
            for (c = 0; c < names.length; c++) {
                self['name' + (c + 1)](names[c]);
            }
        }

        if (obj.reloadFunction) {
            obj.reloadFunction();
        }

        if (newListName && (currListName !== newListName)) {
            self.currentList(self[newListName]());
            self.listName(newListName);
        }

        self.currentFilter(obj.title);
    };

    self.isCurrentFilter = function(item) {
        return item.title === self.currentFilter();
    };

    //display css functions---------------------------------------
    self.toHexColor = function(color) {
        // var ret = ('00000' + parseInt(color, 10).toString(16)).slice(-6);

        // console.log(color, ret);

        return '#' + color;
    };

    self.getOptionCss = function(item) {
        var ret = !item.isActive() ? 'disabledOption' : '',
            cls = 'alert-' + optionClasses[item.text] || '';

        return ret + ' ' + cls;
    };

    //misc interactivity functions--------------------------------
    self.clearValue = function(data, event) {
        var $el = $(event.currentTarget),
            idToClear = $el.data('remove-el'),
            $elToClear = $('#' + idToClear);

        $elToClear.val('').trigger('change');
    };

    self.showDetails = function(alarm, event) {
        self.alarmDetails(alarm.msgText);
        $alarmModal.modal('show');
    };

    self.toggleOption = function(data, event) {
        var option = self.configOptions[data.text];
        option.toggle();
        self.doFilter();
        return true;
    };

    self.doFilter = function() {
        var filterChange,
            opt,
            checkFilterGap = function() {
                var now = new Date().getTime();

                if (now - filterChange >= filterChangeDelay && filterChange === lastFilterChange) {
                    lastFilterApply = now;
                    buildOptions();
                    getRecentAlarms();
                }
            };

        filterChange = lastFilterChange = new Date().getTime();

        if (self.currentFilter() === 'Recent') {
            setTimeout(checkFilterGap, filterChangeDelay);
        } else {
            checkFilterGap();
        }
    };

    self.acknowledgeAlarm = function(data, event) {
        _log('acknowledging one', data.msgText);
        acknowledgeIDList = [data._id];
        sendAcknowledge(acknowledgeIDList);
    };

    self.acknowledgeAlarms = function() {
        var c,
            row,
            selectedRows = self.selectedRows(),
            list = self.currentList(),
            len = selectedRows.length;

        acknowledgeIDList = [];

        for (c = 0; c < len; c++) {
            row = selectedRows[c];
            acknowledgeIDList.push(row._id);
        }

        sendAcknowledge(acknowledgeIDList);
    };

    self.selectRow = function(data, event) {
        var selected = data.isSelected(),
            needsAcknowledge = data.ackStatus === 1,
            $row = $(event.currentTarget),
            selectedRows = self.selectedRows(),
            lastRow = selectedRows.slice(-1)[0],
            currentList = self.filteredList(),
            prevIdx,
            currIdx,
            start,
            end,
            row,
            c;

        if (!cancelSelect && needsAcknowledge) {
            setTimeout(function() {
                if (!cancelSelect) {
                    if (!event.shiftKey) {
                        if (selected) {
                            self.selectedRows.remove(data);
                        } else {
                            self.selectedRows.push(data);
                        }
                        self.lastSelected(!selected);
                        data.isSelected(!selected);
                    } else {
                        prevIdx = currentList.indexOf(lastRow);
                        currIdx = currentList.indexOf(data);
                        if (selectedRows.length > 0 && self.lastSelected() && prevIdx !== currIdx) {
                            if (prevIdx < currIdx) {
                                start = prevIdx;
                                end = currIdx;
                            } else {
                                start = currIdx;
                                end = prevIdx;
                            }
                            for (c = start; c <= end; c++) {
                                row = currentList[c];
                                if (row.ackStatus === 1) {
                                    row.isSelected(true);
                                    self.selectedRows.push(row);
                                }
                            }
                            self.lastSelected(true);
                        }

                    }
                }
            }, doubleClickTimeout);
        }
    };

    self.showPointReview = function(item, ev) {
        var options,
            success;

        cancelSelect = true;

        success = function(data) {
            var pointType = data.point['Point Type'] || 'display_sup';
            if (pointType && openWindow) {
                openWindow(data.url, data.point.Name, pointType, item.upi, 482, 600);
            }

            setTimeout(function() {
                cancelSelect = false;
            }, doubleClickTimeout);
        };

        options = {
            url: '/pointreview/',
            data: {
                id: item.upi
            },
            type: 'post',
            dataType: 'json'
        };

        $.ajax(options).done(success);
    };

    self.print = function() {
        var printWin = window.open('/alarms/print', 'alarmPrint', 'menubar=no');
        printWin.addEventListener('load', function() {
            getCurrentList(function(list) {
                printWin.applyList(list);
            });
        }, true);
    };

    //inits---------------------------------------------------
    $alarmModal.modal({
        show: false,
        keyboard: true
    });

    $loadingProgress.modal({
        show: false,
        keybaord: false
    });

    $(window).on('hashchange', function() {
        var filterName = location.hash.substring(1);
        self.currentFilter(filterName || DEFAULTFILTER);
    });

    initConfigs();

    getActiveAlarms();

    self.applyFilter(self.defaultFilters[0]);
};

$(function() {
    //temporary window scope
    window.manager = new AlarmManager({});

    ko.applyBindings(window.manager);
});
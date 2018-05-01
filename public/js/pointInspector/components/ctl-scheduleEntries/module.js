/*jslint white: true */

/*********************************** NOTES **********************************
    Application Overview
    --------------------
    A)  This module is to view all schedule entries associated with either a Schedule (_parentUpi on entry not 0) or appropriate I/O points (_parentUpi is 0).
    B)  A lot of work was done to bypass the way existing components for other point inspectors were designed to work on the Entry's row. Origionally all
        components used were using the main point from the point inspector's properties. A few components were modified to allow params passed in to be
        more modular, eg. point, showlabel and custom classes.
    C)  Each row in the table is a 'point inspector' for a Schedule Entry. There are two tables, one for the fixed control point name and the rest for a
        scrollable properties list. All properties are edited inline.
    D)  Canceling an edit goes back and re-retrieves associated entries and reinitializes them properly.

    Room For Improvements
    ---------------------
    1)  Times taken to enter and leave edit, along with loading inital entries can take time (looks like there could be recursive looping).
    2)  Needs tooltips or other identification for currently unlabeled check boxes. Table headers aren't fixed
    3)  On hover for rows doesn't persist between the two tables
*****************************************************************************/


define(['knockout', 'text!./view.html', 'lodash'], function (ko, view, _) {
    var apiEndpoint = '',
        ASC = 1,
        DESC = -1,
        maxTime = 86340,
        $searchInput,
        $clearSearchIcon,
        $saveBtn,
        socket,
        buildMonthStr,
        buildDateArray,
        config,
        enumToArray,
        valueSubscription;

    function ViewModel(params) {
        var self = this;
        window.se = this;
        this.id = params.id;
        this.point = params.point; // schedule point or I/O point
        this.root = params.rootContext;
        this.isInEditMode = this.root.isInEditMode;
        this.utility = this.root.utility;
        this.pointType = params.pointType; // schedule or I/O point type
        apiEndpoint = this.root.apiEndpoint;
        socket = this.root.socket;
        config = this.utility.config;
        enumToArray = this.utility.enumToArray;
        var saveBtn = null;
        buildMonthStr = function (monthNo, day, year) {
            var monthStr = '';

            switch (monthNo) {
                case 0:
                    monthStr = 'Any';
                    break;
                case 1:
                    monthStr = 'January';
                    break;
                case 2:
                    monthStr = 'Febuary';
                    break;
                case 3:
                    monthStr = 'March';
                    break;
                case 4:
                    monthStr = 'April';
                    break;
                case 5:
                    monthStr = 'May';
                    break;
                case 6:
                    monthStr = 'June';
                    break;
                case 7:
                    monthStr = 'July';
                    break;
                case 8:
                    monthStr = 'August';
                    break;
                case 9:
                    monthStr = 'September';
                    break;
                case 10:
                    monthStr = 'October';
                    break;
                case 11:
                    monthStr = 'November';
                    break;
                case 12:
                    monthStr = 'December';
                    break;
            }
            day = (day === 0) ? 'Any' : day;
            year = (year === 0) ? 'Any' : year;
            return monthStr + '/' + day + '/' + year;
        };
        buildDateArray = function (min, max) {
            var numbers = [];
            numbers.push({
                name: 'Any',
                value: 0
            });
            for (var i = min; i <= max; i++) {
                numbers.push({
                    name: i,
                    value: i
                });
            }
            return numbers;
        };
        this.searchTerm = ko.observable('');
        this.gettingData = ko.observable(true);
        this.newRow = ko.observable('  New Entry');
        this.networkError = ko.observable(false);
        self.entries = ko.observableArray([]);
        this.filteredEntries = ko.observableArray(this.entries());
        this.sortProperty = (this.pointType === 'Schedule') ? 'refPoint' : 'scheduleName';
        this.sortDirection = ASC;
        this.executeNow = (this.pointType === 'Schedule') ? ko.observable(this.point['Execute Now'].Value()) : ko.observable(false);
        this.hostSchedule = (this.pointType === 'Schedule') ? ko.observable(this.point['Host Schedule'].Value()) : ko.observable(false);
        this.enableAll = (this.pointType === 'Schedule') ? ko.observable(this.point['Enable Schedule'].Value()) : ko.observable(false);
        this.heating = ko.observable(false);
        this.cooling = ko.observable(false);
        this.origControls = {
            executeNow: this.executeNow(),
            hostSchedule: this.hostSchedule(),
            enableAll: this.enableAll(),
            heating: this.heating(),
            cooling: this.cooling()
        };
        this.lowestControlTime = ko.observable();
        this.months = ko.observableArray(buildDateArray(1, 12));
        this.days = ko.observableArray(buildDateArray(1, 31));
        this.years = ko.observableArray(buildDateArray(2014, 2050));
        this.Sunday = ko.observable('S');
        this.Monday = ko.observable('M');
        this.Tuesday = ko.observable('T');
        this.Wednesday = ko.observable('W');
        this.Thursday = ko.observable('T');
        this.Friday = ko.observable('F');
        this.Saturday = ko.observable('S');
        this.Holiday = ko.observable('H');
        this.SundayActive = ko.observable('');
        this.MondayActive = ko.observable('');
        this.TuesdayActive = ko.observable('');
        this.WednesdayActive = ko.observable('');
        this.ThursdayActive = ko.observable('');
        this.FridayActive = ko.observable('');
        this.SaturdayActive = ko.observable('');
        this.HolidayActive = ko.observable('');
        this.activeday = ko.observable('activeday');
        this.priorities = ko.observableArray(self.utility.workspace.systemEnums.controlpriorities);
        this.controllers = ko.observableArray(self.utility.workspace.systemEnums.controllers);
        self.oldPoints = [];
        self.updateScheds = [];
        self.hardScheds = [];
        /*this.isTabLoaded = params.isTabLoaded.subscribe(function(val) {
            this.render();
        }, this);*/
        this.render();
        this.isInEditMode.subscribe(function (inEdit) {
            if (!inEdit) {
                var newScheds = [];
                // delete any new schedules that were created from new entry or cloning in the db from the db
                for (var i = 0; i < self.entries().length; i++) {
                    if (self.entries()[i].point._pStatus() === 1) {
                        newScheds.push(ko.viewmodel.toModel(self.entries()[i].point));
                    }
                }
                socket.emit('updateSchedules', {
                    hardScheds: newScheds
                });
                self.render();
                self.executeNow(self.origControls.executeNow);
                self.hostSchedule(self.origControls.hostSchedule);
                self.enableAll(self.origControls.enableAll);
                self.heating(self.origControls.heating);
                self.cooling(self.origControls.cooling);
                self.emptyEntry['Control Time'].Value(0);
                self.emptyEntry['Days Active'].Value(0);
                self.emptyEntry['Begin Month'].Value(0);
                self.emptyEntry['Begin Day'].Value(0);
                self.emptyEntry['Begin Year'].Value(0);
                self.emptyEntry['End Month'].Value(0);
                self.emptyEntry['End Day'].Value(0);
                self.emptyEntry['End Year'].Value(0);
            } else {
                saveBtn = $('.actions .btn-success');
                self.updateSaveButton();
            }
        });
        this.root.point.status.subscribe(function (status) {
            var newScheds = [];
            if (status === 'saving') {
                for (var i = 0; i < self.entries().length; i++) {
                    if (self.entries()[i].isDeleted()) {
                        self.hardScheds.push(ko.viewmodel.toModel(self.entries()[i].point));
                    } else if (self.entries()[i].point._pStatus() === 1) {
                        newScheds.push(ko.viewmodel.toModel(self.entries()[i].point));
                    } else {
                        var temp = ko.viewmodel.toModel(self.entries()[i].point);
                        if (temp['Control Value'].ValueType !== 5) {
                            delete temp['Control Value'].eValue;
                        }
                        self.updateScheds.push(temp);
                    }
                }

                socket.emit('updateSchedules', {
                    oldPoints: self.oldPoints,
                    updateScheds: self.updateScheds,
                    newScheds: newScheds,
                    hardScheds: self.hardScheds,
                    schedule: ko.viewmodel.toModel(self.point)
                });
                socket.once('scheduleUpdated', function (data) {
                    self.render();
                });
            }
        });
        this.search = ko.computed(function () {
            var searchTerm = this.searchTerm().toLowerCase(), // Our only dependency
                filter = function (sourceArray) {
                    return ko.utils.arrayFilter(sourceArray, function (item) {
                        if (self.pointType !== 'Schedule' && item.scheduleName().toLowerCase().indexOf(searchTerm) !== -1) {
                            return true;
                        } else if (item.refPoint === null || checkTermInArray(item.refPoint.path, searchTerm)) {
                            return true;
                        }
                        return false;
                    });
                },
                checkTermInArray = function (testArray, searchTerm) {
                    var doesMatch = false;
                    testArray.forEach(function (elem) {
                        if (elem.match(searchTerm)) {
                            doesMatch = true;
                        }
                    });
                    return doesMatch;
                },
                oldEntries = this.filteredEntries(),
                newIds = [],
                oldIds = [],
                i;
            // Apply the filter, then sort the results, then finally stuff into our observable array
            this.filteredEntries(sortArray.call(filter(self.entries()), this.sortProperty, this.sortDirection));

            for (i = 0; i < this.filteredEntries().length; i++) {
                for (var j = 0; j < oldEntries.length; j++) {
                    if (oldEntries[j].point._id() === this.filteredEntries()[i].point._id()) {
                        break;
                    } else if (j === oldEntries.length - 1) {
                        self.scrollIntoView(this.filteredEntries()[i].point._id());
                    }
                }
            }
            // This computed fires before the DOM is initialized so we need to make sure our jQuery selector is defined
            if ($clearSearchIcon) {
                if (searchTerm.length) {
                    $clearSearchIcon.show();
                } else {
                    $clearSearchIcon.hide();
                }
            }
        }, this).extend({
            rateLimit: 200
        });

        this.enableBtn = ko.computed(function () {
            var inEdit = self.isInEditMode();
            return (inEdit) ? 'enabled' : 'disabled';
        });

        this.updateSaveButton = function () {
            if (saveBtn !== null) {
                saveBtn.attr('disabled', false);
                for (var i = 0; i < self.entries().length; i++) {
                    if (self.entries()[i].refPoint === null && !self.entries()[i].isDeleted()) {
                        saveBtn.attr('disabled', true);
                        break;
                    }
                }
            }
        };

        this.adjustInterval = function () {
            var i, ooRFlag = false,
                highestTime = 0;
            this.lowestControlTime(maxTime);

            for (i = 0; i < self.entries().length; i++) {
                if (self.entries()[i].point['Control Time'].Value() < this.lowestControlTime()) {
                    this.lowestControlTime(self.entries()[i].point['Control Time'].Value());
                }

                if (self.entries()[i].point['Control Time'].Value() > highestTime) {
                    highestTime = self.entries()[i].point['Control Time'].Value();
                }
            }
            for (i = 0; i < self.entries().length; i++) {
                if ((highestTime - this.lowestControlTime() + self.emptyEntry['Control Time'].Value()) > maxTime) {
                    ooRFlag = true;
                }
            }
            if (ooRFlag && !window.confirm('Base Time will max out at least one control time. Proceed?')) {
                // making sure user wants to max times
            } else {
                for (i = 0; i < self.entries().length; i++) {
                    var initTime = self.entries()[i].intervalAdjust();
                    self.entries()[i].intervalAdjust(self.emptyEntry['Control Time'].Value());

                    if (initTime === self.entries()[i].intervalAdjust()) {
                        self.entries()[i].intervalAdjust.valueHasMutated();
                    }
                }
            }
            return true;
        };
        this.applyDays = function (data) {
            var days = data.emptyEntry['Days Active'].Value();
            self.entries().forEach(function (entry) {
                entry.point['Days Active'].Value(days);
            });
            return true;
        };
        this.applyBegin = function (data) {
            var month = data.emptyEntry['Begin Month'].Value(),
                day = data.emptyEntry['Begin Day'].Value(),
                year = data.emptyEntry['Begin Year'].Value();

            self.entries().forEach(function (entry) {
                entry.point['Begin Month'].Value(month);
                entry.point['Begin Day'].Value(day);
                entry.point['Begin Year'].Value(year);
            });
            return true;
        };
        this.applyEnd = function (data) {
            var month = data.emptyEntry['End Month'].Value(),
                day = data.emptyEntry['End Day'].Value(),
                year = data.emptyEntry['End Year'].Value();

            self.entries().forEach(function (entry) {
                if (entry.point['Begin Month'].Value() !== 0) {
                    entry.point['End Month'].Value(month);
                }
                if (entry.point['Begin Day'].Value() !== 0) {
                    entry.point['End Day'].Value(day);
                }
                if (entry.point['Begin Year'].Value() !== 0) {
                    entry.point['End Year'].Value(year);
                }
            });
            return true;
        };
        this.addRow = function () {
            var self = this,
                template = {},
                params = {
                    name1: 'Schedule Entry',
                    pointType: 'Schedule Entry',
                    parentUpi: self.point._id()
                };
            $.ajax({
                url: '/api/points/initpoint',
                dataType: 'json',
                type: 'post',
                data: params
            }).done(function (data) {
                var oldPoint = _.cloneDeep(data);
                data['Enable Schedule'].Value = self.hostSchedule();
                data['Host Schedule'].Value = self.enableAll();
                data['Heating Season'].Value = self.heating();
                data['Cooling Season'].Value = self.cooling();
                data['Control Time'].Value = self.emptyEntry['Control Time'].Value();

                if (self.pointType !== 'Schedule') {
                    var propertyObject = config.Utility.getPropertyObject('Control Point', data),
                        refPoint = ko.viewmodel.toModel(self.point);

                    propertyObject.Value = refPoint._id;
                    data = config.EditChanges.applyUniquePIDLogic({
                        point: data,
                        refPoint: refPoint,
                        propertyObject: propertyObject
                    });

                    data._parentUpi = 0;
                }

                var newPoint = ko.viewmodel.fromModel(data);
                self.oldPoints.push(oldPoint);
                var item = self.buildObservable({
                    point: newPoint,
                    oldPoint: oldPoint
                });
                item.isNew(true);
                self.entries.push(item);
                /*self.filteredEntries(self.entries());
                self.searchTerm.valueHasMutated();*/
                self.updateSaveButton();
            });
        };


        this.cloneRow = function (data, e) {
            var newRow = {},
                upi = data.point._id(),
                params = {
                    targetUpi: upi,
                    name1: 'Schedule Entry',
                    pointType: 'Schedule Entry'
                },
                deepKOClone = function (obj, newObj) {
                    var keys = Object.keys(obj),
                        c,
                        len = keys.length,
                        prop,
                        key,
                        type,
                        handlers = {
                            'obj': function (o, key) {
                                if (Array.isArray(o)) {
                                    handlers.def(o, key);
                                } else {
                                    newObj[key] = {};
                                    deepKOClone(o, newObj[key]);
                                }
                            },
                            'fn': function (o, key) {
                                if (ko.isObservable(o) && !Array.isArray(o())) {
                                    newObj[key] = ko.observable(_.cloneDeep(o()));
                                } else if (ko.isObservable(o) && Array.isArray(o())) {
                                    newObj[key] = ko.observableArray();
                                    for (var i = 0; i < o().length; i++) {
                                        if (typeof o()[i] === 'object') {
                                            var tempObj = {};
                                            deepKOClone(o()[i], tempObj);
                                            newObj[key].push(tempObj);
                                        } else {
                                            newObj[key].push(_.cloneDeep(o()[i]));
                                        }
                                    }
                                } else {
                                    newObj[key] = o;
                                }
                            },
                            'def': function (o, key) {
                                newObj[key] = o;
                            }
                        };

                    if (!newObj) {
                        newObj = {};
                    }

                    for (c = 0; c < len; c++) {
                        key = keys[c];

                        prop = obj[key];
                        type = typeof prop;
                        switch (type) {
                            case 'object':
                                handlers.obj(prop, key);
                                break;
                            case 'function':
                                handlers.fn(prop, key);
                                break;
                            default:
                                handlers.def(prop, key);
                                break;
                        }
                        // handlers[typeof prop](prop, key);
                    }
                };
            //deepKOClone(data, newRow);
            $.ajax({
                    url: '/api/points/initpoint',
                    dataType: 'json',
                    type: 'post',
                    data: params
                })
                .done(function (response) {
                    var newPoint = _.cloneDeep(ko.viewmodel.toModel(data.point));
                    newPoint._id = response._id;
                    newPoint._pStatus = response._pStatus;
                    var item = self.buildObservable({
                        oldPoint: response,
                        point: ko.viewmodel.fromModel(newPoint)
                    }, data);
                    //cloneObject(itemModel, item);

                    item.isNew(true);

                    self.entries.push(item);
                    self.searchTerm.valueHasMutated();
                    self.oldPoints.push(response);
                    self.updateSaveButton();
                    // self.scrollIntoView(newPoint._id);
                });
        };

        self.scrollIntoView = function (id) {
            $('html, body').animate({
                scrollTop: $('#' + id).offset().top
            }, 2000);
        };

        self.toggleExecuteNow = function () {
            self.point['Execute Now'].Value(self.executeNow());
            return true;
        };

        self.allHost = function () {
            if (!!self.point['Host Schedule']) {
                self.point['Host Schedule'].Value(self.hostSchedule());
            }
            for (var i = 0; i < self.entries().length; i++) {
                self.entries()[i].point['Host Schedule'].Value(self.hostSchedule());
            }
            return true;
        };

        self.allEnable = function () {
            if (!!self.point['Enable Schedule']) {
                self.point['Enable Schedule'].Value(self.enableAll());
            }
            for (var i = 0; i < self.entries().length; i++) {
                self.entries()[i].point['Enable Schedule'].Value(self.enableAll());
            }
            return true;
        };

        self.allHeating = function () {
            for (var i = 0; i < self.entries().length; i++) {
                self.entries()[i].point['Heating Season'].Value(self.heating());
            }
            return true;
        };

        self.allCooling = function () {
            for (var i = 0; i < self.entries().length; i++) {
                self.entries()[i].point['Cooling Season'].Value(self.cooling());
            }
            return true;
        };

        self.properties = ko.observableArray([]);

        self.emptyEntry = {
            'Control Time': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 17,
                'Value': 0
            },
            'Days Active': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 18,
                'Value': 0
            },
            'Begin Day': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 4,
                'Value': 0
            },
            'Begin Month': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 4,
                'Value': 0
            },
            'Begin Year': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 4,
                'Value': 0
            },
            'End Day': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 4,
                'Value': 0
            },
            'End Month': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 4,
                'Value': 0
            },
            'End Year': {
                'isDisplayable': true,
                'isReadOnly': false,
                'ValueType': 4,
                'Value': 0
            }
        };
        self.emptyEntry = ko.viewmodel.fromModel(self.emptyEntry);

        self.emptyEntry['Days Active'].Value.subscribe(function (val) {
            for (var prop in config.Enums['Day of Week Flags']) {
                if ((config.Enums['Day of Week Flags'][prop].enum & val) !== 0) {
                    if (prop === 'Sunday') {
                        self.SundayActive('activeday');
                    } else if (prop === 'Monday') {
                        self.MondayActive('activeday');
                    } else if (prop === 'Tuesday') {
                        self.TuesdayActive('activeday');
                    } else if (prop === 'Wednesday') {
                        self.WednesdayActive('activeday');
                    } else if (prop === 'Thursday') {
                        self.ThursdayActive('activeday');
                    } else if (prop === 'Friday') {
                        self.FridayActive('activeday');
                    } else if (prop === 'Saturday') {
                        self.SaturdayActive('activeday');
                    } else if (prop === 'Holiday') {
                        self.HolidayActive('activeday');
                    }
                } else if (prop === 'Sunday') {
                    self.SundayActive('');
                } else if (prop === 'Monday') {
                    self.MondayActive('');
                } else if (prop === 'Tuesday') {
                    self.TuesdayActive('');
                } else if (prop === 'Wednesday') {
                    self.WednesdayActive('');
                } else if (prop === 'Thursday') {
                    self.ThursdayActive('');
                } else if (prop === 'Friday') {
                    self.FridayActive('');
                } else if (prop === 'Saturday') {
                    self.SaturdayActive('');
                } else if (prop === 'Holiday') {
                    self.HolidayActive('');
                }
            }
        });

        self.emptyEntry['Begin Month'].Value.subscribe(function (val) {
            if (val === 0) {
                self.emptyEntry['End Month'].Value(0);
                self.emptyEntry['End Month'].isReadOnly(true);
            } else {
                self.emptyEntry['End Month'].isReadOnly(false);
            }
        });
        self.emptyEntry['Begin Day'].Value.subscribe(function (val) {
            if (val === 0) {
                self.emptyEntry['End Day'].Value(0);
                self.emptyEntry['End Day'].isReadOnly(true);
            } else {
                self.emptyEntry['End Day'].isReadOnly(false);
            }
        });
        self.emptyEntry['Begin Year'].Value.subscribe(function (val) {
            if (val === 0) {
                self.emptyEntry['End Year'].Value(0);
                self.emptyEntry['End Year'].isReadOnly(true);
            } else {
                self.emptyEntry['End Year'].isReadOnly(false);
            }
        });

        this.beginDate = ko.computed(function () {
            var monthNo = self.emptyEntry['Begin Month'].Value(),
                day = self.emptyEntry['Begin Day'].Value(),
                year = self.emptyEntry['Begin Year'].Value();

            return buildMonthStr(monthNo, day, year);
        });

        this.endDate = ko.computed(function () {
            var monthNo = self.emptyEntry['End Month'].Value(),
                day = self.emptyEntry['End Day'].Value(),
                year = self.emptyEntry['End Year'].Value();
            return buildMonthStr(monthNo, day, year);
        });

        self.emptyEntry['Begin Month'].Value.valueHasMutated();
        self.emptyEntry['Begin Day'].Value.valueHasMutated();
        self.emptyEntry['Begin Year'].Value.valueHasMutated();
        self.emptyEntry['Days Active'].Value.valueHasMutated();

        socket.on('returnEntries', function (data) {
            if (!data.err) {
                var entries = data.entries,
                    items = [];

                self.oldPoints = [];
                self.updateScheds = [];
                self.cancelScheds = [];
                self.hardScheds = [];

                entries.forEach(function (item) {
                    var oldPoint = item,
                        newPoint = ko.viewmodel.fromModel(item);
                    if (item._pStatus !== 0) {
                        self.hardScheds.push(item);
                    } else {
                        self.oldPoints.push(oldPoint);
                        items.push({
                            point: newPoint,
                            oldPoint: oldPoint
                        });
                    }
                });

                items.map(function (item) {
                    item = self.buildObservable(item);
                    return item;
                });

                self.entries = ko.observableArray(items);
                items = [];

                self.searchTerm.valueHasMutated();
                self.gettingData(false);
            }
        });
    }

    ViewModel.prototype.buildObservable = function (item, clonedEntry) {
        var self = this,
            indiv = item.point,
            controlPoint = config.Utility.getPropertyObject('Control Point', ko.viewmodel.toModel(indiv));

        item.isDeleted = ko.observable(clonedEntry && clonedEntry.isDeleted() || false);
        item.isNew = ko.observable(clonedEntry && clonedEntry.isNew() || false);
        item.properties = ko.observableArray([]);
        item.valueTypeSelector = ko.observable(clonedEntry && clonedEntry.valueTypeSelector() || 0);
        item.ValueOptions = ko.observableArray([]);
        item.months = ko.observableArray(buildDateArray(1, 12));
        item.days = ko.observableArray(buildDateArray(1, 31));
        item.years = ko.observableArray(buildDateArray(2015, 2050));
        item.Sunday = ko.observable(clonedEntry && clonedEntry.Sunday() || 'S');
        item.Monday = ko.observable(clonedEntry && clonedEntry.Monday() || 'M');
        item.Tuesday = ko.observable(clonedEntry && clonedEntry.Tuesday() || 'T');
        item.Wednesday = ko.observable(clonedEntry && clonedEntry.Wednesday() || 'W');
        item.Thursday = ko.observable(clonedEntry && clonedEntry.Thursday() || 'T');
        item.Friday = ko.observable(clonedEntry && clonedEntry.Friday() || 'F');
        item.Saturday = ko.observable(clonedEntry && clonedEntry.Saturday() || 'S');
        item.Holiday = ko.observable(clonedEntry && clonedEntry.Holiday() || 'H');
        item.SundayActive = ko.observable(clonedEntry && clonedEntry.SundayActive() || '');
        item.MondayActive = ko.observable(clonedEntry && clonedEntry.MondayActive() || '');
        item.TuesdayActive = ko.observable(clonedEntry && clonedEntry.TuesdayActive() || '');
        item.WednesdayActive = ko.observable(clonedEntry && clonedEntry.WednesdayActive() || '');
        item.ThursdayActive = ko.observable(clonedEntry && clonedEntry.ThursdayActive() || '');
        item.FridayActive = ko.observable(clonedEntry && clonedEntry.FridayActive() || '');
        item.SaturdayActive = ko.observable(clonedEntry && clonedEntry.SaturdayActive() || '');
        item.HolidayActive = ko.observable(clonedEntry && clonedEntry.HolidayActive() || '');
        item.activeday = ko.observable(clonedEntry && clonedEntry.activeday() || 'activeday');
        item.intervalAdjust = ko.observable(clonedEntry && clonedEntry.intervalAdjust() || 0);
        item.url = ko.observable(null);
        item.scheduleName = ko.observable('');
        item.lastValueType = ko.observable(indiv['Control Value'].ValueType());
        if (self.pointType !== 'Schedule' && indiv._parentUpi() !== 0) {
            getRefData(indiv._parentUpi()).done(function (data) {
                if (data.hasOwnProperty('message')) {
                    // ignore
                } else {
                    var endPoint = config.Utility.pointTypes.getUIEndpoint(self.pointType, indiv._parentUpi());
                    item.scheduleName(config.Utility.getPointName(data.path));
                    item.url(endPoint.review.url);
                }
            });
        }
        item.openPointReview = function () {
            dtiUtility.openWindow(item.url(), item.scheduleName(), self.pointType, '', indiv._parentUpi());
        };

        item.refPoint = null;
        item.hasRef = ko.computed(function () {
            return indiv['Point Refs']()[0].Value() !== 0;
        });

        item.intervalAdjust.subscribe(function (time) {
            var curTime = indiv['Control Time'].Value(),
                adjustment = curTime - self.lowestControlTime() + time;

            if (adjustment > maxTime) {
                adjustment = maxTime;
            }

            indiv['Control Time'].Value(adjustment);
        });

        item.allowHostEdit = ko.computed(function () {
            /*switch (indiv["Control Property"].Value()) {
                case "Alarm Value":
                case "Out of Service":
                case "Execute Now":
                case "Alarms Off":
                case "Low Alarm Limit":
                case "High Alarm Limit":
                    indiv['Host Schedule'].Value(true);
                    return false;
                default:
                    return true;
            }*/
        });

        item.visibleController = ko.computed(function () {
            var pointType = controlPoint.PointType,
                property = indiv['Control Property'].Value();

            if ([1, 2, 4, 5].indexOf(pointType) > -1 && property === 'Value') {
                return true;
            }
            return false;
        });

        item.beginDate = ko.computed(function () {
            var monthNo = indiv['Begin Month'].Value(),
                day = indiv['Begin Day'].Value(),
                year = indiv['Begin Year'].Value();

            return buildMonthStr(monthNo, day, year);
        });

        item.endDate = ko.computed(function () {
            var monthNo = indiv['End Month'].Value(),
                day = indiv['End Day'].Value(),
                year = indiv['End Year'].Value();
            return buildMonthStr(monthNo, day, year);
        });

        indiv['Point Refs']()[0].Value.subscribe(function (ref) {
            getRefData(ref).done(function (data) {
                item.refPoint = (data.hasOwnProperty('message')) ? null : data;

                self.updateSaveButton();

                item.ValueOptions((data.hasOwnProperty('Value') && data.Value.hasOwnProperty('ValueOptions')) ? enumToArray(data.Value.ValueOptions) : []);

                var newIndiv = config.EditChanges.applyUniquePIDLogic({
                    point: ko.viewmodel.toModel(indiv),
                    refPoint: data
                }, 'Control Point');

                for (var prop in newIndiv['Point Refs'][0]) {
                    if (prop !== 'Value') {
                        indiv['Point Refs']()[0][prop](newIndiv['Point Refs'][0][prop]);
                    }
                }
                controlPoint = config.Utility.getPropertyObject('Control Point', ko.viewmodel.toModel(indiv));

                var props = [],
                    controlPointType = controlPoint.PointType;

                for (var pt in config.Enums['Point Types']) {
                    if (config.Enums['Point Types'][pt].enum === controlPointType) {
                        props = config.Enums['Point Types'][pt].schedProps;
                    }
                }

                item.properties(props);
                //indiv["Control Property"].Value(props[0]);
                indiv['Control Property'].Value.valueHasMutated();
            });
        });
        indiv['Control Property'].Value.subscribe(function (property) {
            if (item.refPoint !== null) {
                var pointtypePropertyTemplate = config.Templates.getTemplate(item.refPoint['Point Type'].Value)[property];
                var valueTypeInt;

                if (!!pointtypePropertyTemplate) {
                    valueTypeInt = pointtypePropertyTemplate.ValueType;
                    item.valueTypeSelector(valueTypeInt);
                    indiv['Control Value'].ValueType(valueTypeInt);
                    indiv['Control Value'].ValueType.valueHasMutated();
                    indiv['Control Property'].eValue(config.Enums.Properties[property].enum);
                    //indiv["Active Release"].Value(false); If this is added back, go through all entries after load and set to db value
                }
            }
        });
        indiv['Control Value'].ValueType.subscribe(function (value) {
            var valueTypeInt = indiv['Control Value'].ValueType(),
                property = indiv['Control Property'].Value();

            if (valueTypeInt === 5) {
                if (property === 'Program Change Request') {
                    item.ValueOptions(config.Utility.pointTypes.getEnums(property, property));
                    //indiv["Control Value"].eValue = ko.observable(item.ValueOptions[1].value);
                    //indiv["Control Value"].Value = ko.observable(item.ValueOptions[1].name);
                } else {
                    item.ValueOptions(enumToArray(item.refPoint.Value.ValueOptions));
                    //indiv["Control Value"].eValue = ko.observable(pointtypePropertyTemplate.eValue);
                }
                item.ValueOptions(ko.viewmodel.toModel(item.ValueOptions));
                for (var i = 0; i < item.ValueOptions.length; i++) {
                    if (indiv['Control Value'].Value() === item.ValueOptions[i].name) {
                        indiv['Control Value'].eValue(item.ValueOptions[i].value);
                    }
                }
                item.ValueOptions.valueHasMutated();
            } else if (valueTypeInt === 1) {
                if (item.lastValueType() !== 1) {
                    item.lastValueType(valueTypeInt);
                    indiv['Control Value'].Value(0);
                }
            } else if (valueTypeInt === 7) {
                if (item.lastValueType() !== 7) {
                    item.lastValueType(valueTypeInt);
                    indiv['Control Value'].Value(false);
                }
            }
        });
        indiv['Control Value'].eValue = ko.observable();
        indiv['Control Value'].eValue.subscribe(function (evalue) {
            for (var i = 0; i < item.ValueOptions().length; i++) {
                if (evalue === item.ValueOptions()[i].value) {
                    indiv['Control Value'].Value(item.ValueOptions()[i].name);
                }
            }
        });
        indiv['Days Active'].Value.subscribe(function (val) {
            for (var prop in config.Enums['Day of Week Flags']) {
                if ((config.Enums['Day of Week Flags'][prop].enum & val) !== 0) {
                    if (prop === 'Sunday') {
                        item.SundayActive('activeday');
                    } else if (prop === 'Monday') {
                        item.MondayActive('activeday');
                    } else if (prop === 'Tuesday') {
                        item.TuesdayActive('activeday');
                    } else if (prop === 'Wednesday') {
                        item.WednesdayActive('activeday');
                    } else if (prop === 'Thursday') {
                        item.ThursdayActive('activeday');
                    } else if (prop === 'Friday') {
                        item.FridayActive('activeday');
                    } else if (prop === 'Saturday') {
                        item.SaturdayActive('activeday');
                    } else if (prop === 'Holiday') {
                        item.HolidayActive('activeday');
                    }
                } else if (prop === 'Sunday') {
                    item.SundayActive('');
                } else if (prop === 'Monday') {
                    item.MondayActive('');
                } else if (prop === 'Tuesday') {
                    item.TuesdayActive('');
                } else if (prop === 'Wednesday') {
                    item.WednesdayActive('');
                } else if (prop === 'Thursday') {
                    item.ThursdayActive('');
                } else if (prop === 'Friday') {
                    item.FridayActive('');
                } else if (prop === 'Saturday') {
                    item.SaturdayActive('');
                } else if (prop === 'Holiday') {
                    item.HolidayActive('');
                }
            }
        });
        indiv['Begin Month'].Value.subscribe(function (val) {
            if (val === 0) {
                indiv['End Month'].Value(0);
                indiv['End Month'].isReadOnly(true);
            } else {
                indiv['End Month'].isReadOnly(false);
            }
        });
        indiv['Begin Day'].Value.subscribe(function (val) {
            if (val === 0) {
                indiv['End Day'].Value(0);
                indiv['End Day'].isReadOnly(true);
            } else {
                indiv['End Day'].isReadOnly(false);
            }
        });
        indiv['Begin Year'].Value.subscribe(function (val) {
            if (val === 0) {
                indiv['End Year'].Value(0);
                indiv['End Year'].isReadOnly(true);
            } else {
                indiv['End Year'].isReadOnly(false);
            }
        });


        item.removeEntry = function (data, e) {
            var upi = data.point._id(),
                i;

            //self.entries().splice(i, 1);
            data.isDeleted(true);

            self.updateSaveButton();
        };
        item.returnEntry = function (data, e) {
            var upi = data.point._id(),
                i;

            //self.entries().splice(i, 1);
            data.isDeleted(false);
            self.updateSaveButton();
        };

        item.isDeleted.subscribe(function (bool) {
            indiv['Control Time'].isReadOnly(bool);
        });

        item.isEditable = ko.computed(function () {
            return self.isInEditMode() && !item.isDeleted();
        });

        item.isRoCtrl = ko.computed(function () {
            return (item.isEditable()) ? '' : 'roControls';
        });

        item.notNew = function () {
            if (item.isNew()) {
                window.setTimeout(function () {
                    item.isNew(false);
                }, 2000);
            }
        };

        item.altBgColor = function (index) {
            if (item.isDeleted()) {
                return 'deleted';
            } else if (item.isNew()) {
                return 'new';
            }
            return (index() % 2 === 0) ? 'even' : 'odd';
        };

        indiv['Begin Month'].Value.valueHasMutated();
        indiv['Begin Day'].Value.valueHasMutated();
        indiv['Begin Year'].Value.valueHasMutated();
        indiv['Point Refs']()[0].Value.valueHasMutated();
        indiv['Days Active'].Value.valueHasMutated();
        return item;
    };


    // This routine must be called using .call so that 'this' is the array we want to sort on
    function sortArray(prop, dir) {
        var opp = ~dir + 1; // Get opposite direction (-1 to 1 or 1 to -1)
        return this.sort(function (obj1, obj2) {
            // console.log(prop, obj1, obj1[prop]);
            if (prop === 'scheduleName') {
                return (obj1[prop]() === obj2[prop]()) ? 0 : (obj1[prop]() < obj2[prop]()) ? opp : dir;
            } else if (prop === 'refPoint') {
                if (obj1[prop] === null || obj2[prop] === null) {
                    if (obj1[prop] === null) {
                        return opp;
                    }
                    return dir;
                }
                return (obj1[prop].path === obj2[prop].path) ? 0 : (obj1[prop].path < obj2[prop].path) ? opp : dir;
            } else if (obj1.point[prop].hasOwnProperty('Value')) {
                return (obj1.point[prop].Value() === obj2.point[prop].Value()) ? 0 : (obj1.point[prop].Value() < obj2.point[prop].Value()) ? opp : dir;
            }
            return (obj1.point[prop]() === obj2.point[prop]()) ? 0 : (obj1.point[prop]() < obj2.point[prop]()) ? opp : dir;
        });
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.render = function () {
        var self = this,
            defaultWidth,
            initDOM = function () {
                $searchInput = $('div.search input'); // This is a global var within this module)
                $clearSearchIcon = $('.clearSearchIcon'); // This is a global var within this module)
                defaultWidth = '175px';
                $searchInput.css('width', defaultWidth);
            };
        self.gettingData(true);

        socket.emit('getScheduleEntries', {
            isSchedule: (this.pointType === 'Schedule'),
            upi: this.id
        });

        initDOM();
    };

    ViewModel.prototype.openPointReview = function (data) {
        var workspace = window.top.workspaceManager,
            endPoint = workspace.config.Utility.pointTypes.getUIEndpoint(data.ref.PointType, data.ref.Value);

        dtiUtility.openWindow(endPoint.review.url, data.ref.PointName, data.ref.PointType, '', data.ref.Value, {
            width: 820,
            height: 542
        });
    };

    ViewModel.prototype.sortTable = function (property, viewModel, e) {
        var $e = $(e.currentTarget);

        if (this.sortProperty === property) {
            this.sortDirection = -this.sortDirection; // Change direction (-1 to 1 or 1 to -1)
        } else {
            this.sortProperty = property;
            this.sortDirection = ASC;
        }

        sortArray.call(this.filteredEntries, property, this.sortDirection);

        $('table.entryTable thead div i.fa').removeClass('fa-chevron-down fa-chevron-up');
        $e.find('i.fa').addClass(this.sortDirection === ASC ? 'fa-chevron-up' : 'fa-chevron-down');
    };
    ViewModel.prototype.clearSearch = function () {
        this.searchTerm('');
        $searchInput.focus();
    };

    ViewModel.prototype.toggleDay = function (data, e) {
        var $e = $(e.currentTarget),
            dayEnum = $e.data('enum');

        var days = data.point['Days Active'].Value();
        data.point['Days Active'].Value(days ^ dayEnum);
    };

    ViewModel.prototype.toggleDayGlobal = function (data, e) {
        var $e = $(e.currentTarget),
            dayEnum = $e.data('enum');

        var days = data.emptyEntry['Days Active'].Value();
        data.emptyEntry['Days Active'].Value(days ^ dayEnum);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {
        // this.isTabLoaded.dispose();
    };

    ko.bindingHandlers.setEnumTextValue = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var $element = $(element),
                context = ko.contextFor(element),
                allBindings = allBindingsAccessor(),
                options = ko.utils.unwrapObservable(allBindings.options),
                eValue = allBindings.value,
                value = valueAccessor();


            valueSubscription = allBindings.value.subscribe(function (newValue) {
                var match = ko.utils.arrayFirst(options, function (item, index) {
                    if (item.badProperty) {
                        options.splice(index, 1);
                        return false;
                    }

                    return ko.unwrap(item.value) === newValue;
                });
                var garbageVar = !!match && value(ko.unwrap(match.name));
            });
        }
    };
    var count = 0;

    function getRefData(id) {
        return $.ajax({
            url: apiEndpoint + 'points/getpointref/small/' + id,
            contentType: 'application/json',
            dataType: 'json',
            type: 'get'
        });
    }

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});

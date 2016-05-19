var sysPrefsViewModel = (function() {

    var self = this,
        initFunctions = [],
        getSectionRef = function(section) {
            var name = section.charAt(0).toLowerCase() + section.substring(1).replace(/\s/g, '');

            return name + 'ViewModel';
        },
        isDirty = function() {
            var dirty = false,
                c, len = self.sections.length,
                vm;

            for (c = 0; c < len; c++) {
                vm = self.sections[c];
                if (vm.dirty && vm.dirty() === true) {
                    dirty = true;
                }
            }

            self.dirty(dirty);
        };

    self.registerSection = function(VM, init) {
        var vm = new VM(),
            name = getSectionRef(vm.displayName),
            sortSections = function() {
                self.sections.sort(function(a, b) {
                    return a.displayName === b.displayName ? 0 : (a.displayName < b.displayName ? -1 : 1);
                });
            };

        self.sections.push(vm);
        sortSections();
        self[name] = vm;

        if (vm.dirty) {
            vm.dirty.subscribe(function(newValue) {
                isDirty();
            });
        }

        if (init) {
            initFunctions.push(vm[init]);
        }
    };

    self.runInitFunctions = function() {
        var c, len = initFunctions.length,
            fn;

        for (c = 0; c < len; c++) {
            fn = initFunctions[c];
            if (typeof fn === 'function') {
                fn();
            }
        }
    };

    self.sections = [];
    self.getSection = function(name) {
        var ref = getSectionRef(name);

        return self[ref];
    };

    self.saveAll = function() {
        var vm,
            c,
            len = self.sections.length;

        for (c = 0; c < len; c++) {
            vm = self.sections[c];
            if (vm.save && vm.dirty && vm.dirty()) {
                vm.save();
            }
        }
    };

    self.cancelAll = function() {
        var vm,
            c,
            len = self.sections.length;

        for (c = 0; c < len; c++) {
            vm = self.sections[c];
            if (vm.cancel) {
                vm.cancel();
            }
        }
        self.dirty(false);
    };

    self.goToSection = function(displayName) {
        var hash = '#' + displayName;

        location.hash = hash;
    };

    self.dirty = ko.observable(false);

    self.section = ko.observable('');

    $(window).on('hashchange', function() {
        var displayName = location.hash.substring(1);
        self.section(displayName);
    });

    return self;
}());


// click-to-edit binding for prefs screens.  accepts enter key and escapes out of changes
ko.bindingHandlers.clickEdit = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var el = $(element),
            span = el.children('span'),
            inputEl = el.children('input'),
            selectEl = el.children('select'),
            originalValue = ko.unwrap(valueAccessor());

        el.addClass('clickToEdit');
        el.on('click', function(event) {
            span.addClass('hide');
            inputEl.removeClass('hide').focus();
            selectEl.removeClass('hide').focus();
            originalValue = inputEl.val() || selectEl.val();
        });

        inputEl.on('blur', function(event) {
            inputEl.addClass('hide');
            span.removeClass('hide');
        });
        selectEl.on('blur', function(event) {
            selectEl.addClass('hide');
            span.removeClass('hide');
        });

        inputEl.on('keyup', function(event) {
            var keyCode = event.which || event.keyCode;

            //escape
            if (keyCode === 27) {
                inputEl.val(originalValue);
                inputEl[0].blur();
                return true;
            }

            //not enter
            if (keyCode !== 13) {
                return true;
            }

            inputEl[0].blur();

            return false;
        });
    }
};

ko.validation.rules.ipAddress = {
    validator: function(value) {
        var ranges,
            c, len,
            num;

        if (ko.validation.utils.isEmptyVal(value)) {
            return false;
        }

        ranges = value.split('.');
        len = ranges.length;

        if (ranges.length !== 4) {
            return false;
        }

        for (c = 0; c < len; c++) {
            num = ranges[c];

            if (typeof num === 'string' && num.match(/[^\d]+/)) {
                return false;
            }

            num = parseInt(ranges[c], 10);

            if (num < 0 || num > 255) {
                return false;
            }
        }

        return true;

    },
    message: 'Invalid IP Address'
};

ko.validation.registerExtenders();

// Calendar screen ------------------------------------------------------------
var calendarViewModel = function() {
    var viewModel = {

        displayName: 'Calendar',

        dirty: ko.observable(false),

        season: ko.observable(''),

        originalSeason: '',

        hasError: ko.observable(false),

        errorOccurred: ko.observable(false),

        gettingData: ko.observable(false).extend({
            throttle: 250
        }),

        year: ko.observable(),

        holidays: ko.observableArray(),

        originalHolidays: [],

        updateDatePicker: function(year) {
            $('#jqxCalendar').off('change');
            $('#jqxCalendar').jqxCalendar('setMinDate', new Date(year, 0, 1));
            $('#jqxCalendar').jqxCalendar('setMaxDate', new Date(year, 11, 31));
            $('#jqxCalendar').jqxCalendar('setDate', new Date(year, 0, 1));

            $('#jqxCalendar').on('change', function(event) {
                viewModel.add(event.args.date);
                $('#jqxCalendar').css('display', 'none');
            });
        },

        incrementYear: function() {

            var proceed = true,
                year;

            if (viewModel.dirty() === true) {
                proceed = confirm("You have unsaved data. Would you like to proceed (your changes will be lost)?");
            }

            if (proceed) {
                year = viewModel.year() + 1;
                viewModel.year(year);
                viewModel.updateDatePicker(year);
            }
        },

        decrementYear: function() {

            var proceed = true,
                year;

            if (viewModel.dirty() === true) {
                proceed = confirm("You have unsaved data. Would you like to proceed (your changes will be lost)?");
            }

            if (proceed) {
                year = viewModel.year() - 1;
                viewModel.year(year);
                viewModel.updateDatePicker(year);
            }
        },

        modifyDay: function(data, delta) {
            var month, date,
                h = Date.parse(data.month + "." + data.date() + "." + viewModel.year()).addDays(delta);

            month = h.getMonth() + 1; // Get month (and make it one-based)
            date = h.getDate(); // Get date

            // If this month-date combination doesn't already exist
            if (!viewModel.match(month, date)) {

                data.month = month; // Update month
                data.date(date); // Update date

                // See if our holiday collection changed and update the dirty flag accordingly
                viewModel.dirty(viewModel.different());
            } else {
                alert("Whoops, we can't change this because " + h.toString('MMMM') + " " + date + " already exists.");
            }
        },

        incrementDay: function(data) {
            viewModel.modifyDay(data, +1);
        },

        decrementDay: function(data) {
            viewModel.modifyDay(data, -1);
        },

        getData: function(year) {

            var i, len,
                entry = [];

            year = year || viewModel.year();

            viewModel.gettingData(true);

            $.ajax({
                url: '/api/calendar/getyear',
                data: {
                    'year': year
                },
                dataType: 'json',
                type: 'post'
            }).done(function(data) {
                var myObj,
                    isDirty = function(value) {
                        viewModel.dirty(viewModel.different());
                    };
                // Clear the non-editable array data in preparation for getting new data
                viewModel.originalHolidays.length = 0;

                if ((data !== null) && (data.dates !== null)) {
                    for (i = 0, len = data.dates.length; i < len; i++) {
                        myObj = {};

                        data.dates[i].date = parseInt(data.dates[i].date, 10);
                        data.dates[i].month = parseInt(data.dates[i].month, 10);

                        myObj.month = data.dates[i].month;
                        myObj.date = ko.observable(data.dates[i].date);
                        myObj.comment = ko.observable(data.dates[i].comment);
                        myObj.comment.subscribe(isDirty);
                        entry.push(myObj);

                        // If requesting data for the selected year
                        if (year === viewModel.year()) {
                            // Save a non-editable version of the data
                            viewModel.originalHolidays.push({
                                'month': data.dates[i].month,
                                'date': data.dates[i].date,
                                'comment': data.dates[i].comment
                            });
                        }
                        // Nope, requested data is for a previous year
                        else {
                            // We must set the data changed flag which triggers the UI save & cancel buttons
                            viewModel.dirty(true);
                        }
                    }
                }
                viewModel.holidays(entry);
                //hydrate the season and originalSeason properties on viewmodel -- gettingData() changed after this function is completed successfully
                viewModel.getSeasonData();
            }).fail(function(jqXHR, textStatus, errorThrown) {
                alert(textStatus + ": " + errorThrown);
                viewModel.gettingData(false);
            });
        },
        updateSeasonData: function(mdl) {
            var ajopts, callbacks, vm, data;
            vm = viewModel;
            data = {
                'Current Season': vm.season()
            };
            vm.gettingData(true);
            callbacks = {
                success: function(sdata) {
                    vm.gettingData(false);
                    if (sdata.message !== 'success') {
                        vm.hasError(true);
                    } else {
                        vm.originalSeason = vm.season();
                        vm.dirty(false);
                    }
                },
                fail: function(jqXHR, status, error) {
                    vm.gettingData(false);
                    vm.hasError(true);
                    return error;
                }
            };
            ajopts = {
                url: 'api/calendar/updateseason',
                type: 'POST',
                dataType: 'json',
                data: data
            };
            $.ajax(ajopts).done(callbacks.success).fail(callbacks.fail);
        },
        getSeasonData: function() {
            var ajopts, callbacks, vm;
            vm = viewModel;
            vm.gettingData(true);
            callbacks = {
                success: function(data) {
                    vm.season(data['Current Season']);
                    vm.originalSeason = vm.season();
                    vm.gettingData(false);
                    return data;
                },
                fail: function(jqXHR, status, error) {
                    vm.gettingData(false);
                    vm.hasError(true);
                    return error;
                }
            };
            ajopts = {
                url: 'api/calendar/getseason',
                type: 'POST',
                dataType: 'json'
            };
            $.ajax(ajopts).done(callbacks.success).fail(callbacks.fail);
            return ajopts;
        },
        changeSeason: function(mdl, ev) {
            viewModel.dirty(viewModel.different());
            return true;
        },
        copyPreviousYear: function(data) {
            viewModel.getData(viewModel.year() - 1);
        },

        getDayOfWeek: function(dataObj) {
            return Date.parse(dataObj.month + "." + dataObj.date() + "." + viewModel.year()).toString("dddd");
        },

        getMonth: function(dataObj) {
            return Date.parse(dataObj.month + "." + dataObj.date() + "." + viewModel.year()).toString("MMMM");
        },

        different: function() {
            var found,
                i, j,
                diff = false,
                mlen = viewModel.holidays().length,
                olen = viewModel.originalHolidays.length;

            if (olen !== mlen) { // If we have a different # of holidays in each collection
                diff = true; // We know we have a difference
            }

            // Loop through each holiday in the modified collection until we find a difference
            for (i = 0;  (i < mlen) && (diff === false); i++) {
                found = false; // Initialize difference found flag

                // Try to find a match in the original holiday collection
                for (j = 0; j < olen; j++) {
                    // If we found a match
                    if (_.isEqual(viewModel.originalHolidays[j], ko.toJS(viewModel.holidays()[i]))) {
                        found = true; // Set found flag
                        break;
                    }
                }

                // If we couldn't find a match the modified collection is different
                if (found === false) {
                    diff = true; // Set difference found flag
                }
            }
            if (viewModel.season() !== viewModel.originalSeason) {
                diff = true;
            }
            return diff;
        },

        match: function(month, date) {
            return ko.utils.arrayFirst(viewModel.holidays(), function(holiday) {
                return ((holiday.month === month) && (holiday.date() === date));
            });
        },

        add: function(date) {

            var myObj = {},
                month = date.getMonth() + 1,
                day = date.getDate();

            if (!viewModel.match(month, day)) {

                myObj.month = month;
                myObj.date = ko.observable(day);
                myObj.comment = ko.observable("Description...");

                viewModel.holidays.push(myObj);
                viewModel.dirty(viewModel.different());
            } else {
                alert("Whoops, " + date.toString('MMMM') + " " + day + " already exists. Please select another date.");
            }
        },

        delete: function(data) {
            viewModel.holidays.remove(data);
            viewModel.dirty(viewModel.different());
        },

        save: function(data) {
            $.ajax({
                url: '/api/calendar/newdate',
                data: {
                    'year': viewModel.year(),
                    'dates': ko.toJS(viewModel.holidays)
                },
                dataType: 'json',
                type: 'post'
            }).done(function(data) {
                var i, len;
                if (data.err === undefined) {
                    viewModel.originalHolidays.length = 0;
                    if (data.dates !== null) {
                        for (i = 0, len = data.dates.length; i < len; i++) {
                            // Save a non-editable version of the data
                            viewModel.originalHolidays.push({
                                'month': data.dates[i].month,
                                'date': data.dates[i].date,
                                'comment': data.dates[i].comment
                            });
                        }
                    }
                    // update season will trigger the change in dirty() value
                    viewModel.updateSeasonData(data);
                }
            });
        },

        cancel: function() {
            var i, len,
                myObj,
                entry = [],
                isDirty = function(value) {
                    viewModel.dirty(viewModel.different());
                };

            for (i = 0, len = viewModel.originalHolidays.length; i < len; i++) {
                myObj = {};

                myObj.month = viewModel.originalHolidays[i].month;
                myObj.date = ko.observable(viewModel.originalHolidays[i].date); // Make the date observable
                myObj.comment = ko.observable(viewModel.originalHolidays[i].comment); // Make the comment observable
                myObj.comment.subscribe(isDirty);

                entry.push(myObj);
            }
            viewModel.holidays(entry);
            viewModel.season(viewModel.originalSeason);
            viewModel.dirty(false);
        },

        alertTest: function(string) {
            alert(string);
        }
    };

    viewModel.year.subscribe(function(value) {
        viewModel.getData();
        viewModel.dirty(false);
    });

    return viewModel;
};


// Controllers Screen ---------------------------------------------------------
var controllerViewModel = function() {
    var self = this,
        originalData,
        $grid,
        $controllerMessage,
        $addControllerForm,
        $newControllerName,
        ID = 'Controller ID',
        NAME = 'Controller Name',
        dataUrl = '/api/system/controllers',
        saveUrl = '/api/system/updateControllers',
        dirs = {},
        setDirty = function() {
            self.dirty(true);
        },
        Controller = function(row, idx) {
            // console.log('row', row);
            var id = row[ID],
                name = row[NAME],
                description = row.Description,
                isUser = (row.isUser === true || row.isUser === 'true' || false);

            this.isUser = isUser;
            this[ID] = ko.observable(parseInt(id, 10));
            this[NAME] = ko.observable(name);
            this.Description = ko.observable(description);
            this[NAME].subscribe(setDirty);
            this.Description.subscribe(setDirty);
            this._idx = idx;
        },
        setData = function(data) {
            var c, len = data.length,
                ret = [];

            for (c = 0; c < len; c++) {
                ret.push(new Controller(data[c], c));
            }

            self.sortByID();

            self.controllers(ret);
            self.dirty(false);
        },
        getData = function() {
            $.ajax({
                url: dataUrl
            }).done(function(data) {
                originalData = data;
                setData(data);
            });
        },

        sortBy = function(field, numeric) {
            var dir = dirs[field];

            self.controllers.sort(function(a, b) {
                var aa = a[field](),
                    bb = b[field]();

                if (numeric) {
                    aa = parseInt(aa, 10);
                    bb = parseInt(bb, 10);
                } else {
                    aa = aa.toLowerCase();
                    bb = bb.toLowerCase();
                }

                if (aa > bb) {
                    return dir;
                }

                if (aa < bb) {
                    return -1 * dir;
                }

                return 0;
            });

            dirs[field] = -dir;
        },

    //display status message on saving
        showMessage = function(text) {
            var message = text.charAt(0).toUpperCase() + text.substring(1);
            $controllerMessage.stop(true)
                .html(message)
                .show(0)
                .delay(2000)
                .fadeOut();
        };

    self.displayName = 'Controllers';

    self.dirty = ko.observable(false);
    self.hasError = ko.observable(false);
    self.controllerName = ko.observable();
    self.controllerDesc = ko.observable();
    self.controllers = ko.observableArray();
    self.showEntryForm = ko.observable(false);

    dirs[NAME] = -1;
    dirs[ID] = -1;
    dirs.Description = -1;

    self.init = function() {
        $grid = $('#controllerGrid');
        $controllerMessage = $('#controllerMessage');
        $addControllerForm = $('#newControllerForm');
        $newControllerName = $('#newControllerName');

        $addControllerForm.jqxValidator({
            animationDuration: 0,
            rules: [{
                input: '#newControllerName',
                message: 'Name is required',
                action: 'blur',
                rule: 'required'
            }, {
                input: '#newControllerName',
                message: 'Name must be at least 3 characters',
                action: 'blur',
                rule: 'length=3,255'
            }]
        });

        getData();
    };

    self.sortByID = function() {
        sortBy(ID, true);
    };

    self.sortByName = function() {
        sortBy(NAME);
    };

    self.sortByDescription = function() {
        sortBy('Description');
    };

    //shows add controller form

    self.showForm = function() {
        self.resetForm();
        self.showEntryForm(true);
        $newControllerName.focus();
    };

    self.resetForm = function() {
        $addControllerForm.jqxValidator('hide');

        //this clears out the form so subsequent visits to the same controller are properly updated
        self.controllerName('');
        self.controllerDesc('');
        self.showEntryForm(false);
    };

    //handles the add form submission
    self.handleFormSubmit = function(form) {
        var name = self.controllerName(),
            desc = self.controllerDesc(),
            records = self.controllers(),
            len = records.length,
            done = false,
            isValidated,
            emptyIndex,
            row,
            maxId = 0,
            tmpId,
            obj = {},
            ids = {},
            finish = function() {
                self.dirty(true);
                self.resetForm();
                showMessage('Added controller "' + name + '" with ID ' + emptyIndex);
            },
            findEmpty = function() {
                var cc,
                    done = false,
                    emptyId;

                for (cc = 1; cc < maxId && !done; cc++) {
                    if (ids[cc] !== true) {
                        emptyId = cc;
                        done = true;
                    }
                }
                if (!done) {
                    emptyId = maxId + 1;
                }
                return emptyId;
            },
            c;

        isValidated = $addControllerForm.jqxValidator('validate');

        //make sure the form is valid first
        if (isValidated === true) {
            for (c = 0; c < len && !done; c++) {
                row = records[c];
                tmpId = row[ID]();
                ids[tmpId] = true;
                if (tmpId > maxId) {
                    maxId = tmpId;
                }
                if (row[NAME]() === '') {
                    emptyIndex = tmpId;
                    row[NAME](name);
                    row.Description(desc);
                    row.isUser = false;
                    done = true;
                }
            }

            if (done === false) {
                if (len < 255) {
                    emptyIndex = findEmpty();
                    obj[NAME] = name;
                    obj.Description = desc;
                    obj[ID] = emptyIndex;
                    obj.isUser = false;
                    row = new Controller(obj, self.controllers().length);

                    self.controllers.push(row);
                    finish();
                } else {
                    showMessage('No available controller slots');
                }
            } else {
                finish();
            }
        }
    };

    self.deleteController = function(controller, event) {
        var id = controller[ID](),
            name = controller[NAME](),
            idx = controller._idx,
            controllers = self.controllers(),
            row = controllers[idx];

        row[NAME]('');

        showMessage('Deleted controller "' + name + '" with ID ' + id);

        self.dirty(true);
    };

    self.save = function() {
        var controllers = ko.toJS(self.controllers()),
            sanitizedControllers = [],
            sanitize = function() {
                var c,
                    row,
                    obj;

                for (c = 0; c < controllers.length; c++) {

                    row = controllers[c];
                    obj = {};
                    obj[ID] = row[ID];
                    obj[NAME] = row[NAME];
                    obj.Description = row.Description;
                    obj.isUser = row.isUser;
                    if(!!row[NAME])
                        sanitizedControllers.push(obj);
                }
            };

        sanitize();

        $.ajax({
            url: saveUrl,
            data: {
                Entries: sanitizedControllers
            },
            dataType: 'json',
            type: 'post'
        }).done(function(response) {
            self.dirty(false);
            originalData = sanitizedControllers;
            showMessage('Save controllers: ' + response.message);
        });
    };

    self.cancel = function() {
        setData(originalData);
    };
};


// Control Priority Text Screen ----------------------------------------------
var controlPriorityTextViewModel = function() {
    var self = this,
        fullData,
        dataUrl = '/api/system/controlpriorities',
        saveUrl = '/api/system/updateControlPriorities',
        LEVEL = 'Priority Level',
        TEXT = 'Priority Text',
        makeDirty = function() {
            self.dirty(true);
        },
        ControlPriority = function(row) {
            var level = row[LEVEL],
                text = row[TEXT];

            this[LEVEL] = ko.observable(level);
            this[TEXT] = ko.observable(text);

            this[LEVEL].subscribe(makeDirty);
            this[TEXT].subscribe(makeDirty);
        },
        setData = function(data) {
            var c,
                len = data.length,
                ret = [];

            for (c = 0; c < len; c++) {
                ret.push(new ControlPriority(fullData[c]));
            }

            self.controlPriorities(ret);
        };

    self.displayName = 'Control Priority Text';

    self.dirty = ko.observable(false);
    self.hasError = ko.observable(false);
    self.controlPriorities = ko.observableArray();

    self.getData = function() {
        $.ajax({
            url: dataUrl
        }).done(function(data) {
            fullData = data;
            setData(data);
        });
    };

    self.save = function() {
        var arr = ko.toJS(self.controlPriorities());

        $.ajax({
            url: saveUrl,
            data: {
                Entries: arr
            },
            dataType: 'json',
            type: 'post'
        }).done(function(response) {
            self.dirty(false);
        });

        self.dirty(false);
    };

    self.cancel = function() {
        setData(fullData);
        self.dirty(false);
    };
};


// Quality Codes Screen -------------------------------------------------------
var qualityCodesViewModel = function() {
    var self = this,
        CODELABEL = 'Quality Code Label',
        CODE = 'Quality Code',
        CODECOLOR = 'Quality Code Font HTML Color',
        fullData,
        dataUrl = '/api/system/qualityCodes',
        saveUrl = '/api/system/updateQualityCodes',
        makeDirty = function() {
            self.dirty(true);
        },
        QualityCode = function(row) {
            var label = row[CODELABEL],
                code = row[CODE],
                color = row[CODECOLOR];
            this[CODELABEL] = ko.observable(label);
            this[CODE] = ko.observable(code);
            //josh -- removed parsing code from CODECOLOR value
            this[CODECOLOR] = ko.observable(color);
            this[CODECOLOR].subscribe(makeDirty);
            this[CODE].subscribe(makeDirty);
        },
        setData = function(data) {
            var c,
                entries = data.Entries || [],
                len = entries.length,
                enable = data['Quality Code Enable'],
                ret = [];

            for (c = 0; c < len; c++) {
                ret.push(new QualityCode(entries[c]));
            }

            self.qualityCodes(ret);

            self.covDisabled(enable['COV Enable'] !== 0);
            self.alarmsOff(enable['Alarms Off'] !== 0);
            self.overriden(enable.Override !== 0);
            self.commandPending(enable['Command Pending'] !== 0);

            self.dirty(false);
        };

    self.displayName = 'Quality Codes';

    self.dirty = ko.observable(false);
    self.hasError = ko.observable(false);
    self.qualityCodes = ko.observableArray();

    self.covDisabled = ko.observable(true);
    self.alarmsOff = ko.observable(false);
    self.overriden = ko.observable(true);
    self.commandPending = ko.observable(false);

    self.covDisabled.subscribe(makeDirty);
    self.alarmsOff.subscribe(makeDirty);
    self.overriden.subscribe(makeDirty);
    self.commandPending.subscribe(makeDirty);

    self.getData = function() {
        $.ajax({
            url: dataUrl
        }).done(function(data) {
            fullData = data;
            setData(data);
        });
    };

    self.save = function() {
        var arr = ko.toJS(self.qualityCodes()),
            qualityCodesObject;

        qualityCodesObject = {
            'Override': self.overriden() ? 1 : 0,
            'COV Enable': self.covDisabled() ? 1 : 0,
            'Alarms Off': self.alarmsOff() ? 1 : 0,
            'Command Pending': self.commandPending() ? 1 : 0
        };

        $.ajax({
            url: saveUrl,
            data: {
                'Entries': arr,
                'Quality Code Enable': qualityCodesObject
            },
            dataType: 'json',
            type: 'post'
        }).done(function(response) {
            self.dirty(false);
        });
    };

    self.cancel = function() {
        setData(fullData);
        self.dirty(false);
    };
};


// Custom Color Codes Screen --------------------------------------------------
var customColorCodesViewModel = function () {
    var self = this,
        originalData,
        makeDirty = function () {
            self.dirty(true);
        },
        CustomColorCode = function (index, hexColor) {
            this['hexColor'] = ko.observable(hexColor);
            this['hexColor'].subscribe(makeDirty);
        },
        saveCustomColors = function (input, url) {
            var i,
                len = input.length;
                rawHexColor = [];

            for(i = 0; i < len; i++) {
                rawHexColor.push(input[i].hexColor());
            }

            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                success: function (returnData) {
                    //console.log(url, "input = " + JSON.stringify(input));
                    //console.log(url, "returnData = " + JSON.stringify(returnData));
                },
                data: {
                    'colorsArray': rawHexColor
                }
            });
        },
        setData = function (customColors) {
            var i,
                len = customColors.length,
                ret = [];
            if (!(originalData && originalData.length !== 0)) {
                originalData = customColors;
            }
            for (i = 0; i < len; i++) {
                ret.push(new CustomColorCode(i, customColors[i]));
            }
            self.customColorCodes(ret);
            self.dirty(false);
        };
    self.init = function () {
        $.getJSON('/api/system/getCustomColors', setData);
    };
    self.cancel = function () {
        setData(originalData);
    };
    self.save = function () {
        saveCustomColors(self.customColorCodes(), '/api/system/updateCustomColors');
        self.dirty(false);
    };
    self.displayName = 'Custom Color Codes';
    self.hasError = ko.observable(false);
    self.dirty = ko.observable(false);
    self.customColorCodes = ko.observableArray();
};


// Telemetry Screen -----------------------------------------------------------
var telemetryViewModel = function() {
    var self = this,
        fullData,
        errors,
        originalValues = {},
        dataUrl = '/api/system/telemetry',
        saveUrl = '/api/system/updateTelemetry',
        tzEnums = window.opener.workspaceManager.config.Enums["Time Zones"],
        fieldList = [{
            name: 'Public IP',
            validation: {
                ipAddress: true
            }
        }, {
            name: 'IP Network Segment',
            validation: {
                required: true,
                number: true
            }
        }, {
            name: 'IP Port',
            validation: {
                required: true,
                number: true,
                min: 47808,
                max: 47823
            }
        }, {
            name: 'APDU Timeout',
            validation: {
                required: true,
                number: true
            }
        }, {
            name: 'APDU Retries',
            validation: {
                required: true,
                number: true
            }
        }, {
            name: 'Time Zone',
            validation: {
                required: true
            }
        }],
        makeDirty = function() {
            self.dirty(true);
        },
        checkForErrors = function() {
            makeDirty();
            self.hasError(errors().length > 0);
        },
        initObservables = function() {
            var c, len = fieldList.length,
                item,
                name,
                validation;

            for (c = 0; c < len; c++) {
                item = fieldList[c];
                name = item.name;
                validation = item.validation;

                self[name] = ko.observable();

                self[name].subscribe(makeDirty);

                if (validation) {
                    self[name].extend(validation);
                    self[name].subscribe(checkForErrors);
                }
            }
            errors = ko.validation.group(self);
        },
        getDataToSave = function() {
            var c, len = fieldList.length,
                field,
                ret = {};

            for (c = 0; c < len; c++) {
                field = fieldList[c].name;
                ret[field] = self[field]();
            }
            ret.ipPortChanged = (self['IP Port']() === originalValues['IP Port']) ? false : true;
            console.log(ret);

            return ret;
        },
        setData = function() {
            var c, len = fieldList.length,
                item,
                name,
                value;

            for (c = 0; c < len; c++) {
                item = fieldList[c];
                name = item.name;
                value = fullData[name];

                self[name](value);
                if(name === 'Time Zone'){
                    self.selectedTimeZoneText(getZoneFromEnum(value));
                }
                // Original values saved as a string because that's how they're formatted after they are changed in the UI
                originalValues[name] = self[name]().toString();

                self.dirty(false);
            }
            // console.log("setdata originalValues", originalValues);
        },
        updateData = function() {
            var c, len = fieldList.length,
                item,
                name,
                value;

            for (c = 0; c < len; c++) {
                item = fieldList[c];
                name = item.name;
                value = fullData[name];

                originalValues[name] = self[name]().toString();

                self.dirty(false);
            }
            console.log("updatedata originalValues", originalValues);
        },
        getZoneFromEnum = function(eValue) {
            for (var prop in tzEnums) {
                if (tzEnums[prop].enum === eValue) {
                    return prop;
                }
            }
            return '';
        };

    self.displayName = 'Telemetry';

    self.dirty = ko.observable(false);
    self.hasError = ko.observable(false);
    self.selectedTimeZone = ko.observable('');
    self.selectedTimeZoneText = ko.observable('');

    initObservables();

    self.init = function() {
        self.getData();
    };

    self.getData = function() {
        $.ajax({
            url: dataUrl
        }).done(function(data) {
            fullData = data;
            setData();
        });
    };

    self.getTZText = function() {
        return 'Central';
    };

    self.timeZones = function() {
        var timezones = [];

        for(var prop in tzEnums){
            timezones.push({name:prop, value:tzEnums[prop].enum});
        }

        return timezones;
    };

    self.save = function() {
        var valErrors = errors(),
            len = valErrors.length,
            saveObj;

        if (len === 0) {
            //no errors, save
            saveObj = getDataToSave();
            self.hasError(false);

            $.ajax({
                url: saveUrl,
                data: saveObj,
                dataType: 'json',
                type: 'post'
            }).done(function(response) {
                updateData();
            });
        } else {
            self.dirty(true);
            self.hasError(true);
        }
    };

    self.cancel = function() {
        setData();
    };
    self.changeTimezone = function(e){
        for(var prop in tzEnums){
            if(tzEnums[prop].enum === self.selectedTimeZone()){
                self['Time Zone'](self.selectedTimeZone());
                self.selectedTimeZoneText(prop);
                self.dirty(true);
            }
        }
    };
};

// Backup Screen --------------------------------------------------------------
var backupViewModel = function() {
    var self = this,
        socket = window.opener && window.opener.workspaceManager.socket(),
        initObservables = function() {

        };

    self.displayName = 'Backup';
    self.backupMsg = ko.observable('');
    self.showBackupMsg = ko.observable(false);
    self.dirty = ko.observable(false);
    self.hasError = ko.observable(false);

    self.init = function() {

    };

    self.startBackup = function() {
        socket.emit('fieldCommand', ko.toJSON({
            "Command Type": 14
        }));
    };

    socket.on('returnFromField', function(data) {
        // data = $.parseJSON(data);

        if(data.err){
            self.backupMsg('Error: ' + data.err);
        }else{
            self.backupMsg(data);
        }
        self.showBackupMsg(true);
    });
};

// Alarm Messages Screen ---------------------------------------------------------
var alarmTemplateViewModel = function() {
    var self = this,
        originalData,
        alarmTemplateCategories = window.opener.workspaceManager.config.Enums["Alarm Categories"],
        alarmTemplateTypes = window.opener.workspaceManager.config.Enums["Alarm Types"],
        $alarmTemplateContainer,
        $alarmTemplateDataTable,
        $addAlarmTemplateForm,
        $newAlarmTemplateName,
        ID = 'AlarmTemplate ID',
        NAME = 'AlarmTemplate Name',
        dataUrl = '/api/system/getAlarmTemplates',
        saveUrl = '/api/system/updateAlarmTemplate',
        dirs = {},
        alarmTemplateData,
        getColumnByRenderIndex = function (index) {
            var result;
            result = columnsArray.filter(function (col) {
                return (col.renderedIndex === index);
            });
            return result[0];
        },
        getKeyBasedOnEnumValue = function (obj, value) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (obj[key].enum === parseInt(value, 10)) {
                        return key;
                    }
                }
            }
            return "-blank-";
        },
        getColumns = function () {
            var cols = [];
            cols.push({
                columnKey: "_id",
                columnName: "ID",
                width: 2,
                display: false
            });
            cols.push({
                columnKey: "msgCat",
                columnName: "Category",
                width: 55,
                display: true
            });
            cols.push({
                columnKey: "msgType",
                columnName: "Type",
                width: 230,
                display: true
            });
            cols.push({
                columnKey: "msgName",
                columnName: "Name",
                width: 200,
                display: true
            });
            cols.push({
                columnKey: "msgFormat",
                columnName: "Definition",
                width: 350,
                display: true
            });
            cols.push({
                columnKey: "msgTextColor",
                columnName: "Text Color",
                display: false
            });
            cols.push({
                columnKey: "msgBackColor",
                columnName: "Background Color",
                display: false
            });
            cols.push({
                columnKey: "isSystemMessage",
                columnName: "System",
                width: 55,
                display: true
            });
            return cols;
        },
        columnsArray = getColumns(),
        setDirty = function() {
            self.dirty(true);
        },
        configureDataTable = function (destroy, clearData, columns) {
            var aoColumns = [],
                i,
                renderedIndex = 0,
                setTdAttribs = function (tdField, columnConfig, data, columnIndex) {
                    switch (columnConfig.columnKey) {
                        case "msgFormat":
                            $(tdField).css('background-color', data.msgBackColor.Value);
                            $(tdField).css('color', data.msgTextColor.Value);
                            break;
                        default:
                            //console.log(" - - - DEFAULT  setTdAttribs()");
                            break;
                    }
                },
                setColumnClasses = function (columnKey) {
                    var result = "";
                    switch (columnKey) {
                        case "msgCat":
                            result = "col-md-1";
                            break;
                        case "msgType":
                            result = "col-md-2";
                            break;
                        case "msgName":
                            result = "col-md-2";
                            break;
                        case "msgFormat":
                            result = "col-md-4";
                            break;
                        case "isSystemMessage":
                            result = "col-md-1";
                            break;
                        default:
                            //console.log(" - - - DEFAULT  setColumnClasses()");
                            break;
                    }
                    return result;
                },
                buildColumnObject = function (columnConfig, columnIndex) {
                    var result,
                        columnTitle = columnConfig.columnName,
                        sortAbleColumn = true;

                    result = {
                        title: columnTitle,
                        data: columnConfig.columnKey,
                        //className: setColumnClasses(columnConfig.columnKey),
                        width: (!!columnConfig.width ? columnConfig.width : "auto"),
                        render: {
                            _: "Value"
                        },
                        fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                            setTdAttribs(nTd, getColumnByRenderIndex(iCol), oData, iCol);
                        },
                        bSortable: sortAbleColumn
                    };

                    return result;
                };

            //if ($.fn.DataTable.isDataTable($alarmTemplateDataTable)) {
            //    $alarmTemplateDataTable.DataTable().destroy();
            //    $alarmTemplateDataTable.find("thead").empty();
            //    $alarmTemplateDataTable.find("tbody").empty(); // leaving dynamic footer
            //}
            //if (clearData === true) {
            //    alarmTemplateData = {};
            //}

            for (i = 0; i < columns.length; i++) {
                delete columns[i].renderedIndex;
                if (columns[i].display) {
                    columns[i].renderedIndex = renderedIndex++;
                    aoColumns.push(buildColumnObject(columns[i], i));
                }
            }

            if (aoColumns.length > 0) {
                $alarmTemplateDataTable.DataTable({
                    //api: true,
                    //dom: 'BRlfrtip',
                    //buttons: [
                    //    {
                    //        extend: 'collection',
                    //        text: 'Export',
                    //        buttons: [
                    //            {
                    //                extend: 'copyHtml5',
                    //                text: '<i class="fa fa-files-o"></i> Copy',
                    //                key: {
                    //                    altKey: true,
                    //                    key: '1'
                    //                }
                    //            },
                    //            {
                    //                extend: 'csvHtml5',
                    //                text: '<i class="fa fa-file-o"></i> CSV',
                    //                key: {
                    //                    altKey: true,
                    //                    key: '2'
                    //                }
                    //            },
                    //            {
                    //                extend: 'excelHtml5',
                    //                text: '<i class="fa fa-file-excel-o"></i> Excel',
                    //                key: {
                    //                    altKey: true,
                    //                    key: '3'
                    //                }
                    //            },
                    //            {
                    //                extend: 'pdfHtml5',
                    //                text: '<i class="fa fa-file-pdf-o"></i> PDF',
                    //                footer: true,
                    //                key: {
                    //                    altKey: true,
                    //                    key: '4'
                    //                },
                    //                customize: function (doc, thisButton) {
                    //                    // could insert TrendPlots here
                    //                }
                    //            }
                    //        ]
                    //    },
                    //    {
                    //        extend: 'print',
                    //        text: '<i class="fa fa-print"></i> Print',
                    //        key: {
                    //            altKey: true,
                    //            key: '5'
                    //        },
                    //        customize: function (win) {
                    //            var $documentBody = $(win.document.body),
                    //                $documentHead = $(win.document.head),
                    //                $table = $documentBody.find("table"),
                    //                classes,
                    //                hostAndProtocol = window.location.protocol + '//' + window.location.host;
                    //
                    //            $documentHead.find('link[rel=stylesheet]').remove();
                    //            $documentHead.append('<link rel="stylesheet" href="' + hostAndProtocol + '/css/reports/reportprinting.css" type="text/css" />');
                    //            $table.removeClass("table-striped dataTablePlaceHolder dataTable");
                    //            $table.addClass('table').addClass('table-sm');
                    //            $table.css("padding", "2px");
                    //            for (i = 0; i < columns.length; i++) {
                    //                classes = setColumnClasses(columns[i], i);
                    //                $table.find("td:nth-child(" + (i + 1) + ")").addClass(classes);
                    //            }
                    //        }
                    //    }
                    //],
                    data: alarmTemplateData,
                    columns: aoColumns,
                    headerCallback: function (thead, data, start, end, display) {
                        for (i = 0; i < aoColumns.length; i++) {
                            $(thead).find('th').eq(i).css("background-color", "rgb(234, 234, 234)");
                            $(thead).find('th').eq(i).addClass("strong");
                        }
                    },
                    order: [[1, "asc"]], // always default sort by 2nd column
                    scrollY: true,
                    scrollX: true,
                    scrollCollapse: true,
                    lengthChange: true,
                    lengthMenu: [[10, 18, 30, 50, 75, 100, -1], [10, 18, 30, 50, 75, 100, "All"]],
                    //bFiler: false,  // search box
                    pageLength: 18
                });
            }
        },
        renderAlarmTemplates = function () {
            if (alarmTemplateData) {
                configureDataTable(true, true, columnsArray);
                $alarmTemplateDataTable.DataTable().clear();
                $alarmTemplateDataTable.DataTable().rows.add(alarmTemplateData);
                $alarmTemplateDataTable.DataTable().draw();
            }
        },
        buildAlarmTemplate = function(row, idx) {
            var result = {
                _id: {
                    Value: row._id,
                    rawValue: row._id
                },
                msgCat: {
                    Value: getKeyBasedOnEnumValue(alarmTemplateCategories, row.msgCat),
                    rawValue: row.msgCat
                },
                msgType: {
                    Value: getKeyBasedOnEnumValue(alarmTemplateTypes, row.msgType),
                    rawValue: row.msgCat
                },
                msgName: {
                    Value: row.msgName,
                    rawValue: row.msgName
                },
                msgFormat: {
                    Value: row.msgFormat,
                    rawValue: row.msgFormat
                },
                msgTextColor: {
                    Value: "#" + row.msgTextColor,
                    rawValue: row.msgTextColor
                },
                msgBackColor: {
                    Value: "#" + row.msgBackColor,
                    rawValue: row.msgBackColor
                },
                isSystemMessage: {
                    Value: row.isSystemMessage,
                    rawValue: row.isSystemMessage
                }
            };
            return result;
        },
        setData = function(data) {
            var i;

            alarmTemplateData = [];
            for (i = 0; i < data.length; i++) {
                alarmTemplateData.push(buildAlarmTemplate(data[i], i));
            }
            self.alarmTemplates(alarmTemplateData);
            self.dirty(false);
            renderAlarmTemplates();
        },
        getData = function() {
            $.ajax({
                url: dataUrl
            }).done(function(data) {
                originalData = data;
                setData(data);
            });
        },
    //display status message on saving
        showMessage = function(text) {
            var message = text.charAt(0).toUpperCase() + text.substring(1);
            $controllerMessage.stop(true)
                .html(message)
                .show(0)
                .delay(2000)
                .fadeOut();
        };
    self.displayName = 'Alarm Templates';
    self.dirty = ko.observable(false);
    self.hasError = ko.observable(false);
    self.alarmTemplateName = ko.observable();
    self.alarmTemplateDesc = ko.observable();
    self.alarmTemplates = ko.observableArray();
    self.showEntryForm = ko.observable(false);
    dirs[NAME] = -1;
    dirs[ID] = -1;
    dirs.Description = -1;
    self.init = function() {
        $alarmTemplateContainer = $("#alarmTemplateContainer");
        $alarmTemplateDataTable = $alarmTemplateContainer.find(".dataTablePlaceHolder");
        getData();
    };
    //shows add controller form
    self.showForm = function() {
        self.resetForm();
        self.showEntryForm(true);
        $newAlarmTemplateName.focus();
    };
    self.resetForm = function() {
        $addAlarmTemplateForm.jqxValidator('hide');
        self.alarmTemplateName('');
        self.alarmTemplateDesc('');
        self.showEntryForm(false);
    };
    self.save = function() {
        var alarmTemplates = ko.toJS(self.alarmTemplates()),
            sanitizedAlarmTemplates = [],
            sanitize = function() {
                var c,
                    row,
                    obj;
                for (c = 0; c < alarmTemplates.length; c++) {
                    row = alarmTemplates[c];
                    obj = {};
                    obj[ID] = row[ID];
                    obj[NAME] = row[NAME];
                    obj.Description = row.Description;
                    obj.isUser = row.isUser;
                    if(!!row[NAME])
                        sanitizedAlarmTemplates.push(obj);
                }
            };
        sanitize();
        $.ajax({
            url: saveUrl,
            data: {
                Entries: sanitizedAlarmTemplates
            },
            dataType: 'json',
            type: 'post'
        }).done(function(response) {
            self.dirty(false);
            originalData = sanitizedAlarmTemplates;
            showMessage('Save alarmTemplates: ' + response.message);
        });
    };
    self.cancel = function() {
        setData(originalData);
    };
};

// Weather screen -------------------------------------------------------------
var weatherViewModel = function() {
    var self = this,
        dataUrl = '/api/system/weather',
        saveUrl = '/api/system/updateWeather',
        workspaceManager = window.opener && window.opener.workspaceManager,
        openWindow =  workspaceManager && window.opener.workspaceManager.openWindowPositioned,
        activePointStatus = workspaceManager && workspaceManager.config.Enums["Point Statuses"].Active.enum,
        originalData,
        openPointSelector = function (callback) {
            var windowRef,
                pointSelectedCallback = function (pid, name, type) {
                    if (!!pid) {
                        callback(pid, name, type);
                    }
                },
                windowOpenedCallback = function () {
                    windowRef.pointLookup.MODE = 'select';
                    windowRef.pointLookup.init(pointSelectedCallback);
                };

            windowRef = openWindow('/pointLookup', 'Select Point', '', '', 'Select Weather Point', {
                callback: windowOpenedCallback,
                width: 1000
            });
        },
        setData = function (data) {
            var newData = [];

            if (Array.isArray(data)) {
                data.forEach(function (weatherPoint) {
                    newData.push({
                        title: weatherPoint.title,
                        point: ko.observable(weatherPoint.point)
                    });
                });
            } else {
                for (var key in data) {
                    newData.push({
                        title: key,
                        point: ko.observable(data[key])
                    });
                }
            }
            self.weatherPoints(newData);
            self.dirty(false);
        },
        getData = function() {
            $.ajax({
                url: dataUrl
            }).done(function (data) {
                originalData = data;
                setData(data);
            });
        },
        getDataToSave = function () {
            var data = {};
            self.weatherPoints().forEach(function (weatherPoint) {
                var point = weatherPoint.point(),
                    upi = (point && point._id) || null;
                data[weatherPoint.title] = upi;
            });
            return data;
        },
        saveData = function () {
            // Create a snapshot in case the user modifies the data before save is completed
            var snapshot = ko.toJS(self.weatherPoints);
            // Save the data
            $.ajax({
                url: saveUrl,
                data: getDataToSave(),
                dataType: 'json',
                type: 'post'
            }).done(function (response) {
                var err;
                console.log(response);
                if (response.message && response.message === 'success') {
                    originalData = snapshot;
                    self.dirty(false);
                } else {
                    err = response.err || 'Unknown error.';
                    alert("We couldn't save the weather section for the following reason: " + err);
                }
            });
        };

    self.displayName = 'Weather';

    self.dirty = ko.observable(false);

    self.hasError = ko.observable(false);

    self.weatherPoints = ko.observableArray([]);

    self.init = function () {
        getData();
    };

    self.save = function () {
        saveData();
    };

    self.cancel = function () {
        setData(originalData);
    };

    self.removePointRef = function (data) {
        data.point(null);
        self.dirty(true);
    };

    self.editPointRef = function (data) {
        openPointSelector(function(upi, name, pointType) {
            data.point({
                _id: upi,
                _pStatus: activePointStatus,
                Name: name,
                'Point Type': {
                    Value: pointType
                }
            });
            self.dirty(true);
        });
    };

    self.openPointRef = function (data) {
        var point = data.point(),
            upi = point._id,
            pointType = point['Point Type'].Value,
            pointTypesUtility = workspaceManager && workspaceManager.config.Utility.pointTypes,
            endPoint = pointTypesUtility.getUIEndpoint(pointType, upi),
            options = {
                width: 850,
                height: 600
            };
        openWindow(endPoint.review.url, point.Name, pointType, endPoint.review.target, upi, options);
    };
};

// Notifications screen -------------------------------------------------------
var notificationsViewModel = function() {
    var _webendpoint = window.location.protocol + '//' + window.location.host,
        _webendpointURI = _webendpoint + '/api/security/',
        _idCounter = 0,
        $scheduleCalendar = $('#scheduleCalendar'),
        makeId = function () {
            _idCounter++;
            return 'nid_' + _idCounter;
        },
        Member = function (data, dt) {
            var ret = {
                    id: data._id,
                    firstName: data['First Name'].Value,
                    lastName: data['Last Name'].Value,
                    contactInfo: data['Contact Info'].Value,
                    securityGroup: null,
                    alerts: data.alerts,
                    notificationsEnabled: data.notificationsEnabled,
                    notificationOptions: data.notificationOptions || self.getTemplate('notificationOptions')
                },
                processAlert = function (alert, idx) {
                    if (alert.delay === undefined) {
                        alert.delay = idx === 0 ? 0 : 1;
                    }
                };

            for (var alertType in data.alerts) {
                data.alerts[alertType].forEach(processAlert);
            }

            return ret;
        },
        self = {
            displayName: 'Notifications',
            dirty: ko.observable(false),
            hasError: ko.observable(false),
            $modal: $('#notificationsEditMemberModal'),
            iconLookup: {
                SMS: 'comment',
                Email: 'envelope-o',
                Voice: 'phone'
            },
            alertTypeLookup: {
                SMS: 'text',
                Email: 'email',
                Voice: 'call'
            },
            templates: {
                'schedule': {
                    holidays: false,
                    days: [],
                    allDay: false,
                    startTime: null,
                    endTime: null
                },
                'scheduleLayer': {
                    alertConfigs: [],
                    schedules: []
                },
                'notificationOptions': {
                    Emergency: false,
                    Critical: false,
                    Urgent: false,
                    notifyOnAck: false
                },
                'alertNotification': {
                    Value: null,
                    Type: null,
                    delay: 1
                },
                'alertConfig': {
                    id: 0,
                    isOnCall: false,
                    name: '',
                    groups: [],
                    rotateConfig: {}
                },
                'group': {
                    active: false,
                    alertDelay: 1,
                    id: 0,
                    name: '',
                    repeatConfig: {},
                    escalations: []
                },
                'escalation': {
                    alertStyle: 'Everyone Sequenced',
                    escalationDelay: 5,
                    id: 0,
                    memberAlertDelay: 5,
                    members: [],
                    repeatConfig: {},
                    rotateConfig: {}
                },
                'repeatConfig': {
                    enabled: false,
                    repeatCount: 0,
                    repeatDelay: 5
                },
                'rotateConfig': {
                    day: 'Monday',
                    enabled: false,
                    scale: 1,
                    time: 800
                },
                'member': {
                    firstName: '',
                    id: 0,
                    lastName: '',
                    securityGroup: ''
                },
                'policy': {
                    _id: 1,
                    _new: true,
                    name: '',
                    members: [],
                    memberGroups: [],
                    enabled: true,
                    _currAlertID: 1,
                    _currGroupID: 1,
                    _currEscalationID: 1,
                    alertConfigs: [],
                    scheduleLayers: [],
                    threads: []
                }
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

            getTemplate: function (template) {
                var tpl = $.extend(true, {}, self.templates[template]),
                    copyProperties = ['repeatConfig', 'rotateConfig'],
                    idProperties = {
                        alertConfig: '_currAlertID',
                        group: '_currGroupID',
                        escalation: '_currEscalationID'
                    },
                    newID,
                    idProperty;

                copyProperties.forEach(function (property) {
                    if (tpl.hasOwnProperty(property)) {
                        tpl[property] = self.getTemplate(property);
                    }
                });

                if (idProperties[template]) {
                    idProperty = self.bindings.currPolicy[idProperties[template]];

                    newID = idProperty() + 1;
                    idProperty(newID);

                    tpl.id = newID;
                }

                return tpl;
            },
            policies: []
        };

    self.init = function (reset) {
        var columns = [{
                data: 'firstName()',
                title: 'First Name',
                className: 'firstName',
                render: function (data, type, full, meta) {
                    return '<a href="#">' + data + '</a>';
                }
            }, {
                data: 'lastName()',
                title: 'Last Name',
                className: 'lastName'
            }, {
                data: 'securityGroup()',
                title: 'Member By Way Of Security Group',
                className: 'securityGroup'
            }],
            initMemberDataTable = function () {
                var members = self.bindings.currPolicy.members,
                    $memberList = $('#memberList');

                if ($.fn.DataTable.isDataTable($memberList)) {
                    $memberList.DataTable().destroy();
                } else {
                    self.memberDT = $memberList.DataTable({
                        columns: columns,
                        paging: false,
                        searching: false,
                        bInfo: false
                    });
                }

                $memberList.on('click', '.firstName', function (event) {
                    var rowIdx = self.memberDT.cell(this).index().row,
                        member = self.memberDT.rows(rowIdx).data()[0];

                    self.editMember(member);

                    event.preventDefault();
                });

                members.subscribe(function (members) {
                    self.memberDT.clear();
                    self.memberDT.rows.add(members);
                    self.memberDT.draw();
                });
            };

        initMemberDataTable();

        self.$tabs = $('.notificationsContent').on('click', '.nav a', function (e) {
            e.preventDefault();

            $(this).tab('show');

            if ($(this).attr('href').toLowerCase().match('schedule')) {
                $scheduleCalendar.fullCalendar('render');
                self.updateScheduleEvents();
            }
        });

        $scheduleCalendar.fullCalendar({
            schedulerLicenseKey: '0890776600-fcs-1460400855',
            eventClick: function (calEvent, jsEvent, view) {
                console.log(calEvent);
                jsEvent.preventDefault();
            },
            header: {
                left: '',//prev,next',
                center: '',//title',
                right: ''//agendaWeek,agendaDay'
            },
            // titleFormat: '[Schedule Preview]',
            // eventColor: '#7156FB',
            allDaySlot: false,
            defaultDate:  moment().format('YYYY-MM-DD'),//'2016-01-12',
            defaultView: 'agendaDay',
            editable: false,
            eventLimit: false, // allow "more" link when too many events
            height: 575,
            resources: [{
                id: 'sun',
                title: 'Sunday'
            }, {
                id: 'mon',
                title: 'Monday'
            }, {
                id: 'tues',
                title: 'Tuesday'
            }, {
                id: 'wed',
                title: 'Wednesday'
            }, {
                id: 'thur',
                title: 'Thursday'
            }, {
                id: 'fri',
                title: 'Friday'
            }, {
                id: 'sat',
                title: 'Saturday'
            }, {
                id: 'Holidays',
                title: 'Holidays'
            }],
            events: [{
                id: 1,
                resourceId: 'Sunday',
                start: '2016-01-12T08:00:00',
                end: '2016-01-12T17:00:00'
            }, {
                id: 2,
                resourceId: 'Monday',
                start: '2016-01-12T08:00:00',
                end: '2016-01-12T17:00:00'
            }, {
                id: 3,
                resourceId: 'Holidays',
                start: '2016-01-12T08:00:00',
                end: '2016-01-12T17:00:00'
            }],
            slotDuration: '01:00:00',
            slotLabelInterval: '02:00:00'
            // events: [
            //     // {
            //     //     title: 'All Day Event',
            //     //     start: '2016-01-01'
            //     // },
            //     // {
            //     //     title: 'Long Event',
            //     //     start: '2016-01-07',
            //     //     end: '2016-01-10'
            //     // },
            //     {
            //         id: 999,
            //         start: '2016-01-10T08:00:00',
            //         end: '2016-01-10T17:00:00'
            //     },
            //     {
            //         id: 999,
            //         start: '2016-01-11T08:00:00',
            //         end: '2016-01-11T17:00:00'
            //     },
            //     {
            //         id: 999,
            //         start: '2016-01-12T08:00:00',
            //         end: '2016-01-12T17:00:00'
            //     },
            //     {
            //         id: 999,
            //         start: '2016-01-13T08:00:00',
            //         end: '2016-01-13T17:00:00'
            //     },
            //     {
            //         id: 999,
            //         start: '2016-01-14T08:00:00',
            //         end: '2016-01-14T17:00:00'
            //     },
            //     {
            //         id: 999,
            //         start: '2016-01-15T08:00:00',
            //         end: '2016-01-15T17:00:00'
            //     },
            //     {
            //         id: 999,
            //         start: '2016-01-16T08:00:00',
            //         end: '2016-01-16T17:00:00'
            //     }
            // ]
        });

        if (!reset) {
            $.getJSON('/api/policies/get').done(function (response) {
                self._rawPolicies = response;
                self.buildPolicies(response);
            });
        } else {
            self.buildPolicies(self._rawPolicies);
        }
    };

    self.updateScheduleEvents = function () {
        var colors = ['#FDA46E', '#8666FB'],//, '#7DC551'],
            datePrefix = moment().format('YYYY-MM-DDT'),
            tomorrowPrefix = moment().add(1, 'd').format('YYYY-MM-DDT'),
            events = [],
            convertTime = function (time) {
                var hr = time / 100,
                    min = time % 100;

                return ('0' + hr).slice(-2) + ':' + ('0' + min).slice(-2) + ':00';
            },
            createEvents = function (schedule, color, title) {
                var start = datePrefix + convertTime(schedule.startTime || 0),
                    end = convertTime(schedule.endTime || 0),
                    _events = [],
                    loops = false;

                if (schedule.allDay) {
                    start = datePrefix + convertTime(0);
                    end = tomorrowPrefix + convertTime(0);
                } else {
                    if (schedule.endTime === 0 || schedule.endTime === null) {
                        end = tomorrowPrefix + end;
                    } else {
                        end = datePrefix + end;
                    }

                    if (schedule.endTime !== undefined && schedule.startTime !== undefined && schedule.startTime > schedule.endTime) {
                        loops = true;
                    }
                }

                self.forEachArray(schedule.days, function (day) {
                    if (loops) {
                        if (schedule.endTime !== 0) {
                            _events.push({
                                id: makeId(),
                                start: datePrefix + convertTime(0),
                                end: end,
                                resourceId: day,
                                backgroundColor: color,
                                borderColor: '#666666',
                                title: title
                            });
                        }

                        _events.push({
                            id: makeId(),
                            start: start,
                            end: tomorrowPrefix + convertTime(0),
                            resourceId: day,
                            backgroundColor: color,
                            borderColor: '#666666',
                            title: title
                        });

                    } else {
                        _events.push({
                            id: makeId(),
                            start: start,
                            end: end,
                            resourceId: day,
                            backgroundColor: color,
                            borderColor: '#666666',
                            title: title
                        });
                    }
                });

                return _events;
            };

        self.forEachArray(self.bindings.currPolicy.scheduleLayers(), function (layer, idx) {
            self.forEachArray(ko.toJS(layer.schedules), function (schedule) {
                events = events.concat(createEvents(schedule, colors[idx % 2], 'Layer ' + (idx + 1)));
            });
        });

        $scheduleCalendar.fullCalendar('removeEvents');
        $scheduleCalendar.fullCalendar('addEventSource', events);
    };

    self.translateMember = function (id) {
        return self.userLookup[id];
    };

    self.translateMembers = function (arr) {
        var c,
            len = arr.length,
            ret = [];

        for(c=0; c<len; c++) {
            ret.push(self.translateMember(arr[c]));
        }

        return ret;
    };

    self.unTranslateMembers = function (policy) {
        var rawPolicy = ko.toJS(policy);
        self.forEachArray(rawPolicy.members, function (member, idx) {
            rawPolicy.members[idx] = member.id;
        });

        return rawPolicy;
    };

    self.buildPolicy = function (policy) {
        policy.members = self.translateMembers(policy.members);


        self.forEachArray(policy.alertConfigs, function (alertConfig) {
            var newGroups = [];
            alertConfig.groups = alertConfig.groups || [];
            self.forEachArray(alertConfig.groups, function (group) {
                group.escalations = group.escalations || [];
                self.forEachArray(group.escalations, function (escalation) {
                    escalation.members = escalation.members || [];
                });
                if (group.active) {
                    newGroups.unshift(group);
                } else {
                    newGroups.push(group);
                }
            });
            alertConfig.groups = newGroups;
        });

    };

    self.buildPolicies = function (policies) {
        var c,
            len = policies.length;

        self.bindings.policyList.removeAll();

        for(c=0; c<len; c++) {
            self.buildPolicy(policies[c]);
            self.bindings.policyList.push(ko.viewmodel.fromModel(policies[c]));
        }
    };

    self.prepPolicyForSave = function (policy) {
        self.forEachArray(policy.alertConfigs, function (config) {
            var foundActive = false;

            self.forEachArray(config.groups, function (group, idx) {
                if (group.active) {
                    foundActive = true;
                }
            });

            if (!foundActive && config.groups.length > 0) {
                config.groups[0].active = true;
            }
        });
    };

    self.cancel = function () {
        self.dirty(false);
        self.bindings.home();
        self.init(true);
    };

    self.save = function () {
        self.forEachArray(self.bindings.policyList(), function (policy, idx) {
            var data = self.unTranslateMembers(policy);

            self.prepPolicyForSave(data);

            $.ajax({
                url: '/api/policies/save',
                data: JSON.stringify(data),
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json'
            }).done(function (response) {
                if (policy._new && policy._new() === true) {
                    delete policy._new;
                    if (policy._id() === self.bindings.currPolicy._id()) {
                        self.bindings.currPolicy._id(response.id);
                    }
                    policy._id(response.id);
                }
                console.log('Saved policy', policy.name());
            });
        });

        self.dirty(false);
    };

    self.clearEdits = function (resetAll) {
        var binding;

        for (binding in self.bindings) {
            if (binding.match('isEditing')) {
                if (binding !== 'isEditingPolicy' || resetAll) {
                    self.bindings[binding](false);
                }
            }
        }
    };

    self.editMember = function (member) {
        self._originalMember = ko.toJS(member);
        self.bindings.currMember(member);
        self.bindings.isEditingMember(true);
    };

    self.editMembers = function (primary, secondary) {
        var c,
            cc,
            len = secondary.length,
            plen = primary.length,
            found = false;

        for(c=0; c<plen; c++) {
            primary[c].selected = false;
            found = false;

            for(cc=0; cc<len && !found; cc++) {
                 if (primary[c].id === secondary[cc].id) {
                    primary[c].selected = true;
                    found = true;
                }
            }
        }

        self.bindings.primaryMemberList(primary);
        self.bindings.chosenMembers(secondary);
        self.$modal.modal('show');
    };

    self.updateAlertConfigMembers = function () {
        var arr = ko.toJS(self.bindings.primaryMemberList()),
            newMembers = [];

        arr.forEach(function (member) {
            if (member.selected) {
                newMembers.push(member.id);
            }
        });

        ko.viewmodel.updateFromModel(self._currEscalation.members, newMembers);
    };

    self.updatePolicyMembers = function () {
        var arr = ko.toJS(self.bindings.primaryMemberList()),
            newMembers = [];

        arr.forEach(function (member) {
            if (member.selected) {
                newMembers.push(member);
            }
        });

        ko.viewmodel.updateFromModel(self.bindings.currPolicy.members, newMembers);
        self.forEachArray(self.bindings.policyList(), function (policy) {
            if (policy._id() === self.bindings.currPolicy._id()) {
                policy.members(newMembers);
            }
        });
    };

    self.getContact = function (alert) {
        var contact,
            rawAlert = ko.toJS(alert),
            value = rawAlert.Value,
            type = rawAlert.Type;

        self.forEachArray(self.bindings.currMember().contactInfo(), function (contactInfo) {
            if (contactInfo.Value() === value && contactInfo.Type() === type) {
                contact = contactInfo;
                return false;
            }
        });

        return contact;
    };

    self.savePolicy = function () {
        self.forEachArray(self.bindings.policyList(), function (policy, idx) {
            if (policy._id() === self.bindings.currPolicy._id()) {
                ko.viewmodel.updateFromModel(self.bindings.policyList()[idx], ko.toJS(self.bindings.currPolicy));
            }
        });

        self.dirty(true);
    };

    self.saveUser = function (user) {
        var me = this,
            data = {
                userid: user.id,
                'Update Data': {
                    alerts: user.alerts,
                    notificationOptions: user.notificationOptions,
                    notificationsEnabled: user.notificationsEnabled
                }
            },
            processUser = function (alert, idx, list) {
                list[idx] = ko.toJS(me.getContact(alert));
                list[idx].delay = alert.delay;
            };

        for (var alertType in user.alerts) {
            user.alerts[alertType].forEach(processUser);
        }

        $.ajax({
            url: '/api/security/users/updateuser',
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (returnData) {
                if (returnData.err) {
                    console.log('Error saving user', returnData.err);
                } else {
                    console.log('Saved user');
                }
            }
        });
    };

    self.checkAlertConfigNames = function (id, name, configs) {
        var duplicate = false;

        self.forEachArray(configs, function (config) {
            if (config.name() === name && (id !== undefined && id !== config.id())) {
                duplicate = true;
                return false;
            }
        });

        if (duplicate) {
            $.toast({
                heading: 'Error',
                text: 'Duplicate Alert Config Name',
                position: 'top-center',
                stack: false
            });
        }

        return duplicate;
    };

    self.bindings = {
        currPolicy: ko.viewmodel.fromModel(self.templates.policy),
        currAlertConfig: ko.observable(),
        policyList: ko.observableArray(),

        alertStyles: [{
            text: 'First Responder Only',
            value: 'FirstResponder'
        }, {
            text: 'Everyone Sequenced',
            value: 'Sequenced'
        }, {
            text: 'Everyone at the same time',
            value: 'Everyone'
        }],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        shortDays: ['mon', 'tues', 'wed', 'thur', 'fri', 'sat', 'sun'],

        isEditingNewPolicy: ko.observable(false),
        isEditingNewConfiguration: ko.observable(false),
        isEditingPolicy: ko.observable(false),
        isEditingPolicyName: ko.observable(false),
        isEditingPolicyEnabled: ko.observable(false),
        isEditingAlertConfig: ko.observable(false),
        isEditingMember: ko.observable(false),
        isEditingAlertNotifications: ko.observable(false),
        isEditingSchedule: ko.observable(false),

        newPolicyName: ko.observable(),
        newConfigurationName: ko.observable(),
        currPolicyName: ko.observable(),
        currPolicyEnabled: ko.observable(),
        currMember: ko.observable(),

        primaryMemberList: ko.observableArray(),
        chosenMembers: ko.observableArray(),

        dayMonday: ko.observable(false),
        dayTuesday: ko.observable(false),
        dayWednesday: ko.observable(false),
        dayThursday: ko.observable(false),
        dayFriday: ko.observable(false),
        daySaturday: ko.observable(false),
        daySunday: ko.observable(false),
        dayHolidays: ko.observable(false),

        savePolicy: function () {
            self.savePolicy();
        },

        updateScheduleEvents: function () {
            self.updateScheduleEvents();

            return true;
        },

        editDays: function (schedule) {
            self.forEachArray(self.bindings.days, function (day, idx) {
                self.bindings['day' + day](false);
            });

            self.forEachArray(schedule.days(), function (day) {
                var idx = self.bindings.shortDays.indexOf(day);

                if (idx !== -1) {
                    self.bindings['day' + self.bindings.days[idx]](true);
                }
            });

            self.bindings.dayHolidays(schedule.holidays());

            self._currSchedule = schedule;

            $('#notificationsEditDaysModal').modal('show');
        },

        updateDays: function () {
            var ret = [];
            self.forEachArray(self.bindings.days, function (day, idx) {
                if (self.bindings['day' + day]()) {
                    ret.push(self.bindings.shortDays[idx]);
                }
            });

            self._currSchedule.holidays(self.bindings.dayHolidays());

            if (self.bindings.dayHolidays()) {
                ret.push('Holidays');
            }

            self._currSchedule.days(ret);

            $('#notificationsEditDaysModal').modal('hide');
            self.updateScheduleEvents();
            self.savePolicy();
        },

        getAlertStyleText: function (value) {
            var ret;
            self.forEachArray(self.bindings.alertStyles, function (style) {
                if (style.value === value) {
                    ret = style.text;
                }
            });

            return ret;
        },

        getUserName: function (id) {
            var user = self.translateMember(id);

            return user.firstName + ' ' + user.lastName;
        },

        addAlertConfig: function (layer) {
            layer.$parent.alertConfigs.push(layer.$data.id());
        },

        deleteAlertConfig: function (config) {
            self.bindings.currPolicy.alertConfigs.remove(function (item) {
                return item.id() === config.id();
            });
            self.savePolicy();
            self.dirty(true);
            //needs validation
        },

        convertTime: function (scheduleTime) {
            var ret,
                fullTime = scheduleTime(),
                hr = fullTime/100,
                ampm = hr >= 12 ? 'PM' : 'AM';

            if (hr > 12) {
                hr -= 12;
            }

            if (hr === 0) {
                hr = 12;
            }

            return hr + ' ' + ampm;
        },

        convertDate: function (scheduleDays) {
            var _days = scheduleDays().join(';'),
                days = [],
                weekdays = 'mon;tues;wed;thur;fri',
                weekends = 'sat;sun',
                special = false;

            if (_days.match(weekdays)) {
                days.push('Weekdays');
                _days = _days.replace(weekdays, '');
            }

            if (_days.match(weekends)) {
                days.push('Weekends');
                _days = _days.replace(weekends, '');
            }

            if (_days.match('Holidays')) {
                days.push('Holidays');
                _days = _days.replace('Holidays', '');
            }

            if (_days.length > 0) {
                days = days.concat(_days.split(';'));
            } else {
                if (days.length === 0) {
                    days.push('None');
                }
            }

            days = days.filter(function (el, idx, arr) {
                return el !== '';
            });

            days.forEach(function (day, idx, arr) {
                arr[idx] = day.charAt(0).toUpperCase() + day.slice(1);
            });

            return days.join(',');
        },

        deleteSchedule: function (context) {
            var scheduleIndex = context.$index(),
                layerIndex = context.$parentContext.$index();

            self.bindings.currPolicy.scheduleLayers()[layerIndex].schedules.splice(scheduleIndex, 1);
            self.dirty(true);
            self.updateScheduleEvents();
        },

        addSchedule: function (scheduleLayer) {
            scheduleLayer.schedules.push(ko.viewmodel.fromModel(self.getTemplate('schedule')));
            self.updateScheduleEvents();
        },

        addScheduleLayer: function () {
            self.bindings.currPolicy.scheduleLayers.push(ko.viewmodel.fromModel(self.getTemplate('scheduleLayer')));
            self.updateScheduleEvents();
            self.savePolicy();
        },

        deleteScheduleLayer: function (layer, idx) {
            layer.scheduleLayers.splice(idx(), 1);
            self.dirty(true);
            self.updateScheduleEvents();
        },

        editSchedule: function () {
            self.bindings.isEditingSchedule(true);
        },

        cancelEditSchedule: function () {
            ko.viewmodel.updateFromModel(self.bindings.currPolicy.scheduleLayers, self._currPolicy.scheduleLayers);
            self.bindings.isEditingSchedule(false);
            self.updateScheduleEvents();
        },

        saveSchedule: function () {
            self._currPolicy = ko.toJS(self.bindings.currPolicy);
            self.bindings.isEditingSchedule(false);

            self.savePolicy();
        },

        editAlertConfigMembers: function (escalation) {
            self.memberCb = self.updateAlertConfigMembers;
            self._currEscalation = escalation;
            self.editMembers(ko.toJS(self.bindings.currPolicy.members()), self.translateMembers(escalation.members()));
        },

        editPolicyMembers: function () {
            self.memberCb = self.updatePolicyMembers;
            self.editMembers(self.users, ko.toJS(self.bindings.currPolicy.members()));
        },

        getAlertIcon: function (type) {
            return 'fa-' + self.iconLookup[type()];
        },

        getAlertType: function (contactInfo, type) {
            var contact = self.getContact({Value: contactInfo(), Type: type()});

            return contact.Type;
        },

        addNewAlert: function (data) {
            var alert = self.getTemplate('alertNotification'),
                firstContact = self.bindings.currMember().contactInfo()[0],
                alerts = self.bindings.currMember().alerts[data.name];

            alert.Value = firstContact.Value();
            alert.Type = firstContact.Type();

            if (alerts().length === 0) {
                alert.delay = 0;
            }

            self.bindings.currMember().alerts[data.name].push(ko.viewmodel.fromModel(alert));
        },

        deleteAlert: function (alertType, idx) {
            var _idx = idx(),
                row;

            alertType.alerts.splice(_idx, 1);

            if (_idx === 0) {//deleted first one
                row = alertType.alerts()[0];
                if (row) {
                    row.delay(0);
                }
            }
        },

        getContactString: function (contact) {
            var type = self.alertTypeLookup[contact.Type()],
                val = contact.Value(),
                name = contact.Name();

            return [type, name, 'at', val].join(' ');
        },

        getContactAlertString: function (alert) {
            var contact = self.getContact(alert);

            return self.bindings.getContactString(contact);
        },

        editAlertNotifications: function () {
            self.bindings.isEditingAlertNotifications(true);
        },

        cancelEditAlertNotifications: function () {
            self.bindings.currMember(ko.viewmodel.fromModel(self._originalMember));
            self.bindings.isEditingAlertNotifications(false);
            ko.viewmodel.updateFromModel(self.bindings.currMember().alerts, self._originalMember.alerts);
        },

        saveAlertNotifications: function (user) {
            self.bindings.isEditingAlertNotifications(false);
            self.saveUser(ko.toJS(user));

            self.savePolicy();
        },

        updateMembers: function () {
            if (self.memberCb) {
                self.memberCb();
                self.memberCb = null;
                self.savePolicy();
            }
            self.$modal.modal('hide');
        },

        doDeletePolicy: function (id, cb) {
            $.ajax({
                url: '/api/policies/delete',
                data: {
                    _id: id
                },
                type: 'POST',
                dataType: 'json'
            }).done(function (response) {
                console.log('Deleted');
                cb();
            });
        },

        deletePolicy: function (policy) {
            self.forEachArray(self.bindings.policyList(), function (boundPolicy, idx) {
                if (boundPolicy._id() === policy._id()) {
                    if (policy._new && policy._new()) {
                        self.bindings.policyList.splice(idx, 1);
                    } else {
                        self.bindings.doDeletePolicy(policy._id(), function () {
                            self.bindings.policyList.splice(idx, 1);
                        });
                    }
                }
            });
        },
        selectPolicy: function (policy) {
            var rawPolicy = ko.toJS(policy);
            self.bindings.currAlertConfig(null);
            self.bindings.isEditingMember(false);
            self._currPolicy = ko.toJS(policy);
            ko.viewmodel.updateFromModel(self.bindings.currPolicy, rawPolicy);
            self.bindings.isEditingPolicy(true);
        },
        addPolicy: function () {
            self.bindings.newPolicyName('');
            self.bindings.isEditingNewPolicy(true);
        },
        doAddNewPolicy: function () {
            var newPolicy = self.getTemplate('policy'),
                name = self.bindings.newPolicyName();

            // validation
            newPolicy.name = name;
            self.bindings.policyList.push(ko.viewmodel.fromModel(newPolicy));
            self.bindings.isEditingNewPolicy(false);
            ko.viewmodel.updateFromModel(self.bindings.currPolicy, newPolicy);
            self.bindings.selectPolicy(newPolicy);
            self.dirty(true);
        },
        editPolicyName: function () {
            self.bindings.currPolicyName(self.bindings.currPolicy.name());
            self.bindings.isEditingPolicyName(true);
        },
        savePolicyName: function () {
            self.bindings.currPolicy.name(self.bindings.currPolicyName());
            self.bindings.isEditingPolicyName(false);
            self.savePolicy();
        },
        cancelPolicyNameEdit: function () {
            self.bindings.isEditingPolicyName(false);
        },

        cancelEditMember: function () {
            self.bindings.currMember(null);
            self.bindings.isEditingMember(false);
        },

        editPolicyEnabled: function () {
            self.bindings.currPolicyEnabled(self.bindings.currPolicy.enabled());
            self.bindings.isEditingPolicyEnabled(true);
        },
        savePolicyEnabled: function () {
            self.bindings.currPolicy.enabled(!self.bindings.currPolicyEnabled());
            self.bindings.isEditingPolicyEnabled(false);
            self.savePolicy();
        },
        cancelPolicyEnabledEdit: function () {
            self.bindings.isEditingPolicyEnabled(false);
        },

        addConfiguration: function () {
            self.bindings.newConfigurationName('');
            self.bindings.isEditingNewConfiguration(true);
        },
        doAddNewConfiguration: function () {
            var configurationTemplate = self.getTemplate('alertConfig'),
                duplicate;

            duplicate = self.checkAlertConfigNames(null, self.bindings.newConfigurationName(), self.bindings.currPolicy.alertConfigs());

            if (!duplicate) {
                configurationTemplate.name = self.bindings.newConfigurationName();
                self.bindings.currPolicy.alertConfigs.push(ko.viewmodel.fromModel(configurationTemplate));
                self.bindings.currAlertConfig(ko.viewmodel.fromModel(ko.toJS(self.bindings.currPolicy.alertConfigs.slice(-1)[0])));
                self.bindings.isEditingNewConfiguration(false);
                self.bindings.isEditingAlertConfig(true);
                self.savePolicy();
            }
        },

        editAlertConfig: function (alertConfig) {
            self.bindings.currAlertConfig(alertConfig);
        },
        cancelEditAlertConfig: function () {
            self.bindings.cancelDoEditAlertConfig();
            self.bindings.currAlertConfig(null);
        },

        doEditAlertConfig: function () {
            self._originalAlertConfig = ko.toJS(self.bindings.currAlertConfig);

            self.bindings.isEditingAlertConfig(true);
        },
        cancelDoEditAlertConfig: function () {
            ko.viewmodel.updateFromModel(self.bindings.currAlertConfig, self._originalAlertConfig);
            self.bindings.isEditingAlertConfig(false);
        },
        saveEditAlertConfig: function () {
            var id = self.bindings.currAlertConfig().id(),
                duplicate;

            duplicate = self.checkAlertConfigNames(self.bindings.currAlertConfig().id(), self.bindings.currAlertConfig().name(), self.bindings.currPolicy.alertConfigs());

            if (!duplicate) {
                self.forEachArray(self.bindings.currPolicy.alertConfigs(), function (config) {
                    if (config.id() === id) {
                        ko.viewmodel.updateFromModel(config, ko.toJS(self.bindings.currAlertConfig));
                        // ko.viewmodel.updateFromModel(self.bindings.currPolicy.alertConfigs)
                        return false;
                    }
                });

                self._originalAlertConfig = ko.toJS(self.bindings.currAlertConfig);

                self.savePolicy();

                self.bindings.isEditingAlertConfig(false);
            }
        },

        addAlertGroup: function () {
            self.bindings.currAlertConfig().groups.push(ko.viewmodel.fromModel(self.getTemplate('group')));
        },

        deleteAlertGroup: function (alertConfig, idx) {
            alertConfig.groups.splice(idx(), 1);
            self.dirty(true);
        },

        addEscalation: function (group) {
            group.escalations.push(ko.viewmodel.fromModel(self.getTemplate('escalation')));
        },

        deleteEscalation: function (group, idx) {
            group.escalations.splice(idx(), 1);
        },

        home: function () {
            // self.forEachArray(self.bindings.policyList(), function (policy, idx) {
            //     if (policy._id === self.bindings.currPolicy._id()) {
            //         ko.viewmodel.updateFromModel(self.bindings.policyList()[idx], ko.toJS(self.bindings.currPolicy));
            //     }
            // });
            self.clearEdits(true);
            // ko.viewmodel.updateFromModel(self.bindings.currPolicy, self.templates.policy);// check for unsaved changes?
        }
    };

    $.ajax({
        url: _webendpointURI + 'groups/getallgroups',
        contentType: 'application/json',
        dataType: 'json',
        type: 'post'
    }).done(function (data){
        self.groups = data;
    });

    $.ajax({
        url: _webendpointURI + 'users/getallusers',
        contentType: 'application/json',
        dataType: 'json',
        type: 'post'
    }).done(function (data){
        var c,
            users = data.Users,
            len = users.length,
            member;

        self.users = [];
        self.userLookup = {};

        for (c=0; c<len; c++) {
            member = new Member(users[c]);
            self.users.push(member);
            self.userLookup[member.id] = member;
        }
    });

    $('body').on('shown.bs.dropdown', '.daySelect input', function (e) {

    });

    ko.bindingHandlers.alertConfigName = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $element = $(element),
                configID = valueAccessor(),
                alertConfig,
                alertConfigs = bindingContext.$parents[1].alertConfigs(),
                c,
                len = alertConfigs.length,
                done = false;

            for(c=0; c<len && !done; c++) {
                if (alertConfigs[c].id() === configID) {
                    alertConfig = alertConfigs[c];
                    done = true;
                }
            }

            $element.html(alertConfig.name());
        }
    };

    ko.bindingHandlers.timepicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            //initialize timepicker with some optional options
            var observable = valueAccessor(),
                options = {
                    doneText: 'Done',
                    autoclose: true,
                    afterDone: function () {
                        var time = $(element).val().split(':'),
                            hr = parseInt(time[0], 10),
                            min = parseInt(time[1], 10);
                        observable(hr * 100 + min);
                        context.$parents[2].updateScheduleEvents();
                        context.$parents[2].savePolicy();
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


    return self;
};

// About Infoscan -------------------------------------------------------------
/*
var aboutInfoScanViewModel = function() {
    this.displayName = 'About InfoScan';

    this.dirty = ko.observable(false);

    this.hasError = ko.observable(false);
};

sysPrefsViewModel.registerSection(aboutInfoScanViewModel);
*/

// Shortcut for $(document).ready(function()...
$(function() {

    function postInit () {
        var year,
            calendarVM,
            hash;

        // If we're an iFrame, the workspace attaches an 'opener' handler (IE fix). We require this opener method to be established
        // before it is instantiated. The workspace can't attach it until the iFrame is fully rendered, so we must wait if it doesn't exist yet
        if (window.opener === undefined) {
            window.setTimeout(postInit, 10);
        } else {
            sysPrefsViewModel.registerSection(calendarViewModel);
            sysPrefsViewModel.registerSection(controllerViewModel, 'init');
            sysPrefsViewModel.registerSection(controlPriorityTextViewModel, 'getData');
            sysPrefsViewModel.registerSection(qualityCodesViewModel, 'getData');
            sysPrefsViewModel.registerSection(customColorCodesViewModel, 'init');
            sysPrefsViewModel.registerSection(telemetryViewModel, 'init');
            sysPrefsViewModel.registerSection(backupViewModel, 'init');
            sysPrefsViewModel.registerSection(alarmTemplateViewModel, 'init');
            sysPrefsViewModel.registerSection(weatherViewModel, 'init');
            sysPrefsViewModel.registerSection(notificationsViewModel, 'init');

            year = new Date().getFullYear();
            calendarVM = sysPrefsViewModel.getSection('Calendar');
            hash = location.hash.substring(1);
            calendarVM.updateDatePicker(year);
            calendarVM.year(year);

            if (sysPrefsViewModel.section() === '') {
                sysPrefsViewModel.section(sysPrefsViewModel.sections[0].displayName);
            }

            if (hash) {
                sysPrefsViewModel.section(hash);
            } else {
                location.hash = '#' + sysPrefsViewModel.section();
            }

            $('#jqxCalendar').jqxCalendar({
                width: '250px',
                enableViews: true
            });

            // Hide the calendar pop-up when the user clicks outside the jqxCalendar div
            $(document).mouseup(function(e) {
                var container = $('#jqxCalendar');

                if (!container.is(e.target) && (container.has(e.target).length === 0)) {
                    container.css('display', 'none');
                }
            });

            ko.applyBindings(sysPrefsViewModel);
            sysPrefsViewModel.runInitFunctions();
        }
    }

    postInit();
});
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
                    if (!!row[NAME])
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
var customColorCodesViewModel = function() {
    var self = this,
        originalData,
        makeDirty = function() {
            self.dirty(true);
        },
        CustomColorCode = function(index, hexColor) {
            this['hexColor'] = ko.observable(hexColor);
            this['hexColor'].subscribe(makeDirty);
        },
        saveCustomColors = function(input, url) {
            var i,
                len = input.length;
            rawHexColor = [];

            for (i = 0; i < len; i++) {
                rawHexColor.push(input[i].hexColor());
            }

            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                success: function(returnData) {
                    //console.log(url, "input = " + JSON.stringify(input));
                    //console.log(url, "returnData = " + JSON.stringify(returnData));
                },
                data: {
                    'colorsArray': rawHexColor
                }
            });
        },
        setData = function(customColors) {
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
    self.init = function() {
        $.getJSON('/api/system/getCustomColors', setData);
    };
    self.cancel = function() {
        setData(originalData);
    };
    self.save = function() {
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
                if (name === 'Time Zone') {
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

        for (var prop in tzEnums) {
            timezones.push({
                name: prop,
                value: tzEnums[prop].enum
            });
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
    self.changeTimezone = function(e) {
        for (var prop in tzEnums) {
            if (tzEnums[prop].enum === self.selectedTimeZone()) {
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

        if (data.err) {
            self.backupMsg('Error: ' + data.err);
        } else {
            self.backupMsg(data);
        }
        self.showBackupMsg(true);
    });
};

// About screen ---------------------------------------------------------------
var versionsViewModel = function() {
    var self = this;
    self.displayName = 'Versions';
    self.dirty = ko.observable(false);
    self.hasError = ko.observable(false);
    self.processVer = ko.observable('');
    self.ijsVer = ko.observable('');

    self.getData = function() {
        $.ajax({
            url: '/api/system/versions'
        }).done(function(data) {
            if (!!data.err) {
                console.log(data);
                alert('There was an error getting versions.');
            } else {
                self.ijsVer(data.infoscanjs);
                self.processVer(data.Processes);
            }
        });
    };
    self.init = function() {
        self.getData();
    };
};

// Alarm messages screen ------------------------------------------------------
var alarmMessageDefinitions = _.partial(function(masterVm) {
    _.mixin(_.str.exports());
    var Amd, initialize, self, facadeViewModel;
    self = this;
    if (!_.isObject(masterVm)) {
        masterVm = self;
    }
    Amd = function(bootStrapped) {
        var alarmMessageDefinitionsViewModel,
            gridViewModel,
            EditorViewModel,
            editorViewModel,
            supportModel,
            HierarchyViewModel,
            masterViewModel,
            ValueTokenizer,
            boundValueTokenizer,
            DefinitionQueryCollection,
            alarmDefinitionsModel = new Backbone.Model({
                supportModel: new Backbone.Model(bootStrapped),
                gridViewModel: null,
                editor: null,
                definitionCollection: {},
                error: null
            });

        DefinitionQueryCollection = Backbone.Collection.extend({
            initialize: function(models, options) {
                var self;
                self = this;
                this.add(models);
                alarmMessageDefinitionsViewModel.definitionCollection(this);
                _.bindAll(this, 'presave', 'remove', 'removeDefinition');
            },
            url: 'api/alarmMessageDefinitions',
            parse: function(response) {
                return response.results;
            },
            removeDefinition: function(definition) {
                var self, toRemove, collection;
                self = this;
                collection = definition.model.collection;
                toRemove = function(data) {
                    collection.remove(definition.model);
                    //collection.reset(collection.toJSON());
                    //console.log(definition.dispose());
                };
                self.sync('delete', definition.model).done(toRemove).fail(toRemove);
            },
            presave: function(mdl, callbacks) {
                var col;
                col = this;
                mdl.url = col.url;
                mdl.save().done(function(result, message) {
                    if (message === 'success') {
                        if (mdl.isNew()) {
                            col.add(mdl);
                        }
                        mdl.set(result.result);
                        callbacks.success(result);
                        col.reset(col.toJSON());
                    } else {
                        callbacks.error(result);
                    }
                }).fail(callbacks.error);
            }
        });

        alarmMessageDefinitionsViewModel = kb.viewModel(alarmDefinitionsModel, {}, {
            keys: ['error', 'gridViewModel', 'editor', 'deletor', 'supportModel', 'definitionCollection']
        });

        alarmMessageDefinitionsViewModel.editor = ko.observable(null);
        alarmMessageDefinitionsViewModel.deletor = ko.observable(null);

        alarmMessageDefinitionsViewModel.clearSelectedRow = function(mdl, ev) {
            alarmMessageDefinitionsViewModel.gridViewModel().definitions().gridOptions.selectedItems([]);
            $('#grid .selected').removeClass('selected');
        };

        alarmMessageDefinitionsViewModel.editorSubscription = alarmMessageDefinitionsViewModel.editor.subscribe(function(val) {
            if (!_.isObject(val)) {
                alarmMessageDefinitionsViewModel.clearSelectedRow();
            }
        });

        gridViewModel = function(options) {
            var $el, grid, definitions, self,
                definitionViewModelBase, DefinitionsViewModel;
            self = this;
            definitions = new DefinitionQueryCollection(options.definitions, {
                url: '/api/alarmMessageDefinitions',
                idAttribute: '_id'
            });
            DefinitionsViewModel = function(model) {
                var self, vm;
                self = this;
                vm = new definitionViewModelBase(model);
                vm.sortOn = ko.observable(null);
                vm.searchResults = kb.collectionObservable(definitions, {
                    filters: function(mdl) {
                        var result;
                        if ((_.isString(vm.searchFilter()) && vm.searchFilter().length > 0)) {
                            result = _.str.include(_.values(mdl.toJSON()).join('').toLowerCase(), vm.searchFilter().toLowerCase());
                            return result;
                        }
                        result = true;
                        return result;
                    },
                    sort_attributes: vm.sortOn,
                    view_model: function(model) {
                        return new function() {
                            var self;
                            self = this;
                            self.msgCatName = model.get('msgCatName');
                            self.msgTypeName = model.get('msgTypeName');
                            self.msgType = model.get('msgType');
                            self.msgCat = model.get('msgCat');
                            self.msgFormat = model.get('msgFormat');
                            self.msgName = kb.observable(model, 'msgName');
                            self.msgBackColor = _.sprintf('%s', model.get('msgBackColor'));
                            self.msgTextColor = _.sprintf('%s', model.get('msgTextColor'));
                            self.systemMessage = model.get('systemMessage');
                            self.cloneable = (self.msgCatName !== 'Event');
                            self.deletable = !model.get('isSystemMessage');
                            self.isSystemMessage = model.get('isSystemMessage') === true ? 'Yes' : 'No';
                            self.template = model.get('template');
                            self._id = model.id;
                            self.model = model;
                            self.dispose = function() {
                                kb.release(self);
                            };
                            return self;
                        };
                    }
                });
                vm.gridOptions.data = vm.searchResults;
                vm.resultLength = ko.computed({
                    read: function() {
                        return vm.searchResults().length;
                    }
                });
                return vm;
            };
            definitionViewModelBase = kb.ViewModel.extend({
                filterResults: function(crit) {
                    var result, vm;
                    vm = this;
                    if (!_.isString(crit) || crit.length < 1) {
                        result = this.data.where({});
                        return result;
                    }
                    result = this.data.filter(function(v, i) {
                        var searchData, found;
                        searchData = _.values(v.attributes);
                        found = _.str.include(searchData.join(''), crit);
                        if (found) {
                            return v;
                        }
                    });
                    return result;
                },
                setEditor: function(definition) {
                    if (options.setEditor) {
                        options.setEditor(definition);
                    }
                    return definition;
                },
                gridOptions: {
                    showGroupPanel: false,
                    columnWidth: 100,
                    keepLastSelected: false,
                    data: ko.observable(),
                    width: 100,
                    multiSelect: false,
                    columnDefs: [{
                        field: 'systemMessage',
                        width: 60,
                        displayName: ' ',
                        cellFilter: function(data) {
                            if (_.isNull(data)) {
                                data = false;
                            }
                            return data;
                        },
                        headerClass: '.definitions-sys-header-color',
                        cellTemplate: $('#tmplIsSystemMessage').html()
                    }, {
                        field: "msgCatName",
                        displayName: "Category",
                        width: 120,
                        cellTemplate: $('#tmplGridMsgCat').html()
                    }, {
                        field: "msgTypeName",
                        displayName: "Type",
                        width: 230,
                        cellTemplate: $('#tmplGridMsgType').html()
                    }, {
                        field: "msgName",
                        displayName: "Name",
                        width: 300,
                        cellTemplate: $('#tmplGridMsgName').html()
                    }, {
                        field: "msgFormat",
                        displayName: "Definition",
                        width: 500,
                        cellTemplate: $('#tmplGridMsgFormat').html()
                    }, {
                        field: "isSystemMessage",
                        displayName: "System Message",
                        width: 150,
                        cellTemplate: $('#tmplSystemMessage').html()
                    }],
                    displaySelectionCheckbox: false,
                    enableSorting: ko.observable(true),
                    canSelectRows: false,
                    selectedItems: ko.observableArray(),
                    footerVisible: false,
                    rowHeight: 30,
                    rowTemplate: $("#tmplGridRow").html(),
                    showColumnMenu: false,
                    showFilter: false
                },
                clearSearchFilter: function(mdl, ev) {
                    mdl.searchFilter(null);
                },
                clone: function(definition) {
                    var newDefinition, newDefVals;
                    newDefVals = _.omit(definition.model.toJSON(), '_id', 'id');
                    newDefVals.template = 'newMessage';
                    newDefVals.isSystemMessage = false;
                    newDefVals.systemMessage = false;
                    newDefinition = new options.modelConstructor(new Backbone.Model(newDefVals));
                    this.setEditor(newDefinition);
                },
                remove: function(definition) {
                    //var toRemove,collection;
                    //collection = definition.model.collection;
                    //collection.removeDefinition(definition);
                },
                setDeletable: _.bind(function(definition) {
                    var subscription, self;
                    self = this;
                    this.deletor({
                        definition: definition,
                        buttons: {
                            cancel: {
                                text: 'cancel',
                                fn: function() {
                                    self.deletor(null);
                                }
                            },
                            okay: {
                                text: 'okay',
                                fn: function() {
                                    var collection;
                                    collection = definition.model.collection;
                                    collection.removeDefinition(definition);
                                    console.log(definition);
                                }
                            }
                        }
                    });

                }, alarmMessageDefinitionsViewModel)
            });
            self.vm = kb.viewModel(new Backbone.Model({
                definitions: new DefinitionsViewModel(new Backbone.Model({
                    collection: definitions,
                    searchFilter: '',
                    gridOptions: definitionViewModelBase.gridOptions,
                    resultLength: 0,
                }))
            }));

            return self.vm;
        };
        ValueTokenizer = function(valueTokens, pattern, definition, callbacks) {
            var self, crit, eachValueTokens, tokens;
            self = this;
            tokens = ['%NAME'];
            crit = {
                Category: definition.msgCatName,
                'Type Value': definition.msgType
            };
            eachValueTokens = function(token, i) {
                if (token.Category.toLowerCase() == crit.Category.toLowerCase() && token['Type Value'] == crit['Type Value']) {
                    tokens.push(_.map(token['Value Tags'].split(','), function(v) {
                        return _.str.trim(v);
                    }));
                }
            };
            self.model = new Backbone.Model({
                selectedValueToken: null,
                showing: false,
                searchToken: ''
            });
            self.result = kb.viewModel(self.model);
            self.result.valueTokens = ko.observableArray([]);
            _.each(valueTokens, eachValueTokens);
            self.result.valueTokens(_.flatten(tokens));
            return self.result;
        };
        boundValueTokenizer = _.partial(ValueTokenizer, alarmMessageDefinitionsViewModel.supportModel().hierarchy());
        EditorViewModel = function(templates, validators, toEdit, setter) {
            var self, editor, BaseViewModel, ValueTokenViewModel, caretPos;
            self = this;
            editor = this;
            caretPos = 0;
            BaseViewModel = kb.ViewModel.extend({
                constructor: function(options) {
                    var self, donow, createTokenizerInstance;
                    self = this;
                    _.extend(self, options);
                    createTokenizerInstance = function() {
                        self.tokenizer = new boundValueTokenizer(self.tokenizerOptions.pattern, self.tokenizerOptions.definition, self.tokenizerOptions.callbacks);
                    };
                    _.bindAll(self, 'template', 'observify', 'Handlers', 'beginEdit');
                    _.bind(self.tokenizerOptions.insertMsgFormatText, self);
                    _.bind(self.tokenizerOptions.callbacks.select, self);
                    donow = _.compose(self.Handlers, self.beginEdit, createTokenizerInstance, self.observify, self.template);
                    donow();
                },
                keys: [],
                tokenizer: null,
                Handlers: function(editable) {
                    var result, self;
                    //reset outerself to parrent
                    self = this;
                    self.handlers = {
                        viewModel: this,
                        cancel: function(mdl, ev) {
                            // Restore the original values
                            editable.msgBackColor(alarmMessagesViewModel.alarmMessageState.msgBackColor);
                            editable.msgTextColor(alarmMessagesViewModel.alarmMessageState.msgTextColor);
                            editable.msgName(alarmMessagesViewModel.alarmMessageState.msgName);

                            // msgFormat included only if this is a non-system message
                            if (editable.msgFormat)
                                editable.msgFormat(alarmMessagesViewModel.alarmMessageState.msgFormat);

                            setter(null);
                        },
                        saveable: ko.computed({
                            read: function() {
                                return (editable.hasChanges() && editable.isValid());
                            },
                            deferEvaluation: true
                        }),
                        undo: function() {
                            var self;
                            self = this;
                            editable.rollback();
                            editable.beginEdit();
                        },
                        hasChanges: ko.computed({
                            read: function() {
                                return editable.hasChanges();
                            },
                            deferEvaluation: true
                        }),
                        save: function(mdl, ev) {
                            var col;
                            editable.commit();
                            col = editor.model().get('definitionCollection');
                            col.presave(mdl.viewModel.viewModel.model, {
                                success: function(data) {
                                    var result, mdl;
                                    result = data.result;
                                    mdl = col.get(result.id);
                                    if (!mdl) {
                                        mdl = new col.model(result);
                                    }
                                    col.reset(col.toJSON());
                                    setter(null);
                                },
                                error: function(e) {

                                }
                            });
                        },
                        isValid: ko.computed({
                            read: function() {
                                return editable.isValid();
                            },
                            deferEvaluation: true
                        })

                    };
                    return self.handlers;
                },
                insertMsgFormatText: function(txt, position) {
                    var beforeTxt, afterTxt, format, msgFormat, startPos;
                    format = '%s %s %s';
                    msgFormat = self.msgFormat();
                    beforeText = msgFormat.substr(0, position);
                    afterText = msgFormat(position + 1);
                    msgFormat = _.sprintf(format, beforeText, txt, afterText);
                    self.msgFormat(msgFormat);
                    return msgFormat;
                },
                //checkMsgFormat:function(mdl,ev){
                //    //this.msgFormatCaret($(ev.currentTarget).caret());
                //    //this.tokenizer.msgFormatUpdate(mdl.msgFormat(),this.msgFormatCaret());
                //},
                //msgFormatCaret:ko.observable(0),
                editNameAndFormat: ko.computed({
                    read: function() {
                        if (_.isObject(self.editor())) {
                            return _.isFunction(self.editor().viewModel.editable.msgFormat);
                        }
                        return false;
                    },
                    deferEvaluation: true
                }),
                beginEdit: function() {
                    var self;
                    self = this;
                    ko.editable(self.viewModel.editable);
                    self.viewModel.editable.beginEdit();
                    ko.validatedObservable(self.viewModel.editable);
                    return self.viewModel.editable;
                },
                template: function() {
                    var template, keys, self, result, model;
                    self = this;
                    model = self.viewModel.model.toJSON();
                    template = templates[model.template];
                    self.keys = _.keys(template);
                    return template;
                },
                observify: function(template) {
                    var self, editables, viewModel, keys, result;
                    self = this;
                    viewModel = self.viewModel;
                    viewModel.editable = {};
                    keys = _.keys(template);
                    editables = function(template, viewModel) {
                        var eachProp;
                        eachProp = function(v, i) {
                            var extension, validator;
                            validator = _.findWhere(validators, {
                                name: v
                            }) || {};
                            viewModel.editable[v] = kb.observable(viewModel.model, v);
                            if (!_.isEmpty(validator)) {
                                viewModel.editable[v].extend(validator);
                            }
                        };
                        _.each(keys, eachProp);
                        return viewModel;
                    };
                    result = editables(template, viewModel);
                    return result;
                },
                tokenizerOptions: {
                    pattern: function() {
                        var _reg = /\%([A-Za-z0-9])\w+/g;
                        _reg.multiline = true;
                        _reg.ignoreCase = true;
                        _reg.global = true;
                        return _reg;
                    }(),
                    definition: toEdit,
                    insertMsgFormatText: function(position, value) {
                        var self;
                        self = this;
                        return;
                    },
                    callbacks: {
                        select: function(value) {
                            var position, self;
                            self = this;
                        }
                    }
                }
            });
            return new BaseViewModel({
                viewModel: toEdit
            });
        };
        editorViewModel = _.partial(EditorViewModel, alarmMessageDefinitionsViewModel.supportModel().templates(), alarmMessageDefinitionsViewModel.supportModel().validators());
        editorViewModel = _.bind(editorViewModel, alarmMessageDefinitionsViewModel);
        alarmDefinitionsModel.set('gridViewModel', new gridViewModel({
            setEditor: function(toEdit) {
                // Save the alarm message parameters so we can restore them if the alarm edit is cancelled
                // Depending if we're cloning or editing, msgName/msgFormat may or may not be observables. Use unwrap to safely get the value
                self.alarmMessageState.msgName = ko.utils.unwrapObservable(toEdit.msgName);
                self.alarmMessageState.msgFormat = ko.utils.unwrapObservable(toEdit.msgFormat);
                self.alarmMessageState.msgTextColor = toEdit.msgTextColor;
                self.alarmMessageState.msgBackColor = toEdit.msgBackColor;

                alarmMessageDefinitionsViewModel.editor(editorViewModel(toEdit, alarmMessageDefinitionsViewModel.editor));
            },
            clearEditor: function() {
                var vm;
                vm = alarmMessageDefinitionsViewModel.editor();
                kb.release(vm);
                alarmMessageDefinitionsViewModel.editor(null);
            },
            deletor: alarmMessageDefinitionsViewModel.deletor,
            getEditor: function() {
                return alarmMessageDefinitionsViewModel.editor();
            },
            isEditing: ko.computed({
                read: function() {
                    return _.isObject(alarmMessageDefinitionsViewModel.editor());
                }
            }),
            modelConstructor: function(model, options) {
                var self;
                self = this;
                self.msgCatName = model.get('msgCatName');
                self.msgTypeName = model.get('msgTypeName');
                self.msgType = model.get('msgType');
                self.msgCat = model.get('msgCat');
                self.msgFormat = kb.observable(model, 'msgFormat');
                self.msgName = model.get('msgName');
                self.msgBackColor = _.sprintf('%s', model.get('msgBackColor'));
                self.msgTextColor = _.sprintf('%s', model.get('msgTextColor'));
                self.systemMessage = model.get('systemMessage');
                self.isSystemMessage = model.get('isSystemMessage');
                self.cloneable = (self.msgCatName !== 'Event');
                self.deletable = !model.get('isSystemMessage');
                self._id = model.id;
                self.model = model;
                self.template = model.get('template');
                return self;

            },
            definitions: alarmMessageDefinitionsViewModel.supportModel().definitions()
        }));
        return alarmMessageDefinitionsViewModel;
    };

    // Create descriptions for all possible alarm message tokens
    self.tokenDescriptions = {
        "%NAME": "Point name",
        "%PV": "Present value",
        "%AV": "Alarm value",
        "%UT": "Engineering units",
        "%RC": "Reliability code"
    };

    self.alarmMessageState = {};
    self.dirty = ko.observable(false);
    self.name = 'AlarmMessageDefinitions';
    self.hasError = ko.observable(false);
    self.displayName = 'Alarm Messages';
    self.section = 'AlarmMessageDefinitions';
    self.viewModel = ko.observable(null);
    $.get('/alarmMessageDefinitions/helperData', function(d) {
        var $kgTopPanel,
            topPanelPosition;

        self.viewModel(new Amd(d));

        // JDR - Tomfoolery to get our table header correctly position. We have to do this after the table is rendered
        // so the header doesn't cover up our first row.
        $kgTopPanel = $('.kgTopPanel');
        $kgTopPanel.css("top", 120);
        // Also extend its width to extend over the vertical scroll bar
        $kgTopPanel.css("width", $("#gridCont").css("width"));
    });
    return self;
}, sysPrefsViewModel);

// Weather screen -------------------------------------------------------------
var weatherViewModel = function() {
    var self = this,
        dataUrl = '/api/system/weather',
        saveUrl = '/api/system/updateWeather',
        workspaceManager = window.opener && window.opener.workspaceManager,
        openWindow = workspaceManager && window.opener.workspaceManager.openWindowPositioned,
        activePointStatus = workspaceManager && workspaceManager.config.Enums["Point Statuses"].Active.enum,
        originalData,
        openPointSelector = function(callback) {
            var windowRef,
                pointSelectedCallback = function(pid, name, type) {
                    if (!!pid) {
                        callback(pid, name, type);
                    }
                },
                windowOpenedCallback = function() {
                    windowRef.pointLookup.MODE = 'select';
                    windowRef.pointLookup.init(pointSelectedCallback);
                };

            windowRef = openWindow('/pointLookup', 'Select Point', '', '', 'Select Weather Point', {
                callback: windowOpenedCallback,
                width: 1000
            });
        },
        setData = function(data) {
            var newData = [];

            if (Array.isArray(data)) {
                data.forEach(function(weatherPoint) {
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
            }).done(function(data) {
                originalData = data;
                setData(data);
            });
        },
        getDataToSave = function() {
            var data = {};
            self.weatherPoints().forEach(function(weatherPoint) {
                var point = weatherPoint.point(),
                    upi = (point && point._id) || null;
                data[weatherPoint.title] = upi;
            });
            return data;
        },
        saveData = function() {
            // Create a snapshot in case the user modifies the data before save is completed
            var snapshot = ko.toJS(self.weatherPoints);
            // Save the data
            $.ajax({
                url: saveUrl,
                data: getDataToSave(),
                dataType: 'json',
                type: 'post'
            }).done(function(response) {
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

    self.init = function() {
        getData();
    };

    self.save = function() {
        saveData();
    };

    self.cancel = function() {
        setData(originalData);
    };

    self.removePointRef = function(data) {
        data.point(null);
        self.dirty(true);
    };

    self.editPointRef = function(data) {
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

    self.openPointRef = function(data) {
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
        makeId = function() {
            _idCounter++;
            return 'nid_' + _idCounter;
        },
        _local = {
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

            forEachArray: function(arr, fn) {
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

            getTemplate: function(template) {
                var tpl = $.extend(true, {}, _local.templates[template]),
                    copyProperties = ['repeatConfig', 'rotateConfig'],
                    idProperties = {
                        alertConfig: '_currAlertID',
                        group: '_currGroupID',
                        escalation: '_currEscalationID'
                    },
                    newID,
                    idProperty;

                copyProperties.forEach(function(property) {
                    if (tpl.hasOwnProperty(property)) {
                        tpl[property] = _local.getTemplate(property);
                    }
                });

                if (idProperties[template]) {
                    idProperty = _local.bindings.currPolicy[idProperties[template]];

                    newID = idProperty() + 1;
                    idProperty(newID);

                    tpl.id = newID;
                }

                return tpl;
            },
            policies: []
        },
        createMember = function(data, dt) {
            var ret = {
                    id: data._id,
                    firstName: data['First Name'].Value,
                    lastName: data['Last Name'].Value,
                    contactInfo: data['Contact Info'].Value,
                    securityGroup: null,
                    alerts: data.alerts,
                    notificationsEnabled: data.notificationsEnabled,
                    notificationOptions: data.notificationOptions || _local.getTemplate('notificationOptions')
                },
                processAlert = function(alert, idx) {
                    var contact;

                    if (alert.delay === undefined) {
                        alert.delay = idx === 0 ? 0 : 1;
                    }

                    if (alert.name === undefined) {
                        contact = _local.getContact(alert, data['Contact Info'].Value);
                        alert.Name = contact.Name;
                    }
                };

            for (var alertType in data.alerts) {
                _local.forEachArray(data.alerts[alertType], processAlert);
            }

            return ret;
        };

    _local.init = function(reset) {
        var columns = [{
                data: 'firstName()',
                title: 'First Name',
                className: 'firstName',
                render: function(data, type, full, meta) {
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
            initMemberDataTable = function() {
                var members = _local.bindings.currPolicy.members,
                    $memberList = $('#memberList');

                _local.memberDT = $memberList.DataTable({
                    columns: columns,
                    paging: false,
                    searching: false,
                    bInfo: false
                });

                $memberList.on('click', '.firstName', function(event) {
                    var rowIdx = _local.memberDT.cell(this).index().row,
                        member = _local.memberDT.rows(rowIdx).data()[0];

                    _local.editMember(member);

                    event.preventDefault();
                });

                members.subscribe(function(members) {
                    _local.memberDT.clear();
                    _local.memberDT.rows.add(members);
                    _local.memberDT.draw();
                });
            };

        initMemberDataTable();

        _local.$tabs = $('.notificationsContent').on('click', '.nav a', function(e) {
            e.preventDefault();

            $(this).tab('show');

            if ($(this).attr('href').toLowerCase().match('schedule')) {
                $scheduleCalendar.fullCalendar('render');
                _local.updateScheduleEvents();
            }
        });

        $scheduleCalendar.fullCalendar({
            schedulerLicenseKey: '0890776600-fcs-1460400855',
            eventClick: function(calEvent, jsEvent, view) {
                console.log(calEvent);
                jsEvent.preventDefault();
            },
            header: {
                left: '', //prev,next',
                center: '', //title',
                right: '' //agendaWeek,agendaDay'
            },
            // titleFormat: '[Schedule Preview]',
            // eventColor: '#7156FB',
            allDaySlot: false,
            defaultDate: moment().format('YYYY-MM-DD'), //'2016-01-12',
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
            $.getJSON('/api/policies/get').done(function(response) {
                _local._rawPolicies = response;
                _local.buildPolicies(response);
            });
        } else {
            _local.buildPolicies(_local._rawPolicies);
        }
    };

    _local.updateScheduleEvents = function() {
        var colors = ['#FDA46E', '#8666FB'], //, '#7DC551'],
            datePrefix = moment().format('YYYY-MM-DDT'),
            tomorrowPrefix = moment().add(1, 'd').format('YYYY-MM-DDT'),
            events = [],
            convertTime = function(time) {
                var hr = time / 100,
                    min = time % 100;

                return ('0' + hr).slice(-2) + ':' + ('0' + min).slice(-2) + ':00';
            },
            createEvents = function(schedule, color, title) {
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

                _local.forEachArray(schedule.days, function(day) {
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

        _local.forEachArray(_local.bindings.currPolicy.scheduleLayers(), function(layer, idx) {
            _local.forEachArray(ko.toJS(layer.schedules), function(schedule) {
                events = events.concat(createEvents(schedule, colors[idx % 2], 'Layer ' + (idx + 1)));
            });
        });

        $scheduleCalendar.fullCalendar('removeEvents');
        $scheduleCalendar.fullCalendar('addEventSource', events);
    };

    _local.translateMember = function(id) {
        return _local.userLookup[id];
    };

    _local.translateMembers = function(arr) {
        var c,
            len = arr.length,
            ret = [];

        for (c = 0; c < len; c++) {
            ret.push(_local.translateMember(arr[c]));
        }

        return ret;
    };

    _local.unTranslateMembers = function(policy) {
        var rawPolicy = ko.toJS(policy);
        _local.forEachArray(rawPolicy.members, function(member, idx) {
            rawPolicy.members[idx] = member.id;
        });

        return rawPolicy;
    };

    _local.buildPolicy = function(policy) {
        policy.members = _local.translateMembers(policy.members);


        _local.forEachArray(policy.alertConfigs, function(alertConfig) {
            var newGroups = [];
            alertConfig.groups = alertConfig.groups || [];
            _local.forEachArray(alertConfig.groups, function(group) {
                group.escalations = group.escalations || [];
                _local.forEachArray(group.escalations, function(escalation) {
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

    _local.buildPolicies = function(policies) {
        var c,
            len = policies.length;

        _local.bindings.policyList.removeAll();

        for (c = 0; c < len; c++) {
            _local.buildPolicy(policies[c]);
            _local.bindings.policyList.push(ko.viewmodel.fromModel(policies[c]));
        }
    };

    _local.prepPolicyForSave = function(policy) {
        _local.forEachArray(policy.alertConfigs, function(config) {
            var foundActive = false;

            _local.forEachArray(config.groups, function(group, idx) {
                if (group.active) {
                    foundActive = true;
                }
            });

            if (!foundActive && config.groups.length > 0) {
                config.groups[0].active = true;
            }
        });
    };

    _local.cancel = function() {
        _local.dirty(false);
        _local.bindings.home();
        _local.init(true);
    };

    _local.save = function() {
        _local.forEachArray(_local.bindings.policyList(), function(policy, idx) {
            var data = _local.unTranslateMembers(policy);

            _local.prepPolicyForSave(data);

            $.ajax({
                url: '/api/policies/save',
                data: JSON.stringify(data),
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json'
            }).done(function(response) {
                if (policy._new && policy._new() === true) {
                    delete policy._new;
                    if (policy._id() === _local.bindings.currPolicy._id()) {
                        _local.bindings.currPolicy._id(response.id);
                    }
                    policy._id(response.id);
                }
                console.log('Saved policy', policy.name());
            });
        });

        _local.dirty(false);
    };

    _local.clearEdits = function(resetAll) {
        var binding;

        for (binding in _local.bindings) {
            if (binding.match('isEditing')) {
                if (binding !== 'isEditingPolicy' || resetAll) {
                    _local.bindings[binding](false);
                }
            }
        }
    };

    _local.editMember = function(member) {
        _local._originalMember = ko.toJS(member);
        _local.bindings.currMember(member);
        _local.bindings.isEditingMember(true);
    };

    _local.editMembers = function(primary, secondary) {
        var c,
            cc,
            len = secondary.length,
            plen = primary.length,
            found = false;

        for (c = 0; c < plen; c++) {
            primary[c].selected = false;
            found = false;

            for (cc = 0; cc < len && !found; cc++) {
                if (primary[c].id === secondary[cc].id) {
                    primary[c].selected = true;
                    found = true;
                }
            }
        }

        _local.bindings.primaryMemberList(primary);
        _local.bindings.chosenMembers(secondary);
        _local.$modal.modal('show');
    };

    _local.updateAlertConfigMembers = function() {
        var arr = ko.toJS(_local.bindings.primaryMemberList()),
            newMembers = [];

        arr.forEach(function(member) {
            if (member.selected) {
                newMembers.push(member.id);
            }
        });

        ko.viewmodel.updateFromModel(_local._currEscalation.members, newMembers);
    };

    _local.updatePolicyMembers = function() {
        var arr = ko.toJS(_local.bindings.primaryMemberList()),
            newMembers = [];

        arr.forEach(function(member) {
            if (member.selected) {
                newMembers.push(member);
            }
        });

        ko.viewmodel.updateFromModel(_local.bindings.currPolicy.members, newMembers);
        _local.forEachArray(_local.bindings.policyList(), function(policy) {
            if (policy._id() === _local.bindings.currPolicy._id()) {
                policy.members(newMembers);
            }
        });
    };

    _local.getContact = function(alert, userContactInfo) {
        var contact,
            secondContact,
            rawAlert = ko.toJS(alert),
            value = rawAlert.Value,
            type = rawAlert.Type,
            name = rawAlert.Name;

        _local.forEachArray(userContactInfo || _local.bindings.currMember().contactInfo(), function(koContactInfo) {
            var contactInfo = ko.toJS(koContactInfo);

            if (name && contactInfo.Name === name) {
                contact = koContactInfo;
                return false;
            }

            if (contactInfo.Value === value && contactInfo.Type === type) {
                secondContact = koContactInfo;
            }
        });

        return contact || secondContact;
    };

    _local.savePolicy = function() {
        _local.forEachArray(_local.bindings.policyList(), function(policy, idx) {
            if (policy._id() === _local.bindings.currPolicy._id()) {
                ko.viewmodel.updateFromModel(_local.bindings.policyList()[idx], ko.toJS(_local.bindings.currPolicy));
            }
        });

        _local.dirty(true);
    };

    _local.saveUser = function(user) {
        var me = this,
            data = {
                userid: user.id,
                'Update Data': {
                    alerts: user.alerts,
                    notificationOptions: user.notificationOptions,
                    notificationsEnabled: user.notificationsEnabled
                }
            },
            processUser = function(alert, idx, list) {
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
            success: function(returnData) {
                if (returnData.err) {
                    console.log('Error saving user', returnData.err);
                } else {
                    console.log('Saved user');
                }
            }
        });
    };

    _local.checkAlertConfigNames = function(id, name, configs) {
        var duplicate = false;

        _local.forEachArray(configs, function(config) {
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

    _local.bindings = {
        currPolicy: ko.viewmodel.fromModel(_local.templates.policy),
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

        savePolicy: function() {
            _local.savePolicy();
        },

        updateScheduleEvents: function() {
            _local.updateScheduleEvents();

            return true;
        },

        editDays: function(schedule) {
            _local.forEachArray(_local.bindings.days, function(day, idx) {
                _local.bindings['day' + day](false);
            });

            _local.forEachArray(schedule.days(), function(day) {
                var idx = _local.bindings.shortDays.indexOf(day);

                if (idx !== -1) {
                    _local.bindings['day' + _local.bindings.days[idx]](true);
                }
            });

            _local.bindings.dayHolidays(schedule.holidays());

            _local._currSchedule = schedule;

            $('#notificationsEditDaysModal').modal('show');
        },

        updateDays: function() {
            var ret = [];
            _local.forEachArray(_local.bindings.days, function(day, idx) {
                if (_local.bindings['day' + day]()) {
                    ret.push(_local.bindings.shortDays[idx]);
                }
            });

            _local._currSchedule.holidays(_local.bindings.dayHolidays());

            if (_local.bindings.dayHolidays()) {
                ret.push('Holidays');
            }

            _local._currSchedule.days(ret);

            $('#notificationsEditDaysModal').modal('hide');
            _local.updateScheduleEvents();
        },

        getAlertStyleText: function(value) {
            var ret;
            _local.forEachArray(_local.bindings.alertStyles, function(style) {
                if (style.value === value) {
                    ret = style.text;
                }
            });

            return ret;
        },

        getUserName: function(id) {
            var user = _local.translateMember(id);

            return user.firstName + ' ' + user.lastName;
        },

        addAlertConfig: function(layer) {
            layer.$parent.alertConfigs.push(layer.$data.id());
        },

        deleteAlertConfig: function(config) {
            _local.bindings.currPolicy.alertConfigs.remove(function(item) {
                return item.id() === config.id();
            });
            _local.savePolicy();
            _local.dirty(true);
            //needs validation
        },

        convertTime: function(scheduleTime) {
            var ret,
                fullTime = scheduleTime(),
                hr = fullTime / 100,
                ampm = hr >= 12 ? 'PM' : 'AM';

            if (hr > 12) {
                hr -= 12;
            }

            if (hr === 0) {
                hr = 12;
            }

            return hr + ' ' + ampm;
        },

        convertDate: function(scheduleDays) {
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

            days = days.filter(function(el, idx, arr) {
                return el !== '';
            });

            days.forEach(function(day, idx, arr) {
                arr[idx] = day.charAt(0).toUpperCase() + day.slice(1);
            });

            return days.join(',');
        },

        deleteSchedule: function(context) {
            var scheduleIndex = context.$index(),
                layerIndex = context.$parentContext.$index();

            _local.bindings.currPolicy.scheduleLayers()[layerIndex].schedules.splice(scheduleIndex, 1);
            _local.dirty(true);
            _local.updateScheduleEvents();
        },

        addSchedule: function(scheduleLayer) {
            scheduleLayer.schedules.push(ko.viewmodel.fromModel(_local.getTemplate('schedule')));
            _local.updateScheduleEvents();
        },

        addScheduleLayer: function() {
            _local.bindings.currPolicy.scheduleLayers.push(ko.viewmodel.fromModel(_local.getTemplate('scheduleLayer')));
            _local.updateScheduleEvents();
        },

        deleteScheduleLayer: function(layer, idx) {
            layer.scheduleLayers.splice(idx(), 1);
            _local.dirty(true);
            _local.updateScheduleEvents();
        },

        editSchedule: function() {
            _local.bindings.isEditingSchedule(true);
        },

        cancelEditSchedule: function() {
            ko.viewmodel.updateFromModel(_local.bindings.currPolicy.scheduleLayers, _local._currPolicy.scheduleLayers);
            _local.bindings.isEditingSchedule(false);
            _local.updateScheduleEvents();
        },

        saveSchedule: function() {
            _local._currPolicy = ko.toJS(_local.bindings.currPolicy);
            _local.bindings.isEditingSchedule(false);

            _local.savePolicy();
        },

        editAlertConfigMembers: function(escalation) {
            _local.memberCb = _local.updateAlertConfigMembers;
            _local._currEscalation = escalation;
            _local.editMembers(ko.toJS(_local.bindings.currPolicy.members()), _local.translateMembers(escalation.members()));
        },

        editPolicyMembers: function() {
            _local.memberCb = _local.updatePolicyMembers;
            _local.editMembers(_local.users, ko.toJS(_local.bindings.currPolicy.members()));
        },

        getAlertIcon: function(alert) {
            var contact;

            if (alert.Name) {
                contact = _local.getContact({
                    Name: alert.Name()
                });
            } else {
                contact = _local.getContact(ko.toJS(alert));
            }

            return 'fa-' + _local.iconLookup[contact && contact.Type()];
        },

        getAlertType: function(contactInfo, type, name) {
            var contact = self.getContact({Value: contactInfo(), Type: type()});
                Value: contactInfo(),
                Name: name()
            });

            return contact && contact.Type;
        },

        addNewAlert: function(data) {
            var alert = _local.getTemplate('alertNotification'),
                firstContact = _local.bindings.currMember().contactInfo()[0],
                alerts = _local.bindings.currMember().alerts[data.name];

            alert.Value = firstContact.Value();
            alert.Type = firstContact.Type();
            alert.Name = firstContact.Name();

            if (alerts().length === 0) {
                alert.delay = 0;
            }

            _local.bindings.currMember().alerts[data.name].push(ko.viewmodel.fromModel(alert));
        },

        deleteAlert: function(alertType, idx) {
            var _idx = idx(),
                row;

            alertType.alerts.splice(_idx, 1);

            if (_idx === 0) { //deleted first one
                row = alertType.alerts()[0];
                if (row) {
                    row.delay(0);
                }
            }
        },

        getContactString: function(contact) {
            var type = _local.alertTypeLookup[contact.Type()],
                val = contact.Value(),
                name = contact.Name && contact.Name();

            return [type, name, 'at', val].join(' ');
        },

        getContactAlertString: function(alert) {
            var contact = _local.getContact(alert);

            return _local.bindings.getContactString(contact);
        },

        editAlertNotifications: function() {
            _local.bindings.isEditingAlertNotifications(true);
        },

        cancelEditAlertNotifications: function() {
            _local.bindings.currMember(ko.viewmodel.fromModel(_local._originalMember));
            _local.bindings.isEditingAlertNotifications(false);
            ko.viewmodel.updateFromModel(_local.bindings.currMember().alerts, _local._originalMember.alerts);
        },

        saveAlertNotifications: function(user) {
            _local.bindings.isEditingAlertNotifications(false);
            _local.saveUser(ko.toJS(user));

            _local.savePolicy();
        },

        updateMembers: function() {
            if (_local.memberCb) {
                _local.memberCb();
                _local.memberCb = null;
                _local.savePolicy();
            }
            _local.$modal.modal('hide');
        },

        doDeletePolicy: function(id, cb) {
            $.ajax({
                url: '/api/policies/delete',
                data: {
                    _id: id
                },
                type: 'POST',
                dataType: 'json'
            }).done(function(response) {
                console.log('Deleted');
                cb();
            });
        },

        deletePolicy: function(policy) {
            _local.forEachArray(_local.bindings.policyList(), function(boundPolicy, idx) {
                if (boundPolicy._id() === policy._id()) {
                    if (policy._new && policy._new()) {
                        _local.bindings.policyList.splice(idx, 1);
                    } else {
                        _local.bindings.doDeletePolicy(policy._id(), function() {
                            _local.bindings.policyList.splice(idx, 1);
                        });
                    }
                }
            });
        },
        selectPolicy: function(policy) {
            var rawPolicy = ko.toJS(policy);
            _local.bindings.currAlertConfig(null);
            _local.bindings.isEditingMember(false);
            _local._currPolicy = ko.toJS(policy);
            ko.viewmodel.updateFromModel(_local.bindings.currPolicy, rawPolicy);
            _local.bindings.isEditingPolicy(true);
        },
        addPolicy: function() {
            _local.bindings.newPolicyName('');
            _local.bindings.isEditingNewPolicy(true);
        },
        doAddNewPolicy: function() {
            var newPolicy = _local.getTemplate('policy'),
                name = _local.bindings.newPolicyName();

            // validation
            newPolicy.name = name;
            _local.bindings.policyList.push(ko.viewmodel.fromModel(newPolicy));
            _local.bindings.isEditingNewPolicy(false);
            ko.viewmodel.updateFromModel(_local.bindings.currPolicy, newPolicy);
            _local.bindings.selectPolicy(newPolicy);
            _local.dirty(true);
        },
        editPolicyName: function() {
            _local.bindings.currPolicyName(_local.bindings.currPolicy.name());
            _local.bindings.isEditingPolicyName(true);
        },
        savePolicyName: function() {
            _local.bindings.currPolicy.name(_local.bindings.currPolicyName());
            _local.bindings.isEditingPolicyName(false);
            _local.savePolicy();
        },
        cancelPolicyNameEdit: function() {
            _local.bindings.isEditingPolicyName(false);
        },

        cancelEditMember: function() {
            _local.bindings.currMember(null);
            _local.bindings.isEditingMember(false);
        },

        editPolicyEnabled: function() {
            _local.bindings.currPolicyEnabled(_local.bindings.currPolicy.enabled());
            _local.bindings.isEditingPolicyEnabled(true);
        },
        savePolicyEnabled: function() {
            _local.bindings.currPolicy.enabled(!_local.bindings.currPolicyEnabled());
            _local.bindings.isEditingPolicyEnabled(false);
            _local.savePolicy();
        },
        cancelPolicyEnabledEdit: function() {
            _local.bindings.isEditingPolicyEnabled(false);
        },

        addConfiguration: function() {
            _local.bindings.newConfigurationName('');
            _local.bindings.isEditingNewConfiguration(true);
        },
        doAddNewConfiguration: function() {
            var configurationTemplate = _local.getTemplate('alertConfig'),
                duplicate;

            duplicate = _local.checkAlertConfigNames(null, _local.bindings.newConfigurationName(), _local.bindings.currPolicy.alertConfigs());

            if (!duplicate) {
                configurationTemplate.name = _local.bindings.newConfigurationName();
                _local.bindings.currPolicy.alertConfigs.push(ko.viewmodel.fromModel(configurationTemplate));
                _local.bindings.currAlertConfig(ko.viewmodel.fromModel(ko.toJS(_local.bindings.currPolicy.alertConfigs.slice(-1)[0])));
                _local.bindings.isEditingNewConfiguration(false);
                _local.bindings.isEditingAlertConfig(true);
                _local.savePolicy();
            }
        },

        editAlertConfig: function(alertConfig) {
            _local.bindings.currAlertConfig(alertConfig);
        },
        cancelEditAlertConfig: function() {
            _local.bindings.cancelDoEditAlertConfig();
            _local.bindings.currAlertConfig(null);
        },

        doEditAlertConfig: function() {
            _local._originalAlertConfig = ko.toJS(_local.bindings.currAlertConfig);

            _local.bindings.isEditingAlertConfig(true);
        },
        cancelDoEditAlertConfig: function() {
            ko.viewmodel.updateFromModel(_local.bindings.currAlertConfig, _local._originalAlertConfig);
            _local.bindings.isEditingAlertConfig(false);
        },
        saveEditAlertConfig: function() {
            var id = _local.bindings.currAlertConfig().id(),
                duplicate;

            duplicate = _local.checkAlertConfigNames(_local.bindings.currAlertConfig().id(), _local.bindings.currAlertConfig().name(), _local.bindings.currPolicy.alertConfigs());

            if (!duplicate) {
                _local.forEachArray(_local.bindings.currPolicy.alertConfigs(), function(config) {
                    if (config.id() === id) {
                        ko.viewmodel.updateFromModel(config, ko.toJS(_local.bindings.currAlertConfig));
                        // ko.viewmodel.updateFromModel(_local.bindings.currPolicy.alertConfigs)
                        return false;
                    }
                });

                _local._originalAlertConfig = ko.toJS(_local.bindings.currAlertConfig);

                _local.savePolicy();

                _local.bindings.isEditingAlertConfig(false);
            }
        },

        addAlertGroup: function() {
            _local.bindings.currAlertConfig().groups.push(ko.viewmodel.fromModel(_local.getTemplate('group')));
        },

        deleteAlertGroup: function(alertConfig, idx) {
            alertConfig.groups.splice(idx(), 1);
            _local.dirty(true);
        },

        addEscalation: function(group) {
            group.escalations.push(ko.viewmodel.fromModel(_local.getTemplate('escalation')));
        },

        deleteEscalation: function(group, idx) {
            group.escalations.splice(idx(), 1);
        },

        home: function() {
            // _local.forEachArray(_local.bindings.policyList(), function (policy, idx) {
            //     if (policy._id === _local.bindings.currPolicy._id()) {
            //         ko.viewmodel.updateFromModel(_local.bindings.policyList()[idx], ko.toJS(_local.bindings.currPolicy));
            //     }
            // });
            _local.clearEdits(true);
            // ko.viewmodel.updateFromModel(_local.bindings.currPolicy, _local.templates.policy);// check for unsaved changes?
        }
    };

    $.ajax({
        url: _webendpointURI + 'groups/getallgroups',
        contentType: 'application/json',
        dataType: 'json',
        type: 'post'
    }).done(function(data) {
        _local.groups = data;
    });

    $.ajax({
        url: _webendpointURI + 'users/getallusers',
        contentType: 'application/json',
        dataType: 'json',
        type: 'post'
    }).done(function(data) {
        var c,
            users = data.Users,
            len = users.length,
            member;

        _local.users = [];
        _local.userLookup = {};

        for (c = 0; c < len; c++) {
            member = createMember(users[c]);
            _local.users.push(member);
            _local.userLookup[member.id] = member;
        }
    });

    $('body').on('shown.bs.dropdown', '.daySelect input', function(e) {

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

            for (c = 0; c < len && !done; c++) {
                if (alertConfigs[c].id() === configID) {
                    alertConfig = alertConfigs[c];
                    done = true;
                }
            }

            $element.html(alertConfig.name());
        }
    };

    ko.bindingHandlers.timepicker = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {
            //initialize timepicker with some optional options
            var observable = valueAccessor(),
                options = {
                    doneText: 'Done',
                    autoclose: true,
                    afterDone: function() {
                        var time = $(element).val().split(':'),
                            hr = parseInt(time[0], 10),
                            min = parseInt(time[1], 10);
                        observable(hr * 100 + min);
                        context.$parents[2].updateScheduleEvents();
                        context.$parents[2].savePolicy();
                    }
                };

            $(element).clockpicker(options);

            $(element).change(function(event) {
                $(element).clockpicker('resetclock');
            });
        },

        update: function(element, valueAccessor) {
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


    return _local;
};
// Shortcut for $(document).ready(function()...
$(function() {

    function postInit() {
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
            sysPrefsViewModel.registerSection(alarmMessageDefinitions);
            sysPrefsViewModel.registerSection(weatherViewModel, 'init');
            sysPrefsViewModel.registerSection(notificationsViewModel, 'init');
            sysPrefsViewModel.registerSection(versionsViewModel, 'init');

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
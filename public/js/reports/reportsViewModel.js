"use strict";
window.workspaceManager = (window.opener || window.top).workspaceManager;
var reportsVM;

var initKnockout = function () {
    var $startDate,
        initStartDate,
        $endDate,
        initEndDate,
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
                    (((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 150)) && !shiftKey) &&  // allow numbers
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
                    arr = value.split(':');
                } else {
                    arr = [];
                    if (timeLen === 5) {  // step on errant text
                        arr[0] = value.substr(0, 2);
                        arr[1] = value.substr(3, 2);
                    } else {
                        arr[0] = value.substr(0, (timeLen === 4 ? 2 : 1 ));
                        arr[1] = value.substr(timeLen - 2, 2);
                    }
                }
                hrs = Number.isNaN(parseInt(arr[0], 10)) ? 0 : parseInt(arr[0], 10);
                mins = Number.isNaN(parseInt(arr[1], 10)) ? 0 : parseInt(arr[1], 10);

                if (hrs > 23) {
                    hrs = 23;
                }
                if (mins > 59) {
                    mins = 59;
                }

                if ((incrementUnit > 0 && mins < 59) ||
                    (incrementUnit < 0 && mins > 0)) {
                    mins += incrementUnit;
                } else if ((incrementUnit < 0 && mins === 0)) {
                    if (hrs === 0 || hrs > 24) {
                        hrs = 24;
                    }
                    mins = 59;
                    wrapped = true;
                } else if ((incrementUnit > 0 && mins >= 59)) {
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

                return ((hrs < 10 ? '0' : '') + hrs) + ':' + ((mins < 10 ? '0' : '') + mins);
            } else {
                return value;
            }
        };

    ko.bindingHandlers.reportDateRangePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                durationInfo = valueAccessor(),
                getPickerData = function (element, picker) {
                    var pickerInfo = {};
                    pickerInfo.startDate = picker.startDate;
                    pickerInfo.endDate = picker.endDate;
                    pickerInfo.duration = picker.endDate.diff(picker.startDate);
                    pickerInfo.selectedRange = picker.chosenLabel;
                    if (ko.isObservable(durationInfo)) {
                        durationInfo(pickerInfo);
                    } else {
                        durationInfo = pickerInfo;
                    }
                    element.val(pickerInfo.startDate.format('MM/DD/YYYY') + ' - ' + pickerInfo.endDate.format('MM/DD/YYYY'));
                    element.attr("title", pickerInfo.selectedRange);
                };
            $element.attr("title", (durationInfo().selectedRange !== "" ? durationInfo().selectedRange : "Start & End Dates"));
            $element.val(durationInfo().startDate.format('MM/DD/YYYY') + ' - ' + durationInfo().endDate.format('MM/DD/YYYY'));

            $element.daterangepicker({
                startDate: durationInfo().startDate,
                endDate: durationInfo().endDate,
                maxDate: moment().add(1, "day"),
                chosenLabel: durationInfo().selectedRange,
                alwaysShowCalendars: true,
                autoApply: false,
                autoUpdateInput: false,
                timePicker: false,
                //timePicker24Hour: true,
                ranges: {
                    'Today': [moment(), moment()],
                    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last Week': [moment().subtract(1, 'weeks').startOf('week'), moment().subtract(1, 'weeks').endOf('week')],
                    'Last 4 Weeks': [moment().subtract(4, 'weeks'), moment()],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                    'This Year': [moment().startOf('year'), moment()],
                    'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
                }
            });

            $element.on('apply.daterangepicker', function (ev, picker) {
                getPickerData($(this), picker);
            });

            $element.on('hide.daterangepicker', function (ev, picker) {
                getPickerData($(this), picker);
            });
        }
    };

    ko.bindingHandlers.reportDatePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
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
                    if (val !== '') {
                        viewModel.date = val;
                    }
                }

                $element.datepicker("setEndDate", moment().format("MM/DD/YYYY"));  // nothing greater than today.

                if ($element.hasClass("startDate")) { // if startdate changed adjust limits on Enddate
                    $dependantDatePicker = $element.closest('tr').next().find(".endDate");
                    $dependantDatePicker.datepicker("setStartDate", moment.unix(viewModel.date).format("MM/DD/YYYY"));
                } else if ($element.hasClass("endDate")) {  // if enddate changed adjust limits on startdate
                    $dependantDatePicker = $element.closest('tr').prev().find(".startDate");
                    $dependantDatePicker.datepicker("setEndDate", moment.unix(viewModel.date).format("MM/DD/YYYY"));
                }
            });

            $element.change(function (event) {
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
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).datepicker("setDate", moment.unix(value).format("MM/DD/YYYY"));
        }
    };

    ko.bindingHandlers.reportTimePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                timestamp = valueAccessor(),
                options = {
                    doneText: 'Done',
                    autoclose: true
                };

            $element.clockpicker(options);

            $element.change(function (event) {
                if (ko.isObservable(timestamp)) {
                    timestamp($(element).val());
                } else {
                    timestamp = $(element).val();
                }
            });

            $element.keyup(function (event) {
                if ($element.val().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                    $element.parent().removeClass("has-error");
                    $element.parent().attr("title", "");
                    $element.clockpicker('hide');
                    $element.clockpicker('resetClock');
                    $element.clockpicker('show');
                } else {
                    $element.parent().addClass("has-error");
                    $element.parent().attr("title", "Error in time format");
                }
                if (ko.isObservable(timestamp)) {
                    timestamp($(element).val());
                } else {
                    timestamp = $(element).val();
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
                    $element.clockpicker('hide');
                    $element.clockpicker('resetClock');
                    $element.clockpicker('show');
                } else {
                    event.preventDefault();
                }
            });
        },

        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                value = ko.utils.unwrapObservable(valueAccessor()),
                hr,
                min;

            if (typeof value !== 'string') {
                hr = ('00' + Math.floor(value / 100)).slice(-2);
                min = ('00' + value % 100).slice(-2);
                $element.val(hr + ':' + min);
            } else {
                $element.val(value);
            }
        }
    };

    ko.bindingHandlers.reportPrecisionInput = { // TODO

    };
};

var reportsViewModel = function () {
    var self = this,
        decimalPrecision,
        $direports,
        $tabs,
        $tabConfiguration,
        $tabViewReport,
        $viewReport,
        $rightPanel,
        $spinnertext,
        $pointName1,
        $pointName2,
        $pointName3,
        $pointName4,
        $columnsGrid,
        $filtersGrid,
        $columnsTbody,
        $filtersTbody,
        $filterByPoint,
        $reporttitleInput,
        $reportColumns,
        $additionalFilters,
        $columnNames,
        $configurationContent,
        pointSelectorRef,
        $pointSelectorIframe,
        $popAction,
        reportData,
        activeDataRequests,
        reportSocket,
        exportEventSet,
        totalizerDurationInHours = true,
        Name = "dorsett.reportUI",
        originalPoint = {},
        pointFilter = {
            name1: '',
            name2: '',
            name3: '',
            name4: '',
            selectedPointTypes: []
        },
        pointFilterSearch = {
            name1: '',
            name2: '',
            name3: '',
            name4: '',
            selectedPointTypes: []
        },
        permissionLevels = {
            READ: 1,
            CONTROL: 2,
            ACKNOWLEDGE: 4,
            WRITE: 8
        },
        pointRefArray = [],
        filtersPropertyFields = [],
        columnsPropertyFields = [],
        windowUpi,
        resizeTimer = 400,
        lastResize = null,
        decimalPadding = "0000000000000000000000000000000000000000",
        userCanEdit = function (data, requestedAccessLevel) {
            var cumulativePermissions = 0,
                user = window.workspaceManager.user(),
                groups = user.groups.filter(function (item) {
                    return !!~data.Security.indexOf(item._id);
                }),
                isSystemAdmin = user['System Admin'].Value;

            if (isSystemAdmin) return true;

            for (var i = 0, last = groups.length; i < last; i++) {
                cumulativePermissions |= groups[i]._pAccess;
            }
            return !!(cumulativePermissions & requestedAccessLevel);
        },
        mergePersistedPointRefArray = function (status) {
            return new Promise(function(resolve, reject) {
                var requestObj = {pointid: windowUpi},
                    mergePointArray = function (reportPoint) {
                        point["Point Refs"] = buildPointRefsArray();  // get all points from screen

                        var i,
                            currentUPI,
                            currentAppIndex,
                            persistedPointRef,
                            onscreenPointRefArray = pointRefArray,
                            persistedPointRefArray = reportPoint["Point Refs"];

                        for (i = 0; i < onscreenPointRefArray.length; i++) {
                            currentUPI = onscreenPointRefArray[i].Value;
                            currentAppIndex = onscreenPointRefArray[i].AppIndex;
                            persistedPointRef = persistedPointRefArray.filter(function (pointref) {
                                return (pointref.Value === currentUPI || pointref.AppIndex === currentAppIndex);
                            });
                            if (persistedPointRef.length > 0) {
                                onscreenPointRefArray[i] = persistedPointRef[0];
                            }
                        }

                        point["Point Refs"] = onscreenPointRefArray;
                        self.listOfColumns(validateColumns());
                        self.listOfFilters(validateFilters());
                        resolve(true);
                    };

                ajaxPost(requestObj, "/api/points/getpoint/", mergePointArray);
            });

            //setTimeout(function () {
            //    // wait 1/4 sec
            //}, 250);
            //return true;
        },
        getPointRef = function (appIndex) {
            var answer = pointRefArray.filter(function (pointRef) {
                return (pointRef.AppIndex === appIndex);
            });

            return answer;
        },
        appIndexInPointRefs = function (appIndex) {
            var answer = getPointRef(appIndex);

            return (answer.length > 0);
        },
        pointReferenceSoftDeleted = function (appIndex) {
            var answer = false,
                pointRef;

            if (appIndex >= 0) {
                pointRef = getPointRef(appIndex);
                if (pointRef.length > 0) {
                    if (pointRef[0].PointInst === 0) {
                        answer = true;
                    }
                }
            }

            return answer;
        },
        pointReferenceHardDeleted = function (appIndex) {
            return (!!appIndex && appIndex > 0 && !appIndexInPointRefs(appIndex));
        },
        getMaxAppIndexUsed = function () {
            var answer = 0,
                i;
            for (i = 0; i < pointRefArray.length; i++) {
                if (answer < pointRefArray[i].AppIndex) {
                    answer = pointRefArray[i].AppIndex;
                }
            }
            return answer;
        },
        buildPointRefsArray = function () {
            var filters = self.listOfFilters(),
                //columns = $.extend(true, [], self.listOfColumns()),
                //filters = $.extend(true, [], self.listOfFilters()),
                column,
                filter,
                appIndex = getMaxAppIndexUsed(),
                i,
                pointRef,
                existingPointRef,
                checkColumns = function () {
                    for (i = 0; i < self.listOfColumns().length; i++) {
                        column = self.listOfColumns()[i];
                        if (!!column.upi && column.upi > 0) {
                            existingPointRef = pointRefArray.filter(function (pRef) {
                                return (pRef.Value === column.upi || pRef.AppIndex === column.AppIndex);
                            });

                            if (existingPointRef.length === 0) {
                                pointRef = {};
                                pointRef.PropertyEnum = window.workspaceManager.config.Enums.Properties["Column Point"].enum;
                                pointRef.PropertyName = "Column Point";
                                pointRef.Value = column.upi;
                                pointRef.AppIndex = ++appIndex;
                                pointRef.isDisplayable = true;
                                pointRef.isReadOnly = false;
                                pointRef.PointName = column.colName;
                                pointRef.PointType = window.workspaceManager.config.Enums["Point Types"][column.pointType].enum;
                                pointRef.PointInst = column.upi;
                                pointRef.DevInst = 0;
                                pointRefArray.push(pointRef);
                                column.AppIndex = pointRef.AppIndex;
                            } else {
                                column.AppIndex = existingPointRef[0].AppIndex;
                            }
                        }
                    }
                },
                checkFilters = function () {
                    for (i = 0; i < filters.length; i++) {
                        filter = filters[i];
                        if (filter.valueType === "UniquePID") {
                            existingPointRef = pointRefArray.filter(function (pRef) {
                                return pRef.PointInst === filter.upi;
                            });

                            if (existingPointRef.length === 0) {
                                pointRef = {};
                                pointRef.PropertyEnum = window.workspaceManager.config.Enums.Properties["Qualifier Point"].enum;
                                pointRef.PropertyName = "Qualifier Point";
                                pointRef.Value = filter.upi;
                                pointRef.AppIndex = appIndex++;
                                pointRef.isDisplayable = true;
                                pointRef.isReadOnly = false;
                                pointRef.PointName = filter.value;
                                pointRef.PointType = window.workspaceManager.config.Enums["Point Types"][filter.pointType].enum;
                                pointRef.PointInst = filter.upi;
                                pointRef.DevInst = 0;
                                pointRefArray.push(pointRef);
                            }
                        }
                    }
                };

            switch (self.reportType) {
                case "History":
                case "Totalizer":
                    checkColumns();
                    break;
                case "Property":
                    checkColumns();
                    checkFilters();
                    break;
                default:
                    console.log(" - - - DEFAULT  buildPointRefsArray()");
                    break;
            }

            return pointRefArray;
        },
        buildBitStringHtml = function (config, rawValue, enable) {
            var htmlString = '<div class="bitstringReporting">',
                enumValue;
            for (var key in config.bitstringEnums) {
                if (config.bitstringEnums.hasOwnProperty(key)) {
                    if (key !== "All") {
                        enumValue = rawValue & config.bitstringEnums[key].enum;
                        htmlString += '<input type="checkbox" ' + (enumValue > 0 ? 'checked ' : '') + ' disabled="disabled"><span>' + key + '</span><br>';
                    }
                }
            }
            htmlString += '</div>';

            return htmlString;
        },
        generateUUID = function () {
            var d = new Date().getTime(),
                uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            return uuid;
        },
        toFixed = function (number, p) {
            var precision = parseInt(p, 10),
                abs = Math.abs(parseFloat(number, 10)),
                str = abs.toString(),
                digits = str.split('.')[1],
                negative = number < 0,
                lastNumber,
                mult;

            if (precision === 0) {
                str = abs.toFixed(0);
            } else if (digits && (digits.length > precision)) {
                str = str.substr(0, parseInt(str.indexOf('.'), 10) + parseInt(precision, 10) + 2);
                lastNumber = str.charAt(str.length - 1);
                str = str.substr(0, str.length - 1);
                if (lastNumber >= 5) {
                    mult = Math.pow(10, str.length - str.indexOf('.') - 1);
                    str = (+str + 1 / mult).toFixed(precision);
                }
            } else {  // pad decimal places
                str = str.split('.')[0] + "." + String((!!digits ? digits : "") + decimalPadding).slice(0, precision);
            }

            return (negative ? "-" : "") + str;
        },
        toFixedComma = function (number, precision) {
            var fixedNum = toFixed(number, (precision === undefined) ? 128 : precision);
            return numberWithCommas(fixedNum);
        },
        numberWithCommas = function (theNumber) {
            var arr;
            if (theNumber !== null && theNumber !== undefined) {
                if (theNumber.toString().indexOf(".") > 0) {
                    arr = theNumber.toString().split('.');
                    return arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + arr[1];
                } else {
                    return theNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }
            } else {
                return "";
            }
        },
        columnCanBeCalculated = function (column) {
            var result = false,
                valueOptions;
            if (self.reportType === "Totalizer") {
                result = true;
            } else {
                switch (column.valueType) {
                    case "Unsigned":
                    case "Float":
                    case "Integer":
                        result = true;
                        break;
                }
                switch (column.pointType) {
                    case "Accumulator":
                    case "Analog Input":
                    case "Analog Output":
                    case "Analog Value":
                    case "Average":
                    case "Binary Input":
                    case "Binary Output":
                    case "Binary Value":
                    case "Math":
                    case "Totalizer":
                        valueOptions = window.workspaceManager.config.Templates.getTemplate(column.pointType).Value.ValueOptions;
                        result = (valueOptions === undefined);
                        break;
                }
            }

            return result;
        },
        blockUI = function ($control, state, text) {
            if (state === true) {
                $control.hide();
                //$spinnertext.text(text);
            } else {
                $control.show();
                //$spinnertext.text("");
            }
            $control.attr('disabled', state);
        },
        checkForColumnCalculations = function () {
            var i,
                columns = $.extend(true, [], self.listOfColumns()),
                len = columns.length;

            for (i = 0; i < len; i++) {
                if (!!columns[i].canCalculate && columns[i].canCalculate === true) {
                    $columnsGrid.find(".calculateColumn").show();
                    $columnsGrid.find(".precisionColumn").show();
                    break;
                }
            }

            if (self.reportType === "Totalizer") {
                $columnsGrid.find(".typeColumn").show();
            }
        },
        updateListOfFilters = function (newArray) {
            self.listOfFilters([]);
            if (self.reportType === "Property") {
                self.listOfFilters(setFiltersParentChildLogic(newArray));
            } else {
                self.listOfFilters(newArray);
            }
            self.designChanged(true);
            self.unSavedDesignChange(true);
            self.refreshData(true);
        },
        updateListOfColumns = function (newArray) {
            self.listOfColumns([]);
            self.listOfColumns(newArray);
            checkForColumnCalculations();
            self.designChanged(true);
            self.unSavedDesignChange(true);
            self.refreshData(true);
        },
        setFiltersParentChildLogic = function (array) {
            var filters = array,
                len = filters.length,
                i,
                orConditionFound = false,
                calcEndGroup = function (index) {
                    var answer = false,
                        nextCondition = ((index + 1) < len) ? filters[index + 1] : undefined;

                    if ((!!nextCondition && nextCondition.condition === "$or") || (index === (len - 1))) {
                        answer = true;
                    }

                    return answer;
                };


            for (i = 0; i < len; i++) {
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
        ajaxPost = function (input, url, callback) {
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(input)
            }).done(function (returnData) {
                if (callback) {
                    callback.call(self, returnData);
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                //self.errorWithRequest(true);
            }).always(function () {
                // hey hey
            });
        },
        displayError = function (errorMessage) {
            var $errorMessageholder = $tabConfiguration.find(".screenMessages").find(".errorMessage");
            $errorMessageholder.text(errorMessage);
            setTimeout(function () {
                $errorMessageholder.text("");
            }, 6000);  // display error message
        },
        openPointSelectorForColumn = function (selectObjectIndex, upi, newUrl) {
            var url = newUrl || '/pointlookup/' + encodeURI("Report") + '/' + encodeURI("Column Point") + "?mode=select",
                getPointURL = "/api/points/getpoint",
                windowRef, //
                objIndex = selectObjectIndex,
                updatedList = $.extend(true, [], self.listOfColumns()),
                tempObject = updatedList[selectObjectIndex],
                setColumnPoint = function (selectedPoint) {
                    tempObject.upi = selectedPoint._id;
                    tempObject.valueType = "None";
                    tempObject.colName = selectedPoint.Name;
                    tempObject.colDisplayName = selectedPoint.Name;
                    tempObject.pointType = selectedPoint["Point Type"].Value;
                    tempObject.canCalculate = columnCanBeCalculated(tempObject);
                    if (selectedPoint["Engineering Units"]) {
                        tempObject.units = selectedPoint["Engineering Units"].Value;
                    }
                    if (tempObject.canCalculate) {
                        tempObject.precision = 3;
                    }
                    tempObject.calculation = "";
                    tempObject.valueOptions = undefined;
                    if (self.reportType === "Totalizer") {
                        tempObject.valueList = getTotalizerValueList(tempObject.pointType);
                        tempObject.operator = tempObject.valueList[0].text;
                        //tempObject.operator = (tempObject.valueList.length === 1 ? tempObject.valueList[0].text : "");
                    } else {
                        if (!!selectedPoint.Value.ValueOptions) {
                            tempObject.valueOptions = selectedPoint.Value.ValueOptions;
                        } else {
                            tempObject.valueOptions = window.workspaceManager.config.Templates.getTemplate(tempObject.pointType).Value.ValueOptions;
                        }
                    }
                    updatedList[objIndex] = tempObject;
                    updateListOfColumns(updatedList);
                },
                pointSelectedCallback = function (pid, name, type, filter) {
                    if (!!pid) {
                        ajaxPost({pointid: pid}, getPointURL, setColumnPoint);
                    }
                    pointFilterSearch.name1 = filter.filter1;
                    pointFilterSearch.name2 = filter.filter2;
                    pointFilterSearch.name3 = filter.filter3;
                    pointFilterSearch.name4 = filter.filter4;
                    pointFilterSearch.selectedPointTypes = filter.selectedPointTypes;
                },
                windowOpenedCallback = function () {
                    windowRef.pointLookup.MODE = 'select';
                    windowRef.pointLookup.init(pointSelectedCallback, pointFilterSearch);
                };

            windowRef = window.workspaceManager.openWindowPositioned(url, 'Select Point', '', '', 'Select Point Column', {
                callback: windowOpenedCallback,
                width: 1000
            });
        },
        openPointSelectorForFilter = function (selectObjectIndex, upi, newUrl) {
            var url = newUrl || '/pointlookup/' + encodeURI("Report") + '/' + encodeURI(self.listOfFilters()[selectObjectIndex].filterName) + "?mode=select",
                windowRef,
                objIndex = selectObjectIndex,
                updatedList = self.listOfFilters(),
                tempObject = updatedList[selectObjectIndex],
                pointSelectedCallback = function (pid, name, type, filter) {
                    if (!!pid) {
                        tempObject.upi = pid;
                        tempObject.valueType = "UniquePID";
                        tempObject.value = name;
                        tempObject.pointType = type;
                        if (!!tempObject.softDeleted) {
                            delete tempObject.softDeleted;
                        }
                        updatedList[objIndex] = tempObject;
                        updateListOfFilters(updatedList);
                    }
                    pointFilterSearch.name1 = filter.filter1;
                    pointFilterSearch.name2 = filter.filter2;
                    pointFilterSearch.name3 = filter.filter3;
                    pointFilterSearch.name4 = filter.filter4;
                },
                windowOpenedCallback = function () {
                    windowRef.pointLookup.MODE = 'select';
                    windowRef.pointLookup.init(pointSelectedCallback, pointFilterSearch);
                };

            windowRef = window.workspaceManager.openWindowPositioned(url, 'Select Point', '', '', 'Select Point Filter', {
                callback: windowOpenedCallback,
                width: 1000
            });
        },
        filterOpenPointSelector = function () {
            var url = '/pointLookup',
                tempObject = {
                    upi: 0,
                    valueType: "",
                    colName: "",
                    colDisplayName: ""
                },
                pointSelectedCallback = function (pid, name, type, filter) {
                    if (!!pid) {
                        tempObject.upi = pid;
                        tempObject.valueType = "String";
                        tempObject.colName = name;
                        tempObject.colDisplayName = name;
                    }
                },
                windowOpenedCallback = function () {
                    pointSelectorRef.pointLookup.MODE = 'select';
                    pointSelectorRef.pointLookup.init(pointSelectedCallback, pointFilter);
                    if (pointFilter.selectedPointTypes.length > 0) {
                        pointSelectorRef.window.pointLookup.checkPointTypes(pointFilter.selectedPointTypes);
                    }
                    if (!self.canEdit()) {
                        var $allInputFields = $pointSelectorIframe.contents().find("input,button,textarea,select"),
                            $pointTypesListBox = $pointSelectorIframe.contents().find("#pointTypes");
                        $allInputFields.prop("disabled", true);
                        // TODO still need to disable the listbox so selections can't change
                        //$pointTypesListBox.addClass("jqx-disableselect");
                        //var items = $pointTypesListBox.jqxListBox('getItems');
                        //$pointTypesListBox.jqxListBox('disableAt', 0 );
                    }
                };

            pointSelectorRef = window.workspaceManager.openWindowPositioned(url, 'Select Point', '', '', 'filter', {
                callback: windowOpenedCallback,
                width: 1000
            });
        },
        getFilterAdjustedDatetime = function (filter) {
            return getAdjustedDatetime(filter.date, filter.time.toString());
        },
        getAdjustedDatetime = function (date, time) {
            var result,
                timestamp = parseInt(time.replace(':', ''), 10),
                hour = ('00' + Math.floor(timestamp / 100)).slice(-2),
                min = ('00' + timestamp % 100).slice(-2);

            result = moment.unix(date).startOf('day');
            result = result.add(hour, 'h');
            result = result.add(min, 'm');

            return result.unix();
        },
        initializeNewFilter = function (selectedItem, filter) {
            var localFilter = filter,
                prop = getProperty(selectedItem.name);

            localFilter.filterName = selectedItem.name;
            localFilter.condition = "$and";
            localFilter.operator = "EqualTo";
            localFilter.childLogic = false;
            localFilter.valueType = prop.valueType;
            localFilter.value = setDefaultValue(localFilter.valueType);
            localFilter.valueList = getValueList(selectedItem.name, selectedItem.name);
            switch (localFilter.valueType) {
                case "Timet":
                case "DateTime":
                    localFilter.date = moment().unix();
                    localFilter.time = 0;
                    break;
                case "HourMinSec":
                case "HourMin":
                case "MinSec":
                    localFilter.hours = 0;
                    localFilter.minutes = 0;
                    localFilter.seconds = 0;
                    break;
                case "Enum":
                    localFilter.evalue = -1;
                    break;
            }

            return localFilter;
        },
        setDefaultValue = function (valueType) {
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
        validateColumns = function (cleanup) {
            var results = [],
                localArray = $.extend(true, [], self.listOfColumns()),
                i,
                pointRef,
                column,
                validColumn,
                push;

            for (i = 0; i < localArray.length; i++) {
                column = localArray[i];
                validColumn = true;
                push = true;
                if (column.colName === "Choose Point") {
                    push = false;
                } else if ((self.reportType === "Totalizer") || (self.reportType === "History")) {
                    if (i > 0 && !!column.AppIndex) { //  skip first column  "Date"
                        pointRef = getPointRef(column.AppIndex);
                        if (pointRef.length > 0) { // in case of a rename since last report save
                            column.colName = pointRef[0].PointName;
                            column.softDeleted = (pointRef[0].PointInst === 0); // check for softdelete since last save
                        } else {  // upi not in pointref array
                            push = false;
                        }
                    }
                }

                if (push) {
                    results.push(column);
                }
                if (cleanup && validColumn) {
                    delete results[results.length - 1]["valueList"];  // valuelist is only used in UI
                    delete results[results.length - 1]["dataColumnName"]; // dataColumnName is only used in UI
                    delete results[results.length - 1]["rawValue"]; // rawValue is only used in UI
                    delete results[results.length - 1]["error"]; // error is only used in UI
                    delete results[results.length - 1]["softDeleted"]; // error is only used in UI
                    delete results[results.length - 1]["bitstringEnums"]; // error is only used in UI
                }
            }

            console.log(" validateColumns() results.length = " + results.length);
            return results;
        },
        getColumnConfigByColName = function (columnName) {
            var result;
            result = self.listOfColumns().filter(function (col) {
                return col.colName === columnName;
            });
            return result[0];
        },
        getColumnConfigByOperatorAndUPI = function (op, upi) {
            var result;
            result = self.listOfColumns().filter(function (col) {
                return (col.operator.toLowerCase() === op.toLowerCase() && col.upi === upi);
            });
            return result[0];
        },
        getColumnConfigByUPI = function (upi) {
            var result;
            result = self.listOfColumns().filter(function (col) {
                return (col.upi === upi);
            });
            return result[0];
        },
        validateFilters = function (cleanup) {
            var results = [],
                valid,
                filters = $.extend(true, [], self.listOfFilters()),
                i;

            for (i = 0; i < filters.length; i++) {
                if (filters[i].filterName !== "") {
                    valid = true;
                    switch (filters[i].valueType) {
                        case "Timet":
                        case "DateTime":
                            if (moment.unix(filters[i].date).isValid()) {
                                filters[i].error = undefined;
                            } else {
                                valid = false;
                                filters[i].error = "Invalid Date format in Filters";
                            }
                            if (parseInt(filters[i].time, 10) === 0) {
                                filters[i].time = "00:00";
                            } else {
                                if (filters[i].time.toString().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                                    filters[i].value = getFilterAdjustedDatetime(filters[i]);
                                    filters[i].error = undefined;
                                } else {
                                    valid = false;
                                    filters[i].error = "Invalid Time format in Filters";
                                }
                            }
                            break;
                        case "HourMinSec":
                        case "HourMin":
                        case "MinSec":
                            filters[i].hours = parseInt(filters[i].hours, 10);
                            filters[i].minutes = parseInt(filters[i].minutes, 10);
                            filters[i].seconds = parseInt(filters[i].seconds, 10);
                            filters[i].value = parseInt(filters[i].hours * 3600, 10);
                            filters[i].value += parseInt(filters[i].minutes * 60, 10);
                            filters[i].value += parseInt(filters[i].seconds, 10);
                            break;
                    }
                    results.push(filters[i]);
                    if (cleanup && valid) {  // clean fields only used during UI
                        delete results[results.length - 1]["valueList"];
                        delete results[results.length - 1]["error"];
                        delete results[results.length - 1]["softDeleted"];
                    }
                }
            }

            return results;
        },
        initFilters = function (theFilters) {
            var result = [],
                i,
                pointRef,
                currentFilter,
                len = theFilters.length;

            for (i = 0; i < len; i++) {
                currentFilter = theFilters[i];

                if (!!currentFilter.upi && currentFilter.upi > 0) {
                    if (!!currentFilter.AppIndex) {
                        if (!pointReferenceHardDeleted(currentFilter.AppIndex)) {
                            if (pointReferenceSoftDeleted(currentFilter.AppIndex)) {
                                console.log("softdeleted theFilters[" + i + "].upi = " + currentFilter.upi);
                                currentFilter.softDeleted = true;
                            }
                            if (!!currentFilter.upi && currentFilter.upi > 0) {
                                pointRef = getPointRef(currentFilter.upi);
                                if (pointRef.length > 1) {
                                    // found more than one reference in Point Ref array for UPI, sup wit dat?
                                }
                                currentFilter.value = pointRef[0].PointName;
                            }
                        } else {
                            console.log("point being referenced doesn't exist in local Point Refs array  theFilters[" + i + "].upi = " + theFilters[i].upi);
                        }
                    }
                }

                result.push(currentFilter);
                result[i].valueList = getValueList(result[i].filterName, result[i].filterName);
            }

            return result;
        },
        initColumns = function (theColumns) {
            var result = [],
                i,
                pointRef,
                len = theColumns.length,
                currentColumn,
                validColumn = true;

            for (i = 0; i < len; i++) {
                currentColumn = theColumns[i];

                if (!!currentColumn.upi && currentColumn.upi > 0) {
                    if(!!currentColumn.AppIndex) {
                        pointRef = getPointRef(currentColumn.AppIndex);
                        if (!pointReferenceHardDeleted(currentColumn.AppIndex)) {
                            if (pointReferenceSoftDeleted(currentColumn.AppIndex)) {
                                console.log("softdeleted theColumns[" + i + "].upi = " + theColumns[i].upi);
                                currentColumn.softDeleted = true;
                            }
                            currentColumn.colName = pointRef[0].PointName;
                        } else {
                            validColumn = false;
                            // point being referenced doesn't exist in local Point Refs array
                            console.log("point being referenced doesn't exist in local Point Refs array  theColumns[" + i + "].upi = " + theColumns[i].upi);
                        }
                        if (pointRef.length > 1) {
                            // found more than one reference in Point Ref array for UPI, sup wit dat?
                        }
                    }
                }

                if (validColumn) {
                    switch (self.reportType) {
                        case "Property":
                            currentColumn.canCalculate = columnCanBeCalculated(currentColumn);
                            if (currentColumn.valueType === "BitString") {
                                currentColumn.bitstringEnums = window.workspaceManager.config.Enums[currentColumn.colName + ' Bits'];
                            }
                            break;
                        case "History":
                        case "Totalizer":
                            if (currentColumn.colDisplayName === undefined) { // TODO: remove once YDK reports have been opened and saved
                                currentColumn.colDisplayName = currentColumn.colName;
                            }
                            currentColumn.valueList = getTotalizerValueList(currentColumn.pointType);
                            currentColumn.canCalculate = true;
                            break;
                        default:
                            console.log(" - - - DEFAULT  initColumns()");
                            break;
                    }
                    result.push(currentColumn);
                }
            }
            return result;
        },
        getValueList = function (property, pointType) {
            var result = [],
                i,
                options = window.workspaceManager.config.Utility.pointTypes.getEnums(property, pointType),
                len = (options && options.length ? options.length : 0);

            for (i = 0; i < len; i++) {
                result.push({
                    value: options[i].name,
                    evalue: options[i].value
                });
            }

            return result;
        },
        getTotalizerValueList = function (pointType) {
            var result = [];

            if (pointType) {
                switch (pointType) {
                    case "Binary Input":
                    case "Binary Output":
                    case "Binary Value":
                        result.push({text: "Starts"});
                        result.push({text: "Runtime"});
                        break;
                    default:
                        result.push({text: "Total"});
                        break;
                }
            }

            return result;
        },
        getProperty = function (key) {
            return window.workspaceManager.config.Enums.Properties[key];
        },
        collectEnumProperties = function () {
            getPointPropertiesForFilters();
            getPointPropertiesForColumns();
        },
        getPointPropertiesForFilters = function () {
            var props = window.workspaceManager.config.Enums.Properties,
                listOfKeysToSkip = [],
                prop,
                key;

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
        getPointPropertiesForColumns = function () {
            var listOfKeysToRemove = ["Name"];

            columnsPropertyFields = filtersPropertyFields.filter(function (enumProp) {
                return ($.inArray(enumProp.name, listOfKeysToRemove) === -1);
            });
            self.listOfColumnPropertiesLength = columnsPropertyFields.length;
        },
        getKeyBasedOnValue = function (obj, value) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (obj[key] === parseInt(value, 10)) {
                        return key;
                    }
                }
            }
        },
        buildReportDataRequestPromise = function () {
            return new Promise(function(resolve, reject) {
                mergePersistedPointRefArray(true).then(function (response) {
                    console.log("mergePersistedPointRefArray() Success!", response);
                    resolve(buildReportDataRequest());
                }, function (error) {
                    console.error("buildReportDataRequestPromise() --> mergePersistedPointRefArray() Failed!", error);
                    reject(null);
                });
            });
        },
        buildReportDataRequest = function () {
            var result,
                i,
                columns,
                filters,
                filter,
                activeError = false,
                key,
                upis = [],
                uuid;

            columns = $.extend(true, [], self.listOfColumns());
            filters = $.extend(true, [], self.listOfFilters());

            if (columns.length > 1) {
                // collect UPIs from Columns
                for (i = 0; i < columns.length; i++) {
                    if (!!columns[i].error) {
                        displayError(columns[i].error);
                        activeError = true;
                    } else {
                        if (columns[i].upi > 0) {
                            upis.push({
                                upi: parseInt(columns[i].upi, 10),
                                op: (columns[i].operator).toLowerCase()
                            })
                        }
                    }
                }

                if (self.reportType === "Totalizer" || self.reportType === "History") {
                    self.startDate = getAdjustedDatetime(self.selectedDuration().startDate.unix(), self.durationStartTimeOffSet());
                    self.endDate = getAdjustedDatetime(self.selectedDuration().endDate.unix(), self.durationEndTimeOffSet());
                } else {
                    for (key in filters) {
                        if (filters.hasOwnProperty(key)) {
                            filter = filters[key];
                            if (!!filter.error) {
                                displayError(filter.error);
                                activeError = true;
                            }
                        }
                    }
                }

                if (!activeError) {
                    switch (self.reportType) {
                        case "History":
                        case "Totalizer":
                            point["Report Config"].interval = {
                                text: self.interval(),
                                value: self.intervalValue()
                            };
                            point["Report Config"].duration = {
                                startDate: self.selectedDuration().startDate.unix(),
                                endDate: self.selectedDuration().endDate.unix(),
                                startTimeOffSet: self.durationStartTimeOffSet(),
                                endTimeOffSet: self.durationEndTimeOffSet(),
                                duration: self.selectedDuration().endDate.diff(self.selectedDuration().startDate),
                                selectedRange: self.selectedDuration().selectedRange
                            };
                            break;
                        case "Property":
                            pointFilter = getPointLookupFilterValues($pointSelectorIframe.contents());
                            break;
                        default:
                            console.log(" - - - DEFAULT  buildReportDataRequest()");
                            break;
                    }

                    point["Report Config"].pointFilter = pointFilter;
                    point["Report Config"].columns = columns;
                    point["Report Config"].filters = filters;

                    uuid = generateUUID();
                    activeDataRequests.push(uuid);

                    result = {
                        requestID: uuid,
                        upis: upis,
                        range: {
                            start: self.startDate,
                            end: self.endDate
                        },
                        reportConfig: point["Report Config"],
                        reportType: point["Report Type"].Value,
                        sort: ""
                    }
                }
            } else {
                displayError("Column list is blank. Nothing to report on.");
            }

            return result;
        },
        tabSwitch = function (tabNumber) {
            if ($.isNumeric(tabNumber)) {
                $tabs.find("li").removeClass("active");
                $tabs.find("li:eq(" + (tabNumber - 1) + ")").addClass("active");
            }
            self.currentTab(tabNumber);
            switch (tabNumber) {
                case 1:
                    $tabConfiguration.addClass("active");
                    $tabConfiguration.show();
                    $tabViewReport.removeClass("active");
                    $tabViewReport.hide();
                    $popAction.show();
                    break;
                case 2:
                    $tabConfiguration.removeClass("active");
                    $tabConfiguration.hide();
                    $tabViewReport.addClass("active");
                    $popAction.hide();
                    break;
            }
        },
        initSocket = function (cb) {
            reportSocket = io.connect(window.location.origin);

            reportSocket.on('connect', function () {
                console.log('SOCKETID:', reportSocket.id);
                if (cb) {
                    cb();
                }
            });

            reportSocket.on('returnReport', function (data) {
                if (data.err === null) {
                    //parseReturnedData(data.results);
                } else {
                    console.log("Error while retrieving data");
                }
            });

        },
        getScreenFields = function () {
            $direports = $(".direports");
            $tabs = $direports.find(".tabs");
            $tabConfiguration = $direports.find(".tabConfiguration");
            $tabViewReport = $direports.find(".tabViewReport");
            $viewReport = $direports.find(".viewReport");
            $rightPanel = $direports.find(".rightPanel");
            $spinnertext = $rightPanel.find(".spinnertext");
            $pointName1 = $direports.find(".pointName1");
            $pointName2 = $direports.find(".pointName2");
            $pointName3 = $direports.find(".pointName3");
            $pointName4 = $direports.find(".pointName4");
            $columnsGrid = $direports.find(".columnsGrid");
            $filtersGrid = $direports.find(".filtersGrid");
            $columnNames = $direports.find(".columnName");
            $filterByPoint = $direports.find("#filterByPoint");
            $pointSelectorIframe = $filterByPoint.find(".pointLookupFrame");
            $reporttitleInput = $direports.find(".reporttitle").find("input");
            $filtersTbody = $direports.find('.filtersGrid tbody');
            $columnsTbody = $direports.find('.columnsGrid .sortablecolums');
            $reportColumns = $direports.find("#reportColumns");
            $additionalFilters = $direports.find("#additionalFilters");
            $configurationContent = $direports.find(".configurationContent");
            $popAction = $direports.find(".pop.cursorPointer");
        },
        getPointLookupFilterValues = function (iFrameContents) {
            var $nameInputField,
                pf = {
                    name1: "",
                    name2: "",
                    name3: "",
                    name4: "",
                    selectedPointTypes: []
                },
                inputCounter = 1;

            iFrameContents.find(".toolbar").find(".searchInput").each(function () {
                $nameInputField = $(this);
                pf["name" + inputCounter++] = $nameInputField.val();
            });
            pf.selectedPointTypes = getPointLookupSelectedValues(pointSelectorRef);

            return pf;
        },
        getPointLookupSelectedValues = function (pointSelectorReference) {
            var answer = [],
                selectedPointTypes,
                numberOfAllPointTypes;
            if (pointSelectorReference && pointSelectorReference.window.pointLookup) {
                selectedPointTypes = pointSelectorReference.window.pointLookup.getCheckedPointTypes();
                numberOfAllPointTypes = pointSelectorReference.window.pointLookup.POINTTYPES.length;
                if (numberOfAllPointTypes !== selectedPointTypes.length) {
                    answer = selectedPointTypes;
                }
            }
            return answer;
        },
        getDurationText = function (duration, precision, hoursOnly) {
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
                    answer += (hour > 1 ? toFixedComma(hour, precision) + " hours " : "");
                    answer += (min > 0 ? toFixedComma(min, precision) + " mins " : "");
                    answer += (sec > 0 ? toFixedComma(sec, precision) + " secs" : "");
                }
            }

            return (answer !== "" ? answer : 0);
        },
        formatDataField = function (dataField, columnConfig) {
            var keyBasedValue,
                htmlString = "",
                temp,
                $customField,
                rawValue = dataField.Value;

            dataField.rawValue = rawValue;
            if (!!columnConfig) {
                switch (columnConfig.valueType) {
                    case "MinSec":
                        htmlString = '<div class="durationCtrl durationDisplay"><span class="min"></span><span class="timeSeg">min</span><span class="sec"></span><span class="timeSeg">sec</span></div>';
                        $customField = $(htmlString);
                        $customField.find(".min").html(~~((rawValue % 3600) / 60));
                        $customField.find(".sec").html(rawValue % 60);
                        dataField.Value = $customField.html();
                        break;
                    case "HourMin":
                        htmlString = '<div class="durationCtrl durationDisplay"><span class="hr"></span><span class="timeSeg">hr</span><span class="min"></span><span class="timeSeg">min</span></div>';
                        $customField = $(htmlString);
                        $customField.find(".hr").html(~~(rawValue / 3600));
                        $customField.find(".min").html(~~((rawValue % 3600) / 60));
                        dataField.Value = $customField.html();
                        break;
                    case "HourMinSec":
                        htmlString = '<div class="durationCtrl durationDisplay"><span class="hr"></span><span class="timeSeg">hr</span><span class="min"></span><span class="timeSeg">min</span><span class="sec"></span><span class="timeSeg">sec</span></div>';
                        $customField = $(htmlString);
                        $customField.find(".hr").html(~~(rawValue / 3600));
                        $customField.find(".min").html(~~((rawValue % 3600) / 60));
                        $customField.find(".sec").html(rawValue % 60);
                        dataField.Value = $customField.html();
                        break;
                    case "Float":
                    case "Integer":
                    case "Unsigned":
                        if ($.isNumeric(rawValue)) {
                            dataField.Value = toFixedComma(rawValue, columnConfig.precision);
                        } else {
                            dataField.Value = rawValue;
                        }
                        break;
                    case "String":
                        if ($.isNumeric(rawValue)) {
                            dataField.Value = toFixedComma(rawValue, columnConfig.precision);
                        } else {
                            dataField.Value = rawValue;
                        }
                        break;
                    case "Bool":
                        temp = dataField.Value.toString().toLowerCase();
                        dataField.Value = temp[0].toUpperCase() + temp.substring(1);
                        break;
                    case "BitString":
                        htmlString = buildBitStringHtml(columnConfig, rawValue, false);
                        $customField = $(htmlString);
                        dataField.Value = $customField.html();
                        break;
                    case "Enum":
                    case "undecided":
                    case "null":
                    case "None":
                        if ($.isNumeric(rawValue)) {
                            dataField.Value = toFixedComma(rawValue, columnConfig.precision);
                        } else {
                            dataField.Value = rawValue;
                        }
                        break;
                    case "DateTime":
                    case "Timet":
                        if ($.isNumeric(rawValue) && rawValue > 0) {
                            dataField.Value = moment.unix(rawValue).format("MM/DD/YY HH:mm");
                        } else {
                            dataField.Value = rawValue;
                        }
                        break;
                    case "UniquePID":
                        if (dataField.PointInst !== undefined) {
                            if (dataField.PointInst > 0) {
                                dataField.Value = dataField.PointName;
                                dataField.rawValue = dataField.PointName;
                            } else {
                                dataField.Value = "";
                                dataField.rawValue = "";
                            }
                        } else {
                            //console.log("dataField.PointInst is UNDEFINED");
                        }
                        break;
                    default:
                        dataField.Value = rawValue;
                        break;
                }

                if (columnConfig.valueOptions !== undefined) {
                    keyBasedValue = getKeyBasedOnValue(columnConfig.valueOptions, rawValue);
                    if (!!keyBasedValue) {
                        dataField.Value = keyBasedValue;
                    }
                }
            } else {
                console.log("formatDataField()  columnConfig is undefined");
            }
            return dataField;
        },
        pivotHistoryData = function (historyData) {
            var columnConfig,
                columnUPI,
                pivotedData = [],
                tempPivot,
                lenHistoryData = historyData.length,
                now = moment().unix(),
                i,
                j,
                historyResults = [];

            for (i = 0; i < lenHistoryData; i++) {
                if (now > historyData[i].timestamp) { // skip any results greater than "now" (those results are zero placeholders)
                    historyResults = historyData[i].HistoryResults;
                    tempPivot = {};
                    tempPivot["Date"] = {};
                    tempPivot["Date"].Value = moment.unix(historyData[i].timestamp).format("MM/DD/YY HH:mm");
                    tempPivot["Date"].rawValue = historyData[i].timestamp;
                    for (j = 0; j < historyResults.length; j++) {
                        columnUPI = historyResults[j].upi;
                        tempPivot[columnUPI] = {};
                        if (historyResults[j].Value === undefined) {
                            tempPivot[columnUPI].Value = "";
                            tempPivot[columnUPI].rawValue = "";
                        } else {
                            columnConfig = getColumnConfigByUPI(columnUPI);
                            if (columnConfig === undefined) {
                                console.log("ERROR: columnConfig is undefined for columnName = " + columnUPI);
                            }
                            //console.log("[" + i + "] ==>  historyResults[" + j + "].Value = " + historyResults[j].Value);
                            tempPivot[columnUPI] = formatDataField(historyResults[j], columnConfig);
                        }
                    }
                    pivotedData.push(tempPivot);
                }
            }

            return pivotedData;
        },
        pivotTotalizerData = function (totalizerData) {
            var columnConfig,
                columnUPI,
                pivotedData = [],
                tempPivot,
                rawValue,
                operator,
                numberOfColumnsFound = totalizerData.length,
                now = moment().unix(),
                i,
                j;

            if (numberOfColumnsFound > 0 && totalizerData[0].totals) {
                for (j = 0; j < totalizerData[0].totals.length; j++) {
                    if (now > totalizerData[0].totals[j].range.start) { // skip any results greater than "now" (those results are zero placeholders)
                        tempPivot = {};
                        tempPivot["Date"] = {};
                        tempPivot["Date"].Value = moment.unix(totalizerData[0].totals[j].range.start).format("MM/DD/YY HH:mm");
                        tempPivot["Date"].rawValue = totalizerData[0].totals[j].range.start;
                        for (i = 0; i < numberOfColumnsFound; i++) {
                            operator = totalizerData[i].op.toLowerCase();
                            columnConfig = getColumnConfigByOperatorAndUPI(operator, totalizerData[i].upi);
                            columnUPI = columnConfig.upi + " - " + operator;
                            rawValue = totalizerData[i].totals[j].total;
                            tempPivot[columnUPI] = {};
                            //console.log("totalizerData[" + i + "].totals[" + j + "].total = " + totalizerData[i].totals[j]);
                            if (totalizerData[i].totals[j].total === undefined) {
                                tempPivot[columnUPI].Value = "";
                                tempPivot[columnUPI].rawValue = "";
                            } else {
                                if (operator === "runtime") {
                                    tempPivot[columnUPI].Value = (rawValue === 0 ? 0 : getDurationText(rawValue, columnConfig.precision, totalizerDurationInHours));
                                } else {
                                    tempPivot[columnUPI].Value = toFixedComma(rawValue, columnConfig.precision);
                                }
                                tempPivot[columnUPI].rawValue = parseFloat(rawValue);
                            }
                        }
                        pivotedData.push(tempPivot);
                    }
                }
            }

            return pivotedData;
        },
        cleanResultData = function (data) {
            var columnArray = $.extend(true, [], self.listOfColumns()),
                columnConfig,
                i,
                len = data.length,
                j,
                columnsLength = columnArray.length,
                columnName,
                columnDataFound,
                rawValue;

            for (i = 0; i < len; i++) {
                for (j = 0; j < columnsLength; j++) {
                    columnConfig = {};
                    columnConfig = columnArray[j];
                    columnName = (columnConfig.dataColumnName !== undefined ? columnConfig.dataColumnName : columnConfig.colName);
                    columnDataFound = (data[i][columnName] !== undefined);

                    if (!columnDataFound) {  // data was NOT found for this column
                        data[i][columnName] = {};
                        data[i][columnName] = data[i][columnName];
                        data[i][columnName].Value = "";
                        data[i][columnName].rawValue = "";
                    } else if (typeof data[i][columnName] !== 'object') {
                        rawValue = data[i][columnName];
                        data[i][columnName] = {};
                        data[i][columnName].Value = rawValue;
                        data[i][columnName].rawValue = rawValue;
                    }

                    if (columnDataFound) {
                        data[i][columnName] = formatDataField(data[i][columnName], columnConfig);
                    }
                }
            }
            return data;
        },
        adjustDatatableHeight = function () {
            var infoscanHeader = 60,
                adjustHeight,
                $dataTablesScrollBody = $tabViewReport.find('.dataTables_scrollBody'),
                $dataTablesWrapper = $tabViewReport.find('.dataTables_wrapper');
            $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
            setInfoBarDateTime();
            adjustHeight = $dataTablesScrollBody.height() - (($dataTablesWrapper.height() + infoscanHeader) - window.innerHeight);
            $dataTablesScrollBody.css('height', adjustHeight);
        },
        adjustConfigTabActivePaneHeight = function () {
            var $activePane = $direports.find(".tabConfiguration .tab-pane.active");
            if ($activePane.attr("id") === "additionalFilters" || $activePane.attr("id") === "reportColumns") {
                $activePane.css('height', (window.innerHeight - 200));
            } else if ($activePane.attr("id") === "reportAttribs") {
                $activePane.css('height', (window.innerHeight - 350));
            }
        },
        handleResize = function () {
            lastResize = new Date();
            setTimeout(function () {
                if (new Date() - lastResize >= resizeTimer) {
                    if (self.currentTab() === 2) {
                        adjustDatatableHeight();
                    } else {
                        adjustConfigTabActivePaneHeight();
                    }
                }
            }, resizeTimer);
        },
        saveReportConfig = function () {
            //mergePersistedPointRefArray(true).then(function (response) {
                point._pStatus = 0;  // activate report
                point["Report Config"].columns = validateColumns(true);
                point["Report Config"].filters = validateFilters(true);
                pointFilter = getPointLookupFilterValues($pointSelectorIframe.contents());
                point["Report Config"].pointFilter = pointFilter;
                point["Report Config"].selectedPageLength = self.selectedPageLength();
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        point["Report Config"].interval = {
                            text: self.interval(),
                            value: self.intervalValue()
                        };
                        point["Report Config"].duration = {
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
                point.name1 = $pointName1.val();
                point.name2 = $pointName2.val();
                point.name3 = $pointName3.val();
                point.name4 = $pointName4.val();
                point.Name = self.reportDisplayTitle();

                reportSocket.emit('updatePoint', JSON.stringify({
                    'newPoint': point,
                    'oldPoint': originalPoint
                }));
            //}, function (error) {
            //    console.error("saveReportConfig() --> mergePersistedPointRefArray() Failed!", error);
            //    reject(result);
            //});
        },
        setReportEvents = function () {
            var intervals,
                calculations,
                entriesPerPage;

            $(window).resize(function () {
                handleResize();
            });

            $columnNames.on('click', function (e) {
                openPointSelectorForColumn();
                e.preventDefault();
                e.stopPropagation();
            });

            $direports.find(".addColumnButton").on('click', function (e) {
                var rowTemplate = {
                        colName: "Choose Point",
                        colDisplayName: "",
                        valueType: "String",
                        operator: "",
                        calculation: "",
                        canCalculate: false,
                        precision: 3,
                        valueList: [],
                        upi: 0
                    },
                    $newRow;
                e.preventDefault();
                e.stopPropagation();
                if (self.listOfColumns.indexOf(rowTemplate) === -1) {
                    self.listOfColumns.push(rowTemplate);
                    updateListOfColumns(self.listOfColumns());
                    $newRow = $columnsTbody.find('tr:last');
                    $newRow.addClass("ui-sortable-handle");
                    $newRow.addClass("danger");
                    if (self.reportType !== "Property") {
                        self.selectPointForColumn(rowTemplate, (self.listOfColumns().length - 1));
                    }
                }
                handleResize();
                $reportColumns.stop().animate({
                    scrollTop: $reportColumns.get(0).scrollHeight
                }, 700);
            });

            $direports.find(".addFilterbutton").on('click', function (e) {
                var rowTemplate = {
                    filterName: "",
                    condition: "$and",
                    childLogic: false,
                    beginGroup: false,
                    endGroup: false,
                    operator: "EqualTo",
                    valueType: "String",
                    value: "",
                    valueList: ""
                };
                e.preventDefault();
                e.stopPropagation();
                if (self.listOfFilters.indexOf(rowTemplate) === -1) {
                    self.listOfFilters.push(rowTemplate);
                    updateListOfFilters(self.listOfFilters());
                }
                handleResize();
                $additionalFilters.stop().animate({
                    scrollTop: $additionalFilters.get(0).scrollHeight
                }, 700);
            });

            $direports.find(".saveReportButton").on('click', function () {
                var $screenMessages = $tabConfiguration.find(".screenMessages");
                blockUI($tabConfiguration, true, " Saving Report...");
                $screenMessages.find(".errorMessage").text(""); // clear messages
                $screenMessages.find(".successMessage").text(""); // clear messages
                saveReportConfig();
                $(this).blur();
            });

            $direports.find(".runReportButton").on('click', function (e) {
                $(this).focus();
                e.preventDefault();
                e.stopPropagation();
                self.requestReportData();
            });

            $viewReport.on('click', '.pointInstance', function () {
                var data = {
                    upi: $(this).attr('upi'),
                    pointType: $(this).attr('pointType'),
                    pointName: $(this).text()
                };

                self.showPointReview(data);
            });

            $tabConfiguration.find(".toggleTab").on('shown.bs.tab', function () {
                adjustConfigTabActivePaneHeight();
            });

            reportSocket.on('pointUpdated', function (data) {
                var $currentmessageholder;
                console.log(" -  -  - reportSocket() 'pointUpdated' returned");
                if (data.err === null || data.err === undefined) {
                    self.unSavedDesignChange(false);
                    $currentmessageholder = $tabConfiguration.find(".screenMessages").find(".successMessage");
                    $currentmessageholder.text("Report Saved");
                    setTimeout(function () {
                        $currentmessageholder.text("");
                    }, 3000);  // display success message
                } else {
                    self.unSavedDesignChange(true);
                    originalPoint = _.clone(newPoint, true);
                    self.reportDisplayTitle(originalPoint.Name);
                    $tabConfiguration.find(".screenMessages").find(".errorMessage").text(data.err);
                }
                blockUI($tabConfiguration, false);
            });

            $viewReport.on('column-reorder.dt', function (event, settings, details) {
                var columnsArray = $.extend(true, [], self.listOfColumns());
                var swapColumnFrom = $.extend(true, {}, columnsArray[details.from]);  // clone from field
                columnsArray.splice(details.from, 1);
                columnsArray.splice(details.to, 0, swapColumnFrom);
                updateListOfColumns(columnsArray);
                //$.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
                $viewReport.DataTable().draw("current");
                //console.log("moved column '" + details.from + "' to column '" + details.to + "'");
            });

            $viewReport.on('length.dt', function (e, settings, len) {
                self.selectedPageLength(len);
            });

            $viewReport.on('draw.dt', function (e, settings, len) {
                var numberOfPages = $viewReport.DataTable().page.info().pages,
                    $tablePagination,
                    $pagination,
                    $paginate_buttons;
                if (numberOfPages === 1) {
                    $tablePagination = $tabViewReport.find(".dataTables_paginate");
                    $pagination = $tablePagination.find("ul.pagination");
                    $paginate_buttons = $pagination.find(".paginate_button");
                    $paginate_buttons = $paginate_buttons.not("li.active");
                    $paginate_buttons.hide();
                }
            });

            $filtersGrid.sortable({
                appendTo: $filtersTbody,
                disabled: false,
                items: "tr",
                forceHelperSize: true,
                helper: 'original',
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

                    ui.item.remove();
                    self.listOfFilters.remove(item);
                    self.listOfFilters.splice(newIndex, 0, item);
                    tempArray = self.listOfFilters();
                    updateListOfFilters(tempArray);
                },
                scroll: true,
                handle: '.handle'
            });

            $columnsGrid.sortable({
                appendTo: $columnsTbody,
                disabled: false,
                items: "tr",
                forceHelperSize: true,
                helper: 'original',
                stop: function (event, ui) {
                    var tempArray,
                        item = ko.dataFor(ui.item[0]),
                        newIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
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
                    updateListOfColumns(tempArray);
                },
                scroll: true,
                handle: '.handle'
            });

            if (window.top.location.href === window.location.href) {
                $('.popOut').addClass('hidden');
                $('.popIn').removeClass('hidden');
            }

            intervals = [
                {
                    text: "Minute"
                }, {
                    text: "Hour"
                }, {
                    text: "Day"
                }, {
                    text: "Week"
                }, {
                    text: "Month"
                }, {
                    text: "Year"
                }
            ];

            calculations = [
                {
                    text: "Mean"
                }, {
                    text: "Max"
                }, {
                    text: "Min"
                }, {
                    text: "Sum"
                }, {
                    text: "Std Dev"
                }
            ];

            entriesPerPage = [
                {
                    value: "10",
                    unit: 10
                }, {
                    value: "15",
                    unit: 15
                }, {
                    value: "25",
                    unit: 25
                }, {
                    value: "50",
                    unit: 50
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

            self.listOfIntervals(intervals);
            self.listOfCalculations(calculations);
            self.listOfEntriesPerPage(entriesPerPage);
            checkForColumnCalculations();
        },
        getVariance = function (columnData) {
            var i,
                meanCalc = getColumnMean(columnData),
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
        getColumnStandardDeviation = function (columnData) {
            return Math.sqrt(getVariance(columnData));
        },
        getColumnMean = function (columnData) {
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
        getColumnSum = function (columnData) {
            var i,
                theSum = 0;

            for (i = 0; i < columnData.length; i++) {
                theSum += columnData[i];
            }
            return theSum;
        },
        configureDataTable = function (destroy, clearData) {
            var aoColumns = [],
                i,
                columnsArray = $.extend(true, [], self.listOfColumns()),
                setTdAttribs = function (tdField, columnConfig, data, columnIndex) {
                    switch (self.reportType) {
                        case "History":
                            if (columnIndex === 0 && columnConfig.dataColumnName === "Date") {
                                $(tdField).attr('title', moment.unix(data[columnConfig.dataColumnName].rawValue).format("dddd"));
                            } else {
                                if (columnConfig.units) {
                                    $(tdField).attr('title', columnConfig.units);
                                }
                            }
                            break;
                        case "Totalizer":
                            if (columnIndex === 0 && columnConfig.dataColumnName === "Date") {
                                $(tdField).attr('title', moment.unix(data[columnConfig.dataColumnName].rawValue).format("dddd"));
                            } else {
                                //if (data[columnConfig.dataColumnName] && data[columnConfig.dataColumnName].rawValue) {
                                //    $(tdField).attr('title', (data[columnConfig.dataColumnName].rawValue ? data[columnConfig.dataColumnName].rawValue : ""));
                                //}
                            }
                            break;
                        case "Property":
                            if (columnConfig.colName === "Name") {
                                $(tdField).attr("upi", data["Point Instance"].Value);
                                $(tdField).attr("columnIndex", columnIndex);
                                if (data["Point Type"] && data["Point Type"].Value) {
                                    $(tdField).attr('title', data["Point Type"].Value);
                                    $(tdField).attr('pointType', data["Point Type"].Value);
                                }
                            } else if (columnConfig.valueType === "Timet" || columnConfig.valueType === "DateTime") {
                                $(tdField).attr('title', moment.unix(data[columnConfig.dataColumnName].rawValue).format("dddd"));
                            }
                            break;
                        default:
                            console.log(" - - - DEFAULT  setTdAttribs()");
                            break;
                    }

                    if (data[columnConfig.colName] && data[columnConfig.colName].PointInst) {
                        var pointType;
                        pointType = window.workspaceManager.config.Utility.pointTypes.getPointTypeNameFromEnum(data[columnConfig.colName].PointType);
                        $(tdField).addClass("pointInstance");
                        $(tdField).attr('upi', data[columnConfig.colName].PointInst);
                        $(tdField).attr('pointType', pointType);
                    }
                },
                setColumnClasses = function (columnConfig, columnIndex) {
                    var result = "";
                    if (columnConfig.colName === "Name") {
                        switch (self.reportType) {
                            case "History":
                            case "Totalizer":
                                break;
                            case "Property":
                                result += "pointInstance ";
                                break;
                            default:
                                console.log(" - - - DEFAULT  setTdAttribs()");
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
                    if (columnIndex === 0) {
                        result += "firstColumn ";
                    }
                    if (columnConfig.valueType === "DateTime") {
                        result += "small datetime ";
                    }
                    if (columnConfig.valueType === "BitString") {
                        result += "small ";
                    }
                    if (columnConfig.canCalculate === true) {
                        result += "text-right ";
                    }
                    if (columnConfig.softDeleted !== undefined && columnConfig.softDeleted) {
                        result += "softDeleted";
                    }
                    return result;
                },
                buildColumnObject = function (columnConfig, columnIndex) {
                    var result,
                        columnTitle = columnConfig.colDisplayName,
                        sortAbleColumn = true;

                    switch (self.reportType) {
                        case "History":
                            columnConfig.dataColumnName = columnConfig.upi;
                            if (columnIndex === 0 && columnConfig.colName === "Date") {
                                columnConfig.dataColumnName = columnConfig.colName;
                            }
                            break;
                        case "Totalizer":
                            if (columnIndex === 0 && columnConfig.colName === "Date") {
                                columnTitle = "Period Begin";
                                columnConfig.dataColumnName = "Date";
                            } else if (columnIndex !== 0) {
                                columnConfig.dataColumnName = columnConfig.upi + " - " + columnConfig.operator.toLowerCase();
                                columnTitle += " - " + columnConfig.operator;
                                if (columnConfig.operator.toLowerCase() === "runtime") {
                                    columnTitle += " (Hours)";
                                }
                            }
                            break;
                        case "Property":
                            columnConfig.dataColumnName = columnConfig.colName;
                            break;
                        default:
                            columnTitle = "Default";
                            console.log(" - - - DEFAULT  configureDataTable()");
                            break;
                    }

                    if (columnConfig.softDeleted !== undefined && columnConfig.softDeleted) {
                        columnTitle = "[Deleted] " + columnTitle;
                    }

                    result = {
                        title: columnTitle,
                        data: columnConfig.dataColumnName,
                        render: {
                            _: "Value",
                            sort: "rawValue",
                            type: "rawValue"
                            //filter: "filterValue"
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
                    var value,
                        allRawValues,
                        currentPageRawValues = [],
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

                    switch (columnDesign.calculation.toLowerCase()) {
                        case "mean":
                            calc.totalCalc = getColumnMean(allRawValues);
                            calc.pageCalc = (!sameDataSet ? getColumnMean(currentPageRawValues) : calc.totalCalc);
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
                            calc.totalCalc = getColumnSum(allRawValues);
                            calc.pageCalc = (!sameDataSet ? getColumnSum(currentPageRawValues) : calc.totalCalc);
                            break;
                        case "std dev":
                            calc.totalCalc = getColumnStandardDeviation(allRawValues);
                            calc.pageCalc = (!sameDataSet ? getColumnMean(currentPageRawValues) : calc.totalCalc);
                            break;
                    }
                    return calc;
                };

            // if the design of the data collected has changed then we need to adjust the design of the DataTable.
            //if (destroy === true && $.fn.DataTable.isDataTable($viewReport)) {
            if ($.fn.DataTable.isDataTable($viewReport)) {
                $viewReport.DataTable().destroy();
                $viewReport.find("thead").empty();
                $viewReport.find("tbody").empty(); // leaving dynamic footer
            }
            if (clearData === true) {
                reportData = {};
            }

            for (i = 0; i < columnsArray.length; i++) {
                aoColumns.push(buildColumnObject(columnsArray[i], i));
            }

            if (aoColumns.length > 0) {
                $viewReport.DataTable({
                    api: true,
                    dom: 'Blfrtip',
                    buttons: [
                        {
                            extend: 'collection',
                            text: 'Export',
                            buttons: [
                                {
                                    extend: 'copyHtml5',
                                    text: '<i class="fa fa-files-o"></i> Copy',
                                    key: {
                                        altKey: true,
                                        key: '1'
                                    }
                                },
                                {
                                    extend: 'csvHtml5',
                                    text: '<i class="fa fa-file-o"></i> CSV',
                                    key: {
                                        altKey: true,
                                        key: '2'
                                    }
                                },
                                {
                                    extend: 'excelHtml5',
                                    text: '<i class="fa fa-file-excel-o"></i> Excel',
                                    key: {
                                        altKey: true,
                                        key: '3'
                                    }
                                },
                                {
                                    extend: 'pdfHtml5',
                                    text: '<i class="fa fa-file-pdf-o"></i> PDF',
                                    footer: true,
                                    key: {
                                        altKey: true,
                                        key: '4'
                                    },
                                    customize: function (doc, thisButton) {
                                        // could insert TrendPlots here
                                    }
                                }
                            ]
                        },
                        {
                            extend: 'print',
                            text: '<i class="fa fa-print"></i> Print',
                            key: {
                                altKey: true,
                                key: '5'
                            },
                            customize: function (win) {
                                $(win.document.body).find("h1").css('font-size', '16pt').css("text-align", "center");
                            }
                        }
                    ],
                    drawCallback: function (settings) {
                        setInfoBarDateTime();
                    },
                    headerCallback: function (thead, data, start, end, display) {
                        var reportColumns = $.extend(true, [], self.listOfColumns()),
                            i,
                            len = reportColumns.length,
                            $theads;
                        for (i = 0; i < len; i++) {
                            if (!!reportColumns[i].calculation && reportColumns[i].calculation !== "") {
                                $(thead).find('th').eq(i).addClass("calculate");
                            }
                            $(thead).find('th').eq(i).addClass("text-center");
                            $(thead).find('th').eq(i).removeClass("small");
                        }

                        switch (self.reportType) {
                            case "History":
                            case "Totalizer":
                                $theads = $(thead).find('th');
                                $theads.each(function (i, el) {
                                    $(el).attr("oncontextmenu", "reportsVM.showPointReviewViaIndex(" + i + "); return false;");
                                    $(el).attr("title", "Right mouse click to run PointInspector");
                                });
                                break;
                            case "Property":
                                $theads = $(thead).find('th:first');
                                $theads.addClass("pointLookupColumn");
                                break;
                            default:
                                break;
                        }
                    },
                    footerCallback: function (tfoot, data, start, end, display) {
                        var api = this.api(),
                            reportColumns = $.extend(true, [], self.listOfColumns()),
                            $firstColumn,
                            columnIndexesToCalc = api.columns('.calculate')[0],
                            i,
                            columnIndex,
                            currentPageData,
                            allData,
                            sameDataSet,
                            numberOfColumnsToCalculate = columnIndexesToCalc.length,
                            columnConfig,
                            calc,
                            pageFooterText,
                            totalFooterText,
                            footerText,
                            $tdFooter;

                        for (i = 0; i < numberOfColumnsToCalculate; i++) {
                            columnIndex = columnIndexesToCalc[i];
                            columnConfig = reportColumns[columnIndex];
                            currentPageData = api.column(columnIndex, {page: 'current'}).data();
                            allData = api.column(columnIndex).data();
                            sameDataSet = (currentPageData.length === allData.length);
                            calc = getCalcForColumn(currentPageData, allData, columnConfig);
                            $tdFooter = $(tfoot).find("td[colindex='" + columnIndex + "']");
                            $tdFooter.attr("title", "Page Calc (Table Calc)");

                            switch (self.reportType) {
                                case "History":
                                    if (!sameDataSet) {
                                        pageFooterText = "<span>Page " + columnConfig.calculation + ": " + toFixedComma(calc.pageCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                    }
                                    totalFooterText = "<span>Total " + columnConfig.calculation + ": " + toFixedComma(calc.totalCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                    break;
                                case "Totalizer":
                                    if (columnConfig.operator.toLowerCase() === "runtime") {
                                        if (!sameDataSet) {
                                            pageFooterText = "<span>Page " + columnConfig.calculation + ": " + getDurationText(calc.pageCalc, columnConfig.precision, totalizerDurationInHours) + "</span>";
                                        }
                                        totalFooterText = "<span>Total " + columnConfig.calculation + ": " + getDurationText(calc.totalCalc, columnConfig.precision, totalizerDurationInHours) + "</span>";
                                    } else {
                                        if (!sameDataSet) {
                                            pageFooterText = "<span>Page " + columnConfig.calculation + ": " + toFixedComma(calc.pageCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                        }
                                        totalFooterText = "<span>Total " + columnConfig.calculation + ": " + toFixedComma(calc.totalCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                    }
                                    break;
                                case "Property":
                                    if (!sameDataSet) {
                                        pageFooterText = "<span>Page " + columnConfig.calculation + ": " + toFixedComma(calc.pageCalc, columnConfig.precision) + "</span>";
                                    }
                                    totalFooterText = "<span>Total " + columnConfig.calculation + ": " + toFixedComma(calc.totalCalc, columnConfig.precision) + "</span>";
                                    break;
                                default:
                                    console.log(" - - - DEFAULT  footerCallback()");
                                    break;
                            }

                            footerText = ((!sameDataSet ? pageFooterText + "<br>" : "" ) + totalFooterText);

                            $tdFooter.html(footerText);
                        }

                        if (numberOfColumnsToCalculate > 0) {
                            $firstColumn = $(tfoot).find("td[colindex='" + 0 + "']");
                            $firstColumn.text("Calculations:");
                            $firstColumn.removeClass("small");
                            $firstColumn.addClass("text-right");
                        } else { // if none of the columns were calculated hide the Verbiage
                            $(tfoot).parent().parent().addClass("hidden"); // hide the footer block
                        }
                    },
                    //initComplete: function (settings, json) {
                    //    alert('DataTables has finished its initialisation.');
                    //},
                    data: reportData,
                    columns: aoColumns,
                    colReorder: {
                        fixedColumnsLeft: 1,
                        realtime: false
                    },
                    order: [[0, "asc"]], // always default sort by first column
                    scrollY: true,
                    scrollX: true,
                    scrollCollapse: true,
                    lengthChange: true,
                    lengthMenu: [[10, 15, 25, 50, 75, 100, -1], [10, 15, 25, 50, 75, 100, "All"]],
                    //bFiler: false,  // search box
                    pageLength: parseInt(self.selectedPageLength(), 10)
                });
            }

            self.designChanged(false);
        },
        setInfoBarDateTime = function () {
            var $tablePagination = $tabViewReport.find(".dataTables_paginate"),
                $currentDateTimeDiv = $tablePagination.find(".reportDisplayFooter");

            if ($currentDateTimeDiv.length > 0) {
                $currentDateTimeDiv.text(self.currentTimeStamp);
            } else {
                $currentDateTimeDiv = $("<div class='small reportDisplayFooter'>" + self.currentTimeStamp + "</div>");
                $currentDateTimeDiv.prependTo($tablePagination);
            }
        },
        renderReport = function () {
            if (reportData !== undefined && self.currentTab() === 2) {
                $popAction.show();
                self.reportResultViewed(self.currentTab() === 2);
                blockUI($tabViewReport, false);
                $viewReport.DataTable().clear();
                $viewReport.DataTable().rows.add(reportData);
                $viewReport.DataTable().draw("current");
                $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
                self.refreshData(false);
                self.currentTimeStamp = moment().format("dddd MMMM DD, YYYY hh:mm:ss a");
                adjustDatatableHeight();

                if (!exportEventSet) {
                    $tabViewReport.find("a.btn.btn-default.buttons-collection").on('click', function () {
                        if (!exportEventSet) {
                            setTimeout(function () {
                                $direports.find("li.dt-button > a").on('click', function () {  // export buttons clicked
                                    console.log($(this).text() + " button clicked");
                                    $(this).parent().parent().hide();
                                });
                            }, 100);
                        }
                        exportEventSet = true;
                    });
                }

                //setTimeout(function () {
                //    $(".tabViewReport").find(".dataTables_scrollHead .table th").on("mouseover", function (e) {
                //        var border_right_width = parseInt($(this).css('border-right-width'), 10),
                //            columnIndex = parseInt($(e.target).attr("data-column-index"), 10);
                //        if (e.offsetX < border_right_width || e.offsetX > $(this).innerWidth()) {
                //            console.log('This is the Right border of column ' + columnIndex);
                //        }
                //    });
                //}, 200);
            }
        },
        renderHistoryReport = function (data) {
            self.activeDataRequest(false);
            if (data.err === undefined) {
                reportData = pivotHistoryData(data.historyData);
                self.truncatedData(reportData.truncated);
                renderReport();
            } else {
                console.log(" - * - * - renderHistoryReport() ERROR = ", data.err);
            }
        },
        renderTotalizerReport = function (data) {
            self.activeDataRequest(false);
            if (data.err === undefined) {
                reportData = pivotTotalizerData(data);
                self.truncatedData(reportData.truncated);
                renderReport();
            } else {
                console.log(" - * - * - renderTotalizerReport() ERROR = ", data.err);
            }
        },
        renderPropertyReport = function (data) {
            self.activeDataRequest(false);
            if (data.err === undefined) {
                reportData = cleanResultData(data);
                self.truncatedData(reportData);
                renderReport();
            } else {
                console.log(" - * - * - renderPropertyReport() ERROR = ", data.err);
            }
        };

    self.reportType = "";

    self.selectedPageLength = ko.observable("25");

    self.currentTimeStamp = "";

    self.startDate = "";

    self.endDate = "";

    self.reportDisplayTitle = ko.observable("");

    self.canEdit = ko.observable(true);

    self.interval = ko.observable("Minute");

    self.intervalValue = ko.observable(1);

    self.selectedDuration = ko.observable({
        startDate: moment().subtract(1, "day"),
        endDate: moment(),
        startTimeOffSet: "00:00",
        endTimeOffSet: "00:00",
        duration: 0,
        selectedRange: ""
    });

    self.durationStartTimeOffSet = ko.observable("00:00");

    self.durationEndTimeOffSet = ko.observable("00:00");

    self.listOfIntervals = ko.observableArray([]);

    self.listOfCalculations = ko.observableArray([]);

    self.listOfEntriesPerPage = ko.observableArray([]);

    self.listOfFilterPropertiesLength = 0;

    self.listOfColumnPropertiesLength = 0;

    self.filterPropertiesSearchFilter = ko.observable("-blank-");

    self.columnPropertiesSearchFilter = ko.observable("-blank-");

    self.truncatedData = ko.observable(false);

    self.designChanged = ko.observable(true);

    self.unSavedDesignChange = ko.observable(false);

    self.refreshData = ko.observable(true);

    self.activeDataRequest = ko.observable(false);

    self.reportResultViewed = ko.observable(true);

    self.currentTab = ko.observable(1);

    self.listOfColumns = ko.observableArray([]);

    self.listOfFilters = ko.observableArray([]);

    self.deleteColumnRow = function (item) {
        self.listOfColumns.remove(item);
        updateListOfColumns(self.listOfColumns());
    };

    self.deleteFilterRow = function (item) {
        self.listOfFilters.remove(item);
        updateListOfFilters(self.listOfFilters());
    };

    self.init = function (externalConfig) {
        var columns,
            reportConfig;

        exportEventSet = false;
        decimalPrecision = 2;
        activeDataRequests = [];
        getScreenFields();
        initKnockout();

        if (point) {
            self.canEdit(userCanEdit(point, permissionLevels.WRITE));
            originalPoint = JSON.parse(JSON.stringify(point));
            windowUpi = point._id; // required or pop-in/pop-out will not work
            if (point["Report Config"] === undefined) {
                point["Report Config"] = {};
            }
            self.reportType = point["Report Type"].Value;
            reportConfig = (point["Report Config"] ? point["Report Config"] : undefined);
            columns = (reportConfig ? reportConfig.columns : undefined);
            $pointName1.val(point.name1);
            $pointName2.val(point.name2);
            $pointName3.val(point.name3);
            $pointName4.val(point.name4);

            initSocket();
            self.reportDisplayTitle(point.Name);

            if (columns) {
                pointRefArray = point["Point Refs"];
                self.listOfColumns(initColumns(reportConfig.columns));
                self.listOfFilters(initFilters(reportConfig.filters));
                pointFilter = (reportConfig.pointFilter ? reportConfig.pointFilter : pointFilter);
                self.selectedPageLength((reportConfig.selectedPageLength ? reportConfig.selectedPageLength : "25"));
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        if (!!point["Report Config"].duration.duration) { // have to set each manually because of computed relationship
                            self.selectedDuration().startDate = moment.unix(point["Report Config"].duration.startDate);
                            self.selectedDuration().endDate = moment.unix(point["Report Config"].duration.endDate);
                            self.selectedDuration().startTimeOffSet = point["Report Config"].duration.startTimeOffSet;
                            self.selectedDuration().endTimeOffSet = point["Report Config"].duration.endTimeOffSet;
                            self.durationStartTimeOffSet(self.selectedDuration().startTimeOffSet);
                            self.durationEndTimeOffSet(self.selectedDuration().endTimeOffSet);
                            self.selectedDuration().duration = self.selectedDuration().endDate.diff(self.selectedDuration().startDate);
                        }
                        self.interval(point["Report Config"].interval.text);
                        self.intervalValue(point["Report Config"].interval.value);
                        break;
                    case "Property":
                        filterOpenPointSelector($filterByPoint);
                        collectEnumProperties();
                        break;
                    default:
                        console.log(" - - - DEFAULT  init()");
                        break;
                }
            } else { // Initial config
                pointRefArray = [];
                point["Point Refs"] = pointRefArray;  // new report, clear out initial Report create data
                point["Report Config"].columns = [];
                point["Report Config"].filters = [];
                point["Report Config"].pointFilter = pointFilter;
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        point["Report Config"].returnLimit = 2000;
                        self.listOfColumns.push({
                            colName: "Date",
                            colDisplayName: "Date",
                            valueType: "DateTime",
                            AppIndex: -1,
                            operator: "",
                            calculation: "",
                            canCalculate: false,
                            precision: 0,
                            valueList: [],
                            upi: 0
                        });
                        break;
                    case "Property":
                        filterOpenPointSelector($filterByPoint);
                        collectEnumProperties();
                        point["Report Config"].returnLimit = 4000;
                        self.listOfColumns.push({
                            colName: "Name",
                            colDisplayName: "Name",
                            valueType: "String",
                            AppIndex: -1,
                            precision: 0,
                            calculation: "",
                            canCalculate: false
                        });
                        break;
                    default:
                        console.log(" - - - DEFAULT  init() null columns");
                        break;
                }
                originalPoint = JSON.parse(JSON.stringify(point)); // reset original point since we've added attribs
            }

            $direports.find("#wrapper").show();
            tabSwitch(1);

            updateListOfFilters(self.listOfFilters());
            setTimeout(function () {
                $reporttitleInput.focus();
            }, 1500);
            setReportEvents();
            adjustConfigTabActivePaneHeight();
            self.filterPropertiesSearchFilter(""); // computed props jolt
            self.columnPropertiesSearchFilter(""); // computed props jolt

            if (!!externalConfig) {
                self.selectedDuration(externalConfig.selectedDuration);
                self.interval(externalConfig.interval.text);
                self.intervalValue(externalConfig.interval.value);
                self.durationStartTimeOffSet(self.selectedDuration().startTimeOffSet);
                self.durationEndTimeOffSet(self.selectedDuration().endTimeOffSet);
                self.selectedDuration().duration = self.selectedDuration().endDate.diff(self.selectedDuration().startDate);
                self.requestReportData();
            }
        }
    };

    self.operators = function (op) {
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

    self.conditions = function () {
        return [
            {text: "AND", value: "$and"},
            {text: "OR", value: "$or"}
        ];
    };

    self.displayCondition = function (op) {
        switch (op) {
            case "$and":
                return "AND";
                break;
            case "$or":
                return "OR";
                break;
            default:
                return op;
                break;
        }
    };

    self.displayOperator = function (con) {
        switch (con) {
            case "EqualTo":
                return "=";
                break;
            case "NotEqualTo":
                return "!=";
                break;
            case "Containing":
                return "{*}";
                break;
            case "NotContaining":
                return "{!*}";
                break;
            case "GreaterThan":
                return ">";
                break;
            case "GreaterThanOrEqualTo":
                return ">=";
                break;
            case "LessThan":
                return "<";
                break;
            case "LessThanOrEqualTo":
                return "<=";
                break;
            default:
                return con;
                break;
        }
    };

    self.displayBool = function (val) {
        switch (val) {
            case true:
            case "True":
                return "On";
                break;
            case false:
            case "False":
                return "Off";
                break;
            default:
                return val;
                break;
        }
    };

    self.setDatesBasedOnDuration = function (duration) {
        self.endDate = moment().unix();
        self.startDate = moment().subtract(duration.unit, duration.unitType).unix();
    };

    self.setFiltersStartEndDates = function (start, end) {
        var startDateFilter,
            endDateFilter,
            hrs,
            mins;

        startDateFilter = self.listOfFilters().filter(function (filter) {
            return filter.filterName === "Start_Date";
        });
        endDateFilter = self.listOfFilters().filter(function (filter) {
            return filter.filterName === "End_Date";
        });

        startDateFilter[0].value = start;
        startDateFilter[0].date = start;
        hrs = moment.unix(start).hours();
        mins = moment.unix(start).minutes();
        startDateFilter[0].time = ((hrs < 10 ? '0' : '') + hrs) + ':' + ((mins < 10 ? '0' : '') + mins);

        endDateFilter[0].value = end;
        endDateFilter[0].date = end;
        hrs = moment.unix(end).hours();
        mins = moment.unix(end).minutes();
        endDateFilter[0].time = ((hrs < 10 ? '0' : '') + hrs) + ':' + ((mins < 10 ? '0' : '') + mins);
    };

    self.selectPointForColumn = function (data, index) {
        var upi = parseInt(data.upi, 10),
            currentIndex = (typeof index === "function" ? index() : index),
            columnIndex = parseInt(currentIndex, 10);

        openPointSelectorForColumn(columnIndex, upi);
    };

    self.selectPointForFilter = function (data, index) {
        var upi = parseInt(data.upi, 10),
            columnIndex = parseInt(index(), 10);

        openPointSelectorForFilter(columnIndex, upi);
    };

    self.showPointReviewViaIndex = function (index) {
        self.showPointReview(self.listOfColumns()[index]);
    };

    self.showPointReview = function (data) {
        var openWindow = window.workspaceManager.openWindowPositioned,
            upi = parseInt(data.upi, 10),
            options = {
                width: 850,
                height: 600
            };
        if (upi > 0) {
            if (data.pointType === "Display") {
                openWindow("/displays/view/" + upi, 'Display', 'Display', "newwindow", upi, options);
            } else {
                openWindow("/pointinspector/" + upi, 'Point', 'Point', 'newwindow', upi, options);
            }
        }
    };

    self.reportConfiguration = function () {
        tabSwitch(1);
    };

    self.requestReportData = function () {
        if (self.currentTab() !== 2) {
            //buildReportDataRequest(true).then(function (requestObj) {
                var requestObj = buildReportDataRequest();
                if (!!requestObj) {
                    tabSwitch(2);
                    if (self.reportResultViewed()) {
                        $popAction.hide();
                        self.activeDataRequest(true);
                        self.reportResultViewed(false);
                        configureDataTable(true, true);
                        reportData = undefined;
                        switch (self.reportType) {
                            case "History":
                                ajaxPost(requestObj, "/report/historyDataSearch", renderHistoryReport);
                                //reportSocket.emit("historyDataSearch", {options: requestObj});
                                break;
                            case "Totalizer":
                                ajaxPost(requestObj, "/report/totalizerReport", renderTotalizerReport);
                                //reportSocket.emit("totalizerReport", {options: requestObj});
                                break;
                            case "Property":
                                ajaxPost(requestObj, "/report/reportSearch", renderPropertyReport);
                                //reportSocket.emit("reportSearch", {options: requestObj});
                                break;
                            default:
                                console.log(" - - - DEFAULT  viewReport()");
                                break;
                        }
                    } else {
                        renderReport();
                    }
                } else {
                    // bad request object do nothing.
                }
            //}, function (error) {
            //    console.error("buildReportDataRequest() Failed!", error);
            //    return result;
            //});
        }
        $('html,body').stop().animate({
            scrollTop: 0
        }, 700);
    };

    self.clearColumnPoint = function (indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.colName = "Choose Point";
        column.valueType = "String";
        column.operator = "";
        column.upi = 0;
        if (!!column.softDeleted) {
            delete column.softDeleted;
        }
        updateListOfColumns(tempArray);
    };

    self.clearColumnCalculation = function (indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.calculation = "";
        updateListOfColumns(tempArray);
    };

    self.clearFilterPoint = function (indexOfColumn) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfColumn];

        filter.value = setDefaultValue(filter.valueType);
        if (!!filter.softDeleted) {
            delete filter.softDeleted;
        }
        filter.upi = 0;
        updateListOfFilters(tempArray);
    };

    self.selectPropertyColumn = function (element, indexOfColumn, selectedItem) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn],
            prop = getProperty(selectedItem.name);
        column.colName = selectedItem.name;
        column.colDisplayName = selectedItem.name;
        column.valueType = prop.valueType;
        column.calculation = "";
        column.canCalculate = columnCanBeCalculated(column);
        updateListOfColumns(tempArray);
    };

    self.selectPropertyFilter = function (element, indexOfFilter, selectedItem) {
        var tempArray = self.listOfFilters(),
            $elementRow = $(element).parent().parent().parent().parent().parent(),
            $inputField = $elementRow.find(".filterValue").find("input");  // in case we need to validate input field
        tempArray[indexOfFilter] = initializeNewFilter(selectedItem, tempArray[indexOfFilter]);
        updateListOfFilters(tempArray);
    };

    self.selectTotalizerOperator = function (element, indexOfColumn, selectedItem) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.operator = selectedItem;
        updateListOfColumns(tempArray);
    };

    self.selectCalculation = function (element, indexOfColumn, selectedItem) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.calculation = selectedItem;
        updateListOfColumns(tempArray);
    };

    self.selectNumberOfEntries = function (element, selectedItem) {
        var tempArray = self.listOfEntriesPerPage(),
            i;

        for (i = 0; i < tempArray.length; i++) {
            if (tempArray[i].value === selectedItem) {
                self.selectedPageLength(tempArray[i].unit);
                self.designChanged(true);
                self.unSavedDesignChange(true);
                break;
            }
        }
    };

    self.selectInterval = function (selectedInterval) {
        self.interval(selectedInterval);
    };

    self.setFilterConfig = function (indexOfCondition, selectedItem, field) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfCondition];
        if (filter[field] != selectedItem.value) {
            filter[field] = selectedItem.value;
            updateListOfFilters(tempArray);
        }
    };

    self.selectedFilterEValue = function (indexOfValue, selectedItem) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfValue];
        if (filter.evalue != selectedItem.evalue) {
            filter.value = selectedItem.value;
            filter.evalue = selectedItem.evalue;
            updateListOfFilters(tempArray);
        }
    };

    self.propertySelectClick = function (element) {
        var $searchInputField = $(element).parent().find("input");
        window.setTimeout(function () { // Delay the focus for drop down transition to finish
            $searchInputField.focus();
        }, 50);
    };

    self.selectAdditionFiltersTab = function () {
        $tabConfiguration.find("ul.nav-tabs").find("li.active").removeClass("active");
        $tabConfiguration.find("ul.nav-tabs").find("li.additionalFilters").addClass("active");
        $configurationContent.find(".active").removeClass("active");
        $configurationContent.find("#additionalFilters").addClass("active");
    };

    self.togglePop = function () {
        var options = {
            width: 1080,
            height: 768
        };
        if (window.top.location.href === window.location.href) {  // If we're a pop-out; pop back in
            window.workspaceManager.openWindowPositioned(window.location.href, $reporttitleInput.text(), 'report', 'mainWindow', windowUpi);
        } else { // Open the window
            window.workspaceManager.openWindowPositioned(window.location.href, $reporttitleInput.text(), 'report', '', windowUpi, options);
        }
    };

    self.listOfIntervalsComputed = ko.computed(function () {
        var result,
            resetInterval = true,
            intervalDuration,
            currentDuration = self.selectedDuration().endDate.diff(self.selectedDuration().startDate);

        result = self.listOfIntervals().filter(function (interval) {
            return (moment.duration(1, interval.text).asMilliseconds() < currentDuration);
        });

        if (result.length > 0) {
            result.forEach(function (interval) {
                if (self.interval().toLowerCase() === interval.text.toLowerCase()) {
                    resetInterval = false;
                }
            });

            if (resetInterval) {
                self.interval(result[result.length - 1].text);
                self.intervalValue(1);
            } else {
                intervalDuration = moment.duration(1, self.interval()).asMilliseconds();
                if ((intervalDuration * self.intervalValue()) > currentDuration) {
                    self.intervalValue(1);
                }
            }
        }

        return result;
    }, self);

    self.filterFilteredProps = ko.computed(function () {
        var fFilter = self.filterPropertiesSearchFilter().toLowerCase();

        if (fFilter === "") {
            return filtersPropertyFields;
        } else {
            return filtersPropertyFields.filter(function (prop) {
                return prop.name.toLowerCase().indexOf(fFilter) > -1;
            });
        }
    }, self);

    self.columnFilteredProps = ko.computed(function () {
        var cFilter = self.columnPropertiesSearchFilter().toLowerCase();

        if (cFilter === "") {
            return columnsPropertyFields;
        } else {
            return columnsPropertyFields.filter(function (colProp) {
                return colProp.name.toLowerCase().indexOf(cFilter) > -1;
            });
        }
    }, self);

    self.displayMainSpinner = ko.computed(function () {
        return (self.activeDataRequest() && self.currentTab() === 2);
    }, self);

    self.displayTabSpinner = ko.computed(function () {
        return self.activeDataRequest();
    }, self);

    self.displayTabCheckmark = ko.computed(function () {
        return (!self.reportResultViewed() && !self.activeDataRequest());
    }, self);
};

function applyBindings(extConfig) {
    if (window.opener === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        reportsVM = new reportsViewModel();
        reportsVM.init(extConfig);
        ko.applyBindings(reportsVM);
    }
}

$(function () {
    if (!window.location.href.match('pause')) {
        applyBindings();
    }
});
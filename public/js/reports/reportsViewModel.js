"use strict";
window.workspaceManager = (window.opener || window.top).workspaceManager;
var reportsVM,
    reportDateRanges = function (selectedRange) {
        var answer,
            dateRanges = { // shifting everything by one day forward
                'Today': [moment(), moment().add(1, 'day')],
                'Yesterday': [moment().subtract(1, 'days'), moment()],
                'Last 7 Days': [moment().subtract(6, 'days'), moment().add(1, 'day')],
                'Last Week': [moment().subtract(1, 'weeks').startOf('week'), moment().subtract(1, 'weeks').endOf('week').add(1, 'day')],
                'Last 4 Weeks': [moment().subtract(4, 'weeks'), moment().add(1, 'day')],
                'This Month': [moment().startOf('month'), moment().endOf('month').add(1, 'day')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month').add(1, 'day')],
                'This Year': [moment().startOf('year'), moment().add(1, 'day')],
                'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year').add(1, 'day')]
            };

        if (!!selectedRange && dateRanges.hasOwnProperty(selectedRange)) {
            answer = dateRanges[selectedRange];
        } else {
            answer = dateRanges;
        }

        return answer;
    };

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
                    arr = value.split(':');
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
        init: function (element, valueAccessor) {
            var $element = $(element),
                dateFormat = 'MM/DD/YYYY',
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
                    element.val(pickerInfo.startDate.format(dateFormat) + ' - ' + pickerInfo.endDate.format(dateFormat));
                    element.attr("title", pickerInfo.selectedRange);
                };
            $element.attr("title", (durationInfo().selectedRange !== "" ? durationInfo().selectedRange : "Start & End Dates"));
            $element.val(durationInfo().startDate.format(dateFormat) + ' - ' + durationInfo().endDate.format(dateFormat));

            $element.daterangepicker({
                startDate: durationInfo().startDate,
                endDate: durationInfo().endDate,
                //maxDate: moment().add(1, "day"),
                chosenLabel: durationInfo().selectedRange,
                alwaysShowCalendars: true,
                autoApply: false,
                autoUpdateInput: false,
                timePicker: false,
                //timePicker24Hour: true,
                ranges: reportDateRanges()
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
                    doneText: 'Done',
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
                    $element.clockpicker('hide');
                    $element.clockpicker('resetClock');
                    $element.clockpicker('show');
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

            if (typeof value !== 'string') {
                hr = ('00' + Math.floor(value / 100)).slice(-2);
                min = ('00' + value % 100).slice(-2);
                $element.val(hr + ':' + min);
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
                        if((((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) && !shiftKey)) {
                            appendedValue = parseInt(appendedValue + String.fromCharCode((96 <= keyCode && keyCode <= 105)? keyCode-48 : keyCode), 10);
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
};

var reportsViewModel = function () {
    var self = this,
        $direports,
        $tabs,
        $tabConfiguration,
        $tabViewReport,
        $dataTablePlaceHolder,
        $rightPanel,
        $spinnertext,
        $editColumnModal,
        $viewColumnModal,
        $globalEditColumnModal,
        $pointName1,
        $pointName2,
        $pointName3,
        $pointName4,
        $columnsGrid,
        $filtersGrid,
        $columnsTbody,
        $filtersTbody,
        $filterByPoint,
        $reportTitleInput,
        $reportColumns,
        $additionalFilters,
        $columnNames,
        $hiddenPlaceholder,
        $globalPrecision,
        $globalIncludeInChart,
        $availableChartTypesChartTab,
        $reportChartDiv,
        $saveReportButton,
        pointSelectorRef,
        $pointSelectorIframe,
        $popAction,
        longClickStart,
        longClickTimer = 100,
        reportData,
        reportExportData,
        reportChartData,
        activeDataRequests,
        reportSocket,
        exportEventSet,
        totalizerDurationInHours = true,
        exportLandscape = true,
        Name = "dorsett.reportUI",
        getPointURL = "/api/points/getpoint",
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
        filtersPropertyFields = [],
        columnsPropertyFields = [],
        newlyReferencedPoints = [],
        windowUpi,
        resizeTimer = 400,
        baseConfigColumnWidth = 140,
        baseConfigColumnHeight = 14,
        rowsPerPage = 24,
        lastResize = null,
        decimalPadding = "0000000000000000000000000000000000000000",
        setNewPointReference = function (refPointUPI, property) {
            // console.log("- - - - setNewPointReference() called....   refPointUPI = " + refPointUPI + " property = " + property);
            var refPoint,
                appIndex = getMaxAppIndexUsed(),
                tempRef,
                setPointForColumn = function (selectedPoint) {
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
                tempRef.PropertyEnum = Config.Enums.Properties["Column Point"].enum;
                tempRef.PropertyName = property;
                tempRef.Value = refPoint._id;
                tempRef.AppIndex = ++appIndex;
                tempRef.isDisplayable = true;
                tempRef.isReadOnly = false;
                tempRef.PointName = refPoint.Name;
                tempRef.PointType = Config.Enums["Point Types"][pointType].enum;
                point["Point Refs"].push(tempRef);
            } else {
                if (!!refPointUPI) {
                    ajaxPost({pointid: refPointUPI}, getPointURL, setPointForColumn);
                }
                console.log("setNewPointReference() refPointUPI = " + refPointUPI + " property = " + property + "  refPoint = " + refPoint);
            }
        },
        userCanEdit = function (data, requestedAccessLevel) {
            var cumulativePermissions = 0,
                user,
                groups,
                isSystemAdmin;

            if (!!window.workspaceManager) {
                user = window.workspaceManager.user();
                groups = user.groups.filter(function (item) {
                    return !!~data.Security.indexOf(item._id);
                });
                isSystemAdmin = user['System Admin'].Value;

                if (isSystemAdmin) { return true; }

                for (var i = 0, last = groups.length; i < last; i++) {
                    cumulativePermissions |= groups[i]._pAccess;
                }
            }

            return !!(cumulativePermissions & requestedAccessLevel);
        },
        cleanPointRefArray = function () {
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
            for (i = 0; i < point["Point Refs"].length; i++) {
                pointRef = point["Point Refs"][i];
                if (!!pointRef) {
                    if (pointRef.PropertyName === "Column Point" || pointRef.PropertyName === "Qualifier Point") {
                        if (!pointRefUsed(pointRef)) {
                            point["Point Refs"].splice(i--, 1);
                        }
                    }
                }
            }
        },
        getPointRefByAppIndex = function (appIndex) {
            var result = -1,
                i;

            for (i = 0; i < point["Point Refs"].length; i++) {
                if (point["Point Refs"][i].AppIndex === appIndex) {
                    result = i;
                    break;
                }
            }

            return result;
        },
        getPointRef = function (item, referenceType, lastTry) {
            //console.log("- - - - getPointRef() called....   item.upi = " + item.upi + " item.AppIndex = " + item.AppIndex);
            var result,
                upi = item.upi,
                appIndex = item.AppIndex;

            if (!!appIndex || !!upi) {
                result = point["Point Refs"].filter(function (pointRef) {
                    return (pointRef.AppIndex === appIndex || pointRef.Value === upi) && pointRef.PropertyName === referenceType;
                });

                if (result.length === 0) {
                    if (!!lastTry) {
                        return null;
                    } else {
                        if (!!upi) {
                            setNewPointReference(upi, referenceType);
                            return getPointRef(item, referenceType, true);
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
        pointReferenceSoftDeleted = function (item, referenceType) {
            var answer = false,
                pointRef;

            if (item.AppIndex >= 0) {
                pointRef = getPointRef(item, referenceType);
                if (!!pointRef) {
                    if (pointRef.PointInst === 0) {
                        answer = true;
                    }
                }
            }

            return answer;
        },
        pointReferenceHardDeleted = function (item, referenceType) {
            var pointRef = getPointRef(item, referenceType);

            if (!!pointRef) {
                return (pointRef.PointInst === 0 && pointRef.Value === 0);
            } else {
                return true;
            }
        },
        getMaxAppIndexUsed = function () {
            var answer = 0,
                i;
            for (i = 0; i < point["Point Refs"].length; i++) {
                if (answer < point["Point Refs"][i].AppIndex) {
                    answer = point["Point Refs"][i].AppIndex;
                }
            }
            return answer;
        },
        buildBitStringHtml = function (config, rawValue, disabled) {
            var htmlString = '<div class="bitstringReporting">',
                enumValue;
            for (var key in config.bitstringEnums) {
                if (config.bitstringEnums.hasOwnProperty(key)) {
                    if (key !== "All") {
                        enumValue = rawValue & config.bitstringEnums[key].enum;
                        htmlString += '<input type="checkbox" ' + (enumValue > 0 ? 'checked ' : '') + (disabled ? 'disabled' : '') + '><span>' + key + '</span><br>';
                    }
                }
            }
            htmlString += '</div>';

            return htmlString;
        },
        getBitStringEnumsArray = function (bitString) {
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
            if (theNumber !== null && theNumber !== undefined) {
                if (theNumber.toString().indexOf(".") > 0) {
                    var arr = theNumber.toString().split('.');
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
                        valueOptions = Config.Templates.getTemplate(column.pointType).Value.ValueOptions;
                        result = (valueOptions === undefined);
                        break;
                }
            }

            return result;
        },
        columnCanBeCharted = function (column) {
            var result = false,
                valueOptions;

            if (columnCanBeCalculated(column)) {
                result = true;
            } else {
                switch (column.pointType) {
                    case "Accumulator":
                    case "Analog Input":
                    case "Analog Output":
                    case "Analog Value":
                    case "Average":
                    case "Binary Input":
                    case "Binary Output":
                    case "Binary Selector":
                    case "Binary Value":
                    case "Math":
                    case "Totalizer":
                        valueOptions = Config.Templates.getTemplate(column.pointType).Value.ValueOptions;
                        result = (valueOptions !== undefined);
                        break;
                }
            }

            return result;
        },
        blockUI = function ($control, state) {
            if (state === true) {
                $control.hide();
            } else {
                $control.show();
            }
            $control.attr('disabled', state);
        },
        checkForColumnCalculations = function () {
            for (var i = 0; i < self.listOfColumns().length; i++) {
                if (!!self.listOfColumns()[i].canCalculate && self.listOfColumns()[i].canCalculate) {
                    $columnsGrid.find(".multiplierColumn").html("Multiplier");
                    $columnsGrid.find(".calculateColumn").html("Calculate");
                    $columnsGrid.find(".precisionColumn").html("Precision");
                    break;
                }
            }

            if (self.reportType === "Totalizer") {
                $columnsGrid.find(".typeColumn").html("Type");
            }
        },
        checkForIncludeInChart = function () {
            var displayChartingHeader = false,
                activateCharting = false,
                allChecked = true;

            for (var i = 0; i < self.listOfColumns().length; i++) {
                if (columnCanBeCharted(self.listOfColumns()[i])) {
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
                $columnsGrid.find("th .includeInChartColumn").html("Chart");
                $columnsGrid.find("th .yaxisChartGroupColumn").html("Group");
            }

            self.chartable(activateCharting);
            self.allChartCheckboxChecked(allChecked);
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
            checkForIncludeInChart();
            self.designChanged(true);
            self.unSavedDesignChange(true);
            self.refreshData(true);
        },
        setFiltersParentChildLogic = function (array) {
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
        ajaxPost = function (input, url, callback) {
            self.activeRequestDataDrawn(false);
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
                console.log( "Request failed: " + textStatus );
                self.activeRequestDataDrawn(true);
                //self.errorWithRequest(true);
            }).always(function () {
                // console.log( " . .     ajax Request complete..");
            });
        },
        displayError = function (errorMessage) {
            var $errorMessageholder = $tabConfiguration.find(".screenMessages").find(".errorMessage");
            $errorMessageholder.text(errorMessage);
            setTimeout(function () {
                $errorMessageholder.text("");
            }, 6000);  // display error message
        },
        openPointSelectorForModalColumn = function (selectObjectIndex, upi, newUrl) {
            var url = newUrl || '/pointlookup/' + encodeURI("Report") + '/' + encodeURI("Column Point") + "?mode=select",
                windowRef,
                tempPoint,
                tempObject = {},
                setColumnPoint = function (selectedPoint) {
                    newlyReferencedPoints.push(selectedPoint);
                    if (!!tempObject.AppIndex) {
                        delete tempObject.AppIndex;
                    }
                    tempObject.upi = selectedPoint._id;
                    tempObject.dataColumnName = tempObject.upi;
                    tempObject.valueType = "None";
                    tempObject.colName = selectedPoint.Name;
                    tempObject.colDisplayName = selectedPoint.Name.replace(/_/g, " ");
                    tempObject.pointType = selectedPoint["Point Type"].Value;
                    tempObject.canCalculate = columnCanBeCalculated(tempObject);
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
                    if (self.reportType === "Totalizer") {
                        tempObject.valueList = getTotalizerValueList(tempObject.pointType);
                        tempObject.operator = tempObject.valueList[0].text;
                        tempObject.dataColumnName = "point-" + tempObject.upi + " - " + tempObject.operator.toLowerCase();
                    } else {
                        if (self.reportType === "History") {
                            tempObject.dataColumnName = "point-" + tempObject.upi;
                        }
                        if (!!selectedPoint.Value.ValueOptions) {
                            tempObject.valueOptions = selectedPoint.Value.ValueOptions;
                        } else {
                            tempObject.valueOptions = Config.Templates.getTemplate(tempObject.pointType).Value.ValueOptions;
                        }
                    }
                    tempObject.canBeCharted = columnCanBeCharted(tempObject);
                    tempObject.yaxisGroup = "A";
                    updateColumnFromPointRefs(tempObject);  // sets AppIndex;
                    if (tempObject.AppIndex) {
                        tempPoint = Config.Update.formatPoint({
                            point: point,
                            oldPoint: point,
                            refPoint: selectedPoint,
                            property: getPointRefByAppIndex(tempObject.AppIndex)
                        });
                        self.currentColumnEdit(tempObject);
                    } else {
                        console.log("openPointSelectorForModalColumn() couldn't find AppIndex.........");
                        self.currentColumnEdit(columnEditReset());
                    }
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
        openPointSelectorForColumn = function (selectObjectIndex, upi, newUrl) {
            var url = newUrl || '/pointlookup/' + encodeURI("Report") + '/' + encodeURI("Column Point") + "?mode=select",
                windowRef, //
                tempPoint,
                updatedList = $.extend(true, [], self.listOfColumns()),
                tempObject = updatedList[selectObjectIndex],
                setColumnPoint = function (selectedPoint) {
                    newlyReferencedPoints.push(selectedPoint);
                    if (!!tempObject.AppIndex) {
                        delete tempObject.AppIndex;
                    }
                    tempObject.upi = selectedPoint._id;
                    tempObject.dataColumnName = tempObject.upi;
                    tempObject.valueType = "None";
                    tempObject.colName = selectedPoint.Name;
                    tempObject.colDisplayName = selectedPoint.Name.replace(/_/g, " ");
                    tempObject.pointType = selectedPoint["Point Type"].Value;
                    tempObject.canCalculate = columnCanBeCalculated(tempObject);
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
                    if (self.reportType === "Totalizer") {
                        tempObject.valueList = getTotalizerValueList(tempObject.pointType);
                        tempObject.operator = tempObject.valueList[0].text;
                        tempObject.dataColumnName = "point-" + tempObject.upi + " - " + tempObject.operator.toLowerCase();
                    } else {
                        if (self.reportType === "History") {
                            tempObject.dataColumnName = "point-" + tempObject.upi;
                        }
                        if (!!selectedPoint.Value.ValueOptions) {
                            tempObject.valueOptions = selectedPoint.Value.ValueOptions;
                        } else {
                            tempObject.valueOptions = Config.Templates.getTemplate(tempObject.pointType).Value.ValueOptions;
                        }
                    }
                    tempObject.canBeCharted = columnCanBeCharted(tempObject);
                    tempObject.yaxisGroup = "A";
                    updateColumnFromPointRefs(tempObject);  // sets AppIndex;
                    if (tempObject.AppIndex) {
                        tempPoint = Config.Update.formatPoint({
                            point: point,
                            oldPoint: point,
                            refPoint: selectedPoint,
                            property: getPointRefByAppIndex(tempObject.AppIndex)
                        });
                        updatedList[selectObjectIndex] = tempObject;
                        updateListOfColumns(updatedList);
                    }
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
                tempPoint,
                objIndex = selectObjectIndex,
                updatedList = self.listOfFilters(),
                tempObject = updatedList[selectObjectIndex],
                setFilterPoint = function (selectedPoint) {
                    newlyReferencedPoints.push(selectedPoint);
                    tempObject.upi = selectedPoint._id;
                    tempObject.valueType = "UniquePID";
                    tempObject.value = selectedPoint.Name;
                    tempObject.pointType = selectedPoint["Point Type"].Value;
                    updateFilterFromPointRefs(tempObject);  // sets AppIndex;
                    tempPoint = Config.Update.formatPoint({
                        point: point,
                        oldPoint: point,
                        refPoint: selectedPoint,
                        property: getPointRefByAppIndex(tempObject.AppIndex)
                    });
                    updatedList[objIndex] = tempObject;
                    updateListOfFilters(updatedList);
                },
                pointSelectedCallback = function (pid, name, type, filter) {
                    if (!!pid) {
                        ajaxPost({pointid: pid}, getPointURL, setFilterPoint);
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
            if (!scheduled) {
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
                            tempObject.colDisplayName = name.replace(/_/g, " ");
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
            }
        },
        getFilterAdjustedDatetime = function (filter) {
            return getAdjustedDatetimeUnix(moment.unix(filter.date), filter.time.toString());
        },
        getAdjustedDatetimeMoment = function (date, time) {
            var result = date,
                timestamp,
                hour,
                min;

            if (date !== undefined && time !== undefined) {
                timestamp = parseInt(time.replace(':', ''), 10);
                hour = ('00' + Math.floor(timestamp / 100)).slice(-2);
                min = ('00' + timestamp % 100).slice(-2);
                result = date.startOf('day');
                result = result.add(hour, 'h');
                result = result.add(min, 'm');
            }

            return result;
        },
        getAdjustedDatetimeUnix = function (date, time) {
            var result,
                validatedDate = (moment.isMoment(date) ? date : moment.unix(date));

            result = getAdjustedDatetimeMoment(validatedDate, time.toString());
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
            localFilter.upi = 0;
            delete localFilter.AppIndex;
            localFilter.value = setDefaultFilterValue(localFilter.valueType);
            localFilter.valueList = getValueList(selectedItem.name, selectedItem.name);
            switch (localFilter.valueType) {
                case "Timet":
                case "DateTime":
                    localFilter.date = moment().unix();
                    localFilter.value = localFilter.date;
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
                case "BitString":
                    localFilter.bitStringEnumsArray = getBitStringEnumsArray(Config.Enums[localFilter.filterName + ' Bits']);
                    break;
            }

            return localFilter;
        },
        setDefaultFilterValue = function (valueType) {
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
        updateColumnFromPointRefs = function (column) {
            var existingPointRef = getPointRef(column, "Column Point");

            if (!!existingPointRef) {
                column.AppIndex = existingPointRef.AppIndex;
                column.upi = existingPointRef.Value;
                column.colName = existingPointRef.PointName;
            } else {
                console.log("ERROR - validateColumns() could not locate Point Ref for upi = " + column.colName);
            }
        },
        updateFilterFromPointRefs = function (filter) {
            var existingPointRef = getPointRef(filter, "Qualifier Point");

            if (!!existingPointRef) {
                filter.AppIndex = existingPointRef.AppIndex;
                filter.upi = existingPointRef.Value;
                filter.value = existingPointRef.PointName;
            } else {
                console.log("ERROR - validateFilters() could not locate Point Ref for upi = " + filter.value);
            }
        },
        validColumn = function (column, colIndex) {
            var answer = {
                    valid: true
                },
                pointRef;

            if (column.colName === "Choose Point") {
                answer.valid = false;
                answer.error = "Missing Column point at index " + colIndex;
            } else if (column.colName === "Choose Property") {
                answer.valid = false;
                answer.error = "Missing Column property at index " + colIndex;
            } else if ((self.reportType === "Totalizer") || (self.reportType === "History")) {
                if (column.colName !== "Date" && !!column.AppIndex) { //  skip first column  "Date"
                    pointRef = getPointRef(column, "Column Point");
                    if (pointRef === undefined) {
                        answer.valid = false;
                        answer.error = "No corresponding 'Point Ref' for Column point at index " + colIndex;
                    }
                }
            }

            return answer;
        },
        validateColumns = function (cleanup) {
            var results = [],
                localArray,
                i,
                col,
                checkColumnsForPointRefs = function () {
                    var column;

                    for (i = 0; i < self.listOfColumns().length; i++) {
                        column = self.listOfColumns()[i];
                        if (!!column.AppIndex && i > 0) {
                            updateColumnFromPointRefs(column);
                        }
                    }
                };

            checkColumnsForPointRefs();
            localArray = $.extend(true, [], self.listOfColumns());
            for (i = 0; i < localArray.length; i++) {
                col = validColumn(localArray[i], i);
                localArray[i].error = col.error;
                results.push(localArray[i]);

                if (cleanup && col.valid && results.length > 0) {
                    delete results[results.length - 1].valueList;  // valuelist is only used in UI
                    delete results[results.length - 1].dataColumnName; // dataColumnName is only used in UI
                    delete results[results.length - 1].rawValue; // rawValue is only used in UI
                    delete results[results.length - 1].error; // error is only used in UI
                    delete results[results.length - 1].softDeleted; // error is only used in UI
                    delete results[results.length - 1].bitstringEnums; // error is only used in UI
                    delete results[results.length - 1].upi; // error is only used in UI
                }
            }

            if (cleanup) {
                cleanPointRefArray();
            }

            return results;
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
        globalSetAllColumnValues = function (columnField, newValue) {
            self.listOfColumns().forEach(function (column) {
                column[columnField] = newValue;
            });
            updateListOfColumns(self.listOfColumns());
        },
        validateFilters = function (cleanup) {
            var results = [],
                valid,
                push,
                pointRef,
                filters,
                filter,
                i,
                checkFiltersForPointRefs = function () {
                    for (i = 0; i < self.listOfFilters().length; i++) {
                        filter = self.listOfFilters()[i];
                        if (filter.valueType === "UniquePID" && !!filter.AppIndex) {
                            updateFilterFromPointRefs(filter);
                        }
                    }
                };

            checkFiltersForPointRefs();
            filters = $.extend(true, [], self.listOfFilters());
            for (i = 0; i < filters.length; i++) {
                if (filters[i].filterName !== "") {
                    valid = true;
                    push = true;
                    filter = filters[i];
                    switch (filter.valueType) {
                        case "Timet":
                        case "DateTime":
                            if (moment.unix(filter.date).isValid()) {
                                delete filter.error;
                            } else {
                                valid = false;
                                filter.error = "Invalid Date format in Filters";
                            }
                            if (parseInt(filter.time, 10) === 0) {
                                filter.time = "00:00";
                            }
                            if (filter.time.toString().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                                filter.value = getFilterAdjustedDatetime(filter);
                                delete filter.error;
                            } else {
                                valid = false;
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
                                pointRef = getPointRef(filter, "Qualifier Point");
                                if (!!pointRef) {
                                    filter.value = pointRef.PointName;
                                } else {  // upi not in pointref array
                                    push = false;
                                }
                            }
                            break;
                    }

                    if (push) {
                        results.push(filter);
                    }

                    if (cleanup && valid && results.length > 0) {  // clean fields only used during UI
                        delete results[results.length - 1].valueList;
                        delete results[results.length - 1].error;
                        delete results[results.length - 1].softDeleted;
                        delete results[results.length - 1].upi; // error is only used in UI
                    }
                }
            }

            if (cleanup) {
                cleanPointRefArray();
            }

            return results;
        },
        initFilters = function (theFilters) {
            var result = [],
                i,
                currentFilter,
                len = theFilters.length,
                validFilter;

            for (i = 0; i < len; i++) {
                currentFilter = theFilters[i];
                validFilter = true;
                if (!!currentFilter.AppIndex) {
                    updateFilterFromPointRefs(currentFilter);
                    if (!pointReferenceHardDeleted(currentFilter, "Qualifier Point")) {
                        if (pointReferenceSoftDeleted(currentFilter, "Qualifier Point")) {
                            console.log("softdeleted theFilters[" + i + "].upi = " + currentFilter.upi);
                            currentFilter.softDeleted = true;
                        }
                    } else {
                        validFilter = false;
                        console.log("'" + currentFilter.name + "' has been 'Destroyed', filter " + i + " is being removed from the displayed report.");
                    }
                }

                if (validFilter) {
                    currentFilter.valueList = getValueList(currentFilter.filterName, currentFilter.filterName);
                    result.push(currentFilter);
                }
            }

            return result;
        },
        initColumns = function (theColumns) {
            var result = [],
                i,
                len = theColumns.length,
                currentColumn,
                valid;

            for (i = 0; i < len; i++) {
                currentColumn = theColumns[i];
                valid = true;

                if (!!currentColumn.AppIndex && i > 0) {
                    updateColumnFromPointRefs(currentColumn);
                    if (!pointReferenceHardDeleted(currentColumn, "Column Point")) {
                        if (pointReferenceSoftDeleted(currentColumn, "Column Point")) {
                            console.log("softdeleted theColumns[" + i + "].colName = " + theColumns[i].colName);
                            currentColumn.softDeleted = true;
                        }
                    } else {
                        valid = false;
                        console.log("'" + currentColumn.colName + "' has been 'Destroyed', column " + i + " is being removed from the displayed report.");
                    }
                }

                if (valid) {
                    currentColumn.canCalculate = columnCanBeCalculated(currentColumn);
                    switch (self.reportType) {
                        case "Property":
                            currentColumn.canBeCharted = columnCanBeCharted(currentColumn);
                            if (currentColumn.valueType === "BitString") {
                                currentColumn.bitstringEnums = Config.Enums[currentColumn.colName + ' Bits'];
                            }
                            currentColumn.dataColumnName = currentColumn.colName;
                            break;
                        case "History":
                            currentColumn.valueList = "";
                            currentColumn.canBeCharted = columnCanBeCharted(currentColumn);
                            currentColumn.dataColumnName = (i === 0 && currentColumn.colName === "Date" ? currentColumn.colName : "point-" + currentColumn.upi);
                            if (!Array.isArray(currentColumn.calculation)) {
                                currentColumn.calculation = [];
                            }
                            break;
                        case "Totalizer":
                            currentColumn.valueList = getTotalizerValueList(currentColumn.pointType);
                            currentColumn.canBeCharted = columnCanBeCharted(currentColumn);
                            currentColumn.dataColumnName = (i === 0 && currentColumn.colName === "Date" ? currentColumn.colName : "point-" + currentColumn.upi + " - " + currentColumn.operator.toLowerCase());
                            if (!Array.isArray(currentColumn.calculation)) {
                                currentColumn.calculation = [];
                            }
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
                options = Config.Utility.pointTypes.getEnums(property, pointType),
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
            return Config.Enums.Properties[key];
        },
        collectEnumProperties = function () {
            getPointPropertiesForFilters();
            getPointPropertiesForColumns();
        },
        getPointPropertiesForFilters = function () {
            var props = Config.Enums.Properties,
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
        getValueBasedOnText = function (array, text) {
            var answer;
            for (var i = 0; i < array.length; i++) {
                if (array[i].text === text) {
                    answer = array[i].value;
                    break;
                }
            }
            return answer;
        },
        configureSelectedDuration = function (durationObject) {
            if (!!durationObject) {
                self.selectedDuration({
                    startDate: $.isNumeric(durationObject.startDate) ? moment.unix(durationObject.startDate) : durationObject.startDate,
                    startTimeOffSet: durationObject.startTimeOffSet,
                    endDate: $.isNumeric(durationObject.endDate) ? moment.unix(durationObject.endDate) : durationObject.endDate,
                    endTimeOffSet: durationObject.endTimeOffSet,
                    selectedRange: (!!durationObject.selectedRange ? durationObject.selectedRange : "")
                });

                self.durationStartTimeOffSet(durationObject.startTimeOffSet);
                self.durationEndTimeOffSet(durationObject.endTimeOffSet);
                if (!!durationObject.interval) {
                    self.interval(durationObject.interval.text);
                    self.intervalValue(durationObject.interval.value);
                }
            }

            if (typeof self.selectedDuration() === 'object') {
                self.selectedDuration().startTimeOffSet = self.durationStartTimeOffSet();
                self.selectedDuration().endTimeOffSet = self.durationEndTimeOffSet();

                if (self.selectedDuration().selectedRange === "Custom Range") {
                    self.startDate = getAdjustedDatetimeUnix(self.selectedDuration().startDate.unix(), self.durationStartTimeOffSet());
                    self.endDate = getAdjustedDatetimeUnix(self.selectedDuration().endDate.unix(), self.durationEndTimeOffSet());
                } else {
                    var dateRange = reportDateRanges(self.selectedDuration().selectedRange);
                    self.selectedDuration().startDate = getAdjustedDatetimeMoment(dateRange[0], self.durationStartTimeOffSet());
                    self.selectedDuration().endDate = getAdjustedDatetimeMoment(dateRange[1], self.durationEndTimeOffSet());
                    self.startDate = self.selectedDuration().startDate.unix();
                    self.endDate = self.selectedDuration().endDate.unix();
                }
                self.selectedDuration().duration = self.selectedDuration().endDate.diff(self.selectedDuration().startDate);
            }

            self.selectedDuration.valueHasMutated();
        },
        buildReportDataRequest = function () {
            var result,
                i,
                j,
                columns,
                columnConfig,
                filters,
                activeError = false,
                upis = [],
                uuid,
                formatFilters = function (allFilters) {
                    var filter,
                        i;
                    for (i = 0; i < allFilters.length; i++) {
                        filter = allFilters[i];
                        console.log("filter  = " + JSON.stringify(filter));
                        if (!!filter.error) {
                            displayError(filter.error);
                            activeError = true;
                        }
                        if (filter.valueType === "BitString") {
                            var total = 0,
                                key,
                                bitStringEnums = Config.Enums[filter.filterName + ' Bits'];

                            for (key in bitStringEnums) {
                                if (bitStringEnums.hasOwnProperty(key)) {
                                    if (key !== "All") {
                                        total += bitStringEnums[key].enum;
                                    }
                                }
                            }

                            filter.value = 0;
                            for (j = 0; j < filter.bitStringEnumsArray.length; j++) {
                                key = filter.bitStringEnumsArray[j].name;
                                if (bitStringEnums.hasOwnProperty(key)) {
                                    if (filter.bitStringEnumsArray[j].checked) {
                                        //console.log("bitStringEnums[" + key + "].enum  = " + bitStringEnums[key].enum);
                                        filter.value += bitStringEnums[key].enum;
                                        //console.log("filter.value  = " + filter.value);
                                    }
                                    if (filter.value === total) {
                                        filter.value = bitStringEnums.All.enum;
                                    }
                                }
                            }
                        }
                    }
                },
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

            columns = validateColumns(); //self.listOfColumns();
            filters = validateFilters(); //self.listOfFilters();

            if (columns.length > 1) {
                // collect UPIs from Columns
                for (i = 0; i < columns.length; i++) {
                    columnConfig = columns[i];
                    if (!!columns[i].error) {
                        displayError(columns[i].error);
                        activeError = true;
                        $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").addClass("danger");
                    } else {
                        $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").removeClass("danger");
                        if (columns[i].upi > 0) {
                            upis.push({
                                upi: parseInt(columns[i].upi, 10),
                                op: (columns[i].operator).toLowerCase()
                            });
                        }
                    }
                }

                if (self.reportType === "Totalizer" || self.reportType === "History") {
                    configureSelectedDuration();
                } else {
                    if (filters.length > 0) {
                        formatFilters(filters);
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
                            pointFilter = (scheduled ? point["Report Config"].pointFilter : getPointLookupFilterValues($pointSelectorIframe.contents()));
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
                        reportConfig: cleanUpReportConfig(point["Report Config"]),
                        reportType: point["Report Type"].Value,
                        sort: ""
                    };
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
            $editColumnModal = $direports.find("#editColumnModal");
            $viewColumnModal = $direports.find("#viewColumnModal");
            $globalEditColumnModal = $direports.find("#globalEditColumnModal");
            $tabs = $direports.find(".tabs");
            $tabConfiguration = $direports.find(".tabConfiguration");
            $tabViewReport = $direports.find(".tabViewReport");
            $dataTablePlaceHolder = $direports.find(".dataTablePlaceHolder");
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
            $saveReportButton = $direports.find(".saveReportButton");
            $pointSelectorIframe = $filterByPoint.find(".pointLookupFrame");
            $reportTitleInput = $direports.find(".reporttitle").find("input");
            $filtersTbody = $direports.find('.filtersGrid tbody');
            $columnsTbody = $direports.find('.columnsGrid .sortablecolums');
            $reportColumns = $direports.find("#reportColumns");
            $additionalFilters = $direports.find("#additionalFilters");
            $popAction = $direports.find(".pop.popInOutDiv");
            $hiddenPlaceholder = $direports.find(".hiddenPlaceholder");
            $globalPrecision = $hiddenPlaceholder.find("input.globalPrecision");
            $globalIncludeInChart = $hiddenPlaceholder.find("input.globalChartCheckbox");
            $availableChartTypesChartTab = $direports.find(".availableChartTypes.chartTab");
            $reportChartDiv = $direports.find(".reportChartDiv");
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
                $customField,
                rawValue,
                result = {};

            if (typeof dataField !== 'object') {
                rawValue = dataField;
            } else if (typeof dataField === 'object') {
                rawValue = dataField.Value;
                result = dataField;
            }
            result.rawValue = rawValue;
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
                    case "Integer":
                        if ($.isNumeric(rawValue)) {
                            result.Value = toFixedComma(columnConfig.multiplier * rawValue, columnConfig.precision);
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
                            var temp = result.Value.toString().toLowerCase();
                            result.Value = temp[0].toUpperCase() + temp.substring(1);
                        }
                        break;
                    case "BitString":
                        htmlString = buildBitStringHtml(columnConfig, rawValue, true);
                        $customField = $(htmlString);
                        result.Value = $customField.html();
                        break;
                    case "Enum":
                    case "undecided":
                    case "null":
                    case "None":
                        if ($.isNumeric(rawValue)) {
                            if (!!columnConfig.multiplier) {
                                result.Value = toFixedComma(columnConfig.multiplier * rawValue, columnConfig.precision);
                            } else {
                                result.Value = toFixedComma(rawValue, columnConfig.precision);
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
                                result.Value = "";
                                result.rawValue = "";
                            }
                        } else {
                            console.log("dataField.PointInst is UNDEFINED");
                        }
                        break;
                    default:
                        result.Value = rawValue;
                        break;
                }

                if (columnConfig.valueOptions !== undefined) {
                    keyBasedValue = getKeyBasedOnValue(columnConfig.valueOptions, rawValue);
                    if (!!keyBasedValue) {
                        result.Value = keyBasedValue;
                    }
                }
            } else {
                console.log("formatDataField()  columnConfig is undefined");
            }
            return result;
        },
        pivotHistoryData = function (historyData) {
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
                    columnKey = "point-" + columnUPI;
                    tempPivot[columnKey] = {};
                    if (historyResults[j].Value === undefined) {
                        tempPivot[columnKey].Value = "";
                        tempPivot[columnKey].rawValue = "";
                    } else {
                        columnConfig = getColumnConfigByUPI(columnUPI);
                        if (columnConfig === undefined) {
                            console.log("ERROR: columnConfig is undefined for columnName = " + columnUPI);
                        }
                        //console.log("[" + i + "] ==>  historyResults[" + j + "].Value = " + historyResults[j].Value);
                        tempPivot[columnKey] = formatDataField(historyResults[j], columnConfig);
                    }
                }
                pivotedData.push(tempPivot);
            }

            return pivotedData;
        },
        pivotTotalizerData = function (totalizerData) {
            var columnConfig,
                columnUPI,
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
                        columnConfig = getColumnConfigByOperatorAndUPI(operator, totalizerData[i].upi);
                        columnUPI = columnConfig.upi + " - " + operator;
                        columnKey = "point-" + columnUPI;
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
                                tempPivot[columnKey].Value = toFixedComma(columnConfig.multiplier * rawValue, columnConfig.precision);
                            }
                            tempPivot[columnKey].rawValue = parseFloat(rawValue);
                        }
                    }
                    pivotedData.push(tempPivot);
                }
            }

            return pivotedData;
        },
        cleanResultData = function (data) {
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

                    data[i][columnName] = formatDataField(data[i][columnName], columnConfig);
                }
            }

            return data;
        },
        parseNumberValue = function (theValue, rawValue, eValue) {
            var result;
            result = parseFloat(theValue.toString().replace(",",""));
            if (isNaN(result)) {
                result = (eValue !== undefined ? parseFloat(eValue) : parseFloat(rawValue));
                if (isNaN(result)) {
                    result = rawValue;
                }
            }
            return (isNaN(result) || result === "" ? 0 : result);
        },
        setYaxisValues = function (chartData) {
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
        getOnlyChartData = function (data) {
            self.activeRequestForChart(true);
            self.chartSpinnerTitle("Formatting Data for Chart");
            var columnArray = $.extend(true, [], self.listOfColumns()),
                columnConfig,
                i,
                len = data.length,
                j,
                columnData = [],
                columnsLength = columnArray.length,
                columnName,
                columnDataFound,
                result = [],
                fieldValue,
                columnSum = 0,
                totalAmount = 0;

            for (j = 1; j < columnsLength; j++) {
                columnSum = 0;
                columnConfig = {};
                columnConfig = columnArray[j];
                columnName = (columnConfig.dataColumnName !== undefined ? columnConfig.dataColumnName : columnConfig.colName);
                if (columnConfig.includeInChart) {
                    if (self.selectedChartType() !== "Pie") {
                        columnData = [];
                    }
                    for (i = 0; i < len; i++) {
                        columnDataFound = (data[i][columnName] !== undefined);
                        if (columnDataFound) {
                            fieldValue = parseNumberValue(data[i][columnName].Value, data[i][columnName].rawValue, data[i][columnName].eValue);
                            switch (self.reportType) {
                                case "History":
                                case "Totalizer":
                                    if (self.selectedChartType() === "Pie") {
                                        columnSum += parseFloat(data[i][columnName].rawValue);
                                    } else {
                                        columnData.push({
                                            timeStamp: moment.unix(data[i].Date.rawValue).toDate(),
                                            value: fieldValue,
                                            enumText: (!!columnConfig.valueOptions ? getKeyBasedOnValue(columnConfig.valueOptions, fieldValue) : "")
                                        });
                                    }
                                    break;
                                case "Property":
                                    if (self.selectedChartType() === "Pie") {
                                        columnSum += ($.isNumeric(data[i][columnName].rawValue) ? parseFloat(data[i][columnName].rawValue) : 0);
                                    } else {
                                        columnData.push({
                                            value: fieldValue
                                        });
                                    }
                                    break;
                                default:
                                    console.log(" - - - DEFAULT  getOnlyChartData()");
                                    break;
                            }
                        } else {  // data was NOT found for this column
                            console.log("data[" + i + " ][" + columnName + "] not found");
                        }
                    }
                    if (self.selectedChartType() === "Pie") {
                        columnData.push({
                            name: columnConfig.colName,
                            y: parseFloat(columnSum)
                        });
                        totalAmount += parseFloat(columnSum);
                    } else {
                        if (columnData.length > 0) {
                            result.push({
                                data: columnData,
                                name: columnConfig.colName,
                                yAxis: self.yaxisGroups.indexOf(columnConfig.yaxisGroup)
                            });
                        }
                    }
                }
            }
            if (self.selectedChartType() === "Pie") {
                for (i = 0; i < columnData.length; i++) {
                    columnData[i].y = parseFloat(toFixed((columnData[i].y / totalAmount) * 100, 3));
                }
                result.push({
                    name: 'Total',
                    colorByPoint: true,
                    data: columnData
                });
            }
            return setYaxisValues(result);
        },
        buildPrintableTable = function () {
            var $dataTablesScrollHead,
                $dataTablesScrollBody,
                $dataTablesScrollFoot;

            $dataTablesScrollHead = $dataTablePlaceHolder.find('thead');
            $dataTablesScrollBody = $dataTablePlaceHolder.find('tbody');
            $dataTablesScrollFoot = $dataTablePlaceHolder.find('tfoot');
        },
        adjustGridColumnTabWidth = function () {
            var infoscanHeader = 95,
                adjustHeight,
                $activePane = $tabViewReport.find(".tab-pane.active");

            $tabViewReport.css('width', window.innerWidth - 83);
            $tabViewReport.find(".tab-content").css('width', $tabViewReport.width());

            if ($activePane.attr("id") === "chartData") {
                $activePane.css('height', (window.innerHeight - 90));
                $activePane.css('width', (window.innerWidth - 130));
                $activePane.css('margin-top', '-22px');
            } else if ($activePane.attr("id") === "gridData") {
                setInfoBarDateTime();
                adjustHeight = $dataTablesScrollBody.height() - (($dataTablesWrapper.height() + infoscanHeader) - window.innerHeight);
                $dataTablesScrollHead.css('width', $dataTablesWrapper.width() - 17); // allow for scrolly in body
                $dataTablesScrollBody.css('height', adjustHeight);
                $dataTablesScrollBody.css('width', $dataTablesWrapper.width());
                $dataTablesScrollFoot.css('width', $dataTablesWrapper.width() - 17); // allow for scrolly in body
                $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
            }
        },
        adjustViewReportTabHeightWidth = function () {
            var infoscanHeader = 95,
                adjustHeight,
                $dataTablesScrollHead,
                $dataTablesScrollBody,
                $dataTablesScrollFoot,
                $dataTablesWrapper,
                $activePane = $tabViewReport.find(".tab-pane.active");

            $tabViewReport.css('width', window.innerWidth - 83);
            $tabViewReport.css('height', window.innerHeight);
            $tabViewReport.find(".tab-content").css('width', $tabViewReport.width());
            $tabViewReport.find(".tab-content").css('height', $tabViewReport.height() - 45);

            if ($activePane.attr("id") === "chartData") {
                $activePane.css('height', (window.innerHeight - 90));
                $activePane.css('width', (window.innerWidth - 130));
                $activePane.css('margin-top', '-22px');
            } else if ($activePane.attr("id") === "gridData") {
                $dataTablesScrollHead = $tabViewReport.find('.dataTables_scrollHead');
                $dataTablesScrollBody = $tabViewReport.find('.dataTables_scrollBody');
                $dataTablesScrollFoot = $tabViewReport.find('.dataTables_scrollFoot');
                $dataTablesWrapper = $tabViewReport.find('.dataTables_wrapper');

                setInfoBarDateTime();
                adjustHeight = $dataTablesScrollBody.height() - (($dataTablesWrapper.height() + infoscanHeader) - window.innerHeight);
                $dataTablesScrollHead.css('width', $dataTablesWrapper.width() - 17); // allow for scrolly in body
                $dataTablesScrollBody.css('height', adjustHeight);
                $dataTablesScrollBody.css('width', $dataTablesWrapper.width());
                $dataTablesScrollFoot.css('width', $dataTablesWrapper.width() - 17); // allow for scrolly in body
                $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
            }
        },
        adjustConfigTabActivePaneHeight = function () {
            var $activePane = $tabConfiguration.find(".tab-pane.active");
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
                        if ($tabViewReport.find(".tab-pane.active").attr("id") === "chartData") {
                            renderChart();
                        } else {
                            adjustViewReportTabHeightWidth();
                        }
                    } else {
                        adjustConfigTabActivePaneHeight();
                    }
                }
            }, resizeTimer);
        },
        saveReportConfig = function () {
            point["Report Config"].columns = validateColumns(true);
            point["Report Config"].filters = validateFilters(true);
            pointFilter = getPointLookupFilterValues($pointSelectorIframe.contents());
            point["Report Config"].pointFilter = pointFilter;
            point["Report Config"].selectedPageLength = self.selectedPageLength();
            point["Report Config"].selectedChartType = self.selectedChartType();
            point["Report Config"].reportTitle = self.reportDisplayTitle();
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
            point._name1 = point.name1.toLowerCase();
            point._name2 = point.name2.toLowerCase();
            point._name3 = point.name3.toLowerCase();
            point._name4 = point.name4.toLowerCase();
            point.Name = point.name1 + "_" + point.name2 + "_" + point.name3 + "_" + point.name4;
            point.Name = point.Name.replace(/_\s*$/, "");
            point._Name = point.Name.toLowerCase();

            if (point._pStatus !== 0) {
                reportSocket.emit('addPoint', {
                    point: point
                });
            } else {
                reportSocket.emit('updatePoint', JSON.stringify({
                    'newPoint': point,
                    'oldPoint': originalPoint
                }));
            }
        },
        setReportEvents = function () {
            var i,
                numberOfRowsPerPage,
                intervals,
                calculations,
                entriesPerPage,
                chartTypes,
                precisionEventsSet = false,
                precisionOriginalField,
                includeInChartEventsSet = false,
                includeInChartOriginalField;

            $(window).resize(function () {
                handleResize();
            });

            if (!scheduled) {
                $direports.find(".addColumnButton").on('click', function (e) {
                    var defaultColName = ((self.reportType === "Totalizer") || (self.reportType === "History") ? "Choose Point" : "Choose Property"),
                        rowTemplate = {
                            colName: defaultColName,
                            colDisplayName: "",
                            valueType: "String",
                            operator: "",
                            calculation: [],
                            canCalculate: false,
                            canBeCharted: false,
                            includeInChart: false,
                            multiplier: 1,
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

                $saveReportButton.on('click', function () {
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

                $dataTablePlaceHolder.on('click', '.pointInstance', function () {
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

                if (!!reportSocket) {
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
                            self.reportDisplayTitle(originalPoint.Name.replace("_", " "));
                            $tabConfiguration.find(".screenMessages").find(".errorMessage").text(data.err);
                        }
                        blockUI($tabConfiguration, false);
                    });
                }

                $dataTablePlaceHolder.on('column-reorder.dt', function (event, settings, details) {
                    var columnsArray = $.extend(true, [], self.listOfColumns()),
                        swapColumnFrom = $.extend(true, {}, columnsArray[details.iFrom]);  // clone from field
                    columnsArray.splice(details.iFrom, 1);
                    columnsArray.splice(details.iTo, 0, swapColumnFrom);
                    updateListOfColumns(columnsArray);
                    $dataTablePlaceHolder.DataTable().draw("current");
                    console.log("moved column '" + details.from + "' to column '" + details.to + "'");
                });

                $dataTablePlaceHolder.on('column-resize.dt', function (event, settings, details) {
                    var columnsArray = $.extend(true, [], self.listOfColumns());
                    columnsArray[details.resizedColumn].width = details.width;
                    updateListOfColumns(columnsArray);
                    $dataTablePlaceHolder.DataTable().draw("current");
                    // console.log("column '" + details.resizedColumn + "' width set to '" + details.width + "'");
                });

                $dataTablePlaceHolder.on('length.dt', function (e, settings, len) {
                    self.selectedPageLength(len);
                    setTimeout(function () {
                        adjustViewReportTabHeightWidth();
                    }, 10);
                });

                $dataTablePlaceHolder.on('page.dt', function (e, settings) {
                    setTimeout(function () {
                        adjustViewReportTabHeightWidth();
                    }, 10);
                });

                $dataTablePlaceHolder.on('search.dt', function (e, settings) {
                    setTimeout(function () {
                        adjustViewReportTabHeightWidth();
                    }, 10);
                });

                // $dataTablePlaceHolder.on( 'buttons-action', function ( e, buttonApi, dataTable, node, config ) {
                //     console.log( 'Button '+buttonApi.text()+' was activated' );
                // });

                $columnsGrid.find(".precisionColumn").on('mousedown', function (e) {
                    if (self.canEdit()) {
                        longClickStart = moment();
                    }
                });

                $columnsGrid.find(".precisionColumn").on('click', function (e) {
                    if (self.canEdit()) {
                        if (moment().diff(longClickStart) > longClickTimer) {  // longclicked
                            if (!precisionEventsSet) {
                                precisionOriginalField = $(this).html();
                            }

                            if ($(this).html() === "Precision") {
                                $globalPrecision.removeClass("hidden");
                                $(this).html("");
                                $globalPrecision.appendTo($(this));
                                $(this).find("input").focus();
                            }

                            if (!precisionEventsSet) {
                                precisionEventsSet = true;
                                $(this).focusout(function (e) {
                                    $globalPrecision.appendTo($hiddenPlaceholder);
                                    $(this).html(precisionOriginalField);
                                });

                                $(this).keyup(function (event) {
                                    if (event.keyCode === 13) {
                                        var precision;
                                        if (isNaN($(this).find("input").val()) || $(this).find("input").val() === "") {
                                            $(this).find("input").val(0);
                                        }
                                        precision = $(this).find("input").val();
                                        self.globalPrecisionValue(parseInt(precision, 10));
                                        globalSetAllColumnValues("precision", self.globalPrecisionValue());
                                    }
                                });
                            }
                        }
                    }
                });

                $columnsGrid.find("th .includeInChartColumn").on('mousedown', function (e) {
                    if (self.canEdit()) {
                        longClickStart = moment();
                    }
                });

                $columnsGrid.find("th .includeInChartColumn").on('click', function (e) {
                    if (self.canEdit()) {
                        if (moment().diff(longClickStart) > longClickTimer) {  // longclicked
                            if (!includeInChartEventsSet) {
                                includeInChartOriginalField = $(this).html();
                            }

                            if ($(this).html() === "Chart") {
                                $globalIncludeInChart.removeClass("hidden");
                                $(this).html("");
                                $globalIncludeInChart.appendTo($(this));
                                $(this).find("input").focus();
                            }

                            if (!includeInChartEventsSet) {
                                includeInChartEventsSet = true;
                                $(this).focusout(function (e) {
                                    $globalIncludeInChart.appendTo($hiddenPlaceholder);
                                    $(this).html(includeInChartOriginalField);
                                });

                                $(this).click(function (event) {
                                    if (event.target.checked !== undefined) {
                                        globalSetAllColumnValues("includeInChart", event.target.checked);
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
            }

            $dataTablePlaceHolder.on('draw.dt', function (e, settings) {
                // console.log('. . . . . . . . .    draw.dt   . . . . . . . . .');
                var numberOfPages = $dataTablePlaceHolder.DataTable().page.info().pages,
                    $tablePagination,
                    $pagination,
                    $paginate_buttons,
                    $dataTablesTBody,
                    $tableRows;

                if (numberOfPages === 1) {
                    $tablePagination = $tabViewReport.find(".dataTables_paginate");
                    $pagination = $tablePagination.find("ul.pagination");
                    $paginate_buttons = $pagination.find(".paginate_button");
                    $paginate_buttons = $paginate_buttons.not("li.active");
                    $paginate_buttons.hide();
                }

                if (!self.activeRequestDataDrawn()) {
                    numberOfRowsPerPage = 10;
                    $dataTablesTBody = $dataTablePlaceHolder.find('tbody');
                    $tableRows = $dataTablesTBody.find("tr");
                    for (i = 0; i < $tableRows.length; i+=numberOfRowsPerPage) {
                        if (i > (numberOfRowsPerPage - 1)) {
                            $($tableRows[i]).addClass("page-break");
                            // $($tableRows[i]).css("page-break-after", "always");
                        }
                    }

                    // console.log('. . . . . . . . . . .   requested data has been rendered   . . . . . . . . .');
                    if (scheduled && self.chartable()) {
                        console.log('. . . .   scheduled report  . . . .');
                        //self.requestChart();
                    } else {
                        setTimeout(function () {
                            self.activeRequestDataDrawn(true);
                        }, 1000);
                    }
                }
            });

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
                    text: "Line",
                    value: "line"
                }, {
                    text: "Column",
                    value: "column"
                }, {
                    text: "Pie",
                    value: "pie"
                }, {
                    text: "Spline",
                    value: "spline"
                }
            ];

            self.listOfIntervals(intervals);
            self.listOfCalculations(calculations);
            self.listOfEntriesPerPage = entriesPerPage;
            self.listOfChartTypes = chartTypes;
            checkForColumnCalculations();
            checkForIncludeInChart();
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
                            }
                            break;
                        case "Property":
                            if (columnConfig.colName === "Name") {
                                $(tdField).attr("upi", data._id);
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
                        pointType = Config.Utility.pointTypes.getPointTypeNameFromEnum(data[columnConfig.colName].PointType);
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
                            break;
                        case "Totalizer":
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

                    result = {
                        title: columnTitle,
                        data: columnConfig.dataColumnName,
                        // data: columnConfig.dataColumnName + ".Value",
                        width: (!!columnConfig.width ? columnConfig.width : "auto"),
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

                        switch (typeOfCalc) {
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
                                calc.pageCalc = (!sameDataSet ? getColumnStandardDeviation(currentPageRawValues) : calc.totalCalc);
                                break;
                            default:
                                console.log(" - - - DEFAULT  getCalcForColumn()");
                                break;
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
                $dataTablePlaceHolder.DataTable({
                    api: true,
                    dom: (!scheduled ? 'Blfrtip' : 'lfrtip'),
                    buttons: (!scheduled ? [
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
                                    orientation: (aoColumns.length > 4 ? "landscape" : "portrait"),
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
                                var $documentBody = $(win.document.body),
                                    $documentHead = $(win.document.head),
                                    $table = $documentBody.find("table"),
                                    classes,
                                    hostAndProtocol = window.location.protocol + '//' + window.location.host;

                                $documentHead.find('link[rel=stylesheet]').remove();
                                $documentHead.append('<link rel="stylesheet" href="' + hostAndProtocol + '/css/reports/reportprinting.css" type="text/css" />');
                                $table.removeClass("table-striped dataTablePlaceHolder dataTable");
                                $table.addClass('table').addClass('table-sm');
                                $table.css("padding", "2px");
                                for (i = 0; i < columnsArray.length; i++) {
                                    classes = setColumnClasses(columnsArray[i], i);
                                    $table.find("td:nth-child(" + (i + 1) + ")").addClass(classes);
                                }
                            }
                        }
                    ] : undefined),
                    drawCallback: function (settings) {
                        setInfoBarDateTime();
                    },
                    headerCallback: function (thead, data, start, end, display) {
                        var reportColumns = $.extend(true, [], self.listOfColumns()),
                            i,
                            colIndex = 0,
                            $theads;
                        for (i = 0; i < reportColumns.length; i++) {
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
                            j,
                            columnIndex,
                            currentPageData,
                            allData,
                            sameDataSet,
                            numberOfColumnsToCalculate = columnIndexesToCalc.length,
                            columnConfig,
                            calc,
                            calcs,
                            pageFooterText,
                            totalFooterText,
                            footerText,
                            footerTitle,
                            $tdFooter;

                        for (i = 0; i < numberOfColumnsToCalculate; i++) {
                            footerText = "";
                            footerTitle = "";
                            pageFooterText = "";
                            columnIndex = columnIndexesToCalc[i];
                            columnConfig = reportColumns[columnIndex];
                            currentPageData = api.column(columnIndex, {page: 'current'}).data();
                            allData = api.column(columnIndex).data();
                            sameDataSet = (currentPageData.length === allData.length);
                            calcs = getCalcForColumn(currentPageData, allData, columnConfig);
                            $tdFooter = $(tfoot).find("td[colindex='" + columnIndex + "']");
                            $tdFooter.popover("destroy");

                            for (j = 0; j < columnConfig.calculation.length; j++) {
                                calc = calcs[j];

                                switch (self.reportType) {
                                    case "History":
                                        if (!sameDataSet) {
                                            pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + toFixedComma(calc.pageCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                        }
                                        totalFooterText = "Total " + columnConfig.calculation[j] + ": " + toFixedComma(calc.totalCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "<br />";
                                        break;
                                    case "Totalizer":
                                        if (columnConfig.operator.toLowerCase() === "runtime") {
                                            if (!sameDataSet) {
                                                pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + getDurationText(calc.pageCalc, columnConfig.precision, totalizerDurationInHours) + "</span>";
                                            }
                                            totalFooterText = "Total " + columnConfig.calculation[j] + ": " + getDurationText(calc.totalCalc, columnConfig.precision, totalizerDurationInHours) + "<br />";
                                        } else {
                                            if (!sameDataSet) {
                                                pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + toFixedComma(calc.pageCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "</span>";
                                            }
                                            totalFooterText = "Total " + columnConfig.calculation[j] + ": " + toFixedComma(calc.totalCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + "<br />";
                                        }
                                        break;
                                    case "Property":
                                        if (!sameDataSet) {
                                            pageFooterText = "<span>Page " + columnConfig.calculation[j] + ": " + toFixedComma(calc.pageCalc, columnConfig.precision) + "</span>";
                                        }
                                        totalFooterText = "Total " + columnConfig.calculation[j] + ": " + toFixedComma(calc.totalCalc, columnConfig.precision) + "<br />";
                                        break;
                                    default:
                                        console.log(" - - - DEFAULT  footerCallback()");
                                        break;
                                }

                                footerText += (!sameDataSet ? pageFooterText + "<br />" : totalFooterText);
                                footerTitle += (!sameDataSet ? totalFooterText : "");
                            }

                            // $tdFooter.addClass("footerCalc");
                            $tdFooter.html(footerText);
                            if (!sameDataSet) {
                                $tdFooter.attr("data-toggle", "popover");
                                $tdFooter.attr("data-trigger", "click");
                                $tdFooter.attr("data-html", "true");
                                $tdFooter.attr("title", "Entire column");
                                $tdFooter.attr("data-content", footerTitle);
                                $tdFooter.popover({placement: 'top'});
                            }
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
                    data: reportData,
                    columns: aoColumns,
                    colReorder: {
                        fixedColumnsLeft: 1,
                        realtime: false
                    },
                    order: (!scheduled ? [[0, "asc"]] : false), // always default sort by first column
                    scrollY: !scheduled,
                    scrollX: !scheduled,
                    scrollCollapse: !scheduled,
                    lengthChange: !scheduled,
                    paging: !scheduled,
                    ordering: !scheduled,
                    info: !scheduled,
                    responsive: true,
                    lengthMenu: [[10, 15, 24, 48, 75, 100, -1], [10, 15, 24, 48, 75, 100, "All"]],
                    searching: !scheduled,  // search box
                    pageLength: (!scheduled ? parseInt(self.selectedPageLength(), 10) : -1)
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
        breakScheduledReportDataIntoPages = function () {
            var i,
                j,
                row,
                headerArray = [],
                rowArray = [],
                columnsArray = $.extend(true, [], self.listOfColumns()),
                currentPage = [],
                reportDataPages = [];

            if (reportData !== undefined) {
                for (i = 0; i < reportData.length; i++) {
                    row = reportData[i];
                    rowArray = [];
                    for (j = 0; j < columnsArray.length; j++) {
                        if (!!columnsArray[j].dataColumnName) {
                            rowArray.push(row[columnsArray[j].dataColumnName]);
                        }
                    }
                    currentPage.push({cells: rowArray});
                    if (i > 0 && i % rowsPerPage === 0) {
                        headerArray = [];
                        for (j = 0; j < columnsArray.length; j++) {
                            if (!!columnsArray[j].dataColumnName) {
                                headerArray.push({Value: columnsArray[j].colDisplayName});
                            }
                        }

                        reportDataPages.push({
                            header: headerArray,
                            rows: currentPage
                        });
                        currentPage = [];
                    }
                }
            }
            self.scheduledReportData({tables: reportDataPages});
        },
        columnEditReset = function () {
            return {
                colname: "Choose Point",
                colDisplayName: "",
                valueType: "String",
                upi: 0,
                multiplier: 1,
                calculation: [],
                operator: "",
                pointType: "",
                units: "",
                precision: 3,
                includeInChart: false,
                yaxisGroup: "",
                valueList: "",
                dataColumnName: ""
            };
        },
        renderReport = function () {
            if (reportData !== undefined && self.currentTab() === 2) {
                $popAction.show();
                self.reportResultViewed(self.currentTab() === 2);
                blockUI($tabViewReport, false);
                if (scheduled) {
                    breakScheduledReportDataIntoPages();
                    buildPrintableTable();
                    $(document.body).find("script").html(null);
                } else {
                    $dataTablePlaceHolder.DataTable().clear();
                    $dataTablePlaceHolder.DataTable().rows.add(reportData);
                    $dataTablePlaceHolder.DataTable().draw("current");
                    $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
                    self.refreshData(false);
                    self.currentTimeStamp = moment().format("dddd MMMM DD, YYYY hh:mm:ss a");

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

                    adjustViewReportTabHeightWidth();
                }
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
                self.truncatedData(reportData.truncated);
                renderReport();
            } else {
                console.log(" - * - * - renderPropertyReport() ERROR = ", data.err);
            }
        },
        renderChart = function (formatForPrint) {
            var trendPlot,
                maxDataRowsForChart = 50000,
                chartType,
                chartTitle = self.reportDisplayTitle(),
                subTitle = "",
                toolTip,
                yAxisTitle,
                spinnerText,
                chartWidth,
                chartHeight,
                getChartWidth = function () {
                    var answer;

                    if (!!formatForPrint) {
                        answer = 950;
                    } else if (!!scheduled) {
                        answer = 1250;
                    } else {
                        answer = $reportChartDiv.parent().width();
                    }

                    return answer;
                },
                getChartHeight = function () {
                    var answer;

                    if (!!formatForPrint) {
                        answer = 650;
                    } else if (!!scheduled) {
                        answer = 850;
                    } else {
                        answer = $reportChartDiv.parent().height();
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
            adjustViewReportTabHeightWidth();

            chartType = getValueBasedOnText(self.listOfChartTypes, self.selectedChartType());
            chartWidth = getChartWidth();
            chartHeight = getChartHeight();
            reportChartData = getOnlyChartData(reportData);

            if (!!reportChartData && !!reportChartData[0]) {
                if (reportChartData[0].data.length < maxDataRowsForChart) {
                    switch (self.reportType) {
                        case "History":
                            subTitle = self.selectedDuration().startDate.format("MM/DD/YYYY hh:mm a") + " - " + self.selectedDuration().endDate.format("MM/DD/YYYY hh:mm a");
                            yAxisTitle = "Totals";
                            break;
                        case "Totalizer":
                            subTitle = self.selectedDuration().startDate.format("MM/DD/YYYY hh:mm a") + " - " + self.selectedDuration().endDate.format("MM/DD/YYYY hh:mm a");
                            yAxisTitle = "Totals";
                            break;
                        case "Property":
                            break;
                        default:
                            console.log(" - - - DEFAULT  renderChart()");
                            break;
                    }

                    if (reportChartData && self.selectedChartType() !== "Pie") {
                        reportChartData.sort(function (a, b) {
                            return (a.timeStamp > b.timeStamp) ? 1 : -1;
                        });
                    }

                    setTimeout(function () {
                        if ($reportChartDiv.length > 0) {
                            if (self.selectedChartType() === "Pie") {
                                $reportChartDiv.highcharts({
                                    turboThreshold: maxDataRowsForChart,
                                    chart: {
                                        width: chartWidth,
                                        height: chartHeight,
                                        plotBackgroundColor: null,
                                        plotBorderWidth: null,
                                        plotShadow: false,
                                        type: 'pie'
                                    },
                                    title: {
                                        text: chartTitle
                                    },
                                    subtitle: {
                                        text: subTitle
                                    },
                                    tooltip: {
                                        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                                    },
                                    plotOptions: {
                                        pie: {
                                            allowPointSelect: true,
                                            cursor: 'pointer',
                                            dataLabels: {
                                                enabled: true,
                                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                                style: {
                                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                                }
                                            }
                                        }
                                    },
                                    series: reportChartData
                                });
                            } else {
                                if (self.selectedChartType() !== "Column") {
                                    toolTip = {
                                        formatter: function () {
                                            return '<span style="font-size: 10px">' + moment(this.x).format("dddd, MMM Do, YYYY HH:mm") + '</span><br>' + '<span style="color:' + this.point.color + '">●</span> ' + this.point.series.name + ': <b>' + trendPlots.numberWithCommas(this.y) + (!!this.point.enumText ? '-' + this.point.enumText : '') + '</b><br/>';
                                        }
                                    };
                                }

                                trendPlot = new TrendPlot({
                                    turboThreshold: maxDataRowsForChart,
                                    width: chartWidth,
                                    height: chartHeight,
                                    target: $reportChartDiv,
                                    title: chartTitle,
                                    subtitle: subTitle,
                                    y: 'value',
                                    x: 'timeStamp',
                                    enumText: 'enumText',
                                    //highlightMax: true,
                                    data: reportChartData,
                                    type: chartType,
                                    chart: {
                                        zoomType: 'x'
                                    },
                                    tooltip: toolTip,
                                    //plotOptions: {
                                    //    series: {
                                    //        cursor: 'pointer',
                                    //        point: {
                                    //            events: {
                                    //                click: function () {
                                    //                    alert('x: ' + this.x + ', y: ' + this.y);
                                    //                }
                                    //            }
                                    //        }
                                    //    }
                                    //},
                                    xAxis: {
                                        allowDecimals: false
                                    },
                                    legend: {
                                        layout: 'vertical',
                                        align: 'right',
                                        verticalAlign: 'middle',
                                        borderWidth: 0
                                    },
                                    yAxisTitle: yAxisTitle
                                });
                            }
                        }
                        self.activeRequestForChart(false);
                        self.activeRequestDataDrawn(true);
                    }, 110);
                } else {
                    $reportChartDiv.html("Too many data rows for " + self.selectedChartType() + " Chart. Max = " + maxDataRowsForChart);
                    self.activeRequestForChart(false);
                }
            } else {
                $reportChartDiv.html("Chart data not available");
                self.activeRequestForChart(false);
            }
        };

    self.reportType = "";

    self.selectedPageLength = ko.observable("24");

    self.selectedChartType = ko.observable("Line");

    self.currentTimeStamp = "";

    self.startDate = "";

    self.endDate = "";

    self.yaxisGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    self.reportDisplayTitle = ko.observable("");

    self.canEdit = ko.observable(true);

    self.interval = ko.observable("Day");

    self.intervalValue = ko.observable(1);

    self.globalPrecisionValue = ko.observable(3);

    self.allChartCheckboxChecked = ko.observable(false);

    self.durationError = ko.observable(false);

    self.activeRequestDataDrawn = ko.observable(true);

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

    self.listOfEntriesPerPage = [];

    self.listOfChartTypes = [];

    self.listOfFilterPropertiesLength = 0;

    self.listOfColumnPropertiesLength = 0;

    self.filterPropertiesSearchFilter = ko.observable("-blank-");

    self.columnPropertiesSearchFilter = ko.observable("-blank-");

    self.chartSpinnerTitle = ko.observable("");

    self.truncatedData = ko.observable(false);

    self.designChanged = ko.observable(true);

    self.unSavedDesignChange = ko.observable(false);

    self.refreshData = ko.observable(true);

    self.activeDataRequest = ko.observable(false);

    self.activeRequestForChart = ko.observable(false);

    self.reportResultViewed = ko.observable(true);

    self.chartable = ko.observable(false);

    self.currentTab = ko.observable(1);

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

    self.currentColumnEdit = ko.observable(columnEditReset());

    self.printDiv = function () {
        renderChart(true);
        setTimeout(function () {
            $reportChartDiv.css('overflow', 'visible');
            $reportChartDiv.printArea({
                mode: 'iframe'
            });
            $reportChartDiv.css('overflow', 'auto');
        }, 1500);
    };

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

            if (!scheduled) {
                initSocket();
            }

            if (columns) {
                self.reportDisplayTitle((!!point["Report Config"].reportTitle ? point["Report Config"].reportTitle : point.Name.replace(/_/g, " ")));
                self.listOfColumns(initColumns(reportConfig.columns));
                self.listOfFilters(initFilters(reportConfig.filters));
                pointFilter = (reportConfig.pointFilter ? reportConfig.pointFilter : pointFilter);
                self.selectedPageLength((reportConfig.selectedPageLength ? reportConfig.selectedPageLength : self.selectedPageLength()));
                self.selectedChartType((reportConfig.selectedChartType ? reportConfig.selectedChartType : self.selectedChartType()));
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        if (!!point["Report Config"].duration.duration) { // have to set each manually because of computed relationship
                            configureSelectedDuration(point["Report Config"].duration);
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
                self.reportDisplayTitle(point.Name.replace(/_/g, " "));
                point["Point Refs"] = [];  // new report, clear out initial Report create data
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
                            dataColumnName: "Date",
                            valueType: "DateTime",
                            AppIndex: -1,
                            operator: "",
                            calculation: [],
                            canCalculate: false,
                            canBeCharted: false,
                            yaxisGroup: "A",
                            includeInChart: false,
                            multiplier: 1,
                            precision: 0,
                            valueList: [],
                            upi: 0
                        });
                        configureSelectedDuration();
                        break;
                    case "Property":
                        filterOpenPointSelector($filterByPoint);
                        collectEnumProperties();
                        point["Report Config"].returnLimit = 4000;
                        self.listOfColumns.push({
                            colName: "Name",
                            colDisplayName: "Name",
                            dataColumnName: "Name",
                            valueType: "String",
                            AppIndex: -1,
                            precision: 0,
                            calculation: [],
                            canCalculate: false,
                            canBeCharted: false,
                            yaxisGroup: "A",
                            includeInChart: false,
                            multiplier: 1
                        });
                        break;
                    default:
                        console.log(" - - - DEFAULT  init() null columns");
                        break;
                }
            }

            $direports.find("#wrapper").show();
            tabSwitch(1);

            updateListOfFilters(self.listOfFilters());
            setTimeout(function () {
                $reportTitleInput.focus();
            }, 1500);
            setReportEvents();
            adjustConfigTabActivePaneHeight();
            self.filterPropertiesSearchFilter(""); // computed props jolt
            self.columnPropertiesSearchFilter(""); // computed props jolt

            if (scheduled) {
                self.requestReportData();
            } else if (!!externalConfig) {
                if (self.reportType === "History" || self.reportType === "Totalizer") {
                    configureSelectedDuration(externalConfig);
                }
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

    self.displayOperator = function (con) {
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

    self.displayBool = function (val) {
        var answer;
        switch (val) {
            case true:
            case "True":
                answer = "On";
                break;
            case false:
            case "False":
                answer = "Off";
                break;
            default:
                answer = val;
                break;
        }
        return answer;
    };

    self.selectPointForColumn = function (data, index) {
        var upi = parseInt(data.upi, 10),
            currentIndex = (typeof index === "function" ? index() : index),
            columnIndex = parseInt(currentIndex, 10);

        openPointSelectorForColumn(columnIndex, upi);
    };

    self.selectPointForModalColumn = function (data, index) {
        var upi = parseInt(data.upi, 10),
            currentIndex = (typeof index === "function" ? index() : index),
            columnIndex = parseInt(currentIndex, 10);

        openPointSelectorForModalColumn(columnIndex, upi);
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
                width: 1250,
                height: 750
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
        if (!self.durationError()) {
            if (self.currentTab() !== 2) {
                $(".tableFooter > td").popover("destroy");
                var requestObj = buildReportDataRequest();
                if (!!requestObj) {
                    tabSwitch(2);
                    self.selectViewReportTabSubTab("gridData");
                    if (self.reportResultViewed()) {
                        $popAction.hide();
                        self.activeDataRequest(true);
                        self.reportResultViewed(false);
                        if (!scheduled) {
                            configureDataTable(true, true);
                        }
                        reportData = undefined;
                        switch (self.reportType) {
                            case "History":
                                ajaxPost(requestObj, dataUrl + "/report/historyDataSearch", renderHistoryReport);
                                //reportSocket.emit("historyDataSearch", {options: requestObj});
                                break;
                            case "Totalizer":
                                ajaxPost(requestObj, dataUrl + "/report/totalizerReport", renderTotalizerReport);
                                //reportSocket.emit("totalizerReport", {options: requestObj});
                                break;
                            case "Property":
                                ajaxPost(requestObj, dataUrl + "/report/reportSearch", renderPropertyReport);
                                //reportSocket.emit("reportSearch", {options: requestObj});
                                break;
                            default:
                                console.log(" - - - DEFAULT  viewReport()");
                                break;
                        }
                    } else {
                        renderReport();
                    }
                }
            }
        } else {
            displayError("Invalid Date Time selection");
        }
        $('html,body').stop().animate({
            scrollTop: 0
        }, 700);
    };

    self.requestChart = function (printFormat) {
        self.selectViewReportTabSubTab("chartData");
        $reportChartDiv.html("");
        renderChart(printFormat);
    };

    self.focusGridView = function () {
        self.selectViewReportTabSubTab("gridData");
        adjustViewReportTabHeightWidth();
    };

    self.clearColumnPoint = function (indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column = columnEditReset();
        updateListOfColumns(tempArray);
    };

    self.clearModalColumnPoint = function (indexOfColumn) {
        self.currentColumnEdit(columnEditReset());
    };

    self.editColumnSelectYaxisGroup = function (selectedGroup) {
        self.currentColumnEdit().yaxisGroup = selectedGroup;
        self.currentColumnEdit.valueHasMutated();
    };

    self.setEditedColumnData = function () {
        var tempArray = self.listOfColumns();

        tempArray[self.currentColumnEditIndex()] = self.currentColumnEdit();
        updateListOfColumns(tempArray);
        $editColumnModal.modal("hide");
    };

    self.clearColumnCalculation = function (indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.calculation = [];
        updateListOfColumns(tempArray);
    };

    self.globalCalculationClick = function (element, calc) {
        var i,
            tempArray = self.listOfColumns(),
            column;

        if (element.checked === true) {
            for (i = 0; i < tempArray.length; i++) {
                column = tempArray[i];
                if (column.canCalculate === true) {
                    if (column.calculation.indexOf(calc) === -1) {
                        column.calculation.push(calc);
                    }
                }
            }
        } else {
            for (i = 0; i < tempArray.length; i++) {
                column = tempArray[i];
                if (column.calculation.indexOf(calc) !== -1) {
                    column.calculation.splice(column.calculation.indexOf(calc), 1);
                }
            }
        }

        updateListOfColumns(tempArray);
        return true;
    };

    self.calculationClick = function (element, calc, indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];

        if (element.checked === true) {
            if (column.calculation.indexOf(calc) === -1) {
                column.calculation.push(calc);
            }
        } else {
            if (column.calculation.indexOf(calc) !== -1) {
                column.calculation.splice(column.calculation.indexOf(calc), 1);
            }
        }

        updateListOfColumns(tempArray);
        return true;
    };

    self.setGlobalEditedColumnData = function () {
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

        updateListOfColumns(tempArray);
        $globalEditColumnModal.modal("hide");
    };

    self.clearFilterPoint = function (indexOfColumn) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfColumn];

        filter.value = setDefaultFilterValue(filter.valueType);
        if (!!filter.AppIndex) {
            delete filter.AppIndex;
        }
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
        column.dataColumnName = column.colName;
        column.valueType = prop.valueType;
        if (!!column.AppIndex) {
            delete column.AppIndex;
        }
        column.calculation = [];
        column.canCalculate = columnCanBeCalculated(column);
        column.canBeCharted = columnCanBeCharted(column);
        column.yaxisGroup = "A";
        column.includeInChart = false;
        updateListOfColumns(tempArray);
    };

    self.selectPropertyFilter = function (element, indexOfFilter, selectedItem) {
        var tempArray = self.listOfFilters(),
            $elementRow = $(element).parent().parent().parent().parent().parent();
        //$inputField = $elementRow.find(".filterValue").find("input");  // in case we need to validate input field
        tempArray[indexOfFilter] = initializeNewFilter(selectedItem, tempArray[indexOfFilter]);
        updateListOfFilters(tempArray);
    };

    self.selectTotalizerOperator = function (element, indexOfColumn, selectedItem) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.operator = selectedItem;
        column.dataColumnName = column.upi + " - " + column.operator.toLowerCase();
        updateListOfColumns(tempArray);
    };

    self.selectYaxisGroup = function (element, indexOfColumn, selectedItem) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.yaxisGroup = selectedItem;
        updateListOfColumns(tempArray);
    };

    self.selectCalculation = function (element, indexOfColumn, selectedItem) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.calculation = selectedItem;
        updateListOfColumns(tempArray);
    };

    self.selectNumberOfEntries = function (element, selectedItem) {
        for (var i = 0; i < self.listOfEntriesPerPage.length; i++) {
            if (self.listOfEntriesPerPage[i].value === selectedItem) {
                self.selectedPageLength(self.listOfEntriesPerPage[i].unit);
                self.designChanged(true);
                self.unSavedDesignChange(true);
                break;
            }
        }
    };

    self.selectChartType = function (element, selectedItem, drawChart) {
        for (var i = 0; i < self.listOfChartTypes.length; i++) {
            if (self.listOfChartTypes[i].value === selectedItem) {
                self.selectedChartType(self.listOfChartTypes[i].text);
                self.designChanged(true);
                self.unSavedDesignChange(true);
                break;
            }
        }
        if (!!drawChart) {
            renderChart();
        }
    };

    self.includeInChartChanged = function (element, indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.includeInChart = element.checked;
        updateListOfColumns(tempArray);
        return true;
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

    self.selectConfigTabSubTab = function (subTabName) {
        $tabConfiguration.find("ul.nav-tabs").find("li.active").removeClass("active");
        $tabConfiguration.find("ul.nav-tabs").find("li." + subTabName).addClass("active");
        $tabConfiguration.find(".tab-content > .active").removeClass("active");
        $tabConfiguration.find("#" + subTabName).addClass("active");
    };

    self.selectViewReportTabSubTab = function (subTabName) {
        $tabViewReport.find("ul.nav-tabs").find("li.active").removeClass("active");
        $tabViewReport.find("ul.nav-tabs").find("li." + subTabName).addClass("active");
        $tabViewReport.find(".tab-content > .active").removeClass("active");
        $tabViewReport.find("#" + subTabName).addClass("active");
    };

    self.togglePop = function () {
        var options = {
            width: 1080,
            height: 768
        };
        if (window.top.location.href === window.location.href) {  // If we're a pop-out; pop back in
            window.workspaceManager.openWindowPositioned(window.location.href, point.Name, 'report', 'mainWindow', windowUpi);
        } else { // Open the window
            window.workspaceManager.openWindowPositioned(window.location.href, point.Name, 'report', '', windowUpi, options);
        }
    };

    self.editColumn = function (column, index) {
        self.currentColumnEdit(column);
        self.currentColumnEditIndex(index);
        $editColumnModal.modal("show");
        return true;
    };

    self.globalEditColumnFields = function () {
        $globalEditColumnModal.modal("show");
    };

    self.showColumnSettings = function (element, column) {
        self.currentColumnEdit(column);
        //$viewColumnModal.modal("show");
        return true;
    };

    self.hideColumnSettings = function (element) {
        //$viewColumnModal.modal("hide");
        // self.currentColumnEdit({});
        return true;
    };

    self.listOfIntervalsComputed = ko.computed(function () {
        var result = [],
            resetInterval = true,
            intervalDuration,
            currentDuration;

        if (!!self.selectedDuration() && self.selectedDuration().endDate) {
            self.selectedDuration().startDate = getAdjustedDatetimeMoment(self.selectedDuration().startDate, self.durationStartTimeOffSet());
            self.selectedDuration().endDate = getAdjustedDatetimeMoment(self.selectedDuration().endDate, self.durationEndTimeOffSet());
            currentDuration = self.selectedDuration().endDate.diff(self.selectedDuration().startDate);
            self.durationError(currentDuration < 0);

            if (!self.durationError()) {
                result = self.listOfIntervals().filter(function (interval) {
                    return (moment.duration(1, interval.text).asMilliseconds() <= currentDuration);
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
            } else {
                displayError("Invalid Date Time selection");
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

    self.displayChartSpinner = ko.computed(function () {
        return (self.activeRequestForChart());
    }, self);

    self.displayTabSpinner = ko.computed(function () {
        return self.activeDataRequest();
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
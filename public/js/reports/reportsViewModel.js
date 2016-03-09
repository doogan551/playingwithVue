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
    ko.bindingHandlers.reportDatePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = {
                autoclose: true,
                clearBtn: true
            };

            $(element).datepicker(options).on("changeDate", function (ev) {
                var $dependantDatePicker,
                    val = $.isFunction(valueAccessor()) ? valueAccessor() : parseInt(valueAccessor(), 10);
                if (ev.date) {
                    viewModel.date = moment(ev.date).unix();
                } else {
                    if (val !== '') {
                        viewModel.date = val;
                    }
                }

                if ($(element).hasClass("startDate")) { // if startdate changed adjust limits on Enddate
                    $dependantDatePicker = $(element).closest('tr').next().find(".endDate");
                    $dependantDatePicker.datepicker("setStartDate", moment.unix(viewModel.date).format("MM/DD/YYYY"));
                } else if ($(element).hasClass("endDate")) {  // if enddate changed adjust limits on startdate
                    $dependantDatePicker = $(element).closest('tr').prev().find(".startDate");
                    $dependantDatePicker.datepicker("setEndDate", moment.unix(viewModel.date).format("MM/DD/YYYY"));
                }
            });

            $(element).change(function (event) {
                if (moment(new Date($(element).val())).isValid()) {
                    $(element).parent().removeClass("has-error");
                    $(element).parent().attr("title", "");
                } else {
                    $(element).parent().addClass("has-error");
                    $(element).parent().attr("title", "Error in date format");
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
            var timestamp = valueAccessor(),
                options = {
                    doneText: 'Done',
                    autoclose: true
                };

            $(element).clockpicker(options);

            $(element).change(function (event) {
                timestamp = $(element).val();
                viewModel.time = $(element).val();
            });

            $(element).keyup(function (event) {
                if ($(element).val().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                    $(element).parent().removeClass("has-error");
                    $(element).parent().attr("title", "");
                    $(element).clockpicker('hide');
                    $(element).clockpicker('resetClock');
                    $(element).clockpicker('show');
                } else {
                    $(element).parent().addClass("has-error");
                    $(element).parent().attr("title", "Error in time format");
                }
                timestamp = $(element).val();
                viewModel.time = $(element).val();
            });

            $(element).keydown(function (event) {
                var timeValue = $(element).val(),
                    selectionLen = element.selectionEnd - element.selectionStart;
                if (characterAllowedInTimeField(event, timeValue, selectionLen)) {
                    if (event.keyCode === 38) { // up arrow
                        $(element).val(incrementTime(1, timeValue));
                    } else if (event.keyCode === 40) { // down arrow
                        $(element).val(incrementTime(-1, timeValue));
                    } else if (event.keyCode === 13) { // CR
                        $(element).val(incrementTime(0, timeValue));
                    }
                    $(element).clockpicker('hide');
                    $(element).clockpicker('resetClock');
                    $(element).clockpicker('show');
                } else {
                    event.preventDefault();
                }
            });
        },

        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
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
};

var reportsViewModel = function () {
    var self = this,
        decimalPrecision,
        $direports,
        $tabs,
        $tabConfiguration,
        $toggleTab,
        $tabViewReport,
        $viewReport,
        $runReportSpinner,
        $runReportTabSpinner,
        $spinnertext,
        $pointName1,
        $pointName2,
        $pointName3,
        $pointName4,
        $columnsGrid,
        $filtersGrid,
        $columnsTbody,
        $filtersTbody,
        $containerFluid,
        $addColumnButton,
        $addFilterbutton,
        $saveReportButton,
        $runReportButton,
        $filterByPoint,
        $filtersPanelAnchor,
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
        filtersPropertyFields = [],
        columnsPropertyFields = [],
        windowUpi,
        resizeTimer = 400,
        lastResize = null,
        buildPointRefsArray = function () {
            var columns = validateColumns(),
                filters = validateFilters(),
                column,
                filter,
                i,
                pointRefArray = [],
                pointRef,
                existingPointRef,
                checkColumns = function () {
                    for (i = 0; i < columns.length; i++) {
                        column = columns[i];
                        if (!!column.upi && column.upi > 0) {
                            existingPointRef = pointRefArray.filter(function (pRef) {
                                return pRef.PointInst === column.upi;
                            });

                            if (existingPointRef.length === 0) {
                                pointRef = {};
                                pointRef.PropertyEnum = window.workspaceManager.config.Enums.Properties["Qualifier Point"].enum;
                                pointRef.PropertyName = "Qualifier Point";
                                pointRef.Value = column.upi;
                                pointRef.AppIndex = i;
                                pointRef.isDisplayable = true;
                                pointRef.isReadOnly = false;
                                pointRef.PointName = column.colName;
                                pointRef.PointType = window.workspaceManager.config.Enums["Point Types"][column.pointType].enum;
                                pointRef.PointInst = column.upi;
                                pointRef.DevInst = 0;

                                pointRefArray.push(pointRef);
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
                                pointRef.AppIndex = i;
                                pointRef.isDisplayable = true;
                                pointRef.isReadOnly = false;
                                pointRef.PointName = filter.colName;
                                pointRef.PointType = "";
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
        generateUUID = function () {
            var d = new Date().getTime(),
                uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            return uuid;
        },
        toFixed = function (number, precision) {
            var abs = Math.abs(parseFloat(number, 10)),
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
            }
            return str * (negative ? -1 : 1);
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
                $spinnertext.text(text);
            } else {
                $control.show();
                $spinnertext.text("");
            }
            $control.attr('disabled', state);
        },
        checkForColumnCalculations = function () {
            var i,
                columns = self.listOfColumns(),
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
            self.refreshData(true);
        },
        updateListOfColumns = function (newArray) {
            self.listOfColumns([]);
            self.listOfColumns(newArray);
            checkForColumnCalculations();
            self.designChanged(true);
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
            var url = newUrl || '/pointLookup',
                getPointURL = "/api/points/getpoint",
                windowRef,
                objIndex = selectObjectIndex,
                updatedList = self.listOfColumns(),
                tempObject = updatedList[selectObjectIndex],
                setColumnPoint = function (selectedPoint) {
                    tempObject.upi = selectedPoint._id;
                    tempObject.valueType = "None";
                    tempObject.colName = selectedPoint.Name;
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
            var url = newUrl || '/pointLookup',
                windowRef,
                objIndex = selectObjectIndex,
                updatedList = self.listOfFilters(),
                tempObject = updatedList[selectObjectIndex],
                pointSelectedCallback = function (pid, name, type, filter) {
                    if (!!pid) {
                        tempObject.upi = pid;
                        tempObject.valueType = "UniquePID";
                        tempObject.value = name;
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
        filterOpenPointSelector = function (target) {
            var url = '/pointLookup',
                tempObject = {
                    upi: 0,
                    valueType: "",
                    colName: ""
                },
                pointSelectedCallback = function (pid, name, type, filter) {
                    if (!!pid) {
                        tempObject.upi = pid;
                        tempObject.valueType = "String";
                        tempObject.colName = name;
                    }
                },
                windowOpenedCallback = function () {
                    pointSelectorRef.pointLookup.MODE = 'select';
                    pointSelectorRef.pointLookup.init(pointSelectedCallback, pointFilter);
                    if (pointFilter.selectedPointTypes.length > 0) {
                        pointSelectorRef.window.pointLookup.checkPointTypes(pointFilter.selectedPointTypes);
                    }
                };

            pointSelectorRef = window.workspaceManager.openWindowPositioned(url, 'Select Point', '', '', 'filter', {
                callback: windowOpenedCallback,
                width: 1000
            });
        },
        getAdjustedDatetime = function (filter) {
            var result,
                timestamp = parseInt((filter.time.toString()).replace(':', ''), 10),
                hour = ('00' + Math.floor(timestamp / 100)).slice(-2),
                min = ('00' + timestamp % 100).slice(-2);

            result = moment.unix(filter.date).startOf('day').unix();
            result = moment.unix(result).add(hour, 'h').unix();
            result = moment.unix(result).add(min, 'm').unix();

            return result;
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
                    result = "True";
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
                validColumn,
                push;

            for (i = 0; i < localArray.length; i++) {
                validColumn = true;
                push = true;
                if (localArray[i].colName === "Choose Point") {
                    push = false;
                } else if (self.reportType === "Totalizer") {
                    //if ((i > 0) && (localArray[i].operator === "")) {
                    //    validColumn = false;
                    //    localArray[i].error = "Must select 'Type' for " + localArray[i].colName + " in Columns configuration."
                    //} else {
                    //    localArray[i].error = undefined;
                    //}
                }

                if (push) {
                    results.push(localArray[i]);
                }
                if (cleanup && validColumn) {
                    delete results[results.length - 1]["valueList"];  // valuelist is only used in UI
                    delete results[results.length - 1]["dataColumnName"]; // dataColumnName is only used in UI
                    delete results[results.length - 1]["rawValue"]; // rawValue is only used in UI
                    delete results[results.length - 1]["error"]; // error is only used in UI
                }
            }

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
        validateFilters = function () {
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
                            if (filters[i].time.toString().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                                filters[i].value = getAdjustedDatetime(filters[i]);
                                filters[i].error = undefined;
                            } else {
                                valid = false;
                                filters[i].error = "Invalid Time format in Filters";
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
                    if (valid) {  // clean fields only used during UI
                        delete results[results.length - 1]["valueList"];
                        delete results[results.length - 1]["error"];
                    }
                }
            }

            return results;
        },
        initFilters = function (theFilters) {
            var result = [],
                i,
                len = theFilters.length;

            for (i = 0; i < len; i++) {
                result.push(theFilters[i]);
                result[i].valueList = getValueList(result[i].filterName, result[i].filterName);
            }

            return result;
        },
        initColumns = function (theColumns) {
            var result = [],
                i,
                len = theColumns.length;
            for (i = 0; i < len; i++) {
                switch (self.reportType) {
                    case "History":
                    case "Property":
                        result = theColumns;
                        result[i].canCalculate = columnCanBeCalculated(result[i]);
                        break;
                    case "Totalizer":
                        result.push(theColumns[i]);
                        result[i].valueList = getTotalizerValueList(result[i].pointType);
                        result[i].canCalculate = true;
                        break;
                    default:
                        console.log(" - - - DEFAULT  initColumns()");
                        break;
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
        getKeyBasedOnValue = function getKeyValue(obj, value) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (obj[key] === parseInt(value, 10)) {
                        return key;
                    }
                }
            }
        },
        disableStartEndDates = function (disable) {
            var $startAndEndDates = $filtersGrid.find("input,button,textarea,select");
            $startAndEndDates.prop("disabled", disable);

            if (disable) {
                $startAndEndDates.addClass("strikethrough");
            } else {
                $startAndEndDates.removeClass("strikethrough");
            }
            $direports.find(".durationButton").prop("disabled", !disable);
        },
        useDurationChanged = function () {
            disableStartEndDates(self.useDuration());
            if (!self.useDuration()) {
                self.selectedDuration(self.listOfDurations()[0].value);
            }
        },
        buildReportDataRequest = function () {
            var result,
                i,
                columns = validateColumns(),
                filters = validateFilters(),
                filter,
                activeError = false,
                key,
                upis = [],
                uuid;

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

                // get Start & End Dates
                if (self.useDuration()) {
                    var duration = self.listOfDurations().filter(function (item) {
                        return item.value === self.selectedDuration();
                    });
                    self.setDatesBasedOnDuration(duration[0]);
                } else {
                    for (key in filters) {
                        if (filters.hasOwnProperty(key)) {
                            filter = filters[key];
                            if (!!filter.error) {
                                displayError(filter.error);
                                activeError = true;
                            } else {
                                if (!filter.filterName || _.isEmpty(filter)) {
                                    continue;
                                }
                                if (self.reportType === "Totalizer" || self.reportType === "History") {
                                    switch (filter.filterName) {
                                        case "Start_Date":
                                            self.startDate = parseInt(filter.value, 10);
                                            break;
                                        case "End_Date":
                                            self.endDate = parseInt(filter.value, 10);
                                            break;
                                        default:
                                            break;
                                    }
                                    if (moment(self.startDate).isValid() && moment(self.endDate).isValid()) {
                                        if (self.startDate > self.endDate) {
                                            displayError("'Start Date' has to be earlier than 'End Date' in Filters");
                                            activeError = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (!activeError) {
                    switch (self.reportType) {
                        case "History":
                        case "Totalizer":
                            point["Report Config"].interval.text = self.interval();
                            point["Report Config"].interval.value = self.intervalValue();
                            point["Report Config"].duration.useDuration = self.useDuration();
                            point["Report Config"].duration.value = self.selectedDuration();
                            break;
                        case "Property":
                            break;
                        default:
                            console.log(" - - - DEFAULT  buildReportDataRequest()");
                            break;
                    }

                    pointFilter = getPointLookupFilterValues($pointSelectorIframe.contents());
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
            $toggleTab = $tabConfiguration.find(".toggleTab");
            $tabViewReport = $direports.find(".tabViewReport");
            $viewReport = $direports.find(".viewReport");
            $runReportSpinner = $direports.find(".runReportSpinner");
            $runReportTabSpinner = $direports.find(".runReportTabSpinner");
            $spinnertext = $runReportSpinner.find(".spinnertext");
            $pointName1 = $direports.find(".pointName1");
            $pointName2 = $direports.find(".pointName2");
            $pointName3 = $direports.find(".pointName3");
            $pointName4 = $direports.find(".pointName4");
            $columnsGrid = $direports.find(".columnsGrid");
            $filtersGrid = $direports.find(".filtersGrid");
            $containerFluid = $direports.find(".container-fluid");
            $addColumnButton = $direports.find(".addColumnButton");
            $addFilterbutton = $direports.find(".addFilterbutton");
            $saveReportButton = $direports.find(".saveReportButton");
            $runReportButton = $direports.find(".runReportButton");
            $columnNames = $direports.find(".columnName");
            $filterByPoint = $direports.find("#filterByPoint");
            $filtersPanelAnchor = $direports.find(".filtersPanelAnchor");
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
                htmlString,
                $customField,
                rawValue = dataField.Value;

            dataField.rawValue = rawValue;
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
                case "BitString":
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
                        dataField.Value = moment.unix(rawValue).format("MM/DD/YYYY hh:mm a");
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
            return dataField;
        },
        pivotHistoryData = function (historyData) {
            var columnConfig,
                columnName,
                pivotedData = [],
                tempPivot,
                lenHistoryData = historyData.length,
                i,
                j,
                historyResults = [];

            for (i = 0; i < lenHistoryData; i++) {
                historyResults = historyData[i].HistoryResults;
                tempPivot = {};
                tempPivot["Date"] = {};
                tempPivot["Date"].Value = moment.unix(historyData[i].timestamp).format("MM/DD/YYYY hh:mm:ss a");
                tempPivot["Date"].rawValue = historyData[i].timestamp;
                for (j = 0; j < historyResults.length; j++) {
                    columnName = historyResults[j].Name;
                    tempPivot[columnName] = {};
                    if (historyResults[j].Value === undefined) {
                        tempPivot[columnName].Value = "";
                        tempPivot[columnName].rawValue = "";
                    } else {
                        columnConfig = getColumnConfigByColName(columnName);
                        //console.log("[" + i + "] ==>  historyResults[" + j + "].Value = " + historyResults[j].Value);
                        tempPivot[columnName] = formatDataField(historyResults[j], columnConfig);
                    }
                }
                pivotedData.push(tempPivot);
            }

            return pivotedData;
        },
        pivotTotalizerData = function (totalizerData) {
            var columnConfig,
                columnName,
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
                    tempPivot["Date"] = {};
                    tempPivot["Date"].Value = moment.unix(totalizerData[0].totals[j].range.start).format("MM/DD/YYYY hh:mm:ss a");
                    tempPivot["Date"].rawValue = moment.unix(totalizerData[0].totals[j].range.start);
                    for (i = 0; i < numberOfColumnsFound; i++) {
                        operator = totalizerData[i].op.toLowerCase();
                        columnConfig = getColumnConfigByOperatorAndUPI(operator, totalizerData[i].upi);
                        columnName = columnConfig.colName + " - " + operator;
                        rawValue = totalizerData[i].totals[j].total;
                        tempPivot[columnName] = {};
                        //console.log("totalizerData[" + i + "].totals[" + j + "].total = " + totalizerData[i].totals[j]);
                        if (totalizerData[i].totals[j].total === undefined) {
                            tempPivot[columnName].Value = "";
                            tempPivot[columnName].rawValue = "";
                        } else {
                            if (operator === "total" || operator === "runtime") {
                                tempPivot[columnName].Value = (rawValue === 0 ? 0 : getDurationText(rawValue, columnConfig.precision, totalizerDurationInHours));
                            } else {
                                tempPivot[columnName].Value = toFixedComma(rawValue, columnConfig.precision);
                            }
                            tempPivot[columnName].rawValue = parseFloat(rawValue);
                        }
                    }
                    pivotedData.push(tempPivot);
                }
            }

            return pivotedData;
        },
        cleanResultData = function (data) {
            var columnArray = validateColumns(),
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
        adjustDatatableHeightWidth = function () {
            var heightAdjust = 240,
                datatableHeight,
                $dataTablesScrollBody = $tabViewReport.find('.dataTables_scrollBody'),
                $dataTablesWrapper = $tabViewReport.find('.dataTables_wrapper');
            $dataTablesScrollBody.css('height', (window.innerHeight - heightAdjust));
            $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
            setInfoBarDateTime();
            datatableHeight = $dataTablesWrapper.height();
            if (window.innerHeight < (datatableHeight + 150)) {
                heightAdjust = (datatableHeight + (2 * 150)) - window.innerHeight;  // making up for some data wrapping in cells
                $dataTablesScrollBody.css('height', (window.innerHeight - heightAdjust));
            }
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
                        adjustDatatableHeightWidth();
                    } else {
                        adjustConfigTabActivePaneHeight();
                    }
                }
            }, resizeTimer);
        },
        saveReportConfig = function () {
            point._pStatus = 0;  // activate report
            point["Report Config"].columns = validateColumns(true);
            point["Report Config"].filters = validateFilters();
            pointFilter = getPointLookupFilterValues($pointSelectorIframe.contents());
            point["Report Config"].pointFilter = pointFilter;
            //point["Point Refs"] = buildPointRefsArray();
            switch (self.reportType) {
                case "History":
                case "Totalizer":
                    point["Report Config"].interval.text = self.interval();
                    point["Report Config"].interval.value = self.intervalValue();
                    point["Report Config"].duration.useDuration = self.useDuration();
                    point["Report Config"].duration.value = self.selectedDuration();
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
        },
        setReportEvents = function () {
            var intervals,
                calculations,
                durations,
                entriesPerPage;

            $(window).resize(function () {
                handleResize();
            });

            $columnNames.on('click', function (e) {
                openPointSelectorForColumn();
                e.preventDefault();
                e.stopPropagation();
            });

            $addColumnButton.on('click', function (e) {
                var rowTemplate = {
                        colName: "Choose Point",
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

            $addFilterbutton.on('click', function (e) {
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

            $saveReportButton.on('click', function (e) {
                var $screenMessages = $tabConfiguration.find(".screenMessages");
                blockUI($tabConfiguration, true, " Saving Report...");
                $screenMessages.find(".errorMessage").text(""); // clear messages
                $screenMessages.find(".successMessage").text(""); // clear messages
                saveReportConfig();
                $(this).blur();
            });

            $runReportButton.on('click', function (e) {
                $runReportButton.focus();
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

            $toggleTab.on('shown.bs.tab', function (event) {
                //var target = $(this).attr('href');
                adjustConfigTabActivePaneHeight();
            });

            reportSocket.on('pointUpdated', function (data) {
                var $currentmessageholder;
                console.log(" -  -  - reportSocket() 'pointUpdated' returned");
                if (data.err === null || data.err === undefined) {
                    $currentmessageholder = $tabConfiguration.find(".screenMessages").find(".successMessage");
                    $currentmessageholder.text("Report Saved");
                    setTimeout(function () {
                        $currentmessageholder.text("");
                    }, 3000);  // display success message
                } else {
                    originalPoint = _.clone(newPoint, true);
                    self.reportDisplayTitle(originalPoint.Name);
                    $tabConfiguration.find(".screenMessages").find(".errorMessage").text(data.err);
                }
                blockUI($tabConfiguration, false);
            });

            //$viewReport.on('draw.dt', function () {
            //    setInfoBarDateTime();
            //});

            $viewReport.on('column-reorder.dt', function (event, settings, details) {
                var columnsArray = validateColumns();
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

            durations = [
                {
                    value: "None",
                    unit: 0,
                    unitType: ""
                }, {
                    value: "Last 12 hours",
                    unit: 12,
                    unitType: "hour"
                }, {
                    value: "Last 24 hours",
                    unit: 24,
                    unitType: "hour"
                }, {
                    value: "Last 48 hours",
                    unit: 48,
                    unitType: "hour"
                }, {
                    value: "Last 72 hours",
                    unit: 72,
                    unitType: "hour"
                }, {
                    value: "Last 7 days",
                    unit: 7,
                    unitType: "day"
                }, {
                    value: "Last month",
                    unit: 1,
                    unitType: "month"
                }, {
                    value: "Last 6 months",
                    unit: 6,
                    unitType: "month"
                }, {
                    value: "Last year",
                    unit: 1,
                    unitType: "year"
                }
            ];

            entriesPerPage = [
                {
                    value: "10",
                    unit: 10,
                }, {
                    value: "15",
                    unit: 15,
                }, {
                    value: "25",
                    unit: 25,
                }, {
                    value: "50",
                    unit: 50,
                }, {
                    value: "75",
                    unit: 75,
                }, {
                    value: "100",
                    unit: 100,
                }, {
                    value: "All",
                    unit: -1,
                }
            ];

            self.useDuration.subscribe(useDurationChanged, this);

            self.listOfIntervals(intervals);
            self.listOfCalculations(calculations);
            self.listOfDurations(durations);
            self.listOfEntriesPerPage(entriesPerPage);
            checkForColumnCalculations();
            useDurationChanged();
        },
        getVariance = function (columnData, start, end) {
            var i,
                meanCalc = getColumnMean(columnData, start, end),
                squaredTotalResults = [],
                squaredPageResults = [],
                squaredTotal = 0,
                squaredPage = 0,
                sum = {
                    totalCalc: 0,
                    pageCalc: 0
                },
                variance = {
                    totalCalc: 0,
                    pageCalc: 0
                };

            for (i = 0; i < columnData.length; i++) {
                squaredTotal = Math.pow((columnData[i] - meanCalc.totalCalc), 2);
                sum.totalCalc += squaredTotal;
                squaredTotalResults.push(squaredTotal);
                if (i >= start && i < end) {
                    squaredPage = Math.pow((columnData[i] - meanCalc.pageCalc), 2);
                    sum.pageCalc += squaredPage;
                    squaredPageResults.push(squaredPage);
                }
            }

            if (squaredTotalResults.length > 0) {
                variance.totalCalc = sum.totalCalc / squaredTotalResults.length;
            }
            if ((end - start) > 0) {
                variance.pageCalc = sum.pageCalc / (end - start);
            }

            return variance;
        },
        getColumnStandardDeviation = function (columnData, start, end) {
            var variance = getVariance(columnData, start, end),
                calc = {
                    totalCalc: 0,
                    pageCalc: 0
                };

            calc.totalCalc = Math.sqrt(variance.totalCalc);
            calc.pageCalc = Math.sqrt(variance.pageCalc);

            return calc;
        },
        getColumnMean = function (columnData, start, end) {
            var i,
                calc = {
                    totalCalc: 0,
                    pageCalc: 0
                };

            for (i = 0; i < columnData.length; i++) {
                calc.totalCalc += columnData[i];
                if (i >= start && i < end) {
                    calc.pageCalc += columnData[i];
                }
            }
            if (columnData.length > 0) {
                calc.totalCalc = calc.totalCalc / columnData.length;
            }
            if (end - start > 0) {
                calc.pageCalc = calc.pageCalc / (end - start);
            }
            return calc;
        },
        getColumnSum = function (columnData, start, end) {
            var i,
                calc = {
                    totalCalc: 0,
                    pageCalc: 0
                };

            for (i = 0; i < columnData.length; i++) {
                calc.totalCalc += columnData[i];
                if (i >= start && i < end) {
                    calc.pageCalc += columnData[i];
                }
            }
            return calc;
        },
        configureDataTable = function (destroy, clearData) {
            var aoColumns = [],
                i,
                columnsArray = validateColumns(),
                setTdAttribs = function (tdField, columnConfig, data, columnIndex) {
                    switch (self.reportType) {
                        case "History":
                            if (columnConfig.units) {
                                $(tdField).attr('title', columnConfig.units);
                            }
                            break;
                        case "Totalizer":
                            if (data[columnConfig.dataColumnName] && data[columnConfig.dataColumnName].rawValue) {
                                $(tdField).attr('title', (data[columnConfig.dataColumnName].rawValue ? data[columnConfig.dataColumnName].rawValue : ""));
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
                        result += "small ";
                    }
                    if (columnConfig.canCalculate === true) {
                        result += "text-right ";
                    }
                    return result;
                },
                buildColumnObject = function (item, columnIndex) {
                    var result,
                        columnTitle;

                    switch (self.reportType) {
                        case "History":
                            columnTitle = item.colName.replace(/_/g, " ");
                            break;
                        case "Totalizer":
                            columnTitle = item.colName.replace(/_/g, " ");
                            if (columnIndex !== 0) {
                                item.dataColumnName += " - " + item.operator.toLowerCase();
                                columnTitle += " - " + item.operator;
                                if (item.operator.toLowerCase() === "total" || item.operator.toLowerCase() === "runtime") {
                                    if (totalizerDurationInHours) {
                                        columnTitle += " (Hours)";
                                    }
                                }
                            }
                            break;
                        case "Property":
                            columnTitle = item.colName.replace(/_/g, " ");
                            break;
                        default:
                            columnTitle = "Default";
                            console.log(" - - - DEFAULT  configureDataTable()");
                            break;
                    }

                    result = {
                        title: columnTitle,
                        data: item.dataColumnName,
                        render: {
                            _: "Value",
                            sort: "rawValue",
                            type: "rawValue"
                        },
                        className: setColumnClasses(columnsArray[columnIndex], columnIndex),
                        fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                            setTdAttribs(nTd, columnsArray[iCol], oData, iCol);
                        },
                        bSortable: true
                    };

                    return result;
                },
                getCalcForColumn = function (column, columnDesign, start, end) {
                    var columnData = column.data(),
                        columnDataLen = columnData.length,
                    //columnName = (self.reportType === "Totalizer" ? columnDesign.dataColumnName : columnDesign.colName),
                        value,
                        rawValues = [],
                        calc = {},
                        i;
                    calc.totalCalc = 0;
                    calc.pageCalc = 0;

                    for (i = 0; i < columnDataLen; i++) {
                        value = columnData[i].rawValue;
                        value = (typeof value === "object" ? value.Value : value);
                        if ($.isNumeric(value)) {
                            rawValues.push(parseFloat(value));
                        } else {
                            rawValues.push(0);
                        }
                    }

                    switch (columnDesign.calculation.toLowerCase()) {
                        case "mean":
                            calc = getColumnMean(rawValues, start, end);
                            break;
                        case "max":
                            calc.totalCalc = Math.max.apply(Math, rawValues);
                            calc.pageCalc = Math.max.apply(Math, rawValues.slice(start, end));
                            break;
                        case "min":
                            calc.totalCalc = Math.min.apply(Math, rawValues);
                            calc.pageCalc = Math.min.apply(Math, rawValues.slice(start, end));
                            break;
                        case "sum":
                            calc = getColumnSum(rawValues, start, end);
                            break;
                        case "std dev":
                            calc = getColumnStandardDeviation(rawValues, start, end);
                            break;
                    }
                    return calc;
                };

            // if the design of the data collected has changed then we need to adjust the design of the DataTable.
            if (destroy === true && $.fn.DataTable.isDataTable($viewReport)) {
                $viewReport.DataTable().destroy();
                $viewReport.find("thead").empty();
                $viewReport.find("tbody").empty(); // leaving dynamic footer
            }
            if (clearData === true) {
                reportData = {};
            }

            for (i = 0; i < columnsArray.length; i++) {
                columnsArray[i].dataColumnName = columnsArray[i].colName;
                aoColumns.push(buildColumnObject(columnsArray[i], i));
            }

            if (aoColumns.length > 0) {
                $viewReport.DataTable({
                    api: true,
                    dom: 'Blfrtip',
                    //fixedHeader: {
                    //    header: true,
                    //    footer: true
                    //},
                    //footer: true,
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
                                    //footer: true,
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
                            }
                        }
                    ],
                    drawCallback: function (settings) {
                        setInfoBarDateTime();
                    },
                    headerCallback: function (thead, data, start, end, display) {
                        var reportColumns = validateColumns(),
                            i,
                            len = reportColumns.length,
                            $theads;
                        for (i = 0; i < len; i++) {
                            if (!!reportColumns[i].calculation && reportColumns[i].calculation !== "") {
                                $(thead).find('th').eq(i).addClass("calculate");
                            }
                            $(thead).find('th').eq(i).addClass("text-center");
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
                        var reportColumns = validateColumns(),
                            calcEnabled = false,
                            $firstColumn;
                        this.api().columns('.calculate').every(function () {
                            var column = this,
                                columnIndex = column[0],
                                columnConfig = reportColumns[columnIndex],
                                calc = getCalcForColumn(column, columnConfig, start, end),
                                footerText = columnConfig.calculation,
                                $tdFooter = $(tfoot).find("td[colindex='" + columnIndex + "']");
                            $tdFooter.attr("title", "Page Calc (Table Calc)");

                            switch (self.reportType) {
                                case "History":
                                    footerText += "  " + toFixedComma(calc.pageCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "");
                                    footerText += " (" + toFixedComma(calc.totalCalc, columnConfig.precision) + (columnConfig.units ? " " + columnConfig.units : "") + ")";
                                    break;
                                case "Totalizer":
                                    if (columnConfig.operator.toLowerCase() === "total" || columnConfig.operator.toLowerCase() === "runtime") {
                                        footerText += "  " + getDurationText(calc.pageCalc, columnConfig.precision, totalizerDurationInHours);
                                        footerText += " (" + getDurationText(calc.totalCalc, columnConfig.precision, totalizerDurationInHours) + ")";
                                    } else {
                                        footerText += "  " + toFixedComma(calc.pageCalc, columnConfig.precision);
                                        footerText += " (" + toFixedComma(calc.totalCalc, columnConfig.precision) + ")";
                                    }
                                    break;
                                case "Property":
                                    footerText += "  " + toFixedComma(calc.pageCalc, columnConfig.precision);
                                    footerText += " (" + toFixedComma(calc.totalCalc, columnConfig.precision) + ")";
                                    break;
                                default:
                                    console.log(" - - - DEFAULT  footerCallback()");
                                    break;
                            }

                            $tdFooter.text(footerText);
                            calcEnabled = true;
                        });

                        if (calcEnabled) {
                            $firstColumn = $(tfoot).find("td[colindex='" + 0 + "']");
                            $firstColumn.text("Calculations:");
                            $firstColumn.removeClass("small");
                            $firstColumn.addClass("text-right");
                        } else {
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
                    scrollY: (window.innerHeight - 270) + "px",
                    scrollX: true,
                    scrollCollapse: true,
                    lengthChange: true,
                    lengthMenu: [[10, 15, 25, 50, 75, 100, -1], [10, 15, 25, 50, 75, 100, "All"]],
                    //bFiler: false,  // search box
                    pageLength: self.selectedPageLength()
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
                adjustDatatableHeightWidth();

                if (!exportEventSet) {
                    $tabViewReport.find("a.btn.btn-default.buttons-collection").on('click', function (ev) {
                        if (!exportEventSet) {
                            setTimeout(function () {
                                $direports.find("li.dt-button > a").on('click', function (ev) {  // export buttons clicked
                                    console.log($(this).text() + " button clicked");
                                    $(this).parent().parent().hide();
                                });
                            }, 100);
                        }
                        exportEventSet = true;
                    });
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

    self.interval = ko.observable("Minute");

    self.intervalValue = ko.observable(1);

    self.useDuration = ko.observable(false);

    self.selectedDuration = ko.observable("");

    self.listOfIntervals = ko.observableArray([]);

    self.listOfCalculations = ko.observableArray([]);

    self.listOfDurations = ko.observableArray([]);

    self.listOfEntriesPerPage = ko.observableArray([]);

    self.listOfFilterPropertiesLength = 0;

    self.listOfColumnPropertiesLength = 0;

    self.filterPropertiesSearchFilter = ko.observable("-blank-");

    self.columnPropertiesSearchFilter = ko.observable("-blank-");

    self.truncatedData = ko.observable(false);

    self.designChanged = ko.observable(true);

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

    self.init = function () {
        var columns,
            reportConfig;

        exportEventSet = false;
        decimalPrecision = 2;
        activeDataRequests = [];
        getScreenFields();
        initKnockout();

        if (point) {
            originalPoint = JSON.parse(JSON.stringify(point));
            windowUpi = point._id; // required or pop-in/pop-out don't work
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
                self.listOfColumns(initColumns(reportConfig.columns));
                self.listOfFilters(initFilters(reportConfig.filters));
                pointFilter = (reportConfig.pointFilter ? reportConfig.pointFilter : pointFilter);
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        self.interval(point["Report Config"].interval.text);
                        self.intervalValue(point["Report Config"].interval.value);
                        self.useDuration(point["Report Config"].duration.useDuration);
                        self.selectedDuration(point["Report Config"].duration.value);
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
                point["Report Config"].columns = [];
                point["Report Config"].filters = [];
                point["Report Config"].pointFilter = pointFilter;
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        point["Report Config"].returnLimit = 2000;
                        self.listOfColumns.push({
                            colName: "Date",
                            valueType: "DateTime",
                            operator: "",
                            calculation: "",
                            canCalculate: false,
                            precision: 0,
                            valueList: [],
                            upi: 0
                        });
                        self.listOfFilters.push({
                            filterName: "Start_Date",
                            condition: "$and",
                            childLogic: false,
                            operator: "EqualTo",
                            valueType: "DateTime",
                            valueList: [],
                            value: moment().subtract(1, 'days').unix(),
                            date: moment().subtract(1, 'days').unix(),
                            time: "00:00"
                        });
                        self.listOfFilters.push({
                            filterName: "End_Date",
                            condition: "$and",
                            childLogic: false,
                            operator: "EqualTo",
                            valueType: "DateTime",
                            valueList: [],
                            value: moment().unix(),
                            date: moment().unix(),
                            time: "00:00"
                        });
                        point["Report Config"].interval = {};
                        point["Report Config"].interval.text = self.interval();
                        point["Report Config"].interval.value = self.intervalValue();
                        point["Report Config"].duration = {};
                        point["Report Config"].duration.useDuration = self.useDuration();
                        point["Report Config"].duration.value = self.selectedDuration();
                        break;
                    case "Property":
                        filterOpenPointSelector($filterByPoint);
                        collectEnumProperties();
                        point["Report Config"].returnLimit = 4000;
                        self.listOfColumns.push({
                            colName: "Name",
                            valueType: "String",
                            calculation: "",
                            canCalculate: false
                        });
                        break;
                    default:
                        console.log(" - - - DEFAULT  init() null columns");
                        break;
                }
                originalPoint = JSON.parse(JSON.stringify(point)); // reset original point ref since we've added attribs
            }

            $containerFluid.show();
            tabSwitch(1);

            updateListOfFilters(self.listOfFilters());
            setTimeout(function () {
                $reporttitleInput.focus();
            }, 1500);
            setReportEvents();
            adjustConfigTabActivePaneHeight();
            self.filterPropertiesSearchFilter(""); // computed props jolt
            self.columnPropertiesSearchFilter(""); // computed props jolt
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
        var array = [];
        array.push(
            {text: "AND", value: "$and"},
            {text: "OR", value: "$or"}
        );
        return array;
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
            endDateFilter;

        startDateFilter = self.listOfFilters().filter(function (filter) {
            return filter.filterName === "Start_Date";
        });
        endDateFilter = self.listOfFilters().filter(function (filter) {
            return filter.filterName === "End_Date";
        });

        startDateFilter[0].value = start;
        startDateFilter[0].date = start;
        startDateFilter[0].time = moment.unix(start).hours() + ":" + moment.unix(start).minutes();

        endDateFilter[0].value = end;
        endDateFilter[0].date = end;
        endDateFilter[0].time = moment.unix(end).hours() + ":" + moment.unix(end).minutes();
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
        var requestObj;
        if (self.currentTab() !== 2) {
            requestObj = buildReportDataRequest();
            if (requestObj) {
                if (self.reportResultViewed()) {
                    tabSwitch(2);
                    $popAction.hide();
                    self.activeDataRequest(true);
                    self.reportResultViewed(false);
                    if (self.designChanged()) {
                        configureDataTable(true, true);
                    }
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
        filter.upi = 0;
        updateListOfFilters(tempArray);
    };

    self.selectPropertyColumn = function (element, indexOfColumn, selectedItem) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn],
            prop = getProperty(selectedItem.name);
        column.colName = selectedItem.name;
        column.valueType = prop.valueType;
        column.calculation = "";
        column.canCalculate = columnCanBeCalculated(column);
        updateListOfColumns(tempArray);
    };

    self.selectPropertyFilter = function (element, indexOfFilter, selectedItem) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfFilter],
            $elementRow = $(element).parent().parent().parent().parent().parent(),
            $inputField = $elementRow.find(".filterValue").find("input");
        filter = initializeNewFilter(selectedItem, filter);
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
                break;
            }
        }
    };

    self.selectInterval = function (selectedInterval) {
        self.interval(selectedInterval);
    };

    self.selectDuration = function (durationIndex) {
        self.selectedDuration(self.listOfDurations()[durationIndex].value);
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
            width: 1024,
            height: 768
        };
        // If we're a pop-out; pop back in
        if (window.top.location.href === window.location.href) {
            window.workspaceManager.openWindowPositioned(window.location.href, $reporttitleInput.text(), 'report', 'mainWindow', windowUpi);
        } else {
            // Open the window
            window.workspaceManager.openWindowPositioned(window.location.href, $reporttitleInput.text(), 'report', '', windowUpi, options);
        }
    };

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

function applyBindings() {
    if (window.opener === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        reportsVM = new reportsViewModel();
        reportsVM.init();
        ko.applyBindings(reportsVM);
    }
}

$(function () {
    applyBindings();
});

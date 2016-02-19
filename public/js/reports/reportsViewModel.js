"use strict";
window.workspaceManager = (window.opener || window.top).workspaceManager;

var initKnockout = function () {
    ko.bindingHandlers.reportDatePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = {
                autoclose: true
            };
            $(element).datepicker(options).on("changeDate", function (ev) {
                var val = $.isFunction(valueAccessor()) ? valueAccessor() : parseInt(valueAccessor(), 10);
                if (ev.date) {
                    viewModel.date = moment(ev.date).unix();
                } else {
                    if (val !== '') {
                        viewModel.date = val;
                    }
                }
                //  help user select valid start & end dates
                //$("#dpStart").on("dp.change", function(e) {
                //    alert('hey');
                //    $('#dpEnd').data("DateTimePicker").setMinDate(e.date);
                //});
                //$("#dpEnd").on("dp.change", function(e) {
                //    $('#dpStart').data("DateTimePicker").setMaxDate(e.date);
                //});
            });
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
                    autoclose: true,
                    afterDone: function () {
                        timestamp = $(element).val();
                        viewModel.time = $(element).val();
                    }
                };

            $(element).clockpicker(options);

            $(element).change(function (event) {
                $(element).clockpicker('resetclock');
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
        $tabs,
        $tabConfiguration,
        $tabViewReport,
        $viewReport,
        $reportSpinner,
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
        $columnNames,
        pointSelectorRef,
        $pointSelectorIframe,
        reportSocket,
        reportJsonData = {},
        Name = "dorsett.reportUI",
        originalPoint = {},
        pointFilter = {
            name1Filter: '',
            name2Filter: '',
            name3Filter: '',
            name4Filter: '',
            selectedPointTypes: []
        },
        propertyFields = [],
        blockUI = function ($control, state, text) {
            if (state === true) {
                $reportSpinner.show();
                $control.hide();
                $spinnertext.text(text);
            } else {
                $reportSpinner.hide();
                $control.show();
                $spinnertext.text("");
            }
            $control.attr('disabled', state);
        },
        updateListOfFilters = function (newArray) {
            self.listOfFilters([]);
            self.listOfFilters(setFiltersParentChildLogic(newArray));
            self.designChanged(true);
            self.refreshData(true);
        },
        updateListOfColumns = function (newArray) {
            self.listOfColumns([]);
            self.listOfColumns(newArray);
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

                    if ((!!nextCondition && nextCondition.condition === "$or") || (index === (len -1))) {
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
        openPointSelectorForColumn = function (selectObjectIndex, upi, newUrl) {
            var url = newUrl || '/pointLookup',
                windowRef,
                objIndex = selectObjectIndex,
                updatedList = self.listOfColumns(),
                tempObject = updatedList[selectObjectIndex],
                pointSelectedCallback = function (pid, name, type) {
                    if (!!pid) {
                        tempObject.upi = pid;
                        tempObject.valueType = "String";
                        tempObject.colName = name;
                        tempObject.pointType = type;
                        updatedList[objIndex] = tempObject;
                        updateListOfColumns(updatedList);
                    }
                },
                windowOpenedCallback = function () {
                    windowRef.pointLookup.MODE = 'select';
                    windowRef.pointLookup.init(pointSelectedCallback, {});
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
                pointSelectedCallback = function (pid, name, type) {
                    if (!!pid) {
                        tempObject.upi = pid;
                        tempObject.valueType = "UniquePID";
                        tempObject.value = name;
                        updatedList[objIndex] = tempObject;
                        updateListOfFilters(updatedList);
                    }
                },
                windowOpenedCallback = function () {
                    windowRef.pointLookup.MODE = 'select';
                    windowRef.pointLookup.init(pointSelectedCallback, {});
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
                pointSelectedCallback = function (pid, name, type) {
                    if (!!pid) {
                        tempObject.upi = pid;
                        tempObject.valueType = "String";
                        tempObject.colName = name;
                    }
                },
                windowOpenedCallback = function () {
                    pointSelectorRef.pointLookup.MODE = 'select';
                    pointSelectorRef.pointLookup.init(pointSelectedCallback, {
                        name1: point["Report Config"].pointFilter.name1Filter,
                        //name1FilterOn: (point["Report Config"].pointFilter.name1Filter
                        name2: point["Report Config"].pointFilter.name2Filter,
                        name3: point["Report Config"].pointFilter.name3Filter,
                        name4: point["Report Config"].pointFilter.name4Filter
                    });
                    setPointLookupFilterValues();
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

            localFilter.column = selectedItem.name;
            localFilter.condition = "$and";
            localFilter.operator = "EqualTo";
            localFilter.childLogic = false;
            localFilter.valueType = prop.valueType;
            localFilter.value = setDefaultValue(localFilter.valueType);
            localFilter.valueList = getValueList(selectedItem.name, selectedItem.name);
            switch(localFilter.valueType) {
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
        validateColumns = function () {
            var results = [],
                localArray = self.listOfColumns(),
                i;

            for (i = 0; i < localArray.length; i++) {
                if (localArray[i].colName !== "Choose Point") {
                    results.push(localArray[i]);
                }
            }

            return results;
        },
        validateFilters = function () {
            var results = [],
                filters = $.extend(true, [], self.listOfFilters()),
                i;

            for (i = 0; i < filters.length; i++) {
                if (filters[i].column !== "") {
                    switch(filters[i].valueType) {
                        case "Timet":
                        case "DateTime":
                            filters[i].value = getAdjustedDatetime(filters[i]);
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
                    delete results[results.length - 1]["valueList"]; // valuelist is only used in UI
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
                result[i].valueList = getValueList(result[i].column, result[i].column);
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
        getProperty = function (key) {
            return window.workspaceManager.config.Enums.Properties[key];
        },
        getEnumProperties = function () {
            var props = window.workspaceManager.config.Enums.Properties,
                prop,
                key;

            for (key in props) {
                if (props.hasOwnProperty(key)) {
                    if (props[key].reportEnable === true) {
                        prop = {};
                        prop.name = key;
                        prop.valueType = props[key].valueType;
                        propertyFields.push(prop);
                        self.listOfPropertiesLength += 1;
                    }
                }
            }
        },
        buildReportDataRequest = function () {
            var result,
                i,
                startDate,
                endDate,
                columns = validateColumns(),
                filters = validateFilters(),
                filter,
                key,
                upis = [];

            if (columns.length > 1) {
                for (i = 0; i < columns.length; i++) {
                    if (columns[i].upi > 0) {
                        upis.push({
                            upi: parseInt(columns[i].upi, 10),
                            op: (columns[i].operator).toLowerCase()
                        })
                    }
                }

                for (key in filters) {
                    filter = filters[key];
                    if (!filter.column || _.isEmpty(filter)) {
                        continue;
                    }
                    switch (filter.column) {
                        case "Start_Date":
                            startDate = parseInt(filter.value, 10);
                            break;
                        case "End_Date":
                            endDate = parseInt(filter.value, 10);
                            break;
                        default:
                            break;
                    }
                }

                pointFilter.selectedPointTypes = getPointLookupFilterValues();
                pointFilter.name1Filter = getPointLookupFilterNameValues(1);
                pointFilter.name2Filter = getPointLookupFilterNameValues(2);
                pointFilter.name3Filter = getPointLookupFilterNameValues(3);
                pointFilter.name4Filter = getPointLookupFilterNameValues(4);
                point["Report Config"].pointFilter = pointFilter;
                point["Report Config"].columns = columns;
                point["Report Config"].filters = filters;
                point["Report Config"].interval.text = self.interval();
                point["Report Config"].interval.value = self.intervalValue();

                result = {
                    upis: upis,
                    range: {
                        start: startDate,
                        end: endDate
                    },
                    reportConfig: point["Report Config"],
                    reportType: point["Report Type"].Value,
                    sort: ""
                }
            }

            return result;
        },
        tabSwitch = function (tabNumber) {
            if ($.isNumeric(tabNumber) === true) {
                $tabs.find("li").removeClass("active");
                $tabs.find("li:eq(" + (tabNumber - 1) + ")").addClass("active");
            }
            switch (tabNumber) {
                case 1:
                    $tabConfiguration.addClass("active");
                    $tabConfiguration.show();
                    $tabViewReport.removeClass("active");
                    $tabViewReport.hide();
                    break;
                case 2:
                    $tabConfiguration.removeClass("active");
                    $tabConfiguration.hide();
                    $tabViewReport.addClass("active");
                    $viewReport.hide();
                    blockUI($tabViewReport, true, " Getting Data..");
                    break;
            }
        },
        initSocket = function (cb) {
            reportSocket = io.connect('https://' + window.location.hostname);

            reportSocket.on('connect', function () {
                console.log('SOCKETID:', reportSocket.id);
                if (cb) {
                    cb();
                }
            });
        },
        getScreenFields = function () {
            var $direports = $(".direports");
            $tabs = $direports.find(".tabs");
            $tabConfiguration = $direports.find(".tabConfiguration");
            $tabViewReport = $direports.find(".tabViewReport");
            $viewReport = $direports.find(".viewReport");
            $reportSpinner = $direports.find(".reportingGettingData");
            $spinnertext = $reportSpinner.find(".spinnertext");
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
        },
        getPointLookupFilterNameValues = function (nameNumber) {
            var result = "",
                $nameInputField,
                searchPattern = "input[placeholder='Segment " + nameNumber + "']";

            $nameInputField = $pointSelectorIframe.contents().find(searchPattern);

            if ($nameInputField.attr("disabled") === "disabled") {
                result = "ISBLANK";
            } else {
                result = ($nameInputField[0] ? $nameInputField[0].value : "");
            }

            return result;
        },
        getPointLookupFilterValues = function () {
            var answer = [],
                selectedPointTypes,
                numberOfAllPointTypes;
            if (pointSelectorRef && pointSelectorRef.window.pointLookup) {
                selectedPointTypes = pointSelectorRef.window.pointLookup.getCheckedPointTypes();
                numberOfAllPointTypes = pointSelectorRef.window.pointLookup.POINTTYPES.length;
                if (numberOfAllPointTypes !== selectedPointTypes.length) {
                    answer = selectedPointTypes;
                }
            }
            return answer;
        },
        setPointLookupFilterValues = function () {
            var selectedPointTypes = point["Report Config"].pointFilter.selectedPointTypes;

            if (selectedPointTypes.length > 0) {
                pointSelectorRef.window.pointLookup.checkPointTypes(selectedPointTypes);
            }
        },
        pivotHistoryData = function (historyData) {
            var pivotedData = [],
                tempPivot,
                lenHistoryData = historyData.length,
                i,
                j,
                historyResults = [];

            for (i = 0; i < lenHistoryData; i++) {
                historyResults = historyData[i].HistoryResults;
                tempPivot = {Date: new Date(historyData[i].timestamp * 1000).toLocaleString()};
                for (j = 0; j < historyResults.length; j++) {
                    tempPivot[historyResults[j].Name] = (historyResults[j].Value ? historyResults[j].Value : Math.floor(Math.random() * 250) + 1 );
                }
                pivotedData.push(tempPivot);
            }

            return pivotedData;
        },
        pivotTotalizerData = function (totalizerData) {
            var pivotedData = [],
                tempPivot,
                numberOfColumnsFound = totalizerData.length,
                columnsArray = validateColumns(),
                i,
                j;

            if (numberOfColumnsFound > 0) {
                for (j = 0; j < totalizerData[0].totals.length; j++) {
                    tempPivot = {};
                    tempPivot["Date"] = moment.unix(totalizerData[0].totals[j].range.start).format("MM/DD/YYYY hh:mm:ss a");
                    for (i = 0; i < numberOfColumnsFound; i++) {
                        tempPivot[columnsArray[i + 1].colName + " - " + totalizerData[i].op] = totalizerData[i].totals[j].total;
                    }
                    pivotedData.push(tempPivot);
                }
            }

            return pivotedData;
        },
        saveReportConfig = function () {
            point._pStatus = 0;  // activate report
            point["Report Config"].columns = validateColumns();
            point["Report Config"].filters = validateFilters();
            pointFilter.selectedPointTypes = getPointLookupFilterValues();
            pointFilter.name1Filter = getPointLookupFilterNameValues(1);
            pointFilter.name2Filter = getPointLookupFilterNameValues(2);
            pointFilter.name3Filter = getPointLookupFilterNameValues(3);
            pointFilter.name4Filter = getPointLookupFilterNameValues(4);
            point["Report Config"].pointFilter = pointFilter;
            point["Report Config"].interval.text = self.interval();
            point["Report Config"].interval.value = self.intervalValue();
            point.name1 = $pointName1.val();
            point.name2 = $pointName2.val();
            point.name3 = $pointName3.val();
            point.name4 = $pointName4.val();
            point.Name = self.reportDisplayTitle();

            //if (JSON.stringify(originalPoint) === JSON.stringify(point)) {
            //    return;
            //}
            reportSocket.emit('updatePoint', JSON.stringify({
                'newPoint': point,
                'oldPoint': originalPoint
            }));
        },
        setReportEvents = function () {
            var intervals;
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
                        totalColumn: false,
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
            });

            $addFilterbutton.on('click', function (e) {
                var rowTemplate = {
                    column: "",
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
            });

            $saveReportButton.on('click', function (e) {
                var $screenMessages = $tabConfiguration.find(".screenMessages");
                blockUI($tabConfiguration, true, " Saving Report...");
                $screenMessages.find(".errorMessage").text(""); // clear messages
                $screenMessages.find(".successMessage").text(""); // clear messages
                saveReportConfig();
                $(this).blur();
                e.preventDefault();
                e.stopPropagation();
            });

            $runReportButton.on('click', function (e) {
                self.viewReport();
                e.preventDefault();
                e.stopPropagation();
            });

            $viewReport.on('click', '.pointInstance', function () {
                var data = {
                    upi: $(this).attr('upi'),
                    pointType: $(this).attr('pointType'),
                    pointName: $(this).text()
                };

                self.showPointReview(data);
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
            self.listOfIntervals(intervals);
        },
        configureDataTable = function () {
            var aoColumns = [],
                i,
                columnsArray = validateColumns(),
                len = columnsArray.length,
                pointType,
                generateFieldValue = function (data, columnName, valueType) {
                    var result = "";
                    if (data[columnName] !== undefined) {
                        if (typeof data[columnName] === 'object') {
                            switch (valueType) {
                                case "Float":
                                    result = data[columnName].Value;
                                    break;
                                case "Bool":
                                case "BitString":
                                case "Enum":
                                case "undecided":
                                case "String":
                                case "Integer":
                                case "Unsigned":
                                case "null":
                                case "None":
                                    result = data[columnName].Value;
                                    break;
                                case "DateTime":
                                case "Timet":
                                    if (data[columnName].Value > 0) {
                                        result = moment.unix(data[columnName].Value).format("MM/DD/YYYY hh:mm a");
                                    } else {
                                        result = "";
                                    }
                                    break;
                                case "MinSec":
                                case "HourMin":
                                case "HourMinSec":
                                    result = data[columnName].Value;
                                    break;
                                case "UniquePID":
                                    if (data[columnName].PointInst !== undefined) {
                                        if (data[columnName].PointInst > 0) {
                                            result = data[columnName].PointName;
                                        } else {
                                            result = "";
                                        }
                                    }
                                    break;
                                default:
                                    result = data[columnName].Value;
                                    break;
                            }
                        } else {
                            result = data[columnName];
                        }
                    } else {
                        //console.log(" ERROR -- Data set does NOT contain value for '" + columnName + "'")
                    }
                    return result;
                },
                getColumnField = function (columnName) {
                    var name;
                    switch (self.reportType) {
                        case "History":
                        case "Totalizer":
                            name = columnName;
                            break;
                        case "Property":
                            name = columnName + (columnName !== "Name" ? ".Value" : "");
                            break;
                        default:
                            console.log(" - - - DEFAULT  getColumnField()");
                            break;
                    }
                    return name;
                },
                generateCustomHtml = function (tdField, columnConfig, data, columnIndex) {
                    var $customField,
                        htmlString,
                        value;
                    setTdClasses(tdField, columnConfig.valueType);
                    setTdAttribs(tdField, columnConfig, data, columnIndex);
                    if (data[columnConfig.colName]) {
                        switch (columnConfig.valueType) {
                            case "MinSec":
                                value = data[columnConfig.colName].Value;
                                htmlString = '<div class="durationCtrl durationDisplay"><span class="min"></span><span class="timeSeg">min</span><span class="sec"></span><span class="timeSeg">sec</span></div>';
                                $customField = $(htmlString);
                                $customField.find(".min").html(~~((value % 3600) / 60));
                                $customField.find(".sec").html(value % 60);
                                $(tdField).html($customField);
                                break;
                            case "HourMin":
                                value = data[columnConfig.colName].Value;
                                htmlString = '<div class="durationCtrl durationDisplay"><span class="hr"></span><span class="timeSeg">hr</span><span class="min"></span><span class="timeSeg">min</span></div>';
                                $customField = $(htmlString);
                                $customField.find(".hr").html(~~(value / 3600));
                                $customField.find(".min").html(~~((value % 3600) / 60));
                                $(tdField).html($customField);
                                break;
                            case "HourMinSec":
                                value = data[columnConfig.colName].Value;
                                htmlString = '<div class="durationCtrl durationDisplay"><span class="hr"></span><span class="timeSeg">hr</span><span class="min"></span><span class="timeSeg">min</span><span class="sec"></span><span class="timeSeg">sec</span></div>';
                                $customField = $(htmlString);
                                $customField.find(".hr").html(~~(value / 3600));
                                $customField.find(".min").html(~~((value % 3600) / 60));
                                $customField.find(".sec").html(value % 60);
                                $(tdField).html($customField);
                                break;
                        }
                    }
                },
                setTdAttribs = function (tdField, columnConfig, data, columnIndex) {
                    if (columnConfig.colName === "Name") {
                        switch (self.reportType) {
                            case "History":
                            case "Totalizer":
                                break;
                            case "Property":
                                $(tdField).addClass("pointInstance");
                                $(tdField).addClass("col-md-2");
                                $(tdField).attr('upi', data["Point Instance"].Value);
                                $(tdField).attr('columnIndex', columnIndex);
                                break;
                            default:
                                console.log(" - - - DEFAULT  setTdAttribs()");
                                break;
                        }
                    }
                    if (data[columnConfig.colName] && data[columnConfig.colName].PointInst) {
                        pointType = window.workspaceManager.config.Utility.pointTypes.getPointTypeNameFromEnum(data[columnConfig.colName].PointType);
                        $(tdField).addClass("pointInstance");
                        $(tdField).attr('upi', data[columnConfig.colName].PointInst);
                        $(tdField).attr('pointType', pointType);
                    }
                },
                setTdClasses = function (tdField, datatype) {
                    switch (datatype) {
                        case "DateTime":
                            $(tdField).addClass("small");
                            break;
                        default:
                            break;
                    }
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
                                columnTitle += " - " + item.operator.toLowerCase();
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
                        data: null,
                        // data: getColumnField(item.colName),
                        // render: getColumnField(item.colName),
                        render: function (data, type, row, item) {
                            return generateFieldValue(data, columnsArray[item.col].dataColumnName, columnsArray[item.col].valueType);
                        },
                        className: "dt-head-center",
                        fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                            generateCustomHtml(nTd, columnsArray[iCol], oData, iCol);
                        },
                        bSortable: true
                    };

                    return result;
                };

            if (self.designChanged() && $.fn.DataTable.isDataTable($viewReport)) {
                $viewReport.DataTable().destroy();
                $viewReport.empty();
                reportJsonData = {};
            }

            for (i = 0; i < len; i++) {
                columnsArray[i].dataColumnName = columnsArray[i].colName;
                aoColumns.push(buildColumnObject(columnsArray[i], i));
            }

            if (aoColumns.length > 0) {
                $viewReport.DataTable({
                    dom: 'Bfrtip',
                    buttons: [
                        {
                            extend: 'copyHtml5',
                            key: {
                                altKey: true,
                                key: '1'
                            }
                        },
                        {
                            extend: 'csvHtml5',
                            key: {
                                altKey: true,
                                key: '2'
                            }
                        },
                        {
                            extend: 'excelHtml5',
                            key: {
                                altKey: true,
                                key: '3'
                            }
                        },
                        {
                            extend: 'pdfHtml5',
                            key: {
                                altKey: true,
                                key: '4'
                            },
                            customize: function (doc, thisButton) {
                                // could insert TrendPlots here
                            }
                        },
                        {
                            extend: 'print',
                            key: {
                                altKey: true,
                                key: '5'
                            }
                        }
                    ],
                    //drawCallback: function () {
                    //    var api = this.api();
                    //    api.table().footer().html(
                    //        aoColumns.each(function (item) {
                    //            console.log(" item = " + item);
                    //            //api.column( 4, {page:'current'} ).data().sum()
                    //        })
                    //    );
                    //},
                    data: reportJsonData,
                    aoColumns: aoColumns,
                    pageLength: 25,
                    bLengthChange: false
                });
            }

            switch (self.reportType) {
                case "History":
                case "Totalizer":
                    $viewReport.find("thead th").addClass("diSortable");
                    $viewReport.find("thead th").attr("title", "Right mouse click to run PointInspector");
                    break;
                case "Property":
                    $viewReport.find("thead th:first").addClass("pointLookupColumn");
                    break;
                default:
                    break;
            }

            self.designChanged(false);
        },
        renderReport = function (data) {
            $viewReport.DataTable().clear();
            $viewReport.DataTable().rows.add(data).draw();
            $viewReport.show();
            blockUI($tabViewReport, false);
            self.refreshData(false);

            $viewReport.find(".diSortable").on('contextmenu', function (ev) {
                ev.preventDefault();
                return false;
            }, false);

            $viewReport.find(".diSortable").mousedown(function (event) {
                var columnIndex = $(event.target).index();
                switch (event.which) {
                    case 1: // left mouse button
                        break;
                    case 2: // middle mouse button
                        break;
                    case 3: // right mouse button
                        event.preventDefault();
                        event.stopPropagation();
                        self.showPointReview(self.listOfColumns()[columnIndex]);
                        return false;
                        break;
                    default:
                        console.log("what mouse button did you click?");
                        break;
                }
            });
        },
        renderHistoryReport = function (data) {
            if (data.err === undefined) {
                reportJsonData = pivotHistoryData(data.historyData);
                self.truncatedData(data.truncated);
                renderReport(reportJsonData);
            } else {
                console.log(" - * - * - renderHistoryReport() ERROR = ", data.err);
            }
        },
        renderTotalizerReport = function (data) {
            if (data.err === undefined) {
                reportJsonData = pivotTotalizerData(data);
                self.truncatedData(data.truncated);
                renderReport(reportJsonData);
            } else {
                console.log(" - * - * - renderTotalizerReport() ERROR = ", data.err);
            }
        },
        renderPropertyReport = function (data) {
            if (data.err === undefined) {
                reportJsonData = data;
                self.truncatedData(data.truncated);
                renderReport(reportJsonData);
            } else {
                console.log(" - * - * - renderPropertyReport() ERROR = ", data.err);
            }
        };

    self.reportType = "";

    self.reportDisplayTitle = ko.observable("");

    self.interval = ko.observable("Minute");

    self.intervalValue = ko.observable(1);

    self.listOfIntervals = ko.observableArray([]);

    self.listOfPropertiesLength = 0;

    self.propertiesFilter = ko.observable("");

    self.reportDisplayFooter = ko.observable("");

    self.truncatedData = ko.observable(false);

    self.designChanged = ko.observable(true);

    self.refreshData = ko.observable(true);

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

        getScreenFields();
        initKnockout();

        if (point) {
            originalPoint = JSON.parse(JSON.stringify(point));
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

            self.reportDisplayFooter(moment().format("dddd MMMM DD, YYYY hh:mm:ss a"));
            if (columns) {
                self.listOfColumns(reportConfig.columns);
                self.listOfFilters(initFilters(reportConfig.filters));
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        break;
                    case "Property":
                        filterOpenPointSelector($filterByPoint);
                        getEnumProperties();
                        break;
                    default:
                        console.log(" - - - DEFAULT  init()");
                        break;
                }
                pointFilter = (reportConfig.pointFilter ? reportConfig.pointFilter : pointFilter);
                self.interval(point["Report Config"].interval.text);
                self.intervalValue(point["Report Config"].interval.value);
            } else { // Initial config
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        point["Report Config"].returnLimit = 2000;
                        self.listOfColumns.push({
                            colName: "Date",
                            valueType: "DateTime",
                            operator: "",
                            upi: 0
                        });
                        self.listOfFilters.push({
                            column: "Start_Date",
                            condition: "$and",
                            childLogic: false,
                            operator: "EqualTo",
                            valueType: "DateTime",
                            value: moment().subtract(1, 'days').unix(),
                            date: moment().subtract(1, 'days').unix(),
                            time: "00:00"
                        });
                        self.listOfFilters.push({
                            column: "End_Date",
                            condition: "$and",
                            childLogic: false,
                            operator: "EqualTo",
                            valueType: "DateTime",
                            value: moment().unix(),
                            date: moment().unix(),
                            time: "00:00"
                        });
                        break;
                    case "Property":
                        filterOpenPointSelector($filterByPoint);
                        getEnumProperties();
                        point["Report Config"].returnLimit = 4000;
                        self.listOfColumns.push({
                            colName: "Name",
                            valueType: "String"
                        });
                        break;
                    default:
                        console.log(" - - - DEFAULT  init() null columns");
                        break;
                }

                point["Report Config"].interval = {};
                point["Report Config"].interval.text = self.interval();
                point["Report Config"].interval.value = self.intervalValue();
                point["Report Config"].columns = [];
                point["Report Config"].filters = [];
                point["Report Config"].pointFilter = pointFilter;
                originalPoint = JSON.parse(JSON.stringify(point)); // reset original point ref since we've added attribs
            }

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

            $reportSpinner.hide();
            $containerFluid.show();
            tabSwitch(1);

            updateListOfFilters(self.listOfFilters());
            setTimeout(function () {
                $reporttitleInput.focus();
            }, 1500);
            setReportEvents();
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

    self.selectPointForColumn = function (data, index) {
        var upi = parseInt(data.upi, 10),
            currentIndex = (typeof index === "function" ? index(): index),
            columnIndex = parseInt(currentIndex, 10);

        openPointSelectorForColumn(columnIndex, upi);
    };

    self.selectPointForFilter = function (data, index) {
        var upi = parseInt(data.upi, 10),
            columnIndex = parseInt(index(), 10);

        openPointSelectorForFilter(columnIndex, upi);
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

    self.viewReport = function () {
        var requestObj = buildReportDataRequest();

        tabSwitch(2);
        if (self.designChanged()) {
            configureDataTable();
        }
        if (requestObj) {
            switch (self.reportType) {
                case "History":
                    ajaxPost(requestObj, "/report/historyDataSearch", renderHistoryReport);
                    break;
                case "Totalizer":
                    ajaxPost(requestObj, "/report/totalizerReport", renderTotalizerReport);
                    break;
                case "Property":
                    ajaxPost(requestObj, "/report/reportSearch", renderPropertyReport);
                    break;
                default:
                    console.log(" - - - DEFAULT  viewReport()");
                    break;
            }
        } else {
            $viewReport.show();
            blockUI($tabViewReport, false);
        }
        $('html,body').stop().animate({
            scrollTop: 0
        }, 700);
    };

    self.clearColumnPoint = function (indexOfColumn) {
        var tempArray = self.listOfColumns(),
            item = tempArray[indexOfColumn];
        item.colName = "Choose Point";
        item.valueType = "String";
        item.operator = "";
        item.upi = 0;
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

    self.selectInterval = function (selectedInterval) {
        self.interval(selectedInterval);
    };

    self.selectedFilterCondition = function (indexOfCondition, selectedItem) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfCondition];
        if (filter.condition != selectedItem.value) {
            filter.condition = selectedItem.value;
            updateListOfFilters(tempArray);
        }
    };

    self.selectedFilterOperator = function (indexOfOperator, selectedItem) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfOperator];
        if (filter.operator != selectedItem.value) {
            filter.operator = selectedItem.value;
            updateListOfFilters(tempArray);
        }
    };

    self.selectedFilterValue = function (element, indexOfValue, selectedItem) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfValue];
        if (filter.value != selectedItem) {
            filter.value = selectedItem;
            updateListOfFilters(tempArray);
        }
    };

    self.selectedFilterEValue = function (element, indexOfValue, selectedItem) {
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

    self.filteredProps = ko.computed(function () {
        var filter = self.propertiesFilter().toLowerCase(),
            props = propertyFields;

        if (filter === "") {
            return props;
        } else {
            return ko.utils.arrayFilter(props, function (prop) {
                return prop.name.toLowerCase().indexOf(filter) > -1;
            });
        }
    }, self);
};

function applyBindings() {
    var vm;
    if (window.opener === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        vm = new reportsViewModel();
        vm.init();
        ko.applyBindings(vm);
    }
};

$(function () {
    applyBindings();
});

"use strict";
window.workspaceManager = (window.opener || window.top).workspaceManager;

var initKnockout = function () {
    ko.bindingHandlers.reportDatePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var initialMomentDate = moment.unix(viewModel.value),
                options = {
                defaultDate: initialMomentDate,
                format: 'MM/DD/YYYY, h:mm a'
            };
            $(element).datetimepicker(options).on("dp.change", function (ev) {
                var val = $.isFunction(valueAccessor()) ? valueAccessor() : parseInt(valueAccessor(), 10);
                if (ev.date) {
                    viewModel.value = moment(ev.date).unix();
                } else {
                    if (val !== '') {
                        viewModel.value = val;
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
        }
    };
}

var reportsViewModel = function () {
    var self = this,
        $mainWindow,
        $direports,
        $tabs,
        $tabConfiguration,
        $tabPreview,
        $previewReport,
        $tabReportNotes,
        $tabDesign,
        $designReport,
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
        $addPointbutton,
        $addFilterbutton,
        $scheduleReportButton,
        $saveReportButton,
        $runReportButton,
        $filterOperator,
        $filterByPointPanel,
        $filterByPointPanelAnchor,
        $filtersPanelAnchor,
        $listBoxContentpointTypes,
        $modalScheduleReport,
        $reporttitleInput,
        $columnNames,
        pointSelectorRef,
        $pointSelectorIframe,
        currentTab,
        reportSocket,
        reportJsonData = {},
        Name = "dorsett.reportUI",
        workspace = {},
        originalPoint = {},
        reportId,
        pointFilter = {
                name1Filter: '',
                name2Filter: '',
                name3Filter: '',
                name4Filter: '',
                selectedPointTypes: []
            },
        propertyFields = [],
        templateId,
        sortObject = function (obj, order) {
            var key,
                tempArry = [],
                i,
                tempObj = {};

            for (key in obj) {
                tempArry.push(key);
            }

            tempArry.sort(
                function (a, b) {
                    return a.localeCompare(b);
                    //return a.toLowerCase().localeCompare(b.toLowerCase());
                }
            );

            if (order === 'desc') {
                for (i = tempArry.length - 1; i >= 0; i--) {
                    tempObj[tempArry[i]] = obj[tempArry[i]];
                }
            } else {
                for (i = 0; i < tempArry.length; i++) {
                    tempObj[tempArry[i]] = obj[tempArry[i]];
                }
            }

            return tempObj;
        },
        blockUI = function ($control, state, text) {
            if (state === true) {
                $reportSpinner.show();
                $spinnertext.text(text);
            } else {
                $reportSpinner.hide();
                $spinnertext.text("");
            }
            $control.attr('disabled', state);
        },
        setFiltersChildLogic = function () {
            var localArray = self.listOfFilters(),
                len = localArray.length,
                i,
                orConditionFound = false;

            for (i = 0; i < len; i++) {
                if (i === 0) {
                    localArray[i].condition = "$and";
                }

                localArray[i].childLogic = false;
                if (localArray[i].condition === "$or") {
                    orConditionFound = true;
                } else {
                    if (orConditionFound) {
                        localArray[i].childLogic = true;
                    }
                }
            }
        },
        ajaxPost = function (input, url, callback) {
            //console.log(url, "input = " + JSON.stringify(input));
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(input)
            }).done(function (returnData) {
                //console.log(url, "returnData = " + JSON.stringify(returnData));
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
                        updatedList[objIndex] = tempObject;
                        self.listOfColumns([]);
                        self.listOfColumns(updatedList);
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
                        self.listOfFilters([]);
                        self.listOfFilters(updatedList);
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
                localArray = self.listOfFilters(),
                i;

            for (i = 0; i < localArray.length; i++) {
                if (localArray[i].column !== "") {
                    results.push(localArray[i]);
                }
            }

            return results;
        },
        getValueList = function (property, pointType) {
            var result = [],
                i,
                options = window.workspaceManager.config.Utility.pointTypes.getEnums(property, pointType),
                len = (options && options.length ? options.length : 0);

            for (i = 0; i < len; i++) {
                result.push(options[i].name);
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
                    if (props[key].reportEnable) {
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
                    upis.push(parseInt(columns[i].upi, 10));
                }

                for (key in filters) {
                    filter = filters[key];
                    if (!filter.column || _.isEmpty(filter)) {
                        continue;
                    }
                    //console.log(filter);
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

                result = {
                    upis: upis,
                    startTime: startDate,
                    endTime: endDate,
                    reportConfig: point["Report Config"],
                    reportType: point["Report Type"].Value,
                    sort: ""
                }
            }

            return result;
        },
        tabSwitch = function (tabNumber) {
            //console.log("  - - -  tabSwitch() tabNumber = ", tabNumber);
            if ($.isNumeric(tabNumber) === true) {
                $tabs.find("li").removeClass("active");
                $tabs.find("li:eq(" + (tabNumber - 1) + ")").addClass("active");
            }
            switch (tabNumber) {
                case 1:
                    $tabConfiguration.addClass("active");
                    $tabConfiguration.show();
                    $tabPreview.removeClass("active");
                    $tabPreview.hide();
                    $tabDesign.removeClass("active");
                    $tabDesign.hide();
                    $tabReportNotes.removeClass("active");
                    $tabReportNotes.hide();
                    break;
                case 2:
                    $tabConfiguration.removeClass("active");
                    $tabConfiguration.hide();
                    $tabPreview.addClass("active");
                    $tabPreview.show();
                    $tabDesign.removeClass("active");
                    $tabDesign.hide();
                    $tabReportNotes.removeClass("active");
                    $tabReportNotes.hide();
                    break;
                case 3:
                    $tabConfiguration.removeClass("active");
                    $tabConfiguration.hide();
                    $tabPreview.removeClass("active");
                    $tabPreview.hide();
                    $tabDesign.addClass("active");
                    $tabDesign.show();
                    $tabReportNotes.removeClass("active");
                    $tabReportNotes.hide();
                    break;
                case 4:
                    $tabConfiguration.removeClass("active");
                    $tabConfiguration.hide();
                    $tabPreview.removeClass("active");
                    $tabPreview.hide();
                    $tabDesign.removeClass("active");
                    $tabDesign.hide();
                    $tabReportNotes.addClass("active");
                    $tabReportNotes.show();
                    break;
            }
            currentTab = tabNumber;
        },
        initSocket = function (cb) {
            reportSocket = io.connect('http://' + window.location.hostname + ':8085');

            reportSocket.on('connect', function () {
                console.log('SOCKETID:', reportSocket.id);
                if (cb) {
                    cb();
                }
            });
        },
        getScreenFields = function () {
            $mainWindow = $(".mainWindow");
            $direports = $(".direports");
            $modalScheduleReport = $(".modal-scheduleReport");
            $tabs = $direports.find(".tabs");
            $tabConfiguration = $direports.find(".tabConfiguration");
            $tabPreview = $direports.find(".tabPreview");
            $tabDesign = $direports.find(".tabDesign");
            $tabReportNotes = $direports.find(".tabReportNotes");
            $previewReport = $direports.find(".previewReport");
            $designReport = $direports.find(".designReport");
            $reportSpinner = $direports.find(".reportingGettingData");
            $spinnertext = $reportSpinner.find(".spinnertext");
            $pointName1 = $direports.find(".pointName1");
            $pointName2 = $direports.find(".pointName2");
            $pointName3 = $direports.find(".pointName3");
            $pointName4 = $direports.find(".pointName4");
            $columnsGrid = $direports.find(".columnsGrid");
            $filtersGrid = $direports.find(".filtersGrid");
            $containerFluid = $direports.find(".container-fluid");
            $addPointbutton = $direports.find(".addPointbutton");
            $addFilterbutton = $direports.find(".addFilterbutton");
            $scheduleReportButton = $direports.find(".scheduleReportButton");
            $saveReportButton = $direports.find(".saveReportButton");
            $runReportButton = $direports.find(".runReportButton");
            $columnNames = $direports.find(".columnName");
            $filterOperator = $direports.find(".filterOperator");
            $filterByPointPanel = $direports.find("#filterByPointPanel");
            $filterByPointPanelAnchor = $filterByPointPanel.find(".filterByPointPanelAnchor");
            $filtersPanelAnchor = $direports.find(".filtersPanelAnchor");
            $pointSelectorIframe = $filterByPointPanel.find(".pointLookupFrame");
            $reporttitleInput = $direports.find(".reporttitle").find("input");
            $listBoxContentpointTypes = $pointSelectorIframe.contents().find("#listBoxContentpointTypes");
        },
        getPointLookupFilterNameValues = function (nameNumber) {
            var $nameInputField,
                searchPattern = "input[placeholder='Segment " + nameNumber + "']";

            $nameInputField = $pointSelectorIframe.contents().find(searchPattern);

            return ($nameInputField[0] ? $nameInputField[0].value : "") ;
        },
        getPointLookupFilterValues = function () {
            var answer = [],
                selectedPointTypes,
                numberOfAllPointTypes;
            if (pointSelectorRef && pointSelectorRef.window.pointLookup) {
                selectedPointTypes = pointSelectorRef.window.pointLookup.getCheckedPointTypes(),
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
            point.name1 = $pointName1.val();
            point.name2 = $pointName2.val();
            point.name3 = $pointName3.val();
            point.name4 = $pointName4.val();


            //if (JSON.stringify(originalPoint) === JSON.stringify(point)) {
            //    return;
            //}
            point = sortObject(point);
            reportSocket.emit('updatePoint', JSON.stringify({
                'newPoint': point,
                'oldPoint': originalPoint
            }));
        },
        setReportEvents = function () {
            $columnNames.on('click', function (e) {
                //console.log('$columnNames clicked');
                openPointSelectorForColumn();
                e.preventDefault();
                e.stopPropagation();
            });

            $addPointbutton.on('click', function (e) {
                //console.log('$addPointbutton clicked');
                var rowTemplate = {
                        colName: "Choose Point",
                        valueType: "String",
                        upi: 0
                    },
                    $newRow;
                e.preventDefault();
                e.stopPropagation();
                if (self.listOfColumns.indexOf(rowTemplate) === -1) {
                    self.listOfColumns.push(rowTemplate);
                    $newRow = $columnsTbody.find('tr:last');
                    $newRow.addClass("ui-sortable-handle");
                    $newRow.addClass("danger");
                }
            });

            $addFilterbutton.on('click', function (e) {
                //console.log('$addFilterbutton clicked');
                var rowTemplate = {
                        column: "",
                        condition: "$and",
                        childLogic: false,
                        operator: "EqualTo",
                        valueType: "String",
                        value: "",
                        valueList: "",
                    },
                    $newRow;
                e.preventDefault();
                e.stopPropagation();
                if (self.listOfFilters.indexOf(rowTemplate) === -1) {
                    self.listOfFilters.push(rowTemplate);
                    setFiltersChildLogic();
                    //$newRow = $filtersTbody.find('tr:last');
                    //$newRow.addClass("ui-sortable-handle");
                }
            });

            $scheduleReportButton.on('click', function (e) {
                console.log('$scheduleReportButton clicked');
                $(this).blur();
                e.preventDefault();
                e.stopPropagation();
            });

            $saveReportButton.on('click', function (e) {
                console.log('$saveReportButton clicked');
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
                //console.log('$runReportButton clicked');
                self.reportPreview();
                e.preventDefault();
                e.stopPropagation();
            });

            $previewReport.on('click', '.pointInstance', function () {
                var data = {
                    upi: $(this).attr('upi'),
                    pointType: $(this).attr('pointType'),
                    pointName: $(this).text()
                };

                self.showPointReview(data);
            });

            $filtersPanelAnchor.on('click', function (e) {
                console.log('$filtersPanelAnchor clicked');
                var $firstInputField = $filtersGrid.find(".filterValue:first").find("input");

                setTimeout(function () {
                    $firstInputField.focus();
                }, 500);
            });

            $('.panel-group').on('shown.bs.collapse', function (e) {
                var offset = $(e.target).offset();
                if (offset) {
                    $('html,body').stop().animate({
                        scrollTop: $(e.target).parent().offset().top - 20
                    }, 0);
                }
            });
        },
        configureDataTable = function () {
            var aoColumns = [],
                i,
                len,
                columnsArray,
                item,
                renderCell = function (data, columnName) {
                    var result = "";

                    if (data[columnName]) {
                        if (typeof data[columnName] === 'object') {
                            result = data[columnName].Value;
                        } else {
                            result = data[columnName];
                        }
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
                setTdClasses = function (tdField, datatype) {
                    switch (datatype) {
                        case "DateTime":
                            $(tdField).addClass("small");
                            break;
                        default:
                            break;
                    }
                },
                setTdAttribs = function (tdField, columnConfig, data) {
                    if (columnConfig.colName === "Name") {
                        switch (self.reportType) {
                            case "History":
                            case "Totalizer":
                                break;
                            case "Property":
                                $(tdField).addClass("pointInstance");
                                $(tdField).addClass("col-md-2");
                                $(tdField).attr('upi', data["Point Instance"].Value);
                                $(tdField).attr('pointType', data["Point Type"].Value);
                                break;
                            default:
                                console.log(" - - - DEFAULT  setTdAttribs()");
                                break;
                        }
                    }
                };

            if (self.designChanged() && $.fn.DataTable.isDataTable($previewReport)) {
                $previewReport.DataTable().destroy();
                $previewReport.empty();
                reportJsonData = {};
            }
            switch (self.reportType) {
                case "History":
                case "Totalizer":
                case "Property":
                    columnsArray = self.listOfColumns();
                    len = columnsArray.length;
                    for (i = 0; i < len; i++) {
                        item = columnsArray[i];
                        aoColumns.push({
                            title: item.colName.replace(/_/g, " "),
                            data: null,
                            // data: getColumnField(item.colName),
                            // render: getColumnField(item.colName),
                            render: function (data, type, row, item) {
                                return renderCell(data, columnsArray[item.col].colName);
                            },
                            className: "dt-head-center",
                            fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                                setTdClasses(nTd, columnsArray[iCol].valueType);
                                setTdAttribs(nTd, columnsArray[iCol], oData);
                            }
                        });
                    }

                    if (aoColumns.length > 0) {
                        $previewReport.DataTable({
                            data: reportJsonData,
                            aoColumns: aoColumns,
                            pageLength: 25,
                            bLengthChange: false
                        });
                    }
                    break;
                default:
                    console.log(" - - - DEFAULT  configureDataTable()");
                    break;
            }
            self.designChanged(false);
        },
        renderReport = function (data) {
            $previewReport.DataTable().clear();
            $previewReport.DataTable().rows.add(data).draw();
            if (currentTab === 2) {
                $previewReport.show();
                $tabPreview.show();
                blockUI($tabPreview, false);
            }
            self.refreshData(false);
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
                reportJsonData = pivotHistoryData(data.historyData);
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
        },

    //Function is responsible when Column Name is changed in dropdown
        onColumnNamePropertySelect = function (e) {
            //console.log(this);
            var obj = dorsett.reportUI[dorsett.reportUI.alias],
                g = obj.columnGrid,
                dataItem = this.dataItem(e.item.index()),
                gridItem = g.dataItem(obj.selectedColumnRow);

            gridItem.valueType = dataItem.value.valueType;
            gridItem.name = dataItem.name;
            //g.refresh();
        },
    //Comparing json objects to determine whether they are equal or not
        areEqual = function (objFirst, objSecond) {
            if (objFirst === objSecond) return true;
            if (!( objFirst instanceof Object ) || !( objSecond instanceof Object )) return false;

            if (objFirst.constructor !== objSecond.constructor) return false;
            for (var p in objFirst) {
                if (!objFirst.hasOwnProperty(p)) continue;

                if (!objSecond.hasOwnProperty(p)) return false;

                if (objFirst[p] === objSecond[p]) continue;

                if (!this.areEqual(objFirst[p], objSecond[p])) return false;
            }

            for (p in objSecond) {
                if (objSecond.hasOwnProperty(p) && !objFirst.hasOwnProperty(p)) return false;
            }
            return true;
        };

    self.reportType = "";

    self.reportDisplayTitle = ko.observable("");

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
    };

    self.deleteFilterRow = function (item) {
        self.listOfFilters.remove(item);
    };

    self.init = function () {
        var columns,
            reportConfig;

        currentTab = 1;
        workspace = workspace;
        getScreenFields();
        initKnockout();
        $modalScheduleReport.hide();

        if (point) {
            originalPoint = JSON.parse(JSON.stringify(point));
            reportId = point._id;
            if (point["Report Config"] === undefined) {
                point["Report Config"] = {};
            }
            self.reportType = point["Report Type"].Value;
            reportConfig = (point["Report Config"] ? point["Report Config"] : undefined);
            templateId = (reportConfig ? reportConfig.reportTemplate : "");
            columns = (reportConfig ? reportConfig.columns : undefined);
            $pointName1.val(point.name1);
            $pointName2.val(point.name2);
            $pointName3.val(point.name3);
            $pointName4.val(point.name4);

            setReportEvents();
            initSocket();

            self.reportDisplayTitle(point.Name);
            self.reportDisplayFooter(moment().format("dddd MMMM DD, YYYY hh:mm:ss a"));
            if (columns) {
                self.listOfColumns(reportConfig.columns);
                self.listOfFilters(reportConfig.filters);
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        break;
                    case "Property":
                        filterOpenPointSelector($filterByPointPanel);
                        getEnumProperties();
                        break;
                    default:
                        console.log(" - - - DEFAULT  init()");
                        break;
                }
                pointFilter = (reportConfig.pointFilter ? reportConfig.pointFilter : pointFilter);

            } else { // Initial config
                switch (self.reportType) {
                    case "History":
                    case "Totalizer":
                        point["Report Config"].returnLimit = 200;
                        self.listOfColumns.push({
                            colName: "Date",
                            valueType: "DateTime",
                            upi: 0
                        });
                        self.listOfFilters.push({
                            column: "Start_Date",
                            condition: "$and",
                            childLogic: false,
                            operator: "EqualTo",
                            valueType: "DateTime",
                            value: moment().subtract(1, 'days').unix()
                        });
                        self.listOfFilters.push({
                            column: "End_Date",
                            condition: "$and",
                            childLogic: false,
                            operator: "EqualTo",
                            valueType: "DateTime",
                            value: moment().unix()
                        });
                        break;
                    case "Property":
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

                point["Report Config"].columns = [];
                point["Report Config"].filters = [];
                point["Report Config"].pointFilter = pointFilter;
                point["Report Config"].interval = 1;
                point["Report Config"].offset = 6;
                originalPoint = JSON.parse(JSON.stringify(point)); // reset original point ref since we've added attribs
            }
            $filtersTbody = $('.filtersGrid tbody');
            $columnsTbody = $('.columnsGrid .sortablecolums');

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
                    self.listOfFilters([]);
                    self.listOfFilters(tempArray);
                    //listSortOrder("none");
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
                    self.listOfColumns([]);
                    self.listOfColumns(tempArray);
                    //listSortOrder("none");
                },
                scroll: true,
                handle: '.handle'
            });

            self.listOfColumns.subscribe(function (changes) { // watch for changes to Columns array
                console.log(" - - - - listOfColumns() changed!   changes = ", changes);
                self.designChanged(true);
                self.refreshData(true);
            }, null, "arrayChange");

            self.listOfFilters.subscribe(function (changes) { // watch for changes to filter array
                console.log(" - - - - listOfFilters() changed!   changes = ", changes);
                setFiltersChildLogic();
                self.designChanged(true);
                self.refreshData(true);
            }, null, "arrayChange");

            $reportSpinner.hide();
            $containerFluid.show();
            tabSwitch(1);

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

            setFiltersChildLogic();

            setTimeout(function () {
                $reporttitleInput.focus();
            }, 1500);
        }
    };

    self.operators = function (op) {
        //console.log(" - - operators() op = ", op);
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
        //console.log(" - - conditions() called");
        var array = [];
        array.push(
            {text: "and", value: "$and"},
            {text: "or", value: "$or"}
        );
        return array;
    };

    self.displayCondition = function (op) {
        //console.log(" - - - displayCondition() op = ", op);
        switch (op) {
            case "$and":
                return "and";
                break;
            case "$or":
                return "or";
                break;
            default:
                return op;
                break;
        }
    };

    self.displayOperator = function (con) {
        //console.log(" - - - displayOperator() con = ", con);
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

    self.selectPointForColumn = function (data, index) {
        var upi = parseInt(data.upi, 10),
            columnIndex = parseInt(index(), 10);

        openPointSelectorForColumn(columnIndex, upi);
    };

    self.selectPointForFilter = function (data, index) {
        var upi = parseInt(data.upi, 10),
            columnIndex = parseInt(index(), 10);

        openPointSelectorForFilter(columnIndex, upi);
    };

    self.showPointReview = function (data) {
            var openWindow = window.workspaceManager.openWindowPositioned,
                pointTypesUtility = window.workspaceManager.config.Utility.pointTypes,
                pointType = data.pointType,
                endPoint,
                upi = parseInt(data.upi, 10),
                options = {
                    width: 850,
                    height: 600
                };
            endPoint = pointTypesUtility.getUIEndpoint(pointType, upi);
            if (endPoint) {
                openWindow(endPoint.review.url, data.pointName, pointType, endPoint.review.target, upi, options);
            } else {
                //  handle a bad UPI reference
            }
        };

    self.reportConfiguration = function () {
        console.log("report config");
        tabSwitch(1);
    };

    self.reportPreview = function () {
        console.log("report preview");
        var requestObj,
            historyDataUrl = "/report/historyDataSearch",
            totalizerDataUrl = "/report/totalizeDataSearch",
            propertyDataUrl = "/report/reportSearch";

        tabSwitch(2);
        $previewReport.hide();
        $tabPreview.hide();
        blockUI($tabPreview, true, " Getting Data..");
        if (self.designChanged()) {
            configureDataTable();
        }
        requestObj = buildReportDataRequest();
        if (requestObj) {
            switch (self.reportType) {
                case "History":
                    ajaxPost(requestObj, historyDataUrl, renderHistoryReport);
                    break;
                case "Totalizer":
                    ajaxPost(requestObj, totalizerDataUrl, renderTotalizerReport);
                    break;
                case "Property":
                    ajaxPost(requestObj, propertyDataUrl, renderPropertyReport);
                    break;
                default:
                    console.log(" - - - DEFAULT  reportPreview()");
                    break;
            }
        } else {
            $previewReport.show();
            $tabPreview.show();
            blockUI($tabPreview, false);
        }
        $('html,body').stop().animate({
            scrollTop: 0
        }, 700);
    };

    self.reportDesign = function () {
        console.log("design report");
        tabSwitch(3);
    };

    self.reportNotes = function () {
        console.log("report notes");
        tabSwitch(4);
        var reportNotesTarget = $("#reportNotes");

        reportNotesTarget.width($(".tab-content").width()).height("1220px");

        if (!reportNotesTarget.attr("src")) {
            reportNotesTarget.attr('src', "/reportNotes/");
        }
    };

    self.selectPropertyColumn = function (element, indexOfColumn, selectedValue) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn],
            prop = getProperty(selectedValue.name);
        column.colName = selectedValue.name;
        column.valueType = prop.valueType;
        self.listOfColumns([]);
        self.listOfColumns(tempArray);
    };

    self.selectPropertyFilter = function (element, indexOfFilter, selectedValue) {
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfFilter],
            prop = getProperty(selectedValue.name),
            $elementRow = $(element).parent().parent().parent().parent().parent(),
            $inputField = $elementRow.find(".filterValue").find("input");
        filter.column = selectedValue.name;
        filter.condition = "$and";
        filter.operator = "EqualTo";
        filter.childLogic = false;
        filter.valueType = prop.valueType;
        filter.value = (filter.valueType === "Bool" ? "True" : "");
        filter.valueList = getValueList(selectedValue.name, selectedValue.name);
        self.listOfFilters([]);
        self.listOfFilters(tempArray);
    };

    self.selectedFilterCondition = function (indexOfCondition, selectedValue) {
        console.log(" - - selectedFilterCondition() indexOfOperator = " + indexOfCondition + "  selectedValue = " + selectedValue);
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfCondition];
        if (filter.condition != selectedValue.value) {
            filter.condition = selectedValue.value;
            self.listOfFilters([]);
            self.listOfFilters(tempArray);
        }
    };

    self.selectedFilterOperator = function (indexOfOperator, selectedValue) {
        console.log(" - - selectedFilterOperator() indexOfOperator = " + indexOfOperator + "  selectedValue = " + selectedValue);
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfOperator];
        if (filter.operator != selectedValue.value) {
            filter.operator = selectedValue.value;
            self.listOfFilters([]);
            self.listOfFilters(tempArray);
        }
    };

    self.selectedFilterValue = function (element, indexOfValue, selectedValue) {
        console.log(" - - selectedFilterValue() indexOfValue = " + indexOfValue + "  selectedValue = " + selectedValue);
        var tempArray = self.listOfFilters(),
            filter = tempArray[indexOfValue];
        if (filter.value != selectedValue) {
            filter.value = selectedValue;
            self.listOfFilters([]);
            self.listOfFilters(tempArray);
        }
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

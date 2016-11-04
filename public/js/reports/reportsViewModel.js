"use strict";
window.workspaceManager = window.top.workspaceManager;

var dti = {
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
    getTemplate: function (id) {
        var markup = $(id).html();

        return $(markup);
    },
};

var reportsVM,
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
                list = config.options(),
                notifier = config.notifier,
                hideEvent = config.hideEvent,
                $liList;

            $select.addClass('select-processed');

            dti.forEachArray(list, function addItemToSelect(item) {
                $select.append($('<option>', {
                        value: item.key(),
                        selected: true
                    })
                        .text(item.key())
                );
            });
            // Initial initialization:
            $select.material_select({
                belowOrigin: true,
                showCount: true,
                countSuffix: 'Types'
            });

            $liList = $element.find('li');

            dti.forEachArray(list, function syncDropdownStatus (item, idx) {
                if (item.selected() && item.visible()) {
                    $($liList[idx]).addClass('active');
                    $($liList[idx]).find('input').prop('checked', true);
                }
            });

            // Find the "options" sub-binding:
            var boundValue = valueAccessor();

            // Register a callback for when "options" changes:
            // boundValue.options.subscribe(function () {
            //     $select.material_select();
            // });

            $select.on('change', function handleMaterialSelectChange (event, target) {
                var $target = $(target),
                    index = $target.index(),
                    selected = $target.hasClass('active');

                if (!target.skipNofity) {
                    notifier();

                    list[index].selected(selected);
                }
            });

            $select.siblings('input.select-dropdown').on('close', function doHide () {
                hideEvent();
            });

        }
    };

    ko.bindingHandlers.dtiReportsMaterializeSelect = {
        suspend: false,
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var suspend = false,
                boundField = valueAccessor(),
                $element = $(element);

            // $element.material_select('destroy');
            $element.material_select();
            $element.on('change', function() {
                console.log("material_select change() fired....");
                if (ko.isObservable(boundField)) {
                    boundField(this.selectedOptions[0].value);
                } else {
                    boundField = this.selectedOptions[0].value;
                }

                if (!suspend) {
                    suspend = true;
                    var event = new CustomEvent('change', {
                        detail: 'change',
                        bubbles: true
                    });
                    $(this).get(0).dispatchEvent(event);
                } else {
                    suspend = false;
                }
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            // $(element).material_select();
        }
    };

    ko.bindingHandlers.dtiReportsMaterializePickadate = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).pickadate();
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };

    ko.bindingHandlers.dtiReportsMaterializePickatime = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).pickatime();
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };
};

var reportsViewModel = function () {
    var self = this,
        $direports,
        $tabs,
        $tabConfiguration,
        $configurationButton,
        $tabViewReport,
        $viewReportButton,
        $dataTablePlaceHolder,
        $rightPanel,
        $spinnertext,
        $editColumnModal,
        $viewColumnModal,
        $viewReportNav,
        $globalEditColumnModal,
        $columnsGrid,
        $gridColumnConfig,
        $gridColumnConfigTable,
        $filtersGrid,
        $columnsTbody,
        $gridColumnsTbody,
        $filtersTbody,
        $filterByPoint,
        $reportTitleInput,
        $reportColumns,
        $additionalFilters,
        $columnNames,
        $hiddenPlaceholder,
        $globalPrecisionText,
        $globalPrecision,
        $globalIncludeInChartText,
        $globalIncludeInChart,
        $globalCalculateText,
        $globalCalculate,
        $availableChartTypesChartTab,
        $reportChartDiv,
        $saveReportButton,
        $pointSelectorIframe,
        longClickStart,
        longClickTimer = 100,
        reportData,
        reportChartData,
        activeDataRequests,
        reportSocket,
        exportEventSet,
        totalizerDurationInHours = true,
        Name = "dorsett.reportUI",
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
        windowUpi,
        resizeTimer = 400,
        lastResize = null,
        decimalPadding = "0000000000000000000000000000000000000000",
        currentUser,
        ENUMSTEMPLATESTEMPLATES,
        ENUMSTEMPLATESENUMS,
        setNewPointReference = function (refPointUPI, property) {
            // console.log("- - - - setNewPointReference() called....   refPointUPI = " + refPointUPI + " property = " + property);
            var refPoint,
                appIndex = getMaxAppIndexUsed(),
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
                point["Point Refs"].push(tempRef);
            } else {
                if (!!refPointUPI) {
                    ajaxCall("GET", null, getPointURL + refPointUPI, pushNewReferencedPoint);
                }
                console.log("setNewPointReference() refPointUPI = " + refPointUPI + " property = " + property + "  refPoint = " + refPoint);
            }
        },
        userCanEdit = function (data, requestedAccessLevel) {
            var cumulativePermissions = 0,
                groups,
                isSystemAdmin;

            if (!!currentUser) {
                groups = currentUser.groups.filter(function (item) {
                    return !!~data.Security.indexOf(item._id);
                });
                isSystemAdmin = currentUser["System Admin"].Value;

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
        getPointInspectorParams = function (filter) {
            return {
                name1: filter.name1,
                name2: filter.name2,
                name3: filter.name3,
                name4: filter.name4,
                pointTypes: filter.pointTypes
            };
        },
        setPointInspectorParams = function (filterObject, filter) {
            filterObject.name1 = filter.name1;
            filterObject.name2 = filter.name2;
            filterObject.name3 = filter.name3;
            filterObject.name4 = filter.name4;
            filterObject.pointTypes = filter.pointTypes;
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
                    if (appIndex !== undefined && upi !== undefined) {
                        return pointRef.AppIndex === appIndex && pointRef.Value === upi && pointRef.PropertyName === referenceType;
                    } else {
                        return (pointRef.AppIndex === appIndex || pointRef.Value === upi) && pointRef.PropertyName === referenceType;
                    }
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
                        htmlString += '<span' + (scheduled ? ' class = "nowrap">' : '>');
                        htmlString += '<input type="checkbox" ' + (enumValue > 0 ? 'checked ' : '') + (disabled ? 'disabled' : '');
                        htmlString += (scheduled ? '><span>' + key + '</span><br>' : '><label>' + key + '</label><br>');
                        htmlString += '</span>';
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
                uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
                });
            return uuid;
        },
        noExponents = function (theNumber) {
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
        toFixed = function (number, p) {
            var precision = parseInt(p, 10),
                abs = Math.abs(parseFloat(number)),
                str = noExponents(abs),
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
        toFixedComma = function (number, precision) {
            var fixedNum = toFixed(number, (precision === undefined) ? 128 : precision);
            return numberWithCommas(fixedNum);
        },
        numberWithCommas = function (theNumber) {
            if (theNumber !== null && theNumber !== undefined) {
                if (theNumber.toString().indexOf(".") > 0) {
                    var arr = theNumber.toString().split(".");
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
            if (self.reportType() === "Totalizer") {
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
                        valueOptions = (!scheduled ? ENUMSTEMPLATESTEMPLATES[column.pointType] : undefined);
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
                        valueOptions = ENUMSTEMPLATESTEMPLATES[column.pointType];
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
            $control.attr("disabled", state);
        },
        checkForColumnCalculations = function () {
            var i,
                column,
                canCalculate = false;

            for (i = 1; i < self.listOfColumns().length; i++) {
                column = self.listOfColumns()[i];
                if (columnCanBeCalculated(column)) {
                    canCalculate = true;
                    break;
                }
            }
            self.calculatable(canCalculate);
        },
        checkForIncludeInChart = function () {
            var displayChartingHeader = false,
                activateCharting = false,
                allChecked = true;

            for (var i = 1; i < self.listOfColumns().length; i++) {
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
                $columnsGrid.find("th .yaxisChartGroupColumn").html("Group");
            }

            self.chartable(activateCharting);
            self.allChartCheckboxChecked(allChecked);

            if (!self.chartable()) {
                self.selectViewReportTabSubTab("gridData");
            }
        },
        updateListOfFilters = function (newArray) {
            self.listOfFilters([]);
            if (self.reportType() === "Property") {
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
        ajaxCall = function (type, input, url, callback) {
            self.activeRequestDataDrawn(false);
            $.ajax({
                url: url,
                type: type,
                contentType: "application/json",
                dataType: "json",
                data: (!!input ? JSON.stringify(input) : null)
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
        openPointSelectorForModalColumn = function () {
            var tempPoint,
                valueoptions,
                tempObject = getNewColumnTemplate(),
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
                    if (self.reportType() === "Totalizer") {
                        tempObject.valueList = getTotalizerValueList(tempObject.pointType);
                        tempObject.operator = tempObject.valueList[0].text;
                        tempObject.dataColumnName = tempObject.upi + " - " + tempObject.operator.toLowerCase();
                    } else {
                        if (self.reportType() === "History") {
                            tempObject.dataColumnName = tempObject.upi;
                        }
                        if (!!selectedPoint.Value.ValueOptions) {
                            tempObject.valueOptions = selectedPoint.Value.ValueOptions;
                        } else {
                            valueoptions = ENUMSTEMPLATESTEMPLATES[tempObject.pointType];
                            tempObject.valueOptions = valueoptions.Value.ValueOptions || "";
                        }
                    }
                    tempObject.canBeCharted = columnCanBeCharted(tempObject);
                    tempObject.yaxisGroup = "A";
                    updateColumnFromPointRefs(tempObject);  // sets AppIndex;
                    if (tempObject.AppIndex) {
                        formatThePoint(selectedPoint, getPointRefByAppIndex(tempObject.AppIndex));
                    }
                    self.currentColumnEdit(tempObject);
                },
                pointSelectedCallback = function (pointInfo) {
                    if (!!pointInfo) {
                        setPointInspectorParams(columnsFilter, pointInfo.filter);
                        ajaxCall("GET", null, getPointURL + pointInfo._id, setColumnPoint);
                    }
                };

            dtiUtility.showPointSelector(getPointInspectorParams(columnsFilter));
            dtiUtility.onPointSelect(pointSelectedCallback);
        },
        openPointSelectorForColumn = function (selectObjectIndex) {
            var valueoptions,
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
                    if (self.reportType() === "Totalizer") {
                        tempObject.valueList = getTotalizerValueList(tempObject.pointType);
                        tempObject.operator = tempObject.valueList[0].text;
                        tempObject.dataColumnName = tempObject.upi + " - " + tempObject.operator.toLowerCase();
                    } else {
                        if (self.reportType() === "History") {
                            tempObject.dataColumnName = tempObject.upi;
                        }
                        if (!!selectedPoint.Value && !!selectedPoint.Value.ValueOptions) {
                            tempObject.valueOptions = selectedPoint.Value.ValueOptions;
                        } else {
                            valueoptions = ENUMSTEMPLATESTEMPLATES[tempObject.pointType];
                            tempObject.valueOptions = valueoptions.Value.ValueOptions || "";
                        }
                    }
                    tempObject.canBeCharted = columnCanBeCharted(tempObject);
                    tempObject.yaxisGroup = "A";
                    updateColumnFromPointRefs(tempObject);  // sets AppIndex;
                    if (tempObject.AppIndex) {
                        formatThePoint(selectedPoint, getPointRefByAppIndex(tempObject.AppIndex));
                        updateListOfColumns(updatedList);
                    }
                },
                pointSelectedCallback = function (pointInfo) {
                    if (!!pointInfo) {
                        setPointInspectorParams(columnsFilter, pointInfo.filter);
                        ajaxCall("GET", null, getPointURL + pointInfo._id, setColumnPoint);
                    }
                };

            dtiUtility.showPointSelector(getPointInspectorParams(columnsFilter));
            dtiUtility.onPointSelect(pointSelectedCallback);
        },
        openPointSelectorForFilter = function (selectObjectIndex) {
            var updatedList = $.extend(true, [], self.listOfFilters()),
                tempObject = updatedList[selectObjectIndex],
                setFilterPoint = function (selectedPoint) {
                    newlyReferencedPoints.push(selectedPoint);
                    if (!!tempObject.AppIndex) {
                        delete tempObject.AppIndex;
                    }
                    tempObject.upi = selectedPoint._id;
                    tempObject.valueType = "UniquePID";
                    tempObject.value = selectedPoint.Name;
                    tempObject.pointType = selectedPoint["Point Type"].Value;
                    updateFilterFromPointRefs(tempObject);  // sets AppIndex;
                    if (tempObject.AppIndex) {
                        formatThePoint(selectedPoint, getPointRefByAppIndex(tempObject.AppIndex));
                        updateListOfFilters(updatedList);
                    }
                },
                pointSelectedCallback = function (pointInfo) {
                    if (!!pointInfo) {
                        setPointInspectorParams(filtersFilter, pointInfo.filter);
                        ajaxCall("GET", null, getPointURL + pointInfo._id, setFilterPoint);
                    }
                };

            dtiUtility.showPointSelector(getPointInspectorParams(filtersFilter));
            dtiUtility.onPointSelect(pointSelectedCallback);
        },
        openPointSelectorFilterMode = function () {
            if (!scheduled) {
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
                pointTypes: self.selectedPointTypesFilter()
            });
            dtiUtility.onPointSelect(pointSelectedCallback);
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
                timestamp = parseInt(time.replace(":", ""), 10);
                hour = ("00" + Math.floor(timestamp / 100)).slice(-2);
                min = ("00" + timestamp % 100).slice(-2);
                result = date.startOf("day");
                result = result.add(hour, "h");
                result = result.add(min, "m");
            }

            return result;
        },
        getAdjustedDatetimeUnix = function (date, time) {
            var result,
                validatedDate = (moment.isMoment(date) ? date : moment.unix(date));

            result = getAdjustedDatetimeMoment(validatedDate, time.toString());
            return result.unix();
        },
        initializeNewFilter = function (selectedItem, indexOfFilter) {
            var filter = self.listOfFilters()[indexOfFilter],
                prop = ENUMSTEMPLATESENUMS.Properties[selectedItem.name];

            filter.filterName = selectedItem.name;
            filter.condition = "$and";
            filter.operator = "EqualTo";
            filter.childLogic = false;
            filter.valueType = prop.valueType;
            filter.upi = 0;
            delete filter.AppIndex;
            filter.value = setDefaultFilterValue(filter.valueType);
            setValueList(selectedItem.name, selectedItem.name, indexOfFilter);
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
                    filter.bitStringEnumsArray = getBitStringEnumsArray(ENUMSTEMPLATESENUMS["Enums." + filter.filterName + " Bits"]);
                    break;
            }
            // self.listOfFilters.valueHasMutated();
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
            } else if ((self.reportType() === "Totalizer") || (self.reportType() === "History")) {
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
                    setValueList(currentFilter.filterName, currentFilter.filterName, result.length);
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
                    switch (self.reportType()) {
                        case "Property":
                            currentColumn.canBeCharted = columnCanBeCharted(currentColumn);
                            if (currentColumn.valueType === "BitString") {
                                currentColumn.bitstringEnums = (!!ENUMSTEMPLATESENUMS ? ENUMSTEMPLATESENUMS[currentColumn.colName + " Bits"] : "");
                            }
                            currentColumn.dataColumnName = currentColumn.colName;
                            break;
                        case "History":
                            currentColumn.valueList = "";
                            currentColumn.canBeCharted = columnCanBeCharted(currentColumn);
                            currentColumn.dataColumnName = (i === 0 && currentColumn.colName === "Date" ? currentColumn.colName : currentColumn.upi);
                            if (!Array.isArray(currentColumn.calculation)) {
                                currentColumn.calculation = [];
                            }
                            break;
                        case "Totalizer":
                            currentColumn.valueList = getTotalizerValueList(currentColumn.pointType);
                            currentColumn.canBeCharted = columnCanBeCharted(currentColumn);
                            currentColumn.dataColumnName = (i === 0 && currentColumn.colName === "Date" ? currentColumn.colName : currentColumn.upi + " - " + currentColumn.operator.toLowerCase());
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
        formatThePoint = function (selectedPoint, pRef) {
            var params = {
                    point: point,
                    oldPoint: point,
                    refPoint: selectedPoint,
                    property: pRef
                },
                callback = function (formattedPoint) {
                    point["Point Refs"] = formattedPoint["Point Refs"];
                };
            dtiUtility.getConfig("Update.formatPoint", [params], callback);
        },
        setValueList = function (property, pointType, index) {
            var result = [],
                i,
                len,
                setOptions = function (options) {
                    len = (options && options.length ? options.length : 0);

                    for (i = 0; i < len; i++) {
                        result.push({
                            value: options[i].name,
                            evalue: options[i].value
                        });
                    }
                    self.listOfFilters()[index].valueList = result;
                    // self.listOfFilters.valueHasMutated();
                    updateListOfFilters(self.listOfFilters());
                };

            dtiUtility.getConfig("Utility.pointTypes.getEnums", [property, pointType], setOptions);
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
        collectEnumProperties = function () {
            getPointPropertiesForFilters();
            getPointPropertiesForColumns();
        },
        getPointPropertiesForFilters = function () {
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
        getPointPropertiesForColumns = function () {
            var listOfKeysToRemove = ["Name"];

            columnsPropertyFields = filtersPropertyFields.filter(function (enumProp) {
                return ($.inArray(enumProp.name, listOfKeysToRemove) === -1);
            });
            self.listOfColumnPropertiesLength = columnsPropertyFields.length;
        },
        getKeyBasedOnEnum = function (obj, enumValue) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (obj[key].enum === parseInt(enumValue, 10)) {
                        return key;
                    }
                }
            }
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

            if (typeof self.selectedDuration() === "object") {
                self.selectedDuration().startTimeOffSet = self.durationStartTimeOffSet();
                self.selectedDuration().endTimeOffSet = self.durationEndTimeOffSet();

                if (self.selectedDuration().selectedRange === "Custom Range") {
                    self.startDate(getAdjustedDatetimeUnix(self.selectedDuration().startDate.unix(), self.durationStartTimeOffSet()));
                    self.endDate(getAdjustedDatetimeUnix(self.selectedDuration().endDate.unix(), self.durationEndTimeOffSet()));
                } else {
                    var dateRange = reportDateRanges(self.selectedDuration().selectedRange);
                    self.selectedDuration().startDate = getAdjustedDatetimeMoment(dateRange[0], self.durationStartTimeOffSet());
                    self.selectedDuration().endDate = getAdjustedDatetimeMoment(dateRange[1], self.durationEndTimeOffSet());
                    self.startDate(self.selectedDuration().startDate.unix());
                    self.endDate(self.selectedDuration().endDate.unix());
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
                        // console.log("filter  = " + JSON.stringify(filter));
                        if (!!filter.error) {
                            displayError(filter.error);
                            activeError = true;
                        }
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
                        $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                        $gridColumnConfigTable.find("th:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                        $gridColumnConfigTable.find("td:nth-child(" + (i + 1) + ")").addClass("red lighten-4");
                    } else {
                        $columnsGrid.find("tr:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                        $gridColumnConfigTable.find("th:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                        $gridColumnConfigTable.find("td:nth-child(" + (i + 1) + ")").removeClass("red lighten-4");
                        if (columns[i].upi > 0) {
                            upis.push({
                                upi: parseInt(columns[i].upi, 10),
                                op: (columns[i].operator).toLowerCase()
                            });
                        }
                    }
                }

                if (self.reportType() === "Totalizer" || self.reportType() === "History") {
                    configureSelectedDuration();
                } else {
                    if (filters.length > 0) {
                        formatFilters(filters);
                    }
                }

                if (!activeError) {
                    switch (self.reportType()) {
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
                            console.log(" - - - DEFAULT  buildReportDataRequest()");
                            break;
                    }

                    point["Report Config"].pointFilter = {
                        "name1" : self.name1Filter(),
                        "name2" : self.name2Filter(),
                        "name3" : self.name3Filter(),
                        "name4" : self.name4Filter(),
                        "selectedPointTypes" : self.selectedPointTypesFilter()
                    };
                    point["Report Config"].columns = columns;
                    point["Report Config"].filters = filters;

                    uuid = generateUUID();
                    activeDataRequests.push(uuid);

                    result = {
                        requestID: uuid,
                        upis: upis,
                        range: {
                            start: self.startDate(),
                            end: self.endDate()
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
                        break;
                    case 2:
                        $tabConfiguration.removeClass("active");
                        $tabConfiguration.hide();
                        $tabViewReport.addClass("active");
                        break;
                }
            }
        },
        initSocket = function (cb) {
            reportSocket = io.connect(window.location.origin);

            reportSocket.on("connect", function () {
                // console.log("SOCKETID:", reportSocket.id);
                if (cb) {
                    cb();
                }
            });

            reportSocket.on("returnReport", function (data) {
                if (data.err === null) {
                    //parseReturnedData(data.results);
                } else {
                    console.log("Error while retrieving data");
                }
            });
        },
        getScreenFields = function () {
            $direports = $(document).find(".direports");
            $editColumnModal = $direports.find("#editColumnModal");
            $viewColumnModal = $direports.find("#viewColumnModal");
            $globalEditColumnModal = $direports.find("#globalEditColumnModal");
            $tabs = $direports.find(".tabs");
            $tabConfiguration = $direports.find(".tabConfiguration");
            $configurationButton = $direports.find(".configurationButton");
            $tabViewReport = $direports.find(".tabViewReport");
            $viewReportButton = $direports.find(".viewReportButton");
            $viewReportNav = $tabViewReport.find(".viewReportNav");
            $dataTablePlaceHolder = $direports.find(".dataTablePlaceHolder");
            $rightPanel = $direports.find(".rightPanel");
            $spinnertext = $rightPanel.find(".spinnertext");
            $columnsGrid = $direports.find(".columnsGrid");
            $gridColumnConfig = $direports.find("#gridColumnConfig");
            $gridColumnConfigTable = $direports.find(".gridColumnConfigTable");
            $filtersGrid = $direports.find(".filtersGrid");
            $columnNames = $direports.find(".columnName");
            $filterByPoint = $direports.find("#filterByPoint");
            $saveReportButton = $direports.find(".saveReportButton");
            $pointSelectorIframe = $filterByPoint.find(".pointLookupFrame");
            $reportTitleInput = $direports.find(".reporttitle").find("input");
            $filtersTbody = $direports.find(".filtersGrid .sortableFilters");
            $columnsTbody = $columnsGrid.find(".sortablecolumns");
            $gridColumnsTbody = $gridColumnConfigTable.find(".sortablecolumns");
            $reportColumns = $direports.find("#reportColumns");
            $additionalFilters = $direports.find("#additionalFilters");
            $hiddenPlaceholder = $direports.find(".hiddenPlaceholder");
            $availableChartTypesChartTab = $direports.find(".availableChartTypes.chartTab");
            $reportChartDiv = $direports.find(".reportChartDiv");
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
        getColumnConfigWidthAndHeight = function (dataField, columnConfig) {
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
                                if (key.toLowerCase() !== "all" ) { // special case for Bitstring  "All" not displayed
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
        formatDataField = function (dataField, columnConfig) {
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
                            // console.log("dataField.PointInst is UNDEFINED");
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
                    columnKey = columnUPI;
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
                        columnKey = columnUPI;
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
                            switch (self.reportType()) {
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
                    name: "Total",
                    colorByPoint: true,
                    data: columnData
                });
            }
            return setYaxisValues(result);
        },
        adjustViewReportTabHeightWidth = function () {
            var bottomPadding = 10,
                adjustHeight,
                currentWindowHeight = window.innerHeight,
                $dataTablesScrollHead,
                $dataTablesScrollBody,
                $dataTablesScrollFoot,
                $dataTablesWrapper,
                $activePane = $tabViewReport.find(".tab-pane:visible");

            if ($activePane.attr("id") === "chartData") {
                $activePane.css("height", (window.innerHeight - 90));
                $activePane.css("width", (window.innerWidth - 130));
            } else if ($activePane.attr("id") === "gridData") {
                $dataTablesScrollHead = $tabViewReport.find(".dataTables_scrollHead");
                $dataTablesScrollBody = $tabViewReport.find(".dataTables_scrollBody");
                $dataTablesScrollFoot = $tabViewReport.find(".dataTables_scrollFoot");
                $dataTablesWrapper = $tabViewReport.find(".dataTables_wrapper");

                setDatatableInfoBar();
                adjustHeight = $dataTablesScrollBody.height() - (($tabViewReport.height() + bottomPadding) - currentWindowHeight);
                $dataTablesScrollHead.css("width", $dataTablesWrapper.width() - 17); // allow for scrolly in body
                $dataTablesScrollBody.css("height", adjustHeight);
                $dataTablesScrollBody.css("width", $dataTablesWrapper.width() - 17);
                $dataTablesScrollFoot.css("width", $dataTablesWrapper.width() - 17); // allow for scrolly in body
                $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;  // original way
                //$dataTablePlaceHolder.DataTable().columns.adjust();
            }
        },
        adjustConfigTabActivePaneHeight = function () {
            var $configPanes = $tabConfiguration.find(".tab-content div.tab-pane");
            $configPanes.css("height", (window.innerHeight - 150));
        },
        handleResize = function () {
            lastResize = new Date();
            setTimeout(function () {
                if (new Date() - lastResize >= resizeTimer) {
                    if (self.currentTab() === 2) {
                        if ($tabViewReport.find(".tab-pane:visible").attr("id") === "chartData") {
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
            point["Report Config"].pointFilter =  {
                "name1" : self.name1Filter(),
                "name2" : self.name2Filter(),
                "name3" : self.name3Filter(),
                "name4" : self.name4Filter(),
                "selectedPointTypes" : self.selectedPointTypesFilter()
            };
            point["Report Config"].selectedPageLength = self.selectedPageLength();
            point["Report Config"].selectedChartType = self.selectedChartType();
            point["Report Config"].reportTitle = self.reportDisplayTitle();
            switch (self.reportType()) {
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
            point.name1 = self.pointName1();
            point.name2 = self.pointName2();
            point.name3 = self.pointName3();
            point.name4 = self.pointName4();
            point._name1 = point.name1.toLowerCase();
            point._name2 = point.name2.toLowerCase();
            point._name3 = point.name3.toLowerCase();
            point._name4 = point.name4.toLowerCase();
            point.Name = point.name1 + "_" + point.name2 + "_" + point.name3 + "_" + point.name4;
            point.Name = point.Name.replace(/_\s*$/, "");
            point._Name = point.Name.toLowerCase();

            if (point._pStatus !== 0) {
                reportSocket.emit("addPoint", {
                    point: point
                });
            } else {
                reportSocket.emit("updatePoint", JSON.stringify({
                    "newPoint": point,
                    "oldPoint": originalPoint
                }));
            }
        },
        setReportEvents = function () {
            var intervals,
                calculations,
                entriesPerPage,
                chartTypes,
                precisionEventsSet = false,
                includeInChartEventsSet = false,
                calculateEventsSet = false;

            $(window).resize(function () {
                handleResize();
            });

            setTimeout(function () {
                if (!scheduled) {
                    $direports.find(".addColumnButton").on("click", function (e) {
                        var rowTemplate = getNewColumnTemplate(),
                            $newRow;
                        e.preventDefault();
                        e.stopPropagation();
                        if (self.listOfColumns.indexOf(rowTemplate) === -1) {
                            self.listOfColumns.push(rowTemplate);
                            updateListOfColumns(self.listOfColumns());
                            $newRow = $columnsTbody.find("tr:last");
                            $newRow.addClass("ui-sortable-handle");
                            $newRow.addClass("red lighten-4");
                            if (self.reportType() !== "Property") {
                                self.selectPointForColumn(rowTemplate, (self.listOfColumns().length - 1));
                            }
                        }
                        handleResize();
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

                    $additionalFilters.find('.reportRangePicker select').on('change', function(e) {
                        var selectedRange = self.reportDateRangeCollection()[e.target.selectedIndex],
                            dateRange;
                        self.selectedDuration().selectedRange = selectedRange;
                        if (self.selectedDuration().selectedRange !== "Custom Range") {
                            dateRange = reportDateRanges(self.selectedDuration().selectedRange);
                            self.selectedDuration().startDate = getAdjustedDatetimeMoment(dateRange[0], self.durationStartTimeOffSet());
                            self.selectedDuration().endDate = getAdjustedDatetimeMoment(dateRange[1], self.durationEndTimeOffSet());
                            self.startDate(self.selectedDuration().startDate.unix());
                            self.endDate(self.selectedDuration().endDate.unix());
                            $additionalFilters.find("#reportStartDate").pickadate('picker').set('select', self.startDate() * 1000);
                            $additionalFilters.find("#reportEndDate").pickadate('picker').set('select', self.endDate() * 1000);

                            // $additionalFilters.find("#startTimepicker").pickatime('picker').set('select', self.durationStartTimeOffSet());
                            // $additionalFilters.find("#endTimepicker").pickatime('picker').set('select', self.durationEndTimeOffSet());
                            self.selectedDuration.valueHasMutated();
                        }
                        // this.material_select();
                        //alert('Select Changed to ' + selectedRange);
                    });

                    $saveReportButton.on("click", function () {
                        var $screenMessages = $tabConfiguration.find(".screenMessages");
                        blockUI($tabConfiguration, true, " Saving Report...");
                        $screenMessages.find(".errorMessage").text(""); // clear messages
                        $screenMessages.find(".successMessage").text(""); // clear messages
                        saveReportConfig();
                        $(this).blur();
                    });

                    $direports.find(".runReportButton").on("click", function (e) {
                        $(this).focus();
                        e.preventDefault();
                        e.stopPropagation();
                        self.requestReportData();
                    });

                    $dataTablePlaceHolder.on("click", ".pointInstance", function () {
                        var data = {
                            upi: $(this).attr("upi"),
                            pointType: $(this).attr("pointType"),
                            pointName: $(this).text()
                        };

                        self.showPointReview(data);
                    });

                    $tabConfiguration.find(".toggleTab").on("shown.bs.tab", function () {
                        adjustConfigTabActivePaneHeight();
                    });

                    if (!!reportSocket) {
                        reportSocket.on("pointUpdated", function (data) {
                            var $messageHolder = $tabConfiguration.find(".screenMessages").find(".successMessage");
                            // console.log(" -  -  - reportSocket() 'pointUpdated' returned");
                            if (data.err === null || data.err === undefined) {
                                self.unSavedDesignChange(false);
                                $messageHolder.text("Report Saved");
                                setTimeout(function () {
                                    $messageHolder.text("");
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

                    $dataTablePlaceHolder.on("column-reorder.dt", function (event, settings, details) {
                        var columnsArray = $.extend(true, [], self.listOfColumns()),
                            swapColumnFrom = $.extend(true, {}, columnsArray[details.iFrom]);  // clone from field
                        columnsArray.splice(details.iFrom, 1);
                        columnsArray.splice(details.iTo, 0, swapColumnFrom);
                        updateListOfColumns(columnsArray);
                        $dataTablePlaceHolder.DataTable().draw("current");
                        console.log("moved column '" + details.from + "' to column '" + details.to + "'");
                        return true;
                    });

                    $dataTablePlaceHolder.on("length.dt", function (e, settings, len) {
                        self.selectedPageLength(len);
                        setTimeout(function () {
                            adjustViewReportTabHeightWidth();
                        }, 10);
                    });

                    $dataTablePlaceHolder.on("page.dt", function (e, settings) {
                        setTimeout(function () {
                            adjustViewReportTabHeightWidth();
                        }, 10);
                    });

                    $dataTablePlaceHolder.on("search.dt", function (e, settings) {
                        setTimeout(function () {
                            adjustViewReportTabHeightWidth();
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
                                    $calculateColumnDiv.on( "focusout", function (outEvent) {
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
                                    $precisionInputField.on( "focusout", function (outEvent) {
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
                                            globalSetAllColumnValues("precision", self.globalPrecisionValue());
                                        }
                                    });
                                }
                            }
                        }
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
                                    $includeInChartColumnDiv.on( "focusout", function (outEvent) {
                                        if (!$includeInChartColumnDiv.is(":focus")) {  // clicked outside of div
                                            toggleField(false);
                                            includeInChartEventsSet = false;
                                            $includeInChartColumnDiv.off("focusout");
                                        }
                                    });

                                    $includeInChartInputField.click(function (event) {
                                        if (event.target.checked !== undefined) {
                                            globalSetAllColumnValues("includeInChart", event.target.checked);
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
                        items: "tr",
                        forceHelperSize: true,
                        helper: "original",
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
                            updateListOfColumns(tempArray);
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
                                updateListOfColumns(tempArray);
                            }
                        },
                        scroll: true,
                        handle: ".handle"
                    });

                    console.log(" .... report events configured .... ");
                }
            }, 200);

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
                },
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
            self.listOfEntriesPerPage(entriesPerPage);
            self.listOfChartTypes(chartTypes);
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

                    if (data[columnConfig.colName] && data[columnConfig.colName].PointInst) {
                        var pointType = getKeyBasedOnEnum(ENUMSTEMPLATESENUMS["Point Types"], data[columnConfig.colName].PointType);
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

                    switch (self.reportType()) {
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
                    dom: (!scheduled ? "Blfrtip" : "lfrtip"),
                    buttons: (!scheduled ? [
                        {
                            extend: "collection",
                            text: "Export",
                            className: "btn blue-grey dropdown-button",
                            buttons: [
                                {
                                    extend: "copyHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>Copy</div>',
                                    key: {
                                        altKey: true,
                                        key: "1"
                                    }
                                },
                                {
                                    extend: "csvHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>CSV</div>',
                                    key: {
                                        altKey: true,
                                        key: "2"
                                    }
                                },
                                {
                                    extend: "excelHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>Excel</div>',
                                    key: {
                                        altKey: true,
                                        key: "3"
                                    }
                                },
                                {
                                    extend: "pdfHtml5",
                                    className: "white blue-grey-text center",
                                    text: '<div>PDF</div>',
                                    footer: true,
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
                        setDatatableInfoBar();
                    },
                    headerCallback: function (thead, data, start, end, display) {
                        var reportColumns = $.extend(true, [], self.listOfColumns()),
                            i,
                            colIndex = 0,
                            $theads;
                        for (i = 0; i < reportColumns.length; i++) {
                            if (!!reportColumns[i].calculation && reportColumns[i].calculation.length > 0) {
                                $(thead).find("th").eq(i).addClass("calculate");
                            }
                            $(thead).find("th").eq(i).addClass("text-center");
                            $(thead).find("th").eq(i).removeClass("small");
                        }

                        switch (self.reportType()) {
                            case "History":
                            case "Totalizer":
                                $theads = $(thead).find("th");
                                $theads.each(function (i, el) {
                                    $(el).attr("oncontextmenu", "reportsVM.showPointReviewViaIndex(" + i + "); return false;");
                                    $(el).attr("title", "Right mouse click to run PointInspector");
                                });
                                break;
                            case "Property":
                                $theads = $(thead).find("th:first");
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
                            columnIndexesToCalc = api.columns(".calculate")[0],
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
                            $tdFooter,
                            $footerTableDataCollection;

                        $footerTableDataCollection = $(tfoot).find("td");
                        $footerTableDataCollection.html(""); // clear existing footers
                        $footerTableDataCollection.attr("data-content", "&nbsp;"); // clear title data (mouse over)
                        $footerTableDataCollection.removeAttr("data-toggle");
                        $footerTableDataCollection.removeAttr("data-trigger");
                        $footerTableDataCollection.removeAttr("data-html");
                        $footerTableDataCollection.removeAttr("title");
                        $footerTableDataCollection.removeAttr("data-original-title");

                        for (i = 0; i < numberOfColumnsToCalculate; i++) {
                            footerText = "";
                            footerTitle = "";
                            pageFooterText = "";
                            columnIndex = columnIndexesToCalc[i];
                            columnConfig = reportColumns[columnIndex];
                            currentPageData = api.column(columnIndex, {page: "current"}).data();
                            allData = api.column(columnIndex).data();
                            sameDataSet = (currentPageData.length === allData.length);
                            calcs = getCalcForColumn(currentPageData, allData, columnConfig);
                            $tdFooter = $(tfoot).find("td[colindex='" + columnIndex + "']");
                            // TODO to Materialize $tdFooter.popover("destroy");

                            for (j = 0; j < columnConfig.calculation.length; j++) {
                                calc = calcs[j];

                                switch (self.reportType()) {
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
                                $tdFooter.attr("data-trigger", "hover");
                                $tdFooter.attr("data-html", "true");
                                $tdFooter.attr("title", "Entire column");
                                $tdFooter.attr("data-content", footerTitle);
                                //TODO  $tdFooter.popover({placement: "top"});
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
        setDatatableInfoBar = function () {
            var numberOfPages = $dataTablePlaceHolder.DataTable().page.info().pages,
                currentPageNumber = $dataTablePlaceHolder.DataTable().page.info().page + 1,
                $tablePagination = $tabViewReport.find(".dataTables_paginate"),
                $currentDateTimeDiv = $tablePagination.find(".reportDisplayFooter"),
                $pagination = $tablePagination.find(".pagination"),
                $paginate_buttons = $pagination.find("button"),
                $datatablesLength = $tabViewReport.find(".dataTables_length"),
                $datatablesLengthSelect = $datatablesLength.find("select");

            // $pagination.hide();
            if (numberOfPages <= 1) {
                $paginate_buttons = $paginate_buttons.not("li.active");
                $paginate_buttons.hide();
            } else {
                $paginate_buttons.removeClass("mdl-button");
                $paginate_buttons.addClass("btn blue-grey");
                $paginate_buttons.eq(currentPageNumber).addClass("lighten-2");
                // $pagination.show();
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
            $datatablesLengthSelect.show();
        },
        breakReportDataIntoPrintablePages = function () {
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
                maxRowsOnPDFPage = function () {
                    var answer;

                    if (self.reportType() === "Property") {
                        answer = 28;
                    } else {  // History & Totalizer
                        answer = 24;
                    }

                    return answer;
                },
                sortPropertyReportDataForExport = function () {
                    reportData.sort(function(a, b){
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
                buildPageData = function () {
                    var row,
                        currentPage = [],
                        headerArray = [],
                        rowArray = [],
                        dataRowIndex = dataIndex.rowStartIdx,
                        buildHeaderArray = function () {
                            if (columnsArray[0].colDisplayName !== undefined) {
                                if (columnRangeNeeded) {
                                    headerArray.push({Value: columnsArray[0].colDisplayName + " Range " + columnRange});
                                } else {
                                    headerArray.push({Value: columnsArray[0].colDisplayName});
                                }

                            }
                            for (j = dataIndex.columnStartIdx; j < dataIndex.columnStopIdx; j++) {  // add column headers
                                if (!!columnsArray[j] && columnsArray[j].dataColumnName !== undefined) {
                                    headerArray.push({Value: columnsArray[j].colDisplayName});
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
                        for (j = dataIndex.columnStartIdx; j < dataIndex.columnStopIdx; j++) {
                            if (!!columnsArray[j] && columnsArray[j].dataColumnName !== undefined) {
                                rowArray.push(row[columnsArray[j].dataColumnName]);
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
                        dataIndex.columnStartIdx = 1;
                        if (columnRangeNeeded) {
                            columnRange++;
                            columnRangeNeeded = false;  // displayed all data for current range
                        }
                    } else {
                        // console.log("------ ALL DONE ------  (I think)  ");
                    }

                    dataIndex.columnStopIdx = (columnsArray.length - 1);
                    dataIndex.rowStopIdx = (reportData.length - 1);
                },
                nextPageHasData = function () {
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

                            if (typeof cellData !== "string" ) {
                                wordsInCell = cellData.toString().split(" ");
                            } else {
                                wordsInCell = cellData.split(" ");
                            }

                            for (idx = 0; idx < wordsInCell.length; idx++) {
                                wordSizes.push(wordsInCell[idx].length);
                            }

                            if (colIndex !== undefined) { // specially formatted column
                                answer = getColumnConfigWidthAndHeight(cellData.toString(), columnsArray[colIndex]);
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
                dataIndex.columnStartIdx = 1;  // set indexes to full data set
                dataIndex.columnStopIdx = (columnsArray.length - 1);
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
        },
        getNewColumnTemplate = function () {
            return {
                colName: ((self.reportType() === "Totalizer") || (self.reportType() === "History") ? "Choose Point" : "Choose Property"),
                colDisplayName: "",
                valueType: "String",
                upi: 0,
                multiplier: 1,
                precision: 3,
                calculation: [],
                operator: "",
                pointType: "",
                units: "",
                includeInChart: false,
                yaxisGroup: "",
                valueList: [],
                canCalculate: false,
                canBeCharted: false,
                dataColumnName: ""
            };
        },
        renderReport = function () {
            if (reportData !== undefined && self.currentTab() === 2) {
                self.reportResultViewed(self.currentTab() === 2);
                blockUI($tabViewReport, false);
                if (scheduled) {
                    breakReportDataIntoPrintablePages();
                    if (!self.activeRequestDataDrawn()) {
                        if (scheduled && self.chartable() && scheduledIncludeChart) {
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
                    // $.fn.dataTable.tables({visible: true, api: true}).columns.adjust().draw;
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
        renderChart = function (formatForPrint, isScheduled) {
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
                    } else if (!!isScheduled) {
                        answer = 1050;
                    } else {
                        answer = $reportChartDiv.parent().parent().width();
                    }

                    return answer;
                },
                getChartHeight = function () {
                    var answer;

                    if (!!formatForPrint) {
                        answer = 650;
                    } else if (!!isScheduled) {
                        answer = 680;
                    } else {
                        answer = $reportChartDiv.parent().parent().height();
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

            chartType = getValueBasedOnText(self.listOfChartTypes(), self.selectedChartType());
            chartWidth = getChartWidth();
            chartHeight = getChartHeight();
            reportChartData = getOnlyChartData(reportData);

            if (!!reportChartData && !!reportChartData[0]) {
                if (reportChartData[0].data.length < maxDataRowsForChart) {
                    switch (self.reportType()) {
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
                                        type: "pie"
                                    },
                                    title: {
                                        text: chartTitle
                                    },
                                    subtitle: {
                                        text: subTitle
                                    },
                                    tooltip: {
                                        pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
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
                                    y: "value",
                                    x: "timeStamp",
                                    enumText: "enumText",
                                    //highlightMax: true,
                                    data: reportChartData,
                                    type: chartType,
                                    chart: {
                                        zoomType: "x"
                                    },
                                    tooltip: toolTip,
                                    //plotOptions: {
                                    //    series: {
                                    //        cursor: "pointer",
                                    //        point: {
                                    //            events: {
                                    //                click: function () {
                                    //                    alert("x: " + this.x + ", y: " + this.y);
                                    //                }
                                    //            }
                                    //        }
                                    //    }
                                    //},
                                    xAxis: {
                                        allowDecimals: false
                                    },
                                    legend: {
                                        layout: "vertical",
                                        align: "right",
                                        verticalAlign: "middle",
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

    self.reportType = ko.observable("");

    self.selectedPageLength = ko.observable("24");

    self.selectedChartType = ko.observable("Line");

    self.currentTimeStamp = "";

    self.startDate = ko.observable("");

    self.endDate = ko.observable("");

    self.yaxisGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    self.reportDisplayTitle = ko.observable("");

    self.canEdit = ko.observable(true);

    self.interval = ko.observable("Day");

    self.intervalValue = ko.observable(1);

    self.globalPrecisionValue = ko.observable(3);

    self.allChartCheckboxChecked = ko.observable(false);

    self.durationError = ko.observable(false);

    self.activeRequestDataDrawn = ko.observable(true);

    self.pointTypes = ko.observableArray([]);

    self.pointName1 = ko.observable("");

    self.pointName2 = ko.observable("");

    self.pointName3 = ko.observable("");

    self.pointName4 = ko.observable("");

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

    self.calculatable = ko.observable(false);

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

    self.currentColumnEdit = ko.observable(getNewColumnTemplate());

    self.scheduler = {
        parseCron: function (cron) {
            var name = ['minute', 'hour', 'date', 'month', 'dow'], // dow = day of week
                parsed = {
                    advanced: false,
                    cron: cron,
                    interval: null
                };

            dti.forEachArray(cron.split(' '), function (val, index) {
                var _val = [];

                if (!!~val.indexOf(',')) {
                    parsed.advanced = true;

                    dti.forEachArray(val.split(','), function (val, index) {
                        _val.push(val);
                    });
                } else {
                    _val.push(val);
                }
                parsed[name[index]] = _val;
            });

            if (!parsed.advanced) {
                if (parsed.dow[0] !== '*') {
                    parsed.interval = 'Weekly';
                } else if (parsed.date[0] !== '*') {
                    parsed.interval = 'Monthly';
                } else if (parsed.month[0] !== '*') {
                    parsed.interval = 'Yearly';
                } else {
                    parsed.interval = 'Daily';
                }
            }

            return parsed;
        },
        modal: {
            open: function (data) {
                var $modal = dti.getTemplate('#scheduleModalTemplate'),
                    availableDates = (function buildAvailableDates () {
                        var arr = [],
                            j = 0,
                            suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'],
                            suffix;

                        while (j++ < 31) {
                            suffix = (j > 9 && j < 14) ? 'th' : suffixes[j%10];
                            arr.push({
                                text: j + suffix,
                                value: j
                            });
                        }
                        return arr;
                    })(),
                    availableMonths = (function buildAvailableMonths () {
                        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                            arr = [];
                        
                        dti.forEachArray(months, function addMonth (month, index) {
                            arr.push({
                                text: month,
                                value: index + 1
                            });
                        });
                        return arr;
                    })(),
                    availableDaysOfWeek = (function buildAvailableDaysOfWeek () {
                        var dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                            arr = [];

                        dti.forEachArray(dow, function addDay (day, index) {
                            arr.push({
                                text: day,
                                value: index
                            });
                        });
                        return arr;
                    })(),
                    bindings = {
                        availableIntervals: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Advanced'],
                        availableDaysOfWeek: availableDaysOfWeek,
                        availableMonths: availableMonths,
                        availableDates: availableDates,
                        selectedInterval: ko.observable(),
                        selectedMonth: ko.observable(),
                        selectedDate: ko.observable(),
                        selectedDayOfWeek: ko.observable(),
                        selectedTime: ko.observable('00:00'),
                        saveScheduleEntry: function (data) {
                            self.scheduler.modal.close(data);
                        },
                        cancelScheduleEntry: function (data) {
                            self.scheduler.modal.close(data);
                        }
                    };

                if (data === 'new') {
                    bindings.isNew = true;
                    bindings.selectedInterval('Daily');
                } else {

                }

                ko.applyBindings(bindings, $modal[0]);

                $('body').append($modal);

                $modal.find('.dropdown-button').dropdown();
                $modal.find('select').material_select();
                $modal.find('#timepicker').pickatime({
                    autoclose: false,
                    twelvehour: true // TODO this should come from a system/user preference
                });

                $modal.openModal({
                    dismissible: false
                });
            },
            close: function (data) {
                var $modal = $('#scheduleModal');

                $modal.closeModal({
                    complete: function () {
                        ko.cleanNode($modal[0]);
                        $modal.find('select').material_select('destroy'); // Necessary?
                        $modal.remove();
                    }
                });
            }
        }
    };

    self.printChartDiv = function () {
        renderChart(true);
        setTimeout(function () {
            $reportChartDiv.printArea({
                mode: "iframe"
            });
            $reportChartDiv.parent().css("overflow", "auto");
        }, 1500);
    };

    self.deleteColumnRow = function (item) {
        self.listOfColumns.remove(item);
        updateListOfColumns(self.listOfColumns());
        return true;
    };

    self.deleteFilterRow = function (item) {
        self.listOfFilters.remove(item);
        updateListOfFilters(self.listOfFilters());
    };

    self.init = function (externalConfig) {
        var columns,
            reportConfig,
            initializeForMaterialize = function () {
                updateListOfColumns(self.listOfColumns());
                updateListOfFilters(self.listOfFilters());
                self.startDate.valueHasMutated();
                self.endDate.valueHasMutated();
                if (self.reportType() !== "Property" && !scheduled) {
                    $additionalFilters.find(".reportRangePicker select").material_select();
                    $additionalFilters.find("#reportStartDate").pickadate('picker').set('select', self.startDate() * 1000);
                    $additionalFilters.find("#reportEndDate").pickadate('picker').set('select', self.endDate() * 1000);
                    // $additionalFilters.find("#startTimepicker").pickatime('picker').set('select', self.durationStartTimeOffSet());
                    // $additionalFilters.find("#endTimepicker").pickatime('picker').set('select', self.durationEndTimeOffSet());
                }
                Materialize.updateTextFields();
                // too late  initKnockout();
            },
            setCurrentUser = function (results) {
                currentUser = results;
            },
            initComplete = function () {
                return (!!ENUMSTEMPLATESTEMPLATES && !!ENUMSTEMPLATESENUMS);
            },
            setGlobalEnumsTemplates = function (results) {
                ENUMSTEMPLATESTEMPLATES = results;
                if (initComplete()) {
                    postConfigInit();
                }
            },
            setGlobalEnums = function (results) {
                ENUMSTEMPLATESENUMS = results;
                if (initComplete()) {
                    postConfigInit();
                }
            },
            initGlobals = function () {
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
                dtiUtility.getConfig("Enums", null, setGlobalEnums);
                dtiUtility.getConfig("PointTemplates.Points", null, setGlobalEnumsTemplates);
            },
            postConfigInit = function () {
                if (!!point) {
                    self.canEdit(userCanEdit(point, permissionLevels.WRITE));
                    originalPoint = JSON.parse(JSON.stringify(point));
                    windowUpi = point._id; // required or pop-in/pop-out will not work
                    if (point["Report Config"] === undefined) {
                        point["Report Config"] = {};
                    }
                    self.reportType(point["Report Type"].Value);
                    reportConfig = (point["Report Config"] ? point["Report Config"] : undefined);
                    columns = (reportConfig ? reportConfig.columns : undefined);
                    self.pointName1(point.name1);
                    self.pointName2(point.name2);
                    self.pointName3(point.name3);
                    self.pointName4(point.name4);

                    if (!scheduled) {
                        initSocket();
                        dtiUtility.getConfig("Utility.pointTypes.getAllowedPointTypes", [], self.pointTypes);
                    }

                    if (columns) {
                        self.reportDisplayTitle((!!point["Report Config"].reportTitle ? point["Report Config"].reportTitle : point.Name.replace(/_/g, " ")));
                        self.listOfColumns(initColumns(reportConfig.columns));
                        self.listOfFilters(initFilters(reportConfig.filters));
                        if (!!reportConfig.pointFilter) {
                            self.name1Filter(reportConfig.pointFilter.name1);
                            self.name2Filter(reportConfig.pointFilter.name2);
                            self.name3Filter(reportConfig.pointFilter.name3);
                            self.name4Filter(reportConfig.pointFilter.name4);
                            self.selectedPointTypesFilter(reportConfig.pointFilter.selectedPointTypes);
                        }
                        self.selectedPageLength((reportConfig.selectedPageLength ? reportConfig.selectedPageLength : self.selectedPageLength()));
                        self.selectedChartType((reportConfig.selectedChartType ? reportConfig.selectedChartType : self.selectedChartType()));
                        switch (self.reportType()) {
                            case "History":
                            case "Totalizer":
                                if (!!point["Report Config"].duration.duration) { // have to set each manually because of computed relationship
                                    configureSelectedDuration(point["Report Config"].duration);
                                }
                                self.interval(point["Report Config"].interval.text);
                                self.intervalValue(point["Report Config"].interval.value);
                                break;
                            case "Property":
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
                        point["Report Config"].pointFilter = {
                            "name1" : self.name1Filter(),
                            "name2" : self.name2Filter(),
                            "name3" : self.name3Filter(),
                            "name4" : self.name4Filter(),
                            "selectedPointTypes" : self.selectedPointTypesFilter()
                        };
                        switch (self.reportType()) {
                            case "History":
                            case "Totalizer":
                                point["Report Config"].returnLimit = 2000;
                                self.listOfColumns.push(getNewColumnTemplate());
                                self.listOfColumns()[0].colName = "Date";
                                self.listOfColumns()[0].colDisplayName = "Date";
                                self.listOfColumns()[0].dataColumnName = "Date";
                                self.listOfColumns()[0].valueType = "DateTime";
                                self.listOfColumns()[0].AppIndex = -1;
                                configureSelectedDuration();
                                break;
                            case "Property":
                                collectEnumProperties();
                                point["Report Config"].returnLimit = 4000;
                                self.listOfColumns.push(getNewColumnTemplate());
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
                    }

                    $direports.find("#wrapper").show();
                    tabSwitch(1);

                    updateListOfFilters(self.listOfFilters());
                    setTimeout(function () {
                        $reportTitleInput.focus();
                    }, 1500);
                    setReportEvents();
                    checkForColumnCalculations();
                    checkForIncludeInChart();
                    adjustConfigTabActivePaneHeight();

                    if (scheduled) {
                        self.requestReportData();
                    } else if (!!externalConfig) {
                        if (self.reportType() === "History" || self.reportType() === "Totalizer") {
                            configureSelectedDuration(externalConfig);
                        }
                        self.requestReportData();
                    }

                    self.filterPropertiesSearchFilter(""); // computed props jolt
                    self.columnPropertiesSearchFilter(""); // computed props jolt
                    self.filterPropertiesSearchFilter.valueHasMutated();
                    self.columnPropertiesSearchFilter.valueHasMutated();
                    initializeForMaterialize();
                }

                window.setTimeout(function () {
                    $tabConfiguration.find('ul.tabs').tabs();
                    $tabViewReport.find('ul.tabs').tabs();
                }, 200);
            };

        getScreenFields();
        initKnockout();
        dtiUtility.getUser(setCurrentUser);

        exportEventSet = false;
        activeDataRequests = [];
        // initKnockout();
        if (!scheduled) {
            initGlobals();
        } else {
            postConfigInit();
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
            case 1:
                answer = "On";
                break;
            case false:
            case "False":
            case 0:
                answer = "Off";
                break;
            default:
                answer = val;
                break;
        }
        return answer;
    };

    self.selectPointForColumn = function (data, index) {
        var currentIndex = (typeof index === "function" ? index() : index),
            columnIndex = parseInt(currentIndex, 10);

        openPointSelectorForColumn(columnIndex);
    };

    self.selectPointForModalColumn = function () {
        openPointSelectorForModalColumn();
    };

    self.selectPointForFilter = function (data, index) {
        var currentIndex = (typeof index === "function" ? index() : index),
            columnIndex = parseInt(currentIndex, 10);

        openPointSelectorForFilter(columnIndex);
    };

    self.pointSelectorFilter = function () {
        openPointSelectorFilterMode();
    };

    self.showPointReviewViaIndex = function (index) {
        self.showPointReview(self.listOfColumns()[index]);
    };

    self.showPointReview = function (data) {
        var upi = parseInt(data.upi, 10);
        if (upi > 0) {
            if (data.pointType === "Display") {
                dtiUtility.openWindow("/displays/view/" + upi, "Display", "Display", "newwindow", upi);
            } else {
                dtiUtility.openWindow("/pointinspector/" + upi, "Point", "Point", "newwindow", upi);
            }
        }
    };

    self.reportConfiguration = function () {
        tabSwitch(1);
    };

    self.requestReportData = function () {
        if (!self.durationError()) {
            if (self.currentTab() !== 2) {
                // TODO to Materialize  $(".tableFooter > td").popover("destroy");
                var requestObj = buildReportDataRequest();
                if (!!requestObj) {
                    tabSwitch(2);
                    self.selectViewReportTabSubTab("gridData");
                    if (self.reportResultViewed()) {
                        self.activeDataRequest(true);
                        self.reportResultViewed(false);
                        if (!scheduled) {
                            configureDataTable(true, true);
                        }
                        reportData = undefined;
                        switch (self.reportType()) {
                            case "History":
                                ajaxCall("POST", requestObj, dataUrl + "/report/historyDataSearch", renderHistoryReport);
                                //reportSocket.emit("historyDataSearch", {options: requestObj});
                                break;
                            case "Totalizer":
                                ajaxCall("POST", requestObj, dataUrl + "/report/totalizerReport", renderTotalizerReport);
                                //reportSocket.emit("totalizerReport", {options: requestObj});
                                break;
                            case "Property":
                                ajaxCall("POST", requestObj, dataUrl + "/report/reportSearch", renderPropertyReport);
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
        $("html,body").stop().animate({
            scrollTop: 0
        }, 700);
    };

    self.requestChart = function (printFormat) {
        self.selectViewReportTabSubTab("chartData");
        $reportChartDiv.html("");
        renderChart(printFormat, scheduled);
    };

    self.focusChartView = function (element) {
        // self.selectViewReportTabSubTab("chartData");
        $reportChartDiv.html("");
        $reportChartDiv.parent().css("overflow", "");
        // $viewReportNav.find("chartData a").addClass("active");
        // $viewReportNav.find("gridData a").removeClass("active");
        renderChart(null, scheduled);
    };

    self.focusGridView = function (element) {
        // self.selectViewReportTabSubTab("gridData");
        // $viewReportNav.find("gridData a").addClass("active");
        // $viewReportNav.find("chartData a").removeClass("active");
        //adjustViewReportTabHeightWidth();
    };

    self.clearColumnPoint = function (indexOfColumn) {
        var tempArray = self.listOfColumns();
        tempArray[indexOfColumn] = getNewColumnTemplate();
        updateListOfColumns(tempArray);
        return true;
    };

    self.addNewColumn = function (element, indexOfColumn) {
        var newColumn = getNewColumnTemplate(),
            tempArray = self.listOfColumns();

        if (!!indexOfColumn) {
            tempArray.splice(indexOfColumn, 0, newColumn);
        } else {
            tempArray.push(newColumn);
        }

        updateListOfColumns(tempArray);
        if ($(element).hasClass("rightSideAddButton")) {
            $gridColumnConfig.stop().animate({
                scrollLeft: $gridColumnConfigTable.get(0).scrollWidth
            }, 600);
        }
        return true;
    };

    self.deleteReportColumn = function (indexOfColumn) {
        var tempArray = self.listOfColumns();
        tempArray.splice(indexOfColumn, 1);
        updateListOfColumns(tempArray);
        return true;
    };

    self.clearModalColumnPoint = function () {
        self.currentColumnEdit(getNewColumnTemplate());
    };

    self.editColumnSelectYaxisGroup = function (selectedGroup) {
        self.currentColumnEdit().yaxisGroup = selectedGroup;
        self.currentColumnEdit.valueHasMutated();
    };

    self.setCurrentColumnField = function (fieldName, newValue) {
        self.currentColumnEdit()[fieldName] = newValue;
        self.currentColumnEdit().dataColumnName = self.currentColumnEdit().upi + " - " + self.currentColumnEdit().operator.toLowerCase();
        self.currentColumnEdit.valueHasMutated();
    };

    self.setEditedColumnData = function () {
        var tempArray = self.listOfColumns();

        tempArray[self.currentColumnEditIndex()] = self.currentColumnEdit();
        updateListOfColumns(tempArray);
        $editColumnModal.closeModal();
        return true;
    };

    self.closeEditColumnModal = function () {
        $editColumnModal.closeModal();
    };

    self.clearColumnCalculation = function (indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn];
        column.calculation = [];
        updateListOfColumns(tempArray);
        return true;
    };

    self.calculationClick = function (element, calc, indexOfColumn) {
        var tempArray = self.listOfColumns(),
            column = tempArray[indexOfColumn],
            $ul = $(element).parent().parent(),
            $dropdown = $ul.siblings();

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

    self.globalCalculationClick = function (element, calc) {
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
        $globalEditColumnModal.closeModal();
        return true;
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
            prop = ENUMSTEMPLATESENUMS.Properties[selectedItem.name];
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
        return true;
    };

    self.selectPropertyFilter = function (element, indexOfFilter, selectedItem) {
        initializeNewFilter(selectedItem, indexOfFilter);
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
        return true;
    };

    self.selectNumberOfEntries = function (element, selectedItem) {
        for (var i = 0; i < self.listOfEntriesPerPage().length; i++) {
            if (self.listOfEntriesPerPage()[i].value === selectedItem) {
                self.selectedPageLength(self.listOfEntriesPerPage()[i].unit);
                self.designChanged(true);
                self.unSavedDesignChange(true);
                break;
            }
        }
    };

    self.selectChartType = function (element, selectedItem, drawChart) {
        for (var i = 0; i < self.listOfChartTypes().length; i++) {
            if (self.listOfChartTypes()[i].value === selectedItem) {
                self.selectedChartType(self.listOfChartTypes()[i].text);
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
        // self.listOfColumns()[indexOfColumn].includeInChart = element.checked;
        // return true;
    };

    self.globalColumnIncludeInChartClick = function () {
        self.globalColumnIncludeInChart(!self.globalColumnIncludeInChart());  // toggle
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

    self.setDateRange = function (element, selectedItem) {
        console.log("selectedItem = " + selectedItem);
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

    self.selectViewReportTabSubTab = function (subTabName) {
        $tabViewReport.find('ul.tabs').tabs('select_tab', subTabName);
    };

    self.materialDropdownClick = function (element) {
        var $element = $(element),
            forElementId = $element.attr("data-activates"),
            $availableAxisGroupsContainer = $element.parent(),
            $forElement = $availableAxisGroupsContainer.find("#" + forElementId);

        if ($forElement.hasClass("active")) {
            $element.removeClass("active");
            $forElement.removeClass("active");
            $forElement.css("display", "none");
            $forElement.css("opacity", 0);
            // $element.dropdown('close');
        } else {
            $element.addClass("active");
            $forElement.addClass("active");
            $forElement.css("display", "block");
            $forElement.css("opacity", 1);
            // $element.dropdown('open');
        }

        return true;
    };

    self.editColumn = function (column, index) {
        self.currentColumnEdit($.extend(true, {}, column));
        self.currentColumnEditIndex(index);
        $editColumnModal.openModal();
        return true;
    };

    self.globalEditColumnFields = function () {
        $globalEditColumnModal.openModal();
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
    if (window.top === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        window.setTimeout(function () {
            reportsVM = new reportsViewModel();
            reportsVM.init(extConfig);
            ko.applyBindings(reportsVM);
        }, 150);
    }
}

$(function () {
    if (!window.location.href.match("pause")) {
        applyBindings();
    }
});
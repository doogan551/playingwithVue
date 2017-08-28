"use strict";
var dti = {
    $: function (fn) {
        $(function delayFn() {
            setTimeout(function runInit() {
                fn();
            }, 1);
        });
    }
};

var initKnockout = function () {
    ko.bindingHandlers.dtiLogsMaterializePickadate = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).pickadate();
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };

    ko.bindingHandlers.dtiLogsMaterializePickatime = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).pickatime();
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };
};

var ActivityLogsManager = function (conf) {
    let self = this,
        sessionId = store.get('sessionId'),
        storeKey = 'activityLogs_',
        resizeTimer = 100,
        lastResize = null,
        filterDataKey = "activityLogFilters" + window.location.search.slice(1),
        $dateFrom = $("#dateFrom"),
        $timeFrom = $("#timeFrom"),
        $dateTo = $("#dateTo"),
        $timeTo = $("#timeTo"),
        $activitylogBody = $(".activitylogBody"),
        $activitylogContainer = $activitylogBody.find("#activitylogContainer"),
        $activityLogs = $activitylogBody.find(".activityLogs"),
        $userFilterModal = $activitylogBody.find("#userFilterModal"),
        $dateTimeFilterModal = $activitylogBody.find("#dateTimeFilterModal"),
        PAGE_SIZE = 200,
        COMPUTED_DELAY = 10,
        computedThrottle = {
            rateLimit: {
                timeout: COMPUTED_DELAY,
                method: "notifyWhenChangesStop"
            }
        },
        nSelectedRowsOnPage = 0,
        numberPointTypes,
        currentUser,
        listOfUsers = ko.observableArray([]),
        listOfFilteredUsers = ko.observableArray([]),
        gotoPageOne = true,
        pointAttribsFilterObj = {
            path: [],
            terms: "",
            pointTypes: []
        },
        availablePointTypes = {},
        _log = function () {
            console.log.apply(console, arguments);
        },
        setCurrentUser = function (results) {
            currentUser = results;
            storeKey += currentUser;
        },
        buildActivityLogRequestObject = function (activityLog, reqObj) {
            let l_startDate = 0,
                l_endDate = 0,
                i,
                nPages = activityLog.numberOfPages.peek();

            // Paging
            reqObj.itemsPerPage = PAGE_SIZE;
            reqObj.sort = self.sortAscending() ? 'asc' : 'desc';
            reqObj.currentPage = gotoPageOne ? 1 : self.pageNumber();
            reqObj.usernames = self.getFilteredUsers();

            reqObj.terms = self.terms();

            if (availablePointTypes) {
                if (self.pointTypes().length > 0 && self.pointTypes().length !== numberPointTypes.length) {
                    reqObj.pointTypes = [];
                    for (i = 0; i < self.pointTypes().length; i++) {
                        reqObj.pointTypes.push(availablePointTypes[self.pointTypes()[i]]);
                    }
                }
            }

            // Date-time filtering
            if (self.dateFrom()) {
                l_startDate = Date.parse(self.dateFrom() + ' ' + (self.timeFrom() || "00:00")).getTime();
                l_startDate = l_startDate === null ? 0 : l_startDate;
            }

            if (self.dateTo()) {
                l_endDate = Date.parse(self.dateTo() + ' ' + (self.timeTo() || "00:00")).getTime();
                l_endDate = l_endDate === null ? 0 : l_endDate;
            }

            reqObj.startDate = l_startDate;
            reqObj.endDate = l_endDate;
        },
        pointAttribsFilterCallback = function (filter) {
            let arrayOfPointTypes = [],
                pointType;

            self.terms(filter.terms);

            if (!!filter.pointTypes && filter.pointTypes.length !== numberPointTypes) {
                self.pointTypes(filter.pointTypes);
            } else {
                for (pointType in availablePointTypes) {
                    arrayOfPointTypes.push(pointType);
                }
                self.pointTypes(arrayOfPointTypes);
            }
            self.applyPointAttribsFilter();
        },
        getPrettyDate = function (timestamp, forceDateString) {
            let theDate = new Date(timestamp),
                theDateClone = theDate.clone().clearTime(),
                today = Date.today(),
                str = '';

            forceDateString = forceDateString || false;

            if (!forceDateString && theDateClone.equals(today)) {
                str = 'Today';
            } else if (!forceDateString && theDateClone.equals(today.addDays(-1))) {
                str = 'Yesterday';
            } else {
                str = theDate.toString('M/d/yyyy');
            }
            return str;
        },
        getPrettyTime = function (timestamp) {
            let theDate = new Date(timestamp);
            return theDate.toString('HH:mm:ss');
        },
        formatActivityLogEntry = function (activityLog) {
            let selected = false;

            activityLog.isSelected = ko.observable(selected);
            activityLog.prettyDate = getPrettyDate(activityLog.timestamp);
            activityLog.prettyTime = getPrettyTime(activityLog.timestamp);
            activityLog.Name = (dti && dti.utility ? dti.utility.getConfig("Utility.getPointName", [activityLog.path]) : window.getConfig("Utility.getPointName", [activityLog.path]));
        },
        updateNumberOfPages = function (count, activityLogTable) {
            let sortAsc = self.sortAscending(),
                curPage = self.pageNumber(),
                curNumberPages = activityLogTable.numberOfPages(),
                newNumberPages = parseInt(count / PAGE_SIZE, 10);

            if (count % PAGE_SIZE) {
                newNumberPages++;
            }
            if (newNumberPages === 0) {
                newNumberPages = 1;
            }

            activityLogTable.numberOfPages(newNumberPages);
        },
        processActivityLogs = function (theLogData) {
            let i, page;

            if (theLogData.logs !== undefined) {
                //console.log('   activityLogs from server.  logs.length = ', theLogData.logs.length);
                for (i = 0; i < theLogData.logs.length; i += 1) {
                    formatActivityLogEntry(theLogData.logs[i]);
                }
                self.activityLogs().list(theLogData.logs);
                self.activityLogs().count(theLogData.count);
                updateNumberOfPages(self.activityLogs().count(), self.activityLogs());
                if (gotoPageOne) {
                    self.pageNumber(1);
                    gotoPageOne = false;
                }
            } else {
                console.log(' theLogData.logs = undefined');
            }
            self.activityLogs().gettingData(false);
        },
        setAvailablePointTypes = function (results) {
            let i;
            if (results) {
                for (i = 0; i < results.length; i++) {
                    availablePointTypes[results[i].key] = results[i].enum;
                }
            }
            numberPointTypes = results.length;
        },
        getStoreData = function () {
            let storeData = store.get(storeKey) || {};

            if (storeData.hasOwnProperty('sessionId') && storeData.sessionId !== sessionId) {
                store.remove(storeKey);
                storeData = {};
            }
            return storeData;
        },
        getJsUsers = function () {
            let i,
                filteredUsers = self.filteredUsers(),
                cleanedUsers = [];

            for (i = 0; i < filteredUsers.length; i++) {
                cleanedUsers.push(ko.toJS(filteredUsers[i]));
            }

            return cleanedUsers;
        },
        getStoredUsers = function () {
            let i,
                storeData = getStoreData(),
                arrayOfStoredFilters,
                usernamesToFilterOn = [];

            if (storeData.hasOwnProperty(filterDataKey)) {
                arrayOfStoredFilters = storeData[filterDataKey];
            }

            if (arrayOfStoredFilters !== undefined) {
                for (i = 0; i < arrayOfStoredFilters.selectedUsers.length; i += 1) {
                    usernamesToFilterOn.push(arrayOfStoredFilters.selectedUsers[i]);
                }
            }

            return usernamesToFilterOn;
        },
        parseListOfUsers = function (users) {
            let i,
                indexOfUser,
                usernamesToFilterOn = getStoredUsers(),
                clonedUsers = $.extend(true, [], users);

            //console.log(' - - - activityLogs processUsers() ==> User names from server.  Users.length ', userData.Users.length);
            for (i = 0; i < clonedUsers.length; i += 1) {
                if (usernamesToFilterOn.length > 0) {
                    indexOfUser = usernamesToFilterOn.indexOf(clonedUsers[i].username);
                    clonedUsers[i].isSelected = ko.observable(indexOfUser !== -1 ? true : false);
                } else {
                    clonedUsers[i].isSelected = ko.observable(false);
                }
            }

            return clonedUsers;
        },
        processUsers = function (userData) {
            if (userData.Users !== undefined) {
                userData.Users.sort(function (a, b) {
                    return (a.username.toLowerCase() > b.username.toLowerCase()) ? 1 : -1;
                });

                listOfFilteredUsers(parseListOfUsers(userData.Users));
                listOfUsers(getJsUsers());
            } else {
                listOfUsers([]);
                listOfFilteredUsers([]);
                console.log(' - - - activityLogs processUsers() ==> Unable to get list of Users from server.  Users.length ', new Date());
            }

            // once User list has loaded then load page with Initial logs with any filters already set.
            self.refreshActivityLogsData();
        },
        ajaxPOST = function (input, url, callback) {
            //console.log(url, "input = " + JSON.stringify(input));
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(input),
                success: function (returnData) {
                    //console.log(url, "returnData = " + JSON.stringify(returnData));
                    return callback(returnData);
                }
            });
        },
        requestUsers = function () {
            ajaxPOST(undefined, '/api/security/users/getallusers', processUsers);
        },
        requestActivityLogs = function (activityLogTable) {
            let name = activityLogTable.name,
                date = new Date(),
                uniqueID = date.getTime(),
                reqObj = {};

            activityLogTable.refresh(false);
            activityLogTable.gettingData(true);

            buildActivityLogRequestObject(activityLogTable, reqObj);

            reqObj.reqID = activityLogTable.reqID = uniqueID;

            // console.log('Requesting ' + name + ' activityLogs from server.', reqObj, date);
            ajaxPOST(reqObj, '/api/activitylogs/get', processActivityLogs);
        },
        selectActivityLog = function (ActivityLog) {
            ActivityLog.isSelected(true);
            self.selectedRows.push(ActivityLog);
        },
        deSelectActivityLog = function (ActivityLog) {
            if (--nSelectedRowsOnPage < 0) {
                nSelectedRowsOnPage = 0;
            }

            ActivityLog.isSelected(false);
            self.selectedRows.remove(function (row) {
                return row._id === ActivityLog._id;
            });
        },
        storeFilterData = function () {
            let filterValues,
                storeData = store.get(storeKey);

            if (!storeData) {
                storeData = {};
                storeData.sessionId = sessionId;
            }

            if (storeData[filterDataKey] === undefined) {
                storeData[filterDataKey] = {};
            }

            listOfUsers(getJsUsers());  // get current selected users

            filterValues = {
                sortAscending: self.sortAscending(),
                pageNumber: self.pageNumber(),
                dateFrom: self.dateFrom(),
                timeFrom: self.timeFrom(),
                dateTo: self.dateTo(),
                timeTo: self.timeTo(),

                terms: self.terms(),
                pointTypes: self.pointTypes(),

                selectedUsers: self.getFilteredUsers(),
                gotoPageOne: gotoPageOne
            };

            storeData[filterDataKey] = ko.toJS(filterValues);
            store.set(storeKey, storeData);
        },
        initFilterValues = function () {
            let i,
                data,
                storeData = getStoreData();

            if (storeData.hasOwnProperty(filterDataKey)) {
                data = storeData[filterDataKey];
                self.sortAscending(data.sortAscending);
                self.pageNumber(data.pageNumber);
                self.dateFrom(data.dateFrom);
                self.dtFilterPlaceholder.dateFrom(data.dateFrom);
                self.timeFrom(data.timeFrom);
                self.dtFilterPlaceholder.timeFrom(data.timeFrom);
                self.dateTo(data.dateTo);
                self.dtFilterPlaceholder.dateTo(data.dateTo);
                self.timeTo(data.timeTo);
                self.dtFilterPlaceholder.timeTo(data.timeTo);

                self.path(data.path);
                pointAttribsFilterObj.path = data.path;

                self.terms(data.terms);
                pointAttribsFilterObj.terms = data.terms;

                for (i in data.pointTypes) {
                    self.pointTypes().push(data.pointTypes[i]);
                }

                pointAttribsFilterObj.pointTypes = self.pointTypes();
                gotoPageOne = data.gotoPageOne;
            }
        },
        adjustActivityLogTableSize = function () {
            $activityLogs.css("width", (window.innerWidth - 40));
            $activityLogs.css("height", (window.innerHeight - 135));
        },
        handleResize = function () {
            lastResize = new Date();
            setTimeout(function () {
                if (new Date() - lastResize >= resizeTimer) {
                    adjustActivityLogTableSize();
                }
            }, resizeTimer);
        },
        activityLogTables = {
            name: 'All',
            list: ko.observableArray([]),
            count: ko.observable(0),
            gettingData: ko.observable(false),
            refresh: ko.observable(false),
            numberOfPages: ko.observable(1),
            timeout: ko.observable(false),
            timeoutID: 0,
            reqID: 0,
            view: '',
            stickyScrollBar: false
        };

    self.refreshActivityLogsData = function () {
        // _log('self.refreshActivityLogsData() called........');
        let localActivityLogTable = self.activityLogs();
        requestActivityLogs(localActivityLogTable);
    };
    self.refreshUsersData = function () {
        //_log('self.refreshUsersData() called........');
        requestUsers();
    };
    self.showPointReview = function (element, theData) {
        let upi = parseInt(theData.upi, 10),
            originalElementText;
        if (upi > 0) {
            dtiUtility.openWindow({
                upi: upi,
                pointType: theData.pointType
            });
        } else {
            originalElementText = element.text;
            $(element).stop().fadeOut("4000", function () {
                element.text = " * Point not found *";
                $(element).css("background", "#F26060").fadeIn(500);
            });
            setTimeout(function () {
                $(element).stop().fadeOut("500", function () {
                    $(element).css("background", "#FFFFFF").fadeIn(500);
                    element.text = originalElementText;
                });
            }, 3000);
        }
    };
    self.selectAll = function () {
        let localActivityLogs = self.activityLogs().list(),
            n = localActivityLogs.length,
            len = (n > 200) ? 200 : n,
            localActivityLog,
            i;

        for (i = 0; i < len; i++) {
            localActivityLog = localActivityLogs[i];
            if (!localActivityLog.isSelected()) {
                selectActivityLog(localActivityLog);
            }
        }
        nSelectedRowsOnPage = len;

        return true;
    };
    self.selectAllNames = function () {
        let filterUsers = self.filteredUsers(),
            len = filterUsers.length,
            localFilterUsers,
            i;

        for (i = 0; i < len; i++) {
            localFilterUsers = filterUsers[i];
            if (!localFilterUsers.isSelected()) {
                localFilterUsers.isSelected(true);
            }
        }
        self.dirtyUsernameFilter(true);
        return true;
    };
    self.deselectAll = function () {
        let localActivityLogs = self.activityLogs().list(),
            len = localActivityLogs.length,
            i;

        for (i = 0; i < len; i++) {
            localActivityLogs[i].isSelected(false);
        }
        self.selectedRows.removeAll();
        nSelectedRowsOnPage = 0;
    };
    self.deselectAllNames = function () {
        let filterUsers = self.filteredUsers(),
            len = filterUsers.length,
            i;

        for (i = 0; i < len; i++) {
            filterUsers[i].isSelected(false);
        }
        self.dirtyUsernameFilter(true);
    };
    self.selectNone = function () {
        let localActivityLogs = self.activityLogs().list(),
            n = localActivityLogs.length,
            len = (n > PAGE_SIZE) ? PAGE_SIZE : n,
            localActivityLog,
            i;

        for (i = 0; i < len; i += 1) {
            localActivityLog = localActivityLogs[i];
            if (localActivityLog.isSelected()) {
                deSelectActivityLog(localActivityLog);
            }
        }
    };
    self.resetFilters = function () {
        self.clearUsernameFilter();
        self.clearPointAttribsFilter();
        self.clearDateTimeFilter(true);
    };
    self.clearUsernameFilter = function (refreshTheData) {
        self.deselectAllNames();
        if (refreshTheData) {
            listOfUsers(getJsUsers());
            storeFilterData();
            self.refreshActivityLogsData();
        }
    };
    self.clearPointAttribsFilter = function (refreshTheData) {
        self.path([]);
        pointAttribsFilterObj.path = [];
        self.terms("");
        pointAttribsFilterObj.terms = "";
        self.pointTypes([]);
        pointAttribsFilterObj.pointTypes = [];

        if (refreshTheData) {
            storeFilterData();
            self.refreshActivityLogsData();
        }
    };
    self.clearDateTimeFilter = function (refreshTheData) {
        self.dateFrom(null);
        self.dtFilterPlaceholder.dateFrom("");
        $dateFrom.val('').datepicker('update');
        self.timeFrom(null);
        self.dtFilterPlaceholder.timeFrom("");
        $timeFrom.val('').timepicker('setTime', null);
        self.dateTo(null);
        self.dtFilterPlaceholder.dateTo("");
        $dateTo.val('').datepicker('update');
        self.timeTo(null);
        self.dtFilterPlaceholder.timeTo("");
        $timeTo.val('').timepicker('setTime', null);
        if (refreshTheData) {
            storeFilterData();
            self.refreshActivityLogsData();
        }
    };
    self.applyPointAttribsFilter = function () {
        gotoPageOne = true;
        storeFilterData();
        self.refreshActivityLogsData();
    };
    self.applyUserNameFilter = function () {
        gotoPageOne = true;
        listOfUsers(getJsUsers());
        storeFilterData();
        $userFilterModal.closeModal();
        self.refreshActivityLogsData();
    };
    self.cancelUserNameFilter = function () {
        let i,
            filteredUsers = self.filteredUsers(),
            indexOfUser,
            usernamesToFilterOn = getStoredUsers();

        for (i = 0; i < filteredUsers.length; i += 1) {
            if (usernamesToFilterOn.length > 0) {
                indexOfUser = usernamesToFilterOn.indexOf(filteredUsers[i].username);
                filteredUsers[i].isSelected(indexOfUser !== -1 ? true : false);
            } else {
                filteredUsers[i].isSelected(false);
            }
        }

        $userFilterModal.closeModal();
    };
    self.cancelPointAttribsFilter = function () {
        let i,
            data,
            storeData = getStoreData();

        if (storeData.hasOwnProperty(filterDataKey)) {
            data = storeData[filterDataKey];

            self.path(data.path);
            pointAttribsFilterObj.path = data.path;

            self.terms(data.terms);
            pointAttribsFilterObj.terms = data.terms;

            for (i in data.pointTypes) {
                self.pointTypes().push(data.pointTypes[i]);
            }

            pointAttribsFilterObj.pointTypes = self.pointTypes();
        }
    };
    self.showPointFilter = function () {
        let arrayOfPointTypes = [],
            pointType;

        if (self.pointTypes().length === 0) {
            for (pointType in availablePointTypes) {
                arrayOfPointTypes.push(pointType);
            }
            self.pointTypes(arrayOfPointTypes);
        }

        let parameters = {
            path: [],
            restrictPointTypes: (self.pointTypes().length < availablePointTypes.length),
            // callback: pointAttribsFilterCallback,
            terms: self.terms(),
            pointTypes: self.pointTypes()
        };

        dtiUtility.showPointFilter(parameters);
        dtiUtility.onPointSelect(pointAttribsFilterCallback);
    };
    self.applyDateTimeFilter = function () {
        self.dateFrom(self.dtFilterPlaceholder.dateFrom());
        self.timeFrom(self.dtFilterPlaceholder.timeFrom());
        self.dateTo(self.dtFilterPlaceholder.dateTo());
        self.timeTo(self.dtFilterPlaceholder.timeTo());
        gotoPageOne = true;
        storeFilterData();
        $dateTimeFilterModal.closeModal();
        self.refreshActivityLogsData();
    };
    self.cancelDateTimeFilter = function () {
        self.dtFilterPlaceholder.dateFrom(self.dateFrom());
        $dateFrom.val(self.dtFilterPlaceholder.dateFrom()).datepicker('setDate', self.dtFilterPlaceholder.dateFrom());
        self.dtFilterPlaceholder.timeFrom(self.timeFrom());
        $timeFrom.val(self.dtFilterPlaceholder.timeFrom).timepicker('setTime', self.dtFilterPlaceholder.timeFrom());
        self.dtFilterPlaceholder.dateTo(self.dateTo());
        $dateTo.val(self.dtFilterPlaceholder.dateTo).datepicker('setDate', self.dtFilterPlaceholder.dateFrom());
        self.dtFilterPlaceholder.timeTo(self.timeTo());
        $timeTo.val(self.dtFilterPlaceholder.timeTo).timepicker('setTime', self.dtFilterPlaceholder.timeTo());
        $dateTimeFilterModal.closeModal();
    };
    self.toggleDateTimeSort = function () {
        let currentSort = self.sortAscending();
        self.sortAscending(!currentSort);
        storeFilterData();
        self.refreshActivityLogsData();
    };
    self.editDateTimeFilter = () => {
        $dateTimeFilterModal.openModal();
        // setTimeout(function () {
        //     Materialize.updateTextFields();
        // }, 200);
        return true;
    };

    self.changePage = function (modifier) {
        let activityLogs = self.activityLogs(),
            newPage;

        if (modifier === 'begin') {
            modifier = 1 - self.pageNumber();
        } else if (modifier === 'end') {
            modifier = activityLogs.numberOfPages() - self.pageNumber();
        }

        newPage = self.pageNumber() + modifier;
        self.pageNumber(newPage);

        storeFilterData();
        activityLogs.refresh(true);
        self.refreshActivityLogsData();
    };
    self.getFilteredUsers = function () {
        let i,
            users = self.users(),
            usernamesToFilterOn = [];

        for (i = 0; i < users.length; i++) {
            if (users[i].isSelected) {
                usernamesToFilterOn.push(users[i].username);
            }
        }

        return usernamesToFilterOn;
    };
    self.userFilterClick = function (element, indexOfUsers) {
        listOfFilteredUsers()[indexOfUsers].isSelected(element.checked);
        self.dirtyUsernameFilter(true);
        return true;
    };
    self.printLogs = function () {
        let hostAndProtocol = window.location.protocol + "//" + window.location.host,
            $pages,
            pagesDisplayCss;

        $activitylogContainer.prepend('<link rel="stylesheet" href="' + hostAndProtocol + '/css/activityLogs/printActivityLogs.css" type="text/css" />');
        $activityLogs.css('overflow', 'visible');
        $pages = $activitylogContainer.find(".pages");
        pagesDisplayCss = $pages.css('display');
        $pages.css('display', 'none');

        $activitylogContainer.printArea({
            mode: 'iframe'
        });

        $activitylogContainer.find("link[rel=stylesheet]").remove();
        $pages.css('display', pagesDisplayCss);
        $activityLogs.css('overflow', 'auto');
    };
    self.editUserFilter = () => {
        $userFilterModal.openModal();
        setTimeout(function () {
            Materialize.updateTextFields();
        }, 200);
        return true;
    };
    self.init = () => {
        initKnockout();
        initFilterValues();
        adjustActivityLogTableSize();
        $(window).resize(function () {
            handleResize();
        });
    };

    self.dtFilterPlaceholder = {
        dateFrom: ko.observable(""),
        timeFrom: ko.observable(""),
        dateTo: ko.observable(""),
        timeTo: ko.observable("")
    };
    self.sortAscending = ko.observable(false);
    self.pageNumber = ko.observable(1);
    self.dateFrom = ko.observable();
    self.timeFrom = ko.observable();
    self.dateTo = ko.observable();
    self.timeTo = ko.observable();
    self.path = ko.observableArray([]);
    self.terms = ko.observable("");
    self.dirtyUsernameFilter = ko.observable(false);
    self.pointTypes = ko.observableArray([]);
    self.selectedRows = ko.observableArray([]);

    self.activityLogs = ko.computed(function () {
        return activityLogTables;
    }, self);
    self.activityLogsForPageSize = ko.computed(function () {
        return self.activityLogs().list().slice(0, PAGE_SIZE);
    }, self);
    self.users = ko.computed(function () {
        return listOfUsers();
    }, self);
    self.filteredUsers = ko.computed(function () {
        return listOfFilteredUsers();
    }, self);
    self.allSelected = ko.computed(function () {
        let i,
            activityLogs = self.activityLogs().list(),
            n = activityLogs.length,
            len = (n > 200) ? 200 : n;

        if (len === 0) {
            return false;
        } else {
            for (i = 0; i < len; i += 1) {
                if (activityLogs[i].isSelected() === false) {
                    return false;
                }
            }
        }

        return true;
    }, self).extend(computedThrottle);
    self.allSelectedNames = ko.computed(function () {
        let i,
            filterUsers = self.filteredUsers(),
            len = filterUsers.length;

        if (len === 0) {
            return false;
        } else {
            for (i = 0; i < len; i++) {
                if (filterUsers[i].isSelected() === false) {
                    return false;
                }
            }
        }

        return true;
    }, self).extend(computedThrottle);
    self.checkAll = ko.computed({
        read: function () {
            return self.allSelected();
        },
        write: function (value) {
            return value ? self.selectAll() : self.deselectAll();
        }
    });
    self.checkAllNames = ko.computed({
        read: function () {
            return self.allSelectedNames();
        },
        write: function (value) {
            return value ? self.selectAllNames() : self.deselectAllNames();
        }
    });
    self.pointTypeNameFilterIsSet = ko.computed(function () {
        let localPointTypes = self.pointTypes();

        if (self.terms() !== "") {
            return true;
        }

        if (localPointTypes.length > 0 && localPointTypes.length !== numberPointTypes) {
            return true;
        }

        return false;
    });
    self.datetimeFilterIsSet = ko.computed(function () {
        return (self.dateFrom() || self.timeFrom() || self.dateTo() || self.timeTo());
    });
    self.usersFilterIsSet = ko.computed(function () {
        let i,
            filterUsers = self.users();

        for (i = 0; i < filterUsers.length; i++) {
            if (filterUsers[i].isSelected) {
                return true;
            }
        }

        return false;
    });
    self.filterIsSet = ko.computed(function () {
        let aFilterIsSet = false;

        if (!aFilterIsSet) {
            aFilterIsSet = self.usersFilterIsSet();
        }

        if (!aFilterIsSet) {
            aFilterIsSet = self.pointTypeNameFilterIsSet();
        }

        if (!aFilterIsSet) {
            aFilterIsSet = self.datetimeFilterIsSet();
        }

        return aFilterIsSet;
    }, self).extend(computedThrottle);

    dtiUtility.getUser(setCurrentUser);
    dtiUtility.getConfig("Utility.pointTypes.getAllowedPointTypes", [], setAvailablePointTypes);
    self.init();
};

function initPage(manager) {
    // for resizing the pointname column
    // $pointNameHeader
    //     .css({
    //         position: "relative"
    //     })
    //     .prepend("<div class='resizer'></div>")
    //     .resizable({
    //         resizeHeight: false,
    //         handleSelector: "",
    //         onDragStart: function (e, $el, opt) {
    //             return ($(e.target).hasClass("resizer")); // only drag resizer
    //         },
    //         resize: function (event, ui) {
    //             $pointNameColumn.width(ui.size.width);
    //         }
    //     });
}

function applyBindings() {
    if (window.top === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        window.manager = new ActivityLogsManager({});
        ko.applyBindings(window.manager);
    }
}

dti.$(function () {
    applyBindings();
    initPage(window.manager);

    // load page with initial data.
    window.manager.refreshUsersData();
});
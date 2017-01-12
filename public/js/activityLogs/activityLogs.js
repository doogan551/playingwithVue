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

var ActivityLogsManager = function (conf) {
    var self = this,
        myTitle = 'Activity Logs',
        sessionId = store.get('sessionId'),
        storeKey = 'activityLogs_',
        filterDataKey = "activityLogFilters" + window.location.search.slice(1),
        $dateFrom = $("#dateFrom"),
        $timeFrom = $("#timeFrom"),
        $dateTo = $("#dateTo"),
        $timeTo = $("#timeTo"),
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
        pointNameFilterObj = {
            name1: '',
            name2: '',
            name3: '',
            name4: '',
            pointTypes: []
        },
        _log = function () {
            console.log.apply(console, arguments);
        },
        setCurrentUser = function (results) {
            currentUser = results;
            storeKey += currentUser;
        },
        buildActivityLogRequestObject = function (activityLog, reqObj) {
            var l_startDate = 0,
                l_endDate = 0,
                nPages = activityLog.numberOfPages.peek();

            // Paging
            reqObj.itemsPerPage = PAGE_SIZE;
            reqObj.sort = self.sortAscending() ? 'asc' : 'desc';
            reqObj.currentPage = gotoPageOne ? (self.sortAscending() ? 1 : nPages) : self.pageNumber();
            reqObj.usernames = self.getFilteredUsers();

            // Point type filtering
            if (self.name1() === undefined) {
                self.name1("");
                self.name2("");
                self.name3("");
                self.name4("");
            }

            reqObj.name1 = self.name1();
            reqObj.name2 = self.name2();
            reqObj.name3 = self.name3();
            reqObj.name4 = self.name4();
            reqObj.pointTypes = (self.pointTypes().length > 0 && self.pointTypes().length !== numberPointTypes.length) ? self.pointTypes() : [];

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
        pointNameFilterCallback = function (filter) {
            self.name1(filter.name1);
            self.name2(filter.name2);
            self.name3(filter.name3);
            self.name4(filter.name4);

            if (!!filter.pointTypes && filter.pointTypes.length !== numberPointTypes) {
                self.pointTypes(filter.pointTypes);
            } else {
                self.pointTypes(self.availablePointTypes());
            }
            self.applyPointNameFilter();
        },
        getPrettyDate = function (timestamp, forceDateString) {
            var theDate = new Date(timestamp),
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
            var theDate = new Date(timestamp);
            return theDate.toString('HH:mm:ss');
        },
        formatActivityLogEntry = function (activityLog) {
            var selected = false;

            activityLog.isSelected = ko.observable(selected);
            activityLog.prettyDate = getPrettyDate(activityLog.timestamp);
            activityLog.prettyTime = getPrettyTime(activityLog.timestamp);
        },
        updateNumberOfPages = function (count, activityLogTable) {
            var sortAsc = self.sortAscending(),
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

            if ((sortAsc === false) && (curPage === curNumberPages)) {
                self.pageNumber(newNumberPages);
            }
        },
        processActivityLogs = function (theLogData) {
            var i, page;

            if (theLogData.logs !== undefined) {
                //console.log('   activityLogs from server.  logs.length = ', theLogData.logs.length);
                for (i = 0; i < theLogData.logs.length; i += 1) {
                    formatActivityLogEntry(theLogData.logs[i]);
                }
                self.activityLogs().list(theLogData.logs);
                self.activityLogs().count(theLogData.count);
                updateNumberOfPages(self.activityLogs().count(), self.activityLogs());
                if (gotoPageOne) {
                    page = self.sortAscending() ? 1 : self.activityLogs().numberOfPages();
                    self.pageNumber(page);
                    gotoPageOne = false;
                }
            } else {
                console.log(' theLogData.logs = undefined');
            }
            self.activityLogs().gettingData(false);
        },
        setAvailablePointTypes = function (results) {
            var i;
            if (results) {
                for (i = 0; i < results.length; i++) {
                    self.availablePointTypes().push(results[i].key);
                }
            }
            numberPointTypes = self.availablePointTypes().length;
        },
        getStoreData = function () {
            var storeData = store.get(storeKey) || {};

            if (storeData.hasOwnProperty('sessionId') && storeData.sessionId !== sessionId) {
                store.remove(storeKey);
                storeData = {};
            }
            return storeData;
        },
        getJsUsers = function () {
            var i,
                filteredUsers = self.filteredUsers(),
                cleanedUsers = [];

            for (i = 0; i < filteredUsers.length; i++) {
                cleanedUsers.push(ko.toJS(filteredUsers[i]));
            }

            return cleanedUsers;
        },
        getStoredUsers = function () {
            var i,
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
            var i,
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
            var name = activityLogTable.name,
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
            var filterValues,
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
                name1: self.name1(),
                name2: self.name2(),
                name3: self.name3(),
                name4: self.name4(),
                pointTypes: self.pointTypes(),
                selectedUsers: self.getFilteredUsers(),
                gotoPageOne: gotoPageOne
            };

            storeData[filterDataKey] = ko.toJS(filterValues);
            store.set(storeKey, storeData);
        },
        initFilterValues = function () {
            var i,
                data,
                storeData = getStoreData();

            if (storeData.hasOwnProperty(filterDataKey)) {
                data = storeData[filterDataKey];
                self.sortAscending(data.sortAscending);
                self.pageNumber(data.pageNumber);
                self.dateFrom(data.dateFrom);
                self.dtFilterPlaceholder.dateFrom = data.dateFrom;
                self.timeFrom(data.timeFrom);
                self.dtFilterPlaceholder.timeFrom = data.timeFrom;
                self.dateTo(data.dateTo);
                self.dtFilterPlaceholder.dateTo = data.dateTo;
                self.timeTo(data.timeTo);
                self.dtFilterPlaceholder.timeTo = data.timeTo;
                self.name1(data.name1);
                pointNameFilterObj.name1 = data.name1;
                self.name2(data.name2);
                pointNameFilterObj.name2 = data.name2;
                self.name3(data.name3);
                pointNameFilterObj.name3 = data.name3;
                self.name4(data.name4);
                pointNameFilterObj.name4 = data.name4;

                for (i in data.pointTypes) {
                    self.pointTypes().push(data.pointTypes[i]);
                }

                pointNameFilterObj.pointTypes = self.pointTypes();
                gotoPageOne = data.gotoPageOne;
            }
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
        var localActivityLogTable = self.activityLogs();
        requestActivityLogs(localActivityLogTable);
    };
    self.refreshUsersData = function () {
        //_log('self.refreshUsersData() called........');
        requestUsers();
    };
    self.showPointReview = function (element, theData) {
        var upi = parseInt(theData.upi, 10),
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
        var localActivityLogs = self.activityLogs().list(),
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
        var filterUsers = self.filteredUsers(),
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
        var localActivityLogs = self.activityLogs().list(),
            len = localActivityLogs.length,
            i;

        for (i = 0; i < len; i++) {
            localActivityLogs[i].isSelected(false);
        }
        self.selectedRows.removeAll();
        nSelectedRowsOnPage = 0;
    };
    self.deselectAllNames = function () {
        var filterUsers = self.filteredUsers(),
            len = filterUsers.length,
            i;

        for (i = 0; i < len; i++) {
            filterUsers[i].isSelected(false);
        }
        self.dirtyUsernameFilter(true);
    };
    self.selectNone = function () {
        var localActivityLogs = self.activityLogs().list(),
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
        self.clearPointNameFilter();
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
    self.clearPointNameFilter = function (refreshTheData) {
        self.name1("");
        pointNameFilterObj.name1 = "";
        self.name2("");
        pointNameFilterObj.name2 = "";
        self.name3("");
        pointNameFilterObj.name3 = "";
        self.name4("");
        pointNameFilterObj.name4 = "";
        self.pointTypes([]);
        pointNameFilterObj.pointTypes = [];

        if (refreshTheData) {
            storeFilterData();
            self.refreshActivityLogsData();
        }
    };
    self.clearDateTimeFilter = function (refreshTheData) {
        self.dateFrom(null);
        self.dtFilterPlaceholder.dateFrom = '';
        $dateFrom.val('').datepicker('update');
        self.timeFrom(null);
        self.dtFilterPlaceholder.timeFrom = '';
        $timeFrom.val('').timepicker('setTime', null);
        self.dateTo(null);
        self.dtFilterPlaceholder.dateTo = '';
        $dateTo.val('').datepicker('update');
        self.timeTo(null);
        self.dtFilterPlaceholder.timeTo = '';
        $timeTo.val('').timepicker('setTime', null);
        if (refreshTheData) {
            storeFilterData();
            self.refreshActivityLogsData();
        }
    };
    self.applyPointNameFilter = function () {
        gotoPageOne = true;
        storeFilterData();
        self.refreshActivityLogsData();
    };
    self.applyUserNameFilter = function () {
        gotoPageOne = true;
        listOfUsers(getJsUsers());
        storeFilterData();
        self.refreshActivityLogsData();
    };
    self.cancelUserNameFilter = function () {
        var i,
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

    };
    self.cancelPointNameFilter = function () {
        var i,
            data,
            storeData = getStoreData();

        if (storeData.hasOwnProperty(filterDataKey)) {
            data = storeData[filterDataKey];
            self.name1(data.name1);
            pointNameFilterObj.name1 = data.name1;
            self.name2(data.name2);
            pointNameFilterObj.name2 = data.name2;
            self.name3(data.name3);
            pointNameFilterObj.name3 = data.name3;
            self.name4(data.name4);
            pointNameFilterObj.name4 = data.name4;

            for (i in data.pointTypes) {
                self.pointTypes().push(data.pointTypes[i]);
            }

            pointNameFilterObj.pointTypes = self.pointTypes();
        }
    };
    self.showPointFilter = function () {
        if (self.pointTypes().length === 0) {
            self.pointTypes(self.availablePointTypes());
        }
        var parameters = {
            name1: self.name1(),
            name2: self.name2(),
            name3: self.name3(),
            name4: self.name4(),
            pointTypes: self.pointTypes()
        };

        dtiUtility.showPointFilter(parameters);
        dtiUtility.onPointSelect(pointNameFilterCallback);
    };
    self.applyDateTimeFilter = function () {
        self.dateFrom(self.dtFilterPlaceholder.dateFrom);
        self.timeFrom(self.dtFilterPlaceholder.timeFrom);
        self.dateTo(self.dtFilterPlaceholder.dateTo);
        self.timeTo(self.dtFilterPlaceholder.timeTo);
        gotoPageOne = true;
        storeFilterData();
        self.refreshActivityLogsData();
    };
    self.cancelDateTimeFilter = function () {
        self.dtFilterPlaceholder.dateFrom = self.dateFrom();
        $dateFrom.val(self.dtFilterPlaceholder.dateFrom).datepicker('setDate', self.dtFilterPlaceholder.dateFrom);
        self.dtFilterPlaceholder.timeFrom = self.timeFrom();
        $timeFrom.val(self.dtFilterPlaceholder.timeFrom).timepicker('setTime', self.dtFilterPlaceholder.timeFrom);
        self.dtFilterPlaceholder.dateTo = self.dateTo();
        $dateTo.val(self.dtFilterPlaceholder.dateTo).datepicker('setDate', self.dtFilterPlaceholder.dateFrom);
        self.dtFilterPlaceholder.timeTo = self.timeTo();
        $timeTo.val(self.dtFilterPlaceholder.timeTo).timepicker('setTime', self.dtFilterPlaceholder.timeTo);
    };
    self.toggleDateTimeSort = function () {
        var currentSort = self.sortAscending();
        self.sortAscending(!currentSort);
        storeFilterData();
        self.refreshActivityLogsData();
    };
    self.changePage = function (modifier) {
        var activityLogs = self.activityLogs(),
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
        var i,
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
        $('.activityLogs').css('overflow', 'visible');
        $('.activityLogs').printArea({
            mode: 'iframe'
        });
        $('.activityLogs').css('overflow', 'auto');
    };

    self.dtFilterPlaceholder = {
        dateFrom: '',
        timeFrom: '',
        dateTo: '',
        timeTo: ''
    };
    self.sortAscending = ko.observable(true);
    self.pageNumber = ko.observable(1);
    self.dateFrom = ko.observable();
    self.timeFrom = ko.observable();
    self.dateTo = ko.observable();
    self.timeTo = ko.observable();
    self.name1 = ko.observable();
    self.name2 = ko.observable();
    self.name3 = ko.observable();
    self.name4 = ko.observable();
    self.dirtyUsernameFilter = ko.observable(false);
    self.pointTypes = ko.observableArray([]);
    self.pageTitle = ko.observable(myTitle);
    self.selectedRows = ko.observableArray([]);
    self.availablePointTypes = ko.observableArray([]);

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
        var i,
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
        var i,
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
        var localPointTypes = self.pointTypes();

        if (self.name1() !== "" || self.name2() !== "" || self.name3() !== "" || self.name4() !== "") {
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
        var i,
            filterUsers = self.users();

        for (i = 0; i < filterUsers.length; i++) {
            if (filterUsers[i].isSelected) {
                return true;
            }
        }

        return false;
    });
    self.filterIsSet = ko.computed(function () {
        var aFilterIsSet = false;

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
    initFilterValues();
};

function initPage(manager) {
    var dateId = '#timeDateFilters',
        userFilterId = '#userFilters',
        $dateFilterIcon = $(dateId + ' .filterIcon'),
        $userFilterIcon = $(userFilterId + ' .filterIcon'),
        $bodyMask = $('.bodyMask'),
        $pointFilterModal = $('#pointFilterModal'),
        toggleDropdown = function (id) {
            var $dropDown = $(id + ' .dropdown-menu'),
                $icon = $(id + ' .filterIcon'),
                visible = $dropDown.is(':visible');

            if (!visible) {
                $icon.addClass('open');
                $bodyMask.show();
            } else {
                $icon.removeClass('open');
            }
            $dropDown.toggle();
        },
        hideDropDowns = function () {
            var $dateFilterDropDown = $(dateId + ' .dropdown-menu'),
                $userFilterDropDown = $(userFilterId + ' .dropdown-menu'),
                $userFilterIcon = $(userFilterId + ' .filterIcon');

            $dateFilterDropDown.hide();
            $userFilterDropDown.hide();
            $dateFilterIcon.removeClass('open');
            $userFilterIcon.removeClass('open');
            $bodyMask.hide();
        };

    // Initialize time and datepickers
    $('.time').timepicker({
        'timeFormat': 'H:i:s',
        'disableTimeRanges': [
            ['24:00:00', '25:00:00']
        ]
    });
    $('.date').datepicker({
        'format': 'D, m/d/yyyy',
        'todayHighlight': true,
        'clearBtn': true,
        'autoclose': true,
        'appendTo': '#timeDateFilters .dropdown-menu'
    });

    // Initialize the table header select column. This way the user can select any
    // part of this header cell to activate the dropdown.
    $(".header > .colSelect").click(function (e) {
        e.stopPropagation();
        if (e.srcElement.tagName !== 'INPUT') {
            $(".header > .colSelect .dropdown-toggle").dropdown('toggle');
        }
    });

    $dateFilterIcon.click(function (e) {
        toggleDropdown(dateId);
    });

    $userFilterIcon.click(function (e) {
        toggleDropdown(userFilterId);
    });

    // This targets the 'x', 'OK', and 'clear filter' buttons in the drop down, which also dismiss the dropdown
    $('.dropdown-menu .closeIt').click(function () {
        hideDropDowns();
    });

    // When either the name filter or date filter drop down is shown, this element is made visible. It sits
    // behind the drop downs, but on top of everything else. We did this because the datepicker appends
    // itself to the body. When a date was selected, jQuery detected the body click event, causing the
    // dropdown to be hidden.  This allows the dropdown to persist by blocking the body click, but still
    // allows us to click anywhere outside of the dropdown to dismiss the dropdown.
    $('.bodyMask').click(function () {
        hideDropDowns();
    });

    // Add click handlers to 'close' elements within the modal itself
    $pointFilterModal.find('.closeIt').click(function () {
        $pointFilterModal.modal('toggle');
    });

    // Add handler to notify when the modal is shown
    $pointFilterModal.on('shown.bs.modal', function (e) {
        $('#pointLookup')[0].contentWindow.$('#listSearch').find('input:first').focus();
    });

    // $('.filterContainer.userFilterDropdown').on('hidden.bs.dropdown', function (event) {
    //     manager.cancelUserNameFilter();
    // });

    // If this is a pop-out window
    if (window.top.location.href === window.location.href) {
        $('.popOut').addClass('hidden');
        $('.popIn').removeClass('hidden');
    }

    // attach event handler to Point Name click event.
    $("#activityLogRows").on("click", "a", function () {
        var context = ko.contextFor(this);
        context.$parent.showPointReview(this, context.$data);
    });
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
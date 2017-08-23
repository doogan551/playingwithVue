/*jslint white: true */
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

/*********************************** NOTES **********************************
    Application Overview
    --------------------
    First, a few definitions for the purpose of discussing the application:
    a)  Alarm list - This is a list of alarms received from the server. There are three alarm lists: Recent, Active, and Unacknowledged
    b)  View - The view is just a container that defines the alarm list used and specifies the filters for the alarm list.
    c)  Custom View - These are saved views with filters defined by the user. At the time of this writing, custom views are planned, but
        not fully implemented.

    Here's how we display the alarms:
    1)  We maintain an observable, self.currentView(), which always points to the current view. This observable is updated when a different
        view is requested.
    2)  Each view contains a pointer to the alarm table that the view uses.
    3)  We have a computed observable, self.alarms(), which has dependencies on self.currentView() and self.currentView().alarmTableName()
    4)  self.alarms() is used to display the alarms on the screen.  This way, anytime the currentView changes, or if the target alarm list
        changes, the alarms shown are automatically updated.

    Here's how the filters work:
    1)  We have a private filters object, which is a template for self.filters, which we create when the application is intialized.
        We add keys and functionality to self.filters, which is not included in the private filters object.
    2)  Every view also has a defaultFilters object that defines the default filter values for the view.  It is formatted differntly
        still, from the private filters object and the self.filters object. **See Room For Improvements, Note 1.
    3)  All views are initialized when the application starts. Part of that initialization is to copy the defaultFilters object
        to a filters object, also in the view.  This allows us to make changes to the filters, but not forego the ability to revert
        back to the original filter state.
    3)  When another view is requested, self.filters are saved onto the view (using the view's format), before loading the requested
        view's filters into self.filters.
    4)  self.filters contains observables so the filters the user sees are automatically updated when changing views.

    Here's how alarms are updated:
    1)  When the application first loads, up to PAGE_SIZE alarms for each alarm list are requested from the server via socket.
    2)  This also establishes a socekt connection for each alarm list that the server uses to send alarm updates through. Alarm updates
        include adding new recent, active, and unacknowledged alarms, and removing active and unacknowledged alarms.
    3)  The server remembers the filter criteria used for each alarm list, so updates received from the server are applicable to
        the current view.  There are two exceptions to this:
            a) Paging is ingored so even if we're several pages in, we'll still get new alarms matching our filter criteria.
            b) 'Remove unacknowledged alarm' updates (the alarm was acknowledged by someone) are always broadcast, regardless of the
                filter criteria.
    4)  When the user changes views, if the target view uses the same alarm list as the current view, we have to re-get PAGE_SIZE
        alarms from the server. This is because the filter set for the two views is likely different.

    Room For Improvements
    ---------------------
    1)  Use a common filter structure for the views and screen filters, the only difference being that the screen filters are made
        observable.
    2)  One alarm list with tags indicating to what alarm list(s) the alarm belongs. This way, when an alarm was acknowledged or selected,
        we wouldn't have to maintain updates (ack status, selected status, etc.) across multiple lists.
*****************************************************************************/

var initKnockout = function () {
    var datePickerDefaultOptions = {
            default: '',           // default time, 'now' or '13:14' e.g.
            fromnow: 0,            // set default time to * milliseconds from now
            donetext: 'Done',      // done button text
            autoclose: true,       // auto close when minute is selected
            ampmclickable: false,  // set am/pm button on itself
            darktheme: true,       // set to dark theme
            twelvehour: false,     // 12 hour AM/PM clock or 24 hour;
            vibrate: true,         // vibrate the device when dragging clock hand
            container: ''          // default will append clock next to input
        },
        timePickerDefaultOptions = {
            default: 'now',         // Set default time: 'now', '1:30AM', '16:30'
            fromnow: 0,             // set default time to * milliseconds from now (using with default = 'now')
            twelvehour: true,       // Use AM/PM or 24-hour format
            donetext: 'OK',         // text for done-button
            cleartext: 'Clear',     // text for clear-button
            canceltext: 'Cancel',   // Text for cancel-button
            autoclose: false,       // automatic close timepicker
            ampmclickable: false,   // make AM PM clickable
            aftershow: function () {
            } // Function for after opening timepicker
        };

    ko.bindingHandlers.dtiAlarmsMaterializePickadate = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).pickadate(datePickerDefaultOptions);
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };

    ko.bindingHandlers.dtiAlarmsMaterializePickatime = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).pickatime(timePickerDefaultOptions);
        },
        update: function (element, valueAccessor, allBindings) {
        }
    };

    ko.bindingHandlers.dataSrc = {
        update: function (element, valueAccessor) {
            var upi = valueAccessor(),
                $element = $(element),
                $bg = $element.parent();

            $.ajax({
                url: '/img/thumbs/' + upi + '.txt',
                dataType: 'text',
                type: 'get'
            })
                .done(
                    function (file) {
                        var data = file.split('||'),
                            bgColor = data[0],
                            image = data[1];
                        $element.attr('src', image);
                        if (bgColor != 'undefined') $bg.css('background-color', bgColor);
                    }
                )
                .fail(
                    function () {
                        $element.hide();
                    }
                );
        }
    };
};

var AlarmManager = function (conf) {
    let self = this,
        socket = io.connect(window.location.origin),
        sessionId = store.get('sessionId'),
        storeKey = 'alarms_',
        currentUser,
        windowUpi = "alarm" + window.location.search.slice(1), // alarm prefix required or pop-in/pop-out don't work

        $elAlarms = $('.alarms'),
        $elnewAlarmTop = $('.newAlarmTop'),
        $elnewAlarmBot = $('.newAlarmBottom'),
        rowHeight = 28,

        $elContent = $('.content'),
        $elDetailContainer = $('.detailContainer'),
        $alarmsBody = $("body"),
        $dateTimeFilterModal = $alarmsBody.find('#dateTimeFilterModal'),
        $dateFrom = $dateTimeFilterModal.find("#dateFrom"),
        $timeFrom = $("#timeFrom"),
        $dateTo = $dateTimeFilterModal.find("#dateTo"),
        $timeTo = $("#timeTo"),
        detailWidth = $elDetailContainer.outerWidth(),

        horizontalMenu = {
            $elAlarmClass: $('#filters .horizontalMenu.alarmClass'),
            $elAlarmCategory: $('#filters .horizontalMenu.alarmCategory')
        },
        verticalMenu = {
            $elAlarmClass: $('#filters .verticalMenu.alarmClass'),
            $elAlarmCategory: $('#filters .verticalMenu.alarmCategory')
        },

        //------ Constants definitions
        ACK_NONE = 0,
        ACK_REQUIRED = 1,
        ACK_IN_PROGRESS = 1.5,
        ACK_DONE = 2,
        ACK_ERROR = -1,
        AUTO_ACK = 3,
        ACK_TIMEOUT = 5000,
        GETTING_DATA_TIMEOUT = 15000,
        FILTER_CHANGE_DELAY = 300,
        BUFFER_SIZE = 400,
        PAGE_SIZE = 200,
        COMPUTED_DELAY = 10,
        ALARM_NOTICE_FADEOUT = 6000,

        computedThrottle = {
            rateLimit: {
                timeout: COMPUTED_DELAY,
                method: "notifyWhenChangesStop"
            }
        },
        isReconnecting = false,
        filterChange = new Date().getTime(),

        dateErrors = false,

        clickHistory = {},
        ackRequests = {},
        alarmUpdateQueue = {
            Recent: [],
            Active: [],
            Unacknowledged: []
        },
        availablePointTypes = {},

        alarmClassEnums = {
            Emergency: 2,
            2: 'Emergency',
            Critical: 1,
            1: 'Critical',
            Urgent: 3,
            3: 'Urgent',
            Default: 0,
            0: 'Default'
        },
        alarmCategoryEnums = {
            Events: 0,
            0: 'Events',
            Alarms: 1,
            1: 'Alarms',
            Return: 2,
            2: 'Return',
            Maintenance: 3,
            3: 'Maintenance'
        },

        pointAttribsFilterObj = {
            path: [],
            terms: "",
            pointTypes: []
        },
        numberPointTypes,

        nSelectedAlarmsOnPage = 0,

        permissionLevels = {
            CONTROL     : 2,
            ACKNOWLEDGE : 4,
            WRITE       : 8
        },

        _log = function () {
            // JDR 4/27/2015 Disabling console.log for LMH testing. This would be disabled for a production environment anyway
            // console.log.apply(console, arguments);
        },
        setCurrentUser = function (results) {
            currentUser = results;
            storeKey += currentUser;
        },
        deepClone = function (o) {
            // Return the value if it's not an object
            if ((o === null) || (typeof(o) !== 'object'))
                return o;

            var temp = o.constructor();

            for (var key in o) {
                temp[key] = deepClone(o[key]);
            }
            return temp;
        },
        openModal = (modalElement) => {
            // modalElement.modal("open");
            modalElement.openModal();
        },
        closeModal = (modalElement) => {
            // modalElement.modal("close");
            modalElement.closeModal();
        },
        userHasPermission = function (alarm, requestedAccessLevel) {
            return !!(alarm._pAccess & requestedAccessLevel);
        },
        // Simple routine to compare two values. Values are assumed to be numbers, strings, or flat arrays of numbers or strings.
        valuesAreDifferent = function (v1, v2) {
            var j,
                v1len,
                v2len;

            if (typeof v1 !== typeof v2)
                return true;
            if (typeof v1 === 'object' && v1 !== null) {
                v1len = v1.length;
                v2len = v2.length;

                if (v1len !== v2len)
                    return true;
                for (j = 0; j < v1len; j++) {
                    if (v1[j] !== v2[j])
                        return true;
                }
            }
            else {
                return v1 !== v2;
            }
            return false;
        },
        toggleAlarmDetail = function (contentStop, detailStop) {
            var tweenParam = {
                    right: {
                        stop: contentStop,
                        time: 0,
                        duration: 0.2,
                        units: 'px',
                        effect: 'circIn'
                    }
                };

            $elContent.tween(tweenParam);
            tweenParam.right.stop = detailStop;
            $elDetailContainer.tween(tweenParam);
            $.play();
        },
        // toggleAlarmDetailFUTURE = () => {
        //     self.alarmDetailVisible(!self.alarmDetailVisible());
        // },
        changePointAttribsFilter = function (data) {
            var val,
                upi = parseInt(data.upi, 10),
                pointAttribs = self.filters.pointAttribs.options,
                setFilter = (pointType) => {
                    pointAttribsFilterObj.pointTypes = [pointType];

                    self.nameFilterPaused(false);
                    applyFilter(true);
                };

            self.nameFilterPaused(true);

            val = (typeof data.path === 'function') ? data.path() : data.path;
            pointAttribs.path = (val.length ? val : []);
            pointAttribsFilterObj.path = pointAttribs.path;

            // val = (typeof data.terms === 'function') ? data.terms() : data.terms;
            // pointAttribs.terms = (val.length ? val : "");
            // pointAttribsFilterObj.terms = pointAttribs.terms;

            dtiUtility.getConfig('Utility.pointTypes.getPointTypeNameFromId', upi, setFilter);
        },
        //------ Point selector routines
        filterCallback = function(filterObj) {
            pointAttribsFilterObj.path = filterObj.path;
            pointAttribsFilterObj.terms = filterObj.terms;

            if (filterObj.pointTypes.length === numberPointTypes) {
                filterObj.pointTypes = [];
            }

            pointAttribsFilterObj.pointTypes = filterObj.pointTypes;
            self.applyNameFilter();
        },
        getPrettyDate = function (timestamp, forceDateString) {
            var alm = new Date(timestamp * 1000),
                almClone = alm.clone().clearTime(),
                today = Date.today(),
                str = '';

            // Set this variable to false if no argument was provided (i.e. forceDateString = undefined)
            forceDateString = forceDateString || false;

            if (!forceDateString && almClone.equals(today)) {
                str = 'Today';
            } else if (!forceDateString && almClone.equals(today.addDays(-1))) {
                str = 'Yesterday';
            } else {
                str = alm.toString('M/d/yyyy');
            }
            return str;
        },
        getPrettyTime = function (timestamp) {
            var alm = new Date(timestamp * 1000);
            return alm.toString('HH:mm:ss');
        },
        setAvailablePointTypes = function (results) {
            var i;
            if (results) {
                for (i = 0; i < results.length; i++) {
                    availablePointTypes[results[i].key] = results[i].enum;
                }
            }
            numberPointTypes = results.length;
        },
        sendAcknowledge = function (idList) {
            var request,
                reqID = new Date().getTime(),
                ackTimeout = function (req) {
                    var ids = req.ids,
                        len = ids.length,
                        i;

                    for (i = 0; i < len; i++) {
                        updateAckStatus({
                            _id: ids[i],
                            ackStatus: ACK_ERROR
                        });
                    }
                    delete ackRequests[req.reqID];
                };

            _log('Sending alarm acknowledge:', idList, new Date());

            request = ackRequests[reqID] = {};

            request.reqID = reqID;
            request.ids = idList;
            request.username = currentUser.username;

            socket.emit('sendAcknowledge', JSON.stringify(request));

            request.timeoutID = window.setTimeout(function () {
                ackTimeout(request);
            }, ACK_TIMEOUT);
        },
        socketEmit = function (name, reqObj) {
            var emitString = {
                Recent: 'getRecentAlarms',
                Active: 'getActiveAlarms',
                Unacknowledged: 'getUnacknowledged'
            };

            // IE Hack Fix - For some reason, when alarms are popped out of the workspace, if the groups array in our request
            // object is empty, the stringified result is "{}", not "[]" as expected. This was causing a js error on the server
            // Not sure why, but if we overwrite the empty array with an empty array it works fine.
            // ** IE behaves as expected if the groups array is non-empty
            // if (reqObj.user.groups.length === 0) {
            //     reqObj.user.groups = [];
            // }

            socket.emit(emitString[name], JSON.stringify(reqObj));
        },
        getAckInfoString = function (alarm) {
            var prettyDate = getPrettyDate(alarm.ackTime),
                prettyTime = getPrettyTime(alarm.ackTime),

            // Our string will read 'UserA acknowledged this alarm on 8/8/8888 at 12:12:12' or
            // 'UserA acknowledged this alarm today/yesterday at 12:12:12'

            str  = alarm.ackUser() + ' acknowledged this alarm ';
            if (!isNaN(parseInt(prettyDate[0], 10)))
                str += 'on ';
            str += prettyDate + ' at ' + prettyTime;

            return str;
        },
        selectAlarm = function (alarm) {
            if (++nSelectedAlarmsOnPage === 1) {
                self.openAlarmDetail(alarm);
            }

            alarm.isSelected(true);
            self.selectedRows.push(alarm);
        },
        deSelectAlarm = function (alarm) {
            if (--nSelectedAlarmsOnPage < 0) nSelectedAlarmsOnPage = 0;

            alarm.isSelected(false);
            self.selectedRows.remove(function (row) {
                return row._id === alarm._id;
            });

            if (alarm._id === self.alarmDetail.alarm()._id) {
                self.closeAlarmDetail();
            } else if (nSelectedAlarmsOnPage === 1) {
                self.openAlarmDetail(alarm);
            }
        },
        updateAckStatus = function (data, skipAlarmTableName) {
            var alarm,
                alarmTable,
                alarmList,
                key,
                i,
                len,
                ackStatus = data.ackStatus ? ((typeof data.ackStatus === 'function') ? data.ackStatus() : data.ackStatus) : null,
                ackUser = data.ackUser ? ((typeof data.ackUser === 'function') ? data.ackUser() : data.ackUser) : null,
                ackTime = data.ackTime ? data.ackTime : null;

            for (key in alarmTables) {
                alarmTable = alarmTables[key];

                if (alarmTable.name !== skipAlarmTableName) {
                    alarmList = alarmTable.list();
                    len = alarmList.length;

                    for (i = 0; i < len; i++) {
                        alarm = alarmList[i];

                        if (alarm._id === data._id) {
                            if (ackStatus) {
                                alarm.ackStatus(ackStatus);
                            }

                            if (ackUser) {
                                alarm.ackUser(ackUser);
                            }

                            if (ackStatus === ACK_DONE) {
                                if (ackTime) {
                                    alarm.ackTime = ackTime;
                                    alarm.ackInfo(getAckInfoString(alarm));
                                }
                            }
                            break;
                        }
                    }
                }
            }
        },
        receiveAlarmUpdate = function (data, action, alarmTable, addingFromQueue) {
            // We ignore all updates when the view is paused, with one excpetion: we need to always process 'DELETE' updates for the
            // unacknowledged view. This way the ACK status of an alarm (on any view) will always be updated, regardless if the Unacknowledged
            // view is paused or not.
            if (alarmTable.view.paused() && (alarmTable.name !== 'Unacknowledged' || action === 'ADD')) {
                return;
            }

            // 'reqID' is created when alarms are requested, so it represents a specific filter criteria. If this
            // request ID is different, i.e. the filter criteria has changed), this alarm update is trash
            if (data.reqID !== alarmTable.reqID) {
                _log('receiveAlarmUpdate() Throwing away ' + alarmTable.name + ' alarm ' + action + ' update (request id mismatch).', data, new Date());
                _log(' ---------   data.reqID = ' + data.reqID + '     alarmTable.reqID = ' + alarmTable.reqID);
                return;
            }
            if (alarmTable.gettingData()) {
                _log('Queueing ' + alarmTable.name + ' alarm ' + action + ' update', data, new Date());
                alarmUpdateQueue[alarmTable.name].push({
                    data: data,
                    action: action
                });
                return;
            }

            // We receive an alarm update from the server. What we do with the received alarm depends on if this is an
            // add or remove operation, and how the alarm array is populated. The array is populated differently based on
            // if our alarm time column is ascending or descending
            // ascending:  [0, 1, 2, 3, 4], where 0 = time now, and 4 = history
            // descending: [4, 3, 2, 1, 0]
            // Add, Ascending -> add alarm to beginning of array
            // Add, Descending -> add alarm to end of array
            var removedItem,
                len,
                key,
                scrolledTop,
                scrolledBottom,
                doScroll,
                scrollPosition,
                alarm,
                operator = {},
                modifier = 0,
                discardAlarm = false,
                sortAlarms = false,
                tableName = alarmTable.name,
                alarms = alarmTable.list(),
                count = alarmTable.count(),
                view = alarmTable.view,
                sortAsc = view.sortAscending(),
                alarmTableInView = (view.id === self.currentView().id),
                findAlarm = function (key, keyValue) {
                    for (var j = 0, jlen = alarms.length; j < jlen; j++) {
                        if (alarms[j][key] === keyValue) {
                            return {
                                index: j,
                                alarm: alarms[j]
                            };
                        }
                    }
                    return null;
                },
                updateScrollPosition = function () {
                    doScroll = false;
                    scrollPosition = $elAlarms.scrollTop();

                    if (!sortAsc) {
                        if (!scrolledTop) {
                            doScroll = true;
                            scrollPosition += rowHeight;

                            // Display the new alarms notification
                            $elnewAlarmTop.fadeIn(0);
                            $elnewAlarmTop.fadeOut(ALARM_NOTICE_FADEOUT);
                        }
                    } else {
                        // In descending sort we ALWAYS have to touch the scroll bar after rows are added
                        doScroll = true;

                        // If we were scrolled to the bottom before we got this alarm update
                        if (scrolledBottom) {
                            // Keep it @ the bottom
                            scrollPosition = 99999;
                        } else {
                            // Adjust our scroll position to keep our alarms from shifting on us
                            scrollPosition -= rowHeight;

                            // Display the new alarms notification
                            $elnewAlarmBot.fadeIn(0);
                            $elnewAlarmBot.fadeOut(ALARM_NOTICE_FADEOUT);
                        }
                    }
                    if (doScroll) {
                        $elAlarms.scrollTop(scrollPosition);
                    }
                },
                sortAlarmsByDate = function () {
                    return alarms.sort(function (a, b) {return sortAsc ? (b.msgTime - a.msgTime) : (a.msgTime - b.msgTime);});
                };

            _log('Received ' + tableName + ' alarms ' + action + ' update', ko.toJS(data), new Date());

            if (action === 'ADD') {
                // If we're adding from the queue, then this update was actually recived a few moments ago while we were
                // in the process of receiving data. We need to make sure this alarm doesn't already exist in the result
                // set (due to the way we retrieve batch alarms from the db, and the way we receive single alarm updates,
                // this alarm may or may not already be in the alarms list). See the next block of comments for an explanation
                // on why we're checking against the 'Active' table
                if (addingFromQueue && tableName !== 'Active') {
                    if (findAlarm('_id', data.newAlarm._id)) {
                        discardAlarm = true;
                    }
                }

                // Also, if we're adding an active alarm, there exists a possibility that this alarm could be a duplicate
                // of another already in our view, although the alarm message should be different. See Rob or Morris for
                // more info. If so, we'll replace the one in our view with this one.
                if (tableName === 'Active') {
                    alarm = findAlarm('upi', data.newAlarm.upi);
                    if (alarm) {
                        // Remove the found alarm in preparation to add the one just received
                        alarmTable.list().splice(alarm.index, 1);
                    }
                }

                if (!discardAlarm) {
                    modifier = 1;

                    if (!sortAsc) {
                        operator.add = 'unshift';
                        operator.del = 'pop';
                        scrolledTop = ($elAlarms.scrollTop() === 0);
                    } else {
                        operator.add = 'push';
                        operator.del = 'shift';
                        scrolledBottom = ($elAlarms[0].clientHeight === ($elAlarms[0].scrollHeight - $elAlarms[0].scrollTop));
                    }

                    initAlarm(data.newAlarm, true);

                    // Add the alarm to our list without notifying subscribers
                    alarms[operator.add](data.newAlarm);

                    // Received updates are not guaranteed to be in chronological order
                    if ((len = alarms.length) > 1) {
                        if (!sortAsc) {
                            if (alarms[0].msgTime < alarms[1].msgTime) {
                                sortAlarms = true;
                            }
                        } else {
                            // len is 1-based but the array is 0-based
                            if (alarms[len-1].msgTime < alarms[len-2].msgTime) {
                                sortAlarms = true;
                            }
                        }
                        if (sortAlarms) {
                            sortAlarmsByDate(); // This is done without notifying subscribers
                        }
                    }

                    // Adjust the scroll position to keep the alarm table from shifting around
                    if (alarmTableInView) {
                        updateScrollPosition();
                    }

                    // If our buffer is full, delete the oldest entry without notifying subscribers
                    if (alarms.length > BUFFER_SIZE) {
                        alarms[operator.del]();
                    }

                    // Notify subscribers to let them know our list has been updated
                    alarmTable.list.valueHasMutated();
                }
            } else {
                // We're removing an unacknowledged alarm or an active alarm. The unacknowledged alarm is matched using
                // the '_id' key, where an active alarm is matched using the 'upi' key (the server doesn't know the _id
                // key when an active alarm returns to normal; it only knows the upi)
                key = data._id ? '_id':'upi';

                removedItem = alarmTable.list.remove(function (alarm) {
                    return alarm[key] === data[key];
                })[0];

                if (removedItem !== undefined) {
                    modifier = -1;
                }

                // If we're removing an unacknowledged alarm, we also have to update the ackStatus across all our alarm lists
                if (tableName === "Unacknowledged") {
                    updateAckStatus(data, alarmTable.name);
                }
            }

            // If our count modifier is non-zero
            if (modifier) {
                alarmTable.count(count + modifier);
                updateNumberOfPages(alarmTable.count(), alarmTable);

                // If we removed an alarm, see if we've emptied our buffer. If so and we have more alarms from the server
                if ((modifier === -1) && (alarms.length < PAGE_SIZE) && (alarmTable.count() - ((view.pageNumber()-1)*PAGE_SIZE) >= PAGE_SIZE)) {
                    // We don't want the scroll bar to move for this request (keep the user's view from shifting)
                    if (alarmTableInView) {
                        alarmTable.stickyScrollBar = true;
                    }
                    // Request more alarms (this will replace the alarms in view as well as our buffer area)
                    alarmTable.refresh(true);
                }
            }

            return removedItem;
        },
        updateNumberOfPages = function (count, alarmTable) {
            var view = alarmTable.view,
                sortAsc = view.sortAscending(),
                curPage = view.pageNumber(),
                curNumberPages = alarmTable.numberOfPages(),
                newNumberPages = parseInt(count / PAGE_SIZE, 10);

            if (count % PAGE_SIZE) {
                newNumberPages++;
            }
            if (newNumberPages === 0) {
                newNumberPages = 1;
            }

            alarmTable.numberOfPages(newNumberPages);

            // In descending view, f we're on the last page, update the page number to make sure we always indicate we're
            // on the last page (adding alarms can cause the total number of pages to increment)
            if ((sortAsc === false) && (curPage === curNumberPages)) {
                view.pageNumber(newNumberPages);
            }
        },
        isAlarmInSelectedRows = function (alarm) {
            var j,
                selectedRows = self.selectedRows(),
                jlen = selectedRows.length;

            for (j = 0; j < jlen; j++) {
                if (selectedRows[j]._id === alarm._id)
                    return true;
            }
            return false;
        },
        utilGetConfig = (methodName, parms) => {
            let result;

            if (typeof dti !== 'undefined' && dti.utility !== undefined) {
                result = dti.utility.getConfig(methodName, [parms]);
            } else if (window.getConfig !== undefined) {
                result = window.getConfig(methodName, [parms]);
            }

            return result;
        },
        initAlarm = function (alarm, skipSelected) {
            var selected = false;

            if (!skipSelected) {
                selected = isAlarmInSelectedRows(alarm);
            }

            // Add & initialize the isSelected observable
            alarm.isSelected = ko.observable(selected);

            // Make ackStatus observable
            alarm.ackStatus = ko.observable(alarm.ackStatus).extend({ rateLimit: 100 });

            // Make ackUser observable
            alarm.ackUser = ko.observable(alarm.ackUser);

            // Add pretty date observable to alarm
            alarm.prettyDate = ko.observable(getPrettyDate(alarm.msgTime));

            // Add pretty time observable to alarm
            alarm.prettyTime = getPrettyTime(alarm.msgTime);

            // Add the alarm class text to the alarm
            alarm.alarmClass = alarmClassEnums[alarm.almClass];

            // If this alarm has been acknowledged, build the acknowledged info string
            alarm.ackInfo = ko.observable('');
            if (alarm.ackStatus() === ACK_DONE) {
                alarm.ackInfo(getAckInfoString(alarm));
            }

            // Add the displayId key if it doesn't exist
            if (!alarm.displayId) {
                alarm.displayId = 0;
            }

            // Build concatenated name string & attach to alarm
            alarm.Name = utilGetConfig("Utility.getPointName", alarm.path);

            alarm.msgText = alarm.msgText.replace("%NAME", alarm.Name);  // server level sets %NAME place holder
        },
        receiveAlarms = function (data, alarmTable) {
            // Throw alarms away if reqID defined and we have a mismatch. **If reqID is undefined we've received unsolicited
            // alarms from the server and we always update with our list with the received results
            if (data.reqID && data.reqID !== alarmTable.reqID) {
                _log('receiveAlarms() Throwing away ' + alarmTable.name + ' alarms from server (reqID mismatch)', data, new Date());
                _log(' ---------   data.reqID = ' + data.reqID + '     alarmTable.reqID = ' + alarmTable.reqID);
                return;
            }

            var len = data.alarms ? data.alarms.length : 0,
                view = alarmTable.view,
                sortAscending = view.sortAscending(),
                queue = alarmUpdateQueue[alarmTable.name],
                page,
                q,
                i;

            _log('Receiving ' + alarmTable.name + ' alarms from server', data, new Date());

            window.clearTimeout(alarmTable.timeoutID);
            alarmTable.timeout(false);

            for (i = 0; i < len; i++) {
                initAlarm(data.alarms[i]);
            }
            alarmTable.list(len ? data.alarms : []);
            alarmTable.count(data.count);

            // It's very important we do not clear our gettingData flag until after we've updated our alarm list
            // and before we process the receive queue, because the receiveAlarmUpdate() routine will walk the
            // alarms list to determine if it needs to add an alarm or not.
            alarmTable.gettingData(false);

            // If alarm updates were received while we were waiting on our data
            if ((len = queue.length)) {
                for (i = 0; i < len; i++) {
                    q = queue[i];
                    receiveAlarmUpdate(q.data, q.action, alarmTable, true);
                }
                queue.splice(0, len);
            }

            updateNumberOfPages(data.count, alarmTable);

            // Make sure the the view's  page number (that is using this alarm set) isn't larger than the number of pages we have
            // validateViewPageNumber(alarmTable.view, alarmTable);

            if (alarmTable.view.id === self.currentView().id) {
                if (view.gotoPageOne) {
                    view.pageNumber(1);
                    view.gotoPageOne = false;
                }
                updateViewPaused();

                // If the scroll bar is sticky
                if (alarmTable.stickyScrollBar) {
                    // Clear the sticky flag (applies to one request only)
                    alarmTable.stickyScrollBar = false;
                } else {
                    $elAlarms.scrollTop(0);
                }
            }
        },
        // This routine is directly called from a computed. All ko observables should be accessed with .peek()
        requestAlarms = function (alarmTable) {
            var name = alarmTable.name,
                date = new Date(),
                uniqueID = date.getTime(),
                reqObj = {},
                requestTimeout = function (almTable) {
                    almTable.gettingData(false);
                    almTable.timeout(true);
                };

            alarmTable.refresh(false);

            buildAlarmRequestObject(alarmTable, reqObj);

            reqObj.reqID = alarmTable.reqID = uniqueID;

            alarmTable.gettingData(true);

            _log('requestAlarms() Requesting ' + name + ' alarms from server.  uniqueID = ', uniqueID, reqObj, date);

            socketEmit(name, reqObj);

            alarmTable.timeout(false);
            window.clearTimeout(alarmTable.timeoutID);
            alarmTable.timeoutID = window.setTimeout(function () {
                requestTimeout(alarmTable);
            }, GETTING_DATA_TIMEOUT);
        },
        // This routine is indirectly called from a computed. All ko observables should be accessed with .peek()
        buildAlarmRequestObject = function (alarmTable, reqObj) {
            var pointAttribs,
                dateTimeOptions,
                alarmClassOptions,
                alarmCatOptions,
                i,
                len,
                key,
                pointType,
                val,
                l_startDate = 0,
                l_endDate = 0,
                view = alarmTable.view,
                filters = view.filters,
                sortAscending = view.sortAscending.peek(),
                nPages = alarmTable.numberOfPages.peek();

            reqObj.itemsPerPage = PAGE_SIZE;
            reqObj.numberItems  = BUFFER_SIZE;

            reqObj.sort = sortAscending ? 'asc':'desc';
            reqObj.currentPage = view.gotoPageOne ?  1 : view.pageNumber.peek();

            pointAttribs = filters.pointAttribs.options;
            for (key in pointAttribs) {
                if (key === 'pointTypes') {
                    // pointTypes array length of 0 indicates all point types should be included. The server will
                    // give us all point types if we do not send the 'pointTypes' key.
                    if (availablePointTypes) {
                        if (pointAttribs[key].length > 0) {
                            reqObj[key] = [];
                            for (pointType in pointAttribs[key]) {
                                reqObj[key].push(availablePointTypes[pointAttribs[key][pointType]]);
                            }
                        }
                    }
                } else {
                    val = pointAttribs[key];
                    // A value of undefined means we require that the name segment be empty
                    if (val === undefined) {
                        reqObj[key] = null; // We can't send undefined (stringify strips it out); server looks for null
                    }
                    // If our value is not blank, add it to our filters
                    else if (val !== "") {
                        reqObj[key] = val;
                    }
                    // Do not add name segment to our request object if it is empty string
                }
            }

            alarmClassOptions = filters.alarmClass.options;
            len = alarmClassOptions.length;
            // If all options are enabled, do not add to request object (server assumes all if we send none)
            if (len < 4) {
                reqObj.almClass = [];
                for (i=0, len = alarmClassOptions.length; i < len; i++) {
                    reqObj.almClass.push(alarmClassEnums[alarmClassOptions[i]]);
                }
            }
            alarmCatOptions = filters.alarmCategory.options;
            len = alarmCatOptions.length;
            // If all options are enabled, do not add to request object (server assumes all if we send none)
            if (len < 4) {
                reqObj.msgCat = [];
                for (i=0; i < len; i++) {
                    reqObj.msgCat.push(alarmCategoryEnums[alarmCatOptions[i]]);
                }
            }

            dateTimeOptions = filters.dateTime.options;
            if (!dateErrors) {
                l_startDate = Date.parse(dateTimeOptions.dateFrom + ' ' + dateTimeOptions.timeFrom);
                l_startDate = (l_startDate === null) ? 0 : Math.floor(l_startDate / 1000);

                l_endDate = Date.parse(dateTimeOptions.dateTo + ' ' + dateTimeOptions.timeTo);
                l_endDate = (l_endDate === null) ? 0 : Math.floor(l_endDate / 1000);
            }
            reqObj.startDate = l_startDate;
            reqObj.endDate = l_endDate;
        },
        getStoreData = function () {
            var storeData = store.get(storeKey) || {};

            if (storeData.hasOwnProperty('sessionId') && storeData.sessionId !== sessionId) {
                store.remove(storeKey);
                storeData = {};
            }
            return storeData;
        },
        storeViewFilters = function (view) {
            var storeData = store.get(storeKey),
                viewData = ko.toJS(view);

            if (!storeData) {
                storeData = {};
                storeData.sessionId = sessionId;
            }
            if (storeData[windowUpi] === undefined) {
                storeData[windowUpi] = {};
            }

            // Strip off the keys that we do not need
            delete viewData.alarmTable;
            delete viewData.alarmTableName;
            delete viewData.children;
            delete viewData.defaultFilters;
            delete viewData.group;

            storeData[windowUpi].currentViewId = view.id;
            storeData[windowUpi][view.id] = viewData;

            store.set(storeKey, storeData);
        },
        saveViewFilters = function (view) {
            var category,
                cat,
                viewCat,
                opt,
                viewOptions,
                found,
                index,
                i,
                len;

            for (category in self.filters) {
                // Category shortcuts
                cat = self.filters[category];
                viewCat = view.filters[category];

                // Get and set the visibility of this filter category set
                cat.visible(viewCat.visible);

                // Loop through all possible filter options, enabling the ones the view requires
                len = cat.options.length;
                for (i = 0; i < len; i++) {
                    opt = cat.options[i];
                    viewOptions = viewCat.options;

                    if (category === "dateTime" || category === "pointAttribs") {
                        viewOptions[opt.text] = opt.value();
                    } else {
                        found = ((index = viewOptions.indexOf(opt.text)) > -1);

                        if (opt.isActive() && !found) {
                            viewOptions.push(opt.text);
                        } else if (!opt.isActive() && found) {
                            viewOptions.splice(index, 1);
                        }
                    }
                }
            }
            storeViewFilters(view);
        },
        resetViewFilters = function (view) {
            view.filters = deepClone(view.defaultFilters);
        },
        initViewGroup = function (group) {
            var viewGroup = self[group],
                childView,
                view,
                i,
                len,
                j,
                jlen,
                storeData = getStoreData(),
                initView = function (view) {
                    // Add the group this view belongs to
                    view.group = group;

                    // Init the alarm table used by this view
                    view.alarmTable = alarmTables[view.alarmTableName()];

                    if (storeData.hasOwnProperty(windowUpi) && storeData[windowUpi].hasOwnProperty(view.id)) {
                        var data = storeData[windowUpi][view.id];

                        // Add a sort key (presently, sort is applied to the message time field)
                        view.sortAscending = ko.observable(data.sortAscending);

                        // Add the current page number to this view
                        view.pageNumber = ko.observable(data.pageNumber);

                        // This flag tells us if we need to force page 1 when alarms are refreshed
                        view.gotoPageOne = data.gotoPageOne;

                        // Add a force refresh flag. This flag is evaluated when the view is requested
                        view.forceRefresh = data.forceRefresh;

                        // View paused flag (causes incoming alarms to be thrown away and not displayed to the user)
                        view.paused = ko.observable(data.paused);

                        // Add the filter options object
                        view.filters = data.filters;
                    } else {
                        // Add a sort key (presently, sort is applied to the message time field)
                        view.sortAscending = ko.observable(false);

                        // Add the current page number to this view
                        view.pageNumber = ko.observable(1);

                        // This flag tells us if we need to force page 1 when alarms are refreshed
                        view.gotoPageOne = true;

                        // Add a force refresh flag. This flag is evaluated when the view is requested
                        view.forceRefresh = false;

                        // View paused flag (causes incoming alarms to be thrown away and not displayed to the user)
                        view.paused = ko.observable(false);

                        // Add the filter options object
                        view.filters = {};
                        resetViewFilters(view);
                    }
                };

            for (i = 0, len = viewGroup.length; i < len; i++) {
                // Shortcut
                view = viewGroup[i];

                initView(view);

                // Initialize children views
                for (j = 0, jlen = view.children.length; j < jlen; j++) {
                    // Shortcut
                    childView = view.children[j];

                    // Add a reference back to the parent object. We call it daddy since 'parent' is reserved
                    childView.daddy = view;

                    initView(childView);
                }
            }
        },
        Filter = function (cat, obj) {
            var testFn;

            this.text = obj.text;
            this.id = obj.text;

            if (cat === 'dateTime' || cat === 'pointAttribs') {
                if (typeof obj.value === 'object') {
                    this.value = ko.observableArray(obj.value);
                } else {
                    this.value = ko.observable(obj.value);
                }
            } else {
                testFn = obj.test;

                this.active = ko.observable(true);
                this.shortText = obj.shortText;
                this.category = cat;

                // This function uses peek because it is indirectly called from a computed
                this.buildOption = function(almClasses, msgCats) {
                    if(this.active.peek()) {
                        if(obj.almClass !== undefined) {
                            almClasses.push(obj.almClass);
                        } else if(obj.msgCat !== undefined) {
                            msgCats.push(obj.msgCat);
                        }
                    }
                };
                this.isActive = function () {
                    return this.active();
                };
                this.set = function () {
                    this.active(true);
                };
                this.clr = function () {
                    this.active(false);
                };
                this.toggle = function () {
                    this.active(!this.active());
                };
                this.test = function (row) {
                    if (this.active()) {
                        return true;
                    }
                    return !testFn(row);
                };
            }

            return this;
        },
        initFilterOptions = function () {
            var category,
                cat,
                option,
                selfCat,
                selfOptions,
                localFilters = deepClone(filters);

            self.filters = {};

            for (category in localFilters) {
                // Create the filter category
                self.filters[category] = {};

                // Shortcut
                selfCat = self.filters[category];

                // Create the visible and option keys
                selfCat.visible = ko.observable();
                selfCat.options = [];

                // Shortcut
                selfOptions = selfCat.options;

                // Shortcut to filter category (not self)
                cat = localFilters[category];

                for (option in cat) {
                    selfOptions.push(new Filter(category, cat[option]));

                    // Extend the array with an associative pointer to this array entry.
                    // For example, now we can access the 'Emergency' filter option as:
                    // 'self.filters.alarmClass.options.Emergency', in addition to 'self.filters.alarmClass.options[0]'
                    selfOptions[option] = selfOptions[selfOptions.length - 1];
                }
            }
        },
        validateViewPageNumber = function (view, alarmTable) {
            var numberOfPages = alarmTable.numberOfPages();

            // If we only receive the view argument, get a reference to the alarm table used by this view
            alarmTable = alarmTable || alarmTables[view.alarmTableName()];

            // If we have less pages than we used to have, then
            if (numberOfPages < view.pageNumber()) {
                view.pageNumber(numberOfPages);
            }
        },
        applyFilter = function (filterWithoutDelay) {
            var alarmTable = self.alarms.peek(),
                view = alarmTable.view,
                checkFilterGap = function (view) {
                    saveViewFilters(view);
                    filterChange = new Date().getTime();
                    self.alarms().refresh(true);
                };

            _log('applyFilter() Received filter request', new Date());

            // Normally we would let the alarm getter set this flag, but the delay between changing a filter and the UI
            // indicating we're getting data looks funny.  So we set this flag here to immediately indicate we're
            // getting data (even though we actually wait a moment to make sure there are no other changes coming).
            // In this case, gettingData gets set twice.  Once here, and again in the getter computed (getRecentAlarms for ex.)
            alarmTable.gettingData(true);
            view.gotoPageOne = true;

            if (filterWithoutDelay) {
                checkFilterGap(view);
            } else {
                setTimeout(function () {
                    checkFilterGap(view);
                }, FILTER_CHANGE_DELAY);
            }
        },
        applyView = function (targetView) {
            var curView = self.currentView(),
                curGroup = curView.group,
                curTableName = curView.alarmTableName(),
                targetGroup = targetView.group,
                targetTable = targetView.alarmTable,
                targetTableName = targetTable.name,
                forceRefresh = targetView.forceRefresh,
                scrollPosition,
                childView,
                category,
                cat,
                viewCat,
                option,
                opt,
                viewOptions,
                i,
                len,
                alarms,
                alarm,
                forceChildrenRefresh = function (daddy, exception) {
                    var i,
                        child,
                        children = daddy.children,
                        len = children.length;

                    for (i = 0; i < len; i++) {
                        // Shortcut
                        child = children[i];

                        if (child.title !== exception) {
                            // Set the view's force refresh flag. The alarms for this view won't actually
                            // be refreshed until the next time this veiw is requested
                            child.forceRefresh = true;
                        }
                    }
                };

            // We have to pause the computeds while we update some of our filters, otherwise the computed
            // would fire off an alarms request to the server prematurely. This routine will call the alarms request
            // via the refresh observable (we have computeds that monitor the refresh flags)
            self.nameFilterPaused(true);
            self.dateTimeFilterPaused(true);

            // Get new filters from the selected view
            for (category in self.filters) {
                // Category shortcuts
                cat = self.filters[category];
                viewCat = targetView.filters[category];

                // Get and set the visibility of this filter category set
                cat.visible(viewCat.visible);

                // Loop through all possible filter options, enabling the ones the view requires
                len = cat.options.length;
                for (i = 0; i < len; i++) {
                    opt = cat.options[i];
                    viewOptions = viewCat.options;

                    if (category === 'dateTime') {
                        var fn,
                            method,
                            $el = $('#' + opt.id),
                            d = Date.parse(viewOptions[opt.text].value);

                        opt.value(viewOptions[opt.text]);

                        if (opt.text === "dateFrom" || opt.text === "dateTo") {
                            fn = 'datepicker';
                            method = 'setDate';
                        } else {
                            fn = 'timepicker';
                            method = 'setTime';
                        }
                        if (d !== null) {
                            $el[fn](method, d);
                        } else {
                            // TODO How to clear the datepicker??
                        }
                    } else if (category === 'pointAttribs') {
                        opt.value(viewOptions[opt.text]);
                    } else {
                        opt.active(viewOptions.indexOf(opt.text) > -1);
                    }
                }
            }

            // Save our scroll position before we change views
            curView.scrollPosition = $elAlarms.scrollTop();

            // Save a cross reference to the view in the alarm table
            targetTable.view = targetView;

            // Save a reference to this view. *the self.alarms computed is automatically updated immediately following
            self.currentView(targetView);

            // Reset the scroll bar
            scrollPosition = targetView.scrollPosition || 0;
            $elAlarms.scrollTop(scrollPosition);

            // Update the view title
            self.viewTitle(targetView.pageTitle ? targetView.pageTitle : targetView.title);

            // See if we need to refresh the alarms list
            if (forceRefresh || (curGroup !== targetGroup) || (targetGroup === 'customViews') || (curTableName === targetTableName)) {
                self.alarms().refresh(true);

                if (forceRefresh) {
                    targetView.forceRefresh = false;
                }
            } else {
                // We're not refreshing the page but we still have to build the isSelected state based on the selectedRows array
                // (because the user could have selected one of these alarms in another view). isSelected is always determined when alarms
                // are received from the server which is why we don't need to do it above.
                alarms = self.alarms().list();
                len = alarms.length;

                nSelectedAlarmsOnPage = 0;
                for (i = 0; i < len; i++) {
                    alarm = alarms[i];
                    if (isAlarmInSelectedRows(alarm) === true) {
                        alarm.isSelected(true);
                        nSelectedAlarmsOnPage++;
                    } else {
                        alarm.isSelected(false);
                    }
                }
            }

            // See if we need to set the force refresh flag on our special-case views
            if (targetGroup === 'defaultViews' && targetTableName === 'Active') {
                if (targetView.title === 'Active') {
                    forceChildrenRefresh(targetView);
                } else {
                    targetView.daddy.forceRefresh = true;
                    forceChildrenRefresh(targetView.daddy, targetView.title);
                }
            }

            // Release the computed pause
            self.nameFilterPaused(false);
            self.dateTimeFilterPaused(false);
        },
        initAlarmTables = function () {
            var table,
                alarmTable;
            alarmTables.Recent.view = self.defaultViews[0];
            alarmTables.Active.view = self.defaultViews[1];
            alarmTables.Unacknowledged.view = self.defaultViews[2];

            for (table in alarmTables) {
                alarmTable = alarmTables[table];
                if (alarmTable.name !== self.currentView().alarmTableName()) {
                    alarmTable.refresh(true);
                }
            }
        },
        refreshAlarmLists = function () {
            for (var key in alarmTables) {
                alarmTables[key].refresh(true);
            }
        },
        reformatPrintedDates = function () {
            var i,
                len,
                alarmTable,
                alarm,
                alarms;

            for (alarmTable in alarmTables) {
                alarms = alarmTables[alarmTable].list();
                len = alarms.length;
                for (i = 0; i < len; i++) {
                    alarm = alarms[i];
                    alarm.prettyDate(getPrettyDate(alarm.msgTime));
                    if (alarm.ackStatus === ACK_DONE) {
                        alarm.ackInfo(getAckInfoString(alarm));
                    }
                }
            }
            setupMidnightNotify();
        },
        setupMidnightNotify = function () {
            var now = new Date(),
                tom = Date.today().addDays(1);

            window.setTimeout(reformatPrintedDates, tom - now);
        },
        showPointReview = function (data) {
            var upi = parseInt(data.upi, 10);
            if (upi > 0) {
                dtiUtility.openWindow({
                    upi: upi,
                    pointType: data.PointType
                });
            }
        },
        findView = function (key, keyValue) {
            var i,
                len,
                j,
                jlen,
                viewGroups = [self.defaultViews, self.customViews];

            len = viewGroups.length;
            for (i = 0; i < len; i++) {
                var viewGroup = viewGroups[i];

                jlen = viewGroup.length;
                for (j = 0; j < jlen; j++) {
                    var view = viewGroup[j];

                    if (view.hasOwnProperty(key)) {
                        if (view[key] === keyValue) {
                            return view;
                        }
                    }
                }
            }
            return null;
        },
        updateViewPaused = function () {
            var view = self.currentView(),
                sortAsc = view.sortAscending(),
                curPage = view.pageNumber(),
                numPages = self.alarms().numberOfPages(),
                paused = false;

            if (curPage > 1 && curPage < numPages) {
                paused = true;
            } else if (curPage === 1) {
                if (sortAsc) {
                    paused = true;
                }
            } else {
                if (!sortAsc) {
                    paused = true;
                }
            }
            view.paused(paused);
            storeViewFilters(view);
        },
        filters = {
            alarmClass: {
                Emergency: {
                    text: 'Emergency',
                    shortText: 'Emer',
                    almClass: alarmClassEnums.Emergency,
                    test: function (row) {
                        return row.almClass === 2;
                    }
                },
                Critical: {
                    text: 'Critical',
                    shortText: 'Crit',
                    almClass: alarmClassEnums.Critical,
                    test: function (row) {
                        return row.almClass === 1;
                    }
                },
                Urgent: {
                    text: 'Urgent',
                    shortText: 'Urg',
                    almClass: alarmClassEnums.Urgent,
                    test: function (row) {
                        return row.almClass === 3;
                    }
                },
                Default: {
                    text: 'Default',
                    shortText: 'Def',
                    almClass: alarmClassEnums.Default,
                    test: function (row) {
                        return row.almClass === 0;
                    }
                }
            },
            alarmCategory: {
                Events: {
                    text: 'Events',
                    shortText: 'Evts',
                    msgCat: alarmCategoryEnums.Events,
                    test: function (row) {
                        return row.msgCat === 0;
                    }
                },
                Alarms: {
                    text: 'Alarms',
                    shortText: 'Alms',
                    msgCat: alarmCategoryEnums.Alarms,
                    test: function (row) {
                        return row.msgCat === 1;
                    }
                },
                Return: {
                    text: 'Return',
                    shortText: 'Ret',
                    msgCat: alarmCategoryEnums.Return,
                    test: function (row) {
                        return row.msgCat === 2;
                    }
                },
                Maintenance: {
                    text: 'Maintenance',
                    shortText: 'Maint',
                    msgCat: alarmCategoryEnums.Maintenance,
                    test: function (row) {
                        return row.msgCat === 3;
                    }
                }
            },
            other: {
                Acknowledge: {
                    text: 'Requires Acknowledgement',
                    shortText: 'Ack',
                    test: function (row) {
                        return row.ackStatus() !== 1;
                    }
                }
            },
            dateTime: {
                dateFrom: {
                    text: 'dateFrom',
                    value: ''
                },
                dateTo: {
                    text: 'dateTo',
                    value: ''
                },
                timeFrom: {
                    text: 'timeFrom',
                    value: ''
                },
                timeTo: {
                    text: 'timeTo',
                    value: ''
                }
            },
            pointAttribs: {
                path: {
                    text: 'path',
                    value: []
                },
                terms: {
                    text: 'terms',
                    value: ''
                },
                pointTypes: {
                    text: 'pointTypes',
                    value: []
                }
            }
        },
        alarmTables = {
            Recent: {
                name: 'Recent',
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
            },
            Active: {
                name: 'Active',
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
            },
            Unacknowledged: {
                name: 'Unacknowledged',
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
            }
        };

    self.filtersPlaceHolder = deepClone(filters);

    self.defaultViews = [
        {
            title: 'Recent',
            id: 0,
            alarmTableName: ko.observable('Recent'),
            defaultFilters: {
                alarmClass: {
                    visible: true,
                    options: ['Emergency', 'Critical', 'Urgent', 'Default']
                },
                alarmCategory: {
                    visible: true,
                    options: ['Events', 'Alarms', 'Return', 'Maintenance']
                },
                other: {
                    visible: false,
                    options: []
                },
                dateTime: {
                    visible: true,
                    options: {
                        dateFrom: '',
                        dateTo: '',
                        timeFrom: '',
                        timeTo: ''
                    }
                },
                pointAttribs: {
                    visible: true,
                    options: {
                        path: [],
                        terms: "",
                        pointTypes: []
                    }
                }
            },
            children: []
        }, {
            title: 'Active',
            id: 1,
            alarmTableName: ko.observable('Active'),
            defaultFilters: {
                alarmClass: {
                    visible: true,
                    options: ['Emergency', 'Critical', 'Urgent', 'Default']
                },
                alarmCategory: {
                    visible: false,
                    options: ['Alarms']
                },
                other: {
                    visible: false,
                    options: []
                },
                dateTime: {
                    visible: false,
                    options: {
                        dateFrom: '',
                        dateTo: '',
                        timeFrom: '',
                        timeTo: ''
                    }
                },
                pointAttribs: {
                    visible: true,
                    options: {
                        path: [],
                        terms: "",
                        pointTypes: []
                    }
                }
            },
            children: []
        }, {
            title: 'Unacknowledged',
            id: 2,
            alarmTableName: ko.observable('Unacknowledged'),
            defaultFilters: {
                alarmClass: {
                    visible: true,
                    options: ['Emergency', 'Critical', 'Urgent', 'Default']
                },
                alarmCategory: {
                    visible: true,
                    options: ['Alarms', 'Return']
                },
                other: {
                    visible: false,
                    options: [],
                },
                dateTime: {
                    visible: false,
                    options: {
                        dateFrom: '',
                        dateTo: '',
                        timeFrom: '',
                        timeTo: ''
                    }
                },
                pointAttribs: {
                    visible: true,
                    options: {
                        path: [],
                        terms: "",
                        pointTypes: []
                    }
                }
            },
            children: []
        }
    ];

    self.customViews = [];

    // Dummy conditional for temporary variable creation
    if (true) {
        var view = null, // Very important we init to null in case findView isn't called
            storeData = getStoreData();
        if (storeData.hasOwnProperty(windowUpi)) {
            view = findView('id', storeData[windowUpi].currentViewId);
        }
        if (view === null) {
            view = self.defaultViews[0];
        }
        self.currentView = ko.observable(view);
    }

    self.viewTitle = ko.observable();
    self.selectedRows = ko.observableArray([]);
    self.currentPage = ko.observable(1);
    self.alarmDetailVisible = ko.observable(false);

    //------ Alarm socket handlers
    socket.on('acknowledgeResponse', function (data) {
        var i,
            _id,
            ids,
            len,
            result = data.result;

        _log('Received ack response:', data, new Date());

        // If we can't find the submitted acknowledge request, it has already timed out and we already deleted
        // our request object.
        if (ackRequests.hasOwnProperty[data.reqID] === false) {
            _log('Unexpected response. This request has already timed out. Forcing alarms refresh.');

            // We have no choice but to refresh our alarm lists from the server to bring everything back into sync.
            refreshAlarmLists();
            return;
        }

        window.clearTimeout(ackRequests[data.reqID].timeoutID);

        ids = ackRequests[data.reqID].ids;
        len = ids.length;

        if (!result) {
            for (i = 0; i < len; i++) {
                updateAckStatus({
                    _id: ids[i],
                    ackStatus: ACK_ERROR
                });
            }
        }
        delete ackRequests[data.reqID];
    });

    socket.on('unacknowledged', function (data) {
        receiveAlarms(data, alarmTables.Unacknowledged);
    });

    socket.on('activeAlarms', function (data) {
        receiveAlarms(data, alarmTables.Active);
    });

    socket.on('recentAlarms', function (data) {
        receiveAlarms(data, alarmTables.Recent);
    });

    socket.on('removingActiveAlarm', function (data) {
        // data: {
        //     newAlarm: object,
        //     pointId: int
        // }
        receiveAlarmUpdate(data, 'DELETE', alarmTables.Active);
    });

    socket.on('removingUnackAlarm', function (data) {
        // data: {
        //      _id: string
        //      ackStatus: int
        //      ackUser: string
        //      ackTime: int (Unix Epoch)
        // }
        receiveAlarmUpdate(data, 'DELETE', alarmTables.Unacknowledged);
    });

    socket.on('newRecentAlarm', function (data) {
        // data: {
        //     newAlarm: object,
        // }
        receiveAlarmUpdate(data, 'ADD', alarmTables.Recent);
    });

    socket.on('newUnackAlarm', function (data) {
        // data: {
        //     newAlarm: object,
        // }
        receiveAlarmUpdate(data, 'ADD', alarmTables.Unacknowledged);
    });

    socket.on('addingActiveAlarm', function (data) {
        // data: {
        //     newAlarm: object,
        // }
        receiveAlarmUpdate(data, 'ADD', alarmTables.Active);
    });

    socket.on('connect', function () {
    });

    socket.on('reconnect', function () {
        refreshAlarmLists();
    });

    socket.on('reconnecting', function () {
        var retries = 0,
            reconnect = function () {
                $.ajax({
                    url: '/home'
                }).done(function (data) {
                    isReconnecting = false;
                    _log('reconnected', new Date());
                }).fail(function (data) {
                    retries++;
                    if (retries < 2) {
                        _log('retrying reconnect');
                        reconnect();
                    } else {
                        isReconnecting = false;
                    }
                });
            };
        if (!isReconnecting) {
            isReconnecting = true;
            _log('reconnecting', new Date());
            reconnect();
        }
    });

    //------ Misc. interactivity functions-------------------------
    self.toHexColor = function(color) {
        return '#' + color;
    };

    self.toggleOption = function (data, event) {
        var onCount = 0,
            options,
            option,
            curVal,
            active,
            len,
            i;

        // In the future, part of our filter set will include 'Active' and 'Unacknowledged'.  When implemented,
        // we'll need to update the current view's alarmTableName and alarmTable prpoerties based on the filter selection.

        // Event type is either left-click ('click') or right-click ('contextmenu')
        // For a left-click, we simple toggle the option clicked
        if (event.type === "click") {
            data.toggle();
        }
        // For a right-click, we toggle all the OTHER options
        else {
            // Get the current value of the clicked item
            curVal = data.active();

            // Always enable the option that was right-clicked
            data.set();

            if (data.category === 'alarmClass') {
                options = self.filters.alarmClass.options;
            } else {
                options = self.filters.alarmCategory.options;
            }
            len = options.length;

            // If our option is inactive, we will always disable all the others
            if (!curVal) {
                active = false;
            }
            else {
                // If the other alarm options are a mixture of enabled and disabled, we always disable them
                // If the other alarm options are all off, we enable all of them

                // Let's assume all other alarm options are off
                active = true;
                for (i = 0; i < len; i++) {
                    option = options[i];
                    if ((option.text !== data.text) && option.isActive()) {
                        active = false;
                        break;
                    }
                }
            }

            // Finally we're ready to set the state of all the other options
            for (i = 0; i < len; i++) {
                option = options[i];
                if (option.text !== data.text) {
                    option.active(active);
                }
            }
        }
        applyFilter();

        // This is to keep the dropdown open (if user clicked from the dropdown)
        event.stopPropagation();
    };

    self.userHasPermissionToAck = function (alarm) {
        var hasAckPermission = userHasPermission(alarm, permissionLevels.ACKNOWLEDGE);
        return hasAckPermission;
    };

    self.ackAlarm = function (alarm, event) {
        if (self.ackRequired(alarm)) {
            alarm.ackStatus(ACK_IN_PROGRESS);
            updateAckStatus(alarm, self.alarms().name);
            sendAcknowledge([alarm._id]);
        }
    };

    self.ackAlarms = function () {
        var i,
            alarm,
            alarms = self.alarms().list(),
            n = alarms.length,
            len = (n > 200) ? 200:n,
            ackList = [];

        for (i = 0; i < len; i++) {
            alarm = alarms[i];

            if (alarm.isSelected() && self.ackRequired(alarm) && self.userHasPermissionToAck(alarm)) {
                alarm.ackStatus(ACK_IN_PROGRESS);
                updateAckStatus(alarm, self.alarms().name);
                ackList.push(alarm._id);
            }
        }

        // The UI button that calls this routine is not deactivated after it's selected. We need to make sure
        // we found selected alarms with ACK_REQUIRED before calling the sendAcknowledge command
        if (ackList.length) {
            sendAcknowledge(ackList);
        }
    };

    self.ackRequired = function (alarm) {
        var ackStatus = alarm.ackStatus();
        return (ackStatus && (ackStatus !== ACK_DONE) && (ackStatus !== AUTO_ACK));
    };

    self.openDisplay = function (data) {
        var upi = parseInt(data._id, 10),
            alarmDetail = self.alarmDetail,
            openTheWindow = (pointType) => {
                dtiUtility.openWindow({
                    upi: upi,
                    pointType: pointType
                });
                alarmDetail.gettingData(false);
            };

        if (upi > 0) {
            alarmDetail.gettingData(true);
            dtiUtility.getConfig('Utility.pointTypes.getPointTypeNameFromId', upi, openTheWindow);
        }
    };

    self.refreshAlarms = function () {
        self.alarms().refresh(true);
    };

    //------ Alarm row select handlers ---------------------------
    self.selectRow = function (data, event) {
        var srcClass = event.target.classList,
            ackStatus = data.ackStatus(),
            $target = $(event.target),
            idForCheckBox = ($target[0].attributes.for ? $target[0].attributes.for.nodeValue : ""),
            $targetsCheckBoxField = (idForCheckBox !== "" ? $target.parent().find("#" + idForCheckBox) : null),
            isCheckBox = $target.is(":checkbox") || ($targetsCheckBoxField ? $targetsCheckBoxField.is(":checkbox") : false);

        if (srcClass && srcClass.length) {
            if (srcClass.contains("msgText")) {
                if (event.type === "click") {
                    showPointReview(data);
                } else {
                    // Right-click changes the name filter to match this point's name
                    changePointAttribsFilter(data);
                }
                return;
            }
            if (srcClass.contains("fa-sitemap")) {
                self.openDisplay(data);
                return;
            }
            if (srcClass.contains("tableButton")) {
                return;
            }
        }

        var i,
            alarmTable = self.alarms(),
            alarmTableName = alarmTable.name,
            alarms = alarmTable.list(),
            len = alarms.length,
            selected,
            selectedRows = self.selectedRows,
            clicks,
            isBetween = function (val, end1, end2) {
                if (end1 > end2) {
                    return (val < end1) && (val > end2);
                } else {
                    return (val < end2) && (val > end1);
                }
            },
            getIndexOf = function (_id) {
                for (i = 0; i < len; i++) {
                    if (alarms[i]._id === _id) {
                        return i;
                    }
                }
                return null;
            },
            updateSelection = function (select, ndx1, ndx2) {
                var i,
                    start,
                    stop;

                if (ndx1 < ndx2) {
                    start = ndx1;
                    stop = ndx2;
                } else {
                    start = ndx2;
                    stop = ndx1;
                }

                for (i = start; i <= stop; i++) {
                    var alarm = alarms[i],
                        isSelected = alarm.isSelected();

                    if (select && !isSelected) {
                        selectAlarm(alarm);
                    } else if (!select && isSelected) {
                        deSelectAlarm(alarm);
                    }
                }
            };

        if (!clickHistory.hasOwnProperty(alarmTableName)) {
            var p = clickHistory[alarmTableName] = {};
            p.lastClickId = null;
            p.lastShiftClickId = null;
            p.shiftRelease = true;
        }
        clicks = clickHistory[alarmTableName];

        // For the checkbox, the click binding happens after the value binding. So when we arrive
        // our observable has already been updated. Hence, the selected state prior to arriving here
        // is opposite the current state.
        if (isCheckBox) {
            selected = !data.isSelected();
            if (!event.shiftKey) {
                event.ctrlKey = true;
            }
        } else {
            selected = data.isSelected();
        }

        if (!event.shiftKey || clicks.lastClickId === null) {
            if (!event.ctrlKey && !isCheckBox) {
                self.selectNone();
            }

            if (selected) {
                deSelectAlarm(data);
            } else {
                selectAlarm(data);
            }
            clicks.lastClickId = data._id;
            clicks.shiftRelease = true;
        } else {
            if (clicks.lastClickId !== null) {
                var c = getIndexOf(clicks.lastClickId),
                    sc = alarms.indexOf(data),
                    prev_sc = getIndexOf(clicks.lastShiftClickId);

                // 'c' represents our anchor row...it is the index of where the user Clicked WITHOUT the shift key
                // 'sc' is the row index the user just Shift Clicked
                // 'prev_sc' is the row index the user just previously Shift Clicked

                // Alarms are always shifting in and out of our buffers, so we need to make sure we can still reach the row
                if (c !== null) {
                    // If the user has previously selected any rows WITHOUT the shift key
                    if (clicks.shiftRelease) {
                        updateSelection(!selected, c, sc);
                    }
                    // This is a continuation of a shift select. We may be removing rows, adding rows, or both.
                    else if (prev_sc !== null) {
                        // If the clicked row is between the anchor row and the previously clicked row
                        if (isBetween(sc, c, prev_sc)) {
                            updateSelection(!selected, sc, prev_sc);
                        }
                        // If the selected row crosses the anchor row boundary
                        else if ((prev_sc < c && sc > c) || (prev_sc > c && sc < c)) {
                            // Remove the alarms on the boundary side we're coming from
                            updateSelection(!alarms[c].isSelected(), c, prev_sc);
                            // Add the alarms on the boundary side we're going to
                            updateSelection(!selected, c, sc);
                        }
                        else {
                            updateSelection(!selected, sc, prev_sc);
                        }
                    }
                }
            }
            clicks.lastShiftClickId = data._id;
            clicks.shiftRelease = false;
        }
        return true;
    };

    self.selectAll = function (data, event) {
        var alarms = self.alarms().list(),
            n = alarms.length,
            len = (n > 200) ? 200:n,
            alarm,
            i;

        // All alarms are selected. Deselect alarms on this page
        if (self.allSelected() === true) {
            // This routine may be triggered by clicking an input checkbox, or a 'select all' link
            // We only want to deselect all rows if the input was clicked
            if (event.target.tagName === 'INPUT') {
                self.selectNone();
            }
        } else {
            // All alarms are not selected; make them selected!
            for (i = 0; i < len; i++) {
                alarm = alarms[i];

                // We need to check the isSelected so we don't double add to our selectedRows array
                if (!alarm.isSelected()) {
                    selectAlarm(alarm);
                }
            }
        }
        return true;
    };

    self.selectNone = function () {
        var alarms = self.alarms().list(),
            n = alarms.length,
            len = (n > 200) ? 200:n,
            alarm,
            i;

        for (i = 0; i < len; i++) {
            alarm = alarms[i];

            // We need to check the isSelected so we don't remove selectedRows from other pages
            if (alarm.isSelected()) {
                deSelectAlarm(alarm);
            }
        }
    };

    self.selectUnacknowledged = function () {
        var alarms = self.alarms().list(),
            n = alarms.length,
            len = (n > 200) ? 200:n,
            alarm,
            i;

        for (i = 0; i < len; i++) {
            alarm = alarms[i];
            if (self.ackRequired(alarm) && !alarm.isSelected()) {
                selectAlarm(alarm);
            }
        }
    };

    self.deselectAll = function () {
        var alarms = self.alarms().list(),
            len = alarms.length,
            i;

        // Our alarms variable points to alarms().list(), which is our alarms in view (up to 200), plus the alarms in the
        // buffer area of this view. It is important

        // We only have to toggle the isSelected state for selected rows in the current view, because when
        // a new view is applied, each alarm's isSelected state is recalculated based on the contents of
        // self.selectedRows().
        for (i = 0; i < len; i++) {
            alarms[i].isSelected(false);
        }
        self.selectedRows.removeAll();

        nSelectedAlarmsOnPage = 0;
        self.closeAlarmDetail();
    };

    //------ View / Filter functions -----------------------------
    self.changeView = function (view) {
        var currentView = self.currentView();
        // If the requested view is the current view, we have nothing to do
        if (view.id === currentView.id) {
            return;
        }

        dtiUtility.updateWindow('updateTitle', view.title + " Alarms");

        // Update local storage with the name of the new view we're looking at
        storeViewFilters(view);

        // Now we can apply the requested view
        applyView(view);
    };

    self.isCurrentView = function (item) {
        return item.title === self.currentView().title;
    };

    self.toggleViewPaused = function () {
        var view = self.currentView(),
            paused = view.paused(),
            sortAscending = view.sortAscending();

        if (paused) {
            view.gotoPageOne = true;
            self.alarms().refresh(true);
        }
        self.currentView().paused(!paused);
    };

    self.toggleViewSort = function () {
        var sort = self.currentView().sortAscending,
            withoutDelay = true;
        sort(!sort());
        applyFilter(withoutDelay);
    };

    self.showPointFilter = function () {
        var parameters = {
            path: pointAttribsFilterObj.path,
            terms: pointAttribsFilterObj.terms,
            pointTypes: pointAttribsFilterObj.pointTypes
        };

        dtiUtility.showPointFilter(parameters);
        dtiUtility.onPointSelect(filterCallback);
    };

    dtiUtility.onPointFilterSelect(function handlePointFilterSelect (cfg) {
        filterCallback(cfg);
        self.applyNameFilter();
    });

    self.changePage = function (modifier) {
        var alarms = self.alarms(),
            view = self.currentView(),
            page = view.pageNumber,
            nPages = self.alarms().numberOfPages(),
            curPage = page(),
            sortAsc = view.sortAscending(),
            newPage;

        if (modifier === 'begin') {
            modifier = 1 - curPage;
        } else if (modifier === 'end') {
            modifier = alarms.numberOfPages() - curPage;
        }

        newPage = curPage + modifier;
        page(newPage);
        storeViewFilters(view);

        alarms.refresh(true);
    };

    self.resetFilters = function() {
        if (!self.dirty()) {
            return;
        }

        pointAttribsFilterObj = {
            path: [],
            terms: "",
            pointTypes: []
        };

        var view = self.currentView();

        self.clearDateTimeUIFields();

        resetViewFilters(view);

        storeViewFilters(view);

        applyView(view);
    };

    self.clearDateTimeFilter = function () {
        var options = self.filters.dateTime.options,
            placeholderDateFilters = self.filtersPlaceHolder.dateTime,
            len = options.length,
            dirty = false,
            option,
            optionId,
            i;

        self.dateTimeFilterPaused(true);

        for (i = 0; i < len; i++) {
            option = options[i];
            optionId = option.id;

            // If the options is not blank, set our dirty flag
            if (option.value() !== '') {
                dirty = true;
            }

            option.value('');
            placeholderDateFilters[optionId].value = '';
        }

        self.clearDateTimeUIFields();
        self.dateTimeFilterPaused(false);

        if (dirty) {
            options.dateFrom.value.valueHasMutated();
            applyFilter(true);
        }
    };

    self.clearDateTimeUIFields = function () {
        let placeholderDateFilters = self.filtersPlaceHolder.dateTime,
            $fromDatePicker = $dateFrom.pickadate('picker'),
            $fromTimePicker = $timeFrom.pickatime('picker'),
            $toDatePicker = $dateTo.pickadate('picker'),
            $toTimePicker = $timeTo.pickatime('picker');

        placeholderDateFilters.dateFrom.value = '';
        $fromDatePicker.set({select: null});
        placeholderDateFilters.timeFrom.value = '';
        $fromTimePicker[0].value = "";  // revisit once materialize get updated
        // $fromTimePicker.clear();
        placeholderDateFilters.dateTo.value = '';
        $toDatePicker.set({select: null});
        placeholderDateFilters.timeTo.value = '';
        $toTimePicker[0].value = "";  // revisit once materialize get updated
        // $toTimePicker.clear();
    };

    self.cancelDateTimeFilter = function () {
        let options = self.filters.dateTime.options,
            placeholderDateFilters = self.filtersPlaceHolder.dateTime,
            $fromDatePicker = $dateFrom.pickadate('picker'),
            $fromTimePicker = $timeFrom.pickatime('picker'),
            $toDatePicker = $dateTo.pickadate('picker'),
            $toTimePicker = $timeTo.pickatime('picker');

        placeholderDateFilters.dateFrom.value = options.dateFrom.value();
        $fromDatePicker.set({select: placeholderDateFilters.dateFrom.value});
        placeholderDateFilters.timeFrom.value = options.timeFrom.value();
        $fromTimePicker[0].value = placeholderDateFilters.timeFrom.value;  // revisit once materialize get updated
        placeholderDateFilters.dateTo.value = options.dateTo.value();
        $toDatePicker.set({select: placeholderDateFilters.dateTo.value});
        placeholderDateFilters.timeTo.value = options.timeTo.value();
        $toTimePicker[0].value = placeholderDateFilters.timeTo.value;   // revisit once materialize get updated
    };

    self.applyNameFilter = function () {
        var option,
            curVal,
            newVal,
            i,
            nsFilters = self.filters.pointAttribs.options,
            len = nsFilters.length,
            doApplyFilter = false;

        self.nameFilterPaused(true);

        for (i = 0; i < len; i++) {
            option = nsFilters[i];
            curVal = option.value();
            newVal = pointAttribsFilterObj[option.text];

            if (!doApplyFilter && valuesAreDifferent(curVal, newVal)) {
                doApplyFilter = true;
            }

            option.value(pointAttribsFilterObj[option.text]);
        }

        self.nameFilterPaused(false);

        if (doApplyFilter) {
            nsFilters.terms.value.valueHasMutated();
        }
    };

    self.callChangeNameFilter = () => {
        changePointAttribsFilter(self.alarmDetail.alarm());
    };

    self.editDateTimeFilter = () => {
        openModal($dateTimeFilterModal);
        // setTimeout(function () {
        //     Materialize.updateTextFields();
        // }, 200);
        return true;
    };

    self.closeAlarmDetail = function (alarm) {
        var contentStop = 20,
            detailStop = -(detailWidth + 2);

        if (alarm) {
            deSelectAlarm(alarm);
        }
        self.alarmDetail.visible = false;
        self.handleResize($elContent.outerWidth() + (contentStop - detailStop));
        toggleAlarmDetail(contentStop, detailStop);
    };

    self.alarmDetail = {
        reqID: 0,
        // Init the alarm observable with Names so the view binding doesn't complain
        alarm: ko.observable({
            terms: ""
        }),
        gettingData: ko.observable(false).extend({throttle: 100}),
        error: ko.observable(false),
        visible: false,
        displays: ko.observableArray([])
    };

    self.openAlarmDetail = function (alarm) {
        var contentStop = detailWidth + 40,
            detailStop = 20,
            alarmDetail = self.alarmDetail,
            upi = alarmDetail.alarm ? alarmDetail.alarm().upi : null,
            reqData;

        alarmDetail.alarm(alarm);

        if ((upi !== alarm.upi) || alarmDetail.error()) {
            alarmDetail.reqID = new Date().getTime();
            alarmDetail.error(false);
            alarmDetail.gettingData(true);

            reqData = {reqID: alarmDetail.reqID, upi: alarm.upi};

            _log('Requesting display dependencies', reqData, new Date());

            $.ajax({
                type: "POST",
                url: "/api/points/findAlarmDisplays/",
                data: reqData
            })
            .done(function (rxData) {
                alarmDetail.gettingData(false);
                _log('Received display dependencies', rxData, new Date());

                if (rxData.reqID && rxData.reqID !== alarmDetail.reqID) {
                    _log('Throwing away display dependencies (request ID mismatch)', rxData, new Date());
                } else if (rxData.err) {
                    alarmDetail.gettingData(false);
                    alarmDetail.error(true);
                } else if (rxData.displays) {
                    alarmDetail.displays(rxData.displays);
                } else {
                    alarmDetail.gettingData(false);
                    alarmDetail.error(true);
                }
            })
            .fail(function () {
                alarmDetail.gettingData(false);
                alarmDetail.error(true);
            });
        }
        alarmDetail.visible = true;
        self.handleResize($elContent.outerWidth() - (contentStop + detailStop));
        toggleAlarmDetail(contentStop, detailStop);
    };

    self.handleResize = function (targetWidth) {
        var contentWidth = targetWidth || $elContent.outerWidth();

        // $alarmsBody.find(".dropdown-button").dropdown('close');

        if (contentWidth < 725) {
            horizontalMenu.$elAlarmClass.hide();
            verticalMenu.$elAlarmClass.show();

            horizontalMenu.$elAlarmCategory.hide();
            verticalMenu.$elAlarmCategory.show();
        } else if (contentWidth < 1025) {
            horizontalMenu.$elAlarmClass.show();
            verticalMenu.$elAlarmClass.hide();

            horizontalMenu.$elAlarmCategory.hide();
            verticalMenu.$elAlarmCategory.show();
        } else {
            horizontalMenu.$elAlarmClass.show();
            verticalMenu.$elAlarmClass.hide();

            horizontalMenu.$elAlarmCategory.show();
            verticalMenu.$elAlarmCategory.hide();
        }
    };

    self.init = () => {
        initKnockout();
        // Initialize our default views. Custom views are load asyncronously after page load; we'll init them @ that time
        initViewGroup('defaultViews');

        // This routine creates & initializes filter observables displayed to the user
        initFilterOptions();

        initAlarmTables();

        // Setup midnight notification
        setupMidnightNotify();

        // Apply the view
        applyView(self.currentView());

        // $dateTimeFilterModal.modal();
    };

   //------ Debugging Helpers -------------------------------
    // TODO Remove for production
    self.debug = {
        printAlarmUpdateQueue: function () {
            _log(alarmUpdateQueue);
        },
        printReqIds: function () {
            _log(alarmTables.Recent.reqID, alarmTables.Unacknowledged.reqID, alarmTables.Active.reqID);
        },
        simulateReceiveAlarms: function () {
            var alarmTable = self.alarms(),
                data = {
                    alarms: ko.toJS(alarmTable.list()),
                    count: alarmTable.count()
                };
            receiveAlarms(data, alarmTable);
            return true;
        },
        addAlarm: function (alarmTableName, n, timeStampAdjust) {
            if (alarmTables[alarmTableName] === undefined) {
                _log("Alarms, " + alarmTableName + ", is undefined. Use 'Recent', 'Active', or 'Unacknowledged'.");
                return;
            }

            var alarmTable = alarmTables[alarmTableName],
                data = {
                    newAlarm: {
                        BackColor: "0000FF",
                        path: [],
                        terms: "",
                        Security: [],
                        TextColor: "FFFFFF",
                        ackInfo: "",
                        ackStatus: ACK_NONE,
                        ackTime: 0,
                        ackUser: 0,
                        displayId: 0,
                        alarmClass: "Urgent",
                        almClass: 3,
                        msgCat: 0,
                        msgTime: Math.floor((new Date().getTime()) / 1000) - (timeStampAdjust ? timeStampAdjust:0),
                        msgType: 18
                    },
                    reqID: alarmTable.reqID
                };
            n = n || 1;
            timeStampAdjust = timeStampAdjust || 0;

            for (var i = 0; i < n; i++) {
                data.newAlarm._id = Math.random().toString(36).slice(2);
                data.newAlarm.upi = parseInt(Math.random().toString().slice(2), 10);
                data.newAlarm.msgText = "Dummy Alarm Message " + i;

                receiveAlarmUpdate(JSON.parse(JSON.stringify(data)), 'ADD', alarmTable);
            }
        },
        deleteAlarm: function (alarmTableName, n, deleteFromTop) {
            if (alarmTables[alarmTableName] === undefined) {
                _log("Alarms, " + alarmTableName + ", is undefined. Use 'Recent', 'Active', or 'Unacknowledged'.");
                return;
            }

            var alarmTable = alarmTables[alarmTableName],
                alarmList  = alarmTable.list(),
                data = {
                    reqID: alarmTable.reqID
                };

            n = n || 1;
            if (deleteFromTop === undefined) {
                deleteFromTop = true;
            }

            for (var i = 0; i < n; i++) {
                var len = alarmList.length,
                    alarm;

                if (len) {
                    if (deleteFromTop) {
                        alarm = alarmList[0];
                    } else if (len > PAGE_SIZE) {
                        alarm = alarmList[PAGE_SIZE - 1];
                    } else {
                        alarm = alarmList[len-1];
                    }

                    if (alarmTableName === 'Active') {
                        data.upi = alarm.upi;
                    } else {
                        data._id = alarm._id;
                        data.ackStatus = 2;
                        data.ackUser = "NO_USER";
                        data.ackTime = Math.floor(new Date().getTime() / 1000);
                    }

                    receiveAlarmUpdate(data, 'DELETE', alarmTable);
                }
            }
            alarmTable.list.valueHasMutated();
        }
    };

    //------ Pre-Inits -------------------------------------
    $(window).on('hashchange', function () {
        var filterName = location.hash.substring(1),
            view;

        view = findView('title', filterName);
        if (view === null) {
            view = self.defaultViews[0];
        }

        self.changeView(view);
    });

    dtiUtility.getUser(setCurrentUser);
    dtiUtility.getConfig("Utility.pointTypes.getAllowedPointTypes", [], setAvailablePointTypes);


    //------ Computeds ------------------------------------
    // Computeds are calculated on creation; They are located here because the logic inside a couple of them
    // depends on the rest of the viewmodel to be setup correctly before they are executed.
    self.alarms = ko.computed(function() {
        return alarmTables[self.currentView().alarmTableName()];
    }, self);

    self.alarms200 = ko.computed(function () {
        return self.alarms().list.slice(0, 200);
    }, self);

    self.dirty = ko.computed(function() {
        var category,
            cat,
            viewCat,
            option,
            opt,
            viewOptions,
            found,
            i,
            len;

        if (self.filters) {
            for (category in filters) {
                cat = self.filters[category];
                viewCat = self.currentView().defaultFilters[category];

                len = cat.options.length;
                for (i = 0; i < len; i++) {
                    opt = cat.options[i];
                    viewOptions = viewCat.options;

                    if (category === 'dateTime' || category === 'pointAttribs') {
                        if (valuesAreDifferent(opt.value(), viewOptions[opt.text])) {
                            return true;
                        }
                    } else {
                        found = (viewOptions.indexOf(opt.text) > -1) ? true:false;
                        if (opt.isActive() ^ found) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }, self).extend(computedThrottle);

    self.allSelected = ko.computed(function() {
        var i,
            alarms = self.alarms().list(),
            n = alarms.length,
            len = (n > 200) ? 200:n;

        if (len === 0) {
            return false;
        }

        for (i = 0; i < len; i++) {
            if (alarms[i].isSelected() === false) {
                return false;
            }
        }
        return true;
    }, self).extend(computedThrottle);
    /*
    self.allUnackSelected = ko.computed(function() {
        var i,
            alarm,
            alarms = self.alarms().list(),
            len = alarms.length,
            listHasAckRequired = false;

        if (len === 0) {
            return false;
        }

        for (i = 0; i < len; i++) {
            alarm = alarms[i];
            if (self.ackRequired(alarm)) {
                listHasAckRequired = true;
                if (!alarm.isSelected())
                    return false;
            }
        }
        return listHasAckRequired;
    }, self).extend(computedThrottle);
    */
    self.anyAckSelected = ko.computed(function() {
        var i,
            alarm,
            ackStatus,
            alarms = self.alarms().list(),
            n = alarms.length,
            len = (n > 200) ? 200:n;

        for (i = 0; i < len; i++) {
            alarm = alarms[i];
            ackStatus = alarm.ackStatus();

            if (alarm.isSelected() && (ackStatus !== ACK_NONE) && (ackStatus !== ACK_DONE) && (ackStatus !== AUTO_ACK) && self.userHasPermissionToAck(alarm)) {
                return true;
            }
        }
        return false;
    }, self).extend(computedThrottle);

    self.ackInProgress = ko.computed(function() {
        var i,
            alarm,
            alarms = self.alarms().list(),
            n = alarms.length,
            len = (n > 200) ? 200:n;

        for (i = 0; i < len; i++) {
            alarm = alarms[i];

            if (alarm.ackStatus() === ACK_IN_PROGRESS) {
                return true;
            }
        }
        return false;
    });

    // Pausing variable for the following computed name filter. If we didn't have this, when we changed views we'd
    // inadvertently get alarms from the server twice: once here because of the applyFilter call, and again by the
    // applyView routine (called when views change)
    self.nameFilterPaused = ko.observable(true);
    self.nameFilter = ko.computed(function() {
        var paused = self.nameFilterPaused.peek(),
            options = (self.filters ? self.filters.pointAttribs.options : []),
            len = options.length,
            active = false,
            $filterIcon = $('#nameFilters .filterIcon'),
            option,
            val,
            i;

        for (i = 0; i < len; i++) {
            option = options[i];
            val = (typeof option.value === 'function' ? option.value() : option.value);
            if (typeof val === 'object') {
                if (val.length) {
                    active = true;
                }
            } else if (val !== '') {
                active = true;
            }
            // You would think we could break the loop once we know we have an active filter, but we need to
            // continue so that this computed maintains a dependency with all name segments.
        }

        if (active) {
            $filterIcon.addClass('filterActive');
        } else {
            $filterIcon.removeClass('filterActive');
        }

        if (!paused) {
            applyFilter();
        }
    }, self);

    self.dateTimeFilterPaused = ko.observable(true);
    self.dateFilter = ko.computed(function() {
        var paused = self.dateTimeFilterPaused.peek(),
            options = (self.filters ? self.filters.dateTime.options : []),
            len = options.length,
            dateTime = {},
            active = false,
            withoutDelay = true,
            i,
            val,
            option,
            $el,
            $filterIcon = $('#timeDateFilters .filterIcon');

        dateErrors = false;

        for (i = 0; i < len; i++) {
            option = options[i];
            val = option.value();

            $el = $('#' + option.id);

            if ((val !== '') && (Date.parse(val) === null)) {
                dateErrors = true;
                $el.addClass('inputError');
            } else {
                $el.removeClass('inputError');

                dateTime[option.text] = val;

                if (val !== '') {
                    active = true;
                }
            }
        }

        if (dateErrors) {
            $filterIcon.addClass('filterError').removeClass('filterActive');
        } else if (active) {
            $filterIcon.addClass('filterActive').removeClass('filterError');
        } else {
            $filterIcon.removeClass('filterActive').removeClass('filterError');
        }

        // * * RJS   this is causing some thrashing on requesting data.
        //if (!dateErrors && !paused) {
        //    applyFilter(withoutDelay);
        //}
    });
    self.applyDateTimeFilter = () => {
        var options = self.filters.dateTime.options,
            placeholderDateFilters = self.filtersPlaceHolder.dateTime,
            withoutDelay = true,
            len = options.length,
            i,
            optionId,
            localFilter;

        _log('applyDateTimeFilter() called.....', new Date());

        for (i = 0; i < len; i++) {
            localFilter = options[i];
            optionId = localFilter.id;
            localFilter.value(placeholderDateFilters[optionId].value);
        }

        closeModal($dateTimeFilterModal);
        applyFilter(withoutDelay);  // should save current filter as well
    };

    self.getRecentAlarms = ko.computed(function() {
        var alarmTable = alarmTables.Recent,
            refresh = alarmTable.refresh();

        if (refresh) {
            requestAlarms(alarmTable);
        }
    }, self);

    self.getActiveAlarms = ko.computed(function() {
        var alarmTable = alarmTables.Active,
            refresh = alarmTable.refresh();

        if (refresh) {
            requestAlarms(alarmTable);
        }
    }, self);

    self.getUnacknowledgedAlarms = ko.computed(function() {
        var alarmTable = alarmTables.Unacknowledged,
            refresh = alarmTable.refresh();

        if (refresh) {
            requestAlarms(alarmTable);
        }
    }, self);

    self.printAlarms = function() {
        $('.alarms').css('overflow', 'visible');
        $('.alarms').printArea({mode:'iframe'});
        $('.alarms').css('overflow', 'auto');
    };

    // setTimeout(function () {
        self.init();
    // }, 10);
};

function initPage (manager) {
    let dateId = '#timeDateFilters',
        $pointFilterModal = $('#pointFilterModal'),
        $dateTimeFilterModal = $('#dateTimeFilterModal'),
        $dateFrom = $dateTimeFilterModal.find("#dateFrom"),
        // $timeFrom = $dateTimeFilterModal.find("#timeFrom").pickatime('picker'),
        $dateTo = $dateTimeFilterModal.find("#dateTo"),
        // $timeTo = $dateTimeFilterModal.find("#timeTo").pickatime('picker'),
        $dateFilterIcon = $(dateId + ' .filterIcon'),
        $bodyMask = $('.bodyMask'),

        $alarms = $('.alarms'),
        $newAlarmTop = $('.newAlarmTop'),
        $newAlarmBottom = $('.newAlarmBottom'),
        timeoutId,
        toggleDropdown = function (id) {
            var $container = $(id),
                $dropDown = $(id + ' .dropdown-menu'),
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
            var $dateFilterDropDown = $(dateId + ' .dropdown-menu');

            $dateFilterDropDown.hide();
            $dateFilterIcon.removeClass('open');

            $bodyMask.hide();
        };

    // Initialize the table header select column. This way the user can select any
    // part of this header cell to activate the dropdown.
    $(".header > .colSelect").click(function(e){
        e.stopPropagation();
        if (e.target.tagName !== 'INPUT') {
            $(".header > .colSelect .dropdown-toggle").dropdown('toggle');
        }
    });

    // When the date filter icon is clicked, we reveal a drop down containing the time date filters
    $dateFilterIcon.click(function (e) {
        toggleDropdown(dateId);
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

    $dateFrom.pickadate('picker').on({
        set: function (thingToSet) {
            if (!!thingToSet.select) {
                $dateTo.pickadate('picker').set({min: new Date(this.get('select').pick)});
            }
        }
    });

    $dateTo.pickadate('picker').on({
        set: function (thingToSet) {
            if (!!thingToSet.select) {
                $dateFrom.pickadate('picker').set({max: new Date(this.get('select').pick)});
            }
        }
    });

    // Add click handlers to 'close' elements within the modal itself
    $pointFilterModal.find('.closeIt').click(function () {
        $pointFilterModal.modal('toggle');
    });

    // Add handler to notify when the modal is dismissed
    $pointFilterModal.on('hide.bs.modal', function (e) {
        manager.applyNameFilter();
    });

    // Add handler to notify when the modal is shown
    $pointFilterModal.on('shown.bs.modal', function (e) {
        $('#pointLookup')[0].contentWindow.$('#listSearch').find('input:first').focus();
    });

    // Add mouseover handlers to new alarm notifications (shown when the incoming alarms aren't in view)
    $newAlarmTop.mouseover(function () {
        $newAlarmTop.stop(false, true);
        $newAlarmTop.fadeIn(0);
    });

    $newAlarmTop.mouseout(function () {
        $newAlarmTop.fadeOut(500);
    });

    $newAlarmTop.click(function () {
        $alarms.scrollTop(0);
        $newAlarmTop.fadeOut(0);
    });

    // Add mouseover handler to new bottom alarm notifications (shown when the incoming alarms aren't in view)
    // *This is for when the list is sorted descending
    $newAlarmBottom.mouseover(function () {
        $newAlarmBottom.stop(false, true);
        $newAlarmBottom.fadeIn(0);
    });

    $newAlarmBottom.mouseout(function () {
        $newAlarmBottom.fadeOut(500);
    });

    $newAlarmBottom.click(function () {
        $alarms.scrollTop(99999);
        $newAlarmBottom.fadeOut(0);
    });

    // If this is a pop-out window
    if (window.top.location.href === window.location.href) {
        $('.popOut').addClass('hidden');
        $('.popIn').removeClass('hidden');
    }

    $(window).resize(function () {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(manager.handleResize, 25);
    });
}

function applyBindings () {
    // If we're an iFrame, the workspace attaches an 'opener' handler (IE fix). AlarmManager requires this opener method to be established
    // before it is instantiated. The workspace can't attach it until the iFrame is fully rendered, so we must wait if it doesn't exist yet
    if (window.top === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        window.manager = new AlarmManager({});
        ko.applyBindings(window.manager);
        window.manager.handleResize();
    }
}

dti.$(function () {
    // Apply KO bindings
    applyBindings();

    // Perform some page initializations (mostly click handlers)
    initPage(window.manager);
});
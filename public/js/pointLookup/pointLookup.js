"use strict";
window.pointLookup = (function(module, ko, $) {
    var workspaceManager = (window.opener || window.top).workspaceManager,
        socket = workspaceManager.socket(),
        socketHistory = {},
        dataAdapters,
        viewModel,
        externalCallback,
        externalFilterObj,
        permGroupId,
        permGroupName,
        $body,
        $splitter,
        $pointTypesListBox,
        $tabs,
        $searchGrid,
        $browse = {},
        $searchTab,
        $browseTab,
        $contextMenu,
        $newPointBtn,
        browseRequest,
        $browseBusy,
        browseTimer,
        searchRequest,
        $searchBusy,
        searchTimer,
        segmentOneBrowseData = [],
        massPointTypeUpdate,
        permissionLevels = {
            CONTROL: 2,
            ACKNOWLEDGE: 4,
            WRITE: 8
        },
        SOCKETTIMEOUT = 10000,
        user,
        userPermissions,
        appIsInitialized = false;

    ko.bindingHandlers.tooltip = {
        init: function(element, valueAccessor) {
            $(element).tooltip({
                title: ko.unwrap(valueAccessor())
            });
        }
    };

    socket.on('pointUpdated', function (response) {
        var qData;
        // If our response isn't a string, it is not intended for us
        if (typeof response == 'string') {
            response = JSON.parse(response);
            qData = socketHistory[response.reqID];
            if (!qData || qData.processing) {
                return;
            }
            window.clearTimeout(qData.timeout);
            socketDone(response, qData);
        }
    });

    function socketDone(response, qData) {
        var error = '',
            warning = '',
            listManager = qData.listManager,
            itemIndex = listManager.itemIndex,
            itemId = listManager.itemData._id,
            cmdPointName = qData.command + ' point ' + listManager.itemData.Name,
            segment,
            dataSource,
            $browseList;
        
        if (response.err) {
            error = ['An error occurred when trying to ', cmdPointName, ': ', response.err].join('');
        } else if (response.warning) {
            cmdPointName = cmdPointName.charAt(0).toUpperCase() + cmdPointName.substring(1); // Capitalize the first character
            warning = [cmdPointName, ' completed successfully with the following warning(s): ', response.warning].join('');
        } else if (response.message != 'success') {
            error = ['An unknown error occurred when trying to ', cmdPointName, '. Please try again.'].join('');
        }
        listManager.$contextIcon.removeClass('busy fa-spinner fa-spin').addClass('edit fa-gear');

        if (error.length) {
            bannerJS.showBanner({
                msg: error,
                dismissText: "Dismiss",
                color: "#D50000",
                animatePage: false
            });
        } else {
            // If we have a warning message display it
            if (warning.length) {
                bannerJS.showBanner({
                    msg: warning,
                    dismissText: "Dismiss",
                    color: "#FFA500",
                    animatePage: false
                });
            }
            // Remove item from the UI and our data source
            if ((segment = listManager.segmentNumber) !== undefined) {
                dataSource = viewModel.browse['data' + segment];
                if (dataSource()[itemIndex]._id === itemId) {
                    $browseList = $browse['list' + segment];
                    $browseList.jqxListBox('beginUpdate');
                    dataSource.splice(itemIndex, 1);
                    $browseList.jqxListBox('endUpdate');
                }
            } else {
                dataSource = viewModel.grid.data;
                if (dataSource()[itemIndex]._id === itemId) {
                    dataAdapters.grid.beginUpdate();
                    dataSource.splice(itemIndex, 1);
                    dataAdapters.grid.endUpdate();
                }
            }
        }
        delete socketHistory[qData.reqID];
    }

    function socketTimeout(qData) {
        var response = {
            err: 'Request timed out'
        };
        qData.processing = true;
        socketDone(response, qData);
    }

    function socketEmit(options) {
        var command = options.command,
            data = options.data,
            qData = options.qData,
            emitString = {
                'delete': 'deletePoint',
                'destroy': 'deletePoint',
                'restore': 'restorePoint'
            };
        // UPI's must be unique so we'll use them for our request ID's
        qData.reqID = data.reqID = data.upi;
        // Setup a timeout to handle unresponsive socket requests
        qData.timeout = window.setTimeout(function () {
            socketTimeout(qData);
        }, SOCKETTIMEOUT);
        // Save request to socket history
        socketHistory[data.upi] = qData;
        // Issue the socket command
        socket.emit(emitString[command], JSON.stringify(data));
    }

    function ViewModel() {
        var self = this;
        this.widgetTheme = 'customArctic';
        this.showDeleted = ko.observable(false);
        this.showInactive = ko.observable(false);
        this.systemAdmin = ko.observable(userPermissions.systemAdmin);
        this.availablePointTypes = ko.observableArray(module.POINTTYPES);
        this.selectedPointTypes = ko.observableArray([]);
        this.isFocused = ko.observable(true);

        this.selectedPointTypes.subscribe(function(value) {
            var nameSegment,
                filter,
                i,
                params = {},
                grid = self.grid,
                showDeleted = self.showDeleted(),
                showInactive = self.showInactive();

            if (module.MODE == 'filter' && $tabs.jqxTabs('selectedItem') == 1) {
                for (i = 1; i < 5; i++) {
                    nameSegment = 'name' + i;
                    viewModel.reportFilter[nameSegment]('');
                }
            }

            params.showDeleted = showDeleted ? true : false;
            params.showInactive = showInactive ? true : false;

            filter = $.trim(grid.name1.filter());
            params.name1 = filter;

            for (i = 2; i < 5; i++) {
                if (grid['name' + i].filterOn()) {
                    filter = $.trim(grid['name' + i].filter());
                    params['name' + i] = filter;
                }
            }
            // JDR 4.1.2015 No point types selected should yield no points
            // if (value.length == 0) {
            //     value = getAllPointTypesFiltered.call(self);
            // }
            params.pointTypes = value;

            if (!!searchRequest) {
                searchRequest.abort();
                clearTimeout(searchTimer);
                $searchBusy.hide();
            }

            searchRequest = getGridData(params).done(updateGridVM);
        });
        this.allPointTypes = ko.computed({
            read: function() {
                var available = getAllPointTypesFiltered.call(self).length,
                    selected = self.selectedPointTypes().length;
                return available == selected;
            },
            write: function(value) {
                massPointTypeUpdate = true;
                if (value) {
                    //$pointTypesListBox.jqxListBox('checkAll');
                    selectPointTypes('all');
                } else {
                    $pointTypesListBox.jqxListBox('uncheckAll');
                    //selectPointTypes('none');
                }
                massPointTypeUpdate = false;
                self.selectedPointTypes(getSelectedPointTypes());
            }
        });
        this.grid = {
            name1: {
                filter: ko.observable('')
            },
            name2: {
                filter: ko.observable(''),
                filterOn: ko.observable(true)
            },
            name3: {
                filter: ko.observable(''),
                filterOn: ko.observable(true)
            },
            name4: {
                filter: ko.observable(''),
                filterOn: ko.observable(true)
            },
            toggleFilter: function(segment, forceState) {
                var toggle,
                    i,
                    thisFilterOn = forceState || !self.grid['name' + segment].filterOn();

                toggle = function(_segment, on) {
                    var $button = $('#segment' + _segment),
                        $buttonIcon = $button.find('i'),
                        nameSegment = self.grid['name' + _segment];

                    nameSegment.filterOn(on);

                    if (on) {
                        $button.removeClass('btn-danger')
                            .addClass('btn-success');
                        $buttonIcon.removeClass('fa-ban')
                            .addClass('fa-filter');
                    } else {
                        nameSegment.filter('');
                        $button.removeClass('btn-success')
                            .addClass('btn-danger');
                        $buttonIcon.removeClass('fa-filter')
                            .addClass('fa-ban');
                    }
                };

                if (thisFilterOn) {
                    for (i = segment; i > 1; i--) {
                        toggle(i, thisFilterOn);
                    }
                } else {
                    for (i = segment; i < 5; i++) {
                        toggle(i, thisFilterOn);
                    }
                }

            },
            data: ko.observableArray([])
        };
        this.browse = {
            filter1: ko.observable(''),
            filter2: ko.observable(''),
            filter3: ko.observable(''),
            filter4: ko.observable(''),
            name1: ko.observable(''),
            name2: ko.observable(''),
            name3: ko.observable(''),
            name4: ko.observable(''),
            data1: ko.observableArray([]),
            data2: ko.observableArray([]),
            data3: ko.observableArray([]),
            data4: ko.observableArray([])
        };

        this.reportFilter = {
            name1: ko.observable(''),
            name2: ko.observable(''),
            name3: ko.observable(''),
            name4: ko.observable('')
        };

        this.clearSearch = function(data, e) {
            var $e = $(e.currentTarget),
                segment = $e.data('segment'),
                tab = $e.data('tab');
            if (tab === 'grid')
                this.grid[segment].filter('');
            else if (tab === 'browse')
                this.browse[segment]('');
        };

        this.resetNavigator = function() {
            this.grid.name1.filter('');
            this.grid.name2.filter('');
            this.grid.name3.filter('');
            this.grid.name4.filter('');
            this.browse.filter1('');
            this.browse.filter2('');
            this.browse.filter3('');
            this.browse.filter4('');
            this.isFocused(true);
        };

        if (module.MODE == 'filter') {
            ko.computed(function() {
                var filterObj = {
                        name1: self.reportFilter.name1(),
                        pointTypes: self.selectedPointTypes()
                    },
                    filter;
                for (var i = 4; i > 1; i--) {
                    filter = self.reportFilter['name' + i]();
                    if (filter != null) filterObj['name' + i] = filter;
                }
                externalCallback(filterObj);
            });
        }

        this.browse.filteredData1 = createBrowseFilter(1);
        this.browse.filteredData2 = createBrowseFilter(2);
        this.browse.filteredData3 = createBrowseFilter(3);
        this.browse.filteredData4 = createBrowseFilter(4);

        function createBrowseFilter(segmentNumber) {
            return ko.computed(function() {
                var allItems = self.browse['data' + segmentNumber](),
                    selectedPointTypes = self.selectedPointTypes(),
                    pointTypes,
                    current,
                    match,
                    matchingItems = [];

                if (selectedPointTypes.length) {
                    pointTypes = selectedPointTypes;
                } else {
                    pointTypes = getAllPointTypesFiltered.call(self);
                }

                switch (segmentNumber) {
                    case 1:
                        self.browse.filter2('');
                        self.browse.data2([]);
                        $browse.list1.jqxListBox('clearSelection');
                    case 2:
                        self.browse.name2('');
                        self.browse.filter3('');
                        self.browse.data3([]);
                        $browse.list2.jqxListBox('clearSelection');
                    case 3:
                        self.browse.name3('');
                        self.browse.filter4('');
                        self.browse.data4([]);
                        $browse.list3.jqxListBox('clearSelection');
                }

                for (var i = 0; i < allItems.length; i++) {
                    current = allItems[i];
                    if (!!~current['_name' + segmentNumber].indexOf(self.browse['filter' + segmentNumber]().toLowerCase())) {
                        match = ko.utils.arrayFirst(current.pointType, function(pointType) {
                            return !!~pointTypes.indexOf(pointType)
                        });
                        if (!!match) matchingItems.push(current);
                    }
                }

                return matchingItems;
            }).extend({
                rateLimit: {
                    timeout: 10,
                    method: "notifyWhenChangesStop"
                }
            });
        }

        //if opened in permissions mode, only get browse data
        if (module.MODE != 'perm') {
            ko.computed(function() {
                var vm = self.grid,
                    filter,
                    pointTypes = self.selectedPointTypes.peek(),
                    params = {},
                    showDeleted = self.showDeleted(),
                    showInactive = self.showInactive(),
                    firstCall = ko.computedContext.isInitial();

                // Showing deleted and inactive points at the same time is disallowed. We have computeds monitoring these observables which will 
                // clear one or the other, after which this routine will be called again
                if (showDeleted && showInactive)
                    return false;

                if (showDeleted) params.showDeleted = showDeleted;
                if (showInactive) params.showInactive = showInactive;

                filter = $.trim(vm.name1.filter());
                if (module.MODE == 'filter') self.reportFilter.name1(filter);
                params.name1 = filter;

                for (var i = 2; i < 5; i++) {
                    if (vm['name' + i].filterOn()) {
                        filter = $.trim(vm['name' + i].filter());
                        if (module.MODE == 'filter') self.reportFilter['name' + i](filter);
                        params['name' + i] = filter;
                    } else {
                        if (module.MODE == 'filter') self.reportFilter['name' + i](null);
                    }
                }

                // JDR 4.1.2015 No point types selected should yield no points
                // if (pointTypes.length == 0) {
                //     pointTypes = getAllPointTypesFiltered.call(self);
                // }
                params.pointTypes = pointTypes;

                if (firstCall) return;

                if (!!searchRequest) {
                    searchRequest.abort();
                    clearTimeout(searchTimer);
                    $searchBusy.hide();
                }
                searchRequest = getGridData(params).done(updateGridVM);
            }).extend({
                rateLimit: {
                    timeout: 300,
                    method: "notifyWhenChangesStop"
                }
            });
        }

        //reset browse when selected point types change
        ko.computed(function() {
            self.selectedPointTypes();

            self.browse.data1.valueHasMutated();
            self.browse.name1('');
            self.browse.filter2('');
            self.browse.data2([]);
            self.browse.name2('');
            self.browse.filter3('');
            self.browse.data3([]);
            self.browse.name3('');
            self.browse.filter4('');
            self.browse.data4([]);

            //clear selection
            $browse.list1.jqxListBox('clearSelection');
        }).extend({
            rateLimit: {
                timeout: 1,
                method: "notifyWhenChangesStop"
            }
        });

        // JDR 4.1.2015 Add computed to monitor point types and clear/restore segment one browse data
        ko.computed(function() {
            var pointTypes = self.selectedPointTypes();
            if (appIsInitialized) {
                if (pointTypes.length === 0) {
                    updateBrowseVM([], 1);
                } else {
                    updateBrowseVM(segmentOneBrowseData, 1);
                }
            }
        }).extend({
            rateLimit: {
                timeout: 10,
                method: "notifyWhenChangesStop"
            }
        });

        //for including/excluding deleted and inactive points
        ko.computed(function() {
            var browseParams = {},
                pointTypes = self.selectedPointTypes.peek(),
                showDeleted = self.showDeleted(),
                showInactive = self.showInactive(),
                firstCall = ko.computedContext.isInitial();

            // Showing deleted and inactive points at the same time is disallowed. We have computeds monitoring these observables which will 
            // clear one or the other, after which this routine will be called again
            if (showDeleted && showInactive)
                return false;

            browseParams.showDeleted = showDeleted ? true : false;
            browseParams.showInactive = showInactive ? true : false;

            // JDR 4.1.2015 No point types selected should yield no points
            // if (pointTypes.length == 0) {
            //     pointTypes = getAllPointTypesFiltered.call(self);
            // }
            browseParams.pointTypes = pointTypes;

            if (firstCall) return;

            if (!!browseRequest) {
                browseRequest.abort();
                clearTimeout(browseTimer);
                $browseBusy.hide();
            }

            browseRequest = getBrowseData(browseParams).done(function(data) {
                updateBrowseVM(data, 1)
            });
        }).extend({
            rateLimit: {
                timeout: 10,
                method: "notifyWhenChangesStop"
            }
        });

        //for removing the ability to have showDeleted and showInactive set at the same time
        ko.computed(function() {
            var showDeleted = self.showDeleted(),
                showInactive = self.showInactive.peek();

            if (showDeleted && showInactive)
                self.showInactive(false);
        });
        //for removing the ability to have showDeleted and showInactive set at the same time
        ko.computed(function() {
            var showDeleted = self.showDeleted.peek(),
                showInactive = self.showInactive();

            if (showDeleted && showInactive)
                self.showDeleted(false);
        });
    }

    function getAllPointTypesFiltered() {
        var context = this;
        return context.availablePointTypes().map(function(item) {
            return item.key
        });
    }

    function selectPointTypes(selection) {
        if (selection == 'all') {
            module.checkPointTypes(getAllPointTypesFiltered.call(viewModel));
        } else if (selection == 'none') {
            $pointTypesListBox.jqxListBox('uncheckAll');
        }
    }

    function getBrowseData(params) {
        params = params || {};
        browseTimer = setTimeout(function() {
            browseBusy();
            $browseBusy.show();
        }, 100);

        // JDR 4.1.2015 If we don't have any point types there's no point in querying the server
        if (!!params.pointTypes && (params.pointTypes.length === 0)) {
            // We're returning an object that looks similar to the jQuery ajax return object
            return {
                done: function(fn) {
                    fn([]);
                },
                abort: function() {}
            };
        }

        //do we have a device id?
        if (!!module.DEVICEID) {
            params.deviceId = module.DEVICEID;
        }
        //do we have a remote unit id?
        if (!!module.REMOTEUNITID) {
            params.remoteUnitId = module.REMOTEUNITID;
        }
        // Do we have a point type?
        if (!!module.POINTTYPE) {
            params.pointType = module.POINTTYPE;
        }
        return $.ajax({
            url: '/api/points/browse',
            dataType: 'json',
            type: 'post',
            data: params
        });
    }

    function getGridData(params) {
        // If we don't have any point types there's no point in querying the server...clear all grid data
        if (!(!!params.pointTypes) || (params.pointTypes.length === 0)) {
            // We're returning an object that looks similar to the jQuery ajax return object
            return {
                done: function(fn) {
                    fn([]);
                },
                abort: function() {}
            };
        }

        params = params || {};
        searchTimer = setTimeout(function() {
            $searchBusy.show()
        }, 300);
        //do we have a device id?
        if (!!module.DEVICEID) {
            params.deviceId = module.DEVICEID;
        }
        //do we have a remote unit id?
        if (!!module.REMOTEUNITID) {
            params.remoteUnitId = module.REMOTEUNITID;
        }
        // Do we have a point type?
        if (!!module.POINTTYPE) {
            params.pointType = module.POINTTYPE;
        }
        return $.ajax({
            url: '/api/points/search',
            dataType: 'json',
            type: 'post',
            data: params
        });
    }

    function toggleGroup(permissions, itemIndex) {
        var folderName,
            pointTypes,
            projectedSegment,
            params = {},
            i;

        if (permissions.type == 'folder') {
            pointTypes = viewModel.selectedPointTypes.peek();
            for (i = 4; i; i--) {
                folderName = $.trim(viewModel.browse['name' + i]());
                if (!!folderName) {
                    params['name' + i] = folderName;
                    if (!projectedSegment) projectedSegment = i + 1;
                }
            }

            // JDR 4.1.2015 No point types selected should yield no points
            // if (pointTypes.length == 0) {
            //     pointTypes = viewModel.availablePointTypes().map(function(item) { return item.key });
            // }

            params.pointTypes = pointTypes;
            params.nameSegment = projectedSegment;
            params.permissions = permissions;

            if (!!browseRequest) {
                browseRequest.abort();
                clearTimeout(browseTimer);
                $browseBusy.hide();
            }

            browseRequest = getBrowseData(params).done(function(data) {
                updateBrowseVM(data, projectedSegment);
                $browse['list' + (projectedSegment - 1)].jqxListBox('selectIndex', itemIndex);
            });
            return browseRequest;
        }
        return $.ajax({
            url: '/api/points/toggleGroup',
            dataType: 'json',
            type: 'post',
            data: {
                permissions: permissions
            }
        });
    }

    function getSelectedPointTypes() {
        return getCheckedPointTypeItems().map(function(item) {
            return item.originalItem.key
        });
    }

    function getCheckedPointTypeItems() {
        return $pointTypesListBox.jqxListBox('getCheckedItems');
    }

    function refreshPointTypes() {
        var items = getCheckedPointTypeItems(),
            selectedPoints;

        massPointTypeUpdate = true;

        $pointTypesListBox.jqxListBox('refresh');

        for (var i = 0, last = items.length; i < last; i++) {
            $pointTypesListBox.jqxListBox('checkItem', items[i]);
        }

        massPointTypeUpdate = false;

        selectedPoints = viewModel.selectedPointTypes();

        selectedPoints.length = 0;
        selectedPoints.push.apply(selectedPoints, getSelectedPointTypes());
        viewModel.isFocused(true);
    }

    module.refreshUI = function() {
        refreshPointTypes();
    };


    module.getCheckedPointTypes = function () {
        return getSelectedPointTypes();
    };

    module.checkPointTypes = function(pointTypes) {
        var availablePointTypes = $pointTypesListBox.jqxListBox('getItems'),
            item;

        massPointTypeUpdate = true;

        if (pointTypes[0] !== 'all') {
            $pointTypesListBox.jqxListBox('uncheckAll');
            
            for (var i = 0, lastItem = availablePointTypes.length; i < lastItem; i++) {
                item = availablePointTypes[i];
                for (var j = 0, lastPointType = pointTypes.length; j < lastPointType; j++) {
                    if (item.label.toLowerCase() == pointTypes[j].toLowerCase()) {
                        $pointTypesListBox.jqxListBox('checkItem', item);
                    }
                }
            }
        } else {
            $pointTypesListBox.jqxListBox('checkAll');
        }

        massPointTypeUpdate = false;

        viewModel.selectedPointTypes(getSelectedPointTypes());
    };

    function browseBusy() {
        $browse.list1.jqxListBox({
            disabled: true
        });
        $browse.list2.jqxListBox({
            disabled: true
        });
        $browse.list3.jqxListBox({
            disabled: true
        });
        $browse.list4.jqxListBox({
            disabled: true
        });
    }

    function browseReady() {
        $browse.list1.jqxListBox({
            disabled: false
        });
        $browse.list2.jqxListBox({
            disabled: false
        });
        $browse.list3.jqxListBox({
            disabled: false
        });
        $browse.list4.jqxListBox({
            disabled: false
        });
    }

    function bindUI() {
        if (module.MODE == 'perm') {
            $('.permTitle').html(permGroupName);
        }

        dataAdapters = {
            pointType: new $.jqx.dataAdapter({
                localdata: viewModel.availablePointTypes,
                dataType: 'observablearray'
            }),
            grid: new $.jqx.dataAdapter({
                localdata: viewModel.grid.data,
                dataType: 'observablearray'
            })
        };

        if (userPermissions.systemAdmin) {
            $('.showInactive').css('display', 'inline-block');
        }

        if (module.MODE == 'filter') {
            $body.css('padding-bottom', '50px');
            $('.reportFilter').show();
        }

        $splitter.jqxSplitter({
            height: '100%',
            width: '100%',
            panels: [{
                min: 150,
                size: 200
            }, {
                min: 700,
                collapsible: false
            }],
            splitBarSize: 3,
            theme: viewModel.widgetTheme
        });

        $pointTypesListBox.jqxListBox({
            source: dataAdapters.pointType,
            height: '100%',
            width: '100%',
            displayMember: 'key',
            valueMember: 'enum',
            //multiple: true,
            itemHeight: 20,
            checkboxes: true,
            equalItemsWidth: true,
            theme: viewModel.widgetTheme
        });
        $pointTypesListBox.on('checkChange', function(event) {
            var rightclick = false,
                originalEvent = event.args.originalEvent,
                selectedPointTypes = viewModel.selectedPointTypes();

            if (massPointTypeUpdate) return;
            viewModel.selectedPointTypes(getSelectedPointTypes());

            // JDR 4.1.2015 Add usability enhancement for right click events...
            if (originalEvent) {
                if (originalEvent.which) rightclick = (originalEvent.which == 3);
                else if (originalEvent.button) rightclick = (originalEvent.button == 2);

                if (rightclick == true) {
                    // If we have only one point type selected, and that's the one we right clicked
                    if (selectedPointTypes.length == 1 && selectedPointTypes[0] === event.args.label) {
                        massPointTypeUpdate = true;
                        selectPointTypes('all');
                        massPointTypeUpdate = false;
                        // Otherwise we enable only the right clicked point type
                    } else {
                        $pointTypesListBox.jqxListBox('uncheckAll');
                        $pointTypesListBox.jqxListBox('checkItem', event.args.item);
                    }
                }
            }
        });
        viewModel.allPointTypes(true);

        // JDR 4.1.2015 Disable context menu (right click menu) in point type selection
        $('#pointTypeColumn').on('contextmenu', function() {
            return false;
        });

        $tabs.jqxTabs({
            width: '100%',
            height: '100%',
            position: 'top',
            autoHeight: true,
            theme: viewModel.widgetTheme
        });
        //only use browse mode for permissions
        if (module.MODE == 'perm') {
            $tabs.jqxTabs('removeAt', 0);
        }
        $tabs.on('selected', function(event) {
            var selectedTab = event.args.item,
                i,
                nameSegment;

            //refresh the browse mode list boxes if browse mode is chosen
            //listbox renders incorrectly when hidden, a refresh fixes this
            if (selectedTab == 0) { //search
                $searchTab.find('input:first').focus();
                //set appropriate filter
                if (module.MODE == 'filter') {
                    for (i = 1; i < 5; i++) {
                        nameSegment = 'name' + i;
                        viewModel.reportFilter[nameSegment](viewModel.grid[nameSegment].filter());
                    }
                }
            }
            if (selectedTab == 1) { //browse
                for (var j = 4; j; j--) {
                    setTimeout((function(k) {
                        $browse['list' + k].jqxListBox('refresh');
                    })(j), 10);
                }
                $browseTab.find('input:first').focus();
                //set appropriate filter
                if (module.MODE == 'filter') {
                    for (i = 1; i < 5; i++) {
                        nameSegment = 'name' + i;
                        viewModel.reportFilter[nameSegment](viewModel.browse[nameSegment]());
                    }
                }
            }
        });
        //Re-cache these guys after tabs have been rendered otherwise cache will be useless
        $searchBusy = $('.searchBusy');
        $browseBusy = $('.browseBusy');

        function getMenuItems(item) {
            var _array = [],
                ofTypeDisplay = item.pointType === "Display",
                hasWritePermission = userPermissions.systemAdmin || userHasPermission(item.Security, permissionLevels.WRITE);

            // Active
            if (item._pStatus == 0) {
                _array.push({label: 'Open'});
                if (hasWritePermission)
                    _array.push.apply(_array, [{label: 'Clone'}, {label: 'Delete'}]);
            }
            // Inactive
            else if (item._pStatus == 1) {
                if (userPermissions.systemAdmin)
                    _array.push({label: 'Delete'});
            }
            // Soft deleted
            else if (item._pStatus == 2) {
                if (!ofTypeDisplay) {
                    _array.push({label: 'Open'});
                }
                if (hasWritePermission)
                    _array.push.apply(_array, [{label: 'Restore'}, {label: 'Destroy'}]);
            }

            if (item.pointType == 'Slide Show') {
                _array.push({label: 'Edit'});
            }

            _array.push({label: 'Close'});
            return _array;
        }

        function gridEditColumnRenderer(index, datafield, value, defaultvalue, column, rowdata) {
            var item = dataAdapters.grid.records[index];

            if (module.MODE != 'nav') {
                return '';
            } else if (socketHistory[item._id]) {
                return '<span class="busy fa fa-spin fa-spinner"></span>';
            }
            item.menuItems = getMenuItems(item);

            return '<span class="edit fa fa-gear"></span>';
        }

        $searchGrid.jqxGrid({
            source: dataAdapters.grid,
            width: '100%',
            height: '100%',
            selectionmode: module.MODE == 'filter' ? 'none' : 'singlerow',
            scrollmode: 'logical',
            altrows: false,
            showheader: true,
            columns: [{
                text: 'Segment 1',
                datafield: 'name1'
            }, {
                text: 'Segment 2',
                datafield: 'name2'
            }, {
                text: 'Segment 3',
                datafield: 'name3'
            }, {
                text: 'Segment 4',
                datafield: 'name4'
            }, {
                text: 'Type',
                datafield: 'pointType',
                width: 150
            }, {
                text: '',
                datafield: 'control',
                width: 20,
                cellsrenderer: gridEditColumnRenderer,
                hidden: true
            }],
            theme: viewModel.widgetTheme
        });
        $searchGrid.on('initialized', function(event) {
            if (module.MODE == 'nav') {
                $searchGrid.jqxGrid('setcolumnproperty', 'control', 'hidden', false);
            }
        });
        $searchGrid.on('rowclick', function(event) {
            if (module.MODE == 'filter') return;
            var row = event.args,
                item = row.item,
                rowData = dataAdapters.grid.records[row.rowindex],
                $target = $(row.originalEvent.target),
                renderCoords = $target.offset(),
                fullName = [rowData.name1, rowData.name2, rowData.name3, rowData.name4].filter(function(item) {
                    return item
                }).join('_'),
                pointType = rowData.pointType,
                endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, rowData._id),
                deletedDisplay = (rowData.pointType === "Display" && rowData._pStatus === 2);

            rowData.Name = fullName;

            if ($target.is('span.edit')) {
                if (!!rowData.menuItems) {
                    window.focus();
                    $contextMenu.jqxMenu({
                        source: rowData.menuItems
                    });
                    $contextMenu.jqxMenu('open', renderCoords.left - ($contextMenu.width() / 2) - 10, renderCoords.top - 7);
                    $contextMenu.data({
                        listManager: {
                            $contextIcon: $target,
                            $itemElement: $('#row' + rowData.uid + 'jqxgrid'),
                            itemData: rowData,
                            itemIndex: rowData.uid
                        }
                    });
                    $searchGrid.jqxGrid({
                        selectedrowindex: row.rowindex
                    });
                }
                return;
            }

            setTimeout(function () {
                $searchGrid.jqxGrid({
                    selectedrowindex: -1
                })
            }, 1);

            if (module.MODE == 'select') {
                if (externalFilterObj) {
                    var inputCounter = 1;
                    $searchGrid.parent().parent().find(".toolbar").find(".searchInput").each(function () {
                        externalFilterObj["filter" + inputCounter++] = $(this).val();
                    });

                    externalFilterObj.name1 = rowData.name1;
                    externalFilterObj.name2 = rowData.name2;
                    externalFilterObj.name3 = rowData.name3;
                    externalFilterObj.name4 = rowData.name4;
                    externalFilterObj.pointType = rowData.pointType;
                    externalFilterObj.selectedPointTypes = window.pointLookup.getCheckedPointTypes();
                }
                externalCallback(rowData._id, fullName, pointType, externalFilterObj);
                window.close();
            } else {
                if (!deletedDisplay) {
                    workspaceManager.openWindowPositioned(endPoint.review.url, fullName, pointType, endPoint.review.target, rowData._id, {
                        width: 820,
                        height: 542
                    });
                }
            }
        });

        viewModel.browseListRender = function(segmentNumber) {
            return function(index) {
                var item = viewModel.browse['filteredData' + segmentNumber]()[index],
                    name,
                    row,
                    hasWritePermission;

                if (!item) return;

                name = item.name4 || item.name3 || item.name2 || item.name1;
                row = [];
                hasWritePermission = userPermissions.systemAdmin || userHasPermission(item.Security, permissionLevels.WRITE);
                item.menuItems = [];

                if (item.isPoint) {
                    if (module.MODE == 'nav' && hasWritePermission) {
                        if (socketHistory[item._id])
                            row.push('<span class="busy fa fa-spin fa-spinner"></span>');
                        else
                            row.push('<span class="edit fa fa-gear"></span>');
                    }
                    row.push.apply(row, ['<img title="', item.pointType, '" src="/img/pointtypes/', item.pointType, '.png" height="16" width="16" /> ', name]);

                    if (module.MODE == 'perm' && userPermissions.systemAdmin) {
                        if (!!~item.Security.indexOf(permGroupId)) {
                            row.push('<span class="perm fa fa-check-square"></span>');
                        } else {
                            row.push('<span class="perm fa fa-square-o"></span>');
                        }
                    }
                    item.menuItems = getMenuItems(item);
                } else {
                    row.push.apply(row, ['<i class="glyphicon glyphicon-folder-close"></i> ', name]);
                    if (module.MODE == 'perm' && userPermissions.systemAdmin) {
                        row.push('<span class="perm fa fa-sort-amount-asc"></span>');
                        item.menuItems.push({
                            label: 'Add all'
                        });
                        item.menuItems.push({
                            label: 'Remove all'
                        });
                    }
                }

                return row.join('');
            };
        };

        $browse.list1.on('select', browseListSelect(1));
        $browse.list2.on('select', browseListSelect(2));
        $browse.list3.on('select', browseListSelect(3));
        $browse.list4.on('select', browseListSelect(4));

        $contextMenu.jqxMenu({
            source: [],
            autoOpenPopup: false,
            mode: 'popup',
            animationShowDuration: 0,
            animationHideDuration: 0,
            autoCloseOnClick: false
        });

        $contextMenu.on('closed', function() {
            var listManager = $(this).data('listManager');
            if (!listManager) return;
            if (!!listManager.segmentNumber) {
                $browse['list' + listManager.segmentNumber].jqxListBox('unselectItem', listManager.item);
            } else {
                $searchGrid.jqxGrid({
                    selectedrowindex: -1
                });
            }
        });
        $contextMenu.on('mouseleave', function(e, t) {
            // $contextMenu.jqxMenu('close');
        });
        $contextMenu.on('itemclick', function(event) {
            var listManager = $(this).data('listManager'),
                Command = $(event.args).text(),
                command = Command.toLowerCase(),
                id,
                fullName,
                pointType,
                endPoint,
                segmentNumber,
                itemData,
                folderName,
                permissions,
                hasWritePermission,
                i;

            if (!listManager) return;

            id = listManager.itemData._id;
            segmentNumber = listManager.segmentNumber;
            itemData = listManager.itemData;
            fullName = itemData.Name;
            pointType = itemData.pointType instanceof Array ? itemData.pointType[0] : itemData.pointType;
            endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, itemData._id);
            hasWritePermission = userPermissions.systemAdmin || userHasPermission(itemData.Security, permissionLevels.WRITE);

            switch (command) {
                case 'open':
                    workspaceManager.openWindowPositioned(endPoint.review.url, fullName, pointType, endPoint.review.target, id, {
                        width: 820,
                        height: 542
                    });
                    break;
                case 'clone':
                    workspaceManager.openWindowPositioned('/api/points/newPoint/' + id, 'New Point', '', '', 'newPoint', {
                        width: 960,
                        height: 280
                    });
                    break;
                case 'edit':
                    workspaceManager.openWindowPositioned(endPoint.edit.url, fullName, pointType, endPoint.edit.target, id, {
                        width: 820,
                        height: 542
                    });
                    break;
                case 'delete':
                case 'destroy':
                    if (!hasWritePermission) return;
                    // Disallowed if the point is on a GPL sequence (it must be deleted from within the sequence)
                    if (itemData._parentUpi !== 0) {
                        var _endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint('Sequence', itemData._parentUpi),
                            link = '<a href="javascript: void(0)" onclick="workspaceManager.openWindowPositioned(\'' + _endPoint.review.url + '\', \'\', \'Sequence\', \'' + _endPoint.review.target + '\', ' + itemData._parentUpi + ', {width: 820,height: 542});">Sequence</a>',
                            message = '<h4>This point cannot be deleted here. It must be deleted from the ' + link + '</h4>';
                        workspaceManager.showConfirmation({
                            message: message
                        });
                        return;
                    }
                    if (socketHistory[id]) {
                        // User shouldn't be able to select a menu option before the previous one completes but just in case...
                        // Message indicating an operation is already in progress for this point
                        bannerJS.showBanner({
                            msg: ['This action cannot be completed at this time. A', socketHistory[id].command, 'is already in progress.'].join(' '),
                            dismissText: "Dismiss",
                            animatePage: false
                        });
                        return;
                    }
                    workspaceManager.showConfirmation({
                        message: '<h4>Are you sure you want to ' + command + ' this point?</h4>',
                        okText:  Command,
                        okClass: 'btn-danger',
                        callback: function (result) {
                            if (result == false) {
                                return;
                            }
                            listManager.$contextIcon.removeClass('edit fa-gear').addClass('busy fa-spinner fa-spin');

                            socketEmit({
                                command: command,
                                data: {
                                    upi: id,
                                    method: itemData._pStatus === 0 ? 'soft' : 'hard'
                                },
                                qData: {
                                    command: command,
                                    listManager: listManager
                                }
                            });
                            // If we're in browse mode re-render and refresh the list box to get our spinner icon (it would revert to a gear without doing this)
                            if (listManager.segmentNumber !== undefined) {
                                var $browseList = $browse['list' + listManager.segmentNumber];
                                $browseList.jqxListBox('render');
                                $browseList.jqxListBox('refresh');
                            }
                        }
                    });
                    break;
                case 'restore':
                    if (!hasWritePermission) return;
                    if (socketHistory[id]) {
                        // User shouldn't be able to select a menu option before the previous one completes but just in case...
                        // Message indicating an operation is already in progress for this point
                        bannerJS.showBanner({
                            msg: ['This action cannot be completed at this time. A', socketHistory[id].command, 'is already in progress.'].join(' '),
                            dismissText: "Dismiss",
                            animatePage: false
                        });
                        return;
                    }
                    workspaceManager.showConfirmation({
                        message: '<h4>Are you sure you want to restore this point?</h4>',
                        okText:  'Restore',
                        okClass: 'btn-success',
                        callback: function (result) {
                            if (result == false) {
                                return;
                            }
                            listManager.$contextIcon.removeClass('edit fa-gear').addClass('busy fa-spinner fa-spin');

                            socketEmit({
                                command: command,
                                data: {
                                    upi: id
                                },
                                qData: {
                                    command: command,
                                    listManager: listManager
                                }
                            });
                            // If we're in browse mode re-render and refresh the list box to get our spinner icon (it would revert to a gear without doing this)
                            if (listManager.segmentNumber !== undefined) {
                                var $browseList = $browse['list' + listManager.segmentNumber];
                                $browseList.jqxListBox('render');
                                $browseList.jqxListBox('refresh');
                            }
                        }
                    });
                    break;
                case 'add all':
                    permissions = {
                        type: 'folder',
                        action: 'add',
                        groupid: permGroupId
                    };
                    for (i = 1; i < segmentNumber + 1; i++) {
                        folderName = $.trim(viewModel.browse['name' + i]());
                        if (!!folderName) {
                            permissions['name' + i] = folderName;
                        }
                    }
                    toggleGroup(permissions, listManager.item.index);
                    break;
                case 'remove all':
                    permissions = {
                        type: 'folder',
                        action: 'remove',
                        groupid: permGroupId
                    };
                    for (i = 1; i < segmentNumber + 1; i++) {
                        folderName = $.trim(viewModel.browse['name' + i]());
                        if (!!folderName) {
                            permissions['name' + i] = folderName;
                        }
                    }
                    toggleGroup(permissions, listManager.item.index);
                case 'close':
                    $contextMenu.jqxMenu('close');
            }
            $contextMenu.jqxMenu('close');
        });

        $newPointBtn.on('click', function() {
            var selectedPointType = '',
                selectedpointTypes = getCheckedPointTypeItems(),
                win;

            if (selectedpointTypes.length === 1) {
                selectedPointType = window.encodeURI(selectedpointTypes[0].originalItem.key);
            }

            win = workspaceManager.openWindowPositioned('/api/points/newPoint/?selectedPointType=' + selectedPointType, 'New Point', '', '', 'newPoint', {
                width: 960,
                height: 280
            });
        });

        function browseListSelect(segmentNumber) {
            return function(event) {
                var row = event.args,
                    $target,
                    renderCoords,
                    i,
                    rowIndex,
                    item,
                    params = {},
                    pointTypes = viewModel.availablePointTypes(),
                    projectedSegment = segmentNumber + 1,
                    folderName,
                    rowData,
                    fullName,
                    pointType,
                    segmentName,
                    endPoint,
                    showDeleted = viewModel.showDeleted(),
                    showInactive = viewModel.showInactive(),
                    permissions,
                    permGroupIndex;

                if (row && row.originalEvent) {
                    $target = $(row.originalEvent.target);
                    renderCoords = $target.offset();
                    rowIndex = row.index;
                    rowData = viewModel.browse['filteredData' + segmentNumber]()[rowIndex];
                    item = row.item;

                    //set filter for reports
                    if (module.MODE == 'filter') {
                        switch (segmentNumber) {
                            case 1:
                                viewModel.reportFilter.name2('');
                            case 2:
                                viewModel.reportFilter.name3('');
                            case 3:
                                viewModel.reportFilter.name4('');
                        }
                        segmentName = rowData['name' + segmentNumber];
                        viewModel.reportFilter['name' + segmentNumber](segmentName);
                        viewModel.browse['name' + segmentNumber](segmentName);
                    }

                    if (rowData.isPoint) {
                        fullName = rowData.Name;
                        pointType = rowData.pointType[0];
                        endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, rowData._id);

                        if ($target.is('span.edit')) {
                            if (!!rowData.menuItems) {
                                window.focus();
                                $contextMenu.jqxMenu({
                                    source: rowData.menuItems
                                });
                                $contextMenu.jqxMenu('open', renderCoords.left - ($contextMenu.width() / 2) - 10, renderCoords.top - 7);
                                $contextMenu.data({
                                    listManager: {
                                        $contextIcon: $target,
                                        $itemElement: $(item.element),
                                        segmentNumber: segmentNumber,
                                        itemData: rowData,
                                        itemIndex: item.index,
                                        item: item
                                    }
                                });
                            }
                            return;
                        }

                        if ($target.is('span.perm')) {
                            permGroupIndex = rowData.Security.indexOf(permGroupId);
                            permissions = {
                                type: 'point',
                                action: !!~permGroupIndex ? 'remove' : 'add',
                                groupid: permGroupId
                            };
                            for (i = 1; i < segmentNumber; i++) {
                                folderName = $.trim(viewModel.browse['name' + i]());
                                permissions['name' + i] = folderName;
                            }
                            permissions['name' + segmentNumber] = rowData['name' + segmentNumber];
                            toggleGroup(permissions).done(function(data) {
                                if (!!data.err) return;
                                if (!!~permGroupIndex) {
                                    rowData.Security.splice(permGroupIndex, 1);
                                } else {
                                    rowData.Security.push(permGroupId);
                                }
                                $browse['list' + segmentNumber].jqxListBox('invalidate');
                            });
                            return;
                        }

                        //Just in case the menu is still open
                        $contextMenu.jqxMenu('close');

                        switch (segmentNumber) {
                            case 1:
                                viewModel.browse.name2('');
                                viewModel.browse.filter2('');
                                viewModel.browse.data2([]);
                            case 2:
                                viewModel.browse.name3('');
                                viewModel.browse.filter3('');
                                viewModel.browse.data3([]);
                            case 3:
                                viewModel.browse.name4('');
                                viewModel.browse.filter4('');
                                viewModel.browse.data4([]);
                        }

                        $browse['list' + segmentNumber].jqxListBox('unselectItem', item);

                        switch (module.MODE) {
                            case 'select':
                                externalCallback(rowData._id, fullName);
                                window.close();
                                break;
                            case 'perm':
                                //Todo:
                            case 'filter':
                                return;
                            default:
                                workspaceManager.openWindowPositioned(endPoint.review.url, fullName, pointType, endPoint.review.target, rowData._id, {
                                    width: 820,
                                    height: 542
                                });
                        }
                    } else {
                        //Just in case the menu is still open
                        $contextMenu.jqxMenu('close');

                        viewModel.browse['name' + segmentNumber](item.label);

                        switch (segmentNumber) {
                            case 1:
                                viewModel.browse.name2('');
                                viewModel.browse.filter2('');
                                viewModel.browse.data3([]);
                            case 2:
                                viewModel.browse.name3('');
                                viewModel.browse.filter3('');
                                viewModel.browse.data4([]);
                            case 3:
                                viewModel.browse.name4('');
                                viewModel.browse.filter4('');
                        }

                        if ($.trim(item.label) == '') {
                            return $browse['list' + projectedSegment].jqxListBox('clearSelection');
                        }

                        if ($target.is('span.perm')) {
                            if (!!rowData.menuItems) {
                                window.focus();
                                $contextMenu.jqxMenu({
                                    source: rowData.menuItems
                                });
                                $contextMenu.jqxMenu('open', renderCoords.left - ($contextMenu.width() / 2) - 10, renderCoords.top - 7);
                                $contextMenu.data({
                                    listManager: {
                                        segmentNumber: segmentNumber,
                                        item: item,
                                        itemData: rowData
                                    }
                                });
                            }
                            return;
                        }

                        if (showDeleted) params.showDeleted = showDeleted;
                        if (showInactive) params.showInactive = showInactive;

                        for (i = 1; i < projectedSegment; i++) {
                            folderName = $.trim(viewModel.browse['name' + i]());
                            params['name' + i] = folderName;
                        }

                        params.nameSegment = projectedSegment;

                        params.pointTypes = pointTypes.map(function(item) {
                            return item.key
                        });

                        if (!!browseRequest) {
                            browseRequest.abort();
                            clearTimeout(browseTimer);
                            $browseBusy.hide();
                        }

                        browseRequest = getBrowseData(params).done(function(data) {
                            updateBrowseVM(data, projectedSegment)
                        });
                    }
                }
            };
        }

        function userHasPermission(pointGroups, requestedAccessLevel) {
            var cumulativePermissions = 0,
                groups = userPermissions.groups.filter(function(item) {
                    return !!~pointGroups.indexOf(item._id)
                });

            for (var i = 0, last = groups.length; i < last; i++) {
                cumulativePermissions |= groups[i]._pAccess;
            }
            return !!(cumulativePermissions & requestedAccessLevel);
        }

        ko.applyBindings(viewModel);
    }

    function updateBrowseVM(data, segment) {
        viewModel.browse['data' + segment](data);
        clearTimeout(browseTimer);
        browseReady();
        $browseBusy.hide();
    }

    function updateGridVM(data) {
        clearTimeout(searchTimer);
        dataAdapters.grid.beginUpdate();
        viewModel.grid.data(data);
        dataAdapters.grid.endUpdate();
        $searchBusy.hide();
    }

    function setFilterObj() {
        var filter;
        for (var i = 4; i; i--) {
            filter = externalFilterObj['name' + i];
            if (typeof filter != 'undefined') {
                viewModel.grid.toggleFilter(i, true);
                viewModel.reportFilter['name' + i](filter);
                viewModel.grid['name' + i].filter(filter);
            } else {
                viewModel.grid.toggleFilter(i, false);
                viewModel.grid['name' + i].filterOn(false);
            }
        }
        if (externalFilterObj.pointTypes.length == 0) {
            viewModel.allPointTypes(true);
        } else {
            module.checkPointTypes(externalFilterObj.pointTypes);
        }
    }

    module.init = function(callback, obj) {
        var browseParams;

        externalCallback = callback;
        externalFilterObj = obj;

        if (appIsInitialized && module.MODE == 'filter') {
            setFilterObj();
            return;
        }

        $splitter = $('#splitter');

        if (!workspaceManager) {
            $splitter.hide();
            alert('The Infoscan Point Navigator cannot be opened directly. You will now be redirected to the workspace.');
            window.location.replace('/');
        }

        user = workspaceManager.user();
        userPermissions = {
            systemAdmin: user['System Admin'].Value,
            groups: user.groups
        };

        $body = $('body');
        $searchTab = $('#listSearch');
        $browseTab = $('#millerBrowse');
        $pointTypesListBox = $('#pointTypes');
        $tabs = $('#jqxtabs');
        $searchGrid = $('#jqxgrid');
        $searchBusy = $('.searchBusy');
        $browseBusy = $('.browseBusy');
        $browse.list1 = $('#browseList1');
        $browse.list2 = $('#browseList2');
        $browse.list3 = $('#browseList3');
        $browse.list4 = $('#browseList4');
        $contextMenu = $('.contextMenu');
        $newPointBtn = $('.newPointBtn');

        viewModel = new ViewModel();

        // JDR 4.1.2015 Initial browse request uses all available point types; save segment one browse data
        browseParams = {
            pointTypes: viewModel.availablePointTypes().map(function(item) {
                return item.key;
            })
        };
        browseRequest = getBrowseData(browseParams).done(function(data) {
            segmentOneBrowseData = data;
            updateBrowseVM(data, 1);
        });

        if (module.MODE == 'perm') {
            $browseTab.find('input:first').focus();
            permGroupId = obj.groupid;
            permGroupName = obj.groupname;
        } else {
            $searchTab.find('input:first').focus();
        }

        bindUI();

        if (module.MODE == 'filter') {
            setFilterObj();
        }

        if (module.MODE != 'nav') {
            // $('.actionGroup').hide();
            // Hide everything in the actionGroup except for the reset navigator button
            $('.actionGroup *:not(.resetNavBtn)').hide();
        }

        if (externalFilterObj) {
            viewModel.grid.name1.filter(externalFilterObj.name1);
            viewModel.grid.name2.filter(externalFilterObj.name2);
            viewModel.grid.name3.filter(externalFilterObj.name3);
            viewModel.grid.name4.filter(externalFilterObj.name4);
            if (!!externalFilterObj.selectedPointTypes && externalFilterObj.selectedPointTypes.length > 0) {
                module.checkPointTypes(externalFilterObj.selectedPointTypes);
            }
        }

        appIsInitialized = true;
        bannerJS.init();
    };

    // reference will be lost if the refresh.
    //we'll simply close the window
    $(function() {
        //if (!!~['select', 'filter'].indexOf(module.MODE)) {
        window.onbeforeunload = function() {
            window.close();
        };
        //}
    });

    return module;
})(window.pointLookup || {}, ko, jQuery);
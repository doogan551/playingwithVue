/*jslint white: true*/
define(['knockout', 'bootstrap-3.3.4', 'text!./view.html'], function(ko, bootstrap, view) {
    var ASC = -1,
        DESC = 1;

    var createInherit = function(superClass, subClass) {
        subClass.prototype = Object.create(superClass.prototype);
        subClass.prototype.constructor = subClass;
    };

    function ViewModel(params) {
        var self = this;
        var $modalWait;
        var $modalError;
        var $modalValue;

        var init = function() {

            // Save references to our modal
            $modal = $('.modal.networkInfo');
            $modalWait = $('.modalScene.modalWait');
            $modalError = $('.modalScene.modalError');
            $modalValue = $('.modalScene.modalValue');
            // Resize modal on shown event
            $modal.on('shown.bs.modal', self.sizeModal);
            self.currentTab = $('.devicesTable');
            $('.devicesTable').hide();
            $('.pointsTable').hide();
            $('.routerTable').hide();
            self.isInitialized(true);
        };

        self.root = params.rootContext;
        self.apiEndpoint = self.root.apiEndpoint;
        self.point = self.root.point;
        self.utility = self.root.utility;
        self.config = self.utility.config;
        self.data = self.point.data;
        self.gettingData = false;
        self.readOnOpen = true;

        // self.sortOrder = ko.observable();
        self.showModal = ko.observable(false);
        self.errorText = ko.observable('');
        self.isInitialized = ko.observable(false);

        self.deviceProperties = ko.observableArray(['Point Type', 'Point Instance', 'Network Number', 'Vendor ID', 'Max APDU Length', 'Change Count', 'Read Property Only', 'No Priority Array', 'MAC Address']);
        self.pointProperties = ko.observableArray(['Point Type', 'Point Instance', 'Device Instance', 'Poll Period']);
        self.routerProperties = ko.observableArray(['Network Number', 'Port Number', 'Change Count', 'MAC Address']);

        self.getData = function() {
            self.currentTab.hide();
            $modalWait.show();
            if (!!self.isInitialized()) {
                self.point.issueCommand('Network Info', {
                    upi: self.data._id()
                }, function(result) {
                    $modalWait.hide();
                    $modalError.hide();
                    $modalValue.hide();
                    if (!!result.error()) {
                        $modalError.show();
                        self.errorText(result.error());
                    } else {
                        self.NetworkDevices.buildArray(result.value()['Network Devices'] || []);
                        self.NetworkPoints.buildArray(result.value()['Network Points'] || []);
                        self.RouterTable.buildArray(result.value()['Router Table'] || []);
                        self.currentTab.show();
                        $modalValue.show();
                    }
                });
            }
        };

        self.getPointRef = function(upi, cb) {
            /*Display the instance number. If found then also display a link with the point name. If not found then try to
            find a Remote Unit point with the Instance property set for this. If found then display a link with the Remote Unit point name.*/
            $.ajax({
                url: '/api/points/getpointref/instance/' + upi + '/' + self.data._id(),
                contentType: 'application/json',
                dataType: 'json',
                type: 'get'
            }).done(function(data) {
                if (!!data.err) {
                    cb(data.err);
                } else {
                    cb(null, data);
                }
            });
        };

        self.openPointRef = function(property) {
            var address = this[property].pointRef.Address();
            if (address !== '') {
                var workspace = window.opener.workspaceManager;
                var win = workspace.openWindowPositioned(address, this[property].pointRef.Value(), this[property].pointRef.PointType(), '', this[property].pointRef.upi(), {
                    width: 1250,
                    height: 750
                });
            }
        };

        self.compare = function(a, b) {
            var prop = this.sortProperty();

            if (a[prop].Value() < b[prop].Value())
                return -1 * this.sortOrder();
            if (a[prop].Value() > b[prop].Value())
                return 1 * this.sortOrder();
            return 0;
        };

        function NetworkInfo() {
            var pointRef = function(_this) {
                this.Value = ko.observable(0);
                this.upi = ko.observable(_this.val());
                this.Address = ko.observable('');
                this.PointType = ko.observable('');
                this.set = function() {
                    var that = this;
                    self.getPointRef(_this.val(), function(err, data) {
                        if (!!data.Name) {
                            that.Value(data.Name);
                            that.Address(self.config.Utility.pointTypes.getUIEndpoint(data['Point Type'].Value, data._id).review.url);
                            that.PointType(data['Point Type'].Value);
                        } else {
                            that.Value(_this.val().toString());
                        }
                    });
                };
            };

            this.sortOrder = ko.observable();
            this.sortProperty = ko.observable();
            this.entries = ko.observableArray([]);
            this['Point Type'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    for (var prop in self.config.Enums['Point Types']) {
                        var pT = self.config.Enums['Point Types'][prop];
                        if (pT.enum === val) {
                            val = prop;
                            break;
                        }
                    }
                    return val;
                };
            };
            this['Point Instance'] = function() {
                this.val = ko.observable(0);
                this.Value = function() {
                    var val = this.val();
                    this.pointRef.set();
                    return this.pointRef.Value();
                };
                this.pointRef = new pointRef(this);
                this.style = ko.computed(function() {
                    return (this.pointRef.PointType() !== '') ? 'instanceLink' : '';
                }, this);
            };
            this['Network Number'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    return val;
                };
            };
            this['Vendor ID'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    return val;
                };
            };
            this['Max APDU Length'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    return val;
                };
            };
            this['Change Count'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    return val;
                };
            };
            this['Read Property Only'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    return (!!val) ? 'Yes' : 'No';
                };
            };
            this['No Priority Array'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    return (!!val) ? 'Yes' : 'No';
                };
            };
            this['MAC Address'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();

                    return val;
                };
            };
            this['Device Instance'] = function() {
                this.val = ko.observable(0);
                this.Value = function() {
                    var val = this.val();
                    this.pointRef.set();
                    return this.pointRef.Value();
                };
                this.pointRef = new pointRef(this);
                this.style = ko.computed(function() {
                    return (this.pointRef.PointType() !== '') ? 'instanceLink' : '';
                }, this);
            };
            this['Poll Period'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    return val;
                };
            };
            this['Port Number'] = function() {
                this.val = ko.observable(-1);
                this.Value = function() {
                    var val = this.val();
                    switch (val) {
                        case 0:
                        case 1:
                        case 2:
                        case 3:
                            val = 'Serial Port ' + (val + 1);
                            break;
                        case 4:
                            val = 'Ethernet Port';
                            break;
                        case 5:
                            val = 'Downlink Ethernet';
                            break;
                        default:
                            val = 'Invalid';
                            break;
                    }

                    return val;
                };
            };
            this.buildArray = function(data) {
                var returnArray = [];
                for (var i = 0; i < data.length; i++) {
                    var point = {};
                    for (var prop in data[i]) {
                        point[prop] = new this[prop]();
                        point[prop].val(data[i][prop]);
                    }
                    returnArray.push(point);
                }
                this.entries(returnArray);
            };
        }

        function NetworkDevices() {
            var _this = this;
            NetworkInfo.call(this);
            // var props = ['Point Type', 'Point Instance', 'Network Number', 'Vendor ID', 'Max APDU Length', 'Change Count', 'Read Property Only', 'No Priority Array', 'MAC Address'];
        }

        function NetworkPoints() {
            var _this = this;
            NetworkInfo.call(this);
            // var props = ['Point Type', 'Point Instance', 'Device Instance', 'Poll Period'];
        }

        function RouterTable() {
            var _this = this;
            NetworkInfo.call(this);
            // var props = ['Network Number', 'Port Number', 'Change Count', 'MAC Address'];
        }

        createInherit(NetworkInfo, NetworkDevices);
        createInherit(NetworkInfo, NetworkPoints);
        createInherit(NetworkInfo, RouterTable);

        self.NetworkDevices = new NetworkDevices();
        self.NetworkPoints = new NetworkPoints();
        self.RouterTable = new RouterTable();

        self.sortDevices = function(model, e) {
            var self = this;
            var column = $(e.target);
            var property = column.text();
            if (!property) {
                column = $(e.target.parentElement);
                property = column.text();
            }

            self.NetworkDevices.sortProperty(property);
            $('.deviceheaders th').find('i').removeClass('fa-chevron-up');
            $('.deviceheaders th').find('i').removeClass('fa-chevron-down');


            if (self.NetworkDevices.sortOrder() !== ASC) {
                self.NetworkDevices.sortOrder(ASC);
                column.find('i').addClass('fa-chevron-up');
            } else {
                self.NetworkDevices.sortOrder(DESC);
                column.find('i').addClass('fa-chevron-down');
            }

            self.NetworkDevices.entries(self.NetworkDevices.entries().sort(self.compare.bind(self.NetworkDevices)));
        };

        self.sortPoints = function(model, e) {
            var self = this;
            var column = $(e.target);
            var property = column.text();
            if (!property) {
                column = $(e.target.parentElement);
                property = column.text();
            }

            self.NetworkPoints.sortProperty(property);
            $('.pointheaders th').find('i').removeClass('fa-chevron-up');
            $('.pointheaders th').find('i').removeClass('fa-chevron-down');


            if (self.NetworkPoints.sortOrder() !== ASC) {
                self.NetworkPoints.sortOrder(ASC);
                column.find('i').addClass('fa-chevron-up');
            } else {
                self.NetworkPoints.sortOrder(DESC);
                column.find('i').addClass('fa-chevron-down');
            }

            self.NetworkPoints.entries(self.NetworkPoints.entries().sort(self.compare.bind(self.NetworkPoints)));
        };
        self.sortRouter = function(model, e) {
            var self = this;
            var column = $(e.target);
            var property = column.text();
            if (!property) {
                column = $(e.target.parentElement);
                property = column.text();
            }

            self.RouterTable.sortProperty(property);
            $('.routerheaders th').find('i').removeClass('fa-chevron-up');
            $('.routerheaders th').find('i').removeClass('fa-chevron-down');

            if (self.RouterTable.sortOrder() !== ASC) {
                self.RouterTable.sortOrder(ASC);
                column.find('i').addClass('fa-chevron-up');
            } else {
                self.RouterTable.sortOrder(DESC);
                column.find('i').addClass('fa-chevron-down');
            }

            self.RouterTable.entries(self.RouterTable.entries().sort(self.compare.bind(self.RouterTable)));
        };

        init();

    }

    ViewModel.prototype.switchTab = function(model, e) {
        var self = this;
        var btnTxt = $(e.target).text();
        var $deviceTable = $('.devicesTable');
        var $pointTable = $('.pointsTable');
        var $routerTable = $('.routerTable');

        self.currentTab.hide();
        $(e.target).siblings().removeClass('btnClicked');
        switch (btnTxt) {
            case 'Network Devices':
                self.currentTab = $deviceTable;
                break;
            case 'Network Points':
                self.currentTab = $pointTable;
                break;
            case 'Router Table':
                self.currentTab = $routerTable;
                break;
        }
        self.currentTab.show();
        $(e.target).addClass('btnClicked');
    };

    /*ViewModel.prototype.sortDevices = function(model, e) {
        var self = this;
        var property = $(e.target).text();
        self.networkDevices().sort(self.compare.bind(networkDevices));

        // if (!$sortIcon) {
        //     $sortIcon = $('thead th:first i');
        // }
        // $sortIcon.removeClass('fa-chevron-up fa-chevron-down');
        // if (self.sortOrder() == ASC) {
        //     self.sortOrder(DESC);
        //     $sortIcon.addClass('fa-chevron-down');
        // } else {
        //     self.sortOrder(ASC);
        //     $sortIcon.addClass('fa-chevron-up');
        // }
    };*/

    ViewModel.prototype.toggleNetworkInfo = function() {
        this.showModal(true);
        this.getData();
        /*if (this.readOnOpen)
            this.getUpload();*/
    };

    ViewModel.prototype.printHistory = function() {
        var $modal = $('.modal.viewTrend'),
            $modalTime = $modal.find('.modalTime'),
            $modalValue = $modal.find('.modalValue');
        // requires jquery-migrate to function properly
        //$modalValue.printElement();
        /*$modalTime.hide('fast', function() {
            window.print();
        });*/

        var w = window.open();
        var html = $modalValue.html();

        $(w.document.body).html(html);
        w.print();
        w.close();
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        this.trendDataSorted.dispose();
    };

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
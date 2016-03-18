/*jslint white: true*/
define(['knockout', 'moment', 'bootstrap-3.3.4', 'datetimepicker', 'text!./view.html'], function(ko, moment, bootstrap, datetimepicker, view) {
    var ASC = -1,
        DESC = 1,
        $sortIcon,
        $modal,
        $modalDialog,
        $modalHeader,
        $modalFooter,
        $modalBody;

    function sortArray(prop, dir) { // This routine must be called using .call
        var opp = ~dir + 1; // Get opposite direction (-1 to 1 or 1 to -1)
        return this.sort(function(obj1, obj2) {
            return (obj1[prop] == obj2[prop]) ? 0 : (obj1[prop] < obj2[prop]) ? opp : dir;
        });
    }

    function ViewModel(params) {
        var self = this,
            getContrast = function(hexcolor) { // http://24ways.org/2010/calculating-color-contrast/
                var r = parseInt(hexcolor.substr(0, 2), 16),
                    g = parseInt(hexcolor.substr(2, 2), 16),
                    b = parseInt(hexcolor.substr(4, 2), 16),
                    yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                return (yiq >= 128) ? 'black' : 'white';
            },
            init = function() {
                var prop,
                    qualityCodes = self.utility.workspace.systemEnumObjects.qualityCodes,
                    qcColors = {
                        inAlarm: qualityCodes.Abnormal.color,
                        inFault: qualityCodes.Fault.color,
                        oos: qualityCodes['Out of Service'].color,
                        overridden: qualityCodes.Overridden.color
                    };
                for (prop in qcColors) {
                    var val = qcColors[prop];
                    self.sfColors[prop] = {
                        bg: '#' + val,
                        color: getContrast(val)
                    };
                }

                // If we have an enum value type, build the reverse order of Value.ValueOptions
                if (self.isEnumValueType) {
                    var valueOptions = ko.viewmodel.toModel(self.data.Value.ValueOptions);
                    for (prop in valueOptions) {
                        self.revValueOptions[valueOptions[prop]] = prop;
                    }
                }

                // Save references to our modal
                $modal = $('.modal.viewTrend');
                $modalDialog = $modal.find('.modal-dialog');
                $modalHeader = $modal.find('.modal-header');
                $modalFooter = $modal.find('.modal-footer');
                $modalBody = $modal.find('.modal-body');
                // Resize modal on shown event
                $modal.on('shown.bs.modal', self.sizeModal);
            };

        self.root = params.rootContext;
        self.apiEndpoint = self.root.apiEndpoint;
        self.config = self.root.utility.config;
        self.point = self.root.point;
        self.utility = self.root.utility;
        self.config = self.utility.config;
        self.data = self.point.data;
        self.gettingData = false;
        self.readOnOpen = true;
        self.isEnumValueType = self.data.Value.ValueType() === self.config.Enums['Value Types'].Enum['enum'];
        self.revValueOptions = {};
        self.sfColors = {}; // Status flag colors

        self.sortOrder = ko.observable(ASC);
        self.showModal = ko.observable(false);
        self.errorText = ko.observable('');
        self.reButton = ko.observable('');
        self.reqType = ko.observable('');
        self.startTime = ko.observable(Math.floor(Date.now() / 1000));
        self.page = ko.observable(0);
        self.direction = ko.observable('next');
        self.minDate = ko.observable();
        self.maxDate = ko.observable();
        self.trendData = ko.observableArray([]);
        self.trendDataSorted = ko.computed(function() {
            var trendData = self.trendData(),
                sortOrder = self.sortOrder(),
                _array = [];
            Array.prototype.push.apply(_array, trendData);
            return sortArray.call(_array, 'timestamp', sortOrder);
        }, self);

        self.reqType.subscribe(function(type) {
            var $uploadBtn = $('.btnUpload'),
                $historyBtn = $('.btnHistory');

            if (type === 'upload') {
                $uploadBtn.attr('disabled', 'disabled');
                $historyBtn.removeAttr('disabled');
                self.reButton('Refresh');
                self.getUpload();
            } else if (type === 'history') {

                $(function() {
                    $('#datetimepicker1').datetimepicker({
                        minDate: self.minDate(),
                        maxDate: self.maxDate(),
                        showClear: true,
                        showClose: true
                    });
                });
                $historyBtn.attr('disabled', 'disabled');
                $uploadBtn.removeAttr('disabled');
                self.reButton('Reset');
                self.startTime(Math.floor(Date.now() / 1000));
                self.page(1);
                self.getHistory();
            }
        });

        /*self.page.subscribe(function(num) {
            var $btn = $('.prevBtn');

            if (num === 1) {
                $btn.attr('disabled', 'disabled');
            } else {
                $btn.removeAttr('disabled');
            }
        });*/

        self.showModal.subscribe(function(bool) {
            if (bool) {
                self.reqType((self.reqType() !== '') ? self.reqType() : 'upload');
            }
        });

        self.maxDateFormat = ko.computed(function() {
            return moment(self.maxDate()).format("MM/DD/YYYY HH:mm:ss");
        });
        self.minDateFormat = ko.computed(function() {
            return moment(self.minDate()).format("MM/DD/YYYY HH:mm:ss");
        });

        self.getLimits();
        init();
        // Resize modal when the window is resized
        $(window).resize(function() {
            if (!self.showModal())
                return;
            clearTimeout(self.resizeId);
            self.resizeId = setTimeout(self.sizeModal, 100);
        });
    }

    ViewModel.prototype.sizeModal = function() {
        var modalPadding,
            height;

        modalPadding = 2 * $modalDialog.css('padding-top').split('px')[0];
        height = $(window).height() - modalPadding - $modalHeader.outerHeight(true) - $modalFooter.outerHeight(true) - 10;
        if (!isNaN(height)) {
            $modalBody.height(height);
            $modalBody.css('max-height', height);
        }
    };

    // Use prototype to declare any public methods
    ViewModel.prototype.toggleModal = function() {
        this.showModal(true);
        /*if (this.readOnOpen)
            this.getUpload();*/
    };

    ViewModel.prototype.getLimits = function() {
        var self = this,
            data = {
                upi: self.data._id()
            };
        $.ajax({
            type: 'POST',
            url: self.apiEndpoint + 'trenddata/getTrendLimits',
            data: data
        }).done(function(data) {
            self.minDate(moment.unix(data.min));
            self.maxDate(moment.unix(data.max));
        });
    };

    ViewModel.prototype.doUpload = function(data, e) {

        data.reqType('upload');
    };

    ViewModel.prototype.doHistory = function(data, e) {

        data.reqType('history');
    };

    ViewModel.prototype.showTime = function() {
        var $modal = $('.modal.viewTrend'),
            $modalTime = $modal.find('.modalTime');

        $modalTime.toggle('fast');
    };

    ViewModel.prototype.printHistory = function() {
        var $modal = $('.modal.viewTrend'),
            $modalTime = $modal.find('.modalTime'),
            $modalValue = $modal.find('.modalValue');
        var formatString = 'MMM Do, YYYY - HH:mm:ss';
        // requires jquery-migrate to function properly
        //$modalValue.printElement();
        /*$modalTime.hide('fast', function() {
            window.print();
        });*/

        var w = window.open();
        var html = '<label>' + this.point.data.Name() + '</label>';
        var dates = $modalValue.find('.viewTrendPrettyDate');

        dates.each(function(index, dateRow) {
            var date = $(dateRow).attr('timestamp');
            var prettyDate = $(dateRow).text();
            var newDate = moment.unix(date).format(formatString);
            console.log(date, newDate, $(dateRow).text().replace(prettyDate, newDate), $(dateRow).text());
            $(dateRow).text($(dateRow).text().replace(prettyDate, newDate));
        });
        html += $modalValue.html();

        $(w.document.body).html(html);
        w.print();

        dates.each(function(index, dateRow) {
            var date = $(dateRow).attr('timestamp');
            var newDate = moment.unix(date).format(formatString);
            var prettyDate = moment.unix(date).calendar();
            $(dateRow).text($(dateRow).text().replace(newDate, prettyDate));
        });
        w.close();
    };

    ViewModel.prototype.getUpload = function() {
        if (this.gettingData)
            return;

        var self = this,
            $btn = $('.btnViewTrend'),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal.viewTrend'),
            $modalScene = $modal.find('.modalScene'),
            $modalWait = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $modalError = $modal.find('.modalError'),
            $btnSubmit = $modal.find('.btnSubmit'),
            callback = function(data) {
                console.log(data);
                self.loadView(data, 'upload');
            };


        $modalScene.hide();
        $modalWait.show();
        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-signal fa-check fa-warning').addClass('fa-refresh fa-spin');

        self.readOnOpen = true; // Assume we'll read again the next time the modal is opened
        self.gettingData = true;
        self.point.issueCommand('Trend Data', {
            upi: self.data._id()
        }, callback);
    };

    ViewModel.prototype.getHistory = function() {
        var self = this,
            $btn = $('.btnViewTrend'),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal.viewTrend'),
            $modalScene = $modal.find('.modalScene'),
            $modalWait = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $modalError = $modal.find('.modalError'),
            $btnSubmit = $modal.find('.btnSubmit'),
            data = {
                startTime: self.startTime(),
                page: self.page(),
                limit: 256,
                upi: self.data._id()
            };

        $modalScene.hide();
        $modalWait.show();
        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-signal fa-check fa-warning').addClass('fa-refresh fa-spin');

        self.readOnOpen = true; // Assume we'll read again the next time the modal is opened
        self.gettingData = true;
        $.ajax({
            type: 'POST',
            url: self.apiEndpoint + 'trenddata/viewTrend',
            data: data
        }).done(function(data) {
            if (!data.err && data.length !== 0) {
                $('.nextBtn').removeAttr('disabled');
                $('.prevBtn').removeAttr('disabled');
            } else if (self.direction() === "next") {
                $('.nextBtn').attr('disabled', 'disabled');
            } else if (self.direction() === "previous") {
                $('.prevBtn').attr('disabled', 'disabled');
            }

            if (data.err) {
                data.error = ko.observable(data.err);
                data.value = ko.observable('');
            } else {
                data.error = ko.observable('');
                data.value = ko.observable(data);
                self.loadView(data, 'history');
            }
        });
    };

    ViewModel.prototype.loadView = function(data, type) {
        var self = this,
            $btn = $('.btnViewTrend'),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal.viewTrend'),
            $modalScene = $modal.find('.modalScene'),
            $modalWait = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $modalError = $modal.find('.modalError'),
            $btnSubmit = $modal.find('.btnSubmit'),
            styleBtn = function(error) {
                // If our modal is not open
                if (!self.showModal()) {
                    // Style the 'View Controls' button to provide the feedback result (without having to open the modal)
                    if (error) {
                        $btn.addClass('btn-danger');
                        $btnIcon.addClass('fa-warning');
                    } else {
                        $btn.addClass('btn-success');
                        $btnIcon.addClass('fa-check');
                    }
                } else {
                    // Style the 'Read Value' button with its default look
                    $btnIcon.addClass('fa-signal');
                }
            },
            getValue = function(rawValue) {
                if (self.isEnumValueType) {
                    return self.revValueOptions[rawValue] || rawValue;
                } else {
                    return self.config.Utility.formatNumber({
                        val: rawValue
                    });
                }
            },
            callback = function(commandRX) {

            };
        var response = data.value(),
            highestPriorityFound = false,
            sfEnums = self.config.Enums['Status Flags Bits'],
            i = 0,
            len = response.length;

        if (!self.showModal()) { // If our modal is not open
            self.readOnOpen = false; // Do not read on next open
        } // (Let user see result)
        self.gettingData = false;
        if (type === self.reqType()) {
            $modalScene.hide();
            $btnSubmit.prop('disabled', false);
            $btn.removeClass('btn-warning');
            $btnIcon.removeClass('fa-refresh fa-spin');

            if (data.error() !== '') {
                styleBtn(true);
                self.errorText(data.error());
                $modalError.show();
                return;
            }

            styleBtn(false);
            self.trendData().length = 0;
            // Process received data
            for (i; i < len; i++) {
                var trendEntry = response[i],
                    sf = trendEntry['status flags'] | trendEntry.statusflags;
                trendEntry.valueString = getValue((trendEntry.hasOwnProperty('value')) ? trendEntry.value : trendEntry.Value);
                trendEntry.prettyTime = moment.unix(trendEntry.timestamp).calendar();
                trendEntry.inAlarm = sf & sfEnums['In Alarm']['enum'];
                trendEntry.inFault = sf & sfEnums['In Fault']['enum'];
                trendEntry.oos = sf & sfEnums['Out of Service']['enum'];
                trendEntry.overridden = sf & sfEnums['Override']['enum'];

                self.trendData().push(trendEntry);
            }
            self.trendData.valueHasMutated();
            $modalValue.show();
        }
    };

    ViewModel.prototype.refreshData = function() {
        var self = this;
        self.getLimits();
        if (self.reqType() === 'upload') {
            self.getUpload();
        } else if (self.reqType() === 'history') {
            self.startTime(Math.floor(Date.now() / 1000));
            self.page(1);
            self.getHistory();
        }
    };

    ViewModel.prototype.setDateTime = function() {
        var self = this,
            time = new Date($('#datetimepicker1').data('date')).getTime() / 1000;

        self.startTime((!!time) ? time : Math.floor(Date.now() / 1000));
        self.page(1);
        self.getHistory();
    };

    ViewModel.prototype.reverseSort = function() {
        var self = this;

        if (!$sortIcon) {
            $sortIcon = $('thead th:first i');
        }
        $sortIcon.removeClass('fa-chevron-up fa-chevron-down');
        if (self.sortOrder() == ASC) {
            self.sortOrder(DESC);
            $sortIcon.addClass('fa-chevron-down');
        } else {
            self.sortOrder(ASC);
            $sortIcon.addClass('fa-chevron-up');
        }
    };

    ViewModel.prototype.previousPage = function() {
        var self = this;
        self.page(self.page() - 1);
        if (self.page() === 0)
            self.page(self.page() - 1);
        self.direction('previous');
        self.getHistory();
    };

    ViewModel.prototype.nextPage = function() {
        var self = this;
        self.page(self.page() + 1);
        if (self.page() === 0)
            self.page(self.page() + 1);
        self.direction('next');
        self.getHistory();
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
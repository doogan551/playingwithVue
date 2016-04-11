/*jslint white: true */
define(['knockout', 'text!./view.html', 'bannerJS', 'datetimepicker'], function(ko, view, bannerJS, datetimepicker) {
    function ViewModel(params) {
        var self = this;
        self.root = params.rootContext;
        self.config = self.root.utility.config;
        self.point = self.root.point;
        self.data = self.point.data;
        self.utility = self.root.utility;
        self.isEnumValueType = self.data.Value.ValueType() === self.config.Enums["Value Types"].Enum.enum;
        self.controllerId = self.utility.workspace.user().controllerId;
        self.disableControl = self.controllerId ? false : true; // Disable controls if user has invalid controller id
        self.revValueOptions = {};
        self.showModal = ko.observable(false);
        self.controlValue = ko.observable();
        self.controlPriority = ko.observable(self.data['Control Priority'] && self.data['Control Priority'].eValue());
        self.valueValidation = ko.observable('');
        self.showValidation = ko.observable(false);
        self.controlFocus = ko.observable(true);

        self.controlFocus.subscribe(function(focused) {
            self.showValidation(false);
            var val = self.controlValue();
            if (!focused) {
                if (['Analog Input', 'Analog Output'].indexOf(self.data['Point Type'].Value()) >= 0) {
                    self.min = self.data['Minimum Value'].Value();
                    self.max = self.data['Maximum Value'].Value();
                    if (val > self.max) {
                        self.controlValue(self.max);
                        self.valueValidation('Value ' + val + ' is greater maximum value: ' + self.max + '. Value has been set to max.');
                        self.showValidation(true);
                    } else if (val < self.min) {
                        self.controlValue(self.min);
                        self.valueValidation('Value ' + val + ' is lower minimum value: ' + self.min + '. Value has been set to min.');
                        self.showValidation(true);
                    }
                }
            }
        });
        // Initializations
        // Default control value is the current value
        if (self.isEnumValueType) {
            self.controlValue(self.data.Value.eValue());
            // Build the reverse order of Value.ValueOptions
            var valueOptions = ko.viewmodel.toModel(self.data.Value.ValueOptions);
            for (var prop in valueOptions) {
                self.revValueOptions[valueOptions[prop]] = prop;
            }
        } else {
            self.controlValue(self.data.Value.Value());
        }
        if (self.controlPriority() === 0) // We can't issue controls @ level 0
            self.controlPriority(16); // Select a good default

        self.checkReleaseModel = function() {
            switch (self.data._devModel()) {
                case self.config.Enums["Device Model Types"]["MicroScan 5 xTalk"].enum:
                case self.config.Enums["Device Model Types"]["MicroScan 5 UNV"].enum:
                case self.config.Enums["Device Model Types"]["SCADA Vio"].enum:
                    return true;
            }
            return false;
        }
        self.override = {
            'Time to Override': {
                Value: ko.observable(0),
                ValueType: ko.observable(12),
                isReadOnly: ko.observable(false),
                isDisplayable: ko.observable(true)
            }
        };
        self.override['Time to Override'].Value.subscribe(function(newValue) {
            var now = new Date();
            now.setSeconds(now.getSeconds() + newValue);
            $('#datetimepicker').data("DateTimePicker").date(now);
        });
        $(function() {
            $('#datetimepicker').datetimepicker({
                showClear: true,
                showClose: true,
                format: 'MM/DD/YY - HH:mm',
                sideBySide: true
            });
            $('#datetimepicker').data("DateTimePicker").defaultDate(new Date());
            $('#datetimepicker').focusout(function() {
                var newTime = $('#datetimepicker').data("DateTimePicker").date().unix() - Math.floor(Date.now() / 1000);
                if (newTime > 0) {
                    self.override['Time to Override'].Value(newTime);
                } else {
                    self.override['Time to Override'].Value(0);
                }
                $('#rtBtn').click();
            });
            $('.ttoInput').focusout(function() {
                $('#ttoBtn').click();
            });
            // $('#ttoBtn').click();
        });
    }

    function getOverrideTime(self) {
        var activeId = $('#timeControl').find('.active').attr('id');
        var time = self.override["Time to Override"].Value();;
        var ret = 0;

        if (activeId === 'ttoLabel' && time !== 0) {
            ret = Math.floor(Date.now() / 1000) + time;
        } else if (activeId === 'rtLabel') {
            ret = $('#datetimepicker').data("DateTimePicker").date().unix();
        }
        return ret;
    }

    function issueCommand(self, relinquish) {
        if (!self.root.authorize(self.data, self.root.permissionLevels.CONTROL))
            return;
        var $btn = $('.btnSendControl'),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal.sendControl'),
            $btnSubmit = $modal.find('.btnSubmit'),
            $btnSubmitIcon = $btnSubmit.find('.fa'),
            controlObject = {
                upi: self.data._id(),
                Relinquish: relinquish,
                Priority: self.controlPriority(),
                OvrTime: getOverrideTime(self),
                Wait: 1,
                Value: self.controlValue(),
                Controller: self.controllerId,
                logData: {
                    user: self.utility.workspace.user(),
                    point: {
                        _id: self.data._id(),
                        Security: self.data.Security(),
                        Name: self.data.Name(),
                        name1: self.data.name1(),
                        name2: self.data.name2(),
                        name3: self.data.name3(),
                        name4: self.data.name4(),
                        "Point Type": {
                            eValue: self.data["Point Type"].eValue()
                        }
                    },
                    newValue: {
                        Value: self.controlValue()
                    }
                }
            },
            styleBtn = function(error) {
                // If our modal is not open
                if (!self.showModal()) {
                    // Style the 'Send Control' button to provide the feedback result
                    if (error) {
                        $btn.addClass('btn-danger');
                        $btnIcon.addClass('fa-warning');
                    } else {
                        $btn.addClass('btn-success');
                        $btnIcon.addClass('fa-check');
                    }
                } else {
                    // Style the 'Send Control' button with its default look
                    $btnIcon.addClass('fa-bullseye');
                }
            },
            callback = function(commandRX) {
                $btnSubmit.prop('disabled', false);
                $btnSubmitIcon.removeClass('fa-refresh fa-spin');
                $btn.removeClass('btn-warning');
                $btnIcon.removeClass('fa-refresh fa-spin');
                if (!!commandRX.error()) {
                    styleBtn(true);
                    bannerJS.showBanner('Send control failed. ' + commandRX.error(), 'Ok', null, '#D50000');
                    return;
                }
                styleBtn(false);
            };

        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-bullseye fa-check fa-warning').addClass('fa-refresh fa-spin');
        $btnSubmitIcon.addClass('fa-refresh fa-spin');

        if (self.isEnumValueType) {
            controlObject.logData.newValue = {
                eValue: controlObject.Value,
                Value: self.revValueOptions[controlObject.Value]
            };
        }
        self.showModal(false);
        self.point.issueCommand('Command Point', controlObject, callback);
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.toggleModal = function() {
        var self = this,
            $modal = $('.modal.sendControl');

        self.showModal(true);

        $modal.on('shown.bs.modal', function(e) {
            var $valueField = $modal.find('.val:first');
            $valueField.focus().select();
            $('#datetimepicker').data("DateTimePicker").date(new Date());
        });

        $modal.on('hidden.bs.modal', function(e) {
            self.override['Time to Override'].Value(0);
            $('#ttoBtn').click();
            $('#ttoLabel').removeClass('active');
        });
    };

    ViewModel.prototype.sendControl = function() {
        issueCommand(this, 0);
    };

    ViewModel.prototype.relinquish = function() {
        issueCommand(this, 1);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {};

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
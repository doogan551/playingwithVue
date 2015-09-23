/*jslint white: true */
define(['knockout', 'text!./view.html', 'bannerJS'], function (ko, view, bannerJS) {
    function ViewModel (params) {
        var self            = this;
        self.root           = params.rootContext;
        self.config         = self.root.utility.config;
        self.point          = self.root.point;
        self.data           = self.point.data;
        self.utility        = self.root.utility;
        self.isEnumValueType= self.data.Value.ValueType() === self.config.Enums["Value Types"].Enum.enum;
        self.controllerId   = self.utility.workspace.user().controllerId;
        self.disableControl = self.controllerId ? false : true; // Disable controls if user has invalid controller id
        self.revValueOptions= {};

        self.showModal      = ko.observable(false);
        self.controlValue   = ko.observable();
        self.controlPriority= ko.observable(self.data['Control Priority'] && self.data['Control Priority'].eValue());

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
    }

    function issueCommand (self, relinquish) {
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
            styleBtn = function (error) {
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
            callback = function (commandRX) {
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
                Value:  self.revValueOptions[controlObject.Value]
            };
        }
        self.showModal(false);
        self.point.issueCommand('Command Point', controlObject, callback);
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.toggleModal = function () {
        var self = this,
            $modal = $('.modal.sendControl');

        self.showModal(true);

        $modal.one('shown.bs.modal', function (e) {
            var $valueField = $modal.find('.val:first');
            $valueField.focus().select();
        });
    };

    ViewModel.prototype.sendControl = function () {
        issueCommand(this, 0);
    };

    ViewModel.prototype.relinquish = function () {
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
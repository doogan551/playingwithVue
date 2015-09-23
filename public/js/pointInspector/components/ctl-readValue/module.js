define(['knockout', 'text!./view.html'], function (ko, view) {
    function ViewModel(params) {
        var self = this;
        self.root             = params.rootContext;
        self.config           = self.root.utility.config;
        self.enums            = self.config.Enums;
        self.point            = self.root.point;
        self.data             = self.point.data;
        self.utility          = self.root.utility;
        self.isEnumValueType  = self.data.Value.ValueType() === self.enums["Value Types"].Enum.enum;
        self.gettingData      = false;
        self.readOnOpen       = true;

        self.showModal        = ko.observable(false);
        self.errorText        = ko.observable('');
        self.presentValue     = ko.observable('');
        self.alarmState       = ko.observable('');
        self.reliability      = ko.observable('');
        self.authorizedValue  = ko.observable('');
        self.statusFlags      = {
            "Out of Service":   ko.observable(false),
            "Override":         ko.observable(false),
            "In Fault":         ko.observable(false),
            "In Alarm":         ko.observable(false),
            "All":              ko.observable(false)
        };
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.toggleModal = function () {
        this.showModal(true);
        if (this.readOnOpen)
            this.readValue();
    };

    ViewModel.prototype.readValue = function () {
        if (this.gettingData)
            return;
        var self     = this,
            $btn     = $('.btnReadValue'),
            $btnIcon = $btn.find('i.fa'),
            $modal   = $('.modal.readValue'),
            $modalScene = $modal.find('.modalScene'),
            $modalError = $modal.find('.modalError'),
            $modalWait  = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $btnSubmit  = $modal.find('.btnSubmit'),
            getValueOption = function (key, value) {
                var valueOptions = ko.toJS(self.data.Value.ValueOptions),
                    options = ko.utils.arrayFilter(valueOptions, function (o) {
                        return o[key] === value;
                    });
                return options[0]; // There should only be one match
            },
            styleBtn = function (error) {
                // If our modal is not open
                if (!self.showModal()) {
                    self.readOnOpen = false;    // Do not read on next open (allow user to see error text or value read on next open)

                    // Style the 'Read Value' button to provide the feedback result (without having to open the modal)
                    if (error) {
                        $btn.addClass('btn-danger');
                        $btnIcon.addClass('fa-warning');
                    } else {
                        $btn.addClass('btn-success');
                        $btnIcon.addClass('fa-check');
                    }
                } else {
                    // Style the 'Read Value' button with its default look
                    $btnIcon.addClass('fa-crosshairs');
                }
            },
            callback = function (commandRX) {
                var data,
                    value,
                    authValue,
                    valueOption,
                    sf,
                    sfBitMasks = self.enums["Status Flags Bits"];

                $modalScene.hide();
                $btnSubmit.prop('disabled', false);
                $btn.removeClass('btn-warning');
                $btnIcon.removeClass('fa-refresh fa-spin');
                self.gettingData = false;

                if (!!commandRX.error()) {
                    styleBtn(true);
                    self.errorText(commandRX.error());
                    $modalError.show();
                    return;
                }
                
                styleBtn(false);
                data  = commandRX.value();
                value = data.Value;
                authValue = data["Authorized Value"];
                // If enum type, our value is actually an enum value. Get the text...
                if (self.isEnumValueType) {
                    valueOption = getValueOption('value', value);
                    // If we didn't find a match in our value options, or the name key doesn't exist, we'll use the raw value
                    value = (valueOption && valueOption.name) || value;
                    valueOption = getValueOption('value', authValue);
                    authValue = (valueOption && valueOption.name) || authValue;
                }
                self.presentValue(value);
                self.authorizedValue(authValue);
                self.reliability(self.config.Utility.getNameFromEnum('Reliabilities', data.Reliability)  || data.Reliability);
                self.alarmState(self.config.Utility.getNameFromEnum('Alarm States', data["Alarm State"]) || data["Alarm State"]);

                for (var key in sfBitMasks) {
                    self.statusFlags[key](data["Status Flags"] & sfBitMasks[key].enum ? true:false);
                }
                $modalValue.show();
            };

        $modalScene.hide();
        $modalWait.show();
        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-crosshairs fa-check fa-warning').addClass('fa-refresh fa-spin');

        self.readOnOpen  = true; // Assume we'll read again the next time the modal is opened
        self.gettingData = true;
        self.point.issueCommand('Present Value', {upi: self.data._id()}, callback);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});
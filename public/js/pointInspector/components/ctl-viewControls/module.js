define(['knockout', 'text!./view.html'], function (ko, view) {
    function ViewModel(params) {
        var self = this;
        self.root             = params.rootContext;
        self.config           = self.root.utility.config;
        self.point            = self.root.point;
        self.data             = self.point.data;
        self.utility          = self.root.utility;
        self.security         = self.root.point.data.Security;
        self.isSystemAdmin    = self.root.isSystemAdmin();
        self.gettingData      = false;
        self.readOnOpen       = true;

        self.showModal        = ko.observable(false);
        self.errorText        = ko.observable('');
        self.controls         = ko.observableArray([]);

        // Initialization
        for (var i = 0; i < 16; i++) {
            self.controls.push({
                level:              self.utility.getLevelName(i + 1),
                value:              ko.observable(''),
                controller:         ko.observable(''),
                isHighestPriority:  ko.observable(false)
            });
        }
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.toggleModal = function () {
        this.showModal(true);
        if (this.readOnOpen)
            this.getControls();
    };

    ViewModel.prototype.getControls = function () {
        if (this.gettingData)
            return;

        var self = this,
            $btn        = $('.btnViewControls'),
            $btnIcon    = $btn.find('i.fa'),
            $modal      = $('.modal.viewControls'),
            $modalScene = $modal.find('.modalScene'),
            $modalWait  = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $modalError = $modal.find('.modalError'),
            $btnSubmit  = $modal.find('.btnSubmit'),
            controls = self.controls(),
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
                    $btnIcon.addClass('fa-search');
                }
            },
            callback = function (commandRX) {
                var response = commandRX.value(),
                    highestPriorityFound = false,
                    isEnumValueType = (self.data.Value.ValueType() === self.config.Enums["Value Types"].Enum.enum);

                self.gettingData = false;
                $modalScene.hide();
                $btnSubmit.prop('disabled', false);
                $btn.removeClass('btn-warning');
                $btnIcon.removeClass('fa-refresh fa-spin');

                if (!!commandRX.error()) {
                    styleBtn(true);
                    self.errorText(commandRX.error());
                    $modalError.show();
                    return;
                }

                styleBtn(false);
                // Process received data
                for (var i = 0; i < 16; i++) {
                    var controllerId  = response.controllers[i],
                        controlValue  = response.values[i],
                        control = controls[i];
                    // If there is an active control at this priority level
                    if (((1 << i) & response["Null Flags"]) === 0) {
                        control.controller(self.utility.getControllerName(controllerId));
                        
                        // If enum type, our value is actually an enum value. Get the text...
                        if (isEnumValueType) {
                            var valueOption = getValueOption('value', controlValue);
                            // If we didn't find a match in our value options, or the name key doesn't exist, we'll use the raw value
                            control.value((valueOption && valueOption.name) || controlValue);
                        } else {
                            control.value(controlValue);
                        }
                        if (!highestPriorityFound) {
                            control.isHighestPriority(highestPriorityFound = true);
                        }
                    } else {
                        control.controller('');
                        control.value('');
                        control.isHighestPriority(false);
                    }
                }
                self.controls.valueHasMutated();
                $modalValue.show();
            };

        $modalScene.hide();
        $modalWait.show();
        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-search fa-check fa-warning').addClass('fa-refresh fa-spin');

        self.readOnOpen  = true; // Assume we'll read again the next time the modal is opened
        self.gettingData = true;
        self.point.issueCommand('Control Array', {upi: self.data._id()}, callback);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});
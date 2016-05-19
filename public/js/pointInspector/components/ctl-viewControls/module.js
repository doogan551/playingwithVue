define(['knockout', 'text!./view.html'], function(ko, view) {
    function ViewModel(params) {
        var self = this;
        self.root = params.rootContext;
        self.config = self.root.utility.config;
        self.point = self.root.point;
        self.data = self.point.data;
        self.utility = self.root.utility;
        self.security = self.root.point.data.Security;
        self.isSystemAdmin = self.root.isSystemAdmin();
        self.gettingData = false;
        self.readOnOpen = true;

        self.showModal = ko.observable(false);
        self.errorText = ko.observable('');
        self.controls = ko.observableArray([]);

        self.pointBtnClick = function() {
            self.loadControls();
        };
        self.hardwareBtnClick = function() {
            self.getControls();
        };

        // Initialization
        for (var i = 0; i < 16; i++) {
            self.controls.push({
                level: self.utility.getLevelName(i + 1),
                value: ko.observable(''),
                controller: ko.observable(''),
                releaseTime: ko.observable(''),
                isHighestPriority: ko.observable(false)
            });
        }

    }

    // Use prototype to declare any public methods
    ViewModel.prototype.toggleModal = function() {
        this.showModal(true);
        if (this.readOnOpen) {
            $('#pcBtn').click();
            this.loadControls();
        }
    };

    ViewModel.prototype.loadControls = function() {
        var self = this,
            $btn = $('.btnViewControls'),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal.viewControls'),
            $modalScene = $modal.find('.modalScene'),
            $modalWait = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $modalError = $modal.find('.modalError'),
            $btnSubmit = $modal.find('.btnSubmit'),
            $btnRefresh = $modal.find('.refreshBtn'),
            controls = self.controls(),
            pointControls = self.data["Control Array"](),
            highestPriorityFound = false,
            isEnumValueType = (self.data.Value.ValueType() === self.config.Enums["Value Types"].Enum.enum),
            getValueOption = function(key, value) {
                var valueOptions = ko.toJS(self.data.Value.ValueOptions),
                    options = ko.utils.arrayFilter(valueOptions, function(o) {
                        return o[key] === value;
                    });
                return options[0]; // There should only be one match
            },
            styleBtn = function(error) {
                // If our modal is not open
                if (!self.showModal()) {
                    self.readOnOpen = false; // Do not read on next open (allow user to see error text or value read on next open)

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
            showControls = function() {
                for (var c = 0; c < controls.length; c++) {
                    controls[c].controller('');
                    controls[c].value('');
                    controls[c].releaseTime('');
                    controls[c].isHighestPriority(false);
                }


                for (var i = 0; i < pointControls.length; i++) {
                    var controllerId = pointControls[i].Controller(),
                        controlValue = pointControls[i].Value(),
                        releaseTime = pointControls[i]['Release Time'](),
                        controlLevel = pointControls[i].Level(),
                        control = controls[controlLevel - 1];

                    control.controller(self.utility.getControllerName(controllerId));

                    // If enum type, our value is actually an enum value. Get the text...
                    if (isEnumValueType) {
                        var valueOption = getValueOption('value', controlValue);
                        // If we didn't find a match in our value options, or the name key doesn't exist, we'll use the raw value
                        control.value((valueOption && valueOption.name) || controlValue);
                    } else {
                        control.value(controlValue);
                    }
                    if (releaseTime !== 0) {
                        control.releaseTime(moment.unix(releaseTime).format('MM/DD/YY - HH:mm:ss'));
                    } else {
                        control.releaseTime('');
                    }
                    if (!highestPriorityFound) {
                        control.isHighestPriority(highestPriorityFound = true);
                    }
                }
                self.controls.valueHasMutated();
            },
            getFreshControls = function() {
                $.ajax({
                        url: '/api/points/' + self.data._id(),
                        type: 'GET',
                        dataType: 'json'
                    })
                    .done(function(data) {
                        ko.viewmodel.updateFromModel(self.data, data);
                        styleBtn(false);
                    })
                    .fail(function(err) {
                        styleBtn(true);
                        console.log("error");
                    })
                    .always(function() {
                        showControls();
                        self.gettingData = false;
                        $modalScene.hide();
                        $btnSubmit.prop('disabled', false);
                        $btn.removeClass('btn-warning');
                        $btnIcon.removeClass('fa-refresh fa-spin');
                        $modalValue.show();
                    });
            };

        $btnRefresh.show();
        $modalScene.hide();
        $modalWait.show();
        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-search fa-check fa-warning').addClass('fa-refresh fa-spin');
        getFreshControls();
    };

    ViewModel.prototype.getControls = function() {
        if (this.gettingData)
            return;

        var self = this,
            $btn = $('.btnViewControls'),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal.viewControls'),
            $modalScene = $modal.find('.modalScene'),
            $modalWait = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $modalError = $modal.find('.modalError'),
            $btnSubmit = $modal.find('.btnSubmit'),
            $btnRefresh = $modal.find('.refreshBtn'),
            controls = self.controls(),
            pointControls = [],
            getValueOption = function(key, value) {
                var valueOptions = ko.toJS(self.data.Value.ValueOptions),
                    options = ko.utils.arrayFilter(valueOptions, function(o) {
                        return o[key] === value;
                    });
                return options[0]; // There should only be one match
            },
            styleBtn = function(error) {
                // If our modal is not open
                if (!self.showModal()) {
                    self.readOnOpen = false; // Do not read on next open (allow user to see error text or value read on next open)

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
            buildControlArray = function(fieldControls) {
                var controls = [];
                for (var i = 0; i < 16; i++) {
                    var control = {
                        "Value": 0,
                        "Level": 0,
                        "Controller": 0,
                        "Release Time": 0
                    };

                    if ((fieldControls["active controls"] >> i & 1) !== 0) {
                        control.Value = fieldControls.values[i];
                        control.Level = i + 1;
                        control.Controller = fieldControls.controllers[i];
                        control["Release Time"] = fieldControls.times[i];
                        controls.push(control);
                    }
                }
                return controls;
            },
            callback = function(commandRX) {
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
                pointControls = buildControlArray(response);
                for (var c = 0; c < controls.length; c++) {
                    controls[c].controller('');
                    controls[c].value('');
                    controls[c].releaseTime('');
                    controls[c].isHighestPriority(false);
                }


                for (var i = 0; i < pointControls.length; i++) {
                    var controllerId = pointControls[i].Controller,
                        controlValue = pointControls[i].Value,
                        releaseTime = pointControls[i]['Release Time'],
                        controlLevel = pointControls[i].Level,
                        control = controls[controlLevel - 1];

                    control.controller(self.utility.getControllerName(controllerId));

                    // If enum type, our value is actually an enum value. Get the text...
                    if (isEnumValueType) {
                        var valueOption = getValueOption('value', controlValue);
                        // If we didn't find a match in our value options, or the name key doesn't exist, we'll use the raw value
                        control.value((valueOption && valueOption.name) || controlValue);
                    } else {
                        control.value(controlValue);
                    }
                    if (releaseTime !== 0) {
                        control.releaseTime(moment.unix(releaseTime).format('MM/DD/YY - HH:mm:ss'));
                    } else {
                        control.releaseTime('');
                    }
                    if (!highestPriorityFound) {
                        control.isHighestPriority(highestPriorityFound = true);
                    }
                }
                self.controls.valueHasMutated();
                $modalValue.show();
            };

        $btnRefresh.show();
        $modalScene.hide();
        $modalWait.show();
        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-search fa-check fa-warning').addClass('fa-refresh fa-spin');

        self.readOnOpen = true; // Assume we'll read again the next time the modal is opened
        self.gettingData = true;
        self.point.issueCommand('Control Array', {
            upi: self.data._id()
        }, callback);
    };

    ViewModel.prototype.refreshControls = function() {
        var self = this;
        if ($('#pcBtn').parents('.btn').hasClass('active')) {
            self.pointBtnClick()
        } else {
            self.hardwareBtnClick()
        }
    }

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
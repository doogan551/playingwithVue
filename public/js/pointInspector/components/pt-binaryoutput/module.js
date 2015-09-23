/*jslint white: true */
define(['knockout', 'text!./view.html'], function(ko, view) {
    var ASC = -1,
        DESC = 1,
        $sortIcon;

    function sortArray(prop, dir) { // This routine must be called using .call
        var opp = ~dir + 1;         // Get opposite direction (-1 to 1 or 1 to -1)
        return this.sort(function (obj1, obj2) {
            return (obj1[prop] == obj2[prop]) ? 0 : (obj1[prop] < obj2[prop]) ? opp : dir;
        });
    }

    function ViewModel(params) {
        var self = this;
        this.root = params;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.apiEndpoint = params.apiEndpoint;
        this.isInEditMode = params.isInEditMode;

        this.modal = {
            gettingData: false,
            readOnOpen: true,
            showModal: ko.observable(false),
            errorText: ko.observable(''),
            sortOrder: ko.observable(ASC),
            controlLog: ko.observableArray([]),
        };
        this.modal.controlLogSorted = ko.computed(function () {
            var controlLog = self.modal.controlLog(),
                sortOrder = self.modal.sortOrder(),
                _array = [];
            Array.prototype.push.apply(_array, controlLog);
            return sortArray.call(_array, 'timestamp', sortOrder);
        }, self);


        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            involvement: ko.observable(false),
            notifications: ko.observable(false),
            permissions: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;

        self.controlLogSorted  = ko.computed(function () {
            var controlLog = self.modal.controlLog(),
                sortOrder = self.modal.sortOrder(),
                _array = [];
            Array.prototype.push.apply(_array, controlLog);
            return sortArray.call(_array, 'timestamp', sortOrder);
        }, self);

        params.initDOM();
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.reset = function(data, event) {
        var self = this,
            propertyName = data.propertyName,
            resetName;
        data.data.Value(0);
        switch (propertyName.toLowerCase()) {
            case 'run total':
                resetName = 'Run Total Reset Time';
                break;
            case 'number of starts':
                resetName = 'Last Start Reset Time';
                break;
            default:
                return;
        }
        self.root.point.data[resetName].Value(new Date().getTime() / 1000);
    };

    ViewModel.prototype.toggleModal = function () {
        this.modal.showModal(true);
        if (this.modal.readOnOpen)
            this.getControlLog();
    };

    ViewModel.prototype.getControlLog = function () {
        if (this.modal.gettingData)
            return;

        var self = this,
            $btn        = $('.btnViewControlLog'),
            $btnIcon    = $btn.find('i.fa'),
            $modal      = $('.modal.viewControlLog'),
            $modalScene = $modal.find('.modalScene'),
            $modalWait  = $modal.find('.modalWait'),
            $modalValue = $modal.find('.modalValue'),
            $modalError = $modal.find('.modalError'),
            $btnSubmit  = $modal.find('.btnSubmit'),
            controlLog  = self.modal.controlLog(),
            getValueOption = function (key, value) {
                var valueOptions = ko.toJS(self.data.Value.ValueOptions),
                    options = ko.utils.arrayFilter(valueOptions, function (o) {
                        return o[key] === value;
                    });
                return options[0] || {}; // There should only be one match
            },
            styleBtn = function (error) {
                // If our modal is not open
                if (!self.modal.showModal()) {
                    self.modal.readOnOpen = false;    // Do not read on next open (allow user to see error text or value read on next open)

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
                    $btnIcon.addClass('fa-exchange');
                }
            },
            callback = function (commandRX) {
                var response = commandRX.value(),
                    activeText = getValueOption('value', 1).name,
                    inactiveText = getValueOption('value', 0).name,
                    systemEnumObjects = self.utility.workspace.systemEnumObjects,
                    controllers = systemEnumObjects.controllers,
                    priorities  = systemEnumObjects.controlpriorities,
                    i = 0,
                    len = response.length;

                self.modal.gettingData = false;
                $modalScene.hide();
                $btnSubmit.prop('disabled', false);
                $btn.removeClass('btn-warning');
                $btnIcon.removeClass('fa-refresh fa-spin');

                if (!!commandRX.error()) {
                    styleBtn(true);
                    self.modal.errorText(commandRX.error());
                    $modalError.show();
                    return;
                }

                styleBtn(false);
                controlLog.length = 0;

                // Process received data
                for (i; i < len; i++) {
                    var data = response[i];
                    // Timestamp = "0" means this entry is empty
                    if (data.timestamp > 0) {
                        // Add a couple keys for simple data access and time/date formatting
                        data.prettyTime = moment.unix(data.timestamp).calendar();
                        data.valueText  = data.value ? activeText : inactiveText;
                        data.controllerName = controllers[data.controller].name;
                        data.priorityText   = priorities[data.priority];
                        controlLog.push(data);
                    }
                }
                self.modal.controlLog.valueHasMutated();
                $modalValue.show();
            };

        $modalScene.hide();
        $modalWait.show();
        $btnSubmit.prop('disabled', true);
        $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
        $btnIcon.removeClass('fa-exchange fa-check fa-warning').addClass('fa-refresh fa-spin');

        self.modal.readOnOpen  = true; // Assume we'll read again the next time the modal is opened
        self.modal.gettingData = true;
        self.point.issueCommand('Control Log', {upi: self.data._id()}, callback);
    };

    ViewModel.prototype.reverseSort = function  () {
        var self = this,
            sortOrder = self.modal.sortOrder;

        if (!$sortIcon) {
            $sortIcon = $('.viewControlLog thead th:first i');
        }
        $sortIcon.removeClass('fa-chevron-up fa-chevron-down');
        if (sortOrder() == ASC) {
            sortOrder(DESC);
            $sortIcon.addClass('fa-chevron-down');
        } else {
            sortOrder(ASC);
            $sortIcon.addClass('fa-chevron-up');
        }
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        this.modal.controlLogSorted.dispose();
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

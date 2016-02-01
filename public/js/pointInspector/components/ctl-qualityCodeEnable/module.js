define(['knockout', 'text!./view.html'], function(ko, view) {

    /*//Bootstrap switch
    ko.bindingHandlers.switch = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            console.log(element, valueAccessor, allBindingsAccessor);
            var $element = $(element),
                context = ko.contextFor(element),
                value = ko.utils.unwrapObservable(valueAccessor()),
                allBindings = allBindingsAccessor(),
                options = allBindings.bootstrapSwitchOptions || {},
                doValidate = allBindings.doValidate;
            $element.bootstrapSwitch();
            $element.bootstrapSwitch('state', value); // Set intial state
            // Update the model when changed.
            $element.on('switchChange.bootstrapSwitch', function(e, data) {
                valueAccessor()(data);
                if (doValidate) {
                    $(document).triggerHandler({
                        type: 'viewmodelChange',
                        targetElement: $element,
                        property: context.$data.propertyName,
                        refPoint: null
                    });
                }
            });
            // Adding component options
            for (var property in options) {
                $element.bootstrapSwitch(property, ko.unwrap(options[property]));
            }
            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $element.bootstrapSwitch('destroy');
            });
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                switchState = $element.bootstrapSwitch('state'),
                value = ko.utils.unwrapObservable(valueAccessor()),
                allBindings = allBindingsAccessor(),
                options = allBindings.bootstrapSwitchOptions || {};
            if (switchState != value) {
                $element.bootstrapSwitch('state', value);
            }
            // Adding component options
            for (var property in options) {
                $element.bootstrapSwitch(property, ko.unwrap(options[property]));
            }
        }
    };*/

    function ViewModel(params) {
        this.columnClasses = params.columnClasses;
        this.propertyName = params.propertyName;
        this.data = params.data[this.propertyName];
        this.isInEditMode = params.rootContext.isInEditMode;
        this.isSystemAdmin = params.rootContext.isSystemAdmin();
        this.isEnabled = ko.computed(function() {
            return !!this.isInEditMode() && !this.data.isReadOnly();
        }, this);
        this.qualityEnums = params.rootContext.utility.config.Enums['Quality Code Enable Bits'];

        this.override = ko.observable(this.data.Value() & this.qualityEnums.Override.enum);
        this.covDisabled = ko.observable(this.data.Value() & this.qualityEnums['COV Enable'].enum);
        this.alarmsOff = ko.observable(this.data.Value() & this.qualityEnums['Alarms Off'].enum);
        this.commandPending = ko.observable(this.data.Value() & this.qualityEnums['Command Pending'].enum);

        this.tempVal = ko.computed(function() {
            var override = (!!this.override()) ? this.qualityEnums.Override.enum : 0;
            var covDisabled = (!!this.covDisabled()) ? this.qualityEnums['COV Enable'].enum : 0;
            var alarmsOff = (!!this.alarmsOff()) ? this.qualityEnums['Alarms Off'].enum : 0;
            var commandPending = (!!this.commandPending()) ? this.qualityEnums['Command Pending'].enum : 0;
            var total = this.qualityEnums.Override.enum | this.qualityEnums['COV Enable'].enum | this.qualityEnums['Alarms Off'].enum | this.qualityEnums['Command Pending'].enum;

            var val = override | covDisabled | alarmsOff | commandPending;
            if (val === total) {
                val = this.qualityEnums.All.enum;
            }
            this.data.Value(val);
            return val;
        }, this);
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.doSomething = function() {

    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {

    };

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
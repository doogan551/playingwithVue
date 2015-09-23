define(['knockout', 'text!./view.html'], function(ko, view) {

    //Bootstrap switch
    ko.bindingHandlers.switch = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
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
    };

    function ViewModel(params) {
        this.columnClasses = params.columnClasses;
        this.propertyName = params.propertyName;
        this.data = params.data[this.propertyName];
        this.isInEditMode = params.rootContext.isInEditMode;
        this.showLabel = (params.showLabel === undefined) ? true : params.showLabel;
        this.doValidate = (params.hasOwnProperty('doValidate')) ? params.doValidate : true;
        this.isSystemAdmin = params.rootContext.isSystemAdmin();
        this.isDisabled = ko.computed(function() {
            var isDisabled = !this.isInEditMode() || this.data.isReadOnly();
            // Only system administrators can edit the Broadcast Enable property
            if ((this.propertyName === "Broadcast Enable") && (this.isSystemAdmin === false)) {
                isDisabled = true;
            }
            return isDisabled;
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
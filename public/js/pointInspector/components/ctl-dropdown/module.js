define(['knockout', 'text!./view.html'], function(ko, view) {
    var valueSubscription;

    ko.bindingHandlers.enumTextValue = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            var $element = $(element),
                context = ko.contextFor(element),
                allBindings = allBindingsAccessor(),
                options = ko.utils.unwrapObservable(allBindings.options),
                eValue = allBindings.value,
                value = valueAccessor();

            valueSubscription = allBindings.value.subscribe(function(newValue) {
                for (var o = 0; o < options.length; o++) {
                    if (options[o].badProperty) {
                        options.splice(o, 1);
                        o--;
                    }
                }
                var match = ko.utils.arrayFirst(options, function(item, index) {
                    return ko.unwrap(item.value) == newValue;
                });
                !!match && value(ko.unwrap(match.name));
                console.log('CHANGE VALUE', value());
                $(document).triggerHandler({
                    type: 'viewmodelChange',
                    targetElement: $element,
                    property: allBindings.propertyName,
                    refPoint: null
                });
            });
        }
    };

    function ViewModel(params) {
        this.root = params.rootContext;
        this.columnClasses = params.columnClasses;
        this.labelClasses = (params.hasOwnProperty('labelClasses')) ? params.labelClasses : "lh30";
        this.propertyName = params.propertyName;
        this.showLabel = (params.hasOwnProperty('showLabel')) ? params.showLabel : true;
        this.data = params.data[this.propertyName];
        this.enumSetName = params.enumSetName;
        this.utility = params.rootContext.utility;
        this.config = this.utility.config;
        this.isInEditMode = params.rootContext.isInEditMode;
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.getOptions = function() {
        var options,
            data = this.data,
            valueIsInOptions;

        /*if (this.propertyName === 'Model Type' && this.root.point.data['Point Type'].Value() === 'Remote Unit') {
            options = this.config.Utility.getRmuValueOptions(this.root.point.data._devModel);
        } else */if (typeof data.ValueOptions == 'function') {
            options = data.ValueOptions();
        } else {
            options = this.config.Utility.pointTypes.getEnums(this.propertyName, this.root.point.data['Point Type'].Value(), {devModel: this.root.point.data._devModel()});
        }

        if (!options) {
            options = this.root.point.data.Value.ValueOptions();
        }

        valueIsInOptions = ko.utils.arrayFirst(options, function(option) {
            return ko.unwrap(option.value) == data.eValue();
        });
        if (!valueIsInOptions) {
            options.unshift({
                name: data.Value(),
                value: data.eValue(),
                badProperty: true
            });
        } else {
            for (var o = 0; o < options.length; o++) {
                if (ko.isObservable(options[0].name)) {
                    if (data.eValue() === options[o].value()) {
                        data.Value(options[o].name());
                    }
                }
            }
        }
        return options;
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        valueSubscription.dispose();
    };

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
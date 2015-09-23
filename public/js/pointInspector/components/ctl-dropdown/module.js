define(['knockout', 'text!./view.html'], function(ko, view) {
    var valueSubscription;

    ko.bindingHandlers.enumTextValue = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var $element = $(element),
                context = ko.contextFor(element),
                allBindings = allBindingsAccessor(),
                options = ko.utils.unwrapObservable(allBindings.options),
                eValue = allBindings.value,
                value = valueAccessor();

            valueSubscription = allBindings.value.subscribe(function (newValue) {
                var match = ko.utils.arrayFirst(options, function (item, index) {
                    if (item.badProperty) {
                        options.splice(index, 1);
                        return false;
                    }
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
        this.propertyName = params.propertyName;
        this.showLabel = (params.hasOwnProperty('showLabel')) ? params.showLabel : true;
        this.data = params.data[this.propertyName];
        this.enumSetName = params.enumSetName;
        this.utility    = params.rootContext.utility;
        this.isInEditMode = params.rootContext.isInEditMode;
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.getOptions = function() {
        var options,
            data = this.data,
            valueIsInOptions;
        if (typeof data.ValueOptions== 'function') {
            options = data.ValueOptions();
        } else {
            options = this.utility.config.Utility.pointTypes.getEnums(this.enumSetName, this.propertyName);
        }

        if (!options) {
            options = this.root.point.data.Value.ValueOptions();
        }

        valueIsInOptions = ko.utils.arrayFirst(options, function(option) {
            return ko.unwrap(option.value) == data.eValue();
        });
        if (!valueIsInOptions) {
            options.unshift({name: data.Value(), value: data.eValue(), badProperty: true});
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
    return { viewModel: ViewModel, template: view };
});

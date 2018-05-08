/*jslint white: true*/
define(['knockout', 'text!./view.html'], function (ko, view) {

    function ViewModel(params) {
        var self = this;
        this.propertyName = params.propertyName;
        this.point = params.data;
        this.data = params.data[this.propertyName];
        this.states = this.data.ValueOptions;
        this.isInEditMode = params.rootContext.isInEditMode;
        this.showAlarmChoice = params.showAlarmChoice || false;
        this.originalText = '';

        self.checkDuplicate = function (item, event) {
            /*var allTexts = [];
            for (var i = 0; i < self.states().length; i++) {
                allTexts.push(self.states()[i].name());
            }
            var currentText = $(event.currentTarget).val();

            if (currentText !== item.name() && allTexts.indexOf(currentText) >= 0) {

            }*/
        };
        self.setOriginalText = function (item, event) {
            self.originalText = item.name();
        };
        self.setOriginalEnum = function (item, event) {
            self.originalEnum = item.value();
        };
        self.triggerHandler = function (item, event) {
            var allTexts = [];
            for (var i = 0; i < self.states().length; i++) {
                if (allTexts.indexOf(self.states()[i].name()) < 0) {
                    allTexts.push(self.states()[i].name());
                } else {
                    item.name(self.originalText);
                    bannerJS.showBanner('Cannot have duplicate States texts. The States has been set back to its original value.', 'Dismiss');
                }
            }

            var allEnums = [];
            for (var j = 0; j < self.states().length; j++) {
                if (allEnums.indexOf(self.states()[j].value()) < 0) {
                    allEnums.push(self.states()[j].value());
                } else {
                    item.value(self.originalEnum);
                    bannerJS.showBanner('Cannot have duplicate States enums. The States has been set back to its original value.', 'Dismiss');
                }
            }

            self.updateEnumOrder();

            _triggerHandler($(event.target));
        };
        self.updateEnumOrder = function () {
            var compare = function (a, b) {
                return a.value() - b.value();
            };
            self.states().sort(compare);
        };
        self.alarmForIndex = function (value) {
            let alarmValues = self.data.AlarmValues();
            return ko.computed({
                read: function () {
                    return alarmValues.includes(value());
                },
                write: function (checked) {
                    if (checked) {
                        alarmValues.push(value());
                    } else {
                        alarmValues.splice(alarmValues.indexOf(value()), 1);
                    }
                }
            }, value);
        };
        self.replaceAlarmStates = function (newValue) {
            let alarmValues = self.data.AlarmValues;
            if (alarmValues().includes(self.originalEnum)) {
                alarmValues().splice(alarmValues().indexOf(self.originalEnum), 1, newValue());
                alarmValues.valueHasMutated();
            }
        }
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.addNew = function (data, event) {
        var states = data.states,
            value = getNextValue(states()),
            name = 'State_' + value + '_Text';
        // Prepopulate the state name with a unique string so we can add multiple
        // states, then go back and edit each one. The viewmodelChange handler in
        // startup.js calls ko.viewmodel.toModel which reformats the states array
        // into a states object, where the name is the key, and value is the key
        // value.
        states.push({
            name: ko.observable(name),
            value: ko.observable(value)
        });
        // Select the state text. It will be validated when the input loses focus
        $('._stateName:last').get(0).select();
    };
    ViewModel.prototype.remove = function (item) {
        var self = this;
        self.states.remove(item);
        _triggerHandler(null);
    };

    /*    ViewModel.prototype.triggerHandler = function(item, event) {
            _triggerHandler($(event.target));
        };*/

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {

    };

    function getNextValue(states) {
        return Math.max.apply(Math, ko.utils.arrayMap(states, function (item) {
            return item.value();
        })) + 1;
    }

    function _triggerHandler($targetElement) {
        $(document).triggerHandler({
            type: 'viewmodelChange',
            targetElement: $targetElement,
            property: 'States',
            refPoint: null
        });
    }

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});

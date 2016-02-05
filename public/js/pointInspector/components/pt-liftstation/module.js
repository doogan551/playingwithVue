define(['knockout', 'text!./view.html'], function (ko, view) {

    ko.observable.fn.bit = function (bit) {
        var mask = Math.pow(2, bit);
        return ko.computed({
            read: function () {
                return !!(this() & mask);
            },
            write: function (checked) {
                if (checked) {
                    this(this() | mask);
                } else {
                    this(this() & ~mask);
                }
            }
        }, this);
    };

    function ViewModel(params) {
        var self = this,
            alarmOutputConfig = (function (){
                var i,
                    enumSet = params.utility.config.Enums['Lift Station Alarm Output Configuration Bits'],
                    keys = Object.keys(enumSet),
                    len = keys.length,
                    arr = [];
                for (i = 0; i < len; i++) {
                    arr.push({
                        key: keys[i],
                        bit: enumSet[keys[i]].enum
                    });
                }
                return arr;
            })();

        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.apiEndpoint = params.apiEndpoint;
        this.isInEditMode = params.isInEditMode;

        this.alarmOutputConfig = alarmOutputConfig;

        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            involvement: ko.observable(false),
            permissions: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;

        params.initDOM();
    }

    // Use prototype to declare any methods
    ViewModel.prototype.doSomething = function (data, event) {
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

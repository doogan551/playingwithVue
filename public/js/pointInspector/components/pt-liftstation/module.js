define(['knockout', 'text!./view.html'], function (ko, view) {

    function ViewModel(params) {
        var self = this,
            configBits = params.utility.config.Enums['Lift Station Alarm Output Configuration Bits'],
            configKeys = Object.keys(configBits),
            configLen = configKeys.length,
            newConfigArray = function (alarmOutputConfigValue) {
                var arr = [];
                for (var i = 0; i < configLen; i++) {
                    arr.push({
                        name: configKeys[i],
                        value: ko.observable((alarmOutputConfigValue & Math.pow(2, configBits[configKeys[i]].enum)) ? true:false)
                    });
                }
                return arr;
            },
            newComputed = function (srcArray, targetObservable) {
                return ko.computed(function () {
                    var value = 0;
                    for (var i = 0; i < configLen; i++) {
                        if (srcArray[i].value() === true)
                            value += Math.pow(2, configBits[configKeys[i]].enum);
                    }
                    targetObservable(value);
                });
            };

        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.apiEndpoint = params.apiEndpoint;
        this.isInEditMode = params.isInEditMode;

        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            involvement: ko.observable(false),
            permissions: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;

        this.lightConfigOptions = newConfigArray(this.data['Light Output Configuration']());
        this.hornConfigOptions = newConfigArray(this.data['Horn Output Configuration']());
        this.auxConfigOptions = newConfigArray(this.data['Auxiliary Output Configuration']());

        this.updateLightConfigComputed = newComputed(this.lightConfigArray, this.data['Light Output Configuration']);
        this.updateHornConfigComputed = newComputed(this.hornConfigArray, this.data['Horn Output Configuration']);
        this.updateAuxConfigComputed = newComputed(this.auxConfigArray, this.data['Auxiliary Output Configuration']);

        params.initDOM();
    }

    // Use prototype to declare any methods
    ViewModel.prototype.doSomething = function (data, event) {
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {
        this.updateLightConfigComputed.dispose();
        this.updateHornConfigComputed.dispose();
        this.updateAuxConfigComputed.dispose();
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

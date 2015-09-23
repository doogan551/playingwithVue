define(['knockout', 'text!./view.html'], function (ko, view) {

    function ViewModel(params) {
        var self = this;
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

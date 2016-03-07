define(['knockout', 'text!./view.html'], function(ko, view) {

    function ViewModel(params) {
        var self = this;
        this.root = params;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.apiEndpoint = params.apiEndpoint;
        this.isInEditMode = params.isInEditMode;

        this.getPointName = function(data) {
            console.log(this);
            return ko.computed({
                read: function() {
                    return this;
                },
                write: function() {
                    return this;

                }

            }, this);
        };

        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            involvement: ko.observable(false),
            notifications: ko.observable(false),
            permissions: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;
        // someObservableOrComputed.extend({ rateLimit: 0 });
        this.logicPoints = {
            point1: ko.observable(this.utility.getPointRefProperty('Input Point 1').data),
            point2: ko.observable(this.utility.getPointRefProperty('Input Point 2').data),
            point3: ko.observable(this.utility.getPointRefProperty('Input Point 3').data),
            point4: ko.observable(this.utility.getPointRefProperty('Input Point 4').data),
            point5: ko.observable(this.utility.getPointRefProperty('Input Point 5').data)
        };
        params.initDOM();
    }

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
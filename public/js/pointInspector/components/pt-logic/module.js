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
            point1: ko.computed(function() {
                return this.utility.getPointRefProperty('Input Point 1').data
            }, this),
            point2: ko.computed(function() {
                return this.utility.getPointRefProperty('Input Point 2').data
            }, this),
            point3: ko.computed(function() {
                return this.utility.getPointRefProperty('Input Point 3').data
            }, this),
            point4: ko.computed(function() {
                return this.utility.getPointRefProperty('Input Point 4').data
            }, this),
            point5: ko.computed(function() {
                return this.utility.getPointRefProperty('Input Point 5').data
            }, this)
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
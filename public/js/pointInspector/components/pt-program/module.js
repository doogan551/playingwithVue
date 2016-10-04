define(['knockout', 'text!./view.html'], function(ko, view) {
    var apiEndpoint;

    function ViewModel(params) {
        var self = this;
        apiEndpoint = params.apiEndpoint;
        this.root = params.rootContext;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.isInEditMode = params.isInEditMode;

        this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Holiday'];

        //Modal stuff
        this.modal = {
            error: ko.observable(''),
            template: ko.observable(''),
            showModal: ko.observable(false),
            submitText: ko.observable(''),
            title: ko.observable(''),
            value: ko.observable(''),
            cancel: function() {},
            submit: function() {}
        };

        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            involvement: ko.observable(false),
            notifications: ko.observable(false),
            permissions: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;


        params.initDOM();
    }

    function getRefData(id) {
        return $.ajax(
            {
                url        : apiEndpoint + 'points/' + id,
                contentType: 'application/json',
                dataType   : 'json',
                type       : 'get'
            }
        );
    }

    // Use prototype to declare any public methods

    ViewModel.prototype.editPointRef = function(vm, propertyName, AppIndex) {
        var endPoint,
            parameters,
            point = vm.utility.getPointRefPropertyByAppIndex(propertyName, AppIndex).data,
            callback = function (pointInfo) {
                if (!!pointInfo) {
                    getRefData(pointInfo._id).done(
                        function (data) {
                            endPoint = vm.utility.config.Utility.pointTypes.getUIEndpoint(pointInfo.pointType, pointInfo._id);
                            point.PointName(pointInfo.name);
                            point.Value(pointInfo._id);
                            point.PointType(pointInfo.pointType);
                        }
                    );
                }
            };

        dtiUtility.showPointSelector(parameters);
        dtiUtility.onPointSelect(callback);
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {

    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

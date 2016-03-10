define(['knockout', 'text!./view.html'], function(ko, view) {

    // Notify Policies
    // 
    function ViewModel(params) {
        var self = this;
        self.params = params;
        apiEndpoint = params.rootContext.apiEndpoint;
        this.isInEditMode = params.rootContext.isInEditMode;
        this.isSystemAdmin = params.rootContext.isSystemAdmin();
        this.data = params.data;

        this.policies = ko.observableArray([]);
        this.getPolicies(function(response) {
            if (!!response.err) {
                //banner error
            } else {
                for (var r = 0; r < response.length; r++) {
                    response[r].policyOnPoint = ko.observable(false);
                    for (var nP = 0; nP < self.data().length; nP++) {
                        if (self.data()[nP].toString() === response[r]._id.toString()) {
                            response[r].policyOnPoint(true);
                        }
                    }
                }
                self.policies(response);
            }
        });
    }

    ViewModel.prototype.getPolicies = function(cb) {
        $.ajax({
            url: self.apiEndpoint + 'policies/get',
            contentType: 'application/json',
            dataType: 'json',
            type: 'get'
        }).done(cb);
    };

    ViewModel.prototype.togglePolicy = function(data) {
        if (!!data.policyOnPoint()) {
            this.data().push(data._id);
        } else {
            for (var i = 0; i < this.data().length; i++) {
                if (this.data()[i] == data._id) {
                    this.data().splice(i, 1);
                    i--;
                }
            }
        }

        return true;
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
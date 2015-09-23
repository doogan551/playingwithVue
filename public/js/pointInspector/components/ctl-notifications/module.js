define(['knockout', 'text!./view.html'], function(ko, view) {
    var apiEndpoint = '';

    function ViewModel(params) {
        var self = this;
        this.id = params.id;
        apiEndpoint = params.rootContext.apiEndpoint;
        this.gettingData = ko.observable(true);
        this.alarmMessages = ko.observableArray([]);
        this.data = params.data;
        this.isInEditMode = params.rootContext.isInEditMode;
        this.render();
    }

    function getAlarmMessages(id) {
        return $.ajax(
            {
                url        : apiEndpoint + 'alarmMessageDefinitions',
                contentType: 'application/json',
                dataType   : 'json',
                type       : 'get'
            }
        );
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.render = function() {
        var self = this;
        getAlarmMessages().done(function(data) {
            self.gettingData(false);
            self.alarmMessages(data.result);
        });
    };
    ViewModel.prototype.getAlarmMessagesByType = function(type) {
        var self = this;
        return self.alarmMessages.filter(function(item) {
            return item.msgType == type;
        });
    };
    ViewModel.prototype.getMessageById = function(id) {
        var self = this,
            messages = self.alarmMessages(),
            message = {
                msgName: '',
                msgTypeName: ''
            };
        for (var i = messages.length; i--;) {
            if (messages[i]._id == id) {
                message = messages[i];
                break;
            }
        }
        return message;
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

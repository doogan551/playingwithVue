define(['knockout', 'text!./view.html'], function(ko, view) {
    var apiEndpoint = '';

    function ViewModel(params) {
        var self = this;
        this.id = params.id;
        this.Enums = params.rootContext.utility.config.Enums;
        apiEndpoint = params.rootContext.apiEndpoint;
        this.gettingData = ko.observable(true);
        this.alarmMessages = ko.observableArray([]);
        this.isInEditMode = params.rootContext.isInEditMode;
        this.render();
        this.alarmData = ko.observableArray([]);
        this.returnData = ko.observableArray([]);
        this.data = params.data;
        this.alarmDefinitions = {};

        this.ackAll = ko.observable(false);
        this.notifyAll = ko.observable(false);

        this.ackAll.subscribe(function(val) {
            self.returnData().forEach(function(returnMsg) {
                returnMsg.ack(val);
            });
        });
        this.notifyAll.subscribe(function(val) {
            self.returnData().forEach(function(returnMsg) {
                returnMsg.notify(val);
            });
        });

        this.isInEditMode.subscribe(function(val) {
            if (!val) {
                self.buildAlarmArrays();
            }
        });
    }

    function getAlarmMessages(id) {
        return $.ajax({
            url: apiEndpoint + 'alarmMessageDefinitions',
            contentType: 'application/json',
            dataType: 'json',
            type: 'get'
        });
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.render = function() {
        var self = this;
        getAlarmMessages().done(function(data) {
            self.gettingData(false);

            self.alarmMessages(data.result);
            self.buildAlarmArrays();
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
    ViewModel.prototype.buildAlarmArrays = function() {
        var self = this;
        self.returnData([]);
        self.alarmData([]);
        self.alarmMessages().forEach(function(msg) {
            self.data().forEach(function(alarm) {
                if (alarm.msgId() === msg._id) {
                    if (msg.msgCat === self.Enums['Alarm Categories'].Return.enum) {
                        // in case db is not fixed, this defaults ack/notify all to first return message's properties
                        if(!self.returnData().length){
                            self.notifyAll(alarm.notify());
                            self.ackAll(alarm.ack());
                        }
                        alarm.notify(self.notifyAll());
                        alarm.ack(self.ackAll());
                        self.returnData.push(alarm);
                    } else {
                        self.alarmData.push(alarm);
                    }
                }
            });
        });
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {};

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
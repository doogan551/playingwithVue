ko.bindingHandlers.prettyDate = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor(),
            timestamp = ko.unwrap(value),
            el = $(element);
                
        el.html(new Date(timestamp * 1000).toLocaleString());
    }
};

var PrintAlarmManager = function(conf) {
    var self = this;

    self.currentList = ko.observableArray([]);

    self.toHexColor = function(color) {
        var ret = parseInt(color, 10).toString(16);

        return '#' + ret;
    };
};

$(function() {
    //temporary window scope
    window.manager = new PrintAlarmManager({});

    window.applyList = function(list) {
        manager.currentList(list);
    };

    ko.applyBindings(manager);
});
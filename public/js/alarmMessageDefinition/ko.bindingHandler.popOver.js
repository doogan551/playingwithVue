ko.bindingHandlers.popover = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {                
        var options = ko.utils.unwrapObservable(valueAccessor());
        var defaultOptions = {
            template:'<span>template</span>'
        };
        options = $.extend(true, {}, defaultOptions, options);

        $(element).popover(options);
    }
};
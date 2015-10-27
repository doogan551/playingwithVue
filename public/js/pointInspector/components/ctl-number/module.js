define(['knockout', 'big', 'text!./view.html'], function(ko, Big, view) {

    function ViewModel(params) {
        var self = this;
        this.columnClasses = params.columnClasses;
        this.help = params.help;
        this.button = params.button;
        this.propertyName = params.propertyName;
        this.noTruncate = params.noTruncate;
        this.noComma = (!!params.noComma) ? params.noComma : true;
        this.data = params.data[this.propertyName];
        this.utility = params.rootContext.utility;
        this.min = typeof params.min == 'number' ? params.min :
            typeof params.data.Min == 'function' ? params.data.Min() : undefined;
        this.max = typeof params.max == 'number' ? params.max :
            typeof params.max == 'function' ? params.max() :
            typeof params.data.Max == 'function' ? params.data.Max() : undefined;
        this.isInEditMode = params.rootContext.isInEditMode;
        this.root = params.rootContext;
        this.showLabel = (params.showLabel === undefined) ? true : params.showLabel;
        this.doValidate = (params.hasOwnProperty('doValidate')) ? params.doValidate : true;
    }

    // Use prototype to declare any methods
    ViewModel.prototype.doSomething = function(data, event) {
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

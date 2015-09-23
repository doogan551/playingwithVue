define(['knockout', 'big', 'text!./view.html'], function(ko, Big, view) {

    function ViewModel(params) {
        this.value = params.value.Value;
        this.valueType = params.value.ValueType;
        this.engUnit = params.engUnit;
        this.isInEditMode = params.rootContext.isInEditMode
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.doSomething = function() {

    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {

    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

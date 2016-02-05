define(['knockout', 'text!./view.html'], function(ko, view) {

    ko.observable.fn.bit = function(bit) {
        var mask = Math.pow(2, bit);
        return ko.computed({
            read: function() {
                return !!(this() & bit);
            },
            write: function(checked) {
                if (checked) {
                    this(this() | bit);
                } else {
                    this(this() & ~bit);
                }
            }
        }, this);
    };

    function ViewModel(params) {
        this.columnClasses = params.columnClasses;
        this.propertyName = params.propertyName;
        this.data = params.data[this.propertyName];
        this.isInEditMode = params.rootContext.isInEditMode;
        this.isSystemAdmin = params.rootContext.isSystemAdmin();
        this.isEnabled = ko.computed(function() {
            return !!this.isInEditMode() && !this.data.isReadOnly();
        }, this);
        this.qualityEnums = params.rootContext.utility.config.Enums['Quality Code Enable Bits'];

        this.override = ko.observable(this.data.Value() & this.qualityEnums.Override.enum);
        this.covDisabled = ko.observable(this.data.Value() & this.qualityEnums['COV Enable'].enum);
        this.alarmsOff = ko.observable(this.data.Value() & this.qualityEnums['Alarms Off'].enum);
        this.commandPending = ko.observable(this.data.Value() & this.qualityEnums['Command Pending'].enum);

        this.tempVal = ko.computed(function() {
            var override = (!!this.override()) ? this.qualityEnums.Override.enum : 0;
            var covDisabled = (!!this.covDisabled()) ? this.qualityEnums['COV Enable'].enum : 0;
            var alarmsOff = (!!this.alarmsOff()) ? this.qualityEnums['Alarms Off'].enum : 0;
            var commandPending = (!!this.commandPending()) ? this.qualityEnums['Command Pending'].enum : 0;
            var total = this.qualityEnums.Override.enum | this.qualityEnums['COV Enable'].enum | this.qualityEnums['Alarms Off'].enum | this.qualityEnums['Command Pending'].enum;

            var val = override | covDisabled | alarmsOff | commandPending;
            if (val === total) {
                val = this.qualityEnums.All.enum;
            }
            this.data.Value(val);
            return val;
        }, this);
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
    return {
        viewModel: ViewModel,
        template: view
    };
});
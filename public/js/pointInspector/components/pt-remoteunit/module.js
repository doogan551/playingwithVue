define(['knockout', 'text!./view.html', 'bannerJS'], function(ko, view, bannerJS) {

    function ViewModel(params) {
        var self = this;
        this.root = params;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.apiEndpoint = params.apiEndpoint;
        this.isInEditMode = params.isInEditMode;

        //Modal stuff
        this.deviceTime = ko.observable('');

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

    // Use prototype to declare any public methods
    ViewModel.prototype.initialize = function(state) {
        var self = this,
            $btn = $(event.target),
            $btnIcon = $btn.find('i.fa'),
            $valueField,
            modalValueListener,
            states = [{ icon: 'fa-reply', msg: 'Reset successful' }, { icon: 'fa-flash', msg: 'Warm restart successful' }];

        if (!self.root.authorize(self.data, self.root.permissionLevels.CONTROL)) return;

        //Default to warm restart
        state = (typeof state != 'number') ? 1 : state;

        function callback(commandRX) {
            var msg = commandRX.value();
            $btn.removeClass('btn-warning');
            $btnIcon.removeClass('fa-refresh fa-spin')
                .addClass(states[state].icon);
            if (!!commandRX.error()) {
                bannerJS.showBanner(commandRX.error(), 'Ok', null, '#D50000');
                return;
            }
            bannerJS.showBanner(states[state].msg, null, 5 * 1000);
        }
        $btn.addClass('btn-warning');
        $btnIcon.removeClass(states[state].icon)
            .addClass('fa-refresh fa-spin');
        self.point.issueCommand('Device Initialize', { upi: self.data._id(), state: state }, callback);
    };

    ViewModel.prototype.getDeviceTime = function() {
        var self = this;
        function callback(commandRX) {
            if (!!commandRX.error()) {
                bannerJS.showBanner(commandRX.error(), 'Ok', null, '#D50000');
                return;
            }
            self.deviceTime(commandRX.value());
        }
        self.point.issueCommand('Device Time', { upi: self.data._id() }, callback);
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {

    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

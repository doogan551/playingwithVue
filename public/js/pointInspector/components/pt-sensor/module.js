define(['knockout', 'text!./view.html'], function (ko, view) {
    var apiEndpoint;

    function ViewModel(params) {
        var self = this;
        apiEndpoint = params.apiEndpoint;
        this.root = params;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.isInEditMode = params.isInEditMode;

        this.showModal = ko.observable(false);
        this.testValue = ko.observable(0);
        this.testResult = ko.observable('');

        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            overview: ko.observable(false),
            involvement: ko.observable(false),
            permissions: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;

        this.calculateResult = ko.computed(function () {
            var self = this,
                value = self.testValue(),
                convType = self.data['Conversion Type'],
                convTypeEnum = convType.eValue(),
                convTypeText = convType.Value.peek(),
                cc = new Array(4),
                $clearIcon = $('.testValueContainer i.fa'),
                i,
                y;
        
            if (value === '') {
                $clearIcon.hide();
                self.testResult('');
                return;
            }
            $clearIcon.show();

            [1, 2, 3, 4].forEach(function (data, ndx) {
                cc[ndx] = parseFloat(self.data['Conversion Coefficient ' + data].Value());
            });

            if (convTypeText === 'Flow') {
                y = cc[1] + (cc[2] * value);
                if (y < 0) {
                    y = 0;
                } else {
                    y = cc[0] + Math.sqrt(value);
                }
            } else {
                i = convTypeEnum;
                y = cc[i];
                while (i-- !== 0) {
                    y = (y * value) + cc[i];
                }
            }
            self.testResult(y);

            // Rate limited because all observables were not updated when this fn() was called
        }, this).extend({ rateLimit: 50 });

        params.initDOM();
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.toggleModal = function () {
        this.showModal(true);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {
        this.calculateResult.dispose();
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

var ViewModel = function () {
    var self = this,
        cnt = 0,
        i = 0;

    // templateNames is a global defined in our pug file
    self.templateNames = templateNames;

    self.selectedTemplate = ko.observable();
    self.gettingData = ko.observable(false);
    self.error = ko.observable(false);
    self.showResults = ko.observable(false);
    self.results = ko.observableArray([]);

    self.validate = function () {
        var err = false;

        self.gettingData(true);
        self.error(false);
        self.showResults(false);

        $.ajax({
            type: 'post',
            url: '/toolbag/validatePoints',
            data: JSON.stringify({
                template: self.selectedTemplate()
            }),
            contentType: 'application/json'
        }).done(
            function handleData (data) {
                // data = {
                //     err: '' // only present if error occurred
                //     validationProblems: [{
                //         pointName: '',
                //         problems: ['', '', etc.]
                //     }]
                // }
                if (data.err) {
                    err = data.err;
                    return;
                }

                self.results(data.validationProblems);
            }
        ).fail(
            function handleFail (jqXHR, textStatus, errorThrown) {
                console.log('globalSearch getDistinctValues failed', jqXHR, textStatus, errorThrown);
                err = ['Oops. Something went wrong', textStatus, errorThrown].join(' - ');
            }
        ).always (
            function finished () {
                self.gettingData(false);
                self.error(err);
                self.showResults(!err);
            }
        );
    };

    return self;
};

// onReady
$(function () {
    window.vm = new ViewModel();
    ko.applyBindings(vm);
});
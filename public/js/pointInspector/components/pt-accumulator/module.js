/* jslint white:true */
define(['knockout', 'text!./view.html', 'bannerJS'], function (ko, view, bannerJS) {
    var $body = $('body'),
        $viewOverlay = $('.viewOverlay');

    function ViewModel(params) {
        var self = this;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.apiEndpoint = params.apiEndpoint;
        this.isInEditMode = params.isInEditMode;

        //Modal stuff
        this.modal = {
            error: ko.observable(''),
            showModal: ko.observable(false),
            value: ko.observable(''),
            cancel: function () {},
            submit: function () {}
        };

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

    ViewModel.prototype.setValue = function (vm, event) {
        var self = this,
            $btn = $(event.target),
            $btnIcon = $btn.find('i.fa'),
            $valueField,
            $modal = $('.modal'),
            $btnSubmit = $modal.find('.btnSubmit'),
            modal = this.modal,
            modalValueListener,
            logData = {
                user: self.utility.workspace.user(),
                point: {
                    _id: self.data._id(),
                    Security: self.data.Security(),
                    path: self.data.path(),
                    'Point Type': {
                        eValue: self.data['Point Type'].eValue()
                    }
                },
                newValue: {
                    Value: 0
                }
            };
        $btnSubmit.prop('disabled', false);

        function callback(commandRX) {
            $btn.removeClass('btn-warning');
            $btnIcon.removeClass('fa-refresh fa-spin');
            if (!!commandRX.error()) {
                bannerJS.showBanner('Reset value unsuccessful. ' + commandRX.error(), 'Ok', null, '#D50000');
                $btn.addClass('btn-danger');
                $btnIcon.addClass('fa-warning');
                return;
            }
            $btn.addClass('btn-success');
            $btnIcon.addClass('fa-check');
        }

        $modal.one('hide.bs.modal', function (e) {
            modalValueListener.dispose();
        });
        $modal.one('shown.bs.modal', function (e) {
            $valueField = $modal.find('.val:first');
            modal.value.valueHasMutated();
            $valueField.focus();
        });

        modalValueListener = modal.value.subscribe(function (newValue) {
            console.log('-----', newValue);
            if ($.trim(newValue) === '' || isNaN($.trim(newValue))) {
                modal.value(0);
            }
        });

        modal.value(0);
        modal.submit = function () {
            logData.newValue.Value = modal.value();

            self.point.issueCommand('Command Point', {
                upi: self.data._id(),
                Value: modal.value(),
                logData: logData
            }, callback);
            modal.showModal(false);
            $btn.removeClass('btn-danger btn-success').addClass('btn-warning');
            $btnIcon.removeClass('fa-pencil-square-o fa-check fa-warning')
                .addClass('fa-refresh fa-spin');
        };
        modal.showModal(true);
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function () {

    };

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});

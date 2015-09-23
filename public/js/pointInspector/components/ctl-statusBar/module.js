define(['knockout', 'text!./view.html'], function(ko, view) {

    function ViewModel(params) {
        var self = this,
            $wrapper = $('.wrapper'),
            pointData = params.point.data;

        this.reliability = !!pointData.Reliability && pointData.Reliability.Value;
        this.alarmState = !!pointData['Alarm State'] && pointData['Alarm State'].Value;
        this.cfgRequired = pointData._cfgRequired;
        this.updatePending = pointData._updPoint;
        this.programError = !!pointData['Program Error'] && pointData['Program Error'].Value;

        this.isVisible = ko.pureComputed(function() {
            var _visible = (self.showReliability() ||
                    self.showAlarmState() ||
                    self.showCfgRequired() ||
                    self.showUpdateRequired() ||
                    self.showProgramError()) &&
                    (['Display', 'Report', 'Schedule', 'Schedule Entry', 'Script', 'Sensor', 'Sequence', 'Slide Show'].indexOf(pointData["Point Type"].Value()) === -1);

            if (_visible) {
                $wrapper.addClass('showStatus');
            } else {
                $wrapper.removeClass('showStatus');
            }

            return _visible;
        });
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.showReliability = function() {
        return typeof this.reliability == 'function' && this.reliability() != 'No Fault';
    };
    ViewModel.prototype.showAlarmState = function() {
        return typeof this.alarmState == 'function' && this.alarmState() != 'Normal';
    };
    ViewModel.prototype.showCfgRequired = function() {
        return typeof this.cfgRequired == 'function' && this.cfgRequired();
    };
    ViewModel.prototype.showUpdateRequired = function() {
        return typeof this.updatePending == 'function' && this.updatePending();
    };
    ViewModel.prototype.showProgramError = function() {
        return typeof this.programError == 'function' && this.programError() != 'None';
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
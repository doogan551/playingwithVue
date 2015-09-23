define(['knockout', 'text!./view.html'], function(ko, view) {

    ko.bindingHandlers.context = {
        init:function(element, valueAccessor, allBindingsAccessor, viewModel){
            viewModel.$element      = $(element);
            viewModel.__context__   = element.getContext("2d");
            //setTimeout(function() {
                viewModel.sizeCanvas();
           //     viewModel.$element.show();
            //}, 100);
            window.addEventListener('resize', viewModel.resizeHandler, false);
        },
        update:function(element, valueAccessor, allBindingsAccessor, viewModel){
            var callback = viewModel.createScene;
            callback.call(viewModel, viewModel.__context__);
        }
    };

    function calculateCoordinates() {
        var values          = this.values,
            value           = this.data.Value,
            min             = this.data['Minimum Value'],
            max             = this.data['Maximum Value'],
            disableFault    = this.data['Disable Limit Fault'],
            valueDeadband   = this.data['Value Deadband'],
            warningsEnabled = this.data['Enable Warning Alarms'],
            lowWarning      = this.data['Low Warning Limit'],
            highWarning     = this.data['High Warning Limit'],
            warningDeadband = this.data['Warning Adjust Band'],
            alarmsDisabled  = this.data['Alarms Off'],
            lowAlarm        = this.data['Low Alarm Limit'],
            highAlarm       = this.data['High Alarm Limit'],
            alarmDeadband   = this.data['Alarm Deadband'],
            coordinates     = {};

        function calc(value, minimum, maximum) {
            return (value - minimum) / (maximum - minimum);
        }

        if (typeof min == 'undefined' || typeof max == 'undefined') return null;

        min = min.Value();
        max = max.Value();
        if (!!disableFault && !disableFault.Value() && !!valueDeadband && !!valueDeadband.Value()) {
            min -= valueDeadband.Value();
            max += valueDeadband.Value();
            coordinates.valueDeadband = calc(valueDeadband.Value(), min, max);
        }

        coordinates.valuePointer = calc(value.Value(), min, max);

        // Some points do not have property 'Alarms Off' (Setpoint Adjust & Totalizer for ex)
        if (alarmsDisabled && !alarmsDisabled.Value()) {
            coordinates.highAlarm = calc(highAlarm.Value(), min, max);
            coordinates.lowAlarm  = calc(lowAlarm.Value(), min, max);
            if (!!alarmDeadband.Value()) {
                coordinates.alarmDeadband = calc(alarmDeadband.Value(), min, max);
            }
        }

        // Some points do not have property 'Enable Warning Alarms' (Setpoint Adjust & Totalizer for ex)
        if (warningsEnabled && warningsEnabled.Value()) {
            coordinates.highWarning = calc(highWarning.Value(), min, max);
            coordinates.lowWarning  = calc(lowWarning.Value(), min, max);
            if (!!warningDeadband.Value()) {
                coordinates.warningDeadband = calc(warningDeadband.Value(), min, max);
            }
        }

        return coordinates;
    }

    function ViewModel(params) {
        var self            = this;
        this.root           = params.rootContext;
        this.data           = this.root.point.data;
        this.canvasState    = ko.observable(false);
        this._resizeTimer   = null;
        this.resizeHandler  = function(event) {
            clearTimeout(self._resizeTimer);
            self._resizeTimer = setTimeout(function() { self.sizeCanvas(self, event) }, 100 );
        };
        this.isInEditMode   = this.root.isInEditMode;
        this.sizeListener = this.root.currentTab.subscribe(function(value) {
            clearTimeout(self._resizeTimer);
            self._resizeTimer = setTimeout(function() { self.sizeCanvas() }, 100 );
        });
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.sizeCanvas = function() {
        var self        = this,
            context     = self.__context__,
            element     = context.canvas,
            $element    = $(element),
            $container  = $element.parent(),
            width;
        if (self.root.currentTab() != self.$element.closest('.content').attr('id')) return;
        clearTimeout(self.resizeTimer);
        self.resizeTimer = setTimeout(function() {
            width = $container.width();
            $element.attr({width: width, height: 10});
            self.createScene(context);
            $element.show();
        }, 100);
    };

    ViewModel.prototype.createScene = function(context) {
        var canvas          = context.canvas,
            coordinates     = calculateCoordinates.call(this),
            valuePointer    = coordinates && Math.round(coordinates.valuePointer * canvas.width),
            highAlarm       = coordinates.highAlarm && Math.round(coordinates.highAlarm * canvas.width),
            lowAlarm        = coordinates.lowAlarm && Math.round(coordinates.lowAlarm * canvas.width),
            highWarning     = coordinates.highWarning && Math.round(coordinates.highWarning * canvas.width),
            lowWarning      = coordinates.lowWarning && Math.round(coordinates.lowWarning * canvas.width),
            lowStop         = 0,
            highStop        = canvas.width;

        if (!!coordinates.valueDeadband) {
            lowStop += coordinates.valueDeadband;
            highStop -= coordinates.valueDeadband;
            //lower deadband
            context.beginPath();
            context.fillStyle = '#ECE90C';
            context.fillRect(0, 0, lowStop, canvas.height);
            //upper deadband
            context.beginPath();
            context.fillStyle = '#ECE90C';
            context.fillRect(highStop, 0, canvas.width - highStop, canvas.height);
        }

        context.beginPath();
        context.fillStyle = '#5cb85c';
        context.fillRect(lowStop, 0, highStop, canvas.height);

        if (typeof highAlarm == 'number') {
            context.beginPath();
            context.fillStyle = '#d9534f';
            context.fillRect(highAlarm, 0, highStop - highAlarm, canvas.height);
        }

        if (typeof lowAlarm == 'number') {
            context.beginPath();
            context.fillStyle = '#d9534f';
            context.fillRect(lowStop, 0, lowAlarm, canvas.height);
        }

        if (typeof highWarning == 'number') {
            context.beginPath();
            context.fillStyle = '#f0ad4e';
            if (typeof highAlarm == 'number') {
                context.fillRect(highWarning, 0, highAlarm - highWarning, canvas.height);
            } else {
                context.fillRect(highWarning, 0, highStop - highWarning, canvas.height);
            }
        }

        if (typeof lowWarning == 'number') {
            context.beginPath();
            context.fillStyle = '#f0ad4e';
            if (typeof lowAlarm == 'number') {
                context.fillRect(lowAlarm, 0, lowWarning - lowAlarm, canvas.height);
            } else {
                context.fillRect(lowStop, 0, lowWarning, canvas.height);
            }
        }

        //draw inner shadow
        context.beginPath();
        context.fillStyle = 'rgba(0,0,0,1)';
        context.shadowColor = 'rgba(0,0,0,.2)';
        context.shadowBlur = 1;
        context.shadowOffsetY = 1;
        context.fillRect(0, -canvas.height, canvas.width, canvas.height);

        //draw the pointer's shadow
        context.fillStyle = 'rgba(0,0,0,1)';
        context.shadowColor = 'rgba(0,0,0,.2)';
        context.shadowBlur = 1;
        context.shadowOffsetY = 1;
        context.beginPath();
        context.moveTo(valuePointer, 5);
        context.lineTo(valuePointer + 5, 0);
        context.lineTo(valuePointer - 5, 0);
        context.closePath();
        context.fill();

        context.globalCompositeOperation = 'destination-out';

        //Draw our pointer
        context.fillStyle = 'rgba(0,0,0,1)';
        context.shadowColor = '#000';
        context.shadowBlur = 0;
        context.shadowOffsetY = 15;
        context.beginPath();
        context.moveTo(valuePointer, 5);
        context.lineTo(valuePointer + 5, 0);
        context.lineTo(valuePointer - 5, 0);
        context.closePath();
        context.fill();

        context.globalCompositeOperation = 'source-over';
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        var self = this;
        window.removeEventListener('resize', self.resizeHandler);
        this.sizeListener.dispose();
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

define(['knockout', 'text!./view.html'], function(ko, view) {
    function ViewModel(params) {
        var self = this,
            _pointSensorType,
            _pointConversionType,
            _newConversionType,
            _conversionAdjustmentFactor = 0.0,
            validateValues = function(min, max, value) {
                var errorBool = false;
                if (max !== undefined && value > max) {
                    self.errorMsg('Value is too high (' + max + ').');
                    errorBool = true;
                } else if (min !== undefined && value < min) {
                    self.errorMsg('Value is too low (' + min + ').');
                    errorBool = true;
                } else {
                    self.errorMsg();
                    errorBool = false;
                }

                self.hasError(errorBool);
                return errorBool;
            },
            getRTDRanges = function() {
                $.ajax({
                        url: "/api/curvefit/getRTDRange",
                        contentType: 'application/json',
                        dataType: 'json',
                        type: 'POST'
                    })
                    .done(function(response) {
                        self.rtdRanges(response);
                        for(var prop in response){
                            console.log(prop);
                        }
                    });
            };

        getRTDRanges();
        self.root = params.rootContext;
        self.config = self.root.utility.config;
        self.enums = self.config.Enums;

        self.point = self.root.point;
        self.data = self.point.data;

        _pointSensorType = (self.data["Point Type"].Value() === "Sensor") ? ko.observable(self.data["Sensor Type"].Value()) : (self.data["Point Type"].Value() === "Analog Input") ? "Input" : "";
        if (self.data["Point Type"].Value() === "Analog Input") {
            _pointSensorType = ko.observable("Input");
        } else if (self.data["Point Type"].Value() === "Analog Output") {
            _pointSensorType = ko.observable("Output");
        } else {
            _pointSensorType = ko.observable(self.data["Sensor Type"].Value());
        }
        //_pointConversionType = ko.observable(self.data["Conversion Type"].Value());

        self.socket = self.root.socket;
        self.sensorMatrix = {
            "Sensor IO Devices": [{
                enum: 0,
                option: "Custom",
                visible: ko.observable(true)
            }, {
                enum: 1,
                option: "MicroScan 5 UNV",
                visible: ko.observable(true)
            }, {
                enum: 2,
                option: "MicroScan 4 UNV",
                visible: ko.observable(true)
            }, {
                enum: 3,
                option: "MicroScan 4 VAV",
                visible: ko.observable(true)
            }, {
                enum: 4,
                option: "MicroScan 3 DDC",
                visible: ko.observable(true)
            }, {
                enum: 5,
                option: "SCADA Vio",
                visible: ko.observable(true)
            }],
            "Sensor IO Types": [{
                enum: 0,
                option: "None",
                visible: ko.observable(true)
            }, {
                enum: 1,
                option: "5 Volt",
                visible: ko.observable(true)
            }, {
                enum: 2,
                option: "10 Volt",
                visible: ko.observable(true)
            }, {
                enum: 3,
                option: "20 mA",
                visible: ko.observable(true)
            }, {
                enum: 4,
                option: "Flow",
                visible: ko.observable(true)
            }, {
                enum: 5,
                option: "Non-Linear Resistance",
                visible: ko.observable(true)
            }, {
                enum: 6,
                option: "Linear Resistance",
                visible: ko.observable(true)
            }, {
                enum: 7,
                option: "20 mA (240 Ohm)",
                visible: ko.observable(true)
            }, {
                enum: 8,
                option: "20 mA (243 Ohm)",
                visible: ko.observable(true)
            }, {
                enum: 9,
                option: "20 mA (250 Ohm)",
                visible: ko.observable(true)
            }],
            "Sensor RTD Types": [{ // Keep these enum options in order and incrementing. Enum is used as array index.
                enum: 0,
                option: "None",
                visible: ko.observable(false)
            }, {
                enum: 1,
                option: "1000 Ohm 385 Platinum RTD",
                visible: ko.observable(true)
            }, {
                enum: 2,
                option: "100 Ohm 385 Platinum RTD",
                visible: ko.observable(true)
            },{
                enum: 3,
                option: "JCI AB99",
                visible: ko.observable(true)
            }],
            "Velocity Types": [{
                enum: 0,
                option: "Linear",
                visible: ko.observable(true)
            }, {
                enum: 1,
                option: "Pressure",
                visible: ko.observable(true)
            }]
        };

        self.errorMsg = ko.observable();
        self.hasError = ko.observable();
        self.rtdRanges = ko.observable({});
        self.sensorIODevices = ko.observableArray(self.sensorMatrix["Sensor IO Devices"]);
        self.sensorIOTypes = ko.observableArray(self.sensorMatrix["Sensor IO Types"]);
        self.sensorRTDTypes = ko.observableArray(self.sensorMatrix["Sensor RTD Types"]);
        self.velocityTypes = ko.observableArray(self.sensorMatrix["Velocity Types"]);

        self.selectedIODevice = ko.observable();
        self.selectedSensorIOType = ko.observable();
        self.selectedSensorRTDType = ko.observable();
        self.selectedVelocityType = ko.observable();

        self.minValidSensorValue = ko.observable(0);
        self.maxValidSensorValue = ko.observable(20);
        self.minValidValue = ko.observable(undefined);
        self.maxValidValue = ko.observable(undefined);
        self.minValidVelocityPressure = ko.observable();
        self.maxValidVelocityPressure = ko.observable();
        self.minValidVelocityFlow = ko.observable();
        self.maxValidVelocityFlow = ko.observable();
        self.minValidDuctArea = ko.observable();
        self.maxValidDuctArea = ko.observable();

        self.minSensorValue = ko.observable().extend({
            forceFloat: null
        });
        console.log(self.minSensorValue());
        self.maxSensorValue = ko.observable().extend({
            forceFloat: null
        });
        self.minValue = ko.observable().extend({
            forceFloat: null
        });
        self.maxValue = ko.observable().extend({
            forceFloat: null
        });
        self.velocityPressure = ko.observable().extend({
            forceFloat: null
        });
        self.velocityFlow = ko.observable().extend({
            forceFloat: null
        });
        self.ductAreaValue = ko.observable().extend({
            forceFloat: null
        });

        self.isSensorIODeviceVisible = ko.observable(true);
        self.isSensorIOTypeVisible = ko.observable(false);
        self.isSensorRTDTypeVisible = ko.observable(false);
        self.isVelocityTypeVisible = ko.observable(false);
        self.minSensorValueVisibility = ko.observable(false);
        self.flowSensorVisiblity = ko.observable(true);
        self.maxSensorValueVisibility = ko.observable(false);
        self.minValueVisibility = ko.observable(false);
        self.velocityPressureVisibility = ko.observable(false);
        self.ductAreaVisibility = ko.observable(false);
        self.maxValueVisibility = ko.observable(false);
        self.velocityFlowVisibility = ko.observable(false);
        self.flowSensorVisiblity(false);
        self.minSensorValueVisibility.subscribe(function(val) {
            $('#secondRowNonSensor').show();
        });

        self.flowSensorVisiblity.subscribe(function(val) {

            $('#pointReference').removeClass("col-sm-12 col-md-6");
            $('#pointReference').addClass("col-md-12");
        });

        self.secondRowFirstColVis = ko.computed(function() {
            return self.minSensorValueVisibility() || self.flowSensorVisiblity();
        }, self);
        self.secondRowSecondColVis = ko.computed(function() {
            return self.maxSensorValueVisibility();
        }, self);
        self.thirdRowFirstColVis = ko.computed(function() {
            return self.minValueVisibility() || self.ductAreaVisibility() || self.velocityPressureVisibility();
        }, self);
        self.thirdRowSecondColVis = ko.computed(function() {
            return self.maxValueVisibility() || self.velocityFlowVisibility();
        }, self);

        self.enableMinSensor = ko.observable(true);
        self.enableMaxSensor = ko.observable(true);
        self.enableMinValue = ko.observable(true);
        self.enableMaxValue = ko.observable(true);

        self.conversionCoef1 = ko.observable(0).extend({
            forceFloat: null
        });
        self.conversionCoef2 = ko.observable(0).extend({
            forceFloat: null
        });
        self.conversionCoef3 = ko.observable(0).extend({
            forceFloat: null
        });
        self.conversionCoef4 = ko.observable(0).extend({
            forceFloat: null
        });
        self.secondRowFirstCol = ko.observable();
        self.secondRowSecondCol = ko.observable();
        self.thirdRowFirstCol = ko.observable();
        self.thirdRowSecondCol = ko.observable();
        self.thirdRowThirdCol = ko.observable();

        self.modal = {
            error: ko.observable(''),
            template: ko.observable(''),
            showModal: ko.observable(false),
            submitText: ko.observable(''),
            calculateText: ko.observable(''),
            title: ko.observable(''),
            cancel: function() {},
            submit: function() {}
        };

        /*for (var device in self.sensorMatrix["Sensor IO Devices"]) {
            self.sensorIODevices.push(self.sensorMatrix["Sensor IO Devices"][device]);
        }
        for (var rtd in self.sensorMatrix["Sensor RTD Types"]) {
            self.sensorRTDTypes.push(self.sensorMatrix["Sensor RTD Types"][rtd]);
        }
        for (var velocity in self.sensorMatrix["Velocity Types"]) {
            self.velocityTypes.push(self.sensorMatrix["Velocity Types"][velocity]);
        }*/

        self.setOptionsDisable = function(option, item) {
            ko.applyBindingsToNode(option, {
                visible: item.visible
            }, item);
        };

        self.selectedIODevice.subscribe(function(device) {

            self.resetVisibility();
            self.isSensorIOTypeVisible(true);
            switch (device) {
                case 0: // Custom
                    //self.showBasics(true);
                    self.setPropertyVisibility("Sensor IO Types", [0], true);
                    self.selectedSensorIOType(0);
                    $('.modal').find('.btnCalc').prop('disabled', true);
                    break;
                case 1:
                case 5:
                    _conversionAdjustmentFactor = 1.0;
                    self.showBasics(true);
                    if (_pointSensorType() === "Output") {
                        self.setPropertyVisibility("Sensor IO Types", [1, 2, 3], true);
                    } else {
                        self.setPropertyVisibility("Sensor IO Types", [1, 2, 3, 4, 5, 6], true);
                    }
                    self.selectedSensorIOType(0);
                    self.selectedSensorIOType(1);
                    break;
                case 2:
                case 4:
                    _conversionAdjustmentFactor = 51.0;
                    self.showBasics(true);
                    if (_pointSensorType() === "Output") {
                        self.setPropertyVisibility("Sensor IO Types", [1, 2, 3], true);
                    } else {
                        self.setPropertyVisibility("Sensor IO Types", [1, 2, 7, 8, 9, 4, 5, 6], true);
                    }
                    self.selectedSensorIOType(0);
                    self.selectedSensorIOType(1);
                    break;
                case 3:
                    self.showBasics(true);
                    if (_pointSensorType() === "Output") {
                        self.setPropertyVisibility("Sensor IO Types", [2, 3], true);
                    } else {
                        self.setPropertyVisibility("Sensor IO Types", [2, 3, 4, 5, 6], true);
                    }
                    self.selectedSensorIOType(0);
                    self.selectedSensorIOType(2);
                    break;

            }

        });

        self.selectedSensorIOType.subscribe(function(ioType) {

            self.resetVisibility();
            self.isSensorIOTypeVisible(true);
            self.resetValidators();

            self.setLabelText(ioType);
            switch (ioType) {
                case 0:
                    _newConversionType = "Linear";
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 1:
                    _newConversionType = "Linear";
                    if (_pointSensorType() === "Output" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 51.0;
                    } else if (_pointSensorType() === "Input" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 5 / 4095;
                    }
                    self.maxValidSensorValue(5);
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 2:
                    _newConversionType = "Linear";
                    if (_pointSensorType() === "Output" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 25.5;
                    } else if (_pointSensorType() === "Input" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 10 / 4095;
                    } else if (_pointSensorType() === "Output" && self.selectedIODevice() === 3) {
                        _conversionAdjustmentFactor = 409.5;
                    } else if (_pointSensorType() === "Input" && self.selectedIODevice() === 3) {
                        _conversionAdjustmentFactor = 1.0 / 409.5;
                    }
                    self.maxValidSensorValue(10);
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 3:
                    _newConversionType = "Linear";
                    if (_pointSensorType() === "Output" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 12.75;
                    } else if (_pointSensorType() === "Output" && self.selectedIODevice() === 3) {
                        _conversionAdjustmentFactor = 1.0 / 196.56;
                    } else if (_pointSensorType() === "Input" && self.selectedIODevice() === 3) {
                        _conversionAdjustmentFactor = 1.0 / 196.56;
                    }
                    self.maxValidSensorValue(20);
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 4:
                    _newConversionType = "Flow";
                    self.isVelocityTypeVisible(true);
                    self.flowSensorVisiblity(true);
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 5:
                    _newConversionType = "Cubic";
                    self.isSensorRTDTypeVisible(true);
                    if (_pointSensorType() === "Input" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        self.maxValidSensorValue(2000);
                        _conversionAdjustmentFactor = 0.48828125;
                    } else if (_pointSensorType() === "Input" && self.selectedIODevice() === 3) {
                        self.maxValidSensorValue(1200);
                        _conversionAdjustmentFactor = 1.0 / 3.276;
                    }
                    self.maxSensorValue(self.maxValidSensorValue());
                    self.selectedSensorRTDType(2);
                    self.selectedSensorRTDType(1);
                    break;
                case 6:
                    _newConversionType = "Linear";
                    self.maxValidSensorValue(2000);
                    if (_pointSensorType() === "Input" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 0.48828125;
                    } else if (_pointSensorType() === "Input" && self.selectedIODevice() === 3) {
                        self.maxValidSensorValue(1000);
                        _conversionAdjustmentFactor = 1.0 / 4.095;
                    }
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 7:
                    _newConversionType = "Linear";
                    if (_pointSensorType() === "Input" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 20 / 3931.2;
                    }
                    self.maxValidSensorValue(20);
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 8:
                    _newConversionType = "Linear";
                    if (_pointSensorType() === "Input" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 20 / 3980.34;
                    }
                    self.maxValidSensorValue(20);
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;
                case 9:
                    _newConversionType = "Linear";
                    if (_pointSensorType() === "Input" && [2, 4].indexOf(self.selectedIODevice()) > -1) {
                        _conversionAdjustmentFactor = 20 / 4095;
                    }
                    self.maxValidSensorValue(20);
                    self.maxSensorValue(self.maxValidSensorValue());
                    break;

                default:
                    break;
            }

        });

        self.selectedVelocityType.subscribe(function(type) {
            if (self.selectedSensorIOType() === 4) {
                self.resetVisibility();
                self.isSensorIOTypeVisible(true);
                self.isVelocityTypeVisible(true);
                self.flowSensorVisiblity(true);

                self.setLabelText(self.selectedSensorIOType());
            }
        });

        self.selectedSensorRTDType.subscribe(function(rtd) {
            if (!$.isEmptyObject(self.rtdRanges()) && rtd !== 0) {
                self.minValidValue(self.rtdRanges()[self.sensorMatrix["Sensor RTD Types"][rtd].option].min);
                self.maxValidValue(self.rtdRanges()[self.sensorMatrix["Sensor RTD Types"][rtd].option].max);
                self.minSensorValue('');
                self.maxSensorValue('');
                console.log(self.minValidValue());
                self.minValue(self.minValidValue());
                self.maxValue(self.maxValidValue());
            }
        });

        self.minSensorValue.subscribe(function(value) {
            self.disableFields(1, validateValues(self.minValidSensorValue(), self.maxValidSensorValue(), value));
        });
        self.maxSensorValue.subscribe(function(value) {
            self.disableFields(2, validateValues(self.minValidSensorValue(), self.maxValidSensorValue(), value));
        });
        self.minValue.subscribe(function(value) {
            self.disableFields(3, validateValues(self.minValidValue(), self.maxValidValue(), value));
        });
        self.maxValue.subscribe(function(value) {
            self.disableFields(4, validateValues(self.minValidValue(), self.maxValidValue(), value));
        });
        self.velocityPressure.subscribe(function(value) {
            validateValues(self.minValidVelocityPressure(), self.maxValidVelocityPressure(), value);
        });
        self.velocityFlow.subscribe(function(value) {
            validateValues(self.minValidVelocityFlow(), self.maxValidVelocityFlow(), value);
        });
        self.ductAreaValue.subscribe(function(value) {
            validateValues(self.minValidDuctArea(), self.maxValidDuctArea(), value);
        });

        self.disableFields = function(field, bool) {
            if (bool) {
                switch (field) {
                    case 1:
                        self.enableMaxSensor(!bool);
                        self.enableMinValue(!bool);
                        self.enableMaxValue(!bool);
                        break;
                    case 2:
                        self.enableMinSensor(!bool);
                        self.enableMinValue(!bool);
                        self.enableMaxValue(!bool);
                        break;
                    case 3:
                        self.enableMinSensor(!bool);
                        self.enableMaxSensor(!bool);
                        self.enableMaxValue(!bool);
                        break;
                    case 4:
                        self.enableMinSensor(!bool);
                        self.enableMaxSensor(!bool);
                        self.enableMinValue(!bool);
                        break;
                }
            } else {
                if (self.selectedSensorIOType() !== 5) {
                    self.enableMinSensor(!bool);
                    self.enableMaxSensor(!bool);
                }
                self.enableMinValue(!bool);
                self.enableMaxValue(!bool);
            }
        };

        self.showBasics = function(bool) {
            self.isSensorIOTypeVisible(bool);
            self.showMinMaxVals(bool);
        };

        self.showMinMaxVals = function(bool) {
            self.minSensorValueVisibility(bool);
            self.maxSensorValueVisibility(bool);
            self.minValueVisibility(bool);
            self.maxValueVisibility(bool);
        };

        self.setPropertyVisibility = function(property, options, bool) {
            for (var i = 0; i < self.sensorMatrix[property].length; i++) {
                if (options.indexOf(self.sensorMatrix[property][i].enum) > -1) {
                    self.sensorMatrix[property][i].visible(bool);
                } else {
                    self.sensorMatrix[property][i].visible(!bool);
                }
            }
        };

        self.setLabelText = function(enumerator) {
            switch (enumerator) {
                /*case 0:*/
                case 1:
                case 2:
                case 3:
                case 6:
                case 7:
                case 8:
                case 9:
                    self.secondRowFirstCol('Minimum Sensor Value');
                    self.secondRowSecondCol('Maximum Sensor Value');
                    self.thirdRowFirstCol('Minimum Value');
                    self.thirdRowSecondCol('Maximum Value');
                    self.showBasics(true);
                    break;

                case 4:
                    self.secondRowFirstCol('');
                    self.secondRowSecondCol('');
                    if (self.selectedVelocityType() === 0) {
                        self.thirdRowFirstCol('Duct Area');
                        self.ductAreaVisibility(true);
                        self.thirdRowSecondCol('');
                    } else if (self.selectedVelocityType() === 1) {
                        self.thirdRowFirstCol('Velocity Pressure');
                        self.thirdRowSecondCol('Velocity Flow');
                        self.velocityPressureVisibility(true);
                        self.velocityFlowVisibility(true);
                    }
                    break;

                case 5:
                    self.secondRowFirstCol('');
                    self.secondRowSecondCol('');
                    self.thirdRowFirstCol('Minimum Temperature');
                    self.thirdRowSecondCol('Maximum Temperature');
                    self.enableMinSensor(false);
                    self.enableMaxSensor(false);
                    self.secondRowFirstCol('Minimum Resistance');
                    self.secondRowSecondCol('Maximum Resistance');
                    self.showBasics(true);
                    /*self.minValueVisibility(true);
                    self.maxValueVisibility(true);*/
                    break;
            }
        };

        self.resetValidators = function() {
            self.minValidSensorValue(undefined);
            self.maxValidSensorValue(undefined);
            self.minValidValue(undefined);
            self.maxValidValue(undefined);
            self.minValidVelocityPressure(undefined);
            self.maxValidVelocityPressure(undefined);
            self.minValidVelocityFlow(undefined);
            self.maxValidVelocityFlow(undefined);
            self.minValidDuctArea(undefined);
            self.maxValidDuctArea(undefined);
        };

        self.secondRowFirstColVis = ko.computed(function() {
            return self.minSensorValueVisibility();
        }, self);
        self.secondRowSecondColVis = ko.computed(function() {
            return self.maxSensorValueVisibility();
        }, self);
        self.thirdRowFirstColVis = ko.computed(function() {
            return self.minValueVisibility() || self.ductAreaVisibility() || self.velocityPressureVisibility();
        }, self);
        self.thirdRowSecondColVis = ko.computed(function() {
            return self.maxValueVisibility() || self.velocityFlowVisibility();
        }, self);

        self.hasError.subscribe(function(bool) {
            // change to binding on button
            $('.modal').find('.btnCalc').prop('disabled', bool);
            console.log('hasError', bool);
        });

        self.resetVisibility = function() {
            self.isSensorIODeviceVisible(true);
            self.showBasics(false);
            self.isSensorRTDTypeVisible(false);
            self.isVelocityTypeVisible(false);
            self.flowSensorVisiblity(false);
            self.velocityPressureVisibility(false);
            self.ductAreaVisibility(false);
            self.velocityFlowVisibility(false);
            self.conversionCoef1(0);
            self.conversionCoef2(0);
            self.conversionCoef3(0);
            self.conversionCoef4(0);
            $('#secondRowNonSensor').hide();
            $('#secondRowSensor').hide();
            $('.modal').find('.btnCalc').prop('disabled', false);
            self.enableMinSensor(true);
            self.enableMaxSensor(true);
            self.enableMinValue(true);
            self.enableMaxValue(true);
            self.minSensorValue(0);
            self.maxSensorValue(0);
            self.minValue(0);
            self.maxValue(100);
            self.ductAreaValue(0);
            self.velocityFlow(0);
            self.velocityPressure(0);
        };

        if (["Analog Input", "Analog Output"].indexOf(self.data["Point Type"].Value()) === -1) {
            self.selectedIODevice(self.data["Sensor IO Device"].eValue());
            self.selectedSensorIOType(self.data["Sensor IO Type"].eValue());
            self.selectedSensorRTDType((self.data["Sensor RTD Type"].eValue() === 0) ? 1 : self.data["Sensor RTD Type"].eValue());
            self.selectedVelocityType(self.data["Velocity Type"].eValue());
            self.minSensorValue(self.data["Minimum Sensor Value"].Value());
            self.maxSensorValue(self.data["Maximum Sensor Value"].Value());
            self.minValue(self.data["Minimum Value"].Value());
            self.maxValue(self.data["Maximum Value"].Value());
            self.velocityPressure(self.data["Velocity Pressure"].Value());
            self.velocityFlow(self.data["Velocity Flow"].Value());
            self.ductAreaValue(self.data["Duct Area"].Value());
        }

        self.sendConversion = function() {
            var fCoeff = [];

            if (_newConversionType == "Linear") {
                self.sendFit('Linear', {
                    input_conv: (_pointSensorType() === "Input"),
                    lvolts: self.minSensorValue(),
                    hvolts: self.maxSensorValue(),
                    low: self.minValue(),
                    high: self.maxValue(),
                    c: fCoeff
                });
            } else if (_newConversionType == "Cubic" || _newConversionType == "Quadratic") {
                // Computer Cubic or Quadratic conversion

                self.sendFit('Cubic', {
                    degree: _newConversionType,
                    lowTemp: self.minValue(),
                    highTemp: self.maxValue(),
                    sensorType: self.sensorMatrix["Sensor RTD Types"][self.selectedSensorRTDType()].option,
                    coeff: fCoeff
                });
            } else if (_newConversionType == "Flow") {
                var p1, p2;

                // retrieve coefficients for these from ref point array.
                sensorRef = self.config.Utility.getPropertyObject('Sensor Point', ko.toJS(self.root.point.data));
                if (sensorRef.Value !== 0) {
                    self.errorMsg('');
                    self.hasError(false);
                    // Square Root (Flow) Conversion
                    self.sendFit('Flow', {
                        lv_sensor: (self.selectedVelocityType() === 0),
                        area: self.ductAreaValue() / 12,
                        p1: self.velocityPressure(),
                        p2: self.velocityFlow(),
                        sensorRef: sensorRef
                    });
                } else {
                    self.errorMsg('Must have sensor point for flow conversion.');
                    self.hasError(true);
                }
            }

            // Handle an odd case where -0.0 is produced. IEEE float actually has a -0
            //  defined, but its not something InfoScan cares about
            // * 0 === -0 in js
            for (i = 0; i < 4; i++) {
                if (fCoeff[i] === -0.0)
                    fCoeff[i] = 0.0;
            }
        };

        self.sendFit = function(type, data) {

            $.ajax({
                    url: "/api/curvefit/dofit",
                    contentType: 'application/json',
                    dataType: 'json',
                    type: 'POST',
                    data: JSON.stringify({
                        'type': type,
                        'data': data
                    })
                })
                .done(function(response) {
                    console.log(_conversionAdjustmentFactor);
                    if (_conversionAdjustmentFactor !== 1) {
                        if (_pointSensorType() === "Input") {
                            for (var i = 1; i <= 3; i++) {
                                if (response.coeffs[i] !== undefined) {
                                    response.coeffs[i] *= Math.pow(_conversionAdjustmentFactor, i);
                                }
                            }
                        } else {
                            for (var j = 0; j <= 3; j++) {
                                if (response.coeffs[j] !== undefined) {
                                    response.coeffs[j] *= _conversionAdjustmentFactor;
                                }
                            }
                        }
                    }

                    self.conversionCoef1(response.coeffs[0]);
                    self.conversionCoef2(response.coeffs[1]);
                    self.conversionCoef3(response.coeffs[2]);
                    self.conversionCoef4(response.coeffs[3]);
                    if (response.rtdRange) {
                        self.minSensorValue(response.rtdRange.min);
                        self.maxSensorValue(response.rtdRange.max);
                    }
                });
        };

        self.updatePoint = function() {
            self.data["Conversion Coefficient 1"].Value((self.conversionCoef1() !== undefined) ? self.conversionCoef1() : 0);
            self.data["Conversion Coefficient 2"].Value((self.conversionCoef2() !== undefined) ? self.conversionCoef2() : 0);
            self.data["Conversion Coefficient 3"].Value((self.conversionCoef3() !== undefined) ? self.conversionCoef3() : 0);
            self.data["Conversion Coefficient 4"].Value((self.conversionCoef4() !== undefined) ? self.conversionCoef4() : 0);
            self.data["Conversion Coefficient 1"].isDisplayable(true);
            self.data["Conversion Coefficient 2"].isDisplayable(true);
            self.data["Conversion Coefficient 3"].isDisplayable(false);
            self.data["Conversion Coefficient 4"].isDisplayable(false);
            self.data["Conversion Coefficient 1"].isReadOnly(true);
            self.data["Conversion Coefficient 2"].isReadOnly(true);
            self.data["Conversion Coefficient 3"].isReadOnly(true);
            self.data["Conversion Coefficient 4"].isReadOnly(true);
            self.data["Conversion Type"].Value(_newConversionType);
            self.data["Conversion Type"].eValue(self.enums["Conversion Types"][_newConversionType].enum);
            if (["Analog Input", "Analog Output"].indexOf(self.data["Point Type"].Value()) === -1) {
                self.data["Duct Area"].Value(self.ductAreaValue());
                self.data["Maximum Sensor Value"].Value(self.maxSensorValue());
                self.data["Minimum Sensor Value"].Value(self.minSensorValue());
                self.data["Minimum Value"].Value(self.minValue());
                self.data["Maximum Value"].Value(self.maxValue());
                self.data["Velocity Flow"].Value(self.velocityFlow());
                self.data["Velocity Pressure"].Value(self.velocityPressure());
                self.data["Sensor IO Device"].eValue(self.selectedIODevice());
                self.data["Sensor IO Device"].Value(self.sensorMatrix["Sensor IO Devices"][self.selectedIODevice()].option);
                self.data["Sensor IO Type"].eValue(self.selectedSensorIOType());
                self.data["Sensor IO Type"].Value(self.sensorMatrix["Sensor IO Types"][self.selectedSensorIOType()].option);
                self.data["Sensor RTD Type"].eValue(self.selectedSensorRTDType());
                self.data["Sensor RTD Type"].Value(self.sensorMatrix["Sensor RTD Types"][self.selectedSensorRTDType()].option);
                self.data["Velocity Type"].eValue(self.selectedVelocityType());
                self.data["Velocity Type"].Value(self.sensorMatrix["Velocity Types"][self.selectedVelocityType()].option);
            } else {
                var refPoint = self.root.utility.getPointRefProperty("Sensor Point");
                var point = ko.toJS(self.data);
                refPoint.data.Value(0);
                $(document).triggerHandler({
                    type: 'viewmodelChange',
                    targetElement: null,
                    //since this is part of the pointRefs array, and we can have multiple
                    //entries with the same property name, we send the array index instead
                    property: refPoint.arrayIndex,
                    refPoint: refPoint.data
                });
            }

            switch (self.selectedSensorIOType()) {
                case 0:
                    self.data["Conversion Coefficient 1"].isReadOnly(false);
                    self.data["Conversion Coefficient 2"].isReadOnly(false);
                    if (_pointSensorType() === "Output") {
                        self.data["Conversion Type"].isDisplayable(false);
                        self.data["Conversion Coefficient 3"].isDisplayable(false);
                        self.data["Conversion Coefficient 4"].isDisplayable(false);
                    } else {
                        self.data["Conversion Type"].isDisplayable(true);
                        if (_newConversionType === "Cubic") {
                            self.data["Conversion Coefficient 3"].isDisplayable(true);
                            self.data["Conversion Coefficient 4"].isDisplayable(true);
                            self.data["Conversion Coefficient 3"].isReadOnly(false);
                            self.data["Conversion Coefficient 4"].isReadOnly(false);
                        } else if (_newConversionType === "Flow") {
                            self.data["Conversion Coefficient 3"].isDisplayable(true);
                            self.data["Conversion Coefficient 3"].isReadOnly(false);
                        }
                    }
                    break;
                case 1:
                case 2:
                case 3:
                case 6:
                case 7:
                case 8:
                case 9:
                    self.data["Conversion Type"].isDisplayable(false);
                    self.data["Conversion Coefficient 3"].isDisplayable(false);
                    self.data["Conversion Coefficient 4"].isDisplayable(false);
                    break;
                case 4:
                    self.data["Conversion Type"].isDisplayable(false);
                    self.data["Conversion Coefficient 3"].isDisplayable(true);
                    self.data["Conversion Coefficient 4"].isDisplayable(false);
                    break;
                case 5:
                    self.data["Conversion Type"].isDisplayable(false);
                    self.data["Conversion Coefficient 3"].isDisplayable(true);
                    self.data["Conversion Coefficient 4"].isDisplayable(true);
                    break;
            }
        };



    }

    ko.extenders.forceFloat = function(target) {
        var result = ko.pureComputed({
            read: target, //always return the original observables value
            write: function(newValue) {
                var current = target(),
                    parsedValue = parseFloat(newValue),
                    valueToWrite = isNaN(parsedValue) ? newValue : parsedValue;

                if (valueToWrite === '') {
                    valueToWrite = 0;
                }
                //only write if it changed
                if (valueToWrite !== current) {
                    target(valueToWrite);
                } else {
                    //if the rounded value is the same, but a different value was written, force a notification for the current field
                    if (newValue !== current) {
                        target.notifySubscribers(valueToWrite);
                    }
                }
            }
        }).extend({
            notify: 'always'
        });

        //initialize with current value to make sure it is rounded appropriately
        result(target());

        //return the new computed observable
        return result;
    };

    // Use prototype to declare any public methods
    ViewModel.prototype.conversionWizard = function() {
        var self = this,
            $btn = $(event.target),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal'),
            $modalMain,
            $btnSubmit = $modal.find('.btnSubmit'),
            $btnCalc = $modal.find('.btnCalc'),
            modal = this.modal;

        modal.template('read');
        modal.title('Conversion Wizard');
        modal.submitText('Ok');
        modal.calculateText('Calculate');

        $modalMain = $modal.find('.modalMain');
        $modalMain.show();
        modal.calculate = function() {
            $btnSubmit.prop('disabled', true);
            $btnCalc.prop('disabled', true);
            self.sendConversion();
            $btnSubmit.prop('disabled', false);
            $btnCalc.prop('disabled', false);
        };
        modal.submit = function() {
            self.updatePoint();
            modal.showModal(false);
        };

        modal.showModal(true);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {};

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
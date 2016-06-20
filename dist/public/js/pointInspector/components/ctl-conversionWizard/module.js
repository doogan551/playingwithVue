define(["knockout","text!./view.html"],function(a,b){function c(b){var c,d,e=this,f=0,g=function(a,b,c){var d=!1;return void 0!==b&&c>b?(e.errorMsg("Value is too high ("+b+")."),d=!0):void 0!==a&&c<a?(e.errorMsg("Value is too low ("+a+")."),d=!0):(e.errorMsg(),d=!1),e.hasError(d),d},h=function(){$.ajax({url:"/api/curvefit/getRTDRange",contentType:"application/json",dataType:"json",type:"POST"}).done(function(a){e.rtdRanges(a);for(var b in a)console.log(b)})};h(),e.root=b.rootContext,e.config=e.root.utility.config,e.enums=e.config.Enums,e.point=e.root.point,e.data=e.point.data,c="Sensor"===e.data["Point Type"].Value()?a.observable(e.data["Sensor Type"].Value()):"Analog Input"===e.data["Point Type"].Value()?"Input":"",c="Analog Input"===e.data["Point Type"].Value()?a.observable("Input"):"Analog Output"===e.data["Point Type"].Value()?a.observable("Output"):a.observable(e.data["Sensor Type"].Value()),e.socket=e.root.socket,e.sensorMatrix={"Sensor IO Devices":[{"enum":0,option:"Custom",visible:a.observable(!0)},{"enum":1,option:"MicroScan 5 UNV",visible:a.observable(!0)},{"enum":2,option:"MicroScan 4 UNV",visible:a.observable(!0)},{"enum":3,option:"MicroScan 4 VAV",visible:a.observable(!0)},{"enum":4,option:"MicroScan 3 DDC",visible:a.observable(!0)},{"enum":5,option:"SCADA Vio",visible:a.observable(!0)}],"Sensor IO Types":[{"enum":0,option:"None",visible:a.observable(!0)},{"enum":1,option:"5 Volt",visible:a.observable(!0)},{"enum":2,option:"10 Volt",visible:a.observable(!0)},{"enum":3,option:"20 mA",visible:a.observable(!0)},{"enum":4,option:"Flow",visible:a.observable(!0)},{"enum":5,option:"Non-Linear Resistance",visible:a.observable(!0)},{"enum":6,option:"Linear Resistance",visible:a.observable(!0)},{"enum":7,option:"20 mA (240 Ohm)",visible:a.observable(!0)},{"enum":8,option:"20 mA (243 Ohm)",visible:a.observable(!0)},{"enum":9,option:"20 mA (250 Ohm)",visible:a.observable(!0)}],"Sensor RTD Types":[{"enum":0,option:"None",visible:a.observable(!1)},{"enum":1,option:"1000 Ohm 385 Platinum RTD",visible:a.observable(!0)},{"enum":2,option:"100 Ohm 385 Platinum RTD",visible:a.observable(!0)},{"enum":3,option:"JCI AB99",visible:a.observable(!0)}],"Velocity Types":[{"enum":0,option:"Linear",visible:a.observable(!0)},{"enum":1,option:"Pressure",visible:a.observable(!0)}]},e.errorMsg=a.observable(),e.hasError=a.observable(),e.rtdRanges=a.observable({}),e.sensorIODevices=a.observableArray(e.sensorMatrix["Sensor IO Devices"]),e.sensorIOTypes=a.observableArray(e.sensorMatrix["Sensor IO Types"]),e.sensorRTDTypes=a.observableArray(e.sensorMatrix["Sensor RTD Types"]),e.velocityTypes=a.observableArray(e.sensorMatrix["Velocity Types"]),e.selectedIODevice=a.observable(),e.selectedSensorIOType=a.observable(),e.selectedSensorRTDType=a.observable(),e.selectedVelocityType=a.observable(),e.minValidSensorValue=a.observable(0),e.maxValidSensorValue=a.observable(20),e.minValidValue=a.observable(void 0),e.maxValidValue=a.observable(void 0),e.minValidVelocityPressure=a.observable(),e.maxValidVelocityPressure=a.observable(),e.minValidVelocityFlow=a.observable(),e.maxValidVelocityFlow=a.observable(),e.minValidDuctArea=a.observable(),e.maxValidDuctArea=a.observable(),e.minSensorValue=a.observable().extend({forceFloat:null}),console.log(e.minSensorValue()),e.maxSensorValue=a.observable().extend({forceFloat:null}),e.minValue=a.observable().extend({forceFloat:null}),e.maxValue=a.observable().extend({forceFloat:null}),e.velocityPressure=a.observable().extend({forceFloat:null}),e.velocityFlow=a.observable().extend({forceFloat:null}),e.ductAreaValue=a.observable().extend({forceFloat:null}),e.isSensorIODeviceVisible=a.observable(!0),e.isSensorIOTypeVisible=a.observable(!1),e.isSensorRTDTypeVisible=a.observable(!1),e.isVelocityTypeVisible=a.observable(!1),e.minSensorValueVisibility=a.observable(!1),e.flowSensorVisiblity=a.observable(!0),e.maxSensorValueVisibility=a.observable(!1),e.minValueVisibility=a.observable(!1),e.velocityPressureVisibility=a.observable(!1),e.ductAreaVisibility=a.observable(!1),e.maxValueVisibility=a.observable(!1),e.velocityFlowVisibility=a.observable(!1),e.flowSensorVisiblity(!1),e.minSensorValueVisibility.subscribe(function(a){$("#secondRowNonSensor").show()}),e.flowSensorVisiblity.subscribe(function(a){$("#pointReference").removeClass("col-sm-12 col-md-6"),$("#pointReference").addClass("col-md-12")}),e.secondRowFirstColVis=a.computed(function(){return e.minSensorValueVisibility()||e.flowSensorVisiblity()},e),e.secondRowSecondColVis=a.computed(function(){return e.maxSensorValueVisibility()},e),e.thirdRowFirstColVis=a.computed(function(){return e.minValueVisibility()||e.ductAreaVisibility()||e.velocityPressureVisibility()},e),e.thirdRowSecondColVis=a.computed(function(){return e.maxValueVisibility()||e.velocityFlowVisibility()},e),e.enableMinSensor=a.observable(!0),e.enableMaxSensor=a.observable(!0),e.enableMinValue=a.observable(!0),e.enableMaxValue=a.observable(!0),e.conversionCoef1=a.observable(0).extend({forceFloat:null}),e.conversionCoef2=a.observable(0).extend({forceFloat:null}),e.conversionCoef3=a.observable(0).extend({forceFloat:null}),e.conversionCoef4=a.observable(0).extend({forceFloat:null}),e.secondRowFirstCol=a.observable(),e.secondRowSecondCol=a.observable(),e.thirdRowFirstCol=a.observable(),e.thirdRowSecondCol=a.observable(),e.thirdRowThirdCol=a.observable(),e.modal={error:a.observable(""),template:a.observable(""),showModal:a.observable(!1),submitText:a.observable(""),calculateText:a.observable(""),title:a.observable(""),cancel:function(){},submit:function(){}},e.setOptionsDisable=function(b,c){a.applyBindingsToNode(b,{visible:c.visible},c)},e.selectedIODevice.subscribe(function(a){switch(e.resetVisibility(),e.isSensorIOTypeVisible(!0),a){case 0:e.setPropertyVisibility("Sensor IO Types",[0],!0),e.selectedSensorIOType(0),$(".modal").find(".btnCalc").prop("disabled",!0);break;case 1:case 5:f=1,e.showBasics(!0),"Output"===c()?e.setPropertyVisibility("Sensor IO Types",[1,2,3],!0):e.setPropertyVisibility("Sensor IO Types",[1,2,3,4,5,6],!0),e.selectedSensorIOType(0),e.selectedSensorIOType(1);break;case 2:case 4:f=51,e.showBasics(!0),"Output"===c()?e.setPropertyVisibility("Sensor IO Types",[1,2,3],!0):e.setPropertyVisibility("Sensor IO Types",[1,2,7,8,9,4,5,6],!0),e.selectedSensorIOType(0),e.selectedSensorIOType(1);break;case 3:e.showBasics(!0),"Output"===c()?e.setPropertyVisibility("Sensor IO Types",[2,3],!0):e.setPropertyVisibility("Sensor IO Types",[2,3,4,5,6],!0),e.selectedSensorIOType(0),e.selectedSensorIOType(2)}}),e.selectedSensorIOType.subscribe(function(a){switch(e.resetVisibility(),e.isSensorIOTypeVisible(!0),e.resetValidators(),e.setLabelText(a),a){case 0:d="Linear",e.maxSensorValue(e.maxValidSensorValue());break;case 1:d="Linear","Output"===c()&&[2,4].indexOf(e.selectedIODevice())>-1?f=51:"Input"===c()&&[2,4].indexOf(e.selectedIODevice())>-1&&(f=5/4095),e.maxValidSensorValue(5),e.maxSensorValue(e.maxValidSensorValue());break;case 2:d="Linear","Output"===c()&&[2,4].indexOf(e.selectedIODevice())>-1?f=25.5:"Input"===c()&&[2,4].indexOf(e.selectedIODevice())>-1?f=10/4095:"Output"===c()&&3===e.selectedIODevice()?f=409.5:"Input"===c()&&3===e.selectedIODevice()&&(f=1/409.5),e.maxValidSensorValue(10),e.maxSensorValue(e.maxValidSensorValue());break;case 3:d="Linear","Output"===c()&&[2,4].indexOf(e.selectedIODevice())>-1?f=12.75:"Output"===c()&&3===e.selectedIODevice()?f=1/196.56:"Input"===c()&&3===e.selectedIODevice()&&(f=1/196.56),e.maxValidSensorValue(20),e.maxSensorValue(e.maxValidSensorValue());break;case 4:d="Flow",e.isVelocityTypeVisible(!0),e.flowSensorVisiblity(!0),e.maxSensorValue(e.maxValidSensorValue());break;case 5:d="Cubic",e.isSensorRTDTypeVisible(!0),"Input"===c()&&[2,4].indexOf(e.selectedIODevice())>-1?(e.maxValidSensorValue(2e3),f=.48828125):"Input"===c()&&3===e.selectedIODevice()&&(e.maxValidSensorValue(1200),f=1/3.276),e.maxSensorValue(e.maxValidSensorValue()),e.selectedSensorRTDType(2),e.selectedSensorRTDType(1);break;case 6:d="Linear",e.maxValidSensorValue(2e3),"Input"===c()&&[2,4].indexOf(e.selectedIODevice())>-1?f=.48828125:"Input"===c()&&3===e.selectedIODevice()&&(e.maxValidSensorValue(1e3),f=1/4.095),e.maxSensorValue(e.maxValidSensorValue());break;case 7:d="Linear","Input"===c()&&[2,4].indexOf(e.selectedIODevice())>-1&&(f=20/3931.2),e.maxValidSensorValue(20),e.maxSensorValue(e.maxValidSensorValue());break;case 8:d="Linear","Input"===c()&&[2,4].indexOf(e.selectedIODevice())>-1&&(f=20/3980.34),e.maxValidSensorValue(20),e.maxSensorValue(e.maxValidSensorValue());break;case 9:d="Linear","Input"===c()&&[2,4].indexOf(e.selectedIODevice())>-1&&(f=20/4095),e.maxValidSensorValue(20),e.maxSensorValue(e.maxValidSensorValue())}}),e.selectedVelocityType.subscribe(function(a){4===e.selectedSensorIOType()&&(e.resetVisibility(),e.isSensorIOTypeVisible(!0),e.isVelocityTypeVisible(!0),e.flowSensorVisiblity(!0),e.setLabelText(e.selectedSensorIOType()))}),e.selectedSensorRTDType.subscribe(function(a){$.isEmptyObject(e.rtdRanges())||0===a||(e.minValidValue(e.rtdRanges()[e.sensorMatrix["Sensor RTD Types"][a].option].min),e.maxValidValue(e.rtdRanges()[e.sensorMatrix["Sensor RTD Types"][a].option].max),e.minSensorValue(""),e.maxSensorValue(""),console.log(e.minValidValue()),e.minValue(e.minValidValue()),e.maxValue(e.maxValidValue()))}),e.minSensorValue.subscribe(function(a){e.disableFields(1,g(e.minValidSensorValue(),e.maxValidSensorValue(),a))}),e.maxSensorValue.subscribe(function(a){e.disableFields(2,g(e.minValidSensorValue(),e.maxValidSensorValue(),a))}),e.minValue.subscribe(function(a){e.disableFields(3,g(e.minValidValue(),e.maxValidValue(),a))}),e.maxValue.subscribe(function(a){e.disableFields(4,g(e.minValidValue(),e.maxValidValue(),a))}),e.velocityPressure.subscribe(function(a){g(e.minValidVelocityPressure(),e.maxValidVelocityPressure(),a)}),e.velocityFlow.subscribe(function(a){g(e.minValidVelocityFlow(),e.maxValidVelocityFlow(),a)}),e.ductAreaValue.subscribe(function(a){g(e.minValidDuctArea(),e.maxValidDuctArea(),a)}),e.disableFields=function(a,b){if(b)switch(a){case 1:e.enableMaxSensor(!b),e.enableMinValue(!b),e.enableMaxValue(!b);break;case 2:e.enableMinSensor(!b),e.enableMinValue(!b),e.enableMaxValue(!b);break;case 3:e.enableMinSensor(!b),e.enableMaxSensor(!b),e.enableMaxValue(!b);break;case 4:e.enableMinSensor(!b),e.enableMaxSensor(!b),e.enableMinValue(!b)}else 5!==e.selectedSensorIOType()&&(e.enableMinSensor(!b),e.enableMaxSensor(!b)),e.enableMinValue(!b),e.enableMaxValue(!b)},e.showBasics=function(a){e.isSensorIOTypeVisible(a),e.showMinMaxVals(a)},e.showMinMaxVals=function(a){e.minSensorValueVisibility(a),e.maxSensorValueVisibility(a),e.minValueVisibility(a),e.maxValueVisibility(a)},e.setPropertyVisibility=function(a,b,c){for(var d=0;d<e.sensorMatrix[a].length;d++)b.indexOf(e.sensorMatrix[a][d]["enum"])>-1?e.sensorMatrix[a][d].visible(c):e.sensorMatrix[a][d].visible(!c)},e.setLabelText=function(a){switch(a){case 1:case 2:case 3:case 6:case 7:case 8:case 9:e.secondRowFirstCol("Minimum Sensor Value"),e.secondRowSecondCol("Maximum Sensor Value"),e.thirdRowFirstCol("Minimum Value"),e.thirdRowSecondCol("Maximum Value"),e.showBasics(!0);break;case 4:e.secondRowFirstCol(""),e.secondRowSecondCol(""),0===e.selectedVelocityType()?(e.thirdRowFirstCol("Duct Area"),e.ductAreaVisibility(!0),e.thirdRowSecondCol("")):1===e.selectedVelocityType()&&(e.thirdRowFirstCol("Velocity Pressure"),e.thirdRowSecondCol("Velocity Flow"),e.velocityPressureVisibility(!0),e.velocityFlowVisibility(!0));break;case 5:e.secondRowFirstCol(""),e.secondRowSecondCol(""),e.thirdRowFirstCol("Minimum Temperature"),e.thirdRowSecondCol("Maximum Temperature"),e.enableMinSensor(!1),e.enableMaxSensor(!1),e.secondRowFirstCol("Minimum Resistance"),e.secondRowSecondCol("Maximum Resistance"),e.showBasics(!0)}},e.resetValidators=function(){e.minValidSensorValue(void 0),e.maxValidSensorValue(void 0),e.minValidValue(void 0),e.maxValidValue(void 0),e.minValidVelocityPressure(void 0),e.maxValidVelocityPressure(void 0),e.minValidVelocityFlow(void 0),e.maxValidVelocityFlow(void 0),e.minValidDuctArea(void 0),e.maxValidDuctArea(void 0)},e.secondRowFirstColVis=a.computed(function(){return e.minSensorValueVisibility()},e),e.secondRowSecondColVis=a.computed(function(){return e.maxSensorValueVisibility()},e),e.thirdRowFirstColVis=a.computed(function(){return e.minValueVisibility()||e.ductAreaVisibility()||e.velocityPressureVisibility()},e),e.thirdRowSecondColVis=a.computed(function(){return e.maxValueVisibility()||e.velocityFlowVisibility()},e),e.hasError.subscribe(function(a){$(".modal").find(".btnCalc").prop("disabled",a),console.log("hasError",a)}),e.resetVisibility=function(){e.isSensorIODeviceVisible(!0),e.showBasics(!1),e.isSensorRTDTypeVisible(!1),e.isVelocityTypeVisible(!1),e.flowSensorVisiblity(!1),e.velocityPressureVisibility(!1),e.ductAreaVisibility(!1),e.velocityFlowVisibility(!1),e.conversionCoef1(0),e.conversionCoef2(0),e.conversionCoef3(0),e.conversionCoef4(0),$("#secondRowNonSensor").hide(),$("#secondRowSensor").hide(),$(".modal").find(".btnCalc").prop("disabled",!1),e.enableMinSensor(!0),e.enableMaxSensor(!0),e.enableMinValue(!0),e.enableMaxValue(!0),e.minSensorValue(0),e.maxSensorValue(0),e.minValue(0),e.maxValue(100),e.ductAreaValue(0),e.velocityFlow(0),e.velocityPressure(0)},["Analog Input","Analog Output"].indexOf(e.data["Point Type"].Value())===-1&&(e.selectedIODevice(e.data["Sensor IO Device"].eValue()),e.selectedSensorIOType(e.data["Sensor IO Type"].eValue()),e.selectedSensorRTDType(0===e.data["Sensor RTD Type"].eValue()?1:e.data["Sensor RTD Type"].eValue()),e.selectedVelocityType(e.data["Velocity Type"].eValue()),e.minSensorValue(e.data["Minimum Sensor Value"].Value()),e.maxSensorValue(e.data["Maximum Sensor Value"].Value()),e.minValue(e.data["Minimum Value"].Value()),e.maxValue(e.data["Maximum Value"].Value()),e.velocityPressure(e.data["Velocity Pressure"].Value()),e.velocityFlow(e.data["Velocity Flow"].Value()),e.ductAreaValue(e.data["Duct Area"].Value())),e.sendConversion=function(){var b=[];if("Linear"==d)e.sendFit("Linear",{input_conv:"Input"===c(),lvolts:e.minSensorValue(),hvolts:e.maxSensorValue(),low:e.minValue(),high:e.maxValue(),c:b});else if("Cubic"==d||"Quadratic"==d)e.sendFit("Cubic",{degree:d,lowTemp:e.minValue(),highTemp:e.maxValue(),sensorType:e.sensorMatrix["Sensor RTD Types"][e.selectedSensorRTDType()].option,coeff:b});else if("Flow"==d){sensorRef=e.config.Utility.getPropertyObject("Sensor Point",a.toJS(e.root.point.data)),0!==sensorRef.Value?(e.errorMsg(""),e.hasError(!1),e.sendFit("Flow",{lv_sensor:0===e.selectedVelocityType(),area:e.ductAreaValue()/12,p1:e.velocityPressure(),p2:e.velocityFlow(),sensorRef:sensorRef})):(e.errorMsg("Must have sensor point for flow conversion."),e.hasError(!0))}for(i=0;i<4;i++)b[i]===-0&&(b[i]=0)},e.sendFit=function(a,b){$.ajax({url:"/api/curvefit/dofit",contentType:"application/json",dataType:"json",type:"POST",data:JSON.stringify({type:a,data:b})}).done(function(a){if(console.log(f),1!==f)if("Input"===c())for(var b=1;b<=3;b++)void 0!==a.coeffs[b]&&(a.coeffs[b]*=Math.pow(f,b));else for(var d=0;d<=3;d++)void 0!==a.coeffs[d]&&(a.coeffs[d]*=f);e.conversionCoef1(a.coeffs[0]),e.conversionCoef2(a.coeffs[1]),e.conversionCoef3(a.coeffs[2]),e.conversionCoef4(a.coeffs[3]),a.rtdRange&&(e.minSensorValue(a.rtdRange.min),e.maxSensorValue(a.rtdRange.max))})},e.updatePoint=function(){if(e.data["Conversion Coefficient 1"].Value(void 0!==e.conversionCoef1()?e.conversionCoef1():0),e.data["Conversion Coefficient 2"].Value(void 0!==e.conversionCoef2()?e.conversionCoef2():0),e.data["Conversion Coefficient 3"].Value(void 0!==e.conversionCoef3()?e.conversionCoef3():0),e.data["Conversion Coefficient 4"].Value(void 0!==e.conversionCoef4()?e.conversionCoef4():0),e.data["Conversion Coefficient 1"].isDisplayable(!0),e.data["Conversion Coefficient 2"].isDisplayable(!0),e.data["Conversion Coefficient 3"].isDisplayable(!1),e.data["Conversion Coefficient 4"].isDisplayable(!1),e.data["Conversion Coefficient 1"].isReadOnly(!0),e.data["Conversion Coefficient 2"].isReadOnly(!0),e.data["Conversion Coefficient 3"].isReadOnly(!0),e.data["Conversion Coefficient 4"].isReadOnly(!0),e.data["Conversion Type"].Value(d),e.data["Conversion Type"].eValue(e.enums["Conversion Types"][d]["enum"]),["Analog Input","Analog Output"].indexOf(e.data["Point Type"].Value())===-1)e.data["Duct Area"].Value(e.ductAreaValue()),e.data["Maximum Sensor Value"].Value(e.maxSensorValue()),e.data["Minimum Sensor Value"].Value(e.minSensorValue()),e.data["Minimum Value"].Value(e.minValue()),e.data["Maximum Value"].Value(e.maxValue()),e.data["Velocity Flow"].Value(e.velocityFlow()),e.data["Velocity Pressure"].Value(e.velocityPressure()),e.data["Sensor IO Device"].eValue(e.selectedIODevice()),e.data["Sensor IO Device"].Value(e.sensorMatrix["Sensor IO Devices"][e.selectedIODevice()].option),e.data["Sensor IO Type"].eValue(e.selectedSensorIOType()),e.data["Sensor IO Type"].Value(e.sensorMatrix["Sensor IO Types"][e.selectedSensorIOType()].option),e.data["Sensor RTD Type"].eValue(e.selectedSensorRTDType()),e.data["Sensor RTD Type"].Value(e.sensorMatrix["Sensor RTD Types"][e.selectedSensorRTDType()].option),e.data["Velocity Type"].eValue(e.selectedVelocityType()),e.data["Velocity Type"].Value(e.sensorMatrix["Velocity Types"][e.selectedVelocityType()].option);else{var b=e.root.utility.getPointRefProperty("Sensor Point");a.toJS(e.data);b.data.Value(0),$(document).triggerHandler({type:"viewmodelChange",targetElement:null,property:b.arrayIndex,refPoint:b.data})}switch(e.selectedSensorIOType()){case 0:e.data["Conversion Coefficient 1"].isReadOnly(!1),e.data["Conversion Coefficient 2"].isReadOnly(!1),"Output"===c()?(e.data["Conversion Type"].isDisplayable(!1),e.data["Conversion Coefficient 3"].isDisplayable(!1),e.data["Conversion Coefficient 4"].isDisplayable(!1)):(e.data["Conversion Type"].isDisplayable(!0),"Cubic"===d?(e.data["Conversion Coefficient 3"].isDisplayable(!0),e.data["Conversion Coefficient 4"].isDisplayable(!0),e.data["Conversion Coefficient 3"].isReadOnly(!1),e.data["Conversion Coefficient 4"].isReadOnly(!1)):"Flow"===d&&(e.data["Conversion Coefficient 3"].isDisplayable(!0),e.data["Conversion Coefficient 3"].isReadOnly(!1)));break;case 1:case 2:case 3:case 6:case 7:case 8:case 9:e.data["Conversion Type"].isDisplayable(!1),e.data["Conversion Coefficient 3"].isDisplayable(!1),e.data["Conversion Coefficient 4"].isDisplayable(!1);break;case 4:e.data["Conversion Type"].isDisplayable(!1),e.data["Conversion Coefficient 3"].isDisplayable(!0),e.data["Conversion Coefficient 4"].isDisplayable(!1);break;case 5:e.data["Conversion Type"].isDisplayable(!1),e.data["Conversion Coefficient 3"].isDisplayable(!0),e.data["Conversion Coefficient 4"].isDisplayable(!0)}}}return a.extenders.forceFloat=function(b){var c=a.pureComputed({read:b,write:function(a){var c=b(),d=parseFloat(a),e=isNaN(d)?a:d;""===e&&(e=0),e!==c?b(e):a!==c&&b.notifySubscribers(e)}}).extend({notify:"always"});return c(b()),c},c.prototype.conversionWizard=function(){var a,b=this,c=$(event.target),d=(c.find("i.fa"),$(".modal")),e=d.find(".btnSubmit"),f=d.find(".btnCalc"),g=this.modal;g.template("read"),g.title("Conversion Wizard"),g.submitText("Ok"),g.calculateText("Calculate"),a=d.find(".modalMain"),a.show(),g.calculate=function(){e.prop("disabled",!0),f.prop("disabled",!0),b.sendConversion(),e.prop("disabled",!1),f.prop("disabled",!1)},g.submit=function(){b.updatePoint(),g.showModal(!1)},g.showModal(!0)},c.prototype.dispose=function(){},{viewModel:c,template:b}});
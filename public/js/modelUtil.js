var mongo = require('mongodb');
var pointsCollection = "points";
var Config = require('./lib/config.js');
var async = require('async');

var ModelUtil;

ModelUtil = (function() {
	var obj = {};

	// DeviceUtilures properties for a device
	obj.Device = {
		updateAll: function(data, db, callback) {

			this.applyModelType(data, function(err, device) {

				callback(null, device);
			});

		},

		applyModelType: function(data, callback) {

			callback(null, Config.EditChanges.applyDeviceTypeModelType(data));
		},

		applyUplinkPort: function(data, callback) {

			callback(null, Config.EditChanges.applyDeviceTypeUplinkPort(data));
		},

		applyEthernetProtocol: function(data, callback) {

			callback(null, Config.EditChanges.applyDeviceTypeEthernetProtocol(data));
		},

		applyPortNProtocol: function(data, callback) {

			callback(null, Config.EditChanges.applyDeviceTypePortNProtocol(data));
		}
	};

	obj["Remote Unit"] = {
		updateAll: function(data, db, callback) {
			this.applyModelType(data, function(err, rmu) {
				callback(null, rmu);
			});
		},

		applyModelType: function(data, callback) {

			callback(null, Config.EditChanges.applyRemoteUnitTypeModelType(data));
		},

		applyNetworkType: function(data) {
			callback(null, Config.EditChanges.applyRemoteUnitTypeNetworkType(data));
		}
	};

	obj["Analog Input"] = {

		updateAll: function(data, db, callback) {
			obj["Analog Input"].applyDevModel(data, function(err, aiPoint) {
				data.point = aiPoint;
				obj["Analog Input"].applySensorPoint(data, db, function(err, aiPoint) {
					callback(null, aiPoint);
				});
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applySensorPoint()
		// Description: This routine is called when an AI point's sensor is changed. It updates AI
		//				conversion properties based on the selected sensor.
		//  Parameters: aoPoint - AI point Instance
		//     Returns: aiPoint - updated aiPoint Instance
		//       Notes:
		// Rev.  1.00	08/12/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applySensorPoint: function(data, db, callback) {
			//console.log("applySensorPoint");
			aiPoint = data.point;

			db.collection("points").findOne({
				_id: Config.Utility.getPropertyObject("Sensor Point", aiPoint).Value
			}, function(err, refPoint) {

				data = {
					point: aiPoint,
					refPoint: refPoint,
					property: "Sensor Point"
				};
				/*if (aiPoint._id === 44995)
					console.log("refpoint", refPoint);*/
				data.propertyObject = Config.Utility.getPropertyObject(data.property, data.point);
				if ([7, 8].indexOf(data.point._rmuModel) === -1) {
					callback(null, Config.EditChanges.applyAnalogInputTypeSensorPoint(data));
				} else {
					callback(null, data.point);
				}
			});
			/*dbUtil.findOne({
				_id: aiPoint["Sensor Point"].Value
			}, function (err, refPoint) {

				data = {
					point: aiPoint,
					refPoint: refPoint,
					property: "Sensor Point"
				};
				callback(null, Config.EditChanges.applyAnalogInputTypeSensorPoint(data));

			});*/

		}, // end applySensorPoint()

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when an AI point's device model is changed. It updates 
		//				all point properties based on the selected device model type.
		//  Parameters: aiPoint  - AI point Instance
		//				sensor   - AI sensor point Instance
		//				callback - This is actually a function Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/12/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {
				//console.log("applyDevModel");
				callback(null, Config.EditChanges.applyAnalogInputTypeDevModel(data));
			} // End applyDevModel()

	}; // end obj.AIPoint

	obj["Analog Output"] = {

		updateAll: function(data, db, callback) {
			/*for (var m in obj.AOPoint) {
				console.log(typeof obj.AOPoint[m], " %%%%%", m);
			}*/

			obj["Analog Output"].applyDevModel(data, function(err, aoPoint) {
				data.point = aoPoint;
				obj["Analog Output"].applySensorPoint(data, db, function(err, aoPoint) {

					callback(null, aoPoint);
				});
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applySensorPoint()
		// Description: This routine is called when an AO point's sensor is changed. It updates AO
		//				conversion properties based on the selected sensor.
		//  Parameters: aoPoint - AO point Instance
		//				sensor  - AO sensor point Instance
		//     Returns: aoPoint - updated aoPoint Instance
		//       Notes:
		// Rev.  1.00	08/14/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applySensorPoint: function(data, db, callback) {
			aoPoint = data.point;
			db.collection("points").findOne({
				_id: Config.Utility.getPropertyObject("Sensor Point", aoPoint).Value
			}, function(err, refPoint) {

				data = {
					point: aoPoint,
					refPoint: refPoint,
					property: "Sensor Point"
				};
				data.propertyObject = Config.Utility.getPropertyObject(data.property, data.point);
				callback(null, Config.EditChanges.applyAnalogOutputTypeSensorPoint(data));

			});

		}, // end applySensorPoint()

		//--------------------------------------------------------------------------------------------
		//    Function: applyOutputType()
		// Description: This routine is called when an AO point's output type is changed. It updates 
		//				AO properties based on the selected output type.
		//  Parameters: aoPoint - AO point Instance
		//     Returns: aoPoint - updated aoPoint Instance
		//       Notes:
		// Rev.  1.00	08/14/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyOutputType: function(data, callback) {
			callback(null, Config.EditChanges.applyAnalogOutputTypeOutputType(data));


		}, // end applyOutputType()

		//--------------------------------------------------------------------------------------------
		//    Function: applyValue()
		// Description: This routine is called when an AO point's value is changed.
		//
		//				The Value property of an Analog Ouput can only be changed by issuing a control 
		//				request to the field point and it must be >= Minimum Value property Value and 
		//				<= Maximum Value property Value. No changes are stored in the database although 
		//				an Activity Log entry is made. Control requests consist of the desired value 
		//				(or a Release Control option), a control priority (selected from the Control
		//				Priority enum collection from the database) and a controller (selected from 
		//				the Controllers enum collection from the database. This is not required if it 
		//				is a release control request.)
		//  Parameters: aoPoint - AO point Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/14/2013	???	Original Issue
		//--------------------------------------------------------------------------------------------
		applyValue: function(data) {

		}, // end applyValue()

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when an AO point's device model is changed. It updates 
		//				the necessary AO properties based on the selected device model type.
		//  Parameters: aoPoint  - AO point Instance
		//				sensor   - AO sensor point Instance
		//				callback - This is actually a function Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/14/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {

				callback(null, Config.EditChanges.applyAnalogOutputTypeDevModel(data));

			} // end applyDevModel()

	}; // end obj.AOPoint

	obj["Analog Value"] = {

		updateAll: function(data, db, callback) {
			obj["Analog Value"].applyDevModel(data, function(err, avPoint) {
				callback(null, avPoint);
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when an AV point's device is changed. It updates the
		//				necessary AV properties based on the selected device/rmu model types.
		//  Parameters: avPoint  - AV point Instance
		//				callback - This is actually a function Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/14/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {

			callback(null, Config.EditChanges.applyAnalogValueTypeDevModel(data));

		}, // end applyDevModel()

		//--------------------------------------------------------------------------------------------
		//    Function: applyValue()
		// Description: This routine is called when an AO point's value is changed.
		//				The Value property of an Analog Ouput can only be changed by issuing a control
		//				request to the field point and it must be >= Minimum Value property Value and 
		//				<= Maximum Value property Value. No changes are stored in the database although
		//				an Activity Log entry is made. Control requests consist of the desired value 
		//				(or a Release Control option), a control priority (selected from the Control 
		//				Priority enum collection from the database) and a controller (selected from 
		//				the Controllers enum collection from the database. This is not required if it 
		//				is a release control request.).
		//  Parameters: avPoint - AV point Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/14/2013	???	Original Issue
		//--------------------------------------------------------------------------------------------
		applyValue: function(data) {

			} // end applyValue()

	}; // end obj.AVPoint

	obj["Binary Value"] = {

		updateAll: function(data, db, callback) {
			obj["Binary Value"].applyDevModel(data, function(err, bvPoint) {
				data.point = bvPoint;
				obj["Binary Value"].applyFeedback(data, db, function(err, bvPoint) {

					callback(null, bvPoint);
				});
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when a BV point's device is changed. It updates the
		//				necessary point properties based on the selected device/rmu model types.
		//  Parameters: bvPoint  - BV point Instance
		//				callback - This is actually a function Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {
			callback(null, Config.EditChanges.applyBinaryValueTypeDevModel(data));
		}, // end applyDevModel()

		//--------------------------------------------------------------------------------------------
		//    Function: applyValue()
		// Description: This routine is called when BV point's value is changed.
		//				The Value property of a Binary Value can only be changed by issuing a control 
		//				request to the field point and the available choices are in the ValueOptions 
		//				key. No changes are stored in the database although an Activity Log entry is 
		//				made. Control requests consist of the desired value (or a Release Control 
		//				option), a control priority (selected from the Control Priority enum 
		//				collection from the database) and a controller (selected from the Controllers
		//				enum collection from the database. This is not required if it is a release 
		//				control request.).
		//  Parameters: bvPoint - BV point Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/15/2013	???	Original Issue
		//--------------------------------------------------------------------------------------------
		applyValue: function(data) {

		}, // end applyValue()

		//--------------------------------------------------------------------------------------------
		//    Function: applyFeedback()
		// Description: This routine is called when a BV point's feedback is changed. It updates the
		//				'Alarm Value' property 'isReadOnly' key based on the feedback selection.
		//  Parameters: bvPoint - BV point Instance
		//     Returns: bvPoint - BV point Instance (updated)
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyFeedback: function(data, db, callback) {

				bvPoint = data.point;
				db.collection("points").findOne({
					_id: Config.Utility.getPropertyObject("Feedback Point", bvPoint).Value
				}, function(err, refPoint) {

					data = {
						point: bvPoint,
						refPoint: refPoint,
						property: "Feedback Point"
					};
					data.propertyObject = Config.Utility.getPropertyObject(data.property, data.point);
					callback(null, Config.EditChanges.applyBinaryInputTypeFeedbackPoint(data));

				});


			} // end applyFeedback()

	}; // end obj.BVPoint

	obj["Binary Input"] = {

		updateAll: function(data, db, callback) {
			obj["Binary Input"].applyDevModel(data, function(err, biPoint) {
				data.point = biPoint;
				obj["Binary Input"].applyFeedback(data, db, function(err, biPoint) {

					callback(null, biPoint);
				});
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applyFeedback()
		// Description: This routine is called when a BI point's feedback is changed. It updates the
		//				'Alarm Value' property 'isReadOnly' key based on the feedback selection.
		//  Parameters: biPoint - BI point Instance
		//     Returns: biPoint - BI point Instance (updated)
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyFeedback: function(data, db, callback) {

			biPoint = data.point;
			db.collection("points").findOne({
				_id: Config.Utility.getPropertyObject("Feedback Point", biPoint).Value
			}, function(err, refPoint) {

				data = {
					point: biPoint,
					refPoint: refPoint,
					property: "Feedback Point"
				};
				data.propertyObject = Config.Utility.getPropertyObject(data.property, data.point);
				callback(null, Config.EditChanges.applyBinaryInputTypeFeedbackPoint(data));

			});

		}, // end applyFeedback()

		//--------------------------------------------------------------------------------------------
		//    Function: applyInputType()
		// Description: This routine sets or clears the 'Momentary Delay' property's 'isDisplayable'
		//				key based on the selected input type.
		//  Parameters: biPoint - BI point Instance
		//     Returns: biPoint - BI point Instance (updated)
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyInputType: function(data) {

			callback(null, Config.EditChanges.applyBinaryInputTypeInputType(data));

		}, // end applyInputType()

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when a BI point's device is changed. It updates the
		//				necessary point properties based on the selected device/rmu model types.
		//  Parameters: biPoint  - BI point Instance
		//				callback - This is actually a function Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {
				callback(null, Config.EditChanges.applyBinaryInputTypeDevModel(data));
			} // end applyDevModel()

	}; // end obj.BIPoint

	obj["Binary Output"] = {

		updateAll: function(data, db, callback) {
			this.applyDevModel(data, function(err, boPoint) {
				callback(null, boPoint);
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applyFeedbackType()
		// Description: This routine is called when the point's feedback type is changed. It enables &
		//				disables visibility of the feedback controls based on the selected feedback
		//				type.
		//  Parameters: boPoint - BO point Instance
		//     Returns: boPoint - BO point Instance (updated)
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyFeedbackType: function(data) {
			callback(null, Config.EditChanges.applyBinaryOutputTypeFeedbackType(data));

		}, // end applyFeedbackType()

		//--------------------------------------------------------------------------------------------
		//    Function: applyOutputType()
		// Description: This routine is called when the point's output type is changed. It enables &
		//				disables visibility of the point's output channel controls based on the 
		//				selected output type.
		//  Parameters: boPoint - BO point Instance
		//     Returns: boPoint - BO point Instance (updated)
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyOutputType: function(data) {

			callback(null, Config.EditChanges.applyBinaryOutputTypeOutputType(data));

		}, // end applyOutputType()

		//--------------------------------------------------------------------------------------------
		//    Function: applyValue()
		// Description: This routine is called when BV point's value is changed.
		//				The Value property of a Binary Output can only be changed by issuing a control
		//				request to the field point and the available choices are in the ValueOptions 
		//				key. No changes are stored in the database although an Activity Log entry is 
		//				made. Control requests consist of the desired value (or a Release Control 
		//				option), a control priority (selected from the Control Priority enum 
		//				collection from the database) and a controller (selected from the Controllers
		//				enum collection from the database. This is not required if it is a release 
		//				control request.).
		//  Parameters: boPoint - BO point Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/15/2013	???	Original Issue
		//--------------------------------------------------------------------------------------------
		applyValue: function(data) {

		}, // end applyOutputType()

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when the point's device is changed. It updates the
		//				necessary point properties based on the selected device/rmu model types.
		//  Parameters: boPoint  - BO point Instance
		//				callback - This is actually a function Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/15/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {
				callback(null, Config.EditChanges.applyBinaryOutputTypeDevModel(data));
			} // end applyDevModel()

	}; // end obj.BOPoint

	obj["MultiState Value"] = {

		updateAll: function(data, db, callback) {
			this.applyDevModel(data, function(err, msvPoint) {
				callback(null, msvPoint);
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applyValue()
		// Description: This routine is called when the point's value is changed.
		//				Changes to the Value property are only sent to the field point and the 
		//				available choices are in the ValueOptions key. No changes are stored in the 
		//				database.
		//  Parameters: msvPoint - MultiState point Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/16/2013	???	Original Issue
		//--------------------------------------------------------------------------------------------
		applyValue: function(data) {

		},

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when the point's device is changed. It updates the
		//				necessary point properties based on the selected device/rmu model types.
		//  Parameters: multiStatePoint - BO point Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/16/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {
			callback(null, Config.EditChanges.applyMultiStateValueTypeDevModel(data));

		}
	}; // end obj.MSVPoint

	obj["Accumulator"] = {

		updateAll: function(data, db, callback) {
			this.applyDevModel(data, function(err, accPoint) {
				callback(null, accPoint);
			});
		},

		//--------------------------------------------------------------------------------------------
		//    Function: applyValue()
		// Description: This routine is called when the point's value is changed.
		//				Changes to the Value property are only sent to the field point and the 
		//				available choices are in the ValueOptions key. No changes are stored in the 
		//				database.
		//  Parameters: accPoint - Accumulator point instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/16/2013	???	Original Issue
		//--------------------------------------------------------------------------------------------
		applyValue: function(data) {

			// To be completed

		}, // end applyValue()

		//--------------------------------------------------------------------------------------------
		//    Function: applyDevModel()
		// Description: This routine is called when the point's device is changed. It updates the
		//				necessary point properties based on the selected device/rmu model types.
		//  Parameters: msvPoint - MultiState point Instance
		//     Returns: n/a
		//       Notes:
		// Rev.  1.00	08/30/2013	JDR	Original Issue
		//--------------------------------------------------------------------------------------------
		applyDevModel: function(data, callback) {

				callback(null, Config.EditChanges.applyAccumulatorTypeDevModel(data));
			} // end applyDevModel()

	}; // end obj.ACCPoint

	return obj;
}(ModelUtil || {}));

module.exports = {
	logger: function(statement, callback) {
		console.log(statement);
		return callback();
	},

	"Device": ModelUtil.Device,
	"Remote Unit": ModelUtil["Remote Unit"],
	"Analog Input": ModelUtil["Analog Input"],
	"Analog Output": ModelUtil["Analog Output"],
	"Analog Value": ModelUtil["Analog Value"],
	"Binary Value": ModelUtil["Binary Value"],
	"Binary Input": ModelUtil["Binary Input"],
	"Binary Output": ModelUtil["Binary Output"],
	"MultiState Value": ModelUtil["MultiState Value"],
	"Accumulator": ModelUtil["Accumulator"]
};
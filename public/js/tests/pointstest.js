$(document).ready(function () {

	testTest = function (callback) {
		$.ajax({
			url: '/api/points/test/',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				console.log(JSON.stringify(returnData));
				return callback(true);
			}
		});
	};

	testSearch = function (input, callback) {
		$.ajax({
			url: '/api/points/search/',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.points.length > 0) {
					for (i = 0; i < returnData.points.length; i++) {
						console.log(returnData.points[i]._id);
						console.log(returnData.points[i]._pAccess);
					}
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};

	testCreatePoint = function (input, callback) {
		$.ajax({
			url: '/api/points/create/',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData) {
					console.log(JSON.stringify(returnData));
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};


	testSegment = function (input, callback) {
		$.ajax({
			url: '/api/points/search/segment',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.length > 0) {
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};

	testSegmentSearchType = function (input, callback) {
		$.ajax({
			url: '/api/points/search/segment/searchType',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.length > 0) {
					for (i = 0; i < returnData.length; i++) {
						console.log(returnData[i]);
						console.log();
					}
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};

	testProperties = function (callback) {
		$.ajax({
			url: '/api/points/properties',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.length > 0) {
					return callback(true);
				} else {
					return callback(false);
				}

			}
		});
	};

	testPropertiesWithName = function (input, callback) {
		$.ajax({
			url: '/api/points/properties',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.valuetype) {
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};

	testPointtypes = function (callback) {
		$.ajax({
			url: '/api/points/pointtypes',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.length > 0) {
					return callback(true);
				} else {
					return callback(false);
				}

			}
		});
	};

	testAddEnums = function (input, callback) {
		$.ajax({
			url: '/api/points/addenums',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.message == "app and item combination exist") {
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};

	testPointSearchByID = function (input, callback) {

		$.ajax({
			url: '/api/points/' + input,
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else {
					console.log(JSON.stringify(returnData));
					return callback(true);
				}

			}
		});
	};

	testAddFolder = function (input, callback) {
		$.ajax({
			url: '/api/points/folders/new',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.message == "Folder already exists") {
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};

	testGetPointSearch = function (input, callback) {
		$.ajax({
			url: '/api/points/getpoint/',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData) {
					console.log(JSON.stringify(returnData));
					return callback(true);
				}

			},
			data: input
		});
	};

	testCreatePoint = function (pointName, pointType, callback) {
		$.ajax({
			url: '/api/points/create/' + pointName + '/' + pointType,
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData) {
					console.log(JSON.stringify(returnData));
					return callback(true);
				} else {
					return callback(false);
				}

			}
		});
	};

	testUpdatePoint = function (callback) {
		$.ajax({
			url: '/api/points/update',
			type: 'post',
			contentType: 'application/json',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData) {
					console.log(JSON.stringify(returnData));
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: JSON.stringify({
				newPoint: {
					"_id": 876860,
					"Name": "Rob_Test",
					"name1": "Rob",
					"name2": "Test",
					"name3": "",
					"name4": "",
					"User Groups": {},
					"Users": {},
					"_pAccess": 0,
					"_pStatus": 0,
					"_cfgRequired": true,
					"_relDevice": 0,
					"_relRMU": 0,
					"_relPoint": 0,
					"_updPoint": false,
					"_updFlags": 4,
					"_updTOD": false,
					"_pollTime": 0,
					"_devModel": 4,
					"_rmuModel": 18,
					"_parentUpi": 0,
					"Input Type": {
						"ValueType": 5,
						"Value": "None",
						"eValue": 0,
						"ValueOptions": {
							"None": 0
						},
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Conversion Adjustment": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Conversion Coefficient 1": {
						"ValueType": 1,
						"Value": -50,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Conversion Coefficient 2": {
						"ValueType": 1,
						"Value": 0.125,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Conversion Coefficient 3": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Conversion Coefficient 4": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Conversion Type": {
						"ValueType": 5,
						"Value": "Linear",
						"eValue": 1,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Deadband": {
						"ValueType": 1,
						"Value": 2,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Disable Limit Fault": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Instance": {
						"ValueType": 4,
						"Value": 2,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Filter Weight": {
						"ValueType": 1,
						"Value": 1,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"High Alarm Limit": {
						"ValueType": 1,
						"Value": 150,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"High Warning Limit": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Value Deadband": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Low Alarm Limit": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Low Warning Limit": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Maximum Value": {
						"ValueType": 1,
						"Value": 150,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Minimum Value": {
						"ValueType": 1,
						"Value": 39,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Sensor Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": null,
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Warning Adjust Band": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Enable Warning Alarms": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Adjust Band": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Adjust Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": "",
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Alarm Class": {
						"ValueType": 5,
						"Value": "Normal",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Delay Time": {
						"ValueType": 13,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Display Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": "",
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Alarm Repeat Enable": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Repeat Time": {
						"ValueType": 17,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarms Off": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm State": {
						"ValueType": 5,
						"Value": "Normal",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Broadcast Enable": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Channel": {
						"ValueType": 4,
						"Value": 2,
						"Min": 0,
						"Max": 7,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"COV Enable": {
						"ValueType": 7,
						"Value": true,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"COV Increment": {
						"ValueType": 1,
						"Value": 2,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Device Point": {
						"ValueType": 8,
						"Value": 21048,
						"isDisplayable": true,
						"isReadOnly": true,
						"PointName": "4487_SID02",
						"PointType": 8,
						"DevInst": 95,
						"PointInst": 95
					},
					"Poll Register": {
						"ValueType": 4,
						"Value": 2,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"VAV Channel": {
						"ValueType": 5,
						"Value": "2-Setpoint Adjust",
						"eValue": 2,
						"ValueOptions": {
							"1 - Zone Temperature": 1,
							"2 - Setpoint Adjust": 2,
							"3 - Supply Temperature": 3,
							"4 - Auxiliary": 4,
							"5 - Air Volume": 5
						},
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Engineering Units": {
						"ValueType": 2,
						"Value": "DEGF",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Interlock State": {
						"ValueType": 5,
						"Value": "Off",
						"eValue": 0,
						"ValueOptions": {
							"Off": 0,
							"On": 1
						},
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Interlock Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": "",
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Last Report Time": {
						"ValueType": 11,
						"Value": 1369316980,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Poll Function": {
						"ValueType": 5,
						"Value": "None",
						"eValue": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Out of Service": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Value": {
						"ValueType": 1,
						"Value": 123.1238714,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Quality Code Enable": {
						"ValueType": 18,
						"Value": 255,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Reliability": {
						"ValueType": 5,
						"Value": "No Fault",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Poll Data Type": {
						"ValueType": 5,
						"Value": "Bit 0",
						"eValue": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Remote Unit Point": {
						"ValueType": 8,
						"Value": 21740,
						"isDisplayable": true,
						"isReadOnly": true,
						"PointName": "4487_SID02_IFC20",
						"PointType": 144,
						"DevInst": 95,
						"PointInst": 20
					},
					"Status Flags": {
						"ValueType": 18,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Trend COV Increment": {
						"ValueType": 1,
						"Value": 2,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Trend Interval": {
						"ValueType": 13,
						"Value": 900,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Trend Enable": {
						"ValueType": 7,
						"Value": true,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Trend Samples": {
						"ValueType": 4,
						"Value": 50,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Remarks": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Inhibit": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Description": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Point Instance": {
						"ValueType": 4,
						"Value": 60,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Name1": {
						"ValueType": 2,
						"Value": "Rob",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Name2": {
						"ValueType": 2,
						"Value": "Test",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Name3": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Name4": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Point Type": {
						"ValueType": 5,
						"Value": "Analog Input",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"taglist": ["Analog Input"]
				},
				oldPoint: {
					"_id": 876860,
					"Name": "Rob_Test",
					"name1": "Rob",
					"name2": "Test",
					"name3": "",
					"name4": "",
					"User Groups": {},
					"Users": {},
					"_pAccess": 0,
					"_pStatus": 0,
					"_cfgRequired": true,
					"_relDevice": 0,
					"_relRMU": 0,
					"_relPoint": 0,
					"_updPoint": false,
					"_updFlags": 4,
					"_updTOD": false,
					"_pollTime": 0,
					"_devModel": 4,
					"_rmuModel": 18,
					"_parentUpi": 0,
					"Input Type": {
						"ValueType": 5,
						"Value": "None",
						"eValue": 0,
						"ValueOptions": {
							"None": 0
						},
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Conversion Adjustment": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Conversion Coefficient 1": {
						"ValueType": 1,
						"Value": -50,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Conversion Coefficient 2": {
						"ValueType": 1,
						"Value": 0.125,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Conversion Coefficient 3": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Conversion Coefficient 4": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Conversion Type": {
						"ValueType": 5,
						"Value": "Linear",
						"eValue": 1,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Deadband": {
						"ValueType": 1,
						"Value": 2,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Disable Limit Fault": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Instance": {
						"ValueType": 4,
						"Value": 2,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Filter Weight": {
						"ValueType": 1,
						"Value": 1,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"High Alarm Limit": {
						"ValueType": 1,
						"Value": 150,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"High Warning Limit": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Value Deadband": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Low Alarm Limit": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Low Warning Limit": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Maximum Value": {
						"ValueType": 1,
						"Value": 150,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Minimum Value": {
						"ValueType": 1,
						"Value": 39,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Sensor Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": null,
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Warning Adjust Band": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Enable Warning Alarms": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Adjust Band": {
						"ValueType": 1,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Adjust Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": "",
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Alarm Class": {
						"ValueType": 5,
						"Value": "Normal",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Delay Time": {
						"ValueType": 13,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Display Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": "",
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Alarm Repeat Enable": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Repeat Time": {
						"ValueType": 17,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarms Off": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm State": {
						"ValueType": 5,
						"Value": "Normal",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Broadcast Enable": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Channel": {
						"ValueType": 4,
						"Value": 2,
						"Min": 0,
						"Max": 7,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"COV Enable": {
						"ValueType": 7,
						"Value": true,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"COV Increment": {
						"ValueType": 1,
						"Value": 2,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Device Point": {
						"ValueType": 8,
						"Value": 21048,
						"isDisplayable": true,
						"isReadOnly": true,
						"PointName": "4487_SID02",
						"PointType": 8,
						"DevInst": 95,
						"PointInst": 95
					},
					"Poll Register": {
						"ValueType": 4,
						"Value": 2,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"VAV Channel": {
						"ValueType": 5,
						"Value": "2-Setpoint Adjust",
						"eValue": 2,
						"ValueOptions": {
							"1 - Zone Temperature": 1,
							"2 - Setpoint Adjust": 2,
							"3 - Supply Temperature": 3,
							"4 - Auxiliary": 4,
							"5 - Air Volume": 5
						},
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Engineering Units": {
						"ValueType": 2,
						"Value": "DEGF",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Interlock State": {
						"ValueType": 5,
						"Value": "Off",
						"eValue": 0,
						"ValueOptions": {
							"Off": 0,
							"On": 1
						},
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Interlock Point": {
						"ValueType": 8,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": false,
						"PointName": "",
						"PointType": 0,
						"DevInst": 0,
						"PointInst": 0
					},
					"Last Report Time": {
						"ValueType": 11,
						"Value": 1369316980,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Poll Function": {
						"ValueType": 5,
						"Value": "None",
						"eValue": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Out of Service": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Value": {
						"ValueType": 1,
						"Value": 76.522003173828125,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Quality Code Enable": {
						"ValueType": 18,
						"Value": 255,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Reliability": {
						"ValueType": 5,
						"Value": "No Fault",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Poll Data Type": {
						"ValueType": 5,
						"Value": "Bit 0",
						"eValue": 0,
						"isDisplayable": false,
						"isReadOnly": false
					},
					"Remote Unit Point": {
						"ValueType": 8,
						"Value": 21740,
						"isDisplayable": true,
						"isReadOnly": true,
						"PointName": "4487_SID02_IFC20",
						"PointType": 144,
						"DevInst": 95,
						"PointInst": 20
					},
					"Status Flags": {
						"ValueType": 18,
						"Value": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Trend COV Increment": {
						"ValueType": 1,
						"Value": 2,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Trend Interval": {
						"ValueType": 13,
						"Value": 900,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Trend Enable": {
						"ValueType": 7,
						"Value": true,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Trend Samples": {
						"ValueType": 4,
						"Value": 50,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Remarks": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Alarm Inhibit": {
						"ValueType": 7,
						"Value": false,
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Description": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Point Instance": {
						"ValueType": 4,
						"Value": 60,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"Name1": {
						"ValueType": 2,
						"Value": "Rob",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Name2": {
						"ValueType": 2,
						"Value": "Test",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Name3": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Name4": {
						"ValueType": 2,
						"Value": "",
						"isDisplayable": true,
						"isReadOnly": false
					},
					"Point Type": {
						"ValueType": 5,
						"Value": "Analog Input",
						"eValue": 0,
						"isDisplayable": true,
						"isReadOnly": true
					},
					"taglist": ["Analog Input"]
				}
			})
		});

	};
});
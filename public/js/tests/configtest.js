$(document).ready(function () {

	testFormatPoint = function (data, callback) {
		data.oldPoint = null;
		data.point = {
  "_id" : 31995,
  "Name" : "M4203_AH6_MODE21",
  "name1" : "M4203",
  "name2" : "AH6",
  "name3" : "MODE21",
  "name4" : "",
  "User Groups" : { },
  "Users" : { },
  "_pAccess" : 0,
  "_pStatus" : 0,
  "_cfgRequired" : true,
  "_relDevice" : 0,
  "_relRMU" : 0,
  "_relPoint" : 0,
  "_updPoint" : false,
  "_updFlags" : 0,
  "_updTOD" : false,
  "_forceAllCOV" : false,
  "_pollTime" : 0,
  "_devModel" : 5,
  "_rmuModel" : 8,
  "_parentUpi" : 0,
  "Alarm Value" : {
    "ValueType" : 5,
    "Value" : "UNOC",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Control Priority" : {
    "ValueType" : 5,
    "Value" : "Default (16)",
    "eValue" : 16,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Controller" : {
    "ValueType" : 5,
    "Value" : "None",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Instance" : {
    "ValueType" : 4,
    "Value" : 226,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Fail Action" : {
    "ValueType" : 5,
    "Value" : "Release",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Feedback Point" : {
    "ValueType" : 8,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false,
    "PointName" : "",
    "PointType" : 0,
    "DevInst" : 0,
    "PointInst" : 0
  },
  "Feedback Polarity" : {
    "ValueType" : 5,
    "Value" : "Normal",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Minimum Off Time" : {
    "ValueType" : 12,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Minimum On Time" : {
    "ValueType" : 12,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Monitor Point" : {
    "ValueType" : 8,
    "Value" : 29013,
    "isDisplayable" : true,
    "isReadOnly" : false,
    "PointName" : "4203_AH6_SAF",
    "PointType" : 4,
    "DevInst" : 88,
    "PointInst" : 1
  },
  "Default Value" : {
    "ValueType" : 5,
    "Value" : "UNOC",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Active Text" : {
    "ValueType" : 2,
    "Value" : "OCCD",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Alarm Class" : {
    "ValueType" : 5,
    "Value" : "Normal",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Alarm Delay Time" : {
    "ValueType" : 13,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Alarm Display Point" : {
    "ValueType" : 8,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false,
    "PointName" : "",
    "PointType" : 0,
    "DevInst" : 0,
    "PointInst" : 0
  },
  "Alarm Repeat Enable" : {
    "ValueType" : 7,
    "Value" : false,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Alarm Repeat Time" : {
    "ValueType" : 17,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Alarms Off" : {
    "ValueType" : 7,
    "Value" : true,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Alarm State" : {
    "ValueType" : 5,
    "Value" : "Normal",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Broadcast Enable" : {
    "ValueType" : 7,
    "Value" : false,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Control Pending" : {
    "ValueType" : 7,
    "Value" : false,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "COV Enable" : {
    "ValueType" : 7,
    "Value" : true,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Demand Interval" : {
    "ValueType" : 13,
    "Value" : 0,
    "isDisplayable" : false,
    "isReadOnly" : false
  },
  "Demand Enable" : {
    "ValueType" : 7,
    "Value" : false,
    "isDisplayable" : false,
    "isReadOnly" : false
  },
  "Device Point" : {
    "ValueType" : 8,
    "Value" : 21034,
    "isDisplayable" : true,
    "isReadOnly" : true,
    "PointName" : "4203_JID07",
    "PointType" : 8,
    "DevInst" : 88,
    "PointInst" : 88
  },
  "Interlock State" : {
    "ValueType" : 5,
    "Value" : "Off",
    "eValue" : 0,
    "ValueOptions" : {
      "Off" : 0,
      "On" : 1
    },
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Interlock Point" : {
    "ValueType" : 8,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false,
    "PointName" : "",
    "PointType" : 0,
    "DevInst" : 0,
    "PointInst" : 0
  },
  "Inactive Text" : {
    "ValueType" : 2,
    "Value" : "UNOC",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Last Report Time" : {
    "ValueType" : 11,
    "Value" : 1369314930,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Out of Service" : {
    "ValueType" : 7,
    "Value" : false,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Value" : {
    "ValueType" : 5,
    "Value" : "OCCD",
    "eValue" : 1,
    "ValueOptions" : {
      "UNOC" : 0,
      "OCCD" : 1
    },
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Quality Code Enable" : {
    "ValueType" : 18,
    "Value" : 251,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Reliability" : {
    "ValueType" : 5,
    "Value" : "No Fault",
    "eValue" : 0,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Remote Unit Point" : {
    "ValueType" : 8,
    "Value" : 22005,
    "isDisplayable" : true,
    "isReadOnly" : true,
    "PointName" : "4203_JID07_IFC21",
    "PointType" : 144,
    "DevInst" : 88,
    "PointInst" : 21
  },
  "Status Flags" : {
    "ValueType" : 18,
    "Value" : 2,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Trend Interval" : {
    "ValueType" : 13,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Trend Enable" : {
    "ValueType" : 7,
    "Value" : false,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Trend Samples" : {
    "ValueType" : 4,
    "Value" : 0,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Remarks" : {
    "ValueType" : 2,
    "Value" : "",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Alarm Inhibit" : {
    "ValueType" : 7,
    "Value" : false,
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Description" : {
    "ValueType" : 2,
    "Value" : "",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Point Instance" : {
    "ValueType" : 4,
    "Value" : 21,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "Name1" : {
    "ValueType" : 2,
    "Value" : "M4203",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Name2" : {
    "ValueType" : 2,
    "Value" : "AH6",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Name3" : {
    "ValueType" : 2,
    "Value" : "MODE21",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Name4" : {
    "ValueType" : 2,
    "Value" : "",
    "isDisplayable" : true,
    "isReadOnly" : false
  },
  "Point Type" : {
    "ValueType" : 5,
    "Value" : "Binary Value",
    "eValue" : 5,
    "isDisplayable" : true,
    "isReadOnly" : true
  },
  "taglist" : ["M4203", "AH6", "MODE21", "Binary Value"]
};
		data.property = "Active Text";
		data.refPoint = null;

		result = Config.Update.formatPoint(data);
		console.log(result);
		callback(true);
	};

});
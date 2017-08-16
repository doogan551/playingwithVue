[{
        "_id": 1,
        "parentNode": 0,
        "display": "MSFC",
        "tags": [],
        "meta": {},
        "nodeType": "Location",
        "nodeSubType": "Site",
        "libraryId": 0,
        "refNode": 0,
        "_pStatus": 0,
        "Name": "MSFC"
    },
    {
        "_id": 2,
        "parentNode": 1,
        "display": "4250",
        "tags": [],
        "meta": {},
        "nodeType": "Location",
        "nodeSubType": "Building",
        "libraryId": 0,
        "refNode": 0,
        "_pStatus": 0,
        "Name": "4250"
    },
    {
        "_id": 3,
        "parentNode": 2,
        "display": "Room 58",
        "tags": [],
        "meta": {},
        "nodeType": "Location",
        "nodeSubType": "Room",
        "libraryId": 0,
        "refNode": 0,
        "_pStatus": 0,
        "Name": "Room 58"
    },
    {
        "parentNode": 3,
        "display": "Temperature",
        "tags": [],
        "meta": {},
        "nodeType": "Point",
        "nodeSubType": "",
        "libraryId": 0,
        "refNode": 0,
        "Name": "4250_MSFC_Room 58_Temperature",
        "_id": 9215,
        "Security": [

        ],
        "_pStatus": 0,
        "_pAccess": 0,
        "_cfgRequired": true,
        "_cfgDevice": false,
        "_forceAllCOV": false,
        "_relDevice": 129,
        "_relRMU": 0,
        "_relPoint": 0,
        "_updPoint": false,
        "_updTOD": false,
        "_pollTime": 0,
        "_devModel": 19,
        "_rmuModel": 0,
        "_parentUpi": 0,
        "_actvAlmId": ObjectId("000000000000000000000000"),
        "Alarm Messages": [{
                "msgType": 17,
                "msgId": ObjectId("592412c731f4a3a7587dff2b"),
                "ack": false,
                "notify": false
            },
            {
                "msgType": 2,
                "msgId": ObjectId("592412c731f4a3a7587dff1b"),
                "ack": false,
                "notify": false
            },
            {
                "msgType": 4,
                "msgId": ObjectId("592412c731f4a3a7587dff1d"),
                "ack": false,
                "notify": false
            },
            {
                "msgType": 3,
                "msgId": ObjectId("592412c731f4a3a7587dff1c"),
                "ack": false,
                "notify": false
            },
            {
                "msgType": 48,
                "msgId": ObjectId("592412c731f4a3a7587dff41"),
                "ack": false,
                "notify": false
            },
            {
                "msgType": 47,
                "msgId": ObjectId("592412c731f4a3a7587dff40"),
                "ack": false,
                "notify": false
            }
        ],
        "Input Type": {
            "ValueType": 5,
            "Value": "20 mA LP",
            "eValue": 4,
            "ValueOptions": {
                "Resistance": 0,
                "5 Volt": 1,
                "10 Volt": 2,
                "20 mA SP": 3,
                "20 mA LP": 4,
                "Rate Input": 5
            },
            "isDisplayable": true,
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
            "Value": 9.5,
            "isDisplayable": true,
            "isReadOnly": true
        },
        "Conversion Coefficient 2": {
            "ValueType": 1,
            "Value": 5.625,
            "isDisplayable": true,
            "isReadOnly": true
        },
        "Conversion Coefficient 3": {
            "ValueType": 1,
            "Value": 0,
            "isDisplayable": false,
            "isReadOnly": true
        },
        "Conversion Coefficient 4": {
            "ValueType": 1,
            "Value": 0,
            "isDisplayable": false,
            "isReadOnly": true
        },
        "Conversion Type": {
            "ValueType": 5,
            "Value": "Linear",
            "eValue": 1,
            "isDisplayable": true,
            "isReadOnly": true
        },
        "Alarm Deadband": {
            "ValueType": 1,
            "Value": 3,
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
            "Value": 7,
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
            "Value": 90,
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
            "Value": 50,
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
            "Value": 122,
            "isDisplayable": true,
            "isReadOnly": false
        },
        "Minimum Value": {
            "ValueType": 1,
            "Value": 32,
            "isDisplayable": true,
            "isReadOnly": false
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
            "ValueType": 5,
            "Value": "7",
            "eValue": 7,
            "isDisplayable": true,
            "isReadOnly": false,
            "ValueOptions": {
                "1": 1,
                "2": 2,
                "3": 3,
                "4": 4,
                "5": 5,
                "6": 6,
                "7": 7,
                "8": 8,
                "9": 9,
                "10": 10,
                "11": 11,
                "12": 12,
                "13": 13,
                "14": 14,
                "15": 15,
                "16": 16
            }
        },
        "COV Enable": {
            "ValueType": 7,
            "Value": true,
            "isDisplayable": true,
            "isReadOnly": false
        },
        "COV Increment": {
            "ValueType": 1,
            "Value": 1,
            "isDisplayable": true,
            "isReadOnly": false
        },
        "Poll Register": {
            "ValueType": 4,
            "Value": 7,
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
        "Last Report Time": {
            "ValueType": 11,
            "Value": 1495026622,
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
        "Modbus Order": {
            "ValueType": 5,
            "Value": "Swap Both",
            "eValue": 3,
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
            "Value": 72.727783203125,
            "isDisplayable": true,
            "isReadOnly": true,
            "oosValue": 72.727783203125
        },
        "Quality Code Enable": {
            "ValueType": 18,
            "Value": 255,
            "isDisplayable": true,
            "isReadOnly": false
        },
        "Read Only": {
            "ValueType": 7,
            "Value": false,
            "isDisplayable": false,
            "isReadOnly": false
        },
        "Reliability": {
            "ValueType": 5,
            "Value": "Stop Scan",
            "eValue": 129,
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
        "Status Flags": {
            "ValueType": 18,
            "Value": 0,
            "isDisplayable": true,
            "isReadOnly": true
        },
        "Trend COV Increment": {
            "ValueType": 1,
            "Value": 1,
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
            "Value": false,
            "isDisplayable": true,
            "isReadOnly": false
        },
        "Trend Samples": {
            "ValueType": 4,
            "Value": 255,
            "isDisplayable": true,
            "isReadOnly": false
        },
        "Remarks": {
            "ValueType": 2,
            "Value": "",
            "isDisplayable": true,
            "isReadOnly": false
        },
        "Description": {
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
        "Point Refs": [{
                "PropertyName": "Device Point",
                "PropertyEnum": 139,
                "Value": 36700264,
                "AppIndex": 0,
                "isDisplayable": true,
                "isReadOnly": false,
                "PointName": "4250_UNV01",
                "PointInst": 36700264,
                "DevInst": 36700264,
                "PointType": 8
            },
            {
                "PropertyName": "Remote Unit Point",
                "PropertyEnum": 152,
                "Value": 0,
                "AppIndex": 0,
                "isDisplayable": true,
                "isReadOnly": false,
                "PointName": "",
                "PointInst": 0,
                "DevInst": 0,
                "PointType": 0
            },
            {
                "PropertyName": "Sensor Point",
                "PropertyEnum": 154,
                "Value": 859832448,
                "AppIndex": 0,
                "isDisplayable": true,
                "isReadOnly": false,
                "PointName": "Sensor_MS5(32to122",
                "PointInst": 859832448,
                "DevInst": 0,
                "PointType": 205
            },
            {
                "PropertyName": "Alarm Adjust Point",
                "PropertyEnum": 136,
                "Value": 0,
                "AppIndex": 0,
                "isDisplayable": true,
                "isReadOnly": false,
                "PointName": "",
                "PointInst": 0,
                "DevInst": 0,
                "PointType": 0
            },
            {
                "PropertyName": "Alarm Display Point",
                "PropertyEnum": 137,
                "Value": 0,
                "AppIndex": 0,
                "isDisplayable": true,
                "isReadOnly": false,
                "PointName": "",
                "PointInst": 0,
                "DevInst": 0,
                "PointType": 0
            },
            {
                "PropertyName": "Interlock Point",
                "PropertyEnum": 148,
                "Value": 0,
                "AppIndex": 0,
                "isDisplayable": true,
                "isReadOnly": false,
                "PointName": "",
                "PointInst": 0,
                "DevInst": 0,
                "PointType": 0
            }
        ],
        "_Name": "4250_ah5_sptz2",
        "Notify Policies": [

        ],
        "Broadcast Period": {
            "isDisplayable": false,
            "isReadOnly": false,
            "ValueType": 13,
            "Value": 15
        },
        "Trend Last Status": {
            "isDisplayable": false,
            "isReadOnly": true,
            "ValueType": 18,
            "Value": 0
        },
        "Trend Last Value": {
            "isDisplayable": false,
            "isReadOnly": true,
            "ValueType": 1,
            "Value": 0
        },
        "_oldUpi": 72247

    }
]

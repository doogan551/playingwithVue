module.exports = {

	// var conn = 'mongodb://192.168.1.88/infoscan_test';
	// conn: 'mongodb://192.168.1.88/infoscan',
	//var conn = 'mongodb://RANDYC/infoscan';
	//var conn = 'mongodb://10.250.0.10/infoscan';
	//var conn = 'mongodb://ROBERT4/infoscan';
	// conn: 'mongodb://localhost/infoscan',
	conn: 'mongodb://localhost/infoscan',
	xmlPath: "//192.168.1.88/D$/InfoAdmin/MSFC GPL/XML",
	// xmlPath: "C:/Users/rob/Documents/MSFC_GPL/MSFC_GPL",
	ctrlrs: {
		"Name": "Controllers",
		"Entries": [{
			"Controller ID": 2,
			"Controller Name": "OSS",
			"Description": "Optimized Start / Stop",
			"isUser": false
		}, {
			"Controller ID": 3,
			"Controller Name": "HostTOD",
			"Description": "Host Based Time of Day",
			"isUser": false
		}, {
			"Controller ID": 4,
			"Controller Name": "CPC",
			"Description": "Continuous Process Control",
			"isUser": false
		}, {
			"Controller ID": 5,
			"Controller Name": "NWS",
			"Description": "Night / Weekend Setback",
			"isUser": false
		}, {
			"Controller ID": 6,
			"Controller Name": "RemTOD",
			"Description": "Remote Time-of-Day controller",
			"isUser": false
		}, {
			"Controller ID": 12,
			"Controller Name": "TempTOD",
			"Description": "Temporary Time of Day",
			"isUser": false
		}, {
			"Controller ID": 18,
			"Controller Name": "VAV",
			"Description": "Variable Air Volume Control",
			"isUser": false
		}, {
			"Controller ID": 19,
			"Controller Name": "D-CYCLE",
			"Description": "DUTY CYCLE",
			"isUser": false
		}, {
			"Controller ID": 20,
			"Controller Name": "DSL",
			"Description": "Dorsett Script Language",
			"isUser": false
		}, {
			"Controller ID": 29,
			"Controller Name": "OSS/NWS",
			"Description": "Optimized Start Stop / Night Weekend Setback",
			"isUser": false
		}, {
			"Controller ID": 33,
			"Controller Name": "GPL",
			"Description": "Graphical Programming Language",
			"isUser": false
		}]
	},
	defaultUser: {
		"Auto Logout Duration": {
			"Value": 0
		},
		"Contact Info": {
			"Value": [{
				"Type": "Home",
				"Value": "(336) 469-1234"
			}, {
				"Type": "Mobile",
				"Value": "(336) 469-5678"
			}, {
				"Type": "Email",
				"Value": "johndoe@dorsett-tech.com"
			}, {
				"Type": "Pager",
				"Value": "(336) 469-1245"
			}]
		},
		"Description": {
			"Value": ""
		},
		"First Name": {
			"Value": "John"
		},
		"Last Activity Time": {
			"Value": 0
		},
		"Last Login Time": {
			"Value": 0
		},
		"Last Name": {
			"Value": "Doe"
		},
		"Password": {
			"Value": "$2a$10$kXPCe68hNnuTtMRsHpm2F.wnxoWvyAaiRFLhSqoGgG/Wyu3kP4NEG"
		},
		"Password Reset": {
			"Value": false
		},
		"Photo": {
			"Value": "JohnnyRoberts.jpg"
		},
		"System Admin": {
			"Value": true
		},
		"Title": {
			"Value": "user1's title"
		},
		"username": "user1"
	},
	cannedReports: [{
		"_id": 1,
		"Name": "Point Involvement",
		"Report Type": {
			"isDisplayable": true,
			"isReadOnly": true,
			"ValueType": 5,
			"Value": "Point Involvement",
			"eValue": "0"
		}
	}],
	reportTemplates: [{
		"Name": "Point Involvement",
		"Template": "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",
		"Type": 2
	}, {
		"Name": "Point Involvement With Condition",
		"Template": "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",
		"Type": 2
	}, {
		"Name": "Point Involvement Sorting by Property",
		"Template": "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",
		"Type": 2
	}],
	reportGuide: {
		"Report Config": {
			"reportType": "History",
			"reportTitle": "a_ghdrh",
			"reportTemplate": "",
			"includeFilter": false,
			"includeReportName": false,
			"returnLimit": "0",
			"interval": "1",
			"offset": "6",
			"dataSources": {
				"History": {
					"columns": [{
						"colName": "Date",
						"valueType": "DateTime",
						"upi": "0"
					}],
					"filterMode": "And",
					"filterOn": false,
					"groups": [],
					"sort": [],
					"totals": {},
					"filters": {
						"0": {
							"column": "Start_Date",
							"condition": "EqualTo",
							"dataType": "Numeric",
							"value1": "1430242902",
							"value2": "",
							"fieldIs": "Value",
							"expression": "",
							"valueList": "",
							"value3": "4/28/2015 1:41 PM"
						},
						"1": {
							"column": "End_Date",
							"condition": "EqualTo",
							"dataType": "Numeric",
							"value1": "1430242902",
							"value2": "",
							"fieldIs": "Value",
							"expression": "",
							"valueList": "",
							"value3": "4/28/2015 1:41 PM"
						}
					}
				}
			},
			"reportOptions": {
				"componentType": "Data",
				"dataSourcesOrder": [
					"History"
				],
				"language": "C",
				"orientation": "Portrait",
				"relations": {},
				"theme": "Green_50",
				"unit": "in"
			}
		},
		"Filter Data": [{
			"filterName": "Start Date",
			"operator": "EqualTo",
			"value": 1430242901800.0000000000000000,
			"valueType": "DateTime"
		}, {
			"filterName": "End Date",
			"operator": "EqualTo",
			"value": 1430242901801.0000000000000000,
			"valueType": "DateTime"
		}]
	},
	timeZones: {
		"Name": "Time Zones",
		"Entries": [{
			"enum": 5,
			"name": "Eastern Time Zone",
			"utc offset": 18000,
			"dst used": true,
			"abbreviation": "EST"
		}, {
			"name": "Central Time Zone",
			"enum": 6,
			"utc offset": 21600,
			"dst used": true,
			"abbreviation": "CST"
		}, {
			"name": "Mountain Time Zone",
			"enum": 7,
			"utc offset": 25200,
			"dst used": true,
			"abbreviation": "MST"
		}, {
			"name": "Pacific Time Zone",
			"enum": 8,
			"utc offset": 28800,
			"dst used": true,
			"abbreviation": "PST"
		}, {
			"name": "Alaska Time Zone",
			"enum": 9,
			"utc offset": 32400,
			"dst used": true,
			"abbreviation": "AKST"
		}, {
			"name": "Arizona Time Zone, No DST",
			"enum": 107,
			"utc offset": 25200,
			"dst used": false,
			"abbreviation": "AZ"
		}, {
			"name": "Hawaii Time Zone, No DST",
			"enum": 109,
			"utc offset": 32400,
			"dst used": false,
			"abbreviation": "HI"
		}]
	}
};
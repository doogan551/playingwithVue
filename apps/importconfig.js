module.exports = {

	// var conn = 'mongodb://192.168.1.88/infoscan_test';
	// conn: 'mongodb://192.168.1.88/infoscan',
	//var conn = 'mongodb://RANDYC/infoscan';
	//var conn = 'mongodb://10.250.0.10/infoscan';
	//var conn = 'mongodb://ROBERT4/infoscan';
	// conn: 'mongodb://localhost/infoscan',
	// xmlPath: "F:/import/msfc/GPLConvert",
	xmlPath: "C:/",
	// xmlPath: "//192.168.1.88/d$/InfoAdmin/MSFC GPL/XML",
	ctrlrs: {
		"Name": "Controllers",
		"Entries": []
	},
	reportGuide: {
		"Report Config": {
			"columns": [{
				"colName": "Date",
				"valueType": "DateTime",
				"operator": "",
				"calculation": "",
				"canCalculate": false,
				"precision": 0,
				"upi": 0,
				"Appindex": -1,
				"colDisplayName": "Date",
				"canBeCharted": false,
				"includeInChart": false,
				"multiplier": 1
			}],
			"filters": [],
			"pointFilter": {
				"name1": "",
				"name2": "",
				"name3": "",
				"name4": "",
				"selectedPointTypes": []
			},
			"returnLimit": 2000,
			"interval": {
				"text": "Day",
				"value": 1
			},
			"duration": {
				"startDate": 0, // default values here are "today - 1"
				"endDate": 0, // default of "tomorrow"
				"startTimeOffSet": "00:00",
				"endTimeOffSet": "00:00",
				"duration": 0.0,
				"selectedRange": "Today"
			},
			"selectedPageLength": 48,
			"selectedChartType": "Line"
		}
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
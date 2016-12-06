function Manager() {
	var self = this,
		_propertyList = [],
		defaultCollections = ["Properties", "Point Types"],
		sortArray = function (theArray, key) {
			theArray.sort(function (a, b) {
				var alc,
					blc,
					dir = self.sortAscending() ? 1 : -1;

				if (typeof a[key] === "string") {
					alc = a[key].toLowerCase();
					blc = b[key].toLowerCase();
						
					if (alc === blc) return 0;
					else if (alc > blc) return dir;
					else return dir * (-1);
				} else {
					if (dir === 1) return (a[key] - b[key]);
					else return (b[key] - a[key]);
				}
			});
		},
		buildEnumsList = function (list) {
			var key,
				enabled;

			for (key in Config.Enums) {
				enabled = defaultCollections.indexOf(key) > -1 ? true : false;
				
				list.push({
					name: key,
					isEnabled: ko.observable(enabled)
				});
			}
		},
		buildPropertyList = function (list, all) {
			var enumSet,
				propertyName;

			for (enumSet in Config.Enums) {
				if (!all && defaultCollections.indexOf(enumSet) < 0) continue; 
				for (propertyName in Config.Enums[enumSet]) {
					list.push({
						enumSet: enumSet,
						propertyName: propertyName,
						enum: Config.Enums[enumSet][propertyName].enum
					});
				}
			}
		},
		removeFromList = function (theArray, key, value) {
			theArray.remove(function (item) {
				return item[key] === value;
			});
		},
		addToPropertyList = function (key, value) {
			var tempArray = _propertyList.filter(function (item) {
				return item[key] === value;
			});

			for (var i = 0, len = tempArray.length; i < len; i++) {
				self.propertyList().push(tempArray[i]);
			}
			// The caller must call the self.propertyList.valueHasMutated() to notify subscribers
		},
		inspectEnumCollection = function (data) {
			var key,
				value,
				lastValue,
				expectedValue,
				usedEnums = [],
				usedNames = [],
				enumsCollection = Config.Enums[data.collection];

			for (key in enumsCollection) {
				value = enumsCollection[key].enum;

				if (value < data.minimum()) data.minimum(value);
				else if (value > data.maximum()) data.maximum(value);

				if (usedEnums.indexOf(value) > -1) data.duplicateEnums.push(value);
				else usedEnums.push(value);

				if (usedNames.indexOf(key) > -1) data.duplicateNames.push(key);
				else usedNames.push(key);
			}

			usedEnums.sort(function (a,b) {
				return a > b ? 1:-1;
			});
			expectedValue = usedEnums[0];
			usedEnums.forEach(function (value, index) {
				var nextValue = usedEnums[index+1];

				// We check value bigger than expected so we don't flag duplicates as holes
				if ((value !== expectedValue) && (value > expectedValue)) {
					while(expectedValue < nextValue) {
						data.holes.push(expectedValue++);
					}
				} else if (value !== lastValue) { // If this value is different from our last one, i.e. it's not a duplicate
					expectedValue++;
				}
				lastValue = value;
			});
		};

	self.sortColumn = ko.observable('enumSet');
	self.sortAscending = ko.observable(true);

	self.generateFileBusy  = ko.observable(false);
	self.generateFileError = ko.observable(false);
	self.generateFileMsg   = ko.observable('');

	self.propertyList = ko.observableArray().extend({rateLimit: 10});
	self.enumsList = ko.observableArray([]);

	self.enumSetFilter = ko.observable('').extend({rateLimit: 100});
	self.propertyNameFilter = ko.observable('').extend({rateLimit: 100});
	self.enumFilter = ko.observable('').extend({rateLimit: 100});

	self.propertyEnumData = {
		collection: "Properties",
		duplicateEnums: ko.observableArray([]),
		duplicateNames: ko.observableArray([]),
		holes: ko.observableArray([]),
		minimum: ko.observable(999999999),
		maximum: ko.observable(0)
	};

	self.pointTypeEnumData = {
		collection: "Point Types",
		duplicateEnums: ko.observableArray([]),
		duplicateNames: ko.observableArray([]),
		holes: ko.observableArray([]),
		minimum: ko.observable(999999999),
		maximum: ko.observable(0)
	};

	// data {
	//     name: property name
	//     isEnabled: true/false
	// }
	self.toggleOption = function (data) {
		data.isEnabled(!data.isEnabled());
		
		if (data.isEnabled()) {
			// Add enumSet to propertyList
			addToPropertyList("enumSet", data.name);
			sortArray(self.propertyList, self.sortColumn());
			self.propertyList.valueHasMutated();
		} else {
			// Remove enumSet from propertyList
			removeFromList(self.propertyList, "enumSet", data.name);
		}
	};

	self.toggleSort = function (column) {
		var sortColumn = self.sortColumn();

		if (column === sortColumn) {
			self.sortAscending(!self.sortAscending());
		} else {
			self.sortAscending(true);
			self.sortColumn(column);
		}
		sortArray(self.propertyList, self.sortColumn());
	};

	// data {
	//     name: property name
	//     isEnabled: true/false
	// }
	self.toggleOtherOptions = function (data) {
		var i,
			list = self.enumsList(),
			len = list.length,
			toState = self.allEnumsEnabled() ? false : true;

		// Enable the option right-clicked
		if (!data.isEnabled()) {
			data.isEnabled(true);
			toState = false;
			// Add enumSet to propertyList
			addToPropertyList("enumSet", data.name);
		}

		for (i = 0; i < len; i++) {
			var item = list[i];

			if (item.name !== data.name) {
				if (toState !== item.isEnabled()) {
					if (toState === true) {
						// Add enumSet to propertyList
						addToPropertyList("enumSet", item.name);
					} else {
						// Remove enumSet from propertyList
						removeFromList(self.propertyList, "enumSet", item.name);
					}
				}
				item.isEnabled(toState);
			}
		}
		
		if (toState === true) {
			sortArray(self.propertyList, self.sortColumn());
			self.propertyList.valueHasMutated();
		}
	};

	self.generateCppHeaderFile = function () {
		self.generateFileBusy(true);
		self.generateFileMsg('');

		$.ajax({
			type: "POST",
			url: "/toolbag/generateCppHeaderFile"
		})
		.done(function (rxData) {
			console.log('Received response', rxData, new Date());
			
			self.generateFileBusy(false);
			if (rxData.result) {
				self.generateFileMsg("<a href='/toolbag/downloadCppHeaderFile'>" + rxData.filename + " generated successfully.  Click to download.</a>");
			} else {
				self.generateFileError(true);
				self.generateFileMsg("An error occurred: " + rxData.err);
			}
		})
		.fail(function (error) {
			self.generateFileBusy(false);
			self.generateFileError(true);
			self.generateFileMsg('An unexpected error occurred.');
		});
	};

	self.allEnumsEnabled = ko.computed(function () {
		var i,
			list = self.enumsList(),
			len = list.length;

		for (i = 0; i < len; i++) {
			if (list[i].isEnabled() === false)
				return false;
		}
		return true;
	}).extend({rateLimit: 10});

	self.filteredPropertyList = ko.computed(function () {
		var propertyList = self.propertyList(),
			enumSetFilter = self.enumSetFilter(),
			propertyNameFilter = self.propertyNameFilter(),
			enumFilter = parseInt(self.enumFilter(), 10);
			
		return ko.utils.arrayFilter(propertyList, function (item) {
			return ((item.enumSet.toLowerCase().indexOf(enumSetFilter.toLowerCase()) > -1) &&
					(item.propertyName.toLowerCase().indexOf(propertyNameFilter.toLowerCase()) > -1) &&
					(isNaN(enumFilter) ? true : (item.enum === enumFilter)));
		});
	});

	buildEnumsList(self.enumsList);
	buildPropertyList(_propertyList, true);
	buildPropertyList(self.propertyList, false);

	sortArray(self.enumsList, "name");
	sortArray(self.propertyList, self.sortColumn());

	inspectEnumCollection(self.propertyEnumData);
	inspectEnumCollection(self.pointTypeEnumData);
}

$(function () {
	window.manager = new Manager();
	ko.applyBindings(window.manager);
});

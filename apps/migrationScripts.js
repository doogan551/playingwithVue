var async = require('async');
var utility = require('../models/utility');
var db = require('../helpers/db');
var config = require('config');
var logger = require('../helpers/logger')(module);

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName].join('');

var scripts = {
	// 0.3.10 - TOU Phase 2 - updates committed bills by adding the rate element properties from rate table to the committed bills
	updateCommittedBills: function (callback) {
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			results = [],
			findBillCollection = function (bill, collectionName) {
				var collections = bill.collections,
					len = collections.length,
					i;
				for (i = 0; i < len; i++) {
					if (collections[i].name === collectionName)
						return collections[i];
				}
			},
			findBillRow = function (collection, rowName) {
				var rows = collection.rows,
					len = rows.length,
					i;
				for (i = 0; i < len; i++) {
					if (rows[i].name.displayValue === rowName)
						return rows[i];
				}
			},
			processRateTable = function (rateTable, touUtility) {
				var changes = {},
					title,
					collection,
					collectionName,
					period,
					date,
					end,
					season,
					billCollection,
					billRow,
					rateName,
					i, len,
					j, jlen;

				for (collectionName in rateTable) {
					collection = rateTable[collectionName];
					cnt = 0;

					if (!collection.periods) {
						continue;
					}

					for (i = 0, len = collection.periods.length; i < len; i++) {
						period = collection.periods[i];
						date = new Date(period.start.date);
						end = new Date(period.end.date);
						season = [period.rangeType.charAt(0).toUpperCase(), period.rangeType.slice(1)].join('');
						
						do {
							title = months[date.getMonth()] + ', ' + date.getFullYear();
							committedBill = touUtility.Billing.committedBills[title];
							if (committedBill) {
								for (j = 0, jlen = collection.rates.length; j < jlen; j++) {
									rateName = collection.rates[j].name.replace('{Season}', season);
									billCollection = findBillCollection(committedBill, collectionName);
									if (billCollection) {
										billRow = findBillRow(billCollection, rateName);
										if (billRow && !billRow.rateElement) {
											// Add the rate table's rate element to the billing row
											billRow.rateElement = collection.rates[j];
											
											if (!changes[title]) {
												changes[title] = 0;
											}
											changes[title]++;
										}
									}
								}
							}
							date.setMonth(date.getMonth() + 1);
						} while (date < end);
					}
				}

				if (Object.keys(changes).length) {
					for (title in changes) {
						results.push(changes[title] + ' changes made to "' + title + '"');
					}
				}
			},
			doCallback = function (err, results) {
				callback(null, {
					fn: 'updateCommittedBills',
					errors: err,
					results: results
				});
			};

		utility.get({collection: 'Utilities'}, function (err, utilities) {
			if (err) {
				return doCallback(err);
			}

			async.eachSeries(utilities, function processUtility (touUtility, cb) {
				var criteria = {
						collection: 'Utilities',
						query: {
							_id: touUtility._id
						},
						updateObj: {
							$set: {
								'Billing.committedBills': touUtility.Billing.committedBills
							}
						}
					};

				if (Object.keys(touUtility.Billing.committedBills).length === 0) {
					return cb();
				}
				for (var year in touUtility.PreviousRateTables) {
					processRateTable(touUtility.PreviousRateTables[year], touUtility);
				}
				processRateTable(touUtility.RateTables, touUtility);
				utility.update(criteria, cb);
			}, function allDone (err) {
				return doCallback(err, results);
			});
		});
	}
};

db.connect(connectionString, function (err) {
	if (err) {
		return logger.debug(err);
	}
	// Array of tasks that should be run
	var tasks = [scripts.updateCommittedBills];

	// Each task is provided a callback argument which should be called once the task completes.
	// The task callback should be called with two arguments: err, result

	// If the callback is called with an error, all remaining tasks are skipped and we jump
	// immediatley to our 'done' function. If an error occurs, but it should not stop downstream
	// tasks from running, it should be included in the return result.

	// The result callback should take the following form:
	// {
	//	fn: 'functionName',
	//	errors: null or error(s),
	//	results: null or result(s)
	// }

	async.series(tasks, function done (err, results) {
		if (err) {
			logger.info("Error: ", err);
		}
		logger.info("Results: ", results);
	});
});

// To run from command prompt, run from root infoscan folder as such: 'node apps/migrationScripts.js'
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
	},

    // 0.3.10 - GPL Point Ref PropertyEnum Update.  Updated GPLBlock PropertyEnum to be 439 instead of (placeholder) 0
    updateGPLBlockPointRefEnum: function (callback) {
        utility.iterateCursor({
            collection: 'points',
            query: {'Point Type.Value':'Sequence'}
        }, function processSequence (err, doc, cb) {
            var list = doc['Point Refs'];

            list.forEach(function processPointRefs (ref) {
                if (ref.PropertyName === 'GPLBlock') {
                    ref.PropertyEnum = 439;
                }
            });

            logger.info('updating sequence:', doc._id);

            utility.update({
                collection: 'points',
                query: {
                    _id: doc._id
                },
                updateObj: doc
            }, function updatedSequenceHandler (err) {
                if (err) {
                    logger.debug('Update err:', err);
                }

                cb(null);
            });

        }, function finishUpdatingSequences (err) {
            logger.info('Finished with updateGPLBlockPointRefEnum');
            callback(null, {
                fn: 'updateGPLBlockPointRefEnum',
                errors: err
            });
        });
    },
// 0.3.10 - new Report fields
	updateExistingReports: function (callback) {
		var collection = 'points',
			reportUpdateCounter = 0;

		utility.iterateCursor({
			collection: collection,
			query: {"Point Type.Value": "Report"}
		}, function (err, doc, cb) {
			var reportConfig = doc["Report Config"],
				columns,
				updatedCol = {},
				updatedColumns = [],
				updateDoc = false;

			if (!!reportConfig) {
				columns = (!!reportConfig ? reportConfig.columns : []);
				if (!!columns) {
					for (var i = 0; i < columns.length; i++) {
						updatedCol = columns[i];
						if (updatedCol.multiplier === undefined) {
							updatedCol.multiplier = 1;
							updateDoc = true;
						}
						if (updatedCol.includeInChart === undefined) {
							updatedCol.includeInChart = false;
							updateDoc = true;
						}
						if (updatedCol.yaxisGroup === undefined) {
							updatedCol.yaxisGroup = "A";
							updateDoc = true;
						}
						updatedColumns.push(updatedCol);
					}
					doc["Report Config"].columns = updatedColumns;

					if (updatedColumns.length > 0 && updateDoc) {
						logger.info('updating report:', doc._id);
						utility.update({
							collection: 'points',
							query: {
								_id: doc._id
							},
							updateObj: doc
						}, function (err) {
							if (err) {
								logger.debug('Update err:', err);
							} else {
								reportUpdateCounter++;
							}
							cb(null);
						});
					} else {
						cb(null);
					}
				} else {
					cb(null);
				}
			} else {
				cb(null);
			}
		}, function (err) {
			logger.info('Finished with updateExistingReports updated ' + reportUpdateCounter + ' reports');
			callback(null, {
				fn: 'updateExistingReports',
				errors: err
			});
		});
	}

};


db.connect(connectionString, function (err) {
	if (err) {
		return logger.debug(err);
	}
	// Array of tasks that should be run
    var tasks = [scripts.updateCommittedBills, scripts.updateGPLBlockPointRefEnum, scripts.updateExistingReports];

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

        //added a clean exit for when scripts are done
        process.exit();
	});
});

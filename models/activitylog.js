const Config = require('../public/js/lib/config.js');
const async = require('async');

const Common = require('./common');
const Enums = require('../public/js/lib/config').Enums;
const utils = require('../helpers/utils');

const activityLogCollection = utils.CONSTANTS('activityLogCollection');

const ActivityLog = class ActivityLog extends Common {
    constructor() {
        super(activityLogCollection);
    }

    create(logData, cb) {
        let criteria = {
            insertObj: this.buildActivityLog(logData)
        };
        this.insert(criteria, cb);
    }

    getLogs(data, cb) {
        let pointModel = new Point();
        let currentPage = this.getDefault(data.currentPage, 1);
        let itemsPerPage = this.getDefault(data.itemsPerPage, 200);
        let startDate = this.getDefault(data.startDate, 0);
        let endDate = (this.getNumber(data.endDate) === 0) ? Math.floor(new Date().getTime()) : data.endDate;
        let usernames = data.usernames;

        if (currentPage < 1) {
            currentPage = 1;
        }

        let numberItems = this.getDefault(data.numberItems, itemsPerPage);

        let query = {
            $and: [{
                timestamp: {
                    $gte: startDate
                }
            }, {
                timestamp: {
                    $lte: endDate
                }
            }]
        };

        if (!!data.terms) {
            if (data.terms.length) {
                if (typeof data.terms === 'string') {
                    data.terms = data.terms.split(" ");
                }

                query.path = {
                    $all: pointModel.buildSearchTerms(data.terms)
                };
            }
        }

        /** @type {Array} Point Type enums */
        if (data.pointTypes) {
            if (data.pointTypes.length > 0) {
                query.pointType = {
                    $in: data.pointTypes
                };
            }
        }

        if (!!usernames && usernames.length > 0) {
            query.username = {
                $in: usernames
            };
        }

        let sort = {
            timestamp: this.getSort(data.sort)
        };
        let skip = (currentPage - 1) * itemsPerPage;
        let criteria = {
            query: query,
            sort: sort,
            _skip: skip,
            _limit: numberItems,
            data: data
        };
        this.getWithSecurity(criteria, cb);
    }

    // newupdate
    doActivityLogs(generateActivityLog, logs, callback) {
        if (generateActivityLog) {
            async.each(logs, (log, cb) => {
                this.create(log, cb);
            }, callback);
        } else {
            return callback(null);
        }
    }

    buildActivityLog(data) {
        let log = {
            userId: data.user._id,
            username: data.user.username,
            upi: 0,
            path: [],
            pointType: null,
            activity: Enums['Activity Logs'][data.activity].enum,
            timestamp: data.timestamp || Date.now(),
            Security: [],
            log: data.log
        };
        let propertyChange = {
            property: '',
            valueType: 0,
            oldValue: {
                Value: 0,
                eValue: 0
            },
            newValue: {
                Value: 0,
                eValue: 0
            }
        };

        if (!!data.point) {
            log.upi = (data.point._id !== undefined) ? data.point._id : '';
            log.pointType = (data.point['Point Type'].eValue !== undefined) ? data.point['Point Type'].eValue : null;
            if (data.point.path !== undefined && data.point.path !== null) {
                log.path = data.point.path;
            }
        }

        if ((log.activity === 1 || log.activity === 2)) {
            if (data.oldValue !== undefined) {
                propertyChange.oldValue = data.oldValue;
            } else {
                delete propertyChange.oldValue;
            }
            propertyChange.property = data.prop;
            propertyChange.newValue = data.newValue;
            if (!!data.point[data.prop] && !!data.point[data.prop].ValueType) {
                propertyChange.valueType = data.point[data.prop].ValueType;
            }

            log.propertyChanges = propertyChange;
        }

        return log;
    }
};

module.exports = ActivityLog;
const Point = require('./point');
const Utility = require('../models/utility');
const utils = require('../helpers/utils');
const activityLogCollection = utils.CONSTANTS('activityLogCollection');

const Model = require('../models/model');

let ActivityLog = class ActivityLog extends Model {
    constructor() {
        super();
        this.collection = activityLogCollection;
    }

    getOne(criteria, cb) {
        this.assignObjects(criteria, {
            collection: this.collection
        });
        Utility.getOne(criteria, cb);
    }

    create(logData, cb) {
        let criteria = {
            collection: this.collection,
            insertObj: logData
        };
        Utility.insert(criteria, cb);
    }

    addNamesToQuery(data, query, segment) {
        if (!!data.hasOwnProperty(segment)) {
            if (data[segment] !== null) {
                query[segment] = new RegExp('^' + data[segment], 'i');
            } else {
                query[segment] = '';
            }
        } else {
            query[segment] = '';
        }
    }

    get(data, cb) {
        /** @type {Number} Current page of log window. Used to skip in mongo */
        let currentPage = parseInt(data.currentPage, 10);
        /** @type {Number} How many logs are being shown in window. Used to skip in mongo */
        let itemsPerPage = parseInt(data.itemsPerPage, 10);
        let startDate = (typeof parseInt(data.startDate, 10) === 'number') ? data.startDate : 0;
        let endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime()) : data.endDate;
        /** @type {Number} Usernames associated with logs (not logged in user) */
        let usernames = data.usernames;

        if (!itemsPerPage) {
            itemsPerPage = 200;
        }
        if (!currentPage || currentPage < 1) {
            currentPage = 1;
        }

        /** @type {Number} I don't remember what this is for, but it overrides itemsPerPage if it exists */
        let numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

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

        this.addNamesToQuery(data, query, 'name1');
        this.addNamesToQuery(data, query, 'name2');
        this.addNamesToQuery(data, query, 'name3');
        this.addNamesToQuery(data, query, 'name4');

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
            timestamp: (data.sort !== 'desc') ? -1 : 1
        };
        let skip = (currentPage - 1) * itemsPerPage;
        let criteria = {
            query: query,
            collection: activityLogCollection,
            sort: sort,
            _skip: skip,
            _limit: numberItems,
            data: data
        };
        Utility.getWithSecurity(criteria, cb);
    }
};

module.exports = ActivityLog;

const Common = require('./common');

const ActiveAlarm = class ActiveAlarm extends Common {

    constructor() {
        super('ActiveAlarm');
    }

    getActiveAlarms(data, callback) {
        let currentPage, itemsPerPage, numberItems, startDate, endDate, query, sort;

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        currentPage = parseInt(data.currentPage, 10);
        itemsPerPage = parseInt(data.itemsPerPage, 10);
        startDate = (typeof parseInt(data.startDate, 10) === 'number') ? data.startDate : 0;
        endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;

        sort = {};

        if (!itemsPerPage) {
            itemsPerPage = 200;
        }
        if (!currentPage || currentPage < 1) {
            currentPage = 1;
        }

        numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

        query = {
            $and: [{
                msgTime: {
                    $gte: startDate
                }
            }, {
                msgTime: {
                    $lte: endDate
                }
            }]
        };

        if (data.name1 !== undefined) {
            if (data.name1 !== null) {
                query.Name1 = new RegExp('^' + data.name1, 'i');
            } else {
                query.Name1 = '';
            }
        }
        if (data.name2 !== undefined) {
            if (data.name2 !== null) {
                query.Name2 = new RegExp('^' + data.name2, 'i');
            } else {
                query.Name2 = '';
            }
        }
        if (data.name3 !== undefined) {
            if (data.name3 !== null) {
                query.Name3 = new RegExp('^' + data.name3, 'i');
            } else {
                query.Name3 = '';
            }
        }
        if (data.name4 !== undefined) {
            if (data.name4 !== null) {
                query.Name4 = new RegExp('^' + data.name4, 'i');
            } else {
                query.Name4 = '';
            }
        }
        if (data.msgCat) {
            query.msgCat = {
                $in: data.msgCat
            };
        }
        if (data.almClass) {
            query.almClass = {
                $in: data.almClass
            };
        }

        if (data.pointTypes) {
            query.PointType = {
                $in: data.pointTypes
            };
        }

        sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

        this.getWithSecurity({
            query: query,
            sort: sort,
            _skip: (currentPage - 1) * itemsPerPage,
            _limit: numberItems,
            data: data
        }, (err, alarms, count) => {
            callback(err, alarms, count);
        });
    }
};

module.exports = ActiveAlarm;

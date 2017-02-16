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
        currentPage = this.getDefault(data.currentPage, 1);
        itemsPerPage = this.getDefault(data.itemsPerPage, 200);
        startDate = this.getDefault(data.startDate, 0);
        endDate = (this.getInt(data.endDate) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;

        sort = {};

        if (currentPage < 1) {
            currentPage = 1;
        }

        numberItems = this.getDefault(data.numberItems, itemsPerPage);

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

        this.addNamesToQuery(data, query, 'name1', 'Name1');
        this.addNamesToQuery(data, query, 'name2', 'Name2');
        this.addNamesToQuery(data, query, 'name3', 'Name3');
        this.addNamesToQuery(data, query, 'name4', 'Name4');

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
        }, callback);
    }
};

module.exports = ActiveAlarm;

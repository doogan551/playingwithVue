const Common = require('./common');

const ActiveAlarm = class ActiveAlarm extends Common {

    constructor() {
        super('ActiveAlarms');
    }

    getActiveAlarms(data, callback) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        let alarmQuery = this.buildAlarmQuery(data, 'Active');

        this.getWithSecurity({
            query: alarmQuery.query,
            sort: alarmQuery.sort,
            _skip: alarmQuery.skip,
            _limit: alarmQuery.numberItems,
            data: data
        }, callback);
    }
};

module.exports = ActiveAlarm;

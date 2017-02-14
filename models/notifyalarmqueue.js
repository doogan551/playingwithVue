const Common = new(require('./common'))();

const NotifyAlarmQueue = class NotifyAlarmQueue extends Common {

    constructor() {
        super('NotifyAlarmQueue');
    }
};

module.exports = NotifyAlarmQueue;

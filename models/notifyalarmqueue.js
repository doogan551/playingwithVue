const Common = new(require('./common'))();

let NotifyAlarmQueue = class NotifyAlarmQueue extends Common {

    constructor() {
        super('NotifyAlarmQueue');
    }
};

module.exports = NotifyAlarmQueue;

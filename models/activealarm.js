const Common = new(require('./common'))();

const ActiveAlarm = class ActiveAlarm extends Common {

    constructor() {
        super('ActiveAlarm');
    }
};

module.exports = ActiveAlarm;

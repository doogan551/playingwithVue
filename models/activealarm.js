let Common = new(require('./common'))();

let ActiveAlarm = class ActiveAlarm extends Common {

    constructor() {
        super('ActiveAlarm');
    }
};

module.exports = ActiveAlarm;

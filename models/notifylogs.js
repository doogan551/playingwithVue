const Common = new(require('./common'))();

let NotifyLogs = class NotifyLogs extends Common {

    constructor() {
        super('NotifyLogs');
    }
};

module.exports = NotifyLogs;

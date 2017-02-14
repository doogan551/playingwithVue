const Common = new(require('./common'))();

const NotifyLogs = class NotifyLogs extends Common {

    constructor() {
        super('NotifyLogs');
    }
};

module.exports = NotifyLogs;

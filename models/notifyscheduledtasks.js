const Common = new(require('./common'))();

let NotifyScheduledTasks = class NotifyScheduledTasks extends Common {

    constructor() {
        super('NotifyScheduledTasks');
    }
};

module.exports = NotifyScheduledTasks;

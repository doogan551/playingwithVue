const Common = new(require('./common'))();

const NotifyScheduledTasks = class NotifyScheduledTasks extends Common {

    constructor() {
        super('NotifyScheduledTasks');
    }
};

module.exports = NotifyScheduledTasks;

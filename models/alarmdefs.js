const Common = new(require('./common'))();

const AlarmDefs = class AlarmDefs extends Common {

    constructor() {
        super('AlarmDefs');
    }
    getSystemAlarms(cb) {
        let criteria = {
            query: {
                isSystemMessage: true
            }
        };
        AlarmDefs.get(criteria, (err, data) => {
            if (err) {
                return cb(err.message);
            }

            let entries = data;
            return cb(null, entries);
        });
    }
};

module.exports = AlarmDefs;

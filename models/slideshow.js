var Utility = require('../models/utility');

module.exports = {

    getYear: function(data, cb) {
        upi = parseInt(data.id, 10);

        Utility.getOne({
            collection: 'points',
            query: {
                _id: upi
            },
            fields: {
                Slides: 1,
                "Close On Complete.Value": 1,
                "Continuous Show.Value": 1,
                "Maximize Displays.Value": 1,
                "Repeat Count.Value": 1,
                name1: 1,
                name2: 1,
                name3: 1,
                name4: 1
            }
        }, cb);
    }
};
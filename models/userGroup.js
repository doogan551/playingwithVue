let Utility = require('../models/utility');

exports.getGroupsWithUser = function (userid, cb) {
    let query = {};
    query['Users.' + userid] = {
        $exists: 1
    };

    let criteria = {
        collection: 'User Groups',
        query: query
    };
    Utility.get(criteria, cb);
};

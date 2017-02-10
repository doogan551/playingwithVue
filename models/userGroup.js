let Utility = require('../models/utility');

let UserGroups = class UserGroups {
    getGroupsWithUser(userid, cb) {
        let query = {};
        query['Users.' + userid] = {
            $exists: 1
        };

        let criteria = {
            collection: 'User Groups',
            query: query
        };
        Utility.get(criteria, cb);
    }
};

module.exports = UserGroups;

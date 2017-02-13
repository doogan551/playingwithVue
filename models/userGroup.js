let Utility = require('../models/utility');

let UserGroups = class UserGroups {
    constructor() {
        this.collection = 'User Groups';
    }
    getGroupsWithUser(userid, cb) {
        let query = {};
        query['Users.' + userid] = {
            $exists: 1
        };

        let criteria = {
            collection: this.collection,
            query: query
        };
        Utility.get(criteria, cb);
    }
    getGroups(cb) {
        let criteria = {
            collection: this.collection
        };
        Utility.get(criteria, cb);
    }
};

module.exports = UserGroups;

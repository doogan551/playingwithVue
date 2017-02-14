let Utility = new(require('../models/utility'))();

let UserGroups = class UserGroups extends Utility {
    constructor() {
        super('User Groups');
    }
    getGroupsWithUser(userid, cb) {
        let query = {};
        query['Users.' + userid] = {
            $exists: 1
        };

        let criteria = {
            query: query
        };
        Utility.get(criteria, cb);
    }
};

module.exports = UserGroups;

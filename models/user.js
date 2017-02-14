let ObjectID = require('mongodb').ObjectID;
let Utility = new(require('./utility'))();

let User = class User extends Utility {
    constructor() {
        super('Users');
    }

    get(criteria, cb) {
        Utility.get(criteria, cb);
    }

    getUser(query, cb) {
        let criteria = {
            query: query
        };
        Utility.getOne(criteria, cb);
    }

    getUsers(query, cb) {
        let criteria = {
            query: query
        };
        Utility.getAll(criteria, cb);
    }
};

module.exports = User;

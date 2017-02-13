let ObjectID = require('mongodb').ObjectID;
let Utility = require('./utility');

let User = class User {
    constructor() {
        this.collection = 'Users';
    }

    get(criteria, cb) {
        Utility.get(criteria, cb);
    }

    getUser(query, cb) {
        let criteria = {
            collection: this.collection,
            query: query
        };
        Utility.getOne(criteria, cb);
    }

    getUsers(query, cb) {
        let criteria = {
            collection: this.collection,
            query: query
        };
        Utility.get(criteria, cb);
    }

    findByUsername(username, cb) {
        let criteria = {
            collection: this.collection,
            query: {
                username: username
            }
        };
        Utility.get(criteria, cb);
    }

    findById(id, cb) {
        let criteria = {
            collection: this.collection,
            query: {
                _id: new ObjectID(id)
            }
        };
        Utility.get(criteria, cb);
    }
};

module.exports = User;

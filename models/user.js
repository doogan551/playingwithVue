let ObjectID = require('mongodb').ObjectID;
let Utility = require('./utility');
let usersCollection = 'Users';

let User = class User {

    get(criteria, cb) {
        Utility.get(criteria, cb);
    }

    findByUsername(username, cb) {
        let criteria = {
            collection: usersCollection,
            query: {
                username: username
            }
        };
        Utility.get(criteria, cb);
    }

    findById(id, cb) {
        let criteria = {
            collection: usersCollection,
            query: {
                _id: new ObjectID(id)
            }
        };
        Utility.get(criteria, cb);
    }
};

module.exports = User;

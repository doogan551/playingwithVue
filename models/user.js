let ObjectID = require('mongodb').ObjectID;
let Utility = require('./utility');
let usersCollection = 'Users';

exports.get = function (criteria, cb) {
    Utility.get(criteria, cb);
};

exports.findByUsername = function (username, cb) {
    let criteria = {
        collection: usersCollection,
        query: {
            username: username
        }
    };
    Utility.get(criteria, cb);
};

exports.findById = function (id, cb) {
    let criteria = {
        collection: usersCollection,
        query: {
            _id: new ObjectID(id)
        }
    };
    Utility.get(criteria, cb);
};

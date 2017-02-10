let bcrypt = require('bcrypt-nodejs');
let Utility = require('../models/utility');
let utils = require('../helpers/utils');
let ObjectID = require('mongodb').ObjectID;

let Workspace = class Workspace {

    saveWorkspace(data, cb) {
        let workspace = data.Workspace;
        let id = new ObjectID(data.userid);

        let criteria = {
            collection: 'Users',
            query: {
                _id: id
            },
            updateObj: {
                $set: {
                    Workspace: workspace
                }
            }
        };

        Utility.update(criteria, cb);
    }

    resetPassword(data, cb) {
        let username = data.username;
        let oldPass = data.oldPass;
        let newPass = utils.encrypt(data.newPass);

        let criteria = {
            collection: 'Users',
            query: {
                username: {
                    '$regex': new RegExp(['^', username, '$'].join(''), 'i')
                }
            }
        };

        Utility.getOne(criteria, function (err, user) {
            if (!user) {
                return cb('User not found');
            }
            if (!!err) {
                return cb(err);
            }

            bcrypt.compare(oldPass, user.Password.Value, function (err, result) {
                if (!!err) {
                    return cb(err);
                }
                if (!result) {
                    return cb('Current password and old password do not match');
                }
                criteria = {
                    collection: 'Users',
                    query: {
                        username: {
                            '$regex': new RegExp(['^', username, '$'].join(''), 'i')
                        }
                    },
                    updateObj: {
                        $set: {
                            'Password.Value': newPass,
                            'Password Reset.Value': false
                        }
                    }
                };
                Utility.update(criteria, cb);
            });
        });
    }
};

module.exports = Workspace;

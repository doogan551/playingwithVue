let bcrypt = require('bcrypt-nodejs');
let User = new(require('./user'))();
let utils = require('../helpers/utils');
let ObjectID = require('mongodb').ObjectID;

let Workspace = class Workspace {

    saveWorkspace(data, cb) {
        let workspace = data.Workspace;
        let id = new ObjectID(data.userid);

        let criteria = {
            query: {
                _id: id
            },
            updateObj: {
                $set: {
                    Workspace: workspace
                }
            }
        };

        User.update(criteria, cb);
    }

    resetPassword(data, cb) {
        let username = data.username;
        let oldPass = data.oldPass;
        let newPass = utils.encrypt(data.newPass);

        let criteria = {
            query: {
                username: {
                    '$regex': new RegExp(['^', username, '$'].join(''), 'i')
                }
            }
        };

        User.getOne(criteria, function (err, user) {
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
                User.update(criteria, cb);
            });
        });
    }
};

module.exports = Workspace;

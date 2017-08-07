const bcrypt = require('bcrypt-nodejs');
const ObjectID = require('mongodb').ObjectID;

const utils = require('../helpers/utils');

const Workspace = class Workspace {

    saveWorkspace(data, cb) {
        const user = new User();
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

        user.update(criteria, cb);
    }

    resetPassword(data, cb) {
        const userModel = new User();
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

        userModel.getOne(criteria, (err, user) => {
            if (!user) {
                return cb('User not found');
            }
            if (!!err) {
                return cb(err);
            }

            bcrypt.compare(oldPass, user.Password.Value, (err, result) => {
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
                userModel.update(criteria, cb);
            });
        });
    }
};

module.exports = Workspace;
const User = require('./user');

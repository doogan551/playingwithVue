const fs = require('fs');

const async = require('async');
const ObjectID = require('mongodb').ObjectID;

const ActivityLog = new(require('./activitylog'))();
const utils = require('../helpers/utils');
const Common = require('./common');

const User = class User extends Common {
    constructor() {
        super('Users');
    }

    getUser(query, cb) {
        let criteria = {
            query: query
        };
        this.getOne(criteria, cb);
    }

    getUsers(query, cb) {
        let criteria = {
            query: query
        };
        this.getAll(criteria, cb);
    }
    getAllUsers(data, cb) {
        let properties;
        let returnUsers = [];
        let i;
        let j;
        let tempObj;

        let criteria = {
            query: {}
        };

        User.get(criteria, (err, users) => {
            if (err) {
                return cb(err);
            }
            properties = data.Properties;

            if (properties !== undefined) {
                for (i = 0; i < users.length; i++) {
                    tempObj = {};
                    for (j = 0; j < properties.length; j++) {
                        if (typeof users[i][properties[j]] === 'undefined') {
                            continue;
                        }

                        if (typeof users[i][properties[j]].Value === 'undefined') {
                            tempObj[properties[j]] = users[i][properties[j]];
                        } else {
                            tempObj[properties[j]] = users[i][properties[j]].Value;
                        }
                    }

                    returnUsers.push(tempObj);
                }
            } else {
                returnUsers = users;
            }

            return cb(null, {
                Users: returnUsers
            });
        });
    }
    getGroups(data, cb) {
        let user = data.User;

        let userString = 'Users.' + user;

        let searchCriteria = {};
        searchCriteria[userString] = {
            $exists: true
        };
        let criteria = {
            query: searchCriteria
        };
        this.get(criteria, (err, groups) => {
            if (err) {
                return cb(err);
            }
            let returnArray = [];

            for (let i = 0; i < groups.length; i++) {
                returnArray.push({
                    'User Group Name': groups[i]['User Group Name'],
                    'User Group Id': groups[i]._id
                });
            }

            return cb(null, returnArray);
        });
    }
    removeUser(data, cb) {
        let userid = data.userid;

        if (userid.length < 12) {
            userid = parseInt(userid, 10);
        } else {
            userid = new ObjectID(userid);
        }

        let searchCriteria = {
            '_id': userid
        };

        let pointCount = 0;

        let criteria = {
            query: searchCriteria,
            fields: {
                _id: 0,
                username: 1
            }
        };
        this.getOne(criteria, (err, username) => {
            this.remove(criteria, (err) => {
                if (err) {
                    return cb(err);
                }

                let logData = {
                    user: data.user,
                    timestamp: Date.now(),
                    activity: 'User Delete',
                    log: 'User: ' + username.username + ' deleted.'
                };

                ActivityLog.create(logData, (err) => {});

                async.waterfall([

                    (callback) => {
                        // TODO Add fx
                        this.Util.updateControllers('remove', username.username, callback);
                    },
                    (callback) => {
                        let groupSearch = {};
                        let groupSearchString = 'Users.' + userid;
                        groupSearch[groupSearchString] = {
                            $exists: true
                        };

                        criteria = {
                            query: groupSearch
                        };
                        this.get(criteria, (err, groups) => {
                            if (err) {
                                return cb(err);
                            }

                            if (groups.length > 0) {
                                groups.forEach((group) => {
                                    delete group.Users[userid];
                                    let groupUpdate = {
                                        $set: {}
                                    };
                                    groupUpdate.$set.Users = group.Users;

                                    criteria = {
                                        query: {
                                            _id: group._id
                                        },
                                        updateObj: groupUpdate
                                    };
                                    this.update(criteria, (err) => {
                                        if (err) {
                                            return callback(err, null);
                                        }
                                        pointCount++;
                                        if (pointCount === groups.length) {
                                            callback(null, groups);
                                        }
                                    });
                                });
                            } else {
                                callback(null, groups);
                            }
                        });
                    },
                    (groups, callback) => {
                        let updateSearch, updateCriteria;
                        updateSearch = {
                            Security: {
                                $elemMatch: {
                                    userId: userid
                                }
                            }
                        };

                        updateCriteria = {
                            $pull: {
                                'Security': {
                                    userId: userid
                                }
                            }
                        };
                        // TODO check for empty groups on points
                        criteria = {
                            query: updateSearch,
                            updateObj: updateCriteria,
                            options: {
                                multi: true
                            }
                        };
                        this.update(criteria, (err) => {
                            return callback(err, {
                                'message': 'success'
                            });
                        });
                    }
                ], cb);
            });
        });
    }
    getUser(data, cb) {
        let id = data.id;
        let upi;

        if (id.length < 12) {
            upi = parseInt(id, 10);
        } else {
            upi = new ObjectID(id);
        }

        let searchCriteria = {
            _id: upi
        };

        let criteria = {
            query: searchCriteria
        };
        this.getOne(criteria, cb);
    }
    createPassword(data, cb) {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < 8; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return cb(null, text);
    }
    editPhoto(data, cb) {
        let userid = ObjectID(data.user);
        let image = data.image;
        let filename = data.name;
        let imgData = image.replace(/^data:image\/\w+;base64,/, '');

        fs.writeFile(process.cwd() + '/public/img/users/' + filename, imgData, 'base64', (err) => {
            if (!err) {
                let criteria = {
                    query: {
                        _id: userid
                    },
                    updateObj: {
                        $set: {
                            'Photo.Value': filename
                        }
                    }
                };
                this.update(criteria, (err) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, filename);
                });
            } else {
                return cb(err);
            }
        });
    }
    saveUser(data, cb) {
        if (data.userid !== undefined) {
            this.updateUser(data, cb);
        } else {
            this.newUser(data, cb);
        }
    }
    newUser(data, cb) {
        let username = data.username;
        let password;

        if (!!data.oldPassword) {
            password = data.Password;
        } else {
            password = utils.encrypt(data.Password);
        }

        let searchCriteria = {
            username: username
        };
        let userTemplate = {
            'alerts': {
                'Normal': [],
                'Emergency': [],
                'Critical': [],
                'Urgent': []
            },
            'Auto Logout Duration': {
                'Value': 0
            },
            'Contact Info': {
                'Value': []
            },
            'Description': {
                'Value': ''
            },
            'First Name': {
                'Value': ''
            },
            'Last Activity Time': {
                'Value': 0
            },
            'Last Login Time': {
                'Value': 0
            },
            'Last Name': {
                'Value': ''
            },
            'notificationsEnabled': true,
            'notificationOptions': {
                'Emergency': false,
                'Critical': false,
                'Urgent': false,
                'notifyOnAck': false
            },
            'Password': {
                'Value': ''
            },
            'Password Reset': {
                'Value': true
            },
            'Photo': {
                'Value': ''
            },
            'Session Length': {
                'Value': 0
            },
            'System Admin': {
                'Value': false
            },
            'Title': {
                'Value': ''
            },
            'username': ''
        };

        if (data['First Name']) {
            userTemplate['First Name'].Value = data['First Name'];
        }
        if (data['Last Name']) {
            userTemplate['Last Name'].Value = data['Last Name'];
        }
        if (data.Photo) {
            userTemplate.Photo.Value = data.Photo;
        }
        if (data.Title) {
            userTemplate.Title.Value = data.Title;
        }
        if (data['Contact Info']) {
            userTemplate['Contact Info'].Value = data['Contact Info'];
        }
        if (data['Auto Logout']) {
            userTemplate['Auto Logout Duration'].Value = data['Auto Logout'];
        }
        if (data.Description) {
            userTemplate.Description.Value = data.Description;
        }
        if (data['System Admin']) {
            userTemplate['System Admin'].Value = data['System Admin'];
            if (userTemplate['System Admin'].Value === 'true') {
                userTemplate['System Admin'].Value = true;
            } else if (userTemplate['System Admin'].Value === 'false') {
                userTemplate['System Admin'].Value = false;
            }
        }
        if (data.hasOwnProperty('Password Reset')) {
            userTemplate['Password Reset'].Value = data['Password Reset'];
        }

        userTemplate.username = username;

        userTemplate.Password.Value = password;

        let groups = (data['User Groups']) ? data['User Groups'] : [];

        let criteria = {
            query: {
                Name: 'Controllers'
            }
        };

        this.get(criteria, (err, conts) => {
            for (let i = 0; i < conts[0].Entries.length; i++) {
                if (conts[0].Entries[i]['Controller Name'] === username) {
                    return cb(null, {
                        message: 'This controller name already exists.'
                    });
                }
            }

            criteria = {
                query: searchCriteria
            };
            this.get(criteria, (err, docs) => {
                if (docs.length > 0) {
                    return cb(null, {
                        message: 'This username already exists.'
                    });
                }
                criteria = {
                    insertObj: userTemplate
                };

                this.insert(criteria, (err, userArray) => {
                    let logData = {
                        user: data.user,
                        timestamp: Date.now(),
                        activity: 'User Add',
                        log: 'User: ' + username + ' added.'
                    };
                    let user;

                    ActivityLog.create(logData, (err) => {});

                    if (err) {
                        return cb(err);
                    }
                    // TODO Add                     this.Util.updateControllers('add', userTemplate.username, (err) => {
                    if (userArray) {
                        user = userArray.ops[0];
                    }

                    if (groups.length > 0) {
                        let groupCount = 0;
                        groups.forEach((group) => {
                            if (group.groupid.length < 12) {
                                group.groupid = parseInt(group.groupid, 10);
                            } else {
                                group.groupid = new ObjectID(group.groupid);
                            }

                            async.waterfall([

                                (callback) => {
                                    searchCriteria = {
                                        _id: group.groupId
                                    };
                                    let updateCriteria = {
                                        $set: {}
                                    };
                                    let adminString = 'Users.' + user._id + '.Group Admin';
                                    if (group['Group Admin'] === true || group['Group Admin'] === 'true') {
                                        updateCriteria.$set[adminString] = true;
                                    } else {
                                        updateCriteria.$set[adminString] = false;
                                    }

                                    let options = {
                                        upsert: true
                                    };

                                    criteria = {
                                        query: searchCriteria,
                                        updateObj: updateCriteria,
                                        options: options
                                    };
                                    this.update(criteria, (err) => {
                                        if (err) {
                                            return callback(err);
                                        }

                                        criteria = {
                                            query: {
                                                _id: group.groupId
                                            }
                                        };

                                        this.getOne(criteria, callback);
                                    });
                                },
                                (newGroup, callback) => {
                                    searchCriteria = {
                                        'Security': {
                                            $elemMatch: {
                                                'groupId': newGroup._id
                                            }
                                        }
                                    };

                                    criteria = {
                                        query: searchCriteria
                                    };

                                    this.get(criteria, (err, points) => {
                                        async.eachSeries(points, (point, eachCB) => {
                                            let updateCriteria = {
                                                $push: {
                                                    'Security': {
                                                        'groupId': newGroup._id,
                                                        'userId': user._id
                                                    }
                                                }
                                            };

                                            criteria = {
                                                query: {
                                                    _id: point._id
                                                },
                                                updateObj: updateCriteria
                                            };

                                            this.udpate(criteria, (err) => {
                                                eachCB(err);
                                            });
                                        }, callback);
                                    });
                                }
                            ], (err) => {
                                if (err) {
                                    return cb(err);
                                }

                                groupCount++;

                                if (groupCount === groups.length) {
                                    criteria = {
                                        query: {
                                            _id: user._id
                                        }
                                    };

                                    this.getOne(criteria, cb);
                                }
                            });
                        });
                    } else {
                        criteria = {
                            query: {
                                _id: user._id
                            }
                        };

                        this.getOne(criteria, cb);
                    }
                });
            });
        });
    }
    updateUser(data, cb) {
        let updateData = data['Update Data'];
        let groups = (updateData['User Groups'] !== undefined) ? updateData['User Groups'] : [];
        let username = '';

        let userid = data.userid;

        if (userid.length < 12) {
            userid = parseInt(userid, 10);
        } else {
            userid = new ObjectID(userid);
        }

        let searchCriteria = {
            '_id': userid
        };

        let updateCriteria = {
            $set: {}
        };
        this.getOne({
            query: searchCriteria
        }, (err, dbUser) => {
            for (let key in updateData) {
                if (key === 'Contact Info') {
                    let contact = updateData[key];
                    for (let c = 0; c < contact.length; c++) {
                        if (['SMS', 'Voice'].indexOf(contact[c].Type) >= 0) {
                            contact[c].Value = contact[c].Value.match(/\d+/g).join('');
                        }
                    }
                    let alerts = dbUser.alerts;

                    for (let almClass in alerts) {
                        for (let a = 0; a < alerts[almClass].length; a++) {
                            let alert = alerts[almClass][a];
                            let exists = false;

                            for (let i = 0; i < contact.length; i++) {
                                if (contact[i].Name === alert.Name) {
                                    alert.Value = contact[i].Value;
                                    exists = true;
                                }
                                if (contact[i].Value === alert.Value) {
                                    alert.Name = contact[i].Name;
                                    exists = true;
                                }
                            }
                            console.log(alert, exists);
                            if (!exists) {
                                alerts[almClass].splice(a, 1);
                                a--;
                            }
                        }
                    }

                    updateCriteria.$set.alerts = alerts;
                }
                let value;
                if (key === 'username') {
                    username = updateData[key];
                    updateCriteria.$set[key] = updateData[key];
                    updateCriteria.$set['Username.Value'] = updateData[key];
                } else if (key === 'Password') {
                    let password = utils.encrypt(updateData[key]);
                    value = key + '.Value';
                    updateCriteria.$set[value] = password;
                } else if (key === 'notificationsEnabled' || key === 'alerts' || key === 'notificationOptions') {
                    updateCriteria.$set[key] = updateData[key];
                } else if (key !== '_id' && key !== 'User Groups') {
                    value = key + '.Value';
                    updateCriteria.$set[value] = updateData[key];
                }
            }


            let criteria = {
                query: searchCriteria,
                updateObj: updateCriteria
            };
            this.update(criteria, (err) => {
                if (err) {
                    return cb(err);
                }

                let logData = {
                    user: data.user,
                    timestamp: Date.now(),
                    activity: 'User Edit',
                    log: 'User: ' + username + ' edited.'
                };

                ActivityLog.create(logData, (err) => {});

                let deleteSearch = {};
                deleteSearch['Point Type'] = {};
                deleteSearch['Point Type'].Value = 'User Group';

                let userVar = 'Users.' + userid;
                deleteSearch[userVar] = {};
                deleteSearch[userVar].$exists = true;

                let delCount = 0;

                criteria = {
                    query: deleteSearch
                };
                this.get(criteria, (err, delGroups) => {
                    let i;
                    let groupsToRemove = [];
                    if (groups.length > 0) {
                        for (i = 0; i < delGroups.length; i++) {
                            for (let j = 0; j < groups.length; j++) {
                                if (groups[j] === delGroups[i]) {
                                    break;
                                }
                                if (j === (groups.length - 1)) {
                                    groupsToRemove.push(delGroups[i]);
                                }
                            }
                        }
                    } else {
                        groupsToRemove = delGroups;
                    }

                    if (groupsToRemove.length > 0) {
                        groupsToRemove.forEach((groupToRemove) => {
                            async.waterfall([

                                (callback) => {
                                    let delSearch = {
                                        _id: groupToRemove._id
                                    };

                                    criteria = {
                                        query: delSearch
                                    };
                                    this.getOne(criteria, (err, delGroup) => {
                                        delete delGroup.Users[userid];

                                        criteria = {
                                            query: delSearch,
                                            updateObj: delGroup
                                        };
                                        this.update(criteria, (err) => {
                                            callback(err, delGroup);
                                        });
                                    });
                                },
                                (delGroup, callback) => {
                                    let delGroupSearch = {
                                        'Security': {
                                            $elemMatch: {
                                                'groupId': groupToRemove._id
                                            }
                                        }
                                    };
                                    let updateCriteria = {
                                        $pull: {
                                            'Security': {
                                                'groupId': groupToRemove._id,
                                                'userId': userid
                                            }
                                        }
                                    };

                                    criteria = {
                                        query: delGroupSearch,
                                        updateObj: updateCriteria,
                                        options: {
                                            multi: true
                                        }
                                    };
                                    this.update(criteria, (err) => {
                                        callback(err, delGroup);
                                    });
                                }
                            ], (err) => {
                                delCount++;
                                if (delCount === groupsToRemove.length) {
                                    updateUsers(searchCriteria, groups, userid, cb);
                                }
                            });
                        });
                    } else {
                        updateUsers(searchCriteria, groups, userid, cb);
                    }
                });
            });
        });

        let updateUsers = (searchCriteria, groups, userid, cb) => {
            let count = 0;
            let criteria = {};

            if (groups.length > 0) {
                criteria = {
                    query: searchCriteria
                };

                this.getOne(criteria, (err, user) => {
                    if (err) {
                        return cb(err);
                    }
                    groups.forEach((group) => {
                        if (group.groupid.length < 12) {
                            group.groupid = parseInt(group.groupid, 10);
                        } else {
                            group.groupid = new ObjectID(group.groupid);
                        }

                        async.waterfall([

                            (callback) => {
                                searchCriteria = {
                                    _id: group.groupid
                                };
                                let updateCriteria = {
                                    $set: {}
                                };
                                let adminString = 'Users.' + userid + '.Group Admin';
                                if (group['Group Admin'] === true || group['Group Admin'] === 'true') {
                                    updateCriteria.$set[adminString] = true;
                                } else {
                                    updateCriteria.$set[adminString] = false;
                                }

                                //updateCriteria.$set[usernameString] = user.username;

                                let options = {
                                    upsert: true
                                };

                                criteria = {
                                    query: searchCriteria,
                                    updateObj: updateCriteria,
                                    options: options
                                };
                                this.update(criteria, (err) => {
                                    if (err) {
                                        return callback(err);
                                    }

                                    criteria = {
                                        query: {
                                            _id: group.groupid
                                        }
                                    };
                                    this.getOne(criteria, callback);
                                });
                            },
                            (newGroup, callback) => {
                                searchCriteria = {
                                    'Security': {
                                        $elemMatch: {
                                            'groupId': newGroup._id
                                        }
                                    }
                                };

                                criteria = {
                                    query: searchCriteria
                                };
                                this.get(criteria, (err, points) => {
                                    if (err) {
                                        return callback(err);
                                    }
                                    async.eachSeries(points, (point, eachCB) => {
                                        updateCriteria = {
                                            $push: {
                                                'Security': {
                                                    'groupId': newGroup._id,
                                                    'userId': user._id
                                                }
                                            }
                                        };

                                        criteria = {
                                            query: {
                                                _id: point._id
                                            },
                                            updateObj: updateCriteria
                                        };
                                        this.update(criteria, (err) => {
                                            eachCB(err);
                                        });
                                    }, callback);
                                });
                            }
                        ], (err) => {
                            if (err) {
                                return cb(err);
                            }

                            count++;
                            if (count === groups.length) {
                                criteria = {
                                    query: {
                                        _id: user._id
                                    }
                                };
                                this.getOne(criteria, cb);
                            }
                        });
                    });
                });
            } else {
                criteria = {
                    query: {
                        _id: userid
                    }
                };
                this.getOne(criteria, cb);
            }
        };
    }
};

module.exports = User;

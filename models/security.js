let async = require('async');

let Utility = new(require('../models/utility'))();
let User = require('../models/user');
let config = require('../public/js/lib/config.js');
let actLogsEnums = config.Enums['Activity Logs'];
let utils = require('../helpers/utils.js');
let ObjectID = require('mongodb').ObjectID;
let fs = require('fs');

let pointsCollection = utils.CONSTANTS('pointsCollection');
let usersCollection = utils.CONSTANTS('usersCollection');
let userGroupsCollection = utils.CONSTANTS('userGroupsCollection');
let systemInfoCollection = utils.CONSTANTS('systemInfoProperties');
let activityLogCollection = utils.CONSTANTS('activityLogCollection');
let READ = utils.CONSTANTS('READ');
let ACKNOWLEDGE = utils.CONSTANTS('ACKNOWLEDGE');
let CONTROL = utils.CONSTANTS('CONTROL');
let WRITE = utils.CONSTANTS('WRITE');

let Groups = class Groups {
    saveGroup(data, cb) {
        if (data['User Group Upi'] !== undefined) {
            this.updateGroup(data, cb);
        } else {
            this.newGroup(data, cb);
        }
    }
    newGroup(data, cb) {
        let groupName = data['User Group Name'];
        let users = (data.Users) ? data.Users : [];
        let description = (data.Description) ? data.Description : '';

        if (!groupName) {
            return cb('No group name given.');
        }

        let userObj = {};
        for (let i = 0; i < users.length; i++) {
            if (users[i].userid !== undefined) {
                userObj[users[i].userid] = {};

                if (users[i]['Group Admin'] === 'true' || users[i]['Group Admin'] === true) {
                    userObj[users[i].userid]['Group Admin'] = true;
                } else {
                    userObj[users[i].userid]['Group Admin'] = false;
                }
            }
        }


        let searchCriteria = {
            'User Group Name': groupName
        };
        let insertCriteria = {
            'User Group Name': groupName,
            'Users': userObj,
            'Description': description,
            _pAccess: parseInt(data._pAccess, 10) | READ,
            'Photo': {
                Value: ''
            },
            Points: {}
        };

        let criteria = {
            collection: userGroupsCollection,
            query: searchCriteria
        };

        Utility.get(criteria, function (err, groups) {
            if (err) {
                return cb(err);
            }
            if (groups.length === 0) {
                criteria = {
                    collection: userGroupsCollection,
                    insertObj: insertCriteria
                };

                Utility.insert(criteria, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    criteria = {
                        collection: userGroupsCollection,
                        query: searchCriteria
                    };

                    Utility.getOne(criteria, cb);
                });
            } else {
                return cb('Group already exists');
            }
        });
    }
    updateGroup(data, cb) {
        let groupUpi = data['User Group Upi'];
        let updateData = data['Update Data'];
        let users = (updateData.Users !== undefined) ? updateData.Users : [];
        let groupId;

        let searchCriteria = {};
        if (groupUpi) {
            if (groupUpi.length < 12) {
                groupId = parseInt(groupUpi, 10);
            } else {
                groupId = new ObjectID(groupUpi);
            }
            searchCriteria = {
                _id: groupId
            };

            let updateCriteria = {
                $set: {}
            };

            for (let key in updateData) {
                if (key === 'User Group Name' || key === 'Description') {
                    updateCriteria.$set[key] = updateData[key];
                }
            }

            updateCriteria.$set.Users = {};
            if (users.length !== 0) { // users on group obj
                users.forEach(function (user) {
                    updateCriteria.$set.Users[user.userid] = {};
                    updateCriteria.$set.Users[user.userid]['Group Admin'] = (user['Group Admin'] !== undefined && user['Group Admin'] === true) ? user['Group Admin'] : false;
                });
            }
            if (updateData._pAccess !== undefined) {
                updateCriteria.$set._pAccess = parseInt(updateData._pAccess, 10);
            }

            let criteria = {
                collection: userGroupsCollection,
                query: searchCriteria,
                updateObj: updateCriteria,
                options: {
                    upsert: 1
                }
            };

            Utility.update(criteria, function (err) {
                if (err) {
                    return cb(err);
                }

                criteria = {
                    collection: userGroupsCollection,
                    query: {
                        _id: groupId
                    }
                };

                Utility.getOne(criteria, cb);
            });
        } else {
            return cb('No group given');
        }
    }
    getUsers(data, cb) {
        let groupUpi = data['User Group Upi'];

        let id = new ObjectID(groupUpi);

        let searchCriteria = {};
        if (id) {
            searchCriteria = {
                '_id': id
            };
        } else {
            return cb('No groups given');
        }

        let criteria = {
            collection: userGroupsCollection,
            query: searchCriteria
        };

        Utility.getOne(criteria, cb);
    }
    addUsers(data, cb) {
        let groupUpis = data['User Group Upis'];
        let users = (data.Users !== undefined) ? data.Users : [];
        let criteria = {};

        let count = 0;

        if (groupUpis) {
            let groupIds = [];
            for (let a = 0; a < groupUpis.length; a++) {
                if (groupUpis[a].length < 12) {
                    groupIds.push(parseInt(groupUpis[a], 10));
                } else {
                    groupIds.push(new ObjectID(groupUpis[a]));
                }
            }
            let groupCount = 0;

            groupIds.forEach(function (groupId) {
                users.forEach(function (user) {
                    async.waterfall([

                        function (callback) {
                            let searchCriteria, updateCriteria,
                                adminString, options;
                            searchCriteria = {
                                _id: groupId
                            };
                            updateCriteria = {
                                $set: {}
                            };
                            adminString = 'Users.' + user.userid + '.Group Admin';
                            if (user['Group Admin'] === true || user['Group Admin'] === 'true') {
                                updateCriteria.$set[adminString] = true;
                            } else {
                                updateCriteria.$set[adminString] = false;
                            }

                            //updateCriteria.$set[usernameString] = user.username;

                            options = {
                                upsert: true
                            };

                            criteria = {
                                collection: userGroupsCollection,
                                query: searchCriteria,
                                updateObj: updateCriteria,
                                options: options
                            };
                            Utility.update(criteria, function (err, result) {
                                if (err) {
                                    callback(err, null);
                                }
                                count++;
                                if (count === users.length) {
                                    criteria = {
                                        collection: userGroupsCollection,
                                        query: result
                                    };
                                    Utility.getOne(criteria, callback);
                                }
                            });
                        },
                        function (group, callback) {
                            let usersString, searchCriteria, updateCriteria;
                            usersString = 'User Groups.' + group._id;
                            searchCriteria = {};
                            searchCriteria[usersString] = {
                                $exists: true
                            };

                            updateCriteria = {
                                $set: {}
                            };

                            updateCriteria.$set['User Groups.' + group._id + '.Users'] = group.Users;

                            criteria = {
                                collection: userGroupsCollection,
                                query: searchCriteria,
                                updateObj: updateCriteria,
                                options: {
                                    multi: 1
                                }
                            };

                            Utility.update(criteria, function (err) {
                                callback(err, {
                                    'message': 'success'
                                });
                            });
                        }
                    ], function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        groupCount++;
                        if (groupCount === groupIds.length) {
                            return cb(null, result);
                        }
                    });
                });
            });
        } else {
            return cb('No groups given');
        }
    }
    removeUsers(data, cb) {
        let users = data.Users ? data.Users : [];
        let groupUpis = (data['User Group Upis']) ? data['User Group Upis'] : [];
        let criteria = {};

        if (groupUpis) {
            let groupIds = [];
            for (let a = 0; a < groupUpis.length; a++) {
                if (groupUpis[a].length < 12) {
                    groupIds.push(parseInt(groupUpis[a], 10));
                } else {
                    groupIds.push(new ObjectID(groupUpis[a]));
                }
            }
            let groupCount = 0;

            groupIds.forEach(function (groupId) {
                let count = 0;
                users.forEach(function (user) {
                    async.waterfall([

                        function (callback) {
                            let searchCriteria = {
                                _id: groupId
                            };
                            let updateCriteria = {
                                $set: {}
                            };

                            criteria = {
                                collection: userGroupsCollection,
                                query: searchCriteria
                            };

                            Utility.getOne(criteria, function (err, group) {
                                if (group.Users[user]) {
                                    delete group.Users[user];
                                }

                                updateCriteria.$set.Users = group.Users;
                                criteria = {
                                    collection: userGroupsCollection,
                                    query: searchCriteria,
                                    updateObj: searchCriteria
                                };

                                Utility.update(criteria, function (err, result) {
                                    if (err) {
                                        callback(err, null);
                                    }

                                    count++;

                                    if (count === users.length) {
                                        criteria = {
                                            collection: userGroupsCollection,
                                            query: result
                                        };

                                        Utility.getOne(criteria, function (err, group) {
                                            callback(null, group);
                                        });
                                    }
                                });
                            });
                        },
                        function (group, callback) {
                            let usersString = 'User Groups.' + group._id;
                            let searchCriteria = {};
                            searchCriteria[usersString] = {
                                $exists: true
                            };

                            let updateCriteria = {
                                $set: {}
                            };

                            updateCriteria.$set['User Groups.' + group._id + '.Users'] = group.Users;
                            criteria = {
                                collection: userGroupsCollection,
                                query: searchCriteria,
                                updateObj: updateCriteria,
                                options: {
                                    multi: true
                                }
                            };
                            Utility.getOne(criteria, function (err) {
                                if (err) {
                                    return callback(err, null);
                                }
                                return callback(null, {
                                    'message': 'success'
                                });
                            });
                        }
                    ], function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        groupCount++;
                        if (groupCount === groupIds.length) {
                            return cb(null, result);
                        }
                    });
                });
            });
        } else {
            return cb('No groups given');
        }
    }
    removeGroup(data, cb) {
        let groupUpi = data['User Group Upi'];
        let criteria = {};
        let removeCriteria = {};

        if (groupUpi) {
            let groupId;
            if (groupUpi.length < 12) {
                groupId = parseInt(groupUpi, 10);
            } else {
                groupId = new ObjectID(groupUpi);
            }

            removeCriteria = {
                _id: groupId
            };

            criteria = {
                collection: userGroupsCollection,
                query: removeCriteria
            };
            Utility.remove(criteria, function (err) {
                if (err) {
                    return cb(err);
                }
                let searchCriteria = {
                    Security: {
                        $elemMatch: {
                            groupId: groupId
                        }
                    }
                };
                let updateCriteria = {
                    $pull: {
                        Security: {
                            groupId: groupId
                        }
                    }
                };

                criteria = {
                    collection: pointsCollection,
                    query: searchCriteria,
                    updateObj: updateCriteria,
                    options: {
                        multi: true
                    }
                };
                Utility.remove(criteria, cb);
            });
        } else {
            return cb('No group given');
        }
    }
    getAllGroups(data, cb) {
        let searchCriteria = {};
        let criteria = {
            collection: userGroupsCollection,
            query: searchCriteria
        };

        Utility.get(criteria, function (err, groups) {
            if (err) {
                return cb(err);
            }

            let properties = data.Properties;
            let returnArray = [];
            let tempObj;
            let i;

            if (typeof properties === 'undefined') {
                returnArray = groups;
            } else {
                for (i = 0; i < groups.length; i++) {
                    tempObj = {};
                    for (let j = 0; j < properties.length; j++) {
                        if (typeof groups[i][properties[j]] === 'undefined') {
                            continue;
                        }
                        if (typeof groups[i][properties[j]].Value === 'undefined') {
                            tempObj[properties[j]] = groups[i][properties[j]];
                        } else {
                            tempObj[properties[j]] = groups[i][properties[j]].Value;
                        }
                    }
                    returnArray.push(tempObj);
                }
            }

            return cb(null, returnArray);
        });
    }
    getPoints(data, cb) {
        let group = data['User Group Upi'];

        if (group.length < 12) {
            group = parseInt(group, 10);
        } else {
            group = new ObjectID(group);
        }

        let searchCriteria = {
            Security: {
                $elemMatch: {
                    groupId: group
                }
            }
        };

        let criteria = {
            collection: pointsCollection,
            query: searchCriteria
        };
        Utility.get(criteria, function (err, points) {
            if (err) {
                return cb(err);
            }

            let i;
            let j;
            let properties = data.Properties;
            let returnArray = [];

            for (i = 0; i < points.length; i++) {
                let tempObj = {};
                if (properties !== undefined) {
                    for (j = 0; j < properties.length; j++) {
                        if (properties[j] === 'Name' || properties[j] === '_id' || properties[j] === 'name1' || properties[j] === 'name2' || properties[j] === 'name3' || properties[j] === 'name4') {
                            tempObj[properties[j]] = points[i][properties[j]];
                        } else {
                            tempObj[properties[j]] = points[i][properties[j]].Value;
                        }
                    }
                } else {
                    tempObj = {
                        _id: points[i]._id,
                        name1: points[i].name1,
                        name2: points[i].name2,
                        name3: points[i].name3,
                        name4: points[i].name4,
                        Name: points[i].Name
                    };
                }
                returnArray.push(tempObj);
            }

            return cb(null, returnArray);
        });
    }
    getGroup(data, cb) {
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
            collection: userGroupsCollection,
            query: searchCriteria
        };
        Utility.getOne(criteria, cb);
    }
    editPhoto(data, cb) {
        let userid = ObjectID(data.user);
        let image = data.image;
        let filename = data.name;
        let imgData = image.replace(/^data:image\/\w+;base64,/, '');

        fs.writeFile(process.cwd() + '/public/img/users/' + filename, imgData, 'base64', function (err) {
            if (!err) {
                let criteria = {
                    collection: userGroupsCollection,
                    query: {
                        _id: userid
                    },
                    updateObj: {
                        $set: {
                            'Photo': filename
                        }
                    }
                };
                Utility.update(criteria, function (err) {
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
    updatePermissions(data, cb) {
        let groups = data.groups;

        async.each(groups, function (group, callback) {
            Utility.update({
                collection: 'User Groups',
                query: {
                    _id: ObjectID(group._id)
                },
                updateObj: {
                    $set: {
                        Points: group.points
                    }
                }
            }, callback);
        }, cb);
    }
};

let Users = class Users {
    constructor() {
        this.Util = new Utility();
    }
    getAllUsers(data, cb) {
        let properties;
        let returnUsers = [];
        let i;
        let j;
        let tempObj;

        let criteria = {
            collection: 'Users',
            query: {}
        };

        User.get(criteria, function (err, users) {
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
            collection: userGroupsCollection,
            query: searchCriteria
        };
        Utility.get(criteria, function (err, groups) {
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
            collection: usersCollection,
            query: searchCriteria,
            fields: {
                _id: 0,
                username: 1
            }
        };
        Utility.getOne(criteria, function (err, username) {
            Utility.remove(criteria, function (err) {
                if (err) {
                    return cb(err);
                }

                let logData = {
                    user: data.user,
                    timestamp: Date.now(),
                    activity: actLogsEnums['User Delete'].enum,
                    log: 'User: ' + username.username + ' deleted.'
                };
                logData = utils.buildActivityLog(logData);
                Utility.insert({
                    collection: activityLogCollection,
                    insertObj: logData
                }, function (err) {});

                async.waterfall([

                    function (callback) {
                        // TODO Add fx
                        this.Util.updateControllers('remove', username.username, callback);
                    },
                    function (callback) {
                        let groupSearch = {};
                        let groupSearchString = 'Users.' + userid;
                        groupSearch[groupSearchString] = {
                            $exists: true
                        };

                        criteria = {
                            collection: userGroupsCollection,
                            query: groupSearch
                        };
                        Utility.get(criteria, function (err, groups) {
                            if (err) {
                                return cb(err);
                            }

                            if (groups.length > 0) {
                                groups.forEach(function (group) {
                                    delete group.Users[userid];
                                    let groupUpdate = {
                                        $set: {}
                                    };
                                    groupUpdate.$set.Users = group.Users;

                                    criteria = {
                                        collection: userGroupsCollection,
                                        query: {
                                            _id: group._id
                                        },
                                        updateObj: groupUpdate
                                    };
                                    Utility.update(criteria, function (err) {
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
                    function (groups, callback) {
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
                            collection: pointsCollection,
                            query: updateSearch,
                            updateObj: updateCriteria,
                            options: {
                                multi: true
                            }
                        };
                        Utility.update(criteria, function (err) {
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
            collection: usersCollection,
            query: searchCriteria
        };
        Utility.getOne(criteria, cb);
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

        fs.writeFile(process.cwd() + '/public/img/users/' + filename, imgData, 'base64', function (err) {
            if (!err) {
                let criteria = {
                    collection: usersCollection,
                    query: {
                        _id: userid
                    },
                    updateObj: {
                        $set: {
                            'Photo.Value': filename
                        }
                    }
                };
                Utility.update(criteria, function (err) {
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
            collection: systemInfoCollection,
            query: {
                Name: 'Controllers'
            }
        };

        Utility.get(criteria, function (err, conts) {
            for (let i = 0; i < conts[0].Entries.length; i++) {
                if (conts[0].Entries[i]['Controller Name'] === username) {
                    return cb(null, {
                        message: 'This controller name already exists.'
                    });
                }
            }

            criteria = {
                collection: usersCollection,
                query: searchCriteria
            };
            Utility.get(criteria, function (err, docs) {
                if (docs.length > 0) {
                    return cb(null, {
                        message: 'This username already exists.'
                    });
                }
                criteria = {
                    collection: usersCollection,
                    insertObj: userTemplate
                };

                Utility.insert(criteria, function (err, userArray) {
                    let logData = {
                        user: data.user,
                        timestamp: Date.now(),
                        activity: actLogsEnums['User Add'].enum,
                        log: 'User: ' + username + ' added.'
                    };
                    let user;
                    logData = utils.buildActivityLog(logData);
                    Utility.insert({
                        collection: activityLogCollection,
                        insertObj: logData
                    }, function (err) {});

                    if (err) {
                        return cb(err);
                    }
                    // TODO Add function
                    this.Util.updateControllers('add', userTemplate.username, function (err) {
                        if (userArray) {
                            user = userArray.ops[0];
                        }

                        if (groups.length > 0) {
                            let groupCount = 0;
                            groups.forEach(function (group) {
                                if (group.groupid.length < 12) {
                                    group.groupid = parseInt(group.groupid, 10);
                                } else {
                                    group.groupid = new ObjectID(group.groupid);
                                }

                                async.waterfall([

                                    function (callback) {
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
                                            collection: userGroupsCollection,
                                            query: searchCriteria,
                                            updateObj: updateCriteria,
                                            options: options
                                        };
                                        Utility.update(criteria, function (err) {
                                            if (err) {
                                                return callback(err);
                                            }

                                            criteria = {
                                                collection: userGroupsCollection,
                                                query: {
                                                    _id: group.groupId
                                                }
                                            };

                                            Utility.getOne(criteria, callback);
                                        });
                                    },
                                    function (newGroup, callback) {
                                        searchCriteria = {
                                            'Security': {
                                                $elemMatch: {
                                                    'groupId': newGroup._id
                                                }
                                            }
                                        };

                                        criteria = {
                                            collection: pointsCollection,
                                            query: searchCriteria
                                        };

                                        Utility.get(criteria, function (err, points) {
                                            async.eachSeries(points, function (point, eachCB) {
                                                let updateCriteria = {
                                                    $push: {
                                                        'Security': {
                                                            'groupId': newGroup._id,
                                                            'userId': user._id
                                                        }
                                                    }
                                                };

                                                criteria = {
                                                    collection: pointsCollection,
                                                    query: {
                                                        _id: point._id
                                                    },
                                                    updateObj: updateCriteria
                                                };

                                                Utility.udpate(criteria, function (err) {
                                                    eachCB(err);
                                                });
                                            }, callback);
                                        });
                                    }
                                ], function (err) {
                                    if (err) {
                                        return cb(err);
                                    }

                                    groupCount++;

                                    if (groupCount === groups.length) {
                                        criteria = {
                                            collection: usersCollection,
                                            query: {
                                                _id: user._id
                                            }
                                        };

                                        Utility.getOne(criteria, cb);
                                    }
                                });
                            });
                        } else {
                            criteria = {
                                collection: usersCollection,
                                query: {
                                    _id: user._id
                                }
                            };

                            Utility.getOne(criteria, cb);
                        }
                    });
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
        Utility.getOne({
            collection: usersCollection,
            query: searchCriteria
        }, function (err, dbUser) {
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
                collection: usersCollection,
                query: searchCriteria,
                updateObj: updateCriteria
            };
            Utility.update(criteria, function (err) {
                if (err) {
                    return cb(err);
                }

                let logData = {
                    user: data.user,
                    timestamp: Date.now(),
                    activity: actLogsEnums['User Edit'].enum,
                    log: 'User: ' + username + ' edited.'
                };
                logData = utils.buildActivityLog(logData);
                Utility.insert({
                    collection: activityLogCollection,
                    insertObj: logData
                }, function (err) {});

                let deleteSearch = {};
                deleteSearch['Point Type'] = {};
                deleteSearch['Point Type'].Value = 'User Group';

                let userVar = 'Users.' + userid;
                deleteSearch[userVar] = {};
                deleteSearch[userVar].$exists = true;

                let delCount = 0;

                criteria = {
                    collection: userGroupsCollection,
                    query: deleteSearch
                };
                Utility.get(criteria, function (err, delGroups) {
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
                        groupsToRemove.forEach(function (groupToRemove) {
                            async.waterfall([

                                function (callback) {
                                    let delSearch = {
                                        _id: groupToRemove._id
                                    };

                                    criteria = {
                                        collection: userGroupsCollection,
                                        query: delSearch
                                    };
                                    Utility.getOne(criteria, function (err, delGroup) {
                                        delete delGroup.Users[userid];

                                        criteria = {
                                            collection: userGroupsCollection,
                                            query: delSearch,
                                            updateObj: delGroup
                                        };
                                        Utility.update(criteria, function (err) {
                                            callback(err, delGroup);
                                        });
                                    });
                                },
                                function (delGroup, callback) {
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
                                        collection: pointsCollection,
                                        query: delGroupSearch,
                                        updateObj: updateCriteria,
                                        options: {
                                            multi: true
                                        }
                                    };
                                    Utility.update(criteria, function (err) {
                                        callback(err, delGroup);
                                    });
                                }
                            ], function (err) {
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

        function updateUsers(searchCriteria, groups, userid, cb) {
            let count = 0;
            let criteria = {};

            if (groups.length > 0) {
                criteria = {
                    collection: usersCollection,
                    query: searchCriteria
                };

                Utility.getOne(criteria, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    groups.forEach(function (group) {
                        if (group.groupid.length < 12) {
                            group.groupid = parseInt(group.groupid, 10);
                        } else {
                            group.groupid = new ObjectID(group.groupid);
                        }

                        async.waterfall([

                            function (callback) {
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
                                    collection: userGroupsCollection,
                                    query: searchCriteria,
                                    updateObj: updateCriteria,
                                    options: options
                                };
                                Utility.update(criteria, function (err) {
                                    if (err) {
                                        return callback(err);
                                    }

                                    criteria = {
                                        collection: userGroupsCollection,
                                        query: {
                                            _id: group.groupid
                                        }
                                    };
                                    Utility.getOne(criteria, callback);
                                });
                            },
                            function (newGroup, callback) {
                                searchCriteria = {
                                    'Security': {
                                        $elemMatch: {
                                            'groupId': newGroup._id
                                        }
                                    }
                                };

                                criteria = {
                                    collection: pointsCollection,
                                    query: searchCriteria
                                };
                                Utility.get(criteria, function (err, points) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    async.eachSeries(points, function (point, eachCB) {
                                        updateCriteria = {
                                            $push: {
                                                'Security': {
                                                    'groupId': newGroup._id,
                                                    'userId': user._id
                                                }
                                            }
                                        };

                                        criteria = {
                                            collection: pointsCollection,
                                            query: {
                                                _id: point._id
                                            },
                                            updateObj: updateCriteria
                                        };
                                        Utility.update(criteria, function (err) {
                                            eachCB(err);
                                        });
                                    }, callback);
                                });
                            }
                        ], function (err) {
                            if (err) {
                                return cb(err);
                            }

                            count++;
                            if (count === groups.length) {
                                criteria = {
                                    collection: usersCollection,
                                    query: {
                                        _id: user._id
                                    }
                                };
                                Utility.getOne(criteria, cb);
                            }
                        });
                    });
                });
            } else {
                criteria = {
                    collection: usersCollection,
                    query: {
                        _id: userid
                    }
                };
                Utility.getOne(criteria, cb);
            }
        }
    }
};

let Points = class Points {

    addGroups(data, cb) {
        let newGroups = (data.Groups) ? data.Groups : [];
        let points = (data.Points) ? data.Points : [];
        let searchFilters = (data.searchFilters) ? data.searchFilters : null;
        let criteria = {};

        if (points.length < 1 || !searchFilters) {
            return cb('No points or filters given.');
        }

        let updateCriteria = {
            $addToSet: {
                Security: {
                    $each: []
                }
            }
        };

        for (let m = 0; m < newGroups.length; m++) {
            newGroups[m].groupId = new ObjectID(newGroups[m].groupId);

            newGroups[m].Permissions = parseInt(newGroups[m].Permissions, 10);
            if ((newGroups[m].Permissions & WRITE) !== 0) { // If write, get read, ack and control
                newGroups[m].Permissions = newGroups[m].Permissions | READ | ACKNOWLEDGE | CONTROL;
            }
            if ((newGroups[m].Permissions & CONTROL) !== 0) { // If control, get read
                newGroups[m].Permissions |= READ;
            }
            if (newGroups[m].Permissions === undefined) {
                newGroups[m].Permissions = 0;
            }

            updateCriteria.$addToSet.Security.$each.push(newGroups[m]);
        }


        async.eachSeries(newGroups, function (newGroup, callback) {
            async.waterfall([

                function (wfCb) {
                    criteria = {
                        collection: userGroupsCollection,
                        query: {
                            _id: newGroup.groupId
                        }
                    };
                    Utility.getOne(criteria, function (err, group) {
                        wfCb(err, (group !== null) ? group.Users : null);
                    });
                },
                function (users, wfCb) {
                    if (searchFilters) {
                        let searchCriteria = {};
                        searchCriteria.name1 = {
                            '$regex': '(?i)' + '^' + searchFilters.name1
                        };
                        searchCriteria.name2 = {
                            '$regex': '(?i)' + '^' + searchFilters.name2
                        };
                        searchCriteria.name3 = {
                            '$regex': '(?i)' + '^' + searchFilters.name3
                        };
                        searchCriteria.name4 = {
                            '$regex': '(?i)' + '^' + searchFilters.name4
                        };

                        for (let user in users) {
                            updateCriteria.$addToSet.Security.$each.push({
                                userId: new ObjectID(user),
                                groupId: newGroup.groupId
                            });
                        }
                        criteria = {
                            collection: pointsCollection,
                            query: searchCriteria,
                            updateObj: updateCriteria,
                            options: {
                                multi: true
                            }
                        };
                        Utility.update(criteria, function (err) {
                            wfCb(err, true);
                        });
                    } else {
                        async.eachSeries(points, function (upi, cb2) {
                            let id;
                            if (upi.length < 12) {
                                id = parseInt(upi, 10);
                            } else {
                                id = new ObjectID(upi);
                            }
                            let searchCriteria = {
                                '_id': id
                            };

                            for (let user in users) {
                                updateCriteria.$addToSet.Security.$each.push({
                                    userId: new ObjectID(user),
                                    groupId: newGroup.groupId
                                });
                            }
                            criteria = {
                                collection: pointsCollection,
                                query: searchCriteria,
                                updateObj: updateCriteria,
                                options: {
                                    multi: true
                                }
                            };
                            Utility.update(criteria, function (err) {
                                cb2(err);
                            });
                        }, function (err) {
                            wfCb(err, true);
                        });
                    }
                }
            ], function (err) {
                callback(err);
            });
        }, function (err) {
            return cb(err);
        });
    }
    removeGroups(data, cb) {
        let groupUpis = (data['User Group Upis']) ? data['User Group Upis'] : [];
        let points = (data.Points) ? data.Points : [];
        let id;

        if (points.length < 1) {
            return cb('No points given.');
        }

        let updateCriteria = {
            $pull: {
                'Security': {
                    $and: []
                }
            }
        };

        for (let i = 0; i < groupUpis.length; i++) {
            updateCriteria.$pull.Security.$and.push({
                groupId: new ObjectID(groupUpis[i])
            });
        }

        async.eachSeries(points, function (upi, callback) {
            if (upi.length < 12) {
                id = parseInt(upi, 10);
            } else {
                id = new ObjectID(upi);
            }

            let searchCriteria = {
                '_id': id
            };

            let criteria = {
                collection: pointsCollection,
                query: searchCriteria,
                updateObj: updateCriteria
            };

            Utility.update(criteria, function (err) {
                callback(err);
            });
        }, cb);
    }
    addUsers(data, cb) {
        return cb('Deprecated. Not storing users on points- only groups.');
        /*newUsers = (data.Users) ? data.Users : [];
        points = (data.Points) ? data.Points : [];
        searchFilters = (data.searchFilters) ? data.searchFilters : null;

        if (points.length < 1 && !searchFilters) {
        return Utils.sendResponse(res, {
        err: "No point criteria given."
        });
        }

        count = 0;

        updateCriteria = {
        $addToSet: {
        "Security": {
        $each: []
        }
        }
        };

        updateUsers = [];

        for (i = 0; i < newUsers.length; i++) {
        if (typeof newUsers[i].userId !== "object")
        newUsers[i].userId = new ObjectID(newUsers[i].userId);

        newUsers[i].Permissions = parseInt(newUsers[i].Permissions, 10);

        if ((newUsers[i].Permissions & CONTROL) !== 0)
        newUsers[i].Permissions = newUsers[i].Permissions | READ;
        if ((newUsers[i].Permissions & WRITE) !== 0)
        newUsers[i].Permissions = newUsers[i].Permissions | READ | ACKNOWLEDGE | CONTROL;
        if (newUsers[i].Permissions === undefined)
        newUsers[i].Permissions = 0;
        }


        if (searchFilters) {
        searchCriteria = {};

        if (searchFilters.name1)
        searchCriteria.name1 = {
        '$regex': '(?i)' + "^" + searchFilters.name1
        };
        if (searchFilters.name2)
        searchCriteria.name2 = {
        '$regex': '(?i)' + "^" + searchFilters.name2
        };
        if (searchFilters.name3)
        searchCriteria.name3 = {
        '$regex': '(?i)' + "^" + searchFilters.name3
        };
        if (searchFilters.name4)
        searchCriteria.name4 = {
        '$regex': '(?i)' + "^" + searchFilters.name4
        };

        for (i = 0; i < newUsers.length; i++) {
        updateCriteria.$addToSet.Security.$each.push(newUsers[i]);
        }
        db.collection(pointsCollection).update(searchCriteria, updateCriteria, {
        multi: 1
        }, function(err, result) {
        if (err) return Utils.sendResponse(res, {
        err: err
        });
        return Utils.sendResponse(res, {
        message: "success"
        });
        });
        } else {
        async.eachSeries(points, function(upi, callback) {

        if (upi.length < 12) {
        id = parseInt(upi, 10);
        } else {
        id = new ObjectID(upi);
        }

        let searchCriteria = {
        "_id": id
        };

        db.collection(pointsCollection).findOne(searchCriteria, function(err, point) {

        for (j = 0; j < point.Security.length; j++) {
        for (m = 0; m < newUsers.length; m++) {
          if (point.Security[j].userId.equals(newUsers[m].userId) && point.Security[j].Permissions !== newUsers[m].Permissions) {
            updateUsers.push(newUsers[m]);
            newUsers.splice(m, 1);
            m--;
          }
        }
        }

        for (n = 0; n < newUsers.length; n++) {
        updateCriteria.$addToSet.Security.$each.push(newUsers[n]);
        }

        db.collection(pointsCollection).update(searchCriteria, updateCriteria, function(err, result) {
        if (updateUsers.length > 0) {
          async.eachSeries(updateUsers, function(user, cb) {
            permSearch = {
              _id: id,
              "Security.userId": user.userId
            };
            permUpdate = {
              $set: {
                "Security.$.Permissions": user.Permissions
              }
            };
            db.collection(pointsCollection).update(permSearch, permUpdate, function(err, result) {
              cb(err);
            });
          }, function(err) {
            callback(err);
          });
        } else {
          callback(err);
        }
        });
        });

        },
        function(err) {
        if (err) return Utils.sendResponse(res, {
        err: err
        });
        return Utils.sendResponse(res, {
        message: "success"
        });
        });
        }*/
    }
    removeUsers(data, cb) {
        return cb('Deprecated. Not storing users on points- only groups.');
        /*users = (data.userids) ? data.userids : [];
        points = (data.Points) ? data.Points : [];

        updateCriteria = {
        $pull: {
        "Security": {
        "userId": {
        $in: []
        }
        }
        }
        };

        if (points.length < 1) {
        return Utils.sendResponse(res, {
        err: "No points given."
        });
        }

        for (i = 0; i < users.length; i++) {
        updateCriteria.$pull.Security.userId.$in.push(
        new ObjectID(users[i])
        );
        }

        count = 0;


        async.each(points, function(upi, callback) {

        if (upi.length < 12) {
        id = parseInt(upi, 10);
        } else {
        id = new ObjectID(upi);
        }

        let searchCriteria = {
        "_id": id
        };

        db.collection(pointsCollection).update(searchCriteria, updateCriteria, function(err, result) {
        callback(err);
        });

        }, function(err) {
        if (err) return Utils.sendResponse(res, {
        err: err
        });

        return Utils.sendResponse(res, {
        message: "success"
        });
        });*/
    }
};

let Util = class Util {

    getPermissions(user, cb) {
        if (!!user['System Admin'].Value || !user) {
            return cb(null, true);
        }
        let userId = ObjectID(user._id);

        let calcPermissions = function (groups) {
            let points = {};
            for (let g = 0; g < groups.length; g++) {
                let pAccess = groups[g]._pAccess;
                let gPoints = groups[g].Points;
                for (let gPoint in gPoints) {
                    points[gPoint] |= pAccess;
                }
            }
            return points;
        };

        let queryStr = 'Users.' + userId;
        let query = {};
        query[queryStr] = {
            $exists: 1
        };

        Utility.get({
            collection: 'User Groups',
            query: query
        }, function (err, groups) {
            if (err || !groups.length) {
                console.log(err || 'no groups');
                return cb(err, false);
            }
            let pointPerm = calcPermissions(groups);
            return cb(err, pointPerm);
        });
    }

    updSecurity(point, callback) {
        // if (!point.hasOwnProperty('Security')) {
        return callback();
        // }
        // point.Security = point.Security.map(function (groupId) {
        //     return ObjectID(groupId);
        // });

        // let updateObj = {
        //     $set: {}
        // };
        // updateObj.$set['Points.' + point._id] = true;

        // Utility.update({
        //     collection: 'User Groups',
        //     query: {
        //         _id: {
        //             $in: point.Security
        //         }
        //     },
        //     updateObj: updateObj
        // }, function (err, group) {
        //     let updateObj = {
        //         $unset: {}
        //     };
        //     updateObj.$unset['Points.' + point._id] = 1;
        //     Utility.update({
        //         collection: 'User Groups',
        //         query: {
        //             _id: {
        //                 $nin: point.Security
        //             }
        //         },
        //         updateObj: updateObj
        //     }, function (err, group) {
        //         point.Security = [];
        //         return callback(err);
        //     });
        // });
    }
    updateControllers(op, username, callback) {
        let searchCriteria = {
            Name: 'Controllers'
        };

        let criteria = {
            collection: systemInfoCollection,
            query: searchCriteria
        };

        Utility.getOne(criteria, function (err, controllers) {
            if (op === 'add') {
                let id = 0;
                let ids = [];
                let maxId = 0;

                for (let a = 0; a < controllers.Entries.length; a++) {
                    ids.push(controllers.Entries[a]['Controller ID']);
                    maxId = (controllers.Entries[a]['Controller ID'] > maxId) ? controllers.Entries[a]['Controller ID'] : maxId;
                }

                for (let i = 0; i < ids.length; i++) {
                    if (ids[i] !== i + 1) {
                        id = i + 1;

                        if (ids.indexOf(id) === -1) {
                            break;
                        } else {
                            id = 0;
                        }
                    }
                }

                if (id === 0) {
                    id = maxId + 1;
                }

                controllers.Entries.push({
                    'Controller ID': id,
                    'Controller Name': username,
                    'Description': username,
                    isUser: true
                });

                criteria = {
                    collection: systemInfoCollection,
                    query: searchCriteria,
                    updateObj: {
                        $set: {
                            Entries: controllers.Entries
                        }
                    }
                };
                console.log(criteria);
                Utility.update(criteria, function (err) {
                    callback(err);
                });
            } else if (op === 'remove') {
                for (let j = 0; j < controllers.Entries.length; j++) {
                    if (controllers.Entries[j]['Controller Name'] === username) {
                        controllers.Entries.splice(j, 1);
                    }
                }
                criteria = {
                    collection: systemInfoCollection,
                    query: searchCriteria,
                    updateObj: {
                        $set: {
                            Entries: controllers.Entries
                        }
                    }
                };
                Utility.update(criteria, function (err) {
                    callback(err);
                });
            }
        });
    }
};

module.exports = {
    Users: Users,
    Groups: Groups,
    Points: Points,
    Utility: Util
};

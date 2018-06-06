const fs = require('fs');

const async = require('async');
const ObjectID = require('mongodb').ObjectID;

const Common = require('./common');
const utils = require('../helpers/utils.js');

const READ = utils.CONSTANTS('READ');

const UserGroups = class UserGroups extends Common {
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
        this.get(criteria, cb);
    }
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
            query: searchCriteria
        };

        this.get(criteria, (err, groups) => {
            if (err) {
                return cb(err);
            }
            if (groups.length === 0) {
                criteria = {
                    insertObj: insertCriteria
                };

                this.insert(criteria, (err) => {
                    if (err) {
                        return cb(err);
                    }
                    criteria = {
                        query: searchCriteria
                    };

                    this.getOne(criteria, cb);
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
                users.forEach((user) => {
                    updateCriteria.$set.Users[user.userid] = {};
                    updateCriteria.$set.Users[user.userid]['Group Admin'] = (user['Group Admin'] !== undefined && user['Group Admin'] === true) ? user['Group Admin'] : false;
                });
            }
            if (updateData._pAccess !== undefined) {
                updateCriteria.$set._pAccess = parseInt(updateData._pAccess, 10);
            }

            let criteria = {
                query: searchCriteria,
                updateObj: updateCriteria,
                options: {
                    upsert: 1
                }
            };

            this.update(criteria, (err) => {
                if (err) {
                    return cb(err);
                }

                criteria = {
                    query: {
                        _id: groupId
                    }
                };

                this.getOne(criteria, cb);
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
            query: searchCriteria
        };

        this.getOne(criteria, cb);
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

            groupIds.forEach((groupId) => {
                users.forEach((user) => {
                    async.waterfall([

                        (callback) => {
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
                                query: searchCriteria,
                                updateObj: updateCriteria,
                                options: options
                            };
                            this.update(criteria, (err, result) => {
                                if (err) {
                                    callback(err, null);
                                }
                                count++;
                                if (count === users.length) {
                                    criteria = {
                                        query: result
                                    };
                                    this.getOne(criteria, callback);
                                }
                            });
                        },
                        (group, callback) => {
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
                                query: searchCriteria,
                                updateObj: updateCriteria,
                                options: {
                                    multi: 1
                                }
                            };

                            this.update(criteria, (err) => {
                                callback(err, {
                                    'message': 'success'
                                });
                            });
                        }
                    ], (err, result) => {
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

            groupIds.forEach((groupId) => {
                let count = 0;
                users.forEach((user) => {
                    async.waterfall([

                        (callback) => {
                            let searchCriteria = {
                                _id: groupId
                            };
                            let updateCriteria = {
                                $set: {}
                            };

                            criteria = {
                                query: searchCriteria
                            };

                            this.getOne(criteria, (err, group) => {
                                if (group.Users[user]) {
                                    delete group.Users[user];
                                }

                                updateCriteria.$set.Users = group.Users;
                                criteria = {
                                    query: searchCriteria,
                                    updateObj: searchCriteria
                                };

                                this.update(criteria, (err, result) => {
                                    if (err) {
                                        callback(err, null);
                                    }

                                    count++;

                                    if (count === users.length) {
                                        criteria = {
                                            query: result
                                        };

                                        this.getOne(criteria, (err, group) => {
                                            callback(null, group);
                                        });
                                    }
                                });
                            });
                        },
                        (group, callback) => {
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
                                query: searchCriteria,
                                updateObj: updateCriteria,
                                options: {
                                    multi: true
                                }
                            };
                            this.getOne(criteria, (err) => {
                                if (err) {
                                    return callback(err, null);
                                }
                                return callback(null, {
                                    'message': 'success'
                                });
                            });
                        }
                    ], (err, result) => {
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
                query: removeCriteria
            };
            this.remove(criteria, (err) => {
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
                    query: searchCriteria,
                    updateObj: updateCriteria,
                    options: {
                        multi: true
                    }
                };
                this.remove(criteria, cb);
            });
        } else {
            return cb('No group given');
        }
    }
    getAllGroups(data, cb) {
        let searchCriteria = {};
        let criteria = {
            query: searchCriteria
        };

        this.get(criteria, (err, groups) => {
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
            query: searchCriteria
        };
        this.get(criteria, (err, points) => {
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
            query: searchCriteria
        };
        this.getOne(criteria, cb);
    }
    editPhoto(data, cb) {
        let userid = ObjectID(data.user);
        let image = data.image;
        let filename = data.name;
        let imgData = image.replace(/^data:image\/\w+;base64,/, '');

        fs.writeFile(process.cwd() + '/public/img/client/users/' + filename, imgData, 'base64', (err) => {
            if (!err) {
                let criteria = {
                    query: {
                        _id: userid
                    },
                    updateObj: {
                        $set: {
                            'Photo': filename
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
    updatePermissions(data, cb) {
        let groups = data.groups;

        async.each(groups, (group, callback) => {
            this.updateOne({
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

module.exports = UserGroups;

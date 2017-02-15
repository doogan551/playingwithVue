const ObjectID = require('mongodb').ObjectID;

const UserGroup = new(require('./usergroup'))();
const System = new(require('./system'))();

const Security = class Security {

    getPermissions(user, cb) {
        if (!!user['System Admin'].Value || !user) {
            return cb(null, true);
        }
        let userId = ObjectID(user._id);

        let calcPermissions = (groups) => {
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

        UserGroup.getAll({
            query: query
        }, (err, groups) => {
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
        // point.Security = point.Security.map((groupId) => {
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
        // }, (err, group) => {
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
        //     }, (err, group) => {
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
            query: searchCriteria
        };

        System.getOne(criteria, (err, controllers) => {
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
                    query: searchCriteria,
                    updateObj: {
                        $set: {
                            Entries: controllers.Entries
                        }
                    }
                };
                System.updateOne(criteria, (err) => {
                    callback(err);
                });
            } else if (op === 'remove') {
                for (let j = 0; j < controllers.Entries.length; j++) {
                    if (controllers.Entries[j]['Controller Name'] === username) {
                        controllers.Entries.splice(j, 1);
                    }
                }
                criteria = {
                    query: searchCriteria,
                    updateObj: {
                        $set: {
                            Entries: controllers.Entries
                        }
                    }
                };
                System.updateOne(criteria, (err) => {
                    callback(err);
                });
            }
        });
    }
};

module.exports = Security;

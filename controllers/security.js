let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils');
let User = require('../models/user');
let UserGroup = require('../models/usergroup');
let Point = require('../models/point');

let user = new User();
let userGroup = new UserGroup();
let point = new Point();

// Checked
router.post('/groups/savegroup', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.saveGroup(data, function (err, newGroup) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, newGroup);
    });
});
// NOT CHECKED
router.post('/groups/getusers', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.getUsers(data, function (err, group) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            Users: group.Users
        });
    });
});
// NOT CHECKED
router.post('/groups/addusers', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.addUsers(data, function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, result);
    });
});
// NOT CHECKED
router.post('/groups/removeusers', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.removeUsers(data, function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, result);
    });
});
// Checked
router.post('/groups/removegroup', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.removeGroup(data, function (err, users) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// Checked
router.post('/groups/getallgroups', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.getAllGroups(data, function (err, groups) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, groups);
    });
});
// NOT CHECKED
router.post('/groups/getpoints', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.getPoints(data, function (err, points) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, points);
    });
});
router.post('/groups/updatePermissions', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.updatePermissions(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// NOT CHECKED
router.post('/users/getgroups', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.getGroups(data, function (err, groups) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, groups);
    });
});
// Checked
router.post('/users/removeuser', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.removeUser(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// Checked
router.post('/users/getallusers', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.getAllUsers(data, function (err, users) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, users);
    });
});
// NOT CHECKED
router.post('/points/addgroups', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    point.addGroups(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// NOT CHECKED
router.post('/points/removegroups', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    point.removeGroups(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// NOT CHECKED
router.post('/points/addusers', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    point.addUsers(data, function (err, users) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {});
    });
});
// NOT CHECKED
router.post('/points/removeusers', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    point.removeUsers(data, function (err, users) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {});
    });
});

// NOT CHECKED
router.post('/users/createpassword', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.createPassword(data, function (err, text) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            password: text
        });
    });
});
// Checked
router.post('/users/saveuser', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.saveUser(data, function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, result);
    });
});
// Checked
router.post('/users/editPhoto', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data._user = req.user;

    user.editPhoto(data, function (err, filename) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            imageUrl: filename
        });
    });
});
// Checked
router.post('/groups/editPhoto', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data._user = req.user;

    userGroup.editPhoto(data, function (err, filename) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            imageUrl: filename
        });
    });
});
// NOT CHECKED
router.post('/users/newuser', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.newUser(data, function (err, newUser) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, newUser);
    });
});
// CHECKED
router.post('/users/updateuser', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.updateUser(data, function (err, newUser) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, newUser);
    });
});
// NOT CHECKED
router.post('/groups/updategroup', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.updateGroup(data, function (err, newGroup) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, newGroup);
    });
});
// NOT CHECKED
router.post('/groups/newgroup', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.newGroup(data, function (err, newGroup) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, newGroup);
    });
});
// NOT CHECKED
router.post('/groups/:id', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    userGroup.getGroup(data, function (err, group) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, group);
    });
});
// NOT CHECKED
router.post('/users/:id', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    user.getUser(data, function (err, user) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, user);
    });
});

module.exports = router;

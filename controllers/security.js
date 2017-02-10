let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Security = require('../models/security');
let Users = new Security.Users();
let Groups = new Security.Groups();
let Points = new Security.Points();

// Checked
router.post('/groups/savegroup', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Groups.saveGroup(data, function (err, newGroup) {
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

    Groups.getUsers(data, function (err, group) {
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

    Groups.addUsers(data, function (err, result) {
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

    Groups.removeUsers(data, function (err, result) {
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

    Groups.removeGroup(data, function (err, users) {
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

    Groups.getAllGroups(data, function (err, groups) {
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

    Groups.getPoints(data, function (err, points) {
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

    Groups.updatePermissions(data, function (err, results) {
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

    Users.getGroups(data, function (err, groups) {
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

    Users.removeUser(data, function (err) {
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

    Users.getAllUsers(data, function (err, users) {
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

    Points.addGroups(data, function (err) {
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

    Points.removeGroups(data, function (err) {
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

    Points.addUsers(data, function (err, users) {
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

    Points.removeUsers(data, function (err, users) {
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

    Users.createPassword(data, function (err, text) {
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

    Users.saveUser(data, function (err, result) {
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

    Users.editPhoto(data, function (err, filename) {
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

    Groups.editPhoto(data, function (err, filename) {
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

    Users.newUser(data, function (err, newUser) {
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

    Users.updateUser(data, function (err, newUser) {
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

    Groups.updateGroup(data, function (err, newGroup) {
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

    Groups.newGroup(data, function (err, newGroup) {
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

    Groups.getGroup(data, function (err, group) {
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

    Users.getUser(data, function (err, user) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, user);
    });
});

module.exports = router;

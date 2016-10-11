var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Security = require('../models/security');
// Checked
router.post('/groups/savegroup', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.saveGroup(data, function(err, newGroup) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, newGroup);
  });
});
// NOT CHECKED
router.post('/groups/getusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getUsers(data, function(err, group) {
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
router.post('/groups/addusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.addUsers(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, result);
  });
});
// NOT CHECKED
router.post('/groups/removeusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.removeUsers(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, result);
  });
});
// Checked
router.post('/groups/removegroup', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.removeGroup(data, function(err, users) {
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
router.post('/groups/getallgroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getAllGroups(data, function(err, groups) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, groups);
  });
});
// NOT CHECKED
router.post('/groups/getpoints', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getPoints(data, function(err, points) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, points);
  });
});
// NOT CHECKED
router.post('/users/getgroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.getGroups(data, function(err, groups) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, groups);
  });
});
// Checked
router.post('/users/removeuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.removeUser(data, function(err) {
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
router.post('/users/getallusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.getAllUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, users);
  });
});
// NOT CHECKED
router.post('/points/addgroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.addGroups(data, function(err) {
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
router.post('/points/removegroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.removeGroups(data, function(err) {
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
router.post('/points/addusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.addUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {});
  });
});
// NOT CHECKED
router.post('/points/removeusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.removeUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {});
  });
});

router.get('/points/getGroups/:upi', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.getGroups(data, function(err, groups) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, groups);
  });
});
// NOT CHECKED
router.post('/users/createpassword', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.createPassword(data, function(err, text) {
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
router.post('/users/saveuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.saveUser(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, result);
  });
});
// Checked
router.post('/users/editPhoto', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data._user = req.user;

  Security.Users.editPhoto(data, function(err, filename) {
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
router.post('/groups/editPhoto', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data._user = req.user;

  Security.Groups.editPhoto(data, function(err, filename) {
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
router.post('/users/newuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.newUser(data, function(err, newUser) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, newUser);
  });
});
// CHECKED
router.post('/users/updateuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.updateUser(data, function(err, newUser) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, newUser);
  });
});
// NOT CHECKED
router.post('/groups/updategroup', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.updateGroup(data, function(err, newGroup) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, newGroup);
  });
});
// NOT CHECKED
router.post('/groups/newgroup', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.newGroup(data, function(err, newGroup) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, newGroup);
  });
});
// NOT CHECKED
router.post('/groups/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getGroup(data, function(err, group) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, group);
  });
});
// NOT CHECKED
router.post('/users/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.getUser(data, function(err, user) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, user);
  });
});

module.exports = router;
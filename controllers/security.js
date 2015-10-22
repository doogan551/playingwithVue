var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Security = require('../models/security');

router.post('/groups/savegroup', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.saveGroup(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/getusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/addusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.addUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/removeusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.removeUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

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
      Users: users
    });
  });
});

router.post('/groups/getallgroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getAllGroups(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/getpoints', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getPoints(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/users/getgroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.getGroups(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/users/removeuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.removeUser(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/users/getallusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.getAllUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/security/users/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.getUser(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/points/addgroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.addGroups(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/points/removegroups', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.removeGroups(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/points/addusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.addUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/points/removeusers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Points.removeUsers(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/users/createpassword', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.createPassword(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/users/saveuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.saveUser(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/users/editPhoto', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.editPhoto(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/editPhoto', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.editPhoto(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/security/users/newuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.newUser(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/users/updateuser', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Users.udpateUser(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/updategroup', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.updateGroup(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/newgroup', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.newGroup(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});

router.post('/groups/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.Groups.getGroup(data, function(err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    return utils.sendResponse(res, {
      Users: users
    });
  });
});


module.exports = router;
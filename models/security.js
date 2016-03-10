var async = require('async');

var Utility = require('../models/utility');
var User = require('../models/user');
var config = require('../public/js/lib/config.js');
var utils = require('../helpers/utils.js');
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var logger = require('../helpers/logger')(module);

var pointsCollection = utils.CONSTANTS("pointsCollection");
var usersCollection = utils.CONSTANTS("usersCollection");
var userGroupsCollection = utils.CONSTANTS("userGroupsCollection");
var systemInfoCollection = utils.CONSTANTS("systemInfoProperties");
var READ = utils.CONSTANTS("READ");
var ACKNOWLEDGE = utils.CONSTANTS("ACKNOWLEDGE");
var CONTROL = utils.CONSTANTS("CONTROL");
var WRITE = utils.CONSTANTS("WRITE");

var Users = {
  saveUser: function(data, cb) {
    if (data.userid !== undefined) {
      this.updateUser(data, cb);
    } else {
      this.newUser(data, cb);
    }
  },
  newUser: function(data, cb) {
    var username = data.username;
    var password = utils.encrypt(data.Password);

    var searchCriteria = {
      username: username
    };
    var userTemplate = {
      "alerts": {
        'Normal': [],
        'Emergency': [],
        'Critical': [],
        'Urgent': []
      },
      "Auto Logout Duration": {
        "Value": "0"
      },
      "Contact Info": {
        "Value": [{
          "Type": " Phone",
          "Value": ""
        }, {
          "Type": "Cell Phone",
          "Value": ""
        }, {
          "Type": "Email",
          "Value": ""
        }, {
          "Type": "Pager",
          "Value": ""
        }]
      },
      "Description": {
        "Value": ""
      },
      "First Name": {
        "Value": ""
      },
      "Last Activity Time": {
        "Value": 0
      },
      "Last Login Time": {
        "Value": 0
      },
      "Last Name": {
        "Value": ""
      },
      'notificationsEnabled': true,
      "Password": {
        "Value": ""
      },
      "Password Reset": {
        "Value": true
      },
      "Photo": {
        "Value": ""
      },
      "System Admin": {
        "Value": false
      },
      "Title": {
        "Value": ""
      },
      "username": ""
    };

    if (data["First Name"])
      userTemplate["First Name"].Value = data["First Name"];
    if (data["Last Name"])
      userTemplate["Last Name"].Value = data["Last Name"];
    if (data.Photo)
      userTemplate.Photo.Value = data.Photo;
    if (data.Title)
      userTemplate.Title.Value = data.Title;
    if (data["Contact Info"])
      userTemplate["Contact Info"].Value = data["Contact Info"];
    if (data["Auto Logout"])
      userTemplate["Auto Logout Duration"].Value = data["Auto Logout"];
    if (data.Description)
      userTemplate.Description.Value = data.Description;
    if (data["System Admin"]) {
      userTemplate["System Admin"].Value = data["System Admin"];
      if (userTemplate["System Admin"].Value == "true")
        userTemplate["System Admin"].Value = true;
      else if (userTemplate["System Admin"].Value == "false")
        userTemplate["System Admin"].Value = false;
    }
    if (data.hasOwnProperty('Password Reset')) {
      userTemplate['Password Reset'].Value = data['Password Reset'];
    }

    userTemplate.username = username;

    userTemplate.Password.Value = password;

    var groups = (data["User Groups"]) ? data["User Groups"] : [];

    var count = 0;

    var pwdReset = true;

    var criteria = {
      collection: systemInfoCollection,
      query: {
        Name: "Controllers"
      }
    };

    Utility.get(criteria, function(err, conts) {
      for (var i = 0; i < conts[0]["Entries"].length; i++) {
        if (conts[0]["Entries"][i]["Controller Name"] === username) {
          return cb(null, {
            message: "This controller name already exists."
          });
        }
      }

      criteria = {
        collection: usersCollection,
        query: searchCriteria
      };
      Utility.get(criteria, function(err, docs) {
        if (docs.length > 0) {
          return cb(null, {
            message: "This username already exists."
          });
        } else {
          criteria = {
            collection: usersCollection,
            insertObj: userTemplate
          };

          Utility.insert(criteria, function(err, userArray) {

            if (err) {
              return cb(err);
            } else {
              // TODO Add function
              updateControllers("add", userTemplate.username, function(err) {
                if (userArray) {
                  user = userArray.ops[0];
                }

                if (groups.length > 0) {
                  var groupCount = 0;
                  groups.forEach(function(group) {

                    if (group.groupid.length < 12) {
                      group.groupid = parseInt(group.groupid, 10);
                    } else {
                      group.groupid = new ObjectID(group.groupid);
                    }

                    async.waterfall([

                      function(callback) {
                        searchCriteria = {
                          _id: group.groupId
                        };
                        updateCriteria = {
                          $set: {}
                        };
                        adminString = "Users." + user._id + ".Group Admin";
                        usernameString = "Users." + user._id + ".username";
                        if (group["Group Admin"] === true || group["Group Admin"] === "true") {
                          updateCriteria.$set[adminString] = true;
                        } else {
                          updateCriteria.$set[adminString] = false;
                        }

                        options = {
                          upsert: true
                        };

                        criteria = {
                          collection: userGroupsCollection,
                          query: searchCriteria,
                          updateObj: updateCriteria,
                          options: options
                        };
                        Utility.update(criteria, function(err, result) {
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
                      function(newGroup, callback) {
                        searchCriteria = {
                          "Security": {
                            $elemMatch: {
                              "groupId": newGroup._id
                            }
                          }
                        };

                        criteria = {
                          collection: pointsCollection,
                          query: searchCriteria
                        };

                        Utility.get(criteria, function(err, points) {
                          async.eachSeries(points, function(point, eachCB) {

                            updateCriteria = {
                              $push: {
                                "Security": {
                                  "groupId": newGroup._id,
                                  "userId": user._id
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

                            Utility.udpate(criteria, function(err, groups) {
                              eachCB(err);
                            });

                          }, callback);
                        });
                      }
                    ], function(err, result) {
                      if (err) {
                        return cb(err);
                      }

                      groupCount++;

                      if (groupCount == groups.length) {
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

            }

          });
        }
      });
    });
  },
  updateUser: function(data, cb) {
    var updateData = data["Update Data"];
    var groups = (updateData["User Groups"] !== undefined) ? updateData["User Groups"] : [];

    var userid = data.userid;

    if (userid.length < 12) {
      userid = parseInt(userid, 10);
    } else {
      userid = new ObjectID(userid);
    }

    var searchCriteria = {
      "_id": userid
    };

    var updateCriteria = {
      $set: {}
    };
    Utility.getOne({
      collection: usersCollection,
      query: searchCriteria
    }, function(err, dbUser) {

      for (var key in updateData) {
        if (key === 'Contact Info') {
          var contact = updateData[key];
          for(var c = 0; c<contact.length; c++){
            if(['SMS','Voice'].indexOf(contact[c].Type) >= 0){
              contact[c].Value = contact[c].Value.match(/\d+/g).join('');
            }
          }
          var alerts = dbUser.alerts;

          for (var almClass in alerts) {
            for (var a = 0; a < alerts[almClass].length; a++) {
              var alert = alerts[almClass][a];
              var exists = false;

              for (var i = 0; i < contact.length; i++) {
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
        if (key == "username") {
          updateCriteria.$set[key] = updateData[key];
          updateCriteria.$set["Username.Value"] = updateData[key];
        } else if (key == "Password") {
          password = utils.encrypt(updateData[key]);
          value = key + ".Value";
          updateCriteria.$set[value] = password;
        } else if (key != "_id" && key != "User Groups") {
          value = key + ".Value";
          updateCriteria.$set[value] = updateData[key];
        }
      }


      var criteria = {
        collection: usersCollection,
        query: searchCriteria,
        updateObj: updateCriteria
      };
      Utility.update(criteria, function(err, result) {

        if (err) {
          return cb(err);
        }

        var deleteSearch = {};
        deleteSearch["Point Type"] = {};
        deleteSearch["Point Type"].Value = "User Group";

        var userVar = "Users." + userid;
        deleteSearch[userVar] = {};
        deleteSearch[userVar].$exists = true;

        var delCount = 0;

        criteria = {
          collection: userGroupsCollection,
          query: deleteSearch
        };
        Utility.get(criteria, function(err, delGroups) {
          var i;
          var groupsToRemove = [];
          if (groups.length > 0) {
            for (i = 0; i < delGroups.length; i++) {
              for (var j = 0; j < groups.length; j++) {
                if (groups[j] == delGroups[i])
                  break;
                if (j == (groups.length - 1))
                  groupsToRemove.push(delGroups[i]);
              }
            }
          } else {
            groupsToRemove = delGroups;
          }

          if (groupsToRemove.length > 0) {
            groupsToRemove.forEach(function(groupToRemove) {
              async.waterfall([

                function(callback) {
                  var delSearch = {
                    _id: groupToRemove._id
                  };

                  criteria = {
                    collection: userGroupsCollection,
                    query: delSearch
                  };
                  Utility.getOne(criteria, function(err, delGroup) {
                    delete delGroup.Users[userid];

                    criteria = {
                      collection: userGroupsCollection,
                      query: delSearch,
                      updateObj: delGroup
                    };
                    Utility.update(criteria, function(err, updatedGroup) {
                      callback(err, delGroup);
                    });
                  });
                },
                function(delGroup, callback) {
                  var delGroupSearch = {
                    "Security": {
                      $elemMatch: {
                        "groupId": groupToRemove._id
                      }
                    }
                  };
                  var updateCriteria = {
                    $pull: {
                      "Security": {
                        "groupId": groupToRemove._id,
                        "userId": userid
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
                  Utility.update(criteria, function(err, updatedGroup) {
                    callback(err, delGroup);
                  });

                }
              ], function(err, finalGroup) {
                delCount++;
                if (delCount == groupsToRemove.length) {
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
      var count = 0;
      var criteria = {};

      if (groups.length > 0) {

        criteria = {
          collection: usersCollection,
          query: searchCriteria
        };

        Utility.getOne(criteria, function(err, user) {
          if (err) {
            return cb(err);
          }
          groups.forEach(function(group) {
            if (group.groupid.length < 12) {
              group.groupid = parseInt(group.groupid, 10);
            } else {
              group.groupid = new ObjectID(group.groupid);
            }

            async.waterfall([

              function(callback) {
                searchCriteria = {
                  _id: group.groupid
                };
                var updateCriteria = {
                  $set: {}
                };
                var adminString = "Users." + userid + ".Group Admin";
                var usernameString = "Users." + userid + ".username";
                if (group["Group Admin"] === true || group["Group Admin"] === "true")
                  updateCriteria.$set[adminString] = true;
                else
                  updateCriteria.$set[adminString] = false;

                //updateCriteria.$set[usernameString] = user.username;

                var options = {
                  upsert: true
                };

                criteria = {
                  collection: userGroupsCollection,
                  query: searchCriteria,
                  updateObj: updateCriteria,
                  options: options
                };
                Utility.update(criteria, function(err, result) {
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
              function(newGroup, callback) {
                searchCriteria = {
                  "Security": {
                    $elemMatch: {
                      "groupId": newGroup._id
                    }
                  }
                };

                criteria = {
                  collection: pointsCollection,
                  query: searchCriteria
                };
                Utility.get(criteria, function(err, points) {
                  if (err) {
                    return callback(err);
                  }
                  async.eachSeries(points, function(point, eachCB) {
                    Permissions = 0;

                    updateCriteria = {
                      $push: {
                        "Security": {
                          "groupId": newGroup._id,
                          "userId": user._id
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
                    Utility.update(criteria, function(err, groups) {
                      eachCB(err);
                    });
                  }, callback);
                });
              }
            ], function(err, result) {
              if (err) {
                return cb(err);
              }

              count++;
              if (count == groups.length) {
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

var Groups = {
  saveGroup: function(data, cb) {
    if (data["User Group Upi"] !== undefined) {
      this.updateGroup(data, cb);
    } else {
      this.newGroup(data, cb);
    }
  },
  newGroup: function(data, cb) {
    var groupName = data["User Group Name"];
    var users = (data.Users) ? data.Users : [];
    var description = (data.Description) ? data.Description : "";

    if (!groupName) {
      return cb("No group name given.");
    }

    var userObj = {};
    for (var i = 0; i < users.length; i++) {
      if (users[i].userid !== undefined) {
        userObj[users[i].userid] = {};

        if (users[i]["Group Admin"] === "true" || users[i]["Group Admin"] === true) {
          userObj[users[i].userid]["Group Admin"] = true;
        } else {
          userObj[users[i].userid]["Group Admin"] = false;
        }
      }
    }


    var searchCriteria = {
      "User Group Name": groupName
    };
    var insertCriteria = {
      "User Group Name": groupName,
      "Users": userObj,
      "Description": description,
      _pAccess: parseInt(data._pAccess, 10) | READ,
      "Photo": {
        Value: ''
      }
    };

    var criteria = {
      collection: userGroupsCollection,
      query: searchCriteria
    };

    Utility.get(criteria, function(err, groups) {
      if (err) {
        return cb(err);
      }
      if (groups.length === 0) {
        criteria = {
          collection: userGroupsCollection,
          insertObj: insertCriteria
        };

        Utility.insert(criteria, function(err, result) {
          if (err) {
            return cb(err);
          } else {
            criteria = {
              collection: userGroupsCollection,
              query: searchCriteria
            };

            Utility.getOne(criteria, cb);
          }
        });
      } else {
        return cb("Group already exists");
      }
    });
  },
  updateGroup: function(data, cb) {
    var groupName = data["User Group Name"];
    var groupUpi = data["User Group Upi"];
    var updateData = data["Update Data"];
    var users = (updateData.Users !== undefined) ? updateData.Users : [];
    var usersChange = false;

    var searchCriteria = {};
    if (groupUpi) {

      if (groupUpi.length < 12) {

        groupId = parseInt(groupUpi, 10);
      } else {

        groupId = new ObjectID(groupUpi);
      }
      searchCriteria = {
        _id: groupId
      };

      var updateCriteria = {
        $set: {}
      };

      for (var key in updateData) {
        if (key == "User Group Name" || key == "Description")
          updateCriteria.$set[key] = updateData[key];
      }

      updateCriteria.$set.Users = {};
      if (users.length !== 0) { // users on group obj
        users.forEach(function(user) {
          updateCriteria.$set.Users[user.userid] = {};
          updateCriteria.$set.Users[user.userid]["Group Admin"] = (user["Group Admin"] !== undefined && user["Group Admin"] === true) ? user["Group Admin"] : false;
        });
      }
      if (updateData._pAccess !== undefined) {
        updateCriteria.$set._pAccess = parseInt(updateData._pAccess, 10);
      }

      var criteria = {
        collection: userGroupsCollection,
        query: searchCriteria,
        updateObj: updateCriteria,
        options: {
          upsert: 1
        }
      };

      Utility.update(criteria, function(err, result) {
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
      return cb("No group given");
    }
  }

};

var updateControllers = function(op, username, callback) {
  var searchCriteria = {
    Name: "Controllers"
  };

  var criteria = {
    collection: systemInfoCollection,
    query: searchCriteria
  };

  Utility.getOne(criteria, function(err, controllers) {
    if (op === "add") {
      var id = 0;
      var ids = [];
      var maxId = 0;

      for (var a = 0; a < controllers.Entries.length; a++) {
        ids.push(controllers.Entries[a]["Controller ID"]);
        maxId = (controllers.Entries[a]["Controller ID"] > maxId) ? controllers.Entries[a]["Controller ID"] : maxId;
      }

      for (var i = 0; i < ids.length; i++) {
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
        "Controller ID": id,
        "Controller Name": username,
        "Description": username,
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
      Utility.update(criteria, function(err, result) {
        callback(err);
      });
    } else if (op === "remove") {
      for (var j = 0; j < controllers.Entries.length; j++) {
        if (controllers.Entries[j]["Controller Name"] === username) {
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
      Utility.update(criteria, function(err, result) {
        callback(err);
      });
    }

  });
};

module.exports = {
  Users: {
    getAllUsers: function(data, cb) {
      var properties;
      var returnUsers = [];
      var i;
      var j;
      var tempObj;

      var searchCriteria = {};
      var criteria = {
        collection: 'Users',
        query: {}
      };

      User.get(criteria, function(err, users) {
        if (err) {
          return cb(err);
        }
        properties = data.Properties;

        if (properties !== undefined) {
          for (i = 0; i < users.length; i++) {
            tempObj = {};
            for (j = 0; j < properties.length; j++) {

              if (typeof users[i][properties[j]] == 'undefined') {
                continue;
              }

              if (typeof users[i][properties[j]].Value == 'undefined') {
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
    },
    getGroups: function(data, cb) {
      var user = data.User;

      var userString = "Users." + user;

      var searchCriteria = {};
      searchCriteria[userString] = {
        $exists: true
      };
      var criteria = {
        collection: userGroupsCollection,
        query: searchCriteria
      };
      Utility.get(criteria, function(err, groups) {
        if (err) {
          return cb(err);
        }
        var returnArray = [];

        for (i = 0; i < groups.length; i++) {
          returnArray.push({
            "User Group Name": groups[i]["User Group Name"],
            "User Group Id": groups[i]._id
          });
        }

        return cb(null, returnArray);
      });
    },
    removeUser: function(data, cb) {
      var userid = data.userid;

      if (userid.length < 12) {
        userid = parseInt(userid, 10);
      } else {
        userid = new ObjectID(userid);
      }

      var searchCriteria = {
        "_id": userid
      };

      var groupCount = 0;
      var pointCount = 0;

      var criteria = {
        collection: usersCollection,
        query: searchCriteria,
        fields: {
          _id: 0,
          username: 1
        }
      };
      Utility.getOne(criteria, function(err, username) {
        Utility.remove(criteria, function(err, result) {
          if (err) {
            return cb(err);
          }

          async.waterfall([

              function(callback) {
                // TODO Add fx
                updateControllers("remove", username.username, callback);
              },

              function(callback) {

                var groupSearch = {};
                var groupSearchString = "Users." + userid;
                groupSearch[groupSearchString] = {
                  $exists: true
                };

                criteria = {
                  collection: userGroupsCollection,
                  query: groupSearch
                };
                Utility.get(criteria, function(err, groups) {
                  if (err) {
                    return cb(err);
                  }

                  if (groups.length > 0) {
                    groups.forEach(function(group) {
                      delete group.Users[userid];
                      groupUpdate = {
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
                      Utility.update(criteria, function(err, result2) {
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
              function(groups, callback) {
                var updateSearch, updateCriteria;
                updateSearch = {
                  Security: {
                    $elemMatch: {
                      userId: userid
                    }
                  }
                };

                updateCriteria = {
                  $pull: {
                    "Security": {
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
                Utility.update(criteria, function(err, groups) {
                  return callback(err, {
                    "message": "success"
                  });
                });
              }
            ],
            cb);
        });
      });
    },
    getUser: function(data, cb) {
      var id = data.id;

      if (id.length < 12) {
        upi = parseInt(id, 10);
      } else {
        upi = new ObjectID(id);
      }

      var searchCriteria = {
        _id: upi
      };

      var criteria = {
        collection: usersCollection,
        query: searchCriteria
      };
      Utility.getOne(criteria, cb);
    },
    createPassword: function(data, cb) {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (i = 0; i < 8; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      return cb(null, text);
    },
    editPhoto: function(data, cb) {
      var userid = ObjectID(data.user);
      var image = data.image;
      var filename = data.name;
      var imgData = image.replace(/^data:image\/\w+;base64,/, "");

      fs.writeFile(process.cwd() + '/public/img/users/' + filename, imgData, 'base64', function(err) {
        if (!err) {
          var criteria = {
            collection: usersCollection,
            query: {
              _id: userid
            },
            updateObj: {
              $set: {
                "Photo.Value": filename
              }
            }
          };
          Utility.update(criteria, function(err, result) {
            if (err) {
              return cb(err);
            } else {
              return cb(null, filename);
            }
          });
        } else {
          return cb(err);
        }
      });
    },
    saveUser: Users.saveUser,
    newUser: Users.newUser,
    updateUser: Users.updateUser
  },
  Groups: {
    getUsers: function(data, cb) {
      var groupUpi = data["User Group Upi"];

      var id = new ObjectID(groupUpi);

      var searchCriteria = {};
      if (id) {
        searchCriteria = {
          "_id": id
        };
      } else {
        return cb("No groups given");
      }

      var criteria = {
        collection: userGroupsCollection,
        query: searchCriteria
      };

      Utility.getOne(criteria, cb);
    },
    addUsers: function(data, cb) {
      var groupUpis = data["User Group Upis"];
      var users = (data.Users !== undefined) ? data.Users : [];
      var criteria = {};

      var count = 0;

      if (groupUpis) {

        var groupIds = [];
        for (a = 0; a < groupUpis.length; a++) {
          if (groupUpis[a].length < 12) {
            groupIds.push(parseInt(groupUpis[a], 10));
          } else {
            groupIds.push(new ObjectID(groupUpis[a]));
          }
        }
        var groupCount = 0;

        groupIds.forEach(function(groupId) {

          users.forEach(function(user) {
            async.waterfall([

              function(callback) {
                var searchCriteria, updateCriteria,
                  adminString, usernameString, options;
                searchCriteria = {
                  _id: groupId
                };
                updateCriteria = {
                  $set: {}
                };
                adminString = "Users." + user.userid + ".Group Admin";
                usernameString = "Users." + user.userid + ".username";
                if (user["Group Admin"] === true || user["Group Admin"] === "true")
                  updateCriteria.$set[adminString] = true;
                else
                  updateCriteria.$set[adminString] = false;

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
                Utility.update(criteria, function(err, result) {
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
              function(group, callback) {
                var usersString, searchCriteria, updateCriteria;
                usersString = "User Groups." + group._id;
                searchCriteria = {};
                searchCriteria[usersString] = {
                  $exists: true
                };

                updateCriteria = {
                  $set: {}
                };

                updateCriteria.$set["User Groups." + group._id + ".Users"] = group.Users;

                criteria = {
                  collection: userGroupsCollection,
                  query: searchCriteria,
                  updateObj: updateCriteria,
                  options: {
                    multi: 1
                  }
                };

                Utility.update(criteria, function(err, groups) {
                  callback(err, {
                    "message": "success"
                  });
                });
              }
            ], function(err, result) {
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
        return cb("No groups given");
      }
    },
    removeUsers: function(data, cb) {
      var users = data.Users ? data.Users : [];
      var groupUpis = (data["User Group Upis"]) ? data["User Group Upis"] : [];
      var criteria = {};

      if (groupUpis) {

        var groupIds = [];
        for (a = 0; a < groupUpis.length; a++) {
          if (groupUpis[a].length < 12) {
            groupIds.push(parseInt(groupUpis[a], 10));
          } else {
            groupIds.push(new ObjectID(groupUpis[a]));
          }
        }
        var groupCount = 0;

        groupIds.forEach(function(groupId) {
          var count = 0;
          users.forEach(function(user) {
            async.waterfall([

              function(callback) {
                var searchCriteria = {
                  _id: groupId
                };
                var updateCriteria = {
                  $set: {}
                };

                criteria = {
                  collection: userGroupsCollection,
                  query: searchCriteria
                };

                Utility.getOne(criteria, function(err, group) {
                  if (group.Users[user]) {
                    delete group.Users[user];
                  }

                  updateCriteria.$set.Users = group.Users;
                  criteria = {
                    collection: userGroupsCollection,
                    query: searchCriteria,
                    updateObj: searchCriteria
                  };

                  Utility.update(criteria, function(err, result) {
                    if (err) callback(err, null);

                    count++;

                    if (count === users.length) {
                      criteria = {
                        collection: userGroupsCollection,
                        query: result
                      };

                      Utility.getOne(criteria, function(err, group) {
                        callback(null, group);
                      });
                    }
                  });
                });
              },
              function(group, callback) {
                var usersString = "User Groups." + group._id;
                var searchCriteria = {};
                searchCriteria[usersString] = {
                  $exists: true
                };

                var updateCriteria = {
                  $set: {}
                };

                updateCriteria.$set["User Groups." + group._id + ".Users"] = group.Users;
                criteria = {
                  collection: userGroupsCollection,
                  query: searchCriteria,
                  updateObj: updateCriteria,
                  options: {
                    multi: true
                  }
                };
                Utility.getOne(criteria, function(err, groups) {
                  if (err) {
                    return callback(err, null);
                  }
                  return callback(null, {
                    "message": "success"
                  });

                });
              }
            ], function(err, result) {
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
        return cb("No groups given");
      }
    },
    removeGroup: function(data, cb) {
      var groupUpi = data["User Group Upi"];
      var criteria = {};
      var removeCriteria = {};

      if (groupUpi) {
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
        Utility.remove(criteria, function(err, result) {
          if (err) {
            return cb(err);
          }
          var searchCriteria = {
            Security: {
              $elemMatch: {
                groupId: groupId
              }
            }
          };
          var updateCriteria = {
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
        return cb("No group given");
      }
    },
    getAllGroups: function(data, cb) {
      var searchCriteria = {};
      var criteria = {
        collection: userGroupsCollection,
        query: searchCriteria
      };

      Utility.get(criteria, function(err, groups) {
        if (err) {
          return cb(err);
        }

        var properties = data.Properties;
        var returnArray = [];
        var tempObj;
        var i;

        if (typeof properties == 'undefined') {
          returnArray = groups;
        } else {
          for (i = 0; i < groups.length; i++) {
            tempObj = {};
            for (j = 0; j < properties.length; j++) {
              if (typeof groups[i][properties[j]] == 'undefined') continue;
              if (typeof groups[i][properties[j]].Value == 'undefined') {
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
    },
    getPoints: function(data, cb) {
      var group = data["User Group Upi"];

      if (group.length < 12) {
        group = parseInt(group, 10);
      } else {
        group = new ObjectID(group);
      }

      var searchCriteria = {
        Security: {
          $elemMatch: {
            groupId: group
          }
        }
      };

      var criteria = {
        collection: pointsCollection,
        query: searchCriteria
      };
      Utility.get(criteria, function(err, points) {
        if (err) {
          return cb(err);
        }

        var i;
        var j;
        var properties = data.Properties;
        var returnArray = [];

        for (i = 0; i < points.length; i++) {
          var tempObj = {};
          if (properties !== undefined) {
            for (j = 0; j < properties.length; j++) {
              if (properties[j] === "Name" || properties[j] === "_id" || properties[j] === "name1" || properties[j] === "name2" || properties[j] === "name3" || properties[j] === "name4") {
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

        var returnObj = {
          Points: returnArray
        };

        return cb(null, returnArray);
      });
    },
    getGroup: function(data, cb) {
      var id = data.id;

      if (id.length < 12) {
        upi = parseInt(id, 10);
      } else {
        upi = new ObjectID(id);
      }

      searchCriteria = {
        _id: upi
      };

      var criteria = {
        collection: userGroupsCollection,
        query: searchCriteria
      };
      Utility.getOne(criteria, cb);
    },
    editPhoto: function(data, cb) {
      var userid = ObjectID(data.user);
      var image = data.image;
      var filename = data.name;
      var imgData = image.replace(/^data:image\/\w+;base64,/, "");

      fs.writeFile(process.cwd() + '/public/img/users/' + filename, imgData, 'base64', function(err) {
        if (!err) {
          var criteria = {
            collection: userGroupsCollection,
            query: {
              _id: userid
            },
            updateObj: {
              $set: {
                "Photo": filename
              }
            }
          };
          Utility.update(criteria, function(err, result) {
            if (err) {
              return cb(err);
            } else {
              return cb(null, filename);
            }
          });
        } else {
          return cb(err);
        }
      });
    },
    saveGroup: Groups.saveGroup,
    newGroup: Groups.newGroup,
    updateGroup: Groups.updateGroup
  },
  Points: {
    addGroups: function(data, cb) {
      var newGroups = (data["Groups"]) ? data["Groups"] : [];
      var points = (data.Points) ? data.Points : [];
      var searchFilters = (data.searchFilters) ? data.searchFilters : null;
      var criteria = {};

      if (points.length < 1 || !searchFilters) {
        return cb("No points or filters given.");
      }

      var updateCriteria = {
        $addToSet: {
          Security: {
            $each: []
          }
        }
      };

      for (m = 0; m < newGroups.length; m++) {
        newGroups[m].groupId = new ObjectID(newGroups[m].groupId);

        newGroups[m].Permissions = parseInt(newGroups[m].Permissions, 10);
        if ((newGroups[m].Permissions & WRITE) !== 0) // If write, get read, ack and control
          newGroups[m].Permissions = newGroups[m].Permissions | READ | ACKNOWLEDGE | CONTROL;
        if ((newGroups[m].Permissions & CONTROL) !== 0) // If control, get read
          newGroups[m].Permissions = newGroups[m].Permissions | READ;
        if (newGroups[m].Permissions === undefined)
          newGroups[m].Permissions = 0;

        updateCriteria.$addToSet.Security.$each.push(newGroups[m]);
      }



      async.eachSeries(newGroups, function(newGroup, callback) {
        async.waterfall([

          function(wfCb) {
            criteria = {
              collection: userGroupsCollection,
              query: {
                _id: newGroup.groupId
              }
            };
            Utility.getOne(criteria, function(err, group) {
              wfCb(err, (group !== null) ? group.Users : null);
            });
          },
          function(users, wfCb) {
            var id;
            if (searchFilters) {
              if (upi.length < 12) {
                id = parseInt(upi, 10);
              } else {
                id = new ObjectID(upi);
              }
              var searchCriteria = {};
              searchCriteria.name1 = {
                '$regex': '(?i)' + "^" + searchFilters.name1
              };
              searchCriteria.name2 = {
                '$regex': '(?i)' + "^" + searchFilters.name2
              };
              searchCriteria.name3 = {
                '$regex': '(?i)' + "^" + searchFilters.name3
              };
              searchCriteria.name4 = {
                '$regex': '(?i)' + "^" + searchFilters.name4
              };

              for (var user in users) {
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
              Utility.update(criteria, function(err, point) {
                wfCb(err, true);
              });
            } else {
              async.eachSeries(points, function(upi, cb2) {
                if (upi.length < 12) {
                  id = parseInt(upi, 10);
                } else {
                  id = new ObjectID(upi);
                }
                var searchCriteria = {
                  "_id": id
                };

                for (var user in users) {
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
                Utility.update(criteria, function(err, point) {
                  cb2(err);
                });
              }, function(err) {
                wfCb(err, true);
              });
            }
          }
        ], function(err, result) {
          callback(err);
        });

      }, function(err) {
        return cb(err);
      });
    },
    removeGroups: function(data, cb) {
      var groupUpis = (data["User Group Upis"]) ? data["User Group Upis"] : [];
      var points = (data.Points) ? data.Points : [];
      var id;

      if (points.length < 1) {
        return cb("No points given.");
      }

      var updateCriteria = {
        $pull: {
          "Security": {
            $and: []
          }
        }
      };

      for (i = 0; i < groupUpis.length; i++) {
        updateCriteria.$pull.Security.$and.push({
          groupId: new ObjectID(groupUpis[i])
        });
      }

      var count = 0;

      async.eachSeries(points, function(upi, callback) {

        if (upi.length < 12) {
          id = parseInt(upi, 10);
        } else {
          id = new ObjectID(upi);
        }

        searchCriteria = {
          "_id": id
        };

        var criteria = {
          collection: pointsCollection,
          query: searchCriteria,
          updateObj: updateCriteria
        };

        Utility.update(criteria, function(err, result) {
          callback(err);
        });

      }, cb);
    },
    addUsers: function(data, cb) {
      return cb("Deprecated. Not storing users on points- only groups.");
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

            var searchCriteria = {
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
    },
    removeUsers: function(data, cb) {
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

        var searchCriteria = {
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
  }
};
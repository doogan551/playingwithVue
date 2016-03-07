var db = require('../helpers/db');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);
var async = require('async');
var ObjectID = require('mongodb').ObjectID;

module.exports = {
  getPointsByQuery: function(data, cb) {
    Utility.get({
      collection: 'points',
      query: query,
      limit: 200
    }, cb);
  },
  getPointById: function(data, cb) {
    var searchCriteria = {};
    var hasPermission = false;
    var pointid;
    var properties;
    var key;
    var groups;

    pointid = data.id;
    properties = [];

    groups = data.user.groups.map(function(group) {
      return group._id.toString();
    });

    searchCriteria._id = parseInt(pointid, 10);
    /*searchCriteria._pStatus = {
        $in: [0, 1]
    };*/

    Utility.get({
      query: searchCriteria,
      collection: 'points',
      limit: 1
    }, function(err, points) {

      if (err) {
        return cb(err, null, null);
      }

      var point = points[0];

      if (!point) {
        return cb(null, "No Point Found", null);
      }

      if (!data.user["System Admin"].Value) {
        for (var i = 0; i < point.Security.length; i++) {
          if (groups.indexOf(point.Security[i]) !== -1) {
            hasPermission = true;
          }
        }
      } else {
        hasPermission = true;
      }

      if (hasPermission) {
        return cb(null, null, point);
      } else {
        return cb("Permission Denied", null, null);
      }
    });
  },

  newPoint: function(data, cb) {
    var id = data.id || null;
    var pointType = !!data.pointType && JSON.stringify(decodeURI(data.pointType));
    var locals = {
      id: data.id || 0,
      name: JSON.stringify(''),
      pointType: pointType,
      selectedPointType: data.selectedPointType,
      pointTypes: JSON.stringify(Config.Utility.pointTypes.getAllowedPointTypes()),
      subType: -1
    };
    var query = {
      _id: parseInt(id, 10)
    };
    var fields = {
      Name: 1,
      'Point Type.Value': 1,
      'Report Type.eValue': 1,
      'Sensor Type.eValue': 1
    };

    if (id) {
      Utility.get({
          query: query,
          fields: fields,
          collection: 'points',
          limit: 1
        },
        function(err, points) {
          if (err) {
            return cb(err, null);
          }

          var point = points[0];

          if (point.hasOwnProperty('Report Type')) {
            locals.subType = JSON.stringify(point["Report Type"].eValue);
          } else if (point.hasOwnProperty('Sensor Type')) {
            locals.subType = JSON.stringify(point["Sensor Type"].eValue);
          }

          locals.name = JSON.stringify(point.Name.replace('\'', '\\\''));
          locals.pointType = JSON.stringify(point['Point Type'].Value);

          return cb(null, locals);
        }
      );
    } else {
      return cb(null, locals);
    }
  },

  pointLookup: function(data, cb) {
    var property = data.property && decodeURI(data.property);
    var pointType = (data.pointType && data.pointType !== 'null' && decodeURI(data.pointType)) || null;
    var pointTypes = Config.Utility.pointTypes.getAllowedPointTypes(property, pointType);
    var deviceId = data.deviceId || null;
    var remoteUnitId = data.remoteUnitId || null;
    var locals = {
      mode: JSON.stringify(data.mode),
      modes: JSON.stringify(data.modes),
      point: '{}',
      pointType: JSON.stringify(pointType),
      pointtypes: JSON.stringify(pointTypes),
      groupId: JSON.stringify(null),
      deviceId: JSON.stringify(deviceId),
      remoteUnitId: JSON.stringify(remoteUnitId)
    };

    cb(locals);
  },

  //API functions
  search: function(data, cb) {
    //Group IDs the user belongs to
    var userGroupIDs = data.user.groups.map(function(group) {
      return group._id.toString();
    });
    // Do we have a device ID?
    var deviceId = data.deviceId || null;
    // Do we have a RU ID?
    var remoteUnitId = data.remoteUnitId || null;
    // Do we have a point type?
    var pointType = data.pointType || null;

    // Show only active points by default
    // 0 = Active
    // 1 = Inactive
    // 2 = Deleted
    var includeSoftDeletedPoints = data.showDeleted || false;
    var includeInactivePoints = data.showInactive || false;
    //limit query to 200 by default
    var limit = data.limit || 200;
    // are we a system admin?
    var isSysAdmin = data.user["System Admin"].Value;
    var searchQuery;
    // If no point type array passed in, use default
    var pointTypes = data.pointTypes || Config.Utility.pointTypes.getAllowedPointTypes().map(function(type) {
      return type.key;
    });
    // Name segments, sort names and values
    var nameSegments = [{
      name: '_name1',
      value: data.name1 && data.name1.toLowerCase()
    }, {
      name: '_name2',
      value: data.name2 && data.name2.toLowerCase()
    }, {
      name: '_name3',
      value: data.name3 && data.name3.toLowerCase()
    }, {
      name: '_name4',
      value: data.name4 && data.name4.toLowerCase()
    }];
    // First projection. Provides lowercase values for sorting
    var projection = {
      _id: 1,
      _pStatus: 1,
      pointType: '$Point Type.Value',
      name1: 1,
      name2: 1,
      name3: 1,
      name4: 1,
      _parentUpi: 1
    };
    // sort
    var sort = {
      _name1: 1,
      _name2: 1,
      _name3: 1,
      _name4: 1
    };
    var reduceToUserGroups = function() {
      return {
        Security: {
          $in: userGroupIDs
        }
      };
    };
    var groupUserGroups = function() {
      return {
        _id: "$_id",
        Security: {
          $addToSet: '$Security'
        },
        _name1: {
          $first: '$_name1'
        },
        _name2: {
          $first: '$_name2'
        },
        _name3: {
          $first: '$_name3'
        },
        _name4: {
          $first: '$_name4'
        },
        name1: {
          $first: '$name1'
        },
        name2: {
          $first: '$name2'
        },
        name3: {
          $first: '$name3'
        },
        name4: {
          $first: '$name4'
        },
        'Point Type': {
          $first: {
            Value: '$Point Type.Value'
          }
        },
        _pStatus: {
          $first: '$_pStatus'
        }
      };
    };
    // Builds $match portion of query for initial selection
    var buildQuery = function() {
      var query = {},
        segment,
        _pStatus = 0;

      if (pointTypes.length == 1 && pointTypes[0] == 'Sensor') {
        if (pointType == 'Analog Input' || pointType == 'Analog Output') {
          query['Sensor Type.Value'] = pointType.split(' ')[1];
        }
      }

      if (pointTypes instanceof Array) {
        query['Point Type.Value'] = {
          $in: pointTypes
        };
      }

      if (!!deviceId) {
        query.$and = [{
          'Point Refs.PointInst': parseInt(deviceId, 10)
        }, {
          'Point Refs.PropertyName': 'Device Point'
        }];
        if (!!remoteUnitId) {
          query.$and.push({
            'Point Refs.PointInst': parseInt(remoteUnitId, 10)
          });
          query.$and.push({
            'Point Refs.PropertyName': 'Remote Unit Point'
          });
        }
      }

      for (var i = 0, last = nameSegments.length; i < last; i++) {
        segment = nameSegments[i];
        if (typeof segment.value == 'string') {
          if (segment.value.length) {
            query[segment.name] = new RegExp(['^', segment.value.toLowerCase()].join(''));
          }
        } else {
          query[segment.name] = '';
        }
      }

      if (!isSysAdmin) {
        query.Security = {
          $in: userGroupIDs
        };
      }

      // JSON.parse because these variables are received as strings
      if (JSON.parse(includeInactivePoints)) {
        _pStatus = 1;
      } else if (JSON.parse(includeSoftDeletedPoints)) {
        _pStatus = 2;
      }

      query._pStatus = _pStatus;

      return query;
    };

    searchQuery = [{
      $match: buildQuery()
    }, {
      $sort: sort
    }, {
      $limit: limit
    }, {
      $project: projection
    }];

    if (!isSysAdmin) {
      projection.Security = 1;
      searchQuery.splice(2, 0, {
        $unwind: "$Security"
      }, {
        $match: reduceToUserGroups()
      }, {
        $group: groupUserGroups()
      });
    }

    if (!!userGroupIDs.length || !!isSysAdmin) {
      Utility.aggregate({
        query: searchQuery,
        collection: 'points'
      }, function(err, points) {
        if (err) {
          return cb(err, null);
        }

        return cb(null, points);
      });
    } else {
      return cb(null, []);
    }
  },

  browse: function(data, cb) {
    // console.log('permissions', data.permissions);
    if (data.permissions) {
      toggleGroup(data, browse, cb);
    } else {
      browse(data, cb);
    }
  },
  toggleGroup: function(data, cb) {
    toggleGroup(data, null, cb);
  },
  searchDependencies2: function(data, cb) {
    var refs = [];
    var returnObj = {
      target: {},
      "Point Refs": [],
      "Dependencies": []
    };
    var addAppIndex = function(buildObject, pointRef) {
      var propName = pointRef.PropertyName;
      if (propName === 'Point Register') {
        buildObject.extendedProperty = [propName, ' ', pointRef.AppIndex].join('');
      }
      return;
    };

    var upi = parseInt(data.upi, 10);

    var criteria = {
      collection: 'points',
      query: {
        _id: upi
      }
    };

    Utility.getOne(criteria, function(err, targetPoint) {
      if (err) {
        return cb(err);
      }
      if (!targetPoint) {
        return cb('Point not found.');
      }

      returnObj.target.Name = targetPoint.Name;
      returnObj.target["Point Type"] = targetPoint["Point Type"].Value;

      async.eachSeries(targetPoint["Point Refs"], function(pointRef, callback) {
        buildPointRefs(pointRef.Value, function(err, ref, device) {
          var obj = {
            _id: pointRef.Value,
            Property: pointRef.PropertyName,
            "Point Type": (ref !== null) ? ref["Point Type"].Value : null,
            Name: pointRef.PointName,
            _pStatus: (ref !== null) ? ref._pStatus : null,
            Device: (device !== null) ? {
              Name: device.Name,
              _id: device._id,
              _pStatus: device._pStatus
            } : null
          };
          addAppIndex(obj, pointRef);
          returnObj["Point Refs"].push(obj);
          callback(err);
        });
      }, function(err) {
        criteria = {
          collection: 'points',
          query: {
            "Point Refs.PointInst": upi,
            _pStatus: 0
          }
        };
        Utility.get(criteria, function(err, dependencies) {
          if (err) {
            return cb(err);
          }

          var count = 0;
          async.eachSeries(dependencies, function(dependency, depCB) {

            var deviceUpi = 0;
            var matchedDependencies = [];

            for (var m = 0; m < dependency["Point Refs"].length; m++) {

              if (dependency["Point Refs"][m].PropertyName === "Device Point" && dependency["Point Refs"][m].Value !== 0)
                deviceUpi = dependency["Point Refs"][m].Value;
              if (dependency["Point Refs"][m].PropertyName === "Sequence Device" && dependency["Point Refs"][m].Value !== 0)
                deviceUpi = dependency["Point Refs"][m].Value;
              if (dependency["Point Refs"][m].Value === upi) {
                matchedDependencies.push(dependency["Point Refs"][m]);
              }
            }
            async.eachSeries(matchedDependencies, function(depPointRef, depPRCB) {
              if (depPointRef.Value === upi) {
                if (dependency["Point Type"].Value === "Schedule Entry" && depPointRef.PropertyName === "Control Point") {
                  if (dependency._parentUpi === 0) {
                    returnObj["Point Refs"].push({
                      _id: 0,
                      Property: depPointRef.PropertyName,
                      "Point Type": dependency["Point Type"].Value,
                      Name: null,
                      _pStatus: null,
                      Device: null
                    });
                    depPRCB(null);
                  } else {
                    criteria = {
                      collection: 'points',
                      query: {
                        _id: dependency._parentUpi
                      }
                    };

                    Utility.getOne(criteria, function(err, schedule) {
                      returnObj.Dependencies.push({
                        _id: schedule._id,
                        Property: depPointRef.PropertyName,
                        "Point Type": dependency["Point Type"].Value,
                        Name: schedule.Name,
                        _pStatus: dependency._pStatus,
                        Device: null
                      });
                      depPRCB(null);
                    });
                  }
                } else {
                  findDevicePoint(deviceUpi, function(err, device) {
                    if (err) {
                      return depPRCB(err);
                    }
                    var obj = {
                      _id: dependency._id,
                      Property: depPointRef.PropertyName,
                      "Point Type": dependency["Point Type"].Value,
                      Name: dependency.Name,
                      _pStatus: dependency._pStatus,
                      Device: (device !== null) ? {
                        Name: device.Name,
                        _id: device._id,
                        _pStatus: device._pStatus
                      } : null
                    };
                    addAppIndex(obj, depPointRef);
                    returnObj.Dependencies.push(obj);
                    depPRCB(null);
                  });
                }
              } else
                setTimeout(function() {
                  depPRCB(null);
                }, 0);

            }, function(err) {
              depCB(err);
            });
          }, function(err) {
            return cb(err, returnObj);
          });

        });
      });


    });

    function buildPointRefs(upi, callback) {
      var deviceUpi = 0;
      if (upi !== 0) {
        criteria = {
          collection: 'points',
          query: {
            _id: upi
          },
          fields: {
            _pStatus: 1,
            "Point Refs": 1,
            "Point Type": 1
          }
        };
        Utility.getOne(criteria, function(err, ref) {
          if (err) {
            return callback(err);
          }
          for (var m = 0; m < ref["Point Refs"].length; m++) {
            if (ref["Point Refs"][m].PropertyName === "Device Point" && ref["Point Refs"][m].Value !== 0)
              deviceUpi = ref["Point Refs"][m].Value;
          }
          findDevicePoint(deviceUpi, function(err, device) {
            callback(err, ref, device);
          });

        });
      } else
        callback(null, null, null);
    }

    function findDevicePoint(upi, callback) {
      if (upi !== 0) {
        criteria = {
          collection: 'points',
          query: {
            _id: upi
          },
          fields: {
            Name: 1,
            _pStatus: 1
          }
        };
        Utility.getOne(criteria, callback);
      } else
        callback(null, null);
    }
  },
  getNames: function(data, cb) {
    var upis = data.upis;
    async.map(upis, function(upi, callback) {
      var criteria = {
        collection: 'points',
        query: {
          _id: upi * 1,
          _pStatus: 0
        },
        fields: {
          Name: 1
        }
      };
      Utility.getOne(criteria, callback);
    }, cb);
  },
  getPoint: function(data, cb) {
    var pointid = parseInt(data.pointid, 10);

    var searchCriteria = {
      '_id': pointid,
      _pStatus: 0
    };

    if (data.user["System Admin"].Value !== true && data.user["System Admin"].Value !== "true") {
      searchCriteria.Security = {
        $in: req["User Groups"]
      };
    }

    var criteria = {
      collection: 'points',
      query: searchCriteria
    };

    Utility.getOne(criteria, cb);
  },
  initPoint: function(data, cb) {
    var criteria = {};

    var name1 = data.name1;
    var name2 = data.name2;
    var name3 = data.name3;
    var name4 = data.name4;

    var Name;
    var _Name;
    var _name1;
    var _name2;
    var _name3;
    var _name4;

    var pointType = data.pointType;
    var targetUpi = (data.targetUpi) ? parseInt(data.targetUpi, 10) : 0;
    var parentUpi = (data.parentUpi) ? parseInt(data.parentUpi, 10) : 0;
    if ((pointType === "Report" || pointType === "Sensor") && data.subType === undefined) {
      return cb("No type defined");
    } else {
      subType = data.subType;
    }

    doInitPoint(name1, name2, name3, name4, pointType, targetUpi, subType, cb);

    function doInitPoint(name1, name2, name3, name4, pointType, targetUpi, subType, callback) {

      buildName(name1, name2, name3, name4);

      criteria = {
        collection: 'points',
        query: {
          _Name: _Name
        }
      };

      Utility.getOne(criteria, function(err, freeName) {
        if (err) {
          return callback(err);
        }
        if (freeName !== null && pointType !== "Schedule Entry") {
          return callback("Name already exists.");
        }


        criteria = {
          collection: 'upis',
          query: {
            _pStatus: 1
          },
          sort: [
            ['_id', 'asc']
          ],
          updateObj: {
            $set: {
              _pStatus: 0
            }
          },
          options: {
            'new': true
          }
        };

        Utility.findAndModify(criteria, function(err, upiObj) {
          if (err) {
            return callback(err);
          }

          if (pointType === "Schedule Entry") {
            name2 = upiObj._id.toString();
            buildName(name1, name2, name3, name4);
          }

          if (targetUpi && targetUpi !== 0) {
            criteria = {
              collection: 'points',
              query: {
                _id: targetUpi
              }
            };

            Utility.getOne(criteria, function(err, targetPoint) {
              if (err) {
                return cb(err);
              }

              if (!targetPoint) {
                return callback("Target point not found.");
              }

              targetPoint._pStatus = 1;
              fixPoint(upiObj, targetPoint, true, callback);
            });
          } else {
            fixPoint(upiObj, Config.Templates.getTemplate(pointType), false, callback);
          }
        });
      });

      function buildName(name1, name2, name3, name4) {
        _name1 = (name1) ? name1.toLowerCase() : "";
        _name2 = (name2) ? name2.toLowerCase() : "";
        _name3 = (name3) ? name3.toLowerCase() : "";
        _name4 = (name4) ? name4.toLowerCase() : "";

        Name = "";

        if (name1)
          Name = Name + name1;
        if (name2)
          Name = Name + "_" + name2;
        if (name3)
          Name = Name + "_" + name3;
        if (name4)
          Name = Name + "_" + name4;

        _Name = Name.toLowerCase();
      }
    }

    function cloneGPLSequence(oldSequence, callback) {
      var oName1;
      var oName2;
      var oName3;
      var oName4;
      var oName;
      var oPointType;

      async.eachSeries(oldSequence.SequenceData.sequence.block, function(block, acb) {
        if (block.upi === undefined || block.upi === 0) {
          acb(null);
        } else {
          console.log(block);
          oName1 = oldSequence.name1;
          oName2 = oldSequence.name2;
          oName3 = oldSequence.name3;
          oName4 = oldSequence.name4;

          if (oName1 === '' || oName1 === undefined) {
            oName1 = block.label;
            oName2 = '';
            oName3 = '';
            oName4 = '';
          } else if (oName2 === '' || oName2 === undefined) {
            oName2 = block.label;
            oName3 = '';
            oName4 = '';
          } else if (oName3 === '' || oName3 === undefined) {
            oName3 = block.label;
            oName4 = '';
          } else {
            oName4 = block.label;
          }

          doInitPoint(oName1, oName2, oName3, oName4, null, block.upi, null, function(err, point) {
            if (err) {
              acb(err);
            } else {
              block.upi = point._id;
              acb(null);
            }
          });
        }
      }, callback);
    }

    function setIpPort(point, cb) {
      var criteria = {
        collection: 'SystemInfo',
        query: {
          Name: 'Preferences'
        }
      };

      Utility.getOne(criteria, function(err, prefs) {
        var ipPort = prefs['IP Port'];
        if (point['Point Type'].Value === 'Device') {
          point['Ethernet IP Port'].Value = ipPort;
          point['Downlink IP Port'].Value = ipPort;
        } else if (point['Point Type'].Value === 'Remote Unit' && [5, 9, 10, 11, 12, 13, 14, 16].indexOf(point['Model Type'].eValue) < 0) {
          point['Ethernet IP Port'].Value = ipPort;
        }
        return cb();
      });
    }

    function fixPoint(upiObj, template, isClone, callback) {
      template.Name = Name;
      template.name1 = (name1) ? name1 : "";
      template.name2 = (name2) ? name2 : "";
      template.name3 = (name3) ? name3 : "";
      template.name4 = (name4) ? name4 : "";

      template._Name = _Name;
      template._name1 = (_name1) ? _name1 : "";
      template._name2 = (_name2) ? _name2 : "";
      template._name3 = (_name3) ? _name3 : "";
      template._name4 = (_name4) ? _name4 : "";

      template._id = upiObj._id;

      template._actvAlmId = ObjectID("000000000000000000000000");

      template._cfgRequired = true;

      if (template["Point Type"].Value === "Display") { // default background color for new Displays
        template["Background Color"].Value = Config.Templates.getTemplate("Display")["Background Color"];
      }
      console.log("isClone", isClone);
      if (!isClone) {
        // update device template here
        // get telemetry ip port and set ethernet ip port and downlink ip port
        // rmu - model type nin[5, 9, 10, 11, 12, 13, 14, 16] set ethernet ip port
        setIpPort(template, function() {
          if (template["Point Type"].Value === "Sensor") {
            template["Sensor Type"].Value = (subType) ? subType.Value : "Input";
            template["Sensor Type"].eValue = (subType) ? parseInt(subType.eValue, 10) : 0;
          } else if (template["Point Type"].Value === "Report") {
            template["Report Type"].Value = (subType) ? subType.Value : "Property";
            template["Report Type"].eValue = (subType) ? parseInt(subType.eValue, 10) : 0;
          }

          template._parentUpi = parentUpi;

          criteria = {
            collection: 'AlarmDefs',
            query: {
              isSystemMessage: true
            },
            fields: {
              msgType: 1
            }
          };

          Utility.get(criteria, function(err, alarmDefs) {
            if (err) {
              return callback(err);
            }
            if (template["Alarm Messages"] !== undefined) {
              for (var i = 0; i < template["Alarm Messages"].length; i++) {
                for (var j = 0; j < alarmDefs.length; j++) {
                  if (template["Alarm Messages"][i].msgType === alarmDefs[j].msgType) {
                    template["Alarm Messages"][i].msgId = alarmDefs[j]._id;
                  }
                }
              }
            }

            criteria = {
              collection: 'SystemInfo',
              query: {
                Name: 'Preferences'
              },
              fields: {
                "Quality Code Default Mask": 1,
                _id: 0
              }
            };

            Utility.getOne(criteria, function(err, defaultQualityCodeMask) {
              if (err) {
                return callback(err);
              }
              if (template["Quality Code Enable"] !== undefined) {
                template["Quality Code Enable"].Value = defaultQualityCodeMask["Quality Code Default Mask"];
              }
              addTemplateToDB(template, callback);

            });
          });
        });
      } else {
        if (template["Point Type"].Value === "Sequence") {
          cloneGPLSequence(template, function() {
            addTemplateToDB(template, callback);
          });
        } else {
          if (template["Point Type"].Value !== "Schedule Entry" && template._parentUpi !== 0) {
            template._parentUpi = 0;
            for (var i = 0; i < template["Point Refs"].length; i++) {
              template["Point Refs"][i].isReadOnly = false;
            }
          }
          addTemplateToDB(template, callback);
        }
        template['Control Array'] = [];
      }

    }

    function addTemplateToDB(template, callback) {
      criteria = {
        collection: 'points',
        insertObj: template
      };
      Utility.insert(criteria, function(err, result) {
        return callback(err, template);
      });
    }
  },
  getPointRefsSmall: function(data, cb) {
    var searchCriteria = {};
    var filterProps = {
      Name: 1,
      Value: 1,
      "Point Type": 1,
      "Point Refs": 1
    };
    var hasPermission = false;

    var upi = data.upi;
    var properties = [];

    searchCriteria._id = parseInt(upi, 10);
    searchCriteria._pStatus = {
      $in: [0, 1]
    };

    var criteria = {
      collection: 'points',
      query: searchCriteria,
      fields: filterProps
    };

    Utility.getOne(criteria, function(err, point) {
      if (err) {
        return cb(err);
      }
      if (point === null) {
        return cb(null, 'No point found.');
      }

      return cb(null, null, point);
    });
  },
  findAlarmDisplays: function(data, cb) {
    var criteria = {};
    var firstSearch = {};
    var thirdSearch = {};
    var tempId = 0;
    var displays = [];

    var upi = parseInt(data.upi, 10);

    firstSearch._id = upi;
    var secondSearch = {
      "Point Type.Value": "Display"
    };

    var groups = data.user.groups.map(function(group) {
      return group._id.toString();
    });

    if (!data.user["System Admin"].Value) {
      thirdSearch.Security = {
        $in: groups
      };
      secondSearch.Security = {
        $in: groups
      };
    }

    criteria = {
      collection: 'points',
      query: firstSearch,
      fields: {
        Name: 1,
        "Point Refs": 1
      }
    };

    Utility.getOne(criteria, function(err, targetPoint) {
      if (err) {
        cb(err);
      }

      if (targetPoint !== null) {

        for (var i = 0; i < targetPoint["Point Refs"].length; i++) {
          if (targetPoint["Point Refs"][i].PropertyName === "Alarm Display Point") {
            if (targetPoint["Point Refs"][i].Value !== 0) {
              tempId = targetPoint["Point Refs"][i].Value;
              displays.push({
                _id: targetPoint["Point Refs"][i].Value,
                Name: targetPoint["Point Refs"][i].PointName
              });
            }
            break;
          }
        }
        thirdSearch._id = (displays.length > 0) ? displays[0]._id : 0;
        if (thirdSearch._id !== 0) {
          criteria = {
            collection: 'points',
            query: thirdSearch,
            fields: {
              _id: 1
            }
          };

          Utility.getOne(criteria, function(err, point) {
            if (err) {
              return cb(err);
            }
            if (!point) {
              displays = [];
            }
            doSecondSearch(targetPoint, function(err) {
              return cb(err, displays);
            });

          });
        } else {
          doSecondSearch(targetPoint, function(err) {
            return cb(err, displays);
          });
        }
      } else {
        return cb('Point not found.');
      }

    });

    function doSecondSearch(targetPoint, callback) {
      secondSearch["Point Refs.Value"] = targetPoint._id;
      criteria = {
        collection: 'points',
        query: secondSearch,
        fields: {
          Name: 1
        }
      };

      Utility.get(criteria, function(err, references) {

        async.eachSeries(references, function(ref, acb) {
          displays.push(ref);
          acb(null);
        }, callback);
      });
    }
  }
};

var browse = function(data, cb) {
    //Group IDs the user belongs to
    var userGroupIDs = data.user.groups.map(function(group) {
      return group._id.toString();
    });
    // Do we have a device ID?
    var deviceId = data.deviceId || null;
    // Do we have a RU ID?
    var remoteUnitId = data.remoteUnitId || null;
    // Do we have a point type?
    var pointType = data.pointType || null;
    // Show only active points by default
    // 0 = Active
    // 1 = Inactive
    // 2 = Deleted
    var includeSoftDeletedPoints = data.showDeleted || false;
    var includeInactivePoints = data.showInactive || false;
    // are we a system admin?
    var isSysAdmin = data.user["System Admin"].Value;
    var searchQuery;
    // If no point type array passed in, use default
    var pointTypes = data.pointTypes || Config.Utility.pointTypes.getAllPointTypes().map(function(type) {
      return type.key;
    });
    // Name segments, sort names and values
    var nameSegments = [{
      name: 'name1',
      lower: '_name1',
      value: data.name1 && data.name1.toLowerCase() || {
        $ne: ''
      }
    }, {
      name: 'name2',
      lower: '_name2',
      value: data.name2 && data.name2.toLowerCase() || {
        $ne: ''
      }
    }, {
      name: 'name3',
      lower: '_name3',
      value: data.name3 && data.name3.toLowerCase() || {
        $ne: ''
      }
    }, {
      name: 'name4',
      lower: '_name4',
      value: data.name4 && data.name4.toLowerCase() || {
        $ne: ''
      }
    }];
    // Segment number being requested
    // Defaults to 1
    var requestedSegmentNumber = data.nameSegment || 1;
    // Get segment using segment number
    var requestedSegment = nameSegments[requestedSegmentNumber - 1];
    // First projection. Provides lowercase values for sorting
    var projection = {
      _id: 1,
      pointType: '$Point Type.Value',
      Name: 1,
      Security: 1,
      _pStatus: 1,
      _parentUpi: 1
    };
    // Grouping by requested segment value
    var searchGrouping = {
      _id: {
        isPoint: '$isPoint'
      },
      contains: {
        $sum: 1
      },
      pointType: {
        $addToSet: '$pointType'
      },
      pt: {
        $first: {
          _id: '$_id',
          Name: '$Name',
          Security: '$Security',
          isPoint: '$isPoint',
          _pStatus: '$_pStatus',
          _parentUpi: '$_parentUpi'
        }
      }
    };
    // Provides final output
    var finalProjection = {
      _id: '$pt._id',
      Name: '$pt.Name',
      pointType: '$pointType',
      count: '$contains',
      isPoint: '$pt.isPoint',
      _pStatus: '$pt._pStatus',
      _parentUpi: '$pt._parentUpi'
    };
    // Final sort
    var sort = {};
    // Builds $match portion of query for initial selection
    var buildQuery = function() {
      var query = {},
        segment,
        _pStatus = 0;

      if (pointTypes.length == 1 && pointTypes[0] == 'Sensor') {
        if (pointType == 'Analog Input' || pointType == 'Analog Output') {
          query['Sensor Type.Value'] = pointType.split(' ')[1];
        }
      }

      if (pointTypes instanceof Array) {
        query['Point Type.Value'] = {
          $in: pointTypes
        };
      }

      if (!!deviceId) {
        query.$and = [{
          'Point Refs.PointInst': parseInt(deviceId, 10)
        }, {
          'Point Refs.PropertyName': 'Device Point'
        }];
        if (!!remoteUnitId) {
          query.$and.push({
            'Point Refs.PointInst': parseInt(remoteUnitId, 10)
          });
          query.$and.push({
            'Point Refs.PropertyName': 'Remote Unit Point'
          });
        }
      }

      for (var i = requestedSegmentNumber; i; i--) {
        if (requestedSegmentNumber == 1) break;
        segment = nameSegments[i - 1];
        query[segment.lower] = segment.value;
      }

      if (!isSysAdmin) {
        query.Security = {
          $in: userGroupIDs
        };
      }

      // JSON.parse because these variables are received as strings
      if (JSON.parse(includeInactivePoints)) _pStatus = 1;
      else if (JSON.parse(includeSoftDeletedPoints)) _pStatus = 2;
      query._pStatus = _pStatus;

      return query;
    };
    var reduceToUserGroups = function() {
      return {
        Security: {
          $in: userGroupIDs
        }
      };
    };
    var groupUserGroups = function() {
      var point = {
        _id: "$_id",
        Security: {
          $addToSet: '$Security'
        },
        Name: {
          $first: '$Name'
        },
        'Point Type': {
          $first: {
            Value: '$Point Type.Value'
          }
        },
        _pStatus: {
          $first: '$_pStatus'
        }
      };

      point[requestedSegment.name] = {
        '$first': ['$', requestedSegment.name].join('')
      };
      point[requestedSegment.lower] = {
        '$first': ['$', requestedSegment.lower].join('')
      };

      //add next segment to group to determine if requested segment is a point or folder
      if (requestedSegmentNumber < 4) {
        point[nameSegments[requestedSegmentNumber].name] = {
          '$first': ['$', nameSegments[requestedSegmentNumber].name].join('')
        };
      }

      return point;
    };

    //Only project requested name segment for sorting
    projection[requestedSegment.name] = 1;
    projection[requestedSegment.lower] = 1;

    // We determine if record is a point or a folder by looking ahead to the next name segment
    projection.isPoint = (requestedSegmentNumber == 4) ? {
      $literal: true
    } : {
      $eq: [
        ['$', nameSegments[requestedSegmentNumber].name].join(''), ''
      ]
    };

    // Add the requested field to the grouping
    searchGrouping._id[requestedSegment.lower] = ['$', requestedSegment.lower].join('');
    searchGrouping.pt.$first[requestedSegment.lower] = ['$', requestedSegment.lower].join('');
    searchGrouping.pt.$first[requestedSegment.name] = ['$', requestedSegment.name].join('');

    // sort by our projected lower case field name
    sort[requestedSegment.lower] = 1;

    // Add our projected field to the final projection
    finalProjection[requestedSegment.name] = ['$pt.', requestedSegment.name].join('');
    finalProjection[requestedSegment.lower] = ['$pt.', requestedSegment.lower].join('');

    searchQuery = [{
        $match: buildQuery()
      }, {
        $project: projection
      },
      //{ $sort     : { 'isPoint': -1 } },
      {
        $group: searchGrouping
      }, {
        $project: finalProjection
      }, {
        $sort: sort
      }
    ];

    finalProjection.Security = '$pt.Security';

    if (!isSysAdmin) {
      // Splice in our security logic to return only groups the user belongs to
      searchQuery.splice(1, 0, {
        $unwind: "$Security"
      }, {
        $match: reduceToUserGroups()
      }, {
        $group: groupUserGroups()
      });
    }

    //console.log('BROWSE QUERY!', JSON.stringify(searchQuery));
    Utility.aggregate({
      query: searchQuery,
      collection: 'points'
    }, function(err, points) {
      if (err) {
        return cb(err, null);
      }
      return cb(null, points);
    });
  },

  toggleGroup = function(data, next, cb) {
    var pointTypes = data.pointTypes || Config.Utility.pointTypes.getAllowedPointTypes().map(function(type) {
      return type.key;
    });
    var permissions = data.permissions;
    var query = {};
    var modifier = {
      $addToSet: {
        Security: permissions.groupid
      }
    };
    var segment;
    var i;

    if (permissions.action == 'remove') {
      modifier = {
        $pull: {
          Security: permissions.groupid
        }
      };
    }

    for (i = 4; i; i--) {
      segment = permissions['name' + i];
      if (!!segment) {
        query['_name' + i] = segment.toLowerCase();
      } else {
        if (permissions.type == 'point') {
          query['_name' + i] = '';
        }
      }
    }

    if (pointTypes instanceof Array) {
      query['Point Type.Value'] = {
        $in: pointTypes
      };
    }

    Utility.update({
      collection: 'points',
      query: query,
      updateObj: modifier,
      options: {
        multi: true
      }
    }, function(err, updateCount, status) {
      if (err) {
        return cb(err, null);
      } else if (next) {
        return next(data, cb);
      } else {
        return cb(null, status);
      }
    });
  };

exports.getInitialVals = function(id, cb) {
  var fields = {
    Value: 1,
    Name: 1,
    eValue: 1,
    "Alarm State": 1,
    _relDevice: 1,
    _relRMU: 1,
    _relPoint: 1,
    "Status Flags": 1,
    "Alarms Off": 1,
    "COV Enable": 1,
    "Control Pending": 1,
    "Quality Code Enable": 1
  };

  var criteria = {
    collection: 'points',
    query: {
      _id: parseInt(id, 10)
    },
    fields: fields
  };

  Utility.getOne(criteria, function(err, point) {
    if (point)
      point = setQualityLabel(point);

    return cb(point);
  });

};
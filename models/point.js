var db = require('../helpers/db');
var Utility = require('../models/utility');
var config = require('../public/js/lib/config.js');

module.exports = {
  getPointsByQuery: function (data, cb) {
    var collection = db.get().collection('points');
    var query = {};
    collection.find(query).limit(200).toArray(cb);
  },
  getPointById: function (data, cb) {
    var searchCriteria = {};
    var hasPermission = false;
    var pointid;
    var properties;
    var key;
    var groups;

    pointid = data.id;
    properties = [];

    groups = data.user.groups.map(function (group) {
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
    }, function (err, points) {

      if (err)
        return cb(err, null, null);

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

  newPoint: function (data, cb) {
    var id = data.id || null;
    var pointType = !!data.pointType && JSON.stringify(decodeURI(data.pointType));
    var locals = {
      id: data.id || 0,
      name: JSON.stringify(''),
      pointType: pointType,
      selectedPointType: data.selectedPointType,
      pointTypes: JSON.stringify(config.Utility.pointTypes.getAllowedPointTypes()),
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
        function (err, points) {
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

  pointLookup: function (data, cb) {
    var property = data.property && decodeURI(data.property);
    var pointType = (data.pointType && data.pointType !== 'null' && decodeURI(data.pointType)) || null;
    var pointTypes = config.Utility.pointTypes.getAllowedPointTypes(property, pointType);
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
  search: function (data, cb) {
    //Group IDs the user belongs to
    var userGroupIDs = data.user.groups.map(function (group) {
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
    var pointTypes = data.pointTypes || config.Utility.pointTypes.getAllowedPointTypes().map(function (type) {
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
    var reduceToUserGroups = function () {
      return {
        Security: {
          $in: userGroupIDs
        }
      };
    };
    var groupUserGroups = function () {
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
    var buildQuery = function () {
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

    // console.log('SEARCH QUERY!', JSON.stringify(searchQuery));
    Utility.aggregate({
      query: searchQuery,
      collection: 'points'
    }, function (err, points) {
      if (err) {
        return cb(err, null);
      }

      return cb(null, points);
    });
  },

  browse: function (data, cb) {
    if (data.permissions) {
      toggleGroup(data, browse, cb);
    } else {
      browse(data, cb);
    }
  },
  toggleGroup: function (data, cb) {
    toggleGroup(data, cb);
  }
};

var browse = function (data, cb) {
    //Group IDs the user belongs to
    var userGroupIDs = data.user.groups.map(function (group) {
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
    var pointTypes = data.pointTypes || config.Utility.pointTypes.getAllPointTypes().map(function (type) {
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
    var buildQuery = function () {
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
    var reduceToUserGroups = function () {
      return {
        Security: {
          $in: userGroupIDs
        }
      };
    };
    var groupUserGroups = function () {
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
    }, function (err, points) {
      if (err) {
        return cb(err, null);
      }
      return cb(null, points);
    });
  },

  toggleGroup = function (data, next, cb) {
    var pointTypes = data.pointTypes || config.Utility.pointTypes.getAllowedPointTypes().map(function (type) {
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
    }, function (err, updateCount, status) {
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
      collection:'points',
      query:{_id:parseInt(id, 10)},
      fields: fields
    }

    Utility.getOne(criteria, function (err, point) {
      if (point)
        point = setQualityLabel(point);

      return cb(point);
    });

  };

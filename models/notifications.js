var Utility = require('../models/utility');

module.exports = {
  hasNotifications: function(alarm, cb) {
    var doSend = false;
    Utility.getOne({
      collection: 'points',
      query: {
        _id: alarm.upi
      }
    }, function(err, point) {
      var pointAlarms = point['Alarm Messages'];
      for (var i = 0; i < pointAlarms.length; i++) {
        if (alarm.msgType === pointAlarms[i].msgType && !!pointAlarms[i].notify) {
          doSend = true;
        }
      }
      return cb(err, doSend);
    });
  },
  checkPolicies: function(alarm, callback) {
    var policies = [{
      number: '13364694547',
      type: 6,
      ack: true,
      email: 'rkendall@dorsett-tech.com'
    }, {
      number: '13364690900',
      type: 2,
      ack: true,
      email: 'jroberts@dorsett-tech.com'
    }];

    callback(null, policies);
  }


};
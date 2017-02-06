// var Alarm = new (require('../models/alarm.js'))();
// var query;

// describe('Alarms Model', function() {
//   beforeEach(function() {
//     query = {
//       "itemsPerPage": 200,
//       "sort": "asc",
//       "currentPage": 1,
//       "usernames": [],
//       "name1": "",
//       "name2": "",
//       "name3": "",
//       "name4": "",
//       "startDate": 0,
//       "endDate": 0,
//       user: global.adminUser
//     };
//   });

//   it('should return no errors', function(done) {
//     Alarm.getRecentAlarms(query, function(err, alarms) {
//       expect(err).to.not.be.ok;
//       done(err);
//     });
//   });
//   it('should return 1 alarm', function(done) {
//     query.name1 = '4207';
//     Alarm.getRecentAlarms(query, function(err, alarms) {
//       expect(err).to.not.be.ok;
//       expect(alarms.length).to.equal(1);
//       done(err);
//     });
//   });
//   it('should return 0 alarms', function(done) {
//     query.name1 = 'XasdfASdfakfhwaF';
//     Alarm.getRecentAlarms(query, function(err, alarms) {
//       expect(err).to.not.be.ok;
//       expect(alarms.length).to.equal(0);
//       done(err);
//     });
//   });

//   it('should return 1 alarm per page', function(done) {
//     query.itemsPerPage = 1;
//     Alarm.getRecentAlarms(query, function(err, alarms) {
//       expect(err).to.not.be.ok;
//       expect(alarms.length).to.equal(1);
//       done(err);
//     });
//   });

//   it('should return 10 alarms per page', function(done) {
//     query.numberItems = 10;
//     Alarm.getRecentAlarms(query, function(err, alarms) {
//       expect(err).to.not.be.ok;
//       expect(alarms.length).to.equal(10);
//       done(err);
//     });
//   });

//   it('should return 1 alarms with specific time', function(done) {
//     query.startDate = 1451480725;
//     query.endDate = 1451480740;
//     Alarm.getRecentAlarms(query, function(err, alarms) {
//       expect(err).to.not.be.ok;
//       expect(alarms.length).to.equal(1);
//       done(err);
//     });
//   });
// });

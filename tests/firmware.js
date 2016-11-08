// var Firmware = require('../models/firmware.js');
// var data;

// describe('Firmware Model', function() {
//   beforeEach(function() {
//     data = {
//       user: global.adminUser
//     };
//   });

//   it('should get files', function(done) {
//     data.model = 'MicroScan 5 UNV';

//     Firmware.getModelFiles(data, function(err, result) {
//       expect(err).to.be.equal(null);
//       expect(result).to.not.be.equal(undefined);
//       expect(result.length).to.not.be.equal(0);
//       done(err);
//     });
//   });

//   it('should get remote units', function(done) {
//     data.deviceUpi = 53226;

//     Firmware.getRemoteUnits(data, function(err, result) {
//       expect(err).to.be.equal(null);
//       expect(result).to.not.be.equal(undefined);
//       expect(result.length).to.not.be.equal(0);
//       done(err);
//     });
//   });
// });
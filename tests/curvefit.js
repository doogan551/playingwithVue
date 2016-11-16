// var CurveFit = require('../models/curveFit.js');
// var moment = require('moment');
// var query;

// describe('Curve Fit Model', function () {
//   beforeEach(function () {
//     data = {
//       user: global.adminUser
//     };
//   });

//   it('should do cubic polynomial fit', function (done) {
//     data.type = "Cubic";
//     data.data = {type: "Cubic", highTemp: 100, lowTemp: 0, sensorType: '100 Ohm 385 Platinum RTD'};
//     CurveFit.doFit(data, function (result) {
//       expect(result.err).to.be.equal(undefined);
//       expect(result.coeffs).to.not.be.equal(null);
//       expect(result.coeffs.length).to.equal(3);
//       done(result.err);
//     });
//   });
  
//   it('should do linear fit', function (done) {
//     data.type = "Linear";
//     data.data = {input_conv:true, lvolts:0, hvolts:10, low:0, high:100, c:[]};
//     CurveFit.doFit(data, function (result) {
//       expect(result.err).to.be.equal(undefined);
//       expect(result.coeffs).to.not.be.equal(null);
//       expect(result.coeffs.length).to.equal(2);
//       done(result.err);
//     });
//   });
  
//   it('should do flow polynomial fit', function (done) {
//     data.type = "Flow";
//     data.data = {sensorRef:{Value:935416}, lv_sensor:false, area: 10, p1:10, p2:100};
//     CurveFit.doFit(data, function (result) {
//       expect(result.err).to.be.equal(undefined);
//       expect(result.coeffs).to.not.be.equal(null);
//       expect(result.coeffs.length).to.equal(4);
//       done(result.err);
//     });
//   });
  
// });
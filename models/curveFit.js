let reg = require('regression');

let Utility = require('../models/utility');
let rtdTables = require('../lib/rtdTables');

let CurveFit = class CurveFit {
    doFit(_data, cb) {
        let type = _data.type;
        let data = _data.data;

        if (type === 'Cubic') {
            polyFit(data, cb);
            //CubicFit(data, callback);
        } else if (type === 'Linear') {
            LinearFit(data, cb);
        } else if (type === 'Flow') {
            FlowFit(data, cb);
        } else {
            cb({
                err: 'bad type'
            });
        }
    }
};

module.exports = CurveFit;

let polyFit = function (data, callback) {
    let values = [],
        degree = data.degree,
        highTemp = data.highTemp,
        lowTemp = data.lowTemp,
        sensorType = data.sensorType;
    let coeff = [0, 0, 0, 0];
    if (degree === 'Cubic') {
        degree = 3;
    } else if (degree === 'Quadratic') {
        degree = 2;
    }

    // fill x,y and count from rtdtable using high and low temp with sensor

    if (rtdTables.hasOwnProperty(sensorType)) {
        for (let i = 0; i < rtdTables[sensorType].length; i++) {
            if (lowTemp <= rtdTables[sensorType][i].T && highTemp >= rtdTables[sensorType][i].T) {
                values.push([rtdTables[sensorType][i].R, rtdTables[sensorType][i].T]);
            }
        }
    }

    let result = reg('polynomial', values, degree);

    coeff = result.equation;

    callback({
        coeffs: coeff
    });
};

//------------------------------------------------------------------------------
//    Function: cubicFit()
// Description: This function performs a cubic curve fit.
//  Parameters: int  degree   - Degree of desired curve fit
//              int  count    - Number of values
//              float x[64]    - Independent letiable values
//              float y[64]    - Dependent letiable values
//              float coeff[4] - Calculated conversion coefficients
//     Returns: void
//       Notes: degree must be from 1 to 3.
//              count must be > degree and <= 64
// Rev.  0  09-18-97  LMH  Original Issue
//------------------------------------------------------------------------------

// let CubicFit = function (data, callback) {
//     let degree = data.degree,
//         highTemp = data.highTemp,
//         lowTemp = data.lowTemp,
//         sensorType = data.sensorType,
//         x = [],
//         y = [],
//         coeff = data.coeff,
//         count,
//         nterms,
//         i, j, k, n,
//         amax = 0,
//         chi = 0,
//         sumx = [], // [21] intermediate x-array
//         sumy = [], //[11] intermediate y-array
//         matrix, //[11][11]
//         xterm = 1,
//         yterm,
//         atemp = [], // [11]
//         fxi;

//     if (degree === 'Cubic') {
//         degree = 3;
//     } else if (degree === 'Quadratic') {
//         degree = 2;
//     }

//     nterms = degree + 1;

//     // fill x,y and count from rtdtable using high and low temp with sensor
//     //
//     for (i = 0; i < rtdTables[sensorType].length; i++) {
//         if (lowTemp <= rtdTables[sensorType][i].T && highTemp >= rtdTables[sensorType][i].T) {
//             x.push(rtdTables[sensorType][i].R);
//             y.push(rtdTables[sensorType][i].T);
//         }
//     }
//     count = x.length;

//     // convert matrix to 2d array
//     for (matrix = []; matrix.length < nterms; matrix.push([])) {
//         // adding an empty array for every nterms
//     }
//     //

//     // scale data to prevent loss of precision

//     for (i = 0; i < count; i++) {
//         if (Math.abs(x[i]) > amax) {
//             amax = Math.abs(x[i]);
//         }
//     }

//     for (i = 0; i < count; i++) {
//         x[i] *= 10 / amax; // check Order of Operations here
//     }

//     for (i = 0; i < nterms; i++) {
//         coeff[i] = 0;
//         atemp[i] = 0;
//     }

//     n = (nterms * 2) - 1;
//     for (i = 0; i < n; i++) {
//         sumx[i] = 0;
//     }

//     for (i = 0; i < nterms; i++) {
//         sumy[i] = 0;
//     }


//     for (i = 0; i < count; i++) {
//         xterm = 1;
//         for (j = 0; j < n; j++) {
//             sumx[j] += xterm;
//             xterm *= x[i];
//         }

//         yterm = y[i];
//         for (j = 0; j < nterms; j++) {
//             sumy[j] += yterm;
//             yterm *= x[i];
//         }
//     }

//     for (i = 0; i < nterms; i++) {
//         for (j = 0; j < nterms; j++) {
//             k = i + j;
//             matrix[i][j] = sumx[k];
//         }
//     }

//     matrixInversion(matrix, nterms);


//     // Compute each coefficient by multiplying the appropriate row of the inverse matrix by the sumy vector
//     for (i = 0; i < nterms; i++) {
//         for (j = 0; j < nterms; j++) {
//             atemp[i] += matrix[i][j] * sumy[j];
//         }
//     }

//     for (i = 0; i < count; i++) {
//         fxi = 0;
//         for (j = 0; j < nterms; j++) {
//             fxi = (fxi * x[i]) + atemp[nterms - j - 1];
//         }

//         if (y[i] === 0) {
//             chi += fxi * fxi;
//         } else {
//             chi += (1 - (fxi / y[i])) * (1 - (fxi / y[i]));
//         }
//     }

//     for (i = 0; i < nterms; i++) {
//         coeff[i] = atemp[i] * Math.pow((10 / amax), 1);
//     }

//     callback({
//         coeffs: coeff
//     });
// };

//------------------------------------------------------------------------------
//    Function: LinearFit()
// Description: This function calculates a linear conversion
//  Parameters: volt_type  - 0 is Current, 1 is Voltage, 2 is time in seconds
//              inputConv - true if conversion is for input, false for output
//              lvolts     - Low electrical value (volts, amps, ohms, or seconds)
//              hvolts     - High electrical value
//              low        - Low engineering units
//              high       - High engineering units
//              resistor   - Resistance for current in Ohms
//              max_counts - Absolute Maximum counts for conversion (4095, 1023, 255)
//              c          - Pointer to array of 2 floats to store results. First
//                            float gets offset, 2nd one gets slope
//     Returns: void
// Rev.  0  11-6-98  RWC  Original Issue
//------------------------------------------------------------------------------
let LinearFit = function (data, callback) {
    let inputConv = data.input_conv,
        lvolts = data.lvolts,
        hvolts = data.hvolts,
        low = data.low,
        high = data.high,
        c = data.c,
        offset, fhiCount, floCount, oa, ob, slope;

    // Calculate high and low count range. Pulse width requires no calculation

    fhiCount = hvolts;
    floCount = lvolts;

    /* Calculate slope and offset for linear EU vs counts equation */
    if (fhiCount !== floCount) {
        slope = (high - low) / (fhiCount - floCount);
    } else {
        slope = 0.0;
    }

    offset = low - slope * floCount; // check OOO

    /* Get reverse conversion coefficients */
    if (slope !== 0.0) {
        oa = -offset / slope;
        ob = 1.0 / slope;
    } else {
        oa = ob = 0.0;
    }


    /* Store conversion coefficients */
    if (inputConv) {
        c[0] = offset;
        c[1] = slope;
    } else {
        c[0] = oa;
        c[1] = ob;
    }


    callback({
        coeffs: c
    });
};

//------------------------------------------------------------------------------
//    Function: FlowFit()
// Description: This function takes the linear conversion coefficients for a
//               linear velocity sensor or velocity pressure sensor and
//               calculates the coefficients for a infoscan square root
//               conversion that computes the volumetric flow. For the linear
//               velocity sensor, the duct/pipe geometry and dimensions must be
//               supplied. For velocity pressure sensors, a pressure reading
//               and the corresponding flow must be supplied.
//
//  Parameters: lvSensor  - True for linear velocity sensor. False for velocity
//                            pressure sensor
//              geometry   - eRectangular for rect or square. p1 and p2 will
//                            supply length and width.
//                           eCircular for a round duct/pipe. p1 will supply
//                            diameter
//                           eCustom for irregular geometries. p1 will supply
//                            cross sectional area of conveyance
//              p1         - if lvSensor, supplies parameter indicated in
//                            geometry. if !lvSensor, supplies pressure point
//              p2         - if lvSensor, supplies parameter indicated in
//                            geometry. if !lvSensor, supplies flow at pressure
//                            point.
//              c          - Pointer to array of 4 floats to store results. On
//                            entry, c[0] should be linear conversion offset and
//                            c[1] should be linear conversion gain. On exit,
//                            c[0], c[1], c[2], and c[3] contain calculated
//                            coefficients for flow conversion
//     Returns: void
// Rev.  0  11-9-98  RWC  Original Issue
//------------------------------------------------------------------------------
let FlowFit = function (data, callback) {
    let lvSensor = data.lv_sensor,
        sensorRef = data.sensorRef,
        area = data.area,
        p1 = data.p1,
        p2 = data.p2,
        c = [],
        ia, ib, ic; // temp coefficients for flow calcs

    Utility.getOne({
        collection: 'points',
        query: {
            _id: sensorRef.Value
        }
    }, function (err, sensor) {
        if (err) {
            return callback({
                err: err
            });
        }

        c[0] = sensor['Conversion Coefficient 1'].Value;
        c[1] = sensor['Conversion Coefficient 2'].Value;
        c[2] = c[3] = 0.0;

        if (lvSensor) {
            // Compute area from parameters


            c[0] *= area;
            c[1] *= area;
            c[2] *= area;
            c[3] *= area;
        } else {
            ///////////////////////////////////////////////////////////////////
            // Convert the default DP conversion to a CFM conversion for a
            // given installation. Get data entry from user which gives the
            // DP and the corresponding CFM level for a known point on the
            // curve. These values are substituted back into the flow
            // equation to solve for the conversion coefficients. The
            // resulting conversion is of the form y = A Sqrt( B + Cx )
            // where the conversion coefficients absorb flow equation
            // constants and cross sectional area. The flow equation is:
            //
            //    Flow = 4005 A Sqrt( Pv / K )
            //    where A = Cross sectional area
            //          Pv= Velocity Pressure (differential pressure)
            //          K = Flow constant for the box
            //
            // Calculations make use of the fact that Pv is a linear
            // equation in counts.


            /* Calculate the input coefficients for the velocity equation */
            if (p1 !== 0.0) {
                ia = 1.0;
                ib = (c[0] / p1) * p2 * p2;
                ic = (c[1] / p1) * p2 * p2;
            } else {
                ia = ib = ic = 0;
            }

            c[0] = ia;
            c[1] = ib;
            c[2] = ic;
            c[3] = 0.0;
        }

        callback({
            coeffs: c
        });
    });
};

// let matrixInversion = function (matrix, nterms) {
//     let i, j, k, n,
//         ik = [], // [11]
//         jk = [], // [11]
//         amax,
//         save;

//     for (k = 0; k < nterms; k++) {
//         // Find largest element in rest of matrix
//         amax = 0;
//         for (i = k; i < nterms; i++) {
//             for (j = k; j < nterms; j++) {
//                 if (Math.abs(matrix[i][j]) > Math.abs(amax)) {
//                     amax = matrix[i][j];
//                     ik[k] = i;
//                     jk[k] = j;
//                 }
//             }
//         }

//         // Interchange rows and columns to put amax into matrix[k][k]
//         i = ik[k];

//         if (i != k) {
//             for (j = 0; j < nterms; j++) {
//                 save = matrix[k][j];
//                 matrix[k][j] = matrix[i][j];
//                 matrix[i][j] = -save;
//             }
//         }

//         // Now a row
//         j = jk[k];
//         if (j != k) {
//             for (i = 0; i < nterms; i++) {
//                 save = matrix[i][k];
//                 matrix[i][k] = matrix[i][j];
//                 matrix[i][j] = -save;
//             }
//         }

//         // Accumulate elements of inverse matrix
//         for (i = 0; i < nterms; i++) {
//             if (i != k) {
//                 matrix[i][k] = -matrix[i][k] / amax;
//             }
//         }

//         for (i = 0; i < nterms; i++) {
//             for (j = 0; j < nterms; j++) {
//                 if ((i != k) && (j != k)) {
//                     matrix[i][j] = matrix[i][j] + matrix[i][k] * matrix[k][j];
//                 }
//             }
//         }

//         for (j = 0; j < nterms; j++) {
//             if (j != k) {
//                 matrix[k][j] = matrix[k][j] / amax;
//             }
//         }

//         matrix[k][k] = 1 / amax;
//     }

//     // Restore ordering of matrix
//     for (n = 0; n < 1; n++) {
//         k = nterms - n - 1;
//         j = ik[k];
//         if (j > k) {
//             for (i = 0; i < nterms; i++) {
//                 save = matrix[i][k];
//                 matrix[i][k] = -matrix[i][j];
//                 matrix[i][j] = save;
//             }
//         }

//         i = jk[k];
//         if (i > k) {
//             for (j = 0; j < nterms; j++) {
//                 save = matrix[k][j];
//                 matrix[k][j] = -matrix[i][j];
//                 matrix[i][j] = save;
//             }
//         }
//     }
// };

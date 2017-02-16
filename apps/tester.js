const Common = require('../models/common');

let common = new Common();

console.log(common.getDefault(1.2, null), typeof common.getDefault(1.2, null));

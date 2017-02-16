const Common = require('../models/common');

let common = new Common();

console.log(common.getEnumFromTemplate('Acknowledge Statuses', 'Not Acknowledged'));

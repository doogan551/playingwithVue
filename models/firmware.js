let fs = require('fs');
let config = require('config');

let Utility = require('../models/utility');

let Firmware = class Firmware {

    //////////////////////////////////////////////////////////////////////////
    // Firmware files are stored in filesystem and file names are retrieved //
    //////////////////////////////////////////////////////////////////////////
    getModelFiles(data, cb) {
        let model = data.model;
        let firmwareFolder = config.get('Infoscan.files').firmwareLocation + model + '/';

        fs.readdir(firmwareFolder, cb);
    }
    ////////////////////////////////////////////
    // Gets remote units attached to a device //
    ////////////////////////////////////////////
    getRemoteUnits(data, cb) {
        let upi = parseInt(data.deviceUpi, 10);

        Utility.get({
            collection: 'points',
            query: {
                'Point Type.Value': 'Remote Unit',
                'Point Refs': {
                    $elemMatch: {
                        'Value': upi,
                        'PropertyName': 'Device Point'
                    }
                }
            }
        }, cb);
    }
};

module.exports = Firmware;

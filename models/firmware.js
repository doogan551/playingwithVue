const fs = require('fs');
const config = require('config');

const Firmware = class Firmware {

    //////////////////////////////////////////////////////////////////////////
    // Firmware files are stored in filesystem and file names are retrieved //
    //////////////////////////////////////////////////////////////////////////
    getModelFiles(data, cb) {
        let model = data.model;
        let firmwareFolder = config.get('Infoscan.files').firmwareLocation + model + '/';

        fs.readdir(firmwareFolder, cb);
    }
};

module.exports = Firmware;

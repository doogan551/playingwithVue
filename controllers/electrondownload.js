const express = require('express');
const fs = require('fs');
const router = express.Router();

const utils = require('../helpers/utils.js');
const ElectronDownloader = require('../models/electrondownload');

// Unchecked
router.get('/files', function (req, res, next) {
    const electronDownloader = new ElectronDownloader();

    electronDownloader.getFiles(function (err, files) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, files);
    });
});
router.get('/downloadFile', function (req, res, next) {
    let filename = req.query.filename;
    let path = `${__dirname}/../electron-dist/${filename}`;
    res.download(path, filename, function (err) {
        if (err) {
            // log it!
        } else {
            // fs.unlinkSync(path);
        }
    });
});

module.exports = router;

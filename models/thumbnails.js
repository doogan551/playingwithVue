var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);
var fs = require('fs');

module.exports = {
    batch: function(data, cb) {
        var localVars = {};

        Utility.get({
            collection: 'points',
            query: {
                _pStatus: 0,
                $or: [{
                    'Point Type.Value': 'Sequence',
                    'SequenceData': {
                        $exists: true
                    }
                }, {
                    'Point Type.Value': 'Display'
                }]
            },
            fields: {
                '_id': 1,
                'Point Type.Value': 1,
                'Name': 1
            },
            sort: {
                'Point Type.Value': -1
            }
        }, function(err, result) {
            var pageData = [];
            if (!err) {
                result.forEach(function(point, i) {
                    var record = {
                        "id": point._id,
                        "name": point.Name,
                        "type": point['Point Type'].Value.toLowerCase(),
                        "tn": fs.existsSync(__dirname + '/../public/img/thumbs/' + point._id + '.txt')
                    };
                    pageData.push(record);
                });
                localVars = {
                    err: false,
                    pageData: JSON.stringify(pageData)
                };
            } else {
                localVars = {
                    pageData: JSON.stringify(pageData),
                    err: JSON.stringify(err)
                };
            }
            return cb(null, localVars);
            // res.render("thumbnailGenerator/batch", localVars);
        });
    },
    one: function(data, cb) {
        localVars = {};

        Utility.getOne({
            collection: 'points',
            query: {
                _id: parseInt(data.id, 10)
            },
            fields: {
                '_id': 1,
                'Point Type.Value': 1,
                'Name': 1
            }
        }, function(err, result) {
            var pageData = [];
            if (!err) {
                if (result) {
                    pageData.push({
                        "id": result._id,
                        "name": result.Name,
                        "type": result['Point Type'].Value.toLowerCase(),
                        "tn": false
                    });
                }
                localVars = {
                    err: false,
                    pageData: JSON.stringify(pageData)
                };
            } else {
                localVars = {
                    pageData: JSON.stringify(pageData),
                    err: JSON.stringify(err)
                };
            }
            return cb(null, localVars);
            // res.render("thumbnailGenerator/single", localVars);
        });
    },
    saveOld: function(data, cb) {

        var thumbDir = __dirname + '/../public/img/thumbs/' + data.id + '.png',
            base64Data = data.thumb.replace(/^data:image\/png;base64,/, "");

        fs.writeFile(thumbDir, base64Data, 'base64', cb
            /*function(err) {
                        if (!err) {
                            res.json({
                                "msg": "success",
                                "result": thumbDir
                            });
                        } else {
                            res.json({
                                "msg": "Error: " + err
                            });
                        }
                    }*/
        );
    },
    save: function(data, cb) {

        var thumbDir = __dirname + '/../public/img/thumbs/' + data.id + '.txt',
            _data = data.bgColorHex + '||' + data.thumb;

        fs.writeFile(thumbDir, _data, 'utf8', function () {
            cb(null, {
                thumbDir: thumbDir
            });
        });
            /*function(err) {
                       if (!err) {
                           res.json({
                               "msg": "success",
                               "result": thumbDir
                           });
                       } else {
                           res.json({
                               "msg": "Error: " + err
                           });
                       }
                   }*/
    }
};
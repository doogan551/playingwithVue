let Utility = require('../models/utility');
let fs = require('fs');

module.exports = {
    batch: function (data, cb) {
        let locallets = {};

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
        }, function (err, result) {
            let pageData = [];
            if (!err) {
                result.forEach(function (point) {
                    let record = {
                        'id': point._id,
                        'name': point.Name,
                        'type': point['Point Type'].Value.toLowerCase(),
                        'tn': fs.existsSync(__dirname + '/../public/img/thumbs/' + point._id + '.txt')
                    };
                    pageData.push(record);
                });
                locallets = {
                    err: false,
                    pageData: JSON.stringify(pageData)
                };
            } else {
                locallets = {
                    pageData: JSON.stringify(pageData),
                    err: JSON.stringify(err)
                };
            }
            return cb(null, locallets);
            // res.render("thumbnailGenerator/batch", locallets);
        });
    },
    one: function (data, cb) {
        let locallets = {};

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
        }, function (err, result) {
            let pageData = [];
            if (!err) {
                if (result) {
                    pageData.push({
                        'id': result._id,
                        'name': result.Name,
                        'type': result['Point Type'].Value.toLowerCase(),
                        'tn': false
                    });
                }
                locallets = {
                    err: false,
                    pageData: JSON.stringify(pageData)
                };
            } else {
                locallets = {
                    pageData: JSON.stringify(pageData),
                    err: JSON.stringify(err)
                };
            }
            return cb(null, locallets);
            // res.render("thumbnailGenerator/single", locallets);
        });
    },
    saveOld: function (data, cb) {
        let thumbDir = __dirname + '/../public/img/thumbs/' + data.id + '.png',
            base64Data = data.thumb.replace(/^data:image\/png;base64,/, '');

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
    save: function (data, cb) {
        let thumbDir = __dirname + '/../public/img/thumbs/' + data.id + '.txt',
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

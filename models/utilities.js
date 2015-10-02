var fs = require('fs');
var jade = require('jade');

var Utility = require('../models/utility');

module.exports = {

    getUtility: function(data, cb) {
        var criteria = {
            query: {
                'UtilityName': data.UtilityName
            },
            collection: 'Utilities'
        };

        Utility.getOne(criteria, cb);
    },

    saveUtility: function(_data, cb) {
        var utility = _data.utility;
        var path = utility.path;
        var data = utility.data;
        var remove = utility.remove.toString();
        var updateObj;

        if (remove === 'true' && !!path) {
            updateObj = {
                $unset: {}
            };
            updateObj['$unset'][path] = 1;

        } else {
            updateObj = {
                $set: {}
            };
            if (!!path) {
                updateObj['$set'][path] = data;
            } else {
                delete updateObj.path;
                for (var prop in data) {
                    updateObj['$set'][prop] = data[prop];
                }
            }
        }

        Utility.update({
            collection: 'Utilities',
            query: {
                "utilityName": utility.utilityName
            },
            updateObj: updateObj,
            options: {
                upsert: true
            }
        }, cb);
    },

    uploadBackground: function(data, cb) {
        var c,
            path = [__dirname, '..', 'public', 'img', 'dashboard', 'backgrounds', ''].join('/'),
            uploadedFiles = data.files,
            list = Object.keys(uploadedFiles),
            obj = uploadedFiles[list[0]];

        fs.writeFile(path + obj.originalname, obj.buffer, cb);
    },

    getMarkup: function(data, cb) {
        var type = data.type;
        module.exports.getUtilityMarkup(type, cb);
    },

    getUtilityMarkup: function(data, cb) {
        var type = data.type;
        var filename = __dirname + '/../views/dashboard/utility_' + type + '.jade';
        fs.readFile(filename, 'utf8', function(err, data) {
            var fn,
                html;

            fn = jade.compile(data, {
                filename: filename
            });

            html = fn({});

            cb(html);
        });
    }

};
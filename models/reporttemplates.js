var Utility = require('../models/utility');
var utils = require('../helpers/utils.js');
var BSON = require('mongodb').BSONPure;

module.exports = {

    getTemplate: function(data, cb) {
        var query = {};

        if (data.templateId !== undefined) {
            query._id = BSON.ObjectID(data.templateId);
        } else if (data.templateName !== undefined) {
            query.Name = data.templateName;
        } else {
            return cb("No valid data supplied.");
        }

        var criteria = {
            query: query,
            collection: 'ReportTemplates'
        };

        Utility.getOne(criteria, cb);
    },
    addTemplate: function(data, cb) {
        var template = data.template;
        var name = data.name;
        var type = utils.converters.convertType(data.type);

        var criteria = {
            insertObj: {
                Name: name,
                Template: template,
                Type: type
            },
            collection: 'ReportTemplates'
        };

        Utility.insert(criteria, function(err, result) {
            if (err) {
                return cb(err);
            } else {
                criteria = {
                    query: {
                        _id: utils.converters.convertType(data.id)
                    },
                    updateObj: {
                        $addToSet: {
                            'Templates': result[0]._id
                        }
                    },
                    collection: 'points'
                };
                Utility.update(criteria, cb);

            }
        });
    },
    renameTemplate: function(data, cb) {
        var templateId = BSON.ObjectID(data.templateId);
        var templateName = data.templateName;

        var criteria = {
            query: {
                _id: templateId
            },
            updateObj: {
                $set: {
                    Name: templateName
                }
            },
            collection: 'ReportTemplates'
        };

        Utility.update(criteria, cb);
    },
    deleteTemplate: function(data, cb) {
        var templateId = BSON.ObjectID(data.templateId);

        var criteria = {
            query: {
                _id: templateId
            },
            collection: 'ReportTemplates'
        };

        Utility.remove(criteria, cb);
    },
    getAllTemplates: function(data, cb) {
        var query = {};

        if (data.Type) {
            query = {
                Type: utils.converters.convertType(data.Type)
            };
        }

        var criteria = {
            query: query,
            fields: {
                Name: 1
            },
            collection: 'ReportTemplates'
        };

        Utility.get(criteria, cb);
    },
    getSelectedTemplates: function(data, cb) {
        var query = {
            _id: {
                $in: []
            }
        };

        var templates = data.templates;

        if (templates !== undefined && templates.length === 0) {
            return cb("No valid data supplied.");
        }

        for (var i = 0; i < templates.length; i++) {
            query._id.$in.push(BSON.ObjectID(templates[i]));
        }

        var criteria = {
            query: query,
            fields: {
                Name: 1
            },
            collection: 'ReportTemplates'
        };

        Utility.get(criteria, cb);
    },
    updateTemplate: function(data, cb) {
        var templateId = BSON.ObjectID(req.body.templateId);
        var template = req.body.template;

        var criteria = {
            query: {
                _id: templateId
            },
            updateObj: {
                $set: {
                    Template: template
                }
            },
            collection: 'ReportTemplates'
        };

        Utility.update(criteria, cb);
    }
};
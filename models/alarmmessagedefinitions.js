var alarmMessageDefinitions, _, parsers, alarmMessageDefinitionsHelperData, util, validators,
    mongoose, Schema, amdSchema, amdModel, virtualId, virtuals, statics, instanceMethods;
mongoose = require('mongoose');
ObjectId = require('mongodb').ObjectID;
util = require("util");
_ = require('lodash');

amdModel = require('../models/alarmmessageschema');

var base, mongooseConn;
mongooseConn = GLOBAL.mongooseConn;
module.exports = {
    get: function(req, res, next) {
        var templateOpts;
        templateOpts = {
            msgCat: amdModel.helperData().categories,
            msgType: amdModel.helperData().types,
            editTemplates: amdModel.templates(),
            validators: amdModel.validators(),
            hierarchy: amdModel.helperDataHierarchy()
        };
        res.locals.templateOpts = templateOpts;
        amdModel.find().exec(function(er, d) {
            templateOpts.alarmMessageDefinitions = d;
            if (er) {
                templateOpts.alarmMessageDefinitions = [];
            }
            res.render('alarmMessageDefinition/index.jade');
        });

    },
    getModule: function(req, res, next) {
        res.render('alarmMessageDefinition/module.jade');
    },
    api: {
        all: function(req, res, next) {
            req.alarmMessageDefinition = amdModel.parse(req.body);
            callback = function(er, data) {
                var ifErr = {
                    'true': function() {
                        res.json({
                            success: false,
                            error: er
                        });
                        return;
                    },
                    'false': function() {
                        res.json({
                            success: true,
                            result: data
                        });
                    }
                };
                ifErr[er !== null]();
            };
            next();
        },
        get: function(req, res, next) {
            amdModel.finder({}, callback);
        },
        'getbyid': function(req, res, next) {
            console.log('TURD', req.params.id);
            amdModel.finderOne(req.params.id, function(er, data) {
                var ifErr = {
                    'true': function() {
                        res.json({
                            success: false,
                            error: er
                        });
                        return;
                    },
                    'false': function() {
                        res.json({
                            success: true,
                            result: data
                        });
                        return;
                    }
                };
                ifErr[er !== null]();
            });
        },
        post: function(req, res, next) {
            var m = new model(req.alarmMessageDefinition);
            m._id = new ObjectId();
            m.isSystemMessage = false;
            m.save(function(er, doc, rows) {
                callback(er, doc);
            });
        },
        'put': function(req, res, next) {
            var id;
            id = req.body._id;
            amdModel.set(id, req.alarmMessageDefinition, callback);
        },
        'delete': function(req, res, next) {
            amdModel.remove(req.params.id, function(er, doc) {
                doc = doc || {};
                if (_.isNull(er) && _.isNull(doc)) {
                    res.json({
                        error: 'Not Found'
                    });
                }
                if (er) {
                    res.json(er);
                } else {
                    res.json(doc);
                }

            });
        }
    },
    helperData: {
        get: function(req, res, next) {
            var templateOpts, definitions;
            templateOpts = {
                templates: amdModel.templates(),
                validators: amdModel.validators(),
                hierarchy: amdModel.helperDataHierarchy()
            };
            amdModel.find().exec(function(er, d) {
                templateOpts.definitions = d;
                if (er) {
                    templateOpts.alarmMessageDefinitions = [];
                }
                res.json(templateOpts);
            });
        }
    }
};
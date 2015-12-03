var alarmMessageDefinitions, _, enumerator, parsers, alarmMessageDefinitionsHelperData, util, validators,
    mongoose, Schema, amdSchema, amdModel, virtualId, statics, virtuals, instanceMethods;
mongoose = require('mongoose');
ObjectId = require('mongodb').ObjectID;
util = require("util");
_ = require('lodash');
enumerator = require('../helpers/enumerator');
validators = {
    msgCat: {
        validator: function() {
            var msgCat;
            return true;
        },
        msg: '{Path} must be cloned'
    }
};
alarmMessageDefinitionsHelperData = {
    categories: function() {
        var categoriesResult;
        categoriesResult = _.map(enumerator('Alarm Categories'), function(v, i) {
            return {
                name: i,
                'enum': v['enum']
            };
        });
        categoriesResult.push({
            name: 'System',
            enum: 0
        });
        return categoriesResult;
    }(),
    types: function() {
        var typesResult;
        typesResult = _.map(enumerator('Alarm Types'), function(v, i) {
            return {
                name: i,
                'enum': v['enum']
            };
        });
        typesResult.enums = ["14", "15", "17", "18", "21", "22", "23", "24", "25", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "45", "46", "47", "48", "49", "50", "51", "52", "53", "2", "11", "12", "13"];
        return typesResult;
    }(),
    colors: function() {
        return ["#F0F8FF", "#FAEBD7", "#00FFFF", "#7FFFD4", "#F0FFFF", "#F5F5DC", "#FFE4C4", "#000000", "#FFEBCD", "#0000FF", "#8A2BE2", "#A52A2A", "#DEB887", "#5F9EA0", "#7FFF00", "#D2691E", "#FF7F50", "#6495ED", "#FFF8DC", "#DC143C", "#00FFFF", "#00008B", "#008B8B", "#B8860B", "#A9A9A9", "#006400", "#BDB76B", "#8B008B", "#556B2F", "#FF8C00", "#9932CC", "#8B0000", "#E9967A", "#8FBC8F", "#483D8B", "#2F4F4F", "#00CED1", "#9400D3", "#FF1493", "#00BFFF", "#696969", "#1E90FF", "#B22222", "#FFFAF0", "#228B22", "#FF00FF", "#DCDCDC", "#F8F8FF", "#FFD700", "#DAA520", "#808080", "#008000", "#ADFF2F", "#F0FFF0", "#FF69B4", "#CD5C5C", "#4B0082", "#FFFFF0", "#F0E68C", "#E6E6FA", "#FFF0F5", "#7CFC00", "#FFFACD", "#ADD8E6", "#F08080", "#E0FFFF", "#FAFAD2", "#D3D3D3", "#90EE90", "#FFB6C1", "#FFA07A", "#20B2AA", "#87CEFA", "#778899", "#B0C4DE", "#FFFFE0", "#00FF00", "#32CD32", "#FAF0E6", "#FF00FF", "#800000", "#66CDAA", "#0000CD", "#BA55D3", "#9370DB", "#3CB371", "#7B68EE", "#00FA9A", "#48D1CC", "#C71585", "#191970", "#F5FFFA", "#FFE4E1", "#FFE4B5", "#FFDEAD", "#000080", "#FDF5E6", "#808000", "#6B8E23", "#FFA500", "#FF4500", "#DA70D6", "#EEE8AA", "#98FB98", "#AFEEEE", "#DB7093", "#FFEFD5", "#FFDAB9", "#CD853F", "#FFC0CB", "#DDA0DD", "#B0E0E6", "#800080", "#FF0000", "#BC8F8F", "#4169E1", "#8B4513", "#FA8072", "#F4A460", "#2E8B57", "#FFF5EE", "#A0522D", "#C0C0C0", "#87CEEB", "#6A5ACD", "#708090", "#FFFAFA", "#00FF7F", "#4682B4", "#D2B48C", "#008080", "#D8BFD8", "#FF6347", "#40E0D0", "#EE82EE", "#F5DEB3", "#FFFFFF", "#F5F5F5", "#FFFF00", "#9ACD32"];
    }(),
    valueTags: function() {
        var tags, tag, _tags;
        tags = [{
            code: 'AV',
            name: 'Alarm Value',
            description: 'Include point name in alarm message'
        }, {
            code: 'NAME',
            name: 'Point Name',
            description: 'Include point name in alarm message'
        }, {
            code: 'PV',
            name: 'Point Value',
            description: 'Include point name in alarm message'
        }, {
            code: 'RC',
            name: 'Reliability Value',
            description: 'Include point name in alarm message'
        }, {
            code: 'UT',
            name: 'Units Value',
            description: 'Include point name in alarm message'
        }, ];
        return tags;
    }(),
    hierarchy: function() {
        return [{
            "Category": "Alarm",
            "Type Name": "Low Limit",
            "Type Value": "3",
            "Value Tags": "%PV, %AV, %UT"
        }, {
            "Category": "Alarm",
            "Type Name": "High Limit",
            "Type Value": "4",
            "Value Tags": "%PV, %AV, %UT"
        }, {
            "Category": "Alarm",
            "Type Name": "Offnormal",
            "Type Value": "5",
            "Value Tags": "%PV"
        }, {
            "Category": "Alarm",
            "Type Name": "Device Failure",
            "Type Value": "7",
            "Value Tags": ""
        }, {
            "Category": "Alarm",
            "Type Name": "Reliability",
            "Type Value": "17",
            "Value Tags": "%RC"
        }, {
            "Category": "Alarm",
            "Type Name": "Program Halt",
            "Type Value": "36",
            "Value Tags": ""
        }, {
            "Category": "Alarm",
            "Type Name": "Low Warning",
            "Type Value": "47",
            "Value Tags": "%PV, %AV, %UT"
        }, {
            "Category": "Alarm",
            "Type Name": "High Warning",
            "Type Value": "48",
            "Value Tags": "%PV, %AV, %UT"
        }, {
            "Category": "Alarm",
            "Type Name": "Open",
            "Type Value": "49",
            "Value Tags": "%PV"
        }, {
            "Category": "Alarm",
            "Type Name": "Closed",
            "Type Value": "50",
            "Value Tags": "%PV"
        }, {
            "Category": "Maintenance",
            "Type Name": "Run Time Limit",
            "Type Value": "20",
            "Value Tags": ""
        }, {
            "Category": "Maintenance",
            "Type Name": "Starts Limit",
            "Type Value": "26",
            "Value Tags": ""
        }, {
            "Category": "Return",
            "Type Name": "Return to Normal",
            "Type Value": "2",
            "Value Tags": "%PV"
        }, {
            "Category": "Return",
            "Type Name": "Device Operational",
            "Type Value": "8",
            "Value Tags": ""
        }];
    }

};
amdSchema = new mongoose.Schema({
    msgFormat: {
        type: String,
        required: true,
        name: 'msgFormat'
    },
    msgType: {
        type: Number,
        required: true,
        name: 'msgType'
    },
    msgCat: {
        type: Number,
        required: true,
        'name': 'msgCat',
        validate: validators.msgCat
    },
    msgName: {
        type: String,
    },
    msgTextColor: {
        type: String,
        required: true,
        default: '#000000',
        name: 'msgTextColor'
    },
    msgBackColor: {
        type: String,
        required: true,
        default: '#ffffff',
        name: 'msgBackColor'
    },
    isSystemMessage: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    collection: 'AlarmDefs',
    _id: true,
    versionKey: false
});
amdSchema.set('toObject', {
    virtuals: true,
    getters: true
});
amdSchema.set('toJSON', {
    virtuals: true,
    getters: true
});
virtuals = {
    msgTypeName: function() {
        var result;
        result = _.findWhere(alarmMessageDefinitionsHelperData.types, {
            'enum': parseInt(this.msgType, 10)
        });
        if (_.isUndefined(result)) {
            result = {
                'enum': 1,
                name: 'System Message'
            };
        }
        return result.name;
    },
    msgCatName: function() {
        var result;
        result = _.findWhere(alarmMessageDefinitionsHelperData.categories, {
            'enum': parseInt(this.msgCat, 10)
        });
        if (_.isUndefined(result)) {
            result = {
                'enum': 0,
                name: 'System'
            };
        }
        return result.name;
    },
    systemMessage: function() {
        var result;
        result = this.msgCatName === 'Event';
        return result;
    },
    template: function() {
        var templateName, isEditable, self, hierarchy;
        self = this;
        hierarchy = alarmMessageDefinitionsHelperData.hierarchy();
        templateName = 'editSystemMessage';
        if (self.msgCatName !== 'Event' || self.msgTypeName !== 'System Message') {
            templateName = 'editMessage';
        }
        return templateName;
    }
};
instanceMethods = {

};
statics = {
    remove: function(id, callback) {
        this.findById(id, function(er, doc) {
            if (er) {
                callback(er, null);
                return er;
            }
            if (_.isObject(doc)) {
                doc.remove(_.partial(callback, er));
                //code
                return false;
            }
            callback(er, doc);
            return false;
        });
    },
    set: function(id, set, callback) {
        var _this, template, toSet, isSystemMessage, performUpdate;
        _this = this;
        performUpdate = function(doc, vals) {
            var eachProp, props;
            props = _.keys(vals);
            eachProp = function(v, i) {
                if (!_.isUndefined(vals[v])) {
                    doc[v] = vals[v];
                }
            };
            _.each(props, eachProp);
            return doc;
        };
        template = statics.getTemplate(set.template);
        this.findById(id, function(er, doc) {
            if (er) {
                callback(er, doc);
                return;
            }
            if (_.isNull(doc)) {
                callback({
                    error: 'Not Found'
                }, null);
                return;
            }
            performUpdate(doc, set);
            doc.save(function(err) {
                callback(err, doc);
            });
        });
        return null;
    },
    finder: function(query, callback) {
        this.find(query).exec(callback);
        return null;
    },
    finderOne: function(id, callback) {
        this.findById(id).exec(callback);
        return null;
    },
    parse: function(request) {
        var output, formatters, keys, eachKey;
        if (!_.isObject(request)) {
            return {};
        }
        template = statics.getTemplate(request.template);
        keys = _.chain(template).keys().without('template').value();
        keys = _.intersection(keys, _.keys(request));
        output = _.pick(request, keys);
        eachKey = function(v, i) {
            if (!_.isUndefined(request[v])) {
                output[v] = request[v]; //code
            }
        };
        _.each(keys, eachKey);
        return output;
    },
    helperData: function() {
        return alarmMessageDefinitionsHelperData;
    },
    templates: function() {
        return {
            'editSystemMessage': {
                _id: 0,
                template: 'editSystemMessage',
                'msgBackColor': '',
                'msgTextColor': '',
                'msgName': ''
            },
            'editMessage': {
                _id: 0,
                'template': 'editMessage',
                'msgBackColor': '',
                'msgTextColor': '',
                'msgName': '',
                'msgFormat': ''
            },
            'newMessage': {
                'template': 'newMessage',
                'msgBackColor': '',
                'msgTextColor': '',
                'msgName': '',
                'msgFormat': '',
                'msgCat': '',
                'msgType': ''
            },
            delete: {}
        };
    },
    getTemplate: function(data) {
        var _this, methods, result;
        _this = data;
        result = _.extend({}, statics.templates()[_this]);
        if (_.isUndefined(result)) {
            result = statics.templates()['editSystemMessage'];
        }
        return result;
    },
    hydrateTemplate: function(template, doc) {
        var keys, result, eachKey;
        result = {};
        keys = _.keys(template);
        eachKey = function(v, i) {
            result[v] = doc[v];
        };
        _.each(keys, eachKey);
        return result;
    },
    helperDataHierarchy: alarmMessageDefinitionsHelperData.hierarchy,
    validators: function() {
        return _.pluck(amdSchema.paths, 'options');
    }

};
_.extend(amdSchema.statics, statics);
amdSchema.virtual('msgCatName').get(virtuals.msgCatName);
amdSchema.virtual('msgTypeName').get(virtuals.msgTypeName);
amdSchema.virtual('systemMessage').get(virtuals.systemMessage);
amdSchema.virtual('template').get(virtuals.template);
amdModel = mongoose.model('AlarmMessageDefinitions', amdSchema);

module.exports = amdModel;
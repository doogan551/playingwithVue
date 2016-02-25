dorsett.models = dorsett.models || {};
dorsett.models.mappings = dorsett.models.mappings || {};

dorsett.models.userModel = function(_data) {
    //make a clone
    var data = ko.utils.parseJson(ko.toJSON(_data)),
        userModel = {
            _id: null,
            username: '',
            Password: '',
            'Password Reset': false,
            'Last Login Time': null,
            'Last Activity Time': null,
            'Auto Logout Duration': null,
            'First Name': '',
            'Last Name': '',
            'System Admin': false,
            Photo: '',
            Title: '',
            'Voice': [],
            'SMS': [],
            'Email': []
        },
        mappedModel;

    mappedModel = $.extend(userModel, data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.User, this);
};

dorsett.models.contactVoiceModel = function(_data) {
    var contactInfoModel = {
            Name: '',
            Value: ''
        },
        mappedModel;
    mappedModel = $.extend(contactInfoModel, _data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.ContactInfo, 'Voice');
};

dorsett.models.contactSMSModel = function(_data) {
    var contactInfoModel = {
            Name: '',
            Value: ''
        },
        mappedModel;
    mappedModel = $.extend(contactInfoModel, _data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.ContactInfo, 'SMS');
};

dorsett.models.contactEmailModel = function(_data) {
    var contactInfoModel = {
            Name: '',
            Value: ''
        },
        mappedModel;
    mappedModel = $.extend(contactInfoModel, _data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.ContactInfo, 'Email');
};

dorsett.models.mappings.User = {
    copy: ['_id'],
    key: function(_data) {
        return _data._id;
    },
    'First Name': {
        create: function(options) {
            return ko.observable(options.data).extend({
                required: {
                    message: ' *required field'
                }
            });
        }
    },
    'Last Name': {
        create: function(options) {
            return ko.observable(options.data).extend({
                required: {
                    message: ' *required field'
                }
            });
        }
    },
    'Last Login Time': {
        create: function(options) {
            var t = new Date(0);
            if (!!!options.data) return 'Never';
            t.setUTCSeconds(options.data);
            return moment(t).calendar();
        }
    },
    'Last Activity Time': {
        create: function(options) {
            var t = new Date(0);
            if (!!!options.data) return 'None';
            t.setUTCSeconds(options.data);
            return moment(t).calendar();
        }
    },
    Title: {
        create: function(options) {
            return ko.observable(options.data).extend({
                required: {
                    message: ' *required field'
                }
            });
        }
    },
    username: {
        create: function(options) {
            return ko.observable(options.data).extend({
                required: {
                    message: ' *required field'
                },
                validation: {
                    validator: function(val) {
                        return !!!ko.utils.arrayFirst(dorsett.userData.allData(), function(item) {
                            if (item._id == options.parent._id) return false;
                            return item.username.toLowerCase() == val.toLowerCase();
                        });
                    },
                    message: '*already exists'
                }
            });
        }
    },
    Password: {
        create: function(options) {
            return ko.observable('').extend({
                required: {
                    onlyIf: function() {
                        return !!!options.parent._id;
                    },
                    message: 'Password is required. Click the button below to set the password.'
                }
            });
        }
    },
    'Voice': {
        create: function(options) {
            return ko.mapping.fromJS(options.data);
            // return new dorsett.models.contactVoiceModel(options.data);
        }
    },
    'SMS': {
        create: function(options) {
            return ko.mapping.fromJS(options.data);
            // return new dorsett.models.contactSMSModel(options.data);
        }
    },
    'Email': {
        create: function(options) {
            return ko.mapping.fromJS(options.data);
            // return new dorsett.models.contactEmailModel(options.data);
        }
    }
};


dorsett.models.mappings.ContactInfo = {
    copy: ['username', 'Last Login Time', 'Last Activity Time', 'Auto Logout Duration'],
    Type: {
        create: function(options) {
            return ko.observable(options.data);
        }
    },
    Value: {
        create: function(options) {
            var type = options.parent;
            if (dorsett.contactValidationMap.hasOwnProperty(type)) {
                return ko.observable(options.data).extend(dorsett.contactValidationMap[type].val);
            } else {
                return ko.observable(options.data);
            }
        }
    }
};
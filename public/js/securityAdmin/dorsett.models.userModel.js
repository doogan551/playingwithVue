dorsett.models = dorsett.models || {};
dorsett.models.mappings = dorsett.models.mappings || {};

dorsett.models.userModel = function(_data) {
    //make a clone
    var data = ko.utils.parseJson(ko.toJSON(_data)),
        userModel = {
            _id:null,
            username:'',
            Password:'',
            'Password Reset': false,
            'Last Login Time': null,
            'Last Activity Time': null,
            'Auto Logout Duration':0,
            'First Name':'',
            'Last Name':'',
            'System Admin':false,
            'Session Length': 0,
            Photo:'',
            Title:'',
            'Contact Info':[]
        },
        mappedModel;

    mappedModel = $.extend(userModel, data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.User, this);
};

dorsett.models.contactInfoModel = function(_data) {
    var contactInfoModel = {
            Type: '',
            Value: ''
        },
        mappedModel;
    mappedModel = $.extend(contactInfoModel, _data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.ContactInfo, this);
};

dorsett.models.mappings.User = {
    copy: ['_id'],
    key: function(_data) {
        return _data._id;
    },
    'First Name'          : {
        create : function( options ) {
            return ko.observable( options.data ).extend( {required : { message: ' *required field' }} );
        }
    },
    'Last Name'          : {
        create : function( options ) {
            return ko.observable( options.data ).extend( {required : { message: ' *required field' }} );
        }
    },
    'Last Login Time'          : {
        create : function( options ) {
            var t = new Date(0);
            if (!!!options.data) return 'Never';
            t.setUTCSeconds(options.data)
            return moment(t).calendar();
        }
    },
    'Last Activity Time'          : {
        create : function( options ) {
            var t = new Date(0);
            if (!!!options.data) return 'None';
            t.setUTCSeconds(options.data)
            return moment(t).calendar();
        }
    },
    Title          : {
        create : function( options ) {
            return ko.observable( options.data ).extend( {required : { message: ' *required field' }} );
        }
    },
    username          : {
        create : function( options ) {
            console.log('id', options.parent._id);
            return ko.observable( options.data ).extend( {
                required : { message: ' *required field' },
                validation: {
                    validator: function (val) {
                        return !!!ko.utils.arrayFirst(dorsett.userData.allData(), function(item) {
                            if (item._id == options.parent._id) return false;
                            return item.username.toLowerCase() == val.toLowerCase();
                        });
                    },
                    message: '*already exists'
                }
            } );
        }
    },
    Password          : {
        create : function( options ) {
            return ko.observable( '').extend({required: { onlyIf: function() { return !!!options.parent._id }, message: 'Password is required. Click the button below to set the password.'}});
        }
    },
    'Contact Info'    : {
        create : function( options ) {
            return new dorsett.models.contactInfoModel( options.data );
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
            var i = 0,
                items = dorsett.contactValidationMap.length;
            for (i; i < items; i++) {
                if (dorsett.contactValidationMap[i].type == options.parent.Type()) {
                    return ko.observable( options.data ).extend( dorsett.contactValidationMap[i].val );
                }
            }
            return ko.observable( options.data );
        }
    }
};

dorsett.models = dorsett.models || {};
dorsett.models.mappings = dorsett.models.mappings || {};

dorsett.models.groupModel = function(_data) {
    //make a clone
     var data = ko.utils.parseJson(ko.toJSON(_data)),
     //Transform users object to array
        users = [];
    if (!!data.Users) {
        users = $.map(data.Users, function (value, key) {
            var user = ko.utils.arrayFirst(dorsett.userData.allData(), function(item) {
                return item._id == key;
            });
            if (!!user) {
                return {userid: key, FullName: user['First Name'] + ' ' + user['Last Name'], Photo: user.Photo, 'Group Admin': value['Group Admin']};
            }
        });
    }
    data.Users = users;
    var groupModel = {
            _id:null,
            'User Group Name':'',
            Description:'',
            Users:[],
            _pAccess: 0,
            Photo: ''
        },
        mappedModel;

    mappedModel = $.extend(groupModel, data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.Group, this);
};

dorsett.models.groupUserModel = function(_data) {
    var groupUserModel = {
            userid: '',
            FullName: '',
            Photo:'',
            'Group Admin': false
        },
        mappedModel;
    mappedModel = $.extend(groupUserModel, _data);
    ko.mapping.fromJS(mappedModel, dorsett.models.mappings.groupUser, this);
};

dorsett.models.mappings.Group = {
    copy: ['_id'],
    key: function(_data) {
        return _data._id;
    },
    'User Group Name'          : {
        create : function( options ) {
            return ko.observable( options.data ).extend( {
                required : { message: ' *required field' },
                validation: {
                    validator: function (val) {
                        return !!!ko.utils.arrayFirst(dorsett.groupData.allData(), function(item) {
                            if (item._id == options.parent._id) return false;
                            return item['User Group Name'].toLowerCase() == val.toLowerCase();
                        });
                    },
                    message: '*already exists'
                }
            } );
        }
    },
    Users    : {
        create : function( options ) {
            return new dorsett.models.groupUserModel( options.data );
        }
    },
    _pAccess : {
        create: function(options) {
            return ko.observable(options.data);
        }
    }
};


dorsett.models.mappings.groupUser = {
    copy: ['userid']//,
//    'Group Admin': {
//        create: function(options) {
//            return ko.observable(options.data);
//        }
//    }
};

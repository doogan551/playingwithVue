//global app reference
var dorsett = (function() {
    //private
    var _webendpoint = window.location.origin,
        _webendpointURI = _webendpoint + '/api/security/',
        // _socketendpoint = 'http://' + window.location.hostname + ':9376',
        _pointSelector = _webendpoint + '/pointlookup',
        _tabOpen = '',
        //function to detach child entities
        DraggableType = function() {
            var _types = {
                    user: 'group',
                    group: 'user'
                },
                _type = '';
            this.typeName = function(type) {
                _type = !!type ? _types[type] : _type;
                return _type;
            };
        },
        extractProperty = function(name) {
            var property = this[name];
            delete this[name];
            return property;
        },
        phoneValidatorObj = {
            required: true,
            pattern: {
                message: 'Invalid phone number.',
                params: /^\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})$/
            }
        },
        registerEvents = function() {
            $('#DT_Security_panel')
                .on('mouseenter', 'li', function() {
                    $(this).find('.closeBtn').show();
                })
                .on('mouseleave', 'li', function() {
                    $(this).find('.closeBtn').hide();
                });
        },
        transformToShallow = function(data) {
            var property;
            //transform data since our API doesn't need iswriteready flags and we know what is displayable
            for (prop in data) {
                property = data[prop];
                if (!!property && typeof property.Value != 'undefined') {
                    data[prop] = property.Value;
                }
            }
            return data;
        },
        default_cmp = function(a, b) {
            if (a == b) return 0;
            return a < b ? -1 : 1;
        },
        getCmpFunc = function(primer, reverse) {
            var dfc = default_cmp, // closer in scope
                cmp = default_cmp;
            if (primer) {
                cmp = function(a, b) {
                    return dfc(primer(a), primer(b));
                };
            }
            if (reverse) {
                return function(a, b) {
                    return -1 * cmp(a, b);
                };
            }
            return cmp;
        };

    //console.log(_webendpointURI);

    return {
        //public vars
        domContext: {},
        headerContext: {},
        domContextHeight: ko.observable(),
        domContextWidth: ko.observable(),
        draggedItem: {},
        groupData: {},
        userData: {},
        editData: {},
        msg: {},
        draggableType: new DraggableType(),

        /**
         * Initialization of our namespace
         */
        initialize: function(DOMContext) {
            var self = this,
                $sections = $('#DT_Security_sections'),
                $loadingTitle = $('#loadingTitle'),
                $loadScreen = $('#loadingScreen');
            infuser.defaults.templateUrl = "js/securityAdmin/views";
            infuser.defaults.templateSuffix = ".tmpl.htm";
            infuser.defaults.templatePrefix = "";

            Messenger.options = {
                extraClasses: 'messenger-fixed messenger-on-top',
                theme: 'future'
            };

            $.when(
                self.getUsers(),
                self.getGroups()
            ).done(
                function() {
                    self.domContext = DOMContext;
                    self.headerContext = $('#DT_Security_header');
                    self.resize();
                    self.domContext.resize(
                        function() {
                            self.resize();
                        }
                    );
                    ko.applyBindings(self, $('#DT_Security_main')[0]);
                    //$loadingTitle.find('p').hide();
                    //$loadingTitle.addClass('animated flipOutY');
                    setTimeout(function() {
                        $loadScreen.addClass('animated fadeOut');
                        setTimeout(function() {
                            $loadScreen.hide();
                            //$loadingTitle.removeClass('animated flipOutY');
                            $loadScreen.removeClass('animated fadeOut');
                        }, 1000);
                    }, 500);
                });
            registerEvents();
        },

        /**
         * Data methods
         */
        getGroups: function() {
            var self = this,
                sort = function() {
                    return dorsett.sortBy('User Group Name');
                };
            return $.ajax({
                url: _webendpointURI + 'groups/getallgroups',
                contentType: 'application/json',
                dataType: 'json',
                type: 'post'
            }).done(
                function(data) {
                    var i = 0,
                        recordCount = data.length;
                    for (i; i < recordCount; i++) {
                        data[i] = transformToShallow(data[i]);
                    }
                    if (typeof self.groupData.allData == 'undefined') {
                        self.groupData = new dorsett.PagedObservableArray({
                            pageSize: 500,
                            searchFields: ['User Group Name'],
                            data: data,
                            sort: sort
                        });
                    } else {
                        self.groupData.allData(data);
                    }
                }
            );
        },
        getUsers: function() {
            var self = this,
                sort = function() {
                    return dorsett.sortBy('Last Name', 'First Name');
                };
            return $.ajax({
                url: _webendpointURI + 'users/getallusers',
                contentType: 'application/json',
                dataType: 'json',
                type: 'post'
            }).done(
                function(data) {
                    // console.log(data.Users);
                    var users = data.Users,
                        i = 0,
                        recordCount = users.length;
                    for (i; i < recordCount; i++) {
                        users[i] = transformToShallow(users[i]);
                    }
                    //console.log(users);
                    if (typeof self.userData.allData == 'undefined') {
                        self.userData = new dorsett.PagedObservableArray({
                            pageSize: 500,
                            searchFields: ['First Name', 'Last Name', 'username'],
                            data: users,
                            sort: sort
                        });
                    } else {
                        self.userData.allData(users);
                    }
                }
            );
        },

        /**
         * Filters
         * API or database doesn't enforce relationships,
         * so we have to ensure the keys align
         */


        /**
         * Window resize event handler
         */
        resize: function() {
            var self = this,
                height = self.domContext.height() - self.headerContext.outerHeight(),
                width = self.domContext.width() - $('#DT_Security_panel').outerWidth();

            self.domContextHeight(height);
            self.domContextWidth(width);
        },
        showPanel: function(type, data) {
            if (!!data._id && data._id == dorsett.editData._id) return dorsett.hidePanel();
            var $panel = $('#DT_Security_panel'),
                $panelWindow = $('#DT_Security_panelWindow'),
                $sections = $('#DT_Security_sections'),
                groups = ko.utils.parseJson(ko.toJSON(dorsett.groupData.allData())),
                userGroups = [];

            dorsett.draggableType.typeName(type);

            if (type == 'group') {
                dorsett.editData = new dorsett.models.groupModel(data);
                dorsett.editData.pAccess = function(accessLevel) {
                    return ko.computed({
                        read: function() {
                            return !!(this._pAccess() & accessLevel);
                        },
                        write: function(checked) {
                            console.log(this);
                            if (checked) {
                                this._pAccess(this._pAccess() | accessLevel);
                            } else {
                                this._pAccess(this._pAccess() & ~accessLevel);
                            }
                        }
                    }, dorsett.editData);
                };
            }
            if (type == 'user') {
                dorsett.editData = new dorsett.models.userModel(data);
                dorsett.editData.Password = ko.observable('');
                userGroups = ko.utils.arrayFilter(groups,
                    function(group) {
                        var groupId = group._id;
                        if (group.Users == undefined) return false;
                        for (var prop in group.Users) {
                            if (group.Users.hasOwnProperty(prop)) {
                                if (prop == dorsett.editData._id) {
                                    group['Group Admin'] = group.Users[prop]['Group Admin'];
                                    return true;
                                }
                            }
                        }
                    }
                );
                dorsett.editData.Groups = ko.observableArray(ko.utils.arrayMap(userGroups, function(item) {
                    return {
                        groupid: item._id,
                        'User Group Name': item['User Group Name'],
                        'Group Admin': item['Group Admin']
                    };
                }));
            }

            dorsett.editData.isEditMode = ko.observable(false);
            dorsett.editData.errors = ko.validation.group(dorsett.editData, {
                deep: true
            });

            ko.removeNode($panelWindow[0]);
            infuser.get('panel_' + type, function(template) {
                var panel = $(template)[0];
                ko.applyBindingsWithValidation(dorsett.editData, panel, {
                    registerExtenders: true,
                    messagesOnModified: true,
                    insertMessages: false,
                    decorateElement: false,
                    errorElementClass: 'input-validation-error',
                    errorMessageClass: 'error',
                    grouping: {
                        deep: true
                    }
                });
                $panel.html($(panel));
                $panel.trigger('create');
                $panel.tween({
                    right: {
                        duration: .3,
                        stop: 0,
                        effect: 'circIn'
                    }
                });
                $sections.tween({
                    paddingRight: {
                        duration: .3,
                        stop: 380,
                        effect: 'circIn',
                        onStop: function() {
                            if ($.isEmptyObject(data)) dorsett.editMode();
                        }
                    }
                });
                $sections.find('.group, .user').draggable('disable');
                $.play();
            });
        },
        hidePanel: function() {
            var $sections = $('#DT_Security_sections');
            dorsett.editData = {
                isEditMode: ko.observable(false),
                errors: ko.validation.group(dorsett.editData, {
                    deep: true
                })
            };
            $sections.find('.group, .user').draggable('disable');
            $('#DT_Security_panel').tween({
                right: {
                    duration: .3,
                    stop: -380,
                    effect: 'circIn'
                }
            });
            $sections.tween({
                paddingRight: {
                    duration: .3,
                    stop: 0,
                    effect: 'circIn'
                }
            });
            $.play();
        },
        editUserPhoto: function() {
            var self = this;
            _tabOpen = 'users';
            console.log('editPhoto');
            $('.uploadPhoto').click();
        },
        editGroupPhoto: function() {
            var self = this;
            _tabOpen = 'groups';
            console.log('editPhoto');
            $('.uploadPhoto').click();
        },
        uploadImage: function(image) {
            var fileReader = new FileReader(),
                data = new FormData(),
                imageObj = {},
                sendImage = function(imageObj) {
                    console.log(imageObj);
                    data.append('name', imageObj.fileName);
                    data.append('image', imageObj.image);
                    data.append('user', dorsett.editData._id);
                    $.ajax({
                        url: _webendpointURI + _tabOpen + '/editPhoto',
                        processData: false,
                        type: 'POST',
                        cache: false,
                        contentType: false,
                        data: data
                    }).success(function(data) {
                        console.log('success', data.imageUrl);
                        //dorsett.editData.Photo.Value(data.imageUrl);
                        $('#singlePhoto').css({
                            backgroundImage: 'url(img/users/' + data.imageUrl + ')'
                        });
                        dorsett.getUsers();
                        dorsett.getGroups();
                        console.log(dorsett.editData.Photo());
                    }).error(function(err) {
                        console.log('err', err);
                    });
                };
            fileReader.onload = function() {
                imageObj.image = fileReader.result;
                imageObj.fileName = image.name;
                sendImage(imageObj);
            };
            fileReader.readAsDataURL(image);
        },
        getUserById: function(id) {
            var self = this;
            return ko.utils.arrayFirst(self.userData.allData(), function(item) {
                return item._id == id;
            });
        },
        getGroupById: function(id) {
            var self = this;
            return ko.utils.arrayFirst(self.groupData.allData(), function(item) {
                return item._id == id;
            });
        },
        editMode: function() {
            var $panel = $('#DT_Security_panel'),
                $sections = $('#DT_Security_sections');
            dorsett.editData.isEditMode(true);
            $panel.trigger('create');
            $sections.find('.' + dorsett.draggableType.typeName()).draggable('enable');
            $panel.find('input[type=text]:first').focus();
        },
        cancelEditMode: function() {
            var $panel = $('#DT_Security_panel'),
                $sections = $('#DT_Security_sections'),
                type = (!!dorsett.editData.Password) ? 'user' : 'group',
                id = dorsett.editData._id
            isNew = !!!id,
                data = {};
            //Undo changes
            //If adding a new user, clear form and close panel
            if (!isNew) {
                dorsett.editData = {};
                dorsett.showPanel(type, (type == 'user' ?
                    dorsett.getUserById(id) :
                    dorsett.getGroupById(id)
                ));
            } else {
                dorsett.showPanel(type, {});
                dorsett.hidePanel();
            }
            dorsett.editData.isEditMode(false);
            $panel.trigger('create');
            $sections.find('.group, .user').draggable('disable');
        },
        saveUser: function() {
            var saveModel,
                saveGraph,
                groups = [],
                userFullName = dorsett.editData['First Name']() + ' ' + dorsett.editData['Last Name']();
            if (!dorsett.editData.isValid()) {
                dorsett.editData.errors.showAllMessages();
                return;
            }
            saveModel = ko.data.projections.projectVM(
                dorsett.editData, {
                    _id: '',
                    username: '',
                    Password: '',
                    'Password Reset': [false, false],
                    'Last Login Time': '',
                    'Last Activity Time': '',
                    'Auto Logout Duration': [0, null],
                    'Session Length': [0, null],
                    'First Name': '',
                    'Last Name': '',
                    'System Admin': [false, false],
                    Photo: '',
                    Title: '',
                    'Contact Info': [{
                        Type: '',
                        Value: '',
                        Name: ''
                    }],
                    Groups: [{
                        groupid: '',
                        'Group Admin': [false, false]
                    }]
                }
            );
            extractProperty.call(saveModel, 'Photo');
            extractProperty.call(saveModel, 'Last Login Time');
            extractProperty.call(saveModel, 'Last Activity Time');
            saveModel['User Groups'] = extractProperty.call(saveModel, 'Groups');

            if (!!!saveModel._id) {
                extractProperty.call(saveModel, '_id')
                saveGraph = saveModel;
            } else {
                if (saveModel.Password == '') extractProperty.call(saveModel, 'Password');
                saveGraph = {
                    userid: extractProperty.call(saveModel, '_id'),
                    'Update Data': saveModel
                };
            }
            //console.log(ko.toJSON(saveGraph));
            //Save
            $.ajax({
                    type: 'POST',
                    url: _webendpointURI + 'users/saveuser',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: (ko.toJSON(saveGraph))
                })
                .pipe(function(data, status, jqXHR) {
                    //ToDo
                    if (!!data._id || data.message == 'success') {
                        $.when(
                            dorsett.getUsers(),
                            dorsett.getGroups()
                        ).done(
                            function() {
                                //dorsett.alertMessage('Success', userFullName + ' saved successfully.' );
                                Messenger().hideAll();
                                Messenger().post({
                                    type: 'info',
                                    message: userFullName + ' saved successfully.',
                                    hideAfter: 3
                                });
                                dorsett.hidePanel();
                            }
                        );
                    } else if (!!data.message) {
                        dorsett.alertMessage('Message', data.message);
                    }
                });
        },
        deleteUser: function() {
            var $confirmDialog = $('.confirmDialog'),
                userFullName = dorsett.editData['First Name']() + ' ' + dorsett.editData['Last Name']();
            $confirmDialog.find('.title').text('Confirm Delete');
            $confirmDialog.find('.message').text('Are you sure you want to remove ' + userFullName + '?');
            $confirmDialog.off('click').on('click', '.delete', function() {
                $.ajax({
                        type: 'POST',
                        url: _webendpointURI + 'users/removeuser',
                        dataType: 'json',
                        contentType: 'application/json',
                        data: (ko.toJSON({
                            userid: dorsett.editData._id
                        }))
                    })
                    .pipe(function(data, status, jqXHR) {
                        if (data.message == "success") {
                            $.when(
                                dorsett.getUsers(),
                                dorsett.getGroups()
                            ).done(
                                function() {
                                    dorsett.hidePanel();
                                    $('.confirmDialog').one('popupafterclose', function() {
                                        //dorsett.alertMessage('Success', userFullName + ' was removed successfully.' );
                                        Messenger().hideAll();
                                        Messenger().post({
                                            type: 'info',
                                            message: userFullName + ' was removed successfully.',
                                            hideAfter: 3
                                        });
                                    }).popup('close');
                                }
                            );
                        } else if (!!data.message) {
                            dorsett.alertMessage('Message', data.message);
                        }
                    });
            });
            return true;
        },
        saveGroup: function() {
            var saveModel,
                saveGraph,
                users = [];
            if (!dorsett.editData.isValid()) {
                dorsett.editData.errors.showAllMessages();
                return;
            }
            saveModel = ko.data.projections.projectVM(
                dorsett.editData, {
                    _id: '',
                    'User Group Name': '',
                    Description: '',
                    _pAccess: 0,
                    Users: [{
                        userid: '',
                        'Group Admin': [false, false]
                    }],
                    Photo: ''
                }
            );
            if (!!!saveModel._id) {
                extractProperty.call(saveModel, '_id')
                saveGraph = saveModel;
            } else {
                saveGraph = {
                    'User Group Upi': extractProperty.call(saveModel, '_id'),
                    'Update Data': saveModel
                };
            }
            //console.log(ko.toJSON(saveGraph));
            //Save
            $.ajax({
                    type: 'POST',
                    url: _webendpointURI + 'groups/savegroup',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: (ko.toJSON(saveGraph))
                })
                .pipe(function(data, status, jqXHR) {
                    //ToDo
                    if (!!data._id || data.message == 'success') {
                        $.when(
                            dorsett.getUsers(),
                            dorsett.getGroups()
                        ).done(
                            function() {
                                //dorsett.alertMessage('Success', dorsett.editData['User Group Name']() + ' saved successfully.' );
                                Messenger().hideAll();
                                Messenger().post({
                                    type: 'info',
                                    message: dorsett.editData['User Group Name']() + ' saved successfully.',
                                    hideAfter: 3
                                });
                                dorsett.hidePanel();
                            }
                        );
                    } else if (!!data.message) {
                        dorsett.alertMessage('Message', data.message);
                    } else if (!!data.err) {
                        dorsett.alertMessage('Message', '<p>An error has occurred.</p>\n\n ' + data.err.err);
                    }
                });
        },
        deleteGroup: function() {
            var $confirmDialog = $('.confirmDialog'),
                groupName = dorsett.editData['User Group Name']();
            $confirmDialog.find('.title').text('Confirm Delete');
            $confirmDialog.find('.message').text('Are you sure you want to remove ' + groupName + '?');
            $confirmDialog.off('click').on('click', '.delete', function() {
                $.ajax({
                        type: 'POST',
                        url: _webendpointURI + 'groups/removegroup',
                        dataType: 'json',
                        contentType: 'application/json',
                        data: (ko.toJSON({
                            'User Group Upi': dorsett.editData._id
                        }))
                    })
                    .pipe(function(data, status, jqXHR) {
                        if (data.message == "success") {
                            $.when(
                                dorsett.getUsers(),
                                dorsett.getGroups()
                            ).done(
                                function() {
                                    dorsett.hidePanel();
                                    $('.confirmDialog').one('popupafterclose', function() {
                                        //dorsett.alertMessage('Success', groupName + ' was removed successfully.' );
                                        Messenger().hideAll();
                                        Messenger().post({
                                            type: 'info',
                                            message: groupName + ' was removed successfully.',
                                            hideAfter: 3
                                        });
                                    }).popup('close');
                                }
                            );
                        } else if (!!data.message) {
                            dorsett.alertMessage('Message', data.message);
                        }
                    });
            });
            return true;
        },
        alertMessage: function(title, message) {
            var $popupDialog = $('.popupDialog');
            $popupDialog.find('.title').text(title);
            $popupDialog.find('.message').html(message);
            $popupDialog.popup('open');
        },
        removeGroupFromUser: function(data) {
            dorsett.editData.Groups.remove(data);
        },
        removeUserFromGroup: function(data) {
            dorsett.editData.Users.remove(data);
        },
        removeContactInfo: function(data) {
            dorsett.editData['Contact Info'].remove(data);
        },
        openPasswordDialog: function() {

            var passwordDialog = $('.passwordDialog');
            passwordDialog.find('.firstName').text(dorsett.editData['First Name']());
            passwordDialog.find('.password').val(dorsett.editData.Password());
            passwordDialog.find('.btnCopy').zclip({
                path: 'js/ZeroClipboard.swf',
                copy: function() {
                    return dorsett.editData.Password();
                }
            });
            dorsett.editData['Password Reset'](true);
            return true;
        },
        generatePassword: function(length, useSpecial) {
            var iteration = 0,
                password = '',
                randomNumber;
            while (iteration < length) {
                randomNumber = (Math.floor((Math.random() * 100)) % 94) + 33;
                if (!!!useSpecial) {
                    if ((randomNumber >= 33) && (randomNumber <= 47)) {
                        continue;
                    }
                    if ((randomNumber >= 58) && (randomNumber <= 64)) {
                        continue;
                    }
                    if ((randomNumber >= 91) && (randomNumber <= 96)) {
                        continue;
                    }
                    if ((randomNumber >= 123) && (randomNumber <= 126)) {
                        continue;
                    }
                }
                iteration++;
                password += String.fromCharCode(randomNumber);
            }
            return password;
        },
        openContactInfoDialog: function() {
            $('.contactInfoDialog').find('.firstName').text(dorsett.editData['First Name']());
            return true;
        },
        addContactInfo: function() {
            var $panel = $('#DT_Security_panel'),
                $list = $('#contactInfoList'),
                observable = dorsett.editData['Contact Info'],
                contactInfoDialog = $('.contactInfoDialog');
            if (contactInfoDialog.find('select.contactOptions').val() == '' ||
                contactInfoDialog.find('.value').val() == '') {
                alert('Choose a Type and enter a Value.');
                return false;
            }
            observable.push(new dorsett.models.contactInfoModel({
                Type: contactInfoDialog.find('select.contactOptions').val(),
                Name: contactInfoDialog.find('.name').val(),
                Value: contactInfoDialog.find('.value').val()
            }));
            observable()[observable().length - 1].Value.isModified(true);
            $panel.trigger('create');
            $list.listview('refresh');
            contactInfoDialog.find('select.contactOptions').val('')
                .selectmenu('refresh', true);
            contactInfoDialog.find('.name').val('');
            contactInfoDialog.find('.value').val('');
            return true;
        },
        contactValidationMap: [{
            type: 'Email',
            val: {
                required: true,
                email: true
            }
        }, {
            type: 'SMS',
            val: phoneValidatorObj,
            mask: '9999999999'
        }, {
            type: 'Voice',
            val: phoneValidatorObj,
            mask: '9999999999'
        }],
        userCount: function(singular, plural) {
            var count = 0,
                prop;
            for (prop in this) {
                var user = ko.utils.arrayFirst(dorsett.userData.allData(), function(item) {
                    return item._id == prop;
                });
                if (!!user) count++;
            }
            if (!!singular && !!plural) {
                return count + ' ' + ((count == 1) ? singular : plural);
            } else {
                return count;
            }
        },
        viewPointAccess: function(type) {
            var groupid = dorsett.editData._id,
                groupname = dorsett.editData['User Group Name'](),
                workspaceManager = (window.opener || window.top).workspaceManager,
                pointWindow;

            pointWindow = workspaceManager.openWindowPositioned([_pointSelector, '/security/', groupid].join(''), 'Group Permissions', 'groupPermissions', 'groupPermissions', 'groupPermissions', {
                width: 960,
                height: 600,
                callback: function() {
                    pointWindow.pointLookup.init(null, {
                        groupid: groupid,
                        groupname: groupname
                    })
                }
            });
            //            var $permissionsDialog = $('.permissionsDialog'),
            //                //open socket connection
            //                socket = null,
            //                socketId = null,
            //                UpiObj = type == 'group' ? {'User Group Upi': dorsett.editData._id} : {userid: dorsett.editData._id};
            //            $permissionsDialog.off().on({
            //                popupbeforeposition: function() {
            //                    var maxHeight = $( window ).height() - 60 + 'px',
            //                        maxWidth = $( window ).width() - 60 + 'px';
            //                    $permissionsDialog.find('iframe')
            //                        .attr( 'width', maxWidth )
            //                        .attr( 'height', maxHeight );
            //                },
            //                popupafterclose: function() {
            //                    $permissionsDialog.find('iframe')
            //                        .attr( 'width', 0 )
            //                        .attr( 'height', 0 );
            //                }
            //            });
            //            $permissionsDialog.append('<iframe src="' + _pointSelector + '" frameborder="0" allowtransparency="true" scrolling="no" seamless>');
            //            $permissionsDialog.popup('open');
            //            //wait for connection so we can send UPI
            //            socket = io.connect(_socketendpoint);
            //            socket.on('connected', function(e){
            //                socketId = e.id;
            //                socket.emit('setPermissionUPI', UpiObj);
            //                socket.disconnect();
            //            });
        },


        //Utilities
        setMask: function(event, targetElement) {
            var $select = $(event.target),
                srcObject;
            srcObject = ko.utils.arrayFirst(dorsett.contactValidationMap, function(item) {
                return item.type == $select.val();
            });
            if (typeof srcObject.mask == 'undefined') {
                $(targetElement).unmask()
                return;
            }
            $(targetElement).mask(srcObject.mask);
        },
        sortBy: function() {
            var fields = [],
                n_fields = arguments.length,
                field, name, reverse, cmp;
            // preprocess sorting options
            for (var i = 0; i < n_fields; i++) {
                field = arguments[i];
                if (typeof field === 'string') {
                    name = field;
                    cmp = default_cmp;
                } else {
                    name = field.name;
                    cmp = getCmpFunc(field.primer, field.reverse);
                }
                fields.push({
                    name: name,
                    cmp: cmp
                });
            }
            // final comparison function
            return function(A, B) {
                var a, b, name, result;
                for (var i = 0; i < n_fields; i++) {
                    result = 0;
                    field = fields[i];
                    name = field.name;
                    result = field.cmp(A[name], B[name]);
                    if (result !== 0) break;
                }
                return result;
            }
        },
        scale: function(width, height, padding, border) {
            var scrWidth = $(window).width() - 30,
                scrHeight = $(window).height() - 30,
                ifrPadding = 2 * padding,
                ifrBorder = 2 * border,
                ifrWidth = width + ifrPadding + ifrBorder,
                ifrHeight = height + ifrPadding + ifrBorder,
                h, w;

            if (ifrWidth < scrWidth && ifrHeight < scrHeight) {
                w = ifrWidth;
                h = ifrHeight;
            } else if ((ifrWidth / scrWidth) > (ifrHeight / scrHeight)) {
                w = scrWidth;
                h = (scrWidth / ifrWidth) * ifrHeight;
            } else {
                h = scrHeight;
                w = (scrHeight / ifrHeight) * ifrWidth;
            }

            return {
                'width': w - (ifrPadding + ifrBorder),
                'height': h - (ifrPadding + ifrBorder)
            };
        }
    }
})();
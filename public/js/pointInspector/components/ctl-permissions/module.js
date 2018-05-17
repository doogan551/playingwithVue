define(['knockout', 'text!./view.html'], function(ko, view) {
    var apiEndpoint = '';

    function ViewModel(params) {
        var self = this;

        apiEndpoint = params.rootContext.apiEndpoint;

        this.actingUser = (window.opener || window.top).workspaceManager.user();
        this.root = params.rootContext;
        this.security = this.root.point.data.Security;
        this.isSystemAdmin = this.root.isSystemAdmin();
        this.allGroupsRaw = {};
        this.allGroups = {};
        this.allUsers = {};
        this.userSearch = ko.observable('');
        this.usersOnPoint = ko.observableArray([]);
        this.groupsOnPoint = ko.observableArray([]);
        this.groupsNotOnPoint = ko.observableArray([]);
        this.gettingData = ko.observable(true);
        this.networkError = ko.observable(false);
        this.userHTML = {
            systemAdmin: "<span class='systemAdmin'>(System Admin)</span>",
            groupAdmin: "<span class='groupAdmin'>(Group Admin)</span>"
        };

        this.isTabLoaded = params.isTabLoaded.subscribe(function(val) {
            this.render();
        }, this);

        this.onNetworkError = this.networkError.subscribe(function(val) {
            if (val) {
                this.allGroups = {};
                this.allUsers = {};
                this.usersOnPoint([]);
                this.groupsOnPoint([]);
                this.groupsNotOnPoint([]);
            }
        }, this);

        this.showPermissionsTable = ko.computed(function() {
            return !this.networkError() && (this.groupsOnPoint().length || this.root.isInEditMode());
        }, this);

        this.showNoPermissionsMsg = ko.computed(function() {
            return !this.networkError() && (this.groupsOnPoint().length === 0) && !this.root.isInEditMode();
        }, this);

        this.userCanEditPermissions = ko.computed(function() {
            if (this.isSystemAdmin) return true;
            // Allow any user to edit permissions if point is inactive #180
            if (this.root.point.data._pStatus() === this.root.utility.config.Enums['Point Statuses'].Inactive.enum) return true;
            // Only system administrators and group adminstrators can edit permissions
            var self = this,
                filteredUsersOnPoint = ko.utils.arrayFilter(this.usersOnPoint(), function(user) {
                    return user._id === self.actingUser._id;
                });
            if (filteredUsersOnPoint.length) {
                return filteredUsersOnPoint[0].isGroupAdmin;
            }
            return false;
        }, this);

        this.showGroupsNotOnPoint = ko.computed(function() {
            return this.root.isInEditMode() && this.userCanEditPermissions() && this.groupsNotOnPoint().length;
        }, this);

        this.showRemoveGroupIcon = ko.computed(function() {
            return this.userCanEditPermissions() && this.root.isInEditMode();
        }, this);

        this.showUsers = ko.computed(function() {
            return (!this.root.isInEditMode() || !this.userCanEditPermissions()) && !!this.usersOnPoint().length;
        }, this);

        this.buildGroups = ko.computed(function() {
            var _id,
                group,
                groupId,
                user,
                userId,
                usersInGroup,
                gettingData = this.gettingData(), // our blocking dependency
                security = this.security(), // our main dependency
                allUsers = this.allUsers,
                allGroups = this.allGroups,
                groupsOnPoint = [],
                groupsNotOnPoint = [],
                usersOnPoint = [],
                usersProcessed = [],
                sortFn = function(a, b) {
                    return (a.name == b.name ? 0 : (a.name < b.name ? -1 : 1));
                };

            if (gettingData)
                return;

            // Build groups assigned to this point
            for (groupId in allGroups) {
                if (!!allGroups[groupId].points.hasOwnProperty(self.root.point.data._id())) {
                    groupsOnPoint.push(allGroups[groupId]);
                }
            }
            /*for (var i = 0, len = security.length; i < len; i++) {
                _id = security[i];
                group = allGroups[_id];

                if (group) {
                    groupsOnPoint.push(group);
                } else {
                    groupsOnPoint.push({
                        "_id": _id,
                        "name": _id,
                        "canRead": false,
                        "canWrite": false,
                        "canControl": false,
                        "canAcknowledge": false,
                        "users": [],
                    });
                }
            }*/

            // Build groups NOT assigned this point
            // TODO Only get the groups for which the acting user is a group administrator
            for (groupId in allGroups) {
                if (!allGroups[groupId].points.hasOwnProperty(self.root.point.data._id())) {
                    groupsNotOnPoint.push(allGroups[groupId]);
                }
            }

            // Clear all calculated user permissions
            for (_id in allUsers) {
                user = allUsers[_id];
                user.canRead =
                    user.canWrite =
                    user.canControl =
                    user.canAcknowledge =
                    user.isGroupAdmin = false;
                // User's isGroupAdmin flag is calculated because the user's group admin status is 
                // conditioned based on the groups that are assigned to the point
            }

            // Build users assigned to this point
            for (i = 0, len = groupsOnPoint.length; i < len; i++) {
                group = groupsOnPoint[i];
                usersInGroup = group.users;
                for (userId in usersInGroup) {
                    user = allUsers[userId];

                    var isSystemAdmin = user ? user['System Admin'].Value : false,
                        isGroupAdmin = usersInGroup[userId]["Group Admin"],
                        isAdmin = isSystemAdmin || isGroupAdmin;

                    if (usersProcessed.indexOf(userId) == -1) { // If we haven't processed this user
                        usersProcessed.push(userId);
                        if (user) {
                            usersOnPoint.push(user);
                        } else {
                            usersOnPoint.push({
                                "_id": userId,
                                "name": userId,
                                "canRead": false,
                                "canWrite": false,
                                "canControl": false,
                                "canAcknowledge": false
                            });
                        }
                    }
                    if (user) {
                        user.canRead |= (group.canRead || isAdmin);
                        user.canWrite |= (group.canWrite || isAdmin);
                        user.canControl |= (group.canControl || isAdmin);
                        user.canAcknowledge |= (group.canAcknowledge || isAdmin);
                        user.isGroupAdmin |= isGroupAdmin;
                    }
                }
            }

            // Sort the groups and update our observables
            this.groupsOnPoint(groupsOnPoint.sort(sortFn));
            this.groupsNotOnPoint(groupsNotOnPoint.sort(sortFn));
            this.usersOnPoint(usersOnPoint.sort(sortFn));
        }, this).extend({
            throttle: 50
        });

        this.root.point.status.subscribe(function(status) {

            if (status === "saving") {
                $.ajax({
                    url: apiEndpoint + 'security/groups/updatePermissions',
                    contentType: 'application/json',
                    dataType: 'json',
                    type: 'post',
                    data: JSON.stringify({
                        groups: this.groupsOnPoint().concat(this.groupsNotOnPoint())
                    })
                }).done(function(data) {
                    console.log('groups updated');
                });
                // If the point is saved and we're on the permissions tab but the user doesn't have permissions to be here
                // (this will happen after a non-sys-admin saves an inactive point)
            } else if (status === "saved" && (self.root.currentTab() === "permissions") && !self.userCanEditPermissions()) {
                // Select first tab to get user out of permissions
                self.root.selectFirstTab();
            }
        }, self);
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.render = function() {
        var self = this,
            failAction = function(jqXHR, textStatus) {
                self.networkError(true);
                self.gettingData(false);
                console.log('failed: ', textStatus, ' jqXHR: ', jqXHR);
            },
            sortFn = function(a, b) {
                return (a.name == b.name ? 0 : (a.name < b.name ? -1 : 1));
            },
            hasAccess = function(group, level) {
                return !!(group._pAccess & self.root.permissionLevels[level]);
            },
            processGroupData = function(data) {
                for (var i = 0, len = data.length; i < len; i++) {
                    var group = data[i],
                        _id = group._id;
                    self.allGroupsRaw[_id] = group;
                    self.allGroups[_id] = {
                        "_id": _id,
                        "name": group["User Group Name"],
                        "canRead": true, // Groups always have read access to points they're assigned to
                        "canWrite": hasAccess(group, 'WRITE'),
                        "canControl": hasAccess(group, 'CONTROL'),
                        "canAcknowledge": hasAccess(group, 'ACKNOWLEDGE'),
                        "users": group.Users,
                        "points": group.Points
                    };
                }
            },
            processUserData = function(data) {
                for (var i = 0, len = data.length; i < len; i++) {
                    var user = data[i];
                    user.name = user['First Name'].Value + ' ' + user['Last Name'].Value;
                    self.allUsers[user._id] = user;
                }
            };

        // Get all groups and users defined in the system
        self.gettingData(true);
        $.ajax({
                url: apiEndpoint + 'security/groups/getallgroups',
                contentType: 'application/json',
                type: 'post'
            })
            .done(function(data) {
                if (!!data.err) {
                    self.networkError(true);
                    self.gettingData(false);
                    return;
                }
                processGroupData(data);


                $.ajax({
                        url: apiEndpoint + 'security/users/getallusers',
                        contentType: 'application/json',
                        type: 'post'
                    })
                    .done(function(data) {
                        if (!!data.err) {
                            self.networkError(true);
                            return;
                        }
                        processUserData(data.Users);

                        // Now that we've received our group and user data, we trigger the building of our groups
                        // listings by touching the security computed
                        var security = self.security(); // Save the current security information
                        self.root.point.data.Security([]); // Remove security information
                        self.root.point.data.Security(security); // Re-add security information

                        self.gettingData(false);
                        self.networkError(false);
                    })
                    .fail(failAction);
            })
            .fail(failAction);
    };

    ViewModel.prototype.getGroupUsers = function(groupId) {
        var rtnArray = [];

        if (this.allGroups.hasOwnProperty(groupId)) {
            var users = this.allGroups[groupId].users;

            for (var userId in users) {
                var name = "",
                    user = this.allUsers[userId];

                if (!!user) {
                    var isSystemAdmin = user['System Admin'].Value,
                        isGroupAdmin = users[userId]["Group Admin"],
                        isAdmin = isSystemAdmin || isGroupAdmin;
                    name = user.name;
                    if (isAdmin) {
                        if (isSystemAdmin)
                            name += this.userHTML.systemAdmin;
                        else
                            name += this.userHTML.groupAdmin;
                    }
                } else {
                    name = userId;
                }
                rtnArray.push(name);
            }
        }
        return rtnArray.sort();
    };

    ViewModel.prototype.getUserName = function(user) {
        var name = user.name;
        if (user['System Admin'].Value)
            name += this.userHTML.systemAdmin;
        else if (user.isGroupAdmin)
            name += this.userHTML.groupAdmin;

        return name;
    };

    ViewModel.prototype.toggleUsers = function(data, e, el, shown) {
        var $el = e ? $(e.currentTarget) : $(el),
            $fa = $el.children('.fa'),
            $users = $el.children('div'),
            DURATION = 200;

        shown = (shown === undefined) ? ($users.css('display') === 'block') : shown;
        if (shown) {
            $users.slideUp(DURATION);
            $fa.removeClass('fa-folder-open');
            $fa.addClass('fa-folder');
        } else {
            $users.slideDown(DURATION);
            $fa.removeClass('fa-folder');
            $fa.addClass('fa-folder-open');
        }
    };

    ViewModel.prototype.toggleAllUsers = function(data, e) {
        var self = this,
            $el = $(e.currentTarget),
            $fa = $el.children('.fa'),
            $groups = $('tbody .group'),
            shown = $fa.hasClass('fa-folder-open') ? true : false;

        $groups.each(function(index, el) {
            self.toggleUsers(undefined, undefined, el, shown);
        });
        if ($fa.hasClass('fa-folder')) {
            $fa.removeClass('fa-folder');
            $fa.addClass('fa-folder-open');
        } else {
            $fa.removeClass('fa-folder-open');
            $fa.addClass('fa-folder');
        }
    };

    ViewModel.prototype.removeGroup = function(data, group) {
        if (!data.userCanEditPermissions()) return;
        var upi = data.root.point.data._id();
        var groupsOnPoint = data.groupsOnPoint;

        delete data.allGroups[group._id].points[upi];
        for (var g = 0; g < groupsOnPoint().length; g++) {
            if (groupsOnPoint()[g]._id === group._id) {
                groupsOnPoint.splice(g, 1);
                g--;
            }
        }

        //used to trigger the computed that updates the screen
        data.security.valueHasMutated();
    };

    ViewModel.prototype.addGroup = function(data, group) {
        if (!data.userCanEditPermissions()) return;
        var upi = data.root.point.data._id();
        data.allGroups[group._id].points[upi] = true;
        data.groupsOnPoint.push(data.allGroups[group._id]);

        //used to trigger the computed that updates the screen
        data.security.valueHasMutated();
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        this.isTabLoaded.dispose();
        this.onNetworkError.dispose();
        this.buildGroups.dispose();
        this.showPermissionsTable.dispose();
        this.showNoPermissionsMsg.dispose();
        this.showGroupsNotOnPoint.dispose();
        this.showUsers.dispose();
    };

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
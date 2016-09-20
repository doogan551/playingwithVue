var displays = window.displays || {};


displays = $.extend(displays, {
    workspaceManager: window.top.workspaceManager,
    resize: false,
    pageX: 0,
    pageY: 0,
    origWidth: 0,
    origHeight: 0,
    leftOffOrig: 0,
    topOffOrig: 0,
    sizeType: 0,
    dropObj: {},
    freshObj: {},
    qualityCodeQueue: [],
    editMode: false,
    isReconnecting: false,
    defaultUser: {
        'System Admin': {
            Value: false
        },
        groups: []
    }
});


$(document).on('pageinit', function() {
    var user = (displays.workspaceManager.user && displays.workspaceManager.user()) || displays.defaultUser,
        upiList = [],
        userPermissions = {
            systemAdmin : user['System Admin'].Value,
            groups      : user.groups
        },
        permissionLevels = {
            CONTROL     : 2,
            ACKNOWLEDGE : 4,
            WRITE       : 8
        },
        processQualityCodes = function(data) {
            var codes = {},
                entries = data.Entries,
                row,
                el,
                newVal,
                code,
                c, len = entries.length;

            for(c=0; c<len; c++) {
                row = entries[c];
                codes[row['Quality Code Label']] = {
                    color: row['Quality Code Font HTML Color'],
                    label: row['Quality Code']
                };
            }
            displays.qualityCodes = codes;

            len = displays.qualityCodeQueue.length;
            for(c=0; c<len; c++) {
                row = displays.qualityCodeQueue[c];
                el = row.el;
                code = row.code;
                newVal = row.val;
                el.css('color', '#' + displays.qualityCodes[code].color);
                el.html(newVal + ' ' + displays.qualityCodes[code].label);
            }
        },
        userHasPermission = function (pointGroups, requestedAccessLevel) {
            var cumulativePermissions = 0,
                i,
                last,
                groups = userPermissions.groups.filter(function(item) {
                    return !!~pointGroups.indexOf(item._id);
                });

            for(i = 0, last = groups.length; i < last; i++) {
                cumulativePermissions |= groups[i]._pAccess;
            }
            return !!(cumulativePermissions & requestedAccessLevel);
        },
        userHasPermissionToEdit = function (security) {
            return userPermissions.systemAdmin || userHasPermission(security, permissionLevels.WRITE);
        },
        finish = function () {
            displays.initAngularFilters();
            displays.initSocket();
            if (window.onLoaded) {
                window.onLoaded();
            } else {
                window.loaded = true;
            }
        };

    $('#editDisplay').hide();

    if (window.self === window.top) {
        $('#minDisplay').show();
        $('#maxDisplay').hide();
    } else {
        $('#minDisplay').hide();
        $('#maxDisplay').show();
    }

    displays.mouseEvents();

    $('#editDisplay').off('click').on('click', function(e) {
        e.preventDefault();
        var _title = window.displayJson.Name,
            pointType = window.displayJson['Point Type'].Value,
            _id = window.displayJson._id,
            width = parseInt(window.displayJson.Width, 10) + 400,
            height = parseInt(window.displayJson.Height, 10) + 100;

        dtiUtility.openWindow($(this).attr('href'), _title, pointType, '', _id, {
            width: width,
            height: height,
            sameWindow: true
        });

        displays.openWindow($(this).attr('href'), _title, pointType, '', _id, {
            width: width,
            height: height,
            sameWindow: true,
            windowId: window.windowId
        });
        //window.close();
    });

    $('.popSelector').click(function() {
        $("#popSelector").popup("open", {
            transition: "slidedown"
        });
        $('#popFrame').attr('src', '/pointSelector?app=dialog');
    });

    $('.closePop').click(function() {
        $("#popSelector").popup("close");
    });

    $(document).mouseup(function() {
        displays.resize = false;
    });

    $.ajax({
        url: '/api/system/qualityCodes'
    }).done(function(data) {
        processQualityCodes(data);
    });

    if(!window.isPreview) {
        $.ajax({
            url: '/api/points/' + window.upi
        }).done(function(response) {
            var list = response['Screen Objects'] || [],
                screenObject,
                pointRef,
                c;

            window.displayJson = response;
            window.pointType = response['Point Type'].Value;
            window.point = response;

            for (c = 0; c < list.length; c++) {
                screenObject = list[c];
                if (screenObject.upi > 0 || screenObject.pointRefIndex !== undefined) {
                    pointRef = displays.getScreenObjectPointRef(screenObject);

                    if (!!pointRef) {
                        screenObject.upi = pointRef.Value;
                        screenObject.pointRefIndex = pointRef.AppIndex;
                    }

                    upiList.push(screenObject.upi);
                }
            }

            $.ajax({
                url: '/displays/getDisplayInfo/',
                method: 'POST',
                data: {
                    upi: window.upi,
                    upiList: upiList
                }
            }).done(function(data) {
                displays.upiNames = data.upiNames;
                displays.pointTypes = data.pointTypes;

                if(userHasPermissionToEdit(response.Security)) {
                    $('#editDisplay').show();
                }

                finish();
            });
        });
    } else {
        finish();
    }
});

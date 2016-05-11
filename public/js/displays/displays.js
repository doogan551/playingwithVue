var displays = {
    blankImg: '/img/blank.gif',
    assetDir: '/display_assets/assets/',
    animationDir: '/displays/gifs/',
    logLinePrefix: true,
    itemIdx: 0,
    idxPrefix: 'dsp_',

    workspaceManager: (window.opener || window.top).workspaceManager,
    openWindow: (window.opener || window.top).workspaceManager.openWindowPositioned,

    makeId: function () {
        displays.itemIdx++;
        return displays.idxPrefix + displays.itemIdx;
    },
    log: function () {
        var stack,
            steps,
            lineNumber,
            err,
            args = [].splice.call(arguments, 0),
            pad = function (num) {
                return ('    ' + num).slice(-4);
            },
            formattedTime = displays.formatDate(new Date(), true);

        if (displays.logLinePrefix === true) {
            err = new Error();
            if (Error.captureStackTrace) {
                Error.captureStackTrace(err);

                stack = err.stack.split('\n')[2];

                steps = stack.split(':');

                lineNumber = steps[2];

                args.unshift('line:' + pad(lineNumber), formattedTime);
            }
        }
        // args.unshift(formattedTime);
        if (!displays.noLog) {
            console.log.apply(console, args);
        }
    },
    formatDate: function (date, addSuffix) {
        var functions = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
            lengths = [2, 2, 2, 3],
            separators = [':', ':', ':', ''],
            suffix = ' --',
            fn,
            out = '';

        if (addSuffix) {
            separators.push(suffix);
        }

        if (typeof date === 'number') {
            date = new Date(date);
        }

        for (fn in functions) {
            if (functions.hasOwnProperty(fn)) {
                out += ('000' + date['get' + functions[fn]]()).slice(-1 * lengths[fn]) + separators[fn];
            }
        }

        return out;
    },
    forEach: function (obj, fn) {
        var keys = Object.keys(obj),
            c,
            len = keys.length,
            errorFree = true;

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(obj[keys[c]], keys[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    forEachArray: function (arr, fn) {
        var c,
            list = arr || [],
            len = list.length,
            errorFree = true;

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(list[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },

    bindings: {
        canEdit: ko.observable(false),

        backgroundColor: ko.observable('#000000'),
        backgroundImage: ko.observable(),

        tooltip: ko.observable(''),

        width: ko.observable(),
        height: ko.observable(),
        zoom: ko.observable(100),
        panW: ko.observable(0),
        panH: ko.observable(0),

        screenObjects: ko.observableArray()
    },

    util: {//used to convert from db styles/structure
        ptsToPx: function (input) {
            return Math.floor(input * (4 / 3)) + 'px';
        },
        filterfonts: function (input) {
            var font = input;
            if (input === 'Bookman Old Style') {
                font = 'Arial';
            }
            if (input === 'Fixedsys' || input === 'fixedsys') {
                font = 'fixedsys, consolas, monospace';
            }
            return font;
        },
        filterbold: function(input) {
            var out = 'normal';
            if (input === true) {
                out = 'bold';
            }
            return out;
        },
        filterunderline: function(input) {
            var out = 'none';
            if (input === true) {
                out = 'underline';
            }
            return out;
        },
        filteritalic: function(input) {
            var out = 'normal';
            if (input === true) {
                out = 'italic';
            }
            return out;
        },
        filterwh: function(input, screenObject) {
            var wh = +input;
            if (wh === 0 || screenObject === 0) {
                wh = 'auto';
            } else {
                if(screenObject !== 1) {
                    wh += 8;
                }
                wh = wh + 'px';
            }
            return wh;
        },

        getBackgroundUrl: function (input) {
            var bg = input;

            if (bg && bg.toLowerCase() !== '.png') {//not just ".png"
                if(displays.filesToUpload[bg._idx]) {
                    bg = '';
                } else {
                    bg = bg.replace('.WMF', '.png');
                    bg = bg.replace('.wmf', '.png');
                    bg = bg.replace('.BMP', '.png');
                    bg = bg.replace('.bmp', '.png');
                    bg = bg.replace(/ /g, '%20');
                    bg = displays.assetDir + bg;
                }
            } else {
                bg = displays.blankImg;
            }

            return bg;
        },

        getColor: function (color) {
            var ret = '#';

            if (!color.match('#')) {
                ret += color;
            } else {
                ret = color;
            }

            return ret;
        },

        getObjectStyle: function (object) {
            var ret = {
                color: displays.util.getColor(object["Foreground Color"]),
                fontSize: displays.util.ptsToPx(object["Font Size"]),
                fontFamily: displays.util.filterfonts(object["Font Name"]),
                fontWeight: displays.util.filterbold(object["Font Bold"]),
                textDecoration: displays.util.filterunderline(object["Font Underline"]),
                fontStyle: displays.util.filteritalic(object["Font Italic"]),
                left: object.Left + 'px',
                top: object.Top + 'px',
                width: 'auto',
                height: 'auto'
            };

            if (displays.util.getObjectType(object['Screen Object']) === 'button') {
                ret.width = displays.util.filterwh(object.Width, object['Screen Object']);
                ret.height = displays.util.filterwh(object.Height, object['Screen Object']);
            }

            return ret;
        },

        typeLookup: {
            0: 'dynamic',
            1: 'button',
            2: 'text',
            3: 'animation'
            //4: 'trend'
        },
        getObjectType: function (screenObjectNum) {
            return displays.util.typeLookup[screenObjectNum];
        }
    },

    filesToUpload: {},
    upiNames: {},
    screenObjects: {},
    animationIDs: {},
    animationUPIs: {},

    zoomToFitWindow: function () {
        var winWidth = window.innerWidth,
            winHeight = window.innerHeight,// - $topBar.height(),
            displayWidth = displays.json.Width,
            displayHeight = displays.json.Height,
            percentageWidthDiff = Math.round(winWidth / displayWidth * 100) / 100,
            percentageHeightDiff = Math.round(winHeight / displayHeight * 100) / 100,
            zoomTo;

        if (percentageWidthDiff < 1 || percentageHeightDiff < 1) {
            if (percentageWidthDiff < 1 && percentageHeightDiff < 1) {
                zoomTo = Math.min(percentageWidthDiff, percentageHeightDiff) * 100;
            } else if (percentageHeightDiff < 1 && (percentageWidthDiff > percentageHeightDiff)) {
                zoomTo = percentageHeightDiff * 100;
            } else if (percentageWidthDiff < 1 && (percentageHeightDiff > percentageWidthDiff)) {
                zoomTo = percentageWidthDiff * 100;
            }
        } else if (percentageWidthDiff > 1 || percentageHeightDiff > 1) {
            if (percentageWidthDiff > 1 && percentageHeightDiff > 1) {
                zoomTo = Math.min(percentageWidthDiff, percentageHeightDiff) * 100;
            } else if (percentageHeightDiff > 1 && (percentageWidthDiff < percentageHeightDiff)) {
                zoomTo = percentageHeightDiff * 100;
            } else if (percentageWidthDiff > 1 && (percentageHeightDiff < percentageWidthDiff)) {
                zoomTo = percentageWidthDiff * 100;
            }
        }

        if (zoomTo) {
            displays.bindings.zoom(zoomTo);
        }
    },

    loadDisplay: function (data) {
        var display = data || displays.json,
            bindings = displays.bindings,
            screenObjects = [];

        //background info
        bindings.backgroundColor(displays.util.getColor(display['Background Color']));
        bindings.backgroundImage(displays.util.getBackgroundUrl(display['Background Picture']));

        //size.dimension info
        bindings.height(display.Height);
        bindings.width(display.Width);

        //load objects
        displays.forEachArray(display['Screen Objects'], function (object, idx) {
            var id = displays.makeId(),
                screenObject;
            object._idx = idx;
            object._id = id;
            screenObject = new displays.ScreenObject(object);

            displays.screenObjects[id] = screenObject;
            screenObjects.push(screenObject.bindings);
        });

        displays.bindings.screenObjects(screenObjects);

        displays.sendDynamicInfo(display);

        displays.zoomToFitWindow();

        console.log('loaded');

        if (window.onLoaded) {
            window.onLoaded();
        }
    },
    sendDynamicInfo: function (display) {
        var sess = {
            socketid: displays.socket.id,
            display: display
        };

        displays.socket.emit('displayOpen', {
            data: sess
        });
    },
    updateScreenObjects: function (dynamic) {
        var ret = [],
            upi = dynamic.upi,
            val = dynamic.dynamic.Value,
            label = dynamic.dynamic['Quality Label'];

        displays.forEach(displays.screenObjects, function (object, id) {
            if (object.bindings.upi() === upi && object.isDynamic) {
                object.handleDynamic(val, label, dynamic);
            }
        });

        return ret;
    },
    getDisplayInfo: function () {
        $.ajax({
            url: '/displays/getDisplayInfo/',
            method: 'POST',
            data: {
                upi: displays.upi,
                upiList: displays.upiList
            }
        }).done(function(data) {
            displays.upiNames = data.upiNames;
            displays.pointTypes = data.pointTypes;

            displays.postInit(function () {
                displays.loadDisplay();
            });

            // if(userHasPermissionToEdit(response.Security)) {
            //     displays.bindings.canEdit(true);
            // }

            // displays.initAngularFilters();
        });
    },

    initKnockout: function () {
        //defaults
        displays.bindings.backgroundImage(displays.blankImg);

        displays.bindings.dLeft = ko.computed(function () {//d prefix for compatability/speed
            var width = displays.bindings.width(),
                panW = displays.bindings.panW();

            return (-1 * ((width / 2))) + panW;
        });

        displays.bindings.dTop = ko.computed(function () {//d prefix for compatability/speed
            var height = displays.bindings.height(),
                panH = displays.bindings.panH();

            return (-1 * ((height / 2))) + panH;
        });

        ko.applyBindings(displays.bindings);
    },
    initSocket: function(cb) {
        if (document.location.href.match('nosocket') === null) {
            var socket = io.connect(window.location.protocol + '//' + window.location.hostname);

            socket.on('reconnecting', function() {
                var retries = 0,
                    reconnect = function() {
                        $.ajax({
                            url: '/home'
                        }).done(function(data) {
                            displays.isReconnecting = false;
                        }).fail(function(data) {
                            retries++;
                            if (retries < 2) {
                                reconnect();
                            } else {
                                displays.isReconnecting = false;
                            }
                        });
                    };
                if (!displays.isReconnecting) {
                    displays.isReconnecting = true;
                    reconnect();
                }
            });

            socket.on('recieveUpdate', function(dynamic) {
                displays.updateScreenObjects(dynamic);
            });

            socket.on('connect', function() {
                displays.socket = socket;
                cb();
                // sess.display = display.json;
                // socket.emit('displayOpen', {
                //     data: sess
                // });
            });

            $(window).on('unload', function() {
                socket.disconnect();
            });
        }
    },

    postInit: function (cb) {
        displays.initKnockout();
        displays.initSocket(cb);
    },

    init: function () {
        var count = 2,
            complete = function () {
                count--;
                if (count === 0) {
                    displays.getDisplayInfo();
                }
            },
            processQualityCodes = function (data) {
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
                complete();
            };

        $('body').tooltip({
            selector: '[data-toggle="tooltip"]',
            container: 'body'
        });

        displays.pointTypeList = displays.workspaceManager.config.Utility.pointTypes.getTypes();

        $.ajax({
            url: '/api/system/qualityCodes'
        }).done(function(data) {
            processQualityCodes(data);
        });

        $.ajax({
            url: '/api/points/' + displays.upi
        }).done(function(response) {
            var list = response['Screen Objects'] || [],
                upiList = [],
                c;

            displays.json = response;

            for(c=0; c<list.length; c++) {
                upiList.push(list[c].upi);
            }

            displays.upiList = upiList;
            complete();
        });
    },

    ScreenObject: function (config) {
        var self,
            bindings,
            isAnimation = false,
            type = displays.util.getObjectType(config['Screen Object']),
            style = displays.util.getObjectStyle(config),
            animationID = config['Animation ID'],
            stateList = ['Off', 'On', 'OffAlarm', 'OnAlarm', 'Fault'],
            animTypeLookup = {
                'onoff': 0,
                'frame': 1,
                'multifile': 2
            },
            animTypes = {
                0: {
                    type: 'onoff',
                    handler: function(val) {
                        return (val>0)?'':0;
                    }
                },
                1: {
                    type: 'frame',
                    handler: function(val) {
                        var retVal = parseInt(val / precision, 10);

                        return retVal;
                    }
                },
                2: {
                    type: 'multifile',
                    handler: function(val) {
                        var animation = displays.animationIDs[animationID] || {},
                            animationFile = animation[val];

                        if(origConfig._v2 === true) {
                            img = origConfig[animFileLookup[val] + 'State'];
                        } else {
                            img = animationFile || file;
                        }

                        return '';
                    }
                }
            },
            animFileLookup = (function() {
                var c,
                    len = stateList.length,
                    ret = {};

                for(c=0; c<len; c++) {
                    ret[c] = stateList[c];
                    ret[stateList[c]] = c;
                }

                return ret;
            }()),
            animTypeCfg = animTypes[config._animType || 0] || {},
            animType = animTypeCfg.type || 'onoff',
            handleClick = function (obj, event) {
                var item = ko.toJS(obj),
                    endPoint,
                    workspaceManager = displays.workspaceManager,
                    isDisplayObject = item['Point Type'] === 151,
                    localUPI = item.upi,
                    pointType = displays.pointTypes[localUPI],
                    target = (window.name === 'mainWindow' && isDisplayObject) ? window.name : 'pid_' + item.upi,

                    openWin = function() {
                        var title = displays.upiNames[item.upi] || item.Text;
                        endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, item.upi);
                        return displays.openWindow(endPoint.review.url, title, pointType, target, item.upi, {
                            width: 820,
                            height: 540
                        });
                    };

                //need to check for view mode vs edit
                if (localUPI) {//} && !(displays.pointReferenceSoftDeleted(localUPI) && isDisplayObject)) {  // don't get softdeleted display references
                    if (typeof localUPI !== 'string') { //upi is string for static text
                        if (!pointType) {
                            $.ajax({
                                url: '/api/points/' + localUPI
                            }).done(function(response) {
                                pointType = response['Point Type'].Value;
                                displays.pointTypes[localUPI] = pointType;
                                openWin();
                            });
                        } else {
                            openWin();
                        }
                    }
                }
            },
            processAnimation = function () {
                var animID = config['Animation ID'],
                    state = config.State,
                    file = config['Animation File'],
                    lookup;

                config['Animation File'] = file.replace('.gif', '');

                if(config._saveHeight !== true) {
                    config._animType = config.Height;
                    config._saveHeight = true;
                }

                if (animID) {
                    if(config.upi) {
                        lookup = displays.configUPIs[config.upi] || [];

                        lookup.push(animID);

                        displays.configUPIs[config.upi] = lookup;
                    }

                    displays.configIDs[animID] = displays.configIDs[animID] || {};

                    if (state !== undefined) {
                        displays.animationIDs[animID][state] = file;
                    }
                }

                bindings.src = config['Animation File'];
            },
            updateText = function (val, label) {
                var precision = self.bindings.precision();

                if (typeof val !== 'string') {
                    if (precision > 0) {
                        value = val.toFixed(precision);
                    } else {
                        value = parseInt(val, 10);
                    }
                } else {
                    value = val;
                }

                if (label === 'none') {
                    color = self._origConfig['Foreground Color'];
                } else {
                    color = displays.qualityCodes[label].color;
                    value = value + ' ' + displays.qualityCodes[label].label;
                }

                self.bindings.text(value);
                self.bindings.color(displays.util.getColor(color));
            },
            updateAnimation = function (dynamic) {
                var val = dynamic.Value,
                    eVal = dynamic.eValue,
                    precision = self.bindings.precision(),
                    img = self.bindings['Animation File']();

                if (typeof val !== 'string') {
                    frame = parseInt(val / (precision || 1), 10);
                } else {
                    frame = eVal;
                    val = eVal;
                }

                if (self.updateHandler) {
                    frame = self.updateHandler(val);
                } else {
                    frame = 0;
                }

                img = img.replace('.gif', '');

                if (frame === undefined) {
                    frame = '';
                }

                self.bindings.src(img + '/' + frame);
            };

        bindings = $.extend(style, config, {
            type: type,
            text: config.Text || '###',
            precision: config.Precision,
            handleClick: handleClick,
            src: displays.blankImg,
            isAnimation: isAnimation,
            pointName: displays.upiNames[config.upi] || ''
        });

        if (config['Screen Object'] === 3 || (config['Screen Object'] === undefined && config['Animation ID'])) { //is animation
            isAnimation = true;
            processAnimation();
        }

        self = {
            config: config,
            _origConfig: $.extend(true, {}, config),
            isDynamic: type === 'dynamic' || type === 'animation',
            type: type,
            bindings: ko.mapping.fromJS(bindings),
            handleDynamic: function (val, label, dynamic) {
                var precision = self.bindings.precision(),
                    value;

                if (!isAnimation) {
                    updateText(val, label);
                } else {
                    updateAnimation(dynamic);
                }
            }
        };

        return self;
    }
};

$(function () {
    displays.init();
});
var gpl = {
    texts: {},
    blocks: {},
    shapes: {},
    labelCounters: {},
    eventLog: [],
    actionLog: [],
    json: {},
    eventHandlers: {},
    destroyFns: [],
    canvases: {},
    MAXZOOM: 4,
    MINZOOM: 0.1,
    editModeOffset: 77,
    scaleValue: 1,
    defaultLoopDelay: 10,
    resizeDelay: 150,
    itemIdx: 0,
    editVersionStaleTimeout: 1000 * 60 * 5, //5 minutes
    gridSize: 1, //setOffset needs fixing to properly accomodate grid size > 1
    boundingRectTime: 0,
    boundingRectCount: 0,
    logLinePrefix: true,
    rendered: false,
    poppedIn: window.top.location.href !== window.location.href,
    idxPrefix: '_gplId_',
    toolbarFill: '#313131',
    iconPath: '/img/icons/',
    pointApiPath: '/api/points/',
    defaultBackground: 'C8BEAA',
    jqxTheme: 'flat',
    convertProperties: ['blockType', 'left', 'name', 'top', 'upi', 'label', 'connectionCount', 'precision', 'zIndex', 'labelVisible', 'presentValueVisible', 'connection', 'presentValueFont', 'value'],
    $body: $('body'),
    $tooltip: $('.gplTooltip'),
    $fontColorPicker: $('#fontColorPicker'),
    $bgColorPicker: $('#bgColorPicker'),
    $editTextModal: $('#editTextModal'),
    $messageModal: $('#gplMessage'),
    $messageModalBody: $('#gplMessageBody'),
    $sequencePropertiesModal: $('#gplSequenceProperties'),
    $editInputOutputModal: $('#editInputOutput'),
    $editPrecisionModal: $('#editPrecisionModal'),
    $editVersionModal: $('#editVersionModal'),
    $colorpickerModal: $('#colorpickerModal'),
    $editActionButtonModal: $('#editActionButtonModal'),
    $editActionButtonValueModal: $('#editActionButtonValueModal'),
    $actionButtonReportParameterModal: $('#actionButtonReportParameterModal'),
    $useEditVersionButton: $('#useEditVersion'),
    $discardEditVersionButton: $('#discardEditVersion'),
    point: window.gplData.point,
    references: window.gplData.references,
    upi: window.gplData.upi,
    DELETEKEY: 46,
    ESCAPEKEY: 27,
    ARROWKEYS: {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    },
    destroyObject: function (o) {
        var keys = Object.keys(o),
            c;
        for (c = 0; c < keys.length; c++) {
            delete o[keys[c]];
        }
    },
    onDestroy: function (fn) {
        gpl.destroyFns.push(fn);
    },
    captureThumbnail: function () {
        gpl.workspaceManager.captureThumbnail({
            upi: gpl.upi,
            name: gpl.point.Name,
            type: 'sequence'
        });
    },
    emptyFn: function () {
        return;
    },
    waitForSocketMessage: function (fn) {
        gpl.socketWaitFn = fn;
    },
    isCyclic: function (obj) {
        var seenObjects = [];

        function detect(obj) {
            var key;
            if (obj && typeof obj === 'object') {
                if (seenObjects.indexOf(obj) !== -1) {
                    return true;
                }
                seenObjects.push(obj);
                for (key in obj) {
                    if (obj.hasOwnProperty(key) && detect(obj[key])) {
                        console.log(obj, 'cycle at ' + key);
                        return true;
                    }
                }
            }
            return false;
        }

        return detect(obj);
    },
    deStringObject: function (iobj, onlyTrueFalse) {
        var obj = iobj || {},
            keys = Object.keys(obj),
            c,
            len = keys.length,
            prop,
            ret = null,
            tmp;

        for (c = 0; c < len; c++) {
            ret = null;
            prop = obj[keys[c]];
            if (typeof prop === 'string') {
                if (prop.toLowerCase() === 'false') {
                    ret = false;
                } else if (prop.toLowerCase() === 'true') {
                    ret = true;
                } else {
                    if (!onlyTrueFalse) {
                        if (prop.indexOf('.') > -1) {
                            tmp = parseFloat(prop);
                            if (!isNaN(tmp)) {
                                ret = tmp;
                            }
                        } else {
                            tmp = parseInt(prop, 10);
                            if (!isNaN(tmp)) {
                                ret = tmp;
                            }
                        }
                    }
                }
                if (ret !== null) {
                    obj[keys[c]] = ret;
                }
            } else if (typeof prop === 'object') {
                prop = gpl.deStringObject(prop, onlyTrueFalse);
            }
        }

        return obj;
    },
    convertBooleanStrings: function (obj) {
        return gpl.deStringObject(obj, true);
    },
    openWindow: function () {
        var windowRef,
            options = Array.prototype.slice.apply(arguments).pop(),
            attached = false,
            stopping = false,
            calledHandler = false,
            closeTimer,
            closeFn = function () {
                if (options.gplHandler && !calledHandler) {
                    calledHandler = true;
                    options.gplHandler.apply(this, arguments);
                }
                clearInterval(closeTimer);
            },
            checkUnload = function () {
                var oldUnload = windowRef.onbeforeunload;

                if (oldUnload !== closeFn && !attached) {
                    attached = true;
                    windowRef.onbeforeunload = function () {
                        if (!stopping) {
                            stopping = true;
                            closeFn();
                            oldUnload.apply(this, arguments);
                        } else {
                            return;
                        }
                    };
                }
            };

        gpl.fire('openwindow');

        windowRef = gpl._openWindow.apply(this, arguments);

        windowRef.onbeforeunload = closeFn;

        closeTimer = setInterval(checkUnload, 100);

        return windowRef;
    },
    defaultBlockMessage: 'Please Wait...',
    blockUI: function (message) {
        gpl.log('Blocking UI:', message || gpl.defaultBlockMessage);
        $.blockUI({
            message: message || gpl.defaultBlockMessage
        });
    },
    unblockUI: function () {
        gpl.log('Unblocking UI');
        $.unblockUI();
    },
    openPointSelector: function (callback, newUrl, pointType, property, nameFilter) {
        var url = newUrl || '/pointLookup',
            windowRef,
            pointTypes,
            pointSelectedCallback = function (pid, name, type) {
                if (!!pid) {
                    callback(pid, name, type);
                }
            },
            windowOpenedCallback = function () {
                var names = nameFilter ? {} : {
                    name1: gpl.point.name1,
                    name2: gpl.point.name2,
                    name3: gpl.point.name3,
                    name4: gpl.point.name4
                };

                windowRef.pointLookup.MODE = 'select';
                if (property) {
                    pointTypes = gpl.getPointTypes(property);
                    windowRef.pointLookup.POINTTYPES = pointTypes;
                }

                windowRef.pointLookup.init(pointSelectedCallback, names);
            };

        if (pointType) {
            url += '/' + pointType + '/' + property;
        }

        windowRef = gpl.openWindow(url, 'Select Point', '', '', 'Select Dynamic Point', {
            callback: windowOpenedCallback,
            width: 1000
        });
    },
    initGpl: function () {
        var count = 0,
            num = 0,
            complete = function () {
                count++;
                if (count === num) {
                    gpl.manager = new gpl.Manager();
                }
            },
            addFn = function (fn) {
                num++;
                fn(complete);
            };

        gpl.point = gpl.convertBooleanStrings(gpl.point);
        gpl.devicePointRef = gpl.deStringObject(gpl.point['Point Refs'][0]);

        addFn(function (cb) {
            $.ajax({
                url: '/api/points/' + gpl.devicePointRef.PointInst
            }).done(function (data) {
                gpl.devicePoint = data;
                cb();
            });
        });

        addFn(function (cb) {
            $.ajax({
                url: '/api/system/qualityCodes'
            }).done(function (data) {
                gpl._qualityCodes = data;
                cb();
            }).fail(function (xhr, stat, error) {
                gpl.log('qualityCodes error', JSON.stringify(error));
            });
        });
    },
    getBlock: function (arg) {
        return gpl.blockManager.getBlock(arg);
    },
    getLabel: function (type, increment) {
        var currCount,
            ret;

        if (increment) {
            gpl.labelCounters[type]++;
        }

        currCount = gpl.labelCounters[type];

        ret = type + currCount;
        // gpl.log('returning label', ret);

        return ret;
    },
    formatValue: function (block, value) {
        var precision = block.precision || 0,
            ret,
            val = value;

        if (typeof value === 'string') {
            val = parseFloat(value);
        }

        if (isNaN(val)) {
            ret = value;
        } else {
            precision = (precision * 10) % 10;

            if (precision > 0) {
                ret = val.toFixed(precision);
            } else {
                ret = parseInt(val, 10);
            }

            ret = ret.toString();
        }

        return ret;
    },
    addReferencePoint: function (upi, callback) {
        $.ajax({
            url: '/api/points/' + upi
        }).done(function (data) {
            var map;
            if (data.err) {
                gpl.showMessage('error getting point data');
            } else {
                if (data.message) {
                    gpl.log('AddReferencePoint error- upi:', upi, '--', data.message);
                } else {
                    map = gpl.pointUpiMap[upi] = {
                        Name: data.Name,
                        pointType: data['Point Type'].Value,
                        valueType: (data['Value'].ValueType === 5) ? 'enum' : 'float'
                    };
                    gpl.pointData[upi] = data;
                    callback(map, data);
                }
            }
        });
    },
    onRender: function (fn) {
        if (gpl.rendered === true) {
            fn(gpl.boundingBox);
        } else {
            gpl.on('rendered', function () {
                fn(gpl.boundingBox);
            });
        }
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
    timedEach: function (config) {
        var idx = 0,
            iterateFn = config.iteratorFn,
            list = config.list,
            delay = config.delay || gpl.defaultLoopDelay,
            cb = config.cb || null,
            doNext = function () {
                iterateFn(list[idx]);
                setTimeout(function () {
                    idx++;
                    if (idx < list.length) {
                        doNext();
                    } else {
                        if (cb) {
                            cb();
                        }
                    }
                }, delay);
            };

        doNext();
    },
    showMessage: function (message) {
        gpl.$messageModalBody.html(message);
        gpl.$messageModal.modal('show');
        if (gpl.socketWaitFn) {
            gpl.socketWaitFn();
            gpl.socketWaitFn = null;
        }
    },
    on: function (event, handler) {
        gpl.eventHandlers[event] = gpl.eventHandlers[event] || [];
        gpl.eventHandlers[event].push(handler);
    },
    fire: function (event, obj1, obj2) {
        var c,
            handlers = gpl.eventHandlers[event] || [],
            len = handlers.length;

        // gpl.log('firing', event);

        if (!gpl.skipEventLog) {
            gpl.eventLog.push({
                event: event,
                obj1: obj1 && obj1.gplId,
                obj2: obj2 && obj2.gplId
            });
        }

        for (c = 0; c < len; c++) {
            handlers[c](obj1 || null, obj2 || null);
        }
    },
    makeId: function () {
        gpl.itemIdx++;
        return gpl.idxPrefix + gpl.itemIdx;
    },
    makePointRef: function (upi, name) {
        var baseRef = {
            "PropertyName": "",
            "PropertyEnum": 0,
            "Value": upi,
            "AppIndex": 0,
            "isDisplayable": true,
            "isReadOnly": true,
            "PointName": name,
            "PointInst": upi,
            "DevInst": 0,
            "PointType": 0
        };

        return baseRef;
    },
    isEdit: document.location.href.match('/edit/') !== null,
    noSocket: document.location.href.match('nosocket') !== null,
    noLog: document.location.href.match('nolog') !== null,
    nobg: document.location.href.match('nobg') !== null,
    skipInit: document.location.href.match('skipinit') !== null,
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
    log: function () {
        var stack,
            steps,
            lineNumber,
            err,
            now = new Date(),
            args = [].splice.call(arguments, 0),
            pad = function (num) {
                return ('    ' + num).slice(-4);
            },
            formattedTime = gpl.formatDate(new Date(), true);

        if (gpl.logLinePrefix === true) {
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
        if (!gpl.noLog) {
            console.log.apply(console, args);
        }
    },
    convertColor: function (color) {
        if (color === undefined) {
            return;
        }

        var red = color & 0xFF,
            green = (color >> 8) & 0xFF,
            blue = (color >> 16) & 0xFF,
            pad = function (n) {
                return ('00' + n.toString(16)).slice(-2);
            };

        return pad(red) + pad(green) + pad(blue);
    },
    validationMessage: null,
    validate: {
        connection: function (anchor1, anchor2, skipErrorPrint) {
            //get order as obj1 -> obj2
            var obj1 = (anchor2.anchorType === 'Control Point') ? anchor2 : anchor1,
                obj2 = (anchor2.anchorType === 'Control Point') ? anchor1 : anchor2,
                isValid = false,
                anchorType2,
                block1,
                block2,
                pointType1,
                pointType2,
                allowedPoints2,
                property2,
                isPointValid = function (pointType, allowedPoints) {
                    var c,
                        ret = false;

                    for (c = 0; c < allowedPoints.length && !ret; c++) {
                        if (allowedPoints[c].key === pointType) {
                            ret = true;
                        }
                    }

                    if (!ret) {
                        // gpl.validationMessage = 'Invalid connection for point type ' + pointType;
                        if (!skipErrorPrint) {
                            gpl.log('invalid', pointType, allowedPoints);
                        }
                    }

                    return ret;
                },
                setVars = function () {
                    block1 = gpl.blockManager.getBlock(obj1.gplId);
                    block2 = gpl.blockManager.getBlock(obj2.gplId);

                    anchorType2 = obj2.anchorType;

                    if (block1 && block2) {
                        pointType1 = block1.pointType;
                        pointType2 = block2.pointType;
                    }
                },
                swapAnchors = function () {
                    var obj3 = obj2;

                    obj2 = obj1;
                    obj1 = obj3;
                };

            setVars();

            if (pointType1 && pointType2) {
                if (block2.type === 'ControlBlock') {
                    // gpl.log('swapped vars');
                    swapAnchors();
                    setVars();
                }

                if (pointType1 === 'Constant' && obj2.takesConstant === true) {
                    isValid = true;
                } else {
                    property2 = anchorType2;
                    allowedPoints2 = gpl.getPointTypes(property2, pointType2);

                    if (allowedPoints2.error) {
                        // gpl.validationMessage = ['Error with', property2, pointType2, '--', allowedPoints2.error].join(' ');
                        if (!skipErrorPrint) {
                            gpl.log('error with', property2, pointType2, '--', allowedPoints2.error);
                        }
                    } else {
                        if (isPointValid(pointType1, allowedPoints2)) {
                            isValid = true;
                        }
                    }
                }
            }

            return isValid;
        }
    },
    checkLineIntersection: function (line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
        var denominator,
            a,
            b,
            numerator1,
            numerator2,
            result = {
                x: null,
                y: null,
                onLine1: false,
                onLine2: false
            };
        denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
        if (denominator === 0) {
            return result;
        }
        a = line1StartY - line2StartY;
        b = line1StartX - line2StartX;
        numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
        numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
        a = numerator1 / denominator;
        b = numerator2 / denominator;

        result.x = line1StartX + (a * (line1EndX - line1StartX));
        result.y = line1StartY + (a * (line1EndY - line1StartY));
        if (a > 0 && a < 1) {
            result.onLine1 = true;
        }
        if (b > 0 && b < 1) {
            result.onLine2 = true;
        }
        return result;
    },
    findIntersections: function () {
        var start = new Date(),
            line1,
            line2,
            circle,
            lines1,
            lines2,
            l1,
            l2,
            results,
            c,
            cc,
            c1,
            c2,
            intersections = [],
            // coords = {},
            checked = {},
            lines = Object.keys(gpl.lineManager.lines),
            allLines = gpl.lineManager.lines,
            defaults = {
                radius: 2,
                fill: 'white',
                left: null,
                top: null
            };

        window.coords = window.coords || {};

        for (c = 0; c < lines.length; c++) {
            line1 = allLines[lines[c]];
            for (cc = 0; cc < lines.length; cc++) {
                if (cc !== c && (!checked[c + '-' + cc] && !checked[cc + '-' + c])) {
                    checked[c + '-' + cc] = true;
                    line2 = allLines[lines[cc]];
                    lines1 = line1.lines;
                    lines2 = line2.lines;
                    for (c1 = 0; c1 < lines1.length; c1++) {
                        l1 = lines1[c1];
                        for (c2 = 0; c2 < lines2.length; c2++) {
                            l2 = lines2[c2];
                            results = gpl.checkLineIntersection(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2);

                            if (results.onLine1 && results.onLine2) {
                                if (!window.coords[results.x + ',' + results.y]) {
                                    window.coords[results.x + ',' + results.y] = true;
                                    defaults.left = results.x - 1;
                                    defaults.top = results.y - 1;
                                    circle = new fabric.Circle(defaults);
                                    gpl.manager.canvas.add(circle);
                                    intersections.push(circle);
                                }
                            }
                        }
                    }
                }
            }
        }
        gpl.manager.canvas.renderAll();
        gpl.log('Intersections:', intersections.length, 'in', new Date() - start, 'ms');
    }
};

/* ------------ Shapes ------------------------ */

fabric.ExternalMonitorPointShape = fabric.util.createClass(fabric.Object, {
    type: 'ExternalMonitorPointShape',

    x: 0,

    y: 0,

    initialize: function (options) {
        var defaults = {
            fill: '#6a6af1'
        };

        this.options = $.extend(defaults, options);

        this.callSuper('initialize', this.options);

        this.set('width', this.options.width || 20)
            .set('height', this.options.height || 20);

        this.x = this.options.x || 0;
        this.y = this.options.y || 0;
        this.stroke = this.options.stroke || 'black';
    },

    _render: function (ctx) {
        var widthBy2 = this.width / 2,
            heightBy2 = this.height / 2,
            x = this.x - widthBy2,
            y = this.y - heightBy2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + widthBy2, y);
        ctx.lineTo(x + this.width, y + heightBy2);
        ctx.lineTo(x + widthBy2, y + this.height);
        ctx.lineTo(x, y + this.height);
        ctx.lineTo(x, y);
        // ctx.moveTo(x + this.width, y + heightBy2);
        // ctx.arc(x + this.width, y + heightBy2, heightBy2/2, 0, 2 * Math.PI, false);
        ctx.closePath();

        this._renderFill(ctx);
        this._renderStroke(ctx);
    },

    toObject: function (propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    },

    complexity: function () {
        return 1;
    }
});

fabric.ExternalMonitorPointShape.fromObject = function (object) {
    return new fabric.ExternalMonitorPointShape(object);
};

fabric.InternalMonitorPointShape = fabric.util.createClass(fabric.Object, {
    type: 'InternalMonitorPointShape',

    x: 0,

    y: 0,

    fill: '#6a6af1',

    initialize: function (options) {
        var defaults = {
            fill: this.fill
        };

        this.options = $.extend(defaults, options);

        this.callSuper('initialize', this.options);

        this.set('width', this.options.width || 20)
            .set('height', this.options.height || 20);

        this.x = this.options.x || 0;
        this.y = this.options.y || 0;
        this.stroke = this.options.stroke || 'black';
    },

    _render: function (ctx) {
        var widthBy3 = this.width / 3,
            heightBy3 = this.height / 3,
            x = this.x - this.width / 2,
            y = this.y - this.height / 2;

        ctx.beginPath();
        ctx.moveTo(x + widthBy3, y);
        ctx.lineTo(x + 2 * widthBy3, y);
        ctx.lineTo(x + this.width, y + heightBy3);
        ctx.lineTo(x + this.width, y + 2 * heightBy3);
        ctx.lineTo(x + 2 * widthBy3, y + this.height);
        ctx.lineTo(x + widthBy3, y + this.height);
        ctx.lineTo(x, y + 2 * heightBy3);
        ctx.lineTo(x, y + heightBy3);
        ctx.lineTo(x + widthBy3, y);

        // ctx.moveTo(x + this.width, y + heightBy2);
        // ctx.arc(x + this.width, y + heightBy2, heightBy2/2, 0, 2 * Math.PI, false);
        ctx.closePath();

        this._renderFill(ctx);
        this._renderStroke(ctx);
    },

    toObject: function (propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    },

    complexity: function () {
        return 1;
    }
});

fabric.InternalMonitorPointShape.fromObject = function (object) {
    return new fabric.InternalMonitorPointShape(object);
};

fabric.ExternalControlPointShape = fabric.util.createClass(fabric.ExternalMonitorPointShape, {
    type: 'ExternalControlPointShape',

    initialize: function (options) {
        var defaults = {
            flipX: true,
            fill: '#2bef30'
        };

        this.callSuper('initialize', $.extend(defaults, options));
    },

    toObject: function () {
        return this.callSuper('toObject');
    },

    _render: function (ctx) {
        return this.callSuper('_render', ctx);
    }
});

fabric.ExternalControlPointShape.fromObject = function (object) {
    return new fabric.ExternalControlPointShape(object);
};

fabric.InternalControlPointShape = fabric.util.createClass(fabric.InternalMonitorPointShape, {
    fill: '#2bef30'
});

fabric.InternalControlPointShape.fromObject = function (object) {
    return new fabric.InternalControlPointShape(object);
};

fabric.ConstantPointShape = fabric.util.createClass(fabric.Rect, {
    type: 'ConstantPointShape',

    fill: '#FF9600',
    stroke: 'black',

    initialize: function (options) {
        this.callSuper('initialize', options);
    },

    toObject: function (propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    }
});

fabric.ConstantPointShape.fromObject = function (object) {
    return new fabric.ConstantPointShape(object);
};



/* ------------ Blocks ------------------------ */

gpl.Anchor = fabric.util.createClass(fabric.Circle, {
    gplType: 'anchor',
    lockMovementX: true,
    lockMovementY: true,
    anchorRadius: 2.5,
    hoverRadius: 5,
    hoverCursor: gpl.isEdit ? 'url("/img/pencil.cur") 0 0, pointer' : 'default',


    initialize: function (config) {
        this.config = config;
        this.initConfig();

        this.callSuper('initialize', this.config);

        this.x = this.config.x || 0;
        this.y = this.config.y || 0;
    },

    initConfig: function () {
        this.anchorDefaults = {
            fill: 'black',
            stroke: 'blue',
            borderColor: 'black',
            // hoverCursor: 'crosshair',
            gplType: 'anchor',
            radius: this.anchorRadius,
            hasRotatingPoint: false,
            hasBorders: false,
            hasControls: false,
            transparentCorners: false,
            selectable: false,
            isAnchor: true
        };

        this.attachFn = gpl.emptyFn;
        this.detachFn = gpl.emptyFn;

        this.attachedLines = {};
        this.attachedLineCount = 0;

        this.config = $.extend(this.config, this.anchorDefaults);

        this.config.left = this.config._originalLeft = this.config.leftFn(this.anchorRadius);
        this.config.top = this.config._originalTop = this.config.topFn(this.anchorRadius);
    },

    hover: function () {
        var gap = this.hoverRadius - this.anchorRadius;

        if (!this._oFill) {
            this._oFill = this.fill;
            this._oStroke = this.stroke;
            this._oRadius = this.radius;
        }

        if (!this.hovered) {
            this.hoverLeft = this.left;
            this.hoverTop = this.top;
            this.hovered = true;
            this.set({
                fill: 'green',
                stroke: 'green',
                radius: this.hoverRadius,
                left: this.left - gap / 2 - 1,
                top: this.top - gap / 2 - 1
            });
        }
    },

    clearHover: function () {
        this.hovered = false;
        this.set({
            radius: this.anchorRadius,
            left: this._originalLeft,
            top: this._originalTop,
            fill: this._oFill,
            stroke: this._oStroke
        });
    },

    getLines: function () {
        var ret = [];

        gpl.forEach(this.attachedLines, function (line) {
            ret.push(line);
        });

        return ret;
    },

    redrawLine: function () {
        var self = this;
        gpl.forEach(self.attachedLines, function (line) {
            line.redrawLine(self.gplId, {
                x: self.left - (self.radius / 2),
                y: self.top + (self.radius / 2)
            });
        });
    },

    getConnectedBlock: function () {
        var line = this.attachedLine,
            ret = null;

        if (line) {
            if (line.endAnchor === this) {
                ret = line.startAnchor;
            } else {
                ret = line.endAnchor;
            }
        }

        if (ret) {
            ret = gpl.blockManager.getBlock(ret.gplId);
        }

        return ret;
    },

    onAttach: function (fn) {
        this.attachFn = fn;
    },

    onDetach: function (fn) {
        this.detachFn = fn;
    },

    attach: function (line) {
        this.attachedLines[line.gplId] = line;
        this.connected = true;
        this.attachedLineCount++;

        this.attachFn(this, line);
    },

    detach: function (line) {
        var self = this,
            detachLine = function (dLine) {
                var lineToDetach = self.attachedLines[dLine.gplId];
                // gpl.log('detaching line', dLine);
                // line.detach(self);
                lineToDetach.detach();
                // lineToDetach.delete();
                delete self.attachedLines[dLine.gplId];
                self.attachedLineCount--;
            };

        if (line) {
            detachLine(line);
        } else {
            gpl.forEach(self.attachedLines, function (line, lineId) {
                detachLine(line);
            });
        }

        self.connected = self.attachedLineCount > 0;

        self.detachFn(self, line);
    },

    delete: function () {
        gpl.blockManager.canvas.remove(this);
    }
});

gpl.Block = fabric.util.createClass(fabric.Rect, {
    opacity: 0,
    labelFontSize: 10,
    labelMargin: 5,
    minLabelWidth: 80,
    valueAnchor: 'output',
    invalidStroke: 'red',
    shadow: {
        offsetX: 1.5,
        offsetY: 1.5
    },
    defaultPrecision: 3.1,
    labelFontFamily: 'Arial',
    hasOutput: true,
    hasShutdownBlock: true,
    hasRotatingPoint: false,
    selectable: false,
    hasControls: false,
    initialized: false,

    toolbarHeight: 30,
    toolbarWidth: 30,

    iconExtension: '.png',
    iconSuffix: 'Icon',
    iconOffsetLeft: 0,
    iconOffsetTop: 0,

    gplType: 'block',

    rightAnchor: {
        anchorType: 'Control Point'
    },

    getLeftAnchorDefaults: function (top, self) {
        return {
            isVertical: false,
            leftFn: function (radius) {
                return -1 * radius + self.left;
            },
            topFn: function (radius) {
                return top - (radius / 2) + self.top - 0.5;
            }
        };
    },

    getRightAnchorDefaults: function (top, self) {
        return {
            isVertical: false,
            topFn: function (radius) {
                return top - (radius / 2) + self.top - 0.5;
            },
            leftFn: function (radius) {
                return self.width - radius + self.left;
            }
        };
    },

    _forEachAnchor: function (fn) {
        var c,
            self = this,
            list = self.inputAnchors || [];

        if (self.outputAnchor) {
            fn(self.outputAnchor);
        }

        if (self.inputAnchor) {
            fn(self.inputAnchor);
        }

        if (self.shutdownAnchor) {
            fn(self.shutdownAnchor);
        }

        for (c = 0; c < list.length; c++) {
            fn(list[c]);
        }
    },

    _createAnchor: function (config) {
        var self = this,
            newConfig = $.extend(true, {}, config),
            anchor;

        newConfig.gplId = this.gplId;
        newConfig.visible = false;

        anchor = new gpl.Anchor(newConfig);

        anchor.onAttach(function (anc, line) {
            self.handleAnchorAttach(anchor, line);
        });

        anchor.onDetach(function (anc, line) {
            self.handleAnchorDetach(anchor, line);
        });

        this.add(anchor);

        return anchor;
    },

    _createLeftAnchor: function (top, config) {
        var self = this,
            cfg = $.extend(true, this.getLeftAnchorDefaults(top, self), config);

        this.inputAnchors = this.inputAnchors || [];

        this.inputAnchors.push(this._createAnchor(cfg));
    },

    _createRightAnchor: function (top, config) {
        var self = this,
            cfg = $.extend(true, this.getRightAnchorDefaults(top, self), config);

        this.outputAnchor = this._createAnchor(cfg);
    },

    _createInputAnchor: function (top) {
        var self = this;

        self.inputAnchors = self.inputAnchors || [];

        self.inputAnchors.push(self._createAnchor({
            inputAnchorIndex: self.inputAnchors.length,
            anchorType: 'input',
            isVertical: false,
            leftFn: function (radius) {
                return -1 * radius + self.left;
            },
            topFn: function (radius) {
                return top - (radius / 2) + self.top - 0.5;
            }
        }));
    },

    _createOutputAnchor: function (top) {
        var self = this;

        self.outputAnchor = self._createAnchor({
            anchorType: 'output',
            isVertical: false,
            topFn: function (radius) {
                return top - (radius / 2) + self.top - 0.5;
            },
            leftFn: function (radius) {
                return self.width - radius + self.left;
            }
        });
    },

    _createShutdownAnchor: function (top) {
        var self = this;
        self.shutdownAnchor = self._createAnchor({
            anchorType: 'Shutdown Point',

            // isShutdown: true,
            isVertical: true,
            topFn: function (radius) {
                return top - (radius / 2) + self.top - 1.5;
            },
            leftFn: function (radius) {
                return self.width / 2 - (radius / 2) + self.left - 1;
            }
        });
    },

    handleAnchorAttach: function (anchor, line) {
        var self = this,
            otherAnchor = line.getOtherAnchor(anchor),
            otherBlock = gpl.blockManager.getBlock(otherAnchor.gplId),
            name,
            upi,
            idx;

        if (!self.isNonPoint) {
            if (otherBlock) {
                upi = otherBlock.upi;
                self.upiList[upi] = anchor;
                anchor.attachedUPI = upi;
                gpl.blockManager.addUPIListener(upi, anchor, line, function () {
                    self.processValue.apply(self, arguments);
                });
                idx = self._pointRefs[anchor.anchorType];
            }

            if (idx) {
                if (otherBlock.upi) {
                    name = gpl.pointData[otherBlock.upi];
                    name = name && name.Name;
                } else {
                    name = otherBlock.name;
                }

                if (name) {
                    self.setPointRef(anchor.anchorType, otherBlock.upi, name);
                }
            }
        }
    },

    handleAnchorDetach: function (anchor, line) {
        this.setPointRef(anchor.anchorType, 0, '');
        return;
    },

    syncAnchorPoints: function () {
        var c,
            self = this,
            list = this.inputAnchors || [],
            data = self._origPointData,
            newData = self._pointData,
            tmpData,
            formatPoint = gpl.workspaceManager.config.Update.formatPoint,
            sync = function (anchor) {
                var lines = anchor.getLines() || [],
                    line,
                    otherEnd,
                    block,
                    cc,
                    gplId,
                    upi,
                    setDataVars = function () {
                        if (!upi) {
                            gpl.emptyFn();
                            // gpl.log('no upi');
                        } else {
                            if (gpl.pointData[upi]) {
                                // if(newData && data) {
                                try {
                                    tmpData = formatPoint({
                                        point: newData,
                                        oldPoint: data,
                                        property: anchor.anchorType,
                                        refPoint: gpl.pointData[upi]
                                    });
                                } catch (ex) {
                                    gpl.log('error formatting point', ex.message);
                                }
                                if (tmpData.err) {
                                    gpl.log(self.gplId, self.type, anchor.anchorType, 'error:', tmpData.err);
                                } else {
                                    self._origPointData = newData;
                                    self._pointData = tmpData;
                                    data = newData;
                                    newData = data;
                                }
                            } else {
                                gpl.log('no upi data found for', upi, block);
                            }
                        }
                        // } else {
                        //     gpl.log(self.gplId, self.type, 'data vars error:', newData, data);
                        // }
                        // gpl.log('formatted point', tmpData);
                    };

                if (lines.length > 0) {
                    for (cc = 0; cc < lines.length; cc++) {
                        line = lines[cc];
                        otherEnd = line.getOtherAnchor(anchor);

                        if (otherEnd) {
                            gplId = otherEnd.gplId;
                            block = gpl.blockManager.getBlock(gplId);
                            upi = block.upi;

                            if (block) {
                                if (block.blockType !== 'Constant') {
                                    setDataVars();
                                    // } else {
                                    //     gpl.log('constant found');
                                }
                                // } else {
                                //     gpl.log('no block', gplId, block);
                            }

                            //self.setPointData(newPoint);
                        } //shouldn't need an else, lines are removed on block delete
                    }
                } else {
                    //detached
                    self.setPointRef(anchor.anchorType, 0, '');
                    // gpl.log('no lines attached, blanking out', anchor.anchorType);
                    setDataVars();
                }
            };

        // gpl.log('syncing anchor points', this.gplId);

        for (c = 0; c < list.length; c++) {
            sync(list[c]);
        }

        if (this.shutdownAnchor) {
            sync(this.shutdownAnchor);
        }

        if (this.outputAnchor) {
            sync(this.outputAnchor);
        }
    },

    syncObjects: function (target, offsets) {
        var left = target.left,
            top = target.top,
            shape,
            c;

        // gpl.log('syncing objects');

        if (offsets) {
            left += (offsets.left || 0) * gpl.scaleValue;
            top += (offsets.top || 0) * gpl.scaleValue;
        }

        this.left = left;
        this.top = top;

        for (c = 0; c < this._shapes.length; c++) {
            shape = this._shapes[c];
            shape.left = left + (shape._shapeOffsetLeft); //left + shape.offsetLeft * gpl.scaleValue;// - this.width/2;
            shape.top = top + (shape._shapeOffsetTop); //top + shape.offsetTop * gpl.scaleValue;// - this.height/2;
            // gpl.log(shape.gplType, left, top, shape.offsetLeft, shape.offsetTop);
        }
    },

    lock: function (locked) {
        var c,
            list = this._shapes,
            len = list.length;

        for (c = 0; c < len; c++) {
            list[c].lockMovementX = locked;
            list[c].lockMovementY = locked;
        }
    },

    scale: function (value) {
        var c,
            list = this._shapes,
            len = list.length;

        for (c = 0; c < len; c++) {
            list[c].scale(value);
        }

        if (this.backgroundImage) {
            this.backgroundImage.scale(value);
        }

        this.scaleValue = value;
    },

    setOffset: function (offset) {
        var left = offset.left,
            top = offset.top,
            typesToSync = {
                backgroundimage: true,
                value: true,
                anchor: true,
                label: true
            },
            shape,
            c;

        // gpl.log('setting offsets', left, top);

        for (c = 0; c < this._shapes.length; c++) {
            shape = this._shapes[c];

            if (typesToSync[shape.gplType]) {
                shape.left = left + shape._originalLeft * gpl.scaleValue;
                shape.top = top + shape._originalTop * gpl.scaleValue;
                // if(shape.gplType === 'anchor') {
                //     gpl.log('anchor', left, shape._originalLeft, shape.left, shape.gplId);
                // }
            }
        }
    },

    resetOffset: function () {
        var c,
            shape;

        // gpl.log('resetting offsets');

        for (c = 0; c < this._shapes.length; c++) {
            shape = this._shapes[c];
            shape._originalLeft = shape.left;
            shape._originalTop = shape.top;
        }
    },

    calcOffsets: function () {
        var c,
            shape;

        for (c = 0; c < this._shapes.length; c++) {
            shape = this._shapes[c];
            shape._originalLeft = shape.left;
            shape._originalTop = shape.top;
            shape.setCoords();
        }
    },

    resetPosition: function () {
        var self = this,
            shape = self._shapes[0];

        shape.left = shape.originalState.left;
        shape.top = shape.originalState.top;
        self.syncObjects(shape);
        self.calcOffsets();
        self.renderAll();
    },

    setPosition: function () {
        var self = this,
            shape = self._shapes[0];

        shape.originalState.left = shape.left;
        shape.originalState.top = shape.top;
    },

    nudge: function (offset) {
        this.left += offset.left;
        this.top += offset.top;

        this.syncObjects(this);
        this.redrawLines();
        this.renderAll();
    },

    add: function (object, render) {
        object.offsetLeft = object.left - this.left;
        object.offsetTop = object.top - this.top;
        this._shapes.push(object);
        if (this.initialized || this.isNonPoint) {
            gpl.blockManager.add(object, this.targetCanvas, render);
        }
    },

    getLabel: function () {
        var label = gpl.getLabel(this.type, true);

        this.setLabel(label);
    },

    setShowLabel: function (show) {
        this.labelVisible = show;

        this.labelText.visible = show;

        this.labelText.opacity = show ? 1 : 0;

        this.renderAll();
    },

    setShowValue: function (show) {
        this.presentValueVisible = show;

        this.valueText.visible = show;

        this.renderAll();
    },

    processValue: gpl.emptyFn,

    syncAnchorValue: function (anchor, val) {
        var type = anchor.anchorType;

        if (anchor.constantProp) {
            this._pointData[anchor.constantProp].Value = val;
            gpl.fire('editedblock', this);
        }
        // this._pointData[type].Value = val;
    },

    getReferencePoint: function (isNew) {
        var self = this,
            pointMap;

        if (self.upi) {
            pointMap = gpl.pointUpiMap[self.upi];

            if (pointMap) {
                self.setReferencePoint(pointMap, isNew);
            } else {
                gpl.log('point not found');
                gpl.addReferencePoint(self.upi, function (point) {
                    self.setReferencePoint(point, isNew);
                });
            }
        }
    },

    setReferencePoint: function (pointMap, isNew) {
        this.pointType = pointMap.pointType;
        this.valueType = pointMap.valueType;
        this.setPlaceholderText();

        if (isNew) {
            this.label = pointMap.Name.split('_').pop();
            this.labelText.setText(this.label);
            gpl.blockManager.renderAll();
        }

        this.tooltip = this.pointName = pointMap.Name;
    },

    setReferenceType: function (type) {
        this.referenceType = type;
        this.setVisibleShape(type);
    },

    setVisibleShape: function (type) {
        var list = this.fabricShapes;

        gpl.forEach(list, function (shape, shapeName) {
            if (shapeName === type) {
                shape.visible = true;
                shape.opacity = 1;
                shape.hidden = false;
            } else {
                shape.visible = false;
                shape.opacity = 0;
                shape.hidden = true;
            }
        });

        this.renderAll();
    },

    updatePointRefs: function (pointData) {
        var refs = pointData['Point Refs'],
            len = refs.length,
            c;

        for (c = 0; c < len; c++) {
            refs[c].isReadOnly = true;
        }

        pointData._parentUpi = gpl.upi;
    },

    setPointData: function (point, processChanges) {
        var newPoint = point.newPoint || point,
            oldPoint = point.oldPoint || point;

        if (!this._origPointData) {
            this._origPointData = $.extend(true, {}, oldPoint);
            this.updatePointRefs(this._origPointData);
        }

        this._pointData = $.extend(true, {}, newPoint);
        gpl.pointData[this.upi] = this._pointData;
        this.updatePointRefs(this._pointData);

        if (processChanges) {
            this.processPointData(newPoint);
            if (this.setIconName) {
                this.setIconName();
            }
            this.setLabel(newPoint.name4);
        }

        this.pointName = this._pointData.Name;

        this.mapPointRefs();
    },

    getPointData: function () {
        return this._pointData;
    },

    mapPointRefs: function () {
        var refs = this._pointData['Point Refs'],
            obj = {},
            c;

        for (c = 0; c < refs.length; c++) {
            obj[refs[c].PropertyName] = c;
        }

        this._pointRefs = obj;
    },

    setPointRef: function (prop, upi, name) {
        var data = this._pointData,
            refs,
            ref,
            idx;

        if (data) {
            refs = this._pointData['Point Refs'];
            idx = this._pointRefs[prop];
            if (idx !== undefined) {
                ref = refs[idx];
                ref.Value = ref.DevInst = ref.PointInst = upi;
                refs[idx].PointName = name;
            }
            // } else {
            //     gpl.log('no point data', this.type, this.gplId);
        }
    },

    processPointData: function (point) {
        var self = this,
            props = {
                iconType: function () {
                    var calcType = point['Calculation Type'] || {},
                        reverseAction = point['Reverse Action'] || {};

                    // if(calcType) {
                    calcType = calcType.Value;
                    reverseAction = reverseAction.Value;

                    if (self.setIconName) {
                        self.setIconName();
                    } else {
                        if (calcType && self.iconType !== calcType) {
                            self.config.iconType = calcType;

                            if (self.iconPrefix) {
                                self.config.iconType = self.iconPrefix + calcType;
                            }

                            self.icon = self.config.iconType + self.iconExtension;
                        }
                    }

                    self.setIcon();
                    // }

                    // if(reverseAction !== undefined) {

                    // }
                }
            };

        gpl.forEach(props, function (fn, property) {
            fn(property);
        });
    },

    setInvalid: function () {
        var shape = this._shapes[0];

        if (!shape._origStroke) {
            shape._origStroke = shape.stroke;
        }

        shape.stroke = this.invalidStroke;
        shape.strokeWidth = 2;
    },

    setValid: function () {
        var shape = this._shapes[0];

        shape.stroke = shape._origStroke || shape.stroke;
        shape.strokeWidth = 1;
    },

    validate: function () {
        var self = this,
            c,
            list = self.inputAnchors || [],
            len = list.length,
            anchor,
            valid = true,
            isValid = function (anchor) {
                var ret = true,
                    lines = anchor.getLines(),
                    cc;

                if (lines.length > 0) {
                    for (cc = 0; cc < lines.length && ret; cc++) {
                        if (!lines[cc].validate()) {
                            ret = false;
                        }
                    }
                } else {
                    if (anchor.required === true) {
                        ret = false;
                        gpl.validationMessage = 'No ' + anchor.anchorType + ' connection on ' + self.type + ' block';
                        gpl.log('no lines associated', anchor.anchorType, 'on', self.type);
                    }
                }

                valid = ret;
            };

        if (self.shutdownAnchor) {
            isValid(self.shutdownAnchor);
        }

        if (self.outputAnchor && valid) {
            isValid(self.outputAnchor);
        }

        for (c = 0; c < len && valid; c++) {
            anchor = list[c];
            isValid(anchor);
        }

        if (!valid) {
            self.setInvalid();
        } else {
            self.setValid();
        }

        return valid;
    },

    delete: function () {
        var c,
            list = this.inputAnchors || [],
            canvas = gpl.canvases[this.targetCanvas || 'main'],
            len = list.length,
            invalidate = function (anchor) {
                var lines,
                    cc;

                if (anchor) {
                    lines = anchor.getLines();

                    for (cc = 0; cc < lines.length; cc++) {
                        lines[cc].delete();
                    }

                    // gpl.log('invalidating anchor', anchor);
                    anchor.detach();
                    anchor.delete();
                }
            };

        for (c = 0; c < len; c++) {
            invalidate(list[c]);
        }

        invalidate(this.shutdownAnchor);

        invalidate(this.outputAnchor);

        len = this._shapes.length;
        for (c = 0; c < len; c++) {
            canvas.remove(this._shapes[c]);
        }

        this.renderAll();
    },

    destroy: function () {
        this.delete();
        gpl.destroyObject(this);
    },

    redrawLines: function () {
        this._forEachAnchor(function (anchor) {
            anchor.redrawLine();
        });
    },

    getPointInfo: function () {
        var self = this,
            data;

        self._pointRefs = {};

        if (self.upi) {
            data = gpl.pointData[self.upi];
            if (!data) {
                gpl.addReferencePoint(self.upi, function (map, point) {
                    self.setPointData(point);
                });
            } else {
                self.setPointData(data);
            }
        }
    },

    getPlaceholderText: function () {
        var precision = this.precision,
            ints = Math.floor(precision),
            decs = precision % 1,
            c,
            ret = '';

        if (this.valueType === 'enum') {
            ret = '###';
        } else {
            for (c = 0; c < ints; c++) {
                ret += '#';
            }
            ret += '.';
            for (c = 0; c < decs; c++) {
                ret += '#';
            }
        }

        return ret;
    },

    setPlaceholderText: function () {
        var text = this.getPlaceholderText();

        if (this.valueText) {
            this.valueText.setText(text);
            this.renderAll();
        }
    },

    renderAll: function () {
        gpl.blockManager.renderAll();
    },

    //initialization methods -----------------------------------------------

    initialize: function (config) {
        this.config = config;

        this.initConfig();

        this.getPointInfo();

        this.callSuper('initialize', this.config);
        this.setShadow(this.shadow);

        this.x = this.config.x || 0;
        this.y = this.config.y || 0;

        this.initShapes();

        gpl.blockManager.registerBlock(this, this.valueText, this.targetCanvas);

        if (this.upi && gpl.pointData[this.upi]) {
            this._pointData = gpl.pointData[this.upi];
        }

        if (this.scaleValue !== 1) {
            this.scale(this.scaleValue);
        }

        this.initialized = true;
    },

    initConfig: function () {
        this.targetCanvas = this.config.targetCanvas || 'main';
        this.gplId = gpl.makeId();
        this.precision = this.defaultPrecision;

        this.upi = +this.config.upi;

        this.shapes = this.shapes || {};
        this._shapes = [];

        this._offsetLeft = 0;
        this._offsetTop = 0;

        this.scaleValue = this.config.scaleValue || 1;

        this.shapeDefaults = {
            hasRotatingPoint: false,
            selectable: !!gpl.isEdit,
            hasControls: false
        };

        // if(!gpl.isEdit) {
        this.shapeDefaults.hoverCursor = 'default';
        // }

        this.anchorDefaults = {
            fill: 'black',
            stroke: 'blue',
            radius: this.anchorRadius,
            hasRotatingPoint: false,
            borderColor: 'black',
            transparentCorners: false,
            selectable: false,
            isAnchor: true
        };

        this.upiList = {};
        this.upiValues = {};

        // if(gpl.isEdit) {
        //     this.anchorDefaults.hoverCursor = 'crosshair';
        // }
    },

    initShapes: function () {
        this.initFabricShapes();
        this.initAnchors();
        this.initLabel();
        this.initValue();
        this.initIcon();
        this.postInit();
    },

    postInit: function () {
        var c,
            list = this._shapes;

        if (!this.config.inactive) {
            this.showShapes();
        }

        for (c = 0; c < list.length; c++) {
            list[c]._shapeOffsetLeft = list[c].left - this.left;
            list[c]._shapeOffsetTop = list[c].top - this.top;
        }
    },

    initAnchors: function () {
        this.initInputAnchors();
        this.initOutputAnchor();
        this.initShutdownAnchor();
    },

    initIcon: function () {
        var self = this;

        self._icons = {};

        if (!self.noIcon) {
            if (self.getIcon) {
                self.icon = self.getIcon();
            } else {
                self.icon = self.config.iconType + self.iconExtension;
            }
            self.setIcon();
        }
    },

    initLabel: function () {
        var config = {
            top: this.top - this.labelFontSize - this.labelMargin,
            left: this.left + (this.width / 2),
            textAlign: 'center',
            originX: 'center',
            fontSize: parseInt(this.labelFontSize, 10),
            fontFamily: this.labelFontFamily,
            gplType: 'label',
            readOnly: true,
            opacity: 1,
            selectable: false,
            gplId: this.gplId
        };

        // if(this.labelVisible === undefined) {
        //     this.labelVisible = gpl.json.Show_Label;
        // } else {
        if (this.labelVisible === 0) { //take sequence option?
            this.labelVisible = gpl.json.Show_Label;
        } else {
            if (this.labelVisible === undefined) {
                this.labelVisible = false;
            }
        }
        // }


        if (this.labelVisible === false) {
            // this.labelVisible = false;
            config.visible = false;
            // config.opacity = 0;
            config._wasHidden = true;
        }

        this.label = this.label || (!this.config.inactive ? gpl.getLabel(this.type) : '');

        if (this.config.inactive) {
            config.visible = false;
        }

        this.labelText = new fabric.Text(this.label || '', config);

        // if(this.labelVisible === 0) {//legacy
        //     this.labelText._wasHidden = true;
        // }

        if (this.labelText.width < this.minLabelWidth) {
            this.labelText.set('width', this.minLabelWidth);
        }

        this.labelText._originalTop = config.top;
        this.labelText._originalLeft = this.labelText.left;
        this.add(this.labelText);
    },

    initValue: function () {
        var config = {
            textAlign: 'left',
            fontSize: parseInt(this.labelFontSize, 10),
            fontFamily: this.labelFontFamily,
            gplType: 'value',
            selectable: false,
            readOnly: true,
            top: this.top - this.labelFontSize + this.height / 2 - this.labelMargin / 2,
            originX: 'left',
            gplId: this.gplId
        };

        if (this.valueAnchor === 'output') {
            config.left = this.left + this.width + this.labelMargin;
        } else {
            config.left = this.left - this.labelMargin;
            config.textAlign = 'right';
            config.originX = 'right';
        }

        if (this.presentValueVisible === 0) { //take sequence option?
            this.presentValueVisible = gpl.json.Show_Value;
        } else {
            if (this.presentValueVisible === undefined) {
                this.presentValueVisible = false;
            }
        }

        if (this.presentValueVisible === false || this.config.showValue === false) {
            config.visible = false;
        }

        this.valueText = new fabric.Text(this.getPlaceholderText(), config);
        this.valueText._originalTop = config.top;
        this.valueText._originalLeft = this.valueText.left;
        this.add(this.valueText);
    },

    initInputAnchors: function () {
        var c,
            padding = 10,
            len = this.numInputs || (this.leftAnchors && this.leftAnchors.length) || 0,
            margin,
            arr = [],
            top = padding;

        if (len === 1) {
            top = margin = parseInt(this.height / 2, 10);
        } else {
            margin = parseInt((this.height - (2 * padding)) / (len - 1), 10);
        }

        if (this.leftAnchors) {
            len = this.leftAnchors.length;
        } else {
            for (c = 0; c < len; c++) {
                arr.push({
                    anchorType: 'Input Point ' + (c + 1),
                    takesConstant: true
                });
            }
            this.leftAnchors = arr;
        }

        for (c = 0; c < len; c++) {
            if (this.leftAnchors) {
                this._createLeftAnchor(top, this.leftAnchors[c]);
            } else {
                this._createInputAnchor(top);
            }

            top += margin;
        }
    },

    initOutputAnchor: function () {
        var top = this.height / 2;

        if (this.hasOutput) {
            if (this.rightAnchor) {
                this._createRightAnchor(top, this.rightAnchor);
            } else {
                this._createOutputAnchor(top);
            }
        }
    },

    initShutdownAnchor: function () {
        var top = this.height;

        if (this.hasShutdownBlock === true) {
            this._createShutdownAnchor(top);
        }
    },

    initFabricShapes: function () {
        var self = this,
            shapeName,
            Shape,
            newShape,
            ShapeClass,
            cfg,
            config,
            highlight = function (shape) {
                return function () {
                    gpl.blockManager.highlight(shape);
                };
            },
            clearShapes = function () {
                self.removeShapes();
            };

        self.fabricShapes = {};

        for (shapeName in self.shapes) {
            if (self.shapes.hasOwnProperty(shapeName)) {
                Shape = self.shapes[shapeName];
                config = $.extend(true, {}, self.shapeDefaults);
                cfg = $.extend(true, config, Shape.cfg || {});
                cfg.shadow = self.shadow;
                ShapeClass = Shape.cls;
                cfg.top = self.top;
                cfg.left = self.left;
                cfg.gplId = self.gplId;
                cfg.gplType = 'block';
                cfg._origFill = cfg.fill;

                if (cfg.hidden === true || (self.config.inactive && self.noIcon !== true)) {
                    cfg.opacity = 0;
                    cfg.visible = false;
                    // cfg._wasHidden = true;

                    // config.evented = false;
                }

                if (!gpl.isEdit) {
                    cfg.selectable = false;
                    cfg.draggable = false;
                    cfg.hasBorders = false;
                    cfg.lockMovementX = true;
                    cfg.lockMovementY = true;
                }

                newShape = new ShapeClass(cfg);
                self.add(newShape);
                self.fabricShapes[shapeName] = newShape;
                newShape.on('selected', highlight(newShape));
                newShape.on('removed', clearShapes);
            }
        }
    },

    setActive: function () {
        // this.targetCanvas = 'main';
        this.labelVisible = gpl.point['Show Label'].Value;

        this.bypassSave = false;
        this.showShapes();

        // if(this.labelVisible) {
        //     this.labelText.opacity = 1;
        //     this.labelText.visible = true;
        // }

        this.config.inactive = false;
    },

    convertIconNames: function () {
        var self = this,
            currIconName = self.icon.split('.')[0],
            matrixEntry;

        if (self.iconMatrix) {
            matrixEntry = self.iconMatrix[currIconName];
            if (matrixEntry) {
                self.icon = matrixEntry + self.iconExtension;
            }
        }
    },

    setIcon: function (icon) {
        var self = this;

        if (icon) {
            self.icon = icon;
        }

        if (self.icon) {
            self.convertIconNames();

            if (self._icons[self.icon] === undefined) {
                fabric.Image.fromURL(gpl.iconPath + self.icon, function (img) {
                    var width = img.width,
                        height = img.height,
                        left = self.left + (self.width - width) / 2 + self.iconOffsetLeft,
                        top = self.top + (self.height - height) / 2 + self.iconOffsetTop;

                    img.set({
                        left: left,
                        top: top,
                        evented: false,
                        selectable: !!gpl.isEdit
                    });

                    if (self.iconScale) {
                        img.scale(self.iconScale);
                    }

                    img._originalLeft = left;
                    img._originalTop = top;
                    img._shapeOffsetLeft = img.left - self.left;
                    img._shapeOffsetTop = img.top - self.top;
                    img.gplId = self.gplId;

                    img.gplType = 'backgroundimage';

                    if (self.backgroundImage) {
                        self.backgroundImage.setVisible(false);
                    }

                    self.backgroundImage = img;
                    self._icons[self.icon] = img;

                    self.add(img, true);
                    self.renderAll();
                });
            } else {
                if (self.backgroundImage) {
                    self.backgroundImage.setVisible(false);
                }
                self.backgroundImage = self._icons[self.icon];
                self.backgroundImage.setVisible(true);
                self.renderAll();
            }
        } else {
            gpl.log('no icon for', self.config.iconType);
        }
    },

    setLabel: function (label) {
        if (label) {
            this.label = label;
        }

        this.labelText.setText(label);
        this.renderAll();
    },

    showShapes: function () {
        var c,
            shape;

        for (c = 0; c < this._shapes.length; c++) {
            shape = this._shapes[c];
            // shape.evented = true;
            if (!shape.readOnly) {
                shape.selectable = true;
            }
            if (shape._wasHidden !== true) {
                shape.opacity = 1;
                shape.visible = true;
            } else {
                shape.opacity = 0;
                shape.visible = false;
            }
            shape._originalTop = shape.top;
            shape._originalLeft = shape.left;
            // shape.evented = true;
            shape.setCoords();
        }

        if (this.config.inactive) {
            //set label if drop from toolbar
            this.getLabel();
        }
    },

    removeShapes: function () {
        var shapes = this._shapes,
            c,
            len = shapes.length;

        for (c = 0; c < len; c++) {
            gpl.blockManager.remove(shapes[c]);
        }
    }
});

gpl.Block.fromObject = function (object) {
    return new gpl.Block(object);
};

gpl.blocks.MonitorBlock = fabric.util.createClass(gpl.Block, {
    height: 20,
    width: 20,
    toolbarHeight: 30,
    toolbarOffsetTop: 9,
    toolbarOffsetLeft: 5,
    proxyOffsetLeft: -5,
    hasShutdownBlock: false,
    noIcon: true,
    numInputs: 0,
    isNonPoint: true,
    hasReferenceType: true,

    type: 'MonitorBlock',
    pointType: 'Monitor Point',

    shapes: {
        'External': {
            cls: fabric.ExternalMonitorPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        },
        'Internal': {
            cls: fabric.InternalMonitorPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);

        this.getReferencePoint();
    },

    syncAnchorPoints: gpl.emptyFn,

    postInit: function () {
        this.callSuper('postInit');

        if (this.referenceType === 1) { //internal
            this.referenceType = 'Internal';
        } else {
            this.referenceType = 'External';
        }
        this.setReferenceType(this.referenceType);
    }
});

gpl.blocks.ConstantBlock = fabric.util.createClass(gpl.Block, {
    height: 20,
    width: 20,
    toolbarHeight: 30,
    toolbarOffsetTop: 9,
    toolbarOffsetLeft: 5,
    proxyOffsetLeft: -5,
    hasShutdownBlock: false,
    noIcon: true,
    numInputs: 0,
    isNonPoint: true,

    type: 'ConstantBlock',
    pointType: 'Constant',

    shapes: {
        'ConstantPointShape': {
            cls: fabric.ConstantPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        }
    },

    syncAnchorPoints: gpl.emptyFn,

    postInit: function () {
        if (this.value !== undefined) {
            this.valueText.setText(gpl.formatValue(this, this.value.toString()));
        }

        this.callSuper('postInit');
    },

    setValue: function (val) {
        var lines,
            anchor,
            block,
            c,
            len;

        this.value = val;
        this.valueText.setText(gpl.formatValue(this, val));

        lines = this.outputAnchor.getLines();
        len = lines.length;

        for (c = 0; c < len; c++) {
            anchor = lines[c].getOtherAnchor(this.outputAnchor);
            block = gpl.blockManager.getBlock(anchor.gplId);
            block.syncAnchorValue(anchor, val);
        }

        this.renderAll();
    }
});

gpl.blocks.ControlBlock = fabric.util.createClass(gpl.Block, {
    height: 20,
    width: 20,
    toolbarHeight: 30,
    toolbarOffsetTop: 9,
    toolbarOffsetLeft: 5,
    proxyOffsetLeft: -5,
    hasShutdownBlock: false,
    valueAnchor: 'input',
    noIcon: true,
    isNonPoint: true,
    hasReferenceType: true,

    numInputs: 1,
    hasOutput: false,

    type: 'ControlBlock',
    pointType: 'Control Point',

    shapes: {
        'External': {
            cls: fabric.ExternalControlPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        },
        'Internal': {
            cls: fabric.InternalControlPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        }
    },

    syncAnchorPoints: gpl.emptyFn,

    initialize: function (config) {
        this.callSuper('initialize', config);

        this.getReferencePoint();
    },

    postInit: function () {
        this.callSuper('postInit');

        if (this.referenceType === 1) { //internal
            this.referenceType = 'Internal';
        } else {
            this.referenceType = 'External';
        }
        this.setReferenceType(this.referenceType);
    }
});

gpl.blocks.SPA = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'SPA',
    pointType: 'Setpoint Adjust',
    valueType: 'float',

    _icon: 'SPA.png',
    icon: 'SPA.png',
    iconOffsetLeft: 0,
    iconOffsetTop: 0,

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#149e93',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    },

    postInit: function () {
        this.setIconName();
        this.callSuper('postInit');
    },

    setIconName: function () {
        var data = this._pointData,
            reverseActing,
            icon;

        if (data) {
            reverseActing = data['Reverse Action'].Value;
            icon = this._icon.split('.');

            if (reverseActing) {
                icon = icon[0] + 'Rev' + '.' + icon[1];
            } else {
                icon = icon.join('.');
            }

            this.icon = icon;
            this.setIcon();
        }
    }
});

gpl.blocks.Delay = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'Delay',
    pointType: 'Delay',
    valueType: 'enum',

    iconScale: 0.9,
    iconOffsetLeft: 2,

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true,
        inputType: 'enum'
    }, {
        anchorType: 'Trigger Point',
        required: true,
        inputType: 'enum',
        takesConstant: true,
        constantProp: 'Trigger Constant'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#9676c6',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.BinarySetPoint = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    icons: {
        'Single Setpoint': 'BINMSingleSP',
        'Dual Setpoint': 'BINMDualSP'
    },

    type: 'BinarySetPoint',
    pointType: 'Binary Selector',
    valueType: 'enum',

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true
    }, {
        anchorType: 'Setpoint Input',
        required: true,
        takesConstant: true,
        constantProp: 'Setpoint Value'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#fffcb8',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    },

    setIconName: function () {
        var data = this._pointData,
            calcType,
            icon;

        if (data) {
            calcType = data['Calculation Type'].Value;

            icon = this.icons[calcType];

            this.icon = icon + this.iconExtension;
            this.setIcon();
        }
    }
});

gpl.blocks.AnalogSetPoint = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    icons: {
        'Single Setpoint': 'AnalogSingleSetPoint',
        'Dual Setpoint': 'AnalogDualSetPoint'
    },

    type: 'AnalogSetPoint',
    pointType: 'Analog Selector',
    valueType: 'float',

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true
    }, {
        anchorType: 'Setpoint Input',
        required: true,
        takesConstant: true,
        constantProp: 'Setpoint Value'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#fffcb8',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    },

    setIconName: function () {
        var data = this._pointData,
            calcType,
            icon;

        if (data) {
            calcType = data['Calculation Type'].Value;

            icon = this.icons[calcType];

            this.icon = icon + this.iconExtension;
            this.setIcon();
        }
    }
});

gpl.blocks.PI = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'PI',
    pointType: 'Proportional',
    valueType: 'float',

    _icon: 'PI',
    icon: 'PI.png',
    iconOffsetTop: 0,
    iconOffsetLeft: 1,

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true
    }, {
        anchorType: 'Setpoint Input',
        required: true,
        takesConstant: true,
        constantProp: 'Setpoint Value'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#2f2fb4',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        if (config.iconType === 'ReverseActingPI') {
            config.iconType = 'PI'; //will be set on point process
        }
        this.callSuper('initialize', config);
    },

    setIconName: function () {
        var data = this._pointData,
            reverseActing = data['Reverse Action'].Value,
            icon = data['Calculation Type'].Value;
        // icon = this._icon;

        if (reverseActing) {
            icon += 'Rev' + this.iconExtension;
        } else {
            icon += this.iconExtension;
        }

        this.icon = icon;
        this.setIcon();
    }
});

gpl.blocks.Average = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 100,
    toolbarHeight: 30,
    toolbarOffsetTop: -30,
    numInputs: 5,

    type: 'Average',
    pointType: 'Average',
    valueType: 'float',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#7FD8C8',
                stroke: 'black',
                width: 30,
                height: 100
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Economizer = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 60,
    toolbarHeight: 30,
    toolbarOffsetTop: -10,

    type: 'Economizer',
    pointType: 'Economizer',
    valueType: 'float',

    leftAnchors: [{
        anchorType: 'Return Air Point',
        required: true
    }, {
        anchorType: 'Mixed Air Point',
        required: true
    }, {
        anchorType: 'Outside Air Point',
        required: true
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#0075a2',
                stroke: 'black',
                width: 30,
                height: 60
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Enthalpy = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'Enthalpy',
    pointType: 'Enthalpy',
    valueType: 'float',

    leftAnchors: [{
        anchorType: 'Humidity Point',
        required: true
    }, {
        anchorType: 'Dry Bulb Point',
        required: true
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#87A68A',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.SelectValue = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 100,
    toolbarHeight: 30,
    toolbarOffsetTop: -30,
    numInputs: 5,

    type: 'SelectValue',
    pointType: 'Select Value',
    valueType: 'float',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#f3e35f',
                stroke: 'black',
                width: 30,
                height: 100
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Logic = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 100,
    toolbarHeight: 30,
    toolbarOffsetTop: -30,
    numInputs: 5,

    type: 'Logic',
    pointType: 'Logic',
    valueType: 'enum',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#bbec08',
                stroke: 'black',
                width: 30,
                height: 100
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Math = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'Math',
    pointType: 'Math',
    valueType: 'float',

    leftAnchors: [{
        anchorType: 'Input Point 1',
        required: true,
        takesConstant: true,
        constantProp: 'Input 1 Constant'
    }, {
        anchorType: 'Input Point 2',
        required: true,
        takesConstant: true,
        constantProp: 'Input 2 Constant'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#ded5bc',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.MUX = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 60,
    toolbarHeight: 60,
    toolbarOffsetTop: 5,

    type: 'MUX',
    pointType: 'Multiplexer',
    valueType: 'float',

    icon: 'MUX_0.png',
    iconOffsetLeft: 0,
    iconOffsetTop: 2,

    leftAnchors: [{
        anchorType: 'Input Point 1',
        required: true,
        takesConstant: true,
        constantProp: 'Input 1 Constant'
    }, {
        anchorType: 'Input Point 2',
        required: true,
        takesConstant: true,
        constantProp: 'Input 2 Constant'
    }, {
        anchorType: 'Select Input',
        required: true,
        inputType: 'enum'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#d1800b',
                stroke: 'black',
                width: 30,
                height: 60
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    },

    processValue: function (upi, anchor, line, dyn) {
        var val = dyn.eValue;

        // if(upi === this.selectUPI) {
        if (anchor === this.inputAnchors[2]) {
            // gpl.log('setting icon', 'MUX_' + val + '.png');
            this.setIcon('MUX_' + val + '.png');
        }
        //if(this.currValue === this.)
    }
});

gpl.blocks.DigLogic = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'DigLogic',
    pointType: 'Digital Logic',
    valueType: 'enum',

    iconPrefix: 'DigLogic',

    iconScale: 0.80,
    iconOffsetLeft: 3,
    iconOffsetTop: 3,

    leftAnchors: [{
        anchorType: 'Input Point 1',
        required: true,
        inputType: 'enum'
    }, {
        anchorType: 'Input Point 2',
        required: true,
        inputType: 'enum'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#768557',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Ramp = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'Ramp',
    pointType: 'Ramp',
    valueType: 'float',

    iconOffsetTop: 0,
    iconOffsetLeft: 1,

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#a47b42',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.AlarmStatus = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,
    numInputs: 1,
    toolbarHeight: 30,

    type: 'AlarmStatus',
    pointType: 'Alarm Status',
    valueType: 'enum',

    iconPrefix: 'AlarmStatus_',
    iconScale: 0.80,
    iconOffsetLeft: 3,
    iconOffsetTop: 3,

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#B81616',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.setAlarmIcon('1111');
        this.callSuper('initialize', config);
    },

    postInit: function () {
        this.setIconName();
        this.callSuper('postInit');
    },

    setAlarmIcon: function (total) {
        this.icon = this.iconPrefix + total + this.iconExtension;
    },

    setIconName: function () {
        var data = this.getPointData(),
            matrix,
            vals = {
                inAlarm: '1',
                inFault: '1',
                inOutOfService: '1',
                inOverride: '1'
            },
            total = '';

        if (data) {
            matrix = {
                inAlarm: data['In Alarm'].Value,
                inFault: data['In Fault'].Value,
                inOutOfService: data['In Out of Service'].Value,
                inOverride: data['In Override'].Value
            };

            gpl.forEach(matrix, function (val, type) {
                if (val) {
                    total += vals[type];
                } else {
                    total += '0';
                }
            });
        } else {
            total = '1111';
        }

        this.setAlarmIcon(total);

        this.setIcon();
    }
});

gpl.blocks.Comparator = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'Comparator',
    pointType: 'Comparator',
    valueType: 'enum',

    iconMatrix: {
        '<': 'LT',
        '>': 'GT',
        '<=': 'LTEqual',
        '>=': 'GTEqual',
        '=': 'Equal'
    },

    leftAnchors: [{
        anchorType: 'Input Point 1',
        required: true
    }, {
        anchorType: 'Input Point 2',
        required: true,
        takesConstant: true,
        constantProp: 'Input 2 Constant'
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#DED5BC',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Totalizer = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'Totalizer',
    pointType: 'Totalizer',
    valueType: 'float',

    iconOffsetTop: 2,
    iconOffsetLeft: 1,
    iconScale: 0.9,

    leftAnchors: [{
        anchorType: 'Monitor Point',
        required: true
    }],

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#d4fbeb',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function (config) {
        this.callSuper('initialize', config);
    }
});

// gpl.blocks.TextBlock = fabric.Textbox;

fabric.Textbox = gpl.blocks.TextBlock = fabric.util.createClass(fabric.Text, fabric.Observable, {
    isNonPoint: true,
    defaultWeight: 'normal',
    defaultFill: '#000000',
    borderColor: '#000000',
    cornerColor: '#000000',
    defaultFontSize: 12,
    minWidth: 30,
    cornerSize: 6,
    hasRotatingPoint: false,

    type: 'TextBlock',
    gplType: 'text',

    initialize: function (config) {
        this.convertConfig(config);

        this.callSuper('initialize', this.text, this.config);

        this.set('lockUniScaling', false);
        this.set('lockScalingY', true);
        // this.set('hasBorders', config.hasBorders);
        this.setControlsVisibility({
            tl: false,
            tr: false,
            br: false,
            bl: false,
            ml: true,
            mt: false,
            mr: true,
            mb: false,
            mtr: false
        });

        this.gplId = gpl.makeId();
        gpl.texts[this.gplId] = this;
        gpl.blockManager.registerBlock(this);
    },

    convertConfig: function (config) {
        var cfg = config,
            fontConfig = cfg.font,
            alignments = {
                1: 'right',
                0: 'left'
            };

        this.config = config;

        if (fontConfig) {
            cfg.fontWeight = fontConfig.bold ? 'bold' : 'normal';
            cfg.fill = '#' + gpl.convertColor(fontConfig.color || 0);
            cfg.fontSize = parseInt(fontConfig.size, 10) || this.defaultFontSize;
            cfg.textDecoration = fontConfig.underline ? 'underline' : '';
            cfg.fontFamily = fontConfig.name || 'Arial';
        } else {
            if (config._v2 !== true) {
                cfg.fontWeight = this.defaultWeight;
                cfg.fill = this.defaultFill;
                cfg.fontSize = this.defaultFontSize;
            }
        }

        // cfg.lockUniScaling = true;
        cfg.originX = 'left';
        cfg.originY = 'top';

        if (cfg.Font && cfg.Font.Underline === 'true') {
            cfg.textDecoration = 'underline';
        }

        if (!cfg._v2) {
            this.config.left += 10;
            this.config.top += 5;
        }

        this.config.selectable = !!gpl.isEdit;

        this.config.width = parseInt(this.config.width, 10) || this.minWidth;
        this.config.height = null; //parseInt(this.config.height, 10);

        this.config.textAlign = alignments[cfg.alignment] || 'center';

        $.extend(this, this.config);

        this.text = this.config.label || 'ABC';
    },

    setActive: function () {
        this.inactive = false;
        this.setCoords();
    },

    delete: function () {
        gpl.manager.canvas.remove(this);
        delete gpl.texts[this.gplId];
    },

    _wrapText: function (ctx, text) {
        var lines = text.split(this._reNewline),
            wrapped = [],
            i;

        for (i = 0; i < lines.length; i++) {
            wrapped = wrapped.concat(this._wrapLine(ctx, lines[i] + '\n'));
        }

        return wrapped;
    },
    /**
     * Wraps a line of text using the width of the Textbox and a context.
     * @param {CanvasRenderingContext2D} ctx Context to use for measurements
     * @param {String} text The string of text to split into lines
     * @returns {Array} Array of line(s) into which the given text is wrapped
     * to.
     */
    _wrapLine: function (ctx, text) {
        var maxWidth = this.width,
            words = text.split(' '),
            lines = [],
            line = "",
            tmp;

        if (ctx.measureText(text).width < maxWidth) {
            lines.push(text);
        } else {
            while (words.length > 0) {
                /*
                 * If the textbox's width is less than the widest letter.
                 * fontSize changes.
                 */
                if (maxWidth <= ctx.measureText('W').width) {
                    return text.split('');
                }

                /*
                 * This handles a word that is longer than the width of the
                 * text area.
                 */
                while (Math.ceil(ctx.measureText(words[0]).width) >= maxWidth) {
                    tmp = words[0];
                    words[0] = tmp.slice(0, -1);
                    if (words.length > 1) {
                        words[1] = tmp.slice(-1) + words[1];
                    } else {
                        words.push(tmp.slice(-1));
                    }
                }

                if (Math.ceil(ctx.measureText(line + words[0]).width) < maxWidth) {
                    line += words.shift() + " ";
                } else {
                    lines.push(line);
                    line = "";
                }
                if (words.length === 0) {
                    lines.push(line.substring(0, line.length - 1));
                }
            }
        }

        return lines;
    },
    /**
     * Gets lines of text to render in the Textbox. This function calculates
     * text wrapping on the fly everytime it is called.
     * @param {CanvasRenderingContext2D} ctx The context to use for measurements
     * @returns {Array} Array of lines in the Textbox.
     */
    _getTextLines: function (ctx) {
        var l;

        ctx = (ctx || this.ctx);

        ctx.save();
        this._setTextStyles(ctx);

        l = this._wrapText(ctx, this.text);

        ctx.restore();

        return l;
    },
    /**
     * Overrides the superclass version of this function. The only change is
     * that this function does not change the width of the Textbox. That is
     * done manually by the user.
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderViaNative: function (ctx) {
        var textLines;

        this._setTextStyles(ctx);

        textLines = this._wrapText(ctx, this.text);

        this.height = this._getTextHeight(ctx, textLines);

        if (this.clipTo) {
            fabric.util.clipContext(this, ctx);
        }

        this._renderTextBackground(ctx, textLines);
        this._translateForTextAlign(ctx);
        this._renderText(ctx, textLines);

        if (this.textAlign !== 'left' && this.textAlign !== 'justify') {
            ctx.restore();
        }

        this._renderTextDecoration(ctx, textLines);
        if (this.clipTo) {
            ctx.restore();
        }

        this._setBoundaries(ctx, textLines);
        this._totalLineHeight = 0;
    }
});

/**
 * Returns fabric.Textbox instance from an object representation
 * @static
 * @memberOf fabric.Textbox
 * @param {Object} object Object to create an instance from
 * @return {fabric.Textbox} instance of fabric.Textbox
 */
fabric.Textbox.fromObject = function (object) {
    return new fabric.Textbox(object.text, fabric.util.object.clone(object));
};

/**
 * Contains all fabric.Textbox objects that have been created
 * @static
 * @memberof fabric.Textbox
 * @type Array
 */
fabric.Textbox.instances = [];
fabric.Textbox.__setObjectScaleOverridden = fabric.Canvas.prototype._setObjectScale;

/**
 * Override _setObjectScale and add Textbox specific resizing behavior. Resizing
 * a Textbox doesn't scale text, it only changes width and makes text wrap automatically.
 */
fabric.Canvas.prototype._setObjectScale = function (localMouse, transform, lockScalingX, lockScalingY, by, lockScalingFlip) {

    var t = transform.target,
        setObjectScaleOverridden = fabric.Textbox.__setObjectScaleOverridden,
        w;

    if (t.type === 'TextBlock') {
        w = t.width * ((localMouse.x / transform.scaleX) / (t.width + t.strokeWidth));
        if (w >= t.minWidth) {
            t.set('width', w);
        }
    } else {
        setObjectScaleOverridden.call(fabric.Canvas.prototype, localMouse, transform, lockScalingX, lockScalingY, by, lockScalingFlip);
    }
};

fabric.util.object.extend(fabric.Textbox.prototype, /** @lends fabric.Textbox.prototype */ {
    /**
     * Overrides superclass function and adjusts cursor offset value because
     * lines do not necessarily end with a newline in Textbox.
     * @param {Event} e
     * @param {Boolean} isRight
     * @returns {Number}
     */
    getDownCursorOffset: function (e, isRight) {
        return this.callSuper('getDownCursorOffset', e, isRight) - 1;
    },
    /**
     * Overrides superclass function and adjusts cursor offset value because
     * lines do not necessarily end with a newline in Textbox.
     * @param {Event} e
     * @param {Boolean} isRight
     * @returns {Number}
     */
    getUpCursorOffset: function (e, isRight) {
        return this.callSuper('getUpCursorOffset', e, isRight) - 1;
    }
});

/* ------------- Misc Classes ------------ */

gpl.ActionButton = function (config) {
    var codes = [{
            text: 'No Action (useless)'
        }, {
            text: 'History Log Plot – No longer supported'
        }, {
            text: 'History Log Report'
        }, {
            text: 'History Log Export'
        }, {
            text: 'Totalizer Plot'
        }, {
            text: 'Totalizer Report'
        }, {
            text: 'Totalizer Export'
        }, {
            text: 'MultiState Value Command',
            pointType: 'MultiState Value'
        }, {
            text: 'Program Start'
        }, {
            text: 'Analog Output Command',
            pointType: 'Analog Output'
        }, {
            text: 'Analog Value Command',
            pointType: 'Analog Value'
        }, {
            text: 'Binary Output Command',
            pointType: 'Binary Output'
        }, {
            text: 'Binary Value Command',
            pointType: 'Binary Value'
        }, {
            text: 'Report Display'
        }, {
            text: 'Verification Report'
        }, {
            text: 'Browse Verify Reports'
        }, {
            text: 'Data Report'
        }],
        actions = {
            'MultiState Value': {},
            'Analog Output': {},
            'Analog Value': {},
            'Binary Output': {},
            'Binary Value': {}
        },
        parameters = [{
            text: 'None'
        }, {
            text: 'This Hour'
        }, {
            text: 'Last Hour'
        }, {
            text: 'Today'
        }, {
            text: 'Yesterday'
        }, {
            text: 'This Week'
        }, {
            text: 'Last Week'
        }, {
            text: 'This Month'
        }, {
            text: 'Last Month'
        }, {
            text: 'This Year'
        }, {
            text: 'Last Year'
        }, {
            text: 'Select Time'
        }, {
            text: 'Last 24 Hours'
        }, {
            text: 'Last 7 Days'
        }, {
            text: 'Select Interval'
        }, {
            text: 'Display'
        }, {
            text: 'Print'
        }],

        _commandArguments = {
            'Command Type': 7,
            upi: '',
            Value: '',
            Controller      : gpl.workspaceManager.user().controllerId,
            Relinquish: 0,
            Priority: '',
            Wait: 0,
            OvrTime: 0
        },

        _local = {},

        $el,
        x = config.left,
        y = config.top,
        height = config.Height,
        width = config.Width,
        type = config.type || ((config.actionCode !== undefined) ? 'control' : 'link'),

        _addButton = function () {
            $el = $('<button data-actionButtonID="' + _local.id + '" class="hideLoading btn btn-sm btn-default actionBtn">' + _local.text + '</button>')
                .data({
                    'origLeft': x,
                    'origTop': y
                })
                .css({
                    position: 'absolute',
                    left: x,
                    top: y
                });

            _local.$el = $el;
        },

        _getCommandArguments = function () {
            var ret = $.extend(true, {}, _commandArguments);

            ret.upi = _local.upi;
            ret.Value = _local.parameter;
            ret.newValue.Value = _local.parameter;

            return ret;
        },
        _processPointData = function (response) {
            _local.pointData = response;
            _local.pointName = _local.pointData.Name;
            _local.pointType = response['Point Type'].Value;

            _commandArguments.logData = {
                user: gpl.workspaceManager.user(),
                point: {
                    _id: response._id,
                    Security: response.Security,
                    Name: response.Name,
                    name1: response.name1,
                    name2: response.name2,
                    name3: response.name3,
                    name4: response.name4,
                    "Point Type": {
                        eValue: response["Point Type"].eValue
                    }
                },
                newValue: {
                    Value: ''
                }
            };

            _validateOptions('upi');
        },
        _getPointData = function (upi) {
            if (upi !== undefined) {
                $.ajax({
                    url: '/api/points/' + upi
                }).done(function (response) {
                    _processPointData(response);
                });
            }
        },
        _validateOptions = function (arg) {
            var pointType = _local.code && _local.code.pointType;

            if (pointType && pointType !== _local.pointData['Point Type']) {
                //invalid point type/code combo
                //update UI, if 'upi', else 'command'
            }
        },

        _sendCommand = function () {
            console.log('Send Command', _getCommandArguments());
            gpl.socket.emit('fieldCommand', JSON.stringify(_getCommandArguments()));
        },
        sendCommand = function () {
            if (_local.pointType.match('Analog')) {
                $('#actionButtonValue').attr({
                    min: _local.pointData['Minimum Value'].Value,
                    max: _local.pointData['Maximum Value'].Value
                });
                gpl.$editActionButtonValueModal.modal('show');
            } else {
                _sendCommand();
            }
        },
        sendValue = function (value) {
            _local.parameter = value;
            _sendCommand();
        },
        openWindow = function (queryString, cb) {
            var pointType = _local.pointType,
                endPoint,
                url;

            endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, _local.upi);

            url = endPoint.review.url;

            if (queryString) {
                url += queryString;
            }

            gpl.openWindow(url, _local.pointData.Name, pointType, '', _local.upi, {
                callback: cb
            });
        },
        click = function () {
            if (_local.type === 'control') {
                sendCommand();
            } else {
                if (_local.pointData && _local.pointData.message !== 'No Point Found') {
                    if (_local.type === 'report') {
                        gpl.$actionButtonReportParameterModal.modal('show');
                    } else {
                        openWindow();
                    }
                }
            }
        },
        openReport = function (config) {
            var reportType = config.reportType,
                duration = config.duration,
                fromDate = config.fromDate,
                fromTime = config.fromTime,
                toDate = config.toDate,
                toTime = config.toTime,
                hr,
                min,
                reportConfig,
                startDate,
                endDate;

            if (reportType === 'predefined') {
                reportConfig = {
                    duration: duration
                };
            } else {
                startDate = fromDate;
                endDate = toDate;
                hr = fromTime.split(':');
                min = hr[1];
                hr = hr[0];
                startDate.setHours(hr);
                startDate.setMinutes(min);
                hr = toTime.split(':');
                min = hr[1];
                hr = hr[0];
                endDate.setHours(hr);
                endDate.setMinutes(min);
                reportConfig = {
                    startDate: Math.floor(startDate.getTime() / 1000),
                    endDate: Math.floor(endDate.getTime() / 1000)
                };
            }

            openWindow('?pause', function () {
                this.applyBindings(reportConfig);
            });

            gpl.$actionButtonReportParameterModal.modal('hide');
        },
        setCommand = function (idx) {
            _local.code = codes[idx];
            _validateOptions('command');
        },
        setParameter = function (parameter) {
            _local.parameter = parameter;
        },
        getPointData = function () {
            return _local.pointData;
        },
        getExportData = function () {
            var offset = gpl.isEdit?gpl.editModeOffset:0,
                ret = {
                    left: _local.left - offset,
                    top: _local.top,
                    caption: _local.text,
                    type: _local.type,
                    actionCode: _local.code,
                    actionParm: _local.parameter,
                    actionPoint: _local.upi,
                    actionPriority: 16
                };

            return ret;
        },
        updateConfig = function (newCfg) {
            _local.type = newCfg.type || _local.type;
            _local.code = newCfg.actionCode || _local.code;

            if (newCfg.caption && newCfg.caption !== _local.text) {
                _local.text = newCfg.caption;

                if ($el) {
                    $el.html(_local.text);
                }
            }

            _local.parameter = newCfg.actionParm !== undefined ? newCfg.actionParm : _local.parameter;

            if (newCfg.actionPoint && _local.upi !== newCfg.actionPoint) {
                // gpl.log('getting point data for', newCfg.actionPoint);
                _getPointData(newCfg.actionPoint);
            }

            _local.pointName = newCfg.pointName;

            _local.upi = newCfg.actionPoint || _local.upi;
            _commandArguments.Priority = newCfg.actionPriority || _commandArguments.Priority;
        },
        postInit = function () {
            if (gpl.isEdit) {
                _local.$el.draggable({
                    cancel: false,
                    stop: function (event, ui) {
                        gpl.log('updating position to', ui.position.left, ',', ui.position.top);
                        _local.left = ui.position.left;
                        _local.top = ui.position.top;
                    }
                });
            }
        },
        destroy = function () {
            gpl.destroyObject(_local);
        },


        setUPI = function (upi) {
            _local.upi = upi;
            _getPointData(upi);
        };

    _local.id = gpl.makeId();
    _local.text = config.caption || 'Action Button';

    updateConfig(config);

    _addButton();

    _local = $.extend(_local, {
        left: x,
        top: y,
        type: type,
        setUPI: setUPI,
        setCommand: setCommand,
        setParameter: setParameter,
        getPointData: getPointData,
        getExportData: getExportData,
        updateConfig: updateConfig,
        postInit: postInit,
        destroy: destroy,
        click: click,
        sendCommand: sendCommand,
        sendValue: sendValue,
        openReport: openReport
    });

    return _local;
};

gpl.SchematicLine = function (ox, oy, otarget, manager, isVertical) {
    var slSelf = this,
        VALIDCOLOR = 'green',
        canvas = manager.canvas,
        segments = [],
        coords = [{
            x: ox,
            y: oy
        }],
        block = gpl.blockManager.getBlock(otarget.gplId),
        startAnchor = otarget,
        spaceSegment,
        target,
        solidLine,
        dashedLine,
        horiz = isVertical ? false : true,
        prevX = ox,
        prevY = oy,
        lineDefaults = {
            stroke: '#000000',
            selectable: false
        },
        dashedDefaults = {
            stroke: 'grey'
        },
        eventHandlerList,
        forEachLine = function (fn) {
            var cc;

            for (cc = 0; cc < segments.length; cc++) {
                fn(segments[cc]);
            }
            fn(solidLine);
            fn(dashedLine);
        },
        forEachCanvasObject = function (fn) {
            var c,
                objects = canvas.getObjects(),
                len = objects.length;

            for (c = 0; c < len; c++) {
                fn(objects[c]);
            }
        },
        disableNonAnchors = function () {
            forEachCanvasObject(function (obj) {
                if (obj.gplType !== 'anchor') {
                    obj._prevSelectable = obj.selectable;
                    obj.selectable = false;
                }
            });
        },
        enableNonAnchors = function () {
            forEachCanvasObject(function (obj) {
                if (obj.gplType !== 'anchor') {
                    obj.selectable = obj._prevSelectable;
                }
            });
        };

    block.lock(true);

    slSelf.setColor = function (color) {
        forEachLine(function (line) {
            line.setStroke(color || '#000000');
        });
    };

    slSelf.getCoords = function () {
        return coords;
    };

    slSelf.completeLine = function (target) {
        var newCoords,
            event;

        if (target) {
            event = {
                x: target.left + target.width / 2,
                y: target.top + target.height / 2
            };
            slSelf.handleMouseMove(event);
        }

        target.clearHover();
        slSelf.addSegment(solidLine, true);
        solidLine.off();
        canvas.remove(solidLine);
        solidLine = new fabric.Line([dashedLine.x1, dashedLine.y1, dashedLine.x2, dashedLine.y2], $.extend({}, lineDefaults));
        slSelf.addSegment(solidLine, true);
        dashedLine.off();
        canvas.remove(dashedLine);
        target.set('fill', target._oFill);
        target.set('stroke', target._oStroke);
        slSelf.detachEvents();
        newCoords = $.extend(true, [], coords);
        // gpl.log('creating new line', newCoords);
        manager.shapes.push(new gpl.ConnectionLine($.extend(true, [], newCoords), canvas, true));
        slSelf.clearSegments();
        gpl.manager.renderAll();
    };

    slSelf.clearSegments = function () {
        while (segments.length > 0) {
            slSelf.removeSegment(true);
        }
        block.lock(false);
        gpl.manager.renderAll();
    };

    slSelf.delete = function () {
        solidLine.off();
        dashedLine.off();
        canvas.remove(solidLine);
        canvas.remove(dashedLine);
        slSelf.detachEvents();
        slSelf.clearSegments();
        gpl.manager.renderAll();
    };

    slSelf.syncLines = function () {
        var newCorner,
            lastCoords = coords.slice(-1)[0];

        if (horiz) {
            newCorner = {
                x: dashedLine.x1,
                y: solidLine.y1
            };
        } else {
            newCorner = {
                x: solidLine.x1,
                y: dashedLine.y2
            };
        }

        solidLine.set({
            x1: lastCoords.x,
            y1: lastCoords.y,
            x2: newCorner.x,
            y2: newCorner.y
        });

        dashedLine.set({
            x1: newCorner.x,
            y1: newCorner.y
        });

        gpl.manager.renderAll();
    };

    slSelf.removeSegment = function (bypass) {
        var segment;

        if (segments.length > 0) {
            coords.pop();
            segment = segments.pop();
            segment.off();
            canvas.remove(segment);
        }

        horiz = !horiz;

        if (!bypass) {
            slSelf.syncLines();
        }

        return segment;
    };

    slSelf.addSegment = function (segment, skipSync) {
        segments.push(segment);
        coords.push({
            x: segment.x2,
            y: segment.y2
        });
        canvas.add(segment);
        horiz = !horiz;
        if (!skipSync) {
            slSelf.syncLines();
        }
    };

    slSelf.swapDirections = function () {
        if (!spaceSegment) {
            spaceSegment = slSelf.removeSegment();
        } else {
            slSelf.addSegment(spaceSegment);
        }
    };

    slSelf.handleMouseMove = function (event) {
        var pointer = event.e ? canvas.getPointer(event.e) : event,
            x = pointer.x, // - pointer.x % gpl.gridSize,
            y = pointer.y, // - pointer.y % gpl.gridSize,
            moveTarget = gpl.manager.getObject({
                left: x,
                top: y,
                gplType: 'anchor'
            });

        if (manager.isEditingLine) {
            if (moveTarget) {
                slSelf.valid = gpl.validate.connection(startAnchor, moveTarget, true);
                if (slSelf.valid && moveTarget !== startAnchor) {
                    moveTarget.hover();
                    slSelf.setColor(VALIDCOLOR);
                    target = moveTarget;
                }
            } else {
                if (target) {
                    target.clearHover();
                    slSelf.setColor();
                }
            }

            if (horiz) {
                solidLine.set({
                    x2: x
                });
                dashedLine.set({
                    x1: x,
                    y2: y,
                    x2: x,
                    y1: prevY
                });
            } else {
                solidLine.set({
                    y2: y
                });
                dashedLine.set({
                    x1: prevX,
                    y2: y,
                    x2: x,
                    y1: y
                });
            }
            gpl.manager.renderAll();
        }
    };

    slSelf.handleMouseUp = function (event) {
        slSelf.mouseDown = false;
        if (event.e.which === 3) {
            slSelf.delete();
        }
    };

    slSelf.handleMouseDown = function (event) {
        var pointer = canvas.getPointer(event.e),
            px = pointer.x,
            py = pointer.y,
            x = solidLine.x2,
            y = solidLine.y2,
            clickTarget = gpl.manager.getObject({
                left: px,
                top: py,
                gplType: 'anchor'
            });

        if (manager.isEditingLine) {
            if (clickTarget && slSelf.valid) { // && clickTarget.anchorType === endType) {
                slSelf.completeLine(clickTarget);
            } else {
                prevX = x;
                prevY = y;

                coords.push({
                    x: x,
                    y: y
                });

                segments.push(solidLine);

                solidLine = new fabric.Line([x, y, x, y], $.extend({}, lineDefaults));
                dashedLine.set({
                    x1: x,
                    y1: y,
                    x2: px,
                    y2: py
                });

                horiz = !horiz;

                canvas.add(solidLine);
                gpl.manager.renderAll();
            }
        }
    };

    slSelf.handleEnterKey = function () {
        slSelf.completeLine();
    };

    slSelf.handleSpacebar = function (event) {
        slSelf.swapDirections();
    };

    slSelf.handleBackspace = function (event) {
        slSelf.removeSegment();
    };

    slSelf.handleKeyUp = function (event) {
        if (event.which === gpl.ESCAPEKEY) {
            slSelf.delete();
        }
    };

    // slSelf.handleKeyPress = function(event) {
    //     // if(event.which === 13) {
    //     //     handleEnterKey();
    //     // }
    //     // if(event.which === 32) {
    //     //     slSelf.handleSpacebar(event);
    //     // }

    //     // if(event.which === 46) {//46 delete, 8 backspace
    //     //     event.preventDefault();
    //     //     handleBackspace(event);
    //     //     return false;
    //     // }
    // };

    eventHandlerList = [{
        event: 'keyup',
        handler: slSelf.handleKeyUp,
        type: 'DOM'
    }, {
        event: 'mouse:move',
        handler: slSelf.handleMouseMove
    }, {
        event: 'mouse:up',
        handler: slSelf.handleMouseUp
    }, {
        event: 'mouse:down',
        handler: slSelf.handleMouseDown
    }];

    slSelf.detachEvents = function () {
        canvas.defaultCursor = slSelf.oldCursor;
        enableNonAnchors();
        manager.unregisterHandlers(eventHandlerList);
        setTimeout(function () {
            manager.clearState();
            manager.isEditingLine = false;
        }, 500);
    };

    slSelf.attachEvents = function () {
        slSelf.oldCursor = canvas.defaultCursor;
        // canvas.defaultCursor = 'crosshair';
        disableNonAnchors();
        manager.setState('DrawingLine');
        manager.registerHandlers(eventHandlerList);
    };

    solidLine = new fabric.Line([ox, oy, ox, oy], $.extend({}, lineDefaults));
    dashedLine = new fabric.Line([ox, oy, ox, oy], $.extend({}, dashedDefaults));

    canvas.add(solidLine);
    canvas.add(dashedLine);
    gpl.manager.renderAll();

    manager.isEditingLine = true;

    slSelf.attachEvents();
};

gpl.ConnectionLine = function (coords, canvas, isNew) {
    var clSelf = this,
        calculatedSegments = [],
        startX,
        startY,
        endX,
        endY,
        invalidWidth = 2,
        selectedWidth = 2,
        proxyWidth = 3,
        validWidth = 1,
        bufferWidth = 10,
        invalidColor = '#ff0000',
        validColor = '#000000',
        selectedColor = '#3333bb',
        lineDefaults = {
            stroke: validColor,
            strokeWidth: validWidth,
            selectable: gpl.isEdit,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            gplType: 'line'
        },
        proxyDefaults = {
            stroke: validColor,
            strokeWidth: proxyWidth,
            gplType: 'line',
            lockMovementX: true,
            lockMovementY: true,
            opacity: 0,
            selectable: gpl.isEdit,
            hasControls: false
        },
        forEachLine = function (fn, wide) {
            var cc;

            for (cc = 0; cc < clSelf.lines.length; cc++) {
                fn(clSelf.lines[cc]);
            }
            if (wide) {
                for (cc = 0; cc < clSelf.wideLines.length; cc++) {
                    fn(clSelf.wideLines[cc]);
                }
            }
        },
        calcManhattanMidpoints = function (p1, p2, idx, sVert, eVert) {
            var dx,
                dy,
                adx,
                ady,
                x,
                y,
                ret,
                newPoint,
                tmpPoint,
                retPoint,
                newPoints = [],
                calcDifferences = function (pp1, pp2) {
                    dx = pp2.x - pp1.x;
                    dy = pp2.y - pp1.y;
                    adx = Math.abs(dx);
                    ady = Math.abs(dy);
                    x = [pp1.x, pp2.x];
                    y = [pp1.y, pp2.y];
                },
                invertPoint = function (arg) {
                    // gpl.log(clSelf.gplId, 'inverting point', arg);
                    newPoint = [(newPoint[0] + 1) % 2, (newPoint[1] + 1) % 2];
                },
                doManhattanLines = function () {
                    //normally horizontal
                    if (adx > ady) {
                        newPoint = [1, 0];
                        if (idx === 0) {
                            if (sVert) {
                                invertPoint('adx start');
                            }
                        } else if (idx === clSelf.coords.length - 2) {
                            if (!eVert) {
                                invertPoint('adx end');
                            }
                        }
                    } else { //normally vert
                        newPoint = [0, 1];
                        if (idx === 0) {
                            if (!sVert) {
                                invertPoint('ady start');
                            }
                        } else if (idx === clSelf.coords.length - 2) {
                            if (eVert) {
                                invertPoint('ady end');
                            }
                        }
                    }

                    return {
                        x: x[newPoint[0]],
                        y: y[newPoint[1]]
                    };
                };

            calcDifferences(p1, p2);

            //if only two points, make sure it has a line extending from the anchor
            if (clSelf.coords.length === 2) { //if has a vertex, make sure horiz/vert matches
                if (sVert) {
                    if (dy > 0) { //next point is above
                        tmpPoint = {
                            x: p1.x,
                            y: p1.y + bufferWidth
                        };
                    } else { //next point is below
                        tmpPoint = {
                            x: p1.x,
                            y: p1.y - bufferWidth
                        };
                    }
                } else {
                    if (dx > 0) { //next point is to the right
                        tmpPoint = {
                            x: p1.x + bufferWidth,
                            y: p1.y
                        };
                    } else { //next point is to the left
                        tmpPoint = {
                            x: p1.x - bufferWidth,
                            y: p1.y
                        };
                    }
                }
                newPoints.push(tmpPoint);

                if (eVert) {
                    if (dy > 0) { //prev point was above
                        tmpPoint = {
                            x: p2.x,
                            y: p2.y - bufferWidth
                        };
                    } else { //prev point was below
                        tmpPoint = {
                            x: p2.x,
                            y: p2.y + bufferWidth
                        };
                    }
                } else {
                    if (dx > 0) { //prev point was to the left
                        tmpPoint = {
                            x: p2.x - bufferWidth,
                            y: p2.y
                        };
                    } else { //prev point was to the right
                        tmpPoint = {
                            x: p2.x + bufferWidth,
                            y: p2.y
                        };
                    }
                }
                newPoints.push(tmpPoint);

                calcDifferences(newPoints[0], newPoints[1]);

                retPoint = doManhattanLines();

                ret = [clSelf.coords[0], newPoints[0], retPoint, newPoints[1], clSelf.coords[1]];
            } else {
                retPoint = doManhattanLines();
                ret = [retPoint];
            }

            return ret;
        },
        selectAllSegments = function () {
            // gpl.log(clSelf);
            gpl.lineManager.setSelected(clSelf);
            clSelf.setSelected();
        },
        drawSegments = function () {
            var cc,
                point1,
                point2,
                // circle,
                x1,
                x2,
                y1,
                y2,
                vert,
                xoffset,
                yoffset,
                line,
                wideLine;

            for (cc = 0; cc < calculatedSegments.length - 1; cc++) {
                point1 = calculatedSegments[cc];
                point2 = calculatedSegments[cc + 1];
                x1 = point1.x;
                x2 = point2.x;
                y1 = point1.y;
                y2 = point2.y;
                vert = y1 !== y2;
                xoffset = vert ? (proxyWidth / 2) : 0;
                yoffset = vert ? 0 : (proxyWidth / 2);
                line = new fabric.Line([x1 + 0.5, y1 - 0.5, x2 + 0.5, y2 - 0.5], lineDefaults); //this offsets to make a clean line
                wideLine = new fabric.Line([x1 + 0.5 - xoffset, y1 - 0.5 - yoffset, x2 + 0.5 - xoffset, y2 - 0.5 - yoffset], proxyDefaults); //this offsets to make a clean line
                line.on('selected', selectAllSegments);
                wideLine.on('selected', selectAllSegments);
                line.on('removed', clSelf.delete);
                line.gplId = clSelf.gplId;
                wideLine.gplId = clSelf.gplId;
                canvas.add(line);
                canvas.add(wideLine);
                gpl.manager.sendToBack(wideLine);
                gpl.manager.sendToBack(line);
                // circle = new fabric.Circle({
                //     radius: 2,
                //     fill: 'white',
                //     left: x2 - 1,
                //     top: y2 - 1,
                //     gplType: 'linevertex'
                // });
                // if(points.length === 3 && cc === 1) {
                //     circle.set('fill', 'purple');
                // }
                // canvas.add(circle);
                clSelf.lines.push(line);
                clSelf.wideLines.push(wideLine);
                // clSelf.circles.push(circle);
            }
            gpl.fire('addedLine', clSelf);
        },
        drawLines = function () {
            var c,
                addSegment = function (index) { //point1, point2) {
                    var point1 = clSelf.coords[index],
                        point2 = clSelf.coords[index + 1],
                        svert = false,
                        evert = false,
                        midpoints,
                        points;

                    if (point1.x !== point2.x && point1.y !== point2.y && location.href.substring(0).match('nomanhattan') === null) { //if it's a diagonal line
                        if (index === 0 && clSelf.startAnchor) {
                            svert = clSelf.startAnchor.isVertical;
                        }
                        if (index === clSelf.coords.length - 2 && clSelf.endAnchor) {
                            evert = clSelf.endAnchor.isVertical;
                        }

                        midpoints = calcManhattanMidpoints(point1, point2, index, svert, evert);
                        points = [].concat(midpoints).concat(point2);
                    } else {
                        points = [point2];
                    }

                    if (index === 0) {
                        points.unshift(point1);
                    }


                    calculatedSegments = calculatedSegments.concat(points);
                };

            for (c = 0; c < clSelf.coords.length - 1; c++) {
                addSegment(c);
            }

            drawSegments();
        },
        fixCoords = function () {
            var c,
                len = clSelf.coords.length,
                coord,
                x,
                y,
                centerInAnchor = function (anchor, coord1, coord2) {
                    var top = anchor.top + anchor.radius - 0.5,
                        left = anchor.left + anchor.radius - 0.5,
                        c1 = clSelf.coords[coord1],
                        c2 = clSelf.coords[coord2];

                    if (anchor.isVertical) { //only check x
                        if (left !== c1.x) {
                            c1.x = left;
                            c2.x = left;
                        }
                    } else { //only check y
                        if (top !== c1.y) {
                            c1.y = top;
                            c2.y = top;
                        }
                    }
                };

            if (isNew) {
                centerInAnchor(clSelf.startAnchor, 0, 1);
                centerInAnchor(clSelf.endAnchor, len - 1, len - 2);
            }

            for (c = 0; c < len; c++) {
                coord = clSelf.coords[c];
                x = coord.x;
                y = coord.y;
                if (x % 1 !== 0) {
                    coord.x = Math.round(coord.x);
                }
                if (y % 1 !== 0) {
                    coord.y = Math.round(coord.y);
                }
            }
        };

    clSelf.coords = $.extend(true, [], coords);

    clSelf.lines = [];
    clSelf.wideLines = [];
    clSelf.circles = [];
    clSelf.state = 'valid';
    clSelf.gplId = gpl.makeId();
    lineDefaults.gplId = clSelf.gplId;

    startX = clSelf.coords[0].x;
    startY = clSelf.coords[0].y;

    endX = clSelf.coords[clSelf.coords.length - 1].x;
    endY = clSelf.coords[clSelf.coords.length - 1].y;

    clSelf.startAnchor = gpl.manager.getObject({
        gplType: 'anchor',
        left: startX,
        top: startY
    });

    clSelf.endAnchor = gpl.manager.getObject({
        gplType: 'anchor',
        left: endX,
        top: endY
    });

    fixCoords();

    // gpl.log('startAnchor:', startAnchor);
    // gpl.log('endAnchor:', endAnchor);

    clSelf.setColor = function (color) {
        forEachLine(function (line) {
            line.setStroke(color || '#000000');
        });
    };

    clSelf.detach = function (anchor) {
        var block,
            property;

        if (anchor) {
            block = gpl.blockManager.getBlock(anchor.gplId);
            property = anchor.anchorType;

            if (clSelf.startAnchor === anchor) {
                clSelf.startAnchor = null;
            } else if (clSelf.endAnchor === anchor) {
                clSelf.endAnchor = null;
            }

            block.syncAnchorPoints();
        }
    };

    clSelf.getOtherAnchor = function (anchor) {
        var ret;

        if (clSelf.startAnchor === anchor) {
            ret = clSelf.endAnchor;
        } else if (clSelf.endAnchor === anchor) {
            ret = clSelf.startAnchor;
        }

        return ret || {};
    };

    clSelf.revertState = function () {
        var state = clSelf.prevState.charAt(0).toUpperCase() + clSelf.prevState.substring(1);

        if (clSelf['set' + state]) {
            clSelf['set' + state]();
        }
    };

    clSelf.setInvalid = function () {
        clSelf.prevState = clSelf.state || 'valid';
        clSelf.state = 'invalid';
        forEachLine(function (line) {
            line.set({
                'stroke': invalidColor,
                'strokeWidth': invalidWidth
            });
        });
        gpl.manager.renderAll();
    };

    clSelf.setValid = function () {
        clSelf.prevState = clSelf.state || 'valid';
        if (clSelf.state !== 'valid') {
            clSelf.state = 'valid';
            forEachLine(function (line) {
                line.set({
                    'stroke': validColor,
                    'strokeWidth': validWidth
                });
            });
            gpl.manager.renderAll();
        }
    };

    clSelf.setSelected = function () {
        clSelf.prevState = clSelf.state || 'valid';
        clSelf.state = 'selected';
        gpl.lineManager.selectedLine = clSelf;
        forEachLine(function (line) {
            line.set({
                'stroke': selectedColor,
                'strokeWidth': selectedWidth
            });
        });
    };

    clSelf.deselect = function () {
        clSelf.revertState();
    };

    clSelf.validate = function () {
        var valid = false;

        if (clSelf.startAnchor && clSelf.endAnchor) {
            valid = gpl.validate.connection(clSelf.startAnchor, clSelf.endAnchor);
        }

        if (!valid) {
            clSelf.setInvalid();
        }
        return valid;
    };

    clSelf.removeLines = function () {
        forEachLine(function (line) {
            line.off();
            canvas.remove(line);
        }, true); //, 1000, function() {

        canvas.renderAll();

        calculatedSegments = [];
        clSelf.lines = [];
        clSelf.wideLines = [];
    };

    clSelf.delete = function () {
        if (clSelf.state !== 'deleting' && clSelf.state !== 'deleted') {
            clSelf.state = 'deleting';

            if (clSelf.startAnchor) {
                clSelf.startAnchor.detach(clSelf);
                clSelf.startAnchor = null;
            }

            if (clSelf.endAnchor) {
                clSelf.endAnchor.detach(clSelf);
                clSelf.endAnchor = null;
            }

            clSelf.removeLines();

            gpl.lineManager.remove(clSelf.gplId);

            gpl.manager.renderAll();
            clSelf.state = 'deleted';
        }
    };

    clSelf.redrawLine = function (gplId, newCoord) {
        var testAnchor = function (anchor) {
                return anchor.gplId === gplId;
            },
            startCoords = clSelf.coords[0],
            endCoords = clSelf.coords.slice(-1)[0],
            start,
            end;

        clSelf.removeLines();

        if (testAnchor(clSelf.startAnchor)) {
            start = newCoord;
            end = endCoords;
        } else if (testAnchor(clSelf.endAnchor)) {
            start = startCoords;
            end = newCoord;
        }

        clSelf.coords = [start, end];

        drawLines();
    };

    drawLines();

    if (!clSelf.startAnchor || !clSelf.endAnchor) {
        clSelf.setInvalid();
    }

    if (clSelf.startAnchor) {
        clSelf.startAnchor.attach(this);
    }
    if (clSelf.endAnchor) {
        clSelf.endAnchor.attach(this);
    }
};

gpl.Toolbar = function (manager) {
    var tbSelf = this,
        types = manager.blockTypes,
        padding = 5,
        defaultHeight = 30,
        defaultWidth = 30,
        width = 77, //2 * defaultWidth + 3 * padding + 2,
        canvasWidth,
        canvasHeight,
        columns = 2,
        numIcons = 0,
        rowHeight = 0,
        activeProxy,
        proxyDefaults = {
            opacity: 0.1,
            isToolbarProxy: true,
            bypassSave: true,
            fill: '#f4f4f4',
            hasBorders: false,
            hasControls: false
        },
        proxies = {},
        backgroundFill = gpl.toolbarFill,
        canvas = gpl.canvases.toolbar,
        mainCanvas = gpl.canvases.main,
        height = canvas.height,
        currX = padding,
        currY = padding,
        shapes = {},
        dragShape,
        makeId = gpl.makeId,
        getProperties = function (obj) {
            var ret = {},
                c,
                propList = ['zIndex', 'blockType', 'left', 'top', 'selectable', 'evented', 'hasControls', 'inactive', 'showValue', 'iconType', 'visible', 'opacity'];

            for (c = 0; c < propList.length; c++) {
                ret[propList[c]] = obj[propList[c]];
            }
            return ret;
        },
        bringProxiesToFront = function () {
            gpl.forEach(proxies, function (proxy) {
                gpl.manager.bringToFront(proxy, canvas);
            });

            canvas.renderAll();
        },
        drawToolbar = function () {
            tbSelf.background = new fabric.Rect({
                left: 0,
                top: 0,
                fill: backgroundFill,
                width: width,
                height: height,
                selectable: false
            });
            canvas.add(tbSelf.background);
            canvas.renderAll();
        },
        growCanvas = function () {
            canvas.setWidth(window.innerWidth);
            canvas.setHeight(window.innerHeight);
        },
        shrinkCanvas = function () {
            canvas.setWidth(canvasWidth);
            canvas.setHeight(canvasHeight);
        },
        handleDrop = function (event) {
            var newShape = activeProxy.gplShape,
                newConfig = getProperties(newShape), //$.extend(true, {}, newShape.config),
                Cls = newShape.constructor,
                clone,
                x = event.e.x,
                y = event.e.y,
                isOverCanvas = function () {
                    var $canvasEl = gpl.manager.$mainCanvasEl,
                        left = gpl.manager.panLeft,
                        top = gpl.manager.panTop,
                        currCanvasWidth = parseInt($canvasEl.css('width'), 10),
                        currCanvasHeight = parseInt($canvasEl.css('height'), 10);

                    return x >= left && x <= left + currCanvasWidth && y >= top && y <= top + currCanvasHeight;
                };

            if (x >= gpl.editModeOffset) { //} && isOverCanvas()) {
                newConfig.isToolbar = false;
                newConfig.targetCanvas = 'main';
                newConfig.bypassSave = false;
                newConfig.left = newShape.left - gpl.manager.panLeft;
                newConfig.left = newConfig.left / gpl.scaleValue;
                newConfig.top = newShape.top - gpl.manager.panTop;
                newConfig.top = newConfig.top / gpl.scaleValue;
                newConfig.calcType = newShape.calcType;
                newConfig.labelVisible = gpl.json.Show_Label;
                delete newConfig.inactive;

                clone = new Cls(newConfig);

                manager.addNewPoint(clone);
            }

            newShape.delete();

            activeProxy.gplShape = activeProxy.nextShape;
            activeProxy.gplId = activeProxy.gplShape.gplId;

            activeProxy.set({
                left: activeProxy._origLeft,
                top: activeProxy._origTop
            });

            activeProxy.setCoords();

            manager.bringToFront(activeProxy, canvas);
            manager.clearState();

            this.off('mouseup', handleDrop);

            canvas.discardActiveObject();
            shrinkCanvas();
            canvas.renderAll();
            mainCanvas.renderAll();
        },
        handleClick = function (item) {
            var gplItem = shapes[item.gplId] || gpl.texts[item.gplId],
                itemType = gplItem.type,
                clone,
                cloneConfig,
                id = makeId();

            growCanvas();

            activeProxy = item;

            manager.setState('AddingBlock');

            if (gplItem instanceof gpl.blocks.TextBlock) {
                cloneConfig = getProperties(gplItem);
                cloneConfig = $.extend(true, cloneConfig, gplItem.config);
                cloneConfig.left = item.left - 8;
                cloneConfig.top = item.top + 1;
            } else {
                cloneConfig = getProperties(gplItem);
            }

            cloneConfig.bypassSave = true;
            cloneConfig.gplId = id;
            cloneConfig.isToolbar = true;
            cloneConfig.targetCanvas = 'toolbar';
            // cloneConfig.scaleValue = gpl.scaleValue;

            if (gplItem.setActive) {
                gplItem.setActive();
            }

            gplItem.scale(gpl.scaleValue);

            clone = new gpl.blocks[itemType](cloneConfig);

            activeProxy.nextShape = clone;

            shapes[id] = clone;
            item.on('mouseup', handleDrop);

            bringProxiesToFront();
        },
        renderItem = function (cfg, iconType) {
            var Item,
                cls = cfg.blockType,
                skipToolbar = !!cfg.skipToolbar,
                id = makeId(),
                proxyShape,
                proxyCfg = $.extend(true, {}, proxyDefaults),
                shape,
                shapeHeight,
                shapeOffsetTop,
                shapeOffsetLeft,
                proxyOffsetLeft,
                config = {
                    left: currX,
                    top: currY,
                    isToolbar: true,
                    targetCanvas: 'toolbar',
                    // hasControls: false,
                    gplId: id,
                    inactive: true,
                    bypassSave: true,
                    iconType: iconType,
                    showValue: false
                };

            Item = gpl.blocks[cls];

            if (Item) {
                if (!skipToolbar) {
                    shapeOffsetTop = Item.prototype.toolbarOffsetTop || 0;
                    shapeOffsetLeft = Item.prototype.toolbarOffsetLeft || 0;
                    proxyOffsetLeft = Item.prototype.proxyOffsetLeft || 0;
                    config.top += shapeOffsetTop;
                    config.left += shapeOffsetLeft;
                    // config.width = config.width || defaultWidth;
                    // config.height = config.height || defaultHeight;
                    shape = new Item(config);
                    shape.blockType = iconType;

                    shapeHeight = shape.toolbarHeight || defaultHeight;
                    rowHeight = Math.max(shapeHeight, rowHeight);

                    proxyCfg.height = shapeHeight;
                    proxyCfg.width = defaultWidth;
                    proxyCfg.top = proxyCfg._origTop = currY + padding;
                    proxyCfg.left = proxyCfg._origLeft = currX + shapeOffsetLeft + proxyOffsetLeft;
                    proxyCfg.gplId = id;
                    proxyCfg.isToolbar = true;

                    if (!gpl.isEdit) {
                        proxyCfg.selectable = false;
                        proxyCfg.draggable = false;
                        proxyCfg.lockMovementX = true;
                        proxyCfg.lockMovementY = true;
                    }

                    shapes[id] = shape;

                    id = makeId();
                    dragShape = new Item({
                        left: currX + shapeOffsetLeft,
                        top: currY + shapeOffsetTop,
                        isToolbar: true,
                        // hasControls: false,
                        gplId: id,
                        inactive: true,
                        bypassSave: true,
                        targetCanvas: 'toolbar',
                        iconType: iconType,
                        showValue: false
                    });

                    dragShape.blockType = iconType;

                    proxyCfg.gplShape = shape;

                    shapes[id] = dragShape;

                    numIcons++;

                    if (numIcons % columns === 0) {
                        currY += rowHeight + padding;
                        currX = padding;
                        rowHeight = 0;
                    } else {
                        currX += shape.toolbarWidth + padding;
                    }

                    proxyShape = new fabric.Rect(proxyCfg);
                    canvas.add(proxyShape);
                    proxies[proxyCfg.gplId] = proxyShape;

                    proxyShape.on('moving', function () {
                        var syncShape = proxyShape.gplShape; //shapes[proxyCfg.gplId];

                        if (syncShape.syncObjects) {
                            syncShape.syncObjects(proxyShape, {
                                top: shapeOffsetTop
                            });
                        } else {
                            syncShape.set({
                                top: proxyShape.top + syncShape.toolbarOffsetTop,
                                left: proxyShape.left + syncShape.toolbarOffsetLeft + syncShape.proxyOffsetLeft
                            });
                        }
                    });
                }
                // gpl.log('Found:', cls, '-', iconType);
            } else {
                gpl.log('Class not found:', cls, '-', iconType);
            }
        };

    tbSelf.shapes = shapes;
    tbSelf.proxies = proxies;

    drawToolbar();

    gpl.forEach(types, renderItem);

    if (numIcons % columns === 1) {
        currY += rowHeight + padding;
    }

    bringProxiesToFront();

    tbSelf.background.set('height', currY + 2 * padding);

    manager.registerHandlers([{
        canvas: canvas,
        event: 'object:selected',
        handler: function (event) {
                var tgt = event.target;
                if (tgt.isToolbarProxy) { // if(tgt.master !== true && tgt.isClone !== true) {
                    handleClick(tgt);
                }
            }
            // }, {
            //     event: 'mouse:up',
            //     handler: function(event) {
            //         if(event.target && shapes[event.target.gplId]) {
            //             canvas.discardActiveObject();
            //         }
            //     }
    }]);

    canvasHeight = tbSelf.background.height;
    canvasWidth = width;
    shrinkCanvas();

    canvas.renderAll();
};

/* ------------ Managers ----------------- */

gpl.LineManager = function (manager) {
    var lmSelf = this,
        bringToFront = function (line) {
            var c,
                list = line.lines,
                len = list.length;

            for (c = 0; c < len; c++) {
                gpl.manager.bringToFront(list[c]);
            }

            gpl.manager.renderAll();
        },
        doRemove = function (line) {
            lmSelf.removedLines[line.gplId] = line;
            delete lmSelf.lines[line.gplId];
        };

    lmSelf.lines = {};
    lmSelf.removedLines = {};

    lmSelf.setSelected = function (line) {
        if (lmSelf.selectedLine) {
            lmSelf.selectedLine.deselect();
        }

        lmSelf.selectedLine = line;
    };

    lmSelf.registerLine = function (line) {
        lmSelf.lines[line.gplId] = line;
    };

    lmSelf.getLine = function (gplId) {
        return lmSelf.lines[gplId];
    };

    lmSelf.deleteLine = function (conf) {
        var line;

        if (typeof conf === 'string') {
            line = lmSelf.lines[conf];
        } else {
            line = conf;
        }

        if (line) {
            line.delete();

            doRemove(line);

            manager.renderAll();
        } else {
            gpl.log('no line to remove');
        }
    };

    lmSelf.remove = function (line) {
        doRemove(line);
    };

    lmSelf.convertLine = function (line) {
        var ret = {
            handle: line.coords
        };

        return ret;
    };

    lmSelf.prepSaveData = function (saveObject) {
        var ret = [];

        gpl.forEach(lmSelf.lines, function (obj) {
            if (obj.state !== 'deleted') {
                ret.push(lmSelf.convertLine(obj));
            }
        });

        saveObject.line = ret;
    };

    gpl.on('addedLine', function (line) {
        lmSelf.lines[line.gplId] = line;
        bringToFront(line);
    });

    gpl.on('removeline', function (line) {
        if (lmSelf.lines[line.gplId]) {
            lmSelf.deleteLine(line.gplId);
        }
    });

    gpl.manager.registerHandler({
        event: 'selection:cleared',
        handler: function (event) {
            if (lmSelf.selectedLine) {
                lmSelf.selectedLine.revertState();
                lmSelf.selectedLine = null;
            }
        }
    });

    gpl.manager.addToBindings({
        deleteLine: function () {
            var line = manager.contextObject;

            lmSelf.deleteLine(line.gplId);
        }
    });

    gpl.on('save', function () {
        lmSelf.prepSaveData(gpl.json);
    });

    gpl.on('saveForLater', function () {
        lmSelf.prepSaveData(gpl.json.editVersion);
    });

    gpl.onDestroy(function () {
        gpl.forEach(lmSelf.lines, function (line, gplId) {
            line.delete();
            delete lmSelf.lines[gplId];
        });
        delete lmSelf.lines;
    });
};

gpl.BlockManager = function (manager) {
    var bmSelf = {
        blocks: {},
        upis: {},
        newBlocks: {},
        deletedBlocks: {},
        editedBlocks: {},
        screenObjects: [],
        doubleClickDelay: 400,
        lastSelectedBlock: null,
        highlightFill: '#ffffff',
        lastSelectedTime: new Date().getTime(),
        manager: manager,
        canvas: manager.canvas,
        upiListeners: {},
        bindings: {
            blockTitle: ko.observable(),
            editPointType: ko.observable(),
            editPointName: ko.observable(),
            editPointCharacters: ko.observable(),
            editPointDecimals: ko.observable(),
            editPointValue: ko.observable(),
            editPointLabel: ko.observable(),
            editPointShowValue: ko.observable(),
            editPointShowLabel: ko.observable(),
            editText: ko.observable(),
            editTextBold: ko.observable(),
            editTextItalic: ko.observable(),
            editTextFontSize: ko.observable(),
            editTextColor: ko.observable('ff0000'),
            actionButtonText: ko.observable(),
            actionButtonType: ko.observable(),
            actionButtonParameter: ko.observable(),
            actionButtonValue: ko.observable(),
            actionButtonPointName: ko.observable(),
            actionButtonUpi: ko.observable(),
            actionButtonPointType: ko.observable(),
            actionButtonReportType: ko.observable(),
            reportFromDate: ko.observable(''),
            reportFromTime: ko.observable(''),
            reportToDate: ko.observable(''),
            reportToTime: ko.observable(''),
            actionButtonReportDuration: ko.observable(),
            selectedReference: ko.observable(),
            gridSize: ko.observable(gpl.gridSize),
            blockReferences: ko.observableArray([]),
            updateText: function () {
                var text = bmSelf.bindings.editText(),
                    fontSize = bmSelf.bindings.editTextFontSize(),
                    color = '#' + bmSelf.bindings.editTextColor(),
                    weight = bmSelf.bindings.editTextBold() ? 'bold' : 'normal',
                    style = bmSelf.bindings.editTextItalic() ? 'italic' : 'normal';

                bmSelf.textEditBlock.set({
                    text: text,
                    fontSize: fontSize,
                    fill: color,
                    fontWeight: weight,
                    fontStyle: style
                });

                bmSelf.renderAll();

                gpl.$editTextModal.modal('hide');
            },
            deleteBlock: function () {
                gpl.fire('deleteblock', manager.contextObject);
            },
            showDevicePoint: function () {
                bmSelf.openPointEditor(true);
            },
            editBlockPrecision: function () {
                var block = manager.contextObject,
                    precision = block.precision.toString().split('.'),
                    numChars = parseInt(precision[0], 10),
                    numDecimals = parseInt(precision[1], 10);

                bmSelf.bindings.editPointCharacters(numChars);
                bmSelf.bindings.editPointDecimals(numDecimals);

                bmSelf.editBlock = block;
                bmSelf.openPrecisionEditor();
            },
            showPointEditor: function () {
                var block = manager.contextObject;

                gpl.blockManager.openPointEditor(block, true);
            },
            updateBlockPrecision: function () {
                bmSelf.editBlock.precision = parseFloat(bmSelf.bindings.editPointCharacters() + '.' + bmSelf.bindings.editPointDecimals());
                bmSelf.editBlock.setPlaceholderText();
                gpl.fire('editedblock', bmSelf.editBlock);
                bmSelf.closePrecisionEditor();
            },
            editPointReference: function () {
                var url = '/pointLookup/',
                    editBlock = bmSelf.editBlock,
                    isControl = editBlock.type === 'ControlBlock',
                    block,
                    deviceId = isControl ? gpl.deviceId : null,
                    pointType,
                    property = isControl ? 'Control Point' : 'Monitor Point';

                if (isControl) {
                    block = editBlock.inputAnchors[0].getConnectedBlock();
                } else {
                    block = editBlock.outputAnchor.getConnectedBlock();
                }

                if (block) {
                    pointType = block.pointType;

                    url += pointType + '/' + property;

                    if (deviceId) {
                        url += '/' + deviceId;
                    }
                }

                bmSelf.doOpenPointSelector(url, property);
            },
            updatePoint: function () {
                var label = bmSelf.bindings.editPointLabel(),
                    // labelId,
                    showValue = bmSelf.bindings.editPointShowValue(),
                    showLabel = bmSelf.bindings.editPointShowLabel(),
                    props = {
                        output: 'Control Point',
                        input: 'Monitor Point'
                    },
                    idx,
                    tmpBlock,
                    editBlock = bmSelf.editBlock,
                    currReferences = bmSelf.upis[editBlock.upi] || [],
                    newReferences = bmSelf.upis[bmSelf.editBlockUpi] || [],
                    pointName,
                    prop;

                if (editBlock.hasReferenceType) { //is monitor/control block
                    if (bmSelf.editBlockUpi !== editBlock.upi) { //new point
                        gpl.forEachArray(currReferences, function (ref, c) {
                            var refBlock = ref.block;

                            if (refBlock.gplId === editBlock.gplId) {
                                idx = c;
                                return false;
                            }
                            //remove
                        });

                        if (idx !== undefined) {
                            currReferences.splice(idx, 1);
                        }

                        if (currReferences.length === 1) {
                            tmpBlock = currReferences[0];
                            if (tmpBlock.block.setReferenceType) {
                                tmpBlock.block.setReferenceType('External');
                            }
                        }

                        prop = props[editBlock.pointType];
                        pointName = bmSelf.bindings.editPointName();

                        editBlock.setPointRef(prop, bmSelf.editBlockUpi, pointName);
                        editBlock.pointName = pointName;
                        editBlock.upi = bmSelf.editBlockUpi;
                        editBlock.getReferencePoint(); //isNew
                        editBlock.setLabel(pointName.split('_').pop());
                        editBlock.valueType = gpl.manager.valueTypes[bmSelf.editBlockPointType];

                        newReferences.push({
                            block: editBlock,
                            valueText: editBlock.valueText
                        });

                        if (newReferences.length > 1) {
                            gpl.forEachArray(newReferences, function (ref, c) {
                                var refBlock = ref.block;
                                if (refBlock.hasReferenceType) {
                                    refBlock.setReferenceType('Internal');
                                }
                            });
                        } else {
                            editBlock.setReferenceType('External');
                        }

                        gpl.fire('editedblock', bmSelf.editBlock); //capture changes on currently referenced point

                    }
                } else { //constant
                    editBlock.setValue(+bmSelf.bindings.editPointValue());
                }

                // if(editBlock.isNonPoint === true && editBlock.referenceType !== 'External' && editBlock.blockType !== 'Constant') {
                //     labelId = bmSelf.bindings.selectedReference();
                //     label = bmSelf.getBlock(labelId).label;

                //     if(label !== editBlock.label) {
                //         editBlock.setLabel(label);
                //         bmSelf.bindings.editPointLabel(label);
                //     }
                // }

                editBlock.precision = parseFloat(bmSelf.bindings.editPointCharacters() + '.' + bmSelf.bindings.editPointDecimals());

                editBlock.setShowLabel(showLabel);
                editBlock.setShowValue(showValue);

                gpl.$editInputOutputModal.modal('hide');

                gpl.fire('editedblock', bmSelf.editBlock);
            }
        },

        getActiveBlock: function () {
            var target = bmSelf.canvas.getActiveObject(),
                gplId = (target && target.gplId) || null,
                activeBlock = bmSelf.blocks[gplId] || null;

            return {
                target: target,
                block: activeBlock
            };
        },

        getSaveObject: function () {
            var saveObj = {
                    adds: [],
                    updates: [],
                    deletes: []
                },
                refs = [gpl.point['Point Refs'][0]];

            gpl.forEach(bmSelf.newBlocks, function (block) {
                if (!block.isNonPoint) {
                    saveObj.adds.push(block.getPointData());
                }
            });

            gpl.forEach(bmSelf.editedBlocks, function (block) {
                if (!block.isNonPoint) {
                    saveObj.updates.push({
                        oldPoint: block._origPointData,
                        newPoint: block.getPointData()
                    });
                }
            });

            gpl.forEach(bmSelf.deletedBlocks, function (block) {
                if (!block.isNonPoint) {
                    saveObj.deletes.push(block.upi);
                }
            });

            gpl.forEach(bmSelf.pointRefUpiMatrix, function (ref, k, c) {
                ref.PropertyName = 'GPLBlock';
                refs.push(ref);
            });

            gpl.point['Point Refs'] = refs;

            return saveObj;
        },

        resetChanges: function () {
            bmSelf.newBlocks = {};
            bmSelf.editedBlocks = {};
            bmSelf.deletedBlocks = {};
        },

        doOpenPointSelector: function (url, property) {
            gpl.openPointSelector(function (upi, name, pointType) {
                bmSelf.bindings.editPointName(name);
                bmSelf.editBlockUpi = upi;
                bmSelf.editBlockPointType = pointType;
                gpl.log(upi, name);
            }, url, null, property);
        },

        openPrecisionEditor: function (block) {
            gpl.$editPrecisionModal.modal('show');
        },

        closePrecisionEditor: function () {
            gpl.$editPrecisionModal.modal('hide');
        },

        openBlockEditor: function (block) {
            var precision = block.precision.toString().split('.'),
                numChars = parseInt(precision[0], 10),
                numDecimals = parseInt(precision[1], 10),
                value = block.value,
                label = block.label,
                editableTypes = {
                    'ControlBlock': true,
                    'MonitorBlock': true,
                    'ConstantBlock': true
                };

            // if(editableTypes[block.type]) {
            bmSelf.editBlock = block;
            bmSelf.editBlockUpi = block.upi;
            bmSelf.bindings.blockTitle(block.label);
            bmSelf.bindings.editPointType(block.type);
            bmSelf.bindings.editPointName(block.pointName);
            bmSelf.bindings.editPointCharacters(numChars);
            bmSelf.bindings.editPointDecimals(numDecimals);
            bmSelf.bindings.editPointValue(value);
            bmSelf.bindings.editPointLabel(label);
            bmSelf.bindings.editPointShowValue(block.presentValueVisible);
            bmSelf.bindings.editPointShowLabel(block.labelVisible);

            gpl.$editInputOutputModal.modal('show');
            // }
        },

        openTextEditor: function (block) {
            var newColor = block.fill.replace('#', '');
            manager.canvas.discardActiveObject();
            bmSelf.textEditBlock = block;
            bmSelf.bindings.editText(block.text);
            bmSelf.bindings.editTextBold(block.fontWeight === 'bold');
            bmSelf.bindings.editTextItalic(block.fontStyle === 'italic');
            bmSelf.bindings.editTextFontSize(block.fontSize);
            bmSelf.bindings.editTextColor(newColor);
            // bmSelf.fontColorPicker.render();
            bmSelf.fontColorPicker.updateColor(newColor);
            gpl.$editTextModal.modal('show');
        },

        convertBlock: function (block) {
            var ret = {},
                prop,
                shape,
                c;

            //not text
            if (block._shapes && block._shapes[0]) {
                shape = block._shapes[0];
                ret.left = shape.left;
                ret.top = shape.top;
            } else { //textBlock
                ret = {
                    left: block.left,
                    top: block.top,
                    width: block.width,
                    height: block.height,
                    text: block.text,
                    fontWeight: block.fontWeight,
                    fontStyle: block.fontStyle,
                    fontSize: block.fontSize,
                    fontFamily: block.fontFamily,
                    fill: block.fill,
                    blockType: 'TextBlock',
                    _v2: true
                };
            }

            for (c = 0; c < gpl.convertProperties.length; c++) {
                prop = gpl.convertProperties[c];
                if (block[prop]) {
                    ret[prop] = block[prop];
                }
            }

            return ret;
        },

        getBlock: function (gplId) {
            var ret = null,
                id = gplId;

            if (typeof id !== 'string') {
                id = gpl.idxPrefix + parseInt(id, 10);
            }

            ret = bmSelf.blocks[id];

            if (!ret) {
                ret = bmSelf.newBlocks[id];
            }

            return ret;
        },

        add: function (object, canvas, render) {
            gpl.canvases[canvas || 'main'].add(object);
            if (render) {
                gpl.canvases[canvas || 'main'].renderAll();
            }
            // this.canvas.add(object);
        },

        remove: function (object, canvas) {
            gpl.canvases[canvas || 'main'].remove(object);
        },

        renderAll: function () {
            manager.renderAll();
        },

        handleTypeChange: function (object, event) {
            // var refType =
            gpl.log('type change', arguments);
        },

        prepSaveData: function (saveObject) {
            var ret = [],
                lines = [];

            gpl.forEach(bmSelf.blocks, function (obj) {
                if (!obj.bypassSave) {
                    if (obj.syncAnchorPoints) {
                        obj.syncAnchorPoints();
                    }
                    ret.push(bmSelf.convertBlock(obj));
                }
            });

            // gpl.forEach(gpl.texts, function(obj) {
            //     ret.push(bmSelf.convertBlock(obj));
            // });

            saveObject.block = ret;
        },

        prepReferences: function () {
            var references = gpl.references,
                upiMap = {},
                pointData = {},
                upi,
                c,
                cleanup = function (ref, idx) {
                    pointData[ref._id] = ref;
                    return {
                        Name: ref.Name,
                        pointType: ref['Point Type'].Value,
                        valueType: (ref['Value'].ValueType === 5) ? 'enum' : 'float',
                        _idx: idx
                    };
                    // return ref;
                };

            for (c = 0; c < references.length; c++) {
                upi = references[c]._id;
                upiMap[upi] = cleanup(references[c], c);
            }

            gpl.pointUpiMap = upiMap;
            gpl.pointData = pointData;
        },

        addUPIListener: function (upi, anchor, line, fn) {
            bmSelf.upiListeners[upi] = bmSelf.upiListeners[upi] || [];

            bmSelf.upiListeners[upi].push({
                fn: fn,
                anchor: anchor,
                line: line
            });
        },

        processPointRefs: function () {
            var refs = gpl.point['Point Refs'],
                c,
                upi,
                ret = {};

            for (c = 0; c < refs.length; c++) {
                upi = refs[c].PointInst;
                ret[upi] = refs[c];
            }

            bmSelf.pointRefUpiMatrix = ret;
            bmSelf.invalidPointRefs = {};
        },

        isActiveUPI: function (block, Cls) {
            var ret = true,
                upi = block.upi;

            if (upi && Cls.prototype.isNonPoint !== true) {
                ret = bmSelf.pointRefUpiMatrix[upi] !== undefined;
            }

            if (!ret) {
                bmSelf.invalidPointRefs[upi] = {
                    cls: Cls,
                    cfg: block
                };
            }

            return ret;
        },

        init: function () {
            manager.addToBindings(bmSelf.bindings);

            bmSelf.processPointRefs();

            bmSelf.prepReferences();
        }
    };

    bmSelf.bindings.gridSize.subscribe(function (val) {
        var newVal = parseInt(val, 10);

        if (isNaN(newVal) || newVal === 0) {
            bmSelf.bindings.gridSize(gpl.gridSize || 1);
        } else {
            gpl.gridSize = newVal;
        }
    });

    bmSelf.handleFontColorChange = function (newColor) {
        bmSelf.bindings.editTextColor(newColor);
    };

    bmSelf.fontColorPicker = new CustomColorsPicker(gpl.$fontColorPicker, bmSelf.handleFontColorChange, bmSelf.bindings.editTextColor());
    bmSelf.fontColorPicker.render();

    bmSelf.validateAll = function () {
        var valid = true,
            checkValid = function (block) {
                if (!block.isToolbar && block.validate) {
                    valid = block.validate();
                }
                // gpl.log('valid', valid);
                return valid;
            };

        gpl.forEach(bmSelf.blocks, checkValid);

        if (valid) {
            gpl.forEach(bmSelf.newBlocks, checkValid);
        }

        gpl.log('Validate All result:', valid);

        gpl.manager.renderAll();

        return valid;
    };

    bmSelf.highlight = function (shape) {
        if (gpl.isEdit) {
            if (bmSelf.highlightedObject) {
                bmSelf.deselect();
            }

            bmSelf.highlightedObject = shape;
            if (!shape._origFill) {
                shape._origFill = shape.fill;
            }
            shape.set('fill', bmSelf.highlightFill);
        }
    };

    bmSelf.deselect = function () {
        var obj = bmSelf.highlightedObject;
        if (obj) {
            obj.set('fill', obj._origFill);
        }
        bmSelf.highlightedObject = null;
    };

    gpl.on('newblock', function (newBlock) {
        var ref;
        gpl.hasEdits = true;
        bmSelf.newBlocks[newBlock.upi] = newBlock;
        bmSelf.updateBlockReferences(newBlock);

        if (!bmSelf.pointRefUpiMatrix[newBlock.upi]) {
            ref = gpl.makePointRef(newBlock.upi, newBlock.pointName);
            bmSelf.pointRefUpiMatrix[newBlock.upi] = ref;
        }
    });

    gpl.on('editedblock', function (block) {
        gpl.hasEdits = true;
        bmSelf.editedBlocks[block.upi] = block;
    });

    gpl.on('deleteblock', function (oldBlock, isCancel) {
        var references = bmSelf.upis[oldBlock.upi] || [];

        if (!isCancel) {
            gpl.hasEdits = true;
            bmSelf.deletedBlocks[oldBlock.upi] = oldBlock;
        }

        gpl.forEachArray(references, function (ref, c) {
            var refBlock = ref.block;

            if (refBlock.gplId === oldBlock.gplId) {
                references.splice(c, 1);
                return false;
            }
        });

        if (references.length <= 1) {
            gpl.forEachArray(references, function (ref) {
                var refBlock = ref.block;

                if (refBlock.hasReferenceType) {
                    refBlock.setReferenceType('External');
                }
            });
        }

        delete bmSelf.blocks[oldBlock.upi];
        oldBlock.delete();
        bmSelf.renderAll();
        gpl.log('block deleted');
    });

    gpl.on('save', function () {
        bmSelf.prepSaveData(gpl.json);
    });

    gpl.on('saveForLater', function () {
        bmSelf.prepSaveData(gpl.json.editVersion);
    });

    bmSelf.create = function (config) {
        var Cls = config.cls,
            cfg = config.cfg,
            obj;

        delete cfg.type;

        obj = new Cls(cfg);

        return obj;
    };

    bmSelf.applyUpdateInterval = function (interval) {
        gpl.forEach(bmSelf.blocks, function (obj) {
            if (obj._pointData && obj._pointData['Update Interval']) {
                gpl.fire('editedblock', obj);
                obj._pointData['Update Interval'].Value = interval;
            }
        });
    };

    bmSelf.applyController = function (name, value) {
        gpl.forEach(bmSelf.blocks, function (obj) {
            if (obj._pointData) {
                gpl.fire('editedblock', obj);
                obj._pointData.Controller.Value = name;
                obj._pointData.Controller.eValue = value;
            }
        });
    };

    bmSelf.applyShowLabel = function (bool) {
        gpl.forEach(bmSelf.blocks, function (obj) {
            if (obj.setShowLabel && !obj.isToolbar) {
                obj.setShowLabel(bool);
            }
        });
    };

    bmSelf.applyShowValue = function (bool) {
        gpl.forEach(bmSelf.blocks, function (obj) {
            if (obj.setShowValue && !obj.isToolbar) {
                obj.setShowValue(bool);
            }
        });
    };

    bmSelf.updateBlockReferences = function (block) {
        bmSelf.bindings.blockReferences.push({
            label: block.label,
            value: block.gplId
        });

        bmSelf.bindings.blockReferences.sort(function (left, right) {
            return left.label < right.label ? -1 : 1;
        });
    };

    bmSelf.registerBlock = function (block, valueText, targetCanvas) {
        var items = block._shapes || [],
            item,
            c,
            canvas = gpl.canvases[targetCanvas || 'main'],
            handleBlockMove = function (event) {
                var data = bmSelf.getActiveBlock(),
                    target = data.target,
                    movingBlock = data.block;

                if (event.e.movementX !== 0 || event.e.movementY !== 0) {
                    bmSelf.movingBlock = true;

                    if (movingBlock && movingBlock.syncObjects && target.gplType !== 'anchor') {
                        // gpl.log('moving block', movingBlock);
                        movingBlock.syncObjects(target);
                    }

                    gpl.actionLog.push({
                        action: 'moved',
                        obj1: movingBlock
                    });
                } else {
                    bmSelf.movingBlock = false;
                }
            };

        bmSelf.blocks[block.gplId] = block;

        // if(gpl.labelCounters[block.type] === undefined) {
        //     gpl.log('not setup', block.type, block);
        // }
        if (!block.config.inactive) {
            gpl.labelCounters[block.type]++;
        }

        // gpl.log('labeling', block.type, gpl.labelCounters[block.type]);

        canvas.add(block);

        if (block.upi && !isNaN(block.upi)) {
            bmSelf.upis[block.upi] = bmSelf.upis[block.upi] || [];

            bmSelf.upis[block.upi].push({
                block: block,
                valueText: valueText
            });

            if (bmSelf.upis[block.upi].length === 1) {
                bmSelf.screenObjects.push({
                    upi: block.upi,
                    'Quality Label': '',
                    isGplSocket: true
                });
            } else {
                gpl.forEachArray(bmSelf.upis[block.upi], function (ref) {
                    var refBlock = ref.block;

                    if (refBlock.hasReferenceType) { //is control/monitor block
                        refBlock.setReferenceType('Internal');
                    }
                });
            }
        }

        gpl.manager.addToBoundingRect(block);

        for (c = 0; c < items.length; c++) {
            item = items[c];
            if (!item.canvas) { //double adds nonpoint shapes
                canvas.add(item);
                item.on('moving', handleBlockMove);
            }
        }

        if (!block.isToolbar) {
            bmSelf.updateBlockReferences(block);
        }

        bmSelf.renderAll();
    };

    bmSelf.processValue = function (upi, dyn) {
        var upis = bmSelf.upis[upi],
            upiListeners = bmSelf.upiListeners,
            listeners = upiListeners[upi] || [],
            listener,
            text = dyn.Value,
            block,
            valueText,
            c,
            row,
            qualityCode = dyn['Quality Label'];

        // gpl.log('dynamic for ', upi);

        for (c = 0; c < upis.length; c++) {
            row = upis[c];
            block = row.block;
            valueText = row.valueText;

            text = gpl.formatValue(block, dyn.Value);

            if (qualityCode !== 'none') {
                text += ' ' + gpl.qualityCodes[qualityCode].text;
            }

            if (qualityCode !== 'none') {
                valueText.setFill('#' + gpl.qualityCodes[qualityCode].color);
            } else {
                valueText.setFill('#000000');
            }
            valueText.setText(text);
            block.currValue = dyn.Value;
        }

        for (c = 0; c < listeners.length; c++) {
            listener = listeners[c];
            listener.fn(listener.upi, listener.anchor, listener.line, dyn);
            // listeners(upi, dyn);
        }

        bmSelf.renderAll();
    };

    bmSelf.openPointEditor = function (block, override) { //for view mode clicks to edit
        var upi,
            pointData = block && block.getPointData && block.getPointData(),
            windowRef,
            endPoint,
            url,
            pointName,
            pointType,
            doOpenWindow = function (fn) {
                windowRef = gpl.openWindow(url, pointName, pointType, '', upi, {
                    width: 820,
                    height: 540
                });

                (fn || gpl.emptyFn)();
            };

        if (block) {
            if (block instanceof gpl.Block) {
                if (override || (!block.isNonPoint || (block.isNonPoint && !gpl.isEdit))) {
                    bmSelf.deselect();
                    upi = block.upi;
                    endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint(block.pointType, upi);
                    url = endPoint.review.url;
                    pointName = block.pointName;
                    pointType = block.pointType;
                    doOpenWindow(function () {
                        if (gpl.isEdit) {
                            windowRef.attach = {
                                point: pointData ? JSON.stringify(pointData) : null,
                                saveCallback: function (point) {
                                    var pt = point;
                                    if (typeof pt === 'string') {
                                        pt = JSON.parse(point);
                                    }
                                    block.setPointData(pt, true);
                                    gpl.fire('editedblock', block);
                                }
                            };
                        }
                    });

                } else {
                    //is constant/monitor/etc
                    if (block.type === 'ConstantBlock') {
                        bmSelf.openBlockEditor(block);
                    }
                }
            } else { //open device point
                upi = gpl.devicePoint._id;
                pointName = gpl.devicePoint.Name;
                pointType = 'Device';
                endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, upi);
                url = endPoint.review.url;
                doOpenWindow();
            }
        }
    };

    bmSelf.handleMouseUp = function (event) {
        var data = bmSelf.getActiveBlock(),
            eTarget = event.target,
            target = data.target,
            movingBlock = data.block;

        if (bmSelf.movingBlock === true) {
            bmSelf.movingBlock = false;
            if (movingBlock && gpl.isEdit) {
                movingBlock.redrawLines();
            }
        } else {
            if (!target) {
                target = eTarget;
                if (target) {
                    movingBlock = bmSelf.getBlock(target.gplId);
                }
            }
            if (event.e.which === 1 && movingBlock && !(movingBlock instanceof gpl.blocks.ConstantBlock) && !bmSelf.handlingDoubleClick && !gpl.isEdit) {
                bmSelf.openPointEditor(movingBlock);
                bmSelf.deselect();
            }
        }

        bmSelf.handlingDoubleClick = false;
    };

    bmSelf.handleDoubleClick = function (event) {
        var target = event.target,
            gplId,
            targetBlock,
            now = new Date().getTime();

        if (target && gpl.isEdit) {
            gplId = target.gplId;
            targetBlock = bmSelf.blocks[gplId];

            if (now - bmSelf.lastSelectedTime < bmSelf.doubleClickDelay && targetBlock) { //doubleclick
                bmSelf.handlingDoubleClick = true;
                bmSelf.deselect();
                // gpl.log('processing double click');
                if (!targetBlock.isNonPoint) {
                    bmSelf.openPointEditor(targetBlock);
                } else if (!targetBlock.useNativeEdit && gpl.isEdit) {
                    if (targetBlock instanceof gpl.Block) {
                        bmSelf.openBlockEditor(targetBlock);
                    } else {
                        bmSelf.openTextEditor(targetBlock);
                    }
                }
            } else {
                // gpl.log('too much time');
                bmSelf.lastSelectedTime = now;
                bmSelf.lastSelectedBlock = targetBlock;
            }
        }
    };

    bmSelf.handleKeyUp = function (event) {
        var key = event.which,
            block,
            dir = gpl.ARROWKEYS[key],
            handlers = {
                down: {
                    top: 1
                },
                left: {
                    left: -1
                },
                right: {
                    left: 1
                },
                up: {
                    top: -1
                }
            },
            offset = {
                left: 0,
                top: 0
            };

        if (bmSelf.highlightedObject && dir) {
            block = bmSelf.getBlock(bmSelf.highlightedObject.gplId);
            offset = $.extend(offset, handlers[dir]);
            block.nudge(offset);
        }
    };

    bmSelf.destroyBlocks = function () {
        gpl.forEach(bmSelf.blocks, function (block, gplId) {
            var items = block._shapes || [],
                c;

            for (c = 0; c < items.length; c++) {
                items[c].off();
            }

            if (block.destroy) {
                block.destroy();
            }
            delete bmSelf.blocks[gplId];
        });
    };

    manager.registerHandlers([{
        event: 'selection:cleared',
        handler: bmSelf.deselect
    }, {
        event: 'mouse:up',
        handler: bmSelf.handleMouseUp
    }, {
        event: 'mouse:down',
        handler: bmSelf.handleDoubleClick
    }, {
        event: 'keyup',
        handler: bmSelf.handleKeyUp,
        type: 'DOM',
        window: true
    }]);

    bmSelf.init();

    gpl.onDestroy(function () {
        bmSelf.destroyBlocks();
        delete bmSelf.blocks;
        delete bmSelf.screenObjects;
        delete bmSelf.upiListeners;
        delete bmSelf.upis;
        delete bmSelf.manager;
        delete bmSelf.canvas;
    });

    return bmSelf;
};

gpl.Manager = function () {
    var managerSelf = this,
        started = new Date().getTime(),
        configuredEvents = {},
        log = gpl.log,
        initDelay = 1,
        currInitStep = 0,
        // renderDelay = 100,

        sequenceEditProperties = ['Width', 'Height', 'Show Label', 'Show Value'],
        mergeProperties = ['Show Label', 'Show Value'],
        initFlow = ['initBindings', 'initCanvas', 'initManagers', 'initQualityCodes', 'initShapes', 'initEvents', 'initKnockout', 'initToolbar', 'initSocket'],

        initLabels = function () {
            var type,
                types = managerSelf.blockTypes;
            for (type in types) {
                if (types.hasOwnProperty(type)) {
                    gpl.labelCounters[types[type].blockType] = 0;
                }
            }
        },

        initPointNamePrefix = function () {
            var c,
                lastSegment,
                ret = [],
                done = false;

            for (c = 4; c > 0 && !done; c--) {
                if (gpl.point['name' + c] !== '') {
                    done = true;
                }
            }

            if (done) {
                lastSegment = c + 1;
                for (c = 1; c <= lastSegment; c++) {
                    ret.push(gpl.point['name' + c]);
                }
            }
            //else something's wrong, no blank segments

            ret = ret.join('_') + '_';

            gpl.pointNamePrefix = ret;
        },

        offsetLinePositions = function (reset, seq) {
            var list = seq.line,
                len = list.length,
                handles,
                cc,
                ccc;

            for (cc = 0; cc < len; cc++) {
                handles = list[cc].handle;
                for (ccc = 0; ccc < handles.length; ccc++) {
                    handles[ccc].x = +handles[ccc].x + (!reset ? gpl.editModeOffset : (-1 * gpl.editModeOffset));
                }

            }
        },
        offsetBlockPositions = function (reset, seq) {
            var list = seq.block,
                len = list.length,
                cc;

            for (cc = 0; cc < len; cc++) {
                list[cc].left = +list[cc].left + (!reset ? gpl.editModeOffset : (-1 * gpl.editModeOffset));
            }
        },
        offsetPositions = function (reset, seq) {
            offsetLinePositions(!!reset, seq || gpl.json);
            offsetBlockPositions(!!reset, seq || gpl.json);
        },
        init = function () {
            // var lastInit,
            var now = new Date().getTime(),
                doNextInit = function () {
                    var initFn = initFlow[currInitStep];
                    // now = new Date();

                    // if(currInitStep > 0) {
                    //     log(initFlow[currInitStep - 1], 'finished in', ((now - lastInit)/1000).toFixed(3));
                    // }

                    if (initFn !== undefined) {
                        currInitStep++;
                        setTimeout(function () {
                            // lastInit = new Date();
                            log('Running next init:' + initFn);
                            managerSelf[initFn]();
                            doNextInit();
                        }, initDelay);
                    } else {
                        log('Finished init functions');
                        managerSelf.getBoundingBox();
                        gpl.skipEventLog = false;

                        if (gpl.isEdit) {
                            $('body').addClass('editMode');
                        } else {
                            $('body').addClass('viewMode');
                        }

                        log('Finished initializing GPL Manager in', ((new Date().getTime() - started) / 1000).toFixed(3), 'seconds');

                        managerSelf.resizeWindow(true);
                        setTimeout(function () {
                            gpl.rendered = true;
                            managerSelf.resumeRender();
                            managerSelf.bindings.loaded(true);
                            gpl.fire('rendered');
                            if (window.onLoaded) {
                                window.onLoaded();
                            } else {
                                window.loaded = true;
                            }

                            managerSelf.postInit();
                        }, 100);
                    }
                },
                prop,
                c;

            managerSelf.useEditVersion = function () {
                gpl.json.block = gpl.json.editVersion.block;
                gpl.json.line = gpl.json.editVersion.line;
                managerSelf.confirmEditVersion();
            };

            managerSelf.discardEditVersion = function () {
                managerSelf.confirmEditVersion();
            };

            managerSelf.confirmEditVersion = function () {
                managerSelf.hideEditVersionModal();
                gpl.json.editVersion = {};

                doNextInit();
            };

            //fix for IE not showing window.opener when first loaded
            gpl.getPointTypes = (window.opener || window.top) && (window.opener || window.top).workspaceManager && (window.opener || window.top).workspaceManager.config.Utility.pointTypes.getAllowedPointTypes;
            gpl.workspaceManager = (window.opener || window.top) && (window.opener || window.top).workspaceManager;
            gpl._openWindow = (window.opener || window.top) && (window.opener || window.top).workspaceManager && (window.opener || window.top).workspaceManager.openWindowPositioned;
            gpl.controllers = gpl.workspaceManager.systemEnums.controllers;

            if (!gpl.point.SequenceData) {
                gpl.showMessage('Sequence data not found');
            } else {
                gpl.json = gpl.point.SequenceData.sequence;

                //forces new (hex) format, if flag exists it's already been converted/defaulted
                if (!gpl.json._convertedBG) {
                    //if existing, it's old system and needs converting
                    if (gpl.json.backgroundColor) {
                        gpl.json.backgroundColor = gpl.convertColor(gpl.json.backgroundColor);
                    } else { //doesn't exist, assign default
                        gpl.json.backgroundColor = gpl.defaultBackground;
                    }

                    gpl.json._convertedBG = true;
                }

                gpl.deviceId = gpl.point['Point Refs'][0].DevInst;

                managerSelf.backgroundColor = gpl.json.backgroundColor;

                managerSelf.state = null;
                managerSelf.editMode = false;
                managerSelf.queueRenders = true;
                managerSelf.haltRender = true;
                managerSelf.panLeft = 0;
                managerSelf.panTop = 0;
                managerSelf.lastRender = new Date().getTime();
                managerSelf.gplObjects = {};
                managerSelf.actionButtons = {};
                managerSelf.eventHandlers = {};
                managerSelf.bindings = {};
                managerSelf.shapes = [];
                managerSelf.mainCanvasElId = 'gplCanvas';
                managerSelf.$mainCanvasEl = $('#' + managerSelf.mainCanvasElId);
                managerSelf.$saveButton = $('#save');
                managerSelf.$saveForLaterButton = $('#saveForLater');
                managerSelf.$editButton = $('#edit');
                managerSelf.$cancelButton = $('#cancel');
                managerSelf.$validateButton = $('#validate');
                managerSelf.$contextMenuList = $('#jqxMenu ul');
                managerSelf.contextMenu = $('#jqxMenu').jqxMenu({
                    width: '140px',
                    // height: '140px',
                    animationShowDuration: 0,
                    animationHideDuration: 0,
                    animationShowDelay: 0,
                    // easing: 'swing',
                    autoOpenPopup: false,
                    autoCloseOnClick: true,
                    mode: 'popup',
                    theme: gpl.jqxTheme
                });
                managerSelf.tooltipFill = '#3d3d3d';
                managerSelf.tooltipFontColor = '#f4f4f4';
                managerSelf.minX = 9999;
                managerSelf.minY = 9999;
                managerSelf.maxX = 0;
                managerSelf.maxY = 0;

                managerSelf.blockTypes = {
                    //icon: cls
                    Constant: {
                        blockType: 'ConstantBlock'
                    },
                    Output: {
                        blockType: 'ControlBlock'
                    },
                    Input: {
                        blockType: 'MonitorBlock'
                    },
                    AlarmStat: {
                        blockType: 'AlarmStatus'
                    },
                    BINMDualSP: {
                        blockType: 'BinarySetPoint'
                    },
                    BINMSingleSP: {
                        blockType: 'BinarySetPoint'
                    },
                    Delay: {
                        blockType: 'Delay'
                    },
                    OneShot: {
                        blockType: 'Delay'
                    },
                    FindLargest: {
                        blockType: 'SelectValue'
                    },
                    FindSmallest: {
                        blockType: 'SelectValue'
                    },
                    Average: {
                        blockType: 'Average'
                    },
                    Sum: {
                        blockType: 'Average'
                    },
                    Add: {
                        blockType: 'Math'
                    },
                    Divide: {
                        blockType: 'Math'
                    },
                    Multiply: {
                        blockType: 'Math'
                    },
                    Subtract: {
                        blockType: 'Math'
                    },
                    AddSqrt: {
                        blockType: 'Math',
                        skipToolbar: true
                    },
                    DivideSqrt: {
                        blockType: 'Math',
                        skipToolbar: true
                    },
                    MultiplySqrt: {
                        blockType: 'Math',
                        skipToolbar: true
                    },
                    SubtractSqrt: {
                        blockType: 'Math',
                        skipToolbar: true
                    },
                    MUX: {
                        blockType: 'MUX'
                    },
                    PI: {
                        blockType: 'PI'
                    },
                    Proportional: {
                        blockType: 'PI',
                        skipToolbar: true
                    },
                    ReverseActingPI: {
                        blockType: 'PI',
                        skipToolbar: true
                    },
                    SPA: {
                        blockType: 'SPA'
                    },
                    Ramp: {
                        blockType: 'Ramp'
                    },
                    Totalizer: {
                        blockType: 'Totalizer'
                    },
                    TextBlock: {
                        blockType: 'TextBlock',
                        skipToolbar: true
                    },
                    AnalogDualSetPoint: {
                        blockType: 'AnalogSetPoint'
                    },
                    AnalogSingleSetPoint: {
                        blockType: 'AnalogSetPoint'
                    },
                    SUMWSingleSP: {
                        blockType: 'AnalogSetPoint',
                        skipToolbar: true
                    },
                    SUMWDualSP: {
                        blockType: 'AnalogSetPoint',
                        skipToolbar: true
                    },
                    Econ: {
                        blockType: 'Economizer'
                    },
                    Enthalpy: {
                        blockType: 'Enthalpy'
                    },
                    DewPoint: {
                        blockType: 'Enthalpy'
                    },
                    WetBulb: {
                        blockType: 'Enthalpy'
                    },
                    GT: {
                        blockType: 'Comparator'
                    },
                    GTEqual: {
                        blockType: 'Comparator'
                    },
                    LT: {
                        blockType: 'Comparator'
                    },
                    LTEqual: {
                        blockType: 'Comparator'
                    },
                    Equal: {
                        blockType: 'Comparator'
                    },
                    NEqual: {
                        blockType: 'Comparator'
                    },
                    Logic: {
                        blockType: 'Logic'
                    },
                    DigLogicAnd: {
                        blockType: 'DigLogic'
                    },
                    DigLogicOr: {
                        blockType: 'DigLogic'
                    },
                    DigLogicXOr: {
                        blockType: 'DigLogic'
                    }
                };

                for (c = 0; c < mergeProperties.length; c++) {
                    prop = mergeProperties[c];
                    gpl.json[prop.replace(' ', '_')] = gpl.point[prop].Value || false;
                }

                managerSelf.valueTypes = {};
                managerSelf.pointTypeLookup = {};

                gpl.forEach(gpl.blocks, function (cls, clsName) {
                    managerSelf.valueTypes[cls.prototype.pointType] = cls.prototype.valueType;
                });

                document.title = gpl.point.Name;

                initPointNamePrefix();

                if (gpl.isEdit) {
                    if (gpl.json.editVersion && gpl.json.editVersion.block) { //has edit version
                        // if(now - gpl.point._pollTime > gpl.editVersionStaleTimeout) {//stale
                        gpl.$discardEditVersionButton.click(managerSelf.discardEditVersion);
                        gpl.$useEditVersionButton.click(managerSelf.useEditVersion);
                        managerSelf.showEditVersionModal();
                        // } else {//not stale
                        //     gpl.showMessage('This sequence currently being edited');
                        // }
                        //check if stale.  if not, block changes.  if so, ask if they want to use it?
                    } else {
                        managerSelf.confirmEditVersion();
                    }
                } else {
                    doNextInit();
                }
            }
        };

    log('Initializing GPL Manager');

    gpl.skipEventLog = true;

    managerSelf.postInit = function () {
        managerSelf.postInitActionButtons();
    };

    managerSelf.offsetEverything = function (num, line, block) {
        var c,
            cc,
            handles,
            list = gpl.json.block;

        if (block !== false) {
            for (c = 0; c < list.length; c++) {
                list[c].left -= num * gpl.editModeOffset;
            }
        }

        if (line !== false) {
            list = gpl.json.line;
            for (c = 0; c < list.length; c++) {
                handles = list[c].handle;
                for (cc = 0; cc < handles.length; cc++) {
                    handles[cc].x -= num * gpl.editModeOffset;
                }
            }
        }

        // managerSelf.socket.emit('updateSequence', {
        //     sequenceName: gpl.point.Name,
        //     sequenceData: {
        //         sequence: gpl.json
        //     }
        // });

    };

    managerSelf.addToBindings = function (props) {
        managerSelf.bindings = $.extend(managerSelf.bindings, props);
    };

    managerSelf.addToBoundingRect = function (block) {
        var items = block._shapes || [],
            start = new Date(),
            item,
            left,
            top,
            right,
            bottom,
            rect,
            newHeight = managerSelf.canvasHeight,
            newWidth = managerSelf.canvasWidth,
            resizeRight = function () {
                if (newWidth < managerSelf.maxX) {
                    newWidth = managerSelf.maxX;
                }
            },
            resizeBottom = function () {
                if (newHeight < managerSelf.maxY) {
                    newHeight = managerSelf.maxY;
                }
            },
            doResizes = function () {
                if (newWidth !== managerSelf.canvasWidth || newHeight !== managerSelf.canvasHeight) {
                    managerSelf.resizeCanvas(newWidth, newHeight);
                }
            },
            processDimension = function () {
                if (left < managerSelf.minX) {
                    managerSelf.minX = left;
                }

                if (right > managerSelf.maxX) {
                    managerSelf.maxX = right;
                    resizes.push(resizeRight);
                }

                if (top < managerSelf.minY) {
                    managerSelf.minY = top;
                }

                if (bottom > managerSelf.maxY) {
                    managerSelf.maxY = bottom;
                    resizes.push(resizeBottom);
                }
            },
            resizes = [],
            c,
            cc;

        if (block instanceof gpl.Block || block instanceof gpl.blocks.TextBlock) {
            if (block.isToolbar !== true) {
                for (c = 0; c < items.length; c++) {
                    item = items[c];
                    rect = item.getBoundingRect();
                    left = rect.left;
                    top = rect.top;
                    bottom = top + rect.height;
                    right = left + rect.width;

                    if (block.isToolbar !== true) {
                        processDimension();
                    }
                }

                if (gpl.rendered === true) {
                    managerSelf.getBoundingBox();
                }

                if (resizes.length > 0) {
                    for (cc = 0; cc < resizes.length; cc++) {
                        resizes[cc]();
                    }

                    doResizes();
                }
            }
        } else {
            left = block.left;
            top = block.top;
            bottom = top + 20;
            right = left + block.text * 8;

            processDimension();
        }

        gpl.boundingRectTime += new Date() - start;
        gpl.boundingRectCount++;
    };

    managerSelf.getBoundingBox = function () {
        var top = managerSelf.minY,
            bottom = managerSelf.maxY,
            left = managerSelf.minX,
            right = managerSelf.maxX;
        // lineDefaults = {
        //     stroke: '#ffffff',
        //     strokeWidth: 2
        // };

        if (top < 0) {
            top = 0;
        }
        if (left < 0) {
            left = 0;
        }

        gpl.boundingBox = {
            top: top,
            left: left,
            bottom: bottom,
            right: right
        };

        // log('bounding box', gpl.boundingBox);

        // visual aid
        // managerSelf.canvas.add(new fabric.Line([left, top, left, bottom], lineDefaults));
        // managerSelf.canvas.add(new fabric.Line([left, bottom, right, bottom], lineDefaults));
        // managerSelf.canvas.add(new fabric.Line([right, bottom, right, top], lineDefaults));
        // managerSelf.canvas.add(new fabric.Line([right, top, left, top], lineDefaults));
    };

    managerSelf.resizeWindow = function (initial) {
        var box = gpl.boundingBox,
            right = box.right,
            bottom = box.bottom,
            verticalBuffer = 50,
            horizontalBuffer = 50,
            minHeight = 750,
            minHeightView = 550,
            minWidth = 900,
            width = right + horizontalBuffer,
            height,
            heightOffset = 70;

        if (width < minWidth) {
            width = minWidth;
        }

        if (!gpl.poppedIn) {
            if (gpl.isEdit) {
                height = (bottom + verticalBuffer > minHeight) ? bottom + verticalBuffer : minHeight;
            } else {
                height = (bottom + verticalBuffer > minHeightView) ? bottom + verticalBuffer : minHeightView;
            }

            height += heightOffset;
            managerSelf.currWidth = width;
            managerSelf.currHeight = height;

            window.resizeTo(width, height);

            if (initial) {
                managerSelf.resizeCanvas(width, height);
            }
        }
    };

    managerSelf.scale = function (value, fromBinding) {
        var currentCanvasHeight = managerSelf.canvasHeight,
            currentCanvasWidth = managerSelf.canvasWidth;

        if (!currentCanvasWidth || !currentCanvasHeight) {
            currentCanvasWidth = managerSelf.canvasWidth = parseInt(managerSelf.$mainCanvasEl.css('width'), 10);
            currentCanvasHeight = managerSelf.canvasHeight = parseInt(managerSelf.$mainCanvasEl.css('height'), 10);
        }

        if (value !== gpl.scaleValue) {
            managerSelf.pauseRender();
            gpl.scaleValue = value;

            managerSelf.canvas.setZoom(value);
            managerSelf.canvas.setWidth(currentCanvasWidth * value);
            managerSelf.canvas.setHeight(currentCanvasHeight * value);

            $('.dynamicBtn').each(function () {
                var $el = $(this),
                    origLeft = $el.data('origLeft'),
                    origTop = $el.data('origTop');

                $(this).css({
                    transform: 'scale(' + value + ')',
                    left: origLeft * value,
                    top: origTop * value
                });
            });


            if (!fromBinding) {
                managerSelf.bindings.currentZoom(Math.round(value * 100));
            }

            managerSelf.resumeRender();
        }
    };

    managerSelf.pan = function (dx, dy) {
        managerSelf.contextMenu.jqxMenu('close');
        managerSelf.hasPanned = true;

        //is boolean
        if (typeof dx === 'boolean') {
            managerSelf.panLeft = 0;
            managerSelf.panTop = 0;
        } else {
            managerSelf.panLeft += dx;
            managerSelf.panTop += dy;
        }

        managerSelf.$mainCanvasContainer.css({
            left: managerSelf.panLeft,
            top: managerSelf.panTop
        });

    };

    managerSelf.addNewPoint = function (block) {
        var windowRef,
            pointType = window.encodeURI(block.pointType),
            names = (gpl.pointNamePrefix + block.label).split('_'),
            called = false,
            name1 = names[0],
            name2 = names[1],
            name3 = names[2],
            name4 = names[3] || '',
            handler = function (obj) {
                gpl.unblockUI();
                if (obj && obj.target) { //is event
                    if (!called) {
                        log('New Point canceled, deleting block');
                        gpl.fire('deleteblock', block, true);
                        gpl.labelCounters[block.type]--;
                    }
                    return;
                }

                block.upi = obj._id;
                block.setPointData(obj, true);
                log(block.gplId, 'save callback', obj);
                gpl.fire('newblock', block);
                called = true;
            };

        if (block.isNonPoint !== true && !(block instanceof gpl.blocks.TextBlock)) {
            gpl.blockUI();

            windowRef = gpl.openWindow('/api/points/newPoint/restrictTo/' + pointType, 'New Point', '', '', 'newPoint', {
                width: 980,
                height: 280,
                gplHandler: handler
            });

            windowRef.attach = {
                saveCallback: handler,
                point: {
                    name1: name1,
                    name2: name2,
                    name3: name3,
                    name4: name4
                }
            };
        } else {
            gpl.fire('newblock', block);
        }
    };

    managerSelf.doSave = function () {
        var saveObj,
            isValid,
            finish = function () {
                managerSelf.socket.emit('updateSequence', {
                    sequenceName: gpl.point.Name,
                    sequenceData: {
                        sequence: gpl.json
                    }
                });

                offsetPositions(false);

                if (gpl.point._pStatus === 1) {
                    managerSelf.socket.emit('addPoint', {
                        point: gpl.point
                    });
                }

                managerSelf.resumeRender();

                gpl.hasEdits = false;

                log('save complete');

                gpl.captureThumbnail();
            };

        gpl.blockUI();
        gpl.waitForSocketMessage(gpl.unblockUI);

        saveObj = gpl.blockManager.getSaveObject();
        isValid = managerSelf.validate();

        if (isValid) {
            // log(saveObj);

            managerSelf.pauseRender();

            gpl.fire('save');

            managerSelf.socket.emit('updateSequencePoints', saveObj);

            managerSelf.embedActionButtons();

            offsetPositions(true); //resets/removes offset

            finish();
        } else {
            gpl.showMessage(gpl.validationMessage);
        }
    };

    managerSelf.doSaveForLater = function () {
        gpl.blockUI();
        gpl.waitForSocketMessage(gpl.unblockUI);
        gpl.fire('saveForLater');

        managerSelf.embedActionButtons(gpl.json.editVersion);

        offsetPositions(true, gpl.json.editVersion);
        offsetPositions(true);

        managerSelf.socket.emit('updateSequence', {
            sequenceName: gpl.point.Name,
            sequenceData: {
                sequence: gpl.json
            }
        });

        offsetPositions(false, gpl.json.editVersion);
        offsetPositions(false);
    };

    managerSelf.embedActionButtons = function (obj) {
        var ret = obj || gpl.json,
            buttons = [];

        gpl.forEach(managerSelf.actionButtons, function (actionButton, id) {
            buttons.push(actionButton.getExportData());
        });

        ret.dynamic = buttons;
    };

    managerSelf.postInitActionButtons = function () {
        gpl.forEach(managerSelf.actionButtons, function (button) {
            button.postInit();
        });
    };

    managerSelf.doEdit = function () {
        var endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint('Sequence', gpl.upi),
            url = endPoint.edit.url;

        gpl.openWindow(url, gpl.point.Name, 'Sequence', '', gpl.upi);
    };

    managerSelf.doCancel = function () {
        var endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint('Sequence', gpl.upi),
            url = endPoint.review.url;

        gpl.openWindow(url, gpl.point.Name, 'Sequence', '', gpl.upi);
    };

    managerSelf.popInOut = function () {
        var _target = 'mainWindow';

        if (gpl.poppedIn) {
            _target = '';
        }

        gpl._openWindow(window.location.href, gpl.point.Name, 'Sequence', _target, gpl.upi);

        gpl.poppedIn = !gpl.poppedIn;

        return false;
    };

    managerSelf.popInOutText = function () {
        if (gpl.poppedIn) {
            return 'Pop Out';
        }
        return 'Pop In';
    };

    managerSelf.popInOutClass = function () {
        if (gpl.poppedIn) {
            return 'fa-arrow-circle-up';
        }
        return 'fa-arrow-circle-down';
    };

    managerSelf.sequenceLoaded = ko.observable(false);

    managerSelf.validate = function () {
        var valid = gpl.blockManager.validateAll();

        // gpl.showMessage(gpl.validationMessage || (valid?'':'In') + 'valid');
        // gpl.validationMessage = null;
        return valid;
    };

    managerSelf.getObject = function (config) {
        var start = new Date().getTime(),
            gap,
            gplType = config.gplType,
            yoffset = (config.yoffset || 0),
            xoffset = (config.xoffset || 0),
            left = config.left + managerSelf.panLeft,
            top = config.top + managerSelf.panTop,
            x1,
            x2,
            y1,
            y2,
            multiple = config.multiple || false,
            objects = managerSelf.canvas.getObjects(),
            c,
            len = objects.length,
            obj,
            ret = [],
            found = false;

        for (c = 0; c < len && !found; c++) {
            obj = objects[c];
            if (!gplType || (gplType === obj.gplType)) {
                if (obj.gplType === 'line') {
                    x1 = Math.ceil(Math.min(obj.x1, obj.x2) + xoffset);
                    x2 = Math.ceil(Math.max(obj.x2, obj.x1) + xoffset);
                    y1 = Math.ceil(Math.min(obj.y1, obj.y2) + yoffset);
                    y2 = Math.ceil(Math.max(obj.y2, obj.y1) + yoffset);
                    if (obj.strokeWidth > 1) {
                        if (x1 === x2) { //vertical
                            x1 += obj.strokeWidth;
                            x2 += obj.strokeWidth;
                        } else { //horizontal
                            y1 += obj.strokeWidth;
                            y2 += obj.strokeWidth;
                        }
                    }
                    if ((left >= x1 && left <= x2) && (top >= y1 && top <= y2)) {
                        ret.push(obj);
                        if (!multiple) {
                            found = true;
                        }
                    }
                } else {
                    if (left - managerSelf.panLeft >= obj.left && left - managerSelf.panLeft <= (obj.left + obj.width) && top - managerSelf.panTop >= obj.top && top - managerSelf.panTop <= (obj.top + obj.height)) {
                        ret.push(obj);
                        if (!multiple) {
                            found = true;
                        }
                    }
                }
            }
        }

        gap = new Date().getTime() - start;
        managerSelf._getObjectCount++;
        managerSelf._getObjectTime += gap;
        return multiple ? ret : ret[0];
    };

    managerSelf.resizeCanvas = function (currWidth, currHeight, isWindowResize) {
        var start = new Date().getTime(),
            resizeDelay = gpl.resizeDelay,
            prevResize = managerSelf.lastCanvasResize || start - resizeDelay,
            doResize = function (now) {
                var width = currWidth || window.innerWidth,
                    height = currHeight || window.innerHeight;

                managerSelf.canvasResizing = true;
                managerSelf.canvasWidth = width;
                managerSelf.canvasHeight = height;
                managerSelf.canvas.setWidth(width);
                managerSelf.canvas.setHeight(height);
                managerSelf.canvas.calcOffset();
                // if(gpl.isEdit) {
                // managerSelf.toolbarCanvas.setWidth(width);
                // managerSelf.toolbarCanvas.setHeight(height);
                // managerSelf.toolbarCanvas.calcOffset();
                // }
                managerSelf.lastCanvasResize = new Date().getTime();
                managerSelf.canvasResizing = false;
            },
            checkQueue = function () {
                var now = new Date().getTime();

                if (now - managerSelf.lastCanvasResize >= resizeDelay) { //only the one call
                    doResize();
                }
            };

        if (!isWindowResize) {
            if (currWidth < managerSelf.canvas.width && currHeight < managerSelf.canvas.height) {
                return;
            }
        }

        managerSelf.lastWindowResize = start;

        if (start - prevResize >= resizeDelay && !managerSelf.canvasResizing) {
            doResize();
        } else {
            setTimeout(function () {
                checkQueue();
            }, resizeDelay);
        }
    };

    managerSelf.renderAll = function () {
        var now = new Date().getTime();

        managerSelf.lastRender = now;

        if (!managerSelf.haltRender) {
            // log('Rendering');
            managerSelf.canvas.renderAll();
            if (gpl.isEdit) {
                gpl.canvases.toolbar.renderAll();
            }
        }
    };

    managerSelf.pauseRender = function () {
        managerSelf.haltRender = true;
    };

    managerSelf.resumeRender = function () {
        managerSelf.haltRender = false;
        managerSelf.renderAll();
    };

    managerSelf.setState = function (state) {
        // managerSelf.canvas.selection = false;
        managerSelf.state = state;
    };

    managerSelf.clearState = function () {
        // managerSelf.canvas.selection = true;
        managerSelf.state = null;
    };

    managerSelf.registerHandler = function (config) {
        var event = config.event,
            handler = config.handler,
            parameters = [],
            type = config.type || 'canvas',
            targetCanvas = config.canvas || managerSelf.canvas,
            selector = config.selector,
            state = config.state || null,
            domType = config.window ? window : document,
            $domType = $(domType),
            makeHandler = function (handler, state) {
                if (state) {
                    return function (event) {
                        var currState = gpl.manager.state;

                        if (currState === state) {
                            handler(event);
                        }
                    };
                }

                return handler;
            };

        managerSelf.eventHandlers[event] = managerSelf.eventHandlers[event] || [];
        managerSelf.eventHandlers[event].push(makeHandler(handler, state));

        if (!configuredEvents[event]) {
            configuredEvents[event] = true;
            if (type === 'canvas') {
                targetCanvas.on(event, function (evt) {
                    managerSelf.processEvent(event, evt);
                });
            } else {
                parameters = [event, function (evt) {
                    managerSelf.processEvent(event, evt);
                }];

                if (selector) {
                    parameters.splice(1, 0, selector);
                }
                $domType.on.apply($domType, parameters);
            }
        }
    };

    managerSelf.registerHandlers = function (handlers) {
        var c,
            len = handlers.length;

        for (c = 0; c < len; c++) {
            managerSelf.registerHandler(handlers[c]);
        }
    };

    managerSelf.unregisterHandler = function (config) {
        var event = config.event,
            handler = config.handler,
            c,
            handlers = managerSelf.eventHandlers[event] || [];

        for (c = handlers.length - 1; c >= 0; c--) {
            if (handlers[c] === handler) {
                handlers.splice(c, 1);
            }
        }
    };

    managerSelf.unregisterHandlers = function (handlers) {
        var c,
            len = handlers.length;

        for (c = 0; c < len; c++) {
            managerSelf.unregisterHandler(handlers[c]);
        }
    };

    managerSelf.processEvent = function (type, event) {
        var c,
            handlers = managerSelf.eventHandlers[type] || [],
            len = handlers.length;

        for (c = 0; c < len; c++) {
            handlers[c](event);
        }
    };

    // managerSelf.handleMouseOver = function(event) {
    //     var target = gpl.blockManager.getBlock(event.target.gplId),
    //         text,
    //         pointer = managerSelf.canvas.getPointer(event.e),
    //         x,
    //         y;

    //     // if(event.target === managerSelf.tooltip || (target && event.target.gplId && !target.isToolbar)) {//} && target.gplId !== managerSelf._hoveredTarget.gplId) {
    //     if(target && event.target.gplId && !target.isToolbar) {
    //         // x = target.left;
    //         // y = target.top - managerSelf.tooltip.height;
    //         x = pointer.x;
    //         y = pointer.y;
    //         // log('mouse over gplId', event.target.gplId, target);
    //         // log(gpl.point.Name, '-', target.tooltip || target.label);
    //         text = target?(target.tooltip || target.label):null;
    //         managerSelf._hoveredTarget = target;
    //         text = gpl.pointUpiMap[upi]
    //         gpl.pointUpiMap[upi]
    //         managerSelf.updateTooltip(text, x, y);
    //     } else {
    //         // if(event.target !== managerSelf.tooltip) {
    //             // log(target, event.target);
    //             managerSelf.clearTooltip();
    //         // }
    //     }
    // };

    managerSelf.doAddNewButton = function (config) {
        var offset = gpl.isEdit?gpl.editModeOffset:0,
            actionButton;

        if (config.caption !== undefined) {
            config.left += offset;
        }

        actionButton = new gpl.ActionButton(config);

        managerSelf.addToBoundingRect(actionButton);

        managerSelf.actionButtons[actionButton.id] = actionButton;

        $('body').append(actionButton.$el);
    };

    managerSelf.deleteButton = function (button) {
        var $el = button.$el,
            id = button.id;

        button.destroy();

        delete managerSelf.actionButtons[id];

        $el.remove();
    };

    managerSelf.handleMouseOut = function (e) {
        // log('mouse out', e);
        if (managerSelf._hoveredTarget && e.target !== managerSelf.tooltip) {
            managerSelf._hoveredTarget = null;
            // managerSelf.clearTooltip();
        }
    };

    managerSelf.openContextMenu = function (left, top, event) {
        var obj = managerSelf.getObject({
                left: left,
                top: top,
                yoffset: 5,
                xoffset: 5
            }),
            getters = {
                line: gpl.lineManager.getLine,
                block: gpl.blockManager.getBlock,
                text: function (id) {
                    return gpl.texts[id];
                }
            },
            getter,
            gplObj;

        if (managerSelf.state !== 'DrawingLine' && !managerSelf.modalOpen && !managerSelf.hasPanned) {
            managerSelf.$contextMenuList.removeClass('block line default nonPoint');

            if (obj) {
                getter = getters[obj.gplType];
                if (getter) {
                    managerSelf.$contextMenuList.addClass(obj.gplType);
                } else {
                    managerSelf.$contextMenuList.addClass('block');
                    getter = getters.block;
                }
                if (obj.blockType === 'Constant') {
                    managerSelf.$contextMenuList.addClass('nonPoint');
                }
                gplObj = getter(obj.gplId);
            } else {
                managerSelf.$contextMenuList.addClass('default');
            }

            managerSelf.contextMenu.jqxMenu('open', left - 5, top - 5);
            managerSelf.contextX = left;
            managerSelf.contextY = top;
            managerSelf.contextObject = gplObj;
        }
    };

    managerSelf.destroy = function () {
        var c,
            len = (gpl.destroyFns || []).length;

        if (window.destroyed !== true) {
            window.destroyed = true;
            if (managerSelf.toolbar) {
                gpl.destroyObject(managerSelf.toolbar);
                delete managerSelf.toolbar;
            }

            gpl.forEach(gpl.eventHandlers, function (handlers) {
                handlers = [];
            });

            managerSelf.canvas.removeListeners();
            managerSelf.canvas.dispose();

            for (c = 0; c < len; c++) {
                gpl.destroyFns[c]();
            }

            delete gpl.eventHandlers;
            delete gpl.blockManager;
            delete gpl.lineManager;
            delete window.gplData.upi;
            delete window.gplData.point;
            delete window.gplData.references;
            // delete window.gplData.controllers;
            delete window.gplData;
            gpl.destroyObject(gpl);
            gpl = {};
            $(document).off();
            $(window).off();
            $(managerSelf.canvas.wrapperEl).remove();
            $('body').html('');
        }
    };

    managerSelf.handleNavigateAway = function (event) {
        if (gpl.hasEdits) {
            return 'You have unsaved changes. Are you sure you want to leave this page?';
        }

        managerSelf.destroy();
    };

    managerSelf.updateTooltip = function (text, x, y) {
        if (!managerSelf.modalOpen && text !== undefined) {
            gpl.$tooltip.html(text);

            gpl.$tooltip.css({
                left: x + 15,
                top: y + 15,
                display: 'block'
            });
        } else {
            managerSelf.clearTooltip();
        }
        // if(text) {
        //     managerSelf.tooltip.setText(text);
        // }
        // managerSelf.tooltip.set({
        //     visible: true,
        //     left: x + 15,
        //     top: y + 15
        // });
        // managerSelf.tooltipRect.set({
        //     visible: true,
        //     left: x + 10,
        //     top: y + 10,
        //     width: managerSelf.tooltip.width + 10
        // });
        // managerSelf.bringToFront(managerSelf.tooltipRect);
        // managerSelf.bringToFront(managerSelf.tooltip);
        // managerSelf.renderAll();
        // log('updating tooltip', text);
    };

    managerSelf.clearTooltip = function () {
        gpl.$tooltip.css('display', 'none');
        // managerSelf.tooltip.set('visible', false);
        // managerSelf.tooltipRect.set('visible', false);
        // managerSelf.renderAll();
        // log('clearing tooltip');
    };

    managerSelf.showEditVersionModal = function () {
        gpl.$editVersionModal.modal({
            keyboard: false,
            backdrop: 'static'
        });
        gpl.$editVersionModal.modal('show');
    };

    managerSelf.hideEditVersionModal = function () {
        gpl.$editVersionModal.modal('hide');
    };

    managerSelf.initBindings = function () {
        var handlers = {
                deviceDescription: function (val) {
                    gpl.point.Description.Value = val; //validate?
                }
            },
            syncDeviceProperties = function () {
                var props = ko.toJS(managerSelf.bindings),
                    devicePoint = gpl.devicePointRef;

                gpl.point.Description.Value = props.deviceDescription;
                devicePoint.pointName = props.deviceName;
                devicePoint.DevInst = devicePoint.PointInst = devicePoint.Value = props.deviceUpi;
            };

        managerSelf.addToBindings({
            isEdit: gpl.isEdit,
            loaded: managerSelf.sequenceLoaded,

            backgroundColor: ko.observable(managerSelf.backgroundColor),
            deviceBackgroundColor: ko.observable(managerSelf.backgroundColor),

            popInOut: managerSelf.popInOut,
            popInOutText: managerSelf.popInOutText,
            popInOutClass: managerSelf.popInOutClass,

            controllers: gpl.controllers,

            currentZoom: ko.observable(Math.round(100 * gpl.scaleValue)),

            resetZoom: function () {
                managerSelf.scale(1);
                managerSelf.pan(true);
            },

            editActionButton: function () {
                var editBlock = managerSelf.editBlock,
                    pointName = editBlock.pointName,
                    parameter = editBlock.parameter,
                    type = editBlock.type,
                    upi = editBlock.upi,
                    text = editBlock.text;

                managerSelf.bindings.actionButtonPointName(pointName);
                managerSelf.bindings.actionButtonText(text);
                managerSelf.bindings.actionButtonParameter(parameter);
                managerSelf.bindings.actionButtonType(type);
                managerSelf.bindings.actionButtonPointType(editBlock.pointType);


                gpl.$editActionButtonModal.modal('show');
            },

            sendActionButtonValue: function () {
                var value = parseFloat(managerSelf.bindings.actionButtonValue());

                managerSelf.editBlock.sendValue(value);

                gpl.$editActionButtonValueModal.modal('hide');
            },

            openReport: function () {
                var bindings = managerSelf.bindings;

                managerSelf.editBlock.openReport({
                    reportType: bindings.actionButtonReportType(),
                    duration: bindings.actionButtonReportDuration(),
                    fromDate: bindings.reportFromDate(),
                    fromTime: bindings.reportFromTime(),
                    toDate: bindings.reportToDate(),
                    toTime: bindings.reportToTime()
                });
            },

            updateActionButton: function () {
                var bindings = managerSelf.bindings,
                    pointName = bindings.actionButtonPointName(),
                    text = bindings.actionButtonText(),
                    type = bindings.actionButtonType(),
                    parameter = parseFloat(bindings.actionButtonParameter()),
                    upi = bindings.actionButtonUpi();

                if (isNaN(parameter)) {
                    parameter = bindings.actionButtonParameter();
                }

                managerSelf.editBlock.updateConfig({
                    actionPoint: upi,
                    caption: text,
                    actionParm: parameter,
                    pointName: pointName,
                    type: type
                });

                gpl.$editActionButtonModal.modal('hide');
            },

            deleteActionButton: function () {
                managerSelf.deleteButton(managerSelf.editBlock);
                gpl.$editActionButtonModal.modal('hide');
            },

            selectActionButtonPoint: function () {
                gpl.openPointSelector(function (upi, name, pointType) {
                    managerSelf.bindings.actionButtonPointName(name);
                    managerSelf.bindings.actionButtonUpi(upi);
                    managerSelf.bindings.actionButtonPointType(pointType);
                }, null, null, null, true);
            },

            showBackgroundColorModal: function () {
                gpl.$colorpickerModal.modal('show');
            },

            hideBackgroundColorModal: function () {
                managerSelf.bindings.deviceBackgroundColor(managerSelf.bindings.backgroundColor());
                gpl.$colorpickerModal.modal('hide');
            },

            updateBackgroundColor: function () {
                var val = managerSelf.bindings.deviceBackgroundColor();
                managerSelf.bindings.backgroundColor(val);
                managerSelf.canvas.backgroundColor = '#' + val;
                // managerSelf.bindings.hideBackgroundColorModal();
                gpl.json.backgroundColor = val;
                managerSelf.renderAll();
            },

            applyShowLabel: function () {
                var bool = managerSelf.bindings.deviceShowLabel();
                managerSelf.pauseRender();
                gpl.blockManager.applyShowLabel(bool);
                managerSelf.resumeRender();
            },

            applyShowValue: function () {
                var bool = managerSelf.bindings.deviceShowValue();
                managerSelf.pauseRender();
                gpl.blockManager.applyShowValue(bool);
                managerSelf.resumeRender();
            },

            applyUpdateInterval: function () {
                var interval = managerSelf.bindings.deviceUpdateIntervalMinutes() * 60 + managerSelf.bindings.deviceUpdateIntervalSeconds();

                gpl.blockManager.applyUpdateInterval(interval);
            },

            applyController: function () {
                var controllerValue = managerSelf.bindings.deviceControllerValue(),
                    controllerName = gpl.controllers[controllerValue].name;

                gpl.blockManager.applyController(controllerName, controllerValue);
            },

            sequenceName: gpl.point.Name,
            deviceName: ko.observable(gpl.devicePoint.Name),
            deviceUpi: ko.observable(gpl.devicePointRef.PointInst),
            deviceDescription: ko.observable(gpl.point.Description.Value),

            deviceControllerName: ko.observable(gpl.point.Controller.Value),
            deviceControllerValue: ko.observable(gpl.point.Controller.eValue),

            deviceShowLabel: ko.observable(gpl.point['Show Label'].Value),
            deviceShowValue: ko.observable(gpl.point['Show Value'].Value),

            deviceUpdateIntervalSeconds: ko.observable(+gpl.point['Update Interval'].Value % 60),
            deviceUpdateIntervalMinutes: ko.observable(Math.floor(+gpl.point['Update Interval'].Value / 60)),

            updateSequenceProperties: function () {
                var props = ko.toJS(managerSelf.bindings);

                gpl.point['Update Interval'].Value = props.deviceUpdateIntervalMinutes * 60 + props.deviceUpdateIntervalSeconds;
                gpl.point['Show Label'].Value = props.deviceShowLabel;
                gpl.point['Show Value'].Value = props.deviceShowValue;
                gpl.point.Description.Value = props.deviceDescription;
                gpl.point.Controller.Value = props.deviceControllerName;
                gpl.point.Controller.eValue = props.deviceControllerValue;
                managerSelf.bindings.updateBackgroundColor();

                console.log('update', props);
                gpl.$sequencePropertiesModal.modal('hide');
            },
            showUpdateSequenceModal: function () {
                if (gpl.isEdit) {
                    gpl.$sequencePropertiesModal.modal('show');
                }
            },
            selectDevicePoint: function () {
                gpl.openPointSelector(function (upi, name) {
                    managerSelf.bindings.deviceName(name);
                    managerSelf.bindings.deviceUpi(upi);
                }, null, 'Device', 'Device Point');
            },

            addNewButton: function () {
                var id = gpl.makeId(),
                    config = {
                        left: managerSelf.contextX,
                        top: managerSelf.contextY
                    };

                managerSelf.doAddNewButton(config);
            },

            addNewDynamic: function () {
                log('NewDynamic');
            },

            addNewText: function () {
                var newBlock = gpl.blockManager.create({
                    cls: gpl.blocks.TextBlock,
                    cfg: {
                        left: (managerSelf.contextX - 15) / gpl.scaleValue, //10 in textblock
                        top: (managerSelf.contextY - 10) / gpl.scaleValue, //5 in textblock
                        text: 'Text'
                    }
                });
                gpl.blockManager.openTextEditor(newBlock);
            }
        });

        managerSelf.bindings.currentZoom.subscribe(function (newValue) {
            managerSelf.scale(newValue / 100, true);
        });

        managerSelf.bindings.backgroundColorHex = ko.computed(function () {
            var color = '#' + managerSelf.bindings.backgroundColor();

            if (!gpl.isEdit) {
                gpl.$body.css('background-color', color);
            }

            return color;
        });

        managerSelf.$saveButton.click(function () {
            managerSelf.doSave();
        });

        managerSelf.$saveForLaterButton.click(function () {
            managerSelf.doSaveForLater();
        });

        managerSelf.$editButton.click(function () {
            managerSelf.doEdit();
        });

        managerSelf.$cancelButton.click(function () {
            managerSelf.doCancel();
        });

        managerSelf.$validateButton.click(function () {
            managerSelf.validate();
        });

        gpl.$messageModal.modal({
            show: false
        });

        ko.bindingHandlers.colorpicker = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor(),
                    hexColor = ko.unwrap(value),
                    getTextElementByColor = function (color) {
                        if (color === 'transparent' || color.hex === "") {
                            return $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>transparent</div>");
                        }
                        var newEl = $("<div style='text-shadow: none; position: relative; padding-bottom: 2px; margin-top: 2px;'>#" + color.hex + "</div>"),
                            nThreshold = 105,
                            bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114),
                            foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';

                        newEl.css('color', foreColor);
                        newEl.css('background', "#" + color.hex);
                        newEl.addClass('jqx-rc-all');
                        return newEl;
                    },
                    el = $(element),
                    parent = el.parent();

                value.subscribe(function (newVal) {
                    el.jqxColorPicker('setColor', newVal);
                });

                el.jqxColorPicker({
                    colorMode: 'hue',
                    width: 220,
                    height: 200
                });

                el.jqxColorPicker('setColor', hexColor);

                // parent.jqxDropDownButton({
                //     width: 150,
                //     height: 22
                // });

                // parent.jqxDropDownButton('setContent', getTextElementByColor(new $.jqx.color({
                //     hex: hexColor
                // })));

                el.on('colorchange', function (event) {
                    value(event.args.color.hex);
                    // parent.jqxDropDownButton('setContent', getTextElementByColor(event.args.color));
                });

            }
        };

        ko.bindingHandlers.numeric = {
            init: function (element, valueAccessor) {
                $(element).on("keydown", function (event) {
                    // Allow: backspace, delete, tab, escape, and enter
                    if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
                        // Allow: Ctrl+A
                        (event.keyCode == 65 && event.ctrlKey === true) ||
                        // Allow: . ,
                        (event.keyCode == 188 || event.keyCode == 190 || event.keyCode == 110) ||
                        // Allow: home, end, left, right
                        (event.keyCode >= 35 && event.keyCode <= 39)) {
                        // let it happen, don't do anything
                        return;
                    }
                    else {
                        // Ensure that it is a number and stop the keypress
                        if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
                            event.preventDefault();
                        }
                    }
                });
            }
        };

        ko.bindingHandlers.datepicker = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var options = {
                    autoclose: true,
                    startView: 'year',
                    onSelect: function (txt, inst) {
                        valueAccessor()(new Date(txt));
                    }
                };
                $(element).datepicker(options);
            },
            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                $(element).datepicker("setDate", value);
            }
        };

        ko.bindingHandlers.clockpicker = {
            init: function (element, valueAccessor, allBindingsAccessor) {
            //initialize clockpicker with some optional options
                var observable = valueAccessor(),
                    options = {
                        doneText: 'Done',
                        autoclose: true,
                        afterDone: function () {
                            observable($(element).val());
                        }
                    };

                $(element).clockpicker(options);

                $(element).change(function (event) {
                    $(element).clockpicker('resetclock');
                });
            },

            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    hr,
                    min;

                if (typeof value !== 'string') {
                    hr = ('00' + Math.floor(value / 100)).slice(-2);
                    min = ('00' + value % 100).slice(-2);
                    $(element).val(hr + ':' + min);
                } else {
                    $(element).val(value);
                }
            }
        };
    };

    managerSelf.initCanvas = function () {
        var editConfig = {
                renderOnAddRemove: false,
                selection: false, //group selection
                backgroundColor: '#' + managerSelf.backgroundColor,
                hasControls: false,
                hoverCursor: 'default'
            },
            toolbarConfig = {
                renderOnAddRemove: false,
                selection: false,
                hasControls: false,
                hoverCursor: 'default'
            },
            viewConfig = {
                renderOnAddRemove: false,
                backgroundColor: '#' + managerSelf.backgroundColor,
                hasControls: false,
                selection: false,
                draggable: false,
                hoverCursor: 'default'
            };

        fabric.Group.prototype.hasControls = false;
        fabric.Group.prototype.removeWithoutUpdate = function (object) {
            this._moveFlippedObject(object);
            this._restoreObjectsState();

            // since _restoreObjectsState set objects inactive
            this.forEachObject(this._setObjectActive, this);

            this.remove(object);
            this._calcBounds();
            this._updateObjectsCoords();

            return this;
        };

        fabric.Group.prototype.doRemoveUpdates = function () {
            this.forEachObject(this._setObjectActive, this);
            this._calcBounds();
            this._updateObjectsCoords();
        };

        fabric.Group.prototype.addMultipleWithUpdate = function () {
            this.forEachObject(this.addWithUpdate, this);
        };

        fabric.Canvas.prototype._renderAll = fabric.Canvas.prototype.renderAll;

        fabric.Canvas.prototype.renderAll = function () {
            if (!managerSelf.haltRender) {
                this._renderAll();
            }
        };

        managerSelf.$mainCanvasEl.attr({
            width: window.innerWidth || 1024,
            height: window.innerHeight || 800
        });

        if (gpl.isEdit) {
            managerSelf.canvas = new fabric.Canvas(managerSelf.mainCanvasElId, editConfig);
            gpl.canvases.main = managerSelf.canvas;
            managerSelf.toolbarCanvas = new fabric.Canvas('toolbarCanvas', toolbarConfig);
            gpl.canvases.toolbar = managerSelf.toolbarCanvas;
        } else {
            if (gpl.nobg) {
                delete viewConfig.backgroundColor;
            }
            managerSelf.canvas = new fabric.Canvas(managerSelf.mainCanvasElId, viewConfig);
            gpl.canvases.main = managerSelf.canvas;
        }

        managerSelf.$mainUpperCanvas = $('#' + managerSelf.mainCanvasElId + ' + .upper-canvas');
        managerSelf.$mainCanvasContainer = $('#' + managerSelf.mainCanvasElId).parent();

        managerSelf._getObjectCount = 0;
        managerSelf._getObjectTime = 0;

        // if(gpl.isEdit) {
        // managerSelf.coordinateText = new fabric.Text('x,x', {
        //     top: 0,
        //     left: window.innerWidth - 200,
        //     textAlign: 'center',
        //     fontSize: 12,
        //     fontFamily: 'arial',
        //     gplType: 'label'
        // });

        // managerSelf.canvas.add(managerSelf.coordinateText);

        // managerSelf.registerHandler({
        //     event: 'mouse:move',
        //     handler: function(event) {
        //         var pointer = managerSelf.canvas.getPointer(event.e);
        //         managerSelf.coordinateText.text = pointer.x + ',' + pointer.y;
        //         managerSelf.renderAll();
        //     }
        // });
        // }

        managerSelf.showCoordinateText = function () {
            managerSelf.coordinateText = new fabric.Text('x,x', {
                top: 0,
                left: window.innerWidth - 200,
                textAlign: 'center',
                fontSize: 12,
                fontFamily: 'arial',
                gplType: 'label'
            });

            managerSelf.canvas.add(managerSelf.coordinateText);

            managerSelf.registerHandler({
                event: 'mouse:move',
                handler: function (event) {
                    var pointer = managerSelf.canvas.getPointer(event.e);
                    managerSelf.coordinateText.text = Math.round(pointer.x) + ',' + Math.round(pointer.y);
                    managerSelf.renderAll();
                }
            });
        };

        fabric.Canvas.prototype.sendToBackGPL = function (obj) {
            fabric.util.removeFromArray(this._objects, obj);
            this._objects.unshift(obj);
        };

        fabric.Canvas.prototype.bringToFrontGPL = function (obj) {
            fabric.util.removeFromArray(this._objects, obj);
            this._objects.push(obj);
        };

        managerSelf.sendToBack = function (obj) {
            managerSelf.canvas.sendToBackGPL(obj);
        };

        managerSelf.bringToFront = function (obj, canvas) {
            (canvas || managerSelf.canvas).bringToFrontGPL(obj);
        };

        // managerSelf.tooltip = new fabric.IText('', {
        //     // backgroundColor: managerSelf.tooltipFill,
        //     fill: managerSelf.tooltipFontColor,
        //     fontSize: 12,
        //     fontFamily: 'arial',
        //     fontWeight: 'normal',
        //     // width: 30,
        //     lineHeight: 1,
        //     // padding: 150,
        //     selectable: false,
        //     evented: false,
        //     visible: false
        // });

        // managerSelf.tooltipRect = new fabric.Rect({
        //     fill: managerSelf.tooltipFill,
        //     height: 22,
        //     width: 25,
        //     selectable: false,
        //     evented: false,
        //     visible: false,
        //     rx: 3,
        //     ry: 3
        // });

        // managerSelf.canvas.add(managerSelf.tooltip);
    };

    managerSelf.initToolbar = function () {
        if (gpl.isEdit) {
            managerSelf.toolbar = new gpl.Toolbar(managerSelf);
        }
    };

    managerSelf.initManagers = function () {
        gpl.blockManager = new gpl.BlockManager(managerSelf);
        gpl.lineManager = new gpl.LineManager(managerSelf);
    };

    managerSelf.initQualityCodes = function () {
        var codes = gpl._qualityCodes.Entries,
            c,
            code;

        gpl.qualityCodes = {};

        for (c = 0; c < codes.length; c++) {
            code = codes[c];

            gpl.qualityCodes[code['Quality Code Label']] = {
                color: code['Quality Code Font HTML Color'],
                text: code['Quality Code']
            };
        }
    };

    managerSelf.initShapes = function () {
        var sequence = gpl.json,
            lines = sequence.line || [],
            blocks = sequence.block || [],
            dynamics = sequence.dynamic || [],
            found = false,
            dynamic,
            block,
            blocktype,
            blockCfg,
            handles,
            handle,
            coords,
            config,
            newLine,
            newBlock,
            $btn,
            c,
            cc;

        initLabels();

        if (gpl.isEdit) {
            offsetPositions();
        }

        for (c = 0; c < dynamics.length; c++) {
            dynamic = dynamics[c];
            managerSelf.doAddNewButton(dynamic);
        }

        for (c = 0; c < blocks.length; c++) {
            block = blocks[c];
            block._idx = c;
            blockCfg = managerSelf.blockTypes[block.blockType || block.type];

            if (blockCfg) {
                blocktype = blockCfg.blockType;

                if (blocktype && gpl.blocks[blocktype]) {
                    found = true;

                    if (gpl.blockManager.isActiveUPI(block, gpl.blocks[blocktype])) {
                        config = $.extend(true, {}, block);
                        config.iconType = block.blockType;
                        config._idx = c;

                        if (!gpl.isEdit) {
                            config.selectable = false;
                            config.draggable = false;
                            config.lockMovementX = true;
                            config.lockMovementY = true;
                        }

                        newBlock = gpl.blockManager.create({
                            cls: gpl.blocks[blocktype],
                            cfg: config
                        });

                        block.gplId = newBlock.gplId;
                    }
                }
            }

            if (!found) {
                log('******* ERROR: block type', block.blockType, 'not found *******');
            }

            found = false;
        }

        for (c = 0; c < lines.length; c++) {
            coords = [];
            handles = lines[c].handle;

            for (cc = 0; cc < handles.length; cc++) {
                handle = handles[cc];
                coords.push({
                    x: handle.x,
                    y: handle.y
                });
            }

            newLine = new gpl.ConnectionLine(coords, managerSelf.canvas);
            managerSelf.shapes.push(newLine);
        }

        managerSelf.renderAll();
    };

    managerSelf.initKnockout = function () {
        ko.applyBindings(managerSelf.bindings);
    };

    managerSelf.initSocket = function () {
        if (!gpl.noSocket) {
            var socket = io.connect(window.location.origin);

            managerSelf.socket = gpl.socket = socket;

            managerSelf.pauseRender();

            socket.on('connect', function () {
                var sess = {};
                sess.socketid = socket.id;
                sess.display = {};
                sess.display['Screen Objects'] = gpl.blockManager.screenObjects;

                if (!gpl.isEdit) {
                    socket.emit('displayOpen', {
                        data: sess
                    });
                }
            });

            managerSelf.keepAliveInterval = setInterval(function () {
                $.ajax({
                    url: '/home'
                }).done(function (data) {
                    return; //gpl.log('heartbeat');
                });
            }, 1000 * 60 * 15);

            socket.on('recieveUpdate', function (dynamic) {
                var upi = dynamic.upi,
                    dyn = dynamic.dynamic;

                gpl.blockManager.processValue(upi, dyn);
            });

            socket.on('sequenceUpdateMessage', function (message) {
                gpl.showMessage('Sequence Saved');
            });

            socket.on('sequencePointsUpdated', function (data) {
                gpl.blockManager.resetChanges();
                // gpl.showMessage(JSON.stringify(data, null, 3));
            });

            managerSelf.registerHandler({
                event: 'unload',
                handler: function () {
                    socket.disconnect();
                },
                type: 'DOM',
                window: true
            });

            managerSelf.keepAliveInterval = (function () {
                var ret,
                    fn = function () {
                        socket.emit('doRefreshSequence', {
                            sequenceID: gpl.upi
                        });
                    };

                fn();

                ret = setInterval(fn, 1000 * 60 * 5);
                return ret;
            }());

        }
    };

    managerSelf.initEvents = function () {
        window.onbeforeunload = managerSelf.handleNavigateAway;
        managerSelf.registerHandlers([{
            event: 'mouseup',
            type: 'DOM',
            window: true,
            handler: function (event) {
                var scrollTop = $(window).scrollTop(),
                    scrollLeft = $(window).scrollLeft(),
                    left = parseInt(event.clientX, 10) + 5 + scrollLeft,
                    top = parseInt(event.clientY, 10) + 5 + scrollTop;

                if (event.which === 3) {
                    managerSelf.openContextMenu(left, top, event);
                    event.preventDefault();
                }
            }
        }, {
            event: 'mousemove',
            type: 'DOM',
            handler: function (event) {
                var x = event.pageX,
                    y = event.pageY,
                    dx = event.originalEvent.movementX,
                    dy = event.originalEvent.movementY,
                    zoomStep = -0.01,
                    movementStep = 1,
                    newZoom,
                    text,
                    obj,
                    gplObj;

                if (managerSelf.middleMouseDown) {
                    newZoom = gpl.scaleValue + zoomStep * dy;
                    if (newZoom > gpl.MAXZOOM) {
                        newZoom = gpl.MAXZOOM;
                    } else if (newZoom < gpl.MINZOOM) {
                        newZoom = gpl.MINZOOM;
                    }

                    managerSelf.scale(newZoom);
                } else if (managerSelf.rightClickDown) {
                    managerSelf.pan(dx, dy);
                } else {
                    obj = managerSelf.canvas.findTarget(event);
                    gplObj = obj ? gpl.blockManager.getBlock((obj || {}).gplId) : null;

                    if (gplObj && !gplObj.isToolbar && gplObj.blockType !== 'Constant') {
                        text = (gpl.pointUpiMap[gplObj.upi] || {}).Name;
                        managerSelf.updateTooltip(text, x, y);
                    } else {
                        managerSelf.clearTooltip();
                    }
                }
            }
        // }, {
        //     event: 'mousedown',
        //     type: 'DOM',
        //     handler: function (event) {
        //         var which = event.which;

        //         switch (which) {
        //             case 2:
        //                 managerSelf.middleMouseDown = true;
        //                 event.preventDefault();
        //                 break;
        //             case 3:
        //                 managerSelf.rightClickDown = true;
        //                 event.preventDefault();
        //                 break;
        //         }
        //     }
        }, {
            event: 'mouseup',
            type: 'DOM',
            handler: function (event) {
                managerSelf.middleMouseDown = false;
                managerSelf.rightClickDown = false;
                // if(managerSelf.hasPanned) {
                //     managerSelf.canvas.calcOffset();
                // }
                managerSelf.hasPanned = false;
            }
        }, {
            event: 'click',
            type: 'DOM',
            handler: function (event) {
                var $target = $(event.target),
                    button;

                if ($target.hasClass('actionBtn')) {
                    button = managerSelf.actionButtons[$target.attr('data-actionButtonID')];
                    managerSelf.editBlock = button;
                    if (gpl.isEdit) {
                        if (button) {
                            managerSelf.bindings.editActionButton();
                        }
                    } else {
                        if (button) {
                            button.click();
                        }
                    }
                }
            }
        }, {
            event: 'object:moving',
            handler: function (e) {
                var c,
                    objects,
                    object,
                    gplObjects = {},
                    blockObject,
                    offset = {
                        left: e.target.left - e.target._originalLeft,
                        top: e.target.top - e.target._originalTop
                    };

                e.target.set({
                    left: Math.round(e.target.left / gpl.gridSize) * gpl.gridSize,
                    top: Math.round(e.target.top / gpl.gridSize) * gpl.gridSize
                });

                if (e.target instanceof fabric.Group) {
                    objects = e.target._objects;
                    for (c = 0; c < objects.length; c++) {
                        object = objects[c];
                        if (object.gplType) { //} === 'block') {
                            if (!gplObjects[object.gplId]) {
                                blockObject = gpl.blockManager.blocks[object.gplId];
                                if (blockObject) {
                                    gplObjects[object.gplId] = {
                                        gplObject: blockObject,
                                        object: object
                                    };
                                }
                            }
                        }
                    }
                }

                managerSelf.movedObjects = gplObjects;

                for (object in gplObjects) {
                    if (gplObjects.hasOwnProperty(object)) {
                        gplObjects[object].gplObject.setOffset(offset);
                    }
                }
            }
        }, {
            event: 'selection:cleared',
            handler: function (event) {
                var object,
                    gplObjects = managerSelf.movedObjects;

                if (gplObjects) {
                    for (object in gplObjects) {
                        if (gplObjects.hasOwnProperty(object)) {
                            gplObjects[object].gplObject.resetOffset();
                        }
                    }
                }

                managerSelf.gplObjects = null;
            }
        }, {
            event: 'selection:created',
            handler: function (event) {
                managerSelf.canvas.deactivateAll();
            }
        }, {
            event: 'mouse:up',
            handler: function (event) {
                managerSelf.mouseDown = true;

                var pointer = managerSelf.canvas.getPointer(event.e),
                    x = pointer.x,
                    y = pointer.y,
                    obj = gpl.manager.getObject({
                        left: x,
                        top: y,
                        gplType: 'anchor'
                    });

                if (gpl.isEdit && gpl.manager.state === null && !managerSelf.isEditingLine && obj && event.e.which === 1) {
                    x = obj.left + obj.width / 2;
                    y = obj.top + obj.height / 2;
                    managerSelf.shapes.push(new gpl.SchematicLine(x, y, obj, managerSelf, obj.isVertical));
                }
            }
        }, {
            event: 'mouse:up',
            handler: function (event) {
                var pointer = managerSelf.canvas.getPointer(event.e),
                    x = pointer.x,
                    y = pointer.y,
                    obj;

                gpl._rightClickTargets = gpl._rightClickTargets || [];

                if (event.e.which === 3) {
                    obj = gpl.manager.getObject({
                        left: x,
                        top: y
                    });

                    if (obj) {
                        obj = gpl.blockManager.getBlock(obj.gplId);
                        if (obj) {
                            log(obj);
                        }
                    }
                }
            }
        }, {
            //     event: 'resize',
            //     type: 'DOM',
            //     window: true,
            //     handler: function() {
            //         managerSelf.resizeCanvas(window.innerWidth, window.innerHeight);
            //     }
            // }, {
            event: 'keydown',
            handler: function (event) {
                var objects,
                    object,
                    gplObject,
                    gplId,
                    c,
                    evt;

                if (gpl.isEdit) {
                    if (event.which === gpl.DELETEKEY) {
                        objects = managerSelf.canvas.getActiveGroup();
                        object = managerSelf.canvas.getActiveObject();

                        if (objects) {
                            objects = objects._objects;
                            for (c = 0; c < objects.length; c++) {
                                object = objects[c];
                                gplId = object.gplId;
                                managerSelf.canvas.remove(object);
                                gplObject = gpl.lineManager.lines[gplId] || gpl.blockManager.blocks[gplId];
                                if (gplObject) {
                                    if (gplObject instanceof gpl.ConnectionLine) {
                                        gpl.fire('removeline', gplObject);
                                    } else {
                                        gpl.fire('deleteblock', gplObject);
                                    }
                                }
                            }
                            gplObject = null;
                        }

                        if (object) {
                            if (object.gplType === 'block') {
                                gplObject = gpl.blockManager.blocks[object.gplId];
                                evt = 'deleteblock';
                            } else if (object instanceof fabric.Line) {
                                gplObject = gpl.lineManager.lines[object.gplId];
                                evt = 'removeline';
                            } else if (object instanceof gpl.blocks.TextBlock) {
                                gplObject = gpl.texts[object.gplId];
                                evt = 'deleteblock';
                            } else {
                                log('invalid block');
                            }
                        }

                        managerSelf.canvas.discardActiveObject();
                        managerSelf.canvas.discardActiveGroup();

                        if (gplObject) {
                            gpl.fire(evt, gplObject);
                        }
                        managerSelf.renderAll();
                    }
                }
            },
            type: 'DOM'
        }]);

        $('body').on('hide.bs.modal', '.modal', function () {
            managerSelf.modalOpen = false;
        });

        $('body').on('show.bs.modal', '.modal', function () {
            managerSelf.modalOpen = true;
        });

        gpl.on('newblock', function (block) {
            managerSelf.addToBoundingRect(block);
        });

        gpl.on('openwindow', function () {
            managerSelf.clearTooltip();
            managerSelf.contextMenu.jqxMenu('close');
        });

        managerSelf.handleColorChange = function (newColor) {
            managerSelf.bindings.deviceBackgroundColor(newColor);
        };

        managerSelf.bgColorPicker = new CustomColorsPicker(gpl.$bgColorPicker, managerSelf.handleColorChange, managerSelf.backgroundColor);
        managerSelf.bgColorPicker.render();

    };

    init();
};

//initialization -------------------------------------
$(function () {
    if (!gpl.skipInit) {
        gpl.initGpl();
    }
});
var gpl = {
        texts: {},
        blocks: {},
        shapes: {},
        labelCounters: {},
        eventLog: [],
        actionLog: [],
        svgs: [],
        json: {},
        editModeOffset: 125,
        scaleValue: 1,
        defaultLoopDelay: 10,
        resizeDelay: 150,
        itemIdx: 0,
        editVersionStaleTimeout: 1000 * 60 * 5,//5 minutes
        gridSize: 1,//setOffset needs fixing to properly accomodate grid size > 1
        boundingRectTime: 0,
        boundingRectCount: 0,
        logLinePrefix: true,
        rendered: false,
        poppedIn: window.top.location.href !== window.location.href,
        STACK_FRAME_RE: new RegExp(/at ((\S+)\s)?\(?([^:]+):(\d+):(\d+)/),
        idxPrefix: '_gplId_',
        toolbarFill: '#313131',
        iconPath: '/img/icons/',
        pointApiPath: '/api/points/',
        eventHandlers: {},
        configuredEvents: {},
        convertProperties: ['blockType', 'left', 'name', 'top', 'upi', 'label', 'connectionCount', 'precision', 'zIndex', 'labelVisible', 'presentValueVisible', 'connection', 'presentValueFont', 'value'],
        $messageModal: $('#gplMessage'),
        $messageModalBody: $('#gplMessageBody'),
        $sequencePropertiesModal: $('#gplSequenceProperties'),
        $editInputOutputModal: $('#editInputOutput'),
        $editPrecisionModal: $('#editPrecisionModal'),
        $editVersionModal: $('#editVersionModal'),
        $colorpickerModal: $('#colorpickerModal'),
        $fetcher: $('#fetcher'),
        // $useEditVersionButton: $('#useEditVersion'),
        // $discardEditVersionButton: $('#discardEditVersion'),
        point: window.gplData.point,
        oldPoint: $.extend(true, {}, window.gplData.point),
        references: window.gplData.references,
        controllers: window.gplData.controllers,
        upi: window.gplData.upi,
        DELETEKEY: 46,
        ESCAPEKEY: 27,
        ARROWKEYS: {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down'
        },
        defaultBackground: 'C8BEAA',
        jqxTheme: 'flat',
        destroyFns: [],
        destroyObject: function(o) {
            var keys = Object.keys(o),
                c;
            for(c=0; c<keys.length; c++) {
                delete o[keys[c]];
            }
        },
        onDestroy: function(fn) {
            gpl.destroyFns.push(fn);
        },
        captureThumbnail: function() {
            gpl.workspaceManager.captureThumbnail({
                upi: gpl.upi,
                name: gpl.point.Name,
                type: 'sequence'
            });
        },
        emptyFn: function() {
            return;
        },
        isCyclic: function(obj) {
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
        deStringObject: function(iobj, onlyTrueFalse) {
            var obj = iobj || {},
                keys = Object.keys(obj),
                c,
                len = keys.length,
                prop,
                ret = null,
                tmp;

            for(c=0; c<len; c++) {
                ret = null;
                prop = obj[keys[c]];
                if(typeof prop === 'string') {
                    if(prop.toLowerCase() === 'false') {
                        ret = false;
                    } else if(prop.toLowerCase() === 'true') {
                        ret = true;
                    } else {
                        if(!onlyTrueFalse) {
                            if(prop.indexOf('.') > -1) {
                                tmp = parseFloat(prop);
                                if(!isNaN(tmp)) {
                                    ret = tmp;
                                }
                            } else {
                                tmp = parseInt(prop, 10);
                                if(!isNaN(tmp)) {
                                    ret = tmp;
                                }
                            }
                        }
                    }
                    if(ret !== null) {
                        obj[keys[c]] = ret;
                    }
                } else if(typeof prop === 'object') {
                    prop = gpl.deStringObject(prop, onlyTrueFalse);
                }
            }

            return obj;
        },
        convertBooleanStrings: function(obj) {
            return gpl.deStringObject(obj, true);
        },
        openWindow: function() {
            var windowRef,
                options = Array.prototype.slice.apply(arguments).pop(),
                attached = false,
                stopping = false,
                calledHandler = false,
                closeTimer,
                closeFn = function() {
                    if(options.gplHandler && !calledHandler) {
                        calledHandler = true;
                        options.gplHandler.apply(this, arguments);
                    }
                    clearInterval(closeTimer);
                    gpl.unblockUI();
                },
                checkUnload = function() {
                    var oldUnload = windowRef.onbeforeunload;

                    if(oldUnload !== closeFn && !attached) {
                        attached = true;
                        windowRef.onbeforeunload = function() {
                            if(!stopping) {
                                stopping = true;
                                closeFn();
                                oldUnload.apply(this, arguments);
                            } else {
                                return;
                            }
                        };
                    }
                };

            gpl.blockUI();

            windowRef = gpl._openWindow.apply(this, arguments);

            windowRef.onbeforeunload = closeFn;

            closeTimer = setInterval(checkUnload, 100);

            return windowRef;
        },
        defaultBlockMessage: '<h4>Please Wait...</h4>',
        blockUI: function(message) {
            return;//$.blockUI({message: message || gpl.defaultBlockMessage});
        },
        unblockUI: function() {
            return;//$.unblockUI();
        },
        openPointSelector: function(callback, newUrl, pointType, property) {
            var url = newUrl || '/pointLookup',
                windowRef,
                pointTypes,
                pointSelectedCallback = function(pid, name, type) {
                    if (!!pid) {
                        callback(pid, name, type);
                    }
                },
                windowOpenedCallback = function() {
                    windowRef.pointLookup.MODE = 'select';
                    if(property) {
                        pointTypes = gpl.getPointTypes(property);
                        windowRef.pointLookup.POINTTYPES = pointTypes;
                    }
                    windowRef.pointLookup.init(pointSelectedCallback, {
                        name1: gpl.point.name1,
                        name2: gpl.point.name2,
                        name3: gpl.point.name3,
                        name4: gpl.point.name4
                    });
                };

            if(pointType) {
                url += '/' + pointType + '/' + property;
            }

            windowRef = gpl.openWindow(url, 'Select Point', '', '', 'Select Dynamic Point', {
                callback: windowOpenedCallback,
                width: 1000
            });
        },
        initGpl: function() {
            var count = 0,
                num = 0,
                addFn = function(fn) {
                    num++;
                    fn();
                },
                complete = function() {
                    count++;
                    if(count === num) {
                        gpl.manager = new gpl.Manager();
                    }
                };

            gpl.point = gpl.convertBooleanStrings(gpl.point);
            gpl.devicePointRef = gpl.deStringObject(gpl.point['Point Refs'][0]);

            addFn(function() {
                $.ajax({
                    url: '/api/points/' + gpl.devicePointRef.PointInst
                }).done(function(data) {
                    gpl.devicePoint = data;
                    complete();
                });
            });

            addFn(function() {
                $.ajax({
                    url: '/api/system/qualityCodes'
                }).done(function(data) {
                    gpl._qualityCodes = data;
                    complete();
                }).fail(function(xhr, stat, error) {
                    gpl.log('qualityCodes error', JSON.stringify(error));
                });
            });
        },
        getBlock: function(arg) {
            return gpl.blockManager.getBlock(arg);
        },
        getLabel: function(type, increment) {
            var currCount,
                ret;

            if(increment) {
                gpl.labelCounters[type]++;
            }

            currCount = gpl.labelCounters[type];

            ret = type + currCount;
            // gpl.log('returning label', ret);

            return ret;
        },
        formatValue: function(block, value) {
            var precision = block.precision || 0,
                ret,
                val = value;

            if(typeof value === 'string') {
                val = parseFloat(value);
            }

            if(isNaN(val)) {
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
        addReferencePoint: function(upi, callback) {
            $.ajax({
                url: '/api/points/' + upi
            }).done(function(data) {
                var map;
                if(data.err) {
                    gpl.showMessage('error getting point data');
                } else {
                    if(data.message) {
                        gpl.log('AddReferencePoint error- upi:', upi, '--', data.message);
                    } else {
                        map = gpl.pointUpiMap[upi] = {
                            Name: data.Name,
                            pointType: data['Point Type'].Value,
                            valueType: (data['Value'].ValueType===5)?'enum':'float'
                        };
                        gpl.pointData[upi] = data;
                        callback(map, data);
                    }
                }
            });
        },
        // getExternalReferences: function(upi) {
        //     var cb = function(data) {
        //             if(data) {
        //                 gpl.log(data.SequenceData.sequence);
        //             } else {
        //                 gpl.log('error getting external gpl data');
        //             }
        //         };

        //     $.ajax({
        //         url: '/gpl/getReferences/' + upi
        //     }).done(cb);
        // },
        onRender: function(fn) {
            if(gpl.rendered === true) {
                fn(gpl.boundingBox);
            } else {
                gpl.on('rendered', function() {
                    fn(gpl.boundingBox);
                });
            }
        },
        forEach: function(obj, fn) {
            var keys = Object.keys(obj),
                c,
                len = keys.length,
                errorFree = true;

            for(c=0; c<len && errorFree; c++) {
                errorFree = fn(obj[keys[c]], keys[c]);
                if(errorFree === undefined) {
                    errorFree = true;
                }
            }

            return errorFree;
        },
        timedEach: function(config) {
            var idx = 0,
                iterateFn = config.iteratorFn,
                list = config.list,
                delay = config.delay || gpl.defaultLoopDelay,
                cb = config.cb || null,
                doNext = function() {
                    iterateFn(list[idx]);
                    setTimeout(function() {
                        idx++;
                        if(idx < list.length) {
                            doNext();
                        } else {
                            if(cb) {
                                cb();
                            }
                        }
                    }, delay);
                };

            doNext();
        },
        showMessage: function(message) {
            gpl.$messageModalBody.html(message);
            gpl.$messageModal.modal('show');
        },
        on: function(event, handler) {
            gpl.eventHandlers[event] = gpl.eventHandlers[event] || [];
            gpl.eventHandlers[event].push(handler);

            // if(!gpl.configuredEvents[event]) {
            //     gpl.configuredEvents[event] = true;
            //     if(type === 'canvas') {
            //         self.canvas.on(event, function(evt) {
            //             self.processEvent(event, evt);
            //         });
            //     } else {
            //         $(domType).on(event, function(evt) {
            //             self.processEvent(event, evt);
            //         });
            //     }
            // }
        },
        fire: function(event, obj1, obj2) {
            var c,
                handlers = gpl.eventHandlers[event] || [],
                len = handlers.length;

            // gpl.log('firing', event);

            if(!gpl.skipEventLog) {
                gpl.eventLog.push({
                    event: event,
                    obj1: obj1 && obj1.gplId,
                    obj2: obj2 && obj2.gplId
                });
            }

            for(c=0; c<len; c++) {
                handlers[c](obj1 || null, obj2 || null);
            }
        },
        makeId: function() {
            gpl.itemIdx++;
            return gpl.idxPrefix + gpl.itemIdx;
        },
        isEdit: document.location.href.match('/edit/') !== null,
        noSocket: document.location.href.match('nosocket') !== null,
        noLog: document.location.href.match('nolog') !== null,
        nobg: document.location.href.match('nobg') !== null,
        skipInit: document.location.href.match('skipinit') !== null,
        formatDate: function(date, addSuffix) {
            var functions = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
                lengths = [2,2,2,3],
                separators = [':',':',':',''],
                suffix = ' --',
                fn,
                out = '';

            if(addSuffix) {
                separators[separators.length - 1] = suffix;
            }

            if(typeof date === 'number') {
                date = new Date(date);
            }

            for(fn in functions) {
                if(functions.hasOwnProperty(fn)) {
                    out += ('000' + date['get' + functions[fn]]()).slice(-1 * lengths[fn]) + separators[fn];
                }
            }

            return out;
        },
        log: function() {

            var stack,
                steps,
                lineNumber,
                err,
                now = new Date(),
                args = [].splice.call(arguments, 0),
                pad = function(num) {
                    return ('    ' + num).slice(-4);
                },
                formattedTime = gpl.formatDate(new Date(), true);

            if(gpl.logLinePrefix === true) {
                err = new Error();
                if(Error.captureStackTrace) {
                    Error.captureStackTrace(err);

                    stack = err.stack.split('\n')[2];

                    steps = stack.split(':');

                    lineNumber = steps[2];

                    args.unshift('line:' + pad(lineNumber), formattedTime);
                }
            }
            // args.unshift(formattedTime);
            if(!gpl.noLog) {
                console.log.apply(console, args);
            }
        },
        convertColor: function(color) {
            if(!color) {
                return;
            }
            var red = color & 0xFF,
                green = (color >> 8) & 0xFF,
                blue = (color >> 16) & 0xFF,
                pad = function(n) {
                    return ('00' + n.toString(16)).slice(-2);
                };

            return pad(red) + pad(green) + pad(blue);

        },
        validateMessage: null,
        validate: {
            connection: function(anchor1, anchor2, skipErrorPrint) {
                    //get order as obj1 -> obj2
                var obj1 = (anchor2.anchorType === 'Control Point')?anchor2:anchor1,
                    obj2 = (anchor2.anchorType === 'Control Point')?anchor1:anchor2,
                    isValid = false,
                    anchorType2,
                    block1,
                    block2,
                    pointType1,
                    pointType2,
                    allowedPoints2,
                    property2,
                    isPointValid = function(pointType, allowedPoints) {
                        var c,
                            ret = false;

                        for(c=0; c<allowedPoints.length && !ret; c++) {
                            if(allowedPoints[c].key === pointType) {
                                ret = true;
                            }
                        }

                        if(!ret) {
                            // gpl.validateMessage = 'Invalid connection for point type ' + pointType;
                            if(!skipErrorPrint) {
                                gpl.log('invalid', pointType, allowedPoints);
                            }
                        }

                        return ret;
                    },
                    setVars = function() {
                        block1 = gpl.blockManager.getBlock(obj1.gplId);
                        block2 = gpl.blockManager.getBlock(obj2.gplId);

                        anchorType2 = obj2.anchorType;

                        if(block1 && block2) {
                            pointType1 = block1.pointType;
                            pointType2 = block2.pointType;
                        }
                    },
                    swapAnchors = function() {
                        var obj3 = obj2;

                        obj2 = obj1;
                        obj1 = obj3;
                    };

                setVars();

                if(pointType1 && pointType2) {
                    if(block2.type === 'ControlBlock') {
                        // gpl.log('swapped vars');
                        swapAnchors();
                        setVars();
                    }

                    if(pointType1 === 'Constant' && obj2.takesConstant === true) {
                        isValid = true;
                    } else {
                        property2 = anchorType2;
                        allowedPoints2 = gpl.getPointTypes(property2, pointType2);

                        if(allowedPoints2.error) {
                            // gpl.validateMessage = ['Error with', property2, pointType2, '--', allowedPoints2.error].join(' ');
                            if(!skipErrorPrint) {
                                gpl.log('error with', property2, pointType2, '--', allowedPoints2.error);
                            }
                        } else {
                            if(isPointValid(pointType1, allowedPoints2)) {
                                isValid = true;
                            }
                        }
                    }
                }

                return isValid;
            }
        },
        checkLineIntersection: function(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
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
        findIntersections: function() {
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
                    if(cc !== c && (!checked[c + '-' + cc] && !checked[cc + '-' + c])) {
                        checked[c + '-' + cc] = true;
                        line2 = allLines[lines[cc]];
                        lines1 = line1.lines;
                        lines2 = line2.lines;
                        for(c1=0; c1<lines1.length; c1++) {
                            l1 = lines1[c1];
                            for(c2=0; c2<lines2.length; c2++) {
                                l2 = lines2[c2];
                                results = gpl.checkLineIntersection(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2);

                                if (results.onLine1 && results.onLine2) {
                                    if(!window.coords[results.x + ',' + results.y]) {
                                        window.coords[results.x + ',' + results.y] = true;
                                        defaults.left = results.x-1;
                                        defaults.top = results.y-1;
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

    initialize: function(options) {
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

    _render: function(ctx) {
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

    toObject: function(propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    },

    complexity: function() {
        return 1;
    }
});

fabric.ExternalMonitorPointShape.fromObject = function(object) {
    return new fabric.ExternalMonitorPointShape(object);
};

fabric.InternalMonitorPointShape = fabric.util.createClass(fabric.Object, {
    type: 'InternalMonitorPointShape',

    x: 0,

    y: 0,

    fill: '#6a6af1',

    initialize: function(options) {
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

    _render: function(ctx) {
        var widthBy3 = this.width / 3,
            heightBy3 = this.height / 3,
            x = this.x - this.width/2,
            y = this.y - this.height/2;

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

    toObject: function(propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    },

    complexity: function() {
        return 1;
    }
});

fabric.InternalMonitorPointShape.fromObject = function(object) {
    return new fabric.InternalMonitorPointShape(object);
};

fabric.ExternalControlPointShape = fabric.util.createClass(fabric.ExternalMonitorPointShape, {
    type: 'ExternalControlPointShape',

    initialize: function(options) {
        var defaults = {
                flipX: true,
                fill: '#2bef30'
            };

        this.callSuper('initialize', $.extend(defaults, options));
    },

    toObject: function() {
        return this.callSuper('toObject');
    },

    _render: function(ctx) {
        return this.callSuper('_render', ctx);
    }
});

fabric.ExternalControlPointShape.fromObject = function(object) {
    return new fabric.ExternalControlPointShape(object);
};

fabric.InternalControlPointShape = fabric.util.createClass(fabric.InternalMonitorPointShape, {
    fill: '#2bef30'
});

fabric.InternalControlPointShape.fromObject = function(object) {
    return new fabric.InternalControlPointShape(object);
};

fabric.ConstantPointShape = fabric.util.createClass(fabric.Rect, {
    type: 'ConstantPointShape',

    fill: '#FF9600',
    stroke: 'black',

    initialize: function(options) {
        this.callSuper('initialize', options);
    },

    toObject: function(propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    }
});

fabric.ConstantPointShape.fromObject = function(object) {
    return new fabric.ConstantPointShape(object);
};



/* ------------ Blocks ------------------------ */

gpl.Anchor = fabric.util.createClass(fabric.Circle, {
    gplType: 'anchor',
    lockMovementX: true,
    lockMovementY: true,
    anchorRadius: 2.5,
    hoverRadius: 5,


    initialize: function(config) {
        this.config = config;
        this.initConfig();

        this.callSuper('initialize', this.config);

        this.x = this.config.x || 0;
        this.y = this.config.y || 0;
    },

    initConfig: function() {
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

   hover: function() {
        var gap = this.hoverRadius - this.anchorRadius;

        if(!this._oFill) {
            this._oFill = this.fill;
            this._oStroke = this.stroke;
            this._oRadius = this.radius;
        }

        if(!this.hovered) {
            this.hoverLeft = this.left;
            this.hoverTop = this.top;
            this.hovered = true;
            this.set({
                fill: 'green',
                stroke: 'green',
                radius: this.hoverRadius,
                left: this.left - gap/2 - 1,
                top: this.top - gap/2 - 1
            });
        }
    },

    clearHover: function() {
        this.hovered = false;
        this.set({
            radius: this.anchorRadius,
            left: this._originalLeft,
            top: this._originalTop,
            fill: this._oFill,
            stroke: this._oStroke
        });
    },

    getLines: function() {
        var ret = [];

        gpl.forEach(this.attachedLines, function(line) {
            ret.push(line);
        });

        return ret;
    },

    redrawLine: function() {
        var self = this;
        gpl.forEach(self.attachedLines, function(line) {
            line.redrawLine(self.gplId, {
                x: self.left - (self.radius/2),
                y: self.top + (self.radius/2)
            });
        });
    },

    getConnectedBlock: function() {
        var line = this.attachedLine,
            ret = null;

        if(line) {
            if(line.endAnchor === this) {
                ret = line.startAnchor;
            } else {
                ret = line.endAnchor;
            }
        }

        if(ret) {
            ret = gpl.blockManager.getBlock(ret.gplId);
        }

        return ret;
    },

    onAttach: function(fn) {
        this.attachFn = fn;
    },

    onDetach: function(fn) {
        this.detachFn = fn;
    },

    attach: function(line) {
        this.attachedLines[line.gplId] = line;
        this.connected = true;
        this.attachedLineCount++;

        this.attachFn(this, line);
    },

    detach: function(line) {
        var self = this,
            detachLine = function(dLine) {
                var lineToDetach = self.attachedLines[dLine.gplId];
                // gpl.log('detaching line', dLine);
                // line.detach(self);
                lineToDetach.detach();
                // lineToDetach.delete();
                delete self.attachedLines[dLine.gplId];
                self.attachedLineCount--;
            };

        if(line) {
            detachLine(line);
        } else {
            gpl.forEach(self.attachedLines, function(line, lineId) {
                detachLine(line);
            });
        }

        self.connected = self.attachedLineCount > 0;

        self.detachFn(self, line);
    },

    delete: function() {
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

    getLeftAnchorDefaults: function(top, self) {
        return {
            isVertical: false,
            leftFn: function(radius) {
                return -1 * radius + self.left;
            },
            topFn: function(radius) {
                return top - (radius / 2) + self.top - 0.5;
            }
        };
    },

    getRightAnchorDefaults: function(top, self) {
        return {
            isVertical: false,
            topFn: function(radius) {
                return top - (radius / 2) + self.top - 0.5;
            },
            leftFn: function(radius) {
                return self.width - radius + self.left;
            }
        };
    },

    _forEachAnchor: function(fn) {
        var c,
            self = this,
            list = self.inputAnchors || [];

        if(self.outputAnchor) {
            fn(self.outputAnchor);
        }

        if(self.inputAnchor) {
            fn(self.inputAnchor);
        }

        if(self.shutdownAnchor) {
            fn(self.shutdownAnchor);
        }

        for(c=0; c<list.length; c++) {
            fn(list[c]);
        }
    },

    _createAnchor: function(config) {
        var self = this,
            newConfig = $.extend(true, {}, config),
            anchor;

        newConfig.gplId = this.gplId;
        newConfig.visible = false;

        anchor = new gpl.Anchor(newConfig);

        anchor.onAttach(function(anc, line) {
            self.handleAnchorAttach(anchor, line);
        });

        anchor.onDetach(function(anc, line) {
            self.handleAnchorDetach(anchor, line);
        });

        this.add(anchor);
        return anchor;
    },

    _createLeftAnchor: function(top, config) {
        var self = this,
            cfg = $.extend(true, this.getLeftAnchorDefaults(top, self), config);

        this.inputAnchors = this.inputAnchors || [];

        this.inputAnchors.push(this._createAnchor(cfg));
    },

    _createRightAnchor: function(top, config) {
        var self = this,
            cfg = $.extend(true, this.getRightAnchorDefaults(top, self), config);

        this.outputAnchor = this._createAnchor(cfg);
    },

    _createInputAnchor: function(top) {
        var self = this;

        self.inputAnchors = self.inputAnchors || [];

        self.inputAnchors.push(self._createAnchor({
            inputAnchorIndex: self.inputAnchors.length,
            anchorType: 'input',
            isVertical: false,
            leftFn: function(radius) {
                return -1 * radius + self.left;
            },
            topFn: function(radius) {
                return top - (radius / 2) + self.top - 0.5;
            }
        }));
    },

    _createOutputAnchor: function(top) {
        var self = this;

        self.outputAnchor = self._createAnchor({
            anchorType: 'output',
            isVertical: false,
            topFn: function(radius) {
                return top - (radius / 2) + self.top - 0.5;
            },
            leftFn: function(radius) {
                return self.width - radius + self.left;
            }
        });
    },

    _createShutdownAnchor: function(top) {
        var self = this;
        self.shutdownAnchor = self._createAnchor({
            anchorType: 'Shutdown Point',

            // isShutdown: true,
            isVertical: true,
            topFn: function(radius) {
                return top - (radius / 2) + self.top - 1.5;
            },
            leftFn: function(radius) {
                return self.width/2 - (radius / 2) + self.left - 1;
            }
        });
    },

    handleAnchorAttach: function(anchor, line) {
        var self = this,
            otherAnchor = line.getOtherAnchor(anchor),
            otherBlock = gpl.blockManager.getBlock(otherAnchor.gplId),
            name,
            upi,
            idx;

        if(!self.isNonPoint) {
            if(otherBlock) {
                upi = otherBlock.upi;
                self.upiList[upi] = anchor;
                anchor.attachedUPI = upi;
                gpl.blockManager.addUPIListener(upi, anchor, line, function() {
                    self.processValue.apply(self, arguments);
                });
                idx = self._pointRefs[anchor.anchorType];
            }

            if(idx) {
                if(otherBlock.upi) {
                    name = gpl.pointData[otherBlock.upi];
                    name = name.Name;
                } else {
                    name = otherBlock.name;
                }

                self.setPointRef(anchor.anchorType, otherBlock.upi, name);
            }
        }
    },

    handleAnchorDetach: function(anchor, line) {
        this.setPointRef(anchor.anchorType, 0, '');
        return;
    },

    syncAnchorPoints: function() {
        var c,
            self = this,
            list = this.inputAnchors || [],
            data = self._origPointData,
            newData = self._pointData,
            tmpData,
            formatPoint = gpl.workspaceManager.config.Update.formatPoint,
            sync = function(anchor) {
                var lines = anchor.getLines() || [],
                    line,
                    otherEnd,
                    block,
                    cc,
                    gplId,
                    upi,
                    setDataVars = function() {
                        if(!upi) {
                            gpl.emptyFn();
                            // gpl.log('no upi');
                        } else {
                            if(gpl.pointData[upi]) {
                            // if(newData && data) {
                                try {
                                    tmpData = formatPoint({point: newData, oldPoint: data, property: anchor.anchorType, refPoint: gpl.pointData[upi]});
                                } catch(ex) {
                                    gpl.log('error formatting point', ex.message);
                                }
                                if(tmpData.err) {
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

                if(lines.length > 0) {
                    for(cc=0; cc<lines.length; cc++) {
                        line = lines[cc];
                        otherEnd = line.getOtherAnchor(anchor);

                        if(otherEnd) {
                            gplId = otherEnd.gplId;
                            block = gpl.blockManager.getBlock(gplId);
                            upi = block.upi;

                            if(block) {
                                if(block.blockType !== 'Constant') {
                                    setDataVars();
                                // } else {
                                //     gpl.log('constant found');
                                }
                            // } else {
                            //     gpl.log('no block', gplId, block);
                            }

                            //self.setPointData(newPoint);
                        }//shouldn't need an else, lines are removed on block delete
                    }
                } else {
                    //detached
                    self.setPointRef(anchor.anchorType, 0, '');
                    // gpl.log('no lines attached, blanking out', anchor.anchorType);
                    setDataVars();
                }
            };

        // gpl.log('syncing anchor points', this.gplId);

        for(c=0; c<list.length; c++) {
            sync(list[c]);
        }

        if(this.shutdownAnchor) {
            sync(this.shutdownAnchor);
        }

        if(this.outputAnchor) {
            sync(this.outputAnchor);
        }
    },

    syncObjects: function(target, offsets) {
        var left = target.left,
            top = target.top,
            shape,
            c;

        // gpl.log('syncing objects');

        if(offsets) {
            left += (offsets.left || 0) * gpl.scaleValue;
            top += (offsets.top || 0) * gpl.scaleValue;
        }

        this.left = left;
        this.top = top;

        for(c=0; c<this._shapes.length; c++) {
            shape = this._shapes[c];
            shape.left = shape._originalLeft = left + shape.offsetLeft * gpl.scaleValue;// - this.width/2;
            shape.top = shape._originalTop = top + shape.offsetTop * gpl.scaleValue;// - this.height/2;
            // gpl.log(shape.gplType, left, top, shape.offsetLeft, shape.offsetTop);
        }
    },

    lock: function(locked) {
        var c,
            list = this._shapes,
            len = list.length;

        for(c=0; c<len; c++) {
            list[c].lockMovementX = locked;
            list[c].lockMovementY = locked;
        }
    },

    setOffset: function(offset) {
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

        for(c=0; c<this._shapes.length; c++) {
            shape = this._shapes[c];

            if(typesToSync[shape.gplType]) {
                shape.left = left + shape._originalLeft * gpl.scaleValue;
                shape.top = top + shape._originalTop * gpl.scaleValue;
                // if(shape.gplType === 'anchor') {
                //     gpl.log('anchor', left, shape._originalLeft, shape.left, shape.gplId);
                // }
            }
        }
    },

    resetOffset: function() {
        var c,
            shape;

        // gpl.log('resetting offsets');

        for(c=0; c<this._shapes.length; c++) {
            shape = this._shapes[c];
            shape._originalLeft = shape.left;
            shape._originalTop = shape.top;
        }
    },

    calcOffsets: function() {
        var c,
            shape;

        for(c=0; c<this._shapes.length; c++) {
            shape = this._shapes[c];
            shape._originalLeft = shape.left;
            shape._originalTop = shape.top;
            shape.setCoords();
        }
    },

    resetPosition: function() {
        var self = this,
            shape = self._shapes[0];

        shape.left = shape.originalState.left;
        shape.top = shape.originalState.top;
        self.syncObjects(shape);
        self.calcOffsets();
        self.renderAll();
    },

    setPosition: function() {
        var self = this,
            shape = self._shapes[0];

        shape.originalState.left = shape.left;
        shape.originalState.top = shape.top;
    },

    nudge: function(offset) {
        this.left += offset.left;
        this.top += offset.top;

        this.syncObjects(this);
        this.redrawLines();
        this.renderAll();
    },

    add: function(object) {
        object.offsetLeft = object.left - this.left;
        object.offsetTop = object.top - this.top;
        this._shapes.push(object);
        if(this.initialized) {
            gpl.blockManager.add(object);
        }
    },

    getLabel: function() {
        var label = gpl.getLabel(this.type, true);

        this.setLabel(label);
    },

    setShowLabel: function(show) {
        this.labelVisible = show;

        this.labelText.visible = show;

        this.labelText.opacity = show?1:0;

        this.renderAll();
    },

    setShowValue: function(show) {
        this.presentValueVisible = show;

        this.valueText.visible = show;

        this.renderAll();
    },

    processValue: gpl.emptyFn,

    syncAnchorValue: function(anchor, val) {
        var type = anchor.anchorType;

        if(anchor.constantProp) {
            this._pointData[anchor.constantProp].Value = val;
            gpl.fire('editedblock', this);
        }
        // this._pointData[type].Value = val;
    },

    getReferencePoint: function(isNew) {
        var self = this,
            pointMap;

        if(self.upi) {
            pointMap = gpl.pointUpiMap[self.upi];

            if(pointMap) {
                self.setReferencePoint(pointMap, isNew);
            } else {
                gpl.log('point not found');
                gpl.addReferencePoint(self.upi, function(point) {
                    self.setReferencePoint(point, isNew);
                });
            }
        }
    },

    setReferencePoint: function(pointMap, isNew) {
        this.pointType = pointMap.pointType;
        this.valueType = pointMap.valueType;
        this.setPlaceholderText();

        if(isNew) {
            this.label = pointMap.Name.split('_').pop();
            this.labelText.setText(this.label);
            gpl.blockManager.renderAll();
        }

        this.tooltip = this.pointName = pointMap.Name;
    },

    setReferenceType: function(type) {
        this.referenceType = type;
        this.setVisibleShape(type);
    },

    setVisibleShape: function(type) {
        var list = this.fabricShapes;

        gpl.forEach(list, function(shape, shapeName) {
            if(shapeName === type) {
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

    updatePointDataProperties: function(pointData) {
        var refs = pointData['Point Refs'],
            len = refs.length,
            c;

        for(c=0; c<len; c++) {
            refs[c].isReadOnly = true;
        }

        pointData._parentUpi = gpl.upi;
    },

    setPointData: function(point, processChanges) {
        var newPoint = point.newPoint || point,
            oldPoint = point.oldPoint || point;

        if(!this._origPointData) {
            this._origPointData = $.extend(true, {}, oldPoint);
            this.updatePointDataProperties(this._origPointData);
        }

        this._pointData = $.extend(true, {}, newPoint);
        this.updatePointDataProperties(this._pointData);

        if(processChanges) {
            this.processPointData(newPoint);
            if(this.setIconName) {
                this.setIconName();
            }
            this.setLabel(newPoint.name4);
        }

        this.mapPointRefs();
    },

    getPointData: function() {
        return this._pointData;
    },

    mapPointRefs: function() {
        var refs = this._pointData['Point Refs'],
            obj = {},
            c;

        for(c=0; c<refs.length; c++) {
            obj[refs[c].PropertyName] = c;
        }

        this._pointRefs = obj || {};
    },

    setPointRef: function(prop, upi, name) {
        var data = this._pointData,
            refs,
            ref,
            idx;

        if(data) {
            refs = this._pointData['Point Refs'];
            idx = this._pointRefs[prop];
            if(idx !== undefined) {
                ref = refs[idx];
                ref.Value = ref.DevInst = ref.PointInst = upi;
                refs[idx].PointName = name;
            }
        // } else {
        //     gpl.log('no point data', this.type, this.gplId);
        }
    },

    processPointData: function(point) {
        var self = this,
            props = {
                iconType: function() {
                    var calcType = point['Calculation Type'] || {},
                        reverseAction = point['Reverse Action'] || {};

                    // if(calcType) {
                        calcType = calcType.Value;
                        reverseAction = reverseAction.Value;

                        if(self.setIconName) {
                            self.setIconName();
                        } else {
                            if(calcType && self.iconType !== calcType) {
                                self.config.iconType = calcType;

                                if(self.iconPrefix) {
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

        gpl.forEach(props, function(fn, property) {
            fn(property);
        });
    },

    setInvalid: function() {
        var shape = this._shapes[0];

        if(!shape._origStroke) {
            shape._origStroke = shape.stroke;
        }

        shape.stroke = this.invalidStroke;
        shape.strokeWidth = 2;
    },

    setValid: function() {
        var shape = this._shapes[0];

        shape.stroke = shape._origStroke || shape.stroke;
        shape.strokeWidth = 1;
    },

    validate: function() {
        var self = this,
            c,
            list = self.inputAnchors || [],
            len = list.length,
            anchor,
            valid = true,
            isValid = function(anchor) {
                var ret = true,
                    lines = anchor.getLines(),
                    cc;

                if(lines.length > 0) {
                    for(cc=0; cc<lines.length && ret; cc++) {
                        if(!lines[cc].validate()) {
                            ret = false;
                        }
                    }
                } else {
                    if(anchor.required === true) {
                        ret = false;
                        gpl.invalidMessage = 'No ' + anchor.anchorType + ' connection on ' + self.type + ' block';
                        gpl.log('no lines associated', anchor.anchorType, 'on', self.type);
                    }
                }

                valid = ret;
            };

        if(self.shutdownAnchor) {
            isValid(self.shutdownAnchor);
        }

        if(self.outputAnchor && valid) {
            isValid(self.outputAnchor);
        }

        for(c=0; c<len && valid; c++) {
            anchor = list[c];
            isValid(anchor);
        }

        if(!valid) {
            self.setInvalid();
        } else {
            self.setValid();
        }

        return valid;
    },

    delete: function() {
        var c,
            list = this.inputAnchors || [],
            len = list.length,
            invalidate = function(anchor) {
                var lines,
                    cc;

                if(anchor) {
                    lines = anchor.getLines();

                    for(cc=0; cc<lines.length; cc++) {
                        lines[cc].delete();
                    }

                    // gpl.log('invalidating anchor', anchor);
                    anchor.detach();
                    anchor.delete();
                }
            };

        for(c=0; c<len; c++) {
            invalidate(list[c]);
        }

        invalidate(this.shutdownAnchor);

        invalidate(this.outputAnchor);

        len = this._shapes.length;
        for(c=0; c<len; c++) {
            this.canvas.remove(this._shapes[c]);
        }

        this.renderAll();
    },

    destroy: function() {
        this.delete();
        gpl.destroyObject(this);
    },

    redrawLines: function() {
        this._forEachAnchor(function(anchor) {
            anchor.redrawLine();
        });
    },

    getPointInfo: function() {
        var self = this,
            data;

        self._pointRefs = {};

        if(self.upi) {
            data = gpl.pointData[self.upi];
            if(!data) {
                gpl.addReferencePoint(self.upi, function(map, point) {
                    self.setPointData(point);
                });
            } else {
                self.setPointData(data);
            }
        }
    },

    getPlaceholderText: function() {
        var precision = this.precision,
            ints = Math.floor(precision),
            decs = precision % 1,
            c,
            ret = '';

        if(this.valueType === 'enum') {
            ret = '###';
        } else {
            for(c=0; c<ints; c++) {
                ret += '#';
            }
            ret += '.';
            for(c=0; c<decs; c++) {
                ret += '#';
            }
        }

        return ret;
    },

    setPlaceholderText: function() {
        var text = this.getPlaceholderText();

        if(this.valueText) {
            this.valueText.setText(text);
            this.renderAll();
        }
    },

    renderAll: function() {
        gpl.blockManager.renderAll();
    },

    //initialization methods -----------------------------------------------

    initialize: function(config) {
        this.config = config;

        this.initConfig();

        this.getPointInfo();

        this.callSuper('initialize', this.config);
        this.setShadow(this.shadow);

        this.x = this.config.x || 0;
        this.y = this.config.y || 0;

        this.initShapes();

        gpl.blockManager.registerBlock(this, this.valueText);

        if(this.upi && gpl.pointData[this.upi]) {
            this._pointData = gpl.pointData[this.upi];
        }

        this.initialized = true;
    },

    initConfig: function() {
        this.gplId = gpl.makeId();
        this.precision = this.defaultPrecision;

        this.upi = +this.config.upi;

        this.shapes = this.shapes || {};
        this._shapes = [];

        this._offsetLeft = 0;
        this._offsetTop = 0;

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

    initShapes: function() {
        this.initFabricShapes();
        this.initAnchors();
        this.initLabel();
        this.initValue();
        this.initIcon();
        this.postInit();
    },

    postInit: function() {
        if(!this.config.inactive) {
            this.showShapes();
        }
    },

    initAnchors: function() {
        this.initInputAnchors();
        this.initOutputAnchor();
        this.initShutdownAnchor();
    },

    initIcon: function() {
        var self = this;

        self._icons = {};

        if(!self.noIcon) {
            if(self.getIcon) {
                self.icon = self.getIcon();
            } else {
                self.icon = self.config.iconType + self.iconExtension;
            }
            self.setIcon();
        }
    },

    initLabel: function() {
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
                selectable: false
            };

        // if(this.labelVisible === undefined) {
        //     this.labelVisible = gpl.json.Show_Label;
        // } else {
            if(this.labelVisible === 0) {//take sequence option?
                this.labelVisible = gpl.json.Show_Label;
            } else {
                if(this.labelVisible === undefined) {
                    this.labelVisible = false;
                }
            }
        // }


        if(this.labelVisible === false) {
            // this.labelVisible = false;
            config.visible = false;
            // config.opacity = 0;
            config._wasHidden = true;
        }

        this.label = this.label || (!this.config.inactive?gpl.getLabel(this.type):'');

        if(this.config.inactive) {
            config.visible = false;
        }

        this.labelText = new fabric.Text(this.label, config);

        // if(this.labelVisible === 0) {//legacy
        //     this.labelText._wasHidden = true;
        // }

        if(this.labelText.width < this.minLabelWidth) {
            this.labelText.set('width', this.minLabelWidth);
        }

        this.labelText._originalTop = config.top;
        this.labelText._originalLeft = this.labelText.left;
        this.add(this.labelText);
    },

    initValue: function() {
        var config = {
                textAlign: 'left',
                fontSize: parseInt(this.labelFontSize, 10),
                fontFamily: this.labelFontFamily,
                gplType: 'value',
                selectable: false,
                readOnly: true,
                top: this.top - this.labelFontSize + this.height / 2 - this.labelMargin / 2,
                originX: 'left'
            };

        if(this.valueAnchor === 'output') {
            config.left = this.left + this.width + this.labelMargin;
        } else {
            config.left = this.left - this.labelMargin;
            config.textAlign = 'right';
            config.originX = 'right';
        }

        if(this.presentValueVisible === 0) {
            this.presentValueVisible = false;
        } else {
            this.presentValueVisible = this.presentValueVisible || gpl.point['Show Value'].Value;
        }

        if(this.presentValueVisible === false || this.config.showValue === false) {
            config.visible = false;
        }

        this.valueText = new fabric.Text(this.getPlaceholderText(), config);
        this.valueText._originalTop = config.top;
        this.valueText._originalLeft = this.valueText.left;
        this.add(this.valueText);
    },

    initInputAnchors: function() {
        var c,
            padding = 10,
            len = this.numInputs || (this.leftAnchors && this.leftAnchors.length) || 0,
            margin,
            arr = [],
            top = padding;

        if(len === 1) {
            top = margin = parseInt(this.height / 2, 10);
        } else {
            margin = parseInt((this.height - (2 * padding)) / (len - 1), 10);
        }

        if(this.leftAnchors) {
            len = this.leftAnchors.length;
        } else {
            for(c=0; c<len; c++) {
                arr.push({
                    anchorType: 'Input Point ' + (c+1),
                    takesConstant: true
                });
            }
            this.leftAnchors = arr;
        }

        for(c=0; c<len; c++) {
            if(this.leftAnchors) {
                this._createLeftAnchor(top, this.leftAnchors[c]);
            } else {
                this._createInputAnchor(top);
            }

            top += margin;
        }
    },

    initOutputAnchor: function() {
        var top = this.height/2;

        if(this.hasOutput) {
            if(this.rightAnchor) {
                this._createRightAnchor(top, this.rightAnchor);
            } else {
                this._createOutputAnchor(top);
            }
        }
    },

    initShutdownAnchor: function() {
        var top = this.height;

        if(this.hasShutdownBlock === true) {
            this._createShutdownAnchor(top);
        }
    },

    initFabricShapes: function() {
        var self = this,
            shapeName,
            Shape,
            newShape,
            ShapeClass,
            cfg,
            config,
            highlight = function(shape) {
                return function() {
                    gpl.blockManager.highlight(shape);
                };
            },
            clearShapes = function() {
                self.removeShapes();
            };

        self.fabricShapes = {};

        for(shapeName in self.shapes) {
            if(self.shapes.hasOwnProperty(shapeName)) {
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

                if(cfg.hidden === true || (self.config.inactive && self.noIcon !== true)) {
                    cfg.opacity = 0;
                    cfg.visible = false;
                    // cfg._wasHidden = true;

                    // config.evented = false;
                }

                if(!gpl.isEdit) {
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

    setActive: function() {
        this.labelVisible = gpl.point['Show Label'].Value;

        this.bypassSave = false;
        this.showShapes();

        if(this.labelVisible) {
            this.labelText.opacity = 1;
            this.labelText.visible = true;
        }

        this.config.inactive = false;
    },

    setIcon: function(icon) {
        var self = this;

        if(icon) {
            self.icon = icon;
        }

        if(self.icon) {
            if(self._icons[self.icon] === undefined) {
                fabric.Image.fromURL(gpl.iconPath + self.icon, function(img) {
                    var width = img.width,
                        height = img.height,
                        left = self.left + (self.width - width)/2 + self.iconOffsetLeft,
                        top = self.top + (self.height - height)/2 + self.iconOffsetTop;

                    img.set({
                        left: left,
                        top: top,
                        evented: false,
                        selectable: !!gpl.isEdit
                    });

                    if(self.iconScale) {
                        img.scale(self.iconScale);
                    }

                    img._originalLeft = left;
                    img._originalTop = top;
                    img.gplId = self.gplId;

                    img.gplType = 'backgroundimage';

                    if(self.backgroundImage) {
                        self.backgroundImage.setVisible(false);
                    }

                    self.backgroundImage = img;
                    self._icons[self.icon] = img;

                    self.add(img);
                    self.renderAll();
                });
            } else {
                if(self.backgroundImage) {
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

    setLabel: function(label) {
        if(label) {
            this.label = label;
        }

        this.labelText.setText(label);
        this.renderAll();
    },

    showShapes: function() {
        var c,
            shape;

        for(c=0; c<this._shapes.length; c++) {
            shape = this._shapes[c];
            // shape.evented = true;
            if(!shape.readOnly) {
                shape.selectable = true;
            }
            if(shape._wasHidden !== true) {
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

        if(this.config.inactive) {
            //set label if drop from toolbar
            this.getLabel();
        }
    },

    removeShapes: function() {
        var shapes = this._shapes,
            c,
            len = shapes.length;

        for(c=0; c<len; c++) {
            gpl.blockManager.remove(shapes[c]);
        }
    }
});

gpl.Block.fromObject = function(object) {
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

    initialize: function(config) {
        this.callSuper('initialize', config);

        this.getReferencePoint();
    },

    syncAnchorPoints: gpl.emptyFn,

    postInit: function() {
        this.callSuper('postInit');

        if(this.referenceType === 1) {//internal
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

    postInit: function() {
        if(this.value !== undefined) {
            this.valueText.setText(gpl.formatValue(this, this.value.toString()));
        }

        this.callSuper('postInit');
    },

    setValue: function(val) {
        var lines,
            anchor,
            block,
            c,
            len;

        this.value = val;
        this.valueText.setText(gpl.formatValue(this, val));

        lines = this.outputAnchor.getLines();
        len = lines.length;

        for(c=0; c<len; c++) {
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

    initialize: function(config) {
        this.callSuper('initialize', config);

        this.getReferencePoint();
    },

    postInit: function() {
        this.callSuper('postInit');

        if(this.referenceType === 1) {//internal
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

    initialize: function(config) {
        this.callSuper('initialize', config);
    },

    postInit: function() {
        this.setIconName();
        this.callSuper('postInit');
    },

    setIconName: function() {
        var data = this._pointData,
            reverseActing,
            icon;

        if(data) {
            reverseActing = data['Reverse Action'].Value;
            icon = this._icon.split('.');

            if(reverseActing) {
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

    initialize: function(config) {
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

    initialize: function(config) {
        this.callSuper('initialize', config);
    },

    setIconName: function() {
        var data = this._pointData,
            calcType,
            icon;

        if(data) {
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

    initialize: function(config) {
        this.callSuper('initialize', config);
    },

    setIconName: function() {
        var data = this._pointData,
            calcType,
            icon;

        if(data) {
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

    initialize: function(config) {
        if(config.iconType === 'ReverseActingPI') {
            config.iconType = 'PI';//will be set on point process
        }
        this.callSuper('initialize', config);
    },

    setIconName: function() {
        var data = this._pointData,
            reverseActing = data['Reverse Action'].Value,
            icon = data['Calculation Type'].Value;
            // icon = this._icon;

        if(reverseActing) {
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

    initialize: function(config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Economizer = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

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
                height: 40
            }
        }
    },

    initialize: function(config) {
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

    initialize: function(config) {
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

    initialize: function(config) {
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

    initialize: function(config) {
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

    initialize: function(config) {
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

    initialize: function(config) {
        this.callSuper('initialize', config);
    },

    processValue: function(upi, anchor, line, dyn) {
        var val = dyn.eValue;

        // if(upi === this.selectUPI) {
        if(anchor === this.inputAnchors[2]) {
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

    initialize: function(config) {
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

    initialize: function(config) {
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

    initialize: function(config) {
        this.setAlarmIcon('1111');
        this.callSuper('initialize', config);
    },

    postInit: function() {
        this.setIconName();
        this.callSuper('postInit');
    },

    setAlarmIcon: function(total) {
        this.icon = this.iconPrefix + total + this.iconExtension;
    },

    setIconName: function() {
        var data = this.getPointData(),
            matrix,
            vals = {
                inAlarm: '1',
                inFault: '1',
                inOutOfService: '1',
                inOverride: '1'
            },
            total = '';

        if(data) {
            matrix = {
                inAlarm: data['In Alarm'].Value,
                inFault: data['In Fault'].Value,
                inOutOfService: data['In Out of Service'].Value,
                inOverride: data['In Override'].Value
            };

            gpl.forEach(matrix, function(val, type) {
                if(val) {
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

    initialize: function(config) {
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

    initialize: function(config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.TextBlock = fabric.Textbox;

gpl.blocks.TextBlock1 = fabric.util.createClass(fabric.Textbox, {
    type: 'TextBlock',
    lineHeight: 1,
    toolbarHeight: 30,
    toolbarOffsetTop: 10,
    toolbarOffsetLeft: -8,
    toolbarWidth: 30,
    proxyOffsetLeft: 8,
    fontFamily: 'arial',
    textAlign: 'center',
    hasRotatingPoint: false,
    hasControls: false,
    // originY: 'bottom',
    noIcon: true,

    defaultWeight: 'normal',
    defaultFill: '#000000',
    defaultFontSize: 12,

    initialize: function(config) {
        this.config = config;

        this.gplId = gpl.makeId();

        this.convertConfig();
        // this.callSuper('initialize', this.config.label || 'ABC', this.config);
        gpl.texts[this.gplId] = this;//.push(this);
        gpl.blockManager.add(this);
    },

    convertConfig: function() {
        var cfg = this.config,
            fontConfig = cfg.font;

        if(fontConfig) {
            cfg.fontWeight = fontConfig.bold?'bold':'normal';
            cfg.fill = '#' + gpl.convertColor(fontConfig.color || 0);
            cfg.fontSize = parseInt(fontConfig.size, 10) || this.defaultFontSize;
            cfg.textDecoration = fontConfig.underline?'underline':'';
        } else {
            cfg.fontWeight = this.defaultWeight;
            cfg.fill = this.defaultFill;
            cfg.fontSize = this.defaultFontSize;
        }

        cfg.lockUniScaling = true;
        cfg.originX = 'left';
        cfg.originY = 'top';

        if(cfg.Font && cfg.Font.Underline === 'true') {
            cfg.textDecoration = 'underline';
        }

        this.config.left += 10;
        this.config.top += 5;

        this.config.selectable = !!gpl.isEdit;

        this.config.width = parseInt(this.config.width, 10);
        this.config.height = parseInt(this.config.height, 10);

        this.text = this.config.label || '';
    }
});

/* ------------- Misc Classes ------------ */

gpl.SchematicLine = function(ox, oy, otarget, manager, isVertical) {
    var self = this,
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
        horiz = isVertical?false:true,
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
        forEachLine = function(fn) {
            var cc;

            for(cc=0; cc<segments.length; cc++) {
                fn(segments[cc]);
            }
            fn(solidLine);
            fn(dashedLine);
        },
        forEachCanvasObject = function(fn) {
            var c,
                objects = canvas.getObjects(),
                len = objects.length;

            for(c=0; c<len; c++) {
                fn(objects[c]);
            }
        },
        disableNonAnchors = function() {
            forEachCanvasObject(function(obj) {
                if(obj.gplType !== 'anchor') {
                    obj._prevSelectable = obj.selectable;
                    obj.selectable = false;
                }
            });
        },
        enableNonAnchors = function() {
            forEachCanvasObject(function(obj) {
                if(obj.gplType !== 'anchor') {
                    obj.selectable = obj._prevSelectable;
                }
            });
        };

    block.lock(true);

    self.setColor = function(color) {
        forEachLine(function(line) {
            line.setStroke(color || '#000000');
        });
    };

    self.getCoords = function() {
        return coords;
    };

    self.completeLine = function(target) {
        var newCoords,
            event;

        if(target) {
            event = {
                x: target.left + target.width/2,
                y: target.top + target.height/2
            };
            self.handleMouseMove(event);
        }

        target.clearHover();
        self.addSegment(solidLine, true);
        solidLine.off();
        canvas.remove(solidLine);
        solidLine = new fabric.Line([dashedLine.x1, dashedLine.y1, dashedLine.x2, dashedLine.y2], $.extend({}, lineDefaults));
        self.addSegment(solidLine, true);
        dashedLine.off();
        canvas.remove(dashedLine);
        target.set('fill', target._oFill);
        target.set('stroke', target._oStroke);
        self.detachEvents();
        newCoords = $.extend(true, [], coords);
        // gpl.log('creating new line', newCoords);
        manager.shapes.push(new gpl.ConnectionLine($.extend(true, [], newCoords), canvas, true));
        self.clearSegments();
        gpl.manager.renderAll();
    };

    self.clearSegments = function() {
        while(segments.length > 0) {
            self.removeSegment(true);
        }
        block.lock(false);
        gpl.manager.renderAll();
    };

    self.delete = function() {
        gpl.manager.clearState();
        solidLine.off();
        dashedLine.off();
        canvas.remove(solidLine);
        canvas.remove(dashedLine);
        self.detachEvents();
        self.clearSegments();
        gpl.manager.renderAll();
    };

    self.syncLines = function() {
        var newCorner,
            lastCoords = coords.slice(-1)[0];

        if(horiz) {
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

    self.removeSegment = function(bypass) {
        var segment;

        if(segments.length > 0) {
            coords.pop();
            segment = segments.pop();
            segment.off();
            canvas.remove(segment);
        }

        horiz = !horiz;

        if(!bypass) {
            self.syncLines();
        }

        return segment;
    };

    self.addSegment = function(segment, skipSync) {
        segments.push(segment);
        coords.push({
            x: segment.x2,
            y: segment.y2
        });
        canvas.add(segment);
        horiz = !horiz;
        if(!skipSync) {
            self.syncLines();
        }
    };

    self.swapDirections = function() {
        if(!spaceSegment) {
            spaceSegment = self.removeSegment();
        } else {
            self.addSegment(spaceSegment);
        }
    };

    self.handleMouseMove =  function(event) {
        var pointer = event.e?canvas.getPointer(event.e):event,
            x = pointer.x,// - pointer.x % gpl.gridSize,
            y = pointer.y,// - pointer.y % gpl.gridSize,
            moveTarget = gpl.manager.getObject({
                left: x,
                top: y,
                gplType: 'anchor'
            });

        if(manager.isEditingLine) {
            if(moveTarget) {
                self.valid = gpl.validate.connection(startAnchor, moveTarget, true);
                if(self.valid && moveTarget !== startAnchor) {
                    moveTarget.hover();
                    self.setColor(VALIDCOLOR);
                    target = moveTarget;
                }
            } else {
                if(target) {
                    target.clearHover();
                    self.setColor();
                }
            }

            if(horiz) {
                solidLine.set({x2: x});
                dashedLine.set({x1: x, y2: y, x2: x, y1: prevY});
            } else {
                solidLine.set({y2: y});
                dashedLine.set({x1: prevX, y2: y, x2: x, y1: y});
            }
            gpl.manager.renderAll();
        }
    };

    self.handleMouseUp = function(event) {
        self.mouseDown = false;
        if(event.e.which === 3) {
            self.delete();
        }
    };

    self.handleMouseDown = function(event) {
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

        if(manager.isEditingLine) {
            if(clickTarget && self.valid) {// && clickTarget.anchorType === endType) {
                self.completeLine(clickTarget);
            } else {
                prevX = x;
                prevY = y;

                coords.push({
                    x: x,
                    y: y
                });

                segments.push(solidLine);

                solidLine = new fabric.Line([x, y, x, y], $.extend({}, lineDefaults));
                dashedLine.set({x1: x, y1: y, x2: px, y2: py});

                horiz = !horiz;

                canvas.add(solidLine);
                gpl.manager.renderAll();
            }
        }
    };

    self.handleEnterKey = function() {
        self.completeLine();
    };

    self.handleSpacebar = function(event) {
        self.swapDirections();
    };

    self.handleBackspace = function(event) {
        self.removeSegment();
    };

    self.handleKeyUp = function(event) {
        if(event.which === gpl.ESCAPEKEY) {
            self.delete();
        }
    };

    // self.handleKeyPress = function(event) {
    //     // if(event.which === 13) {
    //     //     handleEnterKey();
    //     // }
    //     // if(event.which === 32) {
    //     //     self.handleSpacebar(event);
    //     // }

    //     // if(event.which === 46) {//46 delete, 8 backspace
    //     //     event.preventDefault();
    //     //     handleBackspace(event);
    //     //     return false;
    //     // }
    // };

    eventHandlerList = [{
        event: 'keyup',
        handler: self.handleKeyUp,
        type: 'DOM'
    }, {
        event: 'mouse:move',
        handler: self.handleMouseMove
    }, {
        event: 'mouse:up',
        handler: self.handleMouseUp
    }, {
        event: 'mouse:down',
        handler: self.handleMouseDown
    }];

    self.detachEvents = function() {
        canvas.defaultCursor = self.oldCursor;
        enableNonAnchors();
        manager.clearState();
        manager.unregisterHandlers(eventHandlerList);
        setTimeout(function() {
            manager.isEditingLine = false;
        },500);
    };

    self.attachEvents = function() {
        self.oldCursor = canvas.defaultCursor;
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

    self.attachEvents();
};

gpl.LineManager = function(manager) {
    var self = this,
        bringToFront = function(line) {
            var c,
                list = line.lines,
                len = list.length;

            for(c=0; c<len; c++) {
                gpl.manager.bringToFront(list[c]);
            }

            gpl.manager.renderAll();
        },
        doRemove = function(line) {
            self.removedLines[line.gplId] = line;
            delete self.lines[line.gplId];
        };

    self.lines = {};
    self.removedLines = {};

    self.setSelected = function(line) {
        if(self.selectedLine) {
            self.selectedLine.deselect();
        }

        self.selectedLine = line;
    };

    self.registerLine = function(line) {
        self.lines[line.gplId] = line;
    };

    self.getLine = function(gplId) {
        return self.lines[gplId] || self.wideLines[gplId];
    };

    self.deleteLine = function(conf) {
        var line;

        if(typeof conf === 'string') {
            line = self.lines[conf];
        } else {
            line = conf;
        }

        if(line) {
            line.delete();

            doRemove(line);

            manager.renderAll();
        } else {
            gpl.log('no line to remove');
        }
    };

    self.remove = function(line) {
        doRemove(line);
    };

    self.convertLine = function(line) {
        var ret = {
            handle: line.coords
        };

        return ret;
    };

    self.prepSaveData = function(saveObject) {
        var ret = [];

        gpl.forEach(self.lines, function(obj) {
            if(obj.state !== 'deleted') {
                ret.push(self.convertLine(obj));
            }
        });

        saveObject.line = ret;
    };

    gpl.on('addedLine', function(line) {
        self.lines[line.gplId] = line;
        bringToFront(line);
    });

    gpl.on('removeline', function(line) {
        if(self.lines[line.gplId]) {
            self.deleteLine(line.gplId);
        }
    });

    gpl.manager.registerHandler({
        event: 'selection:cleared',
        handler: function(event) {
            if(self.selectedLine) {
                self.selectedLine.revertState();
                self.selectedLine = null;
            }
        }
    });

    gpl.manager.addToBindings({
        deleteLine: function() {
            var line = manager.contextObject;

            self.deleteLine(line.gplId);
        }
    });

    gpl.on('save', function() {
        self.prepSaveData(gpl.json);
    });

    gpl.on('saveForLater', function() {
        self.prepSaveData(gpl.json.editVersion);
    });

    gpl.onDestroy(function() {
        gpl.forEach(self.lines, function(line, gplId) {
            line.delete();
            delete self.lines[gplId];
        });
        delete self.lines;
    });
};

gpl.ConnectionLine = function(coords, canvas, isNew) {
    var self = this,
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
        forEachLine = function(fn, wide) {
            var cc;

            for(cc=0; cc<self.lines.length; cc++) {
                fn(self.lines[cc]);
            }
            if(wide) {
                for(cc=0; cc<self.lines.length; cc++) {
                    fn(self.lines[cc]);
                }
            }
        },
        calcManhattanMidpoints = function(p1, p2, idx, sVert, eVert) {
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
                calcDifferences = function(pp1, pp2) {
                    dx = pp2.x - pp1.x;
                    dy = pp2.y - pp1.y;
                    adx = Math.abs(dx);
                    ady = Math.abs(dy);
                    x = [pp1.x, pp2.x];
                    y = [pp1.y, pp2.y];
                },
                invertPoint = function(arg) {
                    // gpl.log(self.gplId, 'inverting point', arg);
                    newPoint = [(newPoint[0] + 1) % 2, (newPoint[1] + 1) % 2];
                },
                doManhattanLines = function() {
                    //normally horizontal
                    if(adx > ady) {
                        newPoint = [1, 0];
                        if(idx === 0) {
                            if(sVert) {
                                invertPoint('adx start');
                            }
                        } else if(idx === self.coords.length - 2) {
                            if(!eVert) {
                                invertPoint('adx end');
                            }
                        }
                    } else {//normally vert
                        newPoint = [0, 1];
                        if(idx === 0) {
                            if(!sVert) {
                                invertPoint('ady start');
                            }
                        } else if(idx === self.coords.length - 2) {
                            if(eVert) {
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
            if(self.coords.length === 2) {//if has a vertex, make sure horiz/vert matches
                if(sVert) {
                    if(dy > 0) {//next point is above
                        tmpPoint = {
                            x: p1.x,
                            y: p1.y + bufferWidth
                        };
                    } else {//next point is below
                        tmpPoint = {
                            x: p1.x,
                            y: p1.y - bufferWidth
                        };
                    }
                } else {
                    if(dx > 0) {//next point is to the right
                        tmpPoint = {
                            x: p1.x + bufferWidth,
                            y: p1.y
                        };
                    } else {//next point is to the left
                        tmpPoint = {
                            x: p1.x - bufferWidth,
                            y: p1.y
                        };
                    }
                }
                newPoints.push(tmpPoint);

                if(eVert) {
                    if(dy > 0) {//prev point was above
                        tmpPoint = {
                            x: p2.x,
                            y: p2.y - bufferWidth
                        };
                    } else {//prev point was below
                        tmpPoint = {
                            x: p2.x,
                            y: p2.y + bufferWidth
                        };
                    }
                } else {
                    if(dx > 0) {//prev point was to the left
                        tmpPoint = {
                            x: p2.x - bufferWidth,
                            y: p2.y
                        };
                    } else {//prev point was to the right
                        tmpPoint = {
                            x: p2.x + bufferWidth,
                            y: p2.y
                        };
                    }
                }
                newPoints.push(tmpPoint);

                calcDifferences(newPoints[0], newPoints[1]);

                retPoint = doManhattanLines();

                ret = [self.coords[0], newPoints[0], retPoint, newPoints[1], self.coords[1]];
            } else {
                retPoint = doManhattanLines();
                ret = [retPoint];
            }

            return ret;
        },
        selectAllSegments = function() {
            // gpl.log(self);
            gpl.lineManager.setSelected(self);
            self.setSelected();
        },
        drawSegments = function() {
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

            for(cc=0; cc<calculatedSegments.length-1; cc++) {
                point1 = calculatedSegments[cc];
                point2 = calculatedSegments[cc+1];
                x1 = point1.x;
                x2 = point2.x;
                y1 = point1.y;
                y2 = point2.y;
                vert = y1 !== y2;
                xoffset = vert?(proxyWidth/2):0;
                yoffset = vert?0:(proxyWidth/2);
                line = new fabric.Line([x1 + 0.5, y1 - 0.5, x2 + 0.5, y2 - 0.5], lineDefaults);//this offsets to make a clean line
                wideLine = new fabric.Line([x1 + 0.5 - xoffset, y1 - 0.5 - yoffset, x2 + 0.5 - xoffset, y2 - 0.5 - yoffset], proxyDefaults);//this offsets to make a clean line
                line.on('selected', selectAllSegments);
                wideLine.on('selected', selectAllSegments);
                line.on('removed', self.delete);
                line.gplId = self.gplId;
                wideLine.gplId = self.gplId;
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
                self.lines.push(line);
                self.wideLines.push(wideLine);
                // self.circles.push(circle);
            }
            gpl.fire('addedLine', self);
        },
        drawLines = function() {
            var c,
                addSegment = function(index) {//point1, point2) {
                    var point1 = self.coords[index],
                        point2 = self.coords[index + 1],
                        svert = false,
                        evert = false,
                        midpoints,
                        points;

                    if(point1.x !== point2.x && point1.y !== point2.y && location.href.substring(0).match('nomanhattan') === null) {//if it's a diagonal line
                        if(index === 0 && self.startAnchor) {
                            svert = self.startAnchor.isVertical;
                        }
                        if(index === self.coords.length - 2 && self.endAnchor) {
                            evert = self.endAnchor.isVertical;
                        }

                        midpoints = calcManhattanMidpoints(point1, point2, index, svert, evert);
                        points = [].concat(midpoints).concat(point2);
                    } else {
                        points = [point2];
                    }

                    if(index === 0) {
                        points.unshift(point1);
                    }


                    calculatedSegments = calculatedSegments.concat(points);
                };

            for(c=0; c<self.coords.length-1; c++) {
                addSegment(c);
            }

            drawSegments();
        },
        fixCoords = function() {
            var c,
                len = self.coords.length,
                coord,
                x,
                y,
                centerInAnchor = function(anchor, coord1, coord2) {
                    var top = anchor.top + anchor.radius,
                        left = anchor.left + anchor.radius,
                        c1 = self.coords[coord1],
                        c2 = self.coords[coord2];

                    if(anchor.isVertical) {//only check x
                        if(left !== c1.x) {
                            c1.x = left;
                            c2.x = left;
                        }
                    } else {//only check y
                        if(top !== c1.y) {
                            c1.y = top;
                            c2.y = top;
                        }
                    }
                };

            // if(isNew) {
            //     centerInAnchor(self.startAnchor, 0, 1);
            //     centerInAnchor(self.endAnchor, len-1, len-2);
            // }

            for(c=0; c<len; c++) {
                coord = self.coords[c];
                x = coord.x;
                y = coord.y;
                if(x % 1 !== 0) {
                    coord.x = Math.round(coord.x);
                }
                if(y % 1 !== 0) {
                    coord.y = Math.round(coord.y);
                }
            }
        };

    self.coords = $.extend(true, [], coords);

    self.lines = [];
    self.wideLines = [];
    self.circles = [];
    self.state = 'valid';
    self.gplId = gpl.makeId();
    lineDefaults.gplId = self.gplId;

    startX = self.coords[0].x;
    startY = self.coords[0].y;

    endX = self.coords[self.coords.length-1].x;
    endY = self.coords[self.coords.length-1].y;

    self.startAnchor = gpl.manager.getObject({
        gplType: 'anchor',
        left: startX,
        top: startY
    });

    self.endAnchor = gpl.manager.getObject({
        gplType: 'anchor',
        left: endX,
        top: endY
    });

    fixCoords();

    // gpl.log('startAnchor:', startAnchor);
    // gpl.log('endAnchor:', endAnchor);

    self.setColor = function(color) {
        forEachLine(function(line) {
            line.setStroke(color || '#000000');
        });
    };

    self.detach = function(anchor) {
        var block,
            property;

        if(anchor) {
            block = gpl.blockManager.getBlock(anchor.gplId);
            property = anchor.anchorType;

            if(self.startAnchor === anchor) {
                self.startAnchor = null;
            } else if(self.endAnchor === anchor) {
                self.endAnchor = null;
            }

            block.syncAnchorPoints();
        }
    };

    self.getOtherAnchor = function(anchor) {
        var ret;

        if(self.startAnchor === anchor) {
            ret = self.endAnchor;
        } else if(self.endAnchor === anchor) {
            ret = self.startAnchor;
        }

        return ret || {};
    };

    self.revertState = function() {
        var state = self.prevState.charAt(0).toUpperCase() + self.prevState.substring(1);

        if(self['set' + state]) {
            self['set' + state]();
        }
    };

    self.setInvalid = function() {
        self.prevState = self.state || 'valid';
        self.state = 'invalid';
        forEachLine(function(line) {
            line.set({
                'stroke': invalidColor,
                'strokeWidth': invalidWidth
            });
        });
        gpl.manager.renderAll();
    };

    self.setValid = function() {
        self.prevState = self.state || 'valid';
        if(self.state !== 'valid') {
            self.state = 'valid';
            forEachLine(function(line) {
                line.set({
                    'stroke': validColor,
                    'strokeWidth': validWidth
                });
            });
            gpl.manager.renderAll();
        }
    };

    self.setSelected = function() {
        self.prevState = self.state || 'valid';
        self.state = 'selected';
        gpl.lineManager.selectedLine = self;
        forEachLine(function(line) {
            line.set({
                'stroke': selectedColor,
                'strokeWidth': selectedWidth
            });
        });
    };

    self.deselect = function() {
        self.revertState();
    };

    self.validate = function() {
        var valid = false;

        if(self.startAnchor && self.endAnchor) {
            valid = gpl.validate.connection(self.startAnchor, self.endAnchor);
        }

        if(!valid) {
            self.setInvalid();
        }
        return valid;
    };

    self.removeLines = function() {
        forEachLine(function(line) {
            line.off();
            canvas.remove(line);
        }, true);//, 1000, function() {

        canvas.renderAll();

        calculatedSegments = [];
        self.lines = [];
        self.wideLines = [];
    };

    self.delete = function() {
        if(self.state !== 'deleting' && self.state !== 'deleted') {
            self.state = 'deleting';

            if(self.startAnchor) {
                self.startAnchor.detach(self);
                self.startAnchor = null;
            }

            if(self.endAnchor) {
                self.endAnchor.detach(self);
                self.endAnchor = null;
            }

            self.removeLines();

            gpl.lineManager.remove(self.gplId);

            gpl.manager.renderAll();
            self.state = 'deleted';
        }
    };

    self.redrawLine = function(gplId, newCoord) {
        var testAnchor = function(anchor) {
                return anchor.gplId === gplId;
            },
            startCoords = self.coords[0],
            endCoords = self.coords.slice(-1)[0],
            start,
            end;

        self.removeLines();

        if(testAnchor(self.startAnchor)) {
            start = newCoord;
            end = endCoords;
        } else if(testAnchor(self.endAnchor)) {
            start = startCoords;
            end = newCoord;
        }

        self.coords = [start, end];

        drawLines();
    };

    drawLines();

    if(!self.startAnchor || !self.endAnchor) {
        self.setInvalid();
    }

    if(self.startAnchor) {
        self.startAnchor.attach(this);
    }
    if(self.endAnchor) {
        self.endAnchor.attach(this);
    }
};

gpl.Toolbar = function(manager) {
    var self = this,
        types = manager.blockTypes,
        padding = 5,
        defaultHeight = 30,
        defaultWidth = 30,
        width = 2 * defaultWidth + 3 * padding + 2,
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
        canvas = manager.canvas,
        height = canvas.height,
        currX = padding,
        currY = padding,
        shapes = {},
        dragShape,
        makeId = gpl.makeId,
        bringProxiesToFront = function() {
            var proxy;
            for(proxy in proxies) {
                if(proxies.hasOwnProperty(proxy)) {
                    gpl.manager.bringToFront(proxies[proxy]);
                }
            }
            gpl.manager.renderAll();
        },
        drawToolbar = function() {
            self.background = new fabric.Rect({
                left: 0,
                top: 0,
                fill: backgroundFill,
                width: width,
                height: height,
                selectable: false
            });
            canvas.add(self.background);
            gpl.manager.renderAll();
        },
        handleDrop = function(event) {
            var newShape = activeProxy.gplShape;

            if(event.e.x >= gpl.editModeOffset) {
                newShape.isToolbar = false;
                newShape.bypassSave = false;

                if(newShape.calcOffsets) {
                    newShape.calcOffsets();
                }
                newShape.setCoords();
                gpl.manager.addNewPoint(newShape);
            } else {
                newShape.delete();
            }

            activeProxy.gplShape = activeProxy.nextShape;
            activeProxy.gplId = activeProxy.gplShape.gplId;

            activeProxy.set({
                left: activeProxy._origLeft,
                top: activeProxy._origTop
            });
            activeProxy.setCoords();

            manager.bringToFront(activeProxy);
            manager.clearState();

            this.off('mouseup', handleDrop);

            canvas.discardActiveObject();
        },
        handleClick = function(item) {
            var gplItem = shapes[item.gplId] || gpl.texts[item.gplId],
                itemType = gplItem.type,
                clone,
                cloneConfig,
                getProperties = function(obj) {
                    var ret = {},
                        c,
                        propList = ['zIndex', 'blockType', 'left', 'top', 'selectable', 'evented', 'hasControls', 'inactive', 'showValue', 'iconType', 'visible', 'opacity'];

                    for(c=0; c<propList.length; c++) {
                        ret[propList[c]] = obj[propList[c]];
                    }
                    return ret;
                },
                id = makeId();

            activeProxy = item;

            manager.setState('AddingBlock');

            // item.isClone = gplItem.isClone = true;

            if(gplItem instanceof gpl.blocks.TextBlock) {
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

            if(gplItem.setActive) {
                gplItem.setActive();
            }


            clone = new gpl.blocks[itemType](cloneConfig);

            activeProxy.nextShape = clone;

            shapes[id] = clone;
            item.on('mouseup', handleDrop);

            bringProxiesToFront();
        },
        renderItem = function(cfg, iconType) {
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
                    // hasControls: false,
                    gplId: id,
                    inactive: true,
                    bypassSave: true,
                    iconType: iconType,
                    showValue: false
                };

            Item = gpl.blocks[cls];

            if(Item) {
                if(!skipToolbar) {
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

                    if(!gpl.isEdit) {
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
                        iconType: iconType,
                        showValue: false
                    });

                    dragShape.blockType = iconType;

                    proxyCfg.gplShape = shape;

                    shapes[id] = dragShape;

                    numIcons++;

                    if(numIcons % columns === 0) {
                        currY += rowHeight + padding;
                        currX = padding;
                        rowHeight = 0;
                    } else {
                        currX += shape.toolbarWidth + padding;
                    }

                    proxyShape = new fabric.Rect(proxyCfg);
                    manager.canvas.add(proxyShape);
                    proxies[proxyCfg.gplId] = proxyShape;

                    proxyShape.on('moving', function(){
                        var syncShape = proxyShape.gplShape;//shapes[proxyCfg.gplId];

                        if(syncShape.syncObjects) {
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

    self.shapes = shapes;
    self.proxies = proxies;

    drawToolbar();

    gpl.forEach(types, renderItem);

    if(numIcons % columns === 1) {
        currY += rowHeight + padding;
    }

    bringProxiesToFront();

    self.background.set('height', currY + 2 * padding);

    manager.registerHandlers([{
            event: 'object:selected',
            handler: function(event) {
                var tgt = event.target;
                if(tgt.isToolbarProxy) { // if(tgt.master !== true && tgt.isClone !== true) {
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
        }]
    );
};

/* ------------ Managers ----------------- */

gpl.BlockManager = function(manager) {
    var self = {
        blocks: {},
        upis: {},
        newBlocks: {},
        deletedBlocks: {},
        editedBlocks: {},
        screenObjects: [],
        doubleClickDelay: 400,
        lastSelectedBlock: null,
        highlightFill: '#ffffff',
        bindings: {
            blockTitle: ko.observable(),
            // editPointReferenceType: ko.observable('External'),
            editPointType: ko.observable(),
            editPointName: ko.observable(),
            editPointCharacters: ko.observable(),
            editPointDecimals: ko.observable(),
            editPointValue: ko.observable(),
            editPointLabel: ko.observable(),
            editPointShowValue: ko.observable(),
            editPointShowLabel: ko.observable(),
            selectedReference: ko.observable(),
            gridSize: ko.observable(gpl.gridSize),
            blockReferences: ko.observableArray([]),
            deleteBlock: function() {
                gpl.fire('deleteblock', manager.contextObject);
            },
            showDevicePoint: function() {
                self.openPointEditor(true);
            },
            editBlockPrecision: function() {
                var block = manager.contextObject,
                    precision = block.precision.toString().split('.'),
                    numChars = parseInt(precision[0], 10),
                    numDecimals = parseInt(precision[1], 10);

                self.bindings.editPointCharacters(numChars);
                self.bindings.editPointDecimals(numDecimals);

                self.editBlock = block;
                self.openPrecisionEditor();
            },
            showPointEditor: function() {
                var block = manager.contextObject;

                gpl.blockManager.openPointEditor(block, true);
            },
            updateBlockPrecision: function() {
                self.editBlock.precision = parseFloat(self.bindings.editPointCharacters() + '.' + self.bindings.editPointDecimals());
                self.editBlock.setPlaceholderText();
                gpl.fire('editedblock', self.editBlock);
                self.closePrecisionEditor();
            },
            editPointReference: function() {
                var url = '/pointLookup/',
                    isControl = self.editBlock.type === 'ControlBlock',
                    block,
                    deviceId = isControl?gpl.deviceId:null,
                    pointType,
                    property = isControl?'Control Point':'Monitor Point';

                if(isControl) {
                    block = self.editBlock.inputAnchors[0].getConnectedBlock();
                } else {
                    block = self.editBlock.outputAnchor.getConnectedBlock();
                }

                if(block) {
                    pointType = block.pointType;

                    url += pointType + '/' + property;

                    if(deviceId) {
                        url += '/' + deviceId;
                    }
                }

                self.doOpenPointSelector(url, property);
            },
            updatePoint: function() {
                var label = self.bindings.editPointLabel(),
                    labelId,
                    showValue = self.bindings.editPointShowValue(),
                    showLabel = self.bindings.editPointShowLabel();

                 if(self.editBlock.hasReferenceType) {//is monitor/control block
                    self.editBlock.getReferencePoint(true);
                    self.editBlock.setReferenceType(self.bindings.editPointReferenceType());
                    self.editBlock.pointName = self.bindings.editPointName();
                    self.editBlock.setLabel(self.editBlock.pointName.split('_').pop());
                    self.editBlock.upi = self.editBlockUpi;
                    self.editBlock.valueType = gpl.manager.valueTypes[self.editBlockPointType];
                } else {//constant
                    self.editBlock.setValue(+self.bindings.editPointValue());
                }

                if(self.editBlock.isNonPoint === true && self.editBlock.referenceType !== 'External' && self.editBlock.blockType !== 'Constant') {
                    labelId = self.bindings.selectedReference();
                    label = self.getBlock(labelId).label;

                    if(label !== self.editBlock.label) {
                        self.editBlock.setLabel(label);
                        self.bindings.editPointLabel(label);
                    }
                }

                self.editBlock.precision = parseFloat(self.bindings.editPointCharacters() + '.' + self.bindings.editPointDecimals());

                self.editBlock.setShowLabel(showLabel);
                self.editBlock.setShowValue(showValue);

                gpl.$editInputOutputModal.modal('hide');

                gpl.fire('editedblock', self.editBlock);
            }
        },
        lastSelectedTime: new Date().getTime(),

        manager: manager,
        canvas: manager.canvas,

        upiListeners: {},

        getActiveBlock: function() {
            var target = self.canvas.getActiveObject(),
                gplId = (target && target.gplId) || null,
                activeBlock = self.blocks[gplId] || null;

            return {
                target: target,
                block: activeBlock
            };
        },

        getSaveObject: function() {
            var saveObj = {
                    adds: [],
                    updates: [],
                    deletes: []
                };

            gpl.forEach(self.newBlocks, function(block) {
                if(!block.isNonPoint) {
                    saveObj.adds.push(block.getPointData());
                }
            });

            gpl.forEach(self.editedBlocks, function(block) {
                if(!block.isNonPoint) {
                    saveObj.updates.push({
                        oldPoint: block._origPointData,
                        newPoint: block.getPointData()
                    });
                }
            });

            gpl.forEach(self.deletedBlocks, function(block) {
                if(!block.isNonPoint) {
                    saveObj.deletes.push(block.upi);
                }
            });

            return saveObj;
        },

        resetChanges: function() {
            self.newBlocks = {};
            self.editedBlocks = {};
            self.deletedBlocks = {};
        },

        doOpenPointSelector: function(url, property) {
            gpl.openPointSelector(function(upi, name, pointType) {
                self.bindings.editPointName(name);
                self.editBlockUpi = upi;
                self.editBlockPointType = pointType;
                gpl.log(upi, name);
            }, url, null, property);
        },

        openPrecisionEditor: function(block) {
            gpl.$editPrecisionModal.modal('show');
        },

        closePrecisionEditor: function() {
            gpl.$editPrecisionModal.modal('hide');
        },

        openBlockEditor: function(block) {
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
                self.editBlock = block;
                self.editBlockUpi = block.upi;
                self.bindings.blockTitle(block.label);
                self.bindings.editPointType(block.type);
                self.bindings.editPointName(block.pointName);
                self.bindings.editPointCharacters(numChars);
                self.bindings.editPointDecimals(numDecimals);
                self.bindings.editPointValue(value);
                self.bindings.editPointLabel(label);
                self.bindings.editPointShowValue(block.labelVisible);
                self.bindings.editPointShowLabel(block.presentValueVisible);

                gpl.$editInputOutputModal.modal('show');
            // }
        },

        convertBlock: function(block) {
            var ret = {},
                prop,
                shape,
                c;

            //not text
            if(block._shapes && block._shapes[0]) {
                shape = block._shapes[0];
                ret.left = shape.left;
                ret.top = shape.top;
            } else {
                ret = $.extend(true, {}, block.config);
                ret.left = block.left;
                ret.top = block.top;
                ret.width = block.width;
                ret.height = block.height;
                ret.value = block.value;
                gpl.log('no shapes');
            }

            for(c=0; c<gpl.convertProperties.length; c++) {
                prop = gpl.convertProperties[c];
                if(block[prop]) {
                    ret[prop] = block[prop];
                }
            }

            return ret;
        },

        getBlock: function(gplId) {
            var ret = null,
                id = gplId;

            if(typeof id !== 'string') {
                id = gpl.idxPrefix + parseInt(id, 10);
            }

            ret = self.blocks[id];

            if(!ret) {
                ret = self.newBlocks[id];
            }

            return ret;
        },

        add: function(object) {
            this.canvas.add(object);
        },

        remove: function(object) {
            this.canvas.remove(object);
        },

        renderShape: function(Shape, config) {
            gpl.log('rendering shape', config);
            this.canvas.add(new Shape(config));
            this.gpl.manager.renderAll();
        },

        renderAll: function() {
            gpl.manager.renderAll();
        },

        handleTypeChange: function(object, event) {
            // var refType =
            gpl.log('type change', arguments);
        },

        prepSaveData: function(saveObject) {
            var ret = [],
                lines = [];

            gpl.forEach(self.blocks, function(obj) {
                if(!obj.bypassSave) {
                    if(obj.syncAnchorPoints) {
                        obj.syncAnchorPoints();
                    }
                    ret.push(self.convertBlock(obj));
                }
            });

            saveObject.block = ret;
        },

        prepReferences: function() {
            var references = gpl.references,
                upiMap = {},
                pointData = {},
                upi,
                c,
                cleanup = function(ref) {
                    pointData[ref._id] = ref;
                    return {
                        Name: ref.Name,
                        pointType: ref['Point Type'].Value,
                        valueType: (ref['Value'].ValueType===5)?'enum':'float'
                    };
                    // return ref;
                };

            for(c=0; c<references.length; c++) {
                upi = references[c]._id;
                upiMap[upi] = cleanup(references[c]);
            }

            gpl.pointUpiMap = upiMap;
            gpl.pointData = pointData;
        },

        addUPIListener: function(upi, anchor, line, fn) {
            self.upiListeners[upi] = self.upiListeners[upi] || [];

            self.upiListeners[upi].push({
                fn: fn,
                anchor: anchor,
                line: line
            });
        },

        init: function() {
            // if(gpl.isEdit === true) {
                manager.addToBindings(self.bindings);
            // }

            self.prepReferences();
        }
    };

    self.bindings.gridSize.subscribe(function(val) {
        var newVal = parseInt(val, 10);

        if(isNaN(newVal) || newVal === 0) {
            self.bindings.gridSize(gpl.gridSize || 1);
        } else {
            gpl.gridSize = newVal;
        }
    });

    self.validateAll = function() {
        var valid = true,
            checkValid = function(block) {
                if(!block.isToolbar && block.validate) {
                    valid = block.validate();
                }
                // gpl.log('valid', valid);
                return valid;
            };

        gpl.forEach(self.blocks, checkValid);

        if(valid) {
            gpl.forEach(self.newBlocks, checkValid);
        }

        gpl.log('Validate All result:', valid);

        gpl.manager.renderAll();

        return valid;
    };

    self.highlight = function(shape) {
        if(gpl.isEdit) {
            if(self.highlightedObject) {
                self.deselect();
            }

            self.highlightedObject = shape;
            if(!shape._origFill) {
                shape._origFill = shape.fill;
            }
            shape.set('fill', self.highlightFill);
        }
    };

    self.deselect = function() {
        var obj = self.highlightedObject;
        if(obj) {
            obj.set('fill', obj._origFill);
        }
        self.highlightedObject = null;
    };

    gpl.on('newblock', function(newBlock) {
        gpl.hasEdits = true;
        self.newBlocks[newBlock.gplId] = newBlock;
        self.updateBlockReferences(newBlock);
    });

    gpl.on('editedblock', function(block) {
        gpl.hasEdits = true;
        self.editedBlocks[block.gplId] = block;
    });

    gpl.on('deleteblock', function(oldBlock) {
        gpl.hasEdits = true;
        self.deletedBlocks[oldBlock.gplId] = oldBlock;
        delete self.blocks[oldBlock.gplId];
        oldBlock.delete();
        self.renderAll();
        gpl.log('deleteblock handler');
    });

    gpl.on('save', function() {
        self.prepSaveData(gpl.json);
    });

    gpl.on('saveForLater', function() {
        self.prepSaveData(gpl.json.editVersion);
    });

    self.create = function(config) {
        var Cls = config.cls,
            cfg = config.cfg,
            obj;

        delete cfg.type;

        obj = new Cls(cfg);

        return obj;
    };

    self.applyUpdateInterval = function(interval) {
        gpl.forEach(self.blocks, function(obj) {
            if(obj._pointData && obj._pointData['Update Interval']) {
                gpl.fire('editedblock', obj);
                obj._pointData['Update Interval'].Value = interval;
            }
        });
    };

    self.applyController = function(name, value) {
        gpl.forEach(self.blocks, function(obj) {
            if(obj._pointData) {
                gpl.fire('editedblock', obj);
                obj._pointData.Controller.Value = name;
                obj._pointData.Controller.eValue = value;
            }
        });
    };

    self.applyShowLabel = function(bool) {
        gpl.forEach(self.blocks, function(obj) {
            if(obj.setShowLabel && !obj.isToolbar) {
                obj.setShowLabel(bool);
            }
        });
    };

    self.applyShowValue = function(bool) {
        gpl.forEach(self.blocks, function(obj) {
            if(obj.setShowValue && !obj.isToolbar) {
                obj.setShowValue(bool);
            }
        });
    };

    self.updateBlockReferences = function(block) {
        self.bindings.blockReferences.push({
            label: block.label,
            value: block.gplId
        });

        self.bindings.blockReferences.sort(function(left, right) {
            return left.label < right.label ? -1 : 1;
        });
    };

    self.registerBlock = function(block, valueText) {
        var items = block._shapes || [],
            item,
            c,
            handleBlockMove = function(event) {
                var data = self.getActiveBlock(),
                    target = data.target,
                    movingBlock = data.block;

                if(event.e.movementX !== 0 || event.e.movementY !== 0) {
                    self.movingBlock = true;

                    if(movingBlock && movingBlock.syncObjects && target.gplType !== 'anchor') {
                        // gpl.log('moving block', movingBlock);
                        movingBlock.syncObjects(target);
                    }

                    gpl.actionLog.push({
                        action: 'moved',
                        obj1: movingBlock
                    });
                } else {
                    self.movingBlock = false;
                }
            };

        self.blocks[block.gplId] = block;

        // if(gpl.labelCounters[block.type] === undefined) {
        //     gpl.log('not setup', block.type, block);
        // }
        if(!block.config.inactive) {
            gpl.labelCounters[block.type]++;
        }

        // gpl.log('labeling', block.type, gpl.labelCounters[block.type]);

        self.canvas.add(block);

        if(self.upis[block.upi] === undefined) {
            self.upis[block.upi] = [];
            self.screenObjects.push({
                upi: block.upi,
                'Quality Label': '',
                isGplSocket: true
            });
        }

        self.upis[block.upi].push({
            block: block,
            valueText: valueText
        });

        gpl.manager.addToBoundingRect(block);

        for(c=0; c<items.length; c++) {
            item = items[c];
            self.canvas.add(item);
            item.on('moving', handleBlockMove);
        }

        if(!block.isToolbar) {
            self.updateBlockReferences(block);
        }

        self.renderAll();
    };

    self.processValue = function(upi, dyn) {
        var upis = self.upis[upi],
            upiListeners = self.upiListeners,
            listeners = upiListeners[upi] || [],
            listener,
            text = dyn.Value,
            block,
            valueText,
            c,
            row,
            qualityCode = dyn['Quality Label'];

        // gpl.log('dynamic for ', upi);

        for(c=0; c<upis.length; c++) {
            row = upis[c];
            block = row.block;
            valueText = row.valueText;

            text = gpl.formatValue(block, dyn.Value);

            if(qualityCode !== 'none') {
                text += ' ' + gpl.qualityCodes[qualityCode].text;
            }

            if(qualityCode !== 'none') {
                valueText.setFill('#' + gpl.qualityCodes[qualityCode].color);
            } else {
                valueText.setFill('#000000');
            }
            valueText.setText(text);
            block.currValue = dyn.Value;
        }

        for(c=0; c<listeners.length; c++) {
            listener = listeners[c];
            listener.fn(listener.upi, listener.anchor, listener.line, dyn);
            // listeners(upi, dyn);
        }

        self.renderAll();
    };

    self.openPointEditor = function(block, override) {//for view mode clicks to edit
        var upi,
            pointData = block && block.getPointData && block.getPointData(),
            windowRef,
            endPoint,
            url,
            pointName,
            pointType,
            doOpenWindow = function(fn) {
                windowRef = gpl.openWindow(url, pointName, pointType, '', upi, {
                    width: 820,
                    height: 540
                });

                (fn || gpl.emptyFn)();
            };

        if(block) {
            if(block instanceof gpl.Block) {
                if(override || (!block.isNonPoint || (block.isNonPoint && !gpl.isEdit))) {
                    self.deselect();
                    upi = block.upi;
                    endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint(block.pointType, upi);
                    url = endPoint.review.url;
                    pointName = block.pointName;
                    pointType = block.pointType;
                    doOpenWindow(function() {
                        if(gpl.isEdit) {
                            windowRef.attach = {
                                point: pointData?JSON.stringify(pointData):null,
                                saveCallback: function(point) {
                                    var pt = point;
                                    if(typeof pt === 'string') {
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
                    if(block.type === 'ConstantBlock') {
                        self.openBlockEditor(block);
                    }
                }
            } else {//open device point
                upi = gpl.devicePoint._id;
                pointName = gpl.devicePoint.Name;
                pointType = 'Device';
                endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, upi);
                url = endPoint.review.url;
                doOpenWindow();
            }
        }
    };

    self.handleMouseUp = function(event) {
        var data = self.getActiveBlock(),
            target = data.target,
            movingBlock = data.block;

        if(self.movingBlock === true) {
            self.movingBlock = false;
            if(movingBlock && gpl.isEdit) {
                movingBlock.redrawLines();
            }
        } else {
            if(event.which === undefined && movingBlock && !self.handlingDoubleClick && !gpl.isEdit) {
                self.openPointEditor(movingBlock);
                self.deselect();
            }
        }

        self.handlingDoubleClick = false;
    };

    self.handleDoubleClick = function(event) {
        var target = event.target,
            gplId,
            targetBlock,
            now = new Date().getTime();

        if(target && gpl.isEdit) {
            gplId = target.gplId;
            targetBlock = self.blocks[gplId];

            if(now - self.lastSelectedTime < self.doubleClickDelay && targetBlock) {//doubleclick
                self.handlingDoubleClick = true;
                self.deselect();
                // gpl.log('processing double click');
                if(!targetBlock.isNonPoint) {
                    self.openPointEditor(targetBlock);
                } else if(!targetBlock.useNativeEdit && gpl.isEdit) {
                    self.openBlockEditor(targetBlock);
                }
            } else {
                // gpl.log('too much time');
                self.lastSelectedTime = now;
                self.lastSelectedBlock = targetBlock;
            }
        }
    };

    self.handleKeyUp = function(event) {
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

        if(self.highlightedObject && dir) {
            block = self.getBlock(self.highlightedObject.gplId);
            offset = $.extend(offset, handlers[dir]);
            block.nudge(offset);
        }
    };

    self.destroyBlocks = function() {
        gpl.forEach(self.blocks, function(block, gplId) {
            var items = block._shapes || [],
                c;

            for(c=0; c<items.length; c++) {
                items[c].off();
            }

            if(block.destroy) {
                block.destroy();
            }
            delete self.blocks[gplId];
        });
    };

    manager.registerHandlers([{
        event: 'selection:cleared',
        handler: self.deselect
    }, {
        event: 'mouse:up',
        handler: self.handleMouseUp
    }, {
        event: 'mouse:down',
        handler: self.handleDoubleClick
    }, {
        event: 'keyup',
        handler: self.handleKeyUp,
        type: 'DOM',
        window: true
    }]);

    self.init();

    gpl.onDestroy(function() {
        self.destroyBlocks();
        delete self.blocks;
        delete self.screenObjects;
        delete self.upiListeners;
        delete self.upis;
        delete self.manager;
        delete self.canvas;
    });

    return self;
};

gpl.Manager = function() {
    var self = this,
        started = new Date().getTime(),
        configuredEvents = {},
        log = gpl.log,
        initDelay = 1,
        currInitStep = 0,
        // renderDelay = 100,

        sequenceEditProperties = ['Width', 'Height', 'Show Label', 'Show Value'],
        mergeProperties = ['Show Label', 'Show Value'],
        initFlow = ['initBindings', 'initCanvas', 'initManagers', 'initQualityCodes', 'initShapes', 'initEvents', 'initKnockout', 'initToolbar', 'initSocket'],

        initLabels = function() {
            var type,
                types = self.blockTypes;
                for(type in types) {
                    if(types.hasOwnProperty(type)) {
                        gpl.labelCounters[types[type].blockType] = 0;
                    }
                }
        },

        initPointNamePrefix = function() {
            var c,
                lastSegment,
                ret = [],
                done = false;

            for(c=4; c>0 && !done; c--) {
                if(gpl.point['name' + c] !== '') {
                    done = true;
                }
            }

            if(done) {
                lastSegment = c+1;
                for(c=1; c<=lastSegment; c++) {
                    ret.push(gpl.point['name' + c]);
                }
            }
            //else something's wrong, no blank segments

            ret = ret.join('_') + '_';

            gpl.pointNamePrefix = ret;
        },

        offsetLinePositions = function(reset, seq) {
            var list = seq.line,
                len = list.length,
                handles,
                cc,
                ccc;

            for(cc=0; cc<len; cc++) {
                handles = list[cc].handle;
                for(ccc=0; ccc<handles.length; ccc++) {
                    handles[ccc].x = +handles[ccc].x + (!reset?gpl.editModeOffset:(-1 * gpl.editModeOffset));
                }

            }
        },
        offsetBlockPositions = function(reset, seq) {
            var list = seq.block,
                len = list.length,
                cc;

            for(cc=0; cc<len; cc++) {
                list[cc].left = +list[cc].left + (!reset?gpl.editModeOffset:(-1 * gpl.editModeOffset));
            }
        },
        offsetPositions = function(reset, seq) {
            offsetLinePositions(!!reset, seq || gpl.json);
            offsetBlockPositions(!!reset, seq || gpl.json);
        },
        init = function() {
            // var lastInit,
            var now = new Date().getTime(),
                doNextInit = function() {
                    var initFn = initFlow[currInitStep];
                        // now = new Date();

                    // if(currInitStep > 0) {
                    //     log(initFlow[currInitStep - 1], 'finished in', ((now - lastInit)/1000).toFixed(3));
                    // }

                    if(initFn !== undefined) {
                        currInitStep++;
                        setTimeout(function() {
                            // lastInit = new Date();
                            log('Running next init:' + initFn);
                            self[initFn]();
                            doNextInit();
                        }, initDelay);
                    } else {
                        log('Finished init functions');
                        self.getBoundingBox();
                        self.postInit();
                        gpl.skipEventLog = false;

                        if(gpl.isEdit) {
                            $('body').addClass('editMode');
                        } else {
                            $('body').addClass('viewMode');
                        }

                        log('Finished initializing GPL Manager in', ((new Date().getTime() - started)/1000).toFixed(3), 'seconds');

                        self.resizeWindow();
                        setTimeout(function() {
                            gpl.rendered = true;
                            self.resumeRender();
                            self.bindings.loaded(true);
                            gpl.fire('rendered');
                        },100);
                    }
                },
                prop,
                c;

            self.confirmEditVersion = function() {
                self.hideEditVersionModal();
                gpl.json.editVersion = {};

                doNextInit();
            };

            //fix for IE not showing window.opener when first loaded
            gpl.getPointTypes = window.opener && window.opener.workspaceManager && window.opener.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes;
            gpl.workspaceManager = window.opener && window.opener.workspaceManager;
            gpl._openWindow = window.opener && window.opener.workspaceManager && window.opener.workspaceManager.openWindowPositioned;

            if(!gpl.point.SequenceData) {
                gpl.showMessage('Sequence data not found');
            } else {
                gpl.json = gpl.point.SequenceData.sequence;

                //forces new (hex) format, if flag exists it's already been converted/defaulted
                if(!gpl.json._convertedBG) {
                    //if existing, it's old system and needs converting
                    if(gpl.json.backgroundColor) {
                        gpl.json.backgroundColor = gpl.convertColor(gpl.json.backgroundColor);
                    } else {//doesn't exist, assign default
                        gpl.json.backgroundColor = gpl.defaultBackground;
                    }

                    gpl.json._convertedBG = true;
                }

                gpl.deviceId = gpl.point['Point Refs'][0].DevInst;

                self.backgroundColor = gpl.json.backgroundColor;

                self.state = null;
                self.editMode = false;
                self.queueRenders = true;
                self.haltRender = true;
                self.lastRender = new Date().getTime();
                self.gplObjects = {};
                self.eventHandlers = {};
                self.bindings = {};
                self.shapes = [];
                self.canvasElID = 'gplCanvas';
                self.$canvasEl = $('#' + self.canvasElID);
                self.$saveButton = $('#save');
                self.$saveForLaterButton = $('#saveForLater');
                self.$editButton = $('#edit');
                self.$cancelButton = $('#cancel');
                self.$validateButton = $('#validate');
                self.$contextMenuList = $('#jqxMenu ul');
                self.contextMenu = $('#jqxMenu').jqxMenu({
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
                self.tooltipFill = '#3d3d3d';
                self.tooltipFontColor = '#f4f4f4';
                self.minX = 9999;
                self.minY = 9999;
                self.maxX = 0;
                self.maxY = 0;

                self.blockTypes = {
                    //icon: cls
                    Constant:               {blockType:'ConstantBlock'},
                    Output:                 {blockType:'ControlBlock'},
                    Input:                  {blockType:'MonitorBlock'},
                    AlarmStat:              {blockType:'AlarmStatus'},
                    BINMDualSP:             {blockType:'BinarySetPoint'},
                    BINMSingleSP:           {blockType:'BinarySetPoint'},
                    Delay:                  {blockType:'Delay'},
                    OneShot:                {blockType:'Delay'},
                    FindLargest:            {blockType:'SelectValue'},
                    FindSmallest:           {blockType:'SelectValue'},
                    Average:                {blockType:'Average'},
                    Sum:                    {blockType:'Average'},
                    Add:                    {blockType:'Math'},
                    Divide:                 {blockType:'Math'},
                    Multiply:               {blockType:'Math'},
                    Subtract:               {blockType:'Math'},
                    AddSqrt:                {blockType:'Math', skipToolbar: true},
                    DivideSqrt:             {blockType:'Math', skipToolbar: true},
                    MultiplySqrt:           {blockType:'Math', skipToolbar: true},
                    SubtractSqrt:           {blockType:'Math', skipToolbar: true},
                    MUX:                    {blockType:'MUX'},
                    PI:                     {blockType:'PI'},
                    Proportional:           {blockType:'PI', skipToolbar: true},
                    ReverseActingPI:        {blockType:'PI', skipToolbar: true},
                    SPA:                    {blockType:'SPA'},
                    Ramp:                   {blockType:'Ramp'},
                    Totalizer:              {blockType:'Totalizer'},
                    TextBlock:              {blockType:'TextBlock'},
                    AnalogDualSetPoint:     {blockType:'AnalogSetPoint'},
                    AnalogSingleSetPoint:   {blockType:'AnalogSetPoint'},
                    SUMWSingleSP:           {blockType:'AnalogSetPoint', skipToolbar: true},
                    SUMWDualSP:             {blockType:'AnalogSetPoint', skipToolbar: true},
                    Econ:                   {blockType:'Economizer'},
                    Enthalpy:               {blockType:'Enthalpy'},
                    DewPoint:               {blockType:'Enthalpy'},
                    WetBulb:                {blockType:'Enthalpy'},
                    GT:                     {blockType:'Comparator'},
                    GTEqual:                {blockType:'Comparator'},
                    LT:                     {blockType:'Comparator'},
                    LTEqual:                {blockType:'Comparator'},
                    Equal:                  {blockType:'Comparator'},
                    NEqual:                 {blockType:'Comparator'},
                    Logic:                  {blockType:'Logic'},
                    DigLogicAnd:            {blockType:'DigLogic'},
                    DigLogicOr:             {blockType:'DigLogic'},
                    DigLogicXOr:            {blockType:'DigLogic'}
                };

                for(c=0; c<mergeProperties.length; c++) {
                    prop = mergeProperties[c];
                    gpl.json[prop.replace(' ','_')] = gpl.point[prop].Value || false;
                }

                self.valueTypes = {};

                gpl.forEach(gpl.blocks, function(cls, clsName) {
                    self.valueTypes[cls.prototype.pointType] = cls.prototype.valueType;
                });

                document.title = gpl.point.Name;

                initPointNamePrefix();

                if(gpl.isEdit) {
                    if(gpl.json.editVersion && gpl.json.editVersion.block) {//has edit version
                        // if(now - gpl.point._pollTime > gpl.editVersionStaleTimeout) {//stale
                            // gpl.$discardEditVersionButton.click(discardEditVersion);
                            // gpl.$useEditVersionButton.click(useEditVersion);
                            self.showEditVersionModal();
                        // } else {//not stale
                        //     gpl.showMessage('This sequence currently being edited');
                        // }
                        //check if stale.  if not, block changes.  if so, ask if they want to use it?
                    } else {
                        self.confirmEditVersion();
                    }
                } else {
                    doNextInit();
                }
            }
        };

    log('Initializing GPL Manager');

    gpl.skipEventLog = true;

    self.postInit = function() {
        return;
    };

    self.offsetEverything = function(num, line, block) {
        var c,
            cc,
            handles,
            list = gpl.json.block;

        if(block !== false) {
            for (c = 0; c < list.length; c++) {
                list[c].left -= num * gpl.editModeOffset;
            }
        }

        if(line !== false) {
            list = gpl.json.line;
            for (c = 0; c < list.length; c++) {
                handles = list[c].handle;
                for (cc = 0; cc < handles.length; cc++) {
                    handles[cc].x -= num * gpl.editModeOffset;
                }
            }
        }

        self.socket.emit('updateSequence', {
            sequenceName: gpl.point.Name,
            sequenceData: {
                sequence: gpl.json
            }
        });

    };

    self.addToBindings = function(props) {
        self.bindings = $.extend(self.bindings, props);
    };

    self.addToBoundingRect = function(block) {
        var items = block._shapes || [],
            start = new Date(),
            item,
            left,
            top,
            right,
            bottom,
            rect,
            c;

        if(block.isToolbar !== true) {
            for(c=0; c<items.length; c++) {
                item = items[c];
                rect = item.getBoundingRect();
                left = rect.left;
                top = rect.top;
                bottom = top + rect.height;
                right = left + rect.width;

                if(block.isToolbar !== true) {
                    if(left < self.minX) {
                        self.minX = left;
                    }

                    if(right > self.maxX) {
                        self.maxX = right;
                    }

                    if(top < self.minY) {
                        self.minY = top;
                    }

                    if(bottom > self.maxY) {
                        self.maxY = bottom;
                    }
                }
            }

            if(gpl.rendered === true) {
                self.getBoundingBox();
            }
        }

        gpl.boundingRectTime += new Date() - start;
        gpl.boundingRectCount++;
    };

    self.getBoundingBox = function() {
        var top = self.minY,
            bottom = self.maxY,
            left = self.minX,
            right = self.maxX;
            // lineDefaults = {
            //     stroke: '#ffffff',
            //     strokeWidth: 2
            // };

        if(top < 0) {
            top = 0;
        }
        if(left < 0) {
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
        // self.canvas.add(new fabric.Line([left, top, left, bottom], lineDefaults));
        // self.canvas.add(new fabric.Line([left, bottom, right, bottom], lineDefaults));
        // self.canvas.add(new fabric.Line([right, bottom, right, top], lineDefaults));
        // self.canvas.add(new fabric.Line([right, top, left, top], lineDefaults));
    };

    self.resizeWindow = function() {
        var box = gpl.boundingBox,
            right = box.right,
            bottom = box.bottom,
            verticalBuffer = 50,
            horizontalBuffer = 50,
            minHeight = 750,
            width = right + horizontalBuffer,
            height,
            heightOffset = 70;

        if(window.top === window) {
            if(gpl.isEdit) {
                height = bottom>minHeight?bottom:minHeight;
                // window.resizeTo(right, bottom>minHeight?bottom:minHeight);
            } else {
                height = bottom + verticalBuffer;
                // window.resizeTo(right, bottom + verticalBuffer);
            }

            height += heightOffset;

            window.resizeTo(width, height);
        }
    };

    self.scale = function(value) {
        var inverted = 1/gpl.scaleValue,
            scaleIt = function(prop) {
                return parseFloat(prop) * inverted * value;
            },
            canvas = self.canvas;
            // currentCanvasHeight = canvas.getHeight(),
            // currentCanvasWidth = canvas.getWidth();
            // scaledCanvasHeight = scaleIt(currentCanvasHeight),
            // scaledCanvasWidth = scaleIt(currentCanvasWidth);

        if(value !== gpl.scaleValue) {
            canvas.forEachObject(function(obj) {
                var currentObjTop = obj.get('top'),
                    currentObjLeft = obj.get('left'),
                    currentObjScaleX = obj.get('scaleX'),
                    currentObjScaleY = obj.get('scaleY'),
                    scaledObjTop = scaleIt(currentObjTop),
                    scaledObjLeft = scaleIt(currentObjLeft),
                    scaledObjScaleX = scaleIt(currentObjScaleX),
                    scaledObjScaleY = scaleIt(currentObjScaleY);

                obj.set({
                    top: scaledObjTop,
                    left: scaledObjLeft,
                    scaleX: scaledObjScaleX,
                    scaleY: scaledObjScaleY
                });

                obj.setCoords();
            });

            gpl.scaleValue = canvas.scaleValue = value;
            self.renderAll();
        }
    };

    self.addNewPoint = function(block) {
        var windowRef,
            pointType = window.encodeURI(block.pointType),
            names = (gpl.pointNamePrefix + block.label).split('_'),
            called = false,
            name1 = names[0],
            name2 = names[1],
            name3 = names[2],
            name4 = names[3] || '',
            handler = function(obj) {
                if(obj && obj.target) {//is event
                    if(!called) {
                        log('New Point canceled, deleting block');
                        block.delete();
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

        if(block.isNonPoint !== true && !(block instanceof gpl.blocks.TextBlock)) {

            windowRef = gpl.openWindow('/pointLookup/newPoint/restrictTo/' + pointType, 'New Point', '', '', 'newPoint', {
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
        }
    };

    self.doSave = function() {
        var saveObj = gpl.blockManager.getSaveObject(),
            isValid = self.validate(),
            finish = function() {
                self.socket.emit('updateSequence', {
                    sequenceName: gpl.point.Name,
                    sequenceData: {
                        sequence: gpl.json
                    }
                });

                offsetPositions(false);

                self.resumeRender();

                gpl.hasEdits = false;

                log('save complete');

                gpl.captureThumbnail();
            };

        if(isValid) {
            // log(saveObj);

            self.pauseRender();

            gpl.fire('save');

            self.socket.emit('updateSequencePoints', saveObj);

            offsetPositions(true);//resets/removes offset

            if(gpl.point._pStatus === 1) {
                self.socket.emit('addPoint', {point:gpl.point});
            }

            finish();
        } else {
            gpl.showMessage(gpl.validateMessage);
        }
    };

    self.doSaveForLater = function() {
        gpl.fire('saveForLater');
        offsetPositions(true, gpl.json.editVersion);
        offsetPositions(true);

        self.socket.emit('updateSequence', {
            sequenceName: gpl.point.Name,
            sequenceData: {
                sequence: gpl.json
            }
        });

        offsetPositions(false, gpl.json.editVersion);
        offsetPositions(false);
    };

    self.doEdit = function() {
        var endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint('Sequence', gpl.upi),
            url = endPoint.edit.url;

        gpl.openWindow(url, gpl.point.Name, 'Sequence', '', gpl.upi);
    };

    self.doCancel = function() {
        var endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint('Sequence', gpl.upi),
            url = endPoint.review.url;

        gpl.openWindow(url, gpl.point.Name, 'Sequence', '', gpl.upi);
    };

    self.popInOut = function() {
        var _target = 'mainWindow';

        if(gpl.poppedIn) {
            _target = '';
        }

        gpl._openWindow(window.location.href, gpl.point.Name, 'Sequence', _target, gpl.upi);

        gpl.poppedIn = !gpl.poppedIn;

        return false;
    };

    self.popInOutText = function() {
        if(gpl.poppedIn) {
            return 'Pop Out';
        }
        return 'Pop In';
    };

    self.popInOutClass = function() {
        if(gpl.poppedIn) {
            return 'fa-arrow-circle-up';
        }
        return 'fa-arrow-circle-down';
    };

    self.sequenceLoaded = ko.observable(false);

    self.validate = function() {
        var valid = gpl.blockManager.validateAll();

        // gpl.showMessage(gpl.invalidMessage || (valid?'':'In') + 'valid');
        // gpl.invalidMessage = null;
        return valid;
    };

    self.getObject = function(config)  {
        var start = new Date().getTime(),
            gap,
            gplType = config.gplType,
            yoffset = config.yoffset || 0,
            xoffset = config.xoffset || 0,
            left = config.left,
            top = config.top,
            x1,
            x2,
            y1,
            y2,
            multiple = config.multiple || false,
            objects = self.canvas.getObjects(),
            c,
            len = objects.length,
            obj,
            ret = [],
            found = false;

        for(c=0; c<len && !found; c++) {
            obj = objects[c];
            if(!gplType || (gplType === obj.gplType)) {
                if(obj.gplType === 'line') {
                    x1 = Math.ceil(Math.min(obj.x1, obj.x2) + xoffset);
                    x2 = Math.ceil(Math.max(obj.x2, obj.x1) + xoffset);
                    y1 = Math.ceil(Math.min(obj.y1, obj.y2) + yoffset);
                    y2 = Math.ceil(Math.max(obj.y2, obj.y1) + yoffset);
                    if(obj.strokeWidth > 1) {
                        if(x1 === x2) {//vertical
                            x1 += obj.strokeWidth;
                            x2 += obj.strokeWidth;
                        } else {//horizontal
                            y1 += obj.strokeWidth;
                            y2 += obj.strokeWidth;
                        }
                    }
                    if((left >= x1 && left <= x2) && (top >= y1 && top <= y2)) {
                        ret.push(obj);
                        if(!multiple) {
                            found = true;
                        }
                    }
                } else {
                    if(left >= obj.left && left <= (obj.left + obj.width) && top >= obj.top && top <= (obj.top + obj.height)) {
                        ret.push(obj);
                        if(!multiple) {
                            found = true;
                        }
                    }
                }
            }
        }

        gap = new Date().getTime() - start;
        self._getObjectCount++;
        self._getObjectTime += gap;
        return multiple?ret:ret[0];
    };

    self.resizeCanvas = function() {
        var start = new Date().getTime(),
            resizeDelay = gpl.resizeDelay,
            prevResize = self.lastCanvasResize || start - resizeDelay,
            doResize = function(now) {
                var width = window.innerWidth,
                    height = window.innerHeight;

                self.canvasResizing = true;

                self.canvas.setWidth(width);
                self.canvas.setHeight(height);
                self.canvas.calcOffset();
                self.lastCanvasResize = new Date().getTime();
                self.canvasResizing = false;
                // log('resized canvas to ', width, 'x', height, gpl.formatDate(self.lastWindowResize), gpl.formatDate(self.lastCanvasResize));
            },
            checkQueue = function() {
                var now = new Date().getTime();

                if(now - self.lastCanvasResize >= resizeDelay) {//only the one call
                    doResize();
                }
            };

        self.lastWindowResize = start;

        if(start - prevResize >= resizeDelay && !self.canvasResizing) {
            doResize();
        } else {
            // log('skipping queue');
            setTimeout(function() {
                checkQueue();
            }, resizeDelay);
        }
    };

    self.renderAll = function() {
        var now = new Date().getTime();

        self.lastRender = now;

        if(!self.haltRender) {
            // log('Rendering');
            self.canvas.renderAll();
        }
    };

    self.pauseRender = function() {
        self.haltRender = true;
    };

    self.resumeRender = function() {
        self.haltRender = false;
        self.renderAll();
    };

    self.setState = function(state) {
        // self.canvas.selection = false;
        self.state = state;
    };

    self.clearState = function() {
        // self.canvas.selection = true;
        self.state = null;
    };

    self.registerHandler = function(config) {
        var event = config.event,
            handler = config.handler,
            type = config.type || 'canvas',
            state = config.state || null,
            domType = config.window?window:document,
            makeHandler = function(handler, state) {
                if(state) {
                    return function(event) {
                        var currState = gpl.manager.state;

                        if(currState === state) {
                            handler(event);
                        }
                    };
                }

                return handler;
            };

        self.eventHandlers[event] = self.eventHandlers[event] || [];
        self.eventHandlers[event].push(makeHandler(handler, state));

        if(!configuredEvents[event]) {
             configuredEvents[event] = true;
             if(type === 'canvas') {
                self.canvas.on(event, function(evt) {
                    self.processEvent(event, evt);
                });
            } else {
                $(domType).on(event, function(evt) {
                    self.processEvent(event, evt);
                });
            }
        }
    };

    self.registerHandlers = function(handlers) {
        var c,
            len = handlers.length;

        for(c=0; c<len; c++) {
            self.registerHandler(handlers[c]);
        }
    };

    self.unregisterHandler = function(config) {
        var event = config.event,
            handler = config.handler,
            c,
            handlers = self.eventHandlers[event] || [];

        for(c=handlers.length-1; c>=0; c--) {
            if(handlers[c] === handler) {
                handlers.splice(c, 1);
            }
        }
    };

    self.unregisterHandlers = function(handlers) {
        var c,
            len = handlers.length;

        for(c=0; c<len; c++) {
            self.unregisterHandler(handlers[c]);
        }
    };

    self.processEvent = function(type, event) {
        var c,
            handlers = self.eventHandlers[type] || [],
            len = handlers.length;

        for(c=0; c<len; c++) {
            handlers[c](event);
        }
    };

    self.handleMouseOver = function(event) {
        var target = gpl.blockManager.getBlock(event.target.gplId),
            text = gpl.point.Name,
            pointer = self.canvas.getPointer(event.e),
            x,
            y;

        // if(event.target === self.tooltip || (target && event.target.gplId && !target.isToolbar)) {//} && target.gplId !== self._hoveredTarget.gplId) {
        if(target && event.target.gplId && !target.isToolbar) {
            // x = target.left;
            // y = target.top - self.tooltip.height;
            x = pointer.x;
            y = pointer.y;
            // log('mouse over gplId', event.target.gplId, target);
            // log(gpl.point.Name, '-', target.tooltip || target.label);
            text = target?(target.tooltip || target.label):null;
            self._hoveredTarget = target;
            self.updateTooltip(text, x, y);
        } else {
            // if(event.target !== self.tooltip) {
                // log(target, event.target);
                self.clearTooltip();
            // }
        }
    };

    self.handleMouseOut = function(e) {
        // log('mouse out', e);
        if(self._hoveredTarget && e.target !== self.tooltip) {
            self._hoveredTarget = null;
            // self.clearTooltip();
        }
    };

    self.openContextMenu = function(left, top, event) {
        var obj = self.getObject({
                left: left,
                top: top,
                yoffset: 5,
                xoffset: 5
            }),
            getters = {
                line: gpl.lineManager.getLine,
                block: gpl.blockManager.getBlock
            },
            getter,
            gplObj;

        if(self.state !== 'DrawingLine') {
            self.$contextMenuList.removeClass('block line default');

            if(obj) {
                getter = getters[obj.gplType];
                if(getter) {
                    self.$contextMenuList.addClass(obj.gplType);
                } else {
                    self.$contextMenuList.addClass('block');
                    getter = getters.block;
                }
                gplObj = getter(obj.gplId);
            } else {
                self.$contextMenuList.addClass('default');
            }

            self.contextMenu.jqxMenu('open', left, top);
            self.contextX = left;
            self.contextY = top;
            self.contextObject = gplObj;
        }
    };

    self.destroy = function() {
        var c,
            len = (gpl.destroyFns || []).length;

        if(window.destroyed !== true) {
            window.destroyed = true;
            if(self.toolbar) {
                gpl.destroyObject(self.toolbar);
                delete self.toolbar;
            }

            gpl.forEach(gpl.eventHandlers, function(handlers) {
                handlers = [];
            });

            self.canvas.removeListeners();
            self.canvas.dispose();

            for(c=0; c<len; c++) {
                gpl.destroyFns[c]();
            }

            delete gpl.eventHandlers;
            delete gpl.blockManager;
            delete gpl.lineManager;
            delete window.gplData.upi;
            delete window.gplData.point;
            delete window.gplData.references;
            delete window.gplData.controllers;
            delete window.gplData;
            gpl.destroyObject(gpl);
            gpl = {};
            $(document).off();
            $(window).off();
            $(self.canvas.wrapperEl).remove();
            $('body').html('');
        }
    };

    self.handleNavigateAway = function(event) {

        if(gpl.hasEdits) {
            return 'You have unsaved changes. Are you sure you want to leave this page?';
        }

        self.destroy();
    };

    self.updateTooltip = function(text, x, y) {
        if(text) {
            self.tooltip.setText(text);
        }
        self.tooltip.set({
            visible: true,
            left: x + 15,
            top: y + 15
        });
        self.tooltipRect.set({
            visible: true,
            left: x + 10,
            top: y + 10,
            width: self.tooltip.width + 10
        });
        self.bringToFront(self.tooltipRect);
        self.bringToFront(self.tooltip);
        self.renderAll();
        // log('updating tooltip', text);
    };

    self.clearTooltip = function() {
        self.tooltip.set('visible', false);
        self.tooltipRect.set('visible', false);
        self.renderAll();
        // log('clearing tooltip');
    };

    self.showEditVersionModal = function() {
        gpl.$editVersionModal.modal({
            keyboard: false,
            backdrop: 'static'
        });
        gpl.$editVersionModal.modal('show');
    };

    self.hideEditVersionModal = function() {
        gpl.$editVersionModal.modal('hide');
    };

    self.initBindings = function() {
        var handlers = {
                deviceDescription: function(val){
                    gpl.point.Description.Value = val;//validate?
                }
            },
            syncDeviceProperties = function() {
                var props = ko.toJS(self.bindings),
                    devicePoint = gpl.devicePointRef;

                gpl.point.Description.Value = props.deviceDescription;
                devicePoint.pointName = props.deviceName;
                devicePoint.DevInst = devicePoint.PointInst = devicePoint.Value = props.deviceUpi;
            };

        self.addToBindings({
            isEdit: gpl.isEdit,
            loaded: self.sequenceLoaded,

            backgroundColor: ko.observable(self.backgroundColor),
            deviceBackgroundColor: ko.observable(self.backgroundColor),

            popInOut: self.popInOut,
            popInOutText: self.popInOutText,
            popInOutClass: self.popInOutClass,

            controllers: gpl.controllers,

            useEditVersion: function() {
                gpl.json.block = gpl.json.editVersion.block;
                gpl.json.line = gpl.json.editVersion.line;
                self.confirmEditVersion();
            },
            discardEditVersion: function() {
                self.confirmEditVersion();
            },

            showBackgroundColorModal: function() {
                gpl.$colorpickerModal.modal('show');
            },

            hideBackgroundColorModal: function() {
                self.bindings.deviceBackgroundColor(self.bindings.backgroundColor());
                gpl.$colorpickerModal.modal('hide');
            },

            updateBackgroundColor: function() {
                var val = self.bindings.backgroundColor();
                self.bindings.backgroundColor(val);
                self.canvas.backgroundColor = '#' + val;
                self.bindings.hideBackgroundColorModal();
                gpl.json.backgroundColor = val;
                self.renderAll();
            },

            applyShowLabel: function() {
                var bool = self.bindings.deviceShowLabel();
                self.pauseRender();
                gpl.blockManager.applyShowLabel(bool);
                self.resumeRender();
            },

            applyShowValue: function() {
                var bool = self.bindings.deviceShowValue();
                self.pauseRender();
                gpl.blockManager.applyShowValue(bool);
                self.resumeRender();
            },

            applyUpdateInterval: function() {
                var interval = self.bindings.deviceUpdateIntervalMinutes() * 60 + self.bindings.deviceUpdateIntervalSeconds();

                gpl.blockManager.applyUpdateInterval(interval);
            },

            applyController: function() {
                var controllerValue = self.bindings.deviceControllerValue(),
                    controllerName = gpl.controllers[controllerValue]['Controller Name'];

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

            updateSequenceProperties: function() {
                var props = ko.toJS(self.bindings);

                gpl.point['Update Interval'].Value = props.deviceUpdateIntervalMinutes * 60 + props.deviceUpdateIntervalSeconds;
                gpl.point['Show Label'].Value = props.deviceShowLabel;
                gpl.point['Show Value'].Value = props.deviceShowValue;
                gpl.point.Description.Value = props.deviceDescription;
                gpl.point.Controller.Value = props.deviceControllerName;
                gpl.point.Controller.eValue = props.deviceControllerValue;

                console.log('update', props);
                gpl.$sequencePropertiesModal.modal('hide');
            },
            showUpdateSequenceModal: function() {
                if(gpl.isEdit) {
                    gpl.$sequencePropertiesModal.modal('show');
                }
            },
            selectDevicePoint: function() {
                gpl.openPointSelector(function(upi, name) {
                    self.bindings.deviceName(name);
                    self.bindings.deviceUpi(upi);
                }, null, 'Device', 'Device Point');
            },

            addNewButton: function() {
                log('NewButton', self.contextX, self.contextY);
            },

            addNewDynamic: function() {
                log('NewDynamic');
            },

            addNewText: function() {
                var newBlock = gpl.blockManager.create({
                    cls: fabric.Textbox,
                    cfg: {
                        left: self.contextX,
                        top: self.contextY
                    }
                });
                log('NewText');
            }
        });

        self.bindings.backgroundColorHex = ko.computed(function() {
            var color = self.bindings.backgroundColor();

            return '#' + color;
        });

        self.$saveButton.click(function() {
            self.doSave();
        });

        self.$saveForLaterButton.click(function() {
            self.doSaveForLater();
        });

        self.$editButton.click(function() {
            self.doEdit();
        });

        self.$cancelButton.click(function() {
            self.doCancel();
        });

        self.$validateButton.click(function() {
            self.validate();
        });

        gpl.$messageModal.modal({
            show: false
        });

        ko.bindingHandlers.colorpicker = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor(),
                    hexColor = ko.unwrap(value),
                    getTextElementByColor = function(color) {
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

                value.subscribe(function(newVal) {
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

                el.on('colorchange', function(event) {
                    value(event.args.color.hex);
                    // parent.jqxDropDownButton('setContent', getTextElementByColor(event.args.color));
                });

            }
        };
    };

    self.initCanvas = function() {
        var editConfig = {
                renderOnAddRemove: false,
                selection: false,//group selection
                backgroundColor: '#' + self.backgroundColor,
                hasControls: false,
                hoverCursor: 'default'
            },
            viewConfig= {
                renderOnAddRemove: false,
                backgroundColor: '#' + self.backgroundColor,
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

        fabric.Group.prototype.doRemoveUpdates = function() {
            this.forEachObject(this._setObjectActive, this);
            this._calcBounds();
            this._updateObjectsCoords();
        };

        fabric.Group.prototype.addMultipleWithUpdate = function() {
            this.forEachObject(this.addWithUpdate, this);
        };

        // fabric.Canvas.prototype.findTarget = (function(origFn) {
        //     return function() {
        //         var target = origFn.apply(this, arguments);

        //         if (target) {
        //             if (this._hoveredTarget !== target) {
        //                 canvas.fire('object:over', {
        //                     target: target
        //                 });
        //                 if (this._hoveredTarget) {
        //                     canvas.fire('object:out', {
        //                         target: this._hoveredTarget
        //                     });
        //                 }
        //                 this._hoveredTarget = target;
        //             }
        //         } else if (this._hoveredTarget) {
        //             canvas.fire('object:out', {
        //                 target: this._hoveredTarget
        //             });
        //             this._hoveredTarget = null;
        //         }

        //         return target;
        //     };
        // }(fabric.Canvas.prototype.findTarget));

        self.$canvasEl.attr({
            width: window.innerWidth || 1024,
            height: window.innerHeight || 800
        });

        if(gpl.isEdit) {
            self.canvas = new fabric.Canvas(self.canvasElID, editConfig);
        } else {
            if(gpl.nobg) {
                delete viewConfig.backgroundColor;
            }
            self.canvas = new fabric.Canvas(self.canvasElID, viewConfig);
        }

        self._getObjectCount = 0;
        self._getObjectTime = 0;

        // if(gpl.isEdit) {
            // self.coordinateText = new fabric.Text('x,x', {
            //     top: 0,
            //     left: window.innerWidth - 200,
            //     textAlign: 'center',
            //     fontSize: 12,
            //     fontFamily: 'arial',
            //     gplType: 'label'
            // });

            // self.canvas.add(self.coordinateText);

            // self.registerHandler({
            //     event: 'mouse:move',
            //     handler: function(event) {
            //         var pointer = self.canvas.getPointer(event.e);
            //         self.coordinateText.text = pointer.x + ',' + pointer.y;
            //         self.renderAll();
            //     }
            // });
        // }

        self.showCoordinateText = function() {
            self.coordinateText = new fabric.Text('x,x', {
                top: 0,
                left: window.innerWidth - 200,
                textAlign: 'center',
                fontSize: 12,
                fontFamily: 'arial',
                gplType: 'label'
            });

            self.canvas.add(self.coordinateText);

            self.registerHandler({
                event: 'mouse:move',
                handler: function(event) {
                    var pointer = self.canvas.getPointer(event.e);
                    self.coordinateText.text = pointer.x + ',' + pointer.y;
                    self.renderAll();
                }
            });
        };

        self.canvas.sendToBackGPL = function(obj) {
            fabric.util.removeFromArray(this._objects, obj);
            this._objects.unshift(obj);
        };

        self.canvas.bringToFrontGPL = function (obj) {
            fabric.util.removeFromArray(this._objects, obj);
            this._objects.push(obj);
        };

        self.sendToBack = function(obj) {
            self.canvas.sendToBackGPL(obj);
        };

        self.bringToFront = function(obj) {
            self.canvas.bringToFrontGPL(obj);
        };

        self.tooltip = new fabric.IText('', {
            // backgroundColor: self.tooltipFill,
            fill: self.tooltipFontColor,
            fontSize: 12,
            fontFamily: 'arial',
            fontWeight: 'normal',
            // width: 30,
            lineHeight: 1,
            // padding: 150,
            selectable: false,
            evented: false,
            visible: false
        });

        self.tooltipRect = new fabric.Rect({
            fill: self.tooltipFill,
            height: 22,
            width: 25,
            selectable: false,
            evented: false,
            visible: false
        });

        self.canvas.add(self.tooltip);
    };

    self.initToolbar = function() {
        // var $dragEls = $('.toolbar-item');

        // $dragEls.draggable({
        //     revert: 'invalid',
        //     helper: 'clone',
        //     opacity: 0.9,
        //     cursor: 'move'
        // });

        // self.$canvasEl.droppable({
        //     drop: function() {
        //         console.log('drop', arguments);
        //     }
        // });

        // self.canvas.calcOffset();
        if(gpl.isEdit) {
            self.toolbar = new gpl.Toolbar(self);
        }
    };

    self.initManagers = function() {
        gpl.blockManager = new gpl.BlockManager(self);
        gpl.lineManager = new gpl.LineManager(self);
    };

    self.initQualityCodes = function() {
        var codes = gpl._qualityCodes.Entries,
            c,
            code;

        gpl.qualityCodes = {};

        for(c=0; c<codes.length; c++) {
            code = codes[c];

            gpl.qualityCodes[code['Quality Code Label']] = {
                color: code['Quality Code Font HTML Color'],
                text: code['Quality Code']
            };
        }
    };

    self.initShapes = function() {
        var sequence = gpl.json,
            lines = sequence.line || [],
            blocks = sequence.block || [],
            dynamics = (sequence.dynamics && sequence.dynamics.dynamic) || [],
            found = false,
            // ctx = self.canvas.getContext(),
            block,
            blocktype,
            blockCfg,
            handles,
            handle,
            coords,
            dynamic,
            config,
            newLine,
            newBlock,
            c,
            cc;

        initLabels();

        if(gpl.isEdit) {
            offsetPositions();
        }

        for(c=0; c<blocks.length; c++) {
            block = blocks[c];
            blockCfg = self.blockTypes[block.blockType || block.type];

            if(blockCfg) {
                blocktype = blockCfg.blockType;

                if(blocktype && gpl.blocks[blocktype]) {
                    found = true;
                    config = $.extend(true, {}, block);
                    config.iconType = block.blockType;
                    config._idx = c;

                    if(!gpl.isEdit) {
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

            if(!found) {
                log('******* ERROR: block type', block.blockType, 'not found *******');
            }

            found = false;
        }

        for(c=0; c<lines.length; c++) {
            coords = [];
            handles = lines[c].handle;

            for(cc=0; cc<handles.length; cc++) {
                handle = handles[cc];
                coords.push({
                    x: handle.x,
                    y: handle.y
                });
            }

            newLine = new gpl.ConnectionLine(coords, self.canvas);
            self.shapes.push(newLine);
        }

        for(c=0; c<dynamics.length; c++) {
            dynamic = dynamics[c];
        }

        // gpl.forEach(gpl.texts, function(text, id) {
        //     text.render(ctx);
        // });

        self.renderAll();
    };

    self.initKnockout = function() {
        ko.applyBindings(self.bindings);
    };

    self.initSocket = function() {
        if(!gpl.noSocket) {
            var socket = io.connect('http://' + window.location.hostname + ':8085');


            self.socket = socket;

            self.pauseRender();

            socket.on('connect', function() {
                var sess = {};
                sess.socketid = socket.socket.sessionid;
                sess.display = {};
                sess.display['Screen Objects'] = gpl.blockManager.screenObjects;

                if(!gpl.isEdit) {
                    socket.emit('displayOpen', {
                        data: sess
                    });
                }
            });

            self.keepAliveInterval = setInterval(function() {
                $.ajax({
                    url: '/home'
                }).done(function(data) {
                    return;//gpl.log('heartbeat');
                });
            }, 1000 * 60 * 15);

            socket.on('recieveUpdate', function (dynamic) {
                var upi = dynamic.upi,
                    dyn = dynamic.dynamic;

                gpl.blockManager.processValue(upi, dyn);
            });

            socket.on('sequenceUpdateMessage', function(message) {
                gpl.showMessage('Sequence Saved');
                offsetPositions(false);
            });

            socket.on('sequencePointsUpdated', function(data) {
                gpl.blockManager.resetChanges();
                // gpl.showMessage(JSON.stringify(data, null, 3));
            });

            self.registerHandler({
                event: 'unload',
                handler: function() {
                    socket.disconnect();
                },
                type: 'DOM',
                window: true
            });

            self.keepAliveInterval = (function() {
                var ret,
                    fn = function() {
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

    self.initEvents = function() {
        window.onbeforeunload = self.handleNavigateAway;
        self.registerHandlers([{
            event: 'mousedown',
            type: 'DOM',
            handler: function(event) {
                var scrollTop = $(window).scrollTop(),
                    scrollLeft = $(window).scrollLeft(),
                    left = parseInt(event.clientX, 10) + 5 + scrollLeft,
                    top = parseInt(event.clientY, 10) + 5 + scrollTop;

                if(event.which === 3) {
                    self.openContextMenu(left, top, event);
                    return false;
                }
            }
        }, {
            event: 'mouse:move',
            handler: function(event) {
                var pointer = self.canvas.getPointer(event.e),
                    x = pointer.x,
                    y = pointer.y,
                    obj = gpl.manager.getObject({
                        left: x,
                        top: y,
                        gplType: 'block'
                    });

                if(obj) {
                    self.updateTooltip(obj._pointData.Name, x, y);
                } else {
                    self.clearTooltip();
                }
            }
        }, {
            event: 'object:moving',
            handler:  function(e) {
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

                // log('moving object', e, gpl.manager.state);

                if(e.target instanceof fabric.Group) {
                    objects = e.target._objects;
                    for(c=0; c<objects.length; c++) {
                        object = objects[c];
                        if(object.gplType) {//} === 'block') {
                            if(!gplObjects[object.gplId]) {
                                blockObject = gpl.blockManager.blocks[object.gplId];
                                if(blockObject) {
                                    gplObjects[object.gplId] = {
                                        gplObject: blockObject,
                                        object: object
                                    };
                                }
                            }
                        }
                    }
                }

                self.movedObjects = gplObjects;

                for(object in gplObjects) {
                    if(gplObjects.hasOwnProperty(object)) {
                        // gplObjects[object].gplObject.syncObjects(gplObjects[object].object);
                        gplObjects[object].gplObject.setOffset(offset);
                    }
                }
            }
        }, {
        //     event: 'object:selected',
        //     handler: function(event) {
        //         log('selected', event);
        //     }
        // }, {
            event: 'selection:cleared',
            handler: function(event) {
                var object,
                    gplObjects = self.movedObjects;

                if(gplObjects) {
                    for(object in gplObjects) {
                        if(gplObjects.hasOwnProperty(object)) {
                            gplObjects[object].gplObject.resetOffset();
                        }
                    }
                }

                self.gplObjects = null;
            }
        }, {
            event: 'selection:created',
            handler: function(event) {
                // var group = event.target,//remove non-blocks, but add blocks you only have anchor selection of
                //     // newGroup,
                //     idsToAdd = [],
                    // blocks = [],
                // var start = new Date();
                    // id,
                    // obj,
                    // c;

                self.canvas.deactivateAll();

                // group.forEachObject(function(obj) {
                //     // if(obj.gplId && idsToAdd.indexOf(obj.gplId) === -1) {
                //     //     idsToAdd.push(obj.gplId);
                //     // }
                //     if(obj.gplType !== 'block') {
                //         // log('removing', obj.gplId, obj.gplType);
                //         group.removeWithUpdate(obj);
                //     }
                //     // else {
                //         if(obj.gplId && idsToAdd.indexOf(obj.gplId) === -1 && obj.gplType && obj.gplType !== 'line') {
                //             // log('adding', obj.gplId);
                //             idsToAdd.push(obj.gplId);
                //         }
                //     // }
                // });

                // // self.canvas.deactivateAll();

                // log('created in', new Date() - start);

                // for(c=0; c<idsToAdd.length; c++) {
                //     id = idsToAdd[c];
                //     obj = gpl.blockManager.blocks[id];
                //     if(obj) {
                //         obj = obj._shapes[0];
                //         // log('added', obj.gplType, obj.left, obj.top);
                //         // group.addWithUpdate(obj);
                //         // log('after', obj.left, obj.top);
                //         // blocks.push(obj);
                //     }
                // }

                // // group.addMultipleWithUpdate(blocks);

                // // newGroup = new fabric.Group(blocks);

                // // self.canvas.add(newGroup);
                // self.renderAll();
                // // group._originalLeft = group.left;
                // // group._originalTop = group.top;

                // log('created in', new Date() - start);
            }
        }, {
            event: 'mouse:up',
            handler:  function(event) {
                self.mouseDown = true;

                var pointer = self.canvas.getPointer(event.e),
                    x = pointer.x,
                    y = pointer.y,
                    obj = gpl.manager.getObject({
                        left: x,
                        top: y,
                        gplType: 'anchor'
                    });

                if(gpl.isEdit && gpl.manager.state === null && !self.isEditingLine && obj && event.e.which === 1) {
                    x = obj.left + obj.width/2;
                    y = obj.top + obj.height/2;
                    self.shapes.push(new gpl.SchematicLine(x, y, obj, self, obj.isVertical));
                }
            }
        }, {
            event: 'mouse:up',
            handler: function(event) {
                var pointer = self.canvas.getPointer(event.e),
                    x = pointer.x,
                    y = pointer.y,
                    obj;

                gpl._rightClickTargets = gpl._rightClickTargets || [];

                if(event.e.which === 3) {
                    obj = gpl.manager.getObject({
                        left: x,
                        top: y//,
                        // multiple: true,
                        // gplType: 'block'
                    });

                    if(obj) {
                        obj = gpl.blockManager.getBlock(obj.gplId);
                        // gpl.blockManager.openBlockEditor(obj);
                        if(obj) {
                            log(obj);
                        }
                        // log('adding object');
                        // gpl._rightClickTargets.push(obj);

                        // if(gpl._rightClickTargets.length === 2) {
                        //     gpl.validate.connection(gpl._rightClickTargets[0], gpl._rightClickTargets[1]);
                        //     gpl._rightClickTargets = [];
                        // }
                    }
                }
            }
        }, {
        //     event: 'unload',
        //     handler: function(event) {
        //         // if(gpl.isEdit) {
        //         //     self.canvas.removeListeners();
        //         // }
        //         // $(document).off();
        //         // $(window).off();
        //         // self.canvas.dispose();
        //         // // self.canvas.clear();
        //         // $(self.canvas.wrapperEl).remove();
        //         // gpl = {};
        //         // $('body').html('');
        //         return 'blah';
        //     },
        //     type: 'DOM',
        //     window: true
        // }, {
            event: 'resize',
            type: 'DOM',
            window: true,
            handler: self.resizeCanvas
        }, {
            event: 'keydown',
            handler: function(event) {
                var objects,
                    object,
                    gplObject,
                    gplId,
                    c,
                    evt;

                if(gpl.isEdit) {
                    if(event.which === gpl.DELETEKEY) {
                        objects = self.canvas.getActiveGroup();
                        object = self.canvas.getActiveObject();

                        if(objects) {
                            objects = objects._objects;
                            for(c=0; c<objects.length; c++) {
                                object = objects[c];
                                gplId = object.gplId;
                                self.canvas.remove(object);
                                gplObject = gpl.lineManager.lines[gplId] || gpl.blockManager.blocks[gplId];
                                if(gplObject) {
                                    if(gplObject instanceof gpl.ConnectionLine) {
                                        gpl.fire('removeline', gplObject);
                                    } else {
                                        gpl.fire('deleteblock', gplObject);
                                    }
                                }
                            }
                            gplObject = null;
                        }

                        if(object) {
                            if(object.gplType === 'block') {
                                gplObject = gpl.blockManager.blocks[object.gplId];
                                // self.canvas.remove(object);
                                evt = 'deleteblock';
                            } else if(object instanceof fabric.Line) {
                                gplObject = gpl.lineManager.lines[object.gplId];
                                evt = 'removeline';
                            } else if(object instanceof gpl.blocks.TextBlock) {
                                gplObject = gpl.texts[object.gplId];
                                evt = 'deleteblock';
                            } else {
                                log('invalid block');
                            }
                        }

                        self.canvas.discardActiveObject();
                        self.canvas.discardActiveGroup();
                        // self.renderAll();

                        if(gplObject) {
                            gpl.fire(evt, gplObject);
                        }
                        self.renderAll();
                    }
                }
            },
            type: 'DOM'
        }]);

        gpl.on('newblock', function(block) {
            self.addToBoundingRect(block);
        });
    };

    init();
};

//initialization -------------------------------------
$(function() {
    if(!gpl.skipInit) {
        gpl.initGpl();
    }
});
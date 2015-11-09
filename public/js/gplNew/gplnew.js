var gpl = {
        texts: {},
        blocks: {},
        shapes: {},
        labelCounters: {},
        eventLog: [],
        svgs: [],
        json: {},
        scaleValue: 1,
        defaultLoopDelay: 10,
        resizeDelay: 150,
        itemIdx: 0,
        gridSize: 1,//setOffset needs fixing to properly accomodate grid size > 1
        boundingRectTime: 0,
        boundingRectCount: 0,
        rendered: false,
        STACK_FRAME_RE: new RegExp(/at ((\S+)\s)?\(?([^:]+):(\d+):(\d+)/),
        idxPrefix: '_gplId_',
        toolbarFill: '#313131',
        iconPath: '/img/icons/',
        pointApiPath: '/api/points/',
        eventHandlers: {},
        configuredEvents: {},
        convertProperties: ['blockType', 'left', 'name', 'top', 'upi', 'label', 'connectionCount', 'precision', 'zIndex', 'labelVisible', 'presentValueVisible', 'connection', 'presentValueFont'],
        $messageModal: $('#gplMessage'),
        $messageModalBody: $('#gplMessageBody'),
        $editInputOutputModal: $('#editInputOutput'),
        point: window.gplData.point,
        references: window.gplData.references,
        upi: window.gplData.upi,
        codeToKeyMap: {
            8: 'Backspace',
            9: 'Tab',
            13: 'Enter',
            16: 'Shift',
            17: 'Ctrl',
            18: 'Alt',
            19: 'Pause/Break',
            20: 'Caps Lock',
            27: 'Esc',
            32: 'Space',
            33: 'Page Up',
            34: 'Page Down',
            35: 'End',
            36: 'Home',
            37: 'Left',
            38: 'Up',
            39: 'Right',
            40: 'Down',
            45: 'Insert',
            46: 'Delete',
            48: '0',
            49: '1',
            50: '2',
            51: '3',
            52: '4',
            53: '5',
            54: '6',
            55: '7',
            56: '8',
            57: '9',
            65: 'A',
            66: 'B',
            67: 'C',
            68: 'D',
            69: 'E',
            70: 'F',
            71: 'G',
            72: 'H',
            73: 'I',
            74: 'J',
            75: 'K',
            76: 'L',
            77: 'M',
            78: 'N',
            79: 'O',
            80: 'P',
            81: 'Q',
            82: 'R',
            83: 'S',
            84: 'T',
            85: 'U',
            86: 'V',
            87: 'W',
            88: 'X',
            89: 'Y',
            90: 'Z',
            91: 'Windows',
            93: 'Right Click',
            96: 'Numpad 0',
            97: 'Numpad 1',
            98: 'Numpad 2',
            99: 'Numpad 3',
            100: 'Numpad 4',
            101: 'Numpad 5',
            102: 'Numpad 6',
            103: 'Numpad 7',
            104: 'Numpad 8',
            105: 'Numpad 9',
            106: 'Numpad *',
            107: 'Numpad +',
            109: 'Numpad -',
            110: 'Numpad .',
            111: 'Numpad /',
            112: 'F1',
            113: 'F2',
            114: 'F3',
            115: 'F4',
            116: 'F5',
            117: 'F6',
            118: 'F7',
            119: 'F8',
            120: 'F9',
            121: 'F10',
            122: 'F11',
            123: 'F12',
            144: 'Num Lock',
            145: 'Scroll Lock',
            182: 'My Computer',
            183: 'My Calculator',
            186: ';',
            187: '=',
            188: ',',
            189: '-',
            190: '.',
            191: '/',
            192: '`',
            219: '[',
            220: '\\',
            221: ']',
            222: '\''
        },
        keyToCodeMap: {
            'Backspace': 8,
            'Tab': 9,
            'Enter': 13,
            'Shift': 16,
            'Ctrl': 17,
            'Alt': 18,
            'Pause/Break': 19,
            'Caps Lock': 20,
            'Esc': 27,
            'Space': 32,
            'Page Up': 33,
            'Page Down': 34,
            'End': 35,
            'Home': 36,
            'Left': 37,
            'Up': 38,
            'Right': 39,
            'Down': 40,
            'Insert': 45,
            'Delete': 46,
            '0': 48,
            '1': 49,
            '2': 50,
            '3': 51,
            '4': 52,
            '5': 53,
            '6': 54,
            '7': 55,
            '8': 56,
            '9': 57,
            'A': 65,
            'B': 66,
            'C': 67,
            'D': 68,
            'E': 69,
            'F': 70,
            'G': 71,
            'H': 72,
            'I': 73,
            'J': 74,
            'K': 75,
            'L': 76,
            'M': 77,
            'N': 78,
            'O': 79,
            'P': 80,
            'Q': 81,
            'R': 82,
            'S': 83,
            'T': 84,
            'U': 85,
            'V': 86,
            'W': 87,
            'X': 88,
            'Y': 89,
            'Z': 90,
            'Windows': 91,
            'Right Click': 93,
            'Numpad 0': 96,
            'Numpad 1': 97,
            'Numpad 2': 98,
            'Numpad 3': 99,
            'Numpad 4': 100,
            'Numpad 5': 101,
            'Numpad 6': 102,
            'Numpad 7': 103,
            'Numpad 8': 104,
            'Numpad 9': 105,
            'Numpad *': 106,
            'Numpad +': 107,
            'Numpad -': 109,
            'Numpad .': 110,
            'Numpad /': 111,
            'F1': 112,
            'F2': 113,
            'F3': 114,
            'F4': 115,
            'F5': 116,
            'F6': 117,
            'F7': 118,
            'F8': 119,
            'F9': 120,
            'F10': 121,
            'F11': 122,
            'F12': 123,
            'Num Lock': 144,
            'Scroll Lock': 145,
            'My Computer': 182,
            'My Calculator': 183,
            ';': 186,
            '=': 187,
            ',': 188,
            '-': 189,
            '.': 190,
            '/': 191,
            '`': 192,
            '[': 219,
            '\\': 220,
            ']': 221,
            '\'': 222
        },
        emptyFn: function() {
            return;
        },
        workspaceManager: window.opener && window.opener.workspaceManager,
        _openWindow: window.opener && window.opener.workspaceManager && window.opener.workspaceManager.openWindowPositioned,
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
        getPointTypes: window.opener && window.opener.workspaceManager && window.opener.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes,
        defaultBlockMessage: '<h4>Please Wait...</h4>',
        blockUI: function(message) {
            gpl.log('blocking ui');
            $.blockUI({message: message || gpl.defaultBlockMessage});
        },
        unblockUI: function() {
            gpl.log('unblocking ui');
            $.unblockUI();
        },
        openPointSelector: function(callback, newUrl) {
            var url = newUrl || '/pointLookup',
                windowRef,
                pointSelectedCallback = function(pid, name) {
                    if (!!pid) {
                        callback(pid, name);
                    }
                },
                windowOpenedCallback = function() {
                    windowRef.pointLookup.MODE = 'select';
                    windowRef.pointLookup.init(pointSelectedCallback);
                };

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
                            pointType: data['Point Type'].Value
                        };
                        gpl.pointData[upi] = data;
                        callback(map, data);
                    }
                }
            });
        },
        getExternalReferences: function(upi) {
            var cb = function(data) {
                    if(data) {
                        gpl.log(data.SequenceData.sequence);
                    } else {
                        gpl.log('error getting external gpl data');
                    }
                };

            $.ajax({
                url: '/gpl/getReferences/' + upi
            }).done(cb);
        },
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
                // functionName,
                err = new Error(),
                now = new Date(),
                args = [].splice.call(arguments, 0),
                pad = function(num) {
                    return ('    ' + num).slice(-4);
                },
                formattedTime = gpl.formatDate(now, true);

            Error.captureStackTrace(err);

            stack = err.stack.split('\n')[2];

            steps = stack.split(':');

            lineNumber = steps[2];

            args.unshift('line:' + pad(lineNumber), formattedTime);
            console.log.apply(console, args);
        },
        convertColor: function(color) {
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
            connection: function(anchor1, anchor2) {
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
                            gpl.log('invalid', pointType, allowedPoints);
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
                            gpl.log('error with', property2, pointType2, '--', allowedPoints2.error);
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
    anchorRadius: 2.5,


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
            hoverCursor: 'crosshair',
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

    getLines: function() {
        var ret = [];

        gpl.forEach(this.attachedLines, function(line) {
            ret.push(line);
        });

        return ret;
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
                // line.detach(self);
                lineToDetach.delete();
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
    minLabelWidth: 20,
    valueAnchor: 'output',
    valuePlaceholder: '###',
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

    gpltype: 'Block',

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
        if(!this.isNonPoint) {
            var otherAnchor = line.getOtherAnchor(anchor),
                otherBlock = gpl.blockManager.getBlock(otherAnchor.gplId),
                idx = this._pointRefs[anchor.anchorType];
                // oldUpi = this._pointData['Point Refs'][idx].Value;

            this._pointData['Point Refs'][idx].Value = otherBlock.upi;
            // gpl.log('anchorAttach', this.gplId, this.type, anchor.anchorType, otherBlock.upi, 'was', oldUpi);
            // gpl.log('anchorAttach', this.gplId, anchor.anchorType, otherBlock.gplId);
        }
    },

    handleAnchorDetach: function(anchor, line) {
        return;
        // gpl.log('anchorDetach', anchor.anchorType);
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
                        // if(newData && data) {
                            tmpData = formatPoint({point: newData, oldPoint: data, property: anchor.anchorType, refPoint: gpl.pointData[upi]});
                            if(tmpData.err) {
                                gpl.log(self.gplId, self.type, anchor.anchorType, 'error:', tmpData.err);
                            }
                            self._origPointData = newData;
                            self._pointData = tmpData;
                            data = newData;
                            newData = data;
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

                            setDataVars();

                            //self.setPointData(newPoint);
                        }//shouldn't need an else, lines are removed on block delete
                    }
                } else {
                    //detached
                    self.setPointRef(anchor.anchorType, 0);
                    // gpl.log('blanking out', anchor.anchorType);
                    setDataVars();
                }
            };

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

        gpl.log('resetting offsets');

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

        this.renderAll();
    },

    setShowValue: function(show) {
        this.presentValueVisible = show;

        this.valueText.visible = show;

        this.renderAll();
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

    setPointData: function(point, processChanges) {
        var newPoint = point.newPoint || point,
            oldPoint = point.oldPoint || point;

        if(!this._origPointData) {
            this._origPointData = $.extend(true, {}, oldPoint);
        }

        this._pointData = $.extend(true, {}, newPoint);

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

        this._pointRefs = obj;
    },

    setPointRef: function(prop, upi) {
        var data = this._pointData,
            refs,
            idx;

        if(data) {
            refs = this._pointData['Point Refs'];
            idx = this._pointRefs[prop];
            refs[idx].Value = upi;
        } else {
            gpl.log('no point data', this.type, this.gplId);
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
                                gpl.log('initting icon');
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

    getPointInfo: function() {
        var self = this,
            data;

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

        this.anchorDefaults = {
            fill: 'black',
            stroke: 'blue',
            radius: this.anchorRadius,
            hasRotatingPoint: false,
            borderColor: 'black',
            transparentCorners: false,
            selectable: false,
            isAnchor: true,
            hoverCursor: 'crosshair'
        };
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
            config.opacity = 0;
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

        this.valueText = new fabric.Text(this.valuePlaceholder, config);
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

    setIcon: function() {
        var self = this;

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
        if(this.value) {
            this.valueText.setText(gpl.formatValue(this, this.value.toString()));
        }

        this.callSuper('postInit');
    },

    setValue: function(val) {
        this.valueText.setText(gpl.formatValue(this, val));
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

    leftAnchors: [{
        anchorType: 'Input Point 1',
        required: true,
        takesConstant: true,
        constantProp: 'Input 1 Constant Value'
    }, {
        anchorType: 'Input Point 2',
        required: true,
        takesConstant: true,
        constantProp: 'Input 2 Constant Value'
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

    icon: 'MUX_0.png',
    iconScaleY: 1.5,
    iconScaleX: 1,
    iconOffsetLeft: 0,
    iconOffsetTop: 0,

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
    }
});

gpl.blocks.DigLogic = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,

    type: 'DigLogic',
    pointType: 'Digital Logic',

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
        canvas = manager.canvas,
        segments = [],
        coords = [{
            x: ox,
            y: oy
        }],
        // typeMatrix = {
        //     input: 'output',
        //     output: 'input'
        // },
        // startType = otarget.anchorType,
        // endType = typeMatrix[startType],
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
        gpl.log('creating new line', newCoords);
        manager.shapes.push(new gpl.ConnectionLine($.extend(true, [], newCoords), canvas));
        self.clearSegments();
        gpl.manager.renderAll();
    };

    self.clearSegments = function() {
        while(segments.length > 0) {
            self.removeSegment(true);
        }
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
            x = pointer.x,
            y = pointer.y,
            moveTarget = gpl.manager.getObject({
                left: x,
                top: y,
                gplType: 'anchor'
            });

        if(manager.isEditingLine) {
            if(moveTarget) {
                if(!moveTarget._oFill) {
                    moveTarget._oFill = moveTarget.fill;
                    moveTarget._oStroke = moveTarget.stroke;
                }
                moveTarget.set('fill', 'green');
                moveTarget.set('stroke', 'green');
                target = moveTarget;
            } else {
                if(target && target._oFill) {
                    target.set('fill', target._oFill);
                    target.set('stroke', target._oStroke);
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
            if(clickTarget) {// && clickTarget.anchorType === endType) {
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
    //     event: 'keypress',
    //     type: 'DOM',
    //     handler: self.handleKeyPress
    // }, {
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
        manager.isEditingLine = false;
        enableNonAnchors();
        manager.clearState();
        manager.unregisterHandlers(eventHandlerList);
    };

    self.attachEvents = function() {
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

    self.deleteLine = function(conf) {
        var line;

        if(typeof conf === 'string') {
            line = self.lines[conf];
        } else {
            line = conf;
        }

        if(line) {
            gpl.log('manager deleting line', line.gplId);

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

    self.prepSaveData = function() {
        var ret = [];

        gpl.forEach(self.lines, function(obj) {
            ret.push(self.convertLine(obj));
        });

        gpl.json.line = ret;
    };

    gpl.on('addedLine', function(line) {
        self.lines[line.gplId] = line;
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

    gpl.on('save', function() {
        self.prepSaveData();
    });
};

gpl.ConnectionLine = function(coords, canvas) {
    var self = this,
        calculatedSegments = [],
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
            selectable: true,
            hasControls: false,
            // strokeLineCap: 'round',
            // strokeLineJoin: 'round',
            // hasBorders: false,
            // strokeDashArray: [5, 5],
            // selectable: false,
            gplType: 'line'
        },
        proxyDefaults = {
            stroke: validColor,
            strokeWidth: proxyWidth,
            gplType: 'line',
            opacity: 0,
            selectable: true,
            hasControls: false
        },
        forEachLine = function(fn, delay, cb) {
            var cc;

            if(!delay) {
                for(cc=0; cc<self.lines.length; cc++) {
                    fn(self.lines[cc]);
                }
            } else {
                gpl.timedEach({
                    iteratorFn: fn,
                    list: self.lines,
                    delay: delay,
                    callback: cb
                });
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
                // self.circles.push(circle);
            }
            gpl.fire('addedLine', self);
        },
        addSegments = function() {
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
                y;

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

    fixCoords();

    self.lines = [];
    self.circles = [];
    self.state = 'valid';
    self.gplId = gpl.makeId();
    lineDefaults.gplId = self.gplId;

    self.startAnchor = gpl.manager.getObject({
        gplType: 'anchor',
        left: self.coords[0].x,
        top: self.coords[0].y
    });

    self.endAnchor = gpl.manager.getObject({
        gplType: 'anchor',
        left: self.coords[self.coords.length-1].x,
        top: self.coords[self.coords.length-1].y
    });

    // gpl.log('startAnchor:', startAnchor);
    // gpl.log('endAnchor:', endAnchor);

    self.detach = function(anchor) {
        if(self.startAnchor === anchor) {
            self.startAnchor = null;
        } else if(self.endAnchor === anchor) {
            self.endAnchor = null;
        }
    };

    self.getOtherAnchor = function(anchor) {
        var ret;

        if(self.startAnchor === anchor) {
            ret = self.endAnchor;
        } else if(self.endAnchor === anchor) {
            ret = self.startAnchor;
        }

        return ret;
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

    self.delete = function() {
        if(self.state !== 'deleting' && self.state !== 'deleted') {
            self.state = 'deleting';
            gpl.log('deleting line', self.gplId);

            if(self.startAnchor) {
                self.startAnchor.detach(self);
                self.startAnchor = null;
            }

            if(self.endAnchor) {
                self.endAnchor.detach(self);
                self.endAnchor = null;
            }

            forEachLine(function(line) {
                line.off();
                canvas.remove(line);
            });//, 1000, function() {

            gpl.lineManager.remove(self.gplId);

            gpl.manager.renderAll();
            self.state = 'deleted';

        }
    };

    addSegments();

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
        handleDrop = function() {
            var newShape = activeProxy.gplShape;

            newShape.isToolbar = false;
            newShape.bypassSave = false;

            if(newShape.calcOffsets) {
                newShape.calcOffsets();
            }

            activeProxy.gplShape = activeProxy.nextShape;
            activeProxy.gplId = activeProxy.gplShape.gplId;
            activeProxy.set({
                left: activeProxy._origLeft,
                top: activeProxy._origTop
            });
            activeProxy.setCoords();
            newShape.setCoords();

            manager.bringToFront(activeProxy);
            manager.clearState();

            this.off('mouseup', handleDrop);

            canvas.discardActiveObject();

            gpl.manager.addNewPoint(newShape);
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
        _blocks: [],
        newBlocks: {},
        deletedBlocks: {},
        editedBlocks: {},
        screenObjects: [],
        doubleClickDelay: 200,
        lastSelectedBlock: null,
        highlightFill: '#ffffff',
        bindings: {
            blockTitle: ko.observable(),
            editPointReferenceType: ko.observable('External'),
            editPointType: ko.observable(),
            editPointName: ko.observable(),
            editPointCharacters: ko.observable(),
            editPointDecimals: ko.observable(),
            editPointValue: ko.observable(),
            editPointLabel: ko.observable(),
            editPointShowValue: ko.observable(),
            editPointShowLabel: ko.observable(),
            blockReferences: ko.observableArray([]),
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

                self.doOpenPointSelector(url);
            },
            updatePoint: function() {
                var label = self.bindings.editPointLabel(),
                    showValue = self.bindings.editPointShowValue(),
                    showLabel = self.bindings.editPointShowLabel();

                self.editBlock.precision = parseFloat(self.bindings.editPointCharacters() + '.' + self.bindings.editPointDecimals());

                if(label !== self.editBlock.label) {
                    self.editBlock.setLabel(label);
                }

                if(self.editBlock.hasReferenceType) {//is monitor/control block
                    self.editBlock.getReferencePoint(true);
                    self.editBlock.setReferenceType(self.bindings.editPointReferenceType());
                    self.editBlock.upi = self.editBlockUpi;
                } else {//constant
                    self.editBlock.setValue(self.bindings.editPointValue());
                }

                self.editBlock.setShowLabel(showLabel);
                self.editBlock.setShowValue(showValue);

                gpl.$editInputOutputModal.modal('hide');

                gpl.fire('editedblock', self.editBlock);
            }
        },
        lastSelectedTime: new Date().getTime(),

        manager: manager,
        canvas: manager.canvas,

        getSaveObject: function() {
            var saveObj = {
                    adds: [],
                    updates: [],
                    deletes: []
                };

            gpl.forEach(self.newBlocks, function(block) {
                saveObj.adds.push(block.getPointData());
            });

            gpl.forEach(self.editedBlocks, function(block) {
                saveObj.updates.push({
                    oldPoint: block._origPointData,
                    newPoint: block.getPointData()
                });
            });

            gpl.forEach(self.deletedBlocks, function(block) {
                //if not control/monitor block
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

        doOpenPointSelector: function(url) {
            gpl.openPointSelector(function(upi, name) {
                self.bindings.editPointName(name);
                self.editBlockUpi = upi;
                //self.editBlock.getReferencePoint(upi);
                gpl.log(upi, name);
            }, url);
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

            if(editableTypes[block.type]) {
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
            }
        },

        convertBlock: function(block) {
            var ret = {},
                prop,
                shape = block._shapes[0],
                c;

            for(c=0; c<gpl.convertProperties.length; c++) {
                prop = gpl.convertProperties[c];
                if(block[prop]) {
                    ret[prop] = block[prop];
                }
            }

            ret.left = shape.left;
            ret.top = shape.top;

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

        prepSaveData: function() {
            var ret = [];

            gpl.forEach(self.blocks, function(obj) {
                if(!obj.bypassSave) {
                    obj.syncAnchorPoints();
                    ret.push(self.convertBlock(obj));
                }
            });

            gpl.json.block = ret;
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
                        upi: ref._id,
                        pointType: ref['Point Type'].Value
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

        init: function() {
            // if(gpl.isEdit === true) {
                manager.addToBindings(self.bindings);
            // }

            self.prepReferences();
        }
    };

    self.validateAll = function() {
        var valid = true,
            checkValid = function(block) {
                if(!block.isToolbar) {
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
        if(self.highlightedObject) {
            self.deselect();
        }

        self.highlightedObject = shape;
        if(!shape._origFill) {
            shape._origFill = shape.fill;
        }
        shape.set('fill', self.highlightFill);
    };

    self.deselect = function() {
        var obj = self.highlightedObject;
        if(obj) {
            obj.set('fill', obj._origFill);
        }

        self.highlightedObject = null;
    };

    gpl.on('newblock', function(newBlock) {
        self.newBlocks[newBlock.gplId] = newBlock;
    });

    gpl.on('editedblock', function(block) {
        self.editedBlocks[block.gplId] = block;
    });

    gpl.on('deleteblock', function(oldBlock) {
        self.deletedBlocks[oldBlock.gplId] = oldBlock;
        delete self.blocks[oldBlock.gplId];
        oldBlock.delete();
        self.renderAll();
        gpl.log('deleteblock handler');
    });

    gpl.on('save', function() {
        self.prepSaveData();
    });

    self.create = function(config) {
        var Cls = config.cls,
            cfg = config.cfg,
            obj;

        delete cfg.type;

        obj = new Cls(cfg);
        self._blocks.push(obj);

        return obj;
    };

    self.registerBlock = function(block, valueText) {
        var items = block._shapes || [],
            item,
            c,
            handleBlockMove = function(event) {
                var target = self.canvas.getActiveObject(),
                    gplId = target.gplId,
                    movingBlock = self.blocks[gplId];

                if(movingBlock && movingBlock.syncObjects) {
                    // gpl.log('moving block', movingBlock);
                    movingBlock.syncObjects(target);
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
            self.bindings.blockReferences.push({
                label: block.label,
                value: block.gplId
            });

            self.bindings.blockReferences.sort(function(left, right) {
                return left.label < right.label ? -1 : 1;
            });
        }

        self.renderAll();
    };

    self.processValue = function(upi, dyn) {
        var upis = self.upis[upi],
            text = dyn.Value,
            block,
            valueText,
            c,
            row,
            qualityCode = dyn['Quality Label'];

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
        }

        self.renderAll();
    };

    self.openPointEditor = function(block) {
        var upi,
            pointData = block.getPointData(),
            windowRef,
            endPoint;

        if(block) {
            self.deselect();
            upi = block.upi;
            endPoint = gpl.workspaceManager.config.Utility.pointTypes.getUIEndpoint(block.pointType, upi);

            windowRef = gpl.openWindow(endPoint, 'Edit Point', block.pointType, '', upi, {
                width: 820,
                height: 540
            });

            windowRef.attach = {
                point: pointData?JSON.stringify(pointData):null,
                saveCallback: function(point) {
                    block.setPointData(JSON.parse(point), true);
                    gpl.fire('editedblock', block);
                    gpl.log('edited callback', JSON.parse(point));
                }
            };
        }
    };

    self.handleMouseUp = function() {
        self.deselect();
    };

    self.handleDoubleClick = function(event) {
        var target = event.target,
            gplId,
            targetBlock,
            now = new Date().getTime();

        if(target) {
            gplId = target.gplId;
            targetBlock = self.blocks[gplId];

            if(now - self.lastSelectedTime < self.doubleClickDelay && targetBlock) {//doubleclick
                // gpl.log('processing double click');
                if(!targetBlock.isNonPoint) {
                    self.openPointEditor(targetBlock);
                } else if(!targetBlock.useNativeEdit) {
                    self.openBlockEditor(targetBlock);
                }
            } else {
                // gpl.log('too much time');
                self.lastSelectedTime = now;
                self.lastSelectedBlock = targetBlock;
            }
        }

        self.deselect();
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
    }]);

    self.init();

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

        offsetLinePositions = function(reset) {
            var list = gpl.json.line,
                len = list.length,
                handles,
                cc,
                ccc;

            for(cc=0; cc<len; cc++) {
                handles = list[cc].handle;
                for(ccc=0; ccc<handles.length; ccc++) {
                    handles[ccc].x += (!reset?self.editModeOffset:(-1 * self.editModeOffset));
                }

            }
        },
        offsetBlockPositions = function(reset) {
            var list = gpl.json.block,
                len = list.length,
                cc;

            for(cc=0; cc<len; cc++) {
                list[cc].left += (!reset?self.editModeOffset:(-1 * self.editModeOffset));
            }
        },
        offsetPositions = function(reset) {
            offsetLinePositions(!!reset);
            offsetBlockPositions(!!reset);
        },
        init = function() {
            // var lastInit,
            var doNextInit = function() {
                    var initFn = initFlow[currInitStep];
                        // now = new Date();

                    // if(currInitStep > 0) {
                    //     log(initFlow[currInitStep - 1], 'finished in', ((now - lastInit)/1000).toFixed(3));
                    // }

                    if(initFn !== undefined) {
                        currInitStep++;
                        setTimeout(function() {
                            // lastInit = new Date();
                            self[initFn]();
                            doNextInit();
                        }, initDelay);
                    } else {
                        self.postInit();
                        self.resumeRender();
                        gpl.skipEventLog = false;
                        gpl.rendered = true;
                        self.getBoundingBox();
                        log('Finished initializing GPL Manager in', ((new Date().getTime() - started)/1000).toFixed(3), 'seconds');
                        gpl.fire('rendered');
                    }
                },
                prop,
                c;

            if(!gpl.point.SequenceData) {
                gpl.showMessage('Sequence data not found');
            } else {
                gpl.json = gpl.point.SequenceData.sequence;

                gpl.deviceId = gpl.point['Point Refs'][0].DevInst;

                self.state = null;
                self.editMode = false;
                self.queueRenders = true;
                self.haltRender = true;
                self.lastRender = new Date().getTime();
                self.gplObjects = {};
                self.eventHandlers = {};
                self.shapes = [];
                self.canvasElID = 'gplCanvas';
                self.$canvasEl = $('#' + self.canvasElID);
                self.$saveButton = $('#save');
                self.$editButton = $('#edit');
                self.$validateButton = $('#validate');
                self.tooltipFill = '#3d3d3d';
                self.tooltipFontColor = '#f4f4f4';
                self.editModeOffset = 125;
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

                if(gpl.isEdit) {
                    offsetPositions();
                }

                document.title = gpl.point.Name;

                initPointNamePrefix();

                // self.keepAliveInterval = setInterval(function() {
                //     gpl.log('reconnecting');
                //     $.ajax({
                //         url: '/home'
                //     }).done(function(data) {
                //         gpl.log('reconnected');
                //     });
                // }, 1000 * 60 * 15);

                doNextInit();
            }
        };

    log('Initializing GPL Manager');

    gpl.skipEventLog = true;

    self.postInit = gpl.emptyFn;

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

        // gpl.log('bounding box', gpl.boundingBox);

        // visual aid
        // self.canvas.add(new fabric.Line([left, top, left, bottom], lineDefaults));
        // self.canvas.add(new fabric.Line([left, bottom, right, bottom], lineDefaults));
        // self.canvas.add(new fabric.Line([right, bottom, right, top], lineDefaults));
        // self.canvas.add(new fabric.Line([right, top, left, top], lineDefaults));
    };

    self.scale = function(value) {
        var scaleIt = function(prop) {
                return parseFloat(prop, 10) * value;
            },
            canvas = self.canvas;
            // currentCanvasHeight = canvas.getHeight(),
            // currentCanvasWidth = canvas.getWidth();
            // scaledCanvasHeight = scaleIt(currentCanvasHeight),
            // scaledCanvasWidth = scaleIt(currentCanvasWidth);


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
                        gpl.log('New Point canceled, deleting block');
                        block.delete();
                    }
                    return;
                }

                block.upi = obj._id;
                block.setPointData(obj, true);
                gpl.log(block.gplId, 'save callback', obj);
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
            isValid = self.validate();

        if(isValid) {
            gpl.log(saveObj);

            self.pauseRender();

            gpl.fire('save');

            self.socket.emit('updateSequencePoints', saveObj);

            offsetPositions(true);

            self.socket.emit('updateSequence', {
                sequenceName: gpl.point.Name,
                sequenceData: {
                    sequence: gpl.json
                }
            });

            offsetPositions(false);

            self.resumeRender();

            gpl.log('save complete');
        }
    };

    self.doEdit = function() {
        var url = window.location.href,
            newUrl = url.replace('view', 'edit');

        gpl.openWindow(newUrl, gpl.point.Name, 'Sequence', '', gpl.upi);
    };

    self.validate = function() {
        var valid = gpl.blockManager.validateAll();

        gpl.showMessage(gpl.invalidMessage || (valid?'':'In') + 'valid');
        gpl.invalidMessage = null;
        return valid;
        // gpl.showMessage((valid?'':'In') + 'valid');
    };

    self.getObject = function(config)  {
        var start = new Date().getTime(),
            gap,
            gplType = config.gplType,
            left = config.left,
            top = config.top,
            multiple = config.multiple || false,
            objects = self.canvas.getObjects(),
            c,
            len = objects.length,
            obj,
            ret = [],
            found = false;

        for(c=0; c<len && !found; c++) {
            obj = objects[c];
            if(gplType === obj.gplType && left >= obj.left && left <= (obj.left + obj.width) && top >= obj.top && top <= (obj.top + obj.height)) {
                if(!multiple) {
                    found = true;
                }
                ret.push(obj);
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
                // gpl.log('resized canvas to ', width, 'x', height, gpl.formatDate(self.lastWindowResize), gpl.formatDate(self.lastCanvasResize));
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
            // gpl.log('skipping queue');
            setTimeout(function() {
                checkQueue();
            }, resizeDelay);
        }
    };

    self.renderAll = function() {
        var now = new Date().getTime();

        self.lastRender = now;

        if(!self.haltRender) {
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
            // gpl.log('mouse over gplId', event.target.gplId, target);
            // gpl.log(gpl.point.Name, '-', target.tooltip || target.label);
            text = target?(target.tooltip || target.label):null;
            self._hoveredTarget = target;
            self.updateTooltip(text, x, y);
        } else {
            // if(event.target !== self.tooltip) {
                // gpl.log(target, event.target);
                self.clearTooltip();
            // }
        }
    };

    self.handleMouseOut = function(e) {
        // gpl.log('mouse out', e);
        if(self._hoveredTarget && e.target !== self.tooltip) {
            self._hoveredTarget = null;
            // self.clearTooltip();
        }
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
        self.bringToFront(self.tooltip);
        self.renderAll();
        // gpl.log('updating tooltip', text);
    };

    self.clearTooltip = function() {
        self.tooltip.set('visible', false);
        self.renderAll();
        // gpl.log('clearing tooltip');
    };

    self.initBindings = function() {
        self.bindings = {
            sequenceName: gpl.point.Name,
            isEdit: gpl.isEdit
        };

        self.$saveButton.click(function() {
            self.doSave();
        });

        self.$editButton.click(function() {
            self.doEdit();
        });

        self.$validateButton.click(function() {
            self.validate();
        });

        gpl.$messageModal.modal({
            show: false
        });

        self.addToBindings = function(props) {
            self.bindings = $.extend(self.bindings, props);
        };
    };

    self.initCanvas = function() {
        var editConfig = {
                renderOnAddRemove: false,
                selection: false,//group selection
                // backgroundColor: '#C8BEAA',
                hasControls: false
            },
            viewConfig= {
                renderOnAddRemove: false,
                backgroundColor: '#C8BEAA',
                hasControls: false,
                selection: false
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
            width: 3000,//document.body.offsetWidth,// window.innerWidth || 1024,
            height: 3000//document.body.offsetHeight//window.innerHeight || 800
        });

        if(gpl.isEdit) {
            self.canvas = new fabric.Canvas(self.canvasElID, editConfig);
        } else {
            if(gpl.nobg) {
                delete viewConfig.backgroundColor;
            }
            self.canvas = new fabric.StaticCanvas(self.canvasElID, viewConfig);
        }

        self._getObjectCount = 0;
        self._getObjectTime = 0;

        // if(gpl.isEdit) {
        //     self.coordinateText = new fabric.Text('x,x', {
        //         top: 0,
        //         left: window.innerWidth - 200,
        //         textAlign: 'center',
        //         fontSize: 12,
        //         fontFamily: 'arial',
        //         gplType: 'label'
        //     });

        //     self.canvas.add(self.coordinateText);

        //     self.registerHandler({
        //         event: 'mouse:move',
        //         handler: function(event) {
        //             var pointer = self.canvas.getPointer(event.e);
        //             self.coordinateText.text = pointer.x + ',' + pointer.y;
        //             self.renderAll();
        //         }
        //     });
        // }

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

        self.tooltip = new fabric.Text('', {
            backgroundColor: self.tooltipFill,
            stroke: self.tooltipFontColor,
            fontSize: 12,
            fontFamily: 'arial',
            // width: 30,
            // height: 30,
            padding: 150,
            selectable: false,
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
            lines = sequence.line,
            blocks = sequence.block,
            found = false,
            // ctx = self.canvas.getContext(),
            block,
            blocktype,
            blockCfg,
            handles,
            handle,
            coords,
            config,
            newLine,
            newBlock,
            c,
            cc;

        initLabels();

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
                sess.socketid = socket.id;
                sess.display = {};
                sess.display['Screen Objects'] = gpl.blockManager.screenObjects;

                if(!gpl.isEdit) {
                    socket.emit('displayOpen', {
                        data: sess
                    });
                }
            });

            socket.on('recieveUpdate', function (dynamic) {
                var upi = dynamic.upi,
                    dyn = dynamic.dynamic;

                gpl.blockManager.processValue(upi, dyn);
            });

            socket.on('sequenceUpdateMessage', function(message) {
                gpl.showMessage(message);
            });

            socket.on('sequencePointsUpdated', function(data) {
                gpl.blockManager.resetChanges();
                gpl.showMessage(JSON.stringify(data, null, 3));
            });

            self.registerHandler({
                event: 'unload',
                handler: function() {
                    socket.disconnect();
                },
                type: 'DOM',
                window: true
            });
        }
    };

    self.initEvents = function() {
        self.registerHandlers([{
        //     event: 'mouse:over',
        //     handler: self.handleMouseOver
        // }, {
        //     event: 'mouse:out',
        //     handler: self.handleMouseOut
        // }, {
            event: 'mouse:move',
            handler: function(event) {
                var pointer = self.canvas.getPointer(event.e);

                if(self._hoveredTarget) {
                    self.updateTooltip(null, pointer.x, pointer.y);
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
        //         gpl.log('selected', event);
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
                //         // gpl.log('removing', obj.gplId, obj.gplType);
                //         group.removeWithUpdate(obj);
                //     }
                //     // else {
                //         if(obj.gplId && idsToAdd.indexOf(obj.gplId) === -1 && obj.gplType && obj.gplType !== 'line') {
                //             // gpl.log('adding', obj.gplId);
                //             idsToAdd.push(obj.gplId);
                //         }
                //     // }
                // });

                // // self.canvas.deactivateAll();

                // gpl.log('created in', new Date() - start);

                // for(c=0; c<idsToAdd.length; c++) {
                //     id = idsToAdd[c];
                //     obj = gpl.blockManager.blocks[id];
                //     if(obj) {
                //         obj = obj._shapes[0];
                //         // gpl.log('added', obj.gplType, obj.left, obj.top);
                //         // group.addWithUpdate(obj);
                //         // gpl.log('after', obj.left, obj.top);
                //         // blocks.push(obj);
                //     }
                // }

                // // group.addMultipleWithUpdate(blocks);

                // // newGroup = new fabric.Group(blocks);

                // // self.canvas.add(newGroup);
                // self.renderAll();
                // // group._originalLeft = group.left;
                // // group._originalTop = group.top;

                // gpl.log('created in', new Date() - start);
            }
        }, {
            event: 'mouse:down',
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

                if(gpl.manager.state === null && !self.isEditingLine && obj) {
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
                        gpl.log(obj);
                        // gpl.log('adding object');
                        // gpl._rightClickTargets.push(obj);

                        // if(gpl._rightClickTargets.length === 2) {
                        //     gpl.validate.connection(gpl._rightClickTargets[0], gpl._rightClickTargets[1]);
                        //     gpl._rightClickTargets = [];
                        // }
                    }
                }
            }
        }, {
            event: 'beforeunload',
            handler: function(event) {
                if(gpl.isEdit) {
                    self.canvas.removeListeners();
                }
                $(document).off();
                $(window).off();
                self.canvas.clear();
                self.canvas.dispose();
                $(self.canvas.wrapperEl).remove();
            },
            type: 'DOM',
            window: true
        }, {
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

                if(gpl.codeToKeyMap[event.which] === 'Delete') {
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
                            gpl.log('invalid block');
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
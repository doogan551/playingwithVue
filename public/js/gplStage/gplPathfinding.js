(function(global) {

    'use strict';

    if (fabric.MonitorBlock) {
        console.warn('fabric.MonitorBlock is already defined');
        return;
    }

    var stateProperties = fabric.Object.prototype.stateProperties.concat(),
        extend = fabric.util.object.extend;

    stateProperties.push('x', 'y');

    fabric.MonitorBlock = fabric.util.createClass(fabric.Object, /** @lends fabric.Triangle.prototype */ {

        /**
         * Type of an object
         * @type String
         * @default
         */
        type: 'monitorblock',

        x: 0,

        y: 0,

        /**
         * Constructor
         * @param {Object} [options] Options object
         * @return {Object} thisArg
         */
        initialize: function(options) {
            var defaults = {
                fill: '6a6af1'
            };

            this.options = $.extend(defaults, options);

            this.callSuper('initialize', this.options);

            this.set('width', this.options.width || 20)
                .set('height', this.options.height || 20);

            this.x = this.options.x || 0;
            this.y = this.options.y || 0;
            this.stroke = this.options.stroke || 'black';
        },

        /**
         * @private
         * @param ctx {CanvasRenderingContext2D} Context to render on
         */
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

        /**
         * @private
         * @param ctx {CanvasRenderingContext2D} Context to render on
         */
        _renderDashedStroke: function(ctx) {
            var widthBy2 = this.width / 2,
                heightBy2 = this.height / 2,
                dl = fabric.util.drawDashedLine;

            ctx.beginPath();
            dl(ctx, 0, 0, widthBy2, 0, this.strokeDashArray);
            dl(ctx, widthBy2, 0, this.width, heightBy2, this.strokeDashArray);
            dl(ctx, this.width, heightBy2, widthBy2, this.height, this.strokeDashArray);
            dl(ctx, widthBy2, this.height, 0, this.height, this.strokeDashArray);
            dl(ctx, 0, this.height, 0, 0, this.strokeDashArray);
            ctx.closePath();
        },

        /**
         * Returns object representation of an instance
         * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
         * @return {Object} object representation of an instance
         */
        toObject: function(propertiesToInclude) {
          var object = extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
          });
          return object;
        },

        /* _TO_SVG_START_ */
        /**
         * Returns SVG representation of an instance
         * @param {Function} [reviver] Method for further parsing of svg representation.
         * @return {String} svg representation of an instance
         */
        toSVG: function(reviver) {
            var markup = this._createBaseSVGMarkup(),
                widthBy2 = this.width / 2,
                heightBy2 = this.height / 2,
                points = [-widthBy2 + ' ' + heightBy2,
                    '0 ' + -heightBy2,
                    widthBy2 + ' ' + heightBy2
                ]
                    .join(',');

            markup.push(
                '<polygon ',
                'points="', points,
                '" style="', this.getSvgStyles(),
                '" transform="', this.getSvgTransform(),
                '"/>'
            );

            return reviver ? reviver(markup.join('')) : markup.join('');
        },
        /* _TO_SVG_END_ */

        /**
         * Returns complexity of an instance
         * @return {Number} complexity of this instance
         */
        complexity: function() {
            return 1;
        }
    });

    fabric.MonitorBlock.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat(['x', 'y', 'width', 'height']);

    /**
     * Returns {@link fabric.Rect} instance from an object representation
     * @static
     * @memberOf fabric.Rect
     * @param object {Object} object to create an instance from
     * @return {Object} instance of fabric.Rect
     */
    fabric.MonitorBlock.fromObject = function(object) {
        return new fabric.MonitorBlock(object);
    };

}(this));

var ControlPoint = fabric.util.createClass(fabric.MonitorBlock, {
    type: 'controlpoint',

    initialize: function(options) {
        var defaults = {
                flipX: true,
                fill: '2bef30'
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

ControlPoint.fromObject = function(object) {
    return new ControlPoint(object);
};

var GPLManager = function() {
    var self = this,
        gridSize = 5,
        gutter = 2,
        itemIdx = 0,
        initFlow = ['initCanvas', 'initToolbar', 'initGrid', 'initShapes', 'drawPaths'],

        gridWidth,
        gridHeight,
        Rect,
        SchematicLine,
        GPLBlock,
        Toolbar,

        makeId = function() {
            itemIdx++;
            return '_gplId_' + itemIdx;
        },
        createObject = function(Type, config) {
            var object,
                oType,
                id = makeId(),
                objects = self.gplObjects;

            config = $.extend({gplId: id}, config);

            object = new Type(config);

            oType = object.type;

            objects[oType] = objects[oType] || {};

            objects[oType][id] = object;

            self.shapes.push(object);
            self.canvas.add(object);

            return object;
        },
        _log = function() {
            var t = new Date(),
                args = [].splice.call(arguments, 0),
                functions = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
                lengths = [2,2,2,3],
                separators = [':',':',':',' -- '],
                fn,
                out = '';// = t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds() + '.' + t.getMilliseconds() + ' -- ';

            for(fn in functions) {
                if(functions.hasOwnProperty(fn)) {
                    out += ('000' + t['get' + functions[fn]]()).slice(-1 * lengths[fn]) + separators[fn];
                }
            }

            args.unshift(out);
            console.log.apply(console, args);
        },
        init = function() {
            var c;

            self.gplObjects = {};

            for(c=0; c<initFlow.length; c++) {
                self[initFlow[c]]();
            }

            self.canvas.renderAll();
        };

    //group for each item - ex pentagon and circle
    Toolbar = function(config) {
        var type,
            types = [fabric.MonitorBlock, ControlPoint],
            padding = 25,
            width = 100,
            height = self.canvas.height,
            borderLine,
            currX = padding,
            currY = padding,
            shapes = {},
            shape,
            dragShape,
            id,
            drawBounds,
            boundLineOptions = {
                stroke: 'black',
                strokeWidth: '2',
                selectable: false
            },
            handleClick = function(item) {
                //when setting isclone, make anchor points visible 
                var clone = item.clone();
                item.isClone = true;
                id = makeId();
                clone.gplId = id;
                self.canvas.add(clone);  
                // self.canvas.renderAll();
                // self.canvas.deactivateAllWithDispatch();  
                // self.canvas.setActiveObject(clone);
                console.log('cloning', item.gplId, 'to', id);
                shapes[id] = clone;
            };

        drawBounds = function() {
            borderLine = new fabric.Line([width, 0, width, height], boundLineOptions);
            self.canvas.add(borderLine);
        };

        for(type in types) {
            if(types.hasOwnProperty(type)) {
                id = makeId();
                shape = new types[type]({
                    left: currX,
                    top: currY,
                    selectable: true,
                    hasControls: false,
                    gplId: id,
                    master: true
                });

                self.canvas.add(shape);
                shapes[id] = shape;

                id = makeId();
                dragShape = new types[type]({
                    left: currX,
                    top: currY,
                    selectable: true,
                    hasControls: false,
                    gplId: id
                });

                self.canvas.add(dragShape);
                shapes[id] = dragShape;                

                currY += shape.height + padding;
            }
        }

        self.canvas.on('object:selected', function(event) {
            console.log(event.target.gplId);
            if(shapes[event.target.gplId] && event.target.master !== true && event.target.isClone !== true) {
                handleClick(event.target);
            }
        });

        self.canvas.on('mouse:up', function(event) {
            if(event.target && shapes[event.target.gplId]) {
                self.canvas.discardActiveObject();
            }
        });

        drawBounds();
    };

    Rect = function(config) {
        var radius = 3,
            defaults = {
                fill: '5F9EA0',
                width: 50,
                height: 75,
                hasRotatingPoint: false,
                borderColor: 'black',
                cornerColor: 'black',
                cornerSize: 6,
                transparentCorners: false,
                selectable: false,
                stroke: 'black'
            },
            nodeDefaults = {
                fill: 'blue',
                radius: radius,
                hasRotatingPoint: false,
                borderColor: 'black',
                transparentCorners: false,
                selectable: false,
                isAnchor: true
            },
            newConfig = $.extend({}, defaults, config),
            width = newConfig.width,
            height = newConfig.height,
            left = newConfig.left,
            top = newConfig.top,
            x,
            y;

        createObject(fabric.Rect, newConfig);

        createObject(fabric.Circle, $.extend(nodeDefaults, {gplType: 'input', left: newConfig.left - radius, top: newConfig.top + 20}));

        createObject(fabric.Circle, $.extend(nodeDefaults, {gplType: 'output', left: newConfig.left + width - radius, top: newConfig.top + 20}));

        for(x=left - gutter; x<(left+width + gutter);x++) {
            for(y=top - gutter; y<(top + height + gutter);y++) {
                if(x >=0 && x <= gridWidth && y >= 0 && y <= gridHeight) {
                    self.collisionGrid.setWalkableAt(x, y, false);
                }
            }
        }
    };

    GPLBlock = function(ox, oy, opts) {
        //common props
        //defaults
        //draw anchors.  keep track of all of them
        //types get operations, math, etc.  subtypes?

        //group
        //   includes anchors

    };

    //ControlBlock
    //MonitorBlock
    //ConstantBlock

    //all of these wrap one or more shapes.  pentagon or octagon

    SchematicLine = function(ox, oy, otarget) {
        var segments = [],
            coords = [{
                x: ox,
                y: oy
            }],
            typeMatrix = {
                input: 'output',
                output: 'input'
            },
            startType = otarget.gplType,
            endType = typeMatrix[startType],
            spaceSegment,
            target,
            solidLine,
            dashedLine,
            horiz = true,
            prevX = ox,
            prevY = oy,
            lineDefaults = {
                stroke: 'black',
                selectable: false
            },
            dashedDefaults = {
                stroke: 'grey'
            };


        self.completeLine = function() {
            self.addSegment(solidLine, true);
            // segments.push(solidLine);
            // coords.push({
            //     x: solidLine.x2,
            //     y: solidLine.y2
            // });
            solidLine = new fabric.Line([dashedLine.x1, dashedLine.y1, dashedLine.x2, dashedLine.y2], $.extend({}, lineDefaults));
            self.addSegment(solidLine, true);
            // self.canvas.add(solidLine);
            // segments.push(solidLine);
            // coords.push({
            //     x: solidLine.x2,
            //     y: solidLine.y2
            // });
            self.canvas.remove(dashedLine);
            target.set('fill', target._oFill);
            self.detachEvents();
            self.canvas.renderAll();
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

            self.canvas.renderAll();
        };

        self.removeSegment = function() {
            var segment;

            if(segments.length > 0) {
                coords.pop();
                segment = segments.pop();  
                self.canvas.remove(segment);
            }

            horiz = !horiz;

            self.syncLines();

            return segment;
        };

        self.addSegment = function(segment, skipSync) {
            segments.push(segment);
            coords.push({
                x: segment.x2,
                y: segment.y2
            });
            self.canvas.add(segment);
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

            // if(horiz) {
            //     dashedLine.set({x1: x1, y1: py});
            //     solidLine.set({x2: px, y2: y1});
            // } else {
            //     dashedLine.set({x1: px, y1: y1});
            //     solidLine.set({x2: x1, y2: py});
            // }
            // self.canvas.renderAll();
        };

        self.handleMouseMove =  function(event) {
            var pointer = self.canvas.getPointer(event.e),
                x = pointer.x,
                y = pointer.y;

            if(event.target && event.target.gplType === endType) {
                target = event.target;
                if(!target._oFill) {
                    target._oFill = target.fill;
                }
                target.set('fill', 'green');
            } else {
                if(target && target._oFill) {
                    target.set('fill', target._oFill);
                }
            }

            if(horiz) {
                solidLine.set({x2: x});
                dashedLine.set({x1: x, y2: y, x2: x, y1: prevY});
            } else {
                solidLine.set({y2: y});
                dashedLine.set({x1: prevX, y2: y, x2: x, y1: y});
            }
            self.canvas.renderAll();
        };

        self.handleMouseUp = function(event) {
            self.mouseDown = false;
        };

        self.handleMouseDown = function(event) {
            var pointer = self.canvas.getPointer(event.e),
                px = pointer.x,
                py = pointer.y,
                x = solidLine.x2,
                y = solidLine.y2,
                clickTarget = event.target;

            if(clickTarget && clickTarget.gplType === endType) {
                self.completeLine();
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

                self.canvas.add(solidLine);
                self.canvas.renderAll();
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

        self.handleKeyPress = function(event) {
            // if(event.which === 13) {
            //     handleEnterKey();
            // }
            if(event.which === 32) {
                self.handleSpacebar(event);
            }

            // if(event.which === 46) {//46 delete, 8 backspace
            //     event.preventDefault();
            //     handleBackspace(event);
            //     return false;
            // }
        };

        self.detachEvents = function() {
            self.canvas.off('mouse:move', self.handleMouseMove);
            self.canvas.off('mouse:up', self.handleMouseUp);
            self.canvas.off('mouse:down', self.handleMouseDown);
            self.isEditingLine = false;
        };

        self.attachEvents = function() {
            $(document).on('keypress', self.handleKeyPress);
            self.canvas.on('mouse:move', self.handleMouseMove);
            self.canvas.on('mouse:up', self.handleMouseUp);
            self.canvas.on('mouse:down', self.handleMouseDown);
        };

        solidLine = new fabric.Line([ox, oy, ox, oy], $.extend({}, lineDefaults));
        dashedLine = new fabric.Line([ox, oy, ox, oy], $.extend({}, dashedDefaults));

        self.canvas.add(solidLine);
        self.canvas.add(dashedLine);
        self.canvas.renderAll();

        self.isEditingLine = true;

        self.attachEvents();
    };

    self.initCanvas = function() {
        self.canvas = new fabric.Canvas('gplCanvas', {
            renderOnAddRemove: false,
            selection: true,
            backgroundColor: 'C8BEAA',
            hoverCursor: 'pointer'
        });

        self.canvas.on('object:moving', function(options) {
            options.target.set({
                left: Math.round(options.target.left / gridSize) * gridSize,
                top: Math.round(options.target.top / gridSize) * gridSize
            });
        });

        self.canvas.on('mouse:down', function(event) {
            self.mouseDown = true;

            var pointer = self.canvas.getPointer(event.e),
                x = pointer.x,
                y = pointer.y;

            if(!self.isEditingLine && event.target && event.target.isAnchor === true) {
                self.shapes.push(new SchematicLine(x, y, event.target));
            }

            // var pointer = self.canvas.getPointer(event.e),
            //     points = [pointer.x, pointer.y, pointer.x, pointer.y];

            // if(self.collisionGrid.isWalkableAt(pointer.x, pointer.y)) {
            //     self.drawingLine = new fabric.Line(points, {
            //         strokeWidth: 1,
            //         stroke: 'black',
            //         originX: 'center',
            //         originY: 'center'
            //     });
            //     self.canvas.add(self.drawingLine);
            //     self.mouseDown = true;
            // }
        });

        self.canvas.on('mouse:move', function(event) {
            if(!self.mouseDown) {
                return;
            }
            
            // var pointer = self.canvas.getPointer(event.e);

            // self.drawingLine.set({x2: pointer.x, y2: pointer.y});
            // self.canvas.renderAll();
        });

        self.canvas.on('mouse:up', function(event) {
            self.mouseDown = false;
            // var line = self.drawingLine,
            //     valid;

            // if(line) {
            //     if(self.collisionGrid.isWalkableAt(line.x2, line.y2)) {
            //         self.drawPaths([[line.x1, line.y1, line.x2, line.y2]]);
            //     }

            //     self.canvas.remove(self.drawingLine);
            // }

            // self.mouseDown = false;
        });
    };

    self.initToolbar = function() {
        var toolbar = new Toolbar();
    };

    self.initGrid = function() {
        gridHeight = self.canvas.height;
        gridWidth = self.canvas.width;

        self.collisionGrid = new PF.Grid(gridWidth, gridHeight);
        self.finder = new PF.AStarFinder({
            weight: 2
        });
    };

    self.initShapes = function() {
        var c,
            shapes = [{
                left: 600,
                top: 200
            }, {
                left: 600,
                top: 300
            },{
                left: 300,
                top: 100
            }, {
                left: 600,
                top: 400
            }, {
                left: 300,
                top: 400
            }, {
                left: 600,
                top: 100
            }, {
                left: 800,
                top: 100
            }, {
                left: 450,
                top: 500
            }, {
                left: 300,
                top: 200
            }, {
                left: 300,
                top: 300
            }],
            shape;

        self.shapes = [];

        for(c=0; c<shapes.length; c++) {
            shape = new Rect(shapes[c]);
        }


        // self.line = new fabric.Line([300,300, 600,600], {
        //     left: 300,
        //     top: 300,
        //     stroke: 'black'
        // });

        // self.canvas.add(self.rect);
        // self.canvas.add(self.rect1);
        // self.canvas.add(self.line);
        // self.line.moveTo(0);

        // self.multiLine = new MultiLine(self.rect, self.rect1);
        // self.canvas.add(self.multiLine);
    };

    self.transformPath = function(path) {
        var currDir,
            dir,
            idx = 0,
            currPos,
            newPos,
            prevPos,
            coords = [],
            testPath = function() {
                var _dir;
                prevPos = newPos;
                idx++;
                newPos = path[idx];

                if(prevPos[0] !== newPos[0]) {
                    _dir = 'x';
                } else {
                    _dir = 'y';
                }

                return _dir;
            };
        _log('starting path transforming');

        currPos = path[idx];
        idx++;
        newPos = path[idx];
        
        coords.push(currPos);

        testPath();

        currDir = dir;
        while(idx < path.length - 1) {
            while(dir === currDir && idx < path.length - 1) {
                dir = testPath();
            }
            coords.push(path[idx-1]);
            currDir = dir;
        }

        _log('ending path transform');

        return coords;
    };

    self.showPath = function(path) {
        var c,
            start,
            end,
            newPath,
            shape;            

        newPath = self.transformPath(path);

        _log('showing newPath', newPath.length);

        for(c=0; c<newPath.length-1; c++) {
            start = newPath[c];
            end = newPath[c+1];

            // x = row[0];
            // y = row[1];
            shape = new fabric.Line([start[0], start[1], end[0], end[1]], {
                stroke: 'black',
                selectable: false
            });
            self.canvas.add(shape);
        }

        self.canvas.renderAll();

        _log('done showing path');
    };

    self.drawPaths = function(paths) {
        var c,
            path,
            start = new Date().getTime(),
            coords = paths || [],//[[360,325,625,660], [290,625,660,300]],
            runTest = function(coord) {
                var _path;
                _log('Starting pathfinding');
                coord.push(self.collisionGrid.clone());
                _path = self.finder.findPath.apply(self.finder, coord);
                _log('Finished pathfinding in:', new Date().getTime() - start);
                return _path;
            };

        for(c=0; c<coords.length; c++) {
            path = runTest(coords[c]);
            if(path.length > 1) {
                self.showPath(path);
            }
        }
    };

    init();

    $(document).keydown(function(e) {
        if(e.which === 46) {
            self.canvas.remove(self.canvas.getActiveObject());
        }
    });
};

var manager = new GPLManager();

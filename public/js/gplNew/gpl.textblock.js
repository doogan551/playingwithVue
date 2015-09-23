/**
 * Textbox class, based on IText, allows the user to resize the text rectangle
 * and wraps lines automatically. Textboxes have their Y scaling locked, the
 * user can only change width. Height is adjusted automatically based on the
 * wrapping of lines.
 *
 * @class fabric.Textbox
 * @extends fabric.IText
 * @mixes fabric.Observable
 *
 * @return {fabric.Textbox} thisArg
 * @see {@link fabric.Textbox#initialize} for constructor definition
 */
fabric.Textbox = fabric.util.createClass(fabric.IText, fabric.Observable, {
    defaultWeight: 'normal',
    defaultFill: '#000000',
    defaultFontSize: 12,
    toolbarHeight: 30,
    toolbarOffsetTop: 6,
    toolbarOffsetLeft: -8,
    toolbarWidth: 30,
    proxyOffsetLeft: 8,
    isNonPoint: true,
    useNativeEdit: true,
    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'TextBlock',

    /**
     * Minimum width of textbox, in pixels.
     * @type Number
     * @default
     */
    minWidth: 30,
    /**
     * Constructor. Some scaling related property values are forced. Visibility
     * of controls is also fixed; only the rotation and width controls are
     * made available.
     * @param {String} text Text string
     * @param {Object} [options] Options object
     * @return {fabric.Textbox} thisArg
     */
    initialize: function(config) {
        // gpl.log(config);
        this.convertConfig(config);
        this.callSuper('initialize', this.text, this.config);
        this.set('lockUniScaling', false);
        this.set('lockScalingY', true);
        this.set('hasBorders', config.hasBorders);
        this.setControlsVisibility({
            tl: false,
            tr: false,
            br: false,
            bl: false,
            ml: true,
            mt: false,
            mr: true,
            mb: false,
            mtr: true
        });
        this.gplId = gpl.makeId();
        gpl.texts[this.gplId] = this;
        gpl.blockManager.registerBlock(this);
    },

    convertConfig: function(config) {
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
            cfg.fontWeight = this.defaultWeight;
            cfg.fill = this.defaultFill;
            cfg.fontSize = this.defaultFontSize;
        }

        // cfg.lockUniScaling = true;
        cfg.originX = 'left';
        cfg.originY = 'top';

        if (cfg.Font && cfg.Font.Underline === 'true') {
            cfg.textDecoration = 'underline';
        }

        this.config.left += 10;
        this.config.top += 5;

        this.config.selectable = !!gpl.isEdit;

        this.config.width = parseInt(this.config.width, 10) || this.minWidth;
        this.config.height = null;//parseInt(this.config.height, 10);

        this.config.textAlign = alignments[cfg.alignment] || 'center';

        $.extend(this, this.config);

        this.text = this.config.label || 'ABC';
    },

    setActive: function() {
        this.inactive = false;
        this.setCoords();
    },

    delete: function() {
        gpl.manager.canvas.remove(this);
        delete gpl.texts[this.gplId];
    },
    /**
     * Wraps text using the 'width' property of Textbox. First this function
     * splits text on newlines, so we preserve newlines entered by the user.
     * Then it wraps each line using the width of the Textbox by calling
     * _wrapLine().
     * @param {CanvasRenderingContext2D} ctx Context to use for measurements
     * @param {String} text The string of text that is split into lines
     * @returns {Array} Array of lines
     */
    _wrapText: function(ctx, text) {
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
    _wrapLine: function(ctx, text) {
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
    _getTextLines: function(ctx) {
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
    _renderViaNative: function(ctx) {
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
    },
    /**
     * Returns 2d representation (lineIndex and charIndex) of cursor (or selection start).
     * Overrides the superclass function to take into account text wrapping.
     * @param {Number} selectionStart Optional index. When not given, current selectionStart is used.
     * @returns {Object} This object has 'lineIndex' and 'charIndex' properties set to Numbers.
     */
    get2DCursorLocation: function(selectionStart) {

        if (selectionStart === undefined) {
            selectionStart = this.selectionStart;
        }

        var lineIndex = 0,
            linesBeforeCursor = [],
            allLines = this._getTextLines(),
            temp,
            lastLine,
            charIndex;

        /*
         * We use this to populate linesBeforeCursor instead of simply splitting
         * textBeforeCursor with newlines to handle the case of the
         * selectionStart value being on a word that, because of its length,
         * needs to be wrapped to the next line.
         */
        temp = selectionStart;
        while (temp >= 0) {
            if (lineIndex > allLines.length - 1) {
                break;
            }
            temp -= allLines[lineIndex].length;
            if (temp < 0) {
                linesBeforeCursor[linesBeforeCursor.length] = allLines[lineIndex].slice(0, temp + allLines[lineIndex].length);
            } else {
                linesBeforeCursor[linesBeforeCursor.length] = allLines[lineIndex];
            }
            lineIndex++;
        }
        lineIndex--;

        lastLine = linesBeforeCursor[linesBeforeCursor.length - 1];
        charIndex = lastLine.length;

        if (linesBeforeCursor[lineIndex] === allLines[lineIndex]) {
            if (lineIndex + 1 < allLines.length - 1) {
                lineIndex++;
                charIndex = 0;
            }
        }

        return {
            lineIndex: lineIndex,
            charIndex: charIndex
        };
    },
    /**
     * Overrides superclass function and uses text wrapping data to get cursor
     * boundary offsets.
     * @param {Array} chars
     * @param {String} typeOfBoundaries
     * @param {Object} cursorLocation
     * @param {Array} textLines
     * @returns {Object} Object with 'top', 'left', and 'lineLeft' properties set.
     */
    _getCursorBoundariesOffsets: function(chars, typeOfBoundaries, cursorLocation, textLines) {
        var leftOffset = 0,
            lineChars,
            i,
            lineLeftOffset,
            topOffset = typeOfBoundaries === 'cursor'
            // selection starts at the very top of the line,
            // whereas cursor starts at the padding created by line height
            ? (this._getHeightOfLine(this.ctx, 0) -
                this.getCurrentCharFontSize(cursorLocation.lineIndex, cursorLocation.charIndex)) : 0;

        lineChars = textLines[cursorLocation.lineIndex].split('');

        for (i = 0; i < cursorLocation.charIndex; i++) {
            leftOffset += this._getWidthOfChar(this.ctx, lineChars[i], cursorLocation.lineIndex, i);
        }

        for (i = 0; i < cursorLocation.lineIndex; i++) {
            topOffset += this._getCachedLineHeight(i);
        }

        lineLeftOffset = this._getCachedLineOffset(cursorLocation.lineIndex, textLines);

        this._clearCache();

        return {
            top: topOffset,
            left: leftOffset,
            lineLeft: lineLeftOffset
        };
    },
    /**
     * Returns object representation of an instance
     * @method toObject
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
        return fabric.util.object.extend(this.callSuper('toObject', propertiesToInclude), {
            minWidth: this.minWidth
        });
    }
});
/**
 * Returns fabric.Textbox instance from an object representation
 * @static
 * @memberOf fabric.Textbox
 * @param {Object} object Object to create an instance from
 * @return {fabric.Textbox} instance of fabric.Textbox
 */
fabric.Textbox.fromObject = function(object) {
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
fabric.Canvas.prototype._setObjectScale = function(localMouse, transform, lockScalingX, lockScalingY, by, lockScalingFlip) {

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
    getDownCursorOffset: function(e, isRight) {
        return this.callSuper('getDownCursorOffset', e, isRight) - 1;
    },
    /**
     * Overrides superclass function and adjusts cursor offset value because
     * lines do not necessarily end with a newline in Textbox.
     * @param {Event} e
     * @param {Boolean} isRight
     * @returns {Number}
     */
    getUpCursorOffset: function(e, isRight) {
        return this.callSuper('getUpCursorOffset', e, isRight) - 1;
    }
});
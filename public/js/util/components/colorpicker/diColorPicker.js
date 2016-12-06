var listOfCustomColorCodes = [];

(function () {
    var getData = function (customColors) {
        listOfCustomColorCodes = customColors;
    };
    $.getJSON('/api/system/getCustomColors', getData);
}());

var CustomColorsPicker = function ($colorPickerDiv, callback, currentColor, callbackFieldname) {
    var self = this,
        $colorPickerNode,
        handlerClass = "colorPickerHandlerDiv",
        colorToHex = function (color) {
            var digits, red, blue, green, hexColor;
            if (color.substr(0, 1) === '#') {
                return color;
            }
            function componentToHex(c) {
                var hex = c.toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            }

            function rgbToHex(r, g, b) {
                return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
            }

            digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
            red = parseInt(digits[2]);
            green = parseInt(digits[3]);
            blue = parseInt(digits[4]);
            hexColor = rgbToHex(red, green, blue);
            return digits[1] + hexColor;
        },
        splitColorArray = function () {
            var i = 0, col1, col2,
                len = listOfCustomColorCodes.length,
                half = parseInt(len / 2, 10),
                columnOne = listOfCustomColorCodes.slice(0, half),
                columnTwo = listOfCustomColorCodes.slice(half),
                ret = []

            while ((i < columnOne.length) || (i < columnTwo.length)) {
                col1 = (columnOne[i]) ? columnOne[i] : [];
                col2 = (columnTwo[i]) ? columnTwo[i] : [];
                ret.push([col1, col2]);
                i++;
            }
            return ret;
        },
        verticalColorArray = function () {
            var i,
                splitArray = splitColorArray(),
                len = splitArray.length,
                ret = [];

            for (i = 0; i < len; i++) {
                ret.push((splitArray[i][0] ? splitArray[i][0] : ""));
                ret.push((splitArray[i][1] ? splitArray[i][1] : ""));
            }
            return ret;
        },
        initEventHandlers = function ($picker, dropDownElement) {
            $picker.off();  // clear all event handler from this div
            $picker.on('colorchange', function (event) {
                if (callback) {
                    if ($.isFunction(callback)) {
                        callback(event.args.color.hex);
                    } else if (callback instanceof Object) {
                        callback[callbackFieldname] = event.args.color.hex;
                    }
                }

                if (!!dropDownElement) {
                    dropDownElement.jqxDropDownButton('setContent', getTextElementByColor(event.args.color));
                }
            });

            if (!!dropDownElement) {
                $picker.on('keyup', function (event) {
                    var keycode = (event.keyCode ? event.keyCode : event.which);
                    if (keycode === 13) {
                        if (!!dropDownElement) {
                            dropDownElement.jqxDropDownButton('close');
                        }
                    }
                });
            }
        },
        configureSwatchDiv = function (theDiv, theColor) {
            theDiv.css("background-image", "");
            theDiv.css("opacity", "1");
            theDiv.css("background", "#" + theColor);
            theDiv.click(function (e) {
                var $controlDiv = $(this).parent().parent().parent(),
                    $jqueryColorPicker = $controlDiv.find(".jqx-color-picker"),
                    bgColor = $(this).css("background-color"),
                    hexBgColor = colorToHex(bgColor);
                $(this).parent().parent().find("div").removeClass("selected");
                $(this).addClass("selected");
                if ($jqueryColorPicker === undefined || $jqueryColorPicker.length === 0) {
                    $jqueryColorPicker = $controlDiv;
                }
                $jqueryColorPicker.jqxColorPicker('setColor', hexBgColor);
            });
        },
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
        buildAndSeedDropdown = function ($elementToDropdown, width, height) {
            if (!!$elementToDropdown) {
                $elementToDropdown.jqxDropDownButton({
                    width: 130,
                    height: 22
                });

                $elementToDropdown.jqxDropDownButton('setContent', getTextElementByColor(new $.jqx.color({
                    hex: currentColor
                })));

                // $elementToDropdown.css("width", width);
                // $elementToDropdown.css("height", height);
            }
        },
        drawCustomColorsPalette = function ($colorpicker, smallFormat, verticalPalette) {
            var i,
                $unorderedList,
                $listItem,
                customColorsClass = smallFormat ? 'sm-' : '',
                $customColorDiv,
                customColorClass = smallFormat ? 'sm-' : '',
                customColorDivID,
                colorArray = verticalPalette ? verticalColorArray() : listOfCustomColorCodes;

            // $colorpicker.append("<br>");
            customColorsClass += verticalPalette ? 'vertical-' : '';
            customColorsClass += 'customColors';
            customColorClass += 'colorSwatch';
            $unorderedList = $("<ul>", {class: customColorsClass});
            $colorpicker.append($unorderedList);
            for (i = 0; i < colorArray.length; i++) {
                customColorDivID = "customColor_" + i;
                $listItem = $("\n<li>\n");
                $unorderedList.append($listItem);
                $customColorDiv = $("<div>", {class: customColorClass, id: customColorDivID});
                $listItem.append($customColorDiv);
                $customColorDiv.attr('index', i);
                configureSwatchDiv($customColorDiv, colorArray[i]);
            }
        },
        drawColorPickerDiv = function () {
            var $parent = $colorPickerDiv.parent(),
                $dropDown,
                insertPalette,
                useSmallPalette,
                verticalPalette,
                useDropdown,
                pickerWidth,
                pickerHeight,
                $colorPickerInputs,
                getjqxPickerWidth = function () {
                    var answer = 0;
                    if (useSmallPalette) {
                        answer = (verticalPalette ? 180 : 160);
                    } else {
                        answer = (verticalPalette ? 290 : 255);
                    }
                    return answer;
                },
                getjqxPickerHeight = function () {
                    var answer = 0;
                    if (useSmallPalette) {
                        answer = (verticalPalette ? 162 : 160);
                    } else {
                        answer = (verticalPalette ? 170 : 215);
                    }
                    return answer;
                },
                getdiPickerWidth = function (baseWidth) {
                    var answer = 0;
                    if (useSmallPalette) {
                        answer = (verticalPalette ? baseWidth + 48 : baseWidth);
                    } else {
                        answer = (verticalPalette ? baseWidth + 40 : baseWidth);
                    }
                    return answer;
                },
                getdiPickerHeight = function (baseHeight) {
                    var answer = 0;
                    if (useSmallPalette) {
                        answer = (verticalPalette ? baseHeight : baseHeight + 20);
                    } else {
                        answer = (verticalPalette ? baseHeight - 20 : baseHeight + 5);
                    }
                    return answer;
                };

            $colorPickerDiv.empty();  // clear any previous colorpickers from div
            insertPalette = $colorPickerDiv.data('insertpalette') || false;
            useDropdown = $colorPickerDiv.data('usedropdown') || false;
            useSmallPalette = $colorPickerDiv.data('sm-palette') || false;
            verticalPalette = $colorPickerDiv.data('vertical') || false;
            pickerWidth = getjqxPickerWidth();
            pickerHeight = getjqxPickerHeight();
            $colorPickerNode = $("<div>", {class: handlerClass});
            $colorPickerDiv.append($colorPickerNode);

            $colorPickerNode.jqxColorPicker({
                colorMode: 'hue',
                color: currentColor,
                width: pickerWidth,
                height: pickerHeight
            });

            if (insertPalette && useDropdown) {
                $dropDown = $parent;
                drawCustomColorsPalette($dropDown, useSmallPalette, verticalPalette);
                buildAndSeedDropdown($dropDown, getdiPickerWidth(pickerWidth), getdiPickerHeight(pickerHeight));
            } else if (insertPalette && !useDropdown) {
                drawCustomColorsPalette($colorPickerNode, useSmallPalette, verticalPalette);
            } else if (useDropdown) {
                $dropDown = $parent;
                buildAndSeedDropdown($dropDown);
            }

            initEventHandlers($colorPickerNode, $dropDown);
            $colorPickerInputs = $colorPickerNode.find(".jqx-color-picker-panel").find("input");
            if (!!$colorPickerInputs && $colorPickerInputs.length === 4) {
                $colorPickerNode.css("width", getdiPickerWidth(pickerWidth));
                $colorPickerNode.css("height", getdiPickerHeight(pickerHeight));
                $colorPickerNode.css("display", "flex");
                $($colorPickerInputs[0]).css("width", "58"); // hex color field
                $($colorPickerInputs[1]).css("width", "31"); // red color field
                $($colorPickerInputs[2]).css("width", "31"); // green color field
                $($colorPickerInputs[3]).css("width", "31"); // blue color field
            }
        };

    self.render = function () {
        if (currentColor.match('#')) {
            currentColor = currentColor.substring(1);
        }

        if (listOfCustomColorCodes.length > 0) {
            drawColorPickerDiv();
        } else {
            setTimeout(function () {
                drawColorPickerDiv();
            }, 100);
        }
    };
    self.updateColor = function (color) {
        $colorPickerNode.jqxColorPicker('setColor', '#' + color);
    };
};


if (typeof ko !== 'undefined' && ko.bindingHandlers && !ko.bindingHandlers.diColorpicker) {
    ko.bindingHandlers.diColorpicker = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var functionColor = valueAccessor(),
                hexColor = ko.unwrap(functionColor),
                $colorPickerDiv = $(element),
                customColorsPicker;

            if (!!functionColor && !!hexColor) {
                customColorsPicker = new CustomColorsPicker($colorPickerDiv, functionColor, hexColor);
                customColorsPicker.render();

                functionColor.subscribe(function (newValue) {
                    customColorsPicker.updateColor(newValue);
                });
            }
        }
    };
}
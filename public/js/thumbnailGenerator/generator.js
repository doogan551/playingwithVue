var thumbnailGenerator = (function ($) {
    var _internal = {},
        _ui = {},
        _app = {},
        _memoryLeakBuster = 0,
        _waiting = null,
        _captureElement,
        _captureClient,
        _fetcher;

    //set dummy workspaceManager obj
    window.workspaceManager = (window.top && window.top.workspaceManager) || {
        openWindow: function() {},
        openWindowPositioned: function() {}
    };

    _internal.webEndpoint = window.location.origin;
    _internal.apiEndpoint = _internal.webEndpoint + '/thumbnail/';

    _internal.sequences = data.gpl;
    _internal.sequenceSelector = '#gplCanvas';

    _internal.displays = data.displays;
    _internal.displaySelector = '#display';

    _internal.timer = null;

    _internal.vm = {
        errorList          : ko.observableArray([]),
        errorDetailList    : ko.observableArray([]),
        captureList        : ko.observableArray(data),
        totalItemsToProcess: ko.observable(0),
        currentThumbName   : ko.observable(''),
        thumb              : ko.observable(''),
        currentCaptureData : ko.observable({}),
        updateAll          : ko.observable(true)
    };

    _internal.vm.updateAll.subscribe(function(newValue) {
        _internal.vm.totalItemsToProcess( _internal.getItemsToCapture().length);
    });

    _internal.getItemsToCapture = function() {
        if (_internal.vm.updateAll()) {
            return _internal.vm.captureList();
        }
        return ko.utils.arrayFilter(_internal.vm.captureList(), function(item) {
            return item.tn === false;
        });
    };

    _internal.vm.itemsToCapture = ko.computed(_internal.getItemsToCapture);

    _internal.vm.totalItemsProcessed = ko.computed(function () {
        return _internal.vm.totalItemsToProcess() - _internal.getItemsToCapture().length;
    });

    _internal.vm.percentComplete = ko.computed(function () {
        var percent = ((_internal.vm.totalItemsProcessed() / _internal.vm.totalItemsToProcess()) || 0) * 100;
        return percent.toFixed(3);
    });

    _internal.createFetcher = function() {
        _captureClient = window.open('/thumbnail/capture', 'fetcher', 'width=1200,height=6100,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=1,left=0,top=0');
    };

    _internal.removeFetcher = function() {
        _fetcher.onload = null;
        _fetcher.contentWindow.location = 'about:blank';
        _fetcher.contentWindow.location.reload();
        _captureClient.location = 'about:blank';
        _captureClient.location.reload();
        _memoryLeakBuster = 0;
        _captureClient.close();
        _captureClient = null;
        //let's wait to see if we can free up some memory
        _waiting = 1;
        setTimeout(function() {
            _waiting = null;
            _internal.nextCapture()
        }, 5000);
    };

    _internal.startCaptureProcess = function () {
        var tempCount = 0,
            tempList = [],
            i = 0;
        _internal.cancelProcess = false;
        _ui.$updateAll.prop('disabled', true);
        _ui.$btnStart.hide();
        _ui.$btnCancel.show();
        _ui.$activity.show();
        //if we are only creating thumbnails for items without thumbnails
        //remove all records with thumbnails
        tempList = _internal.getItemsToCapture();
        _internal.vm.captureList(tempList);
        _internal.nextCapture();
    };

    _internal.cancelCaptureProcess = function () {
        _internal.removeFetcher();
        _internal.cancelProcess = true;
        _ui.$btnStart.show();
        _ui.$btnCancel.hide();
    };

    _internal.nextCapture = function(name, error, errorInfo) {
        var _captureData;
        if (!!error) {
            _internal.vm.thumb('/js/thumbnailGenerator/thumbError.png');
            _internal.vm.currentThumbName(name);
            _internal.vm.errorList.push(name);
            _internal.vm.errorDetailList.push(errorInfo);
        }
        if (_internal.cancelProcess) return;
        if (_memoryLeakBuster > 20)  {
            _internal.removeFetcher();
            return;
        }
        if (!_captureClient || (_captureClient && _captureClient.closed)) {
            if (!_waiting) _internal.createFetcher();
            return;
        }

        _fetcher = _captureClient.document.getElementById('fetcher');
        _captureData = _internal.vm.captureList.shift();

        if (_captureData) {
            _internal.vm.currentCaptureData(_captureData);
            _internal.load[_captureData.type]();
            _memoryLeakBuster++;
        } else {
            $('#msg').html('Thumbnail Complete');
            _captureClient.close();
        }
    };

    _internal.load = {
        sequence: function () {
            var _captureData =  _internal.vm.currentCaptureData();
            _fetcher.onload = function () {
                console.log('loaded');
//                if (typeof _fetcher.contentWindow.jQuery == 'undefined') {
//                    _internal.nextCapture(_captureData.name, true);
//                    return;
//                }
                _fetcher.contentWindow.onerror = function(err, url, lineNum) {
                    _fetcher.contentWindow.onerror = null;
                    _fetcher.contentWindow.jQuery('body').unbind('sequenceLoaded');
                    console.log('aaaaaaaaaaaarrrrrrrrrrrrrrrrrrrrrrgggg');
                    setTimeout(function() {_internal.nextCapture(_captureData.name, true, {err:err, lineNum: lineNum})}, 100);
                    return false;
                };
                if(_fetcher.contentWindow.gpl) {
                    _fetcher.contentWindow.gpl.onRender(function (coords) {
                        setTimeout(function(_coords) {
                            _captureElement = _fetcher.contentWindow.jQuery(_internal.sequenceSelector)[0];
                            // console.log(_captureElement);
                            _internal.capture(_captureData.id, _captureElement, _captureData.name, _internal.nextCapture, _coords);
                            // _internal.nextCapture();
                        }(coords), 100);
                    });
                } else {
                    console.error('No gpl', _captureData);
                    setTimeout(function() {_internal.nextCapture(_captureData.name, true)}, 100);
                }
//                _fetcher.contentWindow.jQuery('body').bind('sequenceLoaded', function () {
//                    _captureElement = _fetcher.contentWindow.jQuery(_internal.sequenceSelector)[0];
//                    console.log(_captureElement);
//                    _internal.capture(_captureData.id, _captureElement, _captureData.name, _internal.nextCapture);
//                   // _internal.nextCapture();
//                });
            };
            _fetcher.src = '/gpl/view/' + _captureData.id + '?nosocket&nobg&nolog';
        },
        display: function () {
            var _captureData =  _internal.vm.currentCaptureData(),
                $captureElement;
            _fetcher.onload = function () {
                console.log('LOADED');
                if(_fetcher.contentWindow.displays) {
                    _fetcher.contentWindow.displays.onRender(function() {
                        if (typeof _fetcher.contentWindow.jQuery == 'undefined') {
                            console.log('JQUERY UNDEFINED');
                            _internal.nextCapture(_captureData.name, true);
                            return;
                        }
                        var bgColor;
                        $captureElement = _fetcher.contentWindow.jQuery(_internal.displaySelector);
                        _captureElement = $captureElement[0];
                        bgColor = $captureElement.css('background-color');
                        $captureElement.css('background-color', 'transparent');
                        _internal.capture(_captureData.id, _captureElement, _captureData.name, _internal.nextCapture, bgColor);
                    });
                }

            };
            _fetcher.src = '/displays/view/' + _captureData.id + '?nosocket';
        }
    };

    _internal.thumb = {width: 250, height: 141, margin: 10};

    _internal.renderImage = function (upi, name, canvas, callback, bgColor) {
        var _image = new Image(),
            _imageData = canvas.toDataURL();

        _image.onload = function () {
            console.log('RENDERIMAGE - IMAGE LOADED');
            var _thumbCanvas = document.createElement("canvas"),
                _context = _thumbCanvas.getContext("2d"),
                _frame = {
                    width : _internal.thumb.width - (_internal.thumb.margin * 2),
                    height: _internal.thumb.height - (_internal.thumb.margin * 2)
                };
            _context.canvas.width = _internal.thumb.width;
            _context.canvas.height = _internal.thumb.height;
            _internal.thumb.proposed = {};
            if (_image.naturalWidth > _image.naturalHeight) {
                _internal.thumb.ratio = _frame.width / _image.naturalWidth;
                _internal.thumb.proposed.width = _image.naturalWidth * _internal.thumb.ratio;
                _internal.thumb.proposed.height = _image.naturalHeight * _internal.thumb.ratio;
                if (_internal.thumb.proposed.height > _frame.height) {
                    _internal.thumb.ratio = _frame.height / _internal.thumb.proposed.height;
                    _internal.thumb.proposed.height = _internal.thumb.proposed.height * _internal.thumb.ratio;
                    _internal.thumb.proposed.width = _internal.thumb.proposed.width * _internal.thumb.ratio;
                }
            } else {
                _internal.thumb.ratio = _frame.height / _image.naturalHeight;
                _internal.thumb.proposed.width = _image.naturalWidth * _internal.thumb.ratio;
                _internal.thumb.proposed.height = _image.naturalHeight * _internal.thumb.ratio;
            }
            _internal.thumb.proposed.x = (_frame.width / 2) - (_internal.thumb.proposed.width / 2) + _internal.thumb.margin;
            _internal.thumb.proposed.y = (_frame.height / 2) - (_internal.thumb.proposed.height / 2) + _internal.thumb.margin;
            _context.drawImage(_image, _internal.thumb.proposed.x, _internal.thumb.proposed.y, _internal.thumb.proposed.width, _internal.thumb.proposed.height);
            _internal.thumb.data = _context.canvas.toDataURL();
            _internal.save(upi, _internal.thumb.data, bgColor);
            //_internal.vm.thumb(_internal.thumb.data);
            !!callback && callback(name);
            _image = null;
            if(_app.thumbnailCallback) {
                _app.thumbnailCallback();
            }
        };
        _image.onerror = function () {
            console.log('RENDERIMAGE - IMAGE LOAD ERROR', arguments);
            !!callback && callback(name, true);
            _image = null;
        };
        _image.src = _imageData;
        _internal.vm.thumb(_imageData);
        _internal.vm.currentThumbName(name);
    };

    _internal.capture = function (upi, domElement, name, callback, options) {
        clearTimeout(_internal.timer);
        if ($(domElement).is('canvas')) {
            _internal.processCanvas(upi, domElement, name, callback, options);
        } else {
            if (typeof html2canvas == 'undefined') {
                console.log('CAPTURING - loading html 2 canvas script');
                $.getScript('/js/thumbnailGenerator/html2canvas.js').done(
                    function () {
                        //options are bg color
                        _internal.processHTML(upi, domElement, name, callback, options);
                    }
                );
            } else {
                //options are bg color
                _internal.processHTML(upi, domElement, name, callback, options);
            }
        }
    };


    _internal.processCanvas = function(upi, domElement, name, callback, coords) {
        var _canvas = $(domElement)[0],
            _context = _canvas.getContext('2d'),
            _margin = 30,
            _copy = document.createElement('canvas').getContext('2d'),
            trimHeight,
            trimWidth,
            trimmed;


        $('.cvs').attr('src', _canvas.toDataURL());

        coords.top      = Math.floor(coords.top);
        coords.bottom   = Math.ceil(coords.bottom);
        coords.left     = Math.floor(coords.left);
        coords.right    = Math.ceil(coords.right);

        // console.log(coords);

        trimHeight = coords.bottom - coords.top;
        trimWidth = coords.right - coords.left;
        if (trimWidth == 0) {
            !!callback && callback(name, true);
            return;
        }
        trimmed = _context.getImageData(coords.left, coords.top, trimWidth, trimHeight);
        _context = null;

        _copy.canvas.width = trimWidth + (_margin * 2);
        _copy.canvas.height = trimHeight + (_margin * 2);
//        _copy.fillStyle   = '#C8BEAA';
//        _copy.fillRect  (0,   0, trimWidth + (_margin * 2), trimHeight + (_margin * 2));
        _copy.putImageData(trimmed, _margin, _margin);
        _internal.renderImage(upi, name, _copy.canvas, callback, '#fff');
        trimmed = null;
    };

    _internal.processCanvas_old = function(upi, domElement, name, callback) {
        var _canvas = $(domElement)[0],
            _context = _canvas.getContext('2d'),
            _margin = 30,
            _pixels, l, i, x, y, trimHeight, trimWidth, trimmed,
            _copy = document.createElement('canvas').getContext('2d'),
            bound = {
                top   : null,
                left  : null,
                right : null,
                bottom: null
            };
            _pixels = _context.getImageData(0, 0, _context.canvas.width, _context.canvas.height);
            l = _pixels.data.length;
            for (i = 0; i < l; i += 4) {
                if (_pixels.data[i + 0] !== 200 && _pixels.data[i + 0] !== 190 && _pixels.data[i + 0] !== 170) {
                    x = (i / 4) % _context.canvas.width;
                    y = ~~((i / 4) / _context.canvas.width);
                    if (bound.top === null) {
                        bound.top = y;
                    }
                    if (bound.left === null) {
                        bound.left = x;
                    } else if (x < bound.left) {
                        bound.left = x;
                    }
                    if (bound.right === null) {
                        bound.right = x;
                    } else if (bound.right < x) {
                        bound.right = x;
                    }
                    if (bound.bottom === null) {
                        bound.bottom = y;
                    } else if (bound.bottom < y) {
                        bound.bottom = y;
                    }
                }
            }
            trimHeight = bound.bottom - bound.top;
            trimWidth = bound.right - bound.left;
        // console.log(trimWidth, trimHeight);
            if (trimWidth == 0) {
                !!callback && callback(name, true);
                return;
            }
            trimmed = _context.getImageData(bound.left, bound.top, trimWidth, trimHeight);
            _context = null;

            _copy.canvas.width = trimWidth + (_margin * 2);
            _copy.canvas.height = trimHeight + (_margin * 2);
            _copy.fillStyle   = '#C8BEAA';
            _copy.fillRect  (0,   0, trimWidth + (_margin * 2), trimHeight + (_margin * 2));
            _copy.putImageData(trimmed, _margin, _margin);
            _internal.renderImage(upi, name, _copy.canvas, callback);
            trimmed = null;
    };

    _internal.processHTML = function(upi, domElement, name, callback, bgColor) {
        try {
            html2canvas(domElement, {
                onrendered: function(canvas) {
                    console.log('BEFORE RENDER -----------------------------------');
                    console.log('width', canvas.width, 'height', canvas.height);
                    domElement.parentNode.removeChild(domElement);
                    _internal.renderImage(upi, name, canvas, callback, bgColor);
                },
                logging: true
            });
        } catch (e) {
            console.log('ERROR RENDERING');
            domElement.parentNode.removeChild(domElement);
            !!callback && callback(name, true);
        }
    };

    _internal.processSVG = function (upi, domElement, name, callback) {
        var _svgFix = function (xml) {
                // based on http://goo.gl/KZDII strip off all spaces between tags
                var _svgXmlNoSpace = xml.replace(/>\s+/g, ">").replace(/\s+</g, "<"),
                // based on gabelerner added xmlns:xlink="http://www.w3.org/1999/xlink" into svg xlmns
                    _svgXmlFixNamespace = _svgXmlNoSpace.replace('xmlns="http://www.w3.org/2000/svg"', 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'),
                // based on http://goo.gl/KZDII image's href changed as xlink:href
                    _svgXmlFixImage = _svgXmlFixNamespace.replace(' href="', ' xlink:href="');
                // based on gabelerner image must be under the same domain - no crossside
                return _svgXmlFixImage;
            },
            _canvasElement = document.createElement('canvas'),
            _context = _canvasElement.getContext('2d'),
            _serializer = new XMLSerializer(),
            _xmlString = _svgFix(_serializer.serializeToString(domElement)),
            $SVG = $('<div id="SVGCanvas" style="position:absolute;left:-5000;">').appendTo('body'),
            draw = SVG('SVGCanvas').size('100%', '100%').fixSubPixelOffset(),
            _onRender = function () {
                var _pixels, l, i, x, y, trimHeight, trimWidth, trimmed,
                    _copy = document.createElement('canvas').getContext('2d'),
                    bound = {
                        top   : null,
                        left  : null,
                        right : null,
                        bottom: null
                    };
                _pixels = _context.getImageData(0, 0, _context.canvas.width, _context.canvas.height);
                l = _pixels.data.length;
                for (i = 0; i < l; i += 4) {
                    if (_pixels.data[i + 3] !== 0) {
                        x = (i / 4) % _context.canvas.width;
                        y = ~~((i / 4) / _context.canvas.width);
                        if (bound.top === null) {
                            bound.top = y;
                        }
                        if (bound.left === null) {
                            bound.left = x;
                        } else if (x < bound.left) {
                            bound.left = x;
                        }
                        if (bound.right === null) {
                            bound.right = x;
                        } else if (bound.right < x) {
                            bound.right = x;
                        }
                        if (bound.bottom === null) {
                            bound.bottom = y;
                        } else if (bound.bottom < y) {
                            bound.bottom = y;
                        }
                    }
                }
                trimHeight = bound.bottom - bound.top;// + (margin * 2);
                trimWidth = bound.right - bound.left;// + (margin * 2);
                trimmed = _context.getImageData(bound.left, bound.top, trimWidth, trimHeight);
                _canvasElement = null;
                _context = null;

                _copy.canvas.width = trimWidth;
                _copy.canvas.height = trimHeight;
                _copy.putImageData(trimmed, 0, 0);
                _internal.renderImage(upi, name, _copy.canvas, callback);
                trimmed = null;
            },
            bbox, ratio, newWidth, newHeight;

        domElement.parentNode.removeChild(domElement);

        draw.clear().svg(_xmlString);
        bbox = draw.bbox();
        newWidth = bbox.width;
        newHeight = bbox.height;

        if (bbox.width > bbox.height) {
            ratio = _internal.thumb.width / bbox.width;   // get ratio for scaling image
            newHeight = bbox.height * ratio;    // Reset height to match scaled image
            newWidth = bbox.width * ratio;    // Reset width to match scaled image
            if (newHeight > _internal.thumb.height) {
                ratio = _internal.thumb.height / newHeight;
                newHeight = newHeight * ratio;
                newWidth = newWidth * ratio;
            }
        }
        // Check if current height is larger than max
        if (bbox.height > bbox.width) {
            ratio = _internal.thumb.height / bbox.height; // get ratio for scaling image
            newWidth = bbox.width * ratio;    // Reset width to match scaled image
            newHeight = bbox.height * ratio;    // Reset height to match scaled image
        }
        draw.viewbox({x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height});
        draw.size(newWidth, newHeight);
        try {
            canvg(_canvasElement, draw.exportSvg(), {renderCallback: _onRender });
        } catch (e) {
            _canvasElement = null;
            _context = null;
            !!callback && callback(name, true);
        }
        draw = null;
        $SVG.remove();
        $('svg').remove();
    };

    _internal.save = function (id, thumb, bgColor) {
        console.log(id);
        $.ajax(
            {
                url        : _internal.apiEndpoint + 'save',
                contentType: 'application/json',
                dataType   : 'json',
                type       : 'post',
                data       : JSON.stringify(
                    {
                        id: id,
                        thumb: thumb,
                        bgColorHex : bgColor
                    }
                )
            }
        ).done(
            function (data) {
                // console.log(data);
            }
        );
    };

    _app.init = function () {
        //ui elements
        _ui.$btnStart = $('#btnStartProcess');
        _ui.$btnCancel = $('#btnCancelProcess');
        _ui.$updateAll = $('#updateAll');
        _ui.$thumb = $('#thumb');
        _ui.$activity = $('.activity');
        _ui.$btnStart.on('click', _internal.startCaptureProcess);
        _ui.$btnCancel.on('click', _internal.cancelCaptureProcess);
        _internal.vm.updateAll(false);
        ko.applyBindings(_internal.vm, document.getElementById('main'));
        window.onbeforeunload = function() {
            _waiting = 1;
            _captureClient && _captureClient.close();
        };
        //if (executeImmediately) _internal.startCaptureProcess();
    };

    _app.nextCapture = _internal.nextCapture;
    _app.errorList = _internal.vm.errorList;
    _app.errorDetailList = _internal.vm.errorDetailList;
    _app.captureList = _internal.vm.captureList

    return _app;
})(jQuery);

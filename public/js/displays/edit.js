var displays = window.displays || {},
    FileUploader = function(key) {
        var $button = $('.anim' + key + 'StateButton'),
            $text = $('.anim' + key + 'StateText'),
            $file = $('.anim' + key + 'StateFile'),
            changeHandler = function(e) {
                var file = $file[0].files[0],
                    reader = new FileReader();

                reader.onload = function(ee) {
                    var editItem = displays.getEditItem(),
                        prefix = '#screen_anim_',
                        img;

                    displays.filesToUpload[editItem._idx] = displays.filesToUpload[editItem._idx] || {};

                    displays.filesToUpload[editItem._idx][key] = {
                        name: file.name,
                        data: reader.result,
                        file: file
                    };

                    if(key === 'On') {

                        img = $(prefix + editItem._idx)[0];
                        img.src = reader.result;
                    }

                    displays.updateAnimFile(key + 'State', file.name);
                    displays.$scope.$apply();
                };

                reader.readAsDataURL(file);
            };

        $button.click(function() {
            $file.click();
        });

        $file.change(changeHandler);
    },
    startSize = function() {
        displays.sizing = true;
    },
    endSize = function() {
        displays.sizing = false;
        displays.$scope.$apply();
    },
    setPoint = function(point) {
        displays.selectPoint = point;
        $("#popSelector").popup("close");
        $("#popSelector").popup("close");
        if ($('#trendProps').css('display') === 'block') {
            $('#trendChoose').dblclick();
        } else {
            $('#choosePoint').dblclick();
        }
    },
    setImage = function(img) {
        $('#' + displays.imgInput).val(img);
        $('#' + displays.imgInput).trigger('input');
        $("#popSelector").popup("close");
        $("#popSelector").popup("close");
    },
    setImg = function(img) {
        $('#animSrc').val(img);
        $('#animSrc').trigger('input');
        $("#popSelector").popup("close");
        $("#popSelector").popup("close");
    };

displays = $.extend(displays, {
    resize: false,
    pageX: 0,
    pageY: 0,
    origWidth: 0,
    origHeight: 0,
    leftOffOrig: 0,
    topOffOrig: 0,
    sizeType: 0,
    dropObj: {},
    dropX: 0,
    dropY: 0,
    panDisplay: false,
    panStartX: 0,
    panStartY: 0,
    dragElement: {},
    menuLeft: 0,
    menuTop: 0,
    objX: 0,
    objY: 0,
    dragEl: {},
    selectMode: 'point',
    selectPoint: 0,
    pointName: '',
    imgInput: '',
    editMode: true,
    sizeX: 0,
    sizeY: 0,
    stageDisplay: {},
    sizing: false,
    animUploads: ['On', 'Off', 'OnAlarm', 'OffAlarm', 'Fault'],
    initAnimationUploaders: function () {
        var c,
            len = displays.animUploads.length,
            key;

        displays.animationUploaders = {};

        for (c = 0; c < len; c++) {
            key = displays.animUploads[c];
            displays.animationUploaders[key] = new FileUploader(key);
        }
    },
    processSelectedPoint: function(data) {
        var pointData = JSON.parse(data.point),
            upi = pointData._id,
            editItem = displays.getEditItem();

        editItem.upi = upi;
        displays.updateEditItem(editItem);
        displays.EditItemCtrl.$apply();

        $("#popSelector").popup("close");
    },
    getEditItemPrecision: function (dbFieldPrecision) {
        var displayPrecision;

        displayPrecision = parseFloat(dbFieldPrecision).toString().split(".")[1];
        // displayPrecision = (displayPrecision > 0) ? displayPrecision : parseInt(dbFieldPrecision);   // if we care about number to left of .
        displayPrecision = (displayPrecision > 0) ? displayPrecision : 0;

        return displayPrecision;
    },
    setDisplayPrecision: function (localDisplay) {
        var i,
            uiPrecision,
            screenObject,
            len =  localDisplay["Screen Objects"].length;

        for (i = 0; i < len; i++) {
            screenObject = parseInt(localDisplay["Screen Objects"][i]["Screen Object"], 10);
            if (screenObject === 0) {  //dynamic
                uiPrecision = localDisplay["Screen Objects"][i].uiPrecision;
                localDisplay["Screen Objects"][i].Precision = "0." + uiPrecision;
            }
            delete localDisplay["Screen Objects"][i].uiPrecision;
        }
    },
    upiInScreenOjbects: function (upi) {
        var answer = false,
            i,
            screenObj,
            lenScreenObjs = displayJson["Screen Objects"].length;

        for (i = 0; i < lenScreenObjs; i++) {
            screenObj = displayJson["Screen Objects"][i];
            if (screenObj.upi === upi) {
                answer = true;
                break;
            }
        }

        return answer;
    },
    pushPointRef: function (pid, name, pointType, propertyName) {
        var i,
            len = displayJson["Point Refs"].length,
            alreadyExists = false,
            propertyObj,
            pointRef = {};

        for (i = 0; i < len; i++) {
            pointRef = displayJson["Point Refs"][i];
            if (pointRef.Value === pid && pointRef.PropertyName === propertyName) {
                alreadyExists = true;
                break;
            }
        }

        if (!alreadyExists) {
            propertyObj = displays.workspaceManager.config.Utility.getPropertyObject("Device Point", displays.getEditItem());
            pointRef.PropertyEnum = displays.workspaceManager.config.Enums.Properties[propertyName].enum;
            pointRef.PropertyName = propertyName;
            pointRef.Value = pid;
            pointRef.AppIndex = displays.getNextAppIndex();
            pointRef.isDisplayable = true;
            pointRef.isReadOnly = false;
            pointRef.PointName = name;
            pointRef.PointType = displays.workspaceManager.config.Enums["Point Types"][pointType].enum;
            pointRef.PointInst = pid;
            pointRef.DevInst = (propertyObj !== null) ? propertyObj.Value : 0;

            displayJson["Point Refs"].push(pointRef);
        }

        return pointRef;
    },
    verifyPointReferences: function (localDisplay) {
        var i,
            lenPointRefs = localDisplay["Point Refs"].length,
            pointRef = {};

        for (i = 0; i < lenPointRefs; i++) {
            pointRef = localDisplay["Point Refs"][i];
            if (pointRef && !displays.upiInScreenOjbects(pointRef.Value)) {
                localDisplay["Point Refs"].splice(i, 1);  // Point Ref that's not being used
                i--;
            }
        }
    },
    verifyScreenObjects: function (localDisplay) {
        var i,
            lenScreenObjs = localDisplay["Screen Objects"].length,
            screenObj = {};

        for (i = 0; i < lenScreenObjs; i++) {
            screenObj = localDisplay["Screen Objects"][i];
            if (screenObj && displays.pointReferenceHardDeleted(screenObj.upi)) {
                //console.log("    localDisplay[Screen Objects][i] = " + localDisplay["Screen Objects"][i]);
                localDisplay["Screen Objects"].splice(i, 1);  // Point Ref that's not being used
                i--;
            }
        }
    },
    syncRightPanel: function (obj) {
        var screenObject = obj['Screen Object'],
            isActionButton = obj.hasOwnProperty('ActionCode'),
            fgColorPicker,
            $foregroundCustomColorPicker = $("#foregroundCustomColorPicker");

        if (isActionButton) {
            $('#actionButtonProps').show();
        } else {
            $('#actionButtonProps').hide();
        }

        if (screenObject === 1 || screenObject === 2 || isActionButton) {
            // delay = 500;
            // if ($('#rightPanel').hasClass('ui-panel-open')) {
            //     delay = 1;
            // }
            // setTimeout(function() {
            ///FOCUS
            $('#textarea').show();
            //$('#textarea').focus();
            //$('#textarea').select();
            // }, delay);
        } else {
            $('#textarea').hide();
        }

        if (screenObject === 3 || screenObject === 5 || screenObject === 6 || screenObject === 7) {
            $('#txtProps').hide();
        } else {
            $('#txtProps').show();
        }

        if (screenObject === 0) {
            $('#precision').show();
        } else {
            $('#precision').hide();
        }

        if (screenObject === 5 || screenObject === 6 || screenObject === 7) {
            $('#chartProps').show();
            $('#trendProps').show();
        } else {
            $('#chartProps').hide();
            $('#trendProps').hide();
        }

        if (screenObject === 3) {
            $('#imgProps').show();
            // $('.animationSection').hide();
            // $('.animationSingleFile').show();
        } else {
            $('#imgProps').hide();
        }

        if (screenObject === 0 || screenObject === 1 || screenObject === 3 || isActionButton) {
            $('#dynamicProps').show();
            if (screenObject !== 4) {
                $("#editItemPrecision").parent().css("width", "20%");
            }
        } else {
            $('#dynamicProps').hide();
        }

        if (screenObject === 1) {
            $('#transparent').parent().show();
        } else {
            $('#transparent').parent().hide();
        }

        $foregroundCustomColorPicker.off();
        fgColorPicker = new CustomColorsPicker($foregroundCustomColorPicker, obj, obj['Foreground Color'], 'Foreground Color');
        fgColorPicker.render();
        $foregroundCustomColorPicker.on('colorchange', function () {
            var $localElement = $('#screen_object_' + obj._idx),
                newColor = displays.getEditItem()['Foreground Color'];
            $localElement.css('color', '#' + newColor);
        });

        $("#rightPanel").panel("open");

        setTimeout(function() {
            $('#rightPanel select').selectmenu('refresh');
            $("#rightPanel input[type='radio'], #rightPanel input[type='checkbox']").checkboxradio('refresh');
            $('#cp').trigger("create");
        }, 10);
    },
    /***
     * Get a fully qualified url from a relative url
     * @param relative url
     * @returns fully qualified url
     */
    qualifyURL: function(url) {
        var _qualifyingAnchor = document.createElement('a'),
            _qualifiedURL;
        _qualifyingAnchor.href = url;
        _qualifiedURL = _qualifyingAnchor.href;
        return _qualifiedURL;
    },
    init: function (display) {
        var btn,
            txt,
            dynn,
            anim,
            plot,
            dBox,
            dBg,
            displayJson = display,
            pointNameFilterObj = {
                name1: '',
                name2: '',
                name3: '',
                name4: '',
                pointTypes: []
            },
            bgColorpicker,
            $backgroundCustomColorPicker = $("#backgroundCustomColorPicker"),
            initEditDisplay = function(display) {
                var objs = display['Screen Objects'],
                    screenObject,
                    pointRef,
                    upiList = [],
                    c;

                displays.upiNames = window.upiNames;
                window.displayJson = display;

                for (c = 0; c < objs.length; c++) {
                    screenObject = objs[c];
                    if (screenObject.upi > 0 || screenObject.pointRefIndex !== undefined) {
                        pointRef = displays.getScreenObjectPointRef(screenObject);

                        if (!!pointRef) {
                            screenObject.upi = pointRef.Value;
                            screenObject.pointRefIndex = pointRef.AppIndex;
                        }

                        upiList.push(screenObject.upi);
                        if (screenObject.Precision) {
                            screenObject.uiPrecision = parseInt(displays.getEditItemPrecision(screenObject.Precision), 10);
                        }
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
                    displays.versions = data.versions || [];
                    if (displayJson) {
                        displayJson.version = 'Production';
                        displays.versions.unshift(displayJson);
                    }

                    displays.initEditAngular();

                    displays.initAnimationUploaders();
                });

            };

        function setScreenSize() {
            var adjustToWidth = (screen.width),
                adjustToHeight = (screen.height * 0.9);

            window.moveTo(0, (screen.height * 0.05));  // centering up window
            window.resizeTo(adjustToWidth, adjustToHeight); // set window to % of screen res
        }

        function handleDragStart(e) {
            displays.$scope.blur();
            displays.dragElement = $('#' + e.target.id);
            //e.dataTransfer.dropEffect = 'none';
            $('#zoverlay').show();
            var el = document.getElementById($('#' + e.target.id).attr('data-ghost'));
            e.dataTransfer.setDragImage(el, 0, 0);
            e.dataTransfer.effectAllowed = 'copy';
        }

        function handleDragEnd(e) {
            $('#zoverlay').hide();
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault(); // Necessary. Allows us to drop.
            }
            //e.dataTransfer.setDragImage(el);
            return false;
        }

        function handleDragOver2(e) {
            if (e.preventDefault) {
                e.preventDefault(); // Necessary. Allows us to drop.
            }
            e.dataTransfer.dropEffect = 'copy';
            return false;
        }

        function handleDrop(e) {
            displays.dropX = e.offsetX;
            displays.dropY = e.offsetY;
            displays.dragElement.dblclick();
            if (e.stopPropagation) {
                e.stopPropagation(); // stops the browser from redirecting.
            }
            return false;
        }

        function handleDrop2(e) {
            displays.objX = e.offsetX;
            displays.objY = e.offsetY;
            $('#displayBg').dblclick();
            if (e.stopPropagation) {
                e.stopPropagation(); // stops the browser from redirecting.
            }
            return false;
        }

        function doPointSelect() {
            var parameters = {},
                pointTypes = displays.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes('Dynamic'),
                editItem = displays.EditItemCtrl.editItem,
                screenObject = editItem['Screen Object'],
                propertyName = displays.resolveDisplayObjectPropertyName(screenObject),
                pointSelectedCallback = function(pointInfo) {
                    var pointRef,
                        pid;

                    if (!!pointInfo) {
                        //here you can apply the selected point's pid and/or name
                        pid = pointInfo._id;
                        editItem.upi = pid;
                        pointRef = displays.pushPointRef(pid, pointInfo.name, pointInfo.pointType, propertyName);
                        editItem.pointRefIndex = pointRef.AppIndex;
                        editItem["Point Type"] = displays.workspaceManager.config.Enums['Point Types'][pointInfo.pointType].enum;
                        displays.upiNames[pid] = displays.upiNames[pid] || pointInfo.name;
                        displays.updateEditItem(editItem);
                        displays.EditItemCtrl.$apply();
                    }
                };

            parameters.pointTypes = pointTypes;

            dtiUtility.showPointSelector(parameters);
            dtiUtility.onPointSelect(pointSelectedCallback);
        }

        btn = document.getElementById('btn');
        btn.addEventListener('dragstart', handleDragStart, false);
        btn.addEventListener('dragend', handleDragEnd, false);

        actionbtn = document.getElementById('actionbtn');
        actionbtn.addEventListener('dragstart', handleDragStart, false);
        actionbtn.addEventListener('dragend', handleDragEnd, false);

        txt = document.getElementById('txt');
        txt.addEventListener('dragstart', handleDragStart, false);
        txt.addEventListener('dragend', handleDragEnd, false);

        dynn = document.getElementById('dynn');
        dynn.addEventListener('dragstart', handleDragStart, false);
        dynn.addEventListener('dragend', handleDragEnd, false);

        anim = document.getElementById('anim');
        anim.addEventListener('dragstart', handleDragStart, false);
        anim.addEventListener('dragend', handleDragEnd, false);

        plot = document.getElementById('plot');
        plot.addEventListener('dragstart', handleDragStart, false);
        plot.addEventListener('dragend', handleDragEnd, false);

        dBox = document.getElementById('zoverlay');
        dBox.addEventListener('dragover', handleDragOver, false);
        dBox.addEventListener('drop', handleDrop, false);

        dBg = document.getElementById('displayBg');
        dBg.addEventListener('dragover', handleDragOver2, false);
        dBg.addEventListener('drop', handleDrop2, false);

        displays.mouseEvents();
        // setScreenSize();

        bgColorpicker = new CustomColorsPicker($backgroundCustomColorPicker, display, display['Background Color'], 'Background Color');
        bgColorpicker.render();
        $backgroundCustomColorPicker.on('colorchange', function () {
            $('#display').css('backgroundColor', '#' + display['Background Color']);
        });

        $('.leftPanels').hide();

        $('#editSaveCancelBtns').removeClass('hide');
        if (window.self === window.top) {
            $('#minDisplay').show();
            $('#maxDisplay').hide();
        } else {
            $('#minDisplay').hide();
            $('#maxDisplay').show();
        }

        $(document).attr('unselectable', 'on')
            .css({
                '-moz-user-select': '-moz-none',
                '-o-user-select': 'none',
                '-khtml-user-select': 'none',
                /* you could also put this in a class */
                '-webkit-user-select': 'none',
                /* and add the CSS class here instead */
                '-ms-user-select': 'none',
                'user-select': 'none'
            }).bind('selectstart', function() {
                return false;
            });

        $('.popSelector').click(function() { //for trend plot
            doPointSelect();
        });

        $('#choosePoint').click(function() {
            doPointSelect();
        });

        $('#browseBg').click(function() {
            $('#bgPicFile').click();
        });

        $('#bgPicFile').change(function(e) {
            var file = $(e.target)[0].files[0],
                bgImg = $('#displayBg'),
                img = bgImg[0],
                reader = new FileReader();

            reader.onload = (function(aImg) {
                return function(ee) {
                    var image = new Image();

                    image.onload = function(event) {
                        bgImg.css({
                            width: this.width,
                            height: this.height
                        });
                    };

                    display['Background Picture'] = file.name;
                    image.src = ee.target.result;
                    aImg.src = ee.target.result;
                    displays.hasNewBackground = true;
                    displays.filesToUpload['background'] = {
                        name: file.name,
                        data: ee.target.result,
                        file: file
                    };
                    displays.$scope.$apply();
                };
            }(img));

            reader.readAsDataURL(file);
        });

        //hidden file element
        $('#imgPicFile').change(function(e) {
            var file = $(e.target)[0].files[0],
                editItem = displays.getEditItem(),
                idx = editItem._idx,
                img = $('#screen_anim_' + idx)[0],
                reader = new FileReader();

            reader.onload = (function(aImg) {
                return function(ee) {
                    editItem['Animation File'] = file.name;
                    aImg.src = ee.target.result;
                    displays.filesToUpload[idx] = {
                        name: file.name,
                        data: ee.target.result,
                        file: file
                    };
                    displays.$scope.$apply();
                };
            }(img));

            reader.readAsDataURL(file);
        });

        //visible button
        $('#browseBg2').click(function() {
            $('#imgPicFile').click();
        });

        $('.closePop').click(function() {
            $("#popSelector").popup("close");
            $("#popSelector").popup("close");
        });

        $('#removePoints').click(function() {
            //$('.trendPoints').checkboxradio("refresh");
            $('#trendProps').trigger('refresh');
        });

        $('#dnav1').click(function() {
            $('.leftPanels').hide();
            $('#dProps').show();
        });

        $('#dnav2').click(function() {
            $('.leftPanels').hide();
            $('#dLib').show();
        });

        $('#dnav3').click(function() {
            $('.leftPanels').hide();
            $('#dClip').show();
        });

        $('#dnav4').click(function() {
            $('.leftPanels').hide();
            $('#dVersion').show();
        });

        $('#dnav2').trigger('click');

        $('#panelPop').click(function() {
            if ($('#leftPanel').hasClass('ui-panel-open')) {
                $(this).find('.ui-icon').removeClass('ui-icon-d-left').addClass('ui-icon-d-right');
                $(this).find('.ui-btn-text').html('Open');
            } else {
                $(this).find('.ui-icon').removeClass('ui-icon-d-right').addClass('ui-icon-d-left');
                $(this).find('.ui-btn-text').html('Close');
            }
        });

        $("#handles").on("slidestop", function(event, ui) {
            if ($("#handles").val() === 'show') {
                $('.handle').show();
            } else {
                $('.handle').hide();
            }
        });

        $('.handle').mousedown(function(event) {
            displays.resize = true;
            displays.prevX = event.pageX;
            displays.prevY = event.pageY;
            // console.table([{
            //     origWidth: displays.origWidth,
            //     origHeight: displays.origHeight,
            //     leftOffOrig: displays.leftOffOrig,
            //     topOffOrig: displays.topOffOrig
            // }]);
            displays.origWidth = $('#display').width();
            displays.origHeight = $('#display').height();
            displays.leftOffOrig = $('#display').offset().left;
            displays.topOffOrig = $('#display').offset().top;
            // console.table([{
            //     origWidth: displays.origWidth,
            //     origHeight: displays.origHeight,
            //     leftOffOrig: displays.leftOffOrig,
            //     topOffOrig: displays.topOffOrig
            // }]);
        });

        $(document).on('mousedown', '.sizeNw, .nW', function(event) {
            displays.sizeType = 'nw';
            displays.sizeStartPos = {
                x: event.pageX,
                y: event.pageY
            };
        });

        $(document).on('mousedown', '.sizeSw, .sW', function(event) {
            displays.sizeType = 'sw';
            displays.sizeStartPos = {
                x: event.pageX,
                y: event.pageY
            };

        });

        $(document).on('mousedown', '.sizeNe, .nE', function(event) {
            displays.sizeType = 'ne';
            displays.sizeStartPos = {
                x: event.pageX,
                y: event.pageY
            };
        });

        $(document).on('mousedown', '.sizeSe, .sE', function(event) {
            displays.sizeType = 'se';
            displays.sizeStartPos = {
                x: event.pageX,
                y: event.pageY
            };
        });

        setTimeout(function() {
            $("#slider1").bind('change', function(event) {
                $('#slider1').trigger('input');
            });

            $("#slider2").bind('change', function(event) {
                $('#slider2').trigger('input');
            });
        }, 2000);

        $(document).mousemove(function(event) {
            var newWidth,
                newHeight,
                oldWidth,
                oldHeight,
                diffWidth,
                diffHeight,
                $slider1 = $('#slider1'),
                $slider2 = $('#slider2');

            if (displays.resize) {
                displays.pageX = event.pageX;
                displays.pageY = event.pageY;

                diffWidth = displays.prevX - displays.pageX;
                diffHeight = displays.prevY - displays.pageY;

                displays.prevX = displays.pageX;
                displays.prevY = displays.pageY;

                oldWidth = +$slider2.val();
                oldHeight = +$slider1.val();

                if (displays.sizeType.match('w')) {
                    //west needs reposition
                    displays.$scope.dLeft -= diffWidth;
                    newWidth = oldWidth + diffWidth;
                } else {
                    newWidth = oldWidth - diffWidth;
                }

                if (displays.sizeType.match('n')) {
                    //north needs reposition
                    displays.$scope.dTop -= diffHeight;
                    newHeight = oldHeight + diffHeight;
                } else {
                    newHeight = oldHeight - diffHeight;
                }

                $slider1.val(newHeight);
                $slider1.trigger('input');
                $slider1.slider('refresh');
                $slider2.val(newWidth);
                $slider2.trigger('input');
                $slider2.slider('refresh');
            }
        });

        $(document).mouseup(function() {
            displays.resize = false;
        });

        $('#checkbox-mini-0').click(function() {
            if ($('#checkbox-mini-0').is(":checked")) {
                $('.tick').show();
            } else {
                $('.tick').hide();
            }
        });
        $("#leftPanel").panel("open");
        //$("#imgPanel").popup("open",{ transition: "slidedown" });
        setTimeout(function() {
            $('#bg-color').selectmenu('refresh');
            $('#slider1').slider('refresh');
            $('#slider2').slider('refresh');
        }, 1000);

        $("#minDisplay").css("display", "none");
        initEditDisplay(displayJson);
    },
    initEditAngular: function() {
        var displayApp = angular.module('displayApp', ['ui.sortable']);

        displays.initDisplay();

        displays.displayApp = displayApp;
        displays.isEdit = true;

        displayApp.controller('EditItemCtrl', function($scope, $http) {
            displays.$editScope = $scope;

            $scope.updateEditItem = displays.updateEditItem = function(item) {
                var $el = $('#actionButtonValue');

                if ($scope.editItem._idx === item._idx) {// is update
                    if (item.hasOwnProperty('ActionCode')) { // is action button
                        item._actionButton.updateConfig(item, true);
                        if (item._actionButton.options) {
                            setTimeout(function () {
                                var itemVal = item.ActionParm;
                                $el.html('');
                                $.each(item._actionButton.options, function (idx, val) {
                                    var selected = '';
                                    if (val.value === itemVal) {
                                        selected = ' selected';
                                    }
                                    $el.append('<option value="' + val.value + '"' + selected + '>' + val.name + '</option>');
                                });
                            }, 10);
                        }
                    }
                }

                $scope.editItem = item;
                displays.updateAnimItem(item);
            };

            $scope.editReportRange = function () {
                $scope.editItem._actionButton.sendCommand();
                // $('#reportChooseRange').modal('show');
            };

            $scope.updateAnimItem = displays.updateAnimItem = function(item) {
                var elsToShow;

                if(item) {
                    $scope.animItem = displays.animations['screen_anim_' + item._idx];
                }

                if($scope.animItem) {
                    if($scope.animItem.animType === 'multifile') {
                        elsToShow = '.animationMultiFile';
                    } else {
                        elsToShow = '.animationSingleFile';
                    }
                }

                $('.animationSection').hide();
                $(elsToShow).show();
            };

            displays.updateAnimType = function(type) {
                var animType = $scope.animItem.updateAnimType(type);
                $scope.editItem._animType = animType;
                displays.updateAnimItem();
            };

            displays.updateAnimFile = function(key, file) {
                $scope.animItem.animFiles[key] = file;
                if(key === 'OnState') {
                    $scope.editItem['Animation File'] = file;
                }
                $scope.editItem[key] = file;
                $scope.editItem._v2 = true;
            };

            displays.getEditItem = function() {
                return $scope.editItem;
            };

            displays.EditItemCtrl = $scope;
        });

        displayApp.controller('DisplayCtrl', function($scope, $http) {
            var $topBar = $(".topBar.ui-header"),
                maxScrollPercentage = 0.25,
                previousScrollValue = 0,
                upiList = [],
                filterms2rgb = function (input) {
                    var ret = '#' + input;
                    return ret;
                },
                filterpts2px = function (input) {
                    return Math.floor(input * (4 / 3)) + 'px';
                },
                filterfonts = function (input) {
                    var font = input;
                    if (input === 'Bookman Old Style') {
                        font = 'Arial';
                    }
                    if (input === 'Fixedsys' || input === 'fixedsys') {
                        font = 'fixedsys, consolas, monospace';
                    }
                    return font;
                },
                filterbold = function (input) {
                    var out = 'normal';
                    if (input === true) {
                        out = 'bold';
                    }
                    return out;
                },
                filterunderline = function (input) {
                    var out = 'none';
                    if (input === true) {
                        out = 'underline';
                    }
                    return out;
                },
                filteritalic = function (input) {
                    var out = 'normal';
                    if (input === true) {
                        out = 'italic';
                    }
                    return out;
                },
                filterwh = function (input, screenObject) {
                    var wh = +input;
                    if (wh === 0 || screenObject === 0) {
                        wh = 'auto';
                    } else {
                        wh = wh + 'px';
                    }
                    return wh;
                },
                filterwmf = function (input) {
                    var bg = input,
                            out;

                    if (input && input.toLowerCase().match('.png')[0] !== input.toLowerCase()) {
                        if (displays.filesToUpload[input._idx]) {
                            out = '';
                        } else {
                            bg = bg.replace('.WMF', '.png');
                            bg = bg.replace('.wmf', '.png');
                            bg = bg.replace('.BMP', '.png');
                            bg = bg.replace('.bmp', '.png');
                            bg = bg.replace(/ /g, '%20');
                            bg = '/display_assets/assets/' + bg;
                            out = bg;//'url(' + bg + ')';
                        }
                    } else {
                        out = '/img/blank.gif';
                    }

                    //out = out + 'background-size:' + displayWidth + 'px';
                    return out;
                },
                addNewScreenObject = function (obj) {
                    var idx = $scope.objs.length,
                            id = 'screen_anim_' + idx,
                            objectIsAnimation = (obj["Screen Object"] === 3),
                            el;

                    // console.log(idx, scObj);

                    // if(obj.Width === 0) {
                    //     console.log(scObj.css('width'), parseInt(scObj.css('width'), 10));
                    //     obj.Width = parseInt(scObj.css('width'), 10);
                    // }

                    // if(obj.Width === 0) {
                    //     console.log(scObj.css('height'), parseInt(scObj.css('height'), 10));
                    //     obj.Height = parseInt(scObj.css('height'), 10);
                    // }

                    obj._idx = idx;
                    //store original coordinates
                    obj.oLeft = obj.Left;
                    obj.oTop = obj.Top;
                    obj.oWidth = obj.Width;
                    obj.oHeight = obj.Height;
                    obj.sel = true;
                    if (objectIsAnimation) {
                        el = $('#' + id);
                        displays.animations[id] = new displays.DisplayAnimation(el, obj);
                    }
                    displays.updateEditItem(obj);
                    $scope.editItem = obj;

                    $scope.objs.push(obj);
                    $('.activeHighlight').removeClass('activeHighlight');
                    displays.syncRightPanel(obj);

                    //if (objectIsAnimation) {  // open file browser
                    //    $('#browseBg2').click();
                    //}
                },
                updatePanw = function () {
                    $scope.panW = $('#panw-slider').val();
                    $scope.dLeft = +$scope.panW + (-1 * (+$scope.display.Width / 2));
                    $('#display').css('margin-left', $scope.dLeft);
                },
                updatePanh = function () {
                    $scope.panH = $('#panh-slider').val();
                    $scope.dTop = +$scope.panH + (-1 * (+$scope.display.Height / 2));
                    $('#display').css('margin-top', $scope.dTop);
                },
                updateZoom = function () {
                    $scope.zoom = +$('#zoom-slider').val();
                    $('#display').css({
                        '-webkit-transform': 'scale(' + $scope.zoom / 100 + ')',
                        'transform': 'scale(' + $scope.zoom / 100 + ')'
                    });
                },
                zoomToFitWindow = function () {
                    var winWidth = window.innerWidth,
                            winHeight = window.innerHeight - $(".topBar.ui-header").height(),
                            displayWidth = $scope.display.Width,
                            displayHeight = $scope.display.Height,
                            percentageWidthDiff = Number((winWidth / displayWidth).toFixed(2)),
                            percentageHeightDiff = Number((winHeight / displayHeight).toFixed(2)),
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
                        $('#zoom-slider').val(zoomTo).slider("refresh");
                        updateZoom();
                    }
                };

            displays.$scope = $scope;
            $scope.display = displayJson;
            $scope.oDisplay = angular.copy(displayJson);
            $scope.versions = displays.versions;
            $scope.zoom = 100;
            $scope.clipBoard = [];
            $scope.panW = 0;
            $scope.dLeft = (-1 * ($scope.display.Width / 2)) + $scope.panW;
            $scope.panH = 0;
            $scope.dTop = (-1 * ($scope.display.Height / 2)) + $scope.panH;
            $scope.objs = $scope.display['Screen Objects'];
            $scope.openWindow = displays.openWindow;
            $scope.serverImageBrowser = new diFileBrowser();
            displays.popUpWindowActive = false;

            $scope.reportConfig = $.extend(true, {}, displays.defaultReportConfig);
            $scope.selectInterval = function (interval) {
                $scope.reportConfig.intervalType = interval;
                setTimeout(function () {
                    $scope.$apply();
                }, 1);
            };

            $scope.priorities = displays.workspaceManager.systemEnums.controlpriorities;


            $('#editDisplay').hide();

            document.title = displayJson.Name;

            $('#panw-slider').on('change', function() {
                updatePanw();
            });

            $('#panh-slider').on('change', function() {
                var $display = $('#display'),
                    panH = $('#panh-slider').val(),
                    currentZoom = (+$('#zoom-slider').val())/100,
                    scrollingUp = (panH > previousScrollValue),
                    winHeight = window.innerHeight - $topBar.height(),
                    virtualTop = maxScrollPercentage * winHeight,
                    virtualBottom = winHeight - (maxScrollPercentage * winHeight),
                    displayTop = parseInt(($display.offset().top + panH), 10),
                    displayBottom = parseInt(((displayTop + ($scope.display.Height * currentZoom)) + panH), 10);

                if (((displayBottom >= virtualTop) && (displayTop <= virtualBottom)) ||  // display still in virtual window
                        (scrollingUp && (displayBottom < virtualTop)) ||  // maxed out scrolling up
                        (!scrollingUp && (displayTop > virtualBottom))) {  // maxed out scrolling down
                    updatePanh(panH);
                    previousScrollValue = parseInt(panH,10);
                } else {
                    //event.preventDefault();
                    $('#panh-slider').val(parseInt(previousScrollValue,10));
                }
            });

            $('#zoom-slider').on('change', function() {
                updateZoom();
            });

            $('.autoZoom').click(function() {
                zoomToFitWindow();
                return false;
            });

            $('.resetZoom').click(function() {
                $scope.resetZoom();
            });

            $('.browseserverimages').click(function() { // for browsing existing images on server
                displays.popUpWindowActive = true;
                $scope.serverImageBrowser.init(this.dataset.modelobject, this.dataset.modelfield, this.dataset.imagetype);
            });

            displays.initScreenObjects({
                $scope: $scope,
                isEdit: true,
                iterFn: function(item) {
                    upiList.push(item.upi);
                }
            });

            // if (upiList.length > 0) {
            //     $.ajax({
            //         url: '/api/points/getnames',
            //         method: 'post',
            //         data: {
            //             upis: upiList
            //         }
            //     }).done(function(data) {
            //         var cc, lenn = data.length,
            //             row;
            //         for (cc = 0; cc < lenn; cc++) {
            //             row = data[cc];
            //             if (row !== null) {
            //                 displays.upiNames[row._id] = row.Name;
            //             }
            //         }
            //     });
            // }

            $scope.editItem = {};

            $scope.cleanActionButtons = function (disp) {
                var c,
                    objects = disp['Screen Objects'],
                    obj,
                    button;

                for (c = 0; c < objects.length; c++) {
                    obj = objects[c];
                    button = obj._actionButton;
                    if (button) {
                        obj.upi = button.upi;
                        // if (button.value) {
                        //     obj.value = button.value && button.value.value;
                        // }
                        obj.ActionPriority = parseInt(button.ActionPriority, 10);
                        if (obj.ActionParm !== undefined) {
                            obj.ActionParm = parseFloat(obj.ActionParm);
                        }
                        delete obj._actionButton;
                    }
                }
            };

            //    if (window.self !== window.top) {
            //        window.top.tabTitle($scope.display._id, $scope.display.Name);
            //    }

            $scope.serverImageSelected = function () {
                if ($scope.serverImageBrowser.selectedFileName && $scope.serverImageBrowser.selectedFileName.length > 0) {
                    $scope[$scope.serverImageBrowser.displayObject][$scope.serverImageBrowser.displayField] = $scope.serverImageBrowser.selectedFileName;
                    if($scope.serverImageBrowser.displayField === "Background Picture") {
                        $('#displayBg').attr('src', '/display_assets/assets/' +$scope.serverImageBrowser.selectedFileName);
                    }
                    displays.hasNewBackground = true;
                }
                displays.popUpWindowActive = false;
            };

            $scope.captureThumbnail = function (id, name) {
                displays.workspaceManager.captureThumbnail({
                    upi: id,
                    name: name,
                    type: 'display'
                });
            };

            $scope.cancelServerImageSelection = function () {
                displays.popUpWindowActive = false;
            };

            $scope.action = function(item, $event) {
                var i,
                    editItem,
                    idx = item._idx,
                    el = $('#screen_object_' + idx),
                    imgEl,
                    screenObject = parseInt(item['Screen Object'], 10);

                if (screenObject === 3 && (item.Height <= 1 || item.Width <= 1)) { //animation
                    imgEl = $('#screen_anim_' + idx);

                    item.Width = parseFloat(imgEl.css('width'));
                    item.Height = parseFloat(imgEl.css('height'));
                } else {
                    if (item.Width === 0) {
                        item.Width = parseInt(el.css('width'), 10) + 1;
                    }

                    if (item.Height === 0) {
                        item.Height = parseInt(el.css('height'), 10);
                    }
                }

                //console.log($event);
                $('#tip').hide();
                $('#paste').hide();
                $('#menu').hide();
                //console.log('edit me!');
                //don;t clear if multiple
                for (i = 0; i < $scope.objs; i++) {
                    $scope.objs[i].sel = false;
                }

                $scope.editItem.sel = false;

                editItem = item;
                //store original coordinates
                editItem.oLeft = item.Left;
                editItem.oTop = item.Top;
                editItem.oWidth = item.Width;
                editItem.oHeight = item.Height;
                editItem.sel = true;

                $scope.editItem = editItem;
                displays.updateEditItem(editItem);

                $scope.dragItem = {};

                if ($event !== undefined) {
                    $('.activeHighlight').removeClass('activeHighlight');
                    el.addClass('activeHighlight');
                }

                displays.syncRightPanel(editItem);
            };

            $scope.addNewObject = function() {
                var obj = {
                    "Animation File": "",
                    "Animation ID": 0,
                    "Background Color": 0,
                    "Font Bold": 0,
                    "Font Italic": 0,
                    "Font Name": "fixedsys",
                    "Font Size": 9,
                    "Font Strikethru": 0,
                    "Font Underline": 0,
                    "Foreground Color": '000000',
                    "Height": 15,
                    "Left": displays.dropX,
                    "Point Type": 151,
                    "Precision": "0.0",
                    "Screen Object": 1,
                    "Text": 'Button',
                    "Top": displays.dropY,
                    "upi": 'none',
                    "Width": 100
                };
                addNewScreenObject(obj);
            };

            $scope.addNewActionButton = function() {
                var obj = {
                    "ActionCode": "Analog Value Command",
                    "Animation File": "",
                    "Animation ID": 0,
                    "Background Color": 0,
                    "Font Bold": 0,
                    "Font Italic": 0,
                    "Font Name": "fixedsys",
                    "Font Size": 9,
                    "Font Strikethru": 0,
                    "Font Underline": 0,
                    "Foreground Color": '000000',
                    "Height": 15,
                    "Left": displays.dropX,
                    "Point Type": 151,
                    "Precision": "0.0",
                    "Screen Object": 1,
                    "Text": 'Action Button',
                    "Top": displays.dropY,
                    "upi": 'none',
                    "Width": 100
                };
                addNewScreenObject(obj);
            };

            $scope.addNewTxt = function() {
                var obj = {
                    "Animation File": "",
                    "Animation ID": 0,
                    "Background Color": 0,
                    "Font Bold": false,
                    "Font Italic": false,
                    "Font Name": "Fixedsys",
                    "Font Size": 12,
                    "Font Strikethru": false,
                    "Font Underline": false,
                    "Foreground Color": '000000',
                    "Height": 19,
                    "Left": displays.dropX,
                    "Point Type": 0,
                    "Precision": "0.0",
                    "Screen Object": 2,
                    "Text": "Text Label",
                    "Top": displays.dropY,
                    "upi": 'Text Label',
                    "Width": 88
                };
                addNewScreenObject(obj);
            };

            $scope.addNewDyn = function() {
                var obj = {
                    "Animation File": "",
                    "Animation ID": 0,
                    "Background Color": 0,
                    "Font Bold": false,
                    "Font Italic": false,
                    "Font Name": "Fixedsys",
                    "Font Size": 12,
                    "Font Strikethru": false,
                    "Font Underline": false,
                    "Foreground Color": '000000',
                    "Height": 19,
                    "Left": displays.dropX,
                    "Point Type": 4,
                    "Precision": "0.0",
                    "Screen Object": 0,
                    "Top": displays.dropY,
                    "upi": 'none',
                    "Width": 72
                };
                addNewScreenObject(obj);
            };

            $scope.checkChanges = function() {
                event.preventDefault();
                //$scope.oDisplay
                var nDisplay = angular.copy($scope.display),
                    _title;
                if (angular.equals($scope.oDisplay, nDisplay)) {
                    //window.location = '/displays/view/' + $scope.display._id;
                    _title = window.displayJson.Name;
                    $scope.openWindow('/displays/view/' + $scope.display._id, _title, window.displayJson['Point Type'].Value, '', $scope.display._id, {
                        width: parseInt(window.displayJson.Width, 10) + 50, 
                        height: parseInt(window.displayJson.Height, 10) + 100,
                        sameWindow: true,
                        windowId: window.windowId
                    });
                    //window.close();
                } else {
                    $("#confirmChanges").popup("open", {
                        transition: "slidedown"
                    });
                }
            };

            $scope.anyway = function() {
                //window.location = '/displays/view/' + $scope.display._id;
                var _title = window.displayJson.Name;
                $scope.openWindow('/displays/view/' + $scope.display._id, _title, window.displayJson['Point Type'].Value, '', $scope.display._id, {
                        width: parseInt(window.displayJson.Width, 10) + 50, 
                        height: parseInt(window.displayJson.Height, 10) + 100,
                        sameWindow: true,
                        windowId: window.windowId
                    });
                //window.close();
            };

            $scope.addNewAnimation = function() {
                var obj = {
                        "Animation File": "placeholder",
                        "Animation ID": 0,
                        "Background Color": 0,
                        "Font Bold": false,
                        "Font Italic": false,
                        "Font Name": "Fixedsys",
                        "Font Size": 16,
                        "Font Strikethru": false,
                        "Font Underline": false,
                        "Foreground Color": '000000',
                        "Height": 37,
                        "Left": displays.dropX,
                        "Point Type": 4,
                        "Precision": "1.0",
                        "Screen Object": 3,
                        "Top": displays.dropY,
                        "upi": 'none',
                        "Width": 32,
                        "_saveHeight":  true
                    };
                    //id = 'screen_anim_' + $scope.objs.length,
                    //el;

                addNewScreenObject(obj);

                //setTimeout(function() {
                //    el = $('#' + id);
                //    displays.animations[id] = new displays.DisplayAnimation(el, obj);
                //},10);
            };

            $scope.delPoint = function(pnt) {
                $scope.editItem.points.splice($scope.editItem.points.indexOf(pnt), 1);
            };

            $scope.addPlot = function() {
                var obj = {
                    "Animation File": "",
                    "Animation ID": 0,
                    "Background Color": 0,
                    "Font Bold": false,
                    "Font Italic": false,
                    "Font Name": "Fixedsys",
                    "Font Size": 16,
                    "Font Strikethru": false,
                    "Font Underline": false,
                    "Foreground Color": '000000',
                    "Height": 200,
                    "Left": displays.dropX,
                    "Point Type": 7,
                    "Precision": "0.0",
                    "Screen Object": 7,
                    "Top": displays.dropY,
                    "Title": '',
                    "Yaxis": '',
                    "upi": 'none',
                    "points": [],
                    "Width": 400
                };
                addNewScreenObject(obj);
            };

            $scope.blur = function() {
                $("#rightPanel").panel("close");
                $scope.editItem.sel = false;
                $scope.editItem = {};
                $('#menu').hide();
                $('#paste').hide();
                $('.activeHighlight').removeClass('activeHighlight');
            };

            $scope.copyObj = function() {
                var len,
                    $clipboardUL,
                    $clipboardLI,
                    $listItems,
                    i;
                $scope.clipBoard = [];
                $scope.clipBoard.push($scope.editItem);
                $('#menu').hide();
                //$clipboardUL = $("#clipboardItems");
                //$listItems = $(".clipboardItem");
                //len = $scope.clipBoard.length;
                //$clipboardLI = $('#clipboardItem-' + len);
                //for (i = 0; i < $listItems.length; i++) {
                //    $clipboardLI = $listItems[i];
                //    $clipboardLI.addClass('workingDude');
                //}
                //$clipboardLI = $clipboardUL[len];
                //$clipboardLI.addClass('workingDude');
                //$clipboardLI.addEventListener('dragstart', handleDragStart2, false);
                //$clipboardLI.addEventListener('dragend', handleDragEnd2, false);
            };

            $scope.pasteHere = function() {
                var mem = $scope.clipBoard[0],
                    pasteObj = {
                        "Animation File": mem['Animation File'],
                        "Animation ID": mem['Animation ID'],
                        "Background Color": mem['Background Color'],
                        "Font Bold": mem['Font Bold'],
                        "Font Italic": mem['Font Italic'],
                        "Font Name": mem['Font Name'],
                        "Font Size": mem['Font Size'],
                        "Font Strikethru": mem['Font Strikethru'],
                        "Font Underline": mem['Font Underline'],
                        "Foreground Color": mem['Foreground Color'],
                        "Height": mem.Height,
                        "Left": displays.cursorX - displays.leftOffOrig,
                        "Point Type": mem['Point Type'],
                        "Precision": mem.Precision,
                        "Screen Object": mem['Screen Object'],
                        "Text": mem.Text,
                        "Top": displays.cursorY - displays.topOffOrig,
                        "upi": mem.upi,
                        "Width": mem.Width
                    };
                addNewScreenObject(pasteObj);
                console.log("displays.cursorX = ", displays.cursorX);
                console.log("displays.leftOffOrig = ", displays.leftOffOrig);
                console.log("displays.cursorX - displays.leftOffOrig = ", displays.cursorX - displays.leftOffOrig);
                console.log("displays.pageX = ", displays.pageX);
                console.log("displays.dpageX = ", displays.dpageX);
                console.log("displays.startX = ", displays.startX);
                $('#paste').hide();
            };

            $scope.pasteOriginal = function() {
                //alert('original');
                var mem = $scope.clipBoard[0],
                    pasteObj = {
                        "Animation File": mem['Animation File'],
                        "Animation ID": mem['Animation ID'],
                        "Background Color": mem['Background Color'],
                        "Font Bold": mem['Font Bold'],
                        "Font Italic": mem['Font Italic'],
                        "Font Name": mem['Font Name'],
                        "Font Size": mem['Font Size'],
                        "Font Strikethru": mem['Font Strikethru'],
                        "Font Underline": mem['Font Underline'],
                        "Foreground Color": mem['Foreground Color'],
                        "Height": mem.Height,
                        "Left": displays.menuLeft,
                        "Point Type": mem['Point Type'],
                        "Precision": mem.Precision,
                        "Screen Object": mem['Screen Object'],
                        "Text": mem.Text,
                        "Top": displays.menuTop,
                        "upi": mem.upi,
                        "Width": mem.Width
                    };
                addNewScreenObject(pasteObj);
                $('#paste').hide();
            };

            $scope.update = function() {
                $scope.display.Height = $('#slider1').val();
                $scope.display.Width = $('#slider2').val();
            };

            $scope.saveDisplay = function() {
                // var key;

                // for (key in origDisplay) {
                //     if (origDisplay.hasOwnProperty(key)) {
                //         origDisplay[key] = displayJson[key];
                //     }
                // }
                $scope.blur();
            };

            $scope.savePublish = function(disp) {
                var saveObj = angular.copy(disp || displayJson),
                    data = new FormData(),
                    list = Object.keys(displays.filesToUpload),
                    innerList,
                    obj,
                    c,
                    cc,
                    innerObj;

                $scope.cleanActionButtons(saveObj);

                for (c = 0; c < list.length; c++) {
                    obj = displays.filesToUpload[list[c]];
                    if(obj.file) {
                        data.append(obj.name, obj.file);
                    } else {
                        innerList = Object.keys(obj);
                        for(cc=0; cc<innerList.length; cc++) {
                            innerObj = obj[innerList[cc]];
                            data.append(innerObj.name, innerObj.file);
                        }
                    }
                }

                delete saveObj.version;
                displays.setDisplayPrecision(saveObj);
                displays.verifyPointReferences(saveObj);
                displays.verifyScreenObjects(saveObj);

                data.append('display', JSON.stringify(saveObj));

                $scope.captureThumbnail(saveObj._id, saveObj.Name);
                $scope.blur();

                $.ajax({
                    url: '/displays/publish',
                    processData: false,
                    type: 'POST',
                    cache: false,
                    contentType: false,
                    data: data
                }).done(function(data) {
                    var _title = window.displayJson.Name,
                        pointType = window.displayJson['Point Type'].Value,
                        _id = window.displayJson._id,
                        width = parseInt(window.displayJson.Width, 10) + 400,
                        height = parseInt(window.displayJson.Height, 10) + 100;

                    displays.openWindow('/displays/view/' + saveObj._id, _title, pointType, '', _id, {
                        width: width,
                        height: height,
                        sameWindow: true,
                        windowId: window.windowId
                    });
                });
            };

            $scope.publish = function(version) {
                var display = angular.copy(version);

                display._id = display.vid;
                delete display.version;

                $scope.savePublish(display);
            };

            $scope.saveLater = function() {
                var saveObj = angular.copy(window.displayJson);

                $scope.cleanActionButtons(saveObj);

                displays.setDisplayPrecision(saveObj);
                displays.verifyPointReferences(saveObj);
                displays.verifyScreenObjects(saveObj);

                saveObj.vid = saveObj._id;
                $scope.blur();
                delete saveObj.version;
                $.post("/displays/later", {
                    display: JSON.stringify(saveObj)
                }).done(function(data) {
                    //console.log(data);
                    //alert(data);
                    // window.location = '/displays/view/' + window.upi;//saveObj.vid;
                    var _title = window.displayJson.Name,
                        pointType = window.displayJson['Point Type'].Value,
                        _id = window.displayJson._id,
                        width = parseInt(window.displayJson.Width, 10) + 400,
                        height = parseInt(window.displayJson.Height, 10) + 100;

                    displays.openWindow('/displays/view/' + window.upi, _title, pointType, '', _id, {
                        width: width,
                        height: height,
                        sameWindow: true,
                        windowId: window.windowId
                    });
                });
            };

            $scope.convertColor = function(color) {
                var ret = '#';
                ret += ('000000' + color.toString(16)).slice(-6);
                return ret;
            };

            $scope.autoZoom = function() {
                zoomToFitWindow();
                return false;
            };

            $scope.resetZoom = function() {
                $('#zoom-slider').val(100).slider("refresh");
                updateZoom();
                return false;
            };

            $scope.hideMenu = function() {
                $('#menu').hide();
            };

            $scope.rightClick = function(obj) {
                $('#paste').hide();
                $scope.action(obj);
                $('#menu').show();
                $('#menu').css('left', (displays.pageX + 30) + 'px');
                $('#menu').css('top', displays.pageY + 'px');
            };

            $scope.getPoint = function() {
                $scope.editItem.upi = displays.selectPoint;
            };

            $scope.trendPoint = function(input) {
                displays.pointName = displays.upiNames[input.upi];
                $scope.editItem.points.push({
                    name: displays.pointName,
                    upi: displays.selectPoint
                });
            };
            $scope.zoomDec = function(input) {
                return input / 100;
            };

            $scope.delBg = function() {
                $scope.display['Background Picture'] = '';
            };

            $scope.delImg = function() {
                $scope.editItem['Animation File'] = '';
            };

            $scope.changeAnimType = function(animType) {
                displays.updateAnimType(animType);
            };

            $scope.ms2rgb = function(input) {
                var bHex = 'black',
                    num = +input,
                    red,
                    green,
                    blue;
                if (num > 0) {
                    blue = Math.round(num / 65536);
                    green = Math.round((num % 65536) / 256);
                    red = Math.round((num % 65536) % 256);
                    bHex = 'rgb(' + red + ',' + green + ',' + blue + ')';
                }
                return bHex;
            };

            $scope.moveItem = function(offLeft, offTop) {
                var el = $('#screen_object_' + $scope.editItem._idx);
                //how much to move the object by
                $scope.editItem.Left = $scope.editItem.oLeft + offLeft;
                $scope.editItem.Top = $scope.editItem.oTop + offTop;
                el.css({
                    left: $scope.editItem.Left,
                    top: $scope.editItem.Top
                });
            };

            $scope.sizeItem = function(event) {
                var el = $('#screen_object_' + $scope.editItem._idx),
                    prevX = displays.sizeStartPos.x,
                    prevY = displays.sizeStartPos.y,
                    x = event.pageX,
                    y = event.pageY,
                    oldWidth,
                    oldHeight,
                    newWidth,
                    newHeight,
                    diffWidth,
                    diffHeight;

                //how much to size the object by
                //widths and heights come across as 0 often
                //to avoid the handles initially showing as 1x1 we set the oWidth and oHeight to the calculated values
                if ($scope.editItem.Width === 0) {
                    $scope.editItem.oWidth = $scope.editItem.Width = parseInt(el.css('width'), 10);
                }
                if ($scope.editItem.Height === 0) {
                    $scope.editItem.oHeight = $scope.editItem.Height = parseInt(el.css('height'), 10);
                }

                oldWidth = $scope.editItem.Width;
                oldHeight = $scope.editItem.Height;

                diffWidth = prevX - x;
                diffHeight = prevY - y;

                if (displays.sizeType.match('w')) {
                    //west needs reposition
                    $scope.editItem.Left -= diffWidth;
                    newWidth = oldWidth + diffWidth;
                } else {
                    newWidth = oldWidth - diffWidth;
                }

                if (displays.sizeType.match('n')) {
                    //north needs reposition
                    $scope.editItem.Top -= diffHeight;
                    newHeight = oldHeight + diffHeight;
                } else {
                    newHeight = oldHeight - diffHeight;
                }

                $scope.editItem.Width = newWidth;
                $scope.editItem.Height = newHeight;

                displays.sizeStartPos = {
                    x: event.pageX,
                    y: event.pageY
                };

                el.css({
                    width: $scope.editItem.Width,
                    height: $scope.editItem.Height,
                    left: $scope.editItem.Left,
                    top: $scope.editItem.Top
                });
            };

            $scope.dragStart = function(obj) {
                $scope.dragItem = obj;
            };

            $scope.sortableOptions = {
                axis: 'y'
            };

            $scope.stage = function(display) {
                displays.stageDisplay = display;
                //$('#confirmStage').panel('show');
                $("#confirmStage").popup("open", {
                    transition: "slidedown"
                });
            };
            $scope.doStage = function() {
                var saveObj = angular.copy(displays.stageDisplay),
                    upi = saveObj.vid;
                // saveObj.vid = saveObj._id;
                delete saveObj.version;
                delete saveObj._id;
                $.post("/displays/later", {
                    display: JSON.stringify(saveObj)
                }).done(function(data) {
                    // if (data.match(/saved/ig)) {
                    // window.location = '/displays/edit/' + upi;
                    var _title = window.displayJson.Name,
                        pointType = window.displayJson['Point Type'].Value,
                        _id = window.displayJson._id,
                        width = parseInt(window.displayJson.Width, 10) + 400,
                        height = parseInt(window.displayJson.Height, 10) + 100;

                    displays.openWindow('/displays/edit/' + upi, _title, pointType, '', _id, {
                        width: width,
                        height: height,
                        sameWindow: true,
                        windowId: window.windowId
                    });
                    // }
                    // console.log(data);
                    // window.location = '/displays/edit/' + displayJson.vid;
                });
            };

            $scope.preview = function(display) { //to comply with workspace
                // displays.openWindow(url, title, type, target, pid, width, height)
                displays.openWindow('/displays/preview/' + display._id, 'Display Preview', '', '', display.Name, {
                    width: 1000
                });
                // window.open('/displays/preview/' + display._id);
            };

            $scope.drop = function() {
                $scope.dragItem.Left = displays.objX;
                $scope.dragItem.Top = displays.objY;
            };

            $scope.menuClick = function() {
                $('#menu').hide();
                if ($scope.clipBoard.length > 0) {
                    $('#paste').show();
                }
                $('#paste').css('left', displays.pageX + 'px');
                $('#paste').css('top', displays.pageY + 'px');
            };

            $scope.deleteObject = function() {
                if ($scope.editItem["Screen Object"] === 3) {
                    delete displays.filesToUpload[$scope.editItem._idx];
                }
                $scope.objs.splice($scope.objs.indexOf($scope.editItem), 1);
                $scope.blur();
                $('#menu').hide();
            };

            $scope.nudgeObject = function(code) {
                //$("#delete").popup("close");
                if (code === 38) {
                    $scope.editItem.Top = $scope.editItem.Top - 1;
                }
                if (code === 40) {
                    $scope.editItem.Top = $scope.editItem.Top + 1;
                }
                if (code === 37) {
                    $scope.editItem.Left = $scope.editItem.Left - 1;
                }
                if (code === 39) {
                    $scope.editItem.Left = $scope.editItem.Left + 1;
                }
            };

            $scope.updateFont = function() {
                $('#fontName').val($('#ftest').val());
                $("#fontName").selectmenu("refresh", true);
                return false;
            };

            $scope.getBGStyle = function(display) {
                var ret = {
                        'width': displayJson.Width,
                        'height': displayJson.Height
                    };

                // if(displays.filesToUpload['background']) {
                //     src = '';
                // } else {
                //     src = filterwmf(display["Background Picture"]);
                // }

                // ret['background-image'] = src;

                return ret;
            };

            $scope.bgSrcURL = filterwmf(displayJson["Background Picture"]);

            $scope.getStyle = function(object) {
                var ret = {
                    "color": filterms2rgb(object["Foreground Color"]),
                    "font-size": filterpts2px(object["Font Size"]),
                    "font-family": filterfonts(object["Font Name"]),
                    "font-weight": filterbold(object["Font Bold"]),
                    "text-decoration": filterunderline(object["Font Underline"]),
                    "font-style": filteritalic(object["Font Italic"]),
                    "left": object.Left + 'px',
                    "top": object.Top + 'px'
                    // "width": filterwh(object.Width),
                    // "height": filterwh(object.Height)
                };

                if(object['Screen Object'] === 1 || object['Screen Object'] === 4) {// button or action button
                    ret.width = filterwh(object.Width, object['Screen Object']);
                    ret.height = filterwh(object.Height, object['Screen Object']);
                }

                return ret;
            };

            zoomToFitWindow();
        });

        displayApp.directive('ngRightClick', function($parse) {
            return function(scope, element, attrs) {
                var fn = $parse(attrs.ngRightClick);
                element.bind('contextmenu', function(event) {
                    scope.$apply(function() {
                        event.preventDefault();
                        //adjust for offset
                        displays.menuLeft = event.offsetX;
                        displays.menuTop = event.offsetY;
                        fn(scope, {
                            $event: event
                        });
                    });
                });
            };
        });

        displayApp.directive('ngDragStartx', function($parse) {
            return function(scope, element, attrs) {
                var fn = $parse(attrs.ngDragStart);
                element.bind('dragstart', function(event) {
                    displays.dragEl = element;
                    event.originalEvent.dataTransfer.setDragImage(element[0], 0, 0);
                    scope.$apply(function() {
                        fn(scope, {
                            $event: event
                        });
                    });
                });
            };
        });

        displayApp.directive('ngDragOver', function($parse) {
            return function(scope, element, attrs) {
                var fn = $parse(attrs.ngDragOver);
                element.bind('dragover', function(event) {
                    event.preventDefault();
                    if (event.dataTransfer) {
                        event.dataTransfer.dropEffect = 'copy';
                    }
                    scope.$apply(function() {
                        //event.preventDefault();
                        fn(scope, {
                            $event: event
                        });
                    });
                    return false;
                });
            };
        });

        displays.initAngularFilters();
    }
});

$(function() {
    $.ajax({
        url: '/api/points/' + window.upi
    }).done(function(response) {
        displays.init(response);
    });
});
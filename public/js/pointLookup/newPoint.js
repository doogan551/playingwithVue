"use strict";
window.newPoint = (function(module, ko, $) {
    var dataAdapters,
        viewModel,
        $splitter,
        $pointTypesListBox,
        $createPointBtn,
        $cancelBtn,
        workspace = window.top.workspaceManager,
        config = workspace.config,
        urlParams = $.getAllQueryStrings(),
        sensorTypes = config.Utility.pointTypes.getEnums('Sensor Types', 'Sensor').filter(function(item) {
            return !item.noninitializable
        }),
        reportTypes = config.Utility.pointTypes.getEnums('Report Types', 'Report').filter(function(item) {
            return !item.noninitializable
        });

    function ViewModel() {
        var self = this;
        this.widgetTheme = 'customArctic';
        this.availablePointTypes = ko.observableArray(module.POINTTYPES);
        this.fullName = ko.observable('');
        this.pointType = ko.observable(module.POINTTYPE);
        this.name1 = ko.observable('');
        this.name2 = ko.observable('');
        this.name3 = ko.observable('');
        this.name4 = ko.observable('');
        this.operationType = ko.observable('New Point');
        this.subTypeList = ko.observableArray();
        this.subType = ko.observable(module.SUBTYPE);
    }

    function updatePointType(pointType) {
        switch (pointType.toLowerCase()) {
            case 'report':
                viewModel.subTypeList(reportTypes);
                break;
            case 'sensor':
                viewModel.subTypeList(sensorTypes);
                break;
            default:
                viewModel.subTypeList([]);
                break;
        }
        viewModel.subType(undefined);
        viewModel.pointType(pointType);
    }

    function bindUI() {
        function getPointTypeIndex(pointTypes, thePointType) {
            var len = pointTypes.length,
                i,
                answer = -1;

            for (i = 0; i < len; i++) {
                if (pointTypes[i].key === thePointType) {
                    answer = i;
                    break;
                }
            }

            return answer;
        }
        var splitterSettings = {
            height: '100%',
            width: '100%',
            panels: [{
                min: 150,
                size: 200
            }, {
                min: 250,
                collapsible: false
            }],
            splitBarSize: 3,
            theme: viewModel.widgetTheme
        };
        dataAdapters = {
            pointType: new $.jqx.dataAdapter({
                localdata: viewModel.availablePointTypes,
                dataType: 'observablearray'
            })
        };

        if (module.ID) {
            var i = 1,
                NAME = module.NAME,
                _NAME = NAME.split('_');
            _NAME.forEach(function(name) {
                viewModel['name' + i++](name);
            });
            viewModel.operationType('Clone');
            viewModel.fullName('Cloning ' + NAME);
        }
        if (!!module.POINTTYPE) {
            splitterSettings.showSplitBar = false;
            splitterSettings.panels = [{
                size: 0
            }, {
                collapsible: false
            }];
        }

        $splitter.jqxSplitter(splitterSettings);

        $pointTypesListBox.jqxListBox({
            source: dataAdapters.pointType,
            selectedIndex: getPointTypeIndex(viewModel.availablePointTypes(), urlParams['selectedPointType']),
            height: '100%',
            width: '100%',
            displayMember: 'key',
            valueMember: 'enum',
            //multiple: true,
            itemHeight: 20,
            //checkboxes: true,
            equalItemsWidth: true,
            theme: viewModel.widgetTheme
        });
        $pointTypesListBox.on('change', function(e) {
            var chosenPointType = e.args.item.label;
            updatePointType(chosenPointType);
        });

        $createPointBtn.on('click', function() {
            var segments = {
                    name1: $.trim(viewModel.name1()),
                    name2: $.trim(viewModel.name2()),
                    name3: $.trim(viewModel.name3()),
                    name4: $.trim(viewModel.name4())
                },
                $firstEnabled = $('#pointNameColumn').find('.toolbar input:enabled:first'),
                pointType,
                endPoint,
                handoffMode,
                params = {},
                hasValue = 0,
                msg = '',
                workspaceManager = window.top.workspaceManager;

            $createPointBtn.attr('disabled', 'disabled');

            pointType = viewModel.pointType();

            if (!pointType) {
                $createPointBtn.removeAttr('disabled');
                return alert('Please choose a point type');
            }

            if (module.ID) params.targetUpi = module.ID;


            if (!segments['name1'].length) {
                $createPointBtn.removeAttr('disabled');
                return alert('Please place a value in segment 1');
            }

            if (!$firstEnabled.val().length) {
                $createPointBtn.removeAttr('disabled');
                alert('Please create a valid point name');
                return $firstEnabled.focus();
            }

            for (var i = 4, last = 1; i; i--) {
                if (hasValue) {
                    if (!segments['name' + i].length) {
                        msg = ['Please place a value in segment ', i, '. Skipping segments is not allowed.'].join('');
                        $createPointBtn.removeAttr('disabled');
                        return alert(msg);
                    }
                } else {
                    if (segments['name' + i].length) {
                        hasValue = i;
                    }
                }
                params['name' + i] = segments['name' + i];
            }

            params.pointType = pointType;
            if (module.hasOwnProperty('SUBTYPE')) {
                switch (pointType.toLowerCase()) {
                    case 'report':
                        viewModel.subTypeList(reportTypes);
                        break;
                    case 'sensor':
                        viewModel.subTypeList(sensorTypes);
                        break;
                    default:
                        viewModel.subTypeList([]);
                        break;
                }
            }
            // JDR also make sure subTypeList length is non-zero (see default switch case above that could cause this)
            if (viewModel.subType() !== undefined && viewModel.subType() !== -1 && viewModel.subTypeList().length) {
                params.subType = {
                    Value: viewModel.subTypeList()[viewModel.subType()].name,
                    eValue: viewModel.subType()
                };
            }
            if (viewModel.operationType() === 'Clone')
                $.blockUI({
                    message: 'Cloning, please wait'
                });
            else
                $.blockUI({
                    message: 'Creating point, please wait'
                });

            $.ajax({
                    url: '/api/points/initpoint',
                    dataType: 'json',
                    type: 'post',
                    data: params
                })
                .done(function(data) {
                    $.unblockUI();
                    if (data.err) {
                        $createPointBtn.removeAttr('disabled');
                        return alert(data.err);
                    }

                    //if we have a save callback
                    if (!!window.attach && typeof window.attach.saveCallback == 'function') {
                        window.attach.saveCallback.call(undefined, data);
                        return dtiUtility.closeWindow();
                        // return dtiUtility.closeWindow();
                    }

                    endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint(params.pointType, data._id);
                    handoffMode = endPoint.edit || endPoint.review;
                    dtiUtility.openWindow({
                        url: handoffMode.url, 
                        title: data.Name, 
                        pointType: params.pointType,
                        upi: data._id
                    });
                    dtiUtility.closeWindow();
                });
        });

        $cancelBtn.on('click', function() {
            dtiUtility.closeWindow();
        });


        ko.applyBindings(viewModel);
    }

    module.init = function(callback) {
        var viewPortHeight = $(window).height(),
            $inputs = $('#pointNameColumn').find('.toolbar input');

        $splitter = $('#splitter');

        if (!window.top) {
            $splitter.hide();
            alert('The Infoscan Point Navigator cannot be opened directly. You will now be redirected to the workspace.');
            window.location.replace('/');
        }

        $createPointBtn = $('.createPointBtn');
        $cancelBtn = $('.cancelBtn');
        $pointTypesListBox = $('#pointTypes');

        viewModel = new ViewModel();

        if (!!window.attach && !!window.attach.point) {
            for (var i = 4, last = 1; i; i--) {
                if (!!window.attach.point['name' + i]) {
                    window.attach.point.hasValue = true;
                    viewModel['name' + i](window.attach.point['name' + i]);
                    if (i != 4) {
                        $inputs.eq(i - 1).prop('disabled', true);
                    }
                } else {
                    if (window.attach.point.hasValue) {
                        alert('The point name is incorrect. Blank name segments are not allowed');
                        dtiUtility.closeWindow();
                    }
                }
            }
        }

        bindUI();

        // This could be a new point or clone point operation
        // new point   - pointType() is false; point type may or may not be specified in urlParams
        // clone point - pointType() already defined
        // If point type isn't already defined and we have a point type from our URL string
        if ((!!viewModel.pointType() === false) && urlParams.selectedPointType) {
            updatePointType(urlParams.selectedPointType);
        }
    };

    ko.bindingHandlers.allowedChars = {
        init: function(element, valueAccessor) {
            var $element = $(element),
                $message = $('.invalidCharMsg'),
                $badChar = $message.find('.invalidChar'),
                offset = $element.offset(),
                height = $element.outerHeight(),
                messageTop = offset.top + height + 3,
                messageLeft = offset.left,
                messageWidth = $element.outerWidth(),
                config = window.top.workspaceManager.config,
                timer;
            $element
                .on("keypress", function (event) {
                    var _char = String.fromCharCode(event.which);
                    if (config.Utility.isPointNameCharacterLegal(_char) == false) {
                        $message.css({
                            opacity: 1,
                            top: messageTop,
                            left: messageLeft,
                            width: messageWidth
                        });
                        $badChar.text(_char);
                        $message.stop().show();
                        workspace.playSound('beep');

                        event.preventDefault();
                        event.stopImmediatePropagation();

                        $element.blur();
                    }
                })
                .on("blur", function () {

                })
                .on("focus", function () {
                    $message.fadeOut(400);
                }
            );
        }
    };

    return module;
})(window.newPoint || {}, ko, jQuery);


$(window.newPoint.init);
var dorsett = dorsett || {};

dorsett.pointSelector = (function () {
    return {
        theme               : 'flat',
        sourceA             : {
            datatype  : "array",
            datafields: [
                { name: '_id', type: 'number' },
                { name: 'fullName', map: 'Name', type: 'string' },
                { name: 'name1', type: 'string' },
                { name: 'name2', type: 'string' },
                { name: 'name3', type: 'string' },
                { name: 'name4', type: 'string' },
                { name: 'type', map: 'Point Type>Value', type: 'string' }
            ]
        },
        openWindow          : window.opener && window.opener.workspaceManager && window.opener.workspaceManager.openWindow,
        callbackRegister    : null,
        render              : function() {
            var viewPortHeight = $(window).height();
            $('#pointType').jqxDropDownList({dropDownHeight: viewPortHeight-100});
            $('#jqxgrid').jqxGrid({ height: viewPortHeight-110 });
            $('#jqxListBox1, #jqxListBox2, #jqxListBox3, #jqxListBox4').jqxListBox({height: viewPortHeight-110});
        },
        init                : function (callback) {
            if (!!callback) this.callbackRegister = callback;
            this.initialSetup();
            dorsett.pointSelector.render();
        },
        checkPointTypeByName: function (pointType) {
            var $pointType = $('#pointType'),
                _item, _itemIndex;
            // search global point type array for point type
            for (var i = 0, arrLength = arr.length; i < arrLength; i++) {
                if (arr[i].key == pointType) {
                    _itemIndex = i;
                    break;
                }
            }
            if (!_itemIndex) {
                $pointType.jqxDropDownList('uncheckAll');
                return;
            }
            _item = $pointType.jqxDropDownList('getItem', _itemIndex);
            $pointType.jqxDropDownList('uncheckAll');
            $pointType.jqxDropDownList('checkItem', _item);
            $pointType.trigger('close');
        },
        initialSetup        : function () {
            var self = this,
                $pointType = $('#pointType'),
                $jqxgrid = $("#jqxgrid"),
                $switchView = $('#switchView'),
                cellRenderer = function(row, column, value, html, props, rowData) {
                    return ['<div><div class="fa fa-chevron-right fa-2x arrow"></div><h4>', rowData.fullName, '</h4>', rowData.type, '</div>'].join('');
                };
            $(".millerList").hide();
            $('.clear').hide();


            $jqxgrid.jqxGrid({
                width          : '100%',
                source         : self.sourceA,
                theme          : self.theme,
                //sortable: true,
                selectionmode: 'none',
                //selectionmode: 'multiplerowsextended',
                //pagermode      : 'simple',
                //pageable       : false,
                //pagesize       : 10,
                rowsheight     : 60,
                //autorowheight  : true,
                //autoheight     : true,
                scrollmode     : 'logical',
                altrows        : false,
                //showstatusbar  : true,
                //columnsheight  : 50,
                showheader      : false,
                renderstatusbar: function (statusbar) {
                    if (selectionmode == 'range') {
                        var statusBarContainer = $("<div style='overflow: hidden; position: relative; margin: 5px;'></div>");
                        var selectRangeButton = $("<div style='float: right; margin-left: 5px;'><span style='margin-left: 4px; position: relative; top: -3px;'>Select Range</span></div>");
                        statusBarContainer.append(selectRangeButton);
                        statusbar.append(statusBarContainer);
                        selectRangeButton.jqxButton({ theme: self.theme, width: 120, height: 20 });
                        selectRangeButton.click(function (event) {
                            self.dataworks(false, function (filter) {
                                self.getPointTypes(function (pointTypes) {
                                    filter.pointType = pointTypes;
                                    self.callbackRegister(filter);
                                });
                            });
                            window.close();
                        });

                    }
                    else {
                        var container = $("<ul></ul>");
                        $("#jqxMenu").append(container);

                        if (actionAllowed.indexOf("addAction") > -1) {
                            var addButton = $("<li><a id='addPoint' href='javascript:;'>Add Point</a></li>");
                            container.append(addButton);
                            $("#addPoint").bind("click", function () {
                                var rec = self.getRecordNameInList();
                                self.addPointAction(rec);
                            });

                        }
                        if (actionAllowed.indexOf("deleteAction") > -1) {
                            var deleteButton = $("<li><a id='deletePoint' href='javascript:;'>Delete Point</a></li>");
                            container.append(deleteButton);
                            $("#deletePoint").bind("click", function () {
                                self.deletePointAction();
                            });

                        }

                    }

                },
                columns        : [
                    { text: 'Name 1', datafield: 'name1', cellsrenderer: cellRenderer }
//                    { text: 'Name 1', datafield: 'name1' },
//                    { text: 'Name 2', datafield: 'name2' },
//                    { text: 'Name 3', datafield: 'name3' },
//                    { text: 'Name 4', datafield: 'name4' }
                ]
            });

            $('#removeFilter').click(function () {
                $jqxgrid.jqxGrid('clear');
                $('#jqxListBox1').jqxListBox('clear');
                $('#jqxListBox2').jqxListBox('clear');
                $('#jqxListBox3').jqxListBox('clear');
                $('#jqxListBox4').jqxListBox('clear');
                $("#input2").val('');
                $("#input3").val('');
                $("#input4").val('');
                //$('#switchView').jqxSwitchButton('check');
                $pointType.jqxDropDownList('uncheckAll');
                $("#input1").focus().val('');
                self.dataworks(true);

            });

            $('#jqxListBox1').on('select', function (event) {
                $("#input1").val(event.args.item.value)
                    .next('.input-group-addon').find('.clear').show();
                $('#searchgroup2,#searchgroup3,#searchgroup4').hide();
                $('#jqxListBox2,#jqxListBox3,#jqxListBox4').hide();

                self.listboxSelect(event.args.item.originalItem, function () {
                    $('#jqxListBox2').jqxListBox('clear');
                    $('#jqxListBox3').jqxListBox('clear');
                    $('#jqxListBox4').jqxListBox('clear');
                    $("#input2").val('');
                    $("#clear2").hide();
                    $("#searchgroup2").show();
                    $('#jqxListBox2').show();
                    $("#input3").val('');
                    $("#input4").val('');

                    var q = {};
                    q.name1 = event.args.item.value;
                    q.name1SearchType = "begin";

                    self.getDataWhenClicked(q, function (data) {
                        self.setupListBox(2, data);
                    });
                });


            });

            $('#jqxListBox2').on('select', function (event) {
                $("#input2").val(event.args.item.value)
                    .next('.input-group-addon').find('.clear').show();
                $('#searchgroup3,#searchgroup4').hide();
                $('#jqxListBox3,#jqxListBox4').hide();

                self.listboxSelect(event.args.item.originalItem, function () {
                    $('#jqxListBox3').jqxListBox('clear');
                    $('#jqxListBox4').jqxListBox('clear');
                    $("#searchgroup3").show();
                    $('#jqxListBox3').show();
                    $("#clear3").hide();
                    $("#input3").val('');
                    $("#input4").val('');
                    self.dataworks(false, function (q) {
                        self.getDataWhenClicked(q, function (data) {
                            self.setupListBox(3, data);
                        });
                    });
                });
            });

            $('#jqxListBox3').on('select', function (event) {
                $("#input3").val(event.args.item.value)
                    .next('.input-group-addon').find('.clear').show();
                $('#searchgroup4').hide();
                $('#jqxListBox4').hide();
                self.listboxSelect(event.args.item.originalItem, function () {
                    $('#jqxListBox4').jqxListBox('clear');
                    $("#searchgroup4").show();
                    $('#jqxListBox4').show();
                    $("#input4").val('');
                    $("#clear4").hide();
                    self.dataworks(false, function (q) {
                        self.getDataWhenClicked(q, function (data) {
                            self.setupListBox(4, data);
                        });
                    });
                });
            });

            $('#jqxListBox4').on('select', function (event) {
                $("#input4").val(event.args.item.value)
                    .next('.input-group-addon').find('.clear').show();
                self.listboxSelect(event.args.item.originalItem);
            });

            var contextMenu = $("#jqxMenu").jqxMenu({ width: '120px', height: '140px', easing: 'easeOutCubic', autoOpenPopup: false, autoCloseOnClick: false, mode: 'popup', theme: self.theme });

            $("#jqxListBox1,#jqxListBox2,#jqxListBox3,#jqxListBox4").on('mousedown', function (event) {
                var rightClick = self.isRightClick(event);
                if (rightClick && actionAllowed.length > 0) {
                    var scrollTop = $(window).scrollTop();
                    var scrollLeft = $(window).scrollLeft();
                    contextMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
                    return false;
                }
            });


            // disable the default browser's context menu.
            $(document).on('contextmenu', function (e) {
                return false;
            });
            $(document).on('click', function (e) {
                $("#jqxMenu").jqxMenu('close');
                return true;
            });

            //Added for clear button to work properly for Browse mode.
            $(".clear").click(function(){
                event.preventDefault();
                $(this).hide();
                var isgridDisplay = $('#switchView').jqxButtonGroup('getSelection') == 0;
                var numbered = parseInt(this.id.substr(this.id.length - 1));
                var browser = {
                        column1: {
                            $input: $('#input1'),
                            $listBox: $('#jqxListBox1')
                        },
                        column2: {
                            $searchGroup: $('#searchgroup2'),
                            $input: $('#input2'),
                            $listBox: $('#jqxListBox2')
                        },
                        column3: {
                            $searchGroup: $('#searchgroup3'),
                            $input: $('#input3'),
                            $listBox: $('#jqxListBox3')
                        },
                        column4: {
                            $searchGroup: $('#searchgroup4'),
                            $input: $('#input4'),
                            $listBox: $('#jqxListBox4')
                        }
                    },
                    i = numbered + 1,
                    column = {};

                while (i < 5){
                    column = browser['column' + i];
                    column.$input.val('');
                    !isgridDisplay && column.$searchGroup.hide();
                    column.$listBox.hide()
                        .jqxListBox('clearSelection');
                    i++;
                }
                column = browser['column' + numbered]
                column.$input.focus();
                column.$input.val('');
                column.$listBox.jqxListBox('clearSelection');

                if (isgridDisplay){
                    self.dataworks(true);
                    return;
                }
                self.dataworks(false, function (q) {
                    //q.option = 'type';
                    self.getDataWhenClicked(q, function (data) {
                        console.log(data);
                        self.setupListBox(numbered, data);
                    });
                });
            });

            $('#input1,#input2,#input3,#input4').on(
                {
                    keydown: function(event) {
                        var code = event.keyCode || event.which,
                            numbered = this.id.substr(this.id.length - 1),
                            isgridDisplay = $('#switchView').jqxButtonGroup('getSelection') == 0;
                        if (code != 9 && code != 13) return;
                        self.dataworks(isgridDisplay, function (q) {
                            if (isgridDisplay) return;
                            q.option = 'type';
                            self.getDataWhenTyped(q, function (data) {
                                self.setupListBox(numbered, data);
                            });
                        });
                    },
                    keyup: function () {
                        var numbered = this.id.substr(this.id.length - 1),
                            $input = $(this),
                            $clearBtn = $input.next('.input-group-addon').find('.clear');
                        if ($.trim($input.val()) == '') {
                            $clearBtn.hide();
                        } else {
                            $clearBtn.show();
                        }
                        dorsett.delay(function () {
                            //var isgridDisplay = $('#switchView').jqxSwitchButton('checked');
                            var isgridDisplay = $('#switchView').jqxButtonGroup('getSelection') == 0;
                            self.dataworks(isgridDisplay, function (q) {
                                if (isgridDisplay) return;
                                if ($.trim($input.val()) == '') {
                                    self.getDataWhenClicked(q, function (data) {
                                        self.setupListBox(numbered, data);
                                    });
                                } else {
                                    q.option = 'type';
                                    self.getDataWhenTyped(q, function (data) {
                                        self.setupListBox(numbered, data);
                                    });
                                }
                            });
                        }, 300);
                    }
                }
            );
            arr.unshift({enum: -1, key: '(Select All)'});
            $pointType.jqxDropDownList(
                {
                    //scrollBarSize       : 4,
                    source              : arr,
                    displayMember       : 'key',
                    valueMember         : 'enum',
                    //width               : '98%',
                    height              : 27,
                    checkboxes          : true,
                    theme               : self.theme,
                    dropDownHeight      : 500,
                    selectionRenderer   : function () {
                        return "Filter by Point Type:";
                    }
                });


            //$pointType.jqxDropDownList('checkAll');

            $pointType.on('close', function (event) {
                //var isgridDisplay = $('#switchView').jqxSwitchButton('checked');
                var isgridDisplay = $switchView.jqxButtonGroup('getSelection') == 0;
                if (!isgridDisplay) {
                    $('#input1').val('');
                    for (var i = 2; i < 5; i++) {
                        $('#jqxListBox' + i)
                            .hide()
                            .jqxListBox('clear');
                        $('#searchgroup' + i).hide();
                        $('#input' + i).val('');
                    }
                }
                self.dataworks(isgridDisplay);
            });

            var handleCheckChange = true;
            $pointType.on('checkChange', function (event) {
                if (!handleCheckChange)
                    return;
                if (event.args.label != '(Select All)') {
                    handleCheckChange = false;
                    $pointType.jqxDropDownList('checkIndex', 0);
                    var checkedItems = $pointType.jqxDropDownList('getCheckedItems');
                    var items = $pointType.jqxDropDownList('getItems');
                    if (checkedItems.length == 1) {
                        $pointType.jqxDropDownList('uncheckIndex', 0);
                    }
                    else if (items.length != checkedItems.length) {
                        $pointType.jqxDropDownList('indeterminateIndex', 0);
                    }
                    handleCheckChange = true;
                }
                else {
                    handleCheckChange = false;
                    if (event.args.checked) {
                        $pointType.jqxDropDownList('checkAll');
                    }
                    else {
                        $pointType.jqxDropDownList('uncheckAll');
                    }
                    handleCheckChange = true;
                }
            });

            //$('#switchView').jqxSwitchButton({ onLabel:'List', offLabel:'Browser', /*thumbSize:'10%',*/ width: 100, height: 30, theme: self.theme, checked: true });
            $switchView.jqxButtonGroup({ theme: self.theme, mode: 'radio' });
            $switchView.jqxButtonGroup('setSelection', 0);

//            $('.jqx-switchbutton').on('checked', function (event) {
//                self.dataworks(true);
//                $("#jqxgrid").show();
//                $(".millerList").hide();
//                $("#searchgroup2,#searchgroup3,#searchgroup4").show();
//
//            });
//
//            $('.jqx-switchbutton').on('unchecked', function (event) {
//                //dataworks(false);
//                $(".millerList").show();
//                $("#jqxgrid").hide();
//
//                $('#searchgroup2,#searchgroup3,#searchgroup4').hide();
//                $('#jqxListBox2,#jqxListBox3,#jqxListBox4').hide();
//
//                self.dataworks(false,function(q){
//                    if(Object.keys(q).length === 0) {
//                        self.getDataWhenClicked(q,function(data){
//                            self.setupListBox(1,data);
//                        });
//                    }
//                    else{
//                        q = {};
//                        q.name1 = $("#input1").val();
//                        q.name1SearchType = "begin";
//                        q.option = 'type';
//                        self.getDataWhenTyped(q, function(data){
//                            self.setupListBox(1,data);
//                        });
//                    }
//                });
//
//            });
            $switchView.on('buttonclick', function () {
                var selection = $switchView.jqxButtonGroup('getSelection');
                $('.clear').each(function() {
                    var $this = $(this),
                        $input = $this.closest('.input-group').find('input.form-control');
                    if ($.trim($input.val()) == '') {
                        $this.hide();
                    }
                });
                if (selection === 0) { //List
                    self.dataworks(true);
                    $jqxgrid.show();
                    $(".millerList").hide();
                    $("#searchgroup2,#searchgroup3,#searchgroup4").show();
                } else {
                    //dataworks(false);
                    $(".millerList").show();
                    $jqxgrid.hide();
                    $('#searchgroup1,#searchgroup2,#searchgroup3,#searchgroup4').hide();
                    $('#jqxListBox1,#jqxListBox2,#jqxListBox3,#jqxListBox4').hide();
                    self.dataworks(false, function (q) {
                        if (Object.keys(q).length === 0) {
                            self.getDataWhenClicked(q, function (data) {
                                self.setupListBox(1, data);
                            });
                        } else {
                            q = {};
                            q.name1 = $("#input1").val();
                            q.name1SearchType = "begin";
                            q.option = 'type';
                            self.getDataWhenTyped(q, function (data) {
                                self.setupListBox(1, data);
                            });
                        }
                    });
                }
            });

            $jqxgrid.on('rowclick', function (event) {
                //$jqxgrid.jqxGrid('selectrow', event.args.rowindex);
                var dataRecord = $jqxgrid.jqxGrid('getrowdata', event.args.rowindex);
                if (event.args.rightclick) {
                    var scrollTop = $(window).scrollTop();
                    var scrollLeft = $(window).scrollLeft();
                    if (actionAllowed.length > 0) {
                        //contextMenu.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
                    }
                    return false;
                }
                if (self.callbackRegister) {
                    if (self.callbackRegister.name == "setFilter") {
                        return;
                    } else {
                        self.callbackRegister(dataRecord._id, dataRecord.fullName);
                    }
                    window.close();
                }
                else {
                    self.openAction(dataRecord._id, function (data) {
                        var wintab = '',
                            _pointData = '',
                            _target = (data.tabOpen ? 'mainWindow' : ''),
                            _width, _height;
                        if (self.openWindow) {
                            //url, title, type, target, width, height
                            //check for width and height on point...
                            _pointData = $.parseJSON(data.point);
                            _width = _pointData.Width || 800;
                            _height = _pointData.Height || 600;
                            self.openWindow(data.url, dataRecord.fullName, dataRecord.type, _target, dataRecord._id, _width, _height);
                        } else {
                            wintab = window.open(data.url, _target, 'width=482,height=600');
                            wintab.focus();
                        }
                    });
                }

            });

//            $(".clear").click(function (event) {
//                event.preventDefault();
//                $(this).parent().parent().find('input').focus().val('');
////                $('.jqx-switchbutton').jqxSwitchButton({ checked: true });
////                $('#switchView').jqxButtonGroup('setSelection', 0);
//                self.dataworks(true);
//            });

            if (pt.length > 0) {
                self.sourceA.localdata = pt;
                $jqxgrid.jqxGrid('refreshdata');
                $jqxgrid.jqxGrid('scrolloffset', 0, 0);
                $jqxgrid.jqxGrid('render');
                $("#input1").val(pt[0].name1);
                $("#input2").val(pt[0].name2);
                $("#input3").val(pt[0].name3);
                $("#input4").val(pt[0].name4);

            }
            else {
                self.dataworks(true);
            }

            if (selectionmode == 'range') {
                //$('.jqx-switchbutton').jqxSwitchButton('disable');
                $switchView.jqxButtonGroup('disable');
            }
        },
        getRecordNameInList : function () {
            var rowindex = $('#jqxgrid').jqxGrid('getselectedrowindex');
            var dataRecord = $("#jqxgrid").jqxGrid('getrowdata', rowindex);
            //var nam = $.grep([dataRecord.name1, dataRecord.name2, dataRecord.name3, dataRecord.name4], function(n){ return (typeof n != 'undefined' && n != '')}).join('_');
            return { "Name": dataRecord.fullName, "record": dataRecord, "dpPoint": '', "dp": 0};
        },
        openAction          : function (val, callback) {
            var pointUrl = '/pointreview';
            console.log(val);
            $.ajax({
                url    : pointUrl, async: false,
                type   : 'post', data: {'id': val},
                success: function (data, status) {
                    console.log(data);
                    callback(data);
                }
            });

        },
        listboxSelect       : function (val, callback) {
            var self = this;
            if (!!val['Point Type']) {
                if (this.callbackRegister) {
                    this.callbackRegister(val._id, val.Name);
                    window.close();
                }
                else {
                    self.openAction(val._id, function (data) {
                        var wintab = '',
                            _pointData = '',
                            _target = (data.tabOpen ? 'mainWindow' : ''),
                            _width, _height;
                        if (self.openWindow) {
                            //url, title, type, target, width, height
                            //check for width and height on point...
                            _pointData = $.parseJSON(data.point);
                            _width = _pointData.Width || 482;
                            _height = _pointData.Height || 600;
                            self.openWindow(data.url, val.Name, val['Point Type'].Value, _target, val._id, _width, _height);
                        } else {
                            wintab = window.open(data.url, _target, 'width=482,height=600');
                            wintab.focus();
                        }
                    });
                }
//                if(self != top)
//                    window.parent.setPoint(val);

            }
            else {
                callback();
            }
        },
        dataworks : function (isgridDisplay, callback) {
            var q = {},
                $input1 = $("#input1"),
                $input2 = $("#input2"),
                $input3 = $("#input3"),
                $input4 = $("#input4");
            if ($input1.val() !== "") {
                q.name1 = $input1.val();
                q.name1SearchType = "begin";
            }
            if ($input2.val() !== "") {
                q.name2 = $input2.val();
                q.name2SearchType = "begin";
            }
            if ($input3.val() !== "") {
                q.name3 = $input3.val();
                q.name3SearchType = "begin";
            }
            if ($input4.val() !== "") {
                q.name4 = $input4.val();
                q.name4SearchType = "begin";
            }
            if (selectionmode == 'range' && callback)
                callback(q);
            isgridDisplay ? this.getDataForListMode(q) : this.getDataForBrowseMode(q, callback);
        },
        getDataWhenTyped    : function (query, callback) {
            console.log('typed');
            this.getPointTypes(function (pointTypes) {
                query.pointType = pointTypes;
                query.option = 'type';
                $.ajax({url: '/api/points/segmentoptions', dataType: 'json', type: 'post', data: query, async: true, success: function (data) {
                    callback(data.data);
                }});
            });
        },
        getDataWhenClicked  : function (query, callback) {
            console.log('clicked');
            this.getPointTypes(function (pointTypes) {
                query.option = 'click';
                query.pointType = pointTypes;
                $.ajax({url: '/api/points/segmentoptions', dataType: 'json', data: query, async: true, type: "post", success: function (data) {
                    callback(data.data);
                }});
            });
        },
        getPointTypes       : function (callback) {
            var pointTypes = $("#pointType").jqxDropDownList('getCheckedItems');
            if (pointTypes === undefined) return;
            if (pointTypes.length === 0) {
                pointTypes = $("#pointType").jqxDropDownList('getItems');
            }
            var items = [];
            for (var i = 0; i < pointTypes.length; i++) {
                if (pointTypes[i].label != "(Select All)") items.push(pointTypes[i].label);
            }
            callback(items);
        },
        getDataForBrowseMode: function (query, callback) {
            var self = this;
            if (callback)
                return callback(query);

            self.getPointTypes(function (pointTypes) {
                query.option = 'click';
                query.pointType = pointTypes;
                $.ajax({url: '/api/points/segmentoptions', dataType: 'json', data: query, async: true, type: "post", success: function (data) {
                    self.setupListBox(1, data.data);
                    $("#input2").val('');
                    $("#input3").val('');
                    $("#input4").val('');
                }});
            });
        },
        getDataForListMode  : function (query) {
            var self = this;

            self.getPointTypes(function (pointTypes) {
                query.pointType = pointTypes;
                $.ajax({ url: '/api/points/search', dataType: 'json', type: "post", data: query,
                    async   : true, success: function (data) {
                        if (data.points.length == 1 && data.points[0]['Point Type'].Value == '') {
                            self.sourceA.localdata = [];
                        } else {
                            self.sourceA.localdata = data.points;
                        }
                        $("#jqxgrid").jqxGrid('updatebounddata');
                        $('#jqxgrid').jqxGrid('scrolloffset', 0, 0);
                    }});
            });
        },
        renderListboxItem   : function (dr) {
            if (dr == undefined) return;
            var nm = dr.name1;
            if (dr.name2) nm = dr.name2;
            if (dr.name3) nm = dr.name3;
            if (dr.name4) nm = dr.name4;

            if (dr['Point Type'] && dr['Point Type'].Value) {
                return '<img width="16px" height="16px" alt="' + nm + '" src="/img/pointtypes/' + dr['Point Type'].Value + '.png" />&nbsp;&nbsp;' + nm;
            } else {
                return '<i class="fa fa-folder"></i>&nbsp;&nbsp;' + nm;
            }
        },
        setupListBox        : function (idx, data) {
            var self = this,
                $listBox = $('#jqxListBox' + idx);
            console.log(data);
            self.sourceA.localdata = data;
            $listBox.jqxListBox({
                source: data,
                width                                         : '99%', theme: self.theme, displayMember: '_id',
                valueMember                                   : 'name' + idx,
                renderer                                      : function (index, label, value) {
                    var datarecord = data[index];
                    return self.renderListboxItem(datarecord);
                }
            });
            $listBox.jqxListBox('refresh');
            $listBox.show();
        },
        isRightClick        : function (event) {
            var rightclick;
            if (!event) var event = window.event;
            if (event.which) rightclick = (event.which == 3);
            else if (event.button) rightclick = (event.button == 2);
            return rightclick;
        },
        addPointAction      : function (rec) {
            //if($('#addForm').is(':empty'))
//            $.ajax({url:'/api/points/pointTypes/addpointwizard1', type:'post', data:{name:nam},
//                    success:function(h){
//                        $("#addForm").html(h);
//            }});
            $('#addForm').load('/api/points/pointTypes/addpointwizard1', rec);
            $('#modal-addPoint').modal('show');
        },
        deletePointAction   : function () {
            var selectedrowindex = $("#jqxgrid").jqxGrid('getselectedrowindex');
            if (selectedrowindex == -1) {
                alert("Please select a row to delete");
                return;
            }
            //var rowscount = $("#jqxgrid").jqxGrid('getdatainformation').rowscount;
            var id = $("#jqxgrid").jqxGrid('getrowid', selectedrowindex);
            $("#jqxgrid").jqxGrid('deleterow', id);
        }
    }
})();


dorsett.delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();


$(document).ready(function () {
    if (window.opener == null || nav == 1)  dorsett.pointSelector.init();
});

$(window).on('resize', dorsett.pointSelector.render);

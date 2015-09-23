/**
 * Created by Soven on 6/26/2014.
 */
"use strict";

var dorsett = dorsett || {};


dorsett.reportUI = (function(workspace, spinner, point){
    return {
        props:[],
        ///////////////////////
        //Point Filter Iframe
        pointFilter : (point["Report Config"] && point["Report Config"].pointFilter) || { name1: '', name2: '',  name3: '', name4: '', pointTypes: [] },
        /////////////////////////////
        columnGrid: {},
        filterGrid: {},
        unTabbed:null,
        isNew: (point._pStatus === 1),
        reportId: point._id,
        //showTemplatesDropDown: (point.Templates !== undefined),

        //function is responsible for hiding blockUI element
        hideDivBlockOnly: function () {
            spinner.stop();
            $.unblockUI();
        },

        //This function is responsible for hiding blockUI element and showing error message if error message is passed.
        hideDivBlock: function (err, msg) {
            this.hideDivBlockOnly();
            if (err.length > 0){
                if (!msg)
                    this.blockFunction("<div class='alert alert-danger'>" + "Error Occurred! If error persists, please contact System Administrator!!" + "</div>");
                else
                    this.blockFunction("<h4 class='alert alert-danger'>" + msg + "</h4>");
                //this.blockFunction(msg);

                this.aspNetErrorOccured = true;
                setTimeout($.unblockUI, 3000);
                $("#tabs  li:eq(1)").hide().removeClass("active");
                $("#tabs  li:eq(2)").hide().removeClass("active");
                $("#tabs  li:eq(0)").show().addClass("active");

                $("#tabConfiguration").addClass("active");
                $("#tabPreview").removeClass("active");
                $("#tabDesign").removeClass("active");
            }
            else{
                if (!this.isNew)
                    $("#tabs  li:eq(2)").show();
            }
        },

        //Css used for blocking (in progress)
        blockCss:{
                border: 'none',
                padding: '5px',
                backgroundColor: '#666',
                '-webkit-border-radius': '10px',
                '-moz-border-radius': '10px',
                opacity: .8,
                color: '#ccc',
                cursor:'default',
                top:'25%'
        },

        //blocking function for showing in progress / busy
        blockFunction: function (message) {

            $.blockUI({
                message: message,
                css: this.blockCss
            });
        },

        //Spinner image used in showing in progress / busy
        busyImage: "<img src='/img/busy.gif' alt='Busy...' />",

        //Init function to setup grids and dropdowns
        init: function () {
            var self = this;

            var enumProps = workspace.config.Enums.Properties;
            for (var p in enumProps) {
                if (enumProps[p].reportEnable) {
                    self.props.push({name: p, value: enumProps[p]});
                }
            }
            $("#tabs  li:eq(1)").hide();
            $("#tabs  li:eq(2)").hide();

            if (point) {
                $("#reportTitle").val(title);
            }

            if (point._pStatus) {
                $(".container").css({"background-color": "#c44e4e"});
            }

            $("#panelbar").kendoPanelBar({expandMode: "multiple"});

            $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
                    switch (e.target.hash) {
                        case "#tabPreview":
                            self.reportPreview();
                            break;
                        case "#tabDesign":
                            self.reportDesign();
                            break;

                    }
            });

            $(document).on('dblclick', 'a[data-toggle="tab"]', function (e) {
                switch (e.target.hash) {
                    case "#tabDesign":
                        self.tabDoubleClick("designer");
                        break;
                    case "#tabPreview":
                        self.tabDoubleClick("preview");
                        break;
                }

            });

            $('.container').dblclick(function () {
                self.columnGrid.clearSelection();
                self.filterGrid.clearSelection();
            });



            var addExtraStylingToGrid = function () {
                $(".ob-icon-only", "#columnGrid").parent().css("min-width", 0);

                $(".k-grid-content > table > tbody > tr").hover(
                    function () {
                        $(this).toggleClass("k-state-hover");
                    }
                );

            };

            var addExtraStylingTofilterGrid = function (e) {
                //console.log(e);
                //this._data[0].condition = "";
                $(".ob-icon-only", "#filterGrid").parent().css("min-width", 0);

                $(".k-grid-content > table > tbody > tr").hover(
                    function () {
                        $(this).toggleClass("k-state-hover");
                    }
                );

            };

            var editTemplate = kendo.template($("#edit-template").html());
            self.columnGrid = $("#columnGrid").kendoGrid({
                dataSource: self.fillGrid,
                editable: true,
                selectable: true,
                edit: function (e) {
                    var input = e.container.find("input");
                    setTimeout(function () {
                        input.select();
                    }, 25);
                },
                dataBound: addExtraStylingToGrid,
                columns: [
                    {
                        field: "name", template: "#=data.name#",
                        editor: function (container, options) {
                            var input = $("<input />");
                            input.attr("name", options.field);
                            input.appendTo(container);
                            input.kendoComboBox({
                                dataSource: self.props,
                                dataTextField: "name",
                                dataValueField: "value",
                                filter: "contains",
                                highlightFirst: false,
                                placeHolder: "Select Name",
                                select: self.onColumnNamePropertySelect,
                                change: function () {
                                    var obj = this;
                                    var g = window.dorsett.reportUI.columnGrid;
                                    var gridItem = g.dataItem(g.select());
                                    self.ensureComboBoxValue(obj, "name", function(index){
                                        if (index === -1) {
                                            gridItem.name = '[Column Not Set]';
                                        }
                                        else
                                        {
                                            //obj.select(obj.ul.children().eq(index));
                                            gridItem.name = obj.dataSource._data[index].name;
                                            gridItem.valueType = obj.dataSource._data[index].value.valueType;
                                            g.refresh();
                                        }

                                    });
                                }
                            });
                        },
                        title: "Column Name"
                    },
                    {
                        command: [{
                        name: "Add", text: "", click: self.addColumnRow,
                        class: "ob-icon-only",
                        imageClass: "k-icon k-si-plus ob-icon-only"
                    },
                        {
                            name: "destroy1", text: "", click: self.removeColumnRow,
                            class: "ob-icon-only",
                            imageClass: "k-icon k-si-minus ob-icon-only"
                        }], title: " "
                    }
                ]
            }).data("kendoGrid");

            self.columnGrid.table.kendoSortable({
                filter: ">tbody >tr",
                //hint: $.noop,
                cursor: "move",
                hint: function (element) {
                    return element.clone().addClass("hint");
                },
                placeholder: function (element) {
                    return element.clone().addClass("k-state-hover").css("opacity", 0.65);
                },
                container: "#columnGrid tbody",
                change: function (e) {

                    //console.log(viewModel.dataSource);
                    var dataItem = self.columnGrid.dataSource.getByUid(e.item.data("uid"));
                    self.columnGrid.dataSource.remove(dataItem);
                    self.columnGrid.dataSource.insert(e.newIndex, dataItem);
                }
            });

            //FILTER
            this.filterGrid = $("#filterGrid").kendoGrid({
                dataSource: self.fillfilterGrid,
                editable: true,
                selectable: true,
                edit: function (e) {
                    var input = e.container.find("input");
                    setTimeout(function () {
                        input.select();
                    }, 25);
                },
                dataBound: addExtraStylingTofilterGrid,
                columns: [
                    {
                        field: "condition", width: "40px",
                        template: kendo.template($("#conditionTemplate").html()),
                        editor: function (container, options) {
                            if (options.model.firstRow) {
                                return;
                            }
                            var input = $('<input data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"/>');
                            input.attr("condition", options.field);
                            input.appendTo(container);
                            input.kendoDropDownList({
                                dataSource: [{text: "AND", value: "AND"}, {text: "OR", value: "OR"}],
                                dataTextField: "text",
                                dataValueField: "value"
                            });
                        },
                        title: "Condition"
                    },
                    {
                        field: "name", width: "180px",
                        editor: function (container, options) {
                            var input = $("<input id='selecteditem' />");
                            input.attr("name", options.field);
                            input.appendTo(container);
                            input.kendoComboBox({
                                dataSource: self.props,
                                dataTextField: "name",
                                dataValueField: "value",
                                filter: "contains",
                                placeHolder: "Select Name",
                                select: self.onFilterNamePropertySelect,
                                change: function () {
                                    var obj = this;
                                    var g = window.dorsett.reportUI.filterGrid;
                                    var gridItem = g.dataItem(g.select());
                                    self.ensureComboBoxValue(obj, "name", function(index){
                                        if (index === -1) {
                                            gridItem.name = '[Filter Column Not Set]';
                                        }
                                        else
                                        {
                                           // console.log(gridItem, obj.dataSource._data[index]);
                                            gridItem.name = obj.dataSource._data[index].name;
                                            gridItem.valueType = obj.dataSource._data[index].value.valueType;
                                            gridItem.value = "";
                                            gridItem.internalValue = "";
                                            g.refresh();
                                        }

                                    });

                                }

                            });
                        },
                        title: "Column Name"
                    },
                    {
                        field: "operator", width: "100px",
                        editor: self.operatorTemplate,
                        template: self.displayOperator,
                        title: "Operator"
                    }, {
                        field: "value", width: "245px", template: kendo.template($("#valueViewTemplate").html()),
                        editor: self.valueTemplate
                    },
                    {
                        width: "70px", command: [{
                        name: "Add", text: "", click: self.addFilterRow,
                        class: "ob-icon-only",
                        imageClass: "k-icon k-si-plus ob-icon-only"
                    },
                        {
                            name: "destroy1", text: "", click: self.removeFilterRow,
                            class: "ob-icon-only",
                            imageClass: "k-icon k-si-minus ob-icon-only"
                        }], title: " "
                    }
                ]
            }).data("kendoGrid");


            self.filterGrid.table.kendoSortable({
                //filter: ">tbody >tr:not(:first)",
                filter: ">tbody >tr",
                //disabled: ">tbody >tr:first",
                //hint: $.noop,
                cursor: "move",
                hint: function (element) {
                    return element.clone().addClass("hint");
                },
                placeholder: function (element) {
                    return element.clone().addClass("k-state-hover").css("opacity", 0.65);
                },
                container: "#filterGrid tbody",
                end: function (e) {
                    //console.log(e.item.data("uid"));
                    //var dataItem = self.filterGrid.dataSource.getByUid(e.item.data("uid"));
                    //console.log(dataItem);
                    if (e.newIndex === 0 || e.oldIndex === 0) {
                        e.preventDefault();
                    }
                }
            });

            self.renderTemplateDropDown();

            //self.showTemplatesDropDown ? self.renderTemplateDropDown() : $(".templateSelect").hide();

            $("#getData").kendoButton({ spriteCssClass: "k-icon k-i-refresh",
                click: function (e) {
                    $("#gridData").html(JSON.stringify(self.filterGrid.dataSource.view()));
                    $("#gridData2").html(JSON.stringify(self.columnGrid.dataSource.view()));
                }
            });

            $("#scheduleReport").kendoButton({
                spriteCssClass: "k-icon k-i-calendar",
                click: function (e) {
                    self.getReportOption(false, function () {
                        //$("#reportType").val("Ad-hoc");
                        $('#modal-scheduleReport').modal('show');
                    });
                }
            });

            $("#saveReport").kendoButton({ spriteCssClass: "k-icon k-i-funnel",
                click: function (e) {
                    self.getReportOption(false, function (jj) {
                        point["Report Config"] = jj;
                        var fg = self.filterGrid.dataSource.view();
                        var cg = self.columnGrid.dataSource.view();

                        point["Filter Data"] = [];
                        point["Column Data"] = [];
                        point["Point Refs"] = [];

                        for (var c in cg) {
                            point["Column Data"].push({
                                name: cg[c].name,
                                precision: cg[c].precision,
                                valueType: cg[c].valueType
                            });
                        }
                        for (var f in fg) {
                            point["Filter Data"].push({
                                condition: fg[f].condition,
                                firstRow: fg[f].firstRow,
                                internalValue: fg[f].internalValue,
                                filterName: fg[f].name,
                                operator: fg[f].operator,
                                value: fg[f].value,
                                valueType: fg[f].valueType,
                                index:f
                            });
                            //console.log(workspace.config.Enums.Properties[fg[f].name], fg[f].name);
                            var pp = workspace.config.Enums.Properties[fg[f].name];
                            if (pp && pp.valueType === "UniquePID") {
                                point["Point Refs"].push({
                                   "PropertyName" : fg[f].name,
                                    "Value" : fg[f].internalValue,
                                    "PointName" : fg[f].value,
                                    "AppIndex" : f
                                });
                            }
                        }
                        console.log(point);
                        $.ajax({
                            url: '/api/points/addPoint',
                            data: point,
                            type: 'POST',
                            success: function (d) {
                                iToast.showNotification('Notification', "Report has been added successfully!!", {
                                    icon: 'save',
                                    theme: 'jetblack',
                                    position: 'top right'
                                });
                                $(".container").css({"background-color": "#6b9355"});
                                if($("#tabs  li:eq(1)").is(":visible"))
                                    $("#tabs  li:eq(2)").show();

                            }

                        });
                    });

                }
            });

            $("#runReport").kendoButton({
                spriteCssClass: "k-icon k-i-plus",
                click: function (e) {
                    self.reportPreview();
                }

            });

            if (point["Filter Data"]) {
                var fg = point["Filter Data"];
                var fgData = [];
                for (var f in fg) {
                    var aa = {};
                    aa.condition = fg[f].condition || "";
                    aa.name = fg[f].filterName;
                    aa.operator = fg[f].operator || "";
                    aa.value = fg[f].value || "";
                    aa.internalValue = fg[f].internalValue || "";
                    aa.valueType = fg[f].valueType || "";
                    var pp = workspace.config.Enums.Properties[fg[f].filterName];
                    if (pp && pp.valueType === "UniquePID") {
                         for(var pointRefIndex in point["Point Refs"]){
                            if (fg[f].index == point["Point Refs"][pointRefIndex].AppIndex){
                                aa.value = point["Point Refs"][pointRefIndex].PointName;
                            }
                         }
                    }
                    fgData.push(aa);
                }
                //console.log(fgData);
                self.filterGrid.dataSource.data(fgData);
                var cg = point["Column Data"];
                var cgData = [];
                for (var c in cg) {
                    var cc = {};
                    cc.name = cg[c].name;
                    cc.precision = cg[c].precision || "";
                    cc.valueType = cg[c].valueType;
                    cgData.push(cc);
                }
                //console.log(cgData);
                self.columnGrid.dataSource.data(cgData);
            }


            var pointFilterCallBack  = function (pf) {
                if(!self.areEqual(pf, self.pointFilter) && (pf.pointTypes.length !== 38 || pf.name1 !== "") && pf.pointTypes.length !== 0)
                    self.pointFilter = pf;
            };

            var winCallback = function () {
                pointFilterWin.pointLookup.init(pointFilterCallBack, self.pointFilter);
            };

            var pointFilterWin=
                workspace.openWindowPositioned("/pointLookup?mode=filter",
                    "Point Selector", "pointSelector", "filter", "filter", {
                        width: 960,
                        height: 400,
                        callback: winCallback
                    });

            $(".container").show();

            $("input[name=returnLimit]").click(function(){
                $("input[name=returnLimit]").attr("checked", false);

                this.checked = !this.checked;
                return true;
            });

            spinner.stop();
        },

        //SignalR is used in Asp.net. First when Report Viewer is called Asp.net page initialized signalR component
        // and then this object gets assigned that object. This object is then used in Report Designer and back and forth.
        //Having it in one place eliminates the need of assigning and re-assigning of the object.
        signalR:{},

        //This unblocks blockUI element on tabs.
        unblockTabs:function(){
            $("#tabDesign").unblock();
            $("#tabPreview").unblock();

            if (this.unTabbed){
                this.unTabbed.close();
                this.unTabbed = null;
            }

        },

        //Handles double clicks on tabs.
        tabDoubleClick: function(tab){

            var designerMessage ="<div class='alert alert-danger'><h5>Designer opened in new window. <br/> " +
            "<a class='alert-link' onclick='dorsett.reportUI.unblockTabs();'>Click Here</a> to close the other window and restore this one.</h5>" +
            "<br/> <h6 class='warning'>Warning:<br/>You will lose any unsaved changes.</h6></div>";

            var previewMessage = "<div class='alert alert-danger'><h5>Preview opened in new window. <br/> " +
            "<a class='alert-link' onclick='dorsett.reportUI.unblockTabs();'>Click Here</a> to close the other window and restore this one.</h5></div>";


            var _url = "/reportnet/designer/" + this.reportId;
            if (tab == "preview") {
                _url = "/reportnet/viewer/" + this.reportId;
                $("#tabPreview").block({css: this.blockCss ,centerY:0,
                    message: previewMessage });
            }
            else
            {

                $("#tabDesign").block({css: this.blockCss ,centerY:0,
                    message: designerMessage });

            }
            this.unTabbed = window.open(_url, "reportUntabbed");


        },

        //holds select template dropdown object created in Init
        selectTemplate:{},

        //this is responsible for holding template saved for the report. If one is not saved, empty object is assigned.
        templateId:(point["Report Config"] && point["Report Config"].reportTemplate) || "",

        // this is responsible for rendering template dropdown combobox
        renderTemplateDropDown:function(id){
            var self = this;
            //$(".templateSelect").show();

            if(id)
            {
                point.Templates = [id];
            }
            self.getTemplateDataSource(function(d){
                var ds = new kendo.data.DataSource({
                    data:d
                });
                self.selectTemplate = $("#selectTemplate").kendoComboBox({
                    dataTextField: "Name",
                    dataValueField: "_id",
                    dataSource : ds,
                    filter: "contains",
                    highlightFirst: false,
                    optionLabel: "[Template Not Selected]",
                    change:function(){
                        var obj = this;
                        self.ensureComboBoxValue(obj, "Name", function(index){
                            if (index === -1){
                                obj.text("");
                            }
                            else{
                                //console.log(obj.dataSource._data[index]);
                                obj.text(obj.dataSource._data[index].Name);
                                obj.value(obj.dataSource._data[index]._id);
                                self.templateId = obj.dataSource._data[index]._id;
                            }
                        });
                    }
                }).data("kendoComboBox");

                self.selectTemplate.dataSource.insert(0, { Name: "[***Use No Template***]", _id: "" });
                if (self.templateId !== "") {
                    self.selectTemplate.value(self.templateId);
                }

                self.selectTemplate.input.focus(function(){
                    setTimeout(function () {
                        self.selectTemplate.input.select();
                    }, 25);

                });
            });


        },

        //this is responsible for getting data source for template dropdown.
        getTemplateDataSource:function(callback){
            $.ajax({
                url: "/api/reportTemplates/getAll",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                cache:false,
                data: JSON.stringify({templates: point.Templates }),
                success: function (result) {
                    callback(result);
                }
            });
        },

        //this is one place to do query of Data Source. Basically, when desired value is not found, it matches first element found in the list.
        //If that's not found either, then object is assigned index of -1 and callback is called. Having Callback function is mandatory here.
        queryDataSource:function(dataSource, queryProperty, queryValue, callback){
            var index = -1;
            for (var kv in dataSource._data) {
                //console.log(dataSource._data[kv][queryProperty], queryValue);
                if (dataSource._data[kv][queryProperty] === queryValue) {
                    index = kv;
                }
            }
            callback(index);

        },

        //this is one place to ensure combobox value is legit. It actually prevents user from entering anything outside the list of items.
        ensureComboBoxValue:function(obj, queryProperty,  callback){
            var self = this;
            self.queryDataSource(obj.dataSource, queryProperty, obj.text(), function(index){
                //console.log(index);
                if (index > -1) {
                    callback(index);
                }
                else {
                    if (obj.list[0].innerText === ""){
                        callback(-1);
                    }
                    else{
                        var queryValue = obj.list[0].innerText.split("\n")[0];
                        //console.log(queryValue);
                        self.queryDataSource(obj.dataSource, queryProperty, queryValue, function(i){
                            callback(i);
                        });
                    }
                }
            });
        },

        //Responsible for handling everything about "Report Design" tab.
        reportDesign:function(forced){
            var self = this;
            var $runReportForm = $("#runReportForm");
            var $tabDesign = $("#tabDesign");
            var $tabConfiguration = $("#tabConfiguration");
            var $tabPreview = $("#tabPreview");

            if ($runReportForm.attr("action").indexOf("viewer") > -1){
                forced = true;
            }


            $("#tabs  li:eq(0)").removeClass("active");
            $("#tabs  li:eq(1)").removeClass("active");
            $("#tabs  li:eq(2)").show().addClass("active");

            $tabConfiguration.removeClass("active");
            $tabPreview.removeClass("active");
            $tabDesign.addClass("active");

            var dataChanged = $("#dataChanged");
            var designTarget = $("#reportDesign");
            if (dataChanged.val() == "true" || forced) {
                $tabDesign.unblock();

                designTarget.width($("#tabs").width() - 15).height("1220px");
                self.blockFunction(self.busyImage);

                $runReportForm.attr("target", "reportDesign")
                    .attr("action", "/reportnet/designer/" + self.reportId).submit();
                dataChanged.val("false");

            }
        },

        //Responsible for handling everything about "Report Preview" tab.
        reportPreview:function(forced){
            var self = this;
            $("#tabs  li:eq(1)").show().addClass("active");
            $("#tabs  li:eq(0)").removeClass("active");

            $("#tabConfiguration").removeClass("active");
            $("#tabPreview").addClass("active");

            self.getReportOption(false, function(data) {
                var dataChanged = self.dataChanged(data);
                var previewTarget = $("#reportPreview");
                if (dataChanged || forced) {

                    previewTarget.width($("#tabs").width()- 15).height("1220px");
                    self.blockFunction(self.busyImage);

                    $("#runReportForm").attr("target", "reportPreview")
                        .attr("action", "/reportnet/viewer/" + self.reportId).submit();
                }

            });
        },

        //this tracks json object used in "Configuration tab"
        serializedData: {},

        //tracks error in asp.net. If this is true, then next time user presses "Run Report" or clicks on "Report Preview", report is forced to be re-run
        //even if no data has changed in "Configuration tab".
        aspNetErrorOccured: false,

        //keeps track whether or not any "Configuration tab" data has changed.
        dataChanged: function (newData) {
            if (!this.aspNetErrorOccured && this.areEqual(newData, this.serializedData)) {
                $("#dataChanged").val(false);
                return false;
            }
            else {
                this.serializedData = newData;
                $("#params").val(JSON.stringify(newData));
                $("#dataChanged").val(true);
                this.aspNetErrorOccured = false;
                return true;
            }
        },

        //Keeps track of Columns Grid
        columnsInfo: [],

        //Keeps track of Filters Grid
        filtersInfo: {},

        //Responsible for getting all data in Configuration tab. This is what gets passed onto Report Preview page and beyond.
        getReportOption: function (collectDataOnly, callback) {
            var self = this;
            self.columnsInfo = [];
            self.filtersInfo = {};

            if (!collectDataOnly && $("#reportTitle").val() == "") {
                self.hideDivBlock("Error", "Report Title is required field.");
                return;
            }
            var cols = self.columnGrid.dataSource.view();
            if (!collectDataOnly && cols[0].name === "[Column Not Set]") {
                self.hideDivBlock("Error", "Atleast one Column needs to be defined.");
                return;
            }
            //console.log(cols);
            var dataSources = {};
            dataSources.Point_Properties = {};
            dataSources.Point_Properties.columns = [];
            dataSources.Point_Properties.filterMode = "And";
            dataSources.Point_Properties.filterOn = false;
            dataSources.Point_Properties.groups = [];
            dataSources.Point_Properties.sort = [];
            dataSources.Point_Properties.totals = {};
            dataSources.Point_Properties.filters = {};

            var filters = self.filterGrid.dataSource.view();

            for (var f in filters) {
                if (filters[f].name === "[Filter Column Not Set]") {
                    continue;
                }
                //console.log(filters[f]);
                filters[f] = self.ensureCorrectValueTypeForFilter(filters[f]);
                self.filtersInfo[f] = {
                    column: filters[f].name.replace(/\s+/gi, "_"),
                    condition: filters[f].operator,
                    dataType: filters[f].valueType,// == "Float" ? "Numeric" : "String",
                    value1: filters[f].internalValue === "" ? filters[f].value : filters[f].internalValue,
                    value2: "",
                    fieldIs: "Value",
                    expression: "",
                    valueList: ""

                };

            }

            for (var c in cols) {
                if (cols[c].name === "[Column Not Set]") {
                    continue;
                }

                var vt = self.ensureCorrectValueTypeForColumn(cols[c].name, cols[c].valueType);
                //console.log(vt);
                self.columnsInfo.push({
                    colName: cols[c].name.replace(/\s+/gi, "_"),
                    precision: cols[c].precision,
                    valueType: vt
                });
            }
            dataSources.Point_Properties.columns = self.columnsInfo;
            dataSources.Point_Properties.filters = self.filtersInfo;

            var reportOptions = {};
            reportOptions.componentType = "Data";
            reportOptions.dataSourcesOrder = ["Point Properties"];
            reportOptions.language = "C";
            if (cols.length < 6) {
                reportOptions.orientation = "Portrait";
            }
            else {
                reportOptions.orientation = "Landscape";
            }
            reportOptions.relations = {};
            reportOptions.theme = "Blue_50";
            reportOptions.unit = "in";

            var reportUI = {
                reportType: "ad-hoc",
                reportTitle: $("#reportTitle").val(),
                reportTemplate: self.templateId,
                includeFilter: $("#includeFilter").prop("checked"),
                includeReportName: $("#includeReportName").prop("checked"),
                returnLimit:$("input[name=returnLimit]:checked").val(),
                dataSources: dataSources,
                reportOptions: reportOptions,
                pointFilter:self.pointFilter
            };
            console.log(reportUI);
            callback(reportUI);
        },

        //Responsible for filling Column Grid
        fillGrid: new kendo.data.DataSource({
            data: [{name: "[Column Not Set]", precision: 0, valueType: "string"}],
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        name: {validation: {required: true}},
                        precision: {type: "number", validation: {min: 1, max: 9}},
                        valueType: {defaultValue: "string"}
                    }
                }
            }
        }),

        //Responsible for filling Filter Grid
        fillfilterGrid: new kendo.data.DataSource({
            data: [{
                firstRow: true,
                condition: "AND",
                name: "[Filter Column Not Set]",
                operator: "EqualTo",
                value: "",
                internalValue: "",
                valueType: "null"
            }],
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        condition: {type: "string"},
                        name: {validation: {required: true}},
                        operator: {type: "string"},
                        value: {type: "string"},
                        valueType: {defaultValue: "string"}
                    }
                }
            }
        }),

        //Responsible for handling the list inside Operator Dropdown based on Value type
        operators: function (op) {
            //console.log(op);
            var opArray = [];
            switch (op) {
                case "Bool":
                case "BitString":
                case "UniquePID":
                case "Enum":
                case "undecided":
                    opArray.push({text: "=", value: "EqualTo"}, {text: "!=", value: "NotEqualTo"});
                    break;
                case "String":
                    opArray.push(
                        {text: "=", value: "EqualTo"},
                        {text: "!=", value: "NotEqualTo"},
                        {text: "{*}", value: "Containing"},
                        {text: "{!*}", value: "NotContaining"}
                    );
                    break;
                case "Float":
                case "Integer":
                case "Unsigned":
                case "null":
                case "MinSec":
                case "HourMinSec":
                case "DateTime":
                case "Timet":
                    opArray.push({text: "=", value: "EqualTo"}, {text: "!=", value: "NotEqualTo"},
                        {text: ">", value: "GreaterThan"}, {text: "<", value: "LessThan"},
                        {text: ">=", value: "GreaterThanOrEqualTo"}, {text: "<=", value: "LessThanOrEqualTo"});
                    break;
                case "None":
                    opArray.push(
                        {text: "=", value: "EqualTo"},
                        {text: "!=", value: "NotEqualTo"},
                        {text: "{*}", value: "Containing"},
                        {text: "{!*}", value: "NotContaining"},
                        {text: ">", value: "GreaterThan"},
                        {text: "<", value: "LessThan"},
                        {text: ">=", value: "GreaterThanOrEqualTo"},
                        {text: "<=", value: "LessThanOrEqualTo"});

                    break;
                default:
                    opArray.push(
                        {text: "=", value: "EqualTo"},
                        {text: "!=", value: "NotEqualTo"}
                    );
                    break;
            }
            return opArray;
        },

        //This function is responsible for displaying part of Operator
        displayOperator: function (op) {
            //console.log(op.operator);
            switch (op.operator) {
                case "EqualTo":
                    return "=";
                    break;
                case "NotEqualTo":
                    return "!=";
                    break;
                case "Containing":
                    return "{*}";
                    break;
                case "NotContaining":
                    return "{!*}";
                    break;
                case "GreaterThan":
                    return ">";
                    break;
                case "GreaterThanOrEqualTo":
                    return ">=";
                    break;
                case "LessThan":
                    return "<";
                    break;
                case "LessThanOrEqualTo":
                    return "<=";
                    break;
                default:
                    return op.operator;
                    break;
            }
        },

        //This function is needed as value types are recognized by different name in Asp.net Reporting Components.
        ensureCorrectValueTypeForFilter:function(filter){
            switch(filter.valueType){
                case "DateTime":
                case "Timet":
                    filter.valueType = "DateTime";
                    filter.value = new Date(filter.value).toISOString();
                    break;
                case "Float":
                    filter.valueType = "Numeric";
                    break;
                default:
                    filter.valueType = "String";
                    break;
            }
            return filter;
        },

        //This function is needed because there are situations where we have property value types as None, undefined.
        //And for this property, we default to "String". However, if greater than or less than kind of numerical operators are selected
        // then we need to send numeric as operator type. So thats what we go through to ensure thats the case.
        ensureCorrectValueTypeForColumn: function (col, vt) {
            for (var f in this.filtersInfo) {
                if (this.filtersInfo[f].column === col) {
                    //console.log(col, this.filtersInfo[f]);
                    var o = "String";
                    switch (this.filtersInfo[f].condition) {
                        case "EqualTo":
                        case "NotEqualTo":
                        case "Containing":
                        case "NotContaining":
                            o = "String";
                            break;
                        case "GreaterThan":
                        case "GreaterThanOrEqualTo":
                        case "LessThan":
                        case "LessThanOrEqualTo":
                            o = "Float";
                            break;

                    }
                    //console.log(this.filtersInfo[f]);
                    this.filtersInfo[f].dataType = o === "Float" ? "Numeric" : "String";
                    //return o;
                }
            }
            return vt;
        },

        //template that shows up for Operator Column within Filters Grid
        operatorTemplate: function (container, options) {
            //console.log(options.model);
            var input = $('<input required data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"/>');
            input.appendTo(container);

            var ops = self.dorsett.reportUI.operators(options.model.valueType);
            //console.log(ops);
            input.kendoDropDownList({
                dataSource: ops,
                dataValueField: "value",
                dataTextField: "text"
            });
        },

        //template that shows up for "Value" Column
        valueTemplate: function (container, options) {
            switch (workspace.config.Enums.Properties[options.model.name].valueType) {
                case "UniquePID":
                    var buttonText = options.model.value === "" ? "[Point Not Set]" : options.model.value;

                    var $clearButtonElem =$('<button><span class="k-icon"></span>Clear Point</button>');
                    $clearButtonElem.kendoButton({
                        icon:"cancel",
                        enable:false,
                        click: function (e) {
                            options.model.internalValue = "0";
                            options.model.value = "[Point Not Set]";
                            options.model.valueType = "UniquePID";
                            window.dorsett.reportUI.filterGrid.refresh();
                        }
                    });

                    if (options.model.internalValue !== "" && options.model.internalValue !== "0")
                    {
                        var clearButton = $clearButtonElem.data("kendoButton");
                        clearButton.enable(true);
                    }
                    var $inputButton = $('<button>' + buttonText + '</button>');

                    $inputButton.kendoButton({
                        click: function (e) {
                            var selector = workspace.openWindowPositioned('pointLookup/null/' + options.model.name + "?mode=select",
                                'Point Selector For Report', '', '', 'reportcriteriaselector',
                                {
                                    width: 780, height: 550, callback: function () {
                                    selector.pointLookup.init(function setPoint(upi, pointName) {
                                        options.model.internalValue = upi.toString();
                                        options.model.value = pointName;
                                        options.model.valueType = "UniquePID";
                                        window.dorsett.reportUI.filterGrid.refresh();
                                    });
                                }
                                });
                        }
                    });

                    $inputButton.appendTo(container);
                    $clearButtonElem.appendTo(container);
                    break;
                case "DateTime":
                case "Timet":
                    var tt = $('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '"  data-bind="value:' + options.field + '"/>')
                        .appendTo(container)
                        .kendoDateTimePicker({format: "g"}).data("kendoDateTimePicker");
                    if (options.model.value)
                        tt.value(options.model.value);
                    break;
                case "HourMinSec":
                    $('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '"/>')
                        .appendTo(container)
                        .kendoTimePicker({format: "h:mm tt"});
                    break;
                case "MinSec":
                    $('<input style="width:60px" data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '"/>')
                        .appendTo(container)
                        .kendoNumericTextBox({format: "n0", min: 1});
                    $("<span>Secs</span>").appendTo(container);
                    //$('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '"/>')
                    //    .appendTo(container)
                    //    .kendoTimePicker({format: "mm:ss", interval:10});
                    break;
                case "Bool":
                    $('<input required data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"/>')
                        .appendTo(container)
                        .kendoDropDownList({
                            dataSource: [{"text": "True", "value": "True"}, {"text": "False", "value": "False"}],
                            dataValueField: "value",
                            dataTextField: "text",
                            optionLabel: "Select..."
                        });
                    break;
                case "Float":
                    $('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '"/>')
                        .appendTo(container)
                        .kendoNumericTextBox({format: "n", decimals: 2});
                    break;
                case "Enum":
                    var vv = [];
                    var enumValues = workspace.config.Utility.pointTypes.getEnums(options.model.name);
                    //console.log(enumValues);
                    for (var k in enumValues) {
                        vv.push({"text": enumValues[k], "value": enumValues[k]});
                    }
                    if (vv.length > 0) {
                        $('<input required data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"/>')
                            .appendTo(container)
                            .kendoDropDownList({
                                dataSource: vv,
                                dataValueField: "value",
                                dataTextField: "text",
                                optionLabel: "Select..."
                            });

                    }
                    else {
                        $('<input data-bind="value:' + options.field + '"/>').appendTo(container);
                    }

                    break;
                case "None":
                case "String":
                    $('<input data-bind="value:' + options.field + '"/>').appendTo(container);
                    break;
                default:
                    $('<input data-bind="value:' + options.field + '"/>').appendTo(container);
                    break;

            }

        },

        //Function is responsible when Column Name is changed in dropdown
        onColumnNamePropertySelect: function (e) {
            //console.log(this.value());
            var g = self.dorsett.reportUI.columnGrid;
            var dataItem = this.dataItem(e.item.index());
            var gridItem = g.dataItem(g.select());
            gridItem.valueType = dataItem.value.valueType;
            gridItem.name = dataItem.name;
            g.refresh();
        },

        //Function is responsible when Filter Column Name is changed in dropdown
        onFilterNamePropertySelect: function (e,d) {
            var g = self.dorsett.reportUI.filterGrid;
            var dataItem = this.dataItem(e.item.index());
            var gridItem = g.dataItem(g.select());
            //console.log(dataItem);
            gridItem.name = dataItem.name;
            gridItem.valueType = dataItem.value.valueType;
            gridItem.value = "";
            gridItem.internalValue = "";
            g.refresh();
        },

        //Responsible for adding column row
        addColumnRow: function (e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");
            //console.log(this);
            this.select(closestTR);
            this.dataSource.insert(this.select().index() + 1,
                {name: "[Column Not Set]", precision: 0, valueType: "string"});
            this.clearSelection();
        },

        //Responsible for removing column row
        removeColumnRow: function (e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");
            this.select(closestTR);
            var dataItem = this.dataSource.at(this.select().index());
            this.dataSource.remove(dataItem);
            if (this._data.length == 0) {
                var g = self.dorsett.reportUI.columnGrid;
                g.dataSource.insert(this.select().index() + 1,
                    {name: "[Column Not Set]", precision: 0, valueType: "string"});

                //alert("First Row cannot be deleted.");
            }

        },

        //Responsible for adding filter column row
        addFilterRow: function (e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");

            this.select(closestTR);
            var g = self.dorsett.reportUI.filterGrid;
            g.dataSource.insert(this.select().index() + 1,
                {
                    condition: "AND",
                    firstRow: false,
                    name: "[Filter Column Not Set]",
                    operator: "EqualTo",
                    value: "",
                    internalValue: "",
                    valueType: "null"
                });
            g.clearSelection();
        },

        //Responsible for removing filter column row
        removeFilterRow: function (e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");
            this.select(closestTR);
            var dataItem = this.dataSource.at(this.select().index());
            this.dataSource.remove(dataItem);
            if (this._data.length == 0) {
                var g = self.dorsett.reportUI.filterGrid;
                g.dataSource.insert(this.select().index() + 1,
                    {
                        condition: "AND",
                        firstRow: false,
                        name: "[Filter Column Not Set]",
                        operator: "EqualTo",
                        value: "",
                        internalValue: "",
                        valueType: "String"
                    });

                //alert("First Row cannot be deleted.");
            }

        },

        //Responsible for saving Report Configuration
        saveReport: function (callback) {
            this.registerCallback = callback;
            this.getReportOption(false, function () {
                $('#modal-saveReport').modal('show');

            });
        },

        //Register Call back to be called later
        registerCallback: "",

        //Comparing json objects to determine whether they are equal or not
        areEqual: function( objFirst, objSecond ) {
            if ( objFirst === objSecond ) return true;
            if ( ! ( objFirst instanceof Object ) || ! ( objSecond instanceof Object ) ) return false;

            if ( objFirst.constructor !== objSecond.constructor ) return false;
            for ( var p in objFirst ) {
                if ( ! objFirst.hasOwnProperty( p ) ) continue;

                if ( ! objSecond.hasOwnProperty( p ) ) return false;

                if ( objFirst[ p ] === objSecond[ p ] ) continue;

                if ( ! this.areEqual( objFirst[ p ],  objSecond[ p ] ) ) return false;
            }

            for ( p in objSecond ) {
                if ( objSecond.hasOwnProperty( p ) && ! objFirst.hasOwnProperty( p ) ) return false;
            }
            return true;
        }
    }
})((window.opener && window.opener.parent.workspaceManager) || window.parent.parent.workspaceManager,
    window.spinner, window.point);

dorsett.reportUI.init();



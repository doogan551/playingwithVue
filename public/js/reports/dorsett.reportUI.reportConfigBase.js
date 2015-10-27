/**
 * Created by Soven on 6/26/2014.
 */
"use strict";

var dorsett = dorsett || {};

var $tabConfiguration = $("#tabConfiguration");
var $tabPreview = $("#tabPreview");
var $tabReportNotes = $("#tabReportNotes");
var $runReportForm = $("#runReportForm");
var $tabDesign = $("#tabDesign");
var $runReport = $("#runReport");
var $pointName1 = $("#pointName1");
var $pointName2 = $("#pointName2");
var $pointName3 = $("#pointName3");
var $pointName4 = $("#pointName4");


dorsett.reportUI = Class.extend({
        Name:"dorsett.reportUI",
        workspace:{},
        point : {},
        originalPoint: {},
        //Init function to setup grids and dropdowns
        init: function (workspace, point) {

            //Lets get this asp.net part of the report fired up.
            //console.log('initialize report');
            //this.initializeReportComponents();


            var self = this;
            this.workspace = workspace;
            this.point = point;

            $("#tabs  li:eq(1)").hide();
            $("#tabs  li:eq(2)").hide();
            $("#tabs  li:eq(3)").hide();

            if (point) {
                $("#reportTitle").val(title);
                $("#pointName1").val(point.name1);
                $("#pointName2").val(point.name2);
                $("#pointName3").val(point.name3);
                $("#pointName4").val(point.name4);

                $('#editPoint').click(function(){
                    $("#pointName1").prop('disabled', false);
                    $("#pointName2").prop('disabled', false);
                    $("#pointName3").prop('disabled', false);
                    $("#pointName4").prop('disabled', false);
                    $(this).hide();
                    $("#updatePoint").show();
                    $("#cancelUpdate").show();

                });

                var nameChangeOnblur = function(parent, obj, nam){
                    var newPoint = JSON.parse(JSON.stringify(point));
                    newPoint[nam] = $(obj).val();
                    var data = parent.workspace.config.Update.formatPoint({point:newPoint, 
                    oldPoint: point, property:nam, 
                    propertyObject:$(obj).val()});
                    if(data.err){
                       parent.hideDivBlock(data.err);
                       $(obj).button("reset"); 
                    }
                    else {
                        point =  _.clone(data, true);
                        $(obj).button("reset");
                    }
                }
                $("#updatePoint").click(function(){
                    var me = this;
                    $(this).button('loading');
                    $.when(
                        nameChangeOnblur(self, $pointName1, "name1"),
                        nameChangeOnblur(self, $pointName2, "name2"),
                        nameChangeOnblur(self, $pointName3, "name3"),
                        nameChangeOnblur(self, $pointName4, "name4"))
                    .done(function(){
                        var newPoint = JSON.parse(JSON.stringify(point));
                        newPoint.name1 = $pointName1.val();
                        newPoint.name2 = $pointName2.val();
                        newPoint.name3 = $pointName3.val();
                        newPoint.name4 = $pointName4.val();

                        if(JSON.stringify(self.originalPoint) === JSON.stringify(newPoint)){
                            return;
                        }

                        self.workspace.socket().emit('updatePoint', JSON.stringify({'newPoint': newPoint, 'oldPoint' : self.originalPoint}));
                        self.workspace.socket().once('pointUpdated', function(data) {
                            if (data.err)
                            {
                                self.hideDivBlock(data.err);
                            }
                            else
                            {
                                iToast.showNotification('Notification',data.message, {
                                    icon: 'save',
                                    theme: 'jetblack',
                                    position: 'top right'
                                });
                                self.originalPoint = point = _.clone(newPoint, true);
                            }

                            $("#cancelUpdate").trigger('click');
                            $(me).button('reset');
                    
                        });     
                    });
                    
                });

                $("#cancelUpdate").click(function(){

                    $pointName1.val(point.name1).prop('disabled', true);
                    $pointName2.val(point.name2).prop('disabled', true);
                    $pointName3.val(point.name3).prop('disabled', true);
                    $pointName4.val(point.name4).prop('disabled', true);
                    $("#updatePoint").hide();
                    $("#cancelUpdate").hide();
                    $("#editPoint").show();

                });

                this.originalPoint = _.clone(point, true);
            }

            if (point._pStatus) {
                $("body").css({"background-color": "#c44e4e"});
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
                    case "#tabReportNotes":
                        self.reportNotes();
                        break;
                }
            });

            $(document).on('dblclick', 'a[data-toggle="tab"]', function (e) {
                if(e.target.hash !== "#tabConfiguration") self.tabDoubleClick(e.target.hash);
            });


            self.renderTemplateDropDown();

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

            $("#saveReport").click(function(){
                $(this).button("loading");
                self.saveReportConfig();
            });

            $runReport.click(function(){
                    self.reportPreview();
            }).button("loading");
            
            window.onbeforeunload = function(e) {
                if (self.isNew)
                {
                    self.cancelUnsaveReport();
                }
            };

            dorsett.reportUI.alias = self.alias;


            self.signalRWork(function(){
              self.startUpScript();
            });


        },

        startUpScript:function(){

        },
        signalRWork:function(callback){
            var myHub = $.connection.signalRHub;
            //console.log($.connection.hub);
            //this.hideDivBlock("");
            
            //return;
            var self = this;

            myHub.client.initialized = function (message) {
                console.log(message);
                reportConfig.hideDivBlock("");
            };

            myHub.client.handleError = function (message) {
                //console.log(message);
                //console.log($connectionID.val(), connection_id);
                //if ($connectionID.val() === connection_id) {
                self.hideDivBlock("err", message);
                //}
            };

            myHub.client.zeroRecordsFound = function () {
                //console.log($connectionID.val(), connection_id);
                //if ($connectionID.val() === connection_id) {
                self.hideDivBlock("err", "No Records could be found!!!");
                //}
            };

            myHub.client.closeProgressReport = function () {
                //if ($connectionID.val() === connection_id) {
                self.hideDivBlock("");
                //}
            };


            myHub.client.truncatedMessage = function () {
                //if ($connectionID.val() === connection_id) {
                self.showMessage("Report request too large - Report will be truncated", true);
                setInterval($.unblockUI, 5000);
                //}
            };

            $.connection.hub.error(function (error) {
                //self.hideDivBlock("err", $.connection.hub.lastError.message);
                console.log(error);
                self.hideDivBlock('err', error);
                setTimeout(function() {
                   $.connection.hub.start();
               }, 10000); // Restart connection after 10 seconds.
            });

            $.connection.hub.disconnected(function () {
                
                if ($.connection.hub.lastError) 
                { 
                   // Your function to notify user.
                    self.hideDivBlock("err", $.connection.hub.lastError.message);
                }
            });

            $.connection.hub.start({ waitForPageLoad: false })
                .done(function () {
                    //var connection_id = $.connection.hub.id;
                    //console.log("CONN ID", connection_id);
                    //$connectionID.val($.connection.hub.id);

                    //myHub.server.signalRHubMessage(" Initialization For Report ====" + $.connection.hub.id);
                    //myHub.server.registerConnectionID($.connection.hub.id);

                    $(".container-fluid").show();

                    $runReport.button("reset");

                    $("#spinnerClass").hide();

                    self.signalRHubReport = myHub;

                    callback();

                });


        },

        //Initialize Report Components
        initializeReportComponents:function(){
            console.log('Initialize Report');
            $("#runReportForm").attr("target", "reportPreview")
                .attr("action", "/reportnet/initialize.aspx").submit();
        },


        ///////////////////////
        //Point Filter Iframe
        pointFilter : (point["Report Config"] && point["Report Config"].pointFilter) || { name1: '', name2: '',  name3: '', name4: '', pointTypes: [] },
        /////////////////////////////
        columnGrid: {},

        //Make Column Grid Sortable
        columnGridSortable:function(){
            var self = this;
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

        },

        filterGrid: {},

        filterGridSortable : function(){
            var self = this;
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
                change:function(e){
                    var oldDataItem =  self.filterGrid.dataSource.at(e.oldIndex);
                    var newDataItem = self.filterGrid.dataSource.at(e.newIndex);
                    //console.log("oldItem", oldDataItem, "newItem", newDataItem);
                    self.filterGrid.dataSource.remove(oldDataItem);
                    self.filterGrid.dataSource.remove(newDataItem);
                    //console.log("oldIndex", e.oldIndex, "newIndex", e.newIndex);
                    if (e.newIndex === 0){
                        oldDataItem.firstRow = true;
                        oldDataItem.condition = "";
                    }
                    if (newDataItem.condition === ""){
                           newDataItem.condition = "AND";
                    }

                    newDataItem.firstRow = false;

                    if (e.oldIndex === 0){
                        newDataItem.condition = "";
                        newDataItem.firstRow = true;
                        oldDataItem.condition = "AND";
                        oldDataItem.firstRow = false;
                    }

                    //console.log(oldDataItem, newDataItem);
                    self.filterGrid.dataSource.insert(e.newIndex, oldDataItem);
                    self.filterGrid.dataSource.insert(e.oldIndex, newDataItem);
                    $('td').blur();
                }
            });

        },

        unTabbed:null,
        isNew: (point._pStatus === 1),
        reportId: point._id,

        //show Message
        showMessage:function(msg, showInProgress){
            if(showInProgress){
                this.blockFunction("<div class='alert alert-warning'>" + this.busyImage + "<br /><br /><h4>" + msg + "</h4></div>");
            }
            else{
                this.blockFunction("<div class='alert alert-warning'>" + msg + "</div>");
            }
        },

        //function is responsible for hiding blockUI element
        hideDivBlockOnly: function () {
            //$.unblockUI();
            $("#spinnerClass").hide();
            $("#sideMenu").unblock();

        },

        //This function is responsible for hiding blockUI element and showing error message if error message is passed.
        hideDivBlock: function (err, msg) {
            this.hideDivBlockOnly();
            //console.log("Is New", this.isNew);
            if (err.length > 0){
                $('#modal-errorProcess').modal('show');
                if (!msg)
                {
                    $("#errorProcessingMessage").html("Error Occurred! If this error persists, please contact System Administrator!!");
                }
                else
                {
                    $("#errorProcessingMessage").html(msg);

                }
                this.aspNetErrorOccured = true;
                $("#tabs  li:eq(1)").hide().removeClass("active");
                $("#tabs  li:eq(2)").hide().removeClass("active");
                $("#tabs  li:eq(3)").hide().removeClass("active");
                $("#tabs  li:eq(0)").show().addClass("active");

                $("#tabConfiguration").addClass("active");
                $("#tabPreview").removeClass("active");
                $("#tabDesign").removeClass("active");
                $("#tabReportNotes").removeClass("active");
            }
            else{
                if (!this.isNew && $("#tabPreview").hasClass("active"))
                {
                    $("#tabs  li:eq(2)").show();
                    $("#tabs  li:eq(3)").show();
                }
                $runReport.button("reset");
                $(".container-fluid").show();


            }
        },

        //Unblock Side menu
        activeSideMenus: function(){
            $("#sideMenu").unblock();
        },


        //Css used for blocking (in progress)
        blockCss:{
                border: 'none',
                padding: '5px',
                backgroundColor:'#ccc',
                '-webkit-border-radius': '10px',
                '-moz-border-radius': '10px',
                top:'40%',
                opacity:0.5
        },

        //blocking function for showing in progress / busy
        blockFunction: function (message) {

            $.blockUI({
                message: message,
                css: this.blockCss,
                overlayCSS:  { backgroundColor: '#FFFFFF',opacity:0.0,cursor:'wait'}
            });
        },

        //Spinner image used in showing in progress / busy
        busyImage: '<i class="fa fa-5x fa-cog fa-spin"></i>',

        //SignalR is used in Asp.net. First when Report Viewer is called Asp.net page initialized signalR component
        // and then this object gets assigned that object. This object is then used in Report Designer and back and forth.
        //Having it in one place eliminates the need of assigning and re-assigning of the object.
        //signalR: null,

        //This unblocks blockUI element on tabs.
        unblockTabs:function(){
            $("#tabDesign").unblock();
            $("#tabPreview").unblock();
            $("#tabReportNotes").unblock();

            if (this.unTabbed){
                this.unTabbed.close();
                this.unTabbed = null;
            }

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
                    },
                    close:function(){
                        $('body').css('overflow','auto');
                    },
                    open:function(){
                        $('body').css('overflow','hidden');
                    }
                }).data("kendoComboBox");

                if(self.selectTemplate)
                {
                    self.selectTemplate.dataSource.insert(0, { Name: "[***Use No Template***]", _id: "" });
                    if (self.templateId !== "") {
                        self.selectTemplate.value(self.templateId);
                    }
                    else{
                        self.selectTemplate.value("");
                    }

                    self.selectTemplate.input.focus(function(){
                        setTimeout(function () {
                            self.selectTemplate.input.select();
                        }, 25);

                    });

                    if(self.adjustTemplateDropDown)
                    {
                        self.adjustTemplateDropDown();
                    }
                }

            });


        },

        //this is responsible for getting data source for template dropdown.
        getTemplateDataSource:function(callback){
            var reportType = this.workspace.config.Enums["Report Types"];
            var reportEnumType = reportType[this.alias].enum;
            $.ajax({
                url: "/api/reportTemplates/getAll",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                cache:false,
                data: {Type: reportEnumType },
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

        tabSwitch: function(tabNumber){


            switch(tabNumber) {
                case 1:
                    $("#tabs  li:eq(1)").show().addClass("active");
                    $("#tabs  li:eq(0)").removeClass("active");
                    $("#tabs  li:eq(2)").removeClass("active");
                    $("#tabs  li:eq(3)").removeClass("active");

                    $tabConfiguration.removeClass("active");
                    $tabDesign.removeClass("active");
                    $tabPreview.addClass("active");
                    break;
                case 2:
                    $("#tabs  li:eq(0)").removeClass("active");
                    $("#tabs  li:eq(1)").removeClass("active");
                    $("#tabs  li:eq(3)").removeClass("active");
                    $("#tabs  li:eq(2)").show().addClass("active");

                    $tabConfiguration.removeClass("active");
                    $tabPreview.removeClass("active");
                    $tabDesign.addClass("active");
                    break;
                case 3:
                    $("#tabs  li:eq(0)").removeClass("active");
                    $("#tabs  li:eq(1)").removeClass("active");
                    $("#tabs  li:eq(2)").removeClass("active");
                    $("#tabs  li:eq(3)").show().addClass("active");

                    $tabConfiguration.removeClass("active");
                    $tabPreview.removeClass("active");
                    $tabDesign.removeClass("active");
                    $tabReportNotes.addClass("active");
                    break;
            }
        },

        signalRHubReport: null,

        //Responsible for handling everything about "Report Preview" tab.
        reportPreview:function(forced){
            var self = this;
            this.unblockTabs();
            this.tabSwitch(1);
            self.getReportOption(false, function(data) {
                var $alwaysRun = $("input[name=alwaysRun]").is(":checked");

                var dataChanged = self.dataChanged(data) || $alwaysRun;
                var previewTarget = $("#reportPreview");
                if (dataChanged || forced) {

                    previewTarget.width($(".tab-content").width()).height("1220px");
                    //self.blockFunction(self.busyImage);
                    $("#spinnerClass").show();

                    //console.log("CONN ID", self.signalRHubReport);
                    //$runReport.button("loading");
                    $("#runReportForm").attr("target", "reportPreview")
                        .attr("action", "/reportnet/viewer/" + self.reportId + "/" + self.signalRHubReport.connection.id).submit();

                }

            });
        },

        //Responsible for handling everything about "Report Design" tab.
        reportDesign:function(forced){
            var self = this;
            this.tabSwitch(2);
            if ($runReportForm.attr("action").indexOf("viewer") > -1){
                forced = true;
            }

            var dataChanged = $("#dataChanged");
            var designTarget = $("#reportDesign");
            if (dataChanged.val() == "true" || forced) {
                $tabDesign.unblock();

                designTarget.width($(".tab-content").width()).height("1220px");
                //self.blockFunction(self.busyImage);
                $("#spinnerClass").show();
                //We need to disable side menu
                $('#sideMenu').block({ message: null }); 

                $runReportForm.attr("target", "reportDesign")
                    .attr("action", "/reportnet/designer/"  + self.reportId + "/" + self.signalRHubReport.connection.id).submit();
                dataChanged.val("false");

            }
        },

        //Report Articles Site launch within iframe
        reportNotes:function(){

            this.tabSwitch(3);
            var reportNotesTarget = $("#reportNotes");

            reportNotesTarget.width($(".tab-content").width()).height("1220px");


            if (!reportNotesTarget.attr("src")) {
                //this.blockFunction(this.busyImage);
                reportNotesTarget.attr('src', "/reportNotes/");
            }

        },

        //this tracks json object used in "Configuration tab"
        serializedData: {},

        //tracks error in asp.net. If this is true, then next time user presses "Run Report" or clicks on "Report Preview", report is forced to be re-run
        //even if no data has changed in "Configuration tab".
        aspNetErrorOccured: false,

        //keeps track whether or not any "Configuration tab" data has changed.
        dataChanged: function (newData) {
            //console.log(this.areEqual(newData, this.serializedData));
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
                    value2: filters[f].condition,
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

        //Save Report Config
        saveReportConfig:function(_point){
            var self = this;
            self.workspace.socket().emit('addPoint', {point:_point});
          
            self.workspace.socket().once('pointUpdated', function(data) {
                if (data.err)
                {
                    self.hideDivBlock(data.err);
                }
                else
                {
                    iToast.showNotification('Notification', "Report has been added successfully!!", {
                        icon: 'save',
                        theme: 'jetblack',
                        position: 'top right'
                    });
                    $("body").css({"background-color": "#6b9355"});
                    if($("#tabs  li:eq(1)").is(":visible"))
                        $("#tabs  li:eq(2)").show();
                    self.isNew = false;

                    point = JSON.parse(JSON.stringify(_point));
                }

                $("#saveReport").button("reset");
            
            });
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

        //this is one place to ensure combobox value is legit. It actually prevents user from entering anything outside the list of items.
        ensureComboBoxValue:function(obj, queryProperty,  callback){
            var base = dorsett.reportUI[dorsett.reportUI.alias];
            base.queryDataSource(obj.dataSource, queryProperty, obj.text(), function(index){
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
                        base.queryDataSource(obj.dataSource, queryProperty, queryValue, function(i){
                            callback(i);
                        });
                    }
                }
            });
        },

        //This function is needed as value types are recognized by different name in Asp.net Reporting Components.
        ensureCorrectValueTypeForFilter:function(filter){
            //console.log('FILTER', filter);
            if (_.isEmpty(filter) || typeof filter === 'function' || !filter.name) {
                return;
            }
            var base = dorsett.reportUI[dorsett.reportUI.alias];
            //console.log(typeof filter, filter, _.isEmpty(filter));
            var valType =base.workspace.config.Enums.Properties[filter.name].valueType;
            
            switch(valType){
                case "DateTime":
                case "Timet":
                case "MinSec":
                case "HourMinSec":
                case "HourMin":
                    filter.expression = valType;
                    filter.valueType = "DateTime";                    
                    filter.value = new Date(filter.value).toISOString();
                    break;
                case "Float":
                case "Numeric":
                    filter.valueType = "Numeric";
                    break;
                default:
                    filter.valueType = "String";
                    break;
            }
          //console.log("ensureCorrectValueTypeForFilter", filter);
            return filter;
        },
        ensureCorrectValueTypeForFilterBasedOnOperator: function (f) {
            // console.log("ensureCorrectValueTypeForFilterBasedOnOperator",f.valueType);
            if (_.isEmpty(f)) {
                return;
            }
            var base = dorsett.reportUI[dorsett.reportUI.alias];
            var valType =base.workspace.config.Enums.Properties[f.name].valueType;
            
            switch(valType){
                case "DateTime":
                case "Timet":
                case "MinSec":
                case "HourMinSec":
                case "HourMin":
                return f;
                break;
            }
            var o = "String";
            switch (f.operator) {
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
            f.valueType = o === "Float" ? "Numeric" : "String";
            //console.log(o);
            return f;
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
                case "HourMin":
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

        //template that shows up for Operator Column within Filters Grid
        operatorTemplate: function (container, options) {
            var obj = dorsett.reportUI[dorsett.reportUI.alias];
            if(obj.workspace.config.Enums.Properties[options.model.name] === undefined) {
                return;
            }
            var valType = obj.workspace.config.Enums.Properties[options.model.name].valueType;
            var ops = obj.operators(valType);
            var input = $('<input required data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"/>');
            input.appendTo(container);
            input.kendoDropDownList({
                dataSource: ops,
                dataValueField: "value",
                dataTextField: "text",
                optionLabel: "Select...",
                close:function(){
                    $('body').css('overflow','auto');
                },
                open:function(){
                    $('body').css('overflow','hidden');
                }
            });
        },

        //Selected Column Row
        selectedColumnRow : {},

        //Function is responsible when Column Name is changed in dropdown
        onColumnNamePropertySelect: function (e) {
            //console.log(this);
            var obj = dorsett.reportUI[dorsett.reportUI.alias];
            var g = obj.columnGrid;
            //console.log(obj.selectedColumnRow);
            var dataItem = this.dataItem(e.item.index());
            var gridItem = g.dataItem(obj.selectedColumnRow);//g.select());
            gridItem.valueType = dataItem.value.valueType;
            gridItem.name = dataItem.name;
            //g.refresh();
        },

        //Selected Filter Row
        selectedFilterRow : {},

        //Function is responsible when Filter Column Name is changed in dropdown
        onFilterNamePropertySelect: function (e) {
            var obj = dorsett.reportUI[dorsett.reportUI.alias];
            var g = obj.filterGrid;
            var dataItem = this.dataItem(e.item.index());
            var gridItem = g.dataItem(obj.selectedFilterRow);//g.select());
            //console.log(dataItem);
            gridItem.name = dataItem.name;
            gridItem.valueType = dataItem.value.valueType;
            gridItem.value = "";
            gridItem.internalValue = "";
            //g.refresh();
        },

        //Responsible for adding column row
        addColumnRow: function (e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");
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
                var obj = dorsett.reportUI[dorsett.reportUI.alias];
                var g = obj.columnGrid;
                g.dataSource.insert(this.select().index() + 1,
                    {name: "[Column Not Set]", valueType: "string"});
    }

        },

        //Responsible for adding filter column row
        addFilterRow: function (e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");

            this.select(closestTR);
            var obj = dorsett.reportUI[dorsett.reportUI.alias];
            var g = obj.filterGrid;
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
                var obj = dorsett.reportUI[dorsett.reportUI.alias];
                var g = obj.filterGrid;
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

        addExtraStylingToGrid : function () {
            $(".ob-icon-only", "#columnGrid").parent().css("min-width", 0);

            $(".k-grid-content > table > tbody > tr").hover(
                function () {
                    $(this).toggleClass("k-state-hover");
                }
            );

        },

        addExtraStylingTofilterGrid : function (e) {
            $(".ob-icon-only", "#filterGrid").parent().css("min-width", 0);

            $(".k-grid-content > table > tbody > tr").hover(
                function () {
                    $(this).toggleClass("k-state-hover");
                }
            );

            if (this.dataSource.totalPages() === 1) {
                this.pager && this.pager.element && this.pager.element.hide();
            }
            else{
                this.pager && this.pager.element && this.pager.element.show();
            }

            //$("#reportTitle").focus();

        },

        //Responsible for saving Report Configuration
        saveReport: function (callback) {
            this.registerCallback = callback;
            this.getReportOption(false, function () {
                $('#modal-saveReport').modal('show');

            });
        },

        //cancel Unsaved report
        cancelUnsaveReport:function(){
            var self = this;
            //console.log("DEL", self.point._id);
            $.ajax({
                url:'/api/points/deletepoint',
                type:'POST',
                data:{upi:self.point._id, type:'hard'},
                success:function(e){
                    console.log(e);
                    iToast.showNotification("Cancel Notification", "Unsaved Report is successfully removed from system.");
                },
                error:function(e){
                    console.log(e);
                    iToast.showError("Cancel Notification", "Unsaved Report could not be removed.");
                }


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
        },

        //Handles double clicks on tabs.
        tabDoubleClick: function(tab){
            var blockMessage = "<div class='alert alert-warning><a class='alert-link' onclick='dorsett.reportUI[dorsett.reportUI.alias].unblockTabs();'>Click Here</a> to close the other window and restore this one.</div>";
            var _url = "";
            switch(tab){
                case "#tabPreview":
                    _url = "/reportnet/viewer/"  + this.reportId + "/" + this.signalRHubReport.connection.id;
                    break;
                case "#tabDesign":
                    _url = "/reportnet/designer/"  + this.reportId + "/" + this.signalRHubReport.connection.id;
                    break;
                case "#tabReportNotes":
                    _url = "/reportNotes/";
                    break;
            }
            $(tab).block({css: this.blockCss ,centerY:0,
                message: blockMessage });
            this.unTabbed = window.open(_url, "reportUntabbed");


        },
        changePropertyCheck:function(){
            if (this.templateId.length > 0){
                //this.selectTemplate.select(0);
                iToast.showWarn("Template Warning", "Selected Template may no longer be valid.");
                               
                console.log("Template may no longer be valid");
            }
        }

});

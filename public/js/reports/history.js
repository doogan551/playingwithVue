/**
 * Created by Soven on 6/26/2014.
 */
"use strict";
dorsett.reportUI.history = dorsett.reportUI.extend({
    Name:"dorsett.reportUI.history",
    //Init function to setup grids
    init: function (workspace, point) {
        var self = this;
        this._super(workspace, point);

        //COLUMNS
        this.columnGrid = $("#columnGrid").kendoGrid({
            dataSource: self.fillGrid,
            editable:true,
            selectable:true,
            dataBound: self.addExtraStylingToGrid,
            columns: [
                { field: "name", template:"#=data.name#",
                    editor:function(container, options) {
                        //console.log(options.model);
                        var buttonText = options.model.name;

                        var $clearButtonElem =$('<button><span class="k-icon"></span>Clear Point</button>');
                        $clearButtonElem.kendoButton({
                            icon:"cancel",
                            enable:false,
                            click: function (e) {
                                options.model.internalValue = "0";
                                options.model.name = "[Column Not Set]";
                                options.model.valueType = "UniquePID";
                                self.filterGrid.refresh();
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
                                var selector = workspace.openWindowPositioned('pointLookup?mode=select',
                                    'Point Selector For Report', '', '', 'reportcriteriaselector',
                                    {
                                        width: 780, height: 550, callback: function () {
                                        selector.pointLookup.init(function setPoint(upi, pointName) {
                                            options.model.internalValue = upi.toString();
                                            options.model.name = pointName;
                                            options.model.valueType = "UniquePID";
                                            $inputButton.text(pointName);
                                            self.filterGrid.refresh();
                                        });
                                    }
                                    });
                            }
                        });

                        $inputButton.appendTo(container);
                        $clearButtonElem.appendTo(container);

                    },
                    title: "Column Name"},
                { command: [{ name:"Add", text: "", click: self.addColumnRow,
                    class: "ob-icon-only",
                    imageClass: "k-icon k-si-plus ob-icon-only"
                },
                    { name:"destroy1", text: "", click: self.removeColumnRow,
                        class: "ob-icon-only",
                        imageClass: "k-icon k-si-minus ob-icon-only"
                    }], title: " "}]
        }).data("kendoGrid");

        //FILTERS
        this.filterGrid = $("#filterGrid").kendoGrid({
            dataSource: self.fillfilterGrid,
            editable:true,
            selectable:true,
            dataBound: self.addExtraStylingTofilterGrid,
            edit: function (e) {
                var input = e.container.find("input");
                setTimeout(function () {
                    input.select();
                    input.blur(function(){
                        var closestTR = $(this).closest("tr");
                        self.filterGrid.select(closestTR);
                        var dataItem = self.filterGrid.dataSource.at(self.filterGrid.select().index());
                        console.log("DT", this.value);
                        var dd = Date.parse(this.value);
                        console.log("After parse", dd);
                        if (!isNaN(dd))
                        {
                            dataItem.value = dd;
                        }
                    })

                }, 25);
            },
            columns: [
                { field:"name", width:"180px"
                },
                { field: "operator",width:"100px",
                    editor:self.operatorTemplate,
                    template:self.displayOperator,
                    title: "Operator"
                },
                {
                    field:"value", template:'#= kendo.toString(new Date(data.value), "g") #',
                    editor:function(container, options) {
                        var tt = $('<input data-text-field="' + options.field + '"/>')
                                    .appendTo(container)
                                    .kendoDateTimePicker({
                                        format: "g",
                                        close:function(e){
                                            options.model.value = this.value();
                                        }
                                 }).data("kendoDateTimePicker");


                        if (options.model.value)
                        {
                            tt.value(new Date(options.model.value));
                        }

                    }
                }
            ]
        }).data("kendoGrid");

        this.columnGridSortable();

        var reportIntervals = workspace.config.Enums["Report Intervals"];
        var _data = [];
        for (var p in reportIntervals) {
            _data.push({name: p, value: reportIntervals[p].enum});
        }

        var interval = $("#selectIntervalType").kendoDropDownList({
            dataSource:_data,
            dataTextField:"name",
            dataValueField:"value",
            index:1
        }).data("kendoDropDownList");

        var offset = $("#offset").kendoNumericTextBox({
            min:1,
            max:50,
            format:'n0'
        }).data("kendoNumericTextBox");

        //console.log(point);
        if (this.point["Filter Data"]) {
            var fg = this.point["Filter Data"];
            var fgData = [];
            for (var f in fg) {
                console.log(fg[f]);
                var aa = {};
                aa.condition = fg[f].condition || "";
                aa.name = fg[f].filterName;
                aa.operator = fg[f].operator || "";
                if (fg[f].value)
                {
                    aa.value = new Date(Number(fg[f].value));
                    //aa.value = fg[f].value;
                }
                else
                {
                    aa.value = new Date();
                }
                aa.internalValue = fg[f].internalValue || "";
                aa.valueType = fg[f].valueType || "";
                fgData.push(aa);
            }

            this.filterGrid.dataSource.data(fgData);
            var cg = point["Column Data"];
            var cgData = [];
            for (var c in cg) {
                var cc = {};
                cc.name = cg[c].name;
                cc.valueType = cg[c].valueType;
                cc.internalValue = cg[c].internalValue;
                for(var pointRefIndex in point["Point Refs"]){
                    if (cg[c].index == point["Point Refs"][pointRefIndex].AppIndex){
                        console.log(cc.name,point["Point Refs"][pointRefIndex].PropertyName);
                        cc.name = point["Point Refs"][pointRefIndex].PropertyName;
                    }
                }

                cgData.push(cc);
            }
            //console.log(cgData);
            this.columnGrid.dataSource.data(cgData);

            //interval
            if(point["Report Config"] && point["Report Config"].interval)
                interval.value(point["Report Config"].interval);

            //offset
            if(point["Report Config"] && point["Report Config"].offset)
                offset.value(point["Report Config"].offset);

        }

        $(".container").show();

        //spinner.stop();
    },

    //Responsible for getting all data in Configuration tab. This is what gets passed onto Report Preview page and beyond.
    getReportOption: function (collectDataOnly, callback) {
        var self = this;
        var reportType = "History";
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
        dataSources[reportType] = {};
        dataSources[reportType].columns = [];
        dataSources[reportType].filterMode = "And";
        dataSources[reportType].filterOn = false;
        dataSources[reportType].groups = [];
        dataSources[reportType].sort = [];
        dataSources[reportType].totals = {};
        dataSources[reportType].filters = {};

        var filters = self.filterGrid.dataSource.view();
        console.log(filters);
        var f1 = Math.round(new Date((filters[0].value))/1000);
        var f2 = Math.round(new Date((filters[1].value))/1000);

        console.log(f1, f2);
        if (f1 > f2)
        {
            self.hideDivBlock("Error", "Start Date cannot be greater than End Date.");
            return;
        }

        for (var f in filters){
            //console.log(filters[f]);

            dataSources[reportType].filters[f] = {
                column:filters[f].name.replace(/\s+/gi, "_"),
                condition:filters[f].operator,
                dataType: "Numeric",
                value1: Math.round(new Date((filters[f].value))/1000).toString(),
                value2:"",
                fieldIs:"Value",
                expression:"",
                valueList:""

            };

            //Making sure that data is always treated as epoch format.
            filters[f].value = Math.round(new Date((filters[f].value)));
        }

        console.log(dataSources[reportType].filters);

        //Date field
        self.columnsInfo.push({
            colName: "Date",
            valueType: "DateTime",
            upi : "0"
        });


        for (var c in cols) {
            if (cols[c].name === "[Column Not Set]") {
                continue;
            }
            self.columnsInfo.push({
                colName: "DOR" + cols[c].name.replace(/\s+/gi, "_"),
                valueType: "String",
                upi : cols[c].internalValue
            });
        }


        dataSources[reportType].columns = self.columnsInfo;
        //dataSources.Point_Properties.filters = self.filtersInfo;

        var reportOptions = {};
        reportOptions.componentType = "Data";
        reportOptions.dataSourcesOrder = [reportType];
        reportOptions.language = "C";
        reportOptions.orientation = (cols.length > 5) ? "Landscape" : "Portrait";
        reportOptions.relations = {};
        reportOptions.theme = "Green_50";
        reportOptions.unit = "in";

        //console.log($("#selectIntervalType").val(), $("#interval").val());

        var reportUI = {
            reportType: reportType,
            reportTitle: $("#reportTitle").val(),
            reportTemplate: this.templateId,
            includeFilter: $("#includeFilter").prop("checked"),
            includeReportName: $("#includeReportName").prop("checked"),
            returnLimit:$("input[name=returnLimit]:checked").val(),
            interval : $("#selectIntervalType").val(),
            offset : $("#offset").val(),
            dataSources: dataSources,
            reportOptions: reportOptions
        };
        console.log("History", reportUI);
        callback(reportUI);
    },

    //Schema for Column Grid
    fillGrid: new kendo.data.DataSource({
        data: [{name: "[Column Not Set]", precision: 0, valueType: "string"}],
        pageSize: 10,
        schema: {
            model: {
                fields: {
                    name: {validation: {required: true}, defaultValue:""},
                    internalValue :{defaultValue:""},
                    valueType: {defaultValue: "string"}
                }
            }
        }
    }),

    //Schema for Filter Grid
    fillfilterGrid : new kendo.data.DataSource({
            data: [ {name:"Start Date", operator:"EqualTo", valueType:"DateTime", value:new Date()},
                {name:"End Date", operator:"EqualTo", valueType:"DateTime", value:new Date()}],
            pageSize:2,
            schema: {
                model: {
                    fields: {
                        name: { editable:false, type:"string"} },
                    operator: { type: "string" },
                    value: { type:"DateTime"}
                }
            }
        }),

    //Save Report Config
    saveReportConfig:function(){
        var self = this;
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
                    internalValue : cg[c].internalValue,
                    valueType: cg[c].valueType,
                    index : c
                });
                //Point Refs
                point["Point Refs"].push({
                    "PropertyName" : cg[c].name,
                    "Value" : cg[c].internalValue,
                    "PointName" : cg[c].value,
                    "AppIndex" : c
                });
            }
            for (var f in fg) {
                console.log(fg[f].value);
                point["Filter Data"].push({
                    condition: fg[f].condition,
                    firstRow: fg[f].firstRow,
                    filterName: fg[f].name,
                    operator: fg[f].operator,
                    value: fg[f].value,
                    valueType: fg[f].valueType
                });
            }

            self._super(point);
        });

    },

    //Handles double clicks on tabs.
    tabDoubleClick: function(tab){

        var designerMessage ="<div class='alert alert-warning'><h5>Designer opened in new window. <br/> " +
            "<a class='alert-link' onclick='dorsett.reportUI.history.unblockTabs();'>Click Here</a> to close the other window and restore this one.</h5>" +
            "<br/> <h6 class='warning'>Warning:<br/>You will lose any unsaved changes.</h6></div>";

        var previewMessage = "<div class='alert alert-warning><h5>Preview opened in new window. <br/> " +
            "<a class='alert-link' onclick='dorsett.reportUI.history.unblockTabs();'>Click Here</a> to close the other window and restore this one.</h5></div>";


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


    }

});

var wspace = (window.opener && window.opener.parent.workspaceManager) || window.parent.parent.workspaceManager;
window.dorsett.reportUI.history = new dorsett.reportUI.history(wspace, point);

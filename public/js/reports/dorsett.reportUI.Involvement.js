/**
 * Created by Soven on 6/26/2014.
 */
"use strict";
dorsett.reportUI.Involvement = dorsett.reportUI.extend({
    Name:"dorsett.reportUI.Involvement",
    alias: "Involvement",
    //Init function to setup grids
    init: function (workspace, point) {
        var self = this;
        this._super(workspace, point);

        //COLUMNS
        this.columnGrid = $("#columnGrid").kendoGrid({
            dataSource: self.fillGrid,
            editable:"inline",
            selectable:true,
            dataBound: function(e){
                    e.sender.editRow("#columnGrid tr:eq(1)");
            },
            columns: [
                { field: "name", template:"#=data.name#",
                    editor:function(container, options) {
                        var buttonText = options.model.name;
                        var $inputButton = $('<button>' + buttonText + '</button>');

                        $inputButton.kendoButton({
                            click: function (e) {
                                var selector = workspace.openWindowPositioned('pointLookup?mode=select',
                                'Point Selector For Report', '', '', 'reportcriteriaselector',
                                {
                                    width: $(window).width()-400, height: 600, callback: function () {
                                        selector.pointLookup.init(function setPoint(upi, pointName) {
                                            options.model.internalValue = upi.toString();
                                            options.model.name = pointName;
                                            options.model.valueType = "UniquePID";
                                            $inputButton.text(pointName);
                                            self.reportPreview(true);
                                        });
                                    }
                                });
                            }
                        });

                        $inputButton.appendTo(container);
                        $inputButton.trigger('click');

                    },
                    title: "Point Name"}
                ]
        }).data("kendoGrid");

        //$(".container-fluid").show();
    },

    fillGrid: new kendo.data.DataSource({
        data: [{name: "[Point Not Set]", valueType: "string"}],
        schema: {
            model: {
                fields: {
                    name: {validation: {required: true}},
                    valueType: {defaultValue: "string"}
                }
            }
        }
    }),


    adjustTemplateDropDown: function(){
        var self = this;
        var dataItem = self.selectTemplate.dataSource.at(0);
        self.selectTemplate.dataSource.remove(dataItem);
        self.selectTemplate.select(0);
        self.templateId = self.selectTemplate.dataSource._data[0]._id;
    },

    //Responsible for getting all data in Configuration tab. This is what gets passed onto Report Preview page and beyond.
    getReportOption: function (collectDataOnly, callback) {
        var self = this;
        var reportType = "Involvement";
        self.columnsInfo = [];

        if (!collectDataOnly && $("#reportTitle").val() == "") {
            self.hideDivBlock("Error", "Report Title is required field.");
            return;
        }
        var cols = self.columnGrid.dataSource.view();
        if (!collectDataOnly && cols[0].name === "[Point Not Set]") {
            self.hideDivBlock("Error", "Missing Point Definition");
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


        for (var c in cols) {
            if (!cols[c].name) {
                continue;
            }
            console.log(cols[c]);
            self.columnsInfo.push({
                colName: "DOR" + cols[c].name.replace(/\s+/gi, "_"),
                valueType: "String",
                upi : cols[c].internalValue
            });
        }


        dataSources[reportType].columns = self.columnsInfo;

        var reportOptions = {};
        reportOptions.componentType = "Data";
        reportOptions.dataSourcesOrder = [reportType];
        reportOptions.language = "C";
        reportOptions.orientation = (cols.length > 5) ? "Landscape" : "Portrait";
        reportOptions.relations = {};
        reportOptions.theme = "Green_50";
        reportOptions.unit = "in";

        var reportUI = {
            reportType: reportType,
            reportTitle: $("#reportTitle").val(),
            reportTemplate: this.templateId,
            includeFilter: false,
            includeReportName: false,
            returnLimit:null,
            interval : 1,
            offset : 1,
            dataSources: dataSources,
            reportOptions: reportOptions
        };
        console.log("Involvement", reportUI);
        callback(reportUI);
    },

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

    }

});

var wspace = (window.opener && window.opener.parent.workspaceManager) || window.parent.parent.workspaceManager;
window.dorsett.reportUI.Involvement = new dorsett.reportUI.Involvement(wspace, point);

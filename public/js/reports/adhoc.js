/**
 * Created by Soven on 6/26/2014.
 */
"use strict";

dorsett.reportUI.adhoc = dorsett.reportUI.extend({
        NAME: "dorsett.reportUI.adhoc",
        props:[],
        //Init function to setup grids
        init: function (workspace, point) {
            var base = this;

            this._super(workspace, point);

            var enumProps = workspace.config.Enums.Properties;
                for (var p in enumProps) {
                    if (enumProps[p].reportEnable) {
                        base.props.push({name: p, value: enumProps[p]});
                    }
                }

            //COLUMNS
            base.columnGrid = $("#columnGrid").kendoGrid({
                dataSource: base.fillGrid,
                editable: true,
                selectable: true,
                edit: function (e) {
                    var input = e.container.find("input");
                    //    setTimeout(function () {
                    //        input.select();
                    //}, 25);
                    $(input).on("mouseup", function(){
                        $(this).select();
                    });
                },
                //dataBound: self.addExtraStylingToGrid,
                columns: [
                    {
                        field: "name", template: "#=data.name#", title: "Column Name",
                        editor: function (container, options) {
                            var input = $('<input/>');
                            input.attr("name", options.field);
                            input.appendTo(container);
                            input.kendoComboBox({
                                dataSource: base.props,
                                dataTextField: "name",
                                dataValueField: "value",
                                filter: "contains",
                                placeHolder: "Select Name",
                                select: base.onColumnNamePropertySelect,
                                change: function () {
                                    var obj = this;
                                    //console.log(this);
                                    var g = base.columnGrid;
                                    var gridItem = g.dataItem(base.selectedColumnRow);//g.select());
                                    //console.log(gridItem, obj);
                                    base.ensureComboBoxValue(obj, "name", function(index){
                                        //console.log(index);
                                        if (index === -1) {
                                           gridItem.name = '[Column Not Set]';
                                        }
                                        else
                                        {
                                            //console.log(gridItem, obj.dataSource._data[index]);
                                            //obj.select(obj.ul.children().eq(index));
                                            gridItem.name = obj.dataSource._data[index].name;
                                            gridItem.valueType = obj.dataSource._data[index].value.valueType;
                                            //g.refresh();
                                        }

                                    });
                                }
                            });
                        }
                    },
                    {
                        command: [{
                            name: "Add", text: "", click: base.addColumnRow,
                            class: "ob-icon-only",
                            imageClass: "k-icon k-si-plus ob-icon-only"
                        },
                            {
                                name: "destroy1", text: "", click: base.removeColumnRow,
                                class: "ob-icon-only",
                                imageClass: "k-icon k-si-minus ob-icon-only"
                            }], title: " "
                    }
                ],
                change:function(e){
                    base.selectedColumnRow = this.select();
                }
            }).data("kendoGrid");

            var filterDS = new kendo.data.DataSource({
                data:base.props,
                filter:{field:"name", operator:"neq", value:"Point Type"}
            });
            var filterProps = {};
            filterDS.fetch(function(){
                filterProps = filterDS.view();
            });

            //FILTERS
            base.filterGrid = $("#filterGrid").kendoGrid({
                dataSource: base.fillfilterGrid,
                editable: true,
                selectable: true,
                navigatable: true,
                edit: function (e) {
                    var input = e.container.find("input");
                    //    setTimeout(function () {
                    //        input.select();
                    //}, 25);
                    $(input).on("mouseup", function(){
                        $(this).select();
                    });
                },
                change:function(e){
                    base.selectedFilterRow = this.select();
                },
                dataBound: base.addExtraStylingTofilterGrid,
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
                                dataSource: filterProps,
                                dataTextField: "name",
                                dataValueField: "value",
                                filter: "contains",
                                placeHolder: "Select Name",
                                select: base.onFilterNamePropertySelect,
                                change: function () {
                                    var obj = this;
                                    var g = base.filterGrid;
                                    var gridItem = g.dataItem(base.selectedFilterRow);
                                    base.ensureComboBoxValue(obj, "name", function(index){
                                        if (index === -1) {
                                            gridItem.name = '[Filter Column Not Set]';
                                        }
                                        else
                                        {
                                            gridItem.name = obj.dataSource._data[index].name;
                                            gridItem.valueType = obj.dataSource._data[index].value.valueType;
                                            gridItem.value = "";
                                            gridItem.internalValue = "";
                                            $(container).parent().find("td:eq(3)").html("");
                                        }

                                    });

                                }

                            });
                        },
                        title: "Column Name"
                    },
                    {
                        field: "operator", width: "100px",
                        editor: base.operatorTemplate,
                        template: base.displayOperator,
                        title: "Operator"
                    }, {
                        field: "value", width: "245px", template: kendo.template($("#valueViewTemplate").html()),
                        editor: base.valueTemplate
                    },
                    {
                        width: "140px", command: [{
                        name: "Add", text: "", click: base.addFilterRow,
                        class: "ob-icon-only",
                        imageClass: "k-icon k-si-plus ob-icon-only"
                    },
                        {
                            name: "destroy1", text: "", click: base.removeFilterRow,
                            class: "ob-icon-only",
                            imageClass: "k-icon k-si-minus ob-icon-only"
                        }], title: " "
                    }
                ]
            }).data("kendoGrid");

            base.columnGridSortable();

            base.filterGridSortable();

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
                                aa.value = point["Point Refs"][pointRefIndex].PropertyName;
                            }
                        }
                    }
                    f == 0 ? aa.firstRow = true : aa.firstRow = false;
                    if(f == 0) aa.condition = "";

                    fgData.push(aa);
                }
                base.filterGrid.dataSource.data(fgData);
                var cg = point["Column Data"];
                var cgData = [];
                for (var c in cg) {
                    var cc = {};
                    cc.name = cg[c].name;
                    cc.valueType = cg[c].valueType;
                    cgData.push(cc);
                }
                base.columnGrid.dataSource.data(cgData);
            }


            var pointFilterCallBack  = function (pf) {
                if(!base.areEqual(pf, base.pointFilter) && pf.pointTypes.length !== 0)
                {
                    base.pointFilter = pf;
                }
                if (pf.pointTypes && pf.pointTypes.length === 38){
                    base.pointFilter.pointTypes = [];
                }
            };

            var winCallback = function () {
                pointFilterWin.pointLookup.init(pointFilterCallBack, base.pointFilter);
            };

            var pointFilterWin=
                workspace.openWindowPositioned("/pointLookup?mode=filter",
                    "Point Selector", "pointSelector", "filter", "filter", {
                        width: 960,
                        height: 400,
                        callback: winCallback
                    });

            $(".container").show();

        },

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
            dataSources.Property = {};
            dataSources.Property.columns = [];
            dataSources.Property.filterMode = "And";
            dataSources.Property.filterOn = false;
            dataSources.Property.groups = [];
            dataSources.Property.sort = [];
            dataSources.Property.totals = {};
            dataSources.Property.filters = {};

            var filters = self.filterGrid.dataSource.view();

            for (var f in filters) {
                if (filters[f].name === "[Filter Column Not Set]") {
                    continue;
                }
                var val = filters[f].internalValue === "" ? filters[f].value : filters[f].internalValue;
                if (val === "")
                {
                    self.hideDivBlock("Error", "One of the filters is missing value");
                    return;
                }
                filters[f] = self.ensureCorrectValueTypeForFilter(filters[f]);
                self.filtersInfo[f] = {
                    column: filters[f].name.replace(/\s+/gi, "_"),
                    condition: filters[f].operator,
                    dataType: filters[f].valueType,
                    value1: val,
                    value2: f ===0 ? "" : filters[f].condition,
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
                    valueType: vt
                });
            }
            dataSources.Property.columns = self.columnsInfo;
            dataSources.Property.filters = self.filtersInfo;

            var reportOptions = {};
            reportOptions.componentType = "Data";
            reportOptions.dataSourcesOrder = ["Property"];
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
                reportType: "Property",
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

        //Schema for Column Grid
        fillGrid: new kendo.data.DataSource({
            data: [{name: "[Column Not Set]", valueType: "string"}],
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        name: {validation: {required: true}},
                        valueType: {defaultValue: "string"}
                    }
                }
            }
        }),

        //Schema for Filter Grid
        fillfilterGrid: new kendo.data.DataSource({
            data: [{
                firstRow: true,
                condition: "",
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
                        valueType: {defaultValue: "string"},
                        firstRow:true
                    }
                }
            }
        }),


        //template that shows up for "Value" Column
        valueTemplate: function (container, options) {
            var self = dorsett.reportUI.adhoc;
            if(self.workspace.config.Enums.Properties[options.model.name] === undefined) {
                return;
            }
            var valType = self.workspace.config.Enums.Properties[options.model.name].valueType;
            //options.model.valueType = valType;
            switch (valType) {
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
                            var self = dorsett.reportUI.adhoc;
                            var selector = self.workspace.openWindowPositioned('pointLookup/null/' + options.model.name + "?mode=select",
                                'Point Selector For Report', '', '', 'reportcriteriaselector',
                                {
                                    width: 780, height: 550, callback: function () {
                                    selector.pointLookup.init(function setPoint(upi, pointName) {
                                        options.model.internalValue = upi.toString();
                                        options.model.value = pointName;
                                        options.model.valueType = "UniquePID";
                                        self.filterGrid.refresh();
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
                        .kendoNumericTextBox({
                            format: "n",
                            decimals: 2
                        });

                    break;
                case "Enum":
                    var vv = [];
                    var enumValues = self.workspace.config.Utility.pointTypes.getEnums(options.model.name);
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
                        precision: cg[c].precision,
                        valueType: cg[c].valueType
                    });
                }
                for (var f in fg) {
                    console.log(fg[f]);
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
                    var pp = self.workspace.config.Enums.Properties[fg[f].name];
                    if (pp && pp.valueType === "UniquePID") {
                        point["Point Refs"].push({
                            "PropertyName" : fg[f].name,
                            "Value" : fg[f].internalValue,
                            "PointName" : fg[f].value,
                            "AppIndex" : f
                        });
                    }
                }

                self._super(point);
            });

        },

        //Handles double clicks on tabs.
        tabDoubleClick: function(tab){

            var designerMessage ="<div class='alert alert-warning'><h5>Designer opened in new window. <br/> " +
                "<a class='alert-link' onclick='dorsett.reportUI.adhoc.unblockTabs();'>Click Here</a> to close the other window and restore this one.</h5>" +
                "<br/> <h6 class='warning'>Warning:<br/>You will lose any unsaved changes.</h6></div>";

            var previewMessage = "<div class='alert alert-warning><h5>Preview opened in new window. <br/> " +
                "<a class='alert-link' onclick='dorsett.reportUI.adhoc.unblockTabs();'>Click Here</a> to close the other window and restore this one.</h5></div>";


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
window.dorsett.reportUI.adhoc = new dorsett.reportUI.adhoc(wspace, point);



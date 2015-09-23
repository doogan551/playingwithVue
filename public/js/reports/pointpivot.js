/**
 * Created by Soven on 6/26/2014.
 */
var dorsett = dorsett || {};


dorsett.reportUI = (function(){
    return {
        props:[],
        columnGrid:{},
        filterGrid:{},
        init:function(){
            var self = this;

            var addExtraStylingToGrid = function () {
                $(".ob-icon-only", "#columnGrid").parent().css("min-width", 0);

                $(".k-grid-content > table > tbody > tr").hover(
                    function() {
                        $(this).toggleClass("k-state-hover");
                    }
                );

            };

            var addExtraStylingTofilterGrid = function (e) {
                //console.log(e);
                //this._data[0].condition = "";
                $(".ob-icon-only", "#filterGrid").parent().css("min-width", 0);

                $(".k-grid-content > table > tbody > tr").hover(
                    function() {
                        $(this).toggleClass("k-state-hover");
                    }
                );

            };



            var editTemplate = kendo.template($("#edit-template").html());

            self.columnGrid = $("#columnGrid").kendoGrid({
                dataSource: self.fillGrid,
                editable:true,
                selectable:true,
                dataBound: addExtraStylingToGrid,
                columns: [
                    { field: "name", width:"260px", template:"#=data.name#",
                        editor:function(container, options) {
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

                        },
                        title: "Column Name"},
                    {
                        field:"precision", template:editTemplate, width:"60px",
                        editor:function(container,options){
                            if (options.model.name === "" || options.model.name === "[Property Not Set]"){
                                return;
                            }
                            if (options.model.valueType !== "Float"){
                                return;
                            }
                            var input = $("<input  />");
                            input.attr("name", options.field);
                            input.appendTo(container);
                            input.kendoNumericTextBox({min:1, max:9});
                        }

                    },
                    { command: [{ name:"Add", text: "", click: self.addNew,
                        class: "ob-icon-only",
                        imageClass: "k-icon k-si-plus ob-icon-only"
                    },
                        { name:"destroy", text: "", click: self.removeThis,
                            class: "ob-icon-only",
                            imageClass: "k-icon k-si-minus ob-icon-only"
                        }], title: " "}]
            }).data("kendoGrid");

            self.columnGrid.table.kendoSortable({
                filter: ">tbody >tr",
                //hint: $.noop,
                cursor: "move",
                hint:function(element) {
                    return element.clone().addClass("hint");
                },
                placeholder: function(element) {
                    return element.clone().addClass("k-state-hover").css("opacity", 0.65);
                },
                container: "#columnGrid tbody",
                change: function(e) {

                    //console.log(viewModel.dataSource);
                    var dataItem = self.columnGrid.dataSource.getByUid(e.item.data("uid"));
                    self.columnGrid.dataSource.remove(dataItem);
                    self.columnGrid.dataSource.insert(e.newIndex, dataItem);
                }
            });

            //FILTER
            this.filterGrid = $("#filterGrid").kendoGrid({
                dataSource: self.fillfilterGrid,
                editable:true,
                selectable:true,
                dataBound: addExtraStylingTofilterGrid,
                edit: function (e) {
                    var input = e.container.find("input");
                    setTimeout(function () {
                        input.select();
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
                        field:"value", format: "{0:MM/dd/yyyy}",
                        editor:function(container, options) {
                            $('<input name="' + options.field + '"/>')
                                .appendTo(container)
                                .kendoDatePicker({
                                    format:"MM/dd/yyyy"
                                });
                        }
                   }
                ]
            }).data("kendoGrid");





            //columnGrid.hideColumn(2);
            $("#getData").kendoButton({
                spriteCssClass: "k-icon k-i-refresh",
                click:function(e){
                    alert("To be Implemented.");
//                    $("#gridData").html(JSON.stringify(self.filterGrid.dataSource.view()));
//                    $("#gridData2").html(JSON.stringify(self.columnGrid.dataSource.view()));
                }
            });

            $("#scheduleReport").kendoButton({
                spriteCssClass: "k-icon k-i-calendar",
                click:function(e){
                    self.getReportOption(function(){
                        //$("#reportType").val("Ad-hoc");
                        $('#modal-scheduleReport').modal('show');
                    });
                }
            });

            $("#loadData").kendoButton({
                spriteCssClass: "k-icon k-i-funnel",
                click:function(e){
                    alert("To be Implemented.");

                    //var d = '[{"firstRow":true,"condition":"AND","name":"Alarm Adjust Band","operator":"EqualTo","value":"2","internalValue":"","valueType":"Float"},{"condition":"AND","name":"Alarm Adjust Point","operator":"NotEqualTo","value":"4200","internalValue":"NAME1_4200_begin","valueType":"UniquePID"}]';

                    //var d = '[{"condition":"","name":"States","operator":"EqualTo","value":"Auto","internalValue":"","valueType":"Enum","name_input":"States"}]';
                    //self.filterGrid.dataSource.data(JSON.parse(d));
                    //var c = '[{"name":"Active Value","precision":1,"valueType":"Enum"},{"name":"Alarm Adjust Band","precision":1,"valueType":"Float"}]';
                    //var c= '[{"name":"Name","precision":1,"valueType":"String"},{"name":"Active Value","precision":1,"valueType":"Enum"},{"name":"Fast Pulse","precision":1,"valueType":"Bool"},{"name":"Controller","precision":1,"valueType":"String"},{"name":"Value","precision":1,"valueType":"None"}]';
                    //self.columnGrid.dataSource.data(JSON.parse(c));
                }
            });


            //var reportDialog = $("#window").kendoWindow({
            //    visible:false
            //}).data("kendoWindow");

            //var ww = $(window).width()-25;
            //var hh = $(window).height()-25;
            //console.log(ww);

            $("#runReport").kendoButton({
                spriteCssClass:"k-icon k-i-plus",
                click:function(e){
                    self.getReportOption(function(){
                        $("#runReportForm").attr("action","http://localhost/reports2/" + guid()).submit();
                    });
                    //console.log(reportUI);

//                    reportDialog.setOptions({
//                        title:$("#reportTitle").val(),
//                        width:ww,
//                        height:hh,
//                        modal: true,
//                        pinned: false,
//                        position: {
//                            top: 10,
//                            left: 10
//                        }
//                    });
//
//                    reportDialog.refresh({
//                        url: "/reports2/" + guid(),
//                        data: JSON.stringify(reportUI),
//                        type:'POST'
//                    });
//
//                    reportDialog.open();
//
                }

            });

            spinner.stop();
        },
        displayErrorMessage:function(msg){
            $("#message").addClass("alert-danger alert-dismissible").show()
                .html("<b>" + msg + "</b>")
                .delay(3000)
                .fadeOut("slow");
            return;
        },
        getReportOption:function(callback){
            var self = this;
            if ($("#reportTitle").val() == ""){
                self.displayErrorMessage("Report Title is required field.");
                return;
            }

            var cols = self.columnGrid.dataSource.view();
            if (cols[0].name === "[Column Not Set]"){
                self.displayErrorMessage("Atleast one Column needs to be defined.");
                return;
            }

            //console.log(cols);
            var dataSources = {};
            dataSources.Point_Properties = {};
            dataSources.Point_Properties.columns = [];
            dataSources.Point_Properties.columnIDs = [];
            dataSources.Point_Properties.filterMode="And";
            dataSources.Point_Properties.filterOn=false;
            dataSources.Point_Properties.groups = [];
            dataSources.Point_Properties.sort = [];
            dataSources.Point_Properties.totals = {};
            dataSources.Point_Properties.columns.push("Date");
            for (var c in cols){
                //console.log(cols[c]);
                var cc = cols[c].name.replace(/\s+/gi, "_");
                console.log(cc);
                dataSources.Point_Properties.columns.push("DOR" + cc);
                dataSources.Point_Properties.columnIDs.push({_id:cols[c].value.toString(),
                    col: cols[c].name});
            }
            dataSources.Point_Properties.filters = {};
            var filters = self.filterGrid.dataSource.view();
            //console.log(filters);
            for (var f in filters){
                //console.log(filters[f]);
                dataSources.Point_Properties.filters[f] = {
                    column:filters[f].name.replace(/\s+/gi, "_"),
                    condition:filters[f].operator,
                    dataType: "Numeric",
                    value1: Math.round(new Date((filters[f].value))/1000).toString(),
                    value2:"",
                    fieldIs:"Value",
                    expression:"",
                    valueList:""

                };
                //console.log(dataSources.Point_Properties.filters[f]);

            }
            //console.log(dataSources);
            var reportOptions = {};
            reportOptions.componentType = "Data";
            reportOptions.dataSourcesOrder = ["Point Properties"];
            reportOptions.language = "C";
            if (cols.length < 6)
            {
                reportOptions.orientation = "Portrait";
            }
            else
            {
                reportOptions.orientation = "Landscape";
            }
            reportOptions.relations = {};
            reportOptions.theme = "Green_50";
            reportOptions.unit = "in";

            var reportUI = {
                reportType:"pointPivot",
                reportTitle: $("#reportTitle").val(),
                includeFilter:$("#includeFilter").prop("checked"),
                includeFooterDetails:$("#includeFooterDetails").prop("checked"),
                dataSources:dataSources, reportOptions:reportOptions};
            $("#params").val(JSON.stringify(reportUI));
            callback();
        },

        fillGrid : new kendo.data.DataSource({
            data: [{name:"[Column Not Set]",precision: 1,value:-1, valueType:"string"}],
            pageSize:10,
            schema: {
                model: {
                    fields: {
                        name: { validation:{required : true} },
                        precision: { type: "number", validation: { min: 1, max:9} },
                        valueType: { defaultValue: "string"}
                    }
                }
            }
        }),
        fillfilterGrid : new kendo.data.DataSource({
            data: [ {name:"Start Date", operator:"EqualTo", valueType:"date", value:new Date()},
                    {name:"End Date", operator:"EqualTo", valueType:"date", value:new Date()}],
            pageSize:2,
            schema: {
                model: {
                    fields: {
                        name: { editable:false, type:"string"} },
                        operator: { type: "string" },
                        value: { type:"date"}
                    }
                }
            }
        ),
        operators: function(op){
            console.log(op);
            var opArray = [];
            switch(op){
                case "Bool":
                case "BitString":
                case "String":
                case "UniquePID":
                case "Enum":
                case "undecided":
                    opArray.push({text:"=",value:"EqualTo"}, {text:"!=", value:"NotEqualTo"});
                    break;
                case "Float":
                case "Integer":
                case "Unsigned":
                case "null":
                case "MinSec":
                case "HourMinSec":
                    opArray.push({text:"=",value:"EqualTo"}, {text:"!=", value:"NotEqualTo"},
                        {text:">", value:"GreaterThan"},{text:"<", value:"LessThan"},
                        {text:">=", value:"GreaterThanOrEqualTo"},{text:"<=", value:"LessThanOrEqualTo"});
                    break;
            }
            return opArray;
        },
        displayOperator: function(op){
            //console.log(op.operator);
            switch(op.operator){
                case "EqualTo": return "="; break;
                case "NotEqualTo": return "!="; break;
                default: return op.operator; break;
            }
        },
        operatorTemplate:function(container, options) {
            //console.log(options.model);
            var input = $('<input required data-text-field="text" data-value-field="value" data-bind="value:' + options.field + '"/>');
            input.appendTo(container);

            var ops = self.dorsett.reportUI.operators("HourMinSec");
            //console.log(ops);
            input.kendoDropDownList({
                dataSource: ops,
                dataValueField: "value",
                dataTextField:"text"
            });
        },
        onPropertySelect:function(e) {
            //console.log(this.value());
            var g = self.dorsett.reportUI.columnGrid;
            var dataItem = this.dataItem(e.item.index());
            var gridItem = g.dataItem(g.select());
            gridItem.valueType =dataItem.value.valueType;
            gridItem.name = dataItem.name;
            gridItem.value = dataItem.value;
            g.refresh();
        },
        onPropertySelect2:function(e) {
            var g = self.dorsett.reportUI.filterGrid;

            var dataItem = this.dataItem(e.item.index());
            var gridItem = g.dataItem(g.select());
            //console.log(dataItem);
            gridItem.name = dataItem.name;
            gridItem.valueType =dataItem.value.valueType;
            gridItem.value = "";
            gridItem.internalValue = "";
            g.refresh();
        },
        removeThis: function(e){
            e.preventDefault();
            columnGrid.clearSelection();
        },
        addNew: function(e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");
            //console.log(this);
            this.select(closestTR);
            this.dataSource.insert(this.select().index()+1,
                { name: "[Property Not Set]", precision:1, valueType:"string" });
            this.clearSelection();
        },
        removeThis2: function(e){
            e.preventDefault();
            self.dorsett.reportUI.filterGrid.clearSelection();
        },
        addNew2: function(e) {
            e.preventDefault();
            var closestTR = $(e.currentTarget).closest("tr");

            this.select(closestTR);
            var g = self.dorsett.reportUI.filterGrid;
            g.dataSource.insert(this.select().index()+1,
                { condition:"AND", firstRow:false, name: "[Property Not Set]", operator:"EqualTo", value:"", internalValue:"", valueType:"String" });
            g.clearSelection();
        }


}

})();

var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
    };
    })();



$(document).ready(function () {

//    $('.k-input').on('focus', function () {
//        var input = $(this);
//        setTimeout(function () { input.select(); });
//    });

//    $('.k-input').on('keydown', function (e) {
//        console.log(event.keyCode);
//        if(event.keyCode == 13)
//            $('.k-edit-field .k-input').next().focus(); //This statement will be used where you want to provide focus
//    });
    dorsett.reportUI.init();

});


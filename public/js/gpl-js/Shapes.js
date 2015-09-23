draw2d.shape.node.IconObject = draw2d.shape.icon.Icon.extend({
    NAME: "draw2d.shape.node.IconObject",
    imgsrc: null,
    icon:'',
    memento: {},
    shapeCat: '',
    NonPoint: true,
    refType: '',
    minRequiredConnection: 1,
    requiredPorts:[],
    internalExclude:false,
    customTopLocator: draw2d.layout.locator.Locator.extend({
        init: function (parent) {
            this._super(parent);
        },
        relocate: function (index, target) {
            var parent = this.getParent();
            var boundingBox = parent.getBoundingBox();

            var targetBoundingBox = target.getBoundingBox();
            target.setPosition(boundingBox.w / 2 - (targetBoundingBox.w / 2), -(targetBoundingBox.h + 2) + 5);

            //this.applyConsiderRotation(port, -15, -10);
        }

    }),
    init: function (src) {
        this._super();
        this.imgsrc = src;
        var figureImg = new draw2d.shape.basic.Image();
        figureImg.init(src, 60, 60);
        this.addFigure(figureImg, new draw2d.layout.locator.CenterLocator(this));

        this.setDimension(10, 22);

        this.topLocator = new this.customTopLocator(this); //draw2d.layout.locator.TopLocator(this);

        this.label = new draw2d.shape.basic.Label("1");
        //this.label.setColor("#0d0d0d");
        this.label.setFontColor("#1f5908");
        this.label.setFontSize(9);
        this.label.setFontFamily("Trebuchet");
        this.label.setBold(true);
        //this.label.installEditor(new draw2d.ui.PropEditor());
        this.addFigure(this.label, this.topLocator);


    },
    onDoubleClick: function () {
        if (GPLViewModel.isViewer()) return;
        var figures = this.canvas.getFigures();
        for (i = 0; i < figures.getSize(); i++) {
            var f = null;
            f = figures.get(i);
            f.unselect();
        }
        this.select();

        GPLViewModel.selectProp(this.id);
        GPLViewModel.beforeEditProp = JSON.stringify(this.getPersistentAttributes(), null, 2);
        var sp = GPLViewModel.selectedProp();
        var propArray = sp.propertiesArray();
        var dd = this.props();

        sp.previousVersion(JSON.stringify(this.getPersistentAttributes().props));
        sp.iconChange(this.iconChange);
        var arr = [];
        var shapeCat = this.shapeCat;
        sp.shapeCategory = shapeCat;

        ko.utils.arrayFirst(GPLViewModel.propertiesCol(), function (prop) {
            var fig = window.app.view.getFigure(prop.id());
            if (fig != null)
            {
                    if (shapeCat == fig.shapeCat && !fig.internalExclude && prop.id() != GPLViewModel.selectedProp().id() && arr.indexOfKey(prop.lbl()) == -1)
                    {
                        arr.push(new KeyVal(prop.lbl(), prop.id()));
                    }
            }
        });
        sp.internalRefs(arr);
        sp.isAccessed(true);

        //console.log(sp.constantFloat());
        var arrReferences = [];

        for (var i=0; i< this.iconList.length; i++){
            for (var k in this.iconList[i]){
                var kk = "Constant";
                if (k.indexOf("ExternalPoint") > -1) kk = "External Point";
                if (k.indexOf("ExternalGPL") > -1) kk = "External GPL";
                if (k.indexOf("InternalRef") > -1) kk = "Internal Reference";

                arrReferences.push(new KeyVal(kk, k));
            }
        }
        sp.referenceList(arrReferences);

        //console.log(sp.referenceList());
        //console.log(this.refType);
        console.log(this.NAME, this.refType);
        sp.referenceType(this.refType);//sp.internalReferenceType);
        sp.getPointDetails(sp.upi());

        for(var key in dd)
        {
            //console.log(key, dd[key].Value);
            propArray.push(new PropValue(key, dd[key].Value));
        }
        sp.propertiesArray(propArray);

        //console.log(GPLViewModel.getSelectedDProp("Reference Type"));
        var win = window.open("/pointSelector/nonpointproperties", 'NonPointPropertyWindow', 'height=590,width=452');
        win.onload = function () {
            win.draw2d.pointProperties.init(sp, true);
        }


//        var pointPropForm = document.createElement("form");
//        pointPropForm.target = "PointPropertiesWindow";
//        pointPropForm.method = "GET";
//        pointPropForm.action = "/pointSelector/nonpointproperties";
//        var newPointInput1 = document.createElement("input");
//        newPointInput1.type = "hidden";
//        newPointInput1.name = "title";
//        newPointInput1.value = "TITLE";
//        pointPropForm.appendChild(newPointInput1);
//
//        var newPointInput2 = document.createElement("input");
//        newPointInput2.type = "hidden";
//        newPointInput2.name = "nonPointType";
//        newPointInput2.value = "Monitor";
//        pointPropForm.appendChild(newPointInput2);
//
//        document.body.appendChild(pointPropForm);
//        console.log(GPLViewModel.selectedProp().propertiesArray());
//        pointPropForm.submit();

    },
    openPointReview: function () {
        var upi = GPLViewModel.getProp(this.id).upi();
        GPLViewModel.openPointReview(upi);
    },
    //    onDoubleClick: function () {
//        //console.log(this);
//        var figures = this.canvas.getFigures();
//        for(i=0; i< figures.getSize(); i++){
//            var f= null;
//            f = figures.get(i);
//            f.unselect();
//        }
//        this.select();
//
//        GPLViewModel.selectProp(this.id);
//        var sp = GPLViewModel.selectedProp();
//        var arr = [new KeyVal('','')];
//        ko.utils.arrayFirst(GPLViewModel.propertiesCol(), function (prop) {
//            if (prop.id() != GPLViewModel.selectedProp().id() && arr.indexOfKey(prop.lbl()) == -1)
//                    arr.push(new KeyVal(prop.lbl, prop.lbl()));
//
//        });
//        sp.internalRefs(arr);
//        sp.isAccessed(true);
//        sp.internalRef(sp.lbl());
//        //sp.iconsList(this.IconList);
//        sp.referenceType(sp.internalReferenceType);
//        //sp.getPointDetails(sp.upi());
//        GPLViewModel.templateUrl(this.templateUrl);
//        $("#NonPointPropPanel").panel("open");
//   },
    setGivenName: function (val) {
        this.label.setText(val);
    },
    getPersistentAttributes: function () {
        var p = GPLViewModel.getProp(this.id);
        return p.getPersistentAttributes();
    },
    setPersistentAttributes: function (_memento) {
        this._super(_memento);
        this.memento = _memento;
        //this.getPort(this.id + "_0").value = _memento.props["Value"].Value;
        //console.log(_memento);
    },
    props: function (p) {
        p = p || {};
        var pp = GPLViewModel.getProp(this.id);
        p["Reference Type"] = {"Value": pp.referenceType() || this.refType};
        p["Value Type"] = {"Value": pp.valueType()};
        p["UPI"] = {"Value": pp.upi()};
        //console.log(p);
        return p;
    }

});

draw2d.shape.node.InputObj = draw2d.shape.node.IconObject.extend({

    NAME: "draw2d.shape.node.InputObj",
    shapeCat: 'Monitor',
    GivenName: "Input",
    iconList: [
        {"MonitorExternalPoint": "draw2d.shape.node.InputObjExternalPoint"},
        {"MonitorExternalGPL": "draw2d.shape.node.InputObjExternalGPL"},
        {"MonitorInternalRef": "draw2d.shape.node.InputObjInternalReference"}
    ],
    DEFAULT_COLOR: new draw2d.util.Color("#4D90FE"),
    MyOutputPortLocator: draw2d.layout.locator.PortLocator.extend({
        init: function () {
            this._super();
        },
        relocate: function (index, port) {
            //var parent = port.getParent();
            this.applyConsiderRotation(port, 23, 14);
        }

    }),
    init: function (src, id) {
        this.id = id;
        this._super(src);

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
        {
            this.displayText = new draw2d.shape.basic.Label("? ? ? ? QC");
        }
        else
        {
            this.displayText = new draw2d.shape.basic.Label("?????");
        }

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);
        this.addFigure(this.displayText, this.rightLocator);
        this.outputLocator = new this.MyOutputPortLocator();

        this.createPortWithTooltip("output", "Monitor Point", "both", this.outputLocator, id + "_0", null, true);

        this.setResizeable(false);

        GPLViewModel.addProp(id, this.NAME);
        GPLViewModel.getProp(id).givenName(this.GivenName);
        //GPLViewModel.getProp(id).referenceType("MonitorExternalPoint");
//            this.IconList =[
//                new KeyVal("", ""),
//                new KeyVal("External Point", "MonitorExternalPoint"),
//                new KeyVal("External GPL", "MonitorExternalGPL"),
//                new KeyVal("Internal Reference", "MonitorInternalRef")];
//            GPLViewModel.getProp(id).iconsList(this.IconList);
        this.iconChange = {
            prop: ["Reference Type"],
            values: this.iconList
        };


    }

});

draw2d.shape.node.InputObjExternalPoint = draw2d.shape.node.InputObj.extend({
        NAME: "draw2d.shape.node.InputObjExternalPoint",
        init: function (id) {
            this.id = id;
            this._super("/img/icons/MonitorExternalPoint.svg", id);
            this.refType = "MonitorExternalPoint";
        },
        props:function(){
            var p = {};
            var pp = GPLViewModel.getProp(this.id);
            if (pp.referenceType() === "MonitorInternalRef")
                p["Internal Reference"] = {"Value" : pp.internalRef()};
            return this._super(p);
        }
});

draw2d.shape.node.InputObjExternalGPL = draw2d.shape.node.InputObj.extend({
        NAME: "draw2d.shape.node.InputObjExternalGPL",
        init: function (id) {
            this.id = id;
            this._super("/img/icons/MonitorExternalGPL.svg", id);
            this.refType = "MonitorExternalGPL";

        }

    });

draw2d.shape.node.InputObjInternalReference = draw2d.shape.node.InputObj.extend({
        NAME: "draw2d.shape.node.InputObjInternalReference",
        internalExclude:true,
        init: function (id) {
            this.id = id;
            this._super("/img/icons/MonitorInternalRef.svg", id);
            this.refType = "MonitorInternalRef";

        }
    });

draw2d.shape.node.OutputObj = draw2d.shape.node.IconObject.extend({

    NAME: "draw2d.shape.node.OutputObj",
    shapeCat: 'Control',
    GivenName: "Output",
    iconList: [
        {"ControlExternalPoint": "draw2d.shape.node.OutputObjExternalPoint"},
        {"ControlExternalGPL": "draw2d.shape.node.OutputObjExternalGPL"},
        {"ControlInternalRef": "draw2d.shape.node.OutputObjInternalReference"}
    ],

    DEFAULT_COLOR: new draw2d.util.Color("#4D90FE"),

    controlPointRefUPI: "1213",

    MyInputPortLocator: draw2d.layout.locator.PortLocator.extend({
        init: function () {
            this._super();
        },
        relocate: function (index, port) {
            this.applyConsiderRotation(port, -2, 14);
        }
}),
    init: function (src, id) {
        this.id = id;
        this._super(src);

        this.setDimension(10, 22);

        this.leftLocator = new draw2d.layout.locator.LeftLocator(this);
        if (!GPLViewModel.isViewer())
        {
            this.displayText = new draw2d.shape.basic.Label("? ? ? ? QC");
        }
        else
        {
            this.displayText = new draw2d.shape.basic.Label("? ? ? ? ?");
        }

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);
        this.addFigure(this.displayText, this.leftLocator);


        //var figureImg = new draw2d.shape.basic.Image();
        //figureImg.init(src, 200, 200);
        //this.addFigure(figureImg, new draw2d.layout.locator.CenterLocator(this));


        this.inputLocator = new this.MyInputPortLocator();


        this.createPortWithTooltip("hybrid", "Control Point", "controlPointRefUPI", this.inputLocator, id + "_0", null, true);

        this.setResizeable(false);

        GPLViewModel.addProp(id, this.NAME);

        GPLViewModel.getProp(id).givenName(this.GivenName);
        //GPLViewModel.getProp(id).referenceType("ControlExternalPoint");
//            this.IconList =[
//                new KeyVal("", ""),
//                new KeyVal("External Point", "ControlPointForExternalPoint"),
//                new KeyVal("External GPL", "ControlPointForExternalGPL"),
//                new KeyVal("Internal Reference", "ControlPointForInternalRef")];
//            GPLViewModel.getProp(id).iconsList(this.IconList);
        this.iconChange = {
            prop: ["Reference Type"],
            values: this.iconList
        };


    }
});

draw2d.shape.node.OutputObjExternalPoint = draw2d.shape.node.OutputObj.extend({
        NAME: "draw2d.shape.node.OutputObjExternalPoint",
        init: function (id) {
            this.id = id;
            this._super("/img/icons/ControlExternalPoint.svg", id);
            this.refType = "ControlExternalPoint";
        }
    });

draw2d.shape.node.OutputObjExternalGPL = draw2d.shape.node.OutputObj.extend({
        NAME: "draw2d.shape.node.OutputObjExternalGPL",
        init: function (id) {
            this.id = id;
            this._super("/img/icons/ControlExternalGPL.svg", id);
            this.refType = "ControlExternalGPL";
        }

    });

draw2d.shape.node.OutputObjInternalReference = draw2d.shape.node.OutputObj.extend({
        NAME: "draw2d.shape.node.OutputObjInternalReference",
        init: function (id) {
            this.id = id;
            this._super("/img/icons/ControlInternalRef.svg", id);
            this.refType = "ControlInternalRef";
        },
        props:function(){
            var p = {};
            var pp = GPLViewModel.getProp(this.id);
            p["Internal Reference"] = {"Value" : pp.internalRef()};
            return this._super(p);
        }
});

draw2d.shape.node.ConstantValueObj = draw2d.shape.node.IconObject.extend({

    NAME: "draw2d.shape.node.ConstantValueObj",

    shapeCat: 'Constant',
    iconList: [
        {"Constant": "draw2d.shape.node.ConstantValueObj"},
        {"ConstantInternalRef": "draw2d.shape.node.ConstantInternalReference"}
    ],
    GivenName: "Constant",

    DEFAULT_COLOR: new draw2d.util.Color("#4D90FE"),

    MyOutputPortLocator: draw2d.layout.locator.PortLocator.extend({
        init: function () {
            this._super();
        },
        relocate: function (index, port) {
            this.applyConsiderRotation(port, 25, 14);
        }
    }),
    init: function (src, id) {
        this.id = id;
        this._super(src);


        //this.imgsrc=src;
        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("? ? ? ? QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");
        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        //var figureImg = new draw2d.shape.basic.Image();
        //figureImg.init(src, 200, 200);
        //this.addFigure(figureImg, new draw2d.layout.locator.CenterLocator(this));


        this.outputLocator = new this.MyOutputPortLocator();

        this.createPortWithTooltip("output", "Constant", "Constant", this.outputLocator, id + "_0",null, true);

        this.setResizeable(false);

        GPLViewModel.addProp(id, this.NAME);

        GPLViewModel.addDProp(id, 'Label', {Value: this.label.getText()});
        GPLViewModel.getProp(id).givenName(this.GivenName);
        GPLViewModel.getProp(id).shapeCategory = this.shapeCat;
        this.iconChange = {
                prop: ["Reference Type"],
                values: this.iconList
            };



    },
    props:function(){
        //p["Constant Value"] = {"Value": this.getPort(this.id + "_0").value };
        var p = {};
        var pp = GPLViewModel.getProp(this.id);
        p["Reference Type"] = {"Value": pp.referenceType()};
        if (pp.referenceType() === "ConstantInternalRef"){
            p["Internal Reference"] = {"Value" : pp.internalRef()};
            return this._super(p);
        }
        if (pp.isEnum()){
            p["Constant Value"] = {"Value": pp.constantEnum() };
        }
        else{
            p["Constant Value"] = {"Value": pp.constantFloat() };
        }
        return this._super(p);
    }

});

draw2d.shape.node.ConstantInternalReference = draw2d.shape.node.ConstantValueObj.extend({

    NAME: "draw2d.shape.node.ConstantInternalReference",
    init: function (id) {
        this.id = id;
        this._super("/img/icons/ConstantInternalRef.svg", id);
        this.refType = "ConstantInternalRef";
    }
});

draw2d.shape.node.Object = draw2d.shape.basic.Rectangle.extend({

    NAME: "draw2d.shape.node.Object",
    maxConnection: 4,
    minRequiredConnection: 1,
    requiredPorts:[],
    imgsrc: null,
    icon:'',
    iconChange: {},
    iconChangeProperty: ["Calculation Type"],
    customTopLocator: draw2d.layout.locator.Locator.extend({
        init: function (parent) {
            this._super(parent);
        },
        relocate: function (index, target) {
            var parent = this.getParent();
            var boundingBox = parent.getBoundingBox();

            var targetBoundingBox = target.getBoundingBox();
            target.setPosition(boundingBox.w / 2 - (targetBoundingBox.w / 2), -(targetBoundingBox.h + 2) + 5);
            //target.setPosition(boundingBox.w/2-targetBoundingBox.w/2,boundingBox.h/2-(targetBoundingBox.h/2));

            //this.applyConsiderRotation(port, -15, -10);
        }

    }),

    CustomPortLocator: draw2d.layout.locator.PortLocator.extend({
        init: function (x, y) {
            this._super();
            this.x = x;
            this.y = y;
        },
        x: 0,
        y: 0,
        relocate: function (index, port) {
            this.applyConsiderRotation(port, this.x, this.y);
        }

    }),
    init: function (src, id) {
        this.id = id;
        this._super();

        if (this.imgsrc == null)
            this.imgsrc = src;

        this.setDimension(30, 45);

        this.labelLocator = new this.customTopLocator(this);
        this.label = new draw2d.shape.basic.Label("1");
        this.label.setFontColor("#1f5908");
        this.label.setFontSize(9);
        this.label.setFontFamily("Trebuchet");
        this.label.setBold(true);

        //this.label.installEditor(new draw2d.ui.PropEditor());
        this.addFigure(this.label, this.labelLocator);


        var figureImg = new draw2d.shape.basic.Image();
        figureImg.init(src, 60, 60);
        this.addFigure(figureImg, new draw2d.layout.locator.CenterLocator(this));

        this.setResizeable(false);

        GPLViewModel.addProp(id, this.NAME);
        GPLViewModel.getProp(id).givenName(this.GivenName);
        this.iconChange = {
                prop: this.iconChangeProperty,
                values: this.iconList
            };
    },
    getPersistentAttributes: function () {
        var p = GPLViewModel.getProp(this.id);
        return p.getPersistentAttributes();
    },
    onDoubleClick: function () {
        var figures = this.canvas.getFigures();
        for (var i = 0; i < figures.getSize(); i++) {
            var f = null;
            f = figures.get(i);
            f.unselect();
        }
        this.select();
        GPLViewModel.selectProp(this.id);
        var upi = GPLViewModel.selectedProp().upi();
        if (!GPLViewModel.selectedProp().isAccessed())
        {
            GPLViewModel.setProps(this.id, upi, this.GivenName);
        }

        GPLViewModel.beforeEditProp = JSON.stringify(this.getPersistentAttributes(), null, 2);
        GPLViewModel.selectedProp().previousVersion(JSON.stringify(this.getPersistentAttributes().props));
        GPLViewModel.selectedProp().iconChange(this.iconChange);
        var pointType = GPLViewModel.getSelectedDProp("Point Type");
        var win = window.open("/pointSelector/properties/" + upi + "/" + pointType , 'PointPropertiesWindow', 'height=600,width=482');
        win.onload = function () {
            win.draw2d.pointProperties.init(GPLViewModel.selectedProp(), false);
        }
    },
    memento: {},
    setPersistentAttributes: function (_memento) {
        this._super(_memento);
        this.memento = _memento;

    },
    props: function () {
        var prop = GPLViewModel.getProp(this.id);
        this.propertiesArray = {};
        propArray = prop.propertiesArray();
        //console.log(propArray);
        for (var k in propArray)
        {
            if (propArray[k].Name)
            {
                this.propertiesArray[propArray[k].Name] = propArray[k].Value();
            }
        }
        return this.propertiesArray;


    },
    propsOriginal: function () {
        var prop = GPLViewModel.getOriginalProp(this.id);
        this.propertiesArray = {};
        propArray = prop.propertiesArray();

        for (var k in propArray)
            if (propArray[k].Name)this.propertiesArray[propArray[k].Name] = propArray[k].Value();

        return this.propertiesArray;


    }
});

draw2d.shape.node.BinarySelectorObject = draw2d.shape.node.Object.extend({
    NAME: "draw2d.shape.node.BinarySelectorObject",
    init: function (src, id) {
        this._super(src, id);
        this.setBackgroundColor(new draw2d.util.Color("#f9f4ae"));
        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("StText QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);
        this.addFigure(this.displayText, this.rightLocator);

    },
    GivenName: "Binary Selector",
    templateUrl: "SingleSetPointBinarySelPropWin"
});

draw2d.shape.node.SingleSetPointBinarySelectorObject = draw2d.shape.node.BinarySelectorObject.extend({

    NAME: "draw2d.shape.node.SingleSetPointBinarySelectorObject",
    templateUrl: "SingleSetPointBinarySelPropWin",
    icon: 'Single%20Setpoint',
    iconList: [
        {"single setpoint": "single setpoint"},
        {"dual setpoint": "dual setpoint"}
    ],

    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 4;
        this.minRequiredConnection = 2;
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorpoint", new this.CustomPortLocator(0, 14), id + "_1", null, true);
        this.createPortWithTooltip("hybrid", "Setpoint Input", "setpoint", new this.CustomPortLocator(0, 34), id + "_2", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(30, 22), id + "_" + (this.maxConnection - 1));

    }
});

draw2d.shape.node.DualSetPointBinarySelectorObject = draw2d.shape.node.BinarySelectorObject.extend({

    NAME: "draw2d.shape.node.DualSetPointBinarySelectorObject",
    Icon: 'Dual%20Setpoint',

    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 3;
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorpoint", new this.CustomPortLocator(0, 24), id + "_1", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(30, 25), id + "_" + (this.maxConnection - 1));

    }
});

draw2d.shape.node.DelayPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.DelayPointObject",
    Icon: 'Delay',
    iconList: [
        {"delay": "delay"}
    ],
    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 4;
        this.minRequiredConnection = 2;
        this.setBackgroundColor(new draw2d.util.Color("#9672df"));

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("StText QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorpoint", new this.CustomPortLocator(0, 15), id + "_1", null, true);
        this.createPortWithTooltip("hybrid", "Trigger Point", "triggerpoint", new this.CustomPortLocator(0, 34), id + "_2", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(30, 22), id + "_" + (this.maxConnection - 1));

        this.addFigure(this.displayText, this.rightLocator);

    },
    GivenName: "Delay"
});

draw2d.shape.node.PulsedDelayPointObject = draw2d.shape.node.DelayPointObject.extend({

    NAME: "draw2d.shape.node.PulsedDelayPointObject",
    Icon: 'Pulsed',
    iconList: [
        {"pulsed": "pulsed"}
    ],
    init: function (src, id) {
        this._super(src, id);
    }
});

draw2d.shape.node.LogicalPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.LogicalPointObject",
    Icon: 'Logical',
    iconList: [
        {"logical": "logical"}
    ],

    init: function (src, id) {
        this._super(src, id);

        this.maxConnection = 7;
        this.minRequiredConnection = 1;
        this.requiredPorts = [1,2,3,4,5];

        this.setBackgroundColor(new draw2d.util.Color("#c5ef7b"));
        this.setDimension(40, 105);

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
        {
            this.displayText = new draw2d.shape.basic.Label("Value QC");
        }
        else
        {
            this.displayText = new draw2d.shape.basic.Label("?????");
        }

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(20, 105), id + "_0");
        this.createPortWithTooltip("hybrid", "Input Point 1", "inputpoint1", new this.CustomPortLocator(0, 14), id + "_1");
        this.createPortWithTooltip("hybrid", "Input Point 2", "inputpoint2", new this.CustomPortLocator(0, 34), id + "_2");
        this.createPortWithTooltip("hybrid", "Input Point 3", "inputpoint3", new this.CustomPortLocator(0, 54), id + "_3");
        this.createPortWithTooltip("hybrid", "Input Point 4", "inputpoint4", new this.CustomPortLocator(0, 74), id + "_4");
        this.createPortWithTooltip("hybrid", "Input Point 5", "inputpoint5", new this.CustomPortLocator(0, 94), id + "_5");
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(39, 54), id + "_" + (this.maxConnection - 1));


    },
    GivenName: "Logic"

});

draw2d.shape.node.MultiplexerPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.MultiplexerPointObject",
    Icon: 'Multiplexer',
    iconList: [
        {"multiplexer": "multiplexer"}
    ],
    init: function (src, id) {
        this._super(src, id);
        this.setDimension(30, 60);
        this.maxConnection = 5;
        this.minRequiredConnection = 3;
        this.setBackgroundColor(new draw2d.util.Color("#d8804b"));

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");
        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 60), id + "_0");
        this.createPortWithTooltip("hybrid", "Input Point 1", "Float", new this.CustomPortLocator(0, 14), id + "_1", "Input 1 Constant");
        this.createPortWithTooltip("hybrid", "Input Point 2", "Float", new this.CustomPortLocator(0, 34), id + "_2", "Input 2 Constant");
        this.createPortWithTooltip("hybrid", "Select Input", "both", new this.CustomPortLocator(0, 54), id + "_3");
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(30, 34), id + "_" + (this.maxConnection - 1));


    },
    GivenName: "Multiplexer",
    templateUrl: "MultiplexerPropWin"
});

draw2d.shape.node.RampPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.RampPointObject",
    Icon: 'Ramp',
    iconList: [
        {"ramp": "ramp"}
    ],
    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 3;
        this.minRequiredConnection = 1;

        this.setBackgroundColor(new draw2d.util.Color("#a48246"));


        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");
        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorpoint", new this.CustomPortLocator(0, 24), id + "_1", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", null, id + "_" + (this.maxConnection - 1));

    },
    GivenName: "Ramp"
});

draw2d.shape.node.TotalizerPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.TotalizerPointObject",
    Icon: 'Totalizer',
    iconList: [
        {"totalizer": "totalizer"}
    ],

    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 3;
        this.minRequiredConnection = 1;

        this.setBackgroundColor(new draw2d.util.Color("#abf6f7"));


        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorpoint", new this.CustomPortLocator(0, 24), id + "_1", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", null, id + "_" + (this.maxConnection - 1));

    },
    GivenName: "Totalizer",
    templateUrl: "TotalizerPropWin"
});

draw2d.shape.node.AveragePointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.AveragePointObject",
    Icon: 'Average',
    iconList: [
        {"average": "average"},
        {"sum": "sum"}
    ],

    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 7;
        this.minRequiredConnection = 1;
        this.requiredPorts = [1,2,3,4,5];

        this.setBackgroundColor(new draw2d.util.Color("#9aeeef"));
        this.setDimension(40, 105);

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(20, 105), id + "_0");
        this.createPortWithTooltip("hybrid", "Input Point 1", "inputpoint1", new this.CustomPortLocator(0, 14), id + "_1");
        this.createPortWithTooltip("hybrid", "Input Point 2", "inputpoint2", new this.CustomPortLocator(0, 35), id + "_2");
        this.createPortWithTooltip("hybrid", "Input Point 3", "inputpoint3", new this.CustomPortLocator(0, 55), id + "_3");
        this.createPortWithTooltip("hybrid", "Input Point 4", "inputpoint4", new this.CustomPortLocator(0, 75), id + "_4");
        this.createPortWithTooltip("hybrid", "Input Point 5", "inputpoint5", new this.CustomPortLocator(0, 95), id + "_5");
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(43, 54), id + "_" + (this.maxConnection - 1));

        if (this.NAME == "draw2d.shape.node.AveragePointObject")
            this.calculationType = "Average";
        else
            this.calculationType = "Summation";


    },
    GivenName: "Average"

});

draw2d.shape.node.SummationPointObject = draw2d.shape.node.AveragePointObject.extend({
    NAME: "draw2d.shape.node.SummationPointObject",
    Icon: 'Sum',

    init: function (src, id) {
        this._super(src, id);
    }
});

draw2d.shape.node.SelectValueLargestPointObject = draw2d.shape.node.AveragePointObject.extend({
    NAME: "draw2d.shape.node.SelectValueLargestPointObject",
    icon: 'SelectValue',
    iconList: [
        {"High Value": "draw2d.shape.node.SelectValueLargestPointObject"},
        {"Low Value": "draw2d.shape.node.SelectValueSmallestPointObject"}
    ],

    init: function (src, id) {
        this._super(src, id);
        this.setBackgroundColor(new draw2d.util.Color("#fadd19"));
    },
    GivenName: 'Select Value'

});

draw2d.shape.node.SelectValueSmallestPointObject = draw2d.shape.node.SelectValueLargestPointObject.extend({
    NAME: "draw2d.shape.node.SelectValueSmallestPointObject",
    Icon: 'Low%20Value',
    init: function (src, id) {
        this._super(src, id);
    }
});

draw2d.shape.node.MathPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.MathPointObject",
    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 4;
        this.minRequiredConnection = 2;
        this.setBackgroundColor(new draw2d.util.Color("#dcd7d1"));

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 47), id + "_0");
        this.createPortWithTooltip("hybrid", "Input Point 1", "both", new this.CustomPortLocator(-2, 14), id + "_1", "Input 1 Constant", true);
        this.createPortWithTooltip("hybrid", "Input Point 2", "both", new this.CustomPortLocator(-2, 34), id + "_2", "Input 2 Constant", true);
        this.createPortWithTooltip("output", "Control Point", "output", new this.CustomPortLocator(30, 24), id + "_" + (this.maxConnection - 1));

    },
    GivenName: "Math",
    iconChangeProperty: ["Calculation Type", "Square Root"],
    iconList: [
        {"Addfalse": "draw2d.shape.node.AdditionPointObject"},
        {"Subtractfalse": "draw2d.shape.node.SubtractionPointObject"},
        {"Multiplyfalse": "draw2d.shape.node.MultiplicationPointObject"},
        {"Dividefalse": "draw2d.shape.node.DivisionPointObject"},
        {"Addtrue": "draw2d.shape.node.AdditionPointSRObject"},
        {"Subtracttrue": "draw2d.shape.node.SubtractionPointSRObject"},
        {"Multiplytrue": "draw2d.shape.node.MultiplicationPointSRObject"},
        {"Dividetrue": "draw2d.shape.node.DivisionPointSRObject"}
    ]
});

draw2d.shape.node.AdditionPointSRObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.AdditionPointSRObject",
    Icon: 'AddTrue',
    init: function (src, id) {
        this._super(src, id);
    }
});

draw2d.shape.node.AdditionPointObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.AdditionPointObject",
    Icon: 'AddFalse',
    init: function (src, id) {
        this._super(src, id);
    }
});

draw2d.shape.node.SubtractionPointObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.SubtractionPointObject",
    Icon: 'SubtractFalse',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = 'Minus';
    }

});

draw2d.shape.node.SubtractionPointSRObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.SubtractionPointSRObject",
    Icon: 'SubtractTrue',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = 'Minus';
    }

});

draw2d.shape.node.MultiplicationPointObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.MultiplicationPointObject",
    Icon: 'MultiplyFalse',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = 'Multiply'
    }
});

draw2d.shape.node.MultiplicationPointSRObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.MultiplicationPointSRObject",
    Icon: 'MultiplyTrue',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = 'Multiply'
    }
});

draw2d.shape.node.DivisionPointObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.DivisionPointObject",
    Icon: 'DivideFalse',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = 'Divide';
    }
});

draw2d.shape.node.DivisionPointSRObject = draw2d.shape.node.MathPointObject.extend({

    NAME: "draw2d.shape.node.DivisionPointSRObject",
    Icon: 'DivideTrue',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = 'Divide';
    }
});

draw2d.shape.node.ProportionalPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.ProportionalPointObject",
    //Icon:'P%20OnlyFalse',
    icon: '',
    iconChangeProperty: ["Calculation Type", "Reverse Action"],
    iconList: [
        {"p onlytrue": "draw2d.shape.node.ProportionalPointObject"},
        {"PItrue": "draw2d.shape.node.ProportionalPointObject"},
        {"PIDtrue": "draw2d.shape.node.ProportionalPointObject"},
        {"p onlyfalse": "draw2d.shape.node.ProportionalReversePointObject"} ,
        {"PIfalse": "draw2d.shape.node.ProportionalReversePointObject"},
        {"PIDfalse": "draw2d.shape.node.ProportionalReversePointObject"}
    ],
    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 4;
        this.minRequiredConnection = 2;
        this.setBackgroundColor(new draw2d.util.Color("#0e0881"));
        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorpoint", new this.CustomPortLocator(0, 14), id + "_1", null, true);
        this.createPortWithTooltip("hybrid", "Setpoint Input", "setpoint", new this.CustomPortLocator(0, 34), id + "_2", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(30, 24), id + "_" + (this.maxConnection - 1));

    },
    GivenName: "Proportional"
});

draw2d.shape.node.ProportionalReversePointObject = draw2d.shape.node.ProportionalPointObject.extend({

    NAME: "draw2d.shape.node.ProportionalReversePointObject",
    Icon: 'P%20OnlyTrue',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = 'Proportional';
        this.reverseActing = true;
    }

});

draw2d.shape.node.SetPointAdjustPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.SetPointAdjustPointObject",
    icon: 'SetPointAdjust',
    iconChangeProperty: ["Reverse Action"],
    iconList: [
        {false: "draw2d.shape.node.SetPointAdjustNormalPointObject"},
        {true: "draw2d.shape.node.SetPointAdjustReversedPointObject"}
    ],
    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 3;
        this.setBackgroundColor(new draw2d.util.Color("#37903b"));
        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("StText QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.addFigure(this.displayText, this.rightLocator);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorpoint", new this.CustomPortLocator(0, 24), id + "_1", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(30, 24), id + "_" + (this.maxConnection - 1));

    },
    GivenName: "Setpoint Adjust"
//    IconList:["setpointadjustfalse", "setpointadjusttrue"],
//    templateUrl: "SetPointAdjustPropWin"
});

draw2d.shape.node.SetPointAdjustNormalPointObject = draw2d.shape.node.SetPointAdjustPointObject.extend({

    NAME: "draw2d.shape.node.SetPointAdjustNormalPointObject",

    init: function (src, id) {
        this._super(src, id);
    }
});

draw2d.shape.node.SetPointAdjustReversedPointObject = draw2d.shape.node.SetPointAdjustPointObject.extend({

    NAME: "draw2d.shape.node.SetPointAdjustReversedPointObject",
    init: function (src, id) {
        this._super(src, id);
    }

});

draw2d.shape.node.SingleSetPointAnalogSelectorObject = draw2d.shape.node.SingleSetPointBinarySelectorObject.extend({

    NAME: "draw2d.shape.node.SingleSetPointAnalogSelectorObject",
    Icon: 'Single%20Setpoint',
    iconList: [
        {"single setpoint": "single setpoint"},
        {"dual setpoint": "dual setpoint"}
    ],
    GivenName: "Analog Selector",
    init: function (src, id) {
        this._super(src, id);
        this.setBackgroundColor(new draw2d.util.Color("#c1e411"));
        this.displayText.setText("512.6 QC");
        this.GivenName = "Analog Selector";
        this.presentValue = "0.00000";
    }
});

draw2d.shape.node.DualSetPointAnalogSelectorObject = draw2d.shape.node.DualSetPointBinarySelectorObject.extend({

    NAME: "draw2d.shape.node.DualSetPointAnalogSelectorObject",
    Icon: 'Dual%20Setpoint',
    GivenName: "Analog Selector",
    init: function (src, id) {
        this._super(src, id);
        this.setBackgroundColor(new draw2d.util.Color("#c1e411"));
        this.displayText.setText("512.6 QC");
        this.GivenName = "Analog Selector";
        this.presentValue = "0.00000";

    }

});

draw2d.shape.node.EconomizerPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.EconomizerPointObject",
    Icon: 'Economizer',
    iconList: [
        {"economizer": "economizer"}
    ],
    init: function (src, id) {
        this._super(src, id);

        this.setDimension(30, 60);
        this.maxConnection = 5;
        this.minRequiredConnection = 3;

        this.setBackgroundColor(new draw2d.util.Color("#3899c7"));

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "ShutDownPointRefUPI", new this.CustomPortLocator(15, 60), id + "_0");
        this.createPortWithTooltip("hybrid", "Return Air Point", "returnairpoint", new this.CustomPortLocator(0, 14), id + "_1", null, true);
        this.createPortWithTooltip("hybrid", "Mixed Air Point", "mixedairpoint", new this.CustomPortLocator(0, 34), id + "_2", null, true);
        this.createPortWithTooltip("hybrid", "Outside Air Point", "outsideairpoint", new this.CustomPortLocator(0, 54), id + "_3", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", null, id + "_" + (this.maxConnection - 1));

        this.presentValue = "0.00000";

        this.addFigure(this.displayText, this.rightLocator);

    },
    GivenName: "Economizer"
});

draw2d.shape.node.EnthalpyPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.EnthalpyPointObject",
    icon: 'Enthalpy',
    iconList: [
        {"enthalpy": "enthalpy"},
        {"enthalpydewpoint": "enthalpydewpoint"},
        {"enthalpywetbulb": "enthalpywetbulb"}
    ],
    init: function (src, id) {
        this._super(src, id);

        this.minRequiredConnection = 2;
        this.maxConnection = 4;
        this.setBackgroundColor(new draw2d.util.Color("#8bb069"));


        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("512.6 QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Humidity Point", "humiditypoint", new this.CustomPortLocator(0, 14), id + "_1", null, true);
        this.createPortWithTooltip("hybrid", "Dry Bulb Point", "drybulbpoint", new this.CustomPortLocator(0, 34), id + "_2", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", null, id + "_" + (this.maxConnection - 1));

        this.addFigure(this.displayText, this.rightLocator);
        this.presentValue = "0.00000";

    },
    GivenName: "Enthalpy"
});

draw2d.shape.node.EnthalpyDewPointObject = draw2d.shape.node.EnthalpyPointObject.extend({
    NAME: "draw2d.shape.node.EnthalpyDewPointObject",
    Icon: 'EnthalpyDewPoint',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "EnthalpyDewPoint"
    }
});

draw2d.shape.node.EnthalpyWetBulbObject = draw2d.shape.node.EnthalpyPointObject.extend({

    NAME: "draw2d.shape.node.EnthalpyWetBulbObject",
    Icon: 'EnthalpyWetBulb',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "EnthalpyWetBulb"
    }
});

draw2d.shape.node.ComparatorPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.ComparatorPointObject",
    iconList: [
        {">": "draw2d.shape.node.GreaterComparatorPointObject"},
        {"<": "draw2d.shape.node.LessComparatorPointObject"},
        {">=": "draw2d.shape.node.GreaterOrEqualComparatorPointObject"},
        {"<=": "draw2d.shape.node.LessOrEqualComparatorPointObject"},
        {"=": "draw2d.shape.node.EqualComparatorPointObject"},
        {"<>": "draw2d.shape.node.NotEqualComparatorPointObject"}
    ],
    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 4;
        this.minRequiredConnection = 2;
        this.setBackgroundColor(new draw2d.util.Color("#fdfcdd"));


        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("StText QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Input Point 1", "inputpoint1", new this.CustomPortLocator(0, 14), id + "_1", null, true);
        this.createPortWithTooltip("hybrid", "Input Point 2", "float", new this.CustomPortLocator(0, 34), id + "_2", "Input 2 Constant", true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", null, id + "_" + (this.maxConnection - 1));

        this.addFigure(this.displayText, this.rightLocator);
        this.presentValue = "0.00000";
    },
    GivenName: "Comparator",
    iconInterpreter:function(i){
        switch(i){
            case ">":
                return "greater";
                break;
            case ">=":
                return "greaterOrEqual";
                break;
            case "=":
                return "equal";
                break;
            case "<>":
                return "notequal";
                break;
            case "<":
                return "less";
                break;
            case "<=":
                return "lessOrEqual";
                break;

        }
    }
});

draw2d.shape.node.GreaterComparatorPointObject = draw2d.shape.node.ComparatorPointObject.extend({

    NAME: "draw2d.shape.node.GreaterComparatorPointObject",
    Icon: 'Greater',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "Greater";
    }
});

draw2d.shape.node.LessComparatorPointObject = draw2d.shape.node.ComparatorPointObject.extend({

    NAME: "draw2d.shape.node.LessComparatorPointObject",
    Icon: 'Less',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "Less";
    }
})

draw2d.shape.node.GreaterOrEqualComparatorPointObject = draw2d.shape.node.ComparatorPointObject.extend({

    NAME: "draw2d.shape.node.GreaterOrEqualComparatorPointObject",
    Icon: 'GreaterOrEqual',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "GreaterOrEqual";
    }
})

draw2d.shape.node.LessOrEqualComparatorPointObject = draw2d.shape.node.ComparatorPointObject.extend({

    NAME: "draw2d.shape.node.LessOrEqualComparatorPointObject",
    Icon: 'LessOrEqual',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "LessOrEqual";
    }
})

draw2d.shape.node.EqualComparatorPointObject = draw2d.shape.node.ComparatorPointObject.extend({

    NAME: "draw2d.shape.node.EqualComparatorPointObject",
    Icon: 'Equal',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "Equal";
    }
})

draw2d.shape.node.NotEqualComparatorPointObject = draw2d.shape.node.ComparatorPointObject.extend({

    NAME: "draw2d.shape.node.NotEqualComparatorPointObject",
    Icon: 'NotEqual',
    init: function (src, id) {
        this._super(src, id);
        this.calculationType = "NotEqual";
    }
})

draw2d.shape.node.DigitalLogicPointObject = draw2d.shape.node.Object.extend({

    NAME: "draw2d.shape.node.DigitalLogicPointObject",
    init: function (src, id) {
        this._super(src, id);
        this.maxConnection = 4;
        this.minRequiredConnection = 2;

        this.setBackgroundColor(new draw2d.util.Color("#768557"));


        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("StText QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Input Point 1", "operandpoint1", new this.CustomPortLocator(0, 13), id + "_1", null, true);
        this.createPortWithTooltip("hybrid", "Input Point 2", "operandpoint2", new this.CustomPortLocator(0, 32), id + "_2", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", new this.CustomPortLocator(30, 22), id + "_" + (this.maxConnection - 1));

        this.addFigure(this.displayText, this.rightLocator);
        this.presentValue = "0.00000";
    },
    iconChangeProperty:["Calculation Type"],
    iconList: [
        {"And": "draw2d.shape.node.AndDigitalLogicPointObject"},
        {"Or": "draw2d.shape.node.OrDigitalLogicPointObject"},
        {"X-Or": "draw2d.shape.node.XorDigitalLogicPointObject"}
    ],
    GivenName: "Digital Logic"
});

draw2d.shape.node.AndDigitalLogicPointObject = draw2d.shape.node.DigitalLogicPointObject.extend({

    NAME: "draw2d.shape.node.AndDigitalLogicPointObject",
    init: function (src, id) {
        this._super(src, id);
    }

});

draw2d.shape.node.OrDigitalLogicPointObject = draw2d.shape.node.DigitalLogicPointObject.extend({

    NAME: "draw2d.shape.node.OrDigitalLogicPointObject",
    init: function (src, id) {
        this._super(src, id);
    }

});

draw2d.shape.node.XorDigitalLogicPointObject = draw2d.shape.node.DigitalLogicPointObject.extend({

    NAME: "draw2d.shape.node.XorDigitalLogicPointObject",
    init: function (src, id) {
        this._super(src, id);
    }

});

//ALARM STATUS
//1
draw2d.shape.node.AlarmStatusPointObject = draw2d.shape.node.Object.extend({
    NAME: "draw2d.shape.node.AlarmStatusPointObject",
    icon: 'AlarmStatus',
    iconChangeProperty:["In Alarm", "In Out of Service", "In Fault" , "In Override"],
    iconList: [
        { "truetruetruetrue": "draw2d.shape.node.AlarmStatusAllTrueObject"},
        { "truefalsefalsefalse":"draw2d.shape.node.AlarmStatusInAlarmObject"},
        { "falsetruefalsefalse":"draw2d.shape.node.AlarmStatusInFaultObject"},
        { "falsefalsetruefalse":"draw2d.shape.node.AlarmStatusInOutofServiceObject"},
        { "falsefalsefalsetrue":"draw2d.shape.node.AlarmStatusInOverrideObject"},
        { "truetruefalsefalse":"draw2d.shape.node.AlarmStatusInAlarmInFaultObject"},
        { "truetruetruefalse":"draw2d.shape.node.AlarmStatusInAlarmInFaultInOutofServiceObject"},
        { "falsetruetruefalse":"draw2d.shape.node.AlarmStatusInFaultInOutofServiceObject"},
        { "falsetruetruetrue":"draw2d.shape.node.AlarmStatusInFaultInOutofServiceInOverrideObject"},
        { "falsefalsetruetrue":"draw2d.shape.node.AlarmStatusInOutofServiceInOverrideObject"},
        { "falsetruefalsetrue":"draw2d.shape.node.AlarmStatusInFaultInOverrideObject"},
        { "truetruefalsetrue":"draw2d.shape.node.AlarmStatusInAlarmInFaultInOverrideObject"},
        { "truefalsefalsetrue":"draw2d.shape.node.AlarmStatusInAlarmInOverrideObject"},
        { "truefalsetruefalse":"draw2d.shape.node.AlarmStatusInAlarmInOutofServiceObject"},
        { "truefalsetruetrue":"draw2d.shape.node.AlarmStatusInAlarmInOutofServiceInOverrideObject"},
        { "falsefalsefalsefalse":"draw2d.shape.node.AlarmStatusPointObject"}

    ],
    init: function (src, id) {
        this.maxConnection = 3;
        this._super(src, id);
        this.setBackgroundColor(new draw2d.util.Color("#b72a2a"));

        this.rightLocator = new draw2d.layout.locator.RightLocatorFigure(this);
        if (!GPLViewModel.isViewer())
            this.displayText = new draw2d.shape.basic.Label("Value QC");
        else
            this.displayText = new draw2d.shape.basic.Label("?????");

        this.displayText.setColor("#0d0d0d");
        this.displayText.setFontColor("#0d0d0d");
        this.displayText.setFontSize(9);

        this.createPortWithTooltip("hybrid", "Shutdown Point", "shutDownPointRefUPI", new this.CustomPortLocator(15, 45), id + "_0");
        this.createPortWithTooltip("hybrid", "Monitor Point", "monitorPointRefUPI", new this.CustomPortLocator(0, 24), id + "_1", null, true);
        this.createPortWithTooltip("output", "Control Point", "controlpoint", null, id + "_" + (this.maxConnection - 1));

        this.addFigure(this.displayText, this.rightLocator);

    },
    GivenName: "Alarm Status"
});

//2
draw2d.shape.node.AlarmStatusInAlarmObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInAlarmObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//3
draw2d.shape.node.AlarmStatusInFaultObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInFaultObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//4
draw2d.shape.node.AlarmStatusInOutofServiceObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInOutofServiceObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//5
draw2d.shape.node.AlarmStatusInOverrideObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInOverrideObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//6
draw2d.shape.node.AlarmStatusInAlarmInFaultObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInAlarmInFaultObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//7
draw2d.shape.node.AlarmStatusInAlarmInFaultInOutofServiceObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInAlarmInFaultInOutofServiceObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//8
draw2d.shape.node.AlarmStatusAllTrueObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusAllTrueObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//9
draw2d.shape.node.AlarmStatusInFaultInOverrideObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInFaultInOverrideObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//10
draw2d.shape.node.AlarmStatusInOutofServiceInOverrideObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInOutofServiceInOverrideObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//11
draw2d.shape.node.AlarmStatusInFaultInOutofServiceObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInFaultInOutofServiceObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//12
draw2d.shape.node.AlarmStatusInAlarmInOverrideObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInAlarmInOverrideObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//13
draw2d.shape.node.AlarmStatusInAlarmInOutofServiceObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInAlarmInOutofServiceObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//14
draw2d.shape.node.AlarmStatusInFaultInOutofServiceInOverrideObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInFaultInOutofServiceInOverrideObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//15
draw2d.shape.node.AlarmStatusInFaultInOutofServiceInOverrideObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInFaultInOutofServiceInOverrideObject",
    init:function(src, id){
        this._super(src,id);
    }
});

//16
draw2d.shape.node.AlarmStatusInAlarmInFaultInOverrideObject = draw2d.shape.node.AlarmStatusPointObject.extend({
    NAME: "draw2d.shape.node.AlarmStatusInAlarmInFaultInOverrideObject",
    init:function(src, id){
        this._super(src,id);
    }
});


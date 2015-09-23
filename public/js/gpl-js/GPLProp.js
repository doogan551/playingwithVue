function Properties(uniqueId, shape) {
    this.shape = shape;
    this.shapeCategory = "";
    this.isNewlyAdded = false;
    this.delete = false;
    this.justDeleted = false;
    this.id = ko.observable(uniqueId);
    this.upi = ko.observable(0);
    this.iconChange = ko.observable({});
    this.givenName = ko.observable();
    this.isAccessed = ko.observable(false);
    this.updated = ko.observable(false);
    this.previousVersion = ko.observable({});
    this.isEnum = ko.observable(true);
    this.internalReferenceType = {};
    this.isConstantEnumAllowed = ko.observable(false);
    this.constantReference = ko.observable(false);
    this.showLabel = ko.observable(true);
    this.showValue = ko.observable(true);
    this.lbl = ko.observable();
    this.valueOptions = ko.observableArray([]);
    this.precision = ko.observable();
    this.numOfDecimals = ko.observable('3');
    this.numOfCharacters = ko.observable('3');
    this.maxOutputChange = ko.observable('100.000');
    this.propertiesArray = ko.observableArray([]);
    this.referencePoint = ko.observable();
    this.referenceType = ko.observable();
    this.referenceList = ko.observableArray([]);
    this.segment = ko.observable('');
    this.valueType = ko.observable('');
    this.valu = ko.observable();
    this.constantEnum = ko.observable('');
    this.constantFloat= ko.observable(0);
    this.referenceTypes = ko.observableArray();
    this.calculationTypes = ko.observableArray();
    this.internalRef = ko.observable();
    this.internalRefs = ko.observableArray([]);
    //this.iconsList = ko.observableArray([]);
    this.iconChangeFn = function (newValue) {
        var r = null;
        var self = window.app.view.getFigure(this.id());
        $(self.children.data).each(function (i, e) {
            if (e)
                if (e.figure.path)
                    if (e.figure.path.indexOf(".svg") > 0)
                        r = e.figure;
        });
        window.app.view.removeFigure(r);
        var figureImg = new draw2d.shape.basic.Image();
        figureImg.init("/img/icons/" + newValue + ".svg", 60, 60);
        self.addFigure(figureImg, new draw2d.layout.locator.CenterLocator(self));

    };
    this.showLabel.subscribe(function (newValue) {
        var shape = window.app.view.getFigure(this.id());
        shape.label.visible = newValue;
        shape.label.repaint();
    }, this);
    this.showValue.subscribe(function (newValue) {
        var shape = window.app.view.getFigure(this.id());
        shape.displayText.visible = newValue;
        shape.displayText.repaint();
    }, this);
    this.valueType.subscribe(function (newValue) {
        if (GPLViewModel.isViewer()) return;
        if (newValue == undefined) return;
        //var shape = this.canvas.getFigure(this.id());
        var shape = window.app.view.getFigure(this.id());
        newValue == "Enum" ? shape.displayText.setText("StText QC") : shape.displayText.setText("512.6 QC");
        //shape.displayText.setColor("#35f442");
        shape.displayText.setFontColor("#bf070a");
        shape.displayText.setFontSize(8);
        shape.displayText.setFontFamily("Trebuchet");
        shape.displayText.setBold(true);
        shape.displayText.repaint();

    }, this);
    this.valu.subscribe(function (newValue) {
        if (newValue == undefined || newValue == null)
            return;
        if (this.shapeCategory != "Monitor" && this.shapeCategory != "Control" && this.shapeCategory != "Constant")
            return;

        var shape = window.app.view.getFigure(this.id());
        var portId = this.id() + "_0";

        var connections = shape.getPort(portId).getConnections();

        for (var i = 0; i < connections.getSize(); i++) {
            var conn = connections.get(i);
            if (shape.NAME == "draw2d.shape.node.ConstantValueObj"){
                this.constantWorks(conn.targetPort);
            }
            else if (shape.NAME == "draw2d.shape.node.ConstantInternalReference"){
                var internalRefId = shape.props()["Internal Reference"].Value;
                this.constantWorks(conn.targetPort, internalRefId);

            }
            else if (GPLViewModel.getProp(conn.targetPort.parent.id).shapeCategory == 'Control')
            {
                this.setSourceTargetProperty(conn.sourcePort.parent.id, newValue, conn.sourcePort.propertyRepresented, newValue._id);

                GPLViewModel.getDProp(conn.targetPort.parent.id, "UPI").Value().Value = newValue._id;


            }
            else
            {
               this.setSourceTargetProperty(conn.targetPort.parent.id, newValue, conn.targetPort.propertyRepresented, newValue._id);

                GPLViewModel.getDProp(conn.sourcePort.parent.id, "UPI").Value().Value = newValue._id;


            }



        }

    }, this);

    this.setSourceTargetProperty = function(targetId, refP, propName, val){

            GPLViewModel.ensureAllUnderlyingProperties(targetId);
            var shape = window.app.view.getFigure(targetId);
            var shapeProps = shape.props();
            //console.log(refP,val);
            GPLViewModel.getProp(targetId).previousVersion(JSON.stringify(shapeProps));
            shapeProps[propName].Value = val;
            //console.log(shapeProps[propName]);
            var d = {point : shapeProps, oldPoint:shapeProps, refPoint:refP, property: propName};
            var dd = Config.Update.formatPoint(d);
            //console.log(dd);
            GPLViewModel.getProp(targetId).setProps(dd);
            GPLViewModel.getProp(targetId).updated(true);
    };

    this.constantFloat.subscribe(function (newValue) {
        this.isEnum(false);
        this.valu(parseInt(newValue));
    }, this);
    this.constantEnum.subscribe(function (newValue) {
        this.isEnum(true);
        this.valu(parseInt(newValue));
    }, this);
    this.lbl.subscribe(function (newLabel) {
        var shape = window.app.view.getFigure(this.id());
        this.internalRefChangeTrack = newLabel;
        shape.label.setText(newLabel);
        shape.repaint();
        shape.label.repaint();

    }, this);
    this.setProps = function (memento) {
        var self = this;
        for (var key in memento) {
            self.propertiesArray.push(new PropValue(key, memento[key]));
        }
    };
    this.setPersistentAttributes = function (memento) {
        var self = this;
        if (memento === undefined)return;
        self.id(memento.id);
        self.valueType(memento.valueType);
        self.propertiesArray([]);
        if (memento.props) {
            for (var key in memento.props)
            {
                self.propertiesArray.push(new PropValue(key, memento.props[key]));
            }
            if (memento.props["_id"])
            {
                self.upi(memento.props["_id"]);
            }
            else if (memento.props["UPI"])
            {
                self.upi(memento.props["UPI"].Value);
                if(memento.props["Reference Type"]){
                    if(memento.props["Reference Type"].Value.indexOf("InternalRef") > -1){
                        var intRefId ="";
                        if (memento.props["Internal Reference"])
                           intRefId = memento.props["Internal Reference"].Value;
                        else
                        {
                            if (GPLViewModel.getPropByUPI(this.upi(), this.id()))
                            {
                                intRefId = GPLViewModel.getPropByUPI(this.upi(), this.id()).id();
                            }
                            else
                            {
                                iToast.showError('Error', 'This sequence has an some points UPI missing.');
                            }
                        }
                        self.internalRef(intRefId);
                    }
                    self.referenceType(memento.props["Reference Type"].Value);
                }

            }
            if(memento.props["Value Type"]){
                if(memento.type == "draw2d.shape.node.ConstantValueObj" && memento.props["Value Type"].Value == "Float")
                {
                    self.constantFloat(memento.props["Constant Value"].Value);

                }
                else if(memento.type == "draw2d.shape.node.ConstantValueObj" && memento.props["Value Type"].Value == "Enum")
                {
                    self.constantEnum(memento.props["Constant Value"].Value);
                }
                self.valueType(memento.props["Value Type"].Value);
            }

            //console.log(memento.label);
            self.lbl(memento.label);
            self.showLabel(memento.showLabel);
            self.showValue(memento.showValue);
            self.precision(memento.precision);



            //if (memento.props["Value Type"]) this.valueType(memento.props["Value Type"].Value);
            //this.iconChangeFn(memento.props["Reference Type"].Value,this);
            if (memento.props["Reference Type"])
            {
                self.internalReferenceType = memento.props["Reference Type"].Value;
            }


        }
        else {
            var d = Config.Templates.Points[memento.typ];
            for (var key in d) {
                self.propertiesArray.push(new PropValue(key, d[key]));
            }
        }


    };
    this.getPersistentAttributes = function () {
        //var shape = window.app.view.getFigure(this.id());
        var shape = window.app.view.getFigure(this.id());

        return {
            type: shape.NAME,
            //imgsrc: shape.imgsrc,
            id: shape.id,
            x: shape.x,
            y: shape.y,
            //typ: shape.GivenName,
            color:shape.getColor().hash(),
            stroke:shape.getStroke(),
            label: shape.label.getText(),
            showValue: this.showValue(),
            showLabel: this.showLabel(),
            precision: this.precision(),
            props: shape.props()

        };
    };
    this.getProperty = function (propName) {
        return ko.utils.arrayFirst(this.propertiesArray(), function (prop) {
            return prop.Name == propName;
        });
    };

    this.getPointDetails = function (upi) {
        var self = this;
        if (upi == null || upi == 0) return;
        $.ajax({ url: '/api/points/' + upi, type: 'get', async: false, cache: false, success: function (d) {
            self.segment(d.Name);
        } });

    },
    this.isVisible = function (data, prop) {
            if (data.getProperty(prop) == null) return false;
            return data.getProperty(prop).Value().Value == 0 ? false : true;
        };
    this.getName = function (data, prop) {
        if (data.getProperty(prop) == null || data.getProperty(prop) == undefined) return "";
        if (data.getProperty(prop).Value().Value == 0) return "";
        var p = GPLViewModel.getPropByUPI(data.getProperty(prop).Value().Value);
        return p.lbl();
    };
    this.getPropByUPI = function (upi) {
        $.ajax({
            url: '/api/points/' + upi,
            type: 'get',
            async: false,
            cache: false,
            success: function (d) {
                return d;

            }
        });
    };
    this.changeSelect = function (data, prop, changeIcon) {
        if (this.selectedIndex == 0 || data.getProperty(prop) == null)
        {
            return;
        }
        data.getProperty(prop).Value().Value = this.selectedOptions[0].text;
        data.getProperty(prop).Value().eValue = this.selectedOptions[0].value;

    };
    this.changeVal = function (prop, data, elem) {
        this.getProperty(prop).Value().Value = elem.target.value;
    };
    this.staticVal = function (data,prop,changeIcon) {
        eval("data." + prop + "(this.value);");
        if(changeIcon)this.iconChangeFn(this.value, data);
        return true;
    };

    this.staticCheck = function (data,prop) {
        eval("data." + prop + "(this.checked);");
        return true;
    };
    this.changeChecked = function (data, prop) {
        data.getProperty(prop).Value().Value = this.checked;
        return true;

    };

    this.updateInterval = function (data, isMin) {
        if (isMin)
            data.getProperty("Update Interval").Value().Value += Number(this.value) * 60;
        else {
            var sec = data.getProperty("Update Interval").Value().Value;
            if (sec > 60)
                data.getProperty("Update Interval").Value().Value = sec - (sec % 60) + Number(this.value);
            else
                data.getProperty("Update Interval").Value().Value = Number(this.value);

        }


    };
    this.setValueText = function(val, q){
        var fig = window.app.view.getFigure(this.id());
        var val1 = Number(val).toFixed(this.precision());
        //console.log("1", val, val1, typeof(val));
        if (val1 == "NaN"){
            val1 = val;
        }
        if (q){
            fig.displayText.setText(val1 + " " + q["Quality Code"]);
            fig.displayText.setFontColor('#' + q["Quality Code Font HTML Color"]);
        }
        else
        {
            fig.displayText.setText(val1);
        }
    };
    this.constantWorks = function(targetPort, refId){
        var refObj = refId ? GPLViewModel.getProp(refId) : this;

        var refP = {
            isDisplayable: true,
            isReadOnly: false,
            ValueType: refObj.isEnum() ? 5 : 1,
            Value: refObj.isEnum() ? refObj.constantEnum() : refObj.constantFloat()
        };
        var propertyRep = targetPort.alternateProperty || targetPort.propertyRepresented;
        GPLViewModel.getProp(targetPort.parent.id).previousVersion(JSON.stringify(targetPort.parent.getPersistentAttributes().props));
        var d = {point : targetPort.parent.props(), oldPoint:targetPort.parent.props(), refPoint:refP, property: propertyRep };
        console.log(d);
        var dd = Config.Utility.createActivityLog(d); //Config.Update.formatPoint(d);
        //Workaround. Real fix to be made in Config (above function)
        dd[propertyRep].Value = refP.Value;
        dd[propertyRep].ValueType = refP.ValueType;

        GPLViewModel.getProp(targetPort.parent.id).setProps(dd);
        GPLViewModel.getProp(targetPort.parent.id).updated(true);

    }
};

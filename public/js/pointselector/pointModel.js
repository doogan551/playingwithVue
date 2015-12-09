function PointModel(uniqueId) {
    var self = this;
    self.id = ko.observable(uniqueId);
    self.sequencePoint = {};
    self.shape = "";
    self.shapeCategory = "";
    self.segment = ko.observable('');
    self.upi = ko.observable(0);
    self.givenName = ko.observable();
    self.modified = ko.observable(false);
    self.isAccessed = ko.observable(true);
    self.updated = ko.observable(false);
    self.isEnum = ko.observable(true);
    self.isConstantEnumAllowed = ko.observable(false);
    self.showLabel = ko.observable(true);
    self.showValue = ko.observable(true);
    self.lbl = ko.observable('');
    self.valueOptions = ko.observableArray([]);
    self.propertiesArray = ko.observableArray([]);
    self.iconChange = ko.observable({});
    self.internalRef = ko.observable();
    self.internalRefs = ko.observableArray([]);
    self.referencePoint = ko.observable();
    self.referenceType = ko.observable();
    self.referenceList = ko.observableArray([]);
    self.segment = ko.observable('');
    self.valueType = ko.observable('Float');
    self.valu = ko.observable();
    self.constantEnum = ko.observable('');
    self.constantFloat = ko.observable(0);
    self.numOfDecimals = ko.observable('3');
    self.numOfCharacters = ko.observable('3');
    self.maxOutputChange = ko.observable('100.000');

    self.getProperty = function (propName) {
        return ko.utils.arrayFirst(self.propertiesArray(), function (prop) {
            return prop.Name == propName;
        });
    };

    self.changeSelect = function (prop) {
        if (this.selectedIndex == 0 || this.selectedIndex == null) return;
    };
    self.getSelectedDProp = function (propName, retValue) {
        var p = ko.utils.arrayFirst(self.propertiesArray(), function (prop) {
            return prop.Name == propName;
        });
        if (p && retValue)
            return p.Value;
        if (p)
            return p.Value().Value;
        return "";
    };
    self.isFloat = function (prop) {
        if (self.getSelectedDProp(prop, true) == "")
            return false;
        return self.getSelectedDProp(prop, true)().ValueType == 1;
    };
    self.isEnum2 = function (prop) {
        if (self.getSelectedDProp(prop, true) == "")
            return false;
        return self.getSelectedDProp(prop, true)().ValueType == 5;
    };
    self.dropdownRange = function (propName) {
        var arr = [];
        try {
            var v = self.getSelectedDProp(propName, true)();
            //console.log(v);
            for (var k in v.ValueOptions)
                arr.push(new KeyVal(k, v.ValueOptions[k]));
        }
        catch (e) {
            //console.log(e);
        }
        return arr;
    };
    self.getSelectedDPropEvalue = function (propName) {
        var p = ko.utils.arrayFirst(self.propertiesArray(), function (prop) {
            return prop.Name == propName;
        });

        if (p)
            return p.Value().eValue;
        return "";
    };
    self.getSelectedDPropCompValue = function (propName) {
        var p = ko.utils.arrayFirst(self.propertiesArray(), function (prop) {
            return prop.Name == propName;
        });

        if (p)
            return p.Value().CompValue;
        return "";
    };
    self.isVisible = function (data, prop) {
        if (data.getProperty(prop) == null) return false;
        return data.getProperty(prop).Value().Value != 0;
    };
    self.getName = function (data, prop) {
        if (data.getProperty(prop) == null || data.getProperty(prop) == undefined) return "";
        if (data.getProperty(prop).Value().Value == 0) return "";
        var nam = '';
        data.getPropByUPI(data.getProperty(prop).Value().Value, function(p){
            nam = p.name1;
            if (p.name2 != "") nam = p.name2;
            if (p.name3 != "") nam = p.name3;
            if (p.name4 != "") nam = p.name4;
        });
        return nam;
    };
    self.getPropByUPI = function (upi,callback) {
        $.ajax({
            url: '/api/points/' + upi,
            type: 'get',
            async: false,
            cache: false,
            success: function (d) {
                callback(d);
            }
        });
    };
    self.setProps = function(upi,callback){
        var props = self.propertiesArray();
        $.ajax({ url: '/api/points/' + upi, type:'get',
            success:function(d)
            {
                for(var key in d)
                {
                    props.push(new PropValue(key, d[key]));
                }
                self.getSequencePoint(d._parentUpi);
                self.propertiesArray(props);
                callback(null, d);

            }
        });
    };
    self.getSequencePoint = function(upi){
        $.ajax({ url: '/api/points/' + upi, type:'get',
            success:function(d)
            {
                console.log(d);
                self.sequencePoint = d;
            }
        });
    };
    self.getAlarmStates = ko.computed(function () {
        var arr = [];
        for (var key in Config.Enums["Alarm States"]) {
            arr.push(new KeyVal(key, Config.Enums["Alarm States"][key].enum));
        }
        return arr;
    });
    self.getReliabilities = ko.computed(function () {
        var arr = [];
        for (var key in Config.Enums["Reliabilities"]) {
            arr.push(new KeyVal(key, Config.Enums["Reliabilities"][key].enum));
        }
        return arr;
    });
    self.getControllerPriorities = ko.computed(function () {
        var arr = [];
        $.ajax({
            url: '/api/system/controlpriorities',
            type: 'get',
            async: false,
            cache: false,
            success: function (data) {
//                   console.log(data);
                $.each(data, function (key, val) {
                    arr.push(new KeyVal(val["Priority Text"], val["Priority Level"]));
                });

                return arr;
            }
        });
        return arr;
    });
    self.getControllers = ko.computed(function () {
        var arr = [];
        $.ajax({
            url: '/api/system/controllers',
            type: 'get',
            async: false,
            cache: false,
            success: function (data) {
//                    console.log(data);
//                    if(data == '') return arr;
                $.each(data, function (key, val) {
                    arr.push(new KeyVal(val["Controller Name"], val["Controller ID"]));
                });
                return arr;
            }
        });

        return arr;

    });

    self.changeSelect = function (data, prop) {
        if (this.selectedIndex == 0 || self.getProperty(prop) == null)
        {
            return;
        }
        if (self.getProperty(prop).Value().eValue != undefined)
        {
            self.getProperty(prop).Value().Value = this.selectedOptions[0].text;
            self.getProperty(prop).Value().eValue = this.selectedOptions[0].value;
        }
        else
        {
            self.getProperty(prop).Value().Value = this.selectedOptions[0].value;
        }


//        if (prop == "Reference Type"){
//            self.referenceType(this.selectedOptions[0].value);
//        }

    };
    self.changeVal = function (prop, data, elem) {
        self.getProperty(prop).Value().isReadOnly = false;
        self.getProperty(prop).Value().Value = Number(elem.target.value);

    };
    self.staticVal = function (data,prop) {
        eval("self." + prop + "(this.value);");
        return true;
    };
    self.staticCheck = function (data,prop) {
        eval("data." + prop + "(this.checked);");
        return true;
    };
    self.changeChecked = function (data, prop) {
        self.getProperty(prop).Value().Value = this.checked;
        if (prop == "Out of Service"){
            this.checked ? $(".valueSect").removeAttr("disabled") : $(".valueSect").attr("disabled", "disabled");
        }

        return true;
    };

    self.updateInterval = function (data, isMin) {
        if (isMin)
        {
            self.getProperty("Update Interval").Value().Value += Number(this.value) * 60;
        }
        else {
            var sec = self.getProperty("Update Interval").Value().Value;
            if (sec > 60)
            {
                self.getProperty("Update Interval").Value().Value = sec - (sec % 60) + Number(this.value);
            }
            else
            {
                self.getProperty("Update Interval").Value().Value = Number(this.value);
            }

        }


    };

    self.referenceType.subscribe(function(newRef){
        if(this.getProperty("Reference Type"))
        {
            this.getProperty("Reference Type").Value(newRef);
            this.getProperty("UPI").Value().Value = '0';
        }
    },this);


};

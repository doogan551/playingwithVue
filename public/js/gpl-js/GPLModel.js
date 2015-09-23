
$(function () {

    GPLViewModel = {

        mouseUpDetected:false,
        sequencePoint: {},
        isViewer:ko.observable(false),
        internalPropertiesCol: ko.observableArray([]),
        propertiesCol: ko.observableArray([]),
        propertiesColOriginal: ko.observableArray([]),
        selectedProp: ko.observable(new Properties("iddd")),
        beforeEditProp: {},
        beforeEditIcon:'',
        selectedChange:ko.observable(false),
        templateUrl: ko.observable(),
        devicePointName:ko.observable(),
        devicePoint:ko.observable(0),
        defaultShowValue:ko.observable(true),
        defaultShowLabel:ko.observable(true),
        defaultController:ko.observable(0),
        deletedFigures:ko.observableArray([]),
        description:ko.observable('[Description goes here]'),
        isNewSequence:false,
        switchViewModeCancel:false,
        showSwitchViewConfirmDialog:false,
        callDevicePoint: function(){
            var dp = GPLViewModel.devicePoint();
            var win = window.open('/pointselector/devicePoints/' + dp,"myPointWindow","width=722,height=600");
            win.onload = function() {
                win.dorsett.pointSelector.init(GPLViewModel.setDevicePoint);
            }
        },
        setDevicePoint:function(upi, nam){
            GPLViewModel.sequencePoint["Device Point"].isReadOnly = false;
            GPLViewModel.sequencePoint["Device Point"].Value = upi;
            GPLViewModel.sequencePoint["Device Point"].PointName = nam;
            GPLViewModel.devicePoint(upi);
            GPLViewModel.devicePointName(nam);
        },
        getSPropCheck:function(data,prop,prop1){
            data[prop].Value = this.checked;
            return true;
        },
        getSPropValue: function (data, prop, attr) {

            if(attr)
            {
                return eval("this.sequencePoint[prop]." + attr);
            }
            else{
                if(this.sequencePoint[prop])
                {
                    return this.sequencePoint[prop].Value;
                }
                else
                {
                    return "";
                }
            }
            return true;
        },
        updateInterval: function (isMin) {
            if (isMin)
            {
                GPLViewModel.sequencePoint["Update Interval"].Value += Number(this.value) * 60;
            }
            else {
                var sec = GPLViewModel.sequencePoint["Update Interval"].Value;
                if (sec > 60)
                {
                    GPLViewModel.sequencePoint["Update Interval"].Value = sec - (sec % 60) + Number(this.value);
                }
                else
                {
                    GPLViewModel.sequencePoint["Update Interval"].Value = Number(this.value);
                }

            }


        },
        getSelectedSPropEvalue: function (propName) {
            if (this.sequencePoint == null) return;
            return this.getSPropValue(null,propName).eValue;

        },
        changeSelect : function (prop) {
            if (this.selectedIndex == 0 || GPLViewModel.getSPropValue(prop) == null){
                return;
            }
            GPLViewModel.sequencePoint[prop].Value = this.selectedOptions[0].text;
            GPLViewModel.sequencePoint[prop].eValue = this.selectedOptions[0].value;
        },
        getProp: function (uniqueId) {
            return ko.utils.arrayFirst(this.propertiesCol(), function (prop) {
                return prop.id() == uniqueId;
            });
        },
        getOriginalProp: function (uniqueId) {
            return ko.utils.arrayFirst(this.propertiesColOriginal(), function (prop) {
                return prop.id() == uniqueId;
            });
        },
        getAllDeletedProps: function () {
            return ko.utils.arrayFilter(this.propertiesCol(), function (prop) {
                return prop.delete === true;
            });
        },
        getJustDeletedProp: function () {
            return ko.utils.arrayFilter(this.propertiesCol(), function (prop) {
                return prop.justDeleted === true;
            });
        },
        getPropByUPI: function (upi, idd) {
            return ko.utils.arrayFirst(this.propertiesCol(), function (prop) {
                return prop.upi() == upi && prop.id() != idd;
            });
        },
        getAllPropByUPI:function(upi){
            return ko.utils.arrayFilter(this.propertiesCol(), function (prop) {
                return prop.upi() == upi;
            });
        },
        getAllConstantProp:function(){
            return ko.utils.arrayFilter(this.propertiesCol(), function (prop) {
                return prop.shapeCategory == "Constant";
            });
        },
        addProp: function (uniqueId, shape) {
            var prop = new Properties(uniqueId, shape);
            this.propertiesCol.push(prop);
            this.propertiesColOriginal.push(prop);
        },
        removeProp : function(oldProp, newProp){
            this.propertiesCol.pop(oldProp);
            this.propertiesCol.push(newProp);
            console.log(this.getSelectedDProp("Alarm State"));
        },
        selectProp: function (uniqueId) {
            this.selectedProp(this.getProp(uniqueId));
        },
        addDProp: function (uniqueId, propName, propValue) {
            this.getProp(uniqueId).propertiesArray.push(new PropValue(propName, propValue));
        },
        getDProp: function (uniqueId, propName) {
            return ko.utils.arrayFirst(this.getProp(uniqueId).propertiesArray(), function (prop) {
                return prop.Name == propName;
            });
        },
        setPropValue: function (targetId, pr, hasValue, val) {
            var target = ko.utils.arrayFirst(this.getProp(targetId).propertiesArray(), function (prop) {
                return prop.Name == pr;
            });
            //console.log(target.Value());
            if (hasValue)
            {
                target.Value().Value = val;
            }
            else
            {
                target.Value(val);
            }
        },
        setProps:function(uniqueId, upi, givenName){
            var props = this.getProp(uniqueId).propertiesArray();
            if (upi > 0)
            {
                $.ajax({ url: '/api/points/' + upi, type:'get',
                         async: false, cache:false,
                         success:function(d)
                         {
                            console.log(d.message);
                            if (d.message === "No Point Found"){
                               var editObjs = GPLViewModel.sequencePoint["Sequence Details"][0]["Edits"];
                               for (var o in editObjs){
                                   if (editObjs[o]._id === upi){
                                        //console.log("o", upi, editObjs[o]);
                                       d = editObjs[o];
                                       for(var key in d)
                                       {
                                           props.push(new PropValue(key, d[key]));
                                       }
                                       GPLViewModel.getProp(uniqueId).isNewlyAdded = true;
                                       var interval = GPLViewModel.sequencePoint["Update Interval"].Value;
                                       GPLViewModel.getDProp(uniqueId, "Update Interval").Value().Value = interval;
                                       break;
                                   }
                               }
                            }
                            //console.log(d);
                            for(var key in d)
                            {
                                props.push(new PropValue(key, d[key]));
                            }
                         }
                });
            }
            else
            {
                var d = Config.Templates.Points[givenName];
                for (var key in d)
                {
                    props.push(new PropValue(key, d[key]));
                }
            }
            //console.log(props);
            this.getProp(uniqueId).propertiesArray(props);
            //this.getProp(uniqueId).isAccessed(true);
        },
        ensureAllUnderlyingProperties:function(id){
            var propsLength = this.getProp(id).propertiesArray().length;
            //console.log(propsLength, this.getProp(id).upi());
            //console.log(this.getProp(id).propertiesArray());
            if (propsLength == 0)
            {
                this.setProps(id,0,this.getProp(id).givenName());
            }
            if (propsLength == 1 || propsLength == 3)
            {
                this.setProps(id,this.getProp(id).upi(),this.getProp(id).givenName());
            }


        },
        setSourceTarget: function (sourceId, targetId, pr, sourceValue) {
            if(pr == undefined)return;

            this.ensureAllUnderlyingProperties(targetId);

            var target = this.getDProp(targetId, pr);
            //console.log(target, targetId, pr, sourceValue);
            if (target == null){
                this.setProps(targetId,this.getProp(targetId).upi(),this.getProp(targetId).givenName());
                target = this.getDProp(targetId, pr);
            }

            //console.log(this.getDProp(sourceId,"_id"));

            if (this.getDProp(sourceId,"_id"))
            {
                target.Value().Value = this.getDProp(sourceId,"_id").Value();
            }
            else
            {
                target.Value().Value = sourceValue;
            }
            //console.log(target.Value());
        },
        getSelectedPropValue:function(propName){
            return eval("GPLViewModel.selectedProp()." + propName +"()");

        },
        getSelectedDProp: function (propName, retValue) {
            var p = ko.utils.arrayFirst(GPLViewModel.selectedProp().propertiesArray(), function (prop) {
                return prop.Name == propName;
            });
            if (p && retValue)
            {
                return p.Value;
            }
            if (p && propName == "Reference Type")
            {
                return p.Value();
            }
            if (p)
            {
                return p.Value().Value;
            }
            return "";
        },
        isFloat: function (prop) {
            if (GPLViewModel.getSelectedDProp(prop, true) == "")
            {
                return false;
            }
            return GPLViewModel.getSelectedDProp(prop, true)().ValueType == 1;
        },
        isEnum2: function (prop) {
            if (GPLViewModel.getSelectedDProp(prop, true) == "")
            {
                return false;
            }
            return GPLViewModel.getSelectedDProp(prop, true)().ValueType == 5;
        },
        dropdownRange: function (propName) {
            var arr = [];
            //console.log(propName);
            //console.log(GPLViewModel.selectedProp().shape());
            try {
                var v = GPLViewModel.getSelectedDProp(propName, true)();
                //console.log(v);
                for (var k in v.ValueOptions)
                {
                    arr.push(new KeyVal(k, v.ValueOptions[k]));
                }
            }
            catch (e) {
                //console.log(e);
            }

            return arr;
        },
        getSelectedDPropEvalue: function (propName) {
            var p = ko.utils.arrayFirst(GPLViewModel.selectedProp().propertiesArray(), function (prop) {
                return prop.Name == propName;
            });

            if (p)
            {
                return p.Value().eValue;
            }
            return "";
        },
        getSelectedDPropCompValue: function (propName) {
            var p = ko.utils.arrayFirst(GPLViewModel.selectedProp().propertiesArray(), function (prop) {
                return prop.Name == propName;
            });

            if (p)
            {
                return p.Value().CompValue;
            }
            return "";
        },
        //This is not needed for future purpose, we will keep it around.
        saveProp: function () {
            var p = ko.utils.arrayIndexOf(this.propertiesCol(), function (prop) {
                return prop.id() == GPLViewModel.selectedProp().id();
                if (p > 0)
                {
                    GPLViewModel.propertiesCol.replace(GPLViewModel.propertiesCol()[p], GPLViewModel.selectedProp());
                }
            });
        },
        bgColor:ko.observable('#ffffff'),
        //alarmStates : ko.observableArray([new KeyVal("Loading", -1)]),
        controllers : ko.observableArray([new KeyVal("[Not Selected]", 0)]),
        controlPriorities: ko.observableArray([new KeyVal("Loading", -1)]),

        openPointSelector: function () {
            var win = window.open('/pointselector/gpl/' + GPLViewModel.selectedProp().upi(),"myPointWindow","width=722,height=600");
            win.onload = function() {
                win.dorsett.pointSelector.init(setPoint);
            }

        },
        openPointReview: function (upi) {
            //var upi = this.getUserData().upi;
            var pointUrl = '/pointreview';
            $.ajax({
                url: pointUrl, async: false,
                type: 'post', data: {'id': upi},
                success: function (data, status) {
                    var wintab = '';
                    if (data.tabOpen) {
                        wintab = window.open(data.url, "pointReviewWindow");
                    }
                    else {
                        wintab = window.open(data.url, "", "width=482,height=600");
                    }
                    wintab.focus();

                }
            });
        },
        changeVal: function (dd) {
            GPLViewModel.getDProp(f.id,"Value").Value().Value = dd;
        },
        changeController : function (topic) {
            var figs = window.app.view.getFigures();
            for (var i=0; i < figs.getSize(); i++)
            {
                var f = figs.get(i);
                if (f instanceof dorsett.shape.node.Object)
                {
                    if (GPLViewModel.getDProp(f.id,topic) == null)
                    {
                        var upi = GPLViewModel.getProp(f.id).upi();
                        GPLViewModel.setProps(f.id,upi, f.GivenName);
                    }
                    GPLViewModel.getDProp(f.id,topic).Value().Value = GPLViewModel.sequencePoint[topic].Value;
                    GPLViewModel.getDProp(f.id,topic).Value().eValue = GPLViewModel.sequencePoint[topic].eValue;
                    GPLViewModel.getProp(f.id).updated(true);

                }
            }
            $("#divSeqProp").unblock();
        },
        applyAll:function(){
            $("#divSeqProp").block({message:"<img src='/img/busy.gif' alt='Busy...'>",
            onBlock:function(){
                var topic = this.toString();
                if (topic == "Controller" || topic == "Update Interval"){
                    GPLViewModel.changeController(topic);
                    return;
                }
                var figs = window.app.view.getFigures();
                for (var i=0; i < figs.getSize(); i++)
                {
                    var f = figs.get(i);
                    if (!(f instanceof dorsett.shape.basic.Label)) {
                        if (topic == "Show Label") {
                            GPLViewModel.getProp(f.id).showLabel(GPLViewModel.sequencePoint[topic].Value);
                        }
                        else {
                            GPLViewModel.getProp(f.id).showValue(GPLViewModel.sequencePoint[topic].Value);
                        }
                    }

                }
                $("#divSeqProp").unblock();
            }});
        },
        restoreFigure:function(){
           window.app.view.restorePoint(this);
        },
        purgeFigure:function(){
            GPLViewModel.deletedFigures.remove(this);
        },
        switchCancel:function(){
            $('#viewMode').jqxSwitchButton({checked:false});
            this.switchViewModeCancel = true;
            $("#modal-ConfirmDialog").modal('hide');

        },
        switchToViewMode:function(){

            $("#modal-ConfirmDialog").modal('hide');
            this.switchViewModeCancel = false;

            $.blockUI({message:"<h4>Switching to View Mode...Please Wait</h4>",
                onBlock:function(){
                    $.ajax({
                        url:'/gpl/unlockSequence',
                        type:'POST',
                        data:JSON.stringify({id:iddd}),
                        contentType:'application/json',
                        success:function(d){
                            GPLViewModel.isViewer(true);
                            //iToast.showNotification('Notification', d.message,{icon:'lock', theme: 'jetblack' });
                        }
                    });
                }

            });

        },
        discardChangesDialog:function(){
            $("#modal-SaveDialog").modal("hide");
            $("#modal-ConfirmDiscardDialog").modal('show');
            this.switchViewModeCancel = false;
            GPLViewModel.showSwitchViewConfirmDialog = false;
        },
        discardChanges:function(){
            window.app.view.discardChanges();
        }

    };

    GPLViewModel.selectedProp.subscribe(function(){
        GPLViewModel.selectedChange(true);
    });
    GPLViewModel.defaultShowLabel.subscribe(function(value){
        GPLViewModel.sequencePoint["Show Label"].Value = value;
    });
    GPLViewModel.defaultShowValue.subscribe(function(value){
        GPLViewModel.sequencePoint["Show Value"].Value = value;
    });


    GPLViewModel.isViewer.subscribe(function(value){

        window.app.view.clear();
        GPLViewModel.deletedFigures([]);
        GPLViewModel.propertiesCol([]);
        GPLViewModel.propertiesColOriginal([]);
        //GPLViewModel.showSwitchViewConfirmDialog = true;

        $.ajax({
            url: '/api/points/' + iddd,
            type: 'get',
            async: true,
            cache: true,
            success: function (d) {
                GPLViewModel.sequencePoint = d;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                iToast.showError("Error", "User Authentication Failed.");
                callback(null);
            }
        });

//        window.app.view.getSequence()
//        ko.utils.arrayFirst(GPLViewModel.propertiesCol(), function (prop) {
//            GPLViewModel.propertiesCol.pop(prop);
//            GPLViewModel.propertiesColOriginal.pop(prop);
//        });
        if (value){
            $(".editMode").hide();
        }
        else{
            $(".editMode").show();
            tinymce.init({
                selector: "div.editmode",
                inline: false,
                plugins: ["textcolor"],
                toolbar: "bold italic | forecolor backcolor",
                menubar: false,
                statusbar:false,
                fontsize_formats: "8pt 10pt 12pt 14pt",
                setup : function(ed) {
                            ed.on("keyup", function(e) {
                                GPLViewModel.sequencePoint["Description"].Value = ed.getContent();
                                GPLViewModel.description(ed.getContent());
                            });
                        }
            });

            GPLViewModel.sequencePoint["Sequence Details"][0]["Edits"] ? $("#discardChanges").removeAttr("disabled") : $("#discardChanges").attr("disabled", "disabled");


        }
         var isActivated = GPLViewModel.sequencePoint["Sequence Details"][0].isActivated;
         if (!value && isActivated === false){
             window.app.view.drawFigures(GPLViewModel.sequencePoint["Sequence Details"][0]["Edit Version"]);
             var orphans = GPLViewModel.sequencePoint["Sequence Details"][0]["Edits"]["Orphaned Figures"];
             ko.utils.arrayForEach(orphans, function(orphan){
                 //console.log(GPLViewModel.getPropByUPI(orphan._id));
                 GPLViewModel.getPropByUPI(orphan._id).setProps(orphan);
                 GPLViewModel.getAllPropByUPI(orphan._id)[0].isNewlyAdded = true;
             });

             var deletedFigures = GPLViewModel.sequencePoint["Sequence Details"][0]["Edits"]["Deleted Figures"];
             ko.utils.arrayForEach(deletedFigures, function(df){
                 GPLViewModel.deletedFigures.push(df);
             });

             iToast.showWarn("Edit Version...", "Previously Saved Version has been loaded");
         }
        else
         {
             window.app.view.drawFigures(GPLViewModel.sequencePoint["Sequence Details"]);
         }

        $('#zoomSlider').jqxSlider('setValue',5);


    });

    GPLViewModel.bgColor.subscribe(function(newValue){
        $('#canvas').css({"background-color":newValue});
    });


    ko.applyBindings(GPLViewModel);

    window.app = new dorsettGPL.Application();




});






var dorsett = dorsett || {};
var pm = new PointModel("unique");
var beforeEdit = {};
dorsett.pointProperties = (function(){
    return {
        init:function(pointProps, isNonPoint){
            console.log(window.opener.app);
            var upi = window.location.pathname.split("/")[3];
            if (pointProps === null){
                pm.setProps(upi,this.applyBindings);
                pm.upi(upi);
            }
            else{
                this.isNonPoint = isNonPoint;
                if (isNonPoint)
                {
                    pm.shape = pointProps.shape;
                    pm.shapeCategory = pointProps.shapeCategory;
                    pm.internalRefs(pointProps.internalRefs());
                    pm.internalRef(pointProps.internalRef());
                    pm.constantFloat(pointProps.constantFloat());
                    pm.constantEnum(pointProps.constantEnum());
                    //console.log(pointProps.propertiesArray()[0].Value());
                    pm.referenceType(pointProps.referenceType());
                    pm.referenceList(pointProps.referenceList());
                    pm.segment(pointProps.segment());
                }
                pm.showLabel(pointProps.showLabel());
                pm.showValue(pointProps.showValue());
                pm.lbl(pointProps.lbl());
                pm.upi(pointProps.upi());

                this.applyBindings(pointProps.propertiesArray());
                if (upi === "0")
                {
                    $("header h6").text("Point Review - " + pm.getProperty("Name").Value().replace("+", " "));
                }

            }



        },
        isNonPoint:false,
        applyBindings:function(propsArray, originalPointProps){
            ko.applyBindings(pm);
            //console.log(propsArray);
            if (propsArray)
            {
                pm.propertiesArray(propsArray);
            }

            if(originalPointProps)
            {
                beforeEdit = JSON.stringify(originalPointProps, null, 2);
            }

        },
        clone: function(obj) {
            if (null == obj || "object" != typeof obj) {
                return obj;
            }
            var copy = obj.constructor();
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
            }
            return copy;
        },
        applyChanges:function(){
            if (window.opener.GPLViewModel != null){
                //console.log(window.opener);
                if (window.opener.GPLViewModel.isViewer()){
                    this.saveImmediate(function(){
                        window.opener.app.view.applyChanges(this.isNonPoint,pm);
                        //window.close();
                    });
                }else{
                    window.opener.app.view.applyChanges(this.isNonPoint,pm);
                    window.close();
                }
            }
            else
            //Save directly
            {
                this.saveImmediate();

            }
        },
        saveImmediate:function(callback){
            $("#save").text("Saving....");
            var newPoint = this.getPropArray();
            var oldPoint = {};
            var self = this;
            //console.log(beforeEdit, typeof(beforeEdit));
            if (typeof(beforeEdit) === 'object'){
                pm.getPropByUPI(pm.upi(),function(d){
                   self.updatePoint(newPoint, d);
                    callback();
                });
            }
            else
            {
                oldPoint = JSON.parse(beforeEdit);
                self.updatePoint(newPoint, oldPoint);
            }

            //TODO
            //Saving object that can change icon
            //            console.log(pm.sequencePoint);
            //            var oldSeq = pm.sequencePoint;
            //            var newSeq = pm.sequencePoint;
            //            var seqDetails = pm.sequencePoint["Sequence Details"];
            //
            //            var n = seqDetails.length;
            //            console.log(seqDetails);
            //            for(var i=0; i< n; i++){
            //                if (seqDetails[i]["props"]){
            //                    if (seqDetails[i]["props"].UPI.Value == pm.upi()){
            //                        console.log(seqDetails[i]);
            //                    }
            //                }
            //            }

            //console.log(newPoint, beforeEdit);

        },
        updatePoint:function(newPoint, oldPoint){
            console.log(newPoint, oldPoint);
            $.ajax({
                url:"/api/points/update",
                type:'Post',
                contentType:'application/json',
                data:JSON.stringify({'newPoint': newPoint, 'oldPoint' : oldPoint}),
                success:function (data) {
                        if (data.err)
                        {
                            $(".errorMsg").html(data.err).fadeIn().delay(3000).fadeOut();
                            $("#save").text("Error Occurred....");
                        }
                        else
                        {
                            $(".successMsg").html("Data has been saved successfully.").fadeIn().delay(3000).fadeOut();
                            $("#cancel").text("Close");
                            $("#save").text("Save");
                            if (typeof(callback) == 'function'){
                                callback();
                            }
                        }
                }
            });
        },
        //TODO
        saveSequence:function(){

        },
        cancelChanges:function(){
            if (window.opener.app != null){
                window.opener.app.view.cancelChanges();
            }
            window.close();

        },
        openPointSelector : function(){
            var self = this;
            var win = window.open('/pointselector/gpl/' + pm.upi(),"myPointWindow","width=722,height=600");
            win.onload = function() {
                win.dorsett.pointSelector.init(self.setPoint);
            }
        },
        setPoint:function(upi,nam){
            pm.upi(upi);
            pm.segment(nam);

            var splitName = nam.split("_");
            var lbl = "";
            if (splitName[0]) lbl = splitName[0];
            if (splitName[1]) lbl = splitName[1];
            if (splitName[2]) lbl = splitName[2];
            if (splitName[3]) lbl = splitName[3];
            pm.lbl(lbl);

            $.ajax({
                url: '/api/points/' + upi,
                type: 'get',
                success: function (msg) {
                    if (msg.Value.ValueType == 5) {
                        pm.valueType('Enum');
                        pm.isEnum(true);
                    }
                    else if (msg.Value.ValueType == 1)
                    {
                        pm.isEnum(false);
                        pm.valueType('Float');
                    }

//                GPLViewModel.selectedProp().segment(msg.Name);
//                GPLViewModel.selectedProp().upi(msg._id);
                    pm.valu(msg);

//                window.app.view.updateFigure(GPLViewModel.selectedProp().id(),true);
//                window.app.view.validateSequence(function(){
//                    //$('#popupBasic').popup('close');
//                });

                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert('An error occurred. System Administrator is aware of this error.');
                }
            });

        },
        getPropArray:function(){
            this.propertiesArray = {};
            var propArray = pm.propertiesArray();
            //console.log(propArray);
            for (var k in propArray)
            {
                if (propArray[k].Name)
                {
                    this.propertiesArray[propArray[k].Name] = propArray[k].Value();
                }
            }
            return this.propertiesArray;

        }


    }
})();


$(document).ready(function () {
    //console.log(window.opener.app);
    if (window.opener == null){
        $(".errorMsg").html("This URL cannot be opened outside of Point Navigator or GPL. This page is not functional.");
    }

    if (window.opener.app == null)
    {
        dorsett.pointProperties.init(null, false);
    }

    $(".errorMsg").hide();
    $(".successMsg").hide();

});

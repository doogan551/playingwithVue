dorsettGPL.View = draw2d.Canvas.extend({
    sequenceUPI: '',
    sequenceDetails:{},
    backgroundColor:'#d8d8d8',
    originalSequencePoint:{},
    qualityCodes:{},
    socketObj:{},
    init: function (id) {
        this._super(id, 2000,2000);
        this.setScrollArea("#" + id);
        this.givenNames = new draw2d.util.ArrayList();
        this.installEditPolicy( new draw2d.policy.canvas.SnapToGeometryEditPolicy());

        //this.installEditPolicy( new draw2d.policy.canvas.FadeoutDecorationPolicy());
        GPLViewModel.bgColor(this.backgroundColor);
        var self = this;
        $('#modal-addPoint').on('hidden.bs.modal', function (e) {
            if (self.dropCancel)
            {
                self.revertDrop();
            }
            if ($(e.target).attr('data-refresh') == 'true') {
                $(e.target).removeData('bs.modal');
            }
        });


    },
    checkName: function () {
        //Validate the field is not empty
        var lb = $('#lblname')[0];
        if ($(lb).val() == '') {
            alert('Field cannot be left empty');
            return;
        }
        //check Name logic

        var self = GPLViewModel.getProp(this.newFigureId);
        self.lbl($(lb).val());
        //this.title += "_" + $(lb).val();
        //GPLViewModel.setPropValue(this.newFigureId,"Name",false,this.title);

        //console.log(this.title);
        //self.propertiesArray.push(new PropValue("Label", {"Value" : lb }));
        var d = Config.Templates.Points[this.newFigureName];
        for (var key in d) {
            self.propertiesArray.push(new PropValue(key, d[key]));
        }
        //$('#dialogLabelInput').popup('close');

    },
    revertDrop: function () {
        var f = this.getFigure(this.newFigureId);
        //console.log(f);
        var command = new draw2d.command.CommandDelete(f);
        this.getCommandStack().execute(command);
    },
    newFigureId: '',
    newFigureName: '',
    dropCancel:true,
    onDragEnter:function(){
        $("#myPanel").hide();
        $("#toolbarOpen").hide();
    },
    onDrag:function(droppedDomNode, x, y){

    },
    onDrop: function (droppedDomNode, x, y) {
        var dupeNumber = 1;
        var lbl = "";
        var isPoint = false;

        var figure = getProperFigureClass({type:$(droppedDomNode).data("shape"), id:draw2d.util.UUID.create()});
        figure.setDraggable(true);

        this.newFigureName = figure.GivenName;

        if (!(figure instanceof draw2d.shape.basic.Label) && figure.GivenName != "Input" && figure.GivenName != "Output" && figure.GivenName != "Constant")
        {
            isPoint = true;
        }

        if (!(figure instanceof draw2d.shape.basic.Label))
        {
            figure.setColor("#ff0000");
            figure.setStroke(1);
        }

        if (isPoint)
        {
            //$( "#myPanel" ).panel( "close" );
            var splitName =GPLViewModel.sequencePoint.Name.split('_');
            var name1, name2, name3, name4;
            var requiredLabel = "pointname1";
            if (splitName[0]) {
                name1 = splitName[0];
            }
            if (splitName[1]) {
                name2 = splitName[1];
            }
            else
            {
                requiredLabel = "pointname2";
            }
            if (splitName[2]) {
                name3 = splitName[2];
            }
            else
            {
                requiredLabel = "pointname3";
            }
            if (splitName[3]) {
                name4 = splitName[3];
            }
            else{
                requiredLabel = "pointname4";
            }


            var rec= {"requiredLabel": requiredLabel, "pointTypeSupplied": figure.GivenName,
                "dp":GPLViewModel.devicePoint(),"dpName" : GPLViewModel.devicePointName(),
                "isPointTypeSupplied" : true, "Name" : GPLViewModel.sequencePoint.Name,
                "record" : {"name1" : name1, "name2": name2, "name3" : name3, "name4" : name4}};

            $('#addForm').load('/api/points/pointTypes/addpointwizard1', rec);
            $('#modal-addPoint').modal({keyboard:false,show:true});

        }
        else
        {
            lbl = figure.GivenName + dupeNumber;
            for (var i = 0; i < this.figures.data.length; i++) {
                if (this.figures.data[i] instanceof draw2d.shape.node.IconObject){
                    if (this.figures.data[i].GivenName == figure.GivenName) {
                        if (this.givenNames.indexOf(figure.GivenName))
                            dupeNumber++;
                    }
                    lbl = figure.GivenName + dupeNumber;
                    this.givenNames.add(lbl);


                }
            }
        }

        var command = new draw2d.command.CommandAdd(this, figure, x - 15, y - 15 + $(document).scrollTop());

        this.getCommandStack().execute(command);

        if (!(figure instanceof draw2d.shape.basic.Label) && !isPoint)
        {
            GPLViewModel.getProp(figure.id).lbl(lbl);
        }
        if (isPoint){
            GPLViewModel.getProp(figure.id).isNewlyAdded = true;
        }

        if (!(figure instanceof draw2d.shape.basic.Label)){
            GPLViewModel.getProp(figure.id).showLabel(GPLViewModel.defaultShowLabel());
            GPLViewModel.getProp(figure.id).showValue(GPLViewModel.defaultShowValue());

        }

        //GPLViewModel.getProp(figure.id).showLabel();

        this.newFigureId = figure.id;

        $("#myPanel").show();
        $("#toolbarOpen").show();


    },
    assignProperties:function(figProps,assignedLabel){
        var fig = GPLViewModel.getProp(this.newFigureId);
        for (var key in figProps) {
            fig.propertiesArray.push(new PropValue(key, figProps[key]));
        }
        GPLViewModel.getProp(this.newFigureId).lbl(assignedLabel);
        $('#modal-addPoint').modal('hide');

    },
    applyChanges: function (isNonPoint, pointProps){
        var figProp = GPLViewModel.selectedProp();
        figProp.isAccessed(true);
        if (figProp.isNewlyAdded === false && !(figProp instanceof draw2d.shape.node.IconObject))
        {
            figProp.updated(true);
        }
        figProp.lbl(pointProps.lbl());

        if (isNonPoint){
            figProp.shape = pointProps.shape;
            figProp.upi(pointProps.upi());
            figProp.valueType(pointProps.valueType());
            figProp.internalRef(pointProps.internalRef());
            //console.log(figProp.internalRef());
            figProp.referenceType(pointProps.referenceType());
            //console.log(GPLViewModel.getSelectedDProp("Reference Type"));
            //figProp.propertiesArray[0]["Reference Type"].Value = pointProps.referenceType();
            figProp.segment(pointProps.segment());
            console.log(pointProps.referenceType(),pointProps.valueType(),pointProps.constantFloat());
            if (pointProps.referenceType() === "Constant"){
                if (pointProps.valueType() === "Float"){
                    figProp.constantFloat(pointProps.constantFloat());
                }
                else
                {
                    figProp.constantEnum(pointProps.constantEnum());
                }
            }
            else if (pointProps.referenceType().indexOf("InternalRef") > -1){
                var internalRef =pointProps.internalRef();

                var index = figProp.internalRefs().indexOfVal(internalRef);
                figProp.lbl(figProp.internalRefs()[index].key);
            }
            else{
                console.log(pointProps.valu());
                figProp.valu(pointProps.valu());
            }

        }
        figProp.showLabel(pointProps.showLabel());
        figProp.showValue(pointProps.showValue());
        figProp.propertiesArray(pointProps.propertiesArray());

        var iconChangePropertyValue = "";
        var iconChangeProperty = figProp.iconChange().prop;
        //console.log(pointProps.propertiesArray());
        //console.log(iconChangeProperty,GPLViewModel.getSelectedDPropEvalue("Calculation Type"));
        _.each(iconChangeProperty,function(k){
            var dynamicProperty = GPLViewModel.getSelectedDProp(k);
            //console.log(k, dynamicProperty,figProp.iconChange());
            iconChangePropertyValue += dynamicProperty.toString();
        });
        //console.log(iconChangePropertyValue);
        if (iconChangePropertyValue == "") return;
        var valueList = figProp.iconChange().values;
        //console.log(valueList);
        for (var i=0; i< valueList.length; i++){
            for (var key in valueList[i]){
                //console.log(iconChangePropertyValue, key.toString(), iconChangePropertyValue == key.toString());
                if (iconChangePropertyValue == key.toString()){
                    var self = this.getFigure(figProp.id());
                    //console.log(iconChangePropertyValue, key, valueList[i][key]);
                    if (typeof (self.iconInterpreter)  === 'function'){
                        iconChangePropertyValue = self.iconInterpreter(iconChangePropertyValue);
                    }
                    figProp.iconChangeFn(self.icon + iconChangePropertyValue);
                    self.NAME = valueList[i][key];
                    if (self.refType !== "undefined"){self.refType = key;}
                    //console.log(self.NAME, self.refType);
                    //console.log(key);
                    //figProp.iconChangeFn(key,figProp);
                    break;

                }
            }
        }
    },
    cancelChanges: function () {

        var self = GPLViewModel.selectedProp();
        self.setPersistentAttributes(JSON.parse(GPLViewModel.beforeEditProp));

    },
    displayJSON: function (saveDisplay) {
        var result = JSON.stringify(this.viewJSON(), null, 2);
        if (saveDisplay) {
            $("#preview").text(result);
        }

    },
    viewJSON: function () {

        var result = [];
        var figures = this.getFigures();
        if (GPLViewModel.devicePointName() != "")
        {
            $.ajax({url: '/api/points/' + GPLViewModel.devicePoint(), success: function (d) { GPLViewModel.devicePointName(d.Name);}});
        }
        var bgc = new draw2d.util.Color($("#canvas").css("background-color"));
        result.push({
            "idd": this.sequenceUPI,
            "deviceUPI" : GPLViewModel.devicePoint(),
            "devicePointName" : GPLViewModel.devicePointName(),
            "backgroundColor": bgc.rgb2hex($("#canvas").css("background-color"))
        });


        for (var i = 0; i < figures.getSize(); i++) {
            var f = null;
            f = figures.get(i);
//            console.log(f.getPersistentAttributes());
            var fData = f.getPersistentAttributes();

            if (f instanceof draw2d.shape.node.Object){
                //console.log(fData.props["UPI"]);
                var upi = fData.props._id;
                if (upi === undefined)
                    upi = fData.props["UPI"].Value ;
                delete fData.props;
                //console.log();
                fData.props = {"UPI" : { Value: upi } };
            }
            result.push(fData);
        }

        var lines = this.getLines();
        lines.each(function (i, element) {
            //console.log(element);
            result.push(element.getPersistentAttributes());
        });


        return result;
    },
    saveWork:function(){
        $("#modal-SaveDialog").modal("hide");
        this.activateSequence(false, true, function(){
            iToast.showSuccess('Success','Your work has been saved.');
            GPLViewModel.showSwitchViewConfirmDialog = false;
            $("#viewMode").jqxSwitchButton('check');
        });
    },
    openSaveDialog:function(){
        $("#modal-SaveDialog").modal("show");
    },
    discardChanges:function(){
        var self = this;
        $.blockUI({message:"<img class='center' src='/img/busy.gif' width='30px' height='30px' alt='Busy...'><h4>Discarding Changes...</h4>",
            onBlock:function(){
                $("#modal-SaveDialog").modal("hide");
                //self.activateSequence(true,true, function(){
                var oldPoint = JSON.parse(self.originalSequencePoint);
                oldPoint["Sequence Details"][0]["isActivated"] = true;
                if (oldPoint["Sequence Details"][0]["Edits"])
                {
                    delete oldPoint["Sequence Details"][0]["Edits"];
                    delete oldPoint["Sequence Details"][0]["Edit Version"];
                }
                //console.log(oldPoint);
                self.updateSequence(oldPoint, JSON.parse(self.originalSequencePoint), false,function(){
                        GPLViewModel.showSwitchViewConfirmDialog = false;
                        $("#viewMode").jqxSwitchButton('check');
                        $.unblockUI();
                        iToast.showCool("Discarded", "All changes made to the sequence has been discarded.");
                    });
                //});
            }
        });

    },
    saveAndPublish: function () {
        var self = this;
        $.blockUI({message:"<img class='center' src='/img/busy.gif' width='30px' height='30px' alt='Busy...'><h4>Activatiion in Progress...</h4>",
            onBlock:function(){
                $("#modal-SaveDialog").modal("hide");
                self.validateSequence(function(isValid){
                    if (isValid){
                        self.activateSequence(true,false, function(){
                            GPLViewModel.showSwitchViewConfirmDialog = false;
                            $("#viewMode").jqxSwitchButton('check');
                            $.unblockUI();
                        });
                    }
                });
            }});
    },
    drawFigures:function(obj){
        var self = this;
        this.sequenceDetails = obj;
        var reader = new draw2d.io.json.Reader(self);
        reader.unmarshal(obj,function(socketObj){
            self.socketObj = socketObj;

            if (GPLViewModel.isViewer()){
                var sess = {};
                sess.socketid = socket.socket.sessionid;
                sess.display = {};
                sess.display["Screen Objects"] = socketObj.gplObjects;
                socket.emit('displayOpen', {
                    data: sess
                });

                var upiConstantList = GPLViewModel.getAllConstantProp();
                async.each(upiConstantList,function(obj){
                    obj.setValueText(obj.valu());
                });
            }


            self.sequenceUPI = obj[0].idd;
            GPLViewModel.devicePoint(obj[0].deviceUPI);
            if (obj[0].backgroundColor){
                GPLViewModel.bgColor(obj[0].backgroundColor);
            }
        });

        $.unblockUI({fadeOut:200});

        $("#loadingScreen").addClass('animated fadeOutDown');
        $("#loadingScreen").hide('slow');


    },
    getSequence:function(callback){
        if (isOld === 'false'){
            callback(point);
        }
        else
        {
            $.ajax({
                url: '/api/points/' + iddd,
                type: 'get',
                async: true,
                cache: true,
                success: function (d) {
                    callback(d);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    iToast.showError("Error", "User Authentication Failed.");
                    callback(null);
                }
            });
        }


    },
    updateFigure: function(fid, isSourcePort){
        var figures = this.getFigures();
        for (var j = 0; j < figures.getSize(); j++){
            var f = figures.get(j);
            var numberofLines = 0;
            if (f.id == fid){
                var lines = this.getLines();
                for(var i=0; i < lines.getSize(); i++){
                    var l = lines.get(i);
                    var portIndex = -1;
                    if(isSourcePort && fid == l.sourcePort.name.split("_")[0])
                    {
                        if (l.sourcePort.getRequired())
                        {
                            numberofLines++;
                        }
                        else
                        {
                            portIndex = parseInt(l.sourcePort.name.split("_")[1]);
                            if (f.requiredPorts.indexOf(portIndex) > -1){
                                numberofLines++;
                            }

                        }
                    }

                    if(!isSourcePort && fid == l.targetPort.name.split("_")[0])
                    {
                        if (l.targetPort.getRequired()){
                            numberofLines++;
                        }
                        else
                        {
                            portIndex = parseInt(l.targetPort.name.split("_")[1]);
                            if (f.requiredPorts.indexOf(portIndex) > -1){
                                numberofLines++;
                            }

                        }

                    }

                    //if (f.GivenName == "Logical"){
                    //    console.log(portIndex, f.requiredPorts,f.requiredPorts.indexOf(portIndex));
                    //}


                }

                if ( numberofLines >= f.minRequiredConnection){
                    f.setStroke(1);
                    f.setColor('#000000');
                    if (f instanceof draw2d.shape.node.IconObject){
                        f.setStroke(0);
                    }

                }
                break;
            }

        }
    },
    validateSequence: function(callback){
        var isValid = true;
        var figures = this.getFigures();
        for (var j=0; j<figures.getSize(); j++){
            var f = figures.get(j);
            if (f instanceof draw2d.shape.node.Object || f instanceof draw2d.shape.node.IconObject)
            {
                if (f.getColor().hash().toLowerCase() == "#ff0000"){
                    isValid = false;
                    iToast.showWarn('Warning', "<b>" + GPLViewModel.getProp(f.id).lbl() +"</b> (" + f.GivenName +  ") is missing some properties.");
                    $.unblockUI();
                }

                if (f instanceof draw2d.shape.node.IconObject){
                    try{
                        if (GPLViewModel.getDProp(f.id,"UPI").Value().Value === 0){
                            isValid = false;
                            iToast.showWarn('Warning', "<b>" + GPLViewModel.getProp(f.id).lbl() +"</b> (" + f.GivenName +  ") is missing required point definition.");
                            $.unblockUI();
                        }
                    }
                    catch(e){
                        isValid = false;
                        iToast.showWarn('Warning', "<b>" + GPLViewModel.getProp(f.id).lbl() +"</b> (" + f.GivenName +  ") is missing required point definition.");
                        $.unblockUI();
                    }

                }
            }
        }
        if (isValid){
            var lines = this.getLines();
            for(var i=0; i < lines.getSize(); i++){
                var l = lines.get(i);
                l.setColor('#000000');
                l.setStroke(1);
                var sourceFigId = l.sourcePort.name.split("_")[0];
                var figProp = GPLViewModel.getProp(sourceFigId);
                if (figProp.upi() == 0 && figProp instanceof draw2d.shape.node.ConstantValueObj)
                {
                    isValid = false;
                    var constnumber =parseFloat(figProp.getProperty("Constant Value").Value().Value);
                    if (typeof constnumber == 'number')
                        isValid = true;
                }
                if (!isValid)
                {
                    l.setColor('#e80d0d');
                    l.setStroke(3);
                    iToast.showWarn('Warning',"Please correct connections in red.");
                    $.unblockUI();
                    break;
                }
            }
        }
        if (isValid && callback){
            callback(isValid);
        }
        if (!isValid && callback){
            callback(isValid);
        }

    },
    updateSequence:function(sp, oldSP, activateSeq,callback){

        $.ajax({
            url:"/api/points/update",
            type:'Post',
            contentType:'application/json',
            data:JSON.stringify({'newPoint': sp, 'oldPoint' : oldSP}),
            success: function (data) {
                if (data.err)
                {
                    iToast.showError('Error', data.err);
                    $.unblockUI();
                    return null;
                }
                else
                {
                    if (activateSeq)
                    {
                        iToast.showSuccess('Success','Sequence has been updated.');
                    }
                    if (typeof (callback)=== 'function')
                    {
                        return callback();
                    }
                }
            }
        });
    },
    activateSequence : function(activateSeq, onlySave, callback){
        var sp = GPLViewModel.sequencePoint;
        var oldPoint = JSON.parse(this.originalSequencePoint);

        if (!activateSeq)
        {
            oldPoint["Sequence Details"][0]["isActivated"] = false;
            oldPoint["Sequence Details"][0]["Edits"] = {};
            oldPoint["Sequence Details"][0]["Edits"]["Orphaned Figures"] = [];
            for (var i=0; i<this.figures.getSize(); i++){
                var ff = this.figures.get(i);
                if (ff instanceof draw2d.shape.node.Object && GPLViewModel.getProp(ff.id).isNewlyAdded){
                    oldPoint["Sequence Details"][0]["Edits"]["Orphaned Figures"].push(ff.props());

                }
            }

            oldPoint["Sequence Details"][0]["Edit Version"] = this.viewJSON();
            oldPoint["Sequence Details"][0]["Edits"]["Deleted Figures"] = [];
            ko.utils.arrayForEach(GPLViewModel.deletedFigures(), function(df) {
                oldPoint["Sequence Details"][0]["Edits"]["Deleted Figures"].push(df);
            });

            $.ajax({
                url:"/api/points/update",
                type:'Post',
                contentType:'application/json',
                data:JSON.stringify({'newPoint': oldPoint, 'oldPoint':sp}),
                success: function (data) {
                    if (data.err)
                    {
                        iToast.showError('Error', data.err);
                        $.unblockUI();
                        return null;
                    }
                    else
                    {
                        return callback();
                    }
                }
            });

        }
        else
        {
            sp["Sequence Details"] = this.viewJSON();
            sp["Sequence Details"][0]["isActivated"] = true;
            if (sp["Sequence Details"][0]["Edits"])
            {
                delete sp["Sequence Details"][0]["Edits"];
            }
        }
        if (onlySave){
            return;
        }

        //Check for brand new sequence otherwise update existing one.
        if (GPLViewModel.isNewSequence){
            $.ajax({
                url:'/api/points/addPoint',
                contentType:'application/json',
                type:'Post',
                async:false,
                data:JSON.stringify(sp),
                success: function (data) {
                    if (data.err)
                    {
                        iToast.showError('Error', data.err);
                        $.unblockUI();
                        return null;
                    }
                    else
                    {
                        if (typeof (callback)=== 'function')
                        {
                            return callback();
                        }
                        else
                        {
                            iToast.showSuccess('Success','Sequence has been added.');
                            return null;
                        }

                    }
                }
            });
        }
        else{
            this.updateSequence(sp,oldPoint, true, callback);
        }

        //iToast.showNotification('Notification','Sequence activation in progress.',{icon: 'comment'});

        //Get All figures
        var figures = this.getFigures();
        for (var j=0; j<figures.getSize(); j++){
            var f = figures.get(j);

            if (f instanceof draw2d.shape.node.Object)
            {

                if (GPLViewModel.getProp(f.id).isNewlyAdded){
                    var fdata = f.getPersistentAttributes().props;
                    fdata._parentUpi = parseInt(sp._id);
                    $.ajax({
                        url:"/api/points/addPoint",
                        contentType:'application/json',
                        type:'Post',
                        async:true,
                        data:JSON.stringify(fdata),
                        success: function (data) {
                            if (data.err)
                            {
                                iToast.showError('Error', data.err);
                            }
                            else
                            {
                                GPLViewModel.getProp(f.id).isNewlyAdded = false;
                                iToast.showSuccess('Success', "<b>" + GPLViewModel.getProp(f.id).lbl() +"</b> (" + f.GivenName +  ") has been added as Point.");
                            }
                        }
                    });

                }
                else if(GPLViewModel.getProp(f.id).updated()){
                    var newPoint = f.getPersistentAttributes().props;
                    oldPoint = {};
                    var upi = GPLViewModel.getProp(f.id).upi();
                    $.ajax({ url: '/api/points/' + upi, type: 'get', async: false, cache: false, success: function (d) {
                        oldPoint = d;
                    } });

                    //var oldPoint = JSON.parse(GPLViewModel.getProp(f.id).previousVersion());

                    for(var obj in oldPoint){
                        if (typeof(oldPoint[obj]) === "object"){
                            if (JSON.stringify(oldPoint[obj]) !== JSON.stringify(newPoint[obj])){
                                newPoint[obj]["Activity Log"] = {
                                    "log": "Created"
                                };
                            }
                        }
                    }

                    //console.log(newPoint, oldPoint);

                    $.ajax({
                        url:"/api/points/update",
                        type:'Post',
                        contentType:'application/json',
                        data:JSON.stringify({'newPoint': newPoint, 'oldPoint' : oldPoint}),
                        success: function (data) {
                            if (data.err)
                            {
                                iToast.showError('Error', data.err);
                            }
                            else
                            {
                                //console.log(GPLViewModel.getProp(f.id));
                                GPLViewModel.getProp(f.id).updated(false);
                            }
                        }
                    });
                }

            }
        }

        //Get Deleted Ones
        var deletedFigures = GPLViewModel.getAllDeletedProps();

        _.each(deletedFigures, function(df){
            iToast.showNotification('Notification',"Deleting <b>" + df.lbl() +"</b> (" + df.givenName() +  ")",{icon: 'comment', iconColor: 'green'});
            $.ajax({
                url:"/api/points/deletePoint",
                contentType:'application/json',
                type:'Post',
                async:true,
                data:JSON.stringify({upi:df.upi(), type:'soft'}),
                success: function (data) {
                    if (data.err)
                    {
                        iToast.showError('Error', data.err);
                    }
                    else
                    {
                        iToast.showSuccess('Success', "<b>" + df.lbl() +"</b> (" + df.givenName() +  ") has been deleted.");
                        df.delete = false;
                        df.justDeleted = true;
                    }
                },
                complete:function(){
                    iToast.showCool('Cool', "Activation Complete.");
                }
            });

        });


    },
    deleteSelected:function(f){
        this.commandStack.execute(this.selection.getPrimary().createCommand(new draw2d.command.CommandType(draw2d.command.CommandType.DELETE)));
        if (f instanceof draw2d.shape.basic.Label === false)
        {
            this.validateAllPorts(function(){
                $.unblockUI();
            });
        }
        else
        {
            $.unblockUI();
        }

    },
    validateAllPorts:function(callback){
        var figures = this.getFigures();
        for (var j = 0; j < figures.getSize(); j++){
            var f = figures.get(j);
            if (f instanceof draw2d.shape.basic.Label)
            {
                continue;
            }
            var numberofLines = 0;
            var lines = this.getLines();

            for(var i=0; i < lines.getSize(); i++){
                var l = lines.get(i);
                var portIndex = -1;
                if(f.id == l.sourcePort.name.split("_")[0])
                {
                    if (l.sourcePort.getRequired())
                    {
                        numberofLines++;
                    }
                    else
                    {
                        portIndex = parseInt(l.sourcePort.name.split("_")[1]);
                        if (f.requiredPorts.indexOf(portIndex) > -1){
                            numberofLines++;
                        }

                    }
                }

                if(f.id == l.targetPort.name.split("_")[0])
                {
                    if (l.targetPort.getRequired()){
                        numberofLines++;
                    }
                    else
                    {
                        portIndex = parseInt(l.targetPort.name.split("_")[1]);
                        if (f.requiredPorts.indexOf(portIndex) > -1){
                            numberofLines++;
                        }

                    }

                }

            }

            if ( numberofLines >= f.minRequiredConnection){
                f.setStroke(1);
                f.setColor('#000000');
                if (f instanceof draw2d.shape.node.IconObject){
                    f.setStroke(0);
                }

            }
            else{

                    f.setColor("#ff0000");
                    f.setStroke(1);
//                    if (f instanceof draw2d.shape.node.IconObject){
//                        f.setStroke(0);
//                    }
                }
        }
        if (typeof(callback) == 'function'){
            return callback();
        }
    },
    processDelete:function(){
        var self = this;
        $.blockUI({message: "<img class='center' src='/img/busy.gif' width='30px' height='30px' alt='Busy...'><h4>Deleting and Running Re-Validation...</h4>",
            onBlock: function () {

                if (self.selection.getPrimary() !== null) {
                    var f = self.selection.getPrimary();
                    if (f instanceof draw2d.Connection) {
                        var targetFigure = f.targetPort;
                        if (targetFigure.parent instanceof draw2d.shape.node.OutputObj){
                            targetFigure = f.sourcePort;
                        }
                        //console.log(f,targetFigure);
                        GPLViewModel.ensureAllUnderlyingProperties(targetFigure.parent.id);
                        var d = {point: targetFigure.parent.props(), oldPoint: targetFigure.parent.props(), refPoint: null, property: targetFigure.propertyRepresented };
                        var dd = Config.Update.formatPoint(d);

                        GPLViewModel.getProp(targetFigure.parent.id).setProps(dd);
                        GPLViewModel.getProp(targetFigure.parent.id).updated(true);

                    }
                    var upi = -1;

                    if (f instanceof draw2d.shape.node.Object) {
                        if (GPLViewModel.getProp(f.id).isNewlyAdded) {
                            upi = GPLViewModel.getProp(f.id).getProperty("_id").Value();
                            $.ajax({url: "/api/points/freeupi", contentType: "application/json", data: JSON.stringify({upi: upi}), type: "POST", success: function (d) {
                                if (d.msg == "success") {
                                    self.deleteSelected(f);
                                }
                                else {
                                    iToast.showError('Error', d.err);
                                }

                            }});
                        }
                        else {
                            GPLViewModel.getProp(f.id).delete = true;
                            var delPropObj = GPLViewModel.getProp(f.id).getPersistentAttributes();
                            delPropObj.figureType = f.GivenName;
                            if (delPropObj.props.UPI == undefined) {
                                delPropObj.props.UPI = {Value: GPLViewModel.getProp(f.id).upi()};
                            }

                            delPropObj["Lines"] = [];
                            var lines = self.getLines();
                            for (var i = 0; i < lines.getSize(); i++) {
                                var l = lines.get(i);
                                if (f.id == l.sourcePort.name.split("_")[0]) {
                                    delPropObj["Lines"].push(l.getPersistentAttributes());
                                }

                                if (f.id == l.targetPort.name.split("_")[0]) {
                                    delPropObj["Lines"].push(l.getPersistentAttributes());
                                }
                            }

                            var removeProp = {};
                            ko.utils.arrayForEach(GPLViewModel.propertiesCol(), function (p) {
                                if (p.id() == f.id) {
                                    removeProp = p;
                                }
                            });

                            GPLViewModel.propertiesCol.remove(removeProp);
                            GPLViewModel.deletedFigures.push(delPropObj);

                            self.deleteSelected(f);
                        }


                    }
                    else {
                        self.deleteSelected(f);
                    }
                }
            }
        });


    },
    undoDelete:function(){
        var deletedFigures = GPLViewModel.getJustDeletedProp();
        _.each(deletedFigures, function(df){
            $.ajax({
                url:"/api/points/restorePoint",
                contentType:'application/json',
                type:'Post',
                data:JSON.stringify({upi:df.upi()}),
                success: function (data) {
                    if (data.err)
                    {
                        iToast.showError('Error', data.err);
                    }
                    else
                    {
                        iToast.showSuccess('Success', "<b>" + df.lbl() +"</b> (" + df.givenName() +  ") has been restored.");
                        GPLViewModel.getProp(df.id()).justDeleted = false;
                    }
                }
            });

        });
    },
    undoAction:function(){
        this.commandStack.undo();
        this.undoDelete();
        this.validateAllPorts();
        var self = this;
        var deletedFig = {};
        ko.utils.arrayForEach(GPLViewModel.deletedFigures(), function(df){
            if (self.getFigure(df.id) !== null){
                deletedFig = df;
            }
        });
        GPLViewModel.deletedFigures.remove(deletedFig);
    },
    restorePoint:function(figure){
        var self = figure;
        $.blockUI({message:"<h4>Restoring point...</h4>", onBlock:function(){

            var o = getProperFigureClass(self);
            o.setPersistentAttributes(self);
            o.setDraggable(true);
            window.app.view.addFigure(o);
            GPLViewModel.getProp(o.id).lbl(self.label);
            GPLViewModel.getProp(o.id).upi(self.props.UPI.Value);
            for(var j=0; j< self.Lines.length; j++){
                var element = self.Lines[j];
                var l = new draw2d.Connection(element.id);
                var source= null;
                var target=null;
                for(var i in element){
                    var val = element[i];
                    var node = null;
                    if(i === "source"){
                        node = window.app.view.getFigure(val.node);
                        source = node.getPort(val.port);
                        source.value = val.value;

                    }
                    else if (i === "target"){
                        node = window.app.view.getFigure(val.node);
                        target = node.getPort(val.port);
                        target.value = val.value;
                    }
                }
                if(source!==null && target!==null){
                    l.setSource(source);
                    if(source.name)
                        l.setTarget(target);

                }
                window.app.view.addFigure(l);
                window.app.view.validateAllPorts();
            }
            GPLViewModel.getProp(self.id).setPersistentAttributes(self);
            GPLViewModel.deletedFigures.remove(self);
            $.unblockUI({fadeOut:200});

        }});


    }



});





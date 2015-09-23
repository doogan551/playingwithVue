/// <reference path="Toolbar.js" />

dorsettGPL.Toolbar = Class.extend({

    init: function (elementId, app, view) {
        this.html = $("#" + elementId);
        this.view = view;
        this.app = app;

        // register this class as event listener for the canvas
        // CommandStack. This is required to update the state of 
        // the Undo/Redo Buttons.
        //
        this.view.getCommandStack().addEventListener(this);

        // Register a Selection listener for the state hnadling
        // of the Delete Button
        //
        this.view.addSelectionListener(this);

//        this.controlsDiv = $("<div class='btn-toolbar' />");
//        this.groupDiv = $("<div data-role='controlgroup' data-type='horizontal' data-mini='true' />");
//
//        // Inject the UNDO Button and the callbacks
//        //
//        //this.undoButton = $("<a href='javascript:;' data-role='button' data-icon='back' data-iconpos='notext' data-theme='e' data-inline='true' title='Undo'></a>");
//        this.undoButton = $("<a href='javascript:;' data-theme='b' data-role='button' data-inline='true' title='Undo'><i class='icon-undo icon-large'></i></a>");
//
//        this.undoButton.button().click($.proxy(function () {
//            view.getCommandStack().undo();
//        }, this));
//        this.groupDiv.append(this.undoButton);
//
//
//        // Inject the REDO Button and the callback
//        //
//        //this.redoButton = $("<a href='javascript:;'   data-role='button'  data-icon='forward' data-iconpos='notext' data-theme='e' data-inline='true' title='Redo'></a>");
//        this.redoButton = $("<a href='javascript:;' data-theme='b'   data-role='button' data-inline='true' title='Redo'><i class='icon-repeat icon-large'></i></a>");
//        this.redoButton.button().click($.proxy(function () {
//            view.getCommandStack().redo();
//        }, this));
//        this.groupDiv.append(this.redoButton);


        // Inject the DELETE Button
        //
//        this.deleteButton = $("<a href='javascript:;'  data-theme='b' data-role='button'  data-inline='true' title='Remove Selected'><i class='icon-remove icon-large'></i></a>");
//        this.deleteButton.button().click($.proxy(function () {
//            //var node = view.getCurrentSelection();
//            var figs = view.getAllSelection();
//            for(var i=0; i<figs.getSize(); i++){
//               var node =  figs.get(i);
//               if(node instanceof dorsett.shape.basic.Line){
//                    eval("node.targetPort.parent." + node.targetPort.getValue() +"=''");
//               }
//               var command = new dorsett.command.CommandDelete(node);
//               view.getCommandStack().execute(command);
//               //console.log($("#" + node.id));//.remove();
//            }
//        }, this));
//
//        this.groupDiv.append(this.deleteButton);
//
//        this.controlsDiv.append(this.groupDiv);
//
//        this.clearAllButton = $("<a href='javascript:;'  data-theme='b' data-role='button'  data-inline='true' title='Remove All'><i class='icon-trash icon-large'></i></a>");
//        this.clearAllButton.button().click($.proxy(function () {
//                view.clear();
//        }, this));
//
//        this.groupDiv.append(this.clearAllButton);
//
//        this.controlsDiv.append(this.groupDiv);

        //this.groupDiv = $("<div class='btn-group' />");


        // Inject the Zoom-In Button and the callbacks
        //
//        this.zoomInButton = $("<a href='javascript:;'  data-role='button' data-theme='e' data-inline='true' title='Zoom In'><i class='icon-zoom-in icon-large'></i></a>");
//        this.zoomInButton.button().click($.proxy(function () {
//            //console.log(this.view.getZoom());
//            this.view.setZoom(this.view.getZoom() * 0.7, true);
//            //this.app.layout();
//            //console.log(this.view.getZoom());
//        }, this));
//        this.groupDiv.append(this.zoomInButton);


        // Inject the 1:1 Button
        //
//        this.resetButton = $("<a href='javascript:;'  data-role='button' data-theme='e' data-inline='true' class='popover-here' title='100%'><i class='icon-retweet icon-large'></i></a>");
//        this.resetButton.button().click($.proxy(function () {
//            this.view.setZoom(1.0, true);
//            //this.app.layout();
//            //console.log(this.view.getZoom());
//        }, this));
//        this.groupDiv.append(this.resetButton);
//

        // Inject the Zoom-Out Button and the callback
        //
//        this.zoomOutButton = $("<a href='javascript:;'  data-role='button'  data-theme='e' data-inline='true' title='Zoom Out'><i class='icon-zoom-out icon-large'></i></a>");
//        this.zoomOutButton.button().click($.proxy(function () {
//            this.view.setZoom(this.view.getZoom() * 1.3, true);
//            //this.app.layout();
//            //console.log(this.view.getZoom());
//        }, this));
//        this.groupDiv.append(this.zoomOutButton);
//        this.controlsDiv.append(this.groupDiv);

        //this.groupDiv = $("<div data-role='controlgroup' data-type='horizontal' data-mini='true'  />");

        //Geometry layout
        //
//        this.geometryEditorButton = $("<a href='javascript:;'  data-theme='a' data-role='button' data-inline='true' title='Geometry'><i class='icon-crop icon-large'></i></a>");
//        this.geometryEditorButton.button().click($.proxy(function () {
//            this.view.installEditPolicy(new dorsett.policy.canvas.SnapToGeometryEditPolicy());
//        }, this));
//
//        this.groupDiv.append(this.geometryEditorButton);

        //Grid layout
        //
//        this.gridEditorButton = $("<a href='javascript:;' data-theme='a'  data-role='button' data-inline='true' title='Grid'><i class='icon-calendar icon-large'></i></a>");
//        this.gridEditorButton.button().click($.proxy(function () {
//            this.view.installEditPolicy(new dorsett.policy.canvas.SnapToGridEditPolicy());
//        }, this));
//
//        this.groupDiv.append(this.gridEditorButton);
//        this.controlsDiv.append(this.groupDiv);


        //this.groupDiv = $("<div data-role='controlgroup' data-type='horizontal' data-mini='true'  />");

        //JSON Save
        //
        //this.jsonSaveButton = $("<a href='javascript:;'  data-role='button'  data-icon='check' data-iconpos='notext' data-theme='e' data-inline='true' title='Save to DB'></a>");
//        this.jsonSaveButton = $("<a href='javascript:;' data-theme='e'  data-role='button' data-inline='true' title='Save'><i class='icon-file icon-large'></i></a>");
        $("#saveAction").click(function(){
            //$('#popupDialog').popup('open');
        });

        $("#undoAction").click(function(){
        });

        $("#redoAction").click(function(){
        });

        $("#zoomInAction").click($.proxy(function (){
            this.view.setZoom(this.view.zoomFactor*0.95);
        },this));

        $("#resetZoomAction").click($.proxy(function (){
            this.view.setZoom(1);
        },this));

        $("#zoomOutAction").click($.proxy(function (){
            this.view.setZoom(this.view.zoomFactor*1.05);
        },this));

        $("#deleteAction").click($.proxy(function () {
              view.processDelete();
//              var figs = view.getAllSelection();
//            for(var i=0; i<figs.getSize(); i++){
//               var node =  figs.get(i);
//               if(node instanceof dorsett.shape.basic.Line){
//                    eval("node.targetPort.parent." + node.targetPort.getValue() +"=''");
//               }
//               var command = new dorsett.command.CommandDelete(node);
//               view.getCommandStack().execute(command);
//            }
        }, this));

//        this.clearAllButton.button().click($.proxy(function () {
//                this.view.clear();
//        }, this));


//        this.jsonSaveButton.button().click($.proxy(function () {
//            //console.log('ssfs');
//
//            $('#popupDialog').popup('open');
//
//            //window.localStorage.removeItem('tempCanvas')
//        }, this));
//        this.groupDiv.append(this.jsonSaveButton);
//
//        this.jsonDisplayButton = $("<a href='javascript:;' data-theme='e'  data-role='button' data-inline='true' title='Display JSON'><i class='icon-th icon-large'></i></a>");
//        this.jsonDisplayButton.button().click($.proxy(function () {
//            //console.log('fffff');
//            this.view.displayJSON(true);
//            //this.view.installEditPolicy(new dorsett.policy.canvas.SnapToGeometryEditPolicy());
//        }, this));
//
//        this.groupDiv.append(this.jsonDisplayButton);
//
        //SVG Save
        //
        //this.pngSaveButton = $("<a  data-role='button'  data-icon='chat' data-iconpos='notext' data-theme='e' data-inline='true' title='Render Image (SVG)'></a>");
//        this.pngSaveButton = $("<a  data-role='button' data-theme='e' data-inline='true' title='Render Image (SVG)'><i class='icon-camera-retro icon-large'></i></a>");
//        this.pngSaveButton.button().click($.proxy(function () {
//            var writer = new dorsett.io.png.Writer();
//            var svg = writer.marshal(this.view, false);
//            $("#preview").html('').append(svg);
//            $('#preview').popup('open');
//
//        }, this));
//
//        this.groupDiv.append(this.pngSaveButton);


//        this.svgButton = $("<a  data-role='button' data-theme='e' data-inline='true' title='Display Raw SVG'><i class='icon-file-text icon-large'></i></a>");
//        this.svgButton.button().click($.proxy(function () {
//            var writer = new dorsett.io.png.Writer();
//            var p = writer.marshal(this.view, true);
//            $("#preview").text(p);
//            $('#preview').popup('open');
//
//        }, this));
//
//        this.groupDiv.append(this.svgButton);
//
//        this.controlsDiv.append(this.groupDiv);

//        this.html.append(this.controlsDiv);


//        this.view.installEditPolicy(new dorsett.policy.canvas.SnapToGridEditPolicy());



       },

    /**
     * @method
     * Called if the selection in the cnavas has been changed. You must register this
     * class on the canvas to receive this event.
     *
     * @param {dorsett.Figure} figure
     */
    onSelectionChanged: function (figure) {

        //if (figure) {
        //    this.app.appLayout.open('east');
        //    this.app.setCurrentFigure = this;
        //    this.deleteButton.removeClass("disabled");
        //    figure.rightPanelDisplay();
        //}
        //else {
            //$('#popupHolder').popover('destroy');
            this.app.setCurrentFigure = null;
        //    this.app.appLayout.close('east');
        //    this.deleteButton.addClass("disabled");
        //}


        //e.stopPropagation();
        //e.preventDefault();
    },
    //onClick: function () {
    //console.log($("#PropertyPopupDisplay"));
    //$("#PropertyPopupDisplay").toggle(function () {
    //   this.propertyPopupDisplay();
    //});
    //},
    displayJSON: function(){
        //console.log('ss');
        var writer = new dorsett.io.json.Writer();
        $("#json").text(JSON.stringify(writer.marshal(this.view),null,2));
        //$('#json').popup('open');
    },

    stackChanged: function (event) {
//        if (!event.getStack().canUndo()) {
//            this.undoButton.addClass("disabled");
//        } else {
//            this.undoButton.removeClass("disabled");
//        }

//        if (!event.getStack().canRedo())
//            this.redoButton.addClass("disabled");
//        else
//            this.redoButton.removeClass("disabled");
    }

});
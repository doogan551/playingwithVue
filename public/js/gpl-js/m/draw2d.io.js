/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/
/**
 * @class draw2d.io.Reader
 * Template class for general import of a document into the canvas.
 *
 * @author andreas Herz
 */

draw2d.io.Reader = Class.extend({
    init: function(){

    },
    unmarshal: function(canvas, document){
    }
});

/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/

/**
 * @class draw2d.io.json.Writer
 * Serialize the canvas document into a JSON object which can be read from the corresponding
 * {@link draw2d.io.json.Reader}.
 *
 *      // Create a JSON writer and convert it into a JSON-String representation.
 *      //
 *      var writer = new draw2d.io.json.Writer();
 *      writer.marshal(canvas, function(json){
 *         // convert the json object into string representation
 *         var jsonTxt = JSON.stringify(json,null,2);
 *
 *         // insert the json string into a DIV for preview or post
 *         // it via ajax to the server....
 *         $("#json").text(jsonTxt);
 *
 *      });
 *
 *
 *
 * @author Andreas Herz
 * @extends draw2d.io.Writer
 */
draw2d.io.json.Writer = draw2d.io.Writer.extend({
    
    init:function(){
        this._super();
    },
    
    /**
     * @method
     * Export the content to the implemented data format. Inherit class implements
     * content specific writer.
     * 
      * @param {draw2d.Canvas} canvas
     * @returns {Object}
     */
    marshal: function(canvas){
        
        var result = [];
        var figures = canvas.getFigures();
        var i =0;
        var f= null;
        
        // conventional iteration over an array
        //
        for(i=0; i< figures.getSize(); i++){
            f = figures.get(i);
            var r = [];
            //console.log(f.props());
            result.push(f.getPersistentAttributes());
        }
        
        // jQuery style to iterate
        //
        var lines = canvas.getLines();
        lines.each(function(i, element){
            result.push(element.getPersistentAttributes());
        });
        
        return result;
    }
});

/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/
/**
 * @class draw2d.io.json.Reader
 * Read a JSON data and import them into the canvas. The JSON must be generated with the
 * {@link draw2d.io.json.Writer}.
 *
 *      // Load a standard draw2d JSON object into the canvas
 *      //
 *      var jsonDocument =
 *          [
 *           {
 *              "type": "draw2d.shape.basic.Oval",
 *              "id": "5b4c74b0-96d1-1aa3-7eca-bbeaed5fffd7",
 *              "x": 237,
 *              "y": 236,
 *              "width": 93,
 *              "height": 38
 *            },
 *            {
 *              "type": "draw2d.shape.basic.Rectangle",
 *              "id": "354fa3b9-a834-0221-2009-abc2d6bd852a",
 *              "x": 225,
 *              "y": 97,
 *              "width": 201,
 *              "height": 82,
 *              "radius": 2
 *            }
 *          ];
 *      // unmarshal the JSON document into the canvas
 *      // (load)
 *      var reader = new draw2d.io.json.Reader();
 *      reader.unmarshal(canvas, jsonDocument);
 *
 *
 * @extends draw2d.io.Reader
 */
draw2d.io.json.Reader = draw2d.io.Reader.extend({

    init: function(canvas){
        this.canv = canvas;
        this.gplObjects = [];
        this.trackUPIs = [];
        this.uniqueUPIs = [];

        this._super();

    },
    addFigure:{
        doWork: function(socketObj, canv, element,done)
        {
            this.canvs = canv;
            if (element.type)
            {
                var o = getProperFigureClass(element);
                var source= null;
                var target=null;
                for(var i in element){
                    var val = element[i];
                    var node = null;
                    if(i === "source"){
                        node = this.canvs.getFigure(val.node);
                        source = node.getPort(val.port);
                        source.value = val.value;

                    }
                    else if (i === "target"){
                        node = this.canvs.getFigure(val.node);
                        target = node.getPort(val.port);
                        target.value = val.value;
                    }
                }
                if(source!==null && target!==null){
                    o.setSource(source);
                    if(source.name)
                        o.setTarget(target);

                }
                o.setPersistentAttributes(element);

                if (!GPLViewModel.isViewer()){
                    o.setDraggable(true);
                }
                else{
                    o.setDraggable(false);
                }
                this.canvs.addFigure(o);

                if (!(o instanceof draw2d.shape.basic.Label) && !(o instanceof draw2d.Connection))
                {
                    var gProp = GPLViewModel.getProp(o.id);
                    gProp.setPersistentAttributes(o.memento);


                    socketObj.trackUPIs.push({"upi": element.props["UPI"].Value, "id": element.id });
                    if (socketObj.uniqueUPIs.indexOf(element.props["UPI"].Value) == -1 && element.props["UPI"].Value != 0) {
                        socketObj.uniqueUPIs.push(element.props["UPI"].Value);
                        socketObj.gplObjects.push({
                            "Screen Object": 0,
                            "upi": parseInt(element.props["UPI"].Value),
                            "Quality Label": ""
                        });
                    }
                }

            }
            done();
        }
    },
    unmarshal: function(json,callback){

        var socketObj = {trackUPIs:this.trackUPIs, uniqueUPIs:this.uniqueUPIs, gplObjects: this.gplObjects};
        async.each(json, this.addFigure.doWork.bind(this.addFigure,socketObj, this.canv), function(err, result){

            callback(socketObj);
        });

    }
});
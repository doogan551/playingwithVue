/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/
/**
 * @class draw2d.shape.basic.Image
 * Simple Image shape.
 *
 * @inheritable
 * @author Andreas Herz
 * @extends draw2d.shape.node.Node
 */
draw2d.shape.basic.Image = draw2d.shape.node.Node.extend({
    NAME : "draw2d.shape.basic.Image",

    /**
     * @constructor
     * Creates a new figure element which are not assigned to any canvas.
     * 
     * @param {Number} path relative or absolute path of the image
     * @param {Number} width initial width of the shape
     * @param {Number} height initial height of the shape
     */
    init : function(path,  width, height)
    {
        this._super(width, height);
        this.path = path;

       

    },
      

   /**
    * @method
    * propagate all attributes like color, stroke,... to the shape element
    **/
    repaint : function(attributes)
    {
        if (this.repaintBlocked===true || this.shape === null){
            return;
        }

        if(typeof attributes === "undefined" ){
            attributes = {};
        }

        attributes.x = this.getAbsoluteX();
        attributes.y = this.getAbsoluteY();
        attributes.width = this.getWidth();
        attributes.height = this.getHeight();
        
        this._super(attributes);
    },

    /**
     * @method
     * 
     * @inheritdoc
     */
    createShapeElement : function()
    {
       return this.canvas.paper.image(this.path,this.getX(),this.getY(),this.getWidth(), this.getHeight());
    },
    onClick: function() {

        //$(this).popover('show');

        //console.log('ss');
        //.modal({ show: true });
        //this.value = !this.value;
        //this.setBackgroundColor(this.colors[this.value]);

        //var connections = this.getOutputPort(0).getConnections();
        //connections.each($.proxy(function (i, conn) {
        //    var targetPort = conn.getTarget();
        //    targetPort.setValue(this.value);
        //    conn.setColor(this.getBackgroundColor());
        //}, this));
        
        //console.log('ssd');

    },
    onDoubleClick:function() {
        
    },
    setRotationAngle:function() {
        
    },
    properties: [{
        name: 'left',
        type: 'number',
        action: function (args) {
            (args.obj).set("left", args.property);
        },
        defaultvalue: 100
    }, {
        name: 'top',
        type: 'number',
        action: function (args) {
            (args.obj).set("top", args.property);
        },
        defaultvalue: 100
    }, {
        name: 'width',
        type: 'number',
        action: function (args) {
            (args.obj).set("width", args.property / args.obj.scaleX);
        },
        defaultvalue: 200
    }, {
        name: 'height',
        type: 'number',
        action: function (args) {
            (args.obj).set("height", args.property / args.obj.scaleY);
        },
        defaultvalue: 100
    }, {
        name: 'scaleX',
        type: 'number',
        action: function (args) {
            (args.obj).set("scaleX", args.property);
        },
        defaultvalue: 1
    }, {
        name: 'scaleY',
        type: 'number',
        action: function (args) {
            (args.obj).set("scaleY", args.property);
        },
        defaultvalue: 1
    }, {
        name: 'fill',
        type: 'string',
        action: function (args) {
            (args.obj).set("fill", args.property);
        },
        defaultvalue: '#D3DAE5'
    }, {
        name: 'stroke',
        type: 'string',
        action: function (args) {
            (args.obj).set("stroke", args.property);
        },
        defaultvalue: '#000000'
    }, {
        name: 'angle',
        type: 'number',
        action: function (args) {
            (args.obj).set("angle", args.property);
        },
        defaultvalue: 0
    }],
});


/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/
/**
 * @class draw2d.layout.connection.VertexRouter
 * Router for direct connections between two ports. Beeline
 *
 * See the example:
 *
 *     @example preview small frame
 *
 *     // Override the default connection type. This is used during drag&drop operations of ports.
 *     //
 *     draw2d.Connection.createConnection=function(sourcePort, targetPort){
 *        // return my special kind of connection
 *        var con = new draw2d.Connection();
 *        con.setRouter(new draw2d.layout.connection.DirectRouter());
 *        return con;
 *     };
 *
 *     // create and add two nodes which contains Ports (In and OUT)
 *     //
 *     var start = new draw2d.shape.node.Start();
 *     var end   = new draw2d.shape.node.End();

 *     // ...add it to the canvas
 *     canvas.addFigure( start, 50,50);
 *     canvas.addFigure( end, 230,80);
 *
 *     // first Connection
 *     //
 *     var c = draw2d.Connection.createConnection();
 *     c.setSource(start.getOutputPort(0));
 *     c.setTarget(end.getInputPort(0));
 *     canvas.addFigure(c);
 *
 *
 * @inheritable
 * @author Andreas Herz
 *
 * @extends  draw2d.layout.connection.ConnectionRouter
 */
draw2d.layout.connection.VertexRouter = draw2d.layout.connection.ManhattanConnectionRouter.extend({

    NAME : "draw2d.layout.connection.VertexRouter",

    /**
     * @constructor
     * Creates a new Router object
     */
    init: function(){
        this._super();
    },


    /**
     * @method
     * Invalidates the given Connection
     */
    invalidate:function()
    {
    },
    route:function( connection, oldVertices)
    {
        var fromPt  = connection.getStartPoint();
        var fromDir = connection.getSource().getConnectionDirection(connection, connection.getTarget());

        var toPt  = connection.getEndPoint();
        var toDir = connection.getTarget().getConnectionDirection(connection, connection.getSource());
        if (connection.eventType != 'drag')
            this._route(connection, toPt, toDir, fromPt, fromDir);
        else
        {
            connection.addPoint(fromPt);
            var count = oldVertices.getSize()-1;
            for(var i=1; i<count;i++){
                connection.addPoint(oldVertices.get(i));
            }
            connection.addPoint(toPt);
        }
        var ps = connection.getVertices();

       length = ps.getSize();
        var p = ps.get(0);

        var path = ["M",p.x," ",p.y];
       for(var i=1;i<length;i++){
             p = ps.get(i);
             path.push("L", p.x, " ", p.y);
       }
       connection.svgPathString = path.join("");

    },

    /**
     * @method
     * Tweak or enrich the polyline persistence data with routing information
     *
     * @since 2.10.0
     * @param {draw2d.shape.basic.PolyLine} line
     * @param {Object} memento The memento data of the polyline
     * @returns {Object}
     */
    getPersistentAttributes : function(line, memento)
    {
        memento.vertex = [];

        line.getVertices().each(function(i,e){
            memento.vertex.push({x:e.x, y:e.y});
        });

        return memento;
    },

    /**
     * @method
     * set the attributes for the polyline with routing information
     *
     * @since 2.10.0
     * @param {Object} memento
     */
    setPersistentAttributes : function(line, memento)
    {
        // restore the points from the JSON data and add them to the polyline
        //
        if(typeof memento.vertex !=="undefined"){

            line.oldPoint=null;
            line.lineSegments = new draw2d.util.ArrayList();
            line.vertices     = new draw2d.util.ArrayList();

            $.each(memento.vertex, $.proxy(function(i,e){
                line.addPoint(e.x, e.y);
            },this));
        }
    }
});

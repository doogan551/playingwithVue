
draw2d.layout.connection.JunctionRouter = draw2d.layout.connection.ConnectionRouter.extend({

    NAME : "draw2d.layout.connection.JunctionRouter",

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
    
    /**
     * @method
     * Routes the Connection in air line (beeline).
     * 
     * @param {draw2d.Connection} connection The Connection to route
     * @param {draw2d.util.ArrayList} oldJunctionPoints old/existing junction points of the Connection
     */
    route:function( connection, oldJunctionPoints)
    {
       var start =connection.getStartPoint();
       var end = connection.getEndPoint();
       
       // required for hit tests
       //
       var count = oldJunctionPoints.getSize()-1;
       connection.addPoint(start);
       for(var i=1; i<count;i++){
           connection.addPoint(oldJunctionPoints.get(i));
       }
       connection.addPoint(end);
       
		// calculate the manhatten bend points between start/end.
		//
//		this._route(conn, toPt, toDir, fromPt, fromDir);

       var ps = connection.getPoints();
       
       length = ps.getSize();
       var p = ps.get(0);
       var path = ["M",p.x," ",p.y];
       for(var i=1;i<length;i++){
             p = ps.get(i);
             path.push("L", p.x, " ", p.y);
       }
       connection.svgPathString = path.join("");
    },

    getPersistentAttributes : function(line, memento)
    {   
        memento.junction = [];
        
        line.getPoints().each(function(i,e){
            memento.junction.push({x:e.x, y:e.y});
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
        if(typeof memento.junction !=="undefined"){
            
            line.oldPoint=null;
            line.lineSegments = new draw2d.util.ArrayList();
            line.basePoints   = new draw2d.util.ArrayList();

            $.each(memento.junction, $.proxy(function(i,e){
                line.addPoint(e.x, e.y);
            },this));
        }
    }
    
});

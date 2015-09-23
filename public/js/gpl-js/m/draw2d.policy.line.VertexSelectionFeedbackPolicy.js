/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/
/**
 * @class draw2d.policy.line.VertexSelectionFeedbackPolicy
 *
 *
 * @author Andreas Herz
 * @extends draw2d.policy.line.LineSelectionFeedbackPolicy
 */

draw2d.policy.line.VertexSelectionFeedbackPolicy = draw2d.policy.line.LineSelectionFeedbackPolicy.extend({

    NAME : "draw2d.policy.line.VertexSelectionFeedbackPolicy",

    /**
     * @constructor 
     * Creates a new Router object
     */
    init: function(){
        this._super();
    },
    

    /**
     * @method
     * 
     * @template
     * @param {draw2d.Connection} connection the selected figure
     * @param {boolean} isPrimarySelection
     */

    onSelect: function (canvas, connection, isPrimarySelection) {
        if(GPLViewModel.isViewer())
            return;


        this._super(canvas, connection, isPrimarySelection);
    	
    	var points = connection.getVertices();
        //console.log(points);
    	var i=1;
    	for( ; i<(points.getSize()-1); i++){
    		var handle = new draw2d.shape.basic.VertexResizeHandle(connection, i);
            //connection.setResizable(true);
            connection.selectionHandles.add( handle);
            handle.setDraggable(connection.isResizeable());
            handle.show(canvas);

    		var handle = new draw2d.shape.basic.GhostVertexResizeHandle(connection, i-1);
            connection.selectionHandles.add( handle);         
            handle.setDraggable(connection.isResizeable());
            handle.show(canvas);
        }
    	
		var handle = new draw2d.shape.basic.GhostVertexResizeHandle(connection, i-1);
        connection.selectionHandles.add( handle);         
        handle.setDraggable(connection.isResizeable());
        handle.show(canvas);
    	
		
        
        this.moved(canvas, connection);
    }   

});
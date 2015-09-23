draw2d.filter = {};
draw2d.filter.Filter = Class.extend({
    NAME : "draw2d.filter.Filter",
	
	init:function(){
	},

	/**
	 * @method
	 * Sent when an event occurs on the command stack. draw2d.command.CommandStackEvent.getDetail() 
	 * can be used to identify the type of event which has occurred.
	 * 
	 * @template
	 * 
	 **/
	apply:function(figure, attributes){
	},
	
	onInstall: function(figure){
	    
	},
	
	insertPane: function(figure, $parent){

    },
   
    removePane:function(){
    },
    
    getPersistentAttributes : function(relatedFigure){   
        var memento = {};
        memento.name = this.NAME;
        
        return memento;
    },
    
    setPersistentAttributes : function(relatedFigure, memento){

    }

});





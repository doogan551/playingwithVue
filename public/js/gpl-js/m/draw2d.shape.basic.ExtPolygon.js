draw2d.shape.basic.ExtPolygon = draw2d.shape.basic.Polygon.extend({
    
    NAME: "ExtPolygon",
    
    init:function()
    {
      this._super();
 
      this.setUserData({name:"Figure_"+this.id});
      
      this.filters   = new draw2d.util.ArrayList();
      this.filters.add( new StrokeFilter());
      this.filters.add( new FillColorFilter());

      this.installEditPolicy(new draw2d.policy.figure.RectangleSelectionFeedbackPolicy());
    },
    
    removeFilter:function(filter){
      this.filters.remove(filter);  
    },

    addFilter:function(filter){
        var alreadyIn = false;
        
        this.filters.each($.proxy(function(i,e){
            alreadyIn = alreadyIn || (e.NAME===filter.NAME);
        },this));
        if(alreadyIn===true){
            return; // silently
        }
        this.filters.add(filter);  
        filter.onInstall(this);
        this.repaint();
    },
      
    onDoubleClick: function(){
        this.installEditPolicy(new draw2d.policy.figure.VertexSelectionFeedbackPolicy());
    },
    
    /**
     * @method
     * Unselect the figure and propagete this event to all edit policies.
     * 
     * @final
     * @private
     **/
    unselect:function()
    {
        this._super();
        
        this.installEditPolicy(new draw2d.policy.figure.RectangleSelectionFeedbackPolicy());
        return this;
    },
    
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        if(this.shape===null){
            return;
        }

        if(this.svgPathString===null){
            this.calculatePath();
        }
        
        if(typeof attributes === "undefined"){
            attributes = {};
        }
        
         
        attributes.path = this.svgPathString;
        
        this.filters.each($.proxy(function(i,filter){
            filter.apply(this, attributes);
        },this));
        
        this._super(attributes);
    },

    getPersistentAttributes : function()
    {   
        var memento = this._super();
        
        memento.filters = [];
        this.filters.each($.proxy(function(i,e){
            var filterMemento = e.getPersistentAttributes(this);
            memento.filters.push(filterMemento);
        },this));
 
        return memento;
    },
    
    setPersistentAttributes : function( memento)
    {
        this._super(memento);
        

        if(typeof memento.filters !=="undefined"){
            this.filters = new draw2d.util.ArrayList();
            $.each(memento.filters, $.proxy(function(i,e){
                var filter = eval("new "+e.name+"()");
                filter.setPersistentAttributes(this, e);
                this.filters.add(filter);
            },this));
        }
    }
});

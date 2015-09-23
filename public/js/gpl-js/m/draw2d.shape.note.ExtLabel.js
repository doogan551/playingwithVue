draw2d.shape.note.ExtLabel = draw2d.shape.basic.Label.extend({
    
    NAME: "draw2d.shape.note.ExtLabel",
    
    isExtFigure: true,
    
    init:function(id)
    {
        if (id == undefined)
        {
            this.id = draw2d.util.UUID.create();
        }
        else
            this.id = id;

        this.blur = 0;
      
      this._super("This is label.");
 
     
      this.setUserData({name:"Label_"+this.id});
      
      this.filters   = new draw2d.util.ArrayList();
      this.filters.add( new draw2d.filter.FontColorFilter());
      this.filters.add( new draw2d.filter.FontSizeFilter());

        if (!GPLViewModel.isViewer())
        {
            this.installEditor(new draw2d.ui.LabelInplaceEditor());
        }

      GPLViewModel.addProp(this.id, this.NAME);
    },
    
    getPotentialFilters: function(){
        return [
                {label:"Opacity", impl:"draw2d.filter.OpacityFilter"},
                {label:"Blur", impl:"draw2d.filter.BlurFilter"},
                {label:"Font Size", impl:"draw2d.filter.FontSizeFilter"},
                {label:"Font Color", impl:"draw2d.filter.FontColorFilter"}
                ];
    },
    
    setBlur: function( value){
        this.blur = value;
        this.repaint();
    },

    getBlur: function(){
      return this.blur;
    },
    
    removeFilter:function(filter){
      this.filters.remove(filter);  
      
      return this;
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
        
        return this;
    },
    
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        //console.log("Ext Label");

        if(this.shape===null){
            return;
        }

        if(typeof attributes === "undefined"){
            attributes = {};
        }
        
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

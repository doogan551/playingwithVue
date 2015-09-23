
draw2d.filter.LinearGradientFilter = draw2d.filter.Filter.extend({
    NAME :"draw2d.filter.LinearGradientFilter",
    
	init:function(){
	    this._super();
	    this.colorPicker1 = null;
	    this.colorPicker2 = null;
	    
	    this.startColor ="#f0f0f0";
	    this.endColor   ="#3f3f3f";
	    this.angle      =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Linear Gradient'+
                       '    <span id="button_remove_'+this.cssScope+'" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="input-group text-center" style="width:100%" >'+
                 	   '           <div id="'+this.cssScope+'_angle" />'+
                       '      </div> '+ 
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="'+this.cssScope+'_color1" type="text" value="'+this.startColor+'" class="form-control color"/>'+
                       '       </div>'+
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="'+this.cssScope+'_color2" type="text" value="'+this.endColor+'" class="form-control color"/>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

    	   $('#'+this.cssScope+'_angle').anglepicker({
    	       start: function(e, ui) {
    
    	       },
    	       change: $.proxy(function(e, ui) {
    	           this.angle = ui.value;
    	              figure.repaint();
     	       },this),
    	       stop: function(e, ui) {
    
    	       },
    	       value: this.angle
    	   });
          
           var picker1 = this.colorPicker1  = new jscolor.color($("#"+this.cssScope+'_color1')[0], {});
           this.colorPicker1.fromString(this.startColor);
           this.colorPicker1.onImmediateChange= $.proxy(function(){
              this.startColor= "#"+picker1.toString();
              figure.repaint();
           },this);
           
           var picker2 = this.colorPicker2  = new jscolor.color($("#"+this.cssScope+'_color2')[0], {});
           this.colorPicker2.fromString(this.endColor);
           this.colorPicker2.onImmediateChange= $.proxy(function(){
              this.endColor ="#"+picker2.toString();
              figure.repaint();
           },this);
 
           
           $("#button_remove_"+this.cssScope).on("click",$.proxy(function(){
               figure.removeFilter(this);
               $('#'+this.cssScope+'_container').animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#'+this.cssScope+'_container').remove();});
           },this));

	   },
	   
	    apply:function(figure, attributes){
	        attributes.fill = this.angle+"-"+this.endColor+"-"+this.startColor;    
	    },
	    
	   removePane:function(){
	       if(this.colorPicker1 !==null){
	           this.colorPicker1.hidePicker();
	       }
	       if(this.colorPicker2 !==null){
	           this.colorPicker2.hidePicker();
	       }
	   },
	   
	    onInstall:function(figure){
	        figure.setStroke(1);
	    },
	    
	    getPersistentAttributes : function(relatedFigure){   
	        var memento = this._super(relatedFigure);
	        
            memento.startColor = this.startColor;
            memento.endColor = this.endColor;
	        memento.angle = this.angle;
	        
	        return memento;
	    },
	    
	    setPersistentAttributes : function(relatedFigure, memento){
	        this._super(relatedFigure, memento);
	        
            this.startColor = memento.startColor;
            this.endColor = memento.endColor;
	        this.angle = memento.angle;
	        
	        return memento;
	    }

	

});





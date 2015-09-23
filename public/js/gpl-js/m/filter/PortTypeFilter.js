
draw2d.filter.PortTypeFilter = draw2d.filter.Filter.extend({
    NAME :"draw2d.filter.PortTypeFilter",
    
	init:function(){
	    this._super();
	    
	    this.type   =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Port Type'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="input-group text-center" style="width:100%" >'+
                 	   '           <div id="'+this.cssScope+'_angle" />'+
                       '      </div> '+ 
                       '      <div class="btn-group dropdown">'+
                       '         <button id="add_filter_button" class="disabled btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">'+
                       '              <span id="port_type_label">'+figure.getInputType()+'</span>        '+
                       '              <span class="caret"></span></button>     '+
                       '              <ul class="dropdown-menu" id="select_port_type_menu">'+
                       '                 <li><a href="#" data-type="Input"  >Input </a></li>'+
                       '                 <li><a href="#" data-type="Output" >Output</a></li>'+
                       '                 <li><a href="#" data-type="Hybrid" >Hybrid</a></li>'+
                       '              </ul>'+
                       '         </button>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $("#select_port_type_menu a").on("click", function(){
	           var $this = $(this);
	           var typeName = $this.data("type");
	           figure.setInputType(typeName);
	           $("#port_type_label").text(typeName);
	       });
	   },
	   
	    

		removePane : function() {
		},

		onInstall : function(figure) {
		},

		getPersistentAttributes : function(relatedFigure) {
			var memento = this._super(relatedFigure);

			return memento;
		},

		setPersistentAttributes : function(relatedFigure, memento) {
			this._super(relatedFigure, memento);

			return memento;
		}
});





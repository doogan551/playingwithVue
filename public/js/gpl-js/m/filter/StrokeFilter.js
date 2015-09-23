
draw2d.filter.StrokeFilter = draw2d.filter.Filter.extend({
    NAME :"draw2d.filter.StrokeFilter",
    
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="stroke_filter_conainer" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#stroke_width_panel">'+
                	   '     Stroke'+
                       '    <span id="button_remove_StrokeFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="stroke_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_stroke" type="text" value="'+figure.getStroke()+'" name="filter_stroke" class="form-control" />'+
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="filter_stroke_color" type="text" value="" name="stroke-color" class="form-control color"/>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $("input[name='filter_stroke']").TouchSpin({
	           min: 0,
	           max: 20,
	           step: 1,
	           boostat: figure.getStroke(),
	           maxboostedstep: 10,
	           postfix: 'px'
	       });
           $("input[name='filter_stroke']").on("change", $.proxy(function(){
               this.setStroke(parseInt($("input[name='filter_stroke']").val()));
           },figure));

           
           var picker = this.colorPicker  = new jscolor.color(document.getElementById('filter_stroke_color'), {});
           this.colorPicker.fromString(figure.getColor().hash());
           this.colorPicker.onImmediateChange= $.proxy(function(){
              this.setColor("#"+picker.toString());
           },figure);
           
           $("#button_remove_StrokeFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setStroke(0);
               $("#stroke_filter_conainer").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#stroke_filter_conainer').remove();});
           },this));

	   },
	   
	   removePane:function(){
	       if(this.colorPicker !==null){
	           this.colorPicker.hidePicker();
	       }
	   },
	   
	    onInstall:function(figure){
	        figure.setStroke(1);
	    }

});





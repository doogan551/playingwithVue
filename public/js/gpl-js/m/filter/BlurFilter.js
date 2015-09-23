
draw2d.filter.BlurFilter = draw2d.filter.Filter.extend({
    NAME :"draw2d.filter.BlurFilter",
    
	init:function(){
	    this._super();
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	   $parent.append('<div id="'+this.cssScope+'_filter_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_width_panel">'+
                	   '     Blur'+
                       '    <span id="button_remove_'+this.cssScope+'" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_blur_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_blur" type="text" value="'+figure.getBlur()+'"  name="filter_blur" class="form-control" />'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

           $("#filter_blur").TouchSpin({
               min:  0,
               max:  5,
               step: 1
           });

           $("#filter_blur").on("change", $.proxy(function(){
               console.log($("#filter_blur").val());
               this.setBlur(parseInt($("#filter_blur").val()));
           },figure));

           
           $("#button_remove_"+this.cssScope).on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setBlur(0);
               $('#'+this.cssScope+'_filter_container').animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#'+this.cssScope+'_filter_container').remove();});
           },this));

	   }

});






draw2d.filter.FontSizeFilter = draw2d.filter.Filter.extend({
    NAME :"draw2d.filter.FontSizeFilter",
    
	init:function(){
	    this._super();
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="fontsize_filter_container" class="panel panel-info">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#fontsize_width_panel">'+
                	   '     Font Size'+
                       '</div>'+
                	   
                	   ' <div class="panel-body collapse" id="fontsize_width_panel">'+
                	   '   <div class="form-group">'+
                 	   '       <br /><input id="filter_fontsize" type="text" value="'+figure.getFontSize()+'" name="filter_fontsize" class="form-control" />'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

           $("#filter_fontsize").TouchSpin({
               min: 4,
               max: 300,
               step: 1,
               boostat: figure.getFontSize(),
               maxboostedstep: 10,
               postfix: 'px'
           });

           $("input[name='filter_fontsize']").on("change", $.proxy(function(){
               this.setFontSize(parseInt($("input[name='filter_fontsize']").val()));
           },figure));

           
//           $("#button_remove_FontSizeFilter").on("click",$.proxy(function(){
//               figure.removeFilter(this);
//               figure.setFontSize(12);
//               $("#fontsize_filter_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#fontsize_filter_container').remove();});
//           },this));

	   },
	   
	   removePane:function(){
           $("#fontsize_filter_container").remove();
	   },
	   
	    onInstall:function(figure){
	     //   figure.setFontSize(1);
	    }

});





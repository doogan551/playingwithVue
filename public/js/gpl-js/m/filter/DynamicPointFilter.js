
draw2d.filter.DynamicPointFilter = draw2d.filter.Filter.extend({
    NAME :"draw2d.filter.DynamicPointFilter",
    
	init:function(){
	    this._super();
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="dynamicpoint_filter_container" class="panel panel-info">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#dynamicpoint_width_panel">'+
                	   '     Dynamic Point'+
                       '</div>'+
                	   
                	   ' <div class="panel-body collapse" id="dynamicpoint_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '       <br/><button id="dynamic_point" class="form-control btn-primary btn-sm">' + figure.getUserData().pointname + '</button>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

//           $("#filter_fontsize").TouchSpin({
//               min: 4,
//               max: 300,
//               step: 1,
//               boostat: figure.getFontSize(),
//               maxboostedstep: 10,
//               postfix: 'px'
//           });

            var setPoint = function(upi,nam){
                figure.setText(nam);
                figure.setUserData({pointname:nam, upi:upi});
                $("#dynamic_point").text(nam);
            };

             $("#dynamic_point").on("click", $.proxy(function(){
                var win = window.open('/pointselector/gpl/' + figure.getUserData().upi,"myPointWindow","width=722,height=600");
                win.onload = function() {
                    win.draw2d.pointSelector.init(setPoint);
                }
             },this));
	   },
	   
	   removePane:function(){
           $("#dynamicpoint_filter_container").remove();
	   },
	   
	    onInstall:function(figure){
	     //   figure.setFontSize(1);
	    }


});





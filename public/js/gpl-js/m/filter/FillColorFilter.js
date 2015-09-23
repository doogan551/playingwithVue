
draw2d.filter.FillColorFilter = draw2d.filter.Filter.extend({
	NAME : "draw2d.filter.FillColorFilter",
	
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
        $parent.append('<div id="fill_color_container" class="panel panel-info">' +
            '   <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#color-fill-panel">'+
            '     Background Color'+
            '   </div>'+

            '   <div class="panel-body collapse" id="color-fill-panel">'+
            '       <div class="form-group">'+
            '           <div id="bgColor-picker">' +
            '               <br /><input id="filter_bgColor_fill" type="text" value="'+ figure.getBackgroundColor().hashString + '" name="filter_bgColor_fill" class="form-control color"/>'+
            '           </div>'+
            '       </div>'+
            '   </div>' +
            '</div>');

        var bgColorPreview = function() {
            var color = $(this).chromoselector("getColor");
            $(this).css({
                'background-color': color.getHexString(),
                'color': color.getTextColor().getHexString(),
                'text-shadow': '0 1px 0 ' + color.getTextColor().getTextColor().getHexString()
            });
            figure.setBackgroundColor(color.getHexString());
        };

        // Initialise the color picker
        $("#filter_bgColor_fill").chromoselector({
            target: "#bgColor-picker",
            autoshow: true,
            width: 155,
            resizable:false,
            preview: false,
            create: bgColorPreview,
            update: bgColorPreview
        }).chromoselector("show", 0);


	},
	  
	onInstall:function(figure){
        //figure.setBackgroundColor("#f0f3f3");
	},
	
	removePane:function(){
	    if(this.colorPicker !==null){
	        this.colorPicker.hidePicker();
	    }
        $("#fill_color_container").remove();
	},
    getPersistentAttributes : function(relatedFigure){
        var memento = {};
        memento.name = this.NAME;
        memento.bgColor = relatedFigure.getBackgroundColor();
        return memento;
    },

    setPersistentAttributes : function(relatedFigure, memento){
        relatedFigure.setBackgroundColor(memento.bgColor.hashString);
    }
	

});





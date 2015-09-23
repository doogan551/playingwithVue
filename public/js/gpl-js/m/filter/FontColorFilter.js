
draw2d.filter.FontColorFilter = draw2d.filter.Filter.extend({
    NAME : "draw2d.filter.FontColorFilter",

    init:function(){
        this._super();
        this.colorPicker = null;
    },

    insertPane: function(figure, $parent){
        $parent.append('<div id="font_color_container" class="panel panel-info">' +
            '   <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#font_color_fill_panel">'+
            '     Font Color'+
            '   </div>'+

            '   <div class="panel-body collapse" id="font_color_fill_panel">'+
            '       <div class="form-group">'+
            '           <div id="font-color-picker">' +
            '               <br /><input id="filter_color_fill" type="text" value="'+ figure.getFontColor().hashString + '" name="filter_color_fill" class="form-control color"/>'+
            '           </div>'+
            '       </div>'+
            '   </div>' +
            '</div>');


        var fontColorPreview = function() {

            var color = $(this).chromoselector("getColor");
            $(this).css({
                'background-color': color.getHexString(),
                'color': color.getTextColor().getHexString(),
                'text-shadow': '0 1px 0 ' + color.getTextColor().getTextColor().getHexString()
            });
            figure.setFontColor(color.getHexString());
        };

        // Initialise the color picker
        $("#filter_color_fill").chromoselector({
            target: "#font-color-picker",
            width: 175,
            resizable:false,
            preview: false,
            create: fontColorPreview,
            update: fontColorPreview
        }).chromoselector("show", 0);

    },

    onInstall:function(figure){
        //figure.setBackgroundColor("#000000");
    },

    removePane:function(){
        if(this.colorPicker !==null){
            this.colorPicker.hidePicker();
        }
        $("#font_color_container").remove();
    }


});





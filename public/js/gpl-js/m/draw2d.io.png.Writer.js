/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************//**
 * @class draw2d.io.png.Writer
 * Convert the canvas document into a PNG Image.
 *
 *     // example how to create a PNG image and set an
 *     // image src attribute.
 *     //
 *     var writer = new draw2d.io.png.Writer();
 *     writer.marshal(canvas, function(png){
 *         $("#preview").attr("src",png);
 *     });
 *
 * @author Andreas Herz
 * @extends draw2d.io.Writer
 */
draw2d.io.png.Writer = draw2d.io.Writer.extend({
    
    init:function(){
        this._super();
    },
    marshal: function(canvas,svgSave){
        var s =canvas.getCurrentSelection();
        canvas.setCurrentSelection(null);
        canvas.installEditPolicy(new draw2d.policy.canvas.SnapToGeometryEditPolicy());

        var svg =  canvas.getHtmlContainer().html()
                    .replace(/>\s+/g, ">")
                    .replace(/\s+</g, "<");
        if (svgSave)
        {
                svg =svg.replace('height="1000"', ' ')
                .replace('width="3000"', ' ');
        }
        else
        {
            svg =svg.replace('height="1000"', 'height="400" ')
                .replace('width="3000"', 'width="600" viewBox="0 0 800 400" ');

        }
        svg = this.formatXml(svg);
        svg = svg.replace(/<desc>.*<\/desc>/g,"<desc>Create with JS graph library and RaphaelJS</desc>");
        canvas.setCurrentSelection(s);
        canvas.installEditPolicy(new draw2d.policy.canvas.SnapToGridEditPolicy());
        return svg;
    }
});



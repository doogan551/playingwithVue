draw2d.ui.PropEditor = draw2d.ui.LabelEditor.extend({

    /**
     * @constructor
     * @private
     */
    init: function () {
        this._super();
    },

    /**
     * @method
     * Trigger the edit of the label text.
     *
     * @param {draw2d.shape.basic.Label} label the label to edit
     */
    start: function (label, text, x, y, w, h) {
        this.label = label;
        this.commitCallback = $.proxy(this.commit, this);

        // commit the editor if the user clicks anywhere in the document
        //
        $("body").bind("click", this.commitCallback);
        $("body").bind("dblclick", this.commitCallback);

        var attr = { position: "absolute", top: y, left: x, width: w, height: h,"z-index":999 };
        this.div= $('<div class="editable" id="inplaceeditor">' + text + '</div>').appendTo('#canv');
        this.div.css(attr);
        this.div.hide();

        tinymce.init({
            selector: "div.editable",
            inline: true,
            plugins: ["textcolor"],
            toolbar: "fontsizeselect | bold italic | forecolor backcolor",
            menubar: false,
            statusbar:false,
            fontsize_formats: "8pt 10pt 12pt 14pt"
        });

        this.div.bind("keyup",$.proxy(function(e){
            switch (e.which) {
                case 46:
                    this.div.remove();
                    this.div = null;
                    var command = new draw2d.command.CommandDelete(this.label);
                    var canvas = this.label.getCanvas();
                    if(canvas) canvas.getCommandStack().execute(command);
                    break;

            }
        },this));
        this.div.fadeIn($.proxy(function () {
            this.div.focus();
            tinymce.get("inplaceeditor").focus();

        }, this));

        $("#" + this.label.id).fadeOut();
    },

    /**
     * @method
     * Transfer the data from the editor into the label.<br>
     * Remove the editor.<br>
     * @private
     */
    commit: function (e) {
        if(e.target.localName == "svg")
        {
            var content = tinymce.activeEditor.getContent();
            //console.log(content);
            $("body").unbind("click", this.commitCallback);
            $("body").unbind("dblclick", this.commitCallback);
            this.label.setText(content);
            $("#" + this.label.id).html(content);
            this.div.fadeOut($.proxy(function () {
                this.div.remove();
                this.div = null;
            }, this));
            $("#" + this.label.id).fadeIn();
        }
    }
});


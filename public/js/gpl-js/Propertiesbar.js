
example.Propertiesbar = Class.extend({

    init: function (elementId, app, view) {
        this.html = $("#" + elementId);
        this.view = view;
        this.app = app;
        this.controlsDiv = $("<div class='navbar-inverse navbar' />");
        this.groupDiv = $("<div class='controls' />");
        this.focusId = '';
        // Inject the Background Color Picker
        //

        this.bgColorInput = $('<label>Background Color</label><input type="text" class="input-medium color" id="bg-color"><div id="colorpicker"></div>');
        this.groupDiv.append(this.bgColorInput);
        this.controlsDiv.append(this.groupDiv);
        this.html.append(this.controlsDiv);

        var colorPicker = $.farbtastic("#colorpicker");
        colorPicker.linkTo(function (color) {
            var node = view.getCurrentSelection();
            node.setBackgroundColor(color);
            $('#' + focusId).val(color);
        });

        $(":input").focus(function() {
            focusId = this.id;
            if (this.id == 'bg-color') {
                    $('#colorpicker').show();
                    colorPicker.setColor(this.value);
                }
        });

        $(":input").blur(function () {
            if (this.id == 'bg-color') {
                $('#colorpicker').hide();
                colorPicker.setColor(this.value);
            }
        });
        
        $('#colorpicker').hide();

    }
});
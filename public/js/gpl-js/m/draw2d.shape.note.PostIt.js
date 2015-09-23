
draw2d.shape.note.PostIt= draw2d.shape.basic.Label.extend({

	NAME : "draw2d.shape.note.PostIt",

    init : function(id)
    {
        this._super();
        if (id == undefined)
        {
            this.id = draw2d.util.UUID.create();
        }
        else
        {
            this.id = id;
        }
        this.setDimension(30,40);

        this.repaint();
        this.setText("Label label Label");//, { top:y, left: x});

        if (!GPLViewModel.isViewer())
        {
            this.installEditor(new draw2d.ui.PropEditor());
            this.setDraggable(true);
        }
        else
        {
            this.setDraggable(false);
        }

        this.setAlpha(0);
        GPLViewModel.addProp(this.id, this.NAME);
    }
});




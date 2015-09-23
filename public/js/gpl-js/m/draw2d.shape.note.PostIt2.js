
draw2d.shape.note.PostIt2 = draw2d.shape.basic.Label.extend({

	NAME : "draw2d.shape.note.PostIt2",

    init : function(img, id)
    {
        this._super();
        if (id == undefined)
            this.id = draw2d.util.UUID.create();
        else
            this.id = id;
        this.setDimension(30,40);

        this.repaint();
        //this.setText(text);//, { top:y, left: x});

        if (!GPLViewModel.isViewer())
        {
            this.installEditor(new draw2d.ui.LabelInplaceEditor());
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




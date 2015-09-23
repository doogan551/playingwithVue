
dorsettGPL.FilterPane = Class.extend({
	
    DEFAULT_LABEL : "Properties",
    
	init:function(elementId, view){
		this.html = $("#"+elementId);
		this.view = view;
		this.currentFigure = null;
        //this.html.html('<div class="panetitle blackgradient">'+this.DEFAULT_LABEL+'</div>');

		// register this class as event listener for the canvas
		// CommandStack. This is required to update the state of 
		// the Undo/Redo Buttons.
		//
		view.getCommandStack().addEventListener(this);

		// Register a Selection listener for the state handling
		// of the Delete Button
		//
		view.addSelectionListener(this);

	},

	/**
	 * @method
	 * Called if the selection in the canvas has been changed. You must register this
	 * class on the canvas to receive this event.
	 * 
	 * @param {dorsett.Figure} figure
	 */
	onSelectionChanged : function(figure){
	    //if (figure == null)return;
        //this.html.html('<div class="highlight panetitle blackgradient">'+this.DEFAULT_LABEL+'</div>');

//        if(this.currentFigure)
//            console.log(this.currentFigure.isExtFigure);
        if(this.currentFigure!==null && typeof this.currentFigure.isExtFigure !=="undefined"){
            this.currentFigure.filters.each($.proxy(function(i,filter){
                filter.removePane();
            },this));
        }

        if(figure!==null &&  typeof figure.isExtFigure  !=="undefined"){
            figure.filters.each($.proxy(function(i,filter){
                filter.insertPane(figure,this.html);
            },this));


            $('[data-toggle="collapse"]').click(function () {
                if ($(this).attr('data-start') == 'open') {
                    $(this).html($(this).attr('data-close-text'));
                    $($(this).attr('data-target')).addClass("in");
                } else {
                    $(this).html($(this).attr('data-open-text'));
                    $($(this).attr('data-target')).removeClass("in");

                }
                $(this).attr('data-start', $(this).attr('data-start') == 'open' ? 'close' : 'open');
            });

            $('[data-toggle="collapse"]').each(function () {
                if ($(this).attr('data-start') == "open") {
                    $(this).html($(this).attr('data-open-text'));
                } else {
                    $(this).html($(this).attr('data-close-text'));
                }
            });

        }

        this.currentFigure = figure;
        if (figure !== null && this.currentFigure.isExtFigure)
        {
            //GPLViewModel.rightPanelOpen(true);
            $('#filterPane').pullOutContentPanel({
                pocp_scrollbars : true,
                pocp_showonload: true,
                pocp_pg_overlay: false,
                pocp_clickout: true
            });


        }

    },
	
	/**
	 * @method
	 * Sent when an event occurs on the command stack. dorsett.command.CommandStackEvent.getDetail() 
	 * can be used to identify the type of event which has occurred.
	 * 
	 * @template
	 * 
	 * @param {dorsett.command.CommandStackEvent} event
	 **/
	stackChanged:function(event)
	{
	}

});
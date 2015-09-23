window.onload = function(){



    $(".dragAround").draggable();

    $('#zoomSlider').jqxSlider({ width: 200, showButtons:false, showTicks:false, min:0, max:10,value:5,  mode: 'fixed' });
    $('#viewMode').jqxSwitchButton({ width:200, onLabel:"View Mode", offLabel:"Edit Mode",  checked: true });

    $("a#zoom100").on('click',function(){
        $('#zoomSlider').jqxSlider('setValue',5);
    });

    $("a#zoomIn").on('click',function(){
        $('#zoomSlider').jqxSlider('incrementValue');
    });

    $("a#zoomOut").on('click',function(){
        $('#zoomSlider').jqxSlider('decrementValue');
    });


    $('#canvas').mousewheel(function(event,delta){
        if (delta > 0)
        {
            $('#zoomSlider').jqxSlider('incrementValue');
        }
        else
        {
            $('#zoomSlider').jqxSlider('decrementValue');
        }
        return false;
    });


    $('#zoomSlider').on('change', function (event) {
        switch(event.args.value){
            case 0:
                window.app.view.setZoom(1.5);
                break;
            case 1:
                window.app.view.setZoom(1.4);
                break;
            case 2:
                window.app.view.setZoom(1.3);
                break;
            case 3:
                window.app.view.setZoom(1.2);
                break;
            case 4:
                window.app.view.setZoom(1.1);
                break;
            case 5:
                window.app.view.setZoom(1);
                break;
            case 6:
                window.app.view.setZoom(0.9);
                break;
            case 7:
                window.app.view.setZoom(0.8);
                break;
            case 8:
                window.app.view.setZoom(0.6);
                break
            case 9:
                window.app.view.setZoom(0.4);
                break;
            case 10:
                window.app.view.setZoom(0.2);
                break;

        }
        if (event.args.value == 5){
            $('a#zoom100').hide();
        }
        else{
            $('a#zoom100').show();
        }
    });

    $.blockUI.defaults.css = {
        position:'fixed',
        top:'40%',
        left:'40%',
        border: 'none',
        padding: '5px',
        backgroundColor: '#000',
        '-webkit-border-radius': '10px',
        '-moz-border-radius': '10px',
        opacity: .6,
        color: '#fff'
    };

    var boundBoxSelectionPolicy =  new draw2d.policy.canvas.BoundingboxSelectionPolicy();

    $('#viewMode').on('checked', function (event) {
        if (GPLViewModel.showSwitchViewConfirmDialog)// && GPLViewModel.mouseUpDetected)
        {
            $("#modal-ConfirmDialog").modal('show');
        }
        else{
            GPLViewModel.switchToViewMode();
            window.app.view.uninstallEditPolicy(boundBoxSelectionPolicy);

        }
    });

    $('#viewMode').on('unchecked', function (event) {
        if (GPLViewModel.switchViewModeCancel){
            return;
        }

        window.app.view.installEditPolicy(boundBoxSelectionPolicy);


        $.blockUI({message:"<h4>Switching to Edit Mode...Please Wait</h4>",
            onBlock:function(){
                $.ajax({
                    url:'/gpl/getLockInfo/' + iddd,
                    type:'GET',
                    success:function(p){
                        if (p.locked){
                            var msg = "Cannot switch to Edit Mode. In Use By " + p.lockedBy;
                            iToast.showNotification('Notification',msg,{icon:'lock', theme: 'jetblack' });
                        }
                        else{
                            $.ajax({
                                url:'/gpl/lockSequence',
                                type:'POST',
                                data:JSON.stringify({id:iddd}),
                                contentType:'application/json',
                                success:function(d){
                                    //iToast.showNotification('Notification', d.message,{icon:'lock', theme: 'jetblack' });
                                    GPLViewModel.isViewer(false);
                                }
                            });
                        }
                    }
                });

            }

        });
    });

    $("#sequenceProp").click(function(){
        $("#modal-sequenceProp").modal("show");
    });

    $("#loadEditVersion").click(function(){
        iToast.showCool(".....", "Edit Version Work in Progress");
    });


    $("a#toolbarOpen").on('click',function(){
        $('#myPanel').pullOutContentPanel({
            pocp_scrollbars : false,
            pocp_showonload: true,
            pocp_pg_overlay: false,
            pocp_clickout : false
        });
    });

    var updatePreview = function() {
        var color = $(this).chromoselector("getColor");
        $(this).css({
            'background-color': color.getHexString(),
            'color': color.getTextColor().getHexString(),
            'text-shadow': '0 1px 0 ' + color.getTextColor().getTextColor().getHexString()
        });
        GPLViewModel.bgColor(color.getHexString());
    };

    // Initialise the color picker
    $("#bgColor").chromoselector({
        target: "#picker",
        autoshow: false,
        width: 155,
        resizable:false,
        preview: false,
        create: updatePreview,
        update: updatePreview
    }).chromoselector("show", 0);




//    $(document).on('hidden.bs.modal', function (e) {
//        console.log('sfsafas');
//        if ($(e.target).attr('data-refresh') == 'true') {
//            // Remove modal data
//            console.log('ssfs');
//            $(e.target).removeData('bs.modal');
//            // Empty the HTML of modal
//            //$(e.target).html('');
//        }
//    });

};


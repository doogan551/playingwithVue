var dorsettGPL = {};

dorsettGPL.Application = Class.extend(
{
    NAME: "dorsettGPL.Application",

    init: function () {

        this.view = new dorsettGPL.View("canvas");
        var self = this;
        this.view.getSequence(function(seq) {
            if (seq == null) {
                return;
            }
            //Check if Sequence Data exists
            if (typeof(seq["Sequence Details"]) === 'undefined'){
                $.blockUI({message:"<h4>No Sequence Data Found For this point</h4>"});
                /***
                 * Added events to notify scripts when sequence is loaded
                 * Chris Ellenburg
                 */
                $('body').trigger({type: 'sequenceLoaded', msg: 'fail'});
                $("#loadingScreen").hide();
                return;
            }
            self.initializeSequence(seq);
        });

        this.view.sequenceUPI = iddd;
        this.toolbar = new dorsettGPL.Toolbar("toolbar", this, this.view);
        this.filter = new dorsettGPL.FilterPane("filter_actions", this.view);

    },
    initializeSequence:function(seq){
        var self = this;
        GPLViewModel.sequencePoint = seq;
        GPLViewModel.defaultShowLabel(Boolean(seq["Show Label"].Value));
        GPLViewModel.defaultShowValue(Boolean(seq["Show Value"].Value));
        self.view.originalSequencePoint = JSON.stringify(seq);
        self.getAdditionalQueries(seq);


        if (isOld === 'true'){
            GPLViewModel.isViewer(true);
            GPLViewModel.devicePointName(seq["Device Point"].PointName);
            GPLViewModel.devicePoint(seq["Device Point"].Value);
            GPLViewModel.description(seq["Description"].Value);
        }
        else{
            GPLViewModel.isNewSequence = true;
            GPLViewModel.devicePointName(point["Device Point"].PointName);
            GPLViewModel.devicePoint(point["Device Point"].Value);
            $("#loadingScreen").addClass('animated fadeOutDown').hide('slow');
            $('#viewMode').hide();
            $("#toolbarOpen").show();
            $("#accordion").show();
            $('#myPanel').pullOutContentPanel({
                pocp_scrollbars : false,
                pocp_showonload: true,
                pocp_pg_overlay: false,
                pocp_clickout : false
            });
        }
        /***
         * Added events to notify scripts when sequence is loaded
         * Chris Ellenburg
         */
        $('body').trigger({type: 'sequenceLoaded', msg: 'success'});

    },
    getAdditionalQueries:function(seq){
        var self = this;
        $.ajax({url: '/api/system/qualitycodes', cache:true,async:true,
            success: function (q) {
                self.view.qualityCodes = q;
            },
            error: function(){
                iToast.showError("Error", "User Authentication Failed.");
            }
        });


        $.ajax({
            url: '/api/system/controllers',
            type: 'get',
            async: true,
            cache: true,
            success: function (data) {
                GPLViewModel.controllers([new KeyVal("[Not Selected]", 0)]);
                $.each(data, function (key, val) {
                    GPLViewModel.controllers.push(new KeyVal(val["Controller Name"], val["Controller ID"]));
                });
                GPLViewModel.defaultController(parseInt(seq["Controller"].eValue));


            },
            error:function(){
                iToast.showError("Error", "User Authentication Failed.");
            }
        });


    }
});

/**
 * Created by Soven on 7/26/2014.
 */
({
    initialSetup: function () {
        console.log("Hello from Save Report");

        var saveReportValidator = $("#saveReportForm").kendoValidator().data("kendoValidator");


        $("#submitSaveReport").click(function(e) {
            if (saveReportValidator.validate()) {
                var saveReports = {
                    reportName:$("#reportName").val(),
                    reportOption:$("#params").val()
                };

                //TODO check uniqueness of template name

                dorsett.reportUI.registerCallback(saveReports);
                return false;
                //$.ajax({
                //    url:'/reports1/setReportSave',
                //    type:'POST',
                //    data:saveReports,
                //    success:function(){
                //        $("#successMessage").addClass("alert-dismissible").show()
                //            .html("Report Template has been saved successfully!!!").delay(3000).fadeOut("slow");
                //    },
                //    error:function(){
                //        $("#errorMessage").addClass("alert-danger alert-dismissible").show()
                //            .html("Report Template cannot be saved at this time. Please try again.").delay(3000).fadeOut("slow");
                //
                //    }
                //
                //
                //});
                //console.log(scheduleReports);
            }
            e.preventDefault();
        });

    }

}.initialSetup());


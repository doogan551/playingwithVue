/**
 * Created by Soven on 7/26/2014.
 */
({
    initialSetup: function (reportConfig) {
        //console.log("Hello from Schedule Report");
        var runEvery = $("#runEvery").kendoDropDownList({
            dataSource: [
                {"text": "Daily", "value":"daily"},
                {"text": "Weekly", "value":"weekly"}
            ],
            dataValueField: "value",
            dataTextField:"text",
            change:function(e){
                if (this.value() == "weekly"){
                    $("input[name=runDay]").attr("checked", false);
                }
            }
        }).data("kendoDropDownList");

        $("#runTime").kendoTimePicker({
            timeFormat: "h:mm tt"
        });

        $("#sendEmailsTo").kendoMultiSelect({
            dataSource: [
                {"text": "Soven Shrivastav", "value":"soven@sovbob.com"},
                {"text": "Contact at Sovbob", "value":"contact@sovbob.com"},
                {"text": "Winston at Sovbob", "value":"winston@sovbob.com"},
                {"text": "Salem at Sovbob", "value":"salem@sovbob.com"},
                {"text": "Lewis at Sovbob", "value":"lewis@sovbob.com"}
            ],
            dataValueField: "value",
            dataTextField:"text"
        });

        var scheduleReportValidator = $("#scheduleReportForm").kendoValidator().data("kendoValidator");

        $("input[name=runDay]").click(function(){
            if (runEvery.value() == "weekly") {
                $("input[name=runDay]").attr("checked", false);
                this.checked = !this.checked;
            }

            return true;


        });

        $("#submitScheduleReport").click(function(e) {
            //var days = [];
            if (scheduleReportValidator.validate()) {
                var days = $("input[name=runDay]:checked").map(function(){
                    return $(this).val();
                }).get();
                var dd = kendo.toString($("#runTime").data("kendoTimePicker").value(), "HH:mm");
                var scheduleReports = {
                    frequence:runEvery.value(),
                    days:days,
                    runTime:dd,
                    sendEmailsTo:$("#sendEmailsTo").data("kendoMultiSelect").value(),
                    reportType:$("#reportType").val(),
                    reportOption:{}
                };

                reportConfig.getReportOption(false,function(d){
                    scheduleReports.reportOption = d;

                    $.ajax({
                        url:'/reports1/setReportSchedule',
                        type:'POST',
                        data:scheduleReports,
                        success:function(){
                            $("#successMessage").addClass("alert-dismissible").show()
                                .html("Report has been scheduled").delay(3000).fadeOut("slow");
                        },
                        error:function(){
                            $("#errorMessage").addClass("alert-danger alert-dismissible").show()
                                .html("Report cannot be scheduled. Please try again.").delay(3000).fadeOut("slow");

                        }


                    });


                });

                //console.log(scheduleReports);
            }
            e.preventDefault();
        });

    }

}.initialSetup(dorsett.reportUI));


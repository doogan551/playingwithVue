({
    initialSetup: function () {
        var self = this;
        $(".errorMsg").hide();
        $('#addPoint').validate();
        $("#nextAction").click(function () {
            if($("#addPoint").valid()){
                var formdata = $("#addPoint").serialize();
                self.validateForm(formdata, function (d) {
                    var pt = {};
                    pt.Name = d.pointname1 + "_" + d.pointname2 + "_" + d.pointname3 + "_" + d.pointname4;
                    pt.name1 = d.pointname1;
                    pt.name2 = d.pointname2;
                    pt.name3 = d.pointname3;
                    pt.name4 = d.pointname4;
                    pt.pointType = d.pointTypeSelection.replace('+', ' ');
                    pt.targetUpi = 0;

                    $("div.modal-body").block({
                        message:"<img src='/img/busy.gif' alt='Busy...' />",
                        css: {
                            border: 'none',
                            padding: '5px',
                            backgroundColor: '#000',
                            '-webkit-border-radius': '10px',
                            '-moz-border-radius': '10px',
                            opacity: .6,
                            color: '#fff'
                        }});
                    self.initPoint(pt, function (data) {

                        //Add Device Point UPI on the returned Point
                        if (pt.pointType === "Sequence")
                        {
                            data["Device Point"].PointName = $("#dpName").text();
                            data["Device Point"].Value = parseInt(d.dp);
                        }
                        if(window.app){
                            window.app.view.dropCancel = false;
                            $("div.modal-body").unblock();
                            window.app.view.assignProperties(data, $('#'+requiredLabel).val());
                           return;
                        }
                        $.ajax({
                            url: '/pointreview', async: false,
                            type: 'post', data: {'point': data, 'action': 'add'},
                            success: function (data, status) {
                                $("div.modal-body").unblock();
                                $('#modal-addPoint').modal('hide');
                                var wintab = '';
                                if (data.tabOpen) {
                                    //wintab = window.open(data.url, "_blank");
                                    // Create a form
                                    var newPointForm = document.createElement("form");
                                    newPointForm.target = "_blank";
                                    newPointForm.method = "POST";
                                    newPointForm.action = data.url;

                                    var newPointInput = document.createElement("input");
                                    newPointInput.type = "hidden";
                                    newPointInput.name = "point";
                                    newPointInput.value = data.point;

                                    newPointForm.appendChild(newPointInput);

                                    document.body.appendChild(newPointForm);

                                    newPointForm.submit();
                                }
                                else {
                                    wintab = window.open(data.url, "", "width=482,height=600");
                                    wintab.focus();
                                }

                                //wintab.point = data.point;
                                //wintab.focus();
                            }
                        });
                    });
                });
            }
        });
    },
    validateForm: function (d, callback) {
        var formdata = {};
        var pairs = d.split('&');
        pairs.forEach(function (pair) {
            pair = pair.split('=');
            formdata[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        errMsg = "";
        if (formdata.pointTypeSelection == "")
            errMsg = "Point Type is required.";
        if (formdata.pointname1 == "")
            errMsg = "Point Name1 is required.";
        if (errMsg != "")
        {
            iToast.showError("Error", errMsg);
        }
        else
            callback(formdata);
    },
    initPoint: function (pt, callback) {
        $.ajax({
            url:'/api/points/initPoint',
            contentType:'application/json',
            type:'Post',
            data:JSON.stringify(pt),
            success: function (data) {
                if (data.err) {
                    iToast.showError("Error", data.err);
                    $("div.modal-body").unblock();
                }
                else {
                    callback(data);
                }
            }
        });
    },
    addPoint: function (pt, callback) {
        $.post("/api/points/addpoint", {point: pt}, function (data) {
            if (data.msg == "success")
                callback(data);
            else {
                iToast.showError("Error", data.err);
            }
        });
    }
}.initialSetup());


(function(){
    $("#devicePoint").hide();
    $("#devicePointSpan").hide();
    var pointTypes = {};
    if (isPointTypeSupplied){
        pointTypes = {"key":pointTypeSupplied};
        setPointTypeSelection(pointTypes);
        $("#pointTypeSelection").jqxListBox('selectIndex', 0 );
        $("#devicePointSpan").show();
        $("#nextAction").prop('disabled', false);

    }
    else{
        getPointTypes(function(data){
              pointTypes = data;
              setPointTypeSelection(pointTypes);
        });
    }


    $("#devicePointSelection").click(function(event){
        event.preventDefault();
        var dp = $("#dp").val();
        var win = window.open('/pointselector/devicePoints/' + dp,"myPointWindow","width=722,height=600");
        win.onload = function() {
            win.dorsett.pointSelector.init(setPoint);
        }

    });

    var pointname1Rule = {
        pointname1: {required: true, messages:{"required" : "Name1 is required field."}}
    }
    var pointname2Rule = {
        pointname2: {required: true, messages:{"required" : "Name2 is required field."}}
    }
    var pointname3Rule = {
        pointname3: {required: true, messages:{"required" : "Name3 is required field."}}
    }
    var pointname4Rule = {
        pointname4: {required: true, messages:{"required" : "Name4 is required field."}}

    };

    function addRules(rulesObj){
        for (var item in rulesObj){
            $('#'+item).rules('add',rulesObj[item]);
        }
    }
    function setPoint(upi,nam){
        $("#dpName").text(" " + nam);
        $("#dp").val(upi);
        $("#nextAction").prop('disabled', false);

    }

    function getPointTypes(callback){
        $.ajax({url:'/api/points/pointTypes/add',success:function(data){
            callback(data);
        }});
    }

    function setPointTypeSelection(data){
        $('#pointTypeSelection').jqxListBox({  source:data,
            displayMember: "key", height:140, valueMember: "key",
            theme: 'ui-sunny' });


        $('#pointTypeSelection').jqxListBox({width:'98%'});

        $('#pointTypeSelection').on('select', function (event) {
            var args = event.args;
            if (args) {
                if (args.item.value == "Sequence"){
                    $("#devicePoint").show();
                    $("#nextAction").prop('disabled', true);
                }
                else{
                    $("#devicePoint").hide();
                }

            }
        });

    }


    if (requiredLabel == 'pointname1')
    {
        addRules(pointname1Rule);
    }
    if (requiredLabel == 'pointname2')
    {
        addRules(pointname2Rule);
    }
    if (requiredLabel == 'pointname3')
    {
        addRules(pointname3Rule);
    }
    if (requiredLabel == 'pointname4')
    {
        addRules(pointname4Rule);
    }


}());

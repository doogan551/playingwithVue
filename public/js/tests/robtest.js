jQuery(document).ready(function () {
    var testData = {
        pointType: "",
        //objType: ["Display","Analog Output", "Device"],
        name1: "4696",
        //name1SearchType: 'contains',
        //name2: "",
        //name2SearchType: 'contains',
        //name3: "",
        //name3SearchType: 'contains',
        //name4: "",
        //name4SearchType: 'contains',
        //name1: {
        //    value: "",
        //    searchType: "contain"
        //},
        //name2: {
        //    value: "",
        //    searchType: "contain"
        //},
        //name3: {
        //    value: "",
        //    searchType: "contain"
        //},
        itemsPerPage: 25,
        currentPage: 1
    }

    $('#button').on('click', '#testbtn', function () {

        $.ajax({
            url: '/api/points/search/',
            type: 'post',
            dataType: 'json',
            success: function (data) {

                //html = JSON.stringify(data.points[0].name1);
                var count = 0;
                var html = "";

                $.each(data.points, function () {
                    html += count++ + ": " + this._id + " " + this.name1 + " " + this.name2 + " " + this.name3 + " " + this.name4 + " " + this.objecttype + "<br />";
                    if (count == testData.itemsPerPage) {
                        return false;
                    }
                });
                $('#results').html(html);
            },
            data: testData
        });
    });

    $('#button').on('click', '#prevpage', function () {
        testData.currentPage--;
        $.ajax({
            url: '/api/points/search/',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var count = 0;
                var html = "";
                $.each(data.points, function () {
                    html += count++ + ": " + this._id + " " + this.name1 + " " + this.name2 + " " + this.name3 + " " + this.name4 + " " + this.objecttype + "<br />";
                    if (count == testData.itemsPerPage) {
                        return false;
                    }
                });
                $('#results').html(html);
            },
            data: testData
        });
    });

    $('#button').on('click', '#nextpage', function () {
        testData.currentPage = testData.currentPage + 1;
        $.ajax({
            url: '/api/points/search/',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var count = 0;
                var html = "";
                $.each(data.points, function () {
                    html += count++ + ": " + this._id + " " + this.name1 + " " + this.name2 + " " + this.name3 + " " + this.name4 + " " + this.objecttype + "<br />";
                    if (count == testData.itemsPerPage) {
                        return false;
                    }
                });
                $('#results').html(html);
            },
            data: testData
        });
    });

    $('body').on('click', '#pointsearchbutton', function () {
        $.ajax('/api/points/' + $('#pointsearchinput').val()).done(function (data) {
            var html = "";
            $.each(data, function () {
                html += this + "<br \>";
            });
            $('#pointsearchresults').html(html);
        });
    });

    $('body').on('click', '#clearbutton', function () {
        $('#results').html("");
        $('#pointsearchresults').html("");
        $('#createmessage').html("");
    });

    var groupcreatedata = {
        name1: "RobGroup",
        name2: "test",
        name3: "",
        name4: "",
        name5: "",
        name6: "",
        name7: "",
        name8: "",
        name9: "",
        name10: "",
        name11: "",
        name12: "",

        accesslevel: 1,
        reviewlevel: 1,
        modifylevel: 1,
        accessgroup: "test",

        pointtype: "Group",
        location: {
            building: "4493",
            room: "112",
            lat: "123.123456789012",
            long: "456.312345678901"
        }

    }

    $('#groupcreatebutton').click(function () {
        $.ajax({
            url: '/api/groups/create',
            type: 'post',
            dataType: 'json',
            success: function (message) {
                var html = "";
                $.each(message, function () {
                    html += this + "<br \>";
                });
                $('#createmessage').html("message:" + html);

            },
            data: groupcreatedata
        });
    });

    var addpointdata = {
        name1: "RobGroup",
        name2: "test",
        name3: "",
        name4: "",
        name5: "",
        name6: "",
        name7: "",
        name8: "",
        name9: "",
        name10: "",
        name11: "",
        name12: "",

        pointid: 44939

    }

    $('#addpointtogroupbutton').click(function () {
        $.ajax({
            url: '/api/groups/addpoint',
            type: 'post',
            dataType: 'json',
            success: function (message) {
                var html = "";
                $.each(message, function () {
                    html += this + "<br \>";
                });
                $('#addpointtogroupmessage').html("message:" + html);

            },
            data: addpointdata
        });
    });

    var millerdata = {};

    $('#millerviewbutton').click(function () {
        $.ajax({
            url: '/api/points/search/segment',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var html = "";
                count = 0;
                $.each(data, function () {
                    html += "<input type='button' id='#group" + this.isGroup + "' value='" + this.name1 + "'>" + this[' '] + " " + this.isGroup + "<br \>";
                });
                $('#pane1').html(html + "<br/>");

            },
            data: millerdata
        });
    });

    $('#pane1').click(function (e) {
        millerdata['name1'] = e.target.value;
        $.ajax({
            url: '/api/points/search/segment',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var html = "";
                count = 0;
                $.each(data, function () {
                    html += "<input type='button' id='#group" + this.isGroup + "' value='" + this.name2 + "'>" + this['Point Type'] + "<br \>";
                });
                $('#pane2').html(html + "<br/>");

            },
            data: millerdata
        });
    });
    $('#pane2').click(function (e) {
        millerdata['name2'] = e.target.value;

        $.ajax({
            url: '/api/points/search/segment',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var html = "";
                count = 0;
                $.each(data, function () {
                    html += "<input type='button' id='#group" + this.isGroup + "' value='" + this.name3 + "'>" + this['Point Type'] + "<br \>";
                });
                $('#pane3').html(html + "<br/>");

            },
            data: millerdata
        });
    });
    $('#pane3').click(function (e) {
        millerdata['name3'] = e.target.value;
        $.ajax({
            url: '/api/points/search/segment',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var html = "";
                count = 0;
                $.each(data, function () {
                    html += "<input type='button' id='#group" + this.isGroup + "' value='" + this.name4 + "'>" + this['Point Type'] + "<br \>";
                });
                $('#pane4').html(html + "<br/>");

            },
            data: millerdata
        });
    });

    var groupsearchdata = {
        name1: "",
        name2: "",
        name3: "",
        name4: ""
    }

    $('#groupsearchbutton').click(function () {
        $.ajax({
            url: '/api/groups/search/',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var html = "";

                $.each(data, function () {
                    html += "<input type='button' id='group' value='" + this.name1 + "'><br \>";
                });
                $('#groupsearchresults').html(html + "<br/>");

            },
            data: groupsearchdata
        });
    });

    $('#groupsearchresults').click(function (e) {
        groupsearchdata.name1 = e.target.value;
        $.ajax({
            url: '/api/groups/search/',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var html = "";

                $.each(data, function () {
                    html += "<input type='button' id='group' value='" + this.name2 + "'><br \>";
                });
                $('#groupsearchresults2').html(html + "<br/>");

            },
            data: groupsearchdata
        });
    });

    $('#groupsearchresults2').click(function (e) {
        groupsearchdata.name2 = e.target.value;
        $.ajax({
            url: '/api/groups/search/',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                var html = "";

                $.each(data, function () {
                    html += "<input type='button' id='group' value='" + this.name3 + "'><br \>";
                });
                $('#groupsearchresults2').html(html + "<br/>");

            },
            data: groupsearchdata
        });
    });

    $('#addfolderbutton').click(function () {

        $.ajax({
            url: '/api/points/folders/new',
            type: 'post',
            dataType: 'json',
            success: function (data) {
                alert(data.message);
            },
            data: { name1: "002", name2: "abc", name3: "thisisatest" }
        });
    });

    $('#loginbutton').click(function () {
        $.ajax({
            url: '/session/login',
            type: 'post',
            dataType: 'json',
            success: function (status) {
                alert(status.status);
            },
            data: {
                username: $('#username').val(),
                password: $('#password').val()
            }
        });

    });

    $('#registerbutton').click(function () {
        $.ajax({
            url: '/session/register',
            type: 'post',
            dataType: 'json',
            success: function (message) {
                alert(message.message);
            },
            data: {
                username: $('#rusername').val(),
                password: $('#rpassword').val(),
                "Access Level": 5
            }
        });

    });

    var data = {
        Dates: [
            {
                "Month": "January",
                "Day": 16,
                "Year": 2013,
                "Comment": "Martin Luther King's Day"
            },
            {
                "Month": "February",
                "Day": 20,
                "Year": 2013,
                "Comment": "President's Day"
            },
            {
                "Month": "May",
                "Day": 28,
                "Year": 2013,
                "Comment": "Memorial Day"
            },
            {
                "Month": "July",
                "Day": 4,
                "Year": 2013,
                "Comment": "Independence Day"
            },
            {
                "Month": "September",
                "Day": 3,
                "Year": 2013,
                "Comment": "Labor Day"
            },
            {
                "Month": "October",
                "Day": 8,
                "Year": 2013,
                "Comment": "Columbus Day"
            },
            {
                "Month": "January",
                "Day": 1,
                "Year": 2013,
                "Comment": "New Year's Day"
            },
            {
                "Month": "December",
                "Day": 25,
                "Year": 2013,
                "Comment": "Christmas Day"
            },
            {
                "Month": "November",
                "Day": 22,
                "Year": 2013,
                "Comment": "Thanksgiving Day"
            },
            {
                "Month": "November",
                "Day": 12,
                "Year": 2013,
                "Comment": "Veteren's Day"
            }
        ]
    };

    $('#adddatesbutton').click(function () {
        $.ajax({
            url: '/api/system/calendar/add',
            type: 'post',
            dataType: 'json',
            success: function (message) {
                alert(message.message);
            },
            data: data
        });

    });

    $('#pointtypes').click(function () {
        $.ajax({
            url: '/api/points/pointtypes',
            type: 'post',
            dataType: 'json',
            success: function (message) {
                alert(message.length);
            },
            data: {app:'Displays', item:'Dynamic'}
            //data: {}
        });

    });

    $('#addenumsbutton').click(function () {
        var properties = []
        $('#select :selected').each(function (i, selected) {
            properties.push($(selected).text());
        });
        if (properties.length > 0 && $.trim($('#app').val()) != '' && $.trim($('#item').val())) {
            var enumData = { 'app': $('#app').val(), 'item': $('#item').val(), 'properties': properties }
            $.ajax({
                url: '/api/points/addenums',
                type: 'post',
                dataType: 'json',
                success: function (message) {
                    if (message.message == 'success') {
                        $('#select :selected').removeAttr("selected");
                        $('#app').val('');
                        $('#item').val('');
                        $('#select').focus();
                    }
                    alert(message.message);
                },
                //data: {app:'Displays', item:'Dynamic'}
                data: enumData
            });
        } else {
            alert('please select at least one property and enter an app and item');
        }
    });

    $.ajax({
        url: '/api/points/pointtypes',
        type: 'post',
        dataType: 'json',
        success: function (properties) {
            $(properties).each(function(i, property){
                $('#select').append($("<option></option>").text(property));
            });
        }

        //data: {app:'Displays', item:'Dynamic'}
       // data: enumData
    });

})


$(document).ready(function () {

    testLogin = function(input, callback) {
        $.ajax({
            url: '/session/login/',
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.err) {
                    return callback(false);
                } else if (returnData.status == true) {
                    return callback(true);
                } else {
                    return callback(false);
                }

            },
            data: input
        });
    }

    testRegister = function (input, callback) {
        $.ajax({
            url: '/session/register/',
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.err) {
                    return callback(false);
                } else if (returnData.message == "This username already exists.") {
                    return callback(true);
                } else {
                    return callback(false);
                }

            },
            data: input
        });
    }

});
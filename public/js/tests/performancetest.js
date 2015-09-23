

$(document).ready(function () {

    testPerformance = function (callback) {
        $.ajax({
            url: '/api/performance/test',
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.err) {
                    return callback(false);
                } else if (returnData) {
                    console.log(JSON.stringify(returnData));
                    return callback(true);
                } else {
                    return callback(false);
                }

            }
        });
    },

    testChars = function (input, callback) {
        $.ajax({
            url: '/api/performance/teststringchars',
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.err) {
                    return callback(false);
                } else if (returnData) {
                    console.log(JSON.stringify(returnData));
                    return callback(true);
                } else {
                    return callback(false);
                }

            },
            data: input
        });
    };

});
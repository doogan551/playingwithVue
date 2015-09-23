

$(document).ready(function () {

    testRun = function(input, callback) {
        $.ajax({
            url: '/api/reporting/run/',
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.err) {
                    return callback(false);
                } else if (returnData) {
                    console.log(returnData.length);
                    return callback(true);
                } else {
                    return callback(false);
                }

            },
            data: input
        });
    };

});
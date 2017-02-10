

$(document).ready(function () {

    testUpi = function(input, callback) {
        $.ajax({
            url: '/api/history/'+input,
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.err) {
                    return callback(false);
                } else if (returnData.length > 0) {
                    return callback(true);
                } else {
                    return callback(false);
                }

            }
        });
    };

});
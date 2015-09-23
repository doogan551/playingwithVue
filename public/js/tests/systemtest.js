

$(document).ready(function () {

    testCalendar = function(callback) {
        $.ajax({
            url: '/api/system/calendar/',
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
    }

    testCalendarAdd = function (input, callback) {
        $.ajax({
            url: '/api/system/calendar/add',
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.message == "done") {
                    return callback(true);
                } else {
                    return callback(false);
                }

            },
            data: input
        });
    }

    testCalendarYear = function (input, callback) {
        $.ajax({
            url: '/api/system/calendar/' + input,
            type: 'post',
            dataType: 'json',
            success: function (returnData) {
                if (returnData.length > 0) {
                    return callback(true);
                } else {
                    return callback(false);
                }

            }
        });
    }

    testControlPriorities = function (callback) {
        $.ajax({
            url: '/api/system/controlpriorities/',
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
    }

    testQualityCodes = function (callback) {
        $.ajax({
            url: '/api/system/qualitycodes/',
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
    }

    testControllers = function (callback) {
        $.ajax({
            url: '/api/system/controllers/',
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
    }

    testCustomColors = function (callback) {
        $.ajax({
            url: '/api/system/customcolors/',
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
    }

    testAccessGroups = function (callback) {
        $.ajax({
            url: '/api/system/accessgroups/',
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
    }

});
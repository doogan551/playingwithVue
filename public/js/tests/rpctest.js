$(document).ready(function () {

	testRPC = function (callback) {
		$.ajax({
			url: '/api/config/devices/rpctest',
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
	};

});
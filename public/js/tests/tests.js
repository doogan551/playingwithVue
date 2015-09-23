$(document).ready(function() {

	primaryTest = function(input, url, callback) {

		$.ajax({
			url: url,
			type: 'POST',
			contentType: 'application/json',
			dataType: 'json',
			success: function(returnData) {
				console.log(url, JSON.stringify(returnData));
				return callback(returnData);
			},
			data: JSON.stringify(input)
		});
	};

	primaryTestGet = function(input, url, callback) {

		$.ajax({
			url: url,
			type: 'get',
			dataType: 'json',
			success: function(returnData) {
				console.log(url, JSON.stringify(returnData));
				return callback(true);
			},
			data: input
		});
	};
});
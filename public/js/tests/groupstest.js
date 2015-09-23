$(document).ready(function () {

	testGroupsCreate = function (input, callback) {
		$.ajax({
			url: '/api/groups/create/',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.message == "Group already exists") {
					return callback(true);
				} else {
					return callback(true);
				}

			},
			data: input
		});
	};

	testGroupsAddPoint = function (input, callback) {
		$.ajax({
			url: '/api/groups/addpoints',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else if (returnData.message) {
					console.log(JSON.stringify(returnData.message));
					return callback(true);
				} else {
					return callback(false);
				}

			},
			data: input
		});
	};

	testGroupsSearch = function (input, callback) {
		$.ajax({
			url: '/api/groups/search',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else {
					console.log(JSON.stringify(returnData));
					return callback(true);
				}
			},
			data: input
		});
	};

	testGroupsUpdate = function (input, callback) {
		$.ajax({
			url: '/api/groups/update',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else {
					return callback(true);
				}
			},
			data: input
		});
	};

	testGroupsRemove = function (input, callback) {
		$.ajax({
			url: '/api/groups/remove',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				if (returnData.err) {
					return callback(false);
				} else {
					return callback(true);
				}
			},
			data: input
		});
	};
});
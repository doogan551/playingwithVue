$(document).ready(function () {

	testGetUsers = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/getusers',
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
	},

	testGetGroups = function (input, callback) {
		$.ajax({
			url: '/api/security/users/getgroups',
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
	},

	testAddUsersToGroups = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/addusers',
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
	},

	// testAddGroups = function (input, callback) {
	//     $.ajax({
	//         url: '/api/security/users/addgroups',
	//         type: 'post',
	//         dataType: 'json',
	//         success: function (returnData) {
	//             if (returnData.err) {
	//                 return callback(false);
	//             } else if (returnData) {
	//                 console.log(JSON.stringify(returnData));
	//                 return callback(true);
	//             } else {
	//                 return callback(false);
	//             }

	//         },
	//         data: input
	//     });
	// },

	testNewGroup = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/savegroup',
			type: 'post',
			dataType: 'json',
			success: function (returnData) {
				console.log(JSON.stringify(returnData));
				if (returnData.err) {
					return callback(false);
				} else if (returnData) {
					return callback(true);
				} else {
					return callback(false);
				}
			},
			data: input
		});
	},

	testRemoveUsersFromGroups = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/removeusers',
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
	},

	testRemoveGroupsFromUser = function (input, callback) {
		$.ajax({
			url: '/api/security/users/removegroups',
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
	},

	testRemoveGroup = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/removegroup',
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
	},

	testAddGroupsToPoint = function (input, callback) {
		$.ajax({
			url: '/api/security/points/addgroups',
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
	},

	testRemoveGroupsFromPoint = function (input, callback) {
		$.ajax({
			url: '/api/security/points/removegroups',
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
	},

	// testGetAllUsers = function (input, callback) {
	//     $.ajax({
	//         url: '/api/users/getusers',
	//         type: 'post',
	//         dataType: 'json',
	//         success: function (returnData) {
	//             if (returnData.err) {
	//                 return callback(false);
	//             } else if (returnData) {
	//                 console.log(JSON.stringify(returnData));
	//                 return callback(true);
	//             } else {
	//                 return callback(false);
	//             }
	//         },
	//         data: input
	//     });
	// },

	testGetAllGroups = function (callback) {
		$.ajax({
			url: '/api/security/groups/getallgroups',
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

	testUpdateGroup = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/savegroup',
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
	},

	testAddUserToPoint = function (input, callback) {
		$.ajax({
			url: '/api/security/points/addusers',
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
	},

	testRemoveUserFromPoint = function (input, callback) {
		$.ajax({
			url: '/api/security/points/removeusers',
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
	},

	testGetPointsByGroup = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/getpoints',
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
	},

	testGetGroupById = function (input, callback) {
		$.ajax({
			url: '/api/security/groups/' + input,
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
	},

	testUserSystemAccess = function (input, callback) {
		$.ajax({
			url: '/api/security/users/systemaccess',
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
	},

	testAddUser = function (input, callback) {
		$.ajax({
			url: '/api/security/users/saveuser',
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
	},

	testRemoveUser = function (input, callback) {
		$.ajax({
			url: '/api/security/users/removeuser',
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
	},

	testGetAllUsers = function (input, callback) {
		$.ajax({
			url: '/api/security/users/getallusers',
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
	},

	testUpdateUser = function (input, callback) {
		$.ajax({
			url: '/api/security/users/saveuser',
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
	},

	testGetUserById = function (input, callback) {
		$.ajax({
			url: '/api/security/users/' + input,
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
	},

	testAddUsersToPoints = function (input, callback) {
		$.ajax({
			url: '/api/security/points/addusers',
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
	},

	testRemoveUsersFromPoint = function (input, callback) {
		$.ajax({
			url: '/api/security/points/removeusers',
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
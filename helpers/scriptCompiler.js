var process = require('child_process').exec,
	child;

module.exports.compile = function(path, newpath, callback) {
	var infoScriptExe = __dirname + '/../infoscript.exe ',
		command = infoScriptExe + path + ' ' + newpath;

	child = process(command, function(err, stdout, stderr) {
		callback(err);
	});
};

// make temp folder for these files
// symb to 4 script properties
// err to user if not empty
// ignore list
// pcd to property as binary entry
// on commit, update db then delete temp folder
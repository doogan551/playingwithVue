let process = require('child_process').exec;

module.exports.compile = function (path, newpath, callback) {
    let infoScriptExe = __dirname + '/../infoscript.exe ';
    let command = infoScriptExe + path + ' ' + newpath;

    process(command, function (err) {
        callback(err);
    });
};

// make temp folder for these files
// symb to 4 script properties
// err to user if not empty
// ignore list
// pcd to property as binary entry
// on commit, update db then delete temp folder

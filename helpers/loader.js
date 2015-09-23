/**
 * Loader
 * auto loads files as modules into an object
 */

/**
 * Module dependencies.
 */

var fs = require('fs'),
	_ = require('lodash'),
	path = require('path');

exports = module.exports = {

	load: loadFiles

};

function loadFiles(app,obj, dir, first) {
	var files = fs.readdirSync(dir),
		num = 0;
	/*first = first || [];
	console.log('files', files, first);
	first = _(first).map(function (file) {
		return file + '.js';
	});


	files = _(files).reject(function (file) {
		return _(first).contains(file);
	});

	var order = first.concat(files);

	_(order).each(function (file) {
		console.log('file', file);
		stat = fs.statSync(dir + '/' +file);
		if (!stat.isDirectory() && path.extname(file) == '.js') {
			var name = path.basename(file, ".js");
			obj[name] = require(dir + '/'+ name);
			if (_.isFunction(obj[name])) {
				obj[name] = obj[name](app);
			}
			num++;
		}
	});*/

	_.forEach(files, function(file){
		stat = fs.statSync(dir + '/' +file);
		if (!stat.isDirectory() && path.extname(file) == '.js') {
			var name = path.basename(file, ".js");
			obj[name] = require(dir + '/'+ name);
			/*if (_.isFunction(obj[name])) {
				console.log(obj, name);
				obj[name] = obj[name](app);
			}*/
			num++;
		}
	});

	console.log("auto loaded " + num + " modules in: " + dir);
	return obj;
}
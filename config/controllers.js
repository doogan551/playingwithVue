// Controllers setup
var autoloader = require('../helpers/loader');

exports = module.exports = function(app,controllers) {
    var dir,result;
    dir= __dirname+ '/../controllers/';
    return autoloader.load(app,controllers, dir);
};

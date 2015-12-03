var config, enumerator;
config = require('../public/js/lib/enumsTemplates');

enumerator = function(prop) {
  var enumResult = config.Enums[prop];
  if (!enumResult) {
    enumResult.errors = {
      notFound: []
    };
    enumResult = {};
    enumResult[prop] = {
      error: 'not found'
    };
    enumResult.errors.notFound.push(prop);
    enumResult.enums = config.Enums;
  }
  return enumResult;
};
module.exports = enumerator;
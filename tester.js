process.env.NODE_ENV = 'localhost';
var config = require('config');
var logger = require("./helpers/logger")(module);

var AU = require('./models/archiveutility');
var criteria = {
  statement: 'select * from History_201510'
};

AU.all(criteria, function(err, rows){
  logger.error(err);
  logger.debug(rows.length);
});
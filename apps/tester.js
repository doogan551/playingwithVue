var logger = require('../helpers/logger')(module);
while (true) {
  logger.info('NODE_ENV:' + process.env.NODE_ENV);
}
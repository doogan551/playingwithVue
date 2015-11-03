var localhost = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'files': {
      'driveLetter': 'C'
    }
  }
};

localhost.redisConfig = {
  host: localhost.Infoscan.dbConfig.host
};

module.exports = localhost;

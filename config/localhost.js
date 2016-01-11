var localhost = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'files': {
      'driveLetter': 'C'
    },
    'location': {
      'site': 'Rob'
    }
  }
};

localhost.redisConfig = {
  host: localhost.Infoscan.dbConfig.host
};

module.exports = localhost;
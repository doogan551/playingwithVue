var localhost = {
  'Infoscan': {
    'dbConfig': {
      'host': '192.168.1.88',
      'dbName': 'infoscan'
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
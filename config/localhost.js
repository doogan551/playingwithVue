var localhost = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'files': {
      'driveLetter': 'C'
    },
    'location': {
      'site': 'localhost'
    }
  },
  runNotifications: false,
  minifyFiles: false
};

localhost.redisConfig = {
  host: localhost.Infoscan.dbConfig.host
};

module.exports = localhost;
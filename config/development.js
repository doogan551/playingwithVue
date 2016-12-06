var development = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'infoscan'
    },
    'zmqConfig': {
      'server': '127.0.0.1'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'engineering development'
    },
    'email': {
      'onError': {
          'to': 'rkendall@dorsett-tech.com',
          'enabled': true
      }
    },
    'letsencrypt': {
      'enabled': false
    },
    'domains': ['']
  },
  runNotifications: false,
  minifyFiles: false
};

development.redisConfig = {
  host: development.Infoscan.dbConfig.host
};

module.exports = development;
var development = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'development'
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
  runNotifications: false
};

development.redisConfig = {
  host: development.Infoscan.dbConfig.host
};

module.exports = development;
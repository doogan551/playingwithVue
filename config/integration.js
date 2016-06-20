var integration = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'msfc'
    },
    'zmqConfig': {
      'server': '127.0.0.1'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'engineering integration'
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

integration.redisConfig = {
  host: integration.Infoscan.dbConfig.host
};

module.exports = integration;
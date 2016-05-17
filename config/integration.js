var integration = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'integration'
    },
    'zmqConfig': {
      'server': '127.0.0.1'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'engineering integration',
      'email': 'rkendall@dorsett-tech.com'
    },
    'letsencrypt': {
      'enabled': false
    },
    'domains': ['']
  },
  runNotifications: false
};

integration.redisConfig = {
  host: integration.Infoscan.dbConfig.host
};

module.exports = integration;
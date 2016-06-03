var staging = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'staging'
    },
    'zmqConfig': {
      'server': '127.0.0.1'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'engineering staging',
      'email': 'rkendall@dorsett-tech.com'
    },
    'letsencrypt': {
      'enabled': false
    },
    'domains': ['www.dorsett-tech.org', 'dorsett-tech.org']
  },
  runNotifications: false
};

staging.redisConfig = {
  host: staging.Infoscan.dbConfig.host
};

module.exports = staging;
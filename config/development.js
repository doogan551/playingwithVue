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
      'site': 'engineering development',
      'email': 'rkendall@dorsett-tech.com'
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
var utahdev = {
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
      'site': 'utahdev'
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

utahdev.redisConfig = {
  host: utahdev.Infoscan.dbConfig.host
};

module.exports = utahdev;
var msfc = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'msfc'
    },
    'zmqConfig': {
      'server': '127.0.0.1',
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'MSFC'
    },
    'email': {
      'onError': {
          'to': 'rkendall@dorsett-tech.com',
          'enabled': true
      }
    }
  },
  runNotifications: false
};

msfc.redisConfig = {
  host: msfc.Infoscan.dbConfig.host
};

module.exports = msfc;
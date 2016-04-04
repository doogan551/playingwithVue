var dorsett = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'zmqConfig': {
      'server': '127.0.0.1'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'Dorsett'
    },
    'email': {
      'onError': {
          'to': 'rkendall@dorsett-tech.com',
          'enabled': true
      }
    }
  }
};

dorsett.redisConfig = {
  host: dorsett.Infoscan.dbConfig.host
};

module.exports = dorsett;
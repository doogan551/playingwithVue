var dorsett = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'dorsett'
    },
    'zmqConfig': {
      'server': '127.0.0.1'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'Dorsett',
      'email': 'rkendall@dorsett-tech.com'

    }
  }
};

dorsett.redisConfig = {
  host: dorsett.Infoscan.dbConfig.host
};

module.exports = dorsett;
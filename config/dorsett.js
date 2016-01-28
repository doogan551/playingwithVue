var dorsett = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'zmqConfig': {
      'protocol': 'tcp',
      'server': '127.0.0.1',
      'port': '5570'
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
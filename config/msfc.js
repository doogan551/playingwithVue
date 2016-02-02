var msfc = {
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
      'site': 'MSFC',
      'email': 'rkendall@dorsett-tech.com'

    }
  }
};

msfc.redisConfig = {
  host: msfc.Infoscan.dbConfig.host
};

module.exports = msfc;
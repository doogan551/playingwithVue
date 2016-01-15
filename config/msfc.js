var msfc = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
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
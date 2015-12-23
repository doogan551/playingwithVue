var msfc = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'MSFC'
    }
  }
};

msfc.redisConfig = {
  host: msfc.Infoscan.dbConfig.host
};

module.exports = msfc;
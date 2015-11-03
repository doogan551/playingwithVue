var msfc = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'files': {
      'driveLetter': 'D'
    }
  }
};

msfc.redisConfig = {
  host: msfc.Infoscan.dbConfig.host
};

module.exports = msfc;
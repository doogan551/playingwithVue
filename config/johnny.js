var johnny = {
  'Infoscan': {
    'dbConfig': {
      'host': 'SCADA1-V',
      'dbName': 'infoscan'
    },
    'files': {
      'driveLetter': 'C'
    },
    'location': {
      'site': 'Johnny',
      'email': 'jroberts@dorsett-tech.com'
    }
  }
};

johnny.redisConfig = {
  host: johnny.Infoscan.dbConfig.host
};

module.exports = johnny;
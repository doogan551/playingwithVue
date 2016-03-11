var johnny = {
  'Infoscan': {
    'dbConfig': {
      'host': '192.168.1.88',
      'dbName': 'infoscan'
    },
    'files': {
      'driveLetter': 'C'
    },
    'location': {
      'site': 'Johnny',
      'email': 'jroberts@dorsett-tech.com'
    }
  },
  runNotifications: false
};

johnny.redisConfig = {
  host: johnny.Infoscan.dbConfig.host
};

module.exports = johnny;
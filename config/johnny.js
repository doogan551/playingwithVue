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
      'site': 'Johnny'
    },
    'email': {
      'onError': {
          'to': 'jroberts@dorsett-tech.com',
          'enabled': true
      }
    }
  },
  runNotifications: false,
  minifyFiles: false
};

johnny.redisConfig = {
  host: johnny.Infoscan.dbConfig.host
};

module.exports = johnny;
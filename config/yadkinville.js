var yadkinville = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'yadkinville'
    },
    'zmqConfig': {
      'server': '127.0.0.1'
    },
    'files': {
      'driveLetter': 'D'
    },
    'location': {
      'site': 'Yadkinville',
      'email': 'rkendall@dorsett-tech.com'
    },
    'letsencrypt': {
      'enabled': true,
      'domains': ['yadkinvillenc.dtscada.com']
    }
  }
};

yadkinville.redisConfig = {
  host: yadkinville.Infoscan.dbConfig.host
};

module.exports = yadkinville;
var yadkinville = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
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
      'domains': ['dorsett-tech.org', 'www.dorsett-tech.org']
    }
  }
};

yadkinville.redisConfig = {
  host: yadkinville.Infoscan.dbConfig.host
};

module.exports = yadkinville;
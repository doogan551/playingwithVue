var domains = ['yadkinvillenc.dtscada.com'];
var yadkinville = {
  'Infoscan': {
    'domains': domains,
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
      'site': 'Yadkinville'
    },
    'letsencrypt': {
      'enabled': true
    }
  }
};

yadkinville.redisConfig = {
  host: yadkinville.Infoscan.dbConfig.host
};

module.exports = yadkinville;
var yadkinville = {
  'Infoscan': {
    'domains': ['yadkinvillenc.dtscada.com'],
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
  },
  'SparkPost': {
    "smtpAuth": {
      'pass': 'f0dc741ba04fedf3d9073953f1dc390fab7b10c1'
    }
  },
};

yadkinville.redisConfig = {
  host: yadkinville.Infoscan.dbConfig.host
};

module.exports = yadkinville;
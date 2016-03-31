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
      'site': 'scada1-v',
      'email': 'rkendall@dorsett-tech.com'
    },
    'letsencrypt': {
      'enabled': true
    },
    'domains': ['dorsettnc.dtscada.com']
  },
  runNotifications: false
};

yadkinville.redisConfig = {
  host: yadkinville.Infoscan.dbConfig.host
};

module.exports = yadkinville;
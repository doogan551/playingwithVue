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
  'Twilio': {
    'accountSid': 'ACae97ec07240ba661fc64a70476edcc8f',
    'authToken': '91202b380c1adf45d9f0de63972e9e6c',
    'phoneNumbers': ['+18556887778', '+13367702223']
  },
  'SparkPost': {
    "smtpAuth": {
      'pass': 'f0dc741ba04fedf3d9073953f1dc390fab7b10c1'
    }
  }
};

yadkinville.redisConfig = {
  host: yadkinville.Infoscan.dbConfig.host
};

module.exports = yadkinville;
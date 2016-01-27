var rob = {
  'Infoscan': {
    'dbConfig': {
      'host': '192.168.1.88',
      'dbName': 'infoscan'
    },
    'zmqConfig': {
      'protocol': 'tcp',
      'server': '192.168.1.88',
      'port': '5570'
    },
    'files': {
      'driveLetter': 'C'
    },
    'location': {
      'site': 'Rob',
      'email': 'rkendall@dorsett-tech.com'
    }
  }
};

rob.redisConfig = {
  host: rob.Infoscan.dbConfig.host
};

module.exports = rob;
var rob = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'infoscan'
    },
    'zmqConfig': {
      'server': '192.168.1.88',
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

rob.Infoscan.files.firmwareLocation = "\\\\192.168.1.88/d$/InfoScan/Firmware/";

rob.redisConfig = {
  host: rob.Infoscan.dbConfig.host
};

module.exports = rob;
var rob = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'yadkinville'
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
    },
    'processes': {
      'zmqProcess': '',
      'smProcess': ''
    }
  },
    runNotifications: false
};

rob.Infoscan.files.firmwareLocation = "\\\\192.168.1.88/d$/InfoScan/Firmware/";
rob.Infoscan.processes.zmqProcess = rob.Infoscan.files.driveLetter + ":/InfoScan/Server/zmqServer.exe";
rob.Infoscan.processes.smProcess = rob.Infoscan.files.driveLetter + ":/InfoScan/Server/ServerMonitor.exe";

rob.redisConfig = {
  host: rob.Infoscan.dbConfig.host
};

module.exports = rob;
var morris = {
  'Infoscan': {
    'dbConfig': {
      'host': 'info-int',
      'dbName': 'infoscan'
    },
    'zmqConfig': {
      'server': 'info-int',
    },
    'files': {
      'driveLetter': 'C'
    },
    'location': {
      'site': 'morris'
    },
    'email': {
      'onError': {
        'to': 'rkendall@dorsett-tech.com',
        'enabled': false
      }
    },
    'processes': {
      'zmqProcess': '',
      'smProcess': ''
    }
  },
  runNotifications: false,
  minifyFiles: false
};

morris.Infoscan.files.firmwareLocation = "\\\\192.168.1.88/d$/InfoScan/Firmware/";
morris.Infoscan.processes.zmqProcess = morris.Infoscan.files.driveLetter + ":/InfoScan/Server/zmqServer.exe";
morris.Infoscan.processes.smProcess = morris.Infoscan.files.driveLetter + ":/InfoScan/Server/ServerMonitor.exe";

morris.redisConfig = {
  host: morris.Infoscan.dbConfig.host
};

module.exports = morris;
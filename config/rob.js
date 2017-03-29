var rob = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost',
      'dbName': 'hierarchy'
    },
    runNotifications: false,
    minifyFiles: false
};

rob.Infoscan.files.firmwareLocation = '\\\\192.168.1.88/d$/InfoScan/Firmware/';
rob.Infoscan.processes.zmqProcess = rob.Infoscan.files.driveLetter + ':/InfoScan/Server/zmqServer.exe';
rob.Infoscan.processes.smProcess = rob.Infoscan.files.driveLetter + ':/InfoScan/Server/ServerMonitor.exe';

rob.redisConfig = {
    host: rob.Infoscan.dbConfig.host
};

module.exports = rob;

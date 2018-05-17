var rob = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost',
            'dbName': 'pre'
        },
        'zmqConfig': {
            'server': 'info-int'
        },
        'files': {
            'driveLetter': 'C'
        },
        'location': {
            'site': 'Rob'
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

rob.Infoscan.files.firmwareLocation = '\\\\info-int/d$/InfoScan/Firmware/';
rob.Infoscan.processes.zmqProcess = rob.Infoscan.files.driveLetter + ':/InfoScan/Server/zmqServer.exe';
rob.Infoscan.processes.smProcess = rob.Infoscan.files.driveLetter + ':/InfoScan/Server/ServerMonitor.exe';

rob.redisConfig = {
    host: rob.Infoscan.dbConfig.host
};

module.exports = rob;

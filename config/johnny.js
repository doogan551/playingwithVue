var driveLetter = 'C';
var host = 'info-int';

var johnny = {
    'Infoscan': {
        'dbConfig': {
            'host': host,
            'dbName': 'infoscan'
        },
        'zmqConfig': {
            'server': 'info-int'
        },
        'processes': {
            'zmqProcess': driveLetter + ':/InfoScan/Server/zmqServer.exe',
            'smProcess': driveLetter + ':/InfoScan/Server/ServerMonitor.exe'
        },
        'redisConfig': {
            'host': host
        },
        'files': {
            'driveLetter': driveLetter
        },
        'location': {
            'site': 'Johnny'
        },
        'email': {
            'onError': {
                'to': 'jroberts@dorsett-tech.com',
                'enabled': true
            }
        }
    },
    runNotifications: false,
    minifyFiles: false
};

module.exports = johnny;
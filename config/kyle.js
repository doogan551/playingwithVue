var driveLetter = 'C';
var host = 'localhost';

var kyle = {
    'Infoscan': {
        'dbConfig': {
            'host': host,
            'dbName': 'infoscan'
        },
        'redisConfig': {
            'host': host
        },
        'files': {
            'driveLetter': driveLetter
        },
        'location': {
            'site': 'Kyle'
        },
        'email': {
            'onError': {
                'to': 'karmstrong@dorsett-tech.com',
                'enabled': true
            }
        }
    },
    runNotifications: false,
    minifyFiles: false
};

kyle.redisConfig = {
    host: kyle.Infoscan.dbConfig.host
};

module.exports = kyle;

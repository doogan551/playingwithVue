var driveLetter = 'C';
var host = 'localhost';

var johnny = {
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
var stephen = {
    'Infoscan': {
        'dbConfig': {
            'host': '192.168.1.88',
            // 'host': '127.0.0.1',
            'dbName': 'infoscan'
        },
        'files': {
            'driveLetter': 'C'
        },
        'location': {
            'site': 'Stephen'
        },
        'email': {
            'onError': {
                'to': 'strent@dorsett-tech.com',
                'enabled': true
            }
        }
    },
    runNotifications: false
    // minifyFiles: false
};

stephen.redisConfig = {
    host: stephen.Infoscan.dbConfig.host
};

module.exports = stephen;
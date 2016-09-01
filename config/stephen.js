var stephen = {
    'Infoscan': {
        'dbConfig': {
            'host': 'info-int',
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
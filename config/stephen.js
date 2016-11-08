var stephen = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost',
            'dbName': 'yadkinville'
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
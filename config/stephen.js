var stephen = {
    'Infoscan': {
        'dbConfig': {
            'host': '192.168.1.88'
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
};

stephen.redisConfig = {
    host: stephen.Infoscan.dbConfig.host
};

module.exports = stephen;
var int2 = {
    'Infoscan': {
        'dbConfig': {
            'host': '127.0.0.1',
            'dbName': 'infoscan'
        },
        'zmqConfig': {
            'server': '127.0.0.1'
        },
        'files': {
            'driveLetter': 'D'
        },
        'location': {
            'site': 'int2'
        },
        'email': {
            'onError': {
                'to': 'engineering@dorsett-tech.com',
                'enabled': true
            }
        },
        'letsencrypt': {
            'enabled': true
        },
        'domains': ['int2.dtscada.com']
    },
    runNotifications: false,
    minifyFiles: false
};

int2.redisConfig = {
    host: int2.Infoscan.dbConfig.host
};

module.exports = int2;

var int1 = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost',
            'dbName': 'infoscan'
        },
        'zmqConfig': {
            'server': '127.0.0.1'
        },
        'files': {
            'driveLetter': 'D'
        },
        'location': {
            'site': 'int1'
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
        'domains': ['int1.dtscada.com']
    },
    runNotifications: false,
    minifyFiles: false
};

int1.redisConfig = {
    host: int1.Infoscan.dbConfig.host
};

module.exports = int1;

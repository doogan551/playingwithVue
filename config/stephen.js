var stephen = {
    'Infoscan': {
        'dbConfig': {
            'host': '192.168.1.88'
        },
        'files': {
            'driveLetter': 'C'
        },
        'location': {
            'email': 'strent@dorsett-tech.com'
        }
    },
    runNotifications: false
};

stephen.redisConfig = {
    host: stephen.Infoscan.dbConfig.host
};

module.exports = stephen;
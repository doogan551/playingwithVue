var jeff = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost',
            'dbName': 'infoscan'
        },
        'files': {
            'driveLetter': 'C'
        },
        'location': {
            'site': 'Jeff'
        },
        'email': {
            'onError': {
                'to': 'jshore@dorsett-tech.com',
                'enabled': true
            }
        }
    },
    runNotifications: false
};

jeff.redisConfig = {
    host: jeff.Infoscan.dbConfig.host
};

module.exports = jeff;
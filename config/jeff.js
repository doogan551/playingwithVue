var jeff = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost',
            'port': 27017,
            'dbName': 'yadkinville',
            'driver': 'mongodb'
        },
        'files': {
            'driveLetter': 'c',
            'archiveLocation': '/InfoScan/Archive/History/'
        },
        'location': {
            'site': 'jeff',
            'email': null,
            'timezone': 5
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
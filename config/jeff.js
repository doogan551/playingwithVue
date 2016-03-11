var jeff = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost'
        },
        'files': {
            'driveLetter': 'C'
        },
        'location': {
            'site': 'Jeff',
            'email': 'jshore@dorsett-tech.com'
        }
    },
    runNotifications: false
};

jeff.redisConfig = {
    host: jeff.Infoscan.dbConfig.host
};

module.exports = jeff;
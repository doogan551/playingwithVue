var localhost = {
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
    }
};

localhost.redisConfig = {
    host: localhost.Infoscan.dbConfig.host
};

module.exports = localhost;
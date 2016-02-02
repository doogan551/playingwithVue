var stephen = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost'
        },
        'files': {
            'driveLetter': 'C'
        },
        'location': {
            'email': 'strent@dorsett-tech.com'
        }
    }
};

stephen.redisConfig = {
    host: stephen.Infoscan.dbConfig.host
};

module.exports = stephen;
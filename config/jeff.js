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
    }
};

jeff.redisConfig = {
    host: jeff.Infoscan.dbConfig.host
};

module.exports = jeff;
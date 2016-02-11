var jeff = {
    'Infoscan': {
        'dbConfig': {
            'host': '192.168.1.88'
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
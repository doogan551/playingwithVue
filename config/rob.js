var rob = {
    'Infoscan': {
        'dbConfig': {
            'host': 'localhost'
        },
        'files': {
            'driveLetter': 'C'
        },
        'location': {
            'site': 'Rob',
            'email': 'rkendall@dorsett-tech.com'
        }
    }
};

rob.redisConfig = {
    host: rob.Infoscan.dbConfig.host
};

module.exports = rob;
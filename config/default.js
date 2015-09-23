var defaults = {
    'Infoscan': {
        'dbConfig': {
            'host': '192.168.1.88',
            'port': 27017,
            'dbName': 'infoscan',
            'driver': 'mongodb'
        },
        'siteConfig': {
            'port': 80,
            siteTitle: 'Info Scan',
            appname: 'infoscan'
        }
    }
};

defaults.redisConfig = {
    host: defaults.Infoscan.dbConfig.host,
    port: 6379
};

module.exports = defaults;

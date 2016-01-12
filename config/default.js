var defaults = {
    'Infoscan': {
        'dbConfig': {
            'host': '192.168.1.88',
            'port': 27017,
            'dbName': 'infoscan',
            'driver': 'mongodb'
        },
        'zmqConfig':{
            'protocol': 'tcp',
            'server': '127.0.0.1',
            'port': '5570'
        },
        'siteConfig': {
            'port': 80,
            'siteTitle': 'Info Scan',
            'appname': 'infoscan'
        },
        'socketConfig': {
            'ioPort': 8085,
            'tcpPort': 5002,
            'tcpAddress': '127.0.0.1',
            'oplogDb': 'local'
        },
        'files': {
            'driveLetter': 'D',
            'archiveLocation': '/InfoScan/Archive/History/'
        },
        'location': {
            'site' : 'Dorsett',
            'email': 'rkendall@dorsett-tech.com'
        }
    }
};

defaults.redisConfig = {
    host: defaults.Infoscan.dbConfig.host,
    port: 6379
};

module.exports = defaults;
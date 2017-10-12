var stephen = {
    Infoscan: {
        dbConfig: {
            host: 'localhost',
            dbName: 'infoscan'
        },
        zmqConfig: {
            server: 'info-int'
        },
        files: {
            driveLetter: 'C'
        },
        location: {
            site: 'Stephen'
        },
        email: {
            onError: {
                to: 'strent@dorsett-tech.com',
                enabled: true
            }
        }
    },
    redisConfig: {
        host: 'localhost'
    },
    runNotifications: false
    // minifyFiles: false
};

module.exports = stephen;
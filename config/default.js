var defaults = {
    'Infoscan': {
        'domains': ['dorsettnc.dtscada.com'],
        'dbConfig': {
            'host': '192.168.1.88',
            'port': 27017,
            'dbName': 'development',
            'driver': 'mongodb'
        },
        'zmqConfig': {
            'protocol': 'tcp',
            'server': '192.168.1.88',
            'port': '5570'
        },
        'siteConfig': {
            'port': 80,
            'siteTitle': 'Info Scan',
            'appname': 'infoscan',
            'inboundId': 'moclx0qr65a3'// Must update 3rd party services utilizing our inbound if we change this
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
            'site': 'Dorsett',
            'email': null,
            'timezone': 5
        },
        'email': {
            'onError': {
                'to': 'engineering@dorsett-tech.com',
                'enabled': true
            },
            'accounts': {
                'default': 'infoscan', // Local/user part of email address; domain is appended in mailer.js
                'alarms': 'alarms'
            }
        },
        'letsencrypt': {
            'directory': '/letsencrypt/etc',
            'enabled': false
        },
        'processes': {
            'zmqProcess': '',
            'smProcess': ''
        }
    },
    'Twilio': {
        'accountSid': 'ACc4b5dfa06be0935819e752674222e02b',
        'authToken': '7318295319a25ce15b05c57d13909d0c',
        'phoneNumbers': ['+13362213360'],
        'voice': {
            'alarms': {                                         // Alarms application
                'Url': '/twilio/voiceAlarmsAnswer',             // All urls prefixed with the domain & inboundId by notifierUtility.js
                'StatusCallback': '/twilio/voiceAlarmsStatus',  // A relative path keeps these urls valid for all customers
                'StatusCallbackEvent': ['ringing', 'answered', 'completed'],
                'IfMachine': 'Continue',
                'Method': 'POST'
            }
        }
    },
    'Plivo': {
        'authId': 'MAOTAYY2RKNJU5MMQWZT',
        'authToken': 'NmFkN2M0MWVjYjI4YTQ2ZmZkMDVkOTRiNGI5ODA4',
        'phoneNumber': '16623384486'
    },
    'SparkPost': {
        'smtpAuth': {
            'user': 'SMTP_Injection',
            'pass': 'f72bbcb40e28f4387831edaa35afab90caa66d01'
        }
    },
    runNotifications: true,
    minifyFiles: true
};

defaults.Infoscan.files.firmwareLocation = defaults.Infoscan.files.driveLetter + ':/InfoScan/Firmware/';
defaults.Infoscan.processes.zmqProcess = defaults.Infoscan.files.driveLetter + ':/InfoScan/Server/zmqServer.exe';
defaults.Infoscan.processes.smProcess = defaults.Infoscan.files.driveLetter + ':/InfoScan/Server/ServerMonitor.exe';

defaults.redisConfig = {
    host: defaults.Infoscan.dbConfig.host,
    port: 6379
};

module.exports = defaults;

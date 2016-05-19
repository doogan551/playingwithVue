var domain = 'dorsettnc.dtscada.com';
var defaults = {
    'Infoscan': {
        'domains': [domain],
        'dbConfig': {
            'host': '192.168.1.88',
            'port': 27017,
            'dbName': 'infoscan',
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
                'default': 'infoscan@' + domain,
                'alarms': 'alarms@' + domain
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
        'accountSid': 'AC0fc63c36f70cccee175fc2427d8ec2be',
        'authToken': '4da6ed7c8aee56285e2b25b8441a6d39',
        'phoneNumbers': ['+18556887778', '+13367702223']
    },
    'Plivo': {
        'authId': 'MAOTAYY2RKNJU5MMQWZT',
        'authToken': 'NmFkN2M0MWVjYjI4YTQ2ZmZkMDVkOTRiNGI5ODA4',
        'phoneNumber': '16623384486'
    },
    'SparkPost': {
        "smtpAuth": {
            'user': "SMTP_Injection",
            'pass': 'f72bbcb40e28f4387831edaa35afab90caa66d01'
        }
    },
    runNotifications: true
};

defaults.Infoscan.files.firmwareLocation = defaults.Infoscan.files.driveLetter + ":/InfoScan/Firmware/";
defaults.Infoscan.processes.zmqProcess = defaults.Infoscan.files.driveLetter + ":/InfoScan/Server/zmqServer.exe";
defaults.Infoscan.processes.smProcess = defaults.Infoscan.files.driveLetter + ":/InfoScan/Server/ServerMonitor.exe";

defaults.redisConfig = {
    host: defaults.Infoscan.dbConfig.host,
    port: 6379
};

module.exports = defaults;
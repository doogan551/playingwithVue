var localhost = {
  'Infoscan': {
    'dbConfig': {
      'host': 'localhost'
    },
    'siteConfig': {
      'port': 3030
    }
  }
};

localhost.redisConfig = {
  host: localhost.Infoscan.dbConfig.host
};

module.exports = localhost;

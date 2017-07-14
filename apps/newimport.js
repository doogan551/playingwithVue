process.setMaxListeners(0);
var config = require('config');
var logger = require('../helpers/logger')(module);
var dbModel = require('../helpers/db');
var Import = require('../models/import');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

var importProcess = new Import();

var commandLineArgs = require('command-line-args');

var cli = commandLineArgs([{
    name: 'default',
    alias: 'd',
    type: Boolean,
    defaultOption: true,
    defaultValue: true
}, {
    name: 'gpl',
    alias: 'g',
    type: String
}, {
    name: 'updategpl',
    alias: 'u',
    type: Boolean
}, {
    name: 'history',
    alias: 'h',
    type: Boolean
}, {
    name: 'inner',
    alias: 'i',
    type: Boolean
}, {
    name: 'thumbs',
    alias: 't',
    type: Boolean
}, {
    name: 'nothumbs',
    alias: 'n',
    type: Boolean
}, {
    name: 'test',
    alias: 'x',
    type: Boolean
}]);

var options = cli.parse();

dbModel.connect(connectionString.join(''), (err) => {
    if (!!options.default) {
        logger.info('default');
        importProcess.start();
    } else if (!!options.gpl) {
        this.doGplImport(() => {
            logger.info('done with doGplImport');
        });
    } else if (!!options.updategpl) {
        this.updateGPLRefs((err) => {
            logger.info('updateGPLRefs', err);
        });
    } else if (!!options.history) {
        this.updateHistory((err) => {
            logger.info('updateHistory', err);
        });
    } else if (!!options.inner) {
        this.innerLoop(false, (err) => {
            logger.info('innerLoop', err);
        });
    } else if (!!options.thumbs) {
        logger.info('flag not established');
    } else if (!!options.nothumbs) {
        logger.info('flag not established');
    } else if (!!options.test) {
        logger.info('flag not established');
    } else {
        throw new Error('No valid arguments passed');
    }
});

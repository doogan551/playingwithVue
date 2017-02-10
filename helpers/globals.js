var System = new(require('../models/system'))();
let Alarm = new(require('../models/alarm'))();

module.exports = {
    setGlobals: function (cb) {
        System.getQualityCodes({}, function (err, codes) {
            global.qualityCodes = codes.Entries;
            return cb();
        });
    }
};

(function loop() {
    setTimeout(function () {
        // logger.info('@@@@@@@ Server still active');
        Alarm.autoAcknowledgeAlarms(function () {
            loop();
        });
    }, 5 * 60 * 10000);
}());

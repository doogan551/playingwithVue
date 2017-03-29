let express = require('express');
let router = express.Router();
let config = require('../public/js/lib/config.js');
let options = {
    modes: ['nav', 'select', 'filter', 'perm']
};
// Checked
router.get('/', function (req, res) {
    let mode = options.modes.getMode(req.query.mode);
    res.locals = {
        mode: JSON.stringify(mode),
        modes: JSON.stringify(options.modes),
        point: '{}',
        pointType: JSON.stringify(null),
        pointtypes: JSON.stringify(config.Utility.pointTypes.getAllowedPointTypes()),
        groupId: JSON.stringify(null),
        deviceId: JSON.stringify(null),
        remoteUnitId: JSON.stringify(null)
    };

    res.render('pointlookup/default');
});
// NOT CHECKED
router.get('/security/:groupid', function (req, res) {
    let mode = options.modes.getMode('perm');

    res.locals = {
        mode: JSON.stringify(mode),
        modes: JSON.stringify(options.modes),
        point: '{}',
        pointType: JSON.stringify(null),
        pointtypes: JSON.stringify(config.Utility.pointTypes.getAllowedPointTypes()),
        groupId: JSON.stringify(req.params.groupid),
        deviceId: JSON.stringify(null),
        remoteUnitId: JSON.stringify(null)
    };
    res.render('pointlookup/default');
});
// Checked
router.get('/:pointType/:property', function (req, res) {
    let mode = options.modes.getMode(req.query.mode),
        property = req.params.property && decodeURI(req.params.property),
        pointType = (req.params.pointType && req.params.pointType !== 'null' && decodeURI(req.params.pointType)) || undefined,
        pointTypes = config.Utility.pointTypes.getAllowedPointTypes(property, pointType),
        deviceId = req.params.deviceId || null,
        remoteUnitId = req.params.remoteUnitId || null;

    res.locals = {
        mode: JSON.stringify(mode),
        modes: JSON.stringify(options.modes),
        point: '{}',
        pointType: JSON.stringify(pointType),
        pointtypes: JSON.stringify(pointTypes),
        groupId: JSON.stringify(null),
        deviceId: JSON.stringify(deviceId),
        remoteUnitId: JSON.stringify(remoteUnitId)
    };
    res.render('pointlookup/default');
});
// Checked
router.get('/:pointType/:property/:deviceId', function (req, res) {
    let mode = options.modes.getMode(req.query.mode),
        property = req.params.property && decodeURI(req.params.property),
        pointType = (req.params.pointType && req.params.pointType !== 'null' && decodeURI(req.params.pointType)) || undefined,
        pointTypes = config.Utility.pointTypes.getAllowedPointTypes(property, pointType),
        deviceId = req.params.deviceId || null,
        remoteUnitId = req.params.remoteUnitId || null;

    res.locals = {
        mode: JSON.stringify(mode),
        modes: JSON.stringify(options.modes),
        point: '{}',
        pointType: JSON.stringify(pointType),
        pointtypes: JSON.stringify(pointTypes),
        groupId: JSON.stringify(null),
        deviceId: JSON.stringify(deviceId),
        remoteUnitId: JSON.stringify(remoteUnitId)
    };
    res.render('pointlookup/default');
});
// NOT CHECKED
router.get('/:pointType/:property/:deviceId/:remoteUnitId', function (req, res) {
    let mode = options.modes.getMode(req.query.mode),
        property = req.params.property && decodeURI(req.params.property),
        pointType = (req.params.pointType && req.params.pointType !== 'null' && decodeURI(req.params.pointType)) || undefined,
        pointTypes = config.Utility.pointTypes.getAllowedPointTypes(property, pointType),
        deviceId = req.params.deviceId || null,
        remoteUnitId = req.params.remoteUnitId || null;

    res.locals = {
        mode: JSON.stringify(mode),
        modes: JSON.stringify(options.modes),
        point: '{}',
        pointType: JSON.stringify(pointType),
        pointtypes: JSON.stringify(pointTypes),
        groupId: JSON.stringify(null),
        deviceId: JSON.stringify(deviceId),
        remoteUnitId: JSON.stringify(remoteUnitId)
    };
    res.render('pointlookup/default');
});

options.modes.getMode = function (mode) {
    let index = options.modes.indexOf(mode);
    index = !!~index ? index : 0;
    return options.modes[index];
};

module.exports = router;

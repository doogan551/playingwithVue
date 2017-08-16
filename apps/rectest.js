const async = require('async');
const db = require('../helpers/db');
const Utility = require('../models/utility');
// const Config = require('../public/js/lib/config.js');
const config = require('config');

const dbConfig = config.get('Infoscan.dbConfig');
const connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let runEqpTest = () => {
    const MechTemplate = require('../models/mechanical/mechanical');
    let mechTemplate = new MechTemplate('Air Handling');
    let vav1 = mechTemplate.build('Equipment', 'VAV');

    let vavSpace = vav1.build('Category', 'Space');
    let vavSpaceTemp = vavSpace.build('Equipment', 'Temperature');
    let vavSpaceLights = vavSpace.build('Equipment', 'Lights');

    let vavSpaceTempSensor = vavSpaceTemp.build('Instrumentation', 'Sensor');
    let vavSpaceLightsControl = vavSpaceLights.build('Instrumentation', 'Control');
    let vavSpaceOcc = vavSpace.build('Instrumentation', 'Occupancy');

    let vavSupplyAir = vav1.build('Category', 'Supply Air');
    let vavSupplyAirCFM = vavSupplyAir.build('Category', 'CFM');
    let vavSupplyAirTemp = vavSupplyAir.build('Equipment', 'Temperature');
    let vavSupplyAirDamper = vavSupplyAir.build('Equipment', 'Damper');
    let vavSupplyAirFan = vavSupplyAir.build('Equipment', 'Fan');

    let vavSupplyAirTempSensor = vavSupplyAirTemp.build('Instrumentation', 'Sensor');
    let vavSupplyAirDamperControl = vavSupplyAirDamper.build('Instrumentation', 'Control');
    let vavSupplyAirFanControl = vavSupplyAirFan.build('Instrumentation', 'Control');
    let vavDigHeat = vav1.build('Equipment', 'Digital Heat');
    let vavDigHeatControl1 = vavDigHeat.build('Instrumentation', 'Control');
    let vavDigHeatControl2 = vavDigHeat.build('Instrumentation', 'Control');
    let vavDigHeatControl3 = vavDigHeat.build('Instrumentation', 'Control');
    let vavSourceAir = vav1.build('Category', 'Source Air');
    let vavSourceAirTemp = vavSourceAir.build('Equipment', 'Temperature');
    let vavSourceAirTempSensor = vavSourceAirTemp.build('Instrumentation', 'Sensor');
    let vavHotWater = vav1.build('Category', 'Source Air');
    let vavHotWaterTemp = vavHotWater.build('Equipment', 'Temperature');
    let vavHotWaterTempSensor = vavHotWaterTemp.build('Instrumentation', 'Sensor');

    iterateEquip(mechTemplate);
    // mechTemplate.save();

    console.log('done');
};

let runAutoVAV = () => {
    const MechTemplate = require('../models/mechanical/mechanical');
    let mechTemplate = new MechTemplate('Air Handling');
    let vav1 = mechTemplate.build('Equipment', 'VAV');

    buildChildren(vav1);
    // iterateEquip(mechTemplate);
    mechTemplate.save((err) => {
        console.log('done');
    });
};

let buildChildren = (mech) => {
    for (var prop in mech.options) {
        for (var item in mech.options[prop]) {
            let newMech = mech.build(prop, item);
            buildChildren(newMech);
        }
    }
};

let iterateEquip = (model, spacing = '-') => {
    console.log(`${spacing}${model.getName()} [${model.type.substring(0, 1)}]`);
    if (model.hasOwnProperty('hierarchy')) {
        model.hierarchy.forEach((item) => {
            iterateEquip(item, spacing + '-');
        });
    }
};

let test = () => {
    let ImportApp = require('../models/import');
    let importApp = new ImportApp();
    importApp.fixToUUtil((err) => {
        console.log('done');
    });
    // let System = require('../models/system');
    // let Point = require('../models/point');
    // let systemModel = new System();
    // let pointModel = new Point();

    // systemModel.getOne({
    //     query: {
    //         Name: 'Weather'
    //     }
    // }, (err, weather) => {
    //     async.eachOfSeries(weather, (value, prop, callback) => {
    //         if (typeof value === 'number') {
    //             pointModel.getOne({
    //                 query: {
    //                     _oldUpi: value
    //                 }
    //             }, (err, refPoint) => {
    //                 weather[prop] = (!!refPoint) ? refPoint._id : 0;
    //                 callback(err);
    //             });
    //         } else {
    //             return callback();
    //         }
    //     }, (err) => {
    //         systemModel.update({
    //             query: {
    //                 Name: 'Weather'
    //             },
    //             updateObj: weather
    //         }, (err) => {
    //             console.log('err', err);
    //         });
    //     });
    // });
};

db.connect(connectionString.join(''), function (err) {
    // runEqpTest();
    // runAutoVAV();
    test();
    // class Test {
    //     tester() {
    //         this.run();
    //     }
    //     // run() {}
    // }

    // class Blah extends Test {
    //     constructor() {
    //         super();
    //     }

    //     run() {
    //         console.log('run');
    //     }
    // }

    // let blah = new Blah();
    // blah.tester();
});

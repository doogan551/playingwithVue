// const async = require('async');
// const db = require('../helpers/db');
// const Utility = require('../models/utility');
// const Config = require('../public/js/lib/config.js');
// const config = require('config');

// const dbConfig = config.get('Infoscan.dbConfig');
// const connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let runTest = () => {
    const MechTemplate = require('../models/mechanical/mechanical');
    let mechTemplate = new MechTemplate('Air Handling');
    // console.log('options', mechTemplate.options);
    // console.log('*****');
    let vav1 = mechTemplate.build('Equipment', 'VAV');
    // console.log('mech after VAV');
    // iterateEquip(mechTemplate);
    console.log('*****');
    console.log('options', vav1.options);
    let vavSpace = vav1.build('Category', 'Space');
    // console.log('mech after Space');
    // iterateEquip(mechTemplate);
    let vavSpaceTemp = vavSpace.build('Equipment', 'Temperature');
    let vavSpaceLights = vavSpace.build('Equipment', 'Lights');

    let vavSpaceTempSensor = vavSpaceTemp.build('Instrumentation', 'Sensor');
    let vavSpaceLightsControl = vavSpaceLights.build('Instrumentation', 'Control');
    let vavSpaceOcc = vavSpace.build('Instrumentation', 'Occupancy');

    console.log('*****');
    let vavSupplyAir = vav1.build('Category', 'Supply Air');
    let vavSupplyAirCFM = vavSupplyAir.build('Category', 'CFM');
    let vavSupplyAirTemp = vavSupplyAir.build('Equipment', 'Temperature');
    let vavSupplyAirDamper = vavSupplyAir.build('Equipment', 'Damper');
    let vavSupplyAirFan = vavSupplyAir.build('Equipment', 'Fan');

    let vavSupplyAirTempSensor = vavSupplyAirTemp.build('Instrumentation', 'Sensor');
    let vavSupplyAirDamperControl = vavSupplyAirDamper.build('Instrumentation', 'Control');
    let vavSupplyAirFanControl = vavSupplyAirFan.build('Instrumentation', 'Control');
    console.log('*****');
    let vavDigHeat = vav1.build('Equipment', 'Digital Heat');
    let vavDigHeatControl1 = vavDigHeat.build('Instrumentation', 'Control');
    let vavDigHeatControl2 = vavDigHeat.build('Instrumentation', 'Control');
    let vavDigHeatControl3 = vavDigHeat.build('Instrumentation', 'Control');
    console.log('*****');
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

let iterateEquip = (model, spacing = '-') => {
    console.log(`${spacing}${model.constructor.name} [${model.type.substring(0, 1)}]`);
    if (model.hasOwnProperty('equipment')) {
        model.equipment.forEach((equip) => {
            iterateEquip(equip, spacing + '-');
        });
    }
};

runTest();

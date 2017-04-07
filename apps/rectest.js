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
    console.log('options', mechTemplate.options);
    // console.log('*****');
    let vav1 = mechTemplate.build('Equipment', 'VAV');
    // console.log('mech after VAV');
    // iterateEquip(mechTemplate);
    console.log('*****');
    console.log('options', vav1.options);
    let vavSpace = vav1.build('Category', 'Space');
    let vavFan = vav1.build('Equipment', 'Fan');
    // console.log('mech after Space');
    // iterateEquip(mechTemplate);
    console.log('*****');
    console.log('options', vavSpace.options);
    let vavSpaceTemp = vavSpace.build('Instrumentation', 'Temperature');
    let vavSpaceLights = vavSpace.build('Instrumentation', 'Lights');
    let vavFanControl = vavFan.build('Instrumentation', 'Control');
    console.log('mech after space temp', vavSpaceLights.getAllParentNames());
    iterateEquip(mechTemplate);
    console.log('*****');
    mechTemplate.save();


    console.log('done');
};

let iterateEquip = (model, spacing = '-') => {
    console.log(`${spacing}${model.type} ${model.constructor.name}`);
    if (model.hasOwnProperty('equipment')) {
        model.equipment.forEach((equip) => {
            iterateEquip(equip, spacing + '-');
        });
    }
};

runTest();

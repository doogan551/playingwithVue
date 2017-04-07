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
    console.log(mechTemplate.getOptions());
    console.log('-----');
    let vav1 = mechTemplate.build('VAV');
    console.log(mechTemplate);
    console.log(vav1);
    console.log(vav1.getOptions());
    let vavSpace = vav1.build('Space');
    console.log('-----');
    // console.log(vav1.getOptions());
    // let space = vav1.build('Space');
    // console.log(mechTemplate);
    // console.log(space);


    // iterateEquip(vavModel);
    // let vavModel2 = new mechTemplate.VAV('Cooling');
    // iterateEquip(vavModel2);
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

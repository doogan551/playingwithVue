// Modular pieces
let equipment = [{
    _id: 1,
    name: 'VAV',
    template: false,
    type: 'Equipment',
    systemTags: '/VAV;Equipment'
}, {
    _id: 2,
    name: 'Fan',
    template: false,
    type: 'Equipment',
    systemTags: '/Fan;Equipment'
}];
let categories = [{
    _id: 3,
    name: 'Space',
    template: false,
    type: 'Category',
    systemTags: 'Space/;'
}, {
    _id: 4,
    name: 'Supply',
    template: false,
    type: 'Category',
    systemTags: 'Supply/;'
}, {
    _id: 5,
    name: 'Air',
    template: false,
    type: 'Category',
    systemTags: 'Air/;'
}];
let endPoints = [{
    _id: 6,
    name: 'Temperature',
    template: false,
    type: 'End Point',
    systemTags: '/Temperature;Sensor'
}, {
    _id: 7,
    name: 'Humidity',
    template: false,
    type: 'End Point',
    systemTags: '/Humidity;Sensor'
}, {
    _id: 8,
    name: 'CO2',
    template: false,
    type: 'End Point',
    systemTags: '/CO2;Sensor'
}, {
    _id: 9,
    name: 'Flow',
    template: false,
    type: 'End Point',
    systemTags: '/Flow;Sensor'
}, {
    _id: 10,
    name: 'Status',
    template: false,
    type: 'End Point',
    systemTags: '/Status;Sensor'
}, {
    _id: 11,
    name: 'Command',
    template: false,
    type: 'End Point',
    systemTags: '/Command;Control'
}];

///////////////////////////////////////////////////////////////////////////////
//#############################################################################
//########################TEMPLATES############################################
//#############################################################################
//#############################################################################
///////////////////////////////////////////////////////////////////////////////
let templates = [{
    _id: 12,
    name: 'Temperature (Space)',
    display: 'SPT',
    template: true,
    type: 'End Point',
    systemTags: 'Space,Air/Temperature;Sensor'
}, {
    _id: 13,
    name: 'Temperature (Supply Air)',
    display: 'SAT',
    template: true,
    type: 'End Point',
    systemTags: 'Supply,Air/Temperature;Sensor'
}, {
    _id: 14,
    name: 'Supply Air',
    display: '',
    template: true,
    type: 'Category',
    systemTags: 'Supply,Air/;'
}, {
    _id: 15,
    name: 'Fan', // decide how to display binary/analog combo in name
    display: '',
    template: true,
    type: 'Equipment',
    systemTags: '/Fan;Equipment',
    children: [{ // do we store _ids for reference or copy object as is at the time and never update
        _id: 10,
        name: 'Status',
        display: '',
        template: false,
        type: 'End Point',
        systemTags: '/Status;Sensor'
    }, {
        _id: 11,
        name: 'Command',
        display: '',
        template: false,
        type: 'End Point',
        systemTags: '/Command;Control'
    }]
}, {
    _id: 16,
    name: 'Main VAV',
    display: 'VAV',
    template: true,
    type: 'Equipment',
    systemTags: '/VAV;Equipment',
    children: [{
        _id: 3,
        name: 'Space',
        template: false,
        type: 'Category',
        systemTags: 'Space/;',
        children: [{
            _id: 12,
            name: 'Temperature (Space)',
            display: 'SPT',
            template: true,
            type: 'End Point',
            systemTags: 'Space,Air/Temperature;Sensor'
        }, {
            _id: 7,
            name: 'Humidity',
            template: false,
            type: 'End Point',
            systemTags: 'Space/Humidity;Sensor'
        }, {
            _id: 8,
            name: 'CO2',
            template: false,
            type: 'End Point',
            systemTags: 'Space/CO2;Sensor'
        }]
    }, {
        _id: 14,
        name: 'Supply Air',
        display: '',
        template: true,
        type: 'Category',
        systemTags: 'Supply,Air/;',
        children: [{
            _id: 13,
            name: 'Temperature (Supply Air)',
            display: 'SAT',
            template: true,
            type: 'End Point',
            systemTags: 'Supply,Air/Temperature;Sensor'
        }, {
            _id: 9,
            name: 'Flow',
            template: false,
            type: 'End Point',
            systemTags: 'Supply,Air/Flow;Sensor'
        }]
    }, {
        _id: 15,
        name: 'Fan',
        display: '',
        template: true,
        type: 'Equipment',
        systemTags: '/Fan;Equipment',
        children: [{
            _id: 10,
            name: 'Status',
            display: '',
            template: false,
            type: 'End Point',
            systemTags: '/Status;Sensor'
        }, {
            _id: 11,
            name: 'Command',
            display: '',
            template: false,
            type: 'End Point',
            systemTags: '/Command;Control'
        }]
    }]
}];

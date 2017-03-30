const Sequelize = require('sequelize');
let sequelize = new Sequelize('test', 'postgres', 'FaciLLimus$58', {
    host: 'localhost',
    dialect: 'postgres',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    define: {
        timestamps: false
    }
});

var Location = sequelize.define('location', {
    display: {
        type: Sequelize.STRING
    }
});
Location.sync({
    force: true
}).then(function () {
    // Table created
    return Location.create({
        display: '4200'
    });
}).then(function () {
    Location.findAll().then(function (locations) {
        console.log(locations);
    });
});

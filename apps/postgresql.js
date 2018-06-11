const async = require('async');
const _ = require('lodash');
const Sequelize = require('sequelize');
let sequelize = new Sequelize('tester', 'postgres', 'FaciLLimus$58', {
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

let locationTemplate = {
    type: 'floor',
    display: 'floor ',
    parent: '4200'
};
let o = 2;

var LocationType = sequelize.define('locationType', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: Sequelize.STRING
    }
});
var Location = sequelize.define('location', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    display: {
        type: Sequelize.STRING,
        unique: true
    }
});

Location.belongsTo(LocationType, {
    as: 'type'
});
Location.hasMany(Location, {
    as: 'parent'
});

sequelize.sync({
    force: true
}).then(() => {
    // Table created
    return LocationType.create({
        type: 'building'
    }).then(() => {
        return LocationType.create({
            type: 'floor'
        });
    });
}).then(() => {
    return Location.create({
        display: '4200'
    }).then((location) => {
        return LocationType.findOne({
            where: {
                type: 'building'
            }
        }).then((building) => {
            return location.setType(building);
        });
    });
}).then((location) => {
    return Location.create({
        display: 'floor 1'
    });
}).then((location2) => {
    return LocationType.findOne({
        where: {
            type: 'floor'
        }
    }).then((floor) => {
        return location2.setType(floor).then(() => {
            return location2;
        });
    });
}).then((location2) => {
    return Location.findOne({
        where: {
            display: '4200'
        }
    }).then((building) => {
        return building.setParent(location2);
    });
}).then(() => {
    return Location.all({
        // attributes: ['display', ['typeId', 'type'], ['locationId', 'parent']],
        include: [{
            model: Location,
            as: 'parent',
            attributes: ['display', 'id']
        }, {
            model: LocationType,
            as: 'type',
            attributes: ['type']
        }]
    });
}).then((locations) => {
    async.whilst(() => {
        return o <= 10;
    }, (cb) => {
        let template = _.cloneDeep(locationTemplate);
        template.display += o;
        let location = null;
        Location.create({
            display: template.display
        }).then((_location) => {
            location = _location;
            return LocationType.findOne({
                where: {
                    type: template.type
                }
            });
        }).then((type) => {
            return location.setType(type);
        }).then((location) => {
            return Location.findOne({
                where: {
                    display: template.parent
                }
            }).then((building) => {
                return building.setParent(location);
            });
        }).done(() => {
            o++;
            cb();
        });
    }, (err) => {
        console.log('done');
    });
});
// sequelize.sync({}).then(() => {
//     return Location.all({
//         // attributes: ['display', ['typeId', 'type'], ['locationId', 'parent']],
//         include: [{
//             model: Location,
//             as: 'parent',
//             attributes: ['display', 'id']
//         }, {
//             model: LocationType,
//             as: 'type',
//             attributes: ['type']
//         }]
//     });
// }).then((locations) => {
//     locations.forEach((loc) => {
//         console.log(JSON.stringify(loc));
//     });
// });

// try mongo $lookup
// select t1.id, t1.display, t2.type, t3.display as parent, t3.id as "parentId" from locations t1 LEFT JOIN "locationTypes" as t2 on t1."typeId" = t2.id LEFT OUTER JOIN locations t3 on t1."locationId" = t3.id
// select * from locations where "locationId" = 1

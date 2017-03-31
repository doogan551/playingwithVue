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

var LocationType = sequelize.define('locationTypes', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: Sequelize.STRING
    }
});
var Location = sequelize.define('locations', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    display: {
        type: Sequelize.STRING,
        unique: true
        // },
        // typeId: {
        //     type: Sequelize.INTEGER,
        //     references: {
        //         model: LocationType,
        //         key: 'id'
        //     }
        // },
        // parentId: {
        //     type: Sequelize.INTEGER,
        //     references: {
        //         model: Location,
        //         key: 'id'
        //     }
    }
});

Location.belongsTo(LocationType, {
    as: 'Type',
    foreignKey: 'typeId'
});
Location.belongsTo(Location, {
    as: 'Parent',
    foreignKey: 'parentId'
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
        return location2.setParent(building);
    });
}).then((location) => {
    Location.findAll().then((locations) => {
        console.log(locations[0]);
    });
});

// try mongo $lookup
// select t1.id, t1.display, t2.type, t3.display as parent from locations t1 LEFT JOIN "locationTypes" as t2 on t1."typeId" = t2.id LEFT OUTER JOIN locations t3 on t1."parentId" = t3.id

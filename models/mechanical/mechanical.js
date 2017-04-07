let Mechanical = class Mechanical {
    constructor(type) {
        this._type = type;
        this.equipment = [];
    }

    getOptions() {
        let options = {
            Equipment,
            Category,
            Instrumentation
        };
        return options;
    }

    build(mech) {
        if (Equipment.hasOwnProperty(mech)) {
            let newEquipment = new Equipment[mech](this.class);
            this.equipment.push(newEquipment);
            return newEquipment;
        }
        if (Category.hasOwnProperty(mech)) {
            let newCategory = new Category[mech](this.class);
            this.equipment.push(newCategory);
            return newCategory;
        }
        if (Instrumentation.hasOwnProperty(mech)) {
            let newInstrumentation = new Instrumentation[mech](this.class);
            this.equipment.push(newInstrumentation);
            return newInstrumentation;
        }
        throw new Error('Equipment type does not exist');
    }

    get type() {
        return this._type;
    }

    set type(newType) {
        this._type = newType;
    }

    get name() {
        return this.constructor.name;
    }
};

// class MechClass extends Mechanical {
//     constructor(_class) {
//         super();
//         return;
//     }
// }

module.exports = Mechanical;
let Equipment = require('./equipment');
let Category = require('./category');
let Instrumentation = require('./instrumentation');

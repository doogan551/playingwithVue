let Mechanical = class Mechanical {
    constructor(type, parent = null) {
        this._type = type;
        this._parent = parent;
        this.equipment = [];
        this._options = {
            Equipment: require('./equipment'),
            Category: require('./category'),
            Instrumentation: require('./instrumentation')
        };
    }

    get options() {
        return this._options;
    }

    build(item, type) {
        try {
            let newEquipment = new this.options[item][type](this);
            this.equipment.push(newEquipment);
            return newEquipment;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    get type() {
        return this._type;
    }

    set type(newType) {
        this._type = newType;
    }

    get parent() {
        return this._parent;
    }

    set parent(newParent) {
        this._parent = newParent;
    }

    getAllParentNames() {
        let parents = [];
        let parentClasses = this.getAllParents();
        parentClasses.forEach((parent) => {
            parents.push(parent.name);
        });
        return parents;
    }

    getAllParents() {
        let parents = [];
        let iterateParent = (obj) => {
            let parent = obj.parent;
            if (!!parent) {
                parents.push(parent);
                iterateParent(parent);
            } else {
                return;
            }
        };

        iterateParent(this);
        return parents;
    }

    get name() {
        return this.constructor.name;
    }

    save() {
        let objs = [];
        let iterateEquipment = (equipment) => {
            equipment.forEach((equip) => {
                objs.push(equip.name);
                iterateEquipment(equip.equipment);
            });
        };
        iterateEquipment(this.equipment);
        // save each object from the top, save their new id and add to children's refs
        console.log(objs);
    }
};

// class MechClass extends Mechanical {
//     constructor(_class) {
//         super();
//         return;
//     }
// }

module.exports = Mechanical;

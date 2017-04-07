let Mechanical = require('./mechanical');

class Category extends Mechanical {
    constructor() {
        super('category');
    }
}

class Space extends Category {
    constructor() {
        super();
        // this.equipment.push(new Temperature());
        // this.equipment.push(new Lights());
    }
}

class SupplyAir extends Category {
    constructor() {
        super();
        // this.equipment.push(new Temperature());
        // this.equipment.push(new Fan());
    }
}

module.exports = {
    Space: Space,
    'Supply Air': SupplyAir
};

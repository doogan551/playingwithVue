let Mechanical = require('./mechanical');
// let Category = require('./category');
// let Instrumentation = require('./instrumentation');

let Equipment = class Equipment extends Mechanical {
    constructor() {
        super('equipment');
        // this.buildOptions();
    }

};

class VAV extends Equipment {
    constructor() {
        super();
    }

    getOptions() {
        switch (this.type) {
            case 'Air Handling':
                return ['VAV', 'AHU'];
            default:
                return ['Space', 'Supply Air'];
        }
    }
}

class Fan extends Equipment {
    constructor() {
        super();
    }

    // buildOptions() {
    //     this.equipment.push(new Control());
    // }

}

module.exports = {
    VAV: VAV,
    Fan: Fan
};

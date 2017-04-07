let Mechanical = require('./mechanical');
// let Category = require('./category');
// let Instrumentation = require('./instrumentation');

let MechClass = class MechClass extends Mechanical {
    constructor() {
        super('class');
        // this.buildOptions();
    }

};

class AirHandler extends MechClass {
    constructor() {
        super();
    }
}

class WasteWater extends MechClass {
    constructor() {
        super();
    }

}

module.exports = {
    'Air Handler': AirHandler,
    'Waste Water': WasteWater
};

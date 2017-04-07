let Mechanical = require('./mechanical');
let Instrumentation = require('./instrumentation');

class Category extends Mechanical {
    constructor(parent) {
        super('category', parent);
    }
}

class Space extends Category {
    constructor(parent) {
        super(parent);
        this.buildOptions();
    }

    get options() {
        return this._options;
    }

    set options(newOptions) {
        this._options = newOptions;
    }

    buildOptions() {
        this.options = {
            Instrumentation: {
                Temperature: Instrumentation.Temperature,
                Lights: Instrumentation.Lights
            }
        };
    }
}

class SupplyAir extends Category {
    constructor(parent) {
        super(parent);
        // this.equipment.push(new Temperature());
        // this.equipment.push(new Fan());
    }
}

module.exports = {
    Space: Space,
    'Supply Air': SupplyAir
};

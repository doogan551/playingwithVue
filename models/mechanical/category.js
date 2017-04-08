let Mechanical = require('./mechanical');

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
            Equipment: {
                Temperature: Equipment.Temperature,
                Lights: Equipment.Lights
            },
            Instrumentation: {
                Occupancy: Instrumentation.Occupancy
            }
        };
    }
}

class SupplyAir extends Category {
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
            Equipment: {
                Temperature: Equipment.Temperature,
                Damper: Equipment.Damper,
                Fan: Equipment.Fan
            },
            Category: {
                CFM: CFM
            }
        };
    }
}

class SourceAir extends Category {
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
            Equipment: {
                Temperature: Equipment.Temperature
            }
        };
    }
}

class HotWater extends Category {
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
            Equipment: {
                Valve: Equipment.Valve
            }
        };
    }
}

class CFM extends Category {
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
        this.options = {};
    }
}

module.exports = {
    'Space': Space,
    'Supply Air': SupplyAir,
    'CFM': CFM,
    'Source Air': SourceAir,
    'Hot Water': HotWater
};
let Equipment = require('./equipment');
let Instrumentation = require('./instrumentation');

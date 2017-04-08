let Mechanical = require('./mechanical');

let Equipment = class Equipment extends Mechanical {
    constructor(parent) {
        super('equipment', parent);
    }

};

class VAV extends Equipment {
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
            Category: {
                Space: Category.Space,
                'Supply Air': Category['Supply Air'],
                'Source Air': Category['Source Air']
            },
            Equipment: {
                'Digital Heat': DigitalHeat
            }
        };
    }
}

class Fan extends Equipment {
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
                'Control': Instrumentation.Control
            }
        };
    }
}

class Damper extends Equipment {
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
                'Control': Instrumentation.Control
            }
        };
    }
}

class Valve extends Equipment {
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
                'Control': Instrumentation.Control
            }
        };
    }
}

class Lights extends Equipment {
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
                'Control': Instrumentation.Control
            }
        };
    }
}

class Temperature extends Equipment {
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
                'Sensor': Instrumentation.Sensor
            }
        };
    }
}

class DigitalHeat extends Equipment {
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
                Control: Instrumentation.Control
            }
        };
    }
}

module.exports = {
    VAV: VAV,
    Fan: Fan,
    Damper: Damper,
    Valve: Valve,
    'Digital Heat': DigitalHeat,
    Lights: Lights,
    Temperature: Temperature
};
let Category = require('./category');
let Instrumentation = require('./instrumentation');

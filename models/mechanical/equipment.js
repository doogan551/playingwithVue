let Mechanical = require('./mechanical');
let Category = require('./category');
let Instrumentation = require('./instrumentation');

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
                'Supply Air': Category['Supply Air']
            },
            Equipment: {
                Fan: Fan
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

module.exports = {
    VAV: VAV,
    Fan: Fan
};

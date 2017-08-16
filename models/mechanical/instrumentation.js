let Mechanical = require('./mechanical');

let Instrumentation = class Instrumentation extends Mechanical {
    constructor(parent) {
        super('Instrumentation', parent);
        this._options = [];
    }
};


class Sensor extends Instrumentation {
    constructor(parent) {
        super(parent);
    }
}
class Control extends Instrumentation {
    constructor(parent) {
        super(parent);
    }
}
class Occupancy extends Instrumentation {
    constructor(parent) {
        super(parent);
    }
}

module.exports = {
    Sensor: Sensor,
    Control: Control,
    Occupancy: Occupancy
};

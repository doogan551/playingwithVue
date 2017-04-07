let Mechanical = require('./mechanical');

let Instrumentation = class Instrumentation extends Mechanical {
    constructor(parent) {
        super('instrumentation', parent);
    }
};


class Temperature extends Instrumentation {
    constructor(parent) {
        super(parent);
    }
}
class Lights extends Instrumentation {
    constructor(parent) {
        super(parent);
    }
}
class Control extends Instrumentation {
    constructor(parent) {
        super(parent);
    }
}

module.exports = {
    Temperature: Temperature,
    Lights: Lights,
    Control: Control
};

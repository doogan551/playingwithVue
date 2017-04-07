let Mechanical = require('./mechanical');

let Instrumentation = class Instrumentation extends Mechanical {
    constructor() {
        super('instrumentation');
    }
};


class Temperature extends Instrumentation {
    constructor() {
        super();
    }
}
class Lights extends Instrumentation {
    constructor() {
        super();
    }
}
class Control extends Instrumentation {
    constructor() {
        super();
    }
}

module.exports = {
    Temperature: Temperature,
    Lights: Lights,
    Control: Control
};

before(function () {
    global.chai = require('chai');
    global.expect = chai.expect;

    global.adminUser = {
        'System Admin': {
            'Value': true
        },
        groups: []
    };
});

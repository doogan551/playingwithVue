var page = require('webpage').create();
var system = require('system');

page.paperSize = {
    format: 'A4',
    orientation: 'landscape'
};
page.open(system.args[1], function (status) {
    setTimeout(function () {
        if (status === 'success') {
            page.render(system.args[2]);
            phantom.exit();
        }
    }, 25000);
});

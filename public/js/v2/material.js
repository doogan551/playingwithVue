var material = {
    clock: {
        $el: $('.taskbar > .clock'),
        checkTime: function (initial) {
            var now = moment(),
                setText = function () {
                    material.clock.$el.html(now.format('HH:mm'));
                };

            setText();

            if (!material.clock.hasReset && now.seconds() === 0) {
                material.clock.hasReset = true;
                material.clock.interval = window.setInterval(material.clock.checkTime, 1000 * 60);
            } else {
                setTimeout(function () {
                    material.clock.checkTime();
                }, (60 - now.seconds()) * 1000 - now.milliseconds());
            }
        }
    }
};

material.clock.checkTime(true);
// material.clock.interval = setInterval(material.clock.checkTime, 1000);
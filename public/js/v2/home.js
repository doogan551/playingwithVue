var dti = {
    clock: {
        $el: $('.taskbar .clock'),
        checkTime: function (initial) {
            var now = moment(),
                setText = function () {
                    dti.clock.$el.html(now.format('HH:mm'));
                };

            setText();

            if (!dti.clock.hasReset && now.seconds() === 0) {
                dti.clock.hasReset = true;
                dti.clock.interval = window.setInterval(dti.clock.checkTime, 1000 * 60);
            } else {
                setTimeout(function () {
                    dti.clock.checkTime();
                }, (60 - now.seconds()) * 1000 - now.milliseconds());
            }
        }
    }
};

dti.clock.checkTime();
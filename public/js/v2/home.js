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
    },
    panels: {
        init: function () {
            dti.panels.elementSelector = '.card, .card-panel';
            dti.panels.$elements = $(dti.panels.elementSelector);

            dti.panels.$elements.draggable({
                containment: 'main',
                scroll: false
            });

            // dti.panels.$elements.resizable({
            //     helper: 'ui-resizable-helper',
            //     containment: 'main'
            // });

            $('main').on('mousedown', dti.panels.elementSelector, function handleCardClick (event) {
                dti.panels.activate($(event.currentTarget));
            });

            // $('.material-tooltip .backdrop').addClass('blue-grey');
        },
        activate: function ($target) {
            $('.activeCard').removeClass('activeCard').addClass('lighten-3');
            $target.removeClass('lighten-3').addClass('activeCard');
        }
    },
    startButton: {
        init: function () {
            dti.startButton.$el = $('#startButton');

            dti.startButton.$el.click(function startClick () {
                var $newPanel = $('#newPanel');

                $newPanel.removeClass('hide');
                dti.panels.activate($newPanel);
            });
        }
    }
};

$(function initWorkspaceV2 () {
    // dti.clock.checkTime();

    dti.panels.init();

    dti.startButton.init();
});
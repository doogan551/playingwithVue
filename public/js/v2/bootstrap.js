var di = {
    clock: {
        $el: $('.clock'),
        checkTime: function (initial) {
            var now = moment(),
                setText = function () {
                    di.clock.$el.html(now.format('HH:mm'));
                };

            setText();

            if (!di.clock.hasReset && now.seconds() === 0) {
                di.clock.hasReset = true;
                di.clock.interval = window.setInterval(di.clock.checkTime, 1000 * 60);
            } else {
                setTimeout(function () {
                    di.clock.checkTime();
                }, (60 - now.seconds()) * 1000 - now.milliseconds());
            }
        }
    }
};


$(function () {
    $.material.init();

    di.user = ko.observable(window.userData);

    di.config = window.Config;

    // $('.panel').lobiPanel({
    //     state: 'unpinned',
    //     reload: false,
    //     editTitle: false,
    //     unpin: false
    // });

    $('.panel').each(function (idx, panel) {
        var $el,
            $panel = $(panel),
            instance,
            loadUrl = location.origin + '/displays/view/44215';

        $panel.lobiPanel({
            state: 'unpinned',
            reload: false,
            editTitle: false,
            unpin: false
        });

        instance = $panel.data('lobiPanel');

        // instance.minimiz

        $el = instance.$el;
        $el.draggable('option', 'containment', '.mainContent');
        $el.resizable('option', 'containment', '.mainContent');

        $panel.find('.panel-frame').attr('src', loadUrl);
        // instance.load();
    });

    $('.panel').mousedown(function (event) {
        $('.panel-primary').removeClass('panel-primary').addClass('panel-default');
        $(event.target).parent('.panel').removeClass('panel-default').addClass('panel-primary');
    });

});

window.workspaceManager = di;

// $('.panel').draggable({
//     containment: '.mainContent',
//     scroll: false,
//     handle: '.panel-heading'
// });

// $('.panel').resizable({
//     containment: '.mainContent'
// });

// material.clock.checkTime(true);

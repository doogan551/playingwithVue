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
                if (!$(event.target).hasClass('minimizePanel')) {
                    dti.panels.activate($(event.currentTarget));
                }
            });

            $('.dti-card-panel .card-toolbar .right a:first-child').click(function (event) {
                $(event.target).parents('.dti-card-panel').addClass('hide');
            });

            // $('.material-tooltip .backdrop').addClass('blue-grey');
        },
        activate: function ($target) {
            $('.activeCard').removeClass('activeCard hide').addClass('lighten-3');
            $target.removeClass('lighten-3').addClass('activeCard');
        }
    },
    startButton: {
        init: function () {
            dti.startButton.$el = $('#startButton');

            // dti.startButton.$el.on('mousedown', function startClick (event) {
            //     var $newPanel = $('#newPanel');

            //     if (event.which === 3) {
            //         $newPanel.removeClass('hide');
            //         dti.panels.activate($newPanel);
            //         event.preventDefault();
            //         return false;
            //     } else if (event.which === 1) {
            //         $('#startmenu').removeClass('hide');
            //     }
            // });

            $('.taskbar a:not(#startButton)').click(function (event) {
                var target = $(event.target).data('target');

                dti.panels.activate($('#' + target));
            });

            $('body').mousedown(function hideStartMenu (event) {
                var $newPanel = $('#newPanel'),
                    $target = $(event.target);

                if ($target.parents('#startmenu').length === 1) {
                    return;
                }

                if ($target.parent('#startButton').length === 0 && $target.attr('id') !== 'startButton') {
                    $('#startmenu').fadeOut(300);
                } else {
                    if (event.which === 3) {
                        $('#startmenu').fadeOut(300);
                        $newPanel.removeClass('hide');
                        dti.panels.activate($newPanel);
                        $('.newPanelButton').removeClass('hide');
                        event.preventDefault();
                        return false;
                    } else if (event.which === 1) {
                        $('#startmenu').removeClass('hide')
                            .stop(true, true).css('opacity', 0)
                            .slideDown({
                                queue: false,
                                duration: 300,
                                easing: 'easeOutCubic',
                                complete: function () {
                                    $(this).css('height', '');
                                }
                            })
                            .animate({
                                opacity: 1
                            }, {
                                queue: false,
                                duration: 300,
                                easing: 'easeOutSine'
                            });
                    }
                }
            });
        }
    },
    globalSearch: {
        init: function () {
            dti.globalSearch.$el = $('#search');
            dti.globalSearch.$resultsEl = $('#globalSearchResults');

            dti.globalSearch.rawResults = ['4250 AH5 DISP', '4200 PARKING LOT LIGHTS', 'AIR HANDLERS', 'MONTHLY REPORT'];

            // dti.globalSearch.results = new Bloodhound({
            //     datumTokenizer: Bloodhound.tokenizers.whitespace,
            //     queryTokenizer: Bloodhound.tokenizers.whitespace,
            //     local: dti.globalSearch.rawResults
            // });

            // // on keydown, take string and get results from bloodhound, replace string in results with span.searchHighlight, then populate dropdown and show if not shown already

            dti.globalSearch.$el.on('keyup', function () {
                dti.globalSearch.$resultsEl.css('display', 'block');
            });

            dti.globalSearch.$el.on('blur', function () {
                dti.globalSearch.$resultsEl.css('display', 'none');
                dti.globalSearch.$el.val(null);
            });

            // dti.globalSearch.$el.typeahead({
            //     hint: true,
            //     highlight: true,
            //     minLength: 1
            // }, {
            //     name: 'Results',
            //     source: dti.globalSearch.results
            // });

            $('#globalSearchResults').dropdown({
                // inDuration: 300,
                // outDuration: 225,
                // constrain_width: false, // Does not change width of dropdown to that of the activator
                hover: true, // Activate on hover
                gutter: 0, // Spacing from edge
                belowOrigin: true, // Displays dropdown below the button
                alignment: 'left' // Displays dropdown with edge aligned to the left of button
            });
        }
    },
    menu: {
        init: function () {
            var highlightClass = 'z-depth-3';
            $('.dti-menu-tile').hover(function handleMenuTileHover () {
                $(this).addClass(highlightClass);
            }, function handleMenuTileHoverOut () {
                $(this).removeClass(highlightClass);
            });
        }
    }
};

$(function initWorkspaceV2 () {
    // dti.clock.checkTime();

    dti.panels.init();

    dti.startButton.init();

    dti.menu.init();

    dti.globalSearch.init();
});

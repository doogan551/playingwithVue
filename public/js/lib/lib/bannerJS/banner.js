/**
 * Created by chris on 4/10/14.
 */
var bannerJS = (function($) {
    var _bannerSys = {},
        _internals = {};

    _internals.bannerHeight = 0;
    _internals.bannerIsInjected = false;
    _internals.bannerIsVisible = false;

    _bannerSys.showBanner = function(msg, dismissText, duration, color) {
        clearTimeout(_internals.timer);
        if (_internals.bannerIsVisible) {
            _internals.$bannerContainer.hide();
            _internals.$page.animate({'marginTop': '-=' + (_internals.bannerHeight)}, 0);
        }
        _internals.createBanner(msg, dismissText);
        !_internals.bannerIsInjected && $('body').prepend(_internals.$bannerContainer);
        color && _internals.$bannerContainer.css({backgroundColor: color});
        _internals.bannerHeight = _internals.$bannerContainer.outerHeight();
            //shift page down
            _internals.$page.animate({'marginTop': '+=' + (_internals.bannerHeight)},{duration: 250, easing: 'easeInQuint'});
            _internals.$bannerContainer.slideDown({duration: 250, easing: 'easeInQuint'});
            _internals.bannerIsVisible = true;
        duration && (_internals.timer = setTimeout(_bannerSys.hideBanner, duration));
    };
    _bannerSys.hideBanner = function() {
        _internals.bannerIsVisible = false;
        clearTimeout(_internals.timer);
        _internals.$page.animate({'marginTop': '-=' + (_internals.bannerHeight)}, {duration: 250, easing: 'easeOutQuint'});
        _internals.$bannerContainer.slideUp({duration: 250, easing: 'easeOutQuint'});
    };
    _bannerSys.init = function() {
        _internals.$bannerContainer = $('<ul id="bannerContainer"></ul>');
        _internals.$fixedElements = $('body').find('*').filter(function() {
            return $(this).css('position') === 'fixed';
        });
        _internals.$page = $('html').add(_internals.$fixedElements);
    };
    _internals.createBanner = function(msg, dismissText) {
        _internals.$banner = _internals.$bannerContainer.find('li');
        if (!_internals.$banner.length) {
            _internals.$banner = $('<li><div class="msg"></div></li>');
            if (dismissText) {
                $('<input type="button" class="x btn btn-default">').prependTo(_internals.$banner).val(dismissText);
            }
            _internals.$bannerContainer.html(_internals.$banner);
            _internals.$banner.on('click', '.x', _bannerSys.hideBanner);
        }
        _internals.$bannerText = _internals.$banner.find('.msg');
        _internals.$bannerText.text(msg);
    };
    _internals.destroyBanner = function() {

    };

//    $(window).load(function() {
//        _bannerSys.init();
//    });

    return _bannerSys;
})(jQuery);

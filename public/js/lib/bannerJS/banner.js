/**
 * Created by chris on 4/10/14.
 */
(function($) {
    var _bannerSys = {},
        _internals = {},
        $body = $('body'),
        $window = $(window),
        heightIsBannerInfluenced = false,
        timer = null,
        //borrow jQuery's easing functions
        easingFuncs = $.easing;

    _internals.bannerHeight = 0;
    _internals.bannerIsInjected = false;
    _internals.bannerIsVisible = false;

    _bannerSys.showBanner = function(_msg, _dismissText, _duration, _color, _showCountdown, _animatePage) {
        var msg,
            dismissText,
            duration,
            color,
            showCountdown,
            animatePage;
        if (typeof _msg === 'object') {
            msg           = _msg.msg;
            dismissText   = _msg.dismissText;
            duration      = _msg.duration;
            color         = _msg.color;
            showCountdown = _msg.showCountdown;
            animatePage   = typeof _msg.animatePage === 'boolean' ? _msg.animatePage : true;
        } else {
            msg           = _msg;
            dismissText   = _dismissText;
            duration      = _duration;
            color         = _color;
            showCountdown = _showCountdown;
            animatePage   = typeof _animatePage === 'boolean' ? _animatePage : true;
        }
        _internals.animatePage = animatePage;

        clearTimeout(_internals.timer);
        clearTimeout(_internals.countdownTimer);
        if (_internals.bannerIsVisible) {
            _internals.$bannerContainer.hide();
            _internals.$bannerContainer.css({backgroundColor: ''});
            if (_internals.animatePage) _internals.$page.animate({'marginTop': '-=' + (_internals.bannerHeight)}, 0);
        }
        createBanner(msg, dismissText, duration, showCountdown);
        !_internals.bannerIsInjected && $('body').prepend(_internals.$bannerContainer);
        color && _internals.$bannerContainer.css({backgroundColor: color});
        _internals.bannerHeight = _internals.$bannerContainer.outerHeight();
            //shift page down
        if (_internals.animatePage) _internals.$page.animate({'marginTop': '+=' + (_internals.bannerHeight)},{duration: 250, easing: 'easeInQuint'});
        _internals.$bannerContainer.slideDown({duration: 250, easing: 'easeInQuint'});
        if (_internals.animatePage) animateWindow(_internals.bannerHeight, 250, 'easeInQuint');
        _internals.bannerIsVisible = true;
        duration && (_internals.timer = setTimeout(_bannerSys.hideBanner, duration));
    };
    _bannerSys.hideBanner = function() {
        _internals.bannerIsVisible = false;
        clearTimeout(_internals.timer);
        if (_internals.animatePage) _internals.$page.animate({'marginTop': '-=' + (_internals.bannerHeight)}, {duration: 250, easing: 'easeOutQuint'});
        _internals.$bannerContainer.slideUp({duration: 250, easing: 'easeOutQuint', complete: function() {
            _internals.$bannerContainer.css({backgroundColor: ''});
        }});
        if (_internals.animatePage) animateWindow(-_internals.bannerHeight, 250, 'easeInQuint');
    };
    _bannerSys.init = function() {
        _internals.$bannerContainer = $('<ul id="bannerContainer"></ul>');
        _internals.$fixedElements = $body.find('*').filter(function() {
            return $(this).css('position') === 'fixed';
        });
        _internals.$page = $body.add(_internals.$fixedElements).add('.wrapper');
    };

    function createBanner(msg, dismissText, duration, showCountdown) {
        _internals.$bannerContainer.empty();
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
        if (showCountdown && duration) {
            _internals.$bannerText.append(' Closing in <span class="countdown"></span>...');
            countdown(duration);
        }
    }
    function destroyBanner() {
    }
    function countdown (duration) {
        _internals.$bannerText.find('.countdown').text(duration/1000);
        _internals.countdownTimer = setTimeout(function(){countdown(duration-1000);}, 1000);
    }
    function animateWindow(height, duration, easing, callback) {
        var interval = 13,
            easingFunc = easingFuncs[easing] || easingFuncs.linear,
            originalHeight = outerHeight,
            originalWidth = outerWidth,
            proposedHeight = originalHeight + height,
            growing = originalHeight < proposedHeight,
            startTime = +new Date();

        if (growing) {
            if (screenY + proposedHeight > screen.availHeight || heightIsBannerInfluenced) return;
        } else if (!heightIsBannerInfluenced) {
            return;
        }

        function goToEnd() {
            window.resizeTo(originalWidth, proposedHeight);
            heightIsBannerInfluenced = growing;
            if (callback) callback.call();
        }
//bugs out on slower PCs, so we'll just call gotToEnd instead... :(
        goToEnd();
        //setTimeout(function anim() {
        //    var repeat = true,
        //        time = +new Date() - startTime,
        //        // Pass the time, the beginning value, the change and the duration to which
        //        // ever easing function we've got.
        //        amount = easingFunc(null, time,
        //            originalHeight,
        //            proposedHeight - originalHeight,
        //            duration);
        //        window.resizeTo(originalWidth, parseInt(amount, 10));
        //        repeat = time < duration;
        //    if (repeat) {
        //        setTimeout(anim, interval);
        //    } else {
        //        goToEnd();
        //    }
        //}, interval);
    }

    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['bannerJS'], _bannerSys);
    } else {
        // Browser globals.
        window.bannerJS = _bannerSys;
    }
    // debug
    window.bannerJS = _bannerSys;
})(jQuery);

let dti = {
    _bodyClickHandlers: [],
    _bodyClickCount: 0,
    _bodyClickTime: 0,
    bodyClick: function (fn) {
        dti._bodyClickHandlers.push(fn);
    },
    forEach: function (obj, fn) {
        var keys = Object.keys(obj),
            c,
            len = keys.length,
            errorFree = true;

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(obj[keys[c]], keys[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    forEachArray: function (arr, fn) {
        var c,
            list = arr || [],
            len = list.length,
            errorFree = true;

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(list[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    forEachArrayRev: function (arr, fn) {
        var c,
            list = arr || [],
            len = list.length,
            errorFree = true;

        for (c = len - 1; c >= 0 && errorFree; c--) {
            errorFree = fn(list[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    _events: {},
    _onceEvents: {},
    on (event, handler) {
        dti._events[event] = dti._events[event] || [];
        dti._events[event].push(handler);
    },
    once (event, handler) {
        dti._onceEvents[event] = dti._onceEvents[event] || [];
        dti._onceEvents[event].push(handler);
    },
    off (event, handler) {
        var handlers = dti._events[event] || [];

        dti.forEachArray(handlers, function processOffHandler (fn, idx) {
            if (fn === handler) {
                dti._events[event].splice(idx, 1);
                return false;
            }
        });
    },
    fire (event, obj1, obj2) {
        var handlers = dti._events[event] || [],
            onceHandlers = dti._onceEvents[event] || [];

        dti.forEachArray(handlers, function fireEventHandlers (handler) {
            handler(obj1 || null, obj2 || null);
        });

        dti.forEachArray(onceHandlers, function fireOnceEvent (handler) {
            handler(obj1 || null, obj2 || null);
        });

        dti._onceEvents[event] = [];
    }
};

$(() => {
    // Setup listener for body clicks
    $('body').mousedown(function handleBodyMouseDown(event) {
        let start = new Date();
        dti.forEachArray(dti._bodyClickHandlers, function bodyMouseDownHandler(handler) {
            var $target = $(event.target);

            handler(event, $target);
        });
        dti._bodyClickCount++;
        dti._bodyClickTime += new Date() - start;
    });
});
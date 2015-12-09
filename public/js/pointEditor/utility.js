/**
 * Created by Chris on 9/19/13.
 */
window.pointEditor = (function (module) {
    var workspace = window.opener.workspaceManager,
        uniqueIdRegister = [];

    module.utility = {
        enumToArray: function(obj) {
            var _array = [];
            for (var i in obj) {
                _array.push({name: i, value: typeof obj[i].enum == 'undefined' ? obj[i] : obj[i].enum });
            }
            return _array;
        },
        arrayToValueOptions: function(arr) {
            var _options = {},
                i = 0;
            for (i; i < arr.length; i++) {
                _options[arr[i].name] = arr[i].value;
            }
            return _options;
        },
        createUniqueId: function() {
            var lastId = Math.max.apply(Math, uniqueIdRegister),
                newId = lastId < 0 ? 0 : lastId + 1;

            uniqueIdRegister.push(newId);
            return newId;
        },
        addEvent: function(element, event, fn) {
            if (element.addEventListener) {
                element.addEventListener(event, fn, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + event, fn);
            }
        },
        removeEvent: function (element, event, fn) {
            if (element.removeEventListener) {
                element.removeEventListener(event, fn, false);
            } else if (element.detachEvent) {
                element.detachEvent('on' + event, fn);
            }
        },
        workspace: workspace,
        config: workspace.config
    };
    return module;
})(window.pointEditor);

/**
 * Created by Chris on 9/21/13.
 */
window.pointEditor = (function ($) {
    var _app = {},
        _local = {};

    _local.params = $.getAllQueryStrings();
    _local.webEndpoint = 'http://' + window.location.hostname;
    _app.apiEndpoint = _local.webEndpoint + ':' + window.location.port + '/api/';

    _app.init = function () {   //get the uid
        _local.pid = window.location.href.split('/').reverse()[0];

        infuser.defaults.templateUrl = "/js/pointEditor/views";
        infuser.defaults.templateSuffix = ".tmpl.html";
        infuser.defaults.templatePrefix = "";

        Messenger.options = {
            extraClasses: 'messenger-fixed messenger-on-top',
            theme       : 'future'
        };


        if (!!window.attach && !!window.attach.point) {
            _local.initializePoint(JSON.parse(window.attach.point));
        } else {
            _local.getPoint(_local.pid).done(function (data) {
                if (!!_local.params.createTemplate) {
                    _local.createTemplate(data);
                    return;
                }
                _local.initializePoint(data);
            });
        }
    };

    _local.getPoint = function (pid) {
        return $.ajax(
            {
                url        : _app.apiEndpoint + 'points/' + pid,
                contentType: 'application/json',
                dataType   : 'json',
                type       : 'get'
            }
        )
    };
    //expose getPoint for bindings
    _app.getPoint = _local.getPoint;

    _local.initializePoint = function (data) {
        _app.point = new _app.Point(data);
        _local.initializeView();
    };

    _local.initializeView = function () {
        _app.socket = io.connect(_local.webEndpoint + ':8085');
        infuser.get(_app.point.data['Point Type'].Value().toLowerCase().replace(/ /g, ''), function (template) {
            var $template = $(template);
            ko.applyBindingsWithValidation(_app.point, $template[0], {
                registerExtenders : true,
                messagesOnModified: true,
                insertMessages    : false,
                decorateElement   : true,
                errorElementClass : 'input-validation-error',
                errorMessageClass : 'error'
            });
            document.title = [_app.point.data.Name(), ' - ', _app.point.data['Point Type'].Value()].join('');
            $('#main').html($template);
            bannerJS.init();
        });
    };

    _local.createTemplate = function (data) {
        for (var i in data) {
            if (typeof data[i].Value == 'undefined') continue;
            //console.log(i, data[i].Value);

            console.log('<!-- ko with: data[\'' + i + '\'] -->');
            console.log('<tr data-bind="css: { active: !isDisplayable() }">');
            console.log('<th scope="row">' + i + '</th>');
            switch (data[i].ValueType) {
                case 1:
                    console.log('<td data-bind="template: { name: \'control.number\', data: { prop: $data, id: \'' + i.replace(/ /g, '') + '\', propName: \'' + i + '\' } }"></td>');
                    break;
                case 2:
                    console.log('<td data-bind="template: { name: \'control2.text\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 3:
                    console.log('<td data-bind="template: { name: \'control.number\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 4:
                    console.log('<td data-bind="template: { name: \'control.number\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 5:
                    console.log('<td data-bind="template: { name: \'control5.enumSelect\', data: { prop: $data, propName: \'' + i + '\', enumOptions: [{name:\'--options--\', value:0}] } }"></td>');
                    break;
                case 7:
                    console.log('<td data-bind="template: { name: \'control7.bool\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 8:
                    console.log('<td data-bind="template: { name: \'control8.point\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 11:
                    console.log('<td data-bind="template: { name: \'control.number\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 12:
                    console.log('<td data-bind="template: { name: \'control12.hrMinSec\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 13:
                    console.log('<td data-bind="template: { name: \'control13.minSec\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 17:
                    console.log('<td data-bind="template: { name: \'control17.hrMin\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
                case 18:
                    console.log('<td data-bind="template: { name: \'control.number\', data: { prop: $data, propName: \'' + i + '\' } }"></td>');
                    break;
            }
            console.log('</tr>');
            console.log('<!-- /ko -->');
        }
    };

    //extend input masks
    $.extend($.inputmask.defaults.aliases, {
        'ipAddress': { //ip-address mask
            mask       : ["[[x]y]z.[[x]y]z.[[x]y]z.x[yz]", "[[x]y]z.[[x]y]z.[[x]y]z.[[x]y][z]"],
            definitions: {
                'x': {
                    validator       : "[012]",
                    cardinality     : 1,
                    definitionSymbol: "i"
                },
                'y': {
                    validator       : function (chrs, buffer, pos, strict, opts) {
                        if (pos - 1 > -1 && buffer[pos - 1] != ".")
                            chrs = buffer[pos - 1] + chrs;
                        else chrs = "0" + chrs;
                        return new RegExp("2[0-5]|[01][0-9]").test(chrs);
                    },
                    cardinality     : 1,
                    definitionSymbol: "i"
                },
                'z': {
                    validator       : function (chrs, buffer, pos, strict, opts) {
                        if (pos - 1 > -1 && buffer[pos - 1] != ".") {
                            chrs = buffer[pos - 1] + chrs;
                            if (pos - 2 > -1 && buffer[pos - 2] != ".") {
                                chrs = buffer[pos - 2] + chrs;
                            } else chrs = "0" + chrs;
                        } else chrs = "00" + chrs;
                        return new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(chrs);
                    },
                    cardinality     : 1,
                    definitionSymbol: "i"
                }
            }
        }
    });

    $(function () {
        pointEditor.init();
    });


    $(window).on('unload', function() {
        _app.socket && _app.socket.disconnect();
    });

    return _app;
})(jQuery);

/**
 * Created by Chris on 9/19/13.
 */
window.pointEditor = (function (module) {
    module.scriptHandler = {
        path: '',
        scriptCompile: function () {
            var point = pointEditor.point.data,
                _id   = point._id(),
                data  = {
                    upi: _id,
                    fileName: _id,
                    script: point['Script Source File']()
                },
                $result = $('#result'),
                $commitButton  = $('#commitButton'),
                css,
                msg;

            $.ajax({
                type: 'POST',
                url: '/api/scripts/updatescript',
                data: data
            })
                .done(function (data) {
                    if (data.err || !data.hasOwnProperty('path')) {
                        if (typeof data.err === 'string') msg = data.err;
                        else msg = 'An unexpected error occurred. Please recompile and commit.';
                        css = 'none';
                    } else {
                        pointEditor.scriptHandler.path = data.path;
                        msg = 'Compile successful.';
                        css = 'inline';
                    }
                    $result.html(msg);
                    $commitButton.css('display', css);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    $result.html('An unexpected error occurred: ' + errorThrown);
                    $commitButton.css('display', 'none');
                });
        },
        scriptCommit: function () {
            var point = pointEditor.point.data,
                _id   = point._id(),
                data  = {
                    upi: _id,
                    fileName: _id,
                    path: pointEditor.scriptHandler.path
                },
                $result = $('#result'),
                msg;

            $.ajax({
                type: 'POST',
                url: '/api/scripts/commitscript',
                data: data
            })
                .done(function (data) {
                    if (data.err) {
                        msg = 'Commit failed with error: ' + data.err;
                    } else if (!data.result) {
                        msg = 'An unexpected error occurred. Please recommit.';
                    } else {
                        msg = 'Commit successful.';
                    }
                    $result.html(msg);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    $result.html('An unexpected error occurred: ' + errorThrown);
                });
        }
    };

    // Optimum Start day of week definitions
    module.ossDayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Holiday'];

    module.Point = function (data) {
        var self = this,
            options = {
                extend: {
                    "{root}": {
                        map  : function (point) {
                            for (var i in point) {
                                options.shared.mapValueType(point[i]);
                            }
                            return point;
                        },
                        unmap: function (point) {
                            for (var i in point) {
                                options.shared.unmapValueType(point[i]);
                            }
                            return point;
                        }
                    }
                },
                shared: {
                    mapValueType  : function (item) {
                        if (!!item.ValueType) {
                            switch (item.ValueType()) {
                                case 1:
                                    item.ValueNumeric = item.Value.numeric(true);
                                    break;
                                case 3:
                                    item.ValueNumeric = item.Value.numeric(false, true);
                                    break;
                                case 4:
                                    item.ValueNumeric = item.Value.numeric(false, false);
                                    break;
                                case 13:
                                    //item.isEditing = ko.observable(false);
                                    //item.edit = function () {
                                    //    item.isEditing(true);
                                    //};
                                    //item.cancelEdit = function () {
                                    //    item.isEditing(false);
                                    //};
                                    break;
                            }
                        }
                        return item;
                    },
                    unmapValueType: function (item) {
                        //typeof item.isEditing != 'undefined' && (delete item.isEditing);
                        return item;
                    }
                },
                custom: {
                    "ValueOptions": {
                        map  : function (options) {
                            var mapped = ko.observableArray(pointEditor.utility.enumToArray(options));
                            return mapped;
                        },
                        unmap: function (options) {
                            var unmapped = pointEditor.utility.arrayToValueOptions(options());
                            return unmapped;
                        }
                    }
                }
            };

        self.controls = {
            'Device Time': {
                commandTX: {
                    'Command Type': 1,
                    upi           : ko.observable()
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            }
        };
        self.issueCommand = function (commandType, data) {
            var command = data.controls[commandType]
            command.commandTX.upi(data.data._id());
            console.log(ko.toJSON(command.commandTX));
            module.socket.emit('fieldCommand', ko.toJSON(command.commandTX));
            module.socket.once('returnFromField', function (data) {
                data = $.parseJSON(data);
                console.log(data);
                if (data.err) {
                    command.commandRX.value('');
                    command.commandRX.error(data.err);
                } else {
                    command.commandRX.error('');
                    command.commandRX.value(data[commandType]);
                }
            });
        };
        self.originalData = data;
        self.data = ko.viewmodel.fromModel(data, options);
        self.errors = ko.validation.group(self.data, { deep: true });
        self.control = function() {

        };
        self.save = function () {
            var $saveBtn = $('.actiongroup>input'),
                $overlay = $('<div class="overlay"><span class="message"><div></div><span><i class="fa fa-refresh spin"></i> Saving...</span></span></div>').appendTo('body');


            //self.errors.showAllMessages();
            //if (!self.data.isValid()) return;

            if (!!window.attach && typeof window.attach.saveCallback == 'function') {
                window.attach.saveCallback.call(undefined, ko.toJSON({ newPoint: ko.viewmodel.toModel(self.data), oldPoint: self.originalData }));
                return window.close();
            }

            //prevent tampering while saving
            $saveBtn.prop('disabled', true);
            $('body').css('overflow', 'hidden');


            module.socket.emit('updatePoint', ko.toJSON({ newPoint: ko.viewmodel.toModel(self.data), oldPoint: self.originalData }));
            module.socket.once('pointUpdated', function(data){
                var msg = '',
                    hideAfter = 10;
                if (data.err) {
                    msg = data.err;
                }
                if (data.message) {
                    msg = data.message;
                }
                if (data.msg) {
                    msg = data.msg;
                }
                if (msg == 'success') {
                    hideAfter = 3;
                }
                //self.originalData = ko.viewmodel.toModel(data.point);
                Messenger().hideAll();
                Messenger().post({
                    type     : 'info',
                    message  : msg,
                    hideAfter: hideAfter
                });
                $saveBtn.prop('disabled', false);
                $overlay.remove();
                $('body').css('overflow', 'auto');
            });
        };
    };
    return module;
})(window.pointEditor);


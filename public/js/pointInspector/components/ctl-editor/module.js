/* jslint white:true */
define(['knockout', 'CM', 'text!./view.html', 'bannerJS', 'CMLang', 'CMBrackets', 'CMActiveLine', 'CMSearch', 'CMSearchCursor', 'CMDialog'], function(ko, CodeMirror, view, bannerJS) {

    ko.bindingHandlers.editor = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = ko.unwrap(valueAccessor());
            //editor doesn't scroll far enough to the right unless we
            //convert all tabs to spaces
            value = value.replace(/[\t]/g, '    ')
                //normalize line endings
                .replace(/(\r\n|\r|\n)/g, '\n');
            valueAccessor()(value);
            ko.applyBindingsToNode(element, { value: valueAccessor() });
            setTimeout(function() {
                viewModel.editor = CodeMirror.fromTextArea(element, {
                    lineNumbers             : true,
                    mode                    : "text/x-dorsett",
                    theme                   : 'mdn-like',
                    readOnly                : 'nocursor',
                    indentUnit              : 4,
                    showCursorWhenSelecting : true,
                    extraKeys               : {
                        Tab: function(cm) {
                            var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                            cm.replaceSelection(spaces);
                        }
                    }
                });
                viewModel.editor.on('contextmenu', function(editor, event) {
                    if (!viewModel.isInEditMode()) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        return false;
                    }
                });
                viewModel.editor.on('changes', function(editor) {
                   viewModel.script(viewModel.editor.getValue('\n'));
                });
            }, 1000);
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = ko.unwrap(valueAccessor());
            //editor doesn't scroll far enough to the right unless we
            //convert all tabs to spaces
            value = value.replace(/[\t]/g, '    ')
                //normalize line endings
                .replace(/(\r\n|\r|\n)/g, '\n');
            valueAccessor()(value);
            ko.applyBindingsToNode(element, { value: valueAccessor() });
        }
    };

    function ViewModel(params) {
        var self = this;
        this.root = params.rootContext;
        this.apiEndpoint = this.root.apiEndpoint;
        this.propertyName = params.propertyName;
        this.containerClass = params.containerClass;
        this.isReadOnly  = params.isReadOnly || false;
        this.data = params.data;
        this.script = this.data[this.propertyName];
        this.isInEditMode = this.root.isInEditMode;
        this.status = ko.observable('committed'); //committed, changed, compiled, error
        this.exePath = '';
        this.timeoutId = 0;

        this.editModeSubscription = this.isInEditMode.subscribe(function(isInEditMode) {
            var editor = self.editor;
            if (!self.isReadOnly) {
                editor.setOption('readOnly', isInEditMode ? false : 'nocursor');
                editor.setOption('styleActiveLine', isInEditMode);
                editor.setOption('matchBrackets', isInEditMode);
                // When we exit edit mode, update editor contents with script source (rolls back source if user selects 'Cancel')
                if (!isInEditMode) {
                    editor.setValue(self.script());
                }
            }
        });

        this.sourceChangeSubscription = this.script.subscribe(function(source) {
            //convert all tabs to spaces
            //normalize line endings
            var originalSource = self.root.point.originalData['Script Source File'].replace(/(\r\n|\r|\n)/g, '\n').replace(/[\t]/g, '    ');
            if (originalSource == source) {
                self.status('committed');
            } else {
                self.status('changed');
            }
        });

        // Force editor to refresh when we click on the 'Source' tab. This is needed for a couple of reasons. It was observed that:
        // (1) If we clicked 'Cancel' while on a tab other than 'Source', the editor did not revert back to view mode 
        //     until we clicked inside the editor.
        // (2) When the point review is first launched, we had to click in the editor before it would display properly.
        this.tabSubscription = this.root.tabTriggers.source.subscribe(function (value) {
            var containerClass = self.containerClass ? ('.' + self.containerClass) : '';
                codeMirror = containerClass + ' .CodeMirror';
            function refreshEditor () {
                if ($(codeMirror).is(':visible'))
                    self.editor.refresh();
                else {
                    self.timeoutId = window.setTimeout(refreshEditor, 50);
                }
            }
            // Clear the tab trigger so it will fire again the next time this tab is clicked
            self.root.tabTriggers.source(false);
            refreshEditor();
        });
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.compile = function () {
        var self = this,
            point = self.data,
            _id   = point._id(),
            data  = {
                upi: _id,
                fileName: _id,
                script: self.data['Script Source File']()
            },
            msg;

        $.ajax({
            type: 'POST',
            url: self.apiEndpoint + 'scripts/updatescript',
            data: data
        })
            .done(function (data) {
                if (!!data.err || !data.path) {
                    if (typeof data.err === 'string') {
                        msg = data.err;
                    } else {
                        msg = 'An unexpected error occurred. Please recompile and commit.';
                    }
                    bannerJS.showBanner(msg, null, 10000);
                    self.status('error');
                } else {
                    self.exePath = data.path;
                    msg = 'Compile successful.';
                    bannerJS.showBanner(msg, null, 3000);
                    self.status('compiled');
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                msg = 'An unexpected error occurred: ' + errorThrown;
                bannerJS.showBanner(msg, null, 10000);
                self.status('error');
            });
    };

    ViewModel.prototype.commit = function () {
        var self = this,
            point = self.data,
            _id   = point._id(),
            data  = {
                upi: _id,
                fileName: _id,
                path: self.exePath
            },
            msg;

        $.ajax({
            type: 'POST',
            url: self.apiEndpoint + 'scripts/commitscript',
            data: data
        })
            .done(function (data) {
                if (data.err) {
                    msg = 'Commit failed with error: ' + data.err;
                    self.status('error');
                } else if (!data.point) {
                    msg = 'An unexpected error occurred. Please recommit.';
                    self.status('error');
                } else {
                    msg = 'Commit successful.';
                    self.status('committed');
                }
                bannerJS.showBanner(msg, null, 10000);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                msg = 'An unexpected error occurred: ' + errorThrown;
                bannerJS.showBanner(msg, null, 10000);
                self.status('error');
            });
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        this.editModeSubscription.dispose();
        this.sourceChangeSubscription.dispose();
        this.tabSubscription.dispose();
        window.clearTimeout(this.timeoutId);
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});





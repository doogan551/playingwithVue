/*jslint white:true*/
define(['knockout', 'CM', 'text!./view.html', 'bannerJS', 'CMLang', 'CMBrackets', 'CMActiveLine', 'CMSearch', 'CMSearchCursor', 'CMDialog'], function(ko, CodeMirror, view, bannerJS) {
    var apiEndpoint,
        $scriptTabs,
        $scriptEditors,
        $saveAndActivate,
        initDone = false;

    ko.bindingHandlers.editor = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = ko.unwrap(valueAccessor()),
                allBindings = allBindingsAccessor(),
                isReadOnly = allBindings.isReadOnly || false,
                editorName = allBindings.name || 'editor';
            //editor doesn't scroll far enough to the right unless we
            //convert all tabs to spaces
            value = value.replace(/[\t]/g, '    ')
                //normalize line endings
                .replace(/(\r\n|\r|\n)/g, '\n');
            valueAccessor()(value);
            ko.applyBindingsToNode(element, { value: valueAccessor() });
            setTimeout(function() {
                viewModel[editorName] = CodeMirror.fromTextArea(element, {
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
                viewModel[editorName].on('contextmenu', function(editor, event) {
                    if (!viewModel.isInEditMode() || isReadOnly) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        return false;
                    }
                });
                viewModel[editorName].on('changes', function(editor) {
                   valueAccessor()(editor.getValue('\n'));
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

    function ScriptObject (data) {
        var self = this,
            name = data.name,
            tabClass = name + 'Tab',
            tryCount = 0,
            tryRefresh = function () {
                if (self.$codeMirror.is(':visible')) {
                    self.editor.refresh();
                    self.editor.focus();
                } else if (tryCount++ < 10) {
                    self.timeoutId = window.setTimeout(tryRefresh, 50);
                }
            };
        self.name   = name;
        self.source = data.script;
        self.editor = data.editor;
        self.$tab = $('.' + tabClass);
        self.$editor = $('.' + name + 'Editor');
        self.$codeMirror = self.$editor.find('.CodeMirror');
        self.timeoutId = 0;
        self.len = function () {
            return self.source().length;
        };
        self.refreshEditor = function () {
            tryCount = 0;
            tryRefresh();
        };
        self.selectTab = function () {
            $scriptTabs.removeClass('active');  // Remove 'active' class from both script tabs
            $scriptEditors.hide();              // Hide both editors
            
            self.$tab.addClass('active');   // Add 'active' class to selected tab
            self.$editor.show();            // Show the editor associated with the selected tab
            self.refreshEditor();           // Refresh the editor to make sure it is displayed properly

            data.viewModel.selectedScript(self);
        };
        // Attach a click handler to the script tab
        self.$tab.click(function (e) {
            if ($(e).hasClass(tabClass))
                return;
            self.selectTab();
        });
        return self;
    }

    function initEditors (vm) {
        if (!vm.productionEditor || !vm.developmentEditor) {
            window.setTimeout(function(){initEditors(vm);}, 200);
            return;
        }

        $scriptTabs    = $('.scriptTab');
        $scriptEditors = $('.scriptEditor');

        vm.productionScript = new ScriptObject({
            script: vm.data['Script Source File'],
            editor: vm.productionEditor,
            name: 'production',
            viewModel: vm
        });
        vm.developmentScript = new ScriptObject({
            script: vm.data['Development Source File'],
            editor: vm.developmentEditor,
            name: 'development',
            viewModel: vm
        });

        if (vm.productionScript.len()) {
            vm.selectedScript(vm.productionScript);
            if (!vm.developmentScript.len()) {
                vm.developmentScript.$tab.hide();
            }
        } else {
            vm.selectedScript(vm.developmentScript);
        }

        // Force our editModeSubscription to evaluate to make sure our editors are properly setup #230
        vm.isInEditMode.valueHasMutated();
        initDone = true;
    }

    function ViewModel (params) {
        var self = this,
            _developmentSourceFile = params.point.data['Development Source File']();

        apiEndpoint = params.apiEndpoint;
        this.root = params;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.isInEditMode = params.isInEditMode;

        this.showEditScriptButton = ko.observable(false);
        this.showDiscardScriptButton = ko.observable(false);
        this.buildStatus = ko.observable('changed');
        this.selectedScript = ko.observable({});

        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            permissions: ko.observable(false),
            source: ko.observable(false),
            involvement: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;

        this.showEditScript = function () {
            var developmentScript = self.developmentScript;
            
            self.showEditScriptButton(false);

            if (self.productionScript.len()) {
                self.showDiscardScriptButton(true);
            }

            if (!developmentScript.len()) {
                developmentScript.editor.setValue(self.productionScript.source()); // This also updates the self.data['Development Source File'] observable
            }
            developmentScript.$tab.show();
            developmentScript.selectTab();
        };
        this.discardScript = function () {
            var developmentScript = self.developmentScript,
                productionScript  = self.productionScript;

            // If we want to keep the script editor tab, do this:
            // developmentScript.editor.setValue(productionScript.source());

            // If we want to hide the script editor tab, we need to do all of the following:
            self.showDiscardScriptButton(false);
            developmentScript.editor.setValue(''); // This also updates the self.data['Development Source File'] 
            
            if (productionScript.len()) {
                developmentScript.$tab.hide();
                productionScript.selectTab();
                self.showEditScriptButton(true);
            }
        };

        this.sourceTabSubscription = this.tabTriggers.source.subscribe(function (value) {
            var script = self.selectedScript();
            // We have to refresh the editor to make 100% sure it is displayed correctly
            if (script.refreshEditor) script.refreshEditor();
            // Clear the tab trigger so it will fire again the next time this tab is clicked
            self.tabTriggers.source(false);
        });

        this.editModeSubscription = this.isInEditMode.subscribe(function (isInEditMode) {
            var developmentScript = self.developmentScript,
                productionScript  = self.productionScript,
                developmentEditor = developmentScript.editor;

            developmentEditor.setOption('readOnly', isInEditMode ? false : 'nocursor');
            developmentEditor.setOption('styleActiveLine', isInEditMode);
            developmentEditor.setOption('matchBrackets', isInEditMode);
            
            if (isInEditMode) {
                // If no development script is in progress, then default it to the production code
                if (!developmentScript.len()) {
                    if (developmentScript.$tab.css('display') === 'none') { // #273 - Make sure the tab is not visible
                        self.showEditScriptButton(true);
                    } else {
                        developmentScript.selectTab();
                    }
                    developmentEditor.setValue(productionScript.source()); // This also updates the self.data['Development Source File'] observable
                } else {
                    developmentScript.$tab.show();
                    developmentScript.selectTab();
                    self.showDiscardScriptButton(true);
                }
            } else {
                self.showDiscardScriptButton(false);
                self.showEditScriptButton(false);
                developmentEditor.setValue(_developmentSourceFile); // Roll back development script source
                if (!developmentScript.len() && productionScript.len()) {
                    developmentScript.$tab.hide();
                    productionScript.selectTab();
                }
            }
        });

        this.saveStatusSubscription = this.point.status.subscribe(function (saveStatus) {
            console.log('saveStatus: ', saveStatus);

            if (saveStatus === 'saving') {
                return;
            } else if (saveStatus === 'saved') {
                _developmentSourceFile = self.developmentScript.source();
            }

            if (self.buildStatus() !== 'activating') {
                return;
            }

            // If point was saved successfully
            if (saveStatus === 'saved') {
                // We activated successfully, so the development code is now production, and we have no development code
                self.developmentScript.editor.setValue("");
                // Hide the tab since we have no code
                self.developmentScript.$tab.hide();
                // Update production script editor content
                self.productionScript.editor.setValue(self.productionScript.source());
                // Select production script tab
                self.productionScript.selectTab();
                // Update build status
                self.buildStatus('activated');
            } else {
                // saveStatus must be 'error'
                // Activate failed, so we need to get our development and production code back
                // The development script code was pushed into the production script just before calling 'Save and Activate'
                self.developmentScript.source(self.productionScript.source());
                // We can get the production script code from our original data
                self.productionScript.source(self.point.originalData['Script Source File']);
                // Refresh the production script editor just to make sure it's up to date
                self.productionScript.refreshEditor();
            }
        });

        this.sourceChangeSubscription = this.data['Development Source File'].subscribe(function(source) {
            if (self.buildStatus() == 'changed')
                return;
            // Convert all tabs to spaces & normalize line endings
            var originalSource = self.root.point.originalData['Development Source File'].replace(/(\r\n|\r|\n)/g, '\n').replace(/[\t]/g, '    ');
            if (originalSource != source) {
                self.buildStatus('changed');
            }
        });

        initEditors(self);
        params.initDOM();
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.compile = function() {
        var self = this,
            point = self.data,
            data  = {
                upi:    point._id(),
                script: point['Development Source File']()
            },
            $btnCompile  = $('.btnCompile'),
            $btnIcon = $btnCompile.find('i'),
            socket = self.root.socket,
            msg;

        $btnCompile.addClass('btn-warning');
        $btnIcon.addClass('fa-spin');

        socket.emit('compileScript', data);
        socket.once('compiledScript', function (data) {
            if (!!data.err || !data.path) {
                if (typeof data.err === 'string') {
                    msg = data.err;
                } else {
                    msg = 'An unexpected error occurred. Please recompile and commit.';
                }
                bannerJS.showBanner(msg, 'OK', null, '#D50000');
                self.buildStatus('error');
            } else {
                self.exePath = data.path;
                bannerJS.showBanner('Compile successful.', null, 3000);
                self.buildStatus('compiled');
            }
            $btnIcon.removeClass('fa-spin');
            $btnCompile.removeClass('btn-warning');
        });
    };

    ViewModel.prototype.saveAndActivate = function () {
        if (this.buildStatus() !== 'compiled' || !this.exePath)
            return;
        var self = this,
            data = {
                close: true,
                extendData: { path: self.exePath }
            };
        self.productionScript.source(self.developmentScript.source());
        self.developmentScript.source("");

        self.buildStatus('activating');
        self.root.point.save(data);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        this.sourceTabSubscription.dispose();
        this.editModeSubscription.dispose();
        this.buildStatusSubscription.dispose();
        this.saveStatusSubscription.dispose();
        this.sourceChangeSubscription.dispose();
        
        // Remove timeout events
        window.clearTimeout(this.developmentScript.timeoutId);
        window.clearTimeout(this.productionScript.timeoutId);
        
        // Remove click handlers from script tabs
        $scriptTabs.unbind();
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});
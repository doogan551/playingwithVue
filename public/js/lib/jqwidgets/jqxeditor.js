/*
jQWidgets v3.4.0 (2014-June-23)
Copyright (c) 2011-2014 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function (a) {
    $.jqx.jqxWidget("jqxEditor", "", {});
    $.extend($.jqx._jqxEditor.prototype, {
        defineInstance: function () {
            this.width = null;
            this.height = null;
            this.disabled = false;
            this.pasteMode = "html";
            this.editable = true;
            this.lineBreak = "default";
            this.toolbarPosition = "top";
            this.commands =
                 {
                     "bold": { tooltip: "Bold", command: "bold", type: 'toggleButton' },
                     "italic": { tooltip: "Italic", command: "italic", type: 'toggleButton' },
                     "underline": { tooltip: "Underline", command: "underline", type: 'toggleButton' },
                     "format": {
                         placeHolder: "Format Block", tooltip: "Format Block", command: "formatblock",
                         value: [
                             { value: 'p', label: 'Paragraph' },
                             { value: 'h1', label: 'Header 1' },
                             { value: 'h2', label: 'Header 2' },
                             { value: 'h3', label: 'Header 3' },
                             { value: 'h4', label: 'Header 4' }
                         ], type: 'list', width: 120, dropDownWidth: 190, height: 25
                     },
                     "font": {
                         placeHolder: "Font", tooltip: "Font Name", command: "fontname",
                         value:
                             [
                                 { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
                                 { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
                                 { label: 'Courier New', value: '"Courier New", Courier, monospace' },
                                 { label: 'Georgia', value: "Georgia,serif" },
                                 { label: "Impact", value: "Impact,Charcoal,sans-serif" },
                                 { label: "Lucida Console", value: "'Lucida Console',Monaco,monospace" },
                                 { label: 'Tahoma', value: 'Tahoma,Geneva,sans-serif' },
                                 { label: "Times New Roman", value: "'Times New Roman',Times,serif" },
                                 { label: 'Trebuchet MS', value: '"Trebuchet MS",Helvetica,sans-serif' },
                                 { label: 'Verdana', value: "Verdana,Geneva,sans-serif" }
                             ],

                         type: 'list', width: 160, height: 25, dropDownWidth: 160
                     },
                     "size": {
                         placeHolder: "Size", tooltip: "Font Size", command: "fontsize",
                         value: [
                            { label: "1 (8pt)", value: "xx-small" },
                            { label: "2 (10pt)", value: "x-small" },
                            { label: "3 (12pt)", value: "small" },
                            { label: "4 (14pt)", value: "medium" },
                            { label: "5 (18pt)", value: "large" },
                            { label: "6 (24pt)", value: "x-large" },
                            { label: "7 (36pt)", value: "xx-large" }
                         ],
                         type: 'list', width: 45, height: 25, dropDownWidth: 160
                     },
                     "color": { tooltip: "Text Color", command: "forecolor", value: "#000", type: 'colorPicker' },
                     "background": { tooltip: "Fill Color", command: "backcolor", value: "#fff", type: 'colorPicker' },
                     "left": { tooltip: "Align Left", command: "justifyleft", type: 'toggleButton' },
                     "center": { tooltip: "Align Center", command: "justifycenter", type: 'toggleButton' },
                     "right": { tooltip: "Align Right", command: "justifyright", type: 'toggleButton' },
                     "outdent": { tooltip: "Indent Less", command: "outdent", type: 'button' },
                     "indent": { tooltip: "Indent More", command: "indent", type: 'button' },
                     "ul": { tooltip: "Insert unordered list", command: "insertunorderedlist", type: 'toggleButton' },
                     "ol": { tooltip: "Insert ordered list", command: "insertorderedlist", type: 'toggleButton' },
                     "image": { tooltip: "Insert image", command: "insertimage", type: 'button' },
                     "link": { tooltip: "Insert link", command: "createlink", type: 'toggleButton' },
                     "html": { tooltip: "View source", command: "viewsource", type: 'toggleButton' },
                     "clean": { tooltip: "Remove Formatting", command: "removeformat", type: 'button' }
                 };
            this.createCommand = null;
            this.defaultLocalization =
                {
                    "bold": "Bold",
                    "italic": "Italic",
                    "underline": "Underline",
                    "format": "Format Block",
                    "font": "Font Name",
                    "size": "Font Size",
                    "color": "Text Color",
                    "background": "Fill Color",
                    "left": "Align Left",
                    "center": "Align Center",
                    "right": "Align Right",
                    "outdent": "Indent Less",
                    "indent": "Indent More",
                    "ul": "Insert unordered list",
                    "ol": "Insert ordered list",
                    "image": "Insert image",
                    "link": "Insert link",
                    "html": "View source",
                    "clean": "Remove Formatting",
                    "Remove": "Remove",
                    "Ok": "Ok",
                    "Cancel": "Cancel",
                    "Change": "Change",
                    "Go to link": "Go to link",
                    "Open in a new window/tab": "Open in a new window/tab",
                    "Align": "Align",
                    "VSpace": "VSpace",
                    "HSpace": "HSpace",
                    "Width": "Width",
                    "Height": "Height",
                    "Title": "Title",
                    "URL": "URL",
                    "Insert Image": "Insert Image",
                    "Insert Link": "Insert Link",
                    "Alt Text": "Alt Text",
                    "not set": "&lt;not set&gt;",
                    "Left": "Left",
                    "Right": "Right",
                    "Paragraph": "Paragraph",
                    "Header": "Header",
                    "Arial": "Arial",
                    "Comic Sans MS": "Comic Sans MS",
                    "Courier New": "Courier New",
                    "Georgia": "Georgia",
                    "Impact": "Impact",
                    "Lucida Console": "Lucida Console",
                    "Tahoma": "Tahoma",
                    "Times New Roman": "Times New Roman",
                    "Trebuchet MS": "Trebuchet MS",
                    "Verdana": "Verdana"                     
                };
            this.localization = this.defaultLocalization;
            this.tools = "bold italic underline | format font size | color background | left center right | outdent indent | ul ol | image | link | clean | html"
            this.readOnly = false;
            this.stylesheets = new Array();
            this.rtl = false;
            this.colorPickerTemplate = "" +
                 '<div class="jqx-editor-color-picker">' +
                    '<div role="grid">' +
                       '<table class="jqx-editor-color-picker-table" cellspacing="0" cellpadding="0">' +
                          '<tbody>' +
                             '<tr>' +
                                '<td aria-label="RGB (0, 0, 0)">' +
                                   '<div title="RGB (0, 0, 0)" style="background-color: rgb(0, 0, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (68, 68, 68)">' +
                                   '<div title="RGB (68, 68, 68)" style="background-color: rgb(68, 68, 68);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (102, 102, 102)">' +
                                   '<div title="RGB (102, 102, 102)" style="background-color: rgb(102, 102, 102);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (153, 153, 153)">' +
                                   '<div title="RGB (153, 153, 153)" style="background-color: rgb(153, 153, 153);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (204, 204, 204)">' +
                                   '<div title="RGB (204, 204, 204)" style="background-color: rgb(204, 204, 204);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (238, 238, 238)">' +
                                   '<div title="RGB (238, 238, 238)" style="background-color: rgb(238, 238, 238);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (243, 243, 243)">' +
                                   '<div title="RGB (243, 243, 243)" style="background-color: rgb(243, 243, 243);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (255, 255, 255)">' +
                                   '<div title="RGB (255, 255, 255)" style="background-color: rgb(255, 255, 255);"></div>' +
                                '</td>' +
                             '</tr>' +
                          '</tbody>' +
                       '</table>' +
                    '</div>' +
                    '<div role="grid">' +
                       '<table class="jqx-editor-color-picker-table" cellspacing="0" cellpadding="0">' +
                          '<tbody>' +
                             '<tr>' +
                                '<td aria-label="RGB (255, 0, 0)">' +
                                   '<div title="RGB (255, 0, 0)" style="background-color: rgb(255, 0, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (255, 153, 0)">' +
                                   '<div title="RGB (255, 153, 0)" style="background-color: rgb(255, 153, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (255, 255, 0)">' +
                                   '<div title="RGB (255, 255, 0)" style="background-color: rgb(255, 255, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (0, 255, 0)">' +
                                   '<div title="RGB (0, 255, 0)" style="background-color: rgb(0, 255, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (0, 255, 255)">' +
                                   '<div title="RGB (0, 255, 255)" style="background-color: rgb(0, 255, 255);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (0, 0, 255)">' +
                                   '<div title="RGB (0, 0, 255)" style="background-color: rgb(0, 0, 255);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (153, 0, 255)">' +
                                   '<div title="RGB (153, 0, 255)" style="background-color: rgb(153, 0, 255);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (255, 0, 255)">' +
                                   '<div title="RGB (255, 0, 255)" style="background-color: rgb(255, 0, 255);"></div>' +
                                '</td>' +
                             '</tr>' +
                          '</tbody>' +
                       '</table>' +
                    '</div>' +
                    '<div role="grid">' +
                       '<table class="jqx-editor-color-picker-table" cellspacing="0" cellpadding="0">' +
                          '<tbody>' +
                             '<tr>' +
                                '<td aria-label="RGB (244, 204, 204)">' +
                                   '<div title="RGB (244, 204, 204)" style="background-color: rgb(244, 204, 204);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (252, 229, 205)">' +
                                   '<div title="RGB (252, 229, 205)" style="background-color: rgb(252, 229, 205);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (255, 242, 204)">' +
                                   '<div title="RGB (255, 242, 204)" style="background-color: rgb(255, 242, 204);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (217, 234, 211)">' +
                                   '<div title="RGB (217, 234, 211)" style="background-color: rgb(217, 234, 211);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (208, 224, 227)">' +
                                   '<div title="RGB (208, 224, 227)" style="background-color: rgb(208, 224, 227);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (207, 226, 243)">' +
                                   '<div title="RGB (207, 226, 243)" style="background-color: rgb(207, 226, 243);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (217, 210, 233)">' +
                                   '<div title="RGB (217, 210, 233)" style="background-color: rgb(217, 210, 233);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (234, 209, 220)">' +
                                   '<div title="RGB (234, 209, 220)" style="background-color: rgb(234, 209, 220);"></div>' +
                                '</td>' +
                             '</tr>' +
                             '<tr>' +
                                '<td id="T-Kw-Jn88" aria-label="RGB (234, 153, 153)">' +
                                   '<div title="RGB (234, 153, 153)" style="background-color: rgb(234, 153, 153);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (249, 203, 156)">' +
                                   '<div title="RGB (249, 203, 156)" style="background-color: rgb(249, 203, 156);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (255, 229, 153)">' +
                                   '<div title="RGB (255, 229, 153)" style="background-color: rgb(255, 229, 153);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (182, 215, 168)">' +
                                   '<div title="RGB (182, 215, 168)" style="background-color: rgb(182, 215, 168);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (162, 196, 201)">' +
                                   '<div title="RGB (162, 196, 201)" style="background-color: rgb(162, 196, 201);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (159, 197, 232)">' +
                                   '<div title="RGB (159, 197, 232)" style="background-color: rgb(159, 197, 232);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (180, 167, 214)">' +
                                   '<div title="RGB (180, 167, 214)" style="background-color: rgb(180, 167, 214);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (213, 166, 189)">' +
                                   '<div title="RGB (213, 166, 189)" style="background-color: rgb(213, 166, 189);"></div>' +
                                '</td>' +
                             '</tr>' +
                             '<tr>' +
                                '<td aria-label="RGB (224, 102, 102)">' +
                                   '<div title="RGB (224, 102, 102)" style="background-color: rgb(224, 102, 102);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (246, 178, 107)">' +
                                   '<div title="RGB (246, 178, 107)" style="background-color: rgb(246, 178, 107);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (255, 217, 102)">' +
                                   '<div title="RGB (255, 217, 102)" style="background-color: rgb(255, 217, 102);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (147, 196, 125)">' +
                                   '<div title="RGB (147, 196, 125)" style="background-color: rgb(147, 196, 125);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (118, 165, 175)">' +
                                   '<div title="RGB (118, 165, 175)" style="background-color: rgb(118, 165, 175);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (111, 168, 220)">' +
                                   '<div title="RGB (111, 168, 220)" style="background-color: rgb(111, 168, 220);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (142, 124, 195)">' +
                                   '<div title="RGB (142, 124, 195)" style="background-color: rgb(142, 124, 195);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (194, 123, 160)">' +
                                   '<div title="RGB (194, 123, 160)" style="background-color: rgb(194, 123, 160);"></div>' +
                                '</td>' +
                             '</tr>' +
                             '<tr>' +
                                '<td id="T-Kw-Jn104" aria-label="RGB (204, 0, 0)">' +
                                   '<div title="RGB (204, 0, 0)" style="background-color: rgb(204, 0, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (230, 145, 56)">' +
                                   '<div title="RGB (230, 145, 56)" style="background-color: rgb(230, 145, 56);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (241, 194, 50)">' +
                                   '<div title="RGB (241, 194, 50)" style="background-color: rgb(241, 194, 50);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (106, 168, 79)">' +
                                   '<div title="RGB (106, 168, 79)" style="background-color: rgb(106, 168, 79);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (69, 129, 142)">' +
                                   '<div title="RGB (69, 129, 142)" style="background-color: rgb(69, 129, 142);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (61, 133, 198)">' +
                                   '<div title="RGB (61, 133, 198)" style="background-color: rgb(61, 133, 198);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (103, 78, 167)">' +
                                   '<div title="RGB (103, 78, 167)" style="background-color: rgb(103, 78, 167);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (166, 77, 121)">' +
                                   '<div title="RGB (166, 77, 121)" style="background-color: rgb(166, 77, 121);"></div>' +
                                '</td>' +
                             '</tr>' +
                             '<tr>' +
                                '<td aria-label="RGB (153, 0, 0)">' +
                                   '<div title="RGB (153, 0, 0)" style="background-color: rgb(153, 0, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (180, 95, 6)">' +
                                   '<div title="RGB (180, 95, 6)" style="background-color: rgb(180, 95, 6);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (191, 144, 0)">' +
                                   '<div title="RGB (191, 144, 0)" style="background-color: rgb(191, 144, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (56, 118, 29)">' +
                                   '<div title="RGB (56, 118, 29)" style="background-color: rgb(56, 118, 29);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (19, 79, 92)">' +
                                   '<div title="RGB (19, 79, 92)" style="background-color: rgb(19, 79, 92);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (11, 83, 148)">' +
                                   '<div title="RGB (11, 83, 148)" style="background-color: rgb(11, 83, 148);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (53, 28, 117)">' +
                                   '<div title="RGB (53, 28, 117)" style="background-color: rgb(53, 28, 117);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (116, 27, 71)">' +
                                   '<div title="RGB (116, 27, 71)" style="background-color: rgb(116, 27, 71);"></div>' +
                                '</td>' +
                             '</tr>' +
                             '<tr>' +
                                '<td aria-label="RGB (102, 0, 0)">' +
                                   '<div title="RGB (102, 0, 0)" style="background-color: rgb(102, 0, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (120, 63, 4)">' +
                                   '<div title="RGB (120, 63, 4)" style="background-color: rgb(120, 63, 4);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (127, 96, 0)">' +
                                   '<div title="RGB (127, 96, 0)" style="background-color: rgb(127, 96, 0);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (39, 78, 19)">' +
                                   '<div title="RGB (39, 78, 19)" style="background-color: rgb(39, 78, 19);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (12, 52, 61)">' +
                                   '<div title="RGB (12, 52, 61)" style="background-color: rgb(12, 52, 61);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (7, 55, 99)">' +
                                   '<div title="RGB (7, 55, 99)" style="background-color: rgb(7, 55, 99);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (32, 18, 77)">' +
                                   '<div title="RGB (32, 18, 77)" style="background-color: rgb(32, 18, 77);"></div>' +
                                '</td>' +
                                '<td aria-label="RGB (76, 17, 48)">' +
                                  '<div title="RGB (76, 17, 48)" style="background-color: rgb(76, 17, 48);"></div>' +
                               '</td>' +
                             '</tr>' +
                          '</tbody>' +
                       '</table>' +
                    '</div>' +
                 '</div>';
            this.touchMode = false;
            this.events = ['change'];
        },

        createInstance: function (args) {
            var that = this;
            this.textArea = this.host;
            var isContentEditable = this.host.attr('contenteditable');
            this.host.addClass(this.toThemeProperty('jqx-widget'));
            if (isContentEditable == true || isContentEditable == "true") {
                this.inline = true;
                this.widget = this.host;
                this.editorDocument = document;
                this.selection = new jqxSelection(this.editorDocument);
                var toolbar = $("<div class='jqx-editor-toolbar-container' unselectable='on' aria-label='Formatting options' role='toolbar'><div class='jqx-editor-toolbar'></div>");
                toolbar.insertBefore(this.host);
                this.toolbarContainer = toolbar;
                this.toolbar = toolbar.find('.jqx-editor-toolbar');
                this.editor = this.host;
                this.contentEditableElement = this.element;
            }
            else {
                var editor = $("<div class='jqx-editor'><div class='jqx-editor-container'><div class='jqx-editor-toolbar-container' aria-label='Formatting options' role='toolbar'><div class='jqx-editor-toolbar'></div></div><div class='jqx-editor-content'><iframe  src='javascript:void(0)' allowtransparency='true' frameborder='0'></iframe></div></div></div>");
                this.widget = editor;
                this.widget[0].className = this.widget[0].className  + " " + this.element.className;
                try
                {
                    this.widget[0].style = this.element.style;
                }
                catch (error) {
                }

                var content = $.trim(this.host.html()) + "&#8203;";
                if (this.lineBreak == "default" || this.lineBreak == "div") {
                    content = "<div>" + content + "</div>";
                }
                else if (this.lineBreak == "p") {
                    content = "<p>" + content + "</p>";
                }

                content = content.replace(/&lt;/ig, '<');
                content = content.replace(/&gt;/ig, '>');


                this.host.css('display', 'none');
                this.host.after(editor);
                editor.find('iframe').after(this.host);
                this.container = editor.find('.jqx-editor-container');
                this.toolbarContainer = editor.find('.jqx-editor-toolbar-container');
                this.toolbar = editor.find('.jqx-editor-toolbar');
                this.iframe = editor.find('iframe');
                this.content = editor.find('.jqx-editor-content');

                this.editorDocument = this.iframe[0].contentWindow.document;
                this.selection = new jqxSelection(this.editorDocument);

                if (!$.jqx.browser.mozilla) {
                    this.editorDocument.designMode = 'On';
                }
                this.editorDocument.open();
                var rtlStyle = this.rtl ? "direction:rtl;" : "";
                var selectionStyle = $.jqx.browser.msie ? "::selection{color: #fff; background: #328EFD;};" +
                            "::-moz-selection{color: #fff; background: #328eD;};" +
                            "::selection:window-inactive {background: #c7c7c7; color: #000;}" +
                            "::-moz-selection:window-inactive {background: #c7c7c7; color: #000;}" +
                            "html{font-size:13px; height:100%;}body{padding-top:1px;margin-top:-1px; padding-right: 1px; overflow-x: hidden;" +
                            "word-wrap: break-word;-webkit-nbsp-mode: space;-webkit-line-break: after-white-space;"
                : "";
                this.editorDocument.write(
                        "<!DOCTYPE html><html><head>" +
                        "<meta charset='utf-8' />" +
                        "<style>" +
                            "html,body{padding:0; margin:0; font-size: 13px; font-family:Verdana,Geneva,sans-serif; background:#fff; min-height:100%;}" +
                            selectionStyle +
                            rtlStyle +
                            "}" +
                            "h1{font-size:2em;margin:.67em 0}" +
                            "h2{font-size: 1.5em; margin: .75em 0}" +
                            "h3{font-size: 1.17em; margin: .83em 0}" +
                            "h4{font-size:1em; margin: 1.12em 0 }" +
                            "h5{font-size: .83em; margin: 1.5em 0}" +
                            "h6{font-size: .75em; margin: 1.67em 0}" +
                            "p{margin: 0px;padding:0 .2em}" +
                            "ul,ol{padding-left:2.5em}" +
                            "a{color:#00a}" +
                            "code{font-size:1.23em}" +
                            ".jqx-editor-paste-element {position: absolute; left: -1000px; height: 1px; overflow: hidden; top: -1000px;}" +
                            ".jqx-editor-focus {border: 1px solid #aaa !important;}" +
                        "</style>" +
                       $.map(this.stylesheets, function (href) {
                           return "<link rel='stylesheet' href='" + href + "'>";
                       }).join("") +
                        "</head><body autocorrect='off' contenteditable='true'></body></html>"
                    );
                    this.contentEditableElement = this.editorDocument.body;
   
                    if (this.host.is('textarea')) {
                        this._textArea = this.element;
                        var hostData = this.host.data();
                        hostData.jqxEditor.host = editor;
                        hostData.jqxEditor.element = editor[0];

                        this.element = editor[0];
                        editor[0].id = this._textArea.id;
                        this._textArea.id = this._textArea.id + "TextArea";
                        $(this.element).addClass(this.toThemeProperty('jqx-widget'));
                        this.host = $(this.element);
                        this.host.data(hostData);
                    }
                try {
                    
              //old      this.editorDocument.execCommand("useCSS", false, true);
                    this.editorDocument.execCommand("useCSS", false, false);
                    this.editorDocument.execCommand("enableInlineTableEditing", null, false);
                }
                catch (e) {
                }
                try {
              // old      this.editorDocument.execCommand("styleWithCSS", 0, false);
                    this.editorDocument.execCommand("styleWithCSS", 0, true);
                }
                catch (e) {
                }

                this.editorDocument.close();
                this.editor = $(this.editorDocument.body);
                this.editor.html(content).attr('spellcheck', false).attr('autocorrect', 'off');
                $.jqx.utilities.resize(editor, function () {
                    that.widget.css('width', that.width);
                    that.widget.css('height', that.height);
                    that._arrange();
                });
            }
        },

        focus: function()
        {
            if ($.jqx.browser.mozilla) {
                if (!this.focused) {
                    if (this.iframe) {
                        this.iframe.focus();
                    }
                    this.selection.selectNode(this.editor[0].firstChild, true);
                    this.selection.getRange().collapse(true);
                }
            }
            this.editor.focus();
            var range = this.range != null ? this.range : this.getRange();
            this.selectRange(range);
        },

        print: function () {
            var oPrntWin = window.open("", "_blank", "width=450,height=470,left=400,top=100,menubar=yes,toolbar=no,location=no,scrollbars=yes");
            oPrntWin.document.open();
            oPrntWin.document.write("<!doctype html><html><head><title>Print<\/title><\/head><body onload=\"print();\">" + this.val() + "<\/body><\/html>");
            oPrntWin.document.close();
        },

        refresh: function (initialRefresh) {
            var that = this;
            $.each(this.defaultLocalization, function (index, value) {
                if (!that.localization[index]) {
                    that.localization[index] = value;
                }
            });
            this._removeHandlers();
            this.toolbar.addClass(this.toThemeProperty('jqx-widget-header'));
            if (this.content) {
                this.widget.css('width', this.width);
                this.widget.css('height', this.height);
                this.widget.addClass(this.toThemeProperty("jqx-editor"));
                this.widget.addClass(this.toThemeProperty("jqx-widget"));
                this.widget.addClass(this.toThemeProperty("jqx-rc-all"));
                this.widget.addClass(this.toThemeProperty("jqx-widget-header"));
                this.content.addClass(this.toThemeProperty('jqx-widget-content'));
                this.container.addClass(this.toThemeProperty('jqx-editor-container'));
            }
            else {
                this.toolbarContainer.addClass(this.toThemeProperty('jqx-widget-header'));
                this.toolbarContainer.addClass(this.toThemeProperty("jqx-editor-toolbar-inline"));
                this.toolbarContainer.addClass(this.toThemeProperty("jqx-widget"));
                this.toolbarContainer.addClass(this.toThemeProperty("jqx-rc-all"));
                this.toolbarContainer.hide();
                this.toolbarContainer.css('position', 'absolute');
                this.editor.addClass(this.toThemeProperty("jqx-editor-inline"));
                this.toolbarContainer.css('width', this.host.outerWidth() + 'px');
            }
            var index = this.toolbarContainer.index();
            if (this.toolbarPosition == "top" && index != 0 || this.toolbarPosition == "bottom" && index != 1) {
                switch (this.toolbarPosition) {
                    case "bottom":
                        this.toolbarContainer.insertAfter(this.content);
                        break;
                    case "top":
                    default:
                        this.toolbarContainer.insertBefore(this.content);
                        break;
                }
            }

            var toolsValue = this.tools;
            // render toolbar.
            if (toolsValue !== false) {
                var tools = toolsValue.split(" ");
                var toolGroups = toolsValue.split(" | ");

                var addTools = function (ownerElement, tools) {
                    $.each(tools, function (index, value) {
                        var tool = that.commands[this];
                        if (!tool) {
                            if (that.createCommand) {
                                tool = that.createCommand(this.toString());
                                if (!tool) {
                                    return true;
                                }
                                if (!that.commands[this]) {
                                    that.commands[this] = tool;
                                }
                            }
                            else {
                                return true;
                            }
                        }
                        else if (that.createCommand) {
                            var toolExt = that.createCommand(this.toString());
                            tool = $.extend(tool, toolExt);
                        }

                        if (that.localization[this]) {
                            tool.tooltip = that.localization[this];
                        }
                        switch (tool.type) {
                            case 'list':
                                if (tool.widget) {
                                    tool.widget.jqxDropDownList('destroy');
                                }

                                var rendererFunc = function (index, label, value) {
                                    if (tool.command == "formatblock") {
                                        return '<' + value + ' unselectable="on" style="padding: 0px; margin: 0px;">' + label + '</' + value + '>';
                                    }
                                    else if (tool.command == "fontname") {
                                        return '<span unselectable="on" style="font-family: ' + value + ';">' + label + '<span>';
                                    }
                                    else if (tool.command == "fontsize") {
                                        return '<span unselectable="on" style="font-size: ' + value + ';">' + label + '<span>';
                                    }
                                };
                                var selectionRendererFunc = function () {
                                    var iconClass = that.toThemeProperty('jqx-editor-toolbar-icon') + " " + that.toThemeProperty('jqx-editor-toolbar-icon-' + tool.command);
                                    var icon = "<div unselectable='on' style='margin-top: 0px; padding:0px;' class='" + iconClass + "'></div>";
                                    return icon;
                                }

                                var fontRelated = tool.command == "formatblock" || tool.command == "fontname" || tool.command == "fontsize";

                                var dataValue = tool.value || [];
                                var dataSource = new Array();
                                var placeHolder = tool.placeHolder || "Please Choose:";

                                if (tool.command == "fontname") {
                                    $.each(dataValue, function () {
                                        var label = that.localization[this.label];
                                        dataSource.push({ label: label, value: this.value });
                                    });
                                }
                                else if (tool.command == "formatblock") {
                                    placeHolder = that.localization["format"];
                                    $.each(dataValue, function () {
                                        if (this.label.indexOf("Header") >= 0) {
                                            var label = this.label.replace("Header", that.localization["Header"]);
                                        }
                                        else {
                                            var label = that.localization[this.label];
                                        }
                                        dataSource.push({ label: label, value: this.value });
                                    });
                                }
                                else {
                                    dataSource = dataValue;
                                }

                                var settings = {
                                    enableBrowserBoundsDetection: true,
                                    touchMode: that.touchMode,
                                    width: tool.width || 100,
                                    height: tool.height || 25,
                                    dropDownWidth: tool.dropDownWidth || 'auto',
                                    autoDropDownHeight: (tool.value && tool.value.length) < 12 ? true : false,
                                    placeHolder: placeHolder,
                                    source: dataSource,
                                    theme: that.theme,
                                    keyboardSelection: false,
                                    focusable: false,
                                    disabled: that.disabled,
                                    rtl: that.rtl,
                                    selectionRenderer: tool.command == "fontsize" ? selectionRendererFunc : null,
                                    renderer: fontRelated ? rendererFunc : null
                                }
                                var listClass = 'jqx-disableselect ' + that.toThemeProperty('jqx-editor-dropdownlist') + " " + that.toThemeProperty('jqx-editor-toolbar-item');
                                var widget = $("<div unselectable='on' class='" + listClass + "'></div>");
                                widget.appendTo(ownerElement);
                                widget.jqxDropDownList(settings);
                                if (tool.init) {
                                    tool.init(widget);
                                }

                                var value = null;
                                var newValue = null;
                                var closeType = "";
                                that.addHandler(widget, "mousedown", function (event) {
                                    if ($('.jqx-editor-dropdownpicker').length > 0) {
                                        $('.jqx-editor-dropdownpicker').jqxDropDownButton('close');
                                    }
                                    if ($('.jqx-editor-dropdownlist').length > 0) {
                                        var lists = $('.jqx-editor-dropdownlist');
                                        $.each(lists, function (index, value) {
                                            if (value != widget[0]) {
                                                $(value).jqxDropDownList('close');
                                            }
                                        });
                                    }
                                });

                                that.addHandler(widget, "open", function (event) {
                                    if (!that.focused) {
                                        that.focus();
                                    }
                                    that.updating = true;
                                    that.activeElement = widget;
                                    value = widget.val();
                                    closeType = "";
                                });
                                that.addHandler(widget, "change", function (event) {
                                    that.updating = false;
                                    that.activeElement = null;
                                    newValue = widget.val();
                                    closeType = event.args.type;
                                    if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                                        that.focus();
                                    }
                                });
                                that.addHandler(widget, "close", function (event) {
                                    that.updating = false;
                                    that.activeElement = null;
                                    if (value != newValue) {
                                        if (closeType == "mouse" || closeType == "keyboard") {
                                            that._refreshTools();
                                        }
                                    }
                                });
                                that._addCommandHandler(widget, 'change', tool.command, null, tool);
                                break;
                            case 'colorPicker':
                                if (tool.widget) {
                                    $(tool.colorPicker).remove();
                                    tool.widget.jqxDropDownButton('destroy');
                                }
                                var picker = $('<div unselectable="on" style="padding-top: 4px;"></div>').attr('id', 'picker-' + tool.command);
                                var listClass = 'jqx-disableselect ' + that.toThemeProperty('jqx-editor-dropdownpicker') + " " + that.toThemeProperty('jqx-editor-toolbar-item');
                                var widget = $("<div unselectable='on' class='" + listClass + "'></div>");
                                widget.appendTo(ownerElement);
                                widget.append(picker);
                                widget.jqxDropDownButton({
                                    touchMode: that.touchMode,
                                    disabled: that.disabled,
                                    enableBrowserBoundsDetection: true,
                                    width: tool.width || 45,
                                    height: tool.height || 25,
                                    rtl: that.rtl,
                                    focusable: false,
                                    theme: that.theme
                                });
                                var content = $('<div unselectable="on" style="z-index: 55;">');
                                var iconClass = that.toThemeProperty('jqx-editor-toolbar-icon') + " " + that.toThemeProperty('jqx-editor-toolbar-icon-' + tool.command);
                                var icon = $("<div unselectable='on' class='" + iconClass + "'></div>");
                                content.append(icon);
                                var bar = $('<div unselectable="on" class="jqx-editor-color-bar">').attr('id', 'bar-' + tool.command).css('background-color', tool.value);
                                content.append(bar);
                                widget.jqxDropDownButton('setContent', content);
                                picker.append($(that.colorPickerTemplate));
                                tool.colorPicker = picker;
                                if (tool.init) {
                                    tool.init(widget);
                                }
                                picker.find('tr').attr('role', 'row').attr('unselectable', 'on');
                                picker.find('td').attr('role', 'gridcell').attr('unselectable', 'on').css('-webkit-user-select', 'none');
                                picker.find('div').attr('unselectable', 'on');

                                that.addHandler(widget, "mousedown", function (event) {
                                    if ($('.jqx-editor-dropdownlist').length > 0) {
                                        $('.jqx-editor-dropdownlist').jqxDropDownList('close');
                                    }
                                    if ($('.jqx-editor-dropdownpicker').length > 0) {
                                        var lists = $('.jqx-editor-dropdownpicker');
                                        $.each(lists, function (index, value) {
                                            if (value != widget[0]) {
                                                $(value).jqxDropDownButton('close');
                                            }
                                        });
                                    }
                                });

                                that.addHandler(widget, "open", function () {
                                    if (!that.focused) {
                                        that.focus();
                                    }
                                    that.updating = true;
                                    that.activeElement = picker;
                                });
                                that.addHandler(widget, "close", function (event) {
                                    that.updating = false;
                                    that.activeElement = null;
                                    if (value != newValue) {
                                        if (closeType == "mouse" || closeType == "keyboard") {
                                            that._refreshTools();
                                        }
                                    }
                                });
                                that.addHandler(picker, "keydown", function (event) {
                                    var key = event.keyCode;
                                    var activeColor = $(picker).find('.jqx-editor-color-picker-selected-cell');
                                    var rows = picker.find('tr');
                                    var rowsCount = rows.length;
                                    var columnsCount = activeColor.parent().children().length;
                                    var columnIndex = activeColor.index();
                                    var rowIndex = -999;
                                    var row = activeColor.parent();
                                    $.each(rows, function (index, value) {
                                        if (this == row[0]) {
                                            rowIndex = index;
                                            return false;
                                        }
                                    });

                                    switch (key) {
                                        case 27: // esc
                                            widget.jqxDropDownButton('close');
                                            break;
                                        case 13: // esc
                                            $(activeColor).trigger('mousedown');
                                            break;
                                        case 38: // up
                                            rowIndex--;
                                            break;
                                        case 40: // down
                                            rowIndex++;
                                            break;
                                        case 39: // right
                                            columnIndex++;
                                            break;
                                        case 37: // left
                                            columnIndex--;
                                            break;
                                    }
                                    if (rowIndex >= 0 && rowIndex <= rowsCount) {
                                        if (columnIndex >= 0 && columnIndex <= columnsCount) {
                                            var row = picker.find('tr')[rowIndex];
                                            var cell = $(row).children()[columnIndex];
                                            var color = $(cell).children().css('background-color');
                                            tool.val(color);
                                        }
                                    }

                                });
                                var pickerColors = $(picker).find('td');

                                tool.val = function (color) {
                                    var hexColor = that._rgbToHex(color);
                                    $.each(pickerColors, function () {
                                        var color = $(this).children().css('background-color');
                                        var pickerColor = that._rgbToHex(color);
                                        if (pickerColor == hexColor) {
                                            pickerColors.removeClass('jqx-editor-color-picker-selected-cell');
                                            $(this).addClass('jqx-editor-color-picker-selected-cell');
                                            $('#bar-' + tool.command).css('background', color);
                                            return false;
                                        }
                                    });
                                }
                                tool.val(tool.value);
                                that._addCommandHandler(pickerColors, 'mousedown', tool.command, null, tool);
                                break;
                            case "button":
                            case "toggleButton":
                            default:
                                if (tool.widget) {
                                    if (tool.type == "button") {
                                        tool.widget.jqxButton('destroy');
                                    }
                                    else {
                                        tool.widget.jqxToggleButton('destroy');
                                    }
                                }

                                var command = tool.command;
                                var action = tool.action;
                                var iconClass = that.toThemeProperty('jqx-editor-toolbar-icon') + " " + that.toThemeProperty('jqx-editor-toolbar-icon-' + command);
                                var icon = $("<div unselectable='on' class='" + iconClass + "'></div>");
                                var widget = $("<div unselectable='on'></div>").addClass('jqx-disableselect').addClass(that.toThemeProperty('jqx-editor-toolbar-button'));
                                if (!tool.init) {
                                    widget.append(icon);
                                }
                                else {
                                    if (command) {
                                        widget.append(icon);
                                    }
                                }

                                widget.appendTo(ownerElement);
                                if (tool.type == "button") {
                                    widget.jqxButton({
                                        disabled: that.disabled,
                                        rtl: that.rtl,
                                        theme: that.theme
                                    });
                                }
                                else if (tool.type == "toggleButton") {
                                    widget.jqxToggleButton({
                                        disabled: that.disabled,
                                        rtl: that.rtl,
                                        uiToggle: false,
                                        theme: that.theme
                                    });
                                }

                                if (tool.init) {
                                    tool.init(widget);
                                }

                                tool.toggled = false;
                                tool.toggle = function () {
                                    tool.toggled = !tool.toggled;
                                }

                                that.addHandler(widget, 'mousedown', function (event) {
                                    if (event.preventDefault) {
                                        event.preventDefault();
                                    }
                                    if (event.stopPropagation) {
                                        event.stopPropagation();
                                    }
                                    return false;
                                });
                                if (!$.jqx.mobile.isTouchDevice()) {
                                    that._addCommandHandler(widget, 'click', command, action, tool);
                                }
                                else {
                                    that._addCommandHandler(widget, 'mousedown', command, action, tool);
                                }
                                break;
                        }

                        tool.widget = widget;
                        if (widget) {
                            try {
                                if (tool.tooltip != "") {
                                    tool.widget.attr('title', tool.tooltip);
                                    tool.widget.attr('data-tooltip', tool.tooltip);
                                }

                                if (tool.command) {
                                    tool.widget.attr('data-command', tool.command);
                                }
                                tool.widget.attr('aria-label', tool.tooltip);
                            }
                            catch (error) {

                            }

                            if (tool.type == "button" || tool.type == "toggleButton") {
                                if (tools.length > 2) {
                                    if (index == 0) {
                                        widget.css('border-right-radius', '0px');
                                        widget.addClass(that.toThemeProperty('jqx-rc-l'));
                                    }
                                    else if (index == tools.length - 1){
                                        widget.css('border-left-radius', '0px');
                                        widget.addClass(that.toThemeProperty('jqx-rc-r'));
                                    }
                                    widget.removeClass(that.toThemeProperty('jqx-rc-all'));
                                }

                                if (index != 0 && index != tools.length - 1 && tools.length > 2) {
                                    widget.css('border-left-radius', '0px');
                                    widget.css('border-right-radius', '0px');
                                    widget.removeClass(that.toThemeProperty('jqx-rc-all'));
                                }
                                else if (tools.length == 2) {
                                    if (index == 0) {
                                        widget.css('border-right-radius', '0px');
                                        widget.addClass(that.toThemeProperty('jqx-rc-l'));
                                    }
                                    else {
                                        widget.css('border-left-radius', '0px');
                                        widget.addClass(that.toThemeProperty('jqx-rc-r'));
                                    }
                                    widget.removeClass(that.toThemeProperty('jqx-rc-all'));
                                }
                                else if (tools.length == 1) {
                                    widget.css('margin-right', '0px');
                                }
                            }
                        }
                    });
                }

                that.toolbar.css('direction', !this.rtl ? 'ltr' : 'rtl');

                if (toolGroups.length == 0) {
                    addTools(that.toolbar, tools);
                }
                else {
                    for (var i = 0; i < toolGroups.length; i++) {
                        var toolGroup = toolGroups[i];
                        var tools = toolGroup.split(" ");
                        var groupClass = that.toThemeProperty('jqx-editor-toolbar-group') + " " + that.toThemeProperty('jqx-fill-state-normal');
                        var ownerElement = $("<div class='" + groupClass + "'></div>");
                        ownerElement.addClass(that.toThemeProperty('jqx-rc-all'));
                        that.toolbar.append(ownerElement);
                        addTools(ownerElement, tools);
                    }
                    var groups = that.toolbar.find('.jqx-editor-toolbar-group')
                    var groupsLength = groups.length;
                    for (var i = 0; i < groupsLength; i++) {
                        if ($(groups[i]).children().length == 0) {
                            $(groups[i]).remove();
                        }
                    }
                }
                if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                    $(".jqx-editor-toolbar-group").css('float', 'left');
                    $(".jqx-editor-toolbar-group").children().css('float', 'left');
                    $(".jqx-editor-toolbar-group").css('zoom', '1');
                    $(".jqx-editor-toolbar-group").children().css('zoom', '1');
                }
            }

            this._arrange();
            this._addHandlers();
        },

        _arrange: function () {
            if (this.content) {
                if (this.tools == "" || this.tools == false) {
                    this.content.height(this.container.outerHeight() - parseInt(this.container.css('padding-top')) - parseInt(this.container.css('padding-bottom')) - 6);
                    this.content.css('margin-top', '4px');
                    this.toolbar.hide();
                }
                else {
                    this.toolbar.show();
                    this.content.css('margin-top', '0px');
                    this.content.height(this.container.outerHeight() - this.toolbar.outerHeight() - parseInt(this.container.css('padding-top')) - parseInt(this.container.css('padding-bottom')) - 2);
                    if (this.toolbarPosition != "top") {
                        this.content.css('margin-top', '4px');
                        this.content.css('margin-bottom', '0px');
                    }
                }
                if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                    this.content.css('margin-top', '4px');
                    this.content.height(this.container.height() - this.toolbar.outerHeight() - 2 * parseInt(this.container.css('padding-bottom')) - 10);
                    this.content.width(this.container.width() - 2 * parseInt(this.container.css('padding-left')) - 2);
                }
                if (this.editor.height() < this.content.height()) {
                    this.editor.height(this.content.height());
                }
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (this.isInitialized == undefined || this.isInitialized == false)
                return;

            if (key == "pasteMode" || key == "lineBreak" || key == "editable") {
                return;
            }
 
            if (key == "disabled") {
                object._refreshTools();
            }

            if (key == "width" || key == "height" || key == "toolbarPosition") {
                object._arrange();
                return;
            }

            object.refresh();
        },

        selectRange: function (range) {
            if (!range) range = this.getRange();
            this.selection.selectRange(range);
        },

        getRange: function () {
            return this.selection.getRange();
        },

        getSelectedElement: function () {
            var range, root, start, end;

            try {
                if (this.editorDocument.getSelection) {
                    var selection = this.editorDocument.getSelection();
                    range = selection.getRangeAt(selection.rangeCount - 1);
                    start = range.startContainer;
                    end = range.endContainer;
                    root = range.commonAncestorContainer;
                    if (start.nodeName == "#text") root = root.parentNode;
                    if (start.nodeName == "#text") start = start.parentNode;
                    if (start.nodeName.toLowerCase() == "body") start = start.firstChild;
                    if (end.nodeName == "#text") end = end.parentNode;
                    if (end.nodeName.toLowerCase() == "body") end = end.lastChild;
                    if (start == end) root = start;

                    return end;
                } else if (this.editorDocument.selection) {
                    range = this.editorDocument.selection.createRange()
                    if (!range.duplicate) return null;
                    root = range.parentElement();
                    var r1 = range.duplicate();
                    var r2 = range.duplicate();
                    r1.collapse(true);
                    r2.moveToElementText(r1.parentElement());
                    r2.setEndPoint("EndToStart", r1);
                    start = r1.parentElement();
                    r1 = range.duplicate();
                    r2 = range.duplicate();
                    r2.collapse(false);
                    r1.moveToElementText(r2.parentElement());
                    r1.setEndPoint("StartToEnd", r2);
                    end = r2.parentElement();
                    if (start.nodeName.toLowerCase() == "body") start = start.firstChild;
                    if (end.nodeName.toLowerCase() == "body") end = end.lastChild;

                    if (start == end) root = start;
                    return end;
                }
            }
            catch (error) {
                return null;
            }

            return null;
        },

        _addHandlers: function () {
            var that = this;
            this.addHandler(this.toolbar, "mousedown.editor" + this.element.id, function (event) {
                if (event.preventDefault)
                    event.preventDefault();
                if (event.stopPropagation)
                    event.stopPropagation();

                return false;
            });

            var blur = function () {
                if (that.host.is('textarea')) {
                    that.host.html($(this).html());
                }
                if (that.changed) {
                    that._raiseEvent("change");
                    that.changed = false;
                }
                that.focused = false;
                if (that.inline) {
                    that.host.removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                    that.host.removeClass(that.toThemeProperty('jqx-editor-inline-focus'));
                    that.toolbarContainer.fadeOut('fast');
                }
            }

            var focus = function () {
                that.focused = true;
                if (that.inline) {
                    that.host.addClass(that.toThemeProperty('jqx-fill-state-focus'));
                    that.host.addClass(that.toThemeProperty('jqx-editor-inline-focus'));
                    that.host.addClass(that.toThemeProperty('jqx-rc-all'));
                    that.toolbarContainer.fadeIn('fast');
                    var location = that.host.coord();
                    that.toolbarContainer.offset({ left: location.left, top: location.top - that.toolbarContainer.outerHeight() - 5 });
                }
            }

            if ($.jqx.browser.mozilla) {
                this.addHandler($(document), "mousedown.editor" + this.element.id, function (event) {
                    blur();
                });
            }

            this.addHandler(this.editor, "blur.editor" + this.element.id, function (event) {
                blur();
            });

            this.addHandler(this.editor, "focus.editor" + this.element.id, function (event) {
                focus();
            });

            this.addHandler(this.editor, "beforedeactivate.editor" + this.element.id, function (event) {
                that.range = that.getRange();
            });

            this.addHandler(this.editor, "mousedown.editor" + this.element.id, function (event) {
                that.range = that.getRange();
                if ($.jqx.browser.mozilla) {
                    focus();
                    event.stopPropagation();
                }

                if ($('.jqx-editor-dropdownpicker').length > 0) {
                    $('.jqx-editor-dropdownpicker').jqxDropDownButton('close');
                }
                if ($('.jqx-editor-dropdownlist').length > 0) {
                    $('.jqx-editor-dropdownlist').jqxDropDownList('close');
                }
                if (that.inline) {
                    that.editor.focus();
                }
            });
            if ($.jqx.mobile.isTouchDevice()) {
                this.addHandler($(this.editorDocument), "selectionchange.editor" + this.element.id, function()
                {
                    if (that.editorDocument.activeElement != that.editor[0])
                    {
                         window.focus();
                         that.focus();
                     }
                });
                this.addHandler($(this.editorDocument), "keydown.editor" + this.element.id, function () {
                    if (that.editorDocument.activeElement != that.editor[0]) {
                        window.focus();
                        that.focus();
                    }
                });
            }
            this.addHandler(this.editor, "mouseup.editor" + this.element.id, function (event) {
                if (that._documentMode == "source")
                    return true;

                that.range = that.getRange();
                that._refreshTools(null, true);
            });
            this.addHandler(this.editor, "keydown.editor" + this.element.id, function (event) {
                if (that._documentMode == "source")
                    return true;

                if ($.jqx.browser.mozilla) {
                    if (!that.focused) {
                        focus();
                    }
                }

                if (that.disabled)
                {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    return false;
                }

                if (that.updating) {
                    if (that.activeElement) {
                        var e = jQuery.Event("keydown");
                        $.extend(e, event);
                        that.activeElement.trigger(e);
                    }

                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    return false;
                }
                var ev = event || window.event;
                var key = ev.keyCode;
                var keyChar = String.fromCharCode(key).toLowerCase();

                if (!that.editable) {
                    var selectionCodes = [8, 9, 33, 34, 35, 36, 37, 38, 39, 40, 40, 45, 46];
                    if ($.inArray(ev.keyCode, selectionCodes) == -1 && !(ev.ctrlKey && keyChar == "c") && !(ev.ctrlKey && keyChar == "a"))
                        event.preventDefault();
                }

                if (that.selection.getText().length > 0 || that.linkPopup) {
                    var selectionCodes = [8, 9, 13, 33, 34, 35, 36, 37, 38, 39, 40, 40, 45, 46];

                    if (!$.inArray(ev.keyCode, selectionCodes) != -1
                        || (ev.keyCode == 65 && ev.ctrlKey && !ev.altKey && !ev.shiftKey)) {
                        if (that._refreshToolsTimer) clearTimeout(that._refreshToolsTimer);
                        that._refreshToolsTimer = setTimeout(function () {
                            that._refreshTools(null, true, ev.keyCode);
                        }, 10);
                    }
                }
                if (key == 13 && that.lineBreak != "default") {
                    var selectedElement = that.getSelectedElement();
                    if (selectedElement) {
                        var nodeName = selectedElement.nodeName.toLowerCase();
                        switch (nodeName) {
                            case "pre":
                            case "li":
                            case "ul":
                            case "ol":
                            case "h1":
                            case "h2":
                            case "h3":
                            case "h4":
                            case "h5":
                            case "h6":
                                return true;
                        }

                        var parent = selectedElement;
                        while (parent != null) {
                            if (parent.nodeName == "#document") {
                                parent = that.editorDocument.body;
                                break;
                            }
                            if (parent.parentNode == that.editorDocument.body || parent == that.editorDocument.body)
                                break;

                            parent = parent.parentNode;
                        }
                    }
                    if (parent) {
                        var range = that.getRange();
                        if (that.editorDocument.body.innerHTML == "<div></div>" && that.lineBreak != "br") {
                            that.selection.insertContent("&#8203;");
                        }

                        if (that.lineBreak == "div") {
                            if (parent == that.editorDocument.body) {
                                $(parent).append("<div>&#8203;</div>" + "<span id='INSERTION_MARKER'>&nbsp;</span>");
                            }
                            else {
                                $("<div>&#8203;</div>" + "<span id='INSERTION_MARKER'>&nbsp;</span>").insertAfter(parent);
                            }
                        }
                        else if (that.lineBreak == "p") {
                            if (parent == that.editorDocument.body) {
                                $(parent).append("<p>&#8203;</p>" + "<span id='INSERTION_MARKER'>&nbsp;</span>");
                            }
                            else {
                                $("<p>&#8203;</p>" + "<span id='INSERTION_MARKER'>&nbsp;</span>").insertAfter(parent);
                            }
                        }
                        else {
                            that.execute("insertHTML", "<br/>&#8203;" + "<span id='INSERTION_MARKER'>&nbsp;</span>");
                        }

                        that.selectRange(range);
                        var marker = $(that.editorDocument).find("#INSERTION_MARKER");
                        if (that.lineBreak != "br") {
                            that.selection.selectNode($(marker).prev()[0], true);
                        }
                        else {
                            that.selection.selectNode(marker[0], true);
                            if (that.getRange().setStartAfter) {
                                that.getRange().setStartAfter(marker[0]);
                            }
                        }

                        marker.remove();
                        that.selection.collapse(false);

                        if (parent && parent.nodeName && that.lineBreak == "br") {
                            if (parent.nodeName.toLowerCase() != "#text") {
                                that.selection.selectNode(parent, true);
                                if (that.getRange().setStartAfter) {
                                    that.getRange().setStartAfter(parent);
                                }
                                that.selection.collapse(false);
                            }
                        }

                        if (that.lineBreak != "br") {
                            range = that.getRange();
                            if (range.select) {
                                range.select();
                            }
                        }
                        if (event.preventDefault) {
                            event.preventDefault();
                        }
                        return false;
                    }
                }
                if (ev.ctrlKey && (keyChar == "k" || keyChar == "u" || keyChar == "b" || keyChar == "i")) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    var command = null;
                    switch (keyChar) {
                        case "k":
                            command = 'link';
                            break;
                        case "u":
                            command = 'underline';
                            break;
                        case "b":
                            command = 'bold';
                            break;
                        case "i":
                            command = 'italic';
                            break;
                    }
                    if (that.commands[command].widget) {
                        that.commands[command].widget.trigger('click');
                    }
                    return false;
                }
            });
            this.addHandler(this.editor, "paste.editor" + this.element.id, function (event) {
                if (that._documentMode == "source")
                    return true;

                if (that.readOnly)
                    return true;

                that.updating = true;
                that.readOnly = true;

                var e = event;

                var cleanHtml = function (html, plain) {
                    if (plain) {
                        if (!that.paragraphise) {
                            html = html.replace(/\n/g, "<br />");
                        }
                        else {
                            html = "<p>" + html + "<\/p>";
                            html = html.replace(/\n/g, "<\/p><p>");
                            html = html.replace(/<p>\s<\/p>/gi, '');
                        }
                    }
                    else {
                        // remove body and html tag
                        html = html.replace(/<html[^>]*?>(.*)/gim, "$1");
                        html = html.replace(/<\/html>/gi, '');
                        html = html.replace(/<body[^>]*?>(.*)/gi, "$1");
                        html = html.replace(/<\/body>/gi, '');

                        // remove style, meta and link tags
                        html = html.replace(/<style[^>]*?>[\s\S]*?<\/style[^>]*>/gi, '');
                        html = html.replace(/<(?:meta|link)[^>]*>\s*/gi, '');

                        // remove XML elements and declarations
                        html = html.replace(/<\\?\?xml[^>]*>/gi, '');

                        // remove w: tags with contents.
                        html = html.replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '');

                        // remove tags with XML namespace declarations: <o:p><\/o:p>
                        html = html.replace(/<o:p>\s*<\/o:p>/g, '');
                        html = html.replace(/<o:p>[\s\S]*?<\/o:p>/g, '&nbsp;');
                        html = html.replace(/<\/?\w+:[^>]*>/gi, '');

                        // remove comments [SF BUG-1481861].
                        html = html.replace(/<\!--[\s\S]*?-->/g, '');
                        html = html.replace(/<\!\[[\s\S]*?\]>/g, '');

                        // remove mso-xxx styles.
                        html = html.replace(/\s*mso-[^:]+:[^;"']+;?/gi, '');

                        // remove styles.
                        html = html.replace(/<(\w[^>]*) style='([^\']*)'([^>]*)/gim, "<$1$3");
                        html = html.replace(/<(\w[^>]*) style="([^\"]*)"([^>]*)/gim, "<$1$3");

                        // remove margin styles.
                        html = html.replace(/\s*margin: 0cm 0cm 0pt\s*;/gi, '');
                        html = html.replace(/\s*margin: 0cm 0cm 0pt\s*"/gi, "\"");

                        html = html.replace(/\s*text-indent: 0cm\s*;/gi, '');
                        html = html.replace(/\s*text-indent: 0cm\s*"/gi, "\"");

                        html = html.replace(/\s*text-align: [^\s;]+;?"/gi, "\"");

                        html = html.replace(/\s*page-break-before: [^\s;]+;?"/gi, "\"");

                        html = html.replace(/\s*font-variant: [^\s;]+;?"/gi, "\"");

                        html = html.replace(/\s*tab-stops:[^;"']*;?/gi, '');
                        html = html.replace(/\s*tab-stops:[^"']*/gi, '');

                        // remove font face attributes.
                        html = html.replace(/\s*face="[^"']*"/gi, '');
                        html = html.replace(/\s*face=[^ >]*/gi, '');

                        html = html.replace(/\s*font-family:[^;"']*;?/gi, '');
                        html = html.replace(/\s*font-size:[^;"']*;?/gi, '');

                        // remove class attributes
                        html = html.replace(/<(\w[^>]*) class=([^ |>]*)([^>]*)/gi, "<$1$3");

                        // remove "display:none" attributes.
                        html = html.replace(/<(\w+)[^>]*\sstyle="[^"']*display\s?:\s?none[\s \S]*?<\/\1>/ig, '');

                        // remove empty styles.
                        html = html.replace(/\s*style='\s*'/gi, '');
                        html = html.replace(/\s*style="\s*"/gi, '');

                        html = html.replace(/<span\s*[^>]*>\s*&nbsp;\s*<\/span>/gi, '&nbsp;');

                        html = html.replace(/<span\s*[^>]*><\/span>/gi, '');

                        // remove align attributes
                        html = html.replace(/<(\w[^>]*) align=([^ |>]*)([^>]*)/gi, "<$1$3");

                        // remove lang attributes
                        html = html.replace(/<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3");

                        html = html.replace(/<span([^>]*)>([\s\S]*?)<\/span>/gi, '$2');

                        html = html.replace(/<font\s*>([\s\S]*?)<\/font>/gi, '$1');

                        html = html.replace(/<(u|i|strike)>&nbsp;<\/\1>/gi, '&nbsp;');

                        html = html.replace(/<h\d>\s*<\/h\d>/gi, '');

                        // remove language attributes
                        html = html.replace(/<(\w[^>]*) language=([^ |>]*)([^>]*)/gi, "<$1$3");

                        // remove onmouseover and onmouseout events (from MS word comments effect)
                        html = html.replace(/<(\w[^>]*) onmouseover="([^\"']*)"([^>]*)/gi, "<$1$3");
                        html = html.replace(/<(\w[^>]*) onmouseout="([^\"']*)"([^>]*)/gi, "<$1$3");

                        // the original <Hn> tag sent from word is something like this: <Hn style="margin-top:0px;margin-bottom:0px">
                        html = html.replace(/<h(\d)([^>]*)>/gi, '<h$1>');

                        // word likes to insert extra <font> tags, when using IE. (Weird).
                        html = html.replace(/<(h\d)><font[^>]*>([\s\S]*?)<\/font><\/\1>/gi, '<$1>$2<\/$1>');
                        html = html.replace(/<(h\d)><em>([\s\S]*?)<\/em><\/\1>/gi, '<$1>$2<\/$1>');

                        // i -> em, b -> strong - doesn't match nested tags e.g <b><i>some text</i></b> - not possible in regexp 
                        // @see - http://stackoverflow.com/questions/1721223/php-regexp-for-nested-div-tags etc.
                        html = html.replace(/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>');
                        html = html.replace(/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>');

                        // remove "bad" tags
                        html = html.replace(/<\s+[^>]*>/gi, '');

                        // remove empty <span>s (ie. no attributes, no reason for span in pasted text)
                        // done twice for nested spans
                        html = html.replace(/<span>([\s\S]*?)<\/span>/gi, '$1');
                        html = html.replace(/<span>([\s\S]*?)<\/span>/gi, '$1');

                        // remove empty <div>s (see span)
                        html = html.replace(/<div>([\s\S]*?)<\/div>/gi, '$1');
                        html = html.replace(/<div>([\s\S]*?)<\/div>/gi, '$1');

                        // remove empty tags (three times, just to be sure - for nested empty tags).
                        // This also removes any empty anchors
                        html = html.replace(/<([^\s>]+)(\s[^>]*)?>\s*<\/\1>/g, '');
                        html = html.replace(/<([^\s>]+)(\s[^>]*)?>\s*<\/\1>/g, '');
                        html = html.replace(/<([^\s>]+)(\s[^>]*)?>\s*<\/\1>/g, '');

                        if (html.trim) {
                            html = html.trim();
                        }

                        // Convert <p> to <br />
                        if (!that.paragraphise) {
                            html.replace(/<p>/gi, '<br />');
                            html.replace(/<\/p>/gi, '');
                        }
                            // Check if in paragraph - this fixes FF3.6 and it's <br id=""> issue
                        else {
                            var check = html.substr(0, 2);
                            if ('<p' !== check) {
                                html = '<p>' + html + '</p>';
                                // Replace breaks with paragraphs
                                html = html.replace(/\n/g, "<\/p><p>");
                                html = html.replace(/<br[^>]*>/gi, '<\/p><p>');
                            }
                        }

                        // Make it valid xhtml
                        html = html.replace(/<br>/gi, '<br />');

                        // remove <br>'s that end a paragraph here.
                        html = html.replace(/<br[^>]*><\/p>/gim, '</p>');

                        // remove empty paragraphs - with just a &nbsp; (or whitespace) in (and tags again for good measure)
                        html = html.replace(/<p>&nbsp;<\/p>/gi, '');
                        html = html.replace(/<p>\s<\/p>/gi, '');
                        html = html.replace(/<([^\s>]+)(\s[^>]*)?>\s*<\/\1>/g, '');

                        html = html.replace(/MsoNormal/gi, "");
                        html = html.replace(/<\/?meta[^>]*>/gi, "");
                        html = html.replace(/<\/?xml[^>]*>/gi, "");
                        html = html.replace(/<\?xml[^>]*\/>/gi, "");
                        html = html.replace(/<!--(.*)-->/gi, "");
                        html = html.replace(/<!--(.*)>/gi, "");
                        html = html.replace(/<!(.*)-->/gi, "");
                        html = html.replace(/<w:[^>]*>(.*)<\/w:[^>]*>/gi, '');
                        html = html.replace(/<w:[^>]*\/>/gi, '');
                        html = html.replace(/<\/?w:[^>]*>/gi, "");
                        html = html.replace(/<m:[^>]*\/>/gi, '');
                        html = html.replace(/<m:[^>]>(.*)<\/m:[^>]*>/gi, '');
                        html = html.replace(/<o:[^>]*>(.*)<\/o:[^>]*>/gi, '');
                        html = html.replace(/<o:[^>]*\/>/gi, '');
                        html = html.replace(/<\/?m:[^>]*>/gi, "");
                        html = html.replace(/style=\"([^>]*)\"/gi, "");
                        html = html.replace(/style=\'([^>]*)\'/gi, "");
                        html = html.replace(/class=\"(.*)\"/gi, "");
                        html = html.replace(/class=\'(.*)\'/gi, "");
                        html = html.replace(/<b>/gi, '<strong>');
                        html = html.replace(/<\/b>/gi, '<\/strong>');
                        html = html.replace(/<p[^>]*>/gi, '<p>');
                        html = html.replace(/<\/p[^>]*>/gi, '<\/p>');
                        html = html.replace(/<span[^>]*>/gi, '');
                        html = html.replace(/<\/span[^>]*>/gi, '');
                        html = html.replace(/<st1:[^>]*>/gi, '');
                        html = html.replace(/<\/st1:[^>]*>/gi, '');
                        html = html.replace(/<font[^>]*>/gi, '');
                        html = html.replace(/<\/font[^>]*>/gi, '');
                        html = html.replace('  ', '');
                        html = html.replace(/<strong><\/strong>/gi, '');
                        html = html.replace(/<p><\/p>/gi, '');
                        html = html.replace(/\/\*(.*)\*\//gi, '');
                        html = html.replace(/<!--/gi, "");
                        html = html.replace(/-->/gi, "");
                        html = html.replace(/<style[^>]*>[^<]*<\/style[^>]*>/gi, '');


                        html = html.trim();
                    }

                    return html;
                };

                var oldRange = that.getRange();
                if (that.pasteMode == "text") {
                    that.selection.insertContent('<textarea cols="50" contenteditable="false" class="jqx-editor-paste-element"></textarea>');
                }
                else {
                    that.selection.insertContent('<div class="jqx-editor-paste-element">&nbsp;</div>');
                }
                var marker = $(that.editorDocument).find(".jqx-editor-paste-element");

                if (that.editor[0].createTextRange) {
                    event.preventDefault();
                    var textRange = that.editor[0].createTextRange();
                    textRange.moveToElementText(marker[0]);
                    textRange.execCommand('Paste');
                }
                else {
                    var range = that.editorDocument.createRange();
                    range.selectNodeContents(marker[0]);
                    that.selectRange(range);
                }
                if (that.pasteMode == "text") {
                    marker.select();
                }
                that.marker = marker;
                setTimeout(function () {
                    that.selectRange(oldRange);

                    var buildFragment = function (html) {
                        var container = that.editorDocument.createElement('div');
                        var fragment = that.editorDocument.createDocumentFragment();
                        container.innerHTML = html;

                        while (container.firstChild) {
                            fragment.appendChild(container.firstChild);
                        }

                        return fragment;
                    }

                    if (that.pasteMode != "text") {
                        var fragment = buildFragment(that.marker.html());

                        if (fragment.firstChild && fragment.firstChild.className === "jqx-editor-paste-element") {
                            var fragmentsHtml = [];
                            for (var i = 0, l = fragment.childNodes.length; i < l; i++) {
                                fragmentsHtml.push(fragment.childNodes[i].innerHTML);
                            }

                            fragment = buildFragment(fragmentsHtml.join('<br />'));
                        }

                        var div = document.createElement('div');
                        div.appendChild(fragment.cloneNode(true));
                        var html = div.innerHTML;
                    }
                    else {
                        var html = that.marker.val();
                        if (that.marker.html() != "" && that.marker.val().indexOf('\n') == -1) {
                            var html = that.marker.html();
                            html = html.replace(/&nbsp;/gm, "");
                            html = html.replace(/\n\n/gm, "\n");
                            html = html.replace(/<br[^>]*>/gi, '\n');
                            that.marker.html(html);
                            var html = that.marker.text();
                        }
                    }
                    var txtPastetClean = cleanHtml(html, that.pasteMode == "text");
                    var range = that.getRange();
                    that.selection.insertContent(txtPastetClean + "<span id='INSERTION_MARKER'>&nbsp;</span>");
                    that.marker.remove();
                    var marker = $(that.editorDocument).find("#INSERTION_MARKER");
                    that.selection.selectNode(marker[0], true);
                    if (that.getRange().setStartAfter) {
                        that.getRange().setStartAfter(marker[0]);
                    }
                    marker.remove();
                    that.selection.collapse(false);
                    marker.removeAttr('id');
                    that._refreshTools();
                }, 100);

                that.updating = false;
                that.readOnly = false;
            });

            this.addHandler(this.editor, "keyup.editor" + this.element.id, function (event) {
                if (that._documentMode == "source")
                    return true;

                if (that.updating || that.disabled || !that.editable) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    if (event.stopPropagation) {
                        event.stopPropagation();
                    }
                    return false;
                }

                that.range = that.getRange();
                that.changed = true;
                var ev = event || window.event;
                var key = ev.keyCode;
                var selectionCodes = [8, 9, 13, 33, 34, 35, 36, 37, 38, 39, 40, 40, 45, 46];

                if ($.inArray(ev.keyCode, selectionCodes) != -1
                    || (ev.keyCode == 65 && ev.ctrlKey && !ev.altKey && !ev.shiftKey)) {
                    that._refreshTools(null, true, ev.keyCode);
                }
            });

            this.addHandler(this.editor, "click.editor" + this.element.id, function (event) {
                if (that._documentMode == "source")
                    return true;

                if (that.editImage) {
                    $(that.editImage).removeClass('jqx-editor-focus');
                    that.editImage = null;
                }
                if (event.target.tagName.toLowerCase() == 'img') {
                    var image = event.target;
                    that.editImage = image;
                    $(that.editImage).addClass('jqx-editor-focus');
                }
            });
            this.addHandler(this.editor, "dblclick.editor" + this.element.id, function (event) {
                if (that._documentMode == "source")
                    return true;

                if (event.target.tagName.toLowerCase() == 'img') {
                    var image = event.target;
                    if ($(".jqx-editor-image-window").length > 0) {
                        that.editImage = image;
                        that._updateImageWindow();
                    }
                }
            });
        },

        _updateLinkWindow: function () {
            var that = this;
            var linkWindow = $(".jqx-editor-link-window");
            linkWindow.jqxWindow({ position: { center: that.widget } });
            linkWindow.jqxWindow('open');
            var inputs = linkWindow.find('input');
            var checkbox = linkWindow.find('.jqx-editor-link-checkbox');
            var btnOK = linkWindow.find('button:first');
            var btnRemove = $(linkWindow.find('button')[1]);

            if (that.editLink && that.editLink.href) {
                inputs[0].value = that.editLink.href || "";
                inputs[1].value = $(that.editLink).text() || that.editLink.href;
                checkbox.val($(that.editLink).attr('target') == "_blank");
                btnRemove.show();
            }
            else {
                inputs[0].value = "";
                inputs[1].value = "";
                if (!that.selection.isCollapsed()) {
                    var text = that.selection.getText();
                    if (text.match(/^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i)) {
                        inputs[0].value = text;
                    }
                    else {
                        inputs[1].value = text;
                    }
                }
                checkbox.val(false);
                btnRemove.hide();
            }
            if (inputs[0].value.length > 0) {
                btnOK.jqxButton({ disabled: false });
            }
            else {
                btnOK.jqxButton({ disabled: true });
            }
        },

        _updateImageWindow: function () {
            var that = this;
            var image = this.editImage;
            if (!image) image = $("<img>")[0];

            var imageWindow = $(".jqx-editor-image-window");
            imageWindow.jqxWindow({ position: { center: that.widget } });
            imageWindow.jqxWindow('open');
            var inputs = imageWindow.find('input');

            var btnRemove = $(imageWindow.find('button')[1]);
         
            if (that.editImage) {
                btnRemove.show();
            }
            else {
                btnRemove.hide();
            }

            inputs[0].value = image.src;
            if (inputs[0].value == "") inputs[0].value = "";
            inputs[1].value = image.alt;
            if (image.style.width != "auto") {
                inputs[2].value = image.style.width;
            }
            else inputs[2].value = "";
            if (image.style.height != "auto") {
                inputs[3].value = image.style.height;
            }
            else inputs[3].value = "";
            if (image.style.marginLeft && image.style.marginLeft != "0px") {
                inputs[4].value = image.style.marginLeft;
            }
            else inputs[4].value = "";

            if (image.style.marginTop && image.style.marginTop != "0px") {
                inputs[5].value = image.style.marginTop;
            }
            else inputs[5].value = "";

            var align = imageWindow.find('.jqx-editor-align');
            var imgFloat = $(image).css('float');
            if (imgFloat == "left") {
                align.jqxDropDownList({ selectedIndex: 1 });
            }
            else if (imgFloat == "right") {
                align.jqxDropDownList({ selectedIndex: 2 });
            }
            else align.jqxDropDownList({ selectedIndex: 0 });
        },

        _removeHandlers: function () {
            if (this.editor) {
                this.removeHandler(this.editor, 'blur.editor' + this.element.id);
                this.removeHandler(this.editor, 'focus.editor' + this.element.id);
                this.removeHandler(this.editor, 'click.editor' + this.element.id);
                this.removeHandler(this.editor, 'mousedown.editor' + this.element.id);
                this.removeHandler(this.editor, 'mouseup.editor' + this.element.id);
                this.removeHandler(this.editor, 'keyup.editor' + this.element.id);
                this.removeHandler(this.editor, 'keydown.editor' + this.element.id);
                this.removeHandler(this.editor, 'beforedeactivate.editor' + this.element.id);
                this.removeHandler(this.editor, 'dblclick.editor' + this.element.id);
            }
            if (this.toolbar) {
                this.removeHandler(this.toolbar, 'mousedown.editor' + this.element.id);
            }
        },

        getParentByTag: function (a, b) {
            var b = b.toLowerCase(), c = a;
            do
                if (b == "" || c.nodeName.toLowerCase() == b)
                    return c;
            while (c = c.parentNode);
            return a
        },

        isStyleProperty: function (a, b, c, d) {
            var b = b.toLowerCase(), e = a;
            do
                if (e.nodeName.toLowerCase() == b && e.style[c] == d)
                    return !0;
            while (e = e.parentNode);
            return !1
        },

        setStyleProperty: function (a, b) {
            this.style[b] = !1;
            var c = this.getParentByTag(a, b);
            c && c.tagName.toLowerCase() == b && (this.style[b] = !0);
            if (b == "del" && this.getParentByTag(a, "strike") && this.getParentByTag(a, "strike").tagName.toLowerCase() == "strike")
                this.style.del = !0
        },

        updateStyle: function (el) {
            var el = this.getSelectedElement() ? this.getSelectedElement() : el;
            if (!el || !this.setStyleProperty) return;
            try {
                if (window.getComputedStyle) {
                    if (el.nodeName.toLowerCase() == "#text") el = this.editor[0];

                    var st = window.getComputedStyle(el, null);
                    var fw = ((st.getPropertyValue("font-weight") == 401) ? 700 : st.getPropertyValue("font-weight"));
                    this.style = {
                        fontStyle: st.getPropertyValue("font-style"),
                        fontSize: st.getPropertyValue("font-size"),
                        textDecoration: st.getPropertyValue("text-decoration"),
                        fontWeight: fw,
                        fontFamily: st.getPropertyValue("font-family"),
                        textAlign: st.getPropertyValue("text-align"),
                        color: this._rgbToHex(st.color),
                        backColor: this._rgbToHex(st.backgroundColor)
                    };
                    this.style.fontStyle = st.getPropertyValue("font-style");
                    this.style.vAlign = st.getPropertyValue("vertical-align");
                    this.style.del = this.isStyleProperty(el, "span", "textDecoration", "line-through");
                    this.style.u = this.isStyleProperty(el, "span", "textDecoration", "underline");

                    var getActualBackgroundColor = function (elem) {
                        var transparentColor = "transparent";
                        var rgba = "rgba(0, 0, 0, 0)";
                        while (elem && (window.getComputedStyle(elem).backgroundColor == transparentColor || window.getComputedStyle(elem).backgroundColor == rgba))
                            elem = elem.parentNode;
                        return elem ? window.getComputedStyle(elem).backgroundColor : transparentColor;
                    }
                    if (!this.style.backColor) {
                        this.style.backColor = this._rgbToHex(getActualBackgroundColor(el));
                    }
                }
                else {
                    var st = el.currentStyle;
                    this.style = {
                        fontStyle: st.fontStyle,
                        fontSize: st.fontSize,
                        textDecoration: st.textDecoration,
                        fontWeight: st.fontWeight,
                        fontFamily: st.fontFamily,
                        textAlign: st.textAlign,
                        color: this._rgbToHex(st.color),
                        backColor: this._rgbToHex(st.backgroundColor)
                    };
                }
                this.setStyleProperty(el, "h1");
                this.setStyleProperty(el, "h2");
                this.setStyleProperty(el, "h3");
                this.setStyleProperty(el, "h4");
                this.setStyleProperty(el, "h5");
                this.setStyleProperty(el, "h6");
                this.setStyleProperty(el, "del");
                this.setStyleProperty(el, "sub");
                this.setStyleProperty(el, "sup");
                this.setStyleProperty(el, "u");
                if (el.nodeName.toLowerCase() == "a") {
                    if (this.style.textDecoration == "underline") {
                        this.style.u = true;
                    }
                }

                if (this.style.h1 || this.style.h2 || this.style.h3 || this.style.h4 || this.style.h5 || this.style.h6)
                    this.style.heading = true;
            }
            catch (e) { return null }
        },

        _refreshTools: function (el, navigate, key) {
            if (this.updating)
                return;

            var that = this;
            var el = this.getSelectedElement() ? this.getSelectedElement() : el;
            if (!el || !this.setStyleProperty) return;
            this.updateStyle(el);

            var s = this.readOnly;
            this.readOnly = true;

            if (this.tools !== false) {
                var tools = this.tools.split(" ");
                var toolGroups = this.tools.split(" | ");

                var resetTools = function (tools) {
                    $.each(tools, function (index, value) {
                        var tool = that.commands[this];
                        if (!tool) {
                            return true;
                        }

                        switch (tool.type) {
                            case 'list':
                                tool.widget.jqxDropDownList('clearSelection');
                                tool.widget.jqxDropDownList({ disabled: that.disabled });
                                break;
                            case 'colorPicker':
                                tool.val(tool.value);
                                tool.widget.jqxDropDownButton({ disabled: that.disabled });
                                break;
                            case "toggleButton":
                                tool.widget.jqxToggleButton('unCheck');
                                tool.widget.jqxToggleButton({ disabled: that.disabled });
                                break;
                            case "button":
                            default:
                                tool.widget.jqxButton({ disabled: that.disabled });
                                break;
                        }
                    });
                }

                if (toolGroups.length == 0) {
                    resetTools(tools);
                }
                else {
                    for (var i = 0; i < toolGroups.length; i++) {
                        var toolGroup = toolGroups[i];
                        var tools = toolGroup.split(" ");
                        resetTools(tools);
                    }
                }

                if (this.style) {
                    var updateTools = function (tools) {
                        $.each(tools, function (index, value) {
                            var tool = that.commands[this];
                            if (!tool) {                         
                                return true;
                            }
                            if (tool.refresh) {
                                tool.refresh(tool.widget, that.style);
                                return true;
                            }

                            switch (tool.type) {
                                case 'list':
                                    if (tool.command == "fontname") {
                                        var fontNameIndex = -1;
                                        var oldValueIndex = 999;
                                        for (var i = 0; i < tool.value.length; i++) {
                                            var value = tool.value[i].label.toLowerCase();
                                            var valueIndex = that.style.fontFamily.toLowerCase().indexOf(value);

                                            if (valueIndex >= 0) {
                                                if (valueIndex < oldValueIndex) {
                                                    fontNameIndex = i;
                                                }
                                                oldValueIndex = Math.min(oldValueIndex, valueIndex);
                                            }
                                        }
                                        tool.widget.jqxDropDownList('selectIndex', fontNameIndex);
                                    }
                                    else if (tool.command == "formatblock") {
                                        var value = null;
                                        if (that.style.h1) value = "h1";
                                        else if (that.style.h2) value = "h2";
                                        else if (that.style.h3) value = "h3";
                                        else if (that.style.h4) value = "h4";
                                        else if (that.style.h5) value = "h5";
                                        else if (that.style.h6) value = "h6";
                                        tool.widget.jqxDropDownList('selectItem', value);
                                    }
                                    else if (tool.command == "fontsize") {
                                        var fontSizes = 'xx-small,x-small,small,medium,large,x-large,xx-large'.split(',');
                                        var size = -1;
                                        try {
                                            var size = el.getAttribute('size') - 1;
                                            if (size == -1) size = that.editorDocument.queryCommandValue(tool.command) - 1;
                                        }
                                        catch (er) {
                                        }
                                        var fontSize = fontSizes[size];
                                        tool.widget.val(fontSize);
                                    }
                                    break;
                                case 'colorPicker':                             
                                    var toColor = function (input) {
                                        if (typeof input != "number") {
                                            return input;
                                        }

                                        return "rgb(" + (input & 0xFF) + ", " +
                                                        ((input & 0xFF00) >> 8) + ", " +
                                                        ((input & 0xFF0000) >> 16) + ")";
                                    }
                                    var color = toColor(that.editorDocument.queryCommandValue(tool.command));
                                    if (tool.command == "backcolor") {
                                        if (that.style.backColor == null) {
                                            color = "#FFFFFF";
                                        }
                                    }

                                    var commandColor = that._rgbToHex(color);
                                    if (commandColor) {
                                        tool.val(commandColor);
                                    }
                                    else {
                                        if (tool.command == "forecolor") {
                                            tool.val(that.style.color);
                                        }
                                        else if (tool.command == "backcolor") {
                                            tool.val(that.style.backColor);
                                        }
                                    }
                                    break;
                                case "toggleButton":
                                    if (tool.command == "viewsource") {
                                        return;
                                    }

                                    if (!tool.command) {
                                        return;
                                    }
                                    var formatted = false;
                                    var toggled = that.editorDocument.queryCommandState(tool.command) && that.editorDocument.queryCommandEnabled(tool.command);

                                    if (that.linkPopup) that.linkPopup.remove();
                                    if (tool.command == "createlink" && el.nodeName.toLowerCase() == "a") {
                                        var isLink = true;
                                        if ($(el).text().indexOf(that.selection.getText()) == -1 && that.selection.getText() != "") {
                                            isLink = false;
                                        }
                                        if (isLink) {
                                            toggled = true;
                                            that.linkPopup = $("<div class='jqx-editor-link-popup' contentEditable='false' style='overflow: hidden; white-space: nowrap; padding: 5px; height: 17px; font-size: 12px; color: #222222; background: #F5F5F5; position: absolute; z-index: 9999;'>"
                                               + "" + that.localization['Go to link'] + ": <a target='_blank' style='color:#222222;' href='" + el.href + "'>" + el.href + "</a>"
                                               + " - <a style='color:#222222;' href='#change'>" + that.localization['Change'] + "</a>"
                                               + " - <a style='color:#222222;' href='#remove'>" + that.localization['Remove'] + "</a>"
                                               + "</div>").appendTo(that.editor);
                                            var elOffset = $(el).coord();
                                            var left = elOffset.left;
                                            if (elOffset.left + that.linkPopup.width() > that.editor.width()) {
                                                left = that.editor.width() - that.linkPopup.width() - 15;
                                            }
                                            that.linkPopup.offset({ top: $(el).height() + elOffset.top + 5, left: left });
                                            that.addHandler(that.linkPopup, 'mousedown', function (event) {
                                                if (event.target && event.target.href) {
                                                    var index = $(event.target).index();
                                                    switch (index) {
                                                        case 1:
                                                            that.editor.focus();
                                                            that.selection.selectNode(el, true);
                                                            that.commands['link'].widget.trigger('click');
                                                            break;
                                                        case 2:
                                                            try {
                                                                that.editor.focus();
                                                                that.selection.selectNode(el);
                                                                that.execute('unlink');
                                                                that.commands["underline"].toggled = false;
                                                                that.selection.collapse(false);
                                                                that._refreshTools();
                                                            }
                                                            catch (er) {
                                                            }
                                                            break;
                                                        default:
                                                            window.open(event.target.href, "_blank");
                                                            break;
                                                    }
                                                }
                                                if (event.preventDefault) {
                                                    event.preventDefault();
                                                }
                                                if (event.stopPropagation) {
                                                    event.stopPropagation();
                                                }
                                                return false;
                                            });
                                        }
                                    }

                                    if (tool.command == "bold") {
                                        if (that.style.fontWeight && (that.style.fontWeight >= 600 || that.style.fontWeight == "bold")) {
                                            formatted = true;
                                        }
                                        if (that.selection.isCollapsed()) {
                                            tool.toggled = toggled;
                                        }
                                        else {
                                            tool.toggled = toggled || formatted;
                                        }

                                        toggled = tool.toggled;
                                    }
                                    else if (tool.command == "italic") {
                                        if (that.style.fontStyle && that.style.fontStyle == "italic") {
                                            formatted = true;
                                        }
                                        if (!navigate) {
                                            toggled = tool.toggled;
                                        }
                                        else tool.toggled = toggled;
                                    }
                                    else if (tool.command == "underline") {
                                        if (that.style.u) {
                                            formatted = true;
                                        }
                                        if (!navigate) {
                                            toggled = tool.toggled;
                                        }
                                        else tool.toggled = toggled;
                                    }
                                    else if (tool.command == "justifyleft") {
                                        if (that.style.textAlign == "left") {
                                            formatted = true;
                                        }
                                    }
                                    else if (tool.command == "justifyright") {
                                        if (that.style.textAlign == "right") {
                                            formatted = true;
                                        }
                                    }
                                    else if (tool.command == "justifycenter") {
                                        if (that.style.textAlign == "center") {
                                            formatted = true;
                                        }
                                    }
                                    else if (tool.command == "justifyfull") {
                                        if (that.style.textAlign == "justify") {
                                            formatted = true;
                                        }
                                    }
                                    else $.each(that.style, function (index, value) {
                                        if (tool.command == index.toLowerCase()) {
                                            formatted = true;
                                        }
                                    });

                                    var isActive = toggled;

                                    if (formatted && tool.command.indexOf('justify') != -1) {
                                        tool.widget.jqxToggleButton('check');
                                    }
                                    else {
                                        if (isActive) {
                                            tool.widget.jqxToggleButton('check');
                                        }
                                        else if (formatted && that.range.collapsed === false) {
                                            tool.widget.jqxToggleButton('check');
                                        }
                                        else if ($.jqx.browser.msie && $.jqx.browser.version < 9 && formatted && !that.selection.isCollapsed()) {
                                            tool.widget.jqxToggleButton('check');
                                        }
                                    }

                                    break;
                                case "button":
                                default:
                                    if (tool.refresh) {
                                        tool.refresh(tool.widget, that.style);
                                    }
                                    break;
                            }
                        });
                    }

                    if (toolGroups.length == 0) {
                        updateTools(tools);
                    }
                    else {
                        for (var i = 0; i < toolGroups.length; i++) {
                            var toolGroup = toolGroups[i];
                            var tools = toolGroup.split(" ");
                            updateTools(tools);
                        }
                    }
                }
            }

            this.readOnly = s;
        },

        _rgbToHex: function (color) {
            if (color) {
                if (color.substr(0, 1) === "#") {
                    if (color.length == 4) {
                        var r = color.substr(1, 1);
                        var g = color.substr(2, 1);
                        var b = color.substr(3, 1);
                        return "#" + r + r + g + g + b + b;
                    }

                    return color;
                }
                var nums = /(.*?)rgb\((\d+),\s*(\d+),\s*(\d+)\)/i.exec(color);
                if (!nums) {
                    return null;
                }

                var r = parseInt(nums[2], 10).toString(16);
                var g = parseInt(nums[3], 10).toString(16);
                var b = parseInt(nums[4], 10).toString(16);
                return "#" + (
                    (r.length == 1 ? "0" + r : r) +
                    (g.length == 1 ? "0" + g : g) +
                    (b.length == 1 ? "0" + b : b)
                );
            }
            return null;
        },

        _preventDefault: function (event, close) {
            if (close !== false) {
                if ($('.jqx-editor-dropdownpicker').length > 0) {
                    $('.jqx-editor-dropdownpicker').jqxDropDownButton('close');
                }
                if ($('.jqx-editor-dropdownlist').length > 0) {
                    $('.jqx-editor-dropdownlist').jqxDropDownList('close');
                }
            }

            if (event.preventDefault) {
                event.preventDefault();
            }
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            event.cancelBubble = true;
            event.returnValue = false;
        },

        _addCommandHandler: function (item, event, cmd, data, tool) {
            var that = this;

            if (!cmd && tool.init) {
                cmd = "custom";
            }

            switch (cmd) {
                case 'custom':
                    switch (tool.type) {
                        case "list":
                            action = function (event) {
                                if (that._documentMode != "source") {
                                    if (event.args.type != "none") {
                                        tool.value = $(this).val();
                                        that.execute("custom", tool);
                                        if (!that.readOnly) {
                                            that._refreshTools();
                                        }
                                    }
                                }
                                that._preventDefault(event, false);
                            }
                            break;
                        case "colorPicker":
                            action = function (event) {
                                if (that._documentMode != "source") {
                                    var pickerColors = $(tool.colorPicker).find('td').removeClass('jqx-editor-color-picker-selected-cell');
                                    if (event.target.nodeName.toLowerCase() == "div") {
                                        var color = $(event.target).css('background-color');
                                        $(event.target).parent().addClass('jqx-editor-color-picker-selected-cell');
                                    }
                                    else {
                                        var color = $(event.target).find('div').css('background-color');
                                        $(event.target).addClass('jqx-editor-color-picker-selected-cell');
                                    }


                                    $('#bar-' + cmd).css('background', color);
                                    tool.widget.val = function () {
                                        var toColor = function (input) {
                                            if (typeof input != "number") {
                                                return input;
                                            }

                                            return "rgb(" + (input & 0xFF) + ", " +
                                                            ((input & 0xFF00) >> 8) + ", " +
                                                            ((input & 0xFF0000) >> 16) + ")";
                                        }
                                        var c = toColor(color);
                                        var hexColor = that._rgbToHex(c);
                                        return hexColor;
                                    }
                                    tool.widget.jqxDropDownButton('close');
                                    that.execute("custom", tool);
                                }
                                that._preventDefault(event);
                                return false;
                            }
                            break;
                        case "button":
                        case "toggleButton":
                        default:
                            action = function (event) {
                                if ($('.jqx-editor-dropdownpicker').length > 0) {
                                    $('.jqx-editor-dropdownpicker').jqxDropDownButton('close');
                                }
                                if ($('.jqx-editor-dropdownlist').length > 0) {
                                    $('.jqx-editor-dropdownlist').jqxDropDownList('close');
                                }

                                that._preventDefault(event);

                                var command = $(this).attr('data-command');
                                var obj = this;

                                if (that._documentMode != "source") {                                   
                                    if (tool.toggle) {
                                        tool.toggle();
                                    }
                                    that.execute("custom", tool);
                                    that._refreshTools();
                                }
                                return false;
                            };
                            break;
                    }
                    break;
                case 'formatblock':
                    action = function (event) {
                        if (that._documentMode != "source") {
                            if (event.args.type != "none") {
                                that.execute($(this).attr('data-command'), "<" + $(this).val() + ">", tool);
                                if (!that.readOnly) {
                                    that.commands["bold"].toggled = false;
                                    that._refreshTools();
                                }
                            }
                        }
                        that._preventDefault(event, false);
                    }
                    break;
                case 'fontsize':
                    action = function (event) {
                        if (that._documentMode != "source") {
                            if (event.args.type != "none") {
                                var val = $(this).val();
                                var fontSizes = 'xx-small,x-small,small,medium,large,x-large,xx-large'.split(',');

                                var fontSize = $(this).jqxDropDownList('getSelectedIndex') + 1;
                                var fontSize = 1+fontSizes.indexOf(val);
                                that.execute($(this).attr('data-command'), fontSize, tool);
                            }
                        }
                        that._preventDefault(event, false);
                    }
                    break;
                case 'fontname':
                    action = function (event) {
                        if (that._documentMode != "source") {
                            if (event.args.type != "none") {
                                var val = $(this).val();
                                that.execute($(this).attr('data-command'), val, tool);
                            }
                        }
                        that._preventDefault(event, false);
                    }
                    break;
                case 'forecolor':
                case 'backcolor':
                    action = function (event) {
                        if (that._documentMode != "source") {
                            var pickerColors = $(tool.colorPicker).find('td').removeClass('jqx-editor-color-picker-selected-cell');
                            if (event.target.nodeName.toLowerCase() == "div") {
                                var color = $(event.target).css('background-color');
                                $(event.target).parent().addClass('jqx-editor-color-picker-selected-cell');
                            }
                            else {
                                var color = $(event.target).find('div').css('background-color');
                                $(event.target).addClass('jqx-editor-color-picker-selected-cell');
                            }


                            $('#bar-' + cmd).css('background', color);
                            tool.widget.jqxDropDownButton('close');
                            that.execute(cmd, color, tool);
                        }
                        that._preventDefault(event);
                        return false;
                    }
                    break;
                case 'viewsource':
                    action = function (event) {
                        if (that.linkPopup) that.linkPopup.remove();
                        tool.toggle();
                        that.setMode(tool.toggled);
                        if ($('.jqx-editor-dropdownpicker').length > 0) {
                            $('.jqx-editor-dropdownpicker').jqxDropDownButton('close');
                        }
                        if ($('.jqx-editor-dropdownlist').length > 0) {
                            $('.jqx-editor-dropdownlist').jqxDropDownList('close');
                        }

                        that._preventDefault(event);
                        return false;
                    }
                    break;
                case 'insertimage':
                    {
                        action = function (event) {
                            that._insertImageAction(event, that, tool);
                        }
                    }
                    break;
                case 'createlink':
                    action = function (event)
                    {
                        that._createLinkAction(event, that, tool);
                    }
                    break;
                default:
                    action = function (event) {
                        if ($('.jqx-editor-dropdownpicker').length > 0) {
                            $('.jqx-editor-dropdownpicker').jqxDropDownButton('close');
                        }
                        if ($('.jqx-editor-dropdownlist').length > 0) {
                            $('.jqx-editor-dropdownlist').jqxDropDownList('close');
                        }

                        that._preventDefault(event);

                        var command = $(this).attr('data-command');
                        var obj = this;

                        if (that._documentMode != "source") {
                            if (command == "underline") {
                                if (that.getSelectedElement()) {
                                    var selectedElement = that.getSelectedElement();
                                    if (selectedElement && selectedElement.nodeName.toLowerCase() == "a") {
                                        if (tool.toggled) {
                                            $(selectedElement).css('text-decoration', "none");
                                        }
                                        else {
                                            $(selectedElement).css('text-decoration', "underline");
                                        }
                                        tool.toggle();
                                        that._refreshTools();
                                        return false;
                                    }
                                }
                            }
                            if (tool.toggle) {
                                tool.toggle();
                            }
                            that.execute(command, $(this).val(), tool);
                            that._refreshTools();
                        }
                        return false;
                    };
                    break;
            }
            that.addHandler(item, event, action);
            return false;
        },

        _createLinkAction: function (event, that, tool) {
            var that = this;
            if (that._documentMode == "source") {
                that._preventDefault(event);
                return;
            }

            if (!that.focused) {
                that.editor.focus();
            }

            that.range = that.getRange();
            var el = that.getSelectedElement();

            if (el.nodeName.toLowerCase() == "a") {
                that.editLink = el;
            }
            else
                that.editLink = null;


            if ($(".jqx-editor-link-window").length > 0) {
                if (that.editLink) {
                    that.selection.selectNode(el, true);
                }
                that._updateLinkWindow();
                that._preventDefault(event);
                return false;
            }
            var template = $("<div class='jqx-editor-window jqx-editor-link-window'><div>" + that.localization['Insert Link'] + "</div><div>"
                + "<table style='border-collapse: separate; border-spacing: 2px;'>"
                + "<tr>"
                + "<td align='right'>" + that.localization['URL'] + ":</td><td><input style='width: 200px; height: 23px;' value=''/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'>" + that.localization['Title'] + ":</td><td><input style='width: 200px; height: 23px;' value=''/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'></td><td><div class='jqx-editor-link-checkbox'>" + that.localization['Open in a new window/tab'] + "</div></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'></td><td align='right'><button>Ok</button><button style='margin-left: 5px;'>Remove</button><button style='margin-left: 5px;'>Cancel</button></td>"
                + "<tr/>"
                + "</table>"
                + "</div></div>");


            var inputs = template.find('input');
            inputs.addClass(that.toThemeProperty('jqx-widget'));
            inputs.addClass(that.toThemeProperty('jqx-widget-content'));
            inputs.addClass(that.toThemeProperty('jqx-input'));
            var checkbox = template.find('.jqx-editor-link-checkbox').jqxCheckBox({ theme: that.theme, height: 23, width: 180 });
            var btnOK = template.find('button:first').jqxButton({
                theme: that.theme, disabled: true
            });
            var btnRemove = $(template.find('button')[1]).jqxButton({
                theme: that.theme
            });
            var btnCancel = template.find('button:last').jqxButton({
                theme: that.theme
            });
            btnOK.val(this.localization['Ok']);
            btnCancel.val(this.localization['Cancel']);
            btnRemove.val(this.localization['Remove']);

            this.addHandler(btnCancel, !$.jqx.mobile.isTouchDevice() ? 'click' : $.jqx.mobile.getTouchEventName('touchstart'), function (event) {
                that.editor.focus();
                that.selectRange(that.range);
                that._refreshTools();
                that._preventDefault(event);
            });

            if (!that.editLink || (that.editLink && !that.editLink.href)) {
                btnRemove.hide();
            }

            var updateTextInput = false;

            this.addHandler($(inputs[0]), "focus", function () {
                if (inputs[1].value == "" || inputs[1].value == inputs[0].value) {
                    updateTextInput = true;
                }
                else updateTextInput = false;
            });

            this.addHandler($(inputs[1]), "keyup", function (event) {
                if (event.keyCode) {
                    if (event.keyCode == 13) {
                        btnOK.trigger('click');
                    }
                    if (event.keyCode == 27) {
                        btnCancel.trigger('click');
                    }
                }
            });

            this.addHandler($(inputs[0]), "keyup change", function (event) {
                if (inputs[0].value.length > 0) {
                    btnOK.jqxButton({ disabled: false });
                }
                else {
                    btnOK.jqxButton({ disabled: true });
                }
                if (updateTextInput) {
                    inputs[1].value = inputs[0].value;
                }
                if (event.keyCode) {
                    if (event.keyCode == 13) {
                        btnOK.trigger('click');
                    }
                    if (event.keyCode == 27) {
                        btnCancel.trigger('click');
                    }
                }
            });

            this.addHandler(btnRemove, !$.jqx.mobile.isTouchDevice() ? 'click' : $.jqx.mobile.getTouchEventName('touchstart'), function (event) {
                template.jqxWindow('close');
                try {
                    that.editor.focus();
                    that.selection.selectNode(that.editLink);
                    that.execute('unlink');
                    that.selection.collapse(false);
                    that.commands["underline"].toggled = false;
                    that._refreshTools();
                }
                catch (er) {
                }

                that._preventDefault(event);
            });


            this.addHandler(btnOK, !$.jqx.mobile.isTouchDevice() ? 'click' : $.jqx.mobile.getTouchEventName('touchstart'), function (event) {
                var inputs = template.find('input');
                var link = $('<a>' + (inputs[1].value || inputs[0].value) + '</a>');
                if (checkbox.val()) {
                    link.attr('target', '_blank');
                }

                link[0].href = $.trim(inputs[0].value);
                if (inputs[0].value.indexOf('http') == -1 && inputs[0].value.indexOf('mailto') == -1) {
                    link[0].href = "http://" + $.trim(inputs[0].value);
                }

                if (!that.focused) {
                    that.editor.focus();
                }

                if (that.range) {
                    that.selectRange(that.range);
                }

                that.execute('insertHTML', "" + link[0].outerHTML + "" + "<span id='INSERTION_MARKER'>&nbsp;</span>", tool);
                that.editor.focus();
                var marker = $(that.editorDocument).find("#INSERTION_MARKER");
                that.selection.selectNode(marker[0], true);
                if (that.getRange().setStartAfter) {
                    that.getRange().setStartAfter(marker[0]);
                }
                marker.remove();
                that.selection.collapse(false);

                that._refreshTools();

                that._preventDefault(event);
            });

            that.updating = true;
            template.appendTo(document.body);
            that.addHandler(template, 'open', function () {
                that.updating = true;
                setTimeout(function () {
                    that.range = that.getRange();
                    $(inputs[0]).focus();
                }, 25);
            });
            template.jqxWindow({ resizable: false, width: 280, okButton: btnOK, cancelButton: btnCancel, theme: that.theme, isModal: true, position: { center: that.widget } });
            that.addHandler(template, 'close', function () {
                that.updating = false;
            });

            if (!that.focused) {
                that.editor.focus();
                that.selectRange(that.range);
            }
            if (that.editLink) {
                inputs[0].value = that.editLink.href || "";
                inputs[1].value = $(that.editLink).text();;
                checkbox.val($(that.editLink).attr('target') == "_blank");
            }
            else {
                if (!that.selection.isCollapsed()) {
                    var text = that.selection.getText();
                    if (text.match(/^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i)) {
                        inputs[0].value = text;
                    }
                    else {
                        inputs[1].value = text;
                    }
                }
            }
            if (inputs[0].value.length > 0) {
                btnOK.jqxButton({ disabled: false });
            }
            else {
                btnOK.jqxButton({ disabled: true });
            }
            that._preventDefault(event);
            return false;
        },

        _insertImageAction: function (event, that, tool) {
            if (that._documentMode == "source") {
                that._preventDefault(event);
                return;
            }

            if ($(".jqx-editor-image-window").length > 0) {
                that._updateImageWindow();
                that._preventDefault(event);
                return false;
            }
            var template = $("<div class='jqx-editor-window jqx-editor-image-window'><div>" + that.localization['Insert Image'] + "</div><div>"
                + "<table style='border-collapse: separate; border-spacing: 2px;'>"
                + "<tr>"
                + "<td align='right'>" + that.localization['URL'] + ":</td><td><input style='width: 180px; height: 23px;' value=''/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'>" + that.localization['Alt Text'] + ":</td><td><input style='width: 180px; height: 23px;' value=''/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'>" + that.localization['Width'] + ":</td><td><input style='width: 180px; height: 23px;' value=''/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'>" + that.localization['Height'] + ":</td><td><input style='width: 180px; height: 23px;' value=''/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'>" + that.localization['HSpace'] + ":</td><td><input style='width: 180px; height: 23px;' class='jqx-editor-hspace'/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'>" + that.localization['VSpace'] + ":</td><td><input style='width: 180px; height: 23px;' class='jqx-editor-vspace'/></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'>" + that.localization['Align'] + ":</td><td><div class='jqx-editor-align'></div></td>"
                + "<tr/>"
                + "<tr>"
                + "<td align='right'></td><td align='right'><button>Ok</button><button style='margin-left: 5px;'>Remove</button><button style='margin-left: 5px;'>Cancel</button></td>"
                + "<tr/>"
                + "</table>"
                + "</div></div>");
            var inputs = template.find('input');
            inputs.addClass(that.toThemeProperty('jqx-widget'));
            inputs.addClass(that.toThemeProperty('jqx-widget-content'));
            inputs.addClass(that.toThemeProperty('jqx-input'));
            template.find('.jqx-editor-align').jqxDropDownList({ autoDropDownHeight: true, selectedIndex: 0, theme: that.theme, height: 23, width: 180, source: [that.localization['not set'], that.localization['Left'], that.localization['Right']] });
            var btnOK = template.find('button:first').jqxButton({
                theme: that.theme
            });
            var btnCancel = template.find('button:last').jqxButton({
                theme: that.theme
            });
            var btnRemove = $(template.find('button')[1]).jqxButton({
                theme: that.theme
            });
            btnOK.val(this.localization['Ok']);
            btnCancel.val(this.localization['Cancel']);
            btnRemove.val(this.localization['Remove']);

            btnRemove.hide();

            this.addHandler(btnRemove, !$.jqx.mobile.isTouchDevice() ? 'click' : $.jqx.mobile.getTouchEventName('touchstart'), function (event) {
                $(that.editImage).removeClass('jqx-editor-focus');
                $(that.editImage).remove();
                that.editImage = null;
                that._preventDefault(event);
                template.jqxWindow('close');
                that._raiseEvent("change");
            });

            this.addHandler(btnCancel, !$.jqx.mobile.isTouchDevice() ? 'click' : $.jqx.mobile.getTouchEventName('touchstart'), function (event) {
                $(that.editImage).removeClass('jqx-editor-focus');
                that.editImage = null;
                that._preventDefault(event);
            });

            this.addHandler(btnOK, !$.jqx.mobile.isTouchDevice() ? 'click' : $.jqx.mobile.getTouchEventName('touchstart'), function (event) {
                $(that.editImage).removeClass('jqx-editor-focus');
                var inputs = template.find('input');
                var image = that.editImage ? $(that.editImage) : $('<img style="border: 1px solid transparent;">');
                var img = image.attr('src', inputs[0].value).attr('unselectable', 'on');
                if (inputs[1].value)
                    img.attr('alt', inputs[1].value).attr('title', inputs[1].value);
                if (inputs[2].value && !isNaN(parseInt(inputs[2].value)))
                    img.width(inputs[2].value);
                else img.css('width', 'auto');
                if (inputs[3].value && !isNaN(parseInt(inputs[3].value)))
                    img.height(inputs[3].value);
                else img.css('height', 'auto');
                if (inputs[4].value) {
                    if (inputs[4].value.toString() == "auto") {
                        img.css('margin-left', 'auto');
                        img.css('margin-right', 'auto');
                    }
                    else if (inputs[4].value.toString().indexOf('%') != -1) {
                        img.css('margin-left', parseInt(inputs[4].value) + '%');
                        img.css('margin-right', parseInt(inputs[4].value) + '%');
                    }
                    else {
                        img.css('margin-left', parseInt(inputs[4].value) + 'px');
                        img.css('margin-right', parseInt(inputs[4].value) + 'px');
                    }
                }
                else {
                    img.css('margin-left', '0px');
                    img.css('margin-right', '0px');
                }

                if (inputs[5].value) {
                    if (inputs[5].value.toString() == "auto") {
                        img.css('margin-top', 'auto');
                        img.css('margin-bottom', 'auto');
                    }
                    else if (inputs[5].value.toString().indexOf('%') != -1) {
                        img.css('margin-top', parseInt(inputs[5].value) + '%');
                        img.css('margin-bottom', parseInt(inputs[5].value) + '%');
                    }
                    else {
                        img.css('margin-top', parseInt(inputs[5].value) + 'px');
                        img.css('margin-bottom', parseInt(inputs[5].value) + 'px');
                    }
                }
                else {
                    img.css('margin-top', '0px');
                    img.css('margin-bottom', '0px');
                }

                var align = template.find('.jqx-editor-align').jqxDropDownList('selectedIndex');
                if (align == 1) {
                    img.css('float', 'left');
                }
                else if (align == 2) {
                    img.css('float', 'right');
                }
                else if (align == 0) {
                    img.css('float', 'none');
                }

                img.css('resize', false);
                img[0].oncontrolselect = function () { return false; };
                img[0].selectstart = function () { return false; };

                if (!that.editImage) {
                    if (!that.focused) {
                        that.editor.focus();
                    }

                    if (that.range) {
                        that.selectRange(that.range);
                    }
                    that.execute('insertHTML', img[0].outerHTML+ "" + "<span id='INSERTION_MARKER'>&nbsp;</span>", tool);
                    that.editor.focus();
                    var marker = $(that.editorDocument).find("#INSERTION_MARKER");
                    that.selection.selectNode(marker[0], true);
                    if (that.getRange().setStartAfter) {
                        that.getRange().setStartAfter(marker[0]);
                    }
                    marker.remove();
                    that.selection.collapse(false);
                    that._refreshTools();
                    that._preventDefault(event);

                }
                that.editImage = null;

                that._preventDefault(event);
            });
            template.appendTo(document.body);
            that.updating = true;
            that.addHandler(template, 'open', function () {
                that.updating = true;
                setTimeout(function () {
                    $(inputs[0]).focus();
                }, 25);
            });
            template.jqxWindow({ resizable: false, width: 280, okButton: btnOK, cancelButton: btnCancel, theme: that.theme, isModal: true, position: { center: that.widget } });
            that.addHandler(template, 'close', function () {
                that.updating = false;
            });

            if (!that.focused) {
                that.editor.focus();
                that.selectRange(that.range);
            }

            that._preventDefault(event);
            return false;
        },

        editmode: function (value) {
            if (!value && !this.readOnly) {
                this._removeHandlers();
                this.editor.attr('contentEditable', false);
                var content = document.createTextNode(this.editor.html());
                var pre = $('<pre>');
                pre.html(content).attr({
                    'id': 'sourceText',
                    'contentEditable': true
                }).css('height', '100%');
                this.editor.html(pre);
                if (this.buttons.hasOwnProperty('html'))
                    this.buttons.html.addClass('active');
                pre.focus();
            } else if (value && this.readOnly) {
                var content = this.editor.find('#sourceText').text();
                this.editor.html(content);
                if (this.buttons.hasOwnProperty('html'))
                    this.buttons.html.removeClass('active');
                this.editor.attr('contentEditable', true);
                this._addHandlers();
            }
            this.readOnly = !value;
        },

        setMode: function (toSource) {
            if (!this.range) {
                this.editor.focus();
                this.range = this.getRange();
            }

            var oContent;
            var oDoc = this.editor[0];
            var that = this;
            if (toSource) {
                this._documentMode = "source";
                var parseHTML = new HTMLParser();
                var formattedHTML = parseHTML.HTMLtoXML(oDoc.innerHTML);
                formattedHTML = parseHTML.FormatHTML(formattedHTML);
                oContent = document.createTextNode(formattedHTML);
                oDoc.innerHTML = "";
                var oPre = document.createElement("pre");
                oDoc.contentEditable = false;
                oPre.style.height = "100%";
                oPre.style.margin = "0px";
                oPre.style.outline = "none";
                oPre.style.display = "block";
                oPre.id = "sourceText";
                oPre.contentEditable = true;
                oPre.appendChild(oContent);
                oDoc.appendChild(oPre);
                this.readOnly = true;
            } else {
                this._documentMode = "html";
                if (document.all) {
                    oDoc.innerHTML = oDoc.innerText;
                }
                else if (oDoc.textContent) {
                    oDoc.innerHTML = oDoc.textContent;
                }
                else {
                    oContent = document.createRange();
                    oContent.selectNodeContents(oDoc.firstChild);
                    oDoc.innerHTML = oContent.toString();
                }
                oDoc.contentEditable = true;
                this.readOnly = false;
                this._refreshTools();
                this.editor.focus();
                this.selection.selectNode(this.editor[0]);
                this.editor.scrollTop(0);
                this.selection.collapse(true);
            }
            $.each(this.commands, function () {
                if (this.widget) {
                    if (this.command != "viewsource") {
                        switch (this.type) {
                            case "list":
                                this.widget.jqxDropDownList({ disabled: toSource });
                                break;
                            case "colorPicker":
                                this.widget.jqxDropDownButton({ disabled: toSource });
                                break;
                            case "button":
                                this.widget.jqxButton({ disabled: toSource });
                                break;
                            case "toggleButton":
                                this.widget.jqxToggleButton({ toggled: false, disabled: toSource });
                                break;
                        }
                    }
                }
            });
            this.editor.focus();
            this.commands['html'].widget.jqxToggleButton({ toggled: toSource == "source" || toSource == true });
            this.commands['html'].toggled = toSource == "source" || toSource == true;
        },

        execute: function (cmd, args, tool) {
            if (!this.readOnly) {
                var that = this;
                var doc = this.editorDocument;
                if (that._documentMode == "source") {
                    return;
                }
                if (that.linkPopup) that.linkPopup.remove();
                this.editor.focus();
                if ($.jqx.browser.mozilla) {
                    this.focus();
                }

                var performAction = function (action) {
                    try {
                        if (action.command && action.command.toLowerCase() == "inserthtml") {
                            var range = that.getRange();
                            var htmlString = action.value;
                            if (htmlString.toString().indexOf('<') == -1) {
                                htmlString = "<span>" + action.value + "</span>";
                            }
                            that.selection.insertContent("" + htmlString + "<span id='INSERTION_MARKER'>&nbsp;</span>");
                            that.selectRange(range);
                            setTimeout(function () {
                                var marker = $(that.editorDocument).find("#INSERTION_MARKER");
                                that.selection.selectNode($(marker).prev()[0], true);
                                marker.remove();
                                that.selection.collapse(false);
                            }, 10  );
                        }
                        else if (action.command) {
                            if (doc.queryCommandEnabled(action.command)) {
                                doc.execCommand(action.command, false, action.value);
                            }
                            else {
                                return false;
                            }
                        }
                        else {
                            if (doc.queryCommandEnabled(action)) {
                                doc.execCommand(action, false, action);
                            }
                            else {
                                return false;
                            }
                        }
                    }
                    catch (er) {

                    }
                }

                if (cmd == "custom") {
                    var action = args.action(args.widget, this.editor);
                    if (action) {
                        performAction(action);
                    }
                }
                else {
                    try {
                        if (tool && tool.action) {
                            var action = tool.action(tool.widget, this.editor);
                            performAction(action);
                        }
                        else {
                            if (doc.queryCommandEnabled(cmd)) {
                                doc.execCommand(cmd, false, args);
                            }
                            else if (cmd == "insertHTML") {
                                this.selection.insertContent(args);
                            }
                            else {
                                return false;
                            }
                        }
                    }
                    catch (er) {
                        if (cmd == "insertHTML") {
                            this.selection.insertContent(args);
                        }
                        else {
                            return false;
                        }
                    }
                }

                that._raiseEvent("change", {
                    command: cmd,
                    args: args
                });
                this.changed = true;
                this.range = this.getRange();
            }
        },

        destroy: function () {
            this._removeHandlers();
            var tools = this.tools.split(" ");
            var toolGroups = this.tools.split(" | ");
            var that = this;

            var destroyTools = function (tools) {
                $.each(tools, function (index, value) {
                    var tool = that.commands[this];
                    if (!tool) {
                        return true;
                    }

                    switch (tool.type) {
                        case 'list':
                            tool.widget.jqxDropDownList('destroy');
                            break;
                        case 'colorPicker':
                            tool.colorPicker.remove();
                            tool.widget.jqxDropDownButton('destroy');
                            break;
                        case "toggleButton":
                            tool.widget.jqxToggleButton('destroy');
                            break;
                        case "custom":
                            if (this.destroyTool) this.destroyTool(this);
                            break;
                        case "button":
                        default:
                            tool.widget.jqxToggleButton('destroy');
                            break;
                    }
                });
            }

            if (toolGroups.length == 0) {
                destroyTools(tools);
            }
            else {
                for (var i = 0; i < toolGroups.length; i++) {
                    var toolGroup = toolGroups[i];
                    var tools = toolGroup.split(" ");
                    destroyTools(tools);
                }
            }

            if (this.inline) {
                this.toolbar.remove();
            }
            else {
                this.widget.remove();
            }
        },

        val: function (value) {
            if (value != undefined && typeof value != 'object') {
                this.editor.html(value)
            }

            return this.editor.html();
        },
   
        _raiseEvent: function (id, arg) {
            if (arg == undefined)
                arg = { owner: null };

            if (this._documentMode == "source")
                return true;

            var evt = id;
            args = arg;
            args.owner = this;

            var event = new jQuery.Event(evt);
            event.owner = this;
            event.args = args;
            var result = this.widget.trigger(event);

            // save the new event arguments.
            arg = event.args;
            return result;
        }
    })

    var jqxSelection = function (document) {
        var selection = {
            initialize: function (document) {
                this.document = document;
            },

            getSelection: function () {
                return (this.document.getSelection) ? this.document.getSelection() : this.document.selection;
            },

            getRange: function () {
                var s = this.getSelection();

                if (!s) return null;

                try {
                    return s.rangeCount > 0 ? s.getRangeAt(0) : (this.document.createRange ? this.document.createRange() : this.document.selection.createRange());
                } catch (e) {
                    // IE bug when used in frameset
                    return this.document.body.createTextRange();
                }
            },

            selectRange: function (range) {
                if (range.select) {
                    range.select();
                } else {
                    var s = this.getSelection();
                    if (s.addRange) {
                        s.removeAllRanges();
                        s.addRange(range);
                    }
                }
            },

            selectNode: function (node, collapse) {
                var r = this.getRange();
                var s = this.getSelection();

                if (r.moveToElementText) {
                    r.moveToElementText(node);
                    r.select();
                } else if (s.addRange) {
                    collapse ? r.selectNodeContents(node) : r.selectNode(node);
                    s.removeAllRanges();
                    s.addRange(r);
                } else {
                    s.setBaseAndExtent(node, 0, node, 1);
                }

                return node;
            },

            isCollapsed: function () {
                var r = this.getRange();
                if (r.item) return false;
                return r.boundingWidth == 0 || this.getSelection().isCollapsed;
            },

            collapse: function (toStart) {
                var r = this.getRange();
                var s = this.getSelection();

                if (r.select) {
                    r.collapse(toStart);
                    r.select();
                } else {
                    toStart ? s.collapseToStart() : s.collapseToEnd();
                }
            },

            getContent: function () {
                var r = this.getRange();
                var body = $('<div>')[0];

                if (this.isCollapsed()) return '';

                if (r.cloneContents) {
                    body.appendChild(r.cloneContents());
                } else if (r.item != undefined || r.htmlText != undefined) {
                    $(body).html(r.item ? r.item(0).outerHTML : r.htmlText);
                } else {
                    $(body).html(r.toString());
                }

                var content = $(body).html();
                return content;
            },

            getText: function () {
                var r = this.getRange();
                var s = this.getSelection();
                return this.isCollapsed() ? '' : r.text || (s.toString ? s.toString() : '');
            },

            getNode: function () {
                var r = this.getRange();

                if (!$.jqx.browser.msie || $.jqx.browser.version >= 9) {
                    var el = null;

                    if (r) {
                        el = r.commonAncestorContainer;

                        // Handle selection a image or other control like element such as anchors
                        if (!r.collapsed)
                            if (r.startContainer == r.endContainer)
                                if (r.startOffset - r.endOffset < 2)
                                    if (r.startContainer.hasChildNodes())
                                        el = r.startContainer.childNodes[r.startOffset];

                        while (typeof (el) != 'element') el = el.parentNode;
                    }

                    return document.id(el);
                }

                return document.id(r.item ? r.item(0) : r.parentElement());
            },

            insertContent: function (content) {
                var r = this.getRange();
                if (r.pasteHTML) {
                    r.pasteHTML(content);
                    r.collapse(false);
                    r.select();
                } else if (r.insertNode) {
                    r.deleteContents();
                    if (r.createContextualFragment) {
                        r.insertNode(r.createContextualFragment(content));
                    } else {
                        var doc = this.document;
                        var fragment = doc.createDocumentFragment();
                        var temp = doc.createElement('div');
                        fragment.appendChild(temp);
                        temp.outerHTML = content;
                        r.insertNode(fragment);
                    }
                }
            }
        };
        selection.initialize(document);
        return selection;
    }

    var HTMLParser = function () {
        // Regular Expressions for parsing tags and attributes
        var startTag = /^<([-A-Za-z0-9_]+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
            endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
            attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

        // Empty Elements - HTML 4.01
        var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

        // Block Elements - HTML 4.01
        var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

        // Inline Elements - HTML 4.01
        var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

        // Elements that you can, intentionally, leave open
        // (and which close themselves)
        var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

        // Attributes that have their values filled in disabled="disabled"
        var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

        // Special Elements (can contain anything)
        var special = makeMap("script,style");

        var HTMLParser = this.HTMLParser = function (html, handler) {
            var index, chars, match, stack = [], last = html;
            stack.last = function () {
                return this[this.length - 1];
            };

            while (html) {
                chars = true;

                // Make sure we're not in a script or style element
                if (!stack.last() || !special[stack.last()]) {

                    // Comment
                    if (html.indexOf("<!--") == 0) {
                        index = html.indexOf("-->");

                        if (index >= 0) {
                            if (handler.comment)
                                handler.comment(html.substring(4, index));
                            html = html.substring(index + 3);
                            chars = false;
                        }

                        // end tag
                    } else if (html.indexOf("</") == 0) {
                        match = html.match(endTag);

                        if (match) {
                            html = html.substring(match[0].length);
                            match[0].replace(endTag, parseEndTag);
                            chars = false;
                        }

                        // start tag
                    } else if (html.indexOf("<") == 0) {
                        match = html.match(startTag);

                        if (match) {
                            html = html.substring(match[0].length);
                            match[0].replace(startTag, parseStartTag);
                            chars = false;
                        }
                    }

                    if (chars) {
                        index = html.indexOf("<");

                        var text = index < 0 ? html : html.substring(0, index);
                        html = index < 0 ? "" : html.substring(index);

                        if (handler.chars)
                            handler.chars(text);
                    }

                } else {
                    html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function (all, text) {
                        text = text.replace(/<!--(.*?)-->/g, "$1")
                            .replace(/<!\[CDATA\[(.*?)]]>/g, "$1");

                        if (handler.chars)
                            handler.chars(text);

                        return "";
                    });

                    parseEndTag("", stack.last());
                }

                last = html;
            }

            // Clean up any remaining tags
            parseEndTag();

            function parseStartTag(tag, tagName, rest, unary) {
                tagName = tagName.toLowerCase();

                if (block[tagName]) {
                    while (stack.last() && inline[stack.last()]) {
                        parseEndTag("", stack.last());
                    }
                }

                if (closeSelf[tagName] && stack.last() == tagName) {
                    parseEndTag("", tagName);
                }

                unary = empty[tagName] || !!unary;

                if (!unary)
                    stack.push(tagName);

                if (handler.start) {
                    var attrs = [];

                    rest.replace(attr, function (match, name) {
                        var value = arguments[2] ? arguments[2] :
                            arguments[3] ? arguments[3] :
                            arguments[4] ? arguments[4] :
                            fillAttrs[name] ? name : "";

                        attrs.push({
                            name: name,
                            value: value,
                            escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
                        });
                    });

                    if (handler.start)
                        handler.start(tagName, attrs, unary);
                }
            }

            function parseEndTag(tag, tagName) {
                // If no tag name is provided, clean shop
                if (!tagName)
                    var pos = 0;

                    // Find the closest opened tag of the same type
                else
                    for (var pos = stack.length - 1; pos >= 0; pos--)
                        if (stack[pos].toLowerCase() == tagName.toLowerCase())
                            break;

                if (pos >= 0) {
                    // Close all the open elements, up the stack
                    for (var i = stack.length - 1; i >= pos; i--)
                        if (handler.end)
                            handler.end(stack[i]);

                    // Remove the open elements from the stack
                    stack.length = pos;
                }
            }
        };

        this.HTMLtoXML = function (html) {
            var results = "";
            html = html.replace(/\r/ig, "");
            html = html.replace(/\n/ig, "");
            HTMLParser(html, {
                start: function (tag, attrs, unary) {
                    results += "<" + tag;

                    for (var i = 0; i < attrs.length; i++)
                        results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';

                    results += (unary ? "/" : "") + ">";
                    //     results += "\r\n";
                },
                end: function (tag) {
                    //     results += "\r\n";
                    results += "</" + tag + ">\r\n";
                },
                chars: function (text) {
                    results += text;
                },
                comment: function (text) {
                    results += "<!--" + text + "-->";
                }
            });

            return results;
        };

        this.FormatHTML = function (html_source, options) {
            //Wrapper function to invoke all the necessary constructors and deal with the output.

            var multi_parser,
                indent_size,
                indent_character,
                max_char,
                brace_style,
                unformatted;

            options = options || {};
            indent_size = options.indent_size || 4;
            indent_character = options.indent_char || ' ';
            brace_style = options.brace_style || 'collapse';
            max_char = Infinity;
            unformatted = options.unformatted || ['a', 'span', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike', 'font', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

            function Parser() {

                this.pos = 0; //Parser position
                this.token = '';
                this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
                this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
                    parent: 'parent1',
                    parentcount: 1,
                    parent1: ''
                };
                this.tag_type = '';
                this.token_text = this.last_token = this.last_text = this.token_type = '';

                this.Utils = { //Uilities made available to the various functions
                    whitespace: "\n\r\t ".split(''),
                    single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed,?php,?,?='.split(','), //all the single tags for HTML
                    extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
                    in_array: function (what, arr) {
                        for (var i = 0; i < arr.length; i++) {
                            if (what === arr[i]) {
                                return true;
                            }
                        }
                        return false;
                    }
                }

                this.get_content = function () { //function to capture regular content between tags

                    var input_char = '',
                        content = [],
                        space = false; //if a space is needed

                    while (this.input.charAt(this.pos) !== '<') {
                        if (this.pos >= this.input.length) {
                            return content.length ? content.join('') : ['', 'TK_EOF'];
                        }

                        input_char = this.input.charAt(this.pos);
                        this.pos++;
                        this.line_char_count++;

                        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                            if (content.length) {
                                space = true;
                            }
                            this.line_char_count--;
                            continue; //don't want to insert unnecessary space
                        }
                        else if (space) {
                            if (this.line_char_count >= this.max_char) { //insert a line when the max_char is reached
                                content.push('\n');
                                for (var i = 0; i < this.indent_level; i++) {
                                    content.push(this.indent_string);
                                }
                                this.line_char_count = 0;
                            }
                            else {
                                content.push(' ');
                                this.line_char_count++;
                            }
                            space = false;
                        }
                        content.push(input_char); //letter at-a-time (or string) inserted to an array
                    }
                    return content.length ? content.join('') : '';
                }

                this.get_contents_to = function (name) { //get the full content of a script or style to pass to js_beautify
                    if (this.pos == this.input.length) {
                        return ['', 'TK_EOF'];
                    }
                    var input_char = '';
                    var content = '';
                    var reg_match = new RegExp('\<\/' + name + '\\s*\>', 'igm');
                    reg_match.lastIndex = this.pos;
                    var reg_array = reg_match.exec(this.input);
                    var end_script = reg_array ? reg_array.index : this.input.length; //absolute end of script
                    if (this.pos < end_script) { //get everything in between the script tags
                        content = this.input.substring(this.pos, end_script);
                        this.pos = end_script;
                    }
                    return content;
                }

                this.record_tag = function (tag) { //function to record a tag and its parent in this.tags Object
                    if (this.tags[tag + 'count']) { //check for the existence of this tag type
                        this.tags[tag + 'count']++;
                        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                    }
                    else { //otherwise initialize this tag type
                        this.tags[tag + 'count'] = 1;
                        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                    }
                    this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
                    this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
                }

                this.retrieve_tag = function (tag) { //function to retrieve the opening tag to the corresponding closer
                    if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
                        var temp_parent = this.tags.parent; //check to see if it's a closable tag.
                        while (temp_parent) { //till we reach '' (the initial value);
                            if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
                                break;
                            }
                            temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
                        }
                        if (temp_parent) { //if we caught something
                            this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
                            this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
                        }
                        delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
                        delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
                        if (this.tags[tag + 'count'] == 1) {
                            delete this.tags[tag + 'count'];
                        }
                        else {
                            this.tags[tag + 'count']--;
                        }
                    }
                }

                this.get_tag = function () { //function to get a full tag and parse its type
                    var input_char = '',
                        content = [],
                        space = false,
                        tag_start, tag_end;

                    do {
                        if (this.pos >= this.input.length) {
                            return content.length ? content.join('') : ['', 'TK_EOF'];
                        }

                        input_char = this.input.charAt(this.pos);
                        this.pos++;
                        this.line_char_count++;

                        if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
                            space = true;
                            this.line_char_count--;
                            continue;
                        }

                        if (input_char === "'" || input_char === '"') {
                            if (!content[1] || content[1] !== '!') { //if we're in a comment strings don't get treated specially
                                input_char += this.get_unformatted(input_char);
                                space = true;
                            }
                        }

                        if (input_char === '=') { //no space before =
                            space = false;
                        }

                        if (content.length && content[content.length - 1] !== '=' && input_char !== '>'
                            && space) { //no space after = or before >
                            if (this.line_char_count >= this.max_char) {
                                this.print_newline(false, content);
                                this.line_char_count = 0;
                            }
                            else {
                                content.push(' ');
                                this.line_char_count++;
                            }
                            space = false;
                        }
                        if (input_char === '<') {
                            tag_start = this.pos - 1;
                        }
                        content.push(input_char); //inserts character at-a-time (or string)
                    } while (input_char !== '>');

                    var tag_complete = content.join('');
                    var tag_index;
                    if (tag_complete.indexOf(' ') != -1) { //if there's whitespace, thats where the tag name ends
                        tag_index = tag_complete.indexOf(' ');
                    }
                    else { //otherwise go with the tag ending
                        tag_index = tag_complete.indexOf('>');
                    }
                    var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
                    if (tag_complete.charAt(tag_complete.length - 2) === '/' ||
                        this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
                        this.tag_type = 'SINGLE';
                    }
                    else if (tag_check === 'script') { //for later script handling
                        this.record_tag(tag_check);
                        this.tag_type = 'SCRIPT';
                    }
                    else if (tag_check === 'style') { //for future style handling (for now it justs uses get_content)
                        this.record_tag(tag_check);
                        this.tag_type = 'STYLE';
                    }
                    else if (this.Utils.in_array(tag_check, unformatted)) { // do not reformat the "unformatted" tags
                        var comment = this.get_unformatted('</' + tag_check + '>', tag_complete); //...delegate to get_unformatted function
                        content.push(comment);
                        // Preserve collapsed whitespace either before or after this tag.
                        if (tag_start > 0 && this.Utils.in_array(this.input.charAt(tag_start - 1), this.Utils.whitespace)) {
                            content.splice(0, 0, this.input.charAt(tag_start - 1));
                        }
                        tag_end = this.pos - 1;
                        if (this.Utils.in_array(this.input.charAt(tag_end + 1), this.Utils.whitespace)) {
                            content.push(this.input.charAt(tag_end + 1));
                        }
                        this.tag_type = 'SINGLE';
                    }
                    else if (tag_check.charAt(0) === '!') { //peek for <!-- comment
                        if (tag_check.indexOf('[if') != -1) { //peek for <!--[if conditional comment
                            if (tag_complete.indexOf('!IE') != -1) { //this type needs a closing --> so...
                                var comment = this.get_unformatted('-->', tag_complete); //...delegate to get_unformatted
                                content.push(comment);
                            }
                            this.tag_type = 'START';
                        }
                        else if (tag_check.indexOf('[endif') != -1) {//peek for <!--[endif end conditional comment
                            this.tag_type = 'END';
                            this.unindent();
                        }
                        else if (tag_check.indexOf('[cdata[') != -1) { //if it's a <[cdata[ comment...
                            var comment = this.get_unformatted(']]>', tag_complete); //...delegate to get_unformatted function
                            content.push(comment);
                            this.tag_type = 'SINGLE'; //<![CDATA[ comments are treated like single tags
                        }
                        else {
                            var comment = this.get_unformatted('-->', tag_complete);
                            content.push(comment);
                            this.tag_type = 'SINGLE';
                        }
                    }
                    else {
                        if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
                            this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
                            this.tag_type = 'END';
                        }
                        else { //otherwise it's a start-tag
                            this.record_tag(tag_check); //push it on the tag stack
                            this.tag_type = 'START';
                        }
                        if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
                            this.print_newline(true, this.output);
                        }
                    }
                    return content.join(''); //returns fully formatted tag
                }

                this.get_unformatted = function (delimiter, orig_tag) { //function to return unformatted content in its entirety

                    if (orig_tag && orig_tag.indexOf(delimiter) != -1) {
                        return '';
                    }
                    var input_char = '';
                    var content = '';
                    var space = true;
                    do {

                        if (this.pos >= this.input.length) {
                            return content;
                        }

                        input_char = this.input.charAt(this.pos);
                        this.pos++

                        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                            if (!space) {
                                this.line_char_count--;
                                continue;
                            }
                            if (input_char === '\n' || input_char === '\r') {
                                content += '\n';
                                /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
                                for (var i=0; i<this.indent_level; i++) {
                                  content += this.indent_string;
                                }
                                space = false; //...and make sure other indentation is erased
                                */
                                this.line_char_count = 0;
                                continue;
                            }
                        }
                        content += input_char;
                        this.line_char_count++;
                        space = true;


                    } while (content.indexOf(delimiter) == -1);
                    return content;
                }

                this.get_token = function () { //initial handler for token-retrieval
                    var token;

                    if (this.last_token === 'TK_TAG_SCRIPT' || this.last_token === 'TK_TAG_STYLE') { //check if we need to format javascript
                        var type = this.last_token.substr(7)
                        token = this.get_contents_to(type);
                        if (typeof token !== 'string') {
                            return token;
                        }
                        return [token, 'TK_' + type];
                    }
                    if (this.current_mode === 'CONTENT') {
                        token = this.get_content();
                        if (typeof token !== 'string') {
                            return token;
                        }
                        else {
                            return [token, 'TK_CONTENT'];
                        }
                    }

                    if (this.current_mode === 'TAG') {
                        token = this.get_tag();
                        if (typeof token !== 'string') {
                            return token;
                        }
                        else {
                            var tag_name_type = 'TK_TAG_' + this.tag_type;
                            return [token, tag_name_type];
                        }
                    }
                }

                this.get_full_indent = function (level) {
                    level = this.indent_level + level || 0;
                    if (level < 1)
                        return '';

                    return Array(level + 1).join(this.indent_string);
                }


                this.printer = function (js_source, indent_character, indent_size, max_char, brace_style) { //handles input/output and some other printing functions

                    this.input = js_source || ''; //gets the input for the Parser
                    this.output = [];
                    this.indent_character = indent_character;
                    this.indent_string = '';
                    this.indent_size = indent_size;
                    this.brace_style = brace_style;
                    this.indent_level = 0;
                    this.max_char = max_char;
                    this.line_char_count = 0; //count to see if max_char was exceeded

                    for (var i = 0; i < this.indent_size; i++) {
                        this.indent_string += this.indent_character;
                    }

                    this.print_newline = function (ignore, arr) {
                        this.line_char_count = 0;
                        if (!arr || !arr.length) {
                            return;
                        }
                        if (!ignore) { //we might want the extra line
                            while (this.Utils.in_array(arr[arr.length - 1], this.Utils.whitespace)) {
                                arr.pop();
                            }
                        }
                        arr.push('\n');
                        for (var i = 0; i < this.indent_level; i++) {
                            arr.push(this.indent_string);
                        }
                    }

                    this.print_token = function (text) {
                        this.output.push(text);
                    }

                    this.indent = function () {
                        this.indent_level++;
                    }

                    this.unindent = function () {
                        if (this.indent_level > 0) {
                            this.indent_level--;
                        }
                    }
                }
                return this;
            }

            /*_____________________--------------------_____________________*/

            multi_parser = new Parser(); //wrapping functions Parser
            multi_parser.printer(html_source, indent_character, indent_size, max_char, brace_style); //initialize starting values

            while (true) {
                var t = multi_parser.get_token();
                multi_parser.token_text = t[0];
                multi_parser.token_type = t[1];

                if (multi_parser.token_type === 'TK_EOF') {
                    break;
                }

                switch (multi_parser.token_type) {
                    case 'TK_TAG_START':
                        multi_parser.print_newline(false, multi_parser.output);
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.indent();
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_STYLE':
                    case 'TK_TAG_SCRIPT':
                        multi_parser.print_newline(false, multi_parser.output);
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_END':
                        //Print new line only if the tag has no content and has child
                        if (multi_parser.last_token === 'TK_CONTENT' && multi_parser.last_text === '') {
                            var tag_name = multi_parser.token_text.match(/\w+/)[0];
                            var tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length - 1].match(/<\s*(\w+)/);
                            if (tag_extracted_from_last_output === null || tag_extracted_from_last_output[1] !== tag_name)
                                multi_parser.print_newline(true, multi_parser.output);
                        }
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_TAG_SINGLE':
                        // Don't add a newline before elements that should remain unformatted.
                        var tag_check = multi_parser.token_text.match(/^\s*<([a-z]+)/i);
                        if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)) {
                            multi_parser.print_newline(false, multi_parser.output);
                        }
                        multi_parser.print_token(multi_parser.token_text);
                        multi_parser.current_mode = 'CONTENT';
                        break;
                    case 'TK_CONTENT':
                        if (multi_parser.token_text !== '') {
                            multi_parser.print_token(multi_parser.token_text);
                        }
                        multi_parser.current_mode = 'TAG';
                        break;
                    case 'TK_STYLE':
                    case 'TK_SCRIPT':
                        if (multi_parser.token_text !== '') {
                            multi_parser.output.push('\n');
                            var text = multi_parser.token_text;

                            if (options.indent_scripts == "keep") {
                                var script_indent_level = 0;
                            } else if (options.indent_scripts == "separate") {
                                var script_indent_level = -multi_parser.indent_level;
                            } else {
                                var script_indent_level = 1;
                            }

                            var indentation = multi_parser.get_full_indent(script_indent_level);

                            // simply indent the string otherwise
                            var white = text.match(/^\s*/)[0];
                            var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;
                            var reindent = multi_parser.get_full_indent(script_indent_level - _level);
                            text = text.replace(/^\s*/, indentation)
                                   .replace(/\r\n|\r|\n/g, '\n' + reindent)
                                   .replace(/\s*$/, '');

                            if (text) {
                                multi_parser.print_token(text);
                                multi_parser.print_newline(true, multi_parser.output);
                            }
                        }
                        multi_parser.current_mode = 'TAG';
                        break;
                }
                multi_parser.last_token = multi_parser.token_type;
                multi_parser.last_text = multi_parser.token_text;
            }
            return multi_parser.output.join('');
        }

        function makeMap(str) {
            var obj = {}, items = str.split(",");
            for (var i = 0; i < items.length; i++)
                obj[items[i]] = true;
            return obj;
        }
    }

})(jQuery);


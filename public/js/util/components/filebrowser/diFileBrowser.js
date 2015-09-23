"use strict";

var diFileBrowser = function () {
    var self = this,
        screenInitialized = false,
        $diFileBrowserPopup,
        $filemanager,
        $difilemanagerheader,
        $diimagebrowsingdata,
        $offscreenimage,
        $imagedetails,
        $filemanagertitle,
        $filecounter,
        $filebrowserok,
        $filebrowsercancel,
        $difilelist,
        $difiles,
        $nothingfound,
        $difilesearch,
        timeout = null,
        imagesFromServer = [],
        currentPath,
        folders = [],
        files = [],
        $searchInput,
        loadSpinner = function () {
            $filecounter.children().remove();
            $filecounter.html("Files: 0");
            $filecounter.append($("<img>", {
                id: "spinner",
                src: "/css/lib/jqwidgets/images/loader.gif",
                style: "display: block; position: relative; top: 50%; left: 50%; padding: 2px; width: 46px; height: 46px;"
            }));
        },
        buildHeaderDiv = function () {
            $filemanager.append($("<div>", {class: "difilemanagerheader"}));
            $difilemanagerheader = $filemanager.find(".difilemanagerheader");
            $difilemanagerheader.append($("<div>", {class: "difilemanagertitle", text: "Select Image"}));
            $filemanagertitle = $difilemanagerheader.find(".difilemanagertitle");
            $difilemanagerheader.append($("<div>", {class: "difilecounter"}));
            $difilemanagerheader.append($("<div>", {class: "difilesearch"}));
            $difilesearch = $filemanager.find(".difilesearch");
            $difilesearch.append($("<input>", {
                type: "search",
                class: "ui-input-text ui-body-c",
                placeholder: "Find a file.."
            }));
            $searchInput = $filemanager.find('input[type=search]');
            $filecounter = $filemanager.find(".difilecounter");
        },
        buildImageDetailsDiv = function () {
            $diimagebrowsingdata.append($("<div>", {class: "diimagedetails"}));
            $imagedetails = $filemanager.find(".diimagedetails");
            $imagedetails.append($("<div>", {class: "filename"}));
            $imagedetails.append($("<div>", {class: "filedate"}));
            $imagedetails.append($("<div>", {class: "filesize"}));
            $imagedetails.append($("<img>", {class: "rightimage"}));
        },
        buildFileListDiv = function () {
            $diimagebrowsingdata.append($("<div>", {class: "difilelist thinScroll"}));
            $difilelist = $filemanager.find('.difilelist');
        },
        buildFilesDiv = function () {
            $difilelist.append($("<ul>", {class: "difiles"}));
            $difiles = $filemanager.find('.difiles');
        },
        buildOffScreenImageDiv = function () {
            $filemanager.append($("<img>", {class: "offscreenimage"}));
            $offscreenimage = $filemanager.find(".offscreenimage");
        },
        buildNothingFoundDiv = function () {
            $filemanager.append($("<div>", {class: "dinothingfound"}));
            $nothingfound = $filemanager.find('.dinothingfound');
            $nothingfound.append($("<div>", {class: "dinofiles"}));
            $nothingfound.append($("<span>", {text: "No files found."}));
        },
        buildImageBrowsingDataDiv = function () {
            buildHeaderDiv();
            $filemanager.append($("<div>", {class: "diimagebrowsingdata"}));
            $diimagebrowsingdata = $filemanager.find(".diimagebrowsingdata");
            $diimagebrowsingdata.css("display", "none");
            buildImageDetailsDiv();
        };
    self.init = function (objectToUpdate, fieldToUpdate, imageTypeFilter) {
        self.selectedFileName = "";
        $diFileBrowserPopup = $('#diFileBrowserPopup');
        if (!screenInitialized) { // if filemanage div hasn't been appended yet.
            $diFileBrowserPopup.append($("<div>", {id: "difilemanager", class: "difilemanager", style: "display: none;"}));
        } else {  // screen already loaded clear existing files..
            loadSpinner();
            $diimagebrowsingdata.hide();
            $difilelist.hide();
        }
        setTimeout(function () {
            $filemanager = $diFileBrowserPopup.find(".difilemanager");
            $filemanager.hide();
            $filemanager.show();
            if (!screenInitialized) {
                buildImageBrowsingDataDiv();
                buildFileListDiv();
                buildOffScreenImageDiv();
                buildNothingFoundDiv();
                loadSpinner();
            } else {
                $difilelist.children().remove();
            }

            buildFilesDiv();

            $filebrowserok = $filemanager.find(".filebrowserok");
            $filebrowsercancel = $filemanager.find(".filebrowsercancel");
            timeout = null;
            currentPath = '';
            $searchInput.val('');
            self.displayObject = objectToUpdate;
            self.displayField = fieldToUpdate;
            self.typeOfImage = imageTypeFilter;

            $difilesearch.css("display", "none");
            screenInitialized = true;
            self.getData();  // make AJAX call to server
        }, 1);
    };
    self.displayNextGroup = function (topOfWindow, bottomOfWindow) {
        var i = 0,
            virtualBottom = (bottomOfWindow + 100);

        $(".file").each(function () {
            var offset,
                imgTop,
                $li,
                $fileDiv,
                $img,
                $filedetail;

            $fileDiv = $(this);
            $li = $fileDiv.parent();
            offset = $li.offset();
            $img = $fileDiv.find(".smallimage");
            $filedetail = $fileDiv.find(".filedetail");
            imgTop = offset.top;

            //console.log("counter = " + i++ + "  imgTop = " + imgTop + "  virtualBottom = " + virtualBottom);
            if ((imgTop > 0) && (imgTop < virtualBottom)) {
                $fileDiv.removeClass("files");
                $fileDiv.addClass("filesloaded");
                $li.addClass("expanditem");
                $img.attr('src', $img.attr('datasrc'));
                $img.addClass("smallimageloaded");
                $img.removeClass("smallimage");
                $filedetail.css("margin-top", "1px");
            } else {
                return false;
            }
        });
    };
    self.clearImageDetail = function () {
        var $rightImage = $imagedetails.find(".rightimage"),
            $rightfileName = $imagedetails.find(".filename"),
            $rightfileDate = $imagedetails.find(".filedate"),
            $rightfileSize = $imagedetails.find(".filesize");

        if ($rightImage.length > 0) {
            $rightImage.css("display", "none");
            $rightfileName.css("display", "none");
            $rightfileDate.css("display", "none");
            $rightfileSize.css("display", "none");
        }
    };
    self.renderServerImageFiles = function (data) {
        setTimeout(function () {
            imagesFromServer = data;  // can handle arrays of directories of files
            currentPath = '';
            folders = [];
            files = [];

            $offscreenimage.on("load", function () {
                var $rightImage = $imagedetails.find(".rightimage");

                if (($offscreenimage.width() + 20) < $imagedetails.width()) {
                    $rightImage.css("width", $offscreenimage.width());
                } else {
                    $rightImage.css("width", "95%");
                }

                if (($offscreenimage.height() + 20) < $imagedetails.height()) {
                    $rightImage.css("height", $offscreenimage.height());
                } else {
                    $rightImage.css("height", "87%");
                }
            });

            $difilesearch.click(function (e) {
                $searchInput.show().focus();
            });

            $searchInput.bind('input', function (e) {
                folders = [];
                files = [];
                if ($searchInput.val().trim().length === 0) {
                    $searchInput.parent().find('span').show();
                    $searchInput.blur();
                    doSearch();
                } else {
                    if (timeout !== null) {
                        clearTimeout(timeout);
                    }
                    timeout = setTimeout(function () {
                        doSearch($searchInput.val());
                    }, 200);

                    if (e.keyCode === 27) {
                        $searchInput.trigger('blur');
                    }
                }
            });

            //$(window).scroll(function () {
            //    var wintop = $(window).scrollTop(),
            //        winheight = $(window).height();
            //
            //    if (wintop > lastScrollPosition) {
            //        displayNextGroup(wintop, wintop + winheight);
            //    }
            //
            //    lastScrollPosition = wintop;
            //});

            function doSearch(searchString) {
                var rendered = '';

                $diimagebrowsingdata.css("display", "none");
                if (searchString && searchString.length > 0) {
                    rendered = searchData(imagesFromServer, searchString);
                    renderFiles(rendered);
                } else {
                    rendered = searchData(imagesFromServer);
                    renderFiles(rendered);
                }
            }

            function searchData(filelist, searchTerm) {
                var scannedFiles = filelist.files,
                    filename,
                    filenameArray,
                    fileType,
                    searchTermMatch = false,
                    imageTypeMatch = false,
                    answer;

                files = [];
                self.clearImageDetail();
                if (scannedFiles.length) {
                    scannedFiles.forEach(function (d) {
                        filename = d.file.filename.toLowerCase();
                        filenameArray = filename.split(".");
                        fileType = filenameArray[filenameArray.length - 1];

                        if (searchTerm === undefined) {  // no search defined
                            searchTermMatch = true;
                        } else {
                            searchTermMatch = filename.match(searchTerm);
                        }

                        if (self.typeOfImage === undefined) {  // no imagetype defined
                            imageTypeMatch = true;
                        } else {
                            imageTypeMatch = self.typeOfImage === "*" || (fileType === self.typeOfImage);
                        }

                        if (searchTermMatch && imageTypeMatch) {
                            files.push(d);
                        }
                    });
                    answer = {folders: folders, files: files, path: filelist.path};
                }

                return answer;
            }

            function setFilesClickEvent() {
                $filemanager.find('.file').click(function () {
                    var $fileDiv = $(this),
                        $li = $fileDiv.parent(),
                        $img = $fileDiv.find(".smallimage"),
                        $filename = $fileDiv.find(".filename"),
                        $filedate = $fileDiv.find(".filedate"),
                        $filesize = $fileDiv.find(".filesize"),
                        $rightImage = $imagedetails.find(".rightimage"),
                        $rightfileName = $imagedetails.find(".filename"),
                        $rightfileDate = $imagedetails.find(".filedate"),
                        $rightfileSize = $imagedetails.find(".filesize");

                    $difiles.find(".selectedFile").each(function () {
                        $(this).removeClass("selectedFile");
                    });
                    $li.addClass("selectedFile");
                    $offscreenimage.attr('src', $img.attr('datasrc'));
                    $offscreenimage.attr('filename', $filename.text());
                    $rightImage.attr('src', $img.attr('datasrc'));
                    $rightfileName.text($filename.text());
                    $rightfileDate.text($filedate.text());
                    $rightfileSize.text($filesize.text());
                    $imagedetails.css("display", "block");
                    $rightImage.css("display", "block");
                    $rightfileName.css("display", "block");
                    $rightfileDate.css("display", "block");
                    $rightfileSize.css("display", "block");
                    self.selectedFileName = $filename.text();
                });
            }

            function setDisplayToBlock() {
                $difilesearch.css("display", "block");
                $diimagebrowsingdata.css("display", "block");
                $difiles.css("display", "block");
                $imagedetails.css("display", "block");
                $difilelist.css("display", "block");
                $filebrowserok.css("display", "block");
                $filebrowserok.removeClass("ui-shadow");
                $filebrowsercancel.css("display", "block");
                $filebrowsercancel.removeClass("ui-shadow");
                $difiles.scrollTop();  // scroll to top
            }

            function renderFiles(arrayOfFiles) {   // Render the HTML for the file manager
                //console.log("- - renderFiles() called");
                var scannedFolders = arrayOfFiles.folders,
                    scannedFiles = arrayOfFiles.files,
                    path = arrayOfFiles.path;

                self.selectedFileName = "";
                $diimagebrowsingdata.css("display", "none");
                $difiles.empty().hide();  // Empty the old result and make the new one

                if (!scannedFolders.length && !scannedFiles.length) {
                    $nothingfound.css("display", "block");
                    $imagedetails.css("display", "none");
                    $difilelist.css("display", "none");
                    $filecounter.hide();
                } else {
                    $nothingfound.hide();
                    $filecounter.show();
                }

                if (scannedFiles.length) {
                    var liFiles = [];
                    $filecounter.html("Files: " + scannedFiles.length);
                    scannedFiles.forEach(function (f) {
                        var name = encodeURI(f.file.filename),
                            fileSize = f.file.filesize,
                            fileDate = new Date(f.file.modifieddate),
                            image = "<img class='smallimage' datasrc='" + path + name + "' src=''></img>",
                            br = "<br/>",
                            filename = "<div class='filename' >" + decodeURI(name) + "</div>",
                            filedate = "<div class='filedate' >" + fileDate.toLocaleString() + "</div>",
                            filesize = "<div class='filesize' >" + bytesToSize(fileSize) + "</div>",
                            fileDetail = "<div class='filedetail'> " + filename + filedate + filesize  + "</div>",
                            fileDiv = "<div class='file' >" + image + br + fileDetail + "</div>",
                            li = "<li>" + fileDiv + "</li>";

                        liFiles.push(li);
                    });

                    $difiles.append(liFiles.join(''));
                    setDisplayToBlock();
                }

                setFilesClickEvent();
                //console.log("- - renderFiles() finished");
            }

            function bytesToSize(bytes) {  // Convert file sizes from bytes to human readable units
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes == 0) return '0 Bytes';
                var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
            }

            doSearch();
        }, 1);
    };
    self.getData = function () {
        if (imagesFromServer && imagesFromServer.files && imagesFromServer.files.length > 0) {
            self.renderServerImageFiles(imagesFromServer);
        } else {
            $.ajax({
                url: '/displays/listassets',
                method: 'GET',
                contentType: 'application/json',
                dataType: 'json'
            }).done(function (data) {
                self.renderServerImageFiles([data][0]);
            });
        }
    }
};

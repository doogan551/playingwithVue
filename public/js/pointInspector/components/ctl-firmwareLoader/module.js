define(['knockout', 'text!./view.html'], function(ko, view) {
    function ViewModel(params) {
        var self = this;
        self.root = params.rootContext;
        self.point = self.root.point;
        self.data = self.point.data;
        self.socket = self.root.socket;
        self.utility = self.root.utility;
        self.model = self.data["Model Type"].Value();

        self.modal = {
            error: ko.observable(''),
            template: ko.observable(''),
            showModal: ko.observable(false),
            submitText: ko.observable(''),
            finishedText: ko.observable(''),
            title: ko.observable(''),
            value: ko.observable(''),
            isDownloading: ko.observable(false),
            cancel: function() {
                $('.progress-bar').removeClass('progress-bar-danger');
                $('.progress-bar').removeClass('progress-bar-success');
                $('.progress-bar').css('width', '0%');
                $('.progress-bar').text('0%');
                $('.modal').modal('hide');
            },
            submit: function() {}
        };
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.firmwareLoader = function() {
        var self = this,
            $btn = $(event.target),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal'),
            $modalScene,
            $modalError,
            $modalWait,
            $modalLoad,
            $modalProgress,
            $btnSubmit = $modal.find('.btnSubmit'),
            modal = this.modal,
            uploadFile;
        $modal.modal();
        self.firmwareFiles = ko.observableArray([]);
        self.selectedFile = ko.observable();
        self.progressMessage = ko.observable('');
        self.progressPercent = ko.observable(0);
        
        $('.progressmsgtxt').text('');
        $('.afterLoad').hide();
        $('.beforeLoad').show();

        self.uploadFile = function(file) {
            console.log("file", file);
            uploadFile = file;
            if (file !== undefined && file !== null) {
                //self.showCheck(true);
            } else {
                //self.showCheck(false);
            }
        };

        self.start = function() {
            var firmwareObject = {
                    model: self.model,
                    devices: [],
                    remotes: [],
                    upi: self.data._id(),
                    logData: {
                        user: self.utility.workspace.user(),
                        point: {
                            _id: self.data._id(),
                            Security: self.data.Security(),
                            Name: self.data.Name(),
                            name1: self.data.name1(),
                            name2: self.data.name2(),
                            name3: self.data.name3(),
                            name4: self.data.name4(),
                            "Point Type": {
                                eValue: self.data["Point Type"].eValue()
                            },
                            "Firmware Version": self.data["Firmware Version"].Value()
                        }
                    }
                },
                fileReader = new FileReader(),
                callback = function(response) {
                    // console.log("inside callback", response);
                    $modalProgress.show();
                    $modalWait.show();

                    if (response.percent !== undefined) {
                        self.progressPercent(parseInt(response.percent, 10));
                        $('.progress-bar').removeClass('progress-bar-danger');
                        $('.progress-bar').removeClass('progress-bar-success');
                        $('.progress-bar').css('width', self.progressPercent() + '%');
                        $('.progress-bar').text(self.progressPercent() + "%");
                    } else if (response.err !== undefined) {
                        $('.progress-bar').addClass('progress-bar-danger');
                        $('.progress-bar').css('width', '100%');
                        $('.progressmsgtxt').text(response.err);
                        $btnSubmit.prop('disabled', false);
                        self.modal.isDownloading(false);
                    } else {
                        if (response.msg === 'DeviceLoader session Done') {
                            $('.progress-bar').addClass('progress-bar-success');
                            $('.beforeLoad').hide();
                            $('.afterLoad').show();
                            $btnSubmit.prop('disabled', false);
                            self.modal.isDownloading(false);
                        }
                        $modalWait.hide();
                        $('.progressmsgtxt').text(response.msg);
                    }
                };

            if (self.data["Point Type"].eValue() === 8) {
                firmwareObject.devices = [self.data._id()];
            } else if (self.data["Point Type"].eValue() === 144) {
                firmwareObject.devices = [this.root.utility.getPointRefProperty("Device Point").data.Value()];
                firmwareObject.remotes = [self.data._id()];
            }

            if (uploadFile !== undefined) {
                fileReader.onload = function() {
                    firmwareObject.uploadFile = fileReader.result;
                    firmwareObject.fileName = uploadFile.name;
                    firmwareObject.saveFile = self.saveCheck();
                };
                fileReader.readAsText(uploadFile);
            } else {
                firmwareObject.fileName = self.selectedFile();
            }

            self.sendToFirmwareLoader(firmwareObject, callback);

        };

        self.sendToFirmwareLoader = function(data, callback) {
            self.socket.emit('firmwareLoader', data);
            self.socket.on('returnFromLoader', function(response) {
                //response = $.parseJSON(response);
                if (typeof callback == 'function') {
                    callback.call(undefined, response);
                }
            });
        };

        $modal.one('hide.bs.modal', function(e) {
            $modalScene.hide();
            self.progressMessage('');
        });
        $modal.one('shown.bs.modal', function(e) {


            if (self.modal.isDownloading()) {

                $modalProgress.show();
                $modalWait.show();
            } else {
                $modalLoad.show();
            }
            $.getJSON('/api/firmwareLoader/get/' + self.model, function(data) {
                if (data.err) {
                    console.log(data.err);
                    $btnSubmit.prop('disabled', true);
                } else {
                    if (!!data.files.length) {
                        if (!!self.selectedFile) {
                            self.selectedFile(data.files[0]);
                        }
                        $btnSubmit.prop('disabled', false);
                        self.firmwareFiles(data.files);
                    } else {

                        self.firmwareFiles(['No files found']);
                        $btnSubmit.prop('disabled', true);
                    }

                }
            });
        });

        modal.template('read');
        modal.value('');
        modal.title('Load Firmware');
        modal.submitText('Start');
        modal.finishedText('Finished');

        $modalScene = $modal.find('.modalScene');
        $modalError = $modal.find('.modalError');
        $modalWait = $modal.find('.modalWait');
        $modalLoad = $modal.find('.modalLoad');
        $modalProgress = $modal.find('.modalProgress');


        modal.submit = function() {
            self.modal.isDownloading(true);
            $modalScene.hide();
            $modalProgress.show();
            $modalWait.show();
            $btnSubmit.prop('disabled', true);
            self.start();
        };
        modal.showModal(true);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {};

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
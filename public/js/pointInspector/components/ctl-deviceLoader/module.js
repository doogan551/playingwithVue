define(['knockout', 'text!./view.html'], function(ko, view) {
    function ViewModel(params) {
        var self = this;
        self.root = params.rootContext;
        self.point = self.root.point;
        self.data = self.point.data;
        self.socket = self.root.socket;

        self.modal = {
            error: ko.observable(''),
            template: ko.observable(''),
            showModal: ko.observable(false),
            submitText: ko.observable(''),
            finishedText: ko.observable(''),
            title: ko.observable(''),
            value: ko.observable(''),
            isDownloading: ko.observable(false),
            cancel: function() {},
            submit: function() {}
        };
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.deviceLoader = function() {
        var self = this,
            $btn = $(event.target),
            $btnIcon = $btn.find('i.fa'),
            $modal = $('.modal'),
            $modalScene,
            $modalError,
            $modalWait,
            $modalValue,
            $btnSubmit = $modal.find('.btnSubmit'),
            modal = this.modal,
            uploadFile;

        self.firmwareFiles = ko.observableArray([]);
        self.selectedFile = ko.observable();
        self.progressMessage = ko.observable();
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
                    model: self.data["Model Type"].Value(),
                    devices: [],
                    remotes: []
                },
                fileReader = new FileReader(),
                callback = function(response) {
                    console.log("inside callback", response);
                    $modalWait.hide();
                    $modalProgress.show();
                    $('.beforeLoad').hide();
                    $('.afterLoad').show();
                    if (response.percent !== undefined) {
                        $('.progress-bar').css('width', parseInt(response.percent, 10) + '%');
                        $('.progress-bar').text(parseInt(response.percent, 10) + "%");
                    } else if (response.err !== undefined) {
                        $('.progress-bar').addClass('progress-bar-danger');
                        self.progressMessage(response.err);
                        $btnSubmit.prop('disabled', false);
                        self.modal.isDownloading(false);
                    } else {
                        self.progressMessage(response.message);
                        $btnSubmit.prop('disabled', false);
                        self.modal.isDownloading(false);
                    }
                };

            if (self.data["Point Type"].eValue() === 8) {
                firmwareObject.devices = [self.data._id()];
            } else if (self.data["Model Type"].eValue() === 3 || self.data["Model Type"].eValue() === 6) {
                firmwareObject.devices = [this.root.utility.getPointRefProperty("Device Point").data.Value()];
                firmwareObject.remotes = [self.data._id()];
            }

            if (uploadFile !== undefined) {
                fileReader.onload = function() {
                    firmwareObject.uploadFile = fileReader.result;
                    firmwareObject.fileName = uploadFile.name;
                    firmwareObject.saveFile = self.saveCheck();
                    console.log(firmwareObject);
                };
                fileReader.readAsText(uploadFile);
            } else {
                firmwareObject.fileName = self.selectedFile();
                console.log(firmwareObject);
            }

            self.sendToDeviceLoader(firmwareObject, callback);

        };

        self.sendToDeviceLoader = function(data, callback){

            self.socket.emit('deviceLoader', data);
            self.socket.on('returnFromLoader', function(response){
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
            if (!self.modal.isDownloading()) {
                $modalLoad.show();
            } else {
                $modalLoad.hide();
            }
            $.getJSON('/api/deviceLoader/get', function(data) {
                if (data.err)
                    alert(data.err);
                else {
                    self.firmwareFiles(data.files);
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
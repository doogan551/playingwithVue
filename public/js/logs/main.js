$(document).ready(function() {

  $('.logLabel').on('click', function() {
    console.log('log click');
  });

  $('.exceptLabel').on('click', function() {
    console.log('except click');
  });

});

function ViewModel() {
  var self = this;
  self.logs = ko.observableArray([]);
  self.logsLimit = ko.computed(function() {
    return self.logs();
  }, self);

  socket = io.connect('http://' + window.location.hostname + ':8085');
  socket.emit('getLogs');
  socket.on('newLog', function(data) {
    console.log(data);
    if (data.hasOwnProperty('file')) {
      self.logs(data.file);
    } else {
      self.logs.unshift(data);
      console.log(self.logs().length);
    }
  });
}
ko.applyBindings(new ViewModel());
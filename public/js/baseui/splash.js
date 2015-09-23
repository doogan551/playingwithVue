window.splash = (function(module, ko, $) {
    var workspace = window.opener && window.opener.workspaceManager,
        socket = workspace.socket;

    function ViewModel() {
        var self = this,
            getCounts = function() {
                for (var i = 0; i < self.alarms().length; i++) {
                    fetchCount(self.alarms()[i]);
                }
            },
            fetchCount = function(alarm) {
                $.ajax({
                    type: 'GET',
                    url: '/api/system/getCounts/' + alarm.name
                }).done(function(data) {
                    if (!data.err)
                        alarm.count(data);
                    $('.searchBar').focus();
                });
            };
        /*
                self.root = params.rootContext;
                self.apiEndpoint = self.root.apiEndpoint;*/

        self.alarms = ko.observableArray([{
            name: "Recent",
            count: ko.observable(0)
        }, {
            name: "Urgent",
            count: ko.observable(0)
        }, {
            name: "Emergency",
            count: ko.observable(0)
        }, {
            name: "Critical",
            count: ko.observable(0)
        }]);

        self.results = ko.observableArray([]);
        self.selectedObject = ko.observable();
        getCounts();
    }

    module.init = function(callback) {
        viewModel = new ViewModel();

        $('.searchSpinner').hide();

        var results = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote: {
                url: '/api/points/globalSearch/%QUERY',
                wildcard: '%QUERY'
            }
        });
        $('.searchBar').typeahead({
                hint: $('.searchHint'),
                menu: $('.searchMenu'),
                minLength: 3,
                highlight: true
            }, {
                name: 'results',
                display: 'Name',
                async: true,
                limit: 20,
                source: results,
                templates: {
                    empty: template = Handlebars.compile($("#noResults").html()),
                    suggestion: template = Handlebars.compile($("#template").html())
                }
            }).on('typeahead:asyncrequest', function() {
                $('.searchSpinner').show();
            })
            .on('typeahead:asynccancel typeahead:asyncreceive', function() {
                $('.searchSpinner').hide();
            });

        $('.searchBar').bind('typeahead:select', function(ev, suggestion) {
            viewModel.openPoint(suggestion);
        });

        ko.applyBindings(viewModel);
    };

    ViewModel.prototype.search = function() {
        var self = this,
            val = $(".searchBar").val(),
            tags = val.split(' ');

        $.ajax({
            type: 'post',
            url: '/api/points/globalSearch',
            data: {
                tags: tags
            }
        }).done(function(data) {
            if (!data.err)
                self.results(data);

            if (data.length > 0) {
                $('.searchResults').show();
            } else {
                $('.searchResults').hide();
            }
        });
    };

    ViewModel.prototype.clearSearch = function() {
        $('.searchBar').focus();
        $('.searchBar').typeahead('val', '');
    };

    ViewModel.prototype.openPoint = function(data) {
        var endPoint, win, width, height, pointType;
        //console.log(data);
        if (data.pointType !== 'Schedule Entry' && data.pointType !== 'Schedule') {
            pointType = data.pointType;
            width = 820;
            height = 542;
        } else {
            pointType = 'Schedule';
            width = 1250;
            height = 750;
        }
        endPoint = workspace.config.Utility.pointTypes.getUIEndpoint(pointType, data._id);
        win = workspace.openWindowPositioned(endPoint.review.url, data.Name, pointType, '', data._id, {
            width: width,
            height: height
        });
        $('.searchBar').typeahead('val', '');
    };

    return module;
})(window.splash || {}, ko, jQuery);


$(window.splash.init);
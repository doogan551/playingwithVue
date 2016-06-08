var workspace = window.opener && window.opener.workspaceManager
var qualityCodes = workspace.systemEnums.qualityCodes;
var socket = workspace.socket();

var openedClass = 'glyphicon-minus-sign';
var closedClass = 'glyphicon-plus-sign';

var inFaultColor;
var stopScanColor;
var normalColor = '008800';

for (var i = 0; i < qualityCodes.length; i++) {
    if (qualityCodes[i].label === 'Fault') {
        inFaultColor = qualityCodes[i].color;
    } else if (qualityCodes[i].label === 'Stop Scan') {
        stopScanColor = qualityCodes[i].color;
    }
}

var maxSpanLength = 0;
var mouseX;
var mouseY;
$(document).mousemove(function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
});

function TreeViewModel() {
    var self = this;
    var i;
    var matchedSpans = [];
    var searchIndex = 0;
    var regex;

    var networkSearch = false;

    self.loadTree = function() {
        self.tree([]);
        self.networks([]);
        self.badNetworks([]);
        $('.loadingIcon').show();
        $.getJSON('/api/devicetree/getTree', function(response) {
            var responseModel = ko.viewmodel.fromModel(response);
            self.tree(responseModel.tree());
            // for (i = 0; i < response.tree.length; i++) {
            //     self.tree.push(response.tree[i]);
            // }
            for (i = 0; i < response.networkNumbers.length; i++) {
                self.networks.push(response.networkNumbers[i]);
            }
            for (i = 0; i < response.badNumbers.length; i++) {
                self.badNetworks.push(response.badNumbers[i]);
            }

            $('.loadingIcon').hide();
            $('#tree2').treed();
            $('.fa-refresh').removeClass('fa-spin');
            /*$("#tree2 span").each(function(){
                var offsets = $(this).offset();
                var farRight = $(this).offset().left + $(this).context.offsetWidth;
                if(farRight > maxSpanLength){
                    maxSpanLength = farRight;
                }
            });*/
        });
    };

    self.networks = ko.observableArray([]);
    self.tree = ko.observableArray([]);
    self.badNetworks = ko.observableArray([]);
    self.branches = ko.observableArray([]);

    self.fakeTree = ko.observableArray([]);

    self.searchValue = ko.observable('').extend({
        throttle: 250
    });

    self.upi = ko.observable();
    self.name = ko.observable('');
    self.network = ko.observable('');
    self.netType = ko.observable('');
    self.deviceAddress = ko.observable('');
    self.deviceStatus = ko.observable('');
    self.lastReportTime = ko.observable('');
    self.modelType = ko.observable('');
    self.firmwareRevision = ko.observable('');

    self.searchValue.subscribe(function(value) {
        searchIndex = 0;
        if (!!value) {
            self.deviceSearch();
        } else {
            self.clearSearch();
        }
    });

    self.devAddress = function(data){
        // if ethernet uplink
        // dev address : eth ip port #
        // else just dev add
        if(data.uplinkPort()===0){
            return ['(',data.deviceAddress(),':',data.ethIPPort(),')'].join('');
        }else{
            return ['(',data.deviceAddress(),')'].join('');
        }
        return 'test';
    };

    self.showDevice = function(item, e, t) {
        var rightSide = $(e.target).offset().left + $(e.target).context.offsetWidth;

        $.getJSON('/api/points/' + item.upi(), function(response) {
            if (response.err) {

            } else {
                $('.overlay').css({
                    'top': mouseY,
                    'left': rightSide,
                    'display': 'block'
                });
                var bodyOffsets = document.body.getBoundingClientRect();
                var overLayOffsets = $('.overlay')[0].getBoundingClientRect();
                if (overLayOffsets.bottom > bodyOffsets.bottom) {
                    mouseY -= (overLayOffsets.bottom - bodyOffsets.bottom - 40);
                } else {
                    mouseY = $(e.target).offset().top;
                }

                $('.overlay').css({
                    'top': mouseY,
                    'left': rightSide + 25,
                    'display': 'block'
                });

                var time = parseInt(response['Last Report Time'].Value, 10);
                var mom = moment.unix(time).format('dddd, MMMM Do YYYY, h:mm:ss a');

                self.upi(response._id);
                self.name(response.Name);
                self.network(response['Network Segment'].Value);
                self.netType(response['Uplink Port'].Value);
                self.deviceAddress(response['Device Address'].Value);
                self.deviceStatus(response['Device Status'].Value);
                self.lastReportTime(mom);
                self.modelType(response['Model Type'].Value);
                self.firmwareRevision(response['Firmware Version'].Value);

                $('.deviceStatus').css('background-color', '');
                $('.deviceStatus').css('color', '');
                var rgb = [];
                var hex = '';

                if (self.deviceStatus() === 'Stop Scan') {
                    hex = stopScanColor;
                } else if (self.deviceStatus() !== 'Normal') {
                    hex = inFaultColor;
                } else {
                    hex = normalColor;
                }

                if (!!hex) {
                    $('.deviceStatus').css('background-color', '#' + hex);

                    for (var i = 0; i < 6; i += 2) {
                        rgb.push(parseInt(hex.substr(i, 2), 16));
                    }

                    var bgDelta = (rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114);
                    var foreColor = (255 - bgDelta < 105) ? 'Black' : 'White';

                    $('.deviceStatus').css('color', foreColor);
                }


            }

        });
    }

    self.hideDevice = function() {
        $('.overlay').css('display', 'none');
    }

    self.statusColor = function(e) {
        var hex;
        if (!e.badNetwork) {

            if (e.status() === 'Stop Scan') {
                hex = stopScanColor;
            } else if (e.status() !== 'Normal') {
                hex = inFaultColor;
            } else {
                hex = normalColor;
            }
        } else {
            hex = 'FF0000';
        }

        return (!!hex) ? '#' + hex : '';
    };

    self.deviceSearch = function() {
        if (!networkSearch) {
            regex = new RegExp('.*' + self.searchValue().toString().split(' ').join('_') + '.*', 'i');
            self.scrollToElement(regex);
        }
    };

    self.networkSearch = function(val) {
        // TODO: keep class, when searching for network, iterate over the matching network names when bad is clicked(multiple present)
        networkSearch = true;
        self.searchValue(val);
        regex = new RegExp('^' + val + '$');
        self.scrollToElement(regex);
    };

    self.scrollToElement = function(elem, index) {
        searchIndex = (index !== undefined) ? index : searchIndex;

        matchedSpans = [];
        self.resetTree();

        $('span.searchable').filter(function() {
            if (!!this.textContent.match(elem)) {
                matchedSpans.push(this);
            }
            return this.textContent.match(elem);
        }).css('background-color', '#86E2D5');

        if (matchedSpans.length > searchIndex) {
            $scrollTo = $(matchedSpans[searchIndex]);
            $scrollTo.css('background-color', '#FDE3A7');
            self.exapandAll();
            $('.treePane').animate({
                scrollTop: $scrollTo.offset().top - $('.treePane').offset().top - 135,
                scrollLeft: 0
            }, 0);

            setTimeout(function() {
                networkSearch = false;
            }, 250);
        }
    };

    self.clearSearch = function() {
        self.searchValue('');
        self.resetTree();
    };

    self.resetTree = function() {
        $('.treePane').scrollTop(0);
        $('span').css('background-color', '');
    };

    self.openDevice = function(t, e) {
        var endPoint = workspace.config.Utility.pointTypes.getUIEndpoint("Device", t.upi());
        var win = workspace.openWindowPositioned(endPoint.review.url, t.text(), 'Device', '', t.upi(), {
            width: 1250,
            height: 750
        });
    };

    self.searchNext = function() {
        self.search(1);
    };

    self.searchPrev = function() {
        self.search(-1);
    };

    self.search = function(direction) {
        // var regex = new RegExp('.*' + self.searchValue() + '.*', 'i');
        var newIndex = searchIndex + direction;

        if (!!matchedSpans.length) {
            if (direction > 0 && newIndex >= matchedSpans.length) {
                newIndex = 0;
            } else if (direction < 0 && newIndex < 0) {
                newIndex = matchedSpans.length - 1;
            }
            self.scrollToElement(regex, newIndex);
        }
    };

    self.exapandAll = function() {
        var tree = $('.tree');
        tree.find('li').has("ul").each(function() {
            var branch = $(this);
            var icon = $(this).children('i:first');
            icon.removeClass(closedClass);
            icon.addClass(openedClass);
            branch.children().children().show();
        });
    };

    self.collapseAll = function() {
        var tree = $('.tree');
        tree.find('li').has("ul").each(function() {
            var branch = $(this);
            var icon = $(this).children('i:first');
            icon.removeClass(openedClass);
            icon.addClass(closedClass);
            branch.children().children().hide();
        });
    };

    self.refresh = function() {
        $('.fa-refresh').addClass('fa-spin');
        self.loadTree();
    };

    $('.searchArea').on('keydown', function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            if (e.shiftKey) {
                self.searchPrev();
            } else {
                self.searchNext();
            }
        }
    });

    socket.on('updateDeviceStatus', function(data) {
        var status = data["Device Status"].Value;
        var upi = data.upi;

        var findBranches = function(branch) {
            for (var j = 0; j < branch.branches().length; j++) {
                if (branch.branches()[j].upi() === upi) {
                    branch.branches()[j].status(status);
                    console.log(branch.branches()[j]);
                    return;
                }
                for (var k = 0; k < branch.branches()[j].branches().length; k++) {
                    findBranches(branch.branches()[j].branches()[k]);
                }
            }
        };

        for (var i = 0; i < self.tree().length; i++) {
            findBranches(self.tree()[i]);
            break;
        }
    });

    self.loadTree();

}

ko.applyBindings(new TreeViewModel());

//Initialization of treeviews
/*$('#tree1').treed();
$('#tree2').treed();*/
// $('#tree3').treed();
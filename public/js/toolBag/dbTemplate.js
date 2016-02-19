var resTemplate =   "<table class='table table-striped table-condensed' style='font-size:small; border-collapse:separate;'>\
                        <tbody data-bind='foreach: templateData'>\
                            <tr>\
                                <td width='400'>\
                                    <div>id: <span data-bind='text: _id'></span></div>\
                                    <div>Name: <span data-bind='text: Name'></span></div>\
                                </td>\
                                <td data-bind='foreach: Problems'>\
                                    <div data-bind='text: $data'></div>\
                                </td>\
                            </tr>\
                        </tbody>\
                    </table>";

var navTemplate =   "<li>\
                        <a href='#{_pointType}' data-toggle='tab'>{pointType}\
                            <span data-bind='text: points()[{i}].n_prob, visible: !points()[{i}].err() && !points()[{i}].busy()'></span>\
                            <i data-bind='visible: points()[{i}].busy', class='fa fa-spinner fa-spin'></i>\
                            <i data-bind='visible: points()[{i}].err',  class='fa fa-exclamation-circle', style='color:red;'></i>\
                        </a>\
                    </li>";

var conTemplate =   "<div class='tab-pane' id='{_pointType}'>\
                        <span style='font-weight:bold; font-size:larger'>{pointType}</span>\
                        <input type='button' data-bind='click: points()[{i}].checkProperties, disable: points()[{i}].busy', value='Check {pointType} Properties Now' style='float:right' class='btn btn-primary'>\
                        <br /><br />\
                        <div data-bind='visible: points()[{i}].err, text:points()[{i}].errMsg' style='color:red'></div>\
                        <div data-bind='visible: points()[{i}].n_prob() == \"(0)\"'>No problems found.</div>\
                        <div class='{_pointType}'></div>\
                    </div>";

var myViewModel;
var socket = io.connect('https://' + window.location.hostname);

// Data object returned looks like this:
// data.ndx        = Int
// data.pointType  = String
// data._pointType = String
// data.domElement = String
// data.results = Array
// data.err = Boolean
// data.errMsg = String
socket.on('returnProperties', function (data) {
    var i,
        len,
        result,
        n_prob = 0,
        point = myViewModel.points()[data.ndx],
        pointViewmodel = {},
        $resTemplate = $(resTemplate);

    console.log("data", data);

    pointViewmodel.templateData = [];

    for (i = 0, len = data.results.length; i < len; i++) {
        result = data.results[i];
    
        pointViewmodel.templateData.push({
            '_id': result._id,
            'Name': result.Name,
            'Problems': result.Problems
        });
        n_prob += result.Problems.length;
    }
    
    ko.applyBindings(pointViewmodel, $resTemplate[0]);
    $(data.domElement).html($resTemplate);

    point.n_prob('(' + n_prob + ')');
    point.busy(false);
    point.err(data.err);
    point.errMsg(data.errMsg);

    $('.table').delegate("td", "click", function () {
        if ($(this).closest("tr").hasClass('highlightedRow') === true) {
            $(this).closest("tr").removeClass('highlightedRow');
        } else {
            $('.table').find('tr.highlightedRow').removeClass('highlightedRow');
            $(this).closest("tr").addClass('highlightedRow');
        }
    });
});

myViewModel = (function () {
    var self = {},
        pointType,
        myTemplate,
        i = 0;

    self.points = ko.observableArray();

    for (pointType in Config.Enums["Point Types"]) {
        var temp = {};

        temp.ndx        = i;
        temp.pointType  = pointType;
        temp._pointType = pointType.replace(' ', '_');
        temp.domElement = '.' + temp._pointType;
        temp.busy       = ko.observable(false);
        temp.err        = ko.observable(false);
        temp.errMsg     = ko.observable();
        temp.n_prob     = ko.observable('(0)');

        temp.checkProperties = (function () {
            // We've created a new function to create scope for variable 'ndx'. Otherwise ndx would 
            // always point to the last point evaluated in the parent for loop.
            var ndx = i;

            return function () {
                self.points()[ndx].err(false);
                self.points()[ndx].busy(true);
                ko.removeNode($(self.points()[ndx].domElement).children());
                $(self.points()[ndx].domElement).empty();

                socket.emit('checkPropertiesForOne', {
                    ndx: self.points()[ndx].ndx,
                    pointType:  self.points()[ndx].pointType,
                    _pointType: self.points()[ndx]._pointType,
                    domElement: self.points()[ndx].domElement
                });
            };
        })();
        self.points.push(temp); // We have to push our incomplete object onto the array
        i++;
    }

    self.All = {};
    self.All.busy = ko.computed(function () {
        var i = 0,
            value = false,
            len = self.points().length;

        for (i = 0; i < len; i++) {
            value = value || self.points()[i].busy();
            
            if (value === true) {
                break;
            }
        }
        return value;
    });
    self.All.err = ko.computed(function () {
        var i = 0,
            value = false,
            len = self.points().length;

        for (i = 0; i < len; i++) {
            value = value && self.points()[i].err();
            
            if (value === false) {
                break;
            }
        }
        return value;
    });
    self.All.n_prob = ko.computed(function () {
        var i = 0,
            value = 0,
            len = self.points().length;

        for (i = 0; i < len; i++) {
            if (self.points()[i].n_prob() !== undefined) {
                value += parseInt(self.points()[i].n_prob().replace('(', '').replace(')', ''), 10);
            }
        }
        return ('(' + value + ')');
    });
    self.All.checkProperties = function () {
        var i = 0,
            len = self.points().length;

        for (i = 0; i < len; i++) {
            self.points()[i].checkProperties();
        }
    };

    return self;
}());

function buildView() {
    var i,
        point,
        nav,
        con,
        navContainer = $(".nav-tabs"),          // Navigation HTML container
        conContainer = $(".tab-content"),       // Content HTML container
        len = myViewModel.points().length;      // Number of points in view model

    for (i = 0; i < len; i++) {
        point = myViewModel.points()[i];

        // Create new tab content and load it into the page
        con = conTemplate.replace(new RegExp("{i}", "g"), i).replace(new RegExp("{pointType}", "g"), point.pointType).replace(new RegExp("{_pointType}", "g"), point._pointType);
        conContainer.append(con);

        // Create a new tab and load it into the page
        nav = navTemplate.replace(new RegExp("{i}", "g"), i).replace(new RegExp("{pointType}", "g"), point.pointType).replace(new RegExp("{_pointType}", "g"), point._pointType);
        navContainer.append(nav);

        $("#All").append("<br /><div data-bind='visible:points()[" + i + "].n_prob() != \"(0)\"'><span style='font-weight:bold; font-size:larger'> " + point.pointType + "</span><div class='" + point._pointType + "'></div></div>");

        // We only show 7 tabs.  We put the rest in a 'More' drop down tab.
        if (i === 5) {
            // Add the 'More' drop down tab.  The rest of the tabs will go into this thing we're creating below
            navContainer.append(
                "<li class='dropdown'>\
                    <a href='#' class='dropdown-toggle' data-toggle='dropdown'>More <b class='caret'></b></a>\
                    <ul class='dropdown-menu' role='menu'>"     // We have to close this tag once we get out of the for!
            );
            navContainer = $(".dropdown-menu");     // The remainder of tab elements go into the drop down menu tab

            // long form answer: typically when you create interactive elements, like the tabs, when you do the initialization, it only grabs the elements 
            // that are on screen.  if you add them later, they don't know what to do because they weren't in that list.  to avoid this, you put the listener 
            // on the container and put a selector on the event listener.  so instead of the individual elements knowing what to do, the container knows both 
            // what to do and which elements should be notified.)
            // $('#' + point._pointType).tab('show');      // Tell bootstrap to add the tab to the tab 'list'/component
        }
    }
    navContainer.append("</ul>");  // Close the drop down unordered list HTML element
}

// onReady
$(function () {
    buildView();
    ko.applyBindings(myViewModel);
});
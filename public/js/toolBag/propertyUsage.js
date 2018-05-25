function Manager() {
    var self = this,
        list = [],
        getCSV = function () {
            var props  = Config.Enums.Properties,
                common = Config.PointTemplates._common,
                points = Config.PointTemplates.Points,
                csv = 'Property',
                pointName,
                propName,
                pointHasProperty = function (pt, pr) {
                    if (pt.hasOwnProperty(pr)) {
                        return ',X';
                    } else if (pt.hasOwnProperty('Point Refs')) {
                        for (var i = 0, len = pt['Point Refs'].length; i < len; i++) {
                            if (pt['Point Refs'][i].PropertyName === pr) {
                                return ',X';
                            }
                        }
                    }
                    return ',';
                };

            for (pointName in points) {
                csv += ',' + pointName;
            }
            csv += '<br />';
            for (propName in props) {
                csv += propName;
                for (pointName in points) {
                    csv += pointHasProperty(points[pointName], propName);
                }
                csv += '<br />';
            }
            return csv;
        };

    self.propertyFilter = ko.observable('');
    self.propertyList   = ko.observableArray([]).extend({throttle: 100});

    self.buildList = function () {
        var props  = Config.Enums.Properties,
            common = Config.PointTemplates._common,
            points = Config.PointTemplates.Points,
            propName,
            pointName;

        list = [];

        for (propName in props) {
            if (propName === 'Point Refs')
                continue;

            var obj = {
                propName: propName,
                lcPropName: propName.toLowerCase(),
                points: [],
                lcPoints: []
            };

            if (!common.hasOwnProperty(propName)) {
                pointCount = 0;
                for (pointName in points) {
                    pt = points[pointName];
                    if (pt.hasOwnProperty(propName)) {
                        obj.points.push(pointName);
                        obj.lcPoints.push(pointName.toLowerCase());
                    } else if (pt.hasOwnProperty('Point Refs')) {
                        for (var i = 0, len = pt['Point Refs'].length; i < len; i++) {
                            if (pt['Point Refs'][i].PropertyName === propName) {
                                obj.points.push(pointName + ' @ index ' + i);
                                obj.lcPoints.push(pointName.toLowerCase() + ' @ index ' + i);
                                break;
                            }
                        }
                    }
                }
                list.push(obj);
            }
        }
    };

    self.filterList = function () {
        var filter = self.propertyFilter().toLowerCase(),
            filteredList = ko.utils.arrayFilter(list, function (item) {
                if (item.lcPropName.indexOf(filter) > -1) {
                    return true;
                }
                for (var i = 0, len = item.lcPoints.length; i < len; i++) {
                    if (item.lcPoints[i].indexOf(filter) > -1) {
                        return true;
                    }
                }
                return false;
        });
        self.propertyList(filteredList);
    };
    
    self.propertyFilter.subscribe(self.filterList);

    self.buildList();
    self.propertyList(list);
    self.csv = getCSV();
}

$(function () {
    var manager = new Manager();
    ko.applyBindings(manager);
});
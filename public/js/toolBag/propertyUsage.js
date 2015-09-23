function Manager() {
    var self = this,
        list = [];

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
                points: []
            };

            if (!common.hasOwnProperty(propName)) {
                pointCount = 0;
                for (pointName in points) {
                    pt = points[pointName];
                    if (pt.hasOwnProperty(propName)) {
                        obj.points.push(pointName);
                    } else if (pt.hasOwnProperty('Point Refs')) {
                        for (var i = 0, len = pt['Point Refs'].length; i < len; i++) {
                            if (pt['Point Refs'][i].PropertyName === propName) {
                                obj.points.push(pointName + ' @ index ' + i);
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
        var filteredList = ko.utils.arrayFilter(list, function (item) {
            return (item.lcPropName.indexOf(self.propertyFilter().toLowerCase()) > -1);
        });
        self.propertyList(filteredList);
    };
    
    self.propertyFilter.subscribe(self.filterList);

    self.buildList();
    self.propertyList(list);
}

$(function () {
    var manager = new Manager();
    ko.applyBindings(manager);
});
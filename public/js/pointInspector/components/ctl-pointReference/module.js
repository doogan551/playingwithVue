define(['knockout', 'bannerJS', 'text!./view.html'], function(ko, bannerJS, view) {
    var apiEndpoint;

    // this ko binding hander swiped from http://blog.craigsworks.com/knockout-bootstrap-3-buttons-and-the-enable-binding/
    // by jdr
    /**
    Enhanced `enable` binding that adds disabled attribute to .btn elements
    to support Bootstrap styling.

    NOTE: This also effects the `disable` binding handler, since it simply
          inverts the `enable` bindings logic internally.

    @static
    @class Enable
    @namespace Base.BindingHandlers
    **/
    var oldEnable = ko.bindingHandlers.enable,
        rIsBtn = /\bbtn\b/;

    ko.bindingHandlers.enable = {
        update: function(element, valueAccessor) {
            var result = oldEnable.update.apply(this, arguments),
                enabled = ko.unwrap(valueAccessor());
            // Toggle `disabled` class on all `btn` elements
            if (rIsBtn.test(element.className)) {
                if (enabled) {
                    element.className.replace(/\bdisabled\b/gi, '');
                } else {
                    element.className += ' disabled';
                }
            }
            return result;
        }
    };

    function ViewModel(params) {
        var self = this,
            endPoint;
        this.root = params.rootContext;
        this.columnClasses = (params.hasOwnProperty('columnClasses')) ? params.columnClasses : 'col-sm-12 col-md-6';
        this.showLabel = (params.hasOwnProperty('showLabel')) ? params.showLabel : true;
        this.doValidate = (params.hasOwnProperty('doValidate')) ? params.doValidate : true;
        this.allowRemove = (params.hasOwnProperty('allowRemove')) ? params.allowRemove : true;
        this.getPointTypeName = function(pointType) {
            if (typeof pointType == 'number') {
                return this.utility.config.Utility.pointTypes.getPointTypeNameFromEnum(pointType);
            }
            return pointType;
        };
        apiEndpoint = this.root.apiEndpoint;
        this.utility = this.root.utility;
        this.point = (params.hasOwnProperty('point')) ? params.point : this.root.point;
        this.oldPoint = (params.hasOwnProperty('oldPoint')) ? params.oldPoint : null;
        this.parentType = (params.hasOwnProperty('point')) ? this.point["Point Type"].Value() : this.point.data['Point Type'].Value();
        this.refType = params.refType;
        this.appIndex = (params.hasOwnProperty('appIndex')) ? params.appIndex : 0;
        this.refPoint = null;
        this.isInEditMode = this.root.isInEditMode;
        this.getPointRef = function() {
            var point;
            if (params.hasOwnProperty('point')) {
                point = self.utility.getPointRefProperty(self.refType, this.point);
            } else if (self.appIndex === 0) {
                point = self.utility.getPointRefProperty(self.refType);
            } else {
                point = self.utility.getPointRefPropertyByAppIndex(self.refType, self.appIndex);
            }
            self.arrayIndex = point.arrayIndex;
            self.data = point.data;
            return point.data;
        };
        this.reference = this.getPointRef();
        this.refPointType = this.getPointTypeName(parseInt(this.reference.PointType(), 10));
        this.url = ko.observable(undefined);
        this.target = ko.observable(undefined);
        if (!!this.refPointType) {
            endPoint = this.utility.config.Utility.pointTypes.getUIEndpoint(this.refPointType, this.data.Value());
            this.url(endPoint.review.url);
            this.target(endPoint.review.target);
        }
    }

    function getRefData(id) {
        return $.ajax({
            url: apiEndpoint + 'points/' + id,
            contentType: 'application/json',
            dataType: 'json',
            type: 'get'
        });
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.openWindow = function() {
        var self = this,
            proposedCoords = {
                width: 1250,
                height: 750,
                left: (typeof window.screenLeft == 'undefined' ? screen.left : window.screenLeft) + 20,
                top: (typeof window.screenTop == 'undefined' ? screen.top : window.screenTop) + 20
            };
        if (proposedCoords.width + proposedCoords.left + 40 > screen.availWidth) {
            proposedCoords.left -= 40;
        }
        if (proposedCoords.height + proposedCoords.top + 40 > screen.availHeight) {
            proposedCoords.top -= 40;
        }
        console.log(proposedCoords.width + proposedCoords.left, proposedCoords.height + proposedCoords.top);
        console.log(screen.availWidth, screen.availHeight);
        self.utility.workspace.openWindowPositioned(self.url(), self.data.PointName(), self.refPointType, self.target, self.data.Value(), {
            width: proposedCoords.width,
            height: proposedCoords.height,
            left: proposedCoords.left,
            top: proposedCoords.top
        });
    };
    ViewModel.prototype.editPointRef = function(vm, event) {
        var self = this,
            endPoint,
            point = self.getPointRef(),
            targetElement = $(event.target),
            getPath = function() {
                var devicePoint,
                    rmuPoint,
                    propertyName = point.PropertyName(),
                    parameters = {
                        pointType: self.parentType,
                        pointtypes: self.utility.config.Utility.pointTypes.getAllowedPointTypes(self.parentType),
                        deviceId: null,
                        removeUnitId: null
                    },
                    path = '/pointlookup/' + encodeURI(self.parentType) + '/' + encodeURI(point.PropertyName()),
                    props = ['Control Point', 'Occupied Point', 'Remote Unit Point', 'Damper Control Point', 'Digital Heat 1 Control Point', 'Digital Heat 2 Control Point', 'Digital Heat 3 Control Point', 'Fan Control Point', 'Heat 1 Control Point', 'Lights Control Point'];
                
                // If Control Point or RMU property, we need to restrict our selection to points on the same device
                if (props.indexOf(propertyName) > -1) {
                    rmuPoint = self.utility.getPointRefProperty('Remote Unit Point');
                    devicePoint = self.utility.getPointRefProperty('Device Point');

                    // If Device Point prop exists and the device point is assigned
                    if (devicePoint && devicePoint.data.Value() !== 0) {
                        parameters.deviceId = devicePoint.data.Value();
                        path += '/' + devicePoint.data.Value();
                        // If Remote Unit Point prop exists and the remote unit point is assigned
                        if (propertyName !== "Remote Unit Point" && rmuPoint && rmuPoint.data.Value() !== 0) {
                            parameters.removeUnitId = rmuPoint.data.Value();
                            path += '/' + rmuPoint.data.Value();
                        }
                    }
                }
                return path;
            },
            pointSelectorEndPoint = [getPath(), '?mode=select'].join(''),
            callback = function(id, name, pointType) {
                // Schedule entry point ref changes don't go through normal validation in configjs
                // this is the first point that the returned id can be checked for a recursive loop.
                if (self.point['Point Type'].Value() === 'Schedule Entry' && id === self.point._parentUpi()) {
                    bannerJS.showBanner({
                        msg: 'Unable to control Schedule from same schedule.',
                        dismissText: 'Dismiss',
                        color: '#D50000',
                    });
                    return false;
                } else if (!!id) {
                    getRefData(id).done(
                        function(data) {
                            endPoint = self.utility.config.Utility.pointTypes.getUIEndpoint(pointType, id);
                            self.refPoint = data;
                            point.PointName(name);
                            point.Value(id);
                            self.refPointType = pointType;
                            self.url(endPoint.review.url);
                            self.target(endPoint.review.target);

                            if (self.doValidate) {
                                $(document).triggerHandler({
                                    type: 'viewmodelChange',
                                    targetElement: targetElement.closest('.table'),
                                    //since this is part of the pointRefs array, and we can have multiple
                                    //entries with the same property name, we send the array index instead
                                    property: self.arrayIndex,
                                    refPoint: self.refPoint
                                });
                            }

                        }
                    );
                }
            },
            workspaceManager = self.utility.workspace,
            win = workspaceManager.openWindowPositioned(pointSelectorEndPoint, 'Point Selector', 'pointSelector', '', 'pointSelector' + self.parentType, {
                width: 1250,
                height: 750,
                callback: function() {
                    win.pointLookup.init(callback);
                }
            });
    };
    ViewModel.prototype.removePointRef = function() {
        var self = this,
            point = self.getPointRef(),
            targetElement = $(event.target);
        point.PointName('');
        point.Value(0);
        self.url = ko.observable(undefined);
        self.target = ko.observable(undefined);
        if (self.doValidate) {
            $(document).triggerHandler({
                type: 'viewmodelChange',
                targetElement: targetElement.closest('.table'),
                //since this is part of the pointRefs array, and we can have multiple
                //entries with the same property name, we send the array index instead
                property: self.arrayIndex,
                refPoint: self.refPoint
            });
        }
    };
    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {

    };

    // Return component definition
    return {
        viewModel: ViewModel,
        template: view
    };
});
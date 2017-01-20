define(['knockout', 'text!./view.html', 'jquery-ui'], function(ko, view) {
    var apiEndpoint,
        filter = {
            name1: "",
            name2: "",
            name3: "",
            name4: "",
            pointTypes: ["Display"],
            disableNewPoint: true
        };

    ko.bindingHandlers.dataSrc = {
        update: function(element, valueAccessor) {
            var upi         = valueAccessor()(),
                $element    = $(element),
                $bg         = $element.parent(),
                $icon       = $bg.find('.thumbIcon');

            $.ajax({
                url     : '/img/thumbs/' + upi + '.txt',
                dataType: 'text',
                type    : 'get'
            })
                .done(
                function(file) {
                    var data    = file.split('||'),
                        bgColor = data[0],
                        image   = data[1];
                    $element.attr('src', image);
                    if (bgColor != 'undefined') $bg.css('background-color', bgColor);
                }
            )
                .fail(
                function() {
                    $element.addClass('noPreview');
                }
            );
        }
    };

    function ViewModel(params) {
        var self = this,
            $items = $('.items');
        this.root = params;
        this.point = params.point;
        this.data = params.point.data;
        this.utility = params.utility;
        this.apiEndpoint = apiEndpoint = params.apiEndpoint;
        this.isInEditMode = params.isInEditMode;

        $items.sortable({
            start: function (event, ui) {
            },
            stop: function (event, ui) {
            },
            update: function (event, ui) {
                var $item = ui.item,
                    pointRefs = self.data['Point Refs'];
                //retrieve our actual data item
                var item = ko.dataFor($item[0]);
                //figure out its new position
                var position = ko.utils.arrayIndexOf($item.parent().children(), $item[0]);
                //remove the item and add it back in the right spot
                if (position >= 0) {
                    pointRefs.remove(item);
                    pointRefs.splice(position, 0, item);
                }
                reorderDataSets();
            },
            helper: function(event, ui) {
                ui.children().each(function() {
                    $(this).width($(this).width());
                });
                return ui;
            },
            axis: 'y',
            handle: '.grabHandle',
            containment: '.table-responsive'
        });

        function reorderDataSets() {
            var pointModel = ko.viewmodel.toModel(self.data),
                pointRefsModel = pointModel['Point Refs'],
                point = self.data,
                slide,
                displayId;
            for (var i = 0; i < pointRefsModel.length; i++) {
                // pointRefsModel[i].AppIndex = i + 1;
                // displayId = pointRefsModel[i].Value;
                // slide = self.getSlideById(displayId);
                slide = self.getSlideByPointRefIndex(pointRefsModel[i].AppIndex);
                if (slide) {
                    slide.order(i);
                    slide.pointRefIndex = pointRefsModel[i].AppIndex;
                }
            }
            ko.viewmodel.updateFromModel(point, pointModel);
        }

        //define any tab triggers here
        //these are simple booleans for now
        this.tabTriggers = {
            involvement: ko.observable(false),
            notifications: ko.observable(false),
            permissions: ko.observable(false)
        };
        params.tabTriggers = this.tabTriggers;

        params.initDOM();
    }

    function getRefData(id) {
        return $.ajax(
            {
                url        : apiEndpoint + 'points/' + id,
                contentType: 'application/json',
                dataType   : 'json',
                type       : 'get'
            }
        );
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.removeSlide = function(itemIndex, vm) {
        var pointRefs = vm.data['Point Refs'](),
            slides = vm.data.Slides(),
            pointRef = pointRefs[itemIndex],
            displayId = pointRefs[itemIndex].Value(),
            // slide = vm.getSlideById(displayId);
            slide = self.getSlideByPointRefIndex(pointRefs[itemIndex].AppIndex);
        vm.data.Slides.remove(slide);
        vm.data['Point Refs'].remove(pointRef);
    };

    ViewModel.prototype.openDisplay = function(data, event) {
        var workspace = ko.contextFor(event.target).$root.utility.workspace,
            displayId = data.Value(),
            endPoint = workspace.config.Utility.pointTypes.getUIEndpoint('Display', displayId);
        dtiUtility.openWindow(endPoint.review.url, data.PointName(), 'Display', '', displayId);
    };

    ViewModel.prototype.showPreview = function(data, event) {
        var preview = $(event.currentTarget).find('.displayPreview'),
            $thumbnail = preview.find('img');
        if ($thumbnail.is('.noPreview')) return;
        preview.show();
    };

    ViewModel.prototype.hidePreview = function(data, event) {
        var thumbnail = $('.displayPreview');
        thumbnail.hide();
    };

    ViewModel.prototype.getSlideById = function(id) {
        var self = this,
            slides = self.data.Slides();
        for (var j = 0; j < slides.length; j++) {
            if (slides[j].display() == id) {
                return slides[j];
            }
        }
        return null;
    };

    ViewModel.prototype.getSlideByPointRefIndex = function(idx) {
        var self = this,
            slides = self.data.Slides();
        for (var j = 0; j < slides.length; j++) {
            if (slides[j].pointRefIndex == idx) {
                return slides[j];
            }
        }
        return null;
    };

    ViewModel.prototype.addPointRef = function(vm, event) {
        var callback = function (pointInfo) {
                if (!!pointInfo) {
                    filter = $.extend(filter, pointInfo.filter);
                    getRefData(pointInfo._id).done(
                        function (data) {
                            var pointRefs = vm.data['Point Refs'](),
                                slides = vm.data.Slides(),
                                displayCount = pointRefs.length;
                            vm.data['Point Refs'].push({
                                AppIndex: ko.observable(displayCount + 1),
                                DevInst: ko.observable(0),
                                PointInst: ko.observable(data._id),
                                PointName: ko.observable(data.Name),
                                PointType: ko.observable(151),
                                PropertyEnum: ko.observable(278),
                                PropertyName: ko.observable("Slide Display"),
                                Value: ko.observable(data._id),
                                isDisplayable: ko.observable(true),
                                isReadOnly: ko.observable(false)
                            });
                            slides.push({
                                order: ko.observable(displayCount + 1),
                                pointRefIndex: (displayCount + 1),
                                display: ko.observable(data._id),
                                duration: ko.observable(10)
                            });
                            vm.data['Point Refs'].valueHasMutated();
                            vm.data.Slides.valueHasMutated();
                        }
                    );
                }
            };

        dtiUtility.showPointSelector(filter);
        dtiUtility.onPointSelect(callback);
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {

    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});

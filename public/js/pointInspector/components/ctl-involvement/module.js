/*jslint white: true */
define(['knockout', 'text!./view.html'], function(ko, view) {
    var apiEndpoint = '',
        ASC  = 1,
        DESC = -1,
        $searchInput,
        $clearSearchIcon;

    function ViewModel(params) {
        var self = this;
        this.id = params.id;
        apiEndpoint = params.rootContext.apiEndpoint;
        this.searchTerm  = ko.observable('');
        this.gettingData = ko.observable(true);
        this.networkError = ko.observable(false);
        this.pointRefs = [];
        this.dependencies = [];
        this.filteredPointRefs = ko.observableArray([]);
        this.filteredDependencies = ko.observableArray([]);
        this.sortProperty = 'Name';
        this.sortDirection = ASC;
        this.isTabLoaded = params.isTabLoaded.subscribe(function(val) {
            this.render();
        }, this);
        this.search = ko.computed(function() {
            var searchTerm = this.searchTerm().toLowerCase(),   // Our only dependency
                filter = function (sourceArray) {
                    return ko.utils.arrayFilter(sourceArray, function (item) {
                        if (item.Name.toLowerCase().indexOf(searchTerm) !== -1)
                            return true;
                        if (item.Property.toLowerCase().indexOf(searchTerm) !== -1)
                            return true;
                        if (item['Point Type'].toLowerCase().indexOf(searchTerm) !== -1)
                            return true;
                        if (item['Device Name'].toLowerCase().indexOf(searchTerm) !== -1)
                            return true;
                        return false;
                    });
                };
            // Apply the filter, then sort the results, then finally stuff into our observable array
            this.filteredPointRefs(sortArray.call(filter(this.pointRefs), this.sortProperty, this.sortDirection));
            this.filteredDependencies(sortArray.call(filter(this.dependencies), this.sortProperty, this.sortDirection));

            // This computed fires before the DOM is initialized so we need to make sure our jQuery selector is defined
            if ($clearSearchIcon) {
                if (searchTerm.length) $clearSearchIcon.show();
                else $clearSearchIcon.hide();
            }
        }, this).extend({ rateLimit: 200 });
    }

    function getData(id) {
        return $.ajax(
            {
                url        : apiEndpoint + 'points/searchdependencies/' + id,
                contentType: 'application/json',
                dataType   : 'json',
                type       : 'get'
            }
        );
    }
    // This routine must be called using .call so that 'this' is the array we want to sort on
    function sortArray (prop, dir) {
        var opp = ~dir + 1; // Get opposite direction (-1 to 1 or 1 to -1)
        return this.sort(function (obj1, obj2) {
            return (obj1[prop] == obj2[prop]) ? 0 : (obj1[prop] < obj2[prop]) ? opp : dir;
        });
    }

    // Use prototype to declare any public methods
    ViewModel.prototype.render = function() {
        var self = this,
            defaultWidth,
            initDOM = function () {
                $searchInput = $('div.search input');       // This is a global var within this module)
                $clearSearchIcon = $('.clearSearchIcon');   // This is a global var within this module)
                defaultWidth = $searchInput.css('width');

                // Add click hander for search icon on input element
                $('div.search i.fa-search').click(function (e) {
                    $searchInput.css('width', 175);
                    $searchInput.focus();
                });
                // Add blur handler for the search input element
                $searchInput.blur(function (e) {
                    if ($searchInput.val() === '') {
                        $searchInput.css('width', defaultWidth);
                    }
                });
                // Add focus handler for the search input element
                $searchInput.focus(function (e) {
                    $searchInput.css('width', 175);
                });
            };
        
        this.gettingData(true);
        getData(this.id).done(function(data) {
            var pointRefs = data.Involvement['Point Refs'],
                dependencies = data.Involvement.Dependencies,
                cleanProperties = function (item) {
                    item['Device Name'] = item.Device ? item.Device.Name : '';
                    item['Point Type']  = item['Point Type'] ? item['Point Type'] : '';
                    item.Property       = item.extendedProperty ? item.extendedProperty : (item.Property ? item.Property : '');
                    item.Name           = item.Name ? item.Name : '';
                };
            pointRefs.forEach(cleanProperties);
            dependencies.forEach(cleanProperties);
            
            self.pointRefs = pointRefs;
            self.dependencies = dependencies;
            
            self.networkError(false);
            self.searchTerm.valueHasMutated(); // Force our computed to run & populate DOM
        }).fail(function (jqXHR, textStatus) {
            console.log('Ajax requst failed.', textStatus, jqXHR);
            self.networkError(true);
        }).always(function () {
            self.gettingData(false);
        });
        initDOM();
    };
    ViewModel.prototype.openPointReview = function(data, e) {
        var workspace = window.top.workspaceManager,
            endPoint, win, width, height, pointType,
            $e = $(e.currentTarget),
            col = $e.data('col');

        if(!!col){
            pointType = col;
            data = data.Device;
            width = 1250;
            height = 750;
        } else if(data['Point Type'] !== 'Schedule Entry' && data['Point Type'] !== 'Schedule'){
            pointType = data['Point Type'];
            width = 1250;
            height = 750;
        }else{
            pointType = 'Schedule';
            width = 1250;
            height = 750;
        }
        endPoint = workspace.config.Utility.pointTypes.getUIEndpoint(pointType, data._id);
        win = workspace.openWindowPositioned(endPoint.review.url, data.Name, pointType, '', data._id,
            {
                width: width,
                height: height
            }
        );
    };

    ViewModel.prototype.sortTable = function (property, viewModel, e) {
        var $e = $(e.currentTarget);

        if (this.sortProperty == property) {
            this.sortDirection = ~this.sortDirection + 1; // Change direction (-1 to 1 or 1 to -1)
        } else {
            this.sortProperty  = property;
            this.sortDirection = ASC;
        }
        sortArray.call(this.filteredDependencies, property, this.sortDirection);
        sortArray.call(this.filteredPointRefs,    property, this.sortDirection);

        $('table.involvement thead i.fa').removeClass('fa-chevron-down fa-chevron-up');
        $e.find('.fa').addClass(this.sortDirection == ASC ? 'fa-chevron-up' : 'fa-chevron-down');
    };
    ViewModel.prototype.clearSearch = function () {
        this.searchTerm('');
        $searchInput.focus();
    };

    //knockout calls this when component is removed from view
    //Put logic here to dispose of subscriptions/computeds
    //or cancel setTimeouts or any other possible memory leaking code
    ViewModel.prototype.dispose = function() {
        this.isTabLoaded.dispose();
    };

    // Return component definition
    return { viewModel: ViewModel, template: view };
});
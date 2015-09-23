(function (dorsett, ko) {
    dorsett = dorsett || {};
    dorsett.PagedObservableArray = function (options) {
        options = options || {};
        if ($.isArray(options))
            options = { data: options };
        var
        //the string to search for
            _searchString = ko.observable('' ).extend({throttle: 300}),

        //the complete data collection
            _allData = ko.observableArray(options.data || []),

        //data matching our search
            _searchData = ko.computed(function() {
                var searchData = [],
	                allData = _allData(),
                    searchString = $.trim(_searchString().toUpperCase());

                //sort the data
                options.sort && _allData.sort(options.sort());

                if ((searchString == "") || (searchString == "SEARCH")) {
                    return _allData();
                } else {
                    searchData = $.grep(_allData(), function (value, i) {
                        var i = 0,
                            ii = 0,
                            searchFields = options.searchFields || [],
                            searchFieldsLength = searchFields.length,
                            keywords = searchString.split(' '),
                            keywordsLength = keywords.length;
                        for (i; i < keywordsLength; i++) {
                            if (searchFieldsLength == 0) {
                                return _checkForMatch(value.toUpperCase(), keywords[i]);
                            } else {
                                for (ii;ii<searchFieldsLength;ii++) {
                                    if (!!value[searchFields[ii]]) {
                                        if (typeof value[searchFields[ii]] == 'object') {
                                            if (_checkForMatch(value[searchFields[ii]].Value.toUpperCase(), keywords[i])) return true;
                                        } else {
                                            if (_checkForMatch(value[searchFields[ii]].toUpperCase(), keywords[i])) return true;
                                        }
                                    }
                                }
                            }
                        }

//                        if (searchFieldsLength == 0) {
//                            return _checkForMatch(value.toUpperCase(), searchString);
//                        } else {
//                            for (ii;ii<searchFieldsLength;ii++) {
//                               if (!!value[searchFields[ii]]) {
//                                    if (typeof value[searchFields[ii]] == 'object') {
//                                        if (_checkForMatch(value[searchFields[ii]].Value.toUpperCase(), searchString)) return true;
//                                    } else {
//                                        if (_checkForMatch(value[searchFields[ii]].toUpperCase(), searchString)) return true;
//                                    }
//                               }
//                            }
//                        }
                    });
                    return searchData;
                }
            }),

        //check for a match against a field
            _checkForMatch = function(field, searchString) {
                switch (true) {
                    case null == field:
                        return false;
                        break;
                    case field.indexOf(searchString) > -1:
                        return true;
                    default:
                        return false;
                }
            },

        //the size of the pages to display
            _pageSize = ko.observable(options.pageSize || 20),

        //the index of the current page
            _pageIndex = ko.observable(0),

        //the current page data
            _page = ko.computed(function () {
                var pageSize = _pageSize(),
                    pageIndex = _pageIndex(),
                    startIndex = pageSize * pageIndex,
                    endIndex = pageSize * (pageIndex + 1);

                return _searchData().slice(startIndex, endIndex);
            }, this),

        //the number of pages
            _pageCount = ko.computed(function () {
                return Math.ceil(_searchData().length / _pageSize()) || 1;
            }),

        //record numbering
            _pageNumber = ko.computed(function() {
                return _pageIndex() + 1;
            }),
            _pageFirstRecordNumber = ko.computed(function() {
                return (_pageIndex() * _pageSize()) + 1;
            }),
            _pageLastRecordNumber = ko.computed(function() {
                return _pageFirstRecordNumber() + (_page().length - 1);
            }),

        //move to the next page
            _nextPage = function () {
                if (_pageIndex() < (_pageCount() - 1))
                    _pageIndex(_pageIndex() + 1);
            },

        //move to the previous page
            _previousPage = function () {
                if (_pageIndex() > 0)
                    _pageIndex(_pageIndex() - 1);
            },

        //Is this the first page?
            _isFirstPage = ko.computed(function() {
                return _pageNumber() == 1;
            }),
        //Is this the last page?
            _isLastPage = ko.computed(function() {
                return _pageNumber() == _pageCount();
            });

        //reset page index when page size changes
        _pageSize.subscribe(function () { _pageIndex(0); });
        _searchData.subscribe(function () { _pageIndex(0); });

        //public members
        this.allData = _allData;
        this.searchData = _searchData;
        this.searchString = _searchString;
        this.pageSize = _pageSize;
        this.pageIndex = _pageIndex;
        this.pageNumber = _pageNumber;
        this.page = _page;
        this.pageCount = _pageCount;
        this.nextPage = _nextPage;
        this.previousPage = _previousPage;
        this.pageFirstRecordNumber = _pageFirstRecordNumber;
        this.pageLastRecordNumber = _pageLastRecordNumber;
        this.isFirstPage = _isFirstPage;
        this.isLastPage = _isLastPage;
    };
})(dorsett, ko);

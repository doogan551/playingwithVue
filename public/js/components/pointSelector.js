let PointSelector = class PointSelector {
    constructor (config) {
        this.config = $.extend(true, {}, config);

        this.modes = {
            CREATE: 'create',
            FILTER: 'filter',
            DEFAULT: 'default'
        };

        this.initPointTypes();
        this.initBindings();

        this.initDOM();

        dti.on('showPointSelector', (cfg) => {
            this.show(cfg);
        });
    }

    defaultCallback (data, isMiddleClick) {
        dtiUtility.openWindow({
            upi: data._id,
            popout: isMiddleClick
        });
    }

    initPointTypes () {
        let pointTypes;
        let ret = [];
        dtiUtility.getConfig('Utility.pointTypes.getAllowedPointTypes', [], (data) => {
            pointTypes = data;
        });
        dti.forEachArray(pointTypes, (type) => {
            ret.push({
                name: type.key,
                enum: type.enum,
                selected: false,
                visible: false
            });
        });

        this.pointTypes = ret;
        this.pointTypeListClass = 'pointTypeList';
    }

    initBindings () {
        ko.bindingHandlers.fadeVisible = {
            init: function (element, valueAccessor) {
                // Initially set the element to be instantly visible/hidden depending on the value
                var value = valueAccessor();
                $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
            },
            update: function (element, valueAccessor) {
                // Whenever the value subsequently changes, slowly fade the element in or out
                var value = valueAccessor(),
                    $element = $(element);

                if (ko.unwrap(value)) {
                    dti.animations.fadeIn($element);
                } else {
                    dti.animations.fadeOut($element);
                }
            }
        };

        ko.bindingHandlers.delegate = {
            init: (element, valueAccessor, allBindings) => {
                var $element = $(element),
                    delegations = ko.utils.unwrapObservable(valueAccessor()),
                    makeHandler = (fn, scope = null) => {
                        return (e) => {
                            fn.call(scope, e);
                            e.preventDefault();
                        };
                    };

                dti.forEachArray(delegations, (cfg) => {
                    $element.on(cfg.event, cfg.selector, makeHandler(cfg.handler, cfg.scope));
                });

                ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                    dti.forEachArray(delegations, (cfg) => {
                        $element.off(cfg.event, cfg.selector, makeHandler(cfg.handler));
                    });
                });
            }
        };
        let self = this;
        let bindings = ko.viewmodel.fromModel({
            searchString: '',
            results: [],
            library: typeof Materialize !== 'undefined' ? 'materialize' : 'bootstrap',
            busy: false,
            focus: false,
            pointTypesShown: false,
            mode: this.modes.DEFAULT,
            pointTypes: this.pointTypes,
            remoteUnitId: null,
            deviceId: null
        });

        $.extend(self, bindings);

        this.togglePointTypeList = () => {
            this.pointTypesShown(!this.pointTypesShown());
        };

        this.handleRightClick = (obj, event) => {
            let pointType = ko.dataFor(obj.target);
            let type = pointType.name();
            let selected = pointType.selected();
            let numSelected = this.numberOfPointTypesSelected();

            if (!selected) {
                this.setPointTypes(type, null, true);
            } else if (numSelected === 1) { //only this one selected, select all
                this.setPointTypes(null);
            } else {
                this.setPointTypes(type, null, true);
            }
        };

        this.modalText = ko.pureComputed(function getModalText() {
            let mode = self.mode();
            let ret;

            switch (mode) {
                case self.modes.CREATE:
                    ret = 'Create Point';
                    break;
                case self.modes.FILTER:
                    ret = 'Choose Filter';
                    break;
                case self.modes.DEFAULT:
                    ret = 'Choose Point';
                    break;
            }

            return ret;
        });

        this.numberOfPointTypesSelected = ko.pureComputed(() => {
            let count = 0;

            dti.forEachArray(this.pointTypes(), (type) => {
                if (type.selected()) {
                    count++;
                }
            });

            return count;
        });

        this.flatPointTypeList = ko.pureComputed(() => {
            let ret = [];

            dti.forEachArray(this.pointTypes(), (type) => {
                if (type.selected() && type.visible()) {
                    ret.push(type.name());
                }
            });

            return ret;
        });

        this.pointTypeText = ko.pureComputed(() => {
            let numTypes = this.numberOfPointTypesSelected();
            let ret = numTypes + ' Point Type';

            if (numTypes !== 1) {
                ret += 's';
            }

            return ret;
        });

        dti.bodyClick(this.handleBodyClick.bind(this));

        this.searchInput = ko.pureComputed(this.searchString).extend({
            throttle: 400
        });

        this.searchInput.subscribe((val) => {
            this.search();
        }, this);

        // dti.bindings.pointSelector = this;

    }

    initDOM () {
        this.$modal = this.config.$element.find('.modal');

        if (this.isLegacy()) {
            this.$modal.modal({
                show: false
            });
            this.$modal.on('shown.bs.modal', this.onModalOpen.bind(this));
            this.$modal.on('hidden.bs.modal', this.onModalClose.bind(this));
        }
    }

    isLegacy () {
        return this.library() !== 'materialize';
    }

    getFlatPointTypes (list) {
        let ret = [];

        if (list && list.length > 0) {
            dti.forEachArray(list, (type) => {
                if (typeof type === 'object') {
                    ret.push(type.key);
                } else if (typeof type === 'string') {
                    ret.push(type);
                } else {
                    dti.log('incorrect point type');
                }
            });
        } else {
            let defaultPointTypeList = this.pointTypes();

            dti.forEachArray(defaultPointTypeList, (pointType) => {
                ret.push(pointType.name());
            });
        }

        return ret;
    }

    handleBodyClick (event, $target) {
        let cls = this.pointTypeListClass;
        let isInsidePointTypeList = function () {
            let el = $target[0];
            let matches = () => {
                return el.classList.contains(cls) || el.classList.contains('pointTypeDropdownButton');
            };

            if (!matches()) {
                while ((el = el.parentElement) && !matches()) {

                }
            }

            return el;
        };

        if (this.modalOpen) {
            if (this.pointTypesShown()) {
                if (!isInsidePointTypeList()) {
                    this.togglePointTypeList();
                    this.search();
                }
            }
        }
    }

    search (skipSearch = false) {
        //allows a one-time skip if true is passed in
        if (this._skipSearch) {
            this._skipSearch = false;
            return false;
        }

        this.busy(true);

        $.ajax({
            type: 'post',
            contentType: 'application/json',
            url: '/api/points/getFilteredPoints',
            data: JSON.stringify({
                terms: dtiCommon.buildSearchTerms(this.searchString().trim()),
                pointTypes: this.flatPointTypeList(),
                remoteUnitId: this.remoteUnitId(),
                deviceId: this.deviceId()
            })  
        }).done((results) => {
            this.handleSearchResults(results);
        });
    }

    normalizeSearchResults (results) {
        let getPointName = (path) => {
            let ret;
            dtiUtility.getConfig('Utility.getPointName', [path], (data) => {
                ret = data;
            });
            return ret;
        };

        dti.forEachArray(results, (result) => {
            result.path = getPointName(result.path);
        });
    }

    openRow (e, popout = false) {
        let target = e.target;
        let data = ko.dataFor(target);

        this.closeModal();

        dti.log('handleRowClick', data);

        // this.callback(data, popout);
        // this.callback = this.defaultCallback;
        if (this.callback) {
            this.callback(data, popout);
            this.callback = null;
        } else {
            dti.fire('pointSelected', data);
        }
    }

    handleRowMouseDown (e) {
        let isMiddleClick = e.which === 2;

        this.openRow(e, isMiddleClick);
    }

    handleRowClick (e) {
        let mode = this.mode();
        if (mode !== this.modes.FILTER) {
            this.openRow(e);
            // dti.log(arguments);
        }
    }

    handleAcceptFilterClick (e) {
        let target = e.target;
        let data = ko.dataFor(target);

        this.closeModal();

        this.callback({
            terms: data.searchString(),
            pointTypes: this.selectedPointTypes()
        });
        this.callback = this.defaultCallback;
    }

    handleSearchResults (results) {
        let ret = this.normalizeSearchResults(results);

        results.sort((a, b) => {
            return a.path > b.path ? 1 : -1;
        });

        this.results(results);
        this.busy(false);
    }

    //exposed methods
    handleChoosePoint (data) {
        dti.log(data);
        this.callback(data);
        dti.fire('pointSelected', data);
        this.callback = this.defaultCallback;
    }

    setPointTypes (config, save, stayShown) {
        let pointTypes = null;
        let showAll = true;
        //if not object, just point types
        if (config) {
            pointTypes = config.pointTypes || config;
            showAll = config.restrictPointTypes === false;
        }

        if (save) {
            this.showAll = showAll;
        } else {
            showAll = this.showAll;
        }

        if (pointTypes && !Array.isArray(pointTypes)) {
            pointTypes = [pointTypes];
        }

        dti.forEachArray(this.pointTypes(), (type) => {
            if (!pointTypes || pointTypes.indexOf(type.name()) !== -1) {
                type.visible(true);
                type.selected(true);
            } else {
                type.visible(showAll || stayShown);
                type.selected(false);
            }
        });
    }

    selectedPointTypes () {
        let answer = [];

        dti.forEachArray(this.pointTypes(), (type) => {
            if (type.selected()) {
                answer.push(type.name());
            }
        });

        return answer;
    }

    show (config) {
        config = config || {};
        let pointTypes = this.getFlatPointTypes([]);
        if (typeof config === 'object') {
            this.callback = config.callback; //guard shouldn't be necessary
            pointTypes = config.pointTypes = this.getFlatPointTypes(config.pointTypes || []);
            this.searchString(config.terms || '');
            this.mode(config.mode ? config.mode : this.modes.DEFAULT);
            this.deviceId(config.deviceId);
            this.remoteUnitId(config.remoteUnitId);

            this.setPointTypes(config, true);
        } else {
            this.callback = this.defaultCallback;
            this.searchString('');
            this.mode(this.modes.DEFAULT);

            if (config && typeof config === 'string') {
                pointTypes = [config];
            } else {
                pointTypes = null;
            }

            this.setPointTypes(pointTypes, true);
        }

        this.openModal();
    }

    onModalOpen () {
        // in case external apps want/need to tie into the modal visibility
        dti.fire('pointSelectorOpen');
        this.modalOpen = true;
        this.focus(true);
        this.search();
    }

    onModalClose () {
        // in case external apps want/need to tie into the modal visibility
        dti.fire('pointSelectorClose');
        this.modalOpen = false;
        this.focus(false);
        this.callback = this.defaultCallback;
    }

    openModal () {
        if (!this.isLegacy()) {
            this.$modal.openModal({
                ready: this.onModalOpen.bind(this),
                complete: this.onModalClose.bind(this)
            });
        } else {
            this.$modal.modal('show');
        }
    }

    closeModal () {
        if (!this.isLegacy()) {
            this.$modal.closeModal();
        } else {
            this.$modal.modal('hide');
        }
    }
};


ko.components.register('point-selector', {
    synchronous: true,
    viewModel: {
        createViewModel (params, componentInfo) {
            params.$element = $(componentInfo.element);
            let pointSelector = new PointSelector(params);

            return pointSelector;
        }
    },
    template: {
        element: 'comp-point-selector-template'
    }
});
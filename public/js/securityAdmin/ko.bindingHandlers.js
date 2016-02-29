$(function() {
    ko.bindingHandlers.setHeight = {
        update: function(element, valueAccessor, allBindingsAccessor){
            var value = valueAccessor(),
                allBindings = allBindingsAccessor(),
                height  = ko.utils.unwrapObservable(value),
                reduceBy = allBindings.reduceBy || 0;

            $(element).height(height - reduceBy);
        }
    };

    ko.bindingHandlers.drag = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var $dragElement = $(element),
                value = valueAccessor(),
                dragOptions = {
                    disabled: true,
                    revert: true,
                    helper: 'clone',
                    appendTo: '#DT_Security_main',
                    zIndex: 5000,
                    revertDuration: 200,
                    addClasses: false,
                    cursorAt: { top: 20, left: 20 },
                    start: function() {
                        dorsett.draggedItem = ko.utils.unwrapObservable(valueAccessor().value);
                    }
                };
            $dragElement.draggable(dragOptions).disableSelection();
        }
    };

    ko.bindingHandlers.drop = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var $dropElement = $(element),
                value = valueAccessor(),
                isDuplicate = false,
                dropOptions = {
                    accept: value.accept,
                    //activeClass: 'dropzone_active animated flash',
                   // hoverClass: 'dropzone_hover',
                    tolerance: 'touch',
                    activate: function(event, ui) {
                        var $this = $(this);
                        console.log(value.addTo(), dorsett.draggedItem);
                        isDuplicate = !!ko.utils.arrayFirst(value.addTo(), function(item) {
                            if (value.accept == '.user') {
                                return item.userid == dorsett.draggedItem._id;
                            } else {
                                return item.groupid == dorsett.draggedItem._id;
                            }
                        });
                        if (isDuplicate) {
                            $this.addClass('dropzone_deny');
                            ui.helper.find('*').addBack().css({'cursor':'not-allowed'});
                        } else {
                            $this.addClass('dropzone_active animated flash');
                            ui.helper.find('*').addBack().css({'cursor':'move'});
                        }
                    },
                    over: function(event, ui) {
                        var $this = $(this);
                        if (!isDuplicate) {
                            $this.addClass('dropzone_hover');
                        } else {
                            $this.find('div').addClass('animated shake');
                            setTimeout(function(){$this.find('div').removeClass('animated shake');}, 2000);
                        }
                    },
                    out: function(event, ui) {
                        var $this = $(this);
                        $this.removeClass('dropzone_hover');
                    },
                    deactivate: function(event, ui) {
                        var $this = $(this);
                        $this.removeClass('dropzone_active dropzone_hover dropzone_deny animated shake flash');
                    },
                    drop: function(event, ui) {
                        if (isDuplicate) return;
                        ui.helper.remove();
                        if (value.accept == '.user') {
                            value.addTo.push(new dorsett.models.groupUserModel({ userid: dorsett.draggedItem._id, FullName: dorsett.draggedItem['First Name'] + ' ' + dorsett.draggedItem['Last Name'], Photo: dorsett.draggedItem.Photo, 'Group Admin': false }));
                        } else {
                            value.addTo.push({ groupid: dorsett.draggedItem._id, 'User Group Name': dorsett.draggedItem['User Group Name'], 'Group Admin': false });
                        }
                        $dropElement.closest('ul').trigger('create').listview('refresh');
                    }
                };
            $dropElement.droppable(dropOptions);
        }
    };

    ko.bindingHandlers.loadImage = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var $imgElement = $(element),
                allBindings = allBindingsAccessor(),
                imageUrl = 'img/users/' + ko.utils.unwrapObservable(valueAccessor());
            // console.log(imageUrl);
            $("<img/>")
                .load(function() { /*console.log('binding',imageUrl);*/$imgElement.css({backgroundImage: 'url(' + imageUrl + ')'}); })
                .error(function() { /*console.log('binding',!!allBindings.errorImage);*/if (!!allBindings.errorImage) $imgElement.css({backgroundImage: 'url(' + allBindings.errorImage + ')'}); })
                .attr('src', imageUrl)
            ;
        }
    };

    ko.bindingHandlers.JMValidationError = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var canProcess = !valueAccessor().isValid() && valueAccessor().isModified();
            if (canProcess) {
                $(element).parent().addClass('input-validation-error');
            } else {
                $(element).parent().removeClass('input-validation-error');
            }
        }
    };

    ko.bindingHandlers.JMEnable = {
        update: function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                $element = $(element),
                method = 'function (){}';
            ko.bindingHandlers.enable.update(element, valueAccessor);
            if ($('#DT_Security_panelWindow').length == 0) return;
            if (element.nodeName == 'INPUT') {
                if (element.type == 'text') {
                    method = 'textinput';
                }
                if (element.type == 'checkbox' || element.type == 'radio') {
                    method = 'checkboxradio';
                }
                if (element.type == 'button') {
                    method = 'button';
                }
            }
            if (element.nodeName == 'TEXTAREA') {
                method = 'textinput';
            }
            if (element.nodeName == 'SELECT') {
                method = 'selectmenu';
            }
            if (element.nodeName == 'BUTTON') {
                method = 'button';
            }
            $(element)[method](value ? "enable" : "disable");
        }
    };
    ko.bindingHandlers.JMChecked = {
        init: function(element, valueAccessor) {

            // set the dom element to a checkbox and initialize it (for jquerymobile)
            var checkbox = $(element);
            checkbox.checkboxradio();
            checkbox.attr('type', 'checkbox');

            // register change event to update the model on changes to the dom
            ko.utils.registerEventHandler(element, "change", function() {
                valueAccessor()(

                    // off because it is before the ui has refreshed
                    $(this).siblings('label.ui-checkbox-off').length > 0
                );
            });
        },
        update: function(element, valueAccessor) {

            // update the checked binding, i.e., check or uncheck the checkbox
            ko.bindingHandlers.checked.update(element, valueAccessor)

            // and refresh the element (for jquerymobile)
            var checkbox = $(element);
            checkbox.checkboxradio('refresh')
        }
    };

// my radio buttons handler
    ko.bindingHandlers.JMRadio = {
        init: function(element, valueAccessor) {
            // Get the observable we are bound to
            var modelValue = valueAccessor();

            // register handler for changes
            $(element).click(function() {
                if(! $(this).hasClass("disabled")) {
                    // Set model to data value of element
                    modelValue(''+$(this).data("value"));
                }
            });
        },
        update: function(element, valueAccessor) {
            // First get the latest data that we're bound to
            var value = valueAccessor();

            // Next, whether or not the supplied model property is observable, get its current value
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            // update screen to reflect new model data
            if(valueUnwrapped === (''+$(element).data("value")) ) {
                $(element).find('.ui-icon').addClass('ui-icon-myCheckRadioOn').removeClass('ui-icon-myCheckRadioOff');
            }
            else {
                $(element).find('.ui-icon').addClass('ui-icon-myCheckRadioOff').removeClass('ui-icon-myCheckRadioOn');
            }
        }
    };

    ko.bindingHandlers.mask = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var maskType = valueAccessor() || '',
                mask = ko.utils.arrayFirst(dorsett.contactValidationMap, function(item) { console.log(item.type, maskType);return item.type == maskType});
            console.log('nope',maskType, mask.mask);
            if (!!!mask.mask) return;
            console.log('still here?');
            $(element).mask(mask.mask, {placeholder: ' ' });
        }
    };

    ko.virtualElements.allowedBindings.listviewBinding = true;
    ko.bindingHandlers.listviewBinding = {
        update: function (element, valueAccessor) {
            ko.utils.unwrapObservable(valueAccessor());  //grab dependency

            var listview = $(element).closest("[data-role='listview']");

            if (listview) {
                try {
                    $(listview).listview('refresh');
                } catch (e) {
                    // if the listview is not initialised, the above call with throw an exception
                    // there doe snot appear to be any way to easily test for this state, so
                    // we just swallow the exception here.
                }
            }
        }
    };

});

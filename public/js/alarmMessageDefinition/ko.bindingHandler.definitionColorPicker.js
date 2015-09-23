
    ko.bindingHandlers.definitionColorPicker = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            // set default value
            var value,$el,$opener,options,showing;
            value= ko.utils.unwrapObservable(valueAccessor());
            $el = $(element);
            $opener = $($el.attr('data-opener'));
            $el.jqxColorPicker({width:300,height:300});
            $el.val(value);
            $el.hide();
            //initialize datepicker with some optional options
            $opener.hoverIntent({
                over:function(){
                    $el.show();
                },
                out:function(){
                    $el.hide();
                },
                interval:300
            });
            //handle the field changing
            ko.utils.registerEventHandler(element, "colorchange", function (e) {            
                var observable,newVal;
                observable= valueAccessor();
                newVal=$(element).jqxColorPicker('getColor').hex;
                if (newVal.toLowerCase()!==observable().toLowerCase()) {
                    observable(newVal);
                }
            });    
            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).jqxColorPicker("destroy");
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
          var value,$el,$opener;
          value= ko.utils.unwrapObservable(valueAccessor());
          $el = $(element);
          $opener = $($el.attr('data-opener'));
          $(element).jqxColorPicker('setColor',value);
          $(element).change();
        }
    };

ko.bindingHandlers.fadeVisible={init:function(a,b){var c=b();$(a).toggle(ko.unwrap(c))},update:function(a,b){var c=b();ko.unwrap(c)?$(a).fadeIn(500):$(a).fadeOut(500)}};
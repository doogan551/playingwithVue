!function(){function a(a){var c=!1;return function(){if(c)throw new Error("Callback was already called.");c=!0,a.apply(b,arguments)}}var b,c,d={};b=this,null!=b&&(c=b.async),d.noConflict=function(){return b.async=c,d};var e=function(a,b){if(a.forEach)return a.forEach(b);for(var c=0;c<a.length;c+=1)b(a[c],c,a)},f=function(a,b){if(a.map)return a.map(b);var c=[];return e(a,function(a,d,e){c.push(b(a,d,e))}),c},g=function(a,b,c){return a.reduce?a.reduce(b,c):(e(a,function(a,d,e){c=b(c,a,d,e)}),c)},h=function(a){if(Object.keys)return Object.keys(a);var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c);return b};"undefined"!=typeof process&&process.nextTick?(d.nextTick=process.nextTick,"undefined"!=typeof setImmediate?d.setImmediate=function(a){setImmediate(a)}:d.setImmediate=d.nextTick):"function"==typeof setImmediate?(d.nextTick=function(a){setImmediate(a)},d.setImmediate=d.nextTick):(d.nextTick=function(a){setTimeout(a,0)},d.setImmediate=d.nextTick),d.each=function(b,c,d){if(d=d||function(){},!b.length)return d();var f=0;e(b,function(e){c(e,a(function(a){a?(d(a),d=function(){}):(f+=1,f>=b.length&&d(null))}))})},d.forEach=d.each,d.eachSeries=function(a,b,c){if(c=c||function(){},!a.length)return c();var d=0,e=function(){b(a[d],function(b){b?(c(b),c=function(){}):(d+=1,d>=a.length?c(null):e())})};e()},d.forEachSeries=d.eachSeries,d.eachLimit=function(a,b,c,d){var e=i(b);e.apply(null,[a,c,d])},d.forEachLimit=d.eachLimit;var i=function(a){return function(b,c,d){if(d=d||function(){},!b.length||a<=0)return d();var e=0,f=0,g=0;!function h(){if(e>=b.length)return d();for(;g<a&&f<b.length;)f+=1,g+=1,c(b[f-1],function(a){a?(d(a),d=function(){}):(e+=1,g-=1,e>=b.length?d():h())})}()}},j=function(a){return function(){var b=Array.prototype.slice.call(arguments);return a.apply(null,[d.each].concat(b))}},k=function(a,b){return function(){var c=Array.prototype.slice.call(arguments);return b.apply(null,[i(a)].concat(c))}},l=function(a){return function(){var b=Array.prototype.slice.call(arguments);return a.apply(null,[d.eachSeries].concat(b))}},m=function(a,b,c,d){var e=[];b=f(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b){c(a.value,function(c,d){e[a.index]=d,b(c)})},function(a){d(a,e)})};d.map=j(m),d.mapSeries=l(m),d.mapLimit=function(a,b,c,d){return n(b)(a,c,d)};var n=function(a){return k(a,m)};d.reduce=function(a,b,c,e){d.eachSeries(a,function(a,d){c(b,a,function(a,c){b=c,d(a)})},function(a){e(a,b)})},d.inject=d.reduce,d.foldl=d.reduce,d.reduceRight=function(a,b,c,e){var g=f(a,function(a){return a}).reverse();d.reduce(g,b,c,e)},d.foldr=d.reduceRight;var o=function(a,b,c,d){var e=[];b=f(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b){c(a.value,function(c){c&&e.push(a),b()})},function(a){d(f(e.sort(function(a,b){return a.index-b.index}),function(a){return a.value}))})};d.filter=j(o),d.filterSeries=l(o),d.select=d.filter,d.selectSeries=d.filterSeries;var p=function(a,b,c,d){var e=[];b=f(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b){c(a.value,function(c){c||e.push(a),b()})},function(a){d(f(e.sort(function(a,b){return a.index-b.index}),function(a){return a.value}))})};d.reject=j(p),d.rejectSeries=l(p);var q=function(a,b,c,d){a(b,function(a,b){c(a,function(c){c?(d(a),d=function(){}):b()})},function(a){d()})};d.detect=j(q),d.detectSeries=l(q),d.some=function(a,b,c){d.each(a,function(a,d){b(a,function(a){a&&(c(!0),c=function(){}),d()})},function(a){c(!1)})},d.any=d.some,d.every=function(a,b,c){d.each(a,function(a,d){b(a,function(a){a||(c(!1),c=function(){}),d()})},function(a){c(!0)})},d.all=d.every,d.sortBy=function(a,b,c){d.map(a,function(a,c){b(a,function(b,d){b?c(b):c(null,{value:a,criteria:d})})},function(a,b){if(a)return c(a);var d=function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0};c(null,f(b.sort(d),function(a){return a.value}))})},d.auto=function(a,b){b=b||function(){};var c=h(a);if(!c.length)return b(null);var f={},i=[],j=function(a){i.unshift(a)},k=function(a){for(var b=0;b<i.length;b+=1)if(i[b]===a)return void i.splice(b,1)},l=function(){e(i.slice(0),function(a){a()})};j(function(){h(f).length===c.length&&(b(null,f),b=function(){})}),e(c,function(c){var i=a[c]instanceof Function?[a[c]]:a[c],m=function(a){var g=Array.prototype.slice.call(arguments,1);if(g.length<=1&&(g=g[0]),a){var i={};e(h(f),function(a){i[a]=f[a]}),i[c]=g,b(a,i),b=function(){}}else f[c]=g,d.setImmediate(l)},n=i.slice(0,Math.abs(i.length-1))||[],o=function(){return g(n,function(a,b){return a&&f.hasOwnProperty(b)},!0)&&!f.hasOwnProperty(c)};if(o())i[i.length-1](m,f);else{var p=function(){o()&&(k(p),i[i.length-1](m,f))};j(p)}})},d.waterfall=function(a,b){if(b=b||function(){},a.constructor!==Array){var c=new Error("First argument to waterfall must be an array of functions");return b(c)}if(!a.length)return b();var e=function(a){return function(c){if(c)b.apply(null,arguments),b=function(){};else{var f=Array.prototype.slice.call(arguments,1),g=a.next();g?f.push(e(g)):f.push(b),d.setImmediate(function(){a.apply(null,f)})}}};e(d.iterator(a))()};var r=function(a,b,c){if(c=c||function(){},b.constructor===Array)a.map(b,function(a,b){a&&a(function(a){var c=Array.prototype.slice.call(arguments,1);c.length<=1&&(c=c[0]),b.call(null,a,c)})},c);else{var d={};a.each(h(b),function(a,c){b[a](function(b){var e=Array.prototype.slice.call(arguments,1);e.length<=1&&(e=e[0]),d[a]=e,c(b)})},function(a){c(a,d)})}};d.parallel=function(a,b){r({map:d.map,each:d.each},a,b)},d.parallelLimit=function(a,b,c){r({map:n(b),each:i(b)},a,c)},d.series=function(a,b){if(b=b||function(){},a.constructor===Array)d.mapSeries(a,function(a,b){a&&a(function(a){var c=Array.prototype.slice.call(arguments,1);c.length<=1&&(c=c[0]),b.call(null,a,c)})},b);else{var c={};d.eachSeries(h(a),function(b,d){a[b](function(a){var e=Array.prototype.slice.call(arguments,1);e.length<=1&&(e=e[0]),c[b]=e,d(a)})},function(a){b(a,c)})}},d.iterator=function(a){var b=function(c){var d=function(){return a.length&&a[c].apply(null,arguments),d.next()};return d.next=function(){return c<a.length-1?b(c+1):null},d};return b(0)},d.apply=function(a){var b=Array.prototype.slice.call(arguments,1);return function(){return a.apply(null,b.concat(Array.prototype.slice.call(arguments)))}};var s=function(a,b,c,d){var e=[];a(b,function(a,b){c(a,function(a,c){e=e.concat(c||[]),b(a)})},function(a){d(a,e)})};d.concat=j(s),d.concatSeries=l(s),d.whilst=function(a,b,c){a()?b(function(e){return e?c(e):void d.whilst(a,b,c)}):c()},d.doWhilst=function(a,b,c){a(function(e){return e?c(e):void(b()?d.doWhilst(a,b,c):c())})},d.until=function(a,b,c){a()?c():b(function(e){return e?c(e):void d.until(a,b,c)})},d.doUntil=function(a,b,c){a(function(e){return e?c(e):void(b()?c():d.doUntil(a,b,c))})},d.queue=function(b,c){function f(a,b,f,g){b.constructor!==Array&&(b=[b]),e(b,function(b){var e={data:b,callback:"function"==typeof g?g:null};f?a.tasks.unshift(e):a.tasks.push(e),a.saturated&&a.tasks.length===c&&a.saturated(),d.setImmediate(a.process)})}void 0===c&&(c=1);var g=0,h={tasks:[],concurrency:c,saturated:null,empty:null,drain:null,push:function(a,b){f(h,a,!1,b)},unshift:function(a,b){f(h,a,!0,b)},process:function(){if(g<h.concurrency&&h.tasks.length){var c=h.tasks.shift();h.empty&&0===h.tasks.length&&h.empty(),g+=1;var d=function(){g-=1,c.callback&&c.callback.apply(c,arguments),h.drain&&h.tasks.length+g===0&&h.drain(),h.process()},e=a(d);b(c.data,e)}},length:function(){return h.tasks.length},running:function(){return g}};return h},d.cargo=function(a,b){var c=!1,g=[],h={tasks:g,payload:b,saturated:null,empty:null,drain:null,push:function(a,c){a.constructor!==Array&&(a=[a]),e(a,function(a){g.push({data:a,callback:"function"==typeof c?c:null}),h.saturated&&g.length===b&&h.saturated()}),d.setImmediate(h.process)},process:function i(){if(!c){if(0===g.length)return void(h.drain&&h.drain());var d="number"==typeof b?g.splice(0,b):g.splice(0),j=f(d,function(a){return a.data});h.empty&&h.empty(),c=!0,a(j,function(){c=!1;var a=arguments;e(d,function(b){b.callback&&b.callback.apply(null,a)}),i()})}},length:function(){return g.length},running:function(){return c}};return h};var t=function(a){return function(b){var c=Array.prototype.slice.call(arguments,1);b.apply(null,c.concat([function(b){var c=Array.prototype.slice.call(arguments,1);"undefined"!=typeof console&&(b?console.error&&console.error(b):console[a]&&e(c,function(b){console[a](b)}))}]))}};d.log=t("log"),d.dir=t("dir"),d.memoize=function(a,b){var c={},d={};b=b||function(a){return a};var e=function(){var e=Array.prototype.slice.call(arguments),f=e.pop(),g=b.apply(null,e);g in c?f.apply(null,c[g]):g in d?d[g].push(f):(d[g]=[f],a.apply(null,e.concat([function(){c[g]=arguments;var a=d[g];delete d[g];for(var b=0,e=a.length;b<e;b++)a[b].apply(null,arguments)}])))};return e.memo=c,e.unmemoized=a,e},d.unmemoize=function(a){return function(){return(a.unmemoized||a).apply(null,arguments)}},d.times=function(a,b,c){for(var e=[],f=0;f<a;f++)e.push(f);return d.map(e,b,c)},d.timesSeries=function(a,b,c){for(var e=[],f=0;f<a;f++)e.push(f);return d.mapSeries(e,b,c)},d.compose=function(){var a=Array.prototype.reverse.call(arguments);return function(){var b=this,c=Array.prototype.slice.call(arguments),e=c.pop();d.reduce(a,c,function(a,c,d){c.apply(b,a.concat([function(){var a=arguments[0],b=Array.prototype.slice.call(arguments,1);d(a,b)}]))},function(a,c){e.apply(b,[a].concat(c))})}};var u=function(a,b){var c=function(){var c=this,d=Array.prototype.slice.call(arguments),e=d.pop();return a(b,function(a,b){a.apply(c,d.concat([b]))},e)};if(arguments.length>2){var d=Array.prototype.slice.call(arguments,2);return c.apply(this,d)}return c};d.applyEach=j(u),d.applyEachSeries=l(u),d.forever=function(a,b){function c(d){if(d){if(b)return b(d);throw d}a(c)}c()},"undefined"!=typeof define&&define.amd?define([],function(){return d}):"undefined"!=typeof module&&module.exports?module.exports=d:b.async=d}();
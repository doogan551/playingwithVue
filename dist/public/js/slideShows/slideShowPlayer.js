window.workspaceManager=(window.opener||window.top).workspaceManager;var slideShowPlayer;slideShowPlayer=function(a){var b,c,d;return d=a("body"),_.mixin({queue:async.queue,forever:async.forever,func:function(a){return!!_.isFunction(a)&&a()},noop:function(a){return null===a&&(a=!1),this}}),_.mixin(_.str.exports()),b=function(){var b,c,d,e,f,g;return e=null,g=this,f={parser:{mapper:function(a){var b,c,d,e;return e={},b={"Close On Complete":"closeOnComplete",Slides:"slides","Maximize Displays":"maximizeDisplays","Repeat Count":"repeat","Continuous Show":"_repeat"},c=_.keys(b),d=function(c,d){var f;f=_.isUndefined(a[c].Value)?a[c]:a[c].Value,e[b[c]]=f},_.each(c,d),e._repeat&&(e.repeat=-1,e.closeOnComplete=!1),e},orderSlides:function(a){return a=_.sortBy(a,"order")},setRepeat:function(a,b){var c,d,e;return c=a["Continuous Show"].Value,d={"true":function(){b.repeat=-1},"false":function(){}},e=d[c](),b},parseDuration:function(a,b){var c;return c=parseInt(a.duration,10),(_.isNaN(c)||c<b)&&(c=b),c=1e3*c,a.duration=c,a}},stateChanger:function(b){var c;c=a("[data-states]"),c.each(function(c,d){var e=a(d).attr("data-states").toString().indexOf(b);e<=0?a(d).hide():a(d).show()})},getSlideShowId:function(){return window.location.hash.toString().replace("#","")},fullScreen:function(a,b){var c,d,e;c={"true":function(){var b,c;c=a.stats.isMax(),b={"true":function(){screenfull.request(document.body),a.stats.isMax(!0)},"false":function(){a.stats.isMax(!1),screenfull.exit()}},b[!c]()},"false":function(){}},d=a.slideShow().maximizeDisplays,(e=c[d])()},alterSlideContents:function(b){var c,d,f;return f=_.isObject(b)&&_.isObject(b.$container)?b.$container:e.currentSlide().$container,!!_.isObject(f)&&(f.length>0&&f[0].contentDocument?(c=f.contents(),c=c[0],_.isObject(c)&&(d=a(c),d.ready(function(){d.length>0&&(d.find(".topBar").hide(),e.stats.canSkip(!0))})),!1):(e.stats.canSkip(!0),!1))}},c={maximizeDisplays:function(){var a,b;a=e.slideShow(),b={"true":function(){window.moveTo(0,0),window.resizeTo(screen.width,screen.height-30)},"false":function(){}},b[a.maximizeDisplays]()},closeOnComplete:function(){var a,b,c,d;return b=e.slideShow(),a={"true":function(){window.close()},"false":function(){}},d=b.closeOnComplete,c=a[d],e.configuration.closeOnComplete=c,c},repeat:function(a){var b,d,f,g,h;return b=e.stats.ran,d=e.stats.run,h=function(){var d,g;return d={"true":function(){return a.push(e.slideShow().slides),!0},"false":function(){return e.state("complete"),c.closeOnComplete()(),!1}},f(),g=e.stats.left()>0,d[g](),b()},f=function(){var a=b();return a++,b(a),a},g=d()<1||b()<d(),h}},b={slideShow:{},url:"/api/points",state:ko.observable("playing"),states:["playing","paused","starting","complete"],minDuration:3,error:function(){var b;e.state("complete"),b=a("#errorSlide"),b.addClass("showing"),a("#controlButtons").hide()},close:function(){window.close()},current:{isContainer:function(a){var b=e.$currentContainer().is(a);return b},slide:function(){return e.currentSlide()},timeLeft:ko.computed({read:function(){var a,b;return b=0,_.isObject(e.currentSlide())?(a=e.currentSlide().duration/1e3,b=a-e.elapsed()):b},deferEvaluation:!0}),isSlide:function(a){return _.isEqual(e.currentSlide(),a)},isNext:function(a){return _.isEqual(e.nextSlide(),a)}},nextSlide:ko.observable({order:0,display:"123",duration:1e3,$container:a("#loading"),isFirst:!0,elapsed:ko.observable(0)}),currentSlide:ko.observable({order:-1,display:"123",duration:1e3,$container:a("#loading"),isFirst:!0,elapsed:ko.observable(0)}),stats:{ran:ko.observable(0),run:ko.observable(1),_left:function(){return _.filter(e.slideShow().slides,function(a){return a.order>e.currentSlide().order})},left:function(){return e.stats._left().length-e.stats.ran()},isInfinite:function(){var a;return a=e.stats.run()<1},isMax:ko.observable(!1),isPaused:function(){return 0===e.elapsable()},isLastSlide:function(){var a;return!_.isNull(e.currentSlide())&&(a=_.chain(e.slideShow().slides).last().isEqual(e.currentSlide()))},canSkip:ko.observable(!1),fullscreenEnabled:screenfull.enabled},configuration:{},elapsed:ko.observable(0),elapsable:ko.observable(1),navigation:{init:function(){var a,b,c;a=e.navigation,b=function(){a.showing(!0)},c=function(){a.showing(!1)},a.$container.hoverIntent({over:b,out:c})},showing:ko.observable(!1),$container:a("#controlButtons"),$menuHandle:a("#menuHandle"),$menu:a("#navigation")},progressBarViewModel:{init:function(){var a;return a=e.progressBarViewModel,a.progressBinder=a.ProgressBinder(),a.$progress.progressbar({maximum:100,warningMarker:100,dangerMarker:100}),a},ProgressBinder:_.once(function(){var a;return a=e.progressBarViewModel,ko.computed({read:function(){return e.elapsed()/(e.currentSlide().duration/1e3)*100+"%"},write:function(){}})}),$progress:a("#progressBar"),progressBinder:a.noop,showing:ko.observable(!1)},utils:f,pausePlay:function(a,b){var c,d;c={"true":function(){e.elapsable(0)},"false":function(){var a;a=e.currentSlide(),_.isNumber(a.seconds)||(a.seconds=window.setInterval(function(){viewModel.elapsed(viewModel.elapsed()+viewModel.elapsable()),viewModel.current.timeLeft()<=0&&(window.clearInterval(a.seconds),console.log(a.callback()))},1e3)),e.elapsable(1)}},(d=c[e.elapsable()>0])()},showNextSlide:function(a,b){var c;c=e.currentSlide(),e.stats.canSkip(!1),_.func(e.currentSlide().callback)},configure:function(){var a,b,d,f;return a=e.slideShow(),f=_.functions(c),d="",b=function(b,e){return d=c[b],d(a),e},_.each(f,b),ko.applyBindings(e),e.start(),e},load:function(){var b,c,d;return d={url:[e.url,"/",f.getSlideShowId()].join(""),type:"get",dataType:"json"},b=function(a){e.parse(a)},c=function(a,b,c){e.error()},a.ajax(d).done(b).fail(c),d},parse:function(a){var b,c;return c=f.parser.mapper(a),c=f.parser.setRepeat(a,c),e.stats.run(c.repeat),b=function(a,b){return c.slides[b]=f.parser.parseDuration(c.slides[b],e.minDuration),c.slides[b].display=["/displays/view/",a.display].join(""),c.slides[b]._display=ko.observable("about:blank"),c.slides[b].order+=1,b},_.each(c.slides,b),c.slides=f.parser.orderSlides(c.slides),e.slideShow=ko.observable(c),e.configure(),e},start:function(){var b,d,g;return e.currentSlide.subscribe(function(b){var c,d,g;return g=_.str.sprintf("#frame%s",b.order),d=b,c=_.chain(e.slideShow().slides).where({order:b.order+1}).first().value(),_.isObject(c)||(c=e.slideShow().slides[0]),e.nextSlide(c),b.$container=a(g),f.alterSlideContents(b),window.clearInterval(d.seconds),d.seconds=window.setInterval(function(){e.elapsed(e.elapsed()+e.elapsable()),e.current.timeLeft()<=0&&(window.clearInterval(d.seconds),console.log(d.callback()))},1e3),b.elapsed=e.elapsed,b}),d=function(a,b){var c,d,f;return f=a,c={playing:function(a){a.callback=function(){var a,c,d,f,d;a=function(){return"playing"===e.state()},d=function(){if(_.isUndefined(b.used)&&e.currentSlide().$container.is(":visible"))return b.used=!0,e.progressBarViewModel.showing(!1),window.clearInterval(e.currentSlide().seconds),b(),e},c={"true":d,"false":function(){var a,b;a=function(a){a&&(b.dispose(),d())},b=e.state.subscribe(a)}},f=c[a()],_.func(f)},e.currentSlide(a)},paused:function(){},starting:_.noop,complete:_.noop},e.elapsed(0),d=c.playing,d(f),f},g={"false":function(){var a;return a=_.queue(d,1),a.drain=c.repeat(a),a.push(e.slideShow().slides),e},"true":function(){var a;return e.stats.left(!1),a=function(a){var b;return b=_.queue(d,1),b.drain=function(){e.currentSlide(e.slideShow().slides[0]),a()},b.push(e.slideShow().slides),e},_.forever(a,function(a){return a}),b}},b=e.stats.isInfinite(),g[b](),e}},d=function(){var a;return e=_.extend(g,b),a=_.compose(e.load),a(),e},d(),e},c=new b}(jQuery);
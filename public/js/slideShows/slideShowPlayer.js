window.workspaceManager = (window.opener || window.top).workspaceManager;

var slideShowPlayer;

slideShowPlayer = (function($) {
    var Player,player,$player;
    $player = $('body');
    _.mixin({
      queue: async.queue,
      forever: async.forever,
      func:function(val){
            if (_.isFunction(val)) {
                return val();
            }else{
                return false;
            }
      },
      noop: function(log) {
        if (log === null) {
          log = false;
        }
        if (log === true) {
        }
        return this;
      }
    });
    _.mixin(_.str.exports());
    Player = function() {
      var base, configurants, init, result, util, _this;
      result = null;
      _this = this;
      util = {
        parser: {
          mapper : function(toParse){
            var map,mapKeys,eachMapKey,slideShowModel ;
            slideShowModel = {};
            map = {
              'Close On Complete':'closeOnComplete',
              'Slides':'slides',
              'Maximize Displays':'maximizeDisplays',
              'Repeat Count':'repeat',
              'Continuous Show':'_repeat'
            };
            mapKeys = _.keys(map);
            eachMapKey = function(k,i){
              var val;
              //better
              val = _.isUndefined(toParse[k]['Value']) ? toParse[k] : toParse[k].Value;
              slideShowModel[map[k]] = val;
            };
            _.each(mapKeys,eachMapKey);
            if (slideShowModel._repeat) {
                slideShowModel.repeat=-1;
                slideShowModel.closeOnComplete=false;
            }
            return slideShowModel;
          },
          orderSlides:function(slides){
            slides = _.sortBy(slides,'order');
            return slides;
          },
          setRepeat: function(toParse,model) {
            var isInfinite,ifInfinite,fn;
            isInfinite = toParse['Continuous Show'].Value;
            ifInfinite = {
              'true':function(){
                model.repeat = -1;
              },
              'false':function(){

              }
            };
            fn = ifInfinite[isInfinite]();
            return model;
          },
          parseDuration:function(slide,minDuration) {
            var duration;
            duration = parseInt(slide.duration,10);
            if (_.isNaN(duration) || duration < minDuration) {
              duration = minDuration;
            }
            duration= duration*1000;
            slide.duration = duration;
            return slide;
          }
        },
        stateChanger:function(newVal){
            var $toHide;
            $toHide= $('[data-states]');
            $toHide.each(function(i,v){
              var hasit = $(v).attr('data-states').toString().indexOf(newVal);
              if (hasit <=0 ) {
                $(v).hide();
              }else{
                $(v).show();
              }
            });
        },
        getSlideShowId:function(){
          return window.location.hash.toString().replace('#','');
        },
        fullScreen:function(mdl,$ev){
          var sizers,isMax,sizer ;
          sizers = {
            'true':function(){
              var enabled,isEnabled;
              isEnabled = mdl.stats.isMax();
              enabled = {
                'true':function() {
                  screenfull.request(document.body);
                  mdl.stats.isMax(true);
                },
                'false':function(){
                  mdl.stats.isMax(false);
                  screenfull.exit();
                }
              };
              enabled[!isEnabled]();
            },
            'false':function(){
            }
          };
          isMax = mdl.slideShow().maximizeDisplays;
          sizer = sizers[isMax];
          sizer();
        },
        alterSlideContents:function(slide) {
            var load,eachContainer,currSlide,$currSlide,$container;
            //because the slide isn't loaded, don't allow a skip
            if (_.isObject(slide) && _.isObject(slide.$container)) {
                $container = slide.$container;
            }else{
                $container = result.currentSlide().$container;
            }
            if (!_.isObject($container)) {
                return false;
            }
            if ($container.length>0 && $container[0].contentDocument) {
                currSlide= $container.contents();
                currSlide = currSlide[0];
                if (_.isObject(currSlide)) {
                    $currSlide = $(currSlide);
                    $currSlide.ready(function(){
                        if($currSlide.length>0){
                            $currSlide.find('.topBar').hide();
                            result.stats.canSkip(true);
                        }
                    });
                }
            return false;
            }
            result.stats.canSkip(true);
            return false;
        }
      };
      configurants = {
        maximizeDisplays: function() {
          var config, fn, ifMaximizeDisplays;
          config = result.slideShow();
          ifMaximizeDisplays = {
            'true':function(){
              window.moveTo(0,0);
              window.resizeTo(screen.width,screen.height-30);
            },
            'false':function(){}
          }
          ifMaximizeDisplays[config.maximizeDisplays]();
        },
        closeOnComplete: function() {
          var closeOpts, config, fn, isClose;
          config = result.slideShow();
          closeOpts = {
            'true': function() {
              window.close();
            },
            'false': function() {
            }
          };
          isClose = config.closeOnComplete;
          fn = closeOpts[isClose];
          result.configuration.closeOnComplete = fn;
          return fn;
        },
        repeat:function(queue){
          var ran,run,increment,isRunAgain,reset ;
          ran = result.stats.ran;
          run = result.stats.run;
          reset = function() {
            var runAgain, isRunAgain;
            runAgain = {
              'true':function() {
                queue.push(result.slideShow().slides);
                return true;
              },
              'false':function(){
                result.state('complete');
                configurants.closeOnComplete()();
                return false;
              }
            };
            increment();
            isRunAgain= (result.stats.left()>0);
            runAgain[isRunAgain]();
            return ran();
          };
          increment = function() {
            var newran = ran();
            newran++;
            ran(newran);
            return newran;
          };
          isRunAgain=run()<1 || (ran()<run());
          return reset;
      }
    };
      base = {
        slideShow: {},
        url:'/api/points',
        state: ko.observable('playing'),
        states: ['playing', 'paused', 'starting', 'complete'],
        minDuration:3,
        error:function(){
          var $error ;
          result.state('complete');
          $error = $('#errorSlide');
          $error.addClass('showing');
          $('#controlButtons').hide();
        },
        close:function() {
          window.close();
        },
        current:{
            isContainer:function($e) {
                var ret = result.$currentContainer().is($e);
                return ret;
            },
            slide:function() {
                return result.currentSlide();
            },
            timeLeft:ko.computed({
                read:function(){
                    var duration,ret;
                    ret=0;
                    if (!_.isObject(result.currentSlide())) {
                        //code
                        return ret;
                    }
                    duration=result.currentSlide().duration/1000;
                    ret = duration - result.elapsed();
                    return ret;
                },
                deferEvaluation:true
            })
            ,
            isSlide:function(slide) {
                return _.isEqual(result.currentSlide(),slide);
            },
            isNext:function(slide){
                return _.isEqual(result.nextSlide(),slide);
            }
        },
        //next slide will get updated by subscription to currentSlide change in the start() function
        nextSlide:ko.observable({order:0,display:'123',duration:1000,$container:$('#loading'),isFirst:true,elapsed:ko.observable(0)}),
        currentSlide: ko.observable({order:-1,display:'123',duration:1000,$container:$('#loading'),isFirst:true,elapsed:ko.observable(0)}),
        stats:{
            ran:ko.observable(0),
            run:ko.observable(1),
            _left:function() {
                return _.filter(result.slideShow().slides,function(v) {
                    return v.order > result.currentSlide().order;
                });
            },
            left:function(){
                return result.stats._left().length - result.stats.ran();
            },
            isInfinite:function(){
              var ret;
              ret=result.stats.run() <1;
              return ret;
            },
            isMax:ko.observable(false),
            isPaused:function(){
                return result.elapsable()===0;
            },
            isLastSlide:function(){
              var ret;
              if (_.isNull(result.currentSlide())) {
                return false;
              }
              ret = _.chain(result.slideShow().slides).last().isEqual(result.currentSlide());
              return ret;
            },
            canSkip:ko.observable(false),
            fullscreenEnabled:screenfull.enabled
        },
        configuration: {},
        elapsed:ko.observable(0),
        elapsable:ko.observable(1),
        navigation:{
            init:function() {
                var me,over,out;
                me= result.navigation;
                over = function() {
                    me.showing(true);
                };
                out = function() {
                    me.showing(false);
                };
                me.$container.hoverIntent({over:over,out:out});
            },
            showing:ko.observable(false),
            $container:$('#controlButtons'),
            $menuHandle:$('#menuHandle'),
            $menu:$('#navigation')
        },
        //abstract
        progressBarViewModel: {
            init:function(){
                var me;
                me = result.progressBarViewModel;
                me.progressBinder = me.ProgressBinder();
                me.$progress.progressbar({  maximum:100,warningMarker:100,dangerMarker:100 });
                return me;
            },
            ProgressBinder:_.once(function() {
                var me;
                me = result.progressBarViewModel;
                return ko.computed({
                    read:function(){
                        return (result.elapsed()/(result.currentSlide().duration/1000)*100) +'%';
                    },
                    write:function() {

                    }

                });
            }),
            $progress:$('#progressBar'),
            progressBinder:$.noop,
            showing:ko.observable(false)
            },
        utils:util,
        pausePlay:function(mdl,ev){
          var opts,fn ;
          opts = {
            'true':function() {
              //set the elapse to 0 so the slide duration wont decrement
              result.elapsable(0);
            },
            'false':function() {
                var slide;
                slide = result.currentSlide();
                if (!_.isNumber(slide.seconds) ) {
                    //code
                    slide.seconds = window.setInterval(function(){
                        viewModel.elapsed(viewModel.elapsed()+viewModel.elapsable());
                        if (viewModel.current.timeLeft()<=0) {
                            //code
                            window.clearInterval(slide.seconds);
                            //slide.seconds = null;
                            console.log(slide.callback());
                        }
                    },1000);
                }
                //set the elapse to 1 so the slide duration will decrement
                result.elapsable(1);
            }
          };
          fn = opts[result.elapsable()>0];
          fn();
        },
        showNextSlide:function(mdl,ev){
            var slide;
            slide = result.currentSlide();
            result.stats.canSkip(false);
            _.func(result.currentSlide().callback);

        },
        configure: function() {
          var config, eachFn, fn, fnNames;
          config = result.slideShow();
          fnNames = _.functions(configurants);
          fn = '';
          eachFn = function(v, i) {
            fn = configurants[v];
            fn(config);
            return i;
          };
          _.each(fnNames, eachFn);
          ko.applyBindings(result);
          result.start();
          return result;
        },
        load: function() {
          var done,fail,requestOps;
          requestOps = {
            url:[result.url,'/',util.getSlideShowId()].join(''),
            type:'get',
            dataType:'json'
          };
          done = function(data){
            result.parse(data);
          };
          fail = function(xhr,status,message) {
            result.error();
          };
          //done();
          $.ajax(requestOps).done(done).fail(fail);
          return requestOps;
        },
        parse: function(data) {
          var eachSlide,firstSlide,isFirstSlide,ifFirstSlide,parsedSlideShow;
          parsedSlideShow = util.parser.mapper(data);
          parsedSlideShow = util.parser.setRepeat(data,parsedSlideShow);
          result.stats.run(parsedSlideShow.repeat);
          eachSlide = function(v, i) {
            parsedSlideShow.slides[i] = util.parser.parseDuration(parsedSlideShow.slides[i],result.minDuration);
            parsedSlideShow.slides[i].display = ['/displays/view/', v.display].join('');
            parsedSlideShow.slides[i]._display = ko.observable('about:blank');
            parsedSlideShow.slides[i].order+=1;
            return i;
          };
          _.each(parsedSlideShow.slides, eachSlide);
          parsedSlideShow.slides = util.parser.orderSlides(parsedSlideShow.slides);
          result.slideShow = ko.observable(parsedSlideShow);
          result.configure();
          return result;
        },
        start: function() {
          var isInfinite, eachSlide, runInfinite;
            result.currentSlide.subscribe(function(val) {
                var next,$next,slide,container
                container= _.str.sprintf('#frame%s',val.order);
                slide=val;
                //set the element property for reference
                next=_.chain(result.slideShow().slides).where({order:val.order+1}).first().value();
                if (!_.isObject(next)) {
                    next = result.slideShow().slides[0];
                }
                result.nextSlide(next);
                val.$container = $(container);
                util.alterSlideContents(val);
                window.clearInterval(slide.seconds);
                    slide.seconds = window.setInterval(function(){
                        result.elapsed(result.elapsed()+result.elapsable());
                        if (result.current.timeLeft()<=0) {
                            //code
                            window.clearInterval(slide.seconds);
                            //slide.seconds = null;
                            console.log(slide.callback());
                        }
                    },1000);
                val.elapsed = result.elapsed;
                return val;
          });
          eachSlide = function(slide, callback) {
            var stateSlide,fn,nextSlide,task;
            task =slide;
            stateSlide = {
                'playing':function(task){
                    //result.currentSlide(task);
                    task.callback = function() {
                        var isPlaying, ifPlaying,wrappedCallback,fn,callCount,finishOldAndStartNew,subscription,wrappedCallback;
                        isPlaying = function() {
                            return result.state()==='playing';
                        };
                        wrappedCallback = function() {
                            if (_.isUndefined(callback.used) && result.currentSlide().$container.is(':visible')) {
                                callback.used = true;
                                //hide progress bar now slide is ending
                                result.progressBarViewModel.showing(false);
                                window.clearInterval(result.currentSlide().seconds);
                                callback();
                                return result;
                            }
                        };
                        ifPlaying={
                            'true':wrappedCallback,
                            'false':function(){
                                var onPlay,subscription;
                                onPlay = function(val) {
                                    if (val) {
                                        subscription.dispose();
                                        wrappedCallback();
                                    }
                                };
                                subscription = result.state.subscribe(onPlay);
                            }
                        };
                        fn=ifPlaying[isPlaying()];
                        _.func(fn);
                    };
                    //show the progress bar as slide begins
                    result.currentSlide(task);
                },
                'paused':function() {
                },
                'starting':_.noop,
                'complete':_.noop
            };
            result.elapsed(0);
            fn =stateSlide["playing"];
            fn(task);
            return task;
          };
          runInfinite = {
            'false': function() {
              var increment, q, ran, reset, run;
              q = _.queue(eachSlide, 1);
              q.drain = configurants.repeat(q);
              q.push(result.slideShow().slides);
              return result;
            },
            'true': function() {
              var todoForever;
              result.stats.left(false);
              todoForever = function(next) {
                var q;
                q = _.queue(eachSlide, 1);
                q.drain = function() {
                    result.currentSlide(result.slideShow().slides[0]);
                    next();
                };
                q.push(result.slideShow().slides);
                return result;
              };
              _.forever(todoForever, function(err) {
                return err;
              });
              return isInfinite;
            }
          };
          isInfinite = result.stats.isInfinite();
          runInfinite[isInfinite]();
          return result;
        }
      };
      init = function() {
        var todo;
        result = _.extend(_this, base);
        todo = _.compose(result.load);
        todo();
        return result;
      };
      init();
      return result;
    };
    player = new Player();
    return player;
  })(jQuery);

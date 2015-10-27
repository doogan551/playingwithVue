"use strict";
window.workspaceManager = (window.opener || window.top).workspaceManager;

var slideShowViewModel = function () {
    var self = this,
        playerTimer,
        remainingTimeTimer,
        $frame1,
        $frame2,
        $frame3,
        $settingsGear,
        $navbar,
        workspaceManager = window.workspaceManager,
        user = workspaceManager.user(),
        minDuration = 3,
        bufferWaitTime = 0,
        currentDuration,
        startTimerTimestamp,
        loadAsFullscreen,
        forceFrameReload = false,
        closeOnComplete,
        repeatCount,
        repeatCounter = 0,
        continuousShow,
        initFrame = function (frame, initClass) {
            frame.width("100%");
            frame.height("100%");
            frame.parent().addClass(initClass)
            frame.load(function () {
                //console.log("   " + frame.parent().attr('class') + " LOADED....");
                hideFooter(frame);
            });
        },
        hideFooter = function ($currentSlideFrame) {
            $currentSlideFrame.contents().find('.topBar').hide();
        },
        checkFullScreenMode = function () {
            var maxHeight = window.screen.height,
                maxWidth = window.screen.width,
                curHeight = window.innerHeight,
                curWidth = window.innerWidth;

            forceFrameReload = true;
            self.inFullScreenMode(maxWidth === curWidth && maxHeight === curHeight);
        },
        parseSlides = function (data) {
            var i,
                upi,
                currentSlide,
                endPoint,
                lenSlides = data.Slides.length;

            function compareOrder(a, b) {
                if (a.order < b.order)
                    return -1;
                if (a.order > b.order)
                    return 1;
                return 0;
            };

            function upiIsActive(upi) {
                var answer = false,
                    i,
                    pointRef,
                    lenPointRefs = data["Point Refs"].length;

                for (i = 0; i < lenPointRefs; i++) {
                    pointRef = data["Point Refs"][i];
                    if (pointRef.Value === upi) {
                        answer = true;
                        if (pointRef.PointInst === 0) {
                            answer = false;
                        }
                        break;
                    }
                }

                return answer;
            };

            loadAsFullscreen = data["Maximize Displays"].Value;
            closeOnComplete = data["Close On Complete"].Value;
            repeatCount = data["Repeat Count"].Value;
            continuousShow = data["Continuous Show"].Value;

            for (i = 0; i < lenSlides; i++) {
                currentSlide = data.Slides[i];
                if (currentSlide) {
                    upi = currentSlide.display;
                    if (upiIsActive(upi)) {
                        endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint("Display", upi);
                        currentSlide.displayURL = endPoint.review.url;
                        if (currentSlide.duration < minDuration) {
                            currentSlide.duration = minDuration;
                        }
                    } else {
                        data.Slides.splice(i, 1);  // Slide not in ["Point Refs"]
                        i--;
                    }
                }
            };

            self.numberOfSlides = data.Slides.length;
            self.listOfSlides.push.apply(self.listOfSlides, data.Slides);
            self.listOfSlides.sort(compareOrder);  // get list in order they need to play
            if (loadAsFullscreen) {
                self.setFullScreen();
            }
            self.play();
        },
        getSlideShowId = function () {
            return window.location.hash.toString().replace('#', '');
        },
        remainingTime = function () {
            return (currentDuration - ((new Date()).getTime() - startTimerTimestamp) / 1000).toFixed();
        },
        checkTimeRemaining = function () {
            clearTimeout(remainingTimeTimer);
            remainingTimeTimer = setInterval(function () {
                self.timeRemaining(remainingTime());
            }, 500);
        },
        nextSlideIndex = function () {
            return ((self.slideIndex + 1) < self.numberOfSlides) ? (self.slideIndex + 1) : 0;
        },
        previousSlideIndex = function () {
            return (self.slideIndex > 0) ? (self.slideIndex - 1) : (self.numberOfSlides - 1);
        },
        notMoving = function () {
            return (self.slideIndex === self.slideLastIndex);
        },
        movingForward = function () {
            return (((self.slideIndex > self.slideLastIndex) && !(self.slideIndex === (self.numberOfSlides - 1) && self.slideLastIndex === 0)) || (self.slideIndex === 0 && self.slideLastIndex === (self.numberOfSlides - 1)));
        },
        movingBackward = function () {
            return (((self.slideIndex < self.slideLastIndex) && !(self.slideIndex === 0 && self.slideLastIndex === (self.numberOfSlides - 1))) || (self.slideIndex === (self.numberOfSlides - 1) && self.slideLastIndex === 0));
        },
        getFrameASource = function (theFrame) {
            //console.log("............... self.slideIndex = " + self.slideIndex + "   self.slideLastIndex = " + self.slideLastIndex);

            if (notMoving()) {
                //console.log("hey, index did NOT move ...............", currentFrameSrc);
            } else if (movingForward()) {  // index is moving right
                //console.log("  -> -> -> MOVING FORWARD -> -> -> ");
                theFrame.parentElement.classList.add("nextframe")
                theFrame.setAttribute('src', self.nextSlide().displayURL);
            } else if (movingBackward()) { // index is moving left
                //console.log("  <- <- <- MOVING BACKWARD <- <- <- ");
                theFrame.parentElement.classList.add("previousframe")
                theFrame.setAttribute('src', self.previousSlide().displayURL);
            }
            bufferWaitTime = 1500;
        },
        setSlidesInFrames = function (padInitialTime) {
            var waitDuration = self.currentSlide().duration + padInitialTime;
            ;
            if ($frame1.attr('src') === undefined) { // initial loading of the iframes
                bufferWaitTime = 1500;
                $frame1.attr('src', self.previousSlide().displayURL);
                $frame2.attr('src', self.currentSlide().displayURL);
                $frame3.attr('src', self.nextSlide().displayURL);
            } else {
                bufferWaitTime = 0;
                $("iframe").each(function (index, frame) {
                    var frameSrc = frame.getAttribute('src');
                    //console.log("  - - - - -  iframe frameSrc = " + frameSrc + " from " + frame.parentElement.classList);
                    frame.parentElement.classList.remove("previousframe", "currentframe", "nextframe");
                    switch (frameSrc) {
                        case self.previousSlide().displayURL:
                            frame.parentElement.classList.add("previousframe")
                            if (forceFrameReload) {
                                frame.setAttribute('src', self.previousSlide().displayURL);   // saving resource, no need to load same 'src'
                            }
                            break;
                        case self.currentSlide().displayURL:
                            frame.parentElement.classList.add("currentframe")
                            if (forceFrameReload) {
                                frame.setAttribute('src', self.currentSlide().displayURL);   // saving resource, no need to load same 'src'
                            }
                            break;
                        case self.nextSlide().displayURL:
                            frame.parentElement.classList.add("nextframe")
                            if (forceFrameReload) {
                                frame.setAttribute('src', self.nextSlide().displayURL);   // saving resource, no need to load same 'src'
                            }
                            break;
                        default:
                            getFrameASource(frame);
                            break;
                    }
                });
            }
            forceFrameReload = false;
            startTimerTimestamp = (new Date()).getTime();  // clock starts running for remaining time on current slide
            self.timeRemaining(waitDuration);
            checkTimeRemaining();
            setTimeout(function () {
                self.canSkip(true);
            }, bufferWaitTime);  // give the buffers a chance to load

            return waitDuration;
        },
        cycleToNextSlide = function () {
            var waitDuration,
                padInitialTime = parseInt((self.currentSlide() === undefined) ? 3 : 0);  // give initial page load some padding
            self.previousSlide(self.listOfSlides()[previousSlideIndex()])
            self.currentSlide(self.listOfSlides()[self.slideIndex]);
            self.nextSlide(self.listOfSlides()[nextSlideIndex()]);
            waitDuration = setSlidesInFrames(padInitialTime);

            return waitDuration;
        };

    self.numberOfSlides = 0;
    self.slideIndex = 0;
    self.slideLastIndex = 0;
    self.pageTitle = ko.observable("SlideShow");
    self.inFullScreenMode = ko.observable(false);
    self.listOfSlides = ko.observableArray([]);
    self.previousSlide = ko.observable();
    self.currentSlide = ko.observable();
    self.nextSlide = ko.observable();
    self.isPaused = ko.observable(false);
    self.timeRemaining = ko.observable(0);
    self.canSkip = ko.observable(false);

    self.init = function () {
        self.getSlideShowData();
        self.setNonFullScreen();
        $(document.body).width("100%");
        $(document.body).height("100%");
        $(document.body.parentElement).height("100%");
        $navbar = $(".slideShowNavbar");
        $settingsGear = $(".diconfig");
        $frame1 = $(".frame1");
        initFrame($frame1, "previousframe");
        $frame2 = $(".frame2");
        initFrame($frame2, "currentframe");
        $frame3 = $(".frame3");
        initFrame($frame3, "nextframe");

        $settingsGear.dblclick(function () {
            $navbar.toggleClass("lockedopen");
        });
        $(window).on("resize", function () {
            checkFullScreenMode();
        });
    };
    self.getSlideShowData = function () {
        var slideShowUrl = '/api/points/' + getSlideShowId(),
            userObj,
            reqObj = {};

        reqObj.reqID = (new Date()).getTime();
        reqObj.user = {};
        userObj = reqObj.user;
        userObj['System Admin'] = user['System Admin'];
        userObj._id = user._id;
        userObj.groups = user.groups;

        $.ajax({
            url: slideShowUrl,
            type: 'get',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(reqObj),
            success: function (returnData) {
                return parseSlides(returnData);
            }
        });
    };
    self.moveCarouselForward = function () {
        if (self.canSkip()) {
            self.canSkip(false);
            self.slideLastIndex = self.slideIndex;
            self.slideIndex = nextSlideIndex();
            clearTimeout(playerTimer);
            self.play();
        }
    };
    self.moveCarouselBackward = function () {
        if (self.canSkip()) {
            self.canSkip(false);
            self.slideLastIndex = self.slideIndex;
            self.slideIndex = previousSlideIndex();
            clearTimeout(playerTimer);
            self.play();
        }
    };
    self.play = function () {
        //console.log("---------------------------- play() ----------------------------");
        if (self.numberOfSlides > 0) {
            if (!continuousShow && (repeatCounter >= repeatCount)) {
                if (closeOnComplete) {
                    self.close();
                } else {
                    self.pause();
                }
            } else {
                if (self.isPaused()) {
                    self.isPaused(false);
                    startTimerTimestamp = (new Date()).getTime();  // reset start time
                    checkTimeRemaining();
                } else {
                    currentDuration = cycleToNextSlide();
                }
                //console.log("waiting ", currentDuration);
                playerTimer = setTimeout(function () {
                    self.slideLastIndex = self.slideIndex;
                    self.slideIndex = nextSlideIndex();
                    if (self.slideIndex === 0 && !continuousShow) {  // carousel has looped all the way through
                        repeatCounter++;
                    }
                    self.play()
                }, (currentDuration * 1000));
            }
        }
    };
    self.pause = function () {
        currentDuration = self.timeRemaining();
        clearTimeout(playerTimer);
        clearTimeout(remainingTimeTimer);
        self.isPaused(true);
    };
    self.setFullScreen = function () {
        if (screenfull.enabled) {
            screenfull.request();
        }
    };
    self.setNonFullScreen = function () {
        var adjustToWidth = (screen.width * .9),
            adjustToHeight = (screen.height * .9);

        window.moveTo((screen.width * .05), (screen.height * .05));  // centering up window
        window.resizeTo(adjustToWidth, adjustToHeight); // set window to 90% screen res
        screenfull.exit();
    };
    self.close = function () {
        window.close();
    };
};

function applyBindings() {
    var slideShowVM;
    if (window.opener === undefined) {
        window.setTimeout(applyBindings, 2);
    } else {
        slideShowVM = new slideShowViewModel();
        slideShowVM.init();
        ko.applyBindings(slideShowVM);
    }
};

$(function () {
    applyBindings();
});
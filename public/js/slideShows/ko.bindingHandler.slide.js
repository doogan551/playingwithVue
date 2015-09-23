//sets up all requried properties to be current running slide
(function($) {
  ko.bindingHandlers.slide = {
    update: function(element, valueAccessor,allBindingsAccessor) {
        var $el,slideOpts,slide,viewModel,show,seconds;
        $el = $(element);
        //look for slide object in data-bind declaration
        slideOpts = allBindingsAccessor().slide || {};
        viewModel = slideOpts.viewModel;
        slide = slideOpts.slide;
        //if it ain't showing then we don't want to time it
        if(!$el.hasClass('showing')) {
            //get rid of interval in case its already running -- like it was skipped while paused
            //window.clearInterval(slide.seconds);
            return $el;
        }
        //set progress bar back to 0 state
        viewModel.progressBarViewModel.$progress.progressbar('reset').progressbar('setMaximum',(slide.duration/1000)).progressbar('setStep',1);
        slide.$container = $el;
        //define/redefine interval for updating progress
        //show = function() {
        //    console.log(slide.seconds);
        //    //window.clearInterval(slide.seconds);
        //};
        //if (!_.isNumber(slide.seconds) ) {
        //    //code
        //    slide.seconds = window.setInterval(function(){
        //        viewModel.elapsed(viewModel.elapsed()+viewModel.elapsable());
        //        if (viewModel.current.timeLeft()<=0) {
        //            //code
        //            window.clearInterval(slide.seconds);
        //            //slide.seconds = null;
        //            console.log(slide.callback());
        //        }
        //    },1000);
        //}
        //show();
        return $el;
      }
};
})(jQuery);
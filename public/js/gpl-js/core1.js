/** @license
 * Shifty <http://jeremyckahn.github.com/shifty/>
 * Author: Jeremy Kahn - jeremyckahn@gmail.com
 * License: MIT
 * Version: 0.6.1 (Mon, 16 Apr 2012 16:27:31 GMT)
 */

(function(){

// Should be outside the following closure since it will be used by all
// modules.  It won't generate any globals after building.
var Tweenable;

(function (global) {

  var now
      ,DEFAULT_EASING = 'linear'
      // Making an alias, because Tweenable.prototype.formula will get looked
      // a lot, and this is way faster than resolving the symbol.
      ,easing;

  if (typeof SHIFTY_DEBUG_NOW === 'function') {
    now = SHIFTY_DEBUG_NOW;
  } else {
    /**
     * Get the current UNIX epoch time as an integer.  Exposed publicly as
     * `Tweenable.util.now()`.  @return {Number} An integer representing the
     * current timestamp.
     */
    now = function () {
      return +new Date();
    };
  }

  /**
   * Handy shortcut for doing a for-in loop.  Takes care of all of the
   * `hasOwnProperty` wizardry for you.  This is also exposed publicly, you can
   * access it as `Tweenable.util.each()`.
   * @param {Object} obj The object to iterate through.
   * @param {Function} func The function to pass the object and "own" property
   *     to.  This handler function receives the `obj` back as the first
   *     parameter, and a property name as the second.
   */
  function each (obj, func) {
    var prop;

    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        func(obj, prop);
      }
    }
  }

  /**
   * Does a basic copy of one Object's properties to another.  This is not a
   * robust `extend` function, nor is it recusrsive.  It is only appropriate to
   * use on objects that have primitive properties (Numbers, Strings, Boolean,
   * etc.).  Exposed publicly as `Tweenable.util.simpleCopy()`
   * @param {Object} targetObject The object to copy into
   * @param {Object} srcObject The object to copy from @return {Object} A
   *     reference to the augmented `targetObj` Object
   */
  function simpleCopy (targetObj, srcObj) {
    each(srcObj, function (srcObj, prop) {
      targetObj[prop] = srcObj[prop];
    });

    return targetObj;
  }

  /**
   * Copies each property from `srcObj` onto `targetObj`, but only if the
   * property to copy to `targetObj` is `undefined`.
   */
  function weakCopy (targetObj, srcObj) {
    each(srcObj, function (srcObj, prop) {
      if (typeof targetObj[prop] === 'undefined') {
        targetObj[prop] = srcObj[prop];
      }
    });

    return targetObj;
  }

  /**
   * Calculates the interpolated tween values of an Object based on the current
   * time.
   * @param {Number} currentPosition The current position to evaluate the tween
   * against.
   * @param {Object} params A configuration Object containing the values that
   *      this function requires.  The required properties in this Object are:
   *   @property {Object} originalState The original properties the Object is
   *       tweening from.
   *   @property {Object} to The destination properties the Object is tweening
   *       to.
   *   @property {Number} duration The length of the tween in milliseconds.
   *   @property {Number} timestamp The UNIX epoch time at which the tween
   *       began.
   *   @property {Object} easing An Object of strings.  This Object's keys
   *       correspond to the keys in `to`.
   * @param {Object} state A configuration object containing current state data
   *     of the tween.  Required properties:
   *   @property {Object} current The Object containing the current `Number`
   *       values of the tween.
   */
  function tweenProps (currentPosition, params, state) {
    var prop,
      normalizedPosition;

    normalizedPosition = (currentPosition - params.timestamp) /
      params.duration;

    for (prop in state.current) {
      if (state.current.hasOwnProperty(prop)
          && params.to.hasOwnProperty(prop)) {
          state.current[prop] = tweenProp(params.originalState[prop],
              params.to[prop], easing[params.easing[prop]],
              normalizedPosition);
      }
    }

    return state.current;
  }

  /**
   * Tweens a single property.
   * @param {number} from The origination value of the tween.
   * @param {number} to The destination value of the tween.
   * @param {Function} easingFunc The easing formula to apply to the tween.
   * @param {number} position The normalized position (between 0.0 and 1.0) to
   *    calculate the midpoint of 'from' and 'to' against.
   * @return {number} The tweened value.
   */
  function tweenProp (from, to, easingFunc, position) {
    return from + (to - from) * easingFunc(position);
  }

  /**
   * Schedules an update.
   * @param {Function} handler The function to execute
   * @param {number} fps The fraction of a second in the update should occur.
   * @return {number} The id of the update.
   */
  function scheduleUpdate (handler, fps) {
    return setTimeout(handler, 1000 / fps);
  }

  /**
   * Calls all of the functions bound to a specified hook on a `Tweenable`
   * instance.
   * @param {String} hookName The name of the hook to invoke the handlers of.
   * @param {Object} hooks The object containing the hook Arrays.
   * @param {Object} applyTo The `Tweenable` instance to call the hooks upon.
   * @param {Array} args The arguments to pass to each function in the
   * specified hook.
   */
  function invokeHook (hookName, hooks, applyTo, args) {
    var i;

    for (i = 0; i < hooks[hookName].length; i++) {
      hooks[hookName][i].apply(applyTo, args);
    }
  }

  /**
   * Applies a Shifty filter to `Tweenable` instance.
   * @param {String} filterName The name of the filter to apply.
   * @param {Object} applyTo The `Tweenable` instance to call the filter upon.
   * @param {Array} args The arguments to pass to the function in the specified
   * filter.
   */
  function applyFilter (filterName, applyTo, args) {
    each(Tweenable.prototype.filter, function (filters, name) {
      if (filters[name][filterName]) {
        filters[name][filterName].apply(applyTo, args);
      }
    });
  }

  /**
   * Handles the update logic for one step of a tween.
   * @param {Object} params The configuration containing all of a tween's
   *     properties.  This requires all of the `params` @properties required
   *     for `tweenProps`, so see that.  It also requires:
   *   @property {Object} owner The `Tweenable` instance that the tween this
   *   function is acting upon belongs to.
   *   @property {Object} hook The Object containing all of the `hook`s that
   *       belong to `owner
   * @param {Object} state The configuration Object containing all of the state
   *     properties for a `Tweenable` instance.  It requires all of the
   *     @properties listed for the `state` parameter of  `tweenProps`, so see
   *     that.  It also requires:
   *   @property {Boolean} isTweening Whether or not this tween as actually
   *       running.
   *   @property {Number} loopId The property that the latest `setTimeout`
   *       invokation ID stored in.
   */
  function timeoutHandler (params, state) {
    var endTime = params.timestamp + params.duration
        ,currentTime = Math.min(now(), endTime)
        ,didEnded = currentTime >= endTime;

    if (state.isTweening) {
      if (!didEnded) {
        // The tween is still running, schedule an update
        state.loopId = scheduleUpdate(function () {
          timeoutHandler(params, state);
        }, params.owner.fps);
      }

      applyFilter('beforeTween', params.owner, [state.current,
          params.originalState, params.to]);
      tweenProps (currentTime, params, state);
      applyFilter('afterTween', params.owner, [state.current,
          params.originalState, params.to]);

      if (params.hook.step) {
        invokeHook('step', params.hook, params.owner, [state.current]);
      }

      if (params.step) {
        params.step.call(state.current, state.current);
      }

    }

    if (didEnded || !state.isTweening) {
      // The duration of the tween has expired
      params.owner.stop(true);
    }
  }

  // A hook used for unit testing.
  if (typeof SHIFTY_DEBUG_NOW === 'function') {
    global.timeoutHandler = timeoutHandler;
  }


  /**
   * Creates a fully-usable easing Object from either a string or another
   * easing Object.  If `easing` is an Object, then this function clones it and
   * fills in the missing properties with "linear".
   * @param {Object} fromTweenParams
   * @param {Object|string} easing
   */
  function composeEasingObject (fromTweenParams, easing) {
    var composedEasing;

    composedEasing = {};

    if (typeof easing === 'string') {
      each(fromTweenParams, function (obj, prop) {
        composedEasing[prop] = easing;
      });
    // else, it's an Object
    } else {
      each(fromTweenParams, function (obj, prop) {
        if (!composedEasing[prop]) {
          composedEasing[prop] = easing[prop] || DEFAULT_EASING;
        }
      });
    }

    return composedEasing;
  }

  /**
   * This is the `Tweenable` constructor.  Do this for fun tweeny goodness:
   * @codestart
   * var tweenableInst = new Tweenable({});
   * @codeend
   *
   * It accepts one parameter:
   *
   * @param {Object} options A configuration Object containing options for the
   *     `Tweenable` instance.  The following are valid:
   *   @property {Object} initialState The state at which the first tween
   *       should begin at.
   *   @property {Number} duration The default `duration` for each `tween` made
   *       by this instance.  Default is 500 milliseconds.
   *   @property {Number} fps The frame rate (frames per second) at which the
   *       instance will update.  Default is 30.
   *   @property {String} easing The name of the default easing formula
   *       (attached to `Tweenable.prototype.formula`) to use for each `tween`
   *       made for this instance.  Default is `linear`.
   * @return {Object} `Tweenable` instance for chaining.
   */
  Tweenable = function (options) {
    options = options || {};

    this._hook = {};

    this._tweenParams = {
      'owner': this
      ,'hook': this._hook
      ,'data': {} // holds arbitrary data
    };

    this._state = {};

    // The state that the tween begins at.
    this._state.current = options.initialState || {};

    // The framerate at which Shifty updates.  This is exposed publicly as
    // `tweenableInst.fps`.
    this.fps = options.fps || 30;

    // The default easing formula.  This is exposed publicly as
    // `tweenableInst.easing`.
    this.easing = options.easing || DEFAULT_EASING;

    // The default `duration`.  This is exposed publicly as
    // `tweenableInst.duration`.
    this.duration = options.duration || 500;

    return this;
  };

  /**
   * Start a tween.  This method can be called two ways.  The shorthand way:
   *
   *   tweenableInst.tween (from, to, [duration], [callback], [easing]);
   *
   * or the longhand way:
   *
   *   tweenableInst.tween ( {
   *     from:       Object,
   *     to:         Object,
   *     duration:   Number,
   *     callback:   Function,
   *     easing:     String|Object,
   *     step:       Function
   *   });
   *
   * Regardless of how you invoke this method, the only required parameters are
   * `from` and `to`.
   *
   * @param {Object} from The beginning state Object containing the properties
   *     to tween from.  NOTE:  The properties of this Object are modified over
   *     time (to reflect the values in `to`).
   * @param {Object} to The target state Object containing the properties to
   *     tween to.
   * @param {Number} duration The amount of time in milliseconds that the tween
   *     should run for.
   * @param {Function} start The function to be invoked as soon as the this
   *     tween starts.  Mostly useful when used with the `queue` extension.
   * @param {Function} callback The function to invoke as soon as this tween
   *     completes.  This function is given the tween's current state Object as
   *     the first parameter.
   * @param {String|Object} easing This can either be a string specifying the
   *     easing formula to be used on every property of the tween, or an Object
   *     with values that are strings that specify an easing formula for a
   *     specific property.  Any properties that do not have an easing formula
   *     specified will use "linear".
   * @param {Function} step A function to call for each step of the tween.  A
   *     "step" is defined as one update cycle (frame) of the tween.  Many
   *     update cycles occur to create the illusion of motion, so this function
   *     will likely be called quite a bit.
   */
  Tweenable.prototype.tween = function (from, to, duration, callback, easing) {

    var self
        ,params
        ,state;

    if (this._state.isTweening) {
      return;
    }

    self = this;
    params = this._tweenParams;
    state = this._state;
    this._state.loopId = 0;
    this._state.pausedAtTime = null;

    // Normalize some internal values depending on how `tweenableInst.tween`
    // was invoked
    if (to) {
      // Assume the shorthand syntax is being used.
      params.to = to || {};
      params.duration = duration || this.duration;
      params.callback = callback;
      params.easing = easing || this.easing;
      state.current = from || {};
    } else {
      // If the second argument is not present, assume the longhand syntax is
      // being used.
      params.step = from.step;
      params.callback = from.callback;
      params.to = from.to || from.target || {};
      params.duration = from.duration || this.duration;
      params.easing = from.easing || this.easing;
      state.current = from.from || {};
    }

    params.timestamp = now();

    // Ensure that there is always something to tween to.
    // Kinda dumb and wasteful, but makes this code way more flexible.
    weakCopy(state.current, params.to);
    weakCopy(params.to, state.current);

    params.easing = composeEasingObject(state.current, params.easing);
    applyFilter('tweenCreated', params.owner, [state.current,
        params.originalState, params.to]);
    params.originalState = simpleCopy({}, state.current);
    state.isTweening = true;
    this.resume();

    if (from.start) {
      from.start();
    }

    return this;
  };

  /**
   * Convenience method for tweening from the current position.  This method
   * functions identically to `tween()` (it's just a wrapper function), but
   * implicitly passes the `Tweenable` instance's current state (what you get
   * from `get()`) as the `from` parameter.  This supports both the longhand
   * and shorthand syntax that `tween()` does, just omitting the `from`
   * paramter in both cases.
   * @param {Object} target If the other parameters are omitted, this Object
   *     should contain the longhand parameters outlined in `tween()`.  If at
   *     least one other formal parameter is specified, then this Object should
   *     contain the target values to tween to.
   * @param {Number} duration Duration of the tween, in milliseconds.
   * @param {Function} callback The callback function to pass along to
   *     `tween()`.
   * @param {String|Object} easing The easing formula to use.
   */
  Tweenable.prototype.to = function to (target, duration, callback, easing) {
    if (arguments.length === 1) {
      if ('to' in target) {
        // Shorthand notation is being used
        target.from = this.get();
        this.tween(target);
      } else {
        this.tween(this.get(), target);
      }
    } else {
      // Longhand notation is being used
      this.tween(this.get(), target, duration, callback, easing);
    }

    return this;
  };

  /**
   * Returns a reference to the `Tweenable`'s current state (the `from` Object
   * that wat passed to `tweenableInst.tween()`).
   * @return {Object}
   */
  Tweenable.prototype.get = function () {
    return this._state.current;
  };

  /**
   * Force the `Tweenable` instance's current state.
   * @param {Object} state The state the instance shall have.
   */
  Tweenable.prototype.set = function  (state) {
    this._state.current = state || {};

    return this;
  };

  /**
   * Stops and cancels a tween.
   * @param {Boolean} gotoEnd If `false`, or omitted, the tween just stops at
   *     its current state, and the `callback` is not invoked.  If `true`, the
   *     tweened object's values are instantly set the the target "to" values,
   *     and the `callback` is invoked.
   * @return {Object} The `Tweenable` instance for chaining.
   */
  Tweenable.prototype.stop = function (gotoEnd) {
    clearTimeout(this._state.loopId);
    this._state.isTweening = false;

    if (gotoEnd) {
      simpleCopy(this._state.current, this._tweenParams.to);
      applyFilter('afterTweenEnd', this, [this._state.current,
          this._tweenParams.originalState, this._tweenParams.to]);
      if (this._tweenParams.callback) {
        this._tweenParams.callback.call(this._state.current,
            this._state.current);
      }
    }

    return this;
  };

  /**
   * Pauses a tween.  A `pause`d tween can be resumed with `resume()`.
   * @return {Object} The `Tween` instance for chaining.
   */
  Tweenable.prototype.pause = function () {
    clearTimeout(this._state.loopId);
    this._state.pausedAtTime = now();
    this._state.isPaused = true;
    return this;
  };

  /**
   * Resumes a paused tween.  A tween must be `pause`d before is can be
   * `resume`d.
   * @return {Object} The `Tweenable` instance for chaining.
   */
  Tweenable.prototype.resume = function () {
    var self;

    self = this;

    if (this._state.isPaused) {
      this._tweenParams.timestamp += now() - this._state.pausedAtTime;
    }

    timeoutHandler(self._tweenParams, self._state);

    return this;
  };

  /**
   * Add a hook to the `Tweenable` instance.  Hooks are functions that are
   * invoked at key points in a `Tweenable` instance's lifecycle.  A hook that
   * is related to the tweening process (like `step`), for example, will occur
   * for every tween that is performed by the `Tweenable` instance.  You just
   * have to set it once.  You can attach as many functions to any given hook
   * as you like.  The available hooks are as follows:
   *
   *   - `step`:  Runs on every frame that a tween runs for.  Hook handler
   *   function receives a tween's `currentState` for a parameter.
   *
   * @param {String} hookName The name of the hook to attach `hookFunc` to.
   * @param {Function} hookFunc The hook handler function.  This function will
   *     receive parameters based on what hook it is being attached to.
   */
  Tweenable.prototype.hookAdd = function (hookName, hookFunc) {
    if (!this._hook.hasOwnProperty(hookName)) {
      this._hook[hookName] = [];
    }

    this._hook[hookName].push(hookFunc);
  };

  /**
   * Unattach a function from a hook, or all functions.
   *
   * @param {String} hookName The hook to remove a function or functions from.
   * @param {String|undefined} hookFunc The function to matched against and
   *     remove from the hook handler list.  If omitted, all functions are
   *     removed for the hook specified by `hookName`.
   */
  Tweenable.prototype.hookRemove = function (hookName, hookFunc) {
    var i;

    if (!this._hook.hasOwnProperty(hookName)) {
      return;
    }

    if (!hookFunc) {
      this._hook[hookName] = [];
      return;
    }

    for (i = this._hook[hookName].length; i >= 0; i++) {
      if (this._hook[hookName][i] === hookFunc) {
        this._hook[hookName].splice(i, 1);
      }
    }
  };

  /**
   * Globally exposed static property to attach filters to.  Filters are used
   * for transforming the properties of a tween at various points in a
   * `Tweenable` instance's lifecycle.  Please consult the README for more info
   * on this.
   */
  Tweenable.prototype.filter = {};

  /**
   * Globally exposed static helper methods.  These methods are used internally
   * and could be helpful in a global context as well.
   */
  Tweenable.util = {
    'now': now
    ,'each': each
    ,'tweenProps': tweenProps
    ,'tweenProp': tweenProp
    ,'applyFilter': applyFilter
    ,'simpleCopy': simpleCopy
    ,'weakCopy': weakCopy
    ,'composeEasingObject': composeEasingObject
  };

  /**
   * This object contains all of the tweens available to Shifty.  It is
   * extendable - simply attach properties to the Tweenable.prototype.formula
   * Object following the same format at `linear`.
   */
  easing = Tweenable.prototype.formula = {
    linear: function (pos) {
      return pos;
    }
  };

  if (typeof exports === 'object') {
    // nodejs
    module.exports = Tweenable;
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () { return Tweenable; });
  } else if (typeof global.Tweenable === 'undefined') {
    // Browser: Make `Tweenable` globally accessible.
    global.Tweenable = Tweenable;
  }

} (this));

/**
Shifty Easing Formulas
Adapted for Shifty by Jeremy Kahn - jeremyckahn@gmail.com
  v0.1.0

================================
All equations are adapted from Thomas Fuchs' Scripty2: https://raw.github.com/madrobby/scripty2/master/src/effects/transitions/penner.js
Based on Easing Equations (c) 2003 Robert Penner, all rights reserved. (http://www.robertpenner.com/)
This work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html
================================

For instructions on how to use Shifty, please consult the README: https://github.com/jeremyckahn/shifty/blob/master/README.md

MIT Lincense.  This code free to use, modify, distribute and enjoy.

*/

(function () {

  Tweenable.util.simpleCopy(Tweenable.prototype.formula, {
    easeInQuad: function(pos){
       return Math.pow(pos, 2);
    },

    easeOutQuad: function(pos){
      return -(Math.pow((pos-1), 2) -1);
    },

    easeInOutQuad: function(pos){
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,2);
      return -0.5 * ((pos-=2)*pos - 2);
    },

    easeInCubic: function(pos){
      return Math.pow(pos, 3);
    },

    easeOutCubic: function(pos){
      return (Math.pow((pos-1), 3) +1);
    },

    easeInOutCubic: function(pos){
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,3);
      return 0.5 * (Math.pow((pos-2),3) + 2);
    },

    easeInQuart: function(pos){
      return Math.pow(pos, 4);
    },

    easeOutQuart: function(pos){
      return -(Math.pow((pos-1), 4) -1)
    },

    easeInOutQuart: function(pos){
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
      return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
    },

    easeInQuint: function(pos){
      return Math.pow(pos, 5);
    },

    easeOutQuint: function(pos){
      return (Math.pow((pos-1), 5) +1);
    },

    easeInOutQuint: function(pos){
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,5);
      return 0.5 * (Math.pow((pos-2),5) + 2);
    },

    easeInSine: function(pos){
      return -Math.cos(pos * (Math.PI/2)) + 1;
    },

    easeOutSine: function(pos){
      return Math.sin(pos * (Math.PI/2));
    },

    easeInOutSine: function(pos){
      return (-.5 * (Math.cos(Math.PI*pos) -1));
    },

    easeInExpo: function(pos){
      return (pos==0) ? 0 : Math.pow(2, 10 * (pos - 1));
    },

    easeOutExpo: function(pos){
      return (pos==1) ? 1 : -Math.pow(2, -10 * pos) + 1;
    },

    easeInOutExpo: function(pos){
      if(pos==0) return 0;
      if(pos==1) return 1;
      if((pos/=0.5) < 1) return 0.5 * Math.pow(2,10 * (pos-1));
      return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
    },

    easeInCirc: function(pos){
      return -(Math.sqrt(1 - (pos*pos)) - 1);
    },

    easeOutCirc: function(pos){
      return Math.sqrt(1 - Math.pow((pos-1), 2))
    },

    easeInOutCirc: function(pos){
      if((pos/=0.5) < 1) return -0.5 * (Math.sqrt(1 - pos*pos) - 1);
      return 0.5 * (Math.sqrt(1 - (pos-=2)*pos) + 1);
    },

    easeOutBounce: function(pos){
      if ((pos) < (1/2.75)) {
      return (7.5625*pos*pos);
      } else if (pos < (2/2.75)) {
      return (7.5625*(pos-=(1.5/2.75))*pos + .75);
      } else if (pos < (2.5/2.75)) {
      return (7.5625*(pos-=(2.25/2.75))*pos + .9375);
      } else {
      return (7.5625*(pos-=(2.625/2.75))*pos + .984375);
      }
    },

    easeInBack: function(pos){
      var s = 1.70158;
      return (pos)*pos*((s+1)*pos - s);
    },

    easeOutBack: function(pos){
      var s = 1.70158;
      return (pos=pos-1)*pos*((s+1)*pos + s) + 1;
    },

    easeInOutBack: function(pos){
      var s = 1.70158;
      if((pos/=0.5) < 1) return 0.5*(pos*pos*(((s*=(1.525))+1)*pos -s));
      return 0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos +s) +2);
    },

    elastic: function(pos) {
      return -1 * Math.pow(4,-8*pos) * Math.sin((pos*6-1)*(2*Math.PI)/2) + 1;
    },

    swingFromTo: function(pos) {
      var s = 1.70158;
      return ((pos/=0.5) < 1) ? 0.5*(pos*pos*(((s*=(1.525))+1)*pos - s)) :
      0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos + s) + 2);
    },

    swingFrom: function(pos) {
      var s = 1.70158;
      return pos*pos*((s+1)*pos - s);
    },

    swingTo: function(pos) {
      var s = 1.70158;
      return (pos-=1)*pos*((s+1)*pos + s) + 1;
    },

    bounce: function(pos) {
      if (pos < (1/2.75)) {
        return (7.5625*pos*pos);
      } else if (pos < (2/2.75)) {
        return (7.5625*(pos-=(1.5/2.75))*pos + .75);
      } else if (pos < (2.5/2.75)) {
        return (7.5625*(pos-=(2.25/2.75))*pos + .9375);
      } else {
        return (7.5625*(pos-=(2.625/2.75))*pos + .984375);
      }
    },

    bouncePast: function(pos) {
      if (pos < (1/2.75)) {
        return (7.5625*pos*pos);
      } else if (pos < (2/2.75)) {
        return 2 - (7.5625*(pos-=(1.5/2.75))*pos + .75);
      } else if (pos < (2.5/2.75)) {
        return 2 - (7.5625*(pos-=(2.25/2.75))*pos + .9375);
      } else {
        return 2 - (7.5625*(pos-=(2.625/2.75))*pos + .984375);
      }
    },

    easeFromTo: function(pos) {
      if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
      return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
    },

    easeFrom: function(pos) {
      return Math.pow(pos,4);
    },

    easeTo: function(pos) {
      return Math.pow(pos,0.25);
    }
  });

}());

/*global setTimeout:true, clearTimeout:true */

/**
Shifty Queue Extension
By Jeremy Kahn - jeremyckahn@gmail.com
  v0.2.0

Dependencies: shifty.core.js

Tweeny and all official extensions are freely available under an MIT license.
For instructions on how to use Tweeny and this extension, please consult the manual: https://github.com/jeremyckahn/shifty/blob/master/README.md
For instructions on how to use this extension, please see: https://github.com/jeremyckahn/shifty/blob/master/doc/shifty.queue.md

MIT Lincense.  This code free to use, modify, distribute and enjoy.

*/

(function () {

  var noop = function () {};

  function iterateQueue (queue) {
    queue.shift();

    if (queue.length) {
      queue[0]();
    } else {
      queue.running = false;
    }
  }

  function getWrappedCallback (callback, queue) {
    return function () {
      callback();
      iterateQueue(queue);
    };
  }

  function tweenInit (context, from, to, duration, callback, easing) {
    // Duck typing!  This method infers some info from the parameters above to determine which method to call,
    // and what paramters to pass to it.
    return function () {
      if (to) {
        // Shorthand notation was used, call `tween`
        context.tween(from, to, duration, callback, easing);
      } else {
        // Longhand notation was used

        // Ensure that that `wrappedCallback` (from `queue`) gets passed along.
        from.callback = callback;

        if (from.from) {
          context.tween(from);
        } else {
          // `from` data was omitted, call `to`
          context.to(from);
        }
      }
    };
  }

  Tweenable.prototype.queue = function (from, to, duration, callback, easing) {
    var wrappedCallback;

    if (!this._tweenQueue) {
      this._tweenQueue = [];
    }

    // Make sure there is always an invokable callback
    callback = callback || from.callback || noop;
    wrappedCallback = getWrappedCallback(callback, this._tweenQueue);
    this._tweenQueue.push(tweenInit(this, from, to, duration, wrappedCallback, easing));

    return this;
  };

  Tweenable.prototype.queueStart = function () {
    if (!this._tweenQueue.running && this._tweenQueue.length > 0) {
      this._tweenQueue[0]();
      this._tweenQueue.running = true;
    }

    return this;
  };

  Tweenable.prototype.queueShift = function () {
    this._tweenQueue.shift();
    return this;
  };

  Tweenable.prototype.queuePop = function () {
    this._tweenQueue.pop();
    return this;
  };

  Tweenable.prototype.queueEmpty = function () {
    this._tweenQueue.length = 0;
    return this;
  };

  Tweenable.prototype.queueLength = function () {
    return this._tweenQueue.length;
  };

}());

/**
Shifty Color Extension
By Jeremy Kahn - jeremyckahn@gmail.com
  v0.1.0

For instructions on how to use Shifty, please consult the README: https://github.com/jeremyckahn/shifty/blob/master/README.md
For instructions on how to use this extension, please see: https://github.com/jeremyckahn/shifty/blob/master/doc/shifty.color.md

MIT Lincense.  This code free to use, modify, distribute and enjoy.

*/

(function () {

  var R_SHORTHAND_HEX = /^#([0-9]|[a-f]){3}$/i,
    R_LONGHAND_HEX = /^#([0-9]|[a-f]){6}$/i,
    R_RGB = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)\s*$/i,
    savedRGBPropNames;

  if (!Tweenable) {
    return;
  }

  /**
   * Convert a base-16 number to base-10.
   * @param {Number|String} hex The value to convert
   * @returns {Number} The base-10 equivalent of `hex`.
   */
  function hexToDec (hex) {
    return parseInt(hex, 16);
  }

  /**
   * Convert a hexadecimal string to an array with three items, one each for the red, blue, and green decimal values.
   * @param {String} hex A hexadecimal string.
   * @returns {Array} The converted Array of RGB values if `hex` is a valid string, or an Array of three 0's.
   */
  function hexToRGBArr (hex) {

    hex = hex.replace(/#/g, '');

    // If the string is a shorthand three digit hex notation, normalize it to the standard six digit notation
    if (hex.length === 3) {
      hex = hex.split('');
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    return [hexToDec(hex.substr(0, 2)), hexToDec(hex.substr(2, 2)), hexToDec(hex.substr(4, 2))];
  }

  function getRGBStringFromHex (str) {
    var rgbArr,
      convertedStr;
    rgbArr = hexToRGBArr(str);
    convertedStr = 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')';

    return convertedStr;
  }

  function isColorString (str) {
    return (typeof str === 'string') && (R_SHORTHAND_HEX.test(str) || R_LONGHAND_HEX.test(str) || R_RGB.test(str));
  }

  function isHexString (str) {
    return (typeof str === 'string') && (R_SHORTHAND_HEX.test(str) || R_LONGHAND_HEX.test(str));
  }

  function convertHexStringPropsToRGB (obj) {
    Tweenable.util.each(obj, function (obj, prop) {
      if (isHexString(obj[prop])) {
        obj[prop] = getRGBStringFromHex(obj[prop]);
      }
    });
  }

  function getColorStringPropNames (obj) {
    var list;

    list = [];

    Tweenable.util.each(obj, function (obj, prop) {
      if (isColorString(obj[prop])) {
        list.push(prop);
      }
    });

    return list;
  }

  function rgbToArr (str) {
    return str.match(/(\d+)/g);
  }

  function splitRGBChunks (obj, rgbPropNames) {
    var i,
      limit,
      rgbParts;

      limit = rgbPropNames.length;

      for (i = 0; i < limit; i++) {
        rgbParts = rgbToArr(obj[rgbPropNames[i]]);
        obj['__r__' + rgbPropNames[i]] = +rgbParts[0];
        obj['__g__' + rgbPropNames[i]] = +rgbParts[1];
        obj['__b__' + rgbPropNames[i]] = +rgbParts[2];
        delete obj[rgbPropNames[i]];
      }
  }

  function joinRGBChunks (obj, rgbPropNames) {
    var i,
        limit;

    limit = rgbPropNames.length;

    for (i = 0; i < limit; i++) {

      obj[rgbPropNames[i]] = 'rgb(' +
        parseInt(obj['__r__' + rgbPropNames[i]], 10) + ',' +
        parseInt(obj['__g__' + rgbPropNames[i]], 10) + ',' +
        parseInt(obj['__b__' + rgbPropNames[i]], 10) + ')';

      delete obj['__r__' + rgbPropNames[i]];
      delete obj['__g__' + rgbPropNames[i]];
      delete obj['__b__' + rgbPropNames[i]];
    }
  }

  function expandEasingObject (easingObject, rgbPropNames) {
    var i,
        limit;

    limit = rgbPropNames.length;

    for (i = 0; i < limit; i++) {
      easingObject['__r__' + rgbPropNames[i]] = easingObject[rgbPropNames[i]];
      easingObject['__g__' + rgbPropNames[i]] = easingObject[rgbPropNames[i]];
      easingObject['__b__' + rgbPropNames[i]] = easingObject[rgbPropNames[i]];
    }
  }

  function collapseEasingObject (easingObject, rgbPropNames) {
    var i,
        limit;

    limit = rgbPropNames.length;

    for (i = 0; i < limit; i++) {
      delete easingObject['__r__' + rgbPropNames[i]];
      delete easingObject['__g__' + rgbPropNames[i]];
      delete easingObject['__b__' + rgbPropNames[i]];
    }
  }

  Tweenable.prototype.filter.color = {
    'tweenCreated': function (currentState, fromState, toState) {
      convertHexStringPropsToRGB(currentState);
      convertHexStringPropsToRGB(fromState);
      convertHexStringPropsToRGB(toState);
    },

    'beforeTween': function (currentState, fromState, toState) {
      savedRGBPropNames = getColorStringPropNames(fromState);

      splitRGBChunks(currentState, savedRGBPropNames);
      splitRGBChunks(fromState, savedRGBPropNames);
      splitRGBChunks(toState, savedRGBPropNames);
      expandEasingObject(this._tweenParams.easing, savedRGBPropNames);
    },

    'afterTween': function (currentState, fromState, toState) {
      joinRGBChunks(currentState, savedRGBPropNames);
      joinRGBChunks(fromState, savedRGBPropNames);
      joinRGBChunks(toState, savedRGBPropNames);
      collapseEasingObject(this._tweenParams.easing, savedRGBPropNames);
    }
  };

}());

/**
Shifty CSS Unit Extension
By Jeremy Kahn - jeremyckahn@gmail.com
  v0.1.0

For instructions on how to use Shifty, please consult the README: https://github.com/jeremyckahn/shifty/blob/master/README.md
For instructions on how to use this extension, please see: https://github.com/jeremyckahn/shifty/blob/master/doc/shifty.css_units.md

MIT Lincense.  This code free to use, modify, distribute and enjoy.

*/

(function () {

    var R_FORMAT = /\D+/g;
    var savedTokenProps;

  function isValidString (str) {
    return typeof str === 'string' && str.match(R_FORMAT);
  }

  function sanitizeRegExpString (str) {
    return str
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function getTokenProps (obj) {
    var collection;

    collection = {};

    Tweenable.util.each(obj, function (obj, prop) {
      var rawString = obj[prop];

      if (isValidString(rawString)) {
        var templateChunks = rawString.match(R_FORMAT);

        if (templateChunks.length === 1) {
          templateChunks.unshift('');
        }

        collection[prop] = templateChunks;
      }
    });

    return collection;
  }

  function deTokenize (obj, tokenProps) {
    Tweenable.util.each(tokenProps, function (collection, token) {
      var currentTokenChunks = tokenProps[token];

      // Extract the value from the string
      var rChunkFinder;
      var firstChunk = sanitizeRegExpString(currentTokenChunks[0]);
      var secondChunk = sanitizeRegExpString(currentTokenChunks[1]);

      if (currentTokenChunks[0] === '') {
        rChunkFinder = new RegExp(secondChunk, 'g');
      } else {
        rChunkFinder =
          new RegExp('(' + firstChunk  + '|' + secondChunk + ')', 'g');
      }

      obj[token] = +(obj[token].replace(rChunkFinder, ''));
    });
  }

  function reTokenize (obj, tokenProps) {
    Tweenable.util.each(tokenProps, function (collection, token) {
      var tokenChunks = collection[token];
      obj[token] = tokenChunks[0] + obj[token] + tokenChunks[1];
    });
  }

  Tweenable.prototype.filter.token = {
    'beforeTween': function (currentState, fromState, toState) {
      savedTokenProps = getTokenProps(fromState);

      deTokenize(currentState, savedTokenProps);
      deTokenize(fromState, savedTokenProps);
      deTokenize(toState, savedTokenProps);
    },

    'afterTween': function (currentState, fromState, toState) {
      reTokenize(currentState, savedTokenProps);
      reTokenize(fromState, savedTokenProps);
      reTokenize(toState, savedTokenProps);
    }
  };

}());

/*global setTimeout:true, clearTimeout:true */

/**
Shifty Interpolate Extension
By Jeremy Kahn - jeremyckahn@gmail.com
  v0.1.0

Dependencies: shifty.core.js

Tweeny and all official extensions are freely available under an MIT license.
For instructions on how to use Tweeny and this extension, please consult the manual: https://github.com/jeremyckahn/shifty/blob/master/README.md
For instructions on how to use this extension, please see: https://github.com/jeremyckahn/shifty/blob/master/doc/shifty.queue.md

MIT Lincense.  This code free to use, modify, distribute and enjoy.

*/

(function () {

  if (!Tweenable) {
    return;
  }

  function getInterpolatedValues (from, current, to, position, easing) {
    var easingObject;

    easingObject = Tweenable.util.composeEasingObject(from, easing);

    return Tweenable.util.tweenProps(position, {
      'originalState': from
      ,'to': to
      ,'timestamp': 0
      ,'duration': 1
      ,'easing': easingObject
    }, {
      'current': current
    });
  }

  // This is the static utility version of the function.
  Tweenable.util.interpolate = function (from, to, position, easing) {
    var current
        ,interpolatedValues
        ,mockTweenable;

    // Function was passed a configuration object, extract the values
    if (from && from.from) {
      to = from.to;
      position = from.position;
      easing = from.easing;
      from = from.from;
    }

    mockTweenable = new Tweenable();
    mockTweenable._tweenParams.easing = easing || 'linear';
    current = Tweenable.util.simpleCopy({}, from);

    // Call any data type filters
    Tweenable.util.applyFilter('tweenCreated', mockTweenable, [current, from, to]);
    Tweenable.util.applyFilter('beforeTween', mockTweenable, [current, from, to]);
    interpolatedValues = getInterpolatedValues (from, current, to, position, mockTweenable._tweenParams.easing);
    Tweenable.util.applyFilter('afterTween', mockTweenable, [interpolatedValues, from, to]);

    return interpolatedValues;
  };

  // This is the inheritable instance-method version of the function.
  Tweenable.prototype.interpolate = function (to, position, easing) {
    var interpolatedValues;

    interpolatedValues = Tweenable.util.interpolate(this.get(), to, position, easing);
    this.set(interpolatedValues);

    return interpolatedValues;
  };

}());

/**
Shifty Rounding Extension
By Jeremy Kahn - jeremyckahn@gmail.com
  v0.1.0

MIT Lincense.  This code free to use, modify, distribute and enjoy.

*/

(function () {

  var isRoundingEnabled = false;

  Tweenable.util.enableRounding = function () {
    isRoundingEnabled = true;
  };


  Tweenable.util.disableRounding = function () {
    isRoundingEnabled = false;
  };


  Tweenable.util.isRoundingEnabled = function () {
    return isRoundingEnabled;
  };


  Tweenable.prototype.filter.round = {

    'afterTween': function (currentState, fromState, toState) {

      if (isRoundingEnabled) {
        Tweenable.util.each(currentState, function (obj, prop) {
          // Duck type to see if the property is a number
          if (!obj[prop].replace) {
            obj[prop] = Math.round(obj[prop]);
          }
        });
      }
    }
  };

}());

}());
// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël 2.1.0 - JavaScript Vector Library                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2008-2012 Dmitry Baranovskiy (http://raphaeljs.com)    │ \\
// │ Copyright © 2008-2012 Sencha Labs (http://sencha.com)              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license.│ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.3.4 - JavaScript Events Library                                                │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)          │ \\
// │ Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license. │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.3.4",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
    
        eve = function (name, scope) {
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out.length ? out : null;
        };
    
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    
    eve.on = function (name, f) {
        var names = name.split(separator),
            e = events;
        for (var i = 0, ii = names.length; i < ii; i++) {
            e = e.n;
            !e[names[i]] && (e[names[i]] = {n: {}});
            e = e[names[i]];
        }
        e.f = e.f || [];
        for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
            return fun;
        }
        e.f.push(f);
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    
    eve.stop = function () {
        stop = 1;
    };
    
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    
    
    eve.off = eve.unbind = function (name, f) {
        var names = name.split(separator),
            e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    
    eve.once = function (name, f) {
        var f2 = function () {
            var res = f.apply(this, arguments);
            eve.unbind(name, f2);
            return res;
        };
        return eve.on(name, f2);
    };
    
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define != "undefined" ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);


// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ "Raphaël 2.1.0" - JavaScript Vector Library                         │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\
(function () {
    
    function R(first) {
        if (R.is(first, "function")) {
            return loaded ? first() : eve.on("raphael.DOMload", first);
        } else if (R.is(first, array)) {
            return R._engine.create[apply](R, first.splice(0, 3 + R.is(first[0], nu))).add(first);
        } else {
            var args = Array.prototype.slice.call(arguments, 0);
            if (R.is(args[args.length - 1], "function")) {
                var f = args.pop();
                return loaded ? f.call(R._engine.create[apply](R, args)) : eve.on("raphael.DOMload", function () {
                    f.call(R._engine.create[apply](R, args));
                });
            } else {
                return R._engine.create[apply](R, arguments);
            }
        }
    }
    R.version = "2.1.0";
    R.eve = eve;
    var loaded,
        separator = /[, ]+/,
        elements = {circle: 1, rect: 1, path: 1, ellipse: 1, text: 1, image: 1},
        formatrg = /\{(\d+)\}/g,
        proto = "prototype",
        has = "hasOwnProperty",
        g = {
            doc: document,
            win: window
        },
        oldRaphael = {
            was: Object.prototype[has].call(g.win, "Raphael"),
            is: g.win.Raphael
        },
        Paper = function () {
            
            
            this.ca = this.customAttributes = {};
        },
        paperproto,
        appendChild = "appendChild",
        apply = "apply",
        concat = "concat",
        supportsTouch = "createTouch" in g.doc,
        E = "",
        S = " ",
        Str = String,
        split = "split",
        events = "click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel"[split](S),
        touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        },
        lowerCase = Str.prototype.toLowerCase,
        math = Math,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        pow = math.pow,
        PI = math.PI,
        nu = "number",
        string = "string",
        array = "array",
        toString = "toString",
        fillString = "fill",
        objectToString = Object.prototype.toString,
        paper = {},
        push = "push",
        ISURL = R._ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i,
        colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
        isnan = {"NaN": 1, "Infinity": 1, "-Infinity": 1},
        bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
        round = math.round,
        setAttribute = "setAttribute",
        toFloat = parseFloat,
        toInt = parseInt,
        upperCase = Str.prototype.toUpperCase,
        availableAttrs = R._availableAttrs = {
            "arrow-end": "none",
            "arrow-start": "none",
            blur: 0,
            "clip-rect": "0 0 1e9 1e9",
            cursor: "default",
            cx: 0,
            cy: 0,
            fill: "#fff",
            "fill-opacity": 1,
            font: '10px "Arial"',
            "font-family": '"Arial"',
            "font-size": "10",
            "font-style": "normal",
            "font-weight": 400,
            gradient: 0,
            height: 0,
            href: "http://raphaeljs.com/",
            "letter-spacing": 0,
            opacity: 1,
            path: "M0,0",
            r: 0,
            rx: 0,
            ry: 0,
            src: "",
            stroke: "#000",
            "stroke-dasharray": "",
            "stroke-linecap": "butt",
            "stroke-linejoin": "butt",
            "stroke-miterlimit": 0,
            "stroke-opacity": 1,
            "stroke-width": 1,
            target: "_blank",
            "text-anchor": "middle",
            title: "Raphael",
            transform: "",
            width: 0,
            x: 0,
            y: 0
        },
        availableAnimAttrs = R._availableAnimAttrs = {
            blur: nu,
            "clip-rect": "csv",
            cx: nu,
            cy: nu,
            fill: "colour",
            "fill-opacity": nu,
            "font-size": nu,
            height: nu,
            opacity: nu,
            path: "path",
            r: nu,
            rx: nu,
            ry: nu,
            stroke: "colour",
            "stroke-opacity": nu,
            "stroke-width": nu,
            transform: "transform",
            width: nu,
            x: nu,
            y: nu
        },
        whitespace = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]/g,
        commaSpaces = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,
        hsrg = {hs: 1, rg: 1},
        p2s = /,?([achlmqrstvxz]),?/gi,
        pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        tCommand = /([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig,
        radial_gradient = R._radial_gradient = /^r(?:\(([^,]+?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*([^\)]+?)\))?/,
        eldata = {},
        sortByKey = function (a, b) {
            return a.key - b.key;
        },
        sortByNumber = function (a, b) {
            return toFloat(a) - toFloat(b);
        },
        fun = function () {},
        pipe = function (x) {
            return x;
        },
        rectPath = R._rectPath = function (x, y, w, h, r) {
            if (r) {
                return [["M", x + r, y], ["l", w - r * 2, 0], ["a", r, r, 0, 0, 1, r, r], ["l", 0, h - r * 2], ["a", r, r, 0, 0, 1, -r, r], ["l", r * 2 - w, 0], ["a", r, r, 0, 0, 1, -r, -r], ["l", 0, r * 2 - h], ["a", r, r, 0, 0, 1, r, -r], ["z"]];
            }
            return [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
        },
        ellipsePath = function (x, y, rx, ry) {
            if (ry == null) {
                ry = rx;
            }
            return [["M", x, y], ["m", 0, -ry], ["a", rx, ry, 0, 1, 1, 0, 2 * ry], ["a", rx, ry, 0, 1, 1, 0, -2 * ry], ["z"]];
        },
        getPath = R._getPath = {
            path: function (el) {
                return el.attr("path");
            },
            circle: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.r);
            },
            ellipse: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.rx, a.ry);
            },
            rect: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height, a.r);
            },
            image: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height);
            },
            text: function (el) {
                var bbox = el._getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            }
        },
        
        mapPath = R.mapPath = function (path, matrix) {
            if (!matrix) {
                return path;
            }
            var x, y, i, j, ii, jj, pathi;
            path = path2curve(path);
            for (i = 0, ii = path.length; i < ii; i++) {
                pathi = path[i];
                for (j = 1, jj = pathi.length; j < jj; j += 2) {
                    x = matrix.x(pathi[j], pathi[j + 1]);
                    y = matrix.y(pathi[j], pathi[j + 1]);
                    pathi[j] = x;
                    pathi[j + 1] = y;
                }
            }
            return path;
        };

    R._g = g;
    
    R.type = (g.win.SVGAngle || g.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML");
    if (R.type == "VML") {
        var d = g.doc.createElement("div"),
            b;
        d.innerHTML = '<v:shape adj="1"/>';
        b = d.firstChild;
        b.style.behavior = "url(#default#VML)";
        if (!(b && typeof b.adj == "object")) {
            return (R.type = E);
        }
        d = null;
    }
    
    
    R.svg = !(R.vml = R.type == "VML");
    R._Paper = Paper;
    
    R.fn = paperproto = Paper.prototype = R.prototype;
    R._id = 0;
    R._oid = 0;
    
    R.is = function (o, type) {
        type = lowerCase.call(type);
        if (type == "finite") {
            return !isnan[has](+o);
        }
        if (type == "array") {
            return o instanceof Array;
        }
        return  (type == "null" && o === null) ||
                (type == typeof o && o !== null) ||
                (type == "object" && o === Object(o)) ||
                (type == "array" && Array.isArray && Array.isArray(o)) ||
                objectToString.call(o).slice(8, -1).toLowerCase() == type;
    };

    function clone(obj) {
        if (Object(obj) !== obj) {
            return obj;
        }
        var res = new obj.constructor;
        for (var key in obj) if (obj[has](key)) {
            res[key] = clone(obj[key]);
        }
        return res;
    }

    
    R.angle = function (x1, y1, x2, y2, x3, y3) {
        if (x3 == null) {
            var x = x1 - x2,
                y = y1 - y2;
            if (!x && !y) {
                return 0;
            }
            return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
        } else {
            return R.angle(x1, y1, x3, y3) - R.angle(x2, y2, x3, y3);
        }
    };
    
    R.rad = function (deg) {
        return deg % 360 * PI / 180;
    };
    
    R.deg = function (rad) {
        return rad * 180 / PI % 360;
    };
    
    R.snapTo = function (values, value, tolerance) {
        tolerance = R.is(tolerance, "finite") ? tolerance : 10;
        if (R.is(values, array)) {
            var i = values.length;
            while (i--) if (abs(values[i] - value) <= tolerance) {
                return values[i];
            }
        } else {
            values = +values;
            var rem = value % values;
            if (rem < tolerance) {
                return value - rem;
            }
            if (rem > values - tolerance) {
                return value - rem + values;
            }
        }
        return value;
    };
    
    
    var createUUID = R.createUUID = (function (uuidRegEx, uuidReplacer) {
        return function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
        };
    })(/[xy]/g, function (c) {
        var r = math.random() * 16 | 0,
            v = c == "x" ? r : (r & 3 | 8);
        return v.toString(16);
    });

    
    R.setWindow = function (newwin) {
        eve("raphael.setWindow", R, g.win, newwin);
        g.win = newwin;
        g.doc = g.win.document;
        if (R._engine.initWin) {
            R._engine.initWin(g.win);
        }
    };
    var toHex = function (color) {
        if (R.vml) {
            // http://dean.edwards.name/weblog/2009/10/convert-any-colour-value-to-hex-in-msie/
            var trim = /^\s+|\s+$/g;
            var bod;
            try {
                var docum = new ActiveXObject("htmlfile");
                docum.write("<body>");
                docum.close();
                bod = docum.body;
            } catch(e) {
                bod = createPopup().document.body;
            }
            var range = bod.createTextRange();
            toHex = cacher(function (color) {
                try {
                    bod.style.color = Str(color).replace(trim, E);
                    var value = range.queryCommandValue("ForeColor");
                    value = ((value & 255) << 16) | (value & 65280) | ((value & 16711680) >>> 16);
                    return "#" + ("000000" + value.toString(16)).slice(-6);
                } catch(e) {
                    return "none";
                }
            });
        } else {
            var i = g.doc.createElement("i");
            i.title = "Rapha\xebl Colour Picker";
            i.style.display = "none";
            g.doc.body.appendChild(i);
            toHex = cacher(function (color) {
                i.style.color = color;
                return g.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
            });
        }
        return toHex(color);
    },
    hsbtoString = function () {
        return "hsb(" + [this.h, this.s, this.b] + ")";
    },
    hsltoString = function () {
        return "hsl(" + [this.h, this.s, this.l] + ")";
    },
    rgbtoString = function () {
        return this.hex;
    },
    prepareRGB = function (r, g, b) {
        if (g == null && R.is(r, "object") && "r" in r && "g" in r && "b" in r) {
            b = r.b;
            g = r.g;
            r = r.r;
        }
        if (g == null && R.is(r, string)) {
            var clr = R.getRGB(r);
            r = clr.r;
            g = clr.g;
            b = clr.b;
        }
        if (r > 1 || g > 1 || b > 1) {
            r /= 255;
            g /= 255;
            b /= 255;
        }
        
        return [r, g, b];
    },
    packageRGB = function (r, g, b, o) {
        r *= 255;
        g *= 255;
        b *= 255;
        var rgb = {
            r: r,
            g: g,
            b: b,
            hex: R.rgb(r, g, b),
            toString: rgbtoString
        };
        R.is(o, "finite") && (rgb.opacity = o);
        return rgb;
    };
    
    
    R.color = function (clr) {
        var rgb;
        if (R.is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
            rgb = R.hsb2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else if (R.is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
            rgb = R.hsl2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else {
            if (R.is(clr, "string")) {
                clr = R.getRGB(clr);
            }
            if (R.is(clr, "object") && "r" in clr && "g" in clr && "b" in clr) {
                rgb = R.rgb2hsl(clr);
                clr.h = rgb.h;
                clr.s = rgb.s;
                clr.l = rgb.l;
                rgb = R.rgb2hsb(clr);
                clr.v = rgb.b;
            } else {
                clr = {hex: "none"};
                clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
            }
        }
        clr.toString = rgbtoString;
        return clr;
    };
    
    R.hsb2rgb = function (h, s, v, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "b" in h) {
            v = h.b;
            s = h.s;
            h = h.h;
            o = h.o;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = v * s;
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = v - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    
    R.hsl2rgb = function (h, s, l, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "l" in h) {
            l = h.l;
            s = h.s;
            h = h.h;
        }
        if (h > 1 || s > 1 || l > 1) {
            h /= 360;
            s /= 100;
            l /= 100;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = 2 * s * (l < .5 ? l : 1 - l);
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = l - C / 2;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    
    R.rgb2hsb = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, V, C;
        V = mmax(r, g, b);
        C = V - mmin(r, g, b);
        H = (C == 0 ? null :
             V == r ? (g - b) / C :
             V == g ? (b - r) / C + 2 :
                      (r - g) / C + 4
            );
        H = ((H + 360) % 6) * 60 / 360;
        S = C == 0 ? 0 : C / V;
        return {h: H, s: S, b: V, toString: hsbtoString};
    };
    
    R.rgb2hsl = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, L, M, m, C;
        M = mmax(r, g, b);
        m = mmin(r, g, b);
        C = M - m;
        H = (C == 0 ? null :
             M == r ? (g - b) / C :
             M == g ? (b - r) / C + 2 :
                      (r - g) / C + 4);
        H = ((H + 360) % 6) * 60 / 360;
        L = (M + m) / 2;
        S = (C == 0 ? 0 :
             L < .5 ? C / (2 * L) :
                      C / (2 - 2 * L));
        return {h: H, s: S, l: L, toString: hsltoString};
    };
    R._path2string = function () {
        return this.join(",").replace(p2s, "$1");
    };
    function repush(array, item) {
        for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
            return array.push(array.splice(i, 1)[0]);
        }
    }
    function cacher(f, scope, postprocessor) {
        function newf() {
            var arg = Array.prototype.slice.call(arguments, 0),
                args = arg.join("\u2400"),
                cache = newf.cache = newf.cache || {},
                count = newf.count = newf.count || [];
            if (cache[has](args)) {
                repush(count, args);
                return postprocessor ? postprocessor(cache[args]) : cache[args];
            }
            count.length >= 1e3 && delete cache[count.shift()];
            count.push(args);
            cache[args] = f[apply](scope, arg);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        return newf;
    }

    var preload = R._preload = function (src, f) {
        var img = g.doc.createElement("img");
        img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
        img.onload = function () {
            f.call(this);
            this.onload = null;
            g.doc.body.removeChild(this);
        };
        img.onerror = function () {
            g.doc.body.removeChild(this);
        };
        g.doc.body.appendChild(img);
        img.src = src;
    };
    
    function clrToString() {
        return this.hex;
    }

    
    R.getRGB = cacher(function (colour) {
        if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
            return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
        }
        if (colour == "none") {
            return {r: -1, g: -1, b: -1, hex: "none", toString: clrToString};
        }
        !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
        var res,
            red,
            green,
            blue,
            opacity,
            t,
            values,
            rgb = colour.match(colourRegExp);
        if (rgb) {
            if (rgb[2]) {
                blue = toInt(rgb[2].substring(5), 16);
                green = toInt(rgb[2].substring(3, 5), 16);
                red = toInt(rgb[2].substring(1, 3), 16);
            }
            if (rgb[3]) {
                blue = toInt((t = rgb[3].charAt(3)) + t, 16);
                green = toInt((t = rgb[3].charAt(2)) + t, 16);
                red = toInt((t = rgb[3].charAt(1)) + t, 16);
            }
            if (rgb[4]) {
                values = rgb[4][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            }
            if (rgb[5]) {
                values = rgb[5][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsb2rgb(red, green, blue, opacity);
            }
            if (rgb[6]) {
                values = rgb[6][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsl2rgb(red, green, blue, opacity);
            }
            rgb = {r: red, g: green, b: blue, toString: clrToString};
            rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
            R.is(opacity, "finite") && (rgb.opacity = opacity);
            return rgb;
        }
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
    }, R);
    
    R.hsb = cacher(function (h, s, b) {
        return R.hsb2rgb(h, s, b).hex;
    });
    
    R.hsl = cacher(function (h, s, l) {
        return R.hsl2rgb(h, s, l).hex;
    });
    
    R.rgb = cacher(function (r, g, b) {
        return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
    });
    
    R.getColor = function (value) {
        var start = this.getColor.start = this.getColor.start || {h: 0, s: 1, b: value || .75},
            rgb = this.hsb2rgb(start.h, start.s, start.b);
        start.h += .075;
        if (start.h > 1) {
            start.h = 0;
            start.s -= .2;
            start.s <= 0 && (this.getColor.start = {h: 0, s: 1, b: start.b});
        }
        return rgb.hex;
    };
    
    R.getColor.reset = function () {
        delete this.start;
    };

    // http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        var d = [];
        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [
                        {x: +crp[i - 2], y: +crp[i - 1]},
                        {x: +crp[i],     y: +crp[i + 1]},
                        {x: +crp[i + 2], y: +crp[i + 3]},
                        {x: +crp[i + 4], y: +crp[i + 5]}
                    ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push(["C",
                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
                  (p[1].y + 6*p[2].y - p[3].y) / 6,
                  p[2].x,
                  p[2].y
            ]);
        }

        return d;
    }
    
    R.parsePathString = function (pathString) {
        if (!pathString) {
            return null;
        }
        var pth = paths(pathString);
        if (pth.arr) {
            return pathClone(pth.arr);
        }
        
        var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
            data = [];
        if (R.is(pathString, array) && R.is(pathString[0], array)) { // rough assumption
            data = pathClone(pathString);
        }
        if (!data.length) {
            Str(pathString).replace(pathCommand, function (a, b, c) {
                var params = [],
                    name = b.toLowerCase();
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                if (name == "m" && params.length > 2) {
                    data.push([b][concat](params.splice(0, 2)));
                    name = "l";
                    b = b == "m" ? "l" : "L";
                }
                if (name == "r") {
                    data.push([b][concat](params));
                } else while (params.length >= paramCounts[name]) {
                    data.push([b][concat](params.splice(0, paramCounts[name])));
                    if (!paramCounts[name]) {
                        break;
                    }
                }
            });
        }
        data.toString = R._path2string;
        pth.arr = pathClone(data);
        return data;
    };
    
    R.parseTransformString = cacher(function (TString) {
        if (!TString) {
            return null;
        }
        var paramCounts = {r: 3, s: 4, t: 2, m: 6},
            data = [];
        if (R.is(TString, array) && R.is(TString[0], array)) { // rough assumption
            data = pathClone(TString);
        }
        if (!data.length) {
            Str(TString).replace(tCommand, function (a, b, c) {
                var params = [],
                    name = lowerCase.call(b);
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                data.push([b][concat](params));
            });
        }
        data.toString = R._path2string;
        return data;
    });
    // PATHS
    var paths = function (ps) {
        var p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    };
    
    R.findDotsAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = (90 - math.atan2(mx - nx, my - ny) * 180 / PI);
        (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha
        };
    };
    
    R.bezierBBox = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!R.is(p1x, "array")) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        var bbox = curveDim.apply(null, p1x);
        return {
            x: bbox.min.x,
            y: bbox.min.y,
            x2: bbox.max.x,
            y2: bbox.max.y,
            width: bbox.max.x - bbox.min.x,
            height: bbox.max.y - bbox.min.y
        };
    };
    
    R.isPointInsideBBox = function (bbox, x, y) {
        return x >= bbox.x && x <= bbox.x2 && y >= bbox.y && y <= bbox.y2;
    };
    
    R.isBBoxIntersect = function (bbox1, bbox2) {
        var i = R.isPointInsideBBox;
        return i(bbox2, bbox1.x, bbox1.y)
            || i(bbox2, bbox1.x2, bbox1.y)
            || i(bbox2, bbox1.x, bbox1.y2)
            || i(bbox2, bbox1.x2, bbox1.y2)
            || i(bbox1, bbox2.x, bbox2.y)
            || i(bbox1, bbox2.x2, bbox2.y)
            || i(bbox1, bbox2.x, bbox2.y2)
            || i(bbox1, bbox2.x2, bbox2.y2)
            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    };
    function base3(t, p1, p2, p3, p4) {
        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }
    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        var z2 = z / 2,
            n = 12,
            Tvalues = [-0.1252,0.1252,-0.3678,0.3678,-0.5873,0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],
            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
            sum = 0;
        for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * math.sqrt(comb);
        }
        return z2 * sum;
    }
    function getTatLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        var t = 1,
            step = t / 2,
            t2 = t - step,
            l,
            e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        var px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }
    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }
    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }
    function interHelper(bez1, bez2, justCount) {
        var bbox1 = R.bezierBBox(bez1),
            bbox2 = R.bezierBBox(bez2);
        if (!R.isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        var l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = ~~(l1 / 5),
            n2 = ~~(l2 / 5),
            dots1 = [],
            dots2 = [],
            xy = {},
            res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; i++) {
            var p = R.findDotsAtSegment.apply(R, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; i++) {
            p = R.findDotsAtSegment.apply(R, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; i++) {
            for (var j = 0; j < n2; j++) {
                var di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2
                            });
                        }
                    }
                }
            }
        }
        return res;
    }
    
    R.pathIntersection = function (path1, path2) {
        return interPathHelper(path1, path2);
    };
    R.pathIntersectionNumber = function (path1, path2) {
        return interPathHelper(path1, path2, 1);
    };
    function interPathHelper(path1, path2, justCount) {
        path1 = R._path2curve(path1);
        path2 = R._path2curve(path2);
        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        for (var i = 0, ii = path1.length; i < ii; i++) {
            var pi = path1[i];
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                for (var j = 0, jj = path2.length; j < jj; j++) {
                    var pj = path2[j];
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        var intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            for (var k = 0, kk = intr.length; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }
    
    R.isPointInsidePath = function (path, x, y) {
        var bbox = R.pathBBox(path);
        return R.isPointInsideBBox(bbox, x, y) &&
               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
    };
    R._removedFactory = function (methodname) {
        return function () {
            eve("raphael.log", null, "Rapha\xebl: you are calling to method \u201c" + methodname + "\u201d of removed object", methodname);
        };
    };
    
    var pathDimensions = R.pathBBox = function (path) {
        var pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox) ; // FREEGROUP FIX!!!!!!
        }
        if (!path) {
            return {x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0};
        }
        path = path2curve(path);
        var x = 0, 
            y = 0,
            X = [],
            Y = [],
            p;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X[concat](dim.min.x, dim.max.x);
                Y = Y[concat](dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        var xmin = mmin[apply](0, X),
            ymin = mmin[apply](0, Y),
            xmax = mmax[apply](0, X),
            ymax = mmax[apply](0, Y),
            bb = {
                x: xmin,
                y: ymin,
                x2: xmax,
                y2: ymax,
                width: xmax - xmin,
                height: ymax - ymin
            };
        pth.bbox = clone(bb);
        return bb;
    },
        pathClone = function (pathArray) {
            var res = clone(pathArray);
            res.toString = R._path2string;
            return res;
        },
        pathToRelative = R._pathToRelative = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.rel) {
                return pathClone(pth.rel);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = pathArray[0][1];
                y = pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res.push(["M", x, y]);
            }
            for (var i = start, ii = pathArray.length; i < ii; i++) {
                var r = res[i] = [],
                    pa = pathArray[i];
                if (pa[0] != lowerCase.call(pa[0])) {
                    r[0] = lowerCase.call(pa[0]);
                    switch (r[0]) {
                        case "a":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] - x).toFixed(3);
                            r[7] = +(pa[7] - y).toFixed(3);
                            break;
                        case "v":
                            r[1] = +(pa[1] - y).toFixed(3);
                            break;
                        case "m":
                            mx = pa[1];
                            my = pa[2];
                        default:
                            for (var j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
                            }
                    }
                } else {
                    r = res[i] = [];
                    if (pa[0] == "m") {
                        mx = pa[1] + x;
                        my = pa[2] + y;
                    }
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        res[i][k] = pa[k];
                    }
                }
                var len = res[i].length;
                switch (res[i][0]) {
                    case "z":
                        x = mx;
                        y = my;
                        break;
                    case "h":
                        x += +res[i][len - 1];
                        break;
                    case "v":
                        y += +res[i][len - 1];
                        break;
                    default:
                        x += +res[i][len - 2];
                        y += +res[i][len - 1];
                }
            }
            res.toString = R._path2string;
            pth.rel = pathClone(res);
            return res;
        },
        pathToAbsolute = R._pathToAbsolute = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.abs) {
                return pathClone(pth.abs);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            if (!pathArray || !pathArray.length) {
                return [["M", 0, 0]];
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = +pathArray[0][1];
                y = +pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res[0] = ["M", x, y];
            }
            var crz = pathArray.length == 3 && pathArray[0][0] == "M" && pathArray[1][0].toUpperCase() == "R" && pathArray[2][0].toUpperCase() == "Z";
            for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
                res.push(r = []);
                pa = pathArray[i];
                if (pa[0] != upperCase.call(pa[0])) {
                    r[0] = upperCase.call(pa[0]);
                    switch (r[0]) {
                        case "A":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] + x);
                            r[7] = +(pa[7] + y);
                            break;
                        case "V":
                            r[1] = +pa[1] + y;
                            break;
                        case "H":
                            r[1] = +pa[1] + x;
                            break;
                        case "R":
                            var dots = [x, y][concat](pa.slice(1));
                            for (var j = 2, jj = dots.length; j < jj; j++) {
                                dots[j] = +dots[j] + x;
                                dots[++j] = +dots[j] + y;
                            }
                            res.pop();
                            res = res[concat](catmullRom2bezier(dots, crz));
                            break;
                        case "M":
                            mx = +pa[1] + x;
                            my = +pa[2] + y;
                        default:
                            for (j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +pa[j] + ((j % 2) ? x : y);
                            }
                    }
                } else if (pa[0] == "R") {
                    dots = [x, y][concat](pa.slice(1));
                    res.pop();
                    res = res[concat](catmullRom2bezier(dots, crz));
                    r = ["R"][concat](pa.slice(-2));
                } else {
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        r[k] = pa[k];
                    }
                }
                switch (r[0]) {
                    case "Z":
                        x = mx;
                        y = my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
            res.toString = R._path2string;
            pth.abs = pathClone(res);
            return res;
        },
        l2c = function (x1, y1, x2, y2) {
            return [x1, y1, x2, y2, x2, y2];
        },
        q2c = function (x1, y1, ax, ay, x2, y2) {
            var _13 = 1 / 3,
                _23 = 2 / 3;
            return [
                    _13 * x1 + _23 * ax,
                    _13 * y1 + _23 * ay,
                    _13 * x2 + _23 * ax,
                    _13 * y2 + _23 * ay,
                    x2,
                    y2
                ];
        },
        a2c = function (x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
            // for more information of where this math came from visit:
            // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
            var _120 = PI * 120 / 180,
                rad = PI / 180 * (+angle || 0),
                res = [],
                xy,
                rotate = cacher(function (x, y, rad) {
                    var X = x * math.cos(rad) - y * math.sin(rad),
                        Y = x * math.sin(rad) + y * math.cos(rad);
                    return {x: X, y: Y};
                });
            if (!recursive) {
                xy = rotate(x1, y1, -rad);
                x1 = xy.x;
                y1 = xy.y;
                xy = rotate(x2, y2, -rad);
                x2 = xy.x;
                y2 = xy.y;
                var cos = math.cos(PI / 180 * angle),
                    sin = math.sin(PI / 180 * angle),
                    x = (x1 - x2) / 2,
                    y = (y1 - y2) / 2;
                var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
                if (h > 1) {
                    h = math.sqrt(h);
                    rx = h * rx;
                    ry = h * ry;
                }
                var rx2 = rx * rx,
                    ry2 = ry * ry,
                    k = (large_arc_flag == sweep_flag ? -1 : 1) *
                        math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                    cx = k * rx * y / ry + (x1 + x2) / 2,
                    cy = k * -ry * x / rx + (y1 + y2) / 2,
                    f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
                    f2 = math.asin(((y2 - cy) / ry).toFixed(9));

                f1 = x1 < cx ? PI - f1 : f1;
                f2 = x2 < cx ? PI - f2 : f2;
                f1 < 0 && (f1 = PI * 2 + f1);
                f2 < 0 && (f2 = PI * 2 + f2);
                if (sweep_flag && f1 > f2) {
                    f1 = f1 - PI * 2;
                }
                if (!sweep_flag && f2 > f1) {
                    f2 = f2 - PI * 2;
                }
            } else {
                f1 = recursive[0];
                f2 = recursive[1];
                cx = recursive[2];
                cy = recursive[3];
            }
            var df = f2 - f1;
            if (abs(df) > _120) {
                var f2old = f2,
                    x2old = x2,
                    y2old = y2;
                f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
                x2 = cx + rx * math.cos(f2);
                y2 = cy + ry * math.sin(f2);
                res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
            }
            df = f2 - f1;
            var c1 = math.cos(f1),
                s1 = math.sin(f1),
                c2 = math.cos(f2),
                s2 = math.sin(f2),
                t = math.tan(df / 4),
                hx = 4 / 3 * rx * t,
                hy = 4 / 3 * ry * t,
                m1 = [x1, y1],
                m2 = [x1 + hx * s1, y1 - hy * c1],
                m3 = [x2 + hx * s2, y2 - hy * c2],
                m4 = [x2, y2];
            m2[0] = 2 * m1[0] - m2[0];
            m2[1] = 2 * m1[1] - m2[1];
            if (recursive) {
                return [m2, m3, m4][concat](res);
            } else {
                res = [m2, m3, m4][concat](res).join()[split](",");
                var newres = [];
                for (var i = 0, ii = res.length; i < ii; i++) {
                    newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
                }
                return newres;
            }
        },
        findDotAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t;
            return {
                x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
                y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
            };
        },
        curveDim = cacher(function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
            var a = (c2x - 2 * c1x + p1x) - (p2x - 2 * c2x + c1x),
                b = 2 * (c1x - p1x) - 2 * (c2x - c1x),
                c = p1x - c1x,
                t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a,
                t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a,
                y = [p1y, p2y],
                x = [p1x, p2x],
                dot;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            a = (c2y - 2 * c1y + p1y) - (p2y - 2 * c2y + c1y);
            b = 2 * (c1y - p1y) - 2 * (c2y - c1y);
            c = p1y - c1y;
            t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a;
            t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            return {
                min: {x: mmin[apply](0, x), y: mmin[apply](0, y)},
                max: {x: mmax[apply](0, x), y: mmax[apply](0, y)}
            };
        }),
        path2curve = R._path2curve = cacher(function (path, path2) {
            var pth = !path2 && paths(path);
            if (!path2 && pth.curve) {
                return pathClone(pth.curve);
            }
            var p = pathToAbsolute(path),
                p2 = path2 && pathToAbsolute(path2),
                attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                processPath = function (path, d) {
                    var nx, ny;
                    if (!path) {
                        return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                    }
                    !(path[0] in {T:1, Q:1}) && (d.qx = d.qy = null);
                    switch (path[0]) {
                        case "M":
                            d.X = path[1];
                            d.Y = path[2];
                            break;
                        case "A":
                            path = ["C"][concat](a2c[apply](0, [d.x, d.y][concat](path.slice(1))));
                            break;
                        case "S":
                            nx = d.x + (d.x - (d.bx || d.x));
                            ny = d.y + (d.y - (d.by || d.y));
                            path = ["C", nx, ny][concat](path.slice(1));
                            break;
                        case "T":
                            d.qx = d.x + (d.x - (d.qx || d.x));
                            d.qy = d.y + (d.y - (d.qy || d.y));
                            path = ["C"][concat](q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                            break;
                        case "Q":
                            d.qx = path[1];
                            d.qy = path[2];
                            path = ["C"][concat](q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                            break;
                        case "L":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], path[2]));
                            break;
                        case "H":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], d.y));
                            break;
                        case "V":
                            path = ["C"][concat](l2c(d.x, d.y, d.x, path[1]));
                            break;
                        case "Z":
                            path = ["C"][concat](l2c(d.x, d.y, d.X, d.Y));
                            break;
                    }
                    return path;
                },
                fixArc = function (pp, i) {
                    if (pp[i].length > 7) {
                        pp[i].shift();
                        var pi = pp[i];
                        while (pi.length) {
                            pp.splice(i++, 0, ["C"][concat](pi.splice(0, 6)));
                        }
                        pp.splice(i, 1);
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                },
                fixM = function (path1, path2, a1, a2, i) {
                    if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                        path2.splice(i, 0, ["M", a2.x, a2.y]);
                        a1.bx = 0;
                        a1.by = 0;
                        a1.x = path1[i][1];
                        a1.y = path1[i][2];
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                };
            for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
                p[i] = processPath(p[i], attrs);
                fixArc(p, i);
                p2 && (p2[i] = processPath(p2[i], attrs2));
                p2 && fixArc(p2, i);
                fixM(p, p2, attrs, attrs2, i);
                fixM(p2, p, attrs2, attrs, i);
                var seg = p[i],
                    seg2 = p2 && p2[i],
                    seglen = seg.length,
                    seg2len = p2 && seg2.length;
                attrs.x = seg[seglen - 2];
                attrs.y = seg[seglen - 1];
                attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
                attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
                attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
                attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
                attrs2.x = p2 && seg2[seg2len - 2];
                attrs2.y = p2 && seg2[seg2len - 1];
            }
            if (!p2) {
                pth.curve = pathClone(p);
            }
            return p2 ? [p, p2] : p;
        }, null, pathClone),
        parseDots = R._parseDots = cacher(function (gradient) {
            var dots = [];
            for (var i = 0, ii = gradient.length; i < ii; i++) {
                var dot = {},
                    par = gradient[i].match(/^([^:]*):?([\d\.]*)/);
                dot.color = R.getRGB(par[1]);
                if (dot.color.error) {
                    return null;
                }
                dot.color = dot.color.hex;
                par[2] && (dot.offset = par[2] + "%");
                dots.push(dot);
            }
            for (i = 1, ii = dots.length - 1; i < ii; i++) {
                if (!dots[i].offset) {
                    var start = toFloat(dots[i - 1].offset || 0),
                        end = 0;
                    for (var j = i + 1; j < ii; j++) {
                        if (dots[j].offset) {
                            end = dots[j].offset;
                            break;
                        }
                    }
                    if (!end) {
                        end = 100;
                        j = ii;
                    }
                    end = toFloat(end);
                    var d = (end - start) / (j - i + 1);
                    for (; i < j; i++) {
                        start += d;
                        dots[i].offset = start + "%";
                    }
                }
            }
            return dots;
        }),
        tear = R._tear = function (el, paper) {
            el == paper.top && (paper.top = el.prev);
            el == paper.bottom && (paper.bottom = el.next);
            el.next && (el.next.prev = el.prev);
            el.prev && (el.prev.next = el.next);
        },
        tofront = R._tofront = function (el, paper) {
            if (paper.top === el) {
                return;
            }
            tear(el, paper);
            el.next = null;
            el.prev = paper.top;
            paper.top.next = el;
            paper.top = el;
        },
        toback = R._toback = function (el, paper) {
            if (paper.bottom === el) {
                return;
            }
            tear(el, paper);
            el.next = paper.bottom;
            el.prev = null;
            paper.bottom.prev = el;
            paper.bottom = el;
        },
        insertafter = R._insertafter = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.top && (paper.top = el);
            el2.next && (el2.next.prev = el);
            el.next = el2.next;
            el.prev = el2;
            el2.next = el;
        },
        insertbefore = R._insertbefore = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.bottom && (paper.bottom = el);
            el2.prev && (el2.prev.next = el);
            el.prev = el2.prev;
            el2.prev = el;
            el.next = el2;
        },
        
        toMatrix = R.toMatrix = function (path, transform) {
            var bb = pathDimensions(path),
                el = {
                    _: {
                        transform: E
                    },
                    getBBox: function () {
                        return bb;
                    }
                };
            extractTransform(el, transform);
            return el.matrix;
        },
        
        transformPath = R.transformPath = function (path, transform) {
            return mapPath(path, toMatrix(path, transform));
        },
        extractTransform = R._extractTransform = function (el, tstr) {
            if (tstr == null) {
                return el._.transform;
            }
            tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
            var tdata = R.parseTransformString(tstr),
                deg = 0,
                dx = 0,
                dy = 0,
                sx = 1,
                sy = 1,
                _ = el._,
                m = new Matrix;
            _.transform = tdata || [];
            if (tdata) {
                for (var i = 0, ii = tdata.length; i < ii; i++) {
                    var t = tdata[i],
                        tlen = t.length,
                        command = Str(t[0]).toLowerCase(),
                        absolute = t[0] != command,
                        inver = absolute ? m.invert() : 0,
                        x1,
                        y1,
                        x2,
                        y2,
                        bb;
                    if (command == "t" && tlen == 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command == "r") {
                        if (tlen == 2) {
                            bb = bb || el.getBBox(1);
                            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            deg += t[1];
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.rotate(t[1], x2, y2);
                            } else {
                                m.rotate(t[1], t[2], t[3]);
                            }
                            deg += t[1];
                        }
                    } else if (command == "s") {
                        if (tlen == 2 || tlen == 3) {
                            bb = bb || el.getBBox(1);
                            m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            sx *= t[1];
                            sy *= t[tlen - 1];
                        } else if (tlen == 5) {
                            if (absolute) {
                                x2 = inver.x(t[3], t[4]);
                                y2 = inver.y(t[3], t[4]);
                                m.scale(t[1], t[2], x2, y2);
                            } else {
                                m.scale(t[1], t[2], t[3], t[4]);
                            }
                            sx *= t[1];
                            sy *= t[2];
                        }
                    } else if (command == "m" && tlen == 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                    _.dirtyT = 1;
                    el.matrix = m;
                }
            }

            
            el.matrix = m;

            _.sx = sx;
            _.sy = sy;
            _.deg = deg;
            _.dx = dx = m.e;
            _.dy = dy = m.f;

            if (sx == 1 && sy == 1 && !deg && _.bbox) {
                _.bbox.x += +dx;
                _.bbox.y += +dy;
            } else {
                _.dirtyT = 1;
            }
        },
        getEmpty = function (item) {
            var l = item[0];
            switch (l.toLowerCase()) {
                case "t": return [l, 0, 0];
                case "m": return [l, 1, 0, 0, 1, 0, 0];
                case "r": if (item.length == 4) {
                    return [l, 0, item[2], item[3]];
                } else {
                    return [l, 0];
                }
                case "s": if (item.length == 5) {
                    return [l, 1, 1, item[3], item[4]];
                } else if (item.length == 3) {
                    return [l, 1, 1];
                } else {
                    return [l, 1];
                }
            }
        },
        equaliseTransform = R._equaliseTransform = function (t1, t2) {
            t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
            t1 = R.parseTransformString(t1) || [];
            t2 = R.parseTransformString(t2) || [];
            var maxlength = mmax(t1.length, t2.length),
                from = [],
                to = [],
                i = 0, j, jj,
                tt1, tt2;
            for (; i < maxlength; i++) {
                tt1 = t1[i] || getEmpty(t2[i]);
                tt2 = t2[i] || getEmpty(tt1);
                if ((tt1[0] != tt2[0]) ||
                    (tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                    (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
                    ) {
                    return;
                }
                from[i] = [];
                to[i] = [];
                for (j = 0, jj = mmax(tt1.length, tt2.length); j < jj; j++) {
                    j in tt1 && (from[i][j] = tt1[j]);
                    j in tt2 && (to[i][j] = tt2[j]);
                }
            }
            return {
                from: from,
                to: to
            };
        };
    R._getContainer = function (x, y, w, h) {
        var container;
        container = h == null && !R.is(x, "object") ? g.doc.getElementById(x) : x;
        if (container == null) {
            return;
        }
        if (container.tagName) {
            if (y == null) {
                return {
                    container: container,
                    width: container.style.pixelWidth || container.offsetWidth,
                    height: container.style.pixelHeight || container.offsetHeight
                };
            } else {
                return {
                    container: container,
                    width: y,
                    height: w
                };
            }
        }
        return {
            container: 1,
            x: x,
            y: y,
            width: w,
            height: h
        };
    };
    
    R.pathToRelative = pathToRelative;
    R._engine = {};
    
    R.path2curve = path2curve;
    
    R.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
    function Matrix(a, b, c, d, e, f) {
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }
    (function (matrixproto) {
        
        matrixproto.add = function (a, b, c, d, e, f) {
            var out = [[], [], []],
                m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
                matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
                x, y, z, res;

            if (a && a instanceof Matrix) {
                matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res = 0;
                    for (z = 0; z < 3; z++) {
                        res += m[x][z] * matrix[z][y];
                    }
                    out[x][y] = res;
                }
            }
            this.a = out[0][0];
            this.b = out[1][0];
            this.c = out[0][1];
            this.d = out[1][1];
            this.e = out[0][2];
            this.f = out[1][2];
        };
        
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        
        matrixproto.translate = function (x, y) {
            this.add(1, 0, 0, 1, x, y);
        };
        
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
            this.add(x, 0, 0, y, 0, 0);
            (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
        };
        
        matrixproto.rotate = function (a, x, y) {
            a = R.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            this.add(1, 0, 0, 1, -x, -y);
        };
        
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(4);
        };
        matrixproto.toString = function () {
            return R.svg ?
                "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")" :
                [this.get(0), this.get(2), this.get(1), this.get(3), 0, 0].join();
        };
        matrixproto.toFilter = function () {
            return "progid:DXImageTransform.Microsoft.Matrix(M11=" + this.get(0) +
                ", M12=" + this.get(2) + ", M21=" + this.get(1) + ", M22=" + this.get(3) +
                ", Dx=" + this.get(4) + ", Dy=" + this.get(5) + ", sizingmethod='auto expand')";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(4), this.f.toFixed(4)];
        };
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }
        
        matrixproto.split = function () {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            // scale and shear
            var row = [[this.a, this.c], [this.b, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            // rotation
            var sin = -row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = R.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = R.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };
        
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this[split]();
            if (s.isSimple) {
                s.scalex = +s.scalex.toFixed(4);
                s.scaley = +s.scaley.toFixed(4);
                s.rotate = +s.rotate.toFixed(4);
                return  (s.dx || s.dy ? "t" + [s.dx, s.dy] : E) + 
                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                        (s.rotate ? "r" + [s.rotate, 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };
    })(Matrix.prototype);

    // WebKit rendering bug workaround method
    var version = navigator.userAgent.match(/Version\/(.*?)\s/) || navigator.userAgent.match(/Chrome\/(\d+)/);
    if ((navigator.vendor == "Apple Computer, Inc.") && (version && version[1] < 4 || navigator.platform.slice(0, 2) == "iP") ||
        (navigator.vendor == "Google Inc." && version && version[1] < 8)) {
        
        paperproto.safari = function () {
            var rect = this.rect(-99, -99, this.width + 99, this.height + 99).attr({stroke: "none"});
            setTimeout(function () {rect.remove();});
        };
    } else {
        paperproto.safari = fun;
    }
 
    var preventDefault = function () {
        this.returnValue = false;
    },
    preventTouch = function () {
        return this.originalEvent.preventDefault();
    },
    stopPropagation = function () {
        this.cancelBubble = true;
    },
    stopTouch = function () {
        return this.originalEvent.stopPropagation();
    },
    addEvent = (function () {
        if (g.doc.addEventListener) {
            return function (obj, type, fn, element) {
                var realName = supportsTouch && touchMap[type] ? touchMap[type] : type,
                    f = function (e) {
                        var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
                            x = e.clientX + scrollX,
                            y = e.clientY + scrollY;
                    if (supportsTouch && touchMap[has](type)) {
                        for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                            if (e.targetTouches[i].target == obj) {
                                var olde = e;
                                e = e.targetTouches[i];
                                e.originalEvent = olde;
                                e.preventDefault = preventTouch;
                                e.stopPropagation = stopTouch;
                                break;
                            }
                        }
                    }
                    return fn.call(element, e, x, y);
                };
                obj.addEventListener(realName, f, false);
                return function () {
                    obj.removeEventListener(realName, f, false);
                    return true;
                };
            };
        } else if (g.doc.attachEvent) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    e = e || g.win.event;
                    var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                        scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
                        x = e.clientX + scrollX,
                        y = e.clientY + scrollY;
                    e.preventDefault = e.preventDefault || preventDefault;
                    e.stopPropagation = e.stopPropagation || stopPropagation;
                    return fn.call(element, e, x, y);
                };
                obj.attachEvent("on" + type, f);
                var detacher = function () {
                    obj.detachEvent("on" + type, f);
                    return true;
                };
                return detacher;
            };
        }
    })(),
    drag = [],
    dragMove = function (e) {
        var x = e.clientX,
            y = e.clientY,
            scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
            dragi,
            j = drag.length;
        while (j--) {
            dragi = drag[j];
            if (supportsTouch) {
                var i = e.touches.length,
                    touch;
                while (i--) {
                    touch = e.touches[i];
                    if (touch.identifier == dragi.el._drag.id) {
                        x = touch.clientX;
                        y = touch.clientY;
                        (e.originalEvent ? e.originalEvent : e).preventDefault();
                        break;
                    }
                }
            } else {
                e.preventDefault();
            }
            var node = dragi.el.node,
                o,
                next = node.nextSibling,
                parent = node.parentNode,
                display = node.style.display;
            g.win.opera && parent.removeChild(node);
            node.style.display = "none";
            o = dragi.el.paper.getElementByPoint(x, y);
            node.style.display = display;
            g.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
            o && eve("raphael.drag.over." + dragi.el.id, dragi.el, o);
            x += scrollX;
            y += scrollY;
            eve("raphael.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
        }
    },
    dragUp = function (e) {
        R.unmousemove(dragMove).unmouseup(dragUp);
        var i = drag.length,
            dragi;
        while (i--) {
            dragi = drag[i];
            dragi.el._drag = {};
            eve("raphael.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
        }
        drag = [];
    },
    
    elproto = R.el = {};
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    for (var i = events.length; i--;) {
        (function (eventName) {
            R[eventName] = elproto[eventName] = function (fn, scope) {
                if (R.is(fn, "function")) {
                    this.events = this.events || [];
                    this.events.push({name: eventName, f: fn, unbind: addEvent(this.shape || this.node || g.doc, eventName, fn, scope || this)});
                }
                return this;
            };
            R["un" + eventName] = elproto["un" + eventName] = function (fn) {
                var events = this.events || [],
                    l = events.length;
                while (l--) if (events[l].name == eventName && events[l].f == fn) {
                    events[l].unbind();
                    events.splice(l, 1);
                    !events.length && delete this.events;
                    return this;
                }
                return this;
            };
        })(events[i]);
    }
    
    
    elproto.data = function (key, value) {
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 1) {
            if (R.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("raphael.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("raphael.data.set." + this.id, this, value, key);
        return this;
    };
    
    elproto.removeData = function (key) {
        if (key == null) {
            eldata[this.id] = {};
        } else {
            eldata[this.id] && delete eldata[this.id][key];
        }
        return this;
    };
    
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    var draggable = [];
    
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        function start(e) {
            (e.originalEvent || e).preventDefault();
            var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft;
            this._drag.x = e.clientX + scrollX;
            this._drag.y = e.clientY + scrollY;
            this._drag.id = e.identifier;
            !drag.length && R.mousemove(dragMove).mouseup(dragUp);
            drag.push({el: this, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("raphael.drag.start." + this.id, onstart);
            onmove && eve.on("raphael.drag.move." + this.id, onmove);
            onend && eve.on("raphael.drag.end." + this.id, onend);
            eve("raphael.drag.start." + this.id, start_scope || move_scope || this, e.clientX + scrollX, e.clientY + scrollY, e);
        }
        this._drag = {};
        draggable.push({el: this, start: start});
        this.mousedown(start);
        return this;
    };
    
    elproto.onDragOver = function (f) {
        f ? eve.on("raphael.drag.over." + this.id, f) : eve.unbind("raphael.drag.over." + this.id);
    };
    
    elproto.undrag = function () {
        var i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].start);
            draggable.splice(i, 1);
            eve.unbind("raphael.drag.*." + this.id);
        }
        !draggable.length && R.unmousemove(dragMove).unmouseup(dragUp);
    };
    
    paperproto.circle = function (x, y, r) {
        var out = R._engine.circle(this, x || 0, y || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.rect = function (x, y, w, h, r) {
        var out = R._engine.rect(this, x || 0, y || 0, w || 0, h || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.ellipse = function (x, y, rx, ry) {
        var out = R._engine.ellipse(this, x || 0, y || 0, rx || 0, ry || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.path = function (pathString) {
        pathString && !R.is(pathString, string) && !R.is(pathString[0], array) && (pathString += E);
        var out = R._engine.path(R.format[apply](R, arguments), this);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.image = function (src, x, y, w, h) {
        var out = R._engine.image(this, src || "about:blank", x || 0, y || 0, w || 0, h || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.text = function (x, y, text) {
        var out = R._engine.text(this, x || 0, y || 0, Str(text));
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.set = function (itemsArray) {
        !R.is(itemsArray, "array") && (itemsArray = Array.prototype.splice.call(arguments, 0, arguments.length));
        var out = new Set(itemsArray);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.setStart = function (set) {
        this.__set__ = set || this.set();
    };
    
    paperproto.setFinish = function (set) {
        var out = this.__set__;
        delete this.__set__;
        return out;
    };
    
    paperproto.setSize = function (width, height) {
        return R._engine.setSize.call(this, width, height);
    };
    
    paperproto.setViewBox = function (x, y, w, h, fit) {
        return R._engine.setViewBox.call(this, x, y, w, h, fit);
    };
    
    
    paperproto.top = paperproto.bottom = null;
    
    paperproto.raphael = R;
    var getOffset = function (elem) {
        var box = elem.getBoundingClientRect(),
            doc = elem.ownerDocument,
            body = doc.body,
            docElem = doc.documentElement,
            clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
            top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
            left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
        return {
            y: top,
            x: left
        };
    };
    
    paperproto.getElementByPoint = function (x, y) {
        var paper = this,
            svg = paper.canvas,
            target = g.doc.elementFromPoint(x, y);
        if (g.win.opera && target.tagName == "svg") {
            var so = getOffset(svg),
                sr = svg.createSVGRect();
            sr.x = x - so.x;
            sr.y = y - so.y;
            sr.width = sr.height = 1;
            var hits = svg.getIntersectionList(sr, null);
            if (hits.length) {
                target = hits[hits.length - 1];
            }
        }
        if (!target) {
            return null;
        }
        while (target.parentNode && target != svg.parentNode && !target.raphael) {
            target = target.parentNode;
        }
        target == paper.canvas.parentNode && (target = svg);
        target = target && target.raphael ? paper.getById(target.raphaelid) : null;
        return target;
    };
    
    paperproto.getById = function (id) {
        var bot = this.bottom;
        while (bot) {
            if (bot.id == id) {
                return bot;
            }
            bot = bot.next;
        }
        return null;
    };
    
    paperproto.forEach = function (callback, thisArg) {
        var bot = this.bottom;
        while (bot) {
            if (callback.call(thisArg, bot) === false) {
                return this;
            }
            bot = bot.next;
        }
        return this;
    };
    
    paperproto.getElementsByPoint = function (x, y) {
        var set = this.set();
        this.forEach(function (el) {
            if (el.isPointInside(x, y)) {
                set.push(el);
            }
        });
        return set;
    };
    function x_y() {
        return this.x + S + this.y;
    }
    function x_y_w_h() {
        return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
    }
    
    elproto.isPointInside = function (x, y) {
        var rp = this.realPath = this.realPath || getPath[this.type](this);
        return R.isPointInsidePath(rp, x, y);
    };
    
    elproto.getBBox = function (isWithoutTransform) {
        if (this.removed) {
            return {};
        }
        var _ = this._;
        if (isWithoutTransform) {
            if (_.dirty || !_.bboxwt) {
                this.realPath = getPath[this.type](this);
                _.bboxwt = pathDimensions(this.realPath);
                _.bboxwt.toString = x_y_w_h;
                _.dirty = 0;
            }
            return _.bboxwt;
        }
        if (_.dirty || _.dirtyT || !_.bbox) {
            if (_.dirty || !this.realPath) {
                _.bboxwt = 0;
                this.realPath = getPath[this.type](this);
            }
            _.bbox = pathDimensions(mapPath(this.realPath, this.matrix));
            _.bbox.toString = x_y_w_h;
            _.dirty = _.dirtyT = 0;
        }
        return _.bbox;
    };
    
    elproto.clone = function () {
        if (this.removed) {
            return null;
        }
        var out = this.paper[this.type]().attr(this.attr());
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    elproto.glow = function (glow) {
        if (this.type == "text") {
            return null;
        }
        glow = glow || {};
        var s = {
            width: (glow.width || 10) + (+this.attr("stroke-width") || 1),
            fill: glow.fill || false,
            opacity: glow.opacity || .5,
            offsetx: glow.offsetx || 0,
            offsety: glow.offsety || 0,
            color: glow.color || "#000"
        },
            c = s.width / 2,
            r = this.paper,
            out = r.set(),
            path = this.realPath || getPath[this.type](this);
        path = this.matrix ? mapPath(path, this.matrix) : path;
        for (var i = 1; i < c + 1; i++) {
            out.push(r.path(path).attr({
                stroke: s.color,
                fill: s.fill ? s.color : "none",
                "stroke-linejoin": "round",
                "stroke-linecap": "round",
                "stroke-width": +(s.width / c * i).toFixed(3),
                opacity: +(s.opacity / c).toFixed(3)
            }));
        }
        return out.insertBefore(this).translate(s.offsetx, s.offsety);
    };
    var curveslengths = {},
    getPointAtSegmentLength = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return R.findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTatLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    },
    getLengthFactory = function (istotal, subpath) {
        return function (path, length, onlystart) {
            path = path2curve(path);
            var x, y, p, l, sp = "", subpaths = {}, point,
                len = 0;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            sp += ["C" + point.start.x, point.start.y, point.m.x, point.m.y, point.x, point.y];
                            if (onlystart) {return sp;}
                            subpaths.start = sp;
                            sp = ["M" + point.x, point.y + "C" + point.n.x, point.n.y, point.end.x, point.end.y, p[5], p[6]].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            return {x: point.x, y: point.y, alpha: point.alpha};
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ? len : subpath ? subpaths : R.findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            point.alpha && (point = {x: point.x, y: point.y, alpha: point.alpha});
            return point;
        };
    };
    var getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);
    
    R.getTotalLength = getTotalLength;
    
    R.getPointAtLength = getPointAtLength;
    
    R.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        var a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };
    
    elproto.getTotalLength = function () {
        if (this.type != "path") {return;}
        if (this.node.getTotalLength) {
            return this.node.getTotalLength();
        }
        return getTotalLength(this.attrs.path);
    };
    
    elproto.getPointAtLength = function (length) {
        if (this.type != "path") {return;}
        return getPointAtLength(this.attrs.path, length);
    };
    
    elproto.getSubpath = function (from, to) {
        if (this.type != "path") {return;}
        return R.getSubpath(this.attrs.path, from, to);
    };
    
    var ef = R.easing_formulas = {
        linear: function (n) {
            return n;
        },
        "<": function (n) {
            return pow(n, 1.7);
        },
        ">": function (n) {
            return pow(n, .48);
        },
        "<>": function (n) {
            var q = .48 - n / 1.04,
                Q = math.sqrt(.1734 + q * q),
                x = Q - q,
                X = pow(abs(x), 1 / 3) * (x < 0 ? -1 : 1),
                y = -Q - q,
                Y = pow(abs(y), 1 / 3) * (y < 0 ? -1 : 1),
                t = X + Y + .5;
            return (1 - t) * 3 * t * t + t * t * t;
        },
        backIn: function (n) {
            var s = 1.70158;
            return n * n * ((s + 1) * n - s);
        },
        backOut: function (n) {
            n = n - 1;
            var s = 1.70158;
            return n * n * ((s + 1) * n + s) + 1;
        },
        elastic: function (n) {
            if (n == !!n) {
                return n;
            }
            return pow(2, -10 * n) * math.sin((n - .075) * (2 * PI) / .3) + 1;
        },
        bounce: function (n) {
            var s = 7.5625,
                p = 2.75,
                l;
            if (n < (1 / p)) {
                l = s * n * n;
            } else {
                if (n < (2 / p)) {
                    n -= (1.5 / p);
                    l = s * n * n + .75;
                } else {
                    if (n < (2.5 / p)) {
                        n -= (2.25 / p);
                        l = s * n * n + .9375;
                    } else {
                        n -= (2.625 / p);
                        l = s * n * n + .984375;
                    }
                }
            }
            return l;
        }
    };
    ef.easeIn = ef["ease-in"] = ef["<"];
    ef.easeOut = ef["ease-out"] = ef[">"];
    ef.easeInOut = ef["ease-in-out"] = ef["<>"];
    ef["back-in"] = ef.backIn;
    ef["back-out"] = ef.backOut;

    var animationElements = [],
        requestAnimFrame = window.requestAnimationFrame       ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame    ||
                           window.oRequestAnimationFrame      ||
                           window.msRequestAnimationFrame     ||
                           function (callback) {
                               setTimeout(callback, 16);
                           },
        animation = function () {
            var Now = +new Date,
                l = 0;
            for (; l < animationElements.length; l++) {
                var e = animationElements[l];
                if (e.el.removed || e.paused) {
                    continue;
                }
                var time = Now - e.start,
                    ms = e.ms,
                    easing = e.easing,
                    from = e.from,
                    diff = e.diff,
                    to = e.to,
                    t = e.t,
                    that = e.el,
                    set = {},
                    now,
                    init = {},
                    key;
                if (e.initstatus) {
                    time = (e.initstatus * e.anim.top - e.prev) / (e.percent - e.prev) * ms;
                    e.status = e.initstatus;
                    delete e.initstatus;
                    e.stop && animationElements.splice(l--, 1);
                } else {
                    e.status = (e.prev + (e.percent - e.prev) * (time / ms)) / e.anim.top;
                }
                if (time < 0) {
                    continue;
                }
                if (time < ms) {
                    var pos = easing(time / ms);
                    for (var attr in from) if (from[has](attr)) {
                        switch (availableAnimAttrs[attr]) {
                            case nu:
                                now = +from[attr] + pos * ms * diff[attr];
                                break;
                            case "colour":
                                now = "rgb(" + [
                                    upto255(round(from[attr].r + pos * ms * diff[attr].r)),
                                    upto255(round(from[attr].g + pos * ms * diff[attr].g)),
                                    upto255(round(from[attr].b + pos * ms * diff[attr].b))
                                ].join(",") + ")";
                                break;
                            case "path":
                                now = [];
                                for (var i = 0, ii = from[attr].length; i < ii; i++) {
                                    now[i] = [from[attr][i][0]];
                                    for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        now[i][j] = +from[attr][i][j] + pos * ms * diff[attr][i][j];
                                    }
                                    now[i] = now[i].join(S);
                                }
                                now = now.join(S);
                                break;
                            case "transform":
                                if (diff[attr].real) {
                                    now = [];
                                    for (i = 0, ii = from[attr].length; i < ii; i++) {
                                        now[i] = [from[attr][i][0]];
                                        for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                            now[i][j] = from[attr][i][j] + pos * ms * diff[attr][i][j];
                                        }
                                    }
                                } else {
                                    var get = function (i) {
                                        return +from[attr][i] + pos * ms * diff[attr][i];
                                    };
                                    // now = [["r", get(2), 0, 0], ["t", get(3), get(4)], ["s", get(0), get(1), 0, 0]];
                                    now = [["m", get(0), get(1), get(2), get(3), get(4), get(5)]];
                                }
                                break;
                            case "csv":
                                if (attr == "clip-rect") {
                                    now = [];
                                    i = 4;
                                    while (i--) {
                                        now[i] = +from[attr][i] + pos * ms * diff[attr][i];
                                    }
                                }
                                break;
                            default:
                                var from2 = [][concat](from[attr]);
                                now = [];
                                i = that.paper.customAttributes[attr].length;
                                while (i--) {
                                    now[i] = +from2[i] + pos * ms * diff[attr][i];
                                }
                                break;
                        }
                        set[attr] = now;
                    }
                    that.attr(set);
                    (function (id, that, anim) {
                        setTimeout(function () {
                            eve("raphael.anim.frame." + id, that, anim);
                        });
                    })(that.id, that, e.anim);
                } else {
                    (function(f, el, a) {
                        setTimeout(function() {
                            eve("raphael.anim.frame." + el.id, el, a);
                            eve("raphael.anim.finish." + el.id, el, a);
                            R.is(f, "function") && f.call(el);
                        });
                    })(e.callback, that, e.anim);
                    that.attr(to);
                    animationElements.splice(l--, 1);
                    if (e.repeat > 1 && !e.next) {
                        for (key in to) if (to[has](key)) {
                            init[key] = e.totalOrigin[key];
                        }
                        e.el.attr(init);
                        runAnimation(e.anim, e.el, e.anim.percents[0], null, e.totalOrigin, e.repeat - 1);
                    }
                    if (e.next && !e.stop) {
                        runAnimation(e.anim, e.el, e.next, null, e.totalOrigin, e.repeat);
                    }
                }
            }
            R.svg && that && that.paper && that.paper.safari();
            animationElements.length && requestAnimFrame(animation);
        },
        upto255 = function (color) {
            return color > 255 ? 255 : color < 0 ? 0 : color;
        };
    
    elproto.animateWith = function (el, anim, params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var a = params instanceof Animation ? params : R.animation(params, ms, easing, callback),
            x, y;
        runAnimation(a, element, a.percents[0], null, element.attr());
        for (var i = 0, ii = animationElements.length; i < ii; i++) {
            if (animationElements[i].anim == anim && animationElements[i].el == el) {
                animationElements[ii - 1].start = animationElements[i].start;
                break;
            }
        }
        return element;
        // 
        // 
        // var a = params ? R.animation(params, ms, easing, callback) : anim,
        //     status = element.status(anim);
        // return this.animate(a).status(a, status * anim.ms / a.ms);
    };
    function CubicBezierAtTime(t, p1x, p1y, p2x, p2y, duration) {
        var cx = 3 * p1x,
            bx = 3 * (p2x - p1x) - cx,
            ax = 1 - cx - bx,
            cy = 3 * p1y,
            by = 3 * (p2y - p1y) - cy,
            ay = 1 - cy - by;
        function sampleCurveX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }
        function solve(x, epsilon) {
            var t = solveCurveX(x, epsilon);
            return ((ay * t + by) * t + cy) * t;
        }
        function solveCurveX(x, epsilon) {
            var t0, t1, t2, x2, d2, i;
            for(t2 = x, i = 0; i < 8; i++) {
                x2 = sampleCurveX(t2) - x;
                if (abs(x2) < epsilon) {
                    return t2;
                }
                d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
                if (abs(d2) < 1e-6) {
                    break;
                }
                t2 = t2 - x2 / d2;
            }
            t0 = 0;
            t1 = 1;
            t2 = x;
            if (t2 < t0) {
                return t0;
            }
            if (t2 > t1) {
                return t1;
            }
            while (t0 < t1) {
                x2 = sampleCurveX(t2);
                if (abs(x2 - x) < epsilon) {
                    return t2;
                }
                if (x > x2) {
                    t0 = t2;
                } else {
                    t1 = t2;
                }
                t2 = (t1 - t0) / 2 + t0;
            }
            return t2;
        }
        return solve(t, 1 / (200 * duration));
    }
    elproto.onAnimation = function (f) {
        f ? eve.on("raphael.anim.frame." + this.id, f) : eve.unbind("raphael.anim.frame." + this.id);
        return this;
    };
    function Animation(anim, ms) {
        var percents = [],
            newAnim = {};
        this.ms = ms;
        this.times = 1;
        if (anim) {
            for (var attr in anim) if (anim[has](attr)) {
                newAnim[toFloat(attr)] = anim[attr];
                percents.push(toFloat(attr));
            }
            percents.sort(sortByNumber);
        }
        this.anim = newAnim;
        this.top = percents[percents.length - 1];
        this.percents = percents;
    }
    
    Animation.prototype.delay = function (delay) {
        var a = new Animation(this.anim, this.ms);
        a.times = this.times;
        a.del = +delay || 0;
        return a;
    };
    
    Animation.prototype.repeat = function (times) { 
        var a = new Animation(this.anim, this.ms);
        a.del = this.del;
        a.times = math.floor(mmax(times, 0)) || 1;
        return a;
    };
    function runAnimation(anim, element, percent, status, totalOrigin, times) {
        percent = toFloat(percent);
        var params,
            isInAnim,
            isInAnimSet,
            percents = [],
            next,
            prev,
            timestamp,
            ms = anim.ms,
            from = {},
            to = {},
            diff = {};
        if (status) {
            for (i = 0, ii = animationElements.length; i < ii; i++) {
                var e = animationElements[i];
                if (e.el.id == element.id && e.anim == anim) {
                    if (e.percent != percent) {
                        animationElements.splice(i, 1);
                        isInAnimSet = 1;
                    } else {
                        isInAnim = e;
                    }
                    element.attr(e.totalOrigin);
                    break;
                }
            }
        } else {
            status = +to; // NaN
        }
        for (var i = 0, ii = anim.percents.length; i < ii; i++) {
            if (anim.percents[i] == percent || anim.percents[i] > status * anim.top) {
                percent = anim.percents[i];
                prev = anim.percents[i - 1] || 0;
                ms = ms / anim.top * (percent - prev);
                next = anim.percents[i + 1];
                params = anim.anim[percent];
                break;
            } else if (status) {
                element.attr(anim.anim[anim.percents[i]]);
            }
        }
        if (!params) {
            return;
        }
        if (!isInAnim) {
            for (var attr in params) if (params[has](attr)) {
                if (availableAnimAttrs[has](attr) || element.paper.customAttributes[has](attr)) {
                    from[attr] = element.attr(attr);
                    (from[attr] == null) && (from[attr] = availableAttrs[attr]);
                    to[attr] = params[attr];
                    switch (availableAnimAttrs[attr]) {
                        case nu:
                            diff[attr] = (to[attr] - from[attr]) / ms;
                            break;
                        case "colour":
                            from[attr] = R.getRGB(from[attr]);
                            var toColour = R.getRGB(to[attr]);
                            diff[attr] = {
                                r: (toColour.r - from[attr].r) / ms,
                                g: (toColour.g - from[attr].g) / ms,
                                b: (toColour.b - from[attr].b) / ms
                            };
                            break;
                        case "path":
                            var pathes = path2curve(from[attr], to[attr]),
                                toPath = pathes[1];
                            from[attr] = pathes[0];
                            diff[attr] = [];
                            for (i = 0, ii = from[attr].length; i < ii; i++) {
                                diff[attr][i] = [0];
                                for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                    diff[attr][i][j] = (toPath[i][j] - from[attr][i][j]) / ms;
                                }
                            }
                            break;
                        case "transform":
                            var _ = element._,
                                eq = equaliseTransform(_[attr], to[attr]);
                            if (eq) {
                                from[attr] = eq.from;
                                to[attr] = eq.to;
                                diff[attr] = [];
                                diff[attr].real = true;
                                for (i = 0, ii = from[attr].length; i < ii; i++) {
                                    diff[attr][i] = [from[attr][i][0]];
                                    for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        diff[attr][i][j] = (to[attr][i][j] - from[attr][i][j]) / ms;
                                    }
                                }
                            } else {
                                var m = (element.matrix || new Matrix),
                                    to2 = {
                                        _: {transform: _.transform},
                                        getBBox: function () {
                                            return element.getBBox(1);
                                        }
                                    };
                                from[attr] = [
                                    m.a,
                                    m.b,
                                    m.c,
                                    m.d,
                                    m.e,
                                    m.f
                                ];
                                extractTransform(to2, to[attr]);
                                to[attr] = to2._.transform;
                                diff[attr] = [
                                    (to2.matrix.a - m.a) / ms,
                                    (to2.matrix.b - m.b) / ms,
                                    (to2.matrix.c - m.c) / ms,
                                    (to2.matrix.d - m.d) / ms,
                                    (to2.matrix.e - m.e) / ms,
                                    (to2.matrix.f - m.f) / ms
                                ];
                                // from[attr] = [_.sx, _.sy, _.deg, _.dx, _.dy];
                                // var to2 = {_:{}, getBBox: function () { return element.getBBox(); }};
                                // extractTransform(to2, to[attr]);
                                // diff[attr] = [
                                //     (to2._.sx - _.sx) / ms,
                                //     (to2._.sy - _.sy) / ms,
                                //     (to2._.deg - _.deg) / ms,
                                //     (to2._.dx - _.dx) / ms,
                                //     (to2._.dy - _.dy) / ms
                                // ];
                            }
                            break;
                        case "csv":
                            var values = Str(params[attr])[split](separator),
                                from2 = Str(from[attr])[split](separator);
                            if (attr == "clip-rect") {
                                from[attr] = from2;
                                diff[attr] = [];
                                i = from2.length;
                                while (i--) {
                                    diff[attr][i] = (values[i] - from[attr][i]) / ms;
                                }
                            }
                            to[attr] = values;
                            break;
                        default:
                            values = [][concat](params[attr]);
                            from2 = [][concat](from[attr]);
                            diff[attr] = [];
                            i = element.paper.customAttributes[attr].length;
                            while (i--) {
                                diff[attr][i] = ((values[i] || 0) - (from2[i] || 0)) / ms;
                            }
                            break;
                    }
                }
            }
            var easing = params.easing,
                easyeasy = R.easing_formulas[easing];
            if (!easyeasy) {
                easyeasy = Str(easing).match(bezierrg);
                if (easyeasy && easyeasy.length == 5) {
                    var curve = easyeasy;
                    easyeasy = function (t) {
                        return CubicBezierAtTime(t, +curve[1], +curve[2], +curve[3], +curve[4], ms);
                    };
                } else {
                    easyeasy = pipe;
                }
            }
            timestamp = params.start || anim.start || +new Date;
            e = {
                anim: anim,
                percent: percent,
                timestamp: timestamp,
                start: timestamp + (anim.del || 0),
                status: 0,
                initstatus: status || 0,
                stop: false,
                ms: ms,
                easing: easyeasy,
                from: from,
                diff: diff,
                to: to,
                el: element,
                callback: params.callback,
                prev: prev,
                next: next,
                repeat: times || anim.times,
                origin: element.attr(),
                totalOrigin: totalOrigin
            };
            animationElements.push(e);
            if (status && !isInAnim && !isInAnimSet) {
                e.stop = true;
                e.start = new Date - ms * status;
                if (animationElements.length == 1) {
                    return animation();
                }
            }
            if (isInAnimSet) {
                e.start = new Date - e.ms * status;
            }
            animationElements.length == 1 && requestAnimFrame(animation);
        } else {
            isInAnim.initstatus = status;
            isInAnim.start = new Date - isInAnim.ms * status;
        }
        eve("raphael.anim.start." + element.id, element, anim);
    }
    
    R.animation = function (params, ms, easing, callback) {
        if (params instanceof Animation) {
            return params;
        }
        if (R.is(easing, "function") || !easing) {
            callback = callback || easing || null;
            easing = null;
        }
        params = Object(params);
        ms = +ms || 0;
        var p = {},
            json,
            attr;
        for (attr in params) if (params[has](attr) && toFloat(attr) != attr && toFloat(attr) + "%" != attr) {
            json = true;
            p[attr] = params[attr];
        }
        if (!json) {
            return new Animation(params, ms);
        } else {
            easing && (p.easing = easing);
            callback && (p.callback = callback);
            return new Animation({100: p}, ms);
        }
    };
    
    elproto.animate = function (params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var anim = params instanceof Animation ? params : R.animation(params, ms, easing, callback);
        runAnimation(anim, element, anim.percents[0], null, element.attr());
        return element;
    };
    
    elproto.setTime = function (anim, value) {
        if (anim && value != null) {
            this.status(anim, mmin(value, anim.ms) / anim.ms);
        }
        return this;
    };
    
    elproto.status = function (anim, value) {
        var out = [],
            i = 0,
            len,
            e;
        if (value != null) {
            runAnimation(anim, this, -1, mmin(value, 1));
            return this;
        } else {
            len = animationElements.length;
            for (; i < len; i++) {
                e = animationElements[i];
                if (e.el.id == this.id && (!anim || e.anim == anim)) {
                    if (anim) {
                        return e.status;
                    }
                    out.push({
                        anim: e.anim,
                        status: e.status
                    });
                }
            }
            if (anim) {
                return 0;
            }
            return out;
        }
    };
    
    elproto.pause = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.pause." + this.id, this, animationElements[i].anim) !== false) {
                animationElements[i].paused = true;
            }
        }
        return this;
    };
    
    elproto.resume = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            var e = animationElements[i];
            if (eve("raphael.anim.resume." + this.id, this, e.anim) !== false) {
                delete e.paused;
                this.status(e.anim, e.status);
            }
        }
        return this;
    };
    
    elproto.stop = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.stop." + this.id, this, animationElements[i].anim) !== false) {
                animationElements.splice(i--, 1);
            }
        }
        return this;
    };
    function stopAnimation(paper) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.paper == paper) {
            animationElements.splice(i--, 1);
        }
    }
    eve.on("raphael.remove", stopAnimation);
    eve.on("raphael.clear", stopAnimation);
    elproto.toString = function () {
        return "Rapha\xebl\u2019s object";
    };

    // Set
    var Set = function (items) {
        this.items = [];
        this.length = 0;
        this.type = "set";
        if (items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                if (items[i] && (items[i].constructor == elproto.constructor || items[i].constructor == Set)) {
                    this[this.items.length] = this.items[this.items.length] = items[i];
                    this.length++;
                }
            }
        }
    },
    setproto = Set.prototype;
    
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            item = arguments[i];
            if (item && (item.constructor == elproto.constructor || item.constructor == Set)) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    for (var method in elproto) if (elproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname][apply](el, arg);
                });
            };
        })(method);
    }
    setproto.attr = function (name, value) {
        if (name && R.is(name, array) && R.is(name[0], "object")) {
            for (var j = 0, jj = name.length; j < jj; j++) {
                this.items[j].attr(name[j]);
            }
        } else {
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                this.items[i].attr(name, value);
            }
        }
        return this;
    };
    
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; i++) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; i++) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
    };
    setproto.animate = function (params, ms, easing, callback) {
        (R.is(easing, "function") || !easing) && (callback = easing || null);
        var len = this.items.length,
            i = len,
            item,
            set = this,
            collector;
        if (!len) {
            return this;
        }
        callback && (collector = function () {
            !--len && callback.call(set);
        });
        easing = R.is(easing, string) ? easing : collector;
        var anim = R.animation(params, ms, easing, collector);
        item = this.items[--i].animate(anim);
        while (i--) {
            this.items[i] && !this.items[i].removed && this.items[i].animateWith(item, anim, anim);
        }
        return this;
    };
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    // FREEGROUP FIX: Adding "isWithoutTransform" to the function and redirect them to the elements
    setproto.getBBox = function (isWithoutTransform) {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            var box = this.items[i].getBBox(isWithoutTransform);
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
        }
        x = mmin[apply](0, x);
        y = mmin[apply](0, y);
        x2 = mmax[apply](0, x2);
        y2 = mmax[apply](0, y2);
        return {
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y
        };
    };
    setproto.clone = function (s) {
        s = new Set;
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Rapha\xebl\u2018s set";
    };

    
    R.registerFont = function (font) {
        if (!font.face) {
            return font;
        }
        this.fonts = this.fonts || {};
        var fontcopy = {
                w: font.w,
                face: {},
                glyphs: {}
            },
            family = font.face["font-family"];
        for (var prop in font.face) if (font.face[has](prop)) {
            fontcopy.face[prop] = font.face[prop];
        }
        if (this.fonts[family]) {
            this.fonts[family].push(fontcopy);
        } else {
            this.fonts[family] = [fontcopy];
        }
        if (!font.svg) {
            fontcopy.face["units-per-em"] = toInt(font.face["units-per-em"], 10);
            for (var glyph in font.glyphs) if (font.glyphs[has](glyph)) {
                var path = font.glyphs[glyph];
                fontcopy.glyphs[glyph] = {
                    w: path.w,
                    k: {},
                    d: path.d && "M" + path.d.replace(/[mlcxtrv]/g, function (command) {
                            return {l: "L", c: "C", x: "z", t: "m", r: "l", v: "c"}[command] || "M";
                        }) + "z"
                };
                if (path.k) {
                    for (var k in path.k) if (path[has](k)) {
                        fontcopy.glyphs[glyph].k[k] = path.k[k];
                    }
                }
            }
        }
        return font;
    };
    
    paperproto.getFont = function (family, weight, style, stretch) {
        stretch = stretch || "normal";
        style = style || "normal";
        weight = +weight || {normal: 400, bold: 700, lighter: 300, bolder: 800}[weight] || 400;
        if (!R.fonts) {
            return;
        }
        var font = R.fonts[family];
        if (!font) {
            var name = new RegExp("(^|\\s)" + family.replace(/[^\w\d\s+!~.:_-]/g, E) + "(\\s|$)", "i");
            for (var fontName in R.fonts) if (R.fonts[has](fontName)) {
                if (name.test(fontName)) {
                    font = R.fonts[fontName];
                    break;
                }
            }
        }
        var thefont;
        if (font) {
            for (var i = 0, ii = font.length; i < ii; i++) {
                thefont = font[i];
                if (thefont.face["font-weight"] == weight && (thefont.face["font-style"] == style || !thefont.face["font-style"]) && thefont.face["font-stretch"] == stretch) {
                    break;
                }
            }
        }
        return thefont;
    };
    
    paperproto.print = function (x, y, string, font, size, origin, letter_spacing) {
        origin = origin || "middle"; // baseline|middle
        letter_spacing = mmax(mmin(letter_spacing || 0, 1), -1);
        var letters = Str(string)[split](E),
            shift = 0,
            notfirst = 0,
            path = E,
            scale;
        R.is(font, string) && (font = this.getFont(font));
        if (font) {
            scale = (size || 16) / font.face["units-per-em"];
            var bb = font.face.bbox[split](separator),
                top = +bb[0],
                lineHeight = bb[3] - bb[1],
                shifty = 0,
                height = +bb[1] + (origin == "baseline" ? lineHeight + (+font.face.descent) : lineHeight / 2);
            for (var i = 0, ii = letters.length; i < ii; i++) {
                if (letters[i] == "\n") {
                    shift = 0;
                    curr = 0;
                    notfirst = 0;
                    shifty += lineHeight;
                } else {
                    var prev = notfirst && font.glyphs[letters[i - 1]] || {},
                        curr = font.glyphs[letters[i]];
                    shift += notfirst ? (prev.w || font.w) + (prev.k && prev.k[letters[i]] || 0) + (font.w * letter_spacing) : 0;
                    notfirst = 1;
                }
                if (curr && curr.d) {
                    path += R.transformPath(curr.d, ["t", shift * scale, shifty * scale, "s", scale, scale, top, height, "t", (x - top) / scale, (y - height) / scale]);
                }
            }
        }
        return this.path(path).attr({
            fill: "#000",
            stroke: "none"
        });
    };

    
    paperproto.add = function (json) {
        if (R.is(json, "array")) {
            var res = this.set(),
                i = 0,
                ii = json.length,
                j;
            for (; i < ii; i++) {
                j = json[i] || {};
                elements[has](j.type) && res.push(this[j.type]().attr(j));
            }
        }
        return res;
    };

    
    R.format = function (token, params) {
        var args = R.is(params, array) ? [0][concat](params) : arguments;
        token && R.is(token, string) && args.length - 1 && (token = token.replace(formatrg, function (str, i) {
            return args[++i] == null ? E : args[i];
        }));
        return token || E;
    };
    
    R.fullfill = (function () {
        var tokenRegex = /\{([^\}]+)\}/g,
            objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
            replacer = function (all, key, obj) {
                var res = obj;
                key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                    name = name || quotedName;
                    if (res) {
                        if (name in res) {
                            res = res[name];
                        }
                        typeof res == "function" && isFunc && (res = res());
                    }
                });
                res = (res == null || res == obj ? all : res) + "";
                return res;
            };
        return function (str, obj) {
            return String(str).replace(tokenRegex, function (all, key) {
                return replacer(all, key, obj);
            });
        };
    })();
    
    R.ninja = function () {
        oldRaphael.was ? (g.win.Raphael = oldRaphael.is) : delete Raphael;
        return R;
    };
    
    R.st = setproto;
    // Firefox <3.6 fix: http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
    (function (doc, loaded, f) {
        if (doc.readyState == null && doc.addEventListener){
            doc.addEventListener(loaded, f = function () {
                doc.removeEventListener(loaded, f, false);
                doc.readyState = "complete";
            }, false);
            doc.readyState = "loading";
        }
        function isLoaded() {
            (/in/).test(doc.readyState) ? setTimeout(isLoaded, 9) : R.eve("raphael.DOMload");
        }
        isLoaded();
    })(document, "DOMContentLoaded");

    oldRaphael.was ? (g.win.Raphael = R) : (Raphael = R);
    
    eve.on("raphael.DOMload", function () {
        loaded = true;
    });
})();


// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ SVG Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\
window.Raphael.svg && function (R) {
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        toInt = parseInt,
        math = Math,
        mmax = math.max,
        abs = math.abs,
        pow = math.pow,
        separator = /[, ]+/,
        eve = R.eve,
        E = "",
        S = " ";
    var xlink = "http://www.w3.org/1999/xlink",
        markers = {
            block: "M5,0 0,2.5 5,5z",
            classic: "M5,0 0,2.5 5,5 3.5,3 3.5,2z",
            diamond: "M2.5,0 5,2.5 2.5,5 0,2.5z",
            open: "M6,1 1,3.5 6,6",
            oval: "M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"
        },
        markerCounter = {};
    R.toString = function () {
        return  "Your browser supports SVG.\nYou are running Rapha\xebl " + this.version;
    };
    var $ = function (el, attr) {
        if (attr) {
            if (typeof el == "string") {
                el = $(el);
            }
            for (var key in attr) if (attr[has](key)) {
                if (key.substring(0, 6) == "xlink:") {
                    el.setAttributeNS(xlink, key.substring(6), Str(attr[key]));
                } else {
                    el.setAttribute(key, Str(attr[key]));
                }
            }
        } else {
            el = R._g.doc.createElementNS("http://www.w3.org/2000/svg", el);
            el.style && (el.style.webkitTapHighlightColor = "rgba(0,0,0,0)");
        }
        return el;
    },
    addGradientFill = function (element, gradient) {
        var type = "linear",
            id = element.id + gradient,
            fx = .5, fy = .5,
            o = element.node,
            SVG = element.paper,
            s = o.style,
            el = R._g.doc.getElementById(id);
        if (!el) {
            gradient = Str(gradient).replace(R._radial_gradient, function (all, _fx, _fy) {
                type = "radial";
                if (_fx && _fy) {
                    fx = toFloat(_fx);
                    fy = toFloat(_fy);
                    var dir = ((fy > .5) * 2 - 1);
                    pow(fx - .5, 2) + pow(fy - .5, 2) > .25 &&
                        (fy = math.sqrt(.25 - pow(fx - .5, 2)) * dir + .5) &&
                        fy != .5 &&
                        (fy = fy.toFixed(5) - 1e-5 * dir);
                }
                return E;
            });
            gradient = gradient.split(/\s*\-\s*/);
            if (type == "linear") {
                var angle = gradient.shift();
                angle = -toFloat(angle);
                if (isNaN(angle)) {
                    return null;
                }
                var vector = [0, 0, math.cos(R.rad(angle)), math.sin(R.rad(angle))],
                    max = 1 / (mmax(abs(vector[2]), abs(vector[3])) || 1);
                vector[2] *= max;
                vector[3] *= max;
                if (vector[2] < 0) {
                    vector[0] = -vector[2];
                    vector[2] = 0;
                }
                if (vector[3] < 0) {
                    vector[1] = -vector[3];
                    vector[3] = 0;
                }
            }
            var dots = R._parseDots(gradient);
            if (!dots) {
                return null;
            }
            id = id.replace(/[\(\)\s,\xb0#]/g, "_");
            
            if (element.gradient && id != element.gradient.id) {
                SVG.defs.removeChild(element.gradient);
                delete element.gradient;
            }

            if (!element.gradient) {
                el = $(type + "Gradient", {id: id});
                element.gradient = el;
                $(el, type == "radial" ? {
                    fx: fx,
                    fy: fy
                } : {
                    x1: vector[0],
                    y1: vector[1],
                    x2: vector[2],
                    y2: vector[3],
                    gradientTransform: element.matrix.invert()
                });
                SVG.defs.appendChild(el);
                for (var i = 0, ii = dots.length; i < ii; i++) {
                    el.appendChild($("stop", {
                        offset: dots[i].offset ? dots[i].offset : i ? "100%" : "0%",
                        "stop-color": dots[i].color || "#fff"
                    }));
                }
            }
        }
        $(o, {
            fill: "url(#" + id + ")",
            opacity: 1,
            "fill-opacity": 1
        });
        s.fill = E;
        s.opacity = 1;
        s.fillOpacity = 1;
        return 1;
    },
    updatePosition = function (o) {
        var bbox = o.getBBox(1);
        $(o.pattern, {patternTransform: o.matrix.invert() + " translate(" + bbox.x + "," + bbox.y + ")"});
    },
    addArrow = function (o, value, isEnd) {
        if (o.type == "path") {
            var values = Str(value).toLowerCase().split("-"),
                p = o.paper,
                se = isEnd ? "end" : "start",
                node = o.node,
                attrs = o.attrs,
                stroke = attrs["stroke-width"],
                i = values.length,
                type = "classic",
                from,
                to,
                dx,
                refX,
                attr,
                w = 3,
                h = 3,
                t = 5;
            while (i--) {
                switch (values[i]) {
                    case "block":
                    case "classic":
                    case "oval":
                    case "diamond":
                    case "open":
                    case "none":
                        type = values[i];
                        break;
                    case "wide": h = 5; break;
                    case "narrow": h = 2; break;
                    case "long": w = 5; break;
                    case "short": w = 2; break;
                }
            }
            if (type == "open") {
                w += 2;
                h += 2;
                t += 2;
                dx = 1;
                refX = isEnd ? 4 : 1;
                attr = {
                    fill: "none",
                    stroke: attrs.stroke
                };
            } else {
                refX = dx = w / 2;
                attr = {
                    fill: attrs.stroke,
                    stroke: "none"
                };
            }
            if (o._.arrows) {
                if (isEnd) {
                    o._.arrows.endPath && markerCounter[o._.arrows.endPath]--;
                    o._.arrows.endMarker && markerCounter[o._.arrows.endMarker]--;
                } else {
                    o._.arrows.startPath && markerCounter[o._.arrows.startPath]--;
                    o._.arrows.startMarker && markerCounter[o._.arrows.startMarker]--;
                }
            } else {
                o._.arrows = {};
            }
            if (type != "none") {
                var pathId = "raphael-marker-" + type,
                    markerId = "raphael-marker-" + se + type + w + h;
                if (!R._g.doc.getElementById(pathId)) {
                    p.defs.appendChild($($("path"), {
                        "stroke-linecap": "round",
                        d: markers[type],
                        id: pathId
                    }));
                    markerCounter[pathId] = 1;
                } else {
                    markerCounter[pathId]++;
                }
                var marker = R._g.doc.getElementById(markerId),
                    use;
                if (!marker) {
                    marker = $($("marker"), {
                        id: markerId,
                        markerHeight: h,
                        markerWidth: w,
                        orient: "auto",
                        refX: refX,
                        refY: h / 2
                    });
                    use = $($("use"), {
                        "xlink:href": "#" + pathId,
                        transform: (isEnd ? "rotate(180 " + w / 2 + " " + h / 2 + ") " : E) + "scale(" + w / t + "," + h / t + ")",
                        "stroke-width": (1 / ((w / t + h / t) / 2)).toFixed(4)
                    });
                    marker.appendChild(use);
                    p.defs.appendChild(marker);
                    markerCounter[markerId] = 1;
                } else {
                    markerCounter[markerId]++;
                    use = marker.getElementsByTagName("use")[0];
                }
                $(use, attr);
                var delta = dx * (type != "diamond" && type != "oval");
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - delta * stroke;
                } else {
                    from = delta * stroke;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                attr = {};
                attr["marker-" + se] = "url(#" + markerId + ")";
                if (to || from) {
                    attr.d = Raphael.getSubpath(attrs.path, from, to);
                }
                $(node, attr);
                o._.arrows[se + "Path"] = pathId;
                o._.arrows[se + "Marker"] = markerId;
                o._.arrows[se + "dx"] = delta;
                o._.arrows[se + "Type"] = type;
                o._.arrows[se + "String"] = value;
            } else {
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - from;
                } else {
                    from = 0;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                o._.arrows[se + "Path"] && $(node, {d: Raphael.getSubpath(attrs.path, from, to)});
                delete o._.arrows[se + "Path"];
                delete o._.arrows[se + "Marker"];
                delete o._.arrows[se + "dx"];
                delete o._.arrows[se + "Type"];
                delete o._.arrows[se + "String"];
            }
            for (attr in markerCounter) if (markerCounter[has](attr) && !markerCounter[attr]) {
                var item = R._g.doc.getElementById(attr);
                item && item.parentNode.removeChild(item);
            }
        }
    },
    dasharray = {
        "": [0],
        "none": [0],
        "-": [3, 1],
        ".": [1, 1],
        "-.": [3, 1, 1, 1],
        "-..": [3, 1, 1, 1, 1, 1],
        ". ": [1, 3],
        "- ": [4, 3],
        "--": [8, 3],
        "- .": [4, 3, 1, 3],
        "--.": [8, 3, 1, 3],
        "--..": [8, 3, 1, 3, 1, 3]
    },
    addDashes = function (o, value, params) {
        value = dasharray[Str(value).toLowerCase()];
        if (value) {
            var width = o.attrs["stroke-width"] || "1",
                butt = {round: width, square: width, butt: 0}[o.attrs["stroke-linecap"] || params["stroke-linecap"]] || 0,
                dashes = [],
                i = value.length;
            while (i--) {
                dashes[i] = value[i] * width + ((i % 2) ? 1 : -1) * butt;
            }
            $(o.node, {"stroke-dasharray": dashes.join(",")});
        }
    },
    setFillAndStroke = function (o, params) {
        var node = o.node,
            attrs = o.attrs,
            vis = node.style.visibility;
        node.style.visibility = "hidden";
        for (var att in params) {
            if (params[has](att)) {
                if (!R._availableAttrs[has](att)) {
                    continue;
                }
                var value = params[att];
                attrs[att] = value;
                switch (att) {
                    case "blur":
                        o.blur(value);
                        break;
                    case "href":
                    case "title":
                    case "target":
                        var pn = node.parentNode;
                        if (pn.tagName.toLowerCase() != "a") {
                            var hl = $("a");
                            pn.insertBefore(hl, node);
                            hl.appendChild(node);
                            pn = hl;
                        }
                        if (att == "target") {
                            pn.setAttributeNS(xlink, "show", value == "blank" ? "new" : value);
                        } else {
                            pn.setAttributeNS(xlink, att, value);
                        }
                        break;
                    case "cursor":
                        node.style.cursor = value;
                        break;
                    case "transform":
                        o.transform(value);
                        break;
                    case "arrow-start":
                        addArrow(o, value);
                        break;
                    case "arrow-end":
                        addArrow(o, value, 1);
                        break;
                    case "clip-rect":
                        var rect = Str(value).split(separator);
                        if (rect.length == 4) {
                            o.clip && o.clip.parentNode.parentNode.removeChild(o.clip.parentNode);
                            var el = $("clipPath"),
                                rc = $("rect");
                            el.id = R.createUUID();
                            $(rc, {
                                x: rect[0],
                                y: rect[1],
                                width: rect[2],
                                height: rect[3]
                            });
                            el.appendChild(rc);
                            o.paper.defs.appendChild(el);
                            $(node, {"clip-path": "url(#" + el.id + ")"});
                            o.clip = rc;
                        }
                        if (!value) {
                            var path = node.getAttribute("clip-path");
                            if (path) {
                                var clip = R._g.doc.getElementById(path.replace(/(^url\(#|\)$)/g, E));
                                clip && clip.parentNode.removeChild(clip);
                                $(node, {"clip-path": E});
                                delete o.clip;
                            }
                        }
                    break;
                    case "path":
                        if (o.type == "path") {
                            $(node, {d: value ? attrs.path = R._pathToAbsolute(value) : "M0,0"});
                            o._.dirty = 1;
                            if (o._.arrows) {
                                "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                            }
                        }
                        break;
                    case "width":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fx) {
                            att = "x";
                            value = attrs.x;
                        } else {
                            break;
                        }
                    case "x":
                        if (attrs.fx) {
                            value = -attrs.x - (attrs.width || 0);
                        }
                    case "rx":
                        if (att == "rx" && o.type == "rect") {
                            break;
                        }
                    case "cx":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "height":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fy) {
                            att = "y";
                            value = attrs.y;
                        } else {
                            break;
                        }
                    case "y":
                        if (attrs.fy) {
                            value = -attrs.y - (attrs.height || 0);
                        }
                    case "ry":
                        if (att == "ry" && o.type == "rect") {
                            break;
                        }
                    case "cy":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "r":
                        if (o.type == "rect") {
                            $(node, {rx: value, ry: value});
                        } else {
                            node.setAttribute(att, value);
                        }
                        o._.dirty = 1;
                        break;
                    case "src":
                        if (o.type == "image") {
                            node.setAttributeNS(xlink, "href", value);
                        }
                        break;
                    case "stroke-width":
                        if (o._.sx != 1 || o._.sy != 1) {
                            value /= mmax(abs(o._.sx), abs(o._.sy)) || 1;
                        }
                        if (o.paper._vbSize) {
                            value *= o.paper._vbSize;
                        }
                        node.setAttribute(att, value);
                        if (attrs["stroke-dasharray"]) {
                            addDashes(o, attrs["stroke-dasharray"], params);
                        }
                        if (o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "stroke-dasharray":
                        addDashes(o, value, params);
                        break;
                    case "fill":
                        var isURL = Str(value).match(R._ISURL);
                        if (isURL) {
                            el = $("pattern");
                            var ig = $("image");
                            el.id = R.createUUID();
                            $(el, {x: 0, y: 0, patternUnits: "userSpaceOnUse", height: 1, width: 1});
                            $(ig, {x: 0, y: 0, "xlink:href": isURL[1]});
                            el.appendChild(ig);

                            (function (el) {
                                R._preload(isURL[1], function () {
                                    var w = this.offsetWidth,
                                        h = this.offsetHeight;
                                    $(el, {width: w, height: h});
                                    $(ig, {width: w, height: h});
                                    o.paper.safari();
                                });
                            })(el);
                            o.paper.defs.appendChild(el);
                            $(node, {fill: "url(#" + el.id + ")"});
                            o.pattern = el;
                            o.pattern && updatePosition(o);
                            break;
                        }
                        var clr = R.getRGB(value);
                        if (!clr.error) {
                            delete params.gradient;
                            delete attrs.gradient;
                            !R.is(attrs.opacity, "undefined") &&
                                R.is(params.opacity, "undefined") &&
                                $(node, {opacity: attrs.opacity});
                            !R.is(attrs["fill-opacity"], "undefined") &&
                                R.is(params["fill-opacity"], "undefined") &&
                                $(node, {"fill-opacity": attrs["fill-opacity"]});
                        } else if ((o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value)) {
                            if ("opacity" in attrs || "fill-opacity" in attrs) {
                                var gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                                if (gradient) {
                                    var stops = gradient.getElementsByTagName("stop");
                                    $(stops[stops.length - 1], {"stop-opacity": ("opacity" in attrs ? attrs.opacity : 1) * ("fill-opacity" in attrs ? attrs["fill-opacity"] : 1)});
                                }
                            }
                            attrs.gradient = value;
                            attrs.fill = "none";
                            break;
                        }
                        clr[has]("opacity") && $(node, {"fill-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                    case "stroke":
                        clr = R.getRGB(value);
                        node.setAttribute(att, clr.hex);
                        att == "stroke" && clr[has]("opacity") && $(node, {"stroke-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                        if (att == "stroke" && o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "gradient":
                        (o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value);
                        break;
                    case "opacity":
                        if (attrs.gradient && !attrs[has]("stroke-opacity")) {
                            $(node, {"stroke-opacity": value > 1 ? value / 100 : value});
                        }
                        // fall
                    case "fill-opacity":
                        if (attrs.gradient) {
                            gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                            if (gradient) {
                                stops = gradient.getElementsByTagName("stop");
                                $(stops[stops.length - 1], {"stop-opacity": value});
                            }
                            break;
                        }
                    default:
                        att == "font-size" && (value = toInt(value, 10) + "px");
                        var cssrule = att.replace(/(\-.)/g, function (w) {
                            return w.substring(1).toUpperCase();
                        });
                        node.style[cssrule] = value;
                        o._.dirty = 1;
                        node.setAttribute(att, value);
                        break;
                }
            }
        }

        tuneText(o, params);
        node.style.visibility = vis;
    },
    leading = 1.2,
    tuneText = function (el, params) {
        if (el.type != "text" || !(params[has]("text") || params[has]("font") || params[has]("font-size") || params[has]("x") || params[has]("y"))) {
            return;
        }
        var a = el.attrs,
            node = el.node,
            fontSize = node.firstChild ? toInt(R._g.doc.defaultView.getComputedStyle(node.firstChild, E).getPropertyValue("font-size"), 10) : 10;

        if (params[has]("text")) {
            a.text = params.text;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var texts = Str(params.text).split("\n"),
                tspans = [],
                tspan;
            for (var i = 0, ii = texts.length; i < ii; i++) {
                tspan = $("tspan");
                i && $(tspan, {dy: fontSize * leading, x: a.x});
                tspan.appendChild(R._g.doc.createTextNode(texts[i]));
                node.appendChild(tspan);
                tspans[i] = tspan;
            }
        } else {
            tspans = node.getElementsByTagName("tspan");
            for (i = 0, ii = tspans.length; i < ii; i++) if (i) {
                $(tspans[i], {dy: fontSize * leading, x: a.x});
            } else {
                $(tspans[0], {dy: 0});
            }
        }
        $(node, {x: a.x, y: a.y});
        el._.dirty = 1;
        var bb = el._getBBox(),
            dif = a.y - (bb.y + bb.height / 2);
        dif && R.is(dif, "finite") && $(tspans[0], {dy: dif});
    },
    Element = function (node, svg) {
        var X = 0,
            Y = 0;
        
        this[0] = this.node = node;
        
        node.raphael = true;
        
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.matrix = R.matrix();
        this.realPath = null;
        
        this.paper = svg;
        this.attrs = this.attrs || {};
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            deg: 0,
            dx: 0,
            dy: 0,
            dirty: 1
        };
        !svg.bottom && (svg.bottom = this);
        
        this.prev = svg.top;
        svg.top && (svg.top.next = this);
        svg.top = this;
        
        this.next = null;
    },
    elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;

    R._engine.path = function (pathString, SVG) {
        var el = $("path");
        SVG.canvas && SVG.canvas.appendChild(el);
        var p = new Element(el, SVG);
        p.type = "path";
        setFillAndStroke(p, {
            fill: "none",
            stroke: "#000",
            path: pathString
        });
        return p;
    };
    
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        return this;
    };
    
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    
    elproto.transform = function (tstr) {
        var _ = this._;
        if (tstr == null) {
            return _.transform;
        }
        R._extractTransform(this, tstr);

        this.clip && $(this.clip, {transform: this.matrix.invert()});
        this.pattern && updatePosition(this);
        this.node && $(this.node, {transform: this.matrix});
    
        if (_.sx != 1 || _.sy != 1) {
            var sw = this.attrs[has]("stroke-width") ? this.attrs["stroke-width"] : 1;
            this.attr({"stroke-width": sw});
        }

        return this;
    };
    
    elproto.hide = function () {
        !this.removed && this.paper.safari(this.node.style.display = "none");
        return this;
    };
    
    elproto.show = function () {
        !this.removed && this.paper.safari(this.node.style.display = "");
        return this;
    };
    
    elproto.remove = function () {
        if (this.removed || !this.node.parentNode) {
            return;
        }
        var paper = this.paper;
        paper.__set__ && paper.__set__.exclude(this);
        eve.unbind("raphael.*.*." + this.id);
        if (this.gradient) {
            paper.defs.removeChild(this.gradient);
        }
        R._tear(this, paper);
        if (this.node.parentNode.tagName.toLowerCase() == "a") {
            this.node.parentNode.parentNode.removeChild(this.node.parentNode);
        } else {
            this.node.parentNode.removeChild(this.node);
        }
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto._getBBox = function () {
        if (this.node.style.display == "none") {
            this.show();
            var hide = true;
        }
        var bbox = {};
        try {
            bbox = this.node.getBBox();
        } catch(e) {
            // Firefox 3.0.x plays badly here
        } finally {
            bbox = bbox || {};
        }
        hide && this.hide();
        return bbox;
    };
    
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == "fill" && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            if (name == "transform") {
                return this._.transform;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        if (value != null) {
            var params = {};
            params[name] = value;
        } else if (name != null && R.is(name, "object")) {
            params = name;
        }
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
            var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
            this.attrs[key] = params[key];
            for (var subkey in par) if (par[has](subkey)) {
                params[subkey] = par[subkey];
            }
        }
        setFillAndStroke(this, params);
        return this;
    };
    
    elproto.toFront = function () {
        if (this.removed) {
            return this;
        }
        if (this.node.parentNode.tagName.toLowerCase() == "a") {
            this.node.parentNode.parentNode.appendChild(this.node.parentNode);
        } else {
            this.node.parentNode.appendChild(this.node);
        }
        var svg = this.paper;
        svg.top != this && R._tofront(this, svg);
        return this;
    };
    
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        var parent = this.node.parentNode;
        if (parent.tagName.toLowerCase() == "a") {
            parent.parentNode.insertBefore(this.node.parentNode, this.node.parentNode.parentNode.firstChild); 
        } else if (parent.firstChild != this.node) {
            parent.insertBefore(this.node, this.node.parentNode.firstChild);
        }
        R._toback(this, this.paper);
        var svg = this.paper;
        return this;
    };
    
    elproto.insertAfter = function (element) {
        if (this.removed) {
            return this;
        }
        var node = element.node || element[element.length - 1].node;
        if (node.nextSibling) {
            node.parentNode.insertBefore(this.node, node.nextSibling);
        } else {
            node.parentNode.appendChild(this.node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    
    elproto.insertBefore = function (element) {
        if (this.removed) {
            return this;
        }
        var node = element.node || element[0].node;
        node.parentNode.insertBefore(this.node, node);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        // Experimental. No Safari support. Use it on your own risk.
        var t = this;
        if (+size !== 0) {
            var fltr = $("filter"),
                blur = $("feGaussianBlur");
            t.attrs.blur = size;
            fltr.id = R.createUUID();
            $(blur, {stdDeviation: +size || 1.5});
            fltr.appendChild(blur);
            t.paper.defs.appendChild(fltr);
            t._blur = fltr;
            $(t.node, {filter: "url(#" + fltr.id + ")"});
        } else {
            if (t._blur) {
                t._blur.parentNode.removeChild(t._blur);
                delete t._blur;
                delete t.attrs.blur;
            }
            t.node.removeAttribute("filter");
        }
    };
    R._engine.circle = function (svg, x, y, r) {
        var el = $("circle");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, r: r, fill: "none", stroke: "#000"};
        res.type = "circle";
        $(el, res.attrs);
        return res;
    };
    R._engine.rect = function (svg, x, y, w, h, r) {
        var el = $("rect");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, r: r || 0, rx: r || 0, ry: r || 0, fill: "none", stroke: "#000"};
        res.type = "rect";
        $(el, res.attrs);
        return res;
    };
    R._engine.ellipse = function (svg, x, y, rx, ry) {
        var el = $("ellipse");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, rx: rx, ry: ry, fill: "none", stroke: "#000"};
        res.type = "ellipse";
        $(el, res.attrs);
        return res;
    };
    R._engine.image = function (svg, src, x, y, w, h) {
        var el = $("image");
        $(el, {x: x, y: y, width: w, height: h, preserveAspectRatio: "none"});
        el.setAttributeNS(xlink, "href", src);
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, src: src};
        res.type = "image";
        return res;
    };
    R._engine.text = function (svg, x, y, text) {
        var el = $("text");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {
            x: x,
            y: y,
            "text-anchor": "middle",
            text: text,
            font: R._availableAttrs.font,
            stroke: "none",
            fill: "#000"
        };
        res.type = "text";
        setFillAndStroke(res, res.attrs);
        return res;
    };
    R._engine.setSize = function (width, height) {
        this.width = width || this.width;
        this.height = height || this.height;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        if (this._viewBox) {
            this.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con && con.container,
            x = con.x,
            y = con.y,
            width = con.width,
            height = con.height;
        if (!container) {
            throw new Error("SVG container not found.");
        }
        var cnvs = $("svg"),
            css = "overflow:hidden;",
            isFloating;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        $(cnvs, {
            height: height,
            version: 1.1,
            width: width,
            xmlns: "http://www.w3.org/2000/svg"
        });
        if (container == 1) {
            cnvs.style.cssText = css + "position:absolute;left:" + x + "px;top:" + y + "px";
            R._g.doc.body.appendChild(cnvs);
            isFloating = 1;
        } else {
            cnvs.style.cssText = css + "position:relative";
            if (container.firstChild) {
                container.insertBefore(cnvs, container.firstChild);
            } else {
                container.appendChild(cnvs);
            }
        }
        container = new R._Paper;
        container.width = width;
        container.height = height;
        container.canvas = cnvs;
        container.clear();
        container._left = container._top = 0;
        isFloating && (container.renderfix = function () {});
        container.renderfix();
        return container;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var size = mmax(w / this.width, h / this.height),
            top = this.top,
            aspectRatio = fit ? "meet" : "xMinYMin",
            vb,
            sw;
        if (x == null) {
            if (this._vbSize) {
                size = 1;
            }
            delete this._vbSize;
            vb = "0 0 " + this.width + S + this.height;
        } else {
            this._vbSize = size;
            vb = x + S + y + S + w + S + h;
        }
        $(this.canvas, {
            viewBox: vb,
            preserveAspectRatio: aspectRatio
        });
        while (size && top) {
            sw = "stroke-width" in top.attrs ? top.attrs["stroke-width"] : 1;
            top.attr({"stroke-width": sw});
            top._.dirty = 1;
            top._.dirtyT = 1;
            top = top.prev;
        }
        this._viewBox = [x, y, w, h, !!fit];
        return this;
    };
    
    R.prototype.renderfix = function () {
        var cnvs = this.canvas,
            s = cnvs.style,
            pos;
        try {
            pos = cnvs.getScreenCTM() || cnvs.createSVGMatrix();
        } catch (e) {
            pos = cnvs.createSVGMatrix();
        }
        var left = -pos.e % 1,
            top = -pos.f % 1;
        if (left || top) {
            if (left) {
                this._left = (this._left + left) % 1;
                s.left = this._left + "px";
            }
            if (top) {
                this._top = (this._top + top) % 1;
                s.top = this._top + "px";
            }
        }
    };
    
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        var c = this.canvas;
        while (c.firstChild) {
            c.removeChild(c.firstChild);
        }
        this.bottom = this.top = null;
        (this.desc = $("desc")).appendChild(R._g.doc.createTextNode("Created with Rapha\xebl " + R.version));
        c.appendChild(this.desc);
        c.appendChild(this.defs = $("defs"));
    };
    
    R.prototype.remove = function () {
        eve("raphael.remove", this);
        this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
    };
    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
}(window.Raphael);

// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ VML Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\
window.Raphael.vml && function (R) {
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        math = Math,
        round = math.round,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        fillString = "fill",
        separator = /[, ]+/,
        eve = R.eve,
        ms = " progid:DXImageTransform.Microsoft",
        S = " ",
        E = "",
        map = {M: "m", L: "l", C: "c", Z: "x", m: "t", l: "r", c: "v", z: "x"},
        bites = /([clmz]),?([^clmz]*)/gi,
        blurregexp = / progid:\S+Blur\([^\)]+\)/g,
        val = /-?[^,\s-]+/g,
        cssDot = "position:absolute;left:0;top:0;width:1px;height:1px",
        zoom = 21600,
        pathTypes = {path: 1, rect: 1, image: 1},
        ovalTypes = {circle: 1, ellipse: 1},
        path2vml = function (path) {
            var total =  /[ahqstv]/ig,
                command = R._pathToAbsolute;
            Str(path).match(total) && (command = R._path2curve);
            total = /[clmz]/g;
            if (command == R._pathToAbsolute && !Str(path).match(total)) {
                var res = Str(path).replace(bites, function (all, command, args) {
                    var vals = [],
                        isMove = command.toLowerCase() == "m",
                        res = map[command];
                    args.replace(val, function (value) {
                        if (isMove && vals.length == 2) {
                            res += vals + map[command == "m" ? "l" : "L"];
                            vals = [];
                        }
                        vals.push(round(value * zoom));
                    });
                    return res + vals;
                });
                return res;
            }
            var pa = command(path), p, r;
            res = [];
            for (var i = 0, ii = pa.length; i < ii; i++) {
                p = pa[i];
                r = pa[i][0].toLowerCase();
                r == "z" && (r = "x");
                for (var j = 1, jj = p.length; j < jj; j++) {
                    r += round(p[j] * zoom) + (j != jj - 1 ? "," : E);
                }
                res.push(r);
            }
            return res.join(S);
        },
        compensation = function (deg, dx, dy) {
            var m = R.matrix();
            m.rotate(-deg, .5, .5);
            return {
                dx: m.x(dx, dy),
                dy: m.y(dx, dy)
            };
        },
        setCoords = function (p, sx, sy, dx, dy, deg) {
            var _ = p._,
                m = p.matrix,
                fillpos = _.fillpos,
                o = p.node,
                s = o.style,
                y = 1,
                flip = "",
                dxdy,
                kx = zoom / sx,
                ky = zoom / sy;
            s.visibility = "hidden";
            if (!sx || !sy) {
                return;
            }
            o.coordsize = abs(kx) + S + abs(ky);
            s.rotation = deg * (sx * sy < 0 ? -1 : 1);
            if (deg) {
                var c = compensation(deg, dx, dy);
                dx = c.dx;
                dy = c.dy;
            }
            sx < 0 && (flip += "x");
            sy < 0 && (flip += " y") && (y = -1);
            s.flip = flip;
            o.coordorigin = (dx * -kx) + S + (dy * -ky);
            if (fillpos || _.fillsize) {
                var fill = o.getElementsByTagName(fillString);
                fill = fill && fill[0];
                o.removeChild(fill);
                if (fillpos) {
                    c = compensation(deg, m.x(fillpos[0], fillpos[1]), m.y(fillpos[0], fillpos[1]));
                    fill.position = c.dx * y + S + c.dy * y;
                }
                if (_.fillsize) {
                    fill.size = _.fillsize[0] * abs(sx) + S + _.fillsize[1] * abs(sy);
                }
                o.appendChild(fill);
            }
            s.visibility = "visible";
        };
    R.toString = function () {
        return  "Your browser doesn\u2019t support SVG. Falling down to VML.\nYou are running Rapha\xebl " + this.version;
    };
    var addArrow = function (o, value, isEnd) {
        var values = Str(value).toLowerCase().split("-"),
            se = isEnd ? "end" : "start",
            i = values.length,
            type = "classic",
            w = "medium",
            h = "medium";
        while (i--) {
            switch (values[i]) {
                case "block":
                case "classic":
                case "oval":
                case "diamond":
                case "open":
                case "none":
                    type = values[i];
                    break;
                case "wide":
                case "narrow": h = values[i]; break;
                case "long":
                case "short": w = values[i]; break;
            }
        }
        var stroke = o.node.getElementsByTagName("stroke")[0];
        stroke[se + "arrow"] = type;
        stroke[se + "arrowlength"] = w;
        stroke[se + "arrowwidth"] = h;
    },
    setFillAndStroke = function (o, params) {
        // o.paper.canvas.style.display = "none";
        o.attrs = o.attrs || {};
        var node = o.node,
            a = o.attrs,
            s = node.style,
            xy,
            newpath = pathTypes[o.type] && (params.x != a.x || params.y != a.y || params.width != a.width || params.height != a.height || params.cx != a.cx || params.cy != a.cy || params.rx != a.rx || params.ry != a.ry || params.r != a.r),
            isOval = ovalTypes[o.type] && (a.cx != params.cx || a.cy != params.cy || a.r != params.r || a.rx != params.rx || a.ry != params.ry),
            res = o;


        for (var par in params) if (params[has](par)) {
            a[par] = params[par];
        }
        if (newpath) {
            a.path = R._getPath[o.type](o);
            o._.dirty = 1;
        }
        params.href && (node.href = params.href);
        params.title && (node.title = params.title);
        params.target && (node.target = params.target);
        params.cursor && (s.cursor = params.cursor);
        "blur" in params && o.blur(params.blur);
        if (params.path && o.type == "path" || newpath) {
            node.path = path2vml(~Str(a.path).toLowerCase().indexOf("r") ? R._pathToAbsolute(a.path) : a.path);
            if (o.type == "image") {
                o._.fillpos = [a.x, a.y];
                o._.fillsize = [a.width, a.height];
                setCoords(o, 1, 1, 0, 0, 0);
            }
        }
        "transform" in params && o.transform(params.transform);
        if (isOval) {
            var cx = +a.cx,
                cy = +a.cy,
                rx = +a.rx || +a.r || 0,
                ry = +a.ry || +a.r || 0;
            node.path = R.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x", round((cx - rx) * zoom), round((cy - ry) * zoom), round((cx + rx) * zoom), round((cy + ry) * zoom), round(cx * zoom));
        }
        if ("clip-rect" in params) {
            var rect = Str(params["clip-rect"]).split(separator);
            if (rect.length == 4) {
                rect[2] = +rect[2] + (+rect[0]);
                rect[3] = +rect[3] + (+rect[1]);
                var div = node.clipRect || R._g.doc.createElement("div"),
                    dstyle = div.style;
                dstyle.clip = R.format("rect({1}px {2}px {3}px {0}px)", rect);
                if (!node.clipRect) {
                    dstyle.position = "absolute";
                    dstyle.top = 0;
                    dstyle.left = 0;
                    dstyle.width = o.paper.width + "px";
                    dstyle.height = o.paper.height + "px";
                    node.parentNode.insertBefore(div, node);
                    div.appendChild(node);
                    node.clipRect = div;
                }
            }
            if (!params["clip-rect"]) {
                node.clipRect && (node.clipRect.style.clip = "auto");
            }
        }
        if (o.textpath) {
            var textpathStyle = o.textpath.style;
            params.font && (textpathStyle.font = params.font);
            params["font-family"] && (textpathStyle.fontFamily = '"' + params["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g, E) + '"');
            params["font-size"] && (textpathStyle.fontSize = params["font-size"]);
            params["font-weight"] && (textpathStyle.fontWeight = params["font-weight"]);
            params["font-style"] && (textpathStyle.fontStyle = params["font-style"]);
        }
        if ("arrow-start" in params) {
            addArrow(res, params["arrow-start"]);
        }
        if ("arrow-end" in params) {
            addArrow(res, params["arrow-end"], 1);
        }
        if (params.opacity != null || 
            params["stroke-width"] != null ||
            params.fill != null ||
            params.src != null ||
            params.stroke != null ||
            params["stroke-width"] != null ||
            params["stroke-opacity"] != null ||
            params["fill-opacity"] != null ||
            params["stroke-dasharray"] != null ||
            params["stroke-miterlimit"] != null ||
            params["stroke-linejoin"] != null ||
            params["stroke-linecap"] != null) {
            var fill = node.getElementsByTagName(fillString),
                newfill = false;
            fill = fill && fill[0];
            !fill && (newfill = fill = createNode(fillString));
            if (o.type == "image" && params.src) {
                fill.src = params.src;
            }
            params.fill && (fill.on = true);
            if (fill.on == null || params.fill == "none" || params.fill === null) {
                fill.on = false;
            }
            if (fill.on && params.fill) {
                var isURL = Str(params.fill).match(R._ISURL);
                if (isURL) {
                    fill.parentNode == node && node.removeChild(fill);
                    fill.rotate = true;
                    fill.src = isURL[1];
                    fill.type = "tile";
                    var bbox = o.getBBox(1);
                    fill.position = bbox.x + S + bbox.y;
                    o._.fillpos = [bbox.x, bbox.y];

                    R._preload(isURL[1], function () {
                        o._.fillsize = [this.offsetWidth, this.offsetHeight];
                    });
                } else {
                    fill.color = R.getRGB(params.fill).hex;
                    fill.src = E;
                    fill.type = "solid";
                    if (R.getRGB(params.fill).error && (res.type in {circle: 1, ellipse: 1} || Str(params.fill).charAt() != "r") && addGradientFill(res, params.fill, fill)) {
                        a.fill = "none";
                        a.gradient = params.fill;
                        fill.rotate = false;
                    }
                }
            }
            if ("fill-opacity" in params || "opacity" in params) {
                var opacity = ((+a["fill-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+R.getRGB(params.fill).o + 1 || 2) - 1);
                opacity = mmin(mmax(opacity, 0), 1);
                fill.opacity = opacity;
                if (fill.src) {
                    fill.color = "none";
                }
            }
            node.appendChild(fill);
            var stroke = (node.getElementsByTagName("stroke") && node.getElementsByTagName("stroke")[0]),
            newstroke = false;
            !stroke && (newstroke = stroke = createNode("stroke"));
            if ((params.stroke && params.stroke != "none") ||
                params["stroke-width"] ||
                params["stroke-opacity"] != null ||
                params["stroke-dasharray"] ||
                params["stroke-miterlimit"] ||
                params["stroke-linejoin"] ||
                params["stroke-linecap"]) {
                stroke.on = true;
            }
            (params.stroke == "none" || params.stroke === null || stroke.on == null || params.stroke == 0 || params["stroke-width"] == 0) && (stroke.on = false);
            var strokeColor = R.getRGB(params.stroke);
            stroke.on && params.stroke && (stroke.color = strokeColor.hex);
            opacity = ((+a["stroke-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+strokeColor.o + 1 || 2) - 1);
            var width = (toFloat(params["stroke-width"]) || 1) * .75;
            opacity = mmin(mmax(opacity, 0), 1);
            params["stroke-width"] == null && (width = a["stroke-width"]);
            params["stroke-width"] && (stroke.weight = width);
            width && width < 1 && (opacity *= width) && (stroke.weight = 1);
            stroke.opacity = opacity;
        
            params["stroke-linejoin"] && (stroke.joinstyle = params["stroke-linejoin"] || "miter");
            stroke.miterlimit = params["stroke-miterlimit"] || 8;
            params["stroke-linecap"] && (stroke.endcap = params["stroke-linecap"] == "butt" ? "flat" : params["stroke-linecap"] == "square" ? "square" : "round");
            if (params["stroke-dasharray"]) {
                var dasharray = {
                    "-": "shortdash",
                    ".": "shortdot",
                    "-.": "shortdashdot",
                    "-..": "shortdashdotdot",
                    ". ": "dot",
                    "- ": "dash",
                    "--": "longdash",
                    "- .": "dashdot",
                    "--.": "longdashdot",
                    "--..": "longdashdotdot"
                };
                stroke.dashstyle = dasharray[has](params["stroke-dasharray"]) ? dasharray[params["stroke-dasharray"]] : E;
            }
            newstroke && node.appendChild(stroke);
        }
        if (res.type == "text") {
            res.paper.canvas.style.display = E;
            var span = res.paper.span,
                m = 100,
                fontSize = a.font && a.font.match(/\d+(?:\.\d*)?(?=px)/);
            s = span.style;
            a.font && (s.font = a.font);
            a["font-family"] && (s.fontFamily = a["font-family"]);
            a["font-weight"] && (s.fontWeight = a["font-weight"]);
            a["font-style"] && (s.fontStyle = a["font-style"]);
            fontSize = toFloat(a["font-size"] || fontSize && fontSize[0]) || 10;
            s.fontSize = fontSize * m + "px";
            res.textpath.string && (span.innerHTML = Str(res.textpath.string).replace(/</g, "&#60;").replace(/&/g, "&#38;").replace(/\n/g, "<br>"));
            var brect = span.getBoundingClientRect();
            res.W = a.w = (brect.right - brect.left) / m;
            res.H = a.h = (brect.bottom - brect.top) / m;
            // res.paper.canvas.style.display = "none";
            res.X = a.x;
            res.Y = a.y + res.H / 2;

            ("x" in params || "y" in params) && (res.path.v = R.format("m{0},{1}l{2},{1}", round(a.x * zoom), round(a.y * zoom), round(a.x * zoom) + 1));
            var dirtyattrs = ["x", "y", "text", "font", "font-family", "font-weight", "font-style", "font-size"];
            for (var d = 0, dd = dirtyattrs.length; d < dd; d++) if (dirtyattrs[d] in params) {
                res._.dirty = 1;
                break;
            }
        
            // text-anchor emulation
            switch (a["text-anchor"]) {
                case "start":
                    res.textpath.style["v-text-align"] = "left";
                    res.bbx = res.W / 2;
                break;
                case "end":
                    res.textpath.style["v-text-align"] = "right";
                    res.bbx = -res.W / 2;
                break;
                default:
                    res.textpath.style["v-text-align"] = "center";
                    res.bbx = 0;
                break;
            }
            res.textpath.style["v-text-kern"] = true;
        }
        // res.paper.canvas.style.display = E;
    },
    addGradientFill = function (o, gradient, fill) {
        o.attrs = o.attrs || {};
        var attrs = o.attrs,
            pow = Math.pow,
            opacity,
            oindex,
            type = "linear",
            fxfy = ".5 .5";
        o.attrs.gradient = gradient;
        gradient = Str(gradient).replace(R._radial_gradient, function (all, fx, fy) {
            type = "radial";
            if (fx && fy) {
                fx = toFloat(fx);
                fy = toFloat(fy);
                pow(fx - .5, 2) + pow(fy - .5, 2) > .25 && (fy = math.sqrt(.25 - pow(fx - .5, 2)) * ((fy > .5) * 2 - 1) + .5);
                fxfy = fx + S + fy;
            }
            return E;
        });
        gradient = gradient.split(/\s*\-\s*/);
        if (type == "linear") {
            var angle = gradient.shift();
            angle = -toFloat(angle);
            if (isNaN(angle)) {
                return null;
            }
        }
        var dots = R._parseDots(gradient);
        if (!dots) {
            return null;
        }
        o = o.shape || o.node;
        if (dots.length) {
            o.removeChild(fill);
            fill.on = true;
            fill.method = "none";
            fill.color = dots[0].color;
            fill.color2 = dots[dots.length - 1].color;
            var clrs = [];
            for (var i = 0, ii = dots.length; i < ii; i++) {
                dots[i].offset && clrs.push(dots[i].offset + S + dots[i].color);
            }
            fill.colors = clrs.length ? clrs.join() : "0% " + fill.color;
            if (type == "radial") {
                fill.type = "gradientTitle";
                fill.focus = "100%";
                fill.focussize = "0 0";
                fill.focusposition = fxfy;
                fill.angle = 0;
            } else {
                // fill.rotate= true;
                fill.type = "gradient";
                fill.angle = (270 - angle) % 360;
            }
            o.appendChild(fill);
        }
        return 1;
    },
    Element = function (node, vml) {
        this[0] = this.node = node;
        node.raphael = true;
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.X = 0;
        this.Y = 0;
        this.attrs = {};
        this.paper = vml;
        this.matrix = R.matrix();
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            dx: 0,
            dy: 0,
            deg: 0,
            dirty: 1,
            dirtyT: 1
        };
        !vml.bottom && (vml.bottom = this);
        this.prev = vml.top;
        vml.top && (vml.top.next = this);
        vml.top = this;
        this.next = null;
    };
    var elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;
    elproto.transform = function (tstr) {
        if (tstr == null) {
            return this._.transform;
        }
        var vbs = this.paper._viewBoxShift,
            vbt = vbs ? "s" + [vbs.scale, vbs.scale] + "-1-1t" + [vbs.dx, vbs.dy] : E,
            oldt;
        if (vbs) {
            oldt = tstr = Str(tstr).replace(/\.{3}|\u2026/g, this._.transform || E);
        }
        R._extractTransform(this, vbt + tstr);
        var matrix = this.matrix.clone(),
            skew = this.skew,
            o = this.node,
            split,
            isGrad = ~Str(this.attrs.fill).indexOf("-"),
            isPatt = !Str(this.attrs.fill).indexOf("url(");
        matrix.translate(-.5, -.5);
        if (isPatt || isGrad || this.type == "image") {
            skew.matrix = "1 0 0 1";
            skew.offset = "0 0";
            split = matrix.split();
            if ((isGrad && split.noRotation) || !split.isSimple) {
                o.style.filter = matrix.toFilter();
                var bb = this.getBBox(),
                    bbt = this.getBBox(1),
                    dx = bb.x - bbt.x,
                    dy = bb.y - bbt.y;
                o.coordorigin = (dx * -zoom) + S + (dy * -zoom);
                setCoords(this, 1, 1, dx, dy, 0);
            } else {
                o.style.filter = E;
                setCoords(this, split.scalex, split.scaley, split.dx, split.dy, split.rotate);
            }
        } else {
            o.style.filter = E;
            skew.matrix = Str(matrix);
            skew.offset = matrix.offset();
        }
        oldt && (this._.transform = oldt);
        return this;
    };
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        if (deg == null) {
            return;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this._.dirtyT = 1;
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        if (this._.bbox) {
            this._.bbox.x += dx;
            this._.bbox.y += dy;
        }
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
            isNaN(cx) && (cx = null);
            isNaN(cy) && (cy = null);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
    
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        this._.dirtyT = 1;
        return this;
    };
    elproto.hide = function () {
        !this.removed && (this.node.style.display = "none");
        return this;
    };
    elproto.show = function () {
        !this.removed && (this.node.style.display = E);
        return this;
    };
    elproto._getBBox = function () {
        if (this.removed) {
            return {};
        }
        return {
            x: this.X + (this.bbx || 0) - this.W / 2,
            y: this.Y - this.H,
            width: this.W,
            height: this.H
        };
    };
    elproto.remove = function () {
        if (this.removed || !this.node.parentNode) {
            return;
        }
        this.paper.__set__ && this.paper.__set__.exclude(this);
        R.eve.unbind("raphael.*.*." + this.id);
        R._tear(this, this.paper);
        this.node.parentNode.removeChild(this.node);
        this.shape && this.shape.parentNode.removeChild(this.shape);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == fillString && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (this.attrs && value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        var params;
        if (value != null) {
            params = {};
            params[name] = value;
        }
        value == null && R.is(name, "object") && (params = name);
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        if (params) {
            for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
                var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
                this.attrs[key] = params[key];
                for (var subkey in par) if (par[has](subkey)) {
                    params[subkey] = par[subkey];
                }
            }
            // this.paper.canvas.style.display = "none";
            if (params.text && this.type == "text") {
                this.textpath.string = params.text;
            }
            setFillAndStroke(this, params);
            // this.paper.canvas.style.display = E;
        }
        return this;
    };
    elproto.toFront = function () {
        !this.removed && this.node.parentNode.appendChild(this.node);
        this.paper && this.paper.top != this && R._tofront(this, this.paper);
        return this;
    };
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        if (this.node.parentNode.firstChild != this.node) {
            this.node.parentNode.insertBefore(this.node, this.node.parentNode.firstChild);
            R._toback(this, this.paper);
        }
        return this;
    };
    elproto.insertAfter = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[element.length - 1];
        }
        if (element.node.nextSibling) {
            element.node.parentNode.insertBefore(this.node, element.node.nextSibling);
        } else {
            element.node.parentNode.appendChild(this.node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    elproto.insertBefore = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[0];
        }
        element.node.parentNode.insertBefore(this.node, element.node);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        var s = this.node.runtimeStyle,
            f = s.filter;
        f = f.replace(blurregexp, E);
        if (+size !== 0) {
            this.attrs.blur = size;
            s.filter = f + S + ms + ".Blur(pixelradius=" + (+size || 1.5) + ")";
            s.margin = R.format("-{0}px 0 0 -{0}px", round(+size || 1.5));
        } else {
            s.filter = f;
            s.margin = 0;
            delete this.attrs.blur;
        }
    };

    R._engine.path = function (pathString, vml) {
        var el = createNode("shape");
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = vml.coordorigin;
        var p = new Element(el, vml),
            attr = {fill: "none", stroke: "#000"};
        pathString && (attr.path = pathString);
        p.type = "path";
        p.path = [];
        p.Path = E;
        setFillAndStroke(p, attr);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.rect = function (vml, x, y, w, h, r) {
        var path = R._rectPath(x, y, w, h, r),
            res = vml.path(path),
            a = res.attrs;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.r = r;
        a.path = path;
        res.type = "rect";
        return res;
    };
    R._engine.ellipse = function (vml, x, y, rx, ry) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - rx;
        res.Y = y - ry;
        res.W = rx * 2;
        res.H = ry * 2;
        res.type = "ellipse";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            rx: rx,
            ry: ry
        });
        return res;
    };
    R._engine.circle = function (vml, x, y, r) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - r;
        res.Y = y - r;
        res.W = res.H = r * 2;
        res.type = "circle";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            r: r
        });
        return res;
    };
    R._engine.image = function (vml, src, x, y, w, h) {
        var path = R._rectPath(x, y, w, h),
            res = vml.path(path).attr({stroke: "none"}),
            a = res.attrs,
            node = res.node,
            fill = node.getElementsByTagName(fillString)[0];
        a.src = src;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.path = path;
        res.type = "image";
        fill.parentNode == node && node.removeChild(fill);
        fill.rotate = true;
        fill.src = src;
        fill.type = "tile";
        res._.fillpos = [x, y];
        res._.fillsize = [w, h];
        node.appendChild(fill);
        setCoords(res, 1, 1, 0, 0, 0);
        return res;
    };
    R._engine.text = function (vml, x, y, text) {
        var el = createNode("shape"),
            path = createNode("path"),
            o = createNode("textpath");
        x = x || 0;
        y = y || 0;
        text = text || "";
        path.v = R.format("m{0},{1}l{2},{1}", round(x * zoom), round(y * zoom), round(x * zoom) + 1);
        path.textpathok = true;
        o.string = Str(text);
        o.on = true;
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = "0 0";
        var p = new Element(el, vml),
            attr = {
                fill: "#000",
                stroke: "none",
                font: R._availableAttrs.font,
                text: text
            };
        p.shape = el;
        p.path = path;
        p.textpath = o;
        p.type = "text";
        p.attrs.text = Str(text);
        p.attrs.x = x;
        p.attrs.y = y;
        p.attrs.w = 1;
        p.attrs.h = 1;
        setFillAndStroke(p, attr);
        el.appendChild(o);
        el.appendChild(path);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.setSize = function (width, height) {
        var cs = this.canvas.style;
        this.width = width;
        this.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        cs.width = width;
        cs.height = height;
        cs.clip = "rect(0 " + width + " " + height + " 0)";
        if (this._viewBox) {
            R._engine.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        R.eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var width = this.width,
            height = this.height,
            size = 1 / mmax(w / width, h / height),
            H, W;
        if (fit) {
            H = height / h;
            W = width / w;
            if (w * H < width) {
                x -= (width - w * H) / 2 / H;
            }
            if (h * W < height) {
                y -= (height - h * W) / 2 / W;
            }
        }
        this._viewBox = [x, y, w, h, !!fit];
        this._viewBoxShift = {
            dx: -x,
            dy: -y,
            scale: size
        };
        this.forEach(function (el) {
            el.transform("...");
        });
        return this;
    };
    var createNode;
    R._engine.initWin = function (win) {
            var doc = win.document;
            doc.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
            try {
                !doc.namespaces.rvml && doc.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
                createNode = function (tagName) {
                    return doc.createElement('<rvml:' + tagName + ' class="rvml">');
                };
            } catch (e) {
                createNode = function (tagName) {
                    return doc.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
                };
            }
        };
    R._engine.initWin(R._g.win);
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con.container,
            height = con.height,
            s,
            width = con.width,
            x = con.x,
            y = con.y;
        if (!container) {
            throw new Error("VML container not found.");
        }
        var res = new R._Paper,
            c = res.canvas = R._g.doc.createElement("div"),
            cs = c.style;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        res.width = width;
        res.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        res.coordsize = zoom * 1e3 + S + zoom * 1e3;
        res.coordorigin = "0 0";
        res.span = R._g.doc.createElement("span");
        res.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;";
        c.appendChild(res.span);
        cs.cssText = R.format("top:0;left:0;width:{0};height:{1};display:inline-block;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden", width, height);
        if (container == 1) {
            R._g.doc.body.appendChild(c);
            cs.left = x + "px";
            cs.top = y + "px";
            cs.position = "absolute";
        } else {
            if (container.firstChild) {
                container.insertBefore(c, container.firstChild);
            } else {
                container.appendChild(c);
            }
        }
        res.renderfix = function () {};
        return res;
    };
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        this.canvas.innerHTML = E;
        this.span = R._g.doc.createElement("span");
        this.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;";
        this.canvas.appendChild(this.span);
        this.bottom = this.top = null;
    };
    R.prototype.remove = function () {
        R.eve("raphael.remove", this);
        this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        return true;
    };

    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
}(window.Raphael);/*!
 * g.Raphael 0.51 - Charting library, based on Raphaël
 *
 * Copyright (c) 2009-2012 Dmitry Baranovskiy (http://g.raphaeljs.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
Raphael.el.popup=function(d,a,b,f){var e=this.paper||this[0].paper,c,g,i,h;if(e){switch(this.type){case "text":case "circle":case "ellipse":g=!0;break;default:g=!1}d=null==d?"up":d;a=a||5;c=this.getBBox();b="number"==typeof b?b:g?c.x+c.width/2:c.x;f="number"==typeof f?f:g?c.y+c.height/2:c.y;i=Math.max(c.width/2-a,0);h=Math.max(c.height/2-a,0);this.translate(b-c.x-(g?c.width/2:0),f-c.y-(g?c.height/2:0));c=this.getBBox();b={up:["M",b,f,"l",-a,-a,-i,0,"a",a,a,0,0,1,-a,-a,"l",0,-c.height,"a",a,a,0,0,
1,a,-a,"l",2*a+2*i,0,"a",a,a,0,0,1,a,a,"l",0,c.height,"a",a,a,0,0,1,-a,a,"l",-i,0,"z"].join(),down:["M",b,f,"l",a,a,i,0,"a",a,a,0,0,1,a,a,"l",0,c.height,"a",a,a,0,0,1,-a,a,"l",-(2*a+2*i),0,"a",a,a,0,0,1,-a,-a,"l",0,-c.height,"a",a,a,0,0,1,a,-a,"l",i,0,"z"].join(),left:["M",b,f,"l",-a,a,0,h,"a",a,a,0,0,1,-a,a,"l",-c.width,0,"a",a,a,0,0,1,-a,-a,"l",0,-(2*a+2*h),"a",a,a,0,0,1,a,-a,"l",c.width,0,"a",a,a,0,0,1,a,a,"l",0,h,"z"].join(),right:["M",b,f,"l",a,-a,0,-h,"a",a,a,0,0,1,a,-a,"l",c.width,0,"a",a,
a,0,0,1,a,a,"l",0,2*a+2*h,"a",a,a,0,0,1,-a,a,"l",-c.width,0,"a",a,a,0,0,1,-a,-a,"l",0,-h,"z"].join()};a={up:{x:-!g*(c.width/2),y:2*-a-(g?c.height/2:c.height)},down:{x:-!g*(c.width/2),y:2*a+(g?c.height/2:c.height)},left:{x:2*-a-(g?c.width/2:c.width),y:-!g*(c.height/2)},right:{x:2*a+(g?c.width/2:c.width),y:-!g*(c.height/2)}}[d];this.translate(a.x,a.y);return e.path(b[d]).attr({fill:"#000",stroke:"none"}).insertBefore(this.node?this:this[0])}};
Raphael.el.tag=function(d,a,b,f){var e=this.paper||this[0].paper;if(e){var e=e.path().attr({fill:"#000",stroke:"#000"}),c=this.getBBox(),g,i,h;switch(this.type){case "text":case "circle":case "ellipse":h=!0;break;default:h=!1}d=d||0;b="number"==typeof b?b:h?c.x+c.width/2:c.x;f="number"==typeof f?f:h?c.y+c.height/2:c.y;a=null==a?5:a;i=0.5522*a;c.height>=2*a?e.attr({path:["M",b,f+a,"a",a,a,0,1,1,0,2*-a,a,a,0,1,1,0,2*a,"m",0,2*-a-3,"a",a+3,a+3,0,1,0,0,2*(a+3),"L",b+a+3,f+c.height/2+3,"l",c.width+6,0,
0,-c.height-6,-c.width-6,0,"L",b,f-a-3].join()}):(g=Math.sqrt(Math.pow(a+3,2)-Math.pow(c.height/2+3,2)),e.attr({path:["M",b,f+a,"c",-i,0,-a,i-a,-a,-a,0,-i,a-i,-a,a,-a,i,0,a,a-i,a,a,0,i,i-a,a,-a,a,"M",b+g,f-c.height/2-3,"a",a+3,a+3,0,1,0,0,c.height+6,"l",a+3-g+c.width+6,0,0,-c.height-6,"L",b+g,f-c.height/2-3].join()}));d=360-d;e.rotate(d,b,f);this.attrs?(this.attr(this.attrs.x?"x":"cx",b+a+3+(!h?"text"==this.type?c.width:0:c.width/2)).attr("y",h?f:f-c.height/2),this.rotate(d,b,f),90<d&&270>d&&this.attr(this.attrs.x?
"x":"cx",b-a-3-(!h?c.width:c.width/2)).rotate(180,b,f)):90<d&&270>d?(this.translate(b-c.x-c.width-a-3,f-c.y-c.height/2),this.rotate(d-180,c.x+c.width+a+3,c.y+c.height/2)):(this.translate(b-c.x+a+3,f-c.y-c.height/2),this.rotate(d,c.x-a-3,c.y+c.height/2));return e.insertBefore(this.node?this:this[0])}};
Raphael.el.drop=function(d,a,b){var f=this.getBBox(),e=this.paper||this[0].paper,c,g;if(e){switch(this.type){case "text":case "circle":case "ellipse":c=!0;break;default:c=!1}d=d||0;a="number"==typeof a?a:c?f.x+f.width/2:f.x;b="number"==typeof b?b:c?f.y+f.height/2:f.y;g=Math.max(f.width,f.height)+Math.min(f.width,f.height);e=e.path(["M",a,b,"l",g,0,"A",0.4*g,0.4*g,0,1,0,a+0.7*g,b-0.7*g,"z"]).attr({fill:"#000",stroke:"none"}).rotate(22.5-d,a,b);d=(d+90)*Math.PI/180;a=a+g*Math.sin(d)-(c?0:f.width/2);
d=b+g*Math.cos(d)-(c?0:f.height/2);this.attrs?this.attr(this.attrs.x?"x":"cx",a).attr(this.attrs.y?"y":"cy",d):this.translate(a-f.x,d-f.y);return e.insertBefore(this.node?this:this[0])}};
Raphael.el.flag=function(d,a,b){var f=this.paper||this[0].paper;if(f){var f=f.path().attr({fill:"#000",stroke:"#000"}),e=this.getBBox(),c=e.height/2,g;switch(this.type){case "text":case "circle":case "ellipse":g=!0;break;default:g=!1}d=d||0;a="number"==typeof a?a:g?e.x+e.width/2:e.x;b="number"==typeof b?b:g?e.y+e.height/2:e.y;f.attr({path:["M",a,b,"l",c+3,-c-3,e.width+6,0,0,e.height+6,-e.width-6,0,"z"].join()});d=360-d;f.rotate(d,a,b);this.attrs?(this.attr(this.attrs.x?"x":"cx",a+c+3+(!g?"text"==
this.type?e.width:0:e.width/2)).attr("y",g?b:b-e.height/2),this.rotate(d,a,b),90<d&&270>d&&this.attr(this.attrs.x?"x":"cx",a-c-3-(!g?e.width:e.width/2)).rotate(180,a,b)):90<d&&270>d?(this.translate(a-e.x-e.width-c-3,b-e.y-e.height/2),this.rotate(d-180,e.x+e.width+c+3,e.y+e.height/2)):(this.translate(a-e.x+c+3,b-e.y-e.height/2),this.rotate(d,e.x-c-3,e.y+e.height/2));return f.insertBefore(this.node?this:this[0])}};
Raphael.el.label=function(){var d=this.getBBox(),a=this.paper||this[0].paper,b=Math.min(20,d.width+10,d.height+10)/2;if(a)return a.rect(d.x-b/2,d.y-b/2,d.width+b,d.height+b,b).attr({stroke:"none",fill:"#000"}).insertBefore(this.node?this:this[0])};
Raphael.el.blob=function(d,a,b){var f=this.getBBox(),e=Math.PI/180,c=this.paper||this[0].paper,g,i;if(c){switch(this.type){case "text":case "circle":case "ellipse":g=!0;break;default:g=!1}c=c.path().attr({fill:"#000",stroke:"none"});d=(+d+1?d:45)+90;i=Math.min(f.height,f.width);var a="number"==typeof a?a:g?f.x+f.width/2:f.x,b="number"==typeof b?b:g?f.y+f.height/2:f.y,h=Math.max(f.width+i,25*i/12),j=Math.max(f.height+i,25*i/12);g=a+i*Math.sin((d-22.5)*e);var o=b+i*Math.cos((d-22.5)*e),l=a+i*Math.sin((d+
22.5)*e),d=b+i*Math.cos((d+22.5)*e),e=(l-g)/2;i=(d-o)/2;var h=h/2,j=j/2,n=-Math.sqrt(Math.abs(h*h*j*j-h*h*i*i-j*j*e*e)/(h*h*i*i+j*j*e*e));i=n*h*i/j+(l+g)/2;e=n*-j*e/h+(d+o)/2;c.attr({x:i,y:e,path:["M",a,b,"L",l,d,"A",h,j,0,1,1,g,o,"z"].join()});this.translate(i-f.x-f.width/2,e-f.y-f.height/2);return c.insertBefore(this.node?this:this[0])}};Raphael.fn.label=function(d,a,b){var f=this.set(),b=this.text(d,a,b).attr(Raphael.g.txtattr);return f.push(b.label(),b)};
Raphael.fn.popup=function(d,a,b,f,e){var c=this.set(),b=this.text(d,a,b).attr(Raphael.g.txtattr);return c.push(b.popup(f,e),b)};Raphael.fn.tag=function(d,a,b,f,e){var c=this.set(),b=this.text(d,a,b).attr(Raphael.g.txtattr);return c.push(b.tag(f,e),b)};Raphael.fn.flag=function(d,a,b,f){var e=this.set(),b=this.text(d,a,b).attr(Raphael.g.txtattr);return e.push(b.flag(f),b)};Raphael.fn.drop=function(d,a,b,f){var e=this.set(),b=this.text(d,a,b).attr(Raphael.g.txtattr);return e.push(b.drop(f),b)};
Raphael.fn.blob=function(d,a,b,f){var e=this.set(),b=this.text(d,a,b).attr(Raphael.g.txtattr);return e.push(b.blob(f),b)};Raphael.el.lighter=function(d){var d=d||2,a=[this.attrs.fill,this.attrs.stroke];this.fs=this.fs||[a[0],a[1]];a[0]=Raphael.rgb2hsb(Raphael.getRGB(a[0]).hex);a[1]=Raphael.rgb2hsb(Raphael.getRGB(a[1]).hex);a[0].b=Math.min(a[0].b*d,1);a[0].s/=d;a[1].b=Math.min(a[1].b*d,1);a[1].s/=d;this.attr({fill:"hsb("+[a[0].h,a[0].s,a[0].b]+")",stroke:"hsb("+[a[1].h,a[1].s,a[1].b]+")"});return this};
Raphael.el.darker=function(d){var d=d||2,a=[this.attrs.fill,this.attrs.stroke];this.fs=this.fs||[a[0],a[1]];a[0]=Raphael.rgb2hsb(Raphael.getRGB(a[0]).hex);a[1]=Raphael.rgb2hsb(Raphael.getRGB(a[1]).hex);a[0].s=Math.min(a[0].s*d,1);a[0].b/=d;a[1].s=Math.min(a[1].s*d,1);a[1].b/=d;this.attr({fill:"hsb("+[a[0].h,a[0].s,a[0].b]+")",stroke:"hsb("+[a[1].h,a[1].s,a[1].b]+")"});return this};Raphael.el.resetBrightness=function(){this.fs&&(this.attr({fill:this.fs[0],stroke:this.fs[1]}),delete this.fs);return this};
(function(){var d=["lighter","darker","resetBrightness"],a="popup tag flag label drop blob".split(" "),b;for(b in a)(function(a){Raphael.st[a]=function(){return Raphael.el[a].apply(this,arguments)}})(a[b]);for(b in d)(function(a){Raphael.st[a]=function(){for(var b=0;b<this.length;b++)this[b][a].apply(this[b],arguments);return this}})(d[b])})();
Raphael.g={shim:{stroke:"none",fill:"#000","fill-opacity":0},txtattr:{font:"12px Arial, sans-serif",fill:"#fff"},colors:function(){for(var d=[0.6,0.2,0.05,0.1333,0.75,0],a=[],b=0;10>b;b++)b<d.length?a.push("hsb("+d[b]+",.75, .75)"):a.push("hsb("+d[b-d.length]+", 1, .5)");return a}(),snapEnds:function(d,a,b){function f(a){return 0.25>Math.abs(a-0.5)?~~a+0.5:Math.round(a)}var e=d,c=a;if(e==c)return{from:e,to:c,power:0};var e=(c-e)/b,g=c=~~e,b=0;if(c){for(;g;)b--,g=~~(e*Math.pow(10,b))/Math.pow(10,b);
b++}else{if(0==e||!isFinite(e))b=1;else for(;!c;)b=b||1,c=~~(e*Math.pow(10,b))/Math.pow(10,b),b++;b&&b--}c=f(a*Math.pow(10,b))/Math.pow(10,b);c<a&&(c=f((a+0.5)*Math.pow(10,b))/Math.pow(10,b));e=f((d-(0<b?0:0.5))*Math.pow(10,b))/Math.pow(10,b);return{from:e,to:c,power:b}},axis:function(d,a,b,f,e,c,g,i,h,j,o){var j=null==j?2:j,h=h||"t",c=c||10,o=arguments[arguments.length-1],l="|"==h||" "==h?["M",d+0.5,a,"l",0,0.001]:1==g||3==g?["M",d+0.5,a,"l",0,-b]:["M",d,a+0.5,"l",b,0],n=this.snapEnds(f,e,c),p=n.from,
t=n.to,m=n.power,u=0,v={font:"11px 'Fontin Sans', Fontin-Sans, sans-serif"},n=o.set(),t=(t-p)/c,k=p,r=0<m?m:0,s=b/c;if(1==+g||3==+g){m=a;for(p=(g-1?1:-1)*(j+3+!!(g-1));m>=a-b;)"-"!=h&&" "!=h&&(l=l.concat(["M",d-("+"==h||"|"==h?j:2*!(g-1)*j),m+0.5,"l",2*j+1,0])),n.push(o.text(d+p,m,i&&i[u++]||(Math.round(k)==k?k:+k.toFixed(r))).attr(v).attr({"text-anchor":g-1?"start":"end"})),k+=t,m-=s;Math.round(m+s-(a-b))&&("-"!=h&&" "!=h&&(l=l.concat(["M",d-("+"==h||"|"==h?j:2*!(g-1)*j),a-b+0.5,"l",2*j+1,0])),n.push(o.text(d+
p,a-b,i&&i[u]||(Math.round(k)==k?k:+k.toFixed(r))).attr(v).attr({"text-anchor":g-1?"start":"end"})))}else{for(var k=p,r=(0<m)*m,p=(g?-1:1)*(j+9+!g),m=d,s=b/c,q=0,w=0;m<=d+b;)"-"!=h&&" "!=h&&(l=l.concat(["M",m+0.5,a-("+"==h?j:2*!!g*j),"l",0,2*j+1])),n.push(q=o.text(m,a+p,i&&i[u++]||(Math.round(k)==k?k:+k.toFixed(r))).attr(v)),q=q.getBBox(),w>=q.x-5?n.pop(n.length-1).remove():w=q.x+q.width,k+=t,m+=s;Math.round(m-s-d-b)&&("-"!=h&&" "!=h&&(l=l.concat(["M",d+b+0.5,a-("+"==h?j:2*!!g*j),"l",0,2*j+1])),n.push(o.text(d+
b,a+p,i&&i[u]||(Math.round(k)==k?k:+k.toFixed(r))).attr(v)))}l=o.path(l);l.text=n;l.all=o.set([l,n]);l.remove=function(){this.text.remove();this.constructor.prototype.remove.call(this)};return l},labelise:function(d,a,b){return d?(d+"").replace(/(##+(?:\.#+)?)|(%%+(?:\.%+)?)/g,function(d,e,c){if(e)return(+a).toFixed(e.replace(/^#+\.?/g,"").length);if(c)return(100*a/b).toFixed(c.replace(/^%+\.?/g,"").length)+"%"}):(+a).toFixed(0)}};// iToast justspamjustin copyright 2012
var iToast=function(){var DefaultToastOpts={icon:"certificate",position:"bottom right",pauseTime:4e3,outAnimation:"flyout-fadeout",inAnimation:"flyin",theme:"default",showCloseButton:true,pauseOnHover:true,returnAfterHoverTime:1e3,title:undefined,type:"general",iconColor:"none",onClick:function(e){},getToastHTML:function(e,t,n){return['<div class="itoast-inner-container">',' <div class="itoast-close-button">','   <i class="icon-remove"></i>'," </div>",' <div class="itoast-icon-container"><i class="fa fa-'+n+'"></i></div>',' <div class="itoast-title-container">','  <span class="itoast-title">'+t+"</span>"," </div>",' <div class="itoast-message-container">','  <span class="itoast-message">'+e+"</span>"," </div>","</div>"].join("\n")}};return{toasts:[],showToast:function(e,t){t=this._objectExtend({},DefaultToastOpts,t);var n=t.icon;var r=t.position;var i=t.title||"";var s=t.getToastHTML(e,i,n);var o=window.document.createElement("div");o.innerHTML=s;var u=t.showCloseButton?"show-close":"";var a=t.title?"has-title":"";var f=["itoast-main-container",r,"animate-"+t.inAnimation,"theme-"+t.theme,u,a,"type-"+t.type];o.className=f.join(" ");window.document.body.appendChild(o);this.toasts.push(t);t.toastEl=o;this._addIconColor(t);this._animateIn(t);this._setUpEvents(t);this._pause(t);this._adjustPositions()},showNotification:function(e,t,n){n=n||{};n.title=e;this.showToast(t,n)},showWarn:function(e,t,n){n=n||{};n.title=e;n.type="warn";n.icon="warning";this.showToast(t,n)},showError:function(e,t,n){n=n||{};n.title=e;n.type="error";n.icon="exclamation";this.showToast(t,n)},showSuccess:function(e,t,n){n=n||{};n.title=e;n.type="success";n.icon="check";this.showToast(t,n)},showCool:function(e,t,n){n=n||{};n.title=e;n.type="cool";n.icon="thumbs-up";this.showToast(t,n)},showAsphalt:function(e,t,n){n=n||{};n.title=e;n.theme="asphalt";this.showToast(t,n)},showJetBlack:function(e,t,n){n=n||{};n.title=e;n.theme="jetblack";this.showToast(t,n)},showFrosted:function(e,t,n){n=n||{};n.title=e;n.theme="frosted";this.showToast(t,n)},_addIconColor:function(e){if(e.iconColor!=="none"){var t=e.toastEl.getElementsByClassName("itoast-icon-container")[0];t.style.color=e.iconColor}},_adjustPositions:function(){var topEls=[];var bottomEls=[];var tops=[];var bottoms=[];if(this.toasts.length>1){for(var i=0;i<this.toasts.length;i++){var toastEl=this.toasts[i].toastEl;var separation=0;var position=0;var isTop=this.toasts[i].position.indexOf("top")!=-1;if(isTop){if(topEls.length>0){var topEl=topEls.pop();separation=topEl.offsetHeight-20;topEls.push(topEl)}tops.push(separation);topEls.push(toastEl);position=eval(tops.join("+"));toastEl.style.top=position+"px"}else{if(bottomEls.length>0){var bottomEl=bottomEls.pop();separation=bottomEl.offsetHeight-20;bottomEls.push(bottomEl)}bottoms.push(separation);bottomEls.push(toastEl);position=eval(bottoms.join("+"));toastEl.style.bottom=position+"px"}}}},_animateIn:function(e){var t=e.toastEl.className.split(" ");var n=this._findAnimateClass(t);t.splice(n,1);var r=t.join(" ");var i=this;setTimeout(function(){e.toastEl.className=r},20)},_pause:function(e){var t=this;e.pauseId=setTimeout(function(){t._afterPause(e)},e.pauseTime)},_afterPause:function(e){this._animateOut(e)},_animateOut:function(e){var t=e.toastEl.className.split(" ");t.push("animate-"+e.outAnimation);e.toastEl.className=t.join(" ");this._afterAnimateOut(e)},_afterAnimateOut:function(e){var t=e.toastEl;var n=this;setTimeout(function(){n._tearDownEvents(e);if(t.parentNode){t.parentNode.removeChild(t);n.toasts.splice(0,1);n._adjustPositions()}},500)},_setUpEvents:function(e){e.closeButton=e.toastEl.getElementsByClassName("itoast-close-button")[0];var t=this;e.closeButton.onclick=function(n){var r=n?n:window.event;if(r.stopPropagation)r.stopPropagation();if(r.cancelBubble!=null)r.cancelBubble=true;t._onClickClose.call(t,n,e)};e.toastEl.onmouseover=function(n){t._onMouseOverNotification(n,e)};e.toastEl.onmouseout=function(n){t._onMouseOutNotification(n,e)};e.toastEl.onclick=function(n){t._onClick(n,e)}},_onClick:function(e,t){t.onClick(e)},_tearDownEvents:function(e){e.closeButton.onclick=null;e.toastEl.onmouseover=null;e.toastEl.onmouseout=null;e.toastEl.onclick=null},_onClickClose:function(e,t){clearTimeout(t.pauseId);this._afterPause(t)},_onMouseOverNotification:function(e,t){if(t.pauseOnHover){clearTimeout(t.pauseId)}},_onMouseOutNotification:function(e,t){if(t.pauseOnHover){var n=this;t.pauseId=setTimeout(function(){n._afterPause(t)},t.returnAfterHoverTime)}},_findAnimateClass:function(e){var t=-1;for(var n=0;n<e.length;n++){if(e[n].indexOf("animate-")==0){t=n}}return t},_objectExtend:function(e){this._each(Array.prototype.slice.call(arguments,1),function(t){for(var n in t){e[n]=t[n]}});return e},_each:function(e,t,n){if(e==null)return;if(Array.prototype.forEach&&e.forEach===Array.prototype.forEach){e.forEach(t,n)}else if(e.length===+e.length){for(var r=0,i=e.length;r<i;r++){if(t.call(n,e[r],r,e)==={})return}}else{for(var s in e){if(e.hasOwnProperty(s)){if(t.call(n,e[s],s,e)==={})return}}}}}}()/* Copyright (c) 2009 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 *
 * Version: 3.0.2
 * 
 * Requires: 1.2.2+
 */
(function(c){var a=["DOMMouseScroll","mousewheel"];c.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var d=a.length;d;){this.addEventListener(a[--d],b,false)}}else{this.onmousewheel=b}},teardown:function(){if(this.removeEventListener){for(var d=a.length;d;){this.removeEventListener(a[--d],b,false)}}else{this.onmousewheel=null}}};c.fn.extend({mousewheel:function(d){return d?this.bind("mousewheel",d):this.trigger("mousewheel")},unmousewheel:function(d){return this.unbind("mousewheel",d)}});function b(f){var d=[].slice.call(arguments,1),g=0,e=true;f=c.event.fix(f||window.event);f.type="mousewheel";if(f.wheelDelta){g=f.wheelDelta/120}if(f.detail){g=-f.detail/3}d.unshift(f,g);return c.event.handle.apply(this,d)}})(jQuery);/**
 * ChromoSelector 2.1.0 for jQuery 1.3+
 *
 * All code (c) 2013 - Copyright www.chromoselector.com - All Rights Reserved.
 * Written by Rouslan Placella <info@chromoselector.com>
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */(function(a,b,c,d){function p(a,b,d){return[d+a*c.cos(b),d+a*c.sin(b)]}function q(a,b,c){return t(a,[b,b])<=c}function r(a,b,c,d){var e=function(a,b,c){return(a[0]-c[0])*(b[1]-c[1])-(b[0]-c[0])*(a[1]-c[1])},f=e(a,b,c)<0,g=e(a,c,d)<0,h=e(a,d,b)<0;return f===g&&g===h}function s(a,b){return-1/((b[1]-a[1])/(b[0]-a[0]))}function t(a,b){var d=a[0]-b[0],e=a[1]-b[1];return c.sqrt(d*d+e*e)}function u(a,b){return b*b===Infinity?[a[0],a[1]+1]:[a[0]+1,b+a[1]]}function v(a,b,c,d){var e=(d[1]-c[1])*(b[0]-a[0])-(d[0]-c[0])*(b[1]-a[1]),f=(d[0]-c[0])*(a[1]-c[1])-(d[1]-c[1])*(a[0]-c[0]),g=f/e;return[a[0]+g*(b[0]-a[0]),a[1]+g*(b[1]-a[1])]}function w(a,b,c,d){var e,f=(b+c*a.width)*4;for(e=0;e<4;e++)a.data[f+e]=d[e]}function x(a,b,c,d){var e=v(d,[d[0]+20,d[1]],a,b),f=v(d,[d[0]+20,d[1]],a,c),g;return d[0]<e[0]?g=255:d[0]>f[0]?g=0:g=(f[0]-d[0])/(f[0]-e[0])*255,[g,g,g,255]}function z(b,d){var e=b.getContext("2d"),f=a("<canvas>").attr("width",d).attr("height",d)[0],g=f.getContext("2d");if(!y.J){y.J=e.createImageData(80,80);var h,i,j,k,l,m,n,o,p=180/c.PI,q=function(a){return a%=360,a>=240?0:a>=180?255*((240-a)/60):a>=60?255:255*(a/60)};for(i=0;i<80;i++){k=i-40;for(j=0;j<80;j++)l=j-40,h=c.atan2(k,l)*p+270,m=q(h+120),n=q(h),o=q(h+240),w(y.J,i,j,[m,n,o,255])}}e.putImageData(y.J,0,0),g.scale(d/80,d/80),g.drawImage(b,0,0),e.drawImage(f,0,0)}function A(b){var d=b.L,e=b.s[1].getContext("2d");z(b.s[1],d);var f=[d/2,d/2];e[k]="destination-out",e[l]="rgba(0,0,0,1)",e.lineWidth=b.G,e.beginPath(),e.arc(f[0],f[1],b.H-b.G/2,0,c.PI*2,!0),e.closePath(),e.fill();var g=a("<canvas/>").attr("width",d).attr("height",d)[0],h=g.getContext("2d");h[i](0,0,d,d),h[k]="destination-out",h.beginPath(),h.arc(f[0],f[1],b.H+b.G/2,0,c.PI*2,!0),h.closePath(),h.fill(),e.drawImage(g,0,0),e=b.s[0].getContext("2d"),e.lineWidth=b.G-2,e.shadowColor=b.a.shadowColor,e.shadowBlur=b.a.shadow,e.beginPath(),e.arc(f[0],f[1],b.H,0,c.PI*2,!0),e.closePath(),e.stroke()}function B(a){var b=a.Color.getHsl().h,d=a.s[2],e=d.getContext("2d");e.clearRect(0,0,a.L,a.L);var f=-c.PI/2,g=E(a,f),l;if(!a.z){var m=e.createImageData(a.L,a.L),o=function(a,b){return{start:c.round(c.min(a[0][b]-3,a[1][b]-3,a[2][b]-3)),end:c.round(c.max(a[0][b]+3,a[1][b]+3,a[2][b]+3))}},p=o(g,0),q=o(g,1),r,s;for(r=g[0][0]-3;r<=p.end;r++)for(s=q.start+(1.7*(r-g[0][0])|0)-3;s<=q.end;s++)w(m,r,s,x(g[0],g[1],g[2],[r,s]));for(r=p.start;r<=g[0][0]-3;r++)for(s=q.start-(1.7*(r-g[0][0])|0)-3;s<=q.end;s++)w(m,r,s,x(g[0],g[1],g[2],[r,s]));l=a.t.getContext("2d"),l.putImageData(m,0,0);var t=l.createLinearGradient(0,q.start,0,q.end);t[h](1,"rgba(0,0,0,0)"),t[h](0,"rgba(0,0,0,1)"),l[j]=t,l[k]="destination-out",l[i](p.start,q.start,p.end,q.end),l[k]="source-over"}f=(1-b)*c.PI*2,g=E(a,f),e[j]=(new n({h:b,s:1,l:.5})).getHexString(),e[i](0,0,a.L,a.L),e.save(),e.translate(a.L/2,a.L/2),e.rotate(f+c.PI/2),e.translate(-a.L/2,-a.L/2),e.drawImage(a.t,0,0),e.restore(),e.beginPath(),e.moveTo(0,0),e.lineTo(g[1][0],g[1][1]),e.lineTo(g[0][0],g[0][1]),e.lineTo(g[2][0],g[2][1]),e.lineTo(g[1][0],g[1][1]),e.lineTo(0,0),e.lineTo(0,a.L),e.lineTo(a.L,a.L),e.lineTo(a.L,0),e.lineTo(0,0),e.closePath(),e[k]="destination-out",e[j]="rgba(0,0,0,1)",e.fill();var u=function(b,c){var d=1/(a.L/2)*2;return a.L/2*d+g[b][c]*(1-d)};e[k]="destination-over",e.beginPath(),e.moveTo(u(0,0),u(0,1)),e.lineTo(u(1,0),u(1,1)),e.lineTo(u(2,0),u(2,1)),e.closePath(),e[j]="rgba(0,0,0,1)",e.shadowColor=a.a.shadowColor,e.shadowBlur=a.a.shadow,e.fill(),e.shadowColor="rgba(0,0,0,0)",e.shadowBlur=0,e[k]="source-over"}function C(b){var d=b.s[3],e=d.getContext("2d");e.clearRect(0,0,b.L,b.L);var f=(1-b.Color.getHsl().h)*c.PI*2,g=E(b,f),h=p(b.H,f,b.L/2),i=[g[1][0]*b.Color.getHsl().l+(1-b.Color.getHsl().l)*g[2][0],g[1][1]*b.Color.getHsl().l+(1-b.Color.getHsl().l)*g[2][1]],j=s(g[1],g[2]),k=u(i,j),m=v(i,k,g[1],g[2]),n=t(g[1],g[2]),o=t(g[2],m),q=g[2];o>=n/2&&(q=g[1]);var r=v(i,k,g[0],q);i=[r[0]*b.Color.getHsl().s+(1-b.Color.getHsl().s)*m[0],r[1]*b.Color.getHsl().s+(1-b.Color.getHsl().s)*m[1]],a.each([h,i],function(a,b){e[l]="#fff",e.lineWidth=1.5,e.beginPath(),e.arc(b[0],b[1],6,0,c.PI*2,!0),e.closePath(),e.stroke(),e.lineWidth=2,e[l]="rgba(0,0,0,1)",e.beginPath(),e.arc(b[0],b[1],4.5,0,c.PI*2,!0),e.closePath(),e.stroke()})}function D(a,b){var c=b.getContext("2d");c.clearRect(0,0,b.width,b.height),a.n.css("border-bottom-color")?c[l]=a.n.css("border-bottom-color"):c[l]="#444",c.lineWidth=1,c.lineCap="round",c.beginPath(),c.moveTo(0,18),c.lineTo(18,0),c.moveTo(7,18),c.lineTo(18,7),c.moveTo(13,18),c.lineTo(18,13),c.closePath(),c.stroke()}function E(a,b){var d,e=[];for(d=0;d<3;d++)e[d]=p(a.r,b,a.L/2),b-=c.PI*2/3;return e}function F(a,b){var d=Y(a,b,a.d),e=c.atan2(d[0]-a.L/2,d[1]-a.L/2)*(180/c.PI)+270,f=a.Color.getHsla();a.Color.setColor({h:e/360,s:f.s,l:f.l,a:f.a}),B(a),C(a),a.D(a)}function G(a,b,c){var d=a.Color.getHsla();a.Color.setColor({h:d.h,s:b,l:c,a:d.a}),C(a),a.D(a)}function H(a){a.a.autosave&&I(a),a.a.preview&&a.j.find("div").css("background",a.Color.getRgbaString()),a.e.trigger(a.a.eventPrefix+"update")}function I(a){var b="";typeof a.a.color2str=="function"?b=a.a.color2str.call(null,a.Color):b=a.Color.getHexString(),typeof a.a.save=="function"?a.a.save.call(a.e[0],b):a.e.val(b).html(b)}function J(a,b){var c;typeof a.a.load=="function"?c=a.a.load.call(a.e):c=a.e.val()||a.e.html(),typeof a.a.str2color=="function"?a.Color=new n(a.a.str2color.call(null,c)):a.Color=new n(c),a.a.preview&&a.j&&a.j.find("div").css("background",a.Color.getRgbaString()),b&&(B(a),C(a))}function K(a,b){if(a.I){clearTimeout(a.I),a.I=0;return}a.z?(J(a),B(a),C(a)):P(a);if(typeof b!="undefined"){b=parseInt(b,10);if(b<0||isNaN(b))b=a.a.speed}else b=a.a.speed;var c=a.e.triggerHandler(a.a.eventPrefix+"beforeShow");if(typeof c=="undefined"||c){W(a),_(a);var d=a.K==="fade"?"fadeIn":"slideDown";a.n[d].call(a.n,b,function(){W(a),a.a.resizable&&D(a,a.l[0]),a.e.trigger(a.a.eventPrefix+"show")}),a.o&&a.o.setHeight(a.b.height())}}function L(a,b){a.I=setTimeout(function(){if(a.k&&a.k.find("select:focus").length)return;a.I=0;if(typeof b!="undefined"){b=parseInt(b,10);if(b<0||isNaN(b))b=a.a.speed}else b=a.a.speed;var c=a.e.triggerHandler(a.a.eventPrefix+"beforeHide");if(typeof c=="undefined"||c){var d=a.K==="fade"?"fadeOut":"slideUp";a.n[d].call(a.n,b,function(){W(a),a.e.trigger(a.a.eventPrefix+"hide")})}},100)}function M(a,b){var d=(1-a.Color.getHsl().h)*c.PI*2,e=E(a,d),f=Y(a,b,a.d),g=f;if(!r(f,e[0],e[1],e[2])){var h,i=[];for(h=0;h<3;h++)i[h]=t(e[h],f);var j=c.max.apply(null,i);for(h=0;h<3;h++)if(i[h]===j){g=N(f,e,i,h);break}}var k=O(e[0],e[1],e[2],g,a.Color.getHsl().h);G(a,k.s,k.l)}function N(a,b,d,e){var f=[0,1,2],g=[1,0,1],h=[2,2,0],i=v(a,b[f[e]],b[g[e]],b[h[e]]);if(t(i,b[f[e]])>=t(b[0],b[1])){var j,k=c.min.apply(null,d);for(j=0;j<3;j++)if(d[j]===k){i=b[j];break}}return i}function O(a,b,c,d,e){var f=s(b,c),g=u(d,f),h=v(d,g,b,c),i=t(b,c),j=t(c,h),k=c;j>=i/2&&(k=b),f=s(a,k),g=u(d,f);var l=v(d,h,a,k),m=t(h,d),n=t(h,l),o=m/n;return isNaN(o)&&(o=0),{h:e,s:o,l:j/i}}function P(a){A(a),B(a),C(a),a.z=1,a.e.trigger(a.a.eventPrefix+"ready")}function Q(a,b){var d=Y(a,b,a.d);if(a.a.panel||a.a.panelAlpha)d[0]-=a.o.getWidth();var e=V(a,c.max(d[0],d[1])+c.max(a.C[0],a.C[1]));R(a,e),a.e.trigger(a.a.eventPrefix+"resize")}function R(a,b){a.b.width(b).height(b+a.j.outerHeight()),a.a.panel||a.a.panelAlpha?(a.n.width(a.o.getWidth()+a.b.width()),a.o.setHeight(a.b.height())):a.n.width(a.b.width()),a.d.width(b).height(b),U(a,b),_(a)}function S(a,b){b!==a.L&&(a.z=0,a.L=b,a.r=b/2-15-a.a.ringwidth,a.G=a.a.ringwidth,a.H=a.L/2-a.G/2-10,a.s.each(function(){this.width=b,this.height=b}).add(a.b),a.t.width=b,a.t.height=b,R(a,b),P(a))}function T(a){a.preventDefault()}function U(a,b){if(a.a.roundcorners){b=b||a.L;var c="0px 0px 0px "+b/2+"px";!a.a.resizable&&!a.a.panel&&!a.a.panelAlpha&&(c="0px 0px "+b/2+"px "+b/2+"px"),a.n.css({"-webkit-border-radius":c,"border-radius":c})}}function V(a,b){return b|=0,a.a.maxWidth<a.a.minWidth&&(a.a.maxWidth=a.a.minWidth),b>a.a.maxWidth?b=a.a.maxWidth:b<a.a.minWidth&&(b=a.a.minWidth),b+=b%2,b}function W(c){var d=c.e.offset(),f=c.c.offset();if(!c.F){c.c.css({top:0,left:0});var g=a(e).scrollTop(),h=c.n.height(),i=d.top-g,j=g+a(b).height()-d.top-c.e.outerHeight();j<h&&i>j?(c.n.css({top:d.top-h}),c.l&&c.l.hide(),c.n.css({"-webkit-border-radius":"","border-radius":""})):(c.n.css({top:d.top+c.e.outerHeight()}),c.l&&c.l.show(),U(c));var k=a(e).scrollLeft(),l=d.left-k-2,m=d.left+c.n.width()-(k+a(b).width());if(m>0&&l>0){var n=2;l<m?n+=l:n+=m,c.n.css({left:d.left-n})}else c.n.css({left:d.left})}c.e.is(":visible")?(c.f.show().css("top",d.top-f.top+(c.e.outerHeight()-c.f.height())/2),c.a.iconpos==="left"?c.f.css("left",d.left-f.left-c.f.outerWidth()-2):c.f.css("left",d.left-f.left+c.e.outerWidth()+2)):c.f.hide()}function X(b,c){var e=d[b],f,h=["rgb","hsl","cmyk"];if(typeof c!="undefined")if(b==="panelMode")a.inArray(c,h)&&(e=c);else if(b==="panelModes")a.each(c,function(b,d){a.inArray(d,h)||delete c[b]}),e=c;else if(b==="panelChannelWidth")f=parseInt(c)||0,f>=10&&f<=40&&(e=f+f%2);else if(b==="panelChannelMargin")f=parseInt(c)||0,f>=0&&f<=50&&(e=f+f%2);else if(b==="panel"||b==="panelAlpha")e=!!c;else if(b==="shadowColor"&&typeof c=="string"&&c.length)e=(new n(c)).getRgbaString();else if(b==="effect")e=c==="slide"?"slide":"fade";else if(b==="iconpos")e=c==="left"?"left":"right";else if(b==="target"){e=null;if(typeof c=="string"||typeof c=="object"){var i=a(c);i&&typeof i[0]=="object"&&(e=i)}}else b==="icon"&&typeof c=="string"&&c.length?e=c:b==="iconalt"&&typeof c=="string"&&c.length?e=c:b==="pickerClass"&&typeof c=="string"&&c.length?e=c:b.match(/^autoshow|autosave|resizable|preview|roundcorners$/)?e=!!c:b.match(/^minWidth|maxWidth$/)?(f=parseInt(c,10)||0,e=f>100?f:100):b.match(/^speed|width|shadow|ringwidth$/)?(f=parseInt(c,10)||0,e=f>0?f:0):(new RegExp("^"+g+"$")).test(b)||/^save|load|str2color|color2str$/.test(b)?typeof c=="function"&&(e=c):b==="eventPrefix"&&typeof c=="string"&&/^\w*$/.test(c)&&(e=c);return e}function Y(a,b,c){var d=0,f=0,g=b.originalEvent,h=g.touches||g.changedTouches,i,j;a?(i=c.parent().offset(),j=a.j.outerHeight()):(i=c.offset(),j=0);if(h)d=h[0].pageX-i.left,f=h[0].pageY-i.top-j;else if(b.pageX){var k=g.clientX+e.body.scrollLeft,l=g.clientY+e.body.scrollTop;e.documentElement&&(k+=e.documentElement.scrollLeft,l+=e.documentElement.scrollTop),d=k-i.left,f=l-i.top-j}return[d,f]}function Z(a){return a.n.width()}function $(a){return a.n.height()}function _(a){var b=a.i.height();a.g.height(b),a.h.css("top","-"+b+"px").height(b);var c=a.g[0].getContext("2d");a.g[0].height=b,a.g[0].width=500,a.g.css("width","500px");var d=e.createElement("canvas");d.height=10,d.width=10;var f=d.getContext("2d");f[j]="#ccc",f[i](0,0,10,10),f[j]="#888",f[i](0,0,5,5),f[i](5,5,5,5);var g=c.createPattern(d,"repeat");c[j]=g,c[i](0,0,a.L,b)}function ab(a,b){return a.each(b)}"use strict";var e=b.document,f="chromoselector",g="create|ready|update|destroy|show|beforeShow|hide|beforeHide|resize|resizeStart|resizeStop",h="addColorStop",i="fillRect",j="fillStyle",k="globalCompositeOperation",l="strokeStyle",m=function(){return function(a,b){b=b||4;var c,d,e,f=function(){e?(a.apply({},d),e=0,c=setTimeout(f,b)):c=0};return function(){d=arguments,e=1,c||f()}}}(),n=function(){function b(a){var b=this,c={r:0,g:0,b:0,a:1},r={h:0,s:0,l:0,a:1},s=!1;b.getRgba=function(){return c},b.getRgb=function(){return d(c)},b.getHsla=function(){return s?r:g(c)},b.getHsl=function(){return s?f(r):e(c)},b.getCmyk=function(){return h(c)},b.getRgbaString=function(){return j(c)},b.getRgbString=function(){return i(c)},b.getHexaString=function(){return l(c)},b.getHexString=function(){return k(c)},b.getHslaString=function(){return n(c)},b.getHslString=function(){return m(c)},b.getCmykString=function(){return o(c)},b.getTextColor=function(){return p(c)},b.setColor=function(a){var d=q(a,c,r,s);return c=d.rgba,r=d.hsla,s=d.isHsl,b},b.setAlpha=function(a){return a=parseFloat(a),!isNaN(a)&&a>=0&&a<=1&&(c.a=a,r.a=a),b},b.getAlpha=function(){return c.a},b.setColor(a)}function d(a){var b={};return b.r=a.r,b.g=a.g,b.b=a.b,b}function e(a){var b={},c=w(a);return b.h=c.h,b.s=c.s,b.l=c.l,b}function f(a){var b={};return b.h=a.h,b.s=a.s,b.l=a.l,b}function g(a){return w(a)}function h(a){return y(a)}function i(b){return"rgb("+a(b.r*255)+","+a(b.g*255)+","+a(b.b*255)+")"}function j(b){return"rgba("+a(b.r*255)+","+a(b.g*255)+","+a(b.b*255)+","+a(b.a*100)/100+")"}function k(a){return t(a)}function l(b){var c=a(b.a*255),d=c.toString(16);return c<16&&(d="0"+d),t(b)+d}function m(b){var c=w(b);return"hsl("+a(c.h*360)+","+a(c.s*100)+"%,"+a(c.l*100)+"%)"}function n(b){var c=w(b);return"hsla("+a(c.h*360)+","+a(c.s*100)+"%,"+a(c.l*100)+"%,"+a(c.a*100)/100+")"}function o(b){var c=y(b);return"device-cmyk("+a(c.c*100)/100+","+a(c.m*100)/100+","+a(c.y*100)/100+","+a(c.k*100)/100+")"}function p(a){var c=a.r*.2126+a.g*.7152+a.b*.0722;return new b(c<.35?"#fff":"#000")}function q(a,d,e,f){var g,h,i,j;if(typeof a=="string"){a=a.replace(/\s+/g,"");if(/^#/.test(a))/^#([0-9a-f]{3}){1,2}$/i.test(a)?(a.length===4&&(a=a.replace(/[0-9a-f]/gi,r)),d=u(a),d.a=1,f=!1):/^#([0-9a-f]{4}){1,2}$/i.test(a)&&(a.length===5&&(a=a.replace(/[0-9a-f]/gi,r)),d=v(a),f=!1);else if(/^rgba/.test(a)){g=a.match(/^rgba\((\d+%?),(\d+%?),(\d+%?),(\.\d+|\d+\.?\d*)\)$/);if(g&&g.length===5){g.shift(),i=g.pop()/1,i>1?i=1:i<0&&(i=0);for(h=0;h<g.length;h++)g[h].indexOf("%")!==-1?g[h]=g[h].substr(0,g[h].length-1)/100:g[h]=g[h]/255,g[h]>1?g[h]=1:g[h]<0&&(g[h]=0);d.r=g[0],d.g=g[1],d.b=g[2],d.a=i,f=!1}}else if(/^rgb/.test(a)){g=a.match(/^rgb\((\d+%?),(\d+%?),(\d+%?)\)$/);if(g&&g.length===4){g.shift();for(h=0;h<g.length;h++)g[h].indexOf("%")!==-1?g[h]=g[h].substr(0,g[h].length-1)/100:g[h]=g[h]/255,g[h]>1?g[h]=1:g[h]<0&&(g[h]=0);d.r=g[0],d.g=g[1],d.b=g[2],d.a=1,f=!1}}else if(/^hsla/.test(a)){g=a.match(/^hsla\((\d+),(\d+%),(\d+%),(\.\d+|\d+\.?\d*)\)$/);if(g&&g.length===5){g.shift(),j=g.shift()/360,j-=c.floor(j),j<0&&(j=1+j),i=g.pop()/1,i>1?i=1:i<0&&(i=0);if(g.length===2){for(h=0;h<g.length;h++)g[h]=g[h].substr(0,g[h].length-1)/100,g[h]>1?g[h]=1:g[h]<0&&(g[h]=0);f=!0,e={h:j,s:g[0],l:g[1],a:i}}}}else if(/^hsl/.test(a)){g=a.match(/^hsl\((\d+),(\d+%),(\d+%)\)$/);if(g&&g.length===4){g.shift(),j=g.shift()/360,j-=c.floor(j),j<0&&(j=1+j);for(h=0;h<g.length;h++)g[h]=g[h].substr(0,g[h].length-1)/100,g[h]>1?g[h]=1:g[h]<0&&(g[h]=0);f=!0,e={h:j,s:g[0],l:g[1],a:1}}}else if(/^device-cmyk/.test(a)){g=a.match(/^device-cmyk\((\.\d+|\d+\.?\d*),(\.\d+|\d+\.?\d*),(\.\d+|\d+\.?\d*),(\.\d+|\d+\.?\d*)\)$/);if(g&&g.length===5){g.shift();for(h=0;h<g.length;h++)g[h]=g[h]/1,g[h]>1?g[h]=1:g[h]<0&&(g[h]=0);d=z({c:g[0],m:g[1],y:g[2],k:g[3]}),f=!1}}}else if(a instanceof b){var k=a.getRgba();s(a,"rgba")&&(d=k,f=!1)}else if(typeof a=="object"){for(h in a)a.hasOwnProperty(h)&&(a[h]=parseFloat(a[h]));s(a,"sl")&&!isNaN(a.h)?(f=!0,a.h=a.h-c.floor(a.h),a.h<0&&(a.h=1+a.h),e=a,i=1,s(a,"a")&&(i=a.a),e.a=i):s(a,"rgb")?(d=a,i=1,s(a,"a")&&(i=a.a),d.a=i,f=!1):s(a,"cmyk")&&(d=z(a),d.a=1,f=!1)}return f?{rgba:x(e),hsla:e,isHsl:f}:{rgba:d,hsla:w(d),isHsl:f}}function r(a){return a+a}function s(a,b){var c,d,e=b.split("");for(c in e)if(e.hasOwnProperty(c)){d=parseFloat(a[b[c]]);if(isNaN(d)||d<0||d>1)return 0}return 1}function t(b){var c,d,e="",f=0;for(;f<3;f++)d=a(b[["r","g","b"][f]]*255),c=d.toString(16),d<16&&(c="0"+c),e+=c;return"#"+e}function u(a){var b=0,c={};for(;b<3;b++)c[b]=parseInt("0x"+a.substring(b*2+1,b*2+3),16)/255;return{r:c[0],g:c[1],b:c[2]}}function v(a){var b=0,c={};for(;b<4;b++)c[b]=parseInt("0x"+a.substring(b*2+1,b*2+3),16)/255;return{r:c[0],g:c[1],b:c[2],a:c[3]}}function w(a){var b=a.r,d=a.g,e=a.b,f=c.max(b,d,e),g=c.min(b,d,e),h,i,j=(f+g)/2;if(f===g)h=i=0;else{var k=f-g;i=j>.5?k/(2-f-g):k/(f+g);switch(f){case b:h=(d-e)/k+(d<e?6:0);break;case d:h=(e-b)/k+2;break;case e:h=(b-d)/k+4}h/=6}return{h:h,s:i,l:j,a:a.a}}function x(a){var b,c,d;if(a.s===0)b=c=d=a.l;else{var e=function(a,b,c){return c<0?c+=1:c>1&&(c-=1),c<1/6?a+(b-a)*6*c:c<.5?b:c<2/3?a+(b-a)*(2/3-c)*6:a},f;a.l<.5?f=a.l*(1+a.s):f=a.l+a.s-a.l*a.s;var g=2*a.l-f;b=e(g,f,a.h+1/3),c=e(g,f,a.h),d=e(g,f,a.h-1/3)}return{r:b,g:c,b:d,a:a.a}}function y(a){if(a.r===a.g&&a.g===a.b)return{c:0,m:0,y:0,k:1-a.r};var b=c.min(1-a.r,1-a.g,1-a.b);return{c:(1-a.r-b)/(1-b),m:(1-a.g-b)/(1-b),y:(1-a.b-b)/(1-b),k:b}}function z(a){return{r:1-c.min(1,a.c*(1-a.k)+a.k),g:1-c.min(1,a.m*(1-a.k)+a.k),b:1-c.min(1,a.y*(1-a.k)+a.k),a:1}}var a=c.round;return b}(),o=function(){return function(d,g,k,o,p,q,r,s,t,u,v){var w=this,x=function(){var a=K;return o&&(a+=r+s),p?K+r:N==="cmyk"?a+r*4+s*3:a+r*3+s*2},y=function(b,c,d){var e=a.extend({},b);return e[c]=d,new n(e)},z=function(){return ab.createLinearGradient(0,W-r/2-10,0,r/2+10)},A=function(a,b){L=z(),L[h](0,a.getHexString()),L[h](1,b.getHexString()),ab[l]=L},B=function(){L=z(),L[h](0,"#f00"),L[h](1/6,"#ff0"),L[h](2/6,"#0f0"),L[h](.5,"#0ff"),L[h](4/6,"#00f"),L[h](5/6,"#f0f"),L[h](1,"#f00"),ab[l]=L},C=function(a){L=z(),L[h](0,"#000"),L[h](.5,a.getHexString()),L[h](1,"#fff"),ab[l]=L},D=function(a){L=z(),L[h](0,a.getHexString()),L[h](1,"#000"),ab[l]=L},E=function(){ab.clearRect(0,0,x(),W),H();var b,c,d,f,g,k,m=10,q=0,t=function(){ab.beginPath(),ab.moveTo(m+r/2,r/2+10),ab.lineTo(m+r/2,W-r/2-10),ab.lineWidth=r,ab.lineCap="round",ab.stroke()};if(o){var u=e.createElement("canvas");u.height=10,u.width=10;var v=u.getContext("2d");v[j]="#ccc",v[i](0,0,10,10),v[j]="#888",v[i](0,0,5,5),v[i](5,5,5,5);var w=ab.createPattern(u,"repeat");ab[l]=w,t(),L=z(),L[h](0,(new n(M)).setAlpha(0).getRgbaString()),L[h](1,M.getHexString()),ab[l]=L,t(),m+=r+s,q=1}p?F():N==="rgb"?(a.each(O,function(a,b){c=y(M.getRgb(),b,0),d=y(M.getRgb(),b,1),A(c,d),t(),m+=r+s,q++}),F(M.getRgb())):N==="hsl"?(B(),t(),q++,m+=r+s,c=y(M.getHsl(),"s",0),d=y(M.getHsl(),"s",1),A(c,d),t(),q++,m+=r+s,f=a.extend({},M.getHsl()),f.l=.5,C(new n(f)),t(),F(M.getHsl())):N==="cmyk"&&(a.each("cmy".split(""),function(a,b){c=y(M.getCmyk(),b,0),d=y(M.getCmyk(),b,1),A(c,d),t(),m+=r+s,q++}),g=a.extend({},M.getCmyk()),g.k=0,g=new n(g),D(g),t(),F(M.getCmyk()))},F=function(b){var d=10,e,f,g,h,i=function(a,b,d){ab[l]=a,ab.lineWidth=b,ab.beginPath(),ab.arc(f,g,d,0,c.PI*2,!0),ab.closePath(),ab.stroke()};o&&(f=d+r/2,h=W-r-20,g=h-h*M.getAlpha()+r/2+10,d+=r+s,i("#fff",1.5,6),i("#000",2,4.5)),p||a.each(b,function(a,b){f=d+r/2,h=W-r-20,g=h-h*b+r/2+10,i("#fff",1.5,6),i("#000",2,4.5),d+=r+s})},G=function(a){ab.shadowColor=v,ab.shadowBlur=u,ab.beginPath(),ab.moveTo(a,r/2+10),ab.lineTo(a,W-r/2-10),ab.lineWidth=r-2,ab[l]="rgba(0,0,0,1)",ab.lineCap="round",ab.stroke(),ab.shadowBlur=0},H=function(){if(u>0){var b,c=10,d;o&&(b=c+r/2,G(b),c+=r+s),p||a.each(O,function(){b=c+r/2,G(b),c+=r+s})}},I=function(){var b=0;o||p?Z.append(a("<div />").text("A").width(r).css({"padding-left":10})):p||(Z.append(a("<div />").text(O[0].toUpperCase()).width(r).css({"padding-left":10})),b++);if(!p)for(;b<O.length;b++)Z.append(a("<div />").text(O[b].toUpperCase()).width(r).css({"padding-left":s}))},J=m(function(a){var b=Y(!1,a,X),e=W-r-K,g=e-c.round(b[1]-r/2-K/2);g<0?g=0:g>e&&(g=e);var h=g/e;if(o&&Q===0)M.setAlpha(h);else if(!p){var i=Q;o&&i--;var j="get"+N.charAt(0).toUpperCase()+N.slice(1),k=M[j]();k[O[i]]=h,k.a=M.getAlpha(),M=new n(k)}E(),d.trigger(f)});w.getColor=function(){return M},w.getWidth=function(){return x()},w.setAlpha=function(a){return M.setAlpha(a),w},w.setColor=function(a){return M=new n(a),E(),w},w.setHeight=function(a){return ab.clearRect(0,0,x(),W),$=Z.outerHeight(!0),U.width(x()-20),W=a-U.outerHeight(!0)-$,X.attr("height",W),E(),w},w.setMode=function(b){return a.inArray(b,S)>=0&&(U.val(b),N=b,O=b.split(""),X.attr("width",x()),E(),t&&(Z.width(x()).children().remove(),I()),U.width(x()-20)),w};var K=20,L,M=new n,N="rgb",O=N.split(""),P=0,Q=0,R=0,S=["rgb","hsl","cmyk"],U=a("<select/>");if(!p&&k.length){var V="<option/>";a.each(k,function(b,c){U.append(a(V).html(c))}),d.append(U),R=U.outerHeight(!0)}var W=q-R,X=a("<canvas/>").attr("width",x()).attr("height",W).css("display","block");d.append(X);var Z=a(),$=0;t&&(Z=a("<div />").addClass("ui-panel-labels").width(x()),I(),d.append(Z));var _=X[0],ab=_.getContext("2d");w.setMode(g),p||U.change(function(){w.setMode(a(":selected",this).val())}),d.add(Z.find("div")).bind("mousedown touchstart",function(b){a(this).is(b.target)&&T(b)}),X.bind("mousedown touchstart",function(b){T(b),Q=0;var c=10,d=Y(!1,b,a(this));while(Q<5&&!P)d[0]>c&&d[0]<c+r?(P=1,J(b)):(Q++,c+=r+s)}).bind("mousemove touchmove",function(a){var b=Y(!1,a,X),c=X.width(),d=K/2;if(b[0]>d&&b[1]>d&&b[0]<c-d&&b[1]<X.height()-d){var e=d;while(e<c){if(b[0]>e&&b[0]<r+e){X.css("cursor","crosshair");break}X.css("cursor",""),e+=r+s}}else X.css("cursor","")}),a([b,e]).bind("mousemove touchmove",function(a){P&&(T(a),J(a))}).bind("mouseup touchend",function(a){P&&(T(a),P=0,J(a))})}}(),y={},bb=function(d,g){var h=this;h.z=0,h.a=g,h.w=0,h.u=m(F),h.y=0,h.x=m(M),h.B=0,h.A=m(Q),h.D=m(H,100),h.E=m(function(a,b){a.Color.setColor(b),B(a),C(a),a.D(a)}),h.a.ringwidth>h.a.minWidth/4&&(h.a.ringwidth=c.floor(h.a.minWidth/4)),h.I=0,h.e=d,J(h),h.L=V(h,h.a.width),h.G=h.a.ringwidth,h.H=h.L/2-h.G/2-10,h.r=h.L/2-15-h.a.ringwidth;var i='<canvas width="'+h.L+'" height="'+h.L+'"></canvas>',j="";h.a.target&&h.a.target.length?(h.F=1,h.c=h.a.target,j="ui-cs-static"):(h.F=0,h.c=a("<div/>").prependTo("body").css({width:0,height:0,position:"absolute",overflow:"visible"})),h.d=a("<div/>").addClass("ui-cs-widget").css({position:"relative"}).width(h.L).height(h.L).html(i+i+i+i),h.b=a("<div/>").append(h.d).width(h.L).addClass("ui-cs-container"),h.m=a("<div/>").addClass("ui-cs-supercontainer").append(h.b),h.n=a("<div/>").addClass("ui-cs-chromoselector").addClass(h.a.pickerClass).addClass(j).append(h.m);if(h.a.panel||h.a.panelAlpha)h.k=a("<div/>").addClass("ui-cs-panel"),h.m.append(h.k),h.o=new o(h.k,h.a.panelMode,h.a.panelModes,h.a.panelAlpha,!h.a.panel,100,h.a.panelChannelWidth,h.a.panelChannelMargin,!0,h.a.shadow,h.a.shadowColor),h.o.setColor(h.Color.getRgba()),h.k.bind(f,function(){h.E(h,h.o.getColor().getHsla())}),h.e.bind(h.a.eventPrefix+"update",function(){h.o.setColor(h.Color.getHsla())}),h.k.find("select").blur(function(){L(h)}).change(function(){h.n.width(h.o.getWidth()+h.b.width())});h.a.icon?(h.f=a("<a/>",{href:"#",tabindex:"999"}).addClass("ui-cs-icon").css("position","absolute").append(a("<img/>",{alt:h.a.iconalt,src:h.a.icon}).load(function(){a(this).parent().height(a(this).height()),a(this).parent().width(a(this).width()),W(h)})),h.c.append(h.f)):h.f=a([]),h.a.resizable&&(h.l=a("<canvas />").height(20).width(20).attr("height",20).attr("width",20).addClass("ui-cs-resizer").css({position:"absolute",bottom:"0px",right:"0px"}),D(h,h.l[0]),h.m.append(h.l)),h.m.append(a("<div/>").css("clear","both")),h.i=a("<div/>").addClass("ui-cs-preview-widget").css("overflow","hidden").css("background",h.Color.getRgbaString());var k=new n(h.a.shadowColor);k.setAlpha(k.getAlpha()-.1);var l="0 0 "+c.max(0,h.a.shadow-2)+"px 0 "+k.getRgbaString();h.j=a("<div/>").addClass("ui-cs-preview-container").append(h.i.append(a("<canvas/>").css({display:"block"})).css("box-shadow",l).css("-webkit-box-shadow",l)),h.a.preview&&h.b.prepend(h.j),h.h=a("<div/>").addClass("ui-cs-preview-color").css("width","100%").css("background-color",h.Color.getRgbaString()).css("position","relative"),h.i.append(h.h),h.g=h.i.find("canvas"),_(h),U(h),h.d.height(h.L).add(h.b).width(h.L),h.a.panel||h.a.panelAlpha?h.n.width(h.o.getWidth()+h.b.width()):h.n.width(h.b.width()),h.c.append(h.n.hide()),h.s=h.d.find("canvas").css({position:"absolute",width:"100%",height:"100%"}),h.t=a(i)[0],h.K="fade",h.a.effect==="slide"&&(h.K="slide");if(h.a.autoshow){h.a.lazy?h.e.bind("mouseover."+f,function(){h.z||P(h),h.e.unbind("mouseover."+f)}):P(h);var p=h.e;h.f.length&&(p=h.f),p.bind("focus click",function(a){T(a),h.z||P(h),K(h)}).blur(function(){L(h)}),h.e.keydown(function(a){a.keyCode===27&&L(h)})}h.e.keyup(function(){h.e.trigger(h.a.eventPrefix+"update"),J(h),B(h),C(h)}),h.a.resizable&&h.l.bind("mousedown touchstart",function(a){T(a);var b=Y(h,a,h.d);h.e.trigger(h.a.eventPrefix+"resizeStart"),h.B=1,h.C=[h.L-b[0],h.L-b[1]]}),h.b.bind("mousedown touchstart",function(a){T(a);var b=Y(h,a,h.d);if(q(b,h.L/2,h.H+h.G)&&!q(b,h.L/2,h.H-h.G))h.w=1,h.u(h,a);else{var d=(1-h.Color.getHsl().h)*c.PI*2,e=E(h,d);r(b,e[0],e[1],e[2])&&(h.y=1,h.x(h,a))}}).bind("mousemove touchmove",function(a){var b=Y(h,a,h.d);if(q(b,h.L/2,h.H+h.G/2)&&!q(b,h.L/2,h.H-h.G/2))h.d.css("cursor","crosshair");else{var d=(1-h.Color.getHsl().h)*c.PI*2,e=E(h,d);r(b,e[0],e[1],e[2])?h.d.css("cursor","crosshair"):h.d.css("cursor","")}}),a([b,e]).bind("mousemove touchmove",function(a){h.w?(T(a),h.u(h,a)):h.y?(T(a),h.x(h,a)):h.B&&(T(a),h.A(h,a))}).bind("mouseup touchend",function(a){h.w?(T(a),h.w=0,F(h,a)):h.y?(T(a),h.y=0,M(h,a)):h.B&&(T(a),h.B=0,S(h,h.d.width()),W(h),h.e.trigger(h.a.eventPrefix+"resizeStop"))}).bind("resize scroll",function(a){(a.target===b||a.target===e)&&W(h)}),setTimeout(function(){W(h)},4)},cb={init:function(b){var c={};return b=b?b:{},a.each(d,function(a){c[a]=X(a,b[a])}),ab(this,function(){var b=a(this);if(!b.data(f)){b.data(f,new bb(b,c));var d=g.split("|");a.each(d,function(a){var e=d[a],g=c[e];typeof g=="function"&&b.bind(c.eventPrefix+e+"."+f,g)}),b.trigger(c.eventPrefix+"create")}})},show:function(b){return ab(this,function(){K(a(this).data(f),b)})},hide:function(b){return ab(this,function(){L(a(this).data(f),b)})},save:function(){return ab(this,function(){I(a(this).data(f))})},load:function(){return ab(this,function(){J(a(this).data(f),1)})},setColor:function(b){return ab(this,function(){var c=a(this).data(f);c.E(c,b)})},getColor:function(){return this.data(f).Color},getWidth:function(){return Z(a(this).data(f))},getHeight:function(){return $(a(this).data(f))},resize:function(b){return ab(this,function(){var c=a(this).data(f);c.e.trigger(c.a.eventPrefix+"resizeStart"),S(c,b),W(c),c.e.trigger(c.a.eventPrefix+"resize").trigger(c.a.eventPrefix+"resizeStop")})},reflow:function(){return ab(this,function(){W(a(this).data(f))})},api:function(){var a={},b=this;return a.show=function(a){return cb.show.call(b,a),this},a.hide=function(a){return cb.hide.call(b,a),this},a.save=function(){return cb.save.call(b),this},a.load=function(){return cb.load.call(b),this},a.getColor=function(){return cb.getColor.call(b)},a.getWidth=function(){return cb.getWidth.call(b)},a.getHeight=function(){return cb.getHeight.call(b)},a.setColor=function(a){return cb.setColor.call(b,a),this},a.destroy=function(){cb.destroy.call(b)},a.resize=function(a){return cb.resize.call(b,a),this},a.reflow=function(){return cb.reflow.call(b),this},a},destroy:function(){return ab(this,function(){var b=a(this).data(f);b.F?b.b.siblings().length?b.b.remove():b.c.remove():b.c.remove(),a(this).removeData(f).trigger(b.a.eventPrefix+"destroy").unbind("."+f)})}};a.fn[f]=function(b){var c=1;try{var d=e.createElement("canvas"),g=d.getContext("2d");g.createImageData(5,5)}catch(h){c=0}if(!c)return b==="getColor"?new n:b==="getWidth"||b==="getHeight"?0:this;if(cb[b])return cb[b].apply(this,Array.prototype.slice.call(arguments,1));if(typeof b=="object"||!b)return cb.init.apply(this,arguments);a.error("Method "+b+" does not exist on jQuery."+f)},a.fn[f].defaults=function(a,b){return typeof b=="undefined"?d[a]:(d[a]=X(a,b),this)},a.fn[f].Color=n})(jQuery,window,Math,{autoshow:!0,autosave:!0,pickerClass:"",speed:400,minWidth:120,maxWidth:400,width:180,ringwidth:18,resizable:!0,shadow:6,shadowColor:"rgba(0,0,0,0.6)",preview:!0,panel:!1,panelAlpha:!1,panelChannelWidth:18,panelChannelMargin:12,panelMode:"rgb",panelModes:["rgb","hsl","cmyk"],roundcorners:!0,effect:"fade",icon:null,iconalt:"Open Color Picker",iconpos:"right",lazy:!0,target:null,eventPrefix:"",create:null,ready:null,destroy:null,update:null,beforeShow:null,show:null,beforeHide:null,hide:null,resize:null,resizeStart:null,resizeStop:null,save:null,load:null,str2color:null,color2str:null});/*!
 * Bootstrap v3.0.1 by @fat and @mdo
 * Copyright 2013 Twitter, Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0
 *
 * Designed and built with all the love in the world by @mdo and @fat.
 */

if("undefined"==typeof jQuery)throw new Error("Bootstrap requires jQuery");+function(a){"use strict";function b(){var a=document.createElement("bootstrap"),b={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var c in b)if(void 0!==a.style[c])return{end:b[c]}}a.fn.emulateTransitionEnd=function(b){var c=!1,d=this;a(this).one(a.support.transition.end,function(){c=!0});var e=function(){c||a(d).trigger(a.support.transition.end)};return setTimeout(e,b),this},a(function(){a.support.transition=b()})}(window.jQuery),+function(a){"use strict";var b='[data-dismiss="alert"]',c=function(c){a(c).on("click",b,this.close)};c.prototype.close=function(b){function c(){f.trigger("closed.bs.alert").remove()}var d=a(this),e=d.attr("data-target");e||(e=d.attr("href"),e=e&&e.replace(/.*(?=#[^\s]*$)/,""));var f=a(e);b&&b.preventDefault(),f.length||(f=d.hasClass("alert")?d:d.parent()),f.trigger(b=a.Event("close.bs.alert")),b.isDefaultPrevented()||(f.removeClass("in"),a.support.transition&&f.hasClass("fade")?f.one(a.support.transition.end,c).emulateTransitionEnd(150):c())};var d=a.fn.alert;a.fn.alert=function(b){return this.each(function(){var d=a(this),e=d.data("bs.alert");e||d.data("bs.alert",e=new c(this)),"string"==typeof b&&e[b].call(d)})},a.fn.alert.Constructor=c,a.fn.alert.noConflict=function(){return a.fn.alert=d,this},a(document).on("click.bs.alert.data-api",b,c.prototype.close)}(window.jQuery),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d)};b.DEFAULTS={loadingText:"loading..."},b.prototype.setState=function(a){var b="disabled",c=this.$element,d=c.is("input")?"val":"html",e=c.data();a+="Text",e.resetText||c.data("resetText",c[d]()),c[d](e[a]||this.options[a]),setTimeout(function(){"loadingText"==a?c.addClass(b).attr(b,b):c.removeClass(b).removeAttr(b)},0)},b.prototype.toggle=function(){var a=this.$element.closest('[data-toggle="buttons"]');if(a.length){var b=this.$element.find("input").prop("checked",!this.$element.hasClass("active")).trigger("change");"radio"===b.prop("type")&&a.find(".active").removeClass("active")}this.$element.toggleClass("active")};var c=a.fn.button;a.fn.button=function(c){return this.each(function(){var d=a(this),e=d.data("bs.button"),f="object"==typeof c&&c;e||d.data("bs.button",e=new b(this,f)),"toggle"==c?e.toggle():c&&e.setState(c)})},a.fn.button.Constructor=b,a.fn.button.noConflict=function(){return a.fn.button=c,this},a(document).on("click.bs.button.data-api","[data-toggle^=button]",function(b){var c=a(b.target);c.hasClass("btn")||(c=c.closest(".btn")),c.button("toggle"),b.preventDefault()})}(window.jQuery),+function(a){"use strict";var b=function(b,c){this.$element=a(b),this.$indicators=this.$element.find(".carousel-indicators"),this.options=c,this.paused=this.sliding=this.interval=this.$active=this.$items=null,"hover"==this.options.pause&&this.$element.on("mouseenter",a.proxy(this.pause,this)).on("mouseleave",a.proxy(this.cycle,this))};b.DEFAULTS={interval:5e3,pause:"hover",wrap:!0},b.prototype.cycle=function(b){return b||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(a.proxy(this.next,this),this.options.interval)),this},b.prototype.getActiveIndex=function(){return this.$active=this.$element.find(".item.active"),this.$items=this.$active.parent().children(),this.$items.index(this.$active)},b.prototype.to=function(b){var c=this,d=this.getActiveIndex();return b>this.$items.length-1||0>b?void 0:this.sliding?this.$element.one("slid",function(){c.to(b)}):d==b?this.pause().cycle():this.slide(b>d?"next":"prev",a(this.$items[b]))},b.prototype.pause=function(b){return b||(this.paused=!0),this.$element.find(".next, .prev").length&&a.support.transition.end&&(this.$element.trigger(a.support.transition.end),this.cycle(!0)),this.interval=clearInterval(this.interval),this},b.prototype.next=function(){return this.sliding?void 0:this.slide("next")},b.prototype.prev=function(){return this.sliding?void 0:this.slide("prev")},b.prototype.slide=function(b,c){var d=this.$element.find(".item.active"),e=c||d[b](),f=this.interval,g="next"==b?"left":"right",h="next"==b?"first":"last",i=this;if(!e.length){if(!this.options.wrap)return;e=this.$element.find(".item")[h]()}this.sliding=!0,f&&this.pause();var j=a.Event("slide.bs.carousel",{relatedTarget:e[0],direction:g});if(!e.hasClass("active")){if(this.$indicators.length&&(this.$indicators.find(".active").removeClass("active"),this.$element.one("slid",function(){var b=a(i.$indicators.children()[i.getActiveIndex()]);b&&b.addClass("active")})),a.support.transition&&this.$element.hasClass("slide")){if(this.$element.trigger(j),j.isDefaultPrevented())return;e.addClass(b),e[0].offsetWidth,d.addClass(g),e.addClass(g),d.one(a.support.transition.end,function(){e.removeClass([b,g].join(" ")).addClass("active"),d.removeClass(["active",g].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger("slid")},0)}).emulateTransitionEnd(600)}else{if(this.$element.trigger(j),j.isDefaultPrevented())return;d.removeClass("active"),e.addClass("active"),this.sliding=!1,this.$element.trigger("slid")}return f&&this.cycle(),this}};var c=a.fn.carousel;a.fn.carousel=function(c){return this.each(function(){var d=a(this),e=d.data("bs.carousel"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c),g="string"==typeof c?c:f.slide;e||d.data("bs.carousel",e=new b(this,f)),"number"==typeof c?e.to(c):g?e[g]():f.interval&&e.pause().cycle()})},a.fn.carousel.Constructor=b,a.fn.carousel.noConflict=function(){return a.fn.carousel=c,this},a(document).on("click.bs.carousel.data-api","[data-slide], [data-slide-to]",function(b){var c,d=a(this),e=a(d.attr("data-target")||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,"")),f=a.extend({},e.data(),d.data()),g=d.attr("data-slide-to");g&&(f.interval=!1),e.carousel(f),(g=d.attr("data-slide-to"))&&e.data("bs.carousel").to(g),b.preventDefault()}),a(window).on("load",function(){a('[data-ride="carousel"]').each(function(){var b=a(this);b.carousel(b.data())})})}(window.jQuery),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.transitioning=null,this.options.parent&&(this.$parent=a(this.options.parent)),this.options.toggle&&this.toggle()};b.DEFAULTS={toggle:!0},b.prototype.dimension=function(){var a=this.$element.hasClass("width");return a?"width":"height"},b.prototype.show=function(){if(!this.transitioning&&!this.$element.hasClass("in")){var b=a.Event("show.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.$parent&&this.$parent.find("> .panel > .in");if(c&&c.length){var d=c.data("bs.collapse");if(d&&d.transitioning)return;c.collapse("hide"),d||c.data("bs.collapse",null)}var e=this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[e](0),this.transitioning=1;var f=function(){this.$element.removeClass("collapsing").addClass("in")[e]("auto"),this.transitioning=0,this.$element.trigger("shown.bs.collapse")};if(!a.support.transition)return f.call(this);var g=a.camelCase(["scroll",e].join("-"));this.$element.one(a.support.transition.end,a.proxy(f,this)).emulateTransitionEnd(350)[e](this.$element[0][g])}}},b.prototype.hide=function(){if(!this.transitioning&&this.$element.hasClass("in")){var b=a.Event("hide.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight,this.$element.addClass("collapsing").removeClass("collapse").removeClass("in"),this.transitioning=1;var d=function(){this.transitioning=0,this.$element.trigger("hidden.bs.collapse").removeClass("collapsing").addClass("collapse")};return a.support.transition?(this.$element[c](0).one(a.support.transition.end,a.proxy(d,this)).emulateTransitionEnd(350),void 0):d.call(this)}}},b.prototype.toggle=function(){this[this.$element.hasClass("in")?"hide":"show"]()};var c=a.fn.collapse;a.fn.collapse=function(c){return this.each(function(){var d=a(this),e=d.data("bs.collapse"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c);e||d.data("bs.collapse",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.collapse.Constructor=b,a.fn.collapse.noConflict=function(){return a.fn.collapse=c,this},a(document).on("click.bs.collapse.data-api","[data-toggle=collapse]",function(b){var c,d=a(this),e=d.attr("data-target")||b.preventDefault()||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,""),f=a(e),g=f.data("bs.collapse"),h=g?"toggle":d.data(),i=d.attr("data-parent"),j=i&&a(i);g&&g.transitioning||(j&&j.find('[data-toggle=collapse][data-parent="'+i+'"]').not(d).addClass("collapsed"),d[f.hasClass("in")?"addClass":"removeClass"]("collapsed")),f.collapse(h)})}(window.jQuery),+function(a){"use strict";function b(){a(d).remove(),a(e).each(function(b){var d=c(a(this));d.hasClass("open")&&(d.trigger(b=a.Event("hide.bs.dropdown")),b.isDefaultPrevented()||d.removeClass("open").trigger("hidden.bs.dropdown"))})}function c(b){var c=b.attr("data-target");c||(c=b.attr("href"),c=c&&/#/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,""));var d=c&&a(c);return d&&d.length?d:b.parent()}var d=".dropdown-backdrop",e="[data-toggle=dropdown]",f=function(b){a(b).on("click.bs.dropdown",this.toggle)};f.prototype.toggle=function(d){var e=a(this);if(!e.is(".disabled, :disabled")){var f=c(e),g=f.hasClass("open");if(b(),!g){if("ontouchstart"in document.documentElement&&!f.closest(".navbar-nav").length&&a('<div class="dropdown-backdrop"/>').insertAfter(a(this)).on("click",b),f.trigger(d=a.Event("show.bs.dropdown")),d.isDefaultPrevented())return;f.toggleClass("open").trigger("shown.bs.dropdown"),e.focus()}return!1}},f.prototype.keydown=function(b){if(/(38|40|27)/.test(b.keyCode)){var d=a(this);if(b.preventDefault(),b.stopPropagation(),!d.is(".disabled, :disabled")){var f=c(d),g=f.hasClass("open");if(!g||g&&27==b.keyCode)return 27==b.which&&f.find(e).focus(),d.click();var h=a("[role=menu] li:not(.divider):visible a",f);if(h.length){var i=h.index(h.filter(":focus"));38==b.keyCode&&i>0&&i--,40==b.keyCode&&i<h.length-1&&i++,~i||(i=0),h.eq(i).focus()}}}};var g=a.fn.dropdown;a.fn.dropdown=function(b){return this.each(function(){var c=a(this),d=c.data("dropdown");d||c.data("dropdown",d=new f(this)),"string"==typeof b&&d[b].call(c)})},a.fn.dropdown.Constructor=f,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=g,this},a(document).on("click.bs.dropdown.data-api",b).on("click.bs.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on("click.bs.dropdown.data-api",e,f.prototype.toggle).on("keydown.bs.dropdown.data-api",e+", [role=menu]",f.prototype.keydown)}(window.jQuery),+function(a){"use strict";var b=function(b,c){this.options=c,this.$element=a(b),this.$backdrop=this.isShown=null,this.options.remote&&this.$element.load(this.options.remote)};b.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},b.prototype.toggle=function(a){return this[this.isShown?"hide":"show"](a)},b.prototype.show=function(b){var c=this,d=a.Event("show.bs.modal",{relatedTarget:b});this.$element.trigger(d),this.isShown||d.isDefaultPrevented()||(this.isShown=!0,this.escape(),this.$element.on("click.dismiss.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.backdrop(function(){var d=a.support.transition&&c.$element.hasClass("fade");c.$element.parent().length||c.$element.appendTo(document.body),c.$element.show(),d&&c.$element[0].offsetWidth,c.$element.addClass("in").attr("aria-hidden",!1),c.enforceFocus();var e=a.Event("shown.bs.modal",{relatedTarget:b});d?c.$element.find(".modal-dialog").one(a.support.transition.end,function(){c.$element.focus().trigger(e)}).emulateTransitionEnd(300):c.$element.focus().trigger(e)}))},b.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modal"),this.$element.trigger(b),this.isShown&&!b.isDefaultPrevented()&&(this.isShown=!1,this.escape(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").attr("aria-hidden",!0).off("click.dismiss.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one(a.support.transition.end,a.proxy(this.hideModal,this)).emulateTransitionEnd(300):this.hideModal())},b.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(a){this.$element[0]===a.target||this.$element.has(a.target).length||this.$element.focus()},this))},b.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keyup.dismiss.bs.modal",a.proxy(function(a){27==a.which&&this.hide()},this)):this.isShown||this.$element.off("keyup.dismiss.bs.modal")},b.prototype.hideModal=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.removeBackdrop(),a.$element.trigger("hidden.bs.modal")})},b.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},b.prototype.backdrop=function(b){var c=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var d=a.support.transition&&c;if(this.$backdrop=a('<div class="modal-backdrop '+c+'" />').appendTo(document.body),this.$element.on("click.dismiss.modal",a.proxy(function(a){a.target===a.currentTarget&&("static"==this.options.backdrop?this.$element[0].focus.call(this.$element[0]):this.hide.call(this))},this)),d&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!b)return;d?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()):b&&b()};var c=a.fn.modal;a.fn.modal=function(c,d){return this.each(function(){var e=a(this),f=e.data("bs.modal"),g=a.extend({},b.DEFAULTS,e.data(),"object"==typeof c&&c);f||e.data("bs.modal",f=new b(this,g)),"string"==typeof c?f[c](d):g.show&&f.show(d)})},a.fn.modal.Constructor=b,a.fn.modal.noConflict=function(){return a.fn.modal=c,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(b){var c=a(this),d=c.attr("href"),e=a(c.attr("data-target")||d&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("modal")?"toggle":a.extend({remote:!/#/.test(d)&&d},e.data(),c.data());b.preventDefault(),e.modal(f,this).one("hide",function(){c.is(":visible")&&c.focus()})}),a(document).on("show.bs.modal",".modal",function(){a(document.body).addClass("modal-open")}).on("hidden.bs.modal",".modal",function(){a(document.body).removeClass("modal-open")})}(window.jQuery),+function(a){"use strict";var b=function(a,b){this.type=this.options=this.enabled=this.timeout=this.hoverState=this.$element=null,this.init("tooltip",a,b)};b.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1},b.prototype.init=function(b,c,d){this.enabled=!0,this.type=b,this.$element=a(c),this.options=this.getOptions(d);for(var e=this.options.trigger.split(" "),f=e.length;f--;){var g=e[f];if("click"==g)this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this));else if("manual"!=g){var h="hover"==g?"mouseenter":"focus",i="hover"==g?"mouseleave":"blur";this.$element.on(h+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(i+"."+this.type,this.options.selector,a.proxy(this.leave,this))}}this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.getOptions=function(b){return b=a.extend({},this.getDefaults(),this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},b.prototype.getDelegateOptions=function(){var b={},c=this.getDefaults();return this._options&&a.each(this._options,function(a,d){c[a]!=d&&(b[a]=d)}),b},b.prototype.enter=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="in",c.options.delay&&c.options.delay.show?(c.timeout=setTimeout(function(){"in"==c.hoverState&&c.show()},c.options.delay.show),void 0):c.show()},b.prototype.leave=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="out",c.options.delay&&c.options.delay.hide?(c.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide),void 0):c.hide()},b.prototype.show=function(){var b=a.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){if(this.$element.trigger(b),b.isDefaultPrevented())return;var c=this.tip();this.setContent(),this.options.animation&&c.addClass("fade");var d="function"==typeof this.options.placement?this.options.placement.call(this,c[0],this.$element[0]):this.options.placement,e=/\s?auto?\s?/i,f=e.test(d);f&&(d=d.replace(e,"")||"top"),c.detach().css({top:0,left:0,display:"block"}).addClass(d),this.options.container?c.appendTo(this.options.container):c.insertAfter(this.$element);var g=this.getPosition(),h=c[0].offsetWidth,i=c[0].offsetHeight;if(f){var j=this.$element.parent(),k=d,l=document.documentElement.scrollTop||document.body.scrollTop,m="body"==this.options.container?window.innerWidth:j.outerWidth(),n="body"==this.options.container?window.innerHeight:j.outerHeight(),o="body"==this.options.container?0:j.offset().left;d="bottom"==d&&g.top+g.height+i-l>n?"top":"top"==d&&g.top-l-i<0?"bottom":"right"==d&&g.right+h>m?"left":"left"==d&&g.left-h<o?"right":d,c.removeClass(k).addClass(d)}var p=this.getCalculatedOffset(d,g,h,i);this.applyPlacement(p,d),this.$element.trigger("shown.bs."+this.type)}},b.prototype.applyPlacement=function(a,b){var c,d=this.tip(),e=d[0].offsetWidth,f=d[0].offsetHeight,g=parseInt(d.css("margin-top"),10),h=parseInt(d.css("margin-left"),10);isNaN(g)&&(g=0),isNaN(h)&&(h=0),a.top=a.top+g,a.left=a.left+h,d.offset(a).addClass("in");var i=d[0].offsetWidth,j=d[0].offsetHeight;if("top"==b&&j!=f&&(c=!0,a.top=a.top+f-j),/bottom|top/.test(b)){var k=0;a.left<0&&(k=-2*a.left,a.left=0,d.offset(a),i=d[0].offsetWidth,j=d[0].offsetHeight),this.replaceArrow(k-e+i,i,"left")}else this.replaceArrow(j-f,j,"top");c&&d.offset(a)},b.prototype.replaceArrow=function(a,b,c){this.arrow().css(c,a?50*(1-a/b)+"%":"")},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},b.prototype.hide=function(){function b(){"in"!=c.hoverState&&d.detach()}var c=this,d=this.tip(),e=a.Event("hide.bs."+this.type);return this.$element.trigger(e),e.isDefaultPrevented()?void 0:(d.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,b).emulateTransitionEnd(150):b(),this.$element.trigger("hidden.bs."+this.type),this)},b.prototype.fixTitle=function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},b.prototype.hasContent=function(){return this.getTitle()},b.prototype.getPosition=function(){var b=this.$element[0];return a.extend({},"function"==typeof b.getBoundingClientRect?b.getBoundingClientRect():{width:b.offsetWidth,height:b.offsetHeight},this.$element.offset())},b.prototype.getCalculatedOffset=function(a,b,c,d){return"bottom"==a?{top:b.top+b.height,left:b.left+b.width/2-c/2}:"top"==a?{top:b.top-d,left:b.left+b.width/2-c/2}:"left"==a?{top:b.top+b.height/2-d/2,left:b.left-c}:{top:b.top+b.height/2-d/2,left:b.left+b.width}},b.prototype.getTitle=function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},b.prototype.tip=function(){return this.$tip=this.$tip||a(this.options.template)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},b.prototype.validate=function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},b.prototype.enable=function(){this.enabled=!0},b.prototype.disable=function(){this.enabled=!1},b.prototype.toggleEnabled=function(){this.enabled=!this.enabled},b.prototype.toggle=function(b){var c=b?a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type):this;c.tip().hasClass("in")?c.leave(c):c.enter(c)},b.prototype.destroy=function(){this.hide().$element.off("."+this.type).removeData("bs."+this.type)};var c=a.fn.tooltip;a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tooltip"),f="object"==typeof c&&c;e||d.data("bs.tooltip",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.tooltip.Constructor=b,a.fn.tooltip.noConflict=function(){return a.fn.tooltip=c,this}}(window.jQuery),+function(a){"use strict";var b=function(a,b){this.init("popover",a,b)};if(!a.fn.tooltip)throw new Error("Popover requires tooltip.js");b.DEFAULTS=a.extend({},a.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),b.prototype=a.extend({},a.fn.tooltip.Constructor.prototype),b.prototype.constructor=b,b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content")[this.options.html?"html":"text"](c),a.removeClass("fade top bottom left right in"),a.find(".popover-title").html()||a.find(".popover-title").hide()},b.prototype.hasContent=function(){return this.getTitle()||this.getContent()},b.prototype.getContent=function(){var a=this.$element,b=this.options;return a.attr("data-content")||("function"==typeof b.content?b.content.call(a[0]):b.content)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")},b.prototype.tip=function(){return this.$tip||(this.$tip=a(this.options.template)),this.$tip};var c=a.fn.popover;a.fn.popover=function(c){return this.each(function(){var d=a(this),e=d.data("bs.popover"),f="object"==typeof c&&c;e||d.data("bs.popover",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.popover.Constructor=b,a.fn.popover.noConflict=function(){return a.fn.popover=c,this}}(window.jQuery),+function(a){"use strict";function b(c,d){var e,f=a.proxy(this.process,this);this.$element=a(c).is("body")?a(window):a(c),this.$body=a("body"),this.$scrollElement=this.$element.on("scroll.bs.scroll-spy.data-api",f),this.options=a.extend({},b.DEFAULTS,d),this.selector=(this.options.target||(e=a(c).attr("href"))&&e.replace(/.*(?=#[^\s]+$)/,"")||"")+" .nav li > a",this.offsets=a([]),this.targets=a([]),this.activeTarget=null,this.refresh(),this.process()}b.DEFAULTS={offset:10},b.prototype.refresh=function(){var b=this.$element[0]==window?"offset":"position";this.offsets=a([]),this.targets=a([]);var c=this;this.$body.find(this.selector).map(function(){var d=a(this),e=d.data("target")||d.attr("href"),f=/^#\w/.test(e)&&a(e);return f&&f.length&&[[f[b]().top+(!a.isWindow(c.$scrollElement.get(0))&&c.$scrollElement.scrollTop()),e]]||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){c.offsets.push(this[0]),c.targets.push(this[1])})},b.prototype.process=function(){var a,b=this.$scrollElement.scrollTop()+this.options.offset,c=this.$scrollElement[0].scrollHeight||this.$body[0].scrollHeight,d=c-this.$scrollElement.height(),e=this.offsets,f=this.targets,g=this.activeTarget;if(b>=d)return g!=(a=f.last()[0])&&this.activate(a);for(a=e.length;a--;)g!=f[a]&&b>=e[a]&&(!e[a+1]||b<=e[a+1])&&this.activate(f[a])},b.prototype.activate=function(b){this.activeTarget=b,a(this.selector).parents(".active").removeClass("active");var c=this.selector+'[data-target="'+b+'"],'+this.selector+'[href="'+b+'"]',d=a(c).parents("li").addClass("active");d.parent(".dropdown-menu").length&&(d=d.closest("li.dropdown").addClass("active")),d.trigger("activate")};var c=a.fn.scrollspy;a.fn.scrollspy=function(c){return this.each(function(){var d=a(this),e=d.data("bs.scrollspy"),f="object"==typeof c&&c;e||d.data("bs.scrollspy",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.scrollspy.Constructor=b,a.fn.scrollspy.noConflict=function(){return a.fn.scrollspy=c,this},a(window).on("load",function(){a('[data-spy="scroll"]').each(function(){var b=a(this);b.scrollspy(b.data())})})}(window.jQuery),+function(a){"use strict";var b=function(b){this.element=a(b)};b.prototype.show=function(){var b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.data("target");if(d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),!b.parent("li").hasClass("active")){var e=c.find(".active:last a")[0],f=a.Event("show.bs.tab",{relatedTarget:e});if(b.trigger(f),!f.isDefaultPrevented()){var g=a(d);this.activate(b.parent("li"),c),this.activate(g,g.parent(),function(){b.trigger({type:"shown.bs.tab",relatedTarget:e})})}}},b.prototype.activate=function(b,c,d){function e(){f.removeClass("active").find("> .dropdown-menu > .active").removeClass("active"),b.addClass("active"),g?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu")&&b.closest("li.dropdown").addClass("active"),d&&d()}var f=c.find("> .active"),g=d&&a.support.transition&&f.hasClass("fade");g?f.one(a.support.transition.end,e).emulateTransitionEnd(150):e(),f.removeClass("in")};var c=a.fn.tab;a.fn.tab=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tab");e||d.data("bs.tab",e=new b(this)),"string"==typeof c&&e[c]()})},a.fn.tab.Constructor=b,a.fn.tab.noConflict=function(){return a.fn.tab=c,this},a(document).on("click.bs.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function(b){b.preventDefault(),a(this).tab("show")})}(window.jQuery),+function(a){"use strict";var b=function(c,d){this.options=a.extend({},b.DEFAULTS,d),this.$window=a(window).on("scroll.bs.affix.data-api",a.proxy(this.checkPosition,this)).on("click.bs.affix.data-api",a.proxy(this.checkPositionWithEventLoop,this)),this.$element=a(c),this.affixed=this.unpin=null,this.checkPosition()};b.RESET="affix affix-top affix-bottom",b.DEFAULTS={offset:0},b.prototype.checkPositionWithEventLoop=function(){setTimeout(a.proxy(this.checkPosition,this),1)},b.prototype.checkPosition=function(){if(this.$element.is(":visible")){var c=a(document).height(),d=this.$window.scrollTop(),e=this.$element.offset(),f=this.options.offset,g=f.top,h=f.bottom;"object"!=typeof f&&(h=g=f),"function"==typeof g&&(g=f.top()),"function"==typeof h&&(h=f.bottom());var i=null!=this.unpin&&d+this.unpin<=e.top?!1:null!=h&&e.top+this.$element.height()>=c-h?"bottom":null!=g&&g>=d?"top":!1;this.affixed!==i&&(this.unpin&&this.$element.css("top",""),this.affixed=i,this.unpin="bottom"==i?e.top-d:null,this.$element.removeClass(b.RESET).addClass("affix"+(i?"-"+i:"")),"bottom"==i&&this.$element.offset({top:document.body.offsetHeight-h-this.$element.height()}))}};var c=a.fn.affix;a.fn.affix=function(c){return this.each(function(){var d=a(this),e=d.data("bs.affix"),f="object"==typeof c&&c;e||d.data("bs.affix",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.affix.Constructor=b,a.fn.affix.noConflict=function(){return a.fn.affix=c,this},a(window).on("load",function(){a('[data-spy="affix"]').each(function(){var b=a(this),c=b.data();c.offset=c.offset||{},c.offsetBottom&&(c.offset.bottom=c.offsetBottom),c.offsetTop&&(c.offset.top=c.offsetTop),b.affix(c)})})}(window.jQuery);
// 4.0.8 (2013-10-10)
!function(e,t){"use strict";function n(e,t){for(var n,r=[],i=0;i<e.length;++i){if(n=s[e[i]]||o(e[i]),!n)throw"module definition dependecy not found: "+e[i];r.push(n)}t.apply(null,r)}function r(e,r,i){if("string"!=typeof e)throw"invalid module definition, module id must be defined and be a string";if(r===t)throw"invalid module definition, dependencies must be specified";if(i===t)throw"invalid module definition, definition function must be specified";n(r,function(){s[e]=i.apply(null,arguments)})}function i(e){return!!s[e]}function o(t){for(var n=e,r=t.split(/[.\/]/),i=0;i<r.length;++i){if(!n[r[i]])return;n=n[r[i]]}return n}function a(n){for(var r=0;r<n.length;r++){for(var i=e,o=n[r],a=o.split(/[.\/]/),l=0;l<a.length-1;++l)i[a[l]]===t&&(i[a[l]]={}),i=i[a[l]];i[a[a.length-1]]=s[o]}}var s={},l="tinymce/dom/EventUtils",c="tinymce/dom/Sizzle",u="tinymce/dom/DomQuery",d="tinymce/html/Styles",f="tinymce/dom/TreeWalker",p="tinymce/util/Tools",h="tinymce/dom/Range",m="tinymce/html/Entities",g="tinymce/Env",v="tinymce/dom/DOMUtils",y="tinymce/dom/ScriptLoader",b="tinymce/AddOnManager",C="tinymce/html/Node",x="tinymce/html/Schema",w="tinymce/html/SaxParser",_="tinymce/html/DomParser",N="tinymce/html/Writer",E="tinymce/html/Serializer",S="tinymce/dom/Serializer",k="tinymce/dom/TridentSelection",T="tinymce/util/VK",R="tinymce/dom/ControlSelection",A="tinymce/dom/Selection",B="tinymce/dom/RangeUtils",L="tinymce/Formatter",H="tinymce/UndoManager",D="tinymce/EnterKey",M="tinymce/ForceBlocks",P="tinymce/EditorCommands",O="tinymce/util/URI",I="tinymce/util/Class",F="tinymce/ui/Selector",z="tinymce/ui/Collection",W="tinymce/ui/DomUtils",V="tinymce/ui/Control",U="tinymce/ui/Factory",q="tinymce/ui/Container",j="tinymce/ui/DragHelper",$="tinymce/ui/Scrollable",K="tinymce/ui/Panel",G="tinymce/ui/Movable",Y="tinymce/ui/Resizable",X="tinymce/ui/FloatPanel",J="tinymce/ui/KeyboardNavigation",Q="tinymce/ui/Window",Z="tinymce/ui/MessageBox",et="tinymce/WindowManager",tt="tinymce/util/Quirks",nt="tinymce/util/Observable",rt="tinymce/Shortcuts",it="tinymce/Editor",ot="tinymce/util/I18n",at="tinymce/FocusManager",st="tinymce/EditorManager",lt="tinymce/LegacyInput",ct="tinymce/util/XHR",ut="tinymce/util/JSON",dt="tinymce/util/JSONRequest",ft="tinymce/util/JSONP",pt="tinymce/util/LocalStorage",ht="tinymce/Compat",mt="tinymce/ui/Layout",gt="tinymce/ui/AbsoluteLayout",vt="tinymce/ui/Tooltip",yt="tinymce/ui/Widget",bt="tinymce/ui/Button",Ct="tinymce/ui/ButtonGroup",xt="tinymce/ui/Checkbox",wt="tinymce/ui/PanelButton",_t="tinymce/ui/ColorButton",Nt="tinymce/ui/ComboBox",Et="tinymce/ui/Path",St="tinymce/ui/ElementPath",kt="tinymce/ui/FormItem",Tt="tinymce/ui/Form",Rt="tinymce/ui/FieldSet",At="tinymce/ui/FilePicker",Bt="tinymce/ui/FitLayout",Lt="tinymce/ui/FlexLayout",Ht="tinymce/ui/FlowLayout",Dt="tinymce/ui/FormatControls",Mt="tinymce/ui/GridLayout",Pt="tinymce/ui/Iframe",Ot="tinymce/ui/Label",It="tinymce/ui/Toolbar",Ft="tinymce/ui/MenuBar",zt="tinymce/ui/MenuButton",Wt="tinymce/ui/ListBox",Vt="tinymce/ui/MenuItem",Ut="tinymce/ui/Menu",qt="tinymce/ui/Radio",jt="tinymce/ui/ResizeHandle",$t="tinymce/ui/Spacer",Kt="tinymce/ui/SplitButton",Gt="tinymce/ui/StackLayout",Yt="tinymce/ui/TabPanel",Xt="tinymce/ui/TextBox",Jt="tinymce/ui/Throbber";r(l,[],function(){function e(e,t,n,r){e.addEventListener?e.addEventListener(t,n,r||!1):e.attachEvent&&e.attachEvent("on"+t,n)}function t(e,t,n,r){e.removeEventListener?e.removeEventListener(t,n,r||!1):e.detachEvent&&e.detachEvent("on"+t,n)}function n(e,t){function n(){return!1}function r(){return!0}var i,o=t||{},l;for(i in e)s[i]||(o[i]=e[i]);if(o.target||(o.target=o.srcElement||document),e&&a.test(e.type)&&e.pageX===l&&e.clientX!==l){var c=o.target.ownerDocument||document,u=c.documentElement,d=c.body;o.pageX=e.clientX+(u&&u.scrollLeft||d&&d.scrollLeft||0)-(u&&u.clientLeft||d&&d.clientLeft||0),o.pageY=e.clientY+(u&&u.scrollTop||d&&d.scrollTop||0)-(u&&u.clientTop||d&&d.clientTop||0)}return o.preventDefault=function(){o.isDefaultPrevented=r,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},o.stopPropagation=function(){o.isPropagationStopped=r,e&&(e.stopPropagation?e.stopPropagation():e.cancelBubble=!0)},o.stopImmediatePropagation=function(){o.isImmediatePropagationStopped=r,o.stopPropagation()},o.isDefaultPrevented||(o.isDefaultPrevented=n,o.isPropagationStopped=n,o.isImmediatePropagationStopped=n),o}function r(n,r,i){function o(){i.domLoaded||(i.domLoaded=!0,r(c))}function a(){"complete"===l.readyState&&(t(l,"readystatechange",a),o())}function s(){try{l.documentElement.doScroll("left")}catch(e){return setTimeout(s,0),void 0}o()}var l=n.document,c={type:"ready"};return i.domLoaded?(r(c),void 0):(l.addEventListener?e(n,"DOMContentLoaded",o):(e(l,"readystatechange",a),l.documentElement.doScroll&&n===n.top&&s()),e(n,"load",o),void 0)}function i(){function i(e,t){var n,r,i,o,a=s[t];if(n=a&&a[e.type])for(r=0,i=n.length;i>r;r++)if(o=n[r],o&&o.func.call(o.scope,e)===!1&&e.preventDefault(),e.isImmediatePropagationStopped())return}var a=this,s={},l,c,u,d,f;c=o+(+new Date).toString(32),d="onmouseenter"in document.documentElement,u="onfocusin"in document.documentElement,f={mouseenter:"mouseover",mouseleave:"mouseout"},l=1,a.domLoaded=!1,a.events=s,a.bind=function(t,o,p,h){function m(e){i(n(e||_.event),g)}var g,v,y,b,C,x,w,_=window;if(t&&3!==t.nodeType&&8!==t.nodeType){for(t[c]?g=t[c]:(g=l++,t[c]=g,s[g]={}),h=h||t,o=o.split(" "),y=o.length;y--;)b=o[y],x=m,C=w=!1,"DOMContentLoaded"===b&&(b="ready"),a.domLoaded&&"ready"===b&&"complete"==t.readyState?p.call(h,n({type:b})):(d||(C=f[b],C&&(x=function(e){var t,r;if(t=e.currentTarget,r=e.relatedTarget,r&&t.contains)r=t.contains(r);else for(;r&&r!==t;)r=r.parentNode;r||(e=n(e||_.event),e.type="mouseout"===e.type?"mouseleave":"mouseenter",e.target=t,i(e,g))})),u||"focusin"!==b&&"focusout"!==b||(w=!0,C="focusin"===b?"focus":"blur",x=function(e){e=n(e||_.event),e.type="focus"===e.type?"focusin":"focusout",i(e,g)}),v=s[g][b],v?"ready"===b&&a.domLoaded?p({type:b}):v.push({func:p,scope:h}):(s[g][b]=v=[{func:p,scope:h}],v.fakeName=C,v.capture=w,v.nativeHandler=x,"ready"===b?r(t,x,a):e(t,C||b,x,w)));return t=v=0,p}},a.unbind=function(e,n,r){var i,o,l,u,d,f;if(!e||3===e.nodeType||8===e.nodeType)return a;if(i=e[c]){if(f=s[i],n){for(n=n.split(" "),l=n.length;l--;)if(d=n[l],o=f[d]){if(r)for(u=o.length;u--;)if(o[u].func===r){var p=o.nativeHandler;o=o.slice(0,u).concat(o.slice(u+1)),o.nativeHandler=p,f[d]=o}r&&0!==o.length||(delete f[d],t(e,o.fakeName||d,o.nativeHandler,o.capture))}}else{for(d in f)o=f[d],t(e,o.fakeName||d,o.nativeHandler,o.capture);f={}}for(d in f)return a;delete s[i];try{delete e[c]}catch(h){e[c]=null}}return a},a.fire=function(e,t,r){var o;if(!e||3===e.nodeType||8===e.nodeType)return a;r=n(null,r),r.type=t,r.target=e;do o=e[c],o&&i(r,o),e=e.parentNode||e.ownerDocument||e.defaultView||e.parentWindow;while(e&&!r.isPropagationStopped());return a},a.clean=function(e){var t,n,r=a.unbind;if(!e||3===e.nodeType||8===e.nodeType)return a;if(e[c]&&r(e),e.getElementsByTagName||(e=e.document),e&&e.getElementsByTagName)for(r(e),n=e.getElementsByTagName("*"),t=n.length;t--;)e=n[t],e[c]&&r(e);return a},a.destroy=function(){s={}},a.cancel=function(e){return e&&(e.preventDefault(),e.stopImmediatePropagation()),!1}}var o="mce-data-",a=/^(?:mouse|contextmenu)|click/,s={keyLocation:1,layerX:1,layerY:1,returnValue:1};return i.Event=new i,i.Event.bind(window,"ready",function(){}),i}),r(c,[],function(){function e(e){return gt.test(e+"")}function n(){var e,t=[];return e=function(n,r){return t.push(n+=" ")>N.cacheLength&&delete e[t.shift()],e[n]=r,r}}function i(e){return e[F]=!0,e}function o(e){var t=L.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t=null}}function a(e,t,n,r){var i,o,a,s,l,c,u,p,h,m;if((t?t.ownerDocument||t:z)!==L&&B(t),t=t||L,n=n||[],!e||"string"!=typeof e)return n;if(1!==(s=t.nodeType)&&9!==s)return[];if(D&&!r){if(i=vt.exec(e))if(a=i[1]){if(9===s){if(o=t.getElementById(a),!o||!o.parentNode)return n;if(o.id===a)return n.push(o),n}else if(t.ownerDocument&&(o=t.ownerDocument.getElementById(a))&&I(t,o)&&o.id===a)return n.push(o),n}else{if(i[2])return et.apply(n,t.getElementsByTagName(e)),n;if((a=i[3])&&W.getElementsByClassName&&t.getElementsByClassName)return et.apply(n,t.getElementsByClassName(a)),n}if(W.qsa&&!M.test(e)){if(u=!0,p=F,h=t,m=9===s&&e,1===s&&"object"!==t.nodeName.toLowerCase()){for(c=d(e),(u=t.getAttribute("id"))?p=u.replace(Ct,"\\$&"):t.setAttribute("id",p),p="[id='"+p+"'] ",l=c.length;l--;)c[l]=p+f(c[l]);h=mt.test(e)&&t.parentNode||t,m=c.join(",")}if(m)try{return et.apply(n,h.querySelectorAll(m)),n}catch(g){}finally{u||t.removeAttribute("id")}}}return C(e.replace(ct,"$1"),t,n,r)}function s(e,t){var n=t&&e,r=n&&(~t.sourceIndex||X)-(~e.sourceIndex||X);if(r)return r;if(n)for(;n=n.nextSibling;)if(n===t)return-1;return e?1:-1}function l(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function c(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function u(e){return i(function(t){return t=+t,i(function(n,r){for(var i,o=e([],n.length,t),a=o.length;a--;)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}function d(e,t){var n,r,i,o,s,l,c,u=j[e+" "];if(u)return t?0:u.slice(0);for(s=e,l=[],c=N.preFilter;s;){(!n||(r=ut.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),l.push(i=[])),n=!1,(r=dt.exec(s))&&(n=r.shift(),i.push({value:n,type:r[0].replace(ct," ")}),s=s.slice(n.length));for(o in N.filter)!(r=ht[o].exec(s))||c[o]&&!(r=c[o](r))||(n=r.shift(),i.push({value:n,type:o,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?a.error(e):j(e,l).slice(0)}function f(e){for(var t=0,n=e.length,r="";n>t;t++)r+=e[t].value;return r}function p(e,t,n){var r=t.dir,i=n&&"parentNode"===r,o=U++;return t.first?function(t,n,o){for(;t=t[r];)if(1===t.nodeType||i)return e(t,n,o)}:function(t,n,a){var s,l,c,u=V+" "+o;if(a){for(;t=t[r];)if((1===t.nodeType||i)&&e(t,n,a))return!0}else for(;t=t[r];)if(1===t.nodeType||i)if(c=t[F]||(t[F]={}),(l=c[r])&&l[0]===u){if((s=l[1])===!0||s===_)return s===!0}else if(l=c[r]=[u],l[1]=e(t,n,a)||_,l[1]===!0)return!0}}function h(e){return e.length>1?function(t,n,r){for(var i=e.length;i--;)if(!e[i](t,n,r))return!1;return!0}:e[0]}function m(e,t,n,r,i){for(var o,a=[],s=0,l=e.length,c=null!=t;l>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),c&&t.push(s));return a}function g(e,t,n,r,o,a){return r&&!r[F]&&(r=g(r)),o&&!o[F]&&(o=g(o,a)),i(function(i,a,s,l){var c,u,d,f=[],p=[],h=a.length,g=i||b(t||"*",s.nodeType?[s]:s,[]),v=!e||!i&&t?g:m(g,f,e,s,l),y=n?o||(i?e:h||r)?[]:a:v;if(n&&n(v,y,s,l),r)for(c=m(y,p),r(c,[],s,l),u=c.length;u--;)(d=c[u])&&(y[p[u]]=!(v[p[u]]=d));if(i){if(o||e){if(o){for(c=[],u=y.length;u--;)(d=y[u])&&c.push(v[u]=d);o(null,y=[],c,l)}for(u=y.length;u--;)(d=y[u])&&(c=o?nt.call(i,d):f[u])>-1&&(i[c]=!(a[c]=d))}}else y=m(y===a?y.splice(h,y.length):y),o?o(null,a,y,l):et.apply(a,y)})}function v(e){for(var t,n,r,i=e.length,o=N.relative[e[0].type],a=o||N.relative[" "],s=o?1:0,l=p(function(e){return e===t},a,!0),c=p(function(e){return nt.call(t,e)>-1},a,!0),u=[function(e,n,r){return!o&&(r||n!==T)||((t=n).nodeType?l(e,n,r):c(e,n,r))}];i>s;s++)if(n=N.relative[e[s].type])u=[p(h(u),n)];else{if(n=N.filter[e[s].type].apply(null,e[s].matches),n[F]){for(r=++s;i>r&&!N.relative[e[r].type];r++);return g(s>1&&h(u),s>1&&f(e.slice(0,s-1)).replace(ct,"$1"),n,r>s&&v(e.slice(s,r)),i>r&&v(e=e.slice(r)),i>r&&f(e))}u.push(n)}return h(u)}function y(e,t){var n=0,r=t.length>0,o=e.length>0,s=function(i,s,l,c,u){var d,f,p,h=[],g=0,v="0",y=i&&[],b=null!=u,C=T,x=i||o&&N.find.TAG("*",u&&s.parentNode||s),w=V+=null==C?1:Math.random()||.1;for(b&&(T=s!==L&&s,_=n);null!=(d=x[v]);v++){if(o&&d){for(f=0;p=e[f++];)if(p(d,s,l)){c.push(d);break}b&&(V=w,_=++n)}r&&((d=!p&&d)&&g--,i&&y.push(d))}if(g+=v,r&&v!==g){for(f=0;p=t[f++];)p(y,h,s,l);if(i){if(g>0)for(;v--;)y[v]||h[v]||(h[v]=Q.call(c));h=m(h)}et.apply(c,h),b&&!i&&h.length>0&&g+t.length>1&&a.uniqueSort(c)}return b&&(V=w,T=C),y};return r?i(s):s}function b(e,t,n){for(var r=0,i=t.length;i>r;r++)a(e,t[r],n);return n}function C(e,t,n,r){var i,o,a,s,l,c=d(e);if(!r&&1===c.length){if(o=c[0]=c[0].slice(0),o.length>2&&"ID"===(a=o[0]).type&&9===t.nodeType&&D&&N.relative[o[1].type]){if(t=(N.find.ID(a.matches[0].replace(wt,_t),t)||[])[0],!t)return n;e=e.slice(o.shift().value.length)}for(i=ht.needsContext.test(e)?0:o.length;i--&&(a=o[i],!N.relative[s=a.type]);)if((l=N.find[s])&&(r=l(a.matches[0].replace(wt,_t),mt.test(o[0].type)&&t.parentNode||t))){if(o.splice(i,1),e=r.length&&f(o),!e)return et.apply(n,r),n;break}}return k(e,c)(r,t,!D,n,mt.test(e)),n}function x(){}var w,_,N,E,S,k,T,R,A,B,L,H,D,M,P,O,I,F="sizzle"+-new Date,z=window.document,W={},V=0,U=0,q=n(),j=n(),$=n(),K=!1,G=function(){return 0},Y=typeof t,X=1<<31,J=[],Q=J.pop,Z=J.push,et=J.push,tt=J.slice,nt=J.indexOf||function(e){for(var t=0,n=this.length;n>t;t++)if(this[t]===e)return t;return-1},rt="[\\x20\\t\\r\\n\\f]",it="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",ot=it.replace("w","w#"),at="([*^$|!~]?=)",st="\\["+rt+"*("+it+")"+rt+"*(?:"+at+rt+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+ot+")|)|)"+rt+"*\\]",lt=":("+it+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+st.replace(3,8)+")*)|.*)\\)|)",ct=new RegExp("^"+rt+"+|((?:^|[^\\\\])(?:\\\\.)*)"+rt+"+$","g"),ut=new RegExp("^"+rt+"*,"+rt+"*"),dt=new RegExp("^"+rt+"*([\\x20\\t\\r\\n\\f>+~])"+rt+"*"),ft=new RegExp(lt),pt=new RegExp("^"+ot+"$"),ht={ID:new RegExp("^#("+it+")"),CLASS:new RegExp("^\\.("+it+")"),NAME:new RegExp("^\\[name=['\"]?("+it+")['\"]?\\]"),TAG:new RegExp("^("+it.replace("w","w*")+")"),ATTR:new RegExp("^"+st),PSEUDO:new RegExp("^"+lt),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+rt+"*(even|odd|(([+-]|)(\\d*)n|)"+rt+"*(?:([+-]|)"+rt+"*(\\d+)|))"+rt+"*\\)|)","i"),needsContext:new RegExp("^"+rt+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+rt+"*((?:-\\d)?\\d*)"+rt+"*\\)|)(?=[^-]|$)","i")},mt=/[\x20\t\r\n\f]*[+~]/,gt=/^[^{]+\{\s*\[native code/,vt=/^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,yt=/^(?:input|select|textarea|button)$/i,bt=/^h\d$/i,Ct=/'|\\/g,xt=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,wt=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,_t=function(e,t){var n="0x"+t-65536;return n!==n?t:0>n?String.fromCharCode(n+65536):String.fromCharCode(55296|n>>10,56320|1023&n)};try{et.apply(J=tt.call(z.childNodes),z.childNodes),J[z.childNodes.length].nodeType}catch(Nt){et={apply:J.length?function(e,t){Z.apply(e,tt.call(t))}:function(e,t){for(var n=e.length,r=0;e[n++]=t[r++];);e.length=n-1}}}S=a.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},B=a.setDocument=function(n){var r=n?n.ownerDocument||n:z;return r!==L&&9===r.nodeType&&r.documentElement?(L=r,H=r.documentElement,D=!S(r),W.getElementsByTagName=o(function(e){return e.appendChild(r.createComment("")),!e.getElementsByTagName("*").length}),W.attributes=o(function(e){e.innerHTML="<select></select>";var t=typeof e.lastChild.getAttribute("multiple");return"boolean"!==t&&"string"!==t}),W.getElementsByClassName=o(function(e){return e.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",e.getElementsByClassName&&e.getElementsByClassName("e").length?(e.lastChild.className="e",2===e.getElementsByClassName("e").length):!1}),W.getByName=o(function(e){e.id=F+0,e.appendChild(L.createElement("a")).setAttribute("name",F),e.appendChild(L.createElement("i")).setAttribute("name",F),H.appendChild(e);var t=r.getElementsByName&&r.getElementsByName(F).length===2+r.getElementsByName(F+0).length;return H.removeChild(e),t}),W.sortDetached=o(function(e){return e.compareDocumentPosition&&1&e.compareDocumentPosition(L.createElement("div"))}),N.attrHandle=o(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==Y&&"#"===e.firstChild.getAttribute("href")})?{}:{href:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},W.getByName?(N.find.ID=function(e,t){if(typeof t.getElementById!==Y&&D){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},N.filter.ID=function(e){var t=e.replace(wt,_t);return function(e){return e.getAttribute("id")===t}}):(N.find.ID=function(e,n){if(typeof n.getElementById!==Y&&D){var r=n.getElementById(e);return r?r.id===e||typeof r.getAttributeNode!==Y&&r.getAttributeNode("id").value===e?[r]:t:[]}},N.filter.ID=function(e){var t=e.replace(wt,_t);return function(e){var n=typeof e.getAttributeNode!==Y&&e.getAttributeNode("id");return n&&n.value===t}}),N.find.TAG=W.getElementsByTagName?function(e,t){return typeof t.getElementsByTagName!==Y?t.getElementsByTagName(e):void 0}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){for(;n=o[i++];)1===n.nodeType&&r.push(n);return r}return o},N.find.NAME=W.getByName&&function(e,t){return typeof t.getElementsByName!==Y?t.getElementsByName(name):void 0},N.find.CLASS=W.getElementsByClassName&&function(e,t){return typeof t.getElementsByClassName!==Y&&D?t.getElementsByClassName(e):void 0},P=[],M=[":focus"],(W.qsa=e(r.querySelectorAll))&&(o(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||M.push("\\["+rt+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||M.push(":checked")}),o(function(e){e.innerHTML="<input type='hidden' i=''/>",e.querySelectorAll("[i^='']").length&&M.push("[*^$]="+rt+"*(?:\"\"|'')"),e.querySelectorAll(":enabled").length||M.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),M.push(",.*:")})),(W.matchesSelector=e(O=H.matchesSelector||H.mozMatchesSelector||H.webkitMatchesSelector||H.oMatchesSelector||H.msMatchesSelector))&&o(function(e){W.disconnectedMatch=O.call(e,"div"),O.call(e,"[s!='']:x"),P.push("!=",lt)}),M=new RegExp(M.join("|")),P=P.length&&new RegExp(P.join("|")),I=e(H.contains)||H.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)for(;t=t.parentNode;)if(t===e)return!0;return!1},G=H.compareDocumentPosition?function(e,t){if(e===t)return K=!0,0;var n=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t);return n?1&n||R&&t.compareDocumentPosition(e)===n?e===r||I(z,e)?-1:t===r||I(z,t)?1:A?nt.call(A,e)-nt.call(A,t):0:4&n?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var n,i=0,o=e.parentNode,a=t.parentNode,l=[e],c=[t];if(e===t)return K=!0,0;if(!o||!a)return e===r?-1:t===r?1:o?-1:a?1:0;if(o===a)return s(e,t);for(n=e;n=n.parentNode;)l.unshift(n);for(n=t;n=n.parentNode;)c.unshift(n);for(;l[i]===c[i];)i++;return i?s(l[i],c[i]):l[i]===z?-1:c[i]===z?1:0},L):L},a.matches=function(e,t){return a(e,null,null,t)},a.matchesSelector=function(e,t){if((e.ownerDocument||e)!==L&&B(e),t=t.replace(xt,"='$1']"),W.matchesSelector&&D&&(!P||!P.test(t))&&!M.test(t))try{var n=O.call(e,t);if(n||W.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(r){}return a(t,L,null,[e]).length>0},a.contains=function(e,t){return(e.ownerDocument||e)!==L&&B(e),I(e,t)},a.attr=function(e,t){var n;return(e.ownerDocument||e)!==L&&B(e),D&&(t=t.toLowerCase()),(n=N.attrHandle[t])?n(e):!D||W.attributes?e.getAttribute(t):((n=e.getAttributeNode(t))||e.getAttribute(t))&&e[t]===!0?t:n&&n.specified?n.value:null},a.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},a.uniqueSort=function(e){var t,n=[],r=0,i=0;if(K=!W.detectDuplicates,R=!W.sortDetached,A=!W.sortStable&&e.slice(0),e.sort(G),K){for(;t=e[i++];)t===e[i]&&(r=n.push(i));for(;r--;)e.splice(n[r],1)}return e},E=a.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=E(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=E(t);return n},N=a.selectors={cacheLength:50,createPseudo:i,match:ht,find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(wt,_t),e[3]=(e[4]||e[5]||"").replace(wt,_t),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||a.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&a.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return ht.CHILD.test(e[0])?null:(e[4]?e[2]=e[4]:n&&ft.test(n)&&(t=d(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){return"*"===e?function(){return!0}:(e=e.replace(wt,_t).toLowerCase(),function(t){return t.nodeName&&t.nodeName.toLowerCase()===e})},CLASS:function(e){var t=q[e+" "];return t||(t=new RegExp("(^|"+rt+")"+e+"("+rt+"|$)"))&&q(e,function(e){return t.test(e.className||typeof e.getAttribute!==Y&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=a.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,l){var c,u,d,f,p,h,m=o!==a?"nextSibling":"previousSibling",g=t.parentNode,v=s&&t.nodeName.toLowerCase(),y=!l&&!s;if(g){if(o){for(;m;){for(d=t;d=d[m];)if(s?d.nodeName.toLowerCase()===v:1===d.nodeType)return!1;h=m="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?g.firstChild:g.lastChild],a&&y){for(u=g[F]||(g[F]={}),c=u[e]||[],p=c[0]===V&&c[1],f=c[0]===V&&c[2],d=p&&g.childNodes[p];d=++p&&d&&d[m]||(f=p=0)||h.pop();)if(1===d.nodeType&&++f&&d===t){u[e]=[V,p,f];break}}else if(y&&(c=(t[F]||(t[F]={}))[e])&&c[0]===V)f=c[1];else for(;(d=++p&&d&&d[m]||(f=p=0)||h.pop())&&((s?d.nodeName.toLowerCase()!==v:1!==d.nodeType)||!++f||(y&&((d[F]||(d[F]={}))[e]=[V,f]),d!==t)););return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=N.pseudos[e]||N.setFilters[e.toLowerCase()]||a.error("unsupported pseudo: "+e);return r[F]?r(t):r.length>1?(n=[e,e,"",t],N.setFilters.hasOwnProperty(e.toLowerCase())?i(function(e,n){for(var i,o=r(e,t),a=o.length;a--;)i=nt.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:i(function(e){var t=[],n=[],r=k(e.replace(ct,"$1"));return r[F]?i(function(e,t,n,i){for(var o,a=r(e,null,i,[]),s=e.length;s--;)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:i(function(e){return function(t){return a(e,t).length>0}}),contains:i(function(e){return function(t){return(t.textContent||t.innerText||E(t)).indexOf(e)>-1}}),lang:i(function(e){return pt.test(e||"")||a.error("unsupported lang: "+e),e=e.replace(wt,_t).toLowerCase(),function(t){var n;do if(n=D?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(e){var t=window.location&&window.location.hash;return t&&t.slice(1)===e.id},root:function(e){return e===H},focus:function(e){return e===L.activeElement&&(!L.hasFocus||L.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!N.pseudos.empty(e)},header:function(e){return bt.test(e.nodeName)},input:function(e){return yt.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:u(function(){return[0]}),last:u(function(e,t){return[t-1]}),eq:u(function(e,t,n){return[0>n?n+t:n]}),even:u(function(e,t){for(var n=0;t>n;n+=2)e.push(n);return e}),odd:u(function(e,t){for(var n=1;t>n;n+=2)e.push(n);return e}),lt:u(function(e,t,n){for(var r=0>n?n+t:n;--r>=0;)e.push(r);return e}),gt:u(function(e,t,n){for(var r=0>n?n+t:n;++r<t;)e.push(r);return e})}};for(w in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})N.pseudos[w]=l(w);for(w in{submit:!0,reset:!0})N.pseudos[w]=c(w);return k=a.compile=function(e,t){var n,r=[],i=[],o=$[e+" "];if(!o){for(t||(t=d(e)),n=t.length;n--;)o=v(t[n]),o[F]?r.push(o):i.push(o);o=$(e,y(i,r))}return o},N.pseudos.nth=N.pseudos.eq,x.prototype=N.filters=N.pseudos,N.setFilters=new x,W.sortStable=F.split("").sort(G).join("")===F,B(),[0,0].sort(G),W.detectDuplicates=K,"function"==typeof r&&r.amd?r(function(){return a}):window.Sizzle=a,a}),r(u,[l,c],function(e,n){function r(e){return"undefined"!=typeof e}function i(e){return"string"==typeof e}function o(e){var t,n,r;for(r=g.createElement("div"),t=g.createDocumentFragment(),r.innerHTML=e;n=r.firstChild;)t.appendChild(n);return t}function a(e,t,n){var r;if("string"==typeof t)t=o(t);else if(t.length){for(r=0;r<t.length;r++)a(e,t[r],n);return e}for(r=e.length;r--;)n.call(e[r],t.parentNode?t:t);return e}function s(e,t){return e&&t&&-1!==(" "+e.className+" ").indexOf(" "+t+" ")}function l(e,t){var n;for(e=e||[],"string"==typeof e&&(e=e.split(" ")),t=t||{},n=e.length;n--;)t[e[n]]={};return t}function c(e,t){return new c.fn.init(e,t)}function u(e){var t=arguments,n,r,i;for(r=1;r<t.length;r++){n=t[r];for(i in n)e[i]=n[i]}return e}function d(e){var t=[],n,r;for(n=0,r=e.length;r>n;n++)t[n]=e[n];return t}function f(e,t){var n;if(t.indexOf)return t.indexOf(e);for(n=t.length;n--;)if(t[n]===e)return n;return-1}function p(e,t){var n,r,i,o,a;if(e)if(n=e.length,n===o){for(r in e)if(e.hasOwnProperty(r)&&(a=e[r],t.call(a,a,r)===!1))break}else for(i=0;n>i&&(a=e[i],t.call(a,a,r)!==!1);i++);return e}function h(e,n,r){for(var i=[],o=e[n];o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!c(o).is(r));)1===o.nodeType&&i.push(o),o=o[n];return i}function m(e,t,n,r){for(var i=[];e;e=e[n])r&&e.nodeType!==r||e===t||i.push(e);return i}var g=document,v=Array.prototype.push,y=Array.prototype.slice,b=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,C=e.Event,x=l("fillOpacity fontWeight lineHeight opacity orphans widows zIndex zoom"),w=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)},_=/^\s*|\s*$/g,N=function(e){return null===e||e===t?"":(""+e).replace(_,"")};return c.fn=c.prototype={constructor:c,selector:"",length:0,init:function(e,t){var n=this,r,a;if(!e)return n;if(e.nodeType)return n.context=n[0]=e,n.length=1,n;if(i(e)){if(r="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:b.exec(e),!r)return c(t||document).find(e);if(r[1])for(a=o(e).firstChild;a;)this.add(a),a=a.nextSibling;else{if(a=g.getElementById(r[2]),a.id!==r[2])return n.find(e);n.length=1,n[0]=a}}else this.add(e);return n},toArray:function(){return d(this)},add:function(e){var t=this;return w(e)?v.apply(t,e):e instanceof c?t.add(e.toArray()):v.call(t,e),t},attr:function(e,n){var i=this;if("object"==typeof e)p(e,function(e,t){i.attr(t,e)});else{if(!r(n))return i[0]&&1===i[0].nodeType?i[0].getAttribute(e):t;this.each(function(){1===this.nodeType&&this.setAttribute(e,n)})}return i},css:function(e,n){var i=this;if("object"==typeof e)p(e,function(e,t){i.css(t,e)});else{if(e=e.replace(/-(\D)/g,function(e,t){return t.toUpperCase()}),!r(n))return i[0]?i[0].style[e]:t;"number"!=typeof n||x[e]||(n+="px"),i.each(function(){var t=this.style;"opacity"===e&&this.runtimeStyle&&"undefined"==typeof this.runtimeStyle.opacity&&(t.filter=""===n?"":"alpha(opacity="+100*n+")");try{t[e]=n}catch(r){}})}return i},remove:function(){for(var e=this,t,n=this.length;n--;)t=e[n],C.clean(t),t.parentNode&&t.parentNode.removeChild(t);return this},empty:function(){for(var e=this,t,n=this.length;n--;)for(t=e[n];t.firstChild;)t.removeChild(t.firstChild);return this},html:function(e){var t=this,n;if(r(e)){for(n=t.length;n--;)t[n].innerHTML=e;return t}return t[0]?t[0].innerHTML:""},text:function(e){var t=this,n;if(r(e)){for(n=t.length;n--;)t[n].innerText=t[0].textContent=e;return t}return t[0]?t[0].innerText||t[0].textContent:""},append:function(){return a(this,arguments,function(e){1===this.nodeType&&this.appendChild(e)})},prepend:function(){return a(this,arguments,function(e){1===this.nodeType&&this.insertBefore(e,this.firstChild)})},before:function(){var e=this;return e[0]&&e[0].parentNode?a(e,arguments,function(e){this.parentNode.insertBefore(e,this.nextSibling)}):e},after:function(){var e=this;return e[0]&&e[0].parentNode?a(e,arguments,function(e){this.parentNode.insertBefore(e,this)}):e},appendTo:function(e){return c(e).append(this),this},addClass:function(e){return this.toggleClass(e,!0)},removeClass:function(e){return this.toggleClass(e,!1)},toggleClass:function(e,t){var n=this;return-1!==e.indexOf(" ")?p(e.split(" "),function(){n.toggleClass(this,t)}):n.each(function(){var n=this,r;s(n,e)!==t&&(r=n.className,t?n.className+=r?" "+e:e:n.className=N((" "+r+" ").replace(" "+e+" "," ")))}),n},hasClass:function(e){return s(this[0],e)},each:function(e){return p(this,e)},on:function(e,t){return this.each(function(){C.bind(this,e,t)})},off:function(e,t){return this.each(function(){C.unbind(this,e,t)})},show:function(){return this.css("display","")},hide:function(){return this.css("display","none")},slice:function(){return new c(y.apply(this,arguments))},eq:function(e){return-1===e?this.slice(e):this.slice(e,+e+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},replaceWith:function(e){var t=this;return t[0]&&t[0].parentNode.replaceChild(c(e)[0],t[0]),t},wrap:function(e){return e=c(e)[0],this.each(function(){var t=this,n=e.cloneNode(!1);t.parentNode.insertBefore(n,t),n.appendChild(t)})},unwrap:function(){return this.each(function(){for(var e=this,t=e.firstChild,n;t;)n=t,t=t.nextSibling,e.parentNode.insertBefore(n,e)})},clone:function(){var e=[];return this.each(function(){e.push(this.cloneNode(!0))}),c(e)},find:function(e){var t,n,r=[];for(t=0,n=this.length;n>t;t++)c.find(e,this[t],r);return c(r)},push:v,sort:[].sort,splice:[].splice},u(c,{extend:u,toArray:d,inArray:f,isArray:w,each:p,trim:N,makeMap:l,find:n,expr:n.selectors,unique:n.uniqueSort,text:n.getText,isXMLDoc:n.isXML,contains:n.contains,filter:function(e,t,n){return n&&(e=":not("+e+")"),1===t.length?c.find.matchesSelector(t[0],e)?[t[0]]:[]:c.find.matches(e,t)}}),p({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return h(e,"parentNode")},parentsUntil:function(e,t){return h(e,"parentNode",t)},next:function(e){return m(e,"nextSibling",1)},prev:function(e){return m(e,"previousSibling",1)},nextNodes:function(e){return m(e,"nextSibling")},prevNodes:function(e){return m(e,"previousSibling")},children:function(e){return m(e.firstChild,"nextSibling",1)},contents:function(e){return d(("iframe"===e.nodeName?e.contentDocument||e.contentWindow.document:e).childNodes)}},function(e,t){c.fn[e]=function(n){var r=this,i;if(r.length>1)throw new Error("DomQuery only supports traverse functions on a single node.");return r[0]&&(i=t(r[0],n)),i=c(i),n&&"parentsUntil"!==e?i.filter(n):i}}),c.fn.filter=function(e){return c.filter(e)},c.fn.is=function(e){return!!e&&this.filter(e).length>0},c.fn.init.prototype=c.fn,c}),r(d,[],function(){return function(e,t){function n(e,t,n,r){function i(e){return e=parseInt(e,10).toString(16),e.length>1?e:"0"+e}return"#"+i(t)+i(n)+i(r)}var r=/rgb\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/gi,i=/(?:url(?:(?:\(\s*\"([^\"]+)\"\s*\))|(?:\(\s*\'([^\']+)\'\s*\))|(?:\(\s*([^)\s]+)\s*\))))|(?:\'([^\']+)\')|(?:\"([^\"]+)\")/gi,o=/\s*([^:]+):\s*([^;]+);?/g,a=/\s+$/,s,l,c={},u,d="\ufeff";
for(e=e||{},u=("\\\" \\' \\; \\: ; : "+d).split(" "),l=0;l<u.length;l++)c[u[l]]=d+l,c[d+l]=u[l];return{toHex:function(e){return e.replace(r,n)},parse:function(t){function s(e,t){var n,r,i,o;"none"===h["border-image"]&&delete h["border-image"],n=h[e+"-top"+t],n&&(r=h[e+"-right"+t],n==r&&(i=h[e+"-bottom"+t],r==i&&(o=h[e+"-left"+t],i==o&&(h[e+t]=o,delete h[e+"-top"+t],delete h[e+"-right"+t],delete h[e+"-bottom"+t],delete h[e+"-left"+t]))))}function l(e){var t=h[e],n;if(t&&!(t.indexOf(" ")<0)){for(t=t.split(" "),n=t.length;n--;)if(t[n]!==t[0])return!1;return h[e]=t[0],!0}}function u(e,t,n,r){l(t)&&l(n)&&l(r)&&(h[e]=h[t]+" "+h[n]+" "+h[r],delete h[t],delete h[n],delete h[r])}function d(e){return y=!0,c[e]}function f(e,t){return y&&(e=e.replace(/\uFEFF[0-9]/g,function(e){return c[e]})),t||(e=e.replace(/\\([\'\";:])/g,"$1")),e}function p(e,t,n,r,i,o){return(i=i||o)?(i=f(i),"'"+i.replace(/\'/g,"\\'")+"'"):(t=f(t||n||r),b&&(t=b.call(C,t,"style")),"url('"+t.replace(/\'/g,"\\'")+"')")}var h={},m,g,v,y,b=e.url_converter,C=e.url_converter_scope||this;if(t){for(t=t.replace(/\\[\"\';:\uFEFF]/g,d).replace(/\"[^\"]+\"|\'[^\']+\'/g,function(e){return e.replace(/[;:]/g,d)});m=o.exec(t);)g=m[1].replace(a,"").toLowerCase(),v=m[2].replace(a,""),g&&v.length>0&&("font-weight"===g&&"700"===v?v="bold":("color"===g||"background-color"===g)&&(v=v.toLowerCase()),v=v.replace(r,n),v=v.replace(i,p),h[g]=y?f(v,!0):v),o.lastIndex=m.index+m[0].length;s("border",""),s("border","-width"),s("border","-color"),s("border","-style"),s("padding",""),s("margin",""),u("border","border-width","border-style","border-color"),"medium none"===h.border&&delete h.border}return h},serialize:function(e,n){function r(n){var r,o,a,l;if(r=t.styles[n])for(o=0,a=r.length;a>o;o++)n=r[o],l=e[n],l!==s&&l.length>0&&(i+=(i.length>0?" ":"")+n+": "+l+";")}var i="",o,a;if(n&&t&&t.styles)r("*"),r(n);else for(o in e)a=e[o],a!==s&&a.length>0&&(i+=(i.length>0?" ":"")+o+": "+a+";");return i}}}}),r(f,[],function(){return function(e,t){function n(e,n,r,i){var o,a;if(e){if(!i&&e[n])return e[n];if(e!=t){if(o=e[r])return o;for(a=e.parentNode;a&&a!=t;a=a.parentNode)if(o=a[r])return o}}}var r=e;this.current=function(){return r},this.next=function(e){return r=n(r,"firstChild","nextSibling",e)},this.prev=function(e){return r=n(r,"lastChild","previousSibling",e)}}}),r(p,[],function(){function e(e,n){return n?"array"==n&&g(e)?!0:typeof e==n:e!==t}function n(e){var t=[],n,r;for(n=0,r=e.length;r>n;n++)t[n]=e[n];return t}function r(e,t,n){var r;for(e=e||[],t=t||",","string"==typeof e&&(e=e.split(t)),n=n||{},r=e.length;r--;)n[e[r]]={};return n}function i(e,n,r){var i,o;if(!e)return 0;if(r=r||e,e.length!==t){for(i=0,o=e.length;o>i;i++)if(n.call(r,e[i],i,e)===!1)return 0}else for(i in e)if(e.hasOwnProperty(i)&&n.call(r,e[i],i,e)===!1)return 0;return 1}function o(e,t){var n=[];return i(e,function(e){n.push(t(e))}),n}function a(e,t){var n=[];return i(e,function(e){(!t||t(e))&&n.push(e)}),n}function s(e,t,n){var r=this,i,o,a,s,l,c=0;if(e=/^((static) )?([\w.]+)(:([\w.]+))?/.exec(e),a=e[3].match(/(^|\.)(\w+)$/i)[2],o=r.createNS(e[3].replace(/\.\w+$/,""),n),!o[a]){if("static"==e[2])return o[a]=t,this.onCreate&&this.onCreate(e[2],e[3],o[a]),void 0;t[a]||(t[a]=function(){},c=1),o[a]=t[a],r.extend(o[a].prototype,t),e[5]&&(i=r.resolve(e[5]).prototype,s=e[5].match(/\.(\w+)$/i)[1],l=o[a],o[a]=c?function(){return i[s].apply(this,arguments)}:function(){return this.parent=i[s],l.apply(this,arguments)},o[a].prototype[a]=o[a],r.each(i,function(e,t){o[a].prototype[t]=i[t]}),r.each(t,function(e,t){i[t]?o[a].prototype[t]=function(){return this.parent=i[t],e.apply(this,arguments)}:t!=a&&(o[a].prototype[t]=e)})),r.each(t["static"],function(e,t){o[a][t]=e})}}function l(e,t){var n,r;if(e)for(n=0,r=e.length;r>n;n++)if(e[n]===t)return n;return-1}function c(e,n){var r,i,o,a=arguments,s;for(r=1,i=a.length;i>r;r++){n=a[r];for(o in n)n.hasOwnProperty(o)&&(s=n[o],s!==t&&(e[o]=s))}return e}function u(e,t,n,r){r=r||this,e&&(n&&(e=e[n]),i(e,function(e,i){return t.call(r,e,i,n)===!1?!1:(u(e,t,n,r),void 0)}))}function d(e,t){var n,r;for(t=t||window,e=e.split("."),n=0;n<e.length;n++)r=e[n],t[r]||(t[r]={}),t=t[r];return t}function f(e,t){var n,r;for(t=t||window,e=e.split("."),n=0,r=e.length;r>n&&(t=t[e[n]],t);n++);return t}function p(t,n){return!t||e(t,"array")?t:o(t.split(n||","),m)}var h=/^\s*|\s*$/g,m=function(e){return null===e||e===t?"":(""+e).replace(h,"")},g=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)};return{trim:m,isArray:g,is:e,toArray:n,makeMap:r,each:i,map:o,grep:a,inArray:l,extend:c,create:s,walk:u,createNS:d,resolve:f,explode:p}}),r(h,[p],function(e){function t(n){function r(){return M.createDocumentFragment()}function i(e,t){_(F,e,t)}function o(e,t){_(z,e,t)}function a(e){i(e.parentNode,$(e))}function s(e){i(e.parentNode,$(e)+1)}function l(e){o(e.parentNode,$(e))}function c(e){o(e.parentNode,$(e)+1)}function u(e){e?(D[U]=D[V],D[q]=D[W]):(D[V]=D[U],D[W]=D[q]),D.collapsed=F}function d(e){a(e),c(e)}function f(e){i(e,0),o(e,1===e.nodeType?e.childNodes.length:e.nodeValue.length)}function p(e,t){var n=D[V],r=D[W],i=D[U],o=D[q],a=t.startContainer,s=t.startOffset,l=t.endContainer,c=t.endOffset;return 0===e?w(n,r,a,s):1===e?w(i,o,a,s):2===e?w(i,o,l,c):3===e?w(n,r,l,c):void 0}function h(){N(I)}function m(){return N(P)}function g(){return N(O)}function v(e){var t=this[V],r=this[W],i,o;3!==t.nodeType&&4!==t.nodeType||!t.nodeValue?(t.childNodes.length>0&&(o=t.childNodes[r]),o?t.insertBefore(e,o):3==t.nodeType?n.insertAfter(e,t):t.appendChild(e)):r?r>=t.nodeValue.length?n.insertAfter(e,t):(i=t.splitText(r),t.parentNode.insertBefore(e,i)):t.parentNode.insertBefore(e,t)}function y(e){var t=D.extractContents();D.insertNode(e),e.appendChild(t),D.selectNode(e)}function b(){return j(new t(n),{startContainer:D[V],startOffset:D[W],endContainer:D[U],endOffset:D[q],collapsed:D.collapsed,commonAncestorContainer:D.commonAncestorContainer})}function C(e,t){var n;if(3==e.nodeType)return e;if(0>t)return e;for(n=e.firstChild;n&&t>0;)--t,n=n.nextSibling;return n?n:e}function x(){return D[V]==D[U]&&D[W]==D[q]}function w(e,t,r,i){var o,a,s,l,c,u;if(e==r)return t==i?0:i>t?-1:1;for(o=r;o&&o.parentNode!=e;)o=o.parentNode;if(o){for(a=0,s=e.firstChild;s!=o&&t>a;)a++,s=s.nextSibling;return a>=t?-1:1}for(o=e;o&&o.parentNode!=r;)o=o.parentNode;if(o){for(a=0,s=r.firstChild;s!=o&&i>a;)a++,s=s.nextSibling;return i>a?-1:1}for(l=n.findCommonAncestor(e,r),c=e;c&&c.parentNode!=l;)c=c.parentNode;for(c||(c=l),u=r;u&&u.parentNode!=l;)u=u.parentNode;if(u||(u=l),c==u)return 0;for(s=l.firstChild;s;){if(s==c)return-1;if(s==u)return 1;s=s.nextSibling}}function _(e,t,r){var i,o;for(e?(D[V]=t,D[W]=r):(D[U]=t,D[q]=r),i=D[U];i.parentNode;)i=i.parentNode;for(o=D[V];o.parentNode;)o=o.parentNode;o==i?w(D[V],D[W],D[U],D[q])>0&&D.collapse(e):D.collapse(e),D.collapsed=x(),D.commonAncestorContainer=n.findCommonAncestor(D[V],D[U])}function N(e){var t,n=0,r=0,i,o,a,s,l,c;if(D[V]==D[U])return E(e);for(t=D[U],i=t.parentNode;i;t=i,i=i.parentNode){if(i==D[V])return S(t,e);++n}for(t=D[V],i=t.parentNode;i;t=i,i=i.parentNode){if(i==D[U])return k(t,e);++r}for(o=r-n,a=D[V];o>0;)a=a.parentNode,o--;for(s=D[U];0>o;)s=s.parentNode,o++;for(l=a.parentNode,c=s.parentNode;l!=c;l=l.parentNode,c=c.parentNode)a=l,s=c;return T(a,s,e)}function E(e){var t,n,i,o,a,s,l,c,u;if(e!=I&&(t=r()),D[W]==D[q])return t;if(3==D[V].nodeType){if(n=D[V].nodeValue,i=n.substring(D[W],D[q]),e!=O&&(o=D[V],c=D[W],u=D[q]-D[W],0===c&&u>=o.nodeValue.length-1?o.parentNode.removeChild(o):o.deleteData(c,u),D.collapse(F)),e==I)return;return i.length>0&&t.appendChild(M.createTextNode(i)),t}for(o=C(D[V],D[W]),a=D[q]-D[W];o&&a>0;)s=o.nextSibling,l=L(o,e),t&&t.appendChild(l),--a,o=s;return e!=O&&D.collapse(F),t}function S(e,t){var n,i,o,a,s,l;if(t!=I&&(n=r()),i=R(e,t),n&&n.appendChild(i),o=$(e),a=o-D[W],0>=a)return t!=O&&(D.setEndBefore(e),D.collapse(z)),n;for(i=e.previousSibling;a>0;)s=i.previousSibling,l=L(i,t),n&&n.insertBefore(l,n.firstChild),--a,i=s;return t!=O&&(D.setEndBefore(e),D.collapse(z)),n}function k(e,t){var n,i,o,a,s,l;for(t!=I&&(n=r()),o=A(e,t),n&&n.appendChild(o),i=$(e),++i,a=D[q]-i,o=e.nextSibling;o&&a>0;)s=o.nextSibling,l=L(o,t),n&&n.appendChild(l),--a,o=s;return t!=O&&(D.setStartAfter(e),D.collapse(F)),n}function T(e,t,n){var i,o,a,s,l,c,u,d;for(n!=I&&(o=r()),i=A(e,n),o&&o.appendChild(i),a=e.parentNode,s=$(e),l=$(t),++s,c=l-s,u=e.nextSibling;c>0;)d=u.nextSibling,i=L(u,n),o&&o.appendChild(i),u=d,--c;return i=R(t,n),o&&o.appendChild(i),n!=O&&(D.setStartAfter(e),D.collapse(F)),o}function R(e,t){var n=C(D[U],D[q]-1),r,i,o,a,s,l=n!=D[U];if(n==e)return B(n,l,z,t);for(r=n.parentNode,i=B(r,z,z,t);r;){for(;n;)o=n.previousSibling,a=B(n,l,z,t),t!=I&&i.insertBefore(a,i.firstChild),l=F,n=o;if(r==e)return i;n=r.previousSibling,r=r.parentNode,s=B(r,z,z,t),t!=I&&s.appendChild(i),i=s}}function A(e,t){var n=C(D[V],D[W]),r=n!=D[V],i,o,a,s,l;if(n==e)return B(n,r,F,t);for(i=n.parentNode,o=B(i,z,F,t);i;){for(;n;)a=n.nextSibling,s=B(n,r,F,t),t!=I&&o.appendChild(s),r=F,n=a;if(i==e)return o;n=i.nextSibling,i=i.parentNode,l=B(i,z,F,t),t!=I&&l.appendChild(o),o=l}}function B(e,t,r,i){var o,a,s,l,c;if(t)return L(e,i);if(3==e.nodeType){if(o=e.nodeValue,r?(l=D[W],a=o.substring(l),s=o.substring(0,l)):(l=D[q],a=o.substring(0,l),s=o.substring(l)),i!=O&&(e.nodeValue=s),i==I)return;return c=n.clone(e,z),c.nodeValue=a,c}if(i!=I)return n.clone(e,z)}function L(e,t){return t!=I?t==O?n.clone(e,F):e:(e.parentNode.removeChild(e),void 0)}function H(){return n.create("body",null,g()).outerText}var D=this,M=n.doc,P=0,O=1,I=2,F=!0,z=!1,W="startOffset",V="startContainer",U="endContainer",q="endOffset",j=e.extend,$=n.nodeIndex;return j(D,{startContainer:M,startOffset:0,endContainer:M,endOffset:0,collapsed:F,commonAncestorContainer:M,START_TO_START:0,START_TO_END:1,END_TO_END:2,END_TO_START:3,setStart:i,setEnd:o,setStartBefore:a,setStartAfter:s,setEndBefore:l,setEndAfter:c,collapse:u,selectNode:d,selectNodeContents:f,compareBoundaryPoints:p,deleteContents:h,extractContents:m,cloneContents:g,insertNode:v,surroundContents:y,cloneRange:b,toStringIE:H}),D}return t.prototype.toString=function(){return this.toStringIE()},t}),r(m,[p],function(e){function t(e){var t;return t=document.createElement("div"),t.innerHTML=e,t.textContent||t.innerText||e}function n(e,t){var n,r,i,a={};if(e){for(e=e.split(","),t=t||10,n=0;n<e.length;n+=2)r=String.fromCharCode(parseInt(e[n],t)),o[r]||(i="&"+e[n+1]+";",a[r]=i,a[i]=r);return a}}var r=e.makeMap,i,o,a,s=/[&<>\"\u007E-\uD7FF\uE000-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g,l=/[<>&\u007E-\uD7FF\uE000-\uFFEF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g,c=/[<>&\"\']/g,u=/&(#x|#)?([\w]+);/g,d={128:"\u20ac",130:"\u201a",131:"\u0192",132:"\u201e",133:"\u2026",134:"\u2020",135:"\u2021",136:"\u02c6",137:"\u2030",138:"\u0160",139:"\u2039",140:"\u0152",142:"\u017d",145:"\u2018",146:"\u2019",147:"\u201c",148:"\u201d",149:"\u2022",150:"\u2013",151:"\u2014",152:"\u02dc",153:"\u2122",154:"\u0161",155:"\u203a",156:"\u0153",158:"\u017e",159:"\u0178"};o={'"':"&quot;","'":"&#39;","<":"&lt;",">":"&gt;","&":"&amp;"},a={"&lt;":"<","&gt;":">","&amp;":"&","&quot;":'"',"&apos;":"'"},i=n("50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34,5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil,68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc,7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash,7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta,sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,t9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau,u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip,81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym,8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro",32);var f={encodeRaw:function(e,t){return e.replace(t?s:l,function(e){return o[e]||e})},encodeAllRaw:function(e){return(""+e).replace(c,function(e){return o[e]||e})},encodeNumeric:function(e,t){return e.replace(t?s:l,function(e){return e.length>1?"&#"+(1024*(e.charCodeAt(0)-55296)+(e.charCodeAt(1)-56320)+65536)+";":o[e]||"&#"+e.charCodeAt(0)+";"})},encodeNamed:function(e,t,n){return n=n||i,e.replace(t?s:l,function(e){return o[e]||n[e]||e})},getEncodeFunc:function(e,t){function a(e,n){return e.replace(n?s:l,function(e){return o[e]||t[e]||"&#"+e.charCodeAt(0)+";"||e})}function c(e,n){return f.encodeNamed(e,n,t)}return t=n(t)||i,e=r(e.replace(/\+/g,",")),e.named&&e.numeric?a:e.named?t?c:f.encodeNamed:e.numeric?f.encodeNumeric:f.encodeRaw},decode:function(e){return e.replace(u,function(e,n,r){return n?(r=parseInt(r,2===n.length?16:10),r>65535?(r-=65536,String.fromCharCode(55296+(r>>10),56320+(1023&r))):d[r]||String.fromCharCode(r)):a[e]||i[e]||t(e)})}};return f}),r(g,[],function(){var e=navigator,t=e.userAgent,n,r,i,o,a,s,l;n=window.opera&&window.opera.buildNumber,r=/WebKit/.test(t),i=!r&&!n&&/MSIE/gi.test(t)&&/Explorer/gi.test(e.appName),i=i&&/MSIE (\w+)\./.exec(t)[1],o=-1!=t.indexOf("Trident")?11:!1,i=i||o,a=!r&&/Gecko/.test(t),s=-1!=t.indexOf("Mac"),l=/(iPad|iPhone)/.test(t);var c=!l||t.match(/AppleWebKit\/(\d*)/)[1]>=534;return{opera:n,webkit:r,ie:i,gecko:a,mac:s,iOS:l,contentEditable:c,transparentSrc:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",caretAfter:8!=i,range:window.getSelection&&"Range"in window,documentMode:i?document.documentMode||7:10}}),r(v,[c,d,l,f,h,m,g,p],function(e,n,r,i,o,a,s,l){function c(e,t){var i=this,o;i.doc=e,i.win=window,i.files={},i.counter=0,i.stdMode=!g||e.documentMode>=8,i.boxModel=!g||"CSS1Compat"==e.compatMode||i.stdMode,i.hasOuterHTML="outerHTML"in e.createElement("a"),this.boundEvents=[],i.settings=t=h({keep_values:!1,hex_colors:1},t),i.schema=t.schema,i.styles=new n({url_converter:t.url_converter,url_converter_scope:t.url_converter_scope},t.schema),i.fixDoc(e),i.events=t.ownEvents?new r(t.proxy):r.Event,o=t.schema?t.schema.getBlockElements():{},i.isBlock=function(e){if(!e)return!1;var t=e.nodeType;return t?!(1!==t||!o[e.nodeName]):!!o[e]}}var u=l.each,d=l.is,f=l.grep,p=l.trim,h=l.extend,m=s.webkit,g=s.ie,v=/^([a-z0-9],?)+$/i,y=/^[ \t\r\n]*$/,b=l.makeMap("fillOpacity fontWeight lineHeight opacity orphans widows zIndex zoom"," ");return c.prototype={root:null,props:{"for":"htmlFor","class":"className",className:"className",checked:"checked",disabled:"disabled",maxlength:"maxLength",readonly:"readOnly",selected:"selected",value:"value",id:"id",name:"name",type:"type"},fixDoc:function(e){var t=this.settings,n;if(g&&t.schema){"abbr article aside audio canvas details figcaption figure footer header hgroup mark menu meter nav output progress section summary time video".replace(/\w+/g,function(t){e.createElement(t)});for(n in t.schema.getCustomElements())e.createElement(n)}},clone:function(e,t){var n=this,r,i;return!g||1!==e.nodeType||t?e.cloneNode(t):(i=n.doc,t?r.firstChild:(r=i.createElement(e.nodeName),u(n.getAttribs(e),function(t){n.setAttrib(r,t.nodeName,n.getAttrib(e,t.nodeName))}),r))},getRoot:function(){var e=this;return e.get(e.settings.root_element)||e.doc.body},getViewPort:function(e){var t,n;return e=e?e:this.win,t=e.document,n=this.boxModel?t.documentElement:t.body,{x:e.pageXOffset||n.scrollLeft,y:e.pageYOffset||n.scrollTop,w:e.innerWidth||n.clientWidth,h:e.innerHeight||n.clientHeight}},getRect:function(e){var t=this,n,r;return e=t.get(e),n=t.getPos(e),r=t.getSize(e),{x:n.x,y:n.y,w:r.w,h:r.h}},getSize:function(e){var t=this,n,r;return e=t.get(e),n=t.getStyle(e,"width"),r=t.getStyle(e,"height"),-1===n.indexOf("px")&&(n=0),-1===r.indexOf("px")&&(r=0),{w:parseInt(n,10)||e.offsetWidth||e.clientWidth,h:parseInt(r,10)||e.offsetHeight||e.clientHeight}},getParent:function(e,t,n){return this.getParents(e,t,n,!1)},getParents:function(e,n,r,i){var o=this,a,s=[];for(e=o.get(e),i=i===t,r=r||("BODY"!=o.getRoot().nodeName?o.getRoot().parentNode:null),d(n,"string")&&(a=n,n="*"===n?function(e){return 1==e.nodeType}:function(e){return o.is(e,a)});e&&e!=r&&e.nodeType&&9!==e.nodeType;){if(!n||n(e)){if(!i)return e;s.push(e)}e=e.parentNode}return i?s:null},get:function(e){var t;return e&&this.doc&&"string"==typeof e&&(t=e,e=this.doc.getElementById(e),e&&e.id!==t)?this.doc.getElementsByName(t)[1]:e},getNext:function(e,t){return this._findSib(e,t,"nextSibling")},getPrev:function(e,t){return this._findSib(e,t,"previousSibling")},select:function(t,n){var r=this;return e(t,r.get(n)||r.get(r.settings.root_element)||r.doc,[])},is:function(n,r){var i;if(n.length===t){if("*"===r)return 1==n.nodeType;if(v.test(r)){for(r=r.toLowerCase().split(/,/),n=n.nodeName.toLowerCase(),i=r.length-1;i>=0;i--)if(r[i]==n)return!0;return!1}}return n.nodeType&&1!=n.nodeType?!1:e.matches(r,n.nodeType?[n]:n).length>0},add:function(e,t,n,r,i){var o=this;return this.run(e,function(e){var a;return a=d(t,"string")?o.doc.createElement(t):t,o.setAttribs(a,n),r&&(r.nodeType?a.appendChild(r):o.setHTML(a,r)),i?a:e.appendChild(a)})},create:function(e,t,n){return this.add(this.doc.createElement(e),e,t,n,1)},createHTML:function(e,t,n){var r="",i;r+="<"+e;for(i in t)t.hasOwnProperty(i)&&null!==t[i]&&(r+=" "+i+'="'+this.encode(t[i])+'"');return"undefined"!=typeof n?r+">"+n+"</"+e+">":r+" />"},createFragment:function(e){var t,n,r=this.doc,i;for(i=r.createElement("div"),t=r.createDocumentFragment(),e&&(i.innerHTML=e);n=i.firstChild;)t.appendChild(n);return t},remove:function(e,t){return this.run(e,function(e){var n,r=e.parentNode;if(!r)return null;if(t)for(;n=e.firstChild;)!g||3!==n.nodeType||n.nodeValue?r.insertBefore(n,e):e.removeChild(n);return r.removeChild(e)})},setStyle:function(e,t,n){return this.run(e,function(e){var r=this,i,o;if(t)if("string"==typeof t){i=e.style,t=t.replace(/-(\D)/g,function(e,t){return t.toUpperCase()}),"number"!=typeof n||b[t]||(n+="px"),"opacity"===t&&e.runtimeStyle&&"undefined"==typeof e.runtimeStyle.opacity&&(i.filter=""===n?"":"alpha(opacity="+100*n+")"),"float"==t&&(t="cssFloat"in e.style?"cssFloat":"styleFloat");try{i[t]=n}catch(a){}r.settings.update_styles&&e.removeAttribute("data-mce-style")}else for(o in t)r.setStyle(e,o,t[o])})},getStyle:function(e,n,r){if(e=this.get(e)){if(this.doc.defaultView&&r){n=n.replace(/[A-Z]/g,function(e){return"-"+e});try{return this.doc.defaultView.getComputedStyle(e,null).getPropertyValue(n)}catch(i){return null}}return n=n.replace(/-(\D)/g,function(e,t){return t.toUpperCase()}),"float"==n&&(n=g?"styleFloat":"cssFloat"),e.currentStyle&&r?e.currentStyle[n]:e.style?e.style[n]:t}},setStyles:function(e,t){this.setStyle(e,t)},css:function(e,t,n){this.setStyle(e,t,n)},removeAllAttribs:function(e){return this.run(e,function(e){var t,n=e.attributes;for(t=n.length-1;t>=0;t--)e.removeAttributeNode(n.item(t))})},setAttrib:function(e,t,n){var r=this;if(e&&t)return this.run(e,function(e){var i=r.settings,o=e.getAttribute(t);if(null!==n)switch(t){case"style":if(!d(n,"string"))return u(n,function(t,n){r.setStyle(e,n,t)}),void 0;i.keep_values&&(n?e.setAttribute("data-mce-style",n,2):e.removeAttribute("data-mce-style",2)),e.style.cssText=n;break;case"class":e.className=n||"";break;case"src":case"href":i.keep_values&&(i.url_converter&&(n=i.url_converter.call(i.url_converter_scope||r,n,t,e)),r.setAttrib(e,"data-mce-"+t,n,2));break;case"shape":e.setAttribute("data-mce-style",n)}d(n)&&null!==n&&0!==n.length?e.setAttribute(t,""+n,2):e.removeAttribute(t,2),o!=n&&i.onSetAttrib&&i.onSetAttrib({attrElm:e,attrName:t,attrValue:n})})},setAttribs:function(e,t){var n=this;return this.run(e,function(e){u(t,function(t,r){n.setAttrib(e,r,t)})})},getAttrib:function(e,t,n){var r,i=this,o;if(e=i.get(e),!e||1!==e.nodeType)return n===o?!1:n;if(d(n)||(n=""),/^(src|href|style|coords|shape)$/.test(t)&&(r=e.getAttribute("data-mce-"+t)))return r;if(g&&i.props[t]&&(r=e[i.props[t]],r=r&&r.nodeValue?r.nodeValue:r),r||(r=e.getAttribute(t,2)),/^(checked|compact|declare|defer|disabled|ismap|multiple|nohref|noshade|nowrap|readonly|selected)$/.test(t))return e[i.props[t]]===!0&&""===r?t:r?t:"";if("FORM"===e.nodeName&&e.getAttributeNode(t))return e.getAttributeNode(t).nodeValue;if("style"===t&&(r=r||e.style.cssText,r&&(r=i.serializeStyle(i.parseStyle(r),e.nodeName),i.settings.keep_values&&e.setAttribute("data-mce-style",r))),m&&"class"===t&&r&&(r=r.replace(/(apple|webkit)\-[a-z\-]+/gi,"")),g)switch(t){case"rowspan":case"colspan":1===r&&(r="");break;case"size":("+0"===r||20===r||0===r)&&(r="");break;case"width":case"height":case"vspace":case"checked":case"disabled":case"readonly":0===r&&(r="");break;case"hspace":-1===r&&(r="");break;case"maxlength":case"tabindex":(32768===r||2147483647===r||"32768"===r)&&(r="");break;case"multiple":case"compact":case"noshade":case"nowrap":return 65535===r?t:n;case"shape":r=r.toLowerCase();break;default:0===t.indexOf("on")&&r&&(r=(""+r).replace(/^function\s+\w+\(\)\s+\{\s+(.*)\s+\}$/,"$1"))}return r!==o&&null!==r&&""!==r?""+r:n},getPos:function(e,t){var n=this,r=0,i=0,o,a=n.doc,s;if(e=n.get(e),t=t||a.body,e){if(t===a.body&&e.getBoundingClientRect)return s=e.getBoundingClientRect(),t=n.boxModel?a.documentElement:a.body,r=s.left+(a.documentElement.scrollLeft||a.body.scrollLeft)-t.clientTop,i=s.top+(a.documentElement.scrollTop||a.body.scrollTop)-t.clientLeft,{x:r,y:i};for(o=e;o&&o!=t&&o.nodeType;)r+=o.offsetLeft||0,i+=o.offsetTop||0,o=o.offsetParent;for(o=e.parentNode;o&&o!=t&&o.nodeType;)r-=o.scrollLeft||0,i-=o.scrollTop||0,o=o.parentNode}return{x:r,y:i}},parseStyle:function(e){return this.styles.parse(e)},serializeStyle:function(e,t){return this.styles.serialize(e,t)},addStyle:function(e){var t=this,n=t.doc,r,i;if(t!==c.DOM&&n===document){var o=c.DOM.addedStyles;if(o=o||[],o[e])return;o[e]=!0,c.DOM.addedStyles=o}i=n.getElementById("mceDefaultStyles"),i||(i=n.createElement("style"),i.id="mceDefaultStyles",i.type="text/css",r=n.getElementsByTagName("head")[0],r.firstChild?r.insertBefore(i,r.firstChild):r.appendChild(i)),i.styleSheet?i.styleSheet.cssText+=e:i.appendChild(n.createTextNode(e))},loadCSS:function(e){var t=this,n=t.doc,r;return t!==c.DOM&&n===document?(c.DOM.loadCSS(e),void 0):(e||(e=""),r=n.getElementsByTagName("head")[0],u(e.split(","),function(e){var i;t.files[e]||(t.files[e]=!0,i=t.create("link",{rel:"stylesheet",href:e}),g&&n.documentMode&&n.recalc&&(i.onload=function(){n.recalc&&n.recalc(),i.onload=null}),r.appendChild(i))}),void 0)},addClass:function(e,t){return this.run(e,function(e){var n;return t?this.hasClass(e,t)?e.className:(n=this.removeClass(e,t),e.className=n=(""!==n?n+" ":"")+t,n):0})},removeClass:function(e,t){var n=this,r;return n.run(e,function(e){var i;return n.hasClass(e,t)?(r||(r=new RegExp("(^|\\s+)"+t+"(\\s+|$)","g")),i=e.className.replace(r," "),i=p(" "!=i?i:""),e.className=i,i||(e.removeAttribute("class"),e.removeAttribute("className")),i):e.className})},hasClass:function(e,t){return e=this.get(e),e&&t?-1!==(" "+e.className+" ").indexOf(" "+t+" "):!1},toggleClass:function(e,n,r){r=r===t?!this.hasClass(e,n):r,this.hasClass(e,n)!==r&&(r?this.addClass(e,n):this.removeClass(e,n))},show:function(e){return this.setStyle(e,"display","block")},hide:function(e){return this.setStyle(e,"display","none")},isHidden:function(e){return e=this.get(e),!e||"none"==e.style.display||"none"==this.getStyle(e,"display")},uniqueId:function(e){return(e?e:"mce_")+this.counter++},setHTML:function(e,t){var n=this;return n.run(e,function(e){if(g){for(;e.firstChild;)e.removeChild(e.firstChild);try{e.innerHTML="<br />"+t,e.removeChild(e.firstChild)}catch(r){var i=n.create("div");i.innerHTML="<br />"+t,u(f(i.childNodes),function(t,n){n&&e.canHaveHTML&&e.appendChild(t)})}}else e.innerHTML=t;return t})},getOuterHTML:function(e){var t,n=this;return(e=n.get(e))?1===e.nodeType&&n.hasOuterHTML?e.outerHTML:(t=(e.ownerDocument||n.doc).createElement("body"),t.appendChild(e.cloneNode(!0)),t.innerHTML):null},setOuterHTML:function(e,t,n){var r=this;return r.run(e,function(e){function i(){var i,o;for(o=n.createElement("body"),o.innerHTML=t,i=o.lastChild;i;)r.insertAfter(i.cloneNode(!0),e),i=i.previousSibling;r.remove(e)}if(1==e.nodeType)if(n=n||e.ownerDocument||r.doc,g)try{1==e.nodeType&&r.hasOuterHTML?e.outerHTML=t:i()}catch(o){i()}else i()})},decode:a.decode,encode:a.encodeAllRaw,insertAfter:function(e,t){return t=this.get(t),this.run(e,function(e){var n,r;return n=t.parentNode,r=t.nextSibling,r?n.insertBefore(e,r):n.appendChild(e),e})},replace:function(e,t,n){var r=this;return r.run(t,function(t){return d(t,"array")&&(e=e.cloneNode(!0)),n&&u(f(t.childNodes),function(t){e.appendChild(t)}),t.parentNode.replaceChild(e,t)})},rename:function(e,t){var n=this,r;return e.nodeName!=t.toUpperCase()&&(r=n.create(t),u(n.getAttribs(e),function(t){n.setAttrib(r,t.nodeName,n.getAttrib(e,t.nodeName))}),n.replace(r,e,1)),r||e},findCommonAncestor:function(e,t){for(var n=e,r;n;){for(r=t;r&&n!=r;)r=r.parentNode;if(n==r)break;n=n.parentNode}return!n&&e.ownerDocument?e.ownerDocument.documentElement:n},toHex:function(e){return this.styles.toHex(l.trim(e))},run:function(e,t,n){var r=this,i;return"string"==typeof e&&(e=r.get(e)),e?(n=n||this,e.nodeType||!e.length&&0!==e.length?t.call(n,e):(i=[],u(e,function(e,o){e&&("string"==typeof e&&(e=r.get(e)),i.push(t.call(n,e,o)))}),i)):!1},getAttribs:function(e){var t;if(e=this.get(e),!e)return[];if(g){if(t=[],"OBJECT"==e.nodeName)return e.attributes;"OPTION"===e.nodeName&&this.getAttrib(e,"selected")&&t.push({specified:1,nodeName:"selected"});var n=/<\/?[\w:\-]+ ?|=[\"][^\"]+\"|=\'[^\']+\'|=[\w\-]+|>/gi;return e.cloneNode(!1).outerHTML.replace(n,"").replace(/[\w:\-]+/gi,function(e){t.push({specified:1,nodeName:e})}),t}return e.attributes},isEmpty:function(e,t){var n=this,r,o,a,s,l,c=0;if(e=e.firstChild){s=new i(e,e.parentNode),t=t||n.schema?n.schema.getNonEmptyElements():null;do{if(a=e.nodeType,1===a){if(e.getAttribute("data-mce-bogus"))continue;if(l=e.nodeName.toLowerCase(),t&&t[l]){if("br"===l){c++;continue}return!1}for(o=n.getAttribs(e),r=e.attributes.length;r--;)if(l=e.attributes[r].nodeName,"name"===l||"data-mce-bookmark"===l)return!1}if(8==a)return!1;if(3===a&&!y.test(e.nodeValue))return!1}while(e=s.next())}return 1>=c},createRng:function(){var e=this.doc;return e.createRange?e.createRange():new o(this)},nodeIndex:function(e,t){var n=0,r,i,o;if(e)for(r=e.nodeType,e=e.previousSibling,i=e;e;e=e.previousSibling)o=e.nodeType,(!t||3!=o||o!=r&&e.nodeValue.length)&&(n++,r=o);return n},split:function(e,t,n){function r(e){function t(e){var t=e.previousSibling&&"SPAN"==e.previousSibling.nodeName,n=e.nextSibling&&"SPAN"==e.nextSibling.nodeName;return t&&n}var n,o=e.childNodes,a=e.nodeType;if(1!=a||"bookmark"!=e.getAttribute("data-mce-type")){for(n=o.length-1;n>=0;n--)r(o[n]);if(9!=a){if(3==a&&e.nodeValue.length>0){var s=p(e.nodeValue).length;if(!i.isBlock(e.parentNode)||s>0||0===s&&t(e))return}else if(1==a&&(o=e.childNodes,1==o.length&&o[0]&&1==o[0].nodeType&&"bookmark"==o[0].getAttribute("data-mce-type")&&e.parentNode.insertBefore(o[0],e),o.length||/^(br|hr|input|img)$/i.test(e.nodeName)))return;i.remove(e)}return e}}var i=this,o=i.createRng(),a,s,l;return e&&t?(o.setStart(e.parentNode,i.nodeIndex(e)),o.setEnd(t.parentNode,i.nodeIndex(t)),a=o.extractContents(),o=i.createRng(),o.setStart(t.parentNode,i.nodeIndex(t)+1),o.setEnd(e.parentNode,i.nodeIndex(e)+1),s=o.extractContents(),l=e.parentNode,l.insertBefore(r(a),e),n?l.replaceChild(n,t):l.insertBefore(t,e),l.insertBefore(r(s),e),i.remove(e),n||t):void 0},bind:function(e,t,n,r){var i=this;if(l.isArray(e)){for(var o=e.length;o--;)e[o]=i.bind(e[o],t,n,r);return e}return!i.settings.collect||e!==i.doc&&e!==i.win||i.boundEvents.push([e,t,n,r]),i.events.bind(e,t,n,r||i)},unbind:function(e,t,n){var r=this,i;if(l.isArray(e)){for(i=e.length;i--;)e[i]=r.unbind(e[i],t,n);return e}if(r.boundEvents&&(e===r.doc||e===r.win))for(i=r.boundEvents.length;i--;){var o=r.boundEvents[i];e!=o[0]||t&&t!=o[1]||n&&n!=o[2]||this.events.unbind(o[0],o[1],o[2])}return this.events.unbind(e,t,n)},fire:function(e,t,n){return this.events.fire(e,t,n)},getContentEditable:function(e){var t;return 1!=e.nodeType?null:(t=e.getAttribute("data-mce-contenteditable"),t&&"inherit"!==t?t:"inherit"!==e.contentEditable?e.contentEditable:null)},destroy:function(){var e=this;if(e.boundEvents){for(var t=e.boundEvents.length;t--;){var n=e.boundEvents[t];this.events.unbind(n[0],n[1],n[2])}e.boundEvents=null}e.win=e.doc=e.root=e.events=e.frag=null},dumpRng:function(e){return"startContainer: "+e.startContainer.nodeName+", startOffset: "+e.startOffset+", endContainer: "+e.endContainer.nodeName+", endOffset: "+e.endOffset},_findSib:function(e,t,n){var r=this,i=t;if(e)for("string"==typeof i&&(i=function(e){return r.is(e,t)}),e=e[n];e;e=e[n])if(i(e))return e;return null}},c.DOM=new c(document),c}),r(y,[v,p],function(e,t){function n(){function e(e,t){function n(){o.remove(s),a&&(a.onreadystatechange=a.onload=a=null),t()}function i(){"undefined"!=typeof console&&console.log&&console.log("Failed to load: "+e)}var o=r,a,s;s=o.uniqueId(),a=document.createElement("script"),a.id=s,a.type="text/javascript",a.src=e,"onreadystatechange"in a?a.onreadystatechange=function(){/loaded|complete/.test(a.readyState)&&n()}:a.onload=n,a.onerror=i,(document.getElementsByTagName("head")[0]||document.body).appendChild(a)}var t=0,n=1,a=2,s={},l=[],c={},u=[],d=0,f;this.isDone=function(e){return s[e]==a},this.markDone=function(e){s[e]=a},this.add=this.load=function(e,n,r){var i=s[e];i==f&&(l.push(e),s[e]=t),n&&(c[e]||(c[e]=[]),c[e].push({func:n,scope:r||this}))},this.loadQueue=function(e,t){this.loadScripts(l,e,t)},this.loadScripts=function(t,r,l){function p(e){i(c[e],function(e){e.func.call(e.scope)}),c[e]=f}var h;u.push({func:r,scope:l||this}),h=function(){var r=o(t);t.length=0,i(r,function(t){return s[t]==a?(p(t),void 0):(s[t]!=n&&(s[t]=n,d++,e(t,function(){s[t]=a,d--,p(t),h()})),void 0)}),d||(i(u,function(e){e.func.call(e.scope)}),u.length=0)},h()}}var r=e.DOM,i=t.each,o=t.grep;return n.ScriptLoader=new n,n}),r(b,[y,p],function(e,n){function r(){var e=this;e.items=[],e.urls={},e.lookup={}}var i=n.each;return r.prototype={get:function(e){return this.lookup[e]?this.lookup[e].instance:t},dependencies:function(e){var t;return this.lookup[e]&&(t=this.lookup[e].dependencies),t||[]},requireLangPack:function(t){r.language&&r.languageLoad!==!1&&e.ScriptLoader.add(this.urls[t]+"/langs/"+r.language+".js")},add:function(e,t,n){return this.items.push(t),this.lookup[e]={instance:t,dependencies:n},t},createUrl:function(e,t){return"object"==typeof t?t:{prefix:e.prefix,resource:t,suffix:e.suffix}
},addComponents:function(t,n){var r=this.urls[t];i(n,function(t){e.ScriptLoader.add(r+"/"+t)})},load:function(n,o,a,s){function l(){var r=c.dependencies(n);i(r,function(e){var n=c.createUrl(o,e);c.load(n.resource,n,t,t)}),a&&(s?a.call(s):a.call(e))}var c=this,u=o;c.urls[n]||("object"==typeof o&&(u=o.prefix+o.resource+o.suffix),0!==u.indexOf("/")&&-1==u.indexOf("://")&&(u=r.baseURL+"/"+u),c.urls[n]=u.substring(0,u.lastIndexOf("/")),c.lookup[n]?l():e.ScriptLoader.add(u,l,s))}},r.PluginManager=new r,r.ThemeManager=new r,r}),r(C,[],function(){function e(e,t,n){var r,i,o=n?"lastChild":"firstChild",a=n?"prev":"next";if(e[o])return e[o];if(e!==t){if(r=e[a])return r;for(i=e.parent;i&&i!==t;i=i.parent)if(r=i[a])return r}}function t(e,t){this.name=e,this.type=t,1===t&&(this.attributes=[],this.attributes.map={})}var n=/^[ \t\r\n]*$/,r={"#text":3,"#comment":8,"#cdata":4,"#pi":7,"#doctype":10,"#document-fragment":11};return t.prototype={replace:function(e){var t=this;return e.parent&&e.remove(),t.insert(e,t),t.remove(),t},attr:function(e,t){var n=this,r,i,o;if("string"!=typeof e){for(i in e)n.attr(i,e[i]);return n}if(r=n.attributes){if(t!==o){if(null===t){if(e in r.map)for(delete r.map[e],i=r.length;i--;)if(r[i].name===e)return r=r.splice(i,1),n;return n}if(e in r.map){for(i=r.length;i--;)if(r[i].name===e){r[i].value=t;break}}else r.push({name:e,value:t});return r.map[e]=t,n}return r.map[e]}},clone:function(){var e=this,n=new t(e.name,e.type),r,i,o,a,s;if(o=e.attributes){for(s=[],s.map={},r=0,i=o.length;i>r;r++)a=o[r],"id"!==a.name&&(s[s.length]={name:a.name,value:a.value},s.map[a.name]=a.value);n.attributes=s}return n.value=e.value,n.shortEnded=e.shortEnded,n},wrap:function(e){var t=this;return t.parent.insert(e,t),e.append(t),t},unwrap:function(){var e=this,t,n;for(t=e.firstChild;t;)n=t.next,e.insert(t,e,!0),t=n;e.remove()},remove:function(){var e=this,t=e.parent,n=e.next,r=e.prev;return t&&(t.firstChild===e?(t.firstChild=n,n&&(n.prev=null)):r.next=n,t.lastChild===e?(t.lastChild=r,r&&(r.next=null)):n.prev=r,e.parent=e.next=e.prev=null),e},append:function(e){var t=this,n;return e.parent&&e.remove(),n=t.lastChild,n?(n.next=e,e.prev=n,t.lastChild=e):t.lastChild=t.firstChild=e,e.parent=t,e},insert:function(e,t,n){var r;return e.parent&&e.remove(),r=t.parent||this,n?(t===r.firstChild?r.firstChild=e:t.prev.next=e,e.prev=t.prev,e.next=t,t.prev=e):(t===r.lastChild?r.lastChild=e:t.next.prev=e,e.next=t.next,e.prev=t,t.next=e),e.parent=r,e},getAll:function(t){var n=this,r,i=[];for(r=n.firstChild;r;r=e(r,n))r.name===t&&i.push(r);return i},empty:function(){var t=this,n,r,i;if(t.firstChild){for(n=[],i=t.firstChild;i;i=e(i,t))n.push(i);for(r=n.length;r--;)i=n[r],i.parent=i.firstChild=i.lastChild=i.next=i.prev=null}return t.firstChild=t.lastChild=null,t},isEmpty:function(t){var r=this,i=r.firstChild,o,a;if(i)do{if(1===i.type){if(i.attributes.map["data-mce-bogus"])continue;if(t[i.name])return!1;for(o=i.attributes.length;o--;)if(a=i.attributes[o].name,"name"===a||0===a.indexOf("data-mce-"))return!1}if(8===i.type)return!1;if(3===i.type&&!n.test(i.value))return!1}while(i=e(i,r));return!0},walk:function(t){return e(this,null,t)}},t.create=function(e,n){var i,o;if(i=new t(e,r[e]||1),n)for(o in n)i.attr(o,n[o]);return i},t}),r(x,[p],function(e){function t(e,t){return e?e.split(t||" "):[]}function n(e){function n(e,n,r){function i(e){var t={},n,r;for(n=0,r=e.length;r>n;n++)t[e[n]]={};return t}var o,l,c,u=arguments;for(r=r||[],n=n||"","string"==typeof r&&(r=t(r)),l=3;l<u.length;l++)"string"==typeof u[l]&&(u[l]=t(u[l])),r.push.apply(r,u[l]);for(e=t(e),o=e.length;o--;)c=[].concat(s,t(n)),a[e[o]]={attributes:i(c),attributesOrder:c,children:i(r)}}function i(e,n){var r,i,o,s;for(e=t(e),r=e.length,n=t(n);r--;)for(i=a[e[r]],o=0,s=n.length;s>o;o++)i.attributes[n[o]]={},i.attributesOrder.push(n[o])}var a={},s,l,c,u,d,f,p;return r[e]?r[e]:(s=t("id accesskey class dir lang style tabindex title"),l=t("onabort onblur oncancel oncanplay oncanplaythrough onchange onclick onclose oncontextmenu oncuechange ondblclick ondrag ondragend ondragenter ondragleave ondragover ondragstart ondrop ondurationchange onemptied onended onerror onfocus oninput oninvalid onkeydown onkeypress onkeyup onload onloadeddata onloadedmetadata onloadstart onmousedown onmousemove onmouseout onmouseover onmouseup onmousewheel onpause onplay onplaying onprogress onratechange onreset onscroll onseeked onseeking onseeking onselect onshow onstalled onsubmit onsuspend ontimeupdate onvolumechange onwaiting"),c=t("address blockquote div dl fieldset form h1 h2 h3 h4 h5 h6 hr menu ol p pre table ul"),u=t("a abbr b bdo br button cite code del dfn em embed i iframe img input ins kbd label map noscript object q s samp script select small span strong sub sup textarea u var #text #comment"),"html4"!=e&&(s.push.apply(s,t("contenteditable contextmenu draggable dropzone hidden spellcheck translate")),c.push.apply(c,t("article aside details dialog figure header footer hgroup section nav")),u.push.apply(u,t("audio canvas command datalist mark meter output progress time wbr video ruby bdi keygen"))),"html5-strict"!=e&&(s.push("xml:lang"),p=t("acronym applet basefont big font strike tt"),u.push.apply(u,p),o(p,function(e){n(e,"",u)}),f=t("center dir isindex noframes"),c.push.apply(c,f),d=[].concat(c,u),o(f,function(e){n(e,"",d)})),d=d||[].concat(c,u),n("html","manifest","head body"),n("head","","base command link meta noscript script style title"),n("title hr noscript br"),n("base","href target"),n("link","href rel media hreflang type sizes hreflang"),n("meta","name http-equiv content charset"),n("style","media type scoped"),n("script","src async defer type charset"),n("body","onafterprint onbeforeprint onbeforeunload onblur onerror onfocus onhashchange onload onmessage onoffline ononline onpagehide onpageshow onpopstate onresize onscroll onstorage onunload",d),n("address dt dd div caption","",d),n("h1 h2 h3 h4 h5 h6 pre p abbr code var samp kbd sub sup i b u bdo span legend em strong small s cite dfn","",u),n("blockquote","cite",d),n("ol","reversed start type","li"),n("ul","","li"),n("li","value",d),n("dl","","dt dd"),n("a","href target rel media hreflang type",u),n("q","cite",u),n("ins del","cite datetime",d),n("img","src alt usemap ismap width height"),n("iframe","src name width height",d),n("embed","src type width height"),n("object","data type typemustmatch name usemap form width height",d,"param"),n("param","name value"),n("map","name",d,"area"),n("area","alt coords shape href target rel media hreflang type"),n("table","border","caption colgroup thead tfoot tbody tr"+("html4"==e?" col":"")),n("colgroup","span","col"),n("col","span"),n("tbody thead tfoot","","tr"),n("tr","","td th"),n("td","colspan rowspan headers",d),n("th","colspan rowspan headers scope abbr",d),n("form","accept-charset action autocomplete enctype method name novalidate target",d),n("fieldset","disabled form name",d,"legend"),n("label","form for",u),n("input","accept alt autocomplete checked dirname disabled form formaction formenctype formmethod formnovalidate formtarget height list max maxlength min multiple name pattern readonly required size src step type value width"),n("button","disabled form formaction formenctype formmethod formnovalidate formtarget name type value","html4"==e?d:u),n("select","disabled form multiple name required size","option optgroup"),n("optgroup","disabled label","option"),n("option","disabled label selected value"),n("textarea","cols dirname disabled form maxlength name readonly required rows wrap"),n("menu","type label",d,"li"),n("noscript","",d),"html4"!=e&&(n("wbr"),n("ruby","",u,"rt rp"),n("figcaption","",d),n("mark rt rp summary bdi","",u),n("canvas","width height",d),n("video","src crossorigin poster preload autoplay mediagroup loop muted controls width height",d,"track source"),n("audio","src crossorigin preload autoplay mediagroup loop muted controls",d,"track source"),n("source","src type media"),n("track","kind src srclang label default"),n("datalist","",u,"option"),n("article section nav aside header footer","",d),n("hgroup","","h1 h2 h3 h4 h5 h6"),n("figure","",d,"figcaption"),n("time","datetime",u),n("dialog","open",d),n("command","type label icon disabled checked radiogroup command"),n("output","for form name",u),n("progress","value max",u),n("meter","value min max low high optimum",u),n("details","open",d,"summary"),n("keygen","autofocus challenge disabled form keytype name")),"html5-strict"!=e&&(i("script","language xml:space"),i("style","xml:space"),i("object","declare classid codebase codetype archive standby align border hspace vspace"),i("param","valuetype type"),i("a","charset name rev shape coords"),i("br","clear"),i("applet","codebase archive code object alt name width height align hspace vspace"),i("img","name longdesc align border hspace vspace"),i("iframe","longdesc frameborder marginwidth marginheight scrolling align"),i("font basefont","size color face"),i("input","usemap align"),i("select","onchange"),i("textarea"),i("h1 h2 h3 h4 h5 h6 div p legend caption","align"),i("ul","type compact"),i("li","type"),i("ol dl menu dir","compact"),i("pre","width xml:space"),i("hr","align noshade size width"),i("isindex","prompt"),i("table","summary width frame rules cellspacing cellpadding align bgcolor"),i("col","width align char charoff valign"),i("colgroup","width align char charoff valign"),i("thead","align char charoff valign"),i("tr","align char charoff valign bgcolor"),i("th","axis align char charoff valign nowrap bgcolor width height"),i("form","accept"),i("td","abbr axis scope align char charoff valign nowrap bgcolor width height"),i("tfoot","align char charoff valign"),i("tbody","align char charoff valign"),i("area","nohref"),i("body","background bgcolor text link vlink alink")),"html4"!=e&&(i("input button select textarea","autofocus"),i("input textarea","placeholder"),i("a","download"),i("link script img","crossorigin"),i("iframe","srcdoc sandbox seamless allowfullscreen")),o(t("a form meter progress dfn"),function(e){a[e]&&delete a[e].children[e]}),delete a.caption.children.table,r[e]=a,a)}var r={},i=e.makeMap,o=e.each,a=e.extend,s=e.explode,l=e.inArray;return function(e){function c(t,n,o){var s=e[t];return s?s=i(s,",",i(s.toUpperCase()," ")):(s=r[t],s||(s=i(n," ",i(n.toUpperCase()," ")),s=a(s,o),r[t]=s)),s}function u(e){return new RegExp("^"+e.replace(/([?+*])/g,".$1")+"$")}function d(e){var n,r,o,a,s,c,d,f,p,h,m,g,y,C,x,w,_,N,E,S=/^([#+\-])?([^\[!\/]+)(?:\/([^\[!]+))?(?:(!?)\[([^\]]+)\])?$/,k=/^([!\-])?(\w+::\w+|[^=:<]+)?(?:([=:<])(.*))?$/,T=/[*?+]/;if(e)for(e=t(e,","),v["@"]&&(w=v["@"].attributes,_=v["@"].attributesOrder),n=0,r=e.length;r>n;n++)if(s=S.exec(e[n])){if(C=s[1],p=s[2],x=s[3],f=s[5],g={},y=[],c={attributes:g,attributesOrder:y},"#"===C&&(c.paddEmpty=!0),"-"===C&&(c.removeEmpty=!0),"!"===s[4]&&(c.removeEmptyAttrs=!0),w){for(N in w)g[N]=w[N];y.push.apply(y,_)}if(f)for(f=t(f,"|"),o=0,a=f.length;a>o;o++)if(s=k.exec(f[o])){if(d={},m=s[1],h=s[2].replace(/::/g,":"),C=s[3],E=s[4],"!"===m&&(c.attributesRequired=c.attributesRequired||[],c.attributesRequired.push(h),d.required=!0),"-"===m){delete g[h],y.splice(l(y,h),1);continue}C&&("="===C&&(c.attributesDefault=c.attributesDefault||[],c.attributesDefault.push({name:h,value:E}),d.defaultValue=E),":"===C&&(c.attributesForced=c.attributesForced||[],c.attributesForced.push({name:h,value:E}),d.forcedValue=E),"<"===C&&(d.validValues=i(E,"?"))),T.test(h)?(c.attributePatterns=c.attributePatterns||[],d.pattern=u(h),c.attributePatterns.push(d)):(g[h]||y.push(h),g[h]=d)}w||"@"!=p||(w=g,_=y),x&&(c.outputName=p,v[x]=c),T.test(p)?(c.pattern=u(p),b.push(c)):v[p]=c}}function f(e){v={},b=[],d(e),o(x,function(e,t){y[t]=e.children})}function p(e){var n=/^(~)?(.+)$/;e&&o(t(e,","),function(e){var t=n.exec(e),r="~"===t[1],i=r?"span":"div",s=t[2];if(y[s]=y[i],R[s]=i,r||(S[s.toUpperCase()]={},S[s]={}),!v[s]){var l=v[i];l=a({},l),delete l.removeEmptyAttrs,delete l.removeEmpty,v[s]=l}o(y,function(e){e[i]&&(e[s]=e[i])})})}function h(e){var n=/^([+\-]?)(\w+)\[([^\]]+)\]$/;e&&o(t(e,","),function(e){var r=n.exec(e),i,a;r&&(a=r[1],i=a?y[r[2]]:y[r[2]]={"#comment":{}},i=y[r[2]],o(t(r[3],"|"),function(e){"-"===a?delete i[e]:i[e]={}}))})}function m(e){var t=v[e],n;if(t)return t;for(n=b.length;n--;)if(t=b[n],t.pattern.test(e))return t}var g=this,v={},y={},b=[],C,x,w,_,N,E,S,k,T,R={},A={};e=e||{},x=n(e.schema),e.verify_html===!1&&(e.valid_elements="*[*]"),e.valid_styles&&(C={},o(e.valid_styles,function(e,t){C[t]=s(e)})),w=c("whitespace_elements","pre script noscript style textarea video audio iframe object"),_=c("self_closing_elements","colgroup dd dt li option p td tfoot th thead tr"),N=c("short_ended_elements","area base basefont br col frame hr img input isindex link meta param embed source wbr track"),E=c("boolean_attributes","checked compact declare defer disabled ismap multiple nohref noresize noshade nowrap readonly selected autoplay loop controls"),k=c("non_empty_elements","td th iframe video audio object",N),T=c("text_block_elements","h1 h2 h3 h4 h5 h6 p div address pre form blockquote center dir fieldset header footer article section hgroup aside nav figure"),S=c("block_elements","hr table tbody thead tfoot th tr td li ol ul caption dl dt dd noscript menu isindex samp option datalist select optgroup",T),o((e.special||"script noscript style textarea").split(" "),function(e){A[e]=new RegExp("</"+e+"[^>]*>","gi")}),e.valid_elements?f(e.valid_elements):(o(x,function(e,t){v[t]={attributes:e.attributes,attributesOrder:e.attributesOrder},y[t]=e.children}),"html5"!=e.schema&&o(t("strong/b em/i"),function(e){e=t(e,"/"),v[e[1]].outputName=e[0]}),v.img.attributesDefault=[{name:"alt",value:""}],o(t("ol ul sub sup blockquote span font a table tbody tr strong em b i"),function(e){v[e]&&(v[e].removeEmpty=!0)}),o(t("p h1 h2 h3 h4 h5 h6 th td pre div address caption"),function(e){v[e].paddEmpty=!0}),o(t("span"),function(e){v[e].removeEmptyAttrs=!0})),p(e.custom_elements),h(e.valid_children),d(e.extended_valid_elements),h("+ol[ul|ol],+ul[ul|ol]"),e.invalid_elements&&o(s(e.invalid_elements),function(e){v[e]&&delete v[e]}),m("span")||d("span[!data-mce-type|*]"),g.children=y,g.styles=C,g.getBoolAttrs=function(){return E},g.getBlockElements=function(){return S},g.getTextBlockElements=function(){return T},g.getShortEndedElements=function(){return N},g.getSelfClosingElements=function(){return _},g.getNonEmptyElements=function(){return k},g.getWhiteSpaceElements=function(){return w},g.getSpecialElements=function(){return A},g.isValidChild=function(e,t){var n=y[e];return!(!n||!n[t])},g.isValid=function(e,t){var n,r,i=m(e);if(i){if(!t)return!0;if(i.attributes[t])return!0;if(n=i.attributePatterns)for(r=n.length;r--;)if(n[r].pattern.test(e))return!0}return!1},g.getElementRule=m,g.getCustomElements=function(){return R},g.addValidElements=d,g.setValidElements=f,g.addCustomElements=p,g.addValidChildren=h,g.elements=v}}),r(w,[x,m,p],function(e,t,n){var r=n.each;return function(n,i){var o=this,a=function(){};n=n||{},o.schema=i=i||new e,n.fix_self_closing!==!1&&(n.fix_self_closing=!0),r("comment cdata text start end pi doctype".split(" "),function(e){e&&(o[e]=n[e]||a)}),o.parse=function(e){function r(e){var t,n;for(t=d.length;t--&&d[t].name!==e;);if(t>=0){for(n=d.length-1;n>=t;n--)e=d[n],e.valid&&a.end(e.name);d.length=t}}function o(e,t,n,r,i){var o,a;if(t=t.toLowerCase(),n=t in b?t:I(n||r||i||""),x&&!g&&0!==t.indexOf("data-")){if(o=S[t],!o&&k){for(a=k.length;a--&&(o=k[a],!o.pattern.test(t)););-1===a&&(o=null)}if(!o)return;if(o.validValues&&!(n in o.validValues))return}f.map[t]=n,f.push({name:t,value:n})}var a=this,s,l=0,c,u,d=[],f,p,h,m,g,v,y,b,C,x,w,_,N,E,S,k,T,R,A,B,L,H,D,M,P,O=0,I=t.decode,F;for(H=new RegExp("<(?:(?:!--([\\w\\W]*?)-->)|(?:!\\[CDATA\\[([\\w\\W]*?)\\]\\]>)|(?:!DOCTYPE([\\w\\W]*?)>)|(?:\\?([^\\s\\/<>]+) ?([\\w\\W]*?)[?/]>)|(?:\\/([^>]+)>)|(?:([A-Za-z0-9\\-\\:\\.]+)((?:\\s+[^\"'>]+(?:(?:\"[^\"]*\")|(?:'[^']*')|[^>]*))*|\\/|\\s+)>))","g"),D=/([\w:\-]+)(?:\s*=\s*(?:(?:\"((?:[^\"])*)\")|(?:\'((?:[^\'])*)\')|([^>\s]+)))?/g,y=i.getShortEndedElements(),L=n.self_closing_elements||i.getSelfClosingElements(),b=i.getBoolAttrs(),x=n.validate,v=n.remove_internals,F=n.fix_self_closing,M=i.getSpecialElements();s=H.exec(e);){if(l<s.index&&a.text(I(e.substr(l,s.index-l))),c=s[6])c=c.toLowerCase(),":"===c.charAt(0)&&(c=c.substr(1)),r(c);else if(c=s[7]){if(c=c.toLowerCase(),":"===c.charAt(0)&&(c=c.substr(1)),C=c in y,F&&L[c]&&d.length>0&&d[d.length-1].name===c&&r(c),!x||(w=i.getElementRule(c))){if(_=!0,x&&(S=w.attributes,k=w.attributePatterns),(E=s[8])?(g=-1!==E.indexOf("data-mce-type"),g&&v&&(_=!1),f=[],f.map={},E.replace(D,o)):(f=[],f.map={}),x&&!g){if(T=w.attributesRequired,R=w.attributesDefault,A=w.attributesForced,B=w.removeEmptyAttrs,B&&!f.length&&(_=!1),A)for(p=A.length;p--;)N=A[p],m=N.name,P=N.value,"{$uid}"===P&&(P="mce_"+O++),f.map[m]=P,f.push({name:m,value:P});if(R)for(p=R.length;p--;)N=R[p],m=N.name,m in f.map||(P=N.value,"{$uid}"===P&&(P="mce_"+O++),f.map[m]=P,f.push({name:m,value:P}));if(T){for(p=T.length;p--&&!(T[p]in f.map););-1===p&&(_=!1)}f.map["data-mce-bogus"]&&(_=!1)}_&&a.start(c,f,C)}else _=!1;if(u=M[c]){u.lastIndex=l=s.index+s[0].length,(s=u.exec(e))?(_&&(h=e.substr(l,s.index-l)),l=s.index+s[0].length):(h=e.substr(l),l=e.length),_&&(h.length>0&&a.text(h,!0),a.end(c)),H.lastIndex=l;continue}C||(E&&E.indexOf("/")==E.length-1?_&&a.end(c):d.push({name:c,valid:_}))}else(c=s[1])?a.comment(c):(c=s[2])?a.cdata(c):(c=s[3])?a.doctype(c):(c=s[4])&&a.pi(c,s[5]);l=s.index+s[0].length}for(l<e.length&&a.text(I(e.substr(l))),p=d.length-1;p>=0;p--)c=d[p],c.valid&&a.end(c.name)}}}),r(_,[C,x,w,p],function(e,t,n,r){var i=r.makeMap,o=r.each,a=r.explode,s=r.extend;return function(r,l){function c(t){var n,r,o,a,s,c,d,f,p,h,m,g,v,y;for(m=i("tr,td,th,tbody,thead,tfoot,table"),h=l.getNonEmptyElements(),g=l.getTextBlockElements(),n=0;n<t.length;n++)if(r=t[n],r.parent&&!r.fixed)if(g[r.name]&&"li"==r.parent.name){for(v=r.next;v&&g[v.name];)v.name="li",v.fixed=!0,r.parent.insert(v,r.parent),v=v.next;r.unwrap(r)}else{for(a=[r],o=r.parent;o&&!l.isValidChild(o.name,r.name)&&!m[o.name];o=o.parent)a.push(o);if(o&&a.length>1){for(a.reverse(),s=c=u.filterNode(a[0].clone()),p=0;p<a.length-1;p++){for(l.isValidChild(c.name,a[p].name)?(d=u.filterNode(a[p].clone()),c.append(d)):d=c,f=a[p].firstChild;f&&f!=a[p+1];)y=f.next,d.append(f),f=y;c=d}s.isEmpty(h)?o.insert(r,a[0],!0):(o.insert(s,a[0],!0),o.insert(r,s)),o=a[0],(o.isEmpty(h)||o.firstChild===o.lastChild&&"br"===o.firstChild.name)&&o.empty().remove()}else if(r.parent){if("li"===r.name){if(v=r.prev,v&&("ul"===v.name||"ul"===v.name)){v.append(r);continue}if(v=r.next,v&&("ul"===v.name||"ul"===v.name)){v.insert(r,v.firstChild,!0);continue}r.wrap(u.filterNode(new e("ul",1)));continue}l.isValidChild(r.parent.name,"div")&&l.isValidChild("div",r.name)?r.wrap(u.filterNode(new e("div",1))):"style"===r.name||"script"===r.name?r.empty().remove():r.unwrap()}}}var u=this,d={},f=[],p={},h={};r=r||{},r.validate="validate"in r?r.validate:!0,r.root_name=r.root_name||"body",u.schema=l=l||new t,u.filterNode=function(e){var t,n,r;n in d&&(r=p[n],r?r.push(e):p[n]=[e]),t=f.length;for(;t--;)n=f[t].name,n in e.attributes.map&&(r=h[n],r?r.push(e):h[n]=[e]);return e},u.addNodeFilter=function(e,t){o(a(e),function(e){var n=d[e];n||(d[e]=n=[]),n.push(t)})},u.addAttributeFilter=function(e,t){o(a(e),function(e){var n;for(n=0;n<f.length;n++)if(f[n].name===e)return f[n].callbacks.push(t),void 0;f.push({name:e,callbacks:[t]})})},u.parse=function(t,o){function a(){function e(e){e&&(t=e.firstChild,t&&3==t.type&&(t.value=t.value.replace(R,"")),t=e.lastChild,t&&3==t.type&&(t.value=t.value.replace(L,"")))}var t=y.firstChild,n,r;if(l.isValidChild(y.name,I.toLowerCase())){for(;t;)n=t.next,3==t.type||1==t.type&&"p"!==t.name&&!T[t.name]&&!t.attr("data-mce-type")?r?r.append(t):(r=u(I,1),y.insert(r,t),r.append(t)):(e(r),r=null),t=n;e(r)}}function u(t,n){var r=new e(t,n),i;return t in d&&(i=p[t],i?i.push(r):p[t]=[r]),r}function m(e){var t,n,r;for(t=e.prev;t&&3===t.type;)n=t.value.replace(L,""),n.length>0?(t.value=n,t=t.prev):(r=t.prev,t.remove(),t=r)}function g(e){var t,n={};for(t in e)"li"!==t&&"p"!=t&&(n[t]=e[t]);return n}var v,y,b,C,x,w,_,N,E,S,k,T,R,A=[],B,L,H,D,M,P,O,I;if(o=o||{},p={},h={},T=s(i("script,style,head,html,body,title,meta,param"),l.getBlockElements()),O=l.getNonEmptyElements(),P=l.children,k=r.validate,I="forced_root_block"in o?o.forced_root_block:r.forced_root_block,M=l.getWhiteSpaceElements(),R=/^[ \t\r\n]+/,L=/[ \t\r\n]+$/,H=/[ \t\r\n]+/g,D=/^[ \t\r\n]+$/,v=new n({validate:k,self_closing_elements:g(l.getSelfClosingElements()),cdata:function(e){b.append(u("#cdata",4)).value=e},text:function(e,t){var n;B||(e=e.replace(H," "),b.lastChild&&T[b.lastChild.name]&&(e=e.replace(R,""))),0!==e.length&&(n=u("#text",3),n.raw=!!t,b.append(n).value=e)},comment:function(e){b.append(u("#comment",8)).value=e},pi:function(e,t){b.append(u(e,7)).value=t,m(b)},doctype:function(e){var t;t=b.append(u("#doctype",10)),t.value=e,m(b)},start:function(e,t,n){var r,i,o,a,s;if(o=k?l.getElementRule(e):{}){for(r=u(o.outputName||e,1),r.attributes=t,r.shortEnded=n,b.append(r),s=P[b.name],s&&P[r.name]&&!s[r.name]&&A.push(r),i=f.length;i--;)a=f[i].name,a in t.map&&(E=h[a],E?E.push(r):h[a]=[r]);T[e]&&m(r),n||(b=r),!B&&M[e]&&(B=!0)}},end:function(t){var n,r,i,o,a;if(r=k?l.getElementRule(t):{}){if(T[t]&&!B){if(n=b.firstChild,n&&3===n.type)if(i=n.value.replace(R,""),i.length>0)n.value=i,n=n.next;else for(o=n.next,n.remove(),n=o;n&&3===n.type;)i=n.value,o=n.next,(0===i.length||D.test(i))&&(n.remove(),n=o),n=o;if(n=b.lastChild,n&&3===n.type)if(i=n.value.replace(L,""),i.length>0)n.value=i,n=n.prev;else for(o=n.prev,n.remove(),n=o;n&&3===n.type;)i=n.value,o=n.prev,(0===i.length||D.test(i))&&(n.remove(),n=o),n=o}if(B&&M[t]&&(B=!1),(r.removeEmpty||r.paddEmpty)&&b.isEmpty(O))if(r.paddEmpty)b.empty().append(new e("#text","3")).value="\xa0";else if(!b.attributes.map.name&&!b.attributes.map.id)return a=b.parent,b.empty().remove(),b=a,void 0;b=b.parent}}},l),y=b=new e(o.context||r.root_name,11),v.parse(t),k&&A.length&&(o.context?o.invalid=!0:c(A)),I&&("body"==y.name||o.isRootContent)&&a(),!o.invalid){for(S in p){for(E=d[S],C=p[S],_=C.length;_--;)C[_].parent||C.splice(_,1);for(x=0,w=E.length;w>x;x++)E[x](C,S,o)}for(x=0,w=f.length;w>x;x++)if(E=f[x],E.name in h){for(C=h[E.name],_=C.length;_--;)C[_].parent||C.splice(_,1);for(_=0,N=E.callbacks.length;N>_;_++)E.callbacks[_](C,E.name,o)}}return y},r.remove_trailing_brs&&u.addNodeFilter("br",function(t){var n,r=t.length,i,o=s({},l.getBlockElements()),a=l.getNonEmptyElements(),c,u,d,f,p,h;for(o.body=1,n=0;r>n;n++)if(i=t[n],c=i.parent,o[i.parent.name]&&i===c.lastChild){for(d=i.prev;d;){if(f=d.name,"span"!==f||"bookmark"!==d.attr("data-mce-type")){if("br"!==f)break;if("br"===f){i=null;break}}d=d.prev}i&&(i.remove(),c.isEmpty(a)&&(p=l.getElementRule(c.name),p&&(p.removeEmpty?c.remove():p.paddEmpty&&(c.empty().append(new e("#text",3)).value="\xa0"))))}else{for(u=i;c&&c.firstChild===u&&c.lastChild===u&&(u=c,!o[c.name]);)c=c.parent;u===c&&(h=new e("#text",3),h.value="\xa0",i.replace(h))}}),r.allow_html_in_named_anchor||u.addAttributeFilter("id,name",function(e){for(var t=e.length,n,r,i,o;t--;)if(o=e[t],"a"===o.name&&o.firstChild&&!o.attr("href")){i=o.parent,n=o.lastChild;do r=n.prev,i.insert(n,o),n=r;while(n)}})}}),r(N,[m,p],function(e,t){var n=t.makeMap;return function(t){var r=[],i,o,a,s,l;return t=t||{},i=t.indent,o=n(t.indent_before||""),a=n(t.indent_after||""),s=e.getEncodeFunc(t.entity_encoding||"raw",t.entities),l="html"==t.element_format,{start:function(e,t,n){var c,u,d,f;if(i&&o[e]&&r.length>0&&(f=r[r.length-1],f.length>0&&"\n"!==f&&r.push("\n")),r.push("<",e),t)for(c=0,u=t.length;u>c;c++)d=t[c],r.push(" ",d.name,'="',s(d.value,!0),'"');r[r.length]=!n||l?">":" />",n&&i&&a[e]&&r.length>0&&(f=r[r.length-1],f.length>0&&"\n"!==f&&r.push("\n"))},end:function(e){var t;r.push("</",e,">"),i&&a[e]&&r.length>0&&(t=r[r.length-1],t.length>0&&"\n"!==t&&r.push("\n"))},text:function(e,t){e.length>0&&(r[r.length]=t?e:s(e))},cdata:function(e){r.push("<![CDATA[",e,"]]>")},comment:function(e){r.push("<!--",e,"-->")},pi:function(e,t){t?r.push("<?",e," ",t,"?>"):r.push("<?",e,"?>"),i&&r.push("\n")},doctype:function(e){r.push("<!DOCTYPE",e,">",i?"\n":"")},reset:function(){r.length=0},getContent:function(){return r.join("").replace(/\n$/,"")}}}}),r(E,[N,x],function(e,t){return function(n,r){var i=this,o=new e(n);n=n||{},n.validate="validate"in n?n.validate:!0,i.schema=r=r||new t,i.writer=o,i.serialize=function(e){function t(e){var n=i[e.type],s,l,c,u,d,f,p,h,m;if(n)n(e);else{if(s=e.name,l=e.shortEnded,c=e.attributes,a&&c&&c.length>1){for(f=[],f.map={},m=r.getElementRule(e.name),p=0,h=m.attributesOrder.length;h>p;p++)u=m.attributesOrder[p],u in c.map&&(d=c.map[u],f.map[u]=d,f.push({name:u,value:d}));for(p=0,h=c.length;h>p;p++)u=c[p].name,u in f.map||(d=c.map[u],f.map[u]=d,f.push({name:u,value:d}));c=f}if(o.start(e.name,c,l),!l){if(e=e.firstChild)do t(e);while(e=e.next);o.end(s)}}}var i,a;return a=n.validate,i={3:function(e){o.text(e.value,e.raw)},8:function(e){o.comment(e.value)},7:function(e){o.pi(e.name,e.value)},10:function(e){o.doctype(e.value)},4:function(e){o.cdata(e.value)},11:function(e){if(e=e.firstChild)do t(e);while(e=e.next)}},o.reset(),1!=e.type||n.inner?i[11](e):t(e),o.getContent()}}}),r(S,[v,_,m,E,C,x,g,p],function(e,t,n,r,i,o,a,s){var l=s.each,c=s.trim,u=e.DOM;return function(e,i){var s,d,f;return i&&(s=i.dom,d=i.schema),s=s||u,d=d||new o(e),e.entity_encoding=e.entity_encoding||"named",e.remove_trailing_brs="remove_trailing_brs"in e?e.remove_trailing_brs:!0,f=new t(e,d),f.addAttributeFilter("src,href,style",function(t,n){for(var r=t.length,i,o,a="data-mce-"+n,l=e.url_converter,c=e.url_converter_scope,u;r--;)i=t[r],o=i.attributes.map[a],o!==u?(i.attr(n,o.length>0?o:null),i.attr(a,null)):(o=i.attributes.map[n],"style"===n?o=s.serializeStyle(s.parseStyle(o),i.name):l&&(o=l.call(c,o,n,i.name)),i.attr(n,o.length>0?o:null))}),f.addAttributeFilter("class",function(e){for(var t=e.length,n,r;t--;)n=e[t],r=n.attr("class").replace(/(?:^|\s)mce-item-\w+(?!\S)/g,""),n.attr("class",r.length>0?r:null)}),f.addAttributeFilter("data-mce-type",function(e,t,n){for(var r=e.length,i;r--;)i=e[r],"bookmark"!==i.attributes.map["data-mce-type"]||n.cleanup||i.remove()}),f.addAttributeFilter("data-mce-expando",function(e,t){for(var n=e.length;n--;)e[n].attr(t,null)}),f.addNodeFilter("noscript",function(e){for(var t=e.length,r;t--;)r=e[t].firstChild,r&&(r.value=n.decode(r.value))}),f.addNodeFilter("script,style",function(e,t){function n(e){return e.replace(/(<!--\[CDATA\[|\]\]-->)/g,"\n").replace(/^[\r\n]*|[\r\n]*$/g,"").replace(/^\s*((<!--)?(\s*\/\/)?\s*<!\[CDATA\[|(<!--\s*)?\/\*\s*<!\[CDATA\[\s*\*\/|(\/\/)?\s*<!--|\/\*\s*<!--\s*\*\/)\s*[\r\n]*/gi,"").replace(/\s*(\/\*\s*\]\]>\s*\*\/(-->)?|\s*\/\/\s*\]\]>(-->)?|\/\/\s*(-->)?|\]\]>|\/\*\s*-->\s*\*\/|\s*-->\s*)\s*$/g,"")}for(var r=e.length,i,o;r--;)if(i=e[r],o=i.firstChild?i.firstChild.value:"","script"===t){var a=(i.attr("type")||"text/javascript").replace(/^mce\-/,"");i.attr("type","text/javascript"===a?null:a),o.length>0&&(i.firstChild.value="// <![CDATA[\n"+n(o)+"\n// ]]>")}else o.length>0&&(i.firstChild.value="<!--\n"+n(o)+"\n-->")}),f.addNodeFilter("#comment",function(e){for(var t=e.length,n;t--;)n=e[t],0===n.value.indexOf("[CDATA[")?(n.name="#cdata",n.type=4,n.value=n.value.replace(/^\[CDATA\[|\]\]$/g,"")):0===n.value.indexOf("mce:protected ")&&(n.name="#text",n.type=3,n.raw=!0,n.value=unescape(n.value).substr(14))}),f.addNodeFilter("xml:namespace,input",function(e,t){for(var n=e.length,r;n--;)r=e[n],7===r.type?r.remove():1===r.type&&("input"!==t||"type"in r.attributes.map||r.attr("type","text"))}),e.fix_list_elements&&f.addNodeFilter("ul,ol",function(e){for(var t=e.length,n,r;t--;)n=e[t],r=n.parent,("ul"===r.name||"ol"===r.name)&&n.prev&&"li"===n.prev.name&&n.prev.append(n)}),f.addAttributeFilter("data-mce-src,data-mce-href,data-mce-style,data-mce-selected",function(e,t){for(var n=e.length;n--;)e[n].attr(t,null)}),{schema:d,addNodeFilter:f.addNodeFilter,addAttributeFilter:f.addAttributeFilter,serialize:function(t,n){var i=this,o,u,p,h,m;return a.ie&&s.select("script,style,select,map").length>0?(m=t.innerHTML,t=t.cloneNode(!1),s.setHTML(t,m)):t=t.cloneNode(!0),o=t.ownerDocument.implementation,o.createHTMLDocument&&(u=o.createHTMLDocument(""),l("BODY"==t.nodeName?t.childNodes:[t],function(e){u.body.appendChild(u.importNode(e,!0))}),t="BODY"!=t.nodeName?u.body.firstChild:u.body,p=s.doc,s.doc=u),n=n||{},n.format=n.format||"html",n.selection&&(n.forced_root_block=""),n.no_events||(n.node=t,i.onPreProcess(n)),h=new r(e,d),n.content=h.serialize(f.parse(c(n.getInner?t.innerHTML:s.getOuterHTML(t)),n)),n.cleanup||(n.content=n.content.replace(/\uFEFF/g,"")),n.no_events||i.onPostProcess(n),p&&(s.doc=p),n.node=null,n.content},addRules:function(e){d.addValidElements(e)},setRules:function(e){d.setValidElements(e)},onPreProcess:function(e){i&&i.fire("PreProcess",e)},onPostProcess:function(e){i&&i.fire("PostProcess",e)}}}}),r(k,[],function(){function e(e){function t(t,n){var r,i=0,o,a,s,l,c,u,d=-1,f;if(r=t.duplicate(),r.collapse(n),f=r.parentElement(),f.ownerDocument===e.dom.doc){for(;"false"===f.contentEditable;)f=f.parentNode;if(!f.hasChildNodes())return{node:f,inside:1};for(s=f.children,o=s.length-1;o>=i;)if(u=Math.floor((i+o)/2),l=s[u],r.moveToElementText(l),d=r.compareEndPoints(n?"StartToStart":"EndToEnd",t),d>0)o=u-1;else{if(!(0>d))return{node:l};i=u+1}if(0>d)for(l?r.collapse(!1):(r.moveToElementText(f),r.collapse(!0),l=f,a=!0),c=0;0!==r.compareEndPoints(n?"StartToStart":"StartToEnd",t)&&0!==r.move("character",1)&&f==r.parentElement();)c++;else for(r.collapse(!0),c=0;0!==r.compareEndPoints(n?"StartToStart":"StartToEnd",t)&&0!==r.move("character",-1)&&f==r.parentElement();)c++;return{node:l,position:d,offset:c,inside:a}}}function n(){function n(e){var n=t(o,e),r,i,s=0,l,c,u;if(r=n.node,i=n.offset,n.inside&&!r.hasChildNodes())return a[e?"setStart":"setEnd"](r,0),void 0;if(i===c)return a[e?"setStartBefore":"setEndAfter"](r),void 0;if(n.position<0){if(l=n.inside?r.firstChild:r.nextSibling,!l)return a[e?"setStartAfter":"setEndAfter"](r),void 0;if(!i)return 3==l.nodeType?a[e?"setStart":"setEnd"](l,0):a[e?"setStartBefore":"setEndBefore"](l),void 0;for(;l;){if(u=l.nodeValue,s+=u.length,s>=i){r=l,s-=i,s=u.length-s;break}l=l.nextSibling}}else{if(l=r.previousSibling,!l)return a[e?"setStartBefore":"setEndBefore"](r);if(!i)return 3==r.nodeType?a[e?"setStart":"setEnd"](l,r.nodeValue.length):a[e?"setStartAfter":"setEndAfter"](l),void 0;for(;l;){if(s+=l.nodeValue.length,s>=i){r=l,s-=i;break}l=l.previousSibling}}a[e?"setStart":"setEnd"](r,s)}var o=e.getRng(),a=i.createRng(),s,l,c,u,d;if(s=o.item?o.item(0):o.parentElement(),s.ownerDocument!=i.doc)return a;if(l=e.isCollapsed(),o.item)return a.setStart(s.parentNode,i.nodeIndex(s)),a.setEnd(a.startContainer,a.startOffset+1),a;try{n(!0),l||n()}catch(f){if(-2147024809!=f.number)throw f;d=r.getBookmark(2),c=o.duplicate(),c.collapse(!0),s=c.parentElement(),l||(c=o.duplicate(),c.collapse(!1),u=c.parentElement(),u.innerHTML=u.innerHTML),s.innerHTML=s.innerHTML,r.moveToBookmark(d),o=e.getRng(),n(!0),l||n()}return a}var r=this,i=e.dom,o=!1;this.getBookmark=function(n){function r(e){var t,n,r,o,a=[];for(t=e.parentNode,n=i.getRoot().parentNode;t!=n&&9!==t.nodeType;){for(r=t.children,o=r.length;o--;)if(e===r[o]){a.push(o);break}e=t,t=t.parentNode}return a}function o(e){var n;return n=t(a,e),n?{position:n.position,offset:n.offset,indexes:r(n.node),inside:n.inside}:void 0}var a=e.getRng(),s={};return 2===n&&(a.item?s.start={ctrl:!0,indexes:r(a.item(0))}:(s.start=o(!0),e.isCollapsed()||(s.end=o()))),s},this.moveToBookmark=function(e){function t(e){var t,n,r,o;for(t=i.getRoot(),n=e.length-1;n>=0;n--)o=t.children,r=e[n],r<=o.length-1&&(t=o[r]);return t}function n(n){var i=e[n?"start":"end"],a,s,l,c;i&&(a=i.position>0,s=o.createTextRange(),s.moveToElementText(t(i.indexes)),c=i.offset,c!==l?(s.collapse(i.inside||a),s.moveStart("character",a?-c:c)):s.collapse(n),r.setEndPoint(n?"StartToStart":"EndToStart",s),n&&r.collapse(!0))
}var r,o=i.doc.body;e.start&&(e.start.ctrl?(r=o.createControlRange(),r.addElement(t(e.start.indexes)),r.select()):(r=o.createTextRange(),n(!0),n(),r.select()))},this.addRange=function(t){function n(e){var t,n,a,d,h;a=i.create("a"),t=e?s:c,n=e?l:u,d=r.duplicate(),(t==f||t==f.documentElement)&&(t=p,n=0),3==t.nodeType?(t.parentNode.insertBefore(a,t),d.moveToElementText(a),d.moveStart("character",n),i.remove(a),r.setEndPoint(e?"StartToStart":"EndToEnd",d)):(h=t.childNodes,h.length?(n>=h.length?i.insertAfter(a,h[h.length-1]):t.insertBefore(a,h[n]),d.moveToElementText(a)):t.canHaveHTML&&(t.innerHTML="<span>&#xFEFF;</span>",a=t.firstChild,d.moveToElementText(a),d.collapse(o)),r.setEndPoint(e?"StartToStart":"EndToEnd",d),i.remove(a))}var r,a,s,l,c,u,d,f=e.dom.doc,p=f.body,h,m;if(s=t.startContainer,l=t.startOffset,c=t.endContainer,u=t.endOffset,r=p.createTextRange(),s==c&&1==s.nodeType){if(l==u&&!s.hasChildNodes()){if(s.canHaveHTML)return d=s.previousSibling,d&&!d.hasChildNodes()&&i.isBlock(d)?d.innerHTML="&#xFEFF;":d=null,s.innerHTML="<span>&#xFEFF;</span><span>&#xFEFF;</span>",r.moveToElementText(s.lastChild),r.select(),i.doc.selection.clear(),s.innerHTML="",d&&(d.innerHTML=""),void 0;l=i.nodeIndex(s),s=s.parentNode}if(l==u-1)try{if(m=s.childNodes[l],a=p.createControlRange(),a.addElement(m),a.select(),h=e.getRng(),h.item&&m===h.item(0))return}catch(g){}}n(!0),n(),r.select()},this.getRangeAt=n}return e}),r(T,[g],function(e){return{BACKSPACE:8,DELETE:46,DOWN:40,ENTER:13,LEFT:37,RIGHT:39,SPACEBAR:32,TAB:9,UP:38,modifierPressed:function(e){return e.shiftKey||e.ctrlKey||e.altKey},metaKeyPressed:function(t){return(e.mac?t.ctrlKey||t.metaKey:t.ctrlKey)&&!t.altKey}}}),r(R,[T,p,g],function(e,t,n){return function(r,i){function o(e){return i.settings.object_resizing===!1?!1:/TABLE|IMG|DIV/.test(e.nodeName)?"false"===e.getAttribute("data-mce-resize")?!1:!0:!1}function a(t){var n,r;n=t.screenX-S,r=t.screenY-k,D=n*N[2]+A,M=r*N[3]+B,D=5>D?5:D,M=5>M?5:M,(e.modifierPressed(t)||"IMG"==x.nodeName&&0!==N[2]*N[3])&&(D=Math.round(M/L),M=Math.round(D*L)),b.setStyles(w,{width:D,height:M}),N[2]<0&&w.clientWidth<=D&&b.setStyle(w,"left",T+(A-D)),N[3]<0&&w.clientHeight<=M&&b.setStyle(w,"top",R+(B-M)),H||(i.fire("ObjectResizeStart",{target:x,width:A,height:B}),H=!0)}function s(){function e(e,t){t&&(x.style[e]||!i.schema.isValid(x.nodeName.toLowerCase(),e)?b.setStyle(x,e,t):b.setAttrib(x,e,t))}H=!1,e("width",D),e("height",M),b.unbind(P,"mousemove",a),b.unbind(P,"mouseup",s),O!=P&&(b.unbind(O,"mousemove",a),b.unbind(O,"mouseup",s)),b.remove(w),I&&"TABLE"!=x.nodeName||l(x),i.fire("ObjectResized",{target:x,width:D,height:M}),i.nodeChanged()}function l(e,t,n){var r,l,u,d,f,p=i.getBody().offsetParent||i.getBody();r=b.getPos(e,p),T=r.x,R=r.y,f=e.getBoundingClientRect(),l=f.width||f.right-f.left,u=f.height||f.bottom-f.top,x!=e&&(m(),x=e,D=M=0),d=i.fire("ObjectSelected",{target:e}),o(e)&&!d.isDefaultPrevented()?C(_,function(e,r){function o(t){H=!0,S=t.screenX,k=t.screenY,A=x.clientWidth,B=x.clientHeight,L=B/A,N=e,w=x.cloneNode(!0),b.addClass(w,"mce-clonedresizable"),w.contentEditable=!1,w.unSelectabe=!0,b.setStyles(w,{left:T,top:R,margin:0}),w.removeAttribute("data-mce-selected"),i.getBody().appendChild(w),b.bind(P,"mousemove",a),b.bind(P,"mouseup",s),O!=P&&(b.bind(O,"mousemove",a),b.bind(O,"mouseup",s))}var c,d;return t?(r==t&&o(n),void 0):(c=b.get("mceResizeHandle"+r),c?b.show(c):(d=i.getBody(),c=b.add(d,"div",{id:"mceResizeHandle"+r,"data-mce-bogus":!0,"class":"mce-resizehandle",contentEditable:!1,unSelectabe:!0,style:"cursor:"+r+"-resize; margin:0; padding:0"}),b.bind(c,"mousedown",function(e){e.preventDefault(),o(e)})),b.setStyles(c,{left:l*e[0]+T-c.offsetWidth/2,top:u*e[1]+R-c.offsetHeight/2}),void 0)}):c(),x.setAttribute("data-mce-selected","1")}function c(){var e,t;x&&x.removeAttribute("data-mce-selected");for(e in _)t=b.get("mceResizeHandle"+e),t&&(b.unbind(t),b.remove(t))}function u(e){function t(e,t){do if(e===t)return!0;while(e=e.parentNode)}var n;return C(b.select("img[data-mce-selected],hr[data-mce-selected]"),function(e){e.removeAttribute("data-mce-selected")}),n="mousedown"==e.type?e.target:r.getNode(),n=b.getParent(n,I?"table":"table,img,hr"),n&&(g(),t(r.getStart(),n)&&t(r.getEnd(),n)&&(!I||n!=r.getStart()&&"IMG"!==r.getStart().nodeName))?(l(n),void 0):(c(),void 0)}function d(e,t,n){e&&e.attachEvent&&e.attachEvent("on"+t,n)}function f(e,t,n){e&&e.detachEvent&&e.detachEvent("on"+t,n)}function p(e){var t=e.srcElement,n,r,o,a,s,c,u;n=t.getBoundingClientRect(),c=E.clientX-n.left,u=E.clientY-n.top;for(r in _)if(o=_[r],a=t.offsetWidth*o[0],s=t.offsetHeight*o[1],Math.abs(a-c)<8&&Math.abs(s-u)<8){N=o;break}H=!0,i.getDoc().selection.empty(),l(t,r,E)}function h(e){var t=e.srcElement;if(t!=x){if(m(),0===t.id.indexOf("mceResizeHandle"))return e.returnValue=!1,void 0;("IMG"==t.nodeName||"TABLE"==t.nodeName)&&(c(),x=t,d(t,"resizestart",p))}}function m(){f(x,"resizestart",p)}function g(){try{i.getDoc().execCommand("enableObjectResizing",!1,!1)}catch(e){}}function v(e){var t;if(I){t=P.body.createControlRange();try{return t.addElement(e),t.select(),!0}catch(n){}}}function y(){x=w=null,I&&(m(),f(i.getBody(),"controlselect",h))}var b=i.dom,C=t.each,x,w,_,N,E,S,k,T,R,A,B,L,H,D,M,P=i.getDoc(),O=document,I=n.ie&&n.ie<11;_={n:[.5,0,0,-1],e:[1,.5,1,0],s:[.5,1,0,1],w:[0,.5,-1,0],nw:[0,0,-1,-1],ne:[1,0,1,-1],se:[1,1,1,1],sw:[0,1,-1,1]};var F=".mce-content-body";return i.contentStyles.push(F+" div.mce-resizehandle {"+"position: absolute;"+"border: 1px solid black;"+"background: #FFF;"+"width: 5px;"+"height: 5px;"+"z-index: 10000"+"}"+F+" .mce-resizehandle:hover {"+"background: #000"+"}"+F+" img[data-mce-selected], hr[data-mce-selected] {"+"outline: 1px solid black;"+"resize: none"+"}"+F+" .mce-clonedresizable {"+"position: absolute;"+(n.gecko?"":"outline: 1px dashed black;")+"opacity: .5;"+"filter: alpha(opacity=50);"+"z-index: 10000"+"}"),i.on("init",function(){I?(i.on("ObjectResized",function(e){"TABLE"!=e.target.nodeName&&(c(),v(e.target))}),d(i.getBody(),"controlselect",h),i.on("mousedown",function(e){E=e})):(g(),n.ie>=11&&i.on("mouseup mousedown",function(e){("IMG"==e.target.nodeName||"IMG"==i.selection.getNode().nodeName)&&(e.preventDefault(),i.selection.select(e.target))})),i.on("nodechange mousedown ResizeEditor",u),i.on("keydown keyup",function(e){x&&"TABLE"==x.nodeName&&u(e)})}),{controlSelect:v,destroy:y}}}),r(A,[f,k,R,g,p],function(e,n,r,i,o){function a(e,t,i,o){var a=this;a.dom=e,a.win=t,a.serializer=i,a.editor=o,a.controlSelection=new r(a,o),a.win.getSelection||(a.tridentSel=new n(a))}var s=o.each,l=o.grep,c=o.trim,u=i.ie,d=i.opera;return a.prototype={setCursorLocation:function(e,t){var n=this,r=n.dom.createRng();r.setStart(e,t),r.setEnd(e,t),n.setRng(r),n.collapse(!1)},getContent:function(e){var n=this,r=n.getRng(),i=n.dom.create("body"),o=n.getSel(),a,s,l;return e=e||{},a=s="",e.get=!0,e.format=e.format||"html",e.selection=!0,n.editor.fire("BeforeGetContent",e),"text"==e.format?n.isCollapsed()?"":r.text||(o.toString?o.toString():""):(r.cloneContents?(l=r.cloneContents(),l&&i.appendChild(l)):r.item!==t||r.htmlText!==t?(i.innerHTML="<br>"+(r.item?r.item(0).outerHTML:r.htmlText),i.removeChild(i.firstChild)):i.innerHTML=r.toString(),/^\s/.test(i.innerHTML)&&(a=" "),/\s+$/.test(i.innerHTML)&&(s=" "),e.getInner=!0,e.content=n.isCollapsed()?"":a+n.serializer.serialize(i,e)+s,n.editor.fire("GetContent",e),e.content)},setContent:function(e,t){var n=this,r=n.getRng(),i,o=n.win.document,a,s;if(t=t||{format:"html"},t.set=!0,t.selection=!0,e=t.content=e,t.no_events||n.editor.fire("BeforeSetContent",t),e=t.content,r.insertNode){e+='<span id="__caret">_</span>',r.startContainer==o&&r.endContainer==o?o.body.innerHTML=e:(r.deleteContents(),0===o.body.childNodes.length?o.body.innerHTML=e:r.createContextualFragment?r.insertNode(r.createContextualFragment(e)):(a=o.createDocumentFragment(),s=o.createElement("div"),a.appendChild(s),s.outerHTML=e,r.insertNode(a))),i=n.dom.get("__caret"),r=o.createRange(),r.setStartBefore(i),r.setEndBefore(i),n.setRng(r),n.dom.remove("__caret");try{n.setRng(r)}catch(l){}}else r.item&&(o.execCommand("Delete",!1,null),r=n.getRng()),/^\s+/.test(e)?(r.pasteHTML('<span id="__mce_tmp">_</span>'+e),n.dom.remove("__mce_tmp")):r.pasteHTML(e);t.no_events||n.editor.fire("SetContent",t)},getStart:function(){var e=this,t=e.getRng(),n,r,i,o;if(t.duplicate||t.item){if(t.item)return t.item(0);for(i=t.duplicate(),i.collapse(1),n=i.parentElement(),n.ownerDocument!==e.dom.doc&&(n=e.dom.getRoot()),r=o=t.parentElement();o=o.parentNode;)if(o==n){n=r;break}return n}return n=t.startContainer,1==n.nodeType&&n.hasChildNodes()&&(n=n.childNodes[Math.min(n.childNodes.length-1,t.startOffset)]),n&&3==n.nodeType?n.parentNode:n},getEnd:function(){var e=this,t=e.getRng(),n,r;return t.duplicate||t.item?t.item?t.item(0):(t=t.duplicate(),t.collapse(0),n=t.parentElement(),n.ownerDocument!==e.dom.doc&&(n=e.dom.getRoot()),n&&"BODY"==n.nodeName?n.lastChild||n:n):(n=t.endContainer,r=t.endOffset,1==n.nodeType&&n.hasChildNodes()&&(n=n.childNodes[r>0?r-1:r]),n&&3==n.nodeType?n.parentNode:n)},getBookmark:function(e,t){function n(e,t){var n=0;return s(a.select(e),function(e,r){e==t&&(n=r)}),n}function r(e){function t(t){var n,r,i,o=t?"start":"end";n=e[o+"Container"],r=e[o+"Offset"],1==n.nodeType&&"TR"==n.nodeName&&(i=n.childNodes,n=i[Math.min(t?r:r-1,i.length-1)],n&&(r=t?0:n.childNodes.length,e["set"+(t?"Start":"End")](n,r)))}return t(!0),t(),e}function i(){function e(e,n){var i=e[n?"startContainer":"endContainer"],a=e[n?"startOffset":"endOffset"],s=[],l,c,u=0;if(3==i.nodeType){if(t)for(l=i.previousSibling;l&&3==l.nodeType;l=l.previousSibling)a+=l.nodeValue.length;s.push(a)}else c=i.childNodes,a>=c.length&&c.length&&(u=1,a=Math.max(0,c.length-1)),s.push(o.dom.nodeIndex(c[a],t)+u);for(;i&&i!=r;i=i.parentNode)s.push(o.dom.nodeIndex(i,t));return s}var n=o.getRng(!0),r=a.getRoot(),i={};return i.start=e(n,!0),o.isCollapsed()||(i.end=e(n)),i}var o=this,a=o.dom,l,c,u,d,f,p,h="&#xFEFF;",m;if(2==e)return p=o.getNode(),f=p.nodeName,"IMG"==f?{name:f,index:n(f,p)}:o.tridentSel?o.tridentSel.getBookmark(e):i();if(e)return{rng:o.getRng()};if(l=o.getRng(),u=a.uniqueId(),d=o.isCollapsed(),m="overflow:hidden;line-height:0px",l.duplicate||l.item){if(l.item)return p=l.item(0),f=p.nodeName,{name:f,index:n(f,p)};c=l.duplicate();try{l.collapse(),l.pasteHTML('<span data-mce-type="bookmark" id="'+u+'_start" style="'+m+'">'+h+"</span>"),d||(c.collapse(!1),l.moveToElementText(c.parentElement()),0===l.compareEndPoints("StartToEnd",c)&&c.move("character",-1),c.pasteHTML('<span data-mce-type="bookmark" id="'+u+'_end" style="'+m+'">'+h+"</span>"))}catch(g){return null}}else{if(p=o.getNode(),f=p.nodeName,"IMG"==f)return{name:f,index:n(f,p)};c=r(l.cloneRange()),d||(c.collapse(!1),c.insertNode(a.create("span",{"data-mce-type":"bookmark",id:u+"_end",style:m},h))),l=r(l),l.collapse(!0),l.insertNode(a.create("span",{"data-mce-type":"bookmark",id:u+"_start",style:m},h))}return o.moveToBookmark({id:u,keep:1}),{id:u}},moveToBookmark:function(e){function t(t){var n=e[t?"start":"end"],r,i,o,s;if(n){for(o=n[0],i=c,r=n.length-1;r>=1;r--){if(s=i.childNodes,n[r]>s.length-1)return;i=s[n[r]]}3===i.nodeType&&(o=Math.min(n[0],i.nodeValue.length)),1===i.nodeType&&(o=Math.min(n[0],i.childNodes.length)),t?a.setStart(i,o):a.setEnd(i,o)}return!0}function n(t){var n=o.get(e.id+"_"+t),r,i,a,c,u=e.keep;if(n&&(r=n.parentNode,"start"==t?(u?(r=n.firstChild,i=1):i=o.nodeIndex(n),f=p=r,h=m=i):(u?(r=n.firstChild,i=1):i=o.nodeIndex(n),p=r,m=i),!u)){for(c=n.previousSibling,a=n.nextSibling,s(l(n.childNodes),function(e){3==e.nodeType&&(e.nodeValue=e.nodeValue.replace(/\uFEFF/g,""))});n=o.get(e.id+"_"+t);)o.remove(n,1);c&&a&&c.nodeType==a.nodeType&&3==c.nodeType&&!d&&(i=c.nodeValue.length,c.appendData(a.nodeValue),o.remove(a),"start"==t?(f=p=c,h=m=i):(p=c,m=i))}}function r(e){return!o.isBlock(e)||e.innerHTML||u||(e.innerHTML='<br data-mce-bogus="1" />'),e}var i=this,o=i.dom,a,c,f,p,h,m;if(e)if(e.start){if(a=o.createRng(),c=o.getRoot(),i.tridentSel)return i.tridentSel.moveToBookmark(e);t(!0)&&t()&&i.setRng(a)}else e.id?(n("start"),n("end"),f&&(a=o.createRng(),a.setStart(r(f),h),a.setEnd(r(p),m),i.setRng(a))):e.name?i.select(o.select(e.name)[e.index]):e.rng&&i.setRng(e.rng)},select:function(t,n){function r(t,n){var r=t,i=new e(t,r);do{if(3==t.nodeType&&0!==c(t.nodeValue).length)return n?a.setStart(t,0):a.setEnd(t,t.nodeValue.length),void 0;if(l[t.nodeName])return n?a.setStartBefore(t):"BR"==t.nodeName?a.setEndBefore(t):a.setEndAfter(t),void 0}while(t=n?i.next():i.prev());"BODY"==r.nodeName&&(n?a.setStart(r,0):a.setEnd(r,r.childNodes.length))}var i=this,o=i.dom,a=o.createRng(),s,l;if(i.lastFocusBookmark=null,l=o.schema.getNonEmptyElements(),t){if(!n&&i.controlSelection.controlSelect(t))return;s=o.nodeIndex(t),a.setStart(t.parentNode,s),a.setEnd(t.parentNode,s+1),n&&(r(t,1),r(t)),i.setRng(a)}return t},isCollapsed:function(){var e=this,t=e.getRng(),n=e.getSel();return!t||t.item?!1:t.compareEndPoints?0===t.compareEndPoints("StartToEnd",t):!n||t.collapsed},collapse:function(e){var t=this,n=t.getRng(),r;n.item&&(r=n.item(0),n=t.win.document.body.createTextRange(),n.moveToElementText(r)),n.collapse(!!e),t.setRng(n)},getSel:function(){var e=this.win;return e.getSelection?e.getSelection():e.document.selection},getRng:function(e){var t=this,n,r,i,o=t.win.document,a;if(!e&&t.lastFocusBookmark){var s=t.lastFocusBookmark;return s.startContainer?(r=o.createRange(),r.setStart(s.startContainer,s.startOffset),r.setEnd(s.endContainer,s.endOffset)):r=s,r}if(e&&t.tridentSel)return t.tridentSel.getRangeAt(0);try{(n=t.getSel())&&(r=n.rangeCount>0?n.getRangeAt(0):n.createRange?n.createRange():o.createRange())}catch(l){}if(u&&r&&r.setStart){try{a=o.selection.createRange()}catch(l){}a&&a.item&&(i=a.item(0),r=o.createRange(),r.setStartBefore(i),r.setEndAfter(i))}return r||(r=o.createRange?o.createRange():o.body.createTextRange()),r.setStart&&9===r.startContainer.nodeType&&r.collapsed&&(i=t.dom.getRoot(),r.setStart(i,0),r.setEnd(i,0)),t.selectedRange&&t.explicitRange&&(0===r.compareBoundaryPoints(r.START_TO_START,t.selectedRange)&&0===r.compareBoundaryPoints(r.END_TO_END,t.selectedRange)?r=t.explicitRange:(t.selectedRange=null,t.explicitRange=null)),r},setRng:function(e,t){var n=this,r;if(e.select)try{e.select()}catch(i){}else if(n.tridentSel){if(e.cloneRange)try{return n.tridentSel.addRange(e),void 0}catch(i){}}else if(r=n.getSel()){n.explicitRange=e;try{r.removeAllRanges(),r.addRange(e)}catch(i){}t===!1&&r.extend&&(r.collapse(e.endContainer,e.endOffset),r.extend(e.startContainer,e.startOffset)),n.selectedRange=r.rangeCount>0?r.getRangeAt(0):null}},setNode:function(e){var t=this;return t.setContent(t.dom.getOuterHTML(e)),e},getNode:function(){function e(e,t){for(var n=e;e&&3===e.nodeType&&0===e.length;)e=t?e.nextSibling:e.previousSibling;return e||n}var t=this,n=t.getRng(),r,i=n.startContainer,o=n.endContainer,a=n.startOffset,s=n.endOffset;return n?n.setStart?(r=n.commonAncestorContainer,!n.collapsed&&(i==o&&2>s-a&&i.hasChildNodes()&&(r=i.childNodes[a]),3===i.nodeType&&3===o.nodeType&&(i=i.length===a?e(i.nextSibling,!0):i.parentNode,o=0===s?e(o.previousSibling,!1):o.parentNode,i&&i===o))?i:r&&3==r.nodeType?r.parentNode:r):n.item?n.item(0):n.parentElement():t.dom.getRoot()},getSelectedBlocks:function(t,n){var r=this,i=r.dom,o,a,s=[];if(a=i.getRoot(),t=i.getParent(t||r.getStart(),i.isBlock),n=i.getParent(n||r.getEnd(),i.isBlock),t&&t!=a&&s.push(t),t&&n&&t!=n){o=t;for(var l=new e(t,a);(o=l.next())&&o!=n;)i.isBlock(o)&&s.push(o)}return n&&t!=n&&n!=a&&s.push(n),s},isForward:function(){var e=this.dom,t=this.getSel(),n,r;return t&&t.anchorNode&&t.focusNode?(n=e.createRng(),n.setStart(t.anchorNode,t.anchorOffset),n.collapse(!0),r=e.createRng(),r.setStart(t.focusNode,t.focusOffset),r.collapse(!0),n.compareBoundaryPoints(n.START_TO_START,r)<=0):!0},normalize:function(){function t(t){function a(t,n){for(var r=new e(t,f.getParent(t.parentNode,f.isBlock)||p);t=r[n?"prev":"next"]();)if("BR"===t.nodeName)return!0}function s(e,t){return e.previousSibling&&e.previousSibling.nodeName==t}function l(t,n){var r,a;for(n=n||c,r=new e(n,f.getParent(n.parentNode,f.isBlock)||p);h=r[t?"prev":"next"]();){if(3===h.nodeType&&h.nodeValue.length>0)return c=h,u=t?h.nodeValue.length:0,i=!0,void 0;if(f.isBlock(h)||m[h.nodeName.toLowerCase()])return;a=h}o&&a&&(c=a,i=!0,u=0)}var c,u,d,f=n.dom,p=f.getRoot(),h,m,g;if(c=r[(t?"start":"end")+"Container"],u=r[(t?"start":"end")+"Offset"],m=f.schema.getNonEmptyElements(),9===c.nodeType&&(c=f.getRoot(),u=0),c===p){if(t&&(h=c.childNodes[u>0?u-1:0],h&&(g=h.nodeName.toLowerCase(),m[h.nodeName]||"TABLE"==h.nodeName)))return;if(c.hasChildNodes()&&(u=Math.min(!t&&u>0?u-1:u,c.childNodes.length-1),c=c.childNodes[u],u=0,c.hasChildNodes()&&!/TABLE/.test(c.nodeName))){h=c,d=new e(c,p);do{if(3===h.nodeType&&h.nodeValue.length>0){u=t?0:h.nodeValue.length,c=h,i=!0;break}if(m[h.nodeName.toLowerCase()]){u=f.nodeIndex(h),c=h.parentNode,"IMG"!=h.nodeName||t||u++,i=!0;break}}while(h=t?d.next():d.prev())}}o&&(3===c.nodeType&&0===u&&l(!0),1===c.nodeType&&(h=c.childNodes[u],!h||"BR"!==h.nodeName||s(h,"A")||a(h)||a(h,!0)||l(!0,c.childNodes[u]))),t&&!o&&3===c.nodeType&&u===c.nodeValue.length&&l(!1),i&&r["set"+(t?"Start":"End")](c,u)}var n=this,r,i,o;u||(r=n.getRng(),o=r.collapsed,t(!0),o||t(),i&&(o&&r.collapse(!0),n.setRng(r,n.isForward())))},selectorChanged:function(e,t){var n=this,r;return n.selectorChangedData||(n.selectorChangedData={},r={},n.editor.on("NodeChange",function(e){var t=e.element,i=n.dom,o=i.getParents(t,null,i.getRoot()),a={};s(n.selectorChangedData,function(e,t){s(o,function(n){return i.is(n,t)?(r[t]||(s(e,function(e){e(!0,{node:n,selector:t,parents:o})}),r[t]=e),a[t]=e,!1):void 0})}),s(r,function(e,n){a[n]||(delete r[n],s(e,function(e){e(!1,{node:t,selector:n,parents:o})}))})})),n.selectorChangedData[e]||(n.selectorChangedData[e]=[]),n.selectorChangedData[e].push(t),n},getScrollContainer:function(){for(var e,t=this.dom.getRoot();t&&"BODY"!=t.nodeName;){if(t.scrollHeight>t.clientHeight){e=t;break}t=t.parentNode}return e},scrollIntoView:function(e){function t(e){for(var t=0,n=0,r=e;r&&r.nodeType;)t+=r.offsetLeft||0,n+=r.offsetTop||0,r=r.offsetParent;return{x:t,y:n}}var n,r,i=this,o=i.dom,a=o.getRoot(),s,l;if("BODY"!=a.nodeName){var c=i.getScrollContainer();if(c)return n=t(e).y-t(c).y,l=c.clientHeight,s=c.scrollTop,(s>n||n+25>s+l)&&(c.scrollTop=s>n?n:n-l+25),void 0}r=o.getViewPort(i.editor.getWin()),n=o.getPos(e).y,s=r.y,l=r.h,(n<r.y||n+25>s+l)&&i.editor.getWin().scrollTo(0,s>n?n:n-l+25)},destroy:function(){this.win=null,this.controlSelection.destroy()}},a}),r(B,[p],function(e){function t(e){this.walk=function(t,r){function i(e){var t;return t=e[0],3===t.nodeType&&t===l&&c>=t.nodeValue.length&&e.splice(0,1),t=e[e.length-1],0===d&&e.length>0&&t===u&&3===t.nodeType&&e.splice(e.length-1,1),e}function o(e,t,n){for(var r=[];e&&e!=n;e=e[t])r.push(e);return r}function a(e,t){do{if(e.parentNode==t)return e;e=e.parentNode}while(e)}function s(e,t,n){var a=n?"nextSibling":"previousSibling";for(m=e,g=m.parentNode;m&&m!=t;m=g)g=m.parentNode,v=o(m==e?m:m[a],a),v.length&&(n||v.reverse(),r(i(v)))}var l=t.startContainer,c=t.startOffset,u=t.endContainer,d=t.endOffset,f,p,h,m,g,v,y;if(y=e.select("td.mce-item-selected,th.mce-item-selected"),y.length>0)return n(y,function(e){r([e])}),void 0;if(1==l.nodeType&&l.hasChildNodes()&&(l=l.childNodes[c]),1==u.nodeType&&u.hasChildNodes()&&(u=u.childNodes[Math.min(d-1,u.childNodes.length-1)]),l==u)return r(i([l]));for(f=e.findCommonAncestor(l,u),m=l;m;m=m.parentNode){if(m===u)return s(l,f,!0);if(m===f)break}for(m=u;m;m=m.parentNode){if(m===l)return s(u,f);if(m===f)break}p=a(l,f)||l,h=a(u,f)||u,s(l,p,!0),v=o(p==l?p:p.nextSibling,"nextSibling",h==u?h.nextSibling:h),v.length&&r(i(v)),s(u,h)},this.split=function(e){function t(e,t){return e.splitText(t)}var n=e.startContainer,r=e.startOffset,i=e.endContainer,o=e.endOffset;return n==i&&3==n.nodeType?r>0&&r<n.nodeValue.length&&(i=t(n,r),n=i.previousSibling,o>r?(o-=r,n=i=t(i,o).previousSibling,o=i.nodeValue.length,r=0):o=0):(3==n.nodeType&&r>0&&r<n.nodeValue.length&&(n=t(n,r),r=0),3==i.nodeType&&o>0&&o<i.nodeValue.length&&(i=t(i,o).previousSibling,o=i.nodeValue.length)),{startContainer:n,startOffset:r,endContainer:i,endOffset:o}}}var n=e.each;return t.compareRanges=function(e,t){if(e&&t){if(!e.item&&!e.duplicate)return e.startContainer==t.startContainer&&e.startOffset==t.startOffset;if(e.item&&t.item&&e.item(0)===t.item(0))return!0;if(e.isEqual&&t.isEqual&&t.isEqual(e))return!0}return!1},t}),r(L,[f,B,p],function(e,t,n){return function(r){function i(e){return e.nodeType&&(e=e.nodeName),!!r.schema.getTextBlockElements()[e.toLowerCase()]}function o(e,t){return I.getParents(e,t,I.getRoot())}function a(e){return 1===e.nodeType&&"_mce_caret"===e.id}function s(){u({alignleft:[{selector:"figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li",styles:{textAlign:"left"},defaultBlock:"div"},{selector:"img,table",collapsed:!1,styles:{"float":"left"}}],aligncenter:[{selector:"figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li",styles:{textAlign:"center"},defaultBlock:"div"},{selector:"img",collapsed:!1,styles:{display:"block",marginLeft:"auto",marginRight:"auto"}},{selector:"table",collapsed:!1,styles:{marginLeft:"auto",marginRight:"auto"}}],alignright:[{selector:"figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li",styles:{textAlign:"right"},defaultBlock:"div"},{selector:"img,table",collapsed:!1,styles:{"float":"right"}}],alignjustify:[{selector:"figure,p,h1,h2,h3,h4,h5,h6,td,th,tr,div,ul,ol,li",styles:{textAlign:"justify"},defaultBlock:"div"}],bold:[{inline:"strong",remove:"all"},{inline:"span",styles:{fontWeight:"bold"}},{inline:"b",remove:"all"}],italic:[{inline:"em",remove:"all"},{inline:"span",styles:{fontStyle:"italic"}},{inline:"i",remove:"all"}],underline:[{inline:"span",styles:{textDecoration:"underline"},exact:!0},{inline:"u",remove:"all"}],strikethrough:[{inline:"span",styles:{textDecoration:"line-through"},exact:!0},{inline:"strike",remove:"all"}],forecolor:{inline:"span",styles:{color:"%value"},wrap_links:!1},hilitecolor:{inline:"span",styles:{backgroundColor:"%value"},wrap_links:!1},fontname:{inline:"span",styles:{fontFamily:"%value"}},fontsize:{inline:"span",styles:{fontSize:"%value"}},fontsize_class:{inline:"span",attributes:{"class":"%value"}},blockquote:{block:"blockquote",wrapper:1,remove:"all"},subscript:{inline:"sub"},superscript:{inline:"sup"},code:{inline:"code"},link:{inline:"a",selector:"a",remove:"all",split:!0,deep:!0,onmatch:function(){return!0},onformat:function(e,t,n){et(n,function(t,n){I.setAttrib(e,n,t)})}},removeformat:[{selector:"b,strong,em,i,font,u,strike,sub,sup",remove:"all",split:!0,expand:!1,block_expand:!0,deep:!0},{selector:"span",attributes:["style","class"],remove:"empty",split:!0,expand:!1,deep:!0},{selector:"*",attributes:["style","class"],split:!1,expand:!1,deep:!0}]}),et("p h1 h2 h3 h4 h5 h6 div address pre div dt dd samp".split(/\s/),function(e){u(e,{block:e,remove:"all"})}),u(r.settings.formats)}function l(){r.addShortcut("ctrl+b","bold_desc","Bold"),r.addShortcut("ctrl+i","italic_desc","Italic"),r.addShortcut("ctrl+u","underline_desc","Underline");for(var e=1;6>=e;e++)r.addShortcut("ctrl+"+e,"",["FormatBlock",!1,"h"+e]);r.addShortcut("ctrl+7","",["FormatBlock",!1,"p"]),r.addShortcut("ctrl+8","",["FormatBlock",!1,"div"]),r.addShortcut("ctrl+9","",["FormatBlock",!1,"address"])}function c(e){return e?O[e]:O}function u(e,t){e&&("string"!=typeof e?et(e,function(e,t){u(t,e)}):(t=t.length?t:[t],et(t,function(e){e.deep===X&&(e.deep=!e.selector),e.split===X&&(e.split=!e.selector||e.inline),e.remove===X&&e.selector&&!e.inline&&(e.remove="none"),e.selector&&e.inline&&(e.mixed=!0,e.block_expand=!0),"string"==typeof e.classes&&(e.classes=e.classes.split(/\s+/))}),O[e]=t))}function d(e){var t;return r.dom.getParent(e,function(e){return t=r.dom.getStyle(e,"text-decoration"),t&&"none"!==t}),t}function f(e){var t;1===e.nodeType&&e.parentNode&&1===e.parentNode.nodeType&&(t=d(e.parentNode),r.dom.getStyle(e,"color")&&t?r.dom.setStyle(e,"text-decoration",t):r.dom.getStyle(e,"textdecoration")===t&&r.dom.setStyle(e,"text-decoration",null))}function p(t,n,o){function s(e,t){t=t||m,e&&(t.onformat&&t.onformat(e,t,n,o),et(t.styles,function(t,r){I.setStyle(e,r,E(t,n))}),et(t.attributes,function(t,r){I.setAttrib(e,r,E(t,n))}),et(t.classes,function(t){t=E(t,n),I.hasClass(e,t)||I.addClass(e,t)}))}function l(){function t(t,n){var r=new e(n);for(o=r.current();o;o=r.prev())if(o.childNodes.length>1||o==t||"BR"==o.tagName)return o}var n=r.selection.getRng(),i=n.startContainer,a=n.endContainer;if(i!=a&&0===n.endOffset){var s=t(i,a),l=3==s.nodeType?s.length:s.childNodes.length;n.setEnd(s,l)}return n}function u(e,t,n,r,i){var o=[],a=-1,s,l=-1,c=-1,u;return et(e.childNodes,function(e,t){return"UL"===e.nodeName||"OL"===e.nodeName?(a=t,s=e,!1):void 0}),et(e.childNodes,function(e,n){"SPAN"===e.nodeName&&"bookmark"==I.getAttrib(e,"data-mce-type")&&(e.id==t.id+"_start"?l=n:e.id==t.id+"_end"&&(c=n))}),0>=a||a>l&&c>a?(et(tt(e.childNodes),i),0):(u=I.clone(n,K),et(tt(e.childNodes),function(e,t){(a>l&&a>t||l>a&&t>a)&&(o.push(e),e.parentNode.removeChild(e))}),a>l?e.insertBefore(u,s):l>a&&e.insertBefore(u,s.nextSibling),r.push(u),et(o,function(e){u.appendChild(e)}),u)}function d(e,r,o){var l=[],c,d,f=!0;c=m.inline||m.block,d=I.create(c),s(d),z.walk(e,function(e){function p(e){var y,C,x,_,N;return N=f,y=e.nodeName.toLowerCase(),C=e.parentNode.nodeName.toLowerCase(),1===e.nodeType&&J(e)&&(N=f,f="true"===J(e),_=!0),w(y,"br")?(v=0,m.block&&I.remove(e),void 0):m.wrapper&&g(e,t,n)?(v=0,void 0):f&&!_&&m.block&&!m.wrapper&&i(y)&&W(C,c)?(e=I.rename(e,c),s(e),l.push(e),v=0,void 0):m.selector&&(et(h,function(t){"collapsed"in t&&t.collapsed!==b||I.is(e,t.selector)&&!a(e)&&(s(e,t),x=!0)}),!m.inline||x)?(v=0,void 0):(!f||_||!W(c,y)||!W(C,c)||!o&&3===e.nodeType&&1===e.nodeValue.length&&65279===e.nodeValue.charCodeAt(0)||a(e)||m.inline&&V(e)?"li"==y&&r?v=u(e,r,d,l,p):(v=0,et(tt(e.childNodes),p),_&&(f=N),v=0):(v||(v=I.clone(d,K),e.parentNode.insertBefore(v,e),l.push(v)),v.appendChild(e)),void 0)}var v;et(e,p)}),m.wrap_links===!1&&et(l,function(e){function t(e){var n,r,i;if("A"===e.nodeName){for(r=I.clone(d,K),l.push(r),i=tt(e.childNodes),n=0;n<i.length;n++)r.appendChild(i[n]);e.appendChild(r)}et(tt(e.childNodes),t)}t(e)}),et(l,function(e){function r(e){var t=0;return et(e.childNodes,function(e){S(e)||L(e)||t++}),t}function i(e){var t,n;return et(e.childNodes,function(e){return 1!=e.nodeType||L(e)||a(e)?void 0:(t=e,K)}),t&&x(t,m)&&(n=I.clone(t,K),s(n),I.replace(n,e,G),I.remove(t,1)),n||e}var o;if(o=r(e),(l.length>1||!V(e))&&0===o)return I.remove(e,1),void 0;if(m.inline||m.wrapper){if(m.exact||1!==o||(e=i(e)),et(h,function(t){et(I.select(t.inline,e),function(e){var r;if(t.wrap_links===!1){r=e.parentNode;do if("A"===r.nodeName)return;while(r=r.parentNode)}R(t,n,e,t.exact?e:null)})}),g(e.parentNode,t,n))return I.remove(e,1),e=0,G;m.merge_with_parents&&I.getParent(e.parentNode,function(r){return g(r,t,n)?(I.remove(e,1),e=0,G):void 0}),e&&m.merge_siblings!==!1&&(e=H(B(e),e),e=H(e,B(e,G)))}})}var h=c(t),m=h[0],v,y,b=!o&&F.isCollapsed();if(m)if(o)o.nodeType?(y=I.createRng(),y.setStartBefore(o),y.setEndAfter(o),d(T(y,h),null,!0)):d(o,null,!0);else if(b&&m.inline&&!I.select("td.mce-item-selected,th.mce-item-selected").length)M("apply",t,n);else{var C=r.selection.getNode();U||!h[0].defaultBlock||I.getParent(C,I.isBlock)||p(h[0].defaultBlock),r.selection.setRng(l()),v=F.getBookmark(),d(T(F.getRng(G),h),v),m.styles&&(m.styles.color||m.styles.textDecoration)&&(nt(C,f,"childNodes"),f(C)),F.moveToBookmark(v),P(F.getRng(G)),r.nodeChanged()}}function h(e,t,n){function i(e){var n,r,o,a,s;if(1===e.nodeType&&J(e)&&(a=b,b="true"===J(e),s=!0),n=tt(e.childNodes),b&&!s)for(r=0,o=p.length;o>r&&!R(p[r],t,e,e);r++);if(h.deep&&n.length){for(r=0,o=n.length;o>r;r++)i(n[r]);s&&(b=a)}}function a(n){var r;return et(o(n.parentNode).reverse(),function(n){var i;r||"_start"==n.id||"_end"==n.id||(i=g(n,e,t),i&&i.split!==!1&&(r=n))}),r}function s(e,n,r,i){var o,a,s,l,c,u;if(e){for(u=e.parentNode,o=n.parentNode;o&&o!=u;o=o.parentNode){for(a=I.clone(o,K),c=0;c<p.length;c++)if(R(p[c],t,a,a)){a=0;break}a&&(s&&a.appendChild(s),l||(l=a),s=a)}!i||h.mixed&&V(e)||(n=I.split(e,n)),s&&(r.parentNode.insertBefore(s,r),l.appendChild(r))}return n}function l(e){return s(a(e),e,e,!0)}function u(e){var t=I.get(e?"_start":"_end"),n=t[e?"firstChild":"lastChild"];return L(n)&&(n=n[e?"firstChild":"lastChild"]),I.remove(t,!0),n}function f(e){var t,n;e=T(e,p,G),h.split&&(t=D(e,G),n=D(e),t!=n?(/^(TR|TD)$/.test(t.nodeName)&&t.firstChild&&(t="TD"==t.nodeName?t.firstChild||t:t.firstChild.firstChild||t),t=k(t,"span",{id:"_start","data-mce-type":"bookmark"}),n=k(n,"span",{id:"_end","data-mce-type":"bookmark"}),l(t),l(n),t=u(G),n=u()):t=n=l(t),e.startContainer=t.parentNode,e.startOffset=q(t),e.endContainer=n.parentNode,e.endOffset=q(n)+1),z.walk(e,function(e){et(e,function(e){i(e),1===e.nodeType&&"underline"===r.dom.getStyle(e,"text-decoration")&&e.parentNode&&"underline"===d(e.parentNode)&&R({deep:!1,exact:!0,inline:"span",styles:{textDecoration:"underline"}},null,e)})})}var p=c(e),h=p[0],m,y,b=!0;return n?(n.nodeType?(y=I.createRng(),y.setStartBefore(n),y.setEndAfter(n),f(y)):f(n),void 0):(F.isCollapsed()&&h.inline&&!I.select("td.mce-item-selected,th.mce-item-selected").length?M("remove",e,t):(m=F.getBookmark(),f(F.getRng(G)),F.moveToBookmark(m),h.inline&&v(e,t,F.getStart())&&P(F.getRng(!0)),r.nodeChanged()),void 0)}function m(e,t,n){var r=c(e);!v(e,t,n)||"toggle"in r[0]&&!r[0].toggle?p(e,t,n):h(e,t,n)}function g(e,t,n,r){function i(e,t,i){var o,a,s=t[i],l;if(t.onmatch)return t.onmatch(e,t,i);if(s)if(s.length===X){for(o in s)if(s.hasOwnProperty(o)){if(a="attributes"===i?I.getAttrib(e,o):_(e,o),r&&!a&&!t.exact)return;if((!r||t.exact)&&!w(a,N(E(s[o],n),o)))return}}else for(l=0;l<s.length;l++)if("attributes"===i?I.getAttrib(e,s[l]):_(e,s[l]))return t;return t}var o=c(t),a,s,l;if(o&&e)for(s=0;s<o.length;s++)if(a=o[s],x(e,a)&&i(e,a,"attributes")&&i(e,a,"styles")){if(l=a.classes)for(s=0;s<l.length;s++)if(!I.hasClass(e,l[s]))return;return a}}function v(e,t,n){function r(n){var r=I.getRoot();return n=I.getParent(n,function(n){return n.parentNode===r||!!g(n,e,t,!0)}),g(n,e,t)}var i;return n?r(n):(n=F.getNode(),r(n)?G:(i=F.getStart(),i!=n&&r(i)?G:K))}function y(e,t){var n,r=[],i={};return n=F.getStart(),I.getParent(n,function(n){var o,a;for(o=0;o<e.length;o++)a=e[o],!i[a]&&g(n,a,t)&&(i[a]=!0,r.push(a))},I.getRoot()),r}function b(e){var t=c(e),n,r,i,a,s;if(t)for(n=F.getStart(),r=o(n),a=t.length-1;a>=0;a--){if(s=t[a].selector,!s||t[a].defaultBlock)return G;for(i=r.length-1;i>=0;i--)if(I.is(r[i],s))return G}return K}function C(e,t,n){var i;return Y||(Y={},i={},r.on("NodeChange",function(e){var t=o(e.element),n={};et(Y,function(e,r){et(t,function(o){return g(o,r,{},e.similar)?(i[r]||(et(e,function(e){e(!0,{node:o,format:r,parents:t})}),i[r]=e),n[r]=e,!1):void 0})}),et(i,function(r,o){n[o]||(delete i[o],et(r,function(n){n(!1,{node:e.element,format:o,parents:t})}))})})),et(e.split(","),function(e){Y[e]||(Y[e]=[],Y[e].similar=n),Y[e].push(t)}),this}function x(e,t){return w(e,t.inline)?G:w(e,t.block)?G:t.selector?1==e.nodeType&&I.is(e,t.selector):void 0}function w(e,t){return e=e||"",t=t||"",e=""+(e.nodeName||e),t=""+(t.nodeName||t),e.toLowerCase()==t.toLowerCase()}function _(e,t){return N(I.getStyle(e,t),t)}function N(e,t){return("color"==t||"backgroundColor"==t)&&(e=I.toHex(e)),"fontWeight"==t&&700==e&&(e="bold"),"fontFamily"==t&&(e=e.replace(/[\'\"]/g,"").replace(/,\s+/g,",")),""+e}function E(e,t){return"string"!=typeof e?e=e(t):t&&(e=e.replace(/%(\w+)/g,function(e,n){return t[n]||e})),e}function S(e){return e&&3===e.nodeType&&/^([\t \r\n]+|)$/.test(e.nodeValue)}function k(e,t,n){var r=I.create(t,n);return e.parentNode.insertBefore(r,e),r.appendChild(e),r}function T(t,n,a){function s(e){function t(e){return"BR"==e.nodeName&&e.getAttribute("data-mce-bogus")&&!e.nextSibling
}var r,i,o,a,s;if(r=i=e?g:y,a=e?"previousSibling":"nextSibling",s=I.getRoot(),3==r.nodeType&&!S(r)&&(e?v>0:b<r.nodeValue.length))return r;for(;;){if(!n[0].block_expand&&V(i))return i;for(o=i[a];o;o=o[a])if(!L(o)&&!S(o)&&!t(o))return i;if(i.parentNode==s){r=i;break}i=i.parentNode}return r}function l(e,t){for(t===X&&(t=3===e.nodeType?e.length:e.childNodes.length);e&&e.hasChildNodes();)e=e.childNodes[t],e&&(t=3===e.nodeType?e.length:e.childNodes.length);return{node:e,offset:t}}function c(e){for(var t=e;t;){if(1===t.nodeType&&J(t))return"false"===J(t)?t:e;t=t.parentNode}return e}function u(t,n,i){function o(e,t){var n,r,o=e.nodeValue;return"undefined"==typeof t&&(t=i?o.length:0),i?(n=o.lastIndexOf(" ",t),r=o.lastIndexOf("\xa0",t),n=n>r?n:r,-1===n||a||n++):(n=o.indexOf(" ",t),r=o.indexOf("\xa0",t),n=-1!==n&&(-1===r||r>n)?n:r),n}var s,l,c,u;if(3===t.nodeType){if(c=o(t,n),-1!==c)return{container:t,offset:c};u=t}for(s=new e(t,I.getParent(t,V)||r.getBody());l=s[i?"prev":"next"]();)if(3===l.nodeType){if(u=l,c=o(l),-1!==c)return{container:l,offset:c}}else if(V(l))break;return u?(n=i?0:u.length,{container:u,offset:n}):void 0}function d(e,r){var i,a,s,l;for(3==e.nodeType&&0===e.nodeValue.length&&e[r]&&(e=e[r]),i=o(e),a=0;a<i.length;a++)for(s=0;s<n.length;s++)if(l=n[s],!("collapsed"in l&&l.collapsed!==t.collapsed)&&I.is(i[a],l.selector))return i[a];return e}function f(e,t){var r,a=I.getRoot();if(n[0].wrapper||(r=I.getParent(e,n[0].block)),r||(r=I.getParent(3==e.nodeType?e.parentNode:e,function(e){return e!=a&&i(e)})),r&&n[0].wrapper&&(r=o(r,"ul,ol").reverse()[0]||r),!r)for(r=e;r[t]&&!V(r[t])&&(r=r[t],!w(r,"br")););return r||e}var p,h,m,g=t.startContainer,v=t.startOffset,y=t.endContainer,b=t.endOffset;if(1==g.nodeType&&g.hasChildNodes()&&(p=g.childNodes.length-1,g=g.childNodes[v>p?p:v],3==g.nodeType&&(v=0)),1==y.nodeType&&y.hasChildNodes()&&(p=y.childNodes.length-1,y=y.childNodes[b>p?p:b-1],3==y.nodeType&&(b=y.nodeValue.length)),g=c(g),y=c(y),(L(g.parentNode)||L(g))&&(g=L(g)?g:g.parentNode,g=g.nextSibling||g,3==g.nodeType&&(v=0)),(L(y.parentNode)||L(y))&&(y=L(y)?y:y.parentNode,y=y.previousSibling||y,3==y.nodeType&&(b=y.length)),n[0].inline&&(t.collapsed&&(m=u(g,v,!0),m&&(g=m.container,v=m.offset),m=u(y,b),m&&(y=m.container,b=m.offset)),h=l(y,b),h.node)){for(;h.node&&0===h.offset&&h.node.previousSibling;)h=l(h.node.previousSibling);h.node&&h.offset>0&&3===h.node.nodeType&&" "===h.node.nodeValue.charAt(h.offset-1)&&h.offset>1&&(y=h.node,y.splitText(h.offset-1))}return(n[0].inline||n[0].block_expand)&&(n[0].inline&&3==g.nodeType&&0!==v||(g=s(!0)),n[0].inline&&3==y.nodeType&&b!==y.nodeValue.length||(y=s())),n[0].selector&&n[0].expand!==K&&!n[0].inline&&(g=d(g,"previousSibling"),y=d(y,"nextSibling")),(n[0].block||n[0].selector)&&(g=f(g,"previousSibling"),y=f(y,"nextSibling"),n[0].block&&(V(g)||(g=s(!0)),V(y)||(y=s()))),1==g.nodeType&&(v=q(g),g=g.parentNode),1==y.nodeType&&(b=q(y)+1,y=y.parentNode),{startContainer:g,startOffset:v,endContainer:y,endOffset:b}}function R(e,t,n,r){var i,o,a;if(!x(n,e))return K;if("all"!=e.remove)for(et(e.styles,function(e,i){e=N(E(e,t),i),"number"==typeof i&&(i=e,r=0),(!r||w(_(r,i),e))&&I.setStyle(n,i,""),a=1}),a&&""===I.getAttrib(n,"style")&&(n.removeAttribute("style"),n.removeAttribute("data-mce-style")),et(e.attributes,function(e,i){var o;if(e=E(e,t),"number"==typeof i&&(i=e,r=0),!r||w(I.getAttrib(r,i),e)){if("class"==i&&(e=I.getAttrib(n,i),e&&(o="",et(e.split(/\s+/),function(e){/mce\w+/.test(e)&&(o+=(o?" ":"")+e)}),o)))return I.setAttrib(n,i,o),void 0;"class"==i&&n.removeAttribute("className"),$.test(i)&&n.removeAttribute("data-mce-"+i),n.removeAttribute(i)}}),et(e.classes,function(e){e=E(e,t),(!r||I.hasClass(r,e))&&I.removeClass(n,e)}),o=I.getAttribs(n),i=0;i<o.length;i++)if(0!==o[i].nodeName.indexOf("_"))return K;return"none"!=e.remove?(A(n,e),G):void 0}function A(e,t){function n(e,t,n){return e=B(e,t,n),!e||"BR"==e.nodeName||V(e)}var r=e.parentNode,i;t.block&&(U?r==I.getRoot()&&(t.list_block&&w(e,t.list_block)||et(tt(e.childNodes),function(e){W(U,e.nodeName.toLowerCase())?i?i.appendChild(e):i=k(e,U):i=0})):V(e)&&!V(r)&&(n(e,K)||n(e.firstChild,G,1)||e.insertBefore(I.create("br"),e.firstChild),n(e,G)||n(e.lastChild,K,1)||e.appendChild(I.create("br")))),t.selector&&t.inline&&!w(t.inline,e)||I.remove(e,1)}function B(e,t,n){if(e)for(t=t?"nextSibling":"previousSibling",e=n?e:e[t];e;e=e[t])if(1==e.nodeType||!S(e))return e}function L(e){return e&&1==e.nodeType&&"bookmark"==e.getAttribute("data-mce-type")}function H(e,t){function n(e,t){function n(e){var t={};return et(I.getAttribs(e),function(n){var r=n.nodeName.toLowerCase();0!==r.indexOf("_")&&"style"!==r&&(t[r]=I.getAttrib(e,r))}),t}function r(e,t){var n,r;for(r in e)if(e.hasOwnProperty(r)){if(n=t[r],n===X)return K;if(e[r]!=n)return K;delete t[r]}for(r in t)if(t.hasOwnProperty(r))return K;return G}return e.nodeName!=t.nodeName?K:r(n(e),n(t))?r(I.parseStyle(I.getAttrib(e,"style")),I.parseStyle(I.getAttrib(t,"style")))?G:K:K}function r(e,t){for(i=e;i;i=i[t]){if(3==i.nodeType&&0!==i.nodeValue.length)return e;if(1==i.nodeType&&!L(i))return i}return e}var i,o;if(e&&t&&(e=r(e,"previousSibling"),t=r(t,"nextSibling"),n(e,t))){for(i=e.nextSibling;i&&i!=t;)o=i,i=i.nextSibling,e.appendChild(o);return I.remove(t),et(tt(t.childNodes),function(t){e.appendChild(t)}),e}return t}function D(t,n){var i,o,a;return i=t[n?"startContainer":"endContainer"],o=t[n?"startOffset":"endOffset"],1==i.nodeType&&(a=i.childNodes.length-1,!n&&o&&o--,i=i.childNodes[o>a?a:o]),3===i.nodeType&&n&&o>=i.nodeValue.length&&(i=new e(i,r.getBody()).next()||i),3!==i.nodeType||n||0!==o||(i=new e(i,r.getBody()).prev()||i),i}function M(t,n,o){function a(e){var t=I.create("span",{id:y,"data-mce-bogus":!0,style:b?"color:red":""});return e&&t.appendChild(r.getDoc().createTextNode(j)),t}function s(e,t){for(;e;){if(3===e.nodeType&&e.nodeValue!==j||e.childNodes.length>1)return!1;t&&1===e.nodeType&&t.push(e),e=e.firstChild}return!0}function l(e){for(;e;){if(e.id===y)return e;e=e.parentNode}}function u(t){var n;if(t)for(n=new e(t,t),t=n.current();t;t=n.next())if(3===t.nodeType)return t}function d(e,t){var n,r;if(e)r=F.getRng(!0),s(e)?(t!==!1&&(r.setStartBefore(e),r.setEndBefore(e)),I.remove(e)):(n=u(e),n.nodeValue.charAt(0)===j&&(n=n.deleteData(0,1)),I.remove(e,1)),F.setRng(r);else if(e=l(F.getStart()),!e)for(;e=I.get(y);)d(e,!1)}function f(){var e,t,r,i,s,d,f;e=F.getRng(!0),i=e.startOffset,d=e.startContainer,f=d.nodeValue,t=l(F.getStart()),t&&(r=u(t)),f&&i>0&&i<f.length&&/\w/.test(f.charAt(i))&&/\w/.test(f.charAt(i-1))?(s=F.getBookmark(),e.collapse(!0),e=T(e,c(n)),e=z.split(e),p(n,o,e),F.moveToBookmark(s)):(t&&r.nodeValue===j?p(n,o,t):(t=a(!0),r=t.firstChild,e.insertNode(t),i=1,p(n,o,t)),F.setCursorLocation(r,i))}function m(){var e=F.getRng(!0),t,r,s,l,u,d,f=[],p,m;for(t=e.startContainer,r=e.startOffset,u=t,3==t.nodeType&&((r!=t.nodeValue.length||t.nodeValue===j)&&(l=!0),u=u.parentNode);u;){if(g(u,n,o)){d=u;break}u.nextSibling&&(l=!0),f.push(u),u=u.parentNode}if(d)if(l)s=F.getBookmark(),e.collapse(!0),e=T(e,c(n),!0),e=z.split(e),h(n,o,e),F.moveToBookmark(s);else{for(m=a(),u=m,p=f.length-1;p>=0;p--)u.appendChild(I.clone(f[p],!1)),u=u.firstChild;u.appendChild(I.doc.createTextNode(j)),u=u.firstChild;var v=I.getParent(d,i);v&&I.isEmpty(v)?d.parentNode.replaceChild(m,d):I.insertAfter(m,d),F.setCursorLocation(u,1),I.isEmpty(d)&&I.remove(d)}}function v(){var e;e=l(F.getStart()),e&&!I.isEmpty(e)&&nt(e,function(e){1!=e.nodeType||e.id===y||I.isEmpty(e)||I.setAttrib(e,"data-mce-bogus",null)},"childNodes")}var y="_mce_caret",b=r.settings.caret_debug;r._hasCaretEvents||(Z=function(){var e=[],t;if(s(l(F.getStart()),e))for(t=e.length;t--;)I.setAttrib(e[t],"data-mce-bogus","1")},Q=function(e){var t=e.keyCode;d(),(8==t||37==t||39==t)&&d(l(F.getStart())),v()},r.on("SetContent",function(e){e.selection&&v()}),r._hasCaretEvents=!0),"apply"==t?f():m()}function P(t){var n=t.startContainer,r=t.startOffset,i,o,a,s,l;if(3==n.nodeType&&r>=n.nodeValue.length&&(r=q(n),n=n.parentNode,i=!0),1==n.nodeType)for(s=n.childNodes,n=s[Math.min(r,s.length-1)],o=new e(n,I.getParent(n,I.isBlock)),(r>s.length-1||i)&&o.next(),a=o.current();a;a=o.next())if(3==a.nodeType&&!S(a))return l=I.create("a",null,j),a.parentNode.insertBefore(l,a),t.setStart(a,0),F.setRng(t),I.remove(l),void 0}var O={},I=r.dom,F=r.selection,z=new t(I),W=r.schema.isValidChild,V=I.isBlock,U=r.settings.forced_root_block,q=I.nodeIndex,j="\ufeff",$=/^(src|href|style)$/,K=!1,G=!0,Y,X,J=I.getContentEditable,Q,Z,et=n.each,tt=n.grep,nt=n.walk,rt=n.extend;rt(this,{get:c,register:u,apply:p,remove:h,toggle:m,match:v,matchAll:y,matchNode:g,canApply:b,formatChanged:C}),s(),l(),r.on("BeforeGetContent",function(){Z&&Z()}),r.on("mouseup keydown",function(e){Q&&Q(e)})}}),r(H,[g,p],function(e,t){var n=t.trim,r;return r=new RegExp(["<span[^>]+data-mce-bogus[^>]+>[\u200b\ufeff]+<\\/span>","<div[^>]+data-mce-bogus[^>]+><\\/div>",'\\s?data-mce-selected="[^"]+"'].join("|"),"gi"),function(t){function i(){return n(t.getContent({format:"raw",no_events:1}).replace(r,""))}function o(){a.typing=!1,a.add()}var a,s=0,l=[],c,u,d;return t.on("init",function(){a.add()}),t.on("BeforeExecCommand",function(e){var t=e.command;"Undo"!=t&&"Redo"!=t&&"mceRepaint"!=t&&a.beforeChange()}),t.on("ExecCommand",function(e){var t=e.command;"Undo"!=t&&"Redo"!=t&&"mceRepaint"!=t&&a.add()}),t.on("ObjectResizeStart",function(){a.beforeChange()}),t.on("SaveContent ObjectResized",o),t.dom.bind(t.dom.getRoot(),"dragend",o),t.dom.bind(t.getBody(),"focusout",function(){!t.removed&&a.typing&&o()}),t.on("KeyUp",function(n){var r=n.keyCode;(r>=33&&36>=r||r>=37&&40>=r||45==r||13==r||n.ctrlKey)&&(o(),t.nodeChanged()),(46==r||8==r||e.mac&&(91==r||93==r))&&t.nodeChanged(),u&&a.typing&&(t.isDirty()||(t.isNotDirty=!l[0]||i()==l[0].content,t.isNotDirty||t.fire("change",{level:l[0],lastLevel:null})),t.fire("TypingUndo"),u=!1,t.nodeChanged())}),t.on("KeyDown",function(e){var t=e.keyCode;return t>=33&&36>=t||t>=37&&40>=t||45==t?(a.typing&&o(),void 0):((16>t||t>20)&&224!=t&&91!=t&&!a.typing&&(a.beforeChange(),a.typing=!0,a.add(),u=!0),void 0)}),t.on("MouseDown",function(){a.typing&&o()}),t.addShortcut("ctrl+z","","Undo"),t.addShortcut("ctrl+y,ctrl+shift+z","","Redo"),t.on("AddUndo Undo Redo ClearUndos MouseUp",function(e){e.isDefaultPrevented()||t.nodeChanged()}),a={data:l,typing:!1,beforeChange:function(){d||(c=t.selection.getBookmark(2,!0))},add:function(e){var n,r=t.settings,o;if(e=e||{},e.content=i(),d||t.fire("BeforeAddUndo",{level:e}).isDefaultPrevented())return null;if(o=l[s],o&&o.content==e.content)return null;if(l[s]&&(l[s].beforeBookmark=c),r.custom_undo_redo_levels&&l.length>r.custom_undo_redo_levels){for(n=0;n<l.length-1;n++)l[n]=l[n+1];l.length--,s=l.length}e.bookmark=t.selection.getBookmark(2,!0),s<l.length-1&&(l.length=s+1),l.push(e),s=l.length-1;var a={level:e,lastLevel:o};return t.fire("AddUndo",a),s>0&&(t.fire("change",a),t.isNotDirty=!1),e},undo:function(){var e;return a.typing&&(a.add(),a.typing=!1),s>0&&(e=l[--s],0===s&&(t.isNotDirty=!0),t.setContent(e.content,{format:"raw"}),t.selection.moveToBookmark(e.beforeBookmark),t.fire("undo",{level:e})),e},redo:function(){var e;return s<l.length-1&&(e=l[++s],t.setContent(e.content,{format:"raw"}),t.selection.moveToBookmark(e.bookmark),t.fire("redo",{level:e})),e},clear:function(){l=[],s=0,a.typing=!1,t.fire("ClearUndos")},hasUndo:function(){return s>0||a.typing&&l[0]&&i()!=l[0].content},hasRedo:function(){return s<l.length-1&&!this.typing},transact:function(e){a.beforeChange(),d=!0,e(),d=!1,a.add()}}}}),r(D,[f,g],function(e,t){var n=t.ie&&t.ie<11;return function(t){function r(r){function u(e){return e&&i.isBlock(e)&&!/^(TD|TH|CAPTION|FORM)$/.test(e.nodeName)&&!/^(fixed|absolute)/i.test(e.style.position)&&"true"!==i.getContentEditable(e)}function d(e){var t;i.isBlock(e)&&(t=o.getRng(),e.appendChild(i.create("span",null,"\xa0")),o.select(e),e.lastChild.outerHTML="",o.setRng(t))}function f(e){for(var t=e,n=[],r;t=t.firstChild;){if(i.isBlock(t))return;1!=t.nodeType||c[t.nodeName.toLowerCase()]||n.push(t)}for(r=n.length;r--;)t=n[r],!t.hasChildNodes()||t.firstChild==t.lastChild&&""===t.firstChild.nodeValue?i.remove(t):"A"==t.nodeName&&" "===(t.innerText||t.textContent)&&i.remove(t)}function p(t){var n,r,a,s=t,l;if(a=i.createRng(),t.hasChildNodes()){for(n=new e(t,t);r=n.current();){if(3==r.nodeType){a.setStart(r,0),a.setEnd(r,0);break}if(c[r.nodeName.toLowerCase()]){a.setStartBefore(r),a.setEndBefore(r);break}s=r,r=n.next()}r||(a.setStart(s,0),a.setEnd(s,0))}else"BR"==t.nodeName?t.nextSibling&&i.isBlock(t.nextSibling)?((!R||9>R)&&(l=i.create("br"),t.parentNode.insertBefore(l,t)),a.setStartBefore(t),a.setEndBefore(t)):(a.setStartAfter(t),a.setEndAfter(t)):(a.setStart(t,0),a.setEnd(t,0));o.setRng(a),i.remove(l),o.scrollIntoView(t)}function h(e){var t=S,r,o,s;if(r=e||"TABLE"==D?i.create(e||P):T.cloneNode(!1),s=r,a.keep_styles!==!1)do if(/^(SPAN|STRONG|B|EM|I|FONT|STRIKE|U)$/.test(t.nodeName)){if("_mce_caret"==t.id)continue;o=t.cloneNode(!1),i.setAttrib(o,"id",""),r.hasChildNodes()?(o.appendChild(r.firstChild),r.appendChild(o)):(s=o,r.appendChild(o))}while(t=t.parentNode);return n||(s.innerHTML='<br data-mce-bogus="1">'),r}function m(t){var n,r,i;if(3==S.nodeType&&(t?k>0:k<S.nodeValue.length))return!1;if(S.parentNode==T&&O&&!t)return!0;if(t&&1==S.nodeType&&S==T.firstChild)return!0;if("TABLE"===S.nodeName||S.previousSibling&&"TABLE"==S.previousSibling.nodeName)return O&&!t||!O&&t;for(n=new e(S,T),3==S.nodeType&&(t&&0===k?n.prev():t||k!=S.nodeValue.length||n.next());r=n.current();){if(1===r.nodeType){if(!r.getAttribute("data-mce-bogus")&&(i=r.nodeName.toLowerCase(),c[i]&&"br"!==i))return!1}else if(3===r.nodeType&&!/^[ \t\r\n]*$/.test(r.nodeValue))return!1;t?n.prev():n.next()}return!0}function g(e,n){var r,o,a,s,c,d,f=P||"P";if(o=i.getParent(e,i.isBlock),d=t.getBody().nodeName.toLowerCase(),!o||!u(o)){if(o=o||E,!o.hasChildNodes())return r=i.create(f),o.appendChild(r),_.setStart(r,0),_.setEnd(r,0),r;for(s=e;s.parentNode!=o;)s=s.parentNode;for(;s&&!i.isBlock(s);)a=s,s=s.previousSibling;if(a&&l.isValidChild(d,f.toLowerCase())){for(r=i.create(f),a.parentNode.insertBefore(r,a),s=a;s&&!i.isBlock(s);)c=s.nextSibling,r.appendChild(s),s=c;_.setStart(e,n),_.setEnd(e,n)}}return e}function v(){function e(e){for(var t=H[e?"firstChild":"lastChild"];t&&1!=t.nodeType;)t=t[e?"nextSibling":"previousSibling"];return t===T}function t(){var e=H.parentNode;return"LI"==e.nodeName?e:H}var n=H.parentNode.nodeName;/^(OL|UL|LI)$/.test(n)&&(P="LI"),B=P?h(P):i.create("BR"),e(!0)&&e()?"LI"==n?i.insertAfter(B,t()):i.replace(B,H):e(!0)?"LI"==n?(i.insertAfter(B,t()),B.appendChild(i.doc.createTextNode(" ")),B.appendChild(H)):H.parentNode.insertBefore(B,H):e()?(i.insertAfter(B,t()),d(B)):(H=t(),N=_.cloneRange(),N.setStartAfter(T),N.setEndAfter(H),L=N.extractContents(),i.insertAfter(L,H),i.insertAfter(B,H)),i.remove(T),p(B),s.add()}function y(){for(var t=new e(S,T),n;n=t.next();)if(c[n.nodeName.toLowerCase()]||n.length>0)return!0}function b(){var e,t,r;S&&3==S.nodeType&&k>=S.nodeValue.length&&(n||y()||(e=i.create("br"),_.insertNode(e),_.setStartAfter(e),_.setEndAfter(e),t=!0)),e=i.create("br"),_.insertNode(e),n&&"PRE"==D&&(!R||8>R)&&e.parentNode.insertBefore(i.doc.createTextNode("\r"),e),r=i.create("span",{},"&nbsp;"),e.parentNode.insertBefore(r,e),o.scrollIntoView(r),i.remove(r),t?(_.setStartBefore(e),_.setEndBefore(e)):(_.setStartAfter(e),_.setEndAfter(e)),o.setRng(_),s.add()}function C(e){do 3===e.nodeType&&(e.nodeValue=e.nodeValue.replace(/^[\r\n]+/,"")),e=e.firstChild;while(e)}function x(e){var t=i.getRoot(),n,r;for(n=e;n!==t&&"false"!==i.getContentEditable(n);)"true"===i.getContentEditable(n)&&(r=n),n=n.parentNode;return n!==t?r:t}function w(e){var t;n||(e.normalize(),t=e.lastChild,(!t||/^(left|right)$/gi.test(i.getStyle(t,"float",!0)))&&i.add(e,"br"))}var _=o.getRng(!0),N,E,S,k,T,R,A,B,L,H,D,M,P,O;if(!_.collapsed)return t.execCommand("Delete"),void 0;if(!r.isDefaultPrevented()&&(S=_.startContainer,k=_.startOffset,P=(a.force_p_newlines?"p":"")||a.forced_root_block,P=P?P.toUpperCase():"",R=i.doc.documentMode,A=r.shiftKey,1==S.nodeType&&S.hasChildNodes()&&(O=k>S.childNodes.length-1,S=S.childNodes[Math.min(k,S.childNodes.length-1)]||S,k=O&&3==S.nodeType?S.nodeValue.length:0),E=x(S))){if(s.beforeChange(),!i.isBlock(E)&&E!=i.getRoot())return(!P||A)&&b(),void 0;if((P&&!A||!P&&A)&&(S=g(S,k)),T=i.getParent(S,i.isBlock),H=T?i.getParent(T.parentNode,i.isBlock):null,D=T?T.nodeName.toUpperCase():"",M=H?H.nodeName.toUpperCase():"","LI"!=M||r.ctrlKey||(T=H,D=M),"LI"==D){if(!P&&A)return b(),void 0;if(i.isEmpty(T))return v(),void 0}if("PRE"==D&&a.br_in_pre!==!1){if(!A)return b(),void 0}else if(!P&&!A&&"LI"!=D||P&&A)return b(),void 0;P&&T===t.getBody()||(P=P||"P",m()?(B=/^(H[1-6]|PRE|FIGURE)$/.test(D)&&"HGROUP"!=M?h(P):h(),a.end_container_on_empty_block&&u(H)&&i.isEmpty(T)?B=i.split(H,T):i.insertAfter(B,T),p(B)):m(!0)?(B=T.parentNode.insertBefore(h(),T),d(B),p(T)):(N=_.cloneRange(),N.setEndAfter(T),L=N.extractContents(),C(L),B=L.firstChild,i.insertAfter(L,T),f(B),w(T),p(B)),i.setAttrib(B,"id",""),t.fire("NewBlock",{newBlock:B}),s.add())}}var i=t.dom,o=t.selection,a=t.settings,s=t.undoManager,l=t.schema,c=l.getNonEmptyElements();t.on("keydown",function(e){13==e.keyCode&&r(e)!==!1&&e.preventDefault()})}}),r(M,[],function(){return function(e){function t(){var t=i.getStart(),s=e.getBody(),l,c,u,d,f,p,h,m=-16777215,g,v,y,b,C;if(C=n.forced_root_block,t&&1===t.nodeType&&C){for(;t&&t!=s;){if(a[t.nodeName])return;t=t.parentNode}if(l=i.getRng(),l.setStart){c=l.startContainer,u=l.startOffset,d=l.endContainer,f=l.endOffset;try{v=e.getDoc().activeElement===s}catch(x){}}else l.item&&(t=l.item(0),l=e.getDoc().body.createTextRange(),l.moveToElementText(t)),v=l.parentElement().ownerDocument===e.getDoc(),y=l.duplicate(),y.collapse(!0),u=-1*y.move("character",m),y.collapsed||(y=l.duplicate(),y.collapse(!1),f=-1*y.move("character",m)-u);for(t=s.firstChild,b=s.nodeName.toLowerCase();t;)if((3===t.nodeType||1==t.nodeType&&!a[t.nodeName])&&o.isValidChild(b,C.toLowerCase())){if(3===t.nodeType&&0===t.nodeValue.length){h=t,t=t.nextSibling,r.remove(h);continue}p||(p=r.create(C),t.parentNode.insertBefore(p,t),g=!0),h=t,t=t.nextSibling,p.appendChild(h)}else p=null,t=t.nextSibling;if(g&&v){if(l.setStart)l.setStart(c,u),l.setEnd(d,f),i.setRng(l);else try{l=e.getDoc().body.createTextRange(),l.moveToElementText(s),l.collapse(!0),l.moveStart("character",u),f>0&&l.moveEnd("character",f),l.select()}catch(x){}e.nodeChanged()}}}var n=e.settings,r=e.dom,i=e.selection,o=e.schema,a=o.getBlockElements();n.forced_root_block&&e.on("NodeChange",t)}}),r(P,[E,g,p],function(e,n,r){var i=r.each,o=r.extend,a=r.map,s=r.inArray,l=r.explode,c=n.gecko,u=n.ie,d=!0,f=!1;return function(n){function r(e,t,n){var r;return e=e.toLowerCase(),(r=_.exec[e])?(r(e,t,n),d):f}function p(e){var t;return e=e.toLowerCase(),(t=_.state[e])?t(e):-1}function h(e){var t;return e=e.toLowerCase(),(t=_.value[e])?t(e):f}function m(e,t){t=t||"exec",i(e,function(e,n){i(n.toLowerCase().split(","),function(n){_[t][n]=e})})}function g(e,r,i){return r===t&&(r=f),i===t&&(i=null),n.getDoc().execCommand(e,r,i)}function v(e){return E.match(e)}function y(e,r){E.toggle(e,r?{value:r}:t),n.nodeChanged()}function b(e){S=w.getBookmark(e)}function C(){w.moveToBookmark(S)}var x=n.dom,w=n.selection,_={state:{},exec:{},value:{}},N=n.settings,E=n.formatter,S;o(this,{execCommand:r,queryCommandState:p,queryCommandValue:h,addCommands:m}),m({"mceResetDesignMode,mceBeginUndoLevel":function(){},"mceEndUndoLevel,mceAddUndoLevel":function(){n.undoManager.add()},"Cut,Copy,Paste":function(e){var t=n.getDoc(),r;try{g(e)}catch(i){r=d}(r||!t.queryCommandSupported(e))&&n.windowManager.alert("Your browser doesn't support direct access to the clipboard. Please use the Ctrl+X/C/V keyboard shortcuts instead.")},unlink:function(e){w.isCollapsed()&&w.select(w.getNode()),g(e),w.collapse(f)},"JustifyLeft,JustifyCenter,JustifyRight,JustifyFull":function(e){var t=e.substring(7);"full"==t&&(t="justify"),i("left,center,right,justify".split(","),function(e){t!=e&&E.remove("align"+e)}),y("align"+t),r("mceRepaint")},"InsertUnorderedList,InsertOrderedList":function(e){var t,n;g(e),t=x.getParent(w.getNode(),"ol,ul"),t&&(n=t.parentNode,/^(H[1-6]|P|ADDRESS|PRE)$/.test(n.nodeName)&&(b(),x.split(n,t),C()))},"Bold,Italic,Underline,Strikethrough,Superscript,Subscript":function(e){y(e)},"ForeColor,HiliteColor,FontName":function(e,t,n){y(e,n)},FontSize:function(e,t,n){var r,i;n>=1&&7>=n&&(i=l(N.font_size_style_values),r=l(N.font_size_classes),n=r?r[n-1]||n:i[n-1]||n),y(e,n)},RemoveFormat:function(e){E.remove(e)},mceBlockQuote:function(){y("blockquote")},FormatBlock:function(e,t,n){return y(n||"p")},mceCleanup:function(){var e=w.getBookmark();n.setContent(n.getContent({cleanup:d}),{cleanup:d}),w.moveToBookmark(e)},mceRemoveNode:function(e,t,r){var i=r||w.getNode();i!=n.getBody()&&(b(),n.dom.remove(i,d),C())},mceSelectNodeDepth:function(e,t,r){var i=0;x.getParent(w.getNode(),function(e){return 1==e.nodeType&&i++==r?(w.select(e),f):void 0},n.getBody())},mceSelectNode:function(e,t,n){w.select(n)},mceInsertContent:function(t,r,i){function o(e){function t(e){return r[e]&&3==r[e].nodeType}var n,r,i;return n=w.getRng(!0),r=n.startContainer,i=n.startOffset,3==r.nodeType&&(i>0?e=e.replace(/^&nbsp;/," "):t("previousSibling")||(e=e.replace(/^ /,"&nbsp;")),i<r.length?e=e.replace(/&nbsp;(<br>|)$/," "):t("nextSibling")||(e=e.replace(/(&nbsp;| )(<br>|)$/,"&nbsp;"))),e}var a,s,l,c,d,f,p,h,m,g,v,y,b,C;/^ | $/.test(i)&&(i=o(i)),a=n.parser,s=new e({},n.schema),b='<span id="mce_marker" data-mce-type="bookmark">&#xFEFF;</span>',f={content:i,format:"html",selection:!0},n.fire("BeforeSetContent",f),i=f.content,-1==i.indexOf("{$caret}")&&(i+="{$caret}"),i=i.replace(/\{\$caret\}/,b),w.isCollapsed()||n.getDoc().execCommand("Delete",!1,null),l=w.getNode();var _={context:l.nodeName.toLowerCase()};if(d=a.parse(i,_),v=d.lastChild,"mce_marker"==v.attr("id"))for(p=v,v=v.prev;v;v=v.walk(!0))if(3==v.type||!x.isBlock(v.name)){v.parent.insert(p,v,"br"===v.name);break}if(_.invalid){for(w.setContent(b),l=w.getNode(),c=n.getBody(),9==l.nodeType?l=v=c:v=l;v!==c;)l=v,v=v.parentNode;i=l==c?c.innerHTML:x.getOuterHTML(l),i=s.serialize(a.parse(i.replace(/<span (id="mce_marker"|id=mce_marker).+?<\/span>/i,function(){return s.serialize(d)}))),l==c?x.setHTML(c,i):x.setOuterHTML(l,i)}else i=s.serialize(d),v=l.firstChild,y=l.lastChild,!v||v===y&&"BR"===v.nodeName?x.setHTML(l,i):w.setContent(i);p=x.get("mce_marker"),h=x.getRect(p),m=x.getViewPort(n.getWin()),(h.y+h.h>m.y+m.h||h.y<m.y||h.x>m.x+m.w||h.x<m.x)&&(C=u?n.getDoc().documentElement:n.getBody(),C.scrollLeft=h.x,C.scrollTop=h.y-m.h+25),g=x.createRng(),v=p.previousSibling,v&&3==v.nodeType?(g.setStart(v,v.nodeValue.length),u||(y=p.nextSibling,y&&3==y.nodeType&&(v.appendData(y.data),y.parentNode.removeChild(y)))):(g.setStartBefore(p),g.setEndBefore(p)),x.remove(p),w.setRng(g),n.fire("SetContent",f),n.addVisual()},mceInsertRawHTML:function(e,t,r){w.setContent("tiny_mce_marker"),n.setContent(n.getContent().replace(/tiny_mce_marker/g,function(){return r}))},mceToggleFormat:function(e,t,n){y(n)},mceSetContent:function(e,t,r){n.setContent(r)},"Indent,Outdent":function(e){var t,n,r;t=N.indentation,n=/[a-z%]+$/i.exec(t),t=parseInt(t,10),p("InsertUnorderedList")||p("InsertOrderedList")?g(e):(N.forced_root_block||x.getParent(w.getNode(),x.isBlock)||E.apply("div"),i(w.getSelectedBlocks(),function(i){var o;"LI"!=i.nodeName&&(o="rtl"==x.getStyle(i,"direction",!0)?"paddingRight":"paddingLeft","outdent"==e?(r=Math.max(0,parseInt(i.style[o]||0,10)-t),x.setStyle(i,o,r?r+n:"")):(r=parseInt(i.style[o]||0,10)+t+n,x.setStyle(i,o,r)))}))},mceRepaint:function(){if(c)try{b(d),w.getSel()&&w.getSel().selectAllChildren(n.getBody()),w.collapse(d),C()}catch(e){}},InsertHorizontalRule:function(){n.execCommand("mceInsertContent",!1,"<hr />")},mceToggleVisualAid:function(){n.hasVisual=!n.hasVisual,n.addVisual()},mceReplaceContent:function(e,t,r){n.execCommand("mceInsertContent",!1,r.replace(/\{\$selection\}/g,w.getContent({format:"text"})))},mceInsertLink:function(e,t,n){var r;"string"==typeof n&&(n={href:n}),r=x.getParent(w.getNode(),"a"),n.href=n.href.replace(" ","%20"),r&&n.href||E.remove("link"),n.href&&E.apply("link",n,r)},selectAll:function(){var e=x.getRoot(),t=x.createRng();w.getRng().setStart?(t.setStart(e,0),t.setEnd(e,e.childNodes.length),w.setRng(t)):g("SelectAll")},mceNewDocument:function(){n.setContent("")}}),m({"JustifyLeft,JustifyCenter,JustifyRight,JustifyFull":function(e){var t="align"+e.substring(7),n=w.isCollapsed()?[x.getParent(w.getNode(),x.isBlock)]:w.getSelectedBlocks(),r=a(n,function(e){return!!E.matchNode(e,t)});return-1!==s(r,d)},"Bold,Italic,Underline,Strikethrough,Superscript,Subscript":function(e){return v(e)},mceBlockQuote:function(){return v("blockquote")},Outdent:function(){var e;if(N.inline_styles){if((e=x.getParent(w.getStart(),x.isBlock))&&parseInt(e.style.paddingLeft,10)>0)return d;if((e=x.getParent(w.getEnd(),x.isBlock))&&parseInt(e.style.paddingLeft,10)>0)return d}return p("InsertUnorderedList")||p("InsertOrderedList")||!N.inline_styles&&!!x.getParent(w.getNode(),"BLOCKQUOTE")},"InsertUnorderedList,InsertOrderedList":function(e){var t=x.getParent(w.getNode(),"ul,ol");return t&&("insertunorderedlist"===e&&"UL"===t.tagName||"insertorderedlist"===e&&"OL"===t.tagName)}},"state"),m({"FontSize,FontName":function(e){var t=0,n;return(n=x.getParent(w.getNode(),"span"))&&(t="fontsize"==e?n.style.fontSize:n.style.fontFamily.replace(/, /g,",").replace(/[\'\"]/g,"").toLowerCase()),t}},"value"),m({Undo:function(){n.undoManager.undo()},Redo:function(){n.undoManager.redo()}})}}),r(O,[p],function(e){function t(e,i){var o=this,a,s;return e=r(e),i=o.settings=i||{},/^([\w\-]+):([^\/]{2})/i.test(e)||/^\s*#/.test(e)?(o.source=e,void 0):(0===e.indexOf("/")&&0!==e.indexOf("//")&&(e=(i.base_uri?i.base_uri.protocol||"http":"http")+"://mce_host"+e),/^[\w\-]*:?\/\//.test(e)||(s=i.base_uri?i.base_uri.path:new t(location.href).directory,e=(i.base_uri&&i.base_uri.protocol||"http")+"://mce_host"+o.toAbsPath(s,e)),e=e.replace(/@@/g,"(mce_at)"),e=/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(e),n(["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],function(t,n){var r=e[n];r&&(r=r.replace(/\(mce_at\)/g,"@@")),o[t]=r}),a=i.base_uri,a&&(o.protocol||(o.protocol=a.protocol),o.userInfo||(o.userInfo=a.userInfo),o.port||"mce_host"!==o.host||(o.port=a.port),o.host&&"mce_host"!==o.host||(o.host=a.host),o.source=""),void 0)}var n=e.each,r=e.trim;return t.prototype={setPath:function(e){var t=this;e=/^(.*?)\/?(\w+)?$/.exec(e),t.path=e[0],t.directory=e[1],t.file=e[2],t.source="",t.getURI()},toRelative:function(e){var n=this,r;if("./"===e)return e;if(e=new t(e,{base_uri:n}),"mce_host"!=e.host&&n.host!=e.host&&e.host||n.port!=e.port||n.protocol!=e.protocol)return e.getURI();var i=n.getURI(),o=e.getURI();return i==o||"/"==i.charAt(i.length-1)&&i.substr(0,i.length-1)==o?i:(r=n.toRelPath(n.path,e.path),e.query&&(r+="?"+e.query),e.anchor&&(r+="#"+e.anchor),r)},toAbsolute:function(e,n){return e=new t(e,{base_uri:this}),e.getURI(this.host==e.host&&this.protocol==e.protocol?n:0)},toRelPath:function(e,t){var n,r=0,i="",o,a;if(e=e.substring(0,e.lastIndexOf("/")),e=e.split("/"),n=t.split("/"),e.length>=n.length)for(o=0,a=e.length;a>o;o++)if(o>=n.length||e[o]!=n[o]){r=o+1;break}if(e.length<n.length)for(o=0,a=n.length;a>o;o++)if(o>=e.length||e[o]!=n[o]){r=o+1;break}if(1===r)return t;for(o=0,a=e.length-(r-1);a>o;o++)i+="../";for(o=r-1,a=n.length;a>o;o++)i+=o!=r-1?"/"+n[o]:n[o];return i},toAbsPath:function(e,t){var r,i=0,o=[],a,s;for(a=/\/$/.test(t)?"/":"",e=e.split("/"),t=t.split("/"),n(e,function(e){e&&o.push(e)}),e=o,r=t.length-1,o=[];r>=0;r--)0!==t[r].length&&"."!==t[r]&&(".."!==t[r]?i>0?i--:o.push(t[r]):i++);return r=e.length-i,s=0>=r?o.reverse().join("/"):e.slice(0,r).join("/")+"/"+o.reverse().join("/"),0!==s.indexOf("/")&&(s="/"+s),a&&s.lastIndexOf("/")!==s.length-1&&(s+=a),s},getURI:function(e){var t,n=this;return(!n.source||e)&&(t="",e||(n.protocol&&(t+=n.protocol+"://"),n.userInfo&&(t+=n.userInfo+"@"),n.host&&(t+=n.host),n.port&&(t+=":"+n.port)),n.path&&(t+=n.path),n.query&&(t+="?"+n.query),n.anchor&&(t+="#"+n.anchor),n.source=t),n.source}},t}),r(I,[p],function(e){function t(){}var n=e.each,r=e.extend,i,o;return t.extend=i=function(e){function t(){var e,t,n,r;if(!o&&(r=this,r.init&&r.init.apply(r,arguments),t=r.Mixins))for(e=t.length;e--;)n=t[e],n.init&&n.init.apply(r,arguments)}function a(){return this}function s(e,t){return function(){var n=this,r=n._super,i;return n._super=c[e],i=t.apply(n,arguments),n._super=r,i}}var l=this,c=l.prototype,u,d,f;o=!0,u=new l,o=!1,e.Mixins&&(n(e.Mixins,function(t){t=t;for(var n in t)"init"!==n&&(e[n]=t[n])}),c.Mixins&&(e.Mixins=c.Mixins.concat(e.Mixins))),e.Methods&&n(e.Methods.split(","),function(t){e[t]=a}),e.Properties&&n(e.Properties.split(","),function(t){var n="_"+t;e[t]=function(e){var t=this,r;return e!==r?(t[n]=e,t):t[n]}}),e.Statics&&n(e.Statics,function(e,n){t[n]=e}),e.Defaults&&c.Defaults&&(e.Defaults=r({},c.Defaults,e.Defaults));for(d in e)f=e[d],u[d]="function"==typeof f&&c[d]?s(d,f):f;return t.prototype=u,t.constructor=t,t.extend=i,t},t}),r(F,[I,p],function(e,t){function n(e){for(var t=[],n=e.length,r;n--;)r=e[n],r.__checked||(t.push(r),r.__checked=1);for(n=t.length;n--;)delete t[n].__checked;return t}var r=/^([\w\\*]+)?(?:#([\w\\]+))?(?:\.([\w\\\.]+))?(?:\[\@?([\w\\]+)([\^\$\*!~]?=)([\w\\]+)\])?(?:\:(.+))?/i,i=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,o=/^\s*|\s*$/g,a,s=e.extend({init:function(e){function t(e){return e?(e=e.toLowerCase(),function(t){return"*"===e||t.type===e}):void 0}function n(e){return e?function(t){return t._name===e}:void 0}function a(e){return e?(e=e.split("."),function(t){for(var n=e.length;n--;)if(!t.hasClass(e[n]))return!1;return!0}):void 0}function s(e,t,n){return e?function(r){var i=r[e]?r[e]():"";return t?"="===t?i===n:"*="===t?i.indexOf(n)>=0:"~="===t?(" "+i+" ").indexOf(" "+n+" ")>=0:"!="===t?i!=n:"^="===t?0===i.indexOf(n):"$="===t?i.substr(i.length-n.length)===n:!1:!!n}:void 0}function l(e){var t;return e?(e=/(?:not\((.+)\))|(.+)/i.exec(e),e[1]?(t=u(e[1],[]),function(e){return!d(e,t)}):(e=e[2],function(t,n,r){return"first"===e?0===n:"last"===e?n===r-1:"even"===e?0===n%2:"odd"===e?1===n%2:t[e]?t[e]():!1})):void 0}function c(e,i,c){function u(e){e&&i.push(e)}var d;return d=r.exec(e.replace(o,"")),u(t(d[1])),u(n(d[2])),u(a(d[3])),u(s(d[4],d[5],d[6])),u(l(d[7])),i.psuedo=!!d[7],i.direct=c,i}function u(e,t){var n=[],r,o,a;do if(i.exec(""),o=i.exec(e),o&&(e=o[3],n.push(o[1]),o[2])){r=o[3];break}while(o);for(r&&u(r,t),e=[],a=0;a<n.length;a++)">"!=n[a]&&e.push(c(n[a],[],">"===n[a-1]));return t.push(e),t}var d=this.match;this._selectors=u(e,[])},match:function(e,n){var r,i,o,a,s,l,c,u,d,f,p,h,m;for(n=n||this._selectors,r=0,i=n.length;i>r;r++){for(s=n[r],a=s.length,m=e,h=0,o=a-1;o>=0;o--)for(u=s[o];m;){for(u.psuedo&&(p=m.parent().items(),d=t.inArray(m,p),f=p.length),l=0,c=u.length;c>l;l++)if(!u[l](m,d,f)){l=c+1;break}if(l===c){h++;break}if(o===a-1)break;m=m.parent()}if(h===a)return!0}return!1},find:function(e){function t(e,n,i){var o,a,s,l,c,u=n[i];for(o=0,a=e.length;a>o;o++){for(c=e[o],s=0,l=u.length;l>s;s++)if(!u[s](c,o,a)){s=l+1;break}if(s===l)i==n.length-1?r.push(c):c.items&&t(c.items(),n,i+1);else if(u.direct)return;c.items&&t(c.items(),n,i)}}var r=[],i,o,l=this._selectors;if(e.items){for(i=0,o=l.length;o>i;i++)t(e.items(),l[i],0);o>1&&(r=n(r))}return a||(a=s.Collection),new a(r)}});return s}),r(z,[p,F,I],function(e,t,n){var r,i,o=Array.prototype.push,a=Array.prototype.slice;return i={length:0,init:function(e){e&&this.add(e)
},add:function(t){var n=this;return e.isArray(t)?o.apply(n,t):t instanceof r?n.add(t.toArray()):o.call(n,t),n},set:function(e){var t=this,n=t.length,r;for(t.length=0,t.add(e),r=t.length;n>r;r++)delete t[r];return t},filter:function(e){var n=this,i,o,a=[],s,l;for("string"==typeof e?(e=new t(e),l=function(t){return e.match(t)}):l=e,i=0,o=n.length;o>i;i++)s=n[i],l(s)&&a.push(s);return new r(a)},slice:function(){return new r(a.apply(this,arguments))},eq:function(e){return-1===e?this.slice(e):this.slice(e,+e+1)},each:function(t){return e.each(this,t),this},toArray:function(){return e.toArray(this)},indexOf:function(e){for(var t=this,n=t.length;n--&&t[n]!==e;);return n},reverse:function(){return new r(e.toArray(this).reverse())},hasClass:function(e){return this[0]?this[0].hasClass(e):!1},prop:function(e,t){var n=this,r,i;return t!==r?(n.each(function(n){n[e]&&n[e](t)}),n):(i=n[0],i&&i[e]?i[e]():void 0)},exec:function(t){var n=this,r=e.toArray(arguments).slice(1);return n.each(function(e){e[t]&&e[t].apply(e,r)}),n},remove:function(){for(var e=this.length;e--;)this[e].remove();return this}},e.each("fire on off show hide addClass removeClass append prepend before after reflow".split(" "),function(t){i[t]=function(){var n=e.toArray(arguments);return this.each(function(e){t in e&&e[t].apply(e,n)}),this}}),e.each("text name disabled active selected checked visible parent value data".split(" "),function(e){i[e]=function(t){return this.prop(e,t)}}),r=n.extend(i),t.Collection=r,r}),r(W,[p,v],function(e,t){return{id:function(){return t.DOM.uniqueId()},createFragment:function(e){return t.DOM.createFragment(e)},getWindowSize:function(){return t.DOM.getViewPort()},getSize:function(e){var t,n;if(e.getBoundingClientRect){var r=e.getBoundingClientRect();t=Math.max(r.width||r.right-r.left,e.offsetWidth),n=Math.max(r.height||r.bottom-r.bottom,e.offsetHeight)}else t=e.offsetWidth,n=e.offsetHeight;return{width:t,height:n}},getPos:function(e,n){return t.DOM.getPos(e,n)},getViewPort:function(e){return t.DOM.getViewPort(e)},get:function(e){return document.getElementById(e)},addClass:function(e,n){return t.DOM.addClass(e,n)},removeClass:function(e,n){return t.DOM.removeClass(e,n)},hasClass:function(e,n){return t.DOM.hasClass(e,n)},toggleClass:function(e,n,r){return t.DOM.toggleClass(e,n,r)},css:function(e,n,r){return t.DOM.setStyle(e,n,r)},on:function(e,n,r,i){return t.DOM.bind(e,n,r,i)},off:function(e,n,r){return t.DOM.unbind(e,n,r)},fire:function(e,n,r){return t.DOM.fire(e,n,r)},innerHtml:function(e,n){t.DOM.setHTML(e,n)}}}),r(V,[I,p,z,W],function(e,t,n,r){var i=t.makeMap("focusin focusout scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave wheel keydown keypress keyup contextmenu"," "),o={},a="onmousewheel"in document,s=!1,l=e.extend({Statics:{controlIdLookup:{}},isRtl:function(){return l.rtl},classPrefix:"mce-",init:function(e){var n=this,i,o;if(n.settings=e=t.extend({},n.Defaults,e),n._id=r.id(),n._text=n._name="",n._width=n._height=0,n._aria={role:e.role},i=e.classes)for(i=i.split(" "),i.map={},o=i.length;o--;)i.map[i[o]]=!0;n._classes=i||[],n.visible(!0),t.each("title text width height name classes visible disabled active value".split(" "),function(t){var r=e[t],i;r!==i?n[t](r):n["_"+t]===i&&(n["_"+t]=!1)}),n.on("click",function(){return n.disabled()?!1:void 0}),e.classes&&t.each(e.classes.split(" "),function(e){n.addClass(e)}),n.settings=e,n._borderBox=n.parseBox(e.border),n._paddingBox=n.parseBox(e.padding),n._marginBox=n.parseBox(e.margin),e.hidden&&n.hide()},Properties:"parent,title,text,width,height,disabled,active,name,value",Methods:"renderHtml",getContainerElm:function(){return document.body},getParentCtrl:function(e){for(var t;e&&!(t=l.controlIdLookup[e.id]);)e=e.parentNode;return t},parseBox:function(e){var t,n=10;if(e)return"number"==typeof e?(e=e||0,{top:e,left:e,bottom:e,right:e}):(e=e.split(" "),t=e.length,1===t?e[1]=e[2]=e[3]=e[0]:2===t?(e[2]=e[0],e[3]=e[1]):3===t&&(e[3]=e[1]),{top:parseInt(e[0],n)||0,right:parseInt(e[1],n)||0,bottom:parseInt(e[2],n)||0,left:parseInt(e[3],n)||0})},borderBox:function(){return this._borderBox},paddingBox:function(){return this._paddingBox},marginBox:function(){return this._marginBox},measureBox:function(e,t){function n(t){var n=document.defaultView;return n?(t=t.replace(/[A-Z]/g,function(e){return"-"+e}),n.getComputedStyle(e,null).getPropertyValue(t)):e.currentStyle[t]}function r(e){var t=parseFloat(n(e),10);return isNaN(t)?0:t}return{top:r(t+"TopWidth"),right:r(t+"RightWidth"),bottom:r(t+"BottomWidth"),left:r(t+"LeftWidth")}},initLayoutRect:function(){var e=this,t=e.settings,n,i,o=e.getEl(),a,s,l,c,u,d,f,p;n=e._borderBox=e._borderBox||e.measureBox(o,"border"),e._paddingBox=e._paddingBox||e.measureBox(o,"padding"),e._marginBox=e._marginBox||e.measureBox(o,"margin"),p=r.getSize(o),d=t.minWidth,f=t.minHeight,l=d||p.width,c=f||p.height,a=t.width,s=t.height,u=t.autoResize,u="undefined"!=typeof u?u:!a&&!s,a=a||l,s=s||c;var h=n.left+n.right,m=n.top+n.bottom,g=t.maxWidth||65535,v=t.maxHeight||65535;return e._layoutRect=i={x:t.x||0,y:t.y||0,w:a,h:s,deltaW:h,deltaH:m,contentW:a-h,contentH:s-m,innerW:a-h,innerH:s-m,startMinWidth:d||0,startMinHeight:f||0,minW:Math.min(l,g),minH:Math.min(c,v),maxW:g,maxH:v,autoResize:u,scrollW:0},e._lastLayoutRect={},i},layoutRect:function(e){var t=this,n=t._layoutRect,r,i,o,a,s,c;return n||(n=t.initLayoutRect()),e?(o=n.deltaW,a=n.deltaH,e.x!==s&&(n.x=e.x),e.y!==s&&(n.y=e.y),e.minW!==s&&(n.minW=e.minW),e.minH!==s&&(n.minH=e.minH),i=e.w,i!==s&&(i=i<n.minW?n.minW:i,i=i>n.maxW?n.maxW:i,n.w=i,n.innerW=i-o),i=e.h,i!==s&&(i=i<n.minH?n.minH:i,i=i>n.maxH?n.maxH:i,n.h=i,n.innerH=i-a),i=e.innerW,i!==s&&(i=i<n.minW-o?n.minW-o:i,i=i>n.maxW-o?n.maxW-o:i,n.innerW=i,n.w=i+o),i=e.innerH,i!==s&&(i=i<n.minH-a?n.minH-a:i,i=i>n.maxH-a?n.maxH-a:i,n.innerH=i,n.h=i+a),e.contentW!==s&&(n.contentW=e.contentW),e.contentH!==s&&(n.contentH=e.contentH),r=t._lastLayoutRect,(r.x!==n.x||r.y!==n.y||r.w!==n.w||r.h!==n.h)&&(c=l.repaintControls,c&&c.map&&!c.map[t._id]&&(c.push(t),c.map[t._id]=!0),r.x=n.x,r.y=n.y,r.w=n.w,r.h=n.h),t):n},repaint:function(){var e=this,t,n,r,i,o=0,a=0,s;t=e.getEl().style,r=e._layoutRect,s=e._lastRepaintRect||{},i=e._borderBox,o=i.left+i.right,a=i.top+i.bottom,r.x!==s.x&&(t.left=r.x+"px",s.x=r.x),r.y!==s.y&&(t.top=r.y+"px",s.y=r.y),r.w!==s.w&&(t.width=r.w-o+"px",s.w=r.w),r.h!==s.h&&(t.height=r.h-a+"px",s.h=r.h),e._hasBody&&r.innerW!==s.innerW&&(n=e.getEl("body").style,n.width=r.innerW+"px",s.innerW=r.innerW),e._hasBody&&r.innerH!==s.innerH&&(n=n||e.getEl("body").style,n.height=r.innerH+"px",s.innerH=r.innerH),e._lastRepaintRect=s,e.fire("repaint",{},!1)},on:function(e,t){function n(e){var t,n;return function(i){return t||r.parents().each(function(r){var i=r.settings.callbacks;return i&&(t=i[e])?(n=r,!1):void 0}),t.call(n,i)}}var r=this,o,a,s,l;if(t)for("string"==typeof t&&(t=n(t)),s=e.toLowerCase().split(" "),l=s.length;l--;)e=s[l],o=r._bindings,o||(o=r._bindings={}),a=o[e],a||(a=o[e]=[]),a.push(t),i[e]&&(r._nativeEvents?r._nativeEvents[e]=!0:r._nativeEvents={name:!0},r._rendered&&r.bindPendingEvents());return r},off:function(e,t){var n=this,r,i=n._bindings,o,a,s,l;if(i)if(e)for(s=e.toLowerCase().split(" "),r=s.length;r--;){if(e=s[r],o=i[e],!e){for(a in i)i[a].length=0;return n}if(o)if(t)for(l=o.length;l--;)o[l]===t&&o.splice(l,1);else o.length=0}else n._bindings=[];return n},fire:function(e,t,n){function r(){return!1}function i(){return!0}var o=this,a,s,l,c;if(e=e.toLowerCase(),t=t||{},t.type||(t.type=e),t.control||(t.control=o),t.preventDefault||(t.preventDefault=function(){t.isDefaultPrevented=i},t.stopPropagation=function(){t.isPropagationStopped=i},t.stopImmediatePropagation=function(){t.isImmediatePropagationStopped=i},t.isDefaultPrevented=r,t.isPropagationStopped=r,t.isImmediatePropagationStopped=r),o._bindings&&(l=o._bindings[e]))for(a=0,s=l.length;s>a&&(t.isImmediatePropagationStopped()||l[a].call(o,t)!==!1);a++);if(n!==!1)for(c=o.parent();c&&!t.isPropagationStopped();)c.fire(e,t,!1),c=c.parent();return t},hasEventListeners:function(e){return e in this._bindings},parents:function(e){var t=this,r=new n;for(t=t.parent();t;t=t.parent())r.add(t);return e&&(r=r.filter(e)),r},next:function(){var e=this.parent().items();return e[e.indexOf(this)+1]},prev:function(){var e=this.parent().items();return e[e.indexOf(this)-1]},findCommonAncestor:function(e,t){for(var n;e;){for(n=t;n&&e!=n;)n=n.parent();if(e==n)break;e=e.parent()}return e},hasClass:function(e,t){var n=this._classes[t||"control"];return e=this.classPrefix+e,n&&!!n.map[e]},addClass:function(e,t){var n=this,r,i;return e=this.classPrefix+e,r=n._classes[t||"control"],r||(r=[],r.map={},n._classes[t||"control"]=r),r.map[e]||(r.map[e]=e,r.push(e),n._rendered&&(i=n.getEl(t),i&&(i.className=r.join(" ")))),n},removeClass:function(e,t){var n=this,r,i,o;if(e=this.classPrefix+e,r=n._classes[t||"control"],r&&r.map[e])for(delete r.map[e],i=r.length;i--;)r[i]===e&&r.splice(i,1);return n._rendered&&(o=n.getEl(t),o&&(o.className=r.join(" "))),n},toggleClass:function(e,t,n){var r=this;return t?r.addClass(e,n):r.removeClass(e,n),r},classes:function(e){var t=this._classes[e||"control"];return t?t.join(" "):""},innerHtml:function(e){return r.innerHtml(this.getEl(),e),this},getEl:function(e,t){var n,i=e?this._id+"-"+e:this._id;return n=o[i]=(t===!0?null:o[i])||r.get(i)},visible:function(e){var t=this,n;return"undefined"!=typeof e?(t._visible!==e&&(t._rendered&&(t.getEl().style.display=e?"":"none"),t._visible=e,n=t.parent(),n&&(n._lastRect=null),t.fire(e?"show":"hide")),t):t._visible},show:function(){return this.visible(!0)},hide:function(){return this.visible(!1)},focus:function(){try{this.getEl().focus()}catch(e){}return this},blur:function(){return this.getEl().blur(),this},aria:function(e,t){var n=this,r=n.getEl();return"undefined"==typeof t?n._aria[e]:(n._aria[e]=t,n._rendered&&("label"==e&&r.setAttribute("aria-labeledby",n._id),r.setAttribute("role"==e?e:"aria-"+e,t)),n)},encode:function(e,t){return t!==!1&&l.translate&&(e=l.translate(e)),(e||"").replace(/[&<>"]/g,function(e){return"&#"+e.charCodeAt(0)+";"})},before:function(e){var t=this,n=t.parent();return n&&n.insert(e,n.items().indexOf(t),!0),t},after:function(e){var t=this,n=t.parent();return n&&n.insert(e,n.items().indexOf(t)),t},remove:function(){var e=this,t=e.getEl(),n=e.parent(),i,a;if(e.items){var s=e.items().toArray();for(a=s.length;a--;)s[a].remove()}if(n&&n.items&&(i=[],n.items().each(function(t){t!==e&&i.push(t)}),n.items().set(i),n._lastRect=null),e._eventsRoot&&e._eventsRoot==e&&r.off(t),delete l.controlIdLookup[e._id],delete o[e._id],t&&t.parentNode){var c=t.getElementsByTagName("*");for(a=c.length;a--;)delete o[c[a].id];t.parentNode.removeChild(t)}return e},renderBefore:function(e){var t=this;return e.parentNode.insertBefore(r.createFragment(t.renderHtml()),e),t.postRender(),t},renderTo:function(e){var t=this;return e=e||t.getContainerElm(),e.appendChild(r.createFragment(t.renderHtml())),t.postRender(),t},postRender:function(){var e=this,t=e.settings,n,i,o,a,s;for(a in t)0===a.indexOf("on")&&e.on(a.substr(2),t[a]);if(e._eventsRoot){for(o=e.parent();!s&&o;o=o.parent())s=o._eventsRoot;if(s)for(a in s._nativeEvents)e._nativeEvents[a]=!0}e.bindPendingEvents(),t.style&&(n=e.getEl(),n&&(n.setAttribute("style",t.style),n.style.cssText=t.style)),e._visible||r.css(e.getEl(),"display","none"),e.settings.border&&(i=e.borderBox(),r.css(e.getEl(),{"border-top-width":i.top,"border-right-width":i.right,"border-bottom-width":i.bottom,"border-left-width":i.left})),l.controlIdLookup[e._id]=e;for(var c in e._aria)e.aria(c,e._aria[c]);e.fire("postrender",{},!1)},scrollIntoView:function(e){function t(e,t){var n,r,i=e;for(n=r=0;i&&i!=t&&i.nodeType;)n+=i.offsetLeft||0,r+=i.offsetTop||0,i=i.offsetParent;return{x:n,y:r}}var n=this.getEl(),r=n.parentNode,i,o,a,s,l,c,u=t(n,r);return i=u.x,o=u.y,a=n.offsetWidth,s=n.offsetHeight,l=r.clientWidth,c=r.clientHeight,"end"==e?(i-=l-a,o-=c-s):"center"==e&&(i-=l/2-a/2,o-=c/2-s/2),r.scrollLeft=i,r.scrollTop=o,this},bindPendingEvents:function(){function e(e){var t=o.getParentCtrl(e.target);t&&t.fire(e.type,e)}function t(){var e=d._lastHoverCtrl;e&&(e.fire("mouseleave",{target:e.getEl()}),e.parents().each(function(e){e.fire("mouseleave",{target:e.getEl()})}),d._lastHoverCtrl=null)}function n(e){var t=o.getParentCtrl(e.target),n=d._lastHoverCtrl,r=0,i,a,s;if(t!==n){if(d._lastHoverCtrl=t,a=t.parents().toArray().reverse(),a.push(t),n){for(s=n.parents().toArray().reverse(),s.push(n),r=0;r<s.length&&a[r]===s[r];r++);for(i=s.length-1;i>=r;i--)n=s[i],n.fire("mouseleave",{target:n.getEl()})}for(i=r;i<a.length;i++)t=a[i],t.fire("mouseenter",{target:t.getEl()})}}function i(e){e.preventDefault(),"mousewheel"==e.type?(e.deltaY=-1/40*e.wheelDelta,e.wheelDeltaX&&(e.deltaX=-1/40*e.wheelDeltaX)):(e.deltaX=0,e.deltaY=e.detail),e=o.fire("wheel",e)}var o=this,l,c,u,d,f,p;if(o._rendered=!0,f=o._nativeEvents){for(u=o.parents().toArray(),u.unshift(o),l=0,c=u.length;!d&&c>l;l++)d=u[l]._eventsRoot;for(d||(d=u[u.length-1]||o),o._eventsRoot=d,c=l,l=0;c>l;l++)u[l]._eventsRoot=d;for(p in f){if(!f)return!1;"wheel"!==p||s?("mouseenter"===p||"mouseleave"===p?d._hasMouseEnter||(r.on(d.getEl(),"mouseleave",t),r.on(d.getEl(),"mouseover",n),d._hasMouseEnter=1):d[p]||(r.on(d.getEl(),p,e),d[p]=!0),f[p]=!1):a?r.on(o.getEl(),"mousewheel",i):r.on(o.getEl(),"DOMMouseScroll",i)}}},reflow:function(){return this.repaint(),this}});return l}),r(U,[],function(){var e={},t;return{add:function(t,n){e[t.toLowerCase()]=n},has:function(t){return!!e[t.toLowerCase()]},create:function(n,r){var i,o,a;if(!t){a=tinymce.ui;for(o in a)e[o.toLowerCase()]=a[o];t=!0}if("string"==typeof n?(r=r||{},r.type=n):(r=n,n=r.type),n=n.toLowerCase(),i=e[n],!i)throw new Error("Could not find control by type: "+n);return i=new i(r),i.type=n,i}}}),r(q,[V,z,F,U,p,W],function(e,t,n,r,i,o){var a={};return e.extend({layout:"",innerClass:"container-inner",init:function(e){var n=this;n._super(e),e=n.settings,n._fixed=e.fixed,n._items=new t,n.isRtl()&&n.addClass("rtl"),n.addClass("container"),n.addClass("container-body","body"),e.containerCls&&n.addClass(e.containerCls),n._layout=r.create((e.layout||n.layout)+"layout"),n.settings.items&&n.add(n.settings.items),n._hasBody=!0},items:function(){return this._items},find:function(e){return e=a[e]=a[e]||new n(e),e.find(this)},add:function(e){var t=this;return t.items().add(t.create(e)).parent(t),t},focus:function(){var e=this;return e.keyNav?e.keyNav.focusFirst():e._super(),e},replace:function(e,t){for(var n,r=this.items(),i=r.length;i--;)if(r[i]===e){r[i]=t;break}i>=0&&(n=t.getEl(),n&&n.parentNode.removeChild(n),n=e.getEl(),n&&n.parentNode.removeChild(n)),t.parent(this)},create:function(t){var n=this,o,a=[];return i.isArray(t)||(t=[t]),i.each(t,function(t){t&&(t instanceof e||("string"==typeof t&&(t={type:t}),o=i.extend({},n.settings.defaults,t),t.type=o.type=o.type||t.type||n.settings.defaultType||(o.defaults?o.defaults.type:null),t=r.create(o)),a.push(t))}),a},renderNew:function(){var e=this;return e.items().each(function(t,n){var r,i;t.parent(e),t._rendered||(r=e.getEl("body"),i=o.createFragment(t.renderHtml()),r.hasChildNodes()&&n<=r.childNodes.length-1?r.insertBefore(i,r.childNodes[n]):r.appendChild(i),t.postRender())}),e._layout.applyClasses(e),e._lastRect=null,e},append:function(e){return this.add(e).renderNew()},prepend:function(e){var t=this;return t.items().set(t.create(e).concat(t.items().toArray())),t.renderNew()},insert:function(e,t,n){var r=this,i,o,a;return e=r.create(e),i=r.items(),!n&&t<i.length-1&&(t+=1),t>=0&&t<i.length&&(o=i.slice(0,t).toArray(),a=i.slice(t).toArray(),i.set(o.concat(e,a))),r.renderNew()},fromJSON:function(e){var t=this;for(var n in e)t.find("#"+n).value(e[n]);return t},toJSON:function(){var e=this,t={};return e.find("*").each(function(e){var n=e.name(),r=e.value();n&&"undefined"!=typeof r&&(t[n]=r)}),t},preRender:function(){},renderHtml:function(){var e=this,t=e._layout;return e.preRender(),t.preRender(e),'<div id="'+e._id+'" class="'+e.classes()+'" role="'+this.settings.role+'">'+'<div id="'+e._id+'-body" class="'+e.classes("body")+'">'+(e.settings.html||"")+t.renderHtml(e)+"</div>"+"</div>"},postRender:function(){var e=this,t;return e.items().exec("postRender"),e._super(),e._layout.postRender(e),e._rendered=!0,e.settings.style&&o.css(e.getEl(),e.settings.style),e.settings.border&&(t=e.borderBox(),o.css(e.getEl(),{"border-top-width":t.top,"border-right-width":t.right,"border-bottom-width":t.bottom,"border-left-width":t.left})),e},initLayoutRect:function(){var e=this,t=e._super();return e._layout.recalc(e),t},recalc:function(){var e=this,t=e._layoutRect,n=e._lastRect;return n&&n.w==t.w&&n.h==t.h?void 0:(e._layout.recalc(e),t=e.layoutRect(),e._lastRect={x:t.x,y:t.y,w:t.w,h:t.h},!0)},reflow:function(){var t,n;if(this.visible()){for(e.repaintControls=[],e.repaintControls.map={},n=this.recalc(),t=e.repaintControls.length;t--;)e.repaintControls[t].repaint();"flow"!==this.settings.layout&&"stack"!==this.settings.layout&&this.repaint(),e.repaintControls=[]}return this}})}),r(j,[W],function(e){function t(){var e=document,t,n,r,i,o,a,s,l,c=Math.max;return t=e.documentElement,n=e.body,r=c(t.scrollWidth,n.scrollWidth),i=c(t.clientWidth,n.clientWidth),o=c(t.offsetWidth,n.offsetWidth),a=c(t.scrollHeight,n.scrollHeight),s=c(t.clientHeight,n.clientHeight),l=c(t.offsetHeight,n.offsetHeight),{width:o>r?i:r,height:l>a?s:a}}return function(n,r){function i(){return a.getElementById(r.handle||n)}var o,a=document,s,l,c,u,d,f;r=r||{},l=function(n){var l=t(),p,h;n.preventDefault(),s=n.button,p=i(),d=n.screenX,f=n.screenY,h=window.getComputedStyle?window.getComputedStyle(p,null).getPropertyValue("cursor"):p.runtimeStyle.cursor,o=a.createElement("div"),e.css(o,{position:"absolute",top:0,left:0,width:l.width,height:l.height,zIndex:2147483647,opacity:1e-4,background:"red",cursor:h}),a.body.appendChild(o),e.on(a,"mousemove",u),e.on(a,"mouseup",c),r.start(n)},u=function(e){return e.button!==s?c(e):(e.deltaX=e.screenX-d,e.deltaY=e.screenY-f,e.preventDefault(),r.drag(e),void 0)},c=function(t){e.off(a,"mousemove",u),e.off(a,"mouseup",c),o.parentNode.removeChild(o),r.stop&&r.stop(t)},this.destroy=function(){e.off(i())},e.on(i(),"mousedown",l)}}),r($,[W,j],function(e,t){return{init:function(){var e=this;e.on("repaint",e.renderScroll)},renderScroll:function(){function n(){function t(t,a,s,l,c,u){var d,f,p,h,m,g,v,y,b;if(f=i.getEl("scroll"+t)){if(y=a.toLowerCase(),b=s.toLowerCase(),i.getEl("absend")&&e.css(i.getEl("absend"),y,i.layoutRect()[l]-1),!c)return e.css(f,"display","none"),void 0;e.css(f,"display","block"),d=i.getEl("body"),p=i.getEl("scroll"+t+"t"),h=d["client"+s]-2*o,h-=n&&r?f["client"+u]:0,m=d["scroll"+s],g=h/m,v={},v[y]=d["offset"+a]+o,v[b]=h,e.css(f,v),v={},v[y]=d["scroll"+a]*g,v[b]=h*g,e.css(p,v)}}var n,r,a;a=i.getEl("body"),n=a.scrollWidth>a.clientWidth,r=a.scrollHeight>a.clientHeight,t("h","Left","Width","contentW",n,"Height"),t("v","Top","Height","contentH",r,"Width")}function r(){function n(n,r,a,s,l){var c,u=i._id+"-scroll"+n,d=i.classPrefix;i.getEl().appendChild(e.createFragment('<div id="'+u+'" class="'+d+"scrollbar "+d+"scrollbar-"+n+'">'+'<div id="'+u+'t" class="'+d+'scrollbar-thumb"></div>'+"</div>")),i.draghelper=new t(u+"t",{start:function(){c=i.getEl("body")["scroll"+r],e.addClass(e.get(u),d+"active")},drag:function(e){var t,u,d,f,p=i.layoutRect();u=p.contentW>p.innerW,d=p.contentH>p.innerH,f=i.getEl("body")["client"+a]-2*o,f-=u&&d?i.getEl("scroll"+n)["client"+l]:0,t=f/i.getEl("body")["scroll"+a],i.getEl("body")["scroll"+r]=c+e["delta"+s]/t},stop:function(){e.removeClass(e.get(u),d+"active")}})}i.addClass("scroll"),n("v","Top","Height","Y","Width"),n("h","Left","Width","X","Height")}var i=this,o=2;i.settings.autoScroll&&(i._hasScroll||(i._hasScroll=!0,r(),i.on("wheel",function(e){var t=i.getEl("body");t.scrollLeft+=10*(e.deltaX||0),t.scrollTop+=10*e.deltaY,n()}),e.on(i.getEl("body"),"scroll",n)),n())}}}),r(K,[q,$],function(e,t){return e.extend({Defaults:{layout:"fit",containerCls:"panel"},Mixins:[t],renderHtml:function(){var e=this,t=e._layout,n=e.settings.html;return e.preRender(),t.preRender(e),"undefined"==typeof n?n='<div id="'+e._id+'-body" class="'+e.classes("body")+'">'+t.renderHtml(e)+"</div>":("function"==typeof n&&(n=n.call(e)),e._hasBody=!1),'<div id="'+e._id+'" class="'+e.classes()+'" hideFocus="1" tabIndex="-1">'+(e._preBodyHtml||"")+n+"</div>"}})}),r(G,[W],function(e){function t(t,n,r){var i,o,a,s,l,c,u,d,f,p;return f=e.getViewPort(),o=e.getPos(n),a=o.x,s=o.y,t._fixed&&(a-=f.x,s-=f.y),i=t.getEl(),p=e.getSize(i),l=p.width,c=p.height,p=e.getSize(n),u=p.width,d=p.height,r=(r||"").split(""),"b"===r[0]&&(s+=d),"r"===r[1]&&(a+=u),"c"===r[0]&&(s+=Math.round(d/2)),"c"===r[1]&&(a+=Math.round(u/2)),"b"===r[3]&&(s-=c),"r"===r[4]&&(a-=l),"c"===r[3]&&(s-=Math.round(c/2)),"c"===r[4]&&(a-=Math.round(l/2)),{x:a,y:s,w:l,h:c}}return{testMoveRel:function(n,r){for(var i=e.getViewPort(),o=0;o<r.length;o++){var a=t(this,n,r[o]);if(this._fixed){if(a.x>0&&a.x+a.w<i.w&&a.y>0&&a.y+a.h<i.h)return r[o]}else if(a.x>i.x&&a.x+a.w<i.w+i.x&&a.y>i.y&&a.y+a.h<i.h+i.y)return r[o]}return r[0]},moveRel:function(e,n){"string"!=typeof n&&(n=this.testMoveRel(e,n));var r=t(this,e,n);return this.moveTo(r.x,r.y)},moveBy:function(e,t){var n=this,r=n.layoutRect();return n.moveTo(r.x+e,r.y+t),n},moveTo:function(t,n){function r(e,t,n){return 0>e?0:e+n>t?(e=t-n,0>e?0:e):e}var i=this;if(i.settings.constrainToViewport){var o=e.getViewPort(window),a=i.layoutRect();t=r(t,o.w+o.x,a.w),n=r(n,o.h+o.y,a.h)}return i._rendered?i.layoutRect({x:t,y:n}).repaint():(i.settings.x=t,i.settings.y=n),i.fire("move",{x:t,y:n}),i}}}),r(Y,[W],function(e){return{resizeToContent:function(){this._layoutRect.autoResize=!0,this._lastRect=null,this.reflow()},resizeTo:function(t,n){if(1>=t||1>=n){var r=e.getWindowSize();t=1>=t?t*r.w:t,n=1>=n?n*r.h:n}return this._layoutRect.autoResize=!1,this.layoutRect({minW:t,minH:n,w:t,h:n}).reflow()},resizeBy:function(e,t){var n=this,r=n.layoutRect();return n.resizeTo(r.w+e,r.h+t)}}}),r(X,[K,G,Y,W],function(e,t,n,r){function i(e){var t;for(t=s.length;t--;)s[t]===e&&s.splice(t,1);for(t=l.length;t--;)l[t]===e&&l.splice(t,1)}var o,a,s=[],l=[],c,u=e.extend({Mixins:[t,n],init:function(e){function t(){var e,t=u.zIndex||65535,n;if(l.length)for(e=0;e<l.length;e++)l[e].modal&&(t++,n=l[e]),l[e].getEl().style.zIndex=t,l[e].zIndex=t,t++;var i=document.getElementById(d.classPrefix+"modal-block");n?r.css(i,"z-index",n.zIndex-1):i&&(i.parentNode.removeChild(i),c=!1),u.currentZIndex=t}function n(e,t){for(;e;){if(e==t)return!0;e=e.parent()}}function i(e){function t(t,n){for(var r,i=0;i<s.length;i++)if(s[i]!=e)for(r=s[i].parent();r&&(r=r.parent());)r==e&&s[i].fixed(t).moveBy(0,n).repaint()}var n=r.getViewPort().y;e.settings.autofix&&(e._fixed?e._autoFixY>n&&(e.fixed(!1).layoutRect({y:e._autoFixY}).repaint(),t(!1,e._autoFixY-n)):(e._autoFixY=e.layoutRect().y,e._autoFixY<n&&(e.fixed(!0).layoutRect({y:0}).repaint(),t(!0,n-e._autoFixY))))}var d=this;d._super(e),d._eventsRoot=d,d.addClass("floatpanel"),e.autohide&&(o||(o=function(e){var t,r=d.getParentCtrl(e.target);for(t=s.length;t--;){var i=s[t];if(i.settings.autohide){if(r&&(n(r,i)||i.parent()===r))continue;e=i.fire("autohide",{target:e.target}),e.isDefaultPrevented()||i.hide()}}},r.on(document,"click",o)),s.push(d)),e.autofix&&(a||(a=function(){var e;for(e=s.length;e--;)i(s[e])},r.on(window,"scroll",a)),d.on("move",function(){i(this)})),d.on("postrender show",function(e){if(e.control==d){var n,i=d.classPrefix;d.modal&&!c&&(n=r.createFragment('<div id="'+i+'modal-block" class="'+i+"reset "+i+'fade"></div>'),n=n.firstChild,d.getContainerElm().appendChild(n),setTimeout(function(){r.addClass(n,i+"in"),r.addClass(d.getEl(),i+"in")},0),c=!0),l.push(d),t()}}),d.on("close hide",function(e){if(e.control==d){for(var n=l.length;n--;)l[n]===d&&l.splice(n,1);t()}}),d.on("show",function(){d.parents().each(function(e){return e._fixed?(d.fixed(!0),!1):void 0})}),e.popover&&(d._preBodyHtml='<div class="'+d.classPrefix+'arrow"></div>',d.addClass("popover").addClass("bottom").addClass(d.isRtl()?"end":"start"))},fixed:function(e){var t=this;if(t._fixed!=e){if(t._rendered){var n=r.getViewPort();e?t.layoutRect().y-=n.y:t.layoutRect().y+=n.y}t.toggleClass("fixed",e),t._fixed=e}return t},show:function(){var e=this,t,n=e._super();for(t=s.length;t--&&s[t]!==e;);return-1===t&&s.push(e),n},hide:function(){return i(this),this._super()},hideAll:function(){u.hideAll()},close:function(){var e=this;return e.fire("close"),e.remove()},remove:function(){i(this),this._super()}});return u.hideAll=function(){for(var e=s.length;e--;){var t=s[e];t.settings.autohide&&(t.fire("cancel",{},!1),t.hide(),s.splice(e,1))}},u}),r(J,[W],function(e){return function(t){function n(){if(!h)if(h=[],d.find)d.find("*").each(function(e){e.canFocus&&h.push(e.getEl())});else for(var e=d.getEl().getElementsByTagName("*"),t=0;t<e.length;t++)e[t].id&&e[t]&&h.push(e[t])}function r(){return document.getElementById(m)}function i(e){return e=e||r(),e&&e.getAttribute("role")}function o(e){for(var t,n=e||r();n=n.parentNode;)if(t=i(n))return t}function a(e){var t=document.getElementById(m);return t?t.getAttribute("aria-"+e):void 0}function s(){var n=r();if(!n||"TEXTAREA"!=n.nodeName&&"text"!=n.type)return t.onAction?t.onAction(m):e.fire(r(),"click",{keyboard:!0}),!0}function l(){var e;t.onCancel?((e=r())&&e.blur(),t.onCancel()):t.root.fire("cancel")}function c(e){function r(e){for(var t=d?d.getEl():document.body;e&&e!=t;){if("none"==e.style.display)return!1;e=e.parentNode}return!0}var i=-1,o,a,l=[];for(n(),a=l.length,a=0;a<h.length;a++)r(h[a])&&l.push(h[a]);for(a=l.length;a--;)if(l[a].id===m){i=a;break}i+=e,0>i?i=l.length-1:i>=l.length&&(i=0),o=l[i],o.focus(),m=o.id,t.actOnFocus&&s()}function u(){var e,r;for(r=i(t.root.getEl()),n(),e=h.length;e--;)if("toolbar"==r&&h[e].id===m)return h[e].focus(),void 0;h[0].focus()}var d=t.root,f=t.enableUpDown!==!1,p=t.enableLeftRight!==!1,h=t.items,m;return d.on("keydown",function(e){var n=37,r=39,u=38,d=40,h=27,m=14,g=13,v=32,y=9,b;switch(e.keyCode){case n:p&&(t.leftAction?t.leftAction():c(-1),b=!0);break;case r:p&&("menuitem"==i()&&"menu"==o()?a("haspopup")&&s():c(1),b=!0);break;case u:f&&(c(-1),b=!0);break;case d:f&&("menuitem"==i()&&"menubar"==o()?s():"button"==i()&&a("haspopup")?s():c(1),b=!0);break;case y:b=!0,e.shiftKey?c(-1):c(1);break;case h:b=!0,l();break;case m:case g:case v:b=s()}b&&(e.stopPropagation(),e.preventDefault())}),d.on("focusin",function(e){n(),m=e.target.id}),{moveFocus:c,focusFirst:u,cancel:l}}}),r(Q,[X,K,W,J,j],function(e,t,n,r,i){var o=e.extend({modal:!0,Defaults:{border:1,layout:"flex",containerCls:"panel",role:"dialog",callbacks:{submit:function(){this.fire("submit",{data:this.toJSON()})},close:function(){this.close()}}},init:function(e){var n=this;n._super(e),n.isRtl()&&n.addClass("rtl"),n.addClass("window"),n._fixed=!0,e.buttons&&(n.statusbar=new t({layout:"flex",border:"1 0 0 0",spacing:3,padding:10,align:"center",pack:n.isRtl()?"start":"end",defaults:{type:"button"},items:e.buttons}),n.statusbar.addClass("foot"),n.statusbar.parent(n)),n.on("click",function(e){-1!=e.target.className.indexOf(n.classPrefix+"close")&&n.close()}),n.aria("label",e.title),n._fullscreen=!1},recalc:function(){var e=this,t=e.statusbar,r,i,o;e._fullscreen&&(e.layoutRect(n.getWindowSize()),e.layoutRect().contentH=e.layoutRect().innerH),e._super(),r=e.layoutRect(),e.settings.title&&!e._fullscreen&&(i=r.headerW,i>r.w&&(e.layoutRect({w:i}),o=!0)),t&&(t.layoutRect({w:e.layoutRect().innerW}).recalc(),i=t.layoutRect().minW+r.deltaW,i>r.w&&(e.layoutRect({w:i}),o=!0)),o&&e.recalc()},initLayoutRect:function(){var e=this,t=e._super(),r=0,i;if(e.settings.title&&!e._fullscreen){i=e.getEl("head");var o=n.getSize(i);t.headerW=o.width,t.headerH=o.height,r+=t.headerH}e.statusbar&&(r+=e.statusbar.layoutRect().h),t.deltaH+=r,t.minH+=r,t.h+=r;var a=n.getWindowSize();return t.x=Math.max(0,a.w/2-t.w/2),t.y=Math.max(0,a.h/2-t.h/2),t},renderHtml:function(){var e=this,t=e._layout,n=e._id,r=e.classPrefix,i=e.settings,o="",a="",s=i.html;return e.preRender(),t.preRender(e),i.title&&(o='<div id="'+n+'-head" class="'+r+'window-head">'+'<div class="'+r+'title">'+e.encode(i.title)+"</div>"+'<button type="button" class="'+r+'close" aria-hidden="true">&times;</button>'+'<div id="'+n+'-dragh" class="'+r+'dragh"></div>'+"</div>"),i.url&&(s='<iframe src="'+i.url+'" tabindex="-1"></iframe>'),"undefined"==typeof s&&(s=t.renderHtml(e)),e.statusbar&&(a=e.statusbar.renderHtml()),'<div id="'+n+'" class="'+e.classes()+'" hideFocus="1" tabIndex="-1">'+o+'<div id="'+n+'-body" class="'+e.classes("body")+'">'+s+"</div>"+a+"</div>"},fullscreen:function(e){var t=this,r=document.documentElement,i,o=t.classPrefix,a;if(e!=t._fullscreen)if(n.on(window,"resize",function(){var e;if(t._fullscreen)if(i)t._timer||(t._timer=setTimeout(function(){var e=n.getWindowSize();t.moveTo(0,0).resizeTo(e.w,e.h),t._timer=0},50));else{e=(new Date).getTime();var r=n.getWindowSize();t.moveTo(0,0).resizeTo(r.w,r.h),(new Date).getTime()-e>50&&(i=!0)}}),a=t.layoutRect(),t._fullscreen=e,e){t._initial={x:a.x,y:a.y,w:a.w,h:a.h},t._borderBox=t.parseBox("0"),t.getEl("head").style.display="none",a.deltaH-=a.headerH+2,n.addClass(r,o+"fullscreen"),n.addClass(document.body,o+"fullscreen"),t.addClass("fullscreen");var s=n.getWindowSize();t.moveTo(0,0).resizeTo(s.w,s.h)}else t._borderBox=t.parseBox(t.settings.border),t.getEl("head").style.display="",a.deltaH+=a.headerH,n.removeClass(r,o+"fullscreen"),n.removeClass(document.body,o+"fullscreen"),t.removeClass("fullscreen"),t.moveTo(t._initial.x,t._initial.y).resizeTo(t._initial.w,t._initial.h);return t.reflow()},postRender:function(){var e=this,t=[],n,o,a;setTimeout(function(){e.addClass("in")},0),e.keyboardNavigation=new r({root:e,enableLeftRight:!1,enableUpDown:!1,items:t,onCancel:function(){e.close()}}),e.find("*").each(function(e){e.canFocus&&(o=o||e.settings.autofocus,n=n||e,"filepicker"==e.type?(t.push(e.getEl("inp")),e.getEl("open")&&t.push(e.getEl("open"))):t.push(e.getEl()))}),e.statusbar&&e.statusbar.find("*").each(function(e){e.canFocus&&(o=o||e.settings.autofocus,n=n||e,t.push(e.getEl()))}),e._super(),e.statusbar&&e.statusbar.postRender(),!o&&n&&n.focus(),this.dragHelper=new i(e._id+"-dragh",{start:function(){a={x:e.layoutRect().x,y:e.layoutRect().y}},drag:function(t){e.moveTo(a.x+t.deltaX,a.y+t.deltaY)}}),e.on("submit",function(t){t.isDefaultPrevented()||e.close()})},submit:function(){return this.fire("submit",{data:this.toJSON()})},remove:function(){var e=this;e.dragHelper.destroy(),e._super(),e.statusbar&&this.statusbar.remove()}});return o}),r(Z,[Q],function(e){var t=e.extend({init:function(e){e={border:1,padding:20,layout:"flex",pack:"center",align:"center",containerCls:"panel",autoScroll:!0,buttons:{type:"button",text:"Ok",action:"ok"},items:{type:"label",multiline:!0,maxWidth:500,maxHeight:200}},this._super(e)},Statics:{OK:1,OK_CANCEL:2,YES_NO:3,YES_NO_CANCEL:4,msgBox:function(n){var r,i=n.callback||function(){};switch(n.buttons){case t.OK_CANCEL:r=[{type:"button",text:"Ok",subtype:"primary",onClick:function(e){e.control.parents()[1].close(),i(!0)}},{type:"button",text:"Cancel",onClick:function(e){e.control.parents()[1].close(),i(!1)}}];break;case t.YES_NO:r=[{type:"button",text:"Ok",subtype:"primary",onClick:function(e){e.control.parents()[1].close(),i(!0)}}];break;case t.YES_NO_CANCEL:r=[{type:"button",text:"Ok",subtype:"primary",onClick:function(e){e.control.parents()[1].close()}}];break;default:r=[{type:"button",text:"Ok",subtype:"primary",onClick:function(e){e.control.parents()[1].close(),i(!0)}}]}return new e({padding:20,x:n.x,y:n.y,minWidth:300,minHeight:100,layout:"flex",pack:"center",align:"center",buttons:r,title:n.title,items:{type:"label",multiline:!0,maxWidth:500,maxHeight:200,text:n.text},onClose:n.onClose}).renderTo(document.body).reflow()},alert:function(e,n){return"string"==typeof e&&(e={text:e}),e.callback=n,t.msgBox(e)
},confirm:function(e,n){return"string"==typeof e&&(e={text:e}),e.callback=n,e.buttons=t.OK_CANCEL,t.msgBox(e)}}});return t}),r(et,[Q,Z],function(e,t){return function(n){function r(){return o.length?o[o.length-1]:void 0}var i=this,o=[];i.windows=o,i.open=function(t,r){var i;return n.editorManager.activeEditor=n,t.title=t.title||" ",t.url=t.url||t.file,t.url&&(t.width=parseInt(t.width||320,10),t.height=parseInt(t.height||240,10)),t.body&&(t.items={defaults:t.defaults,type:t.bodyType||"form",items:t.body}),t.url||t.buttons||(t.buttons=[{text:"Ok",subtype:"primary",onclick:function(){i.find("form")[0].submit(),i.close()}},{text:"Cancel",onclick:function(){i.close()}}]),i=new e(t),o.push(i),i.on("close",function(){for(var e=o.length;e--;)o[e]===i&&o.splice(e,1);n.focus()}),t.data&&i.on("postRender",function(){this.find("*").each(function(e){var n=e.name();n in t.data&&e.value(t.data[n])})}),i.features=t||{},i.params=r||{},n.nodeChanged(),i.renderTo(document.body).reflow()},i.alert=function(e,n,r){t.alert(e,function(){n&&n.call(r||this)})},i.confirm=function(e,n,r){t.confirm(e,function(e){n.call(r||this,e)})},i.close=function(){r()&&r().close()},i.getParams=function(){return r()?r().params:null},i.setParams=function(e){r()&&(r().params=e)}}}),r(tt,[T,B,C,m,g,p],function(e,t,n,r,i,o){return function(a){function s(e,t){try{a.getDoc().execCommand(e,!1,t)}catch(n){}}function l(){var e=a.getDoc().documentMode;return e?e:6}function c(e){return e.isDefaultPrevented()}function u(){function t(e){function t(){if(3==l.nodeType){if(e&&c==l.length)return!0;if(!e&&0===c)return!0}}var n,r,i,s,l,c,u;n=W.getRng();var d=[n.startContainer,n.startOffset,n.endContainer,n.endOffset];if(n.collapsed||(e=!0),l=n[(e?"start":"end")+"Container"],c=n[(e?"start":"end")+"Offset"],3==l.nodeType&&(r=z.getParent(n.startContainer,z.isBlock),e&&(r=z.getNext(r,z.isBlock)),!r||!t()&&n.collapsed||(i=z.create("em",{id:"__mceDel"}),O(o.grep(r.childNodes),function(e){i.appendChild(e)}),r.appendChild(i))),n=z.createRng(),n.setStart(d[0],d[1]),n.setEnd(d[2],d[3]),W.setRng(n),a.getDoc().execCommand(e?"ForwardDelete":"Delete",!1,null),i){for(s=W.getBookmark();u=z.get("__mceDel");)z.remove(u,!0);W.moveToBookmark(s)}}a.on("keydown",function(n){var r;r=n.keyCode==F,c(n)||!r&&n.keyCode!=I||e.modifierPressed(n)||(n.preventDefault(),t(r))}),a.addCommand("Delete",function(){t()})}function d(){function e(e){var t=z.create("body"),n=e.cloneContents();return t.appendChild(n),W.serializer.serialize(t,{format:"html"})}function t(t){var n=e(t),r=z.createRng();r.selectNode(a.getBody());var i=e(r);return n===i}a.on("keydown",function(e){var n=e.keyCode,r;if(!c(e)&&(n==F||n==I)){if(r=a.selection.isCollapsed(),r&&!z.isEmpty(a.getBody()))return;if($&&!r)return;if(!r&&!t(a.selection.getRng()))return;e.preventDefault(),a.setContent(""),a.selection.setCursorLocation(a.getBody(),0),a.nodeChanged()}})}function f(){a.on("keydown",function(t){!c(t)&&65==t.keyCode&&e.metaKeyPressed(t)&&(t.preventDefault(),a.execCommand("SelectAll"))})}function p(){a.settings.content_editable||(z.bind(a.getDoc(),"focusin",function(){W.setRng(W.getRng())}),z.bind(a.getDoc(),"mousedown",function(e){e.target==a.getDoc().documentElement&&(a.getWin().focus(),W.setRng(W.getRng()))}))}function h(){a.on("keydown",function(e){if(!c(e)&&e.keyCode===I&&W.isCollapsed()&&0===W.getRng(!0).startOffset){var t=W.getNode(),n=t.previousSibling;if("HR"==t.nodeName)return z.remove(t),e.preventDefault(),void 0;n&&n.nodeName&&"hr"===n.nodeName.toLowerCase()&&(z.remove(n),e.preventDefault())}})}function m(){window.Range.prototype.getClientRects||a.on("mousedown",function(e){if(!c(e)&&"HTML"===e.target.nodeName){var t=a.getBody();t.blur(),setTimeout(function(){t.focus()},0)}})}function g(){a.on("click",function(e){e=e.target,/^(IMG|HR)$/.test(e.nodeName)&&W.getSel().setBaseAndExtent(e,0,e,1),"A"==e.nodeName&&z.hasClass(e,"mce-item-anchor")&&W.select(e),a.nodeChanged()})}function v(){function e(){var e=z.getAttribs(W.getStart().cloneNode(!1));return function(){var t=W.getStart();t!==a.getBody()&&(z.setAttrib(t,"style",null),O(e,function(e){t.setAttributeNode(e.cloneNode(!0))}))}}function t(){return!W.isCollapsed()&&z.getParent(W.getStart(),z.isBlock)!=z.getParent(W.getEnd(),z.isBlock)}a.on("keypress",function(n){var r;return c(n)||8!=n.keyCode&&46!=n.keyCode||!t()?void 0:(r=e(),a.getDoc().execCommand("delete",!1,null),r(),n.preventDefault(),!1)}),z.bind(a.getDoc(),"cut",function(n){var r;!c(n)&&t()&&(r=e(),setTimeout(function(){r()},0))})}function y(){var e,n;a.on("selectionchange",function(){n&&(clearTimeout(n),n=0),n=window.setTimeout(function(){var n=W.getRng();e&&t.compareRanges(n,e)||(a.nodeChanged(),e=n)},50)})}function b(){document.body.setAttribute("role","application")}function C(){a.on("keydown",function(e){if(!c(e)&&e.keyCode===I&&W.isCollapsed()&&0===W.getRng(!0).startOffset){var t=W.getNode().previousSibling;if(t&&t.nodeName&&"table"===t.nodeName.toLowerCase())return e.preventDefault(),!1}})}function x(){l()>7||(s("RespectVisibilityInDesign",!0),a.contentStyles.push(".mceHideBrInPre pre br {display: none}"),z.addClass(a.getBody(),"mceHideBrInPre"),U.addNodeFilter("pre",function(e){for(var t=e.length,r,i,o,a;t--;)for(r=e[t].getAll("br"),i=r.length;i--;)o=r[i],a=o.prev,a&&3===a.type&&"\n"!=a.value.charAt(a.value-1)?a.value+="\n":o.parent.insert(new n("#text",3),o,!0).value="\n"}),q.addNodeFilter("pre",function(e){for(var t=e.length,n,r,i,o;t--;)for(n=e[t].getAll("br"),r=n.length;r--;)i=n[r],o=i.prev,o&&3==o.type&&(o.value=o.value.replace(/\r?\n$/,""))}))}function w(){z.bind(a.getBody(),"mouseup",function(){var e,t=W.getNode();"IMG"==t.nodeName&&((e=z.getStyle(t,"width"))&&(z.setAttrib(t,"width",e.replace(/[^0-9%]+/g,"")),z.setStyle(t,"width","")),(e=z.getStyle(t,"height"))&&(z.setAttrib(t,"height",e.replace(/[^0-9%]+/g,"")),z.setStyle(t,"height","")))})}function _(){a.on("keydown",function(t){var n,r,i,o,s,l,u,d;if(n=t.keyCode==F,!c(t)&&(n||t.keyCode==I)&&!e.modifierPressed(t)&&(r=W.getRng(),i=r.startContainer,o=r.startOffset,u=r.collapsed,3==i.nodeType&&i.nodeValue.length>0&&(0===o&&!u||u&&o===(n?0:1)))){if(l=i.previousSibling,l&&"IMG"==l.nodeName)return;d=a.schema.getNonEmptyElements(),t.preventDefault(),s=z.create("br",{id:"__tmp"}),i.parentNode.insertBefore(s,i),a.getDoc().execCommand(n?"ForwardDelete":"Delete",!1,null),i=W.getRng().startContainer,l=i.previousSibling,l&&1==l.nodeType&&!z.isBlock(l)&&z.isEmpty(l)&&!d[l.nodeName.toLowerCase()]&&z.remove(l),z.remove("__tmp")}})}function N(){a.on("keydown",function(t){var n,r,i,o,s;if(!c(t)&&t.keyCode==e.BACKSPACE&&(n=W.getRng(),r=n.startContainer,i=n.startOffset,o=z.getRoot(),s=r,n.collapsed&&0===i)){for(;s&&s.parentNode&&s.parentNode.firstChild==s&&s.parentNode!=o;)s=s.parentNode;"BLOCKQUOTE"===s.tagName&&(a.formatter.toggle("blockquote",null,s),n=z.createRng(),n.setStart(r,0),n.setEnd(r,0),W.setRng(n))}})}function E(){function e(){a._refreshContentEditable(),s("StyleWithCSS",!1),s("enableInlineTableEditing",!1),V.object_resizing||s("enableObjectResizing",!1)}V.readonly||a.on("BeforeExecCommand MouseDown",e)}function S(){function e(){O(z.select("a"),function(e){var t=e.parentNode,n=z.getRoot();if(t.lastChild===e){for(;t&&!z.isBlock(t);){if(t.parentNode.lastChild!==t||t===n)return;t=t.parentNode}z.add(t,"br",{"data-mce-bogus":1})}})}a.on("SetContent ExecCommand",function(t){("setcontent"==t.type||"mceInsertLink"===t.command)&&e()})}function k(){V.forced_root_block&&a.on("init",function(){s("DefaultParagraphSeparator",V.forced_root_block)})}function T(){a.on("Undo Redo SetContent",function(e){e.initial||a.execCommand("mceRepaint")})}function R(){a.on("keydown",function(e){var t;c(e)||e.keyCode!=I||(t=a.getDoc().selection.createRange(),t&&t.item&&(e.preventDefault(),a.undoManager.beforeChange(),z.remove(t.item(0)),a.undoManager.add()))})}function A(){var e;l()>=10&&(e="",O("p div h1 h2 h3 h4 h5 h6".split(" "),function(t,n){e+=(n>0?",":"")+t+":empty"}),a.contentStyles.push(e+"{padding-right: 1px !important}"))}function B(){l()<9&&(U.addNodeFilter("noscript",function(e){for(var t=e.length,n,r;t--;)n=e[t],r=n.firstChild,r&&n.attr("data-mce-innertext",r.value)}),q.addNodeFilter("noscript",function(e){for(var t=e.length,i,o,a;t--;)i=e[t],o=e[t].firstChild,o?o.value=r.decode(o.value):(a=i.attributes.map["data-mce-innertext"],a&&(i.attr("data-mce-innertext",null),o=new n("#text",3),o.value=a,o.raw=!0,i.append(o)))}))}function L(){function e(e,t){var n=i.createTextRange();try{n.moveToPoint(e,t)}catch(r){n=null}return n}function t(t){var r;t.button?(r=e(t.x,t.y),r&&(r.compareEndPoints("StartToStart",a)>0?r.setEndPoint("StartToStart",a):r.setEndPoint("EndToEnd",a),r.select())):n()}function n(){var e=r.selection.createRange();a&&!e.item&&0===e.compareEndPoints("StartToEnd",e)&&a.select(),z.unbind(r,"mouseup",n),z.unbind(r,"mousemove",t),a=o=0}var r=z.doc,i=r.body,o,a,s;r.documentElement.unselectable=!0,z.bind(r,"mousedown contextmenu",function(i){if("HTML"===i.target.nodeName){if(o&&n(),s=r.documentElement,s.scrollHeight>s.clientHeight)return;o=1,a=e(i.x,i.y),a&&(z.bind(r,"mouseup",n),z.bind(r,"mousemove",t),z.win.focus(),a.select())}})}function H(){a.on("keyup focusin",function(t){65==t.keyCode&&e.metaKeyPressed(t)||W.normalize()})}function D(){a.contentStyles.push("img:-moz-broken {-moz-force-broken-image-icon:1;min-width:24px;min-height:24px}")}function M(){a.inline||a.on("keydown",function(){document.activeElement==document.body&&a.getWin().focus()})}function P(){a.inline||(a.contentStyles.push("body {min-height: 150px}"),a.on("click",function(e){"HTML"==e.target.nodeName&&(a.execCommand("SelectAll"),a.selection.collapse(!0),a.nodeChanged())}))}var O=o.each,I=e.BACKSPACE,F=e.DELETE,z=a.dom,W=a.selection,V=a.settings,U=a.parser,q=a.serializer,j=i.gecko,$=i.ie,K=i.webkit;C(),N(),d(),H(),K&&(_(),u(),p(),g(),k(),i.iOS?(y(),M()):f()),$&&i.ie<11&&(h(),b(),x(),w(),R(),A(),B(),L()),i.ie>=11&&P(),j&&(h(),m(),v(),E(),S(),T(),D())}}),r(nt,[p],function(e){function t(){return!1}function n(){return!0}var r="__bindings",i=e.makeMap("focusin focusout click dblclick mousedown mouseup mousemove mouseover beforepaste paste cut copy selectionchange mouseout mouseenter mouseleave keydown keypress keyup contextmenu dragend dragover draggesture dragdrop drop drag"," ");return{fire:function(e,i,o){var a=this,s,l,c,u,d;if(e=e.toLowerCase(),i=i||{},i.type=e,i.target||(i.target=a),i.preventDefault||(i.preventDefault=function(){i.isDefaultPrevented=n},i.stopPropagation=function(){i.isPropagationStopped=n},i.stopImmediatePropagation=function(){i.isImmediatePropagationStopped=n},i.isDefaultPrevented=t,i.isPropagationStopped=t,i.isImmediatePropagationStopped=t),a[r]&&(s=a[r][e]))for(l=0,c=s.length;c>l&&(s[l]=u=s[l],!i.isImmediatePropagationStopped());l++)if(u.call(a,i)===!1)return i.preventDefault(),i;if(o!==!1&&a.parent)for(d=a.parent();d&&!i.isPropagationStopped();)d.fire(e,i,!1),d=d.parent();return i},on:function(e,t){var n=this,o,a,s,l;if(t===!1&&(t=function(){return!1}),t)for(s=e.toLowerCase().split(" "),l=s.length;l--;)e=s[l],o=n[r],o||(o=n[r]={}),a=o[e],a||(a=o[e]=[],n.bindNative&&i[e]&&n.bindNative(e)),a.push(t);return n},off:function(e,t){var n=this,o,a=n[r],s,l,c,u;if(a)if(e)for(c=e.toLowerCase().split(" "),o=c.length;o--;){if(e=c[o],s=a[e],!e){for(l in a)a[e].length=0;return n}if(s){if(t)for(u=s.length;u--;)s[u]===t&&s.splice(u,1);else s.length=0;!s.length&&n.unbindNative&&i[e]&&(n.unbindNative(e),delete a[e])}}else{if(n.unbindNative)for(e in a)n.unbindNative(e);n[r]=[]}return n},hasEventListeners:function(e){var t=this[r];return e=e.toLowerCase(),!(!t||!t[e]||0===t[e].length)}}}),r(rt,[p,g],function(e,t){var n=e.each,r=e.explode,i={f9:120,f10:121,f11:122};return function(o){var a=this,s={};o.on("keyup keypress keydown",function(e){(e.altKey||e.ctrlKey||e.metaKey)&&n(s,function(n){var r=t.mac?e.ctrlKey||e.metaKey:e.ctrlKey;if(n.ctrl==r&&n.alt==e.altKey&&n.shift==e.shiftKey)return e.keyCode==n.keyCode||e.charCode&&e.charCode==n.charCode?(e.preventDefault(),"keydown"==e.type&&n.func.call(n.scope),!0):void 0})}),a.add=function(t,a,l,c){var u;return u=l,"string"==typeof l?l=function(){o.execCommand(u,!1,null)}:e.isArray(u)&&(l=function(){o.execCommand(u[0],u[1],u[2])}),n(r(t.toLowerCase()),function(e){var t={func:l,scope:c||o,desc:o.translate(a),alt:!1,ctrl:!1,shift:!1};n(r(e,"+"),function(e){switch(e){case"alt":case"ctrl":case"shift":t[e]=!0;break;default:t.charCode=e.charCodeAt(0),t.keyCode=i[e]||e.toUpperCase().charCodeAt(0)}}),s[(t.ctrl?"ctrl":"")+","+(t.alt?"alt":"")+","+(t.shift?"shift":"")+","+t.keyCode]=t}),!0}}}),r(it,[v,b,C,S,E,A,L,H,D,M,P,O,y,l,et,x,_,tt,g,p,nt,rt],function(e,n,r,i,o,a,s,l,c,u,d,f,p,h,m,g,v,y,b,C,x,w){function _(e,t){return"selectionchange"==t||"drop"==t?e.getDoc():!e.inline&&/^mouse|click|contextmenu/.test(t)?e.getDoc():e.getBody()}function N(e,t,r){var i=this,o,a;o=i.documentBaseUrl=r.documentBaseURL,a=r.baseURI,i.settings=t=T({id:e,theme:"modern",delta_width:0,delta_height:0,popup_css:"",plugins:"",document_base_url:o,add_form_submit_trigger:!0,submit_patch:!0,add_unload_trigger:!0,convert_urls:!0,relative_urls:!0,remove_script_host:!0,object_resizing:!0,doctype:"<!DOCTYPE html>",visual:!0,font_size_style_values:"xx-small,x-small,small,medium,large,x-large,xx-large",font_size_legacy_values:"xx-small,small,medium,large,x-large,xx-large,300%",forced_root_block:"p",hidden_input:!0,padd_empty_editor:!0,render_ui:!0,indentation:"30px",inline_styles:!0,convert_fonts_to_spans:!0,indent:"simple",indent_before:"p,h1,h2,h3,h4,h5,h6,blockquote,div,title,style,pre,script,td,ul,li,area,table,thead,tfoot,tbody,tr,section,article,hgroup,aside,figure,option,optgroup,datalist",indent_after:"p,h1,h2,h3,h4,h5,h6,blockquote,div,title,style,pre,script,td,ul,li,area,table,thead,tfoot,tbody,tr,section,article,hgroup,aside,figure,option,optgroup,datalist",validate:!0,entity_encoding:"named",url_converter:i.convertURL,url_converter_scope:i,ie7_compat:!0},t),n.language=t.language||"en",n.languageLoad=t.language_load,n.baseURL=r.baseURL,i.id=t.id=e,i.isNotDirty=!0,i.plugins={},i.documentBaseURI=new f(t.document_base_url||o,{base_uri:a}),i.baseURI=a,i.contentCSS=[],i.contentStyles=[],i.shortcuts=new w(i),i.execCommands={},i.queryStateCommands={},i.queryValueCommands={},i.loadedCSS={},i.suffix=r.suffix,i.editorManager=r,i.inline=t.inline,i.execCallback("setup",i),r.fire("SetupEditor",i)}var E=e.DOM,S=n.ThemeManager,k=n.PluginManager,T=C.extend,R=C.each,A=C.explode,B=C.inArray,L=C.trim,H=C.resolve,D=h.Event,M=b.gecko,P=b.ie;return N.prototype={render:function(){function e(){E.unbind(window,"ready",e),n.render()}function t(){var e=p.ScriptLoader;if(r.language&&"en"!=r.language&&(r.language_url=n.editorManager.baseURL+"/langs/"+r.language+".js"),r.language_url&&e.add(r.language_url),r.theme&&"function"!=typeof r.theme&&"-"!=r.theme.charAt(0)&&!S.urls[r.theme]){var t=r.theme_url;t=t?n.documentBaseURI.toAbsolute(t):"themes/"+r.theme+"/theme"+o+".js",S.load(r.theme,t)}C.isArray(r.plugins)&&(r.plugins=r.plugins.join(" ")),R(r.external_plugins,function(e,t){k.load(t,e),r.plugins+=" "+t}),R(r.plugins.split(/[ ,]/),function(e){if(e=L(e),e&&!k.urls[e])if("-"==e.charAt(0)){e=e.substr(1,e.length);var t=k.dependencies(e);R(t,function(e){var t={prefix:"plugins/",resource:e,suffix:"/plugin"+o+".js"};e=k.createUrl(t,e),k.load(e.resource,e)})}else k.load(e,{prefix:"plugins/",resource:e,suffix:"/plugin"+o+".js"})}),e.loadQueue(function(){n.removed||n.init()})}var n=this,r=n.settings,i=n.id,o=n.suffix;if(!D.domLoaded)return E.bind(window,"ready",e),void 0;if(n.getElement()&&b.contentEditable){r.inline?n.inline=!0:(n.orgVisibility=n.getElement().style.visibility,n.getElement().style.visibility="hidden");var a=n.getElement().form||E.getParent(i,"form");a&&(n.formElement=a,r.hidden_input&&!/TEXTAREA|INPUT/i.test(n.getElement().nodeName)&&(E.insertAfter(E.create("input",{type:"hidden",name:i}),i),n.hasHiddenInput=!0),n.formEventDelegate=function(e){n.fire(e.type,e)},E.bind(a,"submit reset",n.formEventDelegate),n.on("reset",function(){n.setContent(n.startContent,{format:"raw"})}),!r.submit_patch||a.submit.nodeType||a.submit.length||a._mceOldSubmit||(a._mceOldSubmit=a.submit,a.submit=function(){return n.editorManager.triggerSave(),n.isNotDirty=!0,a._mceOldSubmit(a)})),n.windowManager=new m(n),"xml"==r.encoding&&n.on("GetContent",function(e){e.save&&(e.content=E.encode(e.content))}),r.add_form_submit_trigger&&n.on("submit",function(){n.initialized&&n.save()}),r.add_unload_trigger&&(n._beforeUnload=function(){!n.initialized||n.destroyed||n.isHidden()||n.save({format:"raw",no_events:!0,set_dirty:!1})},n.editorManager.on("BeforeUnload",n._beforeUnload)),t()}},init:function(){function e(n){var r=k.get(n),i,o;i=k.urls[n]||t.documentBaseUrl.replace(/\/$/,""),n=L(n),r&&-1===B(h,n)&&(R(k.dependencies(n),function(t){e(t)}),o=new r(t,i),t.plugins[n]=o,o.init&&(o.init(t,i),h.push(n)))}var t=this,n=t.settings,r=t.getElement(),i,o,a,s,l,c,u,d,f,p,h=[];if(t.rtl=this.editorManager.i18n.rtl,t.editorManager.add(t),n.aria_label=n.aria_label||E.getAttrib(r,"aria-label",t.getLang("aria.rich_text_area")),n.theme&&("function"!=typeof n.theme?(n.theme=n.theme.replace(/-/,""),l=S.get(n.theme),t.theme=new l(t,S.urls[n.theme]),t.theme.init&&t.theme.init(t,S.urls[n.theme]||t.documentBaseUrl.replace(/\/$/,""))):t.theme=n.theme),R(n.plugins.replace(/\-/g,"").split(/[ ,]/),e),t.fire("BeforeRenderUI"),n.render_ui&&t.theme&&(t.orgDisplay=r.style.display,"function"!=typeof n.theme?(i=n.width||r.style.width||r.offsetWidth,o=n.height||r.style.height||r.offsetHeight,a=n.min_height||100,f=/^[0-9\.]+(|px)$/i,f.test(""+i)&&(i=Math.max(parseInt(i,10)+(l.deltaWidth||0),100)),f.test(""+o)&&(o=Math.max(parseInt(o,10)+(l.deltaHeight||0),a)),l=t.theme.renderUI({targetNode:r,width:i,height:o,deltaWidth:n.delta_width,deltaHeight:n.delta_height}),n.content_editable||(E.setStyles(l.sizeContainer||l.editorContainer,{wi2dth:i,h2eight:o}),o=(l.iframeHeight||o)+("number"==typeof o?l.deltaHeight||0:""),a>o&&(o=a))):(l=n.theme(t,r),l.editorContainer.nodeType&&(l.editorContainer=l.editorContainer.id=l.editorContainer.id||t.id+"_parent"),l.iframeContainer.nodeType&&(l.iframeContainer=l.iframeContainer.id=l.iframeContainer.id||t.id+"_iframecontainer"),o=l.iframeHeight||r.offsetHeight),t.editorContainer=l.editorContainer),n.content_css&&R(A(n.content_css),function(e){t.contentCSS.push(t.documentBaseURI.toAbsolute(e))}),n.content_style&&t.contentStyles.push(n.content_style),n.content_editable)return r=s=l=null,t.initContentBody();for(t.iframeHTML=n.doctype+"<html><head>",n.document_base_url!=t.documentBaseUrl&&(t.iframeHTML+='<base href="'+t.documentBaseURI.getURI()+'" />'),!b.caretAfter&&n.ie7_compat&&(t.iframeHTML+='<meta http-equiv="X-UA-Compatible" content="IE=7" />'),t.iframeHTML+='<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',p=0;p<t.contentCSS.length;p++){var m=t.contentCSS[p];t.iframeHTML+='<link type="text/css" rel="stylesheet" href="'+m+'" />',t.loadedCSS[m]=!0}u=n.body_id||"tinymce",-1!=u.indexOf("=")&&(u=t.getParam("body_id","","hash"),u=u[t.id]||u),d=n.body_class||"",-1!=d.indexOf("=")&&(d=t.getParam("body_class","","hash"),d=d[t.id]||""),t.iframeHTML+='</head><body id="'+u+'" class="mce-content-body '+d+'" '+"onload=\"window.parent.tinymce.get('"+t.id+"').fire('load');\"><br></body></html>";var g='javascript:(function(){document.open();document.domain="'+document.domain+'";'+'var ed = window.parent.tinymce.get("'+t.id+'");document.write(ed.iframeHTML);'+"document.close();ed.initContentBody(true);})()";if(document.domain!=location.hostname&&(c=g),s=E.add(l.iframeContainer,"iframe",{id:t.id+"_ifr",src:c||'javascript:""',frameBorder:"0",allowTransparency:"true",title:t.editorManager.translate("Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"),style:{width:"100%",height:o,display:"block"}}),P)try{t.getDoc()}catch(v){s.src=c=g}t.contentAreaContainer=l.iframeContainer,l.editorContainer&&(E.get(l.editorContainer).style.display=t.orgDisplay),E.get(t.id).style.display="none",E.setAttrib(t.id,"aria-hidden",!0),c||t.initContentBody(),r=s=l=null},initContentBody:function(t){var n=this,o=n.settings,f=E.get(n.id),p=n.getDoc(),h,m;o.inline||(n.getElement().style.visibility=n.orgVisibility),t||o.content_editable||(p.open(),p.write(n.iframeHTML),p.close()),o.content_editable&&(n.on("remove",function(){var e=this.getBody();E.removeClass(e,"mce-content-body"),E.removeClass(e,"mce-edit-focus"),E.setAttrib(e,"tabIndex",null),E.setAttrib(e,"contentEditable",null)}),E.addClass(f,"mce-content-body"),f.tabIndex=-1,n.contentDocument=p=o.content_document||document,n.contentWindow=o.content_window||window,n.bodyElement=f,o.content_document=o.content_window=null,o.root_name=f.nodeName.toLowerCase()),h=n.getBody(),h.disabled=!0,o.readonly||(h.contentEditable=n.getParam("content_editable_state",!0)),h.disabled=!1,n.schema=new g(o),n.dom=new e(p,{keep_values:!0,url_converter:n.convertURL,url_converter_scope:n,hex_colors:o.force_hex_style_colors,class_filter:o.class_filter,update_styles:!0,root_element:o.content_editable?n.id:null,collect:o.content_editable,schema:n.schema,onSetAttrib:function(e){n.fire("SetAttrib",e)}}),n.parser=new v(o,n.schema),n.parser.addAttributeFilter("src,href,style",function(e,t){for(var r=e.length,i,o=n.dom,a,s;r--;)i=e[r],a=i.attr(t),s="data-mce-"+t,i.attributes.map[s]||("style"===t?i.attr(s,o.serializeStyle(o.parseStyle(a),i.name)):i.attr(s,n.convertURL(a,t,i.name)))}),n.parser.addNodeFilter("script",function(e){for(var t=e.length,n;t--;)n=e[t],n.attr("type","mce-"+(n.attr("type")||"text/javascript"))}),n.parser.addNodeFilter("#cdata",function(e){for(var t=e.length,n;t--;)n=e[t],n.type=8,n.name="#comment",n.value="[CDATA["+n.value+"]]"}),n.parser.addNodeFilter("p,h1,h2,h3,h4,h5,h6,div",function(e){for(var t=e.length,i,o=n.schema.getNonEmptyElements();t--;)i=e[t],i.isEmpty(o)&&(i.empty().append(new r("br",1)).shortEnded=!0)}),n.serializer=new i(o,n),n.selection=new a(n.dom,n.getWin(),n.serializer,n),n.formatter=new s(n),n.undoManager=new l(n),n.forceBlocks=new u(n),n.enterKey=new c(n),n.editorCommands=new d(n),n.fire("PreInit"),o.browser_spellcheck||o.gecko_spellcheck||(p.body.spellcheck=!1,E.setAttrib(h,"spellcheck","false")),n.fire("PostRender"),n.quirks=y(n),o.directionality&&(h.dir=o.directionality),o.nowrap&&(h.style.whiteSpace="nowrap"),o.protect&&n.on("BeforeSetContent",function(e){R(o.protect,function(t){e.content=e.content.replace(t,function(e){return"<!--mce:protected "+escape(e)+"-->"})})}),n.on("SetContent",function(){n.addVisual(n.getBody())}),o.padd_empty_editor&&n.on("PostProcess",function(e){e.content=e.content.replace(/^(<p[^>]*>(&nbsp;|&#160;|\s|\u00a0|)<\/p>[\r\n]*|<br \/>[\r\n]*)$/,"")}),n.load({initial:!0,format:"html"}),n.startContent=n.getContent({format:"raw"}),n.initialized=!0,R(n._pendingNativeEvents,function(e){n.dom.bind(_(n,e),e,function(e){n.fire(e.type,e)})}),n.fire("init"),n.focus(!0),n.nodeChanged({initial:!0}),n.execCallback("init_instance_callback",n),n.contentStyles.length>0&&(m="",R(n.contentStyles,function(e){m+=e+"\r\n"}),n.dom.addStyle(m)),R(n.contentCSS,function(e){n.loadedCSS[e]||(n.dom.loadCSS(e),n.loadedCSS[e]=!0)}),o.auto_focus&&setTimeout(function(){var e=n.editorManager.get(o.auto_focus);e.selection.select(e.getBody(),1),e.selection.collapse(1),e.getBody().focus(),e.getWin().focus()},100),f=p=h=null},focus:function(e){var t,n=this,r=n.selection,i=n.settings.content_editable,o,a,s=n.getDoc(),l;e||(o=r.getRng(),o.item&&(a=o.item(0)),n._refreshContentEditable(),i||(b.opera||n.getBody().focus(),n.getWin().focus()),(M||i)&&(l=n.getBody(),l.setActive?l.setActive():l.focus(),i&&r.normalize()),a&&a.ownerDocument==s&&(o=s.body.createControlRange(),o.addElement(a),o.select())),n.editorManager.activeEditor!=n&&((t=n.editorManager.activeEditor)&&t.fire("deactivate",{relatedTarget:n}),n.fire("activate",{relatedTarget:t})),n.editorManager.activeEditor=n},execCallback:function(e){var t=this,n=t.settings[e],r;if(n)return t.callbackLookup&&(r=t.callbackLookup[e])&&(n=r.func,r=r.scope),"string"==typeof n&&(r=n.replace(/\.\w+$/,""),r=r?H(r):0,n=H(n),t.callbackLookup=t.callbackLookup||{},t.callbackLookup[e]={func:n,scope:r}),n.apply(r||t,Array.prototype.slice.call(arguments,1))},translate:function(e){var t=this.settings.language||"en",n=this.editorManager.i18n;return e?n.data[t+"."+e]||e.replace(/\{\#([^\}]+)\}/g,function(e,r){return n.data[t+"."+r]||"{#"+r+"}"}):""},getLang:function(e,n){return this.editorManager.i18n.data[(this.settings.language||"en")+"."+e]||(n!==t?n:"{#"+e+"}")},getParam:function(e,t,n){var r=e in this.settings?this.settings[e]:t,i;return"hash"===n?(i={},"string"==typeof r?R(r.indexOf("=")>0?r.split(/[;,](?![^=;,]*(?:[;,]|$))/):r.split(","),function(e){e=e.split("="),i[L(e[0])]=e.length>1?L(e[1]):L(e)}):i=r,i):r},nodeChanged:function(){var e=this,t=e.selection,n,r,i;e.initialized&&!e.settings.disable_nodechange&&(i=e.getBody(),n=t.getStart()||i,n=P&&n.ownerDocument!=e.getDoc()?e.getBody():n,"IMG"==n.nodeName&&t.isCollapsed()&&(n=n.parentNode),r=[],e.dom.getParent(n,function(e){return e===i?!0:(r.push(e),void 0)}),e.fire("NodeChange",{element:n,parents:r}))},addButton:function(e,t){var n=this;t.cmd&&(t.onclick=function(){n.execCommand(t.cmd)}),t.text||t.icon||(t.icon=e),n.buttons=n.buttons||{},t.tooltip=t.tooltip||t.title,n.buttons[e]=t},addMenuItem:function(e,t){var n=this;t.cmd&&(t.onclick=function(){n.execCommand(t.cmd)}),n.menuItems=n.menuItems||{},n.menuItems[e]=t},addCommand:function(e,t,n){this.execCommands[e]={func:t,scope:n||this}},addQueryStateHandler:function(e,t,n){this.queryStateCommands[e]={func:t,scope:n||this}},addQueryValueHandler:function(e,t,n){this.queryValueCommands[e]={func:t,scope:n||this}},addShortcut:function(e,t,n,r){this.shortcuts.add(e,t,n,r)},execCommand:function(e,t,n,r){var i=this,o=0,a;return/^(mceAddUndoLevel|mceEndUndoLevel|mceBeginUndoLevel|mceRepaint)$/.test(e)||r&&r.skip_focus||i.focus(),r=T({},r),r=i.fire("BeforeExecCommand",{command:e,ui:t,value:n}),r.isDefaultPrevented()?!1:(a=i.execCommands[e])&&a.func.call(a.scope,t,n)!==!0?(i.fire("ExecCommand",{command:e,ui:t,value:n}),!0):(R(i.plugins,function(r){return r.execCommand&&r.execCommand(e,t,n)?(i.fire("ExecCommand",{command:e,ui:t,value:n}),o=!0,!1):void 0}),o?o:i.theme&&i.theme.execCommand&&i.theme.execCommand(e,t,n)?(i.fire("ExecCommand",{command:e,ui:t,value:n}),!0):i.editorCommands.execCommand(e,t,n)?(i.fire("ExecCommand",{command:e,ui:t,value:n}),!0):(i.getDoc().execCommand(e,t,n),i.fire("ExecCommand",{command:e,ui:t,value:n}),void 0))},queryCommandState:function(e){var t=this,n,r;if(!t._isHidden()){if((n=t.queryStateCommands[e])&&(r=n.func.call(n.scope),r!==!0))return r;if(r=t.editorCommands.queryCommandState(e),-1!==r)return r;try{return t.getDoc().queryCommandState(e)}catch(i){}}},queryCommandValue:function(e){var n=this,r,i;if(!n._isHidden()){if((r=n.queryValueCommands[e])&&(i=r.func.call(r.scope),i!==!0))return i;if(i=n.editorCommands.queryCommandValue(e),i!==t)return i;try{return n.getDoc().queryCommandValue(e)}catch(o){}}},show:function(){var e=this;E.show(e.getContainer()),E.hide(e.id),e.load(),e.fire("show")},hide:function(){var e=this,t=e.getDoc();P&&t&&t.execCommand("SelectAll"),e.save(),E.hide(e.getContainer()),E.setStyle(e.id,"display",e.orgDisplay),e.fire("hide")},isHidden:function(){return!E.isHidden(this.id)},setProgressState:function(e,t){this.fire("ProgressState",{state:e,time:t})},load:function(e){var n=this,r=n.getElement(),i;return r?(e=e||{},e.load=!0,i=n.setContent(r.value!==t?r.value:r.innerHTML,e),e.element=r,e.no_events||n.fire("LoadContent",e),e.element=r=null,i):void 0},save:function(e){var t=this,n=t.getElement(),r,i;if(n&&t.initialized)return e=e||{},e.save=!0,e.element=n,r=e.content=t.getContent(e),e.no_events||t.fire("SaveContent",e),r=e.content,/TEXTAREA|INPUT/i.test(n.nodeName)?n.value=r:(n.innerHTML=r,(i=E.getParent(t.id,"form"))&&R(i.elements,function(e){return e.name==t.id?(e.value=r,!1):void 0})),e.element=n=null,e.set_dirty!==!1&&(t.isNotDirty=!0),r},setContent:function(e,t){var n=this,r=n.getBody(),i;if(t=t||{},t.format=t.format||"html",t.set=!0,t.content=e,t.no_events||n.fire("BeforeSetContent",t),e=t.content,0===e.length||/^\s+$/.test(e)?(i=n.settings.forced_root_block,i&&n.schema.isValidChild(r.nodeName.toLowerCase(),i.toLowerCase())?e=P&&11>P?"<"+i+"></"+i+">":"<"+i+'><br data-mce-bogus="1"></'+i+">":P||(e='<br data-mce-bogus="1">'),r.innerHTML=e,n.fire("SetContent",t)):("raw"!==t.format&&(e=new o({},n.schema).serialize(n.parser.parse(e,{isRootContent:!0}))),t.content=L(e),n.dom.setHTML(r,t.content),t.no_events||n.fire("SetContent",t)),!t.initial){var a=n.dom,s=n.selection;11>P&&a.isBlock(r.firstChild)&&a.isEmpty(r.firstChild)?(r.firstChild.appendChild(a.doc.createTextNode("\xa0")),s.select(r.firstChild,!0),a.remove(r.firstChild.lastChild)):(s.select(r,!0),s.collapse(!0))}return t.content},getContent:function(e){var t=this,n,r=t.getBody();return e=e||{},e.format=e.format||"html",e.get=!0,e.getInner=!0,e.no_events||t.fire("BeforeGetContent",e),n="raw"==e.format?r.innerHTML:"text"==e.format?r.innerText||r.textContent:t.serializer.serialize(r,e),e.content="text"!=e.format?L(n):n,e.no_events||t.fire("GetContent",e),e.content},insertContent:function(e){this.execCommand("mceInsertContent",!1,e)},isDirty:function(){return!this.isNotDirty},getContainer:function(){var e=this;return e.container||(e.container=E.get(e.editorContainer||e.id+"_parent")),e.container},getContentAreaContainer:function(){return this.contentAreaContainer},getElement:function(){return E.get(this.settings.content_element||this.id)},getWin:function(){var e=this,t;return e.contentWindow||(t=E.get(e.id+"_ifr"),t&&(e.contentWindow=t.contentWindow)),e.contentWindow},getDoc:function(){var e=this,t;return e.contentDocument||(t=e.getWin(),t&&(e.contentDocument=t.document)),e.contentDocument},getBody:function(){return this.bodyElement||this.getDoc().body},convertURL:function(e,t,n){var r=this,i=r.settings;return i.urlconverter_callback?r.execCallback("urlconverter_callback",e,n,!0,t):!i.convert_urls||n&&"LINK"==n.nodeName||0===e.indexOf("file:")||0===e.length?e:i.relative_urls?r.documentBaseURI.toRelative(e):e=r.documentBaseURI.toAbsolute(e,i.remove_script_host)},addVisual:function(e){var n=this,r=n.settings,i=n.dom,o;e=e||n.getBody(),n.hasVisual===t&&(n.hasVisual=r.visual),R(i.select("table,a",e),function(e){var t;switch(e.nodeName){case"TABLE":return o=r.visual_table_class||"mce-item-table",t=i.getAttrib(e,"border"),t&&"0"!=t||(n.hasVisual?i.addClass(e,o):i.removeClass(e,o)),void 0;case"A":return i.getAttrib(e,"href",!1)||(t=i.getAttrib(e,"name")||e.id,o="mce-item-anchor",t&&(n.hasVisual?i.addClass(e,o):i.removeClass(e,o))),void 0}}),n.fire("VisualAid",{element:e,hasVisual:n.hasVisual})},remove:function(){var e=this;if(!e.removed){e.removed=1,e.hasHiddenInput&&E.remove(e.getElement().nextSibling);var t=e.getDoc();P&&t&&t.execCommand("SelectAll"),e.save(),E.setStyle(e.id,"display",e.orgDisplay),e.settings.content_editable||(D.unbind(e.getWin()),D.unbind(e.getDoc()));var n=e.getContainer();D.unbind(e.getBody()),D.unbind(n),e.fire("remove"),e.editorManager.remove(e),E.remove(n),e.destroy()}},bindNative:function(e){var t=this;t.settings.readonly||(t.initialized?t.dom.bind(_(t,e),e,function(n){t.fire(e,n)}):t._pendingNativeEvents?t._pendingNativeEvents.push(e):t._pendingNativeEvents=[e])},unbindNative:function(e){var t=this;t.initialized&&t.dom.unbind(e)},destroy:function(e){var t=this,n;if(!t.destroyed){if(!e&&!t.removed)return t.remove(),void 0;e&&M&&(D.unbind(t.getDoc()),D.unbind(t.getWin()),D.unbind(t.getBody())),e||(t.editorManager.off("beforeunload",t._beforeUnload),t.theme&&t.theme.destroy&&t.theme.destroy(),t.selection.destroy(),t.dom.destroy()),n=t.formElement,n&&(n._mceOldSubmit&&(n.submit=n._mceOldSubmit,n._mceOldSubmit=null),E.unbind(n,"submit reset",t.formEventDelegate)),t.contentAreaContainer=t.formElement=t.container=null,t.settings.content_element=t.bodyElement=t.contentDocument=t.contentWindow=null,t.selection&&(t.selection=t.selection.win=t.selection.dom=t.selection.dom.doc=null),t.destroyed=1
}},_refreshContentEditable:function(){var e=this,t,n;e._isHidden()&&(t=e.getBody(),n=t.parentNode,n.removeChild(t),n.appendChild(t),t.focus())},_isHidden:function(){var e;return M?(e=this.selection.getSel(),!e||!e.rangeCount||0===e.rangeCount):0}},T(N.prototype,x),N}),r(ot,[],function(){var e={};return{rtl:!1,add:function(t,n){for(var r in n)e[r]=n[r];this.rtl=this.rtl||"rtl"===e._dir},translate:function(t){if("undefined"==typeof t)return t;if("string"!=typeof t&&t.raw)return t.raw;if(t.push){var n=t.slice(1);t=(e[t[0]]||t[0]).replace(/\{([^\}]+)\}/g,function(e,t){return n[t]})}return e[t]||t},data:e}}),r(at,[v,g],function(e,t){function n(r){function i(){try{return document.activeElement}catch(e){return document.body}}function o(e){return e&&e.startContainer?{startContainer:e.startContainer,startOffset:e.startOffset,endContainer:e.endContainer,endOffset:e.endOffset}:e}function a(e,t){var n;return t.startContainer?(n=e.getDoc().createRange(),n.setStart(t.startContainer,t.startOffset),n.setEnd(t.endContainer,t.endOffset)):n=t,n}function s(s){function l(t){return!!e.DOM.getParent(t,n.isEditorUIElement)}var c=s.editor,u,d;c.on("init",function(){"onbeforedeactivate"in document&&t.ie<11?c.dom.bind(c.getBody(),"beforedeactivate",function(){var e=c.getDoc().selection;try{u=e&&e.createRange?e.createRange():c.selection.getRng()}catch(t){}}):(c.inline||t.ie>10)&&(c.on("nodechange keyup",function(){var e,t=document.activeElement;for(t&&t.id==c.id+"_ifr"&&(t=c.getBody());t;){if(t==c.getBody()){e=!0;break}t=t.parentNode}e&&(u=c.selection.getRng())}),t.webkit&&(d=function(){var e=c.selection.getRng();e.collapsed||(u=e)},e.DOM.bind(document,"selectionchange",d),c.on("remove",function(){e.DOM.unbind(document,"selectionchange",d)})))}),c.on("mousedown",function(){c.selection.lastFocusBookmark=null}),c.on("focusin",function(){var e=r.focusedEditor;c.selection.lastFocusBookmark&&(c.selection.setRng(a(c,c.selection.lastFocusBookmark)),c.selection.lastFocusBookmark=null),e!=c&&(e&&e.fire("blur",{focusedEditor:c}),r.activeEditor=c,c.fire("focus",{blurredEditor:e}),c.focus(!1),r.focusedEditor=c)}),c.on("focusout",function(){c.selection.lastFocusBookmark=o(u),window.setTimeout(function(){var e=r.focusedEditor;e!=c&&(c.selection.lastFocusBookmark=null),l(i())||e!=c||(c.fire("blur",{focusedEditor:null}),r.focusedEditor=null,c.selection.lastFocusBookmark=null)},0)})}r.on("AddEditor",s)}return n.isEditorUIElement=function(e){return-1!==e.className.indexOf("mce-")},n}),r(st,[it,v,O,g,p,nt,ot,at],function(e,n,r,i,o,a,s,l){var c=n.DOM,u=o.explode,d=o.each,f=o.extend,p=0,h,m={majorVersion:"4",minorVersion:"0.8",releaseDate:"2013-10-10",editors:[],i18n:s,activeEditor:null,setup:function(){var e=this,t,n,i="",o;if(n=document.location.href.replace(/[\?#].*$/,"").replace(/[\/\\][^\/]+$/,""),/[\/\\]$/.test(n)||(n+="/"),o=window.tinymce||window.tinyMCEPreInit)t=o.base||o.baseURL,i=o.suffix;else for(var a=document.getElementsByTagName("script"),s=0;s<a.length;s++){var c=a[s].src;if(/tinymce(\.jquery|)(\.min|\.dev|)\.js/.test(c)){-1!=c.indexOf(".min")&&(i=".min"),t=c.substring(0,c.lastIndexOf("/"));break}}e.baseURL=new r(n).toAbsolute(t),e.documentBaseURL=n,e.baseURI=new r(e.baseURL),e.suffix=i,e.focusManager=new l(e)},init:function(t){function n(e){var t=e.id;return t||(t=e.name,t=t&&!c.get(t)?e.name:c.uniqueId(),e.setAttribute("id",t)),t}function r(e,t,n){var r=e[t];if(r)return r.apply(n||this,Array.prototype.slice.call(arguments,2))}function i(e,t){return t.constructor===RegExp?t.test(e.className):c.hasClass(e,t)}function o(){var h,m;if(c.unbind(window,"ready",o),r(t,"onpageload"),t.types)return d(t.types,function(r){d(c.select(r.selector),function(i){var o=new e(n(i),f({},t,r),a);s.push(o),o.render(1)})}),void 0;if(t.selector)return d(c.select(t.selector),function(r){var i=new e(n(r),t,a);s.push(i),i.render(1)}),void 0;switch(t.mode){case"exact":h=t.elements||"",h.length>0&&d(u(h),function(n){c.get(n)?(l=new e(n,t,a),s.push(l),l.render(!0)):d(document.forms,function(r){d(r.elements,function(r){r.name===n&&(n="mce_editor_"+p++,c.setAttrib(r,"id",n),l=new e(n,t,a),s.push(l),l.render(1))})})});break;case"textareas":case"specific_textareas":d(c.select("textarea"),function(r){t.editor_deselector&&i(r,t.editor_deselector)||(!t.editor_selector||i(r,t.editor_selector))&&(l=new e(n(r),t,a),s.push(l),l.render(!0))})}t.oninit&&(h=m=0,d(s,function(e){m++,e.initialized?h++:e.on("init",function(){h++,h==m&&r(t,"oninit")}),h==m&&r(t,"oninit")}))}var a=this,s=[],l;a.settings=t,c.bind(window,"ready",o)},get:function(e){return e===t?this.editors:this.editors[e]},add:function(e){var t=this,n=t.editors;return n[e.id]=e,n.push(e),t.activeEditor=e,t.fire("AddEditor",{editor:e}),h||(h=function(){t.fire("BeforeUnload")},c.bind(window,"beforeunload",h)),e},createEditor:function(t,n){return this.add(new e(t,n,this))},remove:function(e){var t=this,n,r=t.editors,i,o;{if(e){if("string"==typeof e)return e=e.selector||e,d(c.select(e),function(e){t.remove(r[e.id])}),void 0;if(i=e,!r[i.id])return null;for(delete r[i.id],n=0;n<r.length;n++)if(r[n]==i){r.splice(n,1),o=!0;break}return t.activeEditor==i&&(t.activeEditor=r[0]),o&&t.fire("RemoveEditor",{editor:i}),r.length||c.unbind(window,"beforeunload",h),i.remove(),i}for(n=r.length-1;n>=0;n--)t.remove(r[n])}},execCommand:function(t,n,r){var i=this,o=i.get(r);switch(t){case"mceAddEditor":return i.get(r)||new e(r,i.settings,i).render(),!0;case"mceRemoveEditor":return o&&o.remove(),!0;case"mceToggleEditor":return o?(o.isHidden()?o.show():o.hide(),!0):(i.execCommand("mceAddEditor",0,r),!0)}return i.activeEditor?i.activeEditor.execCommand(t,n,r):!1},triggerSave:function(){d(this.editors,function(e){e.save()})},addI18n:function(e,t){s.add(e,t)},translate:function(e){return s.translate(e)}};return f(m,a),m.setup(),window.tinymce=window.tinyMCE=m,m}),r(lt,[st,p],function(e,t){var n=t.each,r=t.explode;e.on("AddEditor",function(e){var t=e.editor;t.on("preInit",function(){function e(e,t){n(t,function(t,n){t&&s.setStyle(e,n,t)}),s.rename(e,"span")}function i(e){s=t.dom,l.convert_fonts_to_spans&&n(s.select("font,u,strike",e.node),function(e){o[e.nodeName.toLowerCase()](s,e)})}var o,a,s,l=t.settings;l.inline_styles&&(a=r(l.font_size_legacy_values),o={font:function(t,n){e(n,{backgroundColor:n.style.backgroundColor,color:n.color,fontFamily:n.face,fontSize:a[parseInt(n.size,10)-1]})},u:function(t,n){e(n,{textDecoration:"underline"})},strike:function(t,n){e(n,{textDecoration:"line-through"})}},t.on("PreProcess SetContent",i))})})}),r(ct,[],function(){return{send:function(e){function t(){!e.async||4==n.readyState||r++>1e4?(e.success&&1e4>r&&200==n.status?e.success.call(e.success_scope,""+n.responseText,n,e):e.error&&e.error.call(e.error_scope,r>1e4?"TIMED_OUT":"GENERAL",n,e),n=null):setTimeout(t,10)}var n,r=0;if(e.scope=e.scope||this,e.success_scope=e.success_scope||e.scope,e.error_scope=e.error_scope||e.scope,e.async=e.async===!1?!1:!0,e.data=e.data||"",n=new XMLHttpRequest){if(n.overrideMimeType&&n.overrideMimeType(e.content_type),n.open(e.type||(e.data?"POST":"GET"),e.url,e.async),e.content_type&&n.setRequestHeader("Content-Type",e.content_type),n.setRequestHeader("X-Requested-With","XMLHttpRequest"),n.send(e.data),!e.async)return t();setTimeout(t,10)}}}}),r(ut,[],function(){function e(t,n){var r,i,o,a;if(n=n||'"',null===t)return"null";if(o=typeof t,"string"==o)return i="\bb	t\nn\ff\rr\"\"''\\\\",n+t.replace(/([\u0080-\uFFFF\x00-\x1f\"\'\\])/g,function(e,t){return'"'===n&&"'"===e?e:(r=i.indexOf(t),r+1?"\\"+i.charAt(r+1):(e=t.charCodeAt().toString(16),"\\u"+"0000".substring(e.length)+e))})+n;if("object"==o){if(t.hasOwnProperty&&"[object Array]"===Object.prototype.toString.call(t)){for(r=0,i="[";r<t.length;r++)i+=(r>0?",":"")+e(t[r],n);return i+"]"}i="{";for(a in t)t.hasOwnProperty(a)&&(i+="function"!=typeof t[a]?(i.length>1?","+n:n)+a+n+":"+e(t[a],n):"");return i+"}"}return""+t}return{serialize:e,parse:function(e){try{return window[String.fromCharCode(101)+"val"]("("+e+")")}catch(t){}}}}),r(dt,[ut,ct,p],function(e,t,n){function r(e){this.settings=i({},e),this.count=0}var i=n.extend;return r.sendRPC=function(e){return(new r).send(e)},r.prototype={send:function(n){var r=n.error,o=n.success;n=i(this.settings,n),n.success=function(t,i){t=e.parse(t),"undefined"==typeof t&&(t={error:"JSON Parse error."}),t.error?r.call(n.error_scope||n.scope,t.error,i):o.call(n.success_scope||n.scope,t.result)},n.error=function(e,t){r&&r.call(n.error_scope||n.scope,e,t)},n.data=e.serialize({id:n.id||"c"+this.count++,method:n.method,params:n.params}),n.content_type="application/json",t.send(n)}},r}),r(ft,[v],function(e){return{callbacks:{},count:0,send:function(n){var r=this,i=e.DOM,o=n.count!==t?n.count:r.count,a="tinymce_jsonp_"+o;r.callbacks[o]=function(e){i.remove(a),delete r.callbacks[o],n.callback(e)},i.add(i.doc.body,"script",{id:a,src:n.url,type:"text/javascript"}),r.count++}}}),r(pt,[],function(){function e(){s=[];for(var e in a)s.push(e);i.length=s.length}function n(){function n(e){var n,r;return r=e!==t?u+e:i.indexOf(",",u),-1===r||r>i.length?null:(n=i.substring(u,r),u=r+1,n)}var r,i,s,u=0;if(a={},c){o.load(l),i=o.getAttribute(l)||"";do r=n(parseInt(n(),32)||0),null!==r&&(s=n(parseInt(n(),32)||0),a[r]=s);while(null!==r);e()}}function r(){var t,n="";if(c){for(var r in a)t=a[r],n+=(n?",":"")+r.length.toString(32)+","+r+","+t.length.toString(32)+","+t;o.setAttribute(l,n),o.save(l),e()}}var i,o,a,s,l,c;try{if(window.localStorage)return localStorage}catch(u){}return l="tinymce",o=document.documentElement,c=!!o.addBehavior,c&&o.addBehavior("#default#userData"),i={key:function(e){return s[e]},getItem:function(e){return e in a?a[e]:null},setItem:function(e,t){a[e]=""+t,r()},removeItem:function(e){delete a[e],r()},clear:function(){a={},r()}},n(),i}),r(ht,[v,l,y,b,p,g],function(e,t,n,r,i,o){var a=window.tinymce;return a.DOM=e.DOM,a.ScriptLoader=n.ScriptLoader,a.PluginManager=r.PluginManager,a.ThemeManager=r.ThemeManager,a.dom=a.dom||{},a.dom.Event=t.Event,i.each(i,function(e,t){a[t]=e}),i.each("isOpera isWebKit isIE isGecko isMac".split(" "),function(e){a[e]=o[e.substr(2).toLowerCase()]}),{}}),r(mt,[I,p],function(e,t){return e.extend({Defaults:{firstControlClass:"first",lastControlClass:"last"},init:function(e){this.settings=t.extend({},this.Defaults,e)},preRender:function(e){e.addClass(this.settings.containerClass,"body")},applyClasses:function(e){var t=this,n=t.settings,r,i,o;r=e.items().filter(":visible"),i=n.firstControlClass,o=n.lastControlClass,r.each(function(e){e.removeClass(i).removeClass(o),n.controlClass&&e.addClass(n.controlClass)}),r.eq(0).addClass(i),r.eq(-1).addClass(o)},renderHtml:function(e){var t=this,n=t.settings,r,i="";return r=e.items(),r.eq(0).addClass(n.firstControlClass),r.eq(-1).addClass(n.lastControlClass),r.each(function(e){n.controlClass&&e.addClass(n.controlClass),i+=e.renderHtml()}),i},recalc:function(){},postRender:function(){}})}),r(gt,[mt],function(e){return e.extend({Defaults:{containerClass:"abs-layout",controlClass:"abs-layout-item"},recalc:function(e){e.items().filter(":visible").each(function(e){var t=e.settings;e.layoutRect({x:t.x,y:t.y,w:t.w,h:t.h}),e.recalc&&e.recalc()})},renderHtml:function(e){return'<div id="'+e._id+'-absend" class="'+e.classPrefix+'abs-end"></div>'+this._super(e)}})}),r(vt,[V,G],function(e,t){return e.extend({Mixins:[t],Defaults:{classes:"widget tooltip tooltip-n"},text:function(e){var t=this;return"undefined"!=typeof e?(t._value=e,t._rendered&&(t.getEl().lastChild.innerHTML=t.encode(e)),t):t._value},renderHtml:function(){var e=this,t=e.classPrefix;return'<div id="'+e._id+'" class="'+e.classes()+'" role="presentation">'+'<div class="'+t+'tooltip-arrow"></div>'+'<div class="'+t+'tooltip-inner">'+e.encode(e._text)+"</div>"+"</div>"},repaint:function(){var e=this,t,n;t=e.getEl().style,n=e._layoutRect,t.left=n.x+"px",t.top=n.y+"px",t.zIndex=131070}})}),r(yt,[V,vt],function(e,t){var n,r=e.extend({init:function(e){var t=this;t._super(e),t.canFocus=!0,e.tooltip&&r.tooltips!==!1&&t.on("mouseenter mouseleave",function(n){var r=t.tooltip().moveTo(-65535);if(n.control==t&&"mouseenter"==n.type){var i=r.text(e.tooltip).show().testMoveRel(t.getEl(),["bc-tc","bc-tl","bc-tr"]);r.toggleClass("tooltip-n","bc-tc"==i),r.toggleClass("tooltip-nw","bc-tl"==i),r.toggleClass("tooltip-ne","bc-tr"==i),r.moveRel(t.getEl(),i)}else r.hide()}),t.aria("label",e.tooltip)},tooltip:function(){var e=this;return n||(n=new t({type:"tooltip"}),n.renderTo(e.getContainerElm())),n},active:function(e){var t=this,n;return e!==n&&(t.aria("pressed",e),t.toggleClass("active",e)),t._super(e)},disabled:function(e){var t=this,n;return e!==n&&(t.aria("disabled",e),t.toggleClass("disabled",e)),t._super(e)},postRender:function(){var e=this,t=e.settings;e._rendered=!0,e._super(),e.parent()||!t.width&&!t.height||(e.initLayoutRect(),e.repaint()),t.autofocus&&setTimeout(function(){e.focus()},0)},remove:function(){this._super(),n&&(n.remove(),n=null)}});return r}),r(bt,[yt],function(e){return e.extend({Defaults:{classes:"widget btn",role:"button"},init:function(e){var t=this,n;t.on("click mousedown",function(e){e.preventDefault()}),t._super(e),n=e.size,e.subtype&&t.addClass(e.subtype),n&&t.addClass("btn-"+n)},repaint:function(){var e=this.getEl().firstChild.style;e.width=e.height="100%",this._super()},renderHtml:function(){var e=this,t=e._id,n=e.classPrefix,r=e.settings.icon,i="";return e.settings.image&&(r="none",i=" style=\"background-image: url('"+e.settings.image+"')\""),r=e.settings.icon?n+"ico "+n+"i-"+r:"",'<div id="'+t+'" class="'+e.classes()+'" tabindex="-1">'+'<button role="presentation" type="button" tabindex="-1">'+(r?'<i class="'+r+'"'+i+"></i>":"")+(e._text?(r?"\xa0":"")+e.encode(e._text):"")+"</button>"+"</div>"}})}),r(Ct,[q],function(e){return e.extend({Defaults:{defaultType:"button",role:"toolbar"},renderHtml:function(){var e=this,t=e._layout;return e.addClass("btn-group"),e.preRender(),t.preRender(e),'<div id="'+e._id+'" class="'+e.classes()+'">'+'<div id="'+e._id+'-body">'+(e.settings.html||"")+t.renderHtml(e)+"</div>"+"</div>"}})}),r(xt,[yt],function(e){return e.extend({Defaults:{classes:"checkbox",role:"checkbox",checked:!1},init:function(e){var t=this;t._super(e),t.on("click mousedown",function(e){e.preventDefault()}),t.on("click",function(e){e.preventDefault(),t.disabled()||t.checked(!t.checked())}),t.checked(t.settings.checked)},checked:function(e){var t=this;return"undefined"!=typeof e?(e?t.addClass("checked"):t.removeClass("checked"),t._checked=e,t.aria("checked",e),t):t._checked},value:function(e){return this.checked(e)},renderHtml:function(){var e=this,t=e._id,n=e.classPrefix;return'<div id="'+t+'" class="'+e.classes()+'" unselectable="on" aria-labeledby="'+t+'-al" tabindex="-1">'+'<i class="'+n+"ico "+n+'i-checkbox"></i>'+'<span id="'+t+'-al" class="'+n+'label">'+e.encode(e._text)+"</span>"+"</div>"}})}),r(wt,[bt,X],function(e,t){return e.extend({showPanel:function(){var e=this,n=e.settings;if(e.active(!0),e.panel)e.panel.show();else{var r=n.panel;r.type&&(r={layout:"grid",items:r}),r.popover=!0,r.autohide=!0,e.panel=new t(r).on("hide",function(){e.active(!1)}).parent(e).renderTo(e.getContainerElm()),e.panel.fire("show"),e.panel.reflow()}e.panel.moveRel(e.getEl(),n.popoverAlign||(e.isRtl()?["bc-tr","bc-tc"]:["bc-tl","bc-tc"]))},hidePanel:function(){var e=this;e.panel&&e.panel.hide()},postRender:function(){var e=this;return e.on("click",function(t){t.control===e&&(e.panel&&e.panel.visible()?e.hidePanel():e.showPanel())}),e._super()}})}),r(_t,[wt,v],function(e,t){var n=t.DOM;return e.extend({init:function(e){this._super(e),this.addClass("colorbutton")},color:function(e){return e?(this._color=e,this.getEl("preview").style.backgroundColor=e,this):this._color},renderHtml:function(){var e=this,t=e._id,n=e.classPrefix,r=e.settings.icon?n+"ico "+n+"i-"+e.settings.icon:"",i=e.settings.image?" style=\"background-image: url('"+e.settings.image+"')\"":"";return'<div id="'+t+'" class="'+e.classes()+'">'+'<button role="presentation" hidefocus type="button" tabindex="-1">'+(r?'<i class="'+r+'"'+i+"></i>":"")+'<span id="'+t+'-preview" class="'+n+'preview"></span>'+(e._text?(r?" ":"")+e._text:"")+"</button>"+'<button type="button" class="'+n+'open" hidefocus tabindex="-1">'+' <i class="'+n+'caret"></i>'+"</button>"+"</div>"},postRender:function(){var e=this,t=e.settings.onclick;return e.on("click",function(r){r.control!=e||n.getParent(r.target,"."+e.classPrefix+"open")||(r.stopImmediatePropagation(),t.call(e,r))}),delete e.settings.onclick,e._super()}})}),r(Nt,[yt,W],function(e,t){return e.extend({init:function(e){var n=this;n._super(e),n.addClass("combobox"),n.on("click",function(e){for(var t=e.target;t;)t.id&&-1!=t.id.indexOf("-open")&&n.fire("action"),t=t.parentNode}),n.on("keydown",function(e){"INPUT"==e.target.nodeName&&13==e.keyCode&&n.parents().reverse().each(function(t){return e.preventDefault(),n.fire("change"),t.hasEventListeners("submit")&&t.toJSON?(t.fire("submit",{data:t.toJSON()}),!1):void 0})}),e.placeholder&&(n.addClass("placeholder"),n.on("focusin",function(){n._hasOnChange||(t.on(n.getEl("inp"),"change",function(){n.fire("change")}),n._hasOnChange=!0),n.hasClass("placeholder")&&(n.getEl("inp").value="",n.removeClass("placeholder"))}),n.on("focusout",function(){0===n.value().length&&(n.getEl("inp").value=e.placeholder,n.addClass("placeholder"))}))},value:function(e){var t=this;return"undefined"!=typeof e?(t._value=e,t.removeClass("placeholder"),t._rendered&&(t.getEl("inp").value=e),t):t._rendered?(e=t.getEl("inp").value,e!=t.settings.placeholder?e:""):t._value},disabled:function(e){var t=this;return t._rendered&&"undefined"!=typeof e&&(t.getEl("inp").disabled=e),t._super(e)},focus:function(){this.getEl("inp").focus()},repaint:function(){var e=this,n=e.getEl(),r=e.getEl("open"),i=e.layoutRect(),o,a;o=r?i.w-t.getSize(r).width-10:i.w-10;var s=document;return s.all&&(!s.documentMode||s.documentMode<=8)&&(a=e.layoutRect().h-2+"px"),t.css(n.firstChild,{width:o,lineHeight:a}),e._super(),e},postRender:function(){var e=this;return t.on(this.getEl("inp"),"change",function(){e.fire("change")}),e._super()},remove:function(){t.off(this.getEl("inp")),this._super()},renderHtml:function(){var e=this,t=e._id,n=e.settings,r=e.classPrefix,i=n.value||n.placeholder||"",o,a,s="";return o=n.icon?r+"ico "+r+"i-"+n.icon:"",a=e._text,(o||a)&&(s='<div id="'+t+'-open" class="'+r+"btn "+r+'open" tabIndex="-1">'+'<button id="'+t+'-action" type="button" hidefocus tabindex="-1">'+(o?'<i class="'+o+'"></i>':'<i class="'+r+'caret"></i>')+(a?(o?" ":"")+a:"")+"</button>"+"</div>",e.addClass("has-open")),'<div id="'+t+'" class="'+e.classes()+'">'+'<input id="'+t+'-inp" class="'+r+"textbox "+r+'placeholder" value="'+i+'" hidefocus="true"'+(e.disabled()?' disabled="disabled"':"")+">"+s+"</div>"}})}),r(Et,[yt,J],function(e,t){return e.extend({init:function(e){var t=this;e.delimiter||(e.delimiter="\xbb"),t._super(e),t.addClass("path"),t.canFocus=!0,t.on("click",function(e){var n,r=e.target;(n=r.getAttribute("data-index"))&&t.fire("select",{value:t.data()[n],index:n})})},focus:function(){var e=this;return e.keyNav=new t({root:e,enableLeftRight:!0}),e.keyNav.focusFirst(),e},data:function(e){var t=this;return"undefined"!=typeof e?(t._data=e,t.update(),t):t._data},update:function(){this.innerHtml(this._getPathHtml())},postRender:function(){var e=this;e._super(),e.data(e.settings.data)},renderHtml:function(){var e=this;return'<div id="'+e._id+'" class="'+e.classes()+'">'+e._getPathHtml()+"</div>"},_getPathHtml:function(){var e=this,t=e._data||[],n,r,i="",o=e.classPrefix;for(n=0,r=t.length;r>n;n++)i+=(n>0?'<div class="'+o+'divider" aria-hidden="true"> '+e.settings.delimiter+" </div>":"")+'<div role="button" class="'+o+"path-item"+(n==r-1?" "+o+"last":"")+'" data-index="'+n+'" tabindex="-1" id="'+e._id+"-"+n+'">'+t[n].name+"</div>";return i||(i='<div class="'+o+'path-item">&nbsp;</div>'),i}})}),r(St,[Et,st],function(e,t){return e.extend({postRender:function(){function e(e){return 1===e.nodeType&&("BR"==e.nodeName||!!e.getAttribute("data-mce-bogus"))}var n=this,r=t.activeEditor;return n.on("select",function(t){var n=[],i,o=r.getBody();for(r.focus(),i=r.selection.getStart();i&&i!=o;)e(i)||n.push(i),i=i.parentNode;r.selection.select(n[n.length-1-t.index]),r.nodeChanged()}),r.on("nodeChange",function(t){for(var i=[],o=t.parents,a=o.length;a--;)if(1==o[a].nodeType&&!e(o[a])){var s=r.fire("ResolveName",{name:o[a].nodeName.toLowerCase(),target:o[a]});i.push({name:s.name})}n.data(i)}),n._super()}})}),r(kt,[q],function(e){return e.extend({Defaults:{layout:"flex",align:"center",defaults:{flex:1}},renderHtml:function(){var e=this,t=e._layout,n=e.classPrefix;return e.addClass("formitem"),t.preRender(e),'<div id="'+e._id+'" class="'+e.classes()+'" hideFocus="1" tabIndex="-1">'+(e.settings.title?'<div id="'+e._id+'-title" class="'+n+'title">'+e.settings.title+"</div>":"")+'<div id="'+e._id+'-body" class="'+e.classes("body")+'">'+(e.settings.html||"")+t.renderHtml(e)+"</div>"+"</div>"}})}),r(Tt,[q,kt],function(e,t){return e.extend({Defaults:{containerCls:"form",layout:"flex",direction:"column",align:"stretch",flex:1,padding:20,labelGap:30,spacing:10,callbacks:{submit:function(){this.submit()}}},preRender:function(){var e=this,n=e.items();n.each(function(n){var r,i=n.settings.label;i&&(r=new t({layout:"flex",autoResize:"overflow",defaults:{flex:1},items:[{type:"label",text:i,flex:0,forId:n._id}]}),r.type="formitem","undefined"==typeof n.settings.flex&&(n.settings.flex=1),e.replace(n,r),r.add(n))})},recalcLabels:function(){var e=this,t=0,n=[],r,i;if(e.settings.labelGapCalc!==!1)for(e.items().filter("formitem").each(function(e){var r=e.items()[0],i=r.getEl().clientWidth;t=i>t?i:t,n.push(r)}),i=e.settings.labelGap||0,r=n.length;r--;)n[r].settings.minWidth=t+i},visible:function(e){var t=this._super(e);return e===!0&&this._rendered&&this.recalcLabels(),t},submit:function(){return this.fire("submit",{data:this.toJSON()})},postRender:function(){var e=this;e._super(),e.recalcLabels(),e.fromJSON(e.settings.data)}})}),r(Rt,[Tt],function(e){return e.extend({Defaults:{containerCls:"fieldset",layout:"flex",direction:"column",align:"stretch",flex:1,padding:"25 15 5 15",labelGap:30,spacing:10,border:1},renderHtml:function(){var e=this,t=e._layout,n=e.classPrefix;return e.preRender(),t.preRender(e),'<fieldset id="'+e._id+'" class="'+e.classes()+'" hideFocus="1" tabIndex="-1">'+(e.settings.title?'<legend id="'+e._id+'-title" class="'+n+'fieldset-title">'+e.settings.title+"</legend>":"")+'<div id="'+e._id+'-body" class="'+e.classes("body")+'">'+(e.settings.html||"")+t.renderHtml(e)+"</div>"+"</fieldset>"}})}),r(At,[Nt],function(e){return e.extend({init:function(e){var t=this,n=tinymce.activeEditor,r;e.spellcheck=!1,r=n.settings.file_browser_callback,r&&(e.icon="browse",e.onaction=function(){r(t.getEl("inp").id,t.getEl("inp").value,e.filetype,window)}),t._super(e)}})}),r(Bt,[gt],function(e){return e.extend({recalc:function(e){var t=e.layoutRect(),n=e.paddingBox();e.items().filter(":visible").each(function(e){e.layoutRect({x:n.left,y:n.top,w:t.innerW-n.right-n.left,h:t.innerH-n.top-n.bottom}),e.recalc&&e.recalc()})}})}),r(Lt,[gt],function(e){return e.extend({recalc:function(e){var t,n,r,i,o,a,s,l,c,u,d,f,p,h,m,g,v=[],y,b,C,x,w,_,N,E,S,k,T,R,A,B,L,H,D,M,P,O,I,F,z,W,V=Math.max,U=Math.min;for(r=e.items().filter(":visible"),i=e.layoutRect(),o=e._paddingBox,a=e.settings,f=e.isRtl()?a.direction||"row-reversed":a.direction,s=a.align,l=e.isRtl()?a.pack||"end":a.pack,c=a.spacing||0,("row-reversed"==f||"column-reverse"==f)&&(r=r.set(r.toArray().reverse()),f=f.split("-")[0]),"column"==f?(S="y",N="h",E="minH",k="maxH",R="innerH",T="top",A="bottom",B="deltaH",L="contentH",I="left",M="w",H="x",D="innerW",P="minW",O="maxW",F="right",z="deltaW",W="contentW"):(S="x",N="w",E="minW",k="maxW",R="innerW",T="left",A="right",B="deltaW",L="contentW",I="top",M="h",H="y",D="innerH",P="minH",O="maxH",F="bottom",z="deltaH",W="contentH"),d=i[R]-o[T]-o[T],_=u=0,t=0,n=r.length;n>t;t++)p=r[t],h=p.layoutRect(),m=p.settings,g=m.flex,d-=n-1>t?c:0,g>0&&(u+=g,h[k]&&v.push(p),h.flex=g),d-=h[E],y=o[I]+h[P]+o[F],y>_&&(_=y);if(x={},x[E]=0>d?i[E]-d+i[B]:i[R]-d+i[B],x[P]=_+i[z],x[L]=i[R]-d,x[W]=_,x.minW=U(x.minW,i.maxW),x.minH=U(x.minH,i.maxH),x.minW=V(x.minW,i.startMinWidth),x.minH=V(x.minH,i.startMinHeight),!i.autoResize||x.minW==i.minW&&x.minH==i.minH){for(C=d/u,t=0,n=v.length;n>t;t++)p=v[t],h=p.layoutRect(),b=h[k],y=h[E]+Math.ceil(h.flex*C),y>b?(d-=h[k]-h[E],u-=h.flex,h.flex=0,h.maxFlexSize=b):h.maxFlexSize=0;for(C=d/u,w=o[T],x={},0===u&&("end"==l?w=d+o[T]:"center"==l?(w=Math.round(i[R]/2-(i[R]-d)/2)+o[T],0>w&&(w=o[T])):"justify"==l&&(w=o[T],c=Math.floor(d/(r.length-1)))),x[H]=o[I],t=0,n=r.length;n>t;t++)p=r[t],h=p.layoutRect(),y=h.maxFlexSize||h[E],"center"===s?x[H]=Math.round(i[D]/2-h[M]/2):"stretch"===s?(x[M]=V(h[P]||0,i[D]-o[I]-o[F]),x[H]=o[I]):"end"===s&&(x[H]=i[D]-h[M]-o.top),h.flex>0&&(y+=Math.ceil(h.flex*C)),x[N]=y,x[S]=w,p.layoutRect(x),p.recalc&&p.recalc(),w+=y+c}else if(x.w=x.minW,x.h=x.minH,e.layoutRect(x),this.recalc(e),null===e._lastRect){var q=e.parent();q&&(q._lastRect=null,q.recalc())}}})}),r(Ht,[mt],function(e){return e.extend({Defaults:{containerClass:"flow-layout",controlClass:"flow-layout-item",endClass:"break"},recalc:function(e){e.items().filter(":visible").each(function(e){e.recalc&&e.recalc()})}})}),r(Dt,[V,yt,X,p,st,g],function(e,t,n,r,i,o){function a(e){function t(t){function n(e){return e.replace(/%(\w+)/g,"")}var r,i,o=e.dom,a="",l,c;return c=e.settings.preview_styles,c===!1?"":(c||(c="font-family font-size font-weight text-decoration text-transform color background-color border border-radius"),(t=e.formatter.get(t))?(t=t[0],r=t.block||t.inline||"span",i=o.create(r),s(t.styles,function(e,t){e=n(e),e&&o.setStyle(i,t,e)}),s(t.attributes,function(e,t){e=n(e),e&&o.setAttrib(i,t,e)}),s(t.classes,function(e){e=n(e),o.hasClass(i,e)||o.addClass(i,e)}),e.fire("PreviewFormats"),o.setStyles(i,{position:"absolute",left:-65535}),e.getBody().appendChild(i),l=o.getStyle(e.getBody(),"fontSize",!0),l=/px$/.test(l)?parseInt(l,10):0,s(c.split(" "),function(t){var n=o.getStyle(i,t,!0);if(!("background-color"==t&&/transparent|rgba\s*\([^)]+,\s*0\)/.test(n)&&(n=o.getStyle(e.getBody(),t,!0),"#ffffff"==o.toHex(n).toLowerCase())||"color"==t&&"#000000"==o.toHex(n).toLowerCase())){if("font-size"==t&&/em|%$/.test(n)){if(0===l)return;n=parseFloat(n,10)/(/%$/.test(n)?100:1),n=n*l+"px"}"border"==t&&n&&(a+="padding:0 2px;"),a+=t+":"+n+";"}}),e.fire("AfterPreviewFormats"),o.remove(i),a):void 0)}function r(t,n){return function(){var r=this;e.on("nodeChange",function(i){var o=e.formatter,a=null;s(i.parents,function(e){return s(t,function(t){return n?o.matchNode(e,n,{value:t.value})&&(a=t.value):o.matchNode(e,t.value)&&(a=t.value),a?!1:void 0}),a?!1:void 0}),r.value(a)})}}function i(e){e=e.split(";");for(var t=e.length;t--;)e[t]=e[t].split("=");return e}function o(){function n(e){var t=[];if(e)return s(e,function(e){var o={text:e.title,icon:e.icon};if(e.items)o.menu=n(e.items);else{var a=e.format||"custom"+r++;e.format||(e.name=a,i.push(e)),o.format=a}t.push(o)}),t}var r=0,i=[],o=[{title:"Headers",items:[{title:"Header 1",format:"h1"},{title:"Header 2",format:"h2"},{title:"Header 3",format:"h3"},{title:"Header 4",format:"h4"},{title:"Header 5",format:"h5"},{title:"Header 6",format:"h6"}]},{title:"Inline",items:[{title:"Bold",icon:"bold",format:"bold"},{title:"Italic",icon:"italic",format:"italic"},{title:"Underline",icon:"underline",format:"underline"},{title:"Strikethrough",icon:"strikethrough",format:"strikethrough"},{title:"Superscript",icon:"superscript",format:"superscript"},{title:"Subscript",icon:"subscript",format:"subscript"},{title:"Code",icon:"code",format:"code"}]},{title:"Blocks",items:[{title:"Paragraph",format:"p"},{title:"Blockquote",format:"blockquote"},{title:"Div",format:"div"},{title:"Pre",format:"pre"}]},{title:"Alignment",items:[{title:"Left",icon:"alignleft",format:"alignleft"},{title:"Center",icon:"aligncenter",format:"aligncenter"},{title:"Right",icon:"alignright",format:"alignright"},{title:"Justify",icon:"alignjustify",format:"alignjustify"}]}];e.on("init",function(){s(i,function(t){e.formatter.register(t.name,t)})});var a=n(e.settings.style_formats||o);return a={type:"menu",items:a,onPostRender:function(t){e.fire("renderFormatsMenu",{control:t.control})},itemDefaults:{preview:!0,textStyle:function(){return this.settings.format?t(this.settings.format):void 0},onPostRender:function(){var t=this,n=this.settings.format;n&&t.parent().on("show",function(){t.disabled(!e.formatter.canApply(n)),t.active(e.formatter.match(n))})},onclick:function(){this.settings.format&&f(this.settings.format)}}}}function a(){return e.undoManager?e.undoManager.hasUndo():!1}function l(){return e.undoManager?e.undoManager.hasRedo():!1}function c(){var t=this;t.disabled(!a()),e.on("Undo Redo AddUndo TypingUndo",function(){t.disabled(!a())})}function u(){var t=this;t.disabled(!l()),e.on("Undo Redo AddUndo TypingUndo",function(){t.disabled(!l())})}function d(){var t=this;e.on("VisualAid",function(e){t.active(e.hasVisual)}),t.active(e.hasVisual)}function f(t){t.control&&(t=t.control.value()),t&&e.execCommand("mceToggleFormat",!1,t)}var p;p=o(),s({bold:"Bold",italic:"Italic",underline:"Underline",strikethrough:"Strikethrough",subscript:"Subscript",superscript:"Superscript"},function(t,n){e.addButton(n,{tooltip:t,onPostRender:function(){var t=this;e.formatter?e.formatter.formatChanged(n,function(e){t.active(e)}):e.on("init",function(){e.formatter.formatChanged(n,function(e){t.active(e)})})},onclick:function(){f(n)}})}),s({outdent:["Decrease indent","Outdent"],indent:["Increase indent","Indent"],cut:["Cut","Cut"],copy:["Copy","Copy"],paste:["Paste","Paste"],help:["Help","mceHelp"],selectall:["Select all","SelectAll"],hr:["Insert horizontal rule","InsertHorizontalRule"],removeformat:["Clear formatting","RemoveFormat"],visualaid:["Visual aids","mceToggleVisualAid"],newdocument:["New document","mceNewDocument"]},function(t,n){e.addButton(n,{tooltip:t[0],cmd:t[1]})}),s({blockquote:["Toggle blockquote","mceBlockQuote"],numlist:["Numbered list","InsertOrderedList"],bullist:["Bullet list","InsertUnorderedList"],subscript:["Subscript","Subscript"],superscript:["Superscript","Superscript"],alignleft:["Align left","JustifyLeft"],aligncenter:["Align center","JustifyCenter"],alignright:["Align right","JustifyRight"],alignjustify:["Justify","JustifyFull"]},function(t,n){e.addButton(n,{tooltip:t[0],cmd:t[1],onPostRender:function(){var t=this;e.formatter?e.formatter.formatChanged(n,function(e){t.active(e)}):e.on("init",function(){e.formatter.formatChanged(n,function(e){t.active(e)})})}})}),e.addButton("undo",{tooltip:"Undo",onPostRender:c,cmd:"undo"}),e.addButton("redo",{tooltip:"Redo",onPostRender:u,cmd:"redo"}),e.addMenuItem("newdocument",{text:"New document",shortcut:"Ctrl+N",icon:"newdocument",cmd:"mceNewDocument"}),e.addMenuItem("undo",{text:"Undo",icon:"undo",shortcut:"Ctrl+Z",onPostRender:c,cmd:"undo"}),e.addMenuItem("redo",{text:"Redo",icon:"redo",shortcut:"Ctrl+Y",onPostRender:u,cmd:"redo"}),e.addMenuItem("visualaid",{text:"Visual aids",selectable:!0,onPostRender:d,cmd:"mceToggleVisualAid"}),s({cut:["Cut","Cut","Ctrl+X"],copy:["Copy","Copy","Ctrl+C"],paste:["Paste","Paste","Ctrl+V"],selectall:["Select all","SelectAll","Ctrl+A"],bold:["Bold","Bold","Ctrl+B"],italic:["Italic","Italic","Ctrl+I"],underline:["Underline","Underline"],strikethrough:["Strikethrough","Strikethrough"],subscript:["Subscript","Subscript"],superscript:["Superscript","Superscript"],removeformat:["Clear formatting","RemoveFormat"]},function(t,n){e.addMenuItem(n,{text:t[0],icon:n,shortcut:t[2],cmd:t[1]})}),e.on("mousedown",function(){n.hideAll()}),e.addButton("styleselect",{type:"menubutton",text:"Formats",menu:p}),e.addButton("formatselect",function(){var n=[],o=i(e.settings.block_formats||"Paragraph=p;Address=address;Pre=pre;Header 1=h1;Header 2=h2;Header 3=h3;Header 4=h4;Header 5=h5;Header 6=h6");
return s(o,function(e){n.push({text:e[0],value:e[1],textStyle:function(){return t(e[1])}})}),{type:"listbox",text:{raw:o[0][0]},values:n,fixedWidth:!0,onselect:f,onPostRender:r(n)}}),e.addButton("fontselect",function(){var t="Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats",n=[],o=i(e.settings.font_formats||t);return s(o,function(e){n.push({text:{raw:e[0]},value:e[1],textStyle:-1==e[1].indexOf("dings")?"font-family:"+e[1]:""})}),{type:"listbox",text:"Font Family",tooltip:"Font Family",values:n,fixedWidth:!0,onPostRender:r(n,"fontname"),onselect:function(t){t.control.settings.value&&e.execCommand("FontName",!1,t.control.settings.value)}}}),e.addButton("fontsizeselect",function(){var t=[],n="8pt 10pt 12pt 14pt 18pt 24pt 36pt",i=e.settings.fontsize_formats||n;return s(i.split(" "),function(e){t.push({text:e,value:e})}),{type:"listbox",text:"Font Sizes",tooltip:"Font Sizes",values:t,fixedWidth:!0,onPostRender:r(t,"fontsize"),onclick:function(t){t.control.settings.value&&e.execCommand("FontSize",!1,t.control.settings.value)}}}),e.addMenuItem("formats",{text:"Formats",menu:p})}var s=r.each;i.on("AddEditor",function(t){t.editor.rtl&&(e.rtl=!0),a(t.editor)}),e.translate=function(e){return i.translate(e)},t.tooltips=!o.iOS}),r(Mt,[gt],function(e){return e.extend({recalc:function(e){var t=e.settings,n,r,i,o,a,s,l,c,u,d,f,p,h,m,g,v,y,b,C,x,w,_,N=[],E=[],S,k,T,R,A,B;for(t=e.settings,i=e.items().filter(":visible"),o=e.layoutRect(),r=t.columns||Math.ceil(Math.sqrt(i.length)),n=Math.ceil(i.length/r),y=t.spacingH||t.spacing||0,b=t.spacingV||t.spacing||0,C=t.alignH||t.align,x=t.alignV||t.align,g=e._paddingBox,C&&"string"==typeof C&&(C=[C]),x&&"string"==typeof x&&(x=[x]),d=0;r>d;d++)N.push(0);for(f=0;n>f;f++)E.push(0);for(f=0;n>f;f++)for(d=0;r>d&&(u=i[f*r+d],u);d++)c=u.layoutRect(),S=c.minW,k=c.minH,N[d]=S>N[d]?S:N[d],E[f]=k>E[f]?k:E[f];for(A=o.innerW-g.left-g.right,w=0,d=0;r>d;d++)w+=N[d]+(d>0?y:0),A-=(d>0?y:0)+N[d];for(B=o.innerH-g.top-g.bottom,_=0,f=0;n>f;f++)_+=E[f]+(f>0?b:0),B-=(f>0?b:0)+E[f];if(w+=g.left+g.right,_+=g.top+g.bottom,l={},l.minW=w+(o.w-o.innerW),l.minH=_+(o.h-o.innerH),l.contentW=l.minW-o.deltaW,l.contentH=l.minH-o.deltaH,l.minW=Math.min(l.minW,o.maxW),l.minH=Math.min(l.minH,o.maxH),l.minW=Math.max(l.minW,o.startMinWidth),l.minH=Math.max(l.minH,o.startMinHeight),!o.autoResize||l.minW==o.minW&&l.minH==o.minH){o.autoResize&&(l=e.layoutRect(l),l.contentW=l.minW-o.deltaW,l.contentH=l.minH-o.deltaH);var L;L="start"==t.packV?0:B>0?Math.floor(B/n):0;var H=0,D=t.flexWidths;if(D)for(d=0;d<D.length;d++)H+=D[d];else H=r;var M=A/H;for(d=0;r>d;d++)N[d]+=D?Math.ceil(D[d]*M):M;for(h=g.top,f=0;n>f;f++){for(p=g.left,s=E[f]+L,d=0;r>d&&(u=i[f*r+d],u);d++)m=u.settings,c=u.layoutRect(),a=N[d],T=R=0,c.x=p,c.y=h,v=m.alignH||(C?C[d]||C[0]:null),"center"==v?c.x=p+a/2-c.w/2:"right"==v?c.x=p+a-c.w:"stretch"==v&&(c.w=a),v=m.alignV||(x?x[d]||x[0]:null),"center"==v?c.y=h+s/2-c.h/2:"bottom"==v?c.y=h+s-c.h:"stretch"==v&&(c.h=s),u.layoutRect(c),p+=a+y,u.recalc&&u.recalc();h+=s+b}}else if(l.w=l.minW,l.h=l.minH,e.layoutRect(l),this.recalc(e),null===e._lastRect){var P=e.parent();P&&(P._lastRect=null,P.recalc())}}})}),r(Pt,[yt],function(e){return e.extend({renderHtml:function(){var e=this;return e.addClass("iframe"),e.canFocus=!1,'<iframe id="'+e._id+'" class="'+e.classes()+'" tabindex="-1" src="'+(e.settings.url||"javascript:''")+'" frameborder="0"></iframe>'},src:function(e){this.getEl().src=e},html:function(e,t){var n=this,r=this.getEl().contentWindow.document.body;return r?(r.innerHTML=e,t&&t()):setTimeout(function(){n.html(e)},0),this}})}),r(Ot,[yt,W],function(e,t){return e.extend({init:function(e){var t=this;t._super(e),t.addClass("widget"),t.addClass("label"),t.canFocus=!1,e.multiline&&t.addClass("autoscroll"),e.strong&&t.addClass("strong")},initLayoutRect:function(){var e=this,n=e._super();if(e.settings.multiline){var r=t.getSize(e.getEl());r.width>n.maxW&&(n.minW=n.maxW,e.addClass("multiline")),e.getEl().style.width=n.minW+"px",n.startMinH=n.h=n.minH=Math.min(n.maxH,t.getSize(e.getEl()).height)}return n},repaint:function(){var e=this;return e.settings.multiline||(e.getEl().style.lineHeight=e.layoutRect().h+"px"),e._super()},text:function(e){var t=this;return t._rendered&&e&&this.innerHtml(t.encode(e)),t._super(e)},renderHtml:function(){var e=this,t=e.settings.forId;return'<label id="'+e._id+'" class="'+e.classes()+'"'+(t?' for="'+t:"")+'">'+e.encode(e._text)+"</label>"}})}),r(It,[q,J],function(e,t){return e.extend({Defaults:{role:"toolbar",layout:"flow"},init:function(e){var t=this;t._super(e),t.addClass("toolbar")},postRender:function(){var e=this;return e.items().addClass("toolbar-item"),e.keyNav=new t({root:e,enableLeftRight:!0}),e._super()}})}),r(Ft,[It],function(e){return e.extend({Defaults:{role:"menubar",containerCls:"menubar",defaults:{type:"menubutton"}}})}),r(zt,[bt,U,Ft],function(e,t,n){function r(e,t){for(;e;){if(t===e)return!0;e=e.parentNode}return!1}var i=e.extend({init:function(e){var t=this;t._renderOpen=!0,t._super(e),t.addClass("menubtn"),e.fixedWidth&&t.addClass("fixed-width"),t.aria("haspopup",!0),t.hasPopup=!0},showMenu:function(){var e=this,n=e.settings,r;return e.menu&&e.menu.visible()?e.hideMenu():(e.menu||(r=n.menu||[],r.length?r={type:"menu",items:r}:r.type=r.type||"menu",e.menu=t.create(r).parent(e).renderTo(e.getContainerElm()),e.fire("createmenu"),e.menu.reflow(),e.menu.on("cancel",function(t){t.control===e.menu&&e.focus()}),e.menu.on("show hide",function(t){t.control==e.menu&&e.activeMenu("show"==t.type)}).fire("show"),e.aria("expanded",!0)),e.menu.show(),e.menu.layoutRect({w:e.layoutRect().w}),e.menu.moveRel(e.getEl(),e.isRtl()?["br-tr","tr-br"]:["bl-tl","tl-bl"]),void 0)},hideMenu:function(){var e=this;e.menu&&(e.menu.items().each(function(e){e.hideMenu&&e.hideMenu()}),e.menu.hide(),e.aria("expanded",!1))},activeMenu:function(e){this.toggleClass("active",e)},renderHtml:function(){var e=this,t=e._id,r=e.classPrefix,i=e.settings.icon?r+"ico "+r+"i-"+e.settings.icon:"";return e.aria("role",e.parent()instanceof n?"menuitem":"button"),'<div id="'+t+'" class="'+e.classes()+'" tabindex="-1">'+'<button id="'+t+'-open" role="presentation" type="button" tabindex="-1">'+(i?'<i class="'+i+'"></i>':"")+"<span>"+(e._text?(i?"\xa0":"")+e.encode(e._text):"")+"</span>"+' <i class="'+r+'caret"></i>'+"</button>"+"</div>"},postRender:function(){var e=this;return e.on("click",function(t){t.control===e&&r(t.target,e.getEl())&&(e.showMenu(),t.keyboard&&e.menu.items()[0].focus())}),e.on("mouseenter",function(t){var n=t.control,r=e.parent(),o;n&&r&&n instanceof i&&n.parent()==r&&(r.items().filter("MenuButton").each(function(e){e.hideMenu&&e!=n&&(e.menu&&e.menu.visible()&&(o=!0),e.hideMenu())}),o&&(n.focus(),n.showMenu()))}),e._super()},text:function(e){var t=this,n,r;if(t._rendered)for(r=t.getEl("open").getElementsByTagName("span"),n=0;n<r.length;n++)r[n].innerHTML=t.encode(e);return this._super(e)},remove:function(){this._super(),this.menu&&this.menu.remove()}});return i}),r(Wt,[zt],function(e){return e.extend({init:function(e){var t=this,n,r,i,o,a;if(t._values=n=e.values,n){for(r=0;r<n.length;r++)i=n[r].selected||e.value===n[r].value,i&&(o=o||n[r].text,t._value=n[r].value);e.menu=n}e.text=e.text||o||n[0].text,t._super(e),t.addClass("listbox"),t.on("select",function(n){var r=n.control;a&&(n.lastControl=a),e.multiple?r.active(!r.active()):t.value(n.control.settings.value),a=r})},value:function(e){function t(e,n){e.items().each(function(e){r=e.value()===n,r&&(i=i||e.text()),e.active(r),e.menu&&t(e.menu,n)})}var n=this,r,i,o,a;if("undefined"!=typeof e){if(n.menu)t(n.menu,e);else for(o=n.settings.menu,a=0;a<o.length;a++)r=o[a].value==e,r&&(i=i||o[a].text),o[a].active=r;n.text(i||this.settings.text)}return n._super(e)}})}),r(Vt,[yt,U],function(e,t){return e.extend({Defaults:{border:0,role:"menuitem"},init:function(e){var t=this;t.hasPopup=!0,t._super(e),e=t.settings,t.addClass("menu-item"),e.menu&&t.addClass("menu-item-expand"),e.preview&&t.addClass("menu-item-preview"),("-"===t._text||"|"===t._text)&&(t.addClass("menu-item-sep"),t.aria("role","separator"),t.canFocus=!1,t._text="-"),e.selectable&&(t.aria("role","menuitemcheckbox"),t.aria("checked",!0),t.addClass("menu-item-checkbox"),e.icon="selected"),e.preview||e.selectable||t.addClass("menu-item-normal"),t.on("mousedown",function(e){e.preventDefault()}),t.on("mouseenter click",function(n){n.control===t&&(e.menu||"click"!==n.type?(t.showMenu(),n.keyboard&&setTimeout(function(){t.menu.items()[0].focus()},0)):(t.parent().hideAll(),t.fire("cancel"),t.fire("select")))}),e.menu&&t.aria("haspopup",!0)},hasMenus:function(){return!!this.settings.menu},showMenu:function(){var e=this,n=e.settings,r,i=e.parent();if(i.items().each(function(t){t!==e&&t.hideMenu()}),n.menu){r=e.menu,r?r.show():(r=n.menu,r.length?r={type:"menu",items:r}:r.type=r.type||"menu",i.settings.itemDefaults&&(r.itemDefaults=i.settings.itemDefaults),r=e.menu=t.create(r).parent(e).renderTo(e.getContainerElm()),r.reflow(),r.fire("show"),r.on("cancel",function(){e.focus()}),r.on("hide",function(t){t.control===r&&e.removeClass("selected")})),r._parentMenu=i,r.addClass("menu-sub");var o=r.testMoveRel(e.getEl(),e.isRtl()?["tl-tr","bl-br","tr-tl","br-bl"]:["tr-tl","br-bl","tl-tr","bl-br"]);r.moveRel(e.getEl(),o),o="menu-sub-"+o,r.removeClass(r._lastRel),r.addClass(o),r._lastRel=o,e.addClass("selected"),e.aria("expanded",!0)}},hideMenu:function(){var e=this;return e.menu&&(e.menu.items().each(function(e){e.hideMenu&&e.hideMenu()}),e.menu.hide(),e.aria("expanded",!1)),e},renderHtml:function(){var e=this,t=e._id,n=e.settings,r=e.classPrefix,i=e.encode(e._text),o=e.settings.icon,a="";return o&&e.parent().addClass("menu-has-icons"),n.image&&(o="none",a=" style=\"background-image: url('"+n.image+"')\""),o=r+"ico "+r+"i-"+(e.settings.icon||"none"),'<div id="'+t+'" class="'+e.classes()+'" tabindex="-1">'+("-"!==i?'<i class="'+o+'"'+a+"></i>&nbsp;":"")+("-"!==i?'<span id="'+t+'-text" class="'+r+'text">'+i+"</span>":"")+(n.shortcut?'<div id="'+t+'-shortcut" class="'+r+'menu-shortcut">'+n.shortcut+"</div>":"")+(n.menu?'<div class="'+r+'caret"></div>':"")+"</div>"},postRender:function(){var e=this,t=e.settings,n=t.textStyle;if("function"==typeof n&&(n=n.call(this)),n){var r=e.getEl("text");r&&r.setAttribute("style",n)}return e._super()},remove:function(){this._super(),this.menu&&this.menu.remove()}})}),r(Ut,[X,J,Vt,p],function(e,t,n,r){var i=e.extend({Defaults:{defaultType:"menuitem",border:1,layout:"stack",role:"menu"},init:function(e){var i=this;if(e.autohide=!0,e.constrainToViewport=!0,e.itemDefaults)for(var o=e.items,a=o.length;a--;)o[a]=r.extend({},e.itemDefaults,o[a]);i._super(e),i.addClass("menu"),i.keyNav=new t({root:i,enableUpDown:!0,enableLeftRight:!0,leftAction:function(){i.parent()instanceof n&&i.keyNav.cancel()},onCancel:function(){i.fire("cancel",{},!1),i.hide()}})},repaint:function(){return this.toggleClass("menu-align",!0),this._super(),this.getEl().style.height="",this.getEl("body").style.height="",this},cancel:function(){var e=this;e.hideAll(),e.fire("cancel"),e.fire("select")},hideAll:function(){var e=this;return this.find("menuitem").exec("hideMenu"),e._super()},preRender:function(){var e=this;return e.items().each(function(t){var n=t.settings;return n.icon||n.selectable?(e._hasIcons=!0,!1):void 0}),e._super()}});return i}),r(qt,[xt],function(e){return e.extend({Defaults:{classes:"radio",role:"radio"}})}),r(jt,[yt,j],function(e,t){return e.extend({renderHtml:function(){var e=this,t=e.classPrefix;return e.addClass("resizehandle"),"both"==e.settings.direction&&e.addClass("resizehandle-both"),e.canFocus=!1,'<div id="'+e._id+'" class="'+e.classes()+'">'+'<i class="'+t+"ico "+t+'i-resize"></i>'+"</div>"},postRender:function(){var e=this;e._super(),e.resizeDragHelper=new t(this._id,{start:function(){e.fire("ResizeStart")},drag:function(t){"both"!=e.settings.direction&&(t.deltaX=0),e.fire("Resize",t)},end:function(){e.fire("ResizeEnd")}})},remove:function(){return this.resizeDragHelper&&this.resizeDragHelper.destroy(),this._super()}})}),r($t,[yt],function(e){return e.extend({renderHtml:function(){var e=this;return e.addClass("spacer"),e.canFocus=!1,'<div id="'+e._id+'" class="'+e.classes()+'"></div>'}})}),r(Kt,[zt,W],function(e,t){return e.extend({Defaults:{classes:"widget btn splitbtn",role:"splitbutton"},repaint:function(){var e=this,n=e.getEl(),r=e.layoutRect(),i,o,a;return e._super(),i=n.firstChild,o=n.lastChild,t.css(i,{width:r.w-t.getSize(o).width,height:r.h-2}),t.css(o,{height:r.h-2}),a=i.firstChild.style,a.width=a.height="100%",a=o.firstChild.style,a.width=a.height="100%",e},activeMenu:function(e){var n=this;t.toggleClass(n.getEl().lastChild,n.classPrefix+"active",e)},renderHtml:function(){var e=this,t=e._id,n=e.classPrefix,r=e.settings.icon?n+"ico "+n+"i-"+e.settings.icon:"";return'<div id="'+t+'" class="'+e.classes()+'">'+'<button type="button" hidefocus tabindex="-1">'+(r?'<i class="'+r+'"></i>':"")+(e._text?(r?" ":"")+e._text:"")+"</button>"+'<button type="button" class="'+n+'open" hidefocus tabindex="-1">'+(e._menuBtnText?(r?"\xa0":"")+e._menuBtnText:"")+' <i class="'+n+'caret"></i>'+"</button>"+"</div>"},postRender:function(){var e=this,t=e.settings.onclick;return e.on("click",function(e){var n=e.target;if(e.control==this)for(;n;){if("BUTTON"==n.nodeName&&-1==n.className.indexOf("open"))return e.stopImmediatePropagation(),t.call(this,e),void 0;n=n.parentNode}}),delete e.settings.onclick,e._super()}})}),r(Gt,[Ht],function(e){return e.extend({Defaults:{containerClass:"stack-layout",controlClass:"stack-layout-item",endClass:"break"}})}),r(Yt,[K,W],function(e,t){return e.extend({lastIdx:0,Defaults:{layout:"absolute",defaults:{type:"panel"}},activateTab:function(e){this.activeTabId&&t.removeClass(this.getEl(this.activeTabId),this.classPrefix+"active"),this.activeTabId="t"+e,t.addClass(this.getEl("t"+e),this.classPrefix+"active"),e!=this.lastIdx&&(this.items()[this.lastIdx].hide(),this.lastIdx=e),this.items()[e].show().fire("showtab"),this.reflow()},renderHtml:function(){var e=this,t=e._layout,n="",r=e.classPrefix;return e.preRender(),t.preRender(e),e.items().each(function(t,i){n+='<div id="'+e._id+"-t"+i+'" class="'+r+'tab" unselectable="on">'+e.encode(t.settings.title)+"</div>"}),'<div id="'+e._id+'" class="'+e.classes()+'" hideFocus="1" tabIndex="-1">'+'<div id="'+e._id+'-head" class="'+r+'tabs">'+n+"</div>"+'<div id="'+e._id+'-body" class="'+e.classes("body")+'">'+t.renderHtml(e)+"</div>"+"</div>"},postRender:function(){var e=this;e._super(),e.settings.activeTab=e.settings.activeTab||0,e.activateTab(e.settings.activeTab),this.on("click",function(t){var n=t.target.parentNode;if(t.target.parentNode.id==e._id+"-head")for(var r=n.childNodes.length;r--;)n.childNodes[r]==t.target&&e.activateTab(r)})},initLayoutRect:function(){var e=this,n,r,i;r=t.getSize(e.getEl("head")).width,r=0>r?0:r,i=0,e.items().each(function(t,n){r=Math.max(r,t.layoutRect().minW),i=Math.max(i,t.layoutRect().minH),e.settings.activeTab!=n&&t.hide()}),e.items().each(function(e){e.settings.x=0,e.settings.y=0,e.settings.w=r,e.settings.h=i,e.layoutRect({x:0,y:0,w:r,h:i})});var o=t.getSize(e.getEl("head")).height;return e.settings.minWidth=r,e.settings.minHeight=i+o,n=e._super(),n.deltaH+=o,n.innerH=n.h-n.deltaH,n}})}),r(Xt,[yt,W],function(e,t){return e.extend({init:function(e){var t=this;t._super(e),t._value=e.value||"",t.addClass("textbox"),e.multiline?t.addClass("multiline"):t.on("keydown",function(e){13==e.keyCode&&t.parents().reverse().each(function(t){return e.preventDefault(),t.hasEventListeners("submit")&&t.toJSON?(t.fire("submit",{data:t.toJSON()}),!1):void 0})})},disabled:function(e){var t=this;return t._rendered&&"undefined"!=typeof e&&(t.getEl().disabled=e),t._super(e)},value:function(e){var t=this;return"undefined"!=typeof e?(t._value=e,t._rendered&&(t.getEl().value=e),t):t._rendered?t.getEl().value:t._value},repaint:function(){var e=this,t,n,r,i=0,o=0,a;t=e.getEl().style,n=e._layoutRect,a=e._lastRepaintRect||{};var s=document;return!e.settings.multiline&&s.all&&(!s.documentMode||s.documentMode<=8)&&(t.lineHeight=n.h-o+"px"),r=e._borderBox,i=r.left+r.right+8,o=r.top+r.bottom+(e.settings.multiline?8:0),n.x!==a.x&&(t.left=n.x+"px",a.x=n.x),n.y!==a.y&&(t.top=n.y+"px",a.y=n.y),n.w!==a.w&&(t.width=n.w-i+"px",a.w=n.w),n.h!==a.h&&(t.height=n.h-o+"px",a.h=n.h),e._lastRepaintRect=a,e.fire("repaint",{},!1),e},renderHtml:function(){var e=this,t=e._id,n=e.settings,r=e.encode(e._value,!1),i="";return"spellcheck"in n&&(i+=' spellcheck="'+n.spellcheck+'"'),n.maxLength&&(i+=' maxlength="'+n.maxLength+'"'),n.size&&(i+=' size="'+n.size+'"'),n.subtype&&(i+=' type="'+n.subtype+'"'),e.disabled()&&(i+=' disabled="disabled"'),n.multiline?'<textarea id="'+t+'" class="'+e.classes()+'" '+(n.rows?' rows="'+n.rows+'"':"")+' hidefocus="true"'+i+">"+r+"</textarea>":'<input id="'+t+'" class="'+e.classes()+'" value="'+r+'" hidefocus="true"'+i+">"},postRender:function(){var e=this;return t.on(e.getEl(),"change",function(t){e.fire("change",t)}),e._super()},remove:function(){t.off(this.getEl()),this._super()}})}),r(Jt,[W],function(e){return function(t){var n=this,r;n.show=function(i){return n.hide(),r=!0,window.setTimeout(function(){r&&t.appendChild(e.createFragment('<div class="mce-throbber"></div>'))},i||0),n},n.hide=function(){var e=t.lastChild;return e&&-1!=e.className.indexOf("throbber")&&e.parentNode.removeChild(e),r=!1,n}}}),a([l,c,u,d,f,p,h,m,g,v,y,b,C,x,w,_,N,E,S,k,T,R,A,B,L,H,D,M,P,O,I,F,z,W,V,U,q,j,$,K,G,Y,X,J,Q,Z,et,tt,nt,rt,it,ot,at,st,lt,ct,ut,dt,ft,pt,ht,mt,gt,vt,yt,bt,Ct,xt,wt,_t,Nt,Et,St,kt,Tt,Rt,At,Bt,Lt,Ht,Dt,Mt,Pt,Ot,It,Ft,zt,Wt,Vt,Ut,qt,jt,$t,Kt,Gt,Yt,Xt,Jt])}(this);//     Underscore.js 1.5.1
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.1';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value == null ? _.identity : value);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var result;
    var timeout = null;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Perform a deep comparison to check if two objects are equal, and return differences.
  _.isEqualDiff = function(a, b) {
    var diffs = {};

    for (var key in b) {

        if (key != "Value")
            if (_.isEqual(a[key], b[key]) == false) {

                // var obj = {};

                // obj[key] = newPt[key];
                // uscore.extend(updatePt, obj);
                diffs[key] = b[key];
            }
    }

    if (_.isEmpty(diffs))
        return false;
    else
        return diffs;
    
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

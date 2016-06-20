var HighchartsAdapter=function(){function a(a){function c(a,b,c){a.removeEventListener(b,c,!1)}function d(a,b,c){c=a.HCProxiedMethods[c.toString()],a.detachEvent("on"+b,c)}function e(a,b){var e,f,g,h,i=a.HCEvents;if(a.removeEventListener)e=c;else{if(!a.attachEvent)return;e=d}b?(f={},f[b]=!0):f=i;for(h in f)if(i[h])for(g=i[h].length;g--;)e(a,h,i[h][g])}return a.HCExtended||Highcharts.extend(a,{HCExtended:!0,HCEvents:{},bind:function(a,c){var d,e=this,f=this.HCEvents;e.addEventListener?e.addEventListener(a,c,!1):e.attachEvent&&(d=function(a){a.target=a.srcElement||window,c.call(e,a)},e.HCProxiedMethods||(e.HCProxiedMethods={}),e.HCProxiedMethods[c.toString()]=d,e.attachEvent("on"+a,d)),f[a]===b&&(f[a]=[]),f[a].push(c)},unbind:function(a,b){var f,g;a?(f=this.HCEvents[a]||[],b?(g=HighchartsAdapter.inArray(b,f),g>-1&&(f.splice(g,1),this.HCEvents[a]=f),this.removeEventListener?c(this,a,b):this.attachEvent&&d(this,a,b)):(e(this,a),this.HCEvents[a]=[])):(e(this),this.HCEvents={})},trigger:function(a,b){var c,d,e,f=this.HCEvents[a]||[],g=this,h=f.length;for(d=function(){b.defaultPrevented=!0},c=0;c<h;c++){if(e=f[c],b.stopped)return;b.preventDefault=d,b.target=g,b.type||(b.type=a),e.call(this,b)===!1&&b.preventDefault()}}}),a}var b,c,d,e=document,f=[],g=[],h={};return Math.easeInOutSine=function(a,b,c,d){return-c/2*(Math.cos(Math.PI*a/d)-1)+b},{init:function(a){e.defaultView||(this._getStyle=function(a,b){var c;return a.style[b]?a.style[b]:("opacity"===b&&(b="filter"),c=a.currentStyle[b.replace(/\-(\w)/g,function(a,b){return b.toUpperCase()})],"filter"===b&&(c=c.replace(/alpha\(opacity=([0-9]+)\)/,function(a,b){return b/100})),""===c?1:c)},this.adapterRun=function(a,b){var c={width:"clientWidth",height:"clientHeight"}[b];if(c)return a.style.zoom=1,a[c]-2*parseInt(HighchartsAdapter._getStyle(a,"padding"),10)}),Array.prototype.forEach||(this.each=function(a,b){for(var c=0,d=a.length;c<d;c++)if(b.call(a[c],a[c],c,a)===!1)return c}),Array.prototype.indexOf||(this.inArray=function(a,b){var c,d=0;if(b)for(c=b.length;d<c;d++)if(b[d]===a)return d;return-1}),Array.prototype.filter||(this.grep=function(a,b){for(var c=[],d=0,e=a.length;d<e;d++)b(a[d],d)&&c.push(a[d]);return c}),d=function(a,b,c){this.options=b,this.elem=a,this.prop=c},d.prototype={update:function(){var b,c=this.paths,d=this.elem,e=d.element;h[this.prop]?h[this.prop](this):c&&e?d.attr("d",a.step(c[0],c[1],this.now,this.toD)):d.attr?e&&d.attr(this.prop,this.now):(b={},b[this.prop]=this.now+this.unit,Highcharts.css(d,b)),this.options.step&&this.options.step.call(this.elem,this.now,this)},custom:function(a,b,d){var e,f=this,h=function(a){return f.step(a)};this.startTime=+new Date,this.start=a,this.end=b,this.unit=d,this.now=this.start,this.pos=this.state=0,h.elem=this.elem,h()&&1===g.push(h)&&(c=setInterval(function(){for(e=0;e<g.length;e++)g[e]()||g.splice(e--,1);g.length||clearInterval(c)},13))},step:function(a){var b,c,d,e=+new Date,f=this.options,g=this.elem;if(g.stopAnimation||g.attr&&!g.element)b=!1;else if(a||e>=f.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),this.options.curAnim[this.prop]=!0,c=!0;for(d in f.curAnim)f.curAnim[d]!==!0&&(c=!1);c&&f.complete&&f.complete.call(g),b=!1}else{var h=e-this.startTime;this.state=h/f.duration,this.pos=f.easing(h,0,1,f.duration),this.now=this.start+(this.end-this.start)*this.pos,this.update(),b=!0}return b}},this.animate=function(b,c,e){var f,g,h,i,j,k="";b.stopAnimation=!1,"object"==typeof e&&null!==e||(i=arguments,e={duration:i[2],easing:i[3],complete:i[4]}),"number"!=typeof e.duration&&(e.duration=400),e.easing=Math[e.easing]||Math.easeInOutSine,e.curAnim=Highcharts.extend({},c);for(j in c)h=new d(b,e,j),g=null,"d"===j?(h.paths=a.init(b,b.d,c.d),h.toD=c.d,f=0,g=1):b.attr?f=b.attr(j):(f=parseFloat(HighchartsAdapter._getStyle(b,j))||0,"opacity"!==j&&(k="px")),g||(g=c[j]),h.custom(f,g,k)}},_getStyle:function(a,b){return window.getComputedStyle(a,void 0).getPropertyValue(b)},addAnimSetter:function(a,b){h[a]=b},getScript:function(a,b){var c=e.getElementsByTagName("head")[0],d=e.createElement("script");d.type="text/javascript",d.src=a,d.onload=b,c.appendChild(d)},inArray:function(a,b){return b.indexOf?b.indexOf(a):f.indexOf.call(b,a)},adapterRun:function(a,b){return parseInt(HighchartsAdapter._getStyle(a,b),10)},grep:function(a,b){return f.filter.call(a,b)},map:function(a,b){for(var c=[],d=0,e=a.length;d<e;d++)c[d]=b.call(a[d],a[d],d,a);return c},offset:function(a){var b=document.documentElement,c=a.getBoundingClientRect();return{top:c.top+(window.pageYOffset||b.scrollTop)-(b.clientTop||0),left:c.left+(window.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}},addEvent:function(b,c,d){a(b).bind(c,d)},removeEvent:function(b,c,d){a(b).unbind(c,d)},fireEvent:function(a,b,c,d){var f;e.createEvent&&(a.dispatchEvent||a.fireEvent)?(f=e.createEvent("Events"),f.initEvent(b,!0,!0),f.target=a,Highcharts.extend(f,c),a.dispatchEvent?a.dispatchEvent(f):a.fireEvent(b,f)):a.HCExtended===!0&&(c=c||{},a.trigger(b,c)),c&&c.defaultPrevented&&(d=null),d&&d(c)},washMouseEvent:function(a){return a},stop:function(a){a.stopAnimation=!0},each:function(a,b){return Array.prototype.forEach.call(a,b)}}}();
!function(a){a.jqx.jqxWidget("jqxNavigationBar","",{}),a.extend(a.jqx._jqxNavigationBar.prototype,{defineInstance:function(){this.width="auto",this.height="auto",this.expandAnimationDuration=250,this.collapseAnimationDuration=250,this.animationType="slide",this.toggleMode="click",this.showArrow=!0,this.arrowPosition="right",this.disabled=!1,this.initContent=null,this.rtl=!1,this.easing="easeInOutSine",this.expandMode="singleFitHeight",this.expandedIndexes=[],this._expandModes=["singleFitHeight","single","multiple","toggle","none"],this.aria={"aria-disabled":{name:"disabled",type:"boolean"}},this.events=["expandingItem","expandedItem","collapsingItem","collapsedItem"]},createInstance:function(b){this._isTouchDevice=a.jqx.mobile.isTouchDevice(),a.jqx.aria(this),this.render()},val:function(b){return 0==arguments.length||"object"==typeof b?this.expandedIndexes:("string"==typeof b?(this.expandedIndexes.push(parseInt(b)),this._applyExpandedIndexes()):(a.isArray(b)?this.expandedIndexes=b:(this.expandedIndexes=new Array,this.expandedIndexes.push(b)),this._applyExpandedIndexes()),this.expandedIndexes)},expandAt:function(b){var c=this;"single"!=this.expandMode&&"singleFitHeight"!=this.expandMode&&"toggle"!=this.expandMode||a.each(this.items,function(a,d){a!=b&&c.collapseAt(a)});var d=this.items[b];if(0==d.disabled&&0==d.expanded&&1==d._expandChecker){var c=this;switch(d._expandChecker=0,this._raiseEvent("0",{item:b}),d._header.removeClass(this.toThemeProperty("jqx-fill-state-normal")),d._header.addClass(this.toThemeProperty("jqx-fill-state-pressed")),d._header.addClass(this.toThemeProperty("jqx-expander-header-expanded")),d._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down")),d._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-hover")),d._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-hover")),d._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-selected")),d._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-top")),d._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up")),d._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up-selected")),d._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-bottom")),d._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-expanded")),0==this.heightFlag&&this.host.css({"overflow-x":"hidden","overflow-y":"hidden"}),this.eCFlag=1,this.animationType){case"slide":var e=d._content,f=(e.height(),{});f.height=f.paddingTop=f.paddingBottom=f.borderTopWidth=f.borderBottomWidth="show";var g=0,h=e.outerHeight();if(a.jqx.browser.msie&&a.jqx.browser.version<9){var f={};f.height=f.paddingTop=f.paddingBottom="show"}e.animate(f,{duration:this.expandAnimationDuration,easing:this.easing,step:function(a,b){b.now=Math.round(a),"height"!==b.prop?g+=b.now:c._collapseContent?(b.now=Math.round(h-c._collapseContent.outerHeight()-g),g=0):b.now=Math.round(a)},complete:function(){d.expanded=!0,a.jqx.aria(d._header,"aria-expanded",!0),a.jqx.aria(d._content,"aria-hidden",!1),c._updateExpandedIndexes(),c._raiseEvent("1",{item:b}),c._checkHeight(),1==c.heightFlag&&c.host.css({"overflow-x":"hidden","overflow-y":"auto"}),c.initContent&&0==d._initialized&&(c.initContent(b),d._initialized=!0),c.eCFlag=0}});break;case"fade":setTimeout(function(){d._content.fadeIn(this.expandAnimationDuration,function(){d.expanded=!0,a.jqx.aria(d._header,"aria-expanded",!0),a.jqx.aria(d._content,"aria-hidden",!1),c._updateExpandedIndexes(),c._raiseEvent("1",{item:b}),c._checkHeight(),1==c.heightFlag&&c.host.css({"overflow-x":"hidden","overflow-y":"auto"}),c.initContent&&0==d._initialized&&(c.initContent(b),d._initialized=!0),c.eCFlag=0})},this.collapseAnimationDuration);break;case"none":d._content.css("display","inherit"),d.expanded=!0,a.jqx.aria(d._header,"aria-expanded",!0),a.jqx.aria(d._content,"aria-hidden",!1),this._updateExpandedIndexes(),this._raiseEvent("1",{item:b}),this._checkHeight(),1==this.heightFlag&&this.host.css({"overflow-x":"hidden","overflow-y":"auto"}),this.initContent&&0==d._initialized&&(this.initContent(b),d._initialized=!0),this.eCFlag=0}}},collapseAt:function(b){var c=this.items[b];if(0==c.disabled&&1==c.expanded&&0==c._expandChecker){var d=this;switch(c._expandChecker=1,this._raiseEvent("2",{item:b}),c._header.removeClass(this.toThemeProperty("jqx-fill-state-pressed")),c._header.removeClass(this.toThemeProperty("jqx-expander-header-expanded")),c._header.addClass(this.toThemeProperty("jqx-fill-state-normal")),c._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up")),c._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-selected")),c._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-selected")),c._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-bottom")),c._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-expanded")),c._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down")),c._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top")),0==this.heightFlag&&this.host.css({"overflow-x":"hidden","overflow-y":"hidden"}),this.eCFlag=1,this._collapseContent=c._content,this.animationType){case"slide":var e={};if(e.height=e.paddingTop=e.paddingBottom=e.borderTopWidth=e.borderBottomWidth="hide",a.jqx.browser.msie&&a.jqx.browser.version<9){var e={};e.height=e.paddingTop=e.paddingBottom="hide"}var f=c._content;f.animate(e,{duration:this.collapseAnimationDuration,step:function(a,b){b.now=Math.round(a)},easing:this.easing,complete:function(){c.expanded=!1,f.hide(),a.jqx.aria(c._header,"aria-expanded",!1),a.jqx.aria(c._content,"aria-hidden",!0),d._updateExpandedIndexes(),d._raiseEvent("3",{item:b}),d._checkHeight(),1==d.heightFlag&&d.host.css({"overflow-x":"hidden","overflow-y":"auto"}),d.eCFlag=0,d._collapseContent=null}});break;case"fade":c._content.fadeOut(this.collapseAnimationDuration,function(){c.expanded=!1,a.jqx.aria(c._header,"aria-expanded",!1),a.jqx.aria(c._content,"aria-hidden",!0),d._updateExpandedIndexes(),d._raiseEvent("3",{item:b}),d._checkHeight(),1==d.heightFlag&&d.host.css({"overflow-x":"hidden","overflow-y":"auto"}),d.eCFlag=0});break;case"none":c._content.css("display","none"),c.expanded=!1,a.jqx.aria(c._header,"aria-expanded",!1),a.jqx.aria(c._content,"aria-hidden",!0),this._updateExpandedIndexes(),this._raiseEvent("3",{item:b}),this._checkHeight(),1==this.heightFlag&&this.host.css({"overflow-x":"hidden","overflow-y":"auto"}),this.eCFlag=0}}},setHeaderContentAt:function(a,b){this.items[a]._header_text.html(b)},getHeaderContentAt:function(a){return this.items[a]._header_text.html()},setContentAt:function(a,b){this.items[a]._content.html(b),this._checkContent(a)},getContentAt:function(a){return this.items[a]._content.html()},showArrowAt:function(a){this.items[a]._arrow.css("display","block")},hideArrowAt:function(a){this.items[a]._arrow.css("display","none")},enable:function(){this.disabled=!1,a.each(this.items,function(a,b){this.disabled=!1}),this._enabledDisabledCheck(),this.refresh(),a.jqx.aria(this,"aria-disabled",!1)},disable:function(){this.disabled=!0,a.each(this.items,function(a,b){this.disabled=!0}),this._enabledDisabledCheck(),this.refresh(),a.jqx.aria(this,"aria-disabled",!0)},enableAt:function(a){this.items[a].disabled=!1,this.refresh()},disableAt:function(a){this.items[a].disabled=!0,this.refresh()},invalidate:function(){this.refresh()},refresh:function(b){1!=b&&(this._removeHandlers(),1==this.showArrow?a.each(this.items,function(a,b){var c=this;c._arrow.css("display","block")}):a.each(this.items,function(a,b){var c=this;c._arrow.css("display","none")}),this._updateExpandedIndexes(),this._setTheme(),this._setSize(),this._toggle(),this._keyBoard())},render:function(){this.widgetID=this.element.id;var b=this;this._expandModes.indexOf(this.expandMode)==-1&&(this.expandMode="singleFitHeight"),a.jqx.utilities.resize(this.host,function(){b._setSize()}),this.host.attr("role","tablist"),this.items&&(this._removeHandlers(),a.each(this.items,function(){this._header.removeClass(),this._header.attr("tabindex",null),this._content.attr("tabindex",null),this._header[0].className="",this._header_text.removeClass(),this._header_text[0].className="",this._header.css("margin-top",0),this._header[0].innerHTML=this._header_text[0].innerHTML})),this.items=new Array;var c=this.host.children().length,d="Invalid jqxNavigationBar structure. Please add an even number of child div elements that will represent each item's header and content.";try{if(c%2!=0)throw d}catch(e){alert(e)}var f="Invalid jqxNavigationBar structure. Please make sure all the children elements of the navigationbar are divs.";try{for(var g=this.host.children(),h=0;h<c;h++)if("div"!=g[h].tagName.toLowerCase())throw f}catch(e){alert(e)}for(var i,j=0;j<c;j+=2)i=this.host.children("div:eq("+j+")"),i.wrap("<div></div>");for(var k,h=0,l=0;l<c/2;l++)k=h+1,this.items[l]=new Object,this.items[l]._header=this.host.children("div:eq("+h+")"),this.items[l]._header.attr("role","tab"),this.items[l]._content=this.host.children("div:eq("+k+")"),this.items[l]._content.attr("role","tabpanel"),h+=2;var m=this.expandedIndexes.length;a.each(this.items,function(a,b){this.expandedFlag=!1,this.focusedH=!1,this.focusedC=!1}),this.items&&0==this.items.length||("single"==this.expandMode||"singleFitHeight"==this.expandMode||"toggle"==this.expandMode||"none"==this.expandMode?(a.each(this.items,function(a,b){var c=this;c.expanded=!1}),0!=m?this.items[this.expandedIndexes[0]].expanded=!0:0!=m||"single"!=this.expandMode&&"singleFitHeight"!=this.expandMode||(this.items[0].expanded=!0)):"multiple"==this.expandMode?0!=m?a.each(this.items,function(a,c){for(var d=this,e=0;e<m;e++){if(b.expandedIndexes[e]==a){d.expanded=!0;break}d.expanded=!1}}):a.each(this.items,function(a,b){var c=this;c.expanded=!1}):"none"==this.expandMode&&a.each(this.items,function(a,b){var c=this;c.expanded=!1}),this._enabledDisabledCheck(),a.each(this.items,function(a,c){var d=this;d._header_text=d._header.children("div:eq(0)"),b.rtl?d._header_text.addClass(b.toThemeProperty("jqx-expander-header-content-rtl")):d._header_text.addClass(b.toThemeProperty("jqx-expander-header-content")),d._header.append("<div></div>"),d._arrow=d._header.children("div:eq(1)"),1==b.showArrow?d._arrow.css("display","block"):d._arrow.css("display","none")}),a.each(this.items,function(c,d){var e=this;1==e.expanded?(e._arrow.addClass(b.toThemeProperty("jqx-icon-arrow-up")),e._arrow.addClass(b.toThemeProperty("jqx-icon-arrow-up-selected")),e._arrow.addClass(b.toThemeProperty("jqx-expander-arrow-bottom")),e._arrow.addClass(b.toThemeProperty("jqx-expander-arrow-expanded")),b.initContent&&setTimeout(function(){b.initContent(c)},10),e._initialized=!0,e._expandChecker=0,a.jqx.aria(e._header,"aria-expanded",!0),a.jqx.aria(e._content,"aria-hidden",!1)):0==e.expanded&&(e._arrow.addClass(b.toThemeProperty("jqx-icon-arrow-down")),e._arrow.addClass(b.toThemeProperty("jqx-expander-arrow-top")),e._initialized=!1,e._expandChecker=1,e._content.css("display","none"),a.jqx.aria(e._header,"aria-expanded",!1),a.jqx.aria(e._content,"aria-hidden",!0))}),this.tI=0,a.each(this.items,function(a,c){var d=this;void 0==d._header.attr("tabindex")&&(b.tI++,d._header.attr("tabindex",b.tI)),void 0==d._content.attr("tabindex")&&(b.tI++,d._content.attr("tabindex",b.tI))}),this._setTheme(),a.each(this.items,function(a,c){b._checkContent(a)}),this._setSize(),this._toggle(),this._keyBoard())},insert:function(b,c,d){var e="<div>"+c+"</div><div>"+d+"</div>";if(b!=-1)a(e).insertBefore(this.items[b]._header);else{var f=this.items.length-1;a(e).insertAfter(this.items[f]._content)}this.render()},add:function(a,b){this.insert(-1,a,b)},update:function(a,b,c){this.setHeaderContentAt(a,b),this.setContentAt(a,c)},remove:function(a){if(isNaN(a)&&(a=this.items.length-1),this.items[a]){this.items[a]._header.remove(),this.items[a]._content.remove(),this.items.splice(a,1);var b=this.expandedIndexes.indexOf(a);b>-1&&this.expandedIndexes.splice(b,1),this.render()}},destroy:function(){this._removeHandlers(),this.host.remove()},focus:function(){try{a.each(this.items,function(a,b){var c=this;if(0==c.disabled)return c._header.focus(),!1})}catch(b){}},_applyExpandedIndexes:function(){for(var b=this,c=this.expandedIndexes.length,d=0;d<c;d++){var e=b.expandedIndexes[d];a.each(this.items,function(a,c){var d=this;if(a==e&&(d.expandedFlag=!0,0==d.expanded&&b.expandAt(a),"single"==b.expandMode||"singleFitHeight"==b.expandMode||"toggle"==b.expandMode||"none"==b.expandMode))return!1}),a.each(this.items,function(a,c){var d=this;a!=e&&0==d.expandedFlag&&b.collapseAt(a)})}a.each(this.items,function(a,b){this.expandedFlag=!1})},propertyChangedHandler:function(a,b,c,d){"disabled"==b?a._enabledDisabledCheck():"expandedIndexes"==b?a._applyExpandedIndexes():a.refresh()},_raiseEvent:function(a,b){var c=this.events[a],d=new jQuery.Event(c);d.owner=this,d.args=b,d.item=d.args.item;try{var e=this.host.trigger(d)}catch(f){}return e},resize:function(a,b){this.width=a,this.height=b,this._setSize()},_setSize:function(){var b=this;this.headersHeight=0;var c=this.items&&this.items.length>0?parseInt(this.items[0]._header.css("padding-left")):0,d=this.items&&this.items.length>0?parseInt(this.items[0]._header.css("padding-right")):0,e=2,f=c+d+e;isNaN(f)&&(f=12),"auto"==this.width?this.host.width(this.width):null!=this.width&&this.width.toString().indexOf("%")!=-1?this.host.width(this.width):this.host.width(this.width+f),this.host.height(this.height),a.each(this.items,function(a,c){var d=this,e=b.arrowPosition;if(b.rtl)switch(e){case"left":e="right";break;case"right":e="left"}"right"==e?(d._header_text.css({"float":"left","margin-left":"0px"}),d._arrow.css({"float":"right",position:"relative"})):"left"==e&&("auto"==b.width?(d._header_text.css({"float":"left","margin-left":"17px"}),d._arrow.css({"float":"left",position:"absolute"})):(d._header_text.css({"float":"right","margin-left":"0px"}),d._arrow.css({"float":"left",position:"relative"}))),d._header.height("auto"),d._header_text.css("min-height",d._arrow.height()),b.headersHeight+=d._header.outerHeight(),d._arrow.css("margin-top",d._header_text.height()/2-d._arrow.height()/2)}),a.each(this.items,function(a,c){var d=this;if("auto"!=b.height)if("single"==b.expandMode||"toggle"==b.expandMode||"multiple"==b.expandMode)b.host.css({"overflow-x":"hidden","overflow-y":"auto"});else if("singleFitHeight"==b.expandMode){var e=parseInt(d._content.css("padding-top"))+parseInt(d._content.css("padding-bottom"));b.height&&b.height.toString().indexOf("%")>=0?d._content.height(b.host.height()-b.headersHeight-e+2):d._content.height(b.host.height()-b.headersHeight-e)}}),b._checkHeight()},_toggle:function(){var b=this;if(0==this._isTouchDevice)switch(this.toggleMode){case"click":a.each(this.items,function(a,c){var d=this;0==d.disabled&&b.addHandler(d._header,"click.navigationbar"+this.widgetID,function(){b.focusedH=!0,b._animate(a)})});break;case"dblclick":a.each(this.items,function(a,c){var d=this;0==d.disabled&&b.addHandler(d._header,"dblclick.navigationbar"+this.widgetID,function(){b.focusedH=!0,b._animate(a)})});break;case"none":}else{if("none"==this.toggleMode)return;a.each(this.items,function(c,d){var e=this;0==e.disabled&&b.addHandler(e._header,a.jqx.mobile.getTouchEventName("touchstart")+"."+this.widgetID,function(){b._animate(c)})})}},_animate:function(a,b){var c=this;this.eCFlag;var d=this.items[a];"none"!=this.expandMode&&1!=this.eCFlag&&(1==this.items[a].expanded?"multiple"!=this.expandMode&&"toggle"!=this.expandMode||this.collapseAt(a):this.expandAt(a),c._isTouchDevice||(1!=b?(d._header.addClass(this.toThemeProperty("jqx-fill-state-hover")),d._header.addClass(this.toThemeProperty("jqx-expander-header-hover")),d._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top-hover")),d._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-down-hover"))):(d._header.removeClass(this.toThemeProperty("jqx-fill-state-hover")),d._header.removeClass(this.toThemeProperty("jqx-expander-header-hover")),d._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-top-hover")),d._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-down-hover")))))},_removeHandlers:function(){var b=this;this.removeHandler(this.host,"keydown.navigationbar"+this.widgetID),a.each(this.items,function(a,c){var d=this;b.removeHandler(d._header,"click.navigationbar"+b.widgetID),b.removeHandler(d._header,"dblclick.navigationbar"+b.widgetID),b.removeHandler(d._header,"mouseenter.navigationbar"+b.widgetID),b.removeHandler(d._header,"mouseleave.navigationbar"+b.widgetID),b.removeHandler(d._header,"focus.navigationbar"+b.widgetID),b.removeHandler(d._header,"blur.navigationbar"+b.widgetID),b.removeHandler(d._content,"focus.navigationbar"+b.widgetID),b.removeHandler(d._content,"blur.navigationbar"+b.widgetID),b.removeHandler(d._header_text,"focus.navigationbar"+b.widgetID),b.removeHandler(d._arrow,"focus.navigationbar"+b.widgetID)})},_setTheme:function(){var b=this;this.host.addClass(this.toThemeProperty("jqx-reset")),this.host.addClass(this.toThemeProperty("jqx-widget")),1==this.rtl&&this.host.addClass(this.toThemeProperty("jqx-rtl")),a.each(this.items,function(a,c){var d=this;d._header.css("position","relative"),d._content.css("position","relative"),d._header.addClass(b.toThemeProperty("jqx-widget-header")),d._header.addClass(b.toThemeProperty("jqx-item")),d._content.addClass(b.toThemeProperty("jqx-widget-content")),0==d.disabled?(d._header.removeClass(b.toThemeProperty("jqx-fill-state-disabled")),d._content.removeClass(b.toThemeProperty("jqx-fill-state-disabled")),1==d.expanded?(d._header.addClass(b.toThemeProperty("jqx-fill-state-pressed")),d._header.addClass(b.toThemeProperty("jqx-expander-header-expanded"))):(d._header.addClass(b.toThemeProperty("jqx-fill-state-normal")),d._header.removeClass(b.toThemeProperty("jqx-expander-header-expanded"))),b._isTouchDevice||(b.addHandler(d._header,"mouseenter.navigationbar"+b.widgetID,function(){1==d._expandChecker&&(d.focusedH||d._header.css("z-index",5),d._header.removeClass(b.toThemeProperty("jqx-fill-state-normal")),d._header.removeClass(b.toThemeProperty("jqx-fill-state-pressed")),d._header.addClass(b.toThemeProperty("jqx-fill-state-hover")),d._header.addClass(b.toThemeProperty("jqx-expander-header-hover")),d._arrow.addClass(b.toThemeProperty("jqx-expander-arrow-top-hover")),d._arrow.addClass(b.toThemeProperty("jqx-expander-arrow-down-hover")),d.expanded?d._arrow.addClass(b.toThemeProperty("jqx-icon-arrow-up-hover")):d._arrow.addClass(b.toThemeProperty("jqx-icon-arrow-down-hover")))}),b.addHandler(d._header,"mouseleave.navigationbar"+b.widgetID,function(){d.focusedH||d._header.css("z-index",0),d._header.removeClass(b.toThemeProperty("jqx-fill-state-hover")),d._header.removeClass(b.toThemeProperty("jqx-expander-header-hover")),d._arrow.removeClass(b.toThemeProperty("jqx-expander-arrow-top-hover")),d._arrow.removeClass(b.toThemeProperty("jqx-expander-arrow-down-hover")),1==d._expandChecker?d._header.addClass(b.toThemeProperty("jqx-fill-state-normal")):d._header.addClass(b.toThemeProperty("jqx-fill-state-pressed")),d._arrow.removeClass(b.toThemeProperty("jqx-icon-arrow-up-hover")),d._arrow.removeClass(b.toThemeProperty("jqx-icon-arrow-down-hover"))}))):(d._header.addClass(b.toThemeProperty("jqx-fill-state-disabled")),d._content.addClass(b.toThemeProperty("jqx-fill-state-disabled"))),b.host.addClass(b.toThemeProperty("jqx-navigationbar")),d._header.addClass(b.toThemeProperty("jqx-expander-header")),d._content.addClass(b.toThemeProperty("jqx-expander-content")),d._content.addClass(b.toThemeProperty("jqx-expander-content-bottom")),0!=a&&d._header.css("margin-top",-1),d._arrow.addClass(b.toThemeProperty("jqx-expander-arrow"))})},_checkContent:function(a){var b=this.items[a],c=b._content;if(this._cntntEmpty=/^\s*$/.test(this.items[a]._content.html()),1==this._cntntEmpty)c.css("display","none"),c.height(0),c.addClass(this.toThemeProperty("jqx-expander-content-empty"));else{if(b.expanded&&c.css("display","block"),"singleFitHeight"==this.expandMode){var d=1;0!=a&&(d=2),c.height(this.host.height()-this.headersHeight+d)}else c.height("auto");c.removeClass(this.toThemeProperty("jqx-expander-content-empty"))}},_checkHeight:function(){var b=this;this.totalHeight=0,this.heightFlag;var c=this.items&&this.items.length>0?parseInt(this.items[0]._header.css("padding-left")):0,d=this.items&&this.items.length>0?parseInt(this.items[0]._header.css("padding-right")):0,e=2,f=c+d+e;isNaN(f)&&(f=12);var g=17;a.each(this.items,function(a,c){var d=this;b.totalHeight+=(d.expanded?d._content.outerHeight():0)+d._header.outerHeight()}),"auto"!=this.width&&"auto"!=this.height&&"singleFitHeight"!=this.expandMode&&(this.totalHeight>this.host.height()?(this.host.width(this.width+f+g),this.heightFlag=!0):(this.host.width(this.width+f),this.heightFlag=!1))},_enabledDisabledCheck:function(){1==this.disabled?a.each(this.items,function(a,b){var c=this;c.disabled=!0}):a.each(this.items,function(a,b){var c=this;c.disabled=!1})},_updateExpandedIndexes:function(){var b=this;this.expandedIndexes=[],a.each(this.items,function(a,c){var d=this;if(1==d.expanded&&(b.expandedIndexes.push(a),"single"==b.expandMode||"singleFitHeight"==b.expandMode||"toggle"==b.expandMode||"none"==b.expandMode))return!1})},_keyBoard:function(){var b=this;this._focus(),this.addHandler(this.host,"keydown.navigationbar"+this.widgetID,function(c){var d=!1;return a.each(b.items,function(a,e){var f=this,g=b.items.length;if((1==f.focusedH||1==f.focusedC)&&0==f.disabled){switch(c.keyCode){case 13:case 32:"none"!=b.toggleMode&&(1==f.focusedH&&b._animate(a,!0),d=!0);break;case 37:if(0!=a)b.items[a-1]._header.focus();else{var g=b.items.length;b.items[g-1]._header.focus()}d=!0;break;case 38:if(0==c.ctrlKey)if(0!=a)b.items[a-1]._header.focus();else{var g=b.items.length;b.items[g-1]._header.focus()}else 1==f.focusedC&&f._header.focus();d=!0;break;case 39:a!=g-1?b.items[a+1]._header.focus():b.items[0]._header.focus(),d=!0;break;case 40:0==c.ctrlKey?a!=g-1?b.items[a+1]._header.focus():b.items[0]._header.focus():1==f.expanded&&f._content.focus(),d=!0;break;case 35:a!=g-1&&b.items[g-1]._header.focus(),d=!0;break;case 36:0!=a&&b.items[0]._header.focus(),d=!0}return!1}}),d&&c.preventDefault&&c.preventDefault(),!d})},_focus:function(){var b=this;this.disabled||a.each(this.items,function(c,d){var e=this;b.addHandler(e._header,"focus.navigationbar"+this.widgetID,function(){e.focusedH=!0,a.jqx.aria(e._header,"aria-selected",!0),e._header.addClass(b.toThemeProperty("jqx-fill-state-focus")),e._header.css("z-index",10)}),b.addHandler(e._header,"blur.navigationbar"+this.widgetID,function(){e.focusedH=!1,a.jqx.aria(e._header,"aria-selected",!1),e._header.hasClass("jqx-expander-header-hover")?e._header.css("z-index",5):e._header.css("z-index",0),e._header.removeClass(b.toThemeProperty("jqx-fill-state-focus"))}),b.addHandler(e._header_text,"focus.navigationbar"+this.widgetID,function(){e._header.focus()}),b.addHandler(e._arrow,"focus.navigationbar"+this.widgetID,function(){e._header.focus()}),b.addHandler(e._content,"focus.navigationbar"+this.widgetID,function(){e.focusedC=!0,e._content.addClass(b.toThemeProperty("jqx-fill-state-focus"))}),b.addHandler(e._content,"blur.navigationbar"+this.widgetID,function(){e.focusedC=!1,e._content.removeClass(b.toThemeProperty("jqx-fill-state-focus"))})})}})}(jQuery);
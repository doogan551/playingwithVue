!function(a){a.jqx.jqxWidget("jqxRadioButton","",{}),a.extend(a.jqx._jqxRadioButton.prototype,{defineInstance:function(){this.animationShowDelay=300,this.animationHideDelay=300,this.width=null,this.height=null,this.boxSize="13px",this.checked=!1,this.hasThreeStates=!1,this.disabled=!1,this.enableContainerClick=!0,this.locked=!1,this.groupName="",this.rtl=!1,this.aria={"aria-checked":{name:"checked",type:"boolean"},"aria-disabled":{name:"disabled",type:"boolean"}},this.events=["checked","unchecked","indeterminate","change"]},createInstance:function(a){this.render()},render:function(){this.setSize();var b=this;this.propertyChangeMap.width=function(a,c,d,e){b.setSize()},this.propertyChangeMap.height=function(a,c,d,e){b.setSize()},this.radiobutton&&this.radiobutton.remove(),this.radiobutton=a("<div><div><span></span></div></div>"),this.host.attr("role","radio"),this.host.attr("tabIndex")||this.host.attr("tabIndex",0),this.host.prepend(this.radiobutton),this.host.append(a('<div style="clear: both;"></div>')),this.checkMark=a(this.radiobutton).find("span"),this.box=a(this.radiobutton).find("div"),this._supportsRC=!0,a.jqx.browser.msie&&a.jqx.browser.version<9&&(this._supportsRC=!1),this.box.addClass(this.toThemeProperty("jqx-fill-state-normal")),this.box.addClass(this.toThemeProperty("jqx-radiobutton-default")),this.host.addClass(this.toThemeProperty("jqx-widget")),this.disabled&&this.disable(),this.host.addClass(this.toThemeProperty("jqx-radiobutton")),this.locked&&this.host.css("cursor","auto");var c=this.element.getAttribute("checked");"checked"!=c&&"true"!=c&&1!=c||(this.checked=!0),this._addInput(),this._render(),this._addHandlers(),a.jqx.aria(this)},_addInput:function(){var b=this.host.attr("name");this.input=a("<input type='hidden'/>"),this.host.append(this.input),b&&this.input.attr("name",b)},refresh:function(a){a||(this.setSize(),this._render())},resize:function(a,b){this.width=a,this.height=b,this.setSize()},setSize:function(){null!=this.width&&this.width.toString().indexOf("px")!=-1?this.host.width(this.width):void 0==this.width||isNaN(this.width)||this.host.width(this.width),null!=this.height&&this.height.toString().indexOf("px")!=-1?this.host.height(this.height):void 0==this.height||isNaN(this.height)||this.host.height(this.height)},_addHandlers:function(){var a=this;this.addHandler(this.box,"click",function(b){if(!a.disabled&&!a.enableContainerClick)return a.toggle(),b.preventDefault(),!1}),this.addHandler(this.host,"keydown",function(b){if(!a.disabled&&!a.locked&&32==b.keyCode)return a.toggle(),b.preventDefault(),!1}),this.addHandler(this.host,"click",function(b){if(!a.disabled&&a.enableContainerClick)return a.toggle(),b.preventDefault(),!1}),this.addHandler(this.host,"selectstart",function(b){!a.disabled&&a.enableContainerClick&&b.preventDefault()}),this.addHandler(this.host,"mouseup",function(b){!a.disabled&&a.enableContainerClick&&b.preventDefault()}),this.addHandler(this.host,"focus",function(b){if(!a.disabled&&a.enableContainerClick&&!a.locked)return a.box.addClass(a.toThemeProperty("jqx-radiobutton-hover")),a.box.addClass(a.toThemeProperty("jqx-fill-state-focus")),b.preventDefault(),!1}),this.addHandler(this.host,"blur",function(b){if(!a.disabled&&a.enableContainerClick&&!a.locked)return a.box.removeClass(a.toThemeProperty("jqx-radiobutton-hover")),a.box.removeClass(a.toThemeProperty("jqx-fill-state-focus")),b.preventDefault(),!1}),this.addHandler(this.host,"mouseenter",function(b){if(!a.disabled&&a.enableContainerClick&&!a.locked)return a.box.addClass(a.toThemeProperty("jqx-radiobutton-hover")),a.box.addClass(a.toThemeProperty("jqx-fill-state-hover")),b.preventDefault(),!1}),this.addHandler(this.host,"mouseleave",function(b){if(!a.disabled&&a.enableContainerClick&&!a.locked)return a.box.removeClass(a.toThemeProperty("jqx-radiobutton-hover")),a.box.removeClass(a.toThemeProperty("jqx-fill-state-hover")),b.preventDefault(),!1}),this.addHandler(this.box,"mouseenter",function(){a.disabled||a.enableContainerClick||(a.box.addClass(a.toThemeProperty("jqx-radiobutton-hover")),a.box.addClass(a.toThemeProperty("jqx-fill-state-hover")))}),this.addHandler(this.box,"mouseleave",function(){a.disabled||a.enableContainerClick||(a.box.removeClass(a.toThemeProperty("jqx-radiobutton-hover")),a.box.removeClass(a.toThemeProperty("jqx-fill-state-hover")))})},focus:function(){try{this.host.focus()}catch(a){}},_removeHandlers:function(){this.removeHandler(this.box,"click"),this.removeHandler(this.box,"mouseenter"),this.removeHandler(this.box,"mouseleave"),this.removeHandler(this.host,"click"),this.removeHandler(this.host,"mouseup"),this.removeHandler(this.host,"mousedown"),this.removeHandler(this.host,"selectstart"),this.removeHandler(this.host,"mouseenter"),this.removeHandler(this.host,"mouseleave"),this.removeHandler(this.host,"keydown"),this.removeHandler(this.host,"focus"),this.removeHandler(this.host,"blur")},_render:function(){null==this.boxSize&&(this.boxSize=13),this.box.width(this.boxSize),this.box.height(this.boxSize),this.disabled?this.disable():this.enableContainerClick?this.host.css("cursor","pointer"):this.host.css("cursor","auto"),this.rtl&&(this.box.addClass(this.toThemeProperty("jqx-radiobutton-rtl")),this.host.addClass(this.toThemeProperty("jqx-rtl"))),this.updateStates()},val:function(a){return 0==arguments.length||"object"==typeof a?this.checked:("string"==typeof a?("true"==a&&this.check(),"false"==a&&this.uncheck(),""==a&&this.indeterminate()):(1==a&&this.check(),0==a&&this.uncheck(),null==a&&this.indeterminate()),this.checked)},check:function(){this.checked=!0;var b=this;this.checkMark.removeClass(),this.checkMark.addClass(this.toThemeProperty("jqx-fill-state-pressed")),a.jqx.browser.msie?this.disabled?(this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-disabled")),this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-checked"))):this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-checked")):(this.disabled?(this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-disabled")),this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-checked"))):this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-checked")),this.checkMark.css("opacity",0),this.checkMark.stop().animate({opacity:1},this.animationShowDelay,function(){}));var c=a.find(".jqx-radiobutton");if(null==this.groupName&&(this.groupName=""),a.each(c,function(){var c=a(this).jqxRadioButton("groupName");c==b.groupName&&this!=b.element&&a(this).jqxRadioButton("uncheck")}),this._raiseEvent("0"),this._raiseEvent("3",{checked:!0}),0==this.checkMark.height())this.checkMark.height(this.boxSize),this.checkMark.width(this.boxSize);else if("13px"!=this.boxSize){var d=parseInt(this.boxSize)/2;this.checkMark.height(d),this.checkMark.width(d),this.checkMark.css("margin-left",1+d/4),this.checkMark.css("margin-top",1+d/4)}this.input.val(this.checked),a.jqx.aria(this,"aria-checked",this.checked)},uncheck:function(){var b=this.checked;this.checked=!1;var c=this;a.jqx.browser.msie?c.checkMark.removeClass():(this.checkMark.css("opacity",1),this.checkMark.stop().animate({opacity:0},this.animationHideDelay,function(){c.checkMark.removeClass()})),b&&(this._raiseEvent("1"),this._raiseEvent("3",{checked:!1})),this.input.val(this.checked),a.jqx.aria(this,"aria-checked",this.checked)},indeterminate:function(){var b=this.checked;this.checked=null,this.checkMark.removeClass(),a.jqx.browser.msie?this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-indeterminate")):(this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-indeterminate")),this.checkMark.css("opacity",0),this.checkMark.stop().animate({opacity:1},this.animationShowDelay,function(){})),null!=b&&(this._raiseEvent("2"),this._raiseEvent("3",{checked:null})),this.input.val(this.checked),a.jqx.aria(this,"aria-checked","undefined")},toggle:function(){if(!this.disabled&&!this.locked){var a=this.checked;1==this.checked?this.checked=!this.hasTreeStates||null:this.checked=!0,a!=this.checked&&this.updateStates(),this.input.val(this.checked)}},updateStates:function(){this.checked?this.check():0==this.checked?this.uncheck():null==this.checked&&this.indeterminate()},disable:function(){this.disabled=!0,1==this.checked?this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-disabled")):null==this.checked&&this.checkMark.addClass(this.toThemeProperty("jqx-radiobutton-check-indeterminate-disabled")),this.box.addClass(this.toThemeProperty("jqx-radiobutton-disabled")),this.host.addClass(this.toThemeProperty("jqx-fill-state-disabled")),a.jqx.aria(this,"aria-disabled",this.disabled)},enable:function(){this.host.removeClass(this.toThemeProperty("jqx-fill-state-disabled")),1==this.checked?this.checkMark.removeClass(this.toThemeProperty("jqx-radiobutton-check-disabled")):null==this.checked&&this.checkMark.removeClass(this.toThemeProperty("jqx-radiobutton-check-indeterminate-disabled")),this.box.removeClass(this.toThemeProperty("jqx-radiobutton-disabled")),this.disabled=!1,a.jqx.aria(this,"aria-disabled",this.disabled)},destroy:function(){this._removeHandlers(),this.host.remove()},_raiseEvent:function(a,b){var c=this.events[a],d=new jQuery.Event(c);d.owner=this,d.args=b;try{var e=this.host.trigger(d)}catch(f){}return e},propertyChangedHandler:function(b,c,d,e){if(void 0!=this.isInitialized&&0!=this.isInitialized){if(c!=this.enableContainerClick||this.disabled||this.locked||(e?this.host.css("cursor","pointer"):this.host.css("cursor","auto")),"rtl"==c&&(e?(b.box.addClass(b.toThemeProperty("jqx-radiobutton-rtl")),b.host.addClass(b.toThemeProperty("jqx-rtl"))):(b.box.removeClass(b.toThemeProperty("jqx-radiobutton-rtl")),b.host.removeClass(b.toThemeProperty("jqx-rtl")))),"checked"==c)switch(e){case!0:this.check();break;case!1:this.uncheck();break;case null:this.indeterminate()}"theme"==c&&a.jqx.utilities.setTheme(d,e,this.host),"disabled"==c&&(e?this.disable():this.enable())}}})}(jQuery);
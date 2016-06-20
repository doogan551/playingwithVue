window.workspaceManager=function(a){var b,c,d,e={};e.webEndpoint=window.location.origin,e.socketEndPoint=window.location.origin,e.apiEndpoint=e.webEndpoint+"/api/",e.user=ko.observable(""),e.workspace={},e.workspace.isVisible=ko.observable("false"),e.workspace.windows=ko.observableArray([]),e.systemEnums={},e.systemEnumObjects={},e.appHeight=ko.observable(),a(window).resize(function(){e.appHeight(b.height())}),e.sounds={beep:"data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="},e.displayableTypes=["display","report","sequence","alarm","activitylog","trendplot","script","slide show","dashboard"],e.workspace.activeSet=ko.observable("open"),e.workspace.filters={recent:{filter:{isRecent:!0},name:"Recent"},fav:{filter:{isFav:!0},name:"Favorites"},open:{filter:{isOpen:!0},name:"All Open Windows"},display:{filter:{type:"display",isOpen:!0},name:"Display Windows"},report:{filter:{type:"report",isOpen:!0},name:"Report Windows"},gpl:{filter:{type:"sequence",isOpen:!0},name:"GPL Windows"},alarm:{filter:{type:"alarm",isOpen:!0},name:"Alarm Windows"},activitylog:{filter:{type:"activitylog",isOpen:!0},name:"Activity Windows"},trendplot:{filter:{type:"trendplot",isOpen:!0},name:"Trend Plot Windows"},dashboard:{filter:{type:"dashboard",isOpen:!0},name:"Dashboard Windows"},script:{filter:{type:"script",isOpen:!0},name:"Script Windows"},slideShow:{filter:{type:"slide show",isOpen:!0},name:"Slide Show Windows"}},e.workspace.filteredWindows=ko.computed(function(){return ko.utils.arrayFilter(e.workspace.windows(),function(a){var b=e.workspace.filters[e.workspace.activeSet()].filter;if(!~e.displayableTypes.indexOf(a.type))return!1;for(var c in b)if(ko.unwrap(a[c])!==b[c])return!1;return!0})}),e.workspace.getFilteredWindowsByType=function(a){return ko.computed(function(){var b=ko.utils.arrayFilter(e.workspace.windows(),function(b){return b.type===a&&b.isOpen()===!0});return b})},e.workspace.filteredWindowsByType={display:e.workspace.getFilteredWindowsByType("display"),report:e.workspace.getFilteredWindowsByType("report"),sequence:e.workspace.getFilteredWindowsByType("sequence"),alarm:e.workspace.getFilteredWindowsByType("alarm"),activitylog:e.workspace.getFilteredWindowsByType("activitylog"),trendplot:e.workspace.getFilteredWindowsByType("trendplot"),dashboard:e.workspace.getFilteredWindowsByType("dashboard"),script:e.workspace.getFilteredWindowsByType("script"),slideShow:e.workspace.getFilteredWindowsByType("slide show"),devicetree:e.workspace.getFilteredWindowsByType("devicetree")},e.workspace.getRecentXPoints=function(a){return ko.computed(function(){for(var b=e.workspace.windows(),c=window.Config.Utility.pointTypes.getAllowedPointTypes().map(function(a){return a.key.toLowerCase()}),d=[],f=0,g=b.length;f<g;f++)~c.indexOf(b[f].type)&&d.push(b[f]);return d.slice(-a)})},e.workspace.isVisible.subscribe(function(b){var c,d=a("#workspaceToggle");b?(e.workspace.$mainWindowCloseBtn.hide(),c=function(){d.removeClass("fa-arrow-up").addClass("fa-arrow-down").parent().attr("title","Hide workspace")}):(e.currentMainWindowOccupant()&&e.workspace.$mainWindowCloseBtn.show(),c=function(){d.removeClass("fa-arrow-down").addClass("fa-arrow-up").parent().attr("title","Show workspace")}),setTimeout(c,250)}),e.workspace.showSet=function(a){e.workspace.activeSet(a)},e.workspace.isActiveSet=function(a){return a===e.workspace.activeSet()&&"bold"},e.workspace.animateOut=function(b){1===b.nodeType&&a(b).fadeOut(250,function(){a(this).remove()})},e.workspace.animateIn=function(b){1===b.nodeType&&a(b).css({marginLeft:20,opacity:0}).animate({marginLeft:0,opacity:1},{duration:500,easing:"easeInOutQuint"})},e.workspace.beforeMove=function(b){var c;1===b.nodeType&&(c=a(b),c.data("saveOffsetTop",c.offset().top-91),c.data("saveOffsetLeft",c.offset().left-157))},e.workspace.afterMove=function(b){var c,d,e,f;if(1===b.nodeType&&(c=a(b),d=c.parent(),e=c.data("saveOffsetTop"),f=c.data("saveOffsetLeft"),c.offset().top!==e||c.offset().left!==f)){var g=c.clone();c.css({visibility:"hidden"}),g.css({position:"absolute",width:c.outerWidth()}),d.append(g),g.css({top:e,left:f}).animate({top:c.offset().top-91,left:c.offset().left-157},500,"easeInOutQuint",function(){c.css({visibility:"visible"}),g.remove()})}},e.workspace.fav=function(a){a.isFav(!0)},e.workspace.unfav=function(a){a.isFav(!1)},e.workspace.applyThumbClass=function(a){var b="";switch(a.type){case"display":b="fa-sitemap";break;case"sequence":b="fa-code-fork";break;case"report":b="fa-file-text-o";break;case"alarm":b="fa-bell-o";break;case"activitylog":b="fa-comments-o";break;case"trendplot":b="fa-line-chart";break;case"dashboard":b="fa-tachometer";break;case"slide show":b="fa-film";break;case"script":b="fa-file-code-o"}return"thumbIcon fa fa-2x "+b},e.workspace.thumbError=function(b,c){a(c.target).hide().parent().find(".thumbIcon").show()},e.jiggleWindow=function(a,b){function c(a,b){var c=a.split(","),d=b<0?0:255,e=b<0?b*-1:b,f=parseInt(c[0].slice(4),10),g=parseInt(c[1],10),h=parseInt(c[2],10);return"rgb("+(Math.round((d-f)*e)+f)+","+(Math.round((d-g)*e)+g)+","+(Math.round((d-h)*e)+h)+")"}function d(){clearTimeout(h),i.style.backgroundColor=f,a.jiggling=!1}function e(){i.style.backgroundColor=i.style.backgroundColor===f?g:f,j=j>0?-j:j,a.moveBy(j,j),--b>0&&!a.document.hasFocus()?h=setTimeout(e,500):d()}var f,g,h,i=a.document.getElementById("backDrop"),j=3;i&&(b=parseInt(b,10),isNaN(b)&&(b=120),a.jiggling||(f=i.style.backgroundColor,g=c(f,.25),j=3,a.jiggling=!0,e()))},e.init=function(){var f,g=a("#login");return b=a("body"),d=a(".systemStatus"),c={init:!1,led:d.find(".led"),status:d.find(".text"),timer:null,setStatus:function(a){var b=this.led;switch(b.removeClass("led-red led-orange led-yellow led-green led-blue"),a){case"connecting":this.timer=setInterval(function(){b.toggleClass("led-yellow")},500),this.status.text("Connecting...");break;case"serverup":b.addClass("led-green"),this.status.text("Online");break;case"serverdown":b.addClass("led-red"),this.status.text("Offline")}}},window.opener?(window.opener.location.replace(window.location),window.close()):window.top!==window.self&&window.top.location.replace(window.location),f=e.readCookie("username"),e.login.rememberMe(!!f),e.login.username(f||""),window.isAuthenticated?void e.load():(g.show(),e.login.isLogIn(!0),ko.applyBindingsWithValidation(e.login,document.getElementById("login"),{registerExtenders:!0,messagesOnModified:!0,insertMessages:!1,decorateElement:!0,errorElementClass:"input-validation-error",errorMessageClass:"error"}),a("#user").focus(),void g.find(".form-group input").keyup(function(a){13===a.keyCode&&(e.login.isLogIn()?e.login.signIn():e.login.passwordReset())}))},e.load=function(){var b=a("#appContainer"),d=a("#login"),f={showThumbnailLink:ko.computed(function(){var a=e.user();return a["System Admin"]&&a["System Admin"].Value===!0}),openThumbnailBatch:function(){e.openWindow("/thumbnail/batch","Thumbnails","","Thumbnails",999999,1024,768)}};e.socket=io.connect(e.socketEndPoint),e.socket.emit("getStatus"),e.socket.on("statusUpdate",function(a){console.log("statusupdate",a),c.setStatus(a)}),e.refreshUserCtlr=function(a){var b=e.user(),c=ko.utils.arrayFilter(a,function(a){return a.name===b.username});c.length&&(b.controllerId=c[0].value,e.user(b))},e.socket.on("updatedSystemInfo",function(a){console.log(a),"controllers"===a.name?e.getSystemEnum("controllers",e.refreshUserCtlr):"Preferences"===a.name?e.getSystemEnum("telemetry"):e.getSystemEnum(a.name)}),e.getSystemEnum("controlpriorities"),e.getSystemEnum("qualityCodes"),e.getSystemEnum("telemetry"),e.getSystemEnum("controllers",e.refreshUserCtlr),e.loadNavigator(),e.$workspace=a("#workspace"),e.workspace.mainWindow=document.getElementById("mainWindow"),e.workspace.$mainWindowCloseBtn=a("#mainWindowClose"),e.showWorkspace(!0),window.userData.controllerId=0,e.user(window.userData),ko.applyBindings(f,a("#statusBar")[0]),ko.applyBindings(e,b[0]),d.hide(),b.show(),e.restoreWorkspace(),window.onbeforeunload=function(){e.workspace.windows();e.socket.disconnect(),e.persistWorkspace(),e.closeAll("shutdown")},e.initializeEventListeners(),setTimeout(function(){e.timer(e.windowMonitor,1e3)},5e3)},e.toggleWorkspace=function(){e.workspace.isVisible()?e.hideWorkspace():e.showWorkspace()},e.showWorkspace=function(b){return e.workspace.isVisible(!0),b?void e.$workspace.show().css({top:50}):void(a.support.transition?e.$workspace.show().transition({y:0},250,"easeOutQuint"):e.$workspace.show().animate({top:50},{duration:250,easing:"easeOutQuint"}))},e.hideWorkspace=function(b){return e.workspace.isVisible(!1),b?void e.$workspace.hide().css({top:a(window).height()}):void(a.support.transition?e.$workspace.transition({y:a(window).height()},250,"easeInQuint",function(){e.$workspace.hide()}):e.$workspace.animate({top:a(window).height()},{duration:250,easing:"easeInQuint",complete:function(){e.$workspace.hide()}}))},e.showDisplays=function(){e.workspace.showSet("display"),e.showWorkspace()},e.showGPLs=function(){e.workspace.showSet("gpl"),e.showWorkspace()},e.showAlarms=function(){e.workspace.showSet("alarm"),e.showWorkspace()},e.showActivities=function(){e.workspace.showSet("activitylog"),e.showWorkspace()},e.showTrendPlot=function(){e.workspace.showSet("trendplot"),e.showWorkspace()},e.showDashboard=function(){e.workspace.showSet("dashboard"),e.showWorkspace()},e.showScripts=function(){e.workspace.showSet("script"),e.showWorkspace()},e.showReports=function(){e.workspace.showSet("report"),e.showWorkspace()},e.showSlideShows=function(){e.workspace.showSet("slideShow"),e.showWorkspace()},e.showDeviceTree=function(){e.workspace.showSet("devicetree"),e.showWorkspace()},e.showNavigator=function(){var b=a("#navigatorWrapper"),c=a("#navigatorWindow"),d=document.getElementById("navigator"),e=50,f=25;c.css({opacity:0,top:e+100,bottom:f-100}).show(),b.css("opacity",0).show(),a.support.transition?b.transition({opacity:1},200,"snap",function(){c.transition({opacity:1,y:-100},300,"snap",function(){d.contentWindow.pointLookup.refreshUI()})}):b.animate({opacity:1},{duration:200,easing:"easeInQuint",complete:function(){c.animate({opacity:1,top:e,bottom:f},{duration:300,easing:"easeOutQuint",complete:function(){d.contentWindow.pointLookup.refreshUI()}})}})},e.showNavigatorFiltered=function(a){var b,c=document.getElementById("navigator"),d=[];if("Alarm"===a)return b=e.createUniqueId(),void e.openWindow("/alarms?"+b,"Recent Alarms","alarm","mainWindow","alarm"+b);if("Activity"===a)return void e.openWindow("/activityLogs","Activity Log","activitylog","mainWindow","activitylog");if("Trend Plot"===a)return b=e.createUniqueId(),void e.openWindow("/trendPlots?"+b,"Trend Plot","trendplot","mainWindow","trendplot"+b);if("Dashboard"===a)return b=e.createUniqueId(),void e.openWindow("/dashboard","Dashboard","dashboard","mainWindow","dashboard");if("Point Involvement"===a)return b=e.createUniqueId(),void e.openWindow("/report/cr/pointInvolvement?"+b,"Point Involvement","pointInvolvement","mainWindow","pointInvolvement"+b);if("Device Tree"===a)return b=e.createUniqueId(),void e.openWindow("/devicetree?"+b,"Device Tree","devicetree","mainWindow","devicetree"+b);if("object"==typeof a)switch(e.workspace.activeSet()){case"display":d.push("Display");break;case"report":d.push("Report");break;case"gpl":d.push("Sequence");break;case"script":d.push("Script");break;case"slideShow":d.push("Slide Show");break;case"alarm":return b=e.createUniqueId(),void e.openWindow("/alarms?"+b,"Recent Alarms","alarm","mainWindow","alarm"+b);case"trendplot":return b=e.createUniqueId(),void e.openWindow("/trendPlots?"+b,"Trend Plot","trendplot","mainWindow","activity"+b);case"dashboard":return b=e.createUniqueId(),void e.openWindow("/dashboard?"+b,"Dashboard","dashboard","mainWindow","dashboard"+b);case"activitylog":return void e.openWindow("/activityLogs","Activity Log","activitylog","mainWindow","activitylog")}else d.push(a);c.contentWindow&&c.contentWindow.pointLookup&&c.contentWindow.pointLookup.checkPointTypes(d),e.showNavigator()},e.hideNavigator=function(){var b=a("#navigatorWrapper"),c=a("#navigatorWindow");a.support.transition?c.transition({opacity:0,y:100},200,"easeOutExpo",function(){c.hide(),b.transition({opacity:0},300,"easeOutExpo",function(){b.hide()})}):(c.animate({opacity:0},{duration:200,easing:"easeInQuint",complete:function(){c.hide()}}),b.delay(100).animate({opacity:0},{duration:300,easing:"easeInQuint",complete:function(){b.hide()}}))},e.focusWindow=function(a){var b,c=ko.utils.arrayFirst(e.workspace.windows(),function(b){return b.upi()===a});c&&(b="mainWindow"===c.target()||c.isOpen()===!1?"mainWindow":"",e.openWindow(c.url,c.title(),c.type,b,a,c.width(),c.height()))},e.openWindowPositioned=function(b,c,d,f,g,h){var i="undefined"==typeof window.screenLeft?screen.left:window.screenLeft,j="undefined"==typeof window.screenTop?screen.top:window.screenTop,k=window.innerWidth?window.innerWidth:document.documentElement.clientWidth?document.documentElement.clientWidth:screen.width,l=window.innerHeight?window.innerHeight:document.documentElement.clientHeight?document.documentElement.clientHeight:screen.height,m={width:1250,height:750,callback:function(){}};return h&&a.extend(m,h),m.top=m.top||l/2-m.height/2+j,m.left=m.left||k/2-m.width/2+i,e.openWindow(b,c,d,f,g,m.width,m.height,m.callback,m.top,m.left)},e.openWindow=function(a,b,c,d,f,g,h,i,j,k){var l,m,n,o,p=e.qualifyURL(a),q="mainWindow"===d?"mainWindow":"pid_"+f,r=e.workspace.windows(),s=ko.utils.arrayFirst(r,function(a){return a.upi()===f}),t=g||800,u=h||500,v=k||0,w=j||0,x=!1,y=i||function(){};return"mainWindow"===q&&(e.hideWorkspace(),e.hideNavigator()),l=e.getWindowReference("",q,t,u,v,w),n=e.getFrame(l),e.newWindowOkToOpen(l.location.href,p)&&("mainWindow"===q?(e.addEvent(n||l,"load",function(){var a=this.contentWindow;a.opener=window,a.upi=f,y.call(l)}),l.location.replace(p),e.workspace.$mainWindowCloseBtn.show()):(l.close(),l=e.getWindowReference(p,q,t,u,v,w),l.opener=window,l.upi=f,e.addEvent(n||l,"load",function(){l.document.title=b,y.call(l)}))),l.top.focus(),s&&(x=s.isFav(),s.target()!==q&&(m=e.getWindowReference("",s.target()),"mainWindow"!==q?(e.showWorkspace(),e.hideNavigator(),e.closeMainWindow(!0)):m.close()),r=r.filter(function(a){return a.upi()!=s.upi()})),o=new e.Instance(p,q,c.toLowerCase(),b,f,t,u,x,null,l,(!0)),o.isOpen(!0),o.isRecent(!0),r.unshift(o),e.workspace.windows(r),l},e.newWindowOkToOpen=function(a,b){return e.removeHash(a)!==e.removeHash(b)},e.close=function(a){var b;b="object"==typeof a?a:ko.utils.arrayFirst(e.workspace.windows(),function(b){return b.upi()===a}),b&&("mainWindow"!==b.target()?!!b.ref()&&!b.ref().closed&&b.ref().close():(!!b.ref()&&(b.ref().location.href="about:blank"),e.workspace.$mainWindowCloseBtn.hide()),b.ref(void 0),b.isOpen(!1))},e.closeAll=function(a){var b,c;b="string"!=typeof a?"open":e.workspace.activeSet(),ko.utils.arrayFilter(e.workspace.windows(),function(d){var f=e.workspace.filters[b].filter;for(var g in f)if(ko.unwrap(d[g])!==f[g])return!1;c=d.ref(),c&&(console.log(c),"mainWindow"===c.name?e.closeMainWindow(!0):c&&!c.closed&&c.close(),"shutdown"!=a&&(d.ref(void 0),d.isOpen(!1)))})},e.closeMainWindow=function(a){var b,c=e.currentMainWindowOccupant();if(c)return e.close(c),b=e.getLastMainWindow(),!b||a?void e.showWorkspace():void e.openWindow(b.url,b.title(),b.type,b.target(),b.upi())},e.getFrame=function(a){try{return a.frameElement}catch(b){return null}},e.getWindowReference=function(a,b,c,d,e,f){return window.open(a,b,"width="+c+", height="+d+", resizable=1,scrollbars=1, left="+e+", top="+f)},e.persistWorkspace=function(){for(var b={},c=[],d=e.workspace.windows(),f=0,g=d.length;f<g;f++)b=a.extend({},d[f]),delete b.ref,~e.displayableTypes.indexOf(b.type)&&(b.isOpen()||b.isFav())&&c.push(ko.toJS(b));store.set("workspace_"+e.user()._id,c)},e.loadWorkspace=function(){return store.get("workspace_"+e.user()._id)||[]},e.restoreWorkspace=function(){for(var a,b,c=e.loadWorkspace(),d=!1,f=0,g=c.length;f<g;f++)a=c[f],a.isOpen||!a.isFav?"mainWindow"===a.target&&d?(b=new e.Instance(a.url,a.target,a.type,a.title,a.upi,a.width,a.height,a.isFav,a.thumb,null,a.isRecent),b.isOpen(!0),e.workspace.windows.push(b)):(e.openWindow(a.url,a.title,a.type,a.target,a.upi,a.width,a.height,a.isFav),"mainWindow"===a.target&&(d=!0)):e.workspace.windows.push(new e.Instance(a.url,a.target,a.type,a.title,a.upi,a.width,a.height,a.isFav,a.thumb,null,a.isRecent))},e.getLastMainWindow=function(){var a,b,c=e.workspace.windows().length;for(b=0;b<c;b++)if(a=e.workspace.windows()[b],"mainWindow"===a.target()&&a.isOpen())return a;return null},e.currentMainWindowOccupant=function(){return ko.utils.arrayFirst(e.workspace.windows(),function(a){return!!a.ref()&&"mainWindow"===a.ref().name&&e.removeHash(e.workspace.mainWindow.contentWindow.location.href)===e.removeHash(a.url)})},e.timer=function(a,b){var c=function(b){return function(){setTimeout(c,b);try{a.call(null)}catch(d){}}}(b);setTimeout(c,b)},e.windowMonitor=function(){for(var a=0,b=e.workspace.windows().length;a<b;a++){var c=e.workspace.windows()[a];c.ref()&&"mainWindow"!==c.target()&&c.ref().closed&&e.close(c.upi())}},e.Instance=function(a,b,c,d,f,g,h,i,j,k,l){var m=this;m.url=e.qualifyURL(a),m.target=ko.observable(b),m.type=c,m.title=ko.observable(d),m.upi=ko.observable(f),m.width=ko.observable(g),m.height=ko.observable(h),m.isFav=ko.observable(i),m.thumb=ko.observable(j),m.ref=ko.observable(k),m.isRecent=ko.observable(l),m.isOpen=ko.observable(!1)},e.qualifyURL=function(a){var b,c=document.createElement("a");return c.href=a,b=c.href},e.removeHash=function(a){return a.split("#")[0]},e.createUniqueId=function(){return Math.random().toString(36).slice(2)},e.initializeEventListeners=function(){e.$workspace.on("mouseenter",".thumb",function(b){var c=a(this),d=c.find(".thumbControls");d.data("right",-d.outerWidth()),d.animate({right:0},{duration:150,easing:"easeOutQuint"})}),e.$workspace.on("mouseleave",".thumb",function(b){var c=a(this),d=c.find(".thumbControls");d.stop(!0,!0).animate({right:d.data("right")},{duration:150,easing:"easeInQuint"})})},e.loadNavigator=function(){var a=window.open("/pointlookup","navigator");e.addEvent(document.getElementById("navigator"),"load",function(){a.pointLookup.init()})},e.login={username:ko.observable("").extend({required:{message:"Please enter a valid username"}}),password:ko.observable("").extend({required:{message:"Please enter a password"}}),rememberMe:ko.observable(!1),errorMessage:ko.observable(""),isLogIn:ko.observable(!1),oldPassword:ko.observable("").extend({required:{message:"Please enter the current password"}}),newPassword1:ko.observable("").extend({required:{message:"Please enter a valid new password"}}).extend({validation:{validator:function(a,b){return a!==b.login.oldPassword()},message:"New and old password can not be the same",params:e}}),newPassword2:ko.observable("").extend({required:{message:"Please retype the new password"}}).extend({validation:{validator:function(a,b){return a===b.login.newPassword1()},message:"Passwords must match",params:e}}),signIn:function(){var b=a("button.signIn");return b.focus(),e.loginValidation.showAllMessages(),e.login.username.isValid()&&e.login.password.isValid()?(b.attr("disabled","disabled"),console.log(e),void a.ajax({url:e.webEndpoint+"/authenticate",contentType:"application/json",dataType:"json",type:"post",data:ko.toJSON({username:this.username(),password:this.password(),"remember-me":this.rememberMe().toString()})}).done(function(c){var d,g=a("#login");return b.removeAttr("disabled"),c.resetPass?(e.login.errorMessage(c.message),e.login.isLogIn(!1),void a("#oldPassword").focus()):c.message?void e.login.errorMessage(c.message):c.err?void e.login.errorMessage(c.err):void(c._id&&(window.userData=c,e.login.setupAutoLogout(window.userData),d=f.encode((new Date).getTime().toString().split("").reverse().join("")),store.set("sessionId",d),a("#appContainer").show(),a.support.transition?g.css("overflow","hidden").find("fieldset").transition({y:1e3},350,"easeInExpo",function(){g.transition({opacity:0,y:51},500,"snap"),e.load()}):g.css("overflow","hidden").find("fieldset").animate({top:1e3},500,"easeInExpo",function(){g.animate({opacity:0,top:51},500,"easeInExpo"),e.load()})))})):void a("input.input-validation-error:first").focus()},setupAutoLogout:function(b){var c,d,e=new Date,f=b.idleTimeout,g=b.sessionLength,h=0,i=!1,j=!1;if(c=new Date(e.getTime()+6e4*g),d=new Date(c.getTime()-9e5),a(document).ready(function(){a(this).mousemove(function(a){h=0,i=!1}),a(this).keypress(function(a){h=0,i=!1})}),f>0){setInterval(function(){h++,h>f?window.location.href="/logout":h>f-5&&!i&&(alert("You will be automatically logged out in 5 minutes due to inactivity."),i=!0)},6e4)}if(g>0){setInterval(function(){new Date>c?(console.log("session signout",new Date,new Date-e),window.location.href="/logout"):new Date>d&&!j&&(j=!0,alert("You will be automatically logged out in 15 minutes. Please save your work."))},6e4)}},passwordReset:function(){var b=a("button.resetPass");return b.focus(),e.passResetValidation.showAllMessages(),e.login.oldPassword.isValid()&&e.login.newPassword1.isValid()&&e.login.newPassword2.isValid()?(b.attr("disabled","disabled"),void a.ajax({url:e.webEndpoint+"/reset-password",contentType:"application/json",dataType:"json",type:"post",data:ko.toJSON({username:this.username(),oldPass:this.oldPassword(),newPass:this.newPassword1()})}).done(function(c){console.log(c);a("#login");return b.removeAttr("disabled"),c.message?(e.login.errorMessage(c.message),e.login.isLogIn(!0),e.login.username(""),e.login.password(""),e.login.oldPassword(""),e.login.newPassword1(""),e.login.newPassword2(""),a("#user").focus(),void e.loginValidation.showAllMessages(!1)):c.err?void e.login.errorMessage(c.err):void 0})):void a("input.input-validation-error:first").focus()}},e.login.animate=ko.computed(function(){var b=a("#login").find(".errorMessage"),c=this;return c.errorMessage()?(c.timer&&clearTimeout(c.timer),c.timer=setTimeout(function(){b.removeClass("flipInX").fadeOut(500,function(){c.errorMessage("")})},3e3),"flipInX"):""},e.login),e.loginValidation=ko.validation.group([e.login.username,e.login.password],{deep:!1}),e.passResetValidation=ko.validation.group([e.login.oldPassword,e.login.newPassword1,e.login.newPassword2],{deep:!1}),e.getSystemEnum=function(b,c){return a.ajax({url:e.apiEndpoint+"system/"+b,contentType:"application/json",dataType:"json",type:"get"}).done(function(a){var d,f=0,g=a.length,h={},i=[{name:"None",value:0}],j=function(a,b){var c="Quality Code",d="Quality Code Label",e="Quality Code Font HTML Color";return b?void(b[a[d]]={code:a[c],color:a[e]}):{code:a[c],label:a[d],color:a[e]}},k=function(a,b){var c="Controller ID",d="Controller Name",e="Description",f="isUser";return b?void(h[a[c]]={name:a[d],description:a[e],isUser:a[f]}):{name:a[d],value:a[c]}},l=function(a,b){var c="Priority Level",d="Priority Text";return b?void(b[a[c]]=a[d]):{name:a[d],value:a[c]}};if("controlpriorities"===b)for(h[0]="None",f;f<g;f++)d=a[f],l(d,h),i.push(l(d));else if("controllers"===b)for(h[0]={name:"None",description:"None",isUser:!1},f;f<g;f++)d=a[f],k(d,h),i.push(k(d));else if("qualityCodes"===b)for(i=[],a=a.Entries||[],g=a.length,f;f<g;f++)d=a[f],i.push(j(d)),j(d,h);else if("telemetry"===b){i=[];for(var m in a)i.push({name:m,value:a[m]});h=a}e.systemEnums[b]=i,e.systemEnumObjects[b]=h,c&&c(i)}).fail(function(a,c){console.log("Get system enum ("+b+") failed",a,c),e.systemEnums[b]=[],e.systemEnumObjects[b]={}})},e.addEvent=function(a,b,c){a.addEventListener?a.addEventListener(b,c,!1):a.attachEvent&&a.attachEvent("on"+b,c)},e.removeEvent=function(a,b,c){a.removeEventListener?a.removeEventListener(b,c,!1):a.detachEvent&&a.detachEvent("on"+b,c)},e.readCookie=function(a){for(var b=a+"=",c=document.cookie.split(";"),d=0;d<c.length;d++){for(var e=c[d];" "===e.charAt(0);)e=e.substring(1,e.length);if(0===e.indexOf(b))return e.substring(b.length,e.length)}return null},e.createCookie=function(a,b,c){var d=new Date,e="; expires="+d.toGMTString();c?d.setTime(d.getTime()+24*c*60*60*1e3):e="",document.cookie=a+"="+b+e+"; path=/"},e.captureThumbnail=function(a){var b=a.upi,c=a.name,d=a.type,f=function(){var a=e.thumbnailWindowRef.thumbnailGenerator;console.log("wsm init thumbnail"),a.captureList([{id:b,name:c,type:d,tn:!1}]),a.nextCapture()};e.thumbnailWindowRef?f():e.thumbnailWindowRef=e.openWindowPositioned(window.location.origin+"/thumbnail/"+b,"Capture Thumbnail","","thumbnailframe","thumbnailframe",{callback:f,width:10,height:10})},e.showConfirmation=function(b){var c=b||{},d='<div id="confirm" data-backdrop="static" data-keyboard="false" class="modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-default cancel">Cancel</button><button type="button" class="btn btn-primary ok">OK</button></div></div></div></div>',e=c.targetDocument||document,f=a(e),g=f.find("#confirm"),h=g.length?g:f.find("body").append(d)?f.find("#confirm"):a(),i=h.find(".modal-header"),j=h.find(".modal-body"),k=h.find(".btn.ok"),l=h.find(".btn.cancel"),m=["btn-default","btn-primary","btn-success","btn-info","btn-warning","btn-danger"],n=m.indexOf(c.okClass)>-1?c.okClass:"btn-primary",o=m.indexOf(c.cancelClass)>-1?c.cancelClass:"btn-default",p=function(a){k.off(),l.off(),h.modal("hide"),f.find(".modal-backdrop").remove(),c.callback&&c.callback(a)};k.off().on("click",function(){p(!0)}),l.off().on("click",function(){p(!1)}),c.title?(i.show(),i.html(c.title)):i.hide(),j.html(c.message||"Are you sure you want to do this?"),k.text(c.okText||"OK"),k.removeClass(m.join(" ")).addClass(n),l.text(c.cancelText||"Cancel"),l.removeClass(m.join(" ")).addClass(o),f.find("body").append('<div class="modal-backdrop fade in"></div>'),h.modal({backdrop:!1,show:!0})},e.playSound=function(a){a=e.sounds[a],a&&(a=new Audio(a),a.play())};var f=function(){"use strict";var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",b=function(a){var b,c,d="";for(a=a.replace(/\r\n/g,"\n"),c=0;c<a.length;c++)b=a.charCodeAt(c),b<128?d+=String.fromCharCode(b):b>127&&b<2048?(d+=String.fromCharCode(b>>6|192),d+=String.fromCharCode(63&b|128)):(d+=String.fromCharCode(b>>12|224),d+=String.fromCharCode(b>>6&63|128),d+=String.fromCharCode(63&b|128));return d},c=function(a){for(var b="",c=0,d=0,e=0,f=0;c<a.length;)d=a.charCodeAt(c),d<128?(b+=String.fromCharCode(d),c++):d>191&&d<224?(e=a.charCodeAt(c+1),b+=String.fromCharCode((31&d)<<6|63&e),c+=2):(e=a.charCodeAt(c+1),f=a.charCodeAt(c+2),b+=String.fromCharCode((15&d)<<12|(63&e)<<6|63&f),c+=3);return b},d=function(c){var d,e,f,g,h,i,j,k="",l=0;for(console.log(c),c=b(c);l<c.length;)d=c.charCodeAt(l++),e=c.charCodeAt(l++),f=c.charCodeAt(l++),g=d>>2,h=(3&d)<<4|e>>4,i=(15&e)<<2|f>>6,j=63&f,isNaN(e)?i=j=64:isNaN(f)&&(j=64),k+=a.charAt(g),k+=a.charAt(h),k+=a.charAt(i),k+=a.charAt(j);return k},e=function(b){var d,e,f,g,h,i,j,k="",l=0;for(b=b.replace(/[^A-Za-z0-9\+\/\=]/g,"");l<b.length;)g=a.indexOf(b.charAt(l++)),h=a.indexOf(b.charAt(l++)),i=a.indexOf(b.charAt(l++)),j=a.indexOf(b.charAt(l++)),d=g<<2|h>>4,e=(15&h)<<4|i>>2,f=(3&i)<<6|j,k+=String.fromCharCode(d),64!==i&&(k+=String.fromCharCode(e)),64!==j&&(k+=String.fromCharCode(f));return c(k)};return{encode:d,decode:e}}();return{init:e.init,showConfirmation:e.showConfirmation,captureThumbnail:e.captureThumbnail,playSound:e.playSound,focusWindow:e.focusWindow,openWindow:e.openWindow,openWindowPositioned:e.openWindowPositioned,user:function(){return JSON.parse(JSON.stringify(e.user()))},windows:e.workspace.windows,config:window.Config,systemEnums:e.systemEnums,systemEnumObjects:e.systemEnumObjects,sessionId:function(){return store.get("sessionId")},socket:function(){return e.socket}}}(jQuery),$(workspaceManager.init),ko.observableArray.fn.filterByProperty=function(a,b){return ko.computed(function(){for(var c=this(),d=[],e=0;e<c.length;e++){var f=c[e];
ko.unwrap(f[a])===b&&d.push(f)}return d},this)},ko.observableArray.fn.filterByProperties=function(a){return ko.computed(function(){for(var b=this(),c=[],d=0;d<b.length;d++)for(var e=b[d],f=0;f<a.length&&ko.unwrap(e[a[f].prop])===a[f].val;f++)f===a.length-1&&c.push(e);return c},this)},ko.bindingHandlers.setMaxHeight={update:function(a,b,c){var d,e=$(a),f=b(),g=c(),h=ko.utils.unwrapObservable(f),i=g.reduceBy||0,j=g.reduceByOffsetElement,k=0;"undefined"!=typeof j&&(d=$(j),e.add(e.parentsUntil(d)).each(function(){k+=$(this).position().top})),$(a).css("max-height",h-i-k)}},ko.bindingHandlers.fadeInText={update:function(a,b){b();$(a).fadeOut(100,function(){ko.bindingHandlers.text.update(a,b),$(a).fadeIn("fast")})}},ko.bindingHandlers.dataSrc={update:function(a,b){var c=b()(),d=$(a),e=d.parent(),f=e.find(".thumbIcon");$.ajax({url:"/img/thumbs/"+c+".txt",dataType:"text",type:"get"}).done(function(a){var b=a.split("||"),c=b[0],f=b[1];d.attr("src",f),"undefined"!=c&&e.css("background-color",c)}).fail(function(){d.hide(),f.show()})}};
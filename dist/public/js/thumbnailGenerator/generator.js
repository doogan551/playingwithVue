var thumbnailGenerator=function(a){var b,c,d,e={},f={},g={},h=0,i=null;return window.workspaceManager=window.opener&&window.opener.workspaceManager||{openWindow:function(){},openWindowPositioned:function(){}},e.webEndpoint=window.location.origin,e.apiEndpoint=e.webEndpoint+"/thumbnail/",e.sequences=data.gpl,e.sequenceSelector="#gplCanvas",e.displays=data.displays,e.displaySelector="#display",e.timer=null,e.vm={errorList:ko.observableArray([]),errorDetailList:ko.observableArray([]),captureList:ko.observableArray(data),totalItemsToProcess:ko.observable(0),currentThumbName:ko.observable(""),thumb:ko.observable(""),currentCaptureData:ko.observable({}),updateAll:ko.observable(!0)},e.vm.updateAll.subscribe(function(a){e.vm.totalItemsToProcess(e.getItemsToCapture().length)}),e.getItemsToCapture=function(){return e.vm.updateAll()?e.vm.captureList():ko.utils.arrayFilter(e.vm.captureList(),function(a){return 0==a.tn})},e.vm.itemsToCapture=ko.computed(e.getItemsToCapture),e.vm.totalItemsProcessed=ko.computed(function(){return e.vm.totalItemsToProcess()-e.getItemsToCapture().length}),e.vm.percentComplete=ko.computed(function(){var a=100*(e.vm.totalItemsProcessed()/e.vm.totalItemsToProcess()||0);return a.toFixed(3)}),e.createFetcher=function(){c=window.open("/thumbnail/capture","fetcher","width=1200,height=6100,toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=1,left=0,top=0")},e.removeFetcher=function(){d.onload=null,d.contentWindow.location="about:blank",d.contentWindow.location.reload(),c.location="about:blank",c.location.reload(),h=0,c.close(),c=null,i=1,setTimeout(function(){i=null,e.nextCapture()},5e3)},e.startCaptureProcess=function(){var a=[];e.cancelProcess=!1,f.$updateAll.prop("disabled",!0),f.$btnStart.hide(),f.$btnCancel.show(),f.$activity.show(),a=e.getItemsToCapture(),e.vm.captureList(a),e.nextCapture()},e.cancelCaptureProcess=function(){e.removeFetcher(),e.cancelProcess=!0,f.$btnStart.show(),f.$btnCancel.hide()},e.nextCapture=function(b,f,g){var j;if(f&&(e.vm.thumb("/js/thumbnailGenerator/thumbError.png"),e.vm.currentThumbName(b),e.vm.errorList.push(b),e.vm.errorDetailList.push(g)),!e.cancelProcess){if(h>20)return void e.removeFetcher();if(!c||c&&c.closed)return void(i||e.createFetcher());d=c.document.getElementById("fetcher"),j=e.vm.captureList.shift(),j?(e.vm.currentCaptureData(j),e.load[j.type](),h++):(a("#msg").html("Thumbnail Complete"),c.close())}},e.load={sequence:function(){var a=e.vm.currentCaptureData();d.onload=function(){console.log("loaded"),d.contentWindow.onerror=function(b,c,f){return d.contentWindow.onerror=null,d.contentWindow.jQuery("body").unbind("sequenceLoaded"),console.log("aaaaaaaaaaaarrrrrrrrrrrrrrrrrrrrrrgggg"),setTimeout(function(){e.nextCapture(a.name,!0,{err:b,lineNum:f})},100),!1},d.contentWindow.gpl?d.contentWindow.gpl.onRender(function(c){setTimeout(function(c){b=d.contentWindow.jQuery(e.sequenceSelector)[0],e.capture(a.id,b,a.name,e.nextCapture,c)}(c),100)}):(console.error("No gpl",a),setTimeout(function(){e.nextCapture(a.name,!0)},100))},d.src="/gpl/view/"+a.id+"?nosocket&nobg&nolog"},display:function(){var a,c=e.vm.currentCaptureData();d.onload=function(){console.log("LOADED"),d.contentWindow.displays&&d.contentWindow.displays.onRender(function(){if("undefined"==typeof d.contentWindow.jQuery)return console.log("JQUERY UNDEFINED"),void e.nextCapture(c.name,!0);var f;a=d.contentWindow.jQuery(e.displaySelector),b=a[0],f=a.css("background-color"),a.css("background-color","transparent"),e.capture(c.id,b,c.name,e.nextCapture,f)})},d.src="/displays/view/"+c.id+"?nosocket"}},e.thumb={width:250,height:141,margin:10},e.renderImage=function(a,b,c,d,f){var h=new Image,i=c.toDataURL();h.onload=function(){console.log("RENDERIMAGE - IMAGE LOADED");var c=document.createElement("canvas"),i=c.getContext("2d"),j={width:e.thumb.width-2*e.thumb.margin,height:e.thumb.height-2*e.thumb.margin};i.canvas.width=e.thumb.width,i.canvas.height=e.thumb.height,e.thumb.proposed={},h.naturalWidth>h.naturalHeight?(e.thumb.ratio=j.width/h.naturalWidth,e.thumb.proposed.width=h.naturalWidth*e.thumb.ratio,e.thumb.proposed.height=h.naturalHeight*e.thumb.ratio,e.thumb.proposed.height>j.height&&(e.thumb.ratio=j.height/e.thumb.proposed.height,e.thumb.proposed.height=e.thumb.proposed.height*e.thumb.ratio,e.thumb.proposed.width=e.thumb.proposed.width*e.thumb.ratio)):(e.thumb.ratio=j.height/h.naturalHeight,e.thumb.proposed.width=h.naturalWidth*e.thumb.ratio,e.thumb.proposed.height=h.naturalHeight*e.thumb.ratio),e.thumb.proposed.x=j.width/2-e.thumb.proposed.width/2+e.thumb.margin,e.thumb.proposed.y=j.height/2-e.thumb.proposed.height/2+e.thumb.margin,i.drawImage(h,e.thumb.proposed.x,e.thumb.proposed.y,e.thumb.proposed.width,e.thumb.proposed.height),e.thumb.data=i.canvas.toDataURL(),e.save(a,e.thumb.data,f),!!d&&d(b),h=null,g.thumbnailCallback&&g.thumbnailCallback()},h.onerror=function(){console.log("RENDERIMAGE - IMAGE LOAD ERROR",arguments),!!d&&d(b,!0),h=null},h.src=i,e.vm.thumb(i),e.vm.currentThumbName(b)},e.capture=function(b,c,d,f,g){clearTimeout(e.timer),a(c).is("canvas")?e.processCanvas(b,c,d,f,g):"undefined"==typeof html2canvas?(console.log("CAPTURING - loading html 2 canvas script"),a.getScript("/js/thumbnailGenerator/html2canvas.js").done(function(){e.processHTML(b,c,d,f,g)})):e.processHTML(b,c,d,f,g)},e.processCanvas=function(b,c,d,f,g){var h,i,j,k=a(c)[0],l=k.getContext("2d"),m=30,n=document.createElement("canvas").getContext("2d");return a(".cvs").attr("src",k.toDataURL()),g.top=Math.floor(g.top),g.bottom=Math.ceil(g.bottom),g.left=Math.floor(g.left),g.right=Math.ceil(g.right),h=g.bottom-g.top,i=g.right-g.left,0==i?void(!!f&&f(d,!0)):(j=l.getImageData(g.left,g.top,i,h),l=null,n.canvas.width=i+2*m,n.canvas.height=h+2*m,n.putImageData(j,m,m),e.renderImage(b,d,n.canvas,f,"#fff"),void(j=null))},e.processCanvas_old=function(b,c,d,f){var g,h,i,j,k,l,m,n,o=a(c)[0],p=o.getContext("2d"),q=30,r=document.createElement("canvas").getContext("2d"),s={top:null,left:null,right:null,bottom:null};for(g=p.getImageData(0,0,p.canvas.width,p.canvas.height),h=g.data.length,i=0;i<h;i+=4)200!==g.data[i+0]&&190!==g.data[i+0]&&170!==g.data[i+0]&&(j=i/4%p.canvas.width,k=~~(i/4/p.canvas.width),null===s.top&&(s.top=k),null===s.left?s.left=j:j<s.left&&(s.left=j),null===s.right?s.right=j:s.right<j&&(s.right=j),null===s.bottom?s.bottom=k:s.bottom<k&&(s.bottom=k));return l=s.bottom-s.top,m=s.right-s.left,0==m?void(!!f&&f(d,!0)):(n=p.getImageData(s.left,s.top,m,l),p=null,r.canvas.width=m+2*q,r.canvas.height=l+2*q,r.fillStyle="#C8BEAA",r.fillRect(0,0,m+2*q,l+2*q),r.putImageData(n,q,q),e.renderImage(b,d,r.canvas,f),void(n=null))},e.processHTML=function(a,b,c,d,f){try{html2canvas(b,{onrendered:function(g){console.log("BEFORE RENDER -----------------------------------"),console.log("width",g.width,"height",g.height),b.parentNode.removeChild(b),e.renderImage(a,c,g,d,f)},logging:!0})}catch(g){console.log("ERROR RENDERING"),b.parentNode.removeChild(b),!!d&&d(c,!0)}},e.processSVG=function(b,c,d,f){var g,h,i,j,k=function(a){var b=a.replace(/>\s+/g,">").replace(/\s+</g,"<"),c=b.replace('xmlns="http://www.w3.org/2000/svg"','xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'),d=c.replace(' href="',' xlink:href="');return d},l=document.createElement("canvas"),m=l.getContext("2d"),n=new XMLSerializer,o=k(n.serializeToString(c)),p=a('<div id="SVGCanvas" style="position:absolute;left:-5000;">').appendTo("body"),q=SVG("SVGCanvas").size("100%","100%").fixSubPixelOffset(),r=function(){var a,c,g,h,i,j,k,n,o=document.createElement("canvas").getContext("2d"),p={top:null,left:null,right:null,bottom:null};for(a=m.getImageData(0,0,m.canvas.width,m.canvas.height),c=a.data.length,g=0;g<c;g+=4)0!==a.data[g+3]&&(h=g/4%m.canvas.width,i=~~(g/4/m.canvas.width),null===p.top&&(p.top=i),null===p.left?p.left=h:h<p.left&&(p.left=h),null===p.right?p.right=h:p.right<h&&(p.right=h),null===p.bottom?p.bottom=i:p.bottom<i&&(p.bottom=i));j=p.bottom-p.top,k=p.right-p.left,n=m.getImageData(p.left,p.top,k,j),l=null,m=null,o.canvas.width=k,o.canvas.height=j,o.putImageData(n,0,0),e.renderImage(b,d,o.canvas,f),n=null};c.parentNode.removeChild(c),q.clear().svg(o),g=q.bbox(),i=g.width,j=g.height,g.width>g.height&&(h=e.thumb.width/g.width,j=g.height*h,i=g.width*h,j>e.thumb.height&&(h=e.thumb.height/j,j*=h,i*=h)),g.height>g.width&&(h=e.thumb.height/g.height,i=g.width*h,j=g.height*h),q.viewbox({x:g.x,y:g.y,width:g.width,height:g.height}),q.size(i,j);try{canvg(l,q.exportSvg(),{renderCallback:r})}catch(s){l=null,m=null,!!f&&f(d,!0)}q=null,p.remove(),a("svg").remove()},e.save=function(b,c,d){console.log(b),a.ajax({url:e.apiEndpoint+"save",contentType:"application/json",dataType:"json",type:"post",data:JSON.stringify({id:b,thumb:c,bgColorHex:d})}).done(function(a){})},g.init=function(){f.$btnStart=a("#btnStartProcess"),f.$btnCancel=a("#btnCancelProcess"),f.$updateAll=a("#updateAll"),f.$thumb=a("#thumb"),f.$activity=a(".activity"),f.$btnStart.on("click",e.startCaptureProcess),f.$btnCancel.on("click",e.cancelCaptureProcess),e.vm.updateAll(!1),ko.applyBindings(e.vm,document.getElementById("main")),window.onbeforeunload=function(){i=1,c&&c.close()}},g.nextCapture=e.nextCapture,g.errorList=e.vm.errorList,g.errorDetailList=e.vm.errorDetailList,g.captureList=e.vm.captureList,g}(jQuery);
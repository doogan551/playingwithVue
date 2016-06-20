!function(a,b,c){"use strict";function d(a,b,c){var d,e=a.runtimeStyle&&a.runtimeStyle[b],f=a.style;return!/^-?[0-9]+\.?[0-9]*(?:px)?$/i.test(c)&&/^-?\d/.test(c)&&(d=f.left,e&&(a.runtimeStyle.left=a.currentStyle.left),f.left="fontSize"===b?"1em":c||0,c=f.pixelLeft+"px",f.left=d,e&&(a.runtimeStyle.left=e)),/^(thin|medium|thick)$/i.test(c)?c:Math.round(parseFloat(c))+"px"}function e(a){return parseInt(a,10)}function f(a,b,e,f){if(a=(a||"").split(","),a=a[f||0]||a[0]||"auto",a=l.Util.trimText(a).split(" "),"backgroundSize"!==e||a[0]&&!a[0].match(/cover|contain|auto/)){if(a[0]=a[0].indexOf("%")===-1?d(b,e+"X",a[0]):a[0],a[1]===c){if("backgroundSize"===e)return a[1]="auto",a;a[1]=a[0]}a[1]=a[1].indexOf("%")===-1?d(b,e+"Y",a[1]):a[1]}else;return a}function g(a,b,c,d,e,f){var g,h,i,j,k=l.Util.getCSS(b,a,e);if(1===k.length&&(j=k[0],k=[],k[0]=j,k[1]=j),k[0].toString().indexOf("%")!==-1)i=parseFloat(k[0])/100,h=c.width*i,"backgroundSize"!==a&&(h-=(f||d).width*i);else if("backgroundSize"===a)if("auto"===k[0])h=d.width;else if(/contain|cover/.test(k[0])){var m=l.Util.resizeBounds(d.width,d.height,c.width,c.height,k[0]);h=m.width,g=m.height}else h=parseInt(k[0],10);else h=parseInt(k[0],10);return"auto"===k[1]?g=h/d.width*d.height:k[1].toString().indexOf("%")!==-1?(i=parseFloat(k[1])/100,g=c.height*i,"backgroundSize"!==a&&(g-=(f||d).height*i)):g=parseInt(k[1],10),[h,g]}function h(a,b){var c=[];return{storage:c,width:a,height:b,clip:function(){c.push({type:"function",name:"clip",arguments:arguments})},translate:function(){c.push({type:"function",name:"translate",arguments:arguments})},fill:function(){c.push({type:"function",name:"fill",arguments:arguments})},save:function(){c.push({type:"function",name:"save",arguments:arguments})},restore:function(){c.push({type:"function",name:"restore",arguments:arguments})},fillRect:function(){c.push({type:"function",name:"fillRect",arguments:arguments})},createPattern:function(){c.push({type:"function",name:"createPattern",arguments:arguments})},drawShape:function(){var a=[];return c.push({type:"function",name:"drawShape",arguments:a}),{moveTo:function(){a.push({name:"moveTo",arguments:arguments})},lineTo:function(){a.push({name:"lineTo",arguments:arguments})},arcTo:function(){a.push({name:"arcTo",arguments:arguments})},bezierCurveTo:function(){a.push({name:"bezierCurveTo",arguments:arguments})},quadraticCurveTo:function(){a.push({name:"quadraticCurveTo",arguments:arguments})}}},drawImage:function(){c.push({type:"function",name:"drawImage",arguments:arguments})},fillText:function(){c.push({type:"function",name:"fillText",arguments:arguments})},setVariable:function(a,b){return c.push({type:"variable",name:a,arguments:b}),b}}}function i(a){return{zindex:a,children:[]}}var j,k,l={};l.Util={},l.Util.log=function(b){l.logging&&a.console&&a.console.log&&a.console.log(b)},l.Util.trimText=function(a){return function(b){return a?a.apply(b):((b||"")+"").replace(/^\s+|\s+$/g,"")}}(String.prototype.trim),l.Util.asFloat=function(a){return parseFloat(a)},function(){var a=/((rgba|rgb)\([^\)]+\)(\s-?\d+px){0,})/g,b=/(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;l.Util.parseTextShadows=function(c){if(!c||"none"===c)return[];for(var d=c.match(a),e=[],f=0;d&&f<d.length;f++){var g=d[f].match(b);e.push({color:g[0],offsetX:g[1]?g[1].replace("px",""):0,offsetY:g[2]?g[2].replace("px",""):0,blur:g[3]?g[3].replace("px",""):0})}return e}}(),l.Util.parseBackgroundImage=function(a){var b,c,d,e,f,g,h,i,j=" \r\n\t",k=[],l=0,m=0,n=function(){b&&('"'===c.substr(0,1)&&(c=c.substr(1,c.length-2)),c&&i.push(c),"-"===b.substr(0,1)&&(e=b.indexOf("-",1)+1)>0&&(d=b.substr(0,e),b=b.substr(e)),k.push({prefix:d,method:b.toLowerCase(),value:f,args:i})),i=[],b=d=c=f=""};n();for(var o=0,p=a.length;o<p;o++)if(g=a[o],!(0===l&&j.indexOf(g)>-1)){switch(g){case'"':h?h===g&&(h=null):h=g;break;case"(":if(h)break;if(0===l){l=1,f+=g;continue}m++;break;case")":if(h)break;if(1===l){if(0===m){l=0,f+=g,n();continue}m--}break;case",":if(h)break;if(0===l){n();continue}if(1===l&&0===m&&!b.match(/^url$/i)){i.push(c),c="",f+=g;continue}}f+=g,0===l?b+=g:c+=g}return n(),k},l.Util.Bounds=function(a){var b,c={};return a.getBoundingClientRect&&(b=a.getBoundingClientRect(),c.top=b.top,c.bottom=b.bottom||b.top+b.height,c.left=b.left,c.width=a.offsetWidth,c.height=a.offsetHeight),c},l.Util.OffsetBounds=function(a){var b=a.offsetParent?l.Util.OffsetBounds(a.offsetParent):{top:0,left:0};return{top:a.offsetTop+b.top,bottom:a.offsetTop+a.offsetHeight+b.top,left:a.offsetLeft+b.left,width:a.offsetWidth,height:a.offsetHeight}},l.Util.getCSS=function(a,c,d){j!==a&&(k=b.defaultView.getComputedStyle(a,null));var g=k[c];if(/^background(Size|Position)$/.test(c))return f(g,a,c,d);if(/border(Top|Bottom)(Left|Right)Radius/.test(c)){var h=g.split(" ");return h.length<=1&&(h[1]=h[0]),h.map(e)}return g},l.Util.resizeBounds=function(a,b,c,d,e){var f,g,h=c/d,i=a/b;return e&&"auto"!==e?h<i^"contain"===e?(g=d,f=d*i):(f=c,g=c/i):(f=c,g=d),{width:f,height:g}},l.Util.BackgroundPosition=function(a,b,c,d,e){var f=g("backgroundPosition",a,b,c,d,e);return{left:f[0],top:f[1]}},l.Util.BackgroundSize=function(a,b,c,d){var e=g("backgroundSize",a,b,c,d);return{width:e[0],height:e[1]}},l.Util.Extend=function(a,b){for(var c in a)a.hasOwnProperty(c)&&(b[c]=a[c]);return b},l.Util.Children=function(a){var b;try{b=a.nodeName&&"IFRAME"===a.nodeName.toUpperCase()?a.contentDocument||a.contentWindow.document:function(a){var b=[];return null!==a&&!function(a,b){var d=a.length,e=0;if("number"==typeof b.length)for(var f=b.length;e<f;e++)a[d++]=b[e];else for(;b[e]!==c;)a[d++]=b[e++];return a.length=d,a}(b,a),b}(a.childNodes)}catch(d){l.Util.log("html2canvas.Util.Children failed with exception: "+d.message),b=[]}return b},l.Util.isTransparent=function(a){return"transparent"===a||"rgba(0, 0, 0, 0)"===a},l.Util.Font=function(){var a={};return function(b,d,e){if(a[b+"-"+d]!==c)return a[b+"-"+d];var f,g,h,i=e.createElement("div"),j=e.createElement("img"),k=e.createElement("span"),l="Hidden Text";return i.style.visibility="hidden",i.style.fontFamily=b,i.style.fontSize=d,i.style.margin=0,i.style.padding=0,e.body.appendChild(i),j.src="data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=",j.width=1,j.height=1,j.style.margin=0,j.style.padding=0,j.style.verticalAlign="baseline",k.style.fontFamily=b,k.style.fontSize=d,k.style.margin=0,k.style.padding=0,k.appendChild(e.createTextNode(l)),i.appendChild(k),i.appendChild(j),f=j.offsetTop-k.offsetTop+1,i.removeChild(k),i.appendChild(e.createTextNode(l)),i.style.lineHeight="normal",j.style.verticalAlign="super",g=j.offsetTop-i.offsetTop+1,h={baseline:f,lineWidth:1,middle:g},a[b+"-"+d]=h,e.body.removeChild(i),h}}(),function(){function a(a){return function(b){try{a.addColorStop(b.stop,b.color)}catch(d){c.log(["failed to add color stop: ",d,"; tried to add: ",b])}}}var c=l.Util,d={};l.Generate=d;var e=[/^(-webkit-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/,/^(-o-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/,/^(-webkit-gradient)\((linear|radial),\s((?:\d{1,3}%?)\s(?:\d{1,3}%?),\s(?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)\-]+)\)$/,/^(-moz-linear-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)]+)\)$/,/^(-webkit-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/,/^(-moz-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s?([a-z\-]*)([\w\d\.\s,%\(\)]+)\)$/,/^(-o-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/];d.parseGradient=function(a,b){var c,d,f,g,h,i,j,k,l,m,n,o,p=e.length;for(d=0;d<p&&!(f=a.match(e[d]));d+=1);if(f)switch(f[1]){case"-webkit-linear-gradient":case"-o-linear-gradient":if(c={type:"linear",x0:null,y0:null,x1:null,y1:null,colorStops:[]},h=f[2].match(/\w+/g))for(i=h.length,d=0;d<i;d+=1)switch(h[d]){case"top":c.y0=0,c.y1=b.height;break;case"right":c.x0=b.width,c.x1=0;break;case"bottom":c.y0=b.height,c.y1=0;break;case"left":c.x0=0,c.x1=b.width}if(null===c.x0&&null===c.x1&&(c.x0=c.x1=b.width/2),null===c.y0&&null===c.y1&&(c.y0=c.y1=b.height/2),h=f[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g))for(i=h.length,j=1/Math.max(i-1,1),d=0;d<i;d+=1)k=h[d].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/),k[2]?(g=parseFloat(k[2]),g/="%"===k[3]?100:b.width):g=d*j,c.colorStops.push({color:k[1],stop:g});break;case"-webkit-gradient":if(c={type:"radial"===f[2]?"circle":f[2],x0:0,y0:0,x1:0,y1:0,colorStops:[]},h=f[3].match(/(\d{1,3})%?\s(\d{1,3})%?,\s(\d{1,3})%?\s(\d{1,3})%?/),h&&(c.x0=h[1]*b.width/100,c.y0=h[2]*b.height/100,c.x1=h[3]*b.width/100,c.y1=h[4]*b.height/100),h=f[4].match(/((?:from|to|color-stop)\((?:[0-9\.]+,\s)?(?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)\))+/g))for(i=h.length,d=0;d<i;d+=1)k=h[d].match(/(from|to|color-stop)\(([0-9\.]+)?(?:,\s)?((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\)/),g=parseFloat(k[2]),"from"===k[1]&&(g=0),"to"===k[1]&&(g=1),c.colorStops.push({color:k[3],stop:g});break;case"-moz-linear-gradient":if(c={type:"linear",x0:0,y0:0,x1:0,y1:0,colorStops:[]},h=f[2].match(/(\d{1,3})%?\s(\d{1,3})%?/),h&&(c.x0=h[1]*b.width/100,c.y0=h[2]*b.height/100,c.x1=b.width-c.x0,c.y1=b.height-c.y0),h=f[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}%)?)+/g))for(i=h.length,j=1/Math.max(i-1,1),d=0;d<i;d+=1)k=h[d].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%)?/),k[2]?(g=parseFloat(k[2]),k[3]&&(g/=100)):g=d*j,c.colorStops.push({color:k[1],stop:g});break;case"-webkit-radial-gradient":case"-moz-radial-gradient":case"-o-radial-gradient":if(c={type:"circle",x0:0,y0:0,x1:b.width,y1:b.height,cx:0,cy:0,rx:0,ry:0,colorStops:[]},h=f[2].match(/(\d{1,3})%?\s(\d{1,3})%?/),h&&(c.cx=h[1]*b.width/100,c.cy=h[2]*b.height/100),h=f[3].match(/\w+/),k=f[4].match(/[a-z\-]*/),h&&k)switch(k[0]){case"farthest-corner":case"cover":case"":l=Math.sqrt(Math.pow(c.cx,2)+Math.pow(c.cy,2)),m=Math.sqrt(Math.pow(c.cx,2)+Math.pow(c.y1-c.cy,2)),n=Math.sqrt(Math.pow(c.x1-c.cx,2)+Math.pow(c.y1-c.cy,2)),o=Math.sqrt(Math.pow(c.x1-c.cx,2)+Math.pow(c.cy,2)),c.rx=c.ry=Math.max(l,m,n,o);break;case"closest-corner":l=Math.sqrt(Math.pow(c.cx,2)+Math.pow(c.cy,2)),m=Math.sqrt(Math.pow(c.cx,2)+Math.pow(c.y1-c.cy,2)),n=Math.sqrt(Math.pow(c.x1-c.cx,2)+Math.pow(c.y1-c.cy,2)),o=Math.sqrt(Math.pow(c.x1-c.cx,2)+Math.pow(c.cy,2)),c.rx=c.ry=Math.min(l,m,n,o);break;case"farthest-side":"circle"===h[0]?c.rx=c.ry=Math.max(c.cx,c.cy,c.x1-c.cx,c.y1-c.cy):(c.type=h[0],c.rx=Math.max(c.cx,c.x1-c.cx),c.ry=Math.max(c.cy,c.y1-c.cy));break;case"closest-side":case"contain":"circle"===h[0]?c.rx=c.ry=Math.min(c.cx,c.cy,c.x1-c.cx,c.y1-c.cy):(c.type=h[0],c.rx=Math.min(c.cx,c.x1-c.cx),c.ry=Math.min(c.cy,c.y1-c.cy))}if(h=f[5].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g))for(i=h.length,j=1/Math.max(i-1,1),d=0;d<i;d+=1)k=h[d].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/),k[2]?(g=parseFloat(k[2]),g/="%"===k[3]?100:b.width):g=d*j,c.colorStops.push({color:k[1],stop:g})}return c},d.Gradient=function(c,d){if(0!==d.width&&0!==d.height){var e,f,g=b.createElement("canvas"),h=g.getContext("2d");if(g.width=d.width,g.height=d.height,e=l.Generate.parseGradient(c,d))switch(e.type){case"linear":f=h.createLinearGradient(e.x0,e.y0,e.x1,e.y1),e.colorStops.forEach(a(f)),h.fillStyle=f,h.fillRect(0,0,d.width,d.height);break;case"circle":f=h.createRadialGradient(e.cx,e.cy,0,e.cx,e.cy,e.rx),e.colorStops.forEach(a(f)),h.fillStyle=f,h.fillRect(0,0,d.width,d.height);break;case"ellipse":var i=b.createElement("canvas"),j=i.getContext("2d"),k=Math.max(e.rx,e.ry),m=2*k;i.width=i.height=m,f=j.createRadialGradient(e.rx,e.ry,0,e.rx,e.ry,k),e.colorStops.forEach(a(f)),j.fillStyle=f,j.fillRect(0,0,m,m),h.fillStyle=e.colorStops[e.colorStops.length-1].color,h.fillRect(0,0,g.width,g.height),h.drawImage(i,e.cx-e.rx,e.cy-e.ry,2*e.rx,2*e.ry)}return g}},d.ListAlpha=function(a){var b,c="";do b=a%26,c=String.fromCharCode(b+64)+c,a/=26;while(26*a>26);return c},d.ListRoman=function(a){var b,c=["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"],d=[1e3,900,500,400,100,90,50,40,10,9,5,4,1],e="",f=c.length;if(a<=0||a>=4e3)return a;for(b=0;b<f;b+=1)for(;a>=d[b];)a-=d[b],e+=c[b];return e}}(),l.Parse=function(d,e){function f(){return Math.max(Math.max(ka.body.scrollWidth,ka.documentElement.scrollWidth),Math.max(ka.body.offsetWidth,ka.documentElement.offsetWidth),Math.max(ka.body.clientWidth,ka.documentElement.clientWidth))}function g(){return Math.max(Math.max(ka.body.scrollHeight,ka.documentElement.scrollHeight),Math.max(ka.body.offsetHeight,ka.documentElement.offsetHeight),Math.max(ka.body.clientHeight,ka.documentElement.clientHeight))}function j(a,b){var c=parseInt(pa(a,b),10);return isNaN(c)?0:c}function k(a,b,c,d,e,f){"transparent"!==f&&(a.setVariable("fillStyle",f),a.fillRect(b,c,d,e),ja+=1)}function m(a,b,c){if(a.length>0)return b+c.toUpperCase()}function n(a,b){switch(b){case"lowercase":return a.toLowerCase();case"capitalize":return a.replace(/(^|\s|:|-|\(|\))([a-z])/g,m);case"uppercase":return a.toUpperCase();default:return a}}function o(a){return/^(normal|none|0px)$/.test(a)}function p(a,b,c,d){null!==a&&la.trimText(a).length>0&&(d.fillText(a,b,c),ja+=1)}function q(a,b,c,d){var e=!1,f=pa(b,"fontWeight"),g=pa(b,"fontFamily"),h=pa(b,"fontSize"),i=la.parseTextShadows(pa(b,"textShadow"));switch(parseInt(f,10)){case 401:f="bold";break;case 400:f="normal"}if(a.setVariable("fillStyle",d),a.setVariable("font",[pa(b,"fontStyle"),pa(b,"fontVariant"),f,h,g].join(" ")),a.setVariable("textAlign",e?"right":"left"),i.length&&(a.setVariable("shadowColor",i[0].color),a.setVariable("shadowOffsetX",i[0].offsetX),a.setVariable("shadowOffsetY",i[0].offsetY),a.setVariable("shadowBlur",i[0].blur)),"none"!==c)return la.Font(g,h,ka)}function r(a,b,c,d,e){switch(b){case"underline":k(a,c.left,Math.round(c.top+d.baseline+d.lineWidth),c.width,1,e);break;case"overline":k(a,c.left,Math.round(c.top),c.width,1,e);break;case"line-through":k(a,c.left,Math.ceil(c.top+d.middle+d.lineWidth),c.width,1,e)}}function s(a,b,c,d,e){var f;if(ma.rangeBounds&&!e)"none"===c&&0===la.trimText(b).length||(f=t(b,a.node,a.textOffset)),a.textOffset+=b.length;else if(a.node&&"string"==typeof a.node.nodeValue){var g=d?a.node.splitText(b.length):null;f=u(a.node,e),a.node=g}return f}function t(a,b,c){var d=ka.createRange();return d.setStart(b,c),d.setEnd(b,c+a.length),d.getBoundingClientRect()}function u(a,b){var c=a.parentNode,d=ka.createElement("wrapper"),e=a.cloneNode(!0);d.appendChild(a.cloneNode(!0)),c.replaceChild(d,a);var f=b?la.OffsetBounds(d):la.Bounds(d);return c.replaceChild(e,d),f}function v(a,b,c){var d,f,g=c.ctx,h=pa(a,"color"),i=pa(a,"textDecoration"),j=pa(a,"textAlign"),k={node:b,textOffset:0};la.trimText(b.nodeValue).length>0&&(b.nodeValue=n(b.nodeValue,pa(a,"textTransform")),j=j.replace(["-webkit-auto"],["auto"]),f=!e.letterRendering&&/^(left|right|justify|auto)$/.test(j)&&o(pa(a,"letterSpacing"))?b.nodeValue.split(/(\b| )/):b.nodeValue.split(""),d=q(g,a,i,h),e.chinese&&f.forEach(function(a,b){/.*[\u4E00-\u9FA5].*$/.test(a)&&(a=a.split(""),a.unshift(b,1),f.splice.apply(f,a))}),f.forEach(function(a,b){var e=s(k,a,i,b<f.length-1,c.transform.matrix);e&&(p(a,e.left,e.bottom,g),r(g,i,e,d,h))}))}function w(a,b){var c,d,e=ka.createElement("boundelement");return e.style.display="inline",c=a.style.listStyleType,a.style.listStyleType="none",e.appendChild(ka.createTextNode(b)),a.insertBefore(e,a.firstChild),d=la.Bounds(e),a.removeChild(e),a.style.listStyleType=c,d}function x(a){var b=-1,c=1,d=a.parentNode.childNodes;if(a.parentNode){for(;d[++b]!==a;)1===d[b].nodeType&&c++;return c}return-1}function y(a,b){var c,d=x(a);switch(b){case"decimal":c=d;break;case"decimal-leading-zero":c=1===d.toString().length?d="0"+d.toString():d.toString();break;case"upper-roman":c=l.Generate.ListRoman(d);break;case"lower-roman":c=l.Generate.ListRoman(d).toLowerCase();break;case"lower-alpha":c=l.Generate.ListAlpha(d).toLowerCase();break;case"upper-alpha":c=l.Generate.ListAlpha(d)}return c+". "}function z(a,b,c){var d,e,f,g=b.ctx,h=pa(a,"listStyleType");if(/^(decimal|decimal-leading-zero|upper-alpha|upper-latin|upper-roman|lower-alpha|lower-greek|lower-latin|lower-roman)$/i.test(h)){if(e=y(a,h),f=w(a,e),q(g,a,"none",pa(a,"color")),"inside"!==pa(a,"listStylePosition"))return;g.setVariable("textAlign","left"),d=c.left,p(e,d,f.bottom,g)}}function A(a){var b=d[a];return!(!b||b.succeeded!==!0)&&b.img}function B(a,b){var c=Math.max(a.left,b.left),d=Math.max(a.top,b.top),e=Math.min(a.left+a.width,b.left+b.width),f=Math.min(a.top+a.height,b.top+b.height);return{left:c,top:d,width:e-c,height:f-d}}function C(a,b,c){var d,e="static"!==b.cssPosition,f=e?pa(a,"zIndex"):"auto",g=pa(a,"opacity"),h="none"!==pa(a,"cssFloat");b.zIndex=d=i(f),d.isPositioned=e,d.isFloated=h,d.opacity=g,d.ownStacking="auto"!==f||g<1,c&&c.zIndex.children.push(b)}function D(a,b,c,d,e){var f=j(b,"paddingLeft"),g=j(b,"paddingTop"),h=j(b,"paddingRight"),i=j(b,"paddingBottom");P(a,c,0,0,c.width,c.height,d.left+f+e[3].width,d.top+g+e[0].width,d.width-(e[1].width+e[3].width+f+h),d.height-(e[0].width+e[2].width+g+i))}function E(a){return["Top","Right","Bottom","Left"].map(function(b){return{width:j(a,"border"+b+"Width"),color:pa(a,"border"+b+"Color")}})}function F(a){return["TopLeft","TopRight","BottomRight","BottomLeft"].map(function(b){return pa(a,"border"+b+"Radius")})}function G(a,b,c,d){var e=function(a,b,c){return{x:a.x+(b.x-a.x)*c,y:a.y+(b.y-a.y)*c}};return{start:a,startControl:b,endControl:c,end:d,subdivide:function(f){var g=e(a,b,f),h=e(b,c,f),i=e(c,d,f),j=e(g,h,f),k=e(h,i,f),l=e(j,k,f);return[G(a,g,j,l),G(l,k,i,d)]},curveTo:function(a){a.push(["bezierCurve",b.x,b.y,c.x,c.y,d.x,d.y])},curveToReversed:function(d){d.push(["bezierCurve",c.x,c.y,b.x,b.y,a.x,a.y])}}}function H(a,b,c,d,e,f,g){b[0]>0||b[1]>0?(a.push(["line",d[0].start.x,d[0].start.y]),d[0].curveTo(a),d[1].curveTo(a)):a.push(["line",f,g]),(c[0]>0||c[1]>0)&&a.push(["line",e[0].start.x,e[0].start.y])}function I(a,b,c,d,e,f,g){var h=[];return b[0]>0||b[1]>0?(h.push(["line",d[1].start.x,d[1].start.y]),d[1].curveTo(h)):h.push(["line",a.c1[0],a.c1[1]]),c[0]>0||c[1]>0?(h.push(["line",f[0].start.x,f[0].start.y]),f[0].curveTo(h),h.push(["line",g[0].end.x,g[0].end.y]),g[0].curveToReversed(h)):(h.push(["line",a.c2[0],a.c2[1]]),h.push(["line",a.c3[0],a.c3[1]])),b[0]>0||b[1]>0?(h.push(["line",e[1].end.x,e[1].end.y]),e[1].curveToReversed(h)):h.push(["line",a.c4[0],a.c4[1]]),h}function J(a,b,c){var d=a.left,e=a.top,f=a.width,g=a.height,h=b[0][0],i=b[0][1],j=b[1][0],k=b[1][1],l=b[2][0],m=b[2][1],n=b[3][0],o=b[3][1],p=f-j,q=g-m,r=f-l,s=g-o;return{topLeftOuter:sa(d,e,h,i).topLeft.subdivide(.5),topLeftInner:sa(d+c[3].width,e+c[0].width,Math.max(0,h-c[3].width),Math.max(0,i-c[0].width)).topLeft.subdivide(.5),topRightOuter:sa(d+p,e,j,k).topRight.subdivide(.5),topRightInner:sa(d+Math.min(p,f+c[3].width),e+c[0].width,p>f+c[3].width?0:j-c[3].width,k-c[0].width).topRight.subdivide(.5),bottomRightOuter:sa(d+r,e+q,l,m).bottomRight.subdivide(.5),bottomRightInner:sa(d+Math.min(r,f+c[3].width),e+Math.min(q,g+c[0].width),Math.max(0,l-c[1].width),Math.max(0,m-c[2].width)).bottomRight.subdivide(.5),bottomLeftOuter:sa(d,e+s,n,o).bottomLeft.subdivide(.5),bottomLeftInner:sa(d+c[3].width,e+s,Math.max(0,n-c[3].width),Math.max(0,o-c[2].width)).bottomLeft.subdivide(.5)}}function K(a,b,c,d,e){var f=pa(a,"backgroundClip"),g=[];switch(f){case"content-box":case"padding-box":H(g,d[0],d[1],b.topLeftInner,b.topRightInner,e.left+c[3].width,e.top+c[0].width),H(g,d[1],d[2],b.topRightInner,b.bottomRightInner,e.left+e.width-c[1].width,e.top+c[0].width),H(g,d[2],d[3],b.bottomRightInner,b.bottomLeftInner,e.left+e.width-c[1].width,e.top+e.height-c[2].width),H(g,d[3],d[0],b.bottomLeftInner,b.topLeftInner,e.left+c[3].width,e.top+e.height-c[2].width);break;default:H(g,d[0],d[1],b.topLeftOuter,b.topRightOuter,e.left,e.top),H(g,d[1],d[2],b.topRightOuter,b.bottomRightOuter,e.left+e.width,e.top),H(g,d[2],d[3],b.bottomRightOuter,b.bottomLeftOuter,e.left+e.width,e.top+e.height),H(g,d[3],d[0],b.bottomLeftOuter,b.topLeftOuter,e.left,e.top+e.height)}return g}function L(a,b,c){var d,e,f,g,h,i,j=b.left,k=b.top,l=b.width,m=b.height,n=F(a),o=J(b,n,c),p={clip:K(a,o,c,n,b),borders:[]};for(d=0;d<4;d++)if(c[d].width>0){switch(e=j,f=k,g=l,h=m-c[2].width,d){case 0:h=c[0].width,i=I({c1:[e,f],c2:[e+g,f],c3:[e+g-c[1].width,f+h],c4:[e+c[3].width,f+h]},n[0],n[1],o.topLeftOuter,o.topLeftInner,o.topRightOuter,o.topRightInner);break;case 1:e=j+l-c[1].width,g=c[1].width,i=I({c1:[e+g,f],c2:[e+g,f+h+c[2].width],c3:[e,f+h],c4:[e,f+c[0].width]},n[1],n[2],o.topRightOuter,o.topRightInner,o.bottomRightOuter,o.bottomRightInner);break;case 2:f=f+m-c[2].width,h=c[2].width,i=I({c1:[e+g,f+h],c2:[e,f+h],c3:[e+c[3].width,f],c4:[e+g-c[3].width,f]},n[2],n[3],o.bottomRightOuter,o.bottomRightInner,o.bottomLeftOuter,o.bottomLeftInner);break;case 3:g=c[3].width,i=I({c1:[e,f+h+c[2].width],c2:[e,f],c3:[e+g,f+c[0].width],c4:[e+g,f+h]},n[3],n[0],o.bottomLeftOuter,o.bottomLeftInner,o.topLeftOuter,o.topLeftInner)}p.borders.push({args:i,color:c[d].color})}return p}function M(a,b){var c=a.drawShape();return b.forEach(function(a,b){c[0===b?"moveTo":a[0]+"To"].apply(null,a.slice(1))}),c}function N(a,b,c){"transparent"!==c&&(a.setVariable("fillStyle",c),M(a,b),a.fill(),ja+=1)}function O(a,b,c){var d,e,f=ka.createElement("valuewrap"),g=["lineHeight","textAlign","fontFamily","color","fontSize","paddingLeft","paddingTop","width","height","border","borderLeftWidth","borderTopWidth"];g.forEach(function(b){try{f.style[b]=pa(a,b)}catch(c){la.log("html2canvas: Parse: Exception caught in renderFormValue: "+c.message)}}),f.style.borderColor="black",f.style.borderStyle="solid",f.style.display="block",f.style.position="absolute",(/^(submit|reset|button|text|password)$/.test(a.type)||"SELECT"===a.nodeName)&&(f.style.lineHeight=pa(a,"height")),f.style.top=b.top+"px",f.style.left=b.left+"px",d="SELECT"===a.nodeName?(a.options[a.selectedIndex]||0).text:a.value,d||(d=a.placeholder),e=ka.createTextNode(d),f.appendChild(e),oa.appendChild(f),v(a,e,c),oa.removeChild(f)}function P(a){a.drawImage.apply(a,Array.prototype.slice.call(arguments,1)),ja+=1}function Q(c,d){var e=a.getComputedStyle(c,d);if(e&&e.content&&"none"!==e.content&&"-moz-alt-content"!==e.content&&"none"!==e.display){var f=e.content+"",g=f.substr(0,1);g===f.substr(f.length-1)&&g.match(/'|"/)&&(f=f.substr(1,f.length-2));var h="url"===f.substr(0,3),i=b.createElement(h?"img":"span");return i.className=qa+"-before "+qa+"-after",Object.keys(e).filter(R).forEach(function(a){try{i.style[a]=e[a]}catch(b){la.log(["Tried to assign readonly property ",a,"Error:",b])}}),h?i.src=la.parseBackgroundImage(f)[0].args[0]:i.innerHTML=f,i}}function R(b){return isNaN(a.parseInt(b,10))}function S(a,b){var c=Q(a,":before"),d=Q(a,":after");(c||d)&&(c&&(a.className+=" "+qa+"-before",a.parentNode.insertBefore(c,a),fa(c,b,!0),a.parentNode.removeChild(c),a.className=a.className.replace(qa+"-before","").trim()),d&&(a.className+=" "+qa+"-after",a.appendChild(d),fa(d,b,!0),a.removeChild(d),a.className=a.className.replace(qa+"-after","").trim()))}function T(a,b,c,d){var e=Math.round(d.left+c.left),f=Math.round(d.top+c.top);a.createPattern(b),a.translate(e,f),a.fill(),a.translate(-e,-f)}function U(a,b,c,d,e,f,g,h){var i=[];i.push(["line",Math.round(e),Math.round(f)]),i.push(["line",Math.round(e+g),Math.round(f)]),i.push(["line",Math.round(e+g),Math.round(h+f)]),i.push(["line",Math.round(e),Math.round(h+f)]),M(a,i),a.save(),a.clip(),T(a,b,c,d),a.restore()}function V(a,b,c){k(a,b.left,b.top,b.width,b.height,c)}function W(a,b,c,d,e){var f=la.BackgroundSize(a,b,d,e),g=la.BackgroundPosition(a,b,d,e,f),h=pa(a,"backgroundRepeat").split(",").map(la.trimText);switch(d=Y(d,f),h=h[e]||h[0]){case"repeat-x":U(c,d,g,b,b.left,b.top+g.top,99999,d.height);break;case"repeat-y":U(c,d,g,b,b.left+g.left,b.top,d.width,99999);break;case"no-repeat":U(c,d,g,b,b.left+g.left,b.top+g.top,d.width,d.height);break;default:T(c,d,g,{top:b.top,left:b.left,width:d.width,height:d.height})}}function X(a,b,c){for(var d,e=pa(a,"backgroundImage"),f=la.parseBackgroundImage(e),g=f.length;g--;)if(e=f[g],e.args&&0!==e.args.length){var h="url"===e.method?e.args[0]:e.value;d=A(h),d?W(a,b,c,d,g):la.log("html2canvas: Error loading background:",e)}}function Y(a,b){if(a.width===b.width&&a.height===b.height)return a;var c,d=ka.createElement("canvas");return d.width=b.width,d.height=b.height,c=d.getContext("2d"),P(c,a,0,0,a.width,a.height,0,0,b.width,b.height),d}function Z(a,b,c){return a.setVariable("globalAlpha",pa(b,"opacity")*(c?c.opacity:1))}function $(a){return a.replace("px","")}function _(a,b){var c=pa(a,"transform")||pa(a,"-webkit-transform")||pa(a,"-moz-transform")||pa(a,"-ms-transform")||pa(a,"-o-transform"),d=pa(a,"transform-origin")||pa(a,"-webkit-transform-origin")||pa(a,"-moz-transform-origin")||pa(a,"-ms-transform-origin")||pa(a,"-o-transform-origin")||"0px 0px";d=d.split(" ").map($).map(la.asFloat);var e;if(c&&"none"!==c){var f=c.match(ta);if(f)switch(f[1]){case"matrix":e=f[2].split(",").map(la.trimText).map(la.asFloat)}}return{origin:d,matrix:e}}function aa(a,b,c,d){var i=h(b?c.width:f(),b?c.height:g()),j={ctx:i,opacity:Z(i,a,b),cssPosition:pa(a,"position"),borders:E(a),transform:d,clip:b&&b.clip?la.Extend({},b.clip):null};return C(a,j,b),e.useOverflow===!0&&/(hidden|scroll|auto)/.test(pa(a,"overflow"))===!0&&/(BODY)/i.test(a.nodeName)===!1&&(j.clip=j.clip?B(j.clip,c):c),j}function ba(a,b,c){var d={left:b.left+a[3].width,top:b.top+a[0].width,width:b.width-(a[1].width+a[3].width),height:b.height-(a[0].width+a[2].width)};return c&&(d=B(d,c)),d}function ca(a,b){var c=b.matrix?la.OffsetBounds(a):la.Bounds(a);return b.origin[0]+=c.left,b.origin[1]+=c.top,c}function da(a,b,c,d){var e,f=_(a,b),g=ca(a,f),h=aa(a,b,g,f),i=h.borders,j=h.ctx,k=ba(i,g,h.clip),l=L(a,g,i),m=na.test(a.nodeName)?"#efefef":pa(a,"backgroundColor");switch(M(j,l.clip),j.save(),j.clip(),k.height>0&&k.width>0&&!d?(V(j,g,m),X(a,k,j)):d&&(h.backgroundColor=m),j.restore(),l.borders.forEach(function(a){N(j,a.args,a.color)}),c||S(a,h),a.nodeName){case"IMG":(e=A(a.getAttribute("src")))?D(j,a,e,g,i):la.log("html2canvas: Error loading <img>:"+a.getAttribute("src"));break;case"INPUT":/^(text|url|email|submit|button|reset)$/.test(a.type)&&(a.value||a.placeholder||"").length>0&&O(a,g,h);break;case"TEXTAREA":(a.value||a.placeholder||"").length>0&&O(a,g,h);break;case"SELECT":(a.options||a.placeholder||"").length>0&&O(a,g,h);break;case"LI":z(a,h,k);break;case"CANVAS":D(j,a,a,g,i)}return h}function ea(a){return"none"!==pa(a,"display")&&"hidden"!==pa(a,"visibility")&&!a.hasAttribute("data-html2canvas-ignore")}function fa(a,b,c){ea(a)&&(b=da(a,b,c,!1)||b,na.test(a.nodeName)||ga(a,b,c))}function ga(a,b,c){la.Children(a).forEach(function(d){d.nodeType===d.ELEMENT_NODE?fa(d,b,c):d.nodeType===d.TEXT_NODE&&v(a,d,b)})}function ha(){var a=pa(b.documentElement,"backgroundColor"),c=la.isTransparent(a)&&ia===b.body,d=da(ia,null,!1,c);return ga(ia,d),c&&(a=d.backgroundColor),oa.removeChild(ra),{backgroundColor:a,stack:d}}a.scroll(0,0);var ia=e.elements===c?b.body:e.elements[0],ja=0,ka=ia.ownerDocument,la=l.Util,ma=la.Support(e,ka),na=new RegExp("("+e.ignoreElements+")"),oa=ka.body,pa=la.getCSS,qa="___html2canvas___pseudoelement",ra=ka.createElement("style");ra.innerHTML="."+qa+'-before:before { content: "" !important; display: none !important; }.'+qa+'-after:after { content: "" !important; display: none !important; }',oa.appendChild(ra),d=d||{};var sa=function(a){return function(b,c,d,e){var f=d*a,g=e*a,h=b+d,i=c+e;return{topLeft:G({x:b,y:i},{x:b,y:i-g},{x:h-f,y:c},{x:h,y:c}),topRight:G({x:b,y:c},{x:b+f,y:c},{x:h,y:i-g},{x:h,y:i}),bottomRight:G({x:h,y:c},{x:h,y:c+g},{x:b+f,y:i},{x:b,y:i}),bottomLeft:G({x:h,y:i},{x:h-f,y:i},{x:b,y:c+g},{x:b,y:c})}}}(4*((Math.sqrt(2)-1)/3)),ta=/(matrix)\((.+)\)/;return ha()},l.Preload=function(d){function e(a){A.href=a,A.href=A.href;var b=A.protocol+A.host;return b===p}function f(){u.log("html2canvas: start: images: "+t.numLoaded+" / "+t.numTotal+" (failed: "+t.numFailed+")"),!t.firstRun&&t.numLoaded>=t.numTotal&&(u.log("Finished loading images: # "+t.numTotal+" (failed: "+t.numFailed+")"),"function"==typeof d.complete&&d.complete(t))}function g(b,e,g){var h,i,j=d.proxy;A.href=b,b=A.href,h="html2canvas_"+v++,g.callbackname=h,j+=j.indexOf("?")>-1?"&":"?",j+="url="+encodeURIComponent(b)+"&callback="+h,i=x.createElement("script"),a[h]=function(b){"error:"===b.substring(0,6)?(g.succeeded=!1,t.numLoaded++,t.numFailed++,f()):(o(e,g),e.src=b),a[h]=c;try{delete a[h]}catch(d){}i.parentNode.removeChild(i),i=null,delete g.script,delete g.callbackname},i.setAttribute("type","text/javascript"),i.setAttribute("src",j),g.script=i,a.document.body.appendChild(i)}function h(b,c){var d=a.getComputedStyle(b,c),e=d.content;"url"===e.substr(0,3)&&q.loadImage(l.Util.parseBackgroundImage(e)[0].args[0]),m(d.backgroundImage,b)}function i(a){h(a,":before"),h(a,":after")}function j(a,b){var d=l.Generate.Gradient(a,b);d!==c&&(t[a]={img:d,succeeded:!0},t.numTotal++,t.numLoaded++,f())}function k(a){return a&&a.method&&a.args&&a.args.length>0}function m(a,b){var d;l.Util.parseBackgroundImage(a).filter(k).forEach(function(a){"url"===a.method?q.loadImage(a.args[0]):a.method.match(/\-?gradient$/)&&(d===c&&(d=l.Util.Bounds(b)),j(a.value,d))})}function n(a){var b=!1;try{u.Children(a).forEach(n)}catch(d){}try{b=a.nodeType}catch(e){b=!1,u.log("html2canvas: failed to access some element's nodeType - Exception: "+e.message)}if(1===b||b===c){i(a);try{m(u.getCSS(a,"backgroundImage"),a)}catch(d){u.log("html2canvas: failed to get background-image - Exception: "+d.message)}m(a)}}function o(b,e){b.onload=function(){e.timer!==c&&a.clearTimeout(e.timer),t.numLoaded++,e.succeeded=!0,b.onerror=b.onload=null,f()},b.onerror=function(){if("anonymous"===b.crossOrigin&&(a.clearTimeout(e.timer),d.proxy)){var c=b.src;return b=new Image,e.img=b,b.src=c,void g(b.src,b,e)}t.numLoaded++,t.numFailed++,e.succeeded=!1,b.onerror=b.onload=null,f()}}var p,q,r,s,t={numLoaded:0,numFailed:0,numTotal:0,cleanupDone:!1},u=l.Util,v=0,w=d.elements[0]||b.body,x=w.ownerDocument,y=w.getElementsByTagName("img"),z=y.length,A=x.createElement("a"),B=function(a){return a.crossOrigin!==c}(new Image);for(A.href=a.location.href,p=A.protocol+A.host,q={loadImage:function(a){var b,f;a&&t[a]===c&&(b=new Image,a.match(/data:image\/.*;base64,/i)?(b.src=a.replace(/url\(['"]{0,}|['"]{0,}\)$/gi,""),f=t[a]={img:b},t.numTotal++,o(b,f)):e(a)||d.allowTaint===!0?(f=t[a]={img:b},t.numTotal++,o(b,f),b.src=a):B&&!d.allowTaint&&d.useCORS?(b.crossOrigin="anonymous",f=t[a]={img:b},t.numTotal++,o(b,f),b.src=a):d.proxy&&(f=t[a]={img:b},t.numTotal++,g(a,b,f)))},cleanupDOM:function(e){var g,h;if(!t.cleanupDone){e&&"string"==typeof e?u.log("html2canvas: Cleanup because: "+e):u.log("html2canvas: Cleanup after timeout: "+d.timeout+" ms.");for(h in t)if(t.hasOwnProperty(h)&&(g=t[h],"object"==typeof g&&g.callbackname&&g.succeeded===c)){a[g.callbackname]=c;try{delete a[g.callbackname]}catch(i){}g.script&&g.script.parentNode&&(g.script.setAttribute("src","about:blank"),g.script.parentNode.removeChild(g.script)),t.numLoaded++,t.numFailed++,u.log("html2canvas: Cleaned up failed img: '"+h+"' Steps: "+t.numLoaded+" / "+t.numTotal)}a.stop!==c?a.stop():b.execCommand!==c&&b.execCommand("Stop",!1),b.close!==c&&b.close(),t.cleanupDone=!0,e&&"string"==typeof e||f()}},renderingDone:function(){s&&a.clearTimeout(s)}},d.timeout>0&&(s=a.setTimeout(q.cleanupDOM,d.timeout)),u.log("html2canvas: Preload starts: finding background-images"),t.firstRun=!0,n(w),u.log("html2canvas: Preload: Finding images"),r=0;r<z;r+=1)q.loadImage(y[r].getAttribute("src"));return t.firstRun=!1,u.log("html2canvas: Preload: Done."),t.numTotal===t.numLoaded&&f(),q},l.Renderer=function(a,d){function e(a){function b(a){Object.keys(a).sort().forEach(function(c){
var d=[],f=[],g=[],h=[];a[c].forEach(function(a){a.node.zIndex.isPositioned||a.node.zIndex.opacity<1?g.push(a):a.node.zIndex.isFloated?f.push(a):d.push(a)}),function i(a){a.forEach(function(a){h.push(a),a.children&&i(a.children)})}(d.concat(f,g)),h.forEach(function(a){a.context?b(a.context):e.push(a.node)})})}var d,e=[];return d=function(a){function b(a,d,e){var f="auto"===d.zIndex.zindex?0:Number(d.zIndex.zindex),g=a,h=d.zIndex.isPositioned,i=d.zIndex.isFloated,j={node:d},k=e;d.zIndex.ownStacking?(g=j.context={"!":[{node:d,children:[]}]},k=c):(h||i)&&(k=j.children=[]),0===f&&e?e.push(j):(a[f]||(a[f]=[]),a[f].push(j)),d.zIndex.children.forEach(function(a){b(g,a,k)})}var d={};return b(d,a),d}(a),b(d),e}function f(a){var b;if("string"==typeof d.renderer&&l.Renderer[a]!==c)b=l.Renderer[a](d);else{if("function"!=typeof a)throw new Error("Unknown renderer");b=a(d)}if("function"!=typeof b)throw new Error("Invalid renderer defined");return b}return f(d.renderer)(a,d,b,e(a.stack),l)},l.Util.Support=function(a,b){function d(){var a=new Image,d=b.createElement("canvas"),e=d.getContext!==c&&d.getContext("2d");if(e===!1)return!1;d.width=d.height=10,a.src=["data:image/svg+xml,","<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'>","<foreignObject width='10' height='10'>","<div xmlns='http://www.w3.org/1999/xhtml' style='width:10;height:10;'>","sup","</div>","</foreignObject>","</svg>"].join("");try{e.drawImage(a,0,0),d.toDataURL()}catch(f){return!1}return l.Util.log("html2canvas: Parse: SVG powered rendering available"),!0}function e(){var a,c,d,e,f=!1;return b.createRange&&(a=b.createRange(),a.getBoundingClientRect&&(c=b.createElement("boundtest"),c.style.height="123px",c.style.display="block",b.body.appendChild(c),a.selectNode(c),d=a.getBoundingClientRect(),e=d.height,123===e&&(f=!0),b.body.removeChild(c))),f}return{rangeBounds:e(),svgRendering:a.svgRendering&&d()}},a.html2canvas=function(b,c){b=b.length?b:[b];var d,e,f={logging:!1,elements:b,background:"#fff",proxy:null,timeout:0,useCORS:!1,allowTaint:!1,svgRendering:!1,ignoreElements:"IFRAME|OBJECT|PARAM",useOverflow:!0,letterRendering:!1,chinese:!1,width:null,height:null,taintTest:!0,renderer:"Canvas"};return f=l.Util.Extend(c,f),l.logging=f.logging,f.complete=function(a){"function"==typeof f.onpreloaded&&f.onpreloaded(a)===!1||(d=l.Parse(a,f),"function"==typeof f.onparsed&&f.onparsed(d)===!1||(e=l.Renderer(d,f),"function"==typeof f.onrendered&&f.onrendered(e)))},a.setTimeout(function(){l.Preload(f)},0),{render:function(a,b){return l.Renderer(a,l.Util.Extend(b,f))},parse:function(a,b){return l.Parse(a,l.Util.Extend(b,f))},preload:function(a){return l.Preload(l.Util.Extend(a,f))},log:l.Util.log}},a.html2canvas.log=l.Util.log,a.html2canvas.Renderer={Canvas:c},l.Renderer.Canvas=function(a){function d(a,b){a.beginPath(),b.forEach(function(b){a[b.name].apply(a,b.arguments)}),a.closePath()}function e(a){if(h.indexOf(a.arguments[0].src)===-1){j.drawImage(a.arguments[0],0,0);try{j.getImageData(0,0,1,1)}catch(b){return i=g.createElement("canvas"),j=i.getContext("2d"),!1}h.push(a.arguments[0].src)}return!0}function f(b,c){switch(c.type){case"variable":b[c.name]=c.arguments;break;case"function":switch(c.name){case"createPattern":if(c.arguments[0].width>0&&c.arguments[0].height>0)try{b.fillStyle=b.createPattern(c.arguments[0],"repeat")}catch(f){k.log("html2canvas: Renderer: Error creating pattern",f.message)}break;case"drawShape":d(b,c.arguments);break;case"drawImage":c.arguments[8]>0&&c.arguments[7]>0&&(!a.taintTest||a.taintTest&&e(c))&&b.drawImage.apply(b,c.arguments);break;default:b[c.name].apply(b,c.arguments)}}}a=a||{};var g=b,h=[],i=b.createElement("canvas"),j=i.getContext("2d"),k=l.Util,m=a.canvas||g.createElement("canvas");return function(a,b,d,e,g){var h,i,j,l=m.getContext("2d"),n=a.stack;return m.width=m.style.width=b.width||n.ctx.width,m.height=m.style.height=b.height||n.ctx.height,j=l.fillStyle,l.fillStyle=k.isTransparent(n.backgroundColor)&&b.background!==c?b.background:a.backgroundColor,l.fillRect(0,0,m.width,m.height),l.fillStyle=j,e.forEach(function(a){l.textBaseline="bottom",l.save(),a.transform.matrix&&(l.translate(a.transform.origin[0],a.transform.origin[1]),l.transform.apply(l,a.transform.matrix),l.translate(-a.transform.origin[0],-a.transform.origin[1])),a.clip&&(l.beginPath(),l.rect(a.clip.left,a.clip.top,a.clip.width,a.clip.height),l.clip()),a.ctx.storage&&a.ctx.storage.forEach(function(a){f(l,a)}),l.restore()}),k.log("html2canvas: Renderer: Canvas renderer done - returning canvas obj"),1===b.elements.length&&"object"==typeof b.elements[0]&&"BODY"!==b.elements[0].nodeName?(i=g.Util.Bounds(b.elements[0]),h=d.createElement("canvas"),h.width=Math.ceil(i.width),h.height=Math.ceil(i.height),0!=h.width&&0!=h.height&&(l=h.getContext("2d"),l.drawImage(m,i.left,i.top,i.width,i.height,0,0,i.width,i.height)),m=null,h):m}}}(window,document);
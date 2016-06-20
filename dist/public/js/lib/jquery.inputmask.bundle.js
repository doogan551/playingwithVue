!function(a){void 0===a.fn.inputmask&&(a.inputmask={defaults:{placeholder:"_",optionalmarker:{start:"[",end:"]"},quantifiermarker:{start:"{",end:"}"},groupmarker:{start:"(",end:")"},escapeChar:"\\",mask:null,oncomplete:a.noop,onincomplete:a.noop,oncleared:a.noop,repeat:0,greedy:!0,autoUnmask:!1,clearMaskOnLostFocus:!0,insertMode:!0,clearIncomplete:!1,aliases:{},onKeyUp:a.noop,onKeyDown:a.noop,showMaskOnFocus:!0,showMaskOnHover:!0,onKeyValidation:a.noop,skipOptionalPartCharacter:" ",showTooltip:!1,numericInput:!1,isNumeric:!1,radixPoint:"",skipRadixDance:!1,rightAlignNumerics:!0,definitions:{9:{validator:"[0-9]",cardinality:1},a:{validator:"[A-Za-zА-яЁё]",cardinality:1},"*":{validator:"[A-Za-zА-яЁё0-9]",cardinality:1}},keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91},ignorables:[8,9,13,19,27,33,34,35,36,37,38,39,40,45,46,93,112,113,114,115,116,117,118,119,120,121,122,123],getMaskLength:function(a,b,c,d,e){var f=a.length;return b||("*"==c?f=d.length+1:c>1&&(f+=a.length*(c-1))),f}},escapeRegex:function(a){var b=["/",".","*","+","?","|","(",")","[","]","{","}","\\"];return a.replace(new RegExp("(\\"+b.join("|\\")+")","gim"),"\\$1")}},a.fn.inputmask=function(b,c){function d(a){var b=document.createElement("input"),a="on"+a,c=a in b;return c||(b.setAttribute(a,"return;"),c="function"==typeof b[a]),b=null,c}function e(b,c){var d=m.aliases[b];return!!d&&(d.alias&&e(d.alias),a.extend(!0,m,d),a.extend(!0,m,c),!0)}function f(b){m.numericInput&&(b=b.split("").reverse().join(""));var c=!1,d=0,e=m.greedy,f=m.repeat;"*"==f&&(e=!1),1==b.length&&0==e&&0!=f&&(m.placeholder="");for(var g=a.map(b.split(""),function(a,b){var e=[];if(a==m.escapeChar)c=!0;else if(a!=m.optionalmarker.start&&a!=m.optionalmarker.end||c){var f=m.definitions[a];if(f&&!c)for(var g=0;g<f.cardinality;g++)e.push(j(d+g));else e.push(a),c=!1;return d+=e.length,e}}),h=g.slice(),i=1;i<f&&e;i++)h=h.concat(g.slice());return{mask:h,repeat:f,greedy:e}}function g(b){m.numericInput&&(b=b.split("").reverse().join(""));var c=!1,d=!1,e=!1;return a.map(b.split(""),function(a,b){var f=[];if(a==m.escapeChar)d=!0;else if(a!=m.optionalmarker.start||d){if(a!=m.optionalmarker.end||d){var g=m.definitions[a];if(g&&!d){for(var h=g.prevalidator,i=h?h.length:0,j=1;j<g.cardinality;j++){var k=i>=j?h[j-1]:[],l=k.validator,n=k.cardinality;f.push({fn:l?"string"==typeof l?new RegExp(l):new function(){this.test=l}:new RegExp("."),cardinality:n?n:1,optionality:c,newBlockMarker:1==c&&e,offset:0,casing:g.casing,def:g.definitionSymbol||a}),1==c&&(e=!1)}f.push({fn:g.validator?"string"==typeof g.validator?new RegExp(g.validator):new function(){this.test=g.validator}:new RegExp("."),cardinality:g.cardinality,optionality:c,newBlockMarker:e,offset:0,casing:g.casing,def:g.definitionSymbol||a})}else f.push({fn:null,cardinality:0,optionality:c,newBlockMarker:e,offset:0,casing:null,def:a}),d=!1;return e=!1,f}c=!1,e=!0}else c=!0,e=!0})}function h(){function b(a){function b(){this.matches=[],this.isGroup=!1,this.isOptional=!1,this.isQuantifier=!1}var c,d,e=/(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[]()|\\]+|./g,f=new b,g=[];for(l=[];c=e.exec(a);)switch(d=c[0],d.charAt(0)){case m.optionalmarker.end:case m.groupmarker.end:var h=g.pop();g.length>0?g[g.length-1].matches.push(h):(l.push(h),f=h);break;case m.optionalmarker.start:!f.isGroup&&f.matches.length>0&&l.push(f),f=new b,f.isOptional=!0,g.push(f);break;case m.groupmarker.start:!f.isGroup&&f.matches.length>0&&l.push(f),f=new b,f.isGroup=!0,g.push(f);break;case m.quantifiermarker.start:var i=new b;i.isQuantifier=!0,i.matches.push(d),g.length>0?g[g.length-1].matches.push(i):f.matches.push(i);break;default:g.length>0?g[g.length-1].matches.push(d):((f.isGroup||f.isOptional)&&(f=new b),f.matches.push(d))}return f.matches.length>0&&l.push(f),l}function c(a){return m.optionalmarker.start+a+m.optionalmarker.end}function d(a){var b=0,c=0,d=a.length;for(i=0;i<d&&(a.charAt(i)==m.optionalmarker.start&&b++,a.charAt(i)==m.optionalmarker.end&&c++,!(b>0&&b==c));i++);var e=[a.substring(0,i)];return i<d&&e.push(a.substring(i+1,d)),e}function e(a){var b=a.length;for(i=0;i<b&&a.charAt(i)!=m.optionalmarker.start;i++);var c=[a.substring(0,i)];return i<b&&c.push(a.substring(i+1,b)),c}function h(b,i,l){var m,n,o=d(i),p=e(o[0]);p.length>1?(m=b+p[0]+c(p[1])+(o.length>1?o[1]:""),a.inArray(m,k)==-1&&""!=m&&(k.push(m),n=f(m),j.push({mask:m,_buffer:n.mask,buffer:n.mask.slice(),tests:g(m),lastValidPosition:-1,greedy:n.greedy,repeat:n.repeat,metadata:l})),m=b+p[0]+(o.length>1?o[1]:""),a.inArray(m,k)==-1&&""!=m&&(k.push(m),n=f(m),j.push({mask:m,_buffer:n.mask,buffer:n.mask.slice(),tests:g(m),lastValidPosition:-1,greedy:n.greedy,repeat:n.repeat,metadata:l})),e(p[1]).length>1&&h(b+p[0],p[1]+o[1],l),o.length>1&&e(o[1]).length>1&&(h(b+p[0]+c(p[1]),o[1],l),h(b+p[0],o[1],l))):(m=b+o,a.inArray(m,k)==-1&&""!=m&&(k.push(m),n=f(m),j.push({mask:m,_buffer:n.mask,buffer:n.mask.slice(),tests:g(m),lastValidPosition:-1,greedy:n.greedy,repeat:n.repeat,metadata:l})))}var j=[],k=[],l=[];return a.isFunction(m.mask)&&(m.mask=m.mask.call(this,m)),a.isArray(m.mask)?a.each(m.mask,function(a,b){void 0!=b.mask?h("",b.mask.toString(),b):h("",b.toString())}):h("",m.mask.toString()),b(m.mask),m.greedy?j:j.sort(function(a,b){return a.mask.length-b.mask.length})}function j(a){return m.placeholder.charAt(a%m.placeholder.length)}function k(b,c){function d(){return b[c]}function e(){return d().tests}function f(){return d()._buffer}function g(){return d().buffer}function h(e,f,h){function i(a,b,c,d){for(var e=l(a),f=c?1:0,g="",h=b.buffer,i=b.tests[e].cardinality;i>f;i--)g+=v(h,e-(i-1));return c&&(g+=c),null!=b.tests[e].fn?b.tests[e].fn.test(g,h,a,d,m):(c==v(b._buffer,a,!0)||c==m.skipOptionalPartCharacter)&&{refresh:!0,c:v(b._buffer,a,!0),pos:a}}function j(c,d){var g=!1;if(a.each(d,function(b,d){if(g=a.inArray(d.activeMasksetIndex,c)==-1&&d.result!==!1)return!1}),g)d=a.map(d,function(d,e){return a.inArray(d.activeMasksetIndex,c)==-1?d:void(b[d.activeMasksetIndex].lastValidPosition=w)});else{var h=-1,j=-1;a.each(d,function(b,d){a.inArray(d.activeMasksetIndex,c)!=-1&&d.result!==!1&(h==-1||h>d.result.pos)&&(h=d.result.pos,j=d.activeMasksetIndex)}),d=a.map(d,function(d,g){if(a.inArray(d.activeMasksetIndex,c)!=-1){if(d.result.pos==h)return d;if(d.result!==!1){for(var k=e;k<h;k++){if(rsltValid=i(k,b[d.activeMasksetIndex],b[j].buffer[k],!0),rsltValid===!1){b[d.activeMasksetIndex].lastValidPosition=h-1;break}u(b[d.activeMasksetIndex].buffer,k,b[j].buffer[k],!0),b[d.activeMasksetIndex].lastValidPosition=k}return rsltValid=i(h,b[d.activeMasksetIndex],f,!0),rsltValid!==!1&&(u(b[d.activeMasksetIndex].buffer,h,f,!0),b[d.activeMasksetIndex].lastValidPosition=h),d}}})}return d}if(h=h===!0){var o=i(e,d(),f,h);return o===!0&&(o={pos:e}),o}var p=[],o=!1,q=c,r=g().slice(),w=d().lastValidPosition,x=(t(e),[]);return a.each(b,function(a,b){if("object"==typeof b){c=a;var j,l=e,m=d().lastValidPosition;if(m==w){if(l-w>1)for(var t=m==-1?0:m;t<l&&(j=i(t,d(),r[t],!0),j!==!1);t++){u(g(),t,r[t],!0),j===!0&&(j={pos:t});var v=j.pos||t;d().lastValidPosition<v&&(d().lastValidPosition=v)}if(!k(l)&&!i(l,d(),f,h)){for(var y=s(l)-l,z=0;z<y&&i(++l,d(),f,h)===!1;z++);x.push(c)}}if((d().lastValidPosition>=w||c==q)&&l>=0&&l<n()){if(o=i(l,d(),f,h),o!==!1){o===!0&&(o={pos:l});var v=o.pos||l;d().lastValidPosition<v&&(d().lastValidPosition=v)}p.push({activeMasksetIndex:a,result:o})}}}),c=q,j(x,p)}function i(){var e=c,f={activeMasksetIndex:0,lastValidPosition:-1,next:-1};a.each(b,function(a,b){"object"==typeof b&&(c=a,d().lastValidPosition>f.lastValidPosition?(f.activeMasksetIndex=a,f.lastValidPosition=d().lastValidPosition,f.next=s(d().lastValidPosition)):d().lastValidPosition==f.lastValidPosition&&(f.next==-1||f.next>s(d().lastValidPosition))&&(f.activeMasksetIndex=a,f.lastValidPosition=d().lastValidPosition,f.next=s(d().lastValidPosition)))}),c=f.lastValidPosition!=-1&&b[e].lastValidPosition==f.lastValidPosition?e:f.activeMasksetIndex,e!=c&&(y(g(),s(f.lastValidPosition),n()),d().writeOutBuffer=!0),J.data("_inputmask").activeMasksetIndex=c}function k(a){var b=l(a),c=e()[b];return void 0!=c&&c.fn}function l(a){return a%e().length}function n(){return m.getMaskLength(f(),d().greedy,d().repeat,g(),m)}function s(a){var b=n();if(a>=b)return b;for(var c=a;++c<b&&!k(c););return c}function t(a){var b=a;if(b<=0)return 0;for(;--b>0&&!k(b););return b}function u(a,b,c,d){d&&(b=w(a,b));var f=e()[l(b)],g=c;if(void 0!=g&&void 0!=f)switch(f.casing){case"upper":g=c.toUpperCase();break;case"lower":g=c.toLowerCase()}a[b]=g}function v(a,b,c){return c&&(b=w(a,b)),a[b]}function w(a,b){for(var c;void 0==a[b]&&a.length<n();)for(c=0;void 0!==f()[c];)a.push(f()[c++]);return b}function x(a,b,c){a._valueSet(b.join("")),void 0!=c&&G(a,c)}function y(a,b,c,d){for(var e=b,g=n();e<c&&e<g;e++)d===!0?k(e)||u(a,e,""):u(a,e,v(f().slice(),e,!0))}function z(a,b){var c=l(b);u(a,b,v(f(),c))}function A(e,g,h,i,j){var k=void 0!=i?i.slice():C(e._valueGet()).split("");a.each(b,function(a,b){"object"==typeof b&&(b.buffer=b._buffer.slice(),b.lastValidPosition=-1,b.p=-1)}),h!==!0&&(c=0),g&&e._valueSet("");n();a.each(k,function(b,c){if(j===!0){var i=d().p,k=i==-1?i:t(i),l=k==-1?b:s(k);a.inArray(c,f().slice(k+1,l))==-1&&a(e).trigger("_keypress",[!0,c.charCodeAt(0),g,h,b])}else a(e).trigger("_keypress",[!0,c.charCodeAt(0),g,h,b])}),h===!0&&d().p!=-1&&(d().lastValidPosition=t(d().p))}function B(b){return a.inputmask.escapeRegex.call(this,b)}function C(a){return a.replace(new RegExp("("+B(f().join(""))+")*$"),"")}function D(a){for(var b,c,d=g(),f=d.slice(),c=f.length-1;c>=0;c--){var b=l(c);if(!e()[b].optionality)break;if(k(c)&&h(c,d[c],!0))break;f.pop()}x(a,f)}function E(b,c){if(!e()||c!==!0&&b.hasClass("hasDatepicker"))return b[0]._valueGet();var d=a.map(g(),function(a,b){return k(b)&&h(b,a,!0)?a:null});return(L?d.reverse():d).join("")}function F(a){if(L&&"number"==typeof a&&(!m.greedy||""!=m.placeholder)){var b=g().length;a=b-a}return a}function G(b,c,d){var e,f=b.jquery&&b.length>0?b[0]:b;return"number"!=typeof c?a(b).is(":visible")?(f.setSelectionRange?(c=f.selectionStart,d=f.selectionEnd):document.selection&&document.selection.createRange&&(e=document.selection.createRange(),c=0-e.duplicate().moveStart("character",-1e5),d=c+e.text.length),c=F(c),d=F(d),{begin:c,end:d}):{begin:0,end:0}:(c=F(c),d=F(d),a(b).is(":visible")&&(d="number"==typeof d?d:c,f.scrollLeft=f.scrollWidth,0==m.insertMode&&c==d&&d++,f.setSelectionRange?(f.selectionStart=c,f.selectionEnd=p?c:d):f.createTextRange&&(e=f.createTextRange(),e.collapse(!0),e.moveEnd("character",d),e.moveStart("character",c),e.select())),void 0)}function H(d){if("*"!=m.repeat){var e=!1,g=0,h=c;return a.each(b,function(a,b){if("object"==typeof b){c=a;var h=t(n());if(b.lastValidPosition>=g&&b.lastValidPosition==h){for(var i=!0,m=0;m<=h;m++){var o=k(m),p=l(m);if(o&&(void 0==d[m]||d[m]==j(m))||!o&&d[m]!=f()[p]){i=!1;break}}if(e=e||i)return!1}g=b.lastValidPosition}}),c=h,e}}function I(a,b){return L?a-b>1||a-b==1&&m.insertMode:b-a>1||b-a==1&&m.insertMode}var J,K,L=!1,M=g().join("");return this.unmaskedvalue=function(a,b){return L=a.data("_inputmask").isRTL,E(a,b)},this.isComplete=function(a){return H(a)},this.mask=function(p){function w(b){var c=a._data(b).events;a.each(c,function(b,c){a.each(c,function(a,b){if("inputmask"==b.namespace&&"setvalue"!=b.type&&"_keypress"!=b.type){var c=b.handler;b.handler=function(a){return this.readOnly||this.disabled?void a.preventDefault:c.apply(this,arguments)}}})})}function B(b){var c;if(Object.getOwnPropertyDescriptor&&(c=Object.getOwnPropertyDescriptor(b,"value")),c&&c.get){if(!b._valueGet){var d=c.get,e=c.set;b._valueGet=function(){return L?d.call(this).split("").reverse().join(""):d.call(this)},b._valueSet=function(a){e.call(this,L?a.split("").reverse().join(""):a)},Object.defineProperty(b,"value",{get:function(){var b=a(this),c=a(this).data("_inputmask"),e=c.masksets,f=c.activeMasksetIndex;return c&&c.opts.autoUnmask?b.inputmask("unmaskedvalue"):d.call(this)!=e[f]._buffer.join("")?d.call(this):""},set:function(b){e.call(this,b),a(this).triggerHandler("setvalue.inputmask")}})}}else if(document.__lookupGetter__&&b.__lookupGetter__("value")){if(!b._valueGet){var d=b.__lookupGetter__("value"),e=b.__lookupSetter__("value");b._valueGet=function(){return L?d.call(this).split("").reverse().join(""):d.call(this)},b._valueSet=function(a){e.call(this,L?a.split("").reverse().join(""):a)},b.__defineGetter__("value",function(){var b=a(this),c=a(this).data("_inputmask"),e=c.masksets,f=c.activeMasksetIndex;return c&&c.opts.autoUnmask?b.inputmask("unmaskedvalue"):d.call(this)!=e[f]._buffer.join("")?d.call(this):""}),b.__defineSetter__("value",function(b){e.call(this,b),a(this).triggerHandler("setvalue.inputmask")})}}else if(b._valueGet||(b._valueGet=function(){return L?this.value.split("").reverse().join(""):this.value},b._valueSet=function(a){this.value=L?a.split("").reverse().join(""):a}),void 0==a.valHooks.text||1!=a.valHooks.text.inputmaskpatch){var d=a.valHooks.text&&a.valHooks.text.get?a.valHooks.text.get:function(a){return a.value},e=a.valHooks.text&&a.valHooks.text.set?a.valHooks.text.set:function(a,b){return a.value=b,a};jQuery.extend(a.valHooks,{text:{get:function(b){var c=a(b);if(c.data("_inputmask")){if(c.data("_inputmask").opts.autoUnmask)return c.inputmask("unmaskedvalue");var e=d(b),f=c.data("_inputmask"),g=f.masksets,h=f.activeMasksetIndex;return e!=g[h]._buffer.join("")?e:""}return d(b)},set:function(b,c){var d=a(b),f=e(b,c);return d.data("_inputmask")&&d.triggerHandler("setvalue.inputmask"),f},inputmaskpatch:!0}})}}function E(a,b,c,i){var m=g();if(i!==!1)for(;!k(a)&&a-1>=0;)a--;for(var o=a;o<b&&o<n();o++)if(k(o)){z(m,o);var p=s(o),q=v(m,p);if(q!=j(p))if(p<n()&&h(o,q,!0)!==!1&&e()[l(o)].def==e()[l(p)].def)u(m,o,v(m,p),!0),p<b&&z(m,p);else if(k(o))break}else z(m,o);if(void 0!=c&&u(m,t(b),c),0==d().greedy){var r=C(m.join("")).split("");m.length=r.length;for(var o=0,w=m.length;o<w;o++)m[o]=r[o];0==m.length&&(d().buffer=f().slice())}return a}function N(a,b,c,i){for(var m=g(),o=a;o<=b&&o<n();o++)if(k(o)){var p=v(m,o,!0);if(u(m,o,c,!0),p!=j(o)){var q=s(o);if(!(q<n()))break;if(h(q,p,!0)!==!1&&e()[l(o)].def==e()[l(q)].def)c=p;else{if(k(q))break;c=p}}else if(c=p,i!==!0)break}else z(m,o);var r=m.length;if(0==d().greedy){var t=C(m.join("")).split("");m.length=t.length;for(var o=0,w=m.length;o<w;o++)m[o]=t[o];0==m.length&&(d().buffer=f().slice())}return b-(r-m.length)}function O(a,c,e){if(m.numericInput||L){switch(c){case m.keyCode.BACKSPACE:c=m.keyCode.DELETE;break;case m.keyCode.DELETE:c=m.keyCode.BACKSPACE}if(L){var f=e.end;e.end=e.begin,e.begin=f}}var h=!0;if(e.begin==e.end){var i=c==m.keyCode.BACKSPACE?e.begin-1:e.begin;m.isNumeric&&""!=m.radixPoint&&g()[i]==m.radixPoint&&(e.begin=g().length-1==i?e.begin:c==m.keyCode.BACKSPACE?i:s(i),e.end=e.begin),h=!1,c==m.keyCode.BACKSPACE?e.begin--:c==m.keyCode.DELETE&&e.end++}else e.end-e.begin!=1||m.insertMode||(h=!1,c==m.keyCode.BACKSPACE&&e.begin--);y(g(),e.begin,e.end);var j=n();if(0==m.greedy)E(e.begin,j,void 0,!L&&c==m.keyCode.BACKSPACE&&!h);else{for(var l=e.begin,o=e.begin;o<e.end;o++)!k(o)&&h||(l=E(e.begin,j,void 0,!L&&c==m.keyCode.BACKSPACE&&!h));h||(e.begin=l)}var p=s(-1);y(g(),e.begin,e.end,!0),A(a,!1,void 0==b[1]||p>=e.end,g()),d().lastValidPosition<p?(d().lastValidPosition=-1,d().p=p):d().p=e.begin}function P(b){T=!1;var c=this,e=a(c),h=b.keyCode,j=G(c);h==m.keyCode.BACKSPACE||h==m.keyCode.DELETE||o&&127==h||b.ctrlKey&&88==h?(b.preventDefault(),88==h&&(M=g().join("")),O(c,h,j),i(),x(c,g(),d().p),c._valueGet()==f().join("")&&e.trigger("cleared"),m.showTooltip&&e.prop("title",d().mask)):h==m.keyCode.END||h==m.keyCode.PAGE_DOWN?setTimeout(function(){var a=s(d().lastValidPosition);m.insertMode||a!=n()||b.shiftKey||a--,G(c,b.shiftKey?j.begin:a,a)},0):h==m.keyCode.HOME&&!b.shiftKey||h==m.keyCode.PAGE_UP?G(c,0,b.shiftKey?j.begin:0):h==m.keyCode.ESCAPE||90==h&&b.ctrlKey?(A(c,!0,!1,M.split("")),e.click()):h!=m.keyCode.INSERT||b.shiftKey||b.ctrlKey?0!=m.insertMode||b.shiftKey||(h==m.keyCode.RIGHT?setTimeout(function(){var a=G(c);G(c,a.begin)},0):h==m.keyCode.LEFT&&setTimeout(function(){var a=G(c);G(c,a.begin-1)},0)):(m.insertMode=!m.insertMode,G(c,m.insertMode||j.begin!=n()?j.begin:j.begin-1));var k=G(c);m.onKeyDown.call(this,b,g(),m)===!0&&G(c,k.begin,k.end),U=a.inArray(h,m.ignorables)!=-1}function Q(e,f,k,l,o,p){if(void 0==k&&T)return!1;T=!0;var q=this,r=a(q);e=e||window.event;var k=k||e.which||e.charCode||e.keyCode;if(!(e.ctrlKey&&e.altKey||!(e.ctrlKey||e.metaKey||U)||f===!0))return!0;if(k){f!==!0&&46==k&&0==e.shiftKey&&","==m.radixPoint&&(k=44);var w,y,z,A=String.fromCharCode(k);if(f){var B=o?p:d().lastValidPosition+1;w={begin:B,end:B}}else w=G(q);var C=I(w.begin,w.end),D=c;C&&(c=D,a.each(b,function(a,b){"object"==typeof b&&(c=a,d().undoBuffer=g().join(""))}),O(q,m.keyCode.DELETE,w),m.insertMode||a.each(b,function(a,b){"object"==typeof b&&(c=a,N(w.begin,n(),j(w.begin),!0),d().lastValidPosition=s(d().lastValidPosition))}),c=D);var E=g().join("").indexOf(m.radixPoint);m.isNumeric&&f!==!0&&E!=-1&&(m.greedy&&w.begin<=E?(w.begin=t(w.begin),w.end=w.begin):A==m.radixPoint&&(w.begin=E,w.end=w.begin));var F=w.begin;y=h(F,A,o),o===!0&&(y=[{activeMasksetIndex:c,result:y}]);var J=-1;if(a.each(y,function(a,b){c=b.activeMasksetIndex,d().writeOutBuffer=!0;var e=b.result;if(e!==!1){var f=!1,h=g();if(e!==!0&&(f=e.refresh,F=void 0!=e.pos?e.pos:F,A=void 0!=e.c?e.c:A),f!==!0){if(1==m.insertMode){for(var i=n(),k=h.slice();v(k,i,!0)!=j(i)&&i>=F;)i=0==i?-1:t(i);if(i>=F){N(F,h.length,A);var l=d().lastValidPosition,p=s(l);p!=n()&&l>=F&&v(g(),p,!0)!=j(p)&&(d().lastValidPosition=p)}else d().writeOutBuffer=!1}else u(h,F,A,!0);(J==-1||J>s(F))&&(J=s(F))}else if(!o){var q=F<n()?F+1:F;(J==-1||J>q)&&(J=q)}J>d().p&&(d().p=J)}}),o!==!0&&(c=D,i()),l!==!1&&(a.each(y,function(a,b){if(b.activeMasksetIndex==c)return z=b,!1}),void 0!=z)){var K=this;if(setTimeout(function(){m.onKeyValidation.call(K,z.result,m)},0),d().writeOutBuffer&&z.result!==!1){var L,M=g();L=f?void 0:m.numericInput?F>E?t(J):A==m.radixPoint?J-1:t(J-1):J,x(q,M,L),f!==!0&&setTimeout(function(){H(M)===!0&&r.trigger("complete")},0)}else C&&(d().buffer=d().undoBuffer.split(""))}m.showTooltip&&r.prop("title",d().mask),e.preventDefault()}}function R(b){var c=a(this),d=this,e=b.keyCode,h=g();q&&e==m.keyCode.BACKSPACE&&K==d._valueGet()&&P.call(this,b),m.onKeyUp.call(this,b,h,m),e==m.keyCode.TAB&&m.showMaskOnFocus&&(c.hasClass("focus.inputmask")&&0==d._valueGet().length?(h=f().slice(),x(d,h),G(d,0),M=g().join("")):(x(d,h),G(d,0,n())))}if(J=a(p),J.is(":input")){if(J.data("_inputmask",{masksets:b,activeMasksetIndex:c,opts:m,isRTL:!1}),m.showTooltip&&J.prop("title",d().mask),d().greedy=d().greedy?d().greedy:0==d().repeat,null!=J.attr("maxLength")){var S=J.prop("maxLength");S>-1&&a.each(b,function(a,b){"object"==typeof b&&"*"==b.repeat&&(b.repeat=S)}),n()>S&&S>-1&&(S<f().length&&(f().length=S),0==d().greedy&&(d().repeat=Math.round(S/f().length)),J.prop("maxLength",2*n()))}B(p);var T=!1,U=!1;if(m.numericInput&&(m.isNumeric=m.numericInput),("rtl"==p.dir||m.numericInput&&m.rightAlignNumerics||m.isNumeric&&m.rightAlignNumerics)&&J.css("text-align","right"),"rtl"==p.dir||m.numericInput){p.dir="ltr",J.removeAttr("dir");var V=J.data("_inputmask");V.isRTL=!0,J.data("_inputmask",V),L=!0}J.unbind(".inputmask"),J.removeClass("focus.inputmask"),J.closest("form").bind("submit",function(){M!=g().join("")&&J.change()}).bind("reset",function(){setTimeout(function(){J.trigger("setvalue")},0)}),J.bind("mouseenter.inputmask",function(){var b=a(this),c=this;!b.hasClass("focus.inputmask")&&m.showMaskOnHover&&c._valueGet()!=g().join("")&&x(c,g())}).bind("blur.inputmask",function(){var d=a(this),e=this,h=e._valueGet(),i=g();d.removeClass("focus.inputmask"),M!=g().join("")&&d.change(),m.clearMaskOnLostFocus&&""!=h&&(h==f().join("")?e._valueSet(""):D(e)),H(i)===!1&&(d.trigger("incomplete"),m.clearIncomplete&&(a.each(b,function(a,b){"object"==typeof b&&(b.buffer=b._buffer.slice(),b.lastValidPosition=-1)}),c=0,m.clearMaskOnLostFocus?e._valueSet(""):(i=f().slice(),x(e,i))))}).bind("focus.inputmask",function(){var b=a(this),c=this,e=c._valueGet();m.showMaskOnFocus&&!b.hasClass("focus.inputmask")&&(!m.showMaskOnHover||m.showMaskOnHover&&""==e)&&c._valueGet()!=g().join("")&&x(c,g(),s(d().lastValidPosition)),b.addClass("focus.inputmask"),M=g().join("")}).bind("mouseleave.inputmask",function(){var b=a(this),c=this;m.clearMaskOnLostFocus&&(b.hasClass("focus.inputmask")||c._valueGet()==b.attr("placeholder")||(c._valueGet()==f().join("")||""==c._valueGet()?c._valueSet(""):D(c)))}).bind("click.inputmask",function(){var b=this;setTimeout(function(){var c=G(b),e=g();if(c.begin==c.end){var f,h=m.isRTL?F(c.begin):c.begin,i=d().lastValidPosition;f=m.isNumeric&&m.skipRadixDance===!1&&""!=m.radixPoint&&a.inArray(m.radixPoint,e)!=-1?m.numericInput?s(a.inArray(m.radixPoint,e)):a.inArray(m.radixPoint,e):s(i),h<f?k(h)?G(b,h):G(b,s(h)):G(b,f)}},0)}).bind("dblclick.inputmask",function(){var a=this;setTimeout(function(){G(a,0,s(d().lastValidPosition))},0)}).bind(r+".inputmask dragdrop.inputmask drop.inputmask",function(b){var c=this,d=a(c);return"propertychange"==b.type&&c._valueGet().length<=n()||void setTimeout(function(){A(c,!0,!1,void 0,!0),H(g())===!0&&d.trigger("complete"),d.click()},0)}).bind("setvalue.inputmask",function(){var a=this;A(a,!0),M=g().join(""),a._valueGet()==f().join("")&&a._valueSet("")}).bind("_keypress.inputmask",Q).bind("complete.inputmask",m.oncomplete).bind("incomplete.inputmask",m.onincomplete).bind("cleared.inputmask",m.oncleared).bind("keyup.inputmask",R),q?J.bind("input.inputmask",function(b){var c=this,d=a(c);K=g().join(""),A(c,!1,!1),x(c,g()),H(g())===!0&&d.trigger("complete"),d.click()}):J.bind("keydown.inputmask",P).bind("keypress.inputmask",Q),A(p,!0,!1),M=g().join("");var W;try{W=document.activeElement}catch(X){}W===p?(J.addClass("focus.inputmask"),G(p,s(d().lastValidPosition))):m.clearMaskOnLostFocus?g().join("")==f().join("")?p._valueSet(""):D(p):x(p,g()),w(p)}},this}var l,m=a.extend(!0,{},a.inputmask.defaults,c),n=null!==navigator.userAgent.match(new RegExp("msie 10","i")),o=null!==navigator.userAgent.match(new RegExp("iphone","i")),p=null!==navigator.userAgent.match(new RegExp("android.*safari.*","i")),q=null!==navigator.userAgent.match(new RegExp("android.*chrome.*","i")),r=d("paste")&&!n?"paste":d("input")?"input":"propertychange",s=0;if("string"==typeof b)switch(b){case"mask":return e(m.alias,c),l=h(),0==l.length?this:this.each(function(){k(a.extend(!0,{},l),0).mask(this)});case"unmaskedvalue":var t=a(this);return t.data("_inputmask")?(l=t.data("_inputmask").masksets,s=t.data("_inputmask").activeMasksetIndex,m=t.data("_inputmask").opts,k(l,s).unmaskedvalue(t)):t.val();case"remove":return this.each(function(){var b=a(this),c=this;if(b.data("_inputmask")){l=b.data("_inputmask").masksets,s=b.data("_inputmask").activeMasksetIndex,m=b.data("_inputmask").opts,c._valueSet(k(l,s).unmaskedvalue(b,!0)),b.removeData("_inputmask"),b.unbind(".inputmask"),b.removeClass("focus.inputmask");var d;Object.getOwnPropertyDescriptor&&(d=Object.getOwnPropertyDescriptor(c,"value")),d&&d.get?c._valueGet&&Object.defineProperty(c,"value",{get:c._valueGet,set:c._valueSet}):document.__lookupGetter__&&c.__lookupGetter__("value")&&c._valueGet&&(c.__defineGetter__("value",c._valueGet),c.__defineSetter__("value",c._valueSet));try{delete c._valueGet,delete c._valueSet}catch(e){c._valueGet=void 0,c._valueSet=void 0}}});case"getemptymask":return this.data("_inputmask")?(l=this.data("_inputmask").masksets,s=this.data("_inputmask").activeMasksetIndex,l[s]._buffer.join("")):"";case"hasMaskedValue":return!!this.data("_inputmask")&&!this.data("_inputmask").opts.autoUnmask;case"isComplete":return l=this.data("_inputmask").masksets,s=this.data("_inputmask").activeMasksetIndex,m=this.data("_inputmask").opts,k(l,s).isComplete(this[0]._valueGet().split(""));case"getmetadata":return this.data("_inputmask")?(l=this.data("_inputmask").masksets,s=this.data("_inputmask").activeMasksetIndex,l[s].metadata):void 0;default:return e(b,c)||(m.mask=b),l=h(),0==l.length?this:this.each(function(){k(a.extend(!0,{},l),s).mask(this)})}else{if("object"==typeof b)return m=a.extend(!0,{},a.inputmask.defaults,b),e(m.alias,b),l=h(),0==l.length?this:this.each(function(){k(a.extend(!0,{},l),s).mask(this)});if(void 0==b)return this.each(function(){var b=a(this).attr("data-inputmask");if(b&&""!=b)try{b=b.replace(new RegExp("'","g"),'"');var d=a.parseJSON("{"+b+"}");a.extend(!0,d,c),m=a.extend(!0,{},a.inputmask.defaults,d),e(m.alias,d),m.alias=void 0,a(this).inputmask(m)}catch(f){}})}return this})}(jQuery),function(a){a.extend(a.inputmask.defaults.definitions,{A:{validator:"[A-Za-z]",cardinality:1,casing:"upper"},"#":{validator:"[A-Za-zА-яЁё0-9]",cardinality:1,casing:"upper"}}),a.extend(a.inputmask.defaults.aliases,{url:{mask:"ir",placeholder:"",separator:"",defaultPrefix:"http://",regex:{urlpre1:new RegExp("[fh]"),urlpre2:new RegExp("(ft|ht)"),urlpre3:new RegExp("(ftp|htt)"),urlpre4:new RegExp("(ftp:|http|ftps)"),urlpre5:new RegExp("(ftp:/|ftps:|http:|https)"),urlpre6:new RegExp("(ftp://|ftps:/|http:/|https:)"),urlpre7:new RegExp("(ftp://|ftps://|http://|https:/)"),urlpre8:new RegExp("(ftp://|ftps://|http://|https://)")},definitions:{i:{validator:function(a,b,c,d,e){return!0},cardinality:8,prevalidator:function(){for(var a=[],b=8,c=0;c<b;c++)a[c]=function(){var a=c;return{validator:function(b,c,d,e,f){if(f.regex["urlpre"+(a+1)]){var g,h=b;a+1-b.length>0&&(h=c.join("").substring(0,a+1-b.length)+""+h);var i=f.regex["urlpre"+(a+1)].test(h);if(!e&&!i){for(d-=a,g=0;g<f.defaultPrefix.length;g++)c[d]=f.defaultPrefix[g],d++;for(g=0;g<h.length-1;g++)c[d]=h[g],d++;return{pos:d}}return i}return!1},cardinality:a}}();return a}()},r:{validator:".",cardinality:50}},insertMode:!1,autoUnmask:!1},ip:{mask:["[[x]y]z.[[x]y]z.[[x]y]z.x[yz]","[[x]y]z.[[x]y]z.[[x]y]z.[[x]y][z]"],definitions:{x:{validator:"[012]",cardinality:1,definitionSymbol:"i"},y:{validator:function(a,b,c,d,e){return a=c-1>-1&&"."!=b[c-1]?b[c-1]+a:"0"+a,new RegExp("2[0-5]|[01][0-9]").test(a)},cardinality:1,definitionSymbol:"i"},z:{validator:function(a,b,c,d,e){return c-1>-1&&"."!=b[c-1]?(a=b[c-1]+a,a=c-2>-1&&"."!=b[c-2]?b[c-2]+a:"0"+a):a="00"+a,new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(a)},cardinality:1,definitionSymbol:"i"}}}})}(jQuery),function(a){a.extend(a.inputmask.defaults.definitions,{h:{validator:"[01][0-9]|2[0-3]",cardinality:2,prevalidator:[{validator:"[0-2]",cardinality:1}]},s:{validator:"[0-5][0-9]",cardinality:2,prevalidator:[{validator:"[0-5]",cardinality:1}]},d:{validator:"0[1-9]|[12][0-9]|3[01]",cardinality:2,prevalidator:[{validator:"[0-3]",cardinality:1}]},m:{validator:"0[1-9]|1[012]",cardinality:2,prevalidator:[{validator:"[01]",cardinality:1}]},y:{validator:"(19|20)\\d{2}",cardinality:4,prevalidator:[{validator:"[12]",cardinality:1},{validator:"(19|20)",cardinality:2},{validator:"(19|20)\\d",cardinality:3}]}}),a.extend(a.inputmask.defaults.aliases,{"dd/mm/yyyy":{mask:"1/2/y",placeholder:"dd/mm/yyyy",regex:{val1pre:new RegExp("[0-3]"),val1:new RegExp("0[1-9]|[12][0-9]|3[01]"),val2pre:function(b){var c=a.inputmask.escapeRegex.call(this,b);return new RegExp("((0[1-9]|[12][0-9]|3[01])"+c+"[01])")},val2:function(b){var c=a.inputmask.escapeRegex.call(this,b);return new RegExp("((0[1-9]|[12][0-9])"+c+"(0[1-9]|1[012]))|(30"+c+"(0[13-9]|1[012]))|(31"+c+"(0[13578]|1[02]))")}},leapday:"29/02/",separator:"/",yearrange:{minyear:1900,maxyear:2099},isInYearRange:function(a,b,c){var d=parseInt(a.concat(b.toString().slice(a.length))),e=parseInt(a.concat(c.toString().slice(a.length)));return NaN!=d&&(b<=d&&d<=c)||NaN!=e&&(b<=e&&e<=c)},determinebaseyear:function(a,b,c){var d=(new Date).getFullYear();if(a>d)return a;if(b<d){for(var e=b.toString().slice(0,2),f=b.toString().slice(2,4);b<e+c;)e--;var g=e+f;return a>g?a:g}return d},onKeyUp:function(b,c,d){var e=a(this);if(b.ctrlKey&&b.keyCode==d.keyCode.RIGHT){var f=new Date;e.val(f.getDate().toString()+(f.getMonth()+1).toString()+f.getFullYear().toString())}},definitions:{1:{validator:function(a,b,c,d,e){var f=e.regex.val1.test(a);return d||f||a.charAt(1)!=e.separator&&"-./".indexOf(a.charAt(1))==-1||!(f=e.regex.val1.test("0"+a.charAt(0)))?f:(b[c-1]="0",{pos:c,c:a.charAt(0)})},cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){var f=e.regex.val1pre.test(a);return d||f||!(f=e.regex.val1.test("0"+a))?f:(b[c]="0",c++,{pos:c})},cardinality:1}]},2:{validator:function(a,b,c,d,e){var f=b.join("").substr(0,3),g=e.regex.val2(e.separator).test(f+a);return d||g||a.charAt(1)!=e.separator&&"-./".indexOf(a.charAt(1))==-1||!(g=e.regex.val2(e.separator).test(f+"0"+a.charAt(0)))?g:(b[c-1]="0",{pos:c,c:a.charAt(0)})},cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){var f=b.join("").substr(0,3),g=e.regex.val2pre(e.separator).test(f+a);return d||g||!(g=e.regex.val2(e.separator).test(f+"0"+a))?g:(b[c]="0",c++,{pos:c})},cardinality:1}]},y:{validator:function(a,b,c,d,e){if(e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear)){var f=b.join("").substr(0,6);if(f!=e.leapday)return!0;var g=parseInt(a,10);return g%4===0&&(g%100!==0||g%400===0)}return!1},cardinality:4,prevalidator:[{validator:function(a,b,c,d,e){var f=e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear);if(!d&&!f){var g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a+"0").toString().slice(0,1);if(f=e.isInYearRange(g+a,e.yearrange.minyear,e.yearrange.maxyear))return b[c++]=g[0],{pos:c};if(g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a+"0").toString().slice(0,2),f=e.isInYearRange(g+a,e.yearrange.minyear,e.yearrange.maxyear))return b[c++]=g[0],b[c++]=g[1],{pos:c}}return f},cardinality:1},{validator:function(a,b,c,d,e){var f=e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear);if(!d&&!f){var g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a).toString().slice(0,2);if(f=e.isInYearRange(a[0]+g[1]+a[1],e.yearrange.minyear,e.yearrange.maxyear))return b[c++]=g[1],{pos:c};if(g=e.determinebaseyear(e.yearrange.minyear,e.yearrange.maxyear,a).toString().slice(0,2),e.isInYearRange(g+a,e.yearrange.minyear,e.yearrange.maxyear)){var h=b.join("").substr(0,6);if(h!=e.leapday)f=!0;else{var i=parseInt(a,10);f=i%4===0&&(i%100!==0||i%400===0)}}else f=!1;if(f)return b[c-1]=g[0],b[c++]=g[1],b[c++]=a[0],{pos:c}}return f},cardinality:2},{validator:function(a,b,c,d,e){return e.isInYearRange(a,e.yearrange.minyear,e.yearrange.maxyear)},cardinality:3}]}},insertMode:!1,autoUnmask:!1},"mm/dd/yyyy":{placeholder:"mm/dd/yyyy",alias:"dd/mm/yyyy",regex:{val2pre:function(b){var c=a.inputmask.escapeRegex.call(this,b);return new RegExp("((0[13-9]|1[012])"+c+"[0-3])|(02"+c+"[0-2])")},val2:function(b){var c=a.inputmask.escapeRegex.call(this,b);return new RegExp("((0[1-9]|1[012])"+c+"(0[1-9]|[12][0-9]))|((0[13-9]|1[012])"+c+"30)|((0[13578]|1[02])"+c+"31)")},val1pre:new RegExp("[01]"),val1:new RegExp("0[1-9]|1[012]")},leapday:"02/29/",onKeyUp:function(b,c,d){var e=a(this);if(b.ctrlKey&&b.keyCode==d.keyCode.RIGHT){var f=new Date;e.val((f.getMonth()+1).toString()+f.getDate().toString()+f.getFullYear().toString())}}},"yyyy/mm/dd":{mask:"y/1/2",placeholder:"yyyy/mm/dd",alias:"mm/dd/yyyy",leapday:"/02/29",onKeyUp:function(b,c,d){var e=a(this);if(b.ctrlKey&&b.keyCode==d.keyCode.RIGHT){var f=new Date;e.val(f.getFullYear().toString()+(f.getMonth()+1).toString()+f.getDate().toString())}},definitions:{2:{validator:function(a,b,c,d,e){var f=b.join("").substr(5,3),g=e.regex.val2(e.separator).test(f+a);if(!d&&!g&&(a.charAt(1)==e.separator||"-./".indexOf(a.charAt(1))!=-1)&&(g=e.regex.val2(e.separator).test(f+"0"+a.charAt(0))))return b[c-1]="0",
{pos:c,c:a.charAt(0)};if(g){var h=b.join("").substr(4,4)+a;if(h!=e.leapday)return!0;var i=parseInt(b.join("").substr(0,4),10);return i%4===0&&(i%100!==0||i%400===0)}return g},cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){var f=b.join("").substr(5,3),g=e.regex.val2pre(e.separator).test(f+a);return d||g||!(g=e.regex.val2(e.separator).test(f+"0"+a))?g:(b[c]="0",c++,{pos:c})},cardinality:1}]}}},"dd.mm.yyyy":{mask:"1.2.y",placeholder:"dd.mm.yyyy",leapday:"29.02.",separator:".",alias:"dd/mm/yyyy"},"dd-mm-yyyy":{mask:"1-2-y",placeholder:"dd-mm-yyyy",leapday:"29-02-",separator:"-",alias:"dd/mm/yyyy"},"mm.dd.yyyy":{mask:"1.2.y",placeholder:"mm.dd.yyyy",leapday:"02.29.",separator:".",alias:"mm/dd/yyyy"},"mm-dd-yyyy":{mask:"1-2-y",placeholder:"mm-dd-yyyy",leapday:"02-29-",separator:"-",alias:"mm/dd/yyyy"},"yyyy.mm.dd":{mask:"y.1.2",placeholder:"yyyy.mm.dd",leapday:".02.29",separator:".",alias:"yyyy/mm/dd"},"yyyy-mm-dd":{mask:"y-1-2",placeholder:"yyyy-mm-dd",leapday:"-02-29",separator:"-",alias:"yyyy/mm/dd"},datetime:{mask:"1/2/y h:s",placeholder:"dd/mm/yyyy hh:mm",alias:"dd/mm/yyyy",regex:{hrspre:new RegExp("[012]"),hrs24:new RegExp("2[0-9]|1[3-9]"),hrs:new RegExp("[01][0-9]|2[0-3]"),ampm:new RegExp("^[a|p|A|P][m|M]")},timeseparator:":",hourFormat:"24",definitions:{h:{validator:function(a,b,c,d,e){var f=e.regex.hrs.test(a);if(!d&&!f&&(a.charAt(1)==e.timeseparator||"-.:".indexOf(a.charAt(1))!=-1)&&(f=e.regex.hrs.test("0"+a.charAt(0))))return b[c-1]="0",b[c]=a.charAt(0),c++,{pos:c};if(f&&"24"!==e.hourFormat&&e.regex.hrs24.test(a)){var g=parseInt(a,10);return 24==g?(b[c+5]="a",b[c+6]="m"):(b[c+5]="p",b[c+6]="m"),g-=12,g<10?(b[c]=g.toString(),b[c-1]="0"):(b[c]=g.toString().charAt(1),b[c-1]=g.toString().charAt(0)),{pos:c,c:b[c]}}return f},cardinality:2,prevalidator:[{validator:function(a,b,c,d,e){var f=e.regex.hrspre.test(a);return d||f||!(f=e.regex.hrs.test("0"+a))?f:(b[c]="0",c++,{pos:c})},cardinality:1}]},t:{validator:function(a,b,c,d,e){return e.regex.ampm.test(a+"m")},casing:"lower",cardinality:1}},insertMode:!1,autoUnmask:!1},datetime12:{mask:"1/2/y h:s t\\m",placeholder:"dd/mm/yyyy hh:mm xm",alias:"datetime",hourFormat:"12"},"hh:mm t":{mask:"h:s t\\m",placeholder:"hh:mm xm",alias:"datetime",hourFormat:"12"},"h:s t":{mask:"h:s t\\m",placeholder:"hh:mm xm",alias:"datetime",hourFormat:"12"},"hh:mm:ss":{mask:"h:s:s",autoUnmask:!1},"hh:mm":{mask:"h:s",autoUnmask:!1},date:{alias:"dd/mm/yyyy"},"mm/yyyy":{mask:"1/y",placeholder:"mm/yyyy",leapday:"donotuse",separator:"/",alias:"mm/dd/yyyy"}})}(jQuery),function(a){a.extend(a.inputmask.defaults.aliases,{decimal:{mask:"~",placeholder:"",repeat:"*",greedy:!1,numericInput:!1,isNumeric:!0,digits:"*",groupSeparator:"",radixPoint:".",groupSize:3,autoGroup:!1,allowPlus:!0,allowMinus:!0,integerDigits:"*",defaultValue:"",prefix:"",suffix:"",getMaskLength:function(b,c,d,e,f){var g=b.length;c||("*"==d?g=e.length+1:d>1&&(g+=b.length*(d-1)));var h=a.inputmask.escapeRegex.call(this,f.groupSeparator),i=a.inputmask.escapeRegex.call(this,f.radixPoint),j=e.join(""),k=j.replace(new RegExp(h,"g"),"").replace(new RegExp(i),""),l=j.length-k.length;return g+l},postFormat:function(b,c,d,e){if(""==e.groupSeparator)return c;var f=b.slice();a.inArray(e.radixPoint,b);d||f.splice(c,0,"?");var g=f.join("");if(e.autoGroup||d&&g.indexOf(e.groupSeparator)!=-1){var h=a.inputmask.escapeRegex.call(this,e.groupSeparator);g=g.replace(new RegExp(h,"g"),"");var i=g.split(e.radixPoint);g=i[0];for(var j=new RegExp("([-+]?[\\d?]+)([\\d?]{"+e.groupSize+"})");j.test(g);)g=g.replace(j,"$1"+e.groupSeparator+"$2"),g=g.replace(e.groupSeparator+e.groupSeparator,e.groupSeparator);i.length>1&&(g+=e.radixPoint+i[1])}b.length=g.length;for(var k=0,l=g.length;k<l;k++)b[k]=g.charAt(k);var m=a.inArray("?",b);return d||b.splice(m,1),d?c:m},regex:{number:function(b){var c=a.inputmask.escapeRegex.call(this,b.groupSeparator),d=a.inputmask.escapeRegex.call(this,b.radixPoint),e=isNaN(b.digits)?b.digits:"{0,"+b.digits+"}",f="["+(b.allowPlus?"+":"")+(b.allowMinus?"-":"")+"]?";return new RegExp("^"+f+"(\\d+|\\d{1,"+b.groupSize+"}(("+c+"\\d{"+b.groupSize+"})?)+)("+d+"\\d"+e+")?$")}},onKeyDown:function(b,c,d){var e=a(this),f=this;if(b.keyCode==d.keyCode.TAB){var g=a.inArray(d.radixPoint,c);if(g!=-1){for(var h=e.data("_inputmask").masksets,i=e.data("_inputmask").activeMasksetIndex,j=1;j<=d.digits&&j<d.getMaskLength(h[i]._buffer,h[i].greedy,h[i].repeat,c,d);j++)void 0!=c[g+j]&&""!=c[g+j]||(c[g+j]="0");f._valueSet(c.join(""))}}else if(b.keyCode==d.keyCode.DELETE||b.keyCode==d.keyCode.BACKSPACE)return d.postFormat(c,0,!0,d),f._valueSet(c.join("")),!0},definitions:{"~":{validator:function(b,c,d,e,f){if(""==b)return!1;if(!e&&d<=1&&"0"===c[0]&&new RegExp("[\\d-]").test(b)&&1==c.length)return c[0]="",{pos:0};var g=e?c.slice(0,d):c.slice();g.splice(d,0,b);var h=g.join(""),j=a.inputmask.escapeRegex.call(this,f.groupSeparator);h=h.replace(new RegExp(j,"g"),"");var k=f.regex.number(f).test(h);if(!k&&(h+="0",k=f.regex.number(f).test(h),!k)){var l=h.lastIndexOf(f.groupSeparator);for(i=h.length-l;i<=3;i++)h+="0";if(k=f.regex.number(f).test(h),!k&&!e&&b==f.radixPoint&&(k=f.regex.number(f).test("0"+h+"0")))return c[d]="0",d++,{pos:d}}if(0!=k&&!e&&b!=f.radixPoint){var m=f.postFormat(c,d,!1,f);return{pos:m}}return k},cardinality:1,prevalidator:null}},insertMode:!0,autoUnmask:!1},integer:{regex:{number:function(b){var c=a.inputmask.escapeRegex.call(this,b.groupSeparator),d=b.allowPlus||b.allowMinus?"["+(b.allowPlus?"+":"")+(b.allowMinus?"-":"")+"]?":"";return new RegExp("^"+d+"(\\d+|\\d{1,"+b.groupSize+"}(("+c+"\\d{"+b.groupSize+"})?)+)$")}},alias:"decimal"}})}(jQuery),function(a){a.extend(a.inputmask.defaults.aliases,{Regex:{mask:"r",greedy:!1,repeat:"*",regex:null,regexTokens:null,tokenizer:/\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,quantifierFilter:/[0-9]+[^,]/,definitions:{r:{validator:function(a,b,c,d,e){function f(){this.matches=[],this.isGroup=!1,this.isQuantifier=!1,this.isLiteral=!1}function g(){var a,b,c=new f,d=[];for(e.regexTokens=[];a=e.tokenizer.exec(e.regex);)switch(b=a[0],b.charAt(0)){case"[":case"\\":d.length>0?d[d.length-1].matches.push(b):c.matches.push(b);break;case"(":!c.isGroup&&c.matches.length>0&&e.regexTokens.push(c),c=new f,c.isGroup=!0,d.push(c);break;case")":var g=d.pop();d.length>0?d[d.length-1].matches.push(g):(e.regexTokens.push(g),c=new f);break;case"{":var h=new f;h.isQuantifier=!0,h.matches.push(b),d.length>0?d[d.length-1].matches.push(h):c.matches.push(h);break;default:var i=new f;i.isLiteral=!0,i.matches.push(b),d.length>0?d[d.length-1].matches.push(i):c.matches.push(i)}c.matches.length>0&&e.regexTokens.push(c)}function h(a,b){var c=!1;b&&(j+="(",l++);for(var d=0;d<a.matches.length;d++){var f=a.matches[d];if(1==f.isGroup)c=h(f,!0);else if(1==f.isQuantifier){f=f.matches[0];for(var g=e.quantifierFilter.exec(f)[0].replace("}",""),i=j+"{1,"+g+"}",k=0;k<l;k++)i+=")";var n=new RegExp("^("+i+")$");c=n.test(m),j+=f}else if(1==f.isLiteral){f=f.matches[0];for(var i=j,o="",k=0;k<l;k++)o+=")";for(var p=0;p<f.length;p++){i=(i+f[p]).replace(/\|$/,"");var n=new RegExp("^("+i+o+")$");if(c=n.test(m))break}j+=f}else{j+=f;for(var i=j.replace(/\|$/,""),k=0;k<l;k++)i+=")";var n=new RegExp("^("+i+")$");c=n.test(m)}if(c)break}return b&&(j+=")",l--),c}null==e.regexTokens&&g();var i=b.slice(),j="",k=!1,l=0;i.splice(c,0,a);for(var m=i.join(""),n=0;n<e.regexTokens.length;n++){var f=e.regexTokens[n];if(k=h(f,f.isGroup))break}return k},cardinality:1}}}})}(jQuery),function(a){a.extend(a.inputmask.defaults.aliases,{phone:{url:"phone-codes/phone-codes.json",mask:function(b){b.definitions={p:{validator:function(){return!1},cardinality:1},"#":{validator:"[0-9]",cardinality:1}};var c=[];return a.ajax({url:b.url,async:!1,dataType:"json",success:function(a){c=a}}),c.splice(0,0,"+p(ppp)ppp-pppp"),c}}})}(jQuery);
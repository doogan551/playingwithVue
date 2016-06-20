!function(a){"function"==typeof define&&define.amd?define(["jquery","datatables.net"],function(b){return a(b,window,document)}):"object"==typeof exports?module.exports=function(b,c){return b||(b=window),c&&c.fn.dataTable||(c=require("datatables.net")(b,c).$),a(c,b,b.document)}:a(jQuery,window,document)}(function(a,b,c,d){"use strict";var e=a.fn.dataTable,f=0,g=0,h=e.ext.buttons,i=function(b,c){c===!0&&(c={}),a.isArray(c)&&(c={buttons:c}),this.c=a.extend(!0,{},i.defaults,c),c.buttons&&(this.c.buttons=c.buttons),this.s={dt:new e.Api(b),buttons:[],listenKeys:"",namespace:"dtb"+f++},this.dom={container:a("<"+this.c.dom.container.tag+"/>").addClass(this.c.dom.container.className)},this._constructor()};a.extend(i.prototype,{action:function(a,b){var c=this._nodeToButton(a);return b===d?c.conf.action:(c.conf.action=b,this)},active:function(b,c){var e=this._nodeToButton(b),f=this.c.dom.button.active,g=a(e.node);return c===d?g.hasClass(f):(g.toggleClass(f,c===d||c),this)},add:function(a,b){var c=this.s.buttons;if("string"==typeof b){for(var d=b.split("-"),e=this.s,f=0,g=d.length-1;f<g;f++)e=e.buttons[1*d[f]];c=e.buttons,b=1*d[d.length-1]}return this._expandButton(c,a,!1,b),this._draw(),this},container:function(){return this.dom.container},disable:function(b){var c=this._nodeToButton(b);return a(c.node).addClass(this.c.dom.button.disabled),this},destroy:function(){a("body").off("keyup."+this.s.namespace);var b,c,d=this.s.buttons;for(b=0,c=d.length;b<c;b++)this.remove(d[b].node);this.dom.container.remove();var e=this.s.dt.settings()[0];for(b=0,c=e.length;b<c;b++)if(e.inst===this){e.splice(b,1);break}return this},enable:function(b,c){if(c===!1)return this.disable(b);var d=this._nodeToButton(b);return a(d.node).removeClass(this.c.dom.button.disabled),this},name:function(){return this.c.name},node:function(b){var c=this._nodeToButton(b);return a(c.node)},remove:function(b){var c=this._nodeToButton(b),d=this._nodeToHost(b),e=this.s.dt;if(c.buttons.length)for(var f=c.buttons.length-1;f>=0;f--)this.remove(c.buttons[f].node);c.conf.destroy&&c.conf.destroy.call(e.button(b),e,a(b),c.conf),this._removeKey(c.conf),a(c.node).remove();var g=a.inArray(c,d);return d.splice(g,1),this},text:function(b,c){var e=this._nodeToButton(b),f=this.c.dom.collection.buttonLiner,g=e.inCollection&&f&&f.tag?f.tag:this.c.dom.buttonLiner.tag,h=this.s.dt,i=a(e.node),j=function(a){return"function"==typeof a?a(h,i,e.conf):a};return c===d?j(e.conf.text):(e.conf.text=c,g?i.children(g).html(j(c)):i.html(j(c)),this)},_constructor:function(){var b=this,d=this.s.dt,e=d.settings()[0],f=this.c.buttons;e._buttons||(e._buttons=[]),e._buttons.push({inst:this,name:this.c.name});for(var g=0,h=f.length;g<h;g++)this.add(f[g]);d.on("destroy",function(){b.destroy()}),a("body").on("keyup."+this.s.namespace,function(a){if(!c.activeElement||c.activeElement===c.body){var d=String.fromCharCode(a.keyCode).toLowerCase();b.s.listenKeys.toLowerCase().indexOf(d)!==-1&&b._keypress(d,a)}})},_addKey:function(b){b.key&&(this.s.listenKeys+=a.isPlainObject(b.key)?b.key.key:b.key)},_draw:function(a,b){a||(a=this.dom.container,b=this.s.buttons),a.children().detach();for(var c=0,d=b.length;c<d;c++)a.append(b[c].inserter),b[c].buttons&&b[c].buttons.length&&this._draw(b[c].collection,b[c].buttons)},_expandButton:function(b,c,e,f){for(var g=this.s.dt,h=0,i=a.isArray(c)?c:[c],j=0,k=i.length;j<k;j++){var l=this._resolveExtends(i[j]);if(l)if(a.isArray(l))this._expandButton(b,l,e,f);else{var m=this._buildButton(l,e);if(m){if(f!==d?(b.splice(f,0,m),f++):b.push(m),m.conf.buttons){var n=this.c.dom.collection;m.collection=a("<"+n.tag+"/>").addClass(n.className),m.conf._collection=m.collection,this._expandButton(m.buttons,m.conf.buttons,!0,f)}l.init&&l.init.call(g.button(m.node),g,a(m.node),l),h++}}}},_buildButton:function(b,c){var d=this.c.dom.button,e=this.c.dom.buttonLiner,f=this.c.dom.collection,h=this.s.dt,i=function(a){return"function"==typeof a?a(h,k,b):a};if(c&&f.button&&(d=f.button),c&&f.buttonLiner&&(e=f.buttonLiner),b.available&&!b.available(h,b))return!1;var j=function(b,c,d,e){e.action.call(c.button(d),b,c,d,e),a(c.table().node()).triggerHandler("buttons-action.dt",[c.button(d),c,d,e])},k=a("<"+d.tag+"/>").addClass(d.className).attr("tabindex",this.s.dt.settings()[0].iTabIndex).attr("aria-controls",this.s.dt.table().node().id).on("click.dtb",function(a){a.preventDefault(),!k.hasClass(d.disabled)&&b.action&&j(a,h,k,b),k.blur()}).on("keyup.dtb",function(a){13===a.keyCode&&!k.hasClass(d.disabled)&&b.action&&j(a,h,k,b)});if("a"===d.tag.toLowerCase()&&k.attr("href","#"),e.tag){var l=a("<"+e.tag+"/>").html(i(b.text)).addClass(e.className);"a"===e.tag.toLowerCase()&&l.attr("href","#"),k.append(l)}else k.html(i(b.text));b.enabled===!1&&k.addClass(d.disabled),b.className&&k.addClass(b.className),b.titleAttr&&k.attr("title",b.titleAttr),b.namespace||(b.namespace=".dt-button-"+g++);var m,n=this.c.dom.buttonContainer;return m=n&&n.tag?a("<"+n.tag+"/>").addClass(n.className).append(k):k,this._addKey(b),{conf:b,node:k.get(0),inserter:m,buttons:[],inCollection:c,collection:null}},_nodeToButton:function(a,b){b||(b=this.s.buttons);for(var c=0,d=b.length;c<d;c++){if(b[c].node===a)return b[c];if(b[c].buttons.length){var e=this._nodeToButton(a,b[c].buttons);if(e)return e}}},_nodeToHost:function(a,b){b||(b=this.s.buttons);for(var c=0,d=b.length;c<d;c++){if(b[c].node===a)return b;if(b[c].buttons.length){var e=this._nodeToHost(a,b[c].buttons);if(e)return e}}},_keypress:function(b,c){var d=function(d,e){if(d.key)if(d.key===b)a(e).click();else if(a.isPlainObject(d.key)){if(d.key.key!==b)return;if(d.key.shiftKey&&!c.shiftKey)return;if(d.key.altKey&&!c.altKey)return;if(d.key.ctrlKey&&!c.ctrlKey)return;if(d.key.metaKey&&!c.metaKey)return;a(e).click()}},e=function(a){for(var b=0,c=a.length;b<c;b++)d(a[b].conf,a[b].node),a[b].buttons.length&&e(a[b].buttons)};e(this.s.buttons)},_removeKey:function(b){if(b.key){var c=a.isPlainObject(b.key)?b.key.key:b.key,d=this.s.listenKeys.split(""),e=a.inArray(c,d);d.splice(e,1),this.s.listenKeys=d.join("")}},_resolveExtends:function(b){var c,e,f=this.s.dt,g=function(c){for(var e=0;!a.isPlainObject(c)&&!a.isArray(c);){if(c===d)return;if("function"==typeof c){if(c=c(f,b),!c)return!1}else if("string"==typeof c){if(!h[c])throw"Unknown button type: "+c;c=h[c]}if(e++,e>30)throw"Buttons: Too many iterations"}return a.isArray(c)?c:a.extend({},c)};for(b=g(b);b&&b.extend;){if(!h[b.extend])throw"Cannot extend unknown button type: "+b.extend;var i=g(h[b.extend]);if(a.isArray(i))return i;if(!i)return!1;var j=i.className;b=a.extend({},i,b),j&&b.className!==j&&(b.className=j+" "+b.className);var k=b.postfixButtons;if(k){for(b.buttons||(b.buttons=[]),c=0,e=k.length;c<e;c++)b.buttons.push(k[c]);b.postfixButtons=null}var l=b.prefixButtons;if(l){for(b.buttons||(b.buttons=[]),c=0,e=l.length;c<e;c++)b.buttons.splice(c,0,l[c]);b.prefixButtons=null}b.extend=i.extend}return b}}),i.background=function(b,c,e){e===d&&(e=400),b?a("<div/>").addClass(c).css("display","none").appendTo("body").fadeIn(e):a("body > div."+c).fadeOut(e,function(){a(this).remove()})},i.instanceSelector=function(b,c){if(!b)return a.map(c,function(a){return a.inst});var d=[],e=a.map(c,function(a){return a.name}),f=function(b){if(a.isArray(b))for(var g=0,h=b.length;g<h;g++)f(b[g]);else if("string"==typeof b)if(b.indexOf(",")!==-1)f(b.split(","));else{var i=a.inArray(a.trim(b),e);i!==-1&&d.push(c[i].inst)}else"number"==typeof b&&d.push(c[b].inst)};return f(b),d},i.buttonSelector=function(b,c){for(var e=[],f=function(a,b,c){for(var e,g,h=0,i=b.length;h<i;h++)e=b[h],e&&(g=c!==d?c+h:h+"",a.push({node:e.node,name:e.conf.name,idx:g}),e.buttons&&f(a,e.buttons,g+"-"))},g=function(b,c){var h,i,j=[];f(j,c.s.buttons);var k=a.map(j,function(a){return a.node});if(a.isArray(b)||b instanceof a)for(h=0,i=b.length;h<i;h++)g(b[h],c);else if(null===b||b===d||"*"===b)for(h=0,i=j.length;h<i;h++)e.push({inst:c,node:j[h].node});else if("number"==typeof b)e.push({inst:c,node:c.s.buttons[b].node});else if("string"==typeof b)if(b.indexOf(",")!==-1){var l=b.split(",");for(h=0,i=l.length;h<i;h++)g(a.trim(l[h]),c)}else if(b.match(/^\d+(\-\d+)*$/)){var m=a.map(j,function(a){return a.idx});e.push({inst:c,node:j[a.inArray(b,m)].node})}else if(b.indexOf(":name")!==-1){var n=b.replace(":name","");for(h=0,i=j.length;h<i;h++)j[h].name===n&&e.push({inst:c,node:j[h].node})}else a(k).filter(b).each(function(){e.push({inst:c,node:this})});else if("object"==typeof b&&b.nodeName){var o=a.inArray(b,k);o!==-1&&e.push({inst:c,node:k[o]})}},h=0,i=b.length;h<i;h++){var j=b[h];g(c,j)}return e},i.defaults={buttons:["copy","excel","csv","pdf","print"],name:"main",tabIndex:0,dom:{container:{tag:"div",className:"dt-buttons"},collection:{tag:"div",className:"dt-button-collection"},button:{tag:"a",className:"dt-button",active:"active",disabled:"disabled"},buttonLiner:{tag:"span",className:""}}},i.version="1.2.0",a.extend(h,{collection:{text:function(a){return a.i18n("buttons.collection","Collection")},className:"buttons-collection",action:function(c,d,e,f){var g=e,h=g.offset(),j=a(d.table().container()),k=!1;a("div.dt-button-background").length&&(k=a("div.dt-button-collection").offset(),a("body").trigger("click.dtb-collection")),f._collection.addClass(f.collectionLayout).css("display","none").appendTo("body").fadeIn(f.fade);var l=f._collection.css("position");if(k&&"absolute"===l)f._collection.css({top:k.top+5,left:k.left+5});else if("absolute"===l){f._collection.css({top:h.top+g.outerHeight(),left:h.left});var m=h.left+f._collection.outerWidth(),n=j.offset().left+j.width();m>n&&f._collection.css("left",h.left-(m-n))}else{var o=f._collection.height()/2;o>a(b).height()/2&&(o=a(b).height()/2),f._collection.css("marginTop",o*-1)}f.background&&i.background(!0,f.backgroundClassName,f.fade),setTimeout(function(){a("div.dt-button-background").on("click.dtb-collection",function(){}),a("body").on("click.dtb-collection",function(b){a(b.target).parents().andSelf().filter(f._collection).length||(f._collection.fadeOut(f.fade,function(){f._collection.detach()}),a("div.dt-button-background").off("click.dtb-collection"),i.background(!1,f.backgroundClassName,f.fade),a("body").off("click.dtb-collection"),d.off("buttons-action.b-internal"))})},10),f.autoClose&&d.on("buttons-action.b-internal",function(){a("div.dt-button-background").click()})},background:!0,collectionLayout:"",backgroundClassName:"dt-button-background",autoClose:!1,fade:400},copy:function(a,b){return h.copyHtml5?"copyHtml5":h.copyFlash&&h.copyFlash.available(a,b)?"copyFlash":void 0},csv:function(a,b){return h.csvHtml5&&h.csvHtml5.available(a,b)?"csvHtml5":h.csvFlash&&h.csvFlash.available(a,b)?"csvFlash":void 0},excel:function(a,b){return h.excelHtml5&&h.excelHtml5.available(a,b)?"excelHtml5":h.excelFlash&&h.excelFlash.available(a,b)?"excelFlash":void 0},pdf:function(a,b){return h.pdfHtml5&&h.pdfHtml5.available(a,b)?"pdfHtml5":h.pdfFlash&&h.pdfFlash.available(a,b)?"pdfFlash":void 0},pageLength:function(b){var c=b.settings()[0].aLengthMenu,d=a.isArray(c[0])?c[0]:c,e=a.isArray(c[0])?c[1]:c,f=function(a){return a.i18n("buttons.pageLength",{"-1":"Show all rows",_:"Show %d rows"},a.page.len())};return{extend:"collection",text:f,className:"buttons-page-length",autoClose:!0,buttons:a.map(d,function(a,b){return{text:e[b],action:function(b,c){c.page.len(a).draw()},init:function(b,c,d){var e=this,f=function(){e.active(b.page.len()===a)};b.on("length.dt"+d.namespace,f),f()},destroy:function(a,b,c){a.off("length.dt"+c.namespace)}}}),init:function(a,b,c){var d=this;a.on("length.dt"+c.namespace,function(){d.text(f(a))})},destroy:function(a,b,c){a.off("length.dt"+c.namespace)}}}}),e.Api.register("buttons()",function(a,b){return b===d&&(b=a,a=d),this.iterator(!0,"table",function(c){if(c._buttons)return i.buttonSelector(i.instanceSelector(a,c._buttons),b)},!0)}),e.Api.register("button()",function(a,b){var c=this.buttons(a,b);return c.length>1&&c.splice(1,c.length),c}),e.Api.registerPlural("buttons().active()","button().active()",function(a){return a===d?this.map(function(a){return a.inst.active(a.node)}):this.each(function(b){b.inst.active(b.node,a)})}),e.Api.registerPlural("buttons().action()","button().action()",function(a){return a===d?this.map(function(a){return a.inst.action(a.node)}):this.each(function(b){b.inst.action(b.node,a)})}),e.Api.register(["buttons().enable()","button().enable()"],function(a){return this.each(function(b){b.inst.enable(b.node,a)})}),e.Api.register(["buttons().disable()","button().disable()"],function(){return this.each(function(a){a.inst.disable(a.node)})}),e.Api.registerPlural("buttons().nodes()","button().node()",function(){var b=a();return a(this.each(function(a){b=b.add(a.inst.node(a.node))})),b}),e.Api.registerPlural("buttons().text()","button().text()",function(a){return a===d?this.map(function(a){return a.inst.text(a.node)}):this.each(function(b){b.inst.text(b.node,a)})}),e.Api.registerPlural("buttons().trigger()","button().trigger()",function(){return this.each(function(a){a.inst.node(a.node).trigger("click")})}),e.Api.registerPlural("buttons().containers()","buttons().container()",function(){var b=a();return a(this.each(function(a){b=b.add(a.inst.container())})),b}),e.Api.register("button().add()",function(a,b){return 1===this.length&&this[0].inst.add(b,a),this.button(a)}),e.Api.register("buttons().destroy()",function(){return this.pluck("inst").unique().each(function(a){a.destroy()}),this}),e.Api.registerPlural("buttons().remove()","buttons().remove()",function(){return this.each(function(a){a.inst.remove(a.node)}),this});var j;e.Api.register("buttons.info()",function(b,c,e){var f=this;return b===!1?(a("#datatables_buttons_info").fadeOut(function(){a(this).remove()}),clearTimeout(j),j=null,this):(j&&clearTimeout(j),a("#datatables_buttons_info").length&&a("#datatables_buttons_info").remove(),b=b?"<h2>"+b+"</h2>":"",a('<div id="datatables_buttons_info" class="dt-button-info"/>').html(b).append(a("<div/>")["string"==typeof c?"html":"append"](c)).css("display","none").appendTo("body").fadeIn(),e!==d&&0!==e&&(j=setTimeout(function(){f.buttons.info(!1)},e)),this)}),e.Api.register("buttons.exportData()",function(a){if(this.context.length)return l(new e.Api(this.context[0]),a)});var k=a("<textarea/>")[0],l=function(b,c){for(var d=a.extend(!0,{},{rows:null,columns:"",modifier:{search:"applied",order:"applied"},orthogonal:"display",stripHtml:!0,stripNewlines:!0,decodeEntities:!0,trim:!0,format:{header:function(a){return e(a)},footer:function(a){return e(a)},body:function(a){return e(a)}}},c),e=function(a){return"string"!=typeof a?a:(d.stripHtml&&(a=a.replace(/<[^>]*>/g,"")),d.trim&&(a=a.replace(/^\s+|\s+$/g,"")),d.stripNewlines&&(a=a.replace(/\n/g," ")),d.decodeEntities&&(k.innerHTML=a,a=k.value),a)},f=b.columns(d.columns).indexes().map(function(a){return d.format.header(b.column(a).header().innerHTML,a)}).toArray(),g=b.table().footer()?b.columns(d.columns).indexes().map(function(a){var c=b.column(a).footer();return d.format.footer(c?c.innerHTML:"",a)}).toArray():null,h=b.rows(d.rows,d.modifier).indexes().toArray(),i=b.cells(h,d.columns).render(d.orthogonal).toArray(),j=f.length,l=j>0?i.length/j:0,m=new Array(l),n=0,o=0,p=l;o<p;o++){for(var q=new Array(j),r=0;r<j;r++)q[r]=d.format.body(i[n],r,o),n++;m[o]=q}return{header:f,footer:g,body:m}};return a.fn.dataTable.Buttons=i,a.fn.DataTable.Buttons=i,a(c).on("init.dt plugin-init.dt",function(a,b){if("dt"===a.namespace){var c=b.oInit.buttons||e.defaults.buttons;c&&!b._buttons&&new i(b,c).container()}}),e.ext.feature.push({fnInit:function(a){var b=new e.Api(a),c=b.init().buttons||e.defaults.buttons;return new i(b,c).container()},cFeature:"B"}),i});
!function(a){"function"==typeof define&&define.amd?define(["jquery","datatables.net"],function(b){return a(b,window,document)}):"object"==typeof exports?module.exports=function(b,c){return b||(b=window),c&&c.fn.dataTable||(c=require("datatables.net")(b,c).$),a(c,b,b.document)}:a(jQuery,window,document)}(function(a,b,c,d){"use strict";var e=a.fn.dataTable,f=function(b,c){if(!e.versionCheck||!e.versionCheck("1.10.3"))throw"DataTables Responsive requires DataTables 1.10.3 or newer";this.s={dt:new e.Api(b),columns:[],current:[]},this.s.dt.settings()[0].responsive||(c&&"string"==typeof c.details?c.details={type:c.details}:c&&c.details===!1?c.details={type:!1}:c&&c.details===!0&&(c.details={type:"inline"}),this.c=a.extend(!0,{},f.defaults,e.defaults.responsive,c),b.responsive=this,this._constructor())};a.extend(f.prototype,{_constructor:function(){var c=this,d=this.s.dt,f=d.settings()[0],g=a(b).width();d.settings()[0]._responsive=this,a(b).on("resize.dtr orientationchange.dtr",e.util.throttle(function(){var d=a(b).width();d!==g&&(c._resize(),g=d)})),f.oApi._fnCallbackReg(f,"aoRowCreatedCallback",function(b,e,f){a.inArray(!1,c.s.current)!==-1&&a("td, th",b).each(function(b){var e=d.column.index("toData",b);c.s.current[e]===!1&&a(this).css("display","none")})}),d.on("destroy.dtr",function(){d.off(".dtr"),a(d.table().body()).off(".dtr"),a(b).off("resize.dtr orientationchange.dtr"),a.each(c.s.current,function(a,b){b===!1&&c._setColumnVis(a,!0)})}),this.c.breakpoints.sort(function(a,b){return a.width<b.width?1:a.width>b.width?-1:0}),this._classLogic(),this._resizeAuto();var h=this.c.details;h.type!==!1&&(c._detailsInit(),d.on("column-visibility.dtr",function(a,b,d,e){c._classLogic(),c._resizeAuto(),c._resize()}),d.on("draw.dtr",function(){c._redrawChildren()}),a(d.table().node()).addClass("dtr-"+h.type)),d.on("column-reorder.dtr",function(a,b,d){c._classLogic(),c._resizeAuto(),c._resize()}),d.on("column-sizing.dtr",function(){c._resizeAuto(),c._resize()}),d.on("init.dtr",function(b,e,f){c._resizeAuto(),c._resize(),a.inArray(!1,c.s.current)&&d.columns.adjust()}),this._resize()},_columnsVisiblity:function(b){var c,d,e=this.s.dt,f=this.s.columns,g=f.map(function(a,b){return{columnIdx:b,priority:a.priority}}).sort(function(a,b){return a.priority!==b.priority?a.priority-b.priority:a.columnIdx-b.columnIdx}),h=a.map(f,function(c){return(!c.auto||null!==c.minWidth)&&(c.auto===!0?"-":a.inArray(b,c.includeIn)!==-1)}),i=0;for(c=0,d=h.length;c<d;c++)h[c]===!0&&(i+=f[c].minWidth);var j=e.settings()[0].oScroll,k=j.sY||j.sX?j.iBarWidth:0,l=e.table().container().offsetWidth-k,m=l-i;for(c=0,d=h.length;c<d;c++)f[c].control&&(m-=f[c].minWidth);var n=!1;for(c=0,d=g.length;c<d;c++){var o=g[c].columnIdx;"-"===h[o]&&!f[o].control&&f[o].minWidth&&(n||m-f[o].minWidth<0?(n=!0,h[o]=!1):h[o]=!0,m-=f[o].minWidth)}var p=!1;for(c=0,d=f.length;c<d;c++)if(!f[c].control&&!f[c].never&&!h[c]){p=!0;break}for(c=0,d=f.length;c<d;c++)f[c].control&&(h[c]=p);return a.inArray(!0,h)===-1&&(h[0]=!0),h},_classLogic:function(){var b=this,c=this.c.breakpoints,e=this.s.dt,f=e.columns().eq(0).map(function(b){var c=this.column(b),f=c.header().className,g=e.settings()[0].aoColumns[b].responsivePriority;if(g===d){var h=a(c.header()).data("priority");g=h!==d?1*h:1e4}return{className:f,includeIn:[],auto:!1,control:!1,never:!!f.match(/\bnever\b/),priority:g}}),g=function(b,c){var d=f[b].includeIn;a.inArray(c,d)===-1&&d.push(c)},h=function(a,d,e,h){var i,j,k;if(e){if("max-"===e)for(i=b._find(d).width,j=0,k=c.length;j<k;j++)c[j].width<=i&&g(a,c[j].name);else if("min-"===e)for(i=b._find(d).width,j=0,k=c.length;j<k;j++)c[j].width>=i&&g(a,c[j].name);else if("not-"===e)for(j=0,k=c.length;j<k;j++)c[j].name.indexOf(h)===-1&&g(a,c[j].name)}else f[a].includeIn.push(d)};f.each(function(b,d){for(var e=b.className.split(" "),f=!1,g=0,i=e.length;g<i;g++){var j=a.trim(e[g]);if("all"===j)return f=!0,void(b.includeIn=a.map(c,function(a){return a.name}));if("none"===j||b.never)return void(f=!0);if("control"===j)return f=!0,void(b.control=!0);a.each(c,function(a,b){var c=b.name.split("-"),e=new RegExp("(min\\-|max\\-|not\\-)?("+c[0]+")(\\-[_a-zA-Z0-9])?"),g=j.match(e);g&&(f=!0,g[2]===c[0]&&g[3]==="-"+c[1]?h(d,b.name,g[1],g[2]+g[3]):g[2]!==c[0]||g[3]||h(d,b.name,g[1],g[2]))})}f||(b.auto=!0)}),this.s.columns=f},_detailsDisplay:function(b,c){var d=this,e=this.s.dt,f=this.c.details;if(f&&f.type!==!1){var g=f.display(b,c,function(){return f.renderer(e,b[0],d._detailsObj(b[0]))});g!==!0&&g!==!1||a(e.table().node()).triggerHandler("responsive-display.dt",[e,b,g,c])}},_detailsInit:function(){var b=this,c=this.s.dt,d=this.c.details;"inline"===d.type&&(d.target="td:first-child, th:first-child"),c.on("draw.dtr",function(){b._tabIndexes()}),b._tabIndexes(),a(c.table().body()).on("keyup.dtr","td, th",function(b){13===b.keyCode&&a(this).data("dtr-keyboard")&&a(this).click()});var e=d.target,f="string"==typeof e?e:"td, th";a(c.table().body()).on("click.dtr mousedown.dtr mouseup.dtr",f,function(d){if(a(c.table().node()).hasClass("collapsed")&&c.row(a(this).closest("tr")).length){if("number"==typeof e){var f=e<0?c.columns().eq(0).length+e:e;if(c.cell(this).index().column!==f)return}var g=c.row(a(this).closest("tr"));"click"===d.type?b._detailsDisplay(g,!1):"mousedown"===d.type?a(this).css("outline","none"):"mouseup"===d.type&&a(this).blur().css("outline","")}})},_detailsObj:function(b){var c=this,d=this.s.dt;return a.map(this.s.columns,function(a,e){if(!a.never&&!a.control)return{title:d.settings()[0].aoColumns[e].sTitle,data:d.cell(b,e).render(c.c.orthogonal),hidden:d.column(e).visible()&&!c.s.current[e],columnIndex:e,rowIndex:b}})},_find:function(a){for(var b=this.c.breakpoints,c=0,d=b.length;c<d;c++)if(b[c].name===a)return b[c]},_redrawChildren:function(){var a=this,b=this.s.dt;b.rows({page:"current"}).iterator("row",function(c,d){b.row(d);a._detailsDisplay(b.row(d),!0)})},_resize:function(){var c,d,e=this,f=this.s.dt,g=a(b).width(),h=this.c.breakpoints,i=h[0].name,j=this.s.columns,k=this.s.current.slice();for(c=h.length-1;c>=0;c--)if(g<=h[c].width){i=h[c].name;break}var l=this._columnsVisiblity(i);this.s.current=l;var m=!1;for(c=0,d=j.length;c<d;c++)if(l[c]===!1&&!j[c].never&&!j[c].control){m=!0;break}a(f.table().node()).toggleClass("collapsed",m);var n=!1;f.columns().eq(0).each(function(a,b){l[b]!==k[b]&&(n=!0,e._setColumnVis(a,l[b]))}),n&&(this._redrawChildren(),a(f.table().node()).trigger("responsive-resize.dt",[f,this.s.current]))},_resizeAuto:function(){var b=this.s.dt,c=this.s.columns;if(this.c.auto&&a.inArray(!0,a.map(c,function(a){return a.auto}))!==-1){var d=(b.table().node().offsetWidth,b.columns,b.table().node().cloneNode(!1)),e=a(b.table().header().cloneNode(!1)).appendTo(d),f=a(b.table().body()).clone(!1,!1).empty().appendTo(d),g=b.columns().header().filter(function(a){return b.column(a).visible()}).to$().clone(!1).css("display","table-cell");a(f).append(a(b.rows({page:"current"}).nodes()).clone(!1)).find("th, td").css("display","");var h=b.table().footer();if(h){var i=a(h.cloneNode(!1)).appendTo(d),j=b.columns().footer().filter(function(a){return b.column(a).visible()}).to$().clone(!1).css("display","table-cell");a("<tr/>").append(j).appendTo(i)}a("<tr/>").append(g).appendTo(e),"inline"===this.c.details.type&&a(d).addClass("dtr-inline collapsed"),a(d).find("[name]").removeAttr("name");var k=a("<div/>").css({width:1,height:1,overflow:"hidden"}).append(d);k.insertBefore(b.table().node()),g.each(function(a){var d=b.column.index("fromVisible",a);c[d].minWidth=this.offsetWidth||0}),k.remove()}},_setColumnVis:function(b,c){var d=this.s.dt,e=c?"":"none";a(d.column(b).header()).css("display",e),a(d.column(b).footer()).css("display",e),d.column(b).nodes().to$().css("display",e)},_tabIndexes:function(){var b=this.s.dt,c=b.cells({page:"current"}).nodes().to$(),d=b.settings()[0],e=this.c.details.target;c.filter("[data-dtr-keyboard]").removeData("[data-dtr-keyboard]");var f="number"==typeof e?":eq("+e+")":e;a(f,b.rows({page:"current"}).nodes()).attr("tabIndex",d.iTabIndex).data("dtr-keyboard",1)}}),f.breakpoints=[{name:"desktop",width:1/0},{name:"tablet-l",width:1024},{name:"tablet-p",width:768},{name:"mobile-l",width:480},{name:"mobile-p",width:320}],f.display={childRow:function(b,c,d){return c?a(b.node()).hasClass("parent")?(b.child(d(),"child").show(),!0):void 0:b.child.isShown()?(b.child(!1),a(b.node()).removeClass("parent"),!1):(b.child(d(),"child").show(),a(b.node()).addClass("parent"),!0)},childRowImmediate:function(b,c,d){return!c&&b.child.isShown()||!b.responsive.hasHidden()?(b.child(!1),a(b.node()).removeClass("parent"),!1):(b.child(d(),"child").show(),a(b.node()).addClass("parent"),!0)},modal:function(b){return function(d,e,f){if(e)a("div.dtr-modal-content").empty().append(f());else{var g=function(){h.remove(),a(c).off("keypress.dtr")},h=a('<div class="dtr-modal"/>').append(a('<div class="dtr-modal-display"/>').append(a('<div class="dtr-modal-content"/>').append(f())).append(a('<div class="dtr-modal-close">&times;</div>').click(function(){g()}))).append(a('<div class="dtr-modal-background"/>').click(function(){g()})).appendTo("body");a(c).on("keyup.dtr",function(a){27===a.keyCode&&(a.stopPropagation(),g())})}b&&b.header&&a("div.dtr-modal-content").prepend("<h2>"+b.header(d)+"</h2>")}}},f.renderer={listHidden:function(){return function(b,c,d){var e=a.map(d,function(a){return a.hidden?'<li data-dtr-index="'+a.columnIndex+'" data-dt-row="'+a.rowIndex+'" data-dt-column="'+a.columnIndex+'"><span class="dtr-title">'+a.title+'</span> <span class="dtr-data">'+a.data+"</span></li>":""}).join("");return!!e&&a('<ul data-dtr-index="'+c+'"/>').append(e)}},tableAll:function(b){return b=a.extend({tableClass:""},b),function(c,d,e){var f=a.map(e,function(a){return'<tr data-dt-row="'+a.rowIndex+'" data-dt-column="'+a.columnIndex+'"><td>'+a.title+":</td> <td>"+a.data+"</td></tr>"}).join("");return a('<table class="'+b.tableClass+'" width="100%"/>').append(f)}}},f.defaults={breakpoints:f.breakpoints,auto:!0,details:{display:f.display.childRow,renderer:f.renderer.listHidden(),target:0,type:"inline"},orthogonal:"display"};var g=a.fn.dataTable.Api;return g.register("responsive()",function(){return this}),g.register("responsive.index()",function(b){return b=a(b),{column:b.data("dtr-index"),row:b.parent().data("dtr-index")}}),g.register("responsive.rebuild()",function(){return this.iterator("table",function(a){a._responsive&&a._responsive._classLogic()})}),g.register("responsive.recalc()",function(){return this.iterator("table",function(a){a._responsive&&(a._responsive._resizeAuto(),a._responsive._resize())})}),g.register("responsive.hasHidden()",function(){var b=this.context[0];return!!b._responsive&&a.inArray(!1,b._responsive.s.current)!==-1}),f.version="2.1.0",a.fn.dataTable.Responsive=f,a.fn.DataTable.Responsive=f,a(c).on("preInit.dt.dtr",function(b,c,d){if("dt"===b.namespace&&(a(c.nTable).hasClass("responsive")||a(c.nTable).hasClass("dt-responsive")||c.oInit.responsive||e.defaults.responsive)){var g=c.oInit.responsive;g!==!1&&new f(c,a.isPlainObject(g)?g:{})}}),f});
!function(a){"function"==typeof define&&define.amd?define(["jquery","datatables.net"],function(b){return a(b,window,document)}):"object"==typeof exports?module.exports=function(b,c){return b||(b=window),c&&c.fn.dataTable||(c=require("datatables.net")(b,c).$),a(c,b,b.document)}:a(jQuery,window,document)}(function(a,b,c,d){"use strict";var e=a.fn.dataTable,f=function(b,e){return this instanceof f?(e===d&&(e={}),this.s={dt:a.fn.dataTable.Api(b).settings()[0],tableTop:0,tableBottom:0,redrawTop:0,redrawBottom:0,autoHeight:!0,viewportRows:0,stateTO:null,drawTO:null,heights:{jump:null,page:null,virtual:null,scroll:null,row:null,viewport:null},topRowFloat:0,scrollDrawDiff:null,loaderVisible:!1},this.s=a.extend(this.s,f.oDefaults,e),this.s.heights.row=this.s.rowHeight,this.dom={force:c.createElement("div"),scroller:null,table:null,loader:null},void(this.s.dt.oScroller||(this.s.dt.oScroller=this,this._fnConstruct()))):void alert("Scroller warning: Scroller must be initialised with the 'new' keyword.")};a.extend(f.prototype,{fnRowToPixels:function(a,b,c){var e;if(c)e=this._domain("virtualToPhysical",a*this.s.heights.row);else{var f=a-this.s.baseRowTop;e=this.s.baseScrollTop+f*this.s.heights.row}return b||b===d?parseInt(e,10):e},fnPixelsToRow:function(a,b,c){var e=a-this.s.baseScrollTop,f=c?this._domain("physicalToVirtual",a)/this.s.heights.row:e/this.s.heights.row+this.s.baseRowTop;return b||b===d?parseInt(f,10):f},fnScrollToRow:function(b,c){var d=this,e=!1,f=this.fnRowToPixels(b),g=(this.s.displayBuffer-1)/2*this.s.viewportRows,h=b-g;h<0&&(h=0),(f>this.s.redrawBottom||f<this.s.redrawTop)&&this.s.dt._iDisplayStart!==h&&(e=!0,f=this.fnRowToPixels(b,!1,!0)),"undefined"==typeof c||c?(this.s.ani=e,a(this.dom.scroller).animate({scrollTop:f},function(){setTimeout(function(){d.s.ani=!1},25)})):a(this.dom.scroller).scrollTop(f)},fnMeasure:function(b){this.s.autoHeight&&this._fnCalcRowHeight();var c=this.s.heights;c.row&&(c.viewport=a(this.dom.scroller).height(),this.s.viewportRows=parseInt(c.viewport/c.row,10)+1,this.s.dt._iDisplayLength=this.s.viewportRows*this.s.displayBuffer),(b===d||b)&&this.s.dt.oInstance.fnDraw(!1)},fnPageInfo:function(){var a=this.s.dt,b=this.dom.scroller.scrollTop,c=a.fnRecordsDisplay(),d=Math.ceil(this.fnPixelsToRow(b+this.s.heights.viewport,!1,this.s.ani));return{start:Math.floor(this.fnPixelsToRow(b,!1,this.s.ani)),end:c<d?c-1:d-1}},_fnConstruct:function(){var c=this;if(!this.s.dt.oFeatures.bPaginate)return void this.s.dt.oApi._fnLog(this.s.dt,0,"Pagination must be enabled for Scroller");this.dom.force.style.position="relative",this.dom.force.style.top="0px",this.dom.force.style.left="0px",this.dom.force.style.width="1px",this.dom.scroller=a("div."+this.s.dt.oClasses.sScrollBody,this.s.dt.nTableWrapper)[0],this.dom.scroller.appendChild(this.dom.force),this.dom.scroller.style.position="relative",this.dom.table=a(">table",this.dom.scroller)[0],this.dom.table.style.position="absolute",this.dom.table.style.top="0px",this.dom.table.style.left="0px",a(this.s.dt.nTableWrapper).addClass("DTS"),this.s.loadingIndicator&&(this.dom.loader=a('<div class="dataTables_processing DTS_Loading">'+this.s.dt.oLanguage.sLoadingRecords+"</div>").css("display","none"),a(this.dom.scroller.parentNode).css("position","relative").append(this.dom.loader)),this.s.heights.row&&"auto"!=this.s.heights.row&&(this.s.autoHeight=!1),this.fnMeasure(!1),this.s.ingnoreScroll=!0,this.s.stateSaveThrottle=this.s.dt.oApi._fnThrottle(function(){c.s.dt.oApi._fnSaveState(c.s.dt)},500),a(this.dom.scroller).on("scroll.DTS",function(a){c._fnScroll.call(c)}),a(this.dom.scroller).on("touchstart.DTS",function(){c._fnScroll.call(c)}),this.s.dt.aoDrawCallback.push({fn:function(){c.s.dt.bInitialised&&c._fnDrawCallback.call(c)},sName:"Scroller"}),a(b).on("resize.DTS",function(){c.fnMeasure(!1),c._fnInfo()});var d=!0;this.s.dt.oApi._fnCallbackReg(this.s.dt,"aoStateSaveParams",function(a,b){d&&c.s.dt.oLoadedState?(b.iScroller=c.s.dt.oLoadedState.iScroller,b.iScrollerTopRow=c.s.dt.oLoadedState.iScrollerTopRow,d=!1):(b.iScroller=c.dom.scroller.scrollTop,b.iScrollerTopRow=c.s.topRowFloat)},"Scroller_State"),this.s.dt.oLoadedState&&(this.s.topRowFloat=this.s.dt.oLoadedState.iScrollerTopRow||0),a(this.s.dt.nTable).one("init.dt",function(){c.fnMeasure()}),this.s.dt.aoDestroyCallback.push({sName:"Scroller",fn:function(){a(b).off("resize.DTS"),a(c.dom.scroller).off("touchstart.DTS scroll.DTS"),a(c.s.dt.nTableWrapper).removeClass("DTS"),a("div.DTS_Loading",c.dom.scroller.parentNode).remove(),a(c.s.dt.nTable).off("init.dt"),c.dom.table.style.position="",c.dom.table.style.top="",c.dom.table.style.left=""}})},_fnScroll:function(){var b,c=this,d=this.s.heights,e=this.dom.scroller.scrollTop;if(!this.s.skip&&!this.s.ingnoreScroll){if(this.s.dt.bFiltered||this.s.dt.bSorted)return void(this.s.lastScrollTop=0);if(this._fnInfo(),clearTimeout(this.s.stateTO),this.s.stateTO=setTimeout(function(){c.s.dt.oApi._fnSaveState(c.s.dt)},250),e<this.s.redrawTop||e>this.s.redrawBottom){var f=Math.ceil((this.s.displayBuffer-1)/2*this.s.viewportRows);if(Math.abs(e-this.s.lastScrollTop)>d.viewport||this.s.ani?(b=parseInt(this._domain("physicalToVirtual",e)/d.row,10)-f,this.s.topRowFloat=this._domain("physicalToVirtual",e)/d.row):(b=this.fnPixelsToRow(e)-f,this.s.topRowFloat=this.fnPixelsToRow(e,!1)),b<=0?b=0:b+this.s.dt._iDisplayLength>this.s.dt.fnRecordsDisplay()?(b=this.s.dt.fnRecordsDisplay()-this.s.dt._iDisplayLength,b<0&&(b=0)):b%2!==0&&b++,b!=this.s.dt._iDisplayStart){this.s.tableTop=a(this.s.dt.nTable).offset().top,this.s.tableBottom=a(this.s.dt.nTable).height()+this.s.tableTop;var g=function(){null===c.s.scrollDrawReq&&(c.s.scrollDrawReq=e),c.s.dt._iDisplayStart=b,c.s.dt.oApi._fnDraw(c.s.dt)};this.s.dt.oFeatures.bServerSide?(clearTimeout(this.s.drawTO),this.s.drawTO=setTimeout(g,this.s.serverWait)):g(),this.dom.loader&&!this.s.loaderVisible&&(this.dom.loader.css("display","block"),this.s.loaderVisible=!0)}}else this.s.topRowFloat=this._domain("physicalToVirtual",e)/d.row;this.s.lastScrollTop=e,this.s.stateSaveThrottle()}},_domain:function(a,b){var c,d=this.s.heights;if(d.virtual===d.scroll)return b;var e=(d.scroll-d.viewport)/2,f=(d.virtual-d.viewport)/2;return c=f/(e*e),"virtualToPhysical"===a?b<f?Math.pow(b/c,.5):(b=2*f-b,b<0?d.scroll:2*e-Math.pow(b/c,.5)):"physicalToVirtual"===a?b<e?b*b*c:(b=2*e-b,b<0?d.virtual:2*f-b*b*c):void 0},_fnDrawCallback:function(){var b=this,c=this.s.heights,d=this.dom.scroller.scrollTop,e=(d+c.viewport,a(this.s.dt.nTable).height()),f=this.s.dt._iDisplayStart,g=this.s.dt._iDisplayLength,h=this.s.dt.fnRecordsDisplay();this.s.skip=!0,this._fnScrollForce(),d=0===f?this.s.topRowFloat*c.row:f+g>=h?c.scroll-(h-this.s.topRowFloat)*c.row:this._domain("virtualToPhysical",this.s.topRowFloat*c.row),this.dom.scroller.scrollTop=d,this.s.baseScrollTop=d,this.s.baseRowTop=this.s.topRowFloat;var i=d-(this.s.topRowFloat-f)*c.row;0===f?i=0:f+g>=h&&(i=c.scroll-e),this.dom.table.style.top=i+"px",this.s.tableTop=i,this.s.tableBottom=e+this.s.tableTop;var j=(d-this.s.tableTop)*this.s.boundaryScale;if(this.s.redrawTop=d-j,this.s.redrawBottom=d+j,this.s.skip=!1,this.s.dt.oFeatures.bStateSave&&null!==this.s.dt.oLoadedState&&"undefined"!=typeof this.s.dt.oLoadedState.iScroller){var k=!(!this.s.dt.sAjaxSource&&!b.s.dt.ajax||this.s.dt.oFeatures.bServerSide);(k&&2==this.s.dt.iDraw||!k&&1==this.s.dt.iDraw)&&setTimeout(function(){a(b.dom.scroller).scrollTop(b.s.dt.oLoadedState.iScroller),b.s.redrawTop=b.s.dt.oLoadedState.iScroller-c.viewport/2,setTimeout(function(){b.s.ingnoreScroll=!1},0)},0)}else b.s.ingnoreScroll=!1;this.s.dt.oFeatures.bInfo&&setTimeout(function(){b._fnInfo.call(b)},0),this.dom.loader&&this.s.loaderVisible&&(this.dom.loader.css("display","none"),this.s.loaderVisible=!1)},_fnScrollForce:function(){var a=this.s.heights,b=1e6;a.virtual=a.row*this.s.dt.fnRecordsDisplay(),a.scroll=a.virtual,a.scroll>b&&(a.scroll=b),this.dom.force.style.height=a.scroll>this.s.heights.row?a.scroll+"px":this.s.heights.row+"px"},_fnCalcRowHeight:function(){var b=this.s.dt,c=b.nTable,d=c.cloneNode(!1),e=a("<tbody/>").appendTo(d),f=a('<div class="'+b.oClasses.sWrapper+' DTS"><div class="'+b.oClasses.sScrollWrapper+'"><div class="'+b.oClasses.sScrollBody+'"></div></div></div>');for(a("tbody tr:lt(4)",c).clone().appendTo(e);a("tr",e).length<3;)e.append("<tr><td>&nbsp;</td></tr>");a("div."+b.oClasses.sScrollBody,f).append(d);var g=this.s.dt.nHolding||c.parentNode;a(g).is(":visible")||(g="body"),f.appendTo(g),this.s.heights.row=a("tr",e).eq(1).outerHeight(),f.remove()},_fnInfo:function(){if(this.s.dt.oFeatures.bInfo){var b,c=this.s.dt,d=c.oLanguage,e=this.dom.scroller.scrollTop,f=Math.floor(this.fnPixelsToRow(e,!1,this.s.ani)+1),g=c.fnRecordsTotal(),h=c.fnRecordsDisplay(),i=Math.ceil(this.fnPixelsToRow(e+this.s.heights.viewport,!1,this.s.ani)),j=h<i?h:i,k=c.fnFormatNumber(f),l=c.fnFormatNumber(j),m=c.fnFormatNumber(g),n=c.fnFormatNumber(h);b=0===c.fnRecordsDisplay()&&c.fnRecordsDisplay()==c.fnRecordsTotal()?d.sInfoEmpty+d.sInfoPostFix:0===c.fnRecordsDisplay()?d.sInfoEmpty+" "+d.sInfoFiltered.replace("_MAX_",m)+d.sInfoPostFix:c.fnRecordsDisplay()==c.fnRecordsTotal()?d.sInfo.replace("_START_",k).replace("_END_",l).replace("_MAX_",m).replace("_TOTAL_",n)+d.sInfoPostFix:d.sInfo.replace("_START_",k).replace("_END_",l).replace("_MAX_",m).replace("_TOTAL_",n)+" "+d.sInfoFiltered.replace("_MAX_",c.fnFormatNumber(c.fnRecordsTotal()))+d.sInfoPostFix;var o=d.fnInfoCallback;o&&(b=o.call(c.oInstance,c,f,j,g,h,b));var p=c.aanFeatures.i;if("undefined"!=typeof p)for(var q=0,r=p.length;q<r;q++)a(p[q]).html(b);a(c.nTable).triggerHandler("info.dt")}}}),f.defaults={trace:!1,rowHeight:"auto",serverWait:200,displayBuffer:9,boundaryScale:.5,loadingIndicator:!1},f.oDefaults=f.defaults,f.version="1.4.2","function"==typeof a.fn.dataTable&&"function"==typeof a.fn.dataTableExt.fnVersionCheck&&a.fn.dataTableExt.fnVersionCheck("1.10.0")?a.fn.dataTableExt.aoFeatures.push({fnInit:function(a){var b=a.oInit,c=b.scroller||b.oScroller||{};new f(a,c)},cFeature:"S",sFeature:"Scroller"}):alert("Warning: Scroller requires DataTables 1.10.0 or greater - www.datatables.net/download"),a(c).on("preInit.dt.dtscroller",function(b,c){if("dt"===b.namespace){var d=c.oInit.scroller,g=e.defaults.scroller;if(d||g){var h=a.extend({},d,g);d!==!1&&new f(c,h)}}}),a.fn.dataTable.Scroller=f,a.fn.DataTable.Scroller=f;var g=a.fn.dataTable.Api;return g.register("scroller()",function(){return this}),g.register("scroller().rowToPixels()",function(a,b,c){var d=this.context;if(d.length&&d[0].oScroller)return d[0].oScroller.fnRowToPixels(a,b,c)}),g.register("scroller().pixelsToRow()",function(a,b,c){var d=this.context;if(d.length&&d[0].oScroller)return d[0].oScroller.fnPixelsToRow(a,b,c)}),g.register("scroller().scrollToRow()",function(a,b){return this.iterator("table",function(c){c.oScroller&&c.oScroller.fnScrollToRow(a,b)}),this}),g.register("row().scrollTo()",function(a){var b=this;return this.iterator("row",function(c,d){if(c.oScroller){var e=b.rows({order:"applied",search:"applied"}).indexes().indexOf(d);c.oScroller.fnScrollToRow(e,a)}}),this}),g.register("scroller.measure()",function(a){return this.iterator("table",function(b){b.oScroller&&b.oScroller.fnMeasure(a)}),this}),g.register("scroller.page()",function(){var a=this.context;if(a.length&&a[0].oScroller)return a[0].oScroller.fnPageInfo()}),f});
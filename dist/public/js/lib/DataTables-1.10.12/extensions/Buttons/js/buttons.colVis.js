!function(a){"function"==typeof define&&define.amd?define(["jquery","datatables.net","datatables.net-buttons"],function(b){return a(b,window,document)}):"object"==typeof exports?module.exports=function(b,c){return b||(b=window),c&&c.fn.dataTable||(c=require("datatables.net")(b,c).$),c.fn.dataTable.Buttons||require("datatables.net-buttons")(b,c),a(c,b,b.document)}:a(jQuery,window,document)}(function(a,b,c,d){"use strict";var e=a.fn.dataTable;return a.extend(e.ext.buttons,{colvis:function(a,b){return{extend:"collection",text:function(a){return a.i18n("buttons.colvis","Column visibility")},className:"buttons-colvis",buttons:[{extend:"columnsToggle",columns:b.columns}]}},columnsToggle:function(a,b){var c=a.columns(b.columns).indexes().map(function(a){return{extend:"columnToggle",columns:a}}).toArray();return c},columnToggle:function(a,b){return{extend:"columnVisibility",columns:b.columns}},columnsVisibility:function(a,b){var c=a.columns(b.columns).indexes().map(function(a){return{extend:"columnVisibility",columns:a,visibility:b.visibility}}).toArray();return c},columnVisibility:{columns:d,text:function(a,b,c){return c._columnText(a,c.columns)},className:"buttons-columnVisibility",action:function(a,b,c,e){var f=b.columns(e.columns),g=f.visible();f.visible(e.visibility!==d?e.visibility:!(!!g.length&&g[0]))},init:function(a,b,c){var d=this,e=a.column(c.columns);a.on("column-visibility.dt"+c.namespace,function(a,b){b.bDestroying||d.active(e.visible())}).on("column-reorder.dt"+c.namespace,function(b,e,f){if(1===a.columns(c.columns).count()){"number"==typeof c.columns&&(c.columns=f.mapping[c.columns]);var g=a.column(c.columns);d.text(c._columnText(a,c.columns)),d.active(g.visible())}}),this.active(e.visible())},destroy:function(a,b,c){a.off("column-visibility.dt"+c.namespace).off("column-reorder.dt"+c.namespace)},_columnText:function(a,b){var c=a.column(b).index();return a.settings()[0].aoColumns[c].sTitle.replace(/\n/g," ").replace(/<.*?>/g,"").replace(/^\s+|\s+$/g,"")}},colvisRestore:{className:"buttons-colvisRestore",text:function(a){return a.i18n("buttons.colvisRestore","Restore visibility")},init:function(a,b,c){c._visOriginal=a.columns().indexes().map(function(b){return a.column(b).visible()}).toArray()},action:function(a,b,c,d){b.columns().every(function(a){var c=b.colReorder&&b.colReorder.transpose?b.colReorder.transpose(a,"toOriginal"):a;this.visible(d._visOriginal[c])})}},colvisGroup:{className:"buttons-colvisGroup",action:function(a,b,c,d){b.columns(d.show).visible(!0,!1),b.columns(d.hide).visible(!1,!1),b.columns.adjust()},show:[],hide:[]}}),e.Buttons});
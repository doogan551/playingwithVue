!function(a){"function"==typeof define&&define.amd?define(["jquery","datatables.net-bs4","datatables.net-responsive"],function(b){return a(b,window,document)}):"object"==typeof exports?module.exports=function(b,c){return b||(b=window),c&&c.fn.dataTable||(c=require("datatables.net-bs4")(b,c).$),c.fn.dataTable.Responsive||require("datatables.net-responsive")(b,c),a(c,b,b.document)}:a(jQuery,window,document)}(function(a,b,c,d){"use strict";var e=a.fn.dataTable,f=e.Responsive.display,g=f.modal,h=a('<div class="modal fade dtr-bs-modal" role="dialog"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body"/></div></div></div>');return f.modal=function(b){return function(c,d,e){a.fn.modal?d||(b&&b.header&&h.find("div.modal-header").empty().append('<h4 class="modal-title">'+b.header(c)+"</h4>"),h.find("div.modal-body").empty().append(e()),h.appendTo("body").modal()):g(c,d,e)}},e.Responsive});
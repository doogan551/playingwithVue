!function(a){"function"==typeof define&&define.amd?define(["jquery","datatables.net-se","datatables.net-autofill"],function(b){return a(b,window,document)}):"object"==typeof exports?module.exports=function(b,c){return b||(b=window),c&&c.fn.dataTable||(c=require("datatables.net-se")(b,c).$),c.fn.dataTable.AutoFill||require("datatables.net-autofill")(b,c),a(c,b,b.document)}:a(jQuery,window,document)}(function(a,b,c,d){"use strict";var e=a.fn.dataTable;return e.AutoFill.classes.btn="ui button",e});
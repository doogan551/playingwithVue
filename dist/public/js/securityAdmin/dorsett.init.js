$(function(){$.ajaxSetup({cache:!1,converters:{"text json":$.parseJSON}}),$(document).ajaxStart(function(){$.mobile.loading("show",{theme:"b",text:"Working...",textVisible:!0})}).ajaxStop(function(){$.mobile.loading("hide")}).ajaxSend(function(a,b,c){}).ajaxComplete(function(a,b,c){}).ajaxError(function(a,b,c,d){var e={},f=d||"";if("undefined"!=typeof b.responseText)try{e=$.parseJSON(b.responseText)}catch(g){}if(401==b.status){if(dorsett.suppresswarnings)return;dorsett.suppresswarnings=!0,alert("Your session has expired."),setTimeout(function(){location=dorsett.webendpoint},100)}else null!=e&&"undefined"!=typeof e.error&&e.error&&(f=e.message),alert("An error has occurred. We apologize for the inconvenience. Please contact the system administrator for details.\n\n"+f)}),dorsett.initialize($(window))});
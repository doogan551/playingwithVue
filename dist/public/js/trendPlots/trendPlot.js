var trendPlots={logLinePrefix:!0,numberWithCommas:function(a){if(null!==a&&void 0!==a){if(a.toString().indexOf(".")>0){var b=a.toString().split(".");return b[0].replace(/\B(?=(\d{3})+(?!\d))/g,",")+"."+b[1]}return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")}return""},emptyFn:function(){},onReadyFns:[],onReady:function(a){trendPlots.highchartsLoaded?a():trendPlots.onReadyFns.push(a)},formatDate:function(a,b){var c,d=["Hours","Minutes","Seconds","Milliseconds"],e=[2,2,2,3],f=[":",":",":",""],g=" --",h="";b&&f.push(g),"number"==typeof a&&(a=new Date(a));for(c in d)d.hasOwnProperty(c)&&(h+=("000"+a["get"+d[c]]()).slice(-1*e[c])+f[c]);return h},log:function(){var a,b,c,d,e=(new Date,[].splice.call(arguments,0)),f=function(a){return("    "+a).slice(-4)},g=trendPlots.formatDate(new Date,!0);trendPlots.logLinePrefix===!0&&(d=new Error,Error.captureStackTrace&&(Error.captureStackTrace(d),a=d.stack.split("\n")[2],b=a.split(":"),c=b[2],e.unshift("line:"+f(c),g))),trendPlots.noLog||console.log.apply(console,e)},forEach:function(a,b){var c,d=Object.keys(a),e=d.length,f=!0;for(c=0;c<e&&f;c++)f=b(a[d[c]],d[c],c),void 0===f&&(f=!0);return f},forEachArray:function(a,b){var c,d=a||[],e=d.length,f=!0;for(c=0;c<e&&f;c++)f=b(d[c],c),void 0===f&&(f=!0);return f},createNamespace:function(a,b,c){var d=b.split("."),e=a;return trendPlots.forEachArray(d,function(a,b){e[a]=e[a]||{},b===d.length-1&&void 0!==c?"object"==typeof e[a]&&"object"==typeof c?$.extend(!0,e[a],c):e[a]=c:e=e[a]}),a},complicateObject:function(a,b,c){var d=trendPlots.createNamespace;return trendPlots.forEach(a,function(a,e){var f=b[e];void 0!==f&&(c=d(c,a,f))}),c},typeConfigs:{line:{},arearange:{requiresMore:!0},areaspline:{},bar:{},column:{cfg:function(a){return{plotOptions:{column:{}},series:[{connectNulls:!0}],tooltip:{shared:!0,useHTML:!0}}}},columnrange:{requiresMore:!0},gauge:{requiresMore:!0,cfg:function(a){var b,c,d=a.size||1,e=function(){return[{from:0,to:Math.round(.6*a.max),color:"#55BF3B"},{from:Math.round(.6*a.max),to:Math.round(.8*a.max),color:"#DDDF0D"},{from:Math.round(.8*a.max),to:a.max,color:"#DF5353"}]},f=a.colorStops?$.extend(!0,[],a.colorStops):null,g=a.colorStopsType,h=function(b){var c={from:Math.round(b.from/100*a.max),to:Math.round(b.to/100*a.max),color:(b.color.match("#")?"":"#")+b.color};return c},i=function(){var a=!0;return trendPlots.forEachArray(f,function(b){return isNaN(parseFloat(b.from))||isNaN(parseFloat(b.to))?a=!1:(b.from=parseFloat(b.from),b.to=parseFloat(b.to),b.color=(b.color.match("#")?"":"#")+b.color),a}),a};return a.max=Math.round(a.max),c=Math.min(a.width,a.height),f&&i()?"percent"===g&&trendPlots.forEachArray(f,function(a,b){f[b]=h(a)}):f=e(),b={chart:{type:"gauge",plotBackgroundColor:null,plotBackgroundImage:null,plotBorderWidth:0,plotShadow:!1},title:{text:"Speedometer"},pane:{size:Math.round(100*d)+"%",startAngle:-150,endAngle:150,background:[]},tooltip:{enabled:!1},yAxis:{min:0,max:a.max,minorTickInterval:null,tickInterval:a.max,labels:{step:1,distance:Math.round(10*d),rotation:"none"},title:{text:a.units},plotBands:f},series:[{dataLabels:{format:'<div style="text-align:center"><span style="font-size:'+c/120*(a.size||1)+'em;color:black">{y:,.1f}</span><br/><span style="font-size:'+c/120*(a.size||1)+'em;color:silver">'+(a.units||"")+"</span></div>"}}],plotOptions:{gauge:{dataLabels:{borderWidth:0,y:0,useHTML:!0}}}}}},heatmap:{},pie:{},solidgauge:{cfg:function(a){var b,c=1.6*(a.size||1),d=function(){return[[.1,"#55BF3B"],[.5,"#DDDF0D"],[.9,"#DF5353"]]},e=a.colorStops?$.extend(!0,[],a.colorStops):null,f=(a.colorStopsType,function(){var a=[];return trendPlots.forEachArray(e,function(b,c){var d=b.to/100,e=[d,(b.color.match("#")?"":"#")+b.color];a.push(e)}),a}),g=function(){var a=!0;return trendPlots.forEachArray(e,function(b){return isNaN(parseFloat(b.from))||isNaN(parseFloat(b.to))?a=!1:(b.from=parseFloat(b.from),b.to=parseFloat(b.to),b.color=(b.color.match("#")?"":"#")+b.color),a}),a};return a.max=Math.round(a.max),b=Math.min(a.width,a.height),e=e&&g()?f():d(),{pane:{center:["50%","85%"],size:Math.round(100*c)+"%",startAngle:-90,endAngle:90,background:{backgroundColor:"#EEEEEE",innerRadius:"60%",outerRadius:"100%",shape:"arc"}},tooltip:{enabled:!1},yAxis:{min:0,max:a.max,stops:e,lineWidth:0,minorTickInterval:null,tickInterval:a.max,title:{y:-70},labels:{step:1,y:16}},plotOptions:{solidgauge:{dataLabels:{y:5,borderWidth:0,useHTML:!0}}},series:[{dataLabels:{format:'<div style="text-align:center"><span style="font-size:'+b/120*(a.size||1)+'em;color:black">{y:,.1f}</span><br/><span style="font-size:'+b/120*(a.size||1)+'em;color:silver">'+a.units+"</span></div>"}}]}},requiresMore:!0},spline:{}},defaults:{highChartDefaults:{credits:{enabled:!1}}},init:function(){var a,b=["highcharts","highcharts-more","/modules/solid-gauge","/modules/no-data-to-display"],c=".js",d="/js/lib/",e=0,f=function(){if(e++,e===b.length)for(Highcharts.setOptions({global:{useUTC:!1},lang:{decimalPoint:".",thousandsSep:","}}),trendPlots.highchartsLoaded=!0;trendPlots.onReadyFns.length;)trendPlots.onReadyFns.pop()();else a()},g=function(){trendPlots.log("error with getscript",arguments)};a=function(){var a=b[e];$.getScript(d+a+c).done(f).fail(g)},Highcharts&&b.shift(),a()}},emptyFn=trendPlots.emptyFn,TrendPlot=function(a){var b,c=this,d=trendPlots.log,e=$(a.target),f=function(a){var d=c.initialConfig;d.data=a,b.destroy(),c.drawChart(d)},g=function(a){a.data&&f(a.data),d(a)},h=function(){void 0!==b.container&&b.destroy()};return c.getParsedData=function(a,b){var c,d,e,f,g=b.data,h=-99999999,i=-1,j=g||a.data||[],k=a.x,l=a.y,m=a.xValueFormatter,n=j.length,o=[],p=function(c){var d="#ff2222",e={column:{color:d},line:{marker:{fillColor:d}}};return c=$.extend(c,e[b.type||a.type])};for(c=0;c<n;c++)f=j[c],d=f[k],m&&(d=m(d)),e=f[l],e>h&&(h=e,i=c),void 0!==d?o.push({rawX:f[a.rawX],enumText:f[a.enumText],x:d,y:e}):o.push(e);return a.highlightMax&&(o[i]=p(o[i])),o},c.parseConfig=function(a){var b,d,f=(a.yAxisTitle||"",a.xAxisReversed||!1,a.legend||!1,a.type||"line"),g=(a.width||600,a.tooltip||null),h={chart:{renderTo:e[0],alignTicks:!1},xAxis:{type:"datetime",dateTimeLabelFormats:{hour:"%I:%M %p"}},legend:{enabled:!1},series:[]},i=0,j={},k={legend:"legend.enabled",yAxisTitle:"yAxis.title.text",width:"chart.width",height:"chart.height",type:"chart.type",title:"title.text",xLabelFormat:"xAxis.dateTimeLabelFormats",minY:"yAxis.min",maxY:"yAxis.max",animation:"plotOptions.series.animation"},l=((trendPlots.typeConfigs[f]||{}).cfg||trendPlots.emptyFn)(a);return void 0===a.title&&(a.title=" "),void 0!==a.chart&&(h.chart=$.extend(!0,{},h.chart,a.chart)),!a.units&&a.yAxisTitle&&(a.units=a.yAxisTitle),a.hideLegendXLabel?h.tooltip=g?g:{formatter:function(){var a="",b=this;return $.each(this.points,function(c){a+='<span style="color:'+this.point.color+'">●</span> '+this.series.name+": <b>"+trendPlots.numberWithCommas(this.y)+" "+(this.series.userOptions.units||"")+"</b>",c<b.points.length-1&&(a+="<br/>")}),a}}:h.tooltip=g?g:void 0,h=trendPlots.complicateObject(k,a,$.extend(!0,{},l,h)),a.plotOptions&&trendPlots.createNamespace(h,"plotOptions."+f,a.plotOptions),Array.isArray(a.data)||(a.data=[a.data]),d=$.extend(!0,{},h.series[0]),h.series=[],a.sameAxis||(b=$.extend(!0,{},h.yAxis),h.yAxis=[],h.chart=$.extend(!0,h.chart,{events:{load:function(a){var b=this;trendPlots.forEachArray(b.series,function(a,b){a.yAxis.update({lineColor:a.color,labels:{style:{color:a.color}},title:{style:{color:a.color}}})})}}})),trendPlots.forEachArray(a.data,function(e){var f=c.getParsedData(a,e),k=e.type||a.type,l=$.extend(!0,{},{type:k,data:f,name:e.name,color:e.color,turboThreshold:a.turboThreshold},d);void 0!==e.yAxis?(l.yAxis=e.yAxis,j[e.yAxis]||(b.opposite=i%2===1,h.yAxis.push($.extend(!0,{},b))),j[e.yAxis]=!0):(l.yAxis=i,b.opposite=i%2===1,h.yAxis.push($.extend(!0,{},b)),i++),(e.units||a.units)&&(l=$.extend(!0,l,{tooltip:g?g:{pointFormat:'<span style="color:{point.color}">●</span> {series.name}: <b>{point.y:,.1f} '+(e.units||a.units)+"</b><br/>"},units:e.units})),h.series.push(l)}),c.currParsedConfig=h,h},c.drawChart=function(d){var e=c.parseConfig(d||a);e=$.extend(!0,{},trendPlots.defaults.highChartDefaults,e),c.lastConfig=$.extend(!0,{},e),b=new Highcharts.Chart(e)},trendPlots.onReady(function(){c.drawChart()}),c.initialConfig=$.extend(!0,{},a),{updateData:f,updateConfig:g,_getInstance:function(){return b},destroy:h,_trendSelf:c}};trendPlots.init();
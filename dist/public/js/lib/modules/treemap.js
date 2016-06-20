!function(a){var b=a.seriesTypes,c=a.merge,d=a.extend,e=a.extendClass,f=a.getOptions().plotOptions,g=function(){},h=a.each,i=HighchartsAdapter.grep,j=a.pick,k=a.Series,l=a.Color;f.treemap=c(f.scatter,{showInLegend:!1,marker:!1,borderColor:"#E0E0E0",borderWidth:1,dataLabels:{enabled:!0,defer:!1,verticalAlign:"middle",formatter:function(){return this.point.name||this.point.id},inside:!0},tooltip:{headerFormat:"",pointFormat:"<b>{point.name}</b>: {point.node.val}</b><br/>"},layoutAlgorithm:"sliceAndDice",layoutStartingDirection:"vertical",alternateStartingDirection:!1,levelIsConstant:!0,states:{hover:{borderColor:"#A0A0A0",brightness:b.heatmap?0:.1,shadow:!1}},drillUpButton:{position:{align:"left",x:10,y:-50}}}),b.treemap=e(b.scatter,c({pointAttrToOptions:{stroke:"borderColor","stroke-width":"borderWidth",fill:"color",dashstyle:"borderDashStyle"},pointArrayMap:["value"],axisTypes:b.heatmap?["xAxis","yAxis","colorAxis"]:["xAxis","yAxis"],optionalAxis:"colorAxis",getSymbol:g,parallelArrays:["x","y","value","colorValue"],colorKey:"colorValue",translateColors:b.heatmap&&b.heatmap.prototype.translateColors},{type:"treemap",trackerGroups:["group","dataLabelsGroup"],pointClass:e(a.Point,{setState:function(b,c){a.Point.prototype.setState.call(this,b,c),"hover"===b?this.dataLabel&&this.dataLabel.attr({zIndex:1002}):this.dataLabel&&this.dataLabel.attr({zIndex:this.pointAttr[""].zIndex+1})},setVisible:b.pie.prototype.pointClass.prototype.setVisible}),handleLayout:function(){var a,b=this.tree;this.points.length&&(this.rootNode=j(this.rootNode,""),b=this.tree=this.getTree(),this.levelMap=this.getLevels(),a=this.getSeriesArea(b.val),this.calculateChildrenAreas(b,a),this.setPointValues())},getTree:function(){var a,b=[],c=[],d=function(a){h(b[a],function(a){b[""].push(a)})};this.nodeMap=[],h(this.points,function(a,d){var e="";c.push(a.id),void 0!==a.parent&&(e=a.parent),void 0===b[e]&&(b[e]=[]),b[e].push(d)});for(a in b)b.hasOwnProperty(a)&&""!==a&&HighchartsAdapter.inArray(a,c)===-1&&(d(a),delete b[a]);return a=this.buildNode("",-1,0,b,null),this.eachParents(this.nodeMap[this.rootNode],function(a){a.visible=!0}),this.eachChildren(this.nodeMap[this.rootNode],function(a){a.visible=!0}),this.setTreeValues(a),a},buildNode:function(a,b,c,d,e){var f,g=this,i=[],j=g.points[b];return h(d[a]||[],function(b){f=g.buildNode(g.points[b].id,b,c+1,d,a),i.push(f)}),b={id:a,i:b,children:i,level:c,parent:e,visible:!1},g.nodeMap[b.id]=b,j&&(j.node=b),b},setTreeValues:function(a){var b,c=this,e=0,f=[],g=c.points[a.i];return h(a.children,function(a){a=c.setTreeValues(a),c.insertElementSorted(f,a,function(a,b){return a.val>b.val}),a.ignore?c.eachChildren(a,function(a){d(a,{ignore:!0,isLeaf:!1,visible:!1})}):e+=a.val}),b=j(g&&g.value,e),d(a,{children:f,childrenTotal:e,ignore:!(j(g&&g.visible,!0)&&b>0),isLeaf:a.visible&&!e,name:j(g&&g.name,""),val:b}),a},eachChildren:function(a,b){var c=this,d=a.children;b(a),d.length&&h(d,function(a){c.eachChildren(a,b)})},eachParents:function(a,b){var c=this.nodeMap[a.parent];b(a),c&&this.eachParents(c,b)},calculateChildrenAreas:function(a,b){var d,e=this,f=e.options,g=f.levelIsConstant?a.level:a.level-this.nodeMap[this.rootNode].level,k=this.levelMap[g+1],l=j(e[k&&k.layoutAlgorithm]&&k.layoutAlgorithm,f.layoutAlgorithm),m=f.alternateStartingDirection,n=[],f=i(a.children,function(a){return!a.ignore});k&&k.layoutStartingDirection&&(b.direction="vertical"===k.layoutStartingDirection?0:1),n=e[l](b,f),h(f,function(a,f){d=e.points[a.i],d.level=g+1,a.values=c(n[f],{val:a.childrenTotal,direction:m?1-b.direction:b.direction}),a.children.length&&e.calculateChildrenAreas(a,a.values)})},setPointValues:function(){var a=this,b=a.xAxis,c=a.yAxis;a.nodeMap[""].values={x:0,y:0,width:100,height:100},h(a.points,function(d){var e,f,g,h=d.node.values;h?(h.x/=a.axisRatio,h.width/=a.axisRatio,e=Math.round(b.translate(h.x,0,0,0,1)),f=Math.round(b.translate(h.x+h.width,0,0,0,1)),g=Math.round(c.translate(h.y,0,0,0,1)),h=Math.round(c.translate(h.y+h.height,0,0,0,1)),d.shapeType="rect",d.shapeArgs={x:Math.min(e,f),y:Math.min(g,h),width:Math.abs(f-e),height:Math.abs(h-g)},d.plotX=d.shapeArgs.x+d.shapeArgs.width/2,d.plotY=d.shapeArgs.y+d.shapeArgs.height/2):(delete d.plotX,delete d.plotY)})},getSeriesArea:function(a){var b="vertical"===this.options.layoutStartingDirection?0:1,a={x:0,y:0,width:100*(this.axisRatio=this.xAxis.len/this.yAxis.len),height:100,direction:b,val:a};return this.nodeMap[""].values=a},getLevels:function(){var a=[],b=this.options.levels;return b&&h(b,function(b){void 0!==b.level&&(a[b.level]=b)}),a},setColorRecursive:function(a,b){var c,d,e=this;a&&(c=e.points[a.i],d=e.levelMap[a.level],b=j(c&&c.options.color,d&&d.color,b),c&&(c.color=b),a.children.length&&h(a.children,function(a){e.setColorRecursive(a,b)}))},alg_func_group:function(a,b,c,d){this.height=a,this.width=b,this.plot=d,this.startDirection=this.direction=c,this.lH=this.nH=this.lW=this.nW=this.total=0,this.elArr=[],this.lP={total:0,lH:0,nH:0,lW:0,nW:0,nR:0,lR:0,aspectRatio:function(a,b){return Math.max(a/b,b/a)}},this.addElement=function(a){this.lP.total=this.elArr[this.elArr.length-1],this.total+=a,0===this.direction?(this.lW=this.nW,this.lP.lH=this.lP.total/this.lW,this.lP.lR=this.lP.aspectRatio(this.lW,this.lP.lH),this.nW=this.total/this.height,this.lP.nH=this.lP.total/this.nW,this.lP.nR=this.lP.aspectRatio(this.nW,this.lP.nH)):(this.lH=this.nH,this.lP.lW=this.lP.total/this.lH,this.lP.lR=this.lP.aspectRatio(this.lP.lW,this.lH),this.nH=this.total/this.width,this.lP.nW=this.lP.total/this.nH,this.lP.nR=this.lP.aspectRatio(this.lP.nW,this.nH)),this.elArr.push(a)},this.reset=function(){this.lW=this.nW=0,this.elArr=[],this.total=0}},alg_func_calcPoints:function(a,b,c,d){var e,f,g,i,j,k=c.lW,l=c.lH,m=c.plot,n=0,o=c.elArr.length-1;b?(k=c.nW,l=c.nH):j=c.elArr[c.elArr.length-1],h(c.elArr,function(a){(b||n<o)&&(0===c.direction?(e=m.x,f=m.y,g=k,i=a/g):(e=m.x,f=m.y,i=l,g=a/i),d.push({x:e,y:f,width:g,height:i}),0===c.direction?m.y+=i:m.x+=g),n+=1}),c.reset(),0===c.direction?c.width-=k:c.height-=l,m.y=m.parent.y+(m.parent.height-c.height),m.x=m.parent.x+(m.parent.width-c.width),a&&(c.direction=1-c.direction),b||c.addElement(j)},alg_func_lowAspectRatio:function(a,b,c){var d,e=[],f=this,g={x:b.x,y:b.y,parent:b},i=0,j=c.length-1,k=new this.alg_func_group(b.height,b.width,b.direction,g);return h(c,function(c){d=b.width*b.height*(c.val/b.val),k.addElement(d),k.lP.nR>k.lP.lR&&f.alg_func_calcPoints(a,!1,k,e,g),i===j&&f.alg_func_calcPoints(a,!0,k,e,g),i+=1}),e},alg_func_fill:function(a,b,c){var d,e,f,g,i,j=[],k=b.direction,l=b.x,m=b.y,n=b.width,o=b.height;return h(c,function(c){d=b.width*b.height*(c.val/b.val),e=l,f=m,0===k?(i=o,g=d/i,n-=g,l+=g):(g=n,i=d/g,o-=i,m+=i),j.push({x:e,y:f,width:g,height:i}),a&&(k=1-k)}),j},strip:function(a,b){return this.alg_func_lowAspectRatio(!1,a,b)},squarified:function(a,b){return this.alg_func_lowAspectRatio(!0,a,b)},sliceAndDice:function(a,b){return this.alg_func_fill(!0,a,b)},stripes:function(a,b){return this.alg_func_fill(!1,a,b)},translate:function(){k.prototype.translate.call(this),this.handleLayout(),this.colorAxis?this.translateColors():this.options.colorByPoint||this.setColorRecursive(this.tree,void 0)},drawDataLabels:function(){var a,b,d=this,e=d.dataLabelsGroup;h(d.points,function(e){b=d.levelMap[e.level],a={style:{}},e.node.isLeaf||(a.enabled=!1),b&&b.dataLabels&&(a=c(a,b.dataLabels),d._hasPointLabels=!0),e.shapeArgs&&(a.style.width=e.shapeArgs.width),e.dlOptions=c(a,e.options.dataLabels)}),this.dataLabelsGroup=this.group,k.prototype.drawDataLabels.call(this),this.dataLabelsGroup=e},alignDataLabel:b.column.prototype.alignDataLabel,drawPoints:function(){var d,e,f,g=this,i=g.points,k=g.options;h(i,function(b){f=g.levelMap[b.level],d={stroke:k.borderColor,"stroke-width":k.borderWidth,dashstyle:k.borderDashStyle,r:0,fill:j(b.color,g.color)},f&&(d.stroke=f.borderColor||d.stroke,d["stroke-width"]=f.borderWidth||d["stroke-width"],d.dashstyle=f.borderDashStyle||d.dashstyle),d.stroke=b.borderColor||d.stroke,d["stroke-width"]=b.borderWidth||d["stroke-width"],d.dashstyle=b.borderDashStyle||d.dashstyle,d.zIndex=1e3-2*b.level,b.pointAttr=c(b.pointAttr),e=b.pointAttr.hover,e.zIndex=1001,e.fill=l(d.fill).brighten(k.states.hover.brightness).get(),b.node.isLeaf||(j(k.interactByLeaf,!k.allowDrillToNode)?(d.fill="none",delete e.fill):(d.fill=l(d.fill).setOpacity(.15).get(),e.fill=l(e.fill).setOpacity(.75).get())),b.node.level<=g.nodeMap[g.rootNode].level&&(d.fill="none",d.zIndex=0,delete e.fill),b.pointAttr[""]=a.extend(b.pointAttr[""],d),b.dataLabel&&b.dataLabel.attr({zIndex:b.pointAttr[""].zIndex+1})}),b.column.prototype.drawPoints.call(this),h(i,function(a){a.graphic&&a.graphic.attr(a.pointAttr[""])}),k.allowDrillToNode&&g.drillTo()},insertElementSorted:function(a,b,c){var d=0,e=!1;0!==a.length&&h(a,function(f){c(b,f)&&!e&&(a.splice(d,0,b),e=!0),d+=1}),e||a.push(b)},drillTo:function(){var b=this;h(b.points,function(c){var d,e;a.removeEvent(c,"click.drillTo"),c.graphic&&c.graphic.css({cursor:"default"}),(d=b.options.interactByLeaf?b.drillToByLeaf(c):b.drillToByGroup(c))&&(e=b.nodeMap[b.rootNode].name||b.rootNode,c.graphic&&c.graphic.css({cursor:"pointer"}),a.addEvent(c,"click.drillTo",function(){c.setState(""),b.drillToNode(d),b.showDrillUpButton(e)}))})},drillToByGroup:function(a){var b=!1;return a.node.level-this.nodeMap[this.rootNode].level!==1||a.node.isLeaf||(b=a.id),b},drillToByLeaf:function(a){var b=!1;if(a.node.parent!==this.rootNode&&a.node.isLeaf)for(a=a.node;!b;)a=this.nodeMap[a.parent],a.parent===this.rootNode&&(b=a.id);return b},drillUp:function(){var a=null;this.rootNode&&(a=this.nodeMap[this.rootNode],a=null!==a.parent?this.nodeMap[a.parent]:this.nodeMap[""]),null!==a&&(this.drillToNode(a.id),""===a.id?this.drillUpButton=this.drillUpButton.destroy():(a=this.nodeMap[a.parent],this.showDrillUpButton(a.name||a.id)))},drillToNode:function(a){var b=this.nodeMap[a].values;this.rootNode=a,this.xAxis.setExtremes(b.x,b.x+b.width,!1),this.yAxis.setExtremes(b.y,b.y+b.height,!1),this.isDirty=!0,this.chart.redraw()},showDrillUpButton:function(a){var b,c,d=this,a=a||"< Back",e=d.options.drillUpButton;e.text&&(a=e.text),this.drillUpButton?this.drillUpButton.attr({text:a}).align():(c=(b=e.theme)&&b.states,this.drillUpButton=this.chart.renderer.button(a,null,null,function(){d.drillUp()},b,c&&c.hover,c&&c.select).attr({align:e.position.align,zIndex:9}).add().align(e.position,!1,e.relativeTo||"plotBox"))},buildKDTree:g,drawLegendSymbol:a.LegendSymbolMixin.drawRectangle,getExtremes:function(){k.prototype.getExtremes.call(this,this.colorValueData),this.valueMin=this.dataMin,this.valueMax=this.dataMax,k.prototype.getExtremes.call(this)},getExtremesFromAll:!0,bindAxes:function(){var b={endOnTick:!1,gridLineWidth:0,lineWidth:0,min:0,dataMin:0,minPadding:0,max:100,dataMax:100,maxPadding:0,startOnTick:!1,title:null,tickPositions:[]};k.prototype.bindAxes.call(this),a.extend(this.yAxis.options,b),a.extend(this.xAxis.options,b)}}))}(Highcharts);
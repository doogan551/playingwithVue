!function(a){if("function"==typeof bootstrap)bootstrap("pf",a);else if("object"==typeof exports)module.exports=a();else if("function"==typeof define&&define.amd)define(a);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makePF=a}else"undefined"!=typeof window?window.PF=a():global.PF=a()}(function(){return function(a,b,c){function d(c,f){if(!b[c]){if(!a[c]){var g="function"==typeof require&&require;if(!f&&g)return g(c,!0);if(e)return e(c,!0);throw new Error("Cannot find module '"+c+"'")}var h=b[c]={exports:{}};a[c][0].call(h.exports,function(b){var e=a[c][1][b];return d(e?e:b)},h,h.exports)}return b[c].exports}for(var e="function"==typeof require&&require,f=0;f<c.length;f++)d(c[f]);return d}({1:[function(a,b,c){b.exports=a("./lib/heap")},{"./lib/heap":2}],2:[function(a,b,c){(function(){var a,c,d,e,f,g,h,i,j,k,l,m,n,o,p;d=Math.floor,k=Math.min,c=function(a,b){return a<b?-1:a>b?1:0},j=function(a,b,e,f,g){var h;if(null==e&&(e=0),null==g&&(g=c),e<0)throw new Error("lo must be non-negative");for(null==f&&(f=a.length);e<f;)h=d((e+f)/2),g(b,a[h])<0?f=h:e=h+1;return[].splice.apply(a,[e,e-e].concat(b)),b},g=function(a,b,d){return null==d&&(d=c),a.push(b),o(a,0,a.length-1,d)},f=function(a,b){var d,e;return null==b&&(b=c),d=a.pop(),a.length?(e=a[0],a[0]=d,p(a,0,b)):e=d,e},i=function(a,b,d){var e;return null==d&&(d=c),e=a[0],a[0]=b,p(a,0,d),e},h=function(a,b,d){var e;return null==d&&(d=c),a.length&&d(a[0],b)<0&&(e=[a[0],b],b=e[0],a[0]=e[1],p(a,0,d)),b},e=function(a,b){var e,f,g,h,i,j;for(null==b&&(b=c),h=function(){j=[];for(var b=0,c=d(a.length/2);0<=c?b<c:b>c;0<=c?b++:b--)j.push(b);return j}.apply(this).reverse(),i=[],f=0,g=h.length;f<g;f++)e=h[f],i.push(p(a,e,b));return i},n=function(a,b,d){var e;if(null==d&&(d=c),e=a.indexOf(b),e!==-1)return o(a,0,e,d),p(a,e,d)},l=function(a,b,d){var f,g,i,j,k;if(null==d&&(d=c),g=a.slice(0,b),!g.length)return g;for(e(g,d),k=a.slice(b),i=0,j=k.length;i<j;i++)f=k[i],h(g,f,d);return g.sort(d).reverse()},m=function(a,b,d){var g,h,i,l,m,n,o,p,q,r;if(null==d&&(d=c),10*b<=a.length){if(l=a.slice(0,b).sort(d),!l.length)return l;for(i=l[l.length-1],p=a.slice(b),m=0,o=p.length;m<o;m++)g=p[m],d(g,i)<0&&(j(l,g,0,null,d),l.pop(),i=l[l.length-1]);return l}for(e(a,d),r=[],h=n=0,q=k(b,a.length);0<=q?n<q:n>q;h=0<=q?++n:--n)r.push(f(a,d));return r},o=function(a,b,d,e){var f,g,h;for(null==e&&(e=c),f=a[d];d>b&&(h=d-1>>1,g=a[h],e(f,g)<0);)a[d]=g,d=h;return a[d]=f},p=function(a,b,d){var e,f,g,h,i;for(null==d&&(d=c),f=a.length,i=b,g=a[b],e=2*b+1;e<f;)h=e+1,h<f&&!(d(a[e],a[h])<0)&&(e=h),a[b]=a[e],b=e,e=2*b+1;return a[b]=g,o(a,i,b,d)},a=function(){function a(a){this.cmp=null!=a?a:c,this.nodes=[]}return a.push=g,a.pop=f,a.replace=i,a.pushpop=h,a.heapify=e,a.nlargest=l,a.nsmallest=m,a.prototype.push=function(a){return g(this.nodes,a,this.cmp)},a.prototype.pop=function(){return f(this.nodes,this.cmp)},a.prototype.peek=function(){return this.nodes[0]},a.prototype.contains=function(a){return this.nodes.indexOf(a)!==-1},a.prototype.replace=function(a){return i(this.nodes,a,this.cmp)},a.prototype.pushpop=function(a){return h(this.nodes,a,this.cmp)},a.prototype.heapify=function(){return e(this.nodes,this.cmp)},a.prototype.updateItem=function(a){return n(this.nodes,a,this.cmp)},a.prototype.clear=function(){return this.nodes=[]},a.prototype.empty=function(){return 0===this.nodes.length},a.prototype.size=function(){return this.nodes.length},a.prototype.clone=function(){var b;return b=new a,b.nodes=this.nodes.slice(0),b},a.prototype.toArray=function(){return this.nodes.slice(0)},a.prototype.insert=a.prototype.push,a.prototype.remove=a.prototype.pop,a.prototype.top=a.prototype.peek,a.prototype.front=a.prototype.peek,a.prototype.has=a.prototype.contains,a.prototype.copy=a.prototype.clone,a}(),("undefined"!=typeof b&&null!==b?b.exports:void 0)?b.exports=a:window.Heap=a}).call(this)},{}],3:[function(a,b,c){b.exports={Heap:a("heap"),Node:a("./core/Node"),Grid:a("./core/Grid"),Util:a("./core/Util"),Heuristic:a("./core/Heuristic"),AStarFinder:a("./finders/AStarFinder"),BestFirstFinder:a("./finders/BestFirstFinder"),BreadthFirstFinder:a("./finders/BreadthFirstFinder"),DijkstraFinder:a("./finders/DijkstraFinder"),BiAStarFinder:a("./finders/BiAStarFinder"),BiBestFirstFinder:a("./finders/BiBestFirstFinder"),BiBreadthFirstFinder:a("./finders/BiBreadthFirstFinder"),BiDijkstraFinder:a("./finders/BiDijkstraFinder"),JumpPointFinder:a("./finders/JumpPointFinder"),IDAStarFinder:a("./finders/IDAStarFinder")}},{"./core/Grid":4,"./core/Heuristic":5,"./core/Node":6,"./core/Util":7,"./finders/AStarFinder":8,"./finders/BestFirstFinder":9,"./finders/BiAStarFinder":10,"./finders/BiBestFirstFinder":11,"./finders/BiBreadthFirstFinder":12,"./finders/BiDijkstraFinder":13,"./finders/BreadthFirstFinder":14,"./finders/DijkstraFinder":15,"./finders/IDAStarFinder":16,"./finders/JumpPointFinder":17,heap:1}],4:[function(a,b,c){function d(a,b,c){this.width=a,this.height=b,this.nodes=this._buildNodes(a,b,c)}var e=a("./Node");d.prototype._buildNodes=function(a,b,c){var d,f,g=new Array(b);for(d=0;d<b;++d)for(g[d]=new Array(a),f=0;f<a;++f)g[d][f]=new e(f,d);if(void 0===c)return g;if(c.length!==b||c[0].length!==a)throw new Error("Matrix size does not fit");for(d=0;d<b;++d)for(f=0;f<a;++f)c[d][f]&&(g[d][f].walkable=!1);return g},d.prototype.getNodeAt=function(a,b){return this.nodes[b][a]},d.prototype.isWalkableAt=function(a,b){return this.isInside(a,b)&&this.nodes[b][a].walkable},d.prototype.isInside=function(a,b){return a>=0&&a<this.width&&b>=0&&b<this.height},d.prototype.setWalkableAt=function(a,b,c){this.nodes[b][a].walkable=c},d.prototype.getNeighbors=function(a,b,c){var d=a.x,e=a.y,f=[],g=!1,h=!1,i=!1,j=!1,k=!1,l=!1,m=!1,n=!1,o=this.nodes;return this.isWalkableAt(d,e-1)&&(f.push(o[e-1][d]),g=!0),this.isWalkableAt(d+1,e)&&(f.push(o[e][d+1]),i=!0),this.isWalkableAt(d,e+1)&&(f.push(o[e+1][d]),k=!0),this.isWalkableAt(d-1,e)&&(f.push(o[e][d-1]),m=!0),b?(c?(h=m&&g,j=g&&i,l=i&&k,n=k&&m):(h=m||g,j=g||i,l=i||k,n=k||m),h&&this.isWalkableAt(d-1,e-1)&&f.push(o[e-1][d-1]),j&&this.isWalkableAt(d+1,e-1)&&f.push(o[e-1][d+1]),l&&this.isWalkableAt(d+1,e+1)&&f.push(o[e+1][d+1]),n&&this.isWalkableAt(d-1,e+1)&&f.push(o[e+1][d-1]),f):f},d.prototype.clone=function(){var a,b,c=this.width,f=this.height,g=this.nodes,h=new d(c,f),i=new Array(f);for(a=0;a<f;++a)for(i[a]=new Array(c),b=0;b<c;++b)i[a][b]=new e(b,a,g[a][b].walkable);return h.nodes=i,h},b.exports=d},{"./Node":6}],5:[function(a,b,c){b.exports={manhattan:function(a,b){return a+b},euclidean:function(a,b){return Math.sqrt(a*a+b*b)},chebyshev:function(a,b){return Math.max(a,b)}}},{}],6:[function(a,b,c){function d(a,b,c){this.x=a,this.y=b,this.walkable=void 0===c||c}b.exports=d},{}],7:[function(a,b,c){function d(a){for(var b=[[a.x,a.y]];a.parent;)a=a.parent,b.push([a.x,a.y]);return b.reverse()}function e(a,b){var c=d(a),e=d(b);return c.concat(e.reverse())}function f(a){var b,c,d,e,f,g=0;for(b=1;b<a.length;++b)c=a[b-1],d=a[b],e=c[0]-d[0],f=c[1]-d[1],g+=Math.sqrt(e*e+f*f);return g}function g(a,b,c,d){var e,f,g,h,i,j,k=Math.abs,l=[];for(g=k(c-a),h=k(d-b),e=a<c?1:-1,f=b<d?1:-1,i=g-h;;){if(l.push([a,b]),a===c&&b===d)break;j=2*i,j>-h&&(i-=h,a+=e),j<g&&(i+=g,b+=f)}return l}function h(a){var b,c,d,e,f,h,i=[],j=a.length;if(j<2)return i;for(f=0;f<j-1;++f)for(b=a[f],c=a[f+1],d=g(b[0],b[1],c[0],c[1]),e=d.length,h=0;h<e-1;++h)i.push(d[h]);return i.push(a[j-1]),i}function i(a,b){var c,d,e,f,h,i,j,k,l,m,n,o,p,q=b.length,r=b[0][0],s=b[0][1],t=b[q-1][0],u=b[q-1][1];for(c=r,d=s,h=b[1][0],i=b[1][1],j=[[c,d]],k=2;k<q;++k){for(m=b[k],e=m[0],f=m[1],n=g(c,d,e,f),p=!1,l=1;l<n.length;++l)if(o=n[l],!a.isWalkableAt(o[0],o[1])){p=!0,j.push([h,i]),c=h,d=i;break}p||(h=e,i=f)}return j.push([t,u]),j}function j(a){if(a.length<3)return a;var b,c,d,e,f,g,h=[],i=a[0][0],j=a[0][1],k=a[1][0],l=a[1][1],m=k-i,n=l-j;for(f=Math.sqrt(m*m+n*n),m/=f,n/=f,h.push([i,j]),g=2;g<a.length;g++)b=k,c=l,d=m,e=n,k=a[g][0],l=a[g][1],m=k-b,n=l-c,f=Math.sqrt(m*m+n*n),m/=f,n/=f,m===d&&n===e||h.push([b,c]);return h.push([k,l]),h}c.backtrace=d,c.biBacktrace=e,c.pathLength=f,c.interpolate=g,c.expandPath=h,c.smoothenPath=i,c.compressPath=j},{}],8:[function(a,b,c){function d(a){a=a||{},this.allowDiagonal=a.allowDiagonal,this.dontCrossCorners=a.dontCrossCorners,this.heuristic=a.heuristic||g.manhattan,this.weight=a.weight||1}var e=a("heap"),f=a("../core/Util"),g=a("../core/Heuristic");d.prototype.findPath=function(a,b,c,d,g){var h,i,j,k,l,m,n,o,p=new e(function(a,b){return a.f-b.f}),q=g.getNodeAt(a,b),r=g.getNodeAt(c,d),s=this.heuristic,t=this.allowDiagonal,u=this.dontCrossCorners,v=this.weight,w=Math.abs,x=Math.SQRT2;for(q.g=0,q.f=0,p.push(q),q.opened=!0;!p.empty();){if(h=p.pop(),h.closed=!0,h===r)return f.backtrace(r);for(i=g.getNeighbors(h,t,u),k=0,l=i.length;k<l;++k)j=i[k],j.closed||(m=j.x,n=j.y,o=h.g+(m-h.x===0||n-h.y===0?1:x),(!j.opened||o<j.g)&&(j.g=o,j.h=j.h||v*s(w(m-c),w(n-d)),j.f=j.g+j.h,j.parent=h,j.opened?p.updateItem(j):(p.push(j),j.opened=!0)))}return[]},b.exports=d},{"../core/Heuristic":5,"../core/Util":7,heap:1}],9:[function(a,b,c){function d(a){e.call(this,a);var b=this.heuristic;this.heuristic=function(a,c){return 1e6*b(a,c)}}var e=a("./AStarFinder");d.prototype=new e,d.prototype.constructor=d,b.exports=d},{"./AStarFinder":8}],10:[function(a,b,c){function d(a){a=a||{},this.allowDiagonal=a.allowDiagonal,this.dontCrossCorners=a.dontCrossCorners,this.heuristic=a.heuristic||g.manhattan,this.weight=a.weight||1}var e=a("heap"),f=a("../core/Util"),g=a("../core/Heuristic");d.prototype.findPath=function(a,b,c,d,g){var h,i,j,k,l,m,n,o,p=function(a,b){return a.f-b.f},q=new e(p),r=new e(p),s=g.getNodeAt(a,b),t=g.getNodeAt(c,d),u=this.heuristic,v=this.allowDiagonal,w=this.dontCrossCorners,x=this.weight,y=Math.abs,z=Math.SQRT2,A=1,B=2;for(s.g=0,s.f=0,q.push(s),s.opened=A,t.g=0,t.f=0,r.push(t),t.opened=B;!q.empty()&&!r.empty();){for(h=q.pop(),h.closed=!0,i=g.getNeighbors(h,v,w),k=0,l=i.length;k<l;++k)if(j=i[k],!j.closed){if(j.opened===B)return f.biBacktrace(h,j);m=j.x,n=j.y,o=h.g+(m-h.x===0||n-h.y===0?1:z),(!j.opened||o<j.g)&&(j.g=o,j.h=j.h||x*u(y(m-c),y(n-d)),j.f=j.g+j.h,j.parent=h,j.opened?q.updateItem(j):(q.push(j),j.opened=A))}for(h=r.pop(),h.closed=!0,i=g.getNeighbors(h,v,w),k=0,l=i.length;k<l;++k)if(j=i[k],!j.closed){if(j.opened===A)return f.biBacktrace(j,h);m=j.x,n=j.y,o=h.g+(m-h.x===0||n-h.y===0?1:z),(!j.opened||o<j.g)&&(j.g=o,j.h=j.h||x*u(y(m-a),y(n-b)),j.f=j.g+j.h,j.parent=h,j.opened?r.updateItem(j):(r.push(j),j.opened=B))}}return[]},b.exports=d},{"../core/Heuristic":5,"../core/Util":7,heap:1}],11:[function(a,b,c){function d(a){e.call(this,a);var b=this.heuristic;this.heuristic=function(a,c){return 1e6*b(a,c)}}var e=a("./BiAStarFinder");d.prototype=new e,d.prototype.constructor=d,b.exports=d},{"./BiAStarFinder":10}],12:[function(a,b,c){function d(a){a=a||{},this.allowDiagonal=a.allowDiagonal,this.dontCrossCorners=a.dontCrossCorners}var e=a("../core/Util");d.prototype.findPath=function(a,b,c,d,f){var g,h,i,j,k,l=f.getNodeAt(a,b),m=f.getNodeAt(c,d),n=[],o=[],p=this.allowDiagonal,q=this.dontCrossCorners,r=0,s=1;for(n.push(l),l.opened=!0,l.by=r,o.push(m),m.opened=!0,m.by=s;n.length&&o.length;){for(i=n.shift(),i.closed=!0,g=f.getNeighbors(i,p,q),j=0,k=g.length;j<k;++j)if(h=g[j],!h.closed)if(h.opened){if(h.by===s)return e.biBacktrace(i,h)}else n.push(h),h.parent=i,h.opened=!0,h.by=r;for(i=o.shift(),i.closed=!0,g=f.getNeighbors(i,p,q),j=0,k=g.length;j<k;++j)if(h=g[j],!h.closed)if(h.opened){if(h.by===r)return e.biBacktrace(h,i)}else o.push(h),h.parent=i,h.opened=!0,h.by=s}return[]},b.exports=d},{"../core/Util":7}],13:[function(a,b,c){function d(a){e.call(this,a),this.heuristic=function(a,b){return 0}}var e=a("./BiAStarFinder");d.prototype=new e,d.prototype.constructor=d,b.exports=d},{"./BiAStarFinder":10}],14:[function(a,b,c){function d(a){a=a||{},this.allowDiagonal=a.allowDiagonal,this.dontCrossCorners=a.dontCrossCorners}var e=a("../core/Util");d.prototype.findPath=function(a,b,c,d,f){var g,h,i,j,k,l=[],m=this.allowDiagonal,n=this.dontCrossCorners,o=f.getNodeAt(a,b),p=f.getNodeAt(c,d);for(l.push(o),o.opened=!0;l.length;){if(i=l.shift(),i.closed=!0,i===p)return e.backtrace(p);for(g=f.getNeighbors(i,m,n),j=0,k=g.length;j<k;++j)h=g[j],h.closed||h.opened||(l.push(h),h.opened=!0,h.parent=i)}return[]},b.exports=d},{"../core/Util":7}],15:[function(a,b,c){function d(a){e.call(this,a),this.heuristic=function(a,b){return 0}}var e=a("./AStarFinder");d.prototype=new e,d.prototype.constructor=d,b.exports=d},{"./AStarFinder":8}],16:[function(a,b,c){function d(a){a=a||{},this.allowDiagonal=a.allowDiagonal,this.dontCrossCorners=a.dontCrossCorners,this.heuristic=a.heuristic||e.manhattan,this.weight=a.weight||1,this.trackRecursion=a.trackRecursion||!1,this.timeLimit=a.timeLimit||1/0}var e=(a("../core/Util"),a("../core/Heuristic")),f=a("../core/Node");d.prototype.findPath=function(a,b,c,d,e){var g,h,i,j=0,k=(new Date).getTime(),l=function(a,b){return this.heuristic(Math.abs(b.x-a.x),Math.abs(b.y-a.y))}.bind(this),m=function(a,b){return a.x===b.x||a.y===b.y?1:Math.SQRT2},n=function(a,b,c,d,g){if(j++,this.timeLimit>0&&(new Date).getTime()-k>1e3*this.timeLimit)return 1/0;var h=b+l(a,p)*this.weight;if(h>c)return h;if(a==p)return d[g]=[a.x,a.y],a;var i,o,q,r,s=e.getNeighbors(a,this.allowDiagonal,this.dontCrossCorners);for(q=0,i=1/0;r=s[q];++q){if(this.trackRecursion&&(r.retainCount=r.retainCount+1||1,r.tested!==!0&&(r.tested=!0)),o=n(r,b+m(a,r),c,d,g+1),o instanceof f)return d[g]=[a.x,a.y],o;this.trackRecursion&&0===--r.retainCount&&(r.tested=!1),o<i&&(i=o)}return i}.bind(this),o=e.getNodeAt(a,b),p=e.getNodeAt(c,d),q=l(o,p);for(g=0;!0;++g){if(h=[],i=n(o,0,q,h,0),i===1/0)return[];if(i instanceof f)return h;q=i}return[]},b.exports=d},{"../core/Heuristic":5,"../core/Node":6,"../core/Util":7}],17:[function(a,b,c){function d(a){a=a||{},this.heuristic=a.heuristic||g.manhattan,this.trackJumpRecursion=a.trackJumpRecursion||!1}var e=a("heap"),f=a("../core/Util"),g=a("../core/Heuristic");d.prototype.findPath=function(a,b,c,d,g){var h,i=this.openList=new e(function(a,b){return a.f-b.f}),j=this.startNode=g.getNodeAt(a,b),k=this.endNode=g.getNodeAt(c,d);for(this.grid=g,j.g=0,j.f=0,i.push(j),j.opened=!0;!i.empty();){if(h=i.pop(),h.closed=!0,h===k)return f.expandPath(f.backtrace(k));this._identifySuccessors(h)}return[]},d.prototype._identifySuccessors=function(a){var b,c,d,e,f,h,i,j,k,l,m=this.grid,n=this.heuristic,o=this.openList,p=this.endNode.x,q=this.endNode.y,r=a.x,s=a.y,t=Math.abs;Math.max;for(b=this._findNeighbors(a),e=0,f=b.length;e<f;++e)if(c=b[e],d=this._jump(c[0],c[1],r,s)){if(h=d[0],i=d[1],l=m.getNodeAt(h,i),l.closed)continue;j=g.euclidean(t(h-r),t(i-s)),k=a.g+j,(!l.opened||k<l.g)&&(l.g=k,l.h=l.h||n(t(h-p),t(i-q)),l.f=l.g+l.h,l.parent=a,l.opened?o.updateItem(l):(o.push(l),l.opened=!0))}},d.prototype._jump=function(a,b,c,d){var e,f,g=this.grid,h=a-c,i=b-d;if(!g.isWalkableAt(a,b))return null;if(this.trackJumpRecursion===!0&&(g.getNodeAt(a,b).tested=!0),g.getNodeAt(a,b)===this.endNode)return[a,b];if(0!==h&&0!==i){if(g.isWalkableAt(a-h,b+i)&&!g.isWalkableAt(a-h,b)||g.isWalkableAt(a+h,b-i)&&!g.isWalkableAt(a,b-i))return[a,b]}else if(0!==h){if(g.isWalkableAt(a+h,b+1)&&!g.isWalkableAt(a,b+1)||g.isWalkableAt(a+h,b-1)&&!g.isWalkableAt(a,b-1))return[a,b]}else if(g.isWalkableAt(a+1,b+i)&&!g.isWalkableAt(a+1,b)||g.isWalkableAt(a-1,b+i)&&!g.isWalkableAt(a-1,b))return[a,b];return 0!==h&&0!==i&&(e=this._jump(a+h,b,a,b),f=this._jump(a,b+i,a,b),e||f)?[a,b]:g.isWalkableAt(a+h,b)||g.isWalkableAt(a,b+i)?this._jump(a+h,b+i,a,b):null},d.prototype._findNeighbors=function(a){var b,c,d,e,f,g,h,i,j=a.parent,k=a.x,l=a.y,m=this.grid,n=[];if(j)b=j.x,c=j.y,d=(k-b)/Math.max(Math.abs(k-b),1),e=(l-c)/Math.max(Math.abs(l-c),1),0!==d&&0!==e?(m.isWalkableAt(k,l+e)&&n.push([k,l+e]),m.isWalkableAt(k+d,l)&&n.push([k+d,l]),(m.isWalkableAt(k,l+e)||m.isWalkableAt(k+d,l))&&n.push([k+d,l+e]),!m.isWalkableAt(k-d,l)&&m.isWalkableAt(k,l+e)&&n.push([k-d,l+e]),!m.isWalkableAt(k,l-e)&&m.isWalkableAt(k+d,l)&&n.push([k+d,l-e])):0===d?m.isWalkableAt(k,l+e)&&(m.isWalkableAt(k,l+e)&&n.push([k,l+e]),m.isWalkableAt(k+1,l)||n.push([k+1,l+e]),m.isWalkableAt(k-1,l)||n.push([k-1,l+e])):m.isWalkableAt(k+d,l)&&(m.isWalkableAt(k+d,l)&&n.push([k+d,l]),m.isWalkableAt(k,l+1)||n.push([k+d,l+1]),m.isWalkableAt(k,l-1)||n.push([k+d,l-1]));else for(f=m.getNeighbors(a,!0),h=0,i=f.length;h<i;++h)g=f[h],n.push([g.x,g.y]);return n},b.exports=d},{"../core/Heuristic":5,"../core/Util":7,heap:1}]},{},[3])(3)});
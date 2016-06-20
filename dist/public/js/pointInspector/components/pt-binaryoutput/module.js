define(["knockout","text!./view.html"],function(a,b){function c(a,b){var c=~b+1;return this.sort(function(d,e){return d[a]==e[a]?0:d[a]<e[a]?c:b})}function d(b){var d=this;this.root=b,this.point=b.point,this.data=b.point.data,this.utility=b.utility,this.apiEndpoint=b.apiEndpoint,this.isInEditMode=b.isInEditMode,this.modal={gettingData:!1,readOnOpen:!0,showModal:a.observable(!1),errorText:a.observable(""),sortOrder:a.observable(f),controlLog:a.observableArray([])},this.modal.controlLogSorted=a.computed(function(){var a=d.modal.controlLog(),b=d.modal.sortOrder(),e=[];return Array.prototype.push.apply(e,a),c.call(e,"timestamp",b)},d),this.tabTriggers={involvement:a.observable(!1),notifications:a.observable(!1),permissions:a.observable(!1)},b.tabTriggers=this.tabTriggers,d.controlLogSorted=a.computed(function(){var a=d.modal.controlLog(),b=d.modal.sortOrder(),e=[];return Array.prototype.push.apply(e,a),c.call(e,"timestamp",b)},d),b.initDOM()}var e,f=-1,g=1;return d.prototype.reset=function(a,b){var c,d=this,e=a.propertyName;switch(a.data.Value(0),e.toLowerCase()){case"run total":c="Run Total Reset Time";break;case"number of starts":c="Last Start Reset Time";break;default:return}d.root.point.data[c].Value((new Date).getTime()/1e3)},d.prototype.toggleModal=function(){this.modal.showModal(!0),this.modal.readOnOpen&&this.getControlLog()},d.prototype.getControlLog=function(){if(!this.modal.gettingData){var b=this,c=$(".btnViewControlLog"),d=c.find("i.fa"),e=$(".modal.viewControlLog"),f=e.find(".modalScene"),g=e.find(".modalWait"),h=e.find(".modalValue"),i=e.find(".modalError"),j=e.find(".btnSubmit"),k=b.modal.controlLog(),l=function(c,d){var e=a.toJS(b.data.Value.ValueOptions),f=a.utils.arrayFilter(e,function(a){return a[c]===d});return f[0]||{}},m=function(a){b.modal.showModal()?d.addClass("fa-exchange"):(b.modal.readOnOpen=!1,a?(c.addClass("btn-danger"),d.addClass("fa-warning")):(c.addClass("btn-success"),d.addClass("fa-check")))},n=function(a){var e=a.value(),g=l("value",1).name,n=l("value",0).name,o=b.utility.workspace.systemEnumObjects,p=o.controllers,q=o.controlpriorities,r=0,s=e.length;if(b.modal.gettingData=!1,f.hide(),j.prop("disabled",!1),c.removeClass("btn-warning"),d.removeClass("fa-refresh fa-spin"),a.error())return m(!0),b.modal.errorText(a.error()),void i.show();for(m(!1),k.length=0,r;r<s;r++){var t=e[r];t.timestamp>0&&(t.prettyTime=moment.unix(t.timestamp).calendar(),t.valueText=t.value?g:n,t.controllerName=p[t.controller].name,t.priorityText=q[t.priority],k.push(t))}b.modal.controlLog.valueHasMutated(),h.show()};f.hide(),g.show(),j.prop("disabled",!0),c.removeClass("btn-danger btn-success").addClass("btn-warning"),d.removeClass("fa-exchange fa-check fa-warning").addClass("fa-refresh fa-spin"),b.modal.readOnOpen=!0,b.modal.gettingData=!0,b.point.issueCommand("Control Log",{upi:b.data._id()},n)}},d.prototype.reverseSort=function(){var a=this,b=a.modal.sortOrder;e||(e=$(".viewControlLog thead th:first i")),e.removeClass("fa-chevron-up fa-chevron-down"),b()==f?(b(g),e.addClass("fa-chevron-down")):(b(f),e.addClass("fa-chevron-up"))},d.prototype.dispose=function(){this.modal.controlLogSorted.dispose()},{viewModel:d,template:b}});
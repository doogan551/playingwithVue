define(["knockout","text!./view.html"],function(a,b){function c(b){this.root=b,this.point=b.point,this.data=b.point.data,this.utility=b.utility,this.apiEndpoint=b.apiEndpoint,this.isInEditMode=b.isInEditMode,this.days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday","Holiday"],this.tabTriggers={involvement:a.observable(!1),notifications:a.observable(!1),permissions:a.observable(!1)},b.tabTriggers=this.tabTriggers,b.initDOM()}return c.prototype.dispose=function(){},{viewModel:c,template:b}});
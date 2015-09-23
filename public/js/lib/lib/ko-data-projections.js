(function ($, ko, undefined) {
	function projectData(data, tmpl, parent, root) {
		var val;
		//if i have specified null as template item, then i always want null to get
		if (tmpl === null) {
			return null;
		}

		var type = Object.prototype.toString.call(tmpl),
			directions;

		//preparse type, in case it is an array with more than 1 value, then it is not a template but a direction tupple
		if (type === '[object Array]' && tmpl.length > 1) {
			//renew type name as now, my type is on the first element ... this could be null to to declare null for every non null ...
			type = Object.prototype.toString.call(tmpl[0]);
			directions = {};
			directions.undefValue = directions.nullValue = $.extend({}, tmpl[1]);
			//if i pass specific items, then map them
			if (tmpl.length === 3) {
				directions.undefValue = $.extend({}, tmpl[2]);
			}
		}

		//if not null and not undefined, check if needes unwrap, else it will be return before it reaches cases
		if (data !== undefined && data !== null && ko.isObservable(data)) {
			data = ko.utils.unwrapObservable(data);
		}

		if (type === '[object Function]') {
			return tmpl(data, parent, root);
		}

		if (data === undefined) {
			val = directions ? directions.undefValue : ko.data.projections.defaultNullValue;
			return val === undefined ? $.extend({}, tmpl) : val;
		}

		if (data === null) {
			val = directions ? directions.nullValue : ko.data.projections.defaultNullValue;
			return val === undefined ? $.extend({}, tmpl) : val;
		}

		switch (type) {
			case '[object Null]': //this is needed because i may have entered a custom direction that makes null every value
				return null;
			case '[object Number]':
				return +data;
			case '[object String]':
				return '' + data;
			case '[object Boolean]':
				return !!data;
			case '[object Object]':
				{
					//clone data element
					var newObj = $.extend({}, tmpl);
					//traverse properties of newObj
					for (var prop in newObj) {
						if (newObj.hasOwnProperty(prop)) {
							//if it is not from prototype, then project its data
							newObj[prop] = projectData(data[prop], newObj[prop], data, root);
						}
					}

					return newObj;
				}
			case '[object Array]':
				{
					//we assume, first array element has the template for each element
					var elementTmpl = tmpl[0],
					ret = [];

					for (var i = 0, l = data.length; i < l; i++) {
						ret.push(projectData(data[i], elementTmpl, parent, root));
					}

					return ret;
				}
		}
	}

	if (ko.data === undefined) {
		ko.data = function () { };
	}

	ko.data.projections = function () { };
	ko.data.projections.defaultNullValue = null;
	ko.data.projections.defaultUndefValue = null;
	ko.data.projections.projectVM = function (viewModel, dataSheme) {
		return projectData(viewModel, dataSheme, viewModel, viewModel);
	};

})(jQuery, ko);

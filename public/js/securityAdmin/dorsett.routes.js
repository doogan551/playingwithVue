

dorsett.router = $.sammy('#appMain', function () {

	var checkAccess = function(role) {
		if (!dorsett.userInRole(role)) {
			alert('You do not have permission to access this area. Please contact your administrator.');
			dorsett.utilities.redirectToLoginPage(true);
			return false;
		}
		}, self = this;

    this.debug = true;

    //Newer browsers will use catch-all route
    //so we must force browser to perform request
    this.get('/Account/LogOff', function () {
        window.location = '/Account/LogOff';
    });
//TODO: change to dashboard
    this.get('#/', function ($context) {
        document.title = "Dashboard - Greensboro Radiology Information Portal";
	    this.redirect('#/dictionaries');
        //if (!dorsett.menuIsHidden) dorsett.hideMenu();
    });

    this.get('.*', function ($context) {
        $context.redirect('#/');
    });



	/**
	 * Default route
	 * Loads the requested route
	 * starting with the viewmodel
	 */
	this.loadRoute = function (routeName, modelName, itemId, filterQuery) {
		//console.log(window.location.hash.substring(1));
		var self = this,
			viewModel = dorsett.viewModel;

		//If we haven't loaded our view model, load it
		if (viewModel.name != routeName) {
			$.getScript('/UIAssets/viewModels/' + routeName + '.vm.js')
				.done(function() {
					//reset local var
					viewModel = dorsett.viewModel;
					viewModel.editId = itemId;
					viewModel.setCurrentModel(modelName || viewModel.models[0].id);
					viewModel.getData(function() {
						self.loadView(routeName);
					}, filterQuery);
				});
		} else {
			viewModel.editId = itemId;
			if (viewModel.getCurrentModel().id == modelName) {
				self.loadView(routeName);
			} else {
				viewModel.setCurrentModel(modelName || viewModel.getCurrentModel().id);
				viewModel.getData(function() {
					self.loadView(routeName);
				}, filterQuery);
			}
		}
	};

	/**
	 * Loads the main view for the viewmodel
	 */
	this.loadView = function (routeName) {
		var self = this,
			viewModel = dorsett.viewModel;

		ko.removeNode(dorsett.domContext.children('.window')[0]);
		infuser.get(routeName, function(template) {
			dorsett.domContext.html($(template));
			ko.applyBindings(viewModel, dorsett.domContext[0]);
			if (!dorsett.menuIsHidden) dorsett.hideMenu();
			if (!viewModel.delayInit) {//init call moved to "afterRender" event in template
				viewModel.init();
			}
		});
	};
});

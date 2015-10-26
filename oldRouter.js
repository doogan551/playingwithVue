var passport = require('passport');
var mongo = require('mongodb');

module.exports = function(app, controllers) {
	/*app.use(function (req, res, next) {
        app.locals.userIsAuthenticated = req.isAuthenticated();
        app.locals.user = req.user;
        next();
    });
*/
	var auth, db, qualityCodes;
	auth = require('./authentication');
	db = app.get('infoScanStore');

	db.collection("SystemInfo").findOne({
		Name: "Quality Codes"
	}, function(err, codes) {
		qualityCodes = codes.Entries;
	});

	app.all('*', function(req, res, next) {
		req.database = db;
		req.qualityCodes = qualityCodes;
		req.controllers = controllers;
		next();
	});
	//Home or Landing Page
	// app.get('/home', controllers.session.home);
	// app.get('/', controllers.session.home);

	//Login
	//	app.get('/login', controllers.session.login);
	//	app.post('/login', controllers.session.postLogIn);
	// app.post('/authenticate', controllers.session.postAuth);
	// app.post('/saveworkspace', auth.redirectAuthenticated, controllers.session.saveWorkspace);

	/*app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});*/
	// (never used)
	// app.post('/lost-password', controllers.session.lostPassword); 
	// (never used)
	// app.get('/reset-password', controllers.session.resetPassword);
	// (never used) 
	// app.post('/reset-password', controllers.session.postPassword); 

	// Security Admin page
	// app.get('/securityadmin', auth.redirectAuthenticated, controllers.securityAdmin.index);

	// Point Editor (deprecated)
	// app.get('/pointeditor/:id', auth.redirectAuthenticated, controllers.pointEditor.index);
	// Point Inspector
	// app.get('/pointInspector/:id', auth.redirectAuthenticated, controllers.pointInspector.index);

	// System Preferences Page
	// app.get('/syspref', auth.redirectAuthenticated, controllers.session.syspref);

	// Splash Page (deprecated)
	// app.get('/splash', auth.redirectAuthenticated, controllers.session.splash);

	// Model Types (deprecated?)
	app.get('/api/models/importpoints', controllers.modeltypes.importpoints);

	// Securtiy
	// app.post('/api/security/groups/savegroup', auth.redirectAuthenticated, controllers.security['/groups/savegroup']);
	// app.post('/api/security/groups/getusers', auth.redirectAuthenticated, controllers.security['/groups/getusers']);
	// app.post('/api/security/groups/addusers', auth.redirectAuthenticated, controllers.security['/groups/addusers']);
	// app.post('/api/security/groups/removeusers', auth.redirectAuthenticated, controllers.security['/groups/removeusers']);
	// app.post('/api/security/groups/removegroup', auth.redirectAuthenticated, controllers.security['/groups/removegroup']);
	// app.post('/api/security/groups/getallgroups', auth.redirectAuthenticated, controllers.security['/groups/getallgroups']);
	// app.post('/api/security/groups/getpoints', auth.redirectAuthenticated, controllers.security['/groups/getpoints']);
	// app.post('/api/security/users/getgroups', auth.redirectAuthenticated, controllers.security['/users/getgroups']);
	// app.post('/api/security/users/removeuser', auth.redirectAuthenticated, controllers.security['/users/removeuser']);
	// app.post('/api/security/users/getallusers', auth.redirectAuthenticated, controllers.security['/users/getallusers']);
	// app.post('/api/security/security/users/:id', auth.redirectAuthenticated, controllers.security['/users/:id']);
	// app.post('/api/security/points/addgroups', auth.redirectAuthenticated, controllers.security['/points/addgroups']);
	// app.post('/api/security/points/removegroups', auth.redirectAuthenticated, controllers.security['/points/removegroups']);
	// app.post('/api/security/points/addusers', auth.redirectAuthenticated, controllers.security['/points/addusers']);
	// app.post('/api/security/points/removeusers', auth.redirectAuthenticated, controllers.security['/points/removeusers']);
	// app.post('/api/security/users/createpassword', auth.redirectAuthenticated, controllers.security['/users/createpassword']);
	// app.post('/api/security/users/saveuser', auth.redirectAuthenticated, controllers.security['/users/saveuser']);
	// app.post('/api/security/users/editPhoto', auth.redirectAuthenticated, controllers.security['/users/editPhoto']);
	// app.post('/api/security/groups/editPhoto', auth.redirectAuthenticated, controllers.security['/groups/editPhoto']);
	// app.post('/api/security/security/users/newuser', auth.redirectAuthenticated, controllers.security['/users/newuser']);
	// app.post('/api/security/users/updateuser', auth.redirectAuthenticated, controllers.security['/users/updateuser']);
	// app.post('/api/security/groups/updategroup', auth.redirectAuthenticated, controllers.security['/groups/updategroup']);
	// app.post('/api/security/groups/newgroup', auth.redirectAuthenticated, controllers.security['/groups/newgroup']);
	// app.post('/api/security/groups/:id', auth.redirectAuthenticated, controllers.security['/groups/:id']);

	// Points
	// app.get('/api/points/test', auth.redirectAuthenticated, controllers.points.test);
	// app.post('/api/points/get/properties', auth.redirectAuthenticated, controllers.points.properties);
	// app.post('/api/points/pointtypes', auth.redirectAuthenticated, controllers.points.pointtypes);
	// app.post('/api/points/update', auth.redirectAuthenticated, controllers.points.update);
	// app.post('/api/points/searchdependencies', auth.redirectAuthenticated, controllers.points.searchdependencies);
	// app.post('/api/points/getnames', auth.redirectAuthenticated, controllers.points.getnames);
	// app.post('/api/points/getpoint', auth.redirectAuthenticated, controllers.points.getpoint);
	// app.post('/api/points/initpoint', auth.redirectAuthenticated, controllers.points.initpoint);
	// app.post('/api/points/addpoint', auth.redirectAuthenticated, controllers.points.addpoint);
	// app.post('/api/points/deletepoint', auth.redirectAuthenticated, controllers.points.deletepoint);
	// app.post('/api/points/renamepoint', auth.redirectAuthenticated, controllers.points.renamepoint);
	// app.post('/api/points/restorepoint', auth.redirectAuthenticated, controllers.points.restorepoint);
	// app.get('/api/points/globalSearch', auth.redirectAuthenticated, controllers.points.globalSearch);
	// app.get('/api/points/globalSearch/getTags', auth.redirectAuthenticated, controllers.points.getTags);
	// app.get('/api/points/deletepoint/:upi/:type', auth.redirectAuthenticated, controllers.points.deletepoint);
	// app.get('/api/points/renamepoint/:upi/:Name', auth.redirectAuthenticated, controllers.points.renamepoint);
	// app.get('/api/points/restorepoint/:upi', auth.redirectAuthenticated, controllers.points.restorepoint);
	// app.get('/api/points/searchdependencies/:upi', auth.redirectAuthenticated, controllers.points.searchdependencies);
	// app.get('/api/points/searchdependencies2/:upi', controllers.points.searchdependencies2);
	// app.get('/api/points/getpointref/small/:upi', controllers.points.getpointrefsmall);
	// app.post('/api/points/findAlarmDisplays', auth.redirectAuthenticated, controllers.points.findAlarmDisplays);
	// app.get('/api/points/:pointid', auth.redirectAuthenticated, controllers.points.pointid);
	// app.get('/api/points/globalSearch/:tags', auth.redirectAuthenticated, controllers.points.globalSearch);

	// Device Tree
	// app.get('/devicetree', controllers.devicetree.index);
	// app.get('/api/devicetree/getTree', controllers.devicetree.getTree);

	// Curve Fit
	// app.post('/api/curvefit/getRTDRange', auth.redirectAuthenticated, controllers.curveFit.getRTDRange);
	// app.post('/api/curvefit/dofit', auth.redirectAuthenticated, controllers.curveFit.dofit);

	// Calendar
	// app.post('/api/calendar/getyear', auth.redirectAuthenticated, controllers.calendar.getyear);
	// app.post('/api/calendar/getseason', auth.redirectAuthenticated, controllers.calendar.getseason);
	// app.post('/api/calendar/updateseason', auth.redirectAuthenticated, controllers.calendar.updateseason);
	// app.post('/api/calendar/newdate', auth.redirectAuthenticated, controllers.calendar.newdate);

	// System
	// app.get('/api/system/controlpriorities', auth.redirectAuthenticated, controllers.system.controlPriorities);
	// app.post('/api/system/updatecontrolpriorities', auth.redirectAuthenticated, controllers.system.updateControlPriorities);
	// app.get('/api/system/qualitycodes', auth.redirectAuthenticated, controllers.system.qualityCodes);
	// app.post('/api/system/updatequalitycodes', auth.redirectAuthenticated, controllers.system.updateQualityCodes);
	// app.get('/api/system/controllers', auth.redirectAuthenticated, controllers.system.controllers);
	// app.post('/api/system/updatecontrollers', auth.redirectAuthenticated, controllers.system.updateControllers);
	// app.get('/api/system/telemetry', auth.redirectAuthenticated, controllers.system.telemetry);
	// app.post('/api/system/updatetelemetry', auth.redirectAuthenticated, controllers.system.updateTelemetry);
	// app.get('/api/system/getStatus', auth.redirectAuthenticated, controllers.system.getStatus);
	// app.get('/api/system/getCustomColors', auth.redirectAuthenticated, controllers.system.getCustomColors);
	// app.post('/api/system/updateCustomColors', auth.redirectAuthenticated, controllers.system.updateCustomColors);
	// app.get('/api/system/getCounts/:type', auth.redirectAuthenticated, controllers.system.getCounts);
	// app.get('/api/system/weather', auth.redirectAuthenticated, controllers.system.weather);
	// app.post('/api/system/updateWeather', auth.redirectAuthenticated, controllers.system.updateWeather);

	//Point Search (deprecated?)
	// app.get('/api/points/pointtypes', controllers.pointSelector.getPointTypes);
	// app.get('/api/points/all', controllers.pointSelector.getAll);
	// app.get('/api/points/name1', controllers.pointSelector.getName1);
	// app.get('/api/points/name2/:name1', controllers.pointSelector.getName2);
	// app.get('/api/points/name3/:name1/:name2', controllers.pointSelector.getName3);
	// app.get('/api/points/name4/:name1/:name2/:name3', controllers.pointSelector.getName4);
	// app.get('/api/points/millerSearch/:name1/:name2/:name3/:name4', controllers.pointSelector.millerSearch);
	// app.get('/api/points/gridSearch/:name1/:name2/:name3/:name4', controllers.pointSelector.gridSearch);
	// app.get('/api/points/props/propertiesEnum', controllers.pointSelector.propertiesEnum);

	//Add Point types
	// app.get('/api/points/pointTypes/add', controllers.pointSelector.getAddPointTypes);
	// app.post('/api/points/pointTypes/addpointwizard1', controllers.pointSelector.addpointwizard1);
	// app.get('/api/points/pointTypes/addReport', controllers.pointSelector.addReportWizard);
	// app.post('/addPoint', controllers.pointSelector.addPoint);

	// Scripts
	// app.post('/api/scripts/updatescript', controllers.scripts.update);
	// app.post('/api/scripts/readscript', controllers.scripts.read);
	// app.post('/api/scripts/commitscript', controllers.scripts.commit);

	//Point selector/navigator replacement
	// app.get('/pointlookup', auth.redirectAuthenticated, controllers.pointLookup.lookup);
	//new
	// app.get('/pointlookup/newPoint', auth.redirectAuthenticated, controllers.pointLookup.newPoint);
	//clone
	// app.get('/pointlookup/newPoint/:id', auth.redirectAuthenticated, controllers.pointLookup.newPoint);
	//new with restricted point type
	// app.get('/pointlookup/newPoint/restrictTo/:pointType', auth.redirectAuthenticated, controllers.pointLookup.newPoint);
	// app.get('/pointlookup/security/:groupid', auth.redirectAuthenticated, controllers.pointLookup.security);
	// app.get('/pointlookup/:pointType/:property', auth.redirectAuthenticated, controllers.pointLookup.lookupRestrictByType);
	//for gpl device lookup
	// app.get('/pointlookup/:pointType/:property/:deviceId', auth.redirectAuthenticated, controllers.pointLookup.lookupRestrictByType);
	//for gpl remote unit lookup
	// app.get('/pointlookup/:pointType/:property/:deviceId/:remoteUnitId', auth.redirectAuthenticated, controllers.pointLookup.lookupRestrictByType);
	// point selector API
	// app.post('/pointlookup/browse', auth.redirectAuthenticated, controllers.pointLookup.browse);
	// app.post('/pointlookup/search', auth.redirectAuthenticated, controllers.pointLookup.search);
	// app.post('/pointlookup/toggleGroup', auth.redirectAuthenticated, controllers.pointLookup.toggleGroup);

	// Alarms
	// app.get('/alarms', auth.redirectAuthenticated, controllers.alarms.index);
	// app.get('/alarms/print', auth.redirectAuthenticated, controllers.alarms.print);

	// Activity Logs
	// app.get('/activitylogs',  auth.redirectAuthenticated,  controllers.activityLogs.index);
	// app.post('/api/activitylogs/get', auth.redirectAuthenticated, controllers.activityLogs.get);

	// Displays
	// app.get('/displays/', auth.redirectAuthenticated, controllers.displays.index);
	// app.post('/displays/getDisplayInfo/', auth.redirectAuthenticated, controllers.displays.getDisplayInfo);
	// app.get('/displays/edit/:upoint', auth.redirectAuthenticated, controllers.displays.editdisplay);
	// app.get('/displays/gifs/:fname', auth.redirectAuthenticated, controllers.displays.displaygif);
	// app.get('/displays/gifs/:fname/:frame', auth.redirectAuthenticated, controllers.displays.displaygif);
	// app.get('/displays/view/:upoint', auth.redirectAuthenticated, controllers.displays.viewdisplay);
	// app.get('/displays/preview/:upoint', auth.redirectAuthenticated, controllers.displays.previewdisplay);
	// app.get('/displays/view/:upoint/:dispId', auth.redirectAuthenticated, controllers.displays.viewdisplay);
	// app.get('/displays/upiname/:upi', auth.redirectAuthenticated, controllers.displays.getname);
	// app.post('/displays/later', auth.redirectAuthenticated, controllers.displays.saveLater);
	// app.post('/displays/publish', auth.redirectAuthenticated, controllers.displays.publish);
	// app.get('/displays/browse', auth.redirectAuthenticated, controllers.displays.browse);
	// app.get('/displays/browse2', auth.redirectAuthenticated, controllers.displays.browse2);
	// app.get('/displays/listassets', auth.redirectAuthenticated, controllers.displays.listassets);
	//app.get('/displays/import', auth.redirectAuthenticated, controllers.import.index);
	//app.get('/test', auth.redirectAuthenticated, controllers.import.start);
	//app.get('/test2', auth.redirectAuthenticated, controllers.import.test2);
	//app.post('/displays/import', auth.redirectAuthenticated, controllers.import.start);
	// app.get('/displays/trend', auth.redirectAuthenticated, controllers.displays.trend);
	// app.get('/displays/plot', auth.redirectAuthenticated, controllers.displays.plot);
	// app.get('/displays/plot64', auth.redirectAuthenticated, controllers.displays.plot64);
	//app.get('/console', auth.redirectAuthenticated, controllers.console.index);

	//GPL2
	// app.get('/gpl/view/:upoint', controllers.gpl.index);
	// app.get('/gpl/edit/:upoint', controllers.gpl.index);
	// app.get('/gpl/getReferences/:upoint', controllers.gpl.getReferences);

	// GPL
	// app.get('/gpl/viewer/:id', controllers.gpl.gplView);
	// app.get('/gpl/designer/:id', controllers.gpl.gplOld);
	//    app.post('/gpl/designer/:id', controllers.gpl.gplNew);
	//    app.get('/gpl/designer/:id/:pointname', controllers.gpl.gplNew);
	// app.post('/gpl/setsequence', controllers.gpl.setSequence);
	// app.post('/gpl/updatesequence', controllers.gpl.updateSequence);
	// app.get('/gpl/getSequenceDetails/:id', controllers.gpl.getSequenceDetails);
	// app.post('/gpl/saveSVG', controllers.gpl.saveSVG);
	// app.get('/gpl/getSVG/:id', controllers.gpl.getSVG);
	//    app.post('/gpl/getSpecificProp', controllers.gpl.getSpecificProp);
	//    app.get('/gpl/core1.js', controllers.gpl.getCoreFiles1);
	//    app.get('/gpl/core2.js', controllers.gpl.getCoreFiles2);
	//    app.get('/gpl/gpl.js', controllers.gpl.getGPLJs);
	//    app.get('/gpl/core.css', controllers.gpl.getGPLcss);
	//    app.get('/gpl/lockInfo/:id', controllers.gpl.getSequenceLockInfo);
	// app.post('/gpl/lockSequence', controllers.gpl.setLockSequence);
	// app.post('/gpl/unlockSequence', controllers.gpl.setUnLockSequence);

	//Reports
	// app.get('/reports1/getMRT/:id', auth.redirectAuthenticated, controllers.reports.getMRT);
	// app.get('/reports1/reportSearch', auth.redirectAuthenticated, controllers.reports.reportSearch);
	// app.post('/reports1/saveMRT', auth.redirectAuthenticated, controllers.reports.saveMRT);
	// app.post('/reports1/saveSVG', auth.redirectAuthenticated, controllers.reports.saveSVG);
	// app.post('/reports1/saveReport', auth.redirectAuthenticated, controllers.reports.saveReport);
	// app.get('/reports1/getSVG/:id', auth.redirectAuthenticated, controllers.reports.getSVG);
	// app.post('/reports1/reportSearch', auth.redirectAuthenticated, controllers.reports.reportSearch);
	// app.get('/reports1/getHistoryPoints', controllers.reports.getHistoryPoints);
	// app.post('/reports1/historyDataSearch', controllers.reports.historyDataSearch);
	// app.post('/reports1/historySearch', controllers.reports.historySearch);
	//Report UI
	// app.get('/report', controllers.reports.index);
	// app.get('/report/:id', controllers.reports.reportMain);
	// app.get('/report/view/:id', controllers.reports.reportMain);
	// app.get('/report/cr/pointInvolvement', controllers.reports.pointInvolvement);
	//app.get('/report/pointpivot', controllers.reports.pointpivot);

	// app.post('/api/reportTemplates/get', auth.redirectAuthenticated, controllers.reports.getTemplate);
	// app.post('/api/reportTemplates/add', auth.redirectAuthenticated, controllers.reports.addTemplate);
	// app.post('/api/reportTemplates/rename', auth.redirectAuthenticated, controllers.reports.renameTemplate);
	// app.post('/api/reportTemplates/delete', auth.redirectAuthenticated, controllers.reports.deleteTemplate);
	// app.get('/api/reportTemplates/getAll', auth.redirectAuthenticated, controllers.reports.getAllTemplates);
	// app.post('/api/reportTemplates/getSelected', auth.redirectAuthenticated, controllers.reports.getSelectedTemplates);
	// app.post('/api/reportTemplates/updateTemplate', auth.redirectAuthenticated, controllers.reports.updateTemplate);

	// ToU/meters
	app.post('/api/meters/getMeters', auth.redirectAuthenticated, controllers.history.getMeters);
	app.get('/api/meters/backup', auth.redirectAuthenticated, controllers.history.backup);
	app.post('/api/meters/getUsage', auth.redirectAuthenticated, controllers.history.getUsage);
	app.post('/api/meters/getUsageNew', auth.redirectAuthenticated, controllers.newHistory.getUsage);
	app.post('/api/meters/getMissingMeters', auth.redirectAuthenticated, controllers.history.getMissingMeters);
	app.post('/api/meters/getBilling', auth.redirectAuthenticated, controllers.history.getBilling);
	app.post('/api/meters/editDatastore', auth.redirectAuthenticated, controllers.history.editDatastore);
	app.post('/api/meters/importCSV', auth.redirectAuthenticated, controllers.history.importCSV);
	app.post('/api/meters/exportCSV', auth.redirectAuthenticated, controllers.history.exportCSV);
	app.get('/api/meters/downloadCSV', auth.redirectAuthenticated, controllers.history.downloadCSV);
	app.post('/api/meters/uploadCSV', auth.redirectAuthenticated, controllers.history.uploadCSV);
	app.post('/api/meters/uploadBGImage', auth.redirectAuthenticated, controllers.history.uploadBGImage);

	// Device Loader
	// app.get('/api/firmwareLoader/get/:model', auth.redirectAuthenticated, controllers.firmwareLoader.get);
	// app.get('/api/firmwareLoader/getRemoteUnits', auth.redirectAuthenticated, controllers.firmwareLoader.getRemoteUnits);

	// Toolbag (admin engineering tools)
	// app.get('/toolbag', auth.redirectAuthenticated, controllers.toolBag.dbMonitor);
	// app.get('/toolbag/', auth.redirectAuthenticated, controllers.toolBag.dbMonitor);
	// app.get('/toolbag/dbTemplate', auth.redirectAuthenticated, controllers.toolBag.dbTemplate);
	// app.get('/toolbag/dbMonitor', auth.redirectAuthenticated, controllers.toolBag.dbMonitor);
	// app.get('/toolbag/propertyUsage', auth.redirectAuthenticated, controllers.toolBag.propertyUsage);
	// app.get('/toolbag/enums', auth.redirectAuthenticated, controllers.toolBag.enums);
	//	app.get ('/toolbag/checkProperties', auth.redirectAuthenticated, controllers.toolBag.checkProperties);
	//	app.get ('/toolbag/checkProperties/:pointType', auth.redirectAuthenticated, controllers.toolBag.checkPropertiesForOne);
	//	app.post('/toolbag/checkProperties', auth.redirectAuthenticated, controllers.toolBag.checkPropertiesForOne);
	//	app.post('/toolbag/changeLimit', auth.redirectAuthenticated, controllers.toolBag.changeLimit);
	// app.post('/toolbag/getPoints', auth.redirectAuthenticated, controllers.toolBag.getPoints);
	// app.post('/toolbag/generateCppHeaderFile', auth.redirectAuthenticated, controllers.toolBag.generateCppHeaderFile);
	// app.get('/toolbag/downloadCppHeaderFile', auth.redirectAuthenticated, controllers.toolBag.downloadCppHeaderFile);

	// Thumbnails
	// app.get('/thumbnail/batch', auth.redirectAuthenticated, controllers.thumbnail.batch);
	// app.get('/thumbnail/capture', auth.redirectAuthenticated, controllers.thumbnail.capture);
	// app.get('/thumbnail/:id', auth.redirectAuthenticated, controllers.thumbnail.one);
	// app.post('/thumbnail/save', auth.redirectAuthenticated, controllers.thumbnail.save);

	//slide shows
	// app.get('/slideShows/', auth.redirectAuthenticated, controllers.slideShows.index);
	// app.get('/slideShows/viewer', auth.redirectAuthenticated, controllers.slideShows.viewer);
	// app.get('/api/slideshows/get/:id', auth.redirectAuthenticated, controllers.slideShows.get);
	//Alarm Message definitions----------------------------
	app.get('/alarmMessageDefinitions', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.get);
	app.get('/alarmMessageDefinitions/module', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.getModule);
	app.get('/alarmMessageDefinitions/helperData', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.helperData.get);
	app.all('/api/alarmMessageDefinitions', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.api.all);
	app.get('/api/alarmMessageDefinitions', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.api.get);
	app.post('/api/alarmMessageDefinitions', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.api.post);
	app.put('/api/alarmMessageDefinitions', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.api.put);
	app.delete('/api/alarmMessageDefinitions/:id', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.api.delete);
	app.get('/api/alarmMessageDefinitions/:id', auth.redirectAuthenticated, controllers.alarmMessageDefinitions.api.getbyid);
	//end - Alarm Message Definitions----------------------
	//start- Trend Plots----------------------
	/*app.route('/trendPlots/index')
		.all(auth.redirectAuthenticated)
		.get(controllers.trendPlots.index.get);
	app.route('/api/trendPlots/:upi')
		.all(controllers.trendPlots.api.all)
		.get(controllers.trendPlots.api.getByUpi);*/
	// app.get('/trendPlots', auth.redirectAuthenticated, controllers.trendPlots.index);
	// app.post('/api/trendPlots/', auth.redirectAuthenticated, controllers.trendPlots.getData);
	//end- Trend Plots----------------------

  //Energy/Utility dashboard
  app.get('/dashboard', auth.redirectAuthenticated, controllers.dashboard.index);
  // app.post('/dashboard/uploadBackground', auth.redirectAuthenticated, controllers.dashboard.uploadBackground);
  // app.post('/dashboard/getutility', auth.redirectAuthenticated, controllers.dashboard.getUtility);
  // app.post('/dashboard/saveutility', auth.redirectAuthenticated, controllers.dashboard.saveUtility);
  app.post('/dashboard/removeUtility', auth.redirectAuthenticated, controllers.dashboard.removeUtility);
  app.get('/dashboard/getMarkup', auth.redirectAuthenticated, controllers.dashboard.getMarkup);

	// app.post('/api/trenddata/viewTrend', auth.redirectAuthenticated, controllers.trendData.viewTrend);
	// app.post('/api/trenddata/getTrendLimits', auth.redirectAuthenticated, controllers.trendData.getTrendLimits);


	//If page does not match any router, direct them to page not found
	app.all('*', auth.redirectAuthenticated);
	app.get('*', function(req, res) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		res.header("Access-Control-Allow-Headers", "Content-Type");
		res.render('baseui/404', {
			title: 'Page Not Found'
		});
	});
	//Temp Create User
	// never used?
	app.get('/signup', controllers.session.signUp);
	// never used?
	app.post('/signup', controllers.session.postSignUp);

	//If page does not match any router, direct them to page not found
	app.get('*', function(req, res) {
		res.render('baseui/404', {
			title: 'Page Not Found'
		});
	});
};
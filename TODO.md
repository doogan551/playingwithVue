- Make sure router has all controllers listed
- All controllers call model of same name or functionally named. Do not call Utility from controllers. Call Utility from models.
- strings surrouned by ''
- tabs/indentions = 2 spaces
- check FileLocationsForControllers fx calls
- rearrange var requires - core > npm > local
- change module.exports ={fxname:function(){}} to exports.fxname = function(){}
* name anonymous functions
- get node-inspector module
- get terminal-kit module
- review need for validator module
- helmet module for security
- formidable module for files in req
- multi-core support
- get build procedure working
- try to seperate iis and node - need autorestart functionality on crash
- iis to refresh all processes on restart automatically
- JSON Web Token for link between main app and reports
- read up on process functions
- cluster/reverse proxy - loc 6114 - ZERO DOWNTIME RESTART

-- node.js design patterns
- 'Exporting a Constructor' loc 1100
- breaking async functions out to clean up code
- when setting up a logger, use factory method - loc 3392

- teamviewer or vnc



-activitylogs - 2015/6/5
-points (added) - 2015/6/4
-security (added) - 2015/6/5
-system - 2015/6/4
-user - 2015/6/5
-usergroups - 2015/6/3
-utility - 2015/6/1

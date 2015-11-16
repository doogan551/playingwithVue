- pull out 'business logic' to own files and look to share functionality
- strings surrouned by ''
- tabs/indentions = 2 spaces
- check FileLocationsForControllers fx calls
- rearrange var requires - core > npm > local
- change module.exports ={fxname:function(){}} to exports.fxname = function(){}
* name anonymous functions
- read up on 'process#' functions
- setup config for non-app.js scripts
- web.config options
- move site specific files out of directory (display_assets, public/img)

- get node-inspector module - error during installation
- get terminal-kit module - useful for self contained scripts' ui
- review need for validator module - 
- helmet module for security
- formidable module for files in req
- compression module
_ agenda
_ agenda-ui
_ fs-extra


- nginx vs iis vs apache
- multi-core support
- get build procedure working
- try to seperate iis and node - need autorestart functionality on crash(pm2 module?)
- iis to refresh all processes on restart automatically
- JSON Web Token for link between main app and reports
- turn off logging in iis
- override console.log

-- node.js design patterns
- 'Exporting a Constructor' loc 1100
- breaking async functions out to clean up code
- when setting up a logger, use factory method - loc 3392
- cluster/reverse proxy - loc 6114 - ZERO DOWNTIME RESTART

- teamviewer or vnc
- gulp
- sinon in tests
- test models and controllers and socket

- needs work
- alarm model
- socket connections in front end
- GET /trendtest/trendTest2.js 404
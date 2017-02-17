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
- move job site specific (MSFC, ydkv, Ft Gordon, etc..) files out of directory (display_assets, public/img)
- stateless models (i.e. opendisplays and alarms in socket)

- get node-inspector module - error during installation
- get terminal-kit module - useful for self contained scripts' ui
- review need for validator module - 
- helmet module for security
- formidable module for files in req
- compression module
_ agenda - scheduled tasks
_ agenda-ui
_ fs-extra

- nginx vs iis vs apache
- multi-core support
- get build procedure working
- try to seperate iis and node - need autorestart functionality on crash(pm2 module? forever/naught)
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
- slack
- 

- needs work
- GET /trendtest/trendTest2.js 404
- setup server logs page view

letsencrypt certonly --standalone --agree-tos --domains utdev.dtscada.com --email engineering@dorsett-tech.com --config-dir D:/letsencrypt/etc --server https://acme-v01.api.letsencrypt.org/directory

sc.exe create MongoDB binPath= "\"C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe\" --service --config=\"C:\Program Files\MongoDB\Server\3.2\bin\mongod.cfg\" --replSet 'rs0'" DisplayName= "MongoDB" start= "auto"


{ 
    "_id" : ObjectId("5808dedec873fe9bb6a5b886"), 
    "runTime" : "0 12 9 * * 0-5", 
    "type" : NumberInt(1), 
    "referencePointUpi" : NumberInt(65715), 
    "optionalParameters" : {
        "duration" : "Last 7 Days", 
        "interval" : "1 Hour"
    }, 
    "users" : [
    ], 
    "emails" : [
        "rkendall@dorsett-tech.com"
    ], 
    "enabled" : true
}

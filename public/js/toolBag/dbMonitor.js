function clone(src) {
    function mixin(dest, source, copyFunc) {
        var name, s, i, empty = {};
        for(name in source){
            // the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
            // inherited from Object.prototype.  For example, if dest has a custom toString() method,
            // don't overwrite it with the toString() method that source inherited from Object.prototype
            s = source[name];
            if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
                dest[name] = copyFunc ? copyFunc(s) : s;
            }
        }
        return dest;
    }

    if(!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]"){
        // null, undefined, any non-object, or function
        return src; // anything
    }
    if(src.nodeType && "cloneNode" in src){
        // DOM Node
        return src.cloneNode(true); // Node
    }
    if(src instanceof Date){
        // Date
        return new Date(src.getTime()); // Date
    }
    if(src instanceof RegExp){
        // RegExp
        return new RegExp(src);   // RegExp
    }
    var r, i, l;
    if(src instanceof Array){
        // array
        r = [];
        for(i = 0, l = src.length; i < l; ++i){
            if(i in src){
                r.push(clone(src[i]));
            }
        }
        // we don't clone functions for performance reasons
        //      }else if(d.isFunction(src)){
        //          // function
        //          r = function(){ return src.apply(this, arguments); };
    }else{
        // generic objects
        r = src.constructor ? new src.constructor() : {};
    }
    return mixin(r, src, clone);
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

var myViewModel = (function() {
    var self      = {},
        snapshot  = [],
        timerID   = 0,
        usedQuery = '{}',
        busy      = false,
        findEntry = function (id) {
            for (var i=0; i<snapshot.length; i++) {
                if (snapshot[i]._id === id)
                    return {'entry': snapshot[i], 'index': i};
            }
            return null;
        },
        addEntry = function (data) {
            snapshot.push(clone(data));
        },
        removeEntry = function (index) {
            snapshot.splice(index, 1);
        },
        findAddedKeysAndChangedValues = function (ptName, oldObj, newObj, keyString) {
            var key,
                keyChain,
                time = new Date().toString('hh:mm:ss');

            // Check for keys changed or added to the new object
            for (key in newObj) {
                keyChain = (keyString === undefined) ? key : keyString + "." + key;

                // If the old object does not have this key
                if (oldObj.hasOwnProperty(key) === false) {
                    self.diff.unshift({'time': time, 'name': ptName, 'key': keyChain, 'report': 'Added to point'});
                }
                // If this key value is actually an object (js defines null values as objects so we must check for that)
                else if ((typeof newObj[key] === 'object') && (newObj[key] !== null)) {
                    findAddedKeysAndChangedValues(ptName, oldObj[key], newObj[key], keyChain);
                }
                // If the key values are different
                else if (oldObj[key] !== newObj[key]) {
                    var preState = ((keyChain === '_pollTime') || (keyChain === 'Last Report Time.Value')) ? new Date(parseInt(oldObj[key], 10)*1000).toString('hh:mm:ss') : oldObj[key],
                        curState = ((keyChain === '_pollTime') || (keyChain === 'Last Report Time.Value')) ? new Date(parseInt(newObj[key], 10)*1000).toString('hh:mm:ss') : newObj[key],
                        report   = 'Changed from ' + preState + ' to ' + curState;

                    self.diff.unshift({'time': time, 'name': ptName, 'key': keyChain, 'report': report});
                }
            }
        },
        findRemovedKeys = function (ptName, oldObj, newObj, keyString) {
            var key,
                keyChain,
                time = new Date().toString('hh:mm:ss');

            // Check for keys removed  object
            for (key in oldObj) {
                keyChain = (keyString === undefined) ? key : keyString + "." + key;

                // If the new object does not have this key
                if (newObj.hasOwnProperty(key) === false) {
                    self.diff.unshift({'time': time, 'name': ptName, 'key': keyChain, 'report': 'Removed from point'});
                }
                // If this key value is actually an object (js defines null values as objects so we must check for that)
                else if ((typeof oldObj[key] === 'object') && (oldObj[key] !== null)) {
                    findRemovedKeys(ptName, oldObj[key], newObj[key], keyChain);
                }
            }
        };

    self.diff            = ko.observableArray();
    self.pollTime        = ko.observable('Never');
    self.pollInterval    = ko.observable(1000);
    self.paused          = ko.observable(true);
    self.query           = ko.observable('{}');
    self.throttled_query = ko.computed(function() {
        return self.query();
    }).extend({throttle: 100});
    self.queryError      = ko.observable(false);
    self.enableLimit     = ko.observable(true).extend({throttle: 5000});
    self.queryLimit      = ko.observable(25);
    self.cpuTime         = ko.observable(0);
    self.networkTime     = ko.observable(0);

    self.clear = function () {
        self.diff([]);
    };

    self.stopCapture = function () {
        self.paused(true);
        busy = false;
        self.cpuTime(0);
        self.networkTime(0);
        self.pollTime('Paused');
        window.clearInterval(timerID);
    };

    self.startCapture = function () {
        self.paused(false);
        self.findDifference();

        timerID = window.setInterval(function(){
            self.findDifference();
        }, self.pollInterval());
    };

    self.findDifference = function () {
        var networkStartTime = new Date().getTime();

        if ((self.paused() === true) || (busy === true)) {
            return;
        }
        busy = true;

        $.ajax({
            url: '/toolbag/getPoints',
            data: JSON.stringify($.parseJSON(usedQuery)),
            dataType: 'json',
            contentType: 'application/json',
            type: 'post'
        }).done(function(data){
            var i,
                len,
                oldPt,
                cpuStartTime;

            if (self.paused() === true)
                return;

            self.networkTime(new Date().getTime() - networkStartTime + " ms");

            if (data.error === undefined) {
                self.pollTime(new Date().toString('h:mm:ss') + ':' + new Date().getMilliseconds().toString());
                cpuStartTime = new Date().getTime();

                for (i = 0; i < data.length; i++) {
                    oldPt = findEntry(data[i]._id);
                    if (oldPt === null) {
                        addEntry(data[i]);
                        continue;
                    }

                    len = self.diff().length;

                    findAddedKeysAndChangedValues(data[i].Name, oldPt.entry, data[i]);
                    findRemovedKeys(data[i].Name, oldPt.entry, data[i]);

                    if (len != self.diff().length) {
                        removeEntry(oldPt.index);
                        addEntry(data[i]);
                    }
                }
                self.cpuTime(new Date().getTime() - cpuStartTime + " ms");
            }
            else {
                alert("An error occurred. The server reported: " + data.error);
            }
            busy = false;
        }).fail(function(jqXHR, textStatus, errorThrown){
            busy = false;
            if (self.paused() === false) {
                self.networkTime(new Date().getTime() - networkStartTime);
            }

            console.log(textStatus, ": ", errorThrown);
        });
    };

    self.pollInterval.subscribe(function(value) {
        if (self.paused() === false) {
            self.stopCapture();
            self.startCapture();
        }
    });

    self.query.subscribe(function(str) {
        str = str.replace(/'/g, '"');
        self.query(str);     // Get rid of any single quote characters if present
    });

    self.throttled_query.subscribe(function(str) {
        if(isJson(str) === false)
            self.queryError(true);
        else {
            self.queryError(false);
            usedQuery = str;
        }
    });

    self.enableLimit.subscribe(function(data) {
        $.ajax({
            url: '/toolbag/changeLimit',
            data: JSON.stringify({'enableLimit': data, 'limit': self.queryLimit()}),
            contentType: 'application/json',
            dataType: 'json',
            type: 'post'
        }).done(function(data) {
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, ": ", errorThrown);
        });
    });

    self.queryLimit.subscribe(function(data) {
        console.log(data);
        $.ajax({
            url: '/toolbag/changeLimit',
            data: JSON.stringify({'enableLimit': self.enableLimit(), 'limit': data}),
            contentType: 'application/json',
            dataType: 'json',
            type: 'post'
        }).done(function(data) {
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, ": ", errorThrown);
        });
    });

    usedQuery = self.query();

    return self;
}());


$(function() {
    ko.applyBindings(myViewModel);
    // myViewModel.startCapture();

    $('#diffTable').delegate("td", "click", function() {
        if ($(this).closest("tr").hasClass('highlightedRow') === true) {
            $(this).closest("tr").removeClass('highlightedRow');
        } else {
            $('#diffTable').find('tr.highlightedRow').removeClass('highlightedRow');
            $(this).closest("tr").addClass('highlightedRow');
        }
    });
});
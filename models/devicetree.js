var async = require('async');
var _ = require('lodash');

var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

var validDeviceModels = [18, 19, 20, 13, 16, 17];
var validPortProtocols = [1, 4];
var validEthProtocols = [1];

var deviceTree = [];
var server = {};
var networkNumbers = [];
var badNumbers = [];
var deviceUpis = [];
var topLevels = [];
var unknownBranches = [];
var tree = [];
var topNode;

var newBranches = [];

var sortArray = function(a, b) {
    return a - b;
};
var compare = function(a, b) {
    if (a.networkSegment < b.networkSegment)
        return -1;
    if (a.networkSegment > b.networkSegment)
        return 1;
    return 0;
};

module.exports = {

    getTree: function(data, cb) {
        buildNodes(function(err) {
            makeTree(function(err) {
                sortTree(function(err) {
                    return cb(err, {
                        tree: deviceTree,
                        networkNumbers: networkNumbers.sort(sortArray),
                        badNumbers: badNumbers.sort(sortArray)
                    });
                });
            });
        });
    }
};

var makeTree = function(next) {
    var downlinkNetworks = [];
    var testNetworkNumber = function(networkValue, deviceBranch) {
        var status = 0;
        if (networkValue === 0) {
            return;
        }

        if (networkNumbers.indexOf(networkValue) < 0) {
            networkNumbers.push(networkValue);
            status |= 1;
        }

        if (deviceBranch.networks.indexOf(networkValue) < 0) {
            deviceBranch.networks.push(networkValue);
            status |= 2;
        }
        if (status !== 3) {
            if (badNumbers.indexOf(networkValue) < 0) {
                badNumbers.push(networkValue);
            }
        }
    };

    var buildTopLevels = function(callback) {
        Utility.get.find({
            collection: 'points',
            query: {
                'Point Type.Value': 'Device',
                'Model Type.eValue': {
                    $in: validDeviceModels
                },
                _id: {
                    $nin: deviceUpis
                }
            }
        }, function(err, devices) {
            // console.log(devices.length);
            for (var i = 0; i < devices.length; i++) {

                var deviceNetwork = devices[i]["Network Segment"].Value;
                var currentUplinkPort = devices[i]['Uplink Port'].eValue;
                var branch = {
                    upNetwork: deviceNetwork,
                    downNetworks: []
                };

                if (topLevels.indexOf(deviceNetwork) < 0) {
                    topLevels.push(deviceNetwork);
                }

                if (currentUplinkPort === 0) {
                    var portNs = [1, 2];
                    if ([18, 19, 20].indexOf(devices[i]['Model Type'].eValue) > -1) {
                        portNs = portNs.concat([3, 4]);
                    }
                    for (var n = 1; n < portNs.length; n++) {
                        var portN = 'Port ' + n + ' ';
                        if (validPortProtocols.indexOf(devices[i][portN + 'Protocol'].eValue) > -1 && devices[i][portN + 'Network'].Value !== 0 && branch.downNetworks.indexOf(devices[i][portN + 'Network'].Value) < 0) {
                            branch.downNetworks.push(devices[i][portN + 'Network'].Value);
                        }
                    }
                } else {
                    if (devices[i]['Ethernet Network'].Value !== 0 && branch.downNetworks.indexOf(devices[i]['Ethernet Network'].Value) < 0) {
                        branch.downNetworks.push(devices[i]['Ethernet Network'].Value);
                    }
                }
                unknownBranches.push(branch);
            }
            return callback();
        });
    };

    var buildTree = function(networkSegment, cb) {
        var branches = [];

        var start = new Date();
        Utility.get({
            collection: 'points',
            query: {
                'Point Type.Value': 'Device',
                'Network Segment.Value': networkSegment
            },
            fields: {
                Name: 1,
                'Model Type.eValue': 1,
                'Device Status.Value': 1,
                'Uplink Port.eValue': 1,
                'Network Segment.Value': 1,
                'Downlink Network.Value': 1,
                'Ethernet Network.Value': 1,
                'Port 1 Protocol.eValue': 1,
                'Port 1 Network.Value': 1,
                'Port 2 Protocol.eValue': 1,
                'Port 2 Network.Value': 1,
                'Port 3 Protocol.eValue': 1,
                'Port 3 Network.Value': 1,
                'Port 4 Protocol.eValue': 1,
                'Port 4 Network.Value': 1
            },
            sort: {
                "Name": 1
            }
        }, function(err, devices) {
            // console.log(networkSegment, new Date() - start);

            async.eachSeries(devices, function(device, callback1) {
                var portNs = [1, 2];
                if ([18, 19, 20].indexOf(device['Model Type'].eValue) > -1) {
                    portNs = portNs.concat([3, 4]);
                }

                var deviceBranch = {
                    upi: device._id,
                    text: device.Name,
                    status: device['Device Status'].Value,
                    protocol: device['Uplink Port'].eValue,
                    networkSegment: device['Network Segment'].Value,
                    networks: [],
                    branches: []
                };
                var currentUplinkPort = device['Uplink Port'].eValue;
                var downlinkNetwork = device['Downlink Network'].Value;

                if (currentUplinkPort === 0) {

                    testNetworkNumber(downlinkNetwork, deviceBranch);
                } else {
                    if (device['Ethernet Network'].Value !== 0) {
                        testNetworkNumber(device['Ethernet Network'].Value, deviceBranch);
                    }
                }
                for (var i = 1; i < portNs.length; i++) {
                    if (i !== currentUplinkPort) {
                        var portN = 'Port ' + i + ' ';
                        if (validPortProtocols.indexOf(device[portN + 'Protocol'].eValue) > -1 && device[portN + 'Network'].Value !== 0) {
                            testNetworkNumber(device[portN + 'Network'].Value, deviceBranch);
                        }
                    }
                }

                async.eachSeries(deviceBranch.networks, function(branchNetwork, callback2) {
                    if (branchNetwork !== 0) {
                        buildTree(branchNetwork, function(err, _branches) {
                            if (!!_branches.length) {
                                deviceBranch.branches = deviceBranch.branches.concat(_branches);
                            }
                            callback2();
                        });
                    } else {
                        callback2();
                    }
                }, function(err) {
                    branches.push(deviceBranch);

                    callback1();
                });

            }, function(err) {
                cb(err, branches);
            });
        });
    };

    async.eachSeries(topLevels, function(top, acb) {
        networkNumbers.push(top);
        topNode = {
            branches: []
        };
        topNode.networkSegment = top;
        buildTree(top, function(err, _branches) {
            topNode.branches = topNode.branches.concat(_branches);
            deviceTree.push(topNode);

            acb();
        });
    }, function(err) {
        console.log(badNumbers);

        next();
    });


};

var buildNodes = function( next) {
    var addToBranch = function(upSegment, downSegment, upType) {

        for (var j = 0; j < unknownBranches.length; j++) {
            if (unknownBranches[j].upNetwork === upSegment && upSegment !== downSegment) {
                if (upType === 0) {
                    if (unknownBranches[j].ethernets.indexOf(downSegment) < 0) {
                        unknownBranches[j].ethernets.push(downSegment);
                    }
                } else {
                    if (unknownBranches[j].serials.indexOf(downSegment) < 0) {
                        unknownBranches[j].serials.push(downSegment);
                    }
                }
                return;
            }
        }
    };

    var removeBranches = function() {
        for (var i = 0; i < unknownBranches.length; i++) {
            for (var j = 0; j < newBranches.length; j++) {
                if (unknownBranches[i].ethernets.indexOf(newBranches[j].upNetwork) > -1 || unknownBranches[i].serials.indexOf(newBranches[j].upNetwork) > -1) {
                    newBranches.splice(j, 1);
                    j--;
                }

            }
        }
    };

    var buildNodes = function(devices) {
        var isAdded;
        for (var i = 0; i < devices.length; i++) {
            isAdded = false;
            var deviceNetwork = devices[i]["Network Segment"].Value;
            for (var j = 0; j < unknownBranches.length; j++) {
                if (unknownBranches[j].upNetwork === deviceNetwork) {
                    isAdded = true;
                    break;
                }
            }
            if (!isAdded) {
                unknownBranches.push({
                    upNetwork: deviceNetwork,
                    ethernets: [],
                    serials: []
                });
            }
        }
    };

    var buildTree = function() {
        for (var i = 0; i < unknownBranches.length; i++) {

        }
    };

    var buildBranches = function(devices) {
        for (var i = 0; i < devices.length; i++) {
            var deviceNetwork = devices[i]["Network Segment"].Value;
            var currentUplinkPort = devices[i]['Uplink Port'].eValue;

            var portNs = [1, 2];
            if ([18, 19, 20].indexOf(devices[i]['Model Type'].eValue) > -1) {
                portNs = portNs.concat([3, 4]);
            }
            for (var n = 1; n < portNs.length; n++) {
                if (n !== currentUplinkPort) {
                    var portN = 'Port ' + n + ' ';
                    if (validPortProtocols.indexOf(devices[i][portN + 'Protocol'].eValue) > -1 && devices[i][portN + 'Network'].Value !== 0) {
                        addToBranch(deviceNetwork, devices[i][portN + 'Network'].Value, currentUplinkPort);
                    }
                }
            }

            if (devices[i]['Ethernet Network'].Value !== 0) {
                addToBranch(deviceNetwork, devices[i]['Ethernet Network'].Value, currentUplinkPort);
            }

            if (devices[i]['Downlink Network'].Value !== 0) {
                addToBranch(deviceNetwork, devices[i]['Downlink Network'].Value, 0);
            }

        }
    };

    Utility.get({
        collection: 'points',
        query: {
            'Point Type.Value': 'Device'
        },
        fields: {
            'Network Segment': 1,
            'Ethernet Network': 1,
            'Downlink Network': 1,
            'Port 1 Network': 1,
            'Port 2 Network': 1,
            'Port 3 Network': 1,
            'Port 4 Network': 1,
            'Port 1 Protocol': 1,
            'Port 2 Protocol': 1,
            'Port 3 Protocol': 1,
            'Port 4 Protocol': 1,
            'Uplink Port': 1,
            'Model Type': 1
        }
    }, function(err, devices) {
        buildNodes(devices);
        buildBranches(devices);
        newBranches = _.cloneDeep(unknownBranches);
        removeBranches();
        for (var i = 0; i < newBranches.length; i++) {
            topLevels.push(newBranches[i].upNetwork);
        }
        return next();
    });
};

var sortTree = function(next) {
    Utility.getOne({collection:'SystemInfo', query:{
        'Name': 'Preferences'
    }}, function(err, syspref) {
        var serverNetwork = syspref['IP Network Segment'];
        deviceTree.sort(compare);
        for (var i = 0; i < deviceTree.length; i++) {
            if (deviceTree[i].networkSegment === serverNetwork) {
                deviceTree.unshift(deviceTree.splice(i, 1)[0]);
            }
        }
        /*for (var i = 0; i < deviceTree.length; i++) {
            console.log('segment', deviceTree[i].networkSegment);
        }*/
        return next();
    });
};

var labelBadNetworks = function(next) {
    var findNetwork = function(network, branch) {
        console.log(network, branch);
        if (branch.networks.indexOf(network) > -1) {

        }

    };
    badNumbers.push(666);
    for (var i = 0; i < badNumbers.length; i++) {
        for (var j = 0; j < deviceTree.length; j++) {
            for (var k = 0; k < deviceTree[j].branches.length; k++) {
                findNetwork(badNumbers[i], deviceTree[j].branches[k]);
            }
        }
    }
    return next();
};
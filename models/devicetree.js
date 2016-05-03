var async = require('async');
var _ = require('lodash');

var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

var validPortProtocols = [1, 4];
var validEthProtocols = [1];

var deviceTree = [];
var server = {};
var networkNumbers = [];
var startNetworks = [];
var badNumbers = [];
var badNetworks = [];
var deviceUpis = [];
var template = [];
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
        deviceTree = [];
        server = {};
        networkNumbers = [];
        badNumbers = [];
        deviceUpis = [];
        template = [];
        unknownBranches = [];
        tree = [];
        newBranches = [];

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
                _id: {
                    $nin: deviceUpis
                }
            }
        }, function(err, devices) {
            for (var i = 0; i < devices.length; i++) {
                var deviceNetwork = devices[i]["Network Segment"].Value;
                var currentUplinkPort = devices[i]['Uplink Port'].eValue;
                var branch = {
                    upNetwork: deviceNetwork,
                    downNetworks: []
                };

                if (currentUplinkPort === 0) {
                    var portNs = [1, 2];
                    if ([18, 19, 20].indexOf(devices[i]['Model Type'].eValue) > -1) {
                        portNs = portNs.concat([3, 4]);
                    }
                    for (var n = 1; n <= portNs.length; n++) {
                        var portN = 'Port ' + n + ' ';
                        if (validPortProtocols.indexOf(devices[i][portN + 'Protocol'].eValue) > -1 && devices[i][portN + 'Network'].Value !== 0 && branch.downNetworks.indexOf(devices[i][portN + 'Network'].Value) < 0) {
                            branch.downNetworks.push(devices[i][portN + 'Network'].Value);
                        }
                    }
                } else {
                    if (devices[i]['Ethernet Network'].Value !== 0 && devices[i]['Ethernet Protocol'].eValue !== 0 && branch.downNetworks.indexOf(devices[i]['Ethernet Network'].Value) < 0) {
                        branch.downNetworks.push(devices[i]['Ethernet Network'].Value);
                    }
                }
                unknownBranches.push(branch);
            }
            return callback();
        });
    };

    var buildTree = function(network, cb) {
        var branches = [];

        var start = new Date();
        Utility.get({
            collection: 'points',
            query: {
                'Point Type.Value': 'Device',
                'Network Segment.Value': network.networkSegment
            },
            fields: {
                Name: 1,
                'Model Type.eValue': 1,
                'Device Status.Value': 1,
                'Uplink Port.eValue': 1,
                'Network Segment.Value': 1,
                'Downlink Network.Value': 1,
                'Ethernet Network.Value': 1,
                'Ethernet Protocol.eValue': 1,
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
                    if (device['Ethernet Network'].Value !== 0 && validEthProtocols.indexOf(device['Ethernet Protocol'].eValue) > -1) {
                        testNetworkNumber(device['Ethernet Network'].Value, deviceBranch);
                    }
                }
                for (var i = 1; i <= portNs.length; i++) {
                    if (i !== currentUplinkPort) {
                        var portN = 'Port ' + i + ' ';
                        if (validPortProtocols.indexOf(device[portN + 'Protocol'].eValue) > -1 && device[portN + 'Network'].Value !== 0) {
                            testNetworkNumber(device[portN + 'Network'].Value, deviceBranch);
                        }
                    }
                }

                async.eachSeries(deviceBranch.networks, function(branchNetwork, callback2) {
                    if (device._id === 181) {
                        // console.log(startNetworks, branchNetwork, badNetworks);
                    }
                    if (branchNetwork !== 0 && startNetworks.indexOf(branchNetwork) < 0 && badNetworks.indexOf(branchNetwork) < 0) {
                        startNetworks.push(branchNetwork);
                        buildTree({
                            networkSegment: branchNetwork
                        }, function(err, _branches) {
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
                    // console.log(branches, deviceBranch);
                    callback1();
                });

            }, function(err) {
                cb(err, branches);
            });
        });
    };

    async.eachSeries(template, function(node, acb) {
        topNode = {
            networkSegment: node.networkSegment,
            branches: []
        };
        buildTree(node, function(err, _branches) {
            // console.log(_branches);
            topNode.branches = topNode.branches.concat(_branches);
            deviceTree.push(topNode);
            acb();
        });
    }, function(err) {

        next();
    });
};

var buildNodes = function(next) {
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

    var buildStructure = function(devices) {
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

    var buildBranches = function(devices) {
        for (var i = 0; i < devices.length; i++) {
            var deviceNetwork = devices[i]["Network Segment"].Value;
            var currentUplinkPort = devices[i]['Uplink Port'].eValue;
            var portNs = [1, 2];

            if ([18, 19, 20].indexOf(devices[i]['Model Type'].eValue) > -1) {
                portNs = portNs.concat([3, 4]);
            }
            for (var n = 1; n <= portNs.length; n++) {
                if (n !== currentUplinkPort) {
                    var portN = 'Port ' + n + ' ';
                    if (validPortProtocols.indexOf(devices[i][portN + 'Protocol'].eValue) > -1 && devices[i][portN + 'Network'].Value !== 0) {
                        addToBranch(deviceNetwork, devices[i][portN + 'Network'].Value, currentUplinkPort);
                    }
                }
            }

            if (devices[i]['Ethernet Network'].Value !== 0 && validEthProtocols.indexOf(devices[i]['Ethernet Protocol'].eValue) > -1) {
                addToBranch(deviceNetwork, devices[i]['Ethernet Network'].Value, currentUplinkPort);
            }

            if (devices[i]['Downlink Network'].Value !== 0) {
                addToBranch(deviceNetwork, devices[i]['Downlink Network'].Value, 0);
            }

        }
    };

    var buildNetworks = function() {
        /*newBranches = [{
            upNetwork: 4002,
            ethernets: [],
            serials: []
        }, {
            upNetwork: 4003,
            ethernets: [],
            serials: [4004]
        }, {
            upNetwork: 4000,
            ethernets: [4002, 4003],
            serials: []
        }];*/
        tree = [];
        var possibleTops = [];
        var isAdded = false;

        var findBranches = function(branchArray, networkNumber) {
            var retBranch = null;
            for (var i = 0; i < branchArray.length; i++) {
                branch = branchArray[i];
                if (branch.networkSegment === networkNumber) {
                    retBranch = branch;
                    break;
                } else if (!!branch.branches.length) {
                    retBranch = findBranches(branch.branches, networkNumber);
                }
            }
            return retBranch;
        };

        var isInTree = function(tree, network) {
            var inTree = false;
            if (tree.networkSegment === network) {
                inTree = true;
            } else if (!!tree.branches.length) {
                for (var b = 0; b < tree.branches.length; b++) {
                    var branch = tree.branches[b];
                    inTree = isInTree(branch, network);
                    if (!!inTree) {
                        break;
                    }
                }
            }
            return inTree;
        };

        var findParents = function(index, branches) {
            var removals = [];
            for (var b = 0; b < branches.length; b++) {
                for (var t = 0; t < tree.length; t++) {
                    if (t !== index) {
                        if (tree[t].networkSegment === branches[b].networkSegment) {
                            branches[b] = _.cloneDeep(tree[t]);
                            removals.push(t);
                        }
                    }
                }
            }
            removals.sort().reverse();
            for (var r = 0; r < removals.length; r++) {
                tree.splice(removals[r], 1);
            }
        }

        for (var i = 0; i < newBranches.length; i++) {
            isAdded = false;
            for (var t = 0; t < tree.length; t++) {
                var branch = findBranches(tree[t].branches, newBranches[i].upNetwork);
                if (branch !== null) {
                    newBranches[i].ethernets.forEach(function(ethernet) {
                        if (isInTree(tree[t], ethernet)) {
                            badNumbers.push(ethernet);
                        }
                        branch.branches.push({
                            networkSegment: ethernet,
                            branches: []
                        });
                    });
                    newBranches[i].serials.forEach(function(serial) {
                        if (isInTree(tree[t], serial)) {
                            badNumbers.push(serial);
                        }
                        branch.branches.push({
                            networkSegment: serial,
                            branches: []
                        });
                    });
                    isAdded = true;
                }
            }

            if (!isAdded) {
                var node = {
                    networkSegment: newBranches[i].upNetwork,
                    branches: []
                };
                newBranches[i].ethernets.forEach(function(ethernet) {
                    node.branches.push({
                        networkSegment: ethernet,
                        branches: []
                    });
                });
                newBranches[i].serials.forEach(function(serial) {
                    node.branches.push({
                        networkSegment: serial,
                        branches: []
                    });
                });

                tree.push(node);
                var parent = findParents(tree.length - 1, node.branches);
            }
        }
        console.log('tree', JSON.stringify(tree), badNumbers);
    };

    Utility.get({
        collection: 'points',
        query: {
            'Point Type.Value': 'Device'
        },
        fields: {
            'Network Segment': 1,
            'Ethernet Network': 1,
            'Ethernet Protocol': 1,
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
        buildStructure(devices);
        buildBranches(devices);
        newBranches = _.cloneDeep(unknownBranches);
        buildNetworks();
        template = tree;
        return next();
    });
};

var sortTree = function(next) {
    Utility.getOne({
        collection: 'SystemInfo',
        query: {
            'Name': 'Preferences'
        }
    }, function(err, syspref) {
        var serverNetwork = syspref['IP Network Segment'];
        deviceTree.sort(compare);
        for (var i = 0; i < deviceTree.length; i++) {
            if (deviceTree[i].networkSegment === serverNetwork) {
                deviceTree.unshift(deviceTree.splice(i, 1)[0]);
            }
        }
        return next();
    });
};
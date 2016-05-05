var async = require('async');
var _ = require('lodash');

var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

var validPortProtocols = [1, 4];
var validEthProtocols = [1];

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
    getTree: function(cb) {
        var tree = [];
        var badNumbers = [];
        var networkNumbers = [];
        // get devices
        // remove invalid network numbers
        // build structure
        var getDevices = function(callback) {

            Utility.iterateCursor({
                collection: 'points',
                query: {
                    'Point Type.Value': 'Device'
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
                }
                /*,
                                limit: 3*/
            }, buildTree, callback);
        };

        var buildTree = function(err, device, next) {
            var isAdded = false;
            var deviceBranch = {
                upi: device._id,
                text: device.Name,
                status: device['Device Status'].Value,
                protocol: device['Uplink Port'].eValue,
                networkSegment: device['Network Segment'].Value,
                networks: [],
                branches: []
            };

            //TODO REMOVE AFTER TESTING
            /*if (deviceBranch.networkSegment !== 4000) {
                deviceBranch.networks.push(4000);
            }*/

            var addToNetworks = function(upSegment, downSegment) {
                if (upSegment !== downSegment && deviceBranch.networks.indexOf(downSegment) < 0 && downSegment !== 0) {
                    deviceBranch.networks.push(downSegment);
                }
            };

            var fixNetworks = function() {
                var deviceNetwork = device["Network Segment"].Value;
                var currentUplinkPort = device['Uplink Port'].eValue;
                var portNs = [1, 2];

                if ([18, 19, 20].indexOf(device['Model Type'].eValue) > -1) {
                    portNs = portNs.concat([3, 4]);
                }
                for (var n = 1; n <= portNs.length; n++) {
                    if (n !== currentUplinkPort) {
                        var portN = 'Port ' + n + ' ';
                        if (device['Ethernet Network'].Value !== 0 && validEthProtocols.indexOf(device['Ethernet Protocol'].eValue) > -1) {
                            addToNetworks(deviceNetwork, device[portN + 'Network'].Value);
                        }
                    }
                }

                if (device['Ethernet Network'].Value !== 0 && validEthProtocols.indexOf(device['Ethernet Protocol'].eValue) > -1) {
                    addToNetworks(deviceNetwork, device['Ethernet Network'].Value);
                }

                if (device['Downlink Network'].Value !== 0) {
                    addToNetworks(deviceNetwork, device['Downlink Network'].Value);
                }
            };

            var findChildren = function(node, networkNumber) {
                var retChild = null;
                if (!node.hasOwnProperty('networks') && node.networkSegment === networkNumber) {
                    retChild = node;
                } else if (node.hasOwnProperty('networks') && node.networks.indexOf(networkNumber) >= 0) {
                    retChild = node;
                } else if (!!node.branches.length) {
                    for (var b = 0; b < node.branches.length; b++) {
                        retChild = findChildren(node.branches[b], networkNumber);
                        if (!!retChild) {
                            break;
                        }
                    }
                }
                return retChild;
            };

            var isInTree = function(tree, network) {
                var inTree = false;
                if (tree.networkSegment === network) {
                    inTree = true;
                } else if (!!tree.children.length) {
                    for (var b = 0; b < tree.children.length; b++) {
                        var child = tree.children[b];
                        inTree = isInTree(child, network);
                        if (!!inTree) {
                            break;
                        }
                    }
                }
                return inTree;
            };

            var findParents = function(index, device) {
                var removals = [];
                for (var b = 0; b < device.networks.length; b++) {
                    for (var t = 0; t < tree.length; t++) {
                        if (t !== index) {
                            if (tree[t].networkSegment === device.networks[b]) {
                                for (var i = 0; i < tree[t].branches.length; i++) {
                                    device.branches.push(_.cloneDeep(tree[t].branches[i]));
                                }

                                removals.push(t);
                            }
                        }
                    }
                }
                removals.sort(sortArray).reverse();
                for (var r = 0; r < removals.length; r++) {
                    tree.splice(removals[r], 1);
                }
            };

            var moveChildren = function(deviceIndex, deviceBranch) {
                var removals = [];
                tree.forEach(function(node, index) {
                    if (deviceIndex !== index) {
                        if (deviceBranch.networks.indexOf(node.networkSegment) >= 0) {
                            for (var b = 0; b < node.branches.length; b++) {
                                deviceBranch.branches.push(_.cloneDeep(node.branches[b]));
                            }
                            removals.push(index);
                        }
                    }
                });
                removals.sort(sortArray).reverse();
                for (var r = 0; r < removals.length; r++) {
                    tree.splice(removals[r], 1);
                }
            };

            fixNetworks();
            for (var t = 0; t < tree.length; t++) {
                var child = findChildren(tree[t], deviceBranch.networkSegment);
                if (child !== null) {
                    moveChildren(t, deviceBranch);
                    child.branches.push(deviceBranch);
                    isAdded = true;
                    break;
                }
            }
            if (!isAdded) {
                tree.push({
                    networkSegment: deviceBranch.networkSegment,
                    branches: [deviceBranch]
                });
                var parent = findParents(tree.length - 1, deviceBranch);
            }

            next();
        };

        var findNumbers = function() {
            var addNumber = function(number) {
                if (networkNumbers.indexOf(number) < 0) {
                    networkNumbers.push(number);
                } else if (badNumbers.indexOf(number) < 0) {
                    badNumbers.push(number);
                }
            }
            var loop = function(branch) {
                if (!branch.hasOwnProperty('networks')) {
                    addNumber(branch.networkSegment)
                } else if (branch.hasOwnProperty('networks')) {
                    for (var n = 0; n < branch.networks.length; n++) {
                        addNumber(branch.networks[n]);
                    }
                }

                for (var b = 0; b < branch.branches.length; b++) {
                    loop(branch.branches[b]);
                }
            }
            tree.forEach(function(branch) {
                loop(branch);
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
                tree.sort(compare);
                for (var i = 0; i < tree.length; i++) {
                    if (tree[i].networkSegment === serverNetwork) {
                        tree.unshift(tree.splice(i, 1)[0]);
                    }
                }
                return next();
            });
        };

        getDevices(function(err, count) {
            sortTree(function(err) {
                findNumbers();
                return cb(err, {
                    tree: tree,
                    networkNumbers: networkNumbers.sort(sortArray),
                    badNumbers: badNumbers.sort(sortArray)
                });
            });
        });
    }
};
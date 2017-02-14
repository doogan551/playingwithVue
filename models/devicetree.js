let _ = require('lodash');

let Point = new(require('./point'))();
let System = new(require('./system'))();

let validPortProtocols = [1, 4];
let validEthProtocols = [1];

let sortArray = (a, b) => {
    return a - b;
};

let compare = (a, b) => {
    if (a.networkSegment < b.networkSegment) {
        return -1;
    }
    if (a.networkSegment > b.networkSegment) {
        return 1;
    }
    return 0;
};

let DeviceTree = class DeviceTree {

    getTree(cb) {
        let tree = [];
        let badNumbers = [];
        let networkNumbers = [];

        ///////////////////////////////////////
        // Gets devices to build device tree //
        ///////////////////////////////////////
        let getDevices = (callback) => {
            Point.iterateCursor({
                collection: this.collection,
                query: {
                    'Point Type.Value': 'Device'
                },
                fields: {
                    Name: 1,
                    'Model Type.eValue': 1,
                    'Device Status.Value': 1,
                    'Uplink Port.eValue': 1,
                    'Network Segment.Value': 1,
                    'Device Address': 1,
                    'Downlink Network.Value': 1,
                    'Ethernet Network.Value': 1,
                    'Ethernet Protocol.eValue': 1,
                    'Ethernet IP Port.Value': 1,
                    'Port 1 Protocol.eValue': 1,
                    'Port 1 Network.Value': 1,
                    'Port 2 Protocol.eValue': 1,
                    'Port 2 Network.Value': 1,
                    'Port 3 Protocol.eValue': 1,
                    'Port 3 Network.Value': 1,
                    'Port 4 Protocol.eValue': 1,
                    'Port 4 Network.Value': 1
                }
            }, buildTree, callback);
        };

        let buildTree = (err, device, next) => {
            let isAdded = false;
            let deviceBranch = {
                upi: device._id,
                text: device.Name,
                status: device['Device Status'].Value,
                protocol: device['Uplink Port'].eValue,
                networkSegment: device['Network Segment'].Value,
                deviceAddress: device['Device Address'].Value,
                uplinkPort: device['Uplink Port'].eValue,
                ethIPPort: device['Ethernet IP Port'].Value,
                networks: [],
                branches: []
            };

            let addToNetworks = (upSegment, downSegment) => {
                if (upSegment !== downSegment && deviceBranch.networks.indexOf(downSegment) < 0 && downSegment !== 0) {
                    deviceBranch.networks.push(downSegment);
                }
            };

            /////////////////////////////////////////////////////////
            // builds networks that are associated with the device //
            /////////////////////////////////////////////////////////
            let fixNetworks = () => {
                let deviceNetwork = device['Network Segment'].Value;
                let currentUplinkPort = device['Uplink Port'].eValue;
                let portNs = [1, 2];

                if ([18, 19, 20].indexOf(device['Model Type'].eValue) > -1) {
                    portNs = portNs.concat([3, 4]);
                }

                for (let n = 1; n <= portNs.length; n++) {
                    if (n !== currentUplinkPort) {
                        let portN = 'Port ' + n + ' ';
                        if (device[portN + 'Network'].Value !== 0 && validPortProtocols.indexOf(device[portN + 'Protocol'].eValue) > -1) {
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

            //////////////////////////////////////////////////////////////////////
            // searches tree for any childeren that may have already been added //
            //////////////////////////////////////////////////////////////////////
            let findChildren = (node, networkNumber) => {
                let retChild = null;
                if (!node.hasOwnProperty('networks') && node.networkSegment === networkNumber) {
                    retChild = node;
                } else if (node.hasOwnProperty('networks') && node.networks.indexOf(networkNumber) >= 0) {
                    retChild = node;
                } else if (!!node.branches.length) {
                    for (let b = 0; b < node.branches.length; b++) {
                        retChild = findChildren(node.branches[b], networkNumber);
                        if (!!retChild) {
                            break;
                        }
                    }
                }
                return retChild;
            };

            //////////////
            // Not used //
            //////////////
            let isInTree = (tree, network) => {
                let inTree = false;
                if (tree.networkSegment === network) {
                    inTree = true;
                } else if (!!tree.children.length) {
                    for (let b = 0; b < tree.children.length; b++) {
                        let child = tree.children[b];
                        inTree = isInTree(child, network);
                        if (!!inTree) {
                            break;
                        }
                    }
                }
                return inTree;
            };

            /////////////////////////////////////////////////////////////
            // Finds any parent nodes that may have been added already //
            /////////////////////////////////////////////////////////////
            let findParents = (index, device) => {
                let removals = [];
                for (let b = 0; b < device.networks.length; b++) {
                    for (let t = 0; t < tree.length; t++) {
                        if (t !== index) {
                            if (tree[t].networkSegment === device.networks[b]) {
                                for (let i = 0; i < tree[t].branches.length; i++) {
                                    device.branches.push(_.cloneDeep(tree[t].branches[i]));
                                }

                                removals.push(t);
                            }
                        }
                    }
                }
                removals.sort(sortArray).reverse();
                for (let r = 0; r < removals.length; r++) {
                    tree.splice(removals[r], 1);
                }
            };

            //////////////////////////////
            // moves nodes around tree  //
            //////////////////////////////
            let moveChildren = (deviceIndex, deviceBranch) => {
                let removals = [];
                tree.forEach((node, index) => {
                    if (deviceIndex !== index) {
                        if (deviceBranch.networks.indexOf(node.networkSegment) >= 0) {
                            for (let b = 0; b < node.branches.length; b++) {
                                deviceBranch.branches.push(_.cloneDeep(node.branches[b]));
                            }
                            removals.push(index);
                        }
                    }
                });
                removals.sort(sortArray).reverse();
                for (let r = 0; r < removals.length; r++) {
                    tree.splice(removals[r], 1);
                }
            };

            fixNetworks();
            for (let t = 0; t < tree.length; t++) {
                let child = findChildren(tree[t], deviceBranch.networkSegment);
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
                findParents(tree.length - 1, deviceBranch);
            }

            next();
        };

        //////////////////////////////////
        // sets up network numbers list //
        //////////////////////////////////
        let findNumbers = () => {
            let addNumber = (number) => {
                if (networkNumbers.indexOf(number) < 0) {
                    networkNumbers.push(number);
                } else if (badNumbers.indexOf(number) < 0) {
                    badNumbers.push(number);
                }
            };
            let loop = (branch) => {
                if (!branch.hasOwnProperty('networks')) {
                    addNumber(branch.networkSegment);
                } else if (branch.hasOwnProperty('networks')) {
                    for (let n = 0; n < branch.networks.length; n++) {
                        addNumber(branch.networks[n]);
                    }
                }

                for (let b = 0; b < branch.branches.length; b++) {
                    loop(branch.branches[b]);
                }
            };
            tree.forEach((branch) => {
                loop(branch);
            });
        };

        /////////////////////////////////////////////////
        // puts default network segment at top of list //
        /////////////////////////////////////////////////
        let sortTree = (next) => {
            System.getSystemInfoByName('Preferences', (err, syspref) => {
                let serverNetwork = syspref['IP Network Segment'];
                tree.sort(compare);
                for (let i = 0; i < tree.length; i++) {
                    if (tree[i].networkSegment === serverNetwork) {
                        tree.unshift(tree.splice(i, 1)[0]);
                    }
                }
                return next();
            });
        };

        getDevices((err) => {
            sortTree((err) => {
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

module.exports = DeviceTree;

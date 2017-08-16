const _ = require('lodash');

const validPortProtocols = [1, 4];
const validEthProtocols = [1];

const DeviceTree = class DeviceTree {
    constructor() {
        this.tree = [];
        this.badNumbers = [];
        this.networkNumbers = [];
    }


    sortArray(a, b) {
        return a - b;
    }

    compare(a, b) {
        if (a.networkSegment < b.networkSegment) {
            return -1;
        }
        if (a.networkSegment > b.networkSegment) {
            return 1;
        }
        return 0;
    }
    ///////////////////////////////////////
    // Gets devices to build device tree //
    ///////////////////////////////////////
    getDevices(callback) {
        const point = new Point();
        point.iterateCursor({
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
        }, (...args) => this.buildTree(...args), callback);
    }

    addToNetworks(deviceBranch, upSegment, downSegment) {
        if (upSegment !== downSegment && deviceBranch.networks.indexOf(downSegment) < 0 && downSegment !== 0) {
            deviceBranch.networks.push(downSegment);
        }
    }

    /////////////////////////////////////////////////////////
    // builds networks that are associated with the device //
    /////////////////////////////////////////////////////////
    fixNetworks(device, deviceBranch) {
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
                    this.addToNetworks(deviceBranch, deviceNetwork, device[portN + 'Network'].Value);
                }
            }
        }

        if (device['Ethernet Network'].Value !== 0 && validEthProtocols.indexOf(device['Ethernet Protocol'].eValue) > -1) {
            this.addToNetworks(deviceBranch, deviceNetwork, device['Ethernet Network'].Value);
        }

        if (device['Downlink Network'].Value !== 0) {
            this.addToNetworks(deviceBranch, deviceNetwork, device['Downlink Network'].Value);
        }
    }

    //////////////////////////////////////////////////////////////////////
    // searches tree for any childeren that may have already been added //
    //////////////////////////////////////////////////////////////////////
    findChildren(node, networkNumber) {
        let retChild = null;
        if (!node.hasOwnProperty('networks') && node.networkSegment === networkNumber) {
            retChild = node;
        } else if (node.hasOwnProperty('networks') && node.networks.indexOf(networkNumber) >= 0) {
            retChild = node;
        } else if (!!node.branches.length) {
            for (let b = 0; b < node.branches.length; b++) {
                retChild = this.findChildren(node.branches[b], networkNumber);
                if (!!retChild) {
                    break;
                }
            }
        }
        return retChild;
    }

    /////////////////////////////////////////////////////////////
    // Finds any parent nodes that may have been added already //
    /////////////////////////////////////////////////////////////
    findParents(index, device) {
        let removals = [];
        for (let b = 0; b < device.networks.length; b++) {
            for (let t = 0; t < this.tree.length; t++) {
                if (t !== index) {
                    if (this.tree[t].networkSegment === device.networks[b]) {
                        for (let i = 0; i < this.tree[t].branches.length; i++) {
                            device.branches.push(_.cloneDeep(this.tree[t].branches[i]));
                        }

                        removals.push(t);
                    }
                }
            }
        }
        removals.sort(this.sortArray).reverse();
        for (let r = 0; r < removals.length; r++) {
            this.tree.splice(removals[r], 1);
        }
    }

    //////////////////////////////
    // moves nodes around tree  //
    //////////////////////////////
    moveChildren(deviceIndex, deviceBranch) {
        let removals = [];
        this.tree.forEach((node, index) => {
            if (deviceIndex !== index) {
                if (deviceBranch.networks.indexOf(node.networkSegment) >= 0) {
                    for (let b = 0; b < node.branches.length; b++) {
                        deviceBranch.branches.push(_.cloneDeep(node.branches[b]));
                    }
                    removals.push(index);
                }
            }
        });
        removals.sort(this.sortArray).reverse();
        for (let r = 0; r < removals.length; r++) {
            this.tree.splice(removals[r], 1);
        }
    }

    buildTree(err, device, next) {
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

        this.fixNetworks(device, deviceBranch);
        for (let t = 0; t < this.tree.length; t++) {
            let child = this.findChildren(this.tree[t], deviceBranch.networkSegment);
            if (child !== null) {
                this.moveChildren(t, deviceBranch);
                child.branches.push(deviceBranch);
                isAdded = true;
                break;
            }
        }
        if (!isAdded) {
            this.tree.push({
                networkSegment: deviceBranch.networkSegment,
                branches: [deviceBranch]
            });
            this.findParents(this.tree.length - 1, deviceBranch);
        }

        next();
    }

    addNumber(number) {
        if (this.networkNumbers.indexOf(number) < 0) {
            this.networkNumbers.push(number);
        } else if (this.badNumbers.indexOf(number) < 0) {
            this.badNumbers.push(number);
        }
    }


    loopBranches(branch) {
        if (!branch.hasOwnProperty('networks')) {
            this.addNumber(branch.networkSegment);
        } else if (branch.hasOwnProperty('networks')) {
            for (let n = 0; n < branch.networks.length; n++) {
                this.addNumber(branch.networks[n]);
            }
        }

        for (let b = 0; b < branch.branches.length; b++) {
            this.loopBranches(branch.branches[b]);
        }
    }

    //////////////////////////////////
    // sets up network numbers list //
    //////////////////////////////////
    findNumbers() {
        this.tree.forEach((branch) => {
            this.loopBranches(branch);
        });
    }

    /////////////////////////////////////////////////
    // puts default network segment at top of list //
    /////////////////////////////////////////////////
    sortTree(next) {
        const system = new System();
        system.getSystemInfoByName('Preferences', (err, syspref) => {
            let serverNetwork = syspref['IP Network Segment'];
            this.tree.sort(this.compare);
            for (let i = 0; i < this.tree.length; i++) {
                if (this.tree[i].networkSegment === serverNetwork) {
                    this.tree.unshift(this.tree.splice(i, 1)[0]);
                }
            }
            return next();
        });
    }

    getTree(cb) {
        this.tree = [];
        this.badNumbers = [];
        this.networkNumbers = [];
        this.getDevices((err) => {
            this.sortTree((err) => {
                this.findNumbers();
                return cb(err, {
                    tree: this.tree,
                    networkNumbers: this.networkNumbers.sort(this.sortArray),
                    badNumbers: this.badNumbers.sort(this.sortArray)
                });
            });
        });
    }
};

module.exports = DeviceTree;
const Point = require('./point');
const System = require('./system');

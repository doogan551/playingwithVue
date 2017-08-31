const Config = require('../public/js/lib/config.js');
const Enums = Config.Enums;
const zmq = require('../helpers/zmq');
const Utility = require('./utility');

const Common = class Common extends Utility {

    isInt(n) {
        return Number(n) === n && n % 1 === 0;
    }

    isFloat(n) {
        return Number(n) === n && n % 1 !== 0;
    }

    isNumber(n) {
        let val = parseFloat(n);
        return typeof val === 'number' && !isNaN(val);
    }

    checkNumbers(n) {
        n = n.toString();
        return (n.match(/[^0-9.]*/g).join('').length > 0);
    }

    /**
     * method to get default values.
     * if val can be converted to same type as def, it will be, otherwise val as given is returned
     * if val is undefined, def is returned
     * if def is undefined, val is returned
     *
     * @param {any} val value to be checked
     * @param {any} def default value compared against or returned if val is undefined
     * @returns {any} see above
     */
    getDefault(val, def) {
        if (typeof def === 'number') {
            if (val !== undefined) {
                if (this.isNumber(val)) {
                    return parseFloat(val);
                }
                return val;
            }
            return def;
        }

        if (typeof def === 'boolean') {
            if (val !== undefined) {
                if (val === null) {
                    return val;
                }
                return (val.toString() === 'true') ? true : (val.toString() === 'false') ? false : val;
            }
            return def;
        }

        if (Array.isArray(def)) {
            // this is just to keep arrays from being objects
            if (val !== undefined) {
                return val;
            }
            return def;
        }

        if (typeof def === 'string') {
            if (val !== undefined) {
                if (val === null) {
                    return val;
                }
                return val.toString();
            }
            return def;
        }

        if (typeof def === 'object') {
            if (val !== undefined) {
                if (typeof val === 'object' || def === null) {
                    return val;
                }
                return JSON.parse(val);
            }
            return def;
        }

        if (val !== undefined) {
            return val;
        }
        return def;
    }

    getNumber(val) {
        return parseFloat(val);
    }

    getSort(val) {
        if (!!~['desc', -1, '-1'].indexOf(val)) {
            return -1;
        }
        return 1;
    }

    getTemplateEnum(set, prop) {
        return Enums[set][prop].enum;
    }

    buildAlarmQuery(data, view) {
        let currentPage = this.getDefault(data.currentPage, 1);
        let itemsPerPage = this.getDefault(data.itemsPerPage, 200);
        let startDate = this.getDefault(data.startDate, 0);
        let endDate = (this.getNumber(data.endDate) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;
        let sort = {};
        let query = {};

        if (currentPage < 1) {
            currentPage = 1;
        }

        let numberItems = this.getDefault(data.numberItems, itemsPerPage);

        if (view === 'Unacknowledged') {
            query.ackStatus = this.getTemplateEnum('Acknowledge Statuses', 'Not Acknowledged');
        } else {
            query.$and = [{
                msgTime: {
                    $gte: startDate
                }
            }, {
                msgTime: {
                    $lte: endDate
                }
            }];
        }

        if (!!data.terms) {
            if (data.terms.length) {
                if (typeof data.terms === 'string') {
                    data.terms = data.terms.split(' ');
                }

                query.path = {
                    $all: this.buildSearchTerms(data.terms)
                };
            }
        }

        if (data.msgCat) {
            query.msgCat = {
                $in: data.msgCat
            };
        }
        if (data.almClass) {
            query.almClass = {
                $in: data.almClass
            };
        }

        if (data.pointTypes) {
            if (data.pointTypes.length > 0) {
                query.PointType = {
                    $in: data.pointTypes
                };
            }
        }

        sort.msgTime = this.getSort(data.sort);
        let skip = (currentPage - 1) * itemsPerPage;
        return {
            query: query,
            sort: sort,
            skip: skip,
            numberItems
        };
    }

    /**
     * Building name search
     *
     * @param {Object} data    request obj containing query info
     * @param {Object} query   query object being build
     * @param {String} segment which segment (name1-4)
     * @param {String} toSegment which segment on query (name1-4)
     * @return {undefined} undefined
     */
    addNamesToQuery(data, query, segment, toSegment) {
        if (!toSegment) {
            toSegment = segment;
        }

        if (!!data.hasOwnProperty(segment) && data[segment] !== '') {
            if (data[segment] !== null) {
                query[toSegment] = new RegExp('^' + data[segment], 'i');
            } else {
                query[toSegment] = '';
            }
        }
    }

    // io & oplog
    setQualityLabel(point) {
        if (point._relDevice !== undefined && point._relDevice === Config.Enums.Reliabilities['Stop Scan'].enum) {
            point['Quality Label'] = 'Stop Scan';
        } else if (point._cfgRequired !== undefined && point._cfgRequired === true) {
            point['Quality Label'] = 'Fault';
        } else if (point._relDevice !== undefined && point._relDevice !== Config.Enums.Reliabilities['No Fault'].enum) {
            point['Quality Label'] = 'Fault';
        } else if (point._relRMU !== undefined && point._relRMU === Config.Enums.Reliabilities['Stop Scan'].enum) {
            point['Quality Label'] = 'Stop Scan';
        } else if (point._relRMU !== undefined && point._relRMU !== Config.Enums.Reliabilities['No Fault'].enum) {
            point['Quality Label'] = 'Fault';
        } else if (point['COV Enable'] !== undefined && point['COV Enable'].Value === false && point['Quality Code Enable'] !== undefined && (point['Quality Code Enable'].Value & Config.Enums['Quality Code Enable Bits']['COV Enable'].enum) !== 0) {
            point['Quality Label'] = 'COV Disabled';
        } else if (point._relPoint !== undefined && point._relPoint !== Config.Enums.Reliabilities['No Fault'].enum) {
            point['Quality Label'] = 'Fault';
        } else if (point['Status Flags'] !== undefined && (point['Status Flags'].Value & Config.Enums['Status Flags Bits']['Out of Service'].enum) !== 0) {
            point['Quality Label'] = 'Out of Service';
        } else if (point['Alarm State'] !== undefined && (point['Alarm State'].eValue === Config.Enums['Alarm States'].Offnormal.enum || point['Alarm State'].eValue === Config.Enums['Alarm States'].Open.enum || point['Alarm State'].eValue && point['Alarm State'].eValue === Config.Enums['Alarm States'].Closed.enum)) {
            point['Quality Label'] = 'Abnormal';
        } else if (point['Alarm State'] !== undefined && point['Alarm State'].eValue === Config.Enums['Alarm States'].Shutdown.enum) {
            point['Quality Label'] = 'Shutdown';
        } else if (point['Alarm State'] !== undefined && point['Alarm State'].eValue === Config.Enums['Alarm States']['High Limit'].enum) {
            point['Quality Label'] = 'Analog Alarm High Limit';
        } else if (point['Alarm State'] !== undefined && point['Alarm State'].eValue === Config.Enums['Alarm States']['Low Limit'].enum) {
            point['Quality Label'] = 'Analog Alarm Low Limit';
        } else if (point['Alarm State'] !== undefined && point['Alarm State'].eValue === Config.Enums['Alarm States']['High Warning'].enum) {
            point['Quality Label'] = 'Analog High Warning';
        } else if (point['Alarm State'] !== undefined && point['Alarm State'].eValue === Config.Enums['Alarm States']['Low Warning'].enum) {
            point['Quality Label'] = 'Analog Low Warning';
        } else if (point['Control Pending'] !== undefined && point['Control Pending'].Value === true && point['Quality Code Enable'].Value && (point['Quality Code Enable'].Value & Config.Enums['Quality Code Enable Bits']['Command Pending'].enum) !== 0) {
            point['Quality Label'] = 'Control Pending';
        } else if (point['Status Flags'] !== undefined && (point['Status Flags'].Value & Config.Enums['Status Flags Bits'].Override.enum) !== 0 && point['Quality Code Enable'].Value && (point['Quality Code Enable'].Value & Config.Enums['Quality Code Enable Bits'].Override.enum) !== 0) {
            point['Quality Label'] = 'Overridden';
        } else if (point['Alarms Off'] !== undefined && point['Alarms Off'].Value === true && point['Quality Code Enable'].Value && (point['Quality Code Enable'].Value & Config.Enums['Quality Code Enable Bits']['Alarms Off'].enum) !== 0) {
            point['Quality Label'] = 'Alarms Off';
        } else {
            point['Quality Label'] = 'none';
        }

        return point;
    }
    //runScheduleEntry (tcp), newupdate (common)
    signalExecTOD(executeTOD, callback) {
        if (executeTOD === true) {
            let command = {
                'Command Type': 10
            };
            command = JSON.stringify(command);
            zmq.sendCommand(command, (err, msg) => {
                return callback(err, msg);
            });
        } else {
            callback(null, 'success');
        }
    }

    buildSearchTerms(terms) {
        return terms.map((term) => {
            if (term.match(/"/)) {
                return term.replace(/"/g, '');
            }
            return new RegExp(term, 'ig');
        });
    }
};

module.exports = Common;

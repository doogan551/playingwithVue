const Config = require('../public/js/lib/config.js');
const zmq = require('../helpers/zmq');
const Utility = require('./utility');

const Common = class Common extends Utility {

    /**
     * Building name search
     *
     * @param {Object} data    request obj containing query info
     * @param {Object} query   query object being build
     * @param {String} segment which segment (name1-4)
     * @return {undefined} undefined
     */
    addNamesToQuery(data, query, segment) {
        if (!!data.hasOwnProperty(segment)) {
            if (data[segment] !== null) {
                query[segment] = new RegExp('^' + data[segment], 'i');
            } else {
                query[segment] = '';
            }
        } else {
            query[segment] = '';
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
};

module.exports = Common;

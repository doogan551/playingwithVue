var utils = require('../helpers/utils.js');
var moment = require('moment');
var data;

describe('Utils functions', function() {
  it('should return correct constants', function() {
    expect(utils.CONSTANTS('read')).to.equal(1);
    expect(utils.CONSTANTS('control')).to.equal(2);
    expect(utils.CONSTANTS('ACKNOWLEDGE')).to.equal(4);
    expect(utils.CONSTANTS('WRITE')).to.equal(8);
    expect(utils.CONSTANTS('POINTSCOLLECTION')).to.equal('points');
    expect(utils.CONSTANTS('USERSCOLLECTION')).to.equal('Users');
    expect(utils.CONSTANTS('ALARMSCOLLECTION')).to.equal('Alarms');
    expect(utils.CONSTANTS('CALENDARCOLLECTION')).to.equal('Holiday');
    expect(utils.CONSTANTS('SYSTEMINFOPROPERTIES')).to.equal('SystemInfo');
    expect(utils.CONSTANTS('SCHEDULESCOLLECTION')).to.equal('Schedules');
    expect(utils.CONSTANTS('HISTORYCOLLECTION')).to.equal('historydata');
    expect(utils.CONSTANTS('USERGROUPSCOLLECTION')).to.equal('User Groups');
    expect(utils.CONSTANTS('ACTIVITYLOGCOLLECTION')).to.equal('Activity Logs');
    expect(utils.CONSTANTS('UPIS')).to.equal('upis');
    expect(utils.CONSTANTS('upiscollections')).to.include('Activity Logs');
    expect(utils.CONSTANTS('upiscollections')).to.include('Alarms');
    expect(utils.CONSTANTS('upiscollections')).to.include('Schedules');
    expect(utils.CONSTANTS('upiscollections')).to.include('historydata');
  });

  it('should check for dynamic properties', function(){
    expect(utils.checkDynamicProperties({'_cfgRequired':true})).to.be.true;
    expect(utils.checkDynamicProperties({'Value.Value':true})).to.be.true;
    expect(utils.checkDynamicProperties({'Value':{'ValueOptions':{}}})).to.be.true;
    expect(utils.checkDynamicProperties({'Value':{'eValue':1}})).to.be.true;
  });
});
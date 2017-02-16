const Common = require('../models/common');

let common = new Common();

describe('Common', function () {
    it('should return correct defaults', function () {
        // int, float, string, boolean, array, object, null, undefined
        expect(common.getDefault(1, 1)).to.be.a('number');
        expect(common.getDefault(1, 1)).to.be.equal(1);
        expect(common.getDefault(1.3, 1)).to.be.a('number');
        expect(common.getDefault(1.3, 1)).to.be.equal(1.3);
        expect(common.getDefault('1', 1)).to.be.a('number');
        expect(common.getDefault('1', 1)).to.be.equal(1);
        expect(common.getDefault(true, 1)).to.be.a('boolean');
        expect(common.getDefault(false, 1)).to.be.equal(false);
        expect(common.getDefault([], 1)).to.be.instanceof(Array);
        expect(common.getDefault([], 1)).to.deep.equal([]);
        expect(common.getDefault({}, 1)).to.be.a('object');
        expect(common.getDefault({}, 1)).to.deep.equal({});
        expect(common.getDefault(null, 1)).to.be.a('null');
        expect(common.getDefault(null, 1)).to.be.equal(null);
        expect(common.getDefault(undefined, 1)).to.be.equal(1);


        expect(common.getDefault(1, 1.345)).to.be.a('number');
        expect(common.getDefault(1, 1.345)).to.be.equal(1);
        expect(common.getDefault(1.3, 1.345)).to.be.a('number');
        expect(common.getDefault(1.3, 1.345)).to.be.equal(1.3);
        expect(common.getDefault('1', 1.345)).to.be.a('number');
        expect(common.getDefault('1', 1.345)).to.be.equal(1);
        expect(common.getDefault(true, 1.345)).to.be.a('boolean');
        expect(common.getDefault(false, 1.345)).to.be.equal(false);
        expect(common.getDefault([], 1.345)).to.be.instanceof(Array);
        expect(common.getDefault([], 1.345)).to.deep.equal([]);
        expect(common.getDefault({}, 1.345)).to.be.a('object');
        expect(common.getDefault({}, 1.345)).to.deep.equal({});
        expect(common.getDefault(null, 1.345)).to.be.a('null');
        expect(common.getDefault(null, 1.345)).to.be.equal(null);
        expect(common.getDefault(undefined, 1.345)).to.be.equal(1.345);


        expect(common.getDefault(1, 'test')).to.be.a('string');
        expect(common.getDefault(1, 'test')).to.be.equal('1');
        expect(common.getDefault(1.3, 'test')).to.be.a('string');
        expect(common.getDefault(1.3, 'test')).to.be.equal('1.3');
        expect(common.getDefault('1', 'test')).to.be.a('string');
        expect(common.getDefault('1', 'test')).to.be.equal('1');
        expect(common.getDefault(true, 'test')).to.be.a('string');
        expect(common.getDefault(false, 'test')).to.be.equal('false');
        expect(common.getDefault([], 'test')).to.be.a('string');
        expect(common.getDefault([], 'test')).to.equal('');
        expect(common.getDefault({}, 'test')).to.be.a('string');
        expect(common.getDefault({}, 'test')).to.deep.equal('[object Object]');
        expect(common.getDefault(null, 'test')).to.be.a('null');
        expect(common.getDefault(null, 'test')).to.be.equal(null);
        expect(common.getDefault(undefined, 'test')).to.be.equal('test');


        expect(common.getDefault(1, true)).to.be.a('number');
        expect(common.getDefault(1, true)).to.be.equal(1);
        expect(common.getDefault(1.3, true)).to.be.a('number');
        expect(common.getDefault(1.3, true)).to.be.equal(1.3);
        expect(common.getDefault('1', true)).to.be.a('string');
        expect(common.getDefault('1', true)).to.be.equal('1');
        expect(common.getDefault(true, true)).to.be.a('boolean');
        expect(common.getDefault(false, true)).to.be.equal(false);
        expect(common.getDefault('true', true)).to.be.a('boolean');
        expect(common.getDefault('false', true)).to.be.equal(false);
        expect(common.getDefault([], true)).to.be.instanceof(Array);
        expect(common.getDefault([], true)).to.deep.equal([]);
        expect(common.getDefault({}, true)).to.be.a('object');
        expect(common.getDefault({}, true)).to.deep.equal({});
        expect(common.getDefault(null, true)).to.be.a('null');
        expect(common.getDefault(null, true)).to.be.equal(null);
        expect(common.getDefault(undefined, true)).to.be.equal(true);


        expect(common.getDefault(1, [1, 'a'])).to.be.a('number');
        expect(common.getDefault(1, [1, 'a'])).to.be.equal(1);
        expect(common.getDefault(1.3, [1, 'a'])).to.be.a('number');
        expect(common.getDefault(1.3, [1, 'a'])).to.be.equal(1.3);
        expect(common.getDefault('1', [1, 'a'])).to.be.a('string');
        expect(common.getDefault('1', [1, 'a'])).to.be.equal('1');
        expect(common.getDefault(true, [1, 'a'])).to.be.a('boolean');
        expect(common.getDefault(false, [1, 'a'])).to.be.equal(false);
        expect(common.getDefault([], [1, 'a'])).to.be.instanceof(Array);
        expect(common.getDefault([], [1, 'a'])).to.deep.equal([]);
        expect(common.getDefault({}, [1, 'a'])).to.be.a('object');
        expect(common.getDefault({}, [1, 'a'])).to.deep.equal({});
        expect(common.getDefault(null, [1, 'a'])).to.be.a('null');
        expect(common.getDefault(null, [1, 'a'])).to.be.equal(null);
        expect(common.getDefault(undefined, [1, 'a'])).to.deep.equal([1, 'a']);

        let obj = {
            a: 1
        };
        expect(common.getDefault(1, obj)).to.be.a('number');
        expect(common.getDefault(1, obj)).to.be.equal(1);
        expect(common.getDefault(1.3, obj)).to.be.a('number');
        expect(common.getDefault(1.3, obj)).to.be.equal(1.3);
        expect(common.getDefault('1', obj)).to.be.a('number');
        expect(common.getDefault('1', obj)).to.be.equal(1);
        expect(common.getDefault(true, obj)).to.be.a('boolean');
        expect(common.getDefault(false, obj)).to.be.equal(false);
        expect(common.getDefault([], obj)).to.be.instanceof(Array);
        expect(common.getDefault([], obj)).to.deep.equal([]);
        expect(common.getDefault({}, obj)).to.be.a('object');
        expect(common.getDefault({}, obj)).to.deep.equal({});
        expect(common.getDefault(null, obj)).to.be.a('null');
        expect(common.getDefault(null, obj)).to.be.equal(null);
        expect(common.getDefault(undefined, obj)).to.deep.equal(obj);


        expect(common.getDefault(1, null)).to.be.a('number');
        expect(common.getDefault(1, null)).to.be.equal(1);
        expect(common.getDefault(1.3, null)).to.be.a('number');
        expect(common.getDefault(1.3, null)).to.be.equal(1.3);
        expect(common.getDefault('1', null)).to.be.a('string');
        expect(common.getDefault('1', null)).to.be.equal('1');
        expect(common.getDefault(true, null)).to.be.a('boolean');
        expect(common.getDefault(false, null)).to.be.equal(false);
        expect(common.getDefault([], null)).to.be.instanceof(Array);
        expect(common.getDefault([], null)).to.deep.equal([]);
        expect(common.getDefault({}, null)).to.be.a('object');
        expect(common.getDefault({}, null)).to.deep.equal({});
        expect(common.getDefault(null, null)).to.be.a('null');
        expect(common.getDefault(null, null)).to.be.equal(null);
        expect(common.getDefault(undefined, null)).to.deep.equal(null);


        expect(common.getDefault(1, undefined)).to.be.a('number');
        expect(common.getDefault(1, undefined)).to.be.equal(1);
        expect(common.getDefault(1.3, undefined)).to.be.a('number');
        expect(common.getDefault(1.3, undefined)).to.be.equal(1.3);
        expect(common.getDefault('1', undefined)).to.be.a('string');
        expect(common.getDefault('1', undefined)).to.be.equal('1');
        expect(common.getDefault(true, undefined)).to.be.a('boolean');
        expect(common.getDefault(false, undefined)).to.be.equal(false);
        expect(common.getDefault([], undefined)).to.be.instanceof(Array);
        expect(common.getDefault([], undefined)).to.deep.equal([]);
        expect(common.getDefault({}, undefined)).to.be.a('object');
        expect(common.getDefault({}, undefined)).to.deep.equal({});
        expect(common.getDefault(null, undefined)).to.be.a('null');
        expect(common.getDefault(null, undefined)).to.be.equal(null);
        expect(common.getDefault(undefined, undefined)).to.deep.equal(undefined);
    });

    it('should build 4 name segments', function () {
        let query = {};
        let data = {
            name1: 'Name1',
            name2: 123,
            name4: 'Name4'
        };
        common.addNamesToQuery(data, query, 'name1');
        common.addNamesToQuery(data, query, 'name2');
        common.addNamesToQuery(data, query, 'name3');
        common.addNamesToQuery(data, query, 'name4');

        expect(query.name1).to.deep.equal(new RegExp(/^Name1/i));
        expect(query.name2).to.deep.equal(new RegExp(/^123/i));
        expect(query.name3).to.equal('');
        expect(query.name4).to.deep.equal(new RegExp(/^Name4/i));

        query = {};
        data = {
            name1: 'Name1',
            name2: 123,
            name4: 'Name4'
        };
        common.addNamesToQuery(data, query, 'name1', 'Name1');
        common.addNamesToQuery(data, query, 'name2', 'Name2');
        common.addNamesToQuery(data, query, 'name3', 'Name3');
        common.addNamesToQuery(data, query, 'name4', 'Name4');

        expect(query.Name1).to.deep.equal(new RegExp(/^Name1/i));
        expect(query.Name2).to.deep.equal(new RegExp(/^123/i));
        expect(query.Name3).to.equal('');
        expect(query.Name4).to.deep.equal(new RegExp(/^Name4/i));
    });

    it('should test for Integer', function () {
        expect(common.isInt(1)).to.be.equal(true);
        expect(common.isInt(0)).to.be.equal(true);
        expect(common.isInt(0.0)).to.be.equal(true);
        expect(common.isInt(-1)).to.be.equal(true);
        expect(common.isInt(4294967295)).to.be.equal(true);

        expect(common.isInt(1.1)).to.be.equal(false);
        expect(common.isInt('3')).to.be.equal(false);
        expect(common.isInt(undefined)).to.be.equal(false);
        expect(common.isInt({})).to.be.equal(false);
        expect(common.isInt(null)).to.be.equal(false);
    });

    it('should test for Float', function () {
        expect(common.isFloat(1.1)).to.be.equal(true);
        expect(common.isFloat(0.1)).to.be.equal(true);
        expect(common.isFloat(-1.1)).to.be.equal(true);
        expect(common.isFloat(4294967295.4294967295)).to.be.equal(true);

        expect(common.isFloat(1)).to.be.equal(false);
        expect(common.isFloat(0)).to.be.equal(false);
        expect(common.isFloat(0.0)).to.be.equal(false);
        expect(common.isFloat(-1)).to.be.equal(false);
        expect(common.isFloat(4294967295)).to.be.equal(false);
        expect(common.isFloat('3')).to.be.equal(false);
        expect(common.isFloat(undefined)).to.be.equal(false);
        expect(common.isFloat({})).to.be.equal(false);
        expect(common.isFloat(null)).to.be.equal(false);
    });

    it('should test for Number', function () {
        expect(common.isNumber(1.1)).to.be.equal(true);
        expect(common.isNumber(0.1)).to.be.equal(true);
        expect(common.isNumber(-1.1)).to.be.equal(true);
        expect(common.isNumber(4294967295.4294967295)).to.be.equal(true);
        expect(common.isNumber(1)).to.be.equal(true);
        expect(common.isNumber(0)).to.be.equal(true);
        expect(common.isNumber(0.0)).to.be.equal(true);
        expect(common.isNumber(-1)).to.be.equal(true);
        expect(common.isNumber(4294967295)).to.be.equal(true);
        expect(common.isNumber('3')).to.be.equal(true);

        expect(common.isNumber(undefined)).to.be.equal(false);
        expect(common.isNumber({})).to.be.equal(false);
        expect(common.isNumber(null)).to.be.equal(false);
    });

    it('should set quality label', function () {
        let point = {
            _relDevice: 0,
            _relRMY: 0,
            _relPoint: 0,
            'COV Enable': {
                Value: false
            },
            'Alarm States': {
                Value: false
            },
            'Status Flags': {
                Value: false
            },
            'Quality Code Enable': {
                Value: false
            },
            'Alarms Off': {
                Value: false
            },
            'Control Pending': {
                Value: false
            },
            'Quality Label': ''
        };

        expect(common.setQualityLabel(point)['Quality Label']).to.be.equal('none');
    });
});

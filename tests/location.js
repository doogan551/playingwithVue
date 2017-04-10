let Location = require('../models/location.js');
let locationModel = new Location();

describe('Location Model', () => {
    // beforeEach(()=> {});
    it('should build meta info.', () => {
        let data = {};
        let parent = {};
        let meta = locationModel.buildMeta(data, parent);
        expect(meta.coords.lat).to.equal(0);

        parent = {
            coords: {
                lat: 1.23,
                long: 3.21
            },
            address: {
                street: 'test',
                city: 'testCity',
                zip: '01011'
            },
            description: 'aaaaa',
            tz: 'New_York'
        };
        meta = locationModel.buildMeta(data, parent);
        expect(meta.coords.lat).to.equal(1.23);
        expect(meta.coords.long).to.equal(3.21);
        expect(meta.address.street).to.equal('test');
        expect(meta.address.city).to.equal('testCity');
        expect(meta.address.zip).to.equal('01011');
        expect(meta.description).to.equal('aaaaa');
        expect(meta.tz).to.equal('New_York');

        data = {
            coords: {
                lat: 3.3333,
                long: 1.1111
            },
            address: {
                street: 'street',
                city: 'city',
                zip: 'zip'
            },
            description: 'description',
            tz: 'tz'
        };
        meta = locationModel.buildMeta(data, parent);
        expect(meta.coords.lat).to.equal(3.3333);
        expect(meta.coords.long).to.equal(1.1111);
        expect(meta.address.street).to.equal('street');
        expect(meta.address.city).to.equal('city');
        expect(meta.address.zip).to.equal('zip');
        expect(meta.description).to.equal('description');
        expect(meta.tz).to.equal('tz');
    });

    it('should recreate tags.', () => {
        let location = {
            display: 'disp',
            type: 'type',
            item: 'item',
            tags: []
        };

        locationModel.recreateTags(location);
        expect(location.tags).to.be.an('array');
        expect(location.tags.indexOf('disp')).to.be.at.least(0);
        expect(location.tags.indexOf('type')).to.be.at.least(0);
        expect(location.tags.indexOf('item')).to.be.at.least(0);
    });
});

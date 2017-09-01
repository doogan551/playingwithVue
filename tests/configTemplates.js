let Config = require('../public/js/lib/config.js');
let data;

describe('Config Templates', () => {
    beforeEach(() => {
        data = {
            '_id': 'a',
            '_pStatus': 1,
            'path': [],
            'parentNode': 0,
            'display': 'Marshall Space Flight Center1',
            'tags': [],
            'meta': {},
            'nodeType': 'Location',
            'nodeSubType': 'Site',
            'refNode': 0,
            'libraryId': 0
        };
    });
    it('should accept normal hierarchy model.', () => {
        try {
            let results = Config.Templates.checkAgainstTemplate(data);
            expect(results).to.equal(true);
        } catch (e) {
            expect(e).to.equal(undefined);
        }
    });

    it('should catch missing properties.', () => {
        delete data.display;
        try {
            let results = Config.Templates.checkAgainstTemplate(data);
            expect(results).to.equal(true);
        } catch (e) {
            expect(e.message).to.equal('Missing property on template > display');
        }
    });

    it('should catch undefined properties.', () => {
        data.display = undefined;
        try {
            let results = Config.Templates.checkAgainstTemplate(data);
            expect(results).to.equal(true);
        } catch (e) {
            expect(e.message).to.equal('Property is undefined > display');
        }
    });

    it('should catch extra properties.', () => {
        data.extra = '123';
        try {
            let results = Config.Templates.checkAgainstTemplate(data);
            expect(results).to.equal(true);
        } catch (e) {
            expect(e.message).to.equal('Has extra property > extra');
        }
    });
});

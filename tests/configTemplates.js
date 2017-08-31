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
    it('check for missing properties.', () => {
        let results;

        try{
            results = Config.Templates.checkAgainstTemplate(data);
        }catch(e) {
            expect(e).to.equal(undefined);
        }
        expect(results).to.equal(true);
    });
});

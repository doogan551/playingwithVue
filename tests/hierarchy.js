let Hierarchy = require('../models/hierarchy.js');
let hierarchyModel = new Hierarchy();

describe('hierarchy Model', () => {
    // beforeEach(()=> {});
    it('should build meta info.', () => {
        let data = {};
        let parent = {};
        let meta = hierarchyModel.buildMeta(data, parent);
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
        meta = hierarchyModel.buildMeta(data, parent);
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
        meta = hierarchyModel.buildMeta(data, parent);
        expect(meta.coords.lat).to.equal(3.3333);
        expect(meta.coords.long).to.equal(1.1111);
        expect(meta.address.street).to.equal('street');
        expect(meta.address.city).to.equal('city');
        expect(meta.address.zip).to.equal('zip');
        expect(meta.description).to.equal('description');
        expect(meta.tz).to.equal('tz');
    });

    it('should recreate tags.', () => {
        let node = {
            display: 'disp',
            type: 'type',
            item: 'item',
            meta: {
                description: ''
            },
            tags: []
        };

        hierarchyModel.recreateTags(node);
        expect(node.tags).to.be.an('array');
        expect(node.tags.indexOf('disp')).to.be.at.least(0);
        expect(node.tags.indexOf('type')).to.be.at.least(0);
        expect(node.tags.indexOf('item')).to.be.at.least(0);
    });

    it('should build parents.', () => {
        let locationParent = {
            display: 'disp',
            type: 'type',
            item: 'loc',
            _id: 1
        };
        let mechanicalParent = {
            display: 'disp',
            type: 'type',
            item: 'mech',
            _id: 2
        };

        let parents = hierarchyModel.buildParents(locationParent, mechanicalParent);
        expect(parents).to.be.an('array');
        expect(parents.length).to.be.equal(2);
        expect(parents[0].value).to.be.equal(1);
        expect(parents[1].value).to.be.equal(2);
    });

    it('should build single parent.', () => {
        let parent = {
            display: 'disp',
            type: 'type',
            item: 'loc',
            _id: 1
        };
        let item = 'Location';

        let newParent = hierarchyModel.buildParent(item, parent);
        expect(newParent).to.be.an('object');
        expect(newParent.value).to.be.equal(1);
        expect(newParent.item).to.be.equal(item);
    });

    it('should sort objects by path array length.', () => {
        let nodes = [{
            _id: 1,
            path: new Array(1)
        }, {
            _id: 4,
            path: new Array(4)
        }, {
            _id: 3,
            path: new Array(3)
        }, {
            _id: 2,
            path: new Array(2)
        }];

        nodes.sort(hierarchyModel.sortDescendants);
        expect(nodes).to.be.an('array');
        expect(nodes[0]._id).to.be.equal(1);
        expect(nodes[1]._id).to.be.equal(2);
        expect(nodes[2]._id).to.be.equal(3);
        expect(nodes[3]._id).to.be.equal(4);
    });

    it('should reorder path array.', () => {
        let node = {
            '_id': 3,
            'item': 'Location',
            'path': [{
                '_id': 2,
                'item': 'Location',
                'display': 'First',
                'hierarchyRefs': [{
                    'isReadOnly': false,
                    'display': '4220',
                    'value': 1,
                    'type': 'Building',
                    'isDisplayable': true,
                    'item': 'Location'
                },
                {
                    'isReadOnly': false,
                    'display': '',
                    'value': 0,
                    'type': '',
                    'isDisplayable': false,
                    'item': 'Mechanical'
                }
                ]
            },
            {
                '_id': 1,
                'item': 'Location',
                'display': '4220',
                'hierarchyRefs': [{
                    'isReadOnly': false,
                    'display': '',
                    'value': 0,
                    'type': '',
                    'isDisplayable': false,
                    'item': 'Location'
                },
                {
                    'isReadOnly': false,
                    'display': '',
                    'value': 0,
                    'type': '',
                    'isDisplayable': false,
                    'item': 'Mechanical'
                }
                ]
            }
            ]
        };

        hierarchyModel.orderPath('Location', node);
        expect(node.path).to.be.an('array');
        expect(node.path[0]._id).to.be.equal(1);
        expect(node.path[1]._id).to.be.equal(2);
    });

    it('should get graph lookup pipeline object.', () => {
        // from: this.collection,
        // startWith: '$hierarchyRefs.value',
        // connectFromField: 'hierarchyRefs.value',
        // connectToField: '_id',
        // as: 'path'

        let graph = hierarchyModel.getPathLookup();
        expect(graph).to.be.an('object');
        expect(graph.$graphLookup).to.be.an('object');
        expect(graph.$graphLookup.from).to.be.equal('hierarchy');
        expect(graph.$graphLookup.startWith).to.be.equal('$hierarchyRefs.value');
        expect(graph.$graphLookup.connectFromField).to.be.equal('hierarchyRefs.value');
        expect(graph.$graphLookup.connectToField).to.be.equal('_id');
        expect(graph.$graphLookup.as).to.be.equal('path');
    });

    it('should sort nodes.', () => {
        let bldg4220 = {
            _id: 1,
            display: '4220',
            parentLocId: 0
        };
        let Area1 = {
            _id: 2,
            display: 'Area 1',
            parentLocId: 1
        };
        let Area2 = {
            _id: 3,
            display: 'Area 2',
            parentLocId: 1
        };
        let Floor1 = {
            _id: 4,
            display: 'Floor 1',
            parentLocId: 2
        };
        let Floor2 = {
            _id: 5,
            display: 'Floor 2',
            parentLocId: 3
        };
        let Room101 = {
            _id: 6,
            display: 'Room 101',
            parentLocId: 2
        };
        let Room102 = {
            _id: 7,
            display: 'Room 102',
            parentLocId: 2
        };
        let Room201 = {
            _id: 8,
            display: 'Room 201',
            parentLocId: 5
        };
        let Room202 = {
            _id: 9,
            display: 'Room 202',
            parentLocId: 5
        };
        let nodes = [Floor1, Area1, bldg4220, Room101, Room202, Area2, Floor2, Room102, Room201];

        nodes = hierarchyModel.sortNodes(nodes);
        expect(nodes).to.be.an('array');
        expect(nodes.indexOf(bldg4220)).to.be.equal(0);
        expect(nodes.indexOf(Area1)).to.be.above(nodes.indexOf(bldg4220));
        expect(nodes.indexOf(Floor1)).to.be.above(nodes.indexOf(Area1));
        expect(nodes.indexOf(Room101)).to.be.above(nodes.indexOf(Floor1));
        expect(nodes.indexOf(Room102)).to.be.above(nodes.indexOf(Floor1));
        expect(nodes.indexOf(Area2)).to.be.above(nodes.indexOf(bldg4220));
        expect(nodes.indexOf(Floor2)).to.be.above(nodes.indexOf(Area2));
        expect(nodes.indexOf(Room201)).to.be.above(nodes.indexOf(Floor2));
        expect(nodes.indexOf(Room202)).to.be.above(nodes.indexOf(Floor2));
    });

    it('should re-assign ids.', () => {
        let bldg4220 = {
            _id: 1,
            id: 'a',
            display: '4220',
            parentLocId: 0
        };
        let Area1 = {
            _id: 2,
            id: 'b',
            display: 'Area 1',
            parentLocId: 'a'
        };
        let Area2 = {
            _id: 3,
            id: 'c',
            display: 'Area 2',
            parentLocId: 'a'
        };
        let Floor1 = {
            _id: 4,
            id: 'd',
            display: 'Floor 1',
            parentLocId: 'b'
        };
        let Floor2 = {
            _id: 5,
            id: 'e',
            display: 'Floor 2',
            parentLocId: 'c'
        };
        let Room101 = {
            _id: 6,
            id: 'f',
            display: 'Room 101',
            parentLocId: 'd'
        };
        let Room102 = {
            _id: 7,
            id: 'g',
            display: 'Room 102',
            parentLocId: 'd'
        };
        let Room201 = {
            _id: 8,
            id: 'h',
            display: 'Room 201',
            parentLocId: 'e'
        };
        let Room202 = {
            _id: 9,
            id: 'i',
            display: 'Room 202',
            parentLocId: 'e'
        };

        let nodes = [bldg4220, Area1, Area2, Floor1, Floor2, Room101, Room102, Room201, Room202];

        hierarchyModel.assignParentRefs(nodes);
        expect(bldg4220.parentLocId).to.be.equal(0);
        expect(Area1.parentLocId).to.be.equal(bldg4220._id);
        expect(Area2.parentLocId).to.be.equal(bldg4220._id);
        expect(Floor1.parentLocId).to.be.equal(Area1._id);
        expect(Floor2.parentLocId).to.be.equal(Area2._id);
        expect(Room101.parentLocId).to.be.equal(Floor1._id);
        expect(Room102.parentLocId).to.be.equal(Floor1._id);
        expect(Room201.parentLocId).to.be.equal(Floor2._id);
        expect(Room202.parentLocId).to.be.equal(Floor2._id);
    });
});

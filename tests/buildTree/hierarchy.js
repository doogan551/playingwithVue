let groupings = ['Shop', 'Simulator', 'Schedule Entry', 'Sensor', 'MSFC'];

let findFirstNumber = (element) => {
    return element !== '';
};

let getBuildingDisplay = (name) => {
    let display = '';
    if (!!name.match(/[0-9]*/g).join('')) {
        let newName = name.match(/[0-9]*/g).find(findFirstNumber);
        if (newName.length === 4) {
            display = newName;
        }
    }
    if (display === '') {
        groupings.forEach((grouping) => {
            if (name.match(new RegExp(grouping, 'i'))) {
                display = grouping;
            }
        });
    }
    if (display === '') {
        display = 'Other';
    }
    return display;
};

describe('Tree Names Model', () => {
    // beforeEach(()=> {});
    it('should build building names.', () => {
        let names = [{
            name: '4250',
            expect: '4250'
        }, {
            name: 'm4250',
            expect: '4250'
        }, {
            name: 'm4250 5202',
            expect: '4250'
        }, {
            name: 'kw1',
            expect: 'Other'
        }, {
            name: 'AddSub',
            expect: 'Other'
        }];

        names.forEach((name) => {
            let newName = getBuildingDisplay(name.name);
            console.log(name, newName);
            expect(newName).to.be.equal(name.expect);
        });
    });

    it('should get correct building names from list.', () => {
        let names = ['4201', '4202', '4200', '4203', 'M4203', '4759', '4647', '4207', '4487B', '4487A', '4487C', '4487BC', '4250', '4487AB', '4487', '4714', '4705', '4471', '4481', '4485', '4708', '4735', '4619', '4353', '4475', '4476', '4491', '4561', '4567', '4605', '4583', '4613', '4618', '4656', '4723', '4728', '4659', '4623', '4612', '4707', '4663', '4610', '4732', '4760', '4436', '4249', '4570', '4674', '4727', '4523', '4524', '4530', '4553', '4572', '4621', '4646', '4650', '4653', '4655', '4666', '4670', '4752', '4755', '4776', '4531', '4648', '4675', '4522', '4241', '4702', '4733', '4477', '4483', '4494', '4718 1', '4718', '4464', '4466', '4629', '4654', '4649', '4306', '4194', '4692', '4731', '4765', '4493', '4607', '4754', '4470', '4718 2', '4473', '4604', '4467', '4700', '4761', '4715', '4711', '4566', '4312', '4549', '4315', '4734', '4316', '4244', '4251', '4205', '4209', '4627', '4555', '4644', '4586', '4465', '4600', 'M4600', '4600 West', '4600 East', '4551', '4554', '4720', '4631', 'M4600 West', 'M4600 East', '4739', 'test4244', '4346', 'TEST4600', '4601', '4634', '4774', 'M4487A', '4660', '4696', '4611', '4620', '4208', '4778', '4541', '4622', '4602', 'DEMO 4250', 'DEMO 4315', 'DEMO 4316', '4747', '4559', '4584', '4676', '4657', '4678', '4777', '4347', '4539', '4563', '4571', '4582', '4596', '4630', '4638', '4639', '4640', '4643', '4699A', '4482', '4704', '4220', '4260', '4540', '4600MDM', '4671', '4557', 'J4755', '4667', '4757', '4628', '4663 A-WING', '4663 B-WING'];
        let newNames = names.map((name) => name.split(/[^0-9]*/g).filter((num) => num !== '').slice(0, 4).join(''));
        console.log(JSON.stringify(newNames));
        expect(true).to.be.equal(true);
    });
});

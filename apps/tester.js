let Tester = class Tester {
    test() {
        let method = () => {
            console.log(this);
        };
        method();
    }
    stcTest() {
        this.test();
        console.log('static');
    }
};

let Test2 = class Test2 {
    constructor() {
        // this.tester = new Tester();
    }
    testing() {
        Tester.stcTest();
        console.log('testing');
    }
};

let test2 = new Test2();
test2.testing();

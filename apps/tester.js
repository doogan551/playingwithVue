class Test {

    f1() {
        let state;
        let nums = [1, 2, 3];
        let tester = function (num) {
            console.log(state);
            return false;
        };
        for (var i = 0; i < 5; i++) {
            state = i;
            nums.filter(tester);
        }
    }
}

let test = new Test();
test.f1();

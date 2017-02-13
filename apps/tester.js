class Parent {
    constructor(coll) {
        this._coll = coll;
    }
    set coll(coll) {
        this._coll = coll;
    }
    get coll() {
        return this._coll;
    }
}

class Test extends Parent {
    constructor() {
        super('test');
        this.coll = 'as';
    }

    test() {
        console.log(this.coll);
    }
}

let test = new Test();
test.test();

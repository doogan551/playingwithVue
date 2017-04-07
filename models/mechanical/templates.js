class Equipment {
    constructor() {
        this.categories = [];
        this.equipment = [];
    }
}

class Category extends Equipment {
    constructor(category = '') {
        super();
        switch (category) {
            case 'Space':
                return new Space();
            default:
                break;
        }
    }
}

class VAV extends Equipment {
    constructor(category, type) {
        super(category);
    }

    buildOptions() {
        this.categories.push({
            space: new Category('Space')
        });
        console.log(this);
    }
}

class Space extends Category {
    constructor(category, type) {
        super(category);
        this.equipment.push({
            temperature: new Temperature()
        });
    }
}

class Temperature extends Equipment {
    constructor(category, type) {
        super(category);
    }
}

module.exports = {
    VAV: VAV
};

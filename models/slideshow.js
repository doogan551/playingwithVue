const Slideshow = class Slideshow {

    get(data, cb) {
        const point = new Point();
        let upi = parseInt(data.id, 10);

        point.getOne({
            query: {
                _id: upi
            },
            fields: {
                Slides: 1,
                'Close On Complete.Value': 1,
                'Continuous Show.Value': 1,
                'Maximize Displays.Value': 1,
                'Repeat Count.Value': 1,
                name1: 1,
                name2: 1,
                name3: 1,
                name4: 1
            }
        }, cb);
    }
};

module.exports = Slideshow;
const Point = require('./point');

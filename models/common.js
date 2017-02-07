let Common = class Common {

    /**
     * Building name search
     *
     * @param {Object} data    request obj containing query info
     * @param {Object} query   query object being build
     * @param {String} segment which segment (name1-4)
     * @return {undefined} undefined
     */
    addNamesToQuery(data, query, segment) {
        if (!!data.hasOwnProperty(segment)) {
            if (data[segment] !== null) {
                query[segment] = new RegExp('^' + data[segment], 'i');
            } else {
                query[segment] = '';
            }
        } else {
            query[segment] = '';
        }
    }
};

module.exports = Common;

var PropValue = function (prop, value) {
    return {
        Name: prop,
        Value: ko.observable(value)
    }
};

var KeyVal = function (key, val) {
    this.key = key;
    this.val = val;
};

Array.prototype.indexOfKey = function(key) {
    for (var i = 0; i < this.length; i++)
        if (this[i].key === key)
            return i;
    return -1;
}
Array.prototype.indexOfVal = function(val) {
    for (var i = 0; i < this.length; i++)
        if (this[i].val === val)
            return i;
    return -1;
};

Array.prototype.clear = function() {
    while (this.length > 0) {
        this.pop();
    }
};

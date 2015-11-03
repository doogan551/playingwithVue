var Utility = require('../models/utility');
var config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);

exports.getBlockTypes = function (cb) {
  var criteria = {
    collection: 'points',
    query: {
      SequenceData: {
        $exists: true
      }
    },
    fields: {
      "SequenceData.Sequence.Block": 1
    }
  };

  Utility.get(criteria, function (err, results) {
    var c;
    var cc;
    var len = results.length;
    var row;
    var blockType;
    var blockTypes = {};

    for (c = 0; c < len; c++) {
      row = results[c].SequenceData.Sequence.Block;
      for (cc = 0; cc < row.length; cc++) {
        blockType = row[cc].data.BlockType;
        blockTypes[blockType] = blockTypes[blockType] || true;
      }
    }

    cb({
      err: err,
      types: blockTypes
    });
  });
};


exports.doRefreshSequence = function (data, cb) {
  var _id = data.sequenceID;
  var criteria = {
    collection: 'points',
    query: {
      _id: _id
    },
    updateObj: {
      $set: {
        '_pollTime': new Date().getTime()
      }
    }
  };

  Utility.update(criteria, function (err, results) {
    if (err) {}
  });
};

exports.doUpdateSequence = function (data, cb) {
  var name = data.sequenceName;
  var sequenceData = data.sequenceData;
  var criteria = {
    collection: 'points',
    query:{'Name': name},
    updateObj:{
      $set:{
        'SequenceDate': sequenceData
      }
    }
  };

  Utility.update(criteria, function (err, results) {
    if (updateErr) {
      cb('Error: ' + updateErr.err);
    } else {
      cb('success');
    }
  });
};

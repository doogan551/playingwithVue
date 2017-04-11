{"parentLocId":0, "parentMechId":0, "type":"Building", "display":"4220", "item":"Location"}
{"parentLocId":1, "parentMechId":0, "type":"Floor", "display":"First", "item":"Location"}
{"parentLocId":2, "parentMechId":0, "type":"Room", "display":"1000", "item":"Location"}
{"parentLocId":2, "parentMechId":0, "type":"VAV", "display":"VAV 1000", "item":"Mechanical"}
{"parentLocId":3, "parentMechId":4, "type":"Space", "display":"Space", "item":"Mechanical"}
{"parentLocId":3, "parentMechId":5, "type":"Temperature", "display":"SPT", "item":"Mechanical"}

var tags = ['Space','4220','Temperature'];

db.hierarchy.aggregate([
    {$graphLookup:{
        from: 'hierarchy',
        startWith: '$hierarchyRefs.value',
        connectFromField: 'hierarchyRefs.value',
        connectToField: '_id',
        as: 'path'
    }},
    {$unwind:{
       path:"$path"
    }},
    {$project:{
      'tags':{$concatArrays:["$tags", "$path.tags"]},
      'display':1,
      'item':1,
      'type':1
    }},
    {$unwind:{
       path:"$tags"
    }},
    {$group:{
      _id:"$_id",
      display:{$first:"$display"},
      type:{$first:"$type"},
      item:{$first:"$item"},
      tags:{$addToSet:"$tags"}
    }},
    {$match:{
      tags:{$all:tags}
    }}
]);
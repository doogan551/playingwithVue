{"parentLocId":0, "parentMechId":0, "type":"Building", "display":"4220", "item":"Location"}
{"parentLocId":1, "parentMechId":0, "type":"Floor", "display":"First", "item":"Location"}
{"parentLocId":2, "parentMechId":0, "type":"Room", "display":"1000", "item":"Location"}
{"parentLocId":2, "parentMechId":0, "type":"VAV", "display":"VAV 1000", "item":"Mechanical"}
{"parentLocId":3, "parentMechId":4, "type":"Space", "display":"Space", "item":"Mechanical"}
{"parentLocId":3, "parentMechId":5, "type":"Temperature", "display":"SPT", "item":"Mechanical"}

{"parentLocId":"b", "parentMechId":0, "type":"Floor", "display":"f1", "item":"Location", "id":"c"},
{"parentLocId":"a", "parentMechId":0, "type":"Area", "display":"a1", "item":"Location", "id":"b"},
{"parentLocId":0, "parentMechId":0, "type":"Building", "display":"4220", "item":"Location", "id":"a"},
{"parentLocId":"c", "parentMechId":0, "type":"Room", "display":"r11", "item":"Location", "id":"d"},
{"parentLocId":"g", "parentMechId":0, "type":"Room", "display":"r22", "item":"Location", "id":"i"}
{"parentLocId":"a", "parentMechId":0, "type":"Area", "display":"a2", "item":"Location", "id":"f"},
{"parentLocId":"f", "parentMechId":0, "type":"Floor", "display":"f2", "item":"Location", "id":"g"},
{"parentLocId":"c", "parentMechId":0, "type":"Room", "display":"r12", "item":"Location", "id":"e"},
{"parentLocId":"g", "parentMechId":0, "type":"Room", "display":"r21", "item":"Location", "id":"h"}


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
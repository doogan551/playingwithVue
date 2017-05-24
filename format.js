{ 
    "Name" : "Weather", 
    "Cooling Degree Days Point" : NumberInt(41336), 
    "Heating Degree Days Point" : NumberInt(41324), 
    "Outside Air Temperature Point" : NumberInt(65696)
}

H4476_RM110_RH

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
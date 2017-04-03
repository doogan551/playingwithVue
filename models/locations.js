//find all rooms with 2 in a field
db.locations.find({$text:{$search:'\"room\" \"2\"'}})

// find all rooms under a floor
db.locations.aggregate([
	{$match:{type:'room'}},
	{$graphLookup:{
		from: 'locations',
		startWith: '$Location Ref.Value',
		connectFromField: 'Location Ref.Value',
		connectToField: '_id',
		as: 'path',
		restrictSearchWithMatch: {}
	}},
	{$project:{
		item:1, 
		type:1, 
		display:1, 
		path:"$path",
		parent: '$Location Ref.Value'
	}}, 
	{$match:{
		"path.type":'floor'
	}},
	{$project:{
		item:1, 
		type:1, 
		display:1
	}}
]);


//find all temperature points in a room
db.locations.aggregate([
	{$match:{
		$text:{$search:'room'}
	}},
	{$graphLookup:{
		from: 'locations',
		startWith: '$Location Ref.Value',
		connectFromField: 'Location Ref.Value',
		connectToField: '_id',
		as: 'path'
	}}, 
	{$match:{
		"path.type":'floor'
	}},
	{$lookup:{
		from: 'points',
		localField: '_id',
		foreignField: 'Location Ref.Value',
		as: 'points'
	}},
	{$match:{
		points:{$ne:[]}
	}}
]);

// find full path of location
db.locations.aggregate([
	{$match:{_id:7}},
	{$graphLookup:{
		from: 'locations',
		startWith: '$Location Ref.Value',
		connectFromField: 'Location Ref.Value',
		connectToField: '_id',
		as: 'path',
		restrictSearchWithMatch: {}
	}},
	{$project:{
		item:1, 
		type:1, 
		display:1, 
		path:"$path",
		parent: '$Location Ref.Value'
	}}
]);
// need to rearrange path array (order not guaranteed)

// find all direct children of location
db.locations.find({'Location Ref.Value':2})

// move location under new parent
// find new parent
db.locations.find({'display':'floor/1'})
// copy id
db.locations.update({'display':'room/3'}, {$set:{'Location Ref':{
    "AppIndex" : 0, 
    "Display" : "floor/1", 
    "Value" : ObjectId("58de712814ae9a5915106ba0"), 
    "isReadOnly" : false, 
    "isDisplayable" : true
}}})
db.locations.find({'display':'room/3'})

// new location under existing parent
db.locations.insert({ 
    "item" : "location", 
    "type" : "room", 
    "display" : "room/4", 
    "tags" : {
        "coords" : {
            "lat" : "36.118167", 
            "long" : "-80.654063"
        }, 
        "address" : {
            "street" : "100 Woodlyn Dr.", 
            "city" : "Yadkinville", 
            "zip" : "27055"
        }, 
        "description" : "Dorsett Technologies, Inc.", 
        "tz" : "New_York"
    }, 
    "Location Ref" : {
        "AppIndex" : NumberInt(0), 
        "Display" : "area/1", 
        "Value" : ObjectId("58de712814ae9a5915106ba1"), 
        "isReadOnly" : false, 
        "isDisplayable" : true
    }, 
    "Mechanical Refs" : [

    ]
});

// delete parent location and remove children
db.locations.remove({display:'floor/1'})
db.locations.aggregate([
	{$graphLookup:{
		from: 'locations',
		startWith: '$Location Ref.Value',
		connectFromField: 'Location Ref.Value',
		connectToField: '_id',
		as: 'path',
		restrictSearchWithMatch: {}
	}},
	{$project:{
		item:1, 
		type:1, 
		display:1, 
		path:"$path"
	}}, 
	{$match:{
		"path.display":'floor/1'
	}}
]);
// delete returned results
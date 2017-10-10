
db.points.distinct('name1', {'Point Type': {'$exists': 1}, 'name1': {'$exists': 1}, 'name2': {'$ne': ''}});
db.points.find({'name1': '4194', 'name2': 'DXAC1', 'name3': 'OSTOSP', 'Point Type': {'$exists': 1}, 'name4': {'$ne': ''}});
db.points.count({_path: {$exists: 1}});
db.points.count({'Point Type.Value': 'Schedule Entry'});
db.points.count({nodeType: 'Location'});
db.points.remove({nodeType: 'Location'});
db.points.update({}, {$unset: {display: 1, parentNode: 1}}, {multi: true});
db.points.distinct('Point Type.Value', {name1: {$exists: false}});
//db.points.remove({_id:{$nin:[36700161, 36700160]}})

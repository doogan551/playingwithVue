[{
    '$match': {
        '$and': [{
            'path': {
                '$all': [{}]
            }
        }, {
            'Point Type.Value': {
                '$in': ['Accumulator', 'Alarm Status', 'Analog Input', 'Analog Output', 'Analog Selector', 'Analog Value', 'Average', 'Binary Input', 'Binary Output', 'Binary Selector', 'Binary Value', 'Comparator', 'Delay', 'Device', 'Digital Logic', 'Display', 'Economizer', 'Enthalpy', 'Lift Station', 'Logic', 'Math', 'Multiplexer', 'MultiState Value', 'Optimum Start', 'Program', 'Proportional', 'Ramp', 'Remote Unit', 'Report', 'Schedule', 'Script', 'Select Value', 'Sensor', 'Sequence', 'Setpoint Adjust', 'Slide Show', 'Totalizer', 'VAV']
            }
        }]
    }
}, {
    '$limit': 200
}, {
    '$limit': 200
}, {
    '$project': {
        '_id': 1,
        'pointType': '$Point Type.Value',
        'path': 1,
        'display': 1,
        'parentNode': 1
    }
}];

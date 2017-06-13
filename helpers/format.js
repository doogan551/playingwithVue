var nodes = [
{'refs': [{'value': 0, 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Site', 'display': 'MSFC', 'item': 'Location', 'id': 'a', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'a', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Building', 'display': '4220', 'item': 'Location', 'id': 'b', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'b', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Floor', 'display': 'Floor 1', 'item': 'Location', 'id': 'c', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'c', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}, {'value': 'i', 'item': 'Location', 'categories': [], 'primary': false, 'isServedBy': false}], 'type': 'Room', 'display': 'Room 101', 'item': 'Location', 'id': 'd', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'd', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}, {'value': 'f', 'item': 'Mechanical', 'categories': ['Space'], 'primary': false, 'isServedBy': false}, {'value': 'v', 'item': 'Mechanical', 'categories': ['Return Air'], 'primary': false, 'isServedBy': false}], 'type': 'Point', 'display': 'Temperature A', 'item': 'Mechanical', 'id': 'e', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Air', 'Sensor']}},
{'refs': [{'value': 'd', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Equipment', 'display': 'VAV (1101)', 'item': 'Mechanical', 'id': 'f', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}},
{'refs': [{'value': 'f', 'item': 'Mechanical', 'categories': ['Space', 'Temperature'], 'primary': true, 'isServedBy': false}], 'type': 'Point', 'display': 'Cooling Setpoint', 'item': 'Mechanical', 'id': 'g', 'systemTags': {'properties': ['Cooling Setpoint'], 'qualifiers': ['Air', 'Sensor']}},
{'refs': [{'value': 'f', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}], 'type': 'Point', 'display': 'Temperature E', 'item': 'Mechanical', 'id': 'h', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Air', 'Sensor']}},
{'refs': [{'value': 'c', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Area', 'display': 'HVAC Zone 1', 'item': 'Location', 'id': 'i', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'b', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Floor', 'display': 'Floor 2', 'item': 'Location', 'id': 'j', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'j', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}, {'value': 'n', 'item': 'Location', 'categories': [], 'primary': false, 'isServedBy': false}], 'type': 'Room', 'display': 'Room 202', 'item': 'Location', 'id': 'k', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'k', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Equipment', 'display': 'VAV (2202)', 'item': 'Mechanical', 'id': 'l', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}},
{'refs': [{'value': 'l', 'item': 'Mechanical', 'categories': ['Space'], 'primary': true, 'isServedBy': false}], 'type': 'Point', 'display': 'Temperature B', 'item': 'Mechanical', 'id': 'm', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Air', 'Sensor']}},
{'refs': [{'value': 'j', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Area', 'display': 'HVAC Zone 2', 'item': 'Location', 'id': 'n', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'j', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Room', 'display': 'Room 222', 'item': 'Location', 'id': 'o', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'o', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Equipment', 'display': 'VAV (2222)', 'item': 'Mechanical', 'id': 'p', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}},
{'refs': [{'value': 'p', 'item': 'Mechanical', 'categories': ['Space'], 'primary': true, 'isServedBy': false}], 'type': 'Point', 'display': 'Temperature C', 'item': 'Mechanical', 'id': 'q', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Air', 'Sensor']}},
{'refs': [{'value': 'l', 'item': 'Mechanical', 'categories': ['Space', 'Temperature'], 'primary': true, 'isServedBy': false}], 'type': 'Point', 'display': 'Cooling Adjust Setpoint', 'item': 'Mechanical', 'id': 'r', 'systemTags': {'properties': ['Cooling Adjust Setpoint'], 'qualifiers': ['Air', 'Sensor']}},
{'refs': [{'value': 'j', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Equipment', 'display': 'VAV (2001)', 'item': 'Mechanical', 'id': 's', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}},
{'refs': [{'value': 's', 'item': 'Mechanical', 'categories': ['Space', 'Temperature'], 'primary': true, 'isServedBy': false}], 'type': 'Point', 'display': 'Heating Setpoint', 'item': 'Mechanical', 'id': 't', 'systemTags': {'properties': ['Heating Setpoint'], 'qualifiers': ['Air', 'Sensor']}},
{'refs': [{'value': 'b', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Floor', 'display': 'Penthouse', 'item': 'Location', 'id': 'u', 'systemTags': {'properties': [], 'qualifiers': []}},
{'refs': [{'value': 'u', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Equipment', 'display': 'AHU 1', 'item': 'Mechanical', 'id': 'v', 'systemTags': {'properties': ['AHU'], 'qualifiers': ['Equipment']}},
{'refs': [{'value': 'f', 'item': 'Mechanical', 'categories': ['Outside Air'], 'primary': true, 'isServedBy': false}], 'type': 'Point', 'display': 'Temperature D', 'item': 'Mechanical', 'id': 'w', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Air', 'Sensor']}},


{'refs': [{'value': 'a', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}], 'type': 'Building', 'display': '5050', 'item': 'Location', 'id': 'aaa', 'systemTags': {'properties': [], 'qualifiers': []}},
{'type': 'Floor', 'display': '1st', 'item': 'Location', 'id': 'aab', 'systemTags': {'properties': [], 'qualifiers': []}, 'refs': [{'value': 'aaa', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'type': 'Room', 'display': '1001', 'item': 'Location', 'id': 'aac', 'systemTags': {'properties': [], 'qualifiers': []}, 'refs': [{'value': 'aab', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'type': 'Equipment', 'display': 'VAV (1001)', 'item': 'Mechanical', 'id': 'aad', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'aac', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'type': 'Point', 'display': 'Temperature (1001-Temp1)', 'item': 'Mechanical', 'id': 'aae', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aad', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'type': 'Point', 'display': 'Humidity (1001-Hum1)', 'item': 'Mechanical', 'id': 'aaf', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aad', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'type': 'Point', 'display': 'CO2 (1001-IAQ1)', 'item': 'Mechanical', 'id': 'aag', 'systemTags': {'properties': ['CO2'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aad', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'type': 'Point', 'display': 'Temperature (1001-Temp2)', 'item': 'Mechanical', 'id': 'aah', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aad', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'type': 'Point', 'display': 'Flow (1001-Flow1)', 'item': 'Mechanical', 'id': 'aai', 'systemTags': {'properties': ['Flow'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aad', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'type': 'Equipment', 'display': 'Fan (1001-Fan1)', 'item': 'Mechanical', 'id': 'aaj', 'systemTags': {'properties': ['Fan'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'aad', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'type': 'Point', 'display': 'Status (1001-Fan1-Status1)', 'item': 'Mechanical', 'id': 'aak', 'systemTags': {'properties': ['Status'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aaj', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'type': 'Point', 'display': 'Command (1001-Fan1-Command1)', 'item': 'Mechanical', 'id': 'aal', 'systemTags': {'properties': ['Command'], 'qualifiers': ['Control']}, 'refs': [{'value': 'aaj', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},

{'id': 'aam', 'display': '1002', 'type': 'Room', 'item': 'Location', 'systemTags': {'properties': [], 'qualifiers': []}, 'refs': [{'value': 'aab', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'aan', 'display': 'VAV (1002)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'aam', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'aao', 'display': 'Temperature (1002-Temp1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aan', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'aap', 'display': 'Humidity (1002-Hum1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aan', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'aaq', 'display': 'CO2 (1002-IAQ1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['CO2'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aan', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'aar', 'display': 'Temperature (1002-Temp2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aan', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'aas', 'display': 'Flow (1002-Flow1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Flow'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aan', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'aat', 'display': 'Fan (1002-Fan1)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['Fan'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'aan', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'aau', 'display': 'Status (1002-Fan1-Status1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Status'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aat', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'aav', 'display': 'Command (1002-Fan1-Command1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Command'], 'qualifiers': ['Control']}, 'refs': [{'value': 'aat', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},


{'id': 'aaw', 'display': '1003', 'type': 'Room', 'item': 'Location', 'systemTags': {'properties': [], 'qualifiers': []}, 'refs': [{'value': 'aab', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'aax', 'display': 'VAV (1003)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'aaw', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'aay', 'display': 'Temperature (1003-Temp1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aax', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'aaz', 'display': 'Humidity (1003-Hum1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aax', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'aba', 'display': 'CO2 (1003-IAQ1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['CO2'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aax', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abb', 'display': 'Temperature (1003-Temp2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aax', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abc', 'display': 'Flow (1003-Flow1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Flow'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'aax', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abd', 'display': 'Fan (1003-Fan1)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['Fan'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'aax', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abe', 'display': 'Status (1003-Fan1-Status1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Status'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abd', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abf', 'display': 'Command (1003-Fan1-Command1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Command'], 'qualifiers': ['Control']}, 'refs': [{'value': 'abd', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},


{'id': 'abg', 'display': '1004', 'type': 'Room', 'item': 'Location', 'systemTags': {'properties': [], 'qualifiers': []}, 'refs': [{'value': 'aab', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abh', 'display': 'VAV (1004)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'abg', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abi', 'display': 'Temperature (1004-Temp1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abh', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abj', 'display': 'Humidity (1004-Hum1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abh', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abk', 'display': 'CO2 (1004-IAQ1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['CO2'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abh', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abl', 'display': 'Temperature (1004-Temp2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abh', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abm', 'display': 'Flow (1004-Flow1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Flow'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abh', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abn', 'display': 'Fan (1004-Fan1)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['Fan'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'abh', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abo', 'display': 'Status (1004-Fan1-Status1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Status'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abn', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abp', 'display': 'Command (1004-Fan1-Command1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Command'], 'qualifiers': ['Control']}, 'refs': [{'value': 'abn', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},

{'id': 'abq', 'display': '1005', 'type': 'Room', 'item': 'Location', 'systemTags': {'properties': [], 'qualifiers': []}, 'refs': [{'value': 'aab', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abr', 'display': 'VAV (1005)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['VAV'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'abq', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abs', 'display': 'Temperature (1005-Temp1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abr', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abt', 'display': 'Humidity (1005-Hum1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abr', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abu', 'display': 'CO2 (1005-IAQ1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['CO2'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abr', 'item': 'Mechanical', 'categories': ['Space Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abv', 'display': 'Temperature (1005-Temp2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abr', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abw', 'display': 'Flow (1005-Flow1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Flow'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abr', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'abx', 'display': 'Fan (1005-Fan1)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['Fan'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'abr', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'aby', 'display': 'Status (1005-Fan1-Status1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Status'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'abx', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'abz', 'display': 'Command (1005-Fan1-Command1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Command'], 'qualifiers': ['Control']}, 'refs': [{'value': 'abx', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},

{'id': 'cca', 'display': 'Penthouse', 'type': 'Floor', 'item': 'Location', 'systemTags': {'properties': [], 'qualifiers': []}, 'refs': [{'value': 'aaa', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'ccb', 'display': 'AHU (1)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['AHU'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'cca', 'item': 'Location', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'ccc', 'display': 'Temperature (AHU1-Temp1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccd', 'display': 'High Static (AHU1-HS1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['High Static'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'cce', 'display': 'Static Pressure (AHU1-StPr1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Static Pressure'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccf', 'display': 'Humidity (AHU1-Hum1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccg', 'display': 'Humidifier (AHU1-Humidifier1)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidifier'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Supply Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'cch', 'display': 'Enable (AHU1-Humidifier1-Enable1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Enable'], 'qualifiers': ['Control']}, 'refs': [{'value': 'ccg', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'cci', 'display': 'Control (AHU1-Humidifier1-Control1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Control'], 'qualifiers': ['Control']}, 'refs': [{'value': 'ccg', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'ccj', 'display': 'Temperature (AHU1-Temp2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Return Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'cck', 'display': 'Static Pressure (AHU1-StPr3)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Static Pressure'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Return Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccl', 'display': 'Humidity (AHU1-Hum2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Return Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccm', 'display': 'CO2 (AHU1-CO21)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['CO2'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Return Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccn', 'display': 'Flow (AHU1-Flow1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Flow'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Return Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'cco', 'display': 'Damper (AHU1-Damper1)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['Damper'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Return Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccp', 'display': 'Status (AHU1-Damper1-Status1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Status'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'cco', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'ccq', 'display': 'Control (AHU1-Damper1-Control1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Control'], 'qualifiers': ['Control']}, 'refs': [{'value': 'cco', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'ccr', 'display': 'Temperature (AHU1-Temp3)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Mixed Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccs', 'display': 'Freeze Limit (AHU1-FrzLimit1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Freeze Limit'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Mixed Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'cct', 'display': 'Filter Pressure (AHU1-FP1)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Filter Pressure'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Mixed Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccu', 'display': 'Temperature (AHU1-Temp4)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Temperature'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Outside Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccv', 'display': 'CO2 (AHU1-CO22)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['CO2'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Outside Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccw', 'display': 'Static Pressure (AHU1-StPr3)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Static Pressure'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Outside Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccx', 'display': 'Humidity (AHU1-Hum3)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Humidity'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Outside Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccy', 'display': 'Flow (AHU1-Flow2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Flow'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Outside Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'ccz', 'display': 'Damper (AHU1-Damper2)', 'type': 'Equipment', 'item': 'Mechanical', 'systemTags': {'properties': ['Damper'], 'qualifiers': ['Equipment']}, 'refs': [{'value': 'ccb', 'item': 'Mechanical', 'categories': ['Outside Air'], 'primary': true, 'isServedBy': false}]},
{'id': 'cda', 'display': 'Status (AHU1-Damper2-Status2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Status'], 'qualifiers': ['Sensor']}, 'refs': [{'value': 'ccz', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]},
{'id': 'cdb', 'display': 'Control (AHU1-Damper2-Control2)', 'type': 'Point', 'item': 'Mechanical', 'systemTags': {'properties': ['Control'], 'qualifiers': ['Control']}, 'refs': [{'value': 'ccz', 'item': 'Mechanical', 'categories': [], 'primary': true, 'isServedBy': false}]}
];

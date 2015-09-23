var gplJson1 = {
    "Sequence": {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema",
        "xmlns:xp": "http://ns.Dorsett.com/XMLInfoDoc",
        "xsi:SchemaLocation": "http://ns.Dorsett.com/XMLInfoDoc/XMLInfoDocSchema.xsd",
        "Legacy": "true",
        "IconVersion": "2",
        "Height": "565",
        "Width": "953",
        "ReviewLevel": "6",
        "ModifyLevel": "4",
        "GroupUPI": "11",
        "DeviceUPI": "20876",
        "DeviceID": "33554441",
        "DefaultUpdateInterval": "10",
        "DefaultControllerID": "33",
        "DefaultLabelVisible": "false",
        "OldDeviceUPI": "20876",
        "Block": [{
            "BlockType": "FindSmallest",
            "Left": "740",
            "Name": "MathBlock3",
            "Top": "230",
            "UPI": "683317",
            "Label": "Math3",
            "ConnectionCount": "3",
            "Precision": "3.1",
            "ZIndex": "48",
            "PresentValueVisible": "true",
            "Connection": [{
                "LinkIndex": "1",
                "Anchor": "GPLLine60",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "2",
                "Anchor": "GPLLine61",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "3",
                "Anchor": "GPLLine59",
                "LinkPointType": "Source"
            }],
            "PresentValueFont": {
                "Bold": "true"
            }
        }, {
            "BlockType": "Output",
            "Left": "540",
            "Name": "MathBlock3",
            "Top": "330",
            "UPI": "683317",
            "Label": "Math3",
            "ConnectionCount": "3",
            "Precision": "3.1",
            "ZIndex": "48",
            "PresentValueVisible": "true",
            "Connection": [{
                "LinkIndex": "1",
                "Anchor": "GPLLine60",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "2",
                "Anchor": "GPLLine61",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "3",
                "Anchor": "GPLLine59",
                "LinkPointType": "Source"
            }],
            "PresentValueFont": {
                "Bold": "true"
            }
        }, {
            "BlockType": "Input",
            "Left": "400",
            "Name": "MathBlock3",
            "Top": "330",
            "UPI": "683317",
            "Label": "Math3",
            "ConnectionCount": "3",
            "Precision": "3.1",
            "ZIndex": "48",
            "PresentValueVisible": "true",
            "Connection": [{
                "LinkIndex": "1",
                "Anchor": "GPLLine60",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "2",
                "Anchor": "GPLLine61",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "3",
                "Anchor": "GPLLine59",
                "LinkPointType": "Source"
            }],
            "PresentValueFont": {
                "Bold": "true"
            }
        }, {            
            "BlockType": "Multiply",
            "Left": "460",
            "Name": "MathBlock3",
            "Top": "370",
            "UPI": "683317",
            "Label": "Math3",
            "ConnectionCount": "3",
            "Precision": "3.1",
            "ZIndex": "48",
            "PresentValueVisible": "true",
            "Connection": [{
                "LinkIndex": "1",
                "Anchor": "GPLLine60",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "2",
                "Anchor": "GPLLine61",
                "LinkPointType": "Target"
            }, {
                "LinkIndex": "3",
                "Anchor": "GPLLine59",
                "LinkPointType": "Source"
            }],
            "PresentValueFont": {
                "Bold": "true"
            }
        }],
        "Line": [{
        //     "Name": "GPLLine2",
        //     "SourceLinkPoint": "InputBlock4",
        //     "TargetLinkPoint": "PIBlock5",
        //     "ZIndex": "64",
        //     "HandleCount": "3",
        //     "Handle": [{
        //         "x": "540",
        //         "y": "340"
        //     }, {
        //         "x": "450",
        //         "y": "355"
        //     }, {
        //         "x": "460",
        //         "y": "380"
        //     }]
        // }, {
        //     "Name": "GPLLine2",
        //     "SourceLinkPoint": "InputBlock4",
        //     "TargetLinkPoint": "PIBlock5",
        //     "ZIndex": "64",
        //     "HandleCount": "3",
        //     "Handle": [{
        //         "x": "420",
        //         "y": "340"
        //     }, {
        //         "x": "500",
        //         "y": "360"
        //     }, {
        //         "x": "500",
        //         "y": "425"
        //     }, {
        //         "x": "476",
        //         "y": "411"
        //     }]
        // }, {
            "Handle": [{
                "x": "490",
                "y": "392"
            }, {
                "x": "680",
                "y": "280"
            }, {
                "x": "740",
                "y": "260"
            }]
        }]
    }
};

var gplJson = {
  "Sequence": {
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema",
    "xmlns:xp": "http://ns.Dorsett.com/XMLInfoDoc",
    "xsi:SchemaLocation": "http://ns.Dorsett.com/XMLInfoDoc/XMLInfoDocSchema.xsd",
    "Legacy": "true",
    "IconVersion": "2",
    "Height": "565",
    "Width": "953",
    "ReviewLevel": "6",
    "ModifyLevel": "4",
    "GroupUPI": "11",
    "DeviceUPI": "20876",
    "DeviceID": "33554441",
    "DefaultUpdateInterval": "10",
    "DefaultControllerID": "33",
    "DefaultLabelVisible": "false",
    "OldDeviceUPI": "20876",
    "Block": [
      {
        "BlockType": "Constant",
        "Left": "710",
        "Name": "ConstantBlock1",
        "Top": "310",
        "UPI": "0",
        "Label": "Constant1",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "67",
        "PresentValueVisible": "true",
        "Type": "1",
        "xp:Value": "1.10000002384186",
        "LinkPointType": "9",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine61",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "250",
        "Name": "InputBlock6",
        "Top": "190",
        "UPI": "683294",
        "Label": "Steam Safety",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "66",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "2",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine25",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "190",
        "Name": "InputBlock5",
        "Top": "150",
        "UPI": "683295",
        "Label": "HDKT Math",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "65",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "2",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine23",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "440",
        "Name": "InputBlock4",
        "Top": "390",
        "UPI": "683289",
        "Label": "HDKT Reset",
        "ConnectionCount": "2",
        "Precision": "3.1",
        "ZIndex": "62",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "2",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine1",
            "LinkPointType": "Source"
          },
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine2",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "330",
        "Name": "InputBlock3",
        "Top": "70",
        "UPI": "683299",
        "Label": "ECON ENAB",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "61",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "2",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine16",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "260",
        "Name": "InputBlock2",
        "Top": "40",
        "UPI": "683302",
        "Label": "MXAT RST",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "60",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "2",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine10",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "TextBlock",
        "Height": "52",
        "Left": "110",
        "Name": "GPLTextBlock5",
        "Top": "370",
        "Width": "182",
        "DiagramFont": "false",
        "ZIndex": "21",
        "Font": {
          "Color": "8388736",
          "Height": "13",
          "Size": "10",
          "Bold": "true"
        },
        "Label": "Return Air Fan (RAF) is \nDisabled When Setback \nMode is Active"
      },
      {
        "BlockType": "Input",
        "Left": "90",
        "Name": "InputBlock39",
        "Top": "480",
        "UPI": "682744",
        "Label": "Setback OpMode",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "57",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "1",
        "IntRefPointType": "0",
        "IntRefObjectType": "5",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine65",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "90",
        "Name": "InputBlock38",
        "Top": "440",
        "UPI": "28346",
        "Label": "SAF1",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "56",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "1",
        "IntRefPointType": "0",
        "IntRefObjectType": "4",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine64",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Logic",
        "Left": "180",
        "Name": "LogicBlock1",
        "Top": "440",
        "UPI": "683316",
        "Label": "RAF CTL",
        "ConnectionCount": "3",
        "Precision": "3.1",
        "ZIndex": "54",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine64",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine65",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "6",
            "Anchor": "GPLLine63",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Output",
        "Left": "300",
        "Name": "OutputBlock8",
        "Top": "480",
        "UPI": "28348",
        "Label": "RAF",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "53",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine63",
          "LinkPointType": "Target"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Output",
        "Left": "900",
        "Name": "OutputBlock7",
        "Top": "300",
        "UPI": "27082",
        "Label": "RAF VFD",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "49",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine59",
          "LinkPointType": "Target"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Multiply",
        "Left": "780",
        "Name": "MathBlock3",
        "Top": "290",
        "UPI": "683317",
        "Label": "Math3",
        "ConnectionCount": "3",
        "Precision": "3.1",
        "ZIndex": "48",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine60",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine61",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "3",
            "Anchor": "GPLLine59",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "280",
        "Name": "InputBlock35",
        "Top": "290",
        "UPI": "28346",
        "Label": "SAF1",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "46",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "1",
        "IntRefPointType": "0",
        "IntRefObjectType": "4",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine50",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "TextBlock",
        "Height": "52",
        "Left": "330",
        "Name": "GPLTextBlock4",
        "Top": "270",
        "Width": "182",
        "DiagramFont": "false",
        "ZIndex": "20",
        "Font": {
          "Color": "8388736",
          "Height": "13",
          "Size": "10",
          "Bold": "true"
        },
        "Label": "Drive Control is \nDisabled When Setback \nMode is Active"
      },
      {
        "BlockType": "Input",
        "Left": "670",
        "Name": "InputBlock27",
        "Top": "460",
        "UPI": "23948",
        "Label": "EXT HDKT",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "43",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "1",
        "IntRefPointType": "1",
        "IntRefObjectType": "0",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine49",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "670",
        "Name": "InputBlock26",
        "Top": "370",
        "UPI": "22742",
        "Label": "INT HDKT",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "42",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine48",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "700",
        "Name": "InputBlock22",
        "Top": "420",
        "UPI": "28348",
        "Label": "RAF",
        "ConnectionCount": "2",
        "Precision": "3.1",
        "ZIndex": "39",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "ReferenceType": "1",
        "IntRefPointType": "0",
        "IntRefObjectType": "4",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine42",
            "LinkPointType": "Source"
          },
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine43",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "ReverseActingPI",
        "Left": "780",
        "Name": "PIBlock5",
        "Top": "460",
        "UPI": "683318",
        "Label": "EXT STMV PI",
        "ConnectionCount": "4",
        "Precision": "3.1",
        "ZIndex": "36",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine43",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine49",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine2",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "3",
            "Anchor": "GPLLine41",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "ReverseActingPI",
        "Left": "780",
        "Name": "PIBlock4",
        "Top": "370",
        "UPI": "683319",
        "Label": "INT STMV PI",
        "ConnectionCount": "4",
        "Precision": "3.1",
        "ZIndex": "35",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine42",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine48",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine1",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "3",
            "Anchor": "GPLLine40",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Output",
        "Left": "900",
        "Name": "OutputBlock6",
        "Top": "470",
        "UPI": "27088",
        "Label": "EXT STMV",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "34",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine41",
          "LinkPointType": "Target"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Output",
        "Left": "900",
        "Name": "OutputBlock5",
        "Top": "380",
        "UPI": "27087",
        "Label": "INT STMV",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "33",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine40",
          "LinkPointType": "Target"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "520",
        "Name": "InputBlock21",
        "Top": "290",
        "UPI": "682744",
        "Label": "Setback OpMode",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "30",
        "PresentValueVisible": "true",
        "LabelVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine38",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "SPA",
        "Left": "570",
        "Name": "SPABlock6",
        "Top": "240",
        "UPI": "683320",
        "Label": "VSD SPA",
        "ConnectionCount": "3",
        "Precision": "3.1",
        "ZIndex": "28",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine38",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine39",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine35",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "190",
        "Name": "InputBlock20",
        "Top": "260",
        "UPI": "29589",
        "Label": "Static SetPt",
        "ConnectionCount": "1",
        "Precision": "1.3",
        "ZIndex": "25",
        "PresentValueVisible": "true",
        "LabelVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine37",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "250",
        "Name": "InputBlock19",
        "Top": "240",
        "UPI": "23957",
        "Label": "Static",
        "ConnectionCount": "1",
        "Precision": "1.3",
        "ZIndex": "24",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine36",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "ReverseActingPI",
        "Left": "320",
        "Name": "PIBlock3",
        "Top": "240",
        "UPI": "683321",
        "Label": "VSD PI",
        "ConnectionCount": "4",
        "Precision": "3.1",
        "ZIndex": "23",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine50",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine36",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine37",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "3",
            "Anchor": "GPLLine39",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Output",
        "Left": "900",
        "Name": "OutputBlock4",
        "Top": "250",
        "UPI": "27083",
        "Label": "SA VSD",
        "ConnectionCount": "2",
        "Precision": "3.1",
        "ZIndex": "22",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine35",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine60",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "500",
        "Name": "InputBlock17",
        "Top": "120",
        "UPI": "28346",
        "Label": "SAF1",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "18",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine33",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Output",
        "Left": "900",
        "Name": "OutputBlock1",
        "Top": "70",
        "UPI": "27085",
        "Label": "OAD",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "16",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine28",
          "LinkPointType": "Target"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "250",
        "Name": "InputBlock12",
        "Top": "130",
        "UPI": "23948",
        "Label": "EXT HDKT",
        "ConnectionCount": "1",
        "Precision": "3.1",
        "ZIndex": "12",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": {
          "LinkIndex": "0",
          "Anchor": "GPLLine21",
          "LinkPointType": "Source"
        },
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "PI",
        "Left": "320",
        "Name": "PIBlock2",
        "Top": "130",
        "UPI": "683322",
        "Label": "HDKT SAFETY",
        "ConnectionCount": "4",
        "Precision": "3.1",
        "ZIndex": "10",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine25",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine21",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine23",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "3",
            "Anchor": "GPLLine20",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "SPA",
        "Left": "560",
        "Name": "SPABlock2",
        "Top": "70",
        "UPI": "683323",
        "Label": "MXAT LO LIMIT",
        "ConnectionCount": "3",
        "Precision": "3.1",
        "ZIndex": "7",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine33",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine18",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine19",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "FindSmallest",
        "Left": "710",
        "Name": "FlorsBlock3",
        "Top": "30",
        "UPI": "683324",
        "Label": "OAD Flors",
        "ConnectionCount": "4",
        "Precision": "3.1",
        "ZIndex": "4",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine17",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine19",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "3",
            "Anchor": "GPLLine20",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "6",
            "Anchor": "GPLLine28",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "Input",
        "Left": "360",
        "Name": "InputBlock8",
        "Top": "20",
        "UPI": "23351",
        "Label": "MXAT",
        "ConnectionCount": "2",
        "Precision": "3.1",
        "ZIndex": "2",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine11",
            "LinkPointType": "Source"
          },
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine18",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      },
      {
        "BlockType": "PI",
        "Left": "450",
        "Name": "PIBlock1",
        "Top": "20",
        "UPI": "683325",
        "Label": "OAD PI",
        "ConnectionCount": "4",
        "Precision": "3.1",
        "ZIndex": "0",
        "LabelVisible": "true",
        "PresentValueVisible": "true",
        "Connection": [
          {
            "LinkIndex": "0",
            "Anchor": "GPLLine16",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "1",
            "Anchor": "GPLLine11",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "2",
            "Anchor": "GPLLine10",
            "LinkPointType": "Target"
          },
          {
            "LinkIndex": "3",
            "Anchor": "GPLLine17",
            "LinkPointType": "Source"
          }
        ],
        "PresentValueFont": { "Bold": "true" }
      }
    ],
    "Line": [
      {
        "Name": "GPLLine2",
        "SourceLinkPoint": "InputBlock4",
        "TargetLinkPoint": "PIBlock5",
        "ZIndex": "64",
        "HandleCount": "3",
        "Handle": [
          {
            "x": "460",
            "y": "400"
          },
          {
            "x": "620",
            "y": "445"
          },
          {
            "x": "780",
            "y": "490"
          }
        ]
      },
      {
        "Name": "GPLLine1",
        "SourceLinkPoint": "InputBlock4",
        "TargetLinkPoint": "PIBlock4",
        "ZIndex": "63",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "460",
            "y": "400"
          },
          {
            "x": "780",
            "y": "400"
          }
        ]
      },
      {
        "Name": "GPLLine65",
        "SourceLinkPoint": "InputBlock39",
        "TargetLinkPoint": "LogicBlock1",
        "ZIndex": "59",
        "HandleCount": "3",
        "Handle": [
          {
            "x": "110",
            "y": "490"
          },
          {
            "x": "159",
            "y": "480"
          },
          {
            "x": "180",
            "y": "470"
          }
        ]
      },
      {
        "Name": "GPLLine64",
        "SourceLinkPoint": "InputBlock38",
        "TargetLinkPoint": "LogicBlock1",
        "ZIndex": "58",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "110",
            "y": "450"
          },
          {
            "x": "180",
            "y": "450"
          }
        ]
      },
      {
        "Name": "GPLLine63",
        "SourceLinkPoint": "LogicBlock1",
        "TargetLinkPoint": "OutputBlock8",
        "ZIndex": "55",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "210",
            "y": "490"
          },
          {
            "x": "300",
            "y": "490"
          }
        ]
      },
      {
        "Name": "GPLLine61",
        "SourceLinkPoint": "ConstantBlock1",
        "TargetLinkPoint": "MathBlock3",
        "ZIndex": "52",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "730",
            "y": "320"
          },
          {
            "x": "780",
            "y": "320"
          }
        ]
      },
      {
        "Name": "GPLLine60",
        "SourceLinkPoint": "OutputBlock4",
        "TargetLinkPoint": "MathBlock3",
        "ZIndex": "51",
        "HandleCount": "3",
        "Handle": [
          {
            "x": "900",
            "y": "260"
          },
          {
            "x": "770",
            "y": "280"
          },
          {
            "x": "780",
            "y": "300"
          }
        ]
      },
      {
        "Name": "GPLLine59",
        "SourceLinkPoint": "MathBlock3",
        "TargetLinkPoint": "OutputBlock7",
        "ZIndex": "50",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "810",
            "y": "310"
          },
          {
            "x": "900",
            "y": "310"
          }
        ]
      },
      {
        "Name": "GPLLine50",
        "SourceLinkPoint": "InputBlock35",
        "TargetLinkPoint": "PIBlock3",
        "ZIndex": "47",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "300",
            "y": "300"
          },
          {
            "x": "335",
            "y": "280"
          }
        ]
      },
      {
        "Name": "GPLLine49",
        "SourceLinkPoint": "InputBlock27",
        "TargetLinkPoint": "PIBlock5",
        "ZIndex": "45",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "690",
            "y": "470"
          },
          {
            "x": "780",
            "y": "470"
          }
        ]
      },
      {
        "Name": "GPLLine48",
        "SourceLinkPoint": "InputBlock26",
        "TargetLinkPoint": "PIBlock4",
        "ZIndex": "44",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "690",
            "y": "380"
          },
          {
            "x": "780",
            "y": "380"
          }
        ]
      },
      {
        "Name": "GPLLine43",
        "SourceLinkPoint": "InputBlock22",
        "TargetLinkPoint": "PIBlock5",
        "ZIndex": "41",
        "HandleCount": "4",
        "Handle": [
          {
            "x": "720",
            "y": "430"
          },
          {
            "x": "747",
            "y": "470"
          },
          {
            "x": "771",
            "y": "510"
          },
          {
            "x": "795",
            "y": "500"
          }
        ]
      },
      {
        "Name": "GPLLine42",
        "SourceLinkPoint": "InputBlock22",
        "TargetLinkPoint": "PIBlock4",
        "ZIndex": "40",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "720",
            "y": "430"
          },
          {
            "x": "795",
            "y": "410"
          }
        ]
      },
      {
        "Name": "GPLLine41",
        "SourceLinkPoint": "PIBlock5",
        "TargetLinkPoint": "OutputBlock6",
        "ZIndex": "38",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "810",
            "y": "480"
          },
          {
            "x": "900",
            "y": "480"
          }
        ]
      },
      {
        "Name": "GPLLine40",
        "SourceLinkPoint": "PIBlock4",
        "TargetLinkPoint": "OutputBlock5",
        "ZIndex": "37",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "810",
            "y": "390"
          },
          {
            "x": "900",
            "y": "390"
          }
        ]
      },
      {
        "Name": "GPLLine39",
        "SourceLinkPoint": "PIBlock3",
        "TargetLinkPoint": "SPABlock6",
        "ZIndex": "32",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "350",
            "y": "260"
          },
          {
            "x": "570",
            "y": "260"
          }
        ]
      },
      {
        "Name": "GPLLine38",
        "SourceLinkPoint": "InputBlock21",
        "TargetLinkPoint": "SPABlock6",
        "ZIndex": "31",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "540",
            "y": "300"
          },
          {
            "x": "585",
            "y": "280"
          }
        ]
      },
      {
        "Name": "GPLLine35",
        "SourceLinkPoint": "SPABlock6",
        "TargetLinkPoint": "OutputBlock4",
        "ZIndex": "29",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "600",
            "y": "260"
          },
          {
            "x": "900",
            "y": "260"
          }
        ]
      },
      {
        "Name": "GPLLine37",
        "SourceLinkPoint": "InputBlock20",
        "TargetLinkPoint": "PIBlock3",
        "ZIndex": "27",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "210",
            "y": "270"
          },
          {
            "x": "320",
            "y": "270"
          }
        ]
      },
      {
        "Name": "GPLLine36",
        "SourceLinkPoint": "InputBlock19",
        "TargetLinkPoint": "PIBlock3",
        "ZIndex": "26",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "270",
            "y": "250"
          },
          {
            "x": "320",
            "y": "250"
          }
        ]
      },
      {
        "Name": "GPLLine33",
        "SourceLinkPoint": "InputBlock17",
        "TargetLinkPoint": "SPABlock2",
        "ZIndex": "19",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "520",
            "y": "130"
          },
          {
            "x": "575",
            "y": "110"
          }
        ]
      },
      {
        "Name": "GPLLine28",
        "SourceLinkPoint": "FlorsBlock3",
        "TargetLinkPoint": "OutputBlock1",
        "ZIndex": "17",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "740",
            "y": "80"
          },
          {
            "x": "900",
            "y": "80"
          }
        ]
      },
      {
        "Name": "GPLLine25",
        "SourceLinkPoint": "InputBlock6",
        "TargetLinkPoint": "PIBlock2",
        "ZIndex": "15",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "270",
            "y": "200"
          },
          {
            "x": "335",
            "y": "170"
          }
        ]
      },
      {
        "Name": "GPLLine23",
        "SourceLinkPoint": "InputBlock5",
        "TargetLinkPoint": "PIBlock2",
        "ZIndex": "14",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "210",
            "y": "160"
          },
          {
            "x": "320",
            "y": "160"
          }
        ]
      },
      {
        "Name": "GPLLine21",
        "SourceLinkPoint": "InputBlock12",
        "TargetLinkPoint": "PIBlock2",
        "ZIndex": "13",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "270",
            "y": "140"
          },
          {
            "x": "320",
            "y": "140"
          }
        ]
      },
      {
        "Name": "GPLLine20",
        "SourceLinkPoint": "PIBlock2",
        "TargetLinkPoint": "FlorsBlock3",
        "ZIndex": "11",
        "HandleCount": "3",
        "Handle": [
          {
            "x": "350",
            "y": "150"
          },
          {
            "x": "699",
            "y": "115"
          },
          {
            "x": "710",
            "y": "80"
          }
        ]
      },
      {
        "Name": "GPLLine19",
        "SourceLinkPoint": "SPABlock2",
        "TargetLinkPoint": "FlorsBlock3",
        "ZIndex": "9",
        "HandleCount": "3",
        "Handle": [
          {
            "x": "590",
            "y": "90"
          },
          {
            "x": "685",
            "y": "75"
          },
          {
            "x": "710",
            "y": "60"
          }
        ]
      },
      {
        "Name": "GPLLine18",
        "SourceLinkPoint": "InputBlock8",
        "TargetLinkPoint": "SPABlock2",
        "ZIndex": "8",
        "HandleCount": "3",
        "Handle": [
          {
            "x": "380",
            "y": "30"
          },
          {
            "x": "439",
            "y": "60"
          },
          {
            "x": "560",
            "y": "90"
          }
        ]
      },
      {
        "Name": "GPLLine16",
        "SourceLinkPoint": "InputBlock3",
        "TargetLinkPoint": "PIBlock1",
        "ZIndex": "6",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "350",
            "y": "80"
          },
          {
            "x": "465",
            "y": "60"
          }
        ]
      },
      {
        "Name": "GPLLine17",
        "SourceLinkPoint": "PIBlock1",
        "TargetLinkPoint": "FlorsBlock3",
        "ZIndex": "5",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "480",
            "y": "40"
          },
          {
            "x": "710",
            "y": "40"
          }
        ]
      },
      {
        "Name": "GPLLine11",
        "SourceLinkPoint": "InputBlock8",
        "TargetLinkPoint": "PIBlock1",
        "ZIndex": "3",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "380",
            "y": "30"
          },
          {
            "x": "450",
            "y": "30"
          }
        ]
      },
      {
        "Name": "GPLLine10",
        "SourceLinkPoint": "InputBlock2",
        "TargetLinkPoint": "PIBlock1",
        "ZIndex": "1",
        "HandleCount": "2",
        "Handle": [
          {
            "x": "280",
            "y": "50"
          },
          {
            "x": "450",
            "y": "50"
          }
        ]
      }
    ]
  }
};


var gpl = {
    blocks: {},
    shapes: {},
    itemIdx: 0,
    makeId: function() {
        gpl.itemIdx++;
        return '_gplId_' + gpl.itemIdx;
    },
    _log: function() {
        var t = new Date(),
            args = [].splice.call(arguments, 0),
            functions = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
            lengths = [2,2,2,3],
            separators = [':',':',':',' -- '],
            fn,
            out = '';

        for(fn in functions) {
            if(functions.hasOwnProperty(fn)) {
                out += ('000' + t['get' + functions[fn]]()).slice(-1 * lengths[fn]) + separators[fn];
            }
        }

        args.unshift(out);
        console.log.apply(console, args);
    }
};

window.gpl = gpl;

/* ------------ shapes ------------------------ */

fabric.MonitorPointShape = fabric.util.createClass(fabric.Object, {
    type: 'MonitorPointShape',

    x: 0,

    y: 0,

    initialize: function(options) {
        var defaults = {
            fill: '#6a6af1'
        };

        this.options = $.extend(defaults, options);

        this.callSuper('initialize', this.options);

        this.set('width', this.options.width || 20)
            .set('height', this.options.height || 20);

        this.x = this.options.x || 0;
        this.y = this.options.y || 0;
        this.stroke = this.options.stroke || 'black';
    },

    _render: function(ctx) {
        var widthBy2 = this.width / 2,
            heightBy2 = this.height / 2,
            x = this.x - widthBy2,
            y = this.y - heightBy2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + widthBy2, y);
        ctx.lineTo(x + this.width, y + heightBy2);
        ctx.lineTo(x + widthBy2, y + this.height);
        ctx.lineTo(x, y + this.height);
        ctx.lineTo(x, y);
        // ctx.moveTo(x + this.width, y + heightBy2);
        // ctx.arc(x + this.width, y + heightBy2, heightBy2/2, 0, 2 * Math.PI, false);
        ctx.closePath();

        this._renderFill(ctx);
        this._renderStroke(ctx);
    },

    toObject: function(propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    },

    complexity: function() {
        return 1;
    }
});

fabric.MonitorPointShape.fromObject = function(object) {
    return new fabric.MonitorPointShape(object);
};

fabric.ControlPointShape = fabric.util.createClass(fabric.MonitorPointShape, {
    type: 'controlpointshape',

    initialize: function(options) {
        var defaults = {
                flipX: true,
                fill: '#2bef30'
            };

        this.callSuper('initialize', $.extend(defaults, options));
    },

    toObject: function() {
        return this.callSuper('toObject');
    },

    _render: function(ctx) {
        return this.callSuper('_render', ctx);
    }
});

fabric.ControlPointShape.fromObject = function(object) {
    return new fabric.ControlPointShape(object);
};

fabric.ConstantPointShape = fabric.util.createClass(fabric.Rect, {
    type: 'ConstantPointShape',

    fill: '#FF9600',
    stroke: 'black',

    initialize: function(options) {
        this.callSuper('initialize', options);
    },

    toObject: function(propertiesToInclude) {
        var object = $.extend(this.callSuper('toObject', propertiesToInclude), {
            selectable: true,
            hasControls: false,
        });
        return object;
    }
});

fabric.ConstantPointShape.fromObject = function(object) {
    return new fabric.ConstantPointShape(object);
};

gpl.Rect = function(config, manager) {
    var radius = 3,
        defaults = {
            fill: '#5F9EA0',
            width: 50,
            height: 75,
            hasRotatingPoint: false,
            borderColor: 'black',
            cornerColor: 'black',
            cornerSize: 6,
            transparentCorners: false,
            selectable: false,
            stroke: 'black'
        },
        nodeDefaults = {
            fill: 'blue',
            radius: radius,
            hasRotatingPoint: false,
            borderColor: 'black',
            transparentCorners: false,
            selectable: false,
            isAnchor: true
        },
        newConfig = $.extend({}, defaults, config),
        width = newConfig.width;

    manager.createObject(fabric.Rect, newConfig);

    manager.createObject(fabric.Circle, $.extend(nodeDefaults, {anchorType: 'input', left: newConfig.left - radius, top: newConfig.top + 20}));

    manager.createObject(fabric.Circle, $.extend(nodeDefaults, {anchorType: 'output', left: newConfig.left + width - radius, top: newConfig.top + 20}));
};

/* ------------ end shapes -------------------- */

gpl.Block = fabric.util.createClass(fabric.Rect, {
    opacity: 0,
    numInputs: 0,
    labelFontSize: 10,
    labelMargin: 5,
    shadow: {
        offsetX: 1.5,
        offsetY: 1.5
    },
    labelFontFamily: 'Arial',
    hasOutput: true,
    hasShutdownBlock: true,
    hasRotatingPoint: false,
    selectable: false,
    hasControls: false,
    anchorRadius: 3,
    initialized: false,

    iconPath: '/img/icons/',
    icon: 'multiply.svg',

    type: 'Block',
    toolbarShape: 'Multiply',//etc

    _createAnchor: function(config) {
        var newConfig = $.extend(this.anchorDefaults, config);

        newConfig.gplId = this.gplId;
        newConfig.gplType = 'anchor';
        if(this.config.hideAnchors === true) {
            newConfig.visible = false;
        } else {
            newConfig.visible = true;
        }
        gpl.anchorManager.add(newConfig);
        this.add(new fabric.Circle(newConfig));
    },

    _createInputAnchor: function(top) {
        this._createAnchor({
            anchorType: 'input',
            isVertical: false,
            left: -1 * this.anchorRadius + this.left,
            top: top - (this.anchorRadius / 2) + this.top - 0.5
        });
    },

    _createOutputAnchor: function(top) {
        this._createAnchor({
            anchorType: 'output',
            isVertical: false,
            top: top - (this.anchorRadius / 2) + this.top - 0.5,
            left: this.width - this.anchorRadius + this.left
        });
    },

    _createShutdownAnchor: function(top) {
        this._createAnchor({
            anchorType: 'input',
            isShutdown: true,
            isVertical: true,
            top: top - (this.anchorRadius / 2) + this.top - 1.5,
            left: this.width/2 - (this.anchorRadius / 2) + this.left - 1
        });
    },

    _syncObjects: function(event) {
        var e = event?event.e:{},
            left = e.clientX || this.left,
            top = e.clientY || this.top,
            shape,
            c;

        for(c=0; c<this._shapes.length; c++) {
            shape = this._shapes[c];
            shape.left = left + shape.offsetLeft - this.width/2;
            shape.top = top + shape.offsetTop - this.height/2;
        }
    },

    add: function(object) {
        object.offsetLeft = object.left - this.left;
        object.offsetTop = object.top - this.top;
        this._shapes.push(object);
        if(this.initialized) {
            gpl.blockManager.add(object);
        }
    },

    loadBackground: function() {
        fabric.loadSVGFromURL('/img/icons/multiply.svg', function(objects, options) {
            var svg = fabric.util.groupSVGElements(objects, options);
            svg.set({
                left: gpl.test1.left,
                top: gpl.test1.top
            });
            gpl.manager.canvas.add(svg);
            gpl.manager.canvas.renderAll();
        });
    },

    //initialization methods -----------------------------------------------

    initialize: function(config) {
        this.initConfig();

        this.config = config;
        this.callSuper('initialize', this.config);
        this.setShadow(this.shadow);

        this.x = this.config.x || 0;
        this.y = this.config.y || 0;

        this.initShapes();

        gpl.blockManager.registerBlock(this);

        this.initialized = true;
    },

    showAnchors: function() {
        var c,
            shape;

        for(c=0; c<this._shapes.length; c++) {
            shape = this._shapes[c];
            shape.visible = true;
            shape.setCoords();
        }
    },

    initConfig: function() {
        this.gplId = gpl.makeId();

        this.shapes = this.shapes || {};
        this._shapes = [];

        this.shapeDefaults = {
            hasRotatingPoint: false,
            selectable: true,
            hasControls: false
        };

        this.anchorDefaults = {
            fill: 'black',
            stroke: 'blue',
            radius: this.anchorRadius,
            hasRotatingPoint: false,
            borderColor: 'black',
            transparentCorners: false,
            selectable: false,
            isAnchor: true
        };
    },

    initShapes: function() {
        this.initFabricShapes();
        this.initAnchors();
        this.initLabel();
    },

    initAnchors: function() {
        this.initInputAnchors();
        this.initOutputAnchor();
        this.initShutdownAnchor();
    },

    initLabel: function() {
        var config = {
                top: this.top - this.labelFontSize - this.labelMargin,
                left: this.left + (this.width / 2),
                textAlign: 'center',
                fontSize: parseInt(this.labelFontSize, 10),
                fontFamily: this.labelFontFamily,
                gplType: 'label'
            };

        if(this.label && this.label !== '') {
            this.labelText = new fabric.Text(this.label, config);
            this.labelText.left = this.labelText.left - this.labelText.width / 2;
            this.add(this.labelText);
        }
    },

    initInputAnchors: function() {
        var c,
            padding = 11,
            len = this.numInputs,
            margin,
            top = padding;

        if(len === 1) {
            top = margin = parseInt(this.height / 2, 10);
        } else {
            margin = parseInt((this.height - (2 * padding)) / (len - 1), 10);
        }

        for(c=0; c<len; c++) {
            this._createInputAnchor(top);
            top += margin;
        }
    },

    initOutputAnchor: function() {
        var top = this.height/2;

        if(this.hasOutput) {
            this._createOutputAnchor(top);
        }
    },

    initShutdownAnchor: function() {
        var top = this.height;

        if(this.hasShutdownBlock === true) {
            this._createShutdownAnchor(top);
        }
    },

    initFabricShapes: function() {
        var shapeName,
            Shape,
            newShape,
            ShapeClass,
            cfg,
            config = $.extend(true, {}, this.shapeDefaults);

        for(shapeName in this.shapes) {
            if(this.shapes.hasOwnProperty(shapeName)) {
                Shape = this.shapes[shapeName];
                cfg = $.extend(config, Shape.cfg || {});
                cfg.shadow = this.shadow;
                ShapeClass = Shape.cls;
                config.top = this.top;
                config.left = this.left;
                config.gplId = this.gplId;
                config.gplType = 'block';
                newShape = new ShapeClass(cfg);
                this.add(newShape);
            }
        }
    }
});

gpl.Block.fromObject = function(object) {
    return new gpl.Block(object);
};

gpl.blocks.MonitorBlock = fabric.util.createClass(gpl.Block, {
    height: 20,
    width: 20,
    hasShutdownBlock: false,

    type: 'MonitorBlock',

    shapes: {
        'MonitorPointShape': {
            cls: fabric.MonitorPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        }
    },

    initialize: function(config) {
        this.callSuper('initialize', config);
    } 
});

gpl.blocks.ConstantBlock = fabric.util.createClass(gpl.Block, {
    height: 20,
    width: 20,
    hasShutdownBlock: false,

    type: 'ConstantBlock',

    shapes: {
        'ConstantPointShape': {
            cls: fabric.ConstantPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        }
    }
});

gpl.blocks.ControlBlock = fabric.util.createClass(gpl.Block, {
    height: 20,
    width: 20,
    hasShutdownBlock: false,

    numInputs: 1,
    hasOutput: false,

    type: 'MonitorBlock',

    shapes: {
        'ControlPointShape': {
            cls: fabric.ControlPointShape,
            cfg: {
                height: 20,
                width: 20
            }
        }
    },

    initialize: function(config) {
        this.callSuper('initialize', config);
    } 
});

gpl.blocks.LogicBlock = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 100,
    numInputs: 5,

    type: 'LogicBlock',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#bbec08',
                stroke: 'black',
                width: 30,
                height: 100
            }
        }
    },

    initialize: function(config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.FindSmallest = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 100,
    numInputs: 5,

    type: 'FindSmallest',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#f3e35f',
                stroke: 'black',
                width: 30,
                height: 100
            }
        }
    },

    initialize: function(config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.PI = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,
    numInputs: 2,

    type: 'PI',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#2f2fb4',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function(config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.Multiply = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,
    numInputs: 2,

    type: 'Multiply',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#ded5bc',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function(config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.SPA = fabric.util.createClass(gpl.Block, {
    width: 30,
    height: 40,
    numInputs: 1,

    type: 'SPA',

    shapes: {
        'Rect': {
            cls: fabric.Rect,
            cfg: {
                fill: '#149e93',
                stroke: 'black',
                width: 30,
                height: 40
            }
        }
    },

    initialize: function(config) {
        this.callSuper('initialize', config);
    }
});

gpl.blocks.TextBlock = fabric.util.createClass(fabric.IText, {
    type: 'TextBlock',
    lineHeight: 1,
    fontFamily: 'arial',
    textAlign: 'center',

    initialize: function(config) {
        this.config = config;

        this.convertConfig();
        this.callSuper('initialize', this.config.label, this.config);
        gpl.texts = gpl.texts || [];
        gpl.texts.push(this);
        gpl.blockManager.add(this);
    },

    convertConfig: function() {
        var cfg = this.config,
            fontConfig = cfg.Font,
            convertColor = function(num) {
                return parseInt(num, 10).toString(16);
            };

        if(fontConfig) {
            cfg.fontWeight = fontConfig.Bold === 'true'?'bold':'normal';
            cfg.fill = '#' + convertColor(fontConfig.Color);
            cfg.fontSize = parseInt(fontConfig.Height, 10);
        }

        cfg.lockScalingX = true;
        cfg.lockScalingY = true;

        this.config.left += 10;
        this.config.top += 5;

        this.config.width = parseInt(this.config.width, 10);
        this.config.height = parseInt(this.config.height, 10);
    }
});

gpl.SchematicLine = function(ox, oy, otarget, manager, isVertical) {
    var self = this,
        canvas = manager.canvas,
        segments = [],
        coords = [{
            x: ox,
            y: oy
        }],
        typeMatrix = {
            input: 'output',
            output: 'input'
        },
        startType = otarget.anchorType,
        endType = typeMatrix[startType],
        spaceSegment,
        target,
        solidLine,
        dashedLine,
        horiz = isVertical?false:true,
        prevX = ox,
        prevY = oy,
        lineDefaults = {
            stroke: 'black',
            selectable: false
        },
        dashedDefaults = {
            stroke: 'grey'
        },
        eventHandlerList;

    self.getCoords = function() {
        return coords;
    };

    self.completeLine = function() {
        self.addSegment(solidLine, true);
        solidLine = new fabric.Line([dashedLine.x1, dashedLine.y1, dashedLine.x2, dashedLine.y2], $.extend({}, lineDefaults));
        self.addSegment(solidLine, true);
        canvas.remove(dashedLine);
        target.set('fill', target._oFill);
        self.detachEvents();
        manager.shapes.push(new gpl.ConnectionLine(coords, canvas));
        self.clearSegments();
        canvas.renderAll();
    };

    self.clearSegments = function() {
        while(segments.length > 0) {
            self.removeSegment(true);
        }
        canvas.renderAll();
    };

    self.syncLines = function() {
        var newCorner,
            lastCoords = coords.slice(-1)[0];

        if(horiz) {
            newCorner = {
                x: dashedLine.x1,
                y: solidLine.y1
            };
        } else {
            newCorner = {
                x: solidLine.x1,
                y: dashedLine.y2
            };
        }

        solidLine.set({
            x1: lastCoords.x,
            y1: lastCoords.y,
            x2: newCorner.x,
            y2: newCorner.y
        });

        dashedLine.set({
            x1: newCorner.x,
            y1: newCorner.y
        });

        canvas.renderAll();
    };

    self.removeSegment = function(bypass) {
        var segment;

        if(segments.length > 0) {
            coords.pop();
            segment = segments.pop();  
            canvas.remove(segment);
        }

        horiz = !horiz;

        if(!bypass) {
            self.syncLines();
        }

        return segment;
    };

    self.addSegment = function(segment, skipSync) {
        segments.push(segment);
        coords.push({
            x: segment.x2,
            y: segment.y2
        });
        canvas.add(segment);
        horiz = !horiz;
        if(!skipSync) {
            self.syncLines();
        }
    };

    self.swapDirections = function() {
        if(!spaceSegment) {
            spaceSegment = self.removeSegment();
        } else {
            self.addSegment(spaceSegment);
        }
    };

    self.handleMouseMove =  function(event) {
        var pointer = canvas.getPointer(event.e),
            x = pointer.x,
            y = pointer.y;

        if(manager.isEditingLine) {  
            if(event.target && event.target.anchorType === endType) {
                target = event.target;
                if(!target._oFill) {
                    target._oFill = target.fill;
                }
                target.set('fill', 'green');
            } else {
                if(target && target._oFill) {
                    target.set('fill', target._oFill);
                }
            }

            if(horiz) {
                solidLine.set({x2: x});
                dashedLine.set({x1: x, y2: y, x2: x, y1: prevY});
            } else {
                solidLine.set({y2: y});
                dashedLine.set({x1: prevX, y2: y, x2: x, y1: y});
            }
            canvas.renderAll();
        }
    };

    self.handleMouseUp = function(event) {
        self.mouseDown = false;
    };

    self.handleMouseDown = function(event) {
        var pointer = canvas.getPointer(event.e),
            px = pointer.x,
            py = pointer.y,
            x = solidLine.x2,
            y = solidLine.y2,
            clickTarget = event.target;

        if(manager.isEditingLine) {
            if(clickTarget && clickTarget.anchorType === endType) {
                self.completeLine();
            } else {
                prevX = x;
                prevY = y;

                coords.push({
                    x: x,
                    y: y
                });

                segments.push(solidLine);

                solidLine = new fabric.Line([x, y, x, y], $.extend({}, lineDefaults));
                dashedLine.set({x1: x, y1: y, x2: px, y2: py});

                horiz = !horiz;

                canvas.add(solidLine);
                canvas.renderAll();
            }
        }
    };

    self.handleEnterKey = function() {
        self.completeLine();
    };

    self.handleSpacebar = function(event) {
        self.swapDirections();
    };

    self.handleBackspace = function(event) {
        self.removeSegment();
    };

    self.handleKeyPress = function(event) {
        // if(event.which === 13) {
        //     handleEnterKey();
        // }
        if(event.which === 32) {
            self.handleSpacebar(event);
        }

        // if(event.which === 46) {//46 delete, 8 backspace
        //     event.preventDefault();
        //     handleBackspace(event);
        //     return false;
        // }
    };

    eventHandlerList = [{
        event: 'keypress',
        type: 'DOM',
        handler: self.handleKeyPress
    }, {
        event: 'mouse:move',
        handler: self.handleMouseMove
    }, {
        event: 'mouse:up',
        handler: self.handleMouseUp
    }, {
        event: 'mouse:down',
        handler: self.handleMouseDown
    }];

    self.detachEvents = function() {
        manager.isEditingLine = false;
        manager.clearState();
        manager.unregisterHandlers(eventHandlerList);
    };

    self.attachEvents = function() {
        manager.setState('DrawingLine');
        manager.registerHandlers(eventHandlerList);
    };

    solidLine = new fabric.Line([ox, oy, ox, oy], $.extend({}, lineDefaults));
    dashedLine = new fabric.Line([ox, oy, ox, oy], $.extend({}, dashedDefaults));

    canvas.add(solidLine);
    canvas.add(dashedLine);
    canvas.renderAll();

    manager.isEditingLine = true;

    self.attachEvents();
};

gpl.ConnectionLine = function(coords, canvas) {
    var self = this,
        startObject,
        endObject,
        calculatedSegments = [],
        lineDefaults = {
            stroke: 'black',
            selectable: false,
            gplType: 'linesegment'
        },
        c,
        calcManhattanMidpoints = function(p1, p2, idx, sVert, eVert) {
            var dx = p2.x - p1.x,
                dy = p2.y - p1.y,
                adx = Math.abs(dx),
                ady = Math.abs(dy),
                x = [p1.x, p2.x],
                y = [p1.y, p2.y],
                newPoint,
                invertPoint = function(arg) {
                    // gpl._log('inverting point', arg);
                    newPoint = [(newPoint[0] + 1) % 2, (newPoint[1] + 1) % 2];
                };

            //normally horizontal
            if(adx > ady) {
                // gpl._log('adx');
                newPoint = [1, 0];
                if(idx === 0) {
                    // gpl._log('in adx 0');
                    if(sVert) {
                        invertPoint('adx start');
                    }
                } else if(idx === coords.length - 2) {
                    // gpl._log('in adx end');
                    if(!eVert) {
                        invertPoint('adx end');
                    }
                // } else {
                //     gpl._log('in adx none');
                }

                // if(((idx === 0 && isVert) || ((idx === coords.length - 2) && !isVert)) && (coords.length === 2 && !isVert)) {//first, sync to vert
                //     invertPoint('adx');
                // }
            } else {//normally vert
                // gpl._log('ady');
                newPoint = [0, 1];
                if(idx === 0) {
                    // gpl._log('in ady 0');
                    if(!sVert) {
                        invertPoint('ady start');
                    }
                } else if(idx === coords.length - 2) {
                    // gpl._log('in ady end');
                    if(eVert) {
                        invertPoint('ady end');
                    }
                // } else {
                //     gpl._log('in ady none');
                }
                // if(((idx === 0 && isVert) || ((idx === coords.length - 2) && !isVert)) && (coords.length === 2 && !isVert)) {//ends on whatever
                //     invertPoint('ady');
                // }
            }

            return [{
                x: x[newPoint[0]],
                y: y[newPoint[1]]
            }];
        },
        drawSegments = function() {
            var cc,
                point1,
                point2,
                // circle,
                x1,
                x2,
                y1,
                y2,
                line;

            for(cc=0; cc<calculatedSegments.length-1; cc++) {
                point1 = calculatedSegments[cc];
                point2 = calculatedSegments[cc+1];
                x1 = point1.x;
                x2 = point2.x;
                y1 = point1.y;
                y2 = point2.y;
                line = new fabric.Line([x1, y1, x2, y2], lineDefaults);
                canvas.add(line);
                // line.moveTo(0);
                // circle = new fabric.Circle({
                //     radius: 2,
                //     fill: 'white',
                //     left: x2 - 1,
                //     top: y2 - 1,
                //     gplType: 'linevertex'
                // });
                // if(points.length === 3 && cc === 1) {
                //     circle.set('fill', 'purple');
                // }
                // canvas.add(circle);
                // circle.moveTo(0);
                self.lines.push(line);
                // self.circles.push(circle);
            }
        },
        addSegment = function(index) {//point1, point2) {
            var point1 = coords[index],
                point2 = coords[index + 1],
                svert = '',
                evert = '',
                midpoints,
                points;

            if(point1.x !== point2.x && point1.y !== point2.y && location.href.substring(0).match('nomanhattan') === null) {
                if(index === 0) {
                    svert = startObject.isVertical;
                } 
                if(index === coords.length - 2) {
                    evert = endObject.isVertical;
                }

                midpoints = calcManhattanMidpoints(point1, point2, index, svert, evert);
                points = [point1].concat(midpoints).concat(point2);
            } else {
                points = [point1, point2];
            }

            calculatedSegments = calculatedSegments.concat(points);
        };

    self.coords = coords;

    startObject = gpl.manager.getObject({
        gplType: 'anchor',
        left: coords[0].x,
        top: coords[0].y
    });

    endObject = gpl.manager.getObject({
        gplType: 'anchor',
        left: coords[coords.length-1].x,
        top: coords[coords.length-1].y
    });

    // gpl._log('startObject:', startObject);
    // gpl._log('endObject:', endObject);

    self.lines = [];
    self.circles = [];
    self.gplId = gpl.makeId();
    lineDefaults.gplId = self.gplId;

    // fixEndpoints(coords);

    for(c=0; c<coords.length-1; c++) {
        addSegment(c);
    }

    // fixEndpoints(calculatedSegments);

    drawSegments();

    gpl.lines = gpl.lines || {};
    gpl.lines[self.gplId] = self;
};

gpl.Toolbar = function(manager) {
    var type,
        types = ['MonitorBlock', 'LogicBlock'],
        padding = 25,
        width = 100,
        canvas = manager.canvas,
        height = canvas.height,
        borderLine,
        currX = padding,
        currY = padding,
        shapes = {},
        dragShape,
        drawBounds,
        boundLineOptions = {
            stroke: 'black',
            strokeWidth: '2',
            selectable: false
        },
        makeId = gpl.makeId,
        handleDrop = function() {
            var activeItem = canvas.getActiveObject(),
                gplId = activeItem.gplId,
                gplBlock = shapes[gplId];

            manager.clearState();
            gplBlock.showAnchors();
            this.off('mouseup', handleDrop);
            canvas.discardActiveObject();
            canvas.renderAll();
        },
        handleClick = function(item) {
            //when setting isclone, make anchor points visible 
            //new Block(item.type)
            var gplItem = shapes[item.gplId],
                itemType = gplItem.type,
                clone,
                cloneConfig,
                getProperties = function(obj) {
                    var ret = {},
                        c,
                        propList = ['left', 'top', 'selectable', 'hasControls', 'hideAnchors'];

                    for(c=0; c<propList.length; c++) {
                        ret[propList[c]] = obj[propList[c]];
                    }
                    return ret;
                },
                id = makeId();

            manager.setState('AddingBlock');

            item.isClone = gplItem.isClone = true;

            cloneConfig = getProperties(gplItem);
            cloneConfig.gplId = id;

            clone = new gpl.blocks[itemType](cloneConfig);

            shapes[id] = clone;
            item.on('mouseup', handleDrop);
        },
        renderItem = function(item) {
            var Item,
                id = makeId(),
                shape,
                config = {
                    left: currX,
                    top: currY,
                    selectable: true,
                    hasControls: false,
                    gplId: id,
                    master: true,
                    hideAnchors: true
                };

            if(typeof item !== 'function') {
                Item = gpl.blocks[item];
            } else {
                Item = item;
            }

            shape = new Item(config);

            // manager.canvas.add(shape);
            shapes[id] = shape;

            id = makeId();
            dragShape = new Item({
                left: currX,
                top: currY,
                selectable: true,
                hasControls: false,
                gplId: id,
                hideAnchors: true
            });

            // manager.canvas.add(dragShape);
            shapes[id] = dragShape;                

            currY += shape.height + padding;
        };

    drawBounds = function() {
        borderLine = new fabric.Line([width, 0, width, height], boundLineOptions);
        canvas.add(borderLine);
        canvas.renderAll();
    };

    this.addToolbarItem = function(Item) {
        renderItem(Item);
    };

    for(type in types) {
        if(types.hasOwnProperty(type)) {
            renderItem(types[type]);
        }
    }

    manager.registerHandlers([{
            event: 'object:selected', 
            handler: function(event) {
                if(shapes[event.target.gplId] && event.target.master !== true && event.target.isClone !== true) {
                    handleClick(event.target);
                }
            }
        // }, {
        //     event: 'mouse:up', 
        //     handler: function(event) {
        //         if(event.target && shapes[event.target.gplId]) {
        //             canvas.discardActiveObject();
        //         }
        //     }
        }]
    );

    drawBounds();
};


gpl.AnchorManager = function(manager) {
    var self = {
            map: {},
            getMeasurements: function(anchor) {
                var radius = anchor.radius,
                    top = anchor.top,
                    left = anchor.left,
                    lowLeft = left - radius,
                    lowTop = top - radius,
                    highLeft = left + radius,
                    highTop = top + radius;

                return {
                    top: top,
                    left: left,
                    lowLeft: lowLeft,
                    lowTop: lowTop,
                    highLeft: highLeft,
                    highTop: highTop
                };
            }
        };

    self.add = function(anchor) {
        // var measurements = self.getMeasurements(anchor);

        // self.map[left + '-' + top] = anchor;
    };

    self.remove = function(anchor) {
        var top = anchor.top,
            left = anchor.left;

        delete self.map[left + '-' + top];
    };

    self.getAnchorAt = function(left, top) {
        return self.map[left + '-' + top] || {};
    };

    return self;
};

gpl.BlockManager = function(manager) {
    var self = {
        blocks: {},

        manager: manager,
        canvas: manager.canvas,

        add: function(object) {
            this.canvas.add(object);
        },

        renderShape: function(Shape, config) {
            console.log('rendering shape', config);
            this.canvas.add(new Shape(config));
            this.canvas.renderAll();
        },

        renderAll: function() {
            this.canvas.renderAll();
        }
    };

    self.registerBlock = function(block) {
        var items = block._shapes,
            c,
            handleBlockMove = function(event) {
                var target = self.canvas.getActiveObject(),
                    gplId = target.gplId,
                    movingBlock = self.blocks[gplId];

                if(movingBlock) {
                    movingBlock._syncObjects(event);
                }
            };

        self.blocks[block.gplId] = block;

        self.canvas.add(block);

        for(c=0; c<items.length; c++) {
            self.canvas.add(items[c]);
            items[c].on('moving', handleBlockMove);
        }

        self.renderAll();
    };

    // manager.registerHandler({
    //     event: 'mouse:down',
    //     handler: function(event) {
    //         var pointer = self.canvas.getPointer(event.e),
    //             x = pointer.x,
    //             y = pointer.y;

    //         if(!manager.isEditingLine && event.target && event.target.isAnchor === true) {
    //             manager.shapes.push(new gpl.SchematicLine(x, y, event.target, manager));
    //         }
    //     }
    // });

    return self;
};

gpl.Manager = function() {
    var self = this,
        configuredEvents = {},
        log = gpl._log,
        gridSize = 5,
        initDelay = 1,
        currInitStep = 0,
        initFlow = ['initCanvas', 'initManagers', 'initShapes', 'initEvents'],//, 'initToolbar'],

        init = function() {
            var doNextInit = function() {
                    var initFn = initFlow[currInitStep];

                    if(initFn) {
                        gpl._log('init:', initFn);
                        currInitStep++;
                        setTimeout(function() {
                            self[initFn]();
                            doNextInit();
                        }, initDelay);
                    } else {
                        self.renderAll();
                        gpl._log('Finished initializing GPL Manager');
                    }
                };

            self.gplObjects = {};
            self.eventHandlers = {};
            self.shapes = [];
            self.state = null;

            doNextInit();            
        };

    gpl._log('Initializing GPL Manager');

    self.getObject = function(config)  {
        var start = new Date().getTime(),
            gap,
            gplType = config.gplType,
            left = config.left,
            top = config.top,
            objects = self.canvas.getObjects(),
            c,
            len = objects.length,
            obj,
            ret = {},
            found = false;

        for(c=0; c<len && !found; c++) {
            obj = objects[c];
            if(gplType === obj.gplType && left >= obj.left && left <= (obj.left + obj.width) && top >= obj.top && top <= (obj.top + obj.height)) {
                found = true;
                ret = obj;
            }
        }
        gap = new Date().getTime() - start;
        self._getObjectCount++;
        self._getObjectTime += gap;
        return ret;
    };

    self.renderAll = function() {
        self.canvas.renderAll();
    };

    self.setState = function(state) {
        log('setting state', state);
        self.state = state;
    };

    self.clearState = function() {
        log('clearing state');
        self.state = null;
    };

    self.registerHandler = function(config) {
        var event = config.event,
            handler = config.handler,
            type = config.type || 'canvas',
            domType = config.window?window:document;

        self.eventHandlers[event] = self.eventHandlers[event] || [];
        self.eventHandlers[event].push(handler);

        if(!configuredEvents[event]) {
             configuredEvents[event] = true;
             if(type === 'canvas') {
                self.canvas.on(event, function(evt) {
                    self.processEvent(event, evt);
                });
            } else {
                $(domType).on(event, function(evt) {
                    self.processEvent(event, evt);
                });
            }
        }
    };

    self.registerHandlers = function(handlers) {
        var c,
            len = handlers.length;

        for(c=0; c<len; c++) {
            self.registerHandler(handlers[c]);
        }
    };

    self.unregisterHandler = function(config) {
        var event = config.event,
            handler = config.handler,
            c,
            handlers = self.eventHandlers[event] || [];

        for(c=handlers.length-1; c>=0; c--) {
            if(handlers[c] === handler) {
                handlers.splice(c, 1);
            }
        }
    };

    self.unregisterHandlers = function(handlers) {
        var c,
            len = handlers.length;

        for(c=0; c<len; c++) {
            self.unregisterHandler(handlers[c]);
        }
    };    

    self.processEvent = function(type, event) {
        var c,
            handlers = self.eventHandlers[type] || [],
            len = handlers.length;

        for(c=0; c<len; c++) {
            handlers[c](event);
        } 
    };

    self.createObject = function(Type, config) {
        var object,
            oType,
            id = gpl.makeId(),
            objects = self.gplObjects;

        config = $.extend({gplId: id}, config);

        object = new Type(config);

        oType = object.type;

        objects[oType] = objects[oType] || {};

        objects[oType][id] = object;

        self.shapes.push(object);
        self.canvas.add(object);

        return object;
    };


    self.initCanvas = function() {
        var $canvasEl = $('#gplCanvas');

        $canvasEl.attr({
            width: window.innerWidth,
            height: window.innerHeight
        });

        self.canvas = new fabric.Canvas('gplCanvas', {
            renderOnAddRemove: false,
            selection: true,
            backgroundColor: '#C8BEAA',
            hoverCursor: 'pointer'
        });

        self._getObjectCount = 0;
        self._getObjectTime = 0;

        self.coordinateText = new fabric.Text('x,x', {
            top: 0,
            left: window.innerWidth - 50,
            textAlign: 'center',
            fontSize: 12,
            fontFamily: 'arial',
            gplType: 'label'
        });
        self.canvas.add(self.coordinateText);

        self.canvas.on('object:moving', function() {
            // console.log(arguments);
        });

        self.canvas.on('mouse:move', function(event) {
            var pointer = self.canvas.getPointer(event.e);
            self.coordinateText.text = pointer.x + ',' + pointer.y;
            self.renderAll();
        });
    };

    self.initToolbar = function() {
        self.toolbar = new gpl.Toolbar(self);
    };

    self.initManagers = function() {
        gpl.blockManager = new gpl.BlockManager(self);
        gpl.anchorManager = new gpl.AnchorManager(self);
    };

    self.initShapes = function() {
        var sequence = gplJson.Sequence,
            lines = sequence.Line,
            blocks = sequence.Block,
            line,
            block,
            blocktype,
            handles,
            handle,
            coords,
            config,
            c,
            cc,

            blockMatrix = {
                Input: 'MonitorBlock',
                Output: 'ControlBlock',
                Constant: 'ConstantBlock',
                Logic: 'LogicBlock',
                FindSmallest: 'FindSmallest',
                PI: 'PI',
                ReverseActingPI: 'PI',
                Multiply: 'Multiply',
                SPA: 'SPA',
                TextBlock: 'TextBlock'
            };

        gpl._log('creating blocks');

        for(c=0; c<blocks.length; c++) {
            block = blocks[c];
            blocktype = blockMatrix[block.BlockType];
            if(blocktype) {
                config = $.extend({}, block);
                config.left = parseInt(config.Left, 10);
                config.top = parseInt(config.Top, 10);
                config.label = config.Label;
                config.labelVisible = config.LabelVisible;
                if(config.Width) {
                    config.width = config.Width;
                }
                if(config.Height) {
                    config.height = config.Height;
                }
                self.shapes.push(new gpl.blocks[blocktype](config));
            }
        }

        gpl._log('creating lines');

        for(c=0; c<lines.length; c++) {
            coords = [];
            line = lines[c];
            handles = line.Handle;
            for(cc=0; cc<handles.length; cc++) {
                handle = handles[cc];
                coords.push({
                    x: parseInt(handle.x, 10),
                    y: parseInt(handle.y, 10)
                });
            }
            self.shapes.push(new gpl.ConnectionLine(coords, self.canvas));
        }

        gpl._log('rendering all');

        self.renderAll();

        gpl._log('done rendering all');
    };

    self.initEvents = function() {
        self.registerHandlers([{
            event: 'object:moving',
            handler:  function(options) {
                options.target.set({
                    left: Math.round(options.target.left / gridSize) * gridSize,
                    top: Math.round(options.target.top / gridSize) * gridSize
                });
                // gpl._log('snapping to grid', options.target.left, options.target.top, options.target.gplId);
            }
        }, {
            event: 'mouse:down',
            handler:  function(event) {
                self.mouseDown = true;

                var pointer = self.canvas.getPointer(event.e),
                    x = pointer.x,
                    y = pointer.y,
                    target = event.target;

                if(!self.isEditingLine && event.target && event.target.isAnchor === true) {
                    self.shapes.push(new gpl.SchematicLine(x, y, event.target, self, target.isVertical));
                }
            }
        }, {
            event: 'beforeunload',
            handler: function(event) {
                self.canvas.removeListeners();
                $(document).off();
                $(window).off();
                self.canvas.clear();
                self.canvas.dispose();
                $(self.canvas.wrapperEl).remove();
            },
            type: 'DOM',
            window: true
        }, {
            event: 'keydown',
            handler: function(event) {
                if(event.which === 46) {
                    self.canvas.remove(self.canvas.getActiveObject());
                    self.renderAll();
                }
            },
            type: 'DOM'
        }]);                        
    };

    init();
};

//initialization -------------------------------------
gpl.manager = new gpl.Manager();

// gpl.test = new gpl.blocks.MonitorBlock({
//     left: 200,
//     top: 200
// }); 

// gpl.test1 = new gpl.blocks.LogicBlock({
//     left: 200,
//     top: 300
// });

// gpl.test2 = new gpl.blocks.ControlBlock({
//     left: 400,
//     top: 400
// });

// gpl.test3 = new gpl.blocks.ConstantBlock({
//     left: 300,
//     top: 100
// });
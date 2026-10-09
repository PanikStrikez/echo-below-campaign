(()=>{'use strict';if(globalThis.location?.hash==='#player')return;globalThis.UNDERMOUNTAIN_MAP_COLLECTION={
  "schemaVersion": 1,
  "collectionId": "undermountain-source-floor-maps",
  "status": "reviewed additive map proposals; no automatic save migration",
  "sourcePdf": "sources/pdfcoffee.com_dungeon-of-the-mad-mage-29112018-pdf-free.pdf",
  "policy": {
    "saveWrites": false,
    "automaticReplacement": false,
    "singleAuthoritativeFloor": true,
    "sectionsFocusOnly": true,
    "playerArtworkHasNoKeys": true,
    "displayDisclosure": "Stage shares a full clean crop; live combat uses one saved, fogged floor."
  },
  "maps": [
    {
      "id": "undermountain-proposal-level-1",
      "sceneId": "um-map-level-1",
      "title": "Undermountain · Dungeon Level, source layout",
      "playerTitle": "Dungeon Level",
      "proposalImage": "atlas/undermountain/level-1-player.svg",
      "dmImage": "atlas/undermountain/level-1-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": true,
      "viewBox": [
        -536.725,
        65.525,
        2572.5,
        1715
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "floorFog": {
        "cols": 300,
        "rows": 200
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "Hand-traced source grid reconstruction: ordinary halls, stair branches, rooms, and encounter approaches follow the printed plan. Art omits keyed occupants, room numbers, traps, gate conditions and hidden routes. Source extraction is not pixel-perfect.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "entryPoints": [
        {
          "id": "um-well-up",
          "title": "Area 1 well to Yawning Portal",
          "kind": "well shaft",
          "point": [
            740.95,
            863
          ],
          "returnBoardId": "wd-map-yawning-portal",
          "returnSceneId": "wd-portal",
          "playerTitle": "Well ascent",
          "note": "Return via the actual winch/fee arrangement, one passenger at a time. The bandit north one-way secret is not this exit."
        },
        {
          "id": "um-stairs-down",
          "title": "Area 39a ordinary stairs to Level 2",
          "kind": "stairs",
          "point": [
            672.35,
            1574.725
          ],
          "returnBoardId": "undermountain-level-2",
          "playerTitle": "Stairs down",
          "note": "Leads 200 feet down toward Level 2 area 1a. No prepared player Level 2 map until chosen."
        },
        {
          "id": "um-gate-26d",
          "title": "Area 26d gate (not ordinary stairs)",
          "kind": "gate",
          "point": [
            706.65,
            1343.2
          ],
          "returnBoardId": "undermountain-level-10",
          "playerTitle": "Gate",
          "note": "Level 11 or higher; destination Level 10 area 8. Knowing this room does not activate the gate."
        }
      ],
      "revealOverlays": [
        {
          "id": "cellar-access",
          "title": "Area 3: discovered relief and flooded access",
          "note": "South nalfeshnee relief in 2a. Add only after access is discovered; water deepens westward.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-cellar-access.svg",
          "disclosed": false
        },
        {
          "id": "retreat-access",
          "title": "Area 7: discovered concealed retreat",
          "note": "Two separate source secret doors, from 6a approach and 8a back passage. No one-way rule.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-retreat-access.svg",
          "disclosed": false
        },
        {
          "id": "cubicle-access",
          "title": "Area 11: discovered secret cubicle",
          "note": "Concealed side chamber off the winding western corridor.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-cubicle-access.svg",
          "disclosed": false
        },
        {
          "id": "closet-access",
          "title": "Area 14c: discovered concealed closet",
          "note": "Northeast/east secret door from 14b.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-closet-access.svg",
          "disclosed": false
        },
        {
          "id": "north-backway",
          "title": "Area 1 / 6b: discovered northern back passage",
          "note": "Area 1 north secret opens manually from north only; from well-room side magic is required. Six-b alarm belongs west side of secret.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-north-backway.svg",
          "disclosed": false
        },
        {
          "id": "north-relief",
          "title": "Area 4: discovered relief doorway",
          "note": "North dretch relief in 2a; obvious from inside 4. Tiny vents are not a party passage.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-north-relief.svg",
          "disclosed": false
        },
        {
          "id": "west-loop",
          "title": "Areas 28a / 29: discovered west connection",
          "note": "Concealed door from northern end of area 28a.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-west-loop.svg",
          "disclosed": false
        },
        {
          "id": "east-loop",
          "title": "Areas 28c / 29: discovered east connection",
          "note": "Concealed door from northern end of area 28c.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-east-loop.svg",
          "disclosed": false
        },
        {
          "id": "statue-backway",
          "title": "Areas 30b / 31: discovered concealed passage",
          "note": "West secret of 30b joins north statue-secret in 31.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-statue-backway.svg",
          "disclosed": false
        },
        {
          "id": "rough-backway",
          "title": "Areas 36c / 36b: discovered rough passage",
          "note": "Northeastern secret of 36c links to 36b through the mapped rough passage.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-rough-backway.svg",
          "disclosed": false
        },
        {
          "id": "curved-backway",
          "title": "Areas 37 / 38 / 39a: discovered curved passage",
          "note": "South secret in 37, curved passage 38, west secret into 39a.",
          "sourceRef": {
            "source": "Dungeon of the Mad Mage",
            "locator": "Printed map 15; supplied PDF page 16; room keys printed pp14–26",
            "verification": "Keyed source image visually inspected against ten-foot grid; manual vector trace reconciled with room-key text. Wall contours are approximate, not a publisher vector extraction."
          },
          "image": "atlas/undermountain/level-1-reveal-curved-backway.svg",
          "disclosed": false
        }
      ],
      "playNotes": {
        "summary": "One authoritative saved Level 1. Sections focus the same floor and use the same token, fog and native object records.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ],
      "reviewNeeded": true,
      "geometryChanged": true
    },
    {
      "id": "undermountain-proposal-level-1-entry",
      "sceneId": "um-map-level-1-entry",
      "title": "Dungeon Level · Entry, reliefs and pillar junction",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-entry-player.svg",
      "dmImage": "atlas/undermountain/level-1-entry-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        387.66,
        796.115,
        430.465,
        286.976095
      ],
      "viewBox": [
        387.66,
        796.115,
        430.465,
        286.976095
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "1",
        "2a",
        "2b",
        "4",
        "21"
      ],
      "expeditionIds": [
        "map",
        "instrument",
        "passage"
      ],
      "entryPoints": [
        {
          "id": "um-well-up",
          "title": "Area 1 well to Yawning Portal",
          "kind": "well shaft",
          "point": [
            740.95,
            863
          ],
          "returnBoardId": "wd-map-yawning-portal",
          "returnSceneId": "wd-portal",
          "playerTitle": "Well ascent",
          "note": "Return via the actual winch/fee arrangement, one passenger at a time. The bandit north one-way secret is not this exit."
        }
      ],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 1, 2a, 2b, 4, 21 are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    },
    {
      "id": "undermountain-proposal-level-1-north",
      "sceneId": "um-map-level-1-north",
      "title": "Dungeon Level · Northern threshold and Undertakers",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-north-player.svg",
      "dmImage": "atlas/undermountain/level-1-north-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        209.3,
        520,
        643.125,
        428.74999999999994
      ],
      "viewBox": [
        209.3,
        520,
        643.125,
        428.74999999999994
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "5",
        "6a",
        "6b",
        "6c",
        "6d",
        "6e",
        "7a",
        "8a",
        "8b"
      ],
      "expeditionIds": [
        "map",
        "passage"
      ],
      "entryPoints": [
        {
          "id": "um-well-up",
          "title": "Area 1 well to Yawning Portal",
          "kind": "well shaft",
          "point": [
            740.95,
            863
          ],
          "returnBoardId": "wd-map-yawning-portal",
          "returnSceneId": "wd-portal",
          "playerTitle": "Well ascent",
          "note": "Return via the actual winch/fee arrangement, one passenger at a time. The bandit north one-way secret is not this exit."
        }
      ],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 5, 6a, 6b, 6c, 6d, 6e, 7a, 8a, 8b are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    },
    {
      "id": "undermountain-proposal-level-1-excavation",
      "sceneId": "um-map-level-1-excavation",
      "title": "Dungeon Level · Southern excavations",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-excavation-player.svg",
      "dmImage": "atlas/undermountain/level-1-excavation-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        217.875,
        837.275,
        643.125,
        428.74999999999994
      ],
      "viewBox": [
        217.875,
        837.275,
        643.125,
        428.74999999999994
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "2b",
        "21",
        "22",
        "23a",
        "23b",
        "23c",
        "24a",
        "24b",
        "25a",
        "25b"
      ],
      "expeditionIds": [
        "instrument",
        "passage"
      ],
      "entryPoints": [
        {
          "id": "um-well-up",
          "title": "Area 1 well to Yawning Portal",
          "kind": "well shaft",
          "point": [
            740.95,
            863
          ],
          "returnBoardId": "wd-map-yawning-portal",
          "returnSceneId": "wd-portal",
          "playerTitle": "Well ascent",
          "note": "Return via the actual winch/fee arrangement, one passenger at a time. The bandit north one-way secret is not this exit."
        }
      ],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 2b, 21, 22, 23a, 23b, 23c, 24a, 24b, 25a, 25b are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    },
    {
      "id": "undermountain-proposal-level-1-western",
      "sceneId": "um-map-level-1-western",
      "title": "Dungeon Level · Western negotiation approach",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-western-player.svg",
      "dmImage": "atlas/undermountain/level-1-western-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        209.3,
        931.6,
        694.5749999999999,
        463.04999999999995
      ],
      "viewBox": [
        209.3,
        931.6,
        694.5749999999999,
        463.04999999999995
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "23a",
        "23b",
        "23c",
        "24a",
        "24b",
        "25a",
        "25b",
        "26a"
      ],
      "expeditionIds": [
        "passage"
      ],
      "entryPoints": [
        {
          "id": "um-gate-26d",
          "title": "Area 26d gate (not ordinary stairs)",
          "kind": "gate",
          "point": [
            706.65,
            1343.2
          ],
          "returnBoardId": "undermountain-level-10",
          "playerTitle": "Gate",
          "note": "Level 11 or higher; destination Level 10 area 8. Knowing this room does not activate the gate."
        }
      ],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 23a, 23b, 23c, 24a, 24b, 25a, 25b, 26a are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    },
    {
      "id": "undermountain-proposal-level-1-upper-west",
      "sceneId": "um-map-level-1-upper-west",
      "title": "Dungeon Level · Northern western halls",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-upper-west-player.svg",
      "dmImage": "atlas/undermountain/level-1-upper-west-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        192.15,
        82.675,
        591.675,
        394.45
      ],
      "viewBox": [
        192.15,
        82.675,
        591.675,
        394.45
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "8a",
        "9a",
        "9b",
        "12",
        "14a",
        "14b"
      ],
      "expeditionIds": [],
      "entryPoints": [],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 8a, 9a, 9b, 12, 14a, 14b are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    },
    {
      "id": "undermountain-proposal-level-1-upper-east",
      "sceneId": "um-map-level-1-upper-east",
      "title": "Dungeon Level · Northern eastern halls",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-upper-east-player.svg",
      "dmImage": "atlas/undermountain/level-1-upper-east-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        723.8,
        219.875,
        694.5749999999999,
        463.04999999999995
      ],
      "viewBox": [
        723.8,
        219.875,
        694.5749999999999,
        463.04999999999995
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "16",
        "17a",
        "17b",
        "18",
        "19a",
        "19b",
        "19c",
        "20"
      ],
      "expeditionIds": [],
      "entryPoints": [],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 16, 17a, 17b, 18, 19a, 19b, 19c, 20 are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    },
    {
      "id": "undermountain-proposal-level-1-lower-center",
      "sceneId": "um-map-level-1-lower-center",
      "title": "Dungeon Level · Southern central passages",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-lower-center-player.svg",
      "dmImage": "atlas/undermountain/level-1-lower-center-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        457.975,
        1171.7,
        694.5749999999999,
        463.04999999999995
      ],
      "viewBox": [
        457.975,
        1171.7,
        694.5749999999999,
        463.04999999999995
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "26a",
        "26c",
        "26d",
        "27",
        "28a",
        "28b",
        "28c",
        "29",
        "30a",
        "31"
      ],
      "expeditionIds": [],
      "entryPoints": [
        {
          "id": "um-stairs-down",
          "title": "Area 39a ordinary stairs to Level 2",
          "kind": "stairs",
          "point": [
            672.35,
            1574.725
          ],
          "returnBoardId": "undermountain-level-2",
          "playerTitle": "Stairs down",
          "note": "Leads 200 feet down toward Level 2 area 1a. No prepared player Level 2 map until chosen."
        },
        {
          "id": "um-gate-26d",
          "title": "Area 26d gate (not ordinary stairs)",
          "kind": "gate",
          "point": [
            706.65,
            1343.2
          ],
          "returnBoardId": "undermountain-level-10",
          "playerTitle": "Gate",
          "note": "Level 11 or higher; destination Level 10 area 8. Knowing this room does not activate the gate."
        }
      ],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 26a, 26c, 26d, 27, 28a, 28b, 28c, 29, 30a, 31 are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    },
    {
      "id": "undermountain-proposal-level-1-lower-east",
      "sceneId": "um-map-level-1-lower-east",
      "title": "Dungeon Level · Eastern caverns and descent",
      "playerTitle": "Dungeon Level section",
      "proposalImage": "atlas/undermountain/level-1-lower-east-player.svg",
      "dmImage": "atlas/undermountain/level-1-lower-east-dm-keyed.svg",
      "publicImageApproved": true,
      "locationId": "loc-undermountain-dungeon-level",
      "parentBoardId": "undermountain-level-1",
      "floorProposalId": "undermountain-proposal-level-1",
      "isFloorMaster": false,
      "focusOnly": true,
      "sectionBounds": [
        818.125,
        828.7,
        591.675,
        754.5999999999999
      ],
      "viewBox": [
        818.125,
        828.7,
        591.675,
        754.5999999999999
      ],
      "sourceFrame": {
        "nativePixels": [
          1443,
          1900
        ],
        "printedGridOrigin": [
          3.5,
          5.5
        ],
        "printedSquarePixels": 17.15,
        "printedSquareFeet": 10,
        "coordinateBasis": "Hand-traced source image; all child sectionBounds share this padded source coordinate frame."
      },
      "scale": {
        "gridColumns": 300,
        "tacticalMeasurement": true,
        "feetPerSquare": 5,
        "sourceSquaresFeet": 10,
        "measurementPrecision": "Five-foot subgrid aligned to the printed 10-foot squares. Irregular walls and off-map expanded tunnels remain approximate."
      },
      "source": {
        "title": "Waterdeep: Dungeon of the Mad Mage",
        "printedMapPage": 15
      },
      "sourceRefs": [
        {
          "source": "Dungeon of the Mad Mage",
          "printedMapPage": 15,
          "pdfPage": 16,
          "roomKeys": "Dungeon Level areas 1–41",
          "verification": "Source raster visually inspected; vector footprints hand traced; door/secret distinctions spot checked against keyed text and route packs."
        }
      ],
      "precision": "A crop from the same Level 1 source frame. Shows only the current authored section; stage the shared saved floor for live fog, combat and room state.",
      "accessRequirement": "Locate Undermountain and confirm the well-descent arrangement in play. Stage with all fog hidden; the town, payment, party position and any room outcome remain unchanged.",
      "roomKeys": [
        "30a",
        "32a",
        "33",
        "34",
        "35",
        "36a",
        "36b",
        "36c",
        "39a",
        "40",
        "41"
      ],
      "expeditionIds": [],
      "entryPoints": [],
      "playNotes": {
        "summary": "Linked section of the same saved Level 1 floor. Rooms 30a, 32a, 33, 34, 35, 36a, 36b, 36c, 39a, 40, 41 are source keys in the private companion; only reached rooms appear on the TV.",
        "cover": "Pillars, masonry and rubble provide cover based on actual sight lines. No cover bonus is automatic.",
        "elevation": "North 2b and south 25a approaches include source stairs. Room-key elevation differences remain private until seen; only reviewed geometry is presented.",
        "movement": "The well room ordinary exit runs south and west to 2a and 2b. From 2b, north reaches the Undertakers, south leads to 25a, and west reaches the mirror hall. A hidden north door in room 1 is not an ordinary return route.",
        "furniture": "No people, treasure, traps, gates or custom instrument are painted on the clean floor.",
        "sceneUses": [
          "A Map Worth Paying For — well → 2a → 2b → northern threshold 6a.",
          "The Missing Instrument — well → 2a → 2b → 25a, with 25b optional.",
          "Terms of Passage — verified southern lane; optional western route to 23 via 24 and 25."
        ]
      },
      "questIds": [
        "route",
        "instrument",
        "passage"
      ]
    }
  ]
};})();

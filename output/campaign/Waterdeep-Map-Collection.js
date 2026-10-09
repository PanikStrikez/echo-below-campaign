/* Private proposal catalog only. Loading it performs no registration, save write, or permission change. */
(()=>{'use strict';globalThis.WATERDEEP_MAP_COLLECTION={
  "version": 1,
  "collectionId": "waterdeep-original-play-space-proposals",
  "policy": {
    "proposalOnly": true,
    "saveWrites": false,
    "automaticReplacement": false,
    "publicArt": "Native inert SVG geometry only. No names, secrets, creatures, traps, occupants, ownership, rental or faction marks. Closed private rooms are opaque roof silhouettes.",
    "sourceStatus": "Campaign-specific rooms and local block are original proposals; Portal well is 40 ft from published prose. No source-canonical floorplan claim.",
    "access": "A technically approved public image does not establish permission, tenancy, discovery or actual events.",
    "privateOnly": [
      "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "atlas/tactical/build-waterdeep-collection.cjs"
    ],
    "streetPlacement": "Proposed block only. Parent atlas may propose a Castle Ward pin near the Portal; actual street, ward, bearing and distance are not established by these drawings."
  },
  "maps": [
    {
      "id": "waterdeep-proposal-mending-neighborhood",
      "sceneId": "wd-map-mending-neighborhood",
      "legacySceneId": null,
      "sourceSceneIds": [
        "city-waterdeep",
        "mc-court"
      ],
      "title": "Mending Court · proposed street block",
      "playerTitle": "Courtyard neighborhood",
      "publicTitle": "Courtyard neighborhood",
      "locationId": "loc-mending-court",
      "parentBoardId": "city-waterdeep",
      "masterId": "mending-neighborhood",
      "proposalImage": "atlas/tactical/wd-mending-neighborhood.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": false,
        "tacticalMeasurement": false,
        "squareFeet": null,
        "gridColumns": null,
        "gridRows": null,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Schematic local block; no mileage, street address or compass bearing confirmed."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": false,
      "accessRequirement": "Reveal only as an explicitly proposed local block; street/ward/compass placement and route remain unconfirmed.",
      "entryPoints": [
        {
          "id": "court-passage",
          "title": "Covered court passage",
          "point": [
            650,
            286
          ],
          "returnSceneId": "wd-map-mending-court",
          "returnProposalId": "waterdeep-proposal-mending-court",
          "kind": "passage"
        },
        {
          "id": "portal-direction",
          "title": "Route toward the tavern",
          "point": [
            0,
            150
          ],
          "returnSceneId": "wd-map-yawning-portal",
          "returnProposalId": "waterdeep-proposal-yawning-portal",
          "kind": "street",
          "note": "Off-map walking connection only; no distance, address or bearing established."
        }
      ],
      "sourceRefs": [
        {
          "source": "Campaign-Courtyard-Data.js",
          "locator": "layout: mc-passage, mc-rooms, mc-bindery, mc-well, mc-table, mc-kitchen, mc-stair",
          "verification": "Approved proposed seven-zone arrangement read directly; no ward/address/physical measurements established by that plan."
        },
        {
          "source": "Campaign-Transition-Data.js",
          "locator": "tr-courtyard, tr-neighbors",
          "verification": "Rental, keys, storage, access and actual introductions must be agreed; no automatic tenancy or relationship."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "A proposed local block for choosing a stop and explaining the route to the tavern. Services and contacts are private preparation.",
        "cover": [
          "Roof shapes show opaque buildings, not accessible interiors or a measured cover layout.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Schematic plan only: no elevation, distance or compass bearing is established."
        ],
        "movement": [
          "Use the north passage and the street toward the west edge as a proposed walking connection. Enter a linked tactical board before measuring movement."
        ],
        "furniture": [
          "The well, shared table and surrounding roofs are ordinary landmarks. Service markers describe possible visits, not shops the party owns or people currently present."
        ],
        "sceneUses": [
          "Exploration: choose a service or confirm the walking route with a willing resident.",
          "Conversation: arrange a meeting or ordinary service without presuming an introduction.",
          "Combat: switch to the relevant measured court or interior board."
        ]
      },
      "preparation": {
        "status": "original-campaign-preparation",
        "opening": "Optional arrival framing: a covered passage leads from an ordinary working street to the well and shared court. Establish who is present from current play before using any contact below.",
        "arrivalPoints": [
          {
            "id": "street-arrival",
            "title": "Main street turn",
            "point": [
              650,
              150
            ],
            "note": "Proposed ordinary landmark for explaining the route; street name, bearing and distance are unassigned.",
            "source": "Campaign-Courtyard-Data.js: overview/location"
          },
          {
            "id": "court-arrival",
            "title": "Covered passage",
            "point": [
              650,
              286
            ],
            "note": "Keep the approach clear; visiting does not grant entry through private doors.",
            "source": "Campaign-Courtyard-Data.js: mc-passage"
          }
        ],
        "serviceContacts": [
          {
            "id": "binding-service",
            "title": "Book repair and notebooks",
            "contactName": "Nessa Brindle",
            "service": "Ordinary book repair, notebook making and protective-case estimates.",
            "npcIds": [
              "nessa-brindle"
            ],
            "targetBoardId": "wd-map-mending-bindery",
            "point": [
              773,
              373
            ],
            "note": "Ask before entering or handling customer property. Confirm scope, cost, time and current availability; no historical clue is offered by this card.",
            "price": null,
            "available": null,
            "agreement": null
          },
          {
            "id": "food-service",
            "title": "Meals and packed food",
            "contactName": "Jori Fen and Pellan Fen",
            "service": "A meal, packed food or an ordinary food-stall inquiry by arrangement.",
            "npcIds": [
              "jori-fen",
              "pellan-fen"
            ],
            "targetBoardId": "wd-map-mending-shared",
            "point": [
              494,
              540
            ],
            "note": "Use their actual introduction history. Ask about dietary needs and agree price or invitation; no free provisions or current presence is presumed.",
            "price": null,
            "available": null,
            "agreement": null
          },
          {
            "id": "packing-service",
            "title": "Packing and local deliveries",
            "contactName": "Orenna Pike",
            "service": "Packing advice, local delivery introductions and a possible return-contact arrangement.",
            "npcIds": [
              "orenna-pike"
            ],
            "targetBoardId": "wd-map-mending-court",
            "point": [
              650,
              267
            ],
            "note": "Confirm a bounded request and her willingness. Advice does not make her a permanent porter, custodian or current watcher of party possessions.",
            "price": null,
            "available": null,
            "agreement": null
          },
          {
            "id": "landing-task",
            "title": "Shared landing and copying",
            "contactName": "Aven Rusk, when actually available",
            "service": "Ordinary copying or a second observer for an agreed non-destructive comparison.",
            "npcIds": [
              "aven-rusk"
            ],
            "targetBoardId": "wd-map-mending-shared",
            "point": [
              779,
              541
            ],
            "note": "Shared landing access and quiet time need agreement. No attic entry, spell access, teacher relationship or knowledge of a private object is implied.",
            "price": null,
            "available": null,
            "agreement": null
          }
        ],
        "onwardRoutes": [
          {
            "direction": "Court passage → main street → tavern direction",
            "destinationLocationId": "loc-yawning-portal",
            "targetBoardId": "wd-map-yawning-portal",
            "distanceMiles": null,
            "points": [
              [
                650,
                286
              ],
              [
                650,
                150
              ],
              [
                0,
                150
              ]
            ],
            "note": "A proposed walking connection toward the Yawning Portal. The off-map continuation is not surveyed, and no exact street, compass bearing or travel time is established."
          }
        ],
        "decisionsToConfirm": [
          "Who is present and who has actually been introduced?",
          "What service, scope, price, timing and handling permission have been agreed?",
          "Which common spaces and private rooms may the visitors enter now?",
          "Confirm the actual walking route before treating a proposed street turn as known geography.",
          "Any lodging or secured-storage arrangement remains separate from a visit or service request."
        ],
        "markers": [
          {
            "id": "binding-service",
            "title": "Book repair and notebooks",
            "x": 773,
            "y": 373,
            "targetBoardId": "wd-map-mending-bindery",
            "public": false
          },
          {
            "id": "food-service",
            "title": "Meals and packed food",
            "x": 494,
            "y": 540,
            "targetBoardId": "wd-map-mending-shared",
            "public": false
          },
          {
            "id": "packing-service",
            "title": "Packing and local deliveries",
            "x": 650,
            "y": 267,
            "targetBoardId": "wd-map-mending-court",
            "public": false
          },
          {
            "id": "landing-task",
            "title": "Shared landing and copying",
            "x": 779,
            "y": 541,
            "targetBoardId": "wd-map-mending-shared",
            "public": false
          }
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation"
      ],
      "precision": "Custom proposed local street block; geographic/compass placement unconfirmed.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-mending-court",
      "sceneId": "wd-map-mending-court",
      "legacySceneId": null,
      "sourceSceneIds": [
        "mc-court",
        "city-waterdeep"
      ],
      "title": "Mending Court · public courtyard",
      "playerTitle": "Shared courtyard",
      "publicTitle": "Shared courtyard",
      "locationId": "loc-mending-court",
      "parentBoardId": "wd-map-mending-neighborhood",
      "masterId": "mending-court",
      "proposalImage": "atlas/tactical/wd-mending-court.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 30,
        "gridRows": 20,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": false,
      "accessRequirement": "Stage after choosing to visit; lodging, bindery, pantry and upper rooms remain private behind closed doors.",
      "entryPoints": [
        {
          "id": "street-passage",
          "title": "Street passage",
          "point": [
            600,
            100
          ],
          "returnSceneId": "wd-map-mending-neighborhood",
          "returnProposalId": "waterdeep-proposal-mending-neighborhood",
          "kind": "covered-passage"
        },
        {
          "id": "lodging-door",
          "title": "Available-room door",
          "point": [
            360,
            320
          ],
          "returnSceneId": "wd-map-mending-lodging",
          "returnProposalId": "waterdeep-proposal-mending-lodging",
          "kind": "door",
          "permissionRequired": true
        },
        {
          "id": "bindery-door",
          "title": "Workroom door",
          "point": [
            840,
            320
          ],
          "returnSceneId": "wd-map-mending-bindery",
          "returnProposalId": "waterdeep-proposal-mending-bindery",
          "kind": "door",
          "permissionRequired": true
        },
        {
          "id": "shared-door",
          "title": "Shared workspace door",
          "point": [
            360,
            640
          ],
          "returnSceneId": "wd-map-mending-shared",
          "returnProposalId": "waterdeep-proposal-mending-shared",
          "kind": "door",
          "permissionRequired": true
        }
      ],
      "sourceRefs": [
        {
          "source": "Campaign-Courtyard-Data.js",
          "locator": "layout: mc-passage, mc-rooms, mc-bindery, mc-well, mc-table, mc-kitchen, mc-stair",
          "verification": "Approved proposed seven-zone arrangement read directly; no ward/address/physical measurements established by that plan."
        },
        {
          "source": "Campaign-Transition-Data.js",
          "locator": "tr-courtyard, tr-neighbors",
          "verification": "Rental, keys, storage, access and actual introductions must be agreed; no automatic tenancy or relationship."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "Run arrivals, ordinary shared life and movement between the street, well, common table and permitted doors.",
        "cover": [
          "The stone well rim, washing slab and tables are possible obstructions. Cloth lines and the awning are not solid cover. Private roof areas are not traversable floor.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: exposed court and lower landing are level at 0 ft; the stair leads toward an off-board upper level at +10 ft. That rise is an optional play dimension, not a published measurement."
        ],
        "movement": [
          "Keep the north passage clear. The lodging and bindery doors are 10 ft wide; pantry and lower-stair doors are 5 ft. Knock before entering a roofed private area."
        ],
        "furniture": [
          "The table, repair bench, washing slab and lower-landing desk belong to the proposed shared setting. Placing gear there requires agreement; the court is not party storage."
        ],
        "sceneUses": [
          "Exploration: inspect only ordinary visible features and permitted doors.",
          "Conversation: use the common table for a bounded discussion or shared task.",
          "Combat: use existing movement rules around the well and furniture; no hostile presence is implied."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-mending-bindery",
      "sceneId": "wd-map-mending-bindery",
      "legacySceneId": null,
      "sourceSceneIds": [
        "mc-court"
      ],
      "title": "Mending Court · permitted bindery workroom",
      "playerTitle": "Binding workroom",
      "publicTitle": "Binding workroom",
      "locationId": "loc-mending-court",
      "parentBoardId": "wd-map-mending-court",
      "masterId": "mending-court",
      "proposalImage": "atlas/tactical/wd-mending-bindery.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        800,
        160,
        480,
        320
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 12,
        "gridRows": 8,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Confirm permission to enter the bindery and handle work materials. Ordinary press, sewing frame and drying boards are proposed fixtures. No customer contents, historical clue or upstairs residence is exposed; no purchase or employment is implied.",
      "entryPoints": [
        {
          "id": "court-return",
          "title": "Return to the court",
          "point": [
            840,
            320
          ],
          "returnSceneId": "wd-map-mending-court",
          "returnProposalId": "waterdeep-proposal-mending-court",
          "kind": "door"
        }
      ],
      "sourceRefs": [
        {
          "source": "Campaign-Courtyard-Data.js",
          "locator": "layout: mc-passage, mc-rooms, mc-bindery, mc-well, mc-table, mc-kitchen, mc-stair",
          "verification": "Approved proposed seven-zone arrangement read directly; no ward/address/physical measurements established by that plan."
        },
        {
          "source": "Campaign-Transition-Data.js",
          "locator": "tr-courtyard, tr-neighbors",
          "verification": "Rental, keys, storage, access and actual introductions must be agreed; no automatic tenancy or relationship."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "A permitted workroom visit with the ordinary press, sewing frame and drying boards visible.",
        "cover": [
          "The press is substantial equipment; the sewing frame is open and its lines do not make an opaque wall. Workbenches and stacked boards provide cover only when the actual line is blocked.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: this ground-floor workroom is level at 0 ft. No upper residence or access stair is drawn; do not infer an upstairs route from the roof silhouette."
        ],
        "movement": [
          "The west 10-ft doorway returns to the court. Keep the aisle between the press and central bench, and the east drying-board aisle, clear."
        ],
        "furniture": [
          "Wrapped paper and neutral books are ordinary customer/work materials, not readable clues. Permission to enter does not permit copying, opening packages or using tools; no purchased equipment is added."
        ],
        "sceneUses": [
          "Exploration: inspect permitted craft processes or a brought object.",
          "Conversation: agree scope, handling, price and collection time for a repair.",
          "Combat: account for bulky equipment without treating delicate frames or paper as guaranteed cover."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-mending-shared",
      "sceneId": "wd-map-mending-shared",
      "legacySceneId": null,
      "sourceSceneIds": [
        "mc-court"
      ],
      "title": "Mending Court · shared-space inspection",
      "playerTitle": "Shared rooms",
      "publicTitle": "Shared rooms",
      "locationId": "loc-mending-court",
      "parentBoardId": "wd-map-mending-court",
      "masterId": "mending-court",
      "proposalImage": "atlas/tactical/wd-mending-shared.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        160,
        960,
        640
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 24,
        "gridRows": 16,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Confirm permission to enter the pantry/work area. Food, supplies and table access are not automatically granted; lodging and attic stay roofed.",
      "entryPoints": [
        {
          "id": "court-return",
          "title": "Return to the court",
          "point": [
            360,
            640
          ],
          "returnSceneId": "wd-map-mending-court",
          "returnProposalId": "waterdeep-proposal-mending-court",
          "kind": "door"
        }
      ],
      "sourceRefs": [
        {
          "source": "Campaign-Courtyard-Data.js",
          "locator": "layout: mc-passage, mc-rooms, mc-bindery, mc-well, mc-table, mc-kitchen, mc-stair",
          "verification": "Approved proposed seven-zone arrangement read directly; no ward/address/physical measurements established by that plan."
        },
        {
          "source": "Campaign-Transition-Data.js",
          "locator": "tr-courtyard, tr-neighbors",
          "verification": "Rental, keys, storage, access and actual introductions must be agreed; no automatic tenancy or relationship."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "A permission-gated view of the pantry work area, common table and shared lower landing.",
        "cover": [
          "The pantry counter, basin, common table and repair bench can obstruct a line; hanging cloth and the awning remain soft material. Roofed lodging and bindery remain excluded.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: pantry, court and lower landing are level at 0 ft. The side stair leaves toward an off-board upper level at +10 ft; the attic stays private and undrawn."
        ],
        "movement": [
          "Use the 5-ft pantry doorway to the court. The landing desk leaves the path from the side door to the lower stair clear; do not use roofed space as a shortcut."
        ],
        "furniture": [
          "Shelves and containers hold unassigned household/work supplies. Meals, use of the desk, temporary gear placement and any storage require agreement; no free provisions or private contents are revealed."
        ],
        "sceneUses": [
          "Exploration: check invited common work areas and ordinary access.",
          "Conversation: share food or plan a small repair when the occupants agree.",
          "Combat: furniture is movable only if current play and ordinary rules allow it."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-mending-lodging",
      "sceneId": "wd-map-mending-lodging",
      "legacySceneId": null,
      "sourceSceneIds": [
        "mc-court"
      ],
      "title": "Mending Court · available-room inspection",
      "playerTitle": "Available rooms",
      "publicTitle": "Available rooms",
      "locationId": "loc-mending-court",
      "parentBoardId": "wd-map-mending-court",
      "masterId": "mending-court",
      "proposalImage": "atlas/tactical/wd-mending-lodging.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        40,
        200,
        480,
        320
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 12,
        "gridRows": 8,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Inspection by permission only. No tenancy, bed allocation, rent, deposit, keys, storage, furnishings or resident relationship is assumed.",
      "entryPoints": [
        {
          "id": "court-return",
          "title": "Return to the court",
          "point": [
            360,
            320
          ],
          "returnSceneId": "wd-map-mending-court",
          "returnProposalId": "waterdeep-proposal-mending-court",
          "kind": "door"
        }
      ],
      "sourceRefs": [
        {
          "source": "Campaign-Courtyard-Data.js",
          "locator": "layout: mc-passage, mc-rooms, mc-bindery, mc-well, mc-table, mc-kitchen, mc-stair",
          "verification": "Approved proposed seven-zone arrangement read directly; no ward/address/physical measurements established by that plan."
        },
        {
          "source": "Campaign-Transition-Data.js",
          "locator": "tr-courtyard, tr-neighbors",
          "verification": "Rental, keys, storage, access and actual introductions must be agreed; no automatic tenancy or relationship."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "Two empty adjoining rooms for a permitted inspection and a choice of future sleeping, work or storage arrangements.",
        "cover": [
          "The solid partition blocks lines except through its ordinary door. The rooms contain no bed, chest or other portable cover until it is actually placed in play.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: both ground-floor rooms and the court threshold are level at 0 ft. Window height and climbing access must be set by the DM before use."
        ],
        "movement": [
          "The east 10-ft door returns to the court; the connecting door is 5 ft wide. The smaller room can become an agreed work or secured-storage space while keeping that route clear."
        ],
        "furniture": [
          "Beds, desk, locks, storage containers and contents remain unplaced choices. No tenancy, purchased furnishing, custody transfer or safe containment of an unknown object is implied."
        ],
        "sceneUses": [
          "Exploration: inspect shutters, room division and ordinary access by permission.",
          "Conversation: negotiate access, privacy, rent and desired furniture separately.",
          "Combat: empty floors provide space, not invented barricades or guaranteed secure storage."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-yawning-portal",
      "sceneId": "wd-map-yawning-portal",
      "legacySceneId": null,
      "sourceSceneIds": [
        "wd-portal",
        "wd-contact"
      ],
      "title": "Yawning Portal · public floor proposal",
      "playerTitle": "Tavern public floor",
      "publicTitle": "Tavern public floor",
      "locationId": "loc-yawning-portal",
      "parentBoardId": "city-waterdeep",
      "masterId": "yawning-portal",
      "proposalImage": "atlas/tactical/wd-yawning-portal.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 30,
        "gridRows": 20,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "40-foot well is published; all other floor dimensions are authored staging."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": false,
      "accessRequirement": "Visit the public tavern; upper/private floors omitted. Descent, meetings, fees and room hire require their own actual agreement.",
      "entryPoints": [
        {
          "id": "front-door",
          "title": "Street door",
          "point": [
            620,
            720
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "double-door"
        },
        {
          "id": "well-steps",
          "title": "Well rim",
          "point": [
            650,
            606
          ],
          "returnSceneId": "wd-map-yawning-well",
          "returnProposalId": "waterdeep-proposal-yawning-well",
          "kind": "steps"
        }
      ],
      "sourceRefs": [
        {
          "source": "Tales from the Yawning Portal",
          "locator": "printed pp5–6, Features of the Yawning Portal; local PDF pages 7–8",
          "verification": "Local supplied prose inspected: 40-foot well, 140-foot shaft, public taproom, large fireplace and stairs to overlooking balconies. Furniture, doors and footprint here are original."
        },
        {
          "source": "Waterdeep: Dragon Heist",
          "locator": "Supplied 219-page PDF, contents/end material",
          "verification": "Later Portal layout/key not present in supplied copy. No published floorplan tracing claimed."
        },
        {
          "source": "Campaign-Transition-Data.js / Waterdeep-Expedition-Data.js",
          "locator": "tr-portal, wd-portal, wd-brief",
          "verification": "Meeting, room hire, fees and descent are choices; no attack or forced descent staged."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "The public taproom with bar, tables, fireplace, stairs and the published 40-ft-diameter well.",
        "cover": [
          "The bar, well rim and tables can block parts of a line. The well is an open shaft, not floor; stools and open hoist framing do not automatically provide cover.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Published: the shaft drops 140 ft. Optional authored staging: taproom 0 ft, waist-high rim about +3 ft, first balcony access +10 ft. Rim/balcony heights are play assumptions, not a traced published plan."
        ],
        "movement": [
          "The south 10-ft doorway returns to the street; public steps approach the well rim. The northeast stair exits this map toward undrawn upper space. Agree descent and a return signal separately."
        ],
        "furniture": [
          "Tables, chairs, bar and fireplace are ordinary tavern fixtures. Service, rooms, lifting equipment use and storage remain subject to actual arrangements; no patrons or attack are pre-placed."
        ],
        "sceneUses": [
          "Exploration: observe the public floor without revealing private rooms or the dungeon.",
          "Conversation: use a table for a meeting or expedition briefing by agreement.",
          "Combat: check the shaft edge and movement route before resolving any forced movement."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original source-informed floor, not a trace of a published architectural plan.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-yawning-well",
      "sceneId": "wd-map-yawning-well",
      "legacySceneId": null,
      "sourceSceneIds": [
        "wd-portal",
        "um1-table"
      ],
      "title": "Yawning Portal · well and public landing",
      "playerTitle": "Tavern well",
      "publicTitle": "Tavern well",
      "locationId": "loc-yawning-portal",
      "parentBoardId": "wd-map-yawning-portal",
      "masterId": "yawning-portal",
      "proposalImage": "atlas/tactical/wd-yawning-well.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        360,
        160,
        720,
        480
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 18,
        "gridRows": 12,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "40-foot well is published; all other floor dimensions are authored staging."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": false,
      "accessRequirement": "Closer view of the public well; this does not authorize descent or initialize/reset Undermountain. Confirm the actual signal, fee and return plan.",
      "entryPoints": [
        {
          "id": "taproom-return",
          "title": "Public-floor return",
          "point": [
            650,
            607
          ],
          "returnSceneId": "wd-map-yawning-portal",
          "returnProposalId": "waterdeep-proposal-yawning-portal",
          "kind": "steps"
        },
        {
          "id": "well-descent",
          "title": "Controlled descent",
          "point": [
            650,
            400
          ],
          "returnSceneId": "um1-table",
          "returnBoardId": "site-undermountain",
          "kind": "well",
          "permissionRequired": true,
          "note": "Only after expedition review and actual descent. Existing dungeon save and route persist."
        }
      ],
      "sourceRefs": [
        {
          "source": "Tales from the Yawning Portal",
          "locator": "printed pp5–6, Features of the Yawning Portal; local PDF pages 7–8",
          "verification": "Local supplied prose inspected: 40-foot well, 140-foot shaft, public taproom, large fireplace and stairs to overlooking balconies. Furniture, doors and footprint here are original."
        },
        {
          "source": "Waterdeep: Dragon Heist",
          "locator": "Supplied 219-page PDF, contents/end material",
          "verification": "Later Portal layout/key not present in supplied copy. No published floorplan tracing claimed."
        },
        {
          "source": "Campaign-Transition-Data.js / Waterdeep-Expedition-Data.js",
          "locator": "tr-portal, wd-portal, wd-brief",
          "verification": "Meeting, room hire, fees and descent are choices; no attack or forced descent staged."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "A close view of the same public well and landing, preserving the exact main-floor geometry.",
        "cover": [
          "The stone rim and nearby tables are possible obstructions. The dark interior is empty space in the image, not a platform or safe standing square.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Published: 40-ft well diameter and 140-ft shaft depth. Optional authored rim height is about +3 ft above the taproom; confirm it before play."
        ],
        "movement": [
          "The south steps return to the public floor. Controlled descent points to the existing Undermountain canvas; the atlas return opens its private overview and changes no dungeon state."
        ],
        "furniture": [
          "The hoist, beam and rope attachment are ordinary depicted equipment. Confirm current condition, signal, fee and permission before use; no rope length, hire or successful descent is granted."
        ],
        "sceneUses": [
          "Exploration: assess the visible rim and agreed descent procedure.",
          "Conversation: confirm who descends and the plan for returning.",
          "Combat: resolve shaft hazards using current positions and existing rules, without pre-staging an encounter."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original source-informed floor, not a trace of a published architectural plan.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-second-margin",
      "sceneId": "wd-map-second-margin",
      "legacySceneId": null,
      "sourceSceneIds": [
        "wd-research"
      ],
      "title": "Second Margin · bookshop proposal",
      "playerTitle": "Bookshop",
      "publicTitle": "Bookshop",
      "locationId": "loc-second-margin",
      "parentBoardId": "city-waterdeep",
      "masterId": "second-margin",
      "proposalImage": "atlas/tactical/wd-second-margin.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 15,
        "gridRows": 10,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Public browsing while open; table use, copies and access beyond the shop need permission. Silent Library/hidden stair omitted completely.",
      "entryPoints": [
        {
          "id": "front-door",
          "title": "Street door",
          "point": [
            560,
            640
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "door"
        }
      ],
      "sourceRefs": [
        {
          "source": "The Echo Below — DM Book",
          "locator": "Waterdeep Hub, printed pp11,15–16",
          "verification": "Local supplied text inspected. Venue premise/ward is campaign material; room dimensions and placement below are new original staging."
        },
        {
          "source": "Echo-Below-Campaign-Outline.md",
          "locator": "Act I home and Waterdeep leads",
          "verification": "Future preparation; no discovery, custody, agreement or successful arrival inferred."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "The public bookshop and a research table, with its staff/private area roofed.",
        "cover": [
          "Shelving, counter and tables may obstruct lines; the green bay window is glazing, not an open exit. Shelf height is an authored staging choice to confirm before applying cover.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: the public shop is level at 0 ft. Private upstairs space, hidden stairs and other unrevealed architecture are absent."
        ],
        "movement": [
          "Use the south street door and open aisles between the shelves. The east staff door is a boundary requiring separate permission, not a route to a revealed private plan."
        ],
        "furniture": [
          "Book shapes, papers and counter trays contain no readable secrets. Shelf contents, copying, research use and custody of any item require the actual custodian’s agreement."
        ],
        "sceneUses": [
          "Exploration: browse allowed shelves or inspect an item actually supplied.",
          "Conversation: agree a research question, scope and access.",
          "Combat: treat shelves as ordinary objects; no hidden entrance or automatic clue is activated."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-ninepin-works",
      "sceneId": "wd-map-ninepin-works",
      "legacySceneId": null,
      "sourceSceneIds": [
        "wd-research"
      ],
      "title": "Ninepin Works · work-floor proposal",
      "playerTitle": "Workshop",
      "publicTitle": "Workshop",
      "locationId": "loc-ninepin-works",
      "parentBoardId": "city-waterdeep",
      "masterId": "ninepin-works",
      "proposalImage": "atlas/tactical/wd-ninepin-works.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 15,
        "gridRows": 10,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Receive permission to enter the working area and use/handle any tools or objects. No commission or destructive test is authorized by staging.",
      "entryPoints": [
        {
          "id": "delivery-door",
          "title": "Street and delivery door",
          "point": [
            560,
            640
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "double-door"
        }
      ],
      "sourceRefs": [
        {
          "source": "The Echo Below — DM Book",
          "locator": "Waterdeep Hub, printed pp12,15",
          "verification": "Local supplied text inspected. Venue premise/ward is campaign material; room dimensions and placement below are new original staging."
        },
        {
          "source": "Echo-Below-Campaign-Outline.md",
          "locator": "Act I home and Waterdeep leads",
          "verification": "Future preparation; no discovery, custody, agreement or successful arrival inferred."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "A permitted work-floor discussion around neutral trays and benches, with family space excluded.",
        "cover": [
          "Workbenches, cabinets and the counter can obstruct lines. Small trays and tools are not solid barricades; their contents provide no automatic protection.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: work floor 0 ft. The private upper route is outside this floorplan; no height or family-room layout is revealed."
        ],
        "movement": [
          "The south delivery door enters the central aisle. Keep routes around the large bench clear. The east private door is not permission to enter the family area."
        ],
        "furniture": [
          "Trays and bench fittings are ordinary neutral equipment. Handling, disassembly, destructive tests and storage/custody must be agreed for the actual object; no secret device is depicted."
        ],
        "sceneUses": [
          "Exploration: inspect an agreed work process or object non-destructively.",
          "Conversation: negotiate a commission and limits before work begins.",
          "Combat: account for benches and fragile work without inventing explosive contents."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-lantern-house",
      "sceneId": "wd-map-lantern-house",
      "legacySceneId": null,
      "sourceSceneIds": [
        "city-waterdeep"
      ],
      "title": "Lantern House · common rooms and herb court",
      "playerTitle": "House of care",
      "publicTitle": "House of care",
      "locationId": "loc-lantern-house",
      "parentBoardId": "city-waterdeep",
      "masterId": "lantern-house",
      "proposalImage": "atlas/tactical/wd-lantern-house.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 30,
        "gridRows": 20,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Public waiting and invited common-area access; private patient/residential rooms stay roofed. No patient, testimony, service or faction tie inferred.",
      "entryPoints": [
        {
          "id": "front-door",
          "title": "Street door",
          "point": [
            260,
            720
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "double-door"
        }
      ],
      "sourceRefs": [
        {
          "source": "The Echo Below — DM Book",
          "locator": "Waterdeep Hub, printed pp14–15",
          "verification": "Local supplied text inspected. Venue premise/ward is campaign material; room dimensions and placement below are new original staging."
        },
        {
          "source": "Echo-Below-Campaign-Outline.md",
          "locator": "Act I home and Waterdeep leads",
          "verification": "Future preparation; no discovery, custody, agreement or successful arrival inferred."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "Permitted waiting, shared preparation space and herb courtyard, with patient/residential wings roofed.",
        "cover": [
          "Planters, low walls, benches and counters can obstruct a line. Plants are not automatically opaque; the private roof silhouettes are not revealed patient rooms.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: waiting room, herb court and common preparation area share level 0 ft. No patient-floor elevations or upper-room geometry are shown."
        ],
        "movement": [
          "The southwest street door enters waiting space; side doorways connect the herb court and common preparation room. Keep bench-side aisles open and request permission before staff/private doors."
        ],
        "furniture": [
          "Herbs, basin, benches and meal/work tables are ordinary proposed fixtures. No patient, medicine stock, treatment outcome or party storage entitlement is implied."
        ],
        "sceneUses": [
          "Exploration: move only through visible permitted common areas.",
          "Conversation: ask for an appointment, meal or bounded assistance.",
          "Combat: protect access paths and use actual cover, without inventing patients or faction guards."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-blue-lantern-quay",
      "sceneId": "wd-map-blue-lantern-quay",
      "legacySceneId": null,
      "sourceSceneIds": [
        "city-waterdeep"
      ],
      "title": "Blue Lantern Quay · dockside proposal",
      "playerTitle": "Dockside",
      "publicTitle": "Dockside",
      "locationId": "loc-blue-lantern-quay",
      "parentBoardId": "city-waterdeep",
      "masterId": "blue-lantern-quay",
      "proposalImage": "atlas/tactical/wd-blue-lantern-quay.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 30,
        "gridRows": 20,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": false,
      "accessRequirement": "Ordinary quay access; private cargo, vessels and offices require permission. Empty berth makes no claim that Vess or a ship is present.",
      "entryPoints": [
        {
          "id": "street-return",
          "title": "City street",
          "point": [
            0,
            160
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "street"
        },
        {
          "id": "water-landing",
          "title": "Waterside steps",
          "point": [
            744,
            630
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "stairs",
          "note": "Select actual vessel/route separately; no booked passage."
        }
      ],
      "sourceRefs": [
        {
          "source": "The Echo Below — DM Book",
          "locator": "Waterdeep Hub, printed pp14–15",
          "verification": "Local supplied text inspected. Venue premise/ward is campaign material; room dimensions and placement below are new original staging."
        },
        {
          "source": "Echo-Below-Campaign-Outline.md",
          "locator": "Act I home and Waterdeep leads",
          "verification": "Future preparation; no discovery, custody, agreement or successful arrival inferred."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "A public quay, open planning canopy, landing steps and an empty T-shaped pier.",
        "cover": [
          "Crates and roofed warehouse walls may obstruct lines. Bollards, lamps and open water are not automatic cover. Cargo contents remain unspecified.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Optional authored staging: quay and pier at 0 ft, water about 5 ft lower at an agreed reference tide. Set the actual water level and step drop before movement; no current tide or swimming condition is presumed."
        ],
        "movement": [
          "The west street returns to the city; the open gangway reaches the pier and the lower steps approach the water. There is no vessel in the berth and no destination across the water until chosen in play."
        ],
        "furniture": [
          "Crates, bollards and canopy table belong to the proposed working quay. They do not give the party stored cargo, a boat, booked passage or permission to enter warehouse interiors."
        ],
        "sceneUses": [
          "Exploration: inspect the public landing and confirm a real vessel or route.",
          "Conversation: meet a present contact or arrange passage and handling terms.",
          "Combat: distinguish walkable pier, step edges and open water before resolving movement."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-flex-shop",
      "sceneId": "wd-map-flex-shop",
      "legacySceneId": null,
      "sourceSceneIds": [],
      "title": "Waterdeep · flexible shop proposal",
      "playerTitle": "Shop",
      "publicTitle": "Shop",
      "locationId": "loc-waterdeep",
      "parentBoardId": "city-waterdeep",
      "masterId": "flexible",
      "proposalImage": "atlas/tactical/wd-flex-shop.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 15,
        "gridRows": 10,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Assign a real permitted shop before showing. No venue, rental, record discovery or custodial relationship is established by this generic plan.",
      "entryPoints": [
        {
          "id": "door-return",
          "title": "Return to the city",
          "point": [
            600,
            640
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "door"
        }
      ],
      "sourceRefs": [
        {
          "source": "New original Waterdeep staging",
          "locator": "This collection only",
          "verification": "Flexible shop, archive and meeting-room plans. No named premises, lease, custodians, discovered documents or permission established."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "An unassigned shop floor to associate with a real permitted visit when needed.",
        "cover": [
          "Counter and shelves may block lines; shelf heights and whether goods fill the sight line must be set by the DM. The rear roof is excluded private space.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: exposed shop floor 0 ft; private-room or exterior height differences are unspecified."
        ],
        "movement": [
          "Enter and leave through the south street door. Keep the center aisle clear; the rear staff door requires separate permission and does not disclose the roofed room."
        ],
        "furniture": [
          "Goods are neutral silhouettes, with no established stock, price or ownership. Assign an actual proprietor and permitted access before use; no free storage is granted."
        ],
        "sceneUses": [
          "Exploration: browse an assigned shop with agreed stock.",
          "Conversation: make an ordinary purchase inquiry or meeting.",
          "Combat: use the displayed counter and aisles without generating merchandise effects."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-flex-archive",
      "sceneId": "wd-map-flex-archive",
      "legacySceneId": null,
      "sourceSceneIds": [],
      "title": "Waterdeep · flexible archive proposal",
      "playerTitle": "Archive",
      "publicTitle": "Archive",
      "locationId": "loc-waterdeep",
      "parentBoardId": "city-waterdeep",
      "masterId": "flexible",
      "proposalImage": "atlas/tactical/wd-flex-archive.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 15,
        "gridRows": 10,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Assign a real permitted archive before showing. No venue, rental, record discovery or custodial relationship is established by this generic plan.",
      "entryPoints": [
        {
          "id": "door-return",
          "title": "Return to the city",
          "point": [
            600,
            640
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "door"
        }
      ],
      "sourceRefs": [
        {
          "source": "New original Waterdeep staging",
          "locator": "This collection only",
          "verification": "Flexible shop, archive and meeting-room plans. No named premises, lease, custodians, discovered documents or permission established."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "An unassigned archive with accessible aisles, reading table and closed neutral storage.",
        "cover": [
          "Shelves and storage cabinets may block lines depending on the assigned heights and contents. Books do not create automatic cover simply because a shelf icon is present.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: archive floor 0 ft. Shelf height, window access and any elevation beyond this room remain DM choices."
        ],
        "movement": [
          "Use the south door and the parallel shelf aisles. Leave the path around the reading table clear; no hidden passage or second exit is represented."
        ],
        "furniture": [
          "Closed boxes and shelves represent unassigned records. No record has been found, opened or copied; access, custody and temporary storage require the real custodian’s agreement."
        ],
        "sceneUses": [
          "Exploration: search only authorized records after assigning the archive.",
          "Conversation: agree a supervised research request.",
          "Combat: adjudicate furniture and sight lines without granting knowledge from shelf contents."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    },
    {
      "id": "waterdeep-proposal-flex-meeting",
      "sceneId": "wd-map-flex-meeting",
      "legacySceneId": null,
      "sourceSceneIds": [],
      "title": "Waterdeep · flexible meeting room proposal",
      "playerTitle": "Meeting room",
      "publicTitle": "Meeting room",
      "locationId": "loc-waterdeep",
      "parentBoardId": "city-waterdeep",
      "masterId": "flexible",
      "proposalImage": "atlas/tactical/wd-flex-meeting.svg",
      "currentImage": null,
      "nativeFormat": "svg",
      "nativeDimensions": [
        1536,
        1024
      ],
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "viewBox": [
        0,
        0,
        1200,
        800
      ],
      "scale": {
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "squareFeet": 5,
        "gridColumns": 15,
        "gridRows": 10,
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "sourceSquareFeet": null,
        "measurementPrecision": "Authored original play-space dimensions, not measured geographic/source geometry."
      },
      "geometryChanged": true,
      "geometryChangeScope": "New proposed board; existing scene/map geometry is not replaced.",
      "automaticReplacement": false,
      "reviewNeeded": true,
      "status": "proposal-review-needed",
      "publicImageApproved": true,
      "audience": "player-after-reveal",
      "permissionRequired": true,
      "accessRequirement": "Assign a real permitted meeting room before showing. No venue, rental, record discovery or custodial relationship is established by this generic plan.",
      "entryPoints": [
        {
          "id": "door-return",
          "title": "Return to the city",
          "point": [
            600,
            640
          ],
          "returnSceneId": "city-waterdeep",
          "kind": "door"
        }
      ],
      "sourceRefs": [
        {
          "source": "New original Waterdeep staging",
          "locator": "This collection only",
          "verification": "Flexible shop, archive and meeting-room plans. No named premises, lease, custodians, discovered documents or permission established."
        }
      ],
      "dmCompanion": "atlas/tactical/Waterdeep-Tactical-Topology-DM.json",
      "playNotes": {
        "summary": "An unassigned meeting room with a large table and ten chairs for a chosen permitted gathering.",
        "cover": [
          "The low table and sideboard can obstruct a line from some positions; chairs provide no automatic bonus. The rug is not difficult terrain by default.",
          "The DM checks the actual sight line, position, size and obstruction before applying existing cover rules; drawing an object grants no automatic bonus."
        ],
        "elevation": [
          "Authored staging: the whole floor is level at 0 ft; table and window heights are ordinary staging choices, not source measurements."
        ],
        "movement": [
          "The south door is the room’s represented exit. Open space around the table supports movement; do not assume the chairs are occupied or that doors are locked."
        ],
        "furniture": [
          "Table, chairs and sideboard are proposed fixtures of an unassigned room. No rental, attendees, refreshments, property transfer or secure storage has been agreed."
        ],
        "sceneUses": [
          "Exploration: inspect an assigned room and its visible exit.",
          "Conversation: hold a meeting only after confirming access and participants.",
          "Combat: use actual placed chairs and positions; the drawing does not begin a confrontation."
        ]
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "precision": "Original proposed strict-overhead geometry. Dimensions and ordinary furnishings are authored staging.",
      "presumptions": {
        "rented": false,
        "occupiedByParty": false,
        "relationshipEstablished": false,
        "permissionGranted": false,
        "sourceCanonicalFloorplan": false
      },
      "fogGuidance": "Prepare a separate board with blank fog; preview privately. Reveal only spaces actually visible or explicitly permitted. Permission flags are preparation requirements, not recorded consent.",
      "stateMigration": "Create a new board only by deliberate action. Do not overwrite source visual scene IDs, saved fog, tokens, drawings, map notes or Undermountain state."
    }
  ],
  "audit": [
    {
      "image": "assets/Mending-Court-Plan.svg",
      "status": "reuse-as-DM-reference",
      "reason": "Approved seven-zone orientation and ordinary labels; not to scale. Public courtyard floor must roof private rooms; original retained.",
      "sha256": "fdb529bc3d4876f00ce943eddad6b9c1d36668f6607c2c2857e871449764efd3"
    },
    {
      "image": "assets/Yawning-Portal-Scene.svg",
      "status": "reuse-as-illustration",
      "reason": "Labelled stylized well vignette with elliptical perspective; not a measured overhead tavern floor.",
      "sha256": "f7019369c7b859cc63ed71b4128dda27ca1ae913cea2b4905b361093f36ca8ea"
    },
    {
      "image": "assets/Second-Margin-Scene.svg",
      "status": "reuse-as-illustration",
      "reason": "Labelled book icon/title card; no playable floor geometry.",
      "sha256": "fbcca6637ea6839afe6e6ed94e7a2004217b0d73a6732983556ce40ce652f33a"
    },
    {
      "image": "assets/Waterdeep-Neighborhood-Map.png",
      "status": "DM-reference-only",
      "reason": "Existing neighborhood art may imply ward/street adjacency and has baked names; no source-faithful or public tactical claim.",
      "sha256": "08bde89ae211765f401a9f98b0f3d3c3be19b3328d573dd09f8e304b1b90b39c"
    },
    {
      "image": "assets/Waterdeep-City-Map.png",
      "status": "DM-reference-only",
      "reason": "Baked custom site names include unrevealed locations. Not a clean player city map.",
      "sha256": "3b63143f85a875eee608fa5174ecaed7e6d4aeb592f0aadc426b2b2e34b54347"
    }
  ]
};})();

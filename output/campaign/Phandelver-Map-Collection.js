/* Proposal data only; loading this file never registers scenes or changes saved state. */
(()=>{'use strict';globalThis.PHANDELVER_MAP_COLLECTION={
  "version": 1,
  "collectionId": "phandelver-source-reconciled-proposals",
  "policy": {
    "proposalOnly": true,
    "saveWrites": false,
    "preservedLegacySceneIds": true,
    "liveRegistrationsEdited": false,
    "publicArt": "No text, keys, inhabitants, treasure, trap hints, or secret geometry. Ordinary closed doors and structures remain visible only where revealed.",
    "geometryPrecision": "Manual reconstruction from inspected native source maps; not exact vectorization. Approximate scan calibration is explicit.",
    "dmOnly": [
      "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "atlas/tactical/build-collection.cjs"
    ],
    "apply": "Opt-in per scene after reviewing changed geometry. Retain current art, scene ID, fog, tokens and drawings until a separate migration decision."
  },
  "maps": [
    {
      "id": "phandelver-proposal-phandalin-town",
      "sceneId": "town-phandalin",
      "legacySceneId": "town-phandalin",
      "title": "Phandalin",
      "masterId": "phandalin",
      "proposalImage": "atlas/tactical/phandalin-town.svg",
      "currentImage": "town-maps/professional/phandalin-overhead.png",
      "currentImageSha256": "383492ef6761ae9570b436210729123ef6bfe5e466f86eb8c19bcf29a3751871",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "eder",
        "garaele",
        "shrine",
        "barthen",
        "barthen-home",
        "smithy",
        "inn",
        "giant",
        "hall",
        "coster",
        "linene",
        "exchange",
        "wood",
        "harbin",
        "halia",
        "alder",
        "manor"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        0,
        0,
        1131,
        754
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-phandalin.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 17,
        "printedKeyPages": [
          14,
          15,
          16,
          17,
          18,
          19,
          20
        ]
      },
      "scale": {
        "sourceSquareFeet": 50,
        "measuredSourceCellPixels": 49.3,
        "measurementPrecision": "Approximate source ruler only; unsuitable for five-foot tactical measurement.",
        "squareFeet": 50,
        "gridColumns": null,
        "gridRows": null,
        "gridOriginSource": [
          552,
          732
        ],
        "gridOffsetPercent": null,
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": false,
        "tacticalMeasurement": false,
        "sourceUnitKind": "printed distance ruler, not a grid"
      },
      "intendedModes": [
        "exploration",
        "conversation"
      ],
      "entryPoints": [
        {
          "id": "triboar-road",
          "area": "roads",
          "point": [
            617,
            0
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "miners-trail",
          "area": "roads",
          "point": [
            185,
            743
          ],
          "returnSceneId": "region-lmop",
          "kind": "trail"
        },
        {
          "id": "manor-lane",
          "area": "manor",
          "point": [
            985,
            292
          ],
          "returnSceneId": "lmop-map-tresendar-courtyard",
          "kind": "path"
        }
      ],
      "precision": "Town orientation redraw from the printed p17 map, with manually sampled landmark centers and winding lanes. Roof footprints and minor buildings are schematic. Source ruler approximates 493 px per 500 ft; no tactical five-foot accuracy claim.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "triboar-road",
          "area": "roads",
          "point": [
            617,
            0
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "miners-trail",
          "area": "roads",
          "point": [
            185,
            743
          ],
          "returnSceneId": "region-lmop",
          "kind": "trail"
        },
        {
          "id": "manor-lane",
          "area": "manor",
          "point": [
            985,
            292
          ],
          "returnSceneId": "lmop-map-tresendar-courtyard",
          "kind": "path"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 0) / 1131",
        "y": "(y - 0) / 754",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Phandalin"
    },
    {
      "id": "phandelver-proposal-redbrand-hideout-full",
      "sceneId": "redbrand-hideout",
      "legacySceneId": "redbrand-hideout",
      "title": "Redbrand Hideout",
      "masterId": "redbrand",
      "proposalImage": "atlas/tactical/redbrand-hideout-full.svg",
      "currentImage": "lmop-battle-maps/professional/redbrand-hideout.png",
      "currentImageSha256": "e90deeee46287ed64a9cd90407bcb6a1d7b072420335059e8e4d542edd885e46",
      "priority": "P0",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -23,
        2,
        1170,
        780
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-redbrand-hideout.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 21,
        "printedKeyPages": [
          20,
          21,
          22,
          23,
          24,
          25
        ]
      },
      "scale": {
        "sourceSquareFeet": 5,
        "measuredSourceCellPixels": 39,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 30,
        "gridRows": 20,
        "gridOriginSource": [
          55,
          80
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [
        {
          "id": "manor-cellar",
          "area": "1",
          "point": [
            1068,
            570
          ],
          "returnSceneId": "lmop-map-tresendar-courtyard",
          "kind": "stairs"
        },
        {
          "id": "forest-tunnel",
          "area": "8",
          "point": [
            384,
            747
          ],
          "returnSceneId": "town-phandalin",
          "kind": "tunnel",
          "note": "Source tunnel continues about 100 feet into woodland; town destination is navigation, not measured alignment."
        }
      ],
      "precision": "Manually reconciled source-coordinate floor plan. Architectural rectangles and door centers sampled from the native reference; cave walls are simplified. Scan calibration about 39 px per 5 ft, not a pixel-perfect trace.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "manor-cellar",
          "area": "1",
          "point": [
            1068,
            570
          ],
          "returnSceneId": "lmop-map-tresendar-courtyard",
          "kind": "stairs"
        },
        {
          "id": "forest-tunnel",
          "area": "8",
          "point": [
            384,
            747
          ],
          "returnSceneId": "town-phandalin",
          "kind": "tunnel",
          "note": "Source tunnel continues about 100 feet into woodland; town destination is navigation, not measured alignment."
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-redbrand-crevasse",
          "proposalId": "phandelver-proposal-redbrand-crevasse",
          "viewBox": [
            94,
            197,
            936,
            624
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -23) / 1170",
        "y": "(y - 2) / 780",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Redbrand Hideout"
    },
    {
      "id": "phandelver-proposal-redbrand-crevasse",
      "sceneId": "lmop-map-redbrand-crevasse",
      "legacySceneId": "lmop-map-redbrand-crevasse",
      "title": "Redbrand Hideout · crevasse",
      "masterId": "redbrand",
      "proposalImage": "atlas/tactical/redbrand-crevasse.svg",
      "currentImage": "lmop-battle-maps/professional/redbrand-crevasse.png",
      "currentImageSha256": "6037ea468cc408363cf95c15082faf3cca83500f58756c2ac87633b4bb3daf7d",
      "priority": "P0",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "8"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        94,
        197,
        936,
        624
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-redbrand-hideout.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 21,
        "printedKeyPages": [
          20,
          21,
          22,
          23,
          24,
          25
        ]
      },
      "scale": {
        "sourceSquareFeet": 5,
        "measuredSourceCellPixels": 39,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 24,
        "gridRows": 16,
        "gridOriginSource": [
          55,
          80
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [
        {
          "id": "forest-tunnel",
          "area": "8",
          "point": [
            384,
            747
          ],
          "returnSceneId": "town-phandalin",
          "kind": "tunnel",
          "note": "Source tunnel continues about 100 feet into woodland; town destination is navigation, not measured alignment."
        }
      ],
      "precision": "Manually reconciled source-coordinate floor plan. Architectural rectangles and door centers sampled from the native reference; cave walls are simplified. Scan calibration about 39 px per 5 ft, not a pixel-perfect trace.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "manor-cellar",
          "area": "1",
          "point": [
            1068,
            570
          ],
          "returnSceneId": "lmop-map-tresendar-courtyard",
          "kind": "stairs"
        },
        {
          "id": "forest-tunnel",
          "area": "8",
          "point": [
            384,
            747
          ],
          "returnSceneId": "town-phandalin",
          "kind": "tunnel",
          "note": "Source tunnel continues about 100 feet into woodland; town destination is navigation, not measured alignment."
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "redbrand-hideout",
          "proposalId": "phandelver-proposal-redbrand-hideout-full",
          "viewBox": [
            -23,
            2,
            1170,
            780
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 94) / 936",
        "y": "(y - 197) / 624",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Redbrand Hideout · crevasse"
    },
    {
      "id": "phandelver-proposal-cragmaw-hideout-full",
      "sceneId": "interior",
      "legacySceneId": "interior",
      "title": "Cragmaw Hideout",
      "masterId": "cragmaw-hideout",
      "proposalImage": "atlas/tactical/cragmaw-hideout-full.svg",
      "currentImage": "session-01-visuals/cragmaw-hideout-painted-gridless.png",
      "currentImageSha256": "c0dd61ff09dbdd693d89de42c5412fb1f2f06f6d9a1adb2081f6eb42703b14cb",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        3.5,
        2.5,
        1155,
        770
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-cragmaw-hideout.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 9,
        "printedKeyPages": [
          7,
          8,
          9,
          10,
          11,
          12
        ]
      },
      "scale": {
        "sourceSquareFeet": 5,
        "measuredSourceCellPixels": 38.5,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 30,
        "gridRows": 20,
        "gridOriginSource": [
          42,
          41
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [
        {
          "id": "stream-mouth",
          "area": "1",
          "point": [
            368,
            746
          ],
          "returnSceneId": "approach",
          "kind": "stream"
        }
      ],
      "precision": "Source-coordinate manual redraw, with simplified cave outlines. Stream and elevated bridge are separate routes. About 38.5 source px per 5 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "stream-mouth",
          "area": "1",
          "point": [
            368,
            746
          ],
          "returnSceneId": "approach",
          "kind": "stream"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 3.5) / 1155",
        "y": "(y - 2.5) / 770",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Cragmaw Hideout"
    },
    {
      "id": "phandelver-proposal-cragmaw-castle-full",
      "sceneId": "lmop-map-cragmaw-castle",
      "legacySceneId": "lmop-map-cragmaw-castle",
      "title": "Cragmaw Castle · complete",
      "masterId": "cragmaw-castle",
      "proposalImage": "atlas/tactical/cragmaw-castle-full.svg",
      "currentImage": "lmop-battle-maps/professional/cragmaw-castle.png",
      "currentImageSha256": "b90647150fe9997a331ca486c12cc79a8c972a85a32c92d348120ae277adbb39",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -2.6,
        -6.6,
        1230.9,
        820.6
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-cragmaw-castle.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 37,
        "printedKeyPages": [
          35,
          36,
          37,
          38,
          39,
          40,
          41
        ]
      },
      "scale": {
        "sourceSquareFeet": 5,
        "measuredSourceCellPixels": 37.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 33,
        "gridRows": 22,
        "gridOriginSource": [
          72,
          68
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [
        {
          "id": "front",
          "area": "1",
          "point": [
            38,
            350
          ],
          "returnSceneId": "region-lmop",
          "kind": "stairs"
        },
        {
          "id": "postern",
          "area": "10",
          "point": [
            488,
            609
          ],
          "returnSceneId": "region-lmop",
          "kind": "stairs"
        },
        {
          "id": "north-concealed",
          "area": "11",
          "point": [
            616,
            138
          ],
          "returnSceneId": "region-lmop",
          "kind": "concealed",
          "dmOnly": true
        }
      ],
      "precision": "Manual source-coordinate architectural redraw. Ruined wall boundaries simplified. Northern concealed entrance omitted from player floor; DM may add it after discovery. About 37.3 source px per 5 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "front",
          "area": "1",
          "point": [
            38,
            350
          ],
          "returnSceneId": "region-lmop",
          "kind": "stairs"
        },
        {
          "id": "postern",
          "area": "10",
          "point": [
            488,
            609
          ],
          "returnSceneId": "region-lmop",
          "kind": "stairs"
        },
        {
          "id": "north-concealed",
          "area": "11",
          "point": [
            616,
            138
          ],
          "returnSceneId": "region-lmop",
          "kind": "concealed",
          "dmOnly": true
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-cragmaw-kings-quarters",
          "proposalId": "phandelver-proposal-cragmaw-castle-east",
          "viewBox": [
            631.5,
            68,
            447.6,
            298.4
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -2.6) / 1230.9",
        "y": "(y - -6.6) / 820.6",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Cragmaw Castle · complete"
    },
    {
      "id": "phandelver-proposal-cragmaw-castle-east",
      "sceneId": "lmop-map-cragmaw-kings-quarters",
      "legacySceneId": "lmop-map-cragmaw-kings-quarters",
      "title": "Cragmaw Castle · king's quarters",
      "masterId": "cragmaw-castle",
      "proposalImage": "atlas/tactical/cragmaw-castle-east.svg",
      "currentImage": "lmop-battle-maps/professional/cragmaw-kings-quarters.png",
      "currentImageSha256": "ccfb5efe9da800bc746e7c0ea4ae313a5312550194d4dd873050e99ad7c09ced",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "14"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        631.5,
        68,
        447.6,
        298.4
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-cragmaw-castle.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 37,
        "printedKeyPages": [
          35,
          36,
          37,
          38,
          39,
          40,
          41
        ]
      },
      "scale": {
        "sourceSquareFeet": 5,
        "measuredSourceCellPixels": 37.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 12,
        "gridRows": 8,
        "gridOriginSource": [
          72,
          68
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Manual source-coordinate architectural redraw. Ruined wall boundaries simplified. Northern concealed entrance omitted from player floor; DM may add it after discovery. About 37.3 source px per 5 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "front",
          "area": "1",
          "point": [
            38,
            350
          ],
          "returnSceneId": "region-lmop",
          "kind": "stairs"
        },
        {
          "id": "postern",
          "area": "10",
          "point": [
            488,
            609
          ],
          "returnSceneId": "region-lmop",
          "kind": "stairs"
        },
        {
          "id": "north-concealed",
          "area": "11",
          "point": [
            616,
            138
          ],
          "returnSceneId": "region-lmop",
          "kind": "concealed",
          "dmOnly": true
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-cragmaw-castle",
          "proposalId": "phandelver-proposal-cragmaw-castle-full",
          "viewBox": [
            -2.6,
            -6.6,
            1230.9,
            820.6
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 631.5) / 447.6",
        "y": "(y - 68) / 298.4",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Cragmaw Castle · eastern chamber"
    },
    {
      "id": "phandelver-proposal-thundertree-full",
      "sceneId": "lmop-map-thundertree-overview",
      "legacySceneId": "lmop-map-thundertree-overview",
      "title": "Thundertree · village",
      "masterId": "thundertree",
      "proposalImage": "atlas/tactical/thundertree-full.svg",
      "currentImage": "lmop-battle-maps/professional/thundertree-overview.png",
      "currentImageSha256": "88fee868737998f91f22b41164f6ee871f9e76e8dc98c968fa4861c278e3c68e",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -4.6,
        -9.95,
        1179,
        786
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-thundertree.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 31,
        "printedKeyPages": [
          30,
          31,
          32,
          33,
          34
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 39.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 60,
        "gridRows": 40,
        "gridOriginSource": [
          74,
          49
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "precision": "Building footprints, source-relative positions and winding road network manually redrawn from the printed map. No stream invented. Minor rubble/vegetation and furnishings are schematic; about 39.3 source px per 10 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "town-thundertree",
          "proposalId": "phandelver-proposal-thundertree-town",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-brown-horse",
          "proposalId": "phandelver-proposal-thundertree-brown-horse",
          "viewBox": [
            191.9,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-spider-store",
          "proposalId": "phandelver-proposal-thundertree-store",
          "viewBox": [
            467,
            402.7,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-dragon-tower",
          "proposalId": "phandelver-proposal-thundertree-tower",
          "viewBox": [
            467,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-garrison",
          "proposalId": "phandelver-proposal-thundertree-garrison",
          "viewBox": [
            860,
            -9.95,
            294.75,
            196.5
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-cultists",
          "proposalId": "phandelver-proposal-thundertree-cottage",
          "viewBox": [
            918.95,
            481.3,
            294.75,
            196.5
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -4.6) / 1179",
        "y": "(y - -9.95) / 786",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Thundertree · village"
    },
    {
      "id": "phandelver-proposal-thundertree-town",
      "sceneId": "town-thundertree",
      "legacySceneId": "town-thundertree",
      "title": "Thundertree",
      "masterId": "thundertree",
      "proposalImage": "atlas/tactical/thundertree-town.svg",
      "currentImage": "town-maps/professional/thundertree-overhead.png",
      "currentImageSha256": "a348f13a61b9610103ff9bfb8a82d70454537df56420cdc93107688d3c3d99c5",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -4.6,
        -9.95,
        1179,
        786
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-thundertree.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 31,
        "printedKeyPages": [
          30,
          31,
          32,
          33,
          34
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 39.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 60,
        "gridRows": 40,
        "gridOriginSource": [
          74,
          49
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "precision": "Building footprints, source-relative positions and winding road network manually redrawn from the printed map. No stream invented. Minor rubble/vegetation and furnishings are schematic; about 39.3 source px per 10 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-thundertree-overview",
          "proposalId": "phandelver-proposal-thundertree-full",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-brown-horse",
          "proposalId": "phandelver-proposal-thundertree-brown-horse",
          "viewBox": [
            191.9,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-spider-store",
          "proposalId": "phandelver-proposal-thundertree-store",
          "viewBox": [
            467,
            402.7,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-dragon-tower",
          "proposalId": "phandelver-proposal-thundertree-tower",
          "viewBox": [
            467,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-garrison",
          "proposalId": "phandelver-proposal-thundertree-garrison",
          "viewBox": [
            860,
            -9.95,
            294.75,
            196.5
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-cultists",
          "proposalId": "phandelver-proposal-thundertree-cottage",
          "viewBox": [
            918.95,
            481.3,
            294.75,
            196.5
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -4.6) / 1179",
        "y": "(y - -9.95) / 786",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Thundertree"
    },
    {
      "id": "phandelver-proposal-thundertree-brown-horse",
      "sceneId": "lmop-map-thundertree-brown-horse",
      "legacySceneId": "lmop-map-thundertree-brown-horse",
      "title": "Thundertree · Brown Horse",
      "masterId": "thundertree",
      "proposalImage": "atlas/tactical/thundertree-brown-horse.svg",
      "currentImage": "lmop-battle-maps/professional/thundertree-brown-horse.png",
      "currentImageSha256": "b2b16094670c57d2d8cc5234cd83cf3f89e81a1d8d8a3064c2cd0cc591040af4",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "3"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        191.9,
        -9.95,
        353.7,
        235.8
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-thundertree.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 31,
        "printedKeyPages": [
          30,
          31,
          32,
          33,
          34
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 39.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 18,
        "gridRows": 12,
        "gridOriginSource": [
          74,
          49
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Building footprints, source-relative positions and winding road network manually redrawn from the printed map. No stream invented. Minor rubble/vegetation and furnishings are schematic; about 39.3 source px per 10 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-thundertree-overview",
          "proposalId": "phandelver-proposal-thundertree-full",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "town-thundertree",
          "proposalId": "phandelver-proposal-thundertree-town",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-spider-store",
          "proposalId": "phandelver-proposal-thundertree-store",
          "viewBox": [
            467,
            402.7,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-dragon-tower",
          "proposalId": "phandelver-proposal-thundertree-tower",
          "viewBox": [
            467,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-garrison",
          "proposalId": "phandelver-proposal-thundertree-garrison",
          "viewBox": [
            860,
            -9.95,
            294.75,
            196.5
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-cultists",
          "proposalId": "phandelver-proposal-thundertree-cottage",
          "viewBox": [
            918.95,
            481.3,
            294.75,
            196.5
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 191.9) / 353.7",
        "y": "(y - -9.95) / 235.8",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Thundertree · Brown Horse"
    },
    {
      "id": "phandelver-proposal-thundertree-store",
      "sceneId": "lmop-map-thundertree-spider-store",
      "legacySceneId": "lmop-map-thundertree-spider-store",
      "title": "Thundertree · ruined store",
      "masterId": "thundertree",
      "proposalImage": "atlas/tactical/thundertree-store.svg",
      "currentImage": "lmop-battle-maps/professional/thundertree-spider-store.png",
      "currentImageSha256": "e21434306a60cbad73c1a1a14dc2b57ef94c5b57ff553d2d26c0879dfaefe3e4",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "6"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        467,
        402.7,
        353.7,
        235.8
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-thundertree.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 31,
        "printedKeyPages": [
          30,
          31,
          32,
          33,
          34
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 39.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 18,
        "gridRows": 12,
        "gridOriginSource": [
          74,
          49
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Building footprints, source-relative positions and winding road network manually redrawn from the printed map. No stream invented. Minor rubble/vegetation and furnishings are schematic; about 39.3 source px per 10 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-thundertree-overview",
          "proposalId": "phandelver-proposal-thundertree-full",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "town-thundertree",
          "proposalId": "phandelver-proposal-thundertree-town",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-brown-horse",
          "proposalId": "phandelver-proposal-thundertree-brown-horse",
          "viewBox": [
            191.9,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-dragon-tower",
          "proposalId": "phandelver-proposal-thundertree-tower",
          "viewBox": [
            467,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-garrison",
          "proposalId": "phandelver-proposal-thundertree-garrison",
          "viewBox": [
            860,
            -9.95,
            294.75,
            196.5
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-cultists",
          "proposalId": "phandelver-proposal-thundertree-cottage",
          "viewBox": [
            918.95,
            481.3,
            294.75,
            196.5
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 467) / 353.7",
        "y": "(y - 402.7) / 235.8",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Thundertree · ruined store"
    },
    {
      "id": "phandelver-proposal-thundertree-tower",
      "sceneId": "lmop-map-thundertree-dragon-tower",
      "legacySceneId": "lmop-map-thundertree-dragon-tower",
      "title": "Thundertree · dragon tower",
      "masterId": "thundertree",
      "proposalImage": "atlas/tactical/thundertree-tower.svg",
      "currentImage": "lmop-battle-maps/professional/thundertree-dragon-tower.png",
      "currentImageSha256": "e32514b7e42bac267dc1bad8a49f65c45f044f5124c2d2f144f66ffb930cb951",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "7"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        467,
        -9.95,
        353.7,
        235.8
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-thundertree.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 31,
        "printedKeyPages": [
          30,
          31,
          32,
          33,
          34
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 39.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 18,
        "gridRows": 12,
        "gridOriginSource": [
          74,
          49
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Building footprints, source-relative positions and winding road network manually redrawn from the printed map. No stream invented. Minor rubble/vegetation and furnishings are schematic; about 39.3 source px per 10 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-thundertree-overview",
          "proposalId": "phandelver-proposal-thundertree-full",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "town-thundertree",
          "proposalId": "phandelver-proposal-thundertree-town",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-brown-horse",
          "proposalId": "phandelver-proposal-thundertree-brown-horse",
          "viewBox": [
            191.9,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-spider-store",
          "proposalId": "phandelver-proposal-thundertree-store",
          "viewBox": [
            467,
            402.7,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-garrison",
          "proposalId": "phandelver-proposal-thundertree-garrison",
          "viewBox": [
            860,
            -9.95,
            294.75,
            196.5
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-cultists",
          "proposalId": "phandelver-proposal-thundertree-cottage",
          "viewBox": [
            918.95,
            481.3,
            294.75,
            196.5
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 467) / 353.7",
        "y": "(y - -9.95) / 235.8",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Thundertree · ruined tower"
    },
    {
      "id": "phandelver-proposal-thundertree-garrison",
      "sceneId": "lmop-map-thundertree-garrison",
      "legacySceneId": "lmop-map-thundertree-garrison",
      "title": "Thundertree · old garrison",
      "masterId": "thundertree",
      "proposalImage": "atlas/tactical/thundertree-garrison.svg",
      "currentImage": "lmop-battle-maps/professional/thundertree-garrison.png",
      "currentImageSha256": "930132391a0e858ecb76b847ee95bff31ee7a23985db316594864f518ee1ad92",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "11"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        860,
        -9.95,
        294.75,
        196.5
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-thundertree.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 31,
        "printedKeyPages": [
          30,
          31,
          32,
          33,
          34
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 39.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 15,
        "gridRows": 10,
        "gridOriginSource": [
          74,
          49
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Building footprints, source-relative positions and winding road network manually redrawn from the printed map. No stream invented. Minor rubble/vegetation and furnishings are schematic; about 39.3 source px per 10 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-thundertree-overview",
          "proposalId": "phandelver-proposal-thundertree-full",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "town-thundertree",
          "proposalId": "phandelver-proposal-thundertree-town",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-brown-horse",
          "proposalId": "phandelver-proposal-thundertree-brown-horse",
          "viewBox": [
            191.9,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-spider-store",
          "proposalId": "phandelver-proposal-thundertree-store",
          "viewBox": [
            467,
            402.7,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-dragon-tower",
          "proposalId": "phandelver-proposal-thundertree-tower",
          "viewBox": [
            467,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-cultists",
          "proposalId": "phandelver-proposal-thundertree-cottage",
          "viewBox": [
            918.95,
            481.3,
            294.75,
            196.5
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 860) / 294.75",
        "y": "(y - -9.95) / 196.5",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Thundertree · old garrison"
    },
    {
      "id": "phandelver-proposal-thundertree-cottage",
      "sceneId": "lmop-map-thundertree-cultists",
      "legacySceneId": "lmop-map-thundertree-cultists",
      "title": "Thundertree · cultist cottage",
      "masterId": "thundertree",
      "proposalImage": "atlas/tactical/thundertree-cottage.svg",
      "currentImage": "lmop-battle-maps/professional/thundertree-cultists.png",
      "currentImageSha256": "b72981a11c0a394f1728129b38244af37aa0672c1d37d3e85084adaabbece607",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "13"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        918.95,
        481.3,
        294.75,
        196.5
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-thundertree.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 31,
        "printedKeyPages": [
          30,
          31,
          32,
          33,
          34
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 39.3,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 15,
        "gridRows": 10,
        "gridOriginSource": [
          74,
          49
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Building footprints, source-relative positions and winding road network manually redrawn from the printed map. No stream invented. Minor rubble/vegetation and furnishings are schematic; about 39.3 source px per 10 ft.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "western-road",
          "area": "lanes",
          "point": [
            0,
            139
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        },
        {
          "id": "south-road",
          "area": "lanes",
          "point": [
            319,
            750
          ],
          "returnSceneId": "region-lmop",
          "kind": "road"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-thundertree-overview",
          "proposalId": "phandelver-proposal-thundertree-full",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "town-thundertree",
          "proposalId": "phandelver-proposal-thundertree-town",
          "viewBox": [
            -4.6,
            -9.95,
            1179,
            786
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-brown-horse",
          "proposalId": "phandelver-proposal-thundertree-brown-horse",
          "viewBox": [
            191.9,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-spider-store",
          "proposalId": "phandelver-proposal-thundertree-store",
          "viewBox": [
            467,
            402.7,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-dragon-tower",
          "proposalId": "phandelver-proposal-thundertree-tower",
          "viewBox": [
            467,
            -9.95,
            353.7,
            235.8
          ]
        },
        {
          "sceneId": "lmop-map-thundertree-garrison",
          "proposalId": "phandelver-proposal-thundertree-garrison",
          "viewBox": [
            860,
            -9.95,
            294.75,
            196.5
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 918.95) / 294.75",
        "y": "(y - 481.3) / 196.5",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Thundertree · eastern cottage"
    },
    {
      "id": "phandelver-proposal-wave-echo-south",
      "sceneId": "lmop-map-wave-south",
      "legacySceneId": "lmop-map-wave-south",
      "title": "Wave Echo Cave · southern workings",
      "masterId": "wave-echo",
      "proposalImage": "atlas/tactical/wave-echo-south.svg",
      "currentImage": "lmop-battle-maps/professional/wave-south.png",
      "currentImageSha256": "503045921860eafd6e26f12ef8a96db15ec8f30f9a3ffbcb84407f1732873070",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -8.55,
        750.55,
        1188.75,
        792.5
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-wave-echo-cave.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 43,
        "printedKeyPages": [
          42,
          43,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 31.7,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 75,
        "gridRows": 50,
        "gridOriginSource": [
          39,
          69
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "precision": "Manual source-coordinate reconstruction across one shared portrait frame. Main keyed rooms and connecting routes reconciled; natural outlines and mined dead ends simplified. About 31.7 source px per 10 ft. Five-foot overlay needs half-cell calibration, never the old 44-column assumption.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-wave-central",
          "proposalId": "phandelver-proposal-wave-echo-central",
          "viewBox": [
            -8.55,
            259.2,
            1141.2,
            760.8
          ]
        },
        {
          "sceneId": "lmop-map-wave-north",
          "proposalId": "phandelver-proposal-wave-echo-north",
          "viewBox": [
            -8.55,
            -41.95,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-great-cavern",
          "proposalId": "phandelver-proposal-wave-echo-great-cavern",
          "viewBox": [
            229.2,
            512.8,
            618.15,
            412.1
          ]
        },
        {
          "sceneId": "lmop-map-wave-smelter",
          "proposalId": "phandelver-proposal-wave-echo-smelter",
          "viewBox": [
            451.1,
            259.2,
            570.6,
            380.4
          ]
        },
        {
          "sceneId": "lmop-map-wave-forge",
          "proposalId": "phandelver-proposal-wave-echo-forge",
          "viewBox": [
            879.05,
            496.95,
            285.3,
            190.2
          ]
        },
        {
          "sceneId": "lmop-map-wave-temple",
          "proposalId": "phandelver-proposal-wave-echo-temple",
          "viewBox": [
            -8.55,
            37.3,
            380.4,
            253.6
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -8.55) / 1188.75",
        "y": "(y - 750.55) / 792.5",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Wave Echo Cave · southern workings",
      "partialCoverage": [
        "2: northern mine tunnels continue into the central board."
      ]
    },
    {
      "id": "phandelver-proposal-wave-echo-central",
      "sceneId": "lmop-map-wave-central",
      "legacySceneId": "lmop-map-wave-central",
      "title": "Wave Echo Cave · central mine",
      "masterId": "wave-echo",
      "proposalImage": "atlas/tactical/wave-echo-central.svg",
      "currentImage": "lmop-battle-maps/professional/wave-central.png",
      "currentImageSha256": "02455c43aa55195b1cb31e575c8538fded237fb4fb04f24a3e2488b563982344",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -8.55,
        259.2,
        1141.2,
        760.8
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-wave-echo-cave.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 43,
        "printedKeyPages": [
          42,
          43,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 31.7,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 72,
        "gridRows": 48,
        "gridOriginSource": [
          39,
          69
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Manual source-coordinate reconstruction across one shared portrait frame. Main keyed rooms and connecting routes reconciled; natural outlines and mined dead ends simplified. About 31.7 source px per 10 ft. Five-foot overlay needs half-cell calibration, never the old 44-column assumption.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-wave-south",
          "proposalId": "phandelver-proposal-wave-echo-south",
          "viewBox": [
            -8.55,
            750.55,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-north",
          "proposalId": "phandelver-proposal-wave-echo-north",
          "viewBox": [
            -8.55,
            -41.95,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-great-cavern",
          "proposalId": "phandelver-proposal-wave-echo-great-cavern",
          "viewBox": [
            229.2,
            512.8,
            618.15,
            412.1
          ]
        },
        {
          "sceneId": "lmop-map-wave-smelter",
          "proposalId": "phandelver-proposal-wave-echo-smelter",
          "viewBox": [
            451.1,
            259.2,
            570.6,
            380.4
          ]
        },
        {
          "sceneId": "lmop-map-wave-forge",
          "proposalId": "phandelver-proposal-wave-echo-forge",
          "viewBox": [
            879.05,
            496.95,
            285.3,
            190.2
          ]
        },
        {
          "sceneId": "lmop-map-wave-temple",
          "proposalId": "phandelver-proposal-wave-echo-temple",
          "viewBox": [
            -8.55,
            37.3,
            380.4,
            253.6
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -8.55) / 1141.2",
        "y": "(y - 259.2) / 760.8",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Wave Echo Cave · central mine",
      "overlapCoverage": [
        "2",
        "6",
        "7",
        "8",
        "16",
        "17",
        "18"
      ]
    },
    {
      "id": "phandelver-proposal-wave-echo-north",
      "sceneId": "lmop-map-wave-north",
      "legacySceneId": "lmop-map-wave-north",
      "title": "Wave Echo Cave · northern reaches",
      "masterId": "wave-echo",
      "proposalImage": "atlas/tactical/wave-echo-north.svg",
      "currentImage": "lmop-battle-maps/professional/wave-north.png",
      "currentImageSha256": "fcf1b6486d9a505eada4ddafdfdcb5a6df96c2fd5d6289dea9b80e390371d73e",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "16",
        "17",
        "18",
        "19",
        "20"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -8.55,
        -41.95,
        1188.75,
        792.5
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-wave-echo-cave.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 43,
        "printedKeyPages": [
          42,
          43,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 31.7,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 75,
        "gridRows": 50,
        "gridOriginSource": [
          39,
          69
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Manual source-coordinate reconstruction across one shared portrait frame. Main keyed rooms and connecting routes reconciled; natural outlines and mined dead ends simplified. About 31.7 source px per 10 ft. Five-foot overlay needs half-cell calibration, never the old 44-column assumption.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-wave-south",
          "proposalId": "phandelver-proposal-wave-echo-south",
          "viewBox": [
            -8.55,
            750.55,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-central",
          "proposalId": "phandelver-proposal-wave-echo-central",
          "viewBox": [
            -8.55,
            259.2,
            1141.2,
            760.8
          ]
        },
        {
          "sceneId": "lmop-map-wave-great-cavern",
          "proposalId": "phandelver-proposal-wave-echo-great-cavern",
          "viewBox": [
            229.2,
            512.8,
            618.15,
            412.1
          ]
        },
        {
          "sceneId": "lmop-map-wave-smelter",
          "proposalId": "phandelver-proposal-wave-echo-smelter",
          "viewBox": [
            451.1,
            259.2,
            570.6,
            380.4
          ]
        },
        {
          "sceneId": "lmop-map-wave-forge",
          "proposalId": "phandelver-proposal-wave-echo-forge",
          "viewBox": [
            879.05,
            496.95,
            285.3,
            190.2
          ]
        },
        {
          "sceneId": "lmop-map-wave-temple",
          "proposalId": "phandelver-proposal-wave-echo-temple",
          "viewBox": [
            -8.55,
            37.3,
            380.4,
            253.6
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -8.55) / 1188.75",
        "y": "(y - -41.95) / 792.5",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Wave Echo Cave · northern reaches",
      "overlapCoverage": [
        "9",
        "10",
        "11",
        "12",
        "13",
        "15"
      ]
    },
    {
      "id": "phandelver-proposal-wave-echo-great-cavern",
      "sceneId": "lmop-map-wave-great-cavern",
      "legacySceneId": "lmop-map-wave-great-cavern",
      "title": "Wave Echo Cave · great cavern",
      "masterId": "wave-echo",
      "proposalImage": "atlas/tactical/wave-echo-great-cavern.svg",
      "currentImage": "lmop-battle-maps/professional/wave-great-cavern.png",
      "currentImageSha256": "78d7b7169c24d04c490a0d81f03f5789ae7a3c31080539e96cc2b6d8d1424d20",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "9"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        229.2,
        512.8,
        618.15,
        412.1
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-wave-echo-cave.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 43,
        "printedKeyPages": [
          42,
          43,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 31.7,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 39,
        "gridRows": 26,
        "gridOriginSource": [
          39,
          69
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Manual source-coordinate reconstruction across one shared portrait frame. Main keyed rooms and connecting routes reconciled; natural outlines and mined dead ends simplified. About 31.7 source px per 10 ft. Five-foot overlay needs half-cell calibration, never the old 44-column assumption.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-wave-south",
          "proposalId": "phandelver-proposal-wave-echo-south",
          "viewBox": [
            -8.55,
            750.55,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-central",
          "proposalId": "phandelver-proposal-wave-echo-central",
          "viewBox": [
            -8.55,
            259.2,
            1141.2,
            760.8
          ]
        },
        {
          "sceneId": "lmop-map-wave-north",
          "proposalId": "phandelver-proposal-wave-echo-north",
          "viewBox": [
            -8.55,
            -41.95,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-smelter",
          "proposalId": "phandelver-proposal-wave-echo-smelter",
          "viewBox": [
            451.1,
            259.2,
            570.6,
            380.4
          ]
        },
        {
          "sceneId": "lmop-map-wave-forge",
          "proposalId": "phandelver-proposal-wave-echo-forge",
          "viewBox": [
            879.05,
            496.95,
            285.3,
            190.2
          ]
        },
        {
          "sceneId": "lmop-map-wave-temple",
          "proposalId": "phandelver-proposal-wave-echo-temple",
          "viewBox": [
            -8.55,
            37.3,
            380.4,
            253.6
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 229.2) / 618.15",
        "y": "(y - 512.8) / 412.1",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Wave Echo Cave · great cavern"
    },
    {
      "id": "phandelver-proposal-wave-echo-smelter",
      "sceneId": "lmop-map-wave-smelter",
      "legacySceneId": "lmop-map-wave-smelter",
      "title": "Wave Echo Cave · smelter",
      "masterId": "wave-echo",
      "proposalImage": "atlas/tactical/wave-echo-smelter.svg",
      "currentImage": "lmop-battle-maps/professional/wave-smelter.png",
      "currentImageSha256": "3611f57558dcb83e61f4700f937f6b37cbda383b88b89948db9da35ba611a210",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "12"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        451.1,
        259.2,
        570.6,
        380.4
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-wave-echo-cave.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 43,
        "printedKeyPages": [
          42,
          43,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 31.7,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 36,
        "gridRows": 24,
        "gridOriginSource": [
          39,
          69
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Manual source-coordinate reconstruction across one shared portrait frame. Main keyed rooms and connecting routes reconciled; natural outlines and mined dead ends simplified. About 31.7 source px per 10 ft. Five-foot overlay needs half-cell calibration, never the old 44-column assumption.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-wave-south",
          "proposalId": "phandelver-proposal-wave-echo-south",
          "viewBox": [
            -8.55,
            750.55,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-central",
          "proposalId": "phandelver-proposal-wave-echo-central",
          "viewBox": [
            -8.55,
            259.2,
            1141.2,
            760.8
          ]
        },
        {
          "sceneId": "lmop-map-wave-north",
          "proposalId": "phandelver-proposal-wave-echo-north",
          "viewBox": [
            -8.55,
            -41.95,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-great-cavern",
          "proposalId": "phandelver-proposal-wave-echo-great-cavern",
          "viewBox": [
            229.2,
            512.8,
            618.15,
            412.1
          ]
        },
        {
          "sceneId": "lmop-map-wave-forge",
          "proposalId": "phandelver-proposal-wave-echo-forge",
          "viewBox": [
            879.05,
            496.95,
            285.3,
            190.2
          ]
        },
        {
          "sceneId": "lmop-map-wave-temple",
          "proposalId": "phandelver-proposal-wave-echo-temple",
          "viewBox": [
            -8.55,
            37.3,
            380.4,
            253.6
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 451.1) / 570.6",
        "y": "(y - 259.2) / 380.4",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Wave Echo Cave · smelter"
    },
    {
      "id": "phandelver-proposal-wave-echo-forge",
      "sceneId": "lmop-map-wave-forge",
      "legacySceneId": "lmop-map-wave-forge",
      "title": "Wave Echo Cave · Forge of Spells",
      "masterId": "wave-echo",
      "proposalImage": "atlas/tactical/wave-echo-forge.svg",
      "currentImage": "lmop-battle-maps/professional/wave-forge.png",
      "currentImageSha256": "188fe40d297c76661aff9bfebe6e15d5058f70fb9a266b8914ed6ea42ad84757",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "15"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        879.05,
        496.95,
        285.3,
        190.2
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-wave-echo-cave.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 43,
        "printedKeyPages": [
          42,
          43,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 31.7,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 18,
        "gridRows": 12,
        "gridOriginSource": [
          39,
          69
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Manual source-coordinate reconstruction across one shared portrait frame. Main keyed rooms and connecting routes reconciled; natural outlines and mined dead ends simplified. About 31.7 source px per 10 ft. Five-foot overlay needs half-cell calibration, never the old 44-column assumption.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-wave-south",
          "proposalId": "phandelver-proposal-wave-echo-south",
          "viewBox": [
            -8.55,
            750.55,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-central",
          "proposalId": "phandelver-proposal-wave-echo-central",
          "viewBox": [
            -8.55,
            259.2,
            1141.2,
            760.8
          ]
        },
        {
          "sceneId": "lmop-map-wave-north",
          "proposalId": "phandelver-proposal-wave-echo-north",
          "viewBox": [
            -8.55,
            -41.95,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-great-cavern",
          "proposalId": "phandelver-proposal-wave-echo-great-cavern",
          "viewBox": [
            229.2,
            512.8,
            618.15,
            412.1
          ]
        },
        {
          "sceneId": "lmop-map-wave-smelter",
          "proposalId": "phandelver-proposal-wave-echo-smelter",
          "viewBox": [
            451.1,
            259.2,
            570.6,
            380.4
          ]
        },
        {
          "sceneId": "lmop-map-wave-temple",
          "proposalId": "phandelver-proposal-wave-echo-temple",
          "viewBox": [
            -8.55,
            37.3,
            380.4,
            253.6
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - 879.05) / 285.3",
        "y": "(y - 496.95) / 190.2",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Wave Echo Cave · workshop"
    },
    {
      "id": "phandelver-proposal-wave-echo-temple",
      "sceneId": "lmop-map-wave-temple",
      "legacySceneId": "lmop-map-wave-temple",
      "title": "Wave Echo Cave · Temple of Dumathoin",
      "masterId": "wave-echo",
      "proposalImage": "atlas/tactical/wave-echo-temple.svg",
      "currentImage": "lmop-battle-maps/professional/wave-temple.png",
      "currentImageSha256": "2379fe81e4d6cdaa4ff5f92c9e867f16ff261b68fc55a5262fef1b7697567978",
      "priority": "P1",
      "status": "proposal-review-needed",
      "reviewNeeded": true,
      "geometryChanged": true,
      "automaticReplacement": false,
      "audience": "player-after-reveal",
      "dmCompanion": "atlas/tactical/Phandelver-Tactical-Topology-DM.json",
      "coverage": [
        "19",
        "20"
      ],
      "coverageMeaning": "Primary keyed areas; overlapping source context can also appear. Crops keep one global geometry, orientation and scale.",
      "viewBox": [
        -8.55,
        37.3,
        380.4,
        253.6
      ],
      "sourceFrame": {
        "nativeImage": "private-maps/lmop-wave-echo-cave.jpg",
        "nativeDimensions": [
          1382,
          1900
        ],
        "cropOrigin": [
          140,
          110
        ],
        "coordinates": "native source pixels minus cropOrigin; no image rescaling"
      },
      "source": {
        "title": "Lost Mine of Phandelver",
        "printedMapPage": 43,
        "printedKeyPages": [
          42,
          43,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51
        ]
      },
      "scale": {
        "sourceSquareFeet": 10,
        "measuredSourceCellPixels": 31.7,
        "measurementPrecision": "approximate scan calibration; room/door positions manually sampled",
        "squareFeet": 5,
        "gridColumns": 24,
        "gridRows": 16,
        "gridOriginSource": [
          39,
          69
        ],
        "gridOffsetPercent": [
          0,
          0
        ],
        "bakedGrid": false,
        "units": "feet",
        "north": "up",
        "gridEnabled": true,
        "tacticalMeasurement": true,
        "calibrationCaveat": "Overlay aligns to the authored source-coordinate grid. Native scan and manual wall tracing are approximate; numerical grid alignment does not prove exact original geometry."
      },
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ],
      "entryPoints": [],
      "precision": "Manual source-coordinate reconstruction across one shared portrait frame. Main keyed rooms and connecting routes reconciled; natural outlines and mined dead ends simplified. About 31.7 source px per 10 ft. Five-foot overlay needs half-cell calibration, never the old 44-column assumption.",
      "fogGuidance": "Begin hidden; reveal only explored geometry. Public art has no keys or secret connectors. Reveal a separate discovered connector deliberately.",
      "stateMigration": "Different geometry invalidates old fog/token/drawing coordinates. Keep existing scene and current art untouched until a deliberate reviewed migration or duplicate rehearsal. Do not overwrite or reset any save.",
      "sourceGeometryCheck": "manual source comparison; topology and pixel-coordinate tests below do not prove exact geometric tracing",
      "validation": "source-reconciled proposal; DM review required before adoption",
      "masterEntryPoints": [
        {
          "id": "south-cave",
          "area": "1",
          "point": [
            25,
            1426
          ],
          "returnSceneId": "region-lmop",
          "kind": "tunnel"
        }
      ],
      "nativeDimensions": [
        1536,
        1024
      ],
      "relatedBoards": [
        {
          "sceneId": "lmop-map-wave-south",
          "proposalId": "phandelver-proposal-wave-echo-south",
          "viewBox": [
            -8.55,
            750.55,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-central",
          "proposalId": "phandelver-proposal-wave-echo-central",
          "viewBox": [
            -8.55,
            259.2,
            1141.2,
            760.8
          ]
        },
        {
          "sceneId": "lmop-map-wave-north",
          "proposalId": "phandelver-proposal-wave-echo-north",
          "viewBox": [
            -8.55,
            -41.95,
            1188.75,
            792.5
          ]
        },
        {
          "sceneId": "lmop-map-wave-great-cavern",
          "proposalId": "phandelver-proposal-wave-echo-great-cavern",
          "viewBox": [
            229.2,
            512.8,
            618.15,
            412.1
          ]
        },
        {
          "sceneId": "lmop-map-wave-smelter",
          "proposalId": "phandelver-proposal-wave-echo-smelter",
          "viewBox": [
            451.1,
            259.2,
            570.6,
            380.4
          ]
        },
        {
          "sceneId": "lmop-map-wave-forge",
          "proposalId": "phandelver-proposal-wave-echo-forge",
          "viewBox": [
            879.05,
            496.95,
            285.3,
            190.2
          ]
        }
      ],
      "coordinateTransform": {
        "from": "master-source-pixels",
        "to": "board-normalized-0-1",
        "x": "(x - -8.55) / 380.4",
        "y": "(y - 37.3) / 253.6",
        "warning": "Use only for these new proposals; never transform existing save coordinates automatically."
      },
      "nativeFormat": "svg",
      "declaredViewport": [
        1536,
        1024
      ],
      "resolutionIndependent": true,
      "playerTitle": "Wave Echo Cave · northern hall"
    }
  ],
  "audit": [
    {
      "sceneId": "phandalin-street",
      "image": "lmop-battle-maps/professional/phandalin-street.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "redbrand-hideout",
      "image": "lmop-battle-maps/professional/redbrand-hideout.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/redbrand-hideout-full.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-triboar-trail",
      "image": "lmop-battle-maps/professional/triboar-trail.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-night-camp",
      "image": "lmop-battle-maps/professional/night-camp.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-conyberry-ruins",
      "image": "lmop-battle-maps/professional/conyberry-ruins.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-agatha-grove",
      "image": "lmop-battle-maps/professional/agatha-grove.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-old-owl-well",
      "image": "lmop-battle-maps/professional/old-owl-well.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wyvern-tor",
      "image": "lmop-battle-maps/professional/wyvern-tor.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-sleeping-giant",
      "image": "lmop-battle-maps/professional/sleeping-giant.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-tresendar-courtyard",
      "image": "lmop-battle-maps/professional/tresendar-courtyard.png",
      "classification": "ready-to-reuse",
      "qualification": "Original encounter staging; no published keyed floorplan fidelity claimed.",
      "proposal": null,
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing 5-ft/30-column scale is an authored play-space convention, not measured source geometry.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-redbrand-crevasse",
      "image": "lmop-battle-maps/professional/redbrand-crevasse.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/redbrand-crevasse.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-thundertree-overview",
      "image": "lmop-battle-maps/professional/thundertree-overview.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/thundertree-full.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-thundertree-brown-horse",
      "image": "lmop-battle-maps/professional/thundertree-brown-horse.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/thundertree-brown-horse.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-thundertree-spider-store",
      "image": "lmop-battle-maps/professional/thundertree-spider-store.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/thundertree-store.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-thundertree-dragon-tower",
      "image": "lmop-battle-maps/professional/thundertree-dragon-tower.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/thundertree-tower.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-thundertree-garrison",
      "image": "lmop-battle-maps/professional/thundertree-garrison.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/thundertree-garrison.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-thundertree-cultists",
      "image": "lmop-battle-maps/professional/thundertree-cultists.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/thundertree-cottage.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-cragmaw-castle",
      "image": "lmop-battle-maps/professional/cragmaw-castle.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/cragmaw-castle-full.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-cragmaw-kings-quarters",
      "image": "lmop-battle-maps/professional/cragmaw-kings-quarters.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/cragmaw-castle-east.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wave-south",
      "image": "lmop-battle-maps/professional/wave-south.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/wave-echo-south.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wave-central",
      "image": "lmop-battle-maps/professional/wave-central.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/wave-echo-central.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wave-north",
      "image": "lmop-battle-maps/professional/wave-north.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/wave-echo-north.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wave-great-cavern",
      "image": "lmop-battle-maps/professional/wave-great-cavern.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/wave-echo-great-cavern.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wave-smelter",
      "image": "lmop-battle-maps/professional/wave-smelter.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/wave-echo-smelter.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wave-forge",
      "image": "lmop-battle-maps/professional/wave-forge.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/wave-echo-forge.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "lmop-map-wave-temple",
      "image": "lmop-battle-maps/professional/wave-temple.png",
      "classification": "needs-correction",
      "qualification": "Source-relative geometry changed; replacement proposal needs review.",
      "proposal": "atlas/tactical/wave-echo-temple.svg",
      "sourceGeometryVerified": false,
      "scaleClaim": "Existing staging scale must not be transferred to source redraw.",
      "audience": "player-after-reveal",
      "intendedModes": [
        "exploration",
        "conversation",
        "combat"
      ]
    },
    {
      "sceneId": "town-phandalin",
      "image": "town-maps/professional/phandalin-overhead.png",
      "classification": "needs-correction",
      "qualification": "Current painting uses invented crossroads geometry. New source-relative town proposal retains winding lanes and landmark positions; roofs/landscape remain schematic and measurements approximate.",
      "sourceGeometryVerified": false,
      "audience": "player-after-reveal",
      "proposal": "atlas/tactical/phandalin-town.svg"
    },
    {
      "sceneId": "town-conyberry",
      "image": "town-maps/professional/conyberry-overhead.png",
      "classification": "ready-to-reuse",
      "qualification": "Original ruined village staging. LMOP supplies prose, not a keyed town floorplan or surveyed river/road layout; no canonical geometry or precise distance claim.",
      "sourceGeometryVerified": false,
      "audience": "player-after-reveal"
    },
    {
      "sceneId": "approach",
      "image": "session-01-visuals/cave-approach-painted-gridless.png",
      "classification": "ready-to-reuse",
      "qualification": "Original exterior staging; align return to the source-reconciled hideout mouth manually. No exact source distance claim.",
      "sourceGeometryVerified": false,
      "audience": "player-after-reveal"
    },
    {
      "sceneId": "road",
      "image": "session-01-visuals/road-ambush-painted-gridless.png",
      "classification": "ready-to-reuse",
      "qualification": "Original ambush staging; landscape is not a surveyed section of the published regional road.",
      "sourceGeometryVerified": false,
      "audience": "player-after-reveal"
    },
    {
      "sceneId": "interior",
      "image": "session-01-visuals/cragmaw-hideout-painted-gridless.png",
      "classification": "needs-correction",
      "proposal": "atlas/tactical/cragmaw-hideout-full.svg",
      "qualification": "Use the source bridge-over-stream and chimney elevation graph. New native proposal preserves both routes; painting is retained.",
      "sourceGeometryVerified": false,
      "audience": "player-after-reveal"
    },
    {
      "sceneId": "town-thundertree",
      "image": "town-maps/professional/thundertree-overhead.png",
      "classification": "needs-correction",
      "proposal": "atlas/tactical/thundertree-town.svg",
      "qualification": "Painted schematic invents a stream and relocates streets/buildings. New source-relative town proposal shares all tactical geometry and closeups.",
      "sourceGeometryVerified": false,
      "audience": "player-after-reveal"
    }
  ]
};})();

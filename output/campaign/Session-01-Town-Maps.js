(() => {
  'use strict';
  // Approximate, original player maps. No published room numbers or unrevealed plot details enter the TV payload.
  const sites = {
    'region-lmop': {
      title: 'Phandelver frontier',
      points: [
        ['region-neverwinter', 14, 36, 'Neverwinter', 'A great city on the Sword Coast, where Gundren hired the party for the journey south.', 'Starting point. This map is an approximate campaign overview, not a measured travel map.', true],
        ['region-thundertree', 35, 32, 'Thundertree', 'Ruins lie at the edge of Neverwinter Wood.', 'Chapter 3 optional branch. Reidoth can help locate Cragmaw Castle. Do not reveal the dragon or cultists on the map.', false],
        ['region-agatha', 77, 30, 'Agatha’s lair', 'An old path leaves the ruined village and winds into the woods.', 'Sister Garaele’s optional lead. Reveal the exact destination only when the party learns it.', false],
        ['region-conyberry', 84, 38, 'Conyberry', 'The eastern trail reaches an abandoned village.', 'Chapter 3 optional branch; Agatha’s trail begins nearby.', false],
        ['region-cragmaw-castle', 56, 36, 'Cragmaw Castle', 'An old stronghold stands somewhere within the forest.', 'DM continuity: Redbrands abducted Gundren and delivered him here. The party has not learned this. Reveal only after a credible lead.', false],
        ['region-old-owl-well', 77, 58, 'Old Owl Well', 'Ancient stones rise from the eastern hills.', 'Daran Edermath’s optional lead. Hamun Kost and the undead remain secret.', false],
        ['region-wyvern-tor', 89, 69, 'Wyvern Tor', 'A rocky hill overlooks the southern wilds.', 'Optional orc threat from the Townmaster’s Hall notice. Do not reveal occupants until discovered.', false],
        ['region-road-ambush', 38, 52, 'Triboar Trail ambush', 'Here the party found Gundren’s horses and fought goblins on the road.', 'Session 1 opening. The party followed the goblin trail to Cragmaw Hideout.', true],
        ['region-cragmaw-hideout', 34, 44, 'Cragmaw Hideout', 'The party followed a goblin trail to this cave and rescued Sildar.', 'Session 1 complete: Klarg dead, Yeemik left in charge. Gundren’s destination was not learned.', true],
        ['region-phandalin', 46.5, 67.8, 'Phandalin', 'A frontier mining town at the end of the supply road. The party has reached Barthen’s Provisions.', 'Current campaign hub. Open the Phandalin town map for shops, NPCs, and local leads.', true],
        ['region-tresendar', 53, 77.5, 'Tresendar Manor ruins', 'A ruined manor watches over Phandalin from a low hill.', 'The ruins are visible from town. Redbrand hideout entrances and occupants stay private until discovered.', true],
        ['region-wave-echo', 68, 73, 'Wave Echo Cave', 'A hidden cave lies somewhere in the Sword Mountains.', 'Do not reveal the point or location until Gundren’s map, testimony, or another credible discovery gives the party its position. Chapter 4.', false]
      ]
    },
    'town-phandalin': {
      title: 'Phandalin',
      points: [
        ['phandalin-barthen', 62.5, 33.8, 'Barthen’s Provisions', 'A busy supply shop stands beside the road into town.', 'The party begins Session 2 here. Delivery and payment only happen if played.', true],
        ['phandalin-inn', 56.3, 44.8, 'Stonehill Inn', 'Warm light and voices come from the largest inn near the green.', 'Rumors and Sildar’s lodging; Lost Mine pp. 15–16.', true],
        ['phandalin-hall', 51.8, 61.5, 'Townmaster’s Hall', 'A modest public hall sits on the south side of the green.', 'Harbin Wester; town notices and orc reward.', true],
        ['phandalin-lionshield', 35.8, 67, 'Lionshield Coster', 'A sturdy trading post displays a blue lion shield.', 'Linene Graywind; stolen goods from Cragmaw Hideout.', true],
        ['phandalin-exchange', 45, 79.5, 'Miner’s Exchange', 'Prospectors come and go with pouches of ore and dust.', 'Halia Thornton; do not announce her private goals.', true],
        ['phandalin-shrine', 44.1, 39.1, 'Shrine of Luck', 'A small shrine stands near the road and the town green.', 'Sister Garaele; Agatha lead if offered.', true],
        ['phandalin-giant', 70, 44, 'Sleeping Giant', 'The tap house has a rougher crowd than the inn.', 'Redbrand pressure can arise here; do not place foes until the scene warrants it.', true],
        ['phandalin-alderleaf', 76.8, 72.4, 'Alderleaf Farm', 'Fields and a farmhouse lie along the edge of town.', 'Qelline and Carp; allow clues to emerge through play.', true],
        ['phandalin-edermath', 23.2, 35.4, 'Edermath Orchard', 'Rows of fruit trees lead to a cottage on the west side.', 'Daran Edermath; Old Owl Well lead.', true],
        ['phandalin-manor', 87.8, 44, 'Tresendar Manor ruins', 'A ruined manor overlooks the settlement from a low hill.', 'The visible ruins are public. The Redbrand entrance and tunnel remain private.', true],
        ['phandalin-tunnel', 83.2, 53, 'Hillside tunnel', 'A narrow opening cuts into the slope below the manor.', 'Reveal only after the party finds this entrance.', false]
      ]
    },
    'town-conyberry': {
      title: 'Conyberry',
      points: [
        ['conyberry-square', 49.7, 51.4, 'Ruined village green', 'Grass and saplings have overtaken the old center of Conyberry.', 'Custom orientation landmark; the published settlement is abandoned.', true],
        ['conyberry-west', 28.9, 71.8, 'Westward ruins', 'Only foundations remain among the trees.', 'Custom orientation landmark. Do not imply a keyed encounter.', true],
        ['conyberry-chapel', 38.4, 36.8, 'Broken stone building', 'A roofless stone building faces the old road.', 'Custom orientation landmark. Let players describe their search.', true],
        ['conyberry-mill', 66.5, 35.5, 'Old riverside building', 'A large ruin stands near the watercourse.', 'Custom orientation landmark, not a published room key.', true],
        ['conyberry-forest', 24.6, 58.5, 'Forest trail', 'A narrow path disappears into the western woods.', 'Reveal when the party follows the Agatha lead or discovers the path.', false]
      ]
    },
    'town-thundertree': {
      title: 'Thundertree',
      points: [
        ['thundertree-west', 16.5, 46, 'Western cottages', 'Broken cottages stand among ash-dusted trees.', 'Areas 1–2. Keep occupants and hazards private.', true],
        ['thundertree-horse', 36.5, 28.3, 'Old inn', 'A weathered sign hangs above the remains of an inn.', 'Area 3, Brown Horse. Reveal only what is visible.', true],
        ['thundertree-druid', 29.8, 73.4, 'Boarded cottage', 'This cottage is in better repair than the surrounding ruins.', 'Area 4, Druid’s Watch. Reidoth is not on the public marker.', true],
        ['thundertree-store', 57.8, 71.8, 'Ruined store', 'Webs and broken beams cover a former shop.', 'Area 6. Do not reveal spiders before seen.', true],
        ['thundertree-tower', 63.3, 27.3, 'Old tower', 'A round tower rises above the overgrown settlement.', 'Area 7. Do not reveal Venomfang before seen.', true],
        ['thundertree-smithy', 72.7, 70.4, 'Old smithy', 'A ruined forge sits beside the eastern track.', 'Area 8.', true],
        ['thundertree-herbalist', 80.5, 43.6, 'Herbalist’s shop', 'A small shop is almost swallowed by vines.', 'Area 9.', true],
        ['thundertree-square', 73.3, 48.5, 'Town square', 'A worn statue stands at the meeting of the old paths.', 'Area 10.', true],
        ['thundertree-garrison', 88.7, 27.8, 'Old garrison', 'Heavy stone walls still outline a guard post.', 'Area 11.', true],
        ['thundertree-east', 88.2, 73.8, 'Eastern cottage', 'A cottage stands at the far edge of the ruins.', 'Area 13. Do not identify the cultists until discovered.', true]
      ]
    },
    'city-waterdeep': {
      title: 'Waterdeep',
      points: [
        ['waterdeep-yawning', 49.8, 49.8, 'The Yawning Portal', 'The famous inn is a gathering place for adventurers in Castle Ward.', 'Campaign home base. The well descends to Undermountain.', true],
        ['waterdeep-castle', 37.5, 56, 'Castle Waterdeep', 'The city’s fortress dominates the high ground above the harbor.', 'Public landmark; city map is a schematic, not a street-accurate plan.', true],
        ['waterdeep-harbor', 26.5, 73.2, 'Deepwater Harbor', 'Ships crowd the quays beside the Dock Ward.', 'Public landmark.', true],
        ['waterdeep-dead', 77.5, 39, 'City of the Dead', 'Gardens and memorials fill the walled cemetery.', 'Public landmark.', true],
        ['waterdeep-north-gate', 56.6, 17.3, 'North Gate', 'The northern road enters the city through its great wall.', 'Public landmark.', true],
        ['waterdeep-second-margin', 55.8, 39.4, 'Second Margin bookshop', 'A bookshop awaits investigation in Castle Ward.', 'Custom Echo Below location. Reveal only after the party learns of it.', false],
        ['waterdeep-lantern', 70.1, 75.8, 'Lantern House', 'A familiar refuge lies among the streets of the Southern Ward.', 'Custom hub location. Reveal when introduced.', false]
      ]
    }
  };
  const ids = Object.keys(sites);
  // Move only untouched schematic defaults to the painted landmarks once.
  const legacyRegionPositions = {
    'region-neverwinter': [18, 46], 'region-thundertree': [38, 42], 'region-agatha': [74, 45],
    'region-conyberry': [84, 49], 'region-cragmaw-castle': [56, 57], 'region-old-owl-well': [77, 63],
    'region-wyvern-tor': [89, 70], 'region-road-ambush': [45, 66], 'region-cragmaw-hideout': [37, 70],
    'region-phandalin': [51, 78], 'region-tresendar': [57, 83], 'region-wave-echo': [68, 81]
  };
  function upgradeRegionScene(value) {
    if (!value || value.journeyArtVersion >= 1) return;
    for (const point of value.points || []) {
      const old = legacyRegionPositions[point.id];
      const current = sites['region-lmop'].points.find(entry => entry[0] === point.id);
      if (old && current && point.x === old[0] && point.y === old[1]) {
        point.x = current[1]; point.y = current[2];
      }
    }
    value.journeyArtVersion = 1;
  }
  const regionScenes = {
    'region-thundertree': 'town-thundertree',
    'region-agatha': 'lmop-map-agatha-grove',
    'region-conyberry': 'town-conyberry',
    'region-cragmaw-castle': 'lmop-map-cragmaw-castle',
    'region-old-owl-well': 'lmop-map-old-owl-well',
    'region-wyvern-tor': 'lmop-map-wyvern-tor',
    'region-road-ambush': 'lmop-map-triboar-trail',
    'region-phandalin': 'town-phandalin',
    'region-tresendar': 'redbrand-hideout',
    'region-wave-echo': 'lmop-map-wave-south'
  };
  function scene(id) {
    const site = sites[id];
    if (!site) return null;
    return globalThis.ECHO_MAP_DATA.scene({ floor: `${site.title} · bird’s-eye view`, light: 'bright', journeyArtVersion: id === 'region-lmop' ? 1 : 0,
      dmLayers: { grid: false, fog: false }, playerLayers: { grid: false, fog: false },
      points: site.points.map(([pointId, x, y, title, clue, note, known]) => ({
        id: pointId, x, y, title, clue, note, visible: known, approved: known
      })) });
  }
  globalThis.ECHO_TOWN_MAPS = { ids, scene, upgradeRegionScene, isTown: id => ids.includes(id), regionScene: id => regionScenes[id] || '' };
})();

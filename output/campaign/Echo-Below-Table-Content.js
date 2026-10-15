/* Private campaign seed data. The TV loads only its audience-filtered current scene. */
(() => {
  'use strict';
  const SCENES = {
    ...Object.fromEntries((globalThis.ECHO_ADVENTURES?.scenes()||[]).map(scene=>[scene.id,{...scene}])),
    'mc-court': { title: 'Mending Court · home plan', image: 'assets/Mending-Court-Plan.svg', kind: 'visual' },
    cover: { title: 'The Echo Below', image: 'assets/Echo-Below-Cover.png' },
    gundren: { title: 'Gundren departs', image: 'session-01-visuals/scene-01-gundren-departs.png' },
    horses: { title: 'The empty horses', image: 'session-01-visuals/scene-02-empty-horses.png' },
    road: { title: 'Road ambush', image: 'session-01-visuals/road-ambush-painted-gridless.png', kind: 'map' },
    'cave-mouth': { title: 'The cave mouth', image: 'session-01-visuals/scene-03-cave-mouth.png' },
    approach: { title: 'Cave approach', image: 'session-01-visuals/cave-approach-painted-gridless.png', kind: 'map' },
    interior: { title: 'Cragmaw Hideout', image: 'session-01-visuals/cragmaw-hideout-painted-gridless.png', kind: 'map', fog: true },
    'road-reveal': { title: 'Road ambush · revealed', image: 'session-01-visuals/scene-12-road-ambush-reveal.png' },
    'trail-art': { title: 'Goblin trail', image: 'session-01-visuals/scene-04-goblin-trail.png' },
    'snare-art': { title: 'Snare · discovered', image: 'session-01-visuals/scene-13-snare-discovered.png' },
    'pit-art': { title: 'Pit · discovered', image: 'session-01-visuals/scene-14-pit-discovered.png' },
    'blind-art': { title: 'Area 2 · Goblin blind', image: 'session-01-visuals/scene-05-goblin-blind.png' },
    'kennel-art': { title: 'Area 3 · Kennel', image: 'session-01-visuals/scene-06-kennel.png' },
    'passage-art': { title: 'Area 4 · Steep passage', image: 'session-01-visuals/scene-07-steep-passage.png' },
    'overpass-art': { title: 'Area 5 · Overpass', image: 'session-01-visuals/scene-08-overpass.png' },
    'den-art': { title: 'Area 6 · Goblin den', image: 'session-01-visuals/scene-09-goblin-den.png' },
    'pools-art': { title: 'Area 7 · Twin pools', image: 'session-01-visuals/scene-10-twin-pools.png' },
    'klarg-art': { title: 'Area 8 · Klarg’s cave', image: 'session-01-visuals/scene-11-klargs-cave.png' },
    'phandalin-art': { title: 'Phandalin arrival', image: 'session-01-visuals/scene-15-phandalin-arrival.png' },
    'barthen-art': { title: 'Barthen’s Provisions', image: 'session-01-visuals/scene-16-barthens-provisions.png' },
    'phandalin-street': { title: 'Phandalin street', image: 'lmop-battle-maps/professional/phandalin-street.png', kind: 'map' },
    'redbrand-hideout': { title: 'Redbrand hideout · unmarked', image: 'lmop-battle-maps/professional/redbrand-hideout.png', kind: 'map', fog: true },
    'region-lmop': { title: 'Campaign map · Phandelver frontier', image: 'town-maps/professional/phandelver-region.png', kind: 'map', grid: false },
    'town-phandalin': { title: 'Town map · Phandalin', image: 'town-maps/professional/phandalin-overhead.png', kind: 'map', grid: false },
    'town-conyberry': { title: 'Town map · Conyberry', image: 'town-maps/professional/conyberry-overhead.png', kind: 'map', grid: false },
    'town-thundertree': { title: 'Town map · Thundertree', image: 'town-maps/professional/thundertree-overhead.png', kind: 'map', grid: false },
    'city-waterdeep': { title: 'City map · Waterdeep', image: 'town-maps/waterdeep-overhead.svg', kind: 'map', grid: false },
    ...Object.fromEntries((globalThis.LMOP_VISUAL_CATALOG || []).map(item => [item.id,
      { title: item.title.startsWith(item.chapter+' · ')?item.title:`${item.chapter} · ${item.title}`, image: item.image }])),
    ...Object.fromEntries((globalThis.LMOP_BATTLE_MAP_CATALOG || []).map(item => [item.id,
      { title: item.title.startsWith(item.chapter+' · ')?item.title:`${item.chapter} · ${item.title}`, image: item.image, kind: 'map',
        fog: item.fog, gridColumns: item.gridColumns }])),
    'wd-portal':{title:'The Yawning Portal',image:'assets/Yawning-Portal-Scene.svg'},
    'wd-research':{title:'Second Margin research',image:'assets/Second-Margin-Scene.svg'},
    'wd-contact':{title:'Dracuseth · Waterdeep contact',image:'assets/Dracuseth-Maw-of-Flames.png'},
    'um1-table':{title:'Undermountain · tactical canvas (DM layouts)',image:'assets/Undermountain-Tactical-Canvas.svg',kind:'map',gridColumns:30},
    black: { title: 'Black screen', kind: 'black' }
  };
  const RUNBOOK = Array.isArray(globalThis.ECHO_RUNBOOK) ? globalThis.ECHO_RUNBOOK : [];
  const RUNBOOK_IDS = new Set(RUNBOOK.map(beat => beat.id));
  const SCENE_NOTES = {
    cover: 'prep', gundren: 'departure', horses: 'ambush', road: 'ambush',
    'cave-mouth': 'cave', approach: 'cave', interior: 'blind',
    'road-reveal': 'ambush', 'trail-art': 'trail', 'snare-art': 'trail', 'pit-art': 'trail',
    'blind-art': 'blind', 'kennel-art': 'kennel', 'passage-art': 'passage',
    'overpass-art': 'bridge', 'den-art': 'den', 'pools-art': 'pools', 'klarg-art': 'klarg',
    'phandalin-art': 'aftermath', 'barthen-art': 'aftermath'
  };
  const ENCOUNTERS = [
    { id: 'road', name: 'Road ambush', note: 'Four goblins: two on each side of the road. Keep them off the TV until spotted or until they attack.' },
    { id: 'blind', name: '2 · Goblin blind', note: 'Two goblins watch from the briars beside the stream.' },
    { id: 'kennel', name: '3 · Kennel', note: 'Three chained wolves. They can be calmed or distracted with food.' },
    { id: 'overpass', name: '5 · Overpass', note: 'One goblin can signal the pools to release a flood.' },
    { id: 'den', name: '6 · Goblin den', note: 'Six goblins including Yeemik. Sildar is tracked with the party, starting at 1 HP.' },
    { id: 'pools', name: '7 · Twin pools', note: 'Three goblins guard the water controls.' },
    { id: 'klarg', name: '8 · Klarg’s cave', note: 'Klarg, Ripper the wolf, and two goblins. Klarg’s hit is dangerous to level-1 characters.' },
    { id: 'redbrand-street', name: 'Phandalin · Redbrand street', note: 'Four ruffians confront the party only when the town conflict reaches this point. Parley, retreat, capture, and combat remain possible.' },
    { id: 'hideout-cellar', name: 'Hideout 1 · Cellar', note: 'Cistern and hidden satchel; noise can alert room 2.' },
    { id: 'hideout-barracks', name: 'Hideout 2 · Ruffian barracks', note: 'Three ruffians, possibly alerted by cellar noise.' },
    { id: 'hideout-trap', name: 'Hideout 3 · Pit trap', note: 'Find or bypass the concealed pit.' },
    { id: 'hideout-crypt', name: 'Hideout 4 · Crypt', note: 'Three skeletons activate near the side doors.' },
    { id: 'hideout-pens', name: 'Hideout 5 · Slave pens', note: 'Two guards and the Dendrar family. Keep captives safe.' },
    { id: 'hideout-crevasse', name: 'Hideout 8 · Crevasse', note: 'Nothic can negotiate; beware the south bridge.' },
    { id: 'hideout-bugbears', name: 'Hideout 9 · Bugbears', note: 'Three bugbears; Droop is a noncombatant.' },
    { id: 'hideout-common', name: 'Hideout 10 · Common room', note: 'Four drunken ruffians and a possible disguise approach.' },
    { id: 'hideout-glasstaff', name: 'Hideout 12 · Glasstaff', note: 'Iarno may flee if his familiar warned him.' },
    { id: 'old-owl-well', name: 'Old Owl Well · optional fight', note: 'Hamun Kost and up to twelve zombies. Parley is the intended first contact; reveal undead when they emerge.' },
    { id: 'wyvern-tor', name: 'Wyvern Tor · optional camp', note: 'One sentry, six ordinary orcs inside, Brughor (30 HP), and Gog the ogre. Extremely dangerous for low-level PCs.' },
    { id: 'tt-blights-1', name: 'Thundertree 1 · Western cottage', note: 'Two hidden twig blights; area 2 may attract them.' },
    { id: 'tt-blights-2', name: 'Thundertree 2 · Blighted cottages', note: 'Six twig blights; move surviving area-1 blights if they join.' },
    { id: 'tt-zombies-3', name: 'Thundertree 3 · Brown Horse', note: 'Four ash zombies; track each first-damage Ash Puff.' },
    { id: 'tt-blights-5', name: 'Thundertree 5 · Farmhouse', note: 'Eight twig blights may approach doorways in pairs.' },
    { id: 'tt-spiders-6', name: 'Thundertree 6 · Spider store', note: 'Two hidden giant spiders and restraining webs.' },
    { id: 'tt-dragon-7', name: 'Thundertree 7 · Venomfang', note: 'Young green dragon; very dangerous for level-2 party. Parley and retreat are supported.' },
    { id: 'tt-zombies-8', name: 'Thundertree 8 · Smithy', note: 'Two ash zombies; first-damage Ash Puff.' },
    { id: 'tt-zombies-11', name: 'Thundertree 11 · Garrison', note: 'Five ash zombies; old armor does not improve AC.' },
    { id: 'tt-blights-12', name: 'Thundertree 12 · Weaver’s cottage', note: 'Six twig blights; noise alerts area 13.' },
    { id: 'tt-cultists-13', name: 'Thundertree 13 · Dragon cultists', note: 'Six cultists including Favric; they prefer talking.' },
    { id: 'castle-archers', name: 'Castle 3 · Arrow-slit posts', note: 'Two goblins in each post. They warn areas 4 and 6 if they spot an intruder.' },
    { id: 'castle-trap', name: 'Castle 2 · Falling rubble', note: 'Passive Perception 20 or active DC 10 Perception while searching; DC 10 Dexterity save, 3d6 bludgeoning or half.' },
    { id: 'castle-barracks', name: 'Castle 4 · Ruined barracks', note: 'Three goblins; loud noise attracts a scout from the banquet hall.' },
    { id: 'castle-hobgoblins', name: 'Castle 6 · Hobgoblin barracks', note: 'Four hobgoblins, AC 18; remember Martial Advantage.' },
    { id: 'castle-banquet', name: 'Castle 7 · Banquet hall', note: 'Yegg (12 HP) plus seven goblins; account for any scout who left.' },
    { id: 'castle-grick', name: 'Castle 8 · Dark hall', note: 'One grick on an upper ledge. Check sight and surprise, then reveal it.' },
    { id: 'castle-shrine', name: 'Castle 9 · Goblin shrine', note: 'Lhupo (12 HP) and two goblins. They prepare if the grick fight was heard.' },
    { id: 'castle-guards', name: 'Castle 12 · Guard barracks', note: 'Two hobgoblins; one warns Grol and returns two rounds later.' },
    { id: 'castle-owlbear', name: 'Castle 13 · Owlbear tower', note: 'One owlbear. Fresh meat or an opened exit can avoid combat.' },
    { id: 'castle-king', name: 'Castle 14 · King’s quarters', note: 'Grol (45 HP), Snarl (18 HP), and Vyerith disguised as a drow. Gundren was recovered and left at an unnamed inn; his present condition is unresolved.' },
    { id: 'castle-warband', name: 'Optional · Returning war band', note: 'Targor (20 HP), two hobgoblins, and two wolves; negotiation is possible.' },
    ...(globalThis.ECHO_SESSION4_COMBAT?.encounters || [])
  ];
  const STATS = {
    goblin: 'AC 15 · +4 attack · 1d6+2 · Hide/Disengage bonus action',
    wolf: 'AC 13 · bite +4, 2d4+2 · DC 11 STR or prone',
    bugbear: '2014 · AC 16 · morningstar +4, 2d8+2 · Surprise Attack +2d6 in round 1 when it surprises a target',
    hero: 'Use the live character sheet',
    custom: 'Set AC and a quick attack in Card',
    paladin: 'Dracuseth’s 2024 sheet · AC 18 · sword +3, 1d8+1 · Lay On Hands 20',
    sildar: 'Captive at 1 HP without armor or weapons · set AC from current gear before combat',
    'redbrand-ruffian': 'AC 14 · HP 16 · two shortsword attacks +4, 1d6+2 each',
    skeleton: 'AC 13 · HP 13 · shortsword +4, 1d6+2 · vulnerable to bludgeoning',
    nothic: 'AC 15 · HP 45 · two claws +4, 1d6+3 · Rotting Gaze DC 12 Con, 3d6 necrotic',
    'evil-mage': 'AC 13 with staff held (16 with mage armor) · HP 22 · spell DC 13, attack +5 · 4 first-level, 3 second-level slots',
    hobgoblin: 'AC 18 · HP 11 · longsword or longbow +3, 1d8+1 · Martial Advantage +2d6 once per turn',
    grick: 'AC 14 · HP 27 · tentacles +4, 2d6+2; hit permits beak +4, 1d6+2 · conditional weapon resistance',
    owlbear: 'AC 13 · HP 59 · beak +7, 1d10+5 and claws +7, 2d8+5',
    doppelganger: 'AC 14 · HP 52 · two slams +6, 1d6+4 each · shapechanger and surprise traits',
    orc: 'AC 13 · HP 15 · greataxe +5, 1d12+3 · Aggressive bonus action',
    ogre: 'AC 11 · HP 59 · greatclub +6, 2d8+4 · javelin +6, 2d6+4',
    zombie: 'AC 8 · HP 22 · slam +3, 1d6+1 · Undead Fortitude',
    'hamun-kost': 'AC 12 · HP 22 · Evil Mage spells, DC 13 and +5 spell attack · no staff of defense',
    'twig-blight': 'AC 13 · HP 4 · claws +3, 1d4+1 · vulnerable to fire',
    'ash-zombie': 'AC 8 · HP 22 · slam +3, 1d6+1 · Ash Puff first time damaged',
    'giant-spider': 'AC 14 · HP 26 · bite +5, 1d8+3 plus poison · web restrains',
    'young-green-dragon': 'AC 18 · HP 136 · bite +7 and two claws +7 · poison breath DC 16, 12d6',
    cultist: 'AC 12 · HP 9 · scimitar +3, 1d6+1'
  };
  const INIT_BONUSES = {
    'hero-trista': 4, 'hero-donavan': 2, 'hero-ringgo': 4, 'hero-pebble': 0, 'hero-aldric': 2,
    paladin: 1, sildar: 0, goblin: 2, wolf: 2, bugbear: 2, 'redbrand-ruffian': 2, skeleton: 2, nothic: 3, 'evil-mage': 2,
    hobgoblin: 1, grick: 2, owlbear: 1, doppelganger: 4, orc: 1, ogre: -1, zombie: -2, 'hamun-kost': 2,
    'twig-blight': 1, 'ash-zombie': -2, 'giant-spider': 3, 'young-green-dragon': 1, cultist: 1
  };
  const AC_DEFAULTS = { 'hero-trista': 14, 'hero-donavan': 12, 'hero-ringgo': 16, 'hero-pebble': 18, 'hero-aldric': 12,
    paladin: 18, sildar: null, goblin: 15, wolf: 13, bugbear: 16, 'redbrand-ruffian': 14, skeleton: 13, nothic: 15, 'evil-mage': 13,
    hobgoblin: 18, grick: 14, owlbear: 13, doppelganger: 14, orc: 13, ogre: 11, zombie: 8, 'hamun-kost': 12,
    'twig-blight': 13, 'ash-zombie': 8, 'giant-spider': 14, 'young-green-dragon': 18, cultist: 12 };
  const COMBAT_CARDS = {
    goblin: { note: 'Nimble Escape: Hide or Disengage as a bonus action.', attacks: [
      { name: 'Scimitar', bonus: 4, count: 1, sides: 6, modifier: 2, damage: 'slashing' },
      { name: 'Shortbow', bonus: 4, count: 1, sides: 6, modifier: 2, damage: 'piercing' }
    ] },
    wolf: { note: 'Keen Hearing and Smell grants advantage on relevant Perception checks. Pack Tactics grants advantage if an ally is within 5 feet of the target and that ally is not incapacitated. A creature hit by Bite makes a DC 11 Strength save or falls prone.', attacks: [
      { name: 'Bite', bonus: 4, count: 2, sides: 4, modifier: 2, damage: 'piercing' }
    ] },
    bugbear: { note: '2014: Brute adds the morningstar damage die. Surprise Attack adds 2d6 when the bugbear surprises a creature and hits it during the first round of combat.', attacks: [
      { name: 'Morningstar', bonus: 4, count: 2, sides: 8, modifier: 2, damage: 'piercing' },
      { name: 'Javelin · melee', bonus: 4, count: 2, sides: 6, modifier: 2, damage: 'piercing' },
      { name: 'Javelin · ranged', bonus: 4, count: 1, sides: 6, modifier: 2, damage: 'piercing' },
      { name: 'Surprise bonus', bonus: null, count: 2, sides: 6, modifier: 0, damage: 'extra damage' }
    ] },
    paladin: { note: 'Dracuseth’s 2024 character sheet: one attack per Attack action. Bless and Shield of Faith both require concentration. Lay On Hands: 20-point pool; Cure Wounds: 2d8+3.', attacks: [
      { name: 'Longsword', bonus: 3, count: 1, sides: 8, modifier: 1, damage: 'slashing · Sap' },
      { name: 'Sacred Weapon sword', bonus: 6, count: 1, sides: 8, modifier: 1, damage: 'slashing · Sap' },
      { name: 'Cure Wounds', bonus: null, count: 2, sides: 8, modifier: 3, damage: 'healing' },
      { name: 'Fire breath', bonus: null, count: 1, sides: 10, modifier: 0, damage: 'fire · DC 13 Dex' }
    ] },
    sildar: { note: 'Captive at 1 HP, without armor or weapons (Lost Mine of Phandelver pp. 10–11). Set AC and attacks from gear acquired in play.', attacks: [] },
    skeleton: { note: 'Vulnerable to bludgeoning; immune to poison damage and poisoned condition.', attacks: [
      { name: 'Shortsword', bonus: 4, count: 1, sides: 6, modifier: 2, damage: 'piercing' },
      { name: 'Shortbow', bonus: 4, count: 1, sides: 6, modifier: 2, damage: 'piercing' }
    ] },
    nothic: { note: 'Multiattack: two claws. Rotting Gaze is DC 12 Constitution save or 3d6 necrotic; Weird Insight is an Insight versus Deception contest.', attacks: [
      { name: 'Claw', bonus: 4, count: 1, sides: 6, modifier: 3, damage: 'slashing' },
      { name: 'Rotting Gaze', bonus: null, count: 3, sides: 6, modifier: 0, damage: 'necrotic' }
    ] },
    'evil-mage': { note: 'Iarno: spell save DC 13, attack +5. Slots: 4 first, 3 second. Magic missile 3 × (1d4+1) force; hold person requires concentration; misty step is a bonus action. Held staff of defense adds +1 AC; mage armor makes his total AC 16. Item entry casts shield as an action and costs 2 charges.', attacks: [
      { name: 'Quarterstaff', bonus: 1, count: 1, sides: 8, modifier: -1, damage: 'bludgeoning' },
      { name: 'Shocking grasp', bonus: 5, count: 1, sides: 8, modifier: 0, damage: 'lightning' }
    ] },
    'redbrand-ruffian': { note: 'Multiattack: two shortsword attacks with its action. If three of the four street ruffians fall, the last attempts to flee toward Tresendar Manor.', attacks: [
      { name: 'Shortsword', bonus: 4, count: 1, sides: 6, modifier: 2, damage: 'piercing' }
    ] },
    hobgoblin: { note: 'Martial Advantage: once per turn add 2d6 to a weapon hit if a non-incapacitated ally is within 5 feet of that target.', attacks: [
      { name: 'Longsword', bonus: 3, count: 1, sides: 8, modifier: 1, damage: 'slashing' },
      { name: 'Longbow', bonus: 3, count: 1, sides: 8, modifier: 1, damage: 'piercing' },
      { name: 'Martial Advantage', bonus: null, count: 2, sides: 6, modifier: 0, damage: 'extra damage' }
    ] },
    grick: { note: 'Tentacles first; only on a hit may it make one beak attack against that same target. Resistant to bludgeoning, piercing, and slashing from nonmagical attacks; apply that conditional resistance manually.', attacks: [
      { name: 'Tentacles', bonus: 4, count: 2, sides: 6, modifier: 2, damage: 'slashing' },
      { name: 'Beak · after tentacles hit', bonus: 4, count: 1, sides: 6, modifier: 2, damage: 'piercing' }
    ] },
    owlbear: { note: 'Multiattack: one beak and one claws attack. In the castle it can be distracted with fresh meat or released to flee.', attacks: [
      { name: 'Beak', bonus: 7, count: 1, sides: 10, modifier: 5, damage: 'piercing' },
      { name: 'Claws', bonus: 7, count: 2, sides: 8, modifier: 5, damage: 'slashing' }
    ] },
    doppelganger: { note: 'Multiattack: two slams. Shapechanger uses an action. Ambusher grants advantage against surprised targets in round 1; Surprise Attack adds 3d6 to a hit against a creature it surprised in round 1. Read Thoughts is an action and requires concentration.', attacks: [
      { name: 'Slam', bonus: 6, count: 1, sides: 6, modifier: 4, damage: 'bludgeoning' },
      { name: 'Surprise bonus', bonus: null, count: 3, sides: 6, modifier: 0, damage: 'extra damage' }
    ] },
    orc: { note: 'Aggressive: bonus action to move up to its speed toward a visible hostile creature.', attacks: [
      { name: 'Greataxe', bonus: 5, count: 1, sides: 12, modifier: 3, damage: 'slashing' },
      { name: 'Javelin', bonus: 5, count: 1, sides: 6, modifier: 3, damage: 'piercing' }
    ] },
    ogre: { note: 'Wyvern Tor Gog is an ogre. Its single heavy hit can drop a low-level PC.', attacks: [
      { name: 'Greatclub', bonus: 6, count: 2, sides: 8, modifier: 4, damage: 'bludgeoning' },
      { name: 'Javelin', bonus: 6, count: 2, sides: 6, modifier: 4, damage: 'piercing' }
    ] },
    zombie: { note: 'Undead Fortitude: when reduced to 0 HP, Constitution save DC 5 + damage taken; on success it stays at 1 HP. This does not apply to radiant damage or a critical hit.', attacks: [
      { name: 'Slam', bonus: 3, count: 1, sides: 6, modifier: 1, damage: 'bludgeoning' }
    ] },
    'hamun-kost': { note: 'Evil Mage base without Iarno’s staff. AC 12; spell save DC 13, spell attack +5; four 1st-level and three 2nd-level slots. Can call the zombies to halt while parleying.', attacks: [
      { name: 'Quarterstaff', bonus: 1, count: 1, sides: 8, modifier: -1, damage: 'bludgeoning' },
      { name: 'Shocking grasp', bonus: 5, count: 1, sides: 8, modifier: 0, damage: 'lightning' }
    ] },
    'young-green-dragon': { note: 'Venomfang: multiattack is one bite and two claws. Bite also deals 2d6 poison. Poison Breath recharges on 5–6 and affects a 30-foot cone; DC 16 Constitution save for half of 12d6 poison. At half HP, it flees. Extremely dangerous to this party.', attacks: [
      { name: 'Bite · piercing', bonus: 7, count: 2, sides: 10, modifier: 4, damage: 'piercing' },
      { name: 'Bite · poison extra', bonus: null, count: 2, sides: 6, modifier: 0, damage: 'poison' },
      { name: 'Claw', bonus: 7, count: 2, sides: 6, modifier: 4, damage: 'slashing' },
      { name: 'Poison Breath · DC 16 Con, half on save', bonus: null, count: 12, sides: 6, modifier: 0, damage: 'poison' }
    ] },
    'giant-spider': { note: 'Bite adds 2d8 poison, DC 11 Constitution save for half. Web +5 restrains; recharge 5–6. Escape uses an action, DC 12 Strength.', attacks: [
      { name: 'Bite · piercing', bonus: 5, count: 1, sides: 8, modifier: 3, damage: 'piercing' },
      { name: 'Bite · poison extra', bonus: null, count: 2, sides: 8, modifier: 0, damage: 'poison' }
    ] }
  };
  const CARD_SOURCES = {
    goblin: { label: '2014 SRD 5.1 · Goblin, p. 315', book: 'srd', page: 315 },
    wolf: { label: '2014 SRD 5.1 · Wolf, p. 393', book: 'srd', page: 393 },
    bugbear: { label: '2014 SRD 5.1 · Bugbear, p. 266', book: 'srd', page: 266 },
    skeleton: { label: '2014 Monster Manual · Skeleton, p. 272', book: 'mm', page: 272 },
    nothic: { label: 'Lost Mine of Phandelver · Nothic, p. 60', book: 'lmop', page: 60 },
    'evil-mage': { label: 'Lost Mine of Phandelver · Evil Mage, p. 57', book: 'lmop', page: 57 },
    'redbrand-ruffian': { label: 'Lost Mine of Phandelver · Redbrand Ruffian, p. 61', book: 'lmop', page: 61 },
    'twig-blight': { label: 'Lost Mine of Phandelver · Twig Blight, p. 63', book: 'lmop', page: 63 },
    'ash-zombie': { label: 'Lost Mine of Phandelver · Ash Zombies, p. 31; Zombie, p. 63', book: 'lmop', page: 31 },
    'giant-spider': { label: 'Lost Mine of Phandelver · Giant Spider, p. 58', book: 'lmop', page: 58 },
    'young-green-dragon': { label: 'Lost Mine of Phandelver · Young Green Dragon, p. 63', book: 'lmop', page: 63 },
    cultist: { label: 'Lost Mine of Phandelver · Cultist, p. 56', book: 'lmop', page: 56 },
    hobgoblin: { label: '2014 SRD 5.1 · Hobgoblin, p. 322', book: 'srd', page: 322 },
    grick: { label: '2014 SRD 5.1 · Grick, p. 318', book: 'srd', page: 318 },
    owlbear: { label: '2014 SRD 5.1 · Owlbear, pp. 339–340', book: 'srd', page: 339 },
    doppelganger: { label: '2014 SRD 5.1 · Doppelganger, pp. 279–280', book: 'srd', page: 279 },
    orc: { label: '2014 SRD 5.1 · Orc, p. 339', book: 'srd', page: 339 },
    ogre: { label: '2014 SRD 5.1 · Ogre, p. 336', book: 'srd', page: 336 },
    zombie: { label: '2014 SRD 5.1 · Zombie, pp. 356–357', book: 'srd', page: 356 },
    'hamun-kost': { label: 'Lost Mine of Phandelver · Old Owl Well, p. 29; Evil Mage, p. 57', book: 'lmop', page: 29 },
    sildar: { label: 'Lost Mine of Phandelver · captive, pp. 10–11', book: 'lmop', page: 10 },
    paladin: { label: 'Dracuseth’s 2024 character sheet · pp. 1–2', book: 'dracuseth', page: 1 },
    'hero-trista': { label: 'Trista’s original character sheet · p. 1', book: 'tristaSheet', page: 1 },
    'hero-ringgo': { label: 'Ringgo’s current character sheet · p. 1', book: 'ringgoSheet', page: 1 },
    'hero-donavan': { label: 'Donavan’s current character sheet · p. 1', book: 'donavanSheet', page: 1 },
    'hero-pebble': { label: 'Pebble player handout · pp. 3–4', book: 'pebble', page: 3 },
    'hero-aldric': { label: 'Aldric’s story handout · archived level 2 stats', book: 'aldric', page: 2 }
  };
  const HANDOUT_IMAGES = new Set(['', 'session-01-visuals/scene-01-gundren-departs.png',
    'session-01-visuals/scene-02-empty-horses.png', 'session-01-visuals/scene-03-cave-mouth.png',
    'session-01-visuals/scene-04-goblin-trail.png', 'session-01-visuals/scene-05-goblin-blind.png',
    'session-01-visuals/scene-06-kennel.png', 'session-01-visuals/scene-07-steep-passage.png',
    'session-01-visuals/scene-08-overpass.png', 'session-01-visuals/scene-09-goblin-den.png',
    'session-01-visuals/scene-10-twin-pools.png', 'session-01-visuals/scene-11-klargs-cave.png',
    'session-01-visuals/scene-12-road-ambush-reveal.png', 'session-01-visuals/scene-13-snare-discovered.png',
    'session-01-visuals/scene-14-pit-discovered.png', 'session-01-visuals/scene-15-phandalin-arrival.png',
    'session-01-visuals/scene-16-barthens-provisions.png',
    'assets/Echo-Below-Cover.png', 'assets/Nine-Sites-Watercolor.png',
    'assets/Waterdeep-City-Map.png', 'assets/Waterdeep-Cast-Watercolor.png',
    'town-maps/phandalin-overhead.svg', 'town-maps/conyberry-overhead.svg',
    'town-maps/thundertree-overhead.svg', 'town-maps/waterdeep-overhead.svg',
    'town-maps/professional/phandalin-overhead.png', 'town-maps/professional/conyberry-overhead.png',
    'town-maps/professional/thundertree-overhead.png', 'town-maps/professional/phandelver-region.png',
    ...(globalThis.LMOP_VISUAL_CATALOG || []).map(item => item.image),
    ...(globalThis.LMOP_BATTLE_MAP_CATALOG || []).map(item => item.image)]);

  function session2EnemyTokens(token) {
    const groups = [
      ['redbrand-street', 'redbrand-ruffian', 'Redbrand', 4, 16],
      ['hideout-barracks', 'redbrand-ruffian', 'Barracks ruffian', 3, 16],
      ['hideout-crypt', 'skeleton', 'Crypt skeleton', 3, 13],
      ['hideout-pens', 'redbrand-ruffian', 'Pen guard', 2, 16],
      ['hideout-crevasse', 'nothic', 'Nothic', 1, 45],
      ['hideout-bugbears', 'bugbear', 'Bugbear', 3, 27],
      ['hideout-common', 'redbrand-ruffian', 'Common room ruffian', 4, 16],
      ['hideout-glasstaff', 'evil-mage', 'Iarno Glasstaff', 1, 22]
    ];
    return groups.flatMap(([encounter, type, name, count, hp]) => Array.from({ length: count }, (_, index) => {
      const number = index + 1;
      const label = type === 'redbrand-ruffian' ? 'R' : type === 'bugbear' ? 'B' : type === 'skeleton' ? 'S' : type === 'nothic' ? 'N' : 'G';
      const id = encounter === 'redbrand-street' ? `s2-ruffian-${number}` : `s2-${encounter}-${number}`;
      const foe = token(id, `${name}${count > 1 ? ` ${number}` : ''}`, `${label}${count > 1 ? number : ''}`, type, 'enemy', hp, encounter);
      if (encounter === 'hideout-common') foe.conditions = ['Poisoned'];
      if (encounter === 'hideout-glasstaff') foe.ac = 16;
      return foe;
    }));
  }
  function session3EnemyTokens(token) {
    const groups = [
      ['tt-blights-1', 'twig-blight', 'Twig blight', 2, 4],
      ['tt-blights-2', 'twig-blight', 'Twig blight', 6, 4],
      ['tt-zombies-3', 'ash-zombie', 'Ash zombie', 4, 22],
      ['tt-blights-5', 'twig-blight', 'Twig blight', 8, 4],
      ['tt-spiders-6', 'giant-spider', 'Giant spider', 2, 26],
      ['tt-dragon-7', 'young-green-dragon', 'Venomfang', 1, 136],
      ['tt-zombies-8', 'ash-zombie', 'Ash zombie', 2, 22],
      ['tt-zombies-11', 'ash-zombie', 'Ash zombie', 5, 22],
      ['tt-blights-12', 'twig-blight', 'Twig blight', 6, 4],
      ['tt-cultists-13', 'cultist', 'Cultist', 6, 9],
      ['old-owl-well', 'zombie', 'Tower zombie', 12, 22],
      ['wyvern-tor', 'orc', 'Orc', 7, 15],
      ['castle-archers', 'goblin', 'Archer', 4, 7],
      ['castle-barracks', 'goblin', 'Barracks goblin', 3, 7],
      ['castle-hobgoblins', 'hobgoblin', 'Barracks hobgoblin', 4, 11],
      ['castle-banquet', 'goblin', 'Banquet goblin', 7, 7],
      ['castle-grick', 'grick', 'Grick', 1, 27],
      ['castle-shrine', 'goblin', 'Shrine goblin', 2, 7],
      ['castle-guards', 'hobgoblin', 'King’s guard', 2, 11],
      ['castle-owlbear', 'owlbear', 'Owlbear', 1, 59],
      ['castle-warband', 'hobgoblin', 'Returning hobgoblin', 2, 11],
      ['castle-warband', 'wolf', 'Warband wolf', 2, 11]
    ];
    const list = groups.flatMap(([encounter, type, name, count, hp]) => Array.from({ length: count }, (_, index) => {
      const number = index + 1;
      const foe = token(`s3-${encounter}-${type}-${number}`, `${name}${count > 1 ? ` ${number}` : ''}`,
        `${type === 'goblin' ? 'G' : type === 'hobgoblin' ? 'H' : type === 'wolf' ? 'W' : type === 'grick' ? 'Gr' : type === 'zombie' ? 'Z' : 'O'}${count > 1 ? number : ''}`,
        type, 'enemy', hp, encounter);
      if (encounter === 'tt-cultists-13' && number === 1) { foe.name = 'Favric'; foe.label = 'FV'; }
      return foe;
    }));
    for (const [id, name, label, type, hp, encounter] of [
      ['s3-hamun', 'Hamun Kost', 'HK', 'hamun-kost', 22, 'old-owl-well'],
      ['s3-brughor', 'Brughor Axe-Biter', 'BA', 'orc', 30, 'wyvern-tor'],
      ['s3-gog', 'Gog', 'GO', 'ogre', 59, 'wyvern-tor'],
      ['s3-yegg', 'Yegg', 'YG', 'goblin', 12, 'castle-banquet'],
      ['s3-lhupo', 'Lhupo', 'LH', 'goblin', 12, 'castle-shrine'],
      ['s3-grol', 'King Grol', 'KG', 'bugbear', 45, 'castle-king'],
      ['s3-snarl', 'Snarl', 'SN', 'wolf', 18, 'castle-king'],
      ['s3-vyerith', 'Drow emissary', 'DE', 'doppelganger', 52, 'castle-king'],
      ['s3-targor', 'Targor Bloodsword', 'TG', 'hobgoblin', 20, 'castle-warband']])
      list.push(token(id, name, label, type, 'enemy', hp, encounter));
    return list;
  }

  function defaultTokens(token) {
    const list = [
      token('pc-trista', 'Trista', 'T', 'hero-trista', 'pc', 11),
      token('pc-donavan', 'Donavan', 'D', 'hero-donavan', 'pc', 17),
      token('pc-ringgo', 'Ringgo', 'R', 'hero-ringgo', 'pc', 17),
      token('pc-pebble', 'Pebble', 'P', 'hero-pebble', 'pc', 12),
      token('pc-aldric', 'Aldric', 'A', 'hero-aldric', 'pc', 18),
      token('ally-sildar', 'Sildar', 'S', 'sildar', 'ally', 27)
    ];
    list[4].hp = 9;
    list[5].hp = 1;
    let goblin = 1;
    let wolf = 1;
    const addGoblins = (encounter, count) => {
      for (let i = 0; i < count; i++) {
        const number = goblin++;
        list.push(token(`goblin-${number}`, `Goblin ${number}`, `G${number}`, 'goblin', 'enemy', 7, encounter));
      }
    };
    const addWolves = (encounter, count) => {
      for (let i = 0; i < count; i++) {
        const number = wolf++;
        list.push(token(`wolf-${number}`, `Wolf ${number}`, `W${number}`, 'wolf', 'enemy', 11, encounter));
      }
    };
    addGoblins('road', 4);
    addGoblins('blind', 2);
    addWolves('kennel', 3);
    addGoblins('overpass', 1);
    list.push(token('yeemik', 'Yeemik', 'Y', 'goblin', 'enemy', 12, 'den'));
    addGoblins('den', 5);
    addGoblins('pools', 3);
    list.push(token('klarg', 'Klarg', 'K', 'bugbear', 'enemy', 27, 'klarg'));
    list.push(token('ripper', 'Ripper', 'W4', 'wolf', 'enemy', 11, 'klarg'));
    addGoblins('klarg', 2);
    return list;
  }

  globalThis.ECHO_TABLE_CONTENT={SCENES,RUNBOOK,RUNBOOK_IDS,SCENE_NOTES,ENCOUNTERS,STATS,INIT_BONUSES,AC_DEFAULTS,COMBAT_CARDS,CARD_SOURCES,HANDOUT_IMAGES,session2EnemyTokens,session3EnemyTokens,defaultTokens};
})();

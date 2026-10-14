(() => {
  'use strict';
  const cut = (v, max = 1000) => String(v ?? '').slice(0, max);
  const num = (v, min = 0, max = 999999) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.round(Number(v)))) : min;
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const NPC_SEED = [
    ['durnan','Durnan','BOOK NPC · campaign relationships are custom','Yawning Portal','Dry, practical: “Tell someone when you expect to be back.”','People who leave through the well'],
    ['selise','Selise Ardent','ECHO BELOW · Waterdeep Hub','Second Margin','Precise and delighted by good questions: “What would prove it wrong?”','Careful proof and her students'],
    ['mara','Mara Vey','ECHO BELOW · established character; hub details custom','Red Sash / Blue Lantern Quay','Playful, incisive: “You give it away. I call that skipping the best part.”','Agency, profit, and her bond with Trista'],
    ['orren','Orren Brassmantle','ECHO BELOW · Waterdeep Hub','Ninepin Works','Patient and tactile: “Why someone made it is a different invoice.”','Consent before destructive testing'],
    ['ilvara','Ilvara Reed','Harpers are BOOK; Ilvara and local work are custom','Reed & Ledger','Careful and discreet; asks who could be harmed by disclosure.','Sources, civilians, responsible disclosure'],
    ['kestrel','Kestrel Dane','ECHO BELOW · Waterdeep Hub','Gilded Compass / Yawning Portal','Competitive expedition captain; wants her crew credited.','Recognition and her crew'],
    ['anja','Sister Anja Vale','ECHO BELOW · Waterdeep Hub','Lantern House','Compassionate, firm; argues from the cost of failed experiments.','The people nearest a failed experiment'],
    ['vess','Captain Rusk Vess','ECHO BELOW · Waterdeep Hub','Blue Lantern Quay','Practical maritime planner; asks who comes back and how.','Honest rescue plans and sailors’ lives'],
    ['dracuseth','Dracuseth Maw of Flames','ECHO BELOW · Waterdeep contact','Yawning Portal / Lantern House','Warm and plainspoken: “I can hold the door. You decide where we go.”','Protect ordinary people while leaving the party its own choices']
  ];
  const SITE_SEED = [
    ['undermountain','Undermountain — The Prime Echo','Beneath Waterdeep','active','BOOK dungeon · ECHO BELOW resonance overlay'],
    ['forge','Wave Echo Cave — The Forge','Near Phandalin','active','BOOK mine · ECHO BELOW site interpretation'],
    ['library','The Silent Library','Beneath Second Margin, Waterdeep','dormant','ECHO BELOW custom site'],
    ['observatory','The Drowned Observatory','Off the Sword Coast','unstable','ECHO BELOW custom site'],
    ['scar','The Dead God’s Scar','Wilderness outside Waterdeep','corrupted','ECHO BELOW custom site'],
    ['door','The Frozen Door','Far north','sealed','ECHO BELOW custom site'],
    ['tower','The Walking Tower','Moving across Faerûn','mobile','ECHO BELOW custom site'],
    ['star','The Broken Star','Not entirely on the Material Plane','extremely unstable','ECHO BELOW custom site'],
    ['mountain','The Hollow Mountain','Location deliberately open','unknown','ECHO BELOW custom site · location follows play']
  ];
  const FLOOR_NAMES = ['Dungeon Level','Arcane Chambers','Sargauth Level','Twisted Caverns','Wyllowwood','Lost Level',"Maddgoth’s Castle",'Slitherswamp','Dweomercore',"Muiral’s Gauntlet",'Troglodyte Warrens','Maze Level',"Trobriand’s Graveyard",'Arcturiadoom','Obstacle Course','Crystal Labyrinth / Stardock','Seadeeps','Vanrakdoom','Caverns of Ooze','Runestone Caverns','Terminus Level','Shadowdusk Hold',"Mad Wizard’s Lair"];
  const FLOOR_OVERLAYS = [
    'A stronger paired response near the knot. Several witnesses can observe it.',
    'A damaged radial diagram reads RESONANCE OBSERVED; it proves prior research, not a complete theory.',
    'Someone recognizes the symbol but does not explain it. This is a lead, not complete knowledge.',
    'One moved doorway or oddly personal message suggests observation.',
    'A pause in Echo exposition; let local relationships and character choices lead.',
    'Old records show the phenomenon predates Halaster. He found it; he did not create it.',
    'A valuable object tests Trista’s choice without forcing an outcome.',
    'Halaster briefly recognizes the party’s connection to Phandalin.',
    'Name the knot in the Weave; keep competing theories marked as theories.',
    'Fragments describe Halaster searching for responsive places beyond Undermountain.',
    'No major Echo revelation required; follow the local dungeon conflict.',
    'An impossible response raises a question; the medallion is not a route finder.',
    'Reveal PROJECT LOOKING GLASS as incomplete; its purpose remains unknown here.',
    'Discover Looking Glass was abandoned; the reason remains open.',
    'Patterns suggest Halaster measures reactions; do not recast every trap as Echo machinery.',
    'The medallion stops responding at a distance and pulses on return; do not infer a universal rule.',
    'Bring back actual allies, spared enemies, and faction consequences.',
    'Evidence shows interaction with planar boundaries.',
    'Give cosmology a rest and let survival and character ties matter.',
    'Research establishes Looking Glass was designed to amplify resonance.',
    'Compare conflicting predictions; record them as theories.',
    'A warning about opening something is limited by its speaker’s agenda.',
    'Resolve the party’s choices about the Nine and Looking Glass alongside the published finale.'
  ];
  // Printed chapter, map, and aftermath pages were checked against the local text-layer PDF.
  // Later floor maps remain book links until each image has been reviewed for player display.
  const FLOOR_PAGES = [13,27,43,59,69,81,95,109,117,135,151,159,171,179,193,209,221,231,243,253,265,277,289];
  const FLOOR_AFTERMATH = [26,42,58,68,80,94,108,116,134,150,158,170,178,192,208,220,230,242,252,264,276,288,302];
  const FLOOR_LEVELS = [5,6,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,'17–20'];
  const FLOOR_MAPS = [15,29,45];
  const FLOOR_PREP = {
    1: { rooms: [{ name: '1 · Entrywell', page: 14 }, { name: '6 · Undertakers watch post', page: 17 },
      { name: '23 · Xanathar watch post', page: 21 }, { name: '28 · Xanathar watch post', page: 23 },
      { name: '39 · Xanathar watch post', page: 25 }],
      factions: 'Undertakers extort visitors; Uktarl and Harria struggle for control. Xanathar bugbears and goblins watch and maneuver against them.',
      wandering: 'Carrion crawlers, goblin skull-hunters, or a confused shield guardian (printed p. 14).',
      bargains: 'Pay, refuse, expose the Undertakers’ disguise, or play the factions against each other.',
      hazards: 'Check each keyed room and the dungeon features on printed p. 10 before applying traps or gates.',
      rewards: 'Use keyed treasure only; record who takes it.', echo: FLOOR_OVERLAYS[0] },
    2: { rooms: [{ name: '1 · Rustbone goblin bazaar', page: 28 }, { name: '9 · Northern watch post', page: 31 },
      { name: '14 · Wererat hideout', page: 36 }, { name: '20 · Southern watch post', page: 38 }],
      factions: 'Rustbone traders resist Xanathar control. Shunn and Nadia lead rival watch posts; Rizzeryl and his wererats hold a stolen gate key.',
      wandering: 'Carrion crawlers, gricks, mephits, owlbears, and spectators (printed p. 28).',
      bargains: 'Trade at the bazaar, deal over Yek’s circlet, or negotiate over the stolen key.',
      hazards: 'Sentient experiments and magic remain local to their keyed rooms; check the book before use.',
      rewards: 'Use keyed treasure and any negotiated payment; do not assume the gate key opens this floor.', echo: FLOOR_OVERLAYS[1] },
    3: { rooms: [{ name: 'House Auvryndar', page: 43 }, { name: 'Legion of Azrok', page: 43 },
      { name: 'Skullport route', page: 44 }],
      factions: 'House Auvryndar and Azrok’s legion contest Stromkuhldur; Xanathar agents seek to worsen the conflict.',
      wandering: 'Use the Sargauth wandering guidance on the chapter pages.',
      bargains: 'Lurkana seeks Azrok’s stolen dagger; Skullport offers leads and danger beyond the floor.',
      hazards: 'River travel, drow defenses, and local gates depend on the keyed book text.',
      rewards: 'Track Lurkana’s offer separately from treasure in keyed rooms.', echo: FLOOR_OVERLAYS[2] }
  };
  const PHANDELVER_PACKS = [
    { id: 'phandalin', name: 'Phandalin and its people', page: 14, end: 19, visual:'phandalin-art',
      say: 'The track opens onto a small frontier town built beside older ruins. People are working, trading, and watching the road for news.',
      objective: 'Deliver the wagon, learn what happened to Gundren, and choose whom to trust.',
      people: 'Barthen expects supplies; Sildar seeks information. Elmar, Toblen, Harbin, Halia, Daran, Qelline, and Sister Garaele have different interests.',
      scenes: [['Arrival and town choices',14],['Stonehill Inn and rumors',15],['Barthen’s Provisions',16],
        ['Lionshield Coster',16],['Miner’s Exchange and Halia',17],['Alderleaf Farm',18],
        ['Shrine of Luck',18],['Townmaster’s Hall',18],['Redbrand confrontation',19]], mapPage:17, verifiedRooms:true,
      enemies: 'Four Redbrand ruffians confront the party only when the town conflict reaches that point; use the appendix B card, printed p. 61.',
      encounters: [{name:'Redbrand confrontation',page:19,start:'Four ruffians linger at the Sleeping Giant porch or confront the party in town after the pressure has built.',
        creatures:'4 × Redbrand Ruffian · appendix B p. 61',trigger:'Only when the characters engage the gang or the gang comes to provoke them.',
        exits:'When three fall, the last tries to flee toward Tresendar Manor. A captured ruffian can confirm the Redbrands abducted Gundren, but does not know his destination.',
        environment:'Street, porch, buildings, and bystanders; ask where each character stands before initiative.'}],
      treasure: 'Wagon payment and any quest rewards are determined by the named NPC entries.',
      rules:[['Social interaction','dmg',244],['Downtime','dmg',127],['Treasure','dmg',133]],
      exits: 'Redbrand trouble, Spider’s Web leads, or a lead toward Cragmaw Castle.',
      echo: 'Optional: an Archive question can surface through Donavan. Do not replace a town NPC’s published motive.' },
    { id: 'redbrand', name: 'Redbrand Hideout', page: 20, end: 26,
      say: 'The old manor has become a guarded base. The gang’s rule over town has consequences for people nearby.',
      objective: 'Confront or bypass the gang, protect captives, and investigate the Redbrands’ capture of Gundren.',
      people: 'Glasstaff’s position, the Redbrands’ fear, the Nothic, and the captives create distinct choices.',
      scenes: [['1 · Cellar',20],['2 · Barracks',20],['3 · Trapped hall',21],['4 · Tresendar crypts',22],
        ['5 · Slave pens',22],['6 · Armory',22],['7 · Storeroom',22],['8 · Crevasse and Nothic',23],
        ['9 · Guard barracks',24],['10 · Common room',24],['11 · Wizard’s workshop',25],
        ['12 · Glasstaff’s quarters',25],['Aftermath',26]], mapPage:21, verifiedRooms:true,
      enemies: 'Use Lost Mine appendix B for Redbrand Ruffians, Nothic, bugbears, and the keyed room for each group.',
      encounters: [{name:'2 · Barracks',page:21,start:'Three ruffians rest in the room; noise from area 1 can let them prepare.',
        creatures:'3 × Redbrand Ruffian · appendix B p. 61',trigger:'Enter or alert the barracks.',exits:'Retreat or capture remain possible.',environment:'Beds, barrels, and nearby doors.'},
        {name:'5 · Slave pens',page:22,start:'Two ruffians guard Mirna, Nars, and Nilsa behind cell doors.',
          creatures:'2 × Redbrand Ruffian · appendix B p. 61; three captives are noncombatants',trigger:'The guards notice intruders or hear the crypts.',
          exits:'Rescue the family and follow their Thundertree lead.',environment:'Locked cells and vulnerable captives.'},
        {name:'8 · Crevasse',page:23,start:'The Nothic lurks near the bridges and can speak before fighting.',
          creatures:'1 × Nothic · appendix B p. 60',trigger:'A bargain fails or either side attacks.',
          exits:'Trade food or information, bypass, retreat, or fight.',environment:'Two bridges, deep fissure, and hidden treasure.'},
        {name:'9 · Guard barracks',page:24,start:'Three bugbears lounge here; Droop the goblin is present and frightened.',
          creatures:'3 × Bugbear · appendix B p. 56; Droop is not an automatic enemy',trigger:'The group is discovered or challenged.',
          exits:'Deception or parley can redirect the bugbears; Droop may reveal the hideout layout.',environment:'Barracks and doorway.'},
        {name:'10 · Common room',page:24,start:'Four ruffians are drinking and playing knucklebones.',
          creatures:'4 × Redbrand Ruffian · appendix B p. 61',trigger:'They recognize or challenge visitors; disguise may delay combat.',
          exits:'Leave, bluff, capture, or fight.',environment:'Tables, drink, game, and adjoining rooms.'},
        {name:'12 · Glasstaff’s quarters',page:25,start:'Iarno may be warned by his rat in area 11 and flee by the secret exit.',
          creatures:'Iarno · use keyed room and appendix B Evil Mage with his named equipment; verify before combat',
          trigger:'The party approaches or surprises him.',exits:'Capture, pursuit, escape, and Sildar’s response all have consequences.',
          environment:'Workshop warning, secret door, and potion of invisibility.'}],
      treasure: 'Record keyed loot and evidence of the Black Spider; do not pre-award room treasure. Custom campaign clue: Iarno’s separate transfer record names Gundren and Cragmaw Castle.',
      rules:[['Stealth','phb',177],['Traps','dmg',120],['Social interaction','dmg',244],['Improvised damage','dmg',249]],
      exits: 'Return to Phandalin; pursue a Spider’s Web lead; retreat and revisit.',
      echo: 'Optional: a private resonance trace may be found only after the local conflict resolves.' },
    { id: 'spiders-web', name: 'The Spider’s Web · branching leads', page: 27, end: 34,
      say: 'Several leads point away from town. The party chooses which promise, rumor, or threat matters first.',
      objective: 'Follow chosen leads for allies, information, and the route toward Gundren and the mine.',
      people: 'Agatha, Hamun Kost, the orcs, and Thundertree’s residents have separate interests; keep their quests optional.',
      scenes: [['Branch overview',27],['Conyberry and Agatha',28],['Old Owl Well',29],['Wyvern Tor',30],['Thundertree',30]], mapPage:31,
      enemies: 'Use the exact location entry and its source creature; no lead is an automatic combat.',
      treasure: 'Keep each lead’s reward with its own location.',
      rules:[['Travel','phb',181],['Ability checks','phb',174]],
      exits: 'Return to town, travel to Cragmaw Castle, or pursue another lead.',
      echo: 'Optional: one observed clue can point toward the Nine without explaining the published quest.' },
    { id: 'cragmaw-castle', name: 'Cragmaw Castle', page: 35, end: 41,
      say: 'A ruined stronghold holds competing interests around a missing dwarf and the route to the mine.',
      objective: 'Find Gundren and the map; resolve King Grol’s bargain and the other occupant’s agenda.',
      people: 'King Grol, his goblinoids, and the disguised agent should keep their own motives.',
      scenes: [['Castle approach and map',35],['Keyed castle rooms',36],['Gundren and Grol',39]], mapPage:37,
      enemies: 'Link each group to its keyed room; use MM or appendix statistics only after checking the exact creature.',
      treasure: 'Track Gundren’s map and keyed treasure separately.',
      rules:[['Stealth','phb',177],['Cover','phb',196]],
      exits: 'Wave Echo Cave if its route is secured; return to town or withdraw.',
      echo: 'Optional: the map may prompt a private Echo question; its published purpose remains finding the mine.' },
    { id: 'wave-echo', name: 'Wave Echo Cave', page: 42, end: 51, verifiedRooms:true,
      say: 'The old mine carries the sound of distant water. Its rooms hold both the immediate danger and a larger history.',
      objective: 'Find the missing Rockseeker, face the Black Spider’s operation, and decide the mine’s future.',
      people: 'Nezznar, Nundro, the undead, and any survivors have different stakes.',
      scenes: [['General features and wandering encounters',42],['Marked DM map',43],['1 · Cave Entrance',44],['2 · Mine Tunnels',44],['3 · Old Entrance',44],['4 · Old Guardroom',44],['5 · Assayers’ Office',45],['6 · South Barracks',45],['7 · Ruined Storeroom',45],['8 · Fungi Cavern',45],['9 · Great Cavern',46],['10 · Dark Pool',46],['11 · North Barracks',46],['12 · Smelter Cavern',46],['13 · Starry Cavern',47],['14 · Wizards’ Quarters',47],['15 · Forge of Spells',48],['16 · Booming Cavern',48],['17 · Old Streambed',49],['18 · Collapsed Cavern',49],['19 · Temple of Dumathoin',49],['20 · Priests’ Quarters',50],['Conclusion and mine profit offer',51]], mapPage:43,
      enemies: 'Session 4 has 12 linked encounters with source-labeled creature cards. Choose a room from its runbook and stage the encounter. Preserve actual survivors when returning or bringing reinforcements.',
      treasure: 'Room cards include keyed treasure. Record items and carriers in the Wave Echo journal and party inventory after discovery; Forge enchantments are temporary.',
      rules:[['Light and vision','phb',183],['Movement','phb',190],['Traps','dmg',120]],
      exits: 'Return to Phandalin; report discoveries; leave unresolved rooms for later.',
      echo: 'Optional custom Echo Below material: record a resonance observation separately from its explanation. The Forge’s published magic is not proof that it caused the Echo. Keep the established Nine unchanged and leave Nezznar independent of Halaster.' }
  ];
  const CRAGMAW_PAGES = { ambush:6, aftermath:7, trail:7, cave:8, blind:8,
    kennel:8, passage:9, bridge:10, den:10, pools:11, klarg:12, sildar:11,
    's2-arrival':14, 's2-barthen':16, 's2-sildar':18, 's2-inn':15,
    's2-town':16, 's2-redbrands':19, 's2-manor':20, 's2-cellar':20,
    's2-barracks':21, 's2-trap':21, 's2-crypt':22, 's2-pens':22,
    's2-armory':22, 's2-crevasse':23, 's2-bugbears':24, 's2-common':24,
    's2-workshop':25, 's2-glasstaff':25,
    's3-choice':27, 's3-travel':27, 's3-agatha':28, 's3-old-owl':29, 's3-old-owl-fight':29,
    's3-wyvern':35, 's3-wyvern-fight':35,
    's3-thundertree':30, 's3-castle-sight':35, 's3-castle-enter':37,
    's3-tt-1':30, 's3-tt-2':30, 's3-tt-3':31, 's3-tt-4':31, 's3-tt-5':32,
    's3-tt-6':32, 's3-tt-7':33, 's3-tt-8':33, 's3-tt-9':33,
    's3-tt-10':34, 's3-tt-11':34, 's3-tt-12':34, 's3-tt-13':34,
    's3-area1':36, 's3-area2':36, 's3-area4':37, 's3-area5':37, 's3-area6':38,
    's3-area7':38, 's3-area8':38, 's3-area9':39, 's3-area10':39, 's3-area11':39,
    's3-area12':40, 's3-area13':40, 's3-area14':40, 's3-warband':41, 's3-close':41 };
  const LIVE_RULES = {
    ambush:[['Stealth and surprise','phb',189],['Cover','phb',196]],
    trail:[['Travel and tracking','phb',181],['Traps','dmg',120]],
    cave:[['Light and vision','phb',183],['Searching','phb',178]],
    blind:[['Stealth','phb',177],['Cover','phb',196]],
    kennel:[['Ability checks','phb',174]],
    passage:[['Light and vision','phb',183],['Difficult terrain','phb',190]],
    bridge:[['Cover','phb',196],['Improvised damage','dmg',249]],
    den:[['Social interaction','dmg',244],['Death saves','phb',197]],
    pools:[['Underwater combat','phb',198],['Improvised damage','dmg',249]],
    klarg:[['Surprise','phb',189],['Cover','phb',196]],
    's2-barthen':[['Social interaction','dmg',244]],
    's2-inn':[['Social interaction','dmg',244]],
    's2-redbrands':[['Cover','phb',196],['Opportunity attacks','phb',195]],
    's2-trap':[['Traps','dmg',120],['Falling','phb',183]],
    's2-crevasse':[['Falling','phb',183],['Difficult terrain','phb',190]],
    's2-glasstaff':[['Spellcasting','phb',201],['Concentration','phb',203]],
    's3-travel':[['Travel and tracking','phb',181],['Resting','phb',186]],
    's3-agatha':[['Ability checks','phb',174],['Social interaction','dmg',244]],
    's3-castle-sight':[['Stealth','phb',177],['Cover','phb',196]],
    's3-area1':[['Cover','phb',196],['Surprise','phb',189]],
    's3-area2':[['Traps','dmg',120],['Falling','phb',183]],
    's3-area8':[['Visibility','phb',183],['Surprise','phb',189]],
    's3-area14':[['Death saves','phb',197],['Cover','phb',196]]
  };
  const ELDER_RUNES = [
    ['Ana Rath','Failed Constitution save prevents healing until the curse is removed.','24-hour protection from several conditions and automatic stabilization.'],
    ['Angras','Failed Constitution save gives damage vulnerability and a death-save penalty for 24 hours.','Turn one successful attack into a critical hit.'],
    ['Halaster','Constitution save against heavy force damage, half on success.','Recover spell slots through level 6, or gain a temporary damage-resistant shield.'],
    ['Korombos','Failed Wisdom save causes a one-minute confusion effect.','Reroll damage dice once and use the new result.'],
    ['Laebos','Dexterity save against heavy fire damage, half on success.','Ten d6 fire-damage pool for weapon hits, at most two dice per hit.'],
    ['Lammath','No advantage on attacks, checks, or saves for 24 hours.','Use a reaction once to reduce damage by 10d6.'],
    ['Nchasme','Failed Wisdom save causes one hour of incapacitation and a temporary contrary flaw.','Cast augury three times as an action without components.'],
    ['Savaros','Nonmagical coins and gems carried by the target vanish.','Summon a goblin servant until it drops to 0 HP.'],
    ['Ullathar','Failed Wisdom save restrains the target for 24 hours.','For 24 hours gain freedom of movement and cast knock at will.']
  ];
  const PLACES = [
    ['portal','Yawning Portal','Food, rooms, messages, and access to Undermountain. Durnan asks when the party expects to return.'],
    ['margin','Second Margin','Selise’s research bookshop; the Silent Library is a separate site below it.'],
    ['ninepin','Ninepin Works','Orren’s careful repair and instrument shop.'],
    ['quay','Blue Lantern Quay','Travel, maritime knowledge, and Vess’s contacts.'],
    ['sash','Red Sash','Mara’s custom Dock Ward base.'],
    ['ledger','Reed & Ledger','Ilvara’s copying-house office.'],
    ['lantern','Lantern House','Care, affected people, and Anja’s arguments.'],
    ['starcup','Starcup Roof','A quiet meeting and observation place.']
  ];
  const clean = (raw, shape) => Object.fromEntries(Object.entries(shape).map(([key, max]) => [key, cut(raw?.[key], max)]));
  const list = (raw, limit, mapper, seed = []) => Array.isArray(raw) ? raw.slice(0, limit).map(mapper) : seed.map(x => mapper(x));
  function normalize(raw = {}) {
    raw ||= {};
    const npcSeed = NPC_SEED.map(([id,name,source,base,voice,goal]) => ({ id,name,source,base,voice,goal,attitude:'distant',lastInteraction:'',promisedHelp:'',nextMove:'',
      notes:id === 'dracuseth' ? 'Based in Waterdeep. Not traveling with the Session 1 party. Does not know the Echo mystery in advance.' : '',
      portrait:id === 'dracuseth' ? 'assets/Dracuseth-Maw-of-Flames.png' : '' }));
    const siteSeed = SITE_SEED.map(([id,name,location,condition,source], index) => ({ id,number:index+1,name,location,startingCondition:condition,state:'unexamined',source,people:'',evidence:'',custody:'',nextConsequence:'',notes:'' }));
    const floorSeed = FLOOR_NAMES.map((name, index) => ({ number:index+1,name,status:'unvisited',routes:'',factions:'',rooms:'',bookNote:'Consult Dungeon of the Mad Mage for map, inhabitants, and keyed rooms.',echoOverlay:FLOOR_OVERLAYS[index],echoNotes:'',source:'BOOK floor · ECHO BELOW overlay' }));
    const result = {
      commandRevision: Number.isSafeInteger(raw.commandRevision) && raw.commandRevision >= 0 ? raw.commandRevision : 0,
      reconciliation: globalThis.ECHO_RECONCILIATION?.normalize(raw.reconciliation) || {version:1,enabled:false,head:'',at:''},
      clueEvents: Array.isArray(raw.clueEvents) ? raw.clueEvents.slice(-30).filter(e=>e&&typeof e.id==='string').map(e=>({id:cut(e.id,80),title:cut(e.title,120),before:e.before===true,after:e.after===true,at:cut(e.at,40)})) : [],
      continuity: globalThis.ECHO_CONTINUITY?.normalize(raw.continuity) || null,
      characterStories: globalThis.ECHO_SPOTLIGHTS?.normalize(raw.characterStories) || null,
      questPrep: globalThis.ECHO_QUEST_PREP?.normalize(raw.questPrep) || raw.questPrep || null,
      transition: globalThis.ECHO_TRANSITION?.normalize(raw.transition) || raw.transition || null,
      courtyard: globalThis.ECHO_COURTYARD?.normalize(raw.courtyard) || raw.courtyard || null,
      downtime: globalThis.ECHO_DOWNTIME?.normalize(raw.downtime) || raw.downtime || null,
      mystery: globalThis.ECHO_MYSTERY?.normalize(raw.mystery) || raw.mystery || null,
      finale: globalThis.ECHO_FINALE?.normalize(raw.finale) || raw.finale || null,
      assets: {}, sessionPlans: {},
      adventureProgress: Object.fromEntries(PHANDELVER_PACKS.map(pack => [pack.id,
        ['ready','in-progress','complete'].includes(raw.adventureProgress?.[pack.id]) ? raw.adventureProgress[pack.id] : 'ready'])),
      routes: (Array.isArray(raw.routes) ? raw.routes : [
        { id:'well-1', from:'Yawning Portal', to:'Level 1 · entrywell', kind:'well', status:'possible', sourcePage:7, restriction:'Durnan operates the well; check the printed adventure page for cost and descent.' },
        { id:'stairs-1-2', from:'Level 1', to:'Level 2', kind:'stairs', status:'possible', sourcePage:26, restriction:'Confirm the specific stair and direction in its keyed room.' },
        { id:'stairs-2-3', from:'Level 2', to:'Level 3', kind:'stairs', status:'possible', sourcePage:42, restriction:'Confirm the specific stair and direction in its keyed room.' },
        { id:'sargauth-skullport', from:'Level 3 · Sargauth', to:'Skullport', kind:'river/tunnel', status:'possible', sourcePage:43, restriction:'Use the river or tunnels described in the level and Skullport chapter.' }
      ]).slice(0,100).filter(r => r && r.id).map(r => ({ ...clean(r,{id:80,from:100,to:100,kind:40,restriction:500}),
        status:['possible','discovered','closed'].includes(r.status)?r.status:'possible', sourcePage:num(r.sourcePage,1,319) })),
      sourceHandouts: Object.fromEntries(Object.entries(raw.sourceHandouts || {}).slice(0,100)
        .filter(([id,value]) => /^[A-Za-z0-9_-]{1,80}$/.test(id) && value && typeof value === 'object')
        .map(([id,value]) => [id, { text:cut(value.text,3500), whoKnows:cut(value.whoKnows,600),
          status:['Open','Claimed','Inferred','Observed'].includes(value.status)?value.status:'Open',
          shown:value.shown===true }])),
      evidence: list(raw.evidence, 500, e => ({ ...clean(e,{ id:80,title:120,detail:2500,whoKnows:600,playerSaw:1000,source:250,sessionId:80 }), status:['Observed','Inferred','Claimed','Open'].includes(e?.status)?e.status:'Open', published:e?.published===true })),
      journal: list(raw.journal, 500, e => ({ ...clean(e,{ id:80,title:120,text:2500,kind:60,when:100,source:250 }), published:e?.published===true })),
      npcs: list(raw.npcs, 200, n => ({ ...clean(n,{ id:80,name:100,source:250,base:120,voice:600,goal:600,lastInteraction:1200,promisedHelp:800,nextMove:800,notes:2000,portrait:100 }), attitude:['distant','known','trusted','strained','opposed'].includes(n?.attitude)?n.attitude:'distant' }), npcSeed),
      waterdeep: { places: list(raw.waterdeep?.places, 100, p => clean(p,{ id:80,name:100,summary:800,welcome:600,change:600,notes:1200 }), PLACES.map(([id,name,summary])=>({id,name,summary,welcome:'',change:'',notes:''}))),
        factions: list(raw.waterdeep?.factions, 100, f => clean(f,{ id:80,name:100,stance:800,goal:800,nextMove:800,notes:1200 }), [
          {id:'harpers',name:'Harpers',stance:'Ilvara’s local work is custom.',goal:'Protect sources and civilians.',nextMove:'',notes:''},
          {id:'still-hand',name:'Still Hand',stance:'Cautious about tuning; Anja’s care is sincere.',goal:'Isolate or sever the network.',nextMove:'',notes:''},
          {id:'gilded-compass',name:'Gilded Compass',stance:'Kestrel’s expedition crew.',goal:'Recognition and safe returns.',nextMove:'',notes:''}]),
        leads: list(raw.waterdeep?.leads, 200, l => ({ ...clean(l,{id:80,title:120,destination:120,known:800,preparation:800,source:250}), active:l?.active===true })),
        downtime: list(raw.waterdeep?.downtime, 200, d => clean(d,{id:80,title:120,person:120,progress:500,next:500})),
        returns: list(raw.waterdeep?.returns, 100, d => clean(d,{id:80,when:100,welcome:600,change:600,leadOne:300,leadTwo:300,notes:1200})) },
      sites: list(raw.sites, 9, s => ({ ...clean(s,{id:80,name:120,location:120,startingCondition:80,state:80,source:200,people:1200,evidence:1200,custody:1200,nextConsequence:1200,notes:2000}), number:num(s?.number,1,9) }), siteSeed),
      floors: list(raw.floors, 23, f => ({ ...clean(f,{name:120,status:80,routes:1200,factions:1200,rooms:1200,bookNote:1200,echoOverlay:1200,echoNotes:1200,source:200}), number:num(f?.number,1,23) }), floorSeed),
      calendar: { day:num(raw.calendar?.day,0,100000), label:cut(raw.calendar?.label,100),
        clocks:list(raw.calendar?.clocks,100,c=>({ ...clean(c,{id:80,name:120,kind:60,next:800,notes:1200}), current:num(c?.current,0,1000), max:num(c?.max,1,1000) })),
        events:list(raw.calendar?.events,300,e=>({ ...clean(e,{id:80,title:120,kind:60,person:120,note:1200}), day:num(e?.day,0,100000) })) },
      wrapUps:list(raw.wrapUps,500,w=>clean(w,{id:80,sessionId:80,sessionName:100,decisions:2500,npcChanges:1600,treasure:1200,progress:1200,hooks:1600,recap:2500,nextScene:120,nextPlan:1200}))
    };
    // Voice auditions remain opt-in DM preparation. Preserve an explicit saved cast
    // through the same allowlist used by the editor, without seeding blank campaigns.
    if (raw.voiceStudio != null) {
      if (!globalThis.ECHO_VOICE_STUDIO_DATA) throw Error('Voice studio is missing. Keep the original save.');
      result.voiceStudio = globalThis.ECHO_VOICE_STUDIO_DATA.normalize(raw.voiceStudio);
    }
    if (Object.prototype.hasOwnProperty.call(raw, 'voiceCast') && raw.voiceCast != null) {
      if (typeof raw.voiceCast !== 'object' || Array.isArray(raw.voiceCast)) throw Error('The saved voice cast could not be read safely. Keep the original save.');
      if (!globalThis.ECHO_AI_VOICE_CAST?.normalize) throw Error('The voice-cast module is unavailable. Reload the app before opening this save; the original must be preserved.');
      result.voiceCast = globalThis.ECHO_AI_VOICE_CAST.normalize(raw.voiceCast);
    }
    if (raw.assets && typeof raw.assets === 'object') for (const [key,value] of Object.entries(raw.assets).slice(0,200))
      if (/^[A-Za-z0-9_-]{1,100}$/.test(key) && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 800000) result.assets[key]=value;
    if (raw.sessionPlans && typeof raw.sessionPlans === 'object') for (const [key,p] of Object.entries(raw.sessionPlans).slice(0,500)) {
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) continue;
      result.sessionPlans[key] = { ...clean(p,{nextBeat:80,music:300,handout:300,likelyRules:600,elsePlan:1200,opening:1000,notes:1800}),
        order:Array.isArray(p?.order)?p.order.slice(0,150).map(x=>cut(x,80)):[],
        extraBeats:list(p?.extraBeats,100,b=>({ ...clean(b,{id:80,title:100,scene:80,encounter:80}),
          read:Array.isArray(b?.read)?b.read.slice(0,12).map(x=>cut(x,1200)):[],
          ask:Array.isArray(b?.ask)?b.ask.slice(0,12).map(x=>cut(x,1200)):[],
          run:Array.isArray(b?.run)?b.run.slice(0,12).map(x=>cut(x,1200)):[],
          choices:Array.isArray(b?.choices)?b.choices.slice(0,12).map(x=>cut(x,1200)):[],
          private:Array.isArray(b?.private)?b.private.slice(0,12).map(x=>cut(x,1200)):[] })),
        beats:Object.fromEntries(Object.entries(p?.beats||{}).slice(0,150).map(([id,b])=>[cut(id,80),
          { ...clean(b,{trigger:600,consequence:1000,next:80,elsePlan:1000,music:300,handout:300,likelyRules:600}), optional:b?.optional===true,status:['ready','done','skipped'].includes(b?.status)?b.status:'ready' }])) };
    }
    if (raw.contentProfile === 'blank') {
      result.contentProfile='blank';
      // Optional campaign-specific planning adapters start absent. Keep explicitly
      // saved user work, but do not manufacture the installed pack's cast/chapters.
      for (const key of ['characterStories','transition','courtyard','mystery','finale'])
        if (raw[key] == null) result[key] = null;
      for (const key of ['npcs','sites','floors','routes']) if (!Array.isArray(raw[key])) result[key]=[];
      if (!raw.waterdeep) result.waterdeep={places:[],factions:[],leads:[],downtime:[],returns:[]};
      result.adventureProgress={};
      return result;
    }
    if (!result.npcs.some(npc => npc.id === 'dracuseth')) result.npcs.push({ ...npcSeed.find(npc => npc.id === 'dracuseth'),
      notes: 'Based in Waterdeep. Not traveling with the Session 1 party. Does not know the Echo mystery in advance.',
      portrait: 'assets/Dracuseth-Maw-of-Flames.png' });
    globalThis.ECHO_COURTYARD?.ensureReferences(result);
    globalThis.ECHO_UNDERMOUNTAIN_ARC?.ensureReferences(result);
    return result;
  }
  globalThis.ECHO_STORY_DATA = { normalize, uid, NPC_SEED, SITE_SEED, FLOOR_NAMES,
    FLOOR_PAGES, FLOOR_AFTERMATH, FLOOR_LEVELS, FLOOR_MAPS, FLOOR_PREP, PHANDELVER_PACKS,
    CRAGMAW_PAGES, LIVE_RULES, ELDER_RUNES };
})();

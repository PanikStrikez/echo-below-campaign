(() => {
  'use strict';
  const attack = (name, bonus, dice, type, range, note = '') => ({ name, bonus, dice, type, range, note });
  const CREATURES = {
    goblin: { name: 'Goblin', source: 'SRD 5.1 p. 315', book: 'srd', page: 315,
      size: 'Small humanoid (goblinoid)', alignment: 'neutral evil', cr: .25, xp: 50,
      ac: 15, hp: 7, hitDice: '2d6', speed: '30 ft.',
      abilities: [8, 14, 10, 10, 8, 8], saves: '', skills: 'Stealth +6',
      senses: 'Darkvision 60 ft.; passive Perception 9', languages: 'Common, Goblin',
      resistances: '', vulnerabilities: '', immunities: '', conditionImmunities: '',
      traits: [{ name: 'Nimble Escape', text: 'Disengage or Hide as a bonus action each turn.' }],
      actions: [attack('Scimitar', 4, '1d6+2', 'slashing', 'Melee 5 ft.'),
        attack('Shortbow', 4, '1d6+2', 'piercing', 'Range 80/320 ft.')],
      reactions: [], spells: [], variants: 'Yeemik uses this attack and AC, but the adventure gives him 12 HP. Ordinary cave goblins have 7 HP.' },
    wolf: { name: 'Wolf', source: 'SRD 5.1 p. 393', book: 'srd', page: 393,
      size: 'Medium beast', alignment: 'unaligned', cr: .25, xp: 50,
      ac: 13, hp: 11, hitDice: '2d8+2', speed: '40 ft.',
      abilities: [12, 15, 12, 3, 12, 6], saves: '', skills: 'Perception +3; Stealth +4',
      senses: 'Passive Perception 13', languages: '—',
      resistances: '', vulnerabilities: '', immunities: '', conditionImmunities: '',
      traits: [{ name: 'Keen Hearing and Smell', text: 'Advantage on Perception checks using hearing or smell.' },
        { name: 'Pack Tactics', text: 'Advantage on an attack if an ally is within 5 ft. of the target and is not incapacitated.' }],
      actions: [attack('Bite', 4, '2d4+2', 'piercing', 'Melee 5 ft.', 'DC 11 Strength save or prone.')],
      reactions: [], spells: [], variants: 'Ripper and kennel wolves: use the wolf block; check the adventure for their behavior.' },
    bugbear: { name: 'Bugbear', source: 'SRD 5.1 p. 266', book: 'srd', page: 266,
      size: 'Medium humanoid (goblinoid)', alignment: 'chaotic evil', cr: 1, xp: 200,
      ac: 16, hp: 27, hitDice: '5d8+5', speed: '30 ft.',
      abilities: [15, 14, 13, 8, 11, 9], saves: '', skills: 'Stealth +6; Survival +2',
      senses: 'Darkvision 60 ft.; passive Perception 10', languages: 'Common, Goblin',
      resistances: '', vulnerabilities: '', immunities: '', conditionImmunities: '',
      traits: [{ name: 'Brute', text: 'One extra weapon damage die on melee hits (included below).' },
        { name: 'Surprise Attack', text: 'If this bugbear surprises a creature and hits it in round 1, add 2d6 damage.' }],
      actions: [attack('Morningstar', 4, '2d8+2', 'piercing', 'Melee 5 ft.'),
        attack('Javelin (melee)', 4, '2d6+2', 'piercing', 'Melee 5 ft.'),
        attack('Javelin (ranged)', 4, '1d6+2', 'piercing', 'Range 30/120 ft.')],
      reactions: [], spells: [], variants: 'Klarg: base bugbear block. His cave context and companions come from the adventure.' },
    'redbrand-ruffian': { name: 'Redbrand Ruffian', source: 'Lost Mine of Phandelver appendix B, printed p. 61', book: 'lmop', page: 61,
      size: 'Medium humanoid (human)', alignment: 'neutral evil', cr: .5, xp: 100,
      ac: 14, hp: 16, hitDice: '3d8+3', speed: '30 ft.', abilities: [11,14,12,9,9,11],
      saves: '', skills: 'Intimidation +2', senses: 'Passive Perception 9', languages: 'Common',
      resistances: '', vulnerabilities: '', immunities: '', conditionImmunities: '',
      traits: [],
      actions: [{name:'Multiattack',text:'Makes two melee attacks.'},
        attack('Shortsword',4,'1d6+2','piercing','Melee 5 ft.')],
      reactions: [], spells: [], variants:'Use room keys for groups, alerting, and morale; this card does not assign their positions.' },
    nothic: { name: 'Nothic', source: 'Lost Mine of Phandelver appendix B, printed p. 60', book:'lmop', page:60,
      size:'Medium aberration', alignment:'neutral evil', cr:2, xp:450,
      ac:15, hp:45, hitDice:'6d8+18', speed:'30 ft.', abilities:[14,16,16,13,10,8],
      saves:'', skills:'Arcana +3; Insight +4; Perception +2; Stealth +5',
      senses:'Truesight 120 ft.; passive Perception 12', languages:'Undercommon',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
      traits:[{name:'Keen Sight',text:'Advantage on sight-based Perception checks.'}],
      actions:[{name:'Multiattack',text:'Makes two claw attacks.'},
        attack('Claws',4,'1d6+3','slashing','Melee 5 ft.'),
        {name:'Rotting Gaze',bonus:null,dice:'3d6',type:'necrotic',range:'30 ft.',note:'One visible target; DC 12 Constitution save negates damage.'},
        {name:'Weird Insight',text:'Choose a creature visible within 30 ft.; contest Wisdom (Insight) against its Charisma (Deception) to learn a secret or fact.'}],
      reactions:[],spells:[],variants:'Area 8 crevasse: use the book’s negotiation and treasure context before combat.' },
    skeleton: { name:'Skeleton', source:'Monster Manual (2014), printed p. 272', book:'mm', page:272,
      size:'Medium undead', alignment:'lawful evil', cr:.25, xp:50,
      ac:13, hp:13, hitDice:'2d8+4', speed:'30 ft.', abilities:[10,14,15,6,8,5],
      saves:'', skills:'', senses:'Darkvision 60 ft.; passive Perception 9', languages:'Understands languages it knew in life but cannot speak',
      resistances:'', vulnerabilities:'bludgeoning', immunities:'poison', conditionImmunities:'exhaustion, poisoned', traits:[],
      actions:[attack('Shortsword',4,'1d6+2','piercing','Melee 5 ft.'), attack('Shortbow',4,'1d6+2','piercing','Range 80/320 ft.')],
      reactions:[], spells:[], variants:'Area 4: activation has a cloak and password exception; see keyed room.' },
    'evil-mage': { name:'Evil Mage · Iarno base', source:'Lost Mine of Phandelver appendix B, printed p. 57', book:'lmop', page:57,
      size:'Medium humanoid (human)', alignment:'lawful evil', cr:1, xp:200,
      ac:12, hp:22, hitDice:'5d8', speed:'30 ft.', abilities:[9,14,11,17,12,11],
      saves:'Intelligence +5; Wisdom +3', skills:'Arcana +5; History +5', senses:'Passive Perception 11', languages:'Common, Draconic, Dwarvish, Elvish',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
      traits:[{name:'Spellcasting',text:'4 first-level and 3 second-level slots; spell save DC 13, +5 spell attack.'},
        {name:'Staff of Defense',text:'Iarno holds it for +1 AC. With mage armor, total AC is 16. The printed item uses an action and 1 charge for mage armor, or an action and 2 charges for shield; track its 10 charges. Lost Mine of Phandelver p. 53.'}],
      actions:[attack('Quarterstaff',1,'1d8-1','bludgeoning','Melee 5 ft.'), attack('Shocking Grasp',5,'1d8','lightning','Touch')],
      reactions:[], spells:['Cantrips: light, mage hand, shocking grasp','1st level: charm person, magic missile','2nd level: hold person, misty step'],
      variants:'Glasstaff carries a staff of defense. Check the item in the adventure before applying mage armor or shield.' },
    'sildar-equipped': { name:'Sildar Hallwinter · equipped', source:'Lost Mine of Phandelver appendix B, printed p. 61', book:'lmop', page:61,
      size:'Medium humanoid (human)', alignment:'neutral good', cr:1, xp:200,
      ac:16, hp:27, hitDice:'5d8+5', speed:'30 ft.', abilities:[13,10,12,10,11,10],
      saves:'Strength +3; Constitution +3', skills:'Perception +2', senses:'Passive Perception 12', languages:'Common',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
      traits:[],
      actions:[{name:'Multiattack',text:'Makes two melee attacks.'},
        attack('Longsword',3,'1d8+1','slashing','Melee 5 ft.'),
        attack('Heavy crossbow',2,'1d10','piercing','Range 100/400 ft.')],
      reactions:[{name:'Parry',text:'Adds 1d6 to AC against one visible melee attack that would hit, while wielding a melee weapon.'}],
      spells:[],variants:'The captive Sildar begins at 1 HP without armor or weapons. Use this equipped card only after his gear is restored.' },
    hobgoblin: { name:'Hobgoblin', source:'2014 SRD 5.1, printed p. 322', book:'srd', page:322,
      size:'Medium humanoid (goblinoid)', alignment:'lawful evil', cr:.5, xp:100,
      ac:18, hp:11, hitDice:'2d8+2', speed:'30 ft.', abilities:[13,12,12,10,10,9],
      saves:'', skills:'', senses:'Darkvision 60 ft.; passive Perception 10', languages:'Common, Goblin',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
      traits:[{name:'Martial Advantage',text:'Once per turn, add 2d6 to a weapon hit if a non-incapacitated ally is within 5 feet of the target.'}],
      actions:[attack('Longsword',3,'1d8+1','slashing','Melee 5 ft.; 1d10+1 with two hands'),
        attack('Longbow',3,'1d8+1','piercing','Range 150/600 ft.')], reactions:[], spells:[],
      variants:'Targor in the optional returning war band has 20 HP; ordinary castle hobgoblins have 11 HP.' },
    grick: { name:'Grick', source:'2014 SRD 5.1, printed p. 318', book:'srd', page:318,
      size:'Medium monstrosity', alignment:'neutral', cr:2, xp:450,
      ac:14, hp:27, hitDice:'6d8', speed:'30 ft.; climb 30 ft.', abilities:[14,14,11,3,14,5],
      saves:'', skills:'', senses:'Darkvision 60 ft.; passive Perception 12', languages:'—',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
      traits:[{name:'Stone Camouflage',text:'Advantage on Stealth checks to hide in rocky terrain.'},
        {name:'Conditional resistance',text:'Resists bludgeoning, piercing, and slashing damage from nonmagical attacks. Apply this manually for the actual attack; do not auto-resist magical weapons.'}],
      actions:[{name:'Multiattack',text:'One tentacles attack; if it hits, one beak attack against the same target.'},
        attack('Tentacles',4,'2d6+2','slashing','Melee 5 ft.'), attack('Beak',4,'1d6+2','piercing','Melee 5 ft.; only after tentacles hit')],
      reactions:[], spells:[], variants:'Castle area 8: hides on an upper ledge. Check Stealth against Perception for surprise.' },
    owlbear: { name:'Owlbear', source:'2014 SRD 5.1, printed pp. 339–340', book:'srd', page:339,
      size:'Large monstrosity', alignment:'unaligned', cr:3, xp:700,
      ac:13, hp:59, hitDice:'7d10+21', speed:'40 ft.', abilities:[20,12,17,3,12,7],
      saves:'', skills:'Perception +3', senses:'Darkvision 60 ft.; passive Perception 13', languages:'—',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
      traits:[{name:'Keen Sight and Smell',text:'Advantage on Perception checks using sight or smell.'}],
      actions:[{name:'Multiattack',text:'One beak and one claws attack.'},
        attack('Beak',7,'1d10+5','piercing','Melee 5 ft.'), attack('Claws',7,'2d8+5','slashing','Melee 5 ft.')],
      reactions:[], spells:[], variants:'Castle area 13: fresh meat distracts it; if freed and unblocked, it flees.' },
    doppelganger: { name:'Doppelganger', source:'2014 SRD 5.1, printed pp. 279–280', book:'srd', page:279,
      size:'Medium monstrosity (shapechanger)', alignment:'neutral', cr:3, xp:700,
      ac:14, hp:52, hitDice:'8d8+16', speed:'30 ft.', abilities:[11,18,14,11,12,14],
      saves:'', skills:'Deception +6; Insight +3', senses:'Darkvision 60 ft.; passive Perception 11', languages:'Common',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'charmed',
      traits:[{name:'Shapechanger',text:'Action to take a Small or Medium humanoid form seen before, or return to true form; equipment does not transform.'},
        {name:'Ambusher',text:'Advantage on attacks against surprised creatures in the first combat round.'},
        {name:'Surprise Attack',text:'If it surprises a creature and hits in round 1, add 3d6 damage.'}],
      actions:[{name:'Multiattack',text:'Two melee slam attacks.'}, attack('Slam',6,'1d6+4','bludgeoning','Melee 5 ft.'),
        {name:'Read Thoughts',text:'Action to read one creature’s surface thoughts within 60 ft.; concentration applies and gives social-check advantages against that target.'}],
      reactions:[], spells:[], variants:'Vyerith in castle area 14 is disguised as a drow. Keep the true type private until discovered.' },
    orc: { name:'Orc', source:'2014 SRD 5.1, printed p. 339', book:'srd', page:339,
      size:'Medium humanoid (orc)', alignment:'chaotic evil', cr:.5, xp:100,
      ac:13, hp:15, hitDice:'2d8+6', speed:'30 ft.', abilities:[16,12,16,7,11,10],
      saves:'', skills:'Intimidation +2', senses:'Darkvision 60 ft.; passive Perception 10', languages:'Common, Orc',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
      traits:[{name:'Aggressive',text:'Bonus action to move up to speed toward a visible hostile creature.'}],
      actions:[attack('Greataxe',5,'1d12+3','slashing','Melee 5 ft.'), attack('Javelin',5,'1d6+3','piercing','Melee 5 ft. or range 30/120 ft.')],
      reactions:[], spells:[], variants:'Wyvern Tor Brughor has 30 HP; ordinary orcs have 15 HP.' },
    ogre: { name:'Ogre', source:'2014 SRD 5.1, printed p. 336', book:'srd', page:336,
      size:'Large giant', alignment:'chaotic evil', cr:2, xp:450,
      ac:11, hp:59, hitDice:'7d10+21', speed:'40 ft.', abilities:[19,8,16,5,7,7],
      saves:'', skills:'', senses:'Darkvision 60 ft.; passive Perception 8', languages:'Common, Giant',
      resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'', traits:[],
      actions:[attack('Greatclub',6,'2d8+4','bludgeoning','Melee 5 ft.'), attack('Javelin',6,'2d6+4','piercing','Melee 5 ft. or range 30/120 ft.')],
      reactions:[], spells:[], variants:'Gog is the ogre at Wyvern Tor.' },
    zombie: { name:'Zombie', source:'2014 SRD 5.1, printed pp. 356–357', book:'srd', page:356,
      size:'Medium undead', alignment:'neutral evil', cr:.25, xp:50,
      ac:8, hp:22, hitDice:'3d8+9', speed:'20 ft.', abilities:[13,6,16,3,6,5],
      saves:'Wisdom +0', skills:'', senses:'Darkvision 60 ft.; passive Perception 8', languages:'Understands languages it knew in life but cannot speak',
      resistances:'', vulnerabilities:'', immunities:'poison', conditionImmunities:'poisoned',
      traits:[{name:'Undead Fortitude',text:'At 0 HP, Constitution save DC 5 + damage taken to remain at 1 HP; no save if radiant damage or a critical hit caused the drop.'}],
      actions:[attack('Slam',3,'1d6+1','bludgeoning','Melee 5 ft.')], reactions:[], spells:[],
      variants:'Twelve zombies hide in the ruined tower at Old Owl Well until the encounter develops.' }
  };
  CREATURES['hamun-kost'] = { ...CREATURES['evil-mage'], name:'Hamun Kost · Evil Mage base',
    source:'Lost Mine of Phandelver Old Owl Well p. 29; Evil Mage appendix B p. 57', book:'lmop', page:29,
    traits:[{name:'Spellcasting',text:'Four 1st-level and three 2nd-level slots; spell save DC 13, +5 spell attack.'}],
    variants:'Hamun does not have Iarno’s staff of defense. He can call his zombies to halt for a parley.' };
  const PLANS = {
    road: { terrain: 'Forest road, cart, trees, and cover.', objective: 'Protect the party and discover what happened to Gundren.',
      starting: 'Two goblins on each side of the road; reveal when spotted or when they attack.',
      waves: [{ name: 'Ambush', tokenIds: ['goblin-1', 'goblin-2', 'goblin-3', 'goblin-4'], note: 'Place behind cover.' }],
      reinforcements: 'None established in this scene.', nonCombat: 'A fleeing or captured goblin can reveal a trail; allow parley if the players create an opening.',
      morale: 'A goblin may flee once the ambush collapses.', retreat: 'The road and wagon provide a withdrawal route.', negotiation: 'Capture and questioning can advance the investigation.' },
    blind: { terrain: 'Briars by the stream.', objective: 'Reach the cave without raising an alarm.', starting: 'Two goblins at the blind.',
      waves: [{ name: 'Watchers', tokenIds: ['goblin-5', 'goblin-6'], note: 'Hidden until spotted.' }],
      reinforcements: 'An alarm may affect later rooms; decide from the adventure.', nonCombat: 'Sneak, distract, or bargain past the sentries.', morale: 'Watchers may run to warn others.', retreat: 'The stream path remains open.', negotiation: 'Question a captured watcher.' },
    kennel: { terrain: 'Cave kennel and chains.', objective: 'Get past the wolves without alerting the cave.', starting: 'Three chained wolves.',
      waves: [{ name: 'Kennel', tokenIds: ['wolf-1', 'wolf-2', 'wolf-3'], note: 'Check chain reach on the map.' }],
      reinforcements: 'Noise can alert nearby goblins; use adventure guidance.', nonCombat: 'Food, calm handling, or stealth can avoid a fight.', morale: 'Wolves can be frightened or placated.', retreat: 'Withdraw along the entrance tunnel.', negotiation: 'Animal handling and food may work.' },
    overpass: { terrain: 'High ledge above the stream.', objective: 'Prevent the warning or flood signal.', starting: 'One goblin above the party.',
      waves: [{ name: 'Lookout', tokenIds: ['goblin-7'], note: 'Place at overpass.' }], reinforcements: 'The lookout may signal the pools.',
      nonCombat: 'Avoid detection or distract the lookout.', morale: 'The lookout prioritizes warning others.', retreat: 'Use the passage back to the entrance.', negotiation: 'A captured lookout knows the cave.' },
    den: { terrain: 'Goblin living area with Sildar captive.', objective: 'Rescue Sildar and learn where Gundren was taken.',
      starting: 'Yeemik (12 HP) and five ordinary goblins (7 HP each); Sildar starts at 1 HP.',
      waves: [{ name: 'Den', tokenIds: ['yeemik', 'goblin-8', 'goblin-9', 'goblin-10', 'goblin-11', 'goblin-12'], note: 'Place according to the room.' }],
      reinforcements: 'Neighboring goblins may respond to noise; check the adventure.', nonCombat: 'Yeemik can be bargained with; Sildar is a hostage.',
      morale: 'Yeemik may value leverage over a fair fight.', retreat: 'The party can back out through the caves.', negotiation: 'Discuss Sildar and Klarg.' },
    pools: { terrain: 'Twin water pools and flood controls.', objective: 'Stop a flood and clear the way onward.', starting: 'Three goblins at the pools.',
      waves: [{ name: 'Guards', tokenIds: ['goblin-13', 'goblin-14', 'goblin-15'], note: 'Check flood trigger in adventure.' }],
      reinforcements: 'An alarm may bring help.', nonCombat: 'Stealth or control of the water works.', morale: 'Guards may release water before fighting.', retreat: 'Higher passage may provide safety.', negotiation: 'A guard may surrender.' },
    klarg: { terrain: 'Klarg’s cave, supplies, and uneven cover.', objective: 'Defeat or drive off Klarg and recover clues.',
      starting: 'Klarg, Ripper, and two goblins.',
      waves: [{ name: 'Cave defenders', tokenIds: ['klarg', 'ripper', 'goblin-16', 'goblin-17'], note: 'Use room positions from the adventure.' }],
      reinforcements: 'Other goblins may arrive if warned.', nonCombat: 'Parley, deception, or retreat remain possible.',
      morale: 'Klarg is dangerous; adjust behavior to the scene.', retreat: 'The cave passages can be used to withdraw.', negotiation: 'Klarg may reveal what he knows about Gundren.' },
    'redbrand-street': { terrain: 'Open Phandalin street, porches, a parked wagon, well, crates, and bystanders. The map is a player-safe tactical interpretation, not the keyed town map.',
      objective: 'Resolve the gang’s challenge while keeping bystanders safe; combat is optional.',
      starting: 'Four Redbrand Ruffians enter only after the town confrontation is triggered.',
      waves: [{ name: 'Street confrontation', tokenIds: ['s2-ruffian-1', 's2-ruffian-2', 's2-ruffian-3', 's2-ruffian-4'],
        positions: { 's2-ruffian-1': { x: 75, y: 40 }, 's2-ruffian-2': { x: 79, y: 47 },
          's2-ruffian-3': { x: 75, y: 54 }, 's2-ruffian-4': { x: 79, y: 61 } },
        note: 'Deploy only once they are visible. Ask where the characters are before initiative.' }],
      reinforcements: 'None in the published street confrontation. Do not spawn additional ruffians automatically.',
      nonCombat: 'The players may speak, leave, seek help, surrender a demand, bluff, or capture a ruffian.',
      morale: 'After three ruffians fall, the last tries to flee toward Tresendar Manor.',
      retreat: 'The party can withdraw through the street and seek cover or allies.',
      negotiation: 'Let the gang’s demands and the players’ response determine whether violence starts.',
      outcome: 'A captive or fleeing ruffian can point toward Tresendar Manor. Record local reaction and prisoners.' }
  };
  const hideoutWave = (id, count) => Array.from({ length: count }, (_, i) => `s2-${id}-${i+1}`);
  Object.assign(PLANS, {
    'hideout-cellar': { terrain:'Cellar, 10-foot cistern, barrels, and secret route.', objective:'Explore without alerting adjacent guards.', starting:'No stationed enemy.', waves:[], reinforcements:'Three barracks ruffians may hear loud searching.', nonCombat:'Search, listen, and move quietly.', morale:'—', retreat:'Stairs to manor.', negotiation:'—' },
    'hideout-barracks': { terrain:'Beds and lamp-lit cellar room.', objective:'Pass or neutralize guards.', starting:'Three ruffians; alert if cellar was noisy.', waves:[{name:'Barracks',tokenIds:hideoutWave('hideout-barracks',3),note:'Deploy when seen.'}], reinforcements:'Follow local noise and room key.', nonCombat:'Bluff or withdraw.', morale:'Use gang motives.', retreat:'Cellar door.', negotiation:'Captives can describe hideout without revealing unearned secrets.' },
    'hideout-trap': { terrain:'Concealed 20-foot pit in corridor; floor gives way under 100 pounds or more.', objective:'Detect or cross safely.', starting:'No creature.', waves:[], reinforcements:'Noise may carry.', nonCombat:'DC 15 Perception detects; DC 10 Acrobatics skirts; DC 15 Dex save catches edge; otherwise 2d6 fall and prone.', morale:'—', retreat:'Back through hall.', negotiation:'—' },
    'hideout-crypt': { terrain:'Three sarcophagi and doors to the pens and armory.', objective:'Cross crypt or secure exits.', starting:'Three visible skeletons inert until trigger.', waves:[{name:'Animated skeletons',tokenIds:hideoutWave('hideout-crypt',3),note:'Animate within 10 feet of side doors unless cloak or password Illefarn.'}], reinforcements:'Fighting alerts the two guards in area 5.', nonCombat:'Scarlet cloak or password prevents activation.', morale:'Undead do not parley.', retreat:'Return by corridor.', negotiation:'—' },
    'hideout-pens': { terrain:'Prison bars, cell locks, and vulnerable captives.', objective:'Rescue Mirna, Nars, and Nilsa.', starting:'Two guards; prepared if area 4 alerted them.', waves:[{name:'Pen guards',tokenIds:hideoutWave('hideout-pens',2),note:'Keep captives out of automatic splash damage.'}], reinforcements:'Nearby gang may hear combat.', nonCombat:'DC 10 thieves’ tools or DC 22 Strength opens cells; Mosk’s or Iarno’s key works.', morale:'Guards may use captives as leverage.', retreat:'Crypt door.', negotiation:'Prioritize safe release.' },
    'hideout-crevasse': { terrain:'20-foot fissure, two bridges, difficult terrain below.', objective:'Cross, bargain, or search.', starting:'Nothic hidden in crevasse.', waves:[{name:'Nothic',tokenIds:hideoutWave('hideout-crevasse',1),note:'Parley for food may avoid combat.'}], reinforcements:'None automatic.', nonCombat:'Bargain; test bridges. South bridge breaks over 50 pounds.', morale:'Creature wants food and secrets.', retreat:'Tunnel or cellar.', negotiation:'Weird Insight can make secrets matter.' },
    'hideout-bugbears': { terrain:'Guard room with three bugbears and Droop.', objective:'Survive, negotiate, or rescue Droop.', starting:'Three bugbears; Droop faints and is not hostile.', waves:[{name:'Bugbears',tokenIds:hideoutWave('hideout-bugbears',3),note:'Dangerous for level-2 party; Droop is not in enemy wave.'}], reinforcements:'Noise may carry.', nonCombat:'Retreat, use red cloaks and DC 15 Deception, or question Droop after.', morale:'Bugbears are forceful but can react to danger.', retreat:'Back to crevasse.', negotiation:'Captured bugbear may reveal castle on DC 15 Intimidation; Droop knows only broad north forest direction.' },
    'hideout-common': { terrain:'Gambling table and furniture.', objective:'Pass the gang or defeat it.', starting:'Four drunken ruffians, all poisoned.', waves:[{name:'Gambling ruffians',tokenIds:hideoutWave('hideout-common',4),note:'Poisoned: disadvantage on attacks and checks. Burst entry surprises them.'}], reinforcements:'Noise may alert other rooms.', nonCombat:'Red cloaks and DC 10 Deception can pass as members.', morale:'Use situation.', retreat:'Back through entry.', negotiation:'Bluffing is supported.' },
    'hideout-glasstaff': { terrain:'Private quarters with secret escape route.', objective:'Confront or pursue Iarno and secure evidence.', starting:'Iarno remains only if not warned or blocked.', waves:[{name:'Glasstaff',tokenIds:hideoutWave('hideout-glasstaff',1),note:'If rat warned him, pursue via area 7, 8, then 1 instead of deploying here.'}], reinforcements:'No automatic reinforcements.', nonCombat:'Question or capture Iarno.', morale:'Surrenders at 8 HP or less when cornered.', retreat:'Secret route toward storeroom, crevasse, cellar and satchel.', negotiation:'Iarno knows Black Spider seeks Forge, not mine location.' }
  });
  const castleIds = (encounter, type, count) => Array.from({ length: count }, (_, i) => `s3-${encounter}-${type}-${i+1}`);
  Object.assign(PLANS, {
    'old-owl-well': { terrain:'Ruined tower, working well, tent, and broken courtyard walls.',
      objective:'Resolve the contact with Hamun Kost and survive if negotiations fail.',
      starting:'Hamun is near the tent. Twelve zombies are hidden in the tower, not visible at first.',
      waves:[{name:'Hamun Kost',tokenIds:['s3-hamun'],note:'Deploy only if he becomes a combatant.'},
        {name:'Tower zombies',tokenIds:castleIds('old-owl-well','zombie',12),note:'Reveal only those that actually emerge. Undead Fortitude needs a save after a qualifying 0-HP hit.'}],
      reinforcements:'Kost can call the zombies off temporarily to talk.', nonCombat:'Parley and a favor are supported by the room key.',
      morale:'Kost values his work and safety.', retreat:'Hillside and approach paths remain open.', negotiation:'He may trade information for the Wyvern Tor or Agatha errand.' },
    'wyvern-tor': { terrain:'Ravine, cave, boulder cover, and one outside sentry.',
      objective:'Resolve the orc threat without overlooking the cave defenders.',
      starting:'One ordinary orc watches outside; six ordinary orcs, Brughor (30 HP), and Gog the ogre are inside.',
      waves:[{name:'Outside sentry',tokenIds:['s3-wyvern-tor-orc-1'],note:'Place the sentry when spotted. If it warns the cave, mark the defenders alerted.'},
        {name:'Cave force',tokenIds:[...castleIds('wyvern-tor','orc',7).slice(1),'s3-brughor','s3-gog'],note:'Six ordinary orcs plus Brughor and Gog. Do not deploy until seen or emerging.'}],
      reinforcements:'Only the listed cave force; no automatic extra orcs.', nonCombat:'Scout, bypass, negotiate, or withdraw.',
      morale:'After Brughor falls, surviving orcs flee.', retreat:'Ravine and hillside provide exits.', negotiation:'The group can attempt a demand or bargain before blades are drawn.' },
    'castle-archers': { terrain:'Two arrow-slit posts at the broken gate; defenders have three-quarters cover through the slits.',
      objective:'Enter without giving the entire castle warning.', starting:'Two goblins in each post, four total, hidden until noticed or firing.',
      waves:[{name:'Two archer posts',tokenIds:castleIds('castle-archers','goblin',4),note:'Place two in each area-3 post; do not place all in one room.'}],
      reinforcements:'If the sentries shout, area 4 goblins and area 6 hobgoblins can rush to the trapped hall.',
      nonCombat:'Stealth, Redbrand disguise, or another entrance can bypass the posts.', morale:'Sentries prioritize raising alarm.',
      retreat:'The ruined gate and forest remain open.', negotiation:'Bluffing as Glasstaff envoys is supported by the book.' },
    'castle-trap': { terrain:'Area 2 hall with hidden tripwire, loose ceiling, and rubble.', objective:'Detect or avoid a falling-rubble trap.',
      starting:'No stationary foe.', waves:[], reinforcements:'The collapse alerts areas 3, 7, 8, and 9.',
      nonCombat:'Passive Perception 20 or active DC 10 Perception while searching; DC 10 Dexterity save, 3d6 bludgeoning or half.',
      morale:'—', retreat:'Back to entrance.', negotiation:'—' },
    'castle-barracks': { terrain:'Southwest ruined barracks and safe rubble passage.', objective:'Pass or neutralize three goblins.',
      starting:'Three goblins remain unless they responded to an alarm elsewhere.',
      waves:[{name:'Barracks goblins',tokenIds:castleIds('castle-barracks','goblin',3),note:'Reconcile earlier alarms before deploying.'}],
      reinforcements:'Loud noise attracts one banquet goblin scout.', nonCombat:'Stealth, bluff, or retreat.', morale:'Use gang behavior.',
      retreat:'Door and rubble passage.', negotiation:'A captured goblin may know castle layout.' },
    'castle-hobgoblins': { terrain:'Orderly barracks with wall-mounted weapons.', objective:'Get past disciplined defenders.',
      starting:'Four hobgoblins; they respond to sentries but usually ignore distant noise.',
      waves:[{name:'Hobgoblin barracks',tokenIds:castleIds('castle-hobgoblins','hobgoblin',4),note:'Remember Martial Advantage if an ally is adjacent to a target.'}],
      reinforcements:'Sentry alarm can draw them into area 2.', nonCombat:'A convincing Redbrand envoy story may open conversation.',
      morale:'They defend their room and allies.', retreat:'Door to hall.', negotiation:'They can assess a claim to work for the Black Spider.' },
    'castle-banquet': { terrain:'Tables, benches, and a large hall with several exits.', objective:'Pass or resolve the goblin mess hall.',
      starting:'Yegg (12 HP) and seven ordinary goblins, minus any scout who left.',
      waves:[{name:'Banquet hall',tokenIds:[...castleIds('castle-banquet','goblin',7),'s3-yegg'],note:'Eight total before scouts move. Place only those still here.'}],
      reinforcements:'One goblin may already be scouting area 4. Trap noise alerts this room.',
      nonCombat:'Bluff, avoid, or use the many exits.', morale:'When Yegg falls, survivors flee east or west and avoid the trapped north hall.',
      retreat:'Multiple doors and exits.', negotiation:'Food, rank, and Grol’s authority can be used in a bluff.' },
    'castle-grick': { terrain:'Dark hall, high ledges, curtains, and brazier.', objective:'Cross the hall or confront the hidden grick.',
      starting:'One grick concealed on a rocky ledge.', waves:[{name:'Grick revealed',tokenIds:castleIds('castle-grick','grick',1),note:'Deploy when noticed or when it attacks.'}],
      reinforcements:'Combat here prevents the area-9 goblins from being surprised.',
      nonCombat:'Move cautiously, use light, avoid the ledges, or withdraw.', morale:'Predatory creature; it can be avoided.',
      retreat:'Return through the hall.', negotiation:'No spoken parley expected.' },
    'castle-shrine': { terrain:'Altar and heavy curtains; room can provide cover.', objective:'Deal with Lhupo and two acolytes.',
      starting:'Lhupo (12 HP) plus two goblins, prepared if grick fight was heard.',
      waves:[{name:'Shrine occupants',tokenIds:[...castleIds('castle-shrine','goblin',2),'s3-lhupo'],note:'Do not give them surprise if alerted by area 8.'}],
      reinforcements:'Noise may carry into nearby halls.', nonCombat:'Bluff, negotiate, or withdraw.', morale:'Use local pressure.',
      retreat:'Curtained archways.', negotiation:'Religious claims or a Redbrand disguise can be tested.' },
    'castle-guards': { terrain:'East guardroom with curtain leading toward area 14.', objective:'Prevent or account for warning to Grol.',
      starting:'Two hobgoblins; one runs to warn Grol at combat start.',
      waves:[{name:'King’s guards',tokenIds:castleIds('castle-guards','hobgoblin',2),note:'One leaves to warn area 14 and returns two rounds later if able.'}],
      reinforcements:'Grol and Vyerith react to a successful warning; do not auto-deploy them in this room.',
      nonCombat:'Block the route, deceive, or retreat.', morale:'Loyal to Grol.', retreat:'Door and exterior openings.', negotiation:'They may test a claim of business with the king.' },
    'castle-owlbear': { terrain:'Dark tower, barred door, and high ledge.', objective:'Survive, distract, or free a captive owlbear.',
      starting:'One owlbear remains behind the barred door.',
      waves:[{name:'Owlbear',tokenIds:castleIds('castle-owlbear','owlbear',1),note:'Deploy only when the door opens and the creature is visible.'}],
      reinforcements:'If released, its movement can disrupt nearby rooms rather than creating a fresh monster.',
      nonCombat:'Fresh meat distracts it; a clear exit lets it flee.', morale:'It seeks freedom and food, not loyalty to goblins.',
      retreat:'Keep the doorway clear.', negotiation:'Animal handling and food may buy time; it does not speak.' },
    'castle-king': { terrain:'Grol’s quarters, table, furs, and concealed northeast escape. Gundren was left at an inn after actual play.',
      objective:'Resolve Grol and Vyerith’s conflict; recover only possessions actually established at the castle.',
      starting:'Grol 45 HP, Snarl 18 HP, Vyerith 52 HP disguised as a drow. Do not place Gundren here or assume Glasstaff has joined this room.',
      waves:[{name:'King’s quarters',tokenIds:['s3-grol','s3-snarl','s3-vyerith'],note:'Keep Vyerith’s true type private. If warned, position it near the northeast escape.'}],
      reinforcements:'A guard from area 12 may return two rounds after warning Grol.',
      nonCombat:'Bargaining, rescue, stealth, or retreat can alter the fight.',
      morale:'If Grol dies, Vyerith may flee through area 11 with anything it actually possesses; cornered, it fights.',
      retreat:'Northeast concealed route and entry door.', negotiation:'Grol and Vyerith may bargain over information or possessions they actually hold. Gundren is not their hostage.' },
    'castle-warband': { terrain:'Forest or trail outside the castle; optional returning patrol.', objective:'Avoid, bargain with, or defeat Targor’s group.',
      starting:'Targor 20 HP, two ordinary hobgoblins, and two wolves.',
      waves:[{name:'Returning patrol',tokenIds:['s3-targor',...castleIds('castle-warband','hobgoblin',2),...castleIds('castle-warband','wolf',2)],note:'Optional; do not deploy automatically on exit.'}],
      reinforcements:'No automatic second patrol.', nonCombat:'DC 15 Persuasion may persuade Targor that he should succeed Grol.',
      morale:'Targor is ambitious rather than suicidal.', retreat:'Forest cover and road.', negotiation:'Offer him a path to leadership or pass quietly.' }
  });
  const ENCOUNTER_PAGES = { road:6, blind:8, kennel:8, overpass:10, den:10, pools:11, klarg:12,
    'redbrand-street':19, 'hideout-cellar':20, 'hideout-barracks':21, 'hideout-trap':21,
    'hideout-crypt':22, 'hideout-pens':22, 'hideout-crevasse':23, 'hideout-bugbears':24,
    'hideout-common':24, 'hideout-glasstaff':25, 'old-owl-well':29, 'wyvern-tor':35,
    'tt-blights-1':30, 'tt-blights-2':30, 'tt-zombies-3':31, 'tt-blights-5':32,
    'tt-spiders-6':32, 'tt-dragon-7':33, 'tt-zombies-8':33, 'tt-zombies-11':34,
    'tt-blights-12':34, 'tt-cultists-13':34,
    'castle-archers':36, 'castle-trap':36, 'castle-barracks':37, 'castle-hobgoblins':38,
    'castle-banquet':38, 'castle-grick':38, 'castle-shrine':39, 'castle-guards':40,
    'castle-owlbear':40, 'castle-king':40, 'castle-warband':41 };
  function expectedScene(encounterId) {
    if(encounterId==='road')return 'road';
    if(['blind','kennel','overpass','den','pools','klarg'].includes(encounterId))return 'interior';
    if (globalThis.ECHO_SESSION4_COMBAT?.sceneForEncounter?.[encounterId])
      return globalThis.ECHO_SESSION4_COMBAT.sceneForEncounter[encounterId];
    if (encounterId === 'redbrand-street') return 'phandalin-street';
    if (encounterId?.startsWith('hideout-')) return 'redbrand-hideout';
    if (encounterId === 'old-owl-well') return 'lmop-map-old-owl-well';
    if (encounterId === 'wyvern-tor') return 'lmop-map-wyvern-tor';
    if (encounterId === 'tt-zombies-3') return 'lmop-map-thundertree-brown-horse';
    if (encounterId === 'tt-spiders-6') return 'lmop-map-thundertree-spider-store';
    if (encounterId === 'tt-dragon-7') return 'lmop-map-thundertree-dragon-tower';
    if (encounterId === 'tt-zombies-11') return 'lmop-map-thundertree-garrison';
    if (encounterId === 'tt-cultists-13') return 'lmop-map-thundertree-cultists';
    if (encounterId?.startsWith('tt-')) return 'lmop-map-thundertree-overview';
    if (encounterId === 'castle-warband') return 'lmop-map-triboar-trail';
    if (encounterId?.startsWith('castle-')) return 'lmop-map-cragmaw-castle';
    return '';
  }
  function creatureDefense(type, customCreatures = {}) {
    const creature = CREATURES[type] || customCreatures[type] || {};
    return { surprised:false, reactionUsed:false, ready:'', concentration:'',
      resistances:creature.resistances || '', vulnerabilities:creature.vulnerabilities || '',
      immunities:creature.immunities || '' };
  }
  function creatureSaveBonus(creature, ability) {
    const index = ['str', 'dex', 'con', 'int', 'wis', 'cha'].indexOf(ability);
    if (index < 0 || !creature) return null;
    const label = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'][index];
    const match = String(creature.saves || '').match(new RegExp(`(?:^|[;,]\\s*)${label}\\s*([+-]\\d+)`, 'i'));
    if (match) return Number(match[1]);
    const score = creature.abilities?.[index];
    return score === undefined || score === null ? null : Math.floor((Number(score) - 10) / 2);
  }
  const blank = id => ({ id, terrain: '', objective: '', starting: '', waves: [], reinforcements: '',
    nonCombat: '', morale: '', retreat: '', negotiation: '', outcome: '', wrap: {
      loot: '', lootCustody: '', wagon: '', promises: '', clues: '', advancement: '', resources: '', casualties: '', consequences: '' } });
  function normalizePlan(value, id) {
    const base = { ...blank(id), ...(PLANS[id] || {}), ...(value || {}) };
    const clean = (x, n = 800) => String(x ?? '').slice(0, n);
    for (const key of ['terrain', 'objective', 'starting', 'reinforcements', 'nonCombat', 'morale', 'retreat', 'negotiation', 'outcome'])
      base[key] = clean(base[key]);
    base.id = id;
    base.waves = (Array.isArray(base.waves) ? base.waves : []).slice(0, 20).map(w => ({
      name: clean(w.name, 80), tokenIds: Array.isArray(w.tokenIds) ? w.tokenIds.filter(x => typeof x === 'string').slice(0, 60) : [],
      positions: Object.fromEntries(Object.entries(w.positions || {}).slice(0, 60).map(([key, value]) =>
        [key, { x: Math.max(0, Math.min(100, Number(value?.x) || 0)), y: Math.max(0, Math.min(100, Number(value?.y) || 0)) }])),
      note: clean(w.note, 400), deployed: w.deployed === true }));
    base.wrap = Object.fromEntries(['loot', 'lootCustody', 'wagon', 'promises', 'clues', 'advancement', 'resources', 'casualties', 'consequences']
      .map(key => [key, clean(base.wrap?.[key], 1500)]));
    return base;
  }
  function normalizeCombat(raw, encounters) {
    const plans = Object.fromEntries(encounters.map(e => [e.id, normalizePlan(raw?.plans?.[e.id], e.id)]));
    const customCreatures = {};
    for (const [key, value] of Object.entries(raw?.creatures || {}).slice(0, 80)) if (/^[\w-]{1,80}$/.test(key) && value && typeof value === 'object')
      customCreatures[key] = { ...value, name: String(value.name || key).slice(0, 100), source: String(value.source || 'DM entry').slice(0, 200) };
    const tokenState = {};
    for (const [key, value] of Object.entries(raw?.tokens || {}).slice(0, 250)) if (/^[\w-]{1,80}$/.test(key) && value && typeof value === 'object')
      tokenState[key] = {
        surprised: value.surprised === true, reactionUsed: value.reactionUsed === true,
        ready: String(value.ready || '').slice(0, 300),
        concentration: String(value.concentration || '').slice(0, 200),
        resistances: String(value.resistances || '').slice(0, 200),
        vulnerabilities: String(value.vulnerabilities || '').slice(0, 200),
        immunities: String(value.immunities || '').slice(0, 200)
  };
    for (const id of ['pc-ringgo']) if (!tokenState[id]) tokenState[id] = {
      surprised: false, reactionUsed: false, ready: '', concentration: '',
      resistances: 'fire', vulnerabilities: '', immunities: ''
    };
    const effects = (Array.isArray(raw?.effects) ? raw.effects : []).slice(0, 100).filter(e => e && typeof e.tokenId === 'string').map(e => ({
      id: String(e.id || '').slice(0, 80), tokenId: e.tokenId.slice(0, 80), name: String(e.name || '').slice(0, 100),
      condition: String(e.condition || '').slice(0, 50), triggerActor: String(e.triggerActor || '').slice(0, 80),
      triggerPoint: e.triggerPoint === 'start' ? 'start' : 'end', remaining: Math.max(0, Math.min(99, Number(e.remaining) || 0)),
      repeatSave: e.repeatSave === true, due: e.due === true, fired: e.fired === true,
      amount: Math.max(0, Math.min(999, Number(e.amount) || 0)), damageType: String(e.damageType || '').slice(0, 40),
      mode: e.mode === 'heal' ? 'heal' : 'damage',
      note: String(e.note || '').slice(0, 400)
    }));
    const library = (Array.isArray(raw?.library) ? raw.library : []).slice(0, 60).filter(x => x && typeof x === 'object').map(x => ({
      id: String(x.id || '').slice(0, 80), name: String(x.name || '').slice(0, 100),
      plan: normalizePlan(x.plan, String(x.id || '').slice(0, 80)),
      combatants: (Array.isArray(x.combatants) ? x.combatants : []).slice(0, 60).map(t => ({
        originalId: String(t.originalId || '').slice(0, 80),
        name: String(t.name || 'Combatant').slice(0, 60), label: String(t.label || '?').slice(0, 4),
        type: String(t.type || 'custom').slice(0, 40), team: ['pc', 'ally', 'enemy'].includes(t.team) ? t.team : 'enemy',
        maxHp: Math.max(0, Math.min(999, Number(t.maxHp) || 0)), ac: t.ac === null ? null : Math.max(0, Math.min(99, Number(t.ac) || 0)),
        x: Math.max(0, Math.min(100, Number(t.x) || 50)), y: Math.max(0, Math.min(100, Number(t.y) || 50))
      })) }));
    return { plans, creatures: customCreatures, tokens: tokenState, effects, library };
  }
  function damagePreview(token, amount, type, mode, defense = {}) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    const words = text => String(text || '').toLowerCase().split(/[,;\s]+/).filter(Boolean);
    const named = field => words(defense[field]).includes(String(type || '').toLowerCase());
    const immune = mode !== 'heal' && named('immunities');
    const resistant = mode !== 'heal' && named('resistances');
    const vulnerable = mode !== 'heal' && named('vulnerabilities');
    const factor = immune ? 0 : (resistant ? .5 : 1) * (vulnerable ? 2 : 1);
    let adjusted = immune ? 0 : value;
    if (resistant) adjusted = Math.floor(adjusted / 2);
    if (vulnerable) adjusted *= 2;
    const tempUsed = mode === 'heal' ? 0 : Math.min(token.tempHp || 0, adjusted);
    return { adjusted, factor, tempUsed, tempHp: (token.tempHp || 0) - tempUsed,
      hp: mode === 'heal' ? Math.min(token.maxHp || 999, (token.hp || 0) + adjusted)
        : Math.max(0, (token.hp || 0) - adjusted + tempUsed) };
  }
  function inShape(mark, token) {
    if (!mark || !token || !['circle', 'square', 'cone', 'line'].includes(mark.kind)) return false;
    const p = { x: token.x, y: token.y * 2 / 3 };
    const a = { x: mark.x1, y: mark.y1 * 2 / 3 }, b = { x: mark.x2, y: mark.y2 * 2 / 3 };
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    if (mark.kind === 'circle') return Math.hypot(p.x - a.x, p.y - a.y) <= length;
    if (mark.kind === 'square') return p.x >= Math.min(a.x, b.x) && p.x <= Math.max(a.x, b.x) &&
      p.y >= Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y);
    const along = length ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / length : 0;
    const across = length ? Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / length : Infinity;
    return along >= 0 && along <= length && across <= (mark.kind === 'line' ? 1.8 : along / 2);
  }
  function pace(xp, partyLevels, terrain = '', enemyCount = 1) {
    const number = value => typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN;
    const levels = Array.isArray(partyLevels) ? Array.from(partyLevels, number) : [];
    if (!levels.length || levels.some(level => !Number.isInteger(level) || level < 1 || level > 20))
      return { label: 'Unknown', note: 'Confirm every party member’s level from 1 to 20 before using the estimate.' };
    const counts = number(enemyCount), baseXp = number(xp);
    if (!Number.isSafeInteger(counts) || counts < 0 || !Number.isFinite(baseXp) || baseXp < 0 || baseXp > Number.MAX_SAFE_INTEGER / 5)
      return { label: 'Unknown', note: 'Confirm a nonnegative XP total and a whole number of contributing enemies before using the estimate.' };
    if (!counts || !baseXp) return { label: 'No combat XP', note: 'Use the scene objective, hazards, and story consequences for pacing.' };
    // Printed and PDF pages match in the local 2014 DMG: thresholds p. 82, party size p. 83.
    const byLevel = {
      1:[25,50,75,100], 2:[50,100,150,200], 3:[75,150,225,400], 4:[125,250,375,500],
      5:[250,500,750,1100], 6:[300,600,900,1400], 7:[350,750,1100,1700], 8:[450,900,1400,2100],
      9:[550,1100,1600,2400], 10:[600,1200,1900,2800], 11:[800,1600,2400,3600], 12:[1000,2000,3000,4500],
      13:[1100,2200,3400,5100], 14:[1250,2500,3800,5700], 15:[1400,2800,4300,6400], 16:[1600,3200,4800,7200],
      17:[2000,3900,5900,8800], 18:[2100,4200,6300,9500], 19:[2400,4900,7300,10900], 20:[2800,5700,8500,12700]
    };
    const limits = [0,1,2,3].map(index => levels.reduce((sum, level) => sum + byLevel[level][index], 0));
    const multipliers = [.5,1,1.5,2,2.5,3,4,5];
    const tier = counts === 1 ? 1 : counts === 2 ? 2 : counts <= 6 ? 3 : counts <= 10 ? 4 : counts <= 14 ? 5 : 6;
    const adjustedTier = tier + (levels.length < 3 ? 1 : levels.length >= 6 ? -1 : 0);
    const multiplier = multipliers[adjustedTier], adjustedXp = baseXp * multiplier;
    const label = adjustedXp >= limits[3] ? 'Deadly' : adjustedXp >= limits[2] ? 'Hard' : adjustedXp >= limits[1] ? 'Medium' : adjustedXp >= limits[0] ? 'Easy' : 'Below Easy';
    return { label, baseXp, adjustedXp, multiplier, partySize: levels.length, enemyCount: counts,
      thresholds: { easy:limits[0], medium:limits[1], hard:limits[2], deadly:limits[3] }, book:'dmg', page:82,
      note: `${baseXp} base XP × ${multiplier} for ${counts} contributing foes = ${adjustedXp} adjusted XP; ${levels.length} characters. 2014 DMG pp. 82–85, levels 1–20. Adjusted XP estimates danger only; award base XP. ${terrain ? `Terrain: ${terrain}. ` : ''}Review resources, surprise, special abilities, objectives, and escape routes. Exclude insignificant foes from the count and assess separate waves separately; this is advice, not a guarantee.` };
  }
  globalThis.ECHO_COMBAT_DATA = { CREATURES, PLANS, ENCOUNTER_PAGES, expectedScene, creatureDefense, creatureSaveBonus,
    blank, normalizePlan, normalizeCombat, damagePreview, inShape, pace };
})();

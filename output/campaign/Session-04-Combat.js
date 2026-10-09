(() => {
  'use strict';
  const data = globalThis.ECHO_COMBAT_DATA;
  if (!data) throw new Error('Wave Echo Cave requires the combat data library.');
  const a = (name, bonus, dice, type, range, note = '') => ({ name, bonus, dice, type, range, note });
  const sourced = (page, values) => ({
    source:`Lost Mine of Phandelver (2014), appendix B, printed p. ${page}`, book:'lmop', page,
    saves:'', skills:'', languages:'—', resistances:'', vulnerabilities:'', immunities:'', conditionImmunities:'',
    traits:[], actions:[], reactions:[], spells:[], ...values
  });
  const creatures = {
    'ochre-jelly': sourced(60, {
      name:'Ochre Jelly', size:'Large ooze', alignment:'unaligned', cr:2, xp:450, ac:8, hp:45, hitDice:'6d10+12',
      speed:'10 ft.; climb 10 ft.', abilities:[15,6,14,2,6,1], senses:'Blindsight 60 ft. (blind beyond); passive Perception 8',
      resistances:'acid', immunities:'lightning, slashing', conditionImmunities:'blinded, charmed, deafened, frightened, prone',
      traits:[{name:'Amorphous',text:'Can move through a gap as narrow as 1 inch without squeezing.'},
        {name:'Spider Climb',text:'Climbs difficult surfaces, including ceilings, without an ability check.'}],
      actions:[a('Pseudopod',4,'2d6+2','bludgeoning','Melee 5 ft.','On the same hit, add 1d6 acid. Apply the two damage types separately.'),
        a('Pseudopod · extra acid',null,'1d6','acid','Same successful pseudopod hit','Extra damage, not a second attack.')],
      reactions:[{name:'Split',text:'When a Medium or larger jelly with at least 10 current HP is subjected to lightning or slashing damage, it may use its reaction to split. It is immune to that damage. Replace it with two jellies, each one size smaller and each with half its current HP, rounded down. Create variants manually; retire the original token. Smaller jellies retain the other statistics.'}],
      variants:'Area 2: stalks the party from a dead end and seeks an isolated target. Splitting is a reaction, not healing or an automatic extra wave. Track current size and HP on every resulting token.'
    }),
    stirge:sourced(62, {
      name:'Stirge', size:'Tiny beast', alignment:'unaligned', cr:.125, xp:25, ac:14, hp:2, hitDice:'1d4',
      speed:'10 ft.; fly 40 ft.', abilities:[4,16,11,2,8,6], senses:'Darkvision 60 ft.; passive Perception 9',
      actions:[a('Blood Drain',5,'1d4+3','piercing','Melee 5 ft.','On a hit it attaches. While attached it stops attacking; at the start of each stirge turn its target loses 1d4+3 HP. Track the attached target and blood drained.'),
        a('Attached blood loss',null,'1d4+3','HP loss','Start of the attached stirge’s turn','No attack roll; this is HP loss, not a fresh piercing hit. Apply manually after checking attachment.')],
      traits:[{name:'Detaching',text:'The stirge spends 5 feet of movement to detach, doing so after draining 10 HP or if the target dies. Any creature, including the target, can use an action to detach it. Source continues on p. 63.'}],
      variants:'Area 3: ten on the 30-foot ceiling. Roll their Stealth once and compare with each unaware character’s passive Perception; do not automatically surprise anyone who is watching the ceiling.'
    }),
    'wave-skeleton':sourced(62, {
      name:'Wave Echo Skeleton', size:'Medium undead', alignment:'lawful evil', cr:.25, xp:50, ac:13, hp:13, hitDice:'2d8+4',
      speed:'30 ft.', abilities:[10,14,15,6,8,5], senses:'Darkvision 60 ft.; passive Perception 9',
      languages:'Understands languages known in life but cannot speak', vulnerabilities:'bludgeoning', immunities:'poison', conditionImmunities:'poisoned',
      actions:[a('Shortsword',4,'1d6+2','piercing','Melee 5 ft.'),a('Shortbow',4,'1d6+2','piercing','Range 80/320 ft.')],
      variants:'Area 4: nine skeletons assemble in the round after a living creature enters and fight until destroyed. The Redbrand crypt’s cloak/password exception does not apply here.'
    }),
    ghoul:sourced(58, {
      name:'Ghoul', size:'Medium undead', alignment:'chaotic evil', cr:1, xp:200, ac:12, hp:22, hitDice:'5d8',
      speed:'30 ft.', abilities:[13,15,10,7,10,6], senses:'Darkvision 60 ft.; passive Perception 10', languages:'Common',
      immunities:'poison', conditionImmunities:'charmed, poisoned',
      actions:[a('Bite',2,'2d6+2','piercing','Melee 5 ft.'),
        a('Claws',4,'2d4+2','slashing','Melee 5 ft.','A hit on a creature other than an elf or undead also requires DC 10 Constitution save or paralysis for 1 minute. Repeat at the end of each target turn; success ends it.')],
      variants:'One bite OR one claw attack, not multiattack. Three begin in area 6 and seven in area 9. Once a claw paralyzes a character, surface the repeat save and close-range critical-hit risk.'
    }),
    'wave-zombie':sourced(63, {
      name:'Wave Echo Zombie', size:'Medium undead', alignment:'neutral evil', cr:.25, xp:50, ac:8, hp:22, hitDice:'3d8+9',
      speed:'20 ft.', abilities:[13,6,16,3,6,5], saves:'Wisdom +0', senses:'Darkvision 60 ft.; passive Perception 8',
      languages:'Understands languages known in life but cannot speak', immunities:'poison', conditionImmunities:'poisoned',
      traits:[{name:'Undead Fortitude',text:'When damage reduces it to 0 HP, make a Constitution save (+3) against DC 5 + damage taken. Success leaves it at 1 HP. No save if the damage was radiant or came from a critical hit.'}],
      actions:[a('Slam',3,'1d6+1','bludgeoning','Melee 5 ft.')],
      variants:'Area 12: eight dwarven corpses rise when living creatures enter. They pursue beyond this room for no more than one round; track surviving tokens instead of replenishing them.'
    }),
    flameskull:sourced(57, {
      name:'Flameskull', size:'Tiny undead', alignment:'neutral evil', cr:4, xp:1100, ac:13, hp:40, hitDice:'9d4+18',
      speed:'0 ft.; fly 40 ft.', abilities:[1,17,14,16,10,11], skills:'Arcana +5; Perception +2',
      senses:'Darkvision 60 ft.; passive Perception 12', languages:'Common', resistances:'lightning, necrotic, piercing',
      immunities:'cold, fire, poison', conditionImmunities:'charmed, frightened, paralyzed, poisoned',
      traits:[{name:'Illumination',text:'As an action, switch between dim light for 15 feet and bright light for 15 feet plus dim light for another 15 feet.'},
        {name:'Magic Resistance',text:'Advantage on saves against spells and other magical effects.'},
        {name:'Rejuvenation',text:'If destroyed, regains all HP after 1 hour unless holy water is sprinkled on the remains or dispel magic or remove curse is cast on them. Record destruction time and treatment; do not silently respawn it when a map opens.'},
        {name:'Spellcasting',text:'5th-level caster; Intelligence, spell DC 13, spell attack +5. Needs verbal components only. Three 1st-level slots, two 2nd-level slots, one 3rd-level slot. Maintain one concentration spell at a time. Source continues on p. 58.'}],
      actions:[{name:'Multiattack',text:'Two Fire Ray attacks. Casting a spell uses its action instead.'},
        a('Fire Ray',5,'3d6','fire','Range 30 ft.'),
        a('Fireball · save damage',null,'8d6','fire','150 ft.; 20-ft. radius','Spend the sole 3rd-level slot. DC 13 Dexterity save, half on success. Review all creatures and cover in the blast; no attack roll. Spell summary: PHB 2014 p. 241.'),
        a('Magic Missile · one dart',null,'1d4+1','force','120 ft.','Three darts using a 1st-level slot; assign every dart before damage. One extra dart per slot level above 1st. Shield blocks them. PHB 2014 p. 257.'),
        a('Flaming Sphere · save damage',null,'2d6','fire','60 ft.; 5-ft.-diameter sphere','Spend a 2nd-level slot; concentration up to 1 minute. DC 13 Dexterity save, half, when the sphere is rammed into a creature or a creature ends its turn within 5 feet. Move up to 30 feet with bonus action; do not damage simply for entering its radius. PHB 2014 p. 242.')],
      reactions:[{name:'Shield',text:'Spend a 1st-level slot when hit by an attack or targeted by magic missile: +5 AC until start of next turn, including the triggering attack, and no magic missile damage. One reaction.'}],
      spells:['Cantrip: mage hand.','1st level (3 slots): magic missile, shield.','2nd level (2 slots): blur, flaming sphere. Blur uses an action, concentration up to 1 minute; sight-based attacks against it have disadvantage unless the attacker has an appropriate bypass.','3rd level (1 slot): fireball.'],
      variants:'Area 12 is a dangerous spell encounter, especially for level-3 characters. Describe the green skull before triggering a fight; support withdrawal through the channel. Fireball can be fatal. Track destroyed time, prevention of rejuvenation, remaining slots, and zombies individually.'
    }),
    mormesk:sourced(59, {
      name:'Mormesk the Wraith', size:'Medium undead', alignment:'neutral evil', cr:3, xp:700, ac:13, hp:45, hitDice:'6d8+18',
      speed:'0 ft.; fly 60 ft.', abilities:[6,16,16,12,14,15], senses:'Darkvision 60 ft.; passive Perception 12', languages:'Common, Infernal',
      resistances:'acid, cold, fire, lightning, thunder', immunities:'necrotic, poison',
      conditionImmunities:'charmed, grappled, paralyzed, petrified, poisoned, prone, restrained',
      traits:[{name:'Conditional weapon resistance',text:'Also resists bludgeoning, piercing, and slashing from nonmagical weapons that are not silvered. Check the weapon first and apply this resistance manually; magical or silvered weapons bypass it.'},
        {name:'Incorporeal Movement',text:'Can pass through an object or another creature, but cannot stop there. Use this adventure’s Mormesk block.'},
        {name:'Sunlight Sensitivity',text:'In sunlight, disadvantage on attacks and on sight-based Perception checks.'}],
      actions:[a('Life Drain',5,'3d8+3','necrotic','Melee 5 ft.','On hit, DC 13 Constitution save or the target’s maximum HP is reduced by damage taken until the target completes a long rest. If this reduces its HP maximum to 0, it dies. Record the original maximum and reduction manually.')],
      variants:'This is the adventure’s CR 3, 45-HP Mormesk, not the Monster Manual wraith. It has no Create Specter action. Area 14 supports bargaining before anyone harms it or takes its possessions.'
    }),
    spectator:sourced(62, {
      name:'Spectator', size:'Medium aberration', alignment:'lawful neutral', cr:3, xp:700, ac:14, hp:39, hitDice:'6d8+12',
      speed:'0 ft.; fly 30 ft. (hover)', abilities:[8,14,14,13,14,11], skills:'Perception +6',
      senses:'Darkvision 120 ft.; passive Perception 16', languages:'Deep Speech, Undercommon; telepathy 100 ft.', conditionImmunities:'prone',
      traits:[{name:'Hover',text:'Hovers while alive.'},{name:'Telepathy',text:'Can communicate with any creature within 100 feet that understands a language.'}],
      actions:[a('Bite',1,'1d4-1','piercing','Melee 5 ft.'),
        {name:'Eye Rays',text:'Use two different rays, each at a visible creature within 90 feet. A ray can be used only once per turn. Choose targets and resolve each save separately; bite is a separate action choice.'},
        {name:'Confusion Ray',text:'DC 13 Wisdom save. On failure, no reactions until the end of the target’s next turn; on that turn it cannot move and uses its action for a melee or ranged attack against a randomly determined creature in range. If it cannot attack, it does nothing.'},
        {name:'Paralyzing Ray',text:'DC 13 Constitution save or paralyzed for 1 minute. Repeat at each target turn end; success ends it.'},
        {name:'Fear Ray',text:'DC 13 Wisdom save or frightened for 1 minute. Repeat at each target turn end, with disadvantage if the spectator is visible; success ends it.'},
        a('Wounding Ray',null,'3d10','necrotic','Visible target within 90 ft.','DC 13 Constitution save, half damage on success. Counts as one of the two distinct eye rays.'),
        {name:'Create Food and Water',text:'Creates enough food and water to sustain itself for 24 hours.'}],
      reactions:[{name:'Spell Reflection',text:'If it saves successfully against a spell or a spell attack misses it, it may choose another creature it can see within 30 feet. The spell affects that creature instead of the spectator. Resolve that creature’s own attack/save as applicable; do not automatically mark it hit. Costs its reaction.'}],
      variants:'Area 15: speak first. It attacks if someone tries to remove items. DC 15 Deception can convince it the party are authorized workers dismissing it; success sends it home. Blinding it also makes it leave in this specific room. Do not treat it as an unavoidable boss.'
    }),
    'wave-spider':sourced(58, {
      name:'Nezznar’s Giant Spider', size:'Large beast', alignment:'unaligned', cr:1, xp:200, ac:14, hp:26, hitDice:'4d10+4',
      speed:'30 ft.; climb 30 ft.', abilities:[14,16,12,2,11,4], skills:'Stealth +7',
      senses:'Blindsight 10 ft.; darkvision 60 ft.; passive Perception 10',
      traits:[{name:'Spider Climb',text:'Climbs difficult surfaces, including ceilings, without checks.'},
        {name:'Web Sense',text:'While touching a web, knows the exact location of any other creature touching the same web.'},
        {name:'Web Walker',text:'Ignores movement restrictions caused by webbing.'}],
      actions:[a('Bite',5,'1d8+3','piercing','Melee 5 ft.','Also DC 11 Constitution save against 2d8 poison, half on success. If the poison reduces the target to 0 HP, it is stable and poisoned for 1 hour, paralyzed while poisoned this way.'),
        a('Bite · poison save damage',null,'2d8','poison','Same bite hit','DC 11 Constitution save, half on success. Extra damage, not a second attack.'),
        {name:'Web (Recharge 5–6)',bonus:5,dice:'',type:'restrained',range:'30/60 ft.',note:'A hit restrains. An action and DC 12 Strength check escape. Web AC 10, HP 5; vulnerable to fire, immune to bludgeoning, poison, psychic. Roll recharge at start of each spider turn after use.'}],
      variants:'Area 19: four defend Nezznar to the death. If alerted, hide behind pillars; roll Stealth, then try webs before closing. These are not Thundertree’s spiders.'
    }),
    vhalak:{...data.CREATURES.doppelganger, name:'Vhalak', source:'Lost Mine of Phandelver (2014), pp. 49–50; appendix B pp. 56–57',book:'lmop',page:56,
      traits:[{name:'Shapechanger',text:'Action to take a Small or Medium humanoid form it has seen, or return to its natural form. Only size changes its statistics. Equipment does not transform; death restores its natural form.'},
        {name:'Ambusher',text:'Advantage on attack rolls against a surprised creature.'},
        {name:'Surprise Attack',text:'When it surprises a creature and hits that creature during the first combat round, add 3d6 damage.'}],
      actions:[{name:'Multiattack',text:'Two melee attacks.'},a('Slam',6,'1d6+4','bludgeoning','Melee 5 ft.'),
        {name:'Read Thoughts',text:'Action: read one creature’s surface thoughts within 60 feet while concentrating. Three feet of wood/dirt, two feet of stone, two inches of metal or a thin lead sheet blocks it. While reading, advantage on Insight, Deception, Intimidation and Persuasion checks against that creature. This does not reveal unknown memories or secretly change a player’s decisions.'}],
      variants:'Area 18: male drow disguise. When two or more of its three bugbears are killed, it tries to retreat to area 19. If it gets there, it impersonates Nundro as false hostage leverage. Move this same token; never create a second Vhalak or treat the impersonator as the real captive.'},
    'nundro-commoner':sourced(56, {
      name:'Nundro · commoner reference', size:'Medium humanoid (dwarf)', alignment:'not specified', cr:0, xp:10, ac:10, hp:4, hitDice:'1d8',
      speed:'30 ft. (commoner reference)', abilities:[10,10,10,10,10,10], senses:'Passive Perception 10', languages:'Common (commoner reference)',
      actions:[a('Club · if equipped',2,'1d4','bludgeoning','Melee 5 ft.','The captive is not stated to have a weapon; supply one before using this action.')],
      variants:'LMoP p. 50 identifies Nundro as a dwarf commoner, bound and unconscious in area 20. His current HP is not specified; 4 is the commoner maximum, not his established rescue health. Add as an ally only after the DM chooses current condition/HP, checks equipment, and confirms the real Nundro rather than Vhalak. No captive token is deployed automatically.'
    }),
    nezznar:sourced(59, {
      name:'Nezznar the Black Spider', size:'Medium humanoid (elf)', alignment:'neutral evil', cr:2, xp:450, ac:11, hp:27, hitDice:'6d8',
      speed:'30 ft.', abilities:[9,13,10,16,14,13], saves:'Intelligence +5; Wisdom +4', skills:'Arcana +5; Perception +4; Stealth +3',
      senses:'Darkvision 120 ft.; passive Perception 14', languages:'Elvish, Undercommon',
      traits:[{name:'Mage Armor',text:'Base AC 11; AC 14 while mage armor is active. Cast using a 1st-level slot, lasts 8 hours, no concentration. Set AC to 14 only after recording the cast and spending the slot.'},
        {name:'Fey Ancestry',text:'Advantage on saves against being charmed; magic cannot put him to sleep.'},
        {name:'Sunlight Sensitivity',text:'Disadvantage on attacks while either he or his target is in sunlight.'},
        {name:'Innate Spellcasting',text:'No material components: dancing lights at will; darkness and faerie fire each once per day. Faerie fire save DC 12. These spells require concentration; they do not stack with invisibility, suggestion, web, or spider climb.'},
        {name:'Wizard Spellcasting',text:'4th-level caster; Intelligence, spell save DC 13, spell attack +5. Four 1st-level and three 2nd-level slots. One concentration spell at a time.'},
        {name:'Spider Staff',text:'Attuned; 10 charges. While held, use an action for spider climb (1 charge) or web (2 charges; DC 15); no components. Regains 1d6+4 charges at dusk. If the last charge is spent, roll d20; on 1 the staff crumbles. Weapon hits add 1d6 poison. Source: LMoP p. 53.'}],
      actions:[a('Spider Staff',1,'1d6-1','bludgeoning','Melee 5 ft.','Add 1d6 poison to the same hit. Weapon attack, not a spell.'),
        a('Staff · extra poison',null,'1d6','poison','Same successful staff hit','No saving throw is specified for this staff’s extra weapon damage.'),
        a('Ray of Frost',5,'1d8','cold','Range 60 ft.','On a hit, target speed reduced by 10 ft. until start of Nezznar’s next turn. Level-4 caster: one damage die. PHB 2014 p. 271.'),
        a('Shocking Grasp',5,'1d8','lightning','Touch','Advantage against metal armor; on hit target cannot take reactions until start of its next turn. PHB 2014 p. 275.'),
        a('Magic Missile · one dart',null,'1d4+1','force','120 ft.','Three darts using a 1st-level slot; four at 2nd level. Assign each dart before damage. Shield blocks them. PHB 2014 p. 257.'),
        a('Potion of Healing',null,'2d4+2','healing','Self','One potion; use the campaign’s 2014 action cost unless a table ruling overrides it. LMoP p. 53.')],
      reactions:[{name:'Shield',text:'Spend a 1st-level slot when hit by an attack or targeted by magic missile: +5 AC until start of next turn, including the triggering attack, and no magic missile damage. One reaction.'}],
      spells:['Cantrips: mage hand, ray of frost, shocking grasp; innate dancing lights.',
        '1st level (4 slots): mage armor, magic missile, shield.',
        '2nd level (3 slots): invisibility (action; concentration up to 1 hour; ends when the target attacks or casts a spell), suggestion (action; DC 13 Wisdom; concentration up to 8 hours; a reasonable course of activity for a creature that hears and understands him; harmful demands fail).',
        'Innate 1/day each: darkness (action; concentration up to 10 minutes) and faerie fire (action; DC 12 Dexterity; concentration up to 1 minute). Staff: spider climb (concentration up to 1 hour) and web (concentration up to 1 hour, DC 15 Dexterity to avoid restraint; action DC 15 Strength to break free).'],
      variants:'An alerted Nezznar casts invisibility and stays near the table; record the slot and concentration. He joins on the round after the spiders attack. He has no misty step or teleport ability. Escape needs a reachable route, movement and appropriate checks. He understands Elvish and Undercommon; establish how parley is understood. Creature facts are published; proposed choices and outcomes in the encounter plan are DM options.'
    })
  };
  Object.assign(data.CREATURES, creatures);

  const tokenSpecs = [];
  const add = (room, type, count, name, label, hp = data.CREATURES[type].hp) => {
    const result = [];
    for (let i=1; i<=count; i++) {
      const id = `s4-wave-${room}-${type}-${i}`;
      tokenSpecs.push({id,name:count === 1 ? name : `${name} ${i}`,label:count === 1 ? label : `${label}${i}`,type,team:'enemy',maxHp:hp,encounter:`wave-${room}`});
      result.push(id);
    }
    return result;
  };
  const roster = {
    2:add(2,'ochre-jelly',1,'Ochre Jelly','OJ'),
    3:add(3,'stirge',10,'Stirge','St'),
    4:add(4,'wave-skeleton',9,'Guardroom Skeleton','Sk'),
    6:add(6,'ghoul',3,'South Barracks Ghoul','Gh'),
    8:[],
    9:add(9,'ghoul',7,'Great Cavern Ghoul','Gh'),
    11:add(11,'bugbear',5,'North Barracks Bugbear','BB'),
    12:[...add(12,'wave-zombie',8,'Smelter Zombie','Z'),...add(12,'flameskull',1,'Flameskull','FS')],
    14:add(14,'mormesk',1,'Mormesk','MW'),
    15:add(15,'spectator',1,'Forge Guardian','FG'),
    18:[...add(18,'bugbear',3,'Collapsed Cavern Bugbear','BB'),...add(18,'vhalak',1,'Drow overseer','DO')],
    19:[...add(19,'nezznar',1,'Nezznar','NZ'),...add(19,'bugbear',2,'Temple Bugbear','BB'),...add(19,'wave-spider',4,'Nezznar’s Spider','Sp')]
  };
  const names = {2:'Mine tunnels',3:'Old entrance',4:'Old guardroom',6:'South barracks',8:'Fungi cavern',9:'Great cavern',11:'North barracks',12:'Smelter cavern',14:'Mormesk',15:'Forge guardian',18:'Collapsed cavern',19:'Nezznar'};
  const notes = {
    2:'One stalking ochre jelly. Lightning and slashing can trigger its Split reaction; use current HP.',
    3:'Ten stirges on the ceiling. Check awareness individually; attached blood loss happens at the start of each stirge’s turn.',
    4:'Nine skeletons assemble the round after a living creature enters; no cloak/password exception.',
    6:'Three hungry ghouls. Claw paralysis has an end-of-turn repeat save.',
    8:'Poison-gas hazard, no creature XP. Crossing disturbs it; DC 11 Constitution, 3d6 poison and poisoned for 10 minutes on failure.',
    9:'Seven ghouls on the western ledge react to light or noise. Ten-foot escarpments and stairs matter.',
    11:'Five loyal bugbears; eastern door barricaded. Listening can warn the party.',
    12:'Eight zombies and one flameskull. Fireball and one-hour rejuvenation require deliberate tracking.',
    14:'Adventure-specific 45-HP Mormesk. Bargain before harming him or stealing; maximum-HP drain must be recorded.',
    15:'Spectator parley is possible. DC 15 Deception can release it; do not automatically start combat.',
    18:'Three bugbears and Vhalak. Two bugbears begin in the rift; Vhalak may warn Nezznar after two bugbears die.',
    19:'Nezznar, two temple bugbears, four giant spiders. Existing area-18 survivors may join after three rounds; never duplicate them.'
  };
  const encounters = Object.keys(roster).map(room=>({id:`wave-${room}`,name:`Wave Echo ${room} · ${names[room]}`,note:notes[room]}));
  const waves = (room, note) => [{name:names[room],tokenIds:roster[room],note}];
  const plans = {
    'wave-2':{terrain:'Intersecting six-foot-high mine tunnels and dead ends; jelly can climb walls and ceilings.',objective:'Navigate the mine while keeping the group together.',
      starting:'One ochre jelly lurks in a dead end, then stalks a lone target.',waves:waves(2,'Keep hidden until seen. After a Split reaction, replace the original with two smaller variants at half current HP each.'),
      reinforcements:'Only Split descendants actually created at the table. No new full-health jellies.',nonCombat:'Scout together, avoid the ooze, close distance carefully, or withdraw faster than its 10-foot speed.',
      morale:'Predatory ooze seeks isolated food.',retreat:'Known passages back toward area 1.',negotiation:'No language or parley.'},
    'wave-3':{terrain:'Thirty-foot ceiling; old skeletons distract attention at floor level.',objective:'Cross or search the old entrance without losing companions to blood drain.',
      starting:'Ten stirges cling to the ceiling.',waves:waves(3,'Roll one Stealth check for the group; compare to each unaware character’s passive Perception before assigning surprise.'),
      reinforcements:'None automatic.',nonCombat:'Watch the ceiling, retreat, or remove an attached stirge with an action.',morale:'Each stirge detaches after draining 10 HP or its target dies.',
      retreat:'Back through a known tunnel; carrying attached stirges does not end blood loss.',negotiation:'Animal hunger, no negotiation.'},
    'wave-4':{terrain:'Stone bunks, broken racks, rubble; choose usable cover before placing tokens.',objective:'Leave, bypass, or defeat the undead guards.',
      starting:'Nine heaps of bones; animate in the round after a living creature enters.',waves:waves(4,'Describe bones assembling; reveal the nine existing tokens as they rise.'),
      reinforcements:'None automatic.',nonCombat:'Back away before committing, use a different passage, or use undead-specific abilities.',morale:'Fight until destroyed.',retreat:'The entry door and adjacent passages.',negotiation:'None; these are not the Redbrand crypt guardians.'},
    'wave-6':{terrain:'Old stone bunks and a central brazier; partially open door.',objective:'Cross, evade, or defeat the feeding ghouls.',
      starting:'Three ghouls feed on old remains. DC 10 Perception at the door hears cracking and crunching.',waves:waves(6,'Their first visible action is an immediate attack when they see prey; still resolve initiative normally.'),
      reinforcements:'These three belong to the broader pack but are already separate from the seven in area 9. Do not duplicate them.',
      nonCombat:'Listen, close the door, choose another route, or retreat.',morale:'Hungry undead attack living prey.',retreat:'Door and known route toward the entrance.',negotiation:'No reliable bargain.'},
    'wave-8':{terrain:'Fungi carpet the cavern; green glow illuminates the room.',objective:'Cross without succumbing to the gas; this is a hazard rather than a monster fight.',
      starting:'Most fungi harmless; crossing the carpet releases a poisonous cloud.',waves:[],
      reinforcements:'Cloud disperses after 1 minute. During that minute, living creatures ending a turn here repeat the save.',
      nonCombat:'Avoid disturbing the carpet or devise a crossing method; the DM adjudicates a specific plan without inventing a guaranteed skill bypass.',
      morale:'DC 11 Constitution; failure deals 3d6 poison and causes poisoned for 10 minutes. Success avoids both. Review immunity for each target.',
      retreat:'Move out of the cavern; leaving avoids later end-of-turn exposures but does not end an existing poisoned condition.',negotiation:'No creature to negotiate with.'},
    'wave-9':{terrain:'Two 10-foot ledges and central floor with tables; stairs connect levels. Climb DC 12 Athletics; falling 10 feet deals 1d6 bludgeoning and prone.',
      objective:'Control approaches, cross safely, or escape the pack.',starting:'Seven ghouls in the shadows of the western ledge.',waves:waves(9,'Light or noise alerts the seven; place them on the western ledge and use stairs or actual climbing.'),
      reinforcements:'Only surviving area-6 ghouls if their actual movement brings them here; there are ten in those two rooms combined initially.',
      nonCombat:'Scout in darkness, pick another route, or withdraw using the ledges.',morale:'Fight until destroyed.',retreat:'Several exits; show the route the party already knows.',negotiation:'No reliable bargain.'},
    'wave-11':{terrain:'Barracks with stone bunks and brazier. East door barricaded inside; DC 20 Strength to force it.',objective:'Pass the bugbear checkpoint or learn where their commander is.',
      starting:'Five loyal bugbears. DC 10 Perception at a door hears Goblin conversation.',waves:waves(11,'Place all five in the barracks, not as unexplained reinforcement waves.'),
      reinforcements:'No automatic replacements after defeat. Alert nearby allies only if sounds can reach them.',nonCombat:'Eavesdrop, deceive with a credible approach, bypass, capture one, or retreat.',
      morale:'Published: loyal to Nezznar. DM option: allow surrender if isolated and clearly beaten.',retreat:'West exit or breached eastern door.',
      negotiation:'They guard against undead for Nezznar. Any bribe or surrender is a table choice, not an automatic printed result.'},
    'wave-12':{terrain:'Cold furnace, bellows, ore carts and a 10-foot-wide dry channel, 5 feet below floor. No check to enter or leave channel; it leads north/east under low ceilings.',
      objective:'Survive or bypass the guardian to explore farther.',starting:'Eight dormant dwarf zombies; one visible burning skull overhead.',
      waves:waves(12,'Stage all eight corpses plus skull. Zombies rise as living creatures enter; reveal before initiative. Review fireball targets and exits.'),
      reinforcements:'Zombies do not pursue outside for more than one round. Destroyed flameskull returns to full HP in one hour unless remains are treated; track manually from a recorded time.',
      nonCombat:'Withdraw, use an alternate route, investigate the channel, or permanently quiet the skull with holy water, dispel magic or remove curse.',
      morale:'Ancient orders stop intruders from passing. No forced pursuit across the dungeon.',retreat:'Channel exits or the entry passage; moving outside does not instantly remove zombies already pursuing.',
      negotiation:'The skull follows old orders; any conversation is DM-adjudicated, not a guaranteed release phrase.'},
    'wave-14':{terrain:'Cracked doors (DC 15 Strength), burned furniture, chest, preserved books.',objective:'Learn, bargain, bypass, or defeat Mormesk without assuming his bargain is trustworthy.',
      starting:'Mormesk is unseen until he rises through the floor when a living creature enters.',waves:waves(14,'Give a chance to answer his demand before combat; use the LMoP-specific CR 3 block.'),
      reinforcements:'No Create Specter action and no automatic summoned army.',
      nonCombat:'Before harming him or taking property, offer something valuable to a wizard and succeed at DC 10 Persuasion. A gift allows books and secret-map study.',
      morale:'Protects his treasure. Does not part with the wooden pipe; will trade coins and gems for killing the spectator.',retreat:'Exit before escalating, but an incorporeal creature is not stopped by a shut door.',
      negotiation:'Magic, scrolls, spellbooks and arcane knowledge can interest him. Track the exact promise; the spectator also has a peaceful solution.'},
    'wave-15':{terrain:'Damaged workshop, green-flame brazier, tables and a north room. North door DC 15 Strength; west doors ajar.',
      objective:'Gain access to the Forge and decide the guardian’s fate.',starting:'One spectator guarding the magic items, willing to communicate telepathically.',
      waves:waves(15,'Do not auto-attack; guardian attacks if someone tries to remove items. Resolve two different eye rays if combat begins.'),
      reinforcements:'None automatic.',nonCombat:'DC 15 Deception: claim to be authorized wizards or miners sent to release it. Success sends it home. In this room it also leaves if blinded.',
      morale:'Guards its assignment while believing the mine remains in operation.',retreat:'Withdraw without taking items.',
      negotiation:'Discuss its task and authority. Being polite does not itself end the assignment. Protect the peaceful option from Mormesk’s demand.'},
    'wave-18':{terrain:'Twenty-foot rift; ropes on stakes at west edge. Rope climb DC 10 Athletics; failure by 5 or more falls for 1d6 per 10 feet and prone.',
      objective:'Cross, negotiate with, or defeat Nezznar’s excavation crew.',starting:'Three bugbears: two in the rift clearing rubble and one guarding above. Vhalak supervises disguised as a male drow.',
      waves:waves(18,'Start two bugbears at elevation −20 ft. They must climb their existing ropes before joining the upper fight.'),
      reinforcements:'If two or more bugbears die, Vhalak tries to retreat to area 19. Move the survivor; do not spawn another Vhalak in the temple.',
      nonCombat:'Scout the crew, cross via stream/old streambed, parley under a credible disguise, or retreat.',
      morale:'Vhalak values warning Nezznar over a losing fight.',retreat:'Vhalak toward 19 if route open; party through known passages or the stream.',
      negotiation:'Vhalak can read thoughts and impersonate; record which identities the party actually verifies.'},
    'wave-19':{terrain:'Six pillars, table, campsite, statue. Removing either fake emerald triggers collapse: everyone in room DC 15 Dexterity, 4d10 bludgeoning and prone on failure, half and no prone on success.',
      objective:'Stop the Black Spider, discover Nundro’s prison, and determine the mine’s immediate future.',
      starting:'Nezznar, two bugbears and four giant spiders. If alerted, spiders hide behind pillars and Nezznar casts invisibility near the table; spend one 2nd-level slot.',
      waves:waves(19,'Spiders try webs before biting. Alerted Nezznar joins the round after they attack; invisibility is concentration and ends when he attacks or casts a spell.'),
      reinforcements:'Only living area-18 occupants still there and able to hear arrive after 3 rounds, immediately after the spiders in initiative. Move their existing tokens and preserve HP. A Vhalak already here may impersonate Nundro.',
      nonCombat:'Nezznar may question them, offer false surrender, or propose a temporary alliance against the undead. The book expects betrayal after they cease being useful; players can secure a real surrender.',
      morale:'DM option: seek a bargaining advantage or withdrawal when outmatched; his spiders defend him to the death.',
      retreat:'DM option: invisibility or staff spider climb and an actually open route. Neither grants teleportation; concentration and remaining slots/charges still matter. Failed escape leaves capture or combat possible.',
      negotiation:'He admits being the Black Spider and using Redbrands/Cragmaws. Keep exact hostage claims separate from proof. Vhalak’s impersonation is not the real Nundro. After capture, specify escort and guards before any Halia complication.'}
  };
  Object.assign(data.PLANS, plans);
  Object.assign(data.ENCOUNTER_PAGES, {'wave-2':44,'wave-3':44,'wave-4':44,'wave-6':45,'wave-8':45,'wave-9':46,'wave-11':46,'wave-12':46,'wave-14':47,'wave-15':48,'wave-18':49,'wave-19':49});
  const sceneForEncounter = Object.fromEntries(Object.keys(roster).map(room=>[`wave-${room}`,
    ({9:'lmop-map-wave-great-cavern',12:'lmop-map-wave-smelter',15:'lmop-map-wave-forge',19:'lmop-map-wave-temple'})[room]
    || (Number(room)<=8?'lmop-map-wave-south':Number(room)<=15?'lmop-map-wave-central':'lmop-map-wave-north')]));
  const resources = {
    's4-wave-12-flameskull-1':[{name:'1st-level slots',current:3,max:3},{name:'2nd-level slots',current:2,max:2},{name:'3rd-level slots',current:1,max:1}],
    's4-wave-19-nezznar-1':[{name:'1st-level slots',current:4,max:4},{name:'2nd-level slots',current:3,max:3},{name:'Spider staff charges',current:10,max:10},
      {name:'Innate darkness',current:1,max:1},{name:'Innate faerie fire',current:1,max:1},{name:'Healing potion',current:1,max:1}]
  };
  globalThis.ECHO_SESSION4_COMBAT = {
    version:1, encounters, tokenSpecs, sceneForEncounter, resources,
    rescueAlly:{id:'s4-nundro',name:'Nundro',label:'NU',type:'nundro-commoner',team:'ally',maxHp:4,ac:10,currentHp:null,note:'Confirm health and equipment on rescue; do not auto-deploy or assign 0 HP.'},
    sequences:{flameskull:['Fire Ray','Fire Ray'],vhalak:['Slam','Slam']},
    source:{book:'lmop',pages:[44,45,46,47,48,49,50,53,56,57,58,59,60,62,63]},
    creatureTypes:Object.keys(creatures)
  };
})();

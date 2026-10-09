(() => {
  'use strict';
  const books = {
    phb: {
      title: 'Player’s Handbook (2014)', short: 'PHB', audience: 'player', pages: 293,
      file: '../../sources/pdfcoffee.com_dungeons-and-dragons-5th-edition-player-handbook-pdf-free.pdf',
      toc: [
        ['Character Creation', 11], ['Races', 17], ['Classes', 45], ['Personality and Background', 121],
        ['Equipment', 143], ['Customization Options', 163], ['Using Ability Scores', 173],
        ['Adventuring', 181], ['Combat', 189], ['Spellcasting', 201], ['Spell Lists', 207],
        ['Spell Descriptions', 211], ['Conditions', 290], ['Gods of the Multiverse', 293],
        ['Planes of Existence', 300]
      ]
    },
    dmg: {
      title: 'Dungeon Master’s Guide (2014)', short: 'DMG', audience: 'dm', pages: 321,
      file: '../../sources/pdfcoffee.com_dungeon-masterx27s-guide-5e-pdf-free.pdf',
      toc: [
        ['The Dungeon Master', 4], ['A World of Your Own', 9], ['Creating a Multiverse', 43],
        ['Creating Adventures', 71], ['Creating Nonplayer Characters', 89], ['Adventure Environments', 99],
        ['Between Adventures', 125], ['Treasure', 133], ['Running the Game', 235],
        ['Dungeon Master’s Workshop', 263], ['Random Dungeons', 290], ['Monster Lists', 302]
      ]
    },
    mm: { title: 'Monster Manual (2014) · private', short: 'MM', audience: 'dm', pages: 406,
      file: '../../sources/pdfcoffee.com_dnd-monster-manual-5e-pdf-free.pdf',
      toc: [['Introduction', 4], ['Bugbears', 33], ['Goblins', 165], ['Wolves', 341],
        ['Appendix A: Miscellaneous Creatures', 317], ['Appendix B: Nonplayer Characters', 342],
        ['Index of Stat Blocks', 351]] },
    xan: { title: 'Xanathar’s Guide to Everything · private', short: 'XGtE', audience: 'dm', pages: 196,
      file: '../../sources/pdfcoffee.com_dampd-5e-xanatharx27s-guide-to-everything-pdf-free.pdf',
      toc: [['Character Options', 7], ['Rogue options', 44], ['Dungeon Master’s Tools', 77],
        ['Spellcasting guidance', 85], ['Encounter Building', 88], ['Traps Revisited', 113],
        ['Downtime Revisited', 123], ['Spells', 147], ['Catapult', 150]] },
    tasha: { title: 'Tasha’s Cauldron of Everything · private', short: 'TCoE', audience: 'dm', pages: 194,
      file: '../../sources/pdfcoffee.com_dampd-5th-tashax27s-cauldron-of-everythingpdf-pdf-free.pdf',
      toc: [['Character Options', 7], ['Monk options', 48], ['Rogue options', 62],
        ['Wizard options', 75], ['Order of Scribes', 77], ['Group Patrons', 83],
        ['Spells', 105], ['Mind Sliver', 108], ['Magic Items', 117],
        ['Dungeon Master’s Tools', 139], ['Sidekicks', 142], ['Parleying with Monsters', 148],
        ['Supernatural Regions', 150], ['Puzzles', 171]] },
    srd: {
      title: 'System Reference Document 5.1', short: 'SRD', audience: 'player', pages: 403,
      file: 'books/srd-5.1-cc.pdf',
      toc: [['Classes', 7], ['Equipment', 67], ['Playing the Game', 77], ['Spellcasting', 101],
        ['Spells', 114], ['Traps', 195], ['Magic Items', 206], ['Monsters', 261]]
    },
    lmop: { title: 'Lost Mine of Phandelver · private adventure', short: 'LMoP', audience: 'dm', pages: 64,
      file: '../../sources/pdfcoffee.com_lost-mine-of-phandelverpdf-pdf-free.pdf',
      toc: [['Introduction', 2], ['Goblin Arrows', 6], ['Cragmaw Hideout', 7],
        ['Phandalin', 14], ['Redbrand Hideout', 20], ['The Spider’s Web', 27],
        ['Cragmaw Castle', 35], ['Wave Echo Cave', 42], ['Magic Items', 52], ['Monsters', 54], ['Rules index', 64]] },
    madMage: { title: 'Dungeon of the Mad Mage · private adventure', short: 'DotMM', audience: 'dm', pages: 322,
      file: '../../sources/pdfcoffee.com_dungeon-of-the-mad-mage-29112018-pdf-free.pdf',
      toc: [['Adventure overview', 5], ['Dungeon features', 10],
        ['Level 1 · Dungeon Level', 13], ['Level 2 · Arcane Chambers', 27], ['Level 3 · Sargauth Level', 43],
        ['Level 4 · Twisted Caverns', 59], ['Level 5 · Wyllowwood', 69], ['Level 6 · Lost Level', 81],
        ['Level 7 · Maddgoth’s Castle', 95], ['Level 8 · Slitherswamp', 109], ['Level 9 · Dweomercore', 117],
        ['Level 10 · Muiral’s Gauntlet', 135], ['Level 11 · Troglodyte Warrens', 151], ['Level 12 · Maze Level', 159],
        ['Level 13 · Trobriand’s Graveyard', 171], ['Level 14 · Arcturiadoom', 179], ['Level 15 · Obstacle Course', 193],
        ['Level 16 · Crystal Labyrinth', 209], ['Level 17 · Seadeeps', 221], ['Level 18 · Vanrakdoom', 231],
        ['Level 19 · Caverns of Ooze', 243], ['Level 20 · Runestone Caverns', 253], ['Level 21 · Terminus Level', 265],
        ['Level 22 · Shadowdusk Hold', 277], ['Level 23 · Mad Wizard’s Lair', 289],
        ['Skullport', 303], ['Dungeon denizens · Appendix A', 310], ['Elder runes · Appendix B', 318],
        ['Secrets · Appendix C', 319]] },
    echo: { title: 'The Echo Below · original DM book (three-PC archive)', short: 'Echo DM archive', audience: 'dm', pages: 37,
      file: 'The-Echo-Below-DM-Book.pdf',
      toc: [['Campaign premise', 3], ['Opening', 5], ['Waterdeep hub', 10],
        ['Satellite adventures', 21], ['Undermountain', 28], ['Finale', 32],
        ['Recovered documents', 34], ['DM tools', 36]] },
    echoPlayer: { title: 'The Echo Below · Player guide', short: 'Echo Player', audience: 'player', pages: 5,
      file: 'The-Echo-Below-Player-Guide.pdf', toc: [['Campaign introduction', 1], ['Player guide', 2]] },
    trista: { title: 'Trista Beginner Handbook · level 2 archive', short: 'Trista', audience: 'player', pages: 18,
      file: '../pdf/Trista-Beginner-Handbook.pdf', toc: [['Level 2 quick reference (archived)', 1], ['Level 2 Focus actions', 2], ['Original level 1 guide', 3]] },
    tristaSheet: { title: 'Trista · original character sheet', short: 'Trista sheet', audience: 'player', pages: 4,
      file: '../../sources/PanikStrikez25_171372308.pdf', toc: [['Statistics', 1], ['Features and equipment', 2]] },
    ringgo: { title: 'Ringgo Player Guide', short: 'Ringgo', audience: 'player', pages: 12,
      file: '../pdf/Ringgo-Paul-Player-Guide.pdf', toc: [['Quick reference', 2], ['Combat', 5], ['Rules basis', 12]] },
    ringgoSheet: { title: 'Ringgo · level 3 character sheet', short: 'Ringgo sheet', audience: 'player', pages: 5,
      file: 'books/ringgo-paul-level-3-sheet.pdf', toc: [['Statistics', 1], ['Assassin features and equipment', 2], ['Additional equipment', 3], ['Tiefling spells', 5]] },
    dracuseth: { title: 'Dracuseth Character Sheet', short: 'Dracuseth', audience: 'player', pages: 3,
      file: '../pdf/Dracuseth-Maw-of-Flames-Character-Sheet.pdf', toc: [['Stats and attacks', 1], ['Spells and features', 2], ['Roleplay', 3]] },
    donavan: { title: 'Donavan Player Handout', short: 'Donavan', audience: 'player', pages: 7,
      file: '../pdf/Donavan-Kemp-Player-Handout.pdf', toc: [['Quick reference', 2], ['Character story', 3]] },
    donavanSheet: { title: 'Donavan · level 3 character sheet', short: 'Donavan sheet', audience: 'player', pages: 5,
      file: 'books/donavan-kemp-level-3-sheet.pdf', toc: [['Statistics', 1], ['Features and equipment', 2], ['Spells', 4], ['More spells', 5]] },
    pebble: { title: 'Pebble · player handout · level 2 archive', short: 'Pebble', audience: 'player', pages: 6,
      file: '../pdf/Pebble-Player-Handout.pdf', toc: [['Level 2 quick reference (archived)', 1], ['Level 2 turn guide', 2], ['Original level 1 handout', 3]] },
    aldric: { title: 'Aldric Vane · player handout', short: 'Aldric', audience: 'player', pages: 3,
      file: '../pdf/Aldric-Vane-Player-Handout.pdf', toc: [['Character and introduction', 1], ['Level 1 numbers', 2], ['Spells and gear', 3]] }
  };
  const rows = [
    // id | title | category | book | printed page | tags | table summary | audience
    ['ability-checks','Ability checks','rule','phb',174,'skills, dc, ability score','Roll a d20 and add the relevant ability modifier and proficiency bonus if applicable. The DM compares the total with the task’s DC.'],
    ['proficiency','Proficiency bonus','rule','phb',173,'skills, attacks, saving throws, training','Add proficiency once when a feature, skill, tool, weapon, or save says the character is proficient. Expertise can double it for the specified use.'],
    ['advantage','Advantage and disadvantage','rule','phb',173,'d20, two dice','Roll two d20s and use the higher for advantage or lower for disadvantage. Multiple sources do not stack; both together cancel.'],
    ['saving-throws','Saving throws','rule','phb',179,'resist, spells, hazards','Roll a d20 with the named ability modifier, plus proficiency if trained in that save. Compare with the effect’s DC.'],
    ['passive-checks','Passive checks','rule','phb',175,'passive perception, hidden','Start with 10 plus the usual check modifiers; apply +5 for advantage or -5 for disadvantage when relevant.'],
    ['contests','Contested checks','rule','phb',174,'opposed, grapple, shove','Each side rolls the relevant ability check. The higher result wins; a tie leaves the situation as it was.'],
    ['surprise','Surprise','rule','phb',189,'ambush, first round, reaction','The DM identifies creatures that did not notice a threat. A surprised creature cannot move or act on its first turn and cannot react until that turn ends.'],
    ['initiative','Initiative','rule','phb',189,'turn order, dexterity','At combat start, each creature rolls a Dexterity check; the DM resolves ties. Turns proceed in that order each round.'],
    ['turn-actions','What you can do on a turn','rule','phb',189,'action, movement, interaction','A turn normally offers movement and one action. Some features grant a bonus action; one simple object interaction is commonly free.'],
    ['bonus-actions','Bonus actions','rule','phb',189,'action economy','A creature gets a bonus action only when a rule or feature grants one; it can take at most one on its turn.'],
    ['reactions','Reactions','rule','phb',190,'opportunity attack, action economy','A reaction responds to a trigger. Once used, it is unavailable until the start of that creature’s next turn.'],
    ['attack-action','Attack action','rule','phb',192,'combat action, weapon, unarmed','The Attack action makes one attack unless a feature grants more. You can substitute a grapple or shove for one melee attack when its requirements are met.'],
    ['dash-action','Dash action','rule','phb',192,'combat action, movement','Dash adds movement equal to your speed for the current turn after modifiers.'],
    ['disengage-action','Disengage action','rule','phb',192,'combat action, opportunity attack','After Disengage, your movement does not provoke opportunity attacks for the rest of the turn.'],
    ['dodge-action','Dodge action','rule','phb',192,'combat action, defense','Until your next turn begins, attackers you can see have disadvantage against you and you have advantage on Dexterity saves. The benefit ends if you are incapacitated or your speed drops to 0.'],
    ['help-action','Help action','rule','phb',192,'combat action, assist','Help can aid an ability check or give an ally advantage on an attack against a creature within 5 feet of you before your next turn.'],
    ['hide-action','Hide action','rule','phb',192,'combat action, stealth','Make a Dexterity (Stealth) check when the DM says hiding is possible. Remaining hidden depends on sight, noise, and your actions.'],
    ['ready-action','Ready action','rule','phb',193,'combat action, reaction, trigger','Choose a perceptible trigger and an action or movement to take when it happens. Using it costs your reaction. A readied spell is cast now, held with concentration, and released by the reaction.'],
    ['search-action','Search action','rule','phb',193,'combat action, perception, investigation','The DM chooses the ability check for an active search, commonly Perception or Investigation.'],
    ['use-object-action','Use an Object action','rule','phb',193,'combat action, interaction','Use this action when an object needs an action rather than the one simple interaction available during movement or an action.'],
    ['two-weapon-fighting','Two-weapon fighting','rule','phb',195,'bonus action, light weapons','After attacking with a light melee weapon, a different light melee weapon can make a bonus-action attack. Do not add the ability modifier to that damage unless it is negative or a feature says otherwise.'],
    ['opportunity-attacks','Opportunity attacks','rule','phb',195,'leaving reach, reaction','When a visible hostile creature leaves your reach, you can usually use your reaction for one melee attack just before it leaves. Disengage avoids this trigger.'],
    ['cover','Cover','rule','phb',196,'half cover, three quarters, total','Half cover gives +2 AC and Dexterity saves; three-quarters cover gives +5; total cover generally prevents direct targeting.'],
    ['visibility','Vision and light','rule','phb',183,'darkness, dim light, darkvision','Light level and senses affect what can be seen. Dim light hampers sight-based Perception; darkness blocks ordinary vision. Check the creature’s senses.'],
    ['hiding','Hiding and unseen attackers','rule','phb',177,'stealth, invisible, hidden','The DM decides whether hiding is possible. An unseen attacker usually has advantage; attacks against a target you cannot see usually have disadvantage.'],
    ['difficult-terrain','Difficult terrain','rule','phb',182,'movement, map','Each foot of movement through difficult terrain costs one extra foot.'],
    ['movement-modes','Climbing, swimming, and crawling','rule','phb',182,'movement, speed','Each foot climbed, swum, or crawled costs one extra foot of movement unless the creature has the appropriate special speed. Difficult terrain can add another foot.'],
    ['jumping','Jumping','rule','phb',182,'movement, long jump, high jump','Jump distance depends on Strength and whether the creature moves at least 10 feet first. Each foot jumped still uses movement.'],
    ['falling','Falling','rule','phb',183,'damage, prone','Falling causes 1d6 bludgeoning damage per 10 feet, to a maximum of 20d6; a creature usually lands prone unless it avoids the damage.'],
    ['short-rest','Short rest','rule','phb',186,'hit dice, recovery','A short rest lasts at least one hour. Characters may spend Hit Dice to recover HP and regain features that specify a short-rest recharge.'],
    ['long-rest','Long rest','rule','phb',186,'sleep, spell slots, hit dice','A long rest lasts at least eight hours, restores all HP and up to half the character’s total Hit Dice (minimum one), and refreshes specified resources. A creature normally needs at least 1 HP to begin and cannot benefit more than once per 24 hours.'],
    ['concentration','Concentration','rule','phb',203,'spells, damage, save','Only one concentration effect can be maintained at a time. Taking damage calls for a Constitution save with DC 10 or half the damage, whichever is higher.'],
    ['spell-components','Spell components','rule','phb',203,'verbal, somatic, material','Check V, S, and M requirements before casting. A focus or component pouch may replace ordinary material components, but not a listed costly component.'],
    ['spell-slots','Spell slots','rule','phb',201,'casting, cantrips','Casting a leveled spell normally expends a slot of its level or higher. Cantrips do not expend slots.'],
    ['bonus-spell','Bonus-action spells (2014)','rule','phb',202,'spellcasting, bonus action, cantrip','If you cast a spell as a bonus action, the only other spell you can cast on that turn is a cantrip with casting time 1 action.'],
    ['ritual-casting','Ritual casting','rule','phb',201,'spells, casting time, slots','A ritual adds 10 minutes to casting time and uses no spell slot; the caster needs a feature that permits ritual casting.'],
    ['spell-targets','Spell targets and areas','rule','phb',204,'line of effect, cover, cones','Read the spell’s target and area wording; a clear path is usually required, and cover may block an effect.'],
    ['death-saves','Death saving throws','rule','phb',197,'zero hp, dying','At 0 HP, roll at the start of each turn: three successes stabilize; three failures mean death. A natural 1 counts as two failures; a natural 20 restores 1 HP. Damage at 0 HP causes failed saves.'],
    ['healing-zero','Healing at 0 HP','rule','phb',197,'unconscious, death saves','Healing that restores any HP ends unconsciousness from being at 0 HP and resets death-save successes and failures.'],
    ['temporary-hp','Temporary hit points','rule','phb',198,'damage, stacking','Temporary HP absorbs damage before normal HP. Separate grants do not add together; choose which pool to keep.'],
    ['resistance','Resistance and vulnerability','rule','phb',197,'damage types, half, double','Resistance halves damage of its type; vulnerability doubles it. Apply other damage modifiers before halving or doubling.'],
    ['travel','Travel pace','rule','phb',181,'journey, stealth, perception','Travel pace affects distance, awareness, and whether the group can move stealthily. Record marching order and light sources.'],
    ['exhaustion','Exhaustion (2014)','condition','phb',291,'levels, rest, travel','Levels: 1 disadvantage on ability checks; 2 speed halved; 3 disadvantage on attacks and saves; 4 HP maximum halved; 5 speed 0; 6 death. Effects accumulate.'],
    ['blinded','Blinded','condition','phb',290,'sight, attacks','The creature cannot see and automatically fails sight-dependent checks. Its attacks have disadvantage; attacks against it have advantage.'],
    ['charmed','Charmed','condition','phb',290,'social, attacks','The creature cannot attack the charmer or target it with harmful abilities; the charmer gains advantage on social checks with it.'],
    ['deafened','Deafened','condition','phb',290,'hearing','The creature cannot hear and automatically fails hearing-dependent checks.'],
    ['frightened','Frightened','condition','phb',290,'fear, movement','While it can see the source of fear, the creature has disadvantage on ability checks and attack rolls and cannot willingly move closer.'],
    ['grappled','Grappled','condition','phb',290,'speed, escape','The creature’s speed becomes 0. The grapple ends if the grappler is incapacitated or the creature is moved out of reach.'],
    ['incapacitated','Incapacitated','condition','phb',290,'action, reaction','The creature cannot take actions or reactions.'],
    ['invisible','Invisible','condition','phb',291,'hidden, unseen','The creature cannot be seen without a special sense or magic; its attacks have advantage and attacks against it have disadvantage unless it is perceived by other means.'],
    ['paralyzed','Paralyzed','condition','phb',291,'critical hit, saves','The creature is incapacitated, cannot move or speak, fails Strength and Dexterity saves, and attacks against it have advantage. Nearby hits are critical.'],
    ['petrified','Petrified','condition','phb',291,'stone, incapacitated','The creature is transformed and incapacitated, cannot move or speak, and has the defensive changes listed in the condition. Check the book for the full effects.'],
    ['poisoned','Poisoned','condition','phb',292,'disadvantage','The creature has disadvantage on attack rolls and ability checks.'],
    ['prone','Prone','condition','phb',292,'standing, attacks','The creature can crawl or spend half its speed to stand. Its attacks have disadvantage; adjacent attacks against it have advantage and distant attacks have disadvantage.'],
    ['restrained','Restrained','condition','phb',292,'speed, attacks, saves','Speed is 0; the creature’s attacks have disadvantage, attacks against it have advantage, and its Dexterity saves have disadvantage.'],
    ['stunned','Stunned','condition','phb',292,'incapacitated, saves','The creature is incapacitated, cannot move, can speak only falteringly, fails Strength and Dexterity saves, and attacks against it have advantage.'],
    ['unconscious','Unconscious','condition','phb',292,'zero hp, critical hit','The creature is incapacitated, unaware, drops what it holds, falls prone, fails Strength and Dexterity saves, and nearby hits are critical.'],
    ['dm-adjudication','Using ability scores as DM','dm-tool','dmg',237,'dc, checks, consequences','Use the DMG guidance to choose whether a roll is needed and what a success or failure changes.','dm'],
    ['dm-adventures','Creating adventures','dm-tool','dmg',71,'plot, goals, scenes, pacing','Find the guide’s adventure structure, goals, locations, villains, and event guidance.','dm'],
    ['dm-social','Social interaction','dm-tool','dmg',244,'npc, attitude, conversation','Find guidance for NPC attitude, conversation, and resolving uncertain social outcomes.','dm'],
    ['dm-exploration','Exploration guidance','dm-tool','dmg',242,'travel, searching, maps','Use the DMG procedures for travel, noticing threats, mapping, and time pressure.','dm'],
    ['dm-encounter','Creating combat encounters','dm-tool','dmg',82,'difficulty, xp, party size','Use the DMG encounter-building guidance as a starting estimate, then account for terrain, resources, and party size.','dm'],
    ['dm-environments','Adventure environments','dm-tool','dmg',99,'wilderness, dungeon, weather, hazards','Find environmental guidance for dungeons, wilderness, settlements, weather, and hazards.','dm'],
    ['dm-traps','Traps','dm-tool','dmg',120,'detect, disarm, hazards','Find trap design and adjudication guidance, including signs, triggers, effects, and countermeasures.','dm'],
    ['dm-downtime','Downtime activities','dm-tool','dmg',127,'between adventures, crafting','Use these options when the party spends time between expeditions.','dm'],
    ['dm-treasure','Treasure and rewards','dm-tool','dmg',133,'loot, magic items, reward','Find treasure tables, magic items, and non-item rewards.','dm'],
    ['dm-magic-items','Magic item rules','dm-tool','dmg',135,'rarity, attunement, identification','Use the DMG entry for each item’s exact properties and the chapter’s general item rules.','dm'],
    ['dm-chases','Chases','dm-tool','dmg',252,'pursuit, complications','Use the chase procedure when movement and pursuit matter more than a stationary battle map.','dm'],
    ['dm-diseases','Diseases and poisons','dm-tool','dmg',256,'poison, illness','Find hazards and effects that may require saves, treatment, or time.','dm'],
    ['dm-improvised-damage','Improvising damage','dm-tool','dmg',249,'hazard, trap, damage severity','Use the DMG’s damage severity table when an unexpected hazard needs a damage estimate.','dm'],
    ['dm-xp','Experience points','dm-tool','dmg',260,'leveling, awards','Use the DMG’s award guidance if the campaign chooses XP instead of milestones.','dm'],
    ['echo-campaign','Echo Below campaign principles','dm-tool','echo',3,'home, mystery, choice, custom campaign','Use the custom DM book for the Echo premise, key themes, and the boundary between published adventure and campaign additions.','dm'],
    ['xan-downtime','Downtime Revisited','dm-tool','xan',123,'Waterdeep, downtime, rivals','Optional downtime and rival procedures for time between expeditions.','dm'],
    ['xan-traps','Traps Revisited','dm-tool','xan',113,'traps, complex hazards','Optional guidance for simple and complex traps.','dm'],
    ['xan-identify','Identifying a spell','dm-tool','xan',85,'spell identification, reaction, arcana','Optional guidance for recognizing a spell as it is cast or afterward.','dm'],
    ['xan-spells-grid','Spell areas on a grid','dm-tool','xan',86,'spells, grid, templates','Use the optional grid diagrams when placing an area effect.','dm'],
    ['tasha-sidekicks','Sidekicks','dm-tool','tasha',142,'ally, follower','Optional companion rules; apply only to a character the table chooses.','dm'],
    ['tasha-patrons','Group Patrons','dm-tool','tasha',83,'Waterdeep, factions, academy','Optional structure for a group patron or institution.','dm'],
    ['tasha-regions','Supernatural Regions','dm-tool','tasha',150,'Echo, atmosphere, environment','Optional inspiration for unusual regions; custom Echo facts still come from the campaign book.','dm'],
    ['donavan-catapult','Catapult','spell','xan',150,'Donavan, wizard, spell, level 1, dexterity save','Donavan’s current sheet lists this 1st-level spell. It requires a Dexterity save; check the book and prepared status before casting.'],
    ['donavan-mind-sliver','Mind Sliver','spell','tasha',108,'Donavan, wizard, cantrip, intelligence save','Previously allowed for Donavan as a character exception; his updated level 3 sheet does not list it.'],
    ['donavan-toll-the-dead','Toll the Dead','spell','xan',169,'Donavan, cleric, cantrip, wisdom save','Listed on Donavan’s updated sheet. His phone card shows the damage for an unwounded or wounded target.'],
    ['donavan-scribes','Order of Scribes','feature','tasha',77,'Donavan, wizard, subclass, level 2','Donavan’s Wizard 2 tradition on his updated level 3 character sheet.']
  ];
  const characterFeatures = [
    ['trista-martial-arts','Martial Arts · Trista','trista',6,'2024 Monk','Trista’s level-1 Monk feature follows her live sheet and 2024 guide.'],
    ['trista-focus','Focus Points · Trista','trista',10,'2024 Monk · level 2 preview','Trista does not have Focus Points at level 1. Her guide introduces them at level 2.'],
    ['dracuseth-sap','Sap · Dracuseth','dracuseth',1,'2024 Paladin · weapon mastery','Dracuseth’s current sheet gives his longsword the Sap mastery.'],
    ['dracuseth-sacred-weapon','Sacred Weapon · Dracuseth','dracuseth',1,'2024 Paladin · Channel Divinity','Use the attack bonus and duration listed on Dracuseth’s revised sheet.'],
    ['dracuseth-breath','Breath Weapon · Dracuseth','dracuseth',1,'2024 Gold Dragonborn','Use the damage, shape, uses, and save DC on Dracuseth’s current sheet.'],
    ['dracuseth-lay-on-hands','Lay On Hands · Dracuseth','dracuseth',2,'2024 Paladin · healing','Track the 20-point pool from Dracuseth’s revised sheet.'],
    ['dracuseth-smite','Divine Smite · Dracuseth','dracuseth',2,'2024 Paladin','Use the 2024 feature and free use printed on Dracuseth’s sheet.']
  ].map(([id,title,book,pdfPage,tags,summary]) => ({
    id, title, category: 'feature', book, pdfPage, tags: tags.split(' · '), summary,
    audience: 'player', edition: '2024-exception', source: `${books[book].short} guide PDF p. ${pdfPage}`,
    confidence: 'Character guide · verify live sheet'
  }));
  // Monster Manual contents page. Each entry opens the printed entry's first page;
  // use the book for the complete block and any variants on later pages.
  const monsterContents = `Aarakocra:12|Aboleth:13|Angels:15|Animated Objects:19|Ankheg:21|Azer:22|Banshee:23|Basilisk:24|Behir:25|Beholders:26|Blights:31|Bugbears:33|Bulette:34|Bullywug:35|Cambion:36|Carrion Crawler:37|Centaur:38|Chimera:39|Chuul:40|Cloaker:41|Cockatrice:42|Couatl:43|Crawling Claw:44|Cyclops:45|Darkmantle:46|Death Knight:47|Demilich:48|Demons:50|Devils:66|Dinosaurs:79|Displacer Beast:81|Doppelganger:82|Dracolich:83|Shadow Dragon:84|Dragons:86|Dragon Turtle:119|Drider:120|Dryad:121|Duergar:122|Elementals:123|Drow:126|Empyrean:130|Ettercap:131|Ettin:132|Faerie Dragon:133|Flameskull:134|Flumph:135|Fomorian:136|Fungi:137|Galeb Duhr:139|Gargoyle:140|Genies:141|Ghost:147|Ghouls:148|Giants:149|Gibbering Mouther:157|Gith:158|Gnolls:162|Deep Gnome:164|Goblins:165|Golems:167|Gorgon:171|Grell:172|Grick:173|Griffon:174|Grimlock:175|Hags:176|Half-Dragon:180|Harpy:181|Hell Hound:182|Helmed Horror:183|Hippogriff:184|Hobgoblins:185|Homunculus:188|Hook Horror:189|Hydra:190|Intellect Devourer:191|Invisible Stalker:192|Jackalwere:193|Kenku:194|Kobolds:195|Kraken:196|Kuo-toa:198|Lamia:201|Lich:202|Lizardfolk:204|Lycanthropes:206|Magmin:212|Manticore:213|Medusa:214|Mephits:215|Merfolk:218|Merrow:219|Mimic:220|Mind Flayer:221|Minotaur:223|Modrons:224|Mummies:227|Myconids:230|Nagas:233|Nightmare:235|Nothic:236|Ogres:237|Oni:239|Oozes:240|Orcs:244|Otyugh:248|Owlbear:249|Pegasus:250|Peryton:251|Piercer:252|Pixie:253|Pseudodragon:254|Purple Worm:255|Quaggoth:256|Rakshasa:257|Remorhaz:258|Revenant:259|Roc:260|Roper:261|Rust Monster:262|Sahuagin:263|Salamanders:265|Satyr:267|Scarecrow:268|Shadow:269|Shambling Mound:270|Shield Guardian:271|Skeletons:272|Slaadi:274|Specter:279|Sphinxes:280|Sprite:283|Stirge:284|Succubus and Incubus:285|Tarrasque:286|Thri-kreen:288|Treant:289|Troglodyte:290|Troll:291|Umber Hulk:292|Unicorn:293|Vampires:295|Water Weird:299|Wight:300|Will-o’-wisp:301|Wraith:302|Wyvern:303|Xorn:304|Yetis:305|Yuan-ti:307|Yugoloths:311|Zombies:315|Wolves:341`;
  const creatures = [...monsterContents.split('|'), 'Goblin:165', 'Wolf:341', 'Bugbear:33'].map(item => {
    const [name, page] = item.split(':');
    return { id: `mm-${name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-')}`,
      title: name, name, book: 'mm', printedPage: Number(page), pdfPage: Number(page) + 1,
      category: 'creature', audience: 'dm', tags: ['monster', '2014 creature'],
      source: `MM printed p. ${page}`, confidence: 'Contents page · verify individual stat block',
      summary: 'Open the private Monster Manual for complete statistics, traits, actions, and variants.' };
  });
  const appendixRows = {
    lmop: `Bugbear:56|Commoner:56|Cultist:56|Doppelganger:56|Evil Mage:57|Flameskull:57|Ghoul:58|Giant Spider:58|Goblin:58|Grick:58|Hobgoblin:59|Mormesk the Wraith:59|Nezznar the Black Spider:59|Nothic:60|Ochre Jelly:60|Ogre:60|Orc:61|Owlbear:61|Redbrand Ruffian:61|Sildar Hallwinter:61|Skeleton:62|Spectator:62|Stirge:62|Twig Blight:63|Wolf:63|Young Green Dragon:63|Zombie:63`,
    madMage: `Halaster Blackcloak:310|Champion:312|Githyanki Gish:312|Lava Child:312|Living Unseen Servant:313|Muiral:314|Neothelid:315|Shadow Assassin:316|Ulitharid:316|Werebat:317`
  };
  const appendixCreatures = Object.entries(appendixRows).flatMap(([book, list]) => list.split('|').map(item => {
    const [name, page] = item.split(':');
    return { id: `${book}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, title:name, name,
      book, printedPage:Number(page), pdfPage:Number(page)+(book === 'madMage' ? 1 : 0),
      category:'creature', audience:'dm', tags:[book === 'lmop' ? 'Lost Mine appendix B' : 'Mad Mage appendix A'],
      source:`${books[book].short} printed p. ${page}`,
      confidence:'Source page checked · interactive combat card not audited',
      summary:'Open the private adventure appendix for the complete stat block and any variants.' };
  }));
  const lmopRoomIndex = `Ambush:6|Goblin trail:7|Cave mouth:8|Goblin blind:8|Kennel:8|Steep passage:9|Overpass:10|Goblin den:10|Twin pools cave:11|Klarg’s cave:12|Phandalin:14|Stonehill Inn:15|Barthen’s Provisions:16|Lionshield Coster:16|Phandalin Miner’s Exchange:17|Alderleaf Farm:18|Shrine of Luck:18|Townmaster’s Hall:18|Redbrand confrontation:19|Redbrand cellar:20|Redbrand barracks:20|Trapped hall:21|Tresendar crypts:22|Slave pens:22|Armory:22|Storeroom and work area:22|Crevasse:23|Guard barracks:24|Common room:24|Wizard’s workshop:25|Glasstaff’s quarters:25`;
  const lmopLocations = lmopRoomIndex.split('|').map((item,index) => {
    const [title,page]=item.split(':');return { id:`lmop-location-${index+1}`,title,category:'location',book:'lmop',
      printedPage:Number(page),pdfPage:Number(page),audience:'dm',tags:['Lost Mine of Phandelver','verified scan page'],
      summary:'Open the keyed book page for room details, enemies, hazards, and treasure.',
      source:`LMoP printed p. ${page}`,confidence:'Heading and PDF page visually checked' };
  });
  const characterOptions = [
    { id: 'trista-mercy', characterId: 'pc-trista', name: 'Way of Mercy', level: 3, book: 'tasha', printedPage: 49, group: 'monk-subclass', note: 'Monk subclass choice. Trista uses a 2024 Monk sheet, so review compatibility with her player before activating.' },
    { id: 'trista-astral', characterId: 'pc-trista', name: 'Way of the Astral Self', level: 3, book: 'tasha', printedPage: 50, group: 'monk-subclass', note: 'Monk subclass choice. Trista uses a 2024 Monk sheet, so review compatibility with her player before activating.' },
    { id: 'ringgo-steady', characterId: 'pc-ringgo', name: 'Steady Aim', level: 3, book: 'tasha', printedPage: 62, group: 'rogue-optional-feature', note: 'Optional Rogue feature; record player approval before using it.' },
    { id: 'ringgo-assassin', characterId: 'pc-ringgo', name: 'Assassin', level: 3, book: 'phb', printedPage: 97, group: 'rogue-subclass', note: 'Ringgo’s chosen Rogue archetype on his updated level 3 sheet.' },
    { id: 'ringgo-soulknife', characterId: 'pc-ringgo', name: 'Soulknife', level: 3, book: 'tasha', printedPage: 63, group: 'rogue-subclass', note: 'Rogue subclass choice; mutually exclusive with another archetype.' },
    { id: 'donavan-scribes', characterId: 'pc-donavan', name: 'Order of Scribes', level: 2, book: 'tasha', printedPage: 77, group: 'wizard-subclass', note: 'Wizard tradition choice; mutually exclusive with another tradition.' },
    { id: 'donavan-war', characterId: 'pc-donavan', name: 'War Magic', level: 2, book: 'xan', printedPage: 59, group: 'wizard-subclass', note: 'Wizard tradition choice; mutually exclusive with another tradition.' }
  ].map(item => ({ ...item, pdfPage: item.printedPage + (item.book === 'tasha' ? 2 : 1),
    source: `${books[item.book].short} printed p. ${item.printedPage}` }));
  globalThis.ECHO_RULES_DATA = {
    books,
    creatures: [...creatures, ...appendixCreatures],
    characterOptions,
    references: [...rows.map(([id, title, category, book, printedPage, tags, summary, audience]) => ({
      id, title, category, book, printedPage, tags: tags.split(',').map(tag => tag.trim()), summary,
      audience: audience || 'player', confidence: 'Paraphrased table summary · verify book', source: `${books[book].short} printed p. ${printedPage}`
    })), ...characterFeatures, ...creatures, ...appendixCreatures, ...lmopLocations]
  };
})();

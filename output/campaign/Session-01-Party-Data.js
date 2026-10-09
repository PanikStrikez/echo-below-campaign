(() => {
  'use strict';
  const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const SKILLS = {
    Acrobatics: 'dex', 'Animal Handling': 'wis', Arcana: 'int', Athletics: 'str',
    Deception: 'cha', History: 'int', Insight: 'wis', Intimidation: 'cha',
    Investigation: 'int', Medicine: 'wis', Nature: 'int', Perception: 'wis',
    Performance: 'cha', Persuasion: 'cha', Religion: 'int', 'Sleight of Hand': 'dex',
    Stealth: 'dex', Survival: 'wis'
  };
  const number = (value, min = 0, max = 999) => {
    const n = Number(value);
    return value === '' || value === null || value === undefined || !Number.isFinite(n)
      ? null : Math.max(min, Math.min(max, Math.round(n)));
  };
  const clean = (value, max = 500) => String(value ?? '').slice(0, max);
  const id = value => clean(value, 80).replace(/[^A-Za-z0-9_-]/g, '');
  const abilityMod = score => score === null || score === undefined ? null : Math.floor((score - 10) / 2);
  const proficiencyForLevel = level => level ? Math.floor((level - 1) / 4) + 2 : null;
  const rankValue = (sheet, key, kind) => {
    const value = sheet[kind]?.[key] || {};
    if (value.override !== null && value.override !== undefined) return Number(value.override);
    const ability = kind === 'saves' ? key : SKILLS[key];
    const mod = abilityMod(sheet.abilities?.[ability]);
    if (mod === null) return null;
    return mod + (sheet.proficiency || 0) * (value.rank || 0);
  };
  const resource = (idValue, name, max, current, restoreShort = 0, restoreLong = true, unit = '') =>
    ({ id: idValue, name, max, current, restoreShort, restoreLong, unit });
  const action = (idValue, name, type, attackBonus, damageDice, effect, extras = {}) =>
    ({ id: idValue, name, type, attackBonus, damageDice, damageType: '', saveAbility: '', saveDC: null,
      effect, resourceId: '', cost: 1, prepared: true, ...extras });
  const donavanSpellNotes = {
    'Dancing Lights': 'Cantrip · action · lights within 120 ft. · concentration up to 1 minute.',
    'Prestidigitation': 'Cantrip · action · minor magical effect within 10 ft.',
    'Ray of Frost': 'Cantrip · ranged spell attack +6 · 1d8 cold and speed −10 ft.',
    'Toll the Dead': 'Cantrip · Wisdom save DC 13 · 1d8 necrotic, or 1d12 if target is wounded.',
    'Spare the Dying': 'Cantrip · action · touch a creature at 0 HP to stabilize it.',
    Guidance: 'Cantrip · touch · concentration up to 1 minute · +1d4 to one ability check.',
    Command: 'Domain spell · Wisdom save DC 13 · one-word command within 60 ft.',
    Identify: 'Domain spell · touch · learn magical properties; ritual possible; material pearl required.',
    'Detect Magic': 'Sense magic within 30 ft. · concentration up to 10 minutes · ritual possible.',
    'Comprehend Languages': 'Understand literal meaning of languages for 1 hour · ritual possible.',
    'Find Familiar': 'Summon a familiar · 1-hour cast or ritual · material cost applies.',
    'Magic Missile': 'Action · three darts within 120 ft. · each deals 1d4+1 force; no attack roll.',
    Shield: 'Reaction · +5 AC until next turn and blocks Magic Missile.',
    Catapult: 'Xanathar’s · action · Dexterity save DC 14 · fling a 1–5 lb. object; 3d8 bludgeoning.',
    'Disguise Self': 'Action · alter your appearance for 1 hour; inspection may reveal illusion.',
    'Feather Fall': 'Reaction · slow up to five falling creatures within 60 ft.',
    'Witch Bolt': 'Action · ranged spell attack +6 · 1d12 lightning, concentration; action to sustain.',
    'Silent Image': 'Action · range 60 ft. · create a visual illusion within a 15-ft. cube; concentration up to 10 minutes.',
    'Cure Wounds': 'Action · touch · restore 1d8+3 HP.',
    'Healing Word': 'Bonus action · 60 ft. · restore 1d4+3 HP.',
    'Shield of Faith': 'Bonus action · +2 AC to one creature · concentration up to 10 minutes.',
    Bane: 'Action · up to three creatures make Charisma saves DC 13; failures subtract 1d4 from attacks and saves · concentration.',
    Bless: 'Action · up to three creatures add 1d4 to attacks and saves · concentration.',
    'Create or Destroy Water': 'Action · create or destroy water in an open container or rain/fog in a small area.',
    'Detect Evil and Good': 'Action · sense certain supernatural creatures or consecration within 30 ft. · concentration.',
    'Detect Poison and Disease': 'Action · sense poison, poisonous creatures, or disease within 30 ft. · concentration; ritual.',
    'Guiding Bolt': 'Action · ranged spell attack +5 · 4d6 radiant; next attack against target gains advantage.',
    'Inflict Wounds': 'Action · melee spell attack +5 · 3d10 necrotic.',
    'Protection from Evil and Good': 'Action · touch · protect from listed creature types · concentration; material component consumed.',
    'Purify Food and Drink': 'Action or ritual · purify nonmagical food and drink in a 5-ft. radius.',
    Sanctuary: 'Bonus action · protected creature within 30 ft.; attackers make Wisdom save DC 13.',
    Ceremony: 'Ritual · 1 hour · special rites; gold material component consumed.'
  };

  function seedSheet(tokenId, name, role, partial = {}) {
    return {
      id: tokenId, name, role, player: '', className: '', ancestry: '', background: '', level: null,
      rules: '2014', source: '', sourceStatus: 'Check live sheet', proficiency: null,
      abilities: Object.fromEntries(ABILITIES.map(key => [key, null])),
      saves: Object.fromEntries(ABILITIES.map(key => [key, { rank: 0, override: null }])),
      skills: Object.fromEntries(Object.keys(SKILLS).map(key => [key, { rank: 0, override: null }])),
      speed: null, senses: '', languages: '', ac: null, hp: null, maxHp: null, tempHp: 0,
      hitDice: { die: 8, current: null, max: null },
      attacks: [], actions: [], resources: [], spells: [], equipment: [],
      money: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }, features: [],
      inspiration: false, death: { successes: 0, failures: 0, stable: false },
      exhaustion: 0, conditions: [], concentration: '', effects: [], notes: '', publicNotes: '',
      publicOptions: { showHp: true, showActions: true, showResources: false, showStatus: true },
      passiveOverride: { perception: null, insight: null, investigation: null },
      levelHistory: [], ...partial
    };
  }

  const seeds = {
    'pc-aldric': seedSheet('pc-aldric', 'Aldric Vane', 'pc', {
      player: 'Bowman', className: 'Wizard · School of Evocation', ancestry: 'Reborn', background: 'Haunted One', level: 3,
      rules: '2014 Wizard with Reborn, Haunted One, named later spells, and all listed spells available by table rule',
      source: 'Aldric Vane_9252026_2212.json · player export 2026-09-25',
      sourceStatus: 'Player export 2026-09-25; DM set 25 max HP in place of export’s 42; all listed spells available by table rule',
      proficiency: 2, abilities: { str: 8, dex: 14, con: 16, int: 18, wis: 12, cha: 16 },
      saves: { int: { rank: 1, override: 6 }, wis: { rank: 1, override: 3 } },
      skills: { Arcana: { rank: 1, override: 6 }, Insight: { rank: 1, override: 3 },
        Intimidation: { rank: 1, override: 5 }, Investigation: { rank: 1, override: 6 },
        Persuasion: { rank: 1, override: 5 }, Religion: { rank: 1, override: 6 } },
      speed: 30, senses: 'Poison resistance; advantage on death saves and saves against disease or being poisoned',
      languages: 'Common, Dwarvish, Undercommon, Infernal (from Bowman’s backstory; omitted in JSON export)',
      ac: 12, hp: 16, maxHp: 25, hitDice: { die: 6, current: 3, max: 3, details: '3d6 (Wizard 3)' },
      attacks: [action('aldric-fire-bolt', 'Fire Bolt', 'Action', 6, '1d10', 'Ranged spell attack, 120 ft.; ignites unattended flammable objects.', { damageType: 'fire' }),
        action('aldric-dagger', 'Dagger', 'Action', 4, '1d4+2', 'Melee or thrown 20/60 ft.', { damageType: 'piercing' })],
      actions: [action('aldric-control-flames', 'Control Flames', 'Action', null, '', 'Shape, expand, or extinguish a visible nonmagical flame in a 5-foot cube within 60 ft.; no slot.'),
        action('aldric-mage-hand', 'Mage Hand', 'Action', null, '', 'Create and control a spectral hand within 30 ft.; no slot.'),
        action('aldric-ice-knife', 'Ice Knife', 'Action', 6, '1d10', 'Ranged spell attack, 60 ft.; piercing on hit, then target and creatures within 5 ft. make a Dexterity save or take 2d6 cold.', { damageType: 'piercing + cold', saveAbility: 'DEX', saveDC: 14, resourceId: 'aldric-slots-1' }),
        action('aldric-ice-knife-burst', 'Ice Knife burst', 'After Ice Knife', null, '2d6', 'Cold burst after the knife attack. Target and all creatures within 5 ft. make Dexterity save DC 14; no extra spell slot.', { damageType: 'cold', saveAbility: 'DEX', saveDC: 14 }),
        action('aldric-magic-missile', 'Magic Missile', 'Action', null, '1d4+1', 'Three darts at creatures within 120 ft.; no attack roll. Each dart deals force damage.', { damageType: 'force', resourceId: 'aldric-slots-1' }),
        action('aldric-mage-armor', 'Mage Armor', 'Action', null, '', 'Touch an unarmored willing creature; base AC becomes 13 + Dexterity modifier for 8 hours. Aldric’s AC becomes 15.', { resourceId: 'aldric-slots-1' }),
        action('aldric-shield', 'Shield', 'Reaction', null, '', '+5 AC until the start of Aldric’s next turn; blocks Magic Missile.', { resourceId: 'aldric-slots-1' }),
        action('aldric-silvery-barbs', 'Silvery Barbs', 'Reaction', null, '', 'When a visible creature within 60 ft. succeeds on an attack, check, or save: force a reroll and use the lower d20; grant another visible creature advantage on one roll within 1 minute.', { resourceId: 'aldric-slots-1' }),
        action('aldric-scorcher', 'Aganazzar’s Scorcher', 'Action', null, '3d8', 'Fire in a 30-foot line, 5 feet wide; Dexterity save DC 14 for half. Sculpt Spells may protect up to three visible creatures.', { damageType: 'fire', saveAbility: 'DEX', saveDC: 14, resourceId: 'aldric-slots-2' }),
        action('aldric-web', 'Web', 'Action', null, '', '20-foot cube within 60 feet; concentration up to 1 hour. Creatures entering or starting there make Dexterity save DC 14 or become restrained; see spell for escape and fire.', { saveAbility: 'DEX', saveDC: 14, resourceId: 'aldric-slots-2' }),
        action('aldric-past-life', 'Knowledge from a Past Life', 'After a skill check', null, '1d6', 'After seeing a d20 result for an ability check using a skill, add 1d6.', { resourceId: 'aldric-past-life' }),
        action('aldric-arcane-recovery', 'Arcane Recovery', 'After short rest', null, '', 'Once per day after a short rest, recover spell slots with combined level 2 or less: one 2nd-level slot or two 1st-level slots.', { resourceId: 'aldric-arcane-recovery' })],
      resources: [resource('aldric-slots-1', '1st-level spell slots', 4, 4, 0, true, 'slots'),
        resource('aldric-slots-2', '2nd-level spell slots', 2, 2, 0, true, 'slots'),
        resource('aldric-past-life', 'Knowledge from a Past Life', 2, 2, 0, true, 'uses'),
        resource('aldric-arcane-recovery', 'Arcane Recovery', 1, 1, 0, true, 'use')],
      spells: ['Control Flames', 'Fire Bolt', 'Mage Hand'].map(name => ({ name, level: 0, prepared: true, notes: 'At-will cantrip.' })).concat(
        ['Ice Knife', 'Mage Armor', 'Magic Missile', 'Shield', 'Silvery Barbs']
          .map(name => ({ name, level: 1, prepared: true, notes: 'Available by DM table rule. Ice Knife is the Xanathar version; Silvery Barbs is a later-source exception.' })))
        .concat(['Aganazzar’s Scorcher', 'Web'].map(name => ({ name, level: 2, prepared: true, notes: 'Listed as prepared in Bowman’s level 3 export; uses a 2nd-level slot.' }))),
      equipment: [{ name: 'Dagger', quantity: 1, category: 'Weapon', notes: '', attuned: false },
        { name: 'Spellbook', quantity: 1, category: 'Focus', notes: 'Player export', attuned: false },
        { name: 'Scholar’s pack', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Monster hunter’s pack', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Common clothes', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Trinket', quantity: 1, category: 'Gear', notes: 'Scorched magistrate signet ring in backstory; export labels item as trinket', attuned: false },
        { name: 'Verdict Gloves', quantity: 1, category: 'Gear', notes: 'Named in export equipment text; properties not specified', attuned: false }],
      money: { cp: 880, sp: 180, ep: 30, gp: 170, pp: 0 },
      features: [{ name: 'Arcane Recovery', text: 'Once per day after a short rest, recover spell slots with combined level 2 or less: one 2nd-level or two 1st-level slots.', source: '2014 Wizard 3' },
        { name: 'Sculpt Spells', text: 'When casting an evocation spell that affects visible creatures, protect up to 1 + spell level of them: they succeed on their saves and take no half damage.', source: '2014 Evocation Wizard 2' },
        { name: 'Evocation Savant', text: 'Half time and gold to copy evocation spells into the spellbook.', source: '2014 Evocation Wizard 2' },
        { name: 'Knowledge from a Past Life', text: 'Add 1d6 to a skill check after seeing the d20; twice per long rest.', source: 'Reborn lineage' },
        { name: 'Deathless Nature', text: 'Poison resistance; advantage on death saves and saves against disease or being poisoned; no need to eat, drink, breathe, or sleep; 4-hour motionless long rest while conscious.', source: 'Reborn lineage' },
        { name: 'Training', text: 'No armor proficiency. Dagger, dart, light crossbow, quarterstaff, and sling proficiency. No tool proficiency listed.', source: 'Aldric JSON export' },
        { name: 'Heart of Darkness', text: 'Commoners may aid him unless he has shown himself dangerous to them.', source: 'Haunted One' }],
      notes: 'Private backstory remains as supplied by Bowman: former Crown battle mage and magistrate, returned from death, seeking atonement and his family. Level 3 export shows 42 max HP, which the DM explicitly replaced with 25 fixed-progression wizard HP (18 at level 2 + 7); retain 9 damage for 16/25 current HP. AC 12, four 1st-level and two 2nd-level slots. All ten listed spells available by table rule. Export provides no languages; retained those from Bowman’s backstory. Do not define the Crown or his resurrection without player agreement.',
      publicNotes: 'All spells on Bowman’s level 3 export are available by DM table rule. Age 34, 6 ft. 4 in.; ashen scarred skin, black hair with a white streak, ash-grey eyes that glow like embers while casting. Quiet, hooded, rasping voice.'
    }),
    'pc-pebble': seedSheet('pc-pebble', 'Pebble', 'pc', {
      player: 'Byron', className: 'Fighter', ancestry: 'Goron (custom lineage)', background: 'Outlander', level: 1,
      rules: '2014 PHB with Tasha options', source: 'Pebble Player Handout pp. 1–4; Byron’s Session 1 answers',
      sourceStatus: 'Player handout; confirm build against a live sheet when available',
      proficiency: 2, abilities: { str: 18, dex: 10, con: 14, int: 8, wis: 13, cha: 12 },
      saves: { str: { rank: 1, override: 6 }, dex: { rank: 0, override: 0 },
        con: { rank: 1, override: 4 }, int: { rank: 0, override: -1 },
        wis: { rank: 0, override: 1 }, cha: { rank: 0, override: 1 } },
      skills: { Athletics: { rank: 1, override: 6 }, Insight: { rank: 1, override: 3 },
        Perception: { rank: 1, override: 3 }, Survival: { rank: 1, override: 3 } },
      speed: 30, senses: 'Darkvision 60 ft.', languages: 'Common, Goron, Dwarvish',
      ac: 18, hp: 12, maxHp: 12, hitDice: { die: 10, current: 1, max: 1 },
      attacks: [action('pebble-hammer', 'Warhammer', 'Action', 6, '1d8+4', 'One-handed with shield; Crusher may move a qualifying target 5 feet once on Pebble’s turn.', { damageType: 'bludgeoning' }),
        action('pebble-handaxe', 'Handaxe', 'Action', 6, '1d6+4', 'Melee or thrown 20/60 feet.', { damageType: 'slashing' })],
      actions: [action('pebble-interception', 'Interception', 'Reaction', null, '1d10+2', 'Reduce damage when a visible creature hits someone other than Pebble within 5 feet; Pebble must hold a shield or weapon.'),
        action('pebble-second-wind', 'Second Wind', 'Bonus action', null, '1d10+1', 'Heal Pebble; once per short or long rest.', { resourceId: 'pebble-second-wind' }),
        action('pebble-crusher', 'Crusher', 'Once on Pebble’s turn', null, '', 'After a bludgeoning hit, move a creature no more than one size larger 5 feet into empty space. On a bludgeoning critical hit, attacks against it have advantage until Pebble’s next turn.')],
      resources: [resource('pebble-second-wind', 'Second Wind', 1, 1, 1, true, 'use')],
      equipment: [{ name: 'Warhammer', quantity: 1, category: 'Weapon', notes: 'Stone appearance', attuned: false },
        { name: 'Handaxe', quantity: 2, category: 'Weapon', notes: 'Stone appearance', attuned: false },
        { name: 'Shield', quantity: 1, category: 'Armor', notes: 'Slab-like appearance', attuned: false },
        { name: 'Chain mail', quantity: 1, category: 'Armor', notes: 'Stone appearance; ordinary chain mail rules', attuned: false },
        { name: 'Explorer’s pack', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Staff', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Hunting trap', quantity: 1, category: 'Gear', notes: '', attuned: false }],
      money: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
      features: [{ name: 'Interception', text: 'Reaction; reduce damage to a nearby other target by 1d10+2.', source: 'Tasha’s / Pebble handout p. 3' },
        { name: 'Crusher', text: 'Once on own turn move a qualifying target 5 feet after bludgeoning hit; critical hit grants advantage to attacks against it until next turn.', source: 'Tasha’s / Pebble handout p. 3' },
        { name: 'Second Wind', text: 'Bonus action to regain 1d10+1 HP, once per short or long rest.', source: 'PHB / Pebble handout p. 3' }],
      notes: 'Byron’s answers supersede the handout’s earlier traveler rumor: dwarves who made Pebble’s hammer told him of delicious shiny rocks. Pebble fears getting lost outside his mountains. He meets the other PCs during Session 1 with no prior connection. Handout mechanics are provisional until a live sheet is supplied.',
      publicNotes: 'A curious mountain traveler seeking a delicious shiny rock. He is brave, but unfamiliar roads make him uneasy.'
    }),
    'pc-trista': seedSheet('pc-trista', 'Trista', 'pc', {
      className: 'Monk', ancestry: 'Human', background: 'Criminal / Spy', level: 1,
      rules: '2024 character exception', source: 'Trista D&D Beyond sheet pp. 1–2; beginner guide pp. 4–10', sourceStatus: 'Current uploaded sheet; 2024 Monk exception',
      proficiency: 2, abilities: { str: 14, dex: 18, con: 17, int: 9, wis: 11, cha: 12 },
      saves: { str: { rank: 1, override: 4 }, dex: { rank: 1, override: 6 }, con: { rank: 0, override: 3 },
        int: { rank: 0, override: -1 }, wis: { rank: 0, override: 0 }, cha: { rank: 0, override: 1 } },
      skills: { Stealth: { rank: 1, override: 6 }, Acrobatics: { rank: 1, override: 6 },
        Deception: { rank: 1, override: 3 }, History: { rank: 1, override: 1 } },
      speed: 30, languages: 'Common, Orc', ac: 14, hp: 11, maxHp: 11, hitDice: { die: 8, current: 1, max: 1 },
      attacks: [action('trista-dagger', 'Dagger', 'Action', 6, '1d6+4', 'Monk weapon; thrown range 20/60 ft.', { damageType: 'piercing' }),
        action('trista-spear', 'Spear', 'Action', 6, '1d8+4', 'Versatile: 1d8+4 with two hands; 1d6+4 with one hand or thrown 20/60 ft.', { damageType: 'piercing' }),
        action('trista-unarmed', 'Unarmed Strike', 'Action', 6, '1d6+4', 'Martial Arts.', { damageType: 'bludgeoning' }),
        action('trista-bonus-strike', 'Martial Arts unarmed strike', 'Bonus action', 6, '1d6+4', 'After the Attack action when Martial Arts applies.', { damageType: 'bludgeoning' })],
      equipment: [{ name: 'Dagger', quantity: 5, category: 'Weapon', notes: '', attuned: false },
        { name: 'Spear', quantity: 1, category: 'Weapon', notes: '', attuned: false },
        { name: 'Tinker’s tools', quantity: 1, category: 'Tool', notes: '', attuned: false },
        { name: 'Bagpipes', quantity: 1, category: 'Instrument', notes: '', attuned: false },
        { name: 'Torch', quantity: 10, category: 'Gear', notes: '', attuned: false },
        { name: 'Rations', quantity: 10, category: 'Consumable', notes: 'One day each', attuned: false },
        { name: 'Oil flask', quantity: 2, category: 'Consumable', notes: '', attuned: false },
        { name: 'Rope', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Tinderbox', quantity: 1, category: 'Gear', notes: '', attuned: false }],
      money: { cp: 0, sp: 0, ep: 0, gp: 26, pp: 0 },
      features: [{ name: 'Martial Arts', text: 'One bonus-action Unarmed Strike at level 1 when requirements apply.', source: 'Trista guide p. 6' }],
      notes: '2024 Monk exception. The uploaded sheet supplies ability scores, saves, AC, HP, and equipment; check spent supplies at the table.'
    }),
    'pc-ringgo': seedSheet('pc-ringgo', 'Ringgo Paul', 'pc', {
      player: 'Cade', className: 'Rogue · Assassin', ancestry: 'Tiefling', background: 'Criminal / Spy', level: 3,
      rules: '2014 Rogue and Tiefling; ignore 2024 weapon mastery labels on export', source: 'Josvo_171417930-2.pdf · Ringgo pp. 1–5', sourceStatus: 'Player PDF 2026-09-25 · Rogue 3 Assassin; DM-confirmed second Expertise: Investigation',
      proficiency: 2, abilities: { str: 7, dex: 19, con: 14, int: 10, wis: 10, cha: 18 },
      saves: { str: { rank: 0, override: -2 }, dex: { rank: 1, override: 6 }, con: { rank: 0, override: 2 },
        int: { rank: 1, override: 2 }, wis: { rank: 0, override: 0 }, cha: { rank: 0, override: 4 } },
      skills: { Acrobatics: { rank: 1, override: 6 }, Deception: { rank: 1, override: 6 },
        Investigation: { rank: 2, override: 4 }, Perception: { rank: 1, override: 2 }, Persuasion: { rank: 1, override: 6 },
        'Sleight of Hand': { rank: 1, override: 6 }, Stealth: { rank: 2, override: 8 } },
      speed: 30, senses: 'Darkvision 60 ft.; fire resistance', languages: 'Common, Infernal, Thieves’ Cant',
      ac: 16, hp: 24, maxHp: 24, hitDice: { die: 8, current: 3, max: 3, details: '3d8 (Rogue 3)' },
      attacks: [action('ringgo-rapier', 'Rapier', 'Action', 6, '1d8+4', 'Finesse; Sneak Attack may add 2d6 once per turn.', { damageType: 'piercing' }),
        action('ringgo-shortbow', 'Shortbow', 'Action', 6, '1d6+4', 'Range 80/320; Sneak Attack may add 2d6.', { damageType: 'piercing' }),
        action('ringgo-dagger', 'Dagger', 'Action', 6, '1d4+4', 'Finesse, light, thrown 20/60.', { damageType: 'piercing' }),
        action('ringgo-offhand', 'Second dagger', 'Bonus action', 6, '1d4', 'Two-weapon fighting; no +4 damage.', { damageType: 'piercing' }),
        action('ringgo-sneak', 'Sneak Attack', 'Once per turn', null, '2d6', 'Add to a qualifying finesse or ranged hit; check ally/advantage and no disadvantage.', { damageType: 'extra' })],
      actions: [action('ringgo-cunning-dash', 'Cunning Action: Dash', 'Bonus action', null, '', 'Move up to your speed again this turn.'),
        action('ringgo-cunning-disengage', 'Cunning Action: Disengage', 'Bonus action', null, '', 'Movement this turn does not provoke opportunity attacks.'),
        action('ringgo-cunning-hide', 'Cunning Action: Hide', 'Bonus action', null, '', 'Attempt to hide if the circumstances allow it.'),
        action('ringgo-thaumaturgy', 'Thaumaturgy', 'Action', null, '', 'Tiefling cantrip: create a minor supernatural sign within 30 feet; no slot.'),
        action('ringgo-hellish-rebuke', 'Hellish Rebuke', 'Reaction', null, '3d10', 'Once per long rest as a 2nd-level spell, after a creature you can see within 60 feet damages you. Dexterity save DC 14 for half fire damage.', { damageType: 'fire', saveAbility: 'DEX', saveDC: 14, resourceId: 'ringgo-hellish-rebuke' }),
        action('ringgo-assassinate', 'Assassinate', 'On attack', null, '', 'Advantage against any creature that has not yet taken a turn in this combat. A hit against a surprised creature is a critical hit.')],
      resources: [resource('ringgo-arrows', 'Arrows', 20, 20, 0, false, 'arrows'),
        resource('ringgo-hellish-rebuke', 'Hellish Rebuke', 1, 1, 0, true, 'use')],
      equipment: [{ name: 'Rapier', quantity: 1, category: 'Weapon', notes: '', attuned: false },
        { name: 'Shortbow', quantity: 1, category: 'Weapon', notes: '', attuned: false },
        { name: 'Dagger', quantity: 2, category: 'Weapon', notes: '', attuned: false },
        { name: 'Studded leather', quantity: 1, category: 'Armor', notes: '', attuned: false },
        { name: 'Thieves’ tools', quantity: 1, category: 'Tool', notes: '', attuned: false },
        { name: 'Arrows', quantity: 20, category: 'Ammunition', notes: '', attuned: false },
        { name: 'Hammer', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Mess kit', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Backpack', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Crowbar', quantity: 2, category: 'Gear', notes: 'PDF lists two', attuned: false },
        { name: 'Ball bearings', quantity: 1000, category: 'Gear', notes: 'One bag', attuned: false },
        { name: 'Bedroll', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Bell', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Candle', quantity: 5, category: 'Gear', notes: '', attuned: false },
        { name: 'Waterskin', quantity: 2, category: 'Gear', notes: '', attuned: false },
        { name: 'String', quantity: 10, category: 'Gear', notes: '', attuned: false },
        { name: 'Piton', quantity: 10, category: 'Gear', notes: 'The current sheet says piton, not potion.', attuned: false },
        { name: 'Rations', quantity: 15, category: 'Consumable', notes: 'One day each', attuned: false },
        { name: 'Rope, hempen 50 ft.', quantity: 2, category: 'Gear', notes: '', attuned: false },
        { name: 'Hooded lantern', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Oil flask', quantity: 2, category: 'Consumable', notes: '', attuned: false },
        { name: 'Torch', quantity: 10, category: 'Gear', notes: '', attuned: false },
        { name: 'Tinderbox', quantity: 2, category: 'Gear', notes: 'Updated PDF lists two', attuned: false }],
      money: { cp: 0, sp: 0, ep: 0, gp: 15, pp: 0 },
      features: [{ name: 'Sneak Attack', text: '2d6 once per turn on a qualifying finesse or ranged hit.', source: 'Ringgo level 3 PDF p. 2' },
        { name: 'Cunning Action', text: 'Dash, Disengage, or Hide as a bonus action on each of your turns.', source: 'Ringgo PDF p. 2' },
        { name: 'Expertise', text: 'Stealth and Investigation. Investigation is the DM-confirmed second choice after this export.', source: 'Ringgo PDF p. 2; DM ruling 2026-09-25' },
        { name: 'Hellish Resistance', text: 'Resistance to fire damage.', source: 'Ringgo PDF p. 2' },
        { name: 'Infernal Legacy', text: 'Thaumaturgy cantrip and Hellish Rebuke once per long rest as a 2nd-level spell at this level.', source: 'Ringgo level 3 PDF pp. 2, 5' },
        { name: 'Assassinate', text: 'Advantage on attacks against creatures that have not taken a turn yet; a hit against a surprised target is a critical hit.', source: 'Ringgo level 3 PDF p. 2' },
        { name: 'Bonus Proficiencies', text: 'Disguise kit and poisoner’s kit from Assassin archetype.', source: 'Ringgo level 3 PDF p. 2' },
        { name: 'Training', text: 'Light armor; simple weapons, hand crossbow, longsword, rapier, shortsword; thieves’ tools, playing cards, land vehicles.', source: 'Ringgo PDF p. 1' }],
      spells: [{ name: 'Thaumaturgy', level: 0, prepared: true, notes: 'Tiefling racial cantrip; Charisma spellcasting.' },
        { name: 'Hellish Rebuke', level: 2, prepared: true, notes: 'Tiefling Infernal Legacy at character level 3: cast once per long rest as a 2nd-level spell; Dexterity save DC 14, 3d10 fire.' }],
      notes: 'Updated player export is level 3 Rogue Assassin, max HP 24; current HP blank, so preserve live damage. Ignore Nick and Vex 2024 labels under the 2014 rules profile. DM confirmed Investigation as second Expertise on 2026-09-25; updated PDF still leaves it unmarked. PDF lists ten pitons, not potions. The PDF account name is Josvo; campaign player assignment remains Cade.',
      publicNotes: 'Age 30, 6 ft. tall; purple skin, green eyes, dark purple hair. Expertise: Stealth and Investigation.'
    }),
    'pc-donavan': seedSheet('pc-donavan', 'Donavan Kemp', 'pc', {
      player: 'Brodey', className: 'Wizard 2 / Cleric 1 · Order of Scribes / Knowledge Domain', ancestry: 'Human', background: 'Sage',
      level: 3, rules: '2014 multiclass with Tasha Order of Scribes, Catapult and Toll the Dead exceptions; all listed spells available by table rule', source: 'Donavan updated sheet 2026-09-25 · pp. 1–5',
      sourceStatus: 'Player PDF 2026-09-25 · Wizard 2 / Cleric 1; current HP blank; all listed spells available by table rule',
      proficiency: 2, abilities: { str: 12, dex: 14, con: 16, int: 18, wis: 16, cha: 16 },
      saves: { str: { rank: 0, override: 1 }, dex: { rank: 0, override: 2 }, con: { rank: 0, override: 3 },
        int: { rank: 1, override: 6 }, wis: { rank: 1, override: 5 }, cha: { rank: 0, override: 3 } },
      skills: { Arcana: { rank: 2, override: 8 }, History: { rank: 2, override: 8 },
        Investigation: { rank: 1, override: 6 }, Religion: { rank: 0, override: 4 } },
      speed: 30, ac: 16, hp: 24, maxHp: 24, hitDice: { die: 6, current: 3, max: 3, details: '2d6 + 1d8 (Wizard 2 / Cleric 1)' },
      languages: 'Common, Dwarvish, Elvish, Giant, Goblin, Sylvan',
      senses: 'Passive Perception 13; no familiar shown on updated sheet',
      attacks: [action('donavan-dagger', 'Dagger', 'Action', 4, '1d4+2', 'Melee or thrown 20/60 ft.', { damageType: 'piercing' }),
        action('donavan-ray', 'Ray of Frost', 'Action', 6, '1d8', 'Ranged spell attack, 60 ft.; cold damage and speed reduced by 10 ft. until the start of your next turn.', { damageType: 'cold' }),
        action('donavan-unarmed', 'Unarmed Strike', 'Action', 3, '2', 'Melee attack; 2 bludgeoning damage on a hit.', { damageType: 'bludgeoning' })],
      actions: [action('donavan-dancing-lights', 'Dancing Lights', 'Action', null, '', 'Create up to four lights within 120 ft.; concentration, up to 1 minute.'),
        action('donavan-prestidigitation', 'Prestidigitation', 'Action', null, '', 'Minor magical effect within 10 ft.'),
        action('donavan-toll-dead', 'Toll the Dead', 'Action', null, '1d8', 'Wisdom save DC 13; necrotic damage if target has all its HP.', { damageType: 'necrotic', saveAbility: 'WIS', saveDC: 13 }),
        action('donavan-toll-dead-wounded', 'Toll the Dead · wounded target', 'Action', null, '1d12', 'Use instead of the d8 version when the target is missing HP. Wisdom save DC 13.', { damageType: 'necrotic', saveAbility: 'WIS', saveDC: 13 }),
        action('donavan-spare-dying', 'Spare the Dying', 'Action', null, '', 'Stabilize a living creature at 0 HP by touch.'),
        action('donavan-guidance', 'Guidance', 'Action', null, '1d4', 'Touch a willing creature; concentration, up to 1 minute; add 1d4 to one ability check.'),
        action('donavan-command', 'Command', 'Action', null, '', 'Domain spell, always prepared. One creature within 60 ft. makes Wisdom save DC 13 or follows one-word command on its next turn.', { saveAbility: 'WIS', saveDC: 13, resourceId: 'donavan-slots-1' }),
        action('donavan-identify', 'Identify', 'Ritual or Action', null, '', 'Domain spell, always prepared; reveal magical properties of a touched object or spells affecting a creature. Ritual adds 10 minutes; costly pearl required.', { resourceId: 'donavan-slots-1' }),
        action('donavan-catapult', 'Catapult', 'Action', null, '3d8', 'Hurl a 1–5 lb. unattended object along a 90-ft. line; first creature in path makes Dexterity save DC 14 or takes bludgeoning damage.',
          { damageType: 'bludgeoning', saveAbility: 'DEX', saveDC: 14, resourceId: 'donavan-slots-1' }),
        action('donavan-magic-missile', 'Magic Missile', 'Action', null, '1d4+1', 'Three darts, no attack roll.', { damageType: 'force', resourceId: 'donavan-slots-1' }),
        action('donavan-shield', 'Shield', 'Reaction', null, '', '+5 AC until the start of your next turn and block Magic Missile.', { resourceId: 'donavan-slots-1' }),
        action('donavan-healing-word', 'Healing Word', 'Bonus action', null, '1d4+3', 'Heal a visible creature within 60 ft.', { resourceId: 'donavan-slots-1' }),
        action('donavan-cure-wounds', 'Cure Wounds', 'Action', null, '1d8+3', 'Heal a creature you touch.', { resourceId: 'donavan-slots-1' }),
        action('donavan-silent-image', 'Silent Image', 'Action', null, '', 'Create a visual illusion in a 15-foot cube within 60 ft.; concentration up to 10 minutes.', { resourceId: 'donavan-slots-1' }),
        action('donavan-upcast', 'Cast a 1st-level spell with a 2nd-level slot', 'Spell action', null, '', 'Choose a prepared 1st-level spell. Use a 2nd-level slot; apply its higher-slot effect if any. No 2nd-level spells are listed on this sheet.', { resourceId: 'donavan-slots-2' }),
        action('donavan-quill', 'Wizardly Quill', 'Bonus action', null, '', 'Create a Tiny magical quill that needs no ink and can erase its writing within 5 ft.; copy a spell in 2 minutes per spell level.'),
        action('donavan-scribes-ritual', 'Awakened Spellbook: quick ritual', 'Ritual', null, '', 'Cast one wizard ritual from the spellbook using its normal casting time rather than adding 10 minutes; once per long rest.', { resourceId: 'donavan-scribes-ritual' }),
        action('donavan-scribes-damage', 'Awakened Spellbook: change damage type', 'When casting', null, '', 'When casting a wizard spell with a slot, use a damage type from another spell in the spellbook of the same level as the slot used.'),
        action('donavan-arcane-recovery', 'Arcane Recovery', 'After short rest', null, '', 'Once per day after a short rest, recover one expended 1st-level slot.', { resourceId: 'donavan-arcane-recovery' })],
      resources: [resource('donavan-slots-1', '1st-level shared spell slots', 4, 4),
        resource('donavan-slots-2', '2nd-level shared spell slots · upcasting', 2, 2),
        resource('donavan-arcane-recovery', 'Arcane Recovery', 1, 1),
        resource('donavan-scribes-ritual', 'Awakened Spellbook quick ritual', 1, 1)],
      spells: ['Dancing Lights', 'Prestidigitation', 'Ray of Frost', 'Toll the Dead', 'Spare the Dying', 'Guidance']
        .map(name => ({ name, level: 0, prepared: true, notes: donavanSpellNotes[name] }))
        .concat(['Command', 'Identify'].map(name => ({ name, level: 1, prepared: true, notes: donavanSpellNotes[name] })))
        .concat(['Detect Magic', 'Comprehend Languages', 'Find Familiar', 'Magic Missile', 'Shield', 'Catapult', 'Disguise Self', 'Feather Fall', 'Witch Bolt', 'Silent Image']
          .map(name => ({ name, level: 1, prepared: true, notes: `Wizard · ${donavanSpellNotes[name]}` })))
        .concat(['Cure Wounds', 'Healing Word', 'Shield of Faith', 'Bane', 'Bless', 'Create or Destroy Water', 'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease', 'Guiding Bolt', 'Inflict Wounds', 'Protection from Evil and Good', 'Purify Food and Drink', 'Sanctuary', 'Ceremony']
          .map(name => ({ name, level: 1, prepared: true, notes: `Cleric · ${donavanSpellNotes[name]}` }))),
      equipment: [{ name: 'Breastplate', quantity: 1, category: 'Armor', notes: 'AC 16 with DEX +2; no shield listed', attuned: false },
        { name: 'Dagger', quantity: 1, category: 'Weapon', notes: '', attuned: false },
        { name: 'Spellbook', quantity: 1, category: 'Focus', notes: '', attuned: false },
        { name: 'Arcane focus', quantity: 1, category: 'Focus', notes: 'Specific form not listed', attuned: false },
        { name: 'Ink bottle', quantity: 2, category: 'Gear', notes: '', attuned: false },
        { name: 'Ink pen', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Backpack', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Common clothes', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Book', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Small knife', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Little bag of sand', quantity: 1, category: 'Gear', notes: '', attuned: false },
        { name: 'Parchment sheet', quantity: 13, category: 'Gear', notes: '', attuned: false },
        { name: 'Bedroll', quantity: 1, category: 'Gear', notes: '', attuned: false }],
      money: { cp: 1050, sp: 166, ep: 30, gp: 90, pp: 0 },
      features: [{ name: 'Arcane Recovery', text: 'Once per day after a short rest, recover one expended 1st-level slot.', source: 'Donavan PDF p. 2' },
        { name: 'Knowledge Domain', text: 'Command and Identify are always prepared as domain spells.', source: 'Donavan PDF pp. 2, 4' },
        { name: 'Blessings of Knowledge', text: 'Two additional languages and double proficiency on Arcana and History checks.', source: 'Donavan PDF p. 2' },
        { name: 'Wizard Spellcasting', text: 'INT spell attack +6; save DC 14. Prepare wizard spells separately from cleric spells.', source: 'Donavan PDF p. 2' },
        { name: 'Cleric Spellcasting', text: 'WIS spell attack +5; save DC 13. Prepare cleric spells separately from wizard spells.', source: 'Donavan PDF p. 2' },
        { name: 'Wizardly Quill', text: 'Bonus action to create a magical quill; no ink needed, copy a spell in 2 minutes per spell level, erase its writing within 5 ft.', source: 'Tasha’s p. 77 / updated PDF p. 2' },
        { name: 'Awakened Spellbook', text: 'Spellbook is a wizard focus; change damage type of a slotted wizard spell using a same-level spell in the book; quick wizard ritual once per long rest.', source: 'Tasha’s p. 77 / updated PDF p. 2' },
        { name: 'Training', text: 'Light armor, medium armor, shields; dagger, dart, light crossbow, quarterstaff, sling.', source: 'Donavan PDF p. 1' }],
      notes: 'Updated player export shows Wizard 2 / Cleric 1, Order of Scribes / Knowledge Domain, 24 max HP, AC 16, and 2d6 + 1d8 hit dice. The current-HP field is blank, so preserve live damage. It prints four 1st-level slots; 2014 multiclass rules also grant two 2nd-level slots usable for upcasting listed 1st-level spells. DM table rule permits all listed spells as available. Command and Identify are domain spells. Duplicate PHB-2024 spell rows on export are not additional known spells. The PDF account name is Josvo; campaign assignment remains Brodey.',
      publicNotes: 'Order of Scribes / Knowledge Domain. All listed Wizard and Cleric spells are available by DM table rule; 4 first-level slots and 2 second-level slots for upcasting.'
    }),
    'ally-dracuseth': seedSheet('ally-dracuseth', 'Dracuseth Maw of Flames', 'ally', {
      className: 'Paladin · Oath of Devotion', ancestry: 'Gold Dragonborn', background: 'Folk Hero', level: 4,
      rules: '2024 character exception', source: 'Dracuseth revised sheet pp. 1–3', sourceStatus: 'Revised companion sheet',
      proficiency: 2, abilities: { str: 13, dex: 13, con: 17, int: 9, wis: 12, cha: 17 },
      saves: { str: { rank: 0, override: 1 }, dex: { rank: 0, override: 1 }, con: { rank: 0, override: 3 },
        int: { rank: 0, override: -1 }, wis: { rank: 1, override: 3 }, cha: { rank: 1, override: 5 } },
      skills: { Intimidation: { rank: 1, override: 5 }, Medicine: { rank: 1, override: 3 },
        Survival: { rank: 1, override: 3 }, Perception: { rank: 0, override: 1 } },
      speed: 30, senses: 'Darkvision 60 ft.; fire resistance', languages: 'Common, Draconic, Dwarvish',
      ac: 18, hp: 40, maxHp: 40, hitDice: { die: 10, current: 4, max: 4 },
      attacks: [action('drac-long', 'Longsword', 'Action', 3, '1d8+1', 'Sap: target has disadvantage on its next attack before Dracuseth’s next turn.', { damageType: 'slashing' }),
        action('drac-sacred', 'Sacred Weapon longsword', 'Action', 6, '1d8+1', 'Channel Divinity; +3 attack for 10 minutes. Damage slashing or radiant.', { damageType: 'slashing', resourceId: 'drac-channel' }),
        action('drac-javelin', 'Javelin', 'Action', 3, '1d6+1', 'Thrown 30/120; six carried.', { damageType: 'piercing', resourceId: 'drac-javelins' }),
        action('drac-breath', 'Fire breath', 'Attack replacement', null, '1d10', '15-ft. cone or 30-ft. line; Dex save for half.',
          { damageType: 'fire', saveAbility: 'DEX', saveDC: 13, resourceId: 'drac-breath' }),
        action('drac-cure', 'Cure Wounds', 'Action', null, '2d8+3', 'Touch; healing. Uses a 1st-level slot.',
          { damageType: 'healing', resourceId: 'drac-slots' }),
        action('drac-command', 'Command', 'Action', null, '', 'One-word command within 60 ft.; not directly harmful.',
          { saveAbility: 'WIS', saveDC: 13, resourceId: 'drac-slots' }),
        action('drac-bless', 'Bless', 'Action', null, '1d4', 'Three creatures within 30 ft. gain 1d4 on attacks and saves; concentration up to 1 minute.',
          { damageType: 'bonus', resourceId: 'drac-slots' }),
        action('drac-detect', 'Detect Magic', 'Action / ritual', null, '', 'Sense magic within 30 ft. for up to 10 minutes; concentration. Ritual use needs no slot.',
          { resourceId: 'drac-slots' }),
        action('drac-heroism', 'Heroism', 'Action', null, '', 'Touch; one willing creature resists fear and gains 3 temporary HP at the start of each turn; concentration.',
          { resourceId: 'drac-slots' }),
        action('drac-shield-faith', 'Shield of Faith', 'Bonus action', null, '', 'One creature within 60 ft. gets +2 AC for up to 10 minutes; concentration.',
          { resourceId: 'drac-slots' }),
        action('drac-protection', 'Protection from Evil and Good', 'Action', null, '', 'Defensive protection against listed creature types; concentration. Check revised sheet.',
          { resourceId: 'drac-slots' }),
        action('drac-lay', 'Lay On Hands', 'Bonus action', null, '', 'Touch; spend any number of points to heal, or 5 points to remove Poisoned. Adjust pool in Resources.',
          { resourceId: 'drac-lay', cost: 0 }),
        action('drac-leader', 'Inspiring Leader', 'After rest', null, '', 'Grant 7 temporary HP to up to six allies, including Dracuseth.',
          { resourceId: 'drac-leader' }),
        action('drac-divine-sense', 'Divine Sense', 'Bonus action', null, '', 'Spend Channel Divinity to sense nearby Celestials, Fiends, and Undead for 10 minutes.',
          { resourceId: 'drac-channel' }),
        action('drac-smite', 'Divine Smite', 'Bonus action', null, '', 'After melee weapon or Unarmed Strike hit; one free use per long rest.',
          { resourceId: 'drac-free-smite' }),
        action('drac-smite-slot', 'Divine Smite with slot', 'Bonus action', null, '', 'After melee weapon or Unarmed Strike hit; spend a spell slot. Check spell damage on live sheet.',
          { resourceId: 'drac-slots' })],
      spells: ['Bless', 'Cure Wounds', 'Command', 'Detect Magic', 'Heroism', 'Shield of Faith',
        'Protection from Evil and Good'].map(name => ({ name, level: 1, prepared: true, notes: 'See revised sheet p. 2.' })),
      resources: [resource('drac-lay', 'Lay On Hands', 20, 20), resource('drac-slots', '1st-level spell slots', 3, 3),
        resource('drac-channel', 'Channel Divinity', 2, 2, 1), resource('drac-free-smite', 'Free Divine Smite', 1, 1),
        resource('drac-breath', 'Breath Weapon', 2, 2), resource('drac-javelins', 'Javelins', 6, 6, 0, false),
        resource('drac-leader', 'Inspiring Leader after rest', 1, 1, 1)],
      equipment: [{ name: 'Chain mail', quantity: 1, category: 'Armor', notes: '', attuned: false },
        { name: 'Shield', quantity: 1, category: 'Armor', notes: '', attuned: false },
        { name: 'Longsword', quantity: 1, category: 'Weapon', notes: 'Sap mastery', attuned: false },
        { name: 'Javelin', quantity: 6, category: 'Weapon', notes: '', attuned: false }],
      money: { cp: 0, sp: 0, ep: 0, gp: 19, pp: 0 },
      features: [{ name: 'Lay On Hands', text: 'Bonus action, touch; 20-point pool. Five points can remove Poisoned.', source: 'Revised sheet p. 2' },
        { name: 'Inspiring Leader', text: 'After a short or long rest, grant 7 temporary HP to up to six allies including himself.', source: 'Revised sheet p. 2' }]
    }),
    'ally-sildar': seedSheet('ally-sildar', 'Sildar Hallwinter', 'ally', {
      className: 'Warrior', rules: '2014', source: 'Lost Mine of Phandelver adventure',
      sourceStatus: 'Adventure p. 10–11; captive lacks armor and weapons',
      ac: null, hp: 1, maxHp: 27, notes: 'Captive at 1 HP and stripped of armor and weapons. Set AC and attacks from actual gear before using him in combat.'
    })
  };

  const levelThreeHp = {
    'pc-trista': { level2: 15, level3: 21, die: 8, rolls: 'd8: 1 at level 2, 3 at level 3; +3 CON each level' },
    'pc-pebble': { level2: 16, level3: 23, die: 10, rolls: 'd10: 2 at level 2, 5 at level 3; +2 CON each level' }
  };

  // Approved level-four choices and the single recorded HP rolls. Keep this separate
  // from the seed sheets so older session snapshots retain their original level.
  const levelFourChoices = {
    'pc-pebble': { die: 10, roll: 10, feat: 'Tough', source: '2014 Player’s Handbook' },
    'pc-trista': { die: 8, roll: 1, feat: 'Speedy', source: '2024 Player’s Handbook character exception' }
  };

  function levelFourSheet(raw) {
    const choice = levelFourChoices[raw?.id];
    if (!choice || Number(raw.level) !== 3 || !Number.isFinite(raw.maxHp)) return raw;
    const sheet = structuredClone(raw), snapshot = structuredClone(raw);
    snapshot.levelHistory = [];
    const put = (kind, item, key = 'id') => {
      sheet[kind] ||= [];
      const index = sheet[kind].findIndex(old => old[key] === item[key]);
      if (index < 0) sheet[kind].push(item);
      else sheet[kind][index] = { ...sheet[kind][index], ...item };
    };
    sheet.level = 4;
    sheet.proficiency = 2;
    let gain;
    if (raw.id === 'pc-pebble') {
      // 10 on d10, +2 CON, and Tough grants +2 HP for each of four levels.
      gain = choice.roll + 2 + 2 * sheet.level;
      put('actions', action('pebble-second-wind', 'Second Wind', 'Bonus action', null, '1d10+4',
        'Heal Pebble; once per short or long rest.', { resourceId: 'pebble-second-wind' }));
      put('features', { name: 'Second Wind', text: 'Bonus action to heal 1d10+4; once per short or long rest.', source: '2014 Fighter 1' }, 'name');
      put('features', { name: 'Tough', text: 'Maximum HP increases by 2 per character level (8 HP at level 4), and by 2 at each later level.', source: '2014 Player’s Handbook · feat' }, 'name');
    } else {
      // Speedy raises CON 17 → 18. The new modifier applies to all prior levels.
      gain = choice.roll + 4 + 3;
      sheet.abilities.con = 18;
      sheet.saves.con = { ...(sheet.saves.con || { rank: 0 }), override: 4 };
      sheet.speed = 50;
      const focus = sheet.resources?.find(item => item.id === 'trista-focus');
      if (focus) {
        const spent = Math.max(0, (Number(focus.max) || 3) - (Number(focus.current) || 0));
        focus.max = 4;
        focus.current = Math.max(0, 4 - spent);
      }
      put('actions', action('trista-uncanny', 'Uncanny Metabolism', 'When rolling initiative', null, '1d6+4',
        'Restore all spent Focus Points and heal 1d6 + Monk level; once per long rest.', { resourceId: 'trista-uncanny' }));
      put('actions', action('trista-deflect', 'Deflect Attacks', 'Reaction', null, '1d10+8',
        'When hit by an attack that deals bludgeoning, piercing, or slashing, reduce total damage by 1d10 + DEX + Monk level. If reduced to 0, you may spend 1 Focus Point to redirect.'));
      put('actions', action('trista-slow-fall', 'Slow Fall', 'Reaction', null, '',
        'When you fall, reduce the falling damage by 5 × Monk level (20 at level 4).'));
      put('actions', action('trista-speedy-dash', 'Speedy: Dash', 'When you Dash', null, '',
        'Difficult terrain does not cost extra movement for the rest of this turn.'));
      put('features', { name: 'Monk’s Focus', text: '4 Focus Points; Flurry of Blows, Patient Defense, and Step of the Wind. Regain points after a short or long rest. Focus save DC 10.', source: '2024 Monk 2–4' }, 'name');
      put('features', { name: 'Uncanny Metabolism', text: 'On initiative, regain all Focus Points and heal 1d6+4; once per long rest.', source: '2024 Monk 2' }, 'name');
      put('features', { name: 'Deflect Attacks', text: 'Reaction: reduce qualifying attack damage by 1d10+8; on reduction to 0, spend 1 Focus Point to redirect with DEX save DC 10.', source: '2024 Monk 3–4' }, 'name');
      put('features', { name: 'Slow Fall', text: 'Reaction when falling: reduce falling damage by 20 at level 4.', source: '2024 Monk 4' }, 'name');
      put('features', { name: 'Speedy', text: 'CON +1 (now 18); speed +10 ft. Dash ignores difficult terrain for the rest of the turn; opportunity attacks against Trista have disadvantage.', source: '2024 Player’s Handbook · feat' }, 'name');
    }
    sheet.maxHp += gain;
    if (Number.isFinite(raw.hp)) sheet.hp = raw.hp <= 0 ? raw.hp : Math.min(sheet.maxHp, raw.hp + gain);
    const oldDice = raw.hitDice || {};
    sheet.hitDice = { ...oldDice, die: choice.die, max: 4,
      current: Math.min(4, Math.max(0, (Number(oldDice.current) || 0) + 1)) };
    if (oldDice.pools?.length === 1) sheet.hitDice.pools = [{ ...oldDice.pools[0], max: 4,
      current: Math.min(4, Math.max(0, (Number(oldDice.pools[0].current) || 0) + 1)) }];
    sheet.sourceStatus = `Approved level 4 · ${choice.feat}; HP d${choice.die} roll ${choice.roll}; ${choice.source}`;
    sheet.levelHistory = [...(raw.levelHistory || []), { date: new Date().toISOString().slice(0, 10), level: 4,
      summary: `Level 4 ${choice.feat}; HP d${choice.die}=${choice.roll}; max HP ${raw.maxHp} → ${sheet.maxHp}`, snapshot }].slice(-30);
    return sheet;
  }

  function applyLevelFourChoices(state, ids) {
    for (const id of ids) {
      const prior = state.party?.[id];
      if (!prior || Number(prior.level) !== 3) continue;
      const next = levelFourSheet(prior);
      state.party[id] = normalizeSheet(next, prior);
      const token = state.tokens?.find(item => item.id === id);
      if (token) { token.maxHp = next.maxHp; token.hp = next.hp; }
    }
    return state;
  }

  function levelThreeSheet(raw, tokenSheet) {
    const build = levelThreeHp[raw.id];
    if (!build || Number(raw.level) >= 3) return raw;
    const sheet = structuredClone(raw);
    const snapshot = structuredClone(raw); snapshot.levelHistory = [];
    const put = (kind, item) => {
      sheet[kind] ||= [];
      const index = sheet[kind].findIndex(old => (kind === 'features' ? old.name === item.name :
        kind === 'spells' ? old.name === item.name : old.id === item.id));
      if (index < 0) sheet[kind].push(item);
      else sheet[kind][index] = { ...sheet[kind][index], ...item };
    };
    const putResource = item => {
      const old = sheet.resources?.find(value => value.id === item.id);
      item.current = old && Number.isFinite(old.max) && Number.isFinite(old.current)
        ? Math.max(0, item.max - (old.max - old.current)) : item.max;
      put('resources', item);
    };
    const oldHitDice = sheet.hitDice || { max: Number(raw.level) || 1, current: Number(raw.level) || 1 };
    const spentDice = Math.max(0, (Number(oldHitDice.max) || 1) - (Number(oldHitDice.current) || 0));
    sheet.level = 3; sheet.proficiency = 2;
    sheet.maxHp = tokenSheet?.maxHp ?? build.level3;
    sheet.hp = tokenSheet?.hp ?? Math.min(build.level3, (Number(raw.hp) || 0) + build.level3 - (Number(raw.maxHp) || build.level2));
    sheet.hitDice = { die: build.die, current: Math.max(0, 3 - spentDice), max: 3 };
    sheet.sourceStatus = `Level 3 table update; ${build.rolls}`;
    if (raw.id === 'pc-trista') {
      sheet.className = 'Monk · Warrior of Shadow'; sheet.speed = 40;
      sheet.senses = 'Darkvision 60 ft.; see through Darkness cast with Shadow Arts';
      put('attacks', action('trista-bonus-strike', 'Martial Arts unarmed strike', 'Bonus action', 6, '1d6+4', 'No Attack action prerequisite while Martial Arts applies.', { damageType: 'bludgeoning' }));
      put('actions', action('trista-flurry', 'Flurry of Blows', 'Bonus action', 6, '1d6+4', 'Spend 1 Focus Point to make two Unarmed Strikes; roll each separately.', { damageType: 'bludgeoning', resourceId: 'trista-focus' }));
      put('actions', action('trista-patient', 'Patient Defense', 'Bonus action', null, '', 'Disengage without spending Focus. Spend 1 Focus Point to Disengage and Dodge.', { cost: 0 }));
      put('actions', action('trista-patient-focus', 'Patient Defense + Dodge', 'Bonus action', null, '', 'Spend 1 Focus Point to Disengage and Dodge.', { resourceId: 'trista-focus' }));
      put('actions', action('trista-step', 'Step of the Wind', 'Bonus action', null, '', 'Dash without spending Focus. Spend 1 Focus Point to Dash and Disengage and double jump distance.', { cost: 0 }));
      put('actions', action('trista-step-focus', 'Step of the Wind + Disengage', 'Bonus action', null, '', 'Spend 1 Focus Point to Dash and Disengage; double jump distance this turn.', { resourceId: 'trista-focus' }));
      put('actions', action('trista-uncanny', 'Uncanny Metabolism', 'When rolling initiative', null, '1d6+3', 'Restore all spent Focus Points and heal 1d6 + Monk level; once per long rest.', { resourceId: 'trista-uncanny' }));
      put('actions', action('trista-deflect', 'Deflect Attacks', 'Reaction', null, '1d10+7', 'When hit by an attack that deals bludgeoning, piercing, or slashing, reduce total damage by 1d10 + DEX + Monk level. If reduced to 0, you may spend 1 Focus Point to redirect.'));
      put('actions', action('trista-redirect', 'Redirect deflected attack', 'After Deflect Attacks', null, '2d6+4', 'Only if Deflect Attacks reduced damage to 0. Spend 1 Focus Point; eligible target makes DEX save DC 10 or takes the attack’s damage type.', { saveAbility: 'DEX', saveDC: 10, resourceId: 'trista-focus' }));
      put('actions', action('trista-minor-illusion', 'Minor Illusion', 'Action', null, '', 'Create a small sound or image within 30 ft.; Wisdom is the spellcasting ability.'));
      put('actions', action('trista-darkness', 'Shadow Arts: Darkness', 'Action', null, '', 'Spend 1 Focus Point to cast Darkness without components; concentration up to 10 minutes. Trista can see within it and move its area within 60 ft. at the start of each turn.', { resourceId: 'trista-focus' }));
      putResource(resource('trista-focus', 'Focus Points', 3, 3, -1, true, 'points'));
      putResource(resource('trista-uncanny', 'Uncanny Metabolism', 1, 1, 0, true, 'use'));
      put('spells', { name: 'Minor Illusion', level: 0, prepared: true, notes: 'Warrior of Shadow; at will; Wisdom spellcasting.' });
      put('spells', { name: 'Darkness', level: 2, prepared: true, notes: 'Shadow Arts; costs 1 Focus Point, no components; concentration.' });
      for (const item of [
        { name: 'Martial Arts', text: 'Bonus-action Unarmed Strike needs no Attack action; Martial Arts die is 1d6.', source: '2024 Monk 1' },
        { name: 'Monk’s Focus', text: '3 Focus Points; Flurry of Blows, Patient Defense, and Step of the Wind. Regain points after a short or long rest. Focus save DC 10.', source: '2024 Monk 2–3' },
        { name: 'Unarmored Movement', text: 'Speed +10 ft. while unarmored and not using a shield.', source: '2024 Monk 2' },
        { name: 'Uncanny Metabolism', text: 'On initiative, regain all Focus Points and heal 1d6+3; once per long rest.', source: '2024 Monk 2' },
        { name: 'Deflect Attacks', text: 'Reaction: reduce qualifying attack damage by 1d10+7; on reduction to 0, spend 1 Focus Point to redirect with DEX save DC 10.', source: '2024 Monk 3' },
        { name: 'Shadow Arts', text: 'Darkvision 60 ft., Minor Illusion, and Darkness for 1 Focus Point; see through and move your own Darkness.', source: '2024 Warrior of Shadow 3' }
      ]) put('features', item);
    } else {
      sheet.className = 'Fighter · Champion';
      put('attacks', action('pebble-hammer', 'Warhammer', 'Action', 6, '1d8+4', 'One-handed with shield. Weapon attacks crit on natural 19–20; Crusher may move a qualifying target 5 ft. once per turn.', { damageType: 'bludgeoning' }));
      put('attacks', action('pebble-handaxe', 'Handaxe', 'Action', 6, '1d6+4', 'Melee or thrown 20/60 ft. Weapon attacks crit on natural 19–20.', { damageType: 'slashing' }));
      put('actions', action('pebble-second-wind', 'Second Wind', 'Bonus action', null, '1d10+3', 'Heal Pebble; once per short or long rest.', { resourceId: 'pebble-second-wind' }));
      put('actions', action('pebble-surge', 'Action Surge', 'On your turn', null, '', 'Take one additional action on your turn; once per short or long rest.', { resourceId: 'pebble-action-surge' }));
      put('actions', action('pebble-champion', 'Improved Critical', 'Passive', null, '', 'Pebble’s weapon attacks score a critical hit on a natural 19 or 20. Double damage dice, not the modifier.'));
      putResource(resource('pebble-second-wind', 'Second Wind', 1, 1, 1, true, 'use'));
      putResource(resource('pebble-action-surge', 'Action Surge', 1, 1, 1, true, 'use'));
      for (const item of [
        { name: 'Second Wind', text: 'Bonus action to heal 1d10+3; once per short or long rest.', source: '2014 Fighter 1' },
        { name: 'Action Surge', text: 'Take one additional action on your turn; once per short or long rest.', source: '2014 Fighter 2' },
        { name: 'Improved Critical', text: 'Weapon attacks score a critical hit on a natural 19 or 20.', source: '2014 Champion 3' }
      ]) put('features', item);
    }
    sheet.levelHistory ||= [];
    sheet.levelHistory.push({ date: new Date().toISOString().slice(0, 10), level: 3,
      summary: `Level 2 and 3 HP rolled (${build.rolls}); ${sheet.className}.`, snapshot });
    return sheet;
  }

  function donavanLevelThreeSheet(raw, tokenSheet) {
    if (Number(raw?.level) >= 3) return raw;
    const next = structuredClone(seeds['pc-donavan']);
    const snapshot = structuredClone(raw); snapshot.levelHistory = [];
    for (const field of ['death', 'conditions', 'concentration', 'effects', 'inspiration', 'publicOptions',
      'passiveOverride', 'tempHp', 'exhaustion', 'levelHistory'])
      if (Object.hasOwn(raw, field)) next[field] = structuredClone(raw[field]);
    next.hp = tokenSheet?.hp ?? Math.max(0, next.maxHp - Math.max(0, (Number(raw.maxHp) || 17) - (Number(raw.hp) || 0)));
    next.maxHp = tokenSheet?.maxHp ?? next.maxHp;
    const spentDice = Math.max(0, (Number(raw.hitDice?.max) || 2) - (Number(raw.hitDice?.current) || 0));
    next.hitDice.current = Math.max(0, 3 - spentDice);
    for (const resource of next.resources) {
      const old = raw.resources?.find(item => item.id === resource.id);
      if (old && Number.isFinite(old.current) && Number.isFinite(old.max))
        resource.current = Math.max(0, resource.max - Math.max(0, old.max - old.current));
    }
    for (const kind of ['attacks', 'actions', 'features', 'spells', 'equipment']) {
      const key = kind === 'attacks' || kind === 'actions' ? 'id' : 'name';
      for (const item of raw[kind] || [])
        if (item && !next[kind].some(existing => existing[key] === item[key])) next[kind].push(structuredClone(item));
    }
    next.levelHistory ||= [];
    next.levelHistory.push({ date: new Date().toISOString().slice(0, 10), level: 3,
      summary: 'Wizard 2 / Cleric 1; Order of Scribes; updated player PDF, AC 16, max HP 24.', snapshot });
    return next;
  }

  function latestLevelThreeSheet(raw, tokenSheet) {
    if (!['pc-ringgo', 'pc-aldric'].includes(raw?.id) || Number(raw.level) >= 3) return raw;
    const next = structuredClone(seeds[raw.id]);
    const snapshot = structuredClone(raw); snapshot.levelHistory = [];
    for (const field of ['death', 'conditions', 'concentration', 'effects', 'inspiration', 'publicOptions',
      'passiveOverride', 'tempHp', 'exhaustion', 'levelHistory'])
      if (Object.hasOwn(raw, field)) next[field] = structuredClone(raw[field]);
    next.hp = tokenSheet?.hp ?? Math.max(0, next.maxHp - Math.max(0, (Number(raw.maxHp) || 0) - (Number(raw.hp) || 0)));
    next.maxHp = tokenSheet?.maxHp ?? next.maxHp;
    next.ac = tokenSheet?.ac ?? next.ac;
    const spentDice = Math.max(0, (Number(raw.hitDice?.max) || 2) - (Number(raw.hitDice?.current) || 0));
    next.hitDice.current = Math.max(0, 3 - spentDice);
    for (const resource of next.resources) {
      const old = raw.resources?.find(item => item.id === resource.id);
      if (old && Number.isFinite(old.current) && Number.isFinite(old.max))
        resource.current = Math.max(0, resource.max - Math.max(0, old.max - old.current));
    }
    if (raw.id === 'pc-ringgo' && raw.money) next.money = structuredClone(raw.money);
    const knownPrefix = raw.id === 'pc-ringgo' ? 'ringgo-' : 'aldric-';
    for (const kind of ['attacks', 'actions'])
      for (const item of raw[kind] || [])
        if (item && !String(item.id || '').startsWith(knownPrefix) && !next[kind].some(existing => existing.id === item.id))
          next[kind].push(structuredClone(item));
    for (const item of raw.equipment || [])
      if (item?.name && !next.equipment.some(existing => existing.name === item.name)) next.equipment.push(structuredClone(item));
    next.levelHistory ||= [];
    next.levelHistory.push({ date: new Date().toISOString().slice(0, 10), level: 3,
      summary: raw.id === 'pc-ringgo' ? 'Rogue 3 Assassin; 24 max HP; Sneak Attack 2d6; Hellish Rebuke.'
        : 'Wizard 3 Evocation; 25 max HP by DM correction; 2nd-level spells and slots.', snapshot });
    return next;
  }

  function normalizeSheet(raw, fallback) {
    const base = structuredClone(fallback || seedSheet(id(raw?.id) || `hero-${Date.now()}`, clean(raw?.name || 'Character', 80), 'pc'));
    if (!raw || typeof raw !== 'object') return base;
    for (const key of ['name', 'player', 'className', 'ancestry', 'background', 'rules', 'source', 'sourceStatus',
      'senses', 'languages', 'notes', 'publicNotes', 'concentration'])
      if (Object.hasOwn(raw, key)) base[key] = clean(raw[key], ['notes', 'publicNotes'].includes(key) ? 3000 : 300);
    for (const key of ['level', 'proficiency', 'speed', 'ac', 'hp', 'maxHp', 'tempHp', 'exhaustion'])
      if (Object.hasOwn(raw, key)) base[key] = number(raw[key], 0, key === 'exhaustion' ? 6 : 999);
    base.abilities = Object.fromEntries(ABILITIES.map(key => [key,
      Object.hasOwn(raw.abilities || {}, key) ? number(raw.abilities[key], 1, 30) : base.abilities[key]]));
    for (const kind of ['saves', 'skills']) {
      const keys = kind === 'saves' ? ABILITIES : Object.keys(SKILLS);
      base[kind] = Object.fromEntries(keys.map(key => {
        const previous = base[kind]?.[key] || {};
        const value = raw[kind]?.[key] || previous;
        return [key, { rank: number(value.rank, 0, 2) || 0,
          override: number(value.override, -99, 99) }];
      }));
    }
    const hd = raw.hitDice || base.hitDice;
    base.hitDice = { die: [6, 8, 10, 12].includes(Number(hd.die)) ? Number(hd.die) : 8,
      current: number(hd.current), max: number(hd.max), details: clean(hd.details || '', 80) };
    if (Array.isArray(hd.pools)) base.hitDice.pools = hd.pools.slice(0, 10).map(p => ({die: [6,8,10,12].includes(Number(p.die)) ? Number(p.die) : 8, current: number(p.current), max: number(p.max)}));
    if (base.hitDice.pools && (base.hitDice.pools.reduce((n,p)=>n+(p.max||0),0)!==base.hitDice.max || base.hitDice.pools.some(p=>p.current===null) || base.hitDice.pools.reduce((n,p)=>n+(p.current||0),0)!==base.hitDice.current)) delete base.hitDice.pools;
    const management = raw.management || base.management || {};
    base.management = {favorites: Array.isArray(management.favorites) ? [...new Set(management.favorites.filter(x=>typeof x==='string').map(x=>clean(x,180)))].slice(0,100) : []};
    base.inspiration = raw.inspiration === undefined ? base.inspiration : raw.inspiration === true;
    for (const key of ['showHp', 'showActions', 'showResources', 'showStatus'])
      base.publicOptions[key] = raw.publicOptions?.[key] === undefined ? base.publicOptions[key] : raw.publicOptions[key] === true;
    base.conditions = Array.isArray(raw.conditions) ? [...new Set(raw.conditions.filter(x => typeof x === 'string').map(x => clean(x, 40)))].slice(0, 30) : base.conditions;
    base.death = { successes: number(raw.death?.successes ?? base.death.successes, 0, 3) || 0,
      failures: number(raw.death?.failures ?? base.death.failures, 0, 3) || 0,
      stable: raw.death?.stable === true };
    for (const kind of ['attacks', 'actions']) if (Array.isArray(raw[kind])) base[kind] = raw[kind].slice(0, 80).map((item, i) => ({
      id: id(item.id) || `${kind}-${i}`, name: clean(item.name, 100), type: clean(item.type, 50),
      attackBonus: number(item.attackBonus, -99, 99), damageDice: clean(item.damageDice, 40),
      damageType: clean(item.damageType, 40), saveAbility: clean(item.saveAbility, 12),
      saveDC: number(item.saveDC, 0, 99), effect: clean(item.effect, 700),
      resourceId: id(item.resourceId), cost: number(item.cost, 0, 99) ?? 1,
      prepared: item.prepared !== false
    }));
    if (Array.isArray(raw.resources)) base.resources = raw.resources.slice(0, 100).map((item, i) => ({
      id: id(item.id) || `resource-${i}`, name: clean(item.name, 100), max: number(item.max),
      current: number(item.current), restoreShort: number(item.restoreShort, -1, 999) || 0,
      restoreLong: item.restoreLong !== false, unit: clean(item.unit, 40), slotLevel: number(item.slotLevel, 0, 9) || 0
    }));
    if (Array.isArray(raw.spells)) base.spells = raw.spells.slice(0, 200).map(item => ({
      name: clean(item.name, 100), level: number(item.level, 0, 9),
      prepared: item.prepared === null ? null : item.prepared === true, notes: clean(item.notes, 500)
    }));
    if (Array.isArray(raw.equipment)) base.equipment = raw.equipment.slice(0, 200).map(item => ({
      name: clean(item.name, 100), quantity: number(item.quantity, 0, 999) || 0,
      category: clean(item.category, 60), notes: clean(item.notes, 300), attuned: item.attuned === true, equipped: item.equipped === true
    }));
    if (Array.isArray(raw.features)) base.features = raw.features.slice(0, 150).map(item => ({
      name: clean(item.name, 100), text: clean(item.text, 900), source: clean(item.source, 150)
    }));
    if (Array.isArray(raw.effects)) base.effects = raw.effects.slice(0, 50).map(item => ({
      name: clean(item.name, 100), remaining: clean(item.remaining, 80),
      timing: clean(item.timing, 80), note: clean(item.note, 500)
    }));
    for (const coin of ['cp', 'sp', 'ep', 'gp', 'pp']) base.money[coin] = number(raw.money?.[coin] ?? base.money[coin], 0, 999999999) || 0;
    for (const key of ['perception', 'insight', 'investigation'])
      base.passiveOverride[key] = number(raw.passiveOverride?.[key] ?? base.passiveOverride[key], -99, 99);
    if (Array.isArray(raw.levelHistory)) base.levelHistory = raw.levelHistory.slice(-30).map(entry => ({
      date: clean(entry.date, 40), level: number(entry.level, 0, 30), summary: clean(entry.summary, 300),
      snapshot: entry.snapshot && typeof entry.snapshot === 'object' ? entry.snapshot : null
    }));
    return base;
  }

  function seedParty(tokens = []) {
    const byId = Object.fromEntries(tokens.map(t => [t.id, t]));
    return Object.fromEntries(Object.entries(seeds).filter(([key]) => key !== 'ally-dracuseth').map(([key, original]) => {
      const sheet = normalizeSheet(original, original);
      const token = byId[key];
      if (token) {
        sheet.hp = token.maxHp > 0 ? token.hp : null;
        sheet.maxHp = token.maxHp > 0 ? token.maxHp : null;
        sheet.tempHp = token.tempHp;
        sheet.ac = token.ac; sheet.exhaustion = token.exhaustion || 0;
      }
      return [key, sheet];
    }));
  }

  function normalizeParty(raw, tokens = [], levelThree = false, preserve = false) {
    if (preserve) return Object.fromEntries(Object.entries(raw || {}).slice(0,80).filter(([key,value])=>/^[-A-Za-z0-9_]{1,80}$/.test(key)&&value&&typeof value==='object').map(([key,value])=>[key,normalizeSheet(value,seedSheet(key,value.name||'Character',value.role==='ally'?'ally':'pc'))]));
    const result = seedParty(tokens);
    if (raw && typeof raw === 'object') for (const [key, value] of Object.entries(raw).slice(0, 80)) {
      if (!/^[-A-Za-z0-9_]{1,80}$/.test(key) || !value || typeof value !== 'object') continue;
      if (key === 'ally-dracuseth') continue;
      const seed = seeds[key];
      if (levelThree && key === 'pc-donavan' && Number(value.level) < 3) {
        result[key] = normalizeSheet(donavanLevelThreeSheet(value, result[key]), seed);
        continue;
      }
      if (levelThree && ['pc-ringgo', 'pc-aldric'].includes(key) && Number(value.level) < 3) {
        result[key] = normalizeSheet(latestLevelThreeSheet(value, result[key]), seed);
        continue;
      }
      const previousSource = {
        'pc-aldric': ['Playable DM-built sheet; replace choices with Bowman’s sheet if supplied',
          'Player export 2026-09-25; seven 1st-level spells flagged prepared, but a level 2 wizard with INT 18 may prepare six; confirm selection'],
        'pc-ringgo': ['Current uploaded sheet; second Expertise choice remains open',
          'Player PDF 2026-09-25; second Expertise choice remains open'],
        'pc-donavan': ['Current uploaded sheet; prepared spells and newer spell sources need confirmation',
          'Player PDF 2026-09-25; only Command and Identify marked prepared; other preparation choices need confirmation']
      };
      if (seed && previousSource[key]?.includes(value.sourceStatus)) {
        const updated = structuredClone(seed);
        const tokenSheet = result[key];
        for (const field of ['hp', 'maxHp', 'tempHp', 'ac', 'exhaustion']) updated[field] = tokenSheet[field];
        for (const field of ['conditions', 'concentration', 'effects', 'death', 'inspiration', 'levelHistory', 'publicOptions', 'passiveOverride'])
          if (Object.hasOwn(value, field)) updated[field] = structuredClone(value[field]);
        if (value.hitDice?.current != null && value.hitDice?.max != null)
          updated.hitDice.current = Math.max(0, updated.hitDice.max - Math.max(0, value.hitDice.max - value.hitDice.current));
        for (const item of updated.resources) {
          const prior = value.resources?.find(existing => existing.id === item.id);
          if (prior && Number.isFinite(prior.current) && Number.isFinite(prior.max))
            item.current = Math.max(0, item.max - Math.max(0, prior.max - prior.current));
        }
        if (key === 'pc-donavan') {
          const coin = value.money || {};
          if (coin.cp || coin.sp || coin.ep || coin.pp || Number(coin.gp) !== 10) updated.money = coin;
        } else if (value.money) updated.money = value.money;
        result[key] = normalizeSheet(updated, seed);
        continue;
      }
      if (key === 'pc-aldric' && value.sourceStatus === 'Story confirmed; level and all combat numbers pending') {
        result[key] = normalizeSheet(seed, seed);
        continue;
      }
      const oldSource = /^(Guide values;|Story guide;|Provisional; verify equipment)/.test(value.sourceStatus || '');
      let prepared = value;
      if (seed && oldSource) {
        prepared = structuredClone(value);
        for (const field of ['source', 'sourceStatus', 'rules']) prepared[field] = seed[field];
        if (!prepared.languages) prepared.languages = seed.languages;
        if (key === 'pc-trista' && /Guide omits several ability scores/.test(prepared.notes || '')) prepared.notes = seed.notes;
        if (key === 'pc-ringgo' && /unlabeled Potions/.test(prepared.notes || '')) prepared.notes = seed.notes;
        if (key === 'pc-donavan' && /Set level, HP, AC/.test(prepared.notes || '')) prepared.notes = seed.notes;
        for (const field of ['level', 'proficiency', 'speed', 'ac', 'maxHp'])
          if (prepared[field] == null) prepared[field] = seed[field];
        if (prepared.hp == null) prepared.hp = seed.hp;
        prepared.abilities ||= {};
        for (const ability of ABILITIES) if (prepared.abilities[ability] == null) prepared.abilities[ability] = seed.abilities[ability];
        for (const kind of ['saves', 'skills']) {
          prepared[kind] ||= {};
          for (const [name, entry] of Object.entries(seed[kind] || {})) {
            const old = prepared[kind][name];
            if (!old || (old.rank === 0 && old.override == null && entry.rank > 0)) prepared[kind][name] = entry;
          }
        }
        if (!prepared.attacks?.length) prepared.attacks = seed.attacks;
        if (!prepared.resources?.length) prepared.resources = seed.resources;
        if (key === 'pc-donavan' && !prepared.features?.some(item => item.name === 'Arcane Recovery'))
          prepared.features = [...(prepared.features || []), ...seed.features];
        if (key === 'pc-trista' && prepared.equipment?.length === 1 &&
          prepared.equipment[0].name === 'Dagger' && prepared.equipment[0].quantity === 1)
          prepared.equipment = seed.equipment;
        if (key === 'pc-ringgo' && prepared.equipment?.some(item => item.name === 'Potion (unidentified label)'))
          prepared.equipment = seed.equipment;
        if (key === 'pc-donavan' && prepared.equipment?.length === 2 &&
          prepared.equipment[0].name === 'Walking staff') prepared.equipment = seed.equipment;
        if (key === 'pc-donavan' && prepared.spells?.length) prepared.spells = prepared.spells.map(spell => {
          const current = seed.spells.find(item => item.name === spell.name);
          return current ? { ...spell, level: spell.level ?? current.level,
            prepared: spell.prepared ?? current.prepared, notes: current.notes } : spell;
        });
        if (key === 'ally-sildar' && prepared.ac === 16 && prepared.hp === 1) prepared.ac = null;
      }
      if (key === 'pc-trista' && prepared.attacks?.some(item => item.id === 'trista-dagger') &&
        !prepared.attacks.some(item => item.id === 'trista-spear')) {
        prepared = structuredClone(prepared);
        prepared.attacks.splice(1, 0, seed.attacks.find(item => item.id === 'trista-spear'));
      }
      if (key === 'pc-donavan' && seed.actions.some(item => !prepared.actions?.some(existing => existing.id === item.id))) {
        prepared = structuredClone(prepared);
        prepared.actions = [...(prepared.actions || []), ...seed.actions.filter(item =>
          !prepared.actions.some(existing => existing.id === item.id))];
      }
      if (key === 'pc-donavan' && prepared.spells?.length) {
        prepared = structuredClone(prepared);
        for (const spell of prepared.spells) {
          const source = seed.spells.find(item => item.name === spell.name);
          if (source && /Later-source spell on current sheet/.test(spell.notes || '')) spell.notes = source.notes;
        }
      }
      if (levelThree && levelThreeHp[key] && Number(prepared.level) < 3)
        prepared = levelThreeSheet({ ...prepared, id: key }, result[key]);
      result[key] = normalizeSheet(prepared, result[key] || seedSheet(key, value.name || 'Character', value.role === 'ally' ? 'ally' : 'pc'));
    }
    return result;
  }

  function passive(sheet, skill) {
    const override = sheet.passiveOverride?.[skill.toLowerCase()];
    if (override !== null && override !== undefined) return override;
    const bonus = rankValue(sheet, skill, 'skills');
    return bonus === null ? null : 10 + bonus;
  }

  function safeView(sheet) {
    const options = sheet.publicOptions || { showHp: true, showActions: true, showResources: false, showStatus: true };
    return { id: sheet.id, name: sheet.name, className: sheet.className, ancestry: sheet.ancestry,
      level: sheet.level, showHp: options.showHp, ac: options.showHp ? sheet.ac : null,
      hp: options.showHp ? sheet.hp : null, maxHp: options.showHp ? sheet.maxHp : null,
      tempHp: options.showHp ? sheet.tempHp : null,
      speed: sheet.speed, senses: sheet.senses,
      conditions: options.showStatus ? sheet.conditions || [] : [],
      exhaustion: options.showStatus ? sheet.exhaustion : null,
      concentration: options.showStatus ? sheet.concentration : '',
      publicNotes: sheet.publicNotes, inspiration: options.showStatus ? sheet.inspiration : false,
      resources: options.showResources ? sheet.resources.filter(item => item.name && !item.name.toLowerCase().includes('secret'))
        .map(item => ({ name: item.name, current: item.current, max: item.max })) : [],
      attacks: options.showActions ? [...sheet.attacks, ...sheet.actions].filter(item => item.prepared).map(item => ({ name: item.name,
        type: item.type, attackBonus: item.attackBonus, damageDice: item.damageDice,
        damageType: item.damageType, saveAbility: item.saveAbility, saveDC: item.saveDC,
        effect: item.effect })) : [] };
  }

  function ownerView(sheet) {
    const bonus = (key, kind) => ({ name: kind === 'saves' ? key.toUpperCase() : key,
      bonus: rankValue(sheet, key, kind), rank: sheet[kind]?.[key]?.rank || 0 });
    const copyAction = item => ({ id: item.id, name: item.name, type: item.type, attackBonus: item.attackBonus,
      damageDice: item.damageDice, damageType: item.damageType, saveAbility: item.saveAbility,
      saveDC: item.saveDC, effect: item.effect, resourceId: item.resourceId,
      cost: item.cost, prepared: item.prepared !== false });
    return {
      id: sheet.id, name: sheet.name, player: sheet.player, className: sheet.className,
      ancestry: sheet.ancestry, background: sheet.background, level: sheet.level,
      rules: sheet.rules,
      proficiency: sheet.proficiency, speed: sheet.speed, senses: sheet.senses,
      languages: sheet.languages, ac: sheet.ac, hp: sheet.hp, maxHp: sheet.maxHp,
      tempHp: sheet.tempHp, hitDice: { ...sheet.hitDice },
      abilities: Object.fromEntries(ABILITIES.map(key => [key, {
        score: sheet.abilities?.[key], modifier: abilityMod(sheet.abilities?.[key]) }])),
      saves: ABILITIES.map(key => bonus(key, 'saves')),
      skills: Object.keys(SKILLS).map(key => bonus(key, 'skills')),
      passives: Object.fromEntries(['Perception', 'Insight', 'Investigation'].map(key => [key, passive(sheet, key)])),
      attacks: sheet.attacks.map(copyAction), actions: sheet.actions.map(copyAction),
      spells: sheet.spells.map(item => ({ name: item.name, level: item.level,
        prepared: item.prepared, notes: item.notes })),
      resources: sheet.resources.filter(item => item.name && !item.name.toLowerCase().includes('secret'))
        .map(item => ({ id: item.id, name: item.name,
        current: item.current, max: item.max, unit: item.unit, slotLevel: globalThis.ECHO_CHARACTER_TOOLS?.slotLevel(item) || item.slotLevel || 0 })),
      equipment: sheet.equipment.map(item => ({ name: item.name, quantity: item.quantity,
        category: item.category, notes: item.notes, equipped: item.equipped === true, attuned: item.attuned })),
      money: { ...sheet.money },
      features: sheet.features.map(item => ({ name: item.name, text: item.text, source: item.source })),
      inspiration: sheet.inspiration, death: { ...sheet.death },
      exhaustion: sheet.exhaustion, conditions: [...sheet.conditions],
      concentration: sheet.concentration,
      effects: sheet.effects.map(item => ({ name: item.name, remaining: item.remaining,
        timing: item.timing, note: item.note })),
      favorites: [...(sheet.management?.favorites || [])],
      publicNotes: sheet.publicNotes
    };
  }

  function previewRest(sheet, kind, options = {}) {
    const next = normalizeSheet(sheet, sheet);
    const changes = [];
    if ((next.hp === null || next.hp < 1) && options.overrideAtZero !== true)
      return { sheet: next, changes: [], blocked: 'Confirm current HP is at least 1, or choose a DM override.' };
    if (kind === 'short') {
      const spend = Math.min(number(options.hitDiceSpent, 0, 99) || 0, next.hitDice.current || 0);
      const healing = Math.max(0, number(options.healing, 0, 999) || 0);
      if (spend) { next.hitDice.current -= spend; changes.push(`Spend ${spend} Hit Dice`); }
      if (healing) { next.hp = Math.min(next.maxHp ?? 999, (next.hp || 0) + healing); changes.push(`Heal ${healing} HP from Hit Dice`); }
      for (const item of next.resources) if (options.restoreResources !== false && item.restoreShort && item.current !== null && item.max !== null) {
        const gain = item.restoreShort < 0 ? item.max : item.restoreShort;
        const old = item.current; item.current = Math.min(item.max, item.current + gain);
        if (item.current !== old) changes.push(`${item.name}: ${old} → ${item.current}`);
      }
    } else if (kind === 'long') {
      if (options.restoreHp !== false && next.maxHp !== null) {
        next.hp = next.maxHp; changes.push(`HP → ${next.maxHp}`);
      }
      if (options.restoreHitDice !== false && next.hitDice.max !== null && next.hitDice.current !== null) {
        const gain = next.rules.startsWith('2024') ? next.hitDice.max : Math.max(1, Math.floor(next.hitDice.max / 2));
        const old = next.hitDice.current; next.hitDice.current = Math.min(next.hitDice.max, old + gain);
        if (old !== next.hitDice.current) changes.push(`Hit Dice: ${old} → ${next.hitDice.current}`);
      }
      if (options.restoreResources !== false) for (const item of next.resources) {
        if (item.restoreLong && item.max !== null && item.current !== item.max) {
          changes.push(`${item.name}: ${item.current ?? '—'} → ${item.max}`); item.current = item.max;
        }
      }
      if (options.reduceExhaustion === true && next.exhaustion > 0) {
        next.exhaustion--; changes.push(`Exhaustion → ${next.exhaustion}`);
      }
      if (options.clearDeath !== false && next.hp > 0) {
        next.death = { successes: 0, failures: 0, stable: false };
        changes.push('Death saves cleared');
      }
      if (next.tempHp > 0) { next.tempHp = 0; changes.push('Temporary HP expire at the end of the long rest'); }
    }
    return { sheet: next, changes };
  }

  globalThis.ECHO_PARTY_DATA = { ABILITIES, SKILLS, seeds, seedSheet, normalizeSheet, seedParty,
    normalizeParty, levelThreeSheet, levelFourSheet, applyLevelFourChoices, donavanLevelThreeSheet, latestLevelThreeSheet,
    abilityMod, proficiencyForLevel, rankValue, passive, safeView, ownerView, previewRest };
})();

(() => {
  'use strict';
  const data = globalThis.ECHO_COMBAT_DATA;
  if (!data) return;
  const $ = id => document.getElementById(id);
  const el = (tag, text = '', cls = '') => { const item = document.createElement(tag); item.textContent = text; item.className = cls; return item; };
  const button = (parent, label, fn) => { const item = el('button', label); item.type = 'button'; item.addEventListener('click', fn); parent.append(item); return item; };
  const field = (parent, label, value, change, type = 'text') => {
    const wrap = el('label', label, 'combat-field');
    const input = el(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
    if (type !== 'textarea' && type !== 'select') input.type = type;
    if (type === 'checkbox') input.checked = !!value;
    else input.value = value ?? '';
    input.addEventListener('change', () => change(type === 'checkbox' ? input.checked : input.value));
    wrap.append(input); parent.append(wrap); return input;
  };
  const select = (parent, label, options, value, change) => {
    const wrap = el('label', label, 'combat-field'), input = el('select');
    for (const [id, name] of options) { const option = el('option', name); option.value = id; input.append(option); }
    input.value = value; input.addEventListener('change', () => change(input.value)); wrap.append(input); parent.append(wrap); return input;
  };
  const section = (parent, name, note = '') => {
    const box = el('section', '', 'combat-section'); box.append(el('h3', name));
    if (note) box.append(el('p', note, 'combat-muted')); parent.append(box); return box;
  };
  let host, tab = 'encounters', encounterId = '', creatureId = 'goblin';
  let damage = { mode: 'damage', type: 'slashing', amount: '0', selected: [], overrides: {}, amounts: {}, conditions: {} };
  let area = { shape: '', selected: [], damage: '0', type: 'fire', dc: '13', ability: 'dex', rolls: {} };
  let rollDraft = { actor: '', target: '', label: '', kind: 'attack', count: 1, sides: 20, modifier: 0, mode: 'normal', type: '', range: 'melee', cover: 'none', nearbyEnemy: false, bless: false, sneak: false };
  const tokens = () => host.tokens();
  const combat = () => host.combat();
  const current = () => host.encounters().find(e => e.id === encounterId);
  const plan = () => combat().plans[encounterId] ||= data.normalizePlan(null, encounterId);
  const save = label => { host.commit(label); render(); };
  const tokenOptions = () => tokens().map(t => [t.id, `${t.name} · ${t.team}`]);
  const encounterOptions = () => host.encounters().map(e => [e.id, e.name]);
  function open(next) { if (next) tab = next; $('combat-scrim').hidden = false; $('combat-drawer').hidden = false; render(); }
  function close() {
    $('combat-scrim').hidden = true; $('combat-drawer').hidden = true;
    (document.querySelector('#dm-app.run-mode') ? $('quick-encounter') : document.querySelector('.header-menu summary'))?.focus();
  }
  function renderNav() {
    if (!host.encounters().some(e => e.id === encounterId)) encounterId = host.encounters()[0]?.id || '';
    $('combat-tool-select').value = tab;
    $('combat-context').textContent = `${host.sessionName()} · ${host.encounters().length} encounters`;
  }
  function renderEncounters(root) {
    const choose = section(root, 'Encounter library', 'Edit a scene, capture token positions, then save it as a reusable template. Each wave is deployed deliberately.');
    select(choose, 'Encounter', encounterOptions(), encounterId, value => { encounterId = value; render(); });
    const active = current();
    if (!active) { choose.append(el('p', 'Add an encounter in Prepare this session to start.')); return; }
    const page = data.ENCOUNTER_PAGES[encounterId];
    choose.append(el('p', `Adventure context: Lost Mine of Phandelver${page ? `, printed p. ${page}` : ''}. Check the keyed room and private map for exact positions, hazards, and treasure.`, 'combat-muted'));
    button(choose, page ? `Open private adventure · p. ${page}` : 'Open private adventure book', () => host.openBook('lmop', page || 1));
    const p = plan();
    for (const [name, key] of [['Terrain and hazards', 'terrain'], ['Objective', 'objective'], ['Starting positions', 'starting'],
      ['Reinforcements', 'reinforcements'], ['Non-combat outcomes', 'nonCombat'], ['Morale', 'morale'],
      ['Retreat route', 'retreat'], ['Negotiation', 'negotiation']])
      field(choose, name, p[key], value => { p[key] = value.slice(0, 800); save(`Updated ${active.name}: ${name}`); }, 'textarea');
    const assigned = tokens().filter(t => t.encounter === encounterId || t.team === 'ally');
    const waves = section(root, 'Waves and starting positions', 'Select wave members from the encounter roster. Place them on a map and capture their positions before saving a template.');
    for (const [index, wave] of p.waves.entries()) {
      const row = el('div', '', 'combat-row'); row.append(el('strong', `${wave.name} · ${wave.tokenIds.length} combatants${wave.deployed ? ' · deployed' : ''}`));
      row.append(el('p', wave.note || 'No wave note.'));
      button(row, 'Edit wave', () => {
        const name = prompt('Wave name:', wave.name); if (name === null) return;
        const note = prompt('Wave instructions:', wave.note); if (note === null) return;
        wave.name = name.slice(0, 80); wave.note = note.slice(0, 400); save(`Edited ${wave.name}`);
      });
      button(row, 'Choose members', () => {
        const box = el('div', '', 'combat-picks');
        for (const t of assigned) { const label = el('label', t.name); const check = el('input'); check.type = 'checkbox'; check.checked = wave.tokenIds.includes(t.id);
          check.addEventListener('change', () => { wave.tokenIds = check.checked ? [...new Set([...wave.tokenIds, t.id])] : wave.tokenIds.filter(id => id !== t.id); save(`Updated ${wave.name} members`); });
          label.prepend(check); box.append(label); }
        row.append(box);
      });
      button(row, 'Capture map positions', () => {
        wave.positions = Object.fromEntries(wave.tokenIds.map(id => tokens().find(t => t.id === id)).filter(t => t?.placed)
          .map(t => [t.id, { x: t.x, y: t.y }])); save(`Captured ${wave.name} positions`);
      });
      button(row, 'Deploy wave', () => host.deployWave(encounterId, index));
      button(row, 'Remove', () => { p.waves.splice(index, 1); save(`Removed ${wave.name}`); });
      waves.append(row);
    }
    button(waves, 'Add wave', () => { p.waves.push({ name: `Wave ${p.waves.length + 1}`, tokenIds: assigned.map(t => t.id), positions: {}, note: '', deployed: false }); save(`Added wave to ${active.name}`); });
    const reuse = section(root, 'Reuse this encounter', 'Templates carry enemy and ally stat snapshots, positions, and the plan into a later custom session.');
    button(reuse, 'Save as template', () => host.saveTemplate(encounterId));
    for (const item of combat().library) {
      const row = el('div', '', 'combat-row'); row.append(el('strong', `${item.name} · ${item.combatants.length} combatants`));
      button(row, 'Use in this session', () => host.useTemplate(item.id));
      button(row, 'Remove template', () => { combat().library = combat().library.filter(x => x.id !== item.id); save(`Removed ${item.name} template`); }); reuse.append(row);
    }
  }
  function renderCreatures(root) {
    const all = { ...data.CREATURES, ...combat().creatures };
    const box = section(root, 'Creature library', 'Verified combat cards are listed below. Search the private Monster Manual and adventure appendices for other creatures; open the full block before adding one to an encounter.');
    const catalog = globalThis.ECHO_RULES_DATA?.creatures || [];
    const search = el('input'); search.type = 'search'; search.placeholder = 'Find a monster by name'; search.setAttribute('aria-label', 'Find a Monster Manual creature'); box.append(search);
    const matches = el('div', '', 'combat-creature-matches'); box.append(matches);
    const updateMatches = () => {
      matches.replaceChildren();
      const query = search.value.trim().toLowerCase();
      if (!query) { matches.append(el('p', `${catalog.length} source-linked creature entries indexed. Search by name, or choose a verified card below.`, 'combat-muted')); return; }
      const found = catalog.filter(item => item.name.toLowerCase().includes(query));
      for (const item of found.slice(0, 25)) {
        const row = el('div', '', 'combat-row'); row.append(el('strong', `${item.name} · ${item.source}`));
        button(row, 'Open full stat block', () => host.openBook(item.book, item.pdfPage)); matches.append(row);
      }
      if (!found.length) matches.append(el('p', 'No matching source entry. Try a broader name.', 'combat-muted'));
      if (found.length > 25) matches.append(el('p', `Showing 25 of ${found.length}; narrow the name.`, 'combat-muted'));
    };
    search.addEventListener('input', updateMatches); updateMatches();
    select(box, 'Creature', Object.entries(all).map(([id, c]) => [id, c.name]), creatureId, value => { creatureId = value; render(); });
    const c = all[creatureId]; if (!c) return;
    box.append(el('p', `${c.size || ''} · ${c.alignment || ''} · CR ${c.cr ?? '?'} · ${c.xp ?? '?'} XP`));
    box.append(el('p', `AC ${c.ac ?? '?'} · HP ${c.hp ?? '?'} (${c.hitDice || '?'}) · Speed ${c.speed || '?'}`));
    box.append(el('p', `STR ${c.abilities?.[0] ?? '?'} · DEX ${c.abilities?.[1] ?? '?'} · CON ${c.abilities?.[2] ?? '?'} · INT ${c.abilities?.[3] ?? '?'} · WIS ${c.abilities?.[4] ?? '?'} · CHA ${c.abilities?.[5] ?? '?'}`));
    for (const [label, key] of [['Saves', 'saves'], ['Skills', 'skills'], ['Senses', 'senses'], ['Languages', 'languages'],
      ['Resistances', 'resistances'], ['Vulnerabilities', 'vulnerabilities'], ['Immunities', 'immunities'], ['Condition immunities', 'conditionImmunities']])
      box.append(el('p', `${label}: ${c[key] || '—'}`));
    for (const [label, key] of [['Traits', 'traits'], ['Actions', 'actions'], ['Reactions', 'reactions'], ['Spells', 'spells']]) {
      const part = section(root, label);
      for (const item of c[key] || []) {
        const row = el('div', '', 'combat-row');
        row.append(el('p', typeof item === 'string' ? item :
          `${item.name}: ${item.text || [item.range, item.bonus === null ? '' : `+${item.bonus} to hit`, `${item.dice || ''} ${item.type || ''}`, item.note].filter(Boolean).join(' · ')}`));
        if (combat().creatures[creatureId]) {
          button(row, 'Edit', () => {
            const name = prompt(`${label.slice(0, -1)} name:`, item.name || String(item)); if (name === null) return;
            const value = prompt('Details, dice, type, and limits:', item.text || [item.range, item.dice, item.type, item.note].filter(Boolean).join(' · ')); if (value === null) return;
            c[key][c[key].indexOf(item)] = { name: name.slice(0, 100), text: value.slice(0, 800) }; save(`Edited ${name}`);
          });
          button(row, 'Remove', () => { c[key] = c[key].filter(x => x !== item); save(`Removed ${label.toLowerCase()}`); });
        }
        part.append(row);
      }
      if (!(c[key] || []).length) part.append(el('p', 'None listed.', 'combat-muted'));
    }
    const source = section(root, 'Source and variants'); source.append(el('p', c.source || 'DM entry'), el('p', c.variants || 'No variant notes.'));
    if (c.book) button(source, 'Open source page', () => host.openBook(c.book, c.page));
    button(source, 'Add as combatant', () => host.addCreature(creatureId, encounterId));
    button(source, 'Create editable variant', () => {
      const name = prompt('Variant name:', `${c.name} variant`); if (!name?.trim()) return;
      const id = `creature-${Date.now()}`; combat().creatures[id] = structuredClone({ ...c, name: name.trim(), source: `${c.source} · DM variant`, book: '', page: null });
      creatureId = id; save(`Created ${name} variant`);
    });
    if (combat().creatures[creatureId]) {
      const edit = section(root, 'Edit this variant');
      field(edit, 'Ability scores (STR, DEX, CON, INT, WIS, CHA)', (c.abilities || []).join(', '), value => {
        const scores = value.split(',').map(Number);
        if (scores.length !== 6 || scores.some(n => !Number.isFinite(n) || n < 1 || n > 30)) { host.toast('Enter six scores from 1 to 30.'); return; }
        c.abilities = scores; save(`Updated ${c.name} abilities`);
      });
      for (const [label, key] of [['Name', 'name'], ['Source', 'source'], ['CR', 'cr'], ['XP', 'xp'], ['AC', 'ac'], ['HP', 'hp'],
        ['Hit Dice', 'hitDice'], ['Speed', 'speed'], ['Saves', 'saves'], ['Skills', 'skills'], ['Senses', 'senses'],
        ['Languages', 'languages'], ['Resistances', 'resistances'], ['Vulnerabilities', 'vulnerabilities'],
        ['Immunities', 'immunities'], ['Condition immunities', 'conditionImmunities'], ['Variant notes', 'variants']])
        field(edit, label, c[key], value => { c[key] = ['cr', 'xp', 'ac', 'hp'].includes(key) ? Number(value) || 0 : value.slice(0, 800); save(`Updated ${c.name}`); });
      for (const [label, key] of [['Trait', 'traits'], ['Action', 'actions'], ['Reaction', 'reactions'], ['Spell', 'spells']])
        button(edit, `Add ${label.toLowerCase()}`, () => {
          const name = prompt(`${label} name:`); if (!name?.trim()) return;
          const text = prompt(`${label} details, rolls, and limits:`); if (text === null) return;
          c[key] ||= []; c[key].push({ name: name.slice(0, 100), text: text.slice(0, 800) }); save(`Added ${label.toLowerCase()}`);
        });
    }
  }
  function renderFlow(root) {
    const setup = section(root, 'Start combat', 'Place participants on the map, then set their initiative. Everyone with a token on this map needs a value before the order is built.');
    const placed = tokens().filter(t => t.placed && t.scene === host.scene() && (t.team !== 'enemy' || t.hp > 0));
    if (!placed.length) setup.append(el('p', 'Place the participants on a battle map first.', 'combat-muted'));
    for (const t of placed) {
      const row = el('div', '', 'combat-row'); row.append(el('strong', t.name));
      field(row, 'Initiative', t.initiative, value => host.setInitiative(t.id, value), 'number');
      field(row, 'Initiative bonus', t.initBonus, value => host.setInitBonus(t.id, value), 'number');
      button(row, 'Roll', () => host.rollInitiative(t.id)).disabled = t.initBonus === null;
      setup.append(row);
    }
    button(setup, 'Roll placed enemies', () => host.rollEnemies()).disabled = !placed.some(t => t.team === 'enemy');
    button(setup, 'Build turn order', () => host.buildOrder()).disabled = !placed.length;
    const box = section(root, 'Turn flow', 'Surprise, readied actions, reactions, concentration, and ongoing effects are tracked here. Reminders never apply damage on their own.');
    for (const t of tokens().filter(t => t.placed && t.scene === host.scene())) {
      const record = combat().tokens[t.id] ||= data.creatureDefense(t.type, combat().creatures);
      const row = el('div', '', 'combat-row'); row.append(el('strong', `${t.name} · ${t.initiative ?? '—'} · ${t.hp}/${t.maxHp || '?'} HP`));
      field(row, 'Surprised', record.surprised, value => { record.surprised = value; host.setCondition(t.id, 'Surprised', value); }, 'checkbox');
      field(row, 'Reaction used', record.reactionUsed, value => { record.reactionUsed = value; save(`${t.name} reaction ${value ? 'used' : 'ready'}`); }, 'checkbox');
      field(row, 'Readied action and trigger', record.ready, value => { record.ready = value.slice(0, 300); save(`${t.name} readied action`); });
      field(row, 'Concentration', record.concentration, value => { record.concentration = value.slice(0, 200); host.setConcentration(t.id, record.concentration); });
      button(row, 'Open token card', () => { close(); host.openCard(t.id); }); box.append(row);
    }
    const effects = section(root, 'Timed conditions and effect reminders', 'Set the affected token and the actor whose start or end of turn matters. A count of 1 flags the next matching turn.');
    for (const effect of combat().effects) {
      const row = el('div', '', 'combat-row');
      row.append(el('strong', `${tokens().find(t => t.id === effect.tokenId)?.name || '?'} · ${effect.name}${effect.due ? ' · DUE' : ''}`));
      row.append(el('p', `${effect.condition || 'Effect'} · ${effect.triggerPoint} of ${tokens().find(t => t.id === effect.triggerActor)?.name || '?'} turn · ${effect.remaining} triggers left${effect.repeatSave ? ' · repeat save' : ''}${effect.amount ? ` · ${effect.amount} ${effect.damageType} ${effect.mode}` : ''}${effect.note ? ` · ${effect.note}` : ''}`));
      if (effect.amount) button(row, 'Review HP change', () => {
        damage = { mode: effect.mode, type: effect.damageType, amount: String(effect.amount),
          selected: [effect.tokenId], overrides: {}, amounts: {}, conditions: {} };
        tab = 'damage'; render();
      });
      button(row, 'Edit timer', () => {
        const remaining = prompt('Matching turns left:', String(effect.remaining)); if (remaining === null) return;
        const note = prompt('Reminder or repeat save detail:', effect.note); if (note === null) return;
        effect.remaining = Math.max(0, Math.min(99, Number(remaining) || 0));
        effect.note = note.slice(0, 400); effect.fired = false; effect.due = false;
        save(`Adjusted ${effect.name} timer`);
      });
      button(row, 'Acknowledge / reset', () => { effect.due = false; save(`Reviewed ${effect.name}`); });
      button(row, 'End effect', () => host.endEffect(effect.id)); effects.append(row);
    }
    button(effects, 'Add timed effect', () => {
      const target = prompt(`Affected token ID:\n${tokens().map(t => `${t.id} — ${t.name}`).join('\n')}`, tokens()[0]?.id || '');
      if (!target || !tokens().some(t => t.id === target)) return;
      const name = prompt('Effect name:'); if (!name?.trim()) return;
      const condition = prompt('Condition (blank if none):', ''); if (condition === null) return;
      const actor = prompt('Whose turn triggers it? Enter token ID:', target); if (!actor || !tokens().some(t => t.id === actor)) return;
      const point = prompt('At start or end of turn?', 'end'); if (!point) return;
      const count = prompt('Matching turns until due (1 for next turn):', '1'); if (count === null) return;
      const repeat = confirm('Repeat a saving throw whenever this trigger occurs?');
      const amount = prompt('Optional damage or healing amount each trigger (0 for none):', '0'); if (amount === null) return;
      const mode = Number(amount) > 0 ? prompt('Damage or healing?', 'damage') : 'damage'; if (mode === null) return;
      const damageType = Number(amount) > 0 ? prompt('Damage type, if any:', '') : ''; if (damageType === null) return;
      host.addEffect({ tokenId: target, name, condition, triggerActor: actor, triggerPoint: point === 'start' ? 'start' : 'end',
        remaining: Math.max(1, Number(count) || 1), repeatSave: repeat,
        amount: Math.max(0, Number(amount) || 0), mode: mode === 'healing' || mode === 'heal' ? 'heal' : 'damage', damageType, note: '' });
    });
  }
  function renderRolls(root) {
    const box = section(root, 'Roll shortcut', 'Choose the dice, modifier, and advantage before rolling. Results stay private until you explicitly show them on the TV.');
    select(box, 'Actor', [['', 'Unassigned'], ...tokenOptions()], rollDraft.actor, value => { rollDraft.actor = value; render(); });
    select(box, 'Roll type', [['attack', 'Attack'], ['save', 'Saving throw'], ['check', 'Ability check'], ['spell', 'Spell or effect'], ['damage', 'Damage or healing']],
      rollDraft.kind, value => { rollDraft.kind = value; render(); });
    if (rollDraft.kind === 'save' || rollDraft.kind === 'check') {
      select(box, rollDraft.kind === 'save' ? 'Saving throw' : 'Ability check',
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(x => [x, x.toUpperCase()]), rollDraft.ability || 'dex',
        value => { rollDraft.ability = value; });
      button(box, 'Use sheet modifier', () => {
        const bonus = rollDraft.kind === 'save' ? host.saveBonus(rollDraft.actor, rollDraft.ability || 'dex')
          : host.checkBonus(rollDraft.actor, rollDraft.ability || 'dex');
        if (bonus === null) { host.toast('The modifier is unknown. Enter it from the live sheet.'); return; }
        rollDraft.modifier = bonus; rollDraft.label ||= `${(rollDraft.ability || 'dex').toUpperCase()} ${rollDraft.kind}`; render();
      });
    }
    field(box, 'Label', rollDraft.label, value => { rollDraft.label = value.slice(0, 80); });
    select(box, 'Advantage', [['normal', 'Normal'], ['advantage', 'Advantage'], ['disadvantage', 'Disadvantage']],
      rollDraft.mode, value => { rollDraft.mode = value; render(); });
    if (rollDraft.kind === 'attack') {
      select(box, 'Target', [['', 'Choose target'], ...tokenOptions()], rollDraft.target, value => { rollDraft.target = value; render(); });
      select(box, 'Attack range', [['melee', 'Melee'], ['ranged', 'Ranged']], rollDraft.range, value => { rollDraft.range = value; render(); });
      select(box, 'Target cover', [['none', 'None'], ['half', 'Half (+2 AC)'], ['threequarters', 'Three-quarters (+5 AC)'], ['full', 'Full cover: cannot target']],
        rollDraft.cover, value => { rollDraft.cover = value; render(); });
      field(box, 'Hostile creature within 5 ft. of attacker', rollDraft.nearbyEnemy, value => { rollDraft.nearbyEnemy = value; render(); }, 'checkbox');
      field(box, 'Bless active on attacker', rollDraft.bless, value => { rollDraft.bless = value; render(); }, 'checkbox');
      field(box, 'Sneak Attack may apply', rollDraft.sneak, value => { rollDraft.sneak = value; render(); }, 'checkbox');
      const target = tokens().find(item => item.id === rollDraft.target);
      const coverBonus = rollDraft.cover === 'half' ? 2 : rollDraft.cover === 'threequarters' ? 5 : 0;
      const warnings = [];
      if (rollDraft.range === 'ranged' && rollDraft.nearbyEnemy && rollDraft.mode !== 'disadvantage') warnings.push('A ranged attack has disadvantage while a hostile creature is within 5 feet of the attacker and can see them.');
      if (rollDraft.cover === 'full') warnings.push('Full cover prevents directly targeting this creature.');
      if (rollDraft.bless) warnings.push('Add 1d4 to the attack roll; Bless does not add to damage.');
      if (rollDraft.sneak) warnings.push('Check the rogue has advantage or an eligible ally beside the target, and no disadvantage. Add Sneak Attack once per turn only after a hit.');
      if (!rollDraft.target) warnings.push('Choose a target to see its AC and confirm range and line of sight.');
      else if (target?.ac !== null && target?.ac !== undefined) warnings.push(`${target.name}: AC ${target.ac}${coverBonus ? ` + ${coverBonus} cover = ${target.ac + coverBonus}` : ''}.`);
      const preview = section(root, 'Before this attack');
      warnings.forEach(note => preview.append(el('p', note, 'combat-roll-warning')));
      if (rollDraft.bless) button(preview, 'Roll Bless d4 privately', () => host.rollCombat('Bless bonus', 1, 4, 0, 'normal'));
    }
    field(box, 'Dice count', rollDraft.count, value => { rollDraft.count = Math.max(1, Math.min(20, Number(value) || 1)); }, 'number');
    select(box, 'Die', [4, 6, 8, 10, 12, 20, 100].map(n => [String(n), `d${n}`]), String(rollDraft.sides), value => { rollDraft.sides = Number(value); });
    field(box, 'Modifier', rollDraft.modifier, value => { rollDraft.modifier = Math.max(-99, Math.min(99, Number(value) || 0)); }, 'number');
    field(box, 'Damage type or effect', rollDraft.type, value => { rollDraft.type = value.slice(0, 50); });
    const rollButton = button(box, 'Roll privately', () => {
      if (rollDraft.mode !== 'normal' && (rollDraft.count !== 1 || rollDraft.sides !== 20)) { host.toast('Advantage applies to one d20 roll. Set 1d20 or choose Normal.'); return; }
      const actor = tokens().find(t => t.id === rollDraft.actor)?.name || 'DM';
      host.rollCombat(`${actor}: ${rollDraft.label || rollDraft.kind}${rollDraft.type ? ` (${rollDraft.type})` : ''}`,
        Number(rollDraft.count), Number(rollDraft.sides), Number(rollDraft.modifier), rollDraft.mode);
    });
    rollButton.disabled = rollDraft.kind === 'attack' && rollDraft.cover === 'full';
    const current = section(root, 'Recent private rolls');
    for (const item of host.rolls().slice(0, 10)) {
      const row = el('div', `${item.label} · ${item.notation} = ${item.total}`, 'combat-row');
      button(row, 'Show on TV', () => host.showRoll(item.id)); current.append(row);
    }
  }
  function renderDamage(root) {
    const box = section(root, 'Review damage or healing', 'Select every affected token. Resistance and immunity are explicit per target; temporary HP is spent first. Nothing changes until Apply is pressed.');
    select(box, 'Change', [['damage', 'Damage'], ['heal', 'Healing']], damage.mode, value => { damage.mode = value; render(); });
    field(box, 'Amount rolled', damage.amount, value => { damage.amount = value; render(); }, 'number');
    field(box, 'Damage type', damage.type, value => { damage.type = value.toLowerCase().trim(); render(); });
    const picks = el('div', '', 'combat-picks');
    for (const t of tokens().filter(t => t.placed && t.scene === host.scene())) {
      const label = el('label', t.name), check = el('input'); check.type = 'checkbox'; check.checked = damage.selected.includes(t.id);
      check.addEventListener('change', () => { damage.selected = check.checked ? [...damage.selected, t.id] : damage.selected.filter(id => id !== t.id); render(); });
      label.prepend(check); picks.append(label);
    }
    box.append(picks);
    const review = section(root, 'Target review');
    for (const id of damage.selected) {
      const t = tokens().find(item => item.id === id); if (!t) continue;
      const defense = combat().tokens[id] ||= data.creatureDefense(t.type, combat().creatures);
      const override = damage.overrides[id] || 'recorded';
      const effective = override === 'recorded' ? defense : {
        resistances: override === 'resist' ? damage.type : '', vulnerabilities: override === 'vulnerable' ? damage.type : '', immunities: override === 'immune' ? damage.type : '' };
      const amount = damage.amounts[id] ?? damage.amount;
      const outcome = data.damagePreview(t, amount, damage.type, damage.mode === 'heal' ? 'heal' : 'damage', effective);
      const row = el('div', '', 'combat-row'); row.append(el('strong', `${t.name}: ${t.hp} HP + ${t.tempHp} temp → ${outcome.hp} HP + ${outcome.tempHp} temp`));
      row.append(el('span', damage.mode === 'heal' ? `Heal ${outcome.adjusted}` : `Apply ${outcome.adjusted} ${damage.type}; ${outcome.tempUsed} absorbed by temporary HP${damage.conditions[id] ? `; add ${damage.conditions[id]}` : ''}`));
      field(row, 'Base amount for this target', amount, value => { damage.amounts[id] = value; render(); }, 'number');
      select(row, 'Per-target ruling', [['recorded', 'Use recorded defenses'], ['normal', 'Normal'], ['resist', 'Resistant'],
        ['vulnerable', 'Vulnerable'], ['immune', 'Immune']], override, value => { damage.overrides[id] = value; render(); });
      if (override === 'recorded') {
        field(row, 'Resistances', defense.resistances, value => { defense.resistances = value; save(`Updated ${t.name} resistance`); });
        field(row, 'Vulnerabilities', defense.vulnerabilities, value => { defense.vulnerabilities = value; save(`Updated ${t.name} vulnerability`); });
        field(row, 'Immunities', defense.immunities, value => { defense.immunities = value; save(`Updated ${t.name} immunity`); });
      }
      review.append(row);
    }
    button(review, 'Apply reviewed changes', () => {
      if (!damage.selected.length) { host.toast('Choose at least one target.'); return; }
      host.applyDamage(damage); damage.selected = []; damage.overrides = {}; damage.amounts = {}; damage.conditions = {};
    }).disabled = !damage.selected.length;
  }
  function renderArea(root) {
    const shapes = host.shapes();
    const box = section(root, 'Area effect workflow', 'Draw a circle, cone, square, or line on the map first. The shape suggests targets; review the list and saves before applying anything.');
    select(box, 'Map shape', [['', 'Choose a shape'], ...shapes.map((mark, i) => [mark.id, `${mark.kind} ${i + 1}`])], area.shape,
      value => { area.shape = value; const mark = shapes.find(m => m.id === value);
        area.selected = mark ? tokens().filter(t => t.placed && t.scene === host.scene() && data.inShape(mark, t)).map(t => t.id) : []; area.rolls = {}; render(); });
    field(box, 'Damage', area.damage, value => { area.damage = value; render(); }, 'number');
    field(box, 'Damage type', area.type, value => { area.type = value.toLowerCase().trim(); render(); });
    field(box, 'Save DC', area.dc, value => { area.dc = value; render(); }, 'number');
    select(box, 'Save', ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(x => [x, x.toUpperCase()]), area.ability,
      value => { area.ability = value; render(); });
    const review = section(root, 'Targets and saves', 'Choose pass or fail for each target. Auto roll uses known sheet or SRD modifiers; unknown bonuses need a manual result.');
    for (const t of tokens().filter(t => t.placed && t.scene === host.scene())) {
      const row = el('div', '', 'combat-row'), label = el('label', t.name), check = el('input');
      check.type = 'checkbox'; check.checked = area.selected.includes(t.id);
      check.addEventListener('change', () => { area.selected = check.checked ? [...area.selected, t.id] : area.selected.filter(id => id !== t.id); render(); });
      label.prepend(check); row.append(label);
      if (check.checked) {
        const bonus = host.saveBonus(t.id, area.ability);
        row.append(el('span', `Save ${bonus === null ? 'bonus unknown' : bonus >= 0 ? `+${bonus}` : bonus} · ${area.rolls[t.id] || 'unresolved'}`));
        button(row, 'Roll save', () => { if (bonus === null) { host.toast('Enter a manual save outcome for this character.'); return; }
          const result = host.rollCombat(`${t.name} ${area.ability.toUpperCase()} save`, 1, 20, bonus, 'normal');
          area.rolls[t.id] = result.total >= Number(area.dc) ? 'pass' : 'fail'; render(); });
        select(row, 'Result', [['', 'Unresolved'], ['pass', 'Pass'], ['fail', 'Fail'], ['none', 'No save']], area.rolls[t.id] || '',
          value => { area.rolls[t.id] = value; render(); });
      }
      review.append(row);
    }
    select(review, 'On a successful save', [['half', 'Half damage'], ['none', 'No damage']], area.success || 'half', value => { area.success = value; });
    field(review, 'Condition to apply to failed saves (optional)', area.condition || '', value => { area.condition = value; });
    button(review, 'Send selected saves to phones', () => {host.requestSaves?.(area);close();});
    button(review, 'Review in damage panel', () => {
      if (!area.selected.length || area.selected.some(id => !area.rolls[id])) { host.toast('Select targets and resolve every save first.'); return; }
      host.prepareArea(area); tab = 'damage'; render();
    });
  }
  function renderPacing(root) {
    const active = current(), p = active ? plan() : null;
    const enemies = tokens().filter(t => t.encounter === encounterId && t.team === 'enemy');
    const xp = enemies.reduce((sum, t) => sum + (data.CREATURES[t.type]?.xp || combat().creatures[t.type]?.xp || 0), 0);
    const party = Object.values(host.party()).filter(s => s.role === 'pc');
    const estimate = data.pace(xp, party.map(s => s.level), p?.terrain || '', enemies.length);
    const box = section(root, 'Encounter pacing', 'A planning aid, never an automatic balance decision.');
    select(box, 'Encounter', encounterOptions(), encounterId, value => { encounterId = value; render(); });
    box.append(el('p', `${active?.name || 'No encounter'} · ${enemies.length} enemies · ${party.length} player characters`));
    box.append(el('strong', `${estimate.label} · ${estimate.note}`));
    for (const [label, key] of [['Terrain and hazards', 'terrain'], ['Morale and surrender', 'morale'], ['Retreat options', 'retreat'], ['Negotiation', 'negotiation']])
      field(box, label, p?.[key] || '', value => { if (!p) return; p[key] = value.slice(0, 800); save(`Updated ${active.name} pacing`); }, 'textarea');
    box.append(el('p', 'This is a planning estimate. A poisoned foe, a collapsing bridge, surprise, or a prisoner can change the actual danger.', 'combat-muted'));
  }
  function renderWrap(root) {
    const active = current(), p = active ? plan() : null;
    const box = section(root, 'After-combat wrap-up', 'Record what changed before moving to the next scene. These notes stay on the DM screen and in the campaign backup.');
    select(box, 'Encounter', encounterOptions(), encounterId, value => { encounterId = value; render(); });
    if (!p) return;
    for (const [label, key] of [['Loot and treasure', 'loot'], ['Who holds the loot?', 'lootCustody'], ['Wagon, supplies, and current location', 'wagon'],
      ['Promises and debts still open', 'promises'], ['Clues discovered and who knows them', 'clues'], ['XP or milestone progress', 'advancement'],
      ['Resources spent', 'resources'], ['Casualties and captives', 'casualties'], ['NPC and world consequences', 'consequences']])
      field(box, label, p.wrap[key], value => { p.wrap[key] = value.slice(0, 1500); save(`Updated ${active.name} wrap-up`); }, 'textarea');
    field(box, 'Outcome and next scene', p.outcome, value => { p.outcome = value.slice(0, 800); save(`Updated ${active.name} outcome`); }, 'textarea');
    button(box, 'Capture current casualties and party resources', () => {
      p.wrap.casualties = tokens().filter(t => t.encounter === encounterId && t.hp === 0).map(t => t.name).join(', ');
      p.wrap.resources = Object.values(host.party()).map(s => `${s.name}: ${s.resources.map(r => `${r.name} ${r.current ?? '?'}/${r.max ?? '?'}`).join(', ')}`).join('\n');
      save(`Captured ${active.name} aftermath`);
    });
  }
  function render() {
    if (!host || $('combat-drawer').hidden) return;
    renderNav(); const root = $('combat-content'); root.replaceChildren();
    if (tab === 'encounters') renderEncounters(root);
    else if (tab === 'creatures') renderCreatures(root);
    else if (tab === 'flow') renderFlow(root);
    else if (tab === 'rolls') renderRolls(root);
    else if (tab === 'damage') renderDamage(root);
    else if (tab === 'area') renderArea(root);
    else if (tab === 'pacing') renderPacing(root);
    else if (tab === 'wrap') renderWrap(root);
  }
  function init(api) {
    host = api;
    $('open-combat').addEventListener('click', () => open());
    $('close-combat').addEventListener('click', close);
    $('combat-scrim').addEventListener('click', close);
    $('combat-tool-select').addEventListener('change', event => { tab = event.target.value; render(); });
    window.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('combat-drawer').hidden) { event.stopImmediatePropagation(); close(); } }, true);
  }
  globalThis.ECHO_COMBAT_UI = { init, open, refresh: render,
    openCreature: id => { creatureId = id; open('creatures'); },
    prepareDamage: (ids, amount, type) => { damage = { mode: 'damage', type, amount: String(amount), selected: ids, overrides: {}, amounts: {}, conditions: {} }; open('damage'); },
    setAreaDamage: draft => { damage = draft; open('damage'); },
    prepareRoll: (actor, label, count, sides, modifier, kind = 'attack', type = '') => {
      rollDraft = { actor, target: '', label, kind, count, sides, modifier, mode: 'normal', type,
        range: /shortbow|longbow|crossbow|ranged|thrown|javelin/i.test(label) ? 'ranged' : 'melee',
        cover: 'none', nearbyEnemy: false, bless: false, sneak: /sneak attack/i.test(label) }; open('rolls');
    } };
})();

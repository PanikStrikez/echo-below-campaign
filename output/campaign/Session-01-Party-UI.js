(() => {
  'use strict';
  const model = globalThis.ECHO_PARTY_DATA;
  if (!model) return;
  const $ = id => document.getElementById(id);
  let host;
  let selectedId = 'pc-trista';
  let tab = 'overview';
  let restPreview = null;
  let restDraft = { type: 'short', spend: '0', healing: '0' };
  let editingAction = null;
  const node = (tag, cls = '', value) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value !== undefined) el.textContent = value;
    return el;
  };
  const button = (parent, label, fn, cls = '') => {
    const el = node('button', cls, label);
    el.type = 'button'; el.addEventListener('click', fn); parent.append(el); return el;
  };
  const sheet = () => host.getParty()[selectedId];
  const signed = value => value === null || value === undefined ? '—' : `${value >= 0 ? '+' : ''}${value}`;
  const text = value => value === null || value === undefined ? '' : String(value);
  const safeId = () => `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const save = label => { host.commitParty(label); render(); };

  function field(parent, labelText, value, change, type = 'text', options = {}) {
    const label = node('label', 'party-field');
    label.append(node('span', '', labelText));
    const input = node(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
    if (type !== 'textarea' && type !== 'select') input.type = type;
    if (type === 'number') { input.min = options.min ?? '-99'; input.max = options.max ?? '999'; }
    if (type === 'select') for (const [key, caption] of options.choices || []) {
      const option = node('option', '', caption); option.value = key; input.append(option);
    }
    if (type === 'checkbox') input.checked = value === true;
    else input.value = text(value);
    if (options.placeholder) input.placeholder = options.placeholder;
    input.addEventListener('change', () => change(type === 'checkbox' ? input.checked : input.value));
    label.append(input); parent.append(label); return input;
  }
  function section(parent, title, hint = '') {
    const box = node('section', 'party-section');
    box.append(node('h3', '', title));
    if (hint) box.append(node('p', 'party-hint', hint));
    parent.append(box); return box;
  }
  const numeric = (value, min = 0, max = 999) => value === '' ? null : Math.max(min, Math.min(max, Number(value) || 0));
  function selectCharacter(id) {
    if (!host.getParty()[id]) return;
    selectedId = id; editingAction = null; restPreview = null;
    restDraft = { type: 'short', spend: '0', healing: '0' }; render();
  }
  function open(id) {
    if (id && host.getParty()[id] && id !== selectedId) {
      selectedId = id; restDraft = { type: 'short', spend: '0', healing: '0' };
    }
    $('party-scrim').hidden = false;
    $('party-drawer').hidden = false;
    render();
  }
  function close() {
    $('party-scrim').hidden = true;
    $('party-drawer').hidden = true;
    document.querySelector('.header-menu summary')?.focus();
  }
  function renderNavigation() {
    const select = $('party-select'); select.replaceChildren();
    for (const item of Object.values(host.getParty())) {
      const option = node('option', '', item.name); option.value = item.id; select.append(option);
    }
    if (!host.getParty()[selectedId]) selectedId = Object.keys(host.getParty())[0];
    select.value = selectedId;
    for (const item of $('party-tabs').querySelectorAll('button')) item.classList.toggle('active', item.dataset.tab === tab);
    $('party-source').textContent = sheet()?.source ? `${sheet().source} · ${sheet().sourceStatus}` : '';
  }

  function renderOverview(root) {
    const meta = host.getMeta();
    const status = section(root, 'Party at a glance', 'Choose a character to open a full sheet. Unknown values stay blank until the live sheet is checked.');
    const grid = node('div', 'party-overview-grid');
    for (const item of Object.values(host.getParty())) {
      const card = node('div', 'party-overview-card');
      card.append(node('strong', '', item.name));
      card.append(node('span', '', `${item.className || 'Class unknown'} · level ${item.level ?? '?'} · AC ${item.ac ?? '?'}`));
      card.append(node('span', '', `HP ${item.hp ?? '?'}/${item.maxHp ?? '?'}${item.tempHp ? ` +${item.tempHp} temporary` : ''}`));
      card.append(node('span', '', `Passive Perception ${model.passive(item, 'Perception') ?? '?'} · ${item.senses || 'Senses unconfirmed'}`));
      const statuses = [item.concentration ? `Concentrating: ${item.concentration}` : '',
        item.exhaustion ? `Exhaustion ${item.exhaustion}` : '', item.conditions.join(', ')].filter(Boolean).join(' · ');
      if (statuses) card.append(node('small', '', statuses));
      button(card, 'Open sheet', () => { selectCharacter(item.id); tab = 'sheet'; render(); });
      grid.append(card);
    }
    status.append(grid);
    const travel = section(root, 'Marching and travel');
    field(travel, 'Marching order', meta.marchingOrder, value => { meta.marchingOrder = value.slice(0, 300); save('Updated marching order'); });
    field(travel, 'Light sources', meta.lightSources, value => { meta.lightSources = value.slice(0, 500); save('Updated light sources'); });
    field(travel, 'Travel pace', meta.travelPace, value => { meta.travelPace = value; save('Updated travel pace'); }, 'select',
      { choices: [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']] });
    field(travel, 'Private party notes', meta.notes, value => { meta.notes = value.slice(0, 2000); save('Updated private party notes'); }, 'textarea');
  }

  function renderSheet(root) {
    const s = sheet();
    const identity = section(root, 'Identity and defense', 'Values from a guide are editable. Use the live sheet when it differs.');
    const grid = node('div', 'party-field-grid'); identity.append(grid);
    for (const [label, key] of [['Name', 'name'], ['Player', 'player'], ['Class', 'className'],
      ['Ancestry', 'ancestry'], ['Background', 'background'], ['Rules', 'rules'], ['Source', 'source'],
      ['Source status', 'sourceStatus']])
      field(grid, label, s[key], value => { s[key] = value.slice(0, 300); save(`Updated ${s.name} ${key}`); });
    for (const [label, key] of [['Level', 'level'], ['Proficiency', 'proficiency'], ['Speed (ft)', 'speed'],
      ['AC', 'ac'], ['Current HP', 'hp'], ['Maximum HP', 'maxHp'], ['Temporary HP', 'tempHp']])
      field(grid, label, s[key], value => { s[key] = numeric(value); save(`Updated ${s.name} ${label}`); }, 'number');
    field(grid, 'Hit Die', s.hitDice.die, value => { s.hitDice.die = numeric(value, 4, 12); save('Updated Hit Die'); }, 'select',
      { choices: [[6, 'd6'], [8, 'd8'], [10, 'd10'], [12, 'd12']] });
    field(grid, 'Hit Dice remaining', s.hitDice.current, value => { s.hitDice.current = numeric(value); save('Updated Hit Dice'); }, 'number');
    field(grid, 'Hit Dice maximum', s.hitDice.max, value => { s.hitDice.max = numeric(value); save('Updated Hit Dice maximum'); }, 'number');
    field(grid, 'Senses', s.senses, value => { s.senses = value.slice(0, 300); save('Updated senses'); });
    field(grid, 'Languages', s.languages, value => { s.languages = value.slice(0, 300); save('Updated languages'); });
    const abilityBox = section(root, 'Abilities, saves, and skills', 'Select trained or expertise. A manual bonus overrides the calculated value.');
    const abilityGrid = node('div', 'party-ability-grid'); abilityBox.append(abilityGrid);
    for (const key of model.ABILITIES) {
      const cell = node('div', 'party-ability');
      field(cell, key.toUpperCase(), s.abilities[key], value => { s.abilities[key] = numeric(value, 1, 30); save(`Updated ${key.toUpperCase()}`); }, 'number');
      cell.append(node('small', '', `Modifier ${signed(model.abilityMod(s.abilities[key]))}`)); abilityGrid.append(cell);
    }
    const editBonus = (container, name, kind) => {
      const row = node('div', 'party-bonus-row');
      row.append(node('strong', '', kind === 'saves' ? name.toUpperCase() : name),
        node('span', '', signed(model.rankValue(s, name, kind))));
      const rank = node('select');
      for (const [value, label] of [['0', 'Untrained'], ['1', 'Proficient'], ['2', 'Expertise']]) {
        const option = node('option', '', label); option.value = value; rank.append(option);
      }
      rank.value = String(s[kind][name].rank || 0);
      rank.addEventListener('change', () => { s[kind][name].rank = Number(rank.value); s[kind][name].override = null; save(`Updated ${name} training`); });
      row.append(rank);
      const override = node('input'); override.type = 'number'; override.placeholder = 'Override';
      override.value = text(s[kind][name].override);
      override.addEventListener('change', () => { s[kind][name].override = numeric(override.value, -99, 99); save(`Updated ${name} bonus`); });
      row.append(override); container.append(row);
    };
    const saves = section(root, 'Saving throws');
    for (const key of model.ABILITIES) editBonus(saves, key, 'saves');
    const skills = section(root, 'Skills');
    for (const key of Object.keys(model.SKILLS)) editBonus(skills, key, 'skills');
    const passives = section(root, 'Passive scores');
    for (const key of ['Perception', 'Insight', 'Investigation']) {
      passives.append(node('span', 'party-passive', `${key}: ${model.passive(s, key) ?? '?'}`));
      field(passives, `${key} override`, s.passiveOverride[key.toLowerCase()], value => {
        s.passiveOverride[key.toLowerCase()] = numeric(value, -99, 99); save(`Updated passive ${key}`);
      }, 'number');
    }
    const notes = section(root, 'Notes and conditions');
    field(notes, 'Private DM notes', s.notes, value => { s.notes = value.slice(0, 3000); save('Updated private notes'); }, 'textarea');
    field(notes, 'Player-safe note', s.publicNotes, value => { s.publicNotes = value.slice(0, 3000); save('Updated player note'); }, 'textarea');
    const sharing = section(root, 'TV character card', 'Only details you choose here can appear when you press Show this character on TV.');
    for (const [key, label] of [['showHp', 'Show HP and AC'], ['showActions', 'Show actions'],
      ['showResources', 'Show resource counts'], ['showStatus', 'Show conditions and concentration']])
      field(sharing, label, s.publicOptions[key], value => { s.publicOptions[key] = value; save(`Updated TV card for ${s.name}`); }, 'checkbox');
    field(notes, 'Concentrating on', s.concentration, value => { s.concentration = value.slice(0, 300); save('Updated concentration'); });
    field(notes, 'Conditions (comma separated)', s.conditions.join(', '), value => {
      s.conditions = [...new Set(value.split(',').map(x => x.trim()).filter(Boolean))].slice(0, 30); save('Updated conditions');
    });
    field(notes, 'Exhaustion (0–6)', s.exhaustion, value => { s.exhaustion = numeric(value, 0, 6) || 0; save('Updated exhaustion'); }, 'number');
    field(notes, 'Inspiration', s.inspiration, value => { s.inspiration = value; save('Updated Inspiration'); }, 'checkbox');
    const death = section(root, 'Death saves', 'At 0 HP, record successes and failures here. Healing clears these manually or on a reviewed long rest.');
    field(death, 'Successes', s.death.successes, value => { s.death.successes = numeric(value, 0, 3) || 0; save('Updated death saves'); }, 'number');
    field(death, 'Failures', s.death.failures, value => { s.death.failures = numeric(value, 0, 3) || 0; save('Updated death saves'); }, 'number');
    field(death, 'Stable', s.death.stable, value => { s.death.stable = value; save('Updated stability'); }, 'checkbox');
    const effects = section(root, 'Ongoing effects');
    for (const effect of s.effects) {
      const row = node('div', 'party-list-row');
      row.append(node('strong', '', `${effect.name} · ${effect.remaining || 'duration open'}`),
        node('span', '', `${effect.timing || ''} ${effect.note || ''}`));
      button(row, 'Edit', () => {
        const name = prompt('Effect name:', effect.name); if (name === null) return;
        const remaining = prompt('Remaining duration:', effect.remaining); if (remaining === null) return;
        const timing = prompt('When to check or save:', effect.timing); if (timing === null) return;
        const note = prompt('Effect note:', effect.note); if (note === null) return;
        Object.assign(effect, { name: name.slice(0, 100), remaining: remaining.slice(0, 80),
          timing: timing.slice(0, 80), note: note.slice(0, 500) }); save('Updated ongoing effect');
      });
      button(row, 'End', () => { s.effects = s.effects.filter(x => x !== effect); save(`Ended ${effect.name}`); }); effects.append(row);
    }
    button(effects, 'Add effect', () => {
      const name = prompt('Effect name:'); if (!name?.trim()) return;
      s.effects.push({ name: name.trim().slice(0, 100), remaining: '', timing: '', note: '' }); save(`Added ${name}`);
    });
  }

  const parseDice = value => {
    const match = /^(\d{1,2})d(4|6|8|10|12|20|100)([+-]\d{1,3})?$/.exec(String(value || '').replace(/\s/g, ''));
    return match ? { count: Number(match[1]), sides: Number(match[2]), modifier: Number(match[3] || 0) } : null;
  };
  function renderActions(root) {
    const s = sheet();
    const panel = section(root, 'Actions available now', 'Choose Review action to check targets, costs, rolls and effects together. Quick rolls do not apply effects or spend resources.');
    const canUse = item => {
      const resource = s.resources.find(x => x.id === item.resourceId);
      return item.prepared !== false && (!resource || item.cost === 0 ||
        (resource.current !== null && resource.current >= item.cost));
    };
    const view=model.ownerView(s);
    const available = [...view.attacks, ...view.actions].filter(canUse);
    if (!available.length) panel.append(node('p', 'party-hint', 'No recorded actions are ready. Check preparation and resources, or add actions from the live sheet.'));
    for (const item of available) {
      const row = node('div', 'party-action-card');
      row.append(node('strong', '', `${item.name} · ${item.type || 'Action'}`));
      const resource = s.resources.find(x => x.id === item.resourceId);
      row.append(node('small', 'action-math', [item.attackBonus !== null ? `Attack ${signed(item.attackBonus)}` : '',
        item.damageDice ? `${item.damageDice} ${item.damageType}` : '', item.saveDC !== null ? `${item.saveAbility} save DC ${item.saveDC}` : '',
        resource ? `${resource.name} ${resource.current ?? '?'}/${resource.max ?? '?'}` : ''].filter(Boolean).join(' · ')));
      if (item.effect) row.append(node('p', '', item.effect));
      if(item.support){const badge=node('span','party-support-status echo-status action-support',item.support.label);badge.dataset.state=item.support.status;row.append(badge);row.append(node('small','',item.support.reason));const src=item.support.source;row.append(node('small','',`${src.book}${src.printedPage?' p. '+src.printedPage:''}`));}
      const controls = node('div', 'button-row');
      if(host.stageAction)button(controls,'Review action',()=>host.stageAction(s.id,view.attacks.includes(item)?'attack':'action',view.attacks.includes(item)?view.attacks.indexOf(item):view.actions.indexOf(item)),'primary');
      if (s.id === 'pc-donavan' && item.name === 'Mind Sliver') button(controls, 'Book', () => host.openBook('tasha', 110));
      if (s.id === 'pc-donavan' && item.name === 'Catapult') button(controls, 'Book', () => host.openBook('xan', 151));
      if (item.attackBonus !== null) button(controls, 'Roll attack', () => host.roll(`${s.name}: ${item.name} attack`, 1, 20, item.attackBonus));
      const dice = parseDice(item.damageDice);
      if (dice) button(controls, item.damageType === 'healing' ? 'Roll healing' : item.damageType === 'bonus' ? 'Roll bonus' : 'Roll damage',
        () => host.roll(`${s.name}: ${item.name} ${item.damageType || 'damage'}`, dice.count, dice.sides, dice.modifier, item.damageType));
      if (resource && item.cost > 0 && !host.stageAction) button(controls, `Use ${item.cost}`, () => {
        try { host.spendResource(s.id, resource.id, item.cost, item.name); render(); }
        catch (error) { host.toast(error.message); }
      }).disabled = resource.current === null || resource.current < item.cost;
      if(!item.derived)button(controls, 'Edit', () => { editingAction = item.id; render(); });
      row.append(controls); panel.append(row);
    }
    const inactive = [...s.attacks, ...s.actions].filter(item => !canUse(item));
    if (inactive.length) {
      const pending = section(root, 'Unavailable until prepared or replenished');
      for (const item of inactive) {
        const resource = s.resources.find(x => x.id === item.resourceId);
        const row = node('div', 'party-list-row'); row.append(node('span', '', `${item.name}${item.prepared === false ? ' · not prepared' : ''}${resource && item.cost > 0 && (resource.current === null || resource.current < item.cost) ? ` · ${resource.name} depleted` : ''}`));
        button(row, 'Edit / prepare', () => { editingAction = item.id; render(); }); pending.append(row);
      }
    }
    button(panel, 'Add action or spell', () => {
      const item = { id: safeId(), name: 'New action', type: 'Action', attackBonus: null,
        damageDice: '', damageType: '', saveAbility: '', saveDC: null, effect: '', resourceId: '', cost: 1, prepared: true };
      s.actions.push(item); editingAction = item.id; save('Added action');
    });
    const item = [...s.attacks, ...s.actions].find(x => x.id === editingAction);
    if (!item) return;
    const editor = section(root, `Edit ${item.name}`);
    const grid = node('div', 'party-field-grid'); editor.append(grid);
    for (const [label, key] of [['Name', 'name'], ['Action type', 'type'], ['Damage dice', 'damageDice'],
      ['Damage type', 'damageType'], ['Save ability', 'saveAbility'], ['Effect and limits', 'effect']])
      field(grid, label, item[key], value => { item[key] = value.slice(0, key === 'effect' ? 700 : 100); save(`Updated ${item.name}`); });
    field(grid, 'Attack bonus', item.attackBonus, value => { item.attackBonus = numeric(value, -99, 99); save('Updated attack'); }, 'number');
    field(grid, 'Save DC', item.saveDC, value => { item.saveDC = numeric(value, 0, 99); save('Updated save DC'); }, 'number');
    field(grid, 'Uses this resource ID', item.resourceId, value => { item.resourceId = value.slice(0, 80); save('Updated resource link'); }, 'select',
      { choices: [['', 'No resource'], ...s.resources.map(r => [r.id, r.name])] });
    field(grid, 'Cost per use', item.cost, value => { item.cost = numeric(value, 0, 99) ?? 1; save('Updated action cost'); }, 'number');
    field(grid, 'Ready / prepared now', item.prepared !== false, value => { item.prepared = value; save('Updated action availability'); }, 'checkbox');
    const buttons = node('div', 'button-row');
    button(buttons, 'Done', () => { editingAction = null; render(); });
    button(buttons, 'Remove action', () => {
      s.attacks = s.attacks.filter(x => x !== item); s.actions = s.actions.filter(x => x !== item);
      editingAction = null; save(`Removed ${item.name}`);
    }); editor.append(buttons);
  }

  function renderResources(root) {
    const s = sheet();
    const resources = section(root, 'Pools, ammunition, and limited uses', 'Short and long rest recovery is set per resource. A short-rest value of -1 means refill.');
    for (const item of s.resources) {
      const row = node('div', 'party-list-row');
      row.append(node('strong', '', `${item.name} · ${item.current ?? '?'}/${item.max ?? '?'}`));
      const controls = node('div', 'button-row');
      field(controls, 'Long rest refill', item.restoreLong, value => { item.restoreLong = value; save(`Updated ${item.name} recovery`); }, 'checkbox');
      button(controls, '−1', () => { try { host.spendResource(s.id, item.id, 1, item.name); render(); } catch (error) { host.toast(error.message); } }).disabled = item.current === null || item.current < 1;
      button(controls, '+1', () => { item.current = Math.min(item.max ?? 999, (item.current || 0) + 1); save(`Restored ${item.name}`); });
      button(controls, 'Edit', () => {
        const name = prompt('Resource name:', item.name); if (name === null) return;
        const max = prompt('Maximum:', text(item.max)); if (max === null) return;
        const current = prompt('Remaining:', text(item.current)); if (current === null) return;
        const short = prompt('Regained on short rest (0, amount, or -1 for full):', text(item.restoreShort)); if (short === null) return;
        item.name = name.slice(0, 100); item.max = numeric(max); item.current = numeric(current);
        item.restoreShort = numeric(short, -1, 999) || 0; save(`Updated ${item.name}`);
      });
      button(controls, 'Remove', () => { s.resources = s.resources.filter(x => x !== item); save(`Removed ${item.name}`); });
      row.append(controls); resources.append(row);
    }
    button(resources, 'Add resource', () => {
      const name = prompt('Resource name:'); if (!name?.trim()) return;
      s.resources.push({ id: safeId(), name: name.trim().slice(0, 100), max: 1, current: 1,
        restoreShort: 0, restoreLong: true, unit: '' }); save(`Added ${name}`);
    });
    const spells = section(root, 'Spells and preparation', 'Listed spells are not automatically prepared unless checked.');
    for (const spell of s.spells) {
      const row = node('div', 'party-list-row');
      row.append(node('strong', '', `${spell.name} · ${spell.level === null ? 'level unconfirmed' : spell.level === 0 ? 'cantrip' : `level ${spell.level}`}`));
      const controls = node('div', 'button-row');
      if (s.id === 'pc-donavan' && spell.name === 'Mind Sliver') button(controls, 'Book', () => host.openBook('tasha', 110));
      if (s.id === 'pc-donavan' && spell.name === 'Catapult') button(controls, 'Book', () => host.openBook('xan', 151));
      field(controls, 'Prepared', spell.prepared === true, value => {
        spell.prepared = value;
        for (const action of s.actions.filter(item => item.name === spell.name)) action.prepared = value;
        save(`Updated ${spell.name} preparation`);
      }, 'checkbox');
      button(controls, 'Make action card', () => {
        const existing = s.actions.find(item => item.name === spell.name);
        if (existing) { tab = 'actions'; editingAction = existing.id; render(); return; }
        const card = { id: safeId(), name: spell.name, type: spell.level === 0 ? 'Cantrip' : 'Spell',
          attackBonus: null, damageDice: '', damageType: '', saveAbility: '', saveDC: null,
          effect: spell.notes || 'Check spell text and enter its effect.', resourceId: '', cost: 1,
          prepared: spell.prepared === true };
        s.actions.push(card); tab = 'actions'; editingAction = card.id; save(`Added ${spell.name} action card`);
      });
      button(controls, 'Edit', () => {
        const name = prompt('Spell name:', spell.name); if (name === null) return;
        const level = prompt('Spell level (blank if unconfirmed):', text(spell.level)); if (level === null) return;
        const notes = prompt('Spell note:', spell.notes); if (notes === null) return;
        const previousName = spell.name;
        spell.name = name.slice(0, 100); spell.level = numeric(level, 0, 9); spell.notes = notes.slice(0, 500);
        for (const action of s.actions.filter(item => item.name === previousName)) action.name = spell.name;
        save(`Updated ${spell.name}`);
      });
      button(controls, 'Remove', () => { s.spells = s.spells.filter(x => x !== spell); save(`Removed ${spell.name}`); });
      row.append(controls); spells.append(row);
    }
    button(spells, 'Add spell', () => { const name = prompt('Spell name:'); if (!name?.trim()) return;
      s.spells.push({ name: name.trim().slice(0, 100), level: null, prepared: false, notes: '' }); save(`Added ${name}`); });
    const gear = section(root, 'Equipment and attunement');
    const attuned = s.equipment.filter(item => item.attuned).length;
    gear.append(node('p', 'party-hint', `${attuned}/3 attunement slots used`));
    for (const item of s.equipment) {
      const row = node('div', 'party-list-row'); row.append(node('strong', '', `${item.quantity} × ${item.name}`));
      row.append(node('small', '', `${item.category}${item.notes ? ` · ${item.notes}` : ''}`));
      const controls = node('div', 'button-row');
      field(controls, 'Attuned', item.attuned, value => {
        if (value && s.equipment.filter(x => x.attuned).length >= 3) { host.toast('Three attunement slots are already in use.'); render(); return; }
        item.attuned = value; save(`Updated ${item.name} attunement`);
      }, 'checkbox');
      button(controls, 'Edit', () => {
        const name = prompt('Item name:', item.name); if (name === null) return;
        const quantity = prompt('Quantity:', text(item.quantity)); if (quantity === null) return;
        const category = prompt('Category:', item.category); if (category === null) return;
        const notes = prompt('Item note:', item.notes); if (notes === null) return;
        Object.assign(item, { name: name.slice(0, 100), quantity: numeric(quantity) || 0,
          category: category.slice(0, 60), notes: notes.slice(0, 300) }); save(`Updated ${item.name}`);
      });
      button(controls, 'Remove', () => { s.equipment = s.equipment.filter(x => x !== item); save(`Removed ${item.name}`); });
      row.append(controls); gear.append(row);
    }
    button(gear, 'Add item', () => { const name = prompt('Item name:'); if (!name?.trim()) return;
      s.equipment.push({ name: name.trim().slice(0, 100), quantity: 1, category: 'Gear', notes: '', attuned: false }); save(`Added ${name}`); });
    const money = section(root, 'Money');
    for (const coin of ['cp', 'sp', 'ep', 'gp', 'pp']) field(money, coin.toUpperCase(), s.money[coin],
      value => { s.money[coin] = numeric(value) || 0; save(`Updated ${coin}`); }, 'number');
    const features = section(root, 'Class and character features');
    for (const item of s.features) {
      const row = node('div', 'party-list-row'); row.append(node('strong', '', item.name), node('span', '', item.text));
      row.append(node('small', '', item.source));
      button(row, 'Edit', () => {
        const name = prompt('Feature name:', item.name); if (name === null) return;
        const description = prompt('Feature text:', item.text); if (description === null) return;
        const source = prompt('Feature source:', item.source); if (source === null) return;
        Object.assign(item, { name: name.slice(0, 100), text: description.slice(0, 900), source: source.slice(0, 150) }); save(`Updated ${item.name}`);
      });
      button(row, 'Remove', () => { s.features = s.features.filter(x => x !== item); save(`Removed ${item.name}`); }); features.append(row);
    }
    button(features, 'Add feature', () => { const name = prompt('Feature name:'); if (!name?.trim()) return;
      s.features.push({ name: name.trim().slice(0, 100), text: '', source: '' }); save(`Added ${name}`); });
    const choices = host.getCharacterOptions?.(s.id) || [];
    if (choices.length) {
      const optional = section(root, 'Optional choices', 'Planned choices do not change this sheet. Apply an active choice after reviewing its book entry with the player.');
      for (const choice of choices) {
        const row = node('div', 'party-list-row');
        row.append(node('strong', '', `${choice.name} · ${choice.status}`), node('small', '', choice.source));
        button(row, 'View source', () => host.openBook(choice.book, choice.pdfPage)); optional.append(row);
      }
    }
  }

  function renderRest(root) {
    const s = sheet();
    const box = section(root, 'Rest and recovery', `Review every change before applying it. ${s.rules.includes('2024') ? 'This character regains all spent Hit Dice on a long rest.' : '2014 rules regain up to half of maximum Hit Dice on a long rest.'} Conditions, concentration, and ongoing effects stay until you clear them.`);
    const kind = node('select');
    for (const [value, label] of [['short', 'Short rest'], ['long', 'Long rest']]) {
      const option = node('option', '', label); option.value = value; kind.append(option);
    }
    kind.value = restDraft.type;
    box.append(kind);
    const form = node('div', 'party-rest-form'); box.append(form);
    const draw = () => {
      restPreview = null; form.replaceChildren();
      if (kind.value === 'short') {
        const spend = field(form, 'Hit Dice to spend', restDraft.spend, value => { restDraft.spend = value; }, 'number',
          { min: 0, max: s.hitDice.current ?? 0 });
        const healing = field(form, 'Healing total', restDraft.healing, value => { restDraft.healing = value; }, 'number');
        const overrideAtZero = field(form, 'DM override: rest at 0 or unknown HP', false, () => {}, 'checkbox');
        button(form, 'Roll selected Hit Dice', () => {
          const count = Math.min(Number(spend.value) || 0, s.hitDice.current || 0);
          const con = model.abilityMod(s.abilities.con);
          if (!count || con === null) { host.toast('Enter Hit Dice to spend and confirm Constitution first.'); return; }
          restDraft.spend = String(count);
          restDraft.healing = String(host.rollHitDice(s.name, count, s.hitDice.die, con));
          render();
        });
        button(form, 'Preview short rest', () => showPreview('short', { hitDiceSpent: spend.value, healing: healing.value,
          overrideAtZero: overrideAtZero.checked }));
      } else {
        const restoreHp = field(form, 'Restore all HP', true, () => {}, 'checkbox');
        const restoreHitDice = field(form, s.rules.includes('2024') ? 'Regain all spent Hit Dice' : 'Regain up to half of maximum Hit Dice', true, () => {}, 'checkbox');
        const restoreResources = field(form, 'Restore long-rest resources', true, () => {}, 'checkbox');
        const reduceExhaustion = field(form, 'Reduce exhaustion by one (food and drink available)', false, () => {}, 'checkbox');
        const clearDeath = field(form, 'Clear death saves if conscious', true, () => {}, 'checkbox');
        const overrideAtZero = field(form, 'DM override: rest at 0 or unknown HP', false, () => {}, 'checkbox');
        button(form, 'Preview long rest', () => showPreview('long', {
          restoreHp: restoreHp.checked, restoreHitDice: restoreHitDice.checked,
          restoreResources: restoreResources.checked, reduceExhaustion: reduceExhaustion.checked,
          clearDeath: clearDeath.checked, overrideAtZero: overrideAtZero.checked
        }));
      }
    };
    const showPreview = (type, options) => {
      restPreview = model.previewRest(s, type, options);
      const old = $('party-rest-preview'); if (old) old.remove();
      const panel = node('div', 'party-rest-preview'); panel.id = 'party-rest-preview';
      panel.append(node('h4', '', 'Review changes'));
      if (restPreview.blocked) panel.append(node('p', '', restPreview.blocked));
      if (!restPreview.changes.length) panel.append(node('p', '', 'No tracked values would change.'));
      for (const change of restPreview.changes) panel.append(node('p', '', change));
      button(panel, 'Apply this rest', () => {
        const result = restPreview; if (!result) return;
        host.replaceSheet(selectedId, result.sheet); restPreview = null;
        host.commitParty(`${s.name}: ${type} rest`); render();
      }, 'primary').disabled = !!restPreview.blocked;
      button(panel, 'Cancel', () => { restPreview = null; panel.remove(); });
      box.append(panel);
    };
    kind.addEventListener('change', () => { restDraft = { type: kind.value, spend: '0', healing: '0' }; draw(); });
    draw();
  }

  function renderHistory(root) {
    const s = sheet();
    const box = section(root, 'Level-up history', 'Recording a level saves the entire prior sheet so earlier values remain available.');
    button(box, 'Guided level-up', () => { tab = 'advance'; render(); });
    for (const [index, entry] of s.levelHistory.entries()) {
      const row = node('div', 'party-list-row'); row.append(node('strong', '', `Level ${entry.level ?? '?'} · ${entry.date}`),
        node('span', '', entry.summary));
      if (entry.snapshot) {
        const detail = node('details'); detail.append(node('summary', '', 'View prior values'));
        detail.append(node('pre', '', `Level ${entry.snapshot.level ?? '?'} · AC ${entry.snapshot.ac ?? '?'} · HP ${entry.snapshot.hp ?? '?'}/${entry.snapshot.maxHp ?? '?'}\n` +
          `Abilities ${model.ABILITIES.map(key => `${key.toUpperCase()} ${entry.snapshot.abilities?.[key] ?? '?'}`).join(' · ')}\n` +
          `Features ${(entry.snapshot.features || []).map(x => x.name).join(', ')}\n` +
          `Resources ${(entry.snapshot.resources || []).map(x => `${x.name} ${x.current}/${x.max}`).join(', ')}`));
        row.append(detail);
        button(row, 'Restore prior sheet', () => {
          if (!confirm(`Restore ${s.name}'s sheet from before this level up? Current values will be replaced.`)) return;
          const restored = model.normalizeSheet(entry.snapshot, entry.snapshot);
          restored.levelHistory = s.levelHistory.slice(0, index);
          host.replaceSheet(selectedId, restored); save(`Restored ${s.name}'s earlier sheet`);
        });
      }
      box.append(row);
    }
    if (!s.levelHistory.length) box.append(node('p', 'party-hint', 'No level changes recorded yet.'));
  }

  function render() {
    if ($('party-drawer').hidden || !host) return;
    renderNavigation();
    const root = $('party-content'); root.replaceChildren();
    if (tab === 'overview') renderOverview(root);
    else if (tab === 'sheet') renderSheet(root);
    else if (tab === 'actions') renderActions(root);
    else if (tab === 'resources') renderResources(root);
    else if (['advance','import','favorites','casting','rest'].includes(tab)) globalThis.ECHO_CHARACTER_TOOLS_UI.render(tab, root, {sheet:sheet(),host,render,close});
    else if (tab === 'history') renderHistory(root);
  }

  function printSheet() {
    const page = window.open('', '_blank');
    if (!page) { host.toast('Allow a new window to print the character handout.'); return; }
    page.document.open(); page.document.write(globalThis.ECHO_CHARACTER_SUMMARY.html(model.ownerView(sheet()))); page.document.close();
    page.focus(); page.print();
  }

  function init(options) {
    host = options;
    $('open-party').addEventListener('click', () => open());
    $('close-party').addEventListener('click', close);
    $('party-scrim').addEventListener('click', close);
    $('party-select').addEventListener('change', event => selectCharacter(event.target.value));
    $('party-tabs').addEventListener('click', event => {
      const next = event.target.closest('button[data-tab]')?.dataset.tab;
      if (next) { tab = next; editingAction = null; render(); }
    });
    $('party-show-tv').addEventListener('click', () => host.showOnTV(selectedId));
    $('party-hide-tv').addEventListener('click', host.hideTV);
    $('party-export').addEventListener('click', () => host.downloadJson(`${sheet().name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sheet.json`,
      { format: 'echo-below-character-v1', sheet: sheet() }));
    $('party-import-button').addEventListener('click', () => $('party-import-file').click());
    $('party-import-file').addEventListener('change', async event => {
      const file = event.target.files?.[0]; if (!file) return;
      const targetId=selectedId;
      try {
        const input = JSON.parse(await file.text());
        if (input?.format !== 'echo-below-character-v1' || !input.sheet || typeof input.sheet !== 'object') throw new Error();
        const target=host.getParty()[targetId];
        if(!target) throw new Error();
        globalThis.ECHO_CHARACTER_TOOLS_UI.stageImport(target,input.sheet);
        selectedId=targetId; tab='import'; render();
      } catch { host.toast('Choose a character sheet exported by this table.'); }
      finally { event.target.value = ''; }
    });
    $('party-print').addEventListener('click', printSheet);
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('party-drawer').hidden) { event.stopImmediatePropagation(); close(); }
    }, true);
  }
  globalThis.ECHO_PARTY_UI = { init, open, close, openAdvance:id=>{tab='advance';open(id);}, openRest: () => { tab = 'rest'; open(); }, refresh: render };
})();

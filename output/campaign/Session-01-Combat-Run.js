(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, value = '', className = '') => { const node = document.createElement(tag); node.textContent = value; node.className = className; return node; };
  const button = (parent, label, click, className = '') => { const node = el('button', label, className); node.type = 'button'; node.addEventListener('click', click); parent.append(node); return node; };
  const damageDice = value => {
    const match = /^(\d{1,2})d(4|6|8|10|12|20)([+-]\d{1,3})?$/.exec(String(value || '').replace(/\s+/g, ''));
    return match ? { count: Number(match[1]), sides: Number(match[2]), modifier: Number(match[3] || 0) } : null;
  };
  const bounded = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const attackOutcome = (roll, ac, critThreshold = 20) => roll.natural === 1 ? 'Miss (natural 1)' : roll.natural >= critThreshold ? `Critical hit (natural ${roll.natural})` :
    ac === null ? 'AC unknown · DM decision' : roll.total >= ac ? 'Hit' : 'Miss';
  function normalize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const queue = raw.queue && typeof raw.queue === 'object' ? raw.queue : {};
    const statuses = raw.encounterStatus && typeof raw.encounterStatus === 'object' ? raw.encounterStatus : {};
    const resources = raw.resources && typeof raw.resources === 'object' ? raw.resources : {};
    return { initiativePrompt: { open: raw.initiativePrompt?.open === true, scene: String(raw.initiativePrompt?.scene || '').slice(0, 80) },
      queue: { key: String(queue.key || '').slice(0, 120), done: (Array.isArray(queue.done) ? queue.done : []).slice(0, 8).map(Boolean),
        movementUsed: bounded(queue.movementUsed, 0, 999), actionUsed: queue.actionUsed === true, bonusUsed: queue.bonusUsed === true },
      encounterStatus: Object.fromEntries(Object.entries(statuses).slice(0, 100).filter(([key, value]) =>
        /^[a-zA-Z0-9_-]{1,80}$/.test(key) && ['fighting','parley','retreat','surrender'].includes(value))),
      resources: Object.fromEntries(Object.entries(resources).slice(0, 250).filter(([key, value]) =>
        /^[a-zA-Z0-9_-]{1,80}$/.test(key) && Array.isArray(value)).map(([key, value]) => [key,
        value.slice(0, 12).filter(item => item && typeof item.name === 'string').map(item => ({
          name: item.name.slice(0, 60), current: bounded(item.current, 0, 999), max: bounded(item.max, 0, 999)
        }))])) };
  }
  let host = null;
  let draft = { actor: '', attack: 0, target: '', mode: 'normal', cover: 'none', acOverride: '', roll: null, damage: null, damageManual: '', confirmed: false, manualCrit: false };
  const state = () => host.run();
  const placed = () => host.tokens().filter(t => t.placed && t.scene === host.scene() && (t.team !== 'enemy' || t.hp > 0));
  const current = () => host.currentActor();
  const creature = actor => globalThis.ECHO_COMBAT_DATA?.CREATURES?.[actor.type] || host.combat()?.creatures?.[actor.type];
  const sheet = actor => host.party()?.[actor.id];
  function attackChoices(actor) {
    if (!actor) return [];
    const own = sheet(actor);
    const result = [];
    if (own) for (const item of globalThis.ECHO_PARTY_DATA.ownerView(own).attacks || []) {
      const dice = damageDice(item.damageDice);
      if (Number.isFinite(item.attackBonus) && dice) result.push({ name: item.name, bonus: item.attackBonus, dice,
        type: item.damageType || 'damage', note: item.effect || '',
        critThreshold: own.features?.some(feature => feature.name === 'Improved Critical') ? 19 : 20 });
    }
    for (const item of creature(actor)?.actions || []) {
      const dice = damageDice(item.dice);
      if (Number.isFinite(item.bonus) && dice) result.push({ name: item.name, bonus: item.bonus, dice,
        type: item.type || 'damage', note: item.note || '' });
    }
    for (const item of actor.extraAttacks || []) if (Number.isFinite(item.bonus)) result.push({ name: item.name, bonus: item.bonus,
      dice: { count: item.count, sides: item.sides, modifier: item.modifier }, type: item.damage || 'damage', note: '' });
    return result;
  }
  function sequence(actor, attacks) {
    if (!actor || !attacks.length) return [];
    const names = {
      'redbrand-ruffian': ['Shortsword', 'Shortsword'], nothic: ['Claws', 'Claws'],
      owlbear: ['Beak', 'Claws'], grick: ['Tentacles', 'Beak'], doppelganger: ['Slam', 'Slam'],
      'young-green-dragon': ['Bite', 'Claw', 'Claw'], 'sildar-equipped': ['Longsword', 'Longsword']
    }[actor.type] || globalThis.ECHO_SESSION4_COMBAT?.sequences?.[actor.type];
    if (!names) return [];
    return names.map((name, index) => ({ id: `${index}:${name}`, label: `${index + 1}. ${name}${actor.type === 'grick' && name === 'Beak' ? ' · only after tentacles hit' : ''}`,
      attackIndex: Math.max(0, attacks.findIndex(item => item.name.toLowerCase().includes(name.toLowerCase()))) }));
  }
  function syncQueue(actor, steps) {
    const queue = state().queue;
    const key = actor ? `${host.scene()}:${host.turn().round}:${actor.id}` : '';
    if (queue.key !== key) {
      queue.key = key; queue.done = steps.map(() => false); queue.movementUsed = 0; queue.actionUsed = false; queue.bonusUsed = false;
    }
    if (queue.done.length !== steps.length) queue.done = steps.map((_, index) => queue.done[index] === true);
    return queue;
  }
  function resetDraft(actor, attacks, targets) {
    if (draft.actor !== actor.id) draft = { actor: actor.id, actionChosen:false, attack: 0, target: '', mode: 'normal', cover: 'none', acOverride: '', roll: null, damage: null, damageManual: '', confirmed: false, manualCrit: false };
    if (draft.attack >= attacks.length) draft.attack = 0;
    if (!targets.some(t => t.id === draft.target)) draft.target = '';
  }
  const clearRoll = () => { draft.roll = null; draft.damage = null; draft.damageManual = ''; draft.confirmed = false; draft.manualCrit = false; };
  function renderInitiative(root) {
    const prompt = state().initiativePrompt;
    const heroes = placed().filter(t => t.team === 'pc');
    const box = el('div', '', 'live-initiative');
    const title = el('strong', prompt.open && prompt.scene === host.scene() ? 'Phones are collecting initiative' : 'Initiative setup');
    box.append(title);
    const row = el('div', '', 'button-row');
    button(row, prompt.open && prompt.scene === host.scene() ? 'Close phone rolls' : 'Ask phones to roll initiative', () => host.toggleInitiative(), 'primary');
    button(row, 'Roll placed enemies', () => host.rollEnemies());
    button(row, 'Build turn order', () => host.buildOrder());
    box.append(row);
    if (heroes.length) box.append(el('small', heroes.map(t => `${t.name}: ${t.initiative ?? 'waiting'}`).join(' · ')));
    root.append(box);
  }
  function renderReminders(root, actor) {
    const reminders = [];
    const record = host.combat()?.tokens?.[actor.id] || {};
    const own = sheet(actor);
    if (actor.hp === 0 && actor.team === 'pc' && !own?.death?.stable) reminders.push(`Death save due · ${own?.death?.successes || 0} successes / ${own?.death?.failures || 0} failures`);
    if (record.concentration || own?.concentration) reminders.push(`Concentrating: ${record.concentration || own.concentration}`);
    if (record.reactionUsed) reminders.push('Reaction spent this round');
    else reminders.push('Reaction available');
    if (record.ready) reminders.push(`Readied: ${record.ready}`);
    for (const effect of host.combat()?.effects || []) if (effect.tokenId === actor.id || effect.due) {
      const target = host.tokens().find(t => t.id === effect.tokenId);
      reminders.push(`${effect.due ? 'DUE NOW · ' : ''}${target && target.id !== actor.id ? `${target.name}: ` : ''}${effect.name}${effect.repeatSave ? ' · repeat save' : ''}${effect.remaining > 0 ? ` · ${effect.remaining} turns` : ''}`);
    }
    const box = el('div', '', 'live-reminders');
    box.append(el('strong', 'Turn reminders'));
    for (const message of reminders) box.append(el('span', message, message.startsWith('DUE NOW') ? 'due' : ''));
    button(box, record.reactionUsed ? 'Reset reaction' : 'Mark reaction used', () => host.setReaction(actor.id, !record.reactionUsed));
    if (actor.hp === 0 && actor.team === 'pc') button(box, 'Open death saves', () => host.openParty(actor.id));
    button(box, 'Open timed effects', () => host.openCombat('flow'));
    root.append(box);
  }
  function renderPhoneRequests(root) {
    const pending = host.requests(); if (!pending.length) return;
    const box = el('div', '', 'live-phone-requests'); box.append(el('strong', 'Player phone requests'));
    for (const request of pending) {
      const name = host.party()?.[request.characterId]?.name || 'Player';
      const row = el('div', '', 'live-wave'); row.append(el('span', `${name}: ${request.label || 'Explore the map'}`));
      button(row, request.kind === 'action' ? 'Review' : 'Approve', () => host.approveRequest(request.id));
      button(row, 'Dismiss', () => host.dismissRequest(request.id)); box.append(row);
    }
    root.append(box);
  }
  function renderResources(root, actor) {
    const box = el('div', '', 'live-resources'); box.append(el('strong', 'Limited uses'));
    const own = sheet(actor);
    if (own?.resources?.length) {
      for (const item of own.resources.slice(0, 8)) box.append(el('span', `${item.name}: ${item.current ?? '?'} / ${item.max ?? '?'}`));
      button(box, 'Edit character resources', () => host.openParty(actor.id));
    }
    const list = state().resources[actor.id] || [];
    list.forEach((item, index) => {
      const row = el('div', '', 'live-wave'); row.append(el('span', `${item.name}: ${item.current}/${item.max}`));
      button(row, '−', () => { item.current = Math.max(0, item.current - 1); host.commit(`${actor.name} used ${item.name}`); });
      button(row, '+', () => { item.current = Math.min(item.max, item.current + 1); host.commit(`${actor.name} restored ${item.name}`); });
      button(row, 'Remove', () => { list.splice(index, 1); host.commit(`Removed ${actor.name} resource`); }); box.append(row);
    });
    button(box, 'Add limited use', () => { const name = window.prompt('Resource name (spell slots, charges, etc.):', ''); if (!name?.trim()) return;
      const maxText = window.prompt('Maximum uses:', '1'); if (maxText === null) return;
      const max = bounded(maxText, 1, 999);
      (state().resources[actor.id] ||= []).push({name:name.trim().slice(0,60),current:max,max});
      state().resources[actor.id] = state().resources[actor.id].slice(-12);
      host.commit(`Added ${actor.name} resource: ${name.trim().slice(0,60)}`); });
    root.append(box);
  }
  function renderAttack(root, actor, attacks, steps) {
    const box = el('div', '', 'live-attack'); box.append(el('h3', 'Attack and damage'));
    if (!attacks.length) { box.append(el('p', 'No attack with complete dice is on this card. Use the character sheet or custom roll.')); button(box, 'Open rolls', () => host.openCombat('rolls')); root.append(box); return; }
    const targets = placed().filter(t => t.id !== actor.id && t.hp > 0);
    resetDraft(actor, attacks, targets);
    const choices = el('div', '', 'live-fields');
    const attackLabel = el('label', 'Attack'); const attackSelect = el('select');
    attacks.forEach((attack, index) => { const option = el('option', `${attack.name} · +${attack.bonus} · ${attack.dice.count}d${attack.dice.sides}${attack.dice.modifier ? (attack.dice.modifier > 0 ? '+' : '') + attack.dice.modifier : ''} ${attack.type}`); option.value = index; attackSelect.append(option); });
    attackSelect.value = String(draft.attack); attackSelect.addEventListener('change', () => { draft.attack = Number(attackSelect.value); clearRoll(); render(); });
    attackLabel.append(attackSelect); choices.append(attackLabel);
    const phase=!draft.actionChosen?1:!draft.target?2:!draft.roll?3:!draft.confirmed?4:5;
    box.append(el('p',`Choose action → Target → Roll → Reactions → Damage → Done · Step ${phase}`, 'combat-flow-steps'));
    if(!draft.actionChosen){box.append(attackLabel);button(box,'Use this action',()=>{draft.actionChosen=true;render();},'primary');root.append(box);return;}

    const targetLabel = el('label', 'Target'); const targetSelect = el('select');const emptyTarget=el('option','Choose a target');emptyTarget.value='';targetSelect.append(emptyTarget);
    for (const target of targets) { const option = el('option', `${target.name} · AC ${target.ac ?? '?'}`); option.value = target.id; targetSelect.append(option); }
    targetSelect.value = draft.target; targetSelect.addEventListener('change', () => { draft.target = targetSelect.value; draft.acOverride = ''; clearRoll(); render(); });
    targetLabel.append(targetSelect); choices.append(targetLabel);
    const modeLabel = el('label', 'Roll'); const mode = el('select');
    for (const value of ['normal','advantage','disadvantage']) { const option = el('option', value); option.value = value; mode.append(option); }
    mode.value = draft.mode; mode.addEventListener('change', () => { draft.mode = mode.value; clearRoll(); render(); }); modeLabel.append(mode); choices.append(modeLabel);
    const coverLabel = el('label', 'Cover'); const cover = el('select');
    for (const [value, label] of [['none','None'],['half','Half +2 AC'],['threequarters','Three-quarters +5 AC'],['full','Full · cannot target']]) { const option = el('option', label); option.value = value; cover.append(option); }
    cover.value = draft.cover; cover.addEventListener('change', () => { draft.cover = cover.value; clearRoll(); render(); }); coverLabel.append(cover); choices.append(coverLabel);
    box.append(choices);
    if(!draft.target){button(box,'Tap token to target',()=>host.targetTool?.());root.append(box);return;}
    const chosen = attacks[draft.attack], target = targets.find(t => t.id === draft.target);
    button(box,'Tap token to target',()=>host.targetTool?.());
    const suggestion=host.allState&&target?globalThis.ECHO_COMBAT_PLUS?.suggest(host.allState(),actor.id,target.id,'attack','',globalThis.ECHO_COMBAT_PLUS.distance(actor,target,globalThis.ECHO_COMBAT_PLUS.scale(host.allState(),host.columns()))):null;
    if(suggestion&&(suggestion.yes.length||suggestion.no.length||suggestion.notes.length)){box.append(el('p',`${[...suggestion.yes,...suggestion.no,...suggestion.notes].join(' ')} Suggested: ${suggestion.mode}. The roll selector is your override.`, 'live-caution'));button(box,`Use suggested ${suggestion.mode}`,()=>{draft.mode=suggestion.mode;clearRoll();render();});}
    if (chosen.note) box.append(el('p', chosen.note, 'live-caution'));
    const targetAC = draft.acOverride === '' ? (target?.ac ?? null) === null ? null : target.ac + (draft.cover === 'half' ? 2 : draft.cover === 'threequarters' ? 5 : 0) : Number(draft.acOverride);
    const ac = el('label', 'AC after reactions or rulings'); const acInput = el('input'); acInput.type = 'number'; acInput.value = draft.acOverride === '' ? targetAC ?? '' : draft.acOverride;
    acInput.placeholder = 'Confirm AC'; acInput.addEventListener('change', () => { draft.acOverride = acInput.value; draft.confirmed = false; render(); }); ac.append(acInput); box.append(ac);
    const rollRow = el('div', '', 'button-row');
    button(rollRow, 'Roll attack', () => { const entry = host.roll(`${actor.name} · ${chosen.name} attack`, 1, 20, chosen.bonus, draft.mode);
      if (entry) { const natural = draft.mode === 'advantage' ? Math.max(...entry.parts) : draft.mode === 'disadvantage' ? Math.min(...entry.parts) : entry.parts[0];
        draft.roll = { total: entry.total, natural }; draft.damage = null; draft.confirmed = false; render(); } }, 'primary').disabled = !target || draft.cover === 'full';
    const manual = el('input'); manual.type = 'number'; manual.placeholder = 'Manual total'; manual.setAttribute('aria-label', 'Manual attack total'); manual.className = 'manual-attack-total';
    button(rollRow, 'Use manual total', () => { if (manual.value === '' || !Number.isFinite(Number(manual.value))) return; draft.roll = { total: Number(manual.value), natural: null };
      draft.damage = null; draft.confirmed = false; render(); }).disabled = !target || draft.cover === 'full';
    rollRow.append(manual); box.append(rollRow);
    if (draft.roll) {
      button(box,'Pause for reactions',()=>host.pauseAttack?.(`${actor.name} · ${chosen.name}`,target.id));
      const natural = draft.roll.natural;
      const suggested = attackOutcome(draft.roll, targetAC, chosen.critThreshold);
      box.append(el('strong', `${draft.roll.total} vs AC ${targetAC ?? '?'} · ${suggested}`));
      button(box, 'Mark attack spent (miss or no damage)', () => { const step = steps.findIndex((item, index) => !state().queue.done[index] && item.attackIndex === draft.attack);
        if (step >= 0) state().queue.done[step] = true;
        state().queue.actionUsed = true; clearRoll(); host.commit(`${actor.name} used ${chosen.name}`); });
      const confirm = el('label', ' Confirm the hit after reactions and cover', 'live-confirm'); const check = el('input'); check.type = 'checkbox'; check.checked = draft.confirmed;
      check.addEventListener('change', () => { draft.confirmed = check.checked; render(); }); confirm.prepend(check); box.append(confirm);
      if (natural === null) { const crit = el('label', ` Manual roll was a natural ${chosen.critThreshold === 19 ? '19 or 20' : '20'}`, 'live-confirm'); const critCheck = el('input'); critCheck.type = 'checkbox'; critCheck.checked = draft.manualCrit;
        critCheck.addEventListener('change', () => { draft.manualCrit = critCheck.checked; draft.damage = null; render(); }); crit.prepend(critCheck); box.append(crit); }
      if (draft.confirmed) {
        const dice = chosen.dice, critical = (natural !== null && natural >= (chosen.critThreshold || 20)) || draft.manualCrit;
        const damageRow = el('div', '', 'button-row');
        button(damageRow, critical ? 'Roll critical damage' : 'Roll damage', () => { const entry = host.roll(`${actor.name} · ${chosen.name} damage`, dice.count * (critical ? 2 : 1), dice.sides, dice.modifier, 'normal');
          if (entry) { draft.damage = entry.total; draft.damageManual = ''; render(); } }, 'primary');
        const amount = el('input'); amount.type = 'number'; amount.min = '0'; amount.placeholder = 'Manual damage'; amount.value = draft.damageManual;
        amount.addEventListener('change', () => { draft.damageManual = amount.value; draft.damage = amount.value === '' ? null : bounded(amount.value, 0, 9999); render(); }); damageRow.append(amount); box.append(damageRow);
        if (draft.damage !== null && target) {
          const preview = host.previewDamage(target.id, draft.damage, chosen.type);
          box.append(el('p','Applying the reviewed damage will update HP and temporary HP, mark this attack and the action used, and add any concentration reminder. Review unusual feature or ammunition costs on the character sheet.', 'live-caution'));
          box.append(el('p', `${draft.damage} ${chosen.type} → ${preview.adjusted} after defenses; ${preview.tempUsed} temp HP absorbed. ${target.name}: ${target.hp} → ${preview.hp} HP.`, 'live-damage-preview'));
          button(box, `Review ${chosen.type} damage / reactions`, () => {
            const step=steps.findIndex((item,index)=>!state().queue.done[index]&&item.attackIndex===draft.attack);
            host.stageDamage({label:`${actor.name} · ${chosen.name}`,actorId:actor.id,targets:[target.id],components:[{amount:draft.damage,type:chosen.type,magical:false,overrides:{},activeRules:[]}],
              attack:{total:draft.roll.total,natural:draft.roll.natural??(draft.manualCrit?(chosen.critThreshold||20):null),crit:chosen.critThreshold||20,cover:draft.cover==='half'?2:draft.cover==='threequarters'?5:0,acBonus:draft.acOverride===''?0:Number(draft.acOverride)-Number(target.ac)-(draft.cover==='half'?2:draft.cover==='threequarters'?5:0),step}});
            clearRoll();render();
          }, 'primary');
        }
      }
    }
    button(box, 'Manual damage / correction', () => host.openDamage(target ? [target.id] : []));
    root.append(box);
  }
  function renderEncounter(root, actor) {
    const encounter = host.encounters().find(item => item.id === actor?.encounter) || host.encounters().find(item =>
      host.tokens().some(t => t.encounter === item.id && t.placed && t.scene === host.scene()));
    if (!encounter) return;
    const plan = host.combat()?.plans?.[encounter.id] || {};
    const box = el('details', '', 'live-encounter'); box.open = encounterOpen;
    const head = el('summary', `Encounter · ${encounter.name}`); box.append(head);
    box.addEventListener('toggle', () => { encounterOpen = box.open; });
    for (const [label, value] of [['Objective', plan.objective], ['Terrain', plan.terrain], ['Morale', plan.morale], ['Retreat', plan.retreat], ['Negotiation', plan.negotiation], ['Non-combat outcome', plan.nonCombat]])
      if (value) box.append(el('p', `${label}: ${value}`));
    const row = el('div', '', 'button-row');
    for (const status of ['fighting','parley','retreat','surrender']) button(row, status[0].toUpperCase() + status.slice(1), () => host.setEncounterStatus(encounter.id, status),
      state().encounterStatus[encounter.id] === status ? 'selected' : '');
    box.append(row);
    for (const [index, wave] of (plan.waves || []).entries()) if (!wave.deployed) {
      const waveRow = el('div', `${wave.name} · ${wave.note || 'reinforcements'}`, 'live-wave');
      button(waveRow, 'Deploy wave', () => host.deployWave(encounter.id, index)); box.append(waveRow);
    }
    root.append(box);
  }
  let encounterOpen = true;
  function render() {
    const root = $('combat-live-panel'); if (!root || !host) return;
    root.replaceChildren();
    if (!host.isMap()) return;
    const actor = current();
    if (!actor) { renderInitiative(root); renderEncounter(root, null); return; }
    const attacks = attackChoices(actor), steps = sequence(actor, attacks), queue = syncQueue(actor, steps);
    const head = el('div', '', 'live-head'); const title = el('div');
    title.append(el('small', `ROUND ${host.turn().round} · ACTIVE TURN`), el('h2', actor.name));
    head.append(title); button(head, 'End turn →', () => host.endTurn(), 'primary live-end-turn'); root.append(head);
    const own = sheet(actor), speed = own?.speed || creature(actor)?.speed || 'See card';
    const summary = el('div', '', 'live-summary');
    summary.append(el('span', `HP ${actor.hp}/${actor.maxHp ?? '?'} · AC ${actor.ac ?? '?'}`), el('span', `Move ${queue.movementUsed} / ${typeof speed === 'number' ? `${speed} ft.` : speed}`));
    if (actor.conditions?.length) summary.append(el('span', actor.conditions.join(', ')));
    for (const resource of (own?.resources || []).slice(0, 6)) summary.append(el('span', `${resource.name}: ${resource.current ?? '?'}/${resource.max ?? '?'}`));
    const phase=host.allState?.().combatPlus?.phases?.[actor.id];if(phase)summary.append(el('span',`Boss phase: ${phase}`));
    root.append(summary);
    const actions = el('div', '', 'live-actions');
    const used = el('label', 'Movement used (ft.)'); const movement = el('input'); movement.type = 'number'; movement.min = '0'; movement.max = '999'; movement.value = queue.movementUsed;
    movement.addEventListener('change', () => { queue.movementUsed = bounded(movement.value, 0, 999); host.commit(`${actor.name} moved ${queue.movementUsed} ft.`); }); used.append(movement); actions.append(used);
    const flags = el('div', '', 'button-row');
    button(flags, queue.actionUsed ? 'Action used ✓' : 'Mark action used', () => { queue.actionUsed = !queue.actionUsed; host.commit(`${actor.name} action ${queue.actionUsed ? 'used' : 'available'}`); });
    button(flags, queue.bonusUsed ? 'Bonus action used ✓' : 'Mark bonus action used', () => { queue.bonusUsed = !queue.bonusUsed; host.commit(`${actor.name} bonus action ${queue.bonusUsed ? 'used' : 'available'}`); });
    actions.append(flags); root.append(actions);
    if (steps.length) {
      const stepBox = el('div', '', 'live-sequence'); stepBox.append(el('strong', 'Multiattack queue'));
      steps.forEach((step, index) => button(stepBox, `${queue.done[index] ? '✓' : '○'} ${step.label}`, () => { queue.done[index] = !queue.done[index]; draft.attack = step.attackIndex; clearRoll(); host.commit(`${actor.name}: ${step.label} ${queue.done[index] ? 'done' : 'ready'}`); }, queue.done[index] ? 'done' : ''));
      root.append(stepBox);
    }
    renderReminders(root, actor); renderResources(root, actor); renderPhoneRequests(root); renderAttack(root, actor, attacks, steps); renderEncounter(root, actor);
  }
  function init(context) { host = context; render(); }
  globalThis.ECHO_COMBAT_RUN = { normalize, init, render, target:id=>{const actor=current();if(!actor)return;const attacks=attackChoices(actor),targets=placed().filter(t=>t.id!==actor.id);resetDraft(actor,attacks,targets);if(targets.some(t=>t.id===id)){draft.actionChosen=true;draft.target=id;draft.acOverride='';clearRoll();render();}},targetId:()=>draft.target, attackChoices, sequence, damageDice, attackOutcome };
})();

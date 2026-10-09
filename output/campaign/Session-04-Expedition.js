(() => {
  'use strict';
  // DM-only journal. PublicState and phoneSnapshot deliberately do not include it.
  const ROOM_NAMES = ['Cave Entrance', 'Mine Tunnels', 'Old Entrance', 'Old Guardroom',
    'Assayers’ Office', 'South Barracks', 'Ruined Storeroom', 'Fungi Cavern', 'Great Cavern',
    'Dark Pool', 'North Barracks', 'Smelter Cavern', 'Starry Cavern', 'Wizards’ Quarters',
    'Forge of Spells', 'Booming Cavern', 'Old Streambed', 'Collapsed Cavern', 'Temple of Dumathoin', 'Priests’ Quarters'];
  const OPTIONS = {
    gundren: [['unknown','Not recorded'],['safe','Safe'],['missing','Missing'],['dead','Dead']],
    nundro: [['unknown','Not recorded'],['rescued','Rescued and survived'],['captive','Still captive'],['missing','Missing'],['dead','Dead']],
    nezznar: [['unknown','Not recorded'],['active','Still active'],['dead','Dead'],['captured','Captured · in party custody'],['delivered','Delivered alive to Sildar / Wester'],['escaped','Escaped'],['bargain','Temporary bargain']],
    forge: [['unknown','Not recorded'],['unreached','Not reached'],['secured','Reached and secured'],['contested','Still contested'],['sealed','Sealed by party choice'],['destroyed','Destroyed in play']],
    redbrands: [['unknown','Not recorded'],['defeated','Threat ended'],['active','Still active'],['deal','Negotiated settlement']],
    custody: [['unknown','Not recorded'],['guarded','Named guards assigned'],['unguarded','Unguarded in town'],['transferred','Transferred to the Lords’ Alliance']],
    mineShare: [['unknown','Not agreed'],['offered','10% profit share offered'],['accepted','10% profit share accepted'],['declined','Declined / another agreement']],
    phase: [['exploring','Exploring'],['resting','Resting'],['retreated','Away from cave'],['finished','Expedition concluded']]
  };
  const clean = (v, n = 1800) => String(v ?? '').slice(0, n);
  const number = (v, max = 10000000) => Number.isFinite(Number(v)) ? Math.max(0, Math.min(max, Math.floor(Number(v)))) : 0;
  const choice = (key, value) => OPTIONS[key].some(([id]) => id === value) ? value : OPTIONS[key][0][0];
  function normalize(raw = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const rooms = {};
    ROOM_NAMES.forEach((name, index) => {
      const room = raw.rooms?.[index + 1] || {};
      rooms[index + 1] = {
        status: ['unvisited','scouted','active','cleared','bypassed'].includes(room.status) ? room.status : 'unvisited',
        treasure: ['unrecorded','left','partial','collected'].includes(room.treasure) ? room.treasure : 'unrecorded',
        notes: clean(room.notes), remaining: clean(room.remaining)
      };
    });
    const outcomes = Object.fromEntries(Object.keys(OPTIONS).filter(key => key !== 'phase')
      .map(key => [key, choice(key, raw.outcomes?.[key])]));
    return { version: 1, rooms, outcomes, phase: choice('phase', raw.phase),
      minutes: number(raw.minutes), visit: Math.max(1, number(raw.visit, 999)),
      room: Math.max(1, number(raw.room, 20)), resumeBeat: /^s4-[a-z0-9-]{1,60}$/.test(raw.resumeBeat || '') ? raw.resumeBeat : 's4-room-1',
      alert: clean(raw.alert), promises: clean(raw.promises), next: clean(raw.next),
      playerAccount: clean(raw.playerAccount, 4000),
      flameskull: { status: ['unrecorded','destroyed','prevented','returned'].includes(raw.flameskull?.status) ? raw.flameskull.status : 'unrecorded',
        destroyedAt: number(raw.flameskull?.destroyedAt) },
      forgeItems: (Array.isArray(raw.forgeItems) ? raw.forgeItems : []).slice(-30).filter(item => item && item.name)
        .map(item => ({ name: clean(item.name, 120), expires: number(item.expires) })),
      log: (Array.isArray(raw.log) ? raw.log : []).slice(-100).filter(item => item && item.label)
        .map(item => ({ label: clean(item.label, 400), minute: number(item.minute), visit: number(item.visit, 999) })) };
  }
  function record(value, label, minutes = 0) {
    value.minutes = number(value.minutes + number(minutes));
    value.log.push({ label: clean(label, 400), minute: value.minutes, visit: value.visit });
    value.log = value.log.slice(-100);
  }
  function reminders(value) {
    const result = [];
    if (value.flameskull.status === 'destroyed') {
      const left = value.flameskull.destroyedAt + 60 - value.minutes;
      result.push(left > 0 ? `Flameskull may rejuvenate in ${left} expedition minutes unless its remains receive the specified treatment.` :
        'Flameskull rejuvenation is due. Verify holy water, dispel magic, or remove curse; then restore the existing token manually if appropriate. Do not create a second skull.');
    }
    for (const item of value.forgeItems) result.push(item.expires > value.minutes ?
      `${item.name}: temporary Forge enchantment has ${item.expires - value.minutes} minutes remaining.` :
      `${item.name}: temporary Forge enchantment expired. Remove its temporary bonus from the sheet.`);
    if (value.outcomes.nezznar === 'delivered' && value.outcomes.custody === 'unguarded')
      result.push('Private consequence · LMoP p. 50: Halia arranges Nezznar’s escape if no guards are posted. Play or record this consequence; do not announce it as witnessed fact.');
    return result;
  }
  function homecoming(value) {
    const o = value.outcomes;
    const paragraphs = ['Phandalin’s rooftops rise ahead of you. At Barthen’s, a conversation fades as people notice you approaching. A chair is pulled from behind the counter. “Come in. Tell us what happened.”'];
    if (o.nundro === 'rescued') paragraphs.push('There is relief when Nundro’s survival is confirmed. Food and a quiet place to recover matter more, for the moment, than questions about the mine.');
    if (o.nundro === 'dead' || o.gundren === 'dead') paragraphs.push('The news of the loss stills the room. Someone asks how the fallen should be remembered, and who needs to be told.');
    if (o.nundro === 'captive' || o.gundren === 'missing' || o.nundro === 'missing') paragraphs.push('When the missing are named, the first question is how to bring them home. There is still work to do.');
    if (o.nezznar === 'dead') paragraphs.push('The news that the Black Spider is dead brings a long breath of relief. Questions follow about those who served him and what remains inside the mine.');
    if (o.nezznar === 'captured') paragraphs.push('With the Black Spider in your custody, a secure place to hold him becomes the immediate concern. Who will take responsibility for the prisoner?');
    if (o.nezznar === 'delivered') paragraphs.push('The Black Spider has been handed over alive. For those outside his cell, the argument now turns to guards, testimony, and where he should face judgment.');
    if (o.nezznar === 'escaped' || o.nezznar === 'active') paragraphs.push('The Black Spider remains a threat. The room listens closely as you describe what you know, and what preparations you think are needed.');
    if (o.nezznar === 'bargain') paragraphs.push('Your agreement with the Black Spider raises careful questions. What did he promise, and what would make you trust him to keep it?');
    if (o.forge === 'secured') paragraphs.push('Word of the recovered Forge brings talk of repairs, workers, and a future for the mine. Turning that hope into a working home will take time.');
    if (['contested','sealed','destroyed'].includes(o.forge)) paragraphs.push('The mine’s future is still uncertain. People ask what can be made safe, what should be left alone, and what help you need next.');
    if (o.redbrands === 'active') paragraphs.push('Even as news of the cave spreads, the Redbrands’ presence still shapes the town. The trouble here has not ended.');
    if (value.playerAccount.trim()) paragraphs.push(value.playerAccount.trim());
    return paragraphs.join('\n\n');
  }
  function render(root, host) {
    const el = (tag, text, parent, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text;
      if (cls) n.className = cls; parent.append(n); return n; };
    const button = (p, label, action) => { const b = el('button', label, p); b.type = 'button'; b.addEventListener('click', action); return b; };
    const section = (title, note = '') => { const s = el('section', null, root, 'story-section'); el('h3', title, s); if (note) el('p', note, s, 'help'); return s; };
    const refresh = () => globalThis.ECHO_STORY_UI?.render();
    const save = (label) => { host.commitExpedition(label); refresh(); };
    const field = (p, label, value, change, multiline = false) => {
      const l = el('label', label, p, 'story-field'), i = el(multiline ? 'textarea' : 'input', null, l);
      i.value = value; if (multiline) i.rows = 3; else i.type = 'text';
      i.addEventListener('change', () => { change(clean(i.value, multiline ? 4000 : 1800)); save(label); }); return i;
    };
    const select = (p, label, value, options, change) => {
      const l = el('label', label, p, 'story-field'), s = el('select', null, l);
      for (const [id, text] of options) { const o = el('option', text, s); o.value = id; } s.value = String(value);
      s.addEventListener('change', () => { change(s.value); save(label); }); return s;
    };
    if (!host.beats().some(b => b.id === 's4-prep')) {
      section('Wave Echo Cave journal', 'Open Session 4 · Wave Echo Cave from the session selector to use its room and expedition journal.'); return;
    }
    const d = host.expedition();
    const link = section('Connected expedition record', 'Use the saved-session return review to retain this cave and carry the party’s current resources.');
    button(link, 'Open expedition record', () => globalThis.ECHO_STORY_UI.open('expeditions'));
    let s = section('Wave Echo Cave · expedition journal', 'Private DM record. Keep using this saved session when you rest, leave, or return; creating a fresh pack creates a fresh dungeon. Changes support Undo and campaign backups.');
    el('p', `Visit ${d.visit} · ${d.minutes} minutes tracked · ${host.partyLevel()}`, s);
    select(s, 'Expedition status', d.phase, OPTIONS.phase, value => { d.phase = value; });
    const openBeat = id => { globalThis.ECHO_STORY_UI?.close(); host.selectBeat(id); };
    button(s, 'Resume saved room notes', () => openBeat(d.resumeBeat));
    button(s, 'Open marked book map · p. 43', () => host.openPrinted('lmop', 43));
    s = section('Room record', 'Cleared and treasure collected are separate decisions. This record never respawns monsters, grants loot, or resets revealed fog.');
    select(s, 'Room', d.room, ROOM_NAMES.map((name, i) => [String(i + 1), `${i + 1} · ${name}`]), value => { d.room = Number(value); d.resumeBeat = `s4-room-${value}`; });
    const room = d.rooms[d.room];
    const foes = host.encounterTokens(`wave-${d.room}`);
    el('p', foes.length ? `Saved combatants: ${foes.map(t => `${t.name} ${t.hp}/${t.maxHp} HP`).join(' · ')}` : 'No seeded combatants in this room.', s);
    select(s, 'Exploration', room.status, [['unvisited','Not visited'],['scouted','Scouted'],['active','Unresolved'],['cleared','Resolved'],['bypassed','Bypassed']], value => { room.status = value; });
    select(s, 'Treasure', room.treasure, [['unrecorded','Not recorded'],['left','Left in place'],['partial','Partly collected'],['collected','Collected']], value => { room.treasure = value; });
    field(s, 'Who carries the treasure / what was taken', room.notes, value => { room.notes = clean(value); }, true);
    field(s, 'Remaining enemies, doors, hazards, promises', room.remaining, value => { room.remaining = clean(value); }, true);
    button(s, 'Open this room’s card', () => openBeat(`s4-room-${d.room}`));
    s = section('Rest, retreat, and return', 'LMoP pp. 42, 45, 50–51. Area 7 is a secure rest location; area 20 is safe after Nezznar and his minions are dealt with. Review protection, elapsed time, and story changes. Recover HP and resources through each character’s existing rest review.');
    field(s, 'Enemy awareness / changes while the party is away', d.alert, value => { d.alert = value; }, true);
    const l = el('label', 'Minutes actually elapsed', s, 'story-field'), time = el('input', null, l);
    time.type = 'number'; time.min = '0'; time.max = '10080'; time.value = '60';
    const recordTime = kind => {
      const minutes = Number(time.value);
      if (!Number.isInteger(minutes) || minutes < 0 || minutes > 10080) { host.toast('Enter 0–10,080 whole minutes.'); return; }
      if (!window.confirm(`Record ${kind.toLowerCase()} and advance expedition time by ${minutes} minutes? HP, resources, fog, and enemies stay as saved; review character recovery separately.`)) return;
      if (kind === 'Retreat') d.phase = 'retreated';
      if (kind === 'Rest') d.phase = 'resting';
      if (kind === 'Return') { if (d.phase === 'retreated') d.visit++; d.phase = 'exploring'; }
      record(d, `${kind} · room ${d.room}`, minutes);
      save(`${kind} · ${minutes} expedition minutes`);
    };
    for (const kind of ['Rest','Retreat','Return','Exploration']) button(s, `Record ${kind.toLowerCase()}`, () => recordTime(kind));
    button(s, 'Open character rest controls', () => host.openParty());
    el('p', 'Expedition minutes track this journal only. If you also use the map clock, advance that separately once. Interrupted rests use actual elapsed time and do not grant completed-rest benefits.', s, 'help');
    el('p', 'Wandering encounter check is optional and used sparingly: d20, 17–20 triggers; d12 table: 1–3 stirges (2d4), 4–5 ghouls (1d4), 6 gricks (1d4), 7–8 bugbears (1d4), 9 skeletons (1d6), 10 zombies (1d6), 11–12 one ochre jelly. Choose a plausible route and avoid counting an existing group twice.', s, 'help');
    s = section('Persistent threats and Forge use', 'Record what happened, then review reminders before returning. These reminders never change a creature or character automatically.');
    select(s, 'Flameskull', d.flameskull.status, [['unrecorded','Not recorded'],['destroyed','Destroyed · may rejuvenate'],['prevented','Rejuvenation prevented'],['returned','Rejuvenated · token reviewed']], value => { d.flameskull.status = value; if (value === 'destroyed') d.flameskull.destroyedAt = d.minutes; });
    el('p', 'If destroyed, rejuvenates in 1 hour at full HP unless holy water is sprinkled on the remains or dispel magic / remove curse is cast on them. Check room 12 and the stat card. Record “destroyed” again only for a new destruction.', s, 'help');
    el('p', 'Forge · LMoP p. 48: bathe a nonmagical weapon or suit of armor in green flame for at least 1 minute; it becomes a +1 item for 1d12 hours. This is temporary, does not stack onto an already magical item, and is not a permanent crafting service.', s, 'help');
    const itemLabel = el('label', 'Forge item and carrier', s, 'story-field'), item = el('input', null, itemLabel);
    item.type = 'text'; item.placeholder = 'Example: Pebble’s hammer'; item.maxLength = 120;
    const hoursLabel = el('label', 'Rolled duration (1d12 hours)', s, 'story-field'), hours = el('input', null, hoursLabel);
    hours.type = 'number'; hours.min = '1'; hours.max = '12';
    button(s, 'Record temporary enchantment', () => {
      const n = Number(hours.value); if (!item.value.trim() || !Number.isInteger(n) || n < 1 || n > 12) { host.toast('Enter the item and a rolled duration of 1–12 hours.'); return; }
      if (!window.confirm(`Record ${item.value.trim()} as temporarily +1 for ${n} hours? Confirm the item was nonmagical and spent at least 1 minute in the Forge. Update its sheet manually.`)) return;
      d.forgeItems.push({ name: item.value.trim().slice(0, 120), expires: d.minutes + n * 60 }); d.forgeItems = d.forgeItems.slice(-30);
      record(d, `Forge enchantment: ${item.value.trim()} · ${n} hours`); save('Recorded temporary Forge enchantment');
    });
    for (const message of reminders(d)) el('p', message, s, 'story-note');
    d.forgeItems.forEach((entry, index) => button(s, `Remove reminder: ${entry.name}`, () => { d.forgeItems.splice(index, 1); save('Removed Forge reminder'); }));
    s = section('Actual outcomes', 'Leave facts unrecorded until they occur. These selections guide the homecoming preview; they do not publish secrets or award XP or treasure.');
    for (const [key, label] of [['gundren','Gundren'],['nundro','Nundro'],['nezznar','Nezznar'],['forge','Forge of Spells'],['redbrands','Redbrands'],['custody','Nezznar’s custody'],['mineShare','Mine profit agreement']])
      select(s, label, d.outcomes[key], OPTIONS[key], value => { d.outcomes[key] = value; });
    field(s, 'Promises, custody, losses, reward agreement', d.promises, value => { d.promises = value; }, true);
    field(s, 'Next adventure / consequence', d.next, value => { d.next = value; }, true);
    el('p', 'Book awards: Nundro rescued and survives, 200 XP divided across the party; Nezznar delivered alive to Sildar/Wester, double his 450 XP value (900 total, not 900 plus 450). Gundren and Nundro’s 10% mine profit offer assumes the published successful ending. Record an agreed variant if either brother or the mine is lost. XP and milestone advancement remain DM-reviewed.', s, 'help');
    s = section('Phandalin homecoming · DM preview', 'Original narration assembled from the recorded outcomes above. Edit the account below before showing it. Only the explicit TV button publishes this preview.');
    field(s, 'Additional player-known account', d.playerAccount, value => { d.playerAccount = value; }, true);
    const preview = homecoming(d); el('p', preview, s, 'story-note');
    el('p', `${preview.length} characters · TV limit 3,000; journal draft limit 2,500. Shorten the additional account if needed.`, s, 'help');
    button(s, 'Show homecoming text on TV', () => {
      if (preview.length > 3000) { host.toast('Shorten the additional account to keep the full TV preview under 3,000 characters.'); return; }
      host.showText('Return to Phandalin', preview);
    });
    button(s, 'Show Phandalin town map', () => host.changeScene('town-phandalin'));
    button(s, 'Save private recap draft', () => {
      if (preview.length > 2500) { host.toast('Shorten the additional account to keep the full journal draft under 2,500 characters.'); return; }
      const entryId = `wave-homecoming-${host.sessionId()}`;
      const journal = host.story().journal;
      const existing = journal.find(entry => entry.id === entryId);
      if (existing?.published) { host.toast('The earlier recap is already published. Edit it in Player journal before replacing its text.'); return; }
      const entry = { id: entryId, title: 'Wave Echo Cave · homecoming', text: preview, kind: 'recap', when: '', source: 'Recorded table outcomes · original homecoming narration', published: false };
      if (existing) Object.assign(existing, entry); else journal.push(entry);
      host.save('Saved private Wave Echo homecoming draft'); host.toast('Recap draft saved in Player journal; review before publishing.');
    });
    s = section('Expedition history');
    for (const entry of [...d.log].reverse().slice(0, 20)) el('p', `Visit ${entry.visit}, minute ${entry.minute}: ${entry.label}`, s, 'help');
  }
  globalThis.ECHO_WAVE_ECHO = { normalize, record, reminders, homecoming, render, ROOM_NAMES };
})();

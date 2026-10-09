(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clean = (value, max = 160) => String(value ?? '').slice(0, max);
  const esc = value => clean(value, 4000).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeImage = value => /^(?:assets|session-01-visuals|session-02-visuals|lmop-visuals|lmop-battle-maps|town-maps)\/[A-Za-z0-9/_-]+\.(?:png|jpg|jpeg|webp|svg)$/i.test(value || '') ? value : '';
  const phases = ['dawn','day','dusk','night'];
  const weatherChoices = ['clear','rain','mist','snow','storm','wind'];
  const phaseFor = minutes => minutes < 6*60 ? 'night' : minutes < 8*60 ? 'dawn' : minutes < 18*60 ? 'day' : minutes < 20*60 ? 'dusk' : 'night';
  const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const normalizeMood = raw => ({ minutes: Number.isInteger(raw?.minutes) ? ((raw.minutes % 1440) + 1440) % 1440 : 9*60,
    weather: weatherChoices.includes(raw?.weather) ? raw.weather : 'clear' });
  function normalize(raw = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const clues = (Array.isArray(raw.clues) ? raw.clues : []).slice(0, 150).filter(item => item && /^pc-[A-Za-z0-9_-]{1,75}$/.test(item.to || '')).map(item => ({
      id: clean(item.id, 80), to: clean(item.to, 80), title: clean(item.title, 120), text: clean(item.text, 2500),
      image: safeImage(item.image), delivered: item.delivered === true, saved: item.saved === true, at: clean(item.at, 40)
    })).filter(item => item.id && item.title);
    const inventory = (Array.isArray(raw.inventory) ? raw.inventory : []).slice(0, 150).filter(item => item && item.name).map(item => ({
      id: clean(item.id, 80), name: clean(item.name, 100), quantity: item.quantity === null || item.quantity === '' ? null : Math.max(0, Math.min(9999, Number(item.quantity) || 0)),
      holder: clean(item.holder || 'party', 80), note: clean(item.note, 280), visible: item.visible !== false, equipped: item.equipped === true
    })).filter(item => item.id);
    return { schemaVersion: 1, clues, inventory, atlas: globalThis.ECHO_ATLAS?.normalizeWorkspace(raw.atlas) || null, sessionFlow: globalThis.ECHO_SESSION_FLOW?.normalize(raw.sessionFlow) || raw.sessionFlow || null, flow: globalThis.ECHO_TABLE_FLOW?.normalize(raw.flow) || null, desk: globalThis.ECHO_DM_DESK?.normalize(raw.desk) || null, expedition: globalThis.ECHO_EXPEDITION?.normalize(raw.expedition) || null, expeditions: globalThis.ECHO_EXPEDITIONS?.normalize(raw.expeditions) || raw.expeditions || null, settlements: globalThis.ECHO_SETTLEMENTS?.normalize(raw.settlements) || null, atmosphere: globalThis.ECHO_ATMOSPHERE?.normalize(raw.atmosphere || {mode:raw.reducedEffects?'off':'subtle'}) || null, dungeon: globalThis.ECHO_DUNGEON?.normalize(raw.dungeon) || null, travel: globalThis.ECHO_TRAVEL?.normalize(raw.travel) || null, playerHub: globalThis.ECHO_PLAYER_TOOLS?.normalize(raw.playerHub) || null, reducedEffects: raw.reducedEffects === true };
  }
  let host = null, rehearsal = false, effect = null, effectTimer = 0;
  const draft = { to:'', title:'', text:'', image:'', item:'', quantity:'', holder:'party', note:'' };
  const extras = () => host?.getExtras?.() || normalize();
  const roster = () => host?.roster?.() || [];
  const imageChoices = () => (host?.media?.() || []).filter(item => item.kind === 'image' && safeImage(item.path));
  function store(label) { host?.saveExtras?.(label); render(); }
  function render() {
    const root = $('table-tools'); if (!root || !host) return;
    const data = extras(), people = roster();
    const opened = [...root.querySelectorAll('details')].map((node, index) => node.open ? index : -1).filter(index => index >= 0);
    if (!people.some(person => person.id === draft.to)) draft.to = people[0]?.id || '';
    root.innerHTML = `<h3>Table tools</h3>
      <details><summary>Private clues to phones</summary><div class="table-tool-body">
        <label>Character<select data-draft="to">${people.map(p => `<option value="${esc(p.id)}" ${p.id === draft.to ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
        <label>Clue title<input data-draft="title" maxlength="120" value="${esc(draft.title)}" placeholder="The Below token"></label>
        <label>Private text<textarea data-draft="text" maxlength="2500" rows="4">${esc(draft.text)}</textarea></label>
        <label>Image, optional<select data-draft="image"><option value="">None</option>${imageChoices().map(item => `<option value="${esc(item.path)}" ${item.path === draft.image ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label>
        <div class="button-row"><button type="button" data-table="preview-clue">Preview for DM</button><button class="primary" type="button" data-table="send-clue">Send only to this phone</button></div>
        <div id="private-clue-preview" class="private-clue-preview" hidden></div>
        <h4>Sent clues</h4>${data.clues.filter(c => c.delivered).length ? data.clues.filter(c => c.delivered).slice().reverse().map(c => `<div class="table-tool-row"><strong>${esc(c.title)}</strong><small>${esc(people.find(p => p.id === c.to)?.name || c.to)} · ${c.saved ? 'saved to journal' : 'delivered'}</small><button type="button" data-table="revoke-clue" data-id="${esc(c.id)}">Revoke</button></div>`).join('') : '<p class="help">No private clues sent yet.</p>'}
      </div></details>
      <details><summary>Shared party inventory</summary><div class="table-tool-body">
        <label>Item<input data-draft="item" maxlength="100" value="${esc(draft.item)}" placeholder="Healing potion"></label>
        <div class="table-tool-fields"><label>Quantity, optional<input data-draft="quantity" type="number" min="0" max="9999" value="${esc(draft.quantity)}"></label><label>Held by<select data-draft="holder"><option value="party">Party</option>${people.map(p => `<option value="${esc(p.id)}" ${p.id === draft.holder ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label></div>
        <label>Player-safe note<input data-draft="note" maxlength="280" value="${esc(draft.note)}"></label><button type="button" data-table="add-item">Add to inventory</button>
        ${data.inventory.length ? data.inventory.map(item => `<div class="table-tool-row"><strong>${esc(item.name)}${item.quantity === null ? '' : ` ×${item.quantity}`}</strong><small>${esc(item.holder === 'party' ? 'Party' : people.find(p => p.id === item.holder)?.name || item.holder)}${item.note ? ` · ${esc(item.note)}` : ''}${item.visible ? '' : ' · DM only'}</small><div class="button-row"><button type="button" data-table="minus-item" data-id="${esc(item.id)}">−</button><button type="button" data-table="plus-item" data-id="${esc(item.id)}">+</button><button type="button" data-table="transfer-item" data-id="${esc(item.id)}">Pass on</button><button type="button" data-table="toggle-item" data-id="${esc(item.id)}">${item.visible ? 'Hide' : 'Show'}</button><button type="button" data-table="remove-item" data-id="${esc(item.id)}">Remove</button></div></div>`).join('') : '<p class="help">No shared items yet. Character equipment stays on each sheet.</p>'}
      </div></details>
      <details><summary>Table rehearsal</summary><div class="table-tool-body"><p class="help">Shows a sample turn and roll on the TV and phones, and plays a short sound. It does not change HP, fog, resources, or the campaign save.</p>
        <button type="button" data-table="toggle-rehearsal">${rehearsal ? 'End rehearsal and restore live display' : 'Start sample turn'}</button>
        <strong>${rehearsal ? `Practice: ${esc(people[0]?.name || 'hero')} is up · sample d20 roll 14. The TV and phones are showing a practice banner.` : 'Live session display is active.'}</strong></div></details>
      <details><summary>Living scene</summary><div class="table-tool-body"><p class="help">Time advances with the exploration clock. Rain starts the rain ambience; other weather leaves your chosen audio alone.</p>
        <div class="table-tool-fields"><label>Time<input id="table-scene-time" type="time" value="${String(Math.floor(host.mood().minutes/60)).padStart(2,'0')}:${String(host.mood().minutes%60).padStart(2,'0')}"></label><label>Weather<select id="table-scene-weather">${weatherChoices.map(w => `<option value="${w}" ${w === host.mood().weather ? 'selected' : ''}>${w}</option>`).join('')}</select></label></div>
        <button type="button" data-table="apply-mood">Show on TV and phones</button></div></details>
      <details><summary>TV combat effects</summary><div class="table-tool-body"><div class="button-row">${['hit','miss','spell','condition'].map(kind => `<button type="button" data-table="effect" data-kind="${kind}">${kind}</button>`).join('')}</div>
        <button type="button" data-table="effects-settings">Effects: ${esc(data.atmosphere?.mode || 'subtle')} · open controls</button></div></details>
      <details><summary>Campaign custody and obligations</summary><div class="table-tool-body"><p class="help">Approved campaign events. Update the source event in Story → Campaign continuity to change these records.</p>
        ${(host.continuityTracks?.() || []).map(t=>`<div class="table-tool-row"><strong>${esc(t.kind)} · ${esc(t.subject)} · ${esc(t.state)}</strong><small>${esc(t.holder)}${t.owedTo?` · Owed to ${esc(t.owedTo)}`:''} · ${esc(t.note)}</small></div>`).join('')}
      </div></details>`;
    [...root.querySelectorAll('details')].forEach((node, index) => { node.open = opened.includes(index); });
  }
  function previewClue() {
    const preview = $('private-clue-preview'); if (!preview) return;
    preview.hidden = false;
    preview.replaceChildren();
    const heading = document.createElement('strong'); heading.textContent = draft.title || 'Untitled clue'; preview.append(heading);
    const text = document.createElement('p'); text.textContent = draft.text || 'No text'; preview.append(text);
    if (safeImage(draft.image)) { const img = document.createElement('img'); img.src = draft.image; img.alt = draft.title; preview.append(img); }
  }
  function stageClue(value) {
    if(!roster().some(p=>p.id===value.to))throw Error('That character is not in the current party. Choose the correct campaign before staging the letter.');
    if((draft.title.trim()||draft.text.trim())&&!window.confirm('Replace the unsent private-clue draft with this letter?'))return;
    Object.assign(draft,{to:value.to,title:clean(value.title,120),text:clean(value.text,2500),image:''});
    render();const section=$('table-tools')?.querySelector('details');if(section)section.open=true;previewClue();
    host.toast('Letter staged for its owner. Check the contact conditions and text, then choose Send only to this phone.');
  }
  function sendClue() {
    if (!roster().some(p => p.id === draft.to) || !draft.title.trim() || !draft.text.trim()) return host.toast('Choose a character and add a title and clue text.');
    const data = extras();
    data.clues.push({ id:id('clue'), to:draft.to, title:draft.title.trim(), text:draft.text.trim(), image:safeImage(draft.image), delivered:true, saved:false, at:new Date().toISOString() });
    data.clues = data.clues.slice(-150); draft.title = ''; draft.text = ''; draft.image = '';
    store('Sent a private clue'); host.toast('Private clue sent to that character only.');
  }
  function addItem() {
    if (!draft.item.trim()) return host.toast('Name the item first.');
    const data = extras();
    data.inventory.push({ id:id('item'), name:draft.item.trim(), quantity:draft.quantity === '' ? null : Math.max(0, Math.min(9999, Number(draft.quantity) || 0)),
      holder:draft.holder, note:draft.note.trim(), visible:true });
    data.inventory = data.inventory.slice(-150); draft.item = ''; draft.quantity = ''; draft.note = '';
    store('Added party inventory');
  }
  function onClick(event) {
    const button = event.target.closest('[data-table]'); if (!button) return;
    const action = button.dataset.table;
    if (action === 'preview-clue') return previewClue();
    if (action === 'send-clue') return sendClue();
    if (action === 'add-item') return addItem();
    if (action === 'revoke-clue') { const clue = extras().clues.find(c => c.id === button.dataset.id); if (clue) { clue.delivered = false; store('Revoked private clue'); } return; }
    if (action === 'toggle-rehearsal') { rehearsal = !rehearsal; host.refreshLive(); if (rehearsal) void host.playSfx('recorded-coins'); render(); return; }
    if (action === 'apply-mood') {
      const time = $('table-scene-time')?.value || '09:00'; const [hour, minute] = time.split(':').map(Number);
      const mood = host.mood(); mood.minutes = Number.isFinite(hour) && Number.isFinite(minute) ? ((hour*60+minute)%1440) : 540;
      mood.weather = weatherChoices.includes($('table-scene-weather')?.value) ? $('table-scene-weather').value : 'clear';
      host.weather?.(mood.weather);
      host.commit('Updated scene time and weather');
      if (mood.weather === 'rain') void host.playAmbience('recorded-rain');
      render(); return;
    }
    if(action==='effects-settings')return globalThis.ECHO_ATMOSPHERE_UI?.open();
    if (action === 'effect') return triggerEffect(button.dataset.kind);
    if (action === 'toggle-item' || action === 'remove-item' || action === 'plus-item' || action === 'minus-item' || action === 'transfer-item') {
      const data = extras(), item = data.inventory.find(i => i.id === button.dataset.id); if (!item) return;
      if (action === 'toggle-item') item.visible = !item.visible;
      else if (action === 'remove-item') data.inventory = data.inventory.filter(i => i.id !== item.id);
      else if (action === 'plus-item') item.quantity = Math.min(9999, (item.quantity ?? 0) + 1);
      else if (action === 'minus-item') item.quantity = Math.max(0, (item.quantity ?? 0) - 1);
      else { const holders = ['party',...roster().map(p => p.id)]; item.holder = holders[(holders.indexOf(item.holder)+1) % holders.length]; }
      store('Updated party inventory');
    }
  }
  function onChange(event) {
    const key = event.target.dataset.draft;
    if (key && Object.hasOwn(draft, key)) draft[key] = clean(event.target.value, key === 'text' ? 2500 : 280);
    if (event.target.id === 'table-reduced-effects') { extras().reducedEffects = event.target.checked; store('Changed TV effects setting'); }
  }
  function init(context) { host = context; const root = $('table-tools'); if (root) { root.addEventListener('input', onChange); root.addEventListener('change', onChange); root.addEventListener('click', onClick); } render(); }
  function triggerEffect(kind, targets=[]) {
    if(globalThis.ECHO_ATMOSPHERE_UI){if(!targets.length){globalThis.ECHO_ATMOSPHERE_UI.open('combat');return;}globalThis.ECHO_ATMOSPHERE_UI.play(kind,targets);return;}

    if (!host || !['hit','miss','spell','condition'].includes(kind)) return;
    clearTimeout(effectTimer); effect = { kind, at: Date.now() };
    host.refreshLive();
    if (kind === 'hit') void host.playSfx('recorded-metal');
    if (kind === 'spell') void host.playSfx('recorded-spell');
    effectTimer = setTimeout(() => { effect = null; host.refreshLive(); }, 2200);
  }
  function advanceMinutes(amount) { if (!host) return; const mood = host.mood(); mood.minutes = (mood.minutes + Math.max(0, Math.round(Number(amount) || 0))) % 1440; render(); }
  function decoratePublic(payload, character) {
    if (!host) return payload;
    const mood = normalizeMood(host.mood());
    const result = { ...payload, sceneMood: { ...mood, phase: phaseFor(mood.minutes) },
      screenEffect: effect && !extras().reducedEffects && Date.now() - effect.at < 2200 ? effect : null,
      rehearsal };
    if (rehearsal && character) {
      result.turn = { round: 1, activeId: character.id, order: [{ id: character.id, name: character.name, label: character.label || character.name.slice(0,2), initiative: 12 }] };
      result.publicRoll = { label: 'Practice roll', notation: '1d20', parts: [14], total: 14 };
    }
    return result;
  }
  function phoneData() {
    const data = extras();
    return { privateClues: Object.fromEntries(roster().map(person => [person.id, data.clues.filter(c => c.delivered && c.to === person.id).map(c =>
      ({ id:c.id, title:c.title, text:c.text, image:c.image, saved:c.saved, at:c.at }))])),
      inventory: data.inventory.filter(i => i.visible).map(i => ({ id:i.id, name:i.name, quantity:i.quantity, holder:i.holder, note:i.note, equipped:i.equipped === true })) };
  }
  function saveClue(characterId, clueId) {
    const clue = extras().clues.find(c => c.id === clueId && c.to === characterId && c.delivered);
    if (!clue || clue.saved) return false;
    clue.saved = true; store('Saved private clue to player journal'); return true;
  }
  function renderPlayer(live) {
    const mood = $('player-scene-mood'), fx = $('player-screen-effect'), sample = $('player-rehearsal');
    if (!mood || !fx || !sample) return;
    const phase = phases.includes(live.sceneMood?.phase) ? live.sceneMood.phase : 'day';
    const weather = live.atmosphere?.weather || (weatherChoices.includes(live.sceneMood?.weather) ? live.sceneMood.weather : 'clear');
    mood.dataset.atmosphere = String(!!live.atmosphere);
    mood.className = `player-scene-mood mood-${phase} weather-${weather}`;
    mood.textContent = `${phase} · ${weather}`;
    mood.hidden = live.presentation?.mode === 'black';
    const kind = ['hit','miss','spell','condition'].includes(live.screenEffect?.kind) ? live.screenEffect.kind : '';
    fx.className = `player-screen-effect effect-${kind}`;
    fx.textContent = kind ? ({hit:'HIT',miss:'MISS',spell:'SPELL',condition:'CONDITION'}[kind]) : '';
    fx.hidden = !kind || live.presentation?.mode === 'black';
    sample.hidden = live.rehearsal !== true;
  }
  globalThis.ECHO_TABLE = { normalize, normalizeMood, phaseFor, init, render, stageClue, advanceMinutes, triggerEffect, decoratePublic, phoneData, saveClue, renderPlayer,
    isRehearsing: () => rehearsal, stopRehearsal: () => { rehearsal = false; host?.refreshLive?.(); render(); } };
})();

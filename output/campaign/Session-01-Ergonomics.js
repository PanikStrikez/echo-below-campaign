(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cut = (value, length = 500) => String(value ?? '').slice(0, length);
  const esc = value => cut(value, 5000).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const normCard = card => Object.fromEntries(['read', 'checks', 'tactics', 'treasure', 'outcomes', 'sourceBook', 'sourceNote'].map(key => [key, cut(card?.[key], key === 'sourceBook' ? 30 : 1600)]).concat([['sourcePage', Math.max(0, Math.min(999, Number(card?.sourcePage) || 0))]]));
  const normBranch = value => ({ status: ['ready', 'negotiating', 'retreated', 'returned', 'resolved'].includes(value?.status) ? value.status : 'ready',
    objective: cut(value?.objective, 300), captive: cut(value?.captive, 300), promise: cut(value?.promise, 500),
    nextMove: cut(value?.nextMove, 500) });
  function normalizeSession(raw = {}) {
    return { scratch: cut(raw?.scratch, 6000),
      quickNotes: Array.isArray(raw?.quickNotes) ? raw.quickNotes.slice(0, 100).map(note => ({ id: cut(note.id, 80), text: cut(note.text, 1000), when: cut(note.when, 80) })) : [],
      encounterCards: Object.fromEntries(Object.entries(raw?.encounterCards || {}).slice(0, 100).map(([key, card]) => [cut(key, 80), normCard(card)])),
      branches: Object.fromEntries(Object.entries(raw?.branches || {}).slice(0, 100).map(([key, value]) => [cut(key, 80), normBranch(value)])) };
  }
  function normalizeSettings(raw = {}) {
    return { mode: ['prep', 'run', 'review'].includes(raw?.mode) ? raw.mode : 'run', comfort: raw?.comfort !== false, reducedMotion: raw?.reducedMotion === true };
  }
  let host, tab = 'search', query = '', selectedResult = 0, results = [], generatedName = '', generatedPrompt = '', price = '', guideOpen = true;
  const namesA = ['Alden', 'Bryn', 'Calia', 'Dara', 'Edrin', 'Fenna', 'Garrick', 'Ilyra', 'Joren', 'Kael', 'Lysa', 'Merrin', 'Nessa', 'Orik', 'Pella', 'Riven', 'Sera', 'Tamsin', 'Varek', 'Wren'];
  const namesB = ['Ashford', 'Bellweather', 'Corven', 'Dusk', 'Emberfall', 'Fenn', 'Greywake', 'Holloway', 'Ironbriar', 'Lark', 'Moss', 'North', 'Reed', 'Stonebridge', 'Vale', 'Windmere'];
  const prompts = ['A messenger insists the package must stay closed until dawn.', 'A familiar face denies being at a place the party just visited.', 'A shopkeeper recognizes the mark on an ordinary object.', 'Two witnesses agree on what happened but disagree on who was there.', 'A nervous guard asks the party to leave before someone notices them.', 'The quietest person in the room knows a safer route.', 'A map shows a doorway that no longer exists.', 'Someone offers a useful clue in exchange for a small promise.', 'An old debt is called in at the worst possible moment.', 'A repeated sound stops when the characters listen for it.'];
  const choose = list => list[Math.floor(Math.random() * list.length)];
  const item = (kind, id, title, detail, payload = {}) => ({ kind, id: cut(id, 100), title: cut(title, 160), detail: cut(detail, 280), ...payload });
  function searchItems() {
    const state = host.state, story = host.story, ruleData = globalThis.ECHO_RULES_DATA, ruleIndex = globalThis.ECHO_RULES_INDEX;
    return [
      ...[['next-turn', 'Next turn', 'Advance initiative'], ['reveal', 'Reveal area', 'Reveal the next requested square or a hero’s visible area'],
        ['black', 'Black screen', 'Toggle the player TV blackout'], ['mute', 'Mute audio', 'Mute or resume all campaign audio'],
        ['undo', 'Undo', 'Undo the last session action'], ['run', 'Run layout', 'Show the live DM workspace'],
        ['prep', 'Prepare layout', 'Edit session content'], ['review', 'Review layout', 'See the session summary']]
        .map(([id, title, detail]) => item('Command', id, title, detail)),
      ...(ruleData?.references || []).map(r => item('Rule', r.id, r.title, `${r.summary || ''} ${r.source || ''}`, { book: r.book, page: r.pdfPage || r.printedPage })),
      ...(ruleIndex?.catalog || []).map(r => item('Rule', r.id, r.title, `${r.category || ''} ${r.source || ''}`, { book: r.book, page: r.pdfPage || r.printedPage })),
      ...(host.rules?.rulings || []).map(r => item('Rule', r.id, r.name, `${r.text || ''} ${r.source || ''}`)),
      ...Object.entries(state.party || {}).map(([id, p]) => item('Character', id, p.name || id, `${p.className || p.class || ''} ${p.notes || ''}`)),
      ...Object.entries({ ...(globalThis.ECHO_COMBAT_DATA?.CREATURES || {}), ...(state.combat?.creatures || {}) }).map(([id, c]) => item('Monster', id, c.name || id, c.source || 'Custom creature')),
      ...(story?.npcs || []).map(n => item('NPC', n.id, n.name, `${n.base || ''} ${n.goal || ''} ${n.lastInteraction || ''} ${n.notes || ''} ${n.source || ''}`)),
      ...(host.scenes || []).map(s => item('Scene', s.id, s.title, s.kind || '')),
      ...(host.encounters || []).map(e => item('Encounter', e.id, e.name, e.note || '')),
      ...(host.library?.handouts || []).map(h => item('Handout', h.id, h.title, h.text || '')),
      ...(story?.evidence || []).map(e=>item('Clue',e.id,e.title,e.detail||'')),
      ...(host.beats || []).map(b=>item('Beat',b.id,b.title,(b.run||[]).join(' '),{scene:b.scene})),
      ...(story?.journal || []).map(j => item(j.kind==='Location'?'Location':'Journal', j.id, j.title, j.kind || ''))
    ];
  }
  function score(entry, words) {
    const title = entry.title.toLowerCase(), detail = entry.detail.toLowerCase(), kind = entry.kind.toLowerCase();
    if (!words.every(word => title.includes(word) || detail.includes(word) || kind.includes(word))) return -1;
    return words.reduce((total, word) => total + (title === word ? 12 : title.startsWith(word) ? 8 : title.includes(word) ? 5 : kind.includes(word) ? 3 : 1), 0);
  }
  function find(queryText) {
    const words = cut(queryText, 120).toLowerCase().trim().split(/\s+/).filter(Boolean);
    const activeTypes=new Set((host.state.tokens||[]).filter(t=>t.placed&&t.scene===host.state.scene).map(t=>t.type));
    const context=entry=>entry.kind==='Character'?25:entry.kind==='Scene'&&entry.id===host.state.scene?35:entry.kind==='Beat'&&(entry.id===host.state.runbook||entry.scene===host.state.scene)?30:entry.kind==='Encounter'&&entry.id===host.selectedEncounter?30:entry.kind==='Monster'&&activeTypes.has(entry.id)?20:0;
    return searchItems().map(entry => {const rank=words.length?score(entry,words):null;return {entry,rank:rank===null?context(entry)||-1:rank<0?-1:rank*10+context(entry)};}).filter(x => x.rank >= 0).sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title)).slice(0, 30).map(x => x.entry);
  }
  function jump(entry) {
    if (!entry) return;
    close();
    if (entry.kind === 'Command') {
      ({ 'next-turn': host.nextTurn, reveal: host.reveal, black: host.toggleBlack, mute: host.mute,
        undo: host.undo, run: () => host.setMode('run'), prep: () => host.setMode('prep'), review: () => host.setMode('review') })[entry.id]?.();
    }
    else if (entry.kind === 'Rule') host.openRules(entry.title);
    else if (entry.kind === 'Character') host.openParty(entry.id);
    else if (entry.kind === 'Monster') host.openCreature(entry.id);
    else if (entry.kind === 'NPC') host.openStory('people');
    else if (entry.kind === 'Scene') host.changeScene(entry.id);
    else if (entry.kind === 'Encounter') { host.selectEncounter(entry.id); open('encounter'); }
    else if (entry.kind === 'Handout') host.openHandout(entry.id);
    else if (entry.kind === 'Journal'||entry.kind==='Location') host.openStory('journal');
    else if(entry.kind==='Clue')host.openStory('evidence');
    else if(entry.kind==='Beat')host.selectBeat(entry.id);
  }
  function open(next = 'search') { tab = next; $('ergonomics-drawer').hidden = false; $('ergonomics-scrim').hidden = false; renderDrawer(); if (tab === 'search') $('ergo-search')?.focus(); }
  function close() { $('ergonomics-drawer').hidden = true; $('ergonomics-scrim').hidden = true; }
  function selectedBeat() {
    const beats = host.beats || [], current = host.state.runbook;
    const nextId = host.story.sessionPlans?.[host.sessionId]?.nextBeat;
    return beats.find(b => b.id === current) || beats.find(b => b.id === nextId) || beats.find(b => b.encounter === host.selectedEncounter) || beats[0];
  }
  function selectedEncounter() {
    return host.encounters.find(e => e.id === host.selectedEncounter) || host.encounters[0];
  }
  function branchFor(id) { return host.state.ergonomics.branches[id] ||= normBranch({}); }
  function lightFor(sheet) {
    const gear = (sheet.equipment || []).filter(item => item.quantity > 0 && /torch|lantern|tinderbox/i.test(item.name)).map(item => `${item.name} ${item.quantity}`);
    if ((sheet.spells || []).some(spell => /dancing lights|light/i.test(spell.name) && spell.prepared === true)) gear.push('light spell');
    return gear.join(', ') || 'No light listed';
  }
  function resourceLine(sheet) {
    const useful = (sheet.resources || []).filter(item => item.name && Number(item.max) > 0 && !/secret/i.test(item.name)).slice(0, 3);
    return useful.map(item => `${item.name} ${item.current ?? '?'}/${item.max ?? '?'}`).join(' · ') || 'No limited pool';
  }
  function caveGuide() {
    return `<details class="cave-guide" ${guideOpen ? 'open' : ''}><summary>Cave routes, height, and flood direction</summary>
      <svg viewBox="0 0 460 230" role="img" aria-label="DM route guide: entrance to stream and bridge, west side path to Yeemik, east over the bridge to pools, south to Klarg; kennel chimney to Klarg">
        <defs><marker id="flood-arrow" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#79b8d3"/></marker></defs>
        <path class="route" d="M47 184 L136 150 L215 116 L324 93 L406 150"/><path class="route" d="M136 150 L110 49 L215 116"/>
        <path class="shortcut" d="M47 184 L326 190 L406 150"/><path class="flood" d="M320 121 Q260 165 136 171 Q92 184 47 195" marker-end="url(#flood-arrow)"/>
        <g><circle cx="47" cy="184" r="16"/><text x="47" y="189">1</text><circle cx="136" cy="150" r="16"/><text x="136" y="155">4</text><circle cx="215" cy="116" r="16"/><text x="215" y="121">5</text><circle cx="110" cy="49" r="16"/><text x="110" y="54">6</text><circle cx="324" cy="93" r="16"/><text x="324" y="98">7</text><circle cx="406" cy="150" r="16"/><text x="406" y="155">8</text><circle cx="326" cy="190" r="16"/><text x="326" y="195">3</text></g>
        <text class="label" x="8" y="222">Entrance</text><text class="label" x="67" y="22">Yeemik / Sildar</text><text class="label" x="172" y="84">Bridge +20 ft</text><text class="label" x="298" y="57">Pools / dams</text><text class="label" x="365" y="118">Klarg</text><text class="label" x="264" y="219">Kennel chimney</text>
      </svg><p>Blue arrow: water runs back toward the entrance. Dashed line: chimney shortcut from the kennel to Klarg, past the chained wolves. The west higher passage reaches Yeemik without crossing the stream under the bridge.</p></details>`;
  }
  function renderSupport() {
    const target = $('run-support'); if (!target) return;
    const state = host.state, encounter = selectedEncounter(), branch = encounter && branchFor(encounter.id);
    const party = Object.values(state.party || {}).filter(sheet => sheet.role === 'pc');
    const minutes = state.map?.clock?.minutes || 0;
    const timers = (state.map?.clock?.timers || []).filter(timer => timer.remaining > 0 || timer.remaining === 0).slice(0, 3);
    const inCave = ['cave-mouth', 'approach', 'interior', 'blind-art', 'kennel-art', 'passage-art', 'overpass-art', 'den-art', 'pools-art', 'klarg-art'].includes(state.scene);
    target.innerHTML = `<h2>Party at the table</h2><div class="live-party-grid">${party.map(sheet => {
      const actions = (sheet.attacks || []).slice(0, 2).map(action => `${action.name} ${action.attackBonus === null ? '' : `${action.attackBonus >= 0 ? '+' : ''}${action.attackBonus}`} ${action.damageDice || ''}`.trim()).join(' · ');
      const spells = (sheet.spells || []).filter(spell => spell.level > 0 && spell.prepared === true).map(spell => spell.name).slice(0, 4);
      const unknown = (sheet.spells || []).some(spell => spell.level > 0 && spell.prepared === null);
      return `<button type="button" class="live-party-card" data-ergo-party="${esc(sheet.id)}"><strong>${esc(sheet.name)}</strong><span>HP ${sheet.hp ?? '?'}/${sheet.maxHp ?? '?'}${sheet.tempHp ? ` +${sheet.tempHp} temp` : ''} · AC ${sheet.ac ?? '?'}</span><small>${esc(actions || 'Open actions')}</small><small>${esc(resourceLine(sheet))}</small><small>Light: ${esc(lightFor(sheet))}</small>${sheet.concentration ? `<small>Concentrating: ${esc(sheet.concentration)}</small>` : ''}${spells.length ? `<small>Prepared: ${esc(spells.join(', '))}</small>` : ''}${unknown ? '<small class="needs-confirmation">Prepared spells need confirmation</small>' : ''}</button>`;
    }).join('')}</div>
      <div class="live-time"><strong>Elapsed ${Math.floor(minutes / 60)}h ${minutes % 60}m${state.map?.clock?.combatSeconds ? ` ${state.map.clock.combatSeconds}s` : ''}</strong><button type="button" data-ergo-action="time-1">+1 min</button><button type="button" data-ergo-action="time-10">+10 min</button><button type="button" data-ergo-action="time-60">+1 hour</button><button type="button" data-ergo-action="time-trail">5-mile trail</button><button type="button" data-ergo-action="timer-light">Start 1-min light</button></div>
      ${timers.length ? `<p class="live-timers">${timers.map(timer => `${esc(timer.name)}: ${timer.remaining ? `${timer.remaining} min` : 'DUE'}`).join(' · ')}</p>` : ''}
      <div class="live-objective"><strong>${esc(encounter?.name || 'Current encounter')}</strong><span>${esc(branch?.objective || state.combat?.plans?.[encounter?.id]?.objective || 'Choose an encounter objective')}</span>${branch && branch.status !== 'ready' ? `<small>Path: ${esc(branch.status)}</small>` : ''}<button type="button" data-ergo-action="focus-encounter">Open plan</button></div>
      ${inCave ? caveGuide() : ''}`;
  }
  function renderFocus() {
    if(globalThis.ECHO_GUIDED?.enabled()){globalThis.ECHO_GUIDED.render();return;}
    const target = $('run-focus'); if (!target) return;
    const beat = selectedBeat(), encounter = selectedEncounter(), state = host.state;
    const activeId = state.turn?.order?.[state.turn?.index];
    const active = state.tokens.find(t => t.id === activeId);
    const next = host.beats[(host.beats || []).findIndex(b => b.id === beat?.id) + 1];
    target.innerHTML = `<div class="run-focus-top"><h2>Now / Next</h2><span class="status-pill">${esc(state.turn?.round ? `Round ${state.turn.round}` : 'Exploration')}</span></div>
      <strong>${esc(beat?.title || 'Choose a runbook beat')}</strong>${(beat?.read?.length?beat.read:[beat?.run?.[0] || 'Keep the next scene and player choice in view.']).map(line=>`<p>${esc(line)}</p>`).join('')}
      <div class="run-focus-status"><span>Scene: ${esc(host.scenes.find(s => s.id === state.scene)?.title || state.scene)}</span><span>${esc(active?.name ? `Turn: ${active.name}` : `Encounter: ${encounter?.name || 'None'}`)}</span><span id="focus-tv-status">TV: ${host.tvConnected ? 'connected' : 'closed'}</span></div>
      ${next ? `<small>Next beat: ${esc(next.title)}</small>` : ''}<div class="run-focus-actions">${beat?.read?.[0] ? '<button type="button" data-ergo-action="focus-show-text">Show text on TV</button>' : ''}<button type="button" data-ergo-action="focus-encounter">Encounter card</button><button type="button" data-ergo-action="focus-next">Next beat</button></div>`;
  }
  function renderReview() {
    const target = $('review-workspace'); if (!target || target.hidden) return;
    const state = host.state, wrap = host.story.wrapUps.find(w => w.sessionId === host.sessionId);
    const enemies = state.tokens.filter(t => t.team === 'enemy');
    const defeated = enemies.filter(t => t.hp === 0).length;
    target.innerHTML = `<div class="review-head"><div><small>SESSION REVIEW</small><h2>${esc(host.sessionName)}</h2><p>Capture what changed before starting the next session.</p></div><button type="button" data-ergo-action="review-wrap">Open end-of-session capture</button><button type="button" data-ergo-action="closing-inbox">Gather unresolved items</button></div>
      <div class="review-grid"><section><h3>At a glance</h3><p>Current scene: ${esc(host.scenes.find(s => s.id === state.scene)?.title || state.scene)}</p><p>${state.turn?.round ? `Combat round ${state.turn.round}` : 'Outside combat'} · ${defeated} of ${enemies.length} enemies at 0 HP</p><p>${state.rolls.length} recorded rolls · ${state.sessionLog.length} logged actions</p><button type="button" data-ergo-action="review-notes">Open notes</button></section>
      <section><h3>Party state</h3>${state.tokens.filter(t => t.team === 'pc' || t.team === 'ally').map(t => `<p>${esc(t.name)} · ${t.hp}/${t.maxHp} HP${t.tempHp ? ` + ${t.tempHp} temp` : ''}${t.conditions.length ? ` · ${esc(t.conditions.join(', '))}` : ''}</p>`).join('') || '<p>No party tokens recorded.</p>'}</section>
      <section><h3>Recent actions</h3>${state.sessionLog.slice(0, 12).map(x => `<p><small>${esc(x.time)}</small> ${esc(x.label)}</p>`).join('') || '<p>Nothing logged yet.</p>'}</section>
      <section><h3>Saved recap</h3><p>${esc(wrap?.recap || 'No recap saved yet. Use End-of-session capture to draft one.')}</p><button type="button" data-ergo-action="review-story">Open story timeline</button></section></div>`;
  }
  function renderSearch() {
    return `<label class="ergo-search-label">Search the campaign<input id="ergo-search" type="search" autocomplete="off" placeholder="Rule, character, monster, NPC, scene, handout…" value="${esc(query)}"></label>
      <p class="ergo-help">⌘K / Ctrl K opens search. Use ↑ ↓ and Enter to open a result.</p><div id="ergo-search-results" role="listbox" aria-label="Search results"></div>`;
  }
  function renderSearchResults() {
    const target = $('ergo-search-results'); if (!target) return;
    results = find(query); selectedResult = Math.min(selectedResult, Math.max(0, results.length - 1));
    target.innerHTML = results.length ? results.map((r, i) => `<button type="button" role="option" aria-selected="${i === selectedResult}" data-ergo-result="${i}"><span class="ergo-result-kind">${esc(r.kind)}</span><strong>${esc(r.title)}</strong><small>${esc(r.detail)}</small></button>`).join('') : `<p>${query.trim() ? 'No matches. Try a shorter name or category.' : 'Current scene and party appear first. Type to search everything.'}</p>`;
  }
  function cardFor(encounterId) { return host.state.ergonomics.encounterCards[encounterId] ||= normCard({}); }
  function linkedBeat(encounterId) { return host.beats.find(b => b.encounter === encounterId); }
  function renderEncounter() {
    const encounter = selectedEncounter(); if (!encounter) return '<p>No encounter is selected. Add one in Prepare.</p>';
    const plan = host.state.combat?.plans?.[encounter.id] || {}, card = cardFor(encounter.id), beat = linkedBeat(encounter.id), branch = branchFor(encounter.id);
    const read = card.read || (beat?.read || []).join('\n\n');
    const tactics = card.tactics || [plan.starting, plan.reinforcements, plan.morale].filter(Boolean).join('\n');
    const outcomes = card.outcomes || [plan.nonCombat, plan.negotiation, plan.retreat].filter(Boolean).join('\n');
    const creatures = [...new Set(host.state.tokens.filter(t => t.encounter === encounter.id).map(t => t.type))]
      .map(type => ({ id: type, ...(globalThis.ECHO_COMBAT_DATA?.CREATURES?.[type] || host.state.combat?.creatures?.[type] || {}) })).filter(c => c.name);
    const allies = host.state.tokens.filter(t => t.team === 'ally').map(t => `${t.name} ${t.hp}/${t.maxHp || '?'} HP`).join(' · ');
    return `<div class="ergo-encounter-head"><h3>One-screen encounter card</h3><select id="ergo-encounter-select">${host.encounters.map(e => `<option value="${esc(e.id)}" ${e.id === encounter.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></div>
      <p class="ergo-help">${esc(encounter.note || plan.objective || '')}</p>
      <section class="ergo-branch"><h4>Objective and outcome · ${esc(branch.status)}</h4><p class="ergo-help">Choose what happened. Pausing and returning keep token positions, HP, and notes in this session.</p>
      <div class="ergo-branch-actions">${[['negotiating','Negotiating'],['retreated','Retreat'],['returned','Return'],['resolved','Resolved']].map(([value,label]) => `<button type="button" data-ergo-branch="${value}" ${branch.status === value ? 'aria-pressed="true"' : ''}>${label}</button>`).join('')}</div>
      <label>Goal<input data-ergo-branch-field="objective" value="${esc(branch.objective || plan.objective || '')}"></label>
      <label>Captive or rescue condition<input data-ergo-branch-field="captive" value="${esc(branch.captive)}" placeholder="Sildar captive at 1 HP"></label>
      <label>Promise made<input data-ergo-branch-field="promise" value="${esc(branch.promise)}" placeholder="Who promised what?"></label>
      <label>Next move after retreat or negotiation<input data-ergo-branch-field="nextMove" value="${esc(branch.nextMove)}" placeholder="Return with help, follow another route…"></label>
      <small>Allies: ${esc(allies || 'None on the roster')}</small></section>
      <div class="ergo-card-grid"><label>Say aloud<textarea data-ergo-card="read">${esc(read)}</textarea><button type="button" data-ergo-action="encounter-show-text">Show text on TV</button></label><label>Terrain<textarea data-ergo-plan="terrain">${esc(plan.terrain || '')}</textarea></label>
      <label>Enemy tactics and reinforcements<textarea data-ergo-card="tactics">${esc(tactics)}</textarea></label><label>Checks and DCs<textarea data-ergo-card="checks">${esc(card.checks)}</textarea></label>
      <label>Treasure and clues<textarea data-ergo-card="treasure">${esc(card.treasure || plan.wrap?.loot || '')}</textarea></label><label>Likely outcomes / alternatives<textarea data-ergo-card="outcomes">${esc(outcomes)}</textarea></label></div>
      <div class="ergo-source"><h4>Sources</h4><label>Book<select data-ergo-card="sourceBook">${['', 'lmop', 'echo', 'dmg', 'phb', 'srd'].map(book => `<option value="${book}" ${card.sourceBook === book ? 'selected' : ''}>${book || 'Choose book'}</option>`).join('')}</select></label><label>Page<input data-ergo-card="sourcePage" type="number" min="1" max="999" value="${card.sourcePage || ''}"></label>
      <label>Source note<input data-ergo-card="sourceNote" value="${esc(card.sourceNote)}"></label><button type="button" data-ergo-action="open-encounter-source" ${!card.sourceBook || !card.sourcePage ? 'disabled' : ''}>Open source page</button>
      ${creatures.map(c => `<button type="button" data-ergo-creature="${esc(c.id)}">${esc(c.name)} · ${esc(c.source || 'DM entry')}</button>`).join('')}</div>
      <div class="ergo-encounter-actions"><button type="button" data-ergo-action="select-encounter-beat" ${beat ? '' : 'disabled'}>Open runbook beat</button><button type="button" data-ergo-action="open-combat">Combat tools</button><button type="button" data-ergo-action="combat-wrap">After combat review</button></div>`;
  }
  function renderNotes() {
    return `<h3>Quick notes</h3><label>Scratchpad<textarea id="ergo-scratch" rows="6" placeholder="Keep the detail here, then save it as a note or campaign entry.">${esc(host.state.ergonomics.scratch)}</textarea></label>
      <div class="ergo-note-actions"><button type="button" data-ergo-action="save-note">Save note</button><button type="button" data-ergo-action="promote-journal">Make permanent journal entry</button><button type="button" data-ergo-action="promote-beat">Make runbook beat</button><button type="button" data-ergo-action="promote-record">Make NPC, clue or location</button></div>
      <div class="ergo-saved-notes">${host.state.ergonomics.quickNotes.map(note => `<article><small>${esc(note.when)}</small><p>${esc(note.text)}</p><button type="button" data-ergo-note="${esc(note.id)}">Use in scratchpad</button></article>`).join('')}</div>
      <h3>Improv</h3><div class="ergo-improv"><button type="button" data-ergo-action="name">Generate name</button><output>${esc(generatedName)}</output><button type="button" data-ergo-action="prompt">Generate prompt</button><output>${esc(generatedPrompt)}</output></div>
      <h3>Shop price calculator</h3><p class="ergo-help">Enter a known base price from your book or notes. This calculator converts a markup; it does not set item prices.</p>
      <div class="ergo-price"><label>Base price<input id="ergo-price-base" type="number" min="0" step="0.01" value="1"></label><label>Coin<select id="ergo-price-coin"><option value="gp">gp</option><option value="sp">sp</option><option value="cp">cp</option></select></label><label>Markup %<input id="ergo-price-markup" type="number" min="-100" max="1000" value="0"></label><button type="button" data-ergo-action="price">Calculate</button><output>${esc(price)}</output></div>`;
  }
  function renderShortcuts() {
    return `<h3>At the table</h3><div class="ergo-shortcuts">${[
      ['⌘K / Ctrl K', 'Search anything'], ['N', 'Next turn'], ['R', 'Reveal the next requested square or area around a placed hero'], ['B', 'Toggle TV black screen'], ['M', 'Mute or resume audio'], ['[ / ]', 'Previous / next scene'], ['⌘Z / Ctrl Z', 'Undo last change'], ['⌘⇧Z / Ctrl Shift Z', 'Redo last undone change'], ['?', 'Open this shortcut sheet']
    ].map(([key, text]) => `<div><kbd>${esc(key)}</kbd><span>${esc(text)}</span></div>`).join('')}</div>
    <p class="ergo-help">Shortcuts pause while you type in a field. Reveal uses the first pending request, or the first placed hero’s visible area if there is no request.</p>
    <h3>Display comfort</h3><label class="ergo-check"><input id="ergo-comfort" type="checkbox" ${host.settings.comfort ? 'checked' : ''}> Larger buttons and clearer status</label>
    <label class="ergo-check"><input id="ergo-reduce-motion" type="checkbox" ${host.settings.reducedMotion ? 'checked' : ''}> Reduce animation on both screens</label>
    <p class="ergo-help">The player screen follows the reduce motion setting the next time it synchronizes.</p>`;
  }
  function renderDrawer() {
    if (!host || $('ergonomics-drawer').hidden) return;
    for (const button of $('ergonomics-tabs').querySelectorAll('button')) button.classList.toggle('active', button.dataset.ergoTab === tab);
    $('ergonomics-content').innerHTML = ({ search: renderSearch, encounter: renderEncounter, notes: renderNotes, shortcuts: renderShortcuts })[tab]();
    if (tab === 'search') renderSearchResults();
  }
  function applyPrefs() {
    $('dm-app')?.classList.toggle('comfort-mode', host.settings.comfort);
    $('dm-app')?.classList.toggle('reduce-motion', host.settings.reducedMotion);
  }
  function render() { if (!host) return; applyPrefs(); renderFocus(); renderSupport(); renderReview(); renderDrawer(); }
  function refreshConnection() { const target = $('focus-tv-status'); if (target && host) target.textContent = `TV: ${host.tvConnected ? 'connected' : 'closed'}`; }
  function saveScratch() { const input = $('ergo-scratch'); if (!input) return; host.state.ergonomics.scratch = cut(input.value, 6000); void host.saveSession(); }
  function noteToStory(kind) {
    const text = (host.state.ergonomics.scratch || '').trim(); if (!text) return host.toast('Write a note first.');
    const title = text.split(/[.!?\n]/)[0].slice(0, 100) || 'Table note';
    if (kind === 'journal') {
      host.story.journal.unshift({ id: uid('journal'), title, text: text.slice(0, 2500), kind: 'DM note', when: host.sessionName, source: 'Quick note', published: false });
      void host.saveSettings(); host.toast('Saved as an unpublished campaign journal entry.');
    } else {
      const plan = host.story.sessionPlans[host.sessionId] ||= { nextBeat: '', music: '', handout: '', likelyRules: '', elsePlan: '', opening: '', notes: '', order: [], extraBeats: [], beats: {} };
      plan.extraBeats ||= [];
      plan.extraBeats.push({ id: uid('beat'), title, scene: host.state.scene, encounter: '', read: [], run: [text.slice(0, 1200)], private: [] });
      void host.saveSettings(); host.toast('Saved as a campaign runbook beat.');
    }
    host.state.ergonomics.scratch = ''; host.commit('Promoted quick note to campaign');
    renderDrawer();
  }
  function action(name) {
    const state = host.state, encounter = selectedEncounter();
    if (name === 'focus-encounter') open('encounter');
    else if (name === 'focus-show-text') { const beat = selectedBeat(); if (beat?.read?.[0]) host.showText(beat.title, beat.read.join('\n\n')); }
    else if (name === 'encounter-show-text') { const read = $('ergonomics-content').querySelector('[data-ergo-card="read"]')?.value; host.showText(encounter?.name || 'Say aloud', read); }
    else if (name === 'focus-next') { const beats = host.beats, index = beats.findIndex(b => b.id === selectedBeat()?.id); if (beats[index + 1]) host.selectBeat(beats[index + 1].id); }
    else if(name==='closing-inbox')globalThis.ECHO_DM_DESK_UI?.open('closing');
    else if (name === 'review-wrap') host.openStory('wrap');
    else if (name === 'review-story') host.openStory('runbook');
    else if (name === 'review-notes') open('notes');
    else if (name === 'open-combat') $('quick-encounter').click();
    else if (name === 'combat-wrap') { close(); host.openCombat('wrap'); }
    else if (name === 'time-1') host.advanceTime(1, 'One minute');
    else if (name === 'time-10') host.advanceTime(10, 'Quick advance');
    else if (name === 'time-60') host.advanceTime(60, 'Short rest or exploration');
    else if (name === 'time-trail') host.advanceTime(100, 'Five-mile trail at normal pace');
    else if (name === 'timer-light') { state.map.clock.timers.push({ id: uid('timer'), name: 'Dancing Lights', remaining: 1, kind: 'spell' }); host.commit('Started Dancing Lights timer'); }
    else if (name === 'select-encounter-beat') { const beat = linkedBeat(encounter?.id); if (beat) { host.selectBeat(beat.id); close(); } }
    else if (name === 'open-encounter-source') { const card = cardFor(encounter?.id); if (card.sourceBook && card.sourcePage) host.openBook(card.sourceBook, card.sourcePage); }
    else if (name === 'save-note') { const text = (state.ergonomics.scratch || '').trim(); if (!text) return host.toast('Write a note first.'); state.ergonomics.quickNotes.unshift({ id: uid('note'), text: text.slice(0, 1000), when: new Date().toLocaleString() }); state.ergonomics.quickNotes = state.ergonomics.quickNotes.slice(0, 100); state.ergonomics.scratch = ''; host.commit('Saved quick note'); }
    else if (name === 'promote-journal') noteToStory('journal');
    else if(name==='promote-record'){close();globalThis.ECHO_DM_DESK_UI?.open('improv');}
    else if (name === 'promote-beat') noteToStory('beat');
    else if (name === 'name') { generatedName = `${choose(namesA)} ${choose(namesB)}`; renderDrawer(); }
    else if (name === 'prompt') { generatedPrompt = choose(prompts); renderDrawer(); }
    else if (name === 'price') { const base = Math.max(0, Number($('ergo-price-base').value) || 0), markup = Math.max(-100, Math.min(1000, Number($('ergo-price-markup').value) || 0)); price = `${(base * (1 + markup / 100)).toFixed(2)} ${$('ergo-price-coin').value}`; $('ergonomics-content').querySelector('.ergo-price output').textContent = price; }
  }
  function handleClick(event) {
    const button = event.target.closest('[data-ergo-action], [data-ergo-result], [data-ergo-creature], [data-ergo-note], [data-ergo-party], [data-ergo-branch]');
    if (!button) return;
    if (button.dataset.ergoAction) action(button.dataset.ergoAction);
    else if (button.dataset.ergoResult !== undefined) jump(results[Number(button.dataset.ergoResult)]);
    else if (button.dataset.ergoCreature) host.openCreature(button.dataset.ergoCreature);
    else if (button.dataset.ergoParty) host.openParty(button.dataset.ergoParty);
    else if (button.dataset.ergoBranch) {
      const encounter = selectedEncounter(); if (!encounter) return;
      branchFor(encounter.id).status = button.dataset.ergoBranch;
      host.commit(`${encounter.name}: ${button.dataset.ergoBranch}`);
    }
    else if (button.dataset.ergoNote) { const note = host.state.ergonomics.quickNotes.find(x => x.id === button.dataset.ergoNote); if (note) { host.state.ergonomics.scratch = note.text; host.commit('Copied note to scratchpad'); } }
  }
  function handleChange(event) {
    const el = event.target, encounter = selectedEncounter();
    if (el.id === 'ergo-scratch') { saveScratch(); return; }
    if (el.id === 'ergo-encounter-select') { host.selectEncounter(el.value); return; }
    if (el.dataset.ergoBranchField && encounter) { branchFor(encounter.id)[el.dataset.ergoBranchField] = cut(el.value, 500); host.commit(`Updated ${encounter.name} objective`); return; }
    if (el.dataset.ergoCard && encounter) { const card = cardFor(encounter.id); card[el.dataset.ergoCard] = el.dataset.ergoCard === 'sourcePage' ? Math.max(0, Math.min(999, Number(el.value) || 0)) : cut(el.value, 1600); void host.saveSession();
      const sourceButton = $('ergonomics-content').querySelector('[data-ergo-action="open-encounter-source"]'); if (sourceButton) sourceButton.disabled = !card.sourceBook || !card.sourcePage; return; }
    if (el.dataset.ergoPlan && encounter) { const plan = host.state.combat.plans[encounter.id]; if (plan) { plan[el.dataset.ergoPlan] = cut(el.value, 1600); void host.saveSession(); } return; }
    if (el.id === 'ergo-comfort' || el.id === 'ergo-reduce-motion') { host.settings[el.id === 'ergo-comfort' ? 'comfort' : 'reducedMotion'] = el.checked; void host.saveSettings(); applyPrefs(); host.syncPlayer(); return; }
  }
  function handleKey(event) {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === 'k') { event.preventDefault(); event.stopImmediatePropagation(); open('search'); return; }
    if (event.key === 'Escape' && !$('ergonomics-drawer').hidden) { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
    if (!$('ergonomics-drawer').hidden) return;
    if (event.target?.closest?.('input, textarea, select, [contenteditable=true]')) return;
    if (document.querySelector('.rules-drawer:not([hidden]), .party-drawer:not([hidden]), .combat-drawer:not([hidden]), .story-drawer:not([hidden]), .presentation-drawer:not([hidden]), .map-drawer:not([hidden])')) return;
    let run = null;
    if (key === '?' && !event.metaKey && !event.ctrlKey) run = () => open('shortcuts');
    else if (event.metaKey || event.ctrlKey) { if (key === 'z') run = event.shiftKey ? host.redo : host.undo; }
    else if (!event.altKey) {
      if (key === 'n') run = host.nextTurn;
      else if (key === 'r') run = host.reveal;
      else if (key === 'b') run = host.toggleBlack;
      else if (key === 'm') run = host.mute;
      else if (event.key === '[') run = () => host.nextScene(-1);
      else if (event.key === ']') run = () => host.nextScene(1);
    }
    if (run) { event.preventDefault(); event.stopImmediatePropagation(); run(); }
  }
  function init(context) {
    host = context;
    $('close-ergonomics').onclick = close; $('ergonomics-scrim').onclick = close;
    $('ergonomics-tabs').onclick = event => { const button = event.target.closest('[data-ergo-tab]'); if (button) { tab = button.dataset.ergoTab; renderDrawer(); if (tab === 'search') $('ergo-search')?.focus(); } };
    $('ergonomics-content').addEventListener('click', handleClick);
    $('ergonomics-content').addEventListener('change', handleChange);
    $('ergonomics-content').addEventListener('input', event => { if (event.target.id === 'ergo-search') { query = event.target.value; selectedResult = 0; renderSearchResults(); } else if (event.target.id === 'ergo-scratch') host.state.ergonomics.scratch = cut(event.target.value, 6000); });
    $('ergonomics-content').addEventListener('keydown', event => {
      if (event.target.id !== 'ergo-search') return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); selectedResult = Math.max(0, Math.min(results.length - 1, selectedResult + (event.key === 'ArrowDown' ? 1 : -1))); renderSearchResults(); }
      else if (event.key === 'Enter') { event.preventDefault(); jump(results[selectedResult]); }
    });
    $('run-focus').addEventListener('click', handleClick);
    $('run-support').addEventListener('click', handleClick);
    $('run-support').addEventListener('toggle', event => { if (event.target.classList?.contains('cave-guide')) guideOpen = event.target.open; }, true);
    $('review-workspace').addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey, true);
    applyPrefs();
  }
  globalThis.ECHO_ERGONOMICS = { normalizeSession, normalizeSettings, init, render, refreshConnection, open, close, find };
})();

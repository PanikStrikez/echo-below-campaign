/* The local campaign service is private to the DM. No data enters TV or phone state. */
(() => {
  'use strict';
  if (location.hash === '#player') return;
  const API = '/__echo_campaign';
  const KINDS = ['npc', 'quest', 'clue', 'location', 'item', 'relationship', 'choice', 'thread'];
  const NPCS = [['npc-durnan', 'Durnan'], ['npc-gundren', 'Gundren Rockseeker'], ['npc-selise', 'Selise Ardent'], ['npc-halaster', 'Halaster']];
  const VISIBILITY = [['dm', 'DM only'], ['player', 'Player known'], ['npc', 'Named NPCs only']];
  const EPISTEMIC = [['confirmed', 'Confirmed'], ['inferred', 'Inferred'], ['unresolved', 'Unresolved']];
  const TABS = [['state', 'Campaign state'], ['search', 'Campaign AI'], ['voice', 'NPC voices'], ['session', 'Session engine'], ['sources', 'Sources & setup']];
  let token = '', dialog, content, notice, statusLine, activeTab = 'state', returnFocus;
  let status = null, records = [], profiles = [], sessions = [], sources = [], activeKind = 'npc';
  let selectedRecord = null, draft = null, audio = null, audioURL = '', busy = false, tabEpoch = 0;
  let collectDraft = null, recordEdit = null, contextProvider = null, campaignId = 'echo-below', requestCampaignId = null, sourcePoll = null, controlNumber = 0;
  const clone = value => JSON.parse(JSON.stringify(value));
  const words = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const el = (tag, text, parent, className) => {
    const node = document.createElement(tag);
    if (text != null) node.textContent = String(text);
    if (className) node.className = className;
    parent?.append(node);
    return node;
  };
  function button(parent, text, action, className) {
    const node = el('button', text, parent, className);
    node.type = 'button';
    node.addEventListener('click', () => run(action, node));
    return node;
  }
  function field(parent, title, value = '', {rows = 0, type = 'text', help = ''} = {}) {
    const label = el('label', null, parent, 'ce-field');
    el('span', title, label);
    const input = el(rows ? 'textarea' : 'input', null, label);
    input.setAttribute('aria-label', title);
    if (rows) input.rows = rows; else input.type = type;
    input.value = value ?? '';
    if (help) { const description = el('small', help, label); description.id = 'ce-field-help-' + (++controlNumber); input.setAttribute('aria-describedby', description.id); }
    return input;
  }
  function select(parent, title, values, value) {
    const label = el('label', null, parent, 'ce-field');
    el('span', title, label);
    const input = el('select', null, label);
    input.setAttribute('aria-label', title);
    for (const [key, text] of values) { const option = el('option', text, input); option.value = key; }
    input.value = value ?? values[0]?.[0] ?? '';
    return input;
  }
  function check(parent, title, value = false) {
    const label = el('label', null, parent, 'ce-check');
    const input = el('input', null, label);
    input.type = 'checkbox'; input.checked = value;
    el('span', title, label);
    return input;
  }
  function section(parent, title, description) {
    const box = el('section', null, parent, 'ce-card');
    el('h3', title, box);
    if (description) el('p', description, box, 'ce-help');
    return box;
  }
  function details(parent, title, opened = false) {
    const box = el('details', null, parent, 'ce-detail');
    el('summary', title, box); box.open = opened; return box;
  }
  function announce(message, error = false) {
    if (!notice) return;
    notice.textContent = message;
    notice.className = error ? 'ce-notice ce-error' : 'ce-notice';
    notice.hidden = !message;
  }
  async function run(action, control) {
    if (busy) return;
    busy = true;
    requestCampaignId = campaignId;
    if (control) control.disabled = true;
    dialog?.setAttribute('aria-busy', 'true');
    announce('');
    try { await action(); }
    catch (error) { announce(error.message || 'The campaign service could not complete that action.', true); }
    finally {
      busy = false;
      requestCampaignId = null;
      dialog?.setAttribute('aria-busy', 'false');
      if (control?.isConnected) control.disabled = false;
    }
  }
  async function api(path, body, binary = false) {
    if (location.protocol === 'file:') throw Error('Open the campaign from the local campaign server to use these tools. Setup instructions are in CAMPAIGN-ENGINE-SETUP.md.');
    if (!token) {
      const response = await fetch(API + '/bootstrap', {credentials: 'same-origin', cache: 'no-store', headers: {'X-Echo-Campaign-Id': requestCampaignId || campaignId}});
      if (!response.ok) throw Error('The campaign service is unavailable. Start the updated local campaign server, then refresh this workspace.');
      const value = await response.json();
      if (!value.token) throw Error('The campaign service did not provide DM access. Use this computer’s local DM address.');
      token = value.token;
    }
    const response = await fetch(API + path, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: {'X-Echo-Campaign-Token': token, 'X-Echo-Campaign-Id': requestCampaignId || campaignId, ...(body === undefined ? {} : {'Content-Type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)})
    });
    if (!response.ok) {
      let value; try { value = await response.json(); } catch { value = {}; }
      if (response.status === 401 || response.status === 403) token = '';
      const error = value.error?.message || value.error || value.message || `The service returned ${response.status}.`;
      throw Error(typeof error === 'string' ? error : JSON.stringify(error));
    }
    return binary ? response.blob() : response.json();
  }
  function stopAudio() {
    audio?.pause(); audio = null;
    if (audioURL) URL.revokeObjectURL(audioURL);
    audioURL = '';
  }
  async function refreshStatus() {
    status = await api('/status');
    sources = Array.isArray(status.sources) ? status.sources : (status.sources?.items || []);
    const count = Object.values(status.counts || {}).reduce((sum, item) => sum + (typeof item === 'number' ? item : 0), 0);
    statusLine.textContent = `Local campaign · revision ${status.revision ?? 0}${count ? ' · ' + count + ' records' : ''} · DM workspace`;
  }
  function preserveDraft() { if (collectDraft) { draft = collectDraft(); collectDraft = null; } }
  async function switchTab(id) {
    preserveDraft(); stopAudio(); clearTimeout(sourcePoll);
    activeTab = id; selectedRecord = null; recordEdit = null;
    const epoch = ++tabEpoch;
    for (const item of dialog.querySelectorAll('[data-ce-tab]')) {
      const active = item.dataset.ceTab === id;
      item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
    }
    content.replaceChildren();
    content.setAttribute('aria-labelledby', 'ce-tab-' + id);
    el('p', 'Loading campaign workspace…', content, 'ce-help');
    try {
      if (!status) await refreshStatus();
      if (id === 'state') {
        const value = await api('/records/query', {audience: 'dm', kind: activeKind});
        records = value.records || [];
      }
      if (id === 'voice') { const value = await api('/voice/profiles'); profiles = value.profiles || []; }
      if (id === 'session') { const value = await api('/sessions'); sessions = value.sessions || []; }
      if (epoch !== tabEpoch || !dialog.open) return;
      content.replaceChildren();
      ({state: renderState, search: renderSearch, voice: renderVoice, session: renderSession, sources: renderSources})[id]();
    } catch (error) {
      content.replaceChildren();
      const box = section(content, 'Connect the local campaign service', error.message);
      el('p', 'Your current table remains available. Launch the updated local server, then try again.', box);
      const link = el('a', 'Open setup instructions', box); link.href = 'CAMPAIGN-ENGINE-SETUP.md'; link.target = '_blank'; link.rel = 'noopener';
      button(box, 'Retry connection', async () => { token = ''; status = null; await switchTab(id); });
    }
  }
  function provenance(parent, items) {
    if (!items?.length) { el('p', 'No supporting citation supplied.', parent, 'ce-help'); return; }
    for (const item of items) {
      const text = typeof item === 'string' ? item : [item.filename || item.title || item.source_id || item.sourceId || item.id, item.page != null ? 'page ' + item.page : '', item.excerpt || item.note || ''].filter(Boolean).join(' · ');
      el('p', text, parent, 'ce-citation');
    }
  }
  function readJSON(input, label, array = false) {
    let value;
    try { value = JSON.parse(input.value || (array ? '[]' : '{}')); }
    catch { throw Error(label + ' must be valid JSON.'); }
    if (array ? !Array.isArray(value) : !value || typeof value !== 'object' || Array.isArray(value)) throw Error(label + (array ? ' must be an array.' : ' must be an object.'));
    return value;
  }
  function npcChoices(parent, title, values) {
    const group = el('fieldset', null, parent, 'ce-npc-choices');
    el('legend', title, group);
    const extra = (values || []).filter(id => !NPCS.some(([key]) => id === key));
    const checks = [...NPCS, ...extra.map(id => [id, id])].map(([id, name]) => [id, check(group, name, (values || []).includes(id))]);
    return () => checks.filter(([, input]) => input.checked).map(([id]) => id);
  }
  function recordForm(parent, raw, prefix) {
    const record = clone(raw);
    const grid = el('div', null, parent, 'ce-form-grid');
    const name = field(grid, 'Name / title', record.name); name.required = true;
    const kind = select(grid, 'Record type', KINDS.map(value => [value, value]), record.kind || 'thread');
    const id = field(grid, 'Stable record ID', record.id || `${record.kind || 'thread'}-${crypto.randomUUID()}`); id.required = true; id.readOnly = !!record.id;
    if (!record.id) id.placeholder = 'e.g. clue-forge-resonance';
    const state = field(grid, 'State / status', record.status || 'active');
    const visibility = select(grid, 'Record audience', VISIBILITY, record.visibility || 'dm');
    const epistemic = select(grid, 'Knowledge status', EPISTEMIC, record.epistemic || 'unresolved');
    const npcs = npcChoices(parent, 'NPCs who know this record', record.npc_ids);
    const safeRecord = check(parent, 'This record’s identity is safe for the named NPCs to disclose', !!record.player_safe);
    el('p', 'Record audience covers its name and structured details. Each fact also has its own audience. Player-safe speech is an additional, explicit approval for facts an NPC may say aloud.', parent, 'ce-help');
    const facts = el('div', null, parent, 'ce-facts');
    el('h4', 'Facts & knowledge boundaries', facts);
    const factReaders = [];
    let factCounter = 0;
    function addFact(value = {}) {
      const index = ++factCounter;
      const box = details(facts, 'Fact ' + index, true);
      const text = field(box, 'Fact text ' + index, value.text || '', {rows: 3});
      const options = el('div', null, box, 'ce-form-grid');
      const audience = select(options, 'Fact audience ' + index, VISIBILITY, value.visibility || 'dm');
      const basis = select(options, 'Fact knowledge status ' + index, EPISTEMIC, value.epistemic || 'unresolved');
      const knows = npcChoices(box, 'NPCs who know fact ' + index, value.npc_ids);
      const safe = check(box, 'This exact fact is safe for an NPC to speak to players', !!value.player_safe);
      const evidence = details(box, 'Source details for fact ' + index);
      const cites = field(evidence, 'Fact provenance ' + index + ' (JSON)', JSON.stringify(value.provenance || [], null, 2), {rows: 3});
      let removed = false;
      button(box, 'Remove fact ' + index, () => { removed = true; box.remove(); });
      factReaders.push(() => removed ? null : ({...value, id: value.id || `${id.value || prefix}-fact-${index}`, text: text.value.trim(), visibility: audience.value, epistemic: basis.value, npc_ids: knows(), player_safe: safe.checked, provenance: readJSON(cites, 'Fact provenance ' + index, true)}));
    }
    for (const fact of record.facts || []) addFact(fact);
    button(facts, 'Add a fact', () => addFact());
    const proof = details(parent, 'Record provenance & structured fields', !record.id);
    el('p', 'Cite canonical material or the actual session source. Provenance uses source_id, filename, page, sha256, and optional excerpt. Relationships can use from_id / to_id in structured fields; other entity links use stable IDs.', proof, 'ce-help');
    const source = select(proof, 'Add canonical source citation', [['', 'Choose an indexed source'], ...sources.map(item => [item.id || item.source_id, item.filename || item.title || item.id || item.source_id])], '');
    const cites = field(proof, 'Record provenance (JSON)', JSON.stringify(record.provenance || [], null, 2), {rows: 5});
    source.addEventListener('change', () => {
      if (!source.value) return;
      try {
        const selected = sources.find(item => (item.id || item.source_id) === source.value);
        const values = readJSON(cites, 'Record provenance', true);
        values.push({source_id: selected.id || selected.source_id, filename: selected.filename || selected.title || '', sha256: selected.sha256 || ''});
        cites.value = JSON.stringify(values, null, 2); source.value = '';
      } catch (error) { announce(error.message, true); }
    });
    const data = field(proof, 'Structured fields (JSON)', JSON.stringify(record.data || {}, null, 2), {rows: 7});
    return () => {
      if (!name.value.trim() || !id.value.trim()) throw Error('Give this record a name and a stable ID.');
      return {...record, id: id.value.trim(), name: name.value.trim(), kind: kind.value, status: state.value.trim(), visibility: visibility.value, epistemic: epistemic.value, npc_ids: npcs(), player_safe: safeRecord.checked, data: readJSON(data, 'Structured fields'), provenance: readJSON(cites, 'Record provenance', true), facts: factReaders.map(read => read()).filter(Boolean)};
    };
  }
  function renderState() {
    const intro = section(content, 'Campaign state', 'Persistent records with separate audience, knowledge status, and provenance. Edits here are explicit DM changes.');
    if (contextProvider) button(intro, 'Review existing campaign import', async () => {
      const context = contextProvider();
      const value = await api('/import/preview', {campaignId: context.campaignId, sessionId: context.sessionId, story: context.story});
      draft = value.draft; collectDraft = null;
      if (!draft?.id) throw Error('The service returned no import review.');
      await switchTab('session'); announce('Existing campaign records are staged for review. Approve the records you want to import.');
      document.getElementById('ce-session-review')?.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
    const controls = el('div', null, intro, 'ce-form-grid');
    const kind = select(controls, 'Browse record type', KINDS.map(value => [value, value]), activeKind);
    const filter = field(controls, 'Find a record');
    kind.addEventListener('change', () => run(async () => { activeKind = kind.value; await switchTab('state'); }));
    const layout = el('div', null, content, 'ce-state-layout');
    const list = section(layout, 'Records');
    button(list, 'Create ' + activeKind, () => { selectedRecord = {kind: activeKind, visibility: 'dm', epistemic: 'unresolved', data: {}, facts: [], provenance: []}; renderEditor(); });
    const rows = el('div', null, list, 'ce-record-list');
    const editor = section(layout, 'Record editor');
    function renderRows() {
      rows.replaceChildren();
      const values = records.filter(record => `${record.id} ${record.name} ${record.status}`.toLowerCase().includes(filter.value.toLowerCase()));
      if (!values.length) el('p', 'No matching records. Create one or import a reviewed session.', rows, 'ce-help');
      for (const record of values) {
        const control = button(rows, record.name || record.id, () => { selectedRecord = clone(record); renderEditor(); }, 'ce-record-button');
        el('small', `${record.visibility} · ${record.epistemic} · ${record.status || 'active'}`, control);
      }
    }
    function renderEditor() {
      editor.replaceChildren();
      if (!selectedRecord) { el('p', 'Choose a record to inspect its facts, sources, and audience.', editor, 'ce-help'); return; }
      el('h3', selectedRecord.name || 'New ' + activeKind, editor);
      const form = el('form', null, editor);
      const revision = status.revision;
      recordEdit = recordForm(form, selectedRecord, 'new');
      const actions = el('div', null, form, 'ce-actions');
      const save = el('button', 'Save reviewed record', actions, 'ce-primary'); save.type = 'submit';
      form.addEventListener('submit', event => { event.preventDefault(); run(async () => {
        const record = recordEdit();
        await api('/records/upsert', {record, expectedRevision: revision});
        await refreshStatus();
        await switchTab('state'); announce('The reviewed record was saved with its provenance.');
      }, save); });
      if (selectedRecord.id && selectedRecord.status !== 'archived') button(actions, 'Archive record', async () => {
        const record = {...recordEdit(), status: 'archived'};
        await api('/records/upsert', {record, expectedRevision: revision});
        await refreshStatus(); await switchTab('state'); announce('Record archived. Its stable ID and history are retained.');
      });
    }
    filter.addEventListener('input', renderRows); renderRows(); renderEditor();
  }
  function renderSearch() {
    const box = section(content, 'Ask the campaign', 'Search canonical campaign materials and reviewed state. Audience filtering happens in the local service before any answer is assembled. Inferences and unanswered questions retain their labels.');
    const form = el('form', null, box);
    const row = el('div', null, form, 'ce-form-grid');
    const audience = select(row, 'Answer audience', [['dm', 'DM · full evidence'], ['player', 'Players · known information'], ['npc', 'NPC · personal knowledge']], 'dm');
    const npc = select(row, 'NPC knowledge preview', NPCS, NPCS[0][0]); npc.closest('label').hidden = true;
    const query = field(form, 'Campaign question', '', {rows: 3}); query.required = true;
    query.placeholder = 'What do we know about the resonance sites?';
    const actions = el('div', null, form, 'ce-actions');
    const submit = el('button', 'Search campaign', actions, 'ce-primary'); submit.type = 'submit';
    const ai = button(actions, 'Ask configured AI', async () => {
      if (!query.value.trim()) throw Error('Enter a campaign question first.');
      const requestedAudience = audience.value, requestedNPC = npc.value;
      const value = await api('/ai/ask', {query: query.value, audience: requestedAudience, ...(requestedAudience === 'npc' ? {npcId: requestedNPC} : {})});
      const epoch = tabEpoch, id = campaignId;
      let job = value.job;
      if (!job?.id) throw Error('No AI job was created. Configure AI assistance in Settings first.');
      output.replaceChildren();
      const message = el('p', 'Asking the configured AI…', output, 'ce-prose');
      el('p', 'AI wording is a draft. Verify the cited evidence before using it.', output, 'ce-warning');
      async function poll() {
        if (!dialog.open || tabEpoch !== epoch || campaignId !== id || audience.value !== requestedAudience || npc.value !== requestedNPC) return;
        try {
          if (['queued', 'running'].includes(job.status)) {
            const result = await api('/ai/jobs/' + encodeURIComponent(job.id)); job = result.job || result;
          }
          if (!dialog.open || tabEpoch !== epoch || campaignId !== id || audience.value !== requestedAudience || npc.value !== requestedNPC) return;
          if (['queued', 'running'].includes(job.status)) { setTimeout(poll, 800); return; }
          if (job.error) throw Error(job.error.message || words(job.error));
          message.textContent = typeof job.result === 'string' ? job.result : job.result?.text || job.result?.answer || words(job.result || 'No answer was returned.');
          if (job.result?.citations) provenance(output, job.result.citations);
          for (const result of value.results || []) {
            const card = details(output, `${result.aiSourceId || result.id} · ${result.epistemic || 'unresolved'}`);
            el('p', result.text, card, 'ce-prose');
            if (result.source_warning) el('p', result.source_warning, card, 'ce-warning');
            provenance(card, result.citations || []);
          }
        } catch (error) { message.textContent = error.message; message.className = 'ce-error ce-prose'; }
      }
      await poll();
    });
    ai.title = 'Uses the provider and limits configured in AI assistance';
    const output = section(content, 'Grounded answer');
    el('p', 'Ask a question to inspect the evidence available to that audience.', output, 'ce-help');
    audience.addEventListener('change', () => { npc.closest('label').hidden = audience.value !== 'npc'; ai.disabled = audience.value === 'npc'; output.replaceChildren(); });
    npc.addEventListener('change', () => output.replaceChildren());
    form.addEventListener('submit', event => { event.preventDefault(); run(async () => {
      const requestedAudience = audience.value, requestedNPC = npc.value;
      const value = await api('/search', {query: query.value, audience: requestedAudience, ...(requestedAudience === 'npc' ? {npcId: requestedNPC} : {})});
      if (audience.value !== requestedAudience || npc.value !== requestedNPC) return;
      output.replaceChildren();
      el('h3', 'Answer · ' + (requestedAudience === 'npc' ? NPCS.find(([id]) => id === requestedNPC)?.[1] || requestedNPC : requestedAudience), output);
      el('p', value.answer || 'No supported answer was found for this audience.', output, 'ce-prose');
      for (const result of value.results || []) {
        const card = details(output, `${result.epistemic || 'confirmed'} · ${result.type || 'evidence'} · ${result.id}`);
        el('p', result.text, card, 'ce-prose');
        provenance(card, result.citations || result.provenance);
      }
      if (!value.results?.length) el('p', 'No permitted matching evidence. Lack of a match does not establish that a claim is false.', output, 'ce-help');
    }, submit); });
  }
  function renderVoice() {
    const box = section(content, 'Speak with an NPC', 'Replies use only the selected NPC’s permitted, player-safe facts. Review the reply before playing ElevenLabs audio at the table.');
    const npc = select(box, 'NPC character', NPCS, NPCS[0][0]);
    const profileBox = el('div', null, box);
    const form = el('form', null, box);
    const query = field(form, 'What do the players ask?', '', {rows: 3}); query.required = true;
    const submit = el('button', 'Generate NPC reply', form, 'ce-primary'); submit.type = 'submit';
    const output = section(content, 'NPC reply');
    const showProfile = (expanded = false) => {
      profileBox.replaceChildren(); output.replaceChildren(); stopAudio();
      const npcId = npc.value, revision = status?.revision;
      const profile = profiles.find(item => (item.npcId || item.npc_id || item.id) === npcId);
      if (!profile) { el('p', 'Profile configuration is unavailable.', profileBox, 'ce-help'); return; }
      const panel = details(profileBox, 'Persona & voice configuration', expanded);
      for (const [key, label] of [['persona', 'Persona'], ['system_prompt', 'Persona prompt'], ['knowledge_boundaries', 'Knowledge boundaries'], ['knowledge_policy', 'Knowledge boundaries'], ['voice_id', 'ElevenLabs voice'], ['voiceId', 'ElevenLabs voice'], ['voice_env', 'Voice ID setting'], ['model_id', 'Voice model'], ['voice_settings', 'Voice settings'], ['speech_note', 'Playback allowance']]) if (profile[key]) el('p', `${label}: ${words(profile[key])}`, panel, 'ce-prose');
      el('p', profile.speech_available ? 'ElevenLabs playback is available within the approved allowance.' : profile.voiceReady || profile.configured || profile.voice_configured || profile.voice_id || profile.voiceId ? 'Voice profile configured. Playback also requires the server’s ElevenLabs credential and approved voice allowance.' : 'Choose this character’s stock voice below to prepare audio. Text replies remain available.', panel, 'ce-help');
      const voice = field(panel, 'ElevenLabs stock voice ID', profile.voice_id || profile.voiceId || '', {help: 'Use a stock voice from your ElevenLabs catalog; Voice auditions lets you compare them. Saving makes no speech request.'});
      voice.maxLength = 100;
      const actions = el('div', null, panel, 'ce-actions');
      if (profile.environment_override) el('p', 'A server environment setting overrides the saved voice choice for this NPC.', panel, 'ce-warning');
      if (typeof globalThis.ECHO_AI_SERVICE?.voiceCatalog === 'function') button(actions, 'Load stock voice catalog', async () => {
        const catalog = await globalThis.ECHO_AI_SERVICE.voiceCatalog();
        if (!dialog.open || npc.value !== npcId) return;
        const choices = (catalog.voices || []).filter(item => item.source === 'provider-stock');
        if (!choices.length) throw Error('No approved stock voices were returned. Check Voice auditions setup.');
        const picker = select(panel, 'Choose a stock voice', [['', 'Select a voice'], ...choices.map(item => [item.id, item.name || item.id])], '');
        picker.addEventListener('change', () => { if (picker.value) voice.value = picker.value; });
      });
      button(actions, 'Save voice', async () => {
        const voiceId = voice.value.trim();
        if (!/^[A-Za-z0-9_-]{0,100}$/.test(voiceId)) throw Error('Enter a stock voice ID, or clear the field to remove the saved choice.');
        const result = await api('/voice/configure', {npcId, voiceId, expectedRevision: revision});
        profiles = result.profiles || (await api('/voice/profiles')).profiles || [];
        await refreshStatus(); showProfile(true);
        announce('The NPC voice selection was saved. No speech was generated.');
      }, 'ce-primary');
      if (typeof globalThis.ECHO_VOICE_UI?.open === 'function') button(actions, 'Open voice auditions', () => { dialog.close(); globalThis.ECHO_VOICE_UI.open(); });
      el('p', 'You can also configure voices on the local server. API credentials never belong in campaign records.', panel, 'ce-help');
    };
    npc.addEventListener('change', () => showProfile()); showProfile();
    form.addEventListener('submit', event => { event.preventDefault(); run(async () => {
      stopAudio(); const npcId = npc.value;
      const value = await api('/voice/reply', {npcId, query: query.value});
      if (npc.value !== npcId) return;
      output.replaceChildren();
      el('h3', NPCS.find(([id]) => id === npcId)?.[1] || npcId, output);
      el('p', value.text || 'No reply was returned.', output, 'ce-prose ce-quote');
      const refs = details(output, 'Evidence used for this reply'); provenance(refs, value.citations);
      if (value.replyId) {
        const actions = el('div', null, output, 'ce-actions');
        button(actions, 'Prepare reply in Voice studio', () => {
          stopAudio();dialog.close();
          const chosen=profiles.find(p=>p.npc_id===npcId||p.npcId===npcId||p.id===npcId)||{};
          globalThis.ECHO_VOICE_STUDIO.open({draft:{title:'NPC reply',profile:{voiceId:chosen.voice_id||chosen.voiceId||'',model:chosen.model_id||'eleven_multilingual_v2'},actor:{id:npcId,name:NPCS.find(([id])=>id===npcId)?.[1]||npcId},script:value.text,source:{kind:'npc',id:npcId}}});
        }, 'ce-primary');
        button(actions, 'Stop audio', stopAudio);
      }
    }, submit); });
  }
  function renderSession() {
    const box = section(content, 'Prepare from the previous session', 'One analysis creates an editable review draft. Campaign state changes only when you explicitly approve selected mutations below.');
    const form = el('form', null, box);
    const title = field(form, 'Session title', 'Previous session'); title.required = true;
    const upload = field(form, 'Import notes or transcript file', '', {type: 'file', help: 'Text or Markdown, up to 1 MB. Paste exported transcription text for audio recordings.'});
    upload.accept = '.txt,.md,.markdown,.vtt,.srt,text/plain,text/markdown';
    const notes = field(form, 'Session notes / transcript · private DM input', '', {rows: 7}); notes.required = true;
    notes.placeholder = 'Paste what actually happened. Keep future plans and uncertainty explicit.';
    const playerNotes = field(form, 'Player-safe notes for the recap', '', {rows: 4, help: 'Only put information the players know here. Leave empty to keep mixed notes private, or mark safe lines [PLAYER] in the transcript.'});
    if (contextProvider) button(form, 'Use current session notes', () => {
      const context = contextProvider();
      title.value = context.title || 'Current session';
      notes.value = [context.scratch, context.recap].filter(Boolean).join('\n\n');
      playerNotes.value = '';
      if (!notes.value) announce('No current scratch notes or recap were found. Paste the session notes above.');
    });
    upload.addEventListener('change', () => run(async () => {
      const file = upload.files?.[0]; if (!file) return;
      if (file.size > 1024 * 1024) throw Error('Choose a text file smaller than 1 MB.');
      notes.value = await file.text();
      if (title.value === 'Previous session') title.value = file.name.replace(/\.[^.]+$/, '');
    }));
    const submit = el('button', 'Analyze previous session', form, 'ce-primary'); submit.type = 'submit';
    form.addEventListener('submit', event => { event.preventDefault(); run(async () => {
      preserveDraft();
      const value = await api('/sessions/analyze', {title: title.value, notes: notes.value, playerNotes: playerNotes.value});
      draft = value.draft; collectDraft = null;
      if (!draft?.id) throw Error('The service returned no session draft.');
      const list = await api('/sessions'); sessions = list.sessions || [];
      renderHistory(); renderReview(); announce('Session analysis is ready for DM review. No campaign state has changed.');
      review.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, submit); });
    const history = section(content, 'Saved session reviews');
    const review = section(content, 'Review & approve'); review.id = 'ce-session-review';
    function renderHistory() {
      history.replaceChildren(); el('h3', 'Saved session reviews', history);
      if (!sessions.length) { el('p', 'Your session reviews will appear here.', history, 'ce-help'); return; }
      const selectReview = select(history, 'Saved session', [['', 'Choose a review'], ...sessions.map(item => [item.id, `${item.title || item.id} · ${item.status || 'review'}`])], draft?.id || '');
      button(history, 'Open saved review', async () => {
        if (!selectReview.value) throw Error('Choose a saved session.');
        preserveDraft(); const value = await api('/sessions/' + encodeURIComponent(selectReview.value));
        draft = value.draft; renderReview();
      });
    }
    function renderReview() {
      collectDraft = null; review.replaceChildren();
      if (!draft) { el('h3', 'Review & approve', review); el('p', 'Analyze your notes or open a saved review.', review, 'ce-help'); return; }
      el('h3', draft.title || 'Session review', review);
      el('p', `${draft.status} · draft ${draft.id} · based on revision ${draft.baseRevision}`, review, 'ce-help');
      if (draft.status === 'committed') {
        for (const [key, label] of [['playerRecap', 'Approved player recap'], ['dmRecap', 'DM recap'], ['nextSessionPrep', 'Next-session prep']]) {
          const panel = details(review, label, true); el('p', words(draft[key] || ''), panel, 'ce-prose');
        }
        el('p', 'This session has already been committed. Its audit record is retained.', review, 'ce-notice'); return;
      }
      for (const warning of draft.warnings || []) el('p', words(warning), review, 'ce-warning');
      const inputs = {};
      inputs.title = field(review, 'Review title', draft.title);
      inputs.playerRecap = field(review, 'Player recap · review exact shareable wording', draft.playerRecap, {rows: 5});
      inputs.dmRecap = field(review, 'DM recap · private', draft.dmRecap, {rows: 6});
      const reviewFields = [
        ['unresolvedThreads', 'Unresolved threads'], ['npcChanges', 'NPC changes'], ['relationshipChanges', 'Relationship changes'],
        ['cluesLearned', 'Clues learned'], ['cluesMissed', 'Clues missed / unconfirmed'], ['nextSessionPrep', 'Next-session prep']
      ];
      const reports = details(review, 'Threads, changes, clues & next-session prep', true);
      for (const [key, label] of reviewFields) inputs[key] = field(reports, label + ' (one item per line)', (draft[key] || []).map(words).join('\n'), {rows: 3});
      const original = details(review, 'Original source notes');
      el('h4', 'Private session notes', original); el('p', draft.notes || '', original, 'ce-prose');
      el('h4', 'Player-safe notes', original); el('p', draft.playerNotes || '', original, 'ce-prose');
      const changes = section(review, 'Proposed campaign-state mutations', 'Inspect each record, provenance, and audience. Select only the changes you approve. Unselected mutations do not enter campaign state.');
      const mutations = (draft.mutations || []).map((mutation, index) => {
        const box = details(changes, `${mutation.record?.kind || mutation.op} · ${mutation.record?.name || mutation.id}`, index === 0);
        const selected = check(box, 'Approve mutation ' + (index + 1), false);
        el('p', mutation.reason || 'Review this proposed change against the source notes.', box, 'ce-help');
        const read = mutation.record ? recordForm(box, mutation.record, mutation.id) : () => null;
        return {mutation, selected, read};
      });
      if (!mutations.length) el('p', 'No record mutations were proposed. Review the recaps and preparation notes.', changes, 'ce-help');
      const approval = check(review, 'I reviewed the player recap, knowledge boundaries, and each selected change', false);
      collectDraft = () => {
        const value = clone(draft);
        for (const key of ['title', 'playerRecap', 'dmRecap']) value[key] = inputs[key].value;
        for (const [key] of reviewFields) value[key] = inputs[key].value.split('\n').map(line => line.trim()).filter(Boolean);
        value.mutations = mutations.map(({mutation, selected, read}) => ({...mutation, selected: selected.checked, ...(mutation.record ? {record: read()} : {})}));
        return value;
      };
      const actions = el('div', null, review, 'ce-actions');
      button(actions, 'Save review draft', async () => {
        const value = collectDraft();
        const saved = await api('/sessions/' + encodeURIComponent(value.id) + '/save', {draft: value});
        draft = saved.draft || value; announce('Review draft saved. Campaign state is unchanged.');
      });
      const commit = button(actions, 'Commit selected changes', async () => {
        if (!approval.checked) throw Error('Review the player recap and selected changes, then tick the DM review checkbox.');
        const value = collectDraft();
        const saved = await api('/sessions/' + encodeURIComponent(value.id) + '/save', {draft: value});
        draft = saved.draft || value;
        const result = await api('/sessions/' + encodeURIComponent(value.id) + '/commit', {
          expectedRevision: value.baseRevision, draftVersion: draft.draftVersion, mutationIds: value.mutations.filter(item => item.selected).map(item => item.id), playerRecapApproved: true
        });
        draft = result.draft || {...value, status: 'committed'}; collectDraft = null;
        await refreshStatus(); const list = await api('/sessions'); sessions = list.sessions || [];
        renderHistory(); renderReview(); announce('Your reviewed session was committed. Only selected changes entered campaign state.');
      }, 'ce-primary');
      commit.disabled = true;
      approval.addEventListener('change', () => { commit.disabled = !approval.checked; });
      review.addEventListener('input', event => {
        if (event.target !== approval) { approval.checked = false; commit.disabled = true; }
      });
    }
    renderHistory(); renderReview();
  }
  function renderSources() {
    clearTimeout(sourcePoll);
    const box = section(content, 'Canonical sources & local service', 'The service indexes existing Echo Below and sourcebook material with file hashes and page provenance. New imports remain DM only until reviewed.');
    const row = el('div', null, box, 'ce-actions');
    button(row, 'Refresh service status', async () => { await refreshStatus(); content.replaceChildren(); renderSources(); });
    button(row, 'Reindex canonical sources', async () => {
      announce('Indexing canonical sources…');
      const value = await api('/sources/reindex', {}); await refreshStatus(); content.replaceChildren(); renderSources();
      announce(value.indexing?.message || (value.indexing?.status === 'running' ? 'Source indexing has started. Progress appears below.' : value.message || 'Source indexing request completed; inspect the report below.'));
    });
    const setup = el('a', 'Open campaign engine setup guide', box); setup.href = 'CAMPAIGN-ENGINE-SETUP.md'; setup.target = '_blank'; setup.rel = 'noopener';
    const state = details(box, 'Service configuration', true);
    el('p', 'Campaign records are stored privately on this computer, with a revision history and source citations.', state);
    el('p', status?.aiConfigured ? 'AI assistance is configured. Provider allowances apply when you choose Ask configured AI.' : 'External AI is not configured. Local source search and session analysis are available.', state);
    if (Array.isArray(status?.voice)) for (const voice of status.voice) el('p', `${voice.name || voice.id}: ${voice.speech_available ? 'voice playback available' : voice.voice_configured ? 'voice selected; provider setup required' : 'voice setup required'}`, state, 'ce-help');
    const diagnostics = details(state, 'Technical diagnostics');
    el('pre', JSON.stringify({revision: status?.revision, counts: status?.counts, aiConfigured: status?.aiConfigured, storage: status?.storage}, null, 2), diagnostics);
    const progress = section(content, 'Source indexing');
    function indexingStatus() {
      progress.replaceChildren(); el('h3', 'Source indexing', progress);
      const indexing = status?.indexing || {}, report = indexing.report || {};
      el('p', `Status: ${indexing.status || 'idle'}`, progress, 'ce-help');
      if (indexing.message) el('p', indexing.message, progress);
      if (report.indexed != null) el('p', `Indexed: ${Array.isArray(report.indexed) ? report.indexed.length : report.indexed}`, progress);
      if (indexing.error) el('p', words(indexing.error), progress, 'ce-warning');
      for (const failure of report.failed || []) el('p', `${failure.filename || 'Source'}: ${failure.error || 'Indexing failed'}`, progress, 'ce-warning');
      if (indexing.status === 'running') el('p', 'Indexing continues on this computer. This panel checks progress briefly; use Refresh service status for longer jobs.', progress, 'ce-help');
    }
    indexingStatus();
    if (status?.indexing?.status === 'running') {
      const epoch = tabEpoch, id = campaignId;
      let remaining = 15;
      const poll = async () => {
        if (!dialog.open || activeTab !== 'sources' || tabEpoch !== epoch || campaignId !== id) return;
        try {
          await refreshStatus();
          if (!dialog.open || activeTab !== 'sources' || tabEpoch !== epoch || campaignId !== id) return;
          indexingStatus();
          if (status?.indexing?.status !== 'running') { content.replaceChildren(); renderSources(); return; }
          if (--remaining > 0) sourcePoll = setTimeout(poll, 1000);
        } catch (error) { announce(error.message, true); }
      };
      sourcePoll = setTimeout(poll, 1000);
    }
    const docs = section(content, `Indexed sources · ${sources.length}`);
    if (!sources.length) el('p', 'No source index is listed yet. Reindex canonical sources after configuring their folders.', docs, 'ce-help');
    for (const source of sources) {
      const panel = details(docs, source.filename || source.title || source.id || source.source_id);
      el('p', `ID: ${source.id || source.source_id || ''}`, panel);
      el('p', `Audience: ${source.visibility || 'dm'} · ${source.pages ?? source.page_count ?? '?'} pages`, panel);
      if (source.sha256) el('p', 'SHA-256: ' + source.sha256, panel, 'ce-citation');
      if (source.error || source.warning) el('p', source.error || source.warning, panel, 'ce-warning');
    }
  }
  function open(tab = activeTab) {
    if (busy) return;
    const nextId = String(contextProvider?.()?.campaignId || 'echo-below');
    if (nextId !== campaignId) {
      campaignId = nextId; status = null; records = []; sessions = []; profiles = []; sources = [];
      draft = null; collectDraft = null; selectedRecord = null;
    }
    if (!dialog) mount();
    returnFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
    status = null;
    run(() => switchTab(TABS.some(([id]) => id === tab) ? tab : 'state'));
  }
  function mount() {
    dialog = el('dialog', null, document.getElementById('dm-app') || document.body, 'ce-dialog');
    dialog.id = 'campaign-engine-dialog'; dialog.setAttribute('aria-labelledby', 'ce-title');
    const heading = el('header', null, dialog, 'ce-header');
    const title = el('div', null, heading);
    el('small', 'THE ECHO BELOW · PRIVATE DM WORKSPACE', title);
    el('h2', 'Campaign command center', title).id = 'ce-title';
    statusLine = el('p', 'Local campaign service', title, 'ce-help');
    const close = el('button', 'Close', heading); close.type = 'button'; close.autofocus = true;
    close.addEventListener('click', () => {
      try { preserveDraft(); } catch (error) { announce(error.message, true); return; }
      dialog.close();
    });
    dialog.addEventListener('cancel', event => {
      try { preserveDraft(); } catch (error) { event.preventDefault(); announce(error.message, true); }
    });
    dialog.addEventListener('close', () => { stopAudio(); clearTimeout(sourcePoll); ++tabEpoch; returnFocus?.focus(); });
    const nav = el('nav', null, dialog, 'ce-tabs'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Campaign systems');
    for (const [id, name] of TABS) {
      const item = button(nav, name, () => switchTab(id));
      item.dataset.ceTab = id; item.id = 'ce-tab-' + id;
      item.setAttribute('role', 'tab'); item.setAttribute('aria-controls', 'ce-content');
      item.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = TABS.findIndex(([key]) => key === id);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
        const target = dialog.querySelector('#ce-tab-' + TABS[index][0]); target.focus(); target.click();
      });
    }
    notice = el('p', '', dialog, 'ce-notice'); notice.hidden = true; notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
    content = el('div', null, dialog, 'ce-content'); content.id = 'ce-content'; content.setAttribute('role', 'tabpanel'); content.tabIndex = 0;
  }
  function init() {
    const launch = document.getElementById('open-campaign-engine');
    if (launch) launch.addEventListener('click', () => open());
  }
  globalThis.ECHO_CAMPAIGN_ENGINE_UI = {open, init, setContext: provider => { contextProvider = provider; }};
  init();
})();

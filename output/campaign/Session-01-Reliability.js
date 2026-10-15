(() => {
  'use strict';
  const VERSION = 3;
  const $ = id => document.getElementById(id);
  let recoveryIssue='',storageSummary='Storage usage not checked.';
  const cut = (value, max = 120) => String(value ?? '').slice(0, max);
  const esc = value => cut(value, 4000).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const versionOf = value => Number.isInteger(value?.schemaVersion) ? value.schemaVersion : 1;
  function assertSupported(value) {
    const version = versionOf(value);
    if (version > VERSION) throw new Error(`This campaign uses data version ${version}; this app supports version ${VERSION}. Update the app before opening it.`);
    if (version < 1) throw new Error('The saved campaign version is invalid.');
    return version;
  }
  function normalizeRegistry(raw) {
    const campaigns = (Array.isArray(raw?.campaigns) ? raw.campaigns : []).slice(0, 100).filter(x => x && /^[a-z0-9-]{1,80}$/i.test(x.id) && typeof x.name === 'string')
      .map(x => ({ id: x.id, name: cut(x.name, 80), archived: x.archived === true, ...(typeof x.originId==='string'&&/^[A-Za-z0-9_.:-]{1,120}$/.test(x.originId)?{originId:x.originId}:{}), ...(typeof x.practiceSource==='string'&&/^[a-z0-9-]{1,80}$/i.test(x.practiceSource)?{practiceSource:x.practiceSource}:{}) }));
    if (!campaigns.length) campaigns.push({ id: 'default', name: 'The Echo Below', archived: false });
    if (campaigns.every(x => x.archived)) campaigns[0].archived = false;
    const active = campaigns.some(x => x.id === raw?.active && !x.archived) ? raw.active : campaigns.find(x => !x.archived).id;
    return { schemaVersion: VERSION, active, campaigns };
  }
  function validateArchive(archive) {
    if (!archive || !['echo-below-campaign-v1', 'echo-below-campaign-v2'].includes(archive.format)) throw new Error('Choose a campaign backup created by this table.');
    if (archive.format === 'echo-below-campaign-v2') assertSupported(archive);
    if (!Array.isArray(archive.sessions) || !archive.sessions.length) throw new Error('The backup has no sessions.');
    const ids = new Set(), media = Array.isArray(archive.presentation?.media) ? archive.presentation.media : [];
    for (const session of archive.sessions) {
      if (!session || typeof session.id !== 'string' || !session.id || typeof session.name !== 'string' || !session.state || typeof session.state !== 'object') throw new Error('The backup contains an invalid session.');
      if (ids.has(session.id)) throw new Error('The backup contains duplicate session IDs.');
      ids.add(session.id); assertSupported(session.state);
    }
    if(archive.story?.voiceStudio){
      const studio=globalThis.ECHO_VOICE_STUDIO_DATA.normalize(archive.story.voiceStudio);
      for(const clip of studio.clips)for(const take of clip.takes)if(!media.some(m=>m.id===take.mediaId&&m.kind==='audio'&&m.audience==='dm'&&!m.path))throw Error('A voice take is missing its private local media record: '+clip.title);
    }
    const missingMedia = media.filter(item => item && !item.path && !(typeof archive.mediaFiles?.[item.id] === 'string' && /^data:(image|audio|video)\/[\w.+-]+;base64,/.test(archive.mediaFiles[item.id]))).map(item => item.name || item.id);
    return { sessions: archive.sessions.length, importedMedia: media.filter(m => m && !m.path).length, missingMedia,
      valid: !missingMedia.length, legacy: archive.format === 'echo-below-campaign-v1' };
  }
  function publicPayload(raw) {
    const tokens = (raw.tokens || []).filter(t => t && t.placed === true && t.visible === true).map(t => ({
      id: t.id, name: t.name, label: t.label, type: t.type, team: t.team, placed: true, visible: true,
      scene: t.scene, x: t.x, y: t.y, defeated: t.defeated,
      conditions: (t.conditions || []).filter(value => typeof value === 'string'),
      statusDue: t.statusDue === true, concentrating: t.concentrating === true }));
    const ids = new Set(tokens.map(t => t.id));
    const tokenMeta = Object.fromEntries(Object.entries(raw.map?.tokenMeta || {}).filter(([id]) => ids.has(id)).map(([id, item]) => [id, {
      size: item.size, facing: item.facing, elevation: item.elevation, portrait: item.portrait || '' }]));
    const sceneData = Object.fromEntries(Object.entries(raw.map?.scenes || {}).filter(([id]) => id === raw.scene).map(([id, scene]) => [id, {
      light: scene.light, vision: scene.vision, fineFog: scene.fineFog, journeyMotion: scene.journeyMotion !== false,
      view: { zoom: scene.view?.zoom, panX: scene.view?.panX, panY: scene.view?.panY },
      playerLayers: Object.fromEntries(['map', 'grid', 'fog', 'tokens', 'labels', 'templates', 'annotations', 'markers']
        .map(key => [key, scene.playerLayers?.[key] !== false])),
      lines: (scene.lines || []).filter(l => l.kind !== 'secret' || l.discovered).map(l => ({
        id: l.id, kind: l.kind, x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, open: l.open, discovered: l.discovered })),
      points: (scene.points || []).filter(p => p.visible !== false && p.approved !== false).map(p => ({ id: p.id, x: p.x, y: p.y, title: p.title })),
      links: (scene.links || []).filter(l => l.visible !== false).map(l => ({ id: l.id, x: l.x, y: l.y, title: l.title, target: l.target, visible: l.visible })),
      lights: (scene.lights || []).map(l => ({ id: l.id, x: l.x, y: l.y, radius: l.radius, kind: l.kind, enabled: l.enabled }))
    }]));
    const allowedScenes = Array.isArray(raw.scenes) ? raw.scenes.filter(s => s.id === raw.scene).map(s => ({ id: s.id, title: s.title, kind: s.kind,
      image: s.image, fog: s.fog, grid: s.grid, gridColumns: s.gridColumns })) : null;
    const turn = { round: raw.turn?.round || 0, activeId: ids.has(raw.turn?.activeId) ? raw.turn.activeId : null,
      order: (raw.turn?.order || []).filter(t => ids.has(t.id)).map(t => ({ id: t.id, name: t.name, label: t.label, initiative: t.initiative })) };
    const presentation = raw.presentation ? {
      mode: raw.presentation.mode, mediaId: raw.presentation.mediaId, handoutId: raw.presentation.handoutId,
      page: raw.presentation.page, cardId: raw.presentation.cardId, title: raw.presentation.title,
      subtitle: raw.presentation.subtitle, banner: raw.presentation.banner, objective: raw.presentation.objective,
      event: raw.presentation.event, eventEndsAt: raw.presentation.eventEndsAt, echo: raw.presentation.echo,
      overlays: { turn: raw.presentation.overlays?.turn !== false, roll: raw.presentation.overlays?.roll !== false,
        objective: raw.presentation.overlays?.objective !== false, event: raw.presentation.overlays?.event !== false },
      sceneImage: raw.presentation.sceneImage,
      media: (raw.presentation.media || []).map(m => ({ id: m.id, name: m.name, kind: m.kind, path: m.path, mime: m.mime })),
      handout: raw.presentation.handout ? { title: raw.presentation.handout.title, text: raw.presentation.handout.text,
        page: raw.presentation.handout.page ? { mediaId: raw.presentation.handout.page.mediaId,
          label: raw.presentation.handout.page.label, zoom: raw.presentation.handout.page.zoom,
          panX: raw.presentation.handout.page.panX, panY: raw.presentation.handout.page.panY,
          crop: raw.presentation.handout.page.crop } : null } : null,
      card: raw.presentation.card ? { title: raw.presentation.card.title, subtitle: raw.presentation.card.subtitle,
        text: raw.presentation.card.text, mediaId: raw.presentation.card.mediaId } : null
    } : null;
    const party = raw.partyView;
    const partyView = party ? { id: party.id, name: party.name, className: party.className, ancestry: party.ancestry,
      level: party.level, showHp: party.showHp, ac: party.ac, hp: party.hp, maxHp: party.maxHp,
      tempHp: party.tempHp, speed: party.speed, senses: party.senses, conditions: party.conditions,
      exhaustion: party.exhaustion, concentration: party.concentration, publicNotes: party.publicNotes,
      inspiration: party.inspiration,
      resources: (party.resources || []).map(r => ({ name: r.name, current: r.current, max: r.max })),
      attacks: (party.attacks || []).map(a => ({ name: a.name, type: a.type, attackBonus: a.attackBonus,
        damageDice: a.damageDice, damageType: a.damageType, saveAbility: a.saveAbility,
        saveDC: a.saveDC, effect: a.effect })) } : null;
    return { atlas: globalThis.ECHO_ATLAS_VIEW?.normalize(raw.atlas) || null, atmosphere: globalThis.ECHO_ATMOSPHERE_VIEW?.clean(raw.atmosphere) || null, dungeon: globalThis.ECHO_DUNGEON_VIEW?.clean(raw.dungeon) || null, journey: globalThis.ECHO_TRAVEL_VIEW?.clean(raw.journey) || null, sessionKind: raw.sessionKind, scenes: allowedScenes, sessionName: raw.sessionName,
      scene: raw.scene, grid: raw.grid, playerReveal: raw.playerReveal, calibrationCheck: raw.calibrationCheck === true,
      map: { playerInput: raw.map?.playerInput,
        display: raw.map?.display ? { name: raw.map.display.name, width: raw.map.display.width,
          height: raw.map.display.height, physicalWidth: raw.map.display.physicalWidth,
          squareInches: raw.map.display.squareInches, safeEdge: raw.map.display.safeEdge,
          orientation: raw.map.display.orientation, scaleLock: raw.map.display.scaleLock,
          tvPreset:raw.map.display.tvPreset==='classic'?'classic':'quiet',showObjective:raw.map.display.showObjective!==false,showSubtitles:raw.map.display.showSubtitles!==false } : null,
        scenes: sceneData, tokenMeta },
      fog: raw.fog || [], sceneFog: raw.sceneFog?.[raw.scene] ? { [raw.scene]: raw.sceneFog[raw.scene] } : {}, tokens, turn,
      publicRoll: raw.publicRoll ? { label: raw.publicRoll.label, notation: raw.publicRoll.notation,
        parts: raw.publicRoll.parts, total: raw.publicRoll.total } : null,
      narration: raw.narration&&['playing','paused','subtitles'].includes(raw.narration.status)?{title:cut(raw.narration.title,120),text:cut(raw.narration.text,5000),status:raw.narration.status}:null,
      reduceMotion: raw.reduceMotion, presentation,
      annotations: (raw.annotations || []).filter(a => a.scene === raw.scene).map(a => ({ id: a.id, scene: a.scene, kind: a.kind,
        x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2 })),
      ping: raw.ping ? { scene: raw.ping.scene, x: raw.ping.x, y: raw.ping.y } : null,
      handout: raw.handout && raw.handout.visible !== false ? { visible: true,
        image: raw.handout.image, title: raw.handout.title, text: raw.handout.text } : null,
      mainQuest: raw.mainQuest&&typeof raw.mainQuest==='object' ? {title:String(raw.mainQuest.title||'').slice(0,120),text:String(raw.mainQuest.text||'').slice(0,2400),state:String(raw.mainQuest.state||'').slice(0,20)} : null,
      tvTextCards: globalThis.ECHO_TV_TEXT?.publicCards(raw.tvTextCards) || [],
      journal: (raw.journal || []).filter(e => e.published !== false).map(e => ({ id: e.id, title: e.title, text: e.text, kind: e.kind, when: e.when })),
      partyView };
  }
  function visibleTokens(tokens, scene, fog, hasFog, lightVisible, tileForPoint) {
    const exposed = new Set(fog);
    return tokens.filter(t => t && t.placed && t.visible && t.scene === scene &&
      (t.team !== 'enemy' || (lightVisible(t) && (!hasFog || exposed.has(tileForPoint(t))))));
  }
  let host, tab = 'health', readiness = [], checking = false, verification = '', otherRecoveryOpen=false;
  let tableReport = null;
  function open(next = 'status') { tab = next === 'status' && !globalThis.ECHO_CURRENT_STATUS_UI ? 'health' : next; $('reliability-drawer').hidden = false; $('reliability-scrim').hidden = false; render(); }
  function close() { $('reliability-drawer').hidden = true; $('reliability-scrim').hidden = true; }
  function renderHealth() {
    const status = host.connection(),perf=host.performance?.();
    return `<h3>Table readiness</h3><p class="reliability-lead">Campaign: ${esc(host.campaignName)} · Session: ${esc(host.sessionName)} · Data version ${VERSION}</p>
      ${host.migrationReport?.length?`<details><summary>Data upgrade report</summary>${host.migrationReport.slice(-5).reverse().map(item=>`<p>${esc(new Date(item.at).toLocaleString())}: version ${esc(item.from)} → ${esc(item.to)} for ${esc(item.session)}. Original: ${esc(item.restorePoint)}. ${esc(item.note)}</p>`).join('')}</details>`:''}
      <div class="reliability-status ${esc(status.level)}"><strong id="reliability-tv-status">Player TV: ${esc(status.label)}</strong><span>${esc(status.details||'No update applied yet.')}</span><button type="button" data-reliable="resync">Resync TV</button></div>
      ${perf?`<p>Current map: ${perf.tokens} placed tokens · DM render ${Math.round(perf.dmMs)} ms · TV render ${perf.tvConnected?Math.round(perf.tvMs)+' ms':'not measured'}. ${Math.max(perf.dmMs,perf.tvMs)>50?'Slow rendering: try Subtle or Off effects, fewer active spell areas, or a smaller map image.':'These timings measure map construction, not animation frame rate.'}</p>`:''}<button type="button" data-reliable="check-offline" ${checking ? 'disabled' : ''}>${checking ? 'Checking…' : 'Check offline files'}</button>
      <p class="reliability-help">Image and uploaded media checks run here. Some browsers restrict checking local PDFs; those files are marked unverified so you can open them manually before play.</p>
      <div class="reliability-file-list">${readiness.map(file => `<div class="reliability-file ${esc(file.status)}"><strong>${esc(file.status)}</strong><span>${esc(file.name)}</span><small>${esc(file.note || file.path)}</small></div>`).join('')}</div>`;
  }
  function renderTableCheck() {
    const report = tableStatus();
    const checks = report?.checks || {};
    const rows = [['tv','Player TV','Open or resync TV'],['phones','Player phones','Connect phones'],
      ['audio','Speakers','Open audio board'],['assets','Session maps and media','Open media library'],
      ['storage','Browser storage','Open recovery'],['backup','Campaign backup','Download backup']];
    const values = Object.values(checks);
    const attention = values.some(item => !['ready','checking'].includes(item.status));
    const pending = !report || report.running || values.length < rows.length;
    const headline = pending ? 'Checking the table…' : attention ? 'Needs attention before play' : globalThis.ECHO_CURRENT_STATUS_UI?.summary()?.ready ? 'Ready for play' : 'Connection checks passed · physical review remains';
    return `<h3>One-click table check</h3><p class="reliability-lead">${esc(host.sessionName)} · Checks the connected displays, phones, a sound sample, this session’s maps and media, and a recovery copy.</p>
      <div class="table-check-summary ${pending ? 'checking' : attention ? 'attention' : 'ready'}" role="status"><strong>${esc(report ? headline : 'Run the check before players arrive')}</strong><span>${esc(report?.started ? new Date(report.started).toLocaleTimeString() : 'No check run yet')}</span></div>
      <div class="button-row"><button type="button" class="primary" data-reliable="run-table-check" ${report?.running ? 'disabled' : ''}>${report?.running ? 'Checking…' : 'Run table check again'}</button><button type="button" data-reliable="download-backup">Download portable backup</button></div>
      <div class="table-check-rows">${rows.map(([key,label,fix]) => { const item=checks[key]; return `<article class="table-check-row ${esc(item?.status || 'waiting')}"><div><strong>${esc(label)}</strong><small>${esc(item?.detail || 'Waiting for check')}</small></div><span>${esc(item?.status || 'waiting')}</span>${item?.status === 'attention' ? `<button type="button" data-reliable="fix-${key}">${esc(fix)}</button>` : item?.status === 'confirm' ? '<button type="button" data-reliable="confirm-audio">I heard it</button>' : ''}</article>`; }).join('')}</div>
      <p class="reliability-help">A successful backup check creates a local restore point and validates a portable export. Use Download backup to keep a separate file. Confirm you hear the sample sound yourself.</p>`;
  }
  function renderSnapshots() {
    const points = host.restorePoints || [];
    return `<h3>Restore points</h3><p role="status">${esc(storageSummary)}</p>${recoveryIssue?`<p role="alert" class="story-note">${esc(recoveryIssue)}</p>`:''}<button type="button" data-reliable="check-storage">Check storage usage</button><details><summary>Review automatic-point cleanup</summary><p>New restore points are compressed without discarding campaign or undo data. Download a backup before removing old automatic points. Manual and migration originals are protected.</p><label>Automatic points to keep <input id="recovery-keep" type="number" min="1" max="30" value="6"></label><button type="button" data-reliable="prune-points">Review cleanup</button></details><p class="reliability-help">Automatic copies are made before a session and major changes. Restore points are separate from Undo and Redo. Restoring first makes a copy of the current campaign.</p>
      <button type="button" data-reliable="create-point">Create restore point now</button><div class="reliability-point-list">${points.length ? points.slice().reverse().map(point => `<article><div><strong>${esc(point.label)}</strong><small>${esc(new Date(point.created).toLocaleString())} · ${esc(point.kind)}${point.bytes?' · '+(point.bytes/1048576).toFixed(1)+' MB'+(point.encoding==='gzip'?' compressed':''):''}</small></div><button type="button" data-reliable="restore-point" data-id="${esc(point.id)}">Restore</button><button type="button" data-reliable="download-point" data-id="${esc(point.id)}">Download</button></article>`).join('') : '<p>No restore points yet.</p>'}</div>`;
  }
  function renderCampaigns() {
    const rows = host.registry.campaigns;
    const packs=globalThis.ECHO_BOOT?.installedPacks||[];
    return `<h3>Campaigns</h3><p>Installed packs: ${packs.length?packs.map(p=>esc(p.name||p.id)+' · '+esc(p.version)).join('; '):'None · reusable blank table'}</p><p class="reliability-help">Choose New group for a blank table, or an exact continuation or practice copy. Each campaign has its own records. Archive keeps the original available for unarchiving.</p>
      <div class="reliability-campaign-list">${rows.map(c => `<article><div><strong>${esc(c.name)}</strong><small>${c.id === host.campaignId ? 'Current' : c.archived ? 'Archived' : 'Available'}</small></div>
      ${c.archived ? `<button type="button" data-reliable="unarchive" data-id="${esc(c.id)}">Unarchive</button>` : `<button type="button" data-reliable="switch" data-id="${esc(c.id)}" ${c.id === host.campaignId ? 'disabled' : ''}>Open</button><button type="button" data-reliable="duplicate" data-id="${esc(c.id)}">Start a copy / new group</button><button type="button" data-reliable="archive" data-id="${esc(c.id)}" ${rows.filter(x => !x.archived).length < 2 ? 'disabled' : ''}>Archive</button>`}</article>`).join('')}</div>
      <button type="button" data-reliable="new-campaign">Create empty campaign</button><button type="button" data-reliable="example-campaign">Create fictional example</button>`;
  }
  function renderBackup() {
    return `<h3>Complete campaign backup</h3><div class="button-row"><button type="button" class="primary" data-reliable="download-backup">Back up whole campaign</button><button type="button" data-reliable="restore-backup">Restore whole campaign</button></div>
      <p>One private ZIP contains browser sessions, structured campaign records and history, required artwork/audio, and matching versions. Personal books, rebuildable book indexes and provider accounts stay outside it.</p>
      <p>Restore previews characters, quests, scene, database compatibility and missing media. Both stores are verified in a separate campaign before you choose to open it. The current table and phones stay connected during preparation.</p>
      <details id="reliability-other-tools" ${otherRecoveryOpen?'open':''}><summary>Other recovery tools</summary><button type="button" data-reliable="package">Download portable app + campaign release</button><button type="button" data-reliable="rehearse">Rehearse browser-data restore in temporary storage</button><button type="button" data-reliable="browser-data">Download legacy browser-only JSON</button>
      <p>Old JSON files and restore points contain browser data only. Keep using them for emergency data recovery; use the complete ZIP to recover both stores and artwork.</p>
      <label>Check a legacy JSON file<input id="reliability-verify-file" type="file" accept=".json,application/json"></label><p id="reliability-verify-result">${esc(verification)}</p></details>`;
  }
  function render() {
    globalThis.ECHO_SESSION_FLOW_UI?.refresh();
    if (!host || $('reliability-drawer').hidden) return;
    if($('reliability-other-tools'))otherRecoveryOpen=$('reliability-other-tools').open;
    for (const button of $('reliability-tabs').querySelectorAll('button')) button.classList.toggle('active', button.dataset.reliabilityTab === tab);
    if(tab==='rehearsal'&&globalThis.ECHO_TABLE_REHEARSAL_UI){globalThis.ECHO_TABLE_REHEARSAL_UI.render($('reliability-content'));return;}
    if(tab==='status'&&globalThis.ECHO_CURRENT_STATUS_UI){globalThis.ECHO_CURRENT_STATUS_UI.render($('reliability-content'));return;}
    $('reliability-content').innerHTML = ({ table: renderTableCheck, health: renderHealth, snapshots: renderSnapshots, campaigns: renderCampaigns, backup: renderBackup })[tab]();
  }
  function refreshConnection() {
    const target = $('reliability-tv-status');
    if (target && host) target.textContent = `Player TV: ${host.connection().label}`;
  }
  async function checkPath(path, category) {
    if (!path) return { status: 'missing', note: 'No file path' };
    if (path.startsWith('data:image/')) return { status: 'ready', note: 'Embedded in campaign save' };
    if (path.startsWith('asset:')) return { status: 'ready', note: 'Embedded in session save' };
    if (category === 'image') return new Promise(resolve => {
      const image = new Image(); const timeout = setTimeout(() => { image.src = ''; resolve({ status: 'unverified', note: 'Image check timed out' }); }, 6000);
      image.onload = () => { clearTimeout(timeout); resolve({ status: 'ready', note: 'Image opened' }); };
      image.onerror = () => { clearTimeout(timeout); resolve({ status: 'missing', note: 'Image could not open' }); };
      image.src = path;
    });
    try {
      const response = await fetch(path, { method: 'GET', cache: 'no-store' });
      return response.ok ? { status: 'ready', note: 'File opened' } : { status: 'missing', note: `HTTP ${response.status}` };
    } catch { return { status: 'unverified', note: 'Browser blocked local-file verification; open manually' }; }
  }
  async function checkOffline() {
    checking = true; readiness = []; render();
    const items = [], seen = new Set();
    const add = (name, path, category = 'image', mediaId = '') => { const key = mediaId || path; if (!key || seen.has(key)) return; seen.add(key); items.push({ name, path, category, mediaId }); };
    for (const scene of host.scenes) if (scene.image) add(`Scene: ${scene.title}`, host.sceneImage(scene));
    for (const token of host.state.tokens) {
      const portrait = host.state.map?.tokenMeta?.[token.id]?.portrait;
      if (portrait) add(`Portrait: ${token.name}`, host.resolveImage(portrait));
    }
    for (const npc of host.story?.npcs || []) if (npc.portrait)
      add(`NPC portrait: ${npc.name}`, host.storyPortrait(npc.portrait));
    const handout = host.state.handout;
    if (handout?.image) add(`Handout: ${handout.title || 'current'}`, host.resolveImage(handout.image));
    for (const media of host.media) add(`Media: ${media.name}`, media.path || '', media.kind, media.path ? '' : media.id);
    for (const [id, book] of Object.entries(globalThis.ECHO_RULES_DATA?.books || {})) if (book.file) add(`Book: ${book.short || id}`, book.file, 'document');
    for (const link of document.querySelectorAll('#source-shelf a[href]')) add(`Document: ${link.textContent.trim()}`, link.getAttribute('href'), 'document');
    for (const item of items) {
      let result;
      if (item.mediaId) {
        try { const blob = await host.readMedia(item.mediaId); result = blob instanceof Blob && blob.size
          ? { status: 'ready', note: `${Math.round(blob.size / 1024)} KB stored locally` }
          : { status: 'missing', note: 'Imported file is missing from browser storage' }; }
        catch { result = { status: 'unverified', note: 'Browser storage could not be checked' }; }
      }
      else result = await checkPath(item.path, item.category);
      readiness.push({ ...item, ...result }); render();
    }
    checking = false; render();
  }
  async function checkSessionAssets() {
    const sceneIds = new Set(['region-lmop', host.state.scene, ...(host.beats || []).map(beat => beat.scene).filter(Boolean)]);
    const items = [], seen = new Set();
    for (const scene of host.scenes) if (sceneIds.has(scene.id) && scene.image) {
      const path = host.sceneImage(scene); if (path && !seen.has(path)) { seen.add(path); items.push({ name: scene.title, path, category: 'image' }); }
    }
    for (const media of host.media.filter(item => item.kind === 'audio' && (item.tags?.includes(`session:${host.sessionId}`) || /^recorded-/.test(item.id)))) {
      const key = media.path || media.id; if (seen.has(key)) continue; seen.add(key);
      items.push({ name: media.name, path: media.path || '', category: 'audio', mediaId: media.path ? '' : media.id });
    }
    let index = 0;
    const results = [];
    await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
      while (index < items.length) {
        const item = items[index++];
        let result;
        if (item.mediaId) {
          try { const blob = await host.readMedia(item.mediaId); result = blob instanceof Blob && blob.size ? { status: 'ready' } : { status: 'missing', note: 'Imported file is absent' }; }
          catch { result = { status: 'unverified', note: 'Could not read imported file' }; }
        } else result = await checkPath(item.path, item.category);
        results.push({ ...item, ...result });
      }
    }));
    return results;
  }
  async function runTableCheck(options={}) {
    if (tableStatus()?.running) return;
    if(!options.inline){tab = 'table'; open('table');}
    const report = tableReport = { campaignId:host.campaignId, sessionId: host.sessionId, started: Date.now(), running: true, checks: {} };
    const set = (key, status, detail) => { if (tableReport !== report) return; report.checks[key] = { status, detail }; render(); };
    for (const key of ['tv','phones','audio','assets','storage','backup']) set(key, 'checking', 'Checking…');
    let sound;
    try { sound = host.audioTest(); } catch (error) { sound = Promise.reject(error); }
    const tv = host.connection();
    set('tv', tv.level === 'connected' ? 'ready' : 'attention', tv.level === 'connected' ? 'Player TV is responding.' : tv.label);
    const jobs = [
      sound.then(ok => set('audio', ok ? 'confirm' : 'attention', ok ? 'The sample played. Confirm you heard it.' : 'Sample sound did not play; open the audio board.')).catch(error => set('audio','attention',error.message)),
      host.phoneCheck().then(info => set('phones', info.service && info.enabled && info.connected > 0 && !info.stale ? 'ready' : 'attention',
        !info.service ? info.error || 'Phone service unavailable.' : !info.enabled ? 'Phone access is off.' : `${info.connected} phones up to date; ${info.stale||0} stale or offline.`)).catch(error => set('phones','attention',error.message)),
      checkSessionAssets().then(files => { const bad = files.filter(item => item.status !== 'ready');
        set('assets', bad.length ? 'attention' : 'ready', bad.length ? `${bad.length} of ${files.length} session files need review: ${bad.slice(0,3).map(item => item.name).join(', ')}.` : `${files.length} prepared map and audio files opened.`); }).catch(error => set('assets','attention',error.message)),
      (async()=>{const estimate=await globalThis.navigator?.storage?.estimate?.();
        if(!estimate?.quota){set('storage','unchecked','Storage estimate unavailable here. Backup restoration is a separate check.');return;}
        const percent=Math.round(100*(estimate.usage||0)/estimate.quota),used=Math.round((estimate.usage||0)/1048576),total=Math.round(estimate.quota/1048576);
        set('storage',percent>=80?'attention':'ready',`${used} MB of ${total} MB used (${percent}%).${percent>=80?' Download a backup and free browser storage before play.':''}`);
      })().catch(error=>set('storage','attention','Could not check browser storage: '+error.message)),
      (async () => { await host.createRestorePoint(`Table check · ${host.sessionName}`, 'manual');
        const archive = await host.validateBackup();
        const result = validateArchive(archive);
        if(!result.valid){set('backup','attention',`Missing media: ${result.missingMedia.join(', ')}.`);return;}
        const rehearsal=await host.rehearseBackup?.(archive);
        const structured=await host.checkWholeStore?.();
        set('backup','ready',`Browser restore point checked; ${structured?`${structured.structuredRecords} structured records, database version ${structured.databaseVersion} checked. Download the whole ZIP to keep both stores and required artwork.`:rehearsal||`${result.sessions} sessions and imported media validated.`}`); })().catch(error => set('backup','attention',error.message))
    ];
    await Promise.all(jobs);
    if (tableReport === report) { report.running = false; render(); }
  }
  async function click(event) {
    const button = event.target.closest('[data-reliable]'); if (!button) return;
    const kind = button.dataset.reliable, id = button.dataset.id;
    if (kind === 'resync') host.resync();
    else if (kind === 'run-table-check') { await runTableCheck(); return; }
    else if (kind === 'fix-tv') { host.openTV(); host.resync(); }
    else if (kind === 'fix-phones') { close(); host.openPhones(); }
    else if (kind === 'fix-audio') { close(); host.openAudio(); }
    else if (kind === 'fix-assets') { close(); host.openAssets(); }
    else if (kind === 'fix-storage') { tab='backup'; render(); return; }
    else if (kind === 'fix-backup') await host.downloadBackup();
    else if (kind === 'confirm-audio' && tableStatus()?.checks.audio?.status === 'confirm') {
      tableReport.checks.audio = { status: 'ready', detail: 'Sound heard at the table.' };
    }
    else if (kind === 'check-offline') await checkOffline();
    else if(kind==='check-storage'){const e=await navigator.storage?.estimate?.();storageSummary=e?.quota?`${Math.round((e.usage||0)/1048576)} MB of ${Math.round(e.quota/1048576)} MB used (${Math.round(100*(e.usage||0)/e.quota)}%).`:'Storage estimate unavailable; export a backup before large changes.';}
    else if(kind==='prune-points'){host.toast(await host.pruneRestorePoints(Number($('recovery-keep').value)));}
    else if (kind === 'create-point') await host.createRestorePoint('Manual restore point', 'manual');
    else if (kind === 'restore-point') await host.restorePoint(id);
    else if (kind === 'download-point') await host.downloadPoint(id);
    else if(kind==='example-campaign')await host.createCampaign('Lantern Ferry · example',true);
    else if (kind === 'new-campaign') await host.createCampaign();
    else if (kind === 'switch') await host.switchCampaign(id);
    else if (kind === 'duplicate') await host.duplicateCampaign(id);
    else if (kind === 'archive') await host.archiveCampaign(id, true);
    else if (kind === 'unarchive') await host.archiveCampaign(id, false);
    else if (kind === 'package') {button.disabled=true;try{await host.downloadPackage();}finally{button.disabled=false;}}
    else if (kind === 'rehearse') {button.disabled=true;try{verification=await host.rehearseBackup();host.toast(verification);}finally{button.disabled=false;}}
    else if (kind === 'download-backup') await host.downloadBackup();
    else if (kind === 'browser-data') await host.downloadBrowserData();
    else if (kind === 'restore-backup') $('load-campaign-button').click();
    render();
  }
  function tableStatus(){
    if(!host||tableReport?.campaignId!==host.campaignId||tableReport?.sessionId!==host.sessionId)return null;
    const result=JSON.parse(JSON.stringify(tableReport));
    if(Date.now()-result.started>15*60000){result.expired=true;for(const key of Object.keys(result.checks))if(result.checks[key].status==='ready')result.checks[key]={status:'attention',detail:'Earlier table check expired after 15 minutes. Run it again.'};}
    if(result.checks.tv?.status==='ready'&&host.connection().level!=='connected')result.checks.tv={status:'attention',detail:host.connection().label};
    return result;
  }
  function tableAction(kind){if(!['fix-tv','fix-phones','fix-audio','fix-assets','fix-storage','fix-backup','confirm-audio'].includes(kind))return;return click({target:{closest:()=>({dataset:{reliable:kind}})}});}
  function init(context) {
    host = context;
    if(globalThis.ECHO_CURRENT_STATUS_UI)void globalThis.ECHO_CURRENT_STATUS_UI.init(context);
    globalThis.ECHO_TABLE_REHEARSAL_UI?.init(context);
    $('open-reliability').onclick = () => open(globalThis.ECHO_CURRENT_STATUS_UI?'status':'health');
    $('close-reliability').onclick = close;
    $('reliability-scrim').onclick = close;
    $('reliability-tabs').onclick = event => { const button = event.target.closest('[data-reliability-tab]'); if (button) { tab = button.dataset.reliabilityTab; render(); } };
    $('reliability-content').addEventListener('click', event => { void click(event).catch(error => {recoveryIssue=error.message||'That action could not be completed.';host.toast(recoveryIssue);render();}); });
    $('reliability-content').addEventListener('change', async event => {
      if (event.target.id !== 'reliability-verify-file') return;
      const file = event.target.files?.[0]; if (!file) return;
      try { const archive=JSON.parse(await file.text()),result = validateArchive(archive); verification = result.valid
        ? await host.rehearseBackup(archive)
        : `Incomplete backup: missing ${result.missingMedia.join(', ')}.`; }
      catch (error) { verification = error.message; }
      if($('reliability-other-tools'))$('reliability-other-tools').open=true;
      render();
    });
    window.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('reliability-drawer').hidden) { event.stopImmediatePropagation(); close(); } }, true);
  }
  globalThis.ECHO_RELIABILITY = { VERSION, versionOf, assertSupported, normalizeRegistry, validateArchive,
    setRecoveryIssue:message=>{recoveryIssue=String(message);render();},publicPayload, visibleTokens, init, open, close, render, refreshConnection, runTableCheck, tableStatus, tableAction };
})();

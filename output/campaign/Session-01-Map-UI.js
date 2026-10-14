(() => {
  'use strict';
  let host, tab = 'scene', selected = null;
  const $ = id => document.getElementById(id);
  const h = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text;
    if (cls) e.className = cls; parent.appendChild(e); return e; };
  const btn = (parent, text, fn) => { const b = h('button', text, parent); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const field = (parent, title, value, fn, type = 'text') => { const l = h('label', title, parent, 'map-field');
    const i = document.createElement('input'); i.setAttribute('aria-label',title);i.type = type; i.value = value ?? ''; if (type === 'checkbox') i.checked = !!value;
    i.addEventListener('change', () => fn(type === 'checkbox' ? i.checked : i.value)); l.appendChild(i); return i; };
  const select = (parent, title, value, options, fn) => { const l = h('label', title, parent, 'map-field'); const s = h('select', null, l);s.setAttribute('aria-label',title);
    for (const [key, name] of options) { const o = h('option', name, s); o.value = key; } s.value = value;
    s.addEventListener('change', () => fn(s.value)); return s; };
  const section = (parent, title, note) => { const s = h('section', null, parent, 'map-section'); h('h3', title, s); if (note) h('p', note, s, 'help'); return s; };
  const uid = () => `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const scene = () => host.scene();
  const map = () => host.map();
  const save = label => host.commit(label);
  function open(target = 'scene') { tab = target; $('map-drawer').hidden = false; $('map-scrim').hidden = false; render(); }
  function close() { $('map-drawer').hidden = true; $('map-scrim').hidden = true; host.setPreview(false); host.setTool('move'); }
  function render() {
    if (!host || $('map-drawer').hidden) return;
    $('map-context').textContent = host.sceneName();
    for (const b of $('map-tabs').querySelectorAll('button')) b.classList.toggle('active', b.dataset.mapTab === tab);
    const root = $('map-content'); root.replaceChildren();
    ({ scene: renderScene, vision: renderVision, tokens: renderTokens, explore: renderExplore, display: renderDisplay }[tab] || renderScene)(root);
  }
  function renderScene(root) {
    let s = section(root, 'View and navigation', 'Pan and zoom are saved with this scene. Fit returns to the full map.');
    const row = h('div', null, s, 'map-row');
    btn(row, '− Zoom', () => { scene().view.zoom = Math.max(1, +(scene().view.zoom - .25).toFixed(2)); save('Zoom map'); });
    h('strong', `${Math.round(scene().view.zoom * 100)}%`, row);
    btn(row, '+ Zoom', () => { scene().view.zoom = Math.min(scene().floorFog?12:3, +(scene().view.zoom + .25).toFixed(2)); save('Zoom map'); });
    btn(row, 'Fit map', () => { scene().view = { zoom: 1, panX: 0, panY: 0 }; save('Fit map'); });
    btn(row, 'Drag to pan', () => { host.setTool('pan'); closeKeepTool(); });
    btn(row, 'Previous scene', () => host.goBack()).disabled = !map().history.length;
    field(s, 'Floor or level label', scene().floor, v => { scene().floor = v.slice(0, 40); save('Set floor'); });
    const sections=host.floorSections?.()||[];
    if(sections.length){const d=h('details',null,s);h('summary','Floor sections · one saved dungeon',d);h('p','Stage a closer view. Tokens, fog and object records stay on this floor.',d,'help');for(const item of sections)btn(d,item.title,()=>host.focusFloor(item.id));btn(d,'Effects & soundscapes',()=>globalThis.ECHO_ATMOSPHERE_UI?.open());}
    const overlays=host.floorOverlays?.()||[];
    if(overlays.length){const d=h('details',null,s);h('summary','Discovered hidden passages · DM review',d);h('p','Confirm discovery before enabling a passage. This changes the drawing only; fog remains and no gate becomes usable automatically.',d,'help');for(const item of overlays)field(d,item.title,(scene().floorReveals||[]).includes(item.id),value=>{scene().floorReveals=value?[...new Set([...(scene().floorReveals||[]),item.id])]:(scene().floorReveals||[]).filter(id=>id!==item.id);save('Reviewed discovered passage artwork');},'checkbox');}
    s = section(root, 'Scene layers', 'Choose what the DM sees and what appears on the table TV.');
    const grid = h('div', null, s, 'map-layer-grid');
    for (const name of ['map', 'grid', 'fog', 'tokens', 'labels', 'templates', 'annotations', 'markers']) {
      const row = h('div', null, grid, 'map-layer-row'); h('strong', name[0].toUpperCase() + name.slice(1), row);
      field(row, 'DM', scene().dmLayers[name], v => { scene().dmLayers[name] = v; save(`${name} DM layer`); }, 'checkbox');
      field(row, 'TV', scene().playerLayers[name], v => { scene().playerLayers[name] = v; save(`${name} TV layer`); }, 'checkbox');
    }
    s = section(root, 'Player view', 'Preview hides private markers and uses the player layers.');
    field(s, 'Allow player movement and exploration requests', map().playerInput, v => { map().playerInput = v; save('Player input'); }, 'checkbox');
    btn(s, host.preview() ? 'End player preview' : 'Preview player TV here', () => { host.setPreview(!host.preview()); render(); });
    s = section(root, 'Scene links', 'Place a stair or doorway link on the map, then choose its destination here.');
    btn(s, 'Place link on map', () => { host.setTool('link'); closeKeepTool(); });
    for (const link of scene().links) {
      const item = h('div', null, s, 'map-list-row'); field(item, 'Name', link.title, v => { link.title = v.slice(0, 80); save('Rename link'); });
      select(item, 'Destination', link.target, host.scenes().map(x => [x.id, x.title]), v => { link.target = v; save('Set link destination'); });
      field(item, 'Show on TV', link.visible, v => { link.visible = v; save('Show link'); }, 'checkbox');
      btn(item, 'Go', () => host.changeScene(link.target)); btn(item, 'Delete', () => { scene().links = scene().links.filter(x => x.id !== link.id); save('Delete link'); });
    }
    const count = host.performance(); h('p', `${count.tokens} placed tokens · ${count.lines} barriers · ${count.points} points · DM render ${Math.round(count.renderMs)} ms${host.viewport() ? ` · TV render ${Math.round(count.playerRenderMs)} ms` : ''}${count.warning ? ' · ' + count.warning : ''}`, root, 'map-performance');
  }
  function renderVision(root) {
    let s = section(root, 'Light and sight', scene().floorFog ? 'This large floor uses precise manual fog. Focus a tactical section, click or drag to reveal; Shift conceals. Character sight does not reveal unreviewed walls automatically.' : 'Light is a visual cue. Use the wall-aware reveal for precise fog changes; manual reveal remains available.');
    btn(s,'Character vision, memory & dungeon records',()=>globalThis.ECHO_DUNGEON_UI?.open());
    select(s, 'Ambient light', scene().light, [['bright','Bright light'],['dim','Dim light'],['dark','Darkness']], v => { scene().light = v; save('Light preset'); });
    select(s, 'Player vision preview', scene().vision, [['normal','Normal sight'],['darkvision','Darkvision']], v => { scene().vision = v; save('Vision preset'); });
    btn(s, 'Place torch or light', () => { host.setTool('light'); closeKeepTool(); });
    for (const light of scene().lights) {
      const item = h('div', null, s, 'map-list-row'); h('strong', `Light at ${Math.round(light.x)}%, ${Math.round(light.y)}%`, item);
      select(item, 'Type', light.kind, [['torch','Torch'],['spell','Spell'],['ambient','Ambient']], v => { light.kind = v; save('Light type'); });
      field(item, 'Radius (% of map width)', light.radius, v => { light.radius = Math.max(1, Math.min(100, Number(v) || 20)); save('Light radius'); }, 'number');
      field(item, 'On', light.enabled, v => { light.enabled = v; save('Toggle light'); }, 'checkbox');
      btn(item, 'Delete', () => { scene().lights = scene().lights.filter(x => x.id !== light.id); save('Delete light'); });
    }
    s = section(root, 'Walls, doors, and secret passages', 'Choose a tool, then drag a line on the DM map. Closed lines block reveal rays.');
    const row = h('div', null, s, 'map-row');
    for (const kind of ['wall','door','secret']) btn(row, `Draw ${kind}`, () => { host.setTool(kind); closeKeepTool(); });
    for (const line of scene().lines) {
      const item = h('div', null, s, 'map-list-row'); h('strong', `${line.kind} · ${Math.round(line.x1)},${Math.round(line.y1)} → ${Math.round(line.x2)},${Math.round(line.y2)}`, item);
      if (line.kind !== 'wall') field(item, 'Open', globalThis.ECHO_DUNGEON_UI?.doorOpen(line.id) ?? line.open, v => { line.open = v; globalThis.ECHO_DUNGEON_UI?.doorChanged(line.id,v); save('Toggle door'); }, 'checkbox');
      if (line.kind === 'secret') field(item, 'Discovered', line.discovered, v => { line.discovered = v; save('Reveal secret'); }, 'checkbox');
      btn(item, 'Delete', () => { scene().lines = scene().lines.filter(x => x.id !== line.id); save('Delete barrier'); });
    }
    s = section(root, 'Fog reveal', 'Select a placed hero and reveal visible squares within a radius. Walls and closed doors stop the reveal.');
    field(s, 'Fine reveal grid (32 × 20)', scene().fineFog, v => host.setFineFog(v), 'checkbox');
    const heroes = host.tokens().filter(t => t.placed && t.scene === host.sceneId() && t.team === 'pc');
    const tokenSelect = select(s, 'From hero', heroes[0]?.id || '', heroes.map(t => [t.id, t.name]), () => {});
    const radius = field(s, 'Radius (% of map width)', 18, () => {}, 'number');
    btn(s, 'Reveal visible area', () => host.revealVisible(tokenSelect.value, Number(radius.value)));
    h('p', 'For exact exceptions, drag on the shaded map squares to reveal or re-cover them.', s, 'help');
  }
  function renderTokens(root) {
    let s = section(root, 'Token group', 'Check a group, then drag one selected token to move all selected tokens together.');
    const onScene = host.tokens().filter(t => t.placed && t.scene === host.sceneId());
    for (const t of onScene) {
      const item = h('div', null, s, 'map-list-row');
      field(item, t.name, map().group.includes(t.id), v => { map().group = v ? [...new Set([...map().group, t.id])] : map().group.filter(id => id !== t.id); save('Token group'); }, 'checkbox');
      btn(item, t.visible ? 'Hide from TV' : 'Reveal on TV', () => { t.visible = !t.visible; save(`${t.name} ${t.visible ? 'revealed' : 'hidden'}`); });
      btn(item, 'Edit', () => { selected = t.id; render(); });
    }
    if (!onScene.length) h('p', 'Place tokens on the map to edit them here.', s, 'help');
    const t = host.tokens().find(x => x.id === selected);
    if (!t) return;
    s = section(root, t.name, 'Changes to appearance are saved with the campaign.');
    const meta = map().tokenMeta[t.id] ||= { size: 'medium', facing: 0, elevation: 0, portrait: '' };
    select(s, 'Size', meta.size, ['tiny','small','medium','large','huge','gargantuan'].map(x => [x,x]), v => { meta.size = v; save('Token size'); });
    field(s, 'Facing (degrees)', meta.facing, v => { meta.facing = Math.max(0, Math.min(359, Number(v) || 0)); save('Token facing'); }, 'number');
    field(s, 'Elevation (feet)', meta.elevation, v => { meta.elevation = Math.max(-500, Math.min(500, Number(v) || 0)); save('Token elevation'); }, 'number');
    const upload = h('label', 'Portrait image', s, 'map-field'); const file = h('input', null, upload); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp';
    file.addEventListener('change', async () => { if (!file.files?.[0]) return;
      try { meta.portrait = await host.importPortrait(file.files[0]); save('Token portrait'); }
      catch (error) { host.toast(error.message || 'Portrait could not be loaded.'); } });
    btn(s, 'Clear portrait', () => { meta.portrait = ''; save('Clear portrait'); });
    btn(s, 'Duplicate token', () => host.duplicateToken(t.id));
  }
  function renderExplore(root) {
    const isRegion = host.sceneId() === 'region-lmop';
    let s = section(root, isRegion ? 'Phandelver journey' : 'Discoverable points', isRegion
      ? 'Click a star on the DM map or choose a location below. Only shown and approved locations appear on the player TV.'
      : 'Place a point, enter a player-safe clue, then approve it. On town maps, players can open approved clues directly on the TV; private notes stay on the DM screen.');
    if (isRegion) {
      field(s, 'Animate journey map', scene().journeyMotion !== false, v => {
        scene().journeyMotion = v; save(v ? 'Animate journey map' : 'Pause journey map animation');
      }, 'checkbox');
      h('p', 'Gentle water, woodland mist, and glowing known locations. Reduced motion pauses these effects on both screens.', s, 'help');
      const points = scene().points;
      const active = points.find(p => p.id === selected) || points.find(p => p.id === 'region-phandalin') || points[0];
      if (active) {
        const card = h('div', null, s, 'region-location-card');
        h('h4', active.title, card);
        h('p', active.clue, card, 'region-player-clue');
        h('p', active.note, card, 'region-dm-note');
        for(const note of host.continuityNotes?.(active.id)||[])h('p',note,card,'region-dm-note');
        btn(card,'Open campaign event record',()=>globalThis.ECHO_STORY_UI?.open('continuity'));
        if(globalThis.ECHO_TRAVEL_UI && active.id.startsWith('region-'))btn(card,'Manage discovery, travel & arrival',()=>globalThis.ECHO_TRAVEL_UI.open(active.id));
        else {field(card, 'Show location on player map', active.visible, v => { active.visible = v; save(`${active.title} map visibility`); }, 'checkbox');
        field(card, 'Allow players to open its clue', active.approved, v => { active.approved = v; save(`${active.title} exploration approval`); }, 'checkbox');}
        const actions = h('div', null, card, 'map-row');
        btn(actions, 'Show clue on TV', () => host.showClue(active));
        if (host.regionScene(active.id)) btn(actions, 'Show detailed map on TV', () => { host.openRegionScene(active.id); close(); });
        const edit = h('details', null, card, 'region-location-edit');
        h('summary', 'Edit location text', edit);
        field(edit, 'Title', active.title, v => { active.title = v.slice(0, 80); save('Point title'); });
        field(edit, 'Player clue', active.clue, v => { active.clue = v.slice(0, 1000); save('Point clue'); });
        field(edit, 'Private note', active.note, v => { active.note = v.slice(0, 1000); save('Point note'); });
        if (!active.id.startsWith('region-')) btn(edit, 'Delete custom location', () => {
          scene().points = scene().points.filter(p => p.id !== active.id); selected = null; save('Delete point');
        });
      }
      const list = h('div', null, s, 'region-location-list');
      for (const p of points) {
        const travel=globalThis.ECHO_TRAVEL_UI?.status?.(p.id),shown=travel?globalThis.ECHO_TRAVEL.known(travel):p.visible&&p.approved;
        const button = btn(list, `${shown ? '✦' : '◇'} ${p.title}${travel?' · '+travel.status:''}`, () => { selected = p.id; render(); });
        button.classList.toggle('active', p.id === active?.id);
        button.title = shown ? 'Visible and interactive on the TV' : 'Hidden or awaiting approval';
      }
      btn(s, 'Place custom location', () => { host.setTool('point'); closeKeepTool(); });
    } else {
      btn(s, 'Place point on map', () => { host.setTool('point'); closeKeepTool(); });
      for (const p of scene().points) {
        const item = h('div', null, s, 'map-list-row'); field(item, 'Title', p.title, v => { p.title = v.slice(0, 80); save('Point title'); });
        for(const note of host.continuityNotes?.(p.id)||[])h('p',note,item,'help');
        field(item, 'Player clue', p.clue, v => { p.clue = v.slice(0, 1000); save('Point clue'); });
        field(item, 'Private note', p.note, v => { p.note = v.slice(0, 1000); save('Point note'); });
        field(item, 'Show marker', p.visible, v => { p.visible = v; save('Point visibility'); }, 'checkbox');
        field(item, 'Approve player interaction', p.approved, v => { p.approved = v; save('Point approval'); }, 'checkbox');
        btn(item, 'Show clue on TV', () => host.showClue(p));
        btn(item, 'Delete', () => { scene().points = scene().points.filter(x => x.id !== p.id); save('Delete point'); });
      }
    }
    s = section(root, 'Exploration clock', 'Advance time in minutes. Timers count down; the DM chooses when effects and encounters happen.');
    const clock = map().clock;
    h('strong', `${Math.floor(clock.minutes / 60)}h ${clock.minutes % 60}m elapsed`, s);
    const row = h('div', null, s, 'map-row');
    for (const [text, minutes] of [['1 minute',1],['10 minutes',10],['Travel hour',60],['Watch',240],['Short rest',60],['Long rest',480]])
      btn(row, `+ ${text}`, () => host.advanceTime(minutes, text));
    const name = field(s, 'New timer name', '', () => {}); const length = field(s, 'Duration (minutes)', 60, () => {}, 'number');
    const kind = select(s, 'Timer type', 'torch', [['torch','Torch'],['spell','Spell'],['travel','Travel'],['watch','Watch'],['hazard','Hazard'],['custom','Other']], () => {});
    btn(s, 'Add timer', () => { if (!name.value.trim()) return; clock.timers.push({ id: uid(), name: name.value.trim().slice(0,80), remaining: Math.max(1, Number(length.value) || 1), kind: kind.value }); save('Add exploration timer'); });
    for (const timer of clock.timers) { const item = h('div', null, s, 'map-list-row');
      h('strong', `${timer.name} (${timer.kind}): ${timer.remaining} min${timer.remaining === 0 ? ' · due' : ''}`, item);
      btn(item, 'End', () => { clock.timers = clock.timers.filter(x => x.id !== timer.id); save('End timer'); }); }
    field(s, 'Hazard reminder', clock.hazard, v => { clock.hazard = v.slice(0,300); save('Hazard reminder'); });
    field(s, 'Wandering encounter check every N minutes (0 = off)', clock.wanderEvery, v => { clock.wanderEvery = Math.max(0, Math.min(1000, Number(v) || 0)); save('Wandering interval'); }, 'number');
  }
  function renderDisplay(root) {
    let s = section(root, 'Table TV calibration', 'Choose a saved display. Measure the visible screen width, then set your preferred physical grid square.');
    const displays = map().displays, d = displays[map().displayIndex];
    select(s, 'Display', String(map().displayIndex), displays.map((x, i) => [String(i),x.name]), v => { map().displayIndex = Number(v); save('Select display'); });
    btn(s, 'Add display', () => { displays.push({ ...d, name: `Table TV ${displays.length + 1}` }); map().displayIndex = displays.length - 1; save('Add display'); });
    field(s, 'Display name', d.name, v => { d.name = v.slice(0,40); save('Display name'); });
    field(s, 'Resolution width (px)', d.width, v => { d.width = Math.max(640, Number(v) || 1920); save('Display resolution'); }, 'number');
    field(s, 'Resolution height (px)', d.height, v => { d.height = Math.max(480, Number(v) || 1080); save('Display resolution'); }, 'number');
    field(s, 'Visible screen width (inches)', d.physicalWidth, v => { d.physicalWidth = Math.max(10, Number(v) || 43); save('Display width'); }, 'number');
    field(s, 'Grid square size (inches)', d.squareInches, v => { d.squareInches = Math.max(.5, Number(v) || 1); save('Grid size'); }, 'number');
    field(s, 'Safe edge (%)', d.safeEdge, v => { d.safeEdge = Math.max(0, Math.min(15, Number(v) || 0)); save('Safe edge'); }, 'number');
    select(s, 'Orientation', d.orientation, [['landscape','Landscape'],['portrait','Portrait']], v => { d.orientation = v; save('Orientation'); });
    field(s, 'Lock physical grid scale', d.scaleLock, v => { d.scaleLock = v; save('Scale lock'); }, 'checkbox');
    const presentation=section(root,'Player TV presentation','Quiet table keeps the same calibrated grid and map layout, with restrained decoration. These options affect presentation only.');
    select(presentation,'Table-display preset',d.tvPreset,[['quiet','Quiet table'],['classic','Decorated / classic']],v=>{d.tvPreset=v;save('TV presentation preset');});
    field(presentation,'Show objective overlay',d.showObjective,v=>{d.showObjective=v;save('TV objective visibility');},'checkbox');
    field(presentation,'Show narration subtitles',d.showSubtitles,v=>{d.showSubtitles=v;save('TV subtitle visibility');},'checkbox');
    h('p','On the TV, use Controls & interaction to enable visible controls and permitted map interactions. Turn it off for the quiet table view. Escape also closes interaction mode. DM permission still controls player movement and exploration.',presentation,'help');
    const result = host.calibration(); h('p', result.fits ? `At full screen, squares are about ${result.actualSquare.toFixed(2)} inches.` : `Requested scale will not fit; fitted squares are about ${result.actualSquare.toFixed(2)} inches. Reduce grid size or use a larger display.`, s, 'map-performance');
    const viewport = host.viewport();
    const actualRatio = viewport ? viewport.width / viewport.height : null;
    const configuredRatio = d.width / d.height;
    if (!viewport) h('p', 'Open the player TV to check the display against its saved resolution.', s, 'map-performance');
    else if (Math.abs(actualRatio - configuredRatio) > .2) h('p', 'The player TV window does not match the saved resolution or orientation. Move it to the TV and enter full screen.', s, 'map-performance');
    btn(s, 'Open player TV · full screen preset', () => host.openPlayer());
    btn(s, host.calibrationCheck() ? 'Hide TV readability check' : 'Show TV readability check', () => { host.setCalibrationCheck(!host.calibrationCheck()); render(); });
    h('p', 'On the TV, check the gold safe edge, actual token labels, sample ruler text, and contrast from every seat. Rotate the TV or update its display setting, then hide the check before play.', s, 'help');
    h('p', 'On the player screen, press Full screen. Browser security requires that click on the TV window.', s, 'help');
  }
  function closeKeepTool() { $('map-drawer').hidden = true; $('map-scrim').hidden = true; host.setPreview(false); }
  function place(kind, at) {
    const item = { id: uid(), x: at.x, y: at.y };
    if (kind === 'point') { scene().points.push({ ...item, title: 'New point', clue: '', note: '', visible: false, approved: false }); selected = item.id; }
    if (kind === 'light') scene().lights.push({ ...item, radius: 20, kind: 'torch', enabled: true });
    if (kind === 'link') scene().links.push({ ...item, title: 'Stairs or door', target: host.scenes()[0]?.id || '', visible: false });
    host.setTool('move'); save(`Place ${kind}`); open(kind === 'point' ? 'explore' : kind === 'light' ? 'vision' : 'scene');
  }
  function selectMarker(kind, id) { selected = id; open(kind === 'point' ? 'explore' : kind === 'light' ? 'vision' : 'scene'); }
  function init(value) { host = value; $('open-map').addEventListener('click', () => open()); $('close-map').addEventListener('click', close);
    $('map-scrim').addEventListener('click', close); $('map-tabs').addEventListener('click', event => {
      const button = event.target.closest('[data-map-tab]'); if (button) { tab = button.dataset.mapTab; render(); } }); }
  globalThis.ECHO_MAP_UI = { init, open, close, render, place, selectMarker };
})();

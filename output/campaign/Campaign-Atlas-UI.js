/* Private atlas browser. Publication passes only ECHO_ATLAS's whitelisted projection. */
(() => {
  'use strict';
  if (globalThis.location?.hash === '#player') return;
  const styleURL = new URL('./Campaign-Atlas.css', document.currentScript?.src || document.baseURI).href;
  const NS = 'http://www.w3.org/2000/svg';
  const list = value => Array.isArray(value) ? value : [];
  const text = value => value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const clone = value => JSON.parse(JSON.stringify(value));
  let host, root, homeRoot, compact = false, homeQuery = '', current = '', selected = '', staged = null, expanded = false, error = '', query = '', filter = '', scope = 'board', limit = 30;
  let navHistory = [], searchResults, detailsRoot, stageRoot, mapViewport, mapGroup, mapSVG, mapZoomLabel, toolbarButton, prepareButton, listening = false, permissionReviewed = false;
  const views = new Map();
  const model = () => globalThis.ECHO_ATLAS;
  const data = () => host?.data?.() || globalThis.ECHO_ATLAS_DATA;
  const travel = () => host?.travel?.() || {places: [], routes: []};
  const isPlayer = () => globalThis.location?.hash === '#player';
  const alive = () => !isPlayer() && root?.isConnected;
  const image = path => host?.image ? host.image(path) : path;
  const el = (tag, value, parent, cls) => {
    const node = document.createElement(tag);
    if (value != null) node.textContent = text(value);
    if (cls) node.className = cls;
    parent?.append(node);
    return node;
  };
  const svg = (tag, attributes, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes || {})) node.setAttribute(key, value);
    parent?.append(node);
    return node;
  };
  function report(failure) {
    error = failure?.message || text(failure);
    host?.toast?.(error);
    if (alive()) renderStage();
  }
  function button(parent, title, action, cls) {
    const node = el('button', title, parent, cls);
    node.type = 'button';
    node.addEventListener('click', () => {
      if (isPlayer()) return;
      Promise.resolve().then(action).catch(report);
    });
    return node;
  }
  function paragraph(parent, title, value, cls) {
    if (value == null || value === '' || Array.isArray(value) && !value.length) return;
    const node = el('p', null, parent, cls);
    if (title) el('strong', title + ': ', node);
    el('span', Array.isArray(value) ? value.map(text).join(' · ') : value, node);
  }
  function details(parent, title) {
    const node = el('details', null, parent, 'story-card');
    el('summary', title, node);
    return node;
  }
  function preparationTarget(row) {
    const target = model().board(data(), row?.targetBoardId || row?.boardId);
    const place = model().location(data(), row?.locationId || row?.destinationLocationId);
    return {target, place};
  }
  function openPreparation(row) {
    const {target, place} = preparationTarget(row);
    if (target) navigate(target.id);
    else if (place) selectLocation(place.id);
    else {
      const section = root?.querySelector('[data-atlas-preparation]');
      if (section) section.open = true;
      const card = [...(section?.querySelectorAll('[data-preparation-id]') || [])].find(node => node.dataset.preparationId === row?.id);
      if (card) { card.tabIndex = -1; card.scrollIntoView({block: 'nearest'}); card.focus({preventScroll: true}); }
    }
  }
  function preparationLink(parent, row) {
    const {target, place} = preparationTarget(row);
    if (target || place) button(parent, target ? 'Open map: ' + target.title : 'View place: ' + place.name, () => openPreparation(row));
  }
  function preparationText(value) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return [value.title || value.source, value.printedPage ? 'printed p. ' + value.printedPage : '', value.note || value.description].filter(Boolean).join(' · ');
    return '';
  }
  function preparationRows(parent, heading, rows, kind) {
    if (!list(rows).length) return;
    el('h4', heading, parent);
    for (const value of rows) {
      const row = typeof value === 'string' ? {title: value} : value;
      if (!row || typeof row !== 'object') continue;
      const {place} = preparationTarget(row), item = el('div', null, parent, 'atlas-related');
      if (row.id) item.dataset.preparationId = row.id;
      el('strong', row.title || place?.name || row.direction || 'Preparation', item);
      paragraph(item, 'Service', row.service);
      paragraph(item, '', row.note || row.description);
      if (kind === 'service') {
        const terms = [];
        if (row.available != null) terms.push('Availability: ' + String(row.available));
        if (row.price != null) terms.push('Price: ' + String(row.price));
        if (row.agreement != null) terms.push('Agreement: ' + String(row.agreement));
        if (['available', 'price', 'agreement', 'stock'].some(key => Object.hasOwn(row, key) && row[key] == null)) terms.push('Availability and terms need confirmation');
        paragraph(item, '', terms, 'help');
        const people = (host.links?.({npcIds: list(row.npcIds)})?.npcs || []).filter(row => row.title !== 'Contact reference unavailable').map(({id, title, available}) => ({id, title, available}));
        if (people.length) linked(item, 'Contacts', people, host.openNpc);
        else if (row.contactName) paragraph(item, 'Contact', row.contactName);
      }
      if (kind === 'route') paragraph(item, 'Route', [row.direction, Number.isFinite(row.distanceMiles) ? row.distanceMiles + ' miles' : 'Distance not set'].filter(Boolean));
      paragraph(item, 'Source', preparationText(row.source));
      preparationLink(item, row);
    }
  }
  function renderPreparation(parent, preparation) {
    if (!preparation || typeof preparation !== 'object') return;
    const section = details(parent, 'Run this stop'); section.dataset.atlasPreparation = '';
    paragraph(section, 'Opening', preparation.opening);
    preparationRows(section, 'Arrival points', preparation.arrivalPoints, 'arrival');
    preparationRows(section, 'Districts', preparation.districts, 'district');
    preparationRows(section, 'Services & contacts', preparation.serviceContacts, 'service');
    preparationRows(section, 'Onward routes', preparation.onwardRoutes, 'route');
    if (list(preparation.decisionsToConfirm).length) {
      el('h4', 'Decisions to confirm', section);
      const items = el('ul', null, section);
      for (const item of preparation.decisionsToConfirm) el('li', preparationText(item), items);
    }
  }
  function renderPlayNotes(parent, notes) {
    if (!notes || typeof notes !== 'object') return;
    const fields = [['exploration', 'Exploration'], ['conversation', 'Conversation'], ['combat', 'Combat'], ['cover', 'Cover'], ['elevation', 'Elevation'], ['movement', 'Movement'], ['furniture', 'Furniture'], ['storage', 'Storage'], ['exits', 'Exits'], ['sceneUses', 'Ways to use the scene']];
    if (!notes.summary && !fields.some(([field]) => list(notes[field]).length)) return;
    const section = details(parent, 'Use this layout');
    paragraph(section, '', notes.summary);
    for (const [field, title] of fields) if (list(notes[field]).length) {
      el('h4', title, section); const items = el('ul', null, section);
      for (const item of notes[field]) el('li', preparationText(item), items);
    }
  }
  function style() {
    if (document.getElementById('campaign-atlas-style')) return;
    const link = document.createElement('link');
    link.id = 'campaign-atlas-style'; link.rel = 'stylesheet'; link.href = styleURL;
    document.head.append(link);
  }
  function currentView() {
    if (!views.has(current)) views.set(current, model().view(host?.extras?.()?.atlas?.views?.[current]));
    return views.get(current);
  }
  function invalidateStage() { staged = null; error = ''; permissionReviewed = false; }
  function saveView() {
    host?.saveView?.(current, clone(currentView()));
  }
  function transform(group, board, value) {
    const [x, y, width, height] = model().viewBox(board), cx = x + width / 2, cy = y + height / 2;
    group.setAttribute('transform', `translate(${cx + value.panX * width / 100} ${cy + value.panY * height / 100}) scale(${value.zoom}) translate(${-cx} ${-cy})`);
  }
  function updateMap() {
    const board = model().board(data(), current);
    if (mapGroup && board) transform(mapGroup, board, currentView());
    if (mapZoomLabel) mapZoomLabel.textContent = `${Math.round(currentView().zoom * 100)}%`;
  }
  function changeView(patch, persist = true) {
    views.set(current, model().view({...currentView(), ...patch}));
    invalidateStage(); updateMap();
    if (persist) saveView();
    renderStage();
  }
  function navigate(id, remember = true) {
    if (!model().board(data(), id)) throw Error('This atlas view is not prepared.');
    if (remember && current && id !== current) navHistory.push(current);
    if (id !== current) homeQuery = '';
    current = id; selected = ''; limit = 30; invalidateStage(); render();
  }
  function goBack() {
    const id = navHistory.pop() || model().board(data(), current)?.parentId;
    if (id) navigate(id, false);
  }
  function selectLocation(id) {
    const place = model().location(data(), id);
    if (!place) return;
    if (!model().boardLocations(data(), current).some(row => row.id === id)) {
      const target = list(place.boardIds).find(value => model().board(data(), value)) || Object.keys(place.placements || {}).find(value => model().board(data(), value));
      if (target && target !== current) navigate(target);
    }
    selected = id;
    if (compact) renderCompact(); else { renderLocation(); renderResults(); }
  }
  function marker(group, point, title, status, width, onSelect, extraClass = '', labelPlacement=null) {
    const pin = svg('g', {transform: `translate(${point.x} ${point.y})`, class: `atlas-pin atlas-pin-${status} ${extraClass}`}, group);
    svg('circle', {r: width * (width>4000?.0025:.004), 'vector-effect': 'non-scaling-stroke'}, pin);
    if(labelPlacement)svg('line',{x1:0,y1:0,x2:labelPlacement.x-point.x,y2:labelPlacement.y-point.y,stroke:'#eee4ae','stroke-width':width*.0005},pin);
    const label = svg('text', {x:labelPlacement?labelPlacement.x-point.x:0,y:labelPlacement?labelPlacement.y-point.y:-width * (width>4000?.004:.009), 'text-anchor': labelPlacement?'start':'middle', 'font-size': labelPlacement?.fontSize||width * (width>4000?.007:.013)}, pin);
    label.textContent = title;
    const hint = svg('title', {}, pin); hint.textContent = title;
    if (onSelect) {
      pin.setAttribute('role', 'button'); pin.setAttribute('tabindex', '0'); pin.setAttribute('aria-label', title + ' · ' + status);
      pin.addEventListener('pointerdown', event => event.stopPropagation());
      pin.addEventListener('click', event => { event.stopPropagation(); if (!isPlayer()) onSelect(); });
      pin.addEventListener('keydown', event => {
        if (['Enter', ' '].includes(event.key)) { event.preventDefault(); if (!isPlayer()) onSelect(); }
      });
    }
  }
  function draw(parent, board, payload) {
    const box = model().viewBox(board), [x, y, width, height] = box;
    const viewport = el('div', null, parent, payload ? 'atlas-viewport atlas-public-preview' : 'atlas-viewport');
    const canvas = svg('svg', {viewBox: box.join(' '), preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': (payload ? 'Staged player map: ' : 'Private atlas: ') + board.title}, viewport);
    const group = svg('g', {}, canvas);
    const path = payload ? board.image : board.image || board.publicImage;
    if (path) svg('image', {href: image(path), x, y, width, height, preserveAspectRatio: 'none'}, group);
    else {
      svg('rect', {x, y, width, height, fill: '#20352e'}, group);
      const note = svg('text', {x: x + width / 2, y: y + height / 2, 'text-anchor': 'middle', fill: '#d7d2b6', 'font-size': width / 30}, group);
      note.textContent = 'Artwork not prepared';
    }
    for(const rawFeature of list(payload?.features || board.features)) {
      const offset=!payload&&board.labelPlacements?.[rawFeature.id];
      const feature=offset?{...rawFeature,labelX:offset.x,labelY:offset.y,fontSize:offset.fontSize}:rawFeature;
      const points=list(feature.points);
      if(points.length>1)svg(feature.closed?'polygon':'polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:feature.kind==='water'?'#8cd8e7':feature.kind==='road'?'#f2d69b':'#a8c898','stroke-width':width*(feature.kind==='road'?.0018:.0007),'stroke-dasharray':feature.kind==='road'?`${width*.004} ${width*.002}`:'','stroke-opacity':feature.kind==='terrain'?.45:.8},group);
      if(Number.isFinite(feature.labelX)&&Number.isFinite(feature.labelY)){const label=svg('text',{x:feature.labelX,y:feature.labelY,'text-anchor':'start','font-size':feature.fontSize||width*(board.labelScale||.013)*.9,fill:'#fff4cb',stroke:'#173027','stroke-width':width*.0005,'paint-order':'stroke'},group);label.textContent=feature.title;}
    }
    if (!payload) for (const point of list(board.dmPoints)) {
      if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) continue;
      marker(group, point, point.title || 'Service', 'hidden', width, () => openPreparation(point), 'atlas-service-marker', board.labelPlacements?.[point.id]);
    }
    if(!payload)for(const area of list(board.proposalAreas)) {
      if(list(area.points).length>2)svg('polygon',{points:area.points.map(p=>`${p.x},${p.y}`).join(' '),fill:'#b887ea','fill-opacity':.12,stroke:'#d5a4ff','stroke-width':width*.002,'stroke-dasharray':`${width*.007} ${width*.004}`},group);
      if(Number.isFinite(area.labelX)&&Number.isFinite(area.labelY)){const label=svg('text',{x:area.labelX,y:area.labelY,fill:'#f7ceff','font-size':width*(board.labelScale||.013)},group);label.textContent=area.title+' · '+(area.kind||'proposed area');}
    }
    const routes = payload?.routes || list(data().routes).filter(route => route.boardId === board.id);
    for (const route of routes) {
      const points = list(route.points).length > 1 ? route.points : [model().placement(model().location(data(), route.from), board.id), model().placement(model().location(data(), route.to), board.id)].filter(Boolean);
      if (points.length > 1) svg('polyline', {points: points.map(point => `${point.x},${point.y}`).join(' '), class: `atlas-route atlas-route-${route.kind || 'route'}`, fill: 'none', 'stroke-width': width * 0.002, 'vector-effect': 'non-scaling-stroke'}, group);
    }
    if (payload) {
      for (const place of payload.places) if (Number.isFinite(place.x) && Number.isFinite(place.y)) marker(group, place, place.title, place.status, width,null,'',Number.isFinite(place.labelX)?{x:place.labelX,y:place.labelY,fontSize:place.fontSize}:null);
      if (payload.position) marker(group, payload.position, 'Party', 'party', width);
      transform(group, board, payload.view);
    } else {
      for (const place of model().boardLocations(data(), board.id)) {
        const point = model().placement(place, board.id);
        if (point) {
          const status = model().state(place, travel());
          marker(group, point, place.name, status.status, width, () => selectLocation(place.id), status.inaccessible ? 'atlas-inaccessible' : '',board.labelPlacements?.[place.id]);
        }
      }
      // Party position is shown only where a named, actually known travel location has a board placement.
      const ledger = travel();
      const party = model().boardLocations(data(), board.id).find(place => place.travelId === ledger.position?.placeId && model().known(model().state(place, ledger)));
      const position = model().placement(party, board.id);
      if (position) marker(group, position, 'Party', 'party', width);
      mapViewport = viewport; mapGroup = group; mapSVG = canvas;
      transform(group, board, currentView());
      pan(viewport, canvas);
    }
    return viewport;
  }
  function pan(viewport, canvas) {
    let drag = null;
    canvas.addEventListener('pointerdown', event => {
      if (isPlayer() || event.button !== 0) return;
      drag = {pointerId: event.pointerId, x: event.clientX, y: event.clientY, value: {...currentView()}};
      canvas.setPointerCapture?.(event.pointerId);
      viewport.classList.add('atlas-panning');
    });
    canvas.addEventListener('pointermove', event => {
      if (!drag || isPlayer() || drag.pointerId !== event.pointerId) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      changeView({panX: drag.value.panX + (event.clientX - drag.x) / rect.width * 100,
        panY: drag.value.panY + (event.clientY - drag.y) / rect.height * 100}, false);
    });
    const stop = event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag = null; viewport.classList.remove('atlas-panning');
      if (!isPlayer()) saveView();
    };
    canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('wheel', event => {
      if (!event.ctrlKey || isPlayer()) return;
      event.preventDefault();
      changeView({zoom: currentView().zoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15)});
    }, {passive: false});
  }
  function linked(parent, title, values, callback) {
    if (!list(values).length) return;
    el('h4', title, parent);
    for (const value of values) {
      const row = typeof value === 'string' ? {id: value, title: value} : value;
      const item = el('div', null, parent, 'atlas-related');
      if (callback && row.id && row.available !== false) button(item, row.title || row.name || row.id, () => callback(row.id));
      else el('strong', row.title || row.name || row.id, item);
      paragraph(item, '', row.detail || row.description);
    }
  }
  function renderLocation() {
    if (!alive() || !detailsRoot?.isConnected) return;
    detailsRoot.replaceChildren();
    const place = model().location(data(), selected);
    if (!place) { el('p', 'Choose a place on the map or in the list to see its description and connections.', detailsRoot, 'help'); return; }
    const status = model().state(place, travel());
    el('h3', place.name, detailsRoot);
    el('p', `${place.type || 'Location'} · ${status.status}${status.inaccessible ? ' · inaccessible' : ''}`, detailsRoot, 'story-note');
    if(['published-location','campaign-proposal'].includes(place.cartographyClass)){
      el('p',place.cartographyClass==='published-location'?'Published location':'Campaign addition · proposed placement',detailsRoot,'story-note atlas-source-badge');
      const placement=place.localPlacementValidation?.[current], source=placement?.source;
      paragraph(detailsRoot,'Placement confidence',String(placement?.basis||place.cartographyConfidence||place.placementBasis?.confidence||'Not assessed').replace(/-/g,' '));
      paragraph(detailsRoot,'Placement note',placement?.note||place.placementBasis?.description);
      if(source)paragraph(detailsRoot,'Map source',[source.source,source.printedPage?'printed p. '+source.printedPage:'',source.pdfPage?'PDF p. '+source.pdfPage:''].filter(Boolean));
      else{const ref=list(place.sourceRefs).find(ref=>ref&&typeof ref==='object'&&ref.locator);if(ref)paragraph(detailsRoot,'Source',[ref.source,ref.locator].filter(Boolean));}
    }
    paragraph(detailsRoot, 'Access', status.reason);
    paragraph(detailsRoot, 'Player description', place.publicDescription || 'No approved description is recorded.');
    if (place.dmDescription || list(place.notes).length) {
      const privateNotes = details(detailsRoot, 'Private preparation');
      paragraph(privateNotes, '', place.dmDescription);
      for (const note of list(place.notes)) paragraph(privateNotes, '', note);
    }
    const descendants = list(data().boards).filter(board => board.locationId === place.id && board.id !== current);
    const actions = el('div', null, detailsRoot, 'button-row');
    for (const board of descendants) button(actions, `Open ${board.title}`, () => navigate(board.id));
    if (place.travelId && host.openTravel) button(actions, 'Journey & discovery', () => host.openTravel(place.travelId));
    if (host.openDestination) button(actions, 'Existing destination tools', () => host.openDestination(place));
    const resolved = host.links?.(place) || {};
    linked(detailsRoot, 'Quests', resolved.quests || place.questIds, host.openQuest);
    linked(detailsRoot, 'People', resolved.npcs || place.npcIds, host.openNpc);
    linked(detailsRoot, 'Leads', resolved.leads || place.leadIds, host.openLead);
    linked(detailsRoot, 'Maps', resolved.maps || place.mapIds);
    if (list(place.sourceRefs).length) {
      const refs = details(detailsRoot, 'Source references');
      for (const ref of place.sourceRefs) paragraph(refs, '', typeof ref === 'string' ? ref : [ref.source, ref.locator, ref.verification].filter(Boolean).join(' · '));
    }
    if (!model().known(status)) el('p', 'This place has no exact player pin. Use the existing discovery tools when knowledge changes in play.', detailsRoot, 'help');
  }
  function renderResults() {
    if (!alive() || !searchResults?.isConnected) return;
    searchResults.replaceChildren();
    const records = model().search(data(), travel(), {query, status: filter, boardId: scope === 'board' ? current : ''});
    const count = el('p', `${Math.min(limit, records.length)} of ${records.length} places`, searchResults, 'help');
    count.setAttribute('role', 'status');
    const rows = el('div', null, searchResults, 'atlas-place-list');
    for (const place of records.slice(0, limit)) {
      const status = model().state(place, travel());
      const b = button(rows, `${place.name} · ${status.status}${status.inaccessible ? ' · inaccessible' : ''}`, () => selectLocation(place.id));
      b.setAttribute('aria-pressed', String(selected === place.id));
      if (selected === place.id) b.classList.add('primary');
    }
    if (!records.length) el('p', 'No matching places. Try the whole atlas or another search.', rows, 'help');
    if (records.length > limit) button(searchResults, 'Show more places', () => { limit += 30; renderResults(); });
  }
  function renderStage() {
    if (!alive() || !stageRoot?.isConnected) return;
    stageRoot.replaceChildren();
    if (error) el('p', error, stageRoot, 'ai-error').setAttribute('role', 'alert');
    const permission = model().gate(data(), travel(), current);
    const needsPermission = model().permissionRequired(data(), current);
    if(needsPermission){const label=el('label',null,stageRoot,'atlas-permission');const check=el('input',null,label);check.type='checkbox';check.checked=permissionReviewed;el('span','Players have permission to see these rooms',label);check.addEventListener('change',()=>{permissionReviewed=check.checked;staged=null;error='';renderStage();});}
    if(prepareButton)prepareButton.disabled=!permission.allowed||needsPermission&&!permissionReviewed;
    const controls = el('div', null, stageRoot, 'button-row');
    const showing=host.nowShowing?.();
    if(showing){el('p',`Now showing: ${showing}`,stageRoot,'story-note');button(controls,'Return TV to live scene',async()=>{await host.hide?.();renderStage();});}
    const stageButton = button(controls, 'Stage player view', async () => {
      const candidate = model().stage(data(), travel(), current, currentView(), {permissionReviewed});
      if (host.stage) await host.stage(clone(candidate.payload));
      staged = candidate; error = ''; renderStage();
    });
    stageButton.disabled = !permission.allowed || needsPermission&&!permissionReviewed;
    stageButton.title = permission.reason || 'Prepare a private preview of the exact player view';
    const showButton = button(controls, 'Show staged view on TV', async () => {
      const payload = model().assertStage(staged, data(), travel());
      if (!host.show) throw Error('TV display is not connected. The private preview is still available.');
      const result = await host.show(payload);
      if (result !== false) host.toast?.('Staged atlas view shown on TV.');
      renderStage();
    }, 'primary');
    showButton.disabled = !staged || !host.show || !permission.allowed || needsPermission&&!permissionReviewed;
    if (!permission.allowed) el('p', permission.reason, stageRoot, 'help');
    if (!staged) { el('p', 'Stage a reviewed player map here before showing it. Browsing leaves the live scene, fog and party position unchanged.', stageRoot, 'help'); return; }
    const preview = details(stageRoot, `Staged player preview · ${staged.payload.board.title}`);
    preview.open = true;
    draw(preview, staged.payload.board, staged.payload);
    const exact = staged.payload.places.filter(place => Number.isFinite(place.x)).length;
    el('p', `${exact} known map pins · ${staged.payload.rumors.length} rumors by name only`, preview, 'help');
    if (staged.payload.rumors.length) paragraph(preview, 'Rumors', staged.payload.rumors.map(row => row.title));
    button(preview, 'Discard staged view', () => { invalidateStage(); renderStage(); });
  }
  function selectControl(parent, title, value, options, action) {
    const label = el('label', title, parent, 'story-field'), input = el('select', null, label);
    input.setAttribute('aria-label', title);
    for (const [id, name] of options) el('option', name, input).value = id;
    input.value = value;
    input.addEventListener('change', () => { if (!isPlayer()) action(input.value); });
    return input;
  }
  function renderDungeonWorkflow(parent, workflow) {
    if(!workflow)return;
    const box=details(parent,'Dungeon preparation & routes · DM only');
    el('p','The first three expeditions use Level 1. Prepare deeper floors when the party chooses a verified connection. Knowing a gate is separate from activating or qualifying to use it.',box,'help');
    const diagram=details(box,'Private route diagram');
    const routeImage=el('img',null,diagram);
    routeImage.src='atlas/undermountain/Undermountain-Route-DM.svg';
    routeImage.alt='Private diagram of the Yawning Portal, conventional Level 1–3 descent, Skullport approaches and separate restricted gates';
    routeImage.style.cssText='display:block;width:100%;height:auto;max-width:1100px';
    const rows=list(workflow.connections);
    const routes=details(box,'Verified connections and restrictions');
    const endpoint=p=>p?'Level '+p.floor+(p.roomKey?' · '+p.roomKey:''):'';
    for(const route of rows){
      const card=details(routes,endpoint(route.fromEndpoint)+' → '+endpoint(route.toEndpoint)+' · '+route.kind);
      paragraph(card,'Route',route.note);
      for(const key of ['activation','requirements','restrictions','levelRestriction','minimumLevel','eldritchRune','availability','gateState'])if(route[key]!=null)paragraph(card,key.replace(/([A-Z])/g,' $1'),typeof route[key]==='object'?Object.entries(route[key]).map(([k,v])=>k+': '+v):String(route[key]));
      paragraph(card,'Source',list(route.sourceRefs).map(r=>'Dungeon of the Mad Mage · printed p. '+r.printedPage+(r.roomKeys?.length?' · '+r.roomKeys.join(', '):'')));
      for(const end of [route.fromEndpoint,route.toEndpoint]){const board=list(data().boards).find(b=>b.id==='undermountain-level-'+end?.floor);if(board)button(card,'Browse '+board.title,()=>navigate(board.id));}
    }
    const hooks=details(box,'Approved hooks and placement limits');
    for(const hook of list(workflow.preparedHooks)){paragraph(hooks,hook.title,[hook.path,hook.objective,hook.placementGuard,hook.guard].filter(Boolean));}
    const refuges=details(box,'Possible refuges · assess current occupants first');
    for(const refuge of list(workflow.refugeCandidates))paragraph(refuges,'Level '+refuge.floor+' · '+refuge.roomKey,[refuge.status,refuge.note].filter(Boolean));
    const steps=details(box,'Reusable floor preparation checklist');
    for(const step of list(workflow.workflow))paragraph(steps,step.title||step.name||step.step||'Prepare',typeof step==='string'?step:Object.entries(step).filter(([k])=>!['title','name','step'].includes(k)).flatMap(([,v])=>Array.isArray(v)?v:[typeof v==='object'?JSON.stringify(v):v]));
    el('p','Levels 2, 3 and Skullport currently retain private source maps and verified transit notes. Their room-by-room playable preparation waits for a chosen destination; no deeper connection is published by browsing here.',box,'help');
  }
  function renderCompact() {
    if (!alive()) return;
    root.replaceChildren(); root.classList.add('campaign-atlas','atlas-home');
    const board=model()?.board(data(),current);
    if(!board){el('p','The campaign atlas is not available.',root,'help');return;}
    const head=el('div',null,root,'atlas-home-head');
    const crumbs=el('nav',null,head,'atlas-breadcrumb');crumbs.setAttribute('aria-label','Atlas location');
    for(const item of model().breadcrumbs(data(),current)){const control=button(crumbs,item.title,()=>navigate(item.id));if(item.id===current)control.setAttribute('aria-current','page');}
    const tools=el('div',null,head,'button-row');
    button(tools,'−',()=>changeView({zoom:currentView().zoom/1.25})).setAttribute('aria-label','Zoom out');
    mapZoomLabel=el('span',`${Math.round(currentView().zoom*100)}%`,tools,'atlas-zoom-label');
    button(tools,'+',()=>changeView({zoom:currentView().zoom*1.25})).setAttribute('aria-label','Zoom in');
    button(tools,'Reset',()=>changeView({zoom:1,panX:0,panY:0}));
    draw(root,board);
    const search=el('label','Find a point of interest',root,'atlas-home-search');
    const input=el('input',null,search);input.type='search';input.value=homeQuery;input.placeholder='Search this map';input.setAttribute('aria-label','Find an atlas point of interest');
    const matches=el('div',null,root,'atlas-home-matches');
    const fillMatches=()=>{matches.replaceChildren();const term=homeQuery.toLocaleLowerCase().trim();if(!term)return;for(const place of model().boardLocations(data(),current).filter(place=>place.name.toLocaleLowerCase().includes(term)).slice(0,8))button(matches,place.name,()=>selectLocation(place.id));if(!matches.childElementCount)el('small','No matching place on this map. Open the full atlas to search everywhere.',matches);};
    input.addEventListener('input',()=>{homeQuery=input.value;fillMatches();});fillMatches();
    const foot=el('div',null,root,'atlas-home-foot');
    const place=model().location(data(),selected);
    if(place){const status=model().state(place,travel());const info=el('div',null,foot,'atlas-home-place');el('strong',place.name,info);el('span',`${place.type||'Location'} · ${status.status}${status.inaccessible?' · inaccessible':''}`,info);button(foot,'Open details',()=>open({boardId:current,locationId:selected}));}
    else el('p','Choose a marker for details. Browsing is private and does not move the party.',foot,'help');
    const children=model().children(data(),current);
    if(children.length){const row=el('div',null,root,'atlas-home-regions');for(const child of children)button(row,child.title,()=>navigate(child.id));}
    const actions=el('div',null,root,'button-row atlas-home-actions');
    if(board.parentId)button(actions,'← Back to wider map',goBack);
    button(actions,'Open full atlas',()=>open({boardId:current,locationId:selected}));
  }
  function render() {
    if (!alive()) return;
    if (compact) return renderCompact();
    root.replaceChildren(); root.classList.add('campaign-atlas'); root.classList.toggle('atlas-expanded', expanded);
    prepareButton = null;
    if (!data() || !model()) { el('p', 'The atlas data is not available in this campaign package.', root, 'help'); return; }
    const board = model().board(data(), current);
    if (!board) {
      const fallback = model().rootId(data());
      if (fallback !== current && model().board(data(), fallback)) { current = fallback; return render(); }
      el('p', 'No atlas overview has been prepared in this package.', root, 'help'); return;
    }
    el('p', 'DM atlas · Browse privately. Discovery follows Journey & travel.', root, 'story-note');
    const navigation = el('div', null, root, 'button-row atlas-navigation');
    const back = button(navigation, 'Back', goBack);
    back.disabled = !navHistory.length && !board.parentId;
    button(navigation, expanded ? 'Compact atlas' : 'Expand atlas', () => { expanded = !expanded; render(); });
    const crumb = el('nav', null, root, 'atlas-breadcrumb'); crumb.setAttribute('aria-label', 'Atlas location');
    for (const item of model().breadcrumbs(data(), current)) {
      const b = button(crumb, item.title, () => navigate(item.id));
      if (item.id === current) b.setAttribute('aria-current', 'page');
    }
    el('h2', board.title, root);
    const layout = el('div', null, root, 'atlas-layout');
    const main = el('section', null, layout, 'atlas-map-section');
    const controls = el('div', null, main, 'button-row');
    button(controls, '−', () => changeView({zoom: currentView().zoom / 1.25})).setAttribute('aria-label', 'Zoom out');
    mapZoomLabel = el('span', `${Math.round(currentView().zoom * 100)}%`, controls, 'atlas-zoom-label');
    button(controls, '+', () => changeView({zoom: currentView().zoom * 1.25})).setAttribute('aria-label', 'Zoom in');
    button(controls, 'Reset view', () => changeView({zoom: 1, panX: 0, panY: 0}));
    if(board.image||board.publicImage){draw(main, board);el('p', 'Drag to pan. Use +/− or Ctrl + scroll to zoom. Artwork is approximate; travel distances come from defined routes.', main, 'help');}
    else el('p','Location index · Choose a connected map below. Opening these maps is private.',main,'help');
    if(list(board.notes).length){const notes=details(main,'Map notes & precision');for(const note of board.notes)el('p',note,notes);}
    const proposal=model().proposal(board.proposalId);
    renderPreparation(main, board.settlementPreparation || board.preparation || proposal?.preparation);
    renderPlayNotes(main, proposal?.playNotes || board.playNotes);
    renderDungeonWorkflow(main,board.dungeonWorkflow);
    if(proposal){const floorLayout=!!proposal.floorProposalId;const campaignLayout=globalThis.WATERDEEP_MAP_COLLECTION?.maps.includes(proposal), review=details(main,campaignLayout?'Map layout & saved-map review':'Corrected layout & saved-map review');
      el('p',floorLayout?'These sections share one saved floor. Preparing a section stages its camera view; the floor keeps its current fog, tokens, objects and occupants. Show on TV remains a separate action.':campaignLayout?'This is a campaign layout for DM review. Preparing it creates a separate fog-covered map. It does not establish access, tenancy, repairs or party ownership.':'This source-based layout has different coordinates from the existing scenic map. Preparing it creates a separate fog-covered map. Existing tokens, fog, rooms and original map IDs remain intact.',review);
      paragraph(review,'Source',[proposal.source?.title,proposal.source?.printedMapPage?'map p. '+proposal.source.printedMapPage:'',proposal.scale?.measurementPrecision].filter(Boolean));
      paragraph(review,'Placement & precision',proposal.precision||proposal.scale?.scaleClaim);
      paragraph(review,'Access',proposal.accessRequirement);
      for(const ref of list(proposal.sourceRefs))paragraph(review,'Reference',[ref.source,ref.locator,ref.verification].filter(Boolean));
      if(list(proposal.entryPoints).length){
        const entries=details(review,'Entrances & return routes');
        for(const entry of proposal.entryPoints){
          const destination=model().proposal(entry.returnProposalId||entry.returnSceneId);
          const connected=destination?list(data().boards).find(row=>row.proposalId===destination.id):model().board(data(),entry.returnBoardId||entry.returnSceneId);
          const item=el('div',null,entries,'atlas-related');
          paragraph(item,entry.title||entry.id,[entry.kind,destination?.title||(entry.returnSceneId?host.sceneTitle?.(entry.returnSceneId):'')||connected?.title||'Return destination requires review',entry.note].filter(Boolean));
          if(connected)button(item,'Open connected map: '+connected.title,()=>navigate(connected.id));
          if(destination&&connected&&!host.sceneTitle?.(model().proposalSceneId(destination)))el('p','Atlas navigation is private. Prepare the destination as a separate battle map before using its saved-map exit link.',item,'help');
        }
      }
      if(proposal.currentImage){const old=el('img',null,review);old.src=image(proposal.currentImage);old.alt='Existing saved-map artwork for comparison';old.style.maxWidth='100%';}
      if(host.prepareMap)prepareButton=button(review,floorLayout?'Prepare saved floor view':'Prepare separate battle map',()=>host.prepareMap(proposal,{permissionReviewed}));
      el('p',floorLayout?'Stage player view shares the whole clean drawing. For play, use Prepare saved floor view and its precise manual fog.':'Stage player view shares this entire unkeyed layout. For gradual exploration, use the separate battle map and its fog tools.',main,'help');
    }
    const childBoards = model().children(data(), current);
    if (childBoards.length) {
      const dive = el('section', null, main, 'story-section');
      el('h3', board.kind === 'world' ? 'Choose a region' : 'Explore this area', dive);
      const choices = el('div', null, dive, 'atlas-child-boards');
      for (const child of childBoards) button(choices, child.title, () => navigate(child.id));
    }
    stageRoot = el('section', null, main, 'story-section atlas-stage');
    const side = el('section', null, layout, 'atlas-directory');
    const searchLabel = el('label', 'Find a place', side, 'story-field');
    const input = el('input', null, searchLabel); input.type = 'search'; input.value = query;
    input.placeholder = 'Name or campaign connection'; input.setAttribute('aria-label', 'Search atlas places');
    input.addEventListener('input', () => { if (!isPlayer()) { query = input.value; limit = 30; renderResults(); } });
    selectControl(side, 'Search area', scope, [['board', 'This view'], ['all', 'Whole atlas']], value => { scope = value; limit = 30; renderResults(); });
    selectControl(side, 'Discovery', filter, [['', 'All states'], ...model().states.map(state => [state, state]), ['inaccessible', 'inaccessible']], value => { filter = value; limit = 30; renderResults(); });
    detailsRoot = el('section', null, side, 'story-section atlas-location-details');
    searchResults = el('section', null, side);
    renderLocation(); renderResults(); renderStage();
  }
  function open(options = {}) {
    if (isPlayer() || !host) return false;
    style();
    globalThis.ECHO_HYBRID_UI?.go?.('explore',{context:false});
    compact = false;
    const next = options.boardId || current || model()?.rootId(data());
    if (next) current = next;
    if (options.locationId) selected = options.locationId;
    invalidateStage();
    host.content('Campaign atlas', node => { root = node; render(); });
    return true;
  }
  function mountHome(node) {
    if(isPlayer()||!host||!node)return false;
    style();homeRoot=node;root=node;compact=true;
    if(!current)current=model()?.rootId(data())||'';
    render();return true;
  }
  function mountButton() {
    if (isPlayer() || toolbarButton?.isConnected) return;
    const parent = document.getElementById('cockpit-tools-World');
    if (!parent) return;
    toolbarButton = button(parent, 'Campaign atlas', () => open());
    toolbarButton.id = 'open-campaign-atlas';
  }
  function init(options) {
    if (isPlayer() || typeof options?.content !== 'function') return false;
    host = options; mountButton();
    if (!listening) {
      listening = true;
      globalThis.addEventListener('keydown', event => { if (event.key === 'Escape' && expanded && alive()) { expanded = false; render(); } });
      globalThis.addEventListener('hashchange', () => {
        if (isPlayer()) { toolbarButton?.remove(); if (root?.isConnected) root.replaceChildren(); root = null; staged = null; }
        else mountButton();
      });
    }
    globalThis.ECHO_HYBRID_UI?.atlasReady?.();
    return true;
  }
  globalThis.ECHO_ATLAS_UI = {init, open, mountHome, refresh: () => { if (alive()) { invalidateStage(); render(); } },
    navigate: id => { if (!isPlayer() && host) navigate(id); },
    current: () => ({boardId: current, locationId: selected, staged: !!staged}),nowShowing:()=>host?.nowShowing?.()||''};
})();

/* DM atlas model. Pure reads of the shared travel ledger; no parallel discovery state. */
(() => {
  'use strict';
  if (globalThis.location?.hash === '#player') return;
  const states = ['hidden', 'rumored', 'located', 'visited', 'cleared'];
  const list = value => Array.isArray(value) ? value : [];
  const text = (value, max = 4000) => String(value ?? '').slice(0, max);
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
  const board = (data, id) => list(data?.boards).find(row => row.id === id) || null;
  const location = (data, id) => list(data?.locations).find(row => row.id === id) || null;
  const rootId = data => data?.rootBoardId || list(data?.boards).find(row => !row.parentId)?.id || 'world';
  const known = value => ['located', 'visited', 'cleared'].includes(value?.status);
  function state(place, travel) {
    const record = list(travel?.places).find(row => row.id === place?.travelId);
    return {status: states.includes(record?.status) ? record.status : 'hidden', inaccessible: record?.inaccessible === true,
      reason: text(record?.reason, 240), travelId: text(place?.travelId, 160)};
  }
  function view(raw = {}) {
    return {zoom: number(raw.zoom, 1, 0.75, 8), panX: number(raw.panX, 0, -150, 150), panY: number(raw.panY, 0, -150, 150)};
  }
  function viewBox(row) {
    const raw = row?.viewBox;
    if (!Array.isArray(raw) || raw.length !== 4 || !raw.every(v => Number.isFinite(Number(v))) || Number(raw[2]) <= 0 || Number(raw[3]) <= 0) return [0, 0, 100, 100];
    return raw.map(Number);
  }
  function point(raw) {
    return raw && Number.isFinite(Number(raw.x)) && Number.isFinite(Number(raw.y)) ? {x: Number(raw.x), y: Number(raw.y)} : null;
  }
  function placement(place, boardId) { return point(place?.placements?.[boardId]); }
  function boardLocations(data, boardId) {
    const row = board(data, boardId), ids = new Set(list(row?.locationIds));
    return list(data?.locations).filter(place => ids.has(place.id) || list(place.boardIds).includes(boardId) || !!place.placements?.[boardId]);
  }
  function breadcrumbs(data, boardId) {
    const path = [], seen = new Set();
    let row = board(data, boardId);
    while (row && !seen.has(row.id)) { seen.add(row.id); path.unshift(row); row = board(data, row.parentId); }
    return path;
  }
  function children(data, boardId) {
    const row = board(data, boardId), ids = new Set(list(row?.children));
    return list(data?.boards).filter(item => item.parentId === boardId || ids.has(item.id));
  }
  function search(data, travel, options = {}) {
    const query = text(options.query).trim().toLocaleLowerCase();
    const records = options.boardId ? boardLocations(data, options.boardId) : list(data?.locations);
    return records.filter(place => {
      const status = state(place, travel);
      if (options.status === 'inaccessible' ? !status.inaccessible : options.status && status.status !== options.status) return false;
      if (options.type && place.type !== options.type) return false;
      const haystack = [place.name, place.id, place.type, ...list(place.aliases), place.publicDescription, place.dmDescription, ...list(place.notes)].join(' ').toLocaleLowerCase();
      return !query || haystack.includes(query);
    });
  }
  function gate(data, travel, boardId) {
    const row = board(data, boardId);
    if (!row) return {allowed: false, reason: 'This atlas view is unavailable.'};
    // Every ancestor site gate matters: a known room cannot expose a hidden parent site.
    for (const ancestor of breadcrumbs(data, boardId)) {
      if (!ancestor.locationId) {
        if (ancestor.kind && !['world', 'region', 'collection', 'template'].includes(ancestor.kind)) return {allowed: false, reason: 'This site view needs a linked discovery record before it can be shown.'};
        continue;
      }
      const place = location(data, ancestor.locationId);
      if (!place || !known(state(place, travel))) return {allowed: false, reason: 'Locate this place in Journey & travel before staging its map for players.'};
    }
    if (row.publicImageApproved !== true || !text(row.publicImage).trim()) return {allowed: false, reason: 'This view has no reviewed player map. Private artwork stays in the DM atlas.'};
    return {allowed: true, reason: ''};
  }
  function routeKind(route, travel) {
    if (!route.travelRouteId) return 'route';
    if (list(travel?.plan?.legs).some(leg => leg.routeId === route.travelRouteId)) return 'planned';
    if (list(travel?.history).some(leg => leg.routeId === route.travelRouteId)) return 'traveled';
    return 'route';
  }
  function publicProjection(data, travel, boardId, rawView = {}) {
    if (!gate(data, travel, boardId).allowed) return null;
    const row = board(data, boardId), places = [], rumors = [], located = new Set();
    for (const place of boardLocations(data, boardId)) {
      const disclosure = state(place, travel);
      if (disclosure.status === 'hidden') continue;
      if (disclosure.status === 'rumored') {
        // A rumor carries a title only: no registry ID, exact pin, parent, image or lead.
        rumors.push({title: text(place.publicName || place.name, 200), status: 'rumored'});
        continue;
      }
      if (!known(disclosure)) continue;
      const pin = placement(place, boardId);
      const clean = {id: text(place.id, 160), travelId: disclosure.travelId, title: text(place.publicName || place.name, 200),
        status: disclosure.status, inaccessible: disclosure.inaccessible, reason: disclosure.reason};
      if (pin) { clean.x = pin.x; clean.y = pin.y; located.add(place.id); }
      const label=row.labelPlacements?.[place.id];
      if(pin&&point(label)){clean.labelX=label.x;clean.labelY=label.y;clean.fontSize=number(label.fontSize,viewBox(row)[2]*.013,viewBox(row)[2]*.003,viewBox(row)[2]*.04);}
      if (place.publicDescription) clean.description = text(place.publicDescription);
      places.push(clean);
    }
    const routes = [];
    for (const route of list(data?.routes)) {
      if (route.boardId !== boardId || route.public !== true || !located.has(route.from) || !located.has(route.to)) continue;
      if (route.travelRouteId) {
        const current = list(travel?.routes).find(item => item.id === route.travelRouteId);
        if (!current || current.published !== true) continue;
      }
      const points = list(route.points).map(point).filter(Boolean);
      const ends = [placement(location(data, route.from), boardId), placement(location(data, route.to), boardId)];
      routes.push({id: text(route.id, 160), from: route.from, to: route.to, kind: routeKind(route, travel), points: points.length > 1 ? points : ends});
    }
    let position = null;
    if (travel?.position?.visible === true && travel.position.placeId) {
      const place = places.find(item => item.travelId === travel.position.placeId && Number.isFinite(item.x));
      if (place) position = {x: place.x, y: place.y, title: place.title};
    }
    if(travel?.position?.visible===true&&!travel.position.placeId&&travel.plan?.started){
      const leg=travel.plan.legs?.[travel.plan.leg], route=list(travel.routes).find(r=>r.id===leg?.routeId);
      const a=places.find(p=>p.travelId===leg?.from&&Number.isFinite(p.x)), b=places.find(p=>p.travelId===leg?.to&&Number.isFinite(p.x));
      if(a&&b&&route?.published===true&&route.miles>0){const t=Math.max(0,Math.min(1,travel.plan.miles/route.miles));position={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,title:'On the road',from:a.id,to:b.id,fraction:t};}
    }
    // Whitelist construction is deliberate. Neither the private register nor raw boards leave this boundary.
    return {schemaVersion: 1, board: {id: text(row.publicId || row.id, 160), title: text(row.publicTitle || row.title, 200), kind: text(row.kind, 80),
      image: text(row.publicImage, 2000), viewBox: viewBox(row)}, view: view(rawView), places, rumors, routes, position,
      features:list(row.features).filter(f=>f.public===true&&f.sourceApproved===true&&['terrain','road','water'].includes(f.kind)).slice(0,200).map(f=>{const label=row.labelPlacements?.[f.id];return {id:text(f.id,160),kind:f.kind,title:text(f.title,200),points:list(f.points).map(point).filter(Boolean).slice(0,200),closed:f.closed===true,...(point(label)?{labelX:label.x,labelY:label.y,fontSize:label.fontSize}:Number.isFinite(f.labelX)&&Number.isFinite(f.labelY)?{labelX:f.labelX,labelY:f.labelY}:{}),public:true,sourceApproved:true};})};
  }
  function permissionRequired(data, boardId) { return breadcrumbs(data, boardId).some(row => proposal(row.proposalId)?.permissionRequired === true); }
  function stage(data, travel, boardId, rawView = {}, review = {}) {
    const permission = gate(data, travel, boardId);
    if (!permission.allowed) throw Error(permission.reason);
    if (permissionRequired(data, boardId) && review.permissionReviewed !== true) throw Error('Confirm that players have permission to see these rooms before staging.');
    const payload = publicProjection(data, travel, boardId, rawView);
    return {boardId, view: view(rawView), signature: JSON.stringify(payload), payload: clone(payload), permissionReviewed: review.permissionReviewed === true};
  }
  function assertStage(staged, data, travel) {
    if (!staged) throw Error('Stage this atlas view before showing it on TV.');
    const permission = gate(data, travel, staged.boardId);
    if (!permission.allowed) throw Error(permission.reason);
    if (permissionRequired(data, staged.boardId) && staged.permissionReviewed !== true) throw Error('Confirm room access and stage this map again.');
    const current = publicProjection(data, travel, staged.boardId, staged.view);
    if (JSON.stringify(current) !== staged.signature) throw Error('Discovery or map details changed after staging. Stage the current view again.');
    return current;
  }
  function travelDefinitions(data) {
    const seen = new Set();
    return list(data?.locations).filter(place => place.travelId && !seen.has(place.travelId) && seen.add(place.travelId)).map(place => {
      const pos = point(place.travelPosition) || placement(place, rootId(data)) || {x: 50, y: 50};
      return {id: place.travelId, x: pos.x, y: pos.y, title: text(place.name, 200),
        status: states.includes(place.initialStatus) ? place.initialStatus : 'hidden', inaccessible: false, reason: '', note: '',
        arrival: {scene: text(place.arrivalScene, 160), narration: text(place.publicDescription), ambience: ''}};
    });
  }
  function mergeTravelDefinitions(existing, data) {
    const ids = new Set(list(existing).map(row => row.id));
    return [...list(existing).map(clone), ...travelDefinitions(data).filter(row => !ids.has(row.id))];
  }
  function normalizeWorkspace(raw = {}) {
    return {version:1, views:Object.fromEntries(Object.entries(raw.views || {}).filter(([id])=>/^[\w-]{1,160}$/.test(id)).map(([id,value])=>[id,view(value)])),
      shown:raw.shown && typeof raw.shown.boardId==='string' ? {boardId:text(raw.shown.boardId,160),view:view(raw.shown.view),scene:text(raw.shown.scene,160),presentation:text(raw.shown.presentation,2000)} : null};
  }
  function proposals() {
    const seen = new Set();
    return [globalThis.PHANDELVER_MAP_COLLECTION, globalThis.WATERDEEP_MAP_COLLECTION, globalThis.UNDERMOUNTAIN_MAP_COLLECTION, globalThis.SATELLITE_MAP_COLLECTION, globalThis.TALES_MAP_COLLECTION, globalThis.TRAVEL_MAP_COLLECTION].flatMap(collection => list(collection?.maps))
      .filter(row => row && typeof row.id === 'string' && !seen.has(row.id) && seen.add(row.id));
  }
  function proposal(value) { return typeof value === 'string' ? proposals().find(row => row.id === value || row.proposalImage === value || row.sceneId === value) || null : null; }
  const rasterSources = new Set(['atlas/art/Waterdeep-City-Terrain.png', 'atlas/art/Leilon-Terrain.png', ...['leilon','neverwinter','luskan','daggerford','baldurs-gate'].map(name=>'atlas/settlements/'+name+'-Overview.svg')]);
  function rasterSource(value) { return typeof value === 'string' && rasterSources.has(value); }
  function proposalSceneId(value) {
    const row = typeof value === 'string' ? proposal(value) : value;
    if (!row || !proposal(row.id)) return '';
    const identity = row.floorProposalId && proposal(row.floorProposalId)?.isFloorMaster ? row.floorProposalId : row.id;
    let hash = 2166136261; for (const c of identity) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
    return 'atlas-source-' + hash.toString(16);
  }
  globalThis.ECHO_ATLAS = {normalizeWorkspace, proposals, proposal, proposalSceneId, rasterSource, permissionRequired, states, board, location, rootId, state, known, view, viewBox, placement, boardLocations,
    breadcrumbs, children, search, gate, publicProjection, stage, assertStage, travelDefinitions, mergeTravelDefinitions};
})();

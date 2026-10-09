/* Shared player renderer. It has no campaign definitions and never requests metadata. */
(() => {
  'use strict';
  const PUBLIC_IMAGES = new Set([
    ...['Sword-Coast', 'north', 'phandelver', 'high-road', 'waterdeep', 'interior-east', 'south'].map(name => `atlas/art/${name}-Terrain.png`),
    ...['phandalin', 'conyberry', 'thundertree'].map(name => `town-maps/professional/${name}-overhead.png`), 'town-maps/waterdeep-overhead.svg'
  ]);
  const list = value => Array.isArray(value) ? value : [];
  const text = (value, max = 1200) => typeof value === 'string' ? value.slice(0, max) : '';
  const num = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  const point = value => value && typeof value.x === 'number' && Number.isFinite(value.x) && typeof value.y === 'number' && Number.isFinite(value.y) ? {x: num(value.x, 0, -1e6, 1e6), y: num(value.y, 0, -1e6, 1e6)} : null;
  function imageSource(value) {
    if (typeof value !== 'string') return '';
    if (PUBLIC_IMAGES.has(value)) return value;
    if (value.length > 12_000_000) return '';
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match) return '';
    const prefixes = {png: /^iVBORw0KGgo/, jpeg: /^\/9j\//, webp: /^UklGR/};
    return prefixes[match[1]].test(match[2]) ? value : '';
  }
  function normalize(raw) {
    if (!raw || raw.schemaVersion !== 1 || !raw.board || typeof raw.board !== 'object') return null;
    const image = imageSource(raw.board.image);
    if (!image) return null;
    const sourceBox = raw.board.viewBox;
    const box = Array.isArray(sourceBox) && sourceBox.length === 4 && sourceBox.every(value => typeof value === 'number' && Number.isFinite(value)) && sourceBox[2] > 0 && sourceBox[3] > 0 ? [num(sourceBox[0], 0, -1e6, 1e6), num(sourceBox[1], 0, -1e6, 1e6), num(sourceBox[2], 100, 0.01, 1e6), num(sourceBox[3], 100, 0.01, 1e6)] : [0, 0, 100, 100];
    const places = [], rumors = [], seen = new Set(), rumorTitles = new Set();
    const rumor = title => { title = text(title, 200); if (title && !rumorTitles.has(title)) { rumorTitles.add(title); rumors.push({title, status: 'rumored'}); } };
    for (const row of list(raw.places).slice(0, 1000)) {
      if (!row || typeof row !== 'object') continue;
      if (row.status === 'rumored') { rumor(row.title); continue; }
      const id = text(row.id, 160);
      if (!['located', 'visited', 'cleared'].includes(row.status) || !id || seen.has(id)) continue;
      seen.add(id);
      const p = {id, travelId: text(row.travelId, 160), title: text(row.title, 200), status: row.status, inaccessible: row.inaccessible === true, reason: text(row.reason, 240)};
      const pos = point(row); if (pos) Object.assign(p, pos);
      const label = point({x: row.labelX, y: row.labelY});
      if (label) { p.labelX = label.x; p.labelY = label.y; }
      if (typeof row.fontSize === 'number' && Number.isFinite(row.fontSize)) p.fontSize = num(row.fontSize, box[2] * .0065, box[2] * .003, box[2] * .04);
      if (row.description) p.description = text(row.description, 4000);
      places.push(p);
    }
    for (const row of list(raw.rumors).slice(0, 1000)) if (row?.status === 'rumored') rumor(row.title);
    const pinned = new Set(places.filter(row => point(row)).map(row => row.id));
    const routes = list(raw.routes).slice(0, 1000).filter(row => row && pinned.has(row.from) && pinned.has(row.to) && row.public !== false && row.hidden !== true).map(row => ({id: text(row.id, 160), from: text(row.from, 160), to: text(row.to, 160), kind: ['planned', 'traveled'].includes(row.kind) ? row.kind : 'route', points: list(row.points).slice(0, 200).map(point).filter(Boolean)})).filter(row => row.points.length > 1);
    const features = list(raw.features).slice(0, 200).filter(row => row && row.public === true && row.sourceApproved === true && ['terrain', 'road', 'water'].includes(row.kind)).map(row => {
      const feature = {id: text(row.id, 160), kind: row.kind, title: text(row.title, 200), points: list(row.points).slice(0, 200).map(point).filter(Boolean), closed: row.closed === true, public: true, sourceApproved: true};
      const label = point({x: row.labelX, y: row.labelY});
      if (label) { feature.labelX = label.x; feature.labelY = label.y; }
      if (typeof row.fontSize === 'number' && Number.isFinite(row.fontSize)) feature.fontSize = num(row.fontSize, box[2] * .0058, box[2] * .003, box[2] * .04);
      return feature;
    }).filter(row => row.points.length);
    let position = null;
    const traveling = raw.position && (raw.position.from != null || raw.position.to != null || raw.position.fraction != null);
    if (traveling) {
      const {from, to, fraction} = raw.position;
      const start = places.find(row => row.id === from && point(row)), end = places.find(row => row.id === to && point(row));
      const linked = routes.some(route => route.from === from && route.to === to || route.from === to && route.to === from);
      if (start && end && from !== to && linked && typeof fraction === 'number' && Number.isFinite(fraction) && fraction >= 0 && fraction <= 1)
        position = {from, to, fraction, x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction, title: 'On the road'};
    } else {
      const pos = point(raw.position), located = pos && places.find(row => row.x === pos.x && row.y === pos.y);
      if (located) position = {...pos, title: located.title};
    }
    return {schemaVersion: 1, board: {id: text(raw.board.id, 160), title: text(raw.board.title, 200), kind: text(raw.board.kind, 80), image, viewBox: box},
      view: {zoom: num(raw.view?.zoom, 1, 0.75, 8), panX: num(raw.view?.panX, 0, -150, 150), panY: num(raw.view?.panY, 0, -150, 150)},
      places, rumors, routes, features, position};
  }
  function displayImage(clean, override) {
    if (override == null) return clean.board.image;
    if (typeof override === 'string' && /^\/api\/atlas-map(?:\?v=[a-f0-9]{1,64})?$/.test(override)) return override;
    return imageSource(override);
  }
  const NS = 'http://www.w3.org/2000/svg';
  const rendered = new WeakMap(), isolated = new WeakSet();
  function node(tag, attrs, parent, value) {
    const n = document.createElementNS(NS, tag);
    for (const [key, item] of Object.entries(attrs || {})) n.setAttribute(key, item);
    if (value != null) n.textContent = value;
    parent?.appendChild(n); return n;
  }
  function colors(status) { return status === 'visited' ? '#73b9a6' : status === 'cleared' ? '#a0c57b' : '#edc679'; }
  function featureLabel(feature) {
    return point({x: feature.labelX, y: feature.labelY});
  }
  const featureColor = feature => feature.kind === 'water' ? '#acc9d3' : feature.kind === 'road' ? '#d4c2a0' : '#d0d3b7';
  const markerScale = clean => clean.board.kind === 'world' ? {radius: .0035, font: .0065, offset: .0085, stroke: .0007, featureFont: .0058} : {radius: .006, font: .015, offset: .014, stroke: .0014, featureFont: .012};
  function render(container, raw, options = {}) {
    const clean = normalize(raw);
    const image = clean && displayImage(clean, options.image);
    if (!clean || !image) { container.replaceChildren(); rendered.delete(container); return null; }
    const signature = JSON.stringify([clean, image, options.rumors !== false]);
    const prior = rendered.get(container);
    if (prior?.signature === signature && prior.first === container.children[0]) return clean;
    if (!isolated.has(container)) {
      // Browsing the overlay must never bubble into battlefield movement or zoom handlers.
      for (const name of ['click', 'dblclick', 'contextmenu', 'pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend', 'wheel'])
        container.addEventListener(name, event => event.stopPropagation(), {passive: true});
      isolated.add(container);
    }
    container.replaceChildren();
    const [x, y, w, h] = clean.board.viewBox, cx = x + w / 2, cy = y + h / 2, v = clean.view, size = markerScale(clean);
    const svg = node('svg', {viewBox: clean.board.viewBox.join(' '), preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': clean.board.title, width: '100%', height: '100%', class: 'atlas-player-map'}, container);
    node('title', {}, svg, clean.board.title);
    const group = node('g', {transform: `translate(${cx + v.panX * w / 100} ${cy + v.panY * h / 100}) scale(${v.zoom}) translate(${-cx} ${-cy})`}, svg);
    node('image', {href: image, x, y, width: w, height: h, preserveAspectRatio: 'none'}, group);
    for (const feature of clean.features) {
      if (feature.points.length > 1) node(feature.closed ? 'polygon' : 'polyline', {points: feature.points.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: featureColor(feature), 'stroke-width': w * (feature.kind === 'terrain' ? .0007 : .0013), opacity: feature.kind === 'terrain' ? .45 : .75, 'stroke-dasharray': feature.kind === 'road' ? `${w * .003} ${w * .002}` : ''}, group);
      if (feature.title && featureLabel(feature)) {
        const label = featureLabel(feature);
        node('text', {x: label.x, y: label.y, 'text-anchor': 'start', 'font-size': feature.fontSize || w * size.featureFont, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: featureColor(feature), stroke: '#172b23', 'stroke-width': w * size.stroke / 2, 'paint-order': 'stroke'}, group, feature.title);
      }
    }
    for (const route of clean.routes) node('polyline', {points: route.points.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: route.kind === 'traveled' ? '#67c3ad' : '#d8b66d', 'stroke-width': w * 0.002, 'stroke-dasharray': route.kind === 'traveled' ? '' : `${w * 0.006} ${w * 0.004}`, 'vector-effect': 'non-scaling-stroke'}, group);
    const mark = (p, party) => {
      const label = point({x:p.labelX,y:p.labelY}), font = p.fontSize || w * size.font;
      if (label) node('line', {x1:p.x,y1:p.y,x2:label.x,y2:label.y+font*.2,stroke:'#e7d6ad','stroke-width':w*size.stroke*.55,opacity:.7,class:'atlas-label-leader'},group);
      const g = node('g', {transform: `translate(${p.x} ${p.y})`}, group);
      node('circle', {r: w * size.radius * (party ? 1.4 : 1), fill: party ? '#fff3ce' : colors(p.status), stroke: p.inaccessible ? '#de7967' : '#172b23', 'stroke-width': w * size.stroke}, g);
      node('text', {x:label?.x??p.x,y:label?.y??p.y-w*size.offset, 'text-anchor': label?'start':'middle', 'font-size': font, 'font-family': 'system-ui, sans-serif', 'font-weight': '650', fill: '#fff4d9', stroke: '#172b23', 'stroke-width': w * size.stroke / 2, 'paint-order': 'stroke'}, group, party ? 'Party' : p.title);
    };
    for (const p of clean.places) if (point(p)) mark(p, false);
    if (clean.position) mark(clean.position, true);
    if (options.rumors !== false && clean.rumors.length) {
      const note = document.createElement('p'); note.className = 'atlas-player-rumors';
      note.textContent = 'Rumored places: ' + clean.rumors.map(p => p.title).join(' · '); container.appendChild(note);
    }
    rendered.set(container, {signature, first: svg});
    // Input is only contained here; there are no movement callbacks or metadata requests.
    return clean;
  }
  async function renderToDataURL(raw, options = {}) {
    const clean = normalize(raw);
    if (!clean) throw Error('No approved atlas image is available.');
    const source = displayImage(clean, options.image);
    if (!source) throw Error('Atlas image is not approved for players.');
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(Error('Could not load the approved atlas image.')); image.src = source; });
    const [x, y, w, h] = clean.board.viewBox, canvas = document.createElement('canvas'), size = markerScale(clean);
    const scale = Math.min(num(options.width, 2048, 64, 4096) / w, 4096 / h);
    canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('Canvas rendering is unavailable.');
    ctx.fillStyle = '#172b23'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvas.width / w, canvas.height / h); ctx.translate(-x, -y);
    const cx = x + w / 2, cy = y + h / 2, v = clean.view;
    ctx.translate(cx + v.panX * w / 100, cy + v.panY * h / 100); ctx.scale(v.zoom, v.zoom); ctx.translate(-cx, -cy);
    ctx.drawImage(image, x, y, w, h);
    for (const feature of clean.features) {
      ctx.strokeStyle = featureColor(feature); ctx.lineWidth = w * (feature.kind === 'terrain' ? .0007 : .0013);
      ctx.setLineDash(feature.kind === 'road' ? [w * .003, w * .002] : []); ctx.globalAlpha = feature.kind === 'terrain' ? .45 : .75;
      ctx.beginPath(); feature.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      if (feature.closed) ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
      if (feature.title && featureLabel(feature)) {
        const label = featureLabel(feature); ctx.font = `italic ${feature.fontSize || w * size.featureFont}px Georgia, serif`; ctx.textAlign = 'left'; ctx.lineWidth = w * size.stroke;
        ctx.strokeStyle = '#172b23'; ctx.fillStyle = featureColor(feature); ctx.strokeText(feature.title, label.x, label.y); ctx.fillText(feature.title, label.x, label.y);
      }
    }
    for (const route of clean.routes) {
      ctx.strokeStyle = route.kind === 'traveled' ? '#67c3ad' : '#d8b66d'; ctx.lineWidth = w * 0.002;
      ctx.setLineDash(route.kind === 'traveled' ? [] : [w * 0.006, w * 0.004]); ctx.beginPath();
      route.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    }
    ctx.setLineDash([]);
    const mark = (p, party) => {
      const label = point({x:p.labelX,y:p.labelY}), font = p.fontSize || w * size.font;
      if (label) { ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(label.x,label.y+font*.2); ctx.strokeStyle='#e7d6ad'; ctx.lineWidth=w*size.stroke*.55; ctx.globalAlpha=.7; ctx.stroke(); ctx.globalAlpha=1; }
      ctx.beginPath(); ctx.arc(p.x, p.y, w * size.radius * (party ? 1.4 : 1), 0, Math.PI * 2);
      ctx.fillStyle = party ? '#fff3ce' : colors(p.status); ctx.fill(); ctx.strokeStyle = p.inaccessible ? '#de7967' : '#172b23'; ctx.lineWidth = w * size.stroke; ctx.stroke();
      ctx.font = `650 ${font}px system-ui, sans-serif`; ctx.textAlign = label?'left':'center'; ctx.lineWidth = w * size.stroke;
      ctx.strokeStyle = '#172b23'; ctx.fillStyle = '#fff4d9'; const title = party ? 'Party' : p.title;
      ctx.strokeText(title, label?.x??p.x, label?.y??p.y-w*size.offset); ctx.fillText(title, label?.x??p.x, label?.y??p.y-w*size.offset);
    };
    for (const p of clean.places) if (point(p)) mark(p, false);
    if (clean.position) mark(clean.position, true);
    return canvas.toDataURL('image/png');
  }
  globalThis.ECHO_ATLAS_VIEW = {normalize, render, renderToDataURL, imageSource};
})();

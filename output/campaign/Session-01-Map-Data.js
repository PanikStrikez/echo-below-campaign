(() => {
  'use strict';
  const clamp = (v, a, b, fallback = a) => Number.isFinite(Number(v)) ? Math.max(a, Math.min(b, Number(v))) : fallback;
  const point = v => clamp(v, 0, 100, 50);
  const id = v => String(v || '').slice(0, 80);
  const label = (v, n = 120) => String(v || '').slice(0, n);
  const layers = () => ({ map: true, grid: true, fog: true, tokens: true, labels: true, templates: true, annotations: true, markers: true });
  function scene(raw = {}) {
    raw ||= {};
    const cleanLine = line => ({ id: id(line.id), kind: ['wall', 'door', 'secret'].includes(line.kind) ? line.kind : 'wall',
      x1: point(line.x1), y1: point(line.y1), x2: point(line.x2), y2: point(line.y2),
      open: line.open === true, discovered: line.discovered === true });
    const cleanPoint = p => ({ id: id(p.id), x: point(p.x), y: point(p.y), title: label(p.title, 80),
      clue: label(p.clue, 1000), note: label(p.note, 1000), visible: p.visible === true, approved: p.approved === true });
    const cleanLink = p => ({ id: id(p.id), x: point(p.x), y: point(p.y), title: label(p.title, 80),
      target: id(p.target), visible: p.visible === true });
    const cleanLight = p => ({ id: id(p.id), x: point(p.x), y: point(p.y), radius: clamp(p.radius, 1, 100, 20),
      kind: ['torch', 'spell', 'ambient'].includes(p.kind) ? p.kind : 'torch', enabled: p.enabled !== false });
    return { floor: label(raw.floor, 40), fineFog: raw.fineFog === true, journeyMotion: raw.journeyMotion !== false,
      journeyArtVersion: Math.round(clamp(raw.journeyArtVersion, 0, 1, 0)),
      light: ['bright', 'dim', 'dark'].includes(raw.light) ? raw.light : 'bright',
      vision: ['normal', 'darkvision'].includes(raw.vision) ? raw.vision : 'normal',
      dmLayers: { ...layers(), ...Object.fromEntries(Object.entries(raw.dmLayers || {}).filter(([k, v]) => k in layers() && typeof v === 'boolean')) },
      playerLayers: { ...layers(), ...Object.fromEntries(Object.entries(raw.playerLayers || {}).filter(([k, v]) => k in layers() && typeof v === 'boolean')) },
      floorFog: globalThis.ECHO_FLOOR_MAPS?.resolution(raw.floorFog) || null,
      floorReveals: Array.isArray(raw.floorReveals)?[...new Set(raw.floorReveals.filter(v=>typeof v==='string'&&/^[\w-]{1,100}$/.test(v)))].slice(0,80):[],
      view: { zoom: clamp(raw.view?.zoom, 1, 12, 1), panX: clamp(raw.view?.panX, -550, 550, 0), panY: clamp(raw.view?.panY, -550, 550, 0) },
      lines: Array.isArray(raw.lines) ? raw.lines.slice(0, 150).map(cleanLine) : [],
      points: Array.isArray(raw.points) ? raw.points.slice(0, 100).map(cleanPoint) : [],
      links: Array.isArray(raw.links) ? raw.links.slice(0, 60).map(cleanLink) : [],
      lights: Array.isArray(raw.lights) ? raw.lights.slice(0, 60).map(cleanLight) : [] };
  }
  function normalize(raw = {}) {
    raw ||= {};
    const display = d => ({ name: label(d?.name || 'Table TV', 40), width: clamp(d?.width, 640, 7680, 1920),
      height: clamp(d?.height, 480, 4320, 1080), physicalWidth: clamp(d?.physicalWidth, 10, 120, 43),
      squareInches: clamp(d?.squareInches, .5, 3, 1), safeEdge: clamp(d?.safeEdge, 0, 15, 3),
      orientation: d?.orientation === 'portrait' ? 'portrait' : 'landscape', scaleLock: d?.scaleLock === true,
      tvPreset:d?.tvPreset==='classic'?'classic':'quiet',showObjective:d?.showObjective!==false,showSubtitles:d?.showSubtitles!==false });
    const displays = Array.isArray(raw.displays) && raw.displays.length ? raw.displays.slice(0, 8).map(display) : [display()];
    return { displays, displayIndex: Math.round(clamp(raw.displayIndex, 0, displays.length - 1, 0)),
      playerInput: raw.playerInput !== false, preview: false,
      scenes: Object.fromEntries(Object.entries(raw.scenes || {}).slice(0, 100).map(([k, v]) => [id(k), scene(v)])),
      tokenMeta: Object.fromEntries(Object.entries(raw.tokenMeta || {}).slice(0, 250).map(([k, v]) => [id(k), {
        size: ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'].includes(v?.size) ? v.size : 'medium',
        facing: Math.round(clamp(v?.facing, 0, 359, 0)), elevation: Math.round(clamp(v?.elevation, -500, 500, 0)),
        portrait: label(v?.portrait, 100) }])),
      group: Array.isArray(raw.group) ? raw.group.slice(0, 50).map(id) : [],
      history: Array.isArray(raw.history) ? raw.history.slice(-20).map(id) : [],
      clock: { minutes: Math.round(clamp(raw.clock?.minutes, 0, 10000000, 0)),
        combatSeconds: Math.round(clamp(raw.clock?.combatSeconds, 0, 59, 0)),
        timers: Array.isArray(raw.clock?.timers) ? raw.clock.timers.slice(0, 50).map(t => ({ id: id(t.id),
          name: label(t.name, 80), remaining: Math.round(clamp(t.remaining, 0, 100000, 0)), kind: label(t.kind, 30) })) : [],
        hazard: label(raw.clock?.hazard, 300), wanderEvery: Math.round(clamp(raw.clock?.wanderEvery, 0, 1000, 0)) } };
  }
  function publicScene(s) {
    return { light: s.light, vision: s.vision, fineFog: s.fineFog, journeyMotion: s.journeyMotion !== false, view: s.view, playerLayers: s.playerLayers,
      lines: s.lines.filter(l => l.kind !== 'secret' || l.discovered).map(l => ({ ...l })),
      points: s.points.filter(p => p.visible && p.approved).map(({ id, x, y, title }) => ({ id, x, y, title })),
      links: s.links.filter(l => l.visible).map(l => ({ ...l })), lights: s.lights.filter(l => l.enabled).map(l => ({ ...l })) };
  }
  function intersects(a, b, c, d) {
    const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const u = cross(a, b, c), v = cross(a, b, d), w = cross(c, d, a), z = cross(c, d, b);
    return u * v < 0 && w * z < 0;
  }
  function blocked(from, to, lines) { return lines.some(l => !l.open && intersects(from, to,
    { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 })); }
  function visibleTiles(from, radius, lines, fineFog = false) {
    const result = [];
    const rows = fineFog ? 20 : 10, cols = fineFog ? 32 : 16;
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const to = { x: (col + .5) * 100 / cols, y: (row + .5) * 100 / rows };
      if (Math.hypot(to.x - from.x, (to.y - from.y) * 2 / 3) <= radius && !blocked(from, to, lines)) result.push(`${row},${col}`);
    }
    return result;
  }
  function calibration(display, columns, viewportWidth, viewportHeight) {
    const usableWidth = viewportWidth * (1 - display.safeEdge / 50) - 42;
    const usableHeight = viewportHeight * (1 - display.safeEdge / 50) - 175;
    const wanted = columns * display.squareInches * viewportWidth / display.physicalWidth;
    const fits = wanted <= usableWidth && wanted / 1.5 <= usableHeight;
    const width = Math.max(100, Math.floor(display.scaleLock ? Math.min(wanted, usableWidth, usableHeight * 1.5) : Math.min(usableWidth, usableHeight * 1.5)));
    return { width, fits, actualSquare: width / columns * display.physicalWidth / viewportWidth };
  }
  function displayTitle(value){return [...new Set(String(value||'The Echo Below').split(/\s*[·|]\s*/).filter(Boolean))].join(' · ');}
  globalThis.ECHO_MAP_DATA = { displayTitle,normalize, scene, publicScene, blocked, visibleTiles, calibration };
})();

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = require('node:path').join(__dirname, '..');
const context = { globalThis: {} };
vm.runInNewContext(fs.readFileSync(require('node:path').join(root, 'Session-01-Map-Data.js'), 'utf8'), context);
const api = context.globalThis.ECHO_MAP_DATA;
const saved = api.normalize({ displays: [{ name: 'Table', width: 3840, height: 2160, physicalWidth: 48, squareInches: 1, safeEdge: 3, scaleLock: true }],
  scenes: { cave: { light: 'dark', lines: [{ id: 'secret', kind: 'secret', x1: 50, y1: 0, x2: 50, y2: 100 }],
    points: [{ id: 'clue', x: 30, y: 30, title: 'Clue', clue: 'Player clue', note: 'DM only', visible: true, approved: true },
      { id: 'hidden', x: 70, y: 30, title: 'Secret', note: 'Hidden', visible: false, approved: false }] } } });
assert.equal(saved.displays[0].width, 3840);
assert.equal(saved.scenes.cave.light, 'dark');
assert.equal(saved.clock.combatSeconds, 0);
assert.equal(api.normalize({ clock: { minutes: 4, combatSeconds: 48 } }).clock.combatSeconds, 48);
const view = api.publicScene(saved.scenes.cave);
assert.equal(view.lines.length, 0);
assert.equal(view.points.length, 1);
assert.equal(view.points[0].note, undefined);
assert.equal(view.points[0].clue, undefined);
assert.deepEqual(Array.from(api.visibleTiles({ x: 25, y: 50 }, 70, saved.scenes.cave.lines)).some(key => Number(key.split(',')[1]) > 7), false);
saved.scenes.cave.lines[0].open = true;
assert.deepEqual(Array.from(api.visibleTiles({ x: 25, y: 50 }, 70, saved.scenes.cave.lines)).some(key => Number(key.split(',')[1]) > 7), true);
assert.ok(api.visibleTiles({ x: 25, y: 50 }, 70, [], true).length > api.visibleTiles({ x: 25, y: 50 }, 70, []).length);
const fit = api.calibration(saved.displays[0], 30, 1920, 1080);
assert.ok(fit.width > 0 && fit.actualSquare > 0);
for (const file of ['Session-01-TV-Display.html', 'Session-01-Loader.js', 'Session-01-Battleboard.js', 'Session-01-Map-UI.js'])
  assert.ok(fs.existsSync(require('node:path').join(root, file)));
const html = fs.readFileSync(require('node:path').join(root, 'Session-01-TV-Display.html'), 'utf8');
for (const id of ['open-map', 'map-drawer', 'map-scrim', 'map-tabs', 'map-content', 'player-stage']) assert.ok(html.includes(`id="${id}"`));
console.log('Map checks passed: save shape, private data, wall-aware visibility, calibration, and controls.');

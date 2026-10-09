const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
global.location = { hash: '', protocol: 'file:' };
global.window = global;
for (const file of ['LMOP-Visual-Catalog.js', 'Session-02-Runbook.js', 'Session-Content-Packs.js',
  'Session-01-Party-Data.js', 'Session-01-Combat-Data.js', 'Session-01-Map-Data.js', 'Session-01-Town-Maps.js'])
  require(path.join(root, file));
const source = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const boot = source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0);
vm.runInThisContext(source.slice(0, boot) + '  globalThis.__journeyArtTest = { normalize };\n})();');
const art = 'town-maps/professional/phandelver-region.png';
const png = fs.readFileSync(path.join(root, art));
assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
assert.equal(png.readUInt32BE(16) / png.readUInt32BE(20), 1.5, 'Map and marker canvas must share an aspect ratio');
assert(png.length < 16000000, 'Map must fit the phone server asset limit');

const oldMap = ECHO_TOWN_MAPS.scene('region-lmop');
oldMap.journeyArtVersion = 0; oldMap.journeyMotion = false;
oldMap.view = { zoom: 1.5, panX: 2, panY: -4 };
const find = (map, id) => map.points.find(point => point.id === id);
Object.assign(find(oldMap, 'region-phandalin'), { x: 51, y: 78, note: 'Our own session note', visible: false });
Object.assign(find(oldMap, 'region-cragmaw-castle'), { x: 56, y: 57, visible: true, approved: true });
Object.assign(find(oldMap, 'region-thundertree'), { x: 40, y: 33 }); // A DM-adjusted position.
const saved = {
  sessionKind: 'custom', scene: 'region-lmop',
  scenes: [{ id: 'region-lmop', title: 'Our journey', kind: 'map', image: 'town-maps/phandelver-region.svg', grid: false }],
  map: { scenes: { 'region-lmop': oldMap } }, encounters: [], runbookBeats: [], tokens: []
};
const state = __journeyArtTest.normalize(saved);
const map = state.map.scenes['region-lmop'];
assert.equal(state.scenes.find(scene => scene.id === 'region-lmop').image, art);
assert.equal(state.scenes.find(scene => scene.id === 'region-lmop').title, 'Our journey');
assert.equal(find(map, 'region-phandalin').x, 46.5);
assert.equal(find(map, 'region-phandalin').y, 67.8);
assert.equal(find(map, 'region-phandalin').note, 'Our own session note');
assert.equal(find(map, 'region-phandalin').visible, false);
assert.equal(find(map, 'region-cragmaw-castle').y, 36);
assert.equal(find(map, 'region-cragmaw-castle').visible, true);
assert.equal(find(map, 'region-thundertree').x, 40);
assert.deepEqual(map.view, oldMap.view);
assert.equal(map.journeyMotion, false);
assert.equal(map.journeyArtVersion, 1);
// A future manual adjustment back to the former coordinates must remain untouched.
Object.assign(find(map, 'region-phandalin'), { x: 51, y: 78 });
assert.equal(find(__journeyArtTest.normalize(state).map.scenes['region-lmop'], 'region-phandalin').x, 51);

const custom = structuredClone(saved);
custom.scenes[0].image = 'assets/custom-region.png';
const customState = __journeyArtTest.normalize(custom);
assert.equal(customState.scenes.find(scene => scene.id === 'region-lmop').image, custom.scenes[0].image);
assert.equal(find(customState.map.scenes['region-lmop'], 'region-phandalin').x, 51);
delete global.__journeyArtTest;
console.log('Journey art: PNG size, saved-image upgrade, landmark alignment, notes, reveals, view, custom artwork, and one-time migration passed.');

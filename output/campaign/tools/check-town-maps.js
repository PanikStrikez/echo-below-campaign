const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { globalThis: {} };
for (const file of ['Session-01-Map-Data.js', 'Session-01-Town-Maps.js', 'LMOP-Visual-Catalog.js',
  'Session-02-Runbook.js', 'Session-Content-Packs.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const towns = context.globalThis.ECHO_TOWN_MAPS;
const map = context.globalThis.ECHO_MAP_DATA;
const ids = ['region-lmop', 'town-phandalin', 'town-conyberry', 'town-thundertree', 'city-waterdeep'];
assert.deepEqual(Array.from(towns.ids), ids);
for (const id of ids) {
  const scene = towns.scene(id);
  assert(scene.points.length >= 5, 'No useful locations on ' + id);
  assert.equal(scene.playerLayers.grid, false);
  assert.equal(scene.playerLayers.fog, false);
  for (const point of scene.points) {
    assert(point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100, 'Off-map point on ' + id);
    assert(point.title && point.clue && point.note, 'Incomplete point on ' + id);
  }
  const publicScene = map.publicScene(scene);
  assert(publicScene.points.length > 0);
  assert(publicScene.points.every(point => !('clue' in point) && !('note' in point)), 'Private text leaked on ' + id);
  for (const hidden of scene.points.filter(point => !point.visible || !point.approved))
    assert(!publicScene.points.some(point => point.id === hidden.id), 'Hidden marker leaked on ' + id);
  for (const pack of context.globalThis.ECHO_CONTENT_PACKS.filter(p=>p.id!=='waterdeep-undermountain-1'||id==='city-waterdeep'))
    assert(pack.scenes.includes(id), 'Town map absent from pack ' + pack.id);
}
for (const [file, id] of [['phandelver-region.svg', ids[0]], ['phandalin-overhead.svg', ids[1]],
  ['conyberry-overhead.svg', ids[2]], ['thundertree-overhead.svg', ids[3]], ['waterdeep-overhead.svg', ids[4]]]) {
  const svg = fs.readFileSync(path.join(root, 'town-maps', file), 'utf8');
  assert(svg.includes('viewBox="0 0 1200 800"') && svg.includes('</svg>'), 'Bad map asset: ' + id);
  for (const spoiler of ['Redbrand', 'Venomfang', 'Agatha', 'Second Margin', 'Lantern House'])
    assert(!svg.includes(spoiler), 'Map labels reveal ' + spoiler + ': ' + id);
}
const region = towns.scene('region-lmop');
assert(region.points.some(point => point.id === 'region-cragmaw-hideout' && point.visible), 'Visited hideout should be known');
assert(region.points.some(point => point.id === 'region-phandalin' && point.visible), 'Phandalin should be known');
for (const hiddenId of ['region-cragmaw-castle', 'region-wave-echo'])
  assert(!map.publicScene(region).points.some(point => point.id === hiddenId), `Secret location leaked: ${hiddenId}`);
assert.equal(towns.regionScene('region-phandalin'), 'town-phandalin');
assert.equal(towns.regionScene('region-cragmaw-castle'), 'lmop-map-cragmaw-castle');
const revealed = region.points.find(point => point.id === 'region-cragmaw-castle');
revealed.visible = true; revealed.approved = true;
assert(map.publicScene(region).points.some(point => point.id === revealed.id), 'Revealed castle should reach the TV');
const loader = fs.readFileSync(path.join(root, 'Session-01-Loader.js'), 'utf8');
assert(/const privateScripts = \[[\s\S]*?'Session-01-Town-Maps.js'[\s\S]*?\];/.test(loader), 'Town clues must load on the DM side only');
assert(loader.includes('if (!player) for (const file of privateScripts) await load(file)'));
assert(!loader.includes("await load('Session-01-Town-Maps.js')"), 'Town secrets cannot load on the shared path');
const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
assert(board.includes('seedTownMapScenes') && board.includes('town-maps/phandalin-overhead.svg'));
assert(board.includes('globalThis.ECHO_TOWN_MAPS?.isTown(state.scene)'));
console.log('Town and journey maps: five overhead scenes, linked content packs, approved markers, and private clue filtering passed.');

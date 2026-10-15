const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { globalThis: {} };
for (const file of ['Session-01-Map-Data.js', 'Session-01-Town-Maps.js', 'LMOP-Visual-Catalog.js', 'Campaign-Transition-Data.js',
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
  for (const pack of context.globalThis.ECHO_CONTENT_PACKS.filter(p=>['phandalin-session-2','gundren-session-3'].includes(p.id)))
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
require('./test-support.cjs').assertPrivateModules(['Session-01-Town-Maps.js']).catch(error=>{console.error(error);process.exitCode=1;});
const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
assert(board.includes('seedTownMapScenes'));
vm.runInNewContext(fs.readFileSync(path.join(root,'Echo-Below-Table-Content.js'),'utf8'),context);
assert.equal(context.globalThis.ECHO_TABLE_CONTENT.SCENES['town-phandalin'].image,'town-maps/professional/phandalin-overhead.png');
assert(board.includes('globalThis.ECHO_TOWN_MAPS?.isTown(state.scene)'));
console.log('Town and journey maps: five overhead scenes, linked content packs, approved markers, and private clue filtering passed.');

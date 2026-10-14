const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

class Element {
  constructor(tag) {
    this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.className = '';
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.classList = { add: value => { this.className += ' ' + value; } };
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  get childElementCount() { return this.children.length; }
  querySelector(selector) { return selector === 'img.scene-image' ? this.children.find(e => e.tagName === 'img' && e.className.split(' ').includes('scene-image')) || null : null; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener() {}
  setAttribute(name, value) { this.attributes[name] = value; }
}
const stage = new Element('div');
let now = 12345000;
const context = {
  globalThis: {}, Date: { now: () => now },
  document: { createElement: tag => new Element(tag) }, $: () => stage,
  mapPreviewMode: false, lastMapRenderMs: 0,
  mapSceneData: () => context.state.map.scenes[context.state.scene],
  getScene: () => ({ title: 'Journey', kind: 'map' }),
  sceneImage: () => 'journey.png', isMapScene: () => true, sceneHasFog: () => false,
  fogForScene: () => [], renderMapOverlays() {}, applyMapView() {},
};
vm.createContext(context);
for (const file of ['Session-01-Map-Data.js', 'Session-01-Reliability.js', 'Session-01-Town-Maps.js'])
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const maps = context.globalThis.ECHO_MAP_DATA;
const reliability = context.globalThis.ECHO_RELIABILITY;
const region = context.globalThis.ECHO_TOWN_MAPS.scene('region-lmop');
const payload = mapScene => reliability.publicPayload({
  scene: 'region-lmop', map: { scenes: { 'region-lmop': maps.publicScene(mapScene) } }, tokens: []
});
const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const start = board.indexOf('  const stageRenderKeys = new WeakMap();');
const end = board.indexOf('  function addSmallButton(', start);
assert(start >= 0 && end > start);
vm.runInContext(board.slice(start, end), context);
const descendants = element => [element, ...element.children.flatMap(descendants)];
const markers = () => descendants(stage).filter(el => el.className.split(' ').includes('map-marker'));
const hasAmbient = () => descendants(stage).some(el => el.className === 'journey-ambient');

// Follow the real two-stage public payload to the real renderer. Public points omit DM flags.
context.state = payload(region);
assert(context.state.map.scenes['region-lmop'].points.every(p => !('visible' in p) && !('note' in p)));
context.renderStage('player');
assert.equal(markers().length, region.points.filter(p => p.visible && p.approved).length);
assert(markers().some(el => el.dataset.pointId === 'region-phandalin'));
assert(!markers().some(el => el.dataset.pointId === 'region-cragmaw-castle'));
assert(!markers().some(el => el.dataset.pointId === 'region-wave-echo'));
assert(hasAmbient());
assert(descendants(stage).find(el => el.className === 'journey-ambient').attributes['aria-hidden'] === 'true');
assert.equal(stage.style['--journey-water-phase'], `${-(now / 1000 % 18)}s`);
now += 2000;
const oldAmbient = descendants(stage).find(el => el.className === 'journey-ambient');
const initialPhase = stage.style['--journey-water-phase'];
context.renderStage('player');
assert.equal(descendants(stage).find(el => el.className === 'journey-ambient'), oldAmbient, 'Unchanged TV sync retains the running animation node');
assert.equal(stage.style['--journey-water-phase'], initialPhase, 'A retained animation keeps its original delay and continues naturally');
context.state.tokens = [{id:'phase-fixture',team:'pc',placed:false,x:10,y:10}];
context.renderStage('player');
assert.notEqual(descendants(stage).find(el => el.className === 'journey-ambient'), oldAmbient, 'Changed state rebuilds the layer');
assert.equal(stage.style['--journey-water-phase'], `${-(now / 1000 % 18)}s`, 'A rebuilt layer resumes the absolute loop phase');

// A toggle survives save normalization and both public filters, then removes all motion layers.
const paused = maps.normalize({ scenes: { 'region-lmop': { ...region, journeyMotion: false } } });
context.state = payload(paused.scenes['region-lmop']);
assert.equal(context.state.map.scenes['region-lmop'].journeyMotion, false);
context.renderStage('player');
assert(!hasAmbient());
assert(!stage.className.includes('journey-motion'));

// Preview reads private data: secret locations remain filtered even though normal DM sees them.
context.state = { scene: 'region-lmop', tokens: [], map: { scenes: { 'region-lmop': region } } };
context.mapPreviewMode = true;
context.renderStage('dm');
assert.equal(markers().length, region.points.filter(p => p.visible && p.approved).length);
assert(!markers().some(el => el.dataset.pointId === 'region-wave-echo'));
context.mapPreviewMode = false;
context.renderStage('dm');
assert.equal(markers().length, region.points.length);
assert(markers().find(el => el.dataset.pointId === 'region-wave-echo').className.includes('unrevealed'));

// Other scenes and hidden artwork do not acquire region effects.
context.state = { scene: 'town-phandalin', tokens: [], map: { scenes: { 'town-phandalin': maps.scene() } } };
context.renderStage('player');
assert(!hasAmbient());
region.playerLayers.map = false;
context.state = payload(region);
context.renderStage('player');
assert(!hasAmbient());
console.log('Journey motion: saved toggle, public payload, approved TV markers, DM preview privacy, continuing animation phase, and scene scoping passed.');

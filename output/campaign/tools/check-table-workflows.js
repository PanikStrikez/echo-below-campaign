const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const appRoot = path.resolve(__dirname, '..');
assert(fs.readFileSync(path.join(appRoot, 'Session-01-Loader.js'), 'utf8').includes('Campaign-Module-Manifest.js'));
assert(fs.readFileSync(path.join(appRoot, 'Campaign-Module-Manifest.js'), 'utf8').includes('Session-01-Encounter-Launch.js'));
assert(fs.readFileSync(path.join(appRoot, 'Session-01-TV-Display.html'), 'utf8').includes('id="quick-table-check"'));

class FakeElement {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.listeners = {}; this.hidden = false; this.dataset = {}; this.innerHTML = ''; this.value = ''; this.checked = false; }
  set textContent(value) { this._text = String(value); }
  get textContent() { return this._text || ''; }
  append(...children) { this.children.push(...children); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  querySelectorAll() { return []; }
}
const elements = new Map();
globalThis.document = {
  createElement: tag => new FakeElement(tag),
  createTextNode: text => ({ textContent: text }),
  getElementById: id => { if (!elements.has(id)) elements.set(id, new FakeElement()); return elements.get(id); }
};
globalThis.window = { addEventListener() {} };
globalThis.ECHO_COMBAT_DATA = { expectedScene: () => 'cave' };
require(path.resolve(__dirname, '..', 'Session-01-Encounter-Launch.js'));

const state = { scene: 'town', combat: { plans: { ambush: { waves: [{ name: 'First wave', tokenIds: ['goblin'], positions: {} }] } } },
  tokens: [{ id: 'goblin', name: 'Goblin', encounter: 'ambush', hp: 7, visible: false }] };
let selected = '', launched = null;
globalThis.ECHO_ENCOUNTER_LAUNCH.init({
  state, beats: () => [{ id: 'beat', title: 'Ambush', encounter: 'ambush', scene: 'cave', read: ['The trail goes quiet.'] }],
  encounters: () => [{ id: 'ambush', name: 'Goblin ambush' }],
  scenes: () => [{ id: 'town', title: 'Town', kind: 'map' }, { id: 'cave', title: 'Cave', kind: 'map', image: 'cave.png' }],
  media: () => [], musicHint: () => '', selectedEncounter: () => selected,
  sceneImage: scene => scene.image, toast: () => {},
  showEncounter: id => { selected = id; }, refresh: () => {}, launch: choice => { launched = choice; }
});
globalThis.ECHO_ENCOUNTER_LAUNCH.stage('beat');
assert.equal(state.scene, 'town', 'Staging must leave the player scene alone');
assert.equal(state.tokens[0].visible, false, 'Staging must not reveal enemies');
assert.equal(launched, null, 'Staging must not launch automatically');
const root = new FakeElement();
globalThis.ECHO_ENCOUNTER_LAUNCH.render(root, 'ambush');
function find(node, text) {
  if (node.textContent === text) return node;
  for (const child of node.children || []) { const result = find(child, text); if (result) return result; }
  return null;
}
const launch = find(root, 'Show map on TV and launch');
assert(launch, 'The staged encounter needs an explicit Show on TV button');
launch.listeners.click();
assert.equal(launched.sceneId, 'cave');
assert.equal(launched.reveal, false, 'Enemies should default to hidden');

require(path.resolve(__dirname, '..', 'Session-01-Reliability.js'));
let restorePoints = 0, archiveChecks = 0;
globalThis.ECHO_RELIABILITY.init({
  sessionId: 'session-2', sessionName: 'Session 2', campaignName: 'Test campaign',
  state: { scene: 'town', tokens: [], map: {} }, scenes: [], beats: [], media: [], story: { npcs: [] },
  connection: () => ({ level: 'connected', label: 'connected' }),
  phoneCheck: async () => ({ service: true, enabled: true, connected: 2 }),
  audioTest: async () => true,
  createRestorePoint: async () => { restorePoints++; },
  validateBackup: async () => { archiveChecks++; return { format: 'echo-below-campaign-v2', schemaVersion: 2,
    sessions: [{ id: 'session-2', name: 'Session 2', state: { schemaVersion: 2 } }], presentation: { media: [] } }; },
  toast: () => {}
});
globalThis.ECHO_RELIABILITY.runTableCheck().then(async () => {
  assert.equal(restorePoints, 1, 'Table check must create a recovery copy');
  assert.equal(archiveChecks, 1, 'Table check must validate the portable archive');
  assert.match(document.getElementById('reliability-content').innerHTML, /Needs attention before play/, 'Audio needs a human listening check');
  document.getElementById('reliability-content').listeners.click({ target: { closest: () => ({ dataset: { reliable: 'confirm-audio' } }) } });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(document.getElementById('reliability-content').innerHTML, /Needs attention before play/);
  assert.equal(ECHO_RELIABILITY.tableStatus().checks.storage.status,'unchecked','Unavailable storage evidence must never imply readiness');
  assert(!document.getElementById('reliability-content').innerHTML.includes('Physical table tested'),'An audio acknowledgement is not a whole physical-table certification');
  console.log('Table workflows passed: private encounter staging and one-click readiness checks.');
}).catch(error => { console.error(error); process.exitCode = 1; });

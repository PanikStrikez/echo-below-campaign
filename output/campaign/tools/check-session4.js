const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
global.window = global;
global.location = { hash: '', protocol: 'file:' };
for (const file of ['LMOP-Visual-Catalog.js','LMOP-Battle-Map-Catalog.js','Session-01-Map-Data.js',
  'Session-01-Town-Maps.js','Session-04-Runbook.js','Session-04-Expedition.js','Session-Content-Packs.js',
  'Session-01-Party-Data.js','Session-01-Combat-Data.js','Session-03-Thundertree-Combat.js',
  'Session-04-Combat.js','Session-01-Combat-Run.js','Session-01-Reliability.js','Session-01-Story-Data.js']) require(path.join(root, file));
const pack = ECHO_CONTENT_PACKS.find(p => p.id === 'lmop-part-4-visuals');
assert.equal(pack.runbook.filter(b => /^s4-room-\d+$/.test(b.id)).length, 20);
assert.equal(new Set(pack.beats).size, pack.beats.length);
assert.equal(pack.encounters.length, 12);
for (const beat of pack.runbook) {
  assert(pack.scenes.includes(beat.scene), `Missing scene: ${beat.id}`);
  assert(ECHO_SESSION4_PAGES[beat.id] >= 42 && ECHO_SESSION4_PAGES[beat.id] <= 51, `Missing book page: ${beat.id}`);
  for (const key of ['read','readAfter','ask','run','choices','private']) {
    assert((beat[key] || []).length <= 20);
    for (const text of beat[key] || []) assert(text.length <= 1200, `${beat.id}.${key} would truncate on save`);
  }
  if (beat.encounter) {
    assert(pack.encounters.includes(beat.encounter));
    assert.equal(beat.scene, ECHO_COMBAT_DATA.expectedScene(beat.encounter));
  }
}
for (const [id, keys] of Object.entries(ECHO_SESSION4_ART)) {
  assert(pack.beats.includes(id));
  for (const key of keys) assert(LMOP_VISUAL_CATALOG.some(item => item.key === key), `Missing art ${key}`);
}
for (const id of pack.scenes.filter(id => id.startsWith('lmop-'))) {
  const entry = [...LMOP_VISUAL_CATALOG, ...LMOP_BATTLE_MAP_CATALOG].find(item => item.id === id);
  assert(entry && fs.existsSync(path.join(root, entry.image)), `Missing visual asset ${id}`);
}
const source = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const boot = source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0);
require('./test-support.cjs').loadTableContent();
vm.runInThisContext(source.slice(0, boot) + `
  globalThis.__s4 = { normalize, newState, newCustomState, session4EnemyTokens, seedSession4Resources, gameSnapshot, publicState, phoneSnapshot,
    setState: value => { state = value; }, setCampaign: value => { campaignIndex = value; } };
})();`);
const original = {
  sessionKind:'custom', scene:'lmop-map-wave-south', scenes:[{
    id:'lmop-map-wave-south',title:'My cave map',kind:'map',image:'lmop-battle-maps/professional/wave-south.png',fog:true
  }], encounters:[], runbookBeats:[], sceneFog:{'lmop-map-wave-south':['1,1']},
  tokens:[{id:'s4-wave-12-flameskull-1',name:'Extinguished guardian',label:'EG',type:'flameskull',team:'enemy',encounter:'wave-12',maxHp:40,hp:0}],
  combatRun:{resources:{'s4-wave-12-flameskull-1':[{name:'3rd-level slots',current:0,max:1}]}},
  waveEcho:{rooms:{12:{status:'cleared',treasure:'collected',notes:'Pebble has the ore',remaining:'Remains untreated'}},minutes:42,
    outcomes:{nundro:'captive',nezznar:'active'},flameskull:{status:'destroyed',destroyedAt:0}}
};
const migrated = __s4.normalize(original, pack.id);
assert.equal(migrated.contentPackId, pack.id);
assert.equal(migrated.session4ContentVersion, 1);
assert.equal(migrated.tokens.length, 57);
assert.equal(migrated.runbookBeats.length, pack.runbook.length);
assert.equal(migrated.tokens.find(t => t.id === original.tokens[0].id).hp, 0);
assert.equal(migrated.tokens.find(t => t.id === original.tokens[0].id).name, 'Extinguished guardian');
assert.equal(migrated.tokens.find(t => t.id === original.tokens[0].id).label, 'EG');
assert.equal(migrated.combatRun.resources[original.tokens[0].id][0].current, 0);
assert.equal(migrated.waveEcho.rooms[12].notes, 'Pebble has the ore');
assert.equal(migrated.waveEcho.rooms[12].treasure, 'collected');
assert.equal(migrated.waveEcho.minutes, 42);
assert.deepEqual(migrated.sceneFog['lmop-map-wave-south'], ['1,1']);
assert.equal(migrated.map.tokenMeta['s4-wave-19-wave-spider-1'].size, 'large');
assert.equal(migrated.map.tokenMeta['s4-wave-18-bugbear-1'].elevation, -20);
const vhalak = migrated.tokens.find(t => t.type === 'vhalak');
assert.equal(vhalak.name, 'Drow overseer');
assert.equal(vhalak.label, 'DO');
const nezznar = migrated.tokens.find(t => t.type === 'nezznar');
assert.equal(nezznar.ac, 11); assert.equal(nezznar.initBonus, 1);
assert.equal(migrated.combatRun.resources[nezznar.id].find(r => r.name === 'Spider staff charges').current, 10);
const twice = __s4.normalize(migrated);
assert.equal(twice.tokens.length, 57);
assert.equal(twice.tokens.find(t => t.id === original.tokens[0].id).hp, 0);
assert.deepEqual(twice.waveEcho, migrated.waveEcho);
const removed = structuredClone(twice);
removed.tokens = removed.tokens.filter(t => t.id !== 's4-wave-3-stirge-10');
assert.equal(__s4.normalize(removed).tokens.length, 56, 'A later load must not resurrect a deliberately removed token');
assert.deepEqual(__s4.normalize(JSON.parse(__s4.gameSnapshot(twice))).waveEcho, twice.waveEcho);
const full = structuredClone(twice), party = __s4.newCustomState(__s4.newState());
full.party = party.party; full.tokens.push(...party.tokens);
assert(__s4.gameSnapshot(full).length < 250000, 'Chapter plus live party should fit existing undo snapshot limits');

// Real DM-to-TV and phone filters: private expedition details and disguises remain private.
const visibleState = structuredClone(twice);
visibleState.scene = 'town-phandalin';
const disguised = visibleState.tokens.find(t => t.type === 'vhalak');
Object.assign(disguised, {placed:true,visible:true,scene:'town-phandalin'});
visibleState.waveEcho.promises = 'PRIVATE-WAVE-SECRET';
__s4.setState(visibleState);
__s4.setCampaign({story:ECHO_STORY_DATA.normalize(),tableExtras:{},rules:null,sessions:[{id:'session-01',name:'Isolated test'}],combatLibrary:[]});
const publicData = __s4.publicState(), phoneData = __s4.phoneSnapshot();
assert(!JSON.stringify(publicData).includes('PRIVATE-WAVE-SECRET'));
assert(!JSON.stringify(phoneData).includes('PRIVATE-WAVE-SECRET'));
assert(!('waveEcho' in publicData));
assert.equal(publicData.tokens.find(t => t.id === disguised.id).type, 'custom');
assert.equal(publicData.tokens.find(t => t.id === disguised.id).name, 'Drow overseer');
assert(publicData.tokens.every(t => !('hp' in t) && !('ac' in t)));

const d = ECHO_WAVE_ECHO.normalize();
assert(!ECHO_WAVE_ECHO.homecoming(d).includes('Black Spider is dead'));
d.outcomes.nezznar = 'escaped'; d.outcomes.nundro = 'rescued';
assert(ECHO_WAVE_ECHO.homecoming(d).includes('Black Spider remains a threat'));
assert(ECHO_WAVE_ECHO.homecoming(d).includes('Nundro’s survival'));
d.flameskull = {status:'destroyed',destroyedAt:0};
d.forgeItems = [{name:'Pebble hammer',expires:60}];
ECHO_WAVE_ECHO.record(d,'Rest',60);
assert(ECHO_WAVE_ECHO.reminders(d).some(t => t.includes('rejuvenation is due')));
assert(ECHO_WAVE_ECHO.reminders(d).some(t => t.includes('enchantment expired')));
d.outcomes.nezznar = 'delivered'; d.outcomes.custody = 'unguarded';
assert(ECHO_WAVE_ECHO.reminders(d).some(t => t.includes('Halia')));
assert(!ECHO_WAVE_ECHO.homecoming(d).includes('Halia'));

// Exercise the journal controls using a small DOM substitute, without changing a live save.
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.value = ''; }
  set textContent(value) { this.text = String(value); }
  get textContent() { return this.text || ''; }
  append(...children) { this.children.push(...children); }
  addEventListener(event, callback) { this.listeners[event] = callback; }
}
global.document = {createElement:tag => new Element(tag)};
global.confirm = () => true;
const flatten = n => [n, ...n.children.flatMap(flatten)];
let closed = false, selectedBeat = '', shown = null, warning = '', saved = 0;
global.ECHO_STORY_UI = {render(){},close(){closed = true;}};
const host = {beats:() => pack.runbook,expedition:() => d,partyLevel:() => 'Test party',encounterTokens:() => [],
  commitExpedition(){saved++;},selectBeat:id => {selectedBeat = id;},openPrinted(){},openParty(){},
  toast:value => {warning = value;},showText:(title,text) => {shown = text;},changeScene(){},
  sessionId:() => 'test',story:() => ({journal:[]}),save(){}};
let dom = new Element('div'); ECHO_WAVE_ECHO.render(dom,host);
const press = label => {const button = flatten(dom).find(e => e.tagName === 'button' && e.textContent === label);assert(button,label);button.listeners.click();};
press('Resume saved room notes'); assert(closed && selectedBeat === 's4-room-1');
const foesBefore = JSON.stringify(migrated.tokens);
press('Record retreat'); assert.equal(d.phase,'retreated');
press('Record return'); assert.equal(d.phase,'exploring'); assert.equal(d.visit,2);
assert.equal(JSON.stringify(migrated.tokens),foesBefore);
press('Show homecoming text on TV'); assert.equal(shown,ECHO_WAVE_ECHO.homecoming(d));
shown = null; d.playerAccount = 'x'.repeat(4000);
dom = new Element('div'); ECHO_WAVE_ECHO.render(dom,host);
press('Show homecoming text on TV'); assert.equal(shown,null); assert(warning.includes('3,000'));
assert(saved >= 2);
delete global.__s4;
console.log(`Session 4 verified: ${pack.runbook.length} cards, 20 rooms, 12 encounters, 57 tokens; migration/return state, source/art links, caster resources, private TV/phone data, conditional endings, and journal controls.`);

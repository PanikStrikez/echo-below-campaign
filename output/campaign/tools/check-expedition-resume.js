/* Isolated in-memory expedition: retreat, reviewed rest, return, real normalization/restore. */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs'), vm = require('node:vm');
global.window = global; global.location = { hash: '', protocol: 'file:' };
for (const file of ['LMOP-Visual-Catalog.js','LMOP-Battle-Map-Catalog.js','Session-01-Map-Data.js',
  'Session-01-Town-Maps.js','Session-04-Runbook.js','Session-04-Expedition.js','Session-Content-Packs.js',
  'Session-01-Party-Data.js','Session-01-Combat-Data.js','Session-03-Thundertree-Combat.js',
  'Session-04-Combat.js','Session-01-Combat-Run.js','Session-01-Reliability.js','Session-01-Story-Data.js',
  'Campaign-Expedition-Resume.js', 'Session-01-Dungeon.js', 'Session-01-Table-Tools.js',
  'Waterdeep-Expedition-Data.js', 'Waterdeep-Expedition.js', 'Session-01-Presentation.js', 'Session-01-Recovery.js'])
  require(path.join(__dirname, '..', file));
const code = fs.readFileSync(path.join(__dirname, '..', 'Session-01-Battleboard.js'), 'utf8');
const boot = code.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0);
vm.runInThisContext(code.slice(0, boot) + '\nglobalThis.__s4={normalize,newState,newCustomState,session4EnemyTokens};})();');
const M = ECHO_EXPEDITION_RESUME, clone = value => JSON.parse(JSON.stringify(value));
const pack = ECHO_CONTENT_PACKS.find(p => p.id === 'lmop-part-4-visuals');
const base = __s4.newState();
let target = __s4.normalize({ ...__s4.newCustomState(base), contentPackId: pack.id,
  scenes: pack.scenes.map(id => ({ id, title: id, kind: id.startsWith('lmop-map-') ? 'map' : 'visual', image: '', fog: true })),
  runbookBeats: pack.runbook, scene: 'lmop-map-wave-south', tokens: [...base.tokens.filter(t => t.team === 'pc'), ...__s4.session4EnemyTokens()] });
const pc = 'pc-pebble', foe = target.tokens.find(t => t.team === 'enemy');
foe.hp = 0; foe.placed = true; foe.visible = false; foe.scene = target.scene; foe.x = 33; foe.y = 42;
target.tokens.find(t => t.id === pc).placed = true;
target.tokens.find(t => t.id === pc).scene = target.scene;
target.waveEcho.rooms[7] = { status: 'cleared', treasure: 'collected', notes: 'Ore already taken', remaining: 'A promise remains open' };
target.waveEcho.phase = 'retreated'; target.waveEcho.minutes = 20; target.waveEcho.visit = 2;
target.waveEcho.flameskull = { status: 'destroyed', destroyedAt: 10 };
target.sceneFog[target.scene] = ['1,1', '2,2'];
target.map.scenes[target.scene] = ECHO_MAP_DATA.scene({ fineFog: true, lines: [{ id: 'broken-door', kind: 'door', x1: 20, y1: 0, x2: 20, y2: 50, open: true, discovered: true }] });
target.combatRun.encounterStatus[foe.encounter] = 'surrender';
target.combat.tokens[foe.id] = { surprised: false, reactionUsed: true, ready: '', concentration: '', resistances: 'fire', vulnerabilities: '', immunities: '' };
target.combatRun.resources[foe.id] = [{ name: 'Spell slots', current: 0, max: 2 }];
target.combat.effects.push({ id: 'foe-due', tokenId: foe.id, name: 'Old wound', triggerPoint: 'end', remaining: 2 });
const current = clone(target);
current.contentPackId = 'mending-court-home'; current.scene = 'mc-court'; current.waveEcho = ECHO_WAVE_ECHO.normalize();
current.tokens = current.tokens.filter(t => t.team === 'pc');
current.tokens.push({ id: 'town-visitor', name: 'Town-only ally', team: 'ally', hp: 99 });
current.party['town-visitor'] = { id: 'town-visitor', name: 'Town-only ally', role: 'ally', hp: 99 };
current.party[pc].hp = 2;
const rest = ECHO_PARTY_DATA.previewRest(current.party[pc], 'short', { hitDiceSpent: 1, healing: 5 });
assert(!rest.blocked); current.party[pc] = rest.sheet;
current.party[pc].tempHp = 3; current.party[pc].concentration = 'Reviewed spell';
current.party[pc].notes += '\nPRIVATE RETURN SHEET NOTE';
Object.assign(current.tokens.find(t => t.id === pc), { hp: rest.sheet.hp, tempHp: 3, scene: '', placed: false, conditions: ['Concentrating'] });
current.combat.tokens[pc] = { surprised: false, reactionUsed: true, ready: '', concentration: 'Reviewed spell', resistances: 'cold', vulnerabilities: '', immunities: '' };
current.combatRun.resources[pc] = [{ name: 'Reviewed pool', current: 1, max: 3 }];
current.combat.effects = [{ id: 'pc-due', tokenId: pc, name: 'Current timed effect', triggerPoint: 'end', remaining: 1 }];
current.map.clock.minutes += 480;
const record = { id: 'isolated-sortie', sessionId: 'dungeon-save', phase: 'away', awayMinutes: 480,
  retreat: { scene: target.scene, runbook: 's4-room-7', worldMinute: 30,
    positions: [{ id: pc, scene: target.scene, placed: true, visible: false, x: 12, y: 19 }] } };
const before = JSON.stringify([current, target, record]);
const review = M.previewMerge(current, target, record);
assert.equal(JSON.stringify([current, target, record]), before, 'Preview is read-only');
assert.equal(review.people.find(p => p.id === pc).hp, 7);
assert.equal(review.people.find(p => p.id === pc).positionSource, 'saved retreat');
const resumed = M.applyMerge(current, target, review, record);
assert.equal(JSON.stringify([current, target, record]), before, 'Apply returns a new state');
assert.deepEqual(resumed.party[pc], current.party[pc], 'Current approved rest and equipment/resources carry exactly');
assert.equal(resumed.tokens.find(t => t.id === pc).hp, 7, 'No extra return healing');
assert.equal(resumed.tokens.find(t => t.id === pc).tempHp, 3);
assert.equal(resumed.tokens.find(t => t.id === pc).x, 12);
assert.equal(resumed.tokens.find(t => t.id === pc).visible, false);
assert(!resumed.tokens.some(t => t.id === 'town-visitor'));
assert(!resumed.party['town-visitor']);
assert.deepEqual(resumed.tokens.filter(t => t.team !== 'pc'), target.tokens.filter(t => t.team !== 'pc'));
assert.deepEqual(resumed.map, target.map, 'Returning does not alter saved geometry, routes, timers or map clock');
assert.deepEqual(resumed.sceneFog, target.sceneFog);
assert.deepEqual(resumed.waveEcho.rooms, target.waveEcho.rooms);
assert.deepEqual(resumed.combatRun.encounterStatus, target.combatRun.encounterStatus);
assert.deepEqual(resumed.combat.tokens[foe.id], target.combat.tokens[foe.id]);
assert.deepEqual(resumed.combat.tokens[pc], current.combat.tokens[pc]);
assert.deepEqual(resumed.combatRun.resources[pc], current.combatRun.resources[pc]);
assert.deepEqual(resumed.combatRun.resources[foe.id], target.combatRun.resources[foe.id]);
assert(resumed.combat.effects.some(e => e.id === 'foe-due'));
assert(resumed.combat.effects.some(e => e.id === 'pc-due'));
assert.equal(resumed.waveEcho.minutes, 500); assert.equal(resumed.waveEcho.visit, 3);
assert(ECHO_WAVE_ECHO.reminders(resumed.waveEcho).some(x => x.includes('rejuvenation is due')));
assert.equal(resumed.tokens.find(t => t.id === foe.id).hp, 0, 'A due threat remains a reminder, never a respawn');
const activeRecord = { ...record, phase: 'active', awayMinutes: 480 };
const progressed = clone(resumed); progressed.tokens.find(t => t.id === pc).x = 61;
const already = M.applyMerge(current, progressed, M.previewMerge(current, progressed, activeRecord), activeRecord);
assert.equal(already.waveEcho.minutes, 500); assert.equal(already.waveEcho.visit, 3, 'Active resume does not count the away interval twice');
assert.equal(already.tokens.find(t => t.id === pc).x, 61, 'An active expedition resumes its latest position, not a historical retreat point');
for (const changed of ['party', 'enemy', 'retreat']) {
  const source = clone(current), destination = clone(target), point = clone(record);
  if (changed === 'party') source.party[pc].hp++;
  if (changed === 'enemy') destination.tokens.find(t => t.id === foe.id).hp = 4;
  if (changed === 'retreat') point.retreat.positions[0].x++;
  assert.throws(() => M.applyMerge(source, destination, review, point), /Preview the return again/);
}
for (const side of ['current', 'target']) {
  const source = clone(current), destination = clone(target);
  (side === 'current' ? source : destination).turn.order = [pc];
  assert.throws(() => M.previewMerge(source, destination, record), /End combat/);
}
const newHero = clone(current);
newHero.party['pc-new'] = { ...clone(current.party[pc]), id: 'pc-new', name: 'New player' };
newHero.tokens.push({ ...clone(current.tokens.find(t => t.id === pc)), id: 'pc-new', name: 'New player' });
const withNew = M.applyMerge(newHero, target, M.previewMerge(newHero, target, record), record);
assert.equal(withNew.tokens.find(t => t.id === 'pc-new').placed, false);
assert.equal(withNew.tokens.find(t => t.id === 'pc-new').scene, '');
assert(M.previewMerge(newHero, target, record).warnings.some(w => w.includes('New player')));
assert.throws(() => M.previewMerge(current, target, { ...record, retreat: { scene: 'missing' } }), /unavailable/);
assert.throws(() => M.previewMerge(current, target, { ...record, retreat: { ...record.retreat, positions: [{ id: pc, placed: true, scene: target.scene, x: 999, y: 0 }] } }), /position is invalid/);
const normalized = __s4.normalize(JSON.parse(JSON.stringify(resumed)));
assert.deepEqual(normalized.party[pc], resumed.party[pc]);
assert.equal(normalized.tokens.find(t => t.id === foe.id).hp, 0);
assert.equal(normalized.waveEcho.rooms[7].status, 'cleared');
assert.equal(normalized.waveEcho.minutes, 500);
assert.deepEqual(normalized.sceneFog, resumed.sceneFog);
const extras = ECHO_TABLE.normalize();
const ds = ECHO_DUNGEON.scene(extras.dungeon, target.scene);
ds.memory = ['1,1', '2,2'];
for (const [kind, state] of [['door', 'broken'], ['trap', 'disarmed'], ['container', 'empty'], ['room', 'cleared']]) {
  const o = ECHO_DUNGEON.add(extras.dungeon, target.scene, kind, kind); o.state = state; o.note = 'PRIVATE DUNGEON EVIDENCE';
}
ECHO_DUNGEON.link(extras.dungeon, target.scene, 'lmop-map-wave-north', 'Retreat stairs', 10, 20, 80, 90);
ECHO_EXPEDITION.room(extras.expedition, 'um1-6').status = 'cleared';
const archive = { format: 'echo-below-campaign-v2', schemaVersion: ECHO_RELIABILITY.VERSION, active: 'dungeon-save',
  campaign: { name: 'Isolated expedition' }, sessions: [{ id: 'dungeon-save', name: 'Dungeon', state: resumed }],
  tableExtras: extras, story: ECHO_STORY_DATA.normalize(), presentation: ECHO_PRESENTATION.normalizeLibrary(), mediaFiles: [] };
const restored = ECHO_RECOVERY.prepare(JSON.parse(JSON.stringify(archive)), __s4.normalize);
assert.equal(restored.sessions[0].state.tokens.find(t => t.id === foe.id).hp, 0);
assert.equal(restored.sessions[0].state.party[pc].hp, 7);
assert.deepEqual(restored.index.tableExtras.dungeon.scenes[target.scene], ds);
assert.equal(restored.index.tableExtras.expedition.rooms['um1-6'].status, 'cleared');
console.log('Expedition resume passed: current sheets and reviewed rest, saved retreat positions, no NPC imports/respawns, stale-review guards, deferred threat reminders, clocks, normalization and full archive restore.');

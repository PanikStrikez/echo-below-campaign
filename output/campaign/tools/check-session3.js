const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
global.window = global;
global.location = { hash: '', protocol:'file:' }; // No live BroadcastChannel in an isolated migration test.
for (const file of [
  'LMOP-Visual-Catalog.js', 'LMOP-Battle-Map-Catalog.js',
  'Session-02-Runbook.js', 'Session-03-Runbook.js', 'Session-03-Thundertree-Runbook.js',
  'Session-Content-Packs.js', 'Session-01-Party-Data.js',
  'Session-01-Combat-Data.js', 'Session-03-Thundertree-Combat.js', 'Session-01-Presentation.js',
  'Session-01-Handout-Data.js'
]) require(path.join(root, file));

const pack = global.ECHO_CONTENT_PACKS.find(item => item.id === 'gundren-session-3');
assert(pack, 'Session 3 pack missing');
assert.equal(pack.firstScene, 'town-phandalin');
assert.equal(pack.runbook.length, pack.beats.length);
const transfer = global.ECHO_SOURCE_HANDOUTS.find(item => item.id === 's2-redbrand-transfer-record');
assert(transfer && transfer.text.includes('Cragmaw Castle') && !transfer.book);
assert(pack.runbook.some(beat => beat.id === 's3-close'));
for (const beat of pack.runbook) {
  assert(pack.scenes.includes(beat.scene), `Missing scene for ${beat.id}: ${beat.scene}`);
  if (!beat.encounter) continue;
  assert(pack.encounters.includes(beat.encounter), `Missing encounter for ${beat.id}`);
  assert.equal(beat.scene, global.ECHO_COMBAT_DATA.expectedScene(beat.encounter),
    `Incorrect battle map for ${beat.id}`);
}
for (const encounter of pack.encounters)
  assert(global.ECHO_COMBAT_DATA.PLANS[encounter], `Missing encounter plan: ${encounter}`);

const scenes = [...global.LMOP_VISUAL_CATALOG, ...global.LMOP_BATTLE_MAP_CATALOG];
for (const id of pack.scenes.filter(id => id.startsWith('lmop-'))) {
  const scene = scenes.find(item => item.id === id);
  assert(scene, `Missing visual catalog entry: ${id}`);
  assert(fs.existsSync(path.join(root, scene.image)), `Missing image: ${scene.image}`);
}
for (const [beatId, artKeys] of Object.entries(global.ECHO_SESSION3_ART)) {
  assert(pack.beats.includes(beatId), `Unknown art beat: ${beatId}`);
  for (const key of artKeys) assert(scenes.some(scene => scene.key === key), `Unknown art key: ${key}`);
}

const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const boot = board.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0);
vm.runInThisContext(board.slice(0, boot) +
  '  globalThis.__session3Test = { normalize, session3EnemyTokens };\n})();');
const tokens = global.__session3Test.session3EnemyTokens();
const tokenIds = new Set(tokens.map(token => token.id));
assert.equal(tokenIds.size, tokens.length, 'Duplicate Session 3 token IDs');
for (const encounter of pack.encounters) {
  const plan = global.ECHO_COMBAT_DATA.PLANS[encounter];
  for (const wave of plan.waves || []) for (const id of wave.tokenIds)
    assert(tokenIds.has(id), `Missing token for ${encounter}: ${id}`);
}
for (const [encounter, count] of [['old-owl-well', 13], ['wyvern-tor', 9],
  ['castle-banquet', 8], ['castle-king', 3], ['castle-warband', 5]])
  assert.equal(tokens.filter(token => token.encounter === encounter).length, count,
    `Wrong token count for ${encounter}`);
assert.equal(tokens.find(token => token.id === 's3-grol').maxHp, 45);
assert.equal(tokens.find(token => token.id === 's3-vyerith').type, 'doppelganger');
assert(board.includes("t.id === 's3-vyerith' ? 'custom'"), 'Vyerith player-display mask missing');
const legacy = {
  sessionKind: 'custom', session3ContentVersion: 0, scene: 'lmop-map-cragmaw-castle',
  scenes: [{ id: 'lmop-map-cragmaw-castle', title: 'Castle', kind: 'map',
    image: 'lmop-battle-maps/professional/cragmaw-castle.png', fog: true, grid: true }],
  encounters: [{ id: 'castle-king', name: 'King’s quarters' }],
  runbookBeats: [{ id: 's3-choice', title: 'Choose lead', scene: 'town-phandalin' },
    { id: 's3-castle-sight', title: 'Castle revealed', scene: 'lmop-map-cragmaw-castle' }],
  tokens: [{ id: 's3-grol', name: 'King Grol', label: 'KG', type: 'bugbear',
    team: 'enemy', encounter: 'castle-king', maxHp: 45, hp: 17 }],
  sceneFog: { 'lmop-map-cragmaw-castle': ['1,1'] }
};
const migrated = global.__session3Test.normalize(legacy);
assert.equal(migrated.session3ContentVersion, 1);
assert(migrated.runbookBeats.some(beat => beat.id === 's3-tt-13'));
assert(migrated.encounters.some(encounter => encounter.id === 'tt-dragon-7'));
assert(migrated.scenes.some(scene => scene.id === 'lmop-map-thundertree-overview'));
assert.equal(migrated.tokens.find(token => token.id === 's3-grol').hp, 17);
assert(migrated.sceneFog['lmop-map-cragmaw-castle'].includes('1,1'), 'Castle fog reveal lost during migration');
assert.equal(migrated.tokens.filter(token => token.id === 's3-grol').length, 1);
assert.equal(global.__session3Test.normalize(migrated).tokens.filter(token => token.id === 's3-grol').length, 1);

for (const type of ['hobgoblin', 'grick', 'owlbear', 'doppelganger', 'orc',
  'ogre', 'zombie', 'hamun-kost', 'twig-blight', 'ash-zombie', 'giant-spider',
  'young-green-dragon', 'cultist'])
  assert(global.ECHO_COMBAT_DATA.CREATURES[type], `Missing creature card: ${type}`);
const library = global.ECHO_PRESENTATION.normalizeLibrary({ presetCatalogVersion: 5, presets: [] });
for (const id of ['s3-town', 's3-trail', 's3-castle-sight', 's3-castle-map', 's3-grol']) {
  assert.equal(library.presets.filter(preset => preset.id === id).length, 1, `Missing preset: ${id}`);
  assert.equal(global.ECHO_PRESENTATION.normalizeLibrary(library).presets.filter(preset => preset.id === id).length, 1,
    `Duplicated preset: ${id}`);
}
delete global.__session3Test;
console.log(`Session 3 pack verified: ${pack.runbook.length} beats, ${pack.encounters.length} encounters, ${tokens.length} enemy tokens.`);

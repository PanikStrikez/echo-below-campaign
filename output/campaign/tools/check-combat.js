const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'Session-01-Combat-Data.js'));
const model = globalThis.ECHO_COMBAT_DATA;

for (const name of ['goblin', 'wolf', 'bugbear']) {
  const creature = model.CREATURES[name];
  assert(creature.source.includes('SRD 5.1'));
  assert.equal(creature.abilities.length, 6);
  assert(creature.actions.length && creature.traits.length);
  assert(Array.isArray(creature.reactions) && Array.isArray(creature.spells));
}
assert.equal(model.CREATURES['redbrand-ruffian'].actions.find(item=>item.name==='Shortsword').bonus,4);
assert.equal(model.CREATURES.nothic.actions.find(item=>item.name==='Rotting Gaze').dice,'3d6');
assert.equal(model.CREATURES['sildar-equipped'].reactions[0].name,'Parry');
assert.equal(model.CREATURES['sildar-equipped'].hp,27);
const plans = model.normalizeCombat(null, [{ id: 'road' }, { id: 'custom-1' }]);
assert(plans.plans.road.waves[0].tokenIds.includes('goblin-1'));
assert.equal(plans.plans['custom-1'].waves.length, 0);
assert.equal(plans.tokens['pc-ringgo'].resistances, 'fire');
const custom = model.normalizeCombat({ library: [{ id: 'abc', name: 'Ambush', plan: plans.plans.road,
  combatants: [{ originalId: 'goblin-1', name: 'Goblin', label: 'G', type: 'goblin', team: 'enemy', maxHp: 7, ac: 15, x: 20, y: 30 }] }] }, []);
assert.equal(custom.library[0].combatants[0].originalId, 'goblin-1');
assert.equal(model.normalizePlan({ wrap: { lootCustody: 'Ringgo', wagon: 'Roadside', promises: 'Free Sildar' } }, 'den').wrap.promises, 'Free Sildar');
const token = { hp: 12, maxHp: 20, tempHp: 5 };
assert.deepEqual(model.damagePreview(token, 10, 'fire', 'damage', { resistances: 'fire' }),
  { adjusted: 5, factor: .5, tempUsed: 5, tempHp: 0, hp: 12 });
assert.equal(model.damagePreview(token, 10, 'fire', 'damage', { vulnerabilities: 'fire' }).hp, 0);
assert.equal(model.damagePreview(token, 10, 'fire', 'damage', { immunities: 'fire' }).hp, 12);
assert.equal(model.damagePreview(token, 5, 'fire', 'damage', { resistances: 'fire', vulnerabilities: 'fire' }).adjusted, 4);
assert.equal(model.damagePreview(token, 4, '', 'heal', {}).hp, 16);
const circle = { kind: 'circle', x1: 50, y1: 50, x2: 60, y2: 50 };
assert(model.inShape(circle, { x: 55, y: 50 }));
assert(!model.inShape(circle, { x: 75, y: 50 }));
assert(model.inShape({ kind: 'square', x1: 10, y1: 10, x2: 30, y2: 30 }, { x: 20, y: 20 }));
assert(model.inShape({ kind: 'cone', x1: 10, y1: 20, x2: 50, y2: 20 }, { x: 35, y: 20 }));
assert.equal(model.pace(200, [1, 1, 1]).label, 'Medium');
assert.equal(model.pace(400, [2, 2, 2, 2, 2], '', 4).label, 'Hard');
assert.equal(model.pace(600, [2, 2, 2, 2, 2], '', 3).label, 'Deadly');
assert.equal(model.pace(200, [5]).label, 'Easy');
assert.equal(model.expectedScene('redbrand-street'), 'phandalin-street');
assert.equal(model.expectedScene('hideout-bugbears'), 'redbrand-hideout');
assert.equal(model.expectedScene('custom-1'), '');
assert.equal(model.creatureDefense('skeleton').vulnerabilities, 'bludgeoning');
assert.equal(model.creatureDefense('skeleton').immunities, 'poison');
assert.equal(model.creatureSaveBonus(model.CREATURES['evil-mage'], 'int'), 5);
assert.equal(model.creatureSaveBonus(model.CREATURES['evil-mage'], 'wis'), 3);
assert.equal(model.creatureSaveBonus(model.CREATURES['evil-mage'], 'dex'), 2);

const html = fs.readFileSync(path.join(root, 'Session-01-TV-Display.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'Session-01-Combat-UI.js'), 'utf8');
for (const [, id] of ui.matchAll(/\$\('([^']+)'\)/g))
  assert(html.includes(`id="${id}"`), `Missing UI element: ${id}`);
const loader = fs.readFileSync(path.join(root, 'Session-01-Loader.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'Campaign-Module-Manifest.js'), 'utf8');
assert(loader.includes('Campaign-Module-Manifest.js'));
assert(manifest.includes('Session-01-Combat-Data.js') && manifest.includes('Session-01-Combat-UI.js'));
const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
assert(board.includes('statusDue:') && board.includes('prepareArea:') && board.includes('applyReviewedDamage'));
assert(board.includes("token('yeemik', 'Yeemik', 'Y', 'goblin', 'enemy', 12, 'den')"));
assert(board.includes('expectedScene(encounterId)'));
console.log('Combat checks passed: creature sources, templates, geometry, damage, pacing, and UI hooks.');

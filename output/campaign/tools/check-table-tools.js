const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'Session-01-Table-Tools.js'));

const tools = globalThis.ECHO_TABLE;
assert.deepEqual(tools.normalize(null), {schemaVersion: 1, clues: [], inventory: [], reducedEffects: false, sessionFlow:null, expeditions:null, flow:null, desk:null, expedition:null, settlements:null, atmosphere:null, dungeon:null, atlas:null, travel:null, playerHub:null});
const saved = tools.normalize({
  clues: [
    {id: 'clue-1', to: 'pc-trista', title: 'Below token', text: 'The stone feels warm.', image: 'assets/token.png', delivered: true},
    {id: 'clue-2', to: 'pc-trista', title: 'Unsafe path', text: 'Nope', image: '../sources/private.pdf', delivered: true},
    {id: 'clue-3', to: 'enemy-goblin', title: 'Bad target', text: 'Nope', delivered: true}
  ],
  inventory: [{id: 'loot-1', name: 'Potion', quantity: 2, holder: 'pc-pebble'}],
  reducedEffects: true
});
assert.equal(saved.clues.length, 2);
assert.equal(saved.clues[0].image, 'assets/token.png');
assert.equal(saved.clues[1].image, '');
assert.equal(saved.inventory[0].quantity, 2);
assert.equal(saved.reducedEffects, true);
assert.equal(tools.phaseFor(7 * 60), 'dawn');
assert.equal(tools.phaseFor(19 * 60), 'dusk');
assert.deepEqual(tools.normalizeMood({minutes: 1500, weather: 'rain'}), {minutes: 60, weather: 'rain'});
console.log('Table tools passed: saved data, private clue validation, inventory, and scene time.');

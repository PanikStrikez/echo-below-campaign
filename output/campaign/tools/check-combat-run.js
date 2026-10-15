const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
require(path.resolve(__dirname, '..', 'Session-01-Combat-Data.js'));
require(path.resolve(__dirname, '..', 'Session-01-Combat-Run.js'));
const run = globalThis.ECHO_COMBAT_RUN;

assert.deepEqual(run.damageDice('2d6+3'), {count: 2, sides: 6, modifier: 3});
assert.deepEqual(run.damageDice('1d8-1'), {count: 1, sides: 8, modifier: -1});
assert.equal(run.damageDice('roll a lot'), null);
assert.equal(run.attackOutcome({natural:1,total:30}, 10), 'Miss (natural 1)');
assert.equal(run.attackOutcome({natural:20,total:20}, 25), 'Critical hit (natural 20)');
assert.equal(run.attackOutcome({natural:19,total:25}, 30, 19), 'Critical hit (natural 19)');
assert.equal(run.attackOutcome({natural:19,total:25}, 30), 'Miss');
assert.equal(run.attackOutcome({natural:14,total:18}, 17), 'Hit');
assert.equal(run.attackOutcome({natural:14,total:18}, 19), 'Miss');
assert.equal(run.attackOutcome({natural:null,total:18}, null), 'AC unknown · DM decision');
assert.deepEqual(run.normalize(null).queue.done, []);
const normalized = run.normalize({initiativePrompt:{open:true,scene:'redbrand-street'},
  queue:{key:'redbrand-street:1:redbrand-1',done:[true,false],movementUsed:25,actionUsed:true},
  encounterStatus:{'redbrand-street':'parley','invalid key!':'fighting'},
  resources:{'redbrand-1':[{name:'Spell slots',current:2,max:4}]}});
assert.equal(normalized.initiativePrompt.open, true);
assert.equal(normalized.queue.movementUsed, 25);
assert.equal(normalized.encounterStatus['redbrand-street'], 'parley');
assert.equal(normalized.encounterStatus['invalid key!'], undefined);
assert.deepEqual(normalized.resources['redbrand-1'], [{name:'Spell slots',current:2,max:4}]);
globalThis.document = {getElementById: () => null};
run.init({party: () => ({}), combat: () => ({creatures:{}})});
const ruffian = {id:'redbrand-1',type:'redbrand-ruffian',extraAttacks:[]};
const attacks = run.attackChoices(ruffian);
assert.equal(attacks.length, 1);
assert.equal(attacks[0].name, 'Shortsword');
assert.deepEqual(run.sequence(ruffian, attacks).map(step => step.attackIndex), [0,0]);
const root = path.resolve(__dirname, '..');
assert(fs.readFileSync(path.join(root, 'Campaign-Module-Manifest.js'), 'utf8').includes('Session-01-Combat-Run.js'));
const html = fs.readFileSync(path.join(root, 'Session-01-TV-Display.html'), 'utf8');
assert(html.includes('id="combat-live-panel"') && html.includes('id="request-initiative"'));
console.log('Combat run passed: save migration, attack dice, and encounter state.');

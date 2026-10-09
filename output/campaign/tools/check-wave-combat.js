const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const file of ['Session-01-Combat-Data.js','Session-03-Thundertree-Combat.js','Session-04-Combat.js','LMOP-Battle-Map-Catalog.js']) require(path.join(root,file));
const data = globalThis.ECHO_COMBAT_DATA;
const wave = globalThis.ECHO_SESSION4_COMBAT;
const expected = {2:1,3:10,4:9,6:3,8:0,9:7,11:5,12:9,14:1,15:1,18:4,19:7};
const ids = new Set(wave.tokenSpecs.map(t=>t.id));
assert.equal(ids.size,wave.tokenSpecs.length,'No duplicated combatants');
assert.equal(wave.encounters.length,Object.keys(expected).length);
assert.equal(wave.tokenSpecs.length,57);
for (const [room,count] of Object.entries(expected)) {
  const id = `wave-${room}`;
  const plan = data.normalizePlan(null,id);
  const tokens = wave.tokenSpecs.filter(t=>t.encounter===id);
  assert.equal(tokens.length,count,`Published starting count for room ${room}`);
  const deployed = plan.waves.flatMap(w=>w.tokenIds);
  assert.deepEqual([...deployed].sort(),tokens.map(t=>t.id).sort(),`Only that room’s starting occupants are deployed in ${room}`);
  assert(data.ENCOUNTER_PAGES[id]>=44 && data.ENCOUNTER_PAGES[id]<=50);
  const map = globalThis.LMOP_BATTLE_MAP_CATALOG.find(m=>m.id===wave.sceneForEncounter[id]);
  assert(map && fs.existsSync(path.join(root,map.image)),`Linked map exists for ${id}`);
  for (const token of tokens) {
    const creature = data.CREATURES[token.type];
    assert(creature && creature.hp===token.maxHp,`Stat block and HP for ${token.id}`);
    assert(creature.book && creature.page && creature.abilities.length===6);
    for (const key of ['actions','traits','reactions','spells']) assert(Array.isArray(creature[key]));
  }
}
assert.equal(wave.tokenSpecs.filter(t=>t.type==='vhalak').length,1,'Vhalak is not duplicated as a false Nundro');
assert.equal(wave.tokenSpecs.find(t=>t.type==='vhalak').name,'Drow overseer','Initial visible name preserves the disguise');
assert.equal(wave.rescueAlly.currentHp,null,'Unspecified captive health is not invented');
assert(!ids.has(wave.rescueAlly.id),'Rescue ally not deployed before discovery');
assert.equal(data.CREATURES.mormesk.hp,45,'Use adventure-specific wraith');
assert.equal(data.CREATURES.mormesk.cr,3);
assert(!JSON.stringify(data.CREATURES.mormesk.actions).includes('Create Specter'));
assert(data.CREATURES.mormesk.actions[0].note.includes('maximum HP'));
assert.equal(data.CREATURES.nezznar.ac,11,'Mage armor requires recorded casting');
assert.equal(data.CREATURES.nezznar.hp,27);
assert.equal(data.creatureSaveBonus(data.CREATURES.nezznar,'int'),5);
assert.equal(data.creatureSaveBonus(data.CREATURES.flameskull,'dex'),3);
assert.equal(data.creatureDefense('ochre-jelly').immunities,'lightning, slashing');
assert(data.CREATURES.flameskull.traits.some(t=>t.name==='Rejuvenation' && t.text.includes('1 hour')));
assert(data.CREATURES.spectator.actions.some(a=>a.name==='Wounding Ray' && a.dice==='3d10' && a.bonus===null));
assert.equal(wave.resources['s4-wave-12-flameskull-1'].find(r=>r.name==='3rd-level slots').current,1);
assert.equal(wave.resources['s4-wave-19-nezznar-1'].find(r=>r.name==='Spider staff charges').max,10);
for (const [id,resources] of Object.entries(wave.resources)) {
  assert(ids.has(id));
  assert(resources.every(r=>r.current>=0 && r.current<=r.max));
}
for (const [type,names] of Object.entries(wave.sequences)) for (const name of names)
  assert(data.CREATURES[type].actions.some(a=>a.name===name && Number.isFinite(a.bonus)));
console.log('Wave Echo combat verified: 12 encounters, 57 unique enemies, map links, source-specific blocks, spell resources, and no duplicate reinforcements.');

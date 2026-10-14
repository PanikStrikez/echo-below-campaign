const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'Session-01-Party-Data.js'));
const model = globalThis.ECHO_PARTY_DATA;

(async () => {
  const seed = model.seedParty()['pc-ringgo'];
  assert.equal(seed.level, 3, 'Historical seed must remain level 3.');
  assert.equal(seed.abilities.dex, 19);
  const raw = structuredClone(seed);
  raw.hp = 11;
  raw.tempHp = 3;
  raw.hitDice.current = 1;
  raw.hitDice.pools = [{ die: 8, max: 3, current: 1 }];
  raw.resources.find(item => item.id === 'ringgo-arrows').current = 13;
  raw.resources.find(item => item.id === 'ringgo-hellish-rebuke').current = 0;
  raw.equipment.push({ name: 'Captured key', quantity: 1, category: 'Gear', notes: 'Keep this custom item.', attuned: false, equipped: false });
  raw.money.gp = 67;
  raw.inspiration = true;
  raw.conditions = ['Poisoned'];
  raw.notes += ' Secret from the DM.';
  const original = structuredClone(raw);
  const state = { party: { 'pc-ringgo': raw }, tokens: [{ id: 'pc-ringgo', hp: 11, maxHp: 24, ac: 16, tempHp: 3 }] };
  model.applyLevelFourChoices(state, ['pc-ringgo']);
  const ringgo = state.party['pc-ringgo'];
  assert.deepEqual(raw, original, 'Level-up must not mutate its input sheet.');
  assert.equal(ringgo.level, 4);
  assert.equal(ringgo.maxHp, 29);
  assert.equal(ringgo.hp, 16, 'Existing 13 damage must remain.');
  assert.equal(ringgo.tempHp, 3);
  assert.equal(ringgo.abilities.dex, 20);
  assert.equal(ringgo.abilities.con, 14);
  assert.equal(ringgo.speed, 30);
  assert.equal(ringgo.ac, 17);
  assert.equal(ringgo.proficiency, 2);
  assert.equal(ringgo.saves.dex.override, 7);
  assert.equal(ringgo.skills.Acrobatics.override, 7);
  assert.equal(ringgo.skills['Sleight of Hand'].override, 7);
  assert.equal(ringgo.skills.Stealth.override, 9);
  assert.equal(ringgo.skills.Investigation.override, 4);
  assert.equal(ringgo.hitDice.max, 4);
  assert.equal(ringgo.hitDice.current, 2, 'Two spent Hit Dice must remain spent.');
  assert.equal(ringgo.hitDice.details, '4d8 (Rogue 4)');
  assert.deepEqual(ringgo.hitDice.pools, [{ die: 8, max: 4, current: 2 }]);
  assert.equal(ringgo.resources.find(item => item.id === 'ringgo-arrows').current, 13);
  assert.equal(ringgo.resources.find(item => item.id === 'ringgo-hellish-rebuke').current, 0);
  assert(ringgo.equipment.some(item => item.name === 'Captured key' && item.notes === 'Keep this custom item.'));
  assert.equal(ringgo.money.gp, 67);
  assert.equal(ringgo.inspiration, true);
  assert.deepEqual(ringgo.conditions, ['Poisoned']);
  assert(ringgo.notes.includes('Secret from the DM.'));
  assert(ringgo.notes.includes('Approved level 4'));
  assert(ringgo.source.includes('Ringgo pp. 1–5'));
  assert(ringgo.sourceStatus.includes('HP d8 roll 3'));
  assert.deepEqual(ringgo.attacks.filter(item => item.id !== 'ringgo-sneak').map(item => [item.id, item.attackBonus, item.damageDice]), [
    ['ringgo-rapier', 7, '1d8+5'], ['ringgo-shortbow', 7, '1d6+5'], ['ringgo-dagger', 7, '1d4+5'], ['ringgo-offhand', 7, '1d4']
  ]);
  assert.equal(ringgo.attacks.find(item => item.id === 'ringgo-sneak').damageDice, '2d6');
  assert(ringgo.actions.some(item => item.id === 'ringgo-piercer-reroll' && /use the new roll/.test(item.effect)));
  assert(ringgo.actions.some(item => item.id === 'ringgo-piercer-critical' && /not doubled/.test(item.effect)));
  assert(ringgo.features.some(item => item.name === 'Piercer'));
  assert(!ringgo.actions.some(item => item.id.startsWith('trista-')));
  assert(!ringgo.features.some(item => ['Speedy', 'Slow Fall', 'Monk’s Focus', 'Uncanny Metabolism'].includes(item.name)));
  assert.deepEqual(state.tokens[0], { id: 'pc-ringgo', hp: 16, maxHp: 29, ac: 17, tempHp: 3 });
  assert.equal(ringgo.levelHistory.at(-1).snapshot.level, 3);
  assert.equal(ringgo.levelHistory.at(-1).snapshot.abilities.dex, 19);
  const after = structuredClone(state);
  model.applyLevelFourChoices(state, ['pc-ringgo']);
  assert.deepEqual(state, after, 'Repeated load must not reapply HP or Dexterity gains.');
  assert.equal(model.levelFourSheet({ ...seed, hp: 0 }).hp, 0, 'Level-up must not revive an unconscious PC.');
  assert.equal(model.levelFourSheet({ ...seed, hp: null }).hp, null, 'Unknown current HP remains unknown.');
  const restored = model.normalizeParty(JSON.parse(JSON.stringify(state.party)), state.tokens, false, true)['pc-ringgo'];
  assert.deepEqual(restored, ringgo, 'Saved level-4 sheet must survive normalization without regression.');
  const phone = model.ownerView(restored);
  assert.equal(phone.level, 4);
  assert.equal(phone.maxHp, 29);
  assert.equal(phone.ac, 17);
  assert.equal(phone.abilities.dex.modifier, 5);
  assert.equal(phone.saves.find(item => item.name === 'DEX').bonus, 7);
  assert.equal(phone.skills.find(item => item.name === 'Stealth').bonus, 9);
  assert.equal(phone.hitDice.details, '4d8 (Rogue 4)');
  assert(phone.features.some(item => item.name === 'Piercer'));
  assert(phone.actions.some(item => item.id === 'ringgo-piercer-critical'));
  assert(!JSON.stringify(phone).includes('Secret from the DM.'));
  assert(!Object.hasOwn(phone, 'levelHistory'));
  assert.equal(model.normalizeParty({ 'pc-ringgo': seed }, [], false, true)['pc-ringgo'].level, 3);

  // Exercise the actual startup migration block with isolated in-memory storage.
  const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
  const start = board.indexOf('    const levelFourIds =');
  const end = board.indexOf('    campaignContinuity();', start);
  assert(start > 0 && end > start);
  const migrate = new Function('activeCampaignId', 'activeSessionId', 'state', 'campaignIndex', 'readRecord', 'writeRecord', 'campaignSessionKey', 'DATA_VERSION',
    `return (async () => { ${board.slice(start, end)} })();`);
  for (const campaign of ['default', 'practice-test']) {
    const current = { party: { 'pc-ringgo': structuredClone(original) }, tokens: [{ id: 'pc-ringgo', hp: 11, maxHp: 24, ac: 16 }] };
    const history = JSON.stringify({ party: { 'pc-ringgo': seed } });
    const store = new Map([['session:historical', history], ['session:current', JSON.stringify(current)]]);
    const index = { active: 'current', sessions: [{ id: 'historical' }, { id: 'current' }], restorePoints: [] };
    await migrate(campaign, 'current', current, index, key => store.get(key), (key, value) => store.set(key, value), id => `session:${id}`, 2);
    assert.equal(store.get('session:historical'), history, 'Other historical sessions must remain untouched.');
    if (campaign === 'default') {
      assert.equal(current.party['pc-ringgo'].level, 4);
      assert.equal(index.restorePoints.length, 1);
      assert.match(index.restorePoints[0].label, /party level 4/);
      const recovery = JSON.parse(store.get([...store.keys()].find(key => key.startsWith('recovery:'))));
      assert.equal(JSON.parse(recovery.sessions.current).party['pc-ringgo'].level, 3);
      assert.equal(recovery.sessions.historical, history);
      await migrate(campaign, 'current', current, index, key => store.get(key), (key, value) => store.set(key, value), id => `session:${id}`, 2);
      assert.equal(index.restorePoints.length, 1, 'Repeated loads must not add migration backups.');
    } else {
      assert.equal(current.party['pc-ringgo'].level, 3, 'Practice campaigns must retain their sheets.');
      assert.equal(index.restorePoints.length, 0);
    }
  }
  const switchStart = board.indexOf('  async function switchSession(');
  const switchEnd = board.indexOf('  async function createSession(', switchStart);
  assert(!board.slice(switchStart, switchEnd).includes('applyLevelFourChoices'), 'Opening another session must not level it up.');
  console.log('Ringgo level-four checks passed: Piercer, phone stats, HP/Hit Dice/resource preservation, inventory, normalization, idempotence, and active-campaign backup scope.');
})().catch(error => { console.error(error); process.exitCode = 1; });

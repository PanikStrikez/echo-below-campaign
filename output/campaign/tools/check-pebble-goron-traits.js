const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'Session-01-Party-Data.js'));
require(path.join(root, 'Session-01-Combat-Data.js'));
const model = globalThis.ECHO_PARTY_DATA;
const combat = globalThis.ECHO_COMBAT_DATA;

(async () => {
  const seed = model.seedParty()['pc-pebble'];
  const seedBefore = structuredClone(seed);
  const level3 = model.normalizeSheet(model.levelThreeSheet(seed, { hp: 23, maxHp: 23 }), seed);
  const pebble = model.normalizeSheet(model.levelFourSheet(level3), level3);
  pebble.hp = 31;
  pebble.tempHp = 3;
  pebble.hitDice.current = 1;
  pebble.resources.forEach(item => { item.current = 0; });
  pebble.equipment.push({ name: 'Unconsumed magic stone', quantity: 1, category: 'Gear', notes: 'No properties resolved yet.', attuned: false, equipped: false });
  pebble.money.gp = 73;
  pebble.conditions = ['Poisoned'];
  pebble.inspiration = true;
  pebble.notes += ' Secret GM detail.';
  pebble.publicNotes = 'My shield has a makers mark.';
  const state = {
    party: { 'pc-pebble': pebble, 'pc-ringgo': model.levelFourSheet(model.seedParty()['pc-ringgo']) },
    tokens: [{ id: 'pc-pebble', hp: 31, maxHp: 43, ac: 18, tempHp: 3, conditions: ['Poisoned'] }],
    combat: combat.normalizeCombat({ tokens: { 'pc-pebble': {
      surprised: true, reactionUsed: true, ready: 'Guard the door', concentration: 'Existing effect',
      resistances: 'cold; poison', vulnerabilities: 'radiant', immunities: 'necrotic'
    } }, effects: [{ id: 'custom-effect', tokenId: 'pc-pebble', name: 'Existing reminder' }] }, []),
    notes: 'Private campaign note'
  };
  const before = structuredClone(state);
  assert(!model.hasGoronTraits(pebble));
  model.applyGoronTraits(state);
  const next = state.party['pc-pebble'];
  assert(model.hasGoronTraits(next));
  assert.deepEqual(pebble, before.party['pc-pebble'], 'Input character must not be mutated.');
  assert.deepEqual(seed, seedBefore, 'Historical seed must not gain the homebrew.');
  assert.equal(next.level, 4);
  assert.equal(next.maxHp, 43);
  assert.equal(next.ac, 18);
  for (const key of Object.keys(pebble).filter(key => !['features', 'actions', 'senses'].includes(key)))
    assert.deepEqual(next[key], pebble[key], `${key} must be preserved, including damage, uses, and private data.`);
  for (const item of pebble.features) assert.deepEqual(next.features.find(feature => feature.name === item.name), item);
  for (const item of pebble.actions) assert.deepEqual(next.actions.find(action => action.id === item.id), item);
  assert(next.features.some(item => item.name === 'Crusher'));
  assert(next.features.some(item => item.name === 'Tough'));
  assert(next.senses.includes('Darkvision 60 ft.'));
  assert(next.senses.includes('fire resistance'));
  const fire = next.features.find(item => item.name === 'Fire-Forged');
  const rocks = next.features.find(item => item.name === 'Rock Eater');
  assert.match(fire.text, /rounding down/);
  assert.match(rocks.text, /Eating a magical stone stores its magical properties for 24 hours of in-game time/);
  assert.match(rocks.text, /Choose when to activate or use its power within that window/);
  assert.match(rocks.text, /expire 24 hours after the stone is eaten; activating late does not reset/);
  assert.match(rocks.text, /activation\/action cost, and any stone-specific uses or limits/);
  assert.match(rocks.text, /still need water/);
  assert.match(rocks.source, /Homebrew.*2026-10-09/);
  assert(!/long rest|attunement|permanent|once per|random/.test(rocks.text));
  assert.equal(next.equipment.find(item => item.name === 'Unconsumed magic stone').quantity, 1);
  assert.equal(next.features.length, pebble.features.length + 2);
  assert.equal(next.actions.length, pebble.actions.length + 2);
  assert.deepEqual(state.tokens, before.tokens);
  assert.deepEqual(state.party['pc-ringgo'], before.party['pc-ringgo']);
  assert.deepEqual(state.combat.effects, before.combat.effects);
  const defense = state.combat.tokens['pc-pebble'];
  for (const key of Object.keys(defense).filter(key => key !== 'resistances'))
    assert.deepEqual(defense[key], before.combat.tokens['pc-pebble'][key]);
  assert.equal(defense.resistances, 'cold; poison, fire');
  assert.equal(combat.damagePreview(state.tokens[0], 11, 'fire', 'damage', defense).adjusted, 5);
  assert.equal(combat.damagePreview(state.tokens[0], 11, 'slashing', 'damage', defense).adjusted, 11);

  const after = structuredClone(state);
  model.applyGoronTraits(state);
  assert.deepEqual(state, after, 'Repeated application must not duplicate traits or alter live state.');
  assert.deepEqual(model.goronTraitsSheet(next), next, 'Sheet transformation must also be idempotent.');
  const roundTrip = JSON.parse(JSON.stringify(state));
  roundTrip.party = model.normalizeParty(roundTrip.party, roundTrip.tokens, false, true);
  roundTrip.combat = combat.normalizeCombat(roundTrip.combat, []);
  assert.deepEqual(roundTrip.party['pc-pebble'], next);
  assert.equal(roundTrip.combat.tokens['pc-pebble'].resistances, 'cold; poison, fire');
  const phone = model.ownerView(roundTrip.party['pc-pebble']);
  assert(phone.features.some(item => item.name === 'Fire-Forged'));
  assert(phone.actions.some(item => item.id === 'pebble-rock-eater' && /magical properties/.test(item.effect)));
  assert.equal(phone.hp, 31);
  assert.equal(phone.maxHp, 43);
  assert(!JSON.stringify(phone).includes('Secret GM detail'));
  assert(!Object.hasOwn(phone, 'levelHistory'));
  assert(!JSON.stringify(model.safeView(next)).includes('Secret GM detail'));

  // Execute the real startup migrations, including an already-level-four Pebble.
  const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
  const start = board.indexOf('    const levelFourIds =');
  const end = board.indexOf('    campaignContinuity();', start);
  assert(start > 0 && end > start);
  const migrate = new Function('activeCampaignId', 'activeSessionId', 'state', 'campaignIndex', 'readRecord', 'writeRecord', 'campaignSessionKey', 'DATA_VERSION',
    `return (async () => { ${board.slice(start, end)} })();`);
  for (const campaign of ['default', 'practice-test']) {
    const live = structuredClone(before);
    const historical = JSON.stringify({ party: { 'pc-pebble': seed } });
    const stored = new Map([['session:historical', historical], ['session:current', JSON.stringify(live)]]);
    const index = { active: 'current', sessions: [{ id: 'historical' }, { id: 'current' }], restorePoints: [] };
    const run = () => migrate(campaign, 'current', live, index, key => stored.get(key),
      (key, value) => stored.set(key, value), id => `session:${id}`, 2);
    await run();
    assert.equal(stored.get('session:historical'), historical);
    if (campaign === 'default') {
      assert(model.hasGoronTraits(live.party['pc-pebble']));
      assert.equal(live.party['pc-pebble'].maxHp, 43);
      assert.equal(live.party['pc-pebble'].hp, 31);
      assert.equal(index.restorePoints.length, 1);
      assert.equal(index.restorePoints[0].label, 'Before Pebble Goron traits');
      const recovery = JSON.parse(stored.get([...stored.keys()].find(key => key.startsWith('recovery:'))));
      assert.deepEqual(JSON.parse(recovery.sessions.current), before);
      assert.equal(recovery.sessions.historical, historical);
      const completed = structuredClone(live);
      await run();
      assert.deepEqual(live, completed);
      assert.equal(index.restorePoints.length, 1);
    } else {
      assert.deepEqual(live, before, 'Practice campaign must retain its entire saved state.');
      assert.equal(index.restorePoints.length, 0);
    }
  }
  const switchStart = board.indexOf('  async function switchSession(');
  const switchEnd = board.indexOf('  async function createSession(', switchStart);
  assert(!board.slice(switchStart, switchEnd).includes('applyGoronTraits'), 'Opening a historical session must not grant traits.');

  // The app rebuilds combat records for new/custom/packed/restarted sessions.
  // Exercise each actual normalization call plus its permanent-trait sync.
  for (const [marker, targetName] of [
    ['fresh.combat = globalThis.ECHO_COMBAT_DATA?.normalizeCombat({ library: from.combat?.library,', 'fresh'],
    ['fresh.combat = globalThis.ECHO_COMBAT_DATA?.normalizeCombat(raw.combat, sessionEncounters(fresh))', 'fresh'],
    ['fresh.combat = globalThis.ECHO_COMBAT_DATA.normalizeCombat({ library: campaignIndex.combatLibrary,', 'fresh'],
    ['next.combat = globalThis.ECHO_COMBAT_DATA.normalizeCombat({ library: campaignIndex.combatLibrary,', 'next']
  ]) {
    const blockStart = board.indexOf(marker);
    const syncCall = `globalThis.ECHO_PARTY_DATA.syncGoronResistance(${targetName});`;
    const blockEnd = board.indexOf(syncCall, blockStart) + syncCall.length;
    assert(blockStart > 0 && blockEnd > blockStart && blockEnd - blockStart < 350, 'Defense sync must directly follow this reset.');
    const resetDefense = new Function('fresh', 'next', 'from', 'raw', 'previous', 'campaignIndex', 'sessionEncounters', 'pack',
      `${board.slice(blockStart, blockEnd)}; return ${targetName};`);
    for (const withTraits of [true, false]) {
      const current = { party: { 'pc-pebble': structuredClone(withTraits ? next : pebble) }, encounters: [], combat: {} };
      const rebuilt = resetDefense(current, current, {}, { combat: {} }, {}, { combatLibrary: [] }, () => [], {preservePartyProgression:false});
      assert.equal(Boolean(rebuilt.combat.tokens['pc-pebble']?.resistances.includes('fire')), withTraits,
        'Only characters who already have the approved trait retain fire resistance after reset.');
    }
  }

  // Run the actual reviewed damage path: 11 fire becomes 5 before temporary HP.
  require('../Session-01-Commands.js');
  const damageStart = board.indexOf('  function applyReviewedDamage(');
  const damageEnd = board.indexOf('  function combatSaveBonus(', damageStart);
  for(const f of ['Session-01-Combat-Run.js','Session-01-Combat-Plus.js','Session-01-Phone-Actions.js','Session-01-Combat-Actions.js'])require(path.join(root,f));
  const damageState = structuredClone(state);
  Object.assign(damageState,{scene:'map',turn:{scene:'map',order:[],index:0,round:0},phoneActions:ECHO_PHONE_ACTIONS.normalize(),phoneReplies:{},rolls:[],combatPlus:ECHO_COMBAT_PLUS.normalize(),combatRun:ECHO_COMBAT_RUN.normalize()});
  Object.assign(damageState.tokens[0],{name:'Pebble',maxHp:43,scene:'map',placed:true});
  global.ECHO_PHONE_ACTION_CONDITIONS=['Poisoned'];
  let damageLive=damageState,staged=null,commits=0;
  global.ECHO_PHONE_ACTIONS_UI={open:(id,plan)=>staged={id,plan}};
  const applyDamage = new Function('getState', 'setState', 'CONDITIONS', 'commit',
    `let state = getState(); ${board.slice(damageStart, damageEnd)}; return draft => { applyReviewedDamage(draft); setState(state); };`)(
    () => damageLive, value => damageLive = value, ['Poisoned'], () => commits++);
  applyDamage({ selected: ['pc-pebble'], amount: '11', type: 'fire', mode: 'damage' });
  assert.equal(damageLive.tokens[0].hp,31,'Staging never applies HP or resource changes');assert.equal(damageLive.tokens[0].tempHp,3);
  staged.plan.acknowledged=true;staged.plan.reactionsChecked=true;
  const request=damageLive.phoneActions.requests.find(r=>r.id===staged.id),review=ECHO_COMBAT_ACTIONS.prepare(damageLive,request,staged.plan,{visible:['pc-pebble'],die:()=>4,saveBonus:()=>0});
  const command=ECHO_COMMANDS.prepare(damageLive,{type:'resolve-combat-action',review,expectedRevision:review.baseRevision},{visible:['pc-pebble']});
  damageLive=ECHO_COMMANDS.apply(damageLive,command);commits++;
  assert.equal(damageLive.tokens[0].tempHp, 0);
  assert.equal(damageLive.tokens[0].hp, 29);
  assert.equal(commits,2,'One staging event and one complete resolution');
  assert.equal(damageLive.party['pc-pebble'].hp,29,'Shared engine synchronizes the owner sheet');
  assert.equal(damageLive.phoneActions.requests[0].status,'resolved');
  console.log('Pebble Goron checks passed: owner phone traits, typed fire resistance, save preservation, no stone consumption, idempotence, and current-campaign restore point.');
})().catch(error => { console.error(error); process.exitCode = 1; });

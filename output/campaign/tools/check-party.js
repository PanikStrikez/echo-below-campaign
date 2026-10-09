const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'Session-01-Party-Data.js'));
const model = globalThis.ECHO_PARTY_DATA;
const party = model.seedParty();

assert.equal(Object.keys(party).length, 6);
assert.equal(party['pc-aldric'].player, 'Bowman');
assert.equal(party['pc-aldric'].hp, 16);
assert.equal(party['pc-aldric'].maxHp, 25);
assert.equal(party['pc-aldric'].level, 3);
assert.equal(party['pc-aldric'].abilities.int, 18);
assert.equal(party['pc-aldric'].abilities.con, 16);
assert.equal(party['pc-aldric'].actions.find(item => item.id === 'aldric-scorcher').saveDC, 14);
assert.equal(party['pc-aldric'].resources.find(item => item.id === 'aldric-slots-1').current, 4);
assert.equal(party['pc-aldric'].resources.find(item => item.id === 'aldric-slots-2').current, 2);
assert.equal(party['pc-aldric'].spells.filter(item => item.level === 1 && item.prepared).length, 5);
assert(party['pc-aldric'].spells.some(item => item.name === 'Web' && item.level === 2));
assert(!party['pc-aldric'].spells.some(item => item.name === 'Thunderwave'));
assert(party['pc-aldric'].sourceStatus.includes('table rule'));
assert(!JSON.stringify(model.safeView(party['pc-aldric'])).includes('mass executions'));
const upgradedAldric = model.normalizeParty({ 'pc-aldric': { id: 'pc-aldric', name: 'Aldric Vane', role: 'pc',
  sourceStatus: 'Story confirmed; level and all combat numbers pending', hp: null, level: null } });
assert.equal(upgradedAldric['pc-aldric'].hp, 16);
const importedAldric = model.normalizeParty({ 'pc-aldric': { ...party['pc-aldric'],
  sourceStatus: 'Playable DM-built sheet; replace choices with Bowman’s sheet if supplied',
  resources: [{ id: 'aldric-slots-1', name: '1st-level spell slots', max: 2, current: 1 }],
  hitDice: { die: 6, current: 0, max: 1 }, inspiration: true } })['pc-aldric'];
assert.equal(importedAldric.level, 3);
assert.equal(importedAldric.resources.find(item => item.id === 'aldric-slots-1').current, 3);
assert.equal(importedAldric.hitDice.current, 2);
assert.equal(importedAldric.inspiration, true);
assert(!party['ally-dracuseth']);
assert.equal(party['pc-pebble'].player, 'Byron');
assert.equal(party['pc-pebble'].ac, 18);
assert.equal(party['pc-pebble'].hp, 12);
assert.equal(party['pc-pebble'].attacks.find(item => item.id === 'pebble-hammer').attackBonus, 6);
assert.equal(party['pc-pebble'].resources.find(item => item.id === 'pebble-second-wind').current, 1);
const leveled = model.normalizeParty({ 'pc-trista': party['pc-trista'], 'pc-pebble': party['pc-pebble'] }, [
  { id: 'pc-trista', hp: 7, maxHp: 21, tempHp: 0, ac: 14 },
  { id: 'pc-pebble', hp: 23, maxHp: 23, tempHp: 0, ac: 18 }
], true);
assert.equal(leveled['pc-trista'].level, 3);
assert.equal(leveled['pc-trista'].hp, 7);
assert.equal(leveled['pc-trista'].maxHp, 21);
assert.equal(leveled['pc-trista'].speed, 40);
assert.equal(leveled['pc-trista'].resources.find(item => item.id === 'trista-focus').max, 3);
assert(leveled['pc-trista'].actions.some(item => item.id === 'trista-darkness' && item.resourceId === 'trista-focus'));
assert(leveled['pc-trista'].actions.some(item => item.id === 'trista-deflect' && item.damageDice === '1d10+7'));
assert.equal(leveled['pc-pebble'].level, 3);
assert.equal(leveled['pc-pebble'].maxHp, 23);
assert(leveled['pc-pebble'].features.some(item => item.name === 'Improved Critical'));
assert(leveled['pc-pebble'].actions.some(item => item.id === 'pebble-surge' && item.resourceId === 'pebble-action-surge'));
assert.equal(model.ownerView(leveled['pc-trista']).level, 3);
assert(model.ownerView(leveled['pc-trista']).actions.some(item => item.name === 'Shadow Arts: Darkness'));
assert(model.ownerView(leveled['pc-trista']).features.some(item => item.name === 'Deflect Attacks'));
assert.equal(model.ownerView(leveled['pc-pebble']).resources.find(item => item.id === 'pebble-action-surge').current, 1);
assert(model.ownerView(leveled['pc-pebble']).features.some(item => item.name === 'Improved Critical'));
assert.equal(party['pc-donavan'].hp, 24);
assert.equal(model.seedParty([{ id: 'pc-donavan', hp: 0, maxHp: 0, tempHp: 0, ac: null }])['pc-donavan'].hp, null);
assert.equal(party['pc-donavan'].abilities.int, 18);
assert.equal(party['pc-donavan'].abilities.con, 16);
assert.equal(party['pc-donavan'].ac, 16);
assert.equal(party['pc-donavan'].level, 3);
assert.equal(party['pc-donavan'].resources.find(r => r.id === 'donavan-slots-1').max, 4);
assert.equal(party['pc-donavan'].resources.find(r => r.id === 'donavan-slots-2').max, 2);
assert.equal(party['pc-donavan'].className, 'Wizard 2 / Cleric 1 · Order of Scribes / Knowledge Domain');
assert.equal(party['pc-donavan'].hitDice.details, '2d6 + 1d8 (Wizard 2 / Cleric 1)');
assert(party['pc-donavan'].actions.some(item => item.id === 'donavan-command' && item.saveDC === 13));
assert(!party['pc-donavan'].spells.some(item => item.name === 'Mind Sliver'));
assert(party['pc-donavan'].actions.some(item => item.id === 'donavan-catapult' && item.damageDice === '3d8' && item.prepared));
assert(party['pc-donavan'].spells.filter(item => item.level === 1).every(item => item.prepared));
const donavanPhone = model.ownerView(party['pc-donavan']);
assert(donavanPhone.spells.some(item => item.name === 'Catapult' && item.prepared && item.notes.includes('3d8')));
assert(donavanPhone.actions.some(item => item.name === 'Healing Word' && item.damageDice === '1d4+3'));
assert.equal(donavanPhone.hitDice.details, '2d6 + 1d8 (Wizard 2 / Cleric 1)');
assert(donavanPhone.actions.some(item => item.name === 'Silent Image'));
assert(donavanPhone.actions.some(item => item.name === 'Awakened Spellbook: quick ritual'));
assert(donavanPhone.features.some(item => item.name === 'Awakened Spellbook'));
assert(donavanPhone.spells.some(item => item.name === 'Silent Image'));
assert.equal(donavanPhone.money.gp, 90);
const priorDonavan = { ...party['pc-donavan'], level: 2, maxHp: 17, hp: 10,
  className: 'Wizard 1 / Cleric 1 · Knowledge Domain', resources: [
    { id: 'donavan-slots-1', name: '1st-level shared spell slots', max: 3, current: 1 } ],
  hitDice: { die: 6, max: 2, current: 1, details: '1d6 + 1d8' } };
const migratedDonavan = model.normalizeParty({ 'pc-donavan': priorDonavan }, [
  { id: 'pc-donavan', hp: 17, maxHp: 24, tempHp: 0, ac: 16 }
], true)['pc-donavan'];
assert.equal(migratedDonavan.hp, 17);
assert.equal(migratedDonavan.maxHp, 24);
assert.equal(migratedDonavan.hitDice.current, 2);
assert.equal(migratedDonavan.resources.find(item => item.id === 'donavan-slots-1').current, 2);
assert.equal(migratedDonavan.levelHistory.at(-1).snapshot.level, 2);
const olderDonavan = model.normalizeParty({ 'pc-donavan': { ...party['pc-donavan'], actions: [],
  spells: party['pc-donavan'].spells.map(item => item.name === 'Catapult'
    ? { ...item, notes: 'Later-source spell on current sheet; confirm campaign exception.' } : item) } })['pc-donavan'];
assert(olderDonavan.actions.some(item => item.id === 'donavan-catapult'));
assert(olderDonavan.spells.find(item => item.name === 'Catapult').notes.includes('Xanathar'));
assert.equal(party['pc-trista'].abilities.str, 14);
assert.equal(party['pc-trista'].money.gp, 26);
assert.equal(party['pc-trista'].equipment.find(item => item.name === 'Dagger').quantity, 5);
assert(party['pc-trista'].attacks.some(item => item.name === 'Spear' && item.attackBonus === 6));
assert(model.normalizeParty({ 'pc-trista': { ...party['pc-trista'],
  attacks: party['pc-trista'].attacks.filter(item => item.id !== 'trista-spear') } })['pc-trista'].attacks.some(item => item.id === 'trista-spear'));
assert(party['pc-ringgo'].equipment.some(item => item.name === 'Piton' && item.quantity === 10));
assert(!party['pc-ringgo'].equipment.some(item => /potion/i.test(item.name)));
const upgraded = model.normalizeParty({ 'pc-donavan': { ...party['pc-donavan'], sourceStatus: 'Story guide; combat numbers and level need live sheet',
  level: null, abilities: { ...party['pc-donavan'].abilities, str: null }, maxHp: null, hp: null, ac: null, attacks: [] } });
assert.equal(upgraded['pc-donavan'].abilities.str, 12);
assert.equal(upgraded['pc-donavan'].maxHp, 24);
assert.equal(upgraded['pc-donavan'].attacks.length, 3);
assert.equal(party['pc-ringgo'].skills.Stealth.override, 8);
assert.equal(party['pc-ringgo'].skills.Investigation.override, 4);
assert.equal(model.passive(party['pc-ringgo'], 'Investigation'), 14);
assert.equal(model.ownerView(party['pc-ringgo']).skills.find(item => item.name === 'Investigation').bonus, 4);
assert.equal(party['pc-ringgo'].level, 3);
assert.equal(party['pc-ringgo'].maxHp, 24);
assert.equal(party['pc-ringgo'].className, 'Rogue · Assassin');
assert(party['pc-ringgo'].attacks.some(item => item.id === 'ringgo-sneak' && item.damageDice === '2d6'));
assert(party['pc-ringgo'].actions.some(item => item.id === 'ringgo-hellish-rebuke' && item.damageDice === '3d10'));
assert(party['pc-ringgo'].features.some(item => item.name === 'Assassinate'));
const priorRinggo = { ...party['pc-ringgo'], level: 2, hp: 12, maxHp: 17,
  resources: [{ id: 'ringgo-arrows', name: 'Arrows', max: 20, current: 14 }],
  hitDice: { die: 8, max: 2, current: 1 } };
const priorAldric = { ...party['pc-aldric'], level: 2, hp: 9, maxHp: 18,
  actions: [...party['pc-aldric'].actions, { id: 'aldric-burning-hands', name: 'Burning Hands' }],
  spells: [...party['pc-aldric'].spells, { name: 'Thunderwave', level: 1, prepared: true }],
  resources: [{ id: 'aldric-slots-1', name: '1st-level spell slots', max: 3, current: 2 }],
  hitDice: { die: 6, max: 2, current: 1 } };
const migratedPair = model.normalizeParty({ 'pc-ringgo': priorRinggo, 'pc-aldric': priorAldric }, [
  { id: 'pc-ringgo', hp: 19, maxHp: 24, tempHp: 0, ac: 16 },
  { id: 'pc-aldric', hp: 16, maxHp: 25, tempHp: 0, ac: 12 }
], true);
assert.equal(migratedPair['pc-ringgo'].hp, 19);
assert.equal(migratedPair['pc-ringgo'].resources.find(item => item.id === 'ringgo-arrows').current, 14);
assert.equal(migratedPair['pc-ringgo'].hitDice.current, 2);
assert.equal(migratedPair['pc-ringgo'].levelHistory.at(-1).snapshot.level, 2);
assert.equal(migratedPair['pc-aldric'].hp, 16);
assert.equal(migratedPair['pc-aldric'].resources.find(item => item.id === 'aldric-slots-1').current, 3);
assert(!migratedPair['pc-aldric'].spells.some(item => item.name === 'Thunderwave'));
assert(!migratedPair['pc-aldric'].actions.some(item => item.id === 'aldric-burning-hands'));
assert(model.ownerView(migratedPair['pc-ringgo']).actions.some(item => item.name === 'Hellish Rebuke'));
assert(model.ownerView(migratedPair['pc-aldric']).spells.some(item => item.name === 'Web'));
assert(party['pc-ringgo'].actions.some(item => item.id === 'ringgo-cunning-hide'));
assert.equal(model.passive(party['pc-ringgo'], 'Perception'), 12);
const dracusethReference = model.seeds['ally-dracuseth'];
assert.equal(dracusethReference.resources.find(r => r.id === 'drac-slots').max, 3);
assert(!model.normalizeParty({ 'ally-dracuseth': dracusethReference })['ally-dracuseth']);

const old = model.normalizeSheet({ ...party['pc-ringgo'], hp: 3,
  tempHp: 5, hitDice: { die: 8, current: 0, max: 3 } }, party['pc-ringgo']);
const long2014 = model.previewRest(old, 'long', { reduceExhaustion: true });
assert.equal(long2014.sheet.hp, 24);
assert.equal(long2014.sheet.hitDice.current, 1);
assert.equal(long2014.sheet.tempHp, 0);
const short = model.previewRest({ ...old, hp: 3, hitDice: { die: 8, current: 2, max: 3 } },
  'short', { hitDiceSpent: 1, healing: 6 });
assert.equal(short.sheet.hp, 9);
assert.equal(short.sheet.hitDice.current, 1);

const newer = model.normalizeSheet({ ...dracusethReference, hp: 25,
  hitDice: { die: 10, current: 1, max: 4 } }, dracusethReference);
assert.equal(model.previewRest(newer, 'long').sheet.hitDice.current, 4);
assert(model.previewRest({ ...newer, hp: 0 }, 'long').blocked);
assert.equal(model.previewRest({ ...newer, hp: 0 }, 'long', { overrideAtZero: true }).sheet.hp, 40);

const privateSheet = model.normalizeSheet({ ...old, notes: 'Secret villain clue',
  publicNotes: 'Ready to scout', publicOptions: { showHp: false, showActions: false,
    showResources: false, showStatus: false } }, old);
const publicView = JSON.stringify(model.safeView(privateSheet));
assert(!publicView.includes('Secret villain clue'));
assert(!publicView.includes('"hp":3'));
assert(!publicView.includes('Rapier'));
assert(publicView.includes('Ready to scout'));
const ownView = model.ownerView(privateSheet);
assert.equal(ownView.hp, 3);
assert.equal(ownView.abilities.dex.score, 19);
assert.equal(ownView.skills.find(item => item.name === 'Stealth').bonus, 8);
assert(ownView.attacks.some(item => item.name === 'Rapier'));
assert(ownView.equipment.some(item => item.name === 'Piton'));
assert.equal(ownView.publicNotes, 'Ready to scout');
assert(!JSON.stringify(ownView).includes('Secret villain clue'));
assert(!Object.hasOwn(ownView, 'notes'));
assert(!Object.hasOwn(ownView, 'levelHistory'));

const html = fs.readFileSync(path.join(root, 'Session-01-TV-Display.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'Session-01-Party-UI.js'), 'utf8');
for (const [, id] of ui.matchAll(/\$\('([^']+)'\)/g))
  if (id !== 'party-rest-preview') assert(html.includes(`id="${id}"`), `Missing UI element: ${id}`);
assert(html.includes('id="player-character"'));
console.log('Party checks passed: five PCs and Sildar, rest variants, private TV view, and full owner-only phone sheet.');

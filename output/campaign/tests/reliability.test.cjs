const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ Blob, fetch, location: { hash: '' }, setInterval() {},
  FileReader: class {
    readAsDataURL(blob) {
      blob.arrayBuffer().then(buffer => {
        this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
        this.onload();
      }, error => { this.error = error; this.onerror(); });
    }
  } });
for (const file of ['Session-01-Reliability.js', 'Session-01-Presentation.js', 'Session-01-Combat-Data.js', 'Session-01-Rules-Data.js']) {
  const source = file === 'Session-01-Reliability.js' && process.env.ECHO_TEST_RELIABILITY_SOURCE
    ? process.env.ECHO_TEST_RELIABILITY_SOURCE : path.join(root,file);
  vm.runInContext(fs.readFileSync(source, 'utf8'), context, { filename: file });
}
const { ECHO_RELIABILITY: reliability, ECHO_PRESENTATION: presentation,
  ECHO_COMBAT_DATA: combat, ECHO_RULES_DATA: rules } = context;

async function run() {
  assert.equal(reliability.assertSupported({}), 1);
  assert.equal(reliability.assertSupported({ schemaVersion: 2 }), 2);
  assert.equal(reliability.assertSupported({ schemaVersion: reliability.VERSION }), reliability.VERSION);
  assert.throws(() => reliability.assertSupported({ schemaVersion: reliability.VERSION + 1 }), /Update the app/);
  assert.equal(reliability.normalizeRegistry().active, 'default');
  assert.equal(reliability.normalizeRegistry({ active: 'lost', campaigns: [{ id: 'one', name: 'One', archived: true }] }).campaigns[0].archived, false);

  const state = { schemaVersion: 2, scene: 'road' };
  const backup = { format: 'echo-below-campaign-v2', schemaVersion: 2,
    sessions: [{ id: 'one', name: 'One', state }],
    presentation: { media: [{ id: 'portrait', name: 'Portrait', kind: 'image' }] }, mediaFiles: {} };
  assert.deepEqual(Array.from(reliability.validateArchive(backup).missingMedia), ['Portrait']);
  backup.mediaFiles.portrait = 'data:image/png;base64,YQ==';
  assert.equal(reliability.validateArchive(backup).valid, true);
  assert.throws(() => reliability.validateArchive({ ...backup, sessions: [backup.sessions[0], backup.sessions[0]] }), /duplicate/);
  assert.equal(reliability.validateArchive({ ...backup, schemaVersion: reliability.VERSION }).valid, true);
  assert.throws(() => reliability.validateArchive({ ...backup, schemaVersion: reliability.VERSION + 1 }), /Update the app/);
  assert.throws(() => reliability.validateArchive({ ...backup, sessions: [{ ...backup.sessions[0], state: { schemaVersion: reliability.VERSION + 1 } }] }), /Update the app/);

  const originalStorage = new Map([['media:portrait', new Blob(['picture'], { type: 'image/png' })]]);
  const mediaFiles = await presentation.exportMedia(backup.presentation, async key => originalStorage.get(key));
  const restoredStorage = new Map();
  await presentation.importMedia(mediaFiles, backup.presentation, async (key, value) => restoredStorage.set(key, value));
  assert.equal(await restoredStorage.get('media:portrait').text(), 'picture');

  const tokens = [
    { id: 'ally', scene: 'road', placed: true, visible: true, team: 'ally' },
    { id: 'enemy', scene: 'road', placed: true, visible: true, team: 'enemy' },
    { id: 'hidden', scene: 'road', placed: true, visible: false, team: 'enemy' }
  ];
  assert.deepEqual(Array.from(reliability.visibleTokens(tokens, 'road', [], true, () => true, () => 'tile'), t => t.id), ['ally']);
  assert.deepEqual(Array.from(reliability.visibleTokens(tokens, 'road', ['tile'], true, () => true, () => 'tile'), t => t.id), ['ally', 'enemy']);
  const player = reliability.publicPayload({ scene: 'road', scenes: [{ id: 'road', title: 'Road', dmSecret: 'DM_SECRET' },
    { id: 'cave', title: 'DM_SECRET', image: 'DM_SECRET' }],
    tokens: [{ ...tokens[0], name: 'Ally', hp: 99, dmSecret: 'DM_SECRET' }],
    turn: { activeId: 'hidden', order: [{ id: 'hidden', name: 'DM_SECRET' }, { id: 'ally', name: 'Ally' }] },
    map: { tokenMeta: { ally: { size: 'medium', dmSecret: 'DM_SECRET' }, hidden: { portrait: 'DM_SECRET' } },
      scenes: { road: { lines: [{ kind: 'secret', title: 'DM_SECRET' }], points: [{ visible: false, title: 'DM_SECRET' }] } } },
    presentation: { mode: 'battle', dmSecret: 'DM_SECRET' },
    journal: [{ id: 'one', title: 'DM_SECRET', published: false }],
    handout: { visible: false, text: 'DM_SECRET' }, dmNotes: 'DM_SECRET' });
  assert.equal(JSON.stringify(player).includes('DM_SECRET'), false);
  assert.deepEqual(Array.from(player.turn.order, t => t.id), ['ally']);
  assert.equal(player.handout, null);

  const target = { hp: 12, maxHp: 20, tempHp: 3 };
  assert.deepEqual(JSON.parse(JSON.stringify(combat.damagePreview(target, 9, 'fire', 'damage', { resistances: 'fire' }))),
    { adjusted: 4, factor: .5, tempUsed: 3, tempHp: 0, hp: 11 });
  assert.equal(combat.damagePreview(target, 9, 'fire', 'damage', { immunities: 'fire' }).hp, 12);
  assert.equal(combat.damagePreview(target, 9, 'fire', 'damage', { vulnerabilities: 'fire' }).hp, 0);
  assert.equal(combat.damagePreview(target, 9, 'fire', 'heal').hp, 20);

  const cover = rules.references.find(entry => entry.id === 'cover');
  assert.equal(cover.printedPage, 196);
  assert.equal(cover.book, 'phb');
  for (const book of ['phb', 'dmg', 'srd']) assert.ok(fs.existsSync(path.join(root, rules.books[book].file)), `${book} PDF missing`);
  process.stdout.write('Reliability, privacy, combat, media, and book-reference checks passed.\n');
}
run().catch(error => { console.error(error); process.exitCode = 1; });

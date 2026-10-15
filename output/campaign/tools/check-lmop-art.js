const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
global.window = global;
global.location = { hash: '' };
for (const name of ['LMOP-Visual-Catalog.js', 'Session-02-Runbook.js', 'Campaign-Transition-Data.js', 'Session-Content-Packs.js', 'Session-01-Presentation.js'])
  require(path.join(root, name));

const catalog = global.LMOP_VISUAL_CATALOG;
assert.equal(catalog.length, 103);
for (const field of ['id', 'key', 'image'])
  assert.equal(new Set(catalog.map(item => item[field])).size, catalog.length, `Duplicate ${field}`);
const chapterCounts = Object.fromEntries([...new Set(catalog.map(item => item.chapter))]
  .map(chapter => [chapter, catalog.filter(item => item.chapter === chapter).length]));
assert.deepEqual(chapterCounts, {
  Phandalin: 14, 'Redbrand Hideout': 14, Wilderness: 16, Thundertree: 17,
  'Cragmaw Castle': 17, 'Wave Echo Cave': 24, Epilogue: 1
});

const files = fs.readdirSync(path.join(root, 'lmop-visuals')).filter(name => name.endsWith('.png'));
assert(files.length >= catalog.length, 'Some catalog images are missing');
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
for (const item of catalog) {
  assert(item.title && item.reveal && item.chapter, `Incomplete entry ${item.key}`);
  const file = path.join(root, item.image);
  assert(fs.existsSync(file), `Missing ${item.key}: ${item.image}`);
  const data = fs.readFileSync(file);
  assert(data.length > 1000 && data.subarray(0, 8).equals(signature), `Invalid PNG: ${item.key}`);
  assert(data.readUInt32BE(16) > 100 && data.readUInt32BE(20) > 100, `Tiny PNG: ${item.key}`);
}
for (const item of catalog)
  assert(files.includes(path.basename(item.image)), `Image file missing from folder: ${item.key}`);

const packIds = global.ECHO_CONTENT_PACKS.flatMap(pack => pack.scenes);
for (const item of catalog) assert(packIds.includes(item.id), `Scene missing from content packs: ${item.key}`);
for (const pack of global.ECHO_CONTENT_PACKS) assert(pack.scenes.includes(pack.firstScene), `Bad first scene in ${pack.id}`);
const media = global.ECHO_PRESENTATION.normalizeLibrary().media;
for (const item of catalog)
  assert(media.some(entry => entry.id === item.id && entry.path === item.image), `Missing media entry: ${item.key}`);

const session2 = catalog.filter(item => ['Phandalin', 'Redbrand Hideout'].includes(item.chapter));
const beatIds = new Set(global.ECHO_SESSION2_RUNBOOK.map(beat => beat.id));
const artMapping = global.ECHO_SESSION2_ART;
assert(Object.keys(artMapping).every(id => beatIds.has(id)), 'Art is linked to an unknown Session 2 beat');
assert.deepEqual(new Set(Object.values(artMapping).flat()), new Set(session2.map(item => item.key)),
  'Every Session 2 illustration must have a runbook cue');
assert.equal(Object.values(artMapping).flat().length, session2.length, 'Session 2 art should appear once each');

const library = global.ECHO_PRESENTATION.normalizeLibrary();
const hidden = global.ECHO_PRESENTATION.publicState({ mode: 'battle', mediaId: session2[0].id }, library);
assert.equal(hidden.media.length, 0, 'Unrevealed art entered the player display payload');
const shown = global.ECHO_PRESENTATION.publicState({ mode: 'scene', mediaId: session2[0].id }, library);
assert.deepEqual(shown.media.map(item => item.id), [session2[0].id]);
const html = fs.readFileSync(path.join(root, 'Session-01-TV-Display.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
assert(html.includes('data-presentation-tab="art"'));
assert(app.includes('ECHO_SESSION2_ART'));
assert.equal(typeof ECHO_PRESENTATION.showCatalogArt,'function');
console.log(`Lost Mine art: ${catalog.length} valid files, all chapter packs and Session 2 cues linked, player display gated.`);

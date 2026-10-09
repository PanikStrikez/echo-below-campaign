const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const root = path.resolve(__dirname, '..');
require(path.join(root, 'Session-01-Rules-Data.js'));
require(path.join(root, 'Session-01-Rules-Index.js'));
require(path.join(root, 'Session-01-Rules-Library.js'));
const books = globalThis.ECHO_RULES_DATA.books;
const entries = [...globalThis.ECHO_RULES_DATA.references, ...globalThis.ECHO_RULES_INDEX.catalog];
const settings = globalThis.ECHO_RULES_UI.normalizeSettings(null);

assert.equal(settings.profile, '2014');
assert(settings.exceptions.some(entry => entry.name.includes('Trista')));
assert(settings.exceptions.some(entry => entry.name.includes('Dracuseth')));
assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length);
assert(entries.every(entry => entry.source && entry.confidence));
assert(entries.every(entry => !entry.book || books[entry.book]));
assert(entries.every(entry => !entry.pdfPage || entry.pdfPage <= books[entry.book].pages));
assert.equal(globalThis.ECHO_RULES_INDEX.books.phb.indexedPages, 293);
assert.equal(globalThis.ECHO_RULES_INDEX.books.dmg.indexedPages, 321);
assert(entries.filter(entry => entry.category === 'feature' && entry.edition === '2014').length >= 100);
assert(entries.filter(entry => entry.category === 'spell').length >= 300);
assert(entries.filter(entry => entry.category === 'item').length >= 200);

for (const book of Object.values(books)) {
  const localPath = book.file.startsWith('file://') ? fileURLToPath(book.file) : path.resolve(root, book.file);
  assert(fs.existsSync(localPath), `Missing ${book.file}`);
  assert(book.toc.every(([, page]) => page >= 1 &&
    (book === books.phb ? globalThis.ECHO_RULES_INDEX.books.phb.printedToPdf[page] <= book.pages : page <= book.pages)),
  `Invalid contents: ${book.title}`);
}
for (const id of ['phb', 'dmg', 'mm', 'xan', 'tasha']) assert(books[id]);
assert(globalThis.ECHO_RULES_DATA.creatures.length >= 100);
assert(globalThis.ECHO_RULES_DATA.creatures.every(item => item.audience === 'dm' && ['mm','lmop','madMage'].includes(item.book)));
assert(globalThis.ECHO_RULES_DATA.creatures.some(item => item.id === 'lmop-redbrand-ruffian' && item.pdfPage === 61));
assert(globalThis.ECHO_RULES_DATA.creatures.some(item => item.id === 'madMage-halaster-blackcloak' && item.pdfPage === 311));
assert(entries.filter(item => item.category === 'location' && item.book === 'lmop').length >= 30);
assert(entries.some(item => item.title === 'Glasstaff’s quarters' && item.pdfPage === 25));
assert.equal(globalThis.ECHO_RULES_UI.printedToPdf('mm', 165).page, 166);
assert.equal(globalThis.ECHO_RULES_UI.printedToPdf('xan', 150).page, 151);
assert.equal(globalThis.ECHO_RULES_UI.printedToPdf('tasha', 108).page, 110);
assert.equal(globalThis.ECHO_RULES_UI.printedToPdf('madMage', 13).page, 14);
assert(globalThis.ECHO_RULES_DATA.characterOptions.some(item => item.id === 'donavan-scribes'));
assert.equal(globalThis.ECHO_RULES_UI.normalizeSettings({ characterOptions: { 'donavan-scribes': 'planned' } }).characterOptions['donavan-scribes'], 'planned');
const html = fs.readFileSync(path.join(root, 'Session-01-TV-Display.html'), 'utf8');
const library = fs.readFileSync(path.join(root, 'Session-01-Rules-Library.js'), 'utf8');
for (const [, id] of library.matchAll(/\$\('([^']+)'\)/g))
  assert(html.includes(`id="${id}"`), `Missing UI element: ${id}`);

const roundtrip = globalThis.ECHO_RULES_UI.normalizeSettings({
  ...settings, favorites: ['advantage'], corrections: { advantage: { text: 'Use our table ruling.', date: '9/22/2026' } },
  rulings: [{ id: 'ruling-test', name: 'Test', text: 'Example', source: 'House ruling', date: '9/22/2026' }]
});
assert.equal(roundtrip.corrections.advantage.text, 'Use our table ruling.');
assert.equal(roundtrip.rulings[0].source, 'House ruling');
assert(roundtrip.favorites.includes('advantage'));

const loader = fs.readFileSync(path.join(root, 'Session-01-Loader.js'), 'utf8');
assert(loader.includes('if (!player) for (const file of privateScripts) await load(file)'));
assert(loader.includes('Session-01-Handout-Data.js'));
assert(!html.includes('src="Session-01-Rules-Index.js"'));
console.log(`Rules library checks passed: ${entries.length} references, ${Object.keys(books).length} books.`);

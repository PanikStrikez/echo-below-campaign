const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

require(path.join(root, 'Session-01-TV-Text.js'));
require(path.join(root, 'Session-01-Reliability.js'));

const cards = [
  { id: 'public', title: 'Clue', text: 'The bridge is broken.', position: 'bottom-left', visible: true, privateNotes: 'DM SECRET' },
  { id: 'hidden', title: 'Spoiler', text: 'DM SECRET', position: 'center', visible: false }
];
assert.deepEqual(globalThis.ECHO_TV_TEXT.publicCards(cards), [
  { id: 'public', title: 'Clue', text: 'The bridge is broken.', position: 'bottom-left', visible: true }
]);
assert.equal(globalThis.ECHO_TV_TEXT.normalizeCards([{ id: 'bad id', title: 'x', text: 'y', position: 'invalid', visible: true }])[0].position, 'top-left');
const payload = globalThis.ECHO_RELIABILITY.publicPayload({
  scene: 'cave', map: { scenes: {} }, tokens: [], turn: {}, tvTextCards: cards,
  dmNotes: 'DM SECRET', privatePrep: { content: 'DM SECRET' }
});
assert.equal(payload.tvTextCards.length, 1);
assert.equal(payload.tvTextCards[0].text, 'The bridge is broken.');
assert(!JSON.stringify(payload).includes('DM SECRET'), 'Player payload exposed hidden or private text');

const html = read('Session-01-TV-Display.html');
const loader = read('Session-01-Loader.js');
const board = read('Session-01-Battleboard.js');
const story = read('Session-01-Story-UI.js');
const ergo = read('Session-01-Ergonomics.js');
for (const id of ['quick-tv-text', 'tv-text-panel', 'tv-text-list', 'tv-text-add', 'player-text-cards'])
  assert(html.includes(`id="${id}"`), `Missing ${id}`);
assert(loader.includes("await load('Session-01-TV-Text.js')"));
assert(board.includes('ECHO_TV_TEXT?.renderPlayer(state.tvTextCards, state.mainQuest)'));
assert(board.includes("heading === 'Ask the players'"));
assert(story.includes('Show observation on TV') && story.includes('Show text on TV'));
assert(ergo.includes('encounter-show-text') && ergo.includes('focus-show-text'));
console.log('TV text checks passed: visible cards, private text filtering, and live controls.');

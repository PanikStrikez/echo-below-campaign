const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'Session-01-TV-Display.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Session-01-Battleboard.css'), 'utf8');
const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const combat = fs.readFileSync(path.join(root, 'Session-01-Combat-UI.js'), 'utf8');
const ergonomics = fs.readFileSync(path.join(root, 'Session-01-Ergonomics.js'), 'utf8');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const id of ['mode-run', 'mode-prep', 'start-combat', 'quick-roll', 'quick-damage', 'quick-effects',
  'quick-area', 'quick-encounter', 'quick-handout', 'quick-undo', 'combat-tool-select', 'restart-session'])
  assert(ids.includes(id), `Missing live UI action: ${id}`);
assert(html.includes('class="app run-mode"'));
assert(css.includes('.run-mode #session-builder') && css.includes('.run-mode .prep-only'));
assert(css.includes('.run-mode .handout-panel:not(.quick-open)'));
assert(board.includes("$('start-combat').addEventListener('click'"));
assert(board.includes("$('quick-undo').addEventListener('click', undoLast)"));
assert(combat.includes("$('combat-tool-select').addEventListener('change'"));
assert(ids.includes('run-support'), 'Missing live party and cave guide');
assert(ergonomics.includes('Cave routes, height, and flood direction'));
assert(ergonomics.includes('data-ergo-action="timer-light"'));
assert(ergonomics.includes('data-ergo-branch="${value}"'));
assert(combat.includes('Hostile creature within 5 ft. of attacker'));
assert(combat.includes('Full cover prevents directly targeting this creature.'));
assert(board.includes("'Mark as ally' : 'Mark as enemy'"));
assert(board.includes("if (t.team === 'ally') t.visible = false;"), 'New allies must remain hidden until DM reveals them');
const runbookGroup = board.split('function appendRunbookGroup(')[1].split('function createRunbookBeat(')[0];
const runbookBeat = board.split('function createRunbookBeat(')[1].split('function selectRunbook(')[0];
assert(!runbookGroup.includes('beat.id'), 'Shared runbook group must not access an undefined beat');
assert(runbookBeat.includes('CRAGMAW_PAGES?.[beat.id]'), 'Book links must use the beat card scope');
assert(board.includes("activeTurn ? ' active-turn' : ''"), 'Active turn token marker must be rendered');
assert(board.includes("state.turn.activeId === t.id"), 'Player marker must follow public active turn');
assert(board.includes("captureRestorePoint(`Before restarting ${name}`, 'manual')"), 'Restart must save a restore point first');
assert(board.includes('globalThis.ECHO_PRESENTATION?.stopAll();'), 'Restart must stop live audio');
const presentation = fs.readFileSync(path.join(root, 'Session-01-Presentation.js'), 'utf8');
assert(presentation.includes('data-do="test-sound"'), 'Audio test control missing');
assert(presentation.includes('item.path || await urlFor(mediaId)'), 'Bundled sounds must start directly from a click');
require(path.join(root, 'Session-01-Ergonomics.js'));
const saved = globalThis.ECHO_ERGONOMICS.normalizeSession({ branches: { den: {
  status: 'retreated', objective: 'Rescue Sildar', captive: 'Sildar at 1 HP', promise: 'Morningstar for Sildar', nextMove: 'Return with help'
} } });
assert.equal(saved.branches.den.status, 'retreated');
assert.equal(globalThis.ECHO_ERGONOMICS.normalizeSession({ branches: { den: { status: 'unknown' } } }).branches.den.status, 'ready');
console.log('Run UI checks passed: focused mode, live actions, and unique controls.');

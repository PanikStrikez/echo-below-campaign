const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'Session-01-Combat-Data.js'), 'utf8'), context);
const pace = context.ECHO_COMBAT_DATA.pace;
const party = (level, size = 4) => Array(size).fill(level);

// Independent checkpoints from the printed 2014 DMG table, p. 82. One foe, four PCs.
for (const [level, expected] of [
  [1, [100, 200, 300, 400]],
  [4, [500, 1000, 1500, 2000]],
  [5, [1000, 2000, 3000, 4400]],
  [10, [2400, 4800, 7600, 11200]],
  [20, [11200, 22800, 34000, 50800]],
]) {
  const result = pace(expected[0], party(level));
  assert.deepEqual(Object.values(result.thresholds), expected, `Level ${level} threshold totals`);
  assert.equal(result.label, 'Easy');
  assert.equal(pace(expected[0] - 1, party(level)).label, 'Below Easy');
  for (const [index, label] of ['Easy', 'Medium', 'Hard', 'Deadly'].entries())
    assert.equal(pace(expected[index], party(level)).label, label, `Level ${level}: ${label} boundary`);
}
for (let level = 1; level <= 20; level++)
  assert.notEqual(pace(1000, party(level)).label, 'Unknown', `Supported level ${level}`);
const mixed = pace(2200, [1, 3, 10]);
assert.deepEqual(Object.values(mixed.thresholds), [700, 1400, 2200, 3300]);
assert.equal(mixed.label, 'Hard', 'Mixed levels add each member’s thresholds');

// Enemy-count bands and one-step party-size shifts from pp. 82–83, including both endpoints.
for (const [count, regular, small, large] of [
  [1, 1, 1.5, .5], [2, 1.5, 2, 1], [3, 2, 2.5, 1.5], [6, 2, 2.5, 1.5],
  [7, 2.5, 3, 2], [10, 2.5, 3, 2], [11, 3, 4, 2.5], [14, 3, 4, 2.5],
  [15, 4, 5, 3], [99, 4, 5, 3],
]) {
  for (const [size, expected] of [[1, small], [2, small], [3, regular], [5, regular], [6, large], [8, large]]) {
    const result = pace(100, party(5, size), '', count);
    assert.equal(result.multiplier, expected, `${size} PCs against ${count} foes`);
    assert.equal(result.baseXp, 100, 'Adjustment never changes the XP award');
    assert.equal(result.adjustedXp, 100 * expected);
  }
}
assert.equal(pace(75, [1], '', 1).adjustedXp, 112.5, 'Do not round difficulty across a threshold');
assert.equal(pace('200', ['5'], '', '1').label, 'Easy', 'Form numeric strings remain supported');
assert.equal(pace(0, party(5)).label, 'No combat XP');
assert.equal(pace(100, party(5), '', 0).label, 'No combat XP');
assert.equal(pace(0, party(5), '', 0).label, 'No combat XP');

for (const levels of [undefined, null, '5', [], [0], [21], [-1], [1.5], [''], [null], [true], [NaN], [Infinity], [3, undefined], new Array(1)])
  assert.equal(pace(100, levels).label, 'Unknown', `Reject invalid party ${String(levels)}`);
for (const xp of [-1, NaN, Infinity, Number.MAX_SAFE_INTEGER, '', null, false, 'unknown'])
  assert.equal(pace(xp, party(5)).label, 'Unknown', `Reject invalid XP ${String(xp)}`);
for (const count of [-1, 1.5, NaN, Infinity, '', null, true, 'unknown'])
  assert.equal(pace(100, party(5), '', count).label, 'Unknown', `Reject invalid enemy count ${String(count)}`);

const guidance = pace(1000, party(5), 'Chasm and bridges', 4);
assert.equal(guidance.book, 'dmg');
assert.equal(guidance.page, 82);
assert.match(guidance.note, /Chasm and bridges/);
assert.match(guidance.note, /award base XP/);
assert.match(guidance.note, /resources.*objectives/);
assert.match(guidance.note, /separate waves separately/);
console.log('Encounter pacing passed: levels 1–20, threshold boundaries, mixed parties, all count bands, party-size shifts, XP separation, and invalid inputs.');

/* Isolated canonical-schema rehearsal; no browser or campaign files are written. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'Campaign-Continuity.js'));
require(path.join(root, 'Campaign-Outcomes.js'));
const C = ECHO_CONTINUITY, O = ECHO_OUTCOMES;
const original = {};
vm.createContext(original);
vm.runInContext(fs.readFileSync(path.join(root,
  'archive/downtime-before-2026-10-01/Campaign-Continuity.js'), 'utf8'), original);
for (const seed of original.ECHO_CONTINUITY.SEEDS)
  assert.equal(JSON.stringify(C.event(seed)), JSON.stringify(original.ECHO_CONTINUITY.event(seed)),
    'Preserve existing event fingerprint: ' + seed.id);
for (const raw of [{ id: 'legacy' }, { id: 'old-home', courtyard: { visit: 'return', returnKey: 'one' } },
  { id: 'old-relationship', relationships: [{ npcId: 'nessa-brindle', changes: { wants: '' } }] }])
  assert.equal(JSON.stringify(C.event(raw)), JSON.stringify(original.ECHO_CONTINUITY.event(raw)));
assert(!Object.hasOwn(C.event({}), 'downtime'));

const metadata = { activityId: 'work', jobId: 'commission', letterId: 'letter',
  town: 'waterdeep', minutes: 90, cost: '2 gp fee agreed; not yet paid', result: 'partial', at: 480 };
const e = C.event({ id: 'new-work', downtime: metadata });
assert.deepEqual(e.downtime, metadata);
assert.deepEqual(C.event(JSON.parse(JSON.stringify(e))), e);
assert.equal(C.event({ downtime: { minutes: '90' } }).downtime.minutes, 90);
for (const value of [null, '', '  ']) assert.equal(C.event({ downtime: { minutes: value } }).downtime.minutes, null);
for (const value of [-1, 1.5, NaN, Infinity, 'tomorrow', false, {}, [1]]) {
  const m = C.event({ downtime: { minutes: value } }).downtime.minutes;
  assert.equal(typeof m, 'string', 'Invalid duration remains rejectable: ' + String(value));
  assert.equal(C.event(JSON.parse(JSON.stringify(C.event({ downtime: { minutes: value } })))).downtime.minutes, m);
}
assert.equal(C.event({ downtime: { minutes: 0 } }).downtime.minutes, 0);
assert.equal(C.event({ downtime: { activityId: 'a'.repeat(100), cost: 'x'.repeat(1500) } }).downtime.activityId.length, 80);
assert.equal(C.event({ downtime: { cost: 'x'.repeat(1500) } }).downtime.cost.length, 1200);

// Verify the optional projection/validation contract independently of the activity planner.
let validations = 0;
global.ECHO_DOWNTIME = {
  validate(d, e) {
    validations++;
    return e.downtime && e.downtime.minutes !== null &&
      (!Number.isSafeInteger(e.downtime.minutes) || e.downtime.minutes < 0) ? ['Use nonnegative whole work minutes.'] : [];
  },
  projection(d) {
    return O.effective(d).filter(e => e.approved && ['confirmed', 'completed'].includes(e.status) && e.downtime)
      .map(e => ({ id: e.downtime.activityId, title: e.title, text: e.downtime.result + ': ' + e.detail }));
  }
};
const story = { npcs: [], journal: [], evidence: [], wrapUps: [] }, d = C.normalize();
story.continuity = d;
const ctx = { story, markers: [] };
const draft = O.begin(d, { title: 'Reviewed research', detail: 'PRIVATE_DOWNTIME_RESULT',
  source: 'Isolated test', status: 'confirmed', downtime: metadata });
const review = O.preview(d, draft, ctx);
assert(validations);
assert(review.changes.downtime, 'Preview exposes proposed activity projection');
assert.equal(ECHO_DOWNTIME.projection(d).length, 0, 'Draft cannot resolve activity');
const applied = O.apply(d, draft.id, review, ctx);
assert.equal(ECHO_DOWNTIME.projection(d)[0].text, 'partial: PRIVATE_DOWNTIME_RESULT');
assert.equal(C.publicJournal(d).length, 0);
assert.equal(O.privateJournal(d, 'pc-donavan').length, 0);

const correction = O.begin(d, {}, applied.id);
correction.event.downtime.result = 'completed';
correction.event.downtime.cost = '1 gp fee agreed';
O.apply(d, correction.id, O.preview(d, correction, ctx), ctx);
assert.equal(ECHO_DOWNTIME.projection(d)[0].text, 'completed: PRIVATE_DOWNTIME_RESULT');
assert(C.restore(d));
assert.equal(ECHO_DOWNTIME.projection(d)[0].text, 'partial: PRIVATE_DOWNTIME_RESULT');
assert(C.restore(d, true));
assert.equal(ECHO_DOWNTIME.projection(d)[0].text, 'completed: PRIVATE_DOWNTIME_RESULT');
assert.deepEqual(C.normalize(JSON.parse(JSON.stringify(d))), d);

const invalid = O.begin(d, { title: 'Invalid duration', detail: 'Recorded work', source: 'Test',
  downtime: { ...metadata, activityId: 'invalid', minutes: -10 } });
const rejected = O.preview(d, invalid, ctx);
assert(rejected.errors.some(e => e.includes('minutes')));
assert.throws(() => O.apply(d, invalid.id, rejected, ctx), /minutes/);

const privateLetter = O.begin(d, { title: 'PRIVATE_MESSAGE_TITLE', publicTitle: 'A letter from Dianna',
  detail: 'PRIVATE_DM_MESSAGE_NOTES', playerText: 'Reviewed owner-only letter wording.',
  source: 'In-app campaign correspondence', status: 'confirmed', knows: ['pc-donavan'],
  recipients: ['pc-donavan'], downtime: { ...metadata, activityId: '', letterId: 'dianna', jobId: '' } });
O.apply(d, privateLetter.id, O.preview(d, privateLetter, ctx), ctx);
assert.equal(O.privateJournal(d, 'pc-donavan').length, 1);
assert.equal(O.privateJournal(d, 'pc-trista').length, 0);
assert(!JSON.stringify(C.publicJournal(d)).includes('letter'));
assert(!JSON.stringify(O.privateJournal(d, 'pc-donavan')).includes('PRIVATE_DM'));
delete global.ECHO_DOWNTIME;
console.log('Downtime outcome schema passed: old event fingerprints, optional metadata, invalid-duration preservation, canonical preview/approval/correction/undo/reload, and owner-only in-app correspondence.');

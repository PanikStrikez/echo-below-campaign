/* Isolated in-memory mystery/research rehearsal. No browser, live storage, phone
   service or real campaign save is opened or written. Uses production projections. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
global.window = global;
global.location = { hash: '', protocol: 'file:' };
for (const name of [
  'LMOP-Visual-Catalog', 'LMOP-Battle-Map-Catalog', 'Waterdeep-Expedition-Data',
  'Waterdeep-Expedition', 'Session-01-Runbook', 'Session-02-Runbook',
  'Session-03-Runbook', 'Session-03-Thundertree-Runbook', 'Session-04-Runbook',
  'Campaign-Transition-Data', 'Campaign-Courtyard-Data',
  'Undermountain-Arc-Data', 'Undermountain-Arc-Cast', 'Undermountain-Arc',
  'Session-01-Combat-Data', 'Session-04-Combat', 'Session-Content-Packs',
  'Session-01-Rules-Data', 'Campaign-Quests-Data', 'Campaign-Quests',
  'Campaign-Outcomes', 'Campaign-Continuity', 'Campaign-Character-Stories',
  'Campaign-Spotlights', 'Campaign-Quest-Prep-Data', 'Campaign-Quest-Prep',
  'Campaign-Transition-Links', 'Campaign-Transition', 'Campaign-Courtyard',
  'Campaign-Courtyard-Links', 'Undermountain-Arc-Links', 'Campaign-Downtime-Data',
  'Campaign-Downtime', 'Campaign-Mystery-Data', 'Campaign-Research-Data',
  'Campaign-Mystery', 'Campaign-Settlements', 'Session-01-DM-Desk',
  'Session-01-Story-Data', 'Session-01-Party-Data', 'Session-01-Combat-Run',
  'Session-01-Map-Data', 'Session-01-Town-Maps', 'Session-01-Reliability',
  'Session-01-Presentation', 'Session-01-Dungeon', 'Session-04-Expedition',
  'Campaign-Expedition-Data', 'Campaign-Expeditions', 'Campaign-Expedition-Resume',
  'Session-01-Table-Tools'
]) require(path.join(root, name + '.js'));
const source = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const boot = source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0, 'Stop before browser initialization or campaign access');
vm.runInThisContext(source.slice(0, boot) + `
globalThis.__mysteryFixture = {
  fresh: () => normalize(newCustomState()), publicState, phoneSnapshot,
  set: (s, i) => { state = s; campaignIndex = i; }
};
})();`);
const F = __mysteryFixture, C = ECHO_CONTINUITY, O = ECHO_OUTCOMES;
const M = ECHO_MYSTERY, H = ECHO_DOWNTIME, copy = value => JSON.parse(JSON.stringify(value));
const checks = [];
async function check(name, run) {
  try { await run(); checks.push({ name, ok: true }); }
  catch (error) { checks.push({ name, ok: false, error: error.stack }); }
}
function fixture() {
  const story = ECHO_STORY_DATA.normalize(), d = C.ensure(story, 'practice-mystery');
  const state = F.fresh(), extras = ECHO_TABLE.normalize();
  const index = { story, tableExtras: extras, rules: null, sessions: [], combatLibrary: [],
    presentation: ECHO_PRESENTATION.normalizeLibrary() };
  F.set(state, index);
  const ctx = { story, markers: [] };
  const payload = () => JSON.stringify({ tv: F.publicState(), phones: F.phoneSnapshot() });
  payload(); // Production lazily normalizes current map data once.
  function begin(values = {}, target = '') {
    return O.begin(d, { title: 'Isolated research evidence', detail: 'A reviewed rehearsal observation.',
      source: 'Isolated rehearsal; not campaign play', status: 'confirmed', basis: 'Observed',
      share: 'private', knows: [], ...values }, target);
  }
  function apply(draft) {
    const review = O.preview(d, draft, ctx);
    assert.deepEqual(review.errors, [], draft.event.title + ': ' + review.errors.join(' '));
    return O.apply(d, draft.id, review, ctx);
  }
  const record = values => apply(begin(values));
  const event = id => d.events.find(e => e.id === id);
  const evidence = (relation = 'supports', values = {}) => M.eventMeta({
    links: [{ conclusionId: 'echo-observable', relation }], ...values
  });
  return { story, d, state, extras, index, ctx, payload, begin, apply, record, event, evidence };
}
function readyTrial(f, project, text = 'A bounded inconclusive observation.') {
  const draft = f.begin(M.beginTrial(f.story, project.id, 25));
  draft.event.detail = text;
  draft.event.downtime.cost = 'No additional cost; permissioned existing notes.';
  draft.event.downtime.minutes = 45;
  draft.event.mystery.research.consent = 'Owners permitted inspection and chose to keep it private.';
  draft.event.mystery.research.interpretation = 'The comparison is inconclusive; no activation or new identity is established.';
  draft.event.mystery.research.publication = 'Withhold; no player display has been requested.';
  return draft;
}

(async () => {
await check('Existing saves retain old event fingerprints and new research metadata round-trips', () => {
  const previous = { structuredClone };
  vm.createContext(previous);
  vm.runInContext(fs.readFileSync(path.join(root,
    'archive/mystery-before-2026-10-01/Campaign-Continuity.js'), 'utf8'), previous);
  for (const seed of previous.ECHO_CONTINUITY.SEEDS)
    assert.equal(JSON.stringify(C.event(seed)), JSON.stringify(previous.ECHO_CONTINUITY.event(seed)),
      'Legacy event must not receive incidental mystery fields: ' + seed.id);
  assert(!Object.hasOwn(C.event({ id: 'old-no-mystery' }), 'mystery'));
  const f = fixture(), p = M.prepare(f.story, ECHO_RESEARCH_DATA.templates[0], 'echo-observable');
  p.notes = 'PRIVATE_PROJECT_SAVED_NOTE';
  const e = f.record({ mystery: f.evidence('context', { sourceFamily: 'a dated notebook',
    independence: 'reviewed', independenceNote: 'Direct notebook, not a derivative copy.',
    limitations: 'PRIVATE_METADATA_SAVED_LIMIT' }) });
  const saved = ECHO_STORY_DATA.normalize(copy(f.story));
  assert.deepEqual(saved.mystery, f.story.mystery);
  assert.deepEqual(saved.continuity.events.find(x => x.id === e.id).mystery, e.mystery);
  const again = ECHO_STORY_DATA.normalize(copy(saved));
  assert.deepEqual(again.mystery, saved.mystery, 'Repeated restoration does not duplicate projects');
  assert.deepEqual(again.continuity.events, saved.continuity.events);
});

await check('Private preparation and stage changes do not record play, change party or reach displays', () => {
  const f = fixture(), before = copy({ state: f.state, events: f.d.events, payload: f.payload() });
  const template = { ...ECHO_RESEARCH_DATA.templates[0], title: 'PRIVATE_RESEARCH_TITLE',
    question: 'PRIVATE_RESEARCH_QUESTION', source: 'PRIVATE_RESEARCH_SOURCE' };
  const p = M.prepare(f.story, template, 'echo-observable');
  M.ensure(f.story).stage = 'finale';
  const suggestions = M.suggestions(f.story, f.d);
  assert(suggestions.length > 0, 'Prepared leads are available to the DM');
  const trial = M.beginTrial(f.story, p.id);
  assert.equal(trial.downtime.minutes, null, 'The planning estimate is not actual effort');
  assert.equal(trial.downtime.cost, '', 'A quote is not an actual cost');
  assert.equal(M.records(f.d).length, 0);
  assert.deepEqual(copy({ state: f.state, events: f.d.events, payload: f.payload() }), before);
  assert(M.restore(f.story.mystery));
  assert(!f.story.mystery.projects.some(x => x.id === p.id));
  assert(M.restore(f.story.mystery, true));
  assert(f.story.mystery.projects.some(x => x.id === p.id));
  assert.equal(f.payload(), before.payload);
});

await check('Independent origins are grouped; copies and unknown origins never prove a conclusion', () => {
  const f = fixture();
  f.record({ title: 'Notebook original', mystery: f.evidence('supports', {
    sourceFamily: 'Survey-A', independence: 'reviewed', independenceNote: 'Original observer’s dated field notes.' }) });
  f.record({ title: 'Notebook copy', mystery: f.evidence('supports', {
    sourceFamily: 'survey-a', independence: 'reviewed', independenceNote: 'Copied from the same notebook; not a new witness.' }) });
  f.record({ title: 'Untraced report', mystery: f.evidence('supports', {
    sourceFamily: '', independence: 'unreviewed' }) });
  let board = M.board(f.d, 'echo-observable');
  assert.equal(board.supports.length, 3);
  assert.deepEqual(board.families, ['survey-a'], 'Case-insensitive family grouping counts copies once');
  f.record({ title: 'Independent comparison', mystery: f.evidence('supports', {
    sourceFamily: 'Workshop-B', independence: 'reviewed', independenceNote: 'A separately collected control measurement.' }) });
  board = M.board(f.d, 'echo-observable');
  assert.equal(board.families.length, 2);
  assert.equal(board.label, 'Evidence linked — assess the conclusion');
  assert(!Object.hasOwn(board, 'confirmed'), 'No automatic conclusion threshold');
  assert.equal(M.board(f.d, 'family-ilyra-tavin').entries.length, 0);
  f.record({ title: 'Contrary control', mystery: f.evidence('contradicts', {
    sourceFamily: 'Control-C', independence: 'reviewed', independenceNote: 'Independent controls failed the expected association.' }) });
  assert.equal(M.board(f.d, 'echo-observable').label, 'Competing evidence');
  const bad = f.begin({ mystery: f.evidence('supports', { independence: 'reviewed' }) });
  assert(O.preview(f.d, bad, f.ctx).errors.some(e => /source family|independence/i.test(e)));
  bad.event.mystery.links.push({ conclusionId: 'echo-observable', relation: 'contradicts' });
  assert(O.preview(f.d, bad, f.ctx).errors.some(e => /one relationship/i.test(e)));
});

await check('Citations detect corrections, withdrawal, replacement and transitive changes; undo restores them', () => {
  const f = fixture();
  const original = f.record({ title: 'Independent original', detail: 'The first measurement was 12.',
    mystery: f.evidence('context') });
  const dependent = f.record({ title: 'Compared result', mystery: f.evidence('supports', {
    citations: [M.citation(original, 'The original measurement is an explicit dependency.')] }) });
  const downstream = f.record({ title: 'Further interpretation', mystery: f.evidence('context', {
    citations: [M.citation(dependent)] }) });
  assert.deepEqual(M.issues(f.d, dependent), []);
  const correction = f.begin({}, original.id);
  correction.event.detail = 'The corrected measurement was 21.';
  const preview = O.preview(f.d, correction, f.ctx);
  assert(preview.changes.mystery, 'Preview exposes changed dependent evidence');
  O.apply(f.d, correction.id, preview, f.ctx);
  assert(M.issues(f.d, f.event(dependent.id)).some(x => /Changed source/.test(x)));
  assert(M.issues(f.d, f.event(downstream.id)).some(x => /needs review/.test(x)));
  assert(M.board(f.d, 'echo-observable').needsReview.some(x => x.id === dependent.id));
  assert(C.restore(f.d));
  assert.deepEqual(M.issues(f.d, f.event(dependent.id)), []);
  assert(C.restore(f.d, true));
  assert(M.issues(f.d, f.event(dependent.id)).length);
  assert(C.restore(f.d));
  const withdrawal = f.begin({}, original.id); withdrawal.withdraw = true; f.apply(withdrawal);
  assert(M.issues(f.d, f.event(dependent.id)).some(x => /Unavailable or withdrawn/.test(x)));
  assert(C.restore(f.d));
  assert.deepEqual(M.issues(f.d, f.event(dependent.id)), []);
  const replacement = f.record({ title: 'Newly attributed measurement', replaces: [original.id],
    mystery: f.evidence('context') });
  assert(!M.actual(f.d).some(x => x.id === original.id));
  assert(M.actual(f.d).some(x => x.id === replacement.id));
  assert(M.issues(f.d, f.event(dependent.id)).some(x => /Unavailable or withdrawn/.test(x)));
  assert(C.restore(f.d));
  assert.deepEqual(M.issues(f.d, f.event(downstream.id)), []);
  const stale = f.begin({ mystery: f.evidence('supports', { citations: [{
    eventId: original.id, fingerprint: 'not-the-reviewed-evidence', note: '' }] }) });
  assert(O.preview(f.d, stale, f.ctx).errors.some(x => /Changed source/.test(x)));
  assert.throws(() => O.apply(f.d, stale.id, O.preview(f.d, stale, f.ctx), f.ctx), /Changed source/);
  const self = f.begin({ mystery: f.evidence() });
  self.event.mystery.citations = [{ eventId: self.event.id, fingerprint: '', note: '' }];
  assert(O.preview(f.d, self, f.ctx).errors.some(x => /cite itself/.test(x)));
});

await check('Two research attempts share a project but keep separate downtime results and actual values', () => {
  const f = fixture(), p = M.prepare(f.story, ECHO_RESEARCH_DATA.templates[0], 'echo-observable');
  const first = readyTrial(f, p, 'First repeat: inconclusive.');
  first.event.downtime.cost = '';
  assert(O.preview(f.d, first, f.ctx).errors.some(e => /actual cost/i.test(e)));
  first.event.downtime.cost = 'No new spending.';
  for (const value of [-1, 1.5, 'invalid-time', false]) {
    first.event.downtime.minutes = value;
    assert(O.preview(f.d, first, f.ctx).errors.some(e => /effort/i.test(e)), 'Invalid actual effort: ' + value);
  }
  first.event.downtime.minutes = null;
  assert.deepEqual(O.preview(f.d, first, f.ctx).errors, [], 'Explicitly unknown actual effort is preserved');
  first.event.downtime.minutes = 30;
  for (const key of ['consent', 'interpretation', 'publication']) {
    const saved = first.event.mystery.research[key]; first.event.mystery.research[key] = '';
    assert(O.preview(f.d, first, f.ctx).errors.some(e => /consent, interpretation and publication/i.test(e)), key + ' needs a reviewed value');
    first.event.mystery.research[key] = saved;
  }
  const before = copy({ state: f.state, payload: f.payload() });
  const firstResult = f.apply(first);
  const second = readyTrial(f, p, 'Second repeat: a bounded difference with a stated control.');
  second.event.downtime.minutes = 70;
  second.event.mystery.research.disposition = 'supports';
  const secondResult = f.apply(second);
  const a = firstResult.mystery.research, b = secondResult.mystery.research;
  assert.equal(a.projectId, b.projectId);
  assert.notEqual(a.attemptId, b.attemptId);
  assert.equal(firstResult.downtime.activityId, a.attemptId);
  assert.equal(secondResult.downtime.activityId, b.attemptId);
  assert.equal(H.result(f.d, 'activityId', a.attemptId).downtime.minutes, 30);
  assert.equal(H.result(f.d, 'activityId', b.attemptId).downtime.minutes, 70);
  assert.equal(f.story.downtime.activities.filter(x => [a.attemptId, b.attemptId].includes(x.id)).length, 2);
  assert.deepEqual(copy({ state: f.state, payload: f.payload() }), before, 'Narrative results do not spend resources or expose private findings');
  const duplicate = f.begin({ ...copy(secondResult), id: 'duplicate-research-attempt' });
  assert(O.preview(f.d, duplicate, f.ctx).errors.some(e => /attempt already|already has an approved result/i.test(e)));
  const mismatched = readyTrial(f, p);
  mismatched.event.downtime.activityId = 'another-activity';
  assert(O.preview(f.d, mismatched, f.ctx).errors.some(e => /connected to its downtime/i.test(e)));
});

await check('A changed project invalidates an already reviewed result before any canonical mutation', () => {
  const f = fixture(), p = M.prepare(f.story, ECHO_RESEARCH_DATA.templates[1], 'echo-observable');
  const draft = readyTrial(f, p), review = O.preview(f.d, draft, f.ctx);
  assert.deepEqual(review.errors, []);
  const events = copy(f.d.events);
  p.method += ' A revised control requires another review.';
  assert.throws(() => O.apply(f.d, draft.id, review, f.ctx), /changed after preview/);
  assert.deepEqual(f.d.events, events);
  assert(f.d.outcomes.drafts.some(x => x.id === draft.id), 'The unapplied draft remains recoverable');
  f.apply(draft);
  assert(M.records(f.d).some(e => e.id === draft.event.id));
});

await check('An investigation route needs a real prediction; instructions cannot stand in for one', () => {
  const f = fixture(), conclusion = M.conclusions().find(c => c.id === 'glass-amplifies');
  assert(conclusion && conclusion.routes.length, 'Use a production late-stage research route');
  const project = M.fromConclusion(f.story, conclusion, conclusion.routes[0]);
  assert.equal(project.prediction, '', 'A prepared route has not supplied a testable prediction');
  assert.equal(project.stage, conclusion.stage, 'The source question retains its planning stage');
  assert.equal(ECHO_STORY_DATA.normalize(copy(f.story)).mystery.projects.find(p => p.id === project.id).stage,
    conclusion.stage, 'Saving keeps the project’s stage');
  const trial = readyTrial(f, project);
  assert.equal(trial.event.mystery.research.prediction, '', 'Beginning an attempt retains the missing prediction');
  const before = copy(f.d.events), review = O.preview(f.d, trial, f.ctx);
  assert(review.errors.some(e => /prediction/.test(e)), 'Result review explicitly requires a prediction');
  assert.throws(() => O.apply(f.d, trial.id, review, f.ctx), /prediction/);
  assert.deepEqual(f.d.events, before, 'Incomplete research records no result');
  trial.event.mystery.research.prediction =
    'If the recorded input increase explains the output, separately logged unchanged-input runs should not show the same increase under comparable conditions.';
  assert.deepEqual(O.preview(f.d, trial, f.ctx).errors, [], 'An actual bounded prediction makes the completed review usable');
  const result = f.apply(trial);
  assert.equal(result.mystery.research.prediction, trial.event.mystery.research.prediction);
});

await check('Long citation chains stay compact through save/restore and still detect a changed origin', () => {
  const f = fixture(), chain = [];
  chain.push(f.record({ title: 'Chain origin', detail: 'An independently recorded starting observation.',
    mystery: f.evidence('context') }));
  for (let i = 1; i <= 20; i++) {
    const ref = M.citation(chain[i - 1], 'Depends on the immediately preceding reviewed account.');
    assert(ref.fingerprint.length < 100, 'Dependency markers do not embed nested copies: step ' + i);
    chain.push(f.record({ title: 'Chain interpretation ' + i,
      detail: 'A bounded interpretation with an explicit prior dependency.',
      mystery: f.evidence('context', { citations: [ref] }) }));
  }
  assert.deepEqual(M.issues(f.d, chain.at(-1)), [], 'A valid chain is not made stale by size limits');
  const restored = ECHO_STORY_DATA.normalize(copy(f.story));
  const leaf = restored.continuity.events.find(e => e.id === chain.at(-1).id);
  assert.deepEqual(M.issues(restored.continuity, leaf), [], 'Restoring all dependencies preserves their markers');
  const correction = f.begin({}, chain[0].id);
  correction.event.detail = 'The starting observation has been corrected after checking its source.';
  f.apply(correction);
  assert(M.issues(f.d, f.event(chain.at(-1).id)).some(e => /needs review/.test(e)),
    'A compact marker still propagates stale evidence through the entire chain');
  assert(C.restore(f.d));
  assert.deepEqual(M.issues(f.d, f.event(chain.at(-1).id)), [], 'Undo restores the origin and the chain’s validity');
});

await check('Linking legacy evidence creates one authoritative entry and preserves deduplication on correction', () => {
  const f = fixture();
  f.story.evidence.push({ id: 'legacy-research-note', title: 'Old notebook excerpt',
    detail: 'PRIVATE_LEGACY_INTERPRETATION', status: 'Observed', playerSaw: 'LEGACY_VISIBLE_OBSERVATION', published: true });
  const values = { title: 'Reviewed notebook observation', detail: 'PRIVATE_CANONICAL_EVIDENCE',
    publicTitle: 'A checked notebook entry', playerText: 'CANONICAL_VISIBLE_OBSERVATION',
    share: 'party', knows: ['party'], origins: [{ kind: 'evidence', id: 'legacy-research-note' }],
    mystery: f.evidence('context') };
  const recorded = f.record(values);
  let journal = O.journal(f.story);
  assert.equal(journal.filter(e => e.text === 'CANONICAL_VISIBLE_OBSERVATION').length, 1);
  assert(!journal.some(e => e.text === 'LEGACY_VISIBLE_OBSERVATION'));
  const duplicate = f.begin(values);
  assert(O.preview(f.d, duplicate, f.ctx).errors.some(e => /already belongs to another outcome/.test(e)));
  const correction = f.begin({}, recorded.id);
  correction.event.playerText = 'CORRECTED_VISIBLE_OBSERVATION';
  correction.event.mystery.limitations = 'PRIVATE_CORRECTED_LIMIT';
  f.apply(correction);
  journal = O.journal(f.story);
  assert.equal(journal.filter(e => e.text === 'CORRECTED_VISIBLE_OBSERVATION').length, 1);
  assert(!journal.some(e => /LEGACY_VISIBLE|CANONICAL_VISIBLE/.test(e.text)));
  assert.equal(O.linked(f.d, 'evidence', 'legacy-research-note').id, recorded.id);
  const restored = ECHO_STORY_DATA.normalize(copy(f.story));
  assert.equal(O.journal(restored).filter(e => e.text === 'CORRECTED_VISIBLE_OBSERVATION').length, 1);
});

await check('Only deliberately reviewed wording reaches shared displays or the selected owner phone', () => {
  const f = fixture();
  M.prepare(f.story, { ...ECHO_RESEARCH_DATA.templates[6], title: 'PRIVATE_MYSTERY_PROJECT',
    question: 'PRIVATE_MYSTERY_QUESTION', method: 'PRIVATE_MYSTERY_METHOD' });
  f.record({ title: 'PRIVATE_MYSTERY_ORIGINAL_TITLE', detail: 'PRIVATE_MYSTERY_ORIGINAL_DETAIL',
    source: 'PRIVATE_MYSTERY_SOURCE', mystery: f.evidence('supports', {
      sourceFamily: 'PRIVATE_MYSTERY_ORIGIN', limitations: 'PRIVATE_MYSTERY_LIMITS' }) });
  const owned = f.record({ title: 'PRIVATE_MYSTERY_OWNER_TITLE', detail: 'PRIVATE_MYSTERY_OWNER_DETAIL',
    publicTitle: 'A private research result', playerText: 'ALDRIC_OWNER_REVIEWED_WORDING',
    knows: ['pc-aldric'], recipients: ['pc-aldric'], share: 'private',
    mystery: f.evidence('context', { limitations: 'PRIVATE_MYSTERY_OWNER_LIMIT' }) });
  f.record({ title: 'PRIVATE_MYSTERY_SHARED_TITLE', detail: 'PRIVATE_MYSTERY_SHARED_DETAIL',
    publicTitle: 'A reviewed comparison', playerText: 'SHARED_REVIEWED_RESEARCH_WORDING',
    share: 'party', knows: ['party'], mystery: f.evidence('contradicts', {
      independenceNote: 'PRIVATE_MYSTERY_SHARED_ORIGIN_NOTE' }) });
  let wire = F.phoneSnapshot(), tv = F.publicState();
  assert(!JSON.stringify(wire).includes('PRIVATE_MYSTERY_'));
  assert(!JSON.stringify(tv).includes('PRIVATE_MYSTERY_'));
  assert(wire.privateClues['pc-aldric'].some(x => x.text === 'ALDRIC_OWNER_REVIEWED_WORDING'));
  for (const owner of Object.keys(wire.characters).filter(x => x !== 'pc-aldric'))
    assert(!JSON.stringify(wire.privateClues[owner]).includes('ALDRIC_OWNER_REVIEWED_WORDING'), 'Other phone: ' + owner);
  assert(!JSON.stringify({ shared: wire.continuity, tv }).includes('ALDRIC_OWNER_REVIEWED_WORDING'));
  assert(JSON.stringify(wire.continuity).includes('SHARED_REVIEWED_RESEARCH_WORDING'));
  const invalid = f.begin({ title: 'No permission to share', playerText: 'DO_NOT_LEAK',
    recipients: ['pc-trista'], knows: ['pc-aldric'], mystery: f.evidence() });
  assert(O.preview(f.d, invalid, f.ctx).errors.some(e => /recipients must be characters who know/.test(e)));
  const withdraw = f.begin({}, owned.id); withdraw.withdraw = true; f.apply(withdraw);
  assert(!JSON.stringify(F.phoneSnapshot()).includes('ALDRIC_OWNER_REVIEWED_WORDING'));
  assert(C.restore(f.d));
  assert(F.phoneSnapshot().privateClues['pc-aldric'].some(x => x.text === 'ALDRIC_OWNER_REVIEWED_WORDING'));
  const loader = fs.readFileSync(path.join(root, 'Session-01-Loader.js'), 'utf8');
  const privateList = loader.slice(loader.indexOf('const privateScripts'), loader.indexOf('const load ='));
  for (const file of ['Campaign-Mystery-Data.js', 'Campaign-Research-Data.js', 'Campaign-Mystery.js'])
    assert(privateList.includes(file), file + ' belongs in the DM-only script list');
  assert.match(loader, /if \(!player\) for \(const file of privateScripts\)/);
});

for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.ok ? '' : '\n' + c.error}`);
if (checks.some(c => !c.ok)) process.exitCode = 1;
else console.log(`PASS ${checks.length} isolated mystery checks; no live campaign accessed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

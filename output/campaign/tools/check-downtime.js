/* Isolated in-memory rehearsal. Does not open or write a real campaign save. */
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
  'Campaign-Transition-Data', 'Campaign-Courtyard-Data', 'Session-01-Combat-Data',
  'Session-04-Combat', 'Session-Content-Packs', 'Session-01-Rules-Data',
  'Campaign-Quests-Data', 'Campaign-Quests', 'Campaign-Outcomes', 'Campaign-Continuity',
  'Campaign-Character-Stories', 'Campaign-Spotlights', 'Campaign-Quest-Prep-Data',
  'Campaign-Quest-Prep', 'Campaign-Transition-Links', 'Campaign-Transition',
  'Campaign-Courtyard', 'Campaign-Downtime-Data', 'Campaign-Downtime', 'Campaign-Settlements', 'Session-01-DM-Desk', 'Session-01-Story-Data', 'Session-01-Party-Data',
  'Session-01-Combat-Run', 'Session-01-Map-Data', 'Session-01-Town-Maps',
  'Session-01-Reliability', 'Session-01-Presentation'
]) require(path.join(root, name + '.js'));
if (fs.existsSync(path.join(root, 'Campaign-Courtyard-Links.js')))
  require(path.join(root, 'Campaign-Courtyard-Links.js'));

const source = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const boot = source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0, 'Fixture must stop before initializing a browser campaign');
require('./test-support.cjs').loadTableContent();
vm.runInThisContext(source.slice(0, boot) + `
globalThis.__downtimeFixture = {
  context: questPrepContext, setIndex: x => campaignIndex = x,
  setState: x => state = x, fresh: () => normalize(newCustomState()),
  publicState, phoneSnapshot, sessionRunbook
};
})();`);

(async () => {
  const H = ECHO_DOWNTIME, D = ECHO_DOWNTIME_DATA, C = ECHO_CONTINUITY;
  const O = ECHO_OUTCOMES, M = ECHO_SETTLEMENTS, F = __downtimeFixture;
  const story = ECHO_STORY_DATA.normalize(), d = C.ensure(story);
  const state = F.fresh(), ledger = M.normalize({ towns: [
    { id: 'waterdeep', name: 'Waterdeep' }, { id: 'phandalin', name: 'Phandalin' }
  ] });
  const index = { story, presentation: ECHO_PRESENTATION.normalizeLibrary(),
    tableExtras: { settlements: ledger }, rules: null, sessions: [], combatLibrary: [] };
  F.setIndex(index); F.setState(state);
  M.bindContinuity(() => d);
  const ctx = { story, markers: [] };
  const payloads = () => JSON.stringify({ tv: F.publicState(), phones: F.phoneSnapshot() });
  const payloadBefore = payloads(); // Let production lazily initialize its current map once.
  const partyBefore = JSON.stringify(state.party), stateBefore = JSON.stringify(state);
  const eventsBefore = JSON.stringify(d.events);

  assert.equal(D.opportunities.length, 12);
  assert.equal(new Set(D.opportunities.map(a => a.id)).size, 12);
  assert.equal(new Set(D.opportunities.map(a => a.category)).size, 7);
  assert.equal(new Set(D.opportunities.map(a => a.characterId)).size, 5);
  for (const a of D.opportunities) {
    assert(H.categories.includes(a.category), a.category);
    assert(state.party[a.characterId], 'Verified character: ' + a.characterId);
    assert(a.npcIds.every(id => story.npcs.some(n => n.id === id)), 'Known NPCs: ' + a.id);
    assert(a.durationMinutes > 0 && Number.isSafeInteger(a.durationMinutes), 'Bounded estimate: ' + a.id);
    assert(a.prerequisites.length && a.steps.length && a.uncertainty && a.consequences.length,
      'Usable review material: ' + a.id);
    assert.equal(a.cost.amountCp, null, 'No invented confirmed quote');
    assert(a.source.includes('proposal'));
    if (a.correspondence) {
      assert.equal(a.correspondence.audience, 'owner');
      assert.equal(a.correspondence.characterId, a.characterId);
    }
  }

  // Preparation is private, reversible and independent from actual history or statistics.
  const a = H.prepare(story, { ...D.opportunities[0], title: 'PRIVATE_ACTIVITY_TITLE',
    summary: 'PRIVATE_ACTIVITY_NOTES' });
  const preparedLetter = H.prepareLetter(story, { from: 'Dianna', to: 'Donavan',
    owner: 'pc-donavan', subject: 'PRIVATE_DRAFT_SUBJECT', body: 'PRIVATE_UNSENT_BODY' });
  assert.equal(JSON.stringify(d.events), eventsBefore);
  assert.equal(payloads(), payloadBefore, 'Preparation cannot enter TV or phone data');
  assert.equal(JSON.stringify(state), stateBefore);
  assert.equal(H.results(d).length, 0);
  assert(H.restore(story.downtime));
  assert(!story.downtime.letters.some(x => x.id === preparedLetter.id));
  assert(H.restore(story.downtime, true));
  assert(story.downtime.letters.some(x => x.id === preparedLetter.id));
  assert.equal(JSON.stringify(d.events), eventsBefore);

  function begin(values, target = '') {
    return O.begin(d, { title: 'Isolated downtime result', detail: 'A reviewed rehearsal result.',
      source: 'Isolated test; not actual play', status: 'confirmed', basis: 'Observed',
      ...values }, target);
  }
  function apply(draft) {
    const review = O.preview(d, draft, ctx);
    assert.deepEqual(review.errors, [], draft.event.title + ': ' + review.errors.join(' '));
    return O.apply(d, draft.id, review, ctx);
  }
  function record(values) { return apply(begin(values)); }

  const unpriced = begin(H.draft(a, 10));
  unpriced.event.detail = 'A task was discussed.';
  assert(O.preview(d, unpriced, ctx).errors.some(e => e.includes('actual cost')),
    'A proposed quote is never silently treated as the actual cost');
  unpriced.event.downtime.cost = 'No cost; agreed use of existing supplies.';
  for (const value of [-1, 1.5, 'not a number', false]) {
    unpriced.event.downtime.minutes = value;
    assert(O.preview(d, unpriced, ctx).errors.some(e => e.includes('effort')),
      'Reject invalid actual effort: ' + String(value));
  }
  unpriced.event.downtime.minutes = null;
  assert(!O.preview(d, unpriced, ctx).errors.length, 'Unknown effort may remain explicitly unknown');
  unpriced.event.downtime.minutes = 45;
  unpriced.event.detail = 'PRIVATE_RESEARCH_RESULT';
  assert(O.preview(d, unpriced, ctx).changes.downtime, 'Review previews the actual result');
  assert(!H.result(d, 'activityId', a.id), 'An outcome preview does not resolve the activity');
  const event = apply(unpriced);
  assert.equal(H.result(d, 'activityId', a.id).id, event.id);
  assert.equal(JSON.stringify(state.party), partyBefore, 'Approving narrative work grants no automatic statistics');
  assert.equal(payloads(), payloadBefore, 'An approved private activity stays private');

  const duplicate = begin(H.draft(a, 15));
  duplicate.event.detail = 'Second accidental completion';
  duplicate.event.downtime.cost = 'None';
  assert(O.preview(d, duplicate, ctx).errors.some(e => e.includes('already has an approved result')));
  assert.throws(() => O.apply(d, duplicate.id, O.preview(d, duplicate, ctx), ctx), /already has an approved result/);
  const corrected = begin({}, event.id);
  corrected.event.detail = 'PRIVATE_CORRECTED_RESULT';
  corrected.event.downtime.result = 'partial'; corrected.event.downtime.minutes = 20;
  apply(corrected);
  assert.equal(H.result(d, 'activityId', a.id).downtime.result, 'partial');
  assert.equal(H.result(d, 'activityId', a.id).detail, 'PRIVATE_CORRECTED_RESULT');
  assert(C.restore(d));
  assert.equal(H.result(d, 'activityId', a.id).detail, 'PRIVATE_RESEARCH_RESULT');
  assert(C.restore(d, true));
  assert.equal(H.result(d, 'activityId', a.id).detail, 'PRIVATE_CORRECTED_RESULT');
  const withdrawn = begin({}, event.id); withdrawn.withdraw = true; apply(withdrawn);
  assert(!H.result(d, 'activityId', a.id));
  assert(C.restore(d));
  assert.equal(H.result(d, 'activityId', a.id).detail, 'PRIVATE_CORRECTED_RESULT');

  // Templates with editing instructions must not become fictional delivered messages.
  for (const template of D.opportunities.filter(x => x.correspondence && /\[.+\]/.test(x.correspondence.body))) {
    const msg = H.letter({ ...template.correspondence, id: 'unready-' + template.id });
    assert.throws(() => H.letterDraft(msg), /edit|placeholder|replace|finish|draft/i,
      'Block message placeholders: ' + template.id);
  }
  assert.throws(() => H.letterDraft(H.letter({ id:'unstated-message', from:'Dianna', to:'Donavan',
    owner:'pc-donavan', subject:'A complete letter', body:'All actual letter words are ready.' })),
    /status|dispatch|receipt|copy/i, 'Fictional receipt requires an actual message-status account');
  const letter = H.prepareLetter(story, { from: 'Dianna', to: 'Donavan', owner: 'pc-donavan',
    subject: 'A private comparison', body: 'OWNER_LETTER_SENTINEL', notes: 'PRIVATE_POSTAGE_NOTE' });
  const deliveryDraft = begin(H.letterDraft(letter, 15));
  const deliveryReview = O.preview(d, deliveryDraft, ctx);
  assert(deliveryReview.changes.privatePhones, 'Preview identifies the receiving phone');
  assert(!JSON.stringify(F.phoneSnapshot()).includes('OWNER_LETTER_SENTINEL'));
  const delivered = O.apply(d, deliveryDraft.id, deliveryReview, ctx);
  let wire = F.phoneSnapshot();
  assert(wire.privateClues['pc-donavan'].some(x => x.text.includes('OWNER_LETTER_SENTINEL')));
  for (const id of Object.keys(wire.characters).filter(id => id !== 'pc-donavan'))
    assert(!JSON.stringify(wire.privateClues[id]).includes('OWNER_LETTER_SENTINEL'), 'Other owner: ' + id);
  assert(!JSON.stringify(F.publicState()).includes('OWNER_LETTER_SENTINEL'));
  assert(!JSON.stringify({ shared: wire.continuity, tv: wire.public }).includes('OWNER_LETTER_SENTINEL'));
  assert(!JSON.stringify(wire).includes('PRIVATE_POSTAGE_NOTE'));
  assert(O.preview(d, begin(H.letterDraft(letter, 15)), ctx).errors.some(e => e.includes('already has an approved result')));
  const letterCorrection = begin({}, delivered.id);
  letterCorrection.event.detail = letterCorrection.event.playerText = 'OWNER_CORRECTED_SENTINEL';
  apply(letterCorrection);
  assert(!JSON.stringify(F.phoneSnapshot()).includes('OWNER_LETTER_SENTINEL'));
  assert(F.phoneSnapshot().privateClues['pc-donavan'].some(x => x.text === 'OWNER_CORRECTED_SENTINEL'));
  const letterWithdrawal = begin({}, delivered.id); letterWithdrawal.withdraw = true; apply(letterWithdrawal);
  assert(!JSON.stringify(F.phoneSnapshot()).includes('OWNER_CORRECTED_SENTINEL'));
  assert(C.restore(d));
  assert(F.phoneSnapshot().privateClues['pc-donavan'].some(x => x.text === 'OWNER_CORRECTED_SENTINEL'));

  // Reviewable deadlines do not advance plans or manufacture an NPC outcome.
  ledger.minutes = 100;
  const beforeDeparture = record({ title:'BEFORE_SAME_MINUTE', detail:'Completed before departure',
    publicTitle:'Prior work', playerText:'OLD_SAME_MINUTE', share:'party', knows:['party'],
    downtime:{ activityId:'boundary-old', jobId:'', letterId:'', town:'waterdeep', minutes:0,
      cost:'None', result:'completed', at:100 } });
  M.leave(ledger, 'waterdeep');
  const town = ledger.towns.find(t => t.id === 'waterdeep');
  assert(town.sinceOutcomeIds.includes(beforeDeparture.id), 'Departure captures existing outcome identities');
  // Pin a deterministic approval boundary; all following results are within this test's absence.
  town.sinceOutcomeAt = '2000-01-01T00:00:00.000Z';
  const boundaryCorrection = begin({}, beforeDeparture.id);
  boundaryCorrection.event.detail = 'CORRECTED_PRIOR_RESULT';
  apply(boundaryCorrection);
  const afterDeparture = record({ title:'AFTER_SAME_MINUTE', detail:'Completed after departure',
    publicTitle:'New work', playerText:'NEW_SAME_MINUTE', share:'party', knows:['party'],
    downtime:{ activityId:'boundary-new', jobId:'', letterId:'', town:'waterdeep', minutes:0,
      cost:'None', result:'completed', at:100 } });
  const boundarySummary = H.returnSummary(d, ledger, 'waterdeep');
  assert(!boundarySummary.actual.some(e => e.id === beforeDeparture.id),
    'Correcting prior work at the departure minute cannot make it a change while away');
  assert(boundarySummary.actual.some(e => e.id === afterDeparture.id),
    'A new approved outcome later in the same campaign minute remains a new change');
  const futureJob = M.addJob(ledger, { ...D.plans[0], title: 'PRIVATE_NPC_PLAN',
    proposal: 'PRIVATE_NPC_PLAN_CONSEQUENCE', due: 101 });
  M.advance(ledger, 20);
  assert(M.due(ledger).some(j => j.id === futureJob.id));
  assert.equal(futureJob.status, 'active');
  assert(!H.result(d, 'jobId', futureJob.id));
  const unapproved = begin(H.jobDraft(futureJob, ledger.minutes));
  unapproved.event.detail = 'DRAFT_JOB_OUTCOME'; unapproved.event.downtime.cost = 'None';
  let summary = H.returnSummary(d, ledger, 'waterdeep');
  assert(!summary.actual.some(e => e.id === unapproved.event.id));
  assert(!summary.publicChanges.join(' ').includes('PRIVATE_NPC_PLAN'));
  assert(!H.recap(summary).includes('PRIVATE_NPC_PLAN'));
  const jobEvent = apply(unapproved);
  assert.equal(H.result(d, 'jobId', futureJob.id).id, jobEvent.id);
  const townInbox = () => ECHO_DM_DESK.inbox(state, index.tableExtras, {decisions:[]}).filter(r => r.kind === 'town');
  assert(!M.due(ledger).some(j => j.id === futureJob.id), 'Approved result clears due developments');
  assert(!townInbox().some(j => j.id === futureJob.id), 'Approved result clears the DM inbox');
  const partialJob = begin({}, jobEvent.id); partialJob.event.downtime.result = 'partial'; apply(partialJob);
  assert(M.due(ledger).some(j => j.id === futureJob.id && j.status === 'ready'));
  assert(townInbox().some(j => j.id === futureJob.id), 'Partial work remains a reviewable deadline');
  assert(C.restore(d));
  assert(!townInbox().some(j => j.id === futureJob.id), 'Undo restores the completed inbox projection');
  const withdrawnJob = begin({}, jobEvent.id); withdrawnJob.withdraw = true; apply(withdrawnJob);
  assert(townInbox().some(j => j.id === futureJob.id), 'Withdrawing an outcome restores the pending development');
  assert(C.restore(d));
  assert(!townInbox().some(j => j.id === futureJob.id));
  assert(!H.recap(H.returnSummary(d, ledger, 'waterdeep')).includes('DRAFT_JOB_OUTCOME'));

  const shared = record({ ...H.jobDraft({ id: 'shared-job', town: 'waterdeep', title: 'PRIVATE_ORIGINAL_TOWN_TITLE' }, 110),
    detail: 'PRIVATE_ORIGINAL_TOWN_DETAIL', publicTitle: 'The workbench is ready',
    playerText: 'The agreed repair to the covered table is finished.', share: 'party', knows: ['party'],
    downtime: { activityId: '', jobId: 'shared-job', letterId: '', town: 'waterdeep',
      minutes: 30, cost: 'Already reviewed separately', result: 'completed', at: 110 } });
  record({ ...H.jobDraft({ id: 'older-job', town: 'waterdeep', title: 'OLDER_RESULT' }, 99),
    detail: 'OLDER_RESULT', publicTitle: 'Older work', playerText: 'BEFORE_DEPARTURE', share: 'party', knows: ['party'],
    downtime: { activityId: '', jobId: 'older-job', letterId: '', town: 'waterdeep', minutes: 0,
      cost: 'None', result: 'completed', at: 99 } });
  record({ ...H.jobDraft({ id: 'other-town-job', town: 'phandalin', title: 'OTHER_TOWN' }, 110),
    detail: 'OTHER_TOWN', publicTitle: 'Another town', playerText: 'OTHER_TOWN', share: 'party', knows: ['party'],
    downtime: { activityId: '', jobId: 'other-town-job', letterId: '', town: 'phandalin', minutes: 0,
      cost: 'None', result: 'completed', at: 110 } });
  M.record(ledger, 'waterdeep', 'Approved older ledger change: PUBLIC_LEGACY_CHANGE', true);
  M.record(ledger, 'waterdeep', 'Prepared secret: PRIVATE_PREPARATION', false);
  summary = H.returnSummary(d, ledger, 'waterdeep');
  assert(summary.actual.some(e => e.id === shared.id));
  assert(!summary.actual.some(e => ['OLDER_RESULT', 'OTHER_TOWN'].includes(e.title)));
  assert(!summary.actual.some(e => e.id === beforeDeparture.id));
  const recap = H.recap(summary);
  assert(recap.includes('The agreed repair to the covered table is finished.'));
  assert(recap.includes('PUBLIC_LEGACY_CHANGE'));
  for (const secret of ['PRIVATE_', 'OWNER_', 'DRAFT_JOB_OUTCOME', 'BEFORE_DEPARTURE', 'OTHER_TOWN'])
    assert(!recap.includes(secret), 'Public return summary leaked: ' + secret);
  assert(!JSON.stringify(F.publicState()).includes('PRIVATE_ORIGINAL_TOWN_TITLE'));
  assert(!JSON.stringify(F.publicState()).includes('PRIVATE_ORIGINAL_TOWN_DETAIL'));

  // Save/restore remains compatible with prior continuity records and manual town notes.
  const prior = { structuredClone };
  vm.createContext(prior);
  vm.runInContext(fs.readFileSync(path.join(root,
    'archive/downtime-before-2026-10-01/Campaign-Continuity.js'), 'utf8'), prior);
  for (const e of prior.ECHO_CONTINUITY.SEEDS)
    assert.equal(JSON.stringify(prior.ECHO_CONTINUITY.event(e)), JSON.stringify(C.event(e)),
      'Legacy outcome fingerprint: ' + e.id);
  assert(!Object.hasOwn(C.event({ id: 'legacy' }), 'downtime'));
  const legacyExample = C.event({ id: 'older-court-record', relationships: [{ npcId: 'nessa-brindle',
    changes: { last: 'Prior approved contact' }, promiseKeys: [] }], courtyard: {
      beatId: 'mc-return-1', visit: 'return', returnKey: 'prior-trip', terms: [], spaces: [] } });
  assert.equal(JSON.stringify(prior.ECHO_CONTINUITY.event(legacyExample)), JSON.stringify(legacyExample));
  story.waterdeep.downtime.push({ id: 'legacy-project', title: 'Existing research',
    person: 'Donavan', progress: 'Three older notes', next: 'Ask before copying' });
  story.npcs.find(n => n.id === 'dracuseth').notes = 'LEGACY_NPC_NOTE';
  const round = ECHO_STORY_DATA.normalize(JSON.parse(JSON.stringify(story)));
  assert.deepEqual(round.downtime, story.downtime);
  assert.deepEqual(round.continuity, d);
  assert.deepEqual(round.waterdeep.downtime, story.waterdeep.downtime);
  assert.equal(round.npcs.find(n => n.id === 'dracuseth').notes, 'LEGACY_NPC_NOTE');
  assert.deepEqual(H.projection(round.continuity), H.projection(d));
  assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(ledger))), ledger);
  assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(ledger))).towns.find(t => t.id === 'waterdeep').sinceOutcomeIds,
    town.sinceOutcomeIds, 'Departure outcome boundary survives save and reload');
  assert.equal(JSON.stringify(state.party), partyBefore);
  console.log('Downtime passed: 12 opportunities across 7 categories and 5 characters; private reversible preparation; actual-cost and effort review; approved result/correction/withdrawal/undo; duplicate prevention; draft-placeholder blocking; owner-only delivered letters in production phone projections; private TV safety; pending NPC plans; filtered town-return window; preserved old outcomes, notes, sheets and save/reload.');
})().catch(error => { console.error(error); process.exit(1); });

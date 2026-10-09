/* Isolated in-memory rehearsal; never reads or writes a saved browser campaign. */
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
  'Campaign-Transition-Data', 'Session-01-Combat-Data', 'Session-04-Combat',
  'Session-Content-Packs', 'Session-01-Rules-Data', 'Campaign-Quests-Data',
  'Campaign-Quests', 'Campaign-Outcomes', 'Campaign-Continuity',
  'Campaign-Character-Stories', 'Campaign-Spotlights', 'Campaign-Quest-Prep-Data',
  'Campaign-Quest-Prep', 'Campaign-Transition-Links', 'Campaign-Transition',
  'Session-01-Story-Data', 'Session-01-Party-Data', 'Session-01-Combat-Run',
  'Session-01-Map-Data', 'Session-01-Town-Maps', 'Session-01-Reliability',
  'Session-01-Presentation'
]) require(path.join(root, name + '.js'));

const code = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const boot = code.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0, 'Production fixture must stop before browser initialization');
vm.runInThisContext(code.slice(0, boot) + `
globalThis.__transitionFixture = {
  context: questPrepContext, setIndex: x => campaignIndex = x,
  setState: x => state = x, fresh: () => normalize(newCustomState()),
  publicState, phoneSnapshot, sessionRunbook
};
})();`);

(async () => {
  const A = ECHO_TRANSITION, D = ECHO_TRANSITION_DATA, C = ECHO_CONTINUITY;
  const O = ECHO_OUTCOMES, P = ECHO_QUEST_PREP, F = __transitionFixture;
  const story = ECHO_STORY_DATA.normalize(), d = C.ensure(story);
  const prep = P.ensure(story), plan = A.ensure(story), state = F.fresh();
  const index = { story, presentation: ECHO_PRESENTATION.normalizeLibrary(),
    tableExtras: {}, rules: null, sessions: [{ id: 'session-01', name: 'Isolated rehearsal' }],
    combatLibrary: [] };
  F.setIndex(index); F.setState(state);
  const catalog = await F.context('next');
  const ctx = { ...catalog, story, continuity: d, prep, sessionId: 'next',
    roster: state.tokens.filter(t => t.team === 'pc') };
  const payloads = () => JSON.stringify({ tv: F.publicState(), phone: F.phoneSnapshot() });
  const untouched = () => JSON.stringify({ events: d.events, guide: d.questGuide, state,
    presentation: index.presentation, devices: index.tableExtras, public: payloads() });
  const baseline = untouched();
  const homecoming = D.beats.find(b => b.id === 'tr-homecoming');
  const obligations = D.beats.find(b => b.id === 'tr-obligations');
  const originalHomecoming = JSON.stringify(homecoming);
  const pack = ECHO_CONTENT_PACKS.find(p => p.id === 'phandalin-waterdeep-transition');

  assert(pack, 'Transition is an available session pack');
  assert.equal(pack.firstScene, 'town-phandalin');
  assert.deepEqual(pack.encounters, [], 'Transition must not stage an invented mandatory fight');
  assert.equal(D.outcomes.length, 7);
  assert.equal(D.leads.length, 4);
  assert.equal(new Set(D.beats.map(b => b.id)).size, D.beats.length);
  assert.equal(ECHO_QUEST_CATALOG.quests.length, 41);
  assert.equal(Object.keys(ECHO_QUEST_PREP_DATA.records).length, 41);
  for (const q of ECHO_QUEST_CATALOG.quests) {
    const gathered = P.gather(ctx, q.id);
    assert(gathered, 'Quest can be prepared: ' + q.id);
    assert.equal(gathered.missing.length, 0,
      'Missing resources for ' + q.id + ': ' + gathered.missing.map(x => x.id));
  }
  for (const beat of D.beats) {
    assert(pack.beats.includes(beat.id), 'Beat belongs to transition session: ' + beat.id);
    assert(pack.scenes.includes(beat.scene), 'Beat visual is included in pack: ' + beat.id);
    assert(catalog.beats.some(b => b.id === beat.id));
    assert(catalog.scenes.some(s => s.id === beat.scene));
    for (const q of beat.questIds) assert(ECHO_QUEST_CATALOG.quests.some(x => x.id === q), q);
    for (const id of beat.media) assert(catalog.media.some(m => m.id === id), 'Missing cue: ' + id);
  }
  for (const lead of D.leads) {
    assert(lead.alternative && lead.availableWhen && lead.sourceNote);
    assert(catalog.scenes.some(s => s.id === lead.scene));
    for (const id of lead.beatIds) assert(catalog.beats.some(b => b.id === id), id);
    for (const id of lead.questIds) assert(ECHO_QUEST_CATALOG.quests.some(q => q.id === id), id);
  }
  for (const sceneId of pack.scenes) {
    const scene = catalog.scenes.find(s => s.id === sceneId);
    assert(scene, 'Real scene: ' + sceneId);
    if (scene.image) assert(fs.existsSync(path.join(root, scene.image)), 'Visual exists: ' + sceneId);
  }
  for (const item of [...D.beats, ...D.leads, ...D.outcomes]) {
    for (const source of item.source || []) {
      const book = ECHO_RULES_DATA.books[source.book];
      assert(book, 'Real source book: ' + source.book);
      assert(Number.isInteger(source.page) && source.page > 0 && source.page <= book.pages);
      assert(fs.existsSync(path.resolve(root, book.file)), 'Local reference exists: ' + source.book);
    }
  }

  assert(A.branches(story).every(b => b.status === 'unknown' && !b.publicSafe));
  assert.deepEqual(A.decorate(homecoming, story).read, homecoming.read);
  assert(!A.decorate(homecoming, story).read.join(' ').match(/Gundren|Nundro|Nezznar|rescued|reopened/));
  for (const field of D.outcomes) for (const option of field.options) {
    A.choose(story, field.id, option.value);
    assert.deepEqual(A.decorate(homecoming, story).read, homecoming.read,
      'Unlinked ' + field.id + ':' + option.value + ' stays a scenario');
    assert.equal(untouched(), baseline, 'Scenario preparation must not change actual or player state');
    A.choose(story, field.id, 'unknown');
  }
  assert(D.outcomes.find(x => x.id === 'mine').options.some(x => x.value === 'destroyed'),
    'Destroyed/unusable mine has an explicit branch');
  A.checkpoint(plan); plan.departure = 'delay';
  plan.notes = 'PRIVATE_TRANSITION_NOTES_SENTINEL';
  plan.fields.custody.notes = 'PRIVATE_CUSTODY_SENTINEL';
  plan.selectedLead = 'makers';
  assert.equal(untouched(), baseline, 'Delay changes no clocks, routes, quests or events');
  assert(!payloads().includes('PRIVATE_TRANSITION_NOTES_SENTINEL'));
  assert(!payloads().includes('PRIVATE_CUSTODY_SENTINEL'));
  assert(A.restore(plan)); assert.equal(plan.departure, 'undecided');
  assert(A.restore(plan, true)); assert.equal(plan.departure, 'delay');
  assert.deepEqual(ECHO_STORY_DATA.normalize(JSON.parse(JSON.stringify(story))).transition, plan);

  const bridge = P.gather(ctx, 'waterdeep-journey');
  assert.equal(bridge.leads.length, 4);
  assert(bridge.known.some(e => e.id === 'actual-redbrand-gundren-at-inn'));
  const beforeBoard = untouched();
  P.add(ctx, 'waterdeep-journey', '0'); P.add(ctx, 'waterdeep-journey', '3');
  assert.equal(P.board(prep, 'next').leads.length, 2);
  assert.equal(untouched(), beforeBoard, 'Selecting future leads never publishes them');
  assert(P.restore(prep)); assert.equal(P.board(prep, 'next').leads.length, 1);
  assert(P.restore(prep, true)); assert.equal(P.board(prep, 'next').leads.length, 2);

  function record(values) {
    const draft = O.begin(d, { kind: 'other', source: 'Isolated test; not actual campaign play',
      status: 'confirmed', ...values });
    return O.apply(d, draft.id, O.preview(d, draft));
  }
  const publicRescue = record({ title: 'Gundren rescued elsewhere',
    detail: 'Gundren was rescued and is recovering in Neverwinter, away from this homecoming.',
    publicTitle: 'Gundren rescued', playerText: 'Gundren is safe in Neverwinter.',
    share: 'party', knows: ['party'] });
  const privateLoss = record({ title: 'PRIVATE_NUNDRO_TITLE_SENTINEL',
    detail: 'PRIVATE_NUNDRO_FACT_SENTINEL', share: 'private', knows: ['dm'] });
  const publishedBeforeBinding = payloads();
  A.choose(story, 'gundren', 'rescued'); A.bind(story, 'gundren', publicRescue.id);
  A.choose(story, 'nundro', 'dead'); A.bind(story, 'nundro', privateLoss.id);
  assert.equal(A.branches(story).find(b => b.id === 'gundren').status, 'recorded');
  assert(A.branches(story).find(b => b.id === 'gundren').publicSafe);
  assert(!A.branches(story).find(b => b.id === 'nundro').publicSafe);
  assert.equal(payloads(), publishedBeforeBinding, 'Linking records never publishes or revises one');
  const decorated = A.decorate(homecoming, story);
  assert(decorated.read.length > homecoming.read.length);
  assert(!/Gundren says|Gundren.*sits|Nundro keeps|Nundro says|A guard asks/i.test(decorated.read.join(' ')),
    'A rescue alone must not place a survivor in the Phandalin scene');
  assert(!decorated.read.join(' ').includes('PRIVATE_NUNDRO'));
  assert(decorated.private.join(' ').includes('PRIVATE_NUNDRO_TITLE_SENTINEL'));
  assert(A.decorate(obligations, story).run.length > obligations.run.length);
  assert(!payloads().includes('PRIVATE_NUNDRO'));
  assert(!payloads().includes('PRIVATE_TRANSITION_NOTES_SENTINEL'));
  assert.equal(JSON.stringify(homecoming), originalHomecoming, 'Decoration never edits the shared catalog');
  const originalState = structuredClone(state);
  state.sessionKind = 'custom'; state.contentPackId = pack.id;
  state.scenes = pack.scenes.map(id => structuredClone(catalog.scenes.find(s => s.id === id)));
  state.runbookBeats = structuredClone(pack.runbook); state.scene = pack.firstScene;
  assert.deepEqual(F.sessionRunbook().find(b => b.id === 'tr-homecoming').read, decorated.read,
    'The production active runbook applies confirmed branches');
  assert(F.sessionRunbook(state).find(b => b.id === 'tr-homecoming').read.length === homecoming.read.length,
    'A catalog/preparation lookup remains undecorated');
  assert(!payloads().includes('PRIVATE_NUNDRO'));
  assert(!payloads().includes('PRIVATE_TRANSITION_NOTES_SENTINEL'));
  Object.assign(state, originalState);

  const correction = O.begin(d, {}, publicRescue.id);
  correction.event.detail += ' Corrected whereabouts checked with the DM.';
  O.apply(d, correction.id, O.preview(d, correction));
  assert.equal(A.branches(story).find(b => b.id === 'gundren').status, 'stale');
  assert.deepEqual(A.decorate(homecoming, story).read, homecoming.read);
  assert(A.decorate(homecoming, story).private.join(' ').includes('changed or was withdrawn'));
  C.restore(d);
  assert.equal(A.branches(story).find(b => b.id === 'gundren').status, 'recorded');
  O.retire(d, publicRescue.id);
  assert.equal(A.branches(story).find(b => b.id === 'gundren').status, 'stale');
  assert.throws(() => A.bind(story, 'gundren', publicRescue.id), /approved fact/);
  C.restore(d);
  const replacement = record({ title: 'Reconciled rescue reference', detail: 'Replacement factual account.',
    replaces: [publicRescue.id], share: 'private' });
  assert.equal(A.branches(story).find(b => b.id === 'gundren').status, 'stale');
  A.bind(story, 'gundren', replacement.id);
  assert.equal(A.branches(story).find(b => b.id === 'gundren').status, 'recorded');
  assert(!A.branches(story).find(b => b.id === 'gundren').publicSafe);
  assert.deepEqual(A.decorate(homecoming, story).read, homecoming.read);
  assert(A.restore(plan)); // Restore the superseded source binding: deliberately remains stale.
  assert.equal(A.branches(story).find(b => b.id === 'gundren').status, 'stale');
  assert(A.restore(plan, true));

  const rumor = record({ title: 'A rumor', detail: 'An uncorroborated report.', status: 'rumor' });
  assert.throws(() => A.bind(story, 'gundren', rumor.id), /approved fact/);
  assert.throws(() => A.choose(story, 'mine', 'instant-profit'), /available outcome/);
  assert.throws(() => A.bind(story, 'mine', replacement.id), /matching outcome/);
  assert.equal(A.normalize({ departure: 'teleport', fields: { mine: { value: 'instant-profit' } } }).departure, 'undecided');
  assert.equal(A.normalize({ fields: { mine: { value: 'instant-profit' } } }).fields.mine.value, 'unknown');
  assert.deepEqual(ECHO_STORY_DATA.normalize(JSON.parse(JSON.stringify(story))).transition, plan);
  for (const name of ['PRIVATE_TRANSITION_NOTES_SENTINEL', 'PRIVATE_CUSTODY_SENTINEL',
    'PRIVATE_NUNDRO_TITLE_SENTINEL', 'PRIVATE_NUNDRO_FACT_SENTINEL']) assert(!payloads().includes(name), name);
  assert(!payloads().includes('Looking Glass'));
  console.log('Transition passed: 41 quest profiles, real pack/scene/media/book references, seven neutral outcomes, four alternate leads, scenario and delay isolation, survivor presence, public/private/stale bindings, correction and undo, save normalization, preparation boards, and production TV/phone privacy.');
})().catch(error => { console.error(error); process.exit(1); });

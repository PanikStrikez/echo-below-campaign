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
  'Campaign-Courtyard', 'Session-01-Story-Data', 'Session-01-Party-Data',
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
globalThis.__courtyardFixture = {
  context: questPrepContext, setIndex: x => campaignIndex = x,
  setState: x => state = x, fresh: () => normalize(newCustomState()),
  publicState, phoneSnapshot, sessionRunbook
};
})();`);

(async () => {
  const H = ECHO_COURTYARD, D = ECHO_COURTYARD_DATA, C = ECHO_CONTINUITY;
  const O = ECHO_OUTCOMES, F = __courtyardFixture, P = ECHO_QUEST_PREP;
  const story = ECHO_STORY_DATA.normalize(), d = C.ensure(story);
  const oldNpc = story.npcs.find(n => n.id === 'dracuseth');
  oldNpc.notes = 'Preserved existing Dracuseth note';
  oldNpc.lastInteraction = 'Preserved older manual account';
  oldNpc.promisedHelp = 'Preserved older promise';
  const originalNpc = JSON.stringify(oldNpc);
  const originalEvents = JSON.stringify(d.events);
  H.ensureReferences(story); H.ensureReferences(story);
  assert.equal(JSON.stringify(oldNpc), originalNpc, 'Reference insertion preserves existing NPC notes');
  for (const n of D.cast) assert.equal(story.npcs.filter(x => x.id === n.id).length, 1, n.id);
  assert.equal(JSON.stringify(d.events), originalEvents, 'Preparing references cannot establish meetings');
  assert(D.cast.every(n => !n.lastExperienced && !n.promises.length && !n.knows.length),
    'Residents start without invented party experiences, promises or knowledge');

  // Existing transition bindings depend on the exact normalized JSON of old records.
  const backup = path.join(root, 'archive/courtyard-before-2026-10-01/Campaign-Continuity.js');
  assert(fs.existsSync(backup), 'Original continuity module preserved before migration');
  const prior = { structuredClone };
  vm.createContext(prior);
  vm.runInContext(fs.readFileSync(backup, 'utf8'), prior);
  for (const e of prior.ECHO_CONTINUITY.SEEDS)
    assert.equal(JSON.stringify(prior.ECHO_CONTINUITY.event(e)), JSON.stringify(C.event(e)),
      'Old event fingerprint changed: ' + e.id);
  assert(!Object.hasOwn(C.event({ id: 'old' }), 'relationships'));
  assert(!Object.hasOwn(C.event({ id: 'old' }), 'courtyard'));
  const optional = C.event({ id: 'new', relationships: [{ npcId: 'nessa-brindle',
    changes: { wants: '', last: 'A careful introduction' }, promiseKeys: ['p'.repeat(100)] }] });
  assert(Object.hasOwn(optional.relationships[0].changes, 'wants'));
  assert.equal(optional.relationships[0].changes.wants, '');
  assert(!Object.hasOwn(optional.relationships[0].changes, 'next'));
  assert.equal(optional.relationships[0].promiseKeys[0].length, 100);
  assert.deepEqual(C.event(JSON.parse(JSON.stringify(optional))), optional);
  assert(H.validate(C.event({ relationships: [
    { npcId: 'nessa-brindle', changes: { wants: 'First' } },
    { npcId: 'nessa-brindle', changes: { wants: 'Conflicting second' } }
  ] })).some(e => e.includes('only one NPC relationship')));
  assert(H.validate(C.event({ relationships: [{ npcId: 'nessa-brindle',
    changes: { attitude: 'automatic loyalty' } }] })).some(e => e.includes('valid relationship attitude')));
  assert(H.validate(C.event({ courtyard: { terms: [
    { id: 'rent', value: 'First' }, { id: 'rent', value: 'Conflicting second' }
  ] } })).some(e => e.includes('only one lodging term')));
  assert(H.validate(C.event({ courtyard: { spaces: [
    { id: 'mc-table', value: 'First' }, { id: 'mc-table', value: 'Conflicting second' }
  ] } })).some(e => e.includes('only one shared space')));

  const prep = H.ensure(story), state = F.fresh();
  const index = { story, presentation: ECHO_PRESENTATION.normalizeLibrary(), tableExtras: {},
    rules: null, sessions: [{ id: 'session-01', name: 'Isolated home rehearsal' }], combatLibrary: [] };
  F.setIndex(index); F.setState(state);
  const ctx = { story, markers: [] };
  const payloads = () => JSON.stringify({ tv: F.publicState(), phones: F.phoneSnapshot() });
  const baseline = JSON.stringify({ state, events: d.events, public: payloads() });
  prep.notes = 'PRIVATE_COURTYARD_PREP_SENTINEL';
  prep.people['nessa-brindle'] = 'PRIVATE_RESIDENT_PREP_SENTINEL';
  prep.terms.rent = 'PRIVATE_RENT_PROPOSAL_SENTINEL';
  assert.equal(JSON.stringify({ state, events: d.events, public: payloads() }), baseline,
    'Home preparation leaves play, approved history and player displays unchanged');

  const catalog = await F.context('next');
  const pack = ECHO_CONTENT_PACKS.find(p => p.runbook?.some(b => b.id === 'mc-arrival'));
  assert(pack, 'Home scenes can be launched as a session pack');
  assert.equal(D.beats.length, 11);
  assert.equal(new Set(D.beats.map(b => b.id)).size, 11);
  assert.equal(pack.encounters.length, 0, 'Home does not impose combat');
  for (const beat of D.beats) {
    assert(pack.beats.includes(beat.id), 'Pack beat: ' + beat.id);
    assert(catalog.beats.some(b => b.id === beat.id), 'Preparation beat: ' + beat.id);
    assert(pack.scenes.includes(beat.scene), 'Visual included in pack: ' + beat.id);
    assert(catalog.scenes.some(s => s.id === beat.scene), 'Visual exists: ' + beat.id);
    for (const id of beat.npcIds) assert(D.cast.some(n => n.id === id), 'Known resident: ' + id);
    for (const id of beat.questIds) assert(ECHO_QUEST_CATALOG.quests.some(q => q.id === id), 'Quest: ' + id);
    for (const id of beat.media) assert(catalog.media.some(m => m.id === id), 'Media: ' + id);
    assert(beat.read.length && beat.run.length && beat.choices.length, 'Playable home scene: ' + beat.id);
  }
  for (const id of pack.scenes) {
    const s = catalog.scenes.find(x => x.id === id);
    assert(s, 'Real scene ' + id);
    if (s.image) assert(fs.existsSync(path.join(root, s.image)), 'Local asset: ' + id);
  }
  const courtyardQuest = P.gather({ ...catalog, story, continuity: d, prep: P.ensure(story),
    sessionId: 'next', roster: state.tokens.filter(t => t.team === 'pc') }, 'courtyard');
  assert.equal(courtyardQuest.missing.length, 0, 'Courtyard quest links resolve');
  assert(D.beats.every(b => courtyardQuest.beats.some(x => x.id === b.id)),
    'All prepared home beats are available from the courtyard quest');

  function draft(values) {
    return O.begin(d, { kind: 'other', source: 'Isolated rehearsal; not actual play',
      status: 'confirmed', basis: 'Observed', title: 'Home rehearsal record',
      detail: 'A specific reviewed test result.', ...values });
  }
  function apply(value) {
    const review = O.preview(d, value, ctx);
    assert.deepEqual(review.errors, [], 'Outcome validation: ' + value.event.title);
    return O.apply(d, value.id, review, ctx);
  }
  function record(values) { return apply(draft(values)); }
  const arrival = record({ ...H.draft(story, 'mc-arrival'),
    detail: 'The party chose to introduce themselves at the proposed court.' });
  assert(H.home(d).introduced);
  const originalScene = D.beats.find(b => b.id === 'mc-return-1');
  const originalRead = JSON.stringify(originalScene.read);
  const relationshipDraft = draft({ title: 'Nessa names a need',
    detail: 'PRIVATE_RELATIONSHIP_DETAIL_SENTINEL',
    relationships: [{ npcId: 'nessa-brindle',
      changes: { wants: 'PRIVATE_WANTS_SENTINEL', last: 'PRIVATE_EXPERIENCE_SENTINEL',
        attitude: 'known', next: 'PRIVATE_NEXT_INTENTION_SENTINEL' }, promiseKeys: [] }] });
  const beforeRelationships = H.relationshipProjection(d);
  const relationshipReview = O.preview(d, relationshipDraft, ctx);
  assert(relationshipReview.changes.relationships, 'Approval previews relationship differences');
  assert.deepEqual(H.relationshipProjection(d), beforeRelationships, 'A draft does not update NPCs');
  const relationshipEvent = O.apply(d, relationshipDraft.id, relationshipReview, ctx);
  assert.equal(H.relationship(d, 'nessa-brindle').changes.attitude, 'known');
  assert(!C.knowledge(d, 'nessa-brindle').some(e => e.id === relationshipEvent.id),
    'A relationship link does not teach the NPC the entire outcome');
  assert(H.decorate(originalScene, story).run.join(' ').includes('PRIVATE_WANTS_SENTINEL'),
    'Approved relationship needs are available for future DM scenes');
  assert.equal(JSON.stringify(H.decorate(originalScene, story).read), originalRead,
    'Private relationship fields are never appended to read-aloud');

  const correction = O.begin(d, {}, relationshipEvent.id);
  correction.event.relationships[0].changes.wants = '';
  correction.event.relationships[0].changes.last = 'Corrected interaction';
  delete correction.event.relationships[0].changes.next;
  apply(correction);
  assert.equal(H.relationship(d, 'nessa-brindle').changes.wants, '');
  assert(!Object.hasOwn(H.relationship(d, 'nessa-brindle').changes, 'next'));
  assert(!H.decorate(originalScene, story).run.join(' ').includes('PRIVATE_WANTS_SENTINEL'));
  assert(C.restore(d));
  assert(H.decorate(originalScene, story).run.join(' ').includes('PRIVATE_WANTS_SENTINEL'));
  assert(C.restore(d, true));
  assert.equal(H.relationship(d, 'nessa-brindle').changes.wants, '');
  assert(C.restore(d));
  const withdraw = O.begin(d, {}, relationshipEvent.id); withdraw.withdraw = true;
  apply(withdraw);
  assert(!Object.hasOwn(H.relationship(d, 'nessa-brindle').changes, 'wants'));
  assert(C.restore(d));
  assert.equal(H.relationship(d, 'nessa-brindle').changes.wants, 'PRIVATE_WANTS_SENTINEL');
  const independentLast = record({ title: 'A later greeting', relationships: [{ npcId: 'nessa-brindle',
    changes: { last: 'Later greeting, nothing else changed' }, promiseKeys: [] }] });
  assert.equal(H.relationship(d, 'nessa-brindle').changes.wants, 'PRIVATE_WANTS_SENTINEL',
    'Absent relationship fields keep earlier approved values');
  const clearWant = record({ title: 'A changed need', relationships: [{ npcId: 'nessa-brindle',
    changes: { wants: '' }, promiseKeys: [] }] });
  assert.equal(H.relationship(d, 'nessa-brindle').changes.wants, '');
  assert(C.restore(d));

  const shared = record({ title: 'PRIVATE_ORIGINAL_TITLE_SENTINEL',
    publicTitle: 'Meeting our neighbors', detail: 'PRIVATE_SHARED_EVENT_DETAIL_SENTINEL',
    playerText: 'We met Nessa and offered to discuss the workbench.', share: 'party',
    knows: ['party', 'nessa-brindle'], relationships: [{ npcId: 'nessa-brindle',
      changes: { last: 'PRIVATE_LATEST_EXPERIENCE_SENTINEL' }, promiseKeys: [] }] });
  assert(C.knowledge(d, 'nessa-brindle').some(e => e.id === shared.id));
  assert(!C.knowledge(d, 'orenna-pike').some(e => e.id === shared.id));
  assert(payloads().includes('We met Nessa and offered to discuss the workbench.'));
  const privateJournal = record({ title: 'PRIVATE_CONVERSATION_TITLE_SENTINEL',
    detail: 'PRIVATE_CONVERSATION_DETAIL_SENTINEL', publicTitle: 'A quiet conversation',
    playerText: 'Nessa agreed to speak with you privately.', knows: ['pc-trista'],
    recipients: ['pc-trista'], relationships: [{ npcId: 'nessa-brindle',
      changes: { next: 'PRIVATE_ONE_PLAYER_INTENTION_SENTINEL' }, promiseKeys: [] }] });
  assert(O.privateJournal(d, 'pc-trista').some(j => j.text === privateJournal.playerText));
  assert(!O.privateJournal(d, 'pc-pebble').some(j => j.text === privateJournal.playerText));
  assert(!JSON.stringify(F.publicState()).includes(privateJournal.playerText));

  record({ title: 'A practical promise', tracks: [{ kind: 'promise', key: 'nessa-press',
    subject: 'PRIVATE_PRESS_PROMISE_SENTINEL', holder: 'Party', owedTo: 'Nessa',
    state: 'open', public: false }], relationships: [{ npcId: 'nessa-brindle',
      changes: {}, promiseKeys: ['nessa-press'] }] });
  assert.equal(H.relationship(d, 'nessa-brindle').promises[0].state, 'open');
  record({ title: 'The press was moved', tracks: [{ kind: 'promise', key: 'nessa-press',
    subject: 'PRIVATE_PRESS_PROMISE_SENTINEL', holder: 'Party', owedTo: 'Nessa',
    state: 'resolved', public: false }] });
  assert.equal(H.relationship(d, 'nessa-brindle').promises[0].state, 'resolved',
    'Promise state follows its canonical tracked key without duplicate NPC facts');
  assert(!H.decorate(originalScene, story).run.join(' ').includes('open promise: PRIVATE_PRESS'));
  assert(C.restore(d));
  assert.equal(H.relationship(d, 'nessa-brindle').promises[0].state, 'open');

  const homeDraft = draft({ title: 'Reviewed lodging agreement', courtyard: {
    beatId: 'mc-terms', visit: 'visit', returnKey: '',
    terms: [{ id: 'rent', value: 'PRIVATE_ACTUAL_RENT_SENTINEL' }],
    spaces: [{ id: 'mc-table', value: 'PRIVATE_SHARED_SPACE_SENTINEL' }] } });
  assert(O.preview(d, homeDraft, ctx).changes.home, 'Preview includes terms and space changes');
  apply(homeDraft);
  assert.equal(H.home(d).terms.rent.value, 'PRIVATE_ACTUAL_RENT_SENTINEL');
  assert.equal(H.home(d).spaces['mc-table'].value, 'PRIVATE_SHARED_SPACE_SENTINEL');
  record({ title: 'Remove an outdated term', courtyard: { beatId: 'mc-terms', visit: 'visit',
    returnKey: '', terms: [{ id: 'rent', value: '' }], spaces: [] } });
  assert.equal(H.home(d).terms.rent.value, '');
  assert.equal(H.home(d).spaces['mc-table'].value, 'PRIVATE_SHARED_SPACE_SENTINEL');
  assert(C.restore(d));

  const disturbance = D.beats.find(b => b.id === 'mc-disturbance');
  assert(H.gate(disturbance, story));
  assert.equal(H.decorate(disturbance, story).read.length, 0);
  for (const status of ['planned', 'rumor']) record({ title: 'Unplayed return ' + status, status,
    relationships: [{ npcId: 'orenna-pike', changes: { wants: 'UNPLAYED_WANT' }, promiseKeys: [] }],
    courtyard: { beatId: 'mc-return-1', visit: 'return', returnKey: 'unplayed-' + status,
      terms: [], spaces: [] } });
  assert.equal(H.home(d).ordinaryReturns, 0);
  assert(!Object.hasOwn(H.relationship(d, 'orenna-pike').changes, 'wants'));
  for (const [key,beat] of [['trip-one', 'mc-return-1'], ['trip-one', 'mc-return-1'],
    ['trip-two', 'mc-return-2']]) record({ title: key, courtyard: {
      beatId: beat, visit: 'return', returnKey: key, terms: [], spaces: [] } });
  assert.equal(H.home(d).ordinaryReturns, 2, 'Scenes during one return count once');
  prep.disturbancesEnabled = true;
  assert(H.gate(disturbance, story), 'Manual switch cannot bypass three confirmed returns');
  prep.disturbancesEnabled = false;
  const third = record({ title: 'Third ordinary return', courtyard: { beatId: 'mc-return-3',
    visit: 'return', returnKey: 'trip-three', terms: [], spaces: [] } });
  assert.equal(H.home(d).ordinaryReturns, 3);
  assert(H.gate(disturbance, story), 'Three returns never auto-enable disturbances');
  prep.disturbancesEnabled = true;
  assert.equal(H.gate(disturbance, story), '');
  assert.deepEqual(H.decorate(disturbance, story).read, disturbance.read);
  O.retire(d, third.id);
  assert(H.gate(disturbance, story), 'Withdrawing a return re-locks the future disturbance');
  assert(C.restore(d));
  assert.equal(H.gate(disturbance, story), '');

  // Active production scenes receive private guidance; all public paths remain allowlisted.
  state.sessionKind = 'custom'; state.contentPackId = pack.id;
  state.scenes = pack.scenes.map(id => structuredClone(catalog.scenes.find(s => s.id === id)));
  state.runbookBeats = structuredClone(pack.runbook); state.scene = pack.firstScene;
  const active = F.sessionRunbook().find(b => b.id === originalScene.id);
  assert(active.run.join(' ').includes('PRIVATE_WANTS_SENTINEL'));
  assert.equal(JSON.stringify(active.read), originalRead);
  assert.equal(JSON.stringify(D.beats.find(b => b.id === originalScene.id).read), originalRead,
    'Dynamic guidance never mutates authored content');
  const wire = payloads();
  for (const secret of ['PRIVATE_COURTYARD_PREP_SENTINEL', 'PRIVATE_RESIDENT_PREP_SENTINEL',
    'PRIVATE_RENT_PROPOSAL_SENTINEL', 'PRIVATE_RELATIONSHIP_DETAIL_SENTINEL',
    'PRIVATE_WANTS_SENTINEL', 'PRIVATE_EXPERIENCE_SENTINEL', 'PRIVATE_NEXT_INTENTION_SENTINEL',
    'PRIVATE_ORIGINAL_TITLE_SENTINEL', 'PRIVATE_SHARED_EVENT_DETAIL_SENTINEL',
    'PRIVATE_LATEST_EXPERIENCE_SENTINEL', 'PRIVATE_CONVERSATION_TITLE_SENTINEL',
    'PRIVATE_CONVERSATION_DETAIL_SENTINEL', 'PRIVATE_ONE_PLAYER_INTENTION_SENTINEL',
    'PRIVATE_PRESS_PROMISE_SENTINEL', 'PRIVATE_ACTUAL_RENT_SENTINEL', 'PRIVATE_SHARED_SPACE_SENTINEL']) {
    assert(!wire.includes(secret), 'Private data reached a player projection: ' + secret);
    assert(!active.read.join(' ').includes(secret), 'Private data reached read-aloud: ' + secret);
  }
  assert.deepEqual(F.publicState().journal, F.phoneSnapshot().continuity.journal);
  assert(!F.phoneSnapshot().continuity.quests.some(q => q.id === 'echo-below'));

  const round = ECHO_STORY_DATA.normalize(JSON.parse(JSON.stringify(story)));
  assert.deepEqual(round.courtyard, prep, 'Private preparation survives a portable reload');
  assert.deepEqual(round.continuity, d, 'Canonical relationships and home history survive reload');
  assert.deepEqual(H.relationshipProjection(round.continuity), H.relationshipProjection(d));
  assert.deepEqual(H.homeProjection(round.continuity), H.homeProjection(d));
  assert.equal(JSON.stringify(round.npcs.find(n => n.id === 'dracuseth')), originalNpc);
  console.log('Courtyard passed: 11 playable scenes and references; preserved legacy fingerprints and NPC notes; reviewed relationship changes, clears, independent knowledge, linked promises, correction/withdrawal/undo; lodging and spaces; three distinct factual returns plus manual disturbance gating; save/reload; production TV/phone and read-aloud privacy.');
})().catch(error => { console.error(error); process.exit(1); });

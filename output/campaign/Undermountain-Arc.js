/* Private preparation only. All three contracts use the same saved first floor. */
(() => {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const list = value => Array.isArray(value) ? value : value ? [value] : [];
  const packages = () => globalThis.ECHO_UNDERMOUNTAIN_ARC_DATA?.packages || [];
  const get = id => packages().find(p => p.id === id);
  function beats(id) {
    return packages().filter(p => !id || p.id === id).flatMap(p => [
      ...p.beats, ...(globalThis.ECHO_UNDERMOUNTAIN_ARC_CAST?.returns || []).filter(b => b.arc === p.id)
    ]).map(b => ({ ...copy(b), choices:[...(b.choices||[]),...(b.alternatives||[])],
      run:[...(b.run||[]),...(b.next?['Next option: '+b.next]:[])],
      private: [...(b.private || []),...(b.trigger?['Use only when: '+b.trigger]:[]),...(b.outcomes||[]).map(x=>'Record only if it happened: '+x),
        ...(b.sources || []).map(s => typeof s === 'string' ? s : `${s.label || s.book}${s.page ? ' · printed p. '+s.page : ''}. ${s.note || ''}`),
        ...(b.creatures||[]).map(c=>`Creature reference: ${c.count||''} ${c.name} · ${c.book}, printed p. ${c.page}. ${c.note||''}`),...(b.source?[b.source]:[])],
      tv: b.tv || 'Private notes. Preview the scene before choosing Show on TV. Publish quest information through its approved audience.' }));
  }
  function extendRunbook(base = []) {
    const ids = new Set(base.map(b => b.id));
    return [...base, ...beats().filter(b => !ids.has(b.id))];
  }
  function addToBoard(ctx, arcId, leadId = '0') {
    const p = get(arcId); if (!p) throw Error('Choose a prepared expedition.');
    const entry = globalThis.ECHO_QUEST_PREP.add(ctx, p.questId, leadId);
    entry.beatId = p.beats[0].id; entry.sceneId = p.beats[0].scene;
    entry.nextAction = p.contract.scope;
    entry.notes = ('Future preparation. ' + p.prerequisites.join(' ') + '\nReview the saved dungeon and agreed payment before departure.').slice(0, 2000);
    return entry;
  }
  function proposal(ctx, record, arcId, index) {
    const p = get(arcId), response = p?.responses[index];
    if (!response) throw Error('Choose an expedition response.');
    return globalThis.ECHO_EXPEDITIONS.prepare(ctx, record, {
      title: response.title || `${p.title} · proposed response`,
      reason: `${response.trigger}\nEvidence to check: ${Array.isArray(response.evidence) ? response.evidence.join(' ') : response.evidence}`,
      proposal: `${response.proposal}\nPreserve: ${list(response.preserves).join(' ')}`
    });
  }
  function ensureReferences(story) {
    for (const n of globalThis.ECHO_UNDERMOUNTAIN_ARC_CAST?.rivals || []) if (!story.npcs.some(x => x.id === n.id))
      story.npcs.push({ id: n.id, name: n.name, source: 'Echo Below · Gilded Compass; proposed encounter details',
        base: 'Yawning Portal / Gilded Compass', voice: String(n.voice || '').slice(0,600), goal: String(n.goal || '').slice(0,600),
        attitude: 'distant', lastInteraction: '', promisedHelp: '', nextMove: '', notes: '', portrait: '' });
  }
  function stageBrief(continuity, id) {
    const h=globalThis.ECHO_UNDERMOUNTAIN_ARC_CAST.handouts.find(h=>h.id===id&&h.audience==='shared'&&h.id.endsWith('-brief'));
    if(!h)throw Error('Choose a shared contract brief. Personal correspondence uses its owner’s private clue preview.');
    globalThis.ECHO_CONTINUITY.checkpoint(continuity);
    const r=globalThis.ECHO_QUESTS.record(continuity.questGuide,h.questId);
    r.draft={title:h.title.slice(0,120),text:h.body.slice(0,2400)};
    return h.questId;
  }
  globalThis.ECHO_UNDERMOUNTAIN_ARC = { packages, get, beats, extendRunbook, addToBoard, proposal, ensureReferences, stageBrief };
})();

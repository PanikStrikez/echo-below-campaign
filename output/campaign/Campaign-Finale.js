/* Private intervention preparation. Actual outcomes remain in the canonical ledger. */
(() => {
  'use strict';
  const list = value => Array.isArray(value) ? value : [];
  const text = (value, limit = 4000) => String(value ?? '').slice(0, limit);
  const valid = value => typeof value === 'string' && /^[-a-zA-Z0-9_:]{1,100}$/.test(value) && !['__proto__','constructor','prototype'].includes(value);
  const copy = value => JSON.parse(JSON.stringify(value));
  const data = () => globalThis.ECHO_FINALE_DATA;
  const approaches = () => data()?.approaches || [];
  const scenes = () => data()?.scenes || [];
  const requirements = () => approaches().flatMap(a => a.prerequisites);
  const categories = () => data()?.epilogues || [];
  const assessments = ['unreviewed', 'supported', 'uncertain', 'not-met'];
  const M = () => globalThis.ECHO_MYSTERY;
  const actual = d => globalThis.ECHO_CONTINUITY.effective(d).filter(e => e.approved && e.status !== 'planned');
  const refs = value => [...new Map(list(value).filter(r => r && valid(r.eventId)).map(r => [r.eventId, {
    eventId: r.eventId, fingerprint: text(r.fingerprint, 200)
  }])).values()].slice(0, 25);
  function normalize(raw = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const reviews = {}, results = {};
    for (const [id, r] of Object.entries(raw.reviews || {}).slice(0, 150)) if (valid(id) && r) {
      reviews[id] = {assessment: assessments.includes(r.assessment) ? r.assessment : 'unreviewed', note: text(r.note), refs: refs(r.refs)};
    }
    for (const [id, r] of Object.entries(raw.results || {}).slice(0, 40)) if (valid(id)) results[id] = refs(r);
    return {version: 1, primary: approaches().some(a => a.id === raw.primary) ? raw.primary : '',
      fallbacks: [...new Set(list(raw.fallbacks).filter(id => approaches().some(a => a.id === id)))].slice(0, 5),
      briefs: Object.fromEntries(['activation','threat','limits'].map(k => [k, text(raw.briefs?.[k], 5000)])),
      notes: text(raw.notes, 5000), reviews, results,
      undo: list(raw.undo).filter(x => typeof x === 'string' && x.length < 3000000).slice(-15),
      redo: list(raw.redo).filter(x => typeof x === 'string' && x.length < 3000000).slice(-15)};
  }
  const ensure = story => story.finale ||= normalize();
  const snapshot = p => JSON.stringify({...p, undo: [], redo: []});
  function checkpoint(p) { p.undo.push(snapshot(p)); p.undo = p.undo.slice(-15); p.redo = []; }
  function restore(story, redo = false) {
    const p = ensure(story), stack = redo ? p.redo : p.undo;
    if (!stack.length) return false;
    const before = snapshot(p), restored = normalize(JSON.parse(stack.pop())), undo = p.undo, forward = p.redo;
    Object.assign(p, restored, {undo, redo: forward});
    (redo ? p.undo : p.redo).push(before);
    return true;
  }
  function updatePlan(story, patch = {}) {
    const p = ensure(story), next = normalize({...p, ...Object.fromEntries(['primary','fallbacks','briefs','notes'].filter(k => Object.hasOwn(patch,k)).map(k => [k,patch[k]]))});
    next.fallbacks = next.fallbacks.filter(id => id !== next.primary);
    checkpoint(p);
    for (const k of ['primary','fallbacks','briefs','notes']) p[k] = next[k];
    return p;
  }
  function selectedRefs(d, ids) {
    if (!Array.isArray(ids) || ids.length > 25) throw Error('Choose up to 25 actual outcomes.');
    const events = new Map(actual(d).map(e => [e.id,e]));
    return [...new Set(ids)].map(id => {
      const event = events.get(id);
      if (!event) throw Error('An outcome is unavailable or still planned. Reopen this review.');
      return {eventId: id, fingerprint: M().fingerprint(event)};
    });
  }
  function sourceRows(d, references) {
    const events = new Map(actual(d).map(e => [e.id,e]));
    return references.map(ref => {
      const event = events.get(ref.eventId), issues = [];
      if (!event) issues.push('Source withdrawn, superseded or unavailable. Choose its reviewed replacement.');
      else {
        if (M().fingerprint(event) !== ref.fingerprint) issues.push('Source changed since this review.');
        issues.push(...M().issues(d,event));
      }
      const knownBy = list(event?.knows), partyKnown = knownBy.includes('party') || knownBy.some(id => id.startsWith('pc-'));
      const verified = !!event && !issues.length && ['confirmed','completed'].includes(event.status);
      return {ref, event, issues: [...new Set(issues)], knownBy, partyKnown,
        wholeParty: knownBy.includes('party'), verified, observed: verified && event.basis === 'Observed'};
    });
  }
  function saveReview(story, d, prerequisiteId, value = {}) {
    if (!requirements().some(r => r.id === prerequisiteId)) throw Error('Choose an available prerequisite.');
    if (!assessments.includes(value.assessment)) throw Error('Choose a review assessment.');
    const references = selectedRefs(d,value.eventIds || []), note = text(value.note).trim();
    if (value.assessment === 'supported' && (!references.length || !note)) throw Error('Supported needs an actual source and your explanation of its limits.');
    const p = ensure(story); checkpoint(p);
    return p.reviews[prerequisiteId] = {assessment:value.assessment,note,refs:references};
  }
  function assess(story, d, prerequisiteId) {
    const saved = ensure(story).reviews[prerequisiteId] || {assessment:'unreviewed',note:'',refs:[]};
    const sources = sourceRows(d,saved.refs), issues = [...new Set(sources.flatMap(r => r.issues))];
    const observations = sources.filter(r => r.observed && r.partyKnown);
    const established = saved.assessment === 'supported' && !!saved.note.trim() && !issues.length && observations.length > 0;
    let label = 'Not reviewed';
    if (issues.length) label = 'Sources need re-review';
    else if (saved.assessment === 'not-met') label = 'DM review: prerequisite not met';
    else if (saved.assessment === 'uncertain') label = 'Uncertain / speculative';
    else if (saved.assessment === 'supported') label = established ? 'DM-assessed support from an observation known to a player' : sources.some(r => r.observed) ? 'DM-only support; player knowledge not recorded' : 'Claim, inference or unconfirmed result; still speculative';
    return {saved, sources, label, issues, established, speculative:!established};
  }
  function assessRoute(story, d, routeId) {
    const approach = approaches().find(a => a.id === routeId);
    if (!approach) throw Error('Choose an intervention approach.');
    const rows = approach.prerequisites.map(requirement => ({requirement,...assess(story,d,requirement.id)}));
    return {approach, requirements:rows, reviewed:rows.filter(r => r.saved.assessment !== 'unreviewed').length,
      established:rows.filter(r => r.established).length};
  }
  function linkResult(story, d, categoryId, eventIds) {
    if (!categories().some(c => c.id === categoryId)) throw Error('Choose an epilogue subject.');
    const references = selectedRefs(d,eventIds), p = ensure(story); checkpoint(p);
    p.results[categoryId] = references;
    return references;
  }
  function epilogue(story, d) {
    const p = ensure(story);
    return categories().map(c => {
      const records = sourceRows(d,p.results[c.id] || []);
      const established = records.filter(r => r.verified && r.event.basis === 'Observed');
      const unresolved = records.filter(r => !established.includes(r));
      const prompts = [...established.map(r => `After “${r.event.title}”, what remains to repair, decide or follow up? Use the recorded result and its actual limits.`),
        ...unresolved.filter(r => r.event).map(r => `What would corroborate or correct “${r.event.title}” before presenting it as settled history?`),
        ...list(c.prompts)];
      return {...c, prompts, records, established, unresolved, missing:!established.length};
    });
  }
  function resultDraft(categoryId = '') {
    const category = categories().find(c => c.id === categoryId);
    return {kind:'discovery', title: category ? 'Finale · '+category.title : 'Finale · actual outcome', detail:'',
      source:'DM table record · identify the actual event and witnesses', status:'confirmed', basis:'Observed',
      share:'private', knows:[], recipients:[], quests:[{id:'act-ending',state:'reference',stepId:''}],
      mystery:M().eventMeta({links:[{conclusionId:'district-interventions',relation:'context'}]})};
  }
  function chunk(value, size = 1200, limit = 12) {
    let remaining = value; const rows=[];
    while (remaining.length) {
      if (rows.length >= limit) throw Error('This scene exceeds the saved note limit; use its full finale card.');
      let at=Math.min(size,remaining.length);
      if (at<remaining.length) {const space=remaining.lastIndexOf(' ',at); if(space>at*.6) at=space;}
      rows.push(remaining.slice(0,at)); remaining=remaining.slice(at).trimStart();
    }
    return rows;
  }
  function sceneBeat(scene) {
    return {id:scene.id,title:scene.title,scene:scene.sceneId || '',encounter:'',
      read:list(scene.read),readAfter:[],ask:[],run:chunk([...list(scene.run),...list(scene.checks)].join('\n\n')),
      choices:list(scene.choices),tv:'Private future finale preparation. Review the actual scene and visual before showing anything.',
      private:chunk(['Future preparation; no outcome, countdown or activation is assumed.',
        ...list(scene.consequences).map(t=>'Possible consequence: '+t), 'If declined: '+(scene.fallback||''),
        'Source: '+(scene.source||'Original Echo Below finale framework')].join('\n\n'))};
  }
  const beats = () => scenes().map(sceneBeat);
  const beatsForQuest = id => scenes().filter(s => list(s.questIds).includes(id)).map(s => s.id);
  const hasQuest = id => ['echo-below','act-ending',...approaches().map(a => a.questId)].includes(id);
  function leads(qid) {
    return approaches().filter(a => a.questId===qid || qid==='act-ending').map(a => ({id:'finale-'+a.id,title:a.title,
      text:a.summary,beatId:a.sceneIds[0] || '',sceneId:'',theater:true,
      nextAction:'Review actual support, affected people’s decisions and a fallback before commitment.',
      notes:'Future intervention plan. No approach is guaranteed. '+list(a.alternatives).join(' ')}));
  }
  function stageScene(story, sessionId, sceneId, currentSceneIds = []) {
    const scene=scenes().find(s => s.id===sceneId);
    if (!scene || !valid(sessionId)) throw Error('Choose a scene and current session.');
    story.sessionPlans ||= {};
    const plan=story.sessionPlans[sessionId] || {nextBeat:'',music:'',handout:'',likelyRules:'',elsePlan:'',opening:'',notes:'',order:[],extraBeats:[],beats:{}};
    if (plan.extraBeats.some(b=>b.id===sceneId)) return 0;
    if (plan.extraBeats.length>=100) throw Error('This session has 100 extra scenes. Remove unused notes first.');
    const beat=sceneBeat(scene); if (!currentSceneIds.includes(beat.scene)) beat.scene='';
    plan.extraBeats.push(copy(beat));story.sessionPlans[sessionId]=plan;
    return 1;
  }
  globalThis.ECHO_FINALE={data,approaches,scenes,requirements,categories,assessments,normalize,ensure,actual,updatePlan,
    saveReview,assess,assessRoute,linkResult,epilogue,resultDraft,restore,stageScene,sceneBeat,beats,beatsForQuest,hasQuest,leads};
})();

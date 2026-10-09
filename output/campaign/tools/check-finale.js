/* Isolated production rehearsal. No live save, browser profile or phone service is opened. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
global.window = global;
global.location = { hash: '', protocol: 'file:' };
for (const name of [
  'LMOP-Visual-Catalog','LMOP-Battle-Map-Catalog','Waterdeep-Expedition-Data','Waterdeep-Expedition',
  'Session-01-Runbook','Session-02-Runbook','Session-03-Runbook','Session-03-Thundertree-Runbook',
  'Session-04-Runbook','Campaign-Transition-Data','Campaign-Courtyard-Data',
  'Undermountain-Arc-Data','Undermountain-Arc-Cast','Undermountain-Arc',
  'Session-01-Combat-Data','Session-04-Combat','Session-Content-Packs','Session-01-Rules-Data',
  'Campaign-Quests-Data','Campaign-Quests','Campaign-Outcomes','Campaign-Continuity',
  'Campaign-Character-Stories','Campaign-Spotlights','Campaign-Quest-Prep-Data','Campaign-Quest-Prep',
  'Campaign-Transition-Links','Campaign-Transition','Campaign-Courtyard','Campaign-Courtyard-Links',
  'Undermountain-Arc-Links','Campaign-Downtime-Data','Campaign-Downtime',
  'Campaign-Mystery-Data','Campaign-Research-Data','Campaign-Mystery',
  'Campaign-Character-Chapters-Data','Campaign-Satellites-Data','Campaign-Adventures','Campaign-Adventures-Links',
  'Campaign-Finale-Data','Campaign-Finale',
  'Campaign-Settlements','Session-01-DM-Desk','Session-01-Story-Data','Session-01-Party-Data',
  'Session-01-Combat-Run','Session-01-Map-Data','Session-01-Town-Maps','Session-01-Reliability',
  'Session-01-Presentation','Session-01-Dungeon','Session-04-Expedition',
  'Campaign-Expedition-Data','Campaign-Expeditions','Campaign-Expedition-Resume','Session-01-Table-Tools'
]) require(path.join(root,name+'.js'));
const source = fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8');
const boot = source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0, 'Stop before browser initialization and live campaign access');
vm.runInThisContext(source.slice(0,boot)+`\nglobalThis.__finaleFixture={normalize,newCustomState,context:questPrepContext,scenes:SCENES,publicState,phoneSnapshot,set:(s,i)=>{state=s;campaignIndex=i;activeCampaignId='practice-finale';}};\n})();`);
const F=__finaleFixture,A=ECHO_FINALE,P=ECHO_QUEST_PREP,C=ECHO_CONTINUITY,O=ECHO_OUTCOMES,S=ECHO_SPOTLIGHTS;
const copy=v=>JSON.parse(JSON.stringify(v)),checks=[];
async function check(name,fn){try{await fn();checks.push({name,ok:true});}catch(e){checks.push({name,ok:false,error:e.stack});}}
async function fixture(){
  const story=ECHO_STORY_DATA.normalize(),d=C.ensure(story,'practice-finale'),prep=P.ensure(story),state=F.normalize(F.newCustomState());
  const extras=ECHO_TABLE.normalize(),index={story,tableExtras:extras,rules:null,combatLibrary:[],sessions:[{id:'session-01',name:'ISOLATED FINALE REHEARSAL'}],presentation:ECHO_PRESENTATION.normalizeLibrary()};
  F.set(state,index);
  const ctx={...(await F.context('next')),story,continuity:d,prep,sessionId:'next',roster:state.tokens.filter(t=>t.team==='pc')};
  const payload=()=>JSON.stringify({tv:F.publicState(),phones:F.phoneSnapshot()});payload();
  const outcomeContext={story,markers:[]};
  const begin=(values={},target='')=>O.begin(d,{title:'Isolated actual outcome',detail:'ISOLATED PRACTICE: direct observation of a bounded result.',source:'Isolated rehearsal; not campaign play',status:'confirmed',basis:'Observed',share:'private',knows:['party'],...values},target);
  const approve=draft=>{const review=O.preview(d,draft,outcomeContext);assert.deepEqual(review.errors,[],review.errors.join(' '));return O.apply(d,draft.id,review,outcomeContext);};
  const record=values=>approve(begin(values));
  return {story,d,prep,state,extras,index,ctx,payload,begin,approve,record,outcomeContext};
}


(async()=>{
await check('Five independent approaches cover prerequisites, tradeoffs, alternatives and prepared scenes',()=>{
  const quests=['ending-shutdown','ending-persuade','ending-rescue','ending-crisis','ending-preserve'];
  assert.equal(A.approaches().length,5);assert.deepEqual(A.approaches().map(a=>a.questId).sort(),quests.sort());
  const ids=A.requirements().map(r=>r.id);assert.equal(new Set(ids).size,ids.length,'Prerequisite identities are distinct');
  for(const a of A.approaches()){
    assert(a.title&&a.summary&&a.prerequisites.length&&a.alternatives.length,a.id+' has meaningful planning material');
    assert(ECHO_QUEST_CATALOG.quests.some(q=>q.id===a.questId));
    for(const id of a.sceneIds)assert(A.scenes().some(s=>s.id===id),'Approach scene exists '+id);
  }
  for(const s of A.scenes()){
    assert(s.title&&s.read.length&&s.run.length&&s.choices.length&&s.fallback,s.id+' is playable');
    for(const qid of s.questIds||[])assert(ECHO_QUEST_CATALOG.quests.some(q=>q.id===qid),'Scene quest exists '+qid);
    if(s.sceneId)assert(F.scenes[s.sceneId],'Scene visual exists '+s.sceneId);
  }
});
await check('Plans preserve characters, approved history and display payloads; save and undo round-trip',async()=>{
  const f=await fixture(),before=copy({state:f.state,events:f.d.events,guide:f.d.questGuide,payload:f.payload()}),a=A.approaches();
  A.updatePlan(f.story,{primary:a[0].id,fallbacks:[a[1].id,a[2].id,a[0].id],notes:'PRIVATE_FINALE_PLAN',briefs:{activation:'PRIVATE_PLANNED_TRIGGER',threat:'No threat has occurred.',limits:'DM review only'}});
  assert.deepEqual(A.ensure(f.story).fallbacks,[a[1].id,a[2].id]);
  assert.deepEqual(ECHO_STORY_DATA.normalize(copy(f.story)).finale,f.story.finale);
  assert.deepEqual(copy({state:f.state,events:f.d.events,guide:f.d.questGuide,payload:f.payload()}),before);
  A.restore(f.story);assert.equal(A.ensure(f.story).primary,'');A.restore(f.story,true);assert.equal(A.ensure(f.story).primary,a[0].id);
  const loaded=ECHO_STORY_DATA.normalize(copy(f.story));assert.deepEqual(loaded.finale,f.story.finale);
  assert(!f.payload().includes('PRIVATE_FINALE'));
});
await check('Prerequisite review needs an explicit assessment, actual source and limited explanation',async()=>{
  const f=await fixture(),rid=A.requirements()[0].id;
  assert.equal(A.assess(f.story,f.d,rid).established,false);
  assert.throws(()=>A.saveReview(f.story,f.d,rid,{assessment:'supported',note:'',eventIds:[]}),/source.*explanation/);
  assert.throws(()=>A.saveReview(f.story,f.d,rid,{assessment:'supported',note:'Planned source only',eventIds:['not-an-outcome']}),/unavailable/);
  const e=f.record({knows:['party']});
  A.saveReview(f.story,f.d,rid,{assessment:'supported',note:'Only this bounded observation was tested; no scale-up guarantee.',eventIds:[e.id]});
  const result=A.assess(f.story,f.d,rid);assert.equal(result.established,true);assert.equal(result.sources[0].wholeParty,true);
  assert.equal(A.assessRoute(f.story,f.d,A.approaches()[0].id).established,1,'One supported prerequisite does not complete the route');
  assert.deepEqual(ECHO_STORY_DATA.normalize(copy(f.story)).finale,f.story.finale);
  A.restore(f.story);assert.equal(A.assess(f.story,f.d,rid).established,false);A.restore(f.story,true);assert.equal(A.assess(f.story,f.d,rid).established,true);
});
await check('Rumors, claims, inferences and DM-only truths stay separate from observed player support',async()=>{
  const f=await fixture(),rid=A.requirements()[0].id;
  for(const [basis,status,knows]of [['Claimed','confirmed',['party']],['Inferred','completed',['party']],['Open','confirmed',['party']],['Observed','rumor',['party']],['Observed','confirmed',[]]]){
    const e=f.record({basis,status,knows});A.saveReview(f.story,f.d,rid,{assessment:'supported',note:'DM opinion with unresolved limits.',eventIds:[e.id]});
    assert.equal(A.assess(f.story,f.d,rid).established,false,basis+'/'+status+'/'+knows.join(','));
  }
  const personal=f.record({basis:'Observed',status:'confirmed',knows:['pc-trista'],detail:'PRIVATE_PERSONAL_OBSERVATION'});
  A.saveReview(f.story,f.d,rid,{assessment:'supported',note:'A direct witness can support this test, without party-wide disclosure.',eventIds:[personal.id]});
  const r=A.assess(f.story,f.d,rid);assert(r.established);assert.equal(r.sources[0].wholeParty,false);assert.deepEqual(r.sources[0].knownBy,['pc-trista']);
  assert(!f.payload().includes('PRIVATE_PERSONAL_OBSERVATION'),'Personal evidence text stays private');
});
await check('Corrected, withdrawn and indirectly stale sources invalidate support until re-reviewed',async()=>{
  const f=await fixture(),rid=A.requirements()[0].id,e=f.record({detail:'ISOLATED original direct observation'});
  const review=()=>A.saveReview(f.story,f.d,rid,{assessment:'supported',note:'Observed within the stated test limit.',eventIds:[e.id]});review();
  const change=f.begin({},e.id);change.event.detail='ISOLATED corrected observation';f.approve(change);
  assert.equal(A.assess(f.story,f.d,rid).established,false);assert(A.assess(f.story,f.d,rid).issues.length);
  review();assert(A.assess(f.story,f.d,rid).established);
  O.retire(f.d,e.id);assert.equal(A.assess(f.story,f.d,rid).established,false);
  C.restore(f.d);assert(A.assess(f.story,f.d,rid).established,'Undo withdrawal restores the identical reviewed source');
  const derived=f.record({mystery:ECHO_MYSTERY.eventMeta({links:[{conclusionId:'district-interventions',relation:'context'}],citations:[ECHO_MYSTERY.citation(f.d.events.find(x=>x.id===e.id))]})});
  A.saveReview(f.story,f.d,rid,{assessment:'supported',note:'This result depends on the earlier direct reading.',eventIds:[derived.id]});assert(A.assess(f.story,f.d,rid).established);
  const revised=f.begin({},e.id);revised.event.knows=[];f.approve(revised);
  assert.equal(A.assess(f.story,f.d,rid).established,false,'Transitive source change invalidates support');
  assert(A.assess(f.story,f.d,rid).issues.some(x=>x.includes('Changed source')));
});
await check('Actual finale drafts require review and never choose an ending or complete objectives',async()=>{
  const f=await fixture(),values=A.resultDraft(A.categories()[0].id),before=f.payload(),guide=copy(f.d.questGuide);
  assert.equal(values.detail,'');assert.equal(values.share,'private');assert.deepEqual(values.knows,[]);assert.deepEqual(values.recipients,[]);assert(values.quests.every(q=>q.state==='reference'));
  const draft=O.begin(f.d,values);assert(O.preview(f.d,draft,f.outcomeContext).errors.length);assert.equal(f.d.events.length,0);assert.equal(f.payload(),before);
  Object.assign(draft.event,{detail:'PRIVATE_ACTUAL_FINALE_RESULT',source:'Isolated practice outcome; not actual campaign play',knows:['pc-trista'],recipients:['pc-trista'],publicTitle:'One private result',playerText:'OWNER_SAFE_FINALE_RESULT'});
  f.approve(draft);assert.deepEqual(f.d.questGuide,guide);assert(!JSON.stringify(F.publicState()).includes('OWNER_SAFE_FINALE_RESULT'));assert(!f.payload().includes('PRIVATE_ACTUAL_FINALE_RESULT'));
  const phones=F.phoneSnapshot();assert(phones.privateClues['pc-trista'].some(c=>c.text==='OWNER_SAFE_FINALE_RESULT'));
  for(const id of ['pc-pebble','pc-donavan','pc-ringgo','pc-aldric'])assert(!JSON.stringify(phones.privateClues[id]).includes('OWNER_SAFE_FINALE_RESULT'));
  C.restore(f.d);assert.equal(f.d.events.length,0);assert(!f.payload().includes('OWNER_SAFE_FINALE_RESULT'));
});
await check('Epilogues require current actual outcomes and keep apparatus and Halaster independently unresolved',async()=>{
  const f=await fixture(),categories=A.categories(),apparatus=categories.find(c=>/apparatus/i.test(c.id+' '+c.title)),halaster=categories.find(c=>/halaster/i.test(c.id+' '+c.title));
  assert(apparatus&&halaster&&apparatus.id!==halaster.id,'Separate epilogue subjects');
  assert(A.epilogue(f.story,f.d).every(c=>c.missing&&c.records.length===0),'No ending preselected');
  const stop=f.record({title:'Apparatus result',detail:'ISOLATED: a tested branch is disconnected, residual energy remains.',knows:['party']});
  A.linkResult(f.story,f.d,apparatus.id,[stop.id]);
  let ep=A.epilogue(f.story,f.d);assert.equal(ep.find(c=>c.id===apparatus.id).established.length,1);assert(ep.find(c=>c.id===halaster.id).missing);
  const rumor=f.record({title:'Halaster death report',detail:'ISOLATED: a witness claims Halaster died, location unconfirmed.',basis:'Claimed',status:'rumor'});
  A.linkResult(f.story,f.d,halaster.id,[rumor.id]);ep=A.epilogue(f.story,f.d);assert(ep.find(c=>c.id===halaster.id).missing);assert.equal(ep.find(c=>c.id===halaster.id).unresolved.length,1);
  const correct=f.begin({},stop.id);correct.event.detail='ISOLATED: branch was only temporarily damped, shutdown unconfirmed.';f.approve(correct);
  ep=A.epilogue(f.story,f.d);assert(ep.find(c=>c.id===apparatus.id).missing,'Correction invalidates linked prior wording');
  assert(ep.find(c=>c.id===apparatus.id).records[0].issues.length);assert.equal(f.d.events.length,2,'Generating epilogue prompts invents no events');
  A.restore(f.story);assert(A.epilogue(f.story,f.d).find(c=>c.id===halaster.id).missing);
});
await check('Prepared scenes remain private, idempotent and preserve edited notes through real storage limits',async()=>{
  const f=await fixture(),before=f.payload(),state=copy(f.state),sid='session-01';
  f.story.sessionPlans[sid]={nextBeat:'',music:'',handout:'',likelyRules:'',elsePlan:'',opening:'',notes:'Original note',order:[],extraBeats:[],beats:{}};
  for(const s of A.scenes()){assert.equal(A.stageScene(f.story,sid,s.id,[]),1);assert.equal(A.stageScene(f.story,sid,s.id,[]),0);}
  const beats=f.story.sessionPlans[sid].extraBeats;assert.equal(beats.length,A.scenes().length);
  beats[0].read=['PRIVATE_DM_CUSTOM_EDIT'];A.stageScene(f.story,sid,beats[0].id,[]);assert.deepEqual(beats[0].read,['PRIVATE_DM_CUSTOM_EDIT']);
  const loaded=ECHO_STORY_DATA.normalize(copy(f.story)).sessionPlans[sid].extraBeats;
  for(const b of beats){const r=loaded.find(x=>x.id===b.id);assert(r);assert.equal(b.scene,'');for(const key of ['read','ask','run','choices','private'])assert.deepEqual(r[key],b[key],b.id+' '+key+' retains all notes');}
  assert.deepEqual(copy(f.state),state);assert.equal(f.d.events.length,0);assert.equal(f.payload(),before);
});
await check('Finale quest preparation links resolve and keep the three-lead board private',async()=>{
  const f=await fixture(),before=f.payload();
  for(const a of A.approaches()){
    const g=P.gather(f.ctx,a.questId);assert(g);for(const id of A.beatsForQuest(a.questId))assert(f.ctx.beats.some(b=>b.id===id),id+' in session context');
    for(const lead of A.leads(a.questId))assert(g.leads.some(x=>x.id===lead.id),lead.id+' appears under quest');
  }
  for(const a of A.approaches().slice(0,3)){const lead=A.leads(a.questId)[0],entry=P.add(f.ctx,a.questId,lead.id);assert.equal(entry.beatId,lead.beatId);assert.equal(entry.sceneId,'');assert.equal(entry.theater,true);}
  const fourth=A.approaches()[3];assert.throws(()=>P.add(f.ctx,fourth.questId,A.leads(fourth.questId)[0].id),/three/);
  assert.equal(f.payload(),before);assert.equal(f.d.events.length,0);P.restore(f.prep);assert.equal(P.board(f.prep,'next').leads.length,2);
});
await check('New finale code is DM-only and published rejuvenation is explicitly retained',()=>{
  const loader=fs.readFileSync(path.join(root,'Session-01-Loader.js'),'utf8'),privateList=fs.readFileSync(path.join(root,'Campaign-Module-Manifest.js'),'utf8');
  for(const file of ['Campaign-Finale-Data.js','Campaign-Finale.js','Campaign-Finale-UI.js'])assert(privateList.includes(file));
  assert(loader.includes('if (!player) for (const file of ECHO_MODULES.ordered)'));
  const content=JSON.stringify(A.data());assert(/1d10/i.test(content));assert(/310/.test(content));assert(/rejuvenation/i.test(content));
  const story=ECHO_STORY_DATA.normalize(),d=C.ensure(story,'default');assert(d.events.some(e=>e.id==='actual-s23-stop'&&/before.*Redbrand/i.test(e.detail)));assert(!d.events.some(e=>/finale-/i.test(e.id)),'Default campaign receives no invented finale event');
});
console.log(JSON.stringify({checks,passed:checks.filter(x=>x.ok).length,total:checks.length},null,2));
if(checks.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});

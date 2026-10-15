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
  'Campaign-Settlements','Session-01-DM-Desk','Session-01-Story-Data','Session-01-Party-Data',
  'Session-01-Combat-Run','Session-01-Map-Data','Session-01-Town-Maps','Session-01-Reliability',
  'Session-01-Presentation','Session-01-Dungeon','Session-04-Expedition',
  'Campaign-Expedition-Data','Campaign-Expeditions','Campaign-Expedition-Resume','Session-01-Table-Tools'
]) require(path.join(root,name+'.js'));
const source = fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8');
const boot = source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0, 'Stop before browser initialization and live campaign access');
require('./test-support.cjs').loadTableContent();
vm.runInThisContext(source.slice(0,boot)+`\nglobalThis.__chapterFixture={normalize,newCustomState,context:questPrepContext,scenes:SCENES,publicState,phoneSnapshot,set:(s,i)=>{state=s;campaignIndex=i;activeCampaignId='practice-chapters';}};\n})();`);
const F=__chapterFixture,A=ECHO_ADVENTURES,P=ECHO_QUEST_PREP,C=ECHO_CONTINUITY,O=ECHO_OUTCOMES,S=ECHO_SPOTLIGHTS;
const copy=v=>JSON.parse(JSON.stringify(v)),checks=[];
async function check(name,fn){try{await fn();checks.push({name,ok:true});}catch(e){checks.push({name,ok:false,error:e.stack});}}
async function fixture(){
  const story=ECHO_STORY_DATA.normalize(),d=C.ensure(story,'practice-chapters'),prep=P.ensure(story),state=F.normalize(F.newCustomState());
  const extras=ECHO_TABLE.normalize(),index={story,tableExtras:extras,rules:null,combatLibrary:[],sessions:[{id:'session-01',name:'ISOLATED CHAPTER REHEARSAL'}],presentation:ECHO_PRESENTATION.normalizeLibrary()};
  F.set(state,index);
  const ctx={...(await F.context('next')),story,continuity:d,prep,sessionId:'next',roster:state.tokens.filter(t=>t.team==='pc')};
  const payload=()=>JSON.stringify({tv:F.publicState(),phones:F.phoneSnapshot()});payload();
  return {story,d,prep,state,extras,index,ctx,payload};
}

(async()=>{
await check('Five approved character chains have playable chapters linked to their existing objectives',()=>{
  const chars=['pc-trista','pc-pebble','pc-donavan','pc-ringgo','pc-aldric'];
  assert.equal(new Set(A.chapters().map(c=>c.id)).size,A.chapters().length);
  for(const id of chars){
    const chapters=A.chapters().filter(c=>c.characterId===id),quest=ECHO_QUEST_CATALOG.quests.find(q=>q.owner===id);
    assert(chapters.length>=5,id+' has at least five scoped chapters');
    for(const step of quest.steps)assert(chapters.some(c=>c.stepId===step.id),id+' objective has a chapter: '+step.id);
    for(const c of chapters){
      assert.equal(c.questId,quest.id);assert(c.id.startsWith('chapter-')&&c.id.length<=40,'Lead survives saved ID length: '+c.id);
      assert(c.summary&&c.trigger&&c.declined&&c.source&&c.limits.length,'Trigger, bounds, alternative and source: '+c.id);
      assert(c.scenes.length>=2,'Chapter contains multiple playable scenes: '+c.id);
      for(const scene of c.scenes){assert(scene.read?.length&&scene.run?.length&&scene.choices?.length,scene.id+' is playable');assert(scene.fallback,scene.id+' has an alternative');}
      assert(A.hasQuest(c.questId));assert.equal(A.resolveLead(c.id),c);
    }
  }
});
await check('Eight satellites are optional scopes and only the next custom site is fully prepared',()=>{
  assert.equal(A.sites().length,8);assert.equal(new Set(A.sites().map(s=>s.id)).size,8);
  assert.equal(A.site('wave-echo').scope,'existing');assert.equal(A.site('silent-library').scope,'full');
  for(const s of A.sites()){
    assert(ECHO_QUEST_CATALOG.quests.some(q=>q.id===s.questId),s.id+' quest exists');
    assert(A.siteRecordIds[s.id],s.id+' links existing site record');
    assert(s.summary&&s.conflict&&s.declined&&s.travel?.access&&s.source,s.id+' has people, local conflict and access');
    assert.equal(A.opportunities(s).length,5,s.id+' invites all five without requiring them');
    if(!['wave-echo','silent-library'].includes(s.id))assert.equal(s.scope,'outline',s.id+' stays a later outline');
  }
  const pack=A.pack();assert.equal(pack.id,'silent-library-expedition');assert(pack.beats.length>=6);
  assert.equal(ECHO_CONTENT_PACKS.filter(p=>p.id===pack.id).length,1,'Pack registered once');
  for(const scene of pack.scenes){assert(F.scenes[scene],scene+' exists');if(F.scenes[scene].image)assert(fs.existsSync(path.join(root,F.scenes[scene].image)),scene+' image file exists');}
  assert.equal(F.scenes['sl-library-map'].fog,true,'New library map begins covered');
  assert.equal(pack.encounters.length,0,'No enemy encounter is silently spawned for a social investigation');
});
await check('Every new beat, quest lead, scene and mystery reference resolves without inventing facts',async()=>{
  const f=await fixture(),beats=A.beats(),ids=beats.map(b=>b.id),mysteries=new Set(ECHO_MYSTERY.conclusions().map(c=>c.id));
  assert.equal(new Set(ids).size,ids.length,'Unique scene IDs');
  for(const b of beats){assert(b.id.length<=80&&b.title.length<=100,b.id+' fits saved identity');if(b.scene)assert(F.scenes[b.scene],b.id+' scene exists');assert(b.read.length&&b.run.length,b.id+' narration and instructions');}
  for(const item of [...A.chapters(),...A.sites()])for(const id of item.connections?.mystery||[])assert(mysteries.has(id),item.id+' mystery: '+id);
  for(const qid of new Set([...A.chapters(),...A.sites()].map(i=>i.questId))){
    const g=P.gather(f.ctx,qid);assert(g);assert.deepEqual(g.missing,[],qid+' has no missing preparation');
    for(const lead of A.leads(qid)){assert(lead.id.length<=40);assert(g.leads.some(l=>l.id===lead.id));if(lead.beatId)assert(f.ctx.beats.some(b=>b.id===lead.beatId));}
  }
  assert.equal(f.d.events.length,0,'Isolated campaign gained no actual history');
});
await check('Selected chapter leads keep the right scene and remain private with board limits and undo',async()=>{
  const f=await fixture(),before=f.payload(),state=JSON.stringify(f.state),guide=JSON.stringify(f.d.questGuide);
  const chosen=A.chapters()[0],second=A.chapters().find(c=>c.characterId!==chosen.characterId),site=A.site('silent-library');
  for(const item of [chosen,second,site]){
    const row=A.addToBoard(f.ctx,item.id),lead=A.leads(item.questId).find(l=>l.id===row.leadId);
    assert.equal(row.beatId,lead.beatId,'Uses the selected chapter opening');assert.equal(row.sceneId,lead.sceneId);assert.equal(row.nextAction,lead.nextAction.slice(0,1200));
    assert(!P.readiness(f.ctx,row).ready,'DM review required');
  }
  assert.throws(()=>A.addToBoard(f.ctx,chosen.id),/already/);assert.throws(()=>A.addToBoard(f.ctx,A.chapters().find(c=>c.id!==chosen.id&&c.id!==second.id).id),/three/);
  assert.equal(f.d.events.length,0);assert.equal(JSON.stringify(f.d.questGuide),guide);assert.equal(JSON.stringify(f.state),state);assert.equal(f.payload(),before);
  assert.equal(P.board(f.prep,'next').leads.length,3);P.restore(f.prep);assert.equal(P.board(f.prep,'next').leads.length,2);P.restore(f.prep,true);assert.equal(P.board(f.prep,'next').leads.length,3);
  assert.deepEqual(ECHO_STORY_DATA.normalize(copy(f.story)).questPrep,f.prep,'Board survives save/restore');
});
await check('Prepared library rooms start hidden, preserve edits and remain a plan after save/restore',async()=>{
  const f=await fixture(),before=f.payload(),rooms=A.seedLibrary(f.extras);
  assert.equal(rooms.objects.length,7);assert.equal(rooms.connections.length,3);
  for(const o of rooms.objects){assert.equal(o.visible,false);assert.equal(o.visibility,'private');}
  assert(rooms.objects.filter(o=>o.kind==='room').every(o=>o.state==='unexplored'));
  assert.equal(rooms.objects.find(o=>o.id==='sl-folio').state,'unsearched');
  rooms.objects.find(o=>o.id==='sl-room-2').state='cleared';rooms.objects.find(o=>o.id==='sl-room-2').note='PRIVATE_ROOM_NOTE';
  rooms.memory=['1,2'];rooms.concealed=['2,3'];const saved=copy(rooms);A.seedLibrary(f.extras);assert.deepEqual(rooms,saved,'Repeated preparation preserves every recorded room and fog value');
  const ctx={state:f.state,extras:f.extras,story:f.story,continuity:f.d,sessionId:'session-01'};
  const record=ECHO_EXPEDITIONS.create(ctx,'Isolated library plan',['sl-library-map']);assert.equal(record.phase,'prepared');assert.equal(record.baseline,null);assert.equal(record.retreat,null);
  const loaded=ECHO_TABLE.normalize(copy(f.extras));assert.deepEqual(loaded.dungeon.scenes['sl-library-map'],rooms);assert.equal(loaded.expeditions.records[0].phase,'prepared');
  assert.equal(f.d.events.length,0);assert.equal(f.payload(),before,'Hidden room records and plans stay out of player payloads');
});
await check('Party-copy packs preserve chosen low levels and spent resources through reload and derived sessions',async()=>{
  const f=await fixture();
  for(const packId of ['waterdeep-undermountain-1','phandalin-waterdeep-transition','mending-court-home','silent-library-expedition']){
    const raw=copy(f.state);raw.contentPackId=packId;delete raw.preservePartyProgression;
    for(const token of raw.tokens.filter(t=>t.team==='pc')){const sheet=raw.party[token.id];sheet.level=2;sheet.className='Private chosen level-two build';token.hp=sheet.hp=5;token.maxHp=sheet.maxHp=17;token.tempHp=sheet.tempHp=3;if(sheet.resources[0])sheet.resources[0].current=0;}
    const expected=copy(raw.party),loaded=F.normalize(raw,packId);assert.equal(loaded.preservePartyProgression,true);assert.deepEqual(loaded.party,expected,packId+' retains the current party without a forced level-up');
    const twice=F.normalize(copy(loaded),packId);assert.deepEqual(twice.party,expected,packId+' preservation survives a second reload');
    const next=F.newCustomState(loaded);assert.equal(next.preservePartyProgression,true);assert.deepEqual(next.party,expected,packId+' derived session retains levels, HP, temporary HP and resources');
    for(const token of next.tokens.filter(t=>t.team==='pc')){assert.equal(token.hp,5);assert.equal(token.maxHp,17);assert.equal(token.tempHp,3);}
  }
});
await check('Adding live scene notes is idempotent and preserves private detail through save/restore',async()=>{
  const f=await fixture(),id='session-01',chap=A.chapters()[0],ids=chap.scenes.map(s=>s.id),before=f.payload();
  f.story.sessionPlans[id]={nextBeat:'',music:'',handout:'',likelyRules:'',elsePlan:'',opening:'',notes:'Existing private preparation',order:[],extraBeats:[{id:'local-note',title:'My scene',scene:'cover',encounter:'',read:['Keep this original'],ask:[],run:[],choices:[],private:[]}],beats:{}};
  assert.equal(A.stageNotes(f.story,id,ids,['cover']),ids.length);assert.equal(A.stageNotes(f.story,id,ids,['cover']),0);
  const staged=f.story.sessionPlans[id].extraBeats;assert.equal(staged[0].read[0],'Keep this original');
  for(const b of staged.slice(1)){assert.equal(b.scene,'','Unavailable map does not become a live reveal');for(const field of ['read','ask','run','choices','private']){assert(b[field].length<=12,b.id+' '+field+' storage cap');for(const t of b[field])assert(t.length<=1200,b.id+' '+field+' text cap');}}
  const loaded=ECHO_STORY_DATA.normalize(copy(f.story));
  for(const b of staged){const after=loaded.sessionPlans[id].extraBeats.find(x=>x.id===b.id);for(const field of ['read','ask','run','choices','private'])assert.deepEqual(after[field],b[field],b.id+' '+field+' is not truncated');}
  assert.equal(f.payload(),before,'Live notes remain DM-only');
});
await check('All chapter and library scene notes survive their actual storage limits',async()=>{
  for(const item of [...A.chapters(),A.site('silent-library')]){
    const f=await fixture(),ids=(item.scenes||item.beats).map(b=>b.id);A.stageNotes(f.story,'session-01',ids,Object.keys(F.scenes));
    const before=f.story.sessionPlans['session-01'].extraBeats,after=ECHO_STORY_DATA.normalize(copy(f.story)).sessionPlans['session-01'].extraBeats;
    for(const b of before){const loaded=after.find(x=>x.id===b.id);for(const field of ['read','ask','run','choices','private'])assert.deepEqual(loaded[field],b[field],b.id+' '+field+' retains full text');}
  }
  const f=await fixture(),pack=A.pack(),saved=copy(f.state);
  Object.assign(saved,{contentPackId:pack.id,runbookBeats:copy(pack.runbook),scene:pack.firstScene,runbook:pack.beats[0],scenes:pack.scenes.map(id=>({id,...copy(F.scenes[id])}))});
  const loaded=F.normalize(saved,pack.id);
  for(const b of pack.runbook){const after=loaded.runbookBeats.find(x=>x.id===b.id);assert(after,b.id+' remains in saved pack');for(const field of ['read','ask','run','choices','private'])assert.deepEqual(after[field],b[field],b.id+' compiled pack '+field+' retains full text');}
});
await check('Spotlights count actual moments, respect absence and pause, and support corrections and undo',async()=>{
  const f=await fixture(),s=A.site('silent-library'),d=S.ensure(f.story),id='session-01',owner='pc-trista',before=f.payload();
  assert.equal(d.log.length,0);A.balance(f.story,id,f.ctx.roster,s);assert.equal(d.log.length,0,'Reading suggestions records nothing');
  A.recordSpotlight(f.story,id,'Practice',s,owner,'offered','Invitation only');assert.equal(S.summary(d,id,f.ctx.roster).find(x=>x.id===owner).played,0);
  assert.throws(()=>A.recordSpotlight(f.story,id,'Practice',s,owner,'played',''),/actually did/);
  A.recordSpotlight(f.story,id,'Practice',s,owner,'played','Player declined the copy and chose a custodian.',8);assert.equal(S.summary(d,id,f.ctx.roster).find(x=>x.id===owner).played,1);
  assert.throws(()=>A.recordSpotlight(f.story,id,'Practice',s,owner,'declined',''),/Correct/);
  S.restore(d);assert.equal(d.log[0].status,'offered');S.restore(d,true);assert.equal(d.log[0].status,'played');
  S.profile(d,'pc-pebble').paused=true;d.attendance[id]=['pc-donavan'];const balance=A.balance(f.story,id,f.ctx.roster,s);
  assert(balance.find(x=>x.characterId==='pc-pebble').paused);assert.equal(balance.find(x=>x.characterId==='pc-donavan').present,false);
  assert(balance.findIndex(x=>x.characterId==='pc-pebble')>balance.findIndex(x=>x.characterId==='pc-ringgo'),'Paused invitation is deprioritized');
  assert.equal(f.d.events.length,0,'Played tracker notes do not auto-approve outcomes');assert.equal(f.payload(),before);
  assert.deepEqual(ECHO_STORY_DATA.normalize(copy(f.story)).characterStories,d);
});
await check('Actual discoveries require review, preserve quest objectives and publish only selected wording',async()=>{
  const f=await fixture(),chapter=A.chapters().find(c=>c.characterId==='pc-trista'),values=A.outcome(chapter,chapter.scenes[0]),guide=JSON.stringify(f.d.questGuide),ctx={story:f.story,markers:[]};
  assert.equal(values.share,'private');assert.deepEqual(values.knows,[]);assert.deepEqual(values.recipients,[]);assert(values.quests.every(q=>q.state==='reference'));assert.equal(values.detail,'');
  const draft=O.begin(f.d,values);assert(O.preview(f.d,draft,ctx).errors.length,'A prepared scene cannot be approved as an actual discovery without a result');
  Object.assign(draft.event,{detail:'PRIVATE_CHAPTER_RESULT_SENTINEL',source:'ISOLATED REHEARSAL witness; not real campaign play',publicTitle:'A private invitation',playerText:'TRISTA_REVIEWED_OWNER_TEXT',knows:['pc-trista'],recipients:['pc-trista']});
  const preview=O.preview(f.d,draft,ctx);assert.deepEqual(preview.errors,[]);O.apply(f.d,draft.id,preview,ctx);
  assert.equal(JSON.stringify(f.d.questGuide),guide,'Reference links do not complete or activate objectives');
  assert(!JSON.stringify(F.publicState()).includes('TRISTA_REVIEWED_OWNER_TEXT'));assert(!f.payload().includes('PRIVATE_CHAPTER_RESULT_SENTINEL'));
  const phones=F.phoneSnapshot();assert(phones.privateClues['pc-trista'].some(c=>c.text==='TRISTA_REVIEWED_OWNER_TEXT'));
  for(const id of ['pc-pebble','pc-donavan','pc-ringgo','pc-aldric'])assert(!JSON.stringify(phones.privateClues[id]).includes('TRISTA_REVIEWED_OWNER_TEXT'));
  C.restore(f.d);assert.equal(f.d.events.length,0);assert(!f.payload().includes('TRISTA_REVIEWED_OWNER_TEXT'));
});
await check('New custom content is loaded only on the DM side',async()=>{
  const loader=fs.readFileSync(path.join(root,'Session-01-Loader.js'),'utf8');
  const declaration=fs.readFileSync(path.join(root,'Campaign-Module-Manifest.js'),'utf8');
  for(const file of ['Campaign-Character-Chapters-Data.js','Campaign-Satellites-Data.js','Campaign-Adventures.js','Campaign-Adventures-UI.js','Campaign-Adventures-Links.js'])assert(declaration.includes(file),file+' is private');
  await require('./test-support.cjs').assertPrivateModules(['Campaign-Character-Chapters-Data.js','Campaign-Satellites-Data.js','Campaign-Adventures.js','Campaign-Adventures-UI.js','Campaign-Adventures-Links.js']);
  const blank=await require('./test-support.cjs').loadedScripts(false,false,'blank');
  for(const file of ['Campaign-Character-Chapters-Data.js','Campaign-Satellites-Data.js','Campaign-Adventures.js'])assert(!blank.includes(file));
});
console.log(JSON.stringify({checks,passed:checks.filter(x=>x.ok).length,total:checks.length},null,2));
if(checks.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});

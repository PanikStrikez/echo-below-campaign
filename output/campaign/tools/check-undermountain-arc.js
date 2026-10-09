/* Isolated arc/content rehearsal. No live browser storage or campaign save is opened. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
global.window = global;
global.location = {hash:'', protocol:'file:'};
for (const name of [
  'LMOP-Visual-Catalog','LMOP-Battle-Map-Catalog','Waterdeep-Expedition-Data','Waterdeep-Expedition',
  'Session-01-Runbook','Session-02-Runbook','Session-03-Runbook','Session-03-Thundertree-Runbook',
  'Session-04-Runbook','Campaign-Transition-Data','Campaign-Courtyard-Data',
  'Undermountain-Arc-Data','Undermountain-Arc-Cast','Undermountain-Arc',
  'Session-01-Combat-Data','Session-04-Combat','Session-Content-Packs','Session-01-Rules-Data',
  'Campaign-Quests-Data','Campaign-Quests','Campaign-Outcomes','Campaign-Continuity',
  'Campaign-Character-Stories','Campaign-Spotlights','Campaign-Quest-Prep-Data','Campaign-Quest-Prep',
  'Campaign-Transition-Links','Campaign-Transition','Campaign-Courtyard','Campaign-Courtyard-Links',
  'Undermountain-Arc-Links','Session-01-Story-Data','Session-01-Party-Data','Session-01-Combat-Run',
  'Session-01-Map-Data','Session-01-Town-Maps','Session-01-Reliability','Session-01-Presentation',
  'Session-01-Dungeon','Session-04-Expedition','Campaign-Expedition-Data','Campaign-Expeditions',
  'Campaign-Expedition-Resume','Session-01-Table-Tools'
]) require(path.join(root, name+'.js'));
const A=ECHO_UNDERMOUNTAIN_ARC, P=ECHO_QUEST_PREP, Q=ECHO_QUESTS, X=ECHO_EXPEDITIONS;
const copy=value=>JSON.parse(JSON.stringify(value)), checks=[];
async function check(name,fn){try{await fn();checks.push({name,ok:true});}catch(error){checks.push({name,ok:false,error:error.stack.slice(0,3000)});}}
const battleboard=fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8');
const boot=battleboard.lastIndexOf('  if (IS_PLAYER) initPlayer();');assert(boot>0);
vm.runInThisContext(battleboard.slice(0,boot)+`\nglobalThis.__arcTest={normalize,newState,newCustomState,context:questPrepContext,scenes:SCENES,set:(s,i)=>{state=s;campaignIndex=i;},publicState,phoneSnapshot};\n})();`);
const F=__arcTest;
function fixture(){
  const story=ECHO_STORY_DATA.normalize(),continuity=ECHO_CONTINUITY.ensure(story,'practice-arc'),prep=P.ensure(story);
  const state=F.normalize(F.newCustomState());
  const extras=ECHO_TABLE.normalize();extras.settlements ||= {minutes:0};
  const index={story,presentation:ECHO_PRESENTATION.normalizeLibrary(),tableExtras:extras,rules:null,sessions:[{id:'session-01',name:'ISOLATED ARC REHEARSAL',packId:'waterdeep-undermountain-1'}],combatLibrary:[]};
  F.set(state,index);return {story,continuity,prep,state,extras,index};
}
async function prepFixture(){const f=fixture(),catalog=await F.context('next');return {...f,ctx:{...catalog,story:f.story,continuity:f.continuity,prep:f.prep,sessionId:'next',roster:f.state.tokens.filter(t=>t.team==='pc')}};}
function source(ref,label){assert.equal(typeof ref,'object',label+' has a structured source');if(ref.book==='custom'){assert(ref.label&&ref.note,label+' custom source is labeled');return;}assert(ECHO_RULES_DATA.books[ref.book],label+' book exists: '+ref.book);assert(Number.isInteger(ref.page)&&ref.page>0&&ref.page<=ECHO_RULES_DATA.books[ref.book].pages,label+' page is within the local book');}

(async()=>{
await check('Three bounded contracts reference existing quests, rooms and scenes',()=>{
  assert.deepEqual(A.packages().map(p=>p.id),['map','instrument','passage']);
  assert.deepEqual(A.packages().map(p=>p.questId),['route','instrument','passage']);
  const roomIds=new Set(ECHO_WATERDEEP_DATA.rooms.map(r=>r.id));
  const questIds=new Set(ECHO_QUEST_CATALOG.quests.map(q=>q.id));
  for(const p of A.packages()){
    assert.equal(A.get(p.id),p);assert(questIds.has(p.questId));
    assert(p.contract.scope&&p.prerequisites.length&&p.route.rooms.length&&p.beats.length);
    for(const room of p.route.rooms){const id=typeof room==='string'?room:room.id;assert(roomIds.has(id),p.id+' references an existing keyed room '+id);}
    for(const b of p.beats)assert(F.scenes[b.scene],b.id+' visual exists');
  }
  assert.equal(A.get('not-an-expedition'),undefined);
});
await check('Arc beats fit persistence limits and retain book/creature reference anchors',()=>{
  const beats=A.beats(),ids=beats.map(b=>b.id),base=ECHO_EXPEDITION.runbook();
  assert(beats.length>=9,'Each contract has usable scenes');assert.equal(new Set(ids).size,ids.length,'No beat ID is reused');
  assert.equal(new Set([...base.map(b=>b.id),...ids]).size,base.length+ids.length,'No published room or arrival beat is replaced');
  assert(base.length+beats.length<=150,'Runbook fits current saved-beat cap');
  for(const b of beats){
    assert(b.id.length<=80&&b.title.length<=100&&b.scene.length<=80,'Beat identity fits normalization: '+b.id);
    for(const key of ['read','readAfter','ask','run','choices','private']){
      assert(Array.isArray(b[key]||[]),b.id+' '+key+' is an array');assert((b[key]||[]).length<=20,b.id+' '+key+' list fits');
      for(const text of b[key]||[])assert(typeof text==='string'&&text.length<=1200,b.id+' '+key+' text survives save');
    }
    assert((b.tv||'').length<=1200);assert(b.read?.length&&b.run?.length&&(b.choices?.length||b.ask?.length),'Playable opening, instructions and decisions: '+b.id);
    assert(!(b.private||[]).some(t=>t.includes('printed p. undefined')),'Custom sources have no invented page: '+b.id);
    for(const s of b.sources||[])if(typeof s==='object')source(s,b.id);
    for(const c of b.creatures||[])source(c,b.id+' '+c.name);
  }
  const used=[...new Set(A.packages().flatMap(p=>p.route.rooms.map(r=>typeof r==='string'?r:r.id)))];
  for(const id of used){const room=ECHO_WATERDEEP_DATA.rooms.find(r=>r.id===id);source({book:'madMage',page:room.page},id);for(const c of room.creatures)source(c,id+' '+c.name);}
});
await check('Rival and return preparation has explicit limits and owner-only personal drafts',()=>{
  const cast=ECHO_UNDERMOUNTAIN_ARC_CAST;
  assert.deepEqual(cast.rivals.map(n=>n.id),['kestrel','pell','nym']);assert.equal(cast.returns.length,3);
  for(const n of cast.rivals){assert(n.goal&&n.knowledge.length&&n.limits.length&&n.offers.length);for(const offer of n.offers)assert(A.get(offer.arc)&&offer.terms&&offer.decline);}
  for(const r of cast.returns){assert(A.get(r.arc));assert.equal(r.status,'future-preparation');assert(r.trigger&&r.alternatives.length&&r.outcomes.length);}
  assert.equal(new Set(cast.handouts.map(h=>h.id)).size,cast.handouts.length);
  for(const h of cast.handouts){assert.equal(h.status,'draft');assert(A.get(h.arc));assert(h.body&&h.publishWhen);assert(['shared','owner'].includes(h.audience));if(h.audience==='owner')assert(/^pc-/.test(h.owner));else assert.equal(h.owner,'');}
  assert.equal(cast.handouts.find(h=>h.id==='arc-mara-invitation').owner,'pc-trista');
  assert.equal(cast.handouts.find(h=>h.id==='arc-dianna-reply').owner,'pc-donavan');
});
await check('Runbook extension is idempotent and preserves existing edits',()=>{
  const old=copy(ECHO_EXPEDITION.runbook()),arc=copy(A.beats()[0]);
  arc.read=['PRIVATE_EDITED_ARC_OPENING'];arc.run=['DM-edited instructions retained'];
  const base=[...old,arc,{id:'my-custom-beat',title:'Private inserted scene',scene:'cover',read:['My scene']}],before=copy(base);
  const extended=A.extendRunbook(base),again=A.extendRunbook(extended);
  assert.deepEqual(base,before,'Input is unchanged');assert.deepEqual(again,extended,'Repeated upgrade appends nothing');
  assert.equal(extended.filter(b=>b.id===arc.id).length,1);assert.deepEqual(extended.find(b=>b.id===arc.id),arc);
  assert.deepEqual(extended.find(b=>b.id==='my-custom-beat'),base.at(-1));assert.deepEqual(extended.slice(0,base.length),base);
});
await check('Opening an older Waterdeep save adds guidance without resetting its dungeon or party',()=>{
  const pack=ECHO_CONTENT_PACKS.find(p=>p.id==='waterdeep-undermountain-1'),base=F.newState(),old=F.newCustomState(base);
  Object.assign(old,{contentPackId:pack.id,runbookBeats:copy(ECHO_EXPEDITION.runbook()),scene:'um1-table',runbook:'um1-6'});
  old.scenes=pack.scenes.map(id=>({id,...copy(F.scenes[id])}));
  old.scenes.find(s=>s.id==='um1-table').fog=true;
  old.runbookBeats.find(b=>b.id==='um1-6').run=['MY_EXISTING_ROOM_NOTE'];
  const pc=old.tokens.find(t=>t.team==='pc'),foe=copy(base.tokens.find(t=>t.team==='enemy'));
  assert(pc&&foe,'Fixture contains real saved actors');
  pc.hp=3;pc.tempHp=2;pc.scene='um1-table';pc.placed=true;pc.x=14;pc.y=27;
  old.party[pc.id].hp=3;old.party[pc.id].tempHp=2;
  Object.assign(foe,{hp:0,placed:true,scene:'um1-table',visible:false,x:72,y:31});old.tokens.push(foe);
  old.sceneFog['um1-table']=['1,1','1,2'];
  old.map.scenes['um1-table']=ECHO_MAP_DATA.scene({fineFog:true,lines:[{id:'saved-door',kind:'door',x1:20,y1:20,x2:30,y2:20,open:true,discovered:true}]});
  const restored=F.normalize(copy(old)),again=F.normalize(copy(restored));
  for(const b of A.beats())assert(restored.runbookBeats.some(x=>x.id===b.id),'Older save receives '+b.id);
  assert.deepEqual(restored.runbookBeats.find(b=>b.id==='um1-6').run,['MY_EXISTING_ROOM_NOTE']);
  const playable=rows=>rows.map(b=>({id:b.id,title:b.title,scene:b.scene,encounter:b.encounter||'',read:b.read||[],readAfter:b.readAfter||[],run:b.run||[],ask:b.ask||[],choices:b.choices||[],private:b.private||[],tv:b.tv||''}));
  assert.deepEqual(playable(again.runbookBeats),playable(restored.runbookBeats),'Reopening preserves all playable guidance without duplication');
  assert.equal(restored.tokens.find(t=>t.id===foe.id).hp,0);assert.equal(restored.tokens.find(t=>t.id===foe.id).x,72);
  assert.equal(restored.party[pc.id].hp,3);assert.equal(restored.party[pc.id].tempHp,2);assert.equal(restored.tokens.find(t=>t.id===pc.id).x,14);
  assert.deepEqual(restored.sceneFog['um1-table'],old.sceneFog['um1-table']);
  assert.equal(restored.map.scenes['um1-table'].lines.find(l=>l.id==='saved-door').open,true);
  assert.equal(restored.runbook,'um1-6');assert.equal(restored.scene,'um1-table');
});
await check('Quest preparation stages three contracts without changing outcomes, actors or publication',async()=>{
  const f=await prepFixture(),snapshot=JSON.stringify({state:f.state,events:f.continuity.events,guide:f.continuity.questGuide,tv:F.publicState(),phones:F.phoneSnapshot(),extras:f.extras});
  for(const p of A.packages()){
    const g=P.gather(f.ctx,p.questId);assert(g,'Quest gathers');assert(g.beats.some(b=>b.id===p.beats[0].id),'Quest links the contract opening');assert.equal(g.missing.length,0,'All linked resources available: '+p.id);
    const entry=A.addToBoard(f.ctx,p.id);assert.equal(entry.questId,p.questId);assert.equal(entry.beatId,p.beats[0].id);assert.equal(entry.sceneId,p.beats[0].scene);
    assert(entry.nextAction&&entry.notes.includes('Future preparation'));assert.equal(entry.reviewed,'');
  }
  assert.equal(P.board(f.prep,'next').leads.length,3);assert.throws(()=>A.addToBoard(f.ctx,'map'),/already|three/);
  assert.equal(JSON.stringify({state:f.state,events:f.continuity.events,guide:f.continuity.questGuide,tv:F.publicState(),phones:F.phoneSnapshot(),extras:f.extras}),snapshot,'Private board changes no canonical or player state');
  assert.deepEqual(ECHO_STORY_DATA.normalize(copy(f.story)).questPrep,f.prep,'Board survives normal save');
  assert.throws(()=>A.addToBoard(f.ctx,'invalid'),/Choose/);
});
await check('Responses create evidence-free, unapplied proposals and cannot update dungeon state',()=>{
  const f=fixture(),ctx={...f,sessionId:'session-01'},r=X.create(ctx,'Isolated first floor',['um1-table']);
  const native=ECHO_EXPEDITION.room(f.extras.expedition,'um1-6');native.status='cleared';native.survivors='One named survivor; no new enemies';
  const before=copy({state:f.state,dungeon:f.extras.dungeon,expedition:f.extras.expedition,events:f.continuity.events});
  for(const arc of A.packages()){
    assert(arc.responses.length,'Consequences have response plans');
    for(let i=0;i<arc.responses.length;i++){
      const p=A.proposal(ctx,r,arc.id,i);assert.equal(p.status,'proposed');assert.equal(p.evidence,'');assert.deepEqual(p.evidenceIds,[]);assert.deepEqual(p.changes,[]);
      const review=X.preview(ctx,r,p);assert(review.errors.some(e=>/evidence/i.test(e)),'Template text is not factual evidence');
      assert.throws(()=>X.apply(ctx,r,p,review),/evidence/i);
    }
  }
  assert.deepEqual(copy({state:f.state,dungeon:f.extras.dungeon,expedition:f.extras.expedition,events:f.continuity.events}),before,'Preparing responses preserves all canonical records');
  assert.throws(()=>A.proposal(ctx,r,'unknown',0),/Choose/);
});
await check('Private arc plans stay off TV and phones; existing quest audiences remain enforced',async()=>{
  const f=await prepFixture();f.continuity.questGuide.enabled=true;
  const main=Q.record(f.continuity.questGuide,'echo-below');main.draft={title:'Shared main objective',text:'MAIN_TV_APPROVED'};Q.publication(f.continuity,'echo-below','party');
  const side=Q.record(f.continuity.questGuide,'route');side.draft={title:'Our survey',text:'SIDE_PHONE_APPROVED'};Q.publication(f.continuity,'route','party');
  const owned=Q.record(f.continuity.questGuide,'character-trista');owned.draft={title:'A personal question',text:'TRISTA_OWNER_APPROVED'};Q.publication(f.continuity,'character-trista','pc-trista');
  assert.throws(()=>Q.publication(f.continuity,'character-trista','party'),/owner/);assert.throws(()=>Q.publication(f.continuity,'route','pc-trista'),/phones/);
  const entry=A.addToBoard(f.ctx,'map');entry.notes+=' PRIVATE_ARC_BOARD_SENTINEL';
  f.state.runbookBeats.push({id:'private-arc-rehearsal',title:'PRIVATE_ARC_TITLE_SENTINEL',scene:'cover',read:['PRIVATE_ARC_READ_SENTINEL'],private:['PRIVATE_ARC_DM_SENTINEL']});
  const r=X.create({...f,sessionId:'session-01'},'PRIVATE_ARC_RECORD_SENTINEL',['um1-table']);r.objective='PRIVATE_ARC_OBJECTIVE_SENTINEL';
  const p=A.proposal({...f,sessionId:'session-01'},r,'map',0);p.reason+=' PRIVATE_ARC_RESPONSE_SENTINEL';
  const tv=F.publicState(),phones=F.phoneSnapshot();assert(!JSON.stringify(tv).includes('PRIVATE_ARC_'));assert(!JSON.stringify(phones).includes('PRIVATE_ARC_'));
  assert.equal(tv.mainQuest.text,'MAIN_TV_APPROVED');assert(!JSON.stringify(tv).includes('SIDE_PHONE_APPROVED'));assert(!JSON.stringify(tv).includes('TRISTA_OWNER_APPROVED'));
  assert(phones.continuity.quests.some(q=>q.goal==='SIDE_PHONE_APPROVED'));assert(!phones.continuity.quests.some(q=>q.goal==='MAIN_TV_APPROVED'));
  assert(phones.privateClues['pc-trista'].some(c=>c.text.includes('TRISTA_OWNER_APPROVED')));
  for(const [id,clues]of Object.entries(phones.privateClues))if(id!=='pc-trista')assert(!JSON.stringify(clues).includes('TRISTA_OWNER_APPROVED'));
  const loader=fs.readFileSync(path.join(root,'Session-01-Loader.js'),'utf8');
  const manifest=fs.readFileSync(path.join(root,'Campaign-Module-Manifest.js'),'utf8');
  for(const file of ['Undermountain-Arc-Data.js','Undermountain-Arc-Cast.js','Undermountain-Arc.js','Undermountain-Arc-Links.js'])assert(manifest.includes(file),file+' is in the DM-only manifest');
  assert.match(loader,/if \(!player\) \{ await load\('Campaign-Module-Manifest.js'\)/);
  assert.match(loader,/if \(!player\) for \(const file of ECHO_MODULES\.ordered\)/);
});
await check('Staging a shared contract changes only its undoable draft until deliberate publication',()=>{
  const f=fixture();f.continuity.questGuide.enabled=true;
  const main=Q.record(f.continuity.questGuide,'echo-below');main.draft={title:'Current main objective',text:'RETAIN_THIS_TV_OBJECTIVE'};Q.publication(f.continuity,'echo-below','party');
  const r=Q.record(f.continuity.questGuide,'route');r.status='active';r.draft={title:'Current reviewed survey',text:'RETAIN_THIS_PHONE_BRIEF'};Q.publication(f.continuity,'route','party');
  const before=copy({events:f.continuity.events,status:r.status,published:r.published,draft:r.draft,tv:F.publicState(),phones:F.phoneSnapshot()});
  const undoCount=f.continuity.undo.length,handout=ECHO_UNDERMOUNTAIN_ARC_CAST.handouts.find(h=>h.id==='arc-map-brief');
  assert.equal(A.stageBrief(f.continuity,handout.id),'route');
  assert.deepEqual(r.draft,{title:handout.title.slice(0,120),text:handout.body.slice(0,2400)});
  assert.equal(f.continuity.undo.length,Math.min(10,undoCount+1),'Staging creates a continuity undo checkpoint');
  assert.deepEqual(copy({events:f.continuity.events,status:r.status,published:r.published,tv:F.publicState(),phones:F.phoneSnapshot()}),
    {events:before.events,status:before.status,published:before.published,tv:before.tv,phones:before.phones},'Draft never changes actual play, status or either player display');
  const staged=JSON.stringify(f.continuity);
  for(const id of ['arc-mara-invitation','arc-dianna-reply','arc-gilded-exchange','unknown'])assert.throws(()=>A.stageBrief(f.continuity,id),/shared contract brief/);
  assert.equal(JSON.stringify(f.continuity),staged,'Rejected owner-only or non-contract draft does not change history');
  assert(ECHO_CONTINUITY.restore(f.continuity));assert.deepEqual(Q.record(f.continuity.questGuide,'route').draft,before.draft,'Undo restores the prior draft');
  A.stageBrief(f.continuity,handout.id);Q.publication(f.continuity,'route','party');
  assert(F.phoneSnapshot().continuity.quests.some(q=>q.id==='guide-route'&&q.goal===handout.body.slice(0,2400)),'Explicit publication updates the shared-phone side quest');
  assert.equal(F.publicState().mainQuest.text,'RETAIN_THIS_TV_OBJECTIVE');assert.deepEqual(f.continuity.events,before.events,'Publication adds no actual event');
});
for(const c of checks)console.log(`${c.ok?'PASS':'FAIL'} ${c.name}${c.ok?'':'\n'+c.error}`);
if(checks.some(c=>!c.ok))process.exitCode=1;
else console.log(`PASS ${checks.length} isolated Undermountain arc checks; no live campaign data accessed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

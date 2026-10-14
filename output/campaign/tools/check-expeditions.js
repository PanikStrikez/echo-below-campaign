/* Isolated in-memory expedition rehearsal. Never reads or writes campaign saves. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
global.window = global;
global.location = { hash:'', protocol:'file:' };
for (const name of [
  'LMOP-Visual-Catalog','LMOP-Battle-Map-Catalog','Waterdeep-Expedition-Data',
  'Waterdeep-Expedition','Session-01-Runbook','Session-02-Runbook','Session-03-Runbook',
  'Session-03-Thundertree-Runbook','Session-04-Runbook','Campaign-Transition-Data',
  'Campaign-Courtyard-Data','Session-01-Combat-Data','Session-04-Combat',
  'Session-Content-Packs','Session-01-Rules-Data','Campaign-Quests-Data','Campaign-Quests',
  'Campaign-Outcomes','Campaign-Continuity','Campaign-Character-Stories','Campaign-Spotlights',
  'Campaign-Quest-Prep-Data','Campaign-Quest-Prep','Campaign-Transition-Links',
  'Campaign-Transition','Campaign-Courtyard','Session-01-Story-Data','Session-01-Party-Data',
  'Session-01-Combat-Run','Session-01-Map-Data','Session-01-Town-Maps',
  'Session-01-Reliability','Session-01-Presentation','Session-01-Dungeon',
  'Session-04-Expedition','Campaign-Expedition-Data','Campaign-Expeditions',
  'Session-01-Table-Tools'
]) require(path.join(root,name+'.js'));
const copy=v=>JSON.parse(JSON.stringify(v)),X=ECHO_EXPEDITIONS,D=ECHO_DUNGEON;
const results=[];
function check(name,fn){try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}}
function fixture(wave=false){
  const story=ECHO_STORY_DATA.normalize(),continuity=ECHO_CONTINUITY.ensure(story);
  const extras={dungeon:D.normalize(),expedition:ECHO_EXPEDITION.normalize(),settlements:{minutes:360},travel:{supplies:{food:8,water:9}},inventory:[{id:'rope',name:'Rope',quantity:1,holder:'party',visible:true}]};
  const state={scene:wave?'s4-south':'um1-table',sessionKind:'custom',contentPackId:wave?'lmop-part-4-visuals':'waterdeep-first-expedition',runbook:4,turn:{order:[],index:0,round:0},waveEcho:ECHO_WAVE_ECHO.normalize(),sceneFog:{},map:{scenes:{}},tokens:[{id:'pc-trista',name:'Trista',team:'pc',hp:13,maxHp:24,scene:wave?'s4-south':'um1-table',x:17.5,y:24.75,placed:true,visible:true},{id:'scout-1',name:'Scout',team:'enemy',hp:2,maxHp:7,scene:wave?'s4-south':'um1-table',x:65,y:42,placed:true,visible:false}]};
  state.party={'pc-trista':{hp:13,maxHp:24,resources:{focus:1},privateNote:'PRIVATE_SHEET_SENTINEL'}};
  const scene=D.scene(extras.dungeon,state.scene);scene.memory=['1,1','1,2'];scene.concealed=['2,2'];
  const room=D.add(extras.dungeon,state.scene,'room','Cleared chamber');room.state='cleared';room.note='PRIVATE_DUNGEON_ROOM_SENTINEL';
  const door=D.add(extras.dungeon,state.scene,'door','Opened door');door.state='open';door.lineId='door-line';
  const trap=D.add(extras.dungeon,state.scene,'trap','Disarmed trap');trap.state='disarmed';
  const box=D.add(extras.dungeon,state.scene,'container','Empty chest');box.state='empty';
  const passage=D.link(extras.dungeon,state.scene,'return-map','Known return',10,20,80,90);
  const native=wave?state.waveEcho.rooms['7']:ECHO_EXPEDITION.room(extras.expedition,'um1-6');native.status='cleared';native.notes='PRIVATE_NATIVE_ROOM_SENTINEL';
  state.sceneFog[state.scene]=['1,1','1,2'];state.map.scenes[state.scene]={lines:[{id:'door-line',open:true}],light:'dim'};
  const ctx={state,extras,story,continuity,sessionId:'practice-expedition'};
  const r=X.create(ctx,'Isolated expedition',[state.scene]);
  return {ctx,r,scene,room,door,trap,box,passage,native};
}
function proposal(f,target,after){const p=X.prepare(f.ctx,f.r,{title:'Review one route change',reason:'The recorded survivor moved the known barricade.',proposal:'Close the selected route; leave all other state intact.'});p.evidence='A dated observation identifies the survivor, location and work.';if(target)p.changes.push({key:target.key,before:copy(target.before),after});return p;}

check('Templates require evidence and preserve established successes',()=>{
  const d=ECHO_EXPEDITION_DATA;assert.equal(d.developments.length,8);
  assert.equal(new Set(d.developments.map(x=>x.id)).size,8);
  for(const t of d.developments){assert(['faction','route','refuge'].includes(t.category));assert(t.scopes.length&&t.scopes.every(s=>['any','um1','wave','phandelver'].includes(s)));assert(t.reason&&t.proposal&&t.sourceNotes);assert(t.requiredEvidence.length>=3);assert(t.preserves.length>=3);assert(t.alternatives.length>=3);}
  for(const stage of ['departure','retreat','rest','return','debrief'])assert(d.checklists[stage].length>=4);
});
check('Start captures native objects, fog memory, positions and inhabitants without changing them',()=>{
  const f=fixture(),{ctx,r}=f,before=copy({state:ctx.state,dungeon:ctx.extras.dungeon,native:ctx.extras.expedition});X.start(ctx,r);
  assert.equal(r.phase,'active');assert.deepEqual({state:ctx.state,dungeon:ctx.extras.dungeon,native:ctx.extras.expedition},before);
  assert.deepEqual(r.baseline.scenes[ctx.state.scene].objects,f.scene.objects);assert.deepEqual(r.baseline.scenes[ctx.state.scene].memory,['1,1','1,2']);
  assert.deepEqual(r.baseline.inhabitants,[ctx.state.tokens[1]]);assert.equal(r.baseline.rooms['um1-6'].status,'cleared');
  f.door.state='closed';assert.equal(r.baseline.scenes[ctx.state.scene].objects.find(x=>x.id===f.door.id).state,'open','Baseline is a copy');
  assert.throws(()=>X.start(ctx,r),/already began/);assert.throws(()=>X.create(ctx,'Duplicate',[ctx.state.scene]),/already has/);
});
check('Retreat records exact return point without recovery, teleport or resets',()=>{
  const f=fixture(),{ctx,r}=f;X.start(ctx,r);const before=copy(ctx.state),dungeon=copy(ctx.extras.dungeon);X.retreat(ctx,r,'Along the open passage to the checked rally point; scout stayed behind.');
  assert.equal(r.phase,'away');assert.equal(r.retreat.scene,before.scene);assert.equal(r.retreat.runbook,before.runbook);
  assert.deepEqual(r.retreat.positions,[{id:'pc-trista',scene:before.scene,x:17.5,y:24.75,placed:true,visible:true}]);
  assert.deepEqual(ctx.state,before);assert.deepEqual(ctx.extras.dungeon,dungeon);assert.throws(()=>X.retreat(ctx,r,'Again'),/already-away|already recorded/);
  r.phase='active';ctx.state.turn.order=['pc-trista'];assert.throws(()=>X.retreat(ctx,r,'Flee'),/End combat/);
});
check('Retreat rejects prepared, closed and foreign-session records',()=>{
  const f=fixture(),{ctx,r}=f;assert.throws(()=>X.retreat(ctx,r,'Known exit'),/Record departure/);
  r.phase='closed';assert.throws(()=>X.retreat(ctx,r,'Known exit'),/closed/);
  r.phase='active';ctx.sessionId='other-session';assert.throws(()=>X.retreat(ctx,r,'Known exit'),/saved session/);
});
check('Changed room, remembered ground, supplies and injuries appear in return review',()=>{
  const f=fixture(),{ctx,r}=f;X.start(ctx,r);f.door.state='closed';f.scene.memory.push('1,3');ctx.extras.travel.supplies.food=7;ctx.state.tokens[1].hp=0;
  const rows=X.report(ctx,r).rows.join('\n');assert.match(rows,/Opened door: open → closed/);assert.match(rows,/remembered area changed by 1/);assert.match(rows,/Scout: 2 → 0 HP/);assert.match(rows,/Travel supplies changed/);
  assert.equal(f.trap.state,'disarmed');assert.equal(f.box.state,'empty');assert.equal(f.room.state,'cleared');
});
check('Development requires reason, consequence and concrete evidence',()=>{
  const f=fixture(),p=X.prepare(f.ctx,f.r);assert(X.preview(f.ctx,f.r,p).errors.length>=2);
  p.title='Close door';p.reason='A surviving actor moved it';p.consequence='Only the door closes';assert(X.preview(f.ctx,f.r,p).errors.some(e=>e.includes('concrete evidence')));
  p.evidence='Observed at the door';assert.deepEqual(X.preview(f.ctx,f.r,p).errors,[]);
});
check('Review applies only the explicit target and rejects replay, duplicate targets and invalid values',()=>{
  const f=fixture(),{ctx,r}=f;X.start(ctx,r);const target=X.targets(ctx,r).find(t=>t.key===`object|${ctx.state.scene}|${f.door.id}`),p=proposal(f,target,'closed');
  const before=copy({state:ctx.state,dungeon:ctx.extras.dungeon,expedition:ctx.extras.expedition,inventory:ctx.extras.inventory});X.apply(ctx,r,p,X.preview(ctx,r,p));
  before.dungeon.scenes[ctx.state.scene].objects.find(o=>o.id===f.door.id).state='closed';assert.deepEqual({state:ctx.state,dungeon:ctx.extras.dungeon,expedition:ctx.extras.expedition,inventory:ctx.extras.inventory},before);
  assert.equal(p.status,'applied');assert.throws(()=>X.apply(ctx,r,p,X.preview(ctx,r,p)),/already reviewed/);
  const bad=proposal(f,X.targets(ctx,r).find(t=>t.key===target.key),'invented');assert(X.preview(ctx,r,bad).errors.some(e=>e.includes('valid state')));
  bad.changes=[{key:target.key,before:'closed',after:'open'},{key:target.key,before:'closed',after:'open'}];assert(X.preview(ctx,r,bad).errors.some(e=>e.includes('only once')));
});
check('Staged changes and evidence cannot be applied after state or approved history changes',()=>{
  const f=fixture(),{ctx,r}=f;const t=X.targets(ctx,r).find(t=>t.key===`object|${ctx.state.scene}|${f.door.id}`),p=proposal(f,t,'closed'),review=X.preview(ctx,r,p);
  f.door.state='broken';assert.throws(()=>X.apply(ctx,r,p,review),/changed after staging/);f.door.state='open';
  const event=ECHO_CONTINUITY.event({id:'practice-evidence',title:'Observed barricade work',detail:'A surviving scout moved the barricade.',source:'Practice observation',approved:true,status:'confirmed',share:'private'});ctx.continuity.events.push(event);p.evidenceIds=[event.id];const factualReview=X.preview(ctx,r,p);
  event.detail='Correction: the scout did not reach the barricade.';assert.throws(()=>X.apply(ctx,r,p,factualReview),/evidence changed/);
  event.approved=false;assert(X.preview(ctx,r,p).errors.some(e=>e.includes('no longer confirmed')));
  event.approved=true;event.status='planned';assert(X.preview(ctx,r,p).errors.some(e=>e.includes('no longer confirmed')));
});
check('Replaced outcomes no longer support a proposal',()=>{
  const f=fixture(),e=ECHO_CONTINUITY.event({id:'old-proof',title:'Old account',detail:'A claim',source:'Rehearsal',approved:true,status:'confirmed'});f.ctx.continuity.events.push(e);
  const p=proposal(f);p.evidence='';p.evidenceIds=[e.id];assert.deepEqual(X.preview(f.ctx,f.r,p).errors,[]);
  f.ctx.continuity.events.push(ECHO_CONTINUITY.event({id:'replacement-proof',title:'Replacement',detail:'Corrected account',source:'Rehearsal',approved:true,status:'confirmed',replaces:[e.id]}));assert(X.preview(f.ctx,f.r,p).errors.some(x=>x.includes('no longer confirmed')));
});
check('Room links preserve cleared state, follow actual edits, and surface independent conflicts',()=>{
  for(const wave of [false,true]){const f=fixture(wave),{ctx,r}=f,b={scene:ctx.state.scene,objectId:f.room.id,system:wave?'wave':'waterdeep',roomId:wave?'7':'um1-6'};
    X.bind(ctx,r,b,'book');X.reconcile(ctx);assert.equal(f.room.state,'cleared');assert.equal(f.native.status,'cleared');
    f.room.state='visited';X.reconcile(ctx);assert.equal(f.native.status,wave?'scouted':'exploring','Actual map edit updates native state');
    f.native.status='cleared';X.reconcile(ctx);assert.equal(f.room.state,'cleared');
    f.native.status='unvisited';f.room.state='visited';X.reconcile(ctx);assert.match(r.bindings[0].conflict,/Both linked/);assert.equal(f.native.status,'unvisited');assert.equal(f.room.state,'visited');
    f.native.status='cleared';f.room.state='cleared';X.reconcile(ctx);assert.equal(r.bindings[0].conflict,'');
    assert.throws(()=>X.bind(ctx,r,b,'book'),/already have/);
  }
});
check('Wave Echo baseline preserves source room details and specific reminders',()=>{
  const f=fixture(true);f.ctx.state.waveEcho.rooms['7'].treasure='collected';f.ctx.state.waveEcho.flameskull.status='prevented';X.start(f.ctx,f.r);
  assert.equal(f.r.baseline.wave.rooms['7'].status,'cleared');assert.equal(f.r.baseline.wave.rooms['7'].treasure,'collected');assert.equal(f.r.baseline.wave.flameskull.status,'prevented');
  const original=copy(f.r.baseline);f.ctx.state.waveEcho.rooms['7'].notes='Later actual note';assert.deepEqual(f.r.baseline,original);
});
check('Campaign save normalization retains expedition baseline, return point, links and native map state',()=>{
  const f=fixture(),{ctx,r}=f;X.start(ctx,r);X.bind(ctx,r,{scene:ctx.state.scene,objectId:f.room.id,system:'waterdeep',roomId:'um1-6'},'book');X.retreat(ctx,r,'Use the known exit.');
  assert.deepEqual(X.normalize(copy(ctx.extras.expeditions)),ctx.extras.expeditions);
  const saved=ECHO_TABLE.normalize(copy(ctx.extras));assert(saved.expeditions,'Production table extras retain expedition records');assert.deepEqual(saved.expeditions,ctx.extras.expeditions);assert.deepEqual(saved.dungeon,ctx.extras.dungeon);assert.deepEqual(saved.expedition,ctx.extras.expedition);
});
check('An approved blocked passage survives save/restore and cannot still be traversed',()=>{
  const f=fixture(),t=X.targets(f.ctx,f.r).find(t=>t.key===`passage|${f.ctx.state.scene}|${f.passage.id}`),p=proposal(f,t,true);X.apply(f.ctx,f.r,p,X.preview(f.ctx,f.r,p));
  assert.throws(()=>D.passage(f.ctx.extras.dungeon,f.ctx.state.scene,f.passage.id),/blocked|closed|unavailable/i);
  const restored=D.normalize(copy(f.ctx.extras.dungeon));assert.equal(restored.scenes[f.ctx.state.scene].passages[0].blocked,true);assert.throws(()=>D.passage(restored,f.ctx.state.scene,f.passage.id),/blocked|closed|unavailable/i);
});
check('Production TV and phone projections exclude private expedition data',()=>{
  const source=fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8'),boot=source.lastIndexOf('  if (IS_PLAYER) initPlayer();');assert(boot>0);
  require('./test-support.cjs').loadTableContent();
vm.runInThisContext(source.slice(0,boot)+`\nglobalThis.__expeditionFixture={fresh:()=>normalize(newCustomState()),set:(s,i)=>{state=s;campaignIndex=i;},publicState,phoneSnapshot};\n})();`);
  const F=__expeditionFixture,state=F.fresh(),story=ECHO_STORY_DATA.normalize(),extras=ECHO_TABLE.normalize();
  extras.expeditions=X.normalize({records:[{id:'private-expedition',sessionId:'practice-expedition',title:'PRIVATE_EXPEDITION_TITLE',objective:'PRIVATE_EXPEDITION_OBJECTIVE',survivors:'PRIVATE_EXPEDITION_SURVIVORS',baseline:{secret:'PRIVATE_EXPEDITION_BASELINE'},retreat:{secret:'PRIVATE_EXPEDITION_RETREAT'},history:[{kind:'development',text:'PRIVATE_EXPEDITION_HISTORY'}],proposals:[{title:'PRIVATE_EXPEDITION_PROPOSAL',reason:'PRIVATE_EXPEDITION_REASON',evidence:'PRIVATE_EXPEDITION_EVIDENCE'}]}]});
  F.set(state,{story,presentation:ECHO_PRESENTATION.normalizeLibrary(),tableExtras:extras,rules:null,sessions:[{id:'session-01',name:'Practice'}],combatLibrary:[]});
  const tv=JSON.stringify(F.publicState()),phones=JSON.stringify(F.phoneSnapshot());assert(!tv.includes('PRIVATE_EXPEDITION_'));assert(!phones.includes('PRIVATE_EXPEDITION_'));assert(!Object.hasOwn(F.publicState(),'expeditions'));assert(!Object.hasOwn(F.phoneSnapshot(),'expeditions'));
});

for(const r of results)console.log(`${r.pass?'PASS':'FAIL'} ${r.name}${r.pass?'':'\n'+r.error}`);
const failed=results.filter(r=>!r.pass);if(failed.length)process.exitCode=1;
else console.log(`PASS ${results.length} isolated expedition checks; no real campaign save read or changed.`);

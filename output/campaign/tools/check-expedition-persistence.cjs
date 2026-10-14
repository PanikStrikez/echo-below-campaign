/* Production return hooks with isolated in-memory saves; never opens live storage/services. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),copy=v=>JSON.parse(JSON.stringify(v));
global.window=global;global.location={hash:'',protocol:'file:'};
for(const name of ['LMOP-Visual-Catalog','LMOP-Battle-Map-Catalog','Campaign-Floor-Maps','Session-01-Map-Data','Session-01-Town-Maps',
  'Session-04-Runbook','Session-04-Expedition','Session-Content-Packs','Session-01-Party-Data','Session-01-Combat-Data',
  'Session-03-Thundertree-Combat','Session-04-Combat','Session-01-Combat-Run','Session-01-Reliability',
  'Session-01-Story-Data','Campaign-Expedition-Resume','Campaign-Expeditions','Session-01-Dungeon',
  'Session-01-Dungeon-View','Session-01-Table-Tools','Waterdeep-Expedition-Data','Waterdeep-Expedition',
  'Session-01-Presentation','Session-01-Recovery'])require(path.join(root,name+'.js'));
const source=fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8'),boot=source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot>0);
require('./test-support.cjs').loadTableContent();
vm.runInThisContext(source.slice(0,boot)+`
  let rehearsalRestoreHook=()=>{},rehearsalCommits=0;
  captureRestorePoint=async()=>{await rehearsalRestoreHook();};saveLocal=async()=>{};saveCampaignIndex=async()=>{};
  commit=()=>{rehearsalCommits++;};resetBuilderForms=()=>{};populateHandoutFields=()=>{};
  globalThis.__persist={fresh:()=>normalize(newCustomState()),normalize,preview:previewExpeditionReturn,apply:applyExpeditionReturn,
    set:(current,index,target)=>{state=current;campaignIndex=index;activeCampaignId='isolated-expedition';activeSessionId=index.active;
      sessionCache.clear();sessionCache.set('saved-floor',JSON.stringify(target));saveQueue=Promise.resolve();rehearsalRestoreHook=()=>{};rehearsalCommits=0;},
    get:()=>({state,index:campaignIndex,session:activeSessionId,commits:rehearsalCommits}),restoreHook:fn=>{rehearsalRestoreHook=fn;},
    publicState,phoneSnapshot};
})();`);
const F=__persist,D=ECHO_DUNGEON,X=ECHO_EXPEDITIONS,results=[];
async function check(name,fn){try{await fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}}
function fixture(){
  const floor='um1-floor-state',exit='known-landing',target=F.fresh();
  target.scenes.push({id:floor,title:'Dungeon floor',kind:'map',image:'',fog:true,grid:true,gridColumns:60},
    {id:exit,title:'Known landing',kind:'map',image:'',fog:true,grid:true,gridColumns:30});
  target.scene=floor;target.sceneFog[floor]=['2,2','2,3','3,3'];
  target.map.scenes[floor]=ECHO_MAP_DATA.scene({fineFog:true,view:{zoom:2,panX:13,panY:-7},lines:[
    {id:'known-door-line',kind:'door',x1:40,y1:30,x2:40,y2:40,open:true,discovered:true},
    {id:'PRIVATE_SOURCE_GATE_26',kind:'secret',x1:80,y1:70,x2:80,y2:80,open:false,discovered:false}],
    links:[{id:'PRIVATE_SOURCE_ROUTE_26',title:'PRIVATE_UNDISCOVERED_GATE',x:85,y:80,target:'PRIVATE_UNVISITED_FLOOR',visible:false}]});
  const hero=target.tokens.find(t=>t.team==='pc');target.tokens=target.tokens.filter(t=>t.team==='pc');
  Object.assign(hero,{placed:true,visible:true,scene:floor,x:11.25,y:18.75,hp:9});target.party[hero.id].hp=9;
  target.tokens.push({id:'saved-inhabitant',name:'Saved inhabitant',label:'S',type:'custom',team:'enemy',scene:floor,
    placed:true,visible:false,x:42,y:55,hp:0,maxHp:12,tempHp:0,conditions:[],initiative:null});
  Object.assign(target,F.normalize(copy(target)));
  const extras=ECHO_TABLE.normalize(),sc=D.scene(extras.dungeon,floor);
  sc.memory=['2,2','2,3','3,3'];sc.concealed=['8,20'];sc.fine=true;
  for(const [kind,state]of [['room','cleared'],['door','broken'],['trap','disarmed'],['container','empty']]){
    const o=D.add(extras.dungeon,floor,kind,'Known '+kind,11,18);o.state=state;o.note='PRIVATE_ROOM_CUSTODY';
    if(kind==='door')o.lineId='known-door-line';
  }
  const gate=D.add(extras.dungeon,floor,'door','PRIVATE_UNDISCOVERED_GATE',85,80);gate.lineId='PRIVATE_SOURCE_GATE_26';
  const route=D.link(extras.dungeon,floor,exit,'Known stair',11,18,72,64),back=D.passage(extras.dungeon,floor,route.id).back;
  extras.dungeon.returnTrail.push({from:exit,to:floor,passage:back.id,returnId:route.id,label:'Known landing'});
  Object.assign(ECHO_EXPEDITION.room(extras.expedition,'um1-6'),{status:'cleared',survivors:'One recorded survivor',treasure:'Removed earlier',notes:'PRIVATE_NATIVE_KEY_6'});
  const ctx={state:target,extras,sessionId:'saved-floor'},record=X.create(ctx,'Floor expedition',[floor,exit]);
  X.start(ctx,record);X.retreat(ctx,record,'Leave through the checked stair and return to this saved position.');
  const current=copy(target);current.scene=exit;current.tokens=current.tokens.filter(t=>t.team==='pc');
  const rest=ECHO_PARTY_DATA.previewRest(current.party[hero.id],'short',{hitDiceSpent:1,healing:4});
  assert(!rest.blocked);current.party[hero.id]=rest.sheet;current.tokens.find(t=>t.id===hero.id).hp=rest.sheet.hp;
  current.tokens.forEach(t=>{t.placed=false;t.scene='';});extras.settlements={minutes:480};
  const index={active:'city-save',sessions:[{id:'city-save',name:'Town'},{id:'saved-floor',name:'Dungeon'}],story:ECHO_STORY_DATA.normalize(),
    tableExtras:extras,presentation:ECHO_PRESENTATION.normalizeLibrary(),combatLibrary:[],rules:null};
  F.set(current,index,target);return {floor,exit,target,current,index,extras,sc,route,back,record,hero:hero.id};
}
(async()=>{
  await check('Failed passage lookup and return repair are read-only',()=>{
    const d=D.normalize(),before=JSON.stringify(d);assert.throws(()=>D.passage(d,'missing','missing'),/no longer/);assert.equal(JSON.stringify(d),before);
    const p=D.link(d,'a','b','Stairs',1,2,3,4);delete d.scenes.b;const missing=JSON.stringify(d);
    assert.throws(()=>D.passage(d,'a',p.id),/Repair/);assert.equal(JSON.stringify(d),missing);
    D.scene(d,'b').passages=[{id:p.returnId,target:'a',returnId:'wrong'}];
    const mismatch=JSON.stringify(d);assert.throws(()=>D.passage(d,'a',p.id),/Repair/);assert.equal(JSON.stringify(d),mismatch);
  });
  await check('Paired links cannot exceed persisted passage or scene limits',()=>{
    const d=D.normalize();for(let i=0;i<60;i++)D.link(d,'a','b','Stair '+i,1,2,3,4);
    const before=JSON.stringify(d);assert.throws(()=>D.link(d,'c','a','Overflow',1,2,3,4),/60 passages/);assert.equal(JSON.stringify(d),before);
    const saved=D.normalize(copy(d));assert.equal(saved.scenes.a.passages.length,60);for(const p of saved.scenes.a.passages)assert(D.passage(saved,'a',p.id));
    const full=D.normalize();for(let i=0;i<150;i++)D.scene(full,'floor-'+i);const fullBefore=JSON.stringify(full);
    assert.throws(()=>D.link(full,'floor-0','extra','Overflow',1,2,3,4),/map limit/);assert.equal(JSON.stringify(full),fullBefore);
  });
  await check('Reviewed retreat, rest and production return retain the authoritative floor and all durable exploration',async()=>{
    const f=fixture(),before=copy(f.extras),target=copy(f.target),review=await F.preview(f.record.id);
    assert.deepEqual(f.extras,before,'Preview creates no missing records');await F.apply(f.record.id,review);
    const resumed=F.get();assert.equal(resumed.session,'saved-floor');assert.equal(resumed.state.scene,f.floor);
    assert.deepEqual(resumed.state.party[f.hero],f.current.party[f.hero]);
    const pc=resumed.state.tokens.find(t=>t.id===f.hero);assert.equal(pc.hp,f.current.party[f.hero].hp);assert.equal(pc.x,11.25);assert.equal(pc.y,18.75);
    assert.deepEqual(resumed.state.tokens.filter(t=>t.team!=='pc'),target.tokens.filter(t=>t.team!=='pc'));
    assert.deepEqual(resumed.state.map,target.map);assert.deepEqual(resumed.state.sceneFog,target.sceneFog);
    assert.deepEqual(resumed.index.tableExtras.dungeon,before.dungeon);assert.deepEqual(resumed.index.tableExtras.expedition,before.expedition);
    assert.equal(resumed.state.scenes.filter(s=>s.id===f.floor).length,1,'One scene owns the floor, not one copy per section');
    assert.equal(D.passage(resumed.index.tableExtras.dungeon,f.floor,f.route.id).back.id,f.back.id);
    const archive={format:'echo-below-campaign-v2',schemaVersion:ECHO_RELIABILITY.VERSION,active:'saved-floor',campaign:{name:'Isolated'},
      sessions:[{id:'saved-floor',name:'Saved floor',state:resumed.state}],tableExtras:resumed.index.tableExtras,
      story:resumed.index.story,presentation:resumed.index.presentation,mediaFiles:[]};
    const restored=ECHO_RECOVERY.prepare(copy(archive),F.normalize);
    assert.deepEqual(restored.index.tableExtras.dungeon,before.dungeon);assert.deepEqual(restored.index.tableExtras.expedition,before.expedition);
    assert.deepEqual(restored.sessions[0].state.sceneFog,target.sceneFog);assert.equal(restored.sessions[0].state.tokens.find(t=>t.id==='saved-inhabitant').hp,0);
  });
  await check('Newly blocked paired exits and native-room changes invalidate a return review without applying it',async()=>{
    for(const mutate of [f=>f.route.blocked=true,f=>f.back.blocked=true,f=>f.extras.expedition.rooms['um1-6'].survivors='Changed account',
      f=>f.sc.objects[0].state='visited',f=>f.record.conditions='The landing is now unsafe']){
      const f=fixture(),review=await F.preview(f.record.id);mutate(f);const before=copy(F.get());
      await assert.rejects(()=>F.apply(f.record.id,review),/rooms, routes or return conditions changed/);assert.deepEqual(F.get(),before);
    }
  });
  await check('Changes during async recovery-point creation also invalidate return before switching sessions',async()=>{
    const f=fixture(),review=await F.preview(f.record.id),before=copy(f.current);F.restoreHook(()=>{f.back.blocked=true;});
    await assert.rejects(()=>F.apply(f.record.id,review),/rooms, routes or return conditions changed/);
    assert.deepEqual(F.get().state,before);assert.equal(F.get().session,'city-save');assert.equal(F.get().commits,0);
  });
  await check('TV and phone projections omit hidden gates, source keys, private room accounts and expedition metadata',async()=>{
    const f=fixture();F.set(f.target,{...f.index,active:'saved-floor'},f.target);
    const tv=F.publicState(),phone=F.phoneSnapshot(),text=JSON.stringify([tv,phone]);assert(!text.includes('PRIVATE_'));
    assert(!Object.hasOwn(tv,'expeditions'));assert(!Object.hasOwn(phone,'expeditions'));
    assert(!tv.map.scenes[f.floor].lines.some(l=>l.kind==='secret'));assert.equal(tv.map.scenes[f.floor].links.length,0);
    assert(!tv.tokens.some(t=>t.id==='saved-inhabitant'));assert.equal(tv.dungeon.passages.length,0);
  });
  await check('Dense manual floor mask and section camera survive normalization, return and backup restore without publishing the ledger',async()=>{
    const f=fixture(),size={cols:300,rows:200},keys=['0,0','101,172','199,299'];
    const before=copy({tokens:f.target.tokens,party:f.target.party,extras:f.extras,scenes:f.target.scenes});
    const view=ECHO_FLOOR_MAPS.focus({viewBox:[0,0,1800,1200]},{sectionBounds:[600,400,300,200]});
    assert.equal(view.zoom,6);assert.deepEqual({tokens:f.target.tokens,party:f.target.party,extras:f.extras,scenes:f.target.scenes},before);
    f.target.map.scenes[f.floor]=ECHO_MAP_DATA.scene({...f.target.map.scenes[f.floor],floorFog:size,view});f.target.sceneFog[f.floor]=keys;
    F.set(f.current,f.index,F.normalize(copy(f.target)));const review=await F.preview(f.record.id);await F.apply(f.record.id,review);
    const resumed=F.get();assert.deepEqual(resumed.state.sceneFog[f.floor],keys);assert.deepEqual(resumed.state.map.scenes[f.floor].floorFog,size);
    assert.deepEqual(resumed.state.map.scenes[f.floor].view,view);assert.deepEqual(resumed.index.tableExtras.dungeon,before.extras.dungeon);
    const calls=[],canvas={getContext:()=>({fillRect:(...args)=>calls.push(['fill',...args]),clearRect:(...args)=>calls.push(['clear',...args])})};
    ECHO_FLOOR_MAPS.paint(canvas,keys,size,false);assert.equal(canvas.width,1200);assert.equal(canvas.height,800);
    assert.deepEqual(calls.filter(c=>c[0]==='clear'),[['clear',0,0,4,4],['clear',688,404,4,4],['clear',1196,796,4,4]]);
    const tv=F.publicState(),phone=F.phoneSnapshot();assert.equal(tv.fog.length,640);assert(!tv.fog.includes('101,172'));
    assert(!Object.hasOwn(tv.map.scenes[f.floor],'floorFog'));assert(!JSON.stringify([tv,phone]).includes('101,172'));
    const archive={format:'echo-below-campaign-v2',schemaVersion:ECHO_RELIABILITY.VERSION,active:'saved-floor',campaign:{name:'Isolated'},
      sessions:[{id:'saved-floor',name:'Saved floor',state:resumed.state}],tableExtras:resumed.index.tableExtras,
      story:resumed.index.story,presentation:resumed.index.presentation,mediaFiles:[]};
    const restored=ECHO_RECOVERY.prepare(copy(archive),F.normalize);assert.deepEqual(restored.sessions[0].state.sceneFog[f.floor],keys);
    assert.deepEqual(restored.sessions[0].state.map.scenes[f.floor].view,view);assert.deepEqual(restored.sessions[0].state.map.scenes[f.floor].floorFog,size);
  });
  const report={auditDate:new Date().toISOString(),passed:results.every(r=>r.pass),isolation:'In-memory production hooks and throwaway fixtures only; no live saves, browser, phone service or network used.',checks:results,
    limitations:['Actual artwork decoding and section-focus camera integration are verified separately by the browser workflow.','Legacy phone overlay remains 32 columns by 20 rows; dense floor reveals use the masked raster and keep their cell ledger private.','Automatic vision needs DM-reviewed barriers; source topology is not automatically imported.']};
  fs.writeFileSync(path.join(process.env.ECHO_TEST_REPORT_DIR || path.join(root,'atlas'),'Exploration-Persistence-Verification.json'),JSON.stringify(report,null,2)+'\n');
  for(const r of results)console.log(`${r.pass?'PASS':'FAIL'} ${r.name}${r.pass?'':'\n'+r.error}`);
  if(!report.passed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});

const {chromium}=require('playwright');
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  // New browser profile: the live campaign's local storage is never opened.
  const context=await browser.newContext({viewport:{width:1500,height:1000}}),page=await context.newPage(),errors=[];
  const original=path.resolve(__dirname,'../../releases/private/Live-Group-Original-2026-10-11.json');
  const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex'),originalHash=hash();
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{for(const [key,saved] of [['ECHO_STORY_UI','__stage6Host'],['ECHO_GUIDED','__stage6Guide'],['ECHO_PHONE','__stage6Phone']]){let module;Object.defineProperty(window,key,{configurable:true,get:()=>module,set:value=>{module=value;const init=value.init;value.init=host=>{window[saved]=host;return init(host);};}});}});
  await page.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html'));
  await page.locator('#session-select option[value="pack:phandalin-aftermath-next"]').waitFor({state:'attached'});
  const baseline=await page.evaluate(()=>__stage6Host.continuity().events.length);
  const partyBefore=await page.evaluate(()=>JSON.stringify(__stage6Guide.context().state.party));
  await page.evaluate(()=>{const select=document.querySelector('#session-select');select.value='pack:phandalin-aftermath-next';select.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>document.querySelector('#runbook-select')?.value==='s5-open');
  const pack=await page.evaluate(()=>({
   beat:document.querySelector('#runbook-select')?.value,
   pack:ECHO_CONTENT_PACKS.find(x=>x.id==='phandalin-aftermath-next'),
   prep:__stage6Host.story().questPrep,
   events:__stage6Host.continuity().events.length
  }));
  assert(pack?.pack?.beats.includes('s5-open'),'next-session runbook must load');
  assert.equal(pack.pack.encounters.length,0,'old Redbrand enemies must not respawn');
  assert.equal(pack.beat,'s5-open');
  assert.equal(pack.pack.firstScene,'lmop-barthen-exterior','Opening art must not presume entry');
  assert.equal(pack.events,baseline,'creating a playable package must not create actual outcomes');
  assert.equal(await page.evaluate(()=>JSON.stringify(__stage6Guide.context().state.party)),partyBefore,'party statistics and resources carry into the next package');
  assert(!JSON.stringify(pack.prep).includes('Glasstaff escaped to Cragmaw Castle') ||
    !JSON.stringify(pack.prep).includes('"reveal":true'),'private prep cannot reveal the castle');
  await page.evaluate(()=>ECHO_STORY_UI.open('quest-workspace'));
  await page.getByRole('button',{name:'Session board',exact:true}).click();
  assert(await page.getByText('3/3 likely leads',{exact:true}).count(),'next board has three leads');
  assert(await page.getByText('Future campaign outline · private',{exact:true}).count());
  // Follow each prepared lead in the real renderer. Staging is private until publish.
  await page.evaluate(()=>ECHO_STORY_UI.close());
  const popup=context.waitForEvent('page');await page.evaluate(()=>document.getElementById('open-player').click());
  const tv=await popup;await tv.waitForLoadState();
  await page.evaluate(()=>document.getElementById('resync-player').click());
  const leadChecks=[];
  for(const beatId of ['s5-barthen','s5-inn','s5-rat','s5-redbrand']){
   const result=await page.evaluate(async id=>{
    const h=__stage6Host,g=__stage6Guide,beat=ECHO_STAGE6.beats.find(b=>b.id===id),before=g.context().state.scene;
    h.selectBeat(id);h.prepPreviewScene(beat.scene);
    const staged=g.context().state.scene;
    const img=document.querySelector('#context-scene .context-scene-preview');
    if(img&&!img.complete)await new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});});
    const loaded=!!img?.naturalWidth;
    const phone=__stage6Phone.snapshot();
    const text=JSON.stringify(phone);
    document.querySelector('#context-scene button').click();
    return {id,before,staged,loaded,shown:g.context().state.scene,secretInPhone:text.includes('actual-redbrand-glasstaff-destination')||text.includes('Glasstaff escaped to Cragmaw Castle'),events:h.continuity().events.length};
   },beatId);
   assert.equal(result.staged,result.before,'Preview must leave the current TV scene intact');
   assert(result.loaded,'Prepared visual loads locally: '+beatId);
   assert.equal(result.shown,pack.pack.runbook.find(b=>b.id===beatId).scene,'Publish shows the selected lead visual');
   assert.equal(result.secretInPhone,false,'Private prep absent from phone snapshot');
   assert.equal(result.events,baseline,'Choosing a lead records no actual outcomes');
   await tv.waitForTimeout(400);
   const screen=await tv.locator('body').innerText();
   assert(!screen.includes('Cragmaw Castle')&&!screen.includes('familiar'),'TV contains no unearned destination or rat nature');
   leadChecks.push(result);
  }
  await page.evaluate(()=>ECHO_STORY_UI.open('outcomes'));
  await page.getByRole('button',{name:'Evidence of Glasstaff’s route',exact:true}).click();
  assert.equal(await page.getByLabel('Evidence state',{exact:true}).inputValue(),'planned');
  assert.equal(await page.getByLabel('Publish wording to',{exact:true}).inputValue(),'private');
  await page.getByRole('button',{name:'Preview linked changes',exact:true}).click();
  assert(await page.getByText('Saved as a plan.',{exact:false}).count(),'planned draft remains nonfactual');
  const linked=await page.evaluate(()=>{
   const host=__stage6Host,d=host.continuity(),C=ECHO_CONTINUITY,O=ECHO_OUTCOMES,markers=host.continuityMarkers();
   const castle=markers.find(p=>p.scene==='region-lmop'&&p.point==='region-cragmaw-castle');
   if(!castle)throw Error('Castle marker unavailable for outcome rehearsal');
   const before=C.projectMap(d,{points:[{id:castle.point,visible:false,approved:false}]},castle.scene).points[0].visible;
   const draft=O.begin(d,{...ECHO_STAGE6.draft('glasstaff-lead'),title:'Rehearsal witness found',detail:'A witness directly observed the road taken by Glasstaff.',source:'Isolated rehearsal witness',status:'confirmed',basis:'Observed',share:'party',knows:['party'],publicTitle:'A witnessed route',playerText:'A witness described the road Glasstaff took.',markers:[{scene:castle.scene,point:castle.point,reveal:true}],quests:[{id:'redbrands',state:'completed',stepId:'redbrands-1'},{id:'gundren',state:'reference',stepId:'gundren-1'}]});
   const review=O.preview(d,draft,{story:host.story(),markers});
   if(review.errors.length)throw Error(review.errors.join('; '));
   const preview={journal:review.changes.journal?.after.some(x=>x.text.includes('witness described')),
    map:review.changes.maps?.after.some(x=>x.point===castle.point&&x.reveal),
    quest:review.changes.quests?.after.some(x=>x[0].includes('Redbrand')&&x[0].includes('Establish')&&x[1]==='completed')};
   O.apply(d,draft.id,review,{story:host.story(),markers});
   const after=C.projectMap(d,{points:[{id:castle.point,visible:false,approved:false}]},castle.scene).points[0].visible;
   const journal=C.publicJournal(d).some(x=>x.text==='A witness described the road Glasstaff took.');
   const unrelated=O.questUpdates(d,'redbrands','redbrands-2').at(-1)?.state||'open';
   const recap=C.recap(d,'all').includes('A witness described the road Glasstaff took.');
   C.restore(d);
   const undone=C.projectMap(d,{points:[{id:castle.point,visible:false,approved:false}]},castle.scene).points[0].visible;
   return {before,preview,after,journal,unrelated,recap,undone};
  });
  assert.equal(linked.before,false,'DM truth cannot reveal castle marker');
  assert(linked.preview.journal&&linked.preview.map&&linked.preview.quest,'review includes the linked audience, map, and quest changes');
  assert(linked.after&&linked.journal&&linked.recap,'approved discovery projects to map, journal, and recap');
  assert.equal(linked.unrelated,'open','unrelated quest objectives stay open');
  assert.equal(linked.undone,false,'undo restores castle secrecy');
  await page.evaluate(()=>{const select=document.querySelector('#session-select');select.value='pack:gundren-session-3';select.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>document.querySelector('#runbook-select')?.value==='s3-prep');
  const carried=await page.evaluate(()=>__stage6Guide.context().state.tokens.filter(t=>t.encounter==='wyvern-tor'||t.id==='s3-hamun').map(t=>t.id));
  assert.deepEqual(carried,[],'future castle package must not respawn the cleared orc camp or disappeared Kost');
  assert.deepEqual(errors,[]);
  assert.equal(hash(),originalHash,'Original exported campaign remains byte-for-byte unchanged');
  const evidence=path.resolve(__dirname,'../../audits/next-playable-package');fs.mkdirSync(evidence,{recursive:true});
  fs.writeFileSync(path.join(evidence,'Verification.json'),JSON.stringify({at:new Date().toISOString(),kind:'Isolated real-browser rehearsal; phone snapshot, not physical phones',package:'phandalin-aftermath-next',checkpoint:'Barthen’s Provisions; Gundren at unnamed inn, condition unresolved; Trista holds rat; Glasstaff escaped, destination private',leadChecks,checks:['three seeded leads','local visuals loaded','private stage then publish','no prepared outcome recorded','party statistics preserved','phone snapshot and TV secrecy','reviewed discovery and undo','no orc camp or Kost respawn'],physical:'Not checked',liveServices:'Not restarted',originalSaveSha256:originalHash},null,2)+'\n');
  console.log('Stage 6 isolated browser rehearsal passed: next pack, preserved party, three private leads, open future outline, reviewed discovery across quest/journal/map/recap, undo, and no cleared-camp respawn in the optional follow-up.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

/* Focused live atlas renderer rehearsal: fresh profile, temporary local service, no live table. */
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const app=path.resolve(__dirname,'..'),out=path.join(app,'atlas'),checks=[],errors=[];
let server,browser,page,base,phase='starting isolated service';
const pass=name=>{checks.push({name,passed:true});console.log('PASS '+name);};
async function open(id){await page.evaluate(id=>ECHO_ATLAS_UI.open({boardId:id}),id);await page.locator('.campaign-atlas').waitFor();}
async function snapshot(){return page.evaluate(()=>{const c=__auditHost.context();return JSON.stringify({state:c.state,story:c.story,rules:c.rules,extras:__atlasHost.extras(),phoneAtlas:__phoneHost.snapshot().atlas});});}
async function unchanged(before,label){const after=await snapshot();if(after===before)return;const changed=[];function diff(a,b,key=''){if(JSON.stringify(a)===JSON.stringify(b))return;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const field of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[field],b[field],key+'.'+field);}else if(changed.length<12)changed.push({key,before:String(a).slice(0,160),after:String(b).slice(0,160)});}diff(JSON.parse(before),JSON.parse(after));assert.fail(label+': '+JSON.stringify(changed));}
(async()=>{try{
  base=await new Promise((resolve,reject)=>{server=spawn('/usr/bin/python3',['-u',path.join(__dirname,'ai-rehearsal-server.py')],{env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'},stdio:['ignore','pipe','pipe']});let err='';server.stderr.on('data',b=>err+=b);server.stdout.once('data',b=>resolve('http://127.0.0.1:'+Number(String(b).trim())));server.once('exit',code=>reject(Error(code+': '+err)));});
  browser=await chromium.launch({headless:true,channel:'chrome'});const context=await browser.newContext({viewport:{width:1550,height:1100}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base||/^(data|blob):/.test(route.request().url())?route.continue():route.abort());
  await context.addInitScript(()=>{for(const[key,capture]of [['ECHO_ATLAS_UI','__atlasHost'],['ECHO_PHONE','__phoneHost'],['ECHO_CAMPAIGN_ASSISTANT_UI','__auditHost'],['ECHO_VOICE_STUDIO','__studio']]){let api;Object.defineProperty(window,key,{configurable:true,get:()=>api,set:value=>{api=value;if(!value.init)return;const init=value.init;value.init=host=>{window[capture]=host;return init(host);};}});}});
  page=await context.newPage();page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  phase='load isolated practice campaign';await page.goto(base+'/output/campaign/Session-01-TV-Display.html');await page.locator('.cockpit-nav').waitFor();
  await page.locator('#load-campaign-file').setInputFiles(path.join(app,'../releases/Echo-Below-Package-Backup.json'));await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Restored'));
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Create practice campaign',exact:true}).click();await page.waitForFunction(()=>__studio.practice()&&__atlasHost&&__phoneHost);
  await open('world');await page.waitForFunction(()=>{const id=__auditHost.context().sessionId,e=__atlasHost.extras();return e.sessionFlow?.sessions?.[id]&&e.flow?.baselines?.[id];});
  await page.evaluate(()=>__phoneHost.snapshot());const before=await snapshot();
  if(process.argv.includes('--neighborhood-only')){
    await open('wd-map-mending-neighborhood');await page.getByRole('button',{name:'Expand atlas',exact:true}).click();
    await page.evaluate(async()=>{const src=document.querySelector('.atlas-map-section .atlas-viewport image')?.getAttribute('href');const image=new Image();image.src=src;await image.decode();});
    await page.screenshot({path:path.join(out,'Preparation-DM-Neighborhood.png')});await unchanged(before,'Neighborhood visual review changed state');
    const reportPath=path.join(out,'Preparation-UI-Verification.json');if(fs.existsSync(reportPath)){const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));report.neighborhoodVisualAuditDate=new Date().toISOString();fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');}
    console.log('Neighborhood screenshot refreshed; campaign state unchanged');return;
  }
  const settlements=['city-waterdeep','town-leilon','city-neverwinter','city-luskan','town-daggerford','city-baldurs-gate'];
  phase='render existing stop preparations';
  for(const id of settlements){await open(id);const preparation=await page.evaluate(id=>ECHO_ATLAS_DATA.boards.find(b=>b.id===id).settlementPreparation,id);assert(preparation,id+' lacks preparation');
    const section=page.locator('details').filter({has:page.locator('summary',{hasText:/^Run this stop$/})});assert.equal(await section.getAttribute('open'),null);await section.locator('summary').click();const text=await section.innerText();
    assert(text.includes(preparation.opening));for(const title of ['Arrival points','Services & contacts','Onward routes','Decisions to confirm'])assert(text.includes(title),id+': '+title);
    assert(text.includes('Availability and terms need confirmation'));assert(!text.includes('Price not agreed'));assert(!text.includes('Agreement not recorded'));
    const link=section.getByRole('button',{name:/^(View place|Open map):/}).first();if(await link.count()){await link.click();await unchanged(before,id+' preparation link changed state');}
  }
  pass('All six stop cards render collapsed preparation, unknown terms and private destination links');
  phase='neighborhood service markers and layout guidance';await open('wd-map-mending-neighborhood');
  const waypoints=await page.evaluate(()=>ECHO_ATLAS_DATA.boards.find(b=>b.id==='wd-map-mending-neighborhood').dmPoints||[]);assert(waypoints.length,'Neighborhood needs private clickable service points');
  for(const point of waypoints){await open('wd-map-mending-neighborhood');const marker=page.locator('.atlas-service-marker').filter({has:page.locator('title',{hasText:point.title})});assert.equal(await marker.count(),1,point.title);await marker.press('Enter');if(point.targetBoardId)assert.equal(await page.evaluate(()=>ECHO_ATLAS_UI.current().boardId),point.targetBoardId);await unchanged(before,'Waypoint changed campaign or public state');}
  const mapIds=await page.evaluate(()=>WATERDEEP_MAP_COLLECTION.maps.map(m=>m.id));
  for(const id of mapIds){const target=await page.evaluate(id=>ECHO_ATLAS_DATA.boards.find(b=>b.proposalId===id)?.id,id);assert(target,id);await open(target);const section=page.locator('details').filter({has:page.locator('summary',{hasText:/^Use this layout$/})});assert.equal(await section.count(),1,id);assert.equal(await section.getAttribute('open'),null);await section.locator('summary').click();const text=await section.innerText();for(const label of ['Cover','Elevation','Movement','Furniture','Ways to use the scene'])assert(text.includes(label),id+': '+label);}
  pass('Private service markers open existing maps; all collection layouts expose compact play guidance');
  phase='confirm preparation never enters public projections';
  const privacy=await page.evaluate(()=>{
    const data=structuredClone(ECHO_ATLAS_DATA),travel=structuredClone(__atlasHost.travel());for(const p of travel.places)p.status='located';
    const rows=data.boards.filter(b=>b.settlementPreparation||b.proposalId?.startsWith('waterdeep-'));
    for(const b of rows){b.settlementPreparation={opening:'PRIVATE_STOP_SENTINEL',serviceContacts:[{title:'PRIVATE_CONTACT_SENTINEL'}]};b.dmPoints=[{id:'PRIVATE_POINT_SENTINEL',title:'PRIVATE_MARKER_SENTINEL',x:1,y:1}];b.playNotes={summary:'PRIVATE_LAYOUT_SENTINEL'};}
    for(const b of rows){const p=ECHO_ATLAS.publicProjection(data,travel,b.id);if(!p)throw Error('Projection unavailable '+b.id);const encoded=JSON.stringify(p);if(/PRIVATE_.*_SENTINEL|settlementPreparation|playNotes|dmPoints/.test(encoded))throw Error('Private metadata escaped '+b.id);
      const clean=ECHO_ATLAS_VIEW.normalize({...p,board:{...p.board,image:'atlas/art/Sword-Coast-Terrain.png'},settlementPreparation:b.settlementPreparation,dmPoints:b.dmPoints,playNotes:b.playNotes});if(!clean||/PRIVATE_.*_SENTINEL|settlementPreparation|playNotes|dmPoints/.test(JSON.stringify(clean)))throw Error('Renderer accepted private metadata '+b.id);}
    return rows.length;
  });assert(privacy>=19);await unchanged(before,'Preparation changed campaign or public state');pass('Preparation, contacts, play notes and DM points are omitted by public projection and shared renderer');
  phase='check known person target and unknown contact guard';
  await page.evaluate(()=>__atlasHost.openNpc('durnan'));const person=page.locator('#story-drawer .story-section').filter({has:page.getByRole('heading',{name:'Recurring people',exact:true})}).locator('select');await person.waitFor();assert.equal(await person.inputValue(),'durnan');
  await page.evaluate(()=>ECHO_STORY_UI.close());await page.evaluate(()=>__atlasHost.openNpc('missing-atlas-person'));assert.equal(await person.isVisible(),false);await unchanged(before,'Preparation changed campaign or public state');pass('Saved person links select the intended record; missing contacts do not select or create another person');
  phase='capture focused preparation view';await open('town-leilon');await page.getByRole('button',{name:'Expand atlas',exact:true}).click();await page.getByText('Run this stop',{exact:true}).click();await page.getByText('Run this stop',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'Preparation-DM-Stop.png')});
  await open('wd-map-mending-neighborhood');await page.evaluate(async()=>{const src=document.querySelector('.atlas-map-section .atlas-viewport image')?.getAttribute('href');if(src){const image=new Image();image.src=src;await image.decode();}});await page.screenshot({path:path.join(out,'Preparation-DM-Neighborhood.png')});
  assert.deepEqual(errors,[]);await unchanged(before,'Preparation changed campaign or public state');pass('Opening and following private preparation leaves all campaign and public state unchanged');
  const result={passed:true,auditDate:new Date().toISOString(),isolation:'Fresh Chrome profile and temporary loopback service; original backup read-only; no live endpoint or restart',checks,screenshots:['atlas/Preparation-DM-Stop.png','atlas/Preparation-DM-Neighborhood.png'],physicalDevicesTested:false};fs.writeFileSync(path.join(out,'Preparation-UI-Verification.json'),JSON.stringify(result,null,2)+'\n');fs.rmSync(path.join(out,'Preparation-UI-Failure.png'),{force:true});console.log(JSON.stringify(result));
}catch(e){if(page)try{await page.screenshot({path:path.join(out,'Preparation-UI-Failure.png')});}catch{}fs.writeFileSync(path.join(out,'Preparation-UI-Verification.json'),JSON.stringify({passed:false,phase,error:e.stack,checks,errors},null,2)+'\n');throw e;}finally{await browser?.close();server?.kill('SIGTERM');}})().catch(e=>{console.error('FAILED '+phase);console.error(e);process.exitCode=1;});

/* Full browser rehearsal in fresh profiles and temporary loopback services. Never contacts the live table. */
const {chromium, request} = require('playwright');
const {spawn} = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const app = path.resolve(__dirname, '..'), output = path.join(app, 'atlas');
const floorVisual=process.argv.includes('--floor-visual'),floorSmoke=process.argv.includes('--floor-smoke'),floor = floorVisual||floorSmoke||process.argv.includes('--floor'), waterdeep = process.argv.includes('--waterdeep'), subject = floor ? 'Dungeon runtime' : waterdeep ? 'Waterdeep rooms' : 'Redbrand';
const proposalId = waterdeep ? 'waterdeep-proposal-mending-lodging' : 'phandelver-proposal-redbrand-hideout-full';
const reportName = floorVisual?'Floor-Visual-Verification.json':floorSmoke?'Runtime-Smoke-Verification.json':floor ? 'Runtime-Workflow-Verification.json' : waterdeep ? 'Waterdeep-Workflow-Verification.json' : 'Workflow-Verification.json';
const checks = [], screenshots = [], errors = [], servers = [], rasterSnapshots = [], interiorSnapshots = [];
let phase = 'starting isolated services', browser, page, api, phoneAPI, base, phoneBase;
function server(script) {
  const child = spawn('/usr/bin/python3', ['-u', path.join(__dirname, script)], {env: {...process.env, PYTHONDONTWRITEBYTECODE: '1'}, stdio: ['ignore', 'pipe', 'pipe']});
  servers.push(child); let stderr = ''; child.stderr.on('data', bytes => stderr += bytes);
  return new Promise((resolve, reject) => {
    child.stdout.once('data', bytes => resolve('http://127.0.0.1:' + Number(String(bytes).trim())));
    child.once('exit', code => reject(Error(`${script}: ${code}: ${stderr.slice(-1500)}`)));
  });
}
const pass = (name, detail) => { checks.push({name, passed: true, ...(detail ? {detail} : {})}); console.log('PASS ' + name); };
async function screenshot(target, name) { if(floor)name=name.replace('Workflow-',floorVisual?'Floor-Visual-':floorSmoke?'Workflow-Runtime-Smoke-':'Workflow-Runtime-');else if(waterdeep)name=name.replace('Workflow-','Workflow-Waterdeep-');await target.screenshot({path: path.join(output, name)}); screenshots.push('atlas/' + name); }
async function setup(context, capture = true) {
  await context.route('**/*', route => {
    const url = route.request().url();
    if(floorSmoke&&url.endsWith('/atlas/tactical/runtime-smoke.svg'))return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(path.join(app,'atlas/tactical/redbrand-hideout-full.svg'))});
    return [base, phoneBase].includes(new URL(url).origin) || /^(blob|data):/.test(url) ? route.continue() : route.abort();
  });
  if(floorSmoke&&capture)await context.addInitScript(()=>{
    const image='atlas/tactical/runtime-smoke.svg',master='undermountain-proposal-level-1';
    const maps=[{id:master,sceneId:'runtime-smoke-floor',title:'Rehearsal floor',playerTitle:'Dungeon floor',isFloorMaster:true,proposalImage:image,viewBox:[0,0,1200,800],floorFog:{cols:300,rows:200},scale:{gridColumns:240,tacticalMeasurement:true},publicImageApproved:true,reviewNeeded:true},
      ...[[0,0,400,266.6667],[400,266.6667,400,266.6667],[800,533.3333,400,266.6667]].map((box,i)=>({id:'runtime-smoke-section-'+i,sceneId:'runtime-smoke-section-'+i,title:'Rehearsal section '+i,playerTitle:'Dungeon section',floorProposalId:master,proposalImage:image,sectionBounds:box,viewBox:box,publicImageApproved:true,scale:{gridColumns:80,tacticalMeasurement:true}}))];
    let collection;Object.defineProperty(window,'UNDERMOUNTAIN_MAP_COLLECTION',{configurable:true,get:()=>collection,set:value=>{collection={...value,maps};}});
    let data;Object.defineProperty(window,'ECHO_ATLAS_DATA',{configurable:true,get:()=>data,set:value=>{data=value;for(const m of maps)data.boards.push({id:m.sceneId,title:m.title,parentId:m.isFloorMaster?'site-undermountain':'runtime-smoke-floor',kind:m.isFloorMaster?'dungeon':'section',image,publicImage:image,publicImageApproved:true,viewBox:m.viewBox,locationId:'loc-undermountain',locationIds:[],proposalId:m.id,children:[],publicTitle:m.playerTitle,publicId:'smoke-public-'+m.sceneId});}});
  });
  if (capture) await context.addInitScript(() => {
    for (const [key, captureName] of [['ECHO_ATLAS_UI','__atlasHost'], ['ECHO_PHONE','__phoneHost'], ['ECHO_CAMPAIGN_ASSISTANT_UI','__auditHost'], ['ECHO_VOICE_STUDIO','__studio'], ['ECHO_STORY_UI','__storyHost'], ['ECHO_TRAVEL_UI','__travelHost'], ['ECHO_DUNGEON_UI','__dungeonHost'], ['ECHO_ATMOSPHERE_UI','__effectsHost'], ['ECHO_MAP_UI','__mapHost'], ['ECHO_GUIDED','__guidedHost'], ['ECHO_COMBAT_UI','__combatHost'], ['ECHO_PARTY_UI','__partyHost'], ['ECHO_RELIABILITY','__reliabilityHost']]) {
      let api; Object.defineProperty(window, key, {configurable: true, get: () => api, set: value => { api = value; if (!value.init) return; const init = value.init; value.init = host => { window[captureName] = host; return init(host); }; }});
    }
  });
}
function watch(p, label) { p.setDefaultTimeout(18000); p.on('pageerror', error => errors.push({page: label, message: error.message})); p.on('dialog', dialog => dialog.accept()); }
async function browseSnapshot() {
  return page.evaluate(() => {
    const context = __auditHost.context(), extras = structuredClone(__atlasHost.extras()); delete extras.atlas;
    return JSON.stringify({state: context.state, story: context.story, rules: context.rules, extras});
  });
}
async function preservedState() {
  return page.evaluate(() => { const s = __auditHost.context().state; return structuredClone({scene:s.scene,scenes:s.scenes,tokens:s.tokens,party:s.party,turn:s.turn,sceneFog:s.sceneFog,map:s.map,travelPosition:__atlasHost.travel().position}); });
}
async function phoneSnapshot() { return page.evaluate(() => __phoneHost.snapshot()); }
async function pushPhone() {
  const snapshot = await phoneSnapshot(), response = await api.post(phoneBase + '/api/dm/state', {data: {snapshot}});
  assert.equal(response.status(), 200, await response.text()); return snapshot;
}
async function atlasBoard(id) { await page.evaluate(id => ECHO_ATLAS_UI.open({boardId:id}), id); await page.locator('.campaign-atlas > h2').waitFor(); }
async function locate(id) {
  const place = await page.evaluate(id => ECHO_ATLAS_DATA.locations.find(p => p.id === id), id); assert(place, id);
  if(await page.evaluate(id=>ECHO_TRAVEL.known(ECHO_TRAVEL_UI.status(id)),place.travelId))return;
  await page.evaluate(id => ECHO_TRAVEL_UI.open(id), place.travelId);
  const details = page.locator('.travel-dialog .travel-body > details').filter({has:page.locator('summary', {hasText:new RegExp('^' + place.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ' ·')})});
  await details.locator('select').first().selectOption('located');
  await page.locator('.travel-dialog').getByRole('button', {name:'Close', exact:true}).click();
  assert.equal(await page.evaluate(id => ECHO_TRAVEL_UI.status(id).status, place.travelId), 'located');
}
async function assertPublicBoundary(payload) {
  assert(payload, 'An approved atlas payload is required');
  const hidden = await page.evaluate(() => ECHO_ATLAS_DATA.locations.filter(p => ECHO_ATLAS.state(p,__atlasHost.travel()).status==='hidden').map(p=>({id:p.id,name:p.name})));
  const encoded = JSON.stringify(payload);
  for (const p of hidden) assert(!payload.places.some(x=>x.id===p.id), 'Hidden record escaped: ' + p.id);
  assert(!/proposalAreas|sourceRefs|dmDescription|sourceIds|NineprivateData|Topology-DM|private-maps|cartographyClass|cartographyConfidence|localPlacementValidation|permissionRequired|permissionReviewed|presumptions/.test(encoded), 'Private atlas metadata escaped');
  assert(payload.rumors.every(r=>Object.keys(r).sort().join(',')==='status,title'));
  assert((payload.features||[]).every(f=>f.public===true&&f.sourceApproved===true&&['terrain','water','road'].includes(f.kind)));
  const privateFeatureIds=await page.evaluate(()=>ECHO_ATLAS_DATA.boards.flatMap(b=>b.features||[]).filter(f=>f.public!==true||f.sourceApproved!==true).map(f=>f.id));assert(!(payload.features||[]).some(f=>privateFeatureIds.includes(f.id)),'Private room or planning label escaped');
  const known = new Set(payload.places.map(p=>p.id)); assert(payload.routes.every(r=>known.has(r.from)&&known.has(r.to)));
}
async function waitRaster() {
    await page.waitForFunction(()=>/^data:image\/(?:png|jpeg);base64,/.test(__phoneHost.snapshot().atlas?.board.image||''));
    await page.waitForFunction(async()=>{
      const source=__phoneHost.snapshot().atlas?.board.image;if(!/^data:image\/(?:png|jpeg);base64,/.test(source||''))return false;
      const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=source;});
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,32,32);const p=ctx.getImageData(0,0,32,32).data;
      for(let i=4;i<p.length;i+=4)if(p[i]!==p[0]||p[i+1]!==p[1]||p[i+2]!==p[2])return true;return false;
    });
}
async function waitPhoneArt(phone) {
  await phone.waitForFunction(async()=>{
    const href=document.querySelector('#phone-atlas svg image')?.getAttribute('href');if(!href)return false;
    const image=new Image();image.src=href;try{await image.decode();return image.naturalWidth>0&&image.naturalHeight>0;}catch{return false;}
  });
  await phone.locator('.phone-atlas-card').evaluate(node=>node.scrollIntoView({block:'start'}));
  await phone.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function load(target, archive) {
  await target.goto(base + '/output/campaign/Session-01-TV-Display.html'); await target.locator('.cockpit-nav').waitFor();
  await target.locator('#load-campaign-file').setInputFiles(archive);
  await target.waitForFunction(() => document.getElementById('toast').textContent.includes('Restored'));
}
(async () => {
  try {
    [base, phoneBase] = await Promise.all([server('ai-rehearsal-server.py'), server('rehearsal-phone-server.py')]);
    api = await request.newContext({extraHTTPHeaders:{Origin:'http://127.0.0.1:48261'}});
    browser = await chromium.launch({headless:true,channel:'chrome'});
    const context = await browser.newContext({viewport:{width:1550,height:1100}}); await setup(context);
    page = await context.newPage(); watch(page,'DM');
    phase = 'restore backup and create practice campaign';
    await load(page, path.join(app,'../releases/Echo-Below-Package-Backup.json'));
    await page.getByRole('button',{name:'Settings',exact:true}).click(); await page.getByRole('button',{name:'Create practice campaign',exact:true}).click();
    await page.waitForFunction(() => __studio.practice() && __atlasHost && __phoneHost);
    assert.equal(await page.evaluate(() => __auditHost.context().state.sessionKind), 'custom');
    pass('Backup restored into fresh browser and copied to practice');
    const tvPromise = context.waitForEvent('page'); await page.evaluate(() => document.getElementById('open-player').click()); const tv = await tvPromise; watch(tv,'TV');
    await tv.locator('#player-stage').waitFor();
    assert.equal(await tv.evaluate(() => !!window.ECHO_ATLAS_DATA || !!window.ECHO_ATLAS_UI || !!window.PHANDELVER_MAP_COLLECTION || !!window.WATERDEEP_MAP_COLLECTION), false);
    if(floor){
      phase='isolated floor runtime';
      await require(floorVisual?'./atlas-floor-visual-rehearsal.cjs':'./atlas-runtime-rehearsal.cjs')({page,tv,browser,context,app,output,base,phoneBase,api,pass,screenshot,watch,setup,load,preservedState,phoneSnapshot,pushPhone,atlasBoard,locate,assertPublicBoundary,waitRaster,waitPhoneArt});
      assert.deepEqual(errors,[]);pass(floorVisual?'No browser exceptions in the focused DM/TV check':'No browser exceptions across runtime, TV, phone and restored campaign');
      const result={passed:true,auditDate:new Date().toISOString(),smokeFixture:floorSmoke,isolation:'Fresh browser contexts and temporary loopback services; original backup read-only; no live service contact or restart',checks,screenshots,physicalDevicesTested:false,limitations:floorVisual?['This narrow check covers DM floor shading and the private route diagram; Runtime-Workflow-Verification.json covers the full workflow.','Physical display and touch devices were not used.']:[...(floorSmoke?['Injected smoke geometry tests runtime only; it is not evidence of the final Undermountain artwork.']:[]),'Desktop Chrome emulates touch and reduced motion; physical TV alignment, speakers, phones and Wi-Fi still need a table check.','New source floor remains a manually revealed layout; artwork is not an automatic wall or gate rules engine.']};
      fs.writeFileSync(path.join(output,reportName),JSON.stringify(result,null,2)+'\n');fs.rmSync(path.join(output,floorVisual?'Floor-Visual-Failure.png':floorSmoke?'Workflow-Runtime-Smoke-Failure.png':'Workflow-Runtime-Failure.png'),{force:true});console.log(JSON.stringify(result));return;
    }
    const initial = await browseSnapshot(), original = await preservedState();
    phase = 'browse world and remember zoom and pan';
    await page.getByRole('button',{name:'World',exact:true}).click(); await page.locator('#open-campaign-atlas').click();
    await page.getByRole('button',{name:'Zoom in',exact:true}).click();
    const viewport = page.locator('.atlas-map-section > .atlas-viewport').first(), box = await viewport.boundingBox(); assert(box);
    await page.mouse.move(box.x+box.width*.52,box.y+box.height*.6); await page.mouse.down(); await page.mouse.move(box.x+box.width*.52+42,box.y+box.height*.6+29,{steps:4}); await page.mouse.up();
    const remembered = await page.evaluate(() => structuredClone(__atlasHost.extras().atlas.views.world)); assert(remembered.zoom > 1); assert(remembered.panX || remembered.panY);
    assert.equal(await browseSnapshot(),initial,'Passive atlas browsing changed campaign core or other extras');
    pass('World browsing, zoom and pan only save atlas view settings',remembered);
    phase = 'stage world and verify private/public boundary';
    assert.equal((await phoneSnapshot()).atlas,null); await page.getByRole('button',{name:'Stage player view',exact:true}).click();
    assert.equal((await phoneSnapshot()).atlas,null,'Staging must not publish');
    await page.getByRole('button',{name:'Show staged view on TV',exact:true}).click(); await tv.locator('#player-atlas svg').waitFor();
    const worldPayload=(await phoneSnapshot()).atlas;
    await assertPublicBoundary(worldPayload); pass('Stage is private; explicit Show shares sanitized world');
    const labeled=worldPayload.places.filter(p=>Number.isFinite(p.labelX)&&Number.isFinite(p.labelY));assert(labeled.length,'Published known places should use the approved label positions');
    assert(await tv.evaluate(places=>places.every(p=>{const label=[...document.querySelectorAll('#player-atlas svg text')].find(n=>n.textContent===p.title);return label&&Number(label.getAttribute('x'))===p.labelX&&Number(label.getAttribute('y'))===p.labelY&&label.getAttribute('text-anchor')==='start';}),labeled));
    const roadProjection=await page.evaluate(()=>{
      const data=ECHO_ATLAS_DATA,travel=structuredClone(__atlasHost.travel()),route=data.routes.find(r=>r.boardId==='world'&&r.public&&r.travelRouteId);
      if(!route)throw Error('No public world route available for isolated projection test');
      const a=ECHO_ATLAS.location(data,route.from),b=ECHO_ATLAS.location(data,route.to),leg=travel.routes.find(r=>r.id===route.travelRouteId);
      if(!leg)throw Error('Atlas route has no shared travel definition');
      for(const p of [a,b])travel.places.find(r=>r.id===p.travelId).status='located';leg.published=true;leg.miles=20;
      travel.position={visible:true,placeId:''};travel.plan={started:true,leg:0,miles:5,legs:[{routeId:leg.id,from:a.travelId,to:b.travelId}]};
      const raw=ECHO_ATLAS.publicProjection(data,travel,'world'),clean=ECHO_ATLAS_VIEW.normalize({...raw,position:{...raw.position,x:999999,y:999999}});
      return {raw,clean,expected:{x:raw.places.find(p=>p.id===a.id).x*.75+raw.places.find(p=>p.id===b.id).x*.25,y:raw.places.find(p=>p.id===a.id).y*.75+raw.places.find(p=>p.id===b.id).y*.25}};
    });
    assert.equal(roadProjection.clean.position.fraction,.25);assert.equal(roadProjection.clean.position.title,'On the road');assert(Math.abs(roadProjection.clean.position.x-roadProjection.expected.x)<1e-8);assert(Math.abs(roadProjection.clean.position.y-roadProjection.expected.y)<1e-8);
    pass('Approved label positions render with leaders; cloned travel projection safely places the party on a public route');
    phase = 'repeat TV sync and return to underlying live scene';
    await tv.evaluate(() => window.__firstAtlasSVG = document.querySelector('#player-atlas svg'));
    await page.evaluate(() => __atlasHost.show(__phoneHost.snapshot().atlas));
    await tv.waitForTimeout(250); assert(await tv.evaluate(() => __firstAtlasSVG===document.querySelector('#player-atlas svg')),'Repeated sync recreated the TV image');
    await screenshot(tv,'Workflow-TV-World.png');
    await page.getByRole('button',{name:'Return TV to live scene',exact:true}).click(); await tv.waitForFunction(() => document.getElementById('player-atlas').hidden);
    assert.equal((await phoneSnapshot()).public.scene,original.scene); pass('Repeated TV sync preserves image; Return to map restores underlying scene');
    phase = 'world to region to settlement to '+subject+' hidden gate';
    const proposal=await page.evaluate(id=>ECHO_ATLAS.proposal(id),proposalId);assert(proposal,'Target proposal missing');
    const target = await page.evaluate(id => ECHO_ATLAS_DATA.boards.find(b=>b.proposalId===id)?.id,proposalId); assert(target,subject+' board missing');
    const chain = await page.evaluate(id => ECHO_ATLAS.breadcrumbs(ECHO_ATLAS_DATA,id).map(b=>({id:b.id,title:b.title,locationId:b.locationId})),target);
    await atlasBoard('world'); const beforeChain = await browseSnapshot();
    for (const child of chain.slice(1)) {
      await page.locator('.atlas-child-boards').getByRole('button',{name:child.title,exact:true}).click();
      assert.equal(await page.evaluate(() => ECHO_ATLAS_UI.current().boardId),child.id);
    }
    assert(await page.getByRole('button',{name:'Stage player view',exact:true}).isDisabled());
    assert(await page.getByRole('button',{name:'Prepare separate battle map',exact:true,includeHidden:true}).isDisabled());
    assert.equal(await browseSnapshot(),beforeChain,'Drill-down changed campaign state');
    pass('Full published hierarchy drills down privately; hidden '+subject+' cannot stage',chain.map(x=>x.id));
    phase = 'mark discovery in practice travel and stage '+subject;
    for (const id of [...new Set(chain.map(b=>b.locationId).filter(Boolean))]) await locate(id);
    assert(!(await page.locator('.atlas-stage').innerText()).includes('Locate this place in Journey & travel'),'Discovery save did not refresh the open atlas gate');
    if(waterdeep){
      phase='share city and settlement overviews through compatible raster payloads';
      const beforeSourceDetails=await browseSnapshot();
      await page.evaluate(()=>ECHO_ATLAS_UI.open({boardId:'city-waterdeep',locationId:'loc-yawning-portal'}));
      assert.equal(await page.locator('.atlas-source-badge').textContent(),'Published location');assert.match(await page.locator('.atlas-location-details').innerText(),/printed p\.|Printed p\./);
      await page.evaluate(()=>ECHO_ATLAS_UI.open({boardId:'city-waterdeep',locationId:'loc-mending-court'}));
      assert.equal(await page.locator('.atlas-source-badge').textContent(),'Campaign addition · proposed placement');assert.match(await page.locator('.atlas-location-details').innerText(),/Placement confidence/);
      assert.equal(await browseSnapshot(),beforeSourceDetails);pass('DM location details visibly distinguish published anchors and proposed campaign placements with source and confidence');
      await atlasBoard('wd-map-mending-neighborhood');await page.getByText('Map layout & saved-map review',{exact:true}).click();await page.getByText('Entrances & return routes',{exact:true}).click();
      const portal=await page.evaluate(()=>ECHO_ATLAS_DATA.boards.find(b=>b.id==='wd-map-yawning-portal'));assert(portal);
      await page.getByRole('button',{name:'Open connected map: '+portal.title,exact:true}).click();assert.equal(await page.evaluate(()=>ECHO_ATLAS_UI.current().boardId),portal.id);
      assert.equal(await browseSnapshot(),beforeSourceDetails);pass('Neighborhood route opens the connected tavern atlas privately without creating scenes or recording movement');
      const boards=await page.evaluate(()=>ECHO_ATLAS_DATA.boards.filter(b=>ECHO_ATLAS.rasterSource(b.publicImage)).map(b=>({id:b.id,locationId:b.locationId,title:b.title})));
      assert.deepEqual(boards.map(b=>b.id).sort(),['city-waterdeep','town-leilon','city-neverwinter','city-luskan','town-daggerford','city-baldurs-gate','town-leilon-plan'].sort(),'Waterdeep city, five settlement overviews and the retained Leilon plan are required');
      for(const board of boards){
        await locate(board.locationId);await atlasBoard(board.id);const beforeOverview=await preservedState();
        assert.equal((await phoneSnapshot()).atlas,null);await page.getByRole('button',{name:'Stage player view',exact:true}).click();assert.equal((await phoneSnapshot()).atlas,null);
        await page.getByRole('button',{name:'Show staged view on TV',exact:true}).click();await waitRaster();
        const snapshot=await phoneSnapshot();await assertPublicBoundary(snapshot.atlas);assert(!JSON.stringify(snapshot.atlas).includes('atlas/art/Waterdeep-City-Terrain.png'));assert(!JSON.stringify(snapshot.atlas).includes('atlas/settlements/'));
        assert.deepEqual(await preservedState(),beforeOverview,'Overview sharing changed battle state');rasterSnapshots.push({id:board.id,snapshot});
        if(board.id==='city-waterdeep'){await tv.waitForFunction(title=>document.querySelector('#player-atlas svg')?.getAttribute('aria-label')===title,snapshot.atlas.board.title);await screenshot(tv,'Workflow-TV-City.png');}
        await page.getByRole('button',{name:'Return TV to live scene',exact:true}).click();
      }
      pass('Waterdeep city, five settlement overviews and the Leilon plan share as raster images without changing combat, fog, tokens or position',rasterSnapshots.map(row=>({id:row.id,snapshotBytes:Buffer.byteLength(JSON.stringify(row.snapshot))})));
      const bindery=await page.evaluate(()=>ECHO_ATLAS_DATA.boards.find(b=>b.proposalId==='waterdeep-proposal-mending-bindery'));assert(bindery,'Reviewed binding workroom is missing');
      await atlasBoard('wd-map-mending-court');const beforeBindery=await preservedState();
      await page.locator('.atlas-child-boards').getByRole('button',{name:bindery.title,exact:true}).click();assert.equal(await page.evaluate(()=>ECHO_ATLAS_UI.current().boardId),bindery.id);
      assert(await page.getByRole('button',{name:'Stage player view',exact:true}).isDisabled());assert(await page.getByRole('button',{name:'Prepare separate battle map',exact:true,includeHidden:true}).isDisabled());
      await page.getByRole('checkbox',{name:'Players have permission to see these rooms',exact:true}).check();await page.getByRole('button',{name:'Stage player view',exact:true}).click();assert.equal((await phoneSnapshot()).atlas,null);
      await page.getByRole('button',{name:'Show staged view on TV',exact:true}).click();await waitRaster();
      const workroom=await phoneSnapshot();await assertPublicBoundary(workroom.atlas);assert(!JSON.stringify(workroom.atlas).includes('atlas/tactical/'));assert.deepEqual(await preservedState(),beforeBindery);
      interiorSnapshots.push({id:bindery.id,snapshot:workroom});await tv.waitForFunction(title=>document.querySelector('#player-atlas svg')?.getAttribute('aria-label')===title,workroom.atlas.board.title);await screenshot(tv,'Workflow-TV-Bindery.png');
      await page.getByRole('button',{name:'Return TV to live scene',exact:true}).click();pass('Courtyard connects to the binding workroom, with permission required before private staging and explicit sharing');
    }
    await atlasBoard(target);
    const gate = await page.evaluate(id=>ECHO_ATLAS.gate(ECHO_ATLAS_DATA,__atlasHost.travel(),id),target); assert(gate.allowed,gate.reason);
    if(waterdeep){assert(chain.some(b=>b.id==='city-waterdeep'));assert(chain.some(b=>b.id==='wd-map-mending-neighborhood'));assert(chain.some(b=>b.id==='wd-map-mending-court'));}
    const needsPermission=await page.evaluate(id=>ECHO_ATLAS.permissionRequired(ECHO_ATLAS_DATA,id),target);
    if(needsPermission){const beforeReview=await browseSnapshot();assert(await page.getByRole('button',{name:'Stage player view',exact:true}).isDisabled());assert(await page.getByRole('button',{name:'Prepare separate battle map',exact:true,includeHidden:true}).isDisabled());await page.getByRole('checkbox',{name:'Players have permission to see these rooms',exact:true}).check();assert.equal(await browseSnapshot(),beforeReview,'Room permission review wrote tenancy or other campaign records');pass('Private room access requires explicit transient review without inferring tenancy or ownership');}
    const beforeStage = await preservedState();
    await page.getByRole('button',{name:'Stage player view',exact:true}).click(); assert.equal((await phoneSnapshot()).atlas,null);
    await page.getByRole('button',{name:'Show staged view on TV',exact:true}).click();
    await waitRaster();
    const fullTactical=(await phoneSnapshot()).atlas;
    assert.notEqual(fullTactical.board.id,target,'Public tactical board must use an opaque ID');
    assert(!JSON.stringify(fullTactical).includes('atlas/tactical/'),'Full shared atlas disclosed a tactical filename');
    await tv.waitForFunction(title => document.querySelector('#player-atlas svg')?.getAttribute('aria-label')===title,fullTactical.board.title);
    assert.deepEqual(await preservedState(),beforeStage,'Atlas Stage/Show changed combat, party, fog, maps or travel position');
    await assertPublicBoundary((await phoneSnapshot()).atlas); await screenshot(page,'Workflow-DM-'+(waterdeep?'Rooms':'Redbrand')+'.png'); await screenshot(tv,'Workflow-TV-'+(waterdeep?'Rooms':'Redbrand')+'.png');
    pass('Practice discovery enables reviewed '+subject+' Stage/Show while preserving battle state');
    phase = 'join isolated phone and view Explore atlas';
    const opened = await api.post(phoneBase+'/api/dm/open',{data:{}}); assert.equal(opened.status(),200); const join = await opened.json();
    const snapshot = await pushPhone(); const pc = Object.entries(snapshot.characters)[0]; assert(pc);
    const phoneContext = await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true}); await setup(phoneContext,false); phoneAPI = phoneContext.request;
    const phone = await phoneContext.newPage(); watch(phone,'phone'); await phone.goto(phoneBase+'/join?code='+join.code);
    await phone.locator('#character-choices').getByRole('button',{name:pc[1].name,exact:true}).click(); await phone.locator('#tab-explore').click();
    await phone.locator('#phone-atlas svg').waitFor(); await phone.waitForFunction(title => document.getElementById('phone-atlas-title').textContent===title,fullTactical.board.title);
    await phone.evaluate(() => window.__firstAtlasSVG = document.querySelector('#phone-atlas svg'));
    await pushPhone(); await phone.waitForResponse(response=>response.url().includes('/api/state')&&response.status()===200); await phone.waitForTimeout(100);
    assert(await phone.evaluate(() => __firstAtlasSVG===document.querySelector('#phone-atlas svg')),'Repeated phone sync recreated image');
    await phone.locator('#phone-atlas').click({position:{x:35,y:45}}); await phone.waitForTimeout(100);
    const events = await (await api.get(phoneBase+'/api/dm/events')).json(); assert(!events.events.some(e=>e.kind==='move'),'Atlas click emitted token movement');
    const view = await (await phoneAPI.get(phoneBase+'/api/state')).json(); await assertPublicBoundary(view.atlas); assert(!JSON.stringify(view.atlas).includes('atlas/tactical/'));const image = await phoneAPI.get(phoneBase+view.atlasImage); assert.equal(image.status(),200); assert.equal(image.headers()['content-type'],'image/png');
    if(waterdeep){
      for(const overview of [...rasterSnapshots,...interiorSnapshots]){
        const response=await api.post(phoneBase+'/api/dm/state',{data:{snapshot:overview.snapshot}});assert.equal(response.status(),200,overview.id+': '+await response.text());
        const state=await(await phoneAPI.get(phoneBase+'/api/state')).json();assert.equal(state.atlas.board.id,overview.snapshot.atlas.board.id);assert(/^data:image\/(?:png|jpeg);base64,/.test(state.atlas.board.image));await assertPublicBoundary(state.atlas);
        const raster=await phoneAPI.get(phoneBase+state.atlasImage);assert.equal(raster.status(),200);const mime=state.atlas.board.image.startsWith('data:image/jpeg;')?'image/jpeg':'image/png';assert.equal(raster.headers()['content-type'],mime);const bytes=await raster.body();assert.deepEqual(bytes,Buffer.from(state.atlas.board.image.split(',')[1],'base64'));if(mime==='image/jpeg')assert.deepEqual([...bytes.subarray(0,3)],[255,216,255]);else assert.equal(bytes.subarray(1,4).toString(),'PNG');
        if(overview.id==='city-waterdeep'){await phone.waitForFunction(title=>document.getElementById('phone-atlas-title').textContent===title,state.atlas.board.title);await waitPhoneArt(phone);await screenshot(phone,'Workflow-Phone-City.png');}
        if(overview.id==='wd-map-mending-bindery'){await phone.waitForFunction(title=>document.getElementById('phone-atlas-title').textContent===title,state.atlas.board.title);await waitPhoneArt(phone);await screenshot(phone,'Workflow-Phone-Bindery.png');}
      }
      await pushPhone();pass('Existing phone API accepts all seven overview rasters and the reviewed workroom without new static paths or a service restart');
    }
    const roadSnapshot={...snapshot,atlas:roadProjection.raw,public:{...snapshot.public,atlas:roadProjection.raw}};assert.equal((await api.post(phoneBase+'/api/dm/state',{data:{snapshot:roadSnapshot}})).status(),200);
    const roadPhone=await(await phoneAPI.get(phoneBase+'/api/state')).json();assert.deepEqual(roadPhone.atlas.position,roadProjection.clean.position);assert(roadPhone.atlas.places.some(p=>Number.isFinite(p.labelX)));await pushPhone();
    pass('Phone API preserves only validated route interpolation and approved label positions');
    for (const blocked of ['/Campaign-Atlas-Data.js','/Waterdeep-Map-Collection.js','/atlas/tactical/Phandelver-Tactical-Topology-DM.json','/atlas/tactical/Waterdeep-Tactical-Topology-DM.json','/map-audit/Location-Register.json','/'+proposal.proposalImage]) assert.equal((await phoneAPI.get(phoneBase+blocked)).status(),404,blocked);
    const sharedJS=await phoneAPI.get(phoneBase+'/atlas-view.js');assert.equal(sharedJS.status(),200);assert(!/atlas\/tactical|wave-echo-forge|thundertree-tower|(?:PHANDELVER|WATERDEEP)_MAP_COLLECTION/.test(await sharedJS.text()),'Public renderer source disclosed the private tactical catalog');
    await phone.waitForFunction(title=>document.getElementById('phone-atlas-title').textContent===title,fullTactical.board.title);
    await waitPhoneArt(phone);await screenshot(phone,'Workflow-Phone-Explore.png'); pass('Simulated phone joins Explore, receives an opaque raster atlas and emits no movement from atlas clicks');
    phase = 'prepare separate battle map while preserving original scene records';
    await atlasBoard(target); const priorPrepare = await preservedState();
    if(needsPermission){assert(await page.getByRole('button',{name:'Prepare separate battle map',exact:true,includeHidden:true}).isDisabled());await page.getByRole('checkbox',{name:'Players have permission to see these rooms',exact:true}).check();}
    await page.getByText(waterdeep?'Map layout & saved-map review':'Corrected layout & saved-map review',{exact:true}).click();
    if(waterdeep){await page.getByText('Entrances & return routes',{exact:true}).click();assert.match(await page.locator('.campaign-atlas').innerText(),/Source|Reference/);await screenshot(page,'Workflow-DM-Room-Review.png');}
    await page.getByRole('button',{name:'Prepare separate battle map',exact:true}).click();
    const afterPrepare = await preservedState(), added=afterPrepare.scenes.filter(s=>!priorPrepare.scenes.some(old=>old.id===s.id));
    assert.equal(added.length,1);const variant=added[0].id;assert(variant.startsWith('atlas-source-'));assert.equal(added[0].image,proposal.proposalImage);
    assert.equal(afterPrepare.scene,priorPrepare.scene); assert.deepEqual(afterPrepare.tokens,priorPrepare.tokens); assert.deepEqual(afterPrepare.party,priorPrepare.party); assert.deepEqual(afterPrepare.turn,priorPrepare.turn); assert.deepEqual(afterPrepare.travelPosition,priorPrepare.travelPosition);
    assert.equal(afterPrepare.scenes.length,priorPrepare.scenes.length+1); for(const scene of priorPrepare.scenes)assert.deepEqual(afterPrepare.scenes.find(s=>s.id===scene.id),scene);
    for(const [id,fog]of Object.entries(priorPrepare.sceneFog))assert.deepEqual(afterPrepare.sceneFog[id],fog); for(const [id,map]of Object.entries(priorPrepare.map.scenes))assert.deepEqual(afterPrepare.map.scenes[id],map);
    assert.deepEqual(afterPrepare.sceneFog[variant],[]); assert(afterPrepare.scenes.find(s=>s.id===variant)?.fog);
    pass('Separate battle-map preparation preserves all original IDs, fog, maps, party and tokens');
    phase = 'show fog-covered variant and verify safe raster on TV and phone';
    await page.locator('#context-scene').getByRole('button',{name:'Show on TV',exact:true}).click();
    await page.waitForFunction(id=>__auditHost.context().state.scene===id,variant); const masked=await pushPhone();
    assert.equal(masked.atlas,null); assert(masked.public.presentation.sceneImage.startsWith('data:image/png;base64,')); assert(!JSON.stringify(masked.public).includes('atlas/tactical/'),'Raw tactical art escaped public state');
    const blank = await page.evaluate(async source=>{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=source;});const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;for(let i=4;i<p.length;i+=4)if(p[i]!==p[0]||p[i+1]!==p[1]||p[i+2]!==p[2]||p[i+3]!==p[3])return false;return true;},masked.public.presentation.sceneImage); assert(blank,'Unrevealed variant contains visible floor geometry');
    await tv.waitForFunction(()=>document.getElementById('player-atlas').hidden); const battleImage=await phoneAPI.get(phoneBase+'/api/map'); assert.equal(battleImage.status(),200); assert.equal(battleImage.headers()['content-type'],'image/png'); assert.deepEqual(await battleImage.body(),Buffer.from(masked.public.presentation.sceneImage.split(',')[1],'base64'));
    await screenshot(tv,'Workflow-TV-Fogged-Variant.png'); pass('Explicit variant show uses a fully fogged raster on TV/phone, with no raw tactical path');
    phase = 'reload remembered atlas view and restore exported backup in another fresh profile';
    await page.reload(); await page.locator('.cockpit-nav').waitFor(); await atlasBoard('world');
    assert.deepEqual(await page.evaluate(()=>__atlasHost.extras().atlas.views.world),remembered); assert.equal(await page.locator('.atlas-zoom-label').textContent(),Math.round(remembered.zoom*100)+'%');
    const downloadPromise=page.waitForEvent('download'); await page.evaluate(()=>document.getElementById('download-campaign').click()); const download=await downloadPromise,stream=await download.createReadStream(),parts=[];for await(const bytes of stream)parts.push(bytes);const archive=Buffer.concat(parts);const parsed=JSON.parse(archive);assert.deepEqual(parsed.tableExtras.atlas.views.world,remembered);
    const restoredContext=await browser.newContext({viewport:{width:1550,height:1100}});await setup(restoredContext);const restored=await restoredContext.newPage();watch(restored,'restored');await load(restored,{name:'isolated-atlas-backup.json',mimeType:'application/json',buffer:archive});
    assert.deepEqual(await restored.evaluate(()=>__atlasHost.extras().atlas.views.world),remembered);assert(await restored.evaluate(id=>__auditHost.context().state.scenes.some(s=>s.id===id),variant));assert.deepEqual(await restored.evaluate(id=>__auditHost.context().state.sceneFog[id],variant),[]);
    pass('Saved zoom/pan and separate fog-covered variant survive reload and fresh-profile backup restore');
    assert.deepEqual(errors,[]); pass('No browser exceptions across DM, TV, phone and restored campaign');
    const result={passed:true,auditDate:new Date().toISOString(),isolation:'Fresh browser contexts; OS-assigned loopback ports; temporary AI store; original backup read-only; no live service contact or restart',checks,screenshots,physicalDevicesTested:false,limitations:['Desktop Chrome emulates a phone; physical TV, touch device and live table were not used.','Discovery changes and source-layout preparation occurred only in a throwaway practice campaign.']};
    fs.writeFileSync(path.join(output,reportName),JSON.stringify(result,null,2)+'\n');
    fs.rmSync(path.join(output,waterdeep?'Workflow-Waterdeep-Failure.png':'Workflow-Failure.png'),{force:true}); console.log(JSON.stringify(result));
  } catch(error) {
    if(page)try{await screenshot(page,'Workflow-Failure.png');}catch{}
    const result={passed:false,auditDate:new Date().toISOString(),phase,error:error.stack||String(error),checks,screenshots,browserErrors:errors,physicalDevicesTested:false};fs.writeFileSync(path.join(output,reportName),JSON.stringify(result,null,2)+'\n');throw error;
  } finally { await browser?.close(); await api?.dispose(); for(const child of servers)child.kill('SIGTERM'); }
})().catch(error=>{console.error('FAILED during '+phase);console.error(error);process.exitCode=1;});

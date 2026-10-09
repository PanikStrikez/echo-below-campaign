/* Extended runtime branch of check-atlas-workflow.cjs; shares its isolated harness. */
'use strict';
const assert=require('node:assert/strict');
module.exports=async function runtime(h){
  const {page,tv,browser,app,base,phoneBase,api,pass,screenshot,watch,setup,load,preservedState,phoneSnapshot,pushPhone,atlasBoard,locate,assertPublicBoundary,waitRaster,waitPhoneArt}=h;
  const closeDialogs=()=>page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();ECHO_STORY_UI.close();});
  async function knownBoard(id){const chain=await page.evaluate(id=>ECHO_ATLAS.breadcrumbs(ECHO_ATLAS_DATA,id),id);for(const location of new Set(chain.map(b=>b.locationId).filter(Boolean)))await locate(location);await atlasBoard(id);}
  async function share(id){await knownBoard(id);const permission=page.getByRole('checkbox',{name:'Players have permission to see these rooms',exact:true});if(await permission.count())await permission.check();const before=await preservedState();await page.getByRole('button',{name:'Stage player view',exact:true}).click();await page.getByRole('button',{name:'Show staged view on TV',exact:true}).click();await waitRasterIfNeeded();await assertPublicBoundary((await phoneSnapshot()).atlas);assert.deepEqual(await preservedState(),before);}
  async function waitRasterIfNeeded(){const p=(await phoneSnapshot()).atlas;if(p?.board.image.startsWith('atlas/tactical/')||p?.board.image.startsWith('data:'))await waitRaster();}
  async function hide(){await page.evaluate(()=>__atlasHost.hide());await tv.waitForFunction(()=>!document.getElementById('player-atlas')||document.getElementById('player-atlas').hidden);}
  async function blank(source){return page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;for(let i=4;i<p.length;i+=4)if(p[i]!==p[0]||p[i+1]!==p[1]||p[i+2]!==p[2])return false;return true;},source);}
  const master=await page.evaluate(()=>ECHO_ATLAS.proposal('undermountain-proposal-level-1'));assert(master?.isFloorMaster,'Final reviewed Undermountain floor collection is required');
  const floorBoard=await page.evaluate(id=>ECHO_ATLAS_DATA.boards.find(b=>b.proposalId===id)?.id,master.id);assert(floorBoard);
  const sections=await page.evaluate(id=>ECHO_ATLAS.proposals().filter(p=>p.floorProposalId===id),master.id);assert(sections.length>=2);

  // Use a sourced existing route in the throwaway campaign; no new distance is invented.
  const travel=await page.evaluate(()=>{
    const d=__atlasHost.travel(),r=d.routes.find(r=>Number.isFinite(r.miles)&&r.miles>0&&r.source);if(!r)throw Error('A sourced rehearsal route is required');
    for(const id of [r.from,r.to])ECHO_TRAVEL.place(d,id).status='located';d.plan=null;const a=ECHO_TRAVEL.place(d,r.from);d.position={x:a.x,y:a.y,placeId:a.id,visible:true};
    ECHO_TRAVEL.planTo(d,r.to);__travelHost.save('Rehearsal route staged');const before=JSON.stringify(__auditHost.context().state.party),review=ECHO_TRAVEL.previewTravel(d,.25);
    __travelHost.apply(ECHO_TRAVEL.apply(d,review),review.minutes,review.kind);if(before!==JSON.stringify(__auditHost.context().state.party))throw Error('Travel changed character resources');return {route:r.id,minutes:review.minutes};
  });
  await share('world');await screenshot(tv,'Workflow-TV-World-Travel.png');await hide();
  for(const id of ['waterdeep','city-waterdeep','wd-map-yawning-portal']){await share(id);if(id==='wd-map-yawning-portal')await screenshot(tv,'Workflow-TV-Conversation.png');await hide();}
  pass('Reviewed world travel, regional approach, city exploration and tavern conversation share explicitly without changing party resources',travel);

  // Join the temporary phone service and deliver a real request through the existing API.
  await share('city-waterdeep');const open=await api.post(phoneBase+'/api/dm/open',{data:{}});assert.equal(open.status(),200);const join=await open.json();let snapshot=await pushPhone();
  const pc=Object.entries(snapshot.characters)[0];assert(pc);const phoneContext=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});await setup(phoneContext,false);
  const phone=await phoneContext.newPage();watch(phone,'runtime phone');await phone.goto(phoneBase+'/join?code='+join.code);await phone.locator('#character-choices').getByRole('button',{name:pc[1].name,exact:true}).click();await phone.locator('#tab-explore').click();await waitPhoneArt(phone);
  const destination=snapshot.journey.places.find(p=>['located','visited','cleared'].includes(p.status)&&!p.inaccessible);assert(destination);
  const position=await page.evaluate(()=>structuredClone(__atlasHost.travel().position));
  const requested=await phoneContext.request.post(phoneBase+'/api/action',{headers:{Origin:phoneBase},data:{kind:'travel-request',requestId:'runtime-destination',destination:destination.id,note:'Rehearsal destination request'}});assert.equal(requested.status(),200);
  let events=await(await api.get(phoneBase+'/api/dm/events')).json();const request=events.events.find(e=>e.requestId==='runtime-destination');assert(request);await page.evaluate(e=>__phoneHost.onAction(e),request);
  assert.deepEqual(await page.evaluate(()=>__atlasHost.travel().position),position);assert(await page.evaluate(()=>__atlasHost.travel().requests.some(r=>r.id==='runtime-destination'&&r.status==='waiting')));
  await screenshot(phone,'Workflow-Phone-City-Explore.png');await hide();pass('Phone joins Explore and submits a destination request without moving the party');

  // Start or resume the one saved first-floor session through its existing expedition host.
  await page.evaluate(async()=>{const old=__storyHost.arcSessions()[0];if(old){await __storyHost.arcReturn(old.id);const r=__atlasHost.extras().expeditions.records.find(r=>r.sessionId===old.id);await __storyHost.applyExpeditionReturn(r.id,await __storyHost.previewExpeditionReturn(r.id));}else{await __storyHost.arcCreate();const session=__storyHost.arcSessions()[0];await __storyHost.arcReturn(session.id);const r=__atlasHost.extras().expeditions.records.find(r=>r.sessionId===session.id);await __storyHost.applyExpeditionReturn(r.id,await __storyHost.previewExpeditionReturn(r.id));}});await closeDialogs();
  await knownBoard(floorBoard);const beforePrepare=await preservedState();await page.evaluate(id=>__atlasHost.prepareMap(ECHO_ATLAS.proposal(id)),master.id);
  const staged=await preservedState(),added=staged.scenes.filter(s=>!beforePrepare.scenes.some(old=>old.id===s.id));assert.equal(added.length,1);const floor=added[0].id;
  assert.equal(floor,await page.evaluate(id=>ECHO_ATLAS.proposalSceneId(id),master.id));assert(added[0].gridColumns>30);assert.deepEqual(staged.sceneFog[floor],[]);
  assert(await page.evaluate(id=>__atlasHost.extras().expeditions.records.some(r=>r.sessionId===__auditHost.context().sessionId&&r.sceneIds.includes('um1-table')&&r.sceneIds.includes(id)),floor),'Prepared floor must join the tracked expedition');
  assert(staged.map.scenes[floor].links.every(link=>!!link.target),'Saved links require actual destinations');
  assert(staged.map.scenes[floor].points.every(point=>!point.visible),'Future floor connections begin private');
  assert.deepEqual(staged.tokens,beforePrepare.tokens);assert.deepEqual(staged.party,beforePrepare.party);assert.deepEqual(staged.turn,beforePrepare.turn);
  await page.locator('#context-scene').getByRole('button',{name:'Show on TV',exact:true}).click();await page.waitForFunction(id=>__auditHost.context().state.scene===id,floor);
  snapshot=await pushPhone();assert(snapshot.public.presentation.sceneImage.startsWith('data:image/png;base64,'));assert(await blank(snapshot.public.presentation.sceneImage));
  assert(!JSON.stringify(snapshot).includes(master.proposalImage));assert(!JSON.stringify(snapshot.public).includes('floorFog'));await screenshot(tv,'Workflow-TV-Blank-Floor.png');
  pass('One saved floor prepares privately with blank fog and explicit Show; no raw floor artwork or dense ledger reaches TV/phone');

  // A real pointer reveal, followed by native fixtures in the revealed cell and an unrevealed cell.
  await page.waitForFunction(()=>document.querySelector('#dm-stage .scene-image')?.complete);const fog=page.locator('#dm-stage .floor-fog-canvas');assert.equal(await fog.count(),1);
  await fog.click({position:{x:180,y:120}});await page.waitForFunction(id=>__auditHost.context().state.sceneFog[id].length>0,floor);
  const fixture=await page.evaluate(({floor,pc})=>{
    const state=__auditHost.context().state,extras=__atlasHost.extras(),size=state.map.scenes[floor].floorFog,keys=state.sceneFog[floor],key=keys[0],[row,col]=key.split(',').map(Number),x=(col+.5)*100/size.cols,y=(row+.5)*100/size.rows;
    const hero=state.tokens.find(t=>t.id===pc);Object.assign(hero,{scene:floor,placed:true,visible:true,x,y,initiative:15});
    const D=ECHO_DUNGEON,d=D.data(extras),sc=D.scene(d,floor),box=D.add(d,floor,'container','Reviewed container',x,y);box.visible=true;box.state='empty';box.note='RUNTIME_PRIVATE_SOURCE_KEY';
    const hidden=D.add(d,floor,'door','RUNTIME_UNREVEALED_GATE',99.8,99.8);hidden.visible=true;hidden.note='RUNTIME_PRIVATE_GATE_KEY';
    const room=D.add(d,floor,'room','Cleared room',x,y);room.state='cleared';const door=D.add(d,floor,'door','Broken door',x,y);door.state='broken';
    state.tokens.push({id:'runtime-inhabitant',name:'Saved inhabitant',label:'S',type:'custom',team:'enemy',scene:floor,placed:true,visible:false,x:90,y:90,hp:0,maxHp:10,tempHp:0,conditions:[],initiative:null,initBonus:null,ac:null,encounter:'',exhaustion:0,extraAttacks:[],customAttack:{name:'',bonus:0,count:1,sides:8,modifier:0,damage:'damage'}});
    ECHO_EXPEDITION.room(ECHO_EXPEDITION.data(extras),'um1-6').status='cleared';
    let r=ECHO_EXPEDITIONS.data(extras).records.find(r=>r.sessionId===__auditHost.context().sessionId);if(!r)r=ECHO_EXPEDITIONS.create(__storyHost.expeditionContext(),'Rehearsal floor',['um1-table',floor]);
    if(!r.sceneIds.includes(floor))throw Error('Prepared floor was not registered with its expedition');if(r.phase==='prepared')ECHO_EXPEDITIONS.start(__storyHost.expeditionContext(),r);
    __dungeonHost.save('Rehearsal native exploration state');return {x,y,key,box:box.id,hidden:hidden.id,record:r.id};
  },{floor,pc:pc[0]});
  await pushPhone();snapshot=await phoneSnapshot();assert(!JSON.stringify(snapshot).includes('RUNTIME_'));assert(snapshot.dungeon.objects.some(o=>o.id===fixture.box));assert(!snapshot.dungeon.objects.some(o=>o.id===fixture.hidden));assert(!(await blank(snapshot.public.presentation.sceneImage)));
  assert(!snapshot.public.tokens.some(t=>t.id==='runtime-inhabitant'));await screenshot(tv,'Workflow-TV-Exploration.png');
  pass('Dense pointer reveal exposes only its saved cell; unseen native markers, defeated occupants and private notes stay hidden');

  const search=await phoneContext.request.post(phoneBase+'/api/action',{headers:{Origin:phoneBase},data:{kind:'search-request',requestId:'runtime-search',objectId:fixture.box,approach:'Check the empty container'}});assert.equal(search.status(),200);
  events=await(await api.get(phoneBase+'/api/dm/events')).json();const searchEvent=events.events.find(e=>e.requestId==='runtime-search');assert(searchEvent);const beforeSearch=await preservedState();await page.evaluate(e=>__phoneHost.onAction(e),searchEvent);assert.deepEqual(await preservedState(),beforeSearch);
  const hiddenSearch=await phoneContext.request.post(phoneBase+'/api/action',{headers:{Origin:phoneBase},data:{kind:'search-request',requestId:'runtime-hidden-search',objectId:fixture.hidden,approach:'Guess a hidden gate'}});assert.equal(hiddenSearch.status(),400);
  await page.evaluate(()=>{ECHO_DUNGEON.resolve(ECHO_DUNGEON.data(__atlasHost.extras()),'runtime-search','resolved','It remains empty.');__dungeonHost.save('Resolved rehearsal search');});await pushPhone();pass('Phone search requests require visible objects, preserve state until review, and reject an unrevealed gate');

  const floorState=()=>page.evaluate(id=>{const s=__auditHost.context().state;return structuredClone({tokens:s.tokens,party:s.party,fog:s.sceneFog[id],dungeon:__atlasHost.extras().dungeon,native:__atlasHost.extras().expedition,turn:s.turn,scenes:s.scenes});},floor);
  const beforeFocus=await floorState();for(const section of sections.slice(0,3)){
    await page.evaluate(id=>__mapHost.focusFloor(id),section.id);assert.deepEqual(await floorState(),beforeFocus);await page.locator('#context-scene').getByRole('button',{name:'Show on TV',exact:true}).click();assert.deepEqual(await floorState(),beforeFocus);
  }
  const view=await page.evaluate(id=>structuredClone(__auditHost.context().state.map.scenes[id].view),floor);assert(view.zoom>1);
  await screenshot(page,'Workflow-DM-Section.png');await screenshot(tv,'Workflow-TV-Section.png');pass('Section staging and Show change only camera; fog, objects, occupants, party and combat retain one authoritative floor');

  // Effects remain decoration and Stop is immediately available in the existing dialog.
  const beforeEffects=await floorState();await page.evaluate(({x,y})=>{const d=ECHO_ATMOSPHERE.data(__atlasHost.extras()),s=ECHO_ATMOSPHERE.scene(d,__auditHost.context().state.scene);d.mode='full';s.weather='rain';s.mist=true;s.anchors=[{id:'runtime-torch',kind:'torch',x,y,size:3,visible:true},{id:'RUNTIME_HIDDEN_TORCH',kind:'torch',x:99.8,y:99.8,size:3,visible:true}];__effectsHost.save('Rehearsal atmosphere');},fixture);
  await tv.waitForFunction(()=>document.querySelector('#player-app')?.dataset.effects==='full');assert(!JSON.stringify(await phoneSnapshot()).includes('RUNTIME_HIDDEN_TORCH'));
  await tv.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>__effectsHost.refresh());await tv.waitForFunction(()=>document.querySelector('#player-app').dataset.fxReduced==='true');
  assert(await tv.evaluate(()=>[...document.querySelectorAll('.weather-particle')].every(n=>getComputedStyle(n).display==='none')));
  await page.evaluate(()=>ECHO_ATMOSPHERE_UI.open());await page.getByRole('button',{name:'Stop effects & sound',exact:true}).click();await closeDialogs();await tv.waitForFunction(()=>document.querySelector('#player-app').dataset.effects==='off');
  assert.equal(await page.evaluate(()=>ECHO_SOUNDSCAPE.status().armed),false);assert.deepEqual(await floorState(),beforeEffects);pass('Effects respect reduced motion and immediate Stop without changing fog, collision, native rooms or combat');

  const calibration=await page.evaluate(pc=>{const map=__mapHost.map(),display=map.displays[map.displayIndex],d=ECHO_ATMOSPHERE.data(__atlasHost.extras());display.safeEdge=5;display.orientation='portrait';d.labelAngle=90;d.labelAngles[pc]=180;__mapHost.commit('Rehearsal table display calibration');return __mapHost.calibration();},pc[0]);
  assert(calibration.width>0&&calibration.actualSquare>0);assert.equal(calibration.fits,false,'A complete large floor cannot claim one-inch squares on this display');
  await tv.waitForFunction(()=>document.getElementById('player-app').classList.contains('portrait-display'));
  assert(await tv.evaluate(()=>[...document.querySelectorAll('#player-stage .token-label')].some(n=>n.style.rotate==='180deg')));
  assert.deepEqual(await floorState(),beforeEffects);await tv.locator('#player-fullscreen').click();await tv.waitForFunction(()=>!!document.fullscreenElement);await tv.evaluate(()=>document.exitFullscreen());
  pass('TV label rotations, saved orientation, safe-edge calibration and browser fullscreen work; large-floor physical grid fit remains honestly limited',calibration);

  await page.evaluate(()=>__guidedHost.build());assert((await floorState()).turn.order.length>0);const combatBefore=await floorState();await page.evaluate(id=>__mapHost.focusFloor(id),sections[0].id);assert.deepEqual(await floorState(),combatBefore);
  await page.evaluate(()=>document.getElementById('end-combat').click());assert.equal((await floorState()).turn.order.length,0);
  await page.evaluate(id=>{ECHO_EXPEDITIONS.retreat(__storyHost.expeditionContext(),ECHO_EXPEDITIONS.get(__storyHost.expeditionContext(),id),'Rehearsal: checked exit and saved stopping point');return __storyHost.expeditionSave('Rehearsal retreat');},fixture.record);
  const beforeReturn=await floorState();await page.evaluate(async ({id,pc})=>{await __storyHost.courtyardSession();const s=__partyHost.getParty()[pc],rest=ECHO_PARTY_DATA.previewRest(s,'short',{hitDiceSpent:0,healing:0});if(rest.blocked)throw Error(rest.blocked);__partyHost.replaceSheet(pc,rest.sheet);__partyHost.commitParty('Reviewed rehearsal short rest');window.__runtimeRested=structuredClone(__partyHost.getParty()[pc]);const review=await __storyHost.previewExpeditionReturn(id);await __storyHost.applyExpeditionReturn(id,review);if(JSON.stringify(__partyHost.getParty()[pc])!==JSON.stringify(__runtimeRested))throw Error('Return altered reviewed rest resources');},{id:fixture.record,pc:pc[0]});await closeDialogs();
  const afterReturn=await floorState();assert.deepEqual(afterReturn.fog,beforeReturn.fog);assert.deepEqual(afterReturn.dungeon,beforeReturn.dungeon);assert.deepEqual(afterReturn.native,beforeReturn.native);assert.deepEqual(afterReturn.tokens.filter(t=>t.team!=='pc'),beforeReturn.tokens.filter(t=>t.team!=='pc'));
  assert.equal(await page.evaluate(()=>__auditHost.context().state.scene),floor);pass('Combat completes, retreat and reviewed rest retain current resources, and city return preserves explored floor, native journal and defeated inhabitants');

  // Undo/redo and restore test real saved dense cell keys and remembered camera.
  const priorFog=(await floorState()).fog;await page.evaluate(id=>{const s=__auditHost.context().state;s.sceneFog[id]=[...s.sceneFog[id],'199,299'];__dungeonHost.save('Rehearsal manual reveal for undo');},floor);
  await page.evaluate(()=>document.getElementById('quick-undo').click());assert.deepEqual((await floorState()).fog,priorFog);await page.evaluate(()=>document.getElementById('quick-redo').click());assert((await floorState()).fog.includes('199,299'));
  await page.evaluate(id=>__mapHost.focusFloor(id),sections[0].id);await page.locator('#context-scene').getByRole('button',{name:'Show on TV',exact:true}).click();const finalView=await page.evaluate(id=>structuredClone(__auditHost.context().state.map.scenes[id].view),floor);
  await page.reload();await page.locator('.cockpit-nav').waitFor();assert.deepEqual(await page.evaluate(id=>__auditHost.context().state.map.scenes[id].view,floor),finalView);assert((await floorState()).fog.includes('199,299'));
  await pushPhone();await phone.reload();await phone.locator('#tab-table').click();assert.equal((await(await phoneContext.request.get(phoneBase+'/api/state')).json()).scene,floor);await phone.waitForFunction(()=>document.getElementById('map-image').complete&&document.getElementById('map-image').naturalWidth>0);await phone.locator('#phone-map').evaluate(node=>node.scrollIntoView({block:'center'}));await screenshot(phone,'Workflow-Phone-Reconnected.png');await phone.locator('#tab-explore').click();
  await phoneContext.setOffline(true);await phone.waitForTimeout(1200);assert(await phone.locator('#tab-explore').isVisible());await phoneContext.setOffline(false);assert.equal((await phoneContext.request.get(phoneBase+'/api/state')).status(),200);
  const archive=await page.evaluate(()=>__reliabilityHost.validateBackup());const restoreContext=await browser.newContext({viewport:{width:1550,height:1100}});await setup(restoreContext);const restored=await restoreContext.newPage();watch(restored,'runtime restored');await load(restored,{name:'isolated-runtime.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))});
  assert.deepEqual(await restored.evaluate(id=>__auditHost.context().state.map.scenes[id].view,floor),finalView);assert((await restored.evaluate(id=>__auditHost.context().state.sceneFog[id],floor)).includes('199,299'));
  assert.equal(await restored.evaluate(()=>__auditHost.context().state.tokens.find(t=>t.id==='runtime-inhabitant').hp),0);
  pass('Dense fog and camera survive undo/redo, DM reload, phone offline/reconnect and fresh-profile backup restore');
  for(const route of ['/Undermountain-Map-Collection.js','/atlas/tactical/Undermountain-Tactical-Topology-DM.json','/'+master.proposalImage,'/thumbnail?path='+encodeURIComponent(master.proposalImage),'/__echo_package']){const response=await phoneContext.request.get(phoneBase+route);assert.equal(response.status(),404);assert.equal(response.headers()['cache-control'],'no-store');}
  const image=await phoneContext.request.get(phoneBase+'/api/map');assert.equal(image.status(),200);assert.equal(image.headers()['content-type'],'image/png');assert.equal(image.headers()['cache-control'],'no-store');
  pass('Phone map bytes stay raster-only and uncached; private floor sources, catalogs, thumbnail and package routes remain unavailable');
};

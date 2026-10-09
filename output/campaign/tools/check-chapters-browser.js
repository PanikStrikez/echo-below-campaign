/* Fresh Chrome profile + explicit Practice campaign: no real table writes. */
const {chromium}=require('playwright'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const assertParty=(actual,expected,label)=>{const a=JSON.parse(actual),e=JSON.parse(expected),changes=[];for(const id of new Set([...Object.keys(a),...Object.keys(e)]))for(const key of new Set([...Object.keys(a[id]||{}),...Object.keys(e[id]||{})]))if(JSON.stringify(a[id]?.[key])!==JSON.stringify(e[id]?.[key]))changes.push(id+'.'+key);assert.deepEqual(changes,[],label);};
  const context=await browser.newContext({viewport:{width:1500,height:1050}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{
   for(const [key,capture]of [['ECHO_STORY_UI','__host'],['ECHO_PHONE','__phone']]){let api;Object.defineProperty(window,key,{configurable:true,get:()=>api,set:v=>{api=v;const init=v.init;v.init=h=>{window[capture]=h;return init(h);};}});}
   let reliability;Object.defineProperty(window,'ECHO_RELIABILITY',{configurable:true,get:()=>reliability,set:v=>{reliability=v;const project=v.publicPayload;v.publicPayload=(...args)=>{const result=project(...args);window.__lastPublic=result;return result;};}});
  });
  const fold=async(title)=>page.locator('#story-content summary').filter({hasText:new RegExp('^'+title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).evaluate(n=>n.parentElement.open=true);
  const openSite=async()=>{await page.evaluate(()=>ECHO_ADVENTURES_UI.openSite('silent-library'));await page.getByLabel('Satellite site',{exact:true}).waitFor();};
  await page.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html'));await page.locator('.cockpit-nav').waitFor();
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Create practice campaign').click());await page.waitForFunction(()=>document.body.textContent.includes('PRACTICE ·'));
  await page.evaluate(()=>__host.expeditionSave('Initialize isolated practice baseline'));await page.reload();await page.locator('.cockpit-nav').waitFor();
  const initial=await page.evaluate(()=>({events:JSON.stringify(__host.continuity().events),quests:JSON.stringify(__host.continuity().questGuide),clues:JSON.stringify(__host.extras().clues),scene:__host.sceneId(),session:__host.sessionId()}));
  await page.getByRole('button',{name:'World',exact:true}).click();await page.getByRole('button',{name:'Character chapters & satellite adventures',exact:true}).click();
  assert.equal(await page.locator('#story-tool').inputValue(),'chapters');
  const owners=await page.evaluate(()=>[...new Set(ECHO_ADVENTURES.chapters().map(c=>c.characterId))]);
  assert.equal(owners.length,5,'All five chains are available');
  for(const id of owners){await page.getByLabel('Character quest',{exact:true}).selectOption(id);assert.equal(await page.getByLabel('Playable chapter',{exact:true}).locator('option').count(),5);assert(await page.getByLabel('Chapter scene',{exact:true}).inputValue());}
  await page.getByLabel('Character quest',{exact:true}).selectOption('pc-trista');
  const firstChapter=await page.getByLabel('Playable chapter',{exact:true}).inputValue();
  await page.getByRole('button',{name:'Add these scenes to current session notes',exact:true}).click();
  const noteCount=await page.evaluate(()=>__host.story().sessionPlans[__host.sessionId()].extraBeats.length);assert.equal(noteCount,2);
  await page.getByRole('button',{name:'Add these scenes to current session notes',exact:true}).click();assert.equal(await page.evaluate(()=>__host.story().sessionPlans[__host.sessionId()].extraBeats.length),noteCount);
  assert.equal(await page.evaluate(()=>__host.sceneId()),initial.scene);assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().events)),initial.events);
  await fold('Spotlight invitations & balance');await page.locator('#story-content summary').filter({hasText:/^Trista · /}).evaluate(n=>n.parentElement.open=true);
  await page.getByRole('button',{name:'Mark offered · Trista',exact:true}).click();
  assert.equal(await page.evaluate(()=>__host.spotlights().log[0].status),'offered');
  await page.getByLabel('Actual response · Trista',{exact:true}).fill('ISOLATED PRACTICE: Trista asked for a copy and chose to keep the conversation private.');
  await page.getByRole('button',{name:'Mark played · Trista',exact:true}).click();assert.equal(await page.evaluate(()=>__host.spotlights().log[0].status),'played');
  await page.getByRole('button',{name:'Add to session board',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#story-content')?.textContent.includes('1/3 likely leads'));
  await page.evaluate(()=>ECHO_ADVENTURES_UI.openQuest('character-pebble'));await page.getByRole('button',{name:'Add to session board',exact:true}).click();
  await openSite();await page.getByRole('button',{name:'Add to session board',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#story-content')?.textContent.includes('3/3 likely leads'));
  await page.locator('#story-content summary').filter({hasText:/^1\. /}).evaluate(n=>n.parentElement.open=true);
  await page.getByRole('button',{name:'Open prepared chapter / adventure',exact:true}).first().click();assert.equal(await page.getByLabel('Playable chapter',{exact:true}).inputValue(),firstChapter);
  await openSite();await page.getByRole('button',{name:'Scene cards',exact:true}).click();
  const sceneIds=await page.getByLabel('Adventure scene',{exact:true}).locator('option').evaluateAll(rows=>rows.map(r=>r.value));assert.equal(sceneIds.length,8);
  for(const id of sceneIds){await page.getByLabel('Adventure scene',{exact:true}).selectOption(id);assert((await page.locator('#story-content').textContent()).includes('Say aloud only when reached'));}
  await page.getByRole('button',{name:'Handouts',exact:true}).click();await page.locator('#story-content summary').first().evaluate(n=>n.parentElement.open=true);
  await page.getByRole('button',{name:'Review this handout for sharing',exact:true}).first().click();
  assert.equal(await page.getByLabel('Publish wording to',{exact:true}).inputValue(),'private');assert.equal(await page.getByLabel('What happened · private DM record',{exact:true}).inputValue(),'');
  assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().events)),initial.events);assert.equal(await page.evaluate(()=>JSON.stringify(__host.extras().clues)),initial.clues);
  await page.getByRole('button',{name:'Preview linked changes',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Apply reviewed outcome',exact:true}).isEnabled(),false,'Discovery needs an actual result');
  await page.getByRole('button',{name:'Back to draft',exact:true}).click();await page.getByRole('button',{name:'Discard this draft',exact:true}).click();
  await openSite();await fold('Saved library session and exploration plan');
  const beforePack=await page.evaluate(async()=>{const c=__host.expeditionContext(),t=c.state.tokens.find(t=>t.id==='pc-trista');t.hp=Math.max(1,t.hp-1);c.state.party['pc-trista'].hp=t.hp;c.state.party['pc-trista'].notes='PRACTICE_CHARACTER_NOTE_TO_PRESERVE';c.state.party['pc-pebble'].resources[0].current=0;await __host.expeditionSave('Isolated prior-party fixture');return {party:JSON.stringify(c.state.party),tokens:JSON.stringify(c.state.tokens.filter(t=>['pc','ally'].includes(t.team)).map(t=>({id:t.id,hp:t.hp,maxHp:t.maxHp,conditions:t.conditions}))),session:__host.sessionId()};});
  await page.getByRole('button',{name:'Create library session · switches table',exact:true}).click();await page.waitForFunction(()=>__host.expeditionContext().state.contentPackId==='silent-library-expedition');
  const created=await page.evaluate(()=>{const c=__host.expeditionContext();return {party:JSON.stringify(c.state.party),tokens:JSON.stringify(c.state.tokens.filter(t=>['pc','ally'].includes(t.team)).map(t=>({id:t.id,hp:t.hp,maxHp:t.maxHp,conditions:t.conditions}))),fog:c.state.sceneFog['sl-library-map'],fine:c.state.map.scenes['sl-library-map'].fineFog,rooms:c.extras.dungeon.scenes['sl-library-map'].objects,phase:c.extras.expeditions.records[0].phase,sessions:__host.chapterSessions().length};});
  assertParty(created.party,beforePack.party,'Creating a library pack preserves every character field');assert.equal(created.tokens,beforePack.tokens);assert.deepEqual(created.fog,[]);assert.equal(created.fine,true);assert.equal(created.rooms.length,7);assert(created.rooms.every(o=>!o.visible));assert.equal(created.phase,'prepared');assert.equal(created.sessions,1);
  await openSite();await fold('Saved library session and exploration plan');await fold('Visual preview · Library floor plan');
  const currentScene=await page.evaluate(()=>__host.sceneId());await page.getByRole('button',{name:'Stage this visual for TV review',exact:true}).last().click();assert.equal(await page.evaluate(()=>__host.sceneId()),currentScene);
  await page.locator('#context-scene').getByRole('button',{name:'Show on TV',exact:true}).click();await page.waitForFunction(()=>__host.sceneId()==='sl-library-map');
  assert.equal(await page.evaluate(()=>JSON.stringify(__lastPublic).includes('Catalogue packet cabinet')),false,'Private room markers do not reach the TV');
  await page.evaluate(()=>ECHO_DUNGEON_UI.open('sl-room-2'));const dialog=page.locator('.dungeon-dialog');const room=dialog.locator('details').filter({has:page.locator('summary').filter({hasText:/^2 · Listening desks · room/})});
  await room.locator('label').filter({hasText:/^State/}).locator('select').selectOption('cleared');await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(()=>__host.expeditionSave('Isolated library room saved'));await page.reload();await page.locator('.cockpit-nav').waitFor();
  assert.equal(await page.evaluate(()=>__host.extras().dungeon.scenes['sl-library-map'].objects.find(o=>o.id==='sl-room-2').state),'cleared');
  assertParty(await page.evaluate(()=>JSON.stringify(__host.expeditionContext().state.party)),beforePack.party,'Reload preserves every character field');
  assert.deepEqual(await page.evaluate(()=>__host.expeditionContext().state.sceneFog['sl-library-map']),[]);
  assert.equal(await page.evaluate(()=>__host.expeditionContext().state.preservePartyProgression),true);
  await page.evaluate(()=>__host.expeditionSave('Verify durable progression preservation'));await page.reload();await page.locator('.cockpit-nav').waitFor();
  assertParty(await page.evaluate(()=>JSON.stringify(__host.expeditionContext().state.party)),beforePack.party,'A second save/reload keeps the preservation flag and all character fields');
  const prior=await page.evaluate(()=>({session:__host.sessionId(),rooms:JSON.stringify(__host.extras().dungeon.scenes['sl-library-map'])}));
  await page.evaluate(()=>__host.chapterCreatePack());assert.equal(await page.evaluate(()=>__host.chapterSessions().length),1);assert.equal(await page.evaluate(()=>__host.sessionId()),prior.session);assert.equal(await page.evaluate(()=>JSON.stringify(__host.extras().dungeon.scenes['sl-library-map'])),prior.rooms);
  await openSite();await page.getByRole('button',{name:'Scene cards',exact:true}).click();await page.getByLabel('Adventure scene',{exact:true}).selectOption(sceneIds[3]);
  await page.screenshot({path:path.resolve(__dirname,'chapters-rehearsal.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().events)),initial.events);assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().questGuide)),initial.quests);assert.deepEqual(errors,[]);
  console.log('Isolated chapter browser passed: five chains, three-lead board, correct chapter reopening, private scene staging, explicit spotlights, eight library scenes, handout review, preserved party, hidden map objects, saved room state and duplicate-pack prevention.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

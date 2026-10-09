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
  const fold=async(title)=>page.locator('#story-content summary').filter({hasText:new RegExp('^'+title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first().evaluate(n=>n.parentElement.open=true);
  await page.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html'));await page.locator('.cockpit-nav').waitFor();
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Create practice campaign').click());await page.waitForFunction(()=>document.body.textContent.includes('PRACTICE ·'));
  await page.evaluate(()=>__host.expeditionSave('Initialize isolated practice baseline'));await page.reload();await page.locator('.cockpit-nav').waitFor();
  const initial=await page.evaluate(()=>({events:JSON.stringify(__host.continuity().events),quests:JSON.stringify(__host.continuity().questGuide),clues:JSON.stringify(__host.extras().clues),scene:__host.sceneId(),session:__host.sessionId()}));
  const beforeParty=await page.evaluate(()=>JSON.stringify(__host.expeditionContext().state.party));
  await page.getByRole('button',{name:'World',exact:true}).click();await page.getByRole('button',{name:'Intervention & finale',exact:true}).click();
  assert.equal(await page.locator('#story-tool').inputValue(),'finale');
  const info=await page.evaluate(()=>({approaches:ECHO_FINALE.approaches().map(a=>({id:a.id,questId:a.questId,first:a.prerequisites[0].id})),scenes:ECHO_FINALE.scenes().map(s=>s.id),categories:ECHO_FINALE.categories().map(c=>({id:c.id,title:c.title}))}));
  assert.equal(info.approaches.length,5);
  for(const a of info.approaches){await page.getByLabel('Approach to review',{exact:true}).selectOption(a.id);assert.equal(await page.getByLabel('Prerequisite to review',{exact:true}).inputValue(),a.first);}
  await fold('Primary plan, alternatives and table briefing');
  await page.getByLabel('Primary approach',{exact:true}).selectOption(info.approaches[0].id);
  await page.getByLabel('Private planning notes',{exact:true}).fill('PRIVATE_FINALE_BROWSER_PLAN');
  await page.getByLabel('Activation briefing · what is actually ready and who controls it',{exact:true}).fill('ISOLATED PRACTICE: no activation has been established.');
  await page.getByRole('button',{name:'Save intervention plan',exact:true}).click();
  assert.equal(await page.evaluate(()=>__host.story().finale.primary),info.approaches[0].id);
  assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().events)),initial.events);assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().questGuide)),initial.quests);
  await fold('History and preparation controls');await page.getByRole('button',{name:'Undo finale preparation',exact:true}).click();assert.equal(await page.evaluate(()=>__host.story().finale.primary),'');
  await page.getByRole('button',{name:'Redo finale preparation',exact:true}).click();assert.equal(await page.evaluate(()=>__host.story().finale.primary),info.approaches[0].id);
  // Add a canonical Practice-only observation; the UI links and reviews it without sharing.
  const eid=await page.evaluate(()=>{const h=__host,d=h.continuity(),draft=ECHO_OUTCOMES.begin(d,{title:'PRACTICE bounded disconnection test',detail:'PRIVATE_FINALE_BROWSER_OBSERVATION',source:'Isolated browser rehearsal; never actual campaign play',status:'confirmed',basis:'Observed',knows:['pc-trista'],share:'private'}),ctx={story:h.story(),markers:[]},preview=ECHO_OUTCOMES.preview(d,draft,ctx);if(preview.errors.length)throw Error(preview.errors.join(' '));const e=ECHO_OUTCOMES.apply(d,draft.id,preview,ctx);h.save('Saved isolated fixture');return e.id;});
  await page.getByLabel('Approach to review',{exact:true}).selectOption(info.approaches[0].id);
  await fold('Edit this prerequisite review');await page.getByLabel('DM assessment',{exact:true}).selectOption('supported');
  await page.getByLabel('Reason, limits and what would change this assessment',{exact:true}).fill('Only Trista witnessed the small test; wider use remains unproved.');
  await page.getByLabel('Add an approved actual outcome',{exact:true}).selectOption(eid);
  await page.getByRole('button',{name:'Save prerequisite review',exact:true}).click();
  assert.equal(await page.evaluate(rid=>ECHO_FINALE.assess(__host.story(),__host.continuity(),rid).established,info.approaches[0].first),true);
  await fold('Saved supporting records');await fold('PRACTICE bounded disconnection test');
  assert((await page.locator('#story-content').textContent()).includes('Knowledge is limited to the named people'));
  assert.equal(await page.evaluate(()=>JSON.stringify(__phone.snapshot()).includes('PRIVATE_FINALE_BROWSER')),false);
  await page.getByRole('button',{name:'Run scenes',exact:true}).click();assert.equal(await page.getByLabel('Finale scene',{exact:true}).locator('option').count(),info.scenes.length);
  for(const id of info.scenes){await page.getByLabel('Finale scene',{exact:true}).selectOption(id);assert((await page.locator('#story-content').textContent()).includes('Say aloud only when reached'));}
  await page.getByLabel('Finale scene',{exact:true}).selectOption(info.scenes[0]);await page.getByRole('button',{name:'Add this scene to current session notes',exact:true}).click();
  const count=await page.evaluate(()=>__host.story().sessionPlans[__host.sessionId()].extraBeats.length);await page.getByRole('button',{name:'Add this scene to current session notes',exact:true}).click();assert.equal(await page.evaluate(()=>__host.story().sessionPlans[__host.sessionId()].extraBeats.length),count);
  assert.equal(await page.evaluate(()=>__host.sceneId()),initial.scene);
  await page.getByRole('button',{name:'Epilogue',exact:true}).click();
  const apparatus=info.categories.find(c=>/apparatus/i.test(c.id+' '+c.title)),halaster=info.categories.find(c=>/halaster/i.test(c.id+' '+c.title));assert(apparatus&&halaster);
  await page.getByLabel('Epilogue topic',{exact:true}).selectOption(apparatus.id);await fold('Choose or correct the outcome links');
  await page.getByLabel('Add an approved actual outcome',{exact:true}).selectOption(eid);await page.getByRole('button',{name:'Save epilogue links',exact:true}).click();
  assert.equal(await page.evaluate(id=>ECHO_FINALE.epilogue(__host.story(),__host.continuity()).find(c=>c.id===id).missing,apparatus.id),false);
  await page.getByLabel('Epilogue topic',{exact:true}).selectOption(halaster.id);assert((await page.locator('#story-content').textContent()).includes('No current confirmed observation'));
  await page.getByRole('button',{name:'Record an actual outcome for this topic',exact:true}).click();assert.equal(await page.getByLabel('What happened · private DM record',{exact:true}).inputValue(),'');assert.equal(await page.getByLabel('Publish wording to',{exact:true}).inputValue(),'private');
  await page.getByRole('button',{name:'Preview linked changes',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Apply reviewed outcome',exact:true}).isEnabled(),false);
  await page.getByRole('button',{name:'Back to draft',exact:true}).click();await page.getByRole('button',{name:'Discard this draft',exact:true}).click();
  const savedFinale=await page.evaluate(()=>JSON.stringify(__host.story().finale));await page.evaluate(()=>__host.expeditionSave('Saved isolated finale rehearsal'));await page.reload();await page.locator('.cockpit-nav').waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(__host.story().finale)),savedFinale);assertParty(await page.evaluate(()=>JSON.stringify(__host.expeditionContext().state.party)),beforeParty,'Finale preparation and reload preserve every character field');
  assert.equal(await page.evaluate(()=>__host.sceneId()),initial.scene);
  await page.evaluate(id=>ECHO_FINALE_UI.open(id),info.approaches[0].id);
  await page.evaluate(id=>{const h=__host,d=h.continuity(),draft=ECHO_OUTCOMES.begin(d,{},id);draft.event.detail='PRACTICE corrected observation; repeated testing is now needed.';const ctx={story:h.story(),markers:[]};ECHO_OUTCOMES.apply(d,draft.id,ECHO_OUTCOMES.preview(d,draft,ctx),ctx);h.save('Corrected isolated source');ECHO_STORY_UI.render(true);},eid);
  assert((await page.locator('#story-content').textContent()).includes('Sources need re-review'));
  assert.equal(await page.evaluate(rid=>ECHO_FINALE.assess(__host.story(),__host.continuity(),rid).established,info.approaches[0].first),false);
  await page.getByRole('button',{name:'Epilogue',exact:true}).click();await page.getByLabel('Epilogue topic',{exact:true}).selectOption(apparatus.id);
  assert((await page.locator('#story-content').textContent()).includes('Source changed since this review'));
  assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().questGuide)),initial.quests);assert.equal(await page.evaluate(()=>JSON.stringify(__phone.snapshot()).includes('PRIVATE_FINALE_BROWSER')),false);
  await page.evaluate(id=>ECHO_FINALE_UI.open(id),info.approaches[0].id);await page.screenshot({path:path.resolve(__dirname,'finale-rehearsal.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log('Isolated finale browser passed: all five approaches, plan save/undo/redo, actual-source review, private knowledge, scene staging, separate epilogue topics, blocked blank outcomes, save/reload, source-correction invalidation and unchanged character statistics.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

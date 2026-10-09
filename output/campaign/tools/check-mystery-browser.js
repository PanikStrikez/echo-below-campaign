const {chromium}=require('playwright'),path=require('node:path'),assert=require('node:assert/strict');

// A fresh browser profile and a new Practice campaign isolate every write.
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({viewport:{width:1500,height:1050}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
  page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{
   for(const [key,capture]of [['ECHO_STORY_UI','__host'],['ECHO_PHONE','__phone']]){
    let api;Object.defineProperty(window,key,{configurable:true,get:()=>api,set:v=>{api=v;const init=v.init;v.init=h=>{window[capture]=h;return init(h);};}});
   }
   let reliability;Object.defineProperty(window,'ECHO_RELIABILITY',{configurable:true,get:()=>reliability,set:v=>{reliability=v;const project=v.publicPayload;v.publicPayload=(...args)=>{const result=project(...args);window.__lastPublic=result;return result;};}});
  });
  const field=async(label,value)=>{const control=page.getByLabel(label,{exact:true});await control.fill(value);await control.dispatchEvent('change');};
  const fold=async(title)=>page.locator('#story-content summary').filter({hasText:new RegExp('^'+title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).evaluate(n=>n.parentElement.open=true);
  const openMystery=async()=>{await page.evaluate(()=>ECHO_STORY_UI.open('mystery'));await page.getByRole('button',{name:'Questions',exact:true}).waitFor();};
  const previewApply=async()=>{
   await page.getByRole('button',{name:'Preview linked changes',exact:true}).click();
   const apply=page.getByRole('button',{name:'Apply reviewed outcome',exact:true});
   assert(await apply.isEnabled(),'Preview blocked: '+await page.locator('#story-content').textContent());
   await apply.click();await page.getByRole('heading',{name:'Approved history',exact:true}).waitFor();
  };
  const ownerOnly=async()=>{
   await fold('Individual characters and NPCs');
   await page.getByRole('checkbox',{name:'Trista',exact:true}).check();
   await page.getByLabel('Publish wording to',{exact:true}).selectOption('selected');
   await page.getByRole('checkbox',{name:'Send private wording to Trista',exact:true}).check();
  };
  await page.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html'));
  await page.locator('.cockpit-nav').waitFor();
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Create practice campaign').click());
  await page.waitForFunction(()=>document.body.textContent.includes('PRACTICE ·'));
  const before=await page.evaluate(()=>({events:JSON.stringify(__host.continuity().events),quests:JSON.stringify(ECHO_QUESTS.cards(__host.continuity())),party:JSON.stringify(__host.expeditionContext().state.party)}));
  await page.getByRole('button',{name:'World',exact:true}).click();
  await page.getByRole('button',{name:'Evidence and research',exact:true}).click();
  assert.equal(await page.locator('#story-tool').inputValue(),'mystery');

  // All topics and linked questions are reachable without creating discoveries.
  const topics=await page.evaluate(()=>ECHO_MYSTERY.topics().map(t=>t.id));
  for(const id of topics){await page.getByLabel('Mystery topic',{exact:true}).selectOption(id);assert(await page.getByLabel('Question to investigate',{exact:true}).inputValue());assert((await page.locator('#story-content').textContent()).includes('future possibilities'));}
  await page.getByLabel('Mystery topic',{exact:true}).selectOption('echo');
  await page.getByLabel('Question to investigate',{exact:true}).selectOption('echo-observable');
  await fold('Related questions');
  await page.getByRole('button',{name:'An older phenomenon, a later investigator',exact:true}).click();
  assert.equal(await page.getByLabel('Question to investigate',{exact:true}).inputValue(),'echo-predates-halaster');
  assert.equal(await page.evaluate(()=>JSON.stringify(__host.continuity().events)),before.events);
  await page.getByLabel('Question to investigate',{exact:true}).selectOption('echo-observable');
  await page.getByRole('button',{name:'Record a discovery for this question',exact:true}).click();
  await field('Outcome title','Practice observation');
  await field('What happened · private DM record','PRIVATE_OBSERVATION_SOURCE: a permitted control comparison was recorded.');
  await field('Source / who confirmed it','Practice witnesses; isolated rehearsal only');
  await ownerOnly();await field('Player-safe title','A careful observation');await field('Player-safe wording','Your control comparison is recorded for later study.');
  await page.getByLabel('Evidence relationship 1',{exact:true}).selectOption('supports');
  await field('Original source family','PRIVATE_ORIGIN_FAMILY');
  await field('Provenance / why independent or dependent','Direct observation in this isolated practice campaign.');
  await page.getByRole('checkbox',{name:'I reviewed this origin and its independence',exact:true}).check();
  await previewApply();
  const observedId=await page.evaluate(()=>__host.continuity().events.find(e=>e.title==='Practice observation').id);
  await page.evaluate(()=>ECHO_MYSTERY_UI.open('echo-predates-halaster'));
  await fold('Connect an existing outcome');
  const observationBefore=await page.evaluate(id=>JSON.stringify(__host.continuity().events.find(e=>e.id===id)),observedId);
  await page.getByLabel('Existing outcome to connect',{exact:true}).selectOption(observedId);
  const proposedConnection=await page.evaluate(id=>{
   const d=__host.continuity(),draft=d.outcomes.drafts.find(x=>x.target===id);
   return {live:JSON.stringify(d.events.find(e=>e.id===id)),links:draft.event.mystery.links,share:draft.event.share,recipients:draft.event.recipients};
  },observedId);
  assert.equal(proposedConnection.live,observationBefore);
  assert(proposedConnection.links.some(l=>l.conclusionId==='echo-predates-halaster'&&l.relation==='context'));
  assert(proposedConnection.links.some(l=>l.conclusionId==='echo-observable'&&l.relation==='supports'));
  assert.equal(proposedConnection.share,'private');assert.deepEqual(proposedConnection.recipients,['pc-trista']);
  await page.getByRole('button',{name:'Discard this draft',exact:true}).click();

  // Create a private plan through the real editor; changing the plan does not teach anyone.
  await openMystery();await page.getByRole('button',{name:'Research',exact:true}).click();await fold('Prepare an investigation');
  await page.getByRole('button',{name:'Create a custom research project',exact:true}).click();
  await field('Research title','Practice controlled comparison');await field('Specific question','Does the response repeat under the same conditions?');
  await field('Prediction before the test','The response will repeat once with the same control.');await field('Proposed method','PRIVATE_METHOD_PLAN: repeat once and record a control.');
  await fold('Access, resources, people and publication');await page.getByLabel('Related mystery question',{exact:true}).selectOption('echo-observable');
  await field('Participation and consent','Ask voluntary participants and custodians first.');await field('Proposed cost','No agreed payment.');await field('Estimated effort minutes','30');
  await field('Private planning notes','PRIVATE_RESEARCH_PLANNING');
  const projectId=await page.getByLabel('Saved research project',{exact:true}).inputValue();
  await page.evaluate(()=>__host.expeditionSave('Practice research save'));
  await page.reload();await page.locator('.cockpit-nav').waitFor();
  await openMystery();await page.getByRole('button',{name:'Research',exact:true}).click();
  assert.equal(await page.getByLabel('Saved research project',{exact:true}).inputValue(),projectId);
  assert.equal(await page.getByLabel('Research title',{exact:true}).inputValue(),'Practice controlled comparison');
  assert.equal(await page.getByLabel('Proposed method',{exact:true}).inputValue(),'PRIVATE_METHOD_PLAN: repeat once and record a control.');
  assert.equal(await page.evaluate(()=>JSON.stringify(ECHO_QUESTS.cards(__host.continuity()))),before.quests);

  // The actual attempt has one reviewed outcome and one downtime attempt reference.
  await page.getByRole('button',{name:'Record a new research attempt',exact:true}).click();
  await field('Outcome title','Practice research result');await field('What happened · private DM record','PRIVATE_RESULT_DETAILS: response was inconsistent; further comparisons remain open.');
  await field('Source / who confirmed it','Practice observers and raw measurements; isolated rehearsal');
  await ownerOnly();await field('Player-safe title','Your comparison result');await field('Player-safe wording','The comparison was inconclusive. You can plan a different control.');
  await field('Actual method and controls','PRIVATE_ACTUAL_METHOD: repeated once with a control.');await field('Actual permissions and participation','Trista and the custodian consented to this practice comparison.');
  await field('Interpretation and limits of the actual result','One inconsistent response cannot establish a cause.');await field('Publication decision / redactions / withheld material','Share only the brief result privately with Trista; retain raw measurements with the DM.');
  await field('Reviewed cost / payment terms','None; no payment made.');await field('Work minutes recorded (blank = unknown)','30');
  await fold('Supporting or competing recorded sources');await page.getByLabel('Cite a recorded source',{exact:true}).selectOption(observedId);
  await field('Why this source matters 1','Earlier comparison used as context; it did not prove a shared cause.');
  await previewApply();
  const resultId=await page.evaluate(()=>__host.continuity().events.find(e=>e.title==='Practice research result').id);
  const projection=await page.evaluate(()=>{
   const phone=__phone.snapshot();return {tv:__lastPublic,phone,results:ECHO_MYSTERY.records(__host.continuity()).length,attempts:__host.story().downtime.activities.length,party:JSON.stringify(__host.expeditionContext().state.party)};
  });
  assert.equal(projection.results,2);assert(projection.attempts>=1);assert.equal(projection.party,before.party);
  assert(projection.phone.privateClues['pc-trista'].some(c=>c.text==='The comparison was inconclusive. You can plan a different control.'));
  for(const [owner,clues]of Object.entries(projection.phone.privateClues))if(owner!=='pc-trista')assert(!JSON.stringify(clues).includes('Your comparison result'));
  for(const secret of ['PRIVATE_OBSERVATION_SOURCE','PRIVATE_ORIGIN_FAMILY','PRIVATE_METHOD_PLAN','PRIVATE_RESEARCH_PLANNING','PRIVATE_RESULT_DETAILS','PRIVATE_ACTUAL_METHOD'])assert(!JSON.stringify({tv:projection.tv,phone:projection.phone}).includes(secret),secret+' leaked');
  assert(!JSON.stringify(projection.tv).includes('The comparison was inconclusive. You can plan a different control.'));
  assert.equal(await page.evaluate(()=>JSON.stringify(ECHO_QUESTS.cards(__host.continuity()))),before.quests);

  // Correct a cited observation through review, then undo and confirm the dependency recovers.
  await page.evaluate(id=>ECHO_OUTCOMES_UI.start(__host,{},id),observedId);
  await field('What happened · private DM record','PRIVATE_OBSERVATION_CORRECTION: the original comparison used an unrecorded control.');await previewApply();
  const stale=await page.evaluate(id=>ECHO_MYSTERY.issues(__host.continuity(),__host.continuity().events.find(e=>e.id===id)),resultId);
  assert(stale.some(x=>x.includes('Changed source')));
  await page.getByRole('button',{name:'Undo outcome change',exact:true}).click();
  assert.deepEqual(await page.evaluate(id=>ECHO_MYSTERY.issues(__host.continuity(),__host.continuity().events.find(e=>e.id===id)),resultId),[]);
  await page.evaluate(()=>__host.expeditionSave('Practice research result save'));
  await page.reload();await page.locator('.cockpit-nav').waitFor();
  assert.equal(await page.evaluate(()=>ECHO_MYSTERY.records(__host.continuity()).length),2);
  assert.equal(await page.evaluate(()=>JSON.stringify(__host.expeditionContext().state.party)),before.party);
  await page.evaluate(()=>ECHO_MYSTERY_UI.open('echo-observable'));
  await fold('Approved evidence by basis');
  assert((await page.locator('#story-content').textContent()).includes('2 linked record(s)'));
  const bounds=await page.evaluate(()=>{const box=document.getElementById('story-content');return {page:document.documentElement.scrollWidth<=innerWidth+2,desk:box.scrollWidth<=box.clientWidth+2};});
  assert(bounds.page&&bounds.desk,'Horizontal overflow in evidence workspace: '+JSON.stringify(bounds));
  await page.screenshot({path:path.resolve(__dirname,'mystery-rehearsal.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('Isolated mystery browser passed: all question topics and links, approved owner-private evidence, custom research save/reload, actual attempt review/apply, source correction and undo, owner-only phone projection, no private metadata or TV leak, unchanged characters/quests, no page errors or horizontal overflow.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

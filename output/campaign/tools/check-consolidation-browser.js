/* Isolated browser. Restore the exported real archive as a copy; never contact live phone service. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.ECHO_REHEARSAL_APP||path.resolve(__dirname,'..'),archivePath=process.env.ECHO_REHEARSAL_BACKUP||path.join(root,'../releases/Echo-Below-Campaign-2026-10-01.json'),archive=JSON.parse(fs.readFileSync(archivePath));
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const context=await browser.newContext({viewport:{width:1500,height:1000}}),page=await context.newPage(),errors=[];
 await context.route('http://127.0.0.1:48262/**',r=>r.abort());
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept('Blank rehearsal'));page.setDefaultTimeout(15000);
 await page.addInitScript(()=>{for(const [key,capture]of [['ECHO_RELIABILITY','__recovery'],['ECHO_STORY_UI','__story'],['ECHO_COMBAT_RUN','__combat'],['ECHO_PHONE','__phone']]){let api;Object.defineProperty(window,key,{configurable:true,get:()=>api,set:v=>{api=v;const init=v.init;v.init=h=>{window[capture]=h;return init(h);};}});}});
 await page.goto(process.env.ECHO_REHEARSAL_URL||'file://'+path.join(root,'Session-01-TV-Display.html'));await page.locator('.cockpit-nav').waitFor();
 // UI restore imports a new campaign, leaving the original fresh profile campaign alone.
 await page.locator('#load-campaign-file').setInputFiles(archivePath);
 await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Restored 10 sessions'));
 const restored=await page.evaluate(()=>__recovery.validateBackup());
 assert.equal(restored.sessions.length,archive.sessions.length);
 const diff=[];function compare(old,now,label){if(old&&typeof old==='object'){if(Array.isArray(old)&&old.length!==now?.length)diff.push(label+'.length');for(const key of Object.keys(old))compare(old[key],now?.[key],label+'.'+key);}else if(old!==now)diff.push(label+': '+JSON.stringify(old)+' → '+JSON.stringify(now));}
 for(const old of archive.sessions){const now=restored.sessions.find(s=>s.id===old.id);assert(now);compare(old.state.party,now.state.party,old.name+'.party');}
 fs.writeFileSync('/tmp/echo-restore-differences.json',JSON.stringify(diff,null,2));assert.deepEqual(diff,[],'Existing character values must survive a real restore');
 if(!process.env.ECHO_REHEARSAL_APP)fs.writeFileSync(path.join(root,'../releases/Echo-Below-Package-Backup.json'),JSON.stringify(restored,null,2));
 assert.equal(restored.story.continuity.events.length,archive.story.continuity.events.length);
 const rehearsal=await page.evaluate(a=>__recovery.rehearseBackup(a),archive);console.log(rehearsal);
 await page.reload();await page.locator('.cockpit-nav').waitFor();assert.equal(await page.evaluate(()=>__recovery.state.scene),archive.sessions.find(s=>s.id===archive.active).state.scene);
 // New blank profile, then reload and re-export. No Echo characters/facts/media/map seeds.
 await page.evaluate(()=>__recovery.createCampaign());await page.waitForFunction(()=>__recovery.campaignName==='Blank rehearsal');await page.reload();await page.locator('.cockpit-nav').waitFor();
 const blank=await page.evaluate(()=>__recovery.validateBackup());
 assert.deepEqual(Object.keys(blank.sessions[0].state.party),[]);assert.deepEqual(blank.sessions[0].state.tokens,[]);assert.deepEqual(blank.story.npcs,[]);assert.deepEqual(blank.story.continuity.events,[]);assert.deepEqual(blank.presentation.media,[]);assert.deepEqual(blank.tableExtras.travel.places,[]);assert.deepEqual(blank.rules.exceptions,[]);assert.deepEqual(blank.sessions[0].state.scenes.map(s=>s.id),['black']);
 assert.deepEqual(await page.evaluate(()=>ECHO_QUESTS.cards(__story.continuity())),[]);
 await page.evaluate(()=>ECHO_STORY_UI.open('quests'));await page.getByText('Add a quest',{exact:true}).click();await page.getByLabel('Quest name',{exact:true}).fill('An uncharted coast');await page.getByLabel('Private objective',{exact:true}).fill('PRIVATE_TEMPLATE_ROUTE');await page.getByLabel('Quest audience',{exact:true}).selectOption('main');await page.getByRole('button',{name:'Create private quest',exact:true}).click();
 await page.getByLabel('Player-safe title',{exact:true}).fill('Explore the coast');await page.getByLabel('Current objective and known leads',{exact:true}).fill('Find a safe harbor.');await page.getByRole('button',{name:'Show main quest on TV',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>ECHO_QUESTS.tvQuest(__story.continuity())),{title:'Explore the coast',text:'Find a safe harbor.',state:'active'});
 await page.reload();await page.locator('.cockpit-nav').waitFor();assert.equal(await page.evaluate(()=>ECHO_QUESTS.tvQuest(__story.continuity()).title),'Explore the coast');assert.equal(await page.evaluate(()=>ECHO_QUESTS.cards(__story.continuity()).length),1);
 assert.deepEqual(errors,[]);console.log('PASS: real 10-session archive restored and reopened with every character field unchanged; temporary database rehearsal; blank template reload; custom main quest publication persisted; no live phone requests.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});

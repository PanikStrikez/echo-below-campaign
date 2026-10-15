/* Fresh browser profile; blocked services; observable cache/command regressions. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const app=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const context=await browser.newContext({viewport:{width:1512,height:982}});
 await context.route(/^https?:\/\//,r=>r.abort());
 await context.addInitScript(()=>{window.__perf={};for(const [key,name]of [['ECHO_RELIABILITY','reliability'],['ECHO_MAP_UI','map']]){let api;Object.defineProperty(window,key,{configurable:true,get:()=>api,set:v=>{api=v;const init=v.init;v.init=h=>{__perf[name]=h;return init(h);};}});}});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('file://'+path.join(app,'Session-01-TV-Display.html'));await p.locator('#dm-app.hybrid-ui').waitFor();
 await p.evaluate(()=>{ECHO_HYBRID_UI.go('combat');__perf.map.changeScene(__perf.map.scenes().find(s=>s.kind==='map').id,false);const t=__perf.reliability.state.tokens.find(t=>t.id==='pc-trista');t.placed=true;t.scene=__perf.reliability.state.scene;t.visible=true;t.x=30;t.y=30;__perf.map.commit('Isolated performance regression fixture');});
 const saved=()=>p.waitForFunction(()=>document.getElementById('save-status').textContent==='Saved');await saved();
 await p.evaluate(()=>{window.__retainedRow=[...document.querySelectorAll('#party-roster .roster-row')].find(r=>r.querySelector('.roster-name').firstChild.textContent.includes('Trista'));window.__oldToken=__perf.reliability.state.tokens.find(t=>t.id==='pc-trista');window.__geometry=JSON.stringify(__perf.reliability.state.map);window.__start={x:__oldToken.x,y:__oldToken.y,hp:__oldToken.hp};});
 const popup=context.waitForEvent('page');await p.evaluate(()=>document.getElementById('open-player').click());const tv=await popup;tv.on('pageerror',e=>errors.push(e.message));await tv.locator('#player-stage img.scene-image').waitFor();await tv.locator('#player-stage .token[title*="Trista"]').first().waitFor();
 await tv.evaluate(()=>{window.__image=document.querySelector('#player-stage img.scene-image');window.__token=[...document.querySelectorAll('#player-stage .token')].find(t=>t.title.includes('Trista'));window.__startStyle=__token.getAttribute('style');});
 await p.evaluate(()=>__perf.reliability.resync());await tv.waitForTimeout(150);
 assert(await tv.evaluate(()=>__image===document.querySelector('#player-stage img.scene-image')&&__token.isConnected),'Unchanged resync preserves image and token DOM');
 const token=p.locator('#dm-stage .token[title*="Trista"]').first(),b=await token.boundingBox();assert(b);
 await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2+42,b.y+b.height/2+27,{steps:5});await p.mouse.up();await saved();
 assert(await p.evaluate(()=>__oldToken!==__perf.reliability.state.tokens.find(t=>t.id==='pc-trista')),'Movement replaces the token through the immutable command path');
 assert(await p.evaluate(()=>__retainedRow.isConnected),'Position-only movement retains roster rows');
 await tv.waitForFunction(()=>[...document.querySelectorAll('#player-stage .token')].find(t=>t.title.includes('Trista')).getAttribute('style')!==__startStyle);
 assert(await tv.evaluate(()=>__image===document.querySelector('#player-stage img.scene-image')),'Changed position updates TV while retaining its map image');
 await p.evaluate(()=>{const input=[...__retainedRow.querySelectorAll('label')].find(l=>l.firstChild.textContent.trim()==='Initiative').querySelector('input');input.value='19';input.dispatchEvent(new Event('change',{bubbles:true}));});await saved();
 assert.equal(await p.evaluate(()=>__perf.reliability.state.tokens.find(t=>t.id==='pc-trista').initiative),19,'Retained row edits current token after immutable movement');
 assert(!await p.evaluate(()=>__retainedRow.isConnected),'Displayed-stat changes rebuild roster');
 await p.locator('.hybrid-map-dock').getByRole('button',{name:'Undo',exact:true}).click();await saved();
 assert.notEqual(await p.evaluate(()=>__perf.reliability.state.tokens.find(t=>t.id==='pc-trista').initiative),19,'Undo restores edited initiative');
 await p.locator('.hybrid-map-dock').getByRole('button',{name:'Undo',exact:true}).click();await saved();
 assert(await p.evaluate(()=>{const t=__perf.reliability.state.tokens.find(t=>t.id==='pc-trista');return t.x===__start.x&&t.y===__start.y&&t.hp===__start.hp;}),'Undo restores movement and original HP');
 await p.evaluate(()=>{__perf.map.scene().view.zoom=1.5;__perf.map.commit('Isolated zoom invalidation');});await saved();
 await tv.waitForFunction(()=>document.querySelector('#player-stage img.scene-image').style.transform.includes('1.5'));
 await p.evaluate(()=>{__perf.map.scene().playerLayers.tokens=false;__perf.map.commit('Isolated layer invalidation');});await saved();await tv.waitForFunction(()=>!document.querySelector('#player-stage .token'));
 await p.evaluate(()=>{__perf.map.scene().playerLayers.tokens=true;__perf.map.commit('Isolated layer restore');});await saved();await tv.locator('#player-stage .token').first().waitFor();
 // Public-only loader still excludes private preloads, not just script execution.
 const privateNames=await tv.evaluate(()=>[...document.querySelectorAll('script[src],link[rel="preload"]')].map(n=>n.getAttribute('src')||n.getAttribute('href')).filter(n=>/Party-Data|Campaign-Engine|Table-Content|Continuity|Quests-Data|Assistant/.test(n)));
 assert.deepEqual(privateNames,[],'Player page contains no private module/preload references');
 assert.deepEqual(errors,[]);
 console.log('Performance regressions passed: retained rows edit current command state, free drag/undo, unchanged TV resync, changed positions/views/layers, map-image reuse, and private preload exclusion. Fresh profile; no live service reached.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

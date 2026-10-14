/* Isolated practice campaign. No provider request or physical output is used. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({viewport:{width:1500,height:1050}});
  const dm=await context.newPage(),errors=[];
  dm.on('pageerror',error=>errors.push(error.message));
  dm.on('dialog',dialog=>dialog.accept());
  await dm.addInitScript(()=>{
   let api;Object.defineProperty(window,'ECHO_PRESENTATION',{configurable:true,get:()=>api,set:value=>{api=value;const init=value.init;value.init=host=>{window.__presentationHost=host;return init(host);};}});
   window.__sound=[];const NativeAudio=window.Audio;
   window.Audio=class extends NativeAudio{constructor(url){super(url);window.__sound.push(this);}play(){this.__playing=true;return Promise.resolve();}pause(){this.__playing=false;}}
  });
  await dm.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html'));
  await dm.locator('#hybrid-home').waitFor();
  await dm.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Create practice campaign').click());
  await dm.waitForFunction(()=>document.body.textContent.includes('PRACTICE ·'));
  const opened=context.waitForEvent('page');await dm.evaluate(()=>document.getElementById('open-player').click());
  const tv=await opened;await tv.locator('#player-stage').waitFor();
  await dm.evaluate(()=>{
   const s=__presentationHost.state;
   s.turn.order=['pc-trista'];s.turn.scene=s.scene;s.turn.round=1;s.turn.index=0;
   __presentationHost.library.presets.push(ECHO_PRESENTATION.normalizeLibrary({contentProfile:'blank',presets:[{id:'practice-weather',name:'Practice weather',mode:'scene',mediaId:'barthen-art',weather:'rain',lighting:'warm',effectsMode:'subtle',musicId:'recorded-town'}]}).presets[0]);
   window.__before=JSON.stringify({scene:s.scene,turn:s.turn,tokens:s.tokens,party:s.party,map:s.map,requests:s.requests,phoneRequests:s.phoneRequests});
   window.__tvBefore=JSON.stringify(ECHO_PRESENTATION.publicState(s.presentation,__presentationHost.library));
   ECHO_PRESENTATION.open('director');
  });
  await dm.locator('[data-do="stage-preset"][data-id="practice-weather"]').click();
  await dm.screenshot({path:'/private/tmp/echo-stage7-scene-preview.png'});
  assert.equal(await dm.evaluate(()=>JSON.stringify(ECHO_PRESENTATION.publicState(__presentationHost.state.presentation,__presentationHost.library))),await dm.evaluate(()=>__tvBefore),'preview did not publish');
  assert.equal(await dm.evaluate(()=>JSON.stringify({scene:__presentationHost.state.scene,turn:__presentationHost.state.turn,tokens:__presentationHost.state.tokens,party:__presentationHost.state.party,map:__presentationHost.state.map,requests:__presentationHost.state.requests,phoneRequests:__presentationHost.state.phoneRequests})),await dm.evaluate(()=>__before),'preview did not change game state');
  await dm.locator('[data-do="apply-preset"][data-id="practice-weather"]').click();
  assert.equal(await dm.evaluate(()=>__presentationHost.state.presentation.mediaId),'barthen-art');
  assert.equal(await dm.evaluate(()=>ECHO_PRESENTATION.publicState(__presentationHost.state.presentation,__presentationHost.library).activePreset),'','private preset identity does not travel to TV');
  const restored=await dm.evaluate(()=>ECHO_PRESENTATION.normalizeLibrary(JSON.parse(JSON.stringify(__presentationHost.library))).presets.find(p=>p.id==='practice-weather'));
  assert.equal(restored.weather,'rain');assert.equal(restored.lighting,'warm');assert.equal(restored.effectsMode,'subtle');
  const oldPreset=await dm.evaluate(()=>ECHO_PRESENTATION.normalizeLibrary({contentProfile:'blank',presets:[{id:'older-save',name:'Older save',mode:'scene'}]}).presets[0]);
  assert.equal(oldPreset.weather,'inherit');assert.equal(oldPreset.effectsMode,'inherit');
  assert.equal(await dm.evaluate(()=>JSON.stringify({scene:__presentationHost.state.scene,turn:__presentationHost.state.turn,tokens:__presentationHost.state.tokens,party:__presentationHost.state.party,map:__presentationHost.state.map,requests:__presentationHost.state.requests,phoneRequests:__presentationHost.state.phoneRequests})),await dm.evaluate(()=>__before),'published art did not change combat state');
  const fx=await dm.evaluate(()=>ECHO_ATMOSPHERE.project(ECHO_ATMOSPHERE.data(__presentationHost.atmosphere?{atmosphere:__presentationHost.atmosphere()}:{}),__presentationHost.state,[]));
  assert.equal(fx.weather,'rain');assert.equal(fx.lighting,'warm');
  await tv.waitForFunction(()=>document.body.textContent.includes('Practice weather')||document.querySelector('img[src*="barthen"]'));
  await context.setOffline(true);
  assert(await tv.evaluate(()=>!!document.querySelector('img[src*="barthen"]')),'local scene art remains visible offline');
  await context.setOffline(false);
  await dm.locator('[data-do="stage-preset"][data-id="s2-hideout"]').click();
  assert(await dm.locator('[data-do="apply-preset"][data-id="s2-hideout"]').isDisabled(),'different battlefield blocked during combat');
  await dm.locator('[data-do="stop-all-audio"]').click();
  assert.equal(await dm.evaluate(()=>__sound.every(n=>!n.__playing)),true,'stop sound paused all local tracks');
  await dm.locator('#close-presentation').click();
  await dm.locator('#hybrid-top-stop').click();
  assert.equal(await dm.evaluate(()=>JSON.stringify({scene:__presentationHost.state.scene,turn:__presentationHost.state.turn,tokens:__presentationHost.state.tokens,party:__presentationHost.state.party,map:__presentationHost.state.map,requests:__presentationHost.state.requests,phoneRequests:__presentationHost.state.phoneRequests})),await dm.evaluate(()=>__before),'stop sound did not change combat state');
  const privateHandout=await dm.evaluate(()=>ECHO_PRESENTATION.publicState({mode:'handout',handoutId:'secret',activePreset:'DM-ONLY-PRESET'},
    {media:[{id:'secret-image',audience:'dm',kind:'image'}],handouts:[{id:'secret',title:'DM secret',text:'HIDDEN-REVEAL',pages:[{mediaId:'secret-image'}]}],cards:[]}));
  assert(!JSON.stringify(privateHandout).includes('HIDDEN-REVEAL'));
  assert(!JSON.stringify(privateHandout).includes('DM-ONLY-PRESET'));
  assert.deepEqual(errors,[]);
  console.log('Scene preset rehearsal passed: private preview, deliberate TV publish, weather/light, offline local art, combat preservation, battlefield guard and immediate stop. Audio devices and provider generation were mocked.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

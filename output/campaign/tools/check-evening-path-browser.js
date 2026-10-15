const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const context=await browser.newContext({viewport:{width:1512,height:982}});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
    await page.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html'));
    await page.locator('#hybrid-home').waitFor();
    const steps=page.locator('#hybrid-evening-bar [data-evening-step]');
    assert.deepEqual(await steps.allTextContents(),[
      '1 · Get ready','2 · Open scene','3 · Resolve action','4 · Record outcome','5 · Close session']);
    assert((await page.locator('#hybrid-tv-now-top').innerText()).includes('TV disconnected'));
    const status=await page.evaluate(()=>{
      const connection=document.getElementById('connection-status'),badge=document.getElementById('tv-now-badge');
      const previous=badge.textContent;connection.classList.add('stale');ECHO_HYBRID_UI.refresh();
      const stale=document.getElementById('hybrid-tv-now-top').textContent;
      connection.classList.remove('stale');badge.textContent='Now showing: loading…';ECHO_HYBRID_UI.refresh();
      const loading=document.getElementById('hybrid-tv-now-top').textContent;
      badge.textContent=previous;ECHO_HYBRID_UI.refresh();return {stale,loading};
    });
    assert(status.stale.includes('TV stale')&&status.loading.includes('loading'),JSON.stringify(status));
    await page.evaluate(()=>{const warning=document.getElementById('phone-health-warning');warning.textContent='1 phone stale / offline — Connect phones to review';warning.hidden=false;});
    assert(await page.locator('#hybrid-phone-warning').isVisible(),'a stale phone is visible in the live header');
    await page.locator('#hybrid-phone-warning').click();
    assert(await page.locator('#phones-drawer').isVisible(),'stale phone opens its connection controls');
    await page.locator('#close-phones').click();
    await page.evaluate(()=>{document.getElementById('phone-health-warning').hidden=true;});
    assert(!await page.locator('#hybrid-phone-warning').isVisible(),'healthy phone state does not clutter the header');
    await steps.nth(0).click();
    await page.getByRole('heading',{name:'Before the players begin',exact:true}).waitFor();
    assert(await page.locator('#hybrid-home').isVisible(),'readiness review keeps the Launchpad behind it');
    await page.locator('.hybrid-drawer-close').click();
    const start=Date.now();let sceneActions=0;
    await steps.nth(1).click();sceneActions++;
    assert(await page.locator('#hybrid-scene-view').isVisible());
    const show=page.locator('.hybrid-book-actions .hybrid-primary');
    if(await show.isDisabled()){
      const picker=page.locator('#hybrid-scene-beat');
      for(const value of await picker.locator('option').evaluateAll(options=>options.map(option=>option.value))){
        await picker.selectOption(value);sceneActions++;
        if(!await show.isDisabled())break;
      }
    }
    assert(!await show.isDisabled(),'a prepared beat has a private visual preview');
    assert(await page.locator('#hybrid-scene-art img').isVisible(),'visual is privately previewed');
    const before=await page.locator('#tv-now-badge').innerText();
    assert(await page.locator('#hybrid-scene-art img').isVisible() &&
      (await page.locator('#tv-now-badge').innerText())===before,'preview alone does not stage the TV');
    await show.click();sceneActions++;
    assert(sceneActions<=3,`scene transition required ${sceneActions} actions`);
    assert((await page.locator('#hybrid-tv-now-top').innerText()).includes('last staged'));
    const textBefore=await page.locator('#tv-text-count').innerText();
    await page.evaluate(()=>ECHO_TV_TEXT.preview('Rehearsal cue','A private preview of player-facing text.'));
    assert(await page.locator('.tv-text-preview-dialog').isVisible());
    assert.equal(await page.locator('#tv-text-count').innerText(),textBefore,'text preview does not publish');
    await page.locator('.tv-text-preview-dialog button').filter({hasText:'Show on TV'}).click();
    assert.notEqual(await page.locator('#tv-text-count').innerText(),textBefore,'explicit Show publishes text');
    await steps.nth(2).click();
    assert(await page.locator('#hybrid-pilot-view').isVisible(),'resolution opens exploration when combat is inactive');
    assert(await page.locator('#hybrid-pilot-detour-text').isVisible(),'private alternate route is visible');
    await page.locator('#hybrid-top-more summary').click();
    await page.locator('.hybrid-top-more-list button').filter({hasText:'Prepare'}).click();
    assert(await page.locator('.dm-main').isVisible(),'advanced preparation remains available');
    await page.locator('#mode-run').click();
    assert(await page.locator('#hybrid-pilot-view').isVisible(),'returning from preparation restores the Run position');
    await steps.nth(3).click();
    assert(await page.locator('#story-drawer').isVisible(),'outcome review opens over the current Run position');
    await page.locator('#close-story').click();
    assert(await page.locator('#hybrid-pilot-view').isVisible(),'closing an editor returns to the prior Run screen');
    await steps.nth(4).click();
    assert(await page.locator('#session-flow-workspace').isVisible(),'closing review is reachable from the path');
    await page.locator('.hybrid-drawer-close').click();
    await page.locator('.hybrid-top-search').click();
    assert(await page.locator('#hybrid-palette').isVisible());
    await page.locator('#hybrid-palette input').fill('elsewhere');
    assert(await page.locator('.hybrid-palette-results button').filter({hasText:'Players went elsewhere'}).isVisible());
    await page.locator('#hybrid-palette button').filter({hasText:'Close'}).click();
    await page.keyboard.press('/');
    assert(await page.locator('#hybrid-palette').isVisible(),'keyboard shortcut opens the palette');
    await page.keyboard.press('Escape');
    await page.setViewportSize({width:900,height:900});
    assert(await page.locator('#hybrid-evening-objective').isVisible(),'current objective remains visible on a narrower DM screen');
    assert.deepEqual(errors,[]);
    console.log(`Evening path passed: all five steps, private preview and deliberate TV show, alternate route, outcome return, closing, disconnected status, and command palette. Scene transition: ${sceneActions} actions.`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

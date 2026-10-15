const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1512,height:982}});
    const page = await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    page.on('dialog',dialog=>dialog.accept());
    await page.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html'));
    await page.locator('#dm-app.hybrid-ui').waitFor();
    assert(await page.locator('#hybrid-home').isVisible(),'Launchpad is the opening screen');
    assert(await page.locator('#hybrid-topbar').isVisible());
    await page.locator('#hybrid-top-inbox').click();
    assert(await page.locator('#hybrid-home').isVisible() && await page.locator('#context-requests').isVisible(),
      'inbox opens over the current workspace without switching to Map Desk');
    await page.locator('.hybrid-drawer-close').click();
    await page.locator('#hybrid-top-more summary').click();
    await page.locator('.hybrid-top-more-list button').filter({hasText:'Party'}).click();
    assert(await page.locator('#hybrid-home').isVisible() && await page.locator('#context-tools').isVisible(),
      'campaign tools open without changing workspaces');
    await page.locator('.hybrid-drawer-close').click();
    assert.equal(await page.locator('.dm-header').isVisible(),false,'old header is hidden during play');
    await page.screenshot({path:'/private/tmp/echo-hybrid-launchpad.png'});
    await page.locator('#hybrid-atlas-slot .atlas-viewport svg').waitFor();
    const view=await page.locator('#hybrid-atlas-slot .atlas-breadcrumb [aria-current="page"]').innerText();
    assert(view.length>0,'world atlas has a current view');
    const firstPin=page.locator('#hybrid-atlas-slot .atlas-pin[role="button"]').first();
    assert(await firstPin.count(),'home atlas has clickable POIs');
    await firstPin.focus();await firstPin.press('Enter');
    assert(await page.locator('#hybrid-atlas-slot .atlas-home-place').isVisible(),'selected POI has details');
    await page.locator('#hybrid-atlas-slot button[aria-label="Zoom in"]').click();
    assert.notEqual(await page.locator('#hybrid-atlas-slot .atlas-zoom-label').innerText(),'100%');
    await page.locator('#hybrid-atlas-slot input[aria-label="Find an atlas point of interest"]').fill('Waterdeep');
    await page.locator('#hybrid-atlas-slot .atlas-home-matches button').first().click();
    assert((await page.locator('#hybrid-atlas-slot .atlas-home-place').innerText()).includes('Waterdeep'));
    await page.locator('#hybrid-atlas-slot .atlas-home-regions button').first().click();
    assert(await page.locator('#hybrid-atlas-slot .atlas-viewport svg').isVisible(),'regional map opens');
    await page.locator('#hybrid-atlas-slot .atlas-home-actions button').filter({hasText:'Open full atlas'}).click();
    assert(await page.locator('#cockpit-workbench .atlas-layout').isVisible(),'full atlas opens in exploration');
    await page.locator('.hybrid-brand').click();
    assert(await page.locator('#hybrid-atlas-slot .atlas-viewport svg').isVisible(),'home atlas remounts');
    await page.locator('#hybrid-home .hybrid-tile').filter({hasText:'Run a scene'}).click();
    assert(await page.locator('#hybrid-scene-view').isVisible(),'scene binder opens');
    assert(await page.locator('#hybrid-scene-copy').isVisible());
    await page.screenshot({path:'/private/tmp/echo-hybrid-scene.png'});
    await page.locator('[data-hybrid-screen="explore"]').click();
    assert(await page.locator('#hybrid-pilot-view').isVisible(),'session pilot opens');
    await page.screenshot({path:'/private/tmp/echo-hybrid-explore.png'});
    await page.locator('[data-hybrid-screen="combat"]').click();
    assert(await page.locator('#dm-stage').isVisible(),'map desk keeps the live map');
    assert.equal(await page.locator('#context-sidebar').isVisible(),false,'map desk starts without a sidebar');
    assert(await page.locator('#hybrid-combat-rail').isVisible(),'combat setup and tokens are beside the map');
    await page.locator('#hybrid-map-dock button').filter({hasText:'Tokens'}).click();
    assert(await page.locator('#hybrid-combat-rail .hybrid-combat-tokens').isVisible() ||
      await page.locator('#context-scene').isVisible(),
      'Map Desk shows token controls or the map chooser');
    if(await page.locator('#context-scene').isVisible())await page.locator('.hybrid-drawer-close').click();
    await page.screenshot({path:'/private/tmp/echo-hybrid-combat.png'});
    await page.locator('#hybrid-map-dock button').filter({hasText:'TV'}).click();
    assert(await page.locator('#context-scene').isVisible(),'TV staging opens in Map Desk');
    assert(await page.locator('#context-scene button').filter({hasText:'Show on TV'}).count(),'TV staging control exists');
    await page.screenshot({path:'/private/tmp/echo-hybrid-tv.png'});
    await page.locator('.hybrid-brand').click();
    assert(await page.locator('#hybrid-home').isVisible(),'can return to Launchpad');
    assert(await page.locator('#hybrid-atlas-slot .atlas-viewport svg').isVisible(),'atlas returns to Launchpad');
    await page.locator('#hybrid-top-more summary').click();
    await page.locator('.hybrid-top-more-list button').filter({hasText:'Prepare'}).click();
    assert(await page.locator('.dm-main').isVisible(),'prep still has legacy controls');
    await page.locator('#mode-run').click();
    assert(await page.locator('#hybrid-home').isVisible(),'run returns to Launchpad');
    const player=await context.newPage();
    await player.goto('file://'+path.resolve(__dirname,'../Session-01-TV-Display.html')+'#player');
    await player.locator('#player-app').waitFor();
    assert.equal(await player.locator('#hybrid-home').count(),0,'DM menu is absent from player display');
    assert.deepEqual(errors,[]);
    console.log('Hybrid UI passed: Launchpad, atlas POIs/zoom/region, scene binder, exploration, combat, TV staging, Prep/Run return, and player separation.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless:true, channel:'chrome' });
  try {
    const context = await browser.newContext({ viewport:{width:1440,height:900} });
    const dm = await context.newPage(), errors=[];
    dm.on('pageerror',error=>errors.push(error.message));
    const url='file://'+path.resolve(__dirname,'../Session-01-TV-Display.html');
    await dm.goto(url);
    await dm.locator('#campaign-select option').first().waitFor({state:'attached'});
    const popup=context.waitForEvent('page');
    await dm.evaluate(()=>document.getElementById('open-player').click());
    const tv=await popup;tv.on('pageerror',error=>errors.push(error.message));
    await tv.locator('#player-link-status').waitFor();
    await dm.waitForFunction(()=>document.querySelector('#connection-status')?.textContent.includes('applied update'));
    await tv.waitForFunction(()=>document.querySelector('#player-link-status')?.textContent.includes('update 1'));
    assert.equal(await tv.locator('#player-link-warning').isVisible(),false);
    const scene=await tv.locator('#player-scene-title').innerText();
    await dm.evaluate(()=>ECHO_MAP_UI.open('display'));
    await dm.getByRole('button',{name:'Show TV readability check'}).click();
    await tv.locator('#player-calibration-overlay').waitFor({state:'visible'});
    assert((await tv.locator('#player-calibration-overlay').innerText()).includes('20 ft'));
    assert.equal(await tv.locator('#player-scene-title').innerText(),scene);
    await dm.getByRole('button',{name:'Hide TV readability check'}).click();
    await tv.locator('#player-calibration-overlay').waitFor({state:'hidden'});
    await dm.goto('about:blank');
    await tv.locator('#player-link-warning').waitFor({state:'visible',timeout:15000});
    assert((await tv.locator('#player-link-warning').innerText()).includes('Last update'));
    await dm.goto(url);
    await dm.locator('#campaign-select option').first().waitFor({state:'attached'});
    await tv.locator('#player-link-warning').waitFor({state:'hidden',timeout:15000});
    await dm.waitForFunction(()=>document.querySelector('#connection-status')?.textContent.includes('applied update'));
    assert.deepEqual(errors,[]);
    console.log('Stage 4 TV passed: update status, temporary calibration overlay, stale warning, and recovery after DM reconnect.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

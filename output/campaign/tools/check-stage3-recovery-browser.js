const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { chromium } = require('playwright');

const read = async (page, key) => page.evaluate(async key => {
  const db = await new Promise((resolve, reject) => { const r = indexedDB.open('echo-below-campaign-table-v1', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  try { return await new Promise((resolve, reject) => { const r = db.transaction('records', 'readonly').objectStore('records').get(key); r.onsuccess = () => resolve(r.result ?? null); r.onerror = () => reject(r.error); }); }
  finally { db.close(); }
}, key);

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'echo-stage3-'));
  try {
    const first = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
    const page = await first.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message)); page.on('dialog', dialog => dialog.accept());
    await page.goto('file://' + path.resolve(__dirname, '../Session-01-TV-Display.html'));
    await page.locator('#campaign-select option').first().waitFor({ state: 'attached' });
    await page.waitForFunction(() => document.querySelector('#save-status')?.textContent === 'Saved');
    const sessionKey = 'campaign:default:session:session-01', indexKey = 'campaign:default:index';
    const originalRaw = await read(page, sessionKey), original = JSON.parse(originalRaw);
    const originalQuests = JSON.parse(await read(page, indexKey)).story.continuity.questGuide.records;
    assert(original.party?.['pc-trista'], 'An isolated campaign loaded its party');
    const old = structuredClone(original); old.schemaVersion = 2; delete old.commandRevision;
    const changed = structuredClone(old); changed.party['pc-trista'].hp = 1;
    changed.tokens.find(t => t.id === 'pc-trista').hp = 1;
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put, counts = new WeakMap();
      IDBObjectStore.prototype.put = function (value, key) {
        const number = (counts.get(this.transaction) || 0) + 1; counts.set(this.transaction, number);
        if (number === 2) throw Error('Simulated interrupted import');
        return put.call(this, value, key);
      };
      window.__restorePut = () => { IDBObjectStore.prototype.put = put; };
    });
    await page.locator('#load-save-file').setInputFiles({ name:'older-session.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(changed)) });
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent.includes('live campaign unchanged'));
    await page.evaluate(() => window.__restorePut());
    assert.equal((await read(page, sessionKey)), originalRaw, 'an interrupted two-record import did not change the session');
    assert.deepEqual(JSON.parse(await read(page, indexKey)).story.continuity.questGuide.records, originalQuests,
      'interrupted import did not change quest publications');
    await page.locator('#load-save-file').setInputFiles({ name:'older-session.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(old)) });
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent.includes('Session save loaded'));
    const opened = JSON.parse(await read(page, sessionKey));
    assert.equal(opened.schemaVersion, 3, 'a version 2 session is migrated when opened');
    assert.equal(opened.party['pc-trista'].hp, original.party['pc-trista'].hp);
    assert(Array.isArray(JSON.parse(await read(page, indexKey)).migrationReport), 'migration report was stored');
    const downloadPromise = page.waitForEvent('download',{timeout:10000}).catch(error=>({error}));
    await page.evaluate(() => {ECHO_RELIABILITY.open('backup');document.querySelector('[data-reliable="browser-data"]').click();});
    const download = await downloadPromise, backup = path.join(temporary, 'campaign.json');
    if(download.error)throw Error(`Backup did not download: ${await page.locator('#toast').innerText()}; ${download.error.message}`);
    await download.saveAs(backup);
    const archive = JSON.parse(fs.readFileSync(backup, 'utf8'));
    const withMedia = structuredClone(archive), mediaId='stage3-restore-pixel';
    withMedia.presentation.media.push({id:mediaId,name:'Recovery pixel',kind:'image',category:'art',audience:'dm',mime:'image/png',path:'',hash:'',size:68,tags:[],source:'Isolated rehearsal'});
    withMedia.mediaFiles[mediaId]='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Z3sAAAAASUVORK5CYII=';
    await page.evaluate(() => ECHO_RELIABILITY.open('backup'));
    await page.locator('#reliability-verify-file').setInputFiles({name:'media-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(withMedia))});
    await page.waitForFunction(() => document.querySelector('#reliability-verify-result')?.textContent.includes('SHA-256 hashes matched'),null,{timeout:15000})
      .catch(async error=>{throw Error(`Media rehearsal failed: ${await page.locator('#reliability-verify-result').innerText()}; ${error.message}`);});
    assert((await page.locator('#reliability-verify-result').innerText()).includes('1 imported media SHA-256 hashes matched'));
    const olderArchive=structuredClone(archive);olderArchive.schemaVersion=2;
    for(const entry of olderArchive.sessions){entry.state.schemaVersion=2;delete entry.state.commandRevision;}
    const olderBackup=path.join(temporary,'older-campaign.json');fs.writeFileSync(olderBackup,JSON.stringify(olderArchive));
    const second = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fresh = await second.newPage(); fresh.on('pageerror', error => errors.push(error.message)); fresh.on('dialog', dialog => dialog.accept());
    await fresh.goto('file://' + path.resolve(__dirname, '../Session-01-TV-Display.html'));
    await fresh.locator('#campaign-select option').first().waitFor({ state: 'attached' });
    await fresh.locator('#load-campaign-file').setInputFiles(olderBackup);
    await fresh.waitForFunction(() => document.querySelector('#campaign-select')?.options.length === 2, null, { timeout: 15000 })
      .catch(async error=>{throw Error(`Older backup did not activate: ${await fresh.locator('#toast').innerText()}; page errors: ${errors.join(' | ')}; ${error.message}`);});
    const registry = JSON.parse(await read(fresh, 'campaigns:registry:v2'));
    const campaignId = registry.active, restoredIndex = JSON.parse(await read(fresh, `campaign:${campaignId}:index`));
    const restored = JSON.parse(await read(fresh, `campaign:${campaignId}:session:${restoredIndex.active}`));
    const source = olderArchive.sessions.find(item => item.id === olderArchive.active).state;
    const totals = state => Object.fromEntries(Object.entries(state.party || {}).map(([id, sheet]) => [id,
      [sheet.hp, sheet.maxHp, sheet.tempHp, (sheet.resources || []).map(item => [item.id, item.current, item.max])]]));
    assert.deepEqual(totals(restored), totals(source), 'fresh browser restored character totals');
    assert.equal(restored.scene, source.scene, 'fresh browser restored current scene');
    assert.deepEqual(restoredIndex.story.continuity.questGuide.records, archive.story.continuity.questGuide.records,
      'quest publications and audience settings survived restore');
    assert.equal(registry.campaigns.find(item => item.id === campaignId).name, archive.campaign.name);
    assert(restoredIndex.migrationReport.some(item=>item.from===2&&item.to===3),'older campaign restore has a migration report');
    assert.deepEqual(errors, []);
    console.log(`Stage 3 recovery passed: interrupted import rolled back, version 2 save opened, and fresh browser restored ${archive.sessions.length} sessions with matching characters, quests, and scene.`);
  } finally { await browser.close(); fs.rmSync(temporary, { recursive:true, force:true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });

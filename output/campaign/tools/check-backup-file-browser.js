// Rehearse a supplied campaign backup in a fresh, disposable browser context.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const backup = process.argv[2];
  if (!backup || !fs.existsSync(backup)) throw Error('Usage: node check-backup-file-browser.js /path/to/backup.json');
  const archive = JSON.parse(fs.readFileSync(backup, 'utf8'));
  const expectedSessions = archive.sessions?.length;
  assert(expectedSessions > 0, 'Backup contains no sessions');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto('file://' + path.resolve(__dirname, '../Session-01-TV-Display.html'));
    await page.locator('#campaign-select option').first().waitFor({ state: 'attached' });
    await page.evaluate(() => ECHO_RELIABILITY.open('backup'));
    await page.locator('#reliability-verify-file').setInputFiles(backup);
    await page.waitForFunction(() => document.querySelector('#reliability-verify-result')?.textContent.includes('sessions reopened and normalized'), null, { timeout: 120000 });
    const rehearsal = await page.locator('#reliability-verify-result').innerText();
    assert(rehearsal.includes(`${expectedSessions} sessions`), rehearsal);
    await page.locator('#load-campaign-file').setInputFiles(backup);
    await page.waitForFunction(() => document.querySelector('#campaign-select')?.options.length === 2, null, { timeout: 120000 });
    const restored = await page.evaluate(() => ({
      campaignCount: document.querySelector('#campaign-select').options.length,
      sessionCount: document.querySelector('#session-select').options.length,
      sessionOptions: [...document.querySelector('#session-select').options].map(option => ({ value: option.value, text: option.textContent })),
      activeSession: document.querySelector('#session-select').value,
      saveStatus: document.querySelector('#save-status')?.textContent || ''
    }));
    assert.equal(restored.sessionOptions.filter(option => !option.value.startsWith('pack:')).length,
      expectedSessions, JSON.stringify(restored.sessionOptions));
    assert.equal(restored.activeSession, archive.active);
    assert.deepEqual(pageErrors, []);
    console.log(JSON.stringify({ result: 'PASS', sessions: expectedSessions, activeSession: restored.activeSession,
      importedMedia: rehearsal.match(/\d+ imported media files/)?.[0] || 'unknown',
      note: 'Disposable browser only; does not verify the live current browser or a physical second computer.' }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

/* Isolated browser rehearsal: service calls are fixtures; no live campaign/provider is used. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
const citation = {source_id: 'src-test', filename: 'Test campaign.txt', page: 1, sha256: 'a'.repeat(64)};
const fixtureRecord = (id, kind = 'npc', name = 'Durnan') => ({id, kind, name, visibility: 'dm', npc_ids: [], epistemic: 'confirmed', data: {}, status: 'active', provenance: [citation], facts: [{id: id + '-fact', text: 'A grounded test fact.', visibility: 'dm', npc_ids: [], player_safe: false, epistemic: 'confirmed', provenance: [citation]}]});
const fixtureDraft = () => ({id: 'session-test', title: 'Browser rehearsal', status: 'review', baseRevision: 7, notes: 'PRIVATE_NOTES_SENTINEL', playerNotes: 'The party rescued a witness.', playerRecap: 'The party rescued a witness.', dmRecap: 'PRIVATE_DM_RECAP_SENTINEL', mutations: [{id: 'mutation-a', op: 'upsert', record: fixtureRecord('clue-a', 'clue', 'The rescued witness'), selected: true, reason: 'Recorded in the session.'}, {id: 'mutation-b', op: 'upsert', record: fixtureRecord('thread-b', 'thread', 'Unanswered private question'), selected: true, reason: 'Requires investigation.'}], unresolvedThreads: ['Investigate the unanswered question.'], npcChanges: ['A witness was rescued.'], relationshipChanges: [], cluesLearned: ['A witness knows the trail.'], cluesMissed: ['No evidence establishes other clues.'], nextSessionPrep: ['Open with the witness conversation.'], warnings: []});

(async () => {
  const server = http.createServer((request, response) => {
    const name = decodeURIComponent(request.url.split('?')[0]);
    const file = path.resolve(root, '.' + name);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless: true, channel: 'chrome', timeout: 30000});
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
    const page = await context.newPage(); const errors = [], calls = [];
    page.on('pageerror', error => errors.push(error.message));
    let revision = 7, records = [fixtureRecord('npc-durnan')], savedDraft = null, conflict = false;
    await page.route('**/__echo_campaign/**', async route => {
      const request = route.request(), url = new URL(request.url()), name = url.pathname.replace('/__echo_campaign', '');
      const body = request.postDataJSON(), headers = request.headers();
      calls.push({name, body, headers});
      if (name !== '/bootstrap') assert.equal(headers['x-echo-campaign-token'], 'fixture-token');
      assert.ok(headers['x-echo-campaign-id']);
      let value = {};
      if (name === '/bootstrap') value = {token: 'fixture-token'};
      else if (name === '/status') value = {revision, counts: {npc: records.length}, sources: [{id: 'src-test', filename: 'Test campaign.txt', pages: 1, sha256: citation.sha256}]};
      else if (name === '/records/query') value = {records: records.filter(record => record.kind === body.kind)};
      else if (name === '/records/upsert') {
        if (conflict) { conflict = false; await route.fulfill({status: 409, contentType: 'application/json', body: JSON.stringify({error: 'Campaign changed. Reload before saving.'})}); return; }
        assert.equal(body.expectedRevision, revision); records = records.filter(record => record.id !== body.record.id).concat(body.record); ++revision; value = {record: body.record, revision};
      } else if (name === '/search') value = {answer: body.audience === 'dm' ? 'DM_SEARCH_SENTINEL' : 'Permitted public evidence only.', results: [{id: 'result-test', type: 'fact', epistemic: 'inferred', text: '<img src=x onerror="window.XSS=true">Literal text.', citations: [citation]}]};
      else if (name === '/ai/ask') value = {job: {id: 'job-test', status: 'queued'}};
      else if (name === '/ai/jobs/job-test') value = {job: {id: 'job-test', status: 'completed', result: 'A configured AI draft based on permitted evidence.'}};
      else if (name === '/voice/profiles') value = {profiles: [{id: 'npc-durnan', persona: 'Reserved innkeeper.', voice_id: 'voice-test'}]};
      else if (name === '/voice/reply') value = {text: 'The permitted NPC reply.', replyId: 'reply-safe-test', citations: [citation]};
      else if (name === '/voice/speak') { assert.deepEqual(body, {replyId: 'reply-safe-test'}); await route.fulfill({status: 503, contentType: 'application/json', body: JSON.stringify({error: 'Fixture audio is intentionally unavailable.'})}); return; }
      else if (name === '/sessions') value = {sessions: savedDraft ? [{id: savedDraft.id, title: savedDraft.title, status: savedDraft.status}] : []};
      else if (name === '/sessions/analyze' || name === '/import/preview') { savedDraft = fixtureDraft(); savedDraft.baseRevision = revision; value = {draft: clone(savedDraft)}; }
      else if (name === '/sessions/session-test') value = {draft: clone(savedDraft)};
      else if (name === '/sessions/session-test/save') { savedDraft = clone(body.draft); value = {draft: clone(savedDraft)}; }
      else if (name === '/sessions/session-test/commit') {
        assert.equal(body.expectedRevision, revision); assert.equal(body.playerRecapApproved, true);
        assert.deepEqual(body.mutationIds, ['mutation-a']); ++revision; savedDraft.status = 'committed'; value = {draft: clone(savedDraft), revision};
      } else if (name === '/sources/reindex') value = {message: 'Reindexed fixture sources.'};
      else throw Error('Unexpected fixture request ' + name);
      await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(value)});
    });
    const address = 'http://127.0.0.1:' + server.address().port;
    await page.goto(address + '/Session-01-TV-Display.html');
    await page.locator('.cockpit-nav').waitFor();
    await page.evaluate(() => ECHO_CAMPAIGN_ENGINE_UI.setContext(() => ({campaignId: window.TEST_CAMPAIGN || 'rehearsal-alpha', sessionId: 'session-01', title: 'Current rehearsal session', story: {npcs: []}, scratch: 'Private scratch notes.', recap: 'Private saved recap.'})));
    await page.getByRole('button', {name: 'Settings', exact: true}).click();
    await page.getByRole('button', {name: 'Campaign command center', exact: true}).click();
    const panel = page.getByRole('dialog', {name: 'Campaign command center'});
    await panel.getByRole('button', {name: 'Durnan'}).click();
    await panel.getByLabel('Name / title', {exact: true}).fill('Durnan · revised');
    await panel.getByRole('button', {name: 'Save reviewed record', exact: true}).click();
    await panel.getByText('The reviewed record was saved with its provenance.', {exact: true}).waitFor();
    assert.equal(records[0].name, 'Durnan · revised');
    await panel.getByRole('button', {name: 'Durnan · revised'}).click(); conflict = true;
    await panel.getByLabel('Name / title', {exact: true}).fill('Unsaved conflict edit');
    await panel.getByRole('button', {name: 'Save reviewed record', exact: true}).click();
    await panel.getByText('Campaign changed. Reload before saving.').waitFor();
    assert.equal(await panel.getByLabel('Name / title', {exact: true}).inputValue(), 'Unsaved conflict edit');
    await panel.getByRole('tab', {name: 'Campaign AI', exact: true}).click();
    await panel.getByLabel('Campaign question').fill('What is known?');
    await panel.getByRole('button', {name: 'Search campaign', exact: true}).click();
    await panel.getByText('DM_SEARCH_SENTINEL', {exact: true}).waitFor();
    await panel.getByLabel('Answer audience').selectOption('player');
    assert.equal(await panel.getByText('DM_SEARCH_SENTINEL', {exact: true}).count(), 0);
    await panel.getByRole('button', {name: 'Search campaign', exact: true}).click();
    await panel.getByText('Permitted public evidence only.', {exact: true}).waitFor();
    await panel.locator('summary').filter({hasText: 'result-test'}).click();
    assert.equal(await page.evaluate(() => window.XSS), undefined);
    assert.equal(await panel.locator('img').count(), 0);
    await panel.getByRole('button', {name: 'Ask configured AI', exact: true}).click();
    await panel.getByText('A configured AI draft based on permitted evidence.', {exact: true}).waitFor();
    await panel.getByRole('tab', {name: 'NPC voices', exact: true}).click();
    await panel.getByLabel('What do the players ask?').fill('Any news?');
    await panel.getByRole('button', {name: 'Generate NPC reply', exact: true}).click();
    await panel.getByText('The permitted NPC reply.', {exact: true}).waitFor();
    await panel.getByRole('button', {name: 'Play reviewed reply', exact: true}).click();
    await panel.getByText('Fixture audio is intentionally unavailable.', {exact: true}).waitFor();
    await panel.getByRole('tab', {name: 'Session engine', exact: true}).click();
    await panel.getByRole('button', {name: 'Use current session notes', exact: true}).click();
    assert.equal(await panel.getByLabel('Player-safe notes for the recap').inputValue(), '');
    assert.equal(await panel.getByLabel('Session title', {exact: true}).inputValue(), 'Current rehearsal session');
    await panel.getByLabel('Player-safe notes for the recap').fill('The party rescued a witness.');
    await panel.getByRole('button', {name: 'Analyze previous session', exact: true}).click();
    await panel.getByLabel('Player recap · review exact shareable wording').waitFor();
    const commit = panel.getByRole('button', {name: 'Commit selected changes', exact: true});
    assert.equal(await commit.isDisabled(), true);
    assert.equal(await panel.getByLabel('Approve mutation 1', {exact: true}).isChecked(), false);
    await panel.getByLabel('Approve mutation 1', {exact: true}).check();
    const approval = panel.getByLabel('I reviewed the player recap, knowledge boundaries, and each selected change');
    await approval.check(); assert.equal(await commit.isEnabled(), true);
    await panel.getByLabel('DM recap · private', {exact: true}).fill('Reviewed private recap.');
    assert.equal(await commit.isDisabled(), true);
    await approval.check(); await commit.click();
    await panel.getByText('Your reviewed session was committed. Only selected changes entered campaign state.', {exact: true}).waitFor();
    assert.equal(calls.filter(call => call.name.endsWith('/commit')).length, 1);
    await panel.getByRole('button', {name: 'Close', exact: true}).click();
    await page.evaluate(() => { window.TEST_CAMPAIGN = 'rehearsal-beta'; ECHO_CAMPAIGN_ENGINE_UI.open('session'); });
    await panel.getByRole('button', {name: 'Analyze previous session', exact: true}).waitFor();
    assert.equal(await panel.getByText('This session has already been committed. Its audit record is retained.', {exact: true}).count(), 0);
    assert.equal(calls.at(-1).headers['x-echo-campaign-id'], 'rehearsal-beta');
    await page.setViewportSize({width: 390, height: 844});
    assert.equal(await panel.evaluate(node => node.scrollWidth > node.clientWidth), false);
    await panel.getByRole('tab', {name: 'Sources & setup', exact: true}).click();
    await panel.getByText('Indexed sources · 1', {exact: true}).waitFor();
    await panel.getByRole('button', {name: 'Reindex canonical sources', exact: true}).click();
    await panel.getByText('Reindexed fixture sources.', {exact: true}).waitFor();
    const player = await context.newPage(), playerRequests = [];
    player.on('request', request => { if (request.url().includes('/__echo_campaign/') || request.url().includes('Campaign-Engine-UI.js')) playerRequests.push(request.url()); });
    await player.goto(address + '/Session-01-TV-Display.html#player');
    await player.waitForTimeout(500);
    assert.deepEqual(playerRequests, []);
    assert.equal(await player.evaluate(() => typeof ECHO_CAMPAIGN_ENGINE_UI), 'undefined');
    assert.equal((await player.locator('body').innerText()).includes('PRIVATE_DM_RECAP_SENTINEL'), false);
    assert.deepEqual(errors, []);
    console.log('Campaign engine browser rehearsal passed: DM navigation, token and campaign isolation, edit/conflict preservation, audience reset, safe text rendering, configured AI, reply-bound audio, session review gates, selected commit, responsive layout, source reindex, and TV isolation.');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });

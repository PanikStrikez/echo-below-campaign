'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));

class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.textContent = ''; }
  append(node) { node.parent = this; this.children.push(node); }
  replaceChildren() { for (const node of this.children) node.parent = null; this.children = []; }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  get isConnected() { return this.connected === true || this.parent?.isConnected === true; }
  async emit(type) { for (const callback of this.listeners[type] || []) await callback(); }
}
function nodes(parent, tag) { return parent.children.flatMap(node => [...(node.tagName === tag ? [node] : []), ...nodes(node, tag)]); }
function environment() {
  const requests = [], saves = [];
  const sandbox = {document:{createElement:tag => new Element(tag)}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'AI-Voice-Cast.js'), 'utf8'), sandbox);
  const M = sandbox.ECHO_AI_VOICE_CAST;
  const samples = M.catalog.map((profile, index) => ({
    role:profile.id,provider:'elevenlabs',voiceId:`stock_${index}`,voiceName:`Synthetic stock ${index}`,
    model:'eleven_multilingual_v2',status:'proposed',selectionStatus:'awaiting-user-listening-and-selection',
    script:profile.script,scriptHash:profile.scriptHash,voiceRights:'provider-stock',
    flowId:`flow_${index}`,sessionId:`session_${index}`,generationId:`generation_${index}`,
    providerReportedCredits:25 + index,audioDurationSeconds:10 + index,
    submittedAt:'2026-10-05T10:00:00.000Z',completionObservedAt:'2026-10-05T10:00:15.000Z'
  }));
  const report = plain({schemaVersion:1,provider:'elevenlabs',providerReportedCredits:106,samples});
  sandbox.fetch = async (url, options) => { requests.push({url,options}); return {ok:true,json:async () => report}; };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'AI-Plugin-Auditions.js'), 'utf8'), sandbox);
  const bridge = sandbox.ECHO_AI_PLUGIN_AUDITIONS;
  let state = M.create();
  bridge.init({get:() => state,save:async (next, label) => { saves.push({next,label}); state = next; }});
  return {sandbox,M,bridge,report,requests,saves,state:() => state};
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('completed local report matches canonical original scripts and all four roles', () => {
  const {bridge} = environment();
  const report = JSON.parse(fs.readFileSync(path.join(root, 'Voice-Audition-Results.json'), 'utf8'));
  const checked = bridge.validate(report);
  assert.equal(checked.samples.length, 4);
  assert.deepEqual(plain(checked.samples.map(sample => sample.role)), ['barthen','sildar','dracuseth','narrator']);
  assert.ok(Object.isFrozen(checked.samples[0]));
});

test('validation rejects changed scripts, identities, rights, totals and incomplete takes', () => {
  const {bridge,report} = environment();
  const edits = [
    value => { value.schemaVersion = 2; },
    value => { value.provider = 'other'; },
    value => { value.samples.pop(); },
    value => { value.samples[1].role = value.samples[0].role; },
    value => { value.samples[1].generationId = value.samples[0].generationId; },
    value => { value.samples[0].script += ' changed'; },
    value => { value.samples[0].scriptHash = 'fnv1a32:00000000'; },
    value => { value.samples[0].provider = 'other'; },
    value => { value.samples[0].model = 'unapproved'; },
    value => { value.samples[0].voiceRights = 'cloned'; },
    value => { value.samples[0].status = 'selected'; },
    value => { value.samples[0].selectionStatus = 'selected'; },
    value => { value.samples[0].flowId = '../elsewhere?token=secret'; },
    value => { value.samples[0].sessionId = 'https://untrusted.example/'; },
    value => { value.samples[0].generationId = ''; },
    value => { value.samples[0].voiceId = 'bad stock'; },
    value => { value.samples[0].voiceName = ''; },
    value => { value.samples[0].audioDurationSeconds = -1; },
    value => { value.samples[0].providerReportedCredits = Infinity; },
    value => { value.samples[0].completionObservedAt = null; },
    value => { value.samples[0].completionObservedAt = '2026-10-04T10:00:00.000Z'; },
    value => { value.providerReportedCredits = 200; }
  ];
  for (const edit of edits) { const changed = plain(report); edit(changed); assert.throws(() => bridge.validate(changed), /could not be verified/); }
});

test('explicit selection keeps exact script, hash, model and generation reference and supports undo', () => {
  const {bridge,report,M,state} = environment();
  report.accountKey = 'PRIVATE_ACCOUNT_SENTINEL';
  report.samples[0].audioUrl = 'https://untrusted.example/private?secret=PRIVATE_ACCOUNT_SENTINEL';
  report.samples[0].credentials = 'PRIVATE_ACCOUNT_SENTINEL';
  const before = JSON.stringify(state());
  assert.doesNotMatch(JSON.stringify(bridge.validate(report)), /PRIVATE_ACCOUNT_SENTINEL|untrusted|audioUrl|credentials/);
  for (const consent of [false,undefined,'true',1]) assert.throws(() => bridge.select(report, 'barthen', state(), consent), /Listen privately/);
  const selected = bridge.select(report, 'barthen', state(), true, {at:'2026-10-05T10:10:00Z'});
  assert.equal(JSON.stringify(state()), before);
  const profile = M.profile(selected, 'barthen');
  assert.equal(profile.script, report.samples[0].script);
  assert.equal(profile.voice.scriptHash, report.samples[0].scriptHash);
  assert.equal(profile.voice.model, report.samples[0].model);
  assert.equal(profile.voice.auditionId, 'elevenlabs-plugin:' + report.samples[0].generationId);
  assert.equal(profile.voice.status, 'selected');
  assert.equal(profile.voice.selectedBy, 'dm');
  assert.equal(profile.voice.selectedAt, '2026-10-05T10:10:00Z');
  assert.equal(JSON.stringify(M.undo(selected)), before);
  assert.equal(M.profile(selected, 'sildar').voice.status, 'unselected');
  assert.doesNotMatch(JSON.stringify(selected), /PRIVATE_ACCOUNT_SENTINEL|untrusted|audioUrl|flow_0|session_0/);
});

test('collapsed panel only reads local metadata and selecting requires a separate listening check', async () => {
  const {bridge,requests,saves,state,report} = environment();
  const rootNode = new Element('root'); rootNode.connected = true;
  const section = bridge.render(rootNode);
  assert.equal(section.open, false);
  assert.equal(saves.length, 0);
  await flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'Voice-Audition-Results.json');
  assert.equal(requests[0].options.redirect, 'error');
  assert.equal(saves.length, 0);
  assert.ok(state().profiles.every(profile => profile.voice.status === 'unselected'));
  const links = nodes(section, 'a');
  assert.equal(links.length, 4);
  links.forEach((link, index) => {
    assert.equal(link.href, 'https://elevenlabs.io/app/flows/' + report.samples[index].flowId);
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.download, undefined);
  });
  assert.equal(nodes(section, 'audio').length, 0);
  const checkboxes = nodes(section, 'input'), buttons = nodes(section, 'button');
  assert.ok(checkboxes.every(checkbox => checkbox.checked === false));
  assert.ok(buttons.every(button => button.disabled === true));
  await buttons[0].emit('click');
  assert.equal(saves.length, 0);
  checkboxes[0].checked = true;
  await checkboxes[0].emit('change');
  assert.equal(saves.length, 0);
  assert.equal(buttons[0].disabled, false);
  await buttons[0].emit('click');
  assert.equal(saves.length, 1);
  assert.equal(state().profiles[0].voice.status, 'selected');
  assert.ok(state().profiles.slice(1).every(profile => profile.voice.status === 'unselected'));
  assert.equal(state().history.length, 1);
  assert.equal(requests.length, 1);
  assert.equal(nodes(section, 'button')[0].disabled, true);
  assert.match(nodes(section, 'button')[0].textContent, /^Selected for/);
  await buttons[0].emit('click');
  assert.equal(saves.length, 1, 'Repeated selection must not create another history entry');
});

test('malformed report and blank campaigns cannot create selections', async () => {
  const {sandbox,bridge,report,saves} = environment();
  sandbox.fetch = async () => ({ok:true,json:async () => ({...report,samples:[]})});
  const rootNode = new Element('root'); rootNode.connected = true;
  bridge.render(rootNode);
  await flush();
  assert.equal(nodes(rootNode, 'a').length, 0);
  assert.equal(nodes(rootNode, 'button').length, 0);
  assert.equal(saves.length, 0);
  const other = environment();
  other.bridge.init({blank:() => true,get:other.state,save:() => { throw Error('Must not save'); }});
  assert.equal(other.bridge.render(rootNode), undefined);
  assert.equal(other.requests.length, 0);
});
